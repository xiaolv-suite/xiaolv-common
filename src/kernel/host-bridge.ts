// 宿主隔离层（纯化下沉）
// 集中管理选区提取、文档路径解析、多端环境识别与 Electron 窗口最小化等宿主底层交互。
// 零反向依赖上层业务与 UI，100% 具备无 DOM/SSR/单测降级容错。
import * as siyuan from "siyuan";
import {isMobileFrontend} from "../libs/lv-notice-kit";

export interface SelectionInfo {
    text: string;
    blockId: string | null;
}

export interface DocPathInfo {
    title: string;
    path: string;
}

/**
 * 官方选区提取：纯文本 + 当前块 ID（仅依赖公开的 data-node-id，见 ADR 0003）
 * 当处于光标折叠态 (isCollapsed=true) 时，选区文本为空，但依然能够稳定读取光标所在物理块的 blockId。
 */
export function getSelectionInfo(): SelectionInfo {
    if (typeof window === "undefined") return {text: "", blockId: null};
    try {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return {text: "", blockId: null};
        const text = sel.isCollapsed ? "" : sel.toString();
        let node: Node | null = sel.anchorNode;
        while (node && !(node instanceof Element)) node = node.parentNode;
        const el = node as Element | null;
        const block = el?.closest?.("[data-node-id]") as HTMLElement | null;
        return {text, blockId: block?.getAttribute("data-node-id") ?? null};
    } catch {
        return {text: "", blockId: null};
    }
}

/**
 * 获取当前选区的去除首尾空白字符的纯文本内容。
 */
export function getSelectionText(): string {
    if (typeof window === "undefined") return "";
    try {
        const sel = window.getSelection();
        return sel ? sel.toString().trim() : "";
    } catch {
        return "";
    }
}

/**
 * 文档层级路径解析：从 "/notebook/folder/docTitle" 提取纯标题与完整路径。
 */
export function parseDocPath(path: string | null | undefined): DocPathInfo {
    if (!path || typeof path !== "string") return {title: "", path: ""};
    const segments = path.split("/").filter(Boolean);
    const title = segments.pop() ?? path;
    return {title, path};
}

/**
 * 根据是否为资产中枢笔记本计算目标文档的标准人读路径 (HPath)。
 */
export function resolveTargetHPath(docTitle: string, isHubNb = false): string {
    const cleanTitle = (docTitle || "").trim();
    return isHubNb ? `/07-小驴常用/${cleanTitle}` : `/${cleanTitle}`;
}

/**
 * 统一移动端宿主判定：优先结合思源官方 getFrontend()（"mobile" | "browser-mobile"）
 * 与生态标准库 isMobileFrontend()，同时兼容思源 3.8.x window.siyuan.mobile 对象形态、
 * #mobileTopBar 节点以及 body--mobile 类名；桌面单测环境保持返回 false。
 */
export function detectMobileHost(): boolean {
    try {
        const getFn = (siyuan as unknown as {getFrontend?: () => string}).getFrontend;
        if (typeof getFn === "function") {
            const frontend = getFn();
            if (frontend === "mobile" || frontend === "browser-mobile") return true;
        }
    } catch {
        // ignore
    }
    if (isMobileFrontend()) return true;
    try {
        const winMobile = typeof window !== "undefined"
            ? (window as unknown as {siyuan?: {mobile?: unknown}}).siyuan?.mobile
            : undefined;
        if (winMobile === true || (typeof winMobile === "object" && winMobile !== null)) return true;
    } catch {
        // ignore
    }
    try {
        if (typeof document !== "undefined") {
            if (typeof document.getElementById === "function" && document.getElementById("mobileTopBar")) return true;
            if (document.body?.classList?.contains?.("body--mobile")) return true;
        }
    } catch {
        // ignore
    }
    return false;
}

/**
 * 安全退回后台 / 窗口最小化：在 Electron 桌面端优先触发原生窗口 minimize()，
 * 纯浏览器端安全回退至 window.blur()，提供完整的防抛错沙箱防护。
 */
export function minimizeToBackground(): boolean {
    try {
        if (typeof window !== "undefined" && (window as any).require) {
            const electron = (window as any).require("electron");
            const win = electron?.remote?.getCurrentWindow?.();
            if (win && typeof win.minimize === "function") {
                win.minimize();
                return true;
            }
        }
    } catch {
        // ignore
    }
    if (typeof window !== "undefined" && typeof window.blur === "function") {
        try {
            window.blur();
            return true;
        } catch {
            // ignore
        }
    }
    return false;
}
