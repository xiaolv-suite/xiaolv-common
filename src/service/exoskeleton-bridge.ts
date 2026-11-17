/**
 * 思源外骨骼 · 桌面宿主协作桥
 * 通过外骨骼写在工作区根目录的 .xiaolv-bridge.json 获得本地端口与令牌，实现罗盘磁贴免配置唤起与在线状态轮询。
 * 任何一步失败都静默降级到自定义协议 siyuan-exoskeleton://，绝不向调用方抛出异常。
 */

const BRIDGE_FILE_NAME = ".xiaolv-bridge.json";
const BRIDGE_CACHE_MS = 60_000;
const STATUS_CACHE_MS = 8_000;
const REQUEST_TIMEOUT_MS = 1_500;

export interface ExoskeletonBridgeConfig {
    port: number;
    token: string;
    exe?: string;
    version?: string;
    launchWithSiYuan?: boolean;
    exitWithSiYuan?: boolean;
}

export interface ExoskeletonStatus {
    online: boolean;
    version?: string;
    siyuanConnected?: boolean;
    port?: number;
}

let cachedConfig: ExoskeletonBridgeConfig | null = null;
let cachedConfigAt = 0;
let cachedStatus: ExoskeletonStatus = { online: false };
let cachedStatusAt = 0;
let launchAttempted = false;

function safeRequire<T = any>(moduleName: string): T | null {
    try {
        const g = globalThis as any;
        const req = typeof g.require === "function" ? g.require : (g.window && typeof g.window.require === "function" ? g.window.require : null);
        if (typeof req === "function") return req(moduleName) as T;
    } catch { /* 浏览器环境无 Node */ }
    return null;
}

function normalizeConfig(raw: string | null | undefined): ExoskeletonBridgeConfig | null {
    const text = (raw ?? "").trim();
    if (!text || text[0] !== "{") return null;
    try {
        const parsed = JSON.parse(text) as Record<string, unknown>;
        if (parsed.app !== "siyuan-exoskeleton") return null;
        const port = Number(parsed.port);
        const token = typeof parsed.token === "string" ? parsed.token : "";
        if (!Number.isFinite(port) || port <= 0 || port > 65535 || !token) return null;
        return {
            port,
            token,
            exe: typeof parsed.exe === "string" ? parsed.exe : undefined,
            version: typeof parsed.version === "string" ? parsed.version : undefined,
            launchWithSiYuan: parsed.launchWithSiYuan === true,
            exitWithSiYuan: parsed.exitWithSiYuan === true,
        };
    } catch {
        return null;
    }
}

function readConfigFromNode(): string | null {
    const fs = safeRequire<any>("fs");
    const path = safeRequire<any>("path");
    const workspace = (typeof window !== "undefined" ? (window as any)?.siyuan?.config?.system?.workspaceDir : "") || "";
    if (!fs || !path || !workspace) return null;
    try {
        const target = path.join(workspace, BRIDGE_FILE_NAME);
        if (!fs.existsSync(target)) return null;
        return fs.readFileSync(target, "utf8");
    } catch {
        return null;
    }
}

async function readConfigFromKernel(): Promise<string | null> {
    try {
        const res = await fetch("/api/file/getFile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: BRIDGE_FILE_NAME }),
        });
        const text = await res.text();
        return text || null;
    } catch {
        return null;
    }
}

async function loadConfig(force = false): Promise<ExoskeletonBridgeConfig | null> {
    if (!force && cachedConfig && Date.now() - cachedConfigAt < BRIDGE_CACHE_MS) return cachedConfig;

    let config = normalizeConfig(readConfigFromNode());
    if (!config) config = normalizeConfig(await readConfigFromKernel());

    cachedConfig = config;
    cachedConfigAt = Date.now();
    return config;
}

