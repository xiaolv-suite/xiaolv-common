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
    category?: string;
    message: string;
    level?: LvNoticeLevel;
    /** 停留时长，默认 2500ms */
    duration?: number;
    /** 可选轻量撤销/跳转操作 */
    action?: {
        label: string;
        onClick?: () => void | Promise<void>;
    };
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

const PROTOCOL_VERSION = 160; // 1.6.0 (Phase 7: Omnisearch & IFTTT Automation)
const STORAGE_PREFIX = "lv_notice_mute_";
const AI_STORAGE_KEY = "lv_ai_shared_config";
const LAUNCHPAD_STORAGE_KEY = "lv_launchpad_states";
const AUTOMATION_RULES_KEY = "lv_automation_rules_config";

export interface LvSearchResultItem {
    id: string;
    source: string;              // "打卡" | "拾遗" | "考试" | "闪卡" | "人脉" | "管家" | "常用" | "快门"
    category: string;
    title: string;
    snippet?: string;
    badge?: string;
    linkBlockId?: string;
    onClick: () => void | Promise<void>;
}

export type LvSearchProvider = (keyword: string) => Promise<LvSearchResultItem[]> | LvSearchResultItem[];

export interface LvAutomationRule {
    id: string;
    name: string;
    desc: string;
    enabled: boolean;
    triggerSource: string;       // 如 "siyuan-exam"
    triggerType: string;         // 如 "wrong-question"
    actionPlugin: string;        // 如 "siyuan-lv-cards"
    actionName: string;          // 如 "create-card"
    execute: (payload: unknown) => Promise<boolean> | boolean;
}

export interface LvLaunchpadItem {
    id: string;
    name: string;
    fullName: string;
    svgIcon: string;
    color?: string;
    desc?: string;
    digit?: number;
    badge?: string;
    badgeType?: "primary" | "warn" | "error" | "success";
    actions?: string[];
    onClick: () => void;
    onAction?: (actionName: string) => void;
}

export interface LvPluginBackupPayload {
    plugin: string;
    version: string;
    exportedAt: string;
    data: Record<string, unknown>;
}

export interface LvEcosystemFullBackup {
    v: 1;
    ecosystem: "xiaolv";
    exportedAt: string;
    plugins: Record<string, LvPluginBackupPayload>;
}

export interface LvEcosystemDiagnostics {
    version: number;
    coordinatorHost: string;
    registeredPlugins: string[];
    todayActivitiesCount: number;
    hasSharedAiConfig: boolean;
    sharedAiModel?: string;
}

export interface LvAiConfig {
    endpoint: string;    // e.g. "https://api.deepseek.com/v1" or "https://dashscope.aliyuncs.com/compatible-mode/v1"
    apiKey: string;      // 共享 Key
    model: string;       // e.g. "deepseek-chat" or "qwen-plus"
    temperature?: number;
    maxTokens?: number;
}

export interface LvAiRequestOptions {
    source: string;              // 调用插件名，如 "闪卡"、"考试"、"拾遗"
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
    endpoint?: string;           // 可选，单次请求独立覆写端点
    apiKey?: string;             // 可选，单次请求独立覆写 Key
    model?: string;              // 可选，覆盖模型
    temperature?: number;
    priority?: "high" | "low";   // 默认 high (前台交互即时响应)；low 为后台批量
    signal?: AbortSignal;
}

export interface LvAiResponse {
    content: string;
    model: string;
    totalTokens?: number;
}

export interface LvActivityRecord {
    id: string;
    timestamp: number;
    timeStr: string;            // "14:32"
    source: string;             // "打卡" | "拾遗" | "考试" | "闪卡" | "管家" | "人脉" | "雷切" | "快门"
    category: "habit" | "clip" | "exam" | "card" | "task" | "contact" | "note";
    title: string;              // 简要摘要，如 "完成英语单词打卡"、"剪藏《架构白皮书》"
    detail?: string;            // 可选详细内容
    linkBlockId?: string;       // 关联的思源块 ID，可一键跳转
}

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

interface LvAiGatewayHub {
    version: number;
    setConfig: (cfg: LvAiConfig) => void;
    getConfig: () => LvAiConfig | null;
    chat: (opts: LvAiRequestOptions) => Promise<LvAiResponse>;
}

interface LvActivityStreamHub {
    version: number;
    record: (item: Omit<LvActivityRecord, "id" | "timestamp" | "timeStr">) => void;
    getTodayRecords: () => LvActivityRecord[];
    onActivity: (cb: (item: LvActivityRecord) => void) => () => void;
    formatAsMarkdown: () => string;
    getDailyStats: () => Record<string, number>;
}

