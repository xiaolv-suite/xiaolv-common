// 导出安全脱敏配置弹窗（ADR 0083 / G31 / T-0143）
// 支持在打包导出 (JSON bundle) 或导出 Markdown 时微调脱敏策略

import type {SanitizerOptions, SanitizeMode} from "../model/export-sanitizer";
import {escapeHtml} from "../model/clipboard";
import {adaptSecondaryDialogForMobile, getDialogBody, isMobileDialogViewport, mountPlatformDialogTitleWrap} from "./dialog-dom";
import {Dialog} from "siyuan";

export interface SanitizerModalProps {
    initialOptions?: SanitizerOptions;
    onConfirm?: (options: SanitizerOptions) => void;
    onCancel?: () => void;
}

export interface SanitizerModalResult {
    element: any;
    getOptions: () => SanitizerOptions;
    close?: () => void;
}

class MockElement {
    tagName: string;
    classList: {
        add: (...cls: string[]) => void;
        contains: (cls: string) => boolean;
        remove: (...cls: string[]) => void;
    };
    private _classes: Set<string> = new Set();
    innerHTML: string = "";
    listeners: Record<string, Array<() => void>> = {};
    children: MockElement[] = [];
    value: string = "";
    checked: boolean = false;

    constructor(tagName: string = "div") {
        this.tagName = tagName.toUpperCase();
        this.classList = {
            add: (...cls: string[]) => cls.forEach((c) => this._classes.add(c)),
            contains: (cls: string) => this._classes.has(cls),
            remove: (...cls: string[]) => cls.forEach((c) => this._classes.delete(c)),
        };
    }

    addEventListener(event: string, fn: () => void) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(fn);
    }

    click() {
        if (this.listeners["click"]) {
            this.listeners["click"].forEach((fn) => fn());
        }
    }

    querySelector(selector: string): MockElement | null {
        const cls = selector.replace(/^\./, "");
        if (this.classList.contains(cls)) return this;
        for (const child of this.children) {
            const res = child.querySelector(selector);
            if (res) return res;
        }
        return null;
    }
}

/**
 * 构造导出脱敏配置弹窗 UI 容器
 */