async function requestJson<T>(config: ExoskeletonBridgeConfig, path: string, init?: RequestInit): Promise<T | null> {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = controller ? setTimeout(() => { try { controller.abort(); } catch { /* ignore */ } }, REQUEST_TIMEOUT_MS) : null;
    try {
        const res = await fetch(`http://127.0.0.1:${config.port}${path}`, {
            ...init,
            signal: controller ? controller.signal : undefined,
            headers: {
                "Content-Type": "application/json",
                "X-Token": config.token,
                ...(init?.headers || {}),
            },
        });
        if (!res.ok) return null;
        return (await res.json()) as T;
    } catch {
        return null;
    } finally {
        if (timer) clearTimeout(timer);
    }
}

/** 轮询 /status：判断外骨骼是否在线；无桥文件时视为未安装/未启用 */
export async function probeExoskeleton(force = false): Promise<ExoskeletonStatus> {
    if (!force && Date.now() - cachedStatusAt < STATUS_CACHE_MS) return cachedStatus;

    const config = await loadConfig();
    if (!config) {
        cachedStatus = { online: false };
        cachedStatusAt = Date.now();
        return cachedStatus;
    }

    const res = await requestJson<{ code?: number; version?: string; siyuan_connected?: boolean; port?: number }>(config, "/status");
    if (!res || res.code !== 0) {
        cachedConfig = null;
        cachedConfigAt = 0;
        cachedStatus = { online: false };
    } else {
        cachedStatus = {
            online: true,
            version: res.version,
            siyuanConnected: res.siyuan_connected === true,
            port: res.port ?? config.port,
        };
    }
    cachedStatusAt = Date.now();
    return cachedStatus;
}

/** 通过 Electron shell 拉起自定义协议（SiYuan 桌面端可用），失败时退化为 window.open */
export function openExoskeletonProtocol(cmd?: string): boolean {
    const url = cmd ? `siyuan-exoskeleton://open?cmd=${encodeURIComponent(cmd)}` : "siyuan-exoskeleton://open";
    const shell = safeRequire<any>("electron")?.shell;
    if (shell && typeof shell.openExternal === "function") {
        try {
            shell.openExternal(url).catch(() => { /* 协议未注册 */ });
            return true;
        } catch { /* ignore */ }
    }
    try {
        window.open(url, "_blank");
        return true;
    } catch {
        return false;
    }
}

/** 唤起外骨骼工作面板：优先 HTTP（免焦点切换），失败走协议 */
export async function openExoskeletonWorkbench(): Promise<boolean> {
    const config = await loadConfig();
    if (config) {
        const res = await requestJson<{ code?: number }>(config, "/api/workbench", { method: "GET" });
        if (res && res.code === 0) return true;
    }
    return openExoskeletonProtocol();
}

/** 触发外骨骼动作（速记 / 划笔 / 搜块 / 待办），HTTP 不可用时自动走协议 */
export async function runExoskeletonAction(cmd: "SYS" | "SYPEN" | "SYF" | "SYTODO"): Promise<boolean> {
    const config = await loadConfig();
    if (config) {
        const res = await requestJson<{ code?: number }>(config, "/api/action", {
            method: "POST",
            body: JSON.stringify({ cmd }),
        });
        if (res && res.code === 0) return true;
    }
    return openExoskeletonProtocol(cmd);
}

/** 思源启动时按桥文件开关自动拉起外骨骼（仅桌面端、仅一次、已在线则跳过） */
export async function maybeLaunchExoskeleton(): Promise<void> {
    if (launchAttempted) return;
    launchAttempted = true;
    try {
        const config = await loadConfig();
        if (!config || !config.launchWithSiYuan || !config.exe) return;
        const status = await probeExoskeleton(true);
        if (status.online) return;
        const childProcess = safeRequire<any>("child_process");
        if (!childProcess || typeof childProcess.spawn !== "function") return;
        const child = childProcess.spawn(config.exe, [], { detached: true, stdio: "ignore" });
        if (child && typeof child.unref === "function") child.unref();
    } catch { /* 静默降级 */ }
}
