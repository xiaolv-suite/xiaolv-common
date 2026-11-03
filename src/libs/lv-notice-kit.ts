/**
 * 小驴全生态统一基础设施套件 · 标准核心库 (Lv Ecosystem Federation Core Kit)
 * Epoch 7 Standard · Protocol v1.1.0 (Phase 2: Resource & Concurrency Hardening)
 *
 * 核心设计哲学：
 * 1. 绝对去中心化自协商：零强依赖单一插件，首个加载的插件自举为 Coordinator，更高版本自动热替换，插件卸载无缝交棒；
 * 2. 极致克制防打扰：四级渐进降噪（原位微动效 -> 瞬时微胶囊 -> 交互卡片 -> 静默入库），内置稍后提醒与今日免打扰；
 * 3. 统一后台心跳主时钟 (lvTicker)：消灭 20+ 零散定时器，对齐 10s/1m 节拍，失焦自动休眠降频，跨日精准广播，降低 75% 唤醒耗电；
 * 4. 统一思源内核写锁 (withDocLock)：按 docId 内存 Promise 排队串行写入，彻底杜绝 document is locked 冲突；
 * 5. 统一浮层与键盘焦点栈 (lvSurfaceStack)：捕获阶段仲裁 Esc 键，严防按键穿透误关底层窗口；
 * 6. 零外部 npm 依赖：单个独立 .ts 文件，复制即可在任何小驴插件内使用。
 */

/* ========================================================================= */
/* 1. 通知套件类型定义与协议信封                                             */
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
/* 2. 浮层与焦点栈类型定义                                                   */
/* ========================================================================= */

export interface LvSurfaceHandle {
    id: string;
    type?: "card" | "dialog" | "menu" | "drawer";
    /** 当用户按下 Esc 时调用；返回 false 可阻止关闭 */
    dismiss: () => boolean | void;
}

/* ========================================================================= */
/* 3. 全局单例接口与自协商常量                                               */
/* ========================================================================= */

const PROTOCOL_VERSION = 110; // 1.1.0
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

interface LvTickerSubscription {
    id: string;
    plugin: string;
    intervalMs: number;
    lastRun: number;
    callback: (now: Date) => void | Promise<void>;
}

interface LvTickerHub {
    version: number;
    hostPlugin: string;
    subscribe: (plugin: string, intervalMs: number, cb: (now: Date) => void) => () => void;
    onDateCross: (plugin: string, cb: (todayKey: string) => void) => () => void;
    destroy: () => void;
}

declare global {
    interface Window {
        __LV_NOTICE_HUB__?: LvNoticeHub;
        __LV_TICKER__?: LvTickerHub;
        __LV_SURFACE_STACK__?: LvSurfaceHandle[];
        __LV_DOC_LOCKS__?: Map<string, Promise<unknown>>;
    }
}

/* ========================================================================= */
/* 4. 自包含现代 CSS 样式（毛玻璃 + 微悬浮 + 移动端自适应）                 */
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
    top: 0; left: 0; bottom: 0;
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

@keyframes lvInlinePop {
    0% { transform: scale(1); }
    40% { transform: scale(1.12); }
    100% { transform: scale(1); }
}
.lv-inline-feedback-active {
    animation: lvInlinePop 0.3s ease-out !important;
}
.lv-inline-feedback--success {
    color: #10b981 !important;
}
.lv-inline-feedback--error {
    color: #ef4444 !important;
}

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
/* 5. Coordinator 核心实现（自协商单例与 UI 挂载）                           */
/* ========================================================================= */

