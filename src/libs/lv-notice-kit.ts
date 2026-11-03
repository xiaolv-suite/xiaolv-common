/**
 * 小驴全生态统一通知套件 · 标准核心库 (Lv Ecosystem Unified Notice Kit)
 * Epoch 7 Standard · Protocol v1.0.0
 *
 * 核心设计哲学：
 * 1. 绝对去中心化自协商：零强依赖任何单一插件，首个加载的插件自举为 Coordinator，更高版本自动热替换，插件卸载无缝交棒；
 * 2. 极致克制防打扰：三段式渐进降噪（原位微动效 -> 瞬时微胶囊 -> 交互卡片 -> 静默入库），内置稍后提醒与今日免打扰；
 * 3. 全端自适应与现代化视觉：桌面端右下角 3D 悬浮毛玻璃层叠，手机端顶部灵动避让胶囊（支持上滑手势抛走），深度适配思源原生暗黑/明亮主题；
 * 4. 零外部 npm 依赖：单个独立 .ts 文件，复制即可在任何小驴插件内使用。
 */

/* ========================================================================= */
/* 1. 类型定义与协议信封                                                     */
/* ========================================================================= */

export type LvNoticeLevel = "info" | "success" | "warn" | "error";

export interface LvNoticeAction {
    label: string;
    primary?: boolean;
    onClick?: () => void | Promise<void>;
    /** 点击后是否自动收起通知，默认 true */
    dismissAfterClick?: boolean;
}

export interface LvNoticeSnoozeOption {
    label: string;
    /** 延期时长（毫秒），如 15 * 60 * 1000 */
    durationMs?: number;
    /** 是否作为“今日免打扰” */
    muteToday?: boolean;
}

export interface CardNoticeOptions {
    /** 来源插件标识：如 "打卡" | "雷切" | "管家" | "拾遗" | "考试" | "闪卡" | "快门" 等 */
    source?: string;
    /** 分类标识：如 "daily-reminder" | "sync" | "export"，用于免打扰比对与同类聚合 */
    category?: string;
    /** 标题（可选，通常为简洁的业务动作，如“每日提醒”、“导出完成”） */
    title?: string;
    /** 正文提示内容（建议控制在两行以内） */
    message: string;
    /** 级别：默认 "info" */
    level?: LvNoticeLevel;
    /** 停留毫秒数，默认 8000ms；0 为常驻不自动关闭（error 默认为 0） */
    duration?: number;
    /** 交互按钮列表（最多 3 个） */
    actions?: LvNoticeAction[];
    /** 延期与免打扰选项 */
    snooze?: {
        options?: LvNoticeSnoozeOption[];
    };
    /** 手动或自动关闭时的回调 */
    onDismiss?: () => void;
}

export interface CapsuleNoticeOptions {
    source?: string;
    message: string;
    level?: LvNoticeLevel;
    /** 停留时长，默认 2500ms */
    duration?: number;
}

export interface SilentNoticeOptions {
    source?: string;
    category?: string;
    message: string;
    level?: LvNoticeLevel;
}

export interface LvNoticePacket extends CardNoticeOptions {
    id: string;
    mode: "card" | "capsule" | "silent";
    createdAt: number;
    repeatCount: number;
}

/* ========================================================================= */
/* 2. 全局单例接口与自协商常量                                               */
/* ========================================================================= */

const PROTOCOL_VERSION = 100; // 1.0.0
const STORAGE_PREFIX = "lv_notice_mute_";

interface LvNoticeHub {
    version: number;
    hostPlugin: string;
    post: (packet: LvNoticePacket) => void;
    dismiss: (id: string) => void;
    snooze: (id: string, durationMs: number) => void;
    muteToday: (category: string) => void;
    isMutedToday: (category: string) => boolean;
    getHistory: () => LvNoticePacket[];
    registerPlugin: (name: string, onRelinquish: () => void) => () => void;
    relinquish: (name: string) => void;
    destroy: () => void;
}