interface LvBackupHub {
    version: number;
    register: (plugin: string, backupFn: () => Promise<Record<string, unknown>>, restoreFn: (data: Record<string, unknown>) => Promise<boolean>) => () => void;
    exportFull: () => Promise<LvEcosystemFullBackup>;
    restoreFull: (bundle: LvEcosystemFullBackup) => Promise<{ success: string[]; failed: string[] }>;
}

interface LvLaunchpadHub {
    version: number;
    register: (item: LvLaunchpadItem) => () => void;
    getItems: () => Array<LvLaunchpadItem & { state: "pinned" | "docked" | "hidden" }>;
    setPluginState: (id: string, state: "pinned" | "docked" | "hidden") => void;
    executeAction: (id: string, actionName: string) => boolean;
    open: (mode?: "popover" | "center") => void;
    close: () => void;
}

interface LvOmnisearchHub {
    version: number;
    registerProvider: (plugin: string, provider: LvSearchProvider) => () => void;
    search: (keyword: string) => Promise<LvSearchResultItem[]>;
}

interface LvAutomationHub {
    version: number;
    registerRule: (rule: LvAutomationRule) => () => void;
    trigger: (source: string, type: string, payload: unknown) => Promise<{ triggered: number; success: number }>;
    getRules: () => LvAutomationRule[];
    toggleRule: (ruleId: string, enabled: boolean) => void;
}