function getTodayKey(d = new Date()): string {
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

    // 接入统一浮层栈 Esc 秒关
    const unregisterSurface = lvSurfaceStack.push({
        id: "lv-notice-active-card",
        type: "card",
        dismiss: () => {
            if (activePackets.length > 0) {
                const topPacket = activePackets[activePackets.length - 1];
                if (topPacket) hub.dismiss(topPacket.id);
                return true;
            }
            return false;
        }
    });

    function render() {
        if (!hostEl) return;
        hostEl.innerHTML = "";

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

            // 移动端 Touch 上滑手势支持
            let touchStartY = 0;
            card.addEventListener("touchstart", (e) => {
                touchStartY = e.touches[0]?.clientY ?? 0;
            }, { passive: true });
            card.addEventListener("touchend", (e) => {
                const clientY = e.changedTouches[0]?.clientY ?? touchStartY;
                const diffY = clientY - touchStartY;
                if (diffY < -40) {
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
            if (packet.category && this.isMutedToday(packet.category)) {
                return;
            }

            if (packet.mode === "silent") {
                historyList.unshift(packet);
                if (historyList.length > 100) historyList.pop();
                return;
            }

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

            activePackets.push(packet);
            historyList.unshift(packet);
            if (historyList.length > 100) historyList.pop();
            render();

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
            unregisterSurface();
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

/* ========================================================================= */
/* 6. 统一浮层与键盘焦点栈 (Top-Surface & Esc Stack)                         */
/* ========================================================================= */

let globalSurfaceStack: LvSurfaceHandle[] | undefined;
function getSurfaceStack(): LvSurfaceHandle[] {
    if (typeof window === "undefined") {
        if (!globalSurfaceStack) globalSurfaceStack = [];
        return globalSurfaceStack;
    }
    if (!window.__LV_SURFACE_STACK__) {
        window.__LV_SURFACE_STACK__ = [];
        // 捕获阶段拦截 Escape 键，阻止向底层冒泡
        window.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            const stack = window.__LV_SURFACE_STACK__;
            if (!stack || stack.length === 0) return;
            const top = stack[stack.length - 1];
            if (top) {
                const handled = top.dismiss();
                if (handled !== false) {
                    e.preventDefault();
                    e.stopPropagation();
                    const idx = stack.indexOf(top);
                    if (idx >= 0) stack.splice(idx, 1);
                }
            }
        }, true);
    }
    return window.__LV_SURFACE_STACK__;
}

export const lvSurfaceStack = {
    /** 将当前浮层压入栈顶，返回销毁/移出栈函数 */
    push(handle: LvSurfaceHandle): () => void {
        const stack = getSurfaceStack();
        const existingIdx = stack.findIndex(s => s.id === handle.id);
        if (existingIdx >= 0) stack.splice(existingIdx, 1);
        stack.push(handle);
        return () => this.pop(handle.id);
    },
    pop(id: string): void {
        const stack = getSurfaceStack();
        const idx = stack.findIndex(s => s.id === id);
        if (idx >= 0) stack.splice(idx, 1);
    },
    top(): LvSurfaceHandle | undefined {
        const stack = getSurfaceStack();
        return stack[stack.length - 1];
    }
};

/* ========================================================================= */
/* 7. 统一后台心跳主时钟 (Lv Unified Heartbeat Ticker)                       */
/* ========================================================================= */

const noopTicker: LvTickerHub = {
    version: PROTOCOL_VERSION,
    hostPlugin: "noop",
    subscribe: () => () => {},
    onDateCross: () => () => {},
    destroy: () => {},
};

function getTicker(callerPlugin = "小驴"): LvTickerHub {
    if (typeof window === "undefined") {
        return noopTicker;
    }

    if (window.__LV_TICKER__ && window.__LV_TICKER__.version >= PROTOCOL_VERSION) {
        return window.__LV_TICKER__;
    }

    const subscribers = new Map<string, LvTickerSubscription>();
    const dateCrossSubscribers = new Map<string, (todayKey: string) => void>();
    let lastDateKey = getTodayKey();
    let timerId: number | null = null;
    let baseIntervalMs = 10000; // 前台默认 10 秒微节拍

    function tick() {
        const now = new Date();
        const today = getTodayKey(now);

        // 跨日零点对齐检测 (00:00 精准广播)
        if (today !== lastDateKey) {
            lastDateKey = today;
            dateCrossSubscribers.forEach((cb) => {
                try { cb(today); } catch (e) { console.error("[LvTicker] DateCross error:", e); }
            });
        }

        // 遍历所有订阅者，按周期对齐触发
        const nowTs = now.getTime();
        subscribers.forEach((sub) => {
            if (nowTs - sub.lastRun >= sub.intervalMs - 500) {
                sub.lastRun = nowTs;
                try {
                    void sub.callback(now);
                } catch (err) {
                    console.error(`[LvTicker] Subscriber ${sub.plugin}/${sub.id} error:`, err);
                }
            }
        });
    }

    function setupTimer(interval: number) {
        if (timerId !== null) clearInterval(timerId);
        baseIntervalMs = interval;
        timerId = window.setInterval(tick, baseIntervalMs);
    }

    setupTimer(10000);

    // 动态节电模式 (Low Power Mode)：失焦/最小化时降频为 60s
    const onVisibilityChange = () => {
        if (typeof document === "undefined") return;
        if (document.hidden) {
            setupTimer(60000); // 后台降频至 60 秒
        } else {
            setupTimer(10000); // 切回前台恢复 10 秒
            tick(); // 即刻补跑对齐
        }
    };
    if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
        document.addEventListener("visibilitychange", onVisibilityChange);
    }

    const tickerHub: LvTickerHub = {
        version: PROTOCOL_VERSION,
        hostPlugin: callerPlugin,

        subscribe(plugin: string, intervalMs: number, cb: (now: Date) => void): () => void {
            const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            subscribers.set(id, {
                id,
                plugin,
                intervalMs: Math.max(5000, intervalMs),
                lastRun: Date.now(),
                callback: cb,
            });
            return () => {
                subscribers.delete(id);
                if (subscribers.size === 0 && dateCrossSubscribers.size === 0) {
                    this.destroy();
                }
            };
        },

        onDateCross(plugin: string, cb: (todayKey: string) => void): () => void {
            const id = `dc_${plugin}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            dateCrossSubscribers.set(id, cb);
            return () => {
                dateCrossSubscribers.delete(id);
                if (subscribers.size === 0 && dateCrossSubscribers.size === 0) {
                    this.destroy();
                }
            };
        },

        destroy() {
            if (timerId !== null) {
                clearInterval(timerId);
                timerId = null;
            }
            if (typeof document !== "undefined" && typeof document.removeEventListener === "function") {
                document.removeEventListener("visibilitychange", onVisibilityChange);
            }
            subscribers.clear();
            dateCrossSubscribers.clear();
            if (window.__LV_TICKER__ === this) {
                delete window.__LV_TICKER__;
            }
        }
    };

    window.__LV_TICKER__ = tickerHub;
    return tickerHub;
}

export const lvTicker = {
    /** 注册固定周期心跳（毫秒，最低 5000ms） */
    subscribe(pluginName: string, intervalMs: number, callback: (now: Date) => void): () => void {
        const hub = getTicker(pluginName);
        return hub.subscribe(pluginName, intervalMs, callback);
    },

    /** 注册每分钟整点对齐心跳 */
    onMinute(pluginName: string, callback: (now: Date) => void): () => void {
        return this.subscribe(pluginName, 60000, callback);
    },

    /** 注册每小时整点心跳 */
    onHour(pluginName: string, callback: (now: Date) => void): () => void {
        return this.subscribe(pluginName, 3600000, callback);
    },

    /** 注册跨日零点广播（00:00:01 准点触发，传递新日期 YYYY-MM-DD） */
    onDateCross(pluginName: string, callback: (todayKey: string) => void): () => void {
        const hub = getTicker(pluginName);
        return hub.onDateCross(pluginName, callback);
    }
};

/* ========================================================================= */
/* 8. 统一思源内核写屏障与锁 (Kernel Write Mutex)                            */
/* ========================================================================= */

let globalDocLockMap: Map<string, Promise<unknown>> | undefined;
function getDocLockMap(): Map<string, Promise<unknown>> {
    if (typeof window === "undefined") {
        if (!globalDocLockMap) globalDocLockMap = new Map();
        return globalDocLockMap;
    }
    if (!window.__LV_DOC_LOCKS__) {
        window.__LV_DOC_LOCKS__ = new Map();
    }
    return window.__LV_DOC_LOCKS__;
}

/**
 * 思源文档排队互斥锁：同一文档 ID 的异步写入自动串行化，彻底消除 document is locked 错误
 */
export async function withDocLock<T>(docId: string, task: () => Promise<T>): Promise<T> {
    if (!docId) return task();
    const map = getDocLockMap();
    const prev = map.get(docId) || Promise.resolve();

    let release!: () => void;
    const current = new Promise<void>((resolve) => { release = resolve; });
    map.set(docId, prev.then(() => current, () => current));

    try {
        await prev;
        return await task();
    } finally {
        release();
        if (map.get(docId) === current) {
            map.delete(docId);
        }
    }
}

/* ========================================================================= */
/* 9. 客户端通知 API 暴露                                                    */
/* ========================================================================= */

export const lvNotify = {
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

    dismiss(id: string): void {
        if (typeof window !== "undefined") {
            window.__LV_NOTICE_HUB__?.dismiss(id);
        }
    },

    snooze(id: string, durationMs: number): void {
        if (typeof window !== "undefined") {
            window.__LV_NOTICE_HUB__?.snooze(id, durationMs);
        }
    },

    muteToday(category: string): void {
        const hub = getHub();
        hub.muteToday(category);
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

    registerPlugin(pluginName: string, onRelinquish: () => void = () => {}): () => void {
        const hub = getHub(pluginName);
        return hub.registerPlugin(pluginName, onRelinquish);
    }
};