declare global {
    interface Window {
        __LV_NOTICE_HUB__?: LvNoticeHub;
    }
}

/* ========================================================================= */
/* 3. 自包含现代 CSS 样式（毛玻璃 + 微悬浮 + 移动端自适应）                 */
/* ========================================================================= */

const STYLES = `
#lv-notice-host {
    position: fixed;
    right: 20px;
    bottom: 24px;
    z-index: 220;
    pointer-events: none;
    font-family: var(--b3-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
}

/* 桌面端卡片容器与 3D 微层叠 */
.lv-notice-card {
    pointer-events: auto;
    width: min(380px, calc(100vw - 32px));
    box-sizing: border-box;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--b3-theme-surface, rgba(255, 255, 255, 0.92));
    border: 1px solid var(--b3-theme-surface-lighter, rgba(128, 128, 128, 0.18));
    box-shadow: 0 10px 28px -4px rgba(0, 0, 0, 0.14), 0 2px 8px -1px rgba(0, 0, 0, 0.05);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    color: var(--b3-theme-on-surface, #202124);
    font-size: 13px;
    line-height: 1.45;
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
    position: relative;
    overflow: hidden;
}

.lv-notice-card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 3.5px;
    background: var(--b3-theme-primary, #4285f4);
    border-top-left-radius: 12px;
    border-bottom-left-radius: 12px;
}
.lv-notice-card[data-level="error"]::before { background: var(--b3-theme-error, #d93025); }
.lv-notice-card[data-level="warn"]::before { background: #f2994a; }
.lv-notice-card[data-level="success"]::before { background: #27ae60; }

.lv-notice-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
}

.lv-notice-source-badge {
    font-size: 10.5px;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 6px;
    background: var(--b3-theme-surface-lighter, rgba(0,0,0,0.06));
    color: var(--b3-theme-primary, #4285f4);
    line-height: 1.4;
    white-space: nowrap;
}

.lv-notice-title {
    font-weight: 600;
    font-size: 13px;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--b3-theme-on-surface, #202124);
}

.lv-notice-repeat {
    font-size: 10px;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 10px;
    background: var(--b3-theme-primary, #4285f4);
    color: #fff;
}

.lv-notice-close-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 2px 4px;
    margin: -2px -2px 0 0;
    color: var(--b3-theme-on-surface-light, #5f6368);
    font-size: 14px;
    line-height: 1;
    border-radius: 4px;
    transition: background 0.15s ease;
}
.lv-notice-close-btn:hover {
    background: var(--b3-theme-surface-lighter, rgba(0,0,0,0.08));
    color: var(--b3-theme-on-surface, #202124);
}

.lv-notice-body {
    font-size: 12.5px;
    color: var(--b3-theme-on-surface, #3c4043);
    margin-bottom: 8px;
    word-break: break-word;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.lv-notice-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
}

.lv-notice-btn {
    border: none;
    cursor: pointer;
    font-size: 11.5px;
    font-weight: 500;
    padding: 4px 10px;
    border-radius: 6px;
    background: var(--b3-theme-surface-lighter, rgba(0,0,0,0.06));
    color: var(--b3-theme-on-surface, #202124);
    transition: background 0.15s ease, transform 0.1s ease;
}
.lv-notice-btn:hover {
    background: var(--b3-theme-surface-lighter, rgba(0,0,0,0.12));
}
.lv-notice-btn:active {
    transform: scale(0.97);
}
.lv-notice-btn--primary {
    background: var(--b3-theme-primary, #4285f4);
    color: #ffffff;
}
.lv-notice-btn--primary:hover {
    filter: brightness(1.08);
}

/* 瞬时极简微胶囊 (Capsule) */
.lv-notice-capsule {
    pointer-events: auto;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 20px;
    background: var(--b3-theme-surface, rgba(255, 255, 255, 0.95));
    border: 1px solid var(--b3-theme-surface-lighter, rgba(128, 128, 128, 0.18));
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    backdrop-filter: blur(16px);
    font-size: 12px;
    color: var(--b3-theme-on-surface, #202124);
    animation: lvNoticeFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

/* 原位微动效 Inline Feedback */
@keyframes lvInlinePop {
    0% { transform: scale(1); }
    40% { transform: scale(1.12); }
    100% { transform: scale(1); }
}
.lv-inline-feedback-active {
    animation: lvInlinePop 0.3s ease-out !important;
}
.lv-inline-feedback--success {
    color: #27ae60 !important;
    border-color: #27ae60 !important;
}
.lv-inline-feedback--error {
    color: #d93025 !important;
    border-color: #d93025 !important;
}

/* 移动端 / 窄屏适配：自适应切换为顶部灵动微条 */
@media (max-width: 640px) {
    #lv-notice-host {
        right: 0;
        left: 0;
        top: max(10px, env(safe-area-inset-top, 10px));
        bottom: auto;
        align-items: center;
        padding: 0 12px;
    }
    .lv-notice-card {
        width: 100%;
        max-width: 380px;
        box-shadow: 0 6px 20px rgba(0,0,0,0.16);
    }
}

@keyframes lvNoticeFadeIn {
    from { opacity: 0; transform: translateY(8px) scale(0.96); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}
`;