export function renderSanitizerOptionsModal(props: SanitizerModalProps): SanitizerModalResult {
    const initial = props.initialOptions || {};
    const mode: SanitizeMode = initial.mode ?? "mask";
    const sanitizePhones = initial.sanitizePhones !== false;
    const sanitizeEmails = initial.sanitizeEmails !== false;
    const sanitizeIdCards = initial.sanitizeIdCards !== false;
    const sanitizeTokens = initial.sanitizeTokens !== false;
    const customReplacements = initial.customReplacements || {};

    const customText = Object.entries(customReplacements)
        .map(([k, v]) => `${k}=${v}`)
        .join("\n");

    const htmlContent = `
        <div class="b3-dialog__header xlc-export-sanitizer-header">
            <div class="b3-dialog__title xlc-form-title">导出安全脱敏选项</div>
        </div>
        <div class="xlc-export-sanitizer-form xlc-form">
            <div class="b3-label">
                <div class="fn__flex">
                    <span class="fn__flex-1 xlc-form-label">脱敏策略模式</span>
                    <select class="b3-select xlc-export-sanitizer-mode" aria-label="脱敏策略模式">
                        <option value="mask" ${mode === "mask" ? "selected" : ""}>掩码替换 (例如 138****0000)</option>
                        <option value="placeholder" ${mode === "placeholder" ? "selected" : ""}>变量化占位符 (例如 {{xlc:ask:手机号}})</option>
                    </select>
                </div>
            </div>
            <label class="b3-label fn__flex xlc-sanitizer-checkbox-row">
                <span class="fn__flex-1 xlc-form-label">过滤大陆 11 位手机号码</span>
                <input type="checkbox" class="b3-switch xlc-export-sanitizer-phone" aria-label="过滤大陆 11 位手机号码" ${sanitizePhones ? "checked" : ""} />
            </label>
            <label class="b3-label fn__flex xlc-sanitizer-checkbox-row">
                <span class="fn__flex-1 xlc-form-label">过滤电子邮箱地址</span>
                <input type="checkbox" class="b3-switch xlc-export-sanitizer-email" aria-label="过滤电子邮箱地址" ${sanitizeEmails ? "checked" : ""} />
            </label>
            <label class="b3-label fn__flex xlc-sanitizer-checkbox-row">
                <span class="fn__flex-1 xlc-form-label">过滤 18 位身份证号码</span>
                <input type="checkbox" class="b3-switch xlc-export-sanitizer-idcard" aria-label="过滤 18 位身份证号码" ${sanitizeIdCards ? "checked" : ""} />
            </label>
            <label class="b3-label fn__flex xlc-sanitizer-checkbox-row">
                <span class="fn__flex-1 xlc-form-label">过滤 API 密钥与 Bearer Token</span>
                <input type="checkbox" class="b3-switch xlc-export-sanitizer-token" aria-label="过滤 API 密钥与 Bearer Token" ${sanitizeTokens ? "checked" : ""} />
            </label>
            <div class="b3-label xlc-sanitizer-custom-block">
                <span class="xlc-form-label">自定义字面替换词典（每行 原始词=替换词）</span>
                <textarea class="b3-text-field fn__block xlc-export-sanitizer-custom" rows="3" aria-label="自定义字面替换词典" placeholder="内部IP=10.0.0.x&#10;核心客户=保密客户">${escapeHtml(customText)}</textarea>
            </div>
        </div>
        <div class="b3-dialog__action xlc-form-actions xlc-export-sanitizer-actions" role="toolbar" aria-label="脱敏选项操作栏">
            <button class="b3-button b3-button--cancel" aria-label="取消脱敏设置">取消</button>
            <button class="b3-button b3-button--primary xlc-btn-primary" aria-label="保存脱敏配置">保存脱敏配置</button>
        </div>
    `;

    if (typeof document !== "undefined") {
        const container = document.createElement("div");
        // R433：此元素是嵌在外层弹窗 body 内的内层容器，严禁复用 .b3-dialog__container——
        // 宿主会对其再次施加 max-height:80vh + overflow:hidden，内容超高即被裁、按钮够不到
        container.className = "xlc-export-sanitizer-modal";
        container.innerHTML = htmlContent;

        const parseOptions = (): SanitizerOptions => {
            const modeSelect = container.querySelector(".xlc-export-sanitizer-mode") as HTMLSelectElement | null;
            const phoneCheck = container.querySelector(".xlc-export-sanitizer-phone") as HTMLInputElement | null;
            const emailCheck = container.querySelector(".xlc-export-sanitizer-email") as HTMLInputElement | null;
            const idcardCheck = container.querySelector(".xlc-export-sanitizer-idcard") as HTMLInputElement | null;
            const tokenCheck = container.querySelector(".xlc-export-sanitizer-token") as HTMLInputElement | null;
            const customArea = container.querySelector(".xlc-export-sanitizer-custom") as HTMLTextAreaElement | null;

            const customMap: Record<string, string> = {};
            if (customArea && customArea.value) {
                for (const line of customArea.value.split("\n")) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed.startsWith("#")) continue;
                    const eqIdx = trimmed.indexOf("=");
                    if (eqIdx > 0) {
                        const k = trimmed.slice(0, eqIdx).trim();
                        const v = trimmed.slice(eqIdx + 1).trim();
                        if (k) customMap[k] = v;
                    }
                }
            }

            return {
                mode: (modeSelect?.value as SanitizeMode) || "mask",
                sanitizePhones: phoneCheck?.checked ?? true,
                sanitizeEmails: emailCheck?.checked ?? true,
                sanitizeIdCards: idcardCheck?.checked ?? true,
                sanitizeTokens: tokenCheck?.checked ?? true,
                customReplacements: customMap,
            };
        };

        const cancelBtn = container.querySelector(".b3-button--cancel");
        cancelBtn?.addEventListener("click", () => {
            props.onCancel?.();
        });

        let confirmed = false;
        const confirmBtn = container.querySelector(".b3-button--primary") as HTMLButtonElement | null;
        const doConfirm = () => {
            if (confirmed) return;
            confirmed = true;
            const opts = parseOptions();
            props.onConfirm?.(opts);
        };
        confirmBtn?.addEventListener("click", doConfirm);

        container.addEventListener("keydown", (e) => {
            if (e.isComposing || (e as KeyboardEvent).keyCode === 229) return;
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                if (e.repeat) return;
                e.preventDefault();
                doConfirm();
            }
        });

        const actionsToolbar = container.querySelector(".xlc-export-sanitizer-actions");
        actionsToolbar?.addEventListener("keydown", (e: any) => {
            const buttons = [cancelBtn, confirmBtn].filter((b): b is HTMLButtonElement => Boolean(b && !(b as HTMLButtonElement).disabled));
            if (buttons.length <= 1) return;
            const curIdx = buttons.indexOf(document.activeElement as HTMLButtonElement);
            if (curIdx === -1) return;
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                buttons[(curIdx + 1) % buttons.length]?.focus();
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                buttons[(curIdx - 1 + buttons.length) % buttons.length]?.focus();
            } else if (e.key === "Home") {
                e.preventDefault();
                buttons[0]?.focus();
            } else if (e.key === "End") {
                e.preventDefault();
                buttons[buttons.length - 1]?.focus();
            }
        });

        return {
            element: container,
            getOptions: parseOptions,
            close: () => {
                props.onCancel?.();
            },
        };
    }

    // Node.js / Headless 测试环境
    const mockContainer = new MockElement("div");
    mockContainer.classList.add("b3-dialog__container", "xlc-export-sanitizer-modal");
    mockContainer.innerHTML = htmlContent;

    const cancelBtn = new MockElement("button");
    cancelBtn.classList.add("b3-button", "b3-button--cancel");
    cancelBtn.addEventListener("click", () => {
        props.onCancel?.();
    });
    mockContainer.children.push(cancelBtn);

    let currentOpts: SanitizerOptions = {
        mode,
        sanitizePhones,
        sanitizeEmails,
        sanitizeIdCards,
        sanitizeTokens,
        customReplacements,
    };

    const confirmBtn = new MockElement("button");
    confirmBtn.classList.add("b3-button", "b3-button--text", "b3-button--primary");
    confirmBtn.addEventListener("click", () => {
        props.onConfirm?.(currentOpts);
    });
    mockContainer.children.push(confirmBtn);

    return {
        element: mockContainer,
        getOptions: () => currentOpts,
        close: () => {
            props.onCancel?.();
        },
    };
}