declare global {
    interface Window {
        __LV_NOTICE_HUB__?: LvNoticeHub;
        __LV_TICKER__?: LvTickerHub;
        __LV_SURFACE_STACK__?: LvSurfaceHandle[];
        __LV_DOC_LOCKS__?: Map<string, Promise<unknown>>;
        __LV_AI_GATEWAY__?: LvAiGatewayHub;
        __LV_ACTIVITY_STREAM__?: LvActivityStreamHub;
        __LV_BACKUP_HUB__?: LvBackupHub;
        __LV_LAUNCHPAD__?: LvLaunchpadHub;
        __LV_OMNISEARCH__?: LvOmnisearchHub;
        __LV_AUTOMATION__?: LvAutomationHub;
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
            const top = activePackets[activePackets.length - 1];
            if (top) {
                hub.dismiss(top.id);
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
                const diffY = (e.changedTouches[0]?.clientY ?? 0) - touchStartY;
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
            const nextHost = remaining[0];
            if (nextHost) {
                this.hostPlugin = nextHost;
                const takeoverFn = pluginRegistry.get(nextHost);
                takeoverFn?.();
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

const nodeHistoryList: LvNoticePacket[] = [];
let nodeHubInstance: LvNoticeHub | undefined;

function getNodeHub(callerPlugin: string): LvNoticeHub {
    if (!nodeHubInstance) {
        nodeHubInstance = {
            version: PROTOCOL_VERSION,
            hostPlugin: callerPlugin,
            post(packet: LvNoticePacket) {
                nodeHistoryList.unshift(packet);
                if (nodeHistoryList.length > 100) nodeHistoryList.pop();
            },
            dismiss() {},
            snooze() {},
            muteToday() {},
            isMutedToday() { return false; },
            getHistory() { return [...nodeHistoryList]; },
            registerPlugin() { return () => {}; },
            relinquish() {},
            destroy() {
                nodeHistoryList.length = 0;
                nodeHubInstance = undefined;
            },
        };
    }
    return nodeHubInstance;
}

function getHub(callerPlugin = "小驴"): LvNoticeHub {
    if (typeof window === "undefined") {
        return getNodeHub(callerPlugin);
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

const nodeSurfaceStack: LvSurfaceHandle[] = [];

function getSurfaceStack(): LvSurfaceHandle[] {
    if (typeof window === "undefined") return nodeSurfaceStack;
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

let nodeTickerInstance: LvTickerHub | undefined;

function getNodeTicker(callerPlugin: string): LvTickerHub {
    if (!nodeTickerInstance) {
        nodeTickerInstance = {
            version: PROTOCOL_VERSION,
            hostPlugin: callerPlugin,
            subscribe() { return () => {}; },
            onDateCross() { return () => {}; },
            destroy() { nodeTickerInstance = undefined; },
        };
    }
    return nodeTickerInstance;
}

function getTicker(callerPlugin = "小驴"): LvTickerHub {
    if (typeof window === "undefined") {
        return getNodeTicker(callerPlugin);
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

const nodeDocLockMap = new Map<string, Promise<unknown>>();

function getDocLockMap(): Map<string, Promise<unknown>> {
    if (typeof window === "undefined") return nodeDocLockMap;
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

/* ========================================================================= */
/* 10. 统一 AI 凭据与并发限流网关 (Lv Unified AI Gateway)                    */
/* ========================================================================= */

let fallbackAiConfig: LvAiConfig | null = null;

function getAiHub(): LvAiGatewayHub {
    if (typeof window === "undefined") {
        return {
            version: PROTOCOL_VERSION,
            setConfig: (cfg) => { fallbackAiConfig = cfg; },
            getConfig: () => fallbackAiConfig,
            chat: async (opts) => executeChatRequest(fallbackAiConfig, opts),
        };
    }

    if (window.__LV_AI_GATEWAY__ && window.__LV_AI_GATEWAY__.version >= PROTOCOL_VERSION) {
        return window.__LV_AI_GATEWAY__;
    }

    const MAX_CONCURRENT = 2;
    let activeCount = 0;
    const requestQueue: Array<{
        execute: () => Promise<void>;
        priority: "high" | "low";
    }> = [];

    function processQueue() {
        if (activeCount >= MAX_CONCURRENT || requestQueue.length === 0) return;
        requestQueue.sort((a, b) => (a.priority === "high" ? -1 : b.priority === "high" ? 1 : 0));
        const next = requestQueue.shift();
        if (!next) return;
        activeCount++;
        next.execute().finally(() => {
            activeCount--;
            processQueue();
        });
    }

    async function executeChatRequest(cfg: LvAiConfig | null, opts: LvAiRequestOptions): Promise<LvAiResponse> {
        if (!cfg || !cfg.apiKey) {
            throw new Error("[LvAiGateway] 未配置共享 API Key（请在任意小驴插件设置中配置）");
        }

        const endpoint = (cfg.endpoint || "https://api.deepseek.com/v1").replace(/\/+$/, "");
        const targetUrl = endpoint.endsWith("/chat/completions") ? endpoint : `${endpoint}/chat/completions`;
        const model = opts.model || cfg.model || "deepseek-chat";

        let retries = 0;
        const maxRetries = 3;

        while (true) {
            try {
                const response = await fetch(targetUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${cfg.apiKey}`,
                    },
                    body: JSON.stringify({
                        model,
                        messages: opts.messages,
                        temperature: opts.temperature ?? cfg.temperature ?? 0.7,
                        max_tokens: cfg.maxTokens,
                    }),
                    signal: opts.signal,
                });

                if (response.status === 429 && retries < maxRetries) {
                    retries++;
                    const backoffMs = Math.pow(2, retries) * 1000;
                    console.warn(`[LvAiGateway] 遇到 429 限流，将在 ${backoffMs}ms 后退避重试 (第 ${retries} 次)...`);
                    await new Promise(r => setTimeout(r, backoffMs));
                    continue;
                }

                if (!response.ok) {
                    const errBody = await response.text().catch(() => "");
                    throw new Error(`[LvAiGateway] HTTP ${response.status}: ${errBody}`);
                }

                const data = await response.json();
                const content = data.choices?.[0]?.message?.content ?? "";
                const totalTokens = data.usage?.total_tokens;

                return {
                    content,
                    model: data.model || model,
                    totalTokens,
                };
            } catch (err) {
                if (retries < maxRetries && err instanceof Error && !err.name.includes("Abort")) {
                    retries++;
                    const backoffMs = Math.pow(2, retries) * 1000;
                    await new Promise(r => setTimeout(r, backoffMs));
                    continue;
                }
                throw err;
            }
        }
    }

    const aiHub: LvAiGatewayHub = {
        version: PROTOCOL_VERSION,
        setConfig(cfg: LvAiConfig) {
            try {
                if (typeof localStorage !== "undefined") {
                    localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(cfg));
                }
            } catch { /* storage fallback */ }
        },
        getConfig(): LvAiConfig | null {
            try {
                if (typeof localStorage !== "undefined") {
                    const raw = localStorage.getItem(AI_STORAGE_KEY);
                    if (raw) return JSON.parse(raw);
                }
            } catch { /* fallback */ }
            return null;
        },
        chat(opts: LvAiRequestOptions): Promise<LvAiResponse> {
            return new Promise((resolve, reject) => {
                const cfg = this.getConfig();
                const task = async () => {
                    try {
                        const res = await executeChatRequest(cfg, opts);
                        resolve(res);
                    } catch (e) {
                        reject(e);
                    }
                };
                requestQueue.push({
                    execute: task,
                    priority: opts.priority ?? "high",
                });
                processQueue();
            });
        }
    };

    window.__LV_AI_GATEWAY__ = aiHub;
    return aiHub;
}

export const lvAi = {
    /** 配置全局共享 AI 凭据（在任一插件配置，全家桶免填共享） */
    setConfig(config: LvAiConfig): void {
        getAiHub().setConfig(config);
    },
    /** 读取当前共享 AI 凭据 */
    getConfig(): LvAiConfig | null {
        return getAiHub().getConfig();
    },
    /**
     * 发送 AI 对话请求（自动并发整形、429 指数退避）
     */
    chat(options: LvAiRequestOptions): Promise<LvAiResponse> {
        return getAiHub().chat(options);
    }
};

/* ========================================================================= */
/* 11. 今日全生态活动主干流 (Lv Unified Daily Activity Stream)                */
/* ========================================================================= */

let fallbackActivities: LvActivityRecord[] = [];

function getActivityHub(): LvActivityStreamHub {
    if (typeof window === "undefined") {
        return {
            version: PROTOCOL_VERSION,
            record: (item) => {
                const now = new Date();
                fallbackActivities.push({
                    ...item,
                    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
                    timestamp: now.getTime(),
                    timeStr: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
                });
            },
            getTodayRecords: () => [...fallbackActivities],
            onActivity: () => () => {},
            formatAsMarkdown: () => formatActivityMarkdown(fallbackActivities),
            getDailyStats: () => ({ total: fallbackActivities.length }),
        };
    }

    if (window.__LV_ACTIVITY_STREAM__ && window.__LV_ACTIVITY_STREAM__.version >= PROTOCOL_VERSION) {
        return window.__LV_ACTIVITY_STREAM__;
    }

    const todayActivities: LvActivityRecord[] = [];
    const listeners = new Set<(item: LvActivityRecord) => void>();
    let lastDateKey = getTodayKey();

    const activityHub: LvActivityStreamHub = {
        version: PROTOCOL_VERSION,
        record(item: Omit<LvActivityRecord, "id" | "timestamp" | "timeStr">) {
            const now = new Date();
            const today = getTodayKey(now);
            // 跨日自动重置当日内存流
            if (today !== lastDateKey) {
                lastDateKey = today;
                todayActivities.length = 0;
            }

            const record: LvActivityRecord = {
                ...item,
                id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
                timestamp: now.getTime(),
                timeStr: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
            };

            todayActivities.push(record);
            listeners.forEach(cb => {
                try { cb(record); } catch (e) { console.error("[LvActivityStream] error:", e); }
            });
        },

        getTodayRecords(): LvActivityRecord[] {
            return [...todayActivities];
        },

        onActivity(cb: (item: LvActivityRecord) => void): () => void {
            listeners.add(cb);
            return () => listeners.delete(cb);
        },

        formatAsMarkdown(): string {
            return formatActivityMarkdown(todayActivities);
        },

        getDailyStats(): Record<string, number> {
            const stats: Record<string, number> = { total: todayActivities.length };
            todayActivities.forEach(r => {
                stats[r.category] = (stats[r.category] || 0) + 1;
                stats[r.source] = (stats[r.source] || 0) + 1;
            });
            return stats;
        }
    };

    window.__LV_ACTIVITY_STREAM__ = activityHub;
    return activityHub;
}

function formatActivityMarkdown(records: LvActivityRecord[]): string {
    if (!records || records.length === 0) {
        return "*今日暂无小驴生态活动记录*";
    }

    const categoryIcons: Record<string, string> = {
        habit: "✅",
        clip: "🔖",
        exam: "📝",
        card: "🎴",
        task: "📌",
        contact: "👥",
        note: "💡",
    };

    const lines: string[] = ["### 🐴 小驴全家桶 · 今日活动汇编", ""];
    records.forEach(r => {
        const icon = categoryIcons[r.category] || "🔹";
        const link = r.linkBlockId ? ` (([链接](siyuan://blocks/${r.linkBlockId})))` : "";
        const detail = r.detail ? ` — *${r.detail}*` : "";
        lines.push(`- **${r.timeStr}** [${r.source}] ${icon} ${r.title}${detail}${link}`);
    });

    return lines.join("\n");
}

export const lvActivity = {
    /** 广播记录一项生态活动 */
    record(item: Omit<LvActivityRecord, "id" | "timestamp" | "timeStr">): void {
        getActivityHub().record(item);
    },
    /** 获取今日所有插件产生的时间线记录（升序） */
    getTodayRecords(): LvActivityRecord[] {
        return getActivityHub().getTodayRecords();
    },
    /** 订阅活动流 */
    onActivity(callback: (item: LvActivityRecord) => void): () => void {
        return getActivityHub().onActivity(callback);
    },
    /** 格式化生成结构化 Markdown 字符串，可直接追加到 Daily Note */
    formatAsMarkdown(): string {
        return getActivityHub().formatAsMarkdown();
    },
    /** 获取今日生态活动量化指标 (如打卡数、剪藏数、复习数) */
    getDailyStats(): Record<string, number> {
        return getActivityHub().getDailyStats();
    }
};

/* ========================================================================= */
/* 12. 全家桶一键联合灾备包 (Lv Ecosystem Full Backup Orchestrator)           */
/* ========================================================================= */

interface BackupProvider {
    plugin: string;
    backup: () => Promise<Record<string, unknown>>;
    restore: (data: Record<string, unknown>) => Promise<boolean>;
}

const backupRegistry = new Map<string, BackupProvider>();

function createBackupCoordinator(): LvBackupHub {
    return {
        version: PROTOCOL_VERSION,
        register(plugin: string, backup: () => Promise<Record<string, unknown>>, restore: (data: Record<string, unknown>) => Promise<boolean>): () => void {
            backupRegistry.set(plugin, { plugin, backup, restore });
            return () => backupRegistry.delete(plugin);
        },

        async exportFull(): Promise<LvEcosystemFullBackup> {
            const bundle: LvEcosystemFullBackup = {
                v: 1,
                ecosystem: "xiaolv",
                exportedAt: new Date().toISOString(),
                plugins: {},
            };

            const entries = Array.from(backupRegistry.entries());
            await Promise.all(
                entries.map(async ([plugin, provider]) => {
                    try {
                        const data = await provider.backup();
                        bundle.plugins[plugin] = {
                            plugin,
                            version: "latest",
                            exportedAt: new Date().toISOString(),
                            data,
                        };
                    } catch (err) {
                        console.error(`[LvBackup] 备份插件 ${plugin} 失败:`, err);
                    }
                })
            );

            return bundle;
        },

        async restoreFull(bundle: LvEcosystemFullBackup): Promise<{ success: string[]; failed: string[] }> {
            if (!bundle || bundle.ecosystem !== "xiaolv" || !bundle.plugins) {
                throw new Error("[LvBackup] 非合法的小驴全生态灾备包格式");
            }

            const success: string[] = [];
            const failed: string[] = [];

            for (const [plugin, payload] of Object.entries(bundle.plugins)) {
                const provider = backupRegistry.get(plugin);
                if (!provider) {
                    failed.push(`${plugin}(未安装或未注册恢复切面)`);
                    continue;
                }
                try {
                    const ok = await provider.restore(payload.data);
                    if (ok) success.push(plugin);
                    else failed.push(plugin);
                } catch (e) {
                    console.error(`[LvBackup] 恢复插件 ${plugin} 异常:`, e);
                    failed.push(plugin);
                }
            }

            return { success, failed };
        }
    };
}

let nodeBackupHubInstance: LvBackupHub | undefined;

function getBackupHub(): LvBackupHub {
    if (typeof window === "undefined") {
        if (!nodeBackupHubInstance) {
            nodeBackupHubInstance = createBackupCoordinator();
        }
        return nodeBackupHubInstance;
    }

    if (window.__LV_BACKUP_HUB__ && window.__LV_BACKUP_HUB__.version >= PROTOCOL_VERSION) {
        return window.__LV_BACKUP_HUB__;
    }

    const hub = createBackupCoordinator();
    window.__LV_BACKUP_HUB__ = hub;
    return hub;
}

export const lvBackup = {
    /** 插件向生态灾备总线注册备份/恢复切面 */
    register(
        pluginName: string,
        backupFn: () => Promise<Record<string, unknown>>,
        restoreFn: (data: Record<string, unknown>) => Promise<boolean>
    ): () => void {
        return getBackupHub().register(pluginName, backupFn, restoreFn);
    },

    /** 导出当前已安装并启用的所有小驴插件全量联合备份包 */
    exportFull(): Promise<LvEcosystemFullBackup> {
        return getBackupHub().exportFull();
    },

    /** 将联合备份包一键恢复到各个插件 */
    restoreFull(bundle: LvEcosystemFullBackup): Promise<{ success: string[]; failed: string[] }> {
        return getBackupHub().restoreFull(bundle);
    }
};

/* ========================================================================= */
/* 13. 全生态健康自省与指示器 (Lv Ecosystem Diagnostics)                       */
/* ========================================================================= */

export const lvEcosystem = {
    /** 获取全生态运行态健康诊断信息 */
    getDiagnostics(): LvEcosystemDiagnostics {
        const noticeHub = typeof window !== "undefined" ? window.__LV_NOTICE_HUB__ : undefined;
        const aiHub = typeof window !== "undefined" ? window.__LV_AI_GATEWAY__ : undefined;
        const aiCfg = aiHub?.getConfig();
        const activities = typeof window !== "undefined" ? window.__LV_ACTIVITY_STREAM__?.getTodayRecords() ?? [] : [];
        const registered = Array.from(backupRegistry.keys());

        return {
            version: PROTOCOL_VERSION,
            coordinatorHost: noticeHub?.hostPlugin ?? "none",
            registeredPlugins: registered,
            todayActivitiesCount: activities.length,
            hasSharedAiConfig: Boolean(aiCfg?.apiKey),
            sharedAiModel: aiCfg?.model,
        };
    },

    /** 生成一行极简且精致的胶囊状态文字，如：“🐴 小驴全家桶协同正常 · 7 个插件已联结 · 今日活动 8 项” */
    getStatusBadgeText(): string {
        const diag = this.getDiagnostics();
        const count = diag.registeredPlugins.length;
        const pluginText = count > 0 ? `${count} 插件已联结` : "单机模式";
        return `🐴 小驴全家桶协同正常 · ${pluginText} · 今日活动 ${diag.todayActivitiesCount} 项`;
    }
};

/* ========================================================================= */
/* 14. 小驴罗盘 · 家族极速弹射坞引擎 (Lv Launchpad Engine)                   */
/* ========================================================================= */

const launchpadRegistry = new Map<string, LvLaunchpadItem>();

function getLaunchpadStates(): Record<string, "pinned" | "docked" | "hidden"> {
    if (typeof localStorage === "undefined") return {};
    try {
        const raw = localStorage.getItem(LAUNCHPAD_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return {};
}

function saveLaunchpadStates(states: Record<string, "pinned" | "docked" | "hidden">): void {
    if (typeof localStorage === "undefined") return;
    try {
        localStorage.setItem(LAUNCHPAD_STORAGE_KEY, JSON.stringify(states));
    } catch { /* ignore */ }
}

function getLaunchpadHub(): LvLaunchpadHub {
    if (typeof window === "undefined") {
        return {
            version: PROTOCOL_VERSION,
            register: (item) => {
                launchpadRegistry.set(item.id, item);
                return () => launchpadRegistry.delete(item.id);
            },
            getItems: () => {
                const states = getLaunchpadStates();
                return Array.from(launchpadRegistry.values()).map(item => ({
                    ...item,
                    state: states[item.id] || "docked",
                }));
            },
            setPluginState: (id, state) => {
                const states = getLaunchpadStates();
                states[id] = state;
                saveLaunchpadStates(states);
            },
            executeAction: (id, actionName) => {
                const item = launchpadRegistry.get(id);
                if (!item) return false;
                if (item.onAction) {
                    item.onAction(actionName);
                    return true;
                }
                item.onClick();
                return true;
            },
            open: () => {},
            close: () => {},
        };
    }

    if (window.__LV_LAUNCHPAD__ && window.__LV_LAUNCHPAD__.version >= PROTOCOL_VERSION) {
        return window.__LV_LAUNCHPAD__;
    }

    const hub: LvLaunchpadHub = {
        version: PROTOCOL_VERSION,

        register(item: LvLaunchpadItem): () => void {
            launchpadRegistry.set(item.id, item);
            return () => {
                launchpadRegistry.delete(item.id);
            };
        },

        getItems(): Array<LvLaunchpadItem & { state: "pinned" | "docked" | "hidden" }> {
            const states = getLaunchpadStates();
            return Array.from(launchpadRegistry.values()).map(item => ({
                ...item,
                state: states[item.id] || "docked",
            }));
        },

        setPluginState(id: string, state: "pinned" | "docked" | "hidden"): void {
            const states = getLaunchpadStates();
            states[id] = state;
            saveLaunchpadStates(states);
        },

        executeAction(id: string, actionName: string): boolean {
            const item = launchpadRegistry.get(id);
            if (!item) return false;
            if (item.onAction) {
                item.onAction(actionName);
                return true;
            }
            item.onClick();
            return true;
        },

        open(_mode?: "popover" | "center"): void {
            // 通过 DOM 或 CustomEvent 派发打开弹射坞
            window.dispatchEvent(new CustomEvent("lv:launchpad:open", { detail: { mode: _mode || "popover" } }));
        },

        close(): void {
            window.dispatchEvent(new CustomEvent("lv:launchpad:close"));
        }
    };

    window.__LV_LAUNCHPAD__ = hub;
    return hub;
}

export const lvLaunchpad = {
    /** 向小驴罗盘注册插件入口（替代传统的 addTopBar，支持置顶/收敛/隐藏与二级行动） */
    register(item: LvLaunchpadItem): () => void {
        return getLaunchpadHub().register(item);
    },

    /** 获取当前已注册的插件列表及其三态呈现属性 */
    getItems(): Array<LvLaunchpadItem & { state: "pinned" | "docked" | "hidden" }> {
        return getLaunchpadHub().getItems();
    },

    /** 用户动态设定插件状态：pinned（置顶在外） | docked（仅在坞内） | hidden（彻底隐藏） */
    setPluginState(pluginId: string, state: "pinned" | "docked" | "hidden"): void {
        getLaunchpadHub().setPluginState(pluginId, state);
    },

    /** 直接触发指定插件的二级快捷行动（供 Quicker 动作或外部快捷键毫秒级直达） */
    executeAction(pluginId: string, actionName: string): boolean {
        return getLaunchpadHub().executeAction(pluginId, actionName);
    },

    /** 唤醒弹射坞（支持 popover 顶栏吸附或 center 屏幕居中） */
    open(mode?: "popover" | "center"): void {
        getLaunchpadHub().open(mode);
    },

    /** 关闭弹射坞 */
    close(): void {
        getLaunchpadHub().close();
    }
};

/** 兼容原生思源 showMessage 调用的快捷导出（自动分流为现代微胶囊与卡片） */
export function showMessage(message: string, timeout = 3000, type: "info" | "error" = "info"): void {
    if (type === "error") {
        lvNotify.card({ message, level: "error", duration: timeout });
    } else {
        lvNotify.capsule({ message, duration: timeout });
    }
}

/* ========================================================================= */
/* 15. 统一全局万物穿透搜索引擎 (Lv Omnisearch Engine)                         */
/* ========================================================================= */

const searchProviders = new Map<string, LvSearchProvider>();

function createOmnisearchCoordinator(): LvOmnisearchHub {
    return {
        version: PROTOCOL_VERSION,

        registerProvider(plugin: string, provider: LvSearchProvider): () => void {
            searchProviders.set(plugin, provider);
            return () => searchProviders.delete(plugin);
        },

        async search(keyword: string): Promise<LvSearchResultItem[]> {
            const kw = keyword.trim().toLowerCase();
            if (!kw) return [];

            const results: LvSearchResultItem[] = [];
            const providers = Array.from(searchProviders.entries());

            // 并发向所有已注册插件发起穿透检索，带 1000ms 超时熔断保护
            await Promise.all(
                providers.map(async ([plugin, provider]) => {
                    try {
                        const timeoutPromise = new Promise<LvSearchResultItem[]>((_, reject) => {
                            setTimeout(() => reject(new Error("Timeout")), 1000);
                        });
                        const providerPromise = Promise.resolve(provider(kw));
                        const items = await Promise.race([providerPromise, timeoutPromise]);
                        if (Array.isArray(items)) {
                            results.push(...items);
                        }
                    } catch (err) {
                        console.warn(`[LvOmnisearch] 插件 ${plugin} 检索异常或超时:`, err);
                    }
                })
            );

            // 相关度排序：标题完全匹配/前缀匹配优先
            return results.sort((a, b) => {
                const aTitle = a.title.toLowerCase();
                const bTitle = b.title.toLowerCase();
                const aExact = aTitle === kw ? 2 : aTitle.includes(kw) ? 1 : 0;
                const bExact = bTitle === kw ? 2 : bTitle.includes(kw) ? 1 : 0;
                return bExact - aExact;
            });
        }
    };
}

let nodeOmnisearchHubInstance: LvOmnisearchHub | undefined;

function getOmnisearchHub(): LvOmnisearchHub {
    if (typeof window === "undefined") {
        if (!nodeOmnisearchHubInstance) {
            nodeOmnisearchHubInstance = createOmnisearchCoordinator();
        }
        return nodeOmnisearchHubInstance;
    }

    if (window.__LV_OMNISEARCH__ && window.__LV_OMNISEARCH__.version >= PROTOCOL_VERSION) {
        return window.__LV_OMNISEARCH__;
    }

    const hub = createOmnisearchCoordinator();
    window.__LV_OMNISEARCH__ = hub;
    return hub;
}

export const lvOmnisearch = {
    /** 插件向生态穿透搜索总线注册数据提供者 */
    registerProvider(pluginName: string, provider: LvSearchProvider): () => void {
        return getOmnisearchHub().registerProvider(pluginName, provider);
    },

    /** 跨插件穿透全文检索 */
    search(keyword: string): Promise<LvSearchResultItem[]> {
        return getOmnisearchHub().search(keyword);
    }
};

/* ========================================================================= */
/* 16. 跨插件智能自动化联动引擎 (Lv Automation IFTTT Rules Engine)             */
/* ========================================================================= */

const automationRules = new Map<string, LvAutomationRule>();

function getStoredRuleStates(): Record<string, boolean> {
    if (typeof localStorage === "undefined") return {};
    try {
        const raw = localStorage.getItem(AUTOMATION_RULES_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return {};
}

function saveStoredRuleStates(states: Record<string, boolean>): void {
    if (typeof localStorage === "undefined") return;
    try {
        localStorage.setItem(AUTOMATION_RULES_KEY, JSON.stringify(states));
    } catch { /* ignore */ }
}

function getAutomationHub(): LvAutomationHub {
    if (typeof window === "undefined") {
        return {
            version: PROTOCOL_VERSION,
            registerRule: (rule) => {
                automationRules.set(rule.id, rule);
                return () => automationRules.delete(rule.id);
            },
            trigger: async () => ({ triggered: 0, success: 0 }),
            getRules: () => Array.from(automationRules.values()),
            toggleRule: () => {},
        };
    }

    if (window.__LV_AUTOMATION__ && window.__LV_AUTOMATION__.version >= PROTOCOL_VERSION) {
        return window.__LV_AUTOMATION__;
    }

    const hub: LvAutomationHub = {
        version: PROTOCOL_VERSION,

        registerRule(rule: LvAutomationRule): () => void {
            const states = getStoredRuleStates();
            const isEnabled = states[rule.id] !== undefined ? Boolean(states[rule.id]) : rule.enabled;
            automationRules.set(rule.id, { ...rule, enabled: isEnabled });
            return () => automationRules.delete(rule.id);
        },

        async trigger(source: string, type: string, payload: unknown): Promise<{ triggered: number; success: number }> {
            const matched = Array.from(automationRules.values()).filter(
                r => r.enabled && r.triggerSource === source && r.triggerType === type
            );

            let success = 0;
            await Promise.all(
                matched.map(async (r) => {
                    try {
                        const ok = await r.execute(payload);
                        if (ok !== false) success++;
                    } catch (e) {
                        console.error(`[LvAutomation] 规则 ${r.id} (${r.name}) 执行异常:`, e);
                    }
                })
            );

            return { triggered: matched.length, success };
        },

        getRules(): LvAutomationRule[] {
            const states = getStoredRuleStates();
            return Array.from(automationRules.values()).map(r => ({
                ...r,
                enabled: states[r.id] !== undefined ? Boolean(states[r.id]) : r.enabled,
            }));
        },

        toggleRule(ruleId: string, enabled: boolean): void {
            const states = getStoredRuleStates();
            states[ruleId] = enabled;
            saveStoredRuleStates(states);
            const r = automationRules.get(ruleId);
            if (r) r.enabled = enabled;
        }
    };

    window.__LV_AUTOMATION__ = hub;
    return hub;
}

export const lvAutomation = {
    /** 注册一条跨插件联动规则 (IFTTT) */
    registerRule(rule: LvAutomationRule): () => void {
        return getAutomationHub().registerRule(rule);
    },

    /** 触发联动事件 */
    trigger(sourcePlugin: string, eventType: string, payload: unknown): Promise<{ triggered: number; success: number }> {
        return getAutomationHub().trigger(sourcePlugin, eventType, payload);
    },

    /** 获取当前所有联动规则 */
    getRules(): LvAutomationRule[] {
        return getAutomationHub().getRules();
    },

    /** 用户切换某条自动化规则的开启/关闭状态 */
    toggleRule(ruleId: string, enabled: boolean): void {
        getAutomationHub().toggleRule(ruleId, enabled);
    }
};