function ensureStyles(): void {
    if (typeof document === "undefined") return;
    const styleId = "lv-notice-styles";
    if (document.getElementById(styleId)) return;
    const styleEl = document.createElement("style");
    styleEl.id = styleId;
    styleEl.textContent = STYLES;
    document.head.appendChild(styleEl);
}

/* ========================================================================= */
/* 4. Coordinator 核心实现（自协商单例与 UI 挂载）                           */
/* ========================================================================= */

function getTodayKey(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function createCoordinator(initialPlugin: string): LvNoticeHub {
    ensureStyles();

    let hostEl = document.getElementById("lv-notice-host");
    if (!hostEl) {
        hostEl = document.createElement("div");
        hostEl.id = "lv-notice-host";
        hostEl.setAttribute("role", "region");
        hostEl.setAttribute("aria-label", "小驴通知中心");
        document.body.appendChild(hostEl);
    }

    const activePackets: LvNoticePacket[] = [];
    const historyList: LvNoticePacket[] = [];
    const timers = new Map<string, number>();
    const pluginRegistry = new Map<string, () => void>();

    // 键盘 Esc 秒关顶层卡片
    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && activePackets.length > 0) {
            const topPacket = activePackets[activePackets.length - 1];
            if (topPacket) hub.dismiss(topPacket.id);
        }
    };
    window.addEventListener("keydown", onKeyDown);

    function render() {
        if (!hostEl) return;
        hostEl.innerHTML = "";

        // 仅展示最新 3 条，最顶层聚焦展示
        const visible = activePackets.slice(-3);
        visible.forEach((packet) => {
            const card = document.createElement("div");
            card.className = packet.mode === "capsule" ? "lv-notice-capsule" : "lv-notice-card";
            card.dataset.id = packet.id;
            card.dataset.level = packet.level || "info";

            if (packet.mode === "capsule") {
                card.innerHTML = `
                    <span class="lv-notice-source-badge">${escapeHtml(packet.source || "提示")}</span>
                    <span>${escapeHtml(packet.message)}</span>
                `;
            } else {
                // Card 模式
                const actionsHtml = (packet.actions || []).map((act, idx) => `
                    <button type="button" class="lv-notice-btn ${act.primary ? "lv-notice-btn--primary" : ""}" data-action-idx="${idx}">
                        ${escapeHtml(act.label)}
                    </button>
                `).join("");

                const snoozeHtml = (packet.snooze?.options || []).map((opt, sIdx) => `
                    <button type="button" class="lv-notice-btn" data-snooze-idx="${sIdx}">
                        ${escapeHtml(opt.label)}
                    </button>
                `).join("");

                card.innerHTML = `
                    <div class="lv-notice-header">
                        <span class="lv-notice-source-badge">${escapeHtml(packet.source || "小驴")}</span>
                        <span class="lv-notice-title">${escapeHtml(packet.title || "")}</span>
                        ${packet.repeatCount > 1 ? `<span class="lv-notice-repeat">×${packet.repeatCount}</span>` : ""}
                        <button type="button" class="lv-notice-close-btn" data-role="close" aria-label="关闭">✕</button>
                    </div>
                    <div class="lv-notice-body">${escapeHtml(packet.message)}</div>
                    ${actionsHtml || snoozeHtml ? `<div class="lv-notice-actions">${actionsHtml}${snoozeHtml}</div>` : ""}
                `;

                // 绑定按钮事件
                card.querySelector('[data-role="close"]')?.addEventListener("click", () => {
                    hub.dismiss(packet.id);
                });

                card.querySelectorAll("[data-action-idx]").forEach((btn) => {
                    btn.addEventListener("click", async () => {
                        const idx = parseInt(btn.getAttribute("data-action-idx") || "0", 10);
                        const act = packet.actions?.[idx];
                        if (act?.onClick) {
                            try { await act.onClick(); } catch (err) { console.error("[LvNotice] action error", err); }
                        }
                        if (act?.dismissAfterClick !== false) {
                            hub.dismiss(packet.id);
                        }
                    });
                });

                card.querySelectorAll("[data-snooze-idx]").forEach((btn) => {
                    btn.addEventListener("click", () => {
                        const sIdx = parseInt(btn.getAttribute("data-snooze-idx") || "0", 10);
                        const opt = packet.snooze?.options?.[sIdx];
                        if (opt?.muteToday && packet.category) {
                            hub.muteToday(packet.category);
                            hub.dismiss(packet.id);
                        } else if (opt?.durationMs) {
                            hub.snooze(packet.id, opt.durationMs);
                        } else {
                            hub.dismiss(packet.id);
                        }
                    });
                });
            }

            // 移动端 Touch 上滑手势支持 (Swipe Up to Dismiss)
            let touchStartY = 0;
            card.addEventListener("touchstart", (e) => {
                touchStartY = e.touches[0]?.clientY ?? 0;
            }, { passive: true });
            card.addEventListener("touchend", (e) => {
                const clientY = e.changedTouches[0]?.clientY ?? touchStartY;
                const diffY = clientY - touchStartY;
                if (diffY < -40) { // 上滑超过 40px
                    hub.dismiss(packet.id);
                }
            }, { passive: true });

            hostEl?.appendChild(card);
        });
    }

    const hub: LvNoticeHub = {
        version: PROTOCOL_VERSION,
        hostPlugin: initialPlugin,

        post(packet: LvNoticePacket) {
            // 免打扰判定
            if (packet.category && this.isMutedToday(packet.category)) {
                return;
            }

            // 静默入库模式
            if (packet.mode === "silent") {
                historyList.unshift(packet);
                if (historyList.length > 100) historyList.pop();
                return;
            }

            // 同类/相同内容 3 秒节流聚合
            const existing = activePackets.find((p) =>
                (packet.category && p.category === packet.category) ||
                (p.message === packet.message && p.source === packet.source)
            );

            if (existing) {
                existing.repeatCount += 1;
                existing.message = packet.message;
                existing.createdAt = Date.now();
                render();
                return;
            }

            // 新增通知
            activePackets.push(packet);
            historyList.unshift(packet);
            if (historyList.length > 100) historyList.pop();
            render();

            // 超时定时器
            const duration = packet.duration ?? (packet.level === "error" ? 0 : 8000);
            if (duration > 0) {
                const t = window.setTimeout(() => {
                    this.dismiss(packet.id);
                }, duration);
                timers.set(packet.id, t);
            }
        },

        dismiss(id: string) {
            const idx = activePackets.findIndex((p) => p.id === id);
            if (idx >= 0) {
                const [removed] = activePackets.splice(idx, 1);
                if (timers.has(id)) {
                    clearTimeout(timers.get(id));
                    timers.delete(id);
                }
                removed?.onDismiss?.();
                render();
            }
        },

        snooze(id: string, durationMs: number) {
            const item = activePackets.find((p) => p.id === id);
            if (!item) return;
            this.dismiss(id);
            setTimeout(() => {
                this.post({
                    ...item,
                    id: `snoozed_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                    createdAt: Date.now(),
                    title: item.title ? `[稍后提醒] ${item.title}` : undefined
                });
            }, durationMs);
        },

        muteToday(category: string) {
            if (!category || typeof localStorage === "undefined") return;
            try {
                const key = `${STORAGE_PREFIX}${getTodayKey()}`;
                const raw = localStorage.getItem(key) || "[]";
                const list = JSON.parse(raw);
                if (!list.includes(category)) {
                    list.push(category);
                    localStorage.setItem(key, JSON.stringify(list));
                }
            } catch { /* storage fallback */ }
        },

        isMutedToday(category: string): boolean {
            if (!category || typeof localStorage === "undefined") return false;
            try {
                const key = `${STORAGE_PREFIX}${getTodayKey()}`;
                const raw = localStorage.getItem(key);
                if (!raw) return false;
                const list = JSON.parse(raw);
                return Array.isArray(list) && list.includes(category);
            } catch {
                return false;
            }
        },

        getHistory() {
            return [...historyList];
        },

        registerPlugin(name: string, onRelinquish: () => void) {
            pluginRegistry.set(name, onRelinquish);
            return () => {
                pluginRegistry.delete(name);
                if (this.hostPlugin === name) {
                    this.relinquish(name);
                }
            };
        },

        relinquish(name: string) {
            if (this.hostPlugin !== name) return;
            pluginRegistry.delete(name);
            const remaining = Array.from(pluginRegistry.keys());
            if (remaining.length > 0) {
                const nextHost = remaining[0];
                if (nextHost) {
                    this.hostPlugin = nextHost;
                    const takeoverFn = pluginRegistry.get(nextHost);
                    takeoverFn?.();
                } else {
                    this.destroy();
                }
            } else {
                this.destroy();
            }
        },

        destroy() {
            window.removeEventListener("keydown", onKeyDown);
            timers.forEach((t) => clearTimeout(t));
            timers.clear();
            hostEl?.remove();
            hostEl = null;
            if (window.__LV_NOTICE_HUB__ === this) {
                delete window.__LV_NOTICE_HUB__;
            }
        }
    };

    return hub;
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* ========================================================================= */
/* 5. 客户端协商选举与对外部暴露 API                                         */
/* ========================================================================= */

const noopHub: LvNoticeHub = {
    version: PROTOCOL_VERSION,
    hostPlugin: "noop",
    post: () => {},
    dismiss: () => {},
    snooze: () => {},
    muteToday: () => {},
    isMutedToday: () => false,
    getHistory: () => [],
    registerPlugin: () => () => {},
    relinquish: () => {},
    destroy: () => {},
};

function getHub(callerPlugin = "小驴"): LvNoticeHub {
    if (typeof window === "undefined") {
        return noopHub;
    }

    if (window.__LV_NOTICE_HUB__) {
        // 如果当前 Hub 协议版本低于本地，则执行热替换接管
        if (window.__LV_NOTICE_HUB__.version < PROTOCOL_VERSION) {
            try {
                window.__LV_NOTICE_HUB__.destroy();
            } catch { /* ignore */ }
            const newHub = createCoordinator(callerPlugin);
            window.__LV_NOTICE_HUB__ = newHub;
            return newHub;
        }
        return window.__LV_NOTICE_HUB__;
    }

    const hub = createCoordinator(callerPlugin);
    window.__LV_NOTICE_HUB__ = hub;
    return hub;
}

export const lvNotify = {
    /**
     * 发送重点提醒卡片（支持按钮、稍后提醒、今日免打扰）
     */
    card(options: CardNoticeOptions): string {
        const id = `card_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const hub = getHub(options.source);
        hub.post({
            ...options,
            id,
            mode: "card",
            createdAt: Date.now(),
            repeatCount: 1
        });
        return id;
    },

    /**
     * 发送瞬时轻量微胶囊（2.5 秒自然淡出，适合单行轻提示）
     */
    capsule(options: CapsuleNoticeOptions): string {
        const id = `cap_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const hub = getHub(options.source);
        hub.post({
            id,
            mode: "capsule",
            source: options.source,
            message: options.message,
            level: options.level || "info",
            duration: options.duration ?? 2500,
            createdAt: Date.now(),
            repeatCount: 1
        });
        return id;
    },

    /**
     * 原位微反馈（坚决不弹窗！直接在触发操作的按钮/元素上产生微动效）
     */
    inline(target: HTMLElement | null | undefined, tipText?: string, isSuccess = true): void {
        if (!target || typeof target !== "object") return;
        const stateClass = isSuccess ? "lv-inline-feedback--success" : "lv-inline-feedback--error";
        if (target.classList && typeof target.classList.add === "function") {
            target.classList.add("lv-inline-feedback-active", stateClass);
        }
        const originalTitle = typeof target.getAttribute === "function" ? target.getAttribute("title") : null;
        if (tipText && typeof target.setAttribute === "function") target.setAttribute("title", tipText);
        setTimeout(() => {
            if (target.classList && typeof target.classList.remove === "function") {
                target.classList.remove("lv-inline-feedback-active", stateClass);
            }
            if (originalTitle !== null && typeof target.setAttribute === "function") {
                target.setAttribute("title", originalTitle);
            } else if (typeof target.removeAttribute === "function") {
                target.removeAttribute("title");
            }
        }, 1000);
    },

    /**
     * 静默记入历史（绝不弹窗打扰用户，可在通知历史中查阅）
     */
    silent(options: SilentNoticeOptions): void {
        const hub = getHub(options.source);
        hub.post({
            id: `sil_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            mode: "silent",
            source: options.source,
            category: options.category,
            message: options.message,
            level: options.level || "info",
            createdAt: Date.now(),
            repeatCount: 1
        });
    },

    /**
     * 关闭指定通知
     */
    dismiss(id: string): void {
        if (typeof window !== "undefined") {
            window.__LV_NOTICE_HUB__?.dismiss(id);
        }
    },

    /**
     * 延期指定通知（如 15 分钟后再次提醒）
     */
    snooze(id: string, durationMs: number): void {
        if (typeof window !== "undefined") {
            window.__LV_NOTICE_HUB__?.snooze(id, durationMs);
        }
    },

    /**
     * 设置某个分类今日免打扰
     */
    muteToday(category: string): void {
        const hub = getHub();
        hub.muteToday(category);
    },

    /**
     * 判定某个分类今日是否已静音（直接查询存储，不强制拉起 UI 容器）
     */
    isMutedToday(category: string): boolean {
        if (!category || typeof localStorage === "undefined") return false;
        try {
            const key = `${STORAGE_PREFIX}${getTodayKey()}`;
            const raw = localStorage.getItem(key);
            if (!raw) return false;
            const list = JSON.parse(raw);
            return Array.isArray(list) && list.includes(category);
        } catch {
            return false;
        }
    },

    /**
     * 注册插件生命周期（用于插件卸载时的无缝交棒）
     */
    registerPlugin(pluginName: string, onRelinquish: () => void = () => {}): () => void {
        const hub = getHub(pluginName);
        return hub.registerPlugin(pluginName, onRelinquish);
    }
};