/** 快捷打开独立脱敏配置弹窗 */
export function openSanitizerOptionsDialog(
    initialOptions?: SanitizerOptions,
    onConfirm?: (options: SanitizerOptions) => void,
): Dialog | null {
    if (typeof Dialog === "undefined") return null;
    const isMobileModal = isMobileDialogViewport();
    let dialog: Dialog;
    try {
        dialog = new Dialog({
            title: "导出安全脱敏选项",
            content: "",
            width: isMobileModal ? "100vw" : "min(560px, 92vw)",
            height: isMobileModal ? "100dvh" : "min(640px, 86vh)",
        });
    } catch {
        return null;
    }
    const container = dialog.element.querySelector(".b3-dialog__container");
    container?.classList.add("xlc-form-host", "xlc-settings-host");
    mountPlatformDialogTitleWrap(dialog.element, "导出安全脱敏选项");
    adaptSecondaryDialogForMobile(dialog, "关闭");
    const body = getDialogBody(dialog.element);
    if (!body) return dialog;
    body.innerHTML = "";

    const modal = renderSanitizerOptionsModal({
        initialOptions,
        onConfirm: (opts) => {
            dialog.destroy();
            onConfirm?.(opts);
        },
        onCancel: () => {
            dialog.destroy();
        },
    });
    body.appendChild(modal.element as HTMLElement);
    const innerHeader = body.querySelector(".xlc-export-sanitizer-header") as HTMLElement | null;
    if (innerHeader) innerHeader.style.display = "none";
    return dialog;
}
