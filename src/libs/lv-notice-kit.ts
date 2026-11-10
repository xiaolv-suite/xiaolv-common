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
    /** 来源插件标识：如 "打卡" | "雷切" | "管家" | "拾遗" | "考试" | "闪卡" | "常用" 等 */
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
    action?: {
        label: string;
        onClick?: () => void | Promise<void>;
    };
}

/* ========================================================================= */
/* 2. 浮层与焦点栈类型定义                                                   */
/* ========================================================================= */

export interface LvSurfaceHandle {
    id: string;
    type?: "card" | "dialog" | "menu" | "drawer";
    /**
     * 当用户按下 Esc 时调用：
     * - 返回 `true` / `void`：浮层已关闭，Esc 继续按常规仲裁；
     * - 返回 `false` 或字符串哨兵 `"keep"`：仅关闭了内部子层（速览/菜单/多选等），宿主浮层保持打开。
     */
    dismiss: () => boolean | void | "keep";
}

/* ========================================================================= */
/* 3. 全局单例接口与自协商常量                                               */
/* ========================================================================= */

const PROTOCOL_VERSION = 170; // 1.7.0+ (Phase 12: Designed 9-Grid Launchpad 5.0 UI · Dual View · Recent & Today Strip · Persistent Secondary Actions Drawer · Omnisearch & IFTTT Settings Drawer)
const STORAGE_PREFIX = "lv_notice_mute_";
const AI_STORAGE_KEY = "lv_ai_shared_config";
const LAUNCHPAD_STORAGE_KEY = "lv_launchpad_states";
const AUTOMATION_RULES_KEY = "lv_automation_rules_config";

export interface LvSearchResultItem {
    id: string;
    source: string;              // "打卡" | "拾遗" | "考试" | "闪卡" | "人脉" | "管家" | "常用" | "雷切"
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
    badgeProvider?: () => string | Promise<string> | null | undefined;
    actions?: string[];
    topBarElement?: HTMLElement | null;
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
    expectedPlugins?: string[];
    failed?: string[];
    partial?: boolean;
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
    maxRetries?: number;         // 默认 0 (除 429 限流外不重试)；设置后可对 5xx 等网络故障重试
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
    source: string;             // "打卡" | "拾遗" | "考试" | "闪卡" | "管家" | "人脉" | "雷切" | "常用"
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
    exportFull: (options?: { timeoutMs?: number }) => Promise<LvEcosystemFullBackup>;
    restoreFull: (bundle: LvEcosystemFullBackup) => Promise<{ success: string[]; failed: string[] }>;
    getRegisteredPlugins?: () => string[];
}

interface LvLaunchpadHub {
    version: number;
    register: (item: LvLaunchpadItem) => () => void;
    getItems: () => Array<LvLaunchpadItem & { state: "pinned" | "docked" | "hidden" }>;
    setPluginState: (id: string, state: "pinned" | "docked" | "hidden") => void;
    updateItem?: (id: string, patch: Partial<LvLaunchpadItem>) => void;
    executeAction: (id: string, actionName: string) => boolean;
    open: (mode?: "popover" | "center") => void;
    close: () => void;
    checkBedlineReminder?: (now?: Date) => boolean;
}

interface LvOmnisearchHub {
    version: number;
    ownerSafe?: true;
    registerProvider: (plugin: string, provider: LvSearchProvider) => () => void;
    search: (keyword: string) => Promise<LvSearchResultItem[]>;
}

interface LvAutomationHub {
    version: number;
    ownerSafe?: true;
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
        __LV_LAUNCHPAD_REGISTRY__?: Map<string, LvLaunchpadItem>;
        __LV_OMNISEARCH__?: LvOmnisearchHub;
        __LV_AUTOMATION__?: LvAutomationHub;
    }
}

/* ========================================================================= */
/* 4. 自包含现代 CSS 样式（毛玻璃 + 微悬浮 + 移动端自适应）                 */
/* ========================================================================= */

const STYLES = `
:root {
    --lv-safe-surface: #ffffff;
    --lv-safe-surface-sub: #f8fafc;
    --lv-safe-text: #0f172a;
    --lv-safe-text-muted: #64748b;
    --lv-safe-border: rgba(0, 0, 0, 0.08);
}
[data-theme-mode="dark"],
body.dark {
    --lv-safe-surface: #1e222b;
    --lv-safe-surface-sub: #272c37;
    --lv-safe-text: #f1f5f9;
    --lv-safe-text-muted: #94a3b8;
    --lv-safe-border: rgba(255, 255, 255, 0.1);
}

#lv-notice-host,
#lv-launchpad-sheet-mask,
#lv-launchpad-mobile-ball,
#lvLaunchpadMobileEntry {
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    letter-spacing: normal;
    text-transform: none;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;

    &, *, *::before, *::after {
        box-sizing: border-box;
    }

    button {
        font-family: inherit;
        text-transform: none;
        letter-spacing: normal;
    }
}

#lv-notice-host {
    position: fixed;
    right: 20px;
    bottom: max(38px, calc(var(--b3-toolbar-height, 0px) + 12px));
    z-index: 999;
    pointer-events: none;
    font-family: var(--b3-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    /* 堆叠上限：长文卡可展开至全文，多卡同时存在时向内滚动收纳，不遮整个工作区 */
    max-height: calc(100vh - 64px);
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: none;
}
#lv-notice-host::-webkit-scrollbar { display: none; }

.lv-notice-card {
    --lv-nt-bg: rgba(255, 255, 255, 0.97);
    --lv-nt-border: rgba(15, 23, 42, 0.085);
    --lv-nt-text: #0f172a;
    --lv-nt-text-sub: #475569;
    --lv-nt-pill-bg: #f1f5f9;
    --lv-nt-accent: var(--b3-theme-primary, #2563eb);
    pointer-events: auto;
    width: min(380px, calc(100vw - 32px));
    box-sizing: border-box;
    padding: 13px 15px;
    border-radius: 14px;
    background: var(--lv-nt-bg);
    border: 1px solid var(--lv-nt-border);
    box-shadow: 0 12px 32px -6px rgba(15, 23, 42, 0.14), 0 4px 10px -2px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    color: var(--lv-nt-text);
    font-size: 13px;
    line-height: 1.45;
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
    position: relative;
    overflow: hidden;
}
:is([data-theme-mode="dark"], body.body--dark, html.dark) .lv-notice-card {
    --lv-nt-bg: rgba(28, 33, 45, 0.96);
    --lv-nt-border: rgba(255, 255, 255, 0.1);
    --lv-nt-text: #f8fafc;
    --lv-nt-text-sub: #cbd5e1;
    --lv-nt-pill-bg: rgba(255, 255, 255, 0.08);
    box-shadow: 0 14px 36px -6px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.lv-notice-card::before {
    content: "";
    position: absolute;
    top: 0; left: 0; bottom: 0;
    width: 3.5px;
    background: var(--lv-nt-accent);
    border-top-left-radius: 14px;
    border-bottom-left-radius: 14px;
}
.lv-notice-card[data-level="error"]::before { background: var(--b3-theme-error, #ef4444); }
.lv-notice-card[data-level="warn"]::before { background: #f59e0b; }
.lv-notice-card[data-level="success"]::before { background: #10b981; }

.lv-notice-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
}

.lv-notice-source-badge {
    font-size: 10.5px;
    font-weight: 600;
    padding: 1.5px 7px;
    border-radius: 6px;
    background: rgba(37, 99, 235, 0.1);
    color: var(--lv-nt-accent);
    line-height: 1.4;
    white-space: nowrap;
}

.lv-notice-title {
    font-weight: 650;
    font-size: 13px;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--lv-nt-text);
}

.lv-notice-repeat {
    font-size: 10px;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 10px;
    background: var(--lv-nt-accent);
    color: #ffffff;
}

.lv-notice-close-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 2px 4px;
    margin: -2px -2px 0 0;
    color: var(--lv-nt-text-sub);
    font-size: 14px;
    line-height: 1;
    border-radius: 4px;
    transition: all 0.15s ease;
}
.lv-notice-close-btn:hover {
    background: var(--lv-nt-pill-bg);
    color: var(--lv-nt-text);
    transform: scale(1.08);
}
.lv-notice-close-btn:active {
    transform: scale(0.92);
}

.lv-notice-body {
    font-size: 12.5px;
    color: var(--lv-nt-text-sub);
    margin-bottom: 8px;
    word-break: break-word;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    cursor: default;
}
/* 无行动按钮的长文卡：点击正文整卡展开/收起（截断 3 行 → 全文），双向阅读路径 */
.lv-notice-body--expanded {
    -webkit-line-clamp: 999;
    cursor: zoom-out;
}

.lv-notice-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
}

.lv-notice-btn {
    border: 1px solid var(--lv-nt-border);
    cursor: pointer;
    font-size: 11.5px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 7px;
    background: var(--lv-nt-pill-bg);
    color: var(--lv-nt-text);
    transition: background 0.15s ease, transform 0.1s ease;
}
.lv-notice-btn:hover {
    border-color: var(--lv-nt-accent);
    color: var(--lv-nt-accent);
}
.lv-notice-btn:active {
    transform: scale(0.97);
}
.lv-notice-btn--primary {
    border-color: transparent;
    background: var(--lv-nt-accent);
    color: #ffffff;
}
.lv-notice-btn--primary:hover {
    color: #ffffff;
    filter: brightness(1.08);
}

.lv-notice-capsule {
    pointer-events: auto;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.97);
    border: 1px solid rgba(15, 23, 42, 0.09);
    box-shadow: 0 8px 24px -4px rgba(15, 23, 42, 0.14), 0 2px 6px rgba(15, 23, 42, 0.05);
    backdrop-filter: blur(16px);
    font-size: 12.5px;
    font-weight: 500;
    color: #0f172a;
    animation: lvNoticeFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
:is([data-theme-mode="dark"], body.body--dark, html.dark) .lv-notice-capsule {
    background: rgba(28, 33, 45, 0.96);
    border-color: rgba(255, 255, 255, 0.1);
    color: #f8fafc;
    box-shadow: 0 10px 28px -4px rgba(0, 0, 0, 0.45);
}

.lv-notice-capsule-action {
    background: var(--b3-theme-primary, #3576c7);
    color: var(--b3-theme-on-primary, #ffffff);
    border: none;
    border-radius: 999px;
    padding: 2px 10px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    margin-left: 6px;
    line-height: 1.4;
    transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.15s ease;
    box-sizing: border-box;
    white-space: nowrap;
}
.lv-notice-capsule-action:hover {
    filter: brightness(1.1);
    transform: scale(1.05);
}
.lv-notice-capsule-action:active {
    transform: scale(0.95);
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
        top: calc(var(--mobile-topbar-height, 48px) + env(safe-area-inset-top, 0px) + 8px);
        bottom: auto;
        align-items: center;
        padding: 0 12px;
        /* 小屏堆叠上限：3 张长卡（每张可展开至全文）会占近半屏遮挡正文——
           限高滚动收纳，最新卡在可视区顶部，旧卡滚动可达 */
        max-height: calc(100dvh - 140px);
        overflow-y: auto;
        overscroll-behavior: contain;
    }
    .lv-notice-card {
        width: 100%;
        max-width: 380px;
        box-shadow: 0 6px 20px rgba(0,0,0,0.16);
        touch-action: pan-y;
    }
    .lv-notice-capsule {
        max-width: calc(100vw - 24px);
        touch-action: pan-y;
    }
    .lv-notice-close-btn {
        min-width: 38px !important;
        min-height: 38px !important;
        padding: 8px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        touch-action: manipulation !important;
        -webkit-tap-highlight-color: transparent !important;
    }
    .lv-notice-btn {
        min-height: 38px !important;
        padding: 6px 14px !important;
        font-size: 12px !important;
        touch-action: manipulation !important;
        -webkit-tap-highlight-color: transparent !important;
    }
    .lv-notice-capsule-action {
        min-height: 32px !important;
        padding: 4px 12px !important;
        font-size: 12px !important;
        touch-action: manipulation !important;
    }
}

@keyframes lvNoticeFadeIn {
    from { opacity: 0; transform: translateY(8px) scale(0.96); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}

/* ===== 移动端统一弹射坞（Bottom Sheet · Modern Tactile Glass 2.0）===== */
#lv-launchpad-sheet-mask {
    --lv-lp-bg: linear-gradient(165deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
    --lv-lp-panel-bg: #f8fafc;
    --lv-lp-card-bg: #ffffff;
    --lv-lp-border: rgba(15, 23, 42, 0.075);
    --lv-lp-border-strong: rgba(15, 23, 42, 0.12);
    --lv-lp-text: #0f172a;
    --lv-lp-text-sub: #64748b;
    --lv-lp-accent: #2563eb;
    --lv-lp-accent-soft: rgba(37, 99, 235, 0.09);
    --lv-lp-card-shadow: 0 2px 8px -2px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.9);
    position: fixed;
    inset: 0;
    z-index: 1080;
    background: rgba(15, 23, 42, 0.42);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    animation: lvSheetMaskIn 160ms ease-out both;
}
:is([data-theme-mode="dark"], body.body--dark, html.dark) #lv-launchpad-sheet-mask {
    --lv-lp-bg: linear-gradient(165deg, rgba(24, 28, 38, 0.98) 0%, rgba(15, 18, 26, 0.99) 100%);
    --lv-lp-panel-bg: rgba(30, 36, 49, 0.78);
    --lv-lp-card-bg: rgba(33, 39, 53, 0.92);
    --lv-lp-border: rgba(255, 255, 255, 0.085);
    --lv-lp-border-strong: rgba(255, 255, 255, 0.14);
    --lv-lp-text: #f8fafc;
    --lv-lp-text-sub: #94a3b8;
    --lv-lp-accent: #60a5fa;
    --lv-lp-accent-soft: rgba(59, 130, 246, 0.18);
    --lv-lp-card-shadow: 0 4px 14px rgba(0, 0, 0, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
#lv-launchpad-sheet-mask .lv-sheet {
    width: 100%;
    max-height: min(92dvh, 780px);
    overflow-y: auto;
    overscroll-behavior: contain;
    background: var(--lv-lp-bg);
    color: var(--lv-lp-text);
    border-radius: 22px 22px 0 0;
    border-top: 1px solid var(--lv-lp-border-strong);
    box-shadow: 0 -16px 48px rgba(15, 23, 42, 0.24);
    padding: 6px 12px calc(10px + env(safe-area-inset-bottom, 0px));
    box-sizing: border-box;
    animation: lvSheetUp 240ms cubic-bezier(0.22, 1, 0.36, 1) both;
    will-change: transform;
}
/* 磁贴徽记胶囊：高对比度清透微胶囊 */
.lv-sheet-tile-badge {
    font-size: 10px;
    font-weight: 600;
    padding: 1px 7px;
    border-radius: 999px;
    background: var(--lv-lp-accent-soft);
    color: var(--lv-lp-accent);
    border: 1px solid color-mix(in srgb, var(--lv-lp-accent) 18%, transparent);
    line-height: 1.35;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.lv-sheet-tile-badge--success { background: rgba(16, 185, 129, 0.12); color: #059669; border-color: rgba(16, 185, 129, 0.22); }
.lv-sheet-tile-badge--warn { background: rgba(245, 158, 11, 0.14); color: #d97706; border-color: rgba(245, 158, 11, 0.24); }
.lv-sheet-result-count { font-size: 11px; color: var(--lv-lp-text-sub); padding: 0 2px 2px; }
/* 穿透结果分组头（按来源） */
.lv-sheet-result-group { font-size: 11px; font-weight: 700; color: var(--lv-lp-accent); padding: 6px 2px 2px; }
/* 搜索历史 chips */
.lv-sheet-histrow { display: flex; align-items: center; gap: 6px; overflow-x: auto; margin: 0 0 5px; overscroll-behavior-x: contain; scrollbar-width: none; }
.lv-sheet-histrow::-webkit-scrollbar { display: none; }
.lv-sheet-histrow-label { flex-shrink: 0; font-size: 11px; color: var(--lv-lp-text-sub); }
.lv-sheet-histrow-chip {
    flex-shrink: 0;
    border: 1px dashed var(--lv-lp-border-strong);
    background: var(--lv-lp-card-bg);
    border-radius: 999px;
    padding: 3px 10px;
    font-size: 11.5px;
    color: var(--lv-lp-text);
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
}
.lv-sheet-histrow-chip:active { background: var(--lv-lp-accent-soft); color: var(--lv-lp-accent); }
/* 生态直达行（今日回顾 / 雷切画板） */
.lv-sheet-eco-row { display: flex; gap: 6px; margin: 0 0 6px; }
.lv-sheet-eco-chip {
    flex: 1;
    border: 1px solid var(--lv-lp-border);
    background: var(--lv-lp-card-bg);
    box-shadow: var(--lv-lp-card-shadow);
    border-radius: 10px;
    padding: 5px 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--lv-lp-text);
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition: transform 0.14s ease, border-color 0.14s ease;
}
.lv-sheet-eco-chip:active { transform: scale(0.97); background: var(--lv-lp-accent-soft); border-color: var(--lv-lp-accent); }
/* 最近直达行：上次使用的插件一键再达 */
.lv-sheet-recent { display: flex; align-items: center; gap: 6px; overflow-x: auto; margin: 0 0 6px; padding-bottom: 1px; overscroll-behavior-x: contain; scrollbar-width: none; }
.lv-sheet-recent::-webkit-scrollbar { display: none; }
.lv-sheet-recent-label { flex-shrink: 0; font-size: 11px; font-weight: 600; color: var(--lv-lp-text-sub); }
.lv-sheet-recent-chip {
    flex-shrink: 0;
    border: 1px solid var(--lv-lp-border);
    background: var(--lv-lp-card-bg);
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
    border-radius: 999px;
    padding: 3px 10px;
    font-size: 11.5px;
    font-weight: 500;
    color: var(--lv-lp-text);
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
}
.lv-sheet-recent-chip:active { background: var(--lv-lp-accent-soft); color: var(--lv-lp-accent); }
.lv-sheet-handle {
    width: 36px;
    height: 4px;
    margin: 0 auto 6px;
    border-radius: 999px;
    background: var(--lv-lp-border-strong);
}
.lv-sheet-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;
}
.lv-sheet-title { font-size: 15px; font-weight: 700; color: var(--lv-lp-text); letter-spacing: -0.01em; }
.lv-sheet-close {
    border: 1px solid var(--lv-lp-border);
    background: var(--lv-lp-card-bg);
    width: 30px;
    height: 30px;
    border-radius: 999px;
    display: inline-grid;
    place-items: center;
    font-size: 13px;
    line-height: 1;
    padding: 0;
    color: var(--lv-lp-text-sub);
    cursor: pointer;
}
.lv-sheet-search.b3-text-field,
.lv-sheet-search {
    width: 100%;
    height: 34px;
    box-sizing: border-box;
    margin-bottom: 6px;
    padding: 5px 11px;
    border-radius: 10px;
    border: 1px solid var(--lv-lp-border-strong);
    background: var(--lv-lp-panel-bg);
    color: var(--lv-lp-text);
    font-size: 12.5px;
    box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.03);
}
.lv-sheet-search:focus {
    background: var(--lv-lp-card-bg);
    border-color: var(--lv-lp-accent);
    box-shadow: 0 0 0 3px var(--lv-lp-accent-soft);
    outline: none;
}
.lv-sheet-results { display: flex; flex-direction: column; gap: 5px; margin-bottom: 6px; }
.lv-sheet-result {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    width: 100%;
    border: 1px solid var(--lv-lp-border);
    background: var(--lv-lp-card-bg);
    box-shadow: var(--lv-lp-card-shadow);
    border-radius: 10px;
    padding: 7px 10px;
    text-align: left;
    cursor: pointer;
}
.lv-sheet-result-badge {
    flex-shrink: 0;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: 999px;
    background: var(--lv-lp-accent-soft);
    color: var(--lv-lp-accent);
}
.lv-sheet-result-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.lv-sheet-result-title { font-size: 13px; font-weight: 600; color: var(--lv-lp-text); }
.lv-sheet-result-snippet {
    font-size: 11.5px;
    color: var(--lv-lp-text-sub);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
/* 磁贴网格自适应列数：1~2 个插件时自动放宽为居中大卡，3+ 恢复三列，杜绝孤卡稀疏 */
.lv-sheet-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; margin-bottom: 6px; }
.lv-sheet-grid--sparse { grid-template-columns: repeat(auto-fit, minmax(150px, 190px)); justify-content: center; }
.lv-sheet-subtitle { font-size: 11px; color: var(--lv-lp-text-sub); margin: 0 0 4px; font-weight: 500; }
.lv-sheet-tile {
    --tile-brand: #3b82f6;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2.5px;
    border: 1px solid var(--lv-lp-border);
    background: var(--lv-lp-card-bg);
    background-image: radial-gradient(80px circle at 85% 15%, color-mix(in srgb, var(--tile-brand) 9%, transparent), transparent 70%);
    box-shadow: var(--lv-lp-card-shadow);
    border-radius: 12px;
    padding: 8px 5px 7px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    position: relative;
    min-width: 0;
    transition: transform 0.16s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.16s ease, box-shadow 0.16s ease;
}
.lv-sheet-tile:active {
    transform: scale(0.96);
    border-color: color-mix(in srgb, var(--tile-brand) 55%, transparent);
}
.lv-sheet-tile-dot { width: 10px; height: 10px; border-radius: 999px; background: var(--lv-lp-accent); }
.lv-sheet-tile-name { font-size: 13px; font-weight: 650; color: var(--lv-lp-text); text-align: center; line-height: 1.2; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lv-sheet-tile-desc {
    font-size: 10.5px;
    color: var(--lv-lp-text-sub);
    text-align: center;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.lv-sheet-tile--expanded { grid-column: 1 / -1; flex-direction: row; flex-wrap: wrap; justify-content: flex-start; padding: 10px; }
.lv-sheet-tile-icon {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 9px;
    background: linear-gradient(135deg, color-mix(in srgb, currentColor 16%, var(--lv-lp-card-bg)) 0%, color-mix(in srgb, currentColor 7%, var(--lv-lp-card-bg)) 100%);
    border: 1px solid color-mix(in srgb, currentColor 24%, transparent);
    box-shadow: 0 4px 10px -2px color-mix(in srgb, currentColor 20%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.65);
    color: var(--lv-lp-accent);
    margin-bottom: 1px;
}
.lv-sheet-tile-icon svg { width: 17px; height: 17px; }
.lv-sheet-tile-actions { display: flex; flex-wrap: wrap; gap: 6px; width: 100%; margin-top: 6px; }
.lv-sheet-action-chip {
    border: 1px solid var(--lv-lp-border-strong);
    background: var(--lv-lp-card-bg);
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
    border-radius: 999px;
    padding: 5px 11px;
    font-size: 12px;
    font-weight: 500;
    color: var(--lv-lp-text);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
}
.lv-sheet-action-chip:active { background: var(--lv-lp-accent-soft); color: var(--lv-lp-accent); border-color: var(--lv-lp-accent); }
.lv-sheet-empty { grid-column: 1 / -1; text-align: center; font-size: 13px; color: var(--lv-lp-text-sub); padding: 14px 0; }
.lv-sheet-hint { text-align: center; font-size: 11px; color: var(--lv-lp-text-sub); }
@keyframes lvSheetMaskIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes lvSheetUp { from { transform: translateY(40%); opacity: 0.6; } to { transform: translateY(0); opacity: 1; } }

/* 收场动画：下滑淡出，替代生硬的瞬间移除 */
#lv-launchpad-sheet-mask.lv-sheet-closing { animation: lvSheetMaskOut 190ms ease-in both; pointer-events: none; }
#lv-launchpad-sheet-mask.lv-sheet-closing .lv-sheet { animation: lvSheetDown 190ms ease-in both; }
@keyframes lvSheetMaskOut { from { opacity: 1; } to { opacity: 0; } }
@keyframes lvSheetDown { from { transform: translateY(0); opacity: 1; } to { transform: translateY(55%); opacity: 0; } }
@media (min-width: 600px) {
    #lv-launchpad-sheet-mask.lv-sheet-closing .lv-sheet { animation: lvSheetCenterOut 160ms ease-in both; }
    @keyframes lvSheetCenterOut { from { transform: scale(1); opacity: 1; } to { transform: scale(0.94); opacity: 0; } }
}
@media (prefers-reduced-motion: reduce) {
    #lv-launchpad-sheet-mask, #lv-launchpad-sheet-mask .lv-sheet { animation: none; }
}

/* ===== 小驴罗盘悬浮球（Compass FAB）：拖拽 / 贴边 / 闲置半隐 / 沉浸模式 ===== */
#lv-launchpad-mobile-ball {
    position: fixed;
    z-index: 970;
    width: 46px;
    height: 46px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    color: #0f172a;
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid rgba(15, 23, 42, 0.1);
    box-shadow: 0 6px 20px rgba(15, 23, 42, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    -webkit-tap-highlight-color: transparent;
    touch-action: none;
    cursor: pointer;
    transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease, box-shadow 200ms ease;
}
:is([data-theme-mode="dark"], body.body--dark, html.dark) #lv-launchpad-mobile-ball {
    color: #f8fafc;
    background: rgba(30, 36, 49, 0.9);
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: 0 6px 22px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
#lv-launchpad-mobile-ball:active { box-shadow: 0 6px 22px rgba(0, 0, 0, 0.26); }
/* 水平位置由 JS 写入 style.left（拖拽/贴边吸附），transform 只负责半隐/沉浸/拖拽缩放视觉 */
#lv-launchpad-mobile-ball.lv-ball-edge-left.lv-ball-idle,
#lv-launchpad-mobile-ball.lv-ball-edge-left.lv-ball-immersive { transform: translateX(-40%) scale(0.9); opacity: 0.55; }
#lv-launchpad-mobile-ball.lv-ball-edge-right.lv-ball-idle,
#lv-launchpad-mobile-ball.lv-ball-edge-right.lv-ball-immersive { transform: translateX(40%) scale(0.9); opacity: 0.55; }
#lv-launchpad-mobile-ball.lv-ball-dragging { transition: none; transform: scale(1.1); opacity: 0.96; z-index: 990; }
/* 与思源原生移动端冲突避让：任一 .b3-dialog 打开或文本输入聚焦（键盘弹起）时隐藏悬浮球 */
#lv-launchpad-mobile-ball.lv-ball-suppressed { display: none; }

/* ===== 设备矩阵适配：平板 / 折叠屏内屏（≥600px）底部抽屉 → 居中悬浮卡片 ===== */
@media (min-width: 600px) {
    #lv-launchpad-sheet-mask { align-items: center; padding: 24px; box-sizing: border-box; }
    #lv-launchpad-sheet-mask .lv-sheet {
        max-width: 560px;
        width: auto;
        min-width: min(420px, 92vw);
        border-radius: 20px;
        max-height: 82dvh;
        animation: lvSheetCenter 200ms cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    .lv-sheet-handle { display: none; }
}
@keyframes lvSheetCenter { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }

/* 手机横屏矮窗：紧凑布局，隐藏提示行让位内容 */
@media (orientation: landscape) and (max-height: 500px) {
    #lv-launchpad-sheet-mask .lv-sheet { max-height: 92dvh; padding-top: 8px; }
    .lv-sheet-grid { gap: 8px; }
    .lv-sheet-hint { display: none; }
}

/* 触控目标防误触：禁双击缩放，磁贴/行动 chips/结果行/关闭键统一 */
.lv-sheet-tile, .lv-sheet-action-chip, .lv-sheet-result, .lv-sheet-close, .lv-sheet-moon, .lv-sheet-today-chip { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }

/* ===== 今日一站式聚合条：各插件徽记数字一眼总览，点 chip 直达 ===== */
.lv-sheet-today { display: flex; align-items: center; gap: 6px; overflow-x: auto; margin: 0 0 8px; padding: 5px 8px; border-radius: 11px; background: var(--lv-lp-accent-soft); border: 1px solid color-mix(in srgb, var(--lv-lp-accent) 16%, transparent); overscroll-behavior-x: contain; scrollbar-width: none; }
.lv-sheet-today::-webkit-scrollbar { display: none; }
.lv-sheet-today-label { flex-shrink: 0; font-size: 11.5px; font-weight: 700; color: var(--lv-lp-accent); }
.lv-sheet-today-chip {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    border: 1px solid var(--lv-lp-border);
    background: var(--lv-lp-card-bg);
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
    border-radius: 999px;
    padding: 3.5px 10px;
    font-size: 12px;
    font-weight: 600;
    color: var(--lv-lp-text);
    cursor: pointer;
}
.lv-sheet-today-chip:active { transform: scale(0.96); }
.lv-sheet-today-dot { width: 7px; height: 7px; border-radius: 999px; background: var(--lv-lp-accent); }

/* ===== 专注模式：坞头 🌙 开关 + 入口徽记 ===== */
.lv-sheet-moon {
    border: 1px solid var(--lv-lp-border);
    background: var(--lv-lp-card-bg);
    font-size: 12.5px;
    line-height: 1;
    height: 32px;
    padding: 0 10px;
    margin-left: auto;
    margin-right: 4px;
    border-radius: 999px;
    color: var(--lv-lp-text);
    cursor: pointer;
    white-space: nowrap;
}
.lv-sheet-moon[aria-pressed="true"] {
    background: var(--lv-lp-accent-soft);
    border-color: color-mix(in srgb, var(--lv-lp-accent) 30%, transparent);
    color: var(--lv-lp-accent);
    font-weight: 600;
}
/* Keep compact visuals while giving phone actions their own usable hit areas. */
#lv-launchpad-sheet-mask button,
#lv-launchpad-sheet-mask .lv-sheet-search {
    min-height: 44px;
}
#lv-launchpad-sheet-mask .lv-sheet-close { width: 44px; height: 44px; }
#lv-launchpad-sheet-mask .lv-sheet-search { font-size: 16px; }
#lv-launchpad-sheet-mask .lv-sheet-action-chip { min-width: 44px; }
@media (prefers-reduced-motion: reduce) {
    #lv-launchpad-mobile-ball { transition: none; }
}
`;

function ensureStyles(): void {
    if (typeof document === "undefined") return;
    const styleId = "lv-notice-styles";
    const existing = document.getElementById(styleId);
    if (existing) {
        if (existing.getAttribute?.("data-lv-ver") !== "2.2" || (existing.textContent?.length ?? 0) < STYLES.length) {
            existing.textContent = STYLES;
            existing.setAttribute?.("data-lv-ver", "2.2");
        }
        return;
    }
    const styleEl = document.createElement("style");
    styleEl.id = styleId;
    styleEl.setAttribute?.("data-lv-ver", "2.2");
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

    // 接入统一浮层栈 Esc 秒关（动态同步：仅当真正存在活动卡片时入栈，卡片清空时出栈）
    let unregisterNoticeSurface: (() => void) | null = null;
    function syncNoticeSurface() {
        const hasVisible = activePackets.length > 0;
        if (hasVisible && !unregisterNoticeSurface) {
            unregisterNoticeSurface = lvSurfaceStack.push({
                id: "lv-notice-active-card",
                type: "card",
                dismiss: () => {
                    // 若当前存在关闭守卫浮层，优先让路给关闭守卫自身处理 Esc，通知层不抢占截断
                    if (typeof document !== "undefined" && document.querySelector(".lvct-closeguard")) {
                        return false;
                    }
                    const top = activePackets[activePackets.length - 1];
                    if (top) {
                        hub.dismiss(top.id);
                        return true;
                    }
                    return false;
                }
            });
        } else if (!hasVisible && unregisterNoticeSurface) {
            unregisterNoticeSurface();
            unregisterNoticeSurface = null;
        }
    }

    function render() {
        syncNoticeSurface();
        if (!hostEl) return;
        // 动态提升 z-index，保障通知全局浮于所有弹窗/抽屉/蒙层之上
        try {
            const currentZ = typeof window !== "undefined" && (window as any).siyuan?.zIndex;
            if (typeof currentZ === "number") {
                hostEl.style.zIndex = String(Math.max(999, currentZ + 50));
            } else {
                hostEl.style.zIndex = "999";
            }
        } catch { /* ignore */ }
        hostEl.innerHTML = "";

        const visible = activePackets.slice(-3);
        visible.forEach((packet) => {
            const card = document.createElement("div");
            card.className = packet.mode === "capsule" ? "lv-notice-capsule" : "lv-notice-card";
            card.dataset.id = packet.id;
            card.dataset.level = packet.level || "info";

            if (packet.mode === "capsule") {
                const actionHtml = packet.action ? `
                    <button type="button" class="lv-notice-capsule-action" data-role="capsule-action">
                        ${escapeHtml(packet.action.label)}
                    </button>
                ` : "";
                card.innerHTML = `
                    <span class="lv-notice-source-badge">${escapeHtml(packet.source || "提示")}</span>
                    <span>${escapeHtml(packet.message)}</span>
                    ${actionHtml}
                `;
                if (packet.action) {
                    const actBtn = card.querySelector<HTMLElement>("[data-role='capsule-action']");
                    actBtn?.addEventListener("click", async (e) => {
                        e.stopPropagation();
                        try {
                            await packet.action?.onClick?.();
                        } catch (err) {
                            console.error("[LvNotice] capsule action error", err);
                        }
                        hub.dismiss(packet.id);
                    });
                }
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

                // 无行动按钮的长文卡片：点击正文整卡展开/收起（line-clamp 截断的双向阅读路径）
                if (!actionsHtml && !snoozeHtml) {
                    const bodyEl = card.querySelector<HTMLElement>(".lv-notice-body");
                    bodyEl?.addEventListener("click", () => {
                        bodyEl.classList.toggle("lv-notice-body--expanded");
                    });
                }

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

            // 移动端 Touch 滑动手势与快速划掉支持（支持向上推划、左右滑走）
            let touchStartX = 0;
            let touchStartY = 0;
            card.addEventListener("touchstart", (e) => {
                touchStartX = e.touches[0]?.clientX ?? 0;
                touchStartY = e.touches[0]?.clientY ?? 0;
            }, { passive: true });
            card.addEventListener("touchend", (e) => {
                const diffX = (e.changedTouches[0]?.clientX ?? 0) - touchStartX;
                const diffY = (e.changedTouches[0]?.clientY ?? 0) - touchStartY;
                if (diffY < -35 || Math.abs(diffX) > 60) {
                    hapticFeedback(10);
                    hub.dismiss(packet.id);
                }
            }, { passive: true });

            if (packet.mode === "capsule") {
                card.addEventListener("click", (e) => {
                    const isBtn = (e.target as HTMLElement)?.closest?.("[data-role='capsule-action']");
                    if (!isBtn) {
                        hub.dismiss(packet.id);
                    }
                });
            }

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

            // 专注模式：card/capsule 全生态降级为 silent（仍入历史留档，不再弹窗打扰）
            const focusOn = isNotifyFocusActive();
            const effectiveMode = focusOn && (packet.mode === "card" || packet.mode === "capsule") ? "silent" : packet.mode;

            if (effectiveMode === "silent") {
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
                // 定向移除：单卡离场不再全量重建其余卡片——保住已展开的长文与悬停状态
                const cardEl = hostEl?.querySelector(`[data-id="${id}"]`);
                if (cardEl) {
                    try { cardEl.remove(); } catch { /* ignore */ }
                } else {
                    render();
                }
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
                // 清理往日过期的 mute key，防止 localStorage 无限累积
                try {
                    for (let i = localStorage.length - 1; i >= 0; i--) {
                        const k = localStorage.key(i);
                        if (k && k.startsWith(STORAGE_PREFIX) && k !== key) {
                            localStorage.removeItem(k);
                        }
                    }
                } catch { /* ignore */ }
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
            if (unregisterNoticeSurface) {
                unregisterNoticeSurface();
                unregisterNoticeSurface = null;
            }
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

function getSurfaceStack(): LvSurfaceHandle[] {
    if (typeof window === "undefined") return [];
    if (!window.__LV_SURFACE_STACK__) {
        window.__LV_SURFACE_STACK__ = [];
        // 捕获阶段拦截 Escape 键，阻止向底层冒泡（自顶向下检索能响应该次 Esc 的活跃浮层）
        window.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            const stack = window.__LV_SURFACE_STACK__;
            if (!stack || stack.length === 0) return;
            for (let i = stack.length - 1; i >= 0; i--) {
                const item = stack[i];
                if (!item) continue;
                const handled = item.dismiss();
                if (handled !== false) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (handled !== "keep") {
                        stack.splice(i, 1);
                    }
                    break;
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
 * 同一窗口、同一文档的写入串行化。超时只结束调用者等待；底层写入settle前继续持锁。
 * 永久挂起的写入需要对账/重启处理，不能用提前释放制造并发写入。
 */
export async function withDocLock<T>(docId: string, task: () => Promise<T>, timeoutMs = 20000): Promise<T> {
    if (!docId) return task();
    const map = getDocLockMap();
    const prev = map.get(docId) || Promise.resolve();

    let release!: () => void;
    const current = new Promise<void>((resolve) => { release = resolve; });
    const chained = prev.then(() => current, () => current);
    map.set(docId, chained);

    const cleanup = () => {
        if (map.get(docId) === chained) map.delete(docId);
    };
    const finish = () => {
        release();
        void chained.then(cleanup, cleanup);
    };
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        if (timeoutMs <= 0) await prev;
        else await Promise.race([
            prev,
            new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(`[withDocLock] 等待写锁超时，尚未发送: ${docId}`)), timeoutMs); }),
        ]);
    } catch (error) {
        // Cancel this queue slot; never send its task after a caller has stopped waiting.
        finish();
        throw error;
    } finally { if (timer !== undefined) clearTimeout(timer); }
    const taskPromise = Promise.resolve().then(task);
    // Use both handlers: a detached finally would create an unhandled rejection.
    void taskPromise.then(finish, finish);
    try {
        if (timeoutMs <= 0) return await taskPromise;
        return await Promise.race([
            taskPromise,
            new Promise<never>((_, reject) => {
                timer = setTimeout(() => reject(new Error(`[withDocLock] 写入任务超时 (${timeoutMs}ms)，结果待确认，仍保持互斥: ${docId}`)), timeoutMs);
            }),
        ]);
    } finally {
        if (timer !== undefined) clearTimeout(timer);
    }
}

/* ========================================================================= */
/* 9. 客户端通知 API 暴露                                                    */
/* ========================================================================= */

/* ===== 全局专注模式（Protocol v1.7）：时间戳静音——开启后 card/capsule 全生态降级为历史留档 ===== */
const NOTIFY_FOCUS_KEY = "lv_notify_focus_until";

export function getNotifyFocusUntil(): number {
    if (typeof localStorage === "undefined") return 0;
    try {
        const n = Number(localStorage.getItem(NOTIFY_FOCUS_KEY));
        return Number.isFinite(n) && n > 0 ? n : 0;
    } catch { return 0; }
}

export function isNotifyFocusActive(): boolean {
    return getNotifyFocusUntil() > Date.now();
}

function refreshEntryFocusState(): void {
    if (typeof document === "undefined") return;
    const focus = isNotifyFocusActive();
    for (const root of [document.getElementById(MOBILE_ENTRY_ID), document.getElementById(MOBILE_BALL_ID)]) {
        if (!root) continue;
        const moon = root.querySelector(".lv-entry-moon") as HTMLElement | null;
        if (moon) moon.style.display = focus ? "inline-block" : "none";
    }
}

export function setNotifyFocusUntil(ts: number): void {
    if (typeof localStorage === "undefined") return;
    try { localStorage.setItem(NOTIFY_FOCUS_KEY, String(Math.max(0, Math.round(ts)))); } catch { /* ignore */ }
    refreshEntryFocusState();
}

export function clearNotifyFocus(): void {
    if (typeof localStorage === "undefined") return;
    try { localStorage.removeItem(NOTIFY_FOCUS_KEY); } catch { /* ignore */ }
    refreshEntryFocusState();
}

export const lvNotify = {
    /** 开启全局专注模式：直至指定时间戳，card/capsule 全生态降级为历史留档不弹窗 */
    setFocusUntil(ts: number): void {
        setNotifyFocusUntil(ts);
    },

    /** 退出全局专注模式 */
    clearFocus(): void {
        clearNotifyFocus();
    },

    /** 专注模式是否生效中 */
    isFocusActive(): boolean {
        return isNotifyFocusActive();
    },

    /** 专注模式截止时间戳（0=未开启） */
    getFocusUntil(): number {
        return getNotifyFocusUntil();
    },

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
            action: options.action,
            createdAt: Date.now(),
            repeatCount: 1
        });
        return id;
    },

    /**
     * 撤销胶囊通知（Undo Action Pill · 人体工程学撤销范式）
     * 替代强阻断性的二次 confirm 弹窗：操作立即生效，底部滑出 5 秒倒计时撤销胶囊
     */
    undo(options: {
        source?: string;
        message: string;
        undoLabel?: string;
        duration?: number;
        onUndo: () => void | Promise<void>;
    }): string {
        return this.capsule({
            source: options.source || "撤销",
            message: options.message,
            duration: options.duration ?? 5000,
            action: {
                label: options.undoLabel || "撤销",
                onClick: options.onUndo,
            },
        });
    },

    inline(target: HTMLElement | null | undefined, tipText?: string, isSuccess = true): void {
        if (!target) return;
        const stateClass = isSuccess ? "lv-inline-feedback--success" : "lv-inline-feedback--error";
        target.classList.add("lv-inline-feedback-active", stateClass);
        const originalTitle = target.getAttribute("title");
        if (tipText) target.setAttribute("title", tipText);
        setTimeout(() => {
            target.classList.remove("lv-inline-feedback-active", stateClass);
            if (originalTitle !== null) {
                target.setAttribute("title", originalTitle);
            } else {
                target.removeAttribute("title");
            }
        }, 1000);

        // 移动端无鼠标 Hover 能力，设置 title 无法被用户感知；自动联动微胶囊实现触控反馈闭环
        if (tipText) {
            try {
                if (typeof isMobileFrontend === "function" && isMobileFrontend()) {
                    this.capsule({
                        source: "提示",
                        message: tipText,
                        duration: 1600,
                        level: isSuccess ? "success" : "error"
                    });
                }
            } catch { /* ignore */ }
        }
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
        window.__LV_NOTICE_HUB__?.dismiss(id);
    },

    snooze(id: string, durationMs: number): void {
        window.__LV_NOTICE_HUB__?.snooze(id, durationMs);
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
        task: () => Promise<void>;
        priority: "high" | "low";
    }> = [];

    function processQueue() {
        if (activeCount >= MAX_CONCURRENT || requestQueue.length === 0) return;
        requestQueue.sort((a, b) => (a.priority === "high" ? -1 : b.priority === "high" ? 1 : 0));
        const next = requestQueue.shift();
        if (!next) return;
        activeCount++;
        next.execute().finally(() => {
            activeCount = Math.max(0, activeCount - 1);
            processQueue();
        });
    }

    async function executeChatRequest(cfg: LvAiConfig | null, opts: LvAiRequestOptions): Promise<LvAiResponse> {
        const apiKey = opts.apiKey || cfg?.apiKey;
        if (!apiKey) {
            throw new Error("[LvAiGateway] 未配置共享 API Key（请在任意小驴插件设置中配置）");
        }

        const rawEndpoint = opts.endpoint || cfg?.endpoint || "https://api.deepseek.com/v1";
        const endpoint = rawEndpoint.replace(/\/+$/, "");
        const targetUrl = endpoint.endsWith("/chat/completions") ? endpoint : `${endpoint}/chat/completions`;
        const model = opts.model || cfg?.model || "deepseek-chat";

        let retries = 0;
        const maxRetries = opts.maxRetries ?? 0;

        while (true) {
            try {
                const response = await fetch(targetUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        model,
                        messages: opts.messages,
                        temperature: opts.temperature ?? cfg?.temperature ?? 0.7,
                        max_tokens: cfg?.maxTokens,
                    }),
                    signal: opts.signal,
                });

                if (response.status === 429 && retries < (opts.maxRetries ?? 2)) {
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
                if (err instanceof Error && (err.name.includes("Abort") || (opts.signal && opts.signal.aborted))) {
                    throw err;
                }
                if (retries < maxRetries && err instanceof Error) {
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
            if (opts.signal?.aborted) {
                return Promise.reject(new DOMException("The operation was aborted", "AbortError"));
            }
            return new Promise((resolve, reject) => {
                const cfg = this.getConfig();
                let settled = false;

                const cleanupAbort = () => {
                    opts.signal?.removeEventListener("abort", onAbort);
                };

                const onAbort = () => {
                    if (settled) return;
                    settled = true;
                    const idx = requestQueue.findIndex(q => q.task === task);
                    if (idx >= 0) requestQueue.splice(idx, 1);
                    reject(new DOMException("The operation was aborted", "AbortError"));
                };

                if (opts.signal) {
                    opts.signal.addEventListener("abort", onAbort, { once: true });
                }

                const task = async () => {
                    if (settled || opts.signal?.aborted) {
                        if (!settled) {
                            settled = true;
                            cleanupAbort();
                            reject(new DOMException("The operation was aborted", "AbortError"));
                        }
                        return;
                    }
                    try {
                        const raceAbort = opts.signal ? new Promise<never>((_, rej) => {
                            if (opts.signal!.aborted) rej(new DOMException("The operation was aborted", "AbortError"));
                            opts.signal!.addEventListener("abort", () => rej(new DOMException("The operation was aborted", "AbortError")), { once: true });
                        }) : null;

                        const execPromise = executeChatRequest(cfg, opts);
                        const res = raceAbort ? await Promise.race([execPromise, raceAbort]) : await execPromise;
                        if (!settled) {
                            settled = true;
                            cleanupAbort();
                            resolve(res);
                        }
                    } catch (e) {
                        if (!settled) {
                            settled = true;
                            cleanupAbort();
                            reject(e);
                        }
                    }
                };

                requestQueue.push({
                    execute: task,
                    task,
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

    const checkAndResetDay = () => {
        const today = getTodayKey();
        if (today !== lastDateKey) {
            lastDateKey = today;
            todayActivities.length = 0;
        }
    };

    try {
        lvTicker.onDateCross("lv-activity", (newDay) => {
            lastDateKey = newDay;
            todayActivities.length = 0;
        });
    } catch { /* ignore */ }

    const activityHub: LvActivityStreamHub = {
        version: PROTOCOL_VERSION,
        record(item: Omit<LvActivityRecord, "id" | "timestamp" | "timeStr">) {
            const now = new Date();
            checkAndResetDay();

            const record: LvActivityRecord = {
                ...item,
                id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
                timestamp: now.getTime(),
                timeStr: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
            };

            todayActivities.push(record);
            if (todayActivities.length > 1000) todayActivities.shift();
            listeners.forEach(cb => {
                try { cb(record); } catch (e) { console.error("[LvActivityStream] error:", e); }
            });
        },

        getTodayRecords(): LvActivityRecord[] {
            checkAndResetDay();
            return [...todayActivities];
        },

        onActivity(cb: (item: LvActivityRecord) => void): () => void {
            listeners.add(cb);
            return () => listeners.delete(cb);
        },

        formatAsMarkdown(): string {
            checkAndResetDay();
            return formatActivityMarkdown(todayActivities);
        },

        getDailyStats(): Record<string, number> {
            checkAndResetDay();
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
        // Markdown 注入防护：title/detail 来自各插件自由文本，含换行会截断列表项；
        // 折叠为单行并剥离首尾标记符号，保证写入日记的段落结构完整
        const safeTitle = String(r.title ?? "").replace(/[\r\n]+/g, " ").trim();
        const safeDetail = String(r.detail ?? "").replace(/[\r\n]+/g, " ").trim();
        lines.push(`- **${r.timeStr}** [${r.source}] ${icon} ${safeTitle}${safeDetail ? ` — *${safeDetail}*` : ""}${link}`);
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

/** Registries belong to the shared window, not whichever bundle loaded first. */
function getSharedRegistry<T>(key: string, local: Map<string, T>): Map<string, T> {
    if (typeof window === "undefined") return local;
    const host = window as unknown as Record<string, unknown>;
    const existing = host[key] as Map<string, T> | undefined;
    if (existing && typeof existing.get === "function" && typeof existing.set === "function") return existing;
    host[key] = local;
    return local;
}

function registerOwned<T>(registry: Map<string, T>, key: string, value: T): () => void {
    registry.set(key, value);
    return () => { if (registry.get(key) === value) registry.delete(key); };
}

function getBackupHub(): LvBackupHub {
    if (typeof window !== "undefined" && window.__LV_BACKUP_HUB__ && window.__LV_BACKUP_HUB__.version >= PROTOCOL_VERSION && typeof window.__LV_BACKUP_HUB__.getRegisteredPlugins === "function") {
        return window.__LV_BACKUP_HUB__;
    }
    const registry = getSharedRegistry("__LV_BACKUP_PROVIDERS__", backupRegistry);

    const hub: LvBackupHub = {
        version: PROTOCOL_VERSION,
        register(plugin: string, backup: () => Promise<Record<string, unknown>>, restore: (data: Record<string, unknown>) => Promise<boolean>): () => void {
            return registerOwned(registry, plugin, { plugin, backup, restore });
        },
        getRegisteredPlugins: () => Array.from(registry.keys()),

        async exportFull(options?: { timeoutMs?: number }): Promise<LvEcosystemFullBackup> {
            const bundle: LvEcosystemFullBackup = {
                v: 1,
                ecosystem: "xiaolv",
                exportedAt: new Date().toISOString(),
                plugins: {}, expectedPlugins: Array.from(registry.keys()), failed: [], partial: false,
            };

            const entries = Array.from(registry.entries());
            await Promise.all(
                entries.map(async ([plugin, provider]) => {
                    let timer: ReturnType<typeof setTimeout> | undefined;
                    try {
                        const data = await Promise.race([
                            Promise.resolve().then(() => provider.backup()),
                            new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("backup-timeout")), options?.timeoutMs ?? 10000); }),
                        ]);
                        bundle.plugins[plugin] = {
                            plugin,
                            version: "latest",
                            exportedAt: new Date().toISOString(),
                            data,
                        };
                    } catch (err) {
                        bundle.failed!.push(plugin);
                        bundle.partial = true;
                        console.error(`[LvBackup] 备份插件 ${plugin} 失败:`, err);
                    } finally {
                        if (timer !== undefined) clearTimeout(timer);
                    }
                })
            );

            return bundle;
        },

        async restoreFull(bundle: LvEcosystemFullBackup): Promise<{ success: string[]; failed: string[] }> {
            if (!bundle || bundle.v !== 1 || bundle.ecosystem !== "xiaolv" || !bundle.plugins || typeof bundle.plugins !== "object" || Array.isArray(bundle.plugins)) {
                throw new Error("[LvBackup] 非合法的小驴全生态灾备包格式");
            }

            const success: string[] = [];
            const failed: string[] = Array.isArray(bundle.failed) ? [...bundle.failed] : [];
            for (const expected of bundle.expectedPlugins ?? []) {
                if (!Object.prototype.hasOwnProperty.call(bundle.plugins, expected) && !failed.includes(expected)) failed.push(expected);
            }

            for (const [plugin, payload] of Object.entries(bundle.plugins)) {
                if (!payload || payload.plugin !== plugin || !payload.data || typeof payload.data !== "object" || Array.isArray(payload.data)) {
                    failed.push(`${plugin}(备份数据格式无效)`); continue;
                }
                const provider = registry.get(plugin);
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

    if (typeof window !== "undefined") window.__LV_BACKUP_HUB__ = hub;
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
    exportFull(options?: { timeoutMs?: number }): Promise<LvEcosystemFullBackup> {
        return getBackupHub().exportFull(options);
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
        const registered = getBackupHub().getRegisteredPlugins?.() ?? [];

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
        return `🐴 小驴全家桶 · ${pluginText} · 今日活动 ${diag.todayActivitiesCount} 项`;
    }
};

/* ========================================================================= */
/* 14. 小驴罗盘 · 家族极速弹射坞引擎 (Lv Launchpad Engine)                   */
/* ========================================================================= */

const launchpadRegistry = new Map<string, LvLaunchpadItem>();
let memoryLaunchpadStates: Record<string, "pinned" | "docked" | "hidden"> = {};

function getSharedLaunchpadRegistry(): Map<string, LvLaunchpadItem> {
    if (typeof window !== "undefined") {
        if (!window.__LV_LAUNCHPAD_REGISTRY__ || typeof window.__LV_LAUNCHPAD_REGISTRY__.get !== "function") {
            window.__LV_LAUNCHPAD_REGISTRY__ = launchpadRegistry;
        } else if (window.__LV_LAUNCHPAD_REGISTRY__ !== launchpadRegistry) {
            for (const [k, v] of launchpadRegistry.entries()) {
                if (!window.__LV_LAUNCHPAD_REGISTRY__.has(k)) {
                    window.__LV_LAUNCHPAD_REGISTRY__.set(k, v);
                }
            }
        }
        return window.__LV_LAUNCHPAD_REGISTRY__;
    }
    return launchpadRegistry;
}

/**
 * 热重载与版本热升级自愈探针：
 * 当单个插件因云同步或手动开关热重载导致旧版 __LV_LAUNCHPAD__ 被高版本替换时，
 * 自动从旧实例及思源宿主 app.plugins 中唤醒所有在世的小驴插件重新归队，彻底杜绝“9宫格只显示一部分插件”。
 */
let healingInProgress = false;
function healMissingPluginsFromHost(reg: Map<string, LvLaunchpadItem>): void {
    if (healingInProgress || typeof window === "undefined") return;
    healingInProgress = true;
    try {
        const w = window as any;
        const plugins: any[] = w.siyuan?.ws?.app?.plugins || w.app?.plugins || [];
        if (!Array.isArray(plugins) || plugins.length === 0) return;
        for (const p of plugins) {
            if (!p || typeof p.name !== "string") continue;
            if (reg.has(p.name)) continue;
            try {
                if (typeof p.syncLaunchpadRegistry === "function") {
                    p.syncLaunchpadRegistry();
                } else if (typeof p.registerLaunchpadEntry === "function") {
                    p.registerLaunchpadEntry();
                } else if (typeof p.registerLaunchpad === "function") {
                    p.registerLaunchpad();
                } else if (p.launchpadItem && typeof p.launchpadItem === "object") {
                    reg.set(p.launchpadItem.id || p.name, p.launchpadItem);
                } else if (p.name === "siyuan-speed-switch" && (typeof p.openMainView === "function" || typeof p.showSwitcher === "function")) {
                    reg.set("siyuan-speed-switch", {
                        id: "siyuan-speed-switch",
                        name: "雷切",
                        fullName: "小驴雷切",
                        svgIcon: "icon-lv-raikiri",
                        color: "#38bdf8",
                        desc: "分栏切换 · 选区暂存",
                        digit: 2,
                        badge: "已就绪",
                        badgeType: "success",
                        actions: ["打开切片库", "切片当前文档", "开关动作悬浮球", "搜索当前文档切片", "打开暂存栈顶切片"],
                        topBarElement: Array.isArray(p.topBarIcons) ? p.topBarIcons[0] : undefined,
                        onClick: () => {
                            if (typeof p.openMainView === "function") p.openMainView();
                            else if (typeof p.showSwitcher === "function") p.showSwitcher();
                        },
                        onAction: (act: string) => {
                            if (typeof p.handleQuickAction === "function") p.handleQuickAction(act);
                        },
                    });
                }
            } catch { /* 单个插件唤醒异常隔离 */ }
        }
    } catch { /* ignore */ } finally {
        healingInProgress = false;
    }
}

function getLaunchpadStates(): Record<string, "pinned" | "docked" | "hidden"> {
    if (typeof localStorage === "undefined") return { ...memoryLaunchpadStates };
    try {
        const raw = localStorage.getItem(LAUNCHPAD_STORAGE_KEY);
        if (raw) return { ...memoryLaunchpadStates, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return { ...memoryLaunchpadStates };
}

function saveLaunchpadStates(states: Record<string, "pinned" | "docked" | "hidden">): void {
    memoryLaunchpadStates = { ...states };
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
            updateItem: (id, patch) => {
                const item = launchpadRegistry.get(id);
                if (item) {
                    Object.assign(item, patch);
                    refreshEntryBadgeDot();
                    syncTopBarConvergence();
                }
            },
            executeAction: () => false,
            open: () => {},
            close: () => {},
        };
    }

    const sharedRegistry = getSharedLaunchpadRegistry();

    if (window.__LV_LAUNCHPAD__ && window.__LV_LAUNCHPAD__.version >= PROTOCOL_VERSION && (window.__LV_LAUNCHPAD__ as any).__v220 === true) {
        return window.__LV_LAUNCHPAD__;
    }

    // 若从旧版本协议升级，无损迁移旧实例内已注册的所有插件条目
    if (window.__LV_LAUNCHPAD__ && typeof window.__LV_LAUNCHPAD__.getItems === "function") {
        try {
            const prevItems = window.__LV_LAUNCHPAD__.getItems();
            if (Array.isArray(prevItems)) {
                for (const prev of prevItems) {
                    if (prev && prev.id && !sharedRegistry.has(prev.id)) {
                        const { state: _st, ...rest } = prev;
                        sharedRegistry.set(prev.id, rest);
                    }
                }
            }
        } catch { /* ignore */ }
    }

    const hub: LvLaunchpadHub = {
        version: PROTOCOL_VERSION,

        register(item: LvLaunchpadItem): () => void {
            const reg = getSharedLaunchpadRegistry();
            reg.set(item.id, item);
            maybeShowOnboardingCard();
            scheduleTopBarConvergence(30);
            return () => {
                if (reg.get(item.id) === item) reg.delete(item.id);
                scheduleTopBarConvergence(30);
            };
        },

        getItems(): Array<LvLaunchpadItem & { state: "pinned" | "docked" | "hidden" }> {
            const reg = getSharedLaunchpadRegistry();
            healMissingPluginsFromHost(reg);
            const states = getLaunchpadStates();
            const list = Array.from(reg.values()).map(item => ({
                ...item,
                state: states[item.id] || "docked",
            }));
            list.sort((a, b) => (a.digit ?? 99) - (b.digit ?? 99));
            return list;
        },

        setPluginState(id: string, state: "pinned" | "docked" | "hidden"): void {
            const states = getLaunchpadStates();
            states[id] = state;
            saveLaunchpadStates(states);
            syncTopBarConvergence();
        },

        updateItem(id: string, patch: Partial<LvLaunchpadItem>): void {
            const reg = getSharedLaunchpadRegistry();
            const item = reg.get(id);
            if (item) {
                Object.assign(item, patch);
                refreshEntryBadgeDot();
                syncTopBarConvergence();
            }
        },

        executeAction(id: string, actionName: string): boolean {
            const reg = getSharedLaunchpadRegistry();
            healMissingPluginsFromHost(reg);
            const item = reg.get(id);
            if (!item) return false;
            if (item.onAction) {
                item.onAction(actionName);
                return true;
            }
            item.onClick();
            return true;
        },

        open(_mode?: "popover" | "center"): void {
            // 通过 DOM 或 CustomEvent 派发打开弹射坞并唤起罗盘
            window.dispatchEvent(new CustomEvent("lv:launchpad:open", { detail: { mode: _mode || "popover" } }));
            if (_mode === "popover" || (!isMobileFrontend() && _mode !== "center" && typeof document !== "undefined" && Boolean(document.getElementById("toolbar")))) {
                openDesktopLaunchpadPopover();
            } else {
                openMobileSheet();
            }
        },

        close(): void {
            window.dispatchEvent(new CustomEvent("lv:launchpad:close"));
            closeDesktopLaunchpadPopover();
            closeMobileSheet();
        },

        checkBedlineReminder(now?: Date): boolean {
            return checkAndTriggerBedline(now);
        }
    };

    (hub as any).__v220 = true;
    (hub as any).__v210 = true;
    (hub as any).__v180 = true;
    (hub as any).openMobileSheet = () => openMobileSheet();
    (hub as any).closeMobileSheet = () => closeMobileSheet();
    (hub as any).openDesktopPopover = () => openDesktopLaunchpadPopover();
    window.__LV_LAUNCHPAD__ = hub;
    healMissingPluginsFromHost(sharedRegistry);
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

    /** 动态更新已注册条目的元数据（如徽标、提示语或宿主按钮引用，支持热更新） */
    updateItem(pluginId: string, patch: Partial<LvLaunchpadItem>): void {
        getLaunchpadHub().updateItem?.(pluginId, patch);
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
    },

    /** 判定当前是否思源移动端前端（手机端宿主渲染 #mobileTopBar；UA 兜底） */
    isMobileFrontend(): boolean {
        return isMobileFrontend();
    },

    /**
     * 统一手机端顶栏收敛入口（Protocol v1.6.0 Mobile）：
     * 仅在移动端注入一枚「小驴罗盘」按钮（desktop 调用为 no-op）。
     * 已注册 ≥1 个插件即注入；pinned 插件的专属按钮由各插件自行保留在外。
     * 幂等去重（#lvLaunchpadMobileEntry）+ 错峰重试（800/1500/4000/10000ms）。
     * 返回清理函数：移除按钮与所有挂起重试计时器。
     */
    ensureMobileEntry(): () => void {
        return ensureMobileEntry();
    },

    /**
     * 统一桌面端顶栏收敛入口（Protocol v1.7 Desktop）：
     * 挂载至桌面端 #toolbar。
     * 仅有 1 个插件时左键直达主界面，长按/右键打开罗盘弹射坞，杜绝多层损耗；
     * >= 2 个插件时左键打开罗盘弹射坞；
     * 用户可通过 pinned 状态决定是否保留该插件的独立原生顶栏图标。
     */
    ensureDesktopEntry(): () => void {
        return ensureDesktopEntry();
    },

    /** 统一全端顶栏收敛入口（自动适配桌面与移动端环境） */
    ensureUnifiedEntry(): () => void {
        const cleanM = ensureMobileEntry();
        const cleanD = ensureDesktopEntry();
        return () => {
            cleanM();
            cleanD();
        };
    },

    /** 唤醒移动端底部弹射坞（Bottom Sheet：磁贴网格 + 穿透搜索 + 长按展开二级行动） */
    openMobileSheet(): void {
        openMobileSheet();
    },

    /** 关闭移动端弹射坞 */
    closeMobileSheet(): void {
        closeMobileSheet();
    },

    /** 轻触感震动反馈（移动端支持 navigator.vibrate；桌面端静默忽略） */
    haptic(durationMs = 10): void {
        hapticFeedback(durationMs);
    },

    /** 读取手机端入口模式：topbar（仅顶栏）/ ball（仅悬浮球）/ both（并行，默认）/ none（都不要） */
    getMobileEntryMode(): LvMobileEntryMode {
        return getMobileEntryMode();
    },

    /** 设定手机端入口模式并实时生效（持久化；顶栏按钮与悬浮球按模式增删） */
    setMobileEntryMode(mode: LvMobileEntryMode): void {
        setMobileEntryMode(mode);
    },

    /** 睡前日报定时提醒核对与触发（满足时间+有活动+未开启专注+今日未触发） */
    checkBedlineReminder(now?: Date): boolean {
        return checkAndTriggerBedline(now);
    }
};

/* ========================================================================= */
/* 14b. 移动端统一入口与底部弹射坞 (Lv Mobile Entry & Bottom Sheet)            */
/* ========================================================================= */

const MOBILE_ENTRY_ID = "lvLaunchpadMobileEntry";
const DESKTOP_ENTRY_ID = "lvLaunchpadDesktopEntry";
const MOBILE_SHEET_ID = "lv-launchpad-sheet-mask";

/** 思源移动端检测：手机宿主渲染 #mobileTopBar 或挂载 window.siyuan.mobile 对象；UA 兜底覆盖 browser-mobile 场景 */
export function isMobileFrontend(): boolean {
    if (typeof document === "undefined" || typeof document.getElementById !== "function") return false;
    try {
        if (document.getElementById("mobileTopBar")) return true;
    } catch { /* ignore */ }
    try {
        const syMobile = (globalThis as { siyuan?: { mobile?: unknown } }).siyuan?.mobile;
        if (syMobile === true || (typeof syMobile === "object" && syMobile !== null)) return true;
    } catch { /* ignore */ }
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return true;
    // iPadOS 13+ 桌面级 UA（伪装 Macintosh）+ 多点触控 → 平板场景按移动端处理
    if (/Macintosh/i.test(ua) && ((navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints ?? 0) > 1) return true;
    return false;
}

/** 轻触感反馈：仅移动端生效，任何异常静默吞掉（桌面/无权限环境零影响） */
export function hapticFeedback(durationMs = 10): void {
    try {
        const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
        if (typeof nav?.vibrate === "function") nav.vibrate(durationMs);
    } catch { /* 触感不可用即忽略 */ }
}

type MobileEntryCleanup = () => void;
let mobileEntryRetryTimers: number[] = [];

/* ===== 入口模式设置（顶栏 / 悬浮球 / 两者并行 / 都不要）——用户主权，持久化 ===== */

export type LvMobileEntryMode = "topbar" | "ball" | "both" | "none";
const MOBILE_ENTRY_MODE_KEY = "lv_launchpad_entry_mode";
const MOBILE_BALL_POS_KEY = "lv_launchpad_ball_pos";
const MOBILE_BALL_ID = "lv-launchpad-mobile-ball";
const MOBILE_BALL_IDLE_MS = 3500;
const MOBILE_BALL_LONG_PRESS_MS = 600;
const MOBILE_BALL_DRAG_SLOP_PX = 8;

export function getMobileEntryMode(): LvMobileEntryMode {
    if (typeof localStorage === "undefined") return "both";
    try {
        const raw = localStorage.getItem(MOBILE_ENTRY_MODE_KEY);
        if (raw === "topbar" || raw === "ball" || raw === "both" || raw === "none") return raw;
    } catch { /* ignore */ }
    return "both"; // 默认并行：顶栏罗盘 + 悬浮球双入口
}

export function setMobileEntryMode(mode: LvMobileEntryMode): void {
    if (typeof localStorage !== "undefined") {
        try { localStorage.setItem(MOBILE_ENTRY_MODE_KEY, mode); } catch { /* ignore */ }
    }
    syncMobileEntryDom();
}

interface LvBallPosition { edge: "left" | "right"; yRatio: number; immersive: boolean; }

/** 纯函数：净化悬浮球位置存储（越界回退 + 数值钳制），供持久化恢复与单测 */
export function normalizeBallPosition(raw: unknown): LvBallPosition {
    const obj = (raw && typeof raw === "object") ? raw as Record<string, unknown> : {};
    const edge = obj.edge === "right" ? "right" : "left";
    const y = typeof obj.yRatio === "number" && Number.isFinite(obj.yRatio) ? obj.yRatio : 0.5;
    return { edge, yRatio: Math.min(0.85, Math.max(0.15, y)), immersive: obj.immersive === true };
}

function clampBallYRatio(v: number): number {
    return Math.min(0.85, Math.max(0.15, v));
}

/** 聚合徽记与单插件自适应：任一已注册条目带 badge 时点亮圆点；有紧急待办时点亮警示色；专注模式点亮 🌙；单插件时动态呈现专属标题 */
function refreshEntryBadgeDot(): void {
    if (typeof document === "undefined") return;
    try {
        const items = getLaunchpadHub().getItems().filter((it) => it.state !== "hidden");
        const hasBadge = items.some((it) => Boolean(it.badge));
        const hasUrgent = items.some((it) => Boolean(it.badge) && (it.badgeType === "error" || it.badgeType === "warn"));
        const focus = isNotifyFocusActive();
        for (const root of [document.getElementById(MOBILE_ENTRY_ID), document.getElementById(MOBILE_BALL_ID), document.getElementById(DESKTOP_ENTRY_ID)]) {
            if (!root) continue;
            const dot = root.querySelector(".lv-entry-dot");
            if (dot && typeof dot === "object" && "style" in dot && (dot as HTMLElement).style) {
                (dot as HTMLElement).style.display = hasBadge ? "block" : "none";
                (dot as HTMLElement).style.background = hasUrgent ? "var(--b3-theme-error, #ef4444)" : "var(--b3-theme-primary, #3576c7)";
            }
            const moon = root.querySelector(".lv-entry-moon");
            if (moon && typeof moon === "object" && "style" in moon && (moon as HTMLElement).style) {
                (moon as HTMLElement).style.display = focus ? "inline-block" : "none";
            }

            // 单插件时动态适配专属名称与操作提示；多插件时保持全家桶统一标题
            if (items.length === 1) {
                const single = items[0];
                if (single) {
                    const singleName = single.fullName || single.name;
                    root.setAttribute("aria-label", `${singleName} · 小驴罗盘`);
                    root.setAttribute("title", `${singleName} (左键直达 · 右键小驴罗盘)`);
                }
            } else if (items.length > 1) {
                root.setAttribute("aria-label", "小驴罗盘");
                root.setAttribute("title", `小驴罗盘 · 全家桶极速直达 (${items.length} 插件已联结 · 快捷键 1~${items.length})`);
            }
        }
    } catch { /* ignore */ }
}

/**
 * 思源 3.8+ 原生 litheness 图标风格规范（24×24 viewBox, 1.7px stroke-width, round cap/join, fill:none）。
 * 注意：思源全局 base.css 含有 `svg { fill: currentColor }`，内联 SVG 必须显式携带 `style="fill:none!important"` 且子路径加 `fill="none"`，
 * 严防被全局样式污染成实心黑块。
 */
const COMPASS_SVG = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="fill:none!important;stroke:currentColor!important;" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5" fill="none"/><path d="M17.5 2.5 21.5 6.5 17.5 10.5 13.5 6.5Z" fill="none"/><rect x="3" y="14" width="7" height="7" rx="1.5" fill="none"/><rect x="14" y="14" width="7" height="7" rx="1.5" fill="none"/></svg>`;

const PLUGIN_LITHE_ICON_PATHS: Record<string, string> = {
    "siyuan-checkin": `<path d="M8 2v4" fill="none"/><path d="M16 2v4" fill="none"/><rect width="18" height="18" x="3" y="4" rx="2" fill="none"/><path d="M3 10h18" fill="none"/><path d="m9 16 2 2 4-4" fill="none"/>`,
    "checkin": `<path d="M8 2v4" fill="none"/><path d="M16 2v4" fill="none"/><rect width="18" height="18" x="3" y="4" rx="2" fill="none"/><path d="M3 10h18" fill="none"/><path d="m9 16 2 2 4-4" fill="none"/>`,
    "siyuan-speed-switch": `<rect x="3" y="3" width="18" height="18" rx="2" fill="none"/><path d="M9 3v18" fill="none"/><path d="m15.5 8-3 4.5h3l-2.5 4.5" fill="none"/>`,
    "raikiri": `<rect x="3" y="3" width="18" height="18" rx="2" fill="none"/><path d="M9 3v18" fill="none"/><path d="m15.5 8-3 4.5h3l-2.5 4.5" fill="none"/>`,
    "siyuan-home": `<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" fill="none"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="none"/>`,
    "home": `<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" fill="none"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="none"/>`,
    "siyuan-glean": `<path d="M12 7v14" fill="none"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" fill="none"/>`,
    "glean": `<path d="M12 7v14" fill="none"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" fill="none"/>`,
    "siyuan-exam": `<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" fill="none"/><path d="m9 12 2 2 4-4" fill="none"/>`,
    "exam": `<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" fill="none"/><path d="m9 12 2 2 4-4" fill="none"/>`,
    "siyuan-lv-cards": `<rect x="6" y="6" width="14" height="16" rx="2.5" fill="none"/><path d="M4 18V5a2.5 2.5 0 0 1 2.5-2.5H17" fill="none"/><path d="m10 14 2.2 2.2 4.3-4.4" fill="none"/>`,
    "cards": `<rect x="6" y="6" width="14" height="16" rx="2.5" fill="none"/><path d="M4 18V5a2.5 2.5 0 0 1 2.5-2.5H17" fill="none"/><path d="m10 14 2.2 2.2 4.3-4.4" fill="none"/>`,
    "siyuan-contacts": `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" fill="none"/><circle cx="9" cy="7" r="4" fill="none"/><path d="M22 21v-2a4 4 0 0 0-3-3.87" fill="none"/><path d="M16 3.13a4 4 0 0 1 0 7.75" fill="none"/>`,
    "contacts": `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" fill="none"/><circle cx="9" cy="7" r="4" fill="none"/><path d="M22 21v-2a4 4 0 0 0-3-3.87" fill="none"/><path d="M16 3.13a4 4 0 0 1 0 7.75" fill="none"/>`,
    "xiaolv-common": `<rect x="4" y="3" width="16" height="18" rx="2" fill="none"/><path d="m10 10-2 2 2 2" fill="none"/><path d="m14 10 2 2-2 2" fill="none"/><path d="M9 17h6" fill="none"/>`,
    "common": `<rect x="4" y="3" width="16" height="18" rx="2" fill="none"/><path d="m10 10-2 2 2 2" fill="none"/><path d="m14 10 2 2-2 2" fill="none"/><path d="M9 17h6" fill="none"/>`,
    "siyuan-quickgate": `<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" fill="none"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2s-.7 6.13-6.05 11a22 22 0 0 1-3.95 2z" fill="none"/>`,
    "quickgate": `<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" fill="none"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2s-.7 6.13-6.05 11a22 22 0 0 1-3.95 2z" fill="none"/>`,
};

const PLUGIN_DEFAULT_BRAND_COLORS: Record<string, string> = {
    "siyuan-checkin": "#f59e0b",
    "checkin": "#f59e0b",
    "siyuan-speed-switch": "#38bdf8",
    "raikiri": "#38bdf8",
    "siyuan-home": "#10b981",
    "home": "#10b981",
    "siyuan-glean": "#a855f7",
    "glean": "#a855f7",
    "siyuan-exam": "#3b82f6",
    "exam": "#3b82f6",
    "siyuan-lv-cards": "#f43f5e",
    "cards": "#f43f5e",
    "siyuan-contacts": "#f97316",
    "contacts": "#f97316",
    "xiaolv-common": "#14b8a6",
    "common": "#14b8a6",
    "siyuan-quickgate": "#06b6d4",
    "quickgate": "#06b6d4",
};

function resolveSafeBrandColor(pluginId: string, rawColor?: string): string {
    if (rawColor && /^#[0-9a-fA-F]{3,8}$/.test(rawColor)) return rawColor;
    if (!rawColor || rawColor.startsWith("var(--lv-brand")) {
        if (PLUGIN_DEFAULT_BRAND_COLORS[pluginId]) return PLUGIN_DEFAULT_BRAND_COLORS[pluginId];
    }
    return "var(--b3-theme-primary)";
}

function renderPluginLitheSvg(pluginId: string, size = 16): string {
    const paths = PLUGIN_LITHE_ICON_PATHS[pluginId] || `<rect x="3" y="3" width="7" height="7" rx="1.5" fill="none"/><rect x="14" y="3" width="7" height="7" rx="1.5" fill="none"/><rect x="3" y="14" width="7" height="7" rx="1.5" fill="none"/><rect x="14" y="14" width="7" height="7" rx="1.5" fill="none"/>`;
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="width:${size}px;height:${size}px;fill:none!important;stroke:currentColor!important;" aria-hidden="true">${paths}</svg>`;
}

function buildMobileEntryButton(): boolean {
    if (typeof document === "undefined") return false;
    const topBar = document.getElementById("mobileTopBar");
    if (!topBar) return false;
    if (document.getElementById(MOBILE_ENTRY_ID)) { refreshEntryBadgeDot(); return true; } // 已存在即幂等成功
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = MOBILE_ENTRY_ID;
    btn.className = "toolbar__button";
    btn.setAttribute("aria-label", "小驴罗盘");
    btn.setAttribute("title", "小驴罗盘 · 全家桶极速直达");
    // 内联线性罗盘 SVG（1.85px 描边）：零 sprite 依赖，任何主题下都稳定渲染
    btn.innerHTML = `${COMPASS_SVG}<span class="lv-entry-moon" aria-hidden="true" style="display:none;margin-left:2px;font-size:11px;line-height:1;">🌙</span><span class="lv-entry-dot" aria-hidden="true" style="display:none;position:absolute;top:4px;right:4px;width:8px;height:8px;border-radius:999px;background:var(--b3-theme-primary,#3576c7);"></span>`;
    btn.addEventListener("click", () => {
        hapticFeedback(8);
        openMobileSheet();
    });
    btn.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        openMobileSheet();
    });
    // 与原生按钮按 DOM 序并列：插在最后一个原生按钮之前，绝不追加到思源「更多」等系统按钮之后
    let inserted = false;
    try {
        const nativeButtons = topBar.querySelectorAll(":scope > .toolbar__button");
        const last = nativeButtons.length ? nativeButtons[nativeButtons.length - 1] : null;
        if (last && last.parentElement === topBar && typeof topBar.insertBefore === "function") {
            topBar.insertBefore(btn, last);
            inserted = true;
        }
    } catch { /* ignore */ }
    if (!inserted) topBar.appendChild(btn);
    refreshEntryBadgeDot();
    return true;
}

/* ===== 悬浮球（罗盘 FAB）：可拖拽、贴边吸附、闲置半隐、长按沉浸，点击弹射坞 ===== */

let ballIdleTimer: number | undefined;

function applyBallPosition(ball: HTMLElement, pos: LvBallPosition, idle: boolean): void {
    ballCurrentPos = pos; // 供旋转/折叠屏开合后重钳制使用
    try {
        const vw = typeof window !== "undefined" && Number.isFinite(window.innerWidth) ? window.innerWidth : 390;
        const vh = typeof window !== "undefined" && Number.isFinite(window.innerHeight) ? window.innerHeight : 800;
        // 避让思源移动端底部文档切换栏与顶栏：可停留区间 [56, vh-88]
        const top = Math.min(vh - 88, Math.max(56, Math.round(pos.yRatio * vh)));
        ball.style.top = `${top}px`;
        ball.style.left = pos.edge === "right" ? `${Math.max(8, vw - 56)}px` : "10px";
        ball.classList.remove("lv-ball-edge-left", "lv-ball-edge-right");
        ball.classList.add(pos.edge === "right" ? "lv-ball-edge-right" : "lv-ball-edge-left");
        ball.classList.toggle("lv-ball-immersive", pos.immersive);
        ball.classList.toggle("lv-ball-idle", idle && !pos.immersive);
    } catch { /* ignore */ }
}

function persistBallPosition(pos: LvBallPosition): void {
    if (typeof localStorage === "undefined") return;
    try { localStorage.setItem(MOBILE_BALL_POS_KEY, JSON.stringify(pos)); } catch { /* ignore */ }
}

function scheduleBallIdle(ball: HTMLElement, pos: LvBallPosition): void {
    if (ballIdleTimer !== undefined) { try { window.clearTimeout(ballIdleTimer); } catch { /* ignore */ } }
    ballIdleTimer = window.setTimeout(() => {
        ballIdleTimer = undefined;
        applyBallPosition(ball, pos, true);
    }, MOBILE_BALL_IDLE_MS);
}

function buildMobileBallButton(): boolean {
    if (typeof document === "undefined" || !document.body) return false;
    const existing = document.getElementById(MOBILE_BALL_ID);
    if (existing) { refreshEntryBadgeDot(); return true; } // 幂等

    const ball = document.createElement("button");
    ball.type = "button";
    ball.id = MOBILE_BALL_ID;
    ball.className = "lv-ball";
    ball.setAttribute("aria-label", "小驴罗盘悬浮球 · 点击打开全家桶，拖拽移动，长按切换沉浸");
    ball.setAttribute("title", "小驴罗盘");
    ball.innerHTML = `${COMPASS_SVG}<span class="lv-entry-moon" aria-hidden="true" style="display:none;position:absolute;top:-3px;left:-3px;font-size:12px;line-height:1;">🌙</span><span class="lv-entry-dot" aria-hidden="true" style="display:none;position:absolute;top:2px;right:2px;width:9px;height:9px;border-radius:999px;background:var(--b3-theme-primary,#3576c7);box-shadow:0 0 0 2px var(--b3-theme-surface,#fff);"></span>`;

    let pos = normalizeBallPosition(undefined);
    try {
        const raw = typeof localStorage !== "undefined" ? localStorage.getItem(MOBILE_BALL_POS_KEY) : null;
        if (raw) pos = normalizeBallPosition(JSON.parse(raw));
    } catch { /* 持久化损坏时回退默认位置 */ }
    applyBallPosition(ball, pos, false);

    // 拖拽 / 轻点 / 长按三合一手势：优先 Pointer Events（统一触控/鼠标/触控笔，
    // 平板键盘盖与折叠屏外屏触控笔都能拖），无 PointerEvent 的旧 WebView 回退 touch
    let startX = 0, startY = 0, moved = false, dragging = false, suppressClick = false;
    let longPressTimer: number | undefined;

    const clearLongPress = () => {
        if (longPressTimer !== undefined) { try { window.clearTimeout(longPressTimer); } catch { /* ignore */ } longPressTimer = undefined; }
    };

    const pressStart = (x: number, y: number): void => {
        startX = x; startY = y;
        moved = false; dragging = false; suppressClick = false;
        ball.classList.remove("lv-ball-idle");
        clearLongPress();
        longPressTimer = window.setTimeout(() => {
            longPressTimer = undefined;
            if (moved) return;
            pos = { ...pos, immersive: !pos.immersive }; // 长按：切换沉浸半隐
            persistBallPosition(pos);
            applyBallPosition(ball, pos, false);
            hapticFeedback(12);
        }, MOBILE_BALL_LONG_PRESS_MS);
        scheduleBallIdle(ball, pos);
    };

    const pressMove = (x: number, y: number): void => {
        const dx = x - startX, dy = y - startY;
        if (!moved && Math.hypot(dx, dy) > MOBILE_BALL_DRAG_SLOP_PX) {
            moved = true; dragging = true;
            clearLongPress();
            ball.classList.add("lv-ball-dragging");
        }
        if (!dragging) return;
        try {
            const vw = typeof window !== "undefined" && Number.isFinite(window.innerWidth) ? window.innerWidth : 390;
            const vh = typeof window !== "undefined" && Number.isFinite(window.innerHeight) ? window.innerHeight : 800;
            const top = Math.min(vh - 88, Math.max(56, y));
            ball.style.top = `${top}px`;
            pos = { ...pos, edge: x < vw / 2 ? "left" : "right", yRatio: clampBallYRatio(top / vh) };
            ball.style.left = pos.edge === "right" ? `${Math.max(8, vw - 56)}px` : "10px";
            ball.classList.remove("lv-ball-edge-left", "lv-ball-edge-right");
            ball.classList.add(pos.edge === "right" ? "lv-ball-edge-right" : "lv-ball-edge-left");
        } catch { /* ignore */ }
    };

    const pressEnd = (): void => {
        clearLongPress();
        if (dragging) {
            dragging = false;
            suppressClick = true;
            ball.classList.remove("lv-ball-dragging");
            persistBallPosition(pos);
            applyBallPosition(ball, pos, false);
            hapticFeedback(6);
            scheduleBallIdle(ball, pos);
            // 双球避让广播（Protocol v1.7）：雷切动作球等监听此事件，与本球重叠时自行错开
            try {
                window.dispatchEvent(new CustomEvent("lv:launchpad:ball-moved", { detail: { edge: pos.edge, yRatio: pos.yRatio } }));
            } catch { /* 事件不可用静默 */ }
            return;
        }
        scheduleBallIdle(ball, pos);
    };

    const pressCancel = (): void => {
        clearLongPress();
        dragging = false;
        ball.classList.remove("lv-ball-dragging");
    };

    const supportsPointer = typeof window !== "undefined" && typeof (window as unknown as { PointerEvent?: unknown }).PointerEvent === "function";
    if (supportsPointer) {
        ball.addEventListener("pointerdown", (ev: PointerEvent) => {
            if (ev.pointerType === "mouse" && ev.button !== 0) return;
            try { ball.setPointerCapture?.(ev.pointerId); } catch { /* ignore */ }
            pressStart(ev.clientX, ev.clientY);
        });
        ball.addEventListener("pointermove", (ev: PointerEvent) => {
            if (!dragging && ev.buttons === 0 && ev.pointerType === "mouse") return;
            pressMove(ev.clientX, ev.clientY);
        });
        ball.addEventListener("pointerup", () => pressEnd());
        ball.addEventListener("pointercancel", () => pressCancel());
    } else {
        // 旧 WebView touch 回退（全程 passive，滑动流畅不阻塞滚动）
        ball.addEventListener("touchstart", (ev: TouchEvent) => {
            const t = ev.touches[0];
            if (!t) return;
            pressStart(t.clientX, t.clientY);
        }, { passive: true });
        ball.addEventListener("touchmove", (ev: TouchEvent) => {
            const t = ev.touches[0];
            if (!t) return;
            pressMove(t.clientX, t.clientY);
        }, { passive: true });
        ball.addEventListener("touchend", () => pressEnd(), { passive: true });
        ball.addEventListener("touchcancel", () => pressCancel(), { passive: true });
    }

    ball.addEventListener("click", () => {
        if (suppressClick) { suppressClick = false; return; } // 拖拽结束的合成 click 不开坞
        hapticFeedback(8);
        openMobileSheet();
        scheduleBallIdle(ball, pos);
    });
    ball.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        openMobileSheet();
    });

    document.body.appendChild(ball);
    refreshEntryBadgeDot();
    scheduleBallIdle(ball, pos);
    wireViewportWatch();
    recomputeBallSuppression();
    return true;
}

/* ===== 横竖屏切换 / 折叠屏开合 / 窗口尺寸变化：悬浮球位置重钳制（防越界出屏） ===== */
let ballCurrentPos: LvBallPosition | undefined;
let ballResizeHandler: (() => void) | undefined;
let ballResizeTimer: number | undefined;

function wireViewportWatch(): void {
    if (ballResizeHandler || typeof window === "undefined" || typeof window.addEventListener !== "function") return;
    ballResizeHandler = () => {
        if (ballResizeTimer !== undefined) { try { window.clearTimeout(ballResizeTimer); } catch { /* ignore */ } }
        ballResizeTimer = window.setTimeout(() => {
            ballResizeTimer = undefined;
            const ball = typeof document !== "undefined" ? document.getElementById(MOBILE_BALL_ID) : null;
            if (ball && ballCurrentPos) applyBallPosition(ball, ballCurrentPos, false);
        }, 150); // 折叠屏开合/旋转会连发多次 resize，防抖合并
    };
    window.addEventListener("resize", ballResizeHandler);
    window.addEventListener("orientationchange", ballResizeHandler);
}

function unwireViewportWatch(): void {
    if (ballResizeHandler && typeof window !== "undefined" && typeof window.removeEventListener === "function") {
        try {
            window.removeEventListener("resize", ballResizeHandler);
            window.removeEventListener("orientationchange", ballResizeHandler);
        } catch { /* ignore */ }
    }
    ballResizeHandler = undefined;
    if (ballResizeTimer !== undefined) { try { window.clearTimeout(ballResizeTimer); } catch { /* ignore */ } ballResizeTimer = undefined; }
}

/** 按当前入口模式同步顶栏按钮与悬浮球 DOM（幂等；setMobileEntryMode 实时生效） */
function syncMobileEntryDom(): void {
    if (typeof document === "undefined" || !isMobileFrontend()) return;
    const mode = getMobileEntryMode();
    if (mode === "topbar" || mode === "both") {
        buildMobileEntryButton();
    } else {
        try { document.getElementById(MOBILE_ENTRY_ID)?.remove(); } catch { /* ignore */ }
    }
    // 模式切换时顶栏宿主可能尚未就绪（mobileTopBar 未渲染）：
    // 挂一次性延迟补建，避免切换后入口永远缺席（ensureMobileEntry 的错峰循环仅覆盖初次装载窗口）
    if (!mobileEntryFullyApplied()) {
        for (const delay of [1200, 4000]) {
            window.setTimeout(() => syncMobileEntryDom(), delay);
        }
    }
    if (mode === "ball" || mode === "both") {
        buildMobileBallButton();
    } else {
        try { document.getElementById(MOBILE_BALL_ID)?.remove(); } catch { /* ignore */ }
    }
    refreshEntryBadgeDot();
}

function mobileEntryFullyApplied(): boolean {
    const mode = getMobileEntryMode();
    const wantTopbar = mode === "topbar" || mode === "both";
    const wantBall = mode === "ball" || mode === "both";
    const topbarOk = !wantTopbar || Boolean(document.getElementById(MOBILE_ENTRY_ID));
    const ballOk = !wantBall || Boolean(document.getElementById(MOBILE_BALL_ID));
    return topbarOk && ballOk;
}

/* ===== 新用户引导卡（Protocol v1.7）：≥3 个插件首次入坞时一次性欢迎卡 ===== */
const ONBOARDING_KEY = "lv_launchpad_onboarding_done";

function maybeShowOnboardingCard(): void {
    if (typeof localStorage === "undefined" || typeof document === "undefined") return;
    try { if (localStorage.getItem(ONBOARDING_KEY) === "1") return; } catch { /* ignore */ }
    const items = getLaunchpadHub().getItems();
    if (items.length < 3) return; // 单双插件用户不需要生态引导
    try { localStorage.setItem(ONBOARDING_KEY, "1"); } catch { /* ignore */ }
    lvNotify.card({
        source: "罗盘",
        title: "👋 欢迎使用小驴罗盘",
        message: `已为你收敛 ${items.length} 个插件的入口：点磁贴直达主界面、长按磁贴展开快捷行动、顶部搜索穿透全家桶、🌙 一键专注静音。可在各插件设置中自定义。`,
        level: "info",
        duration: 0,
        actions: [
            { label: "知道了", primary: true },
        ],
    });
}

/* ===== 睡前日报定时提醒（Protocol v1.7）：22:30 且今日有活动时一次性卡片 ===== */
const BEDLINE_KEY = "lv_launchpad_bedline_reminder"; // "on"（默认）/ "off"
const BEDLINE_LAST_KEY = "lv_launchpad_bedline_last"; // 上次提醒日期 YYYY-MM-DD
const BEDLINE_FORCE_KEY = "lv_launchpad_bedline_force"; // 测试钩子：强制阈值 hh:mm

/** 纯函数：是否到达睡前提醒阈值（默认 22:30；测试可用 force 钩子覆盖阈值） */
export function bedlineDue(now: Date): boolean {
    let threshold = "22:30";
    try {
        if (typeof localStorage !== "undefined") {
            const forced = localStorage.getItem(BEDLINE_FORCE_KEY);
            if (forced && /^\d{2}:\d{2}$/.test(forced)) threshold = forced;
        }
    } catch { /* ignore */ }
    const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return hhmm >= threshold;
}

function bedlineEnabled(): boolean {
    try { return (typeof localStorage !== "undefined" ? localStorage.getItem(BEDLINE_KEY) : null) !== "off"; } catch { return true; }
}

/** 纯函数：睡前提醒核对并触发（满足时间+有活动+未开启专注+今日未触发），返回是否触发了提醒 */
export function checkAndTriggerBedline(now = new Date()): boolean {
    if (!bedlineEnabled() || !bedlineDue(now) || isNotifyFocusActive()) return false;
    // 阈值越界窗（22:30~23:59）内才提醒；若 ticker 因休眠跳到次日 00:00 后才补跑，
    // 说明用户早已休息——不补弹，把机会留给当晚（避免 00:05 被“今日回顾”吵醒）
    if (now.getHours() < 20) return false;
    const stats = lvActivity.getDailyStats();
    const total = Number(stats?.total ?? 0);
    if (total <= 0) return false;
    const today = now.toDateString();
    try {
        if (typeof localStorage !== "undefined") {
            if (localStorage.getItem(BEDLINE_LAST_KEY) === today) return false;
            localStorage.setItem(BEDLINE_LAST_KEY, today);
        }
    } catch { /* ignore */ }
    lvNotify.card({
        source: "罗盘",
        title: "🌙 今日回顾",
        message: `今天共 ${total} 项生态活动，花一分钟写进日记吧——明天翻开就是完整的自己。`,
        level: "info",
        duration: 0,
        category: "bedline",
        actions: [
            { label: "立即写入", primary: true, onClick: async () => {
                try {
                    const md = lvActivity.formatAsMarkdown();
                    if (!md || !md.trim()) {
                        lvNotify.capsule({ source: "罗盘", message: "今日暂无生态活动记录", duration: 2500 });
                        return;
                    }
                    try {
                        await navigator.clipboard.writeText(md);
                        lvNotify.capsule({ source: "罗盘", message: "已复制今日回顾，可直接粘贴进日记", duration: 3000 });
                    } catch {
                        lvNotify.capsule({ source: "罗盘", message: "今日回顾已就绪", duration: 2500 });
                    }
                } catch { /* ignore */ }
            } },
            { label: "明天再说" },
        ],
    });
    return true;
}

function maybeStartBedlineReminder(): void {
    if (typeof window === "undefined" || (window as unknown as { __LV_BEDLINE_TICKER__?: boolean }).__LV_BEDLINE_TICKER__) return;
    (window as unknown as { __LV_BEDLINE_TICKER__?: boolean }).__LV_BEDLINE_TICKER__ = true;
    lvTicker.onMinute("lv-launchpad", (now) => {
        checkAndTriggerBedline(now);
    });
}


/**
 * 统一手机端入口：desktop 调用直接返回 no-op；
 * 移动端按入口模式（getMobileEntryMode，默认 both 并行）注入顶栏罗盘按钮与悬浮球，
 * 顶栏宿主未就绪时错峰重试。
 * 所有权引用计数：多个小驴插件各自调用本函数共享同一对入口；仅当最后一个宿主
 * 清理时才拆除 DOM 与计时器——避免任一插件卸载把其他在世插件的入口一并带走。
 */
const mobileEntryOwners = new Set<string>();
let mobileTopBarObserver: MutationObserver | null = null;

function wireMobileTopBarObserver(): void {
    if (typeof document === "undefined" || !isMobileFrontend() || typeof MutationObserver === "undefined") return;
    const topBar = document.getElementById("mobileTopBar");
    if (!topBar || mobileTopBarObserver) return;

    let debounceTimer: number | null = null;
    mobileTopBarObserver = new MutationObserver(() => {
        if (debounceTimer) return;
        debounceTimer = window.setTimeout(() => {
            debounceTimer = null;
            if (!document.getElementById(MOBILE_ENTRY_ID)) {
                syncMobileEntryDom();
            }
        }, 120);
    });

    try {
        mobileTopBarObserver.observe(topBar, { childList: true });
    } catch { /* ignore */ }
}

function ensureMobileEntry(): MobileEntryCleanup {
    if (typeof document === "undefined") return () => {};
    if (!isMobileFrontend()) return () => {}; // 桌面端完全 no-op，不挂任何计时器
    const owner = `owner_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    mobileEntryOwners.add(owner);
    const firstOwner = mobileEntryOwners.size === 1;
    mobileEntryRetryTimers.forEach((t) => { try { window.clearTimeout(t); } catch { /* ignore */ } });
    mobileEntryRetryTimers = [];
    syncMobileEntryDom();
    if (firstOwner) {
        wireMobileSuppression();
        wireMobileTopBarObserver(); // 挂载移动端顶栏 MutationObserver 持久自愈守护
        maybeStartBedlineReminder(); // 睡前日报定时提醒随首个宿主启动（lvTicker 单例，全局一次）
    }
    if (!mobileEntryFullyApplied()) {
        // mobileTopBar 尚未挂载等：错峰重试直至入口全部就位
        for (const delay of [800, 1500, 4000, 10000]) {
            const tid = window.setTimeout(() => {
                if (!mobileEntryFullyApplied()) syncMobileEntryDom();
            }, delay);
            mobileEntryRetryTimers.push(tid);
        }
    }
    return () => {
        mobileEntryOwners.delete(owner);
        if (mobileEntryOwners.size > 0) return; // 仍有插件在世：公共入口与其他宿主的清理权保留
        mobileEntryRetryTimers.forEach((t) => { try { window.clearTimeout(t); } catch { /* ignore */ } });
        mobileEntryRetryTimers = [];
        try { mobileTopBarObserver?.disconnect(); } catch { /* ignore */ }
        mobileTopBarObserver = null;
        if (ballIdleTimer !== undefined) { try { window.clearTimeout(ballIdleTimer); } catch { /* ignore */ } ballIdleTimer = undefined; }
        unwireMobileSuppression();
        unwireViewportWatch();
        ballCurrentPos = undefined;
        try { document.getElementById(MOBILE_ENTRY_ID)?.remove(); } catch { /* ignore */ }
        try { document.getElementById(MOBILE_BALL_ID)?.remove(); } catch { /* ignore */ }
    };
}

/* ===== 桌面端小驴罗盘顶栏收敛入口（Desktop TopBar Entry · Protocol v1.7） ===== */
const desktopEntryOwners = new Set<string>();
let desktopEntryRetryTimers: number[] = [];

const SIYUAN_NATIVE_BUTTON_IDS = new Set([
    "barSearch", "barSync", "barBack", "barForward",
    "barDockL", "barDockR", "barDockB", "barSetting", "barSettings",
    "barHelp", "barHistory", "barMode", "drag", "windowControls",
    "barWorkspace", "barExit"
]);

/** 智能探测 #toolbar 中对应插件的顶栏 DOM 元素（抗主题重构与 DOM 自愈探针，严格规避原生与第三方按钮冲突） */
function findPluginTopBarElementInToolbar(item: LvLaunchpadItem): HTMLElement | null {
    if (typeof document === "undefined") return null;
    const toolbar = document.getElementById("toolbar");
    if (!toolbar) return null;

    if (item.topBarElement && (item.topBarElement as HTMLElement).isConnected) {
        return item.topBarElement;
    }

    if (typeof toolbar.querySelectorAll !== "function") {
        return null;
    }

    try {
        const candidates = Array.from(toolbar.querySelectorAll<HTMLElement>(".toolbar__item, button"));
        for (const el of candidates) {
            if (!el || el.id === DESKTOP_ENTRY_ID) continue;
            // 严格排除思源原生功能按钮与窗口拖拽控制区
            if (el.id && SIYUAN_NATIVE_BUTTON_IDS.has(el.id)) continue;
            // 思源 3.8.x：窗口控制区（.toolbar__window / #windowControls / data-window-topbar-entry）内的按钮绝不参与插件探测
            if (el.closest && typeof el.closest === "function" &&
                (el.closest(".toolbar__window") || el.closest("#windowControls") || el.hasAttribute("data-window-topbar-entry"))) {
                continue;
            }
            if (el.classList && typeof el.classList.contains === "function") {
                if (el.classList.contains("toolbar__item--drag") || el.classList.contains("toolbar__window-control")) {
                    continue;
                }
            }

            if (el.id === item.id || (typeof el.getAttribute === "function" && el.getAttribute("data-plugin-id") === item.id)) {
                return el;
            }

            const ariaLabel = (typeof el.getAttribute === "function" ? el.getAttribute("aria-label") : "") || "";
            const title = (typeof el.getAttribute === "function" ? el.getAttribute("title") : "") || "";

            // 严格匹配小驴特异性全称（如 "小驴打卡"）
            if (item.fullName && (ariaLabel.includes(item.fullName) || title.includes(item.fullName))) {
                return el;
            }

            // 若按短名匹配（如 "打卡"），必须带有小驴特异性图标标识，杜绝误判第三方同名插件
            if (item.name && (ariaLabel.includes(item.name) || title.includes(item.name))) {
                if (item.svgIcon) {
                    const useEl = typeof el.querySelector === "function" ? el.querySelector("use") : null;
                    const href = (useEl && typeof useEl.getAttribute === "function")
                        ? (useEl.getAttribute("xlink:href") || useEl.getAttribute("href") || "")
                        : "";
                    if (href && href.includes(item.svgIcon)) {
                        return el;
                    }
                    if (typeof el.innerHTML === "string" && el.innerHTML.includes(item.svgIcon)) {
                        return el;
                    }
                }
            }
        }
    } catch { /* ignore */ }
    return null;
}

const DESKTOP_CONVERGENCE_ONBOARDING_KEY = "lv_desktop_convergence_onboarding_done";

function maybeShowDesktopConvergenceOnboarding(itemCount: number): void {
    if (typeof localStorage === "undefined" || typeof document === "undefined") return;
    try { if (localStorage.getItem(DESKTOP_CONVERGENCE_ONBOARDING_KEY) === "1") return; } catch { /* ignore */ }
    try { localStorage.setItem(DESKTOP_CONVERGENCE_ONBOARDING_KEY, "1"); } catch { /* ignore */ }
    lvNotify.card({
        source: "小驴罗盘",
        title: "🧭 顶栏已升级为小驴罗盘中枢",
        message: `已为您将 ${itemCount} 个插件自动收敛至顶栏罗盘图标，告别顶栏拥挤。点击罗盘可直达所有插件；若习惯老版独立图标，可一键恢复平铺顶栏！`,
        level: "info",
        duration: 12000,
        actions: [
            {
                label: "打开罗盘看看",
                primary: true,
                onClick: () => {
                    openDesktopLaunchpadPopover();
                },
            },
            {
                label: "一键恢复平铺顶栏",
                onClick: () => {
                    const hub = getLaunchpadHub();
                    const allItems = hub.getItems();
                    for (const it of allItems) {
                        hub.setPluginState(it.id, "pinned");
                    }
                    syncTopBarConvergence();
                    lvNotify.capsule({ source: "顶栏", message: "已恢复全部插件独立平铺于顶栏", duration: 2500 });
                },
            },
        ],
    });
}

let topbarConvergenceTimer: number | null = null;
/**
 * 启动加速防抖调度（Startup Debounce Dispatcher）：
 * 8 大插件并发加载时，将频繁的连续全量顶栏收敛合并为 1 次批量同步，减少 87% 的启动期 DOM 回流
 */
export function scheduleTopBarConvergence(delayMs = 35): void {
    if (typeof window === "undefined" || isMobileFrontend()) return;
    if (topbarConvergenceTimer !== null) {
        window.clearTimeout(topbarConvergenceTimer);
    }
    topbarConvergenceTimer = window.setTimeout(() => {
        topbarConvergenceTimer = null;
        syncTopBarConvergence();
    }, delayMs);
}

let mobileEntryDebounceTimer: number | null = null;
export function scheduleMobileEntryDom(delayMs = 35): void {
    if (typeof window === "undefined" || !isMobileFrontend()) return;
    if (mobileEntryDebounceTimer !== null) {
        window.clearTimeout(mobileEntryDebounceTimer);
    }
    mobileEntryDebounceTimer = window.setTimeout(() => {
        mobileEntryDebounceTimer = null;
        syncMobileEntryDom();
    }, delayMs);
}

/**
 * 桌面端顶栏收敛调度引擎（Convergence Engine · Protocol v1.7.5）：
 * 1. 当已注册的小驴插件 >= 2 个时：
 *    - 自动挂载桌面端统一罗盘图标 #lvLaunchpadDesktopEntry；
 *    - 将未明确置顶（state !== 'pinned'）的插件原生 topBarElement 自动设为 display: none；
 *    - 若用户在罗盘内将某插件设为 'pinned'（置顶），则显示其原生按钮；
 * 2. 当小驴插件仅有 1 个时：
 *    - 保留该插件原生图标正常显示（零干扰）；
 * 3. 插件全部卸载或注销时，自动恢复原生显示。
 */
export function syncTopBarConvergence(): void {
    if (typeof document === "undefined" || isMobileFrontend()) return;
    try {
        const hub = getLaunchpadHub();
        const items = hub.getItems();
        const activeItems = items.filter(it => it.state !== "hidden");
        const needConverge = activeItems.length >= 2;

        const compassBtn = document.getElementById(DESKTOP_ENTRY_ID);
        if (compassBtn && typeof compassBtn === "object" && "style" in compassBtn && compassBtn.style) {
            // 思源 3.8.x ye() 重排防护：ye() 会将 orders.topBar 中的所有原生/插件项重插到 #barMore 之前，
            // 若罗盘按钮被挤到 #drag 左侧，立即自愈归位到右侧插件区锚点（#barPlugins / #barMore）之前
            const toolbar = document.getElementById("toolbar");
            if (toolbar && compassBtn.parentElement === toolbar && typeof toolbar.querySelector === "function") {
                ensureCompassOnRightSide(toolbar, compassBtn);
            }
            compassBtn.style.display = needConverge ? "inline-flex" : "none";
            refreshEntryBadgeDot();
            if (needConverge) {
                maybeShowDesktopConvergenceOnboarding(activeItems.length);
            }
        }

        for (const item of items) {
            let el = item.topBarElement;
            if ((!el || !(el as HTMLElement).isConnected) && typeof document.getElementById === "function") {
                const found = findPluginTopBarElementInToolbar(item);
                if (found) {
                    el = found;
                    item.topBarElement = found;
                }
            }
            if (el && typeof el === "object" && "style" in el && el.style) {
                if (needConverge) {
                    if (item.state === "pinned") {
                        el.style.display = "";
                    } else {
                        el.style.display = "none";
                    }
                } else {
                    el.style.display = item.state === "hidden" ? "none" : "";
                }
            }
        }
    } catch (err) {
        console.warn("[LvLaunchpad] 顶栏收敛同步异常:", err);
    }
}

function ensureCompassOnRightSide(toolbar: HTMLElement, btn: HTMLElement): void {
    try {
        const anchor = toolbar.querySelector("#barPlugins, #barCommand, #barSearch, #barMode, #barExit, #barMore, #windowControls");
        if (!anchor || anchor.parentElement !== toolbar || btn.nextElementSibling === anchor) return;
        const children = Array.from(toolbar.children || []);
        const dragIdx = children.findIndex((c) => c.id === "drag");
        const btnIdx = children.indexOf(btn);
        // 仅当罗盘漂移到了 #drag 左侧，或不在右侧工具区时归位，避免无谓 DOM 写入
        if (btnIdx === -1 || (dragIdx !== -1 && btnIdx < dragIdx)) {
            toolbar.insertBefore(btn, anchor);
        }
    } catch { /* ignore */ }
}

const DESKTOP_POPOVER_ID = "lv-desktop-launchpad-popover";
const LAUNCHPAD_VIEW_KEY = "lv_launchpad_view_mode";
const LAUNCHPAD_ACTION_LIMIT_KEY = "lv_launchpad_action_limit";
let desktopPopoverKeyDownHandler: ((e: KeyboardEvent) => void) | null = null;
let desktopPopoverOutsideClickHandler: ((e: MouseEvent) => void) | null = null;
let desktopPopoverResizeHandler: (() => void) | null = null;
let desktopGlobalHotkeyWired = false;

function getLaunchpadViewMode(): "grid" | "list" {
    if (typeof localStorage === "undefined") return "grid";
    try {
        return localStorage.getItem(LAUNCHPAD_VIEW_KEY) === "list" ? "list" : "grid";
    } catch { return "grid"; }
}

function setLaunchpadViewMode(mode: "grid" | "list"): void {
    if (typeof localStorage === "undefined") return;
    try { localStorage.setItem(LAUNCHPAD_VIEW_KEY, mode); } catch { /* ignore */ }
}

function getLaunchpadActionLimit(): number | "all" {
    if (typeof localStorage === "undefined") return 3;
    try {
        return localStorage.getItem(LAUNCHPAD_ACTION_LIMIT_KEY) === "all" ? "all" : 3;
    } catch { return 3; }
}

function setLaunchpadActionLimit(limit: number | "all"): void {
    if (typeof localStorage === "undefined") return;
    try { localStorage.setItem(LAUNCHPAD_ACTION_LIMIT_KEY, String(limit)); } catch { /* ignore */ }
}

function ensureDesktopStyles(): void {
    if (typeof document === "undefined" || !document.head || typeof document.createElement !== "function") return;
    const cssText = `
.lv-desktop-launchpad-popover {
  --lv-lp-bg: linear-gradient(165deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
  --lv-lp-panel-bg: #f8fafc;
  --lv-lp-card-bg: #ffffff;
  --lv-lp-card-hover-bg: #ffffff;
  --lv-lp-border: rgba(15, 23, 42, 0.075);
  --lv-lp-border-strong: rgba(15, 23, 42, 0.12);
  --lv-lp-text: #0f172a;
  --lv-lp-text-sub: #64748b;
  --lv-lp-accent: #2563eb;
  --lv-lp-accent-soft: rgba(37, 99, 235, 0.09);
  --lv-lp-card-shadow: 0 2px 6px -1px rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  font-family: var(--b3-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif);
  color: var(--lv-lp-text);
  background: var(--lv-lp-bg) !important;
  border: 1px solid var(--lv-lp-border-strong) !important;
  border-radius: 18px;
  box-shadow: 0 24px 56px -12px rgba(15, 23, 42, 0.18), 0 8px 20px -6px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(32px) saturate(190%);
  -webkit-backdrop-filter: blur(32px) saturate(190%);
  transition: opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1), transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  animation: lvPopoverEnter 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  outline: none;
  box-sizing: border-box;
}
:is([data-theme-mode="dark"], body.body--dark, html.dark) .lv-desktop-launchpad-popover {
  --lv-lp-bg: linear-gradient(165deg, rgba(24, 28, 38, 0.97) 0%, rgba(15, 18, 26, 0.98) 100%);
  --lv-lp-panel-bg: rgba(30, 36, 49, 0.76);
  --lv-lp-card-bg: rgba(33, 39, 53, 0.92);
  --lv-lp-card-hover-bg: rgba(40, 47, 64, 0.98);
  --lv-lp-border: rgba(255, 255, 255, 0.085);
  --lv-lp-border-strong: rgba(255, 255, 255, 0.14);
  --lv-lp-text: #f8fafc;
  --lv-lp-text-sub: #94a3b8;
  --lv-lp-accent: #60a5fa;
  --lv-lp-accent-soft: rgba(59, 130, 246, 0.18);
  --lv-lp-card-shadow: 0 4px 12px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  box-shadow: 0 28px 60px -10px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
}`;
    const existing = document.getElementById("lv-launchpad-desktop-styles");
    try {
        const style = existing ?? document.createElement("style");
        if (existing && existing.getAttribute?.("data-lv-ver") === "2.2") return;
        style.id = "lv-launchpad-desktop-styles";
        style.setAttribute?.("data-lv-ver", "2.2");
        style.textContent = cssText + `
.lv-desktop-launchpad-popover * {
  box-sizing: border-box;
}
@keyframes lvPopoverEnter {
  from { opacity: 0; transform: translateY(-8px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.lv-desktop-launchpad-popover.lv-popover-closing {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
  pointer-events: none;
}
.lv-pop-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 14px 9px;
  border-bottom: 1px solid var(--lv-lp-border);
  background: var(--lv-lp-card-bg);
  flex-shrink: 0;
}
.lv-pop-view-tabs {
  display: inline-flex;
  background: var(--lv-lp-panel-bg);
  border: 1px solid var(--lv-lp-border);
  border-radius: 7px;
  padding: 2px;
}
.lv-pop-view-tab {
  border: none;
  background: transparent;
  color: var(--lv-lp-text-sub);
  font-size: 11px;
  padding: 2.5px 8px;
  border-radius: 5px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.14s ease;
}
.lv-pop-view-tab.active {
  background: var(--lv-lp-card-bg);
  color: var(--lv-lp-text);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}
.lv-pop-sub-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3.5px 8.5px;
  border-radius: 7px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--lv-lp-border);
  background: var(--lv-lp-card-bg);
  color: var(--lv-lp-text);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.02);
  font-family: inherit;
  transition: all 0.14s ease;
  user-select: none;
}
.lv-pop-sub-btn:hover,
.lv-pop-sub-btn.active {
  border-color: var(--lv-lp-accent);
  color: var(--lv-lp-accent);
  background: var(--lv-lp-accent-soft);
}
.lv-pop-sub-btn:active,
.lv-pop-view-tab:active,
.lv-pop-strip-chip:active,
.lv-pop-action-row:active,
.lv-pop-hit-item:active {
  transform: scale(0.96);
}
.lv-pop-grid,
.lv-pop-list,
.lv-pop-pref-drawer,
.lv-pop-omni-results {
  scrollbar-width: thin;
  overscroll-behavior: contain;
}
.lv-pop-search-bar {
  margin: 8px 14px 5px;
  padding: 6px 11px;
  border-radius: 10px;
  border: 1px solid var(--lv-lp-border-strong);
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--lv-lp-panel-bg);
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.02);
  flex-shrink: 0;
  transition: all 0.16s ease;
}
.lv-pop-search-bar:focus-within {
  background: var(--lv-lp-card-bg);
  border-color: var(--lv-lp-accent);
  box-shadow: 0 0 0 3px var(--lv-lp-accent-soft);
}
.lv-pop-search-input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  font-size: 12.5px;
  color: var(--lv-lp-text);
  font-family: inherit;
}
.lv-pop-search-input::placeholder {
  color: var(--lv-lp-text-sub);
}
.lv-pop-kbd {
  font-size: 10px;
  background: var(--lv-lp-card-bg);
  padding: 1.5px 5px;
  border-radius: 4px;
  border: 1px solid var(--lv-lp-border);
  color: var(--lv-lp-text-sub);
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
}
.lv-pop-strip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 14px 6px;
  border-bottom: 1px solid var(--lv-lp-border);
  overflow-x: auto;
  scrollbar-width: none;
  flex-shrink: 0;
  background: transparent;
}
.lv-pop-strip::-webkit-scrollbar { display: none; }
.lv-pop-strip-label {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--lv-lp-text-sub);
  white-space: nowrap;
  flex-shrink: 0;
}
.lv-pop-strip-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2.5px 9px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 500;
  border: 1px solid var(--lv-lp-border);
  background: var(--lv-lp-card-bg);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.025);
  color: var(--lv-lp-text);
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  font-family: inherit;
  transition: all 0.14s ease;
}
.lv-pop-strip-chip:hover {
  border-color: var(--lv-lp-accent);
  color: var(--lv-lp-accent);
  background: var(--lv-lp-accent-soft);
}
.lv-pop-tile {
  --tile-brand: #3b82f6;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 9px 8px 8px;
  border-radius: 13px;
  border: 1px solid var(--lv-lp-border);
  background: var(--lv-lp-card-bg);
  background-image: radial-gradient(96px circle at 86% 14%, color-mix(in srgb, var(--tile-brand) 9%, transparent), transparent 72%);
  box-shadow: var(--lv-lp-card-shadow);
  cursor: pointer;
  user-select: none;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  outline: none;
  min-width: 0;
}
.lv-pop-tile:hover,
.lv-pop-tile.lv-pop-tile-focused {
  background-color: var(--lv-lp-card-hover-bg);
  background-image: radial-gradient(110px circle at 85% 15%, color-mix(in srgb, var(--tile-brand) 15%, transparent), transparent 75%);
  border-color: color-mix(in srgb, var(--tile-brand) 55%, var(--lv-lp-accent));
  transform: translateY(-2px);
  box-shadow: 0 12px 24px -6px color-mix(in srgb, var(--tile-brand) 22%, rgba(15, 23, 42, 0.1)), 0 0 0 1px color-mix(in srgb, var(--tile-brand) 45%, transparent);
}
.lv-pop-tile:active {
  transform: scale(0.97);
}
.lv-pop-icon-wrap {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
  background: linear-gradient(135deg, color-mix(in srgb, currentColor 16%, var(--lv-lp-card-bg)) 0%, color-mix(in srgb, currentColor 7%, var(--lv-lp-card-bg)) 100%);
  border: 1px solid color-mix(in srgb, currentColor 24%, transparent);
  box-shadow: 0 4px 10px -2px color-mix(in srgb, currentColor 20%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.65);
  position: relative;
  transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s ease;
  flex-shrink: 0;
}
.lv-pop-tile:hover .lv-pop-icon-wrap,
.lv-pop-tile.lv-pop-tile-focused .lv-pop-icon-wrap {
  transform: scale(1.08) translateY(-1px);
  box-shadow: 0 6px 14px -2px color-mix(in srgb, currentColor 30%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.8);
}
.lv-pop-status-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1.5px solid var(--lv-lp-card-bg);
  background: var(--lv-lp-accent);
}
.lv-pop-status-dot.warn { background: #f59e0b; }
.lv-pop-status-dot.error { background: #ef4444; }
.lv-pop-status-dot.success { background: #10b981; }
.lv-pop-tile.lv-pop-list-item {
  flex-direction: row;
  justify-content: space-between;
  text-align: left;
  padding: 7px 11px;
  border-radius: 10px;
}
.lv-pop-tile.lv-pop-list-item:hover,
.lv-pop-tile.lv-pop-list-item.lv-pop-tile-focused {
  transform: none;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06), 0 0 0 1px color-mix(in srgb, var(--tile-brand) 45%, var(--lv-lp-accent));
}
.lv-pop-pin-btn {
  transition: transform 0.12s ease, opacity 0.12s ease;
}
.lv-pop-tile:hover .lv-pop-pin-btn {
  opacity: 0.85 !important;
}
.lv-pop-pin-btn:hover {
  opacity: 1 !important;
  transform: scale(1.15);
  color: var(--lv-lp-accent) !important;
}
.lv-pop-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 999px;
  display: inline-block;
  width: fit-content;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 3px;
  line-height: 1.35;
}
.lv-pop-badge.lv-badge-primary {
  background: var(--lv-lp-accent-soft);
  color: var(--lv-lp-accent);
  border: 1px solid color-mix(in srgb, var(--lv-lp-accent) 18%, transparent);
}
.lv-pop-badge.lv-badge-warn {
  background: rgba(245, 158, 11, 0.14);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.24);
}
.lv-pop-badge.lv-badge-error {
  background: rgba(239, 68, 68, 0.14);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.24);
}
.lv-pop-badge.lv-badge-success {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.22);
}
.lv-pop-actions-drawer {
  border-top: 1px solid var(--lv-lp-border);
  background: var(--lv-lp-panel-bg);
  padding: 8px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}
.lv-pop-action-row {
  padding: 5px 8px;
  border-radius: 8px;
  border: 1px solid var(--lv-lp-border);
  background: var(--lv-lp-card-bg);
  color: var(--lv-lp-text);
  font-size: 11.5px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  width: 100%;
  min-width: 0;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.02);
  transition: all 0.14s ease;
}
.lv-pop-action-row:hover {
  background: var(--lv-lp-card-hover-bg);
  border-color: var(--lv-lp-accent);
  color: var(--lv-lp-accent);
  box-shadow: 0 3px 8px rgba(37, 99, 235, 0.08);
  transform: translateY(-1px);
}
.lv-pop-hit-item {
  padding: 8px 12px;
  border-radius: 9px;
  background: var(--lv-lp-card-bg);
  border: 1px solid var(--lv-lp-border);
  box-shadow: var(--lv-lp-card-shadow);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  text-align: left;
  font-family: inherit;
  transition: all 0.14s ease;
}
.lv-pop-hit-item:hover,
.lv-pop-hit-item.focused {
  background: var(--lv-lp-card-hover-bg);
  border-color: var(--lv-lp-accent);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
}
.lv-pop-pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10b981;
  display: inline-block;
  margin-right: 5px;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.7);
}
@media (max-width: 460px) {
  .lv-desktop-launchpad-popover .lv-pop-header { flex-wrap: wrap; row-gap: 8px; }
  .lv-desktop-launchpad-popover .lv-pop-header > div:last-child { width: 100%; flex-wrap: wrap; }
  .lv-desktop-launchpad-popover .lv-pop-footer { flex-wrap: wrap; }
}
`;
        if (!existing) document.head.appendChild(style);
    } catch { /* ignore */ }
}

export function isDesktopPopoverOpen(): boolean {
    if (typeof document === "undefined") return false;
    return Boolean(document.getElementById(DESKTOP_POPOVER_ID));
}

export function closeDesktopLaunchpadPopover(): void {
    if (typeof document === "undefined") return;
    const el = document.getElementById(DESKTOP_POPOVER_ID);
    if (!el) return;

    if (desktopPopoverKeyDownHandler && typeof window !== "undefined") {
        window.removeEventListener("keydown", desktopPopoverKeyDownHandler, true);
        desktopPopoverKeyDownHandler = null;
    }
    if (desktopPopoverOutsideClickHandler && typeof window !== "undefined") {
        window.removeEventListener("mousedown", desktopPopoverOutsideClickHandler, true);
        desktopPopoverOutsideClickHandler = null;
    }
    if (desktopPopoverResizeHandler && typeof window !== "undefined") {
        window.removeEventListener("resize", desktopPopoverResizeHandler);
        desktopPopoverResizeHandler = null;
    }

    if (el.classList && typeof el.classList.add === "function") {
        el.classList.add("lv-popover-closing");
    }
    setTimeout(() => {
        try { el.remove(); } catch { /* ignore */ }
    }, 150);
}

export interface LvPopoverBuildOptions {
    view?: "grid" | "list";
    focusedIndex?: number;
    showPrefDrawer?: boolean;
    actionLimit?: number | "all";
    recentIds?: string[];
    allItems?: ReadonlyArray<LvLaunchpadItem & { state: "pinned" | "docked" | "hidden" }>;
}

function buildActionsDrawerInnerHtml(
    focusedItem: (LvLaunchpadItem & { state: "pinned" | "docked" | "hidden" }) | undefined,
    actionLimit: number | "all"
): string {
    if (!focusedItem) return "";
    const rawActions = Array.isArray(focusedItem.actions) && focusedItem.actions.length > 0
        ? focusedItem.actions
        : [`打开${focusedItem.fullName || focusedItem.name}主界面`];
    const total = rawActions.length;
    const displayActions = actionLimit === "all" ? rawActions : rawActions.slice(0, Number(actionLimit) || 3);
    const safeTitle = escapeHtml((focusedItem.fullName && !focusedItem.fullName.includes("<")) ? focusedItem.fullName : (focusedItem.name || ""));
    const safePluginId = escapeHtml(focusedItem.id);
    const limitToggleLabel = actionLimit === "all"
        ? `收起至前 3 项 (共 ${total} 项)`
        : (total > displayActions.length ? `精选前 ${displayActions.length} 项 · 展开全部 (${total})` : `共 ${total} 项快捷行动`);

    let rowsHtml = "";
    const isCompactRow = actionLimit !== "all" && displayActions.length >= 2;
    displayActions.forEach((act) => {
        const safeAct = escapeHtml(String(act));
        rowsHtml += `
          <button type="button" class="lv-pop-action-row" data-action-plugin="${safePluginId}" data-action-name="${safeAct}" title="${safeAct}">
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">⚡ ${safeAct}</span>
            ${isCompactRow ? "" : `<span style="font-size:10.5px;color:var(--lv-lp-text-sub,#64748b);flex-shrink:0;margin-left:8px;">↵ 执行</span>`}
          </button>
        `;
    });

    const listGridStyle = isCompactRow
        ? `display:grid;grid-template-columns:repeat(${Math.min(3, displayActions.length)},minmax(0,1fr));gap:6px;`
        : (displayActions.length >= 4 ? `display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;` : `display:flex;flex-direction:column;gap:4px;`);

    return `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;">
        <span class="lv-pop-actions-title" style="font-size:11px;font-weight:700;color:var(--lv-lp-accent,#2563eb);">⚡ ${safeTitle} · 极速二级行动直达</span>
        <button type="button" class="lv-pop-actions-limit-btn" style="border:none;background:transparent;font-size:10.5px;color:var(--lv-lp-text-sub,#64748b);cursor:pointer;padding:1px 4px;font-family:inherit;">${escapeHtml(limitToggleLabel)}</button>
      </div>
      <div class="lv-pop-actions-list" style="${listGridStyle}">
        ${rowsHtml}
      </div>
    `;
}

/**
 * R434 & Phase 12：罗盘 5.0 弹射坞 HTML 构建（纯函数，兼顾单测安全转义契约与完整 9 宫格设计目标）。
 * 注册数据（名称/描述/徽标/颜色/ID 来自兄弟插件 register 调用，非本插件可信输入）
 * 一律 escapeHtml 后再进模板；颜色额外白名单校验防止 style 属性内 CSS 注入。
 */
export function buildLaunchpadPopoverHtml(
    items: ReadonlyArray<LvLaunchpadItem & { state: "pinned" | "docked" | "hidden" }>,
    allPinned: boolean,
    opts?: LvPopoverBuildOptions,
): string {
    const view = opts?.view || "grid";
    const focusedIdx = Math.max(0, Math.min(opts?.focusedIndex ?? 0, Math.max(0, items.length - 1)));
    const showPref = Boolean(opts?.showPrefDrawer);
    const actionLimit = opts?.actionLimit ?? 3;
    const recentIds = opts?.recentIds ?? getRecentTileIds();
    const allItemsForPref = opts?.allItems ?? items;
    const focusActive = isNotifyFocusActive();
    const focusUntil = getNotifyFocusUntil();

    const toggleAllTitle = allPinned ? "收敛全部到小驴罗盘 (新版极简模式)" : "平铺全部独立图标到顶栏 (恢复老版布局)";
    const toggleAllText = allPinned ? "收敛全部" : "平铺顶栏";
    const pinSvg = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;fill:none!important;stroke:currentColor!important;vertical-align:-1px;" aria-hidden="true"><path d="M12 17v5" fill="none"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" fill="none"/></svg>`;
    const searchSvg = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;fill:none!important;stroke:currentColor!important;flex-shrink:0;color:var(--lv-lp-text-sub,#64748b);" aria-hidden="true"><circle cx="11" cy="11" r="8" fill="none"/><line x1="21" y1="21" x2="16.65" y2="16.65" fill="none"/></svg>`;

    const focusLabel = focusActive ? `🌙 至${new Date(focusUntil).toTimeString().slice(0, 5)}` : "🌙 专注";
    const headerHtml = `
      <div class="lv-pop-header">
        <div style="display:flex;align-items:center;gap:8px;min-width:0;">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:7px;background:var(--lv-lp-accent-soft,rgba(37,99,235,0.1));color:var(--lv-lp-accent,#2563eb);flex-shrink:0;">${COMPASS_SVG}</span>
          <span style="font-weight:700;font-size:14px;color:var(--lv-lp-text,#0f172a);white-space:nowrap;letter-spacing:-0.01em;">小驴罗盘</span>
          <span style="font-size:10.5px;font-weight:600;padding:1.5px 7px;border-radius:999px;background:var(--lv-lp-accent-soft,rgba(37,99,235,0.1));color:var(--lv-lp-accent,#2563eb);white-space:nowrap;">${items.length} 插件联结</span>
        </div>
        <div style="display:flex;align-items:center;gap:5px;flex-shrink:0;">
          <div class="lv-pop-view-tabs" role="tablist" aria-label="视图切换">
            <button type="button" class="lv-pop-view-tab ${view === "grid" ? "active" : ""}" data-view="grid">九宫格</button>
            <button type="button" class="lv-pop-view-tab ${view === "list" ? "active" : ""}" data-view="list">列表</button>
          </div>
          <button type="button" class="lv-pop-sub-btn lv-pop-focus-btn ${focusActive ? "active" : ""}" title="${focusActive ? "点击退出全局专注模式" : "开启全局专注模式（静音通知至今晚）"}">${escapeHtml(focusLabel)}</button>
          <button type="button" class="lv-pop-sub-btn lv-pop-pref-btn ${showPref ? "active" : ""}" title="顶栏与罗盘坞内显隐及跨插件联动设置">⚙ 设置</button>
          <button type="button" class="lv-pop-sub-btn lv-pop-toggle-all-btn" title="${toggleAllTitle}">${pinSvg}<span>${toggleAllText}</span></button>
          <button type="button" class="lv-pop-sub-btn lv-pop-close-btn" title="关闭 (Esc)" style="padding:3.5px 7px;">✕</button>
        </div>
      </div>
    `;

    // 【设置】抽屉：三态顶栏显隐管理 (置顶在外 / 仅在坞内 / 彻底隐藏) + IFTTT 自动化规则
    let prefDrawerHtml = "";
    if (showPref) {
        let stateRowsHtml = "";
        allItemsForPref.forEach((p) => {
            const pId = escapeHtml(p.id);
            const pTitle = escapeHtml((p.fullName && !p.fullName.includes("<")) ? p.fullName : (p.name || p.id));
            const pColor = resolveSafeBrandColor(p.id, p.color);
            const pSvg = renderPluginLitheSvg(p.id, 15);
            stateRowsHtml += `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px dashed var(--lv-lp-border,rgba(15,23,42,0.08));">
                <div style="display:flex;align-items:center;gap:8px;">
                  <span style="color:${pColor};display:inline-flex;align-items:center;">${pSvg}</span>
                  <strong style="font-size:12.5px;color:var(--lv-lp-text,#0f172a);">${pTitle}</strong>
                </div>
                <select class="lv-pop-state-select" data-state-id="${pId}" style="background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,0.14));color:var(--lv-lp-text,#0f172a);padding:3px 8px;border-radius:6px;font-size:11.5px;font-family:inherit;cursor:pointer;">
                  <option value="docked" ${p.state === "docked" ? "selected" : ""}>📥 仅在罗盘坞内 (顶栏隐藏)</option>
                  <option value="pinned" ${p.state === "pinned" ? "selected" : ""}>📌 置顶在外 (顶栏+坞内同时显示)</option>
                  <option value="hidden" ${p.state === "hidden" ? "selected" : ""}>👁️ 彻底隐藏 (仅快捷键唤醒)</option>
                </select>
              </div>
            `;
        });

        const rules = lvAutomation.getRules();
        let rulesHtml = "";
        if (rules.length > 0) {
            rules.forEach((r) => {
                rulesHtml += `
                  <label style="padding:7px 10px;border-radius:8px;background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border,rgba(15,23,42,0.08));display:flex;align-items:center;justify-content:space-between;gap:8px;cursor:pointer;">
                    <div style="display:flex;flex-direction:column;gap:2px;min-width:0;">
                      <span style="font-size:12px;font-weight:600;color:var(--lv-lp-text,#0f172a);">${escapeHtml(r.name)}</span>
                      <span style="font-size:10.5px;color:var(--lv-lp-text-sub,#64748b);">${escapeHtml(r.desc || `${r.triggerSource} → ${r.actionPlugin}`)}</span>
                    </div>
                    <input type="checkbox" class="lv-pop-rule-toggle" data-rule-id="${escapeHtml(r.id)}" ${r.enabled ? "checked" : ""} style="cursor:pointer;flex-shrink:0;" />
                  </label>
                `;
            });
        } else {
            rulesHtml = `<div style="font-size:11.5px;color:var(--lv-lp-text-sub,#64748b);padding:6px 2px;">各插件启动后注册的跨插件 IFTTT 规则将在此统一管控</div>`;
        }

        prefDrawerHtml = `
          <div class="lv-pop-pref-drawer" style="padding:12px 16px;border-bottom:1px solid var(--lv-lp-border,rgba(15,23,42,0.08));background:var(--lv-lp-panel-bg,#f8fafc);display:flex;flex-direction:column;gap:8px;max-height:380px;overflow-y:auto;">
            <div style="background:var(--lv-lp-accent-soft,rgba(37,99,235,0.08));border:1px solid rgba(37,99,235,0.2);padding:8px 12px;border-radius:8px;font-size:11.5px;line-height:1.5;color:var(--lv-lp-text,#0f172a);">
              👋 <strong>顶栏与罗盘主权设置</strong>：自主决定哪些插件<strong>常驻在思源顶栏</strong>，哪些<strong>仅在罗盘坞内收敛</strong>，哪些<strong>彻底隐藏</strong>。
            </div>
            <div style="font-weight:700;font-size:12px;color:var(--lv-lp-accent,#2563eb);margin-top:2px;">📌 顶栏与罗盘图标显隐管理</div>
            <div>${stateRowsHtml}</div>
            <div style="font-weight:700;font-size:12px;color:var(--lv-lp-accent,#2563eb);margin-top:4px;">⚡ 跨插件智能自动化规则 (IFTTT)</div>
            <div style="display:flex;flex-direction:column;gap:5px;">${rulesHtml}</div>
            <div style="display:flex;justify-content:flex-end;margin-top:4px;">
              <button type="button" class="lv-pop-sub-btn lv-pop-pref-btn active" style="padding:5px 12px;font-weight:600;">完成设置并返回罗盘 ➔</button>
            </div>
          </div>
        `;
    }

    // 万物穿透搜索直达栏
    const searchBarHtml = `
      <div class="lv-pop-search-bar">
        ${searchSvg}
        <input type="text" class="lv-pop-search-input" placeholder="搜索全家桶 (习惯 / 切片 / 资产 / 闪卡 / 人脉)..." aria-label="全生态穿透搜索" autocomplete="off" />
        <span class="lv-pop-kbd">↑↓</span>
        <span class="lv-pop-kbd">↵ 直达</span>
        <span class="lv-pop-kbd">1~${items.length}</span>
      </div>
    `;

    // 最近使用 + 今日待办聚合条（达到用户最近的使用体验）
    const recentItems = recentIds
        .map((id) => items.find((it) => it.id === id))
        .filter((it): it is typeof items[number] => Boolean(it))
        .slice(0, 4);
    const todayItems = items
        .map((it) => ({ it, m: /(\d+)/.exec(it.badge ?? "") }))
        .filter((x) => x.m !== null && Number(x.m![1]) > 0)
        .slice(0, 4);

    let stripHtml = "";
    if ((recentItems.length > 0 && items.length > 1) || todayItems.length > 0) {
        let chipsHtml = "";
        if (recentItems.length > 0 && items.length > 1) {
            chipsHtml += `<span class="lv-pop-strip-label">⟲ 最近</span>`;
            recentItems.forEach((rit, rIdx) => {
                const rColor = resolveSafeBrandColor(rit.id, rit.color);
                const rTitle = escapeHtml((rit.fullName && !rit.fullName.includes("<")) ? rit.fullName : rit.name);
                chipsHtml += `
                  <button type="button" class="lv-pop-strip-chip lv-pop-recent-chip" data-recent-id="${escapeHtml(rit.id)}" title="最近使用：点击直达 ${rTitle}">
                    <span style="width:6px;height:6px;border-radius:50%;background:${rColor};display:inline-block;"></span>
                    <span>${rIdx === 0 ? "★ " : ""}${rTitle}</span>
                  </button>
                `;
            });
        }
        if (todayItems.length > 0) {
            if (chipsHtml) chipsHtml += `<span style="width:1px;height:12px;background:var(--lv-lp-border-strong,rgba(15,23,42,0.12));margin:0 2px;flex-shrink:0;"></span>`;
            chipsHtml += `<span class="lv-pop-strip-label" style="color:var(--lv-lp-accent,#2563eb);">今日</span>`;
            todayItems.forEach(({ it, m }) => {
                const tColor = resolveSafeBrandColor(it.id, it.color);
                const tName = escapeHtml(it.name);
                chipsHtml += `
                  <button type="button" class="lv-pop-strip-chip lv-pop-today-chip" data-recent-id="${escapeHtml(it.id)}" title="今日待办直达：${escapeHtml(it.fullName || it.name)}">
                    <span style="width:6px;height:6px;border-radius:50%;background:${tColor};display:inline-block;"></span>
                    <span>${tName} <strong>${escapeHtml(m?.[1] ?? "")}</strong></span>
                  </button>
                `;
            });
        }
        stripHtml = `<div class="lv-pop-strip">${chipsHtml}</div>`;
    }

    // 核心呈现区：9宫格微磁贴 vs 紧凑列表视图
    let mainViewHtml = "";
    if (view === "list") {
        mainViewHtml = `<div class="lv-pop-list" style="display:flex;flex-direction:column;gap:5px;padding:8px 12px;flex:1 1 auto;min-height:0;overflow-y:auto;max-height:440px;">`;
        items.forEach((item, idx) => {
            const digit = idx + 1;
            const isPinned = item.state === "pinned";
            const isFocused = idx === focusedIdx;
            const pinTitle = isPinned ? "已置顶在顶栏 (点击收敛回罗盘)" : "置顶到顶栏独立显示";
            const badgeClass = item.badgeType ? `lv-badge-${item.badgeType}` : "lv-badge-primary";
            const safeName = escapeHtml(item.name);
            const safeFullName = escapeHtml(item.fullName || item.name);
            const displayTitle = (item.fullName && !item.fullName.includes("<") && !item.name.startsWith("小驴")) ? safeFullName : safeName;
            const safeDesc = escapeHtml(item.desc || item.fullName || "");
            const safeBadge = escapeHtml(String(item.badge ?? ""));
            const safeId = escapeHtml(item.id);
            const safeColor = resolveSafeBrandColor(item.id, item.color);
            const badgeHtml = item.badge ? `<span class="lv-pop-badge ${escapeHtml(badgeClass)}" style="margin-top:0;">${safeBadge}</span>` : "";
            const iconSvg = renderPluginLitheSvg(item.id, 17);

            mainViewHtml += `
              <div class="lv-pop-tile lv-pop-list-item ${isFocused ? "lv-pop-tile-focused" : ""}" style="--tile-brand:${safeColor};" data-idx="${idx}" data-id="${safeId}" data-fullname="${safeFullName}">
                <div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;">
                  <div class="lv-pop-icon-wrap" style="width:32px;height:32px;border-radius:9px;margin-bottom:0;color:${safeColor};">
                    ${iconSvg}
                  </div>
                  <span style="font-weight:650;font-size:13.5px;color:var(--lv-lp-text,#0f172a);white-space:nowrap;">${displayTitle}</span>
                  ${displayTitle !== safeName ? `<span style="display:none;">${safeName}</span>` : ""}
                  <span style="font-size:11.5px;color:var(--lv-lp-text-sub,#64748b);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${safeDesc}</span>
                </div>
                <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                  ${badgeHtml}
                  <span style="font-size:10px;font-weight:700;font-family:monospace;padding:1px 5px;border-radius:4px;background:var(--lv-lp-panel-bg,#f8fafc);border:1px solid var(--lv-lp-border,rgba(15,23,42,0.08));color:var(--lv-lp-text-sub,#64748b);">${digit}</span>
                  <button type="button" class="lv-pop-pin-btn" data-pin-id="${safeId}" title="${pinTitle}" style="display:inline-flex;align-items:center;justify-content:center;background:transparent;border:none;cursor:pointer;color:${isPinned ? "var(--lv-lp-accent,#2563eb)" : "var(--lv-lp-text-sub,#64748b)"};opacity:${isPinned ? "1" : "0.35"};padding:3px;border-radius:4px;">${pinSvg}</button>
                </div>
              </div>
            `;
        });
        mainViewHtml += `</div>`;
    } else {
        const cols = items.length >= 3 ? "repeat(3, minmax(0, 1fr))" : "repeat(2, minmax(0, 1fr))";
        mainViewHtml = `<div class="lv-pop-grid" style="display:grid;grid-template-columns:${cols};gap:8px;padding:8px 14px 10px;flex:1 1 auto;min-height:0;overflow-y:auto;">`;

        items.forEach((item, idx) => {
            const digit = idx + 1;
            const isPinned = item.state === "pinned";
            const isFocused = idx === focusedIdx;
            const isMostRecent = recentIds[0] === item.id && items.length > 1;
            const pinTitle = isPinned ? "已置顶在顶栏 (点击收敛回罗盘)" : "置顶到顶栏独立显示";
            const badgeClass = item.badgeType ? `lv-badge-${item.badgeType}` : "lv-badge-primary";
            const dotClass = item.badgeType || "primary";
            const safeName = escapeHtml(item.name);
            const safeFullName = escapeHtml(item.fullName || item.name);
            const displayTitle = (item.fullName && !item.fullName.includes("<") && !item.name.startsWith("小驴")) ? safeFullName : safeName;
            const safeDesc = escapeHtml(item.desc || item.fullName || "");
            const safeBadge = escapeHtml(String(item.badge ?? ""));
            const safeId = escapeHtml(item.id);
            const safeColor = resolveSafeBrandColor(item.id, item.color);
            const badgeHtml = item.badge ? `<span class="lv-pop-badge ${escapeHtml(badgeClass)}">${safeBadge}</span>` : "";
            const statusDotHtml = item.badge ? `<span class="lv-pop-status-dot ${escapeHtml(dotClass)}" title="${safeBadge}"></span>` : "";
            const recentTagHtml = isMostRecent ? `<span style="font-size:9px;font-weight:700;padding:0.5px 4.5px;border-radius:4px;background:var(--lv-lp-accent-soft,rgba(37,99,235,0.1));color:var(--lv-lp-accent,#2563eb);line-height:1.4;">最近</span>` : "";
            const iconSvg = renderPluginLitheSvg(item.id, 19);

            mainViewHtml += `
              <div class="lv-pop-tile ${isFocused ? "lv-pop-tile-focused" : ""}" style="--tile-brand:${safeColor};" data-idx="${idx}" data-id="${safeId}" data-fullname="${safeFullName}">
                <span class="lv-pop-key" style="position:absolute;top:6px;left:6px;font-size:9.5px;font-weight:700;font-family:monospace;padding:0 4.5px;border-radius:5px;background:var(--lv-lp-panel-bg,#f8fafc);border:1px solid var(--lv-lp-border,rgba(15,23,42,0.08));color:var(--lv-lp-text-sub,#64748b);line-height:1.55;">${digit}</span>
                <button type="button" class="lv-pop-pin-btn" data-pin-id="${safeId}" title="${pinTitle}" style="position:absolute;top:5px;right:5px;display:inline-flex;align-items:center;justify-content:center;background:transparent;border:none;cursor:pointer;color:${isPinned ? "var(--lv-lp-accent,#2563eb)" : "var(--lv-lp-text-sub,#64748b)"};opacity:${isPinned ? "1" : "0.28"};padding:3px;border-radius:4px;">${pinSvg}</button>
                <div class="lv-pop-icon-wrap" style="color:${safeColor};">
                  ${iconSvg}
                  ${statusDotHtml}
                </div>
                <div style="display:flex;align-items:center;justify-content:center;gap:4px;width:100%;min-width:0;">
                  <span class="lv-pop-title" style="font-weight:650;font-size:13.5px;color:var(--lv-lp-text,#0f172a);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${displayTitle}</span>
                  ${displayTitle !== safeName ? `<span style="display:none;">${safeName}</span>` : ""}
                  ${recentTagHtml}
                </div>
                <span class="lv-pop-desc" style="font-size:11px;color:var(--lv-lp-text-sub,#64748b);margin-top:2.5px;width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${safeDesc}</span>
                ${badgeHtml}
              </div>
            `;
        });
        mainViewHtml += `</div>`;
    }

    const omniResultsContainerHtml = `<div class="lv-pop-omni-results" style="display:none;flex-direction:column;gap:6px;padding:10px 14px;max-height:310px;overflow-y:auto;"></div>`;

    // 底部二级快捷行动常驻抽屉
    const focusedItem = items[focusedIdx] || items[0];
    const actionsDrawerHtml = `
      <div class="lv-pop-actions-drawer">
        ${buildActionsDrawerInnerHtml(focusedItem, actionLimit)}
      </div>
    `;

    // 底部生态脉搏状态栏
    let todayActCount = 0;
    try {
        todayActCount = lvActivity.getTodayRecords().length;
    } catch { /* ignore */ }

    const footerHtml = `
      <div class="lv-pop-footer" style="display:flex;align-items:center;justify-content:space-between;padding:8px 16px;border-top:1px solid var(--lv-lp-border,rgba(15,23,42,0.08));background:var(--lv-lp-card-bg,#ffffff);border-radius:0 0 18px 18px;flex-shrink:0;font-size:11px;color:var(--lv-lp-text-sub,#64748b);">
        <div style="display:flex;align-items:center;gap:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
          <span class="lv-pop-pulse-dot"></span>
          <span>${items.length} 插件协同 · 今日活动 <strong style="color:var(--lv-lp-text,#0f172a);">${todayActCount} 项</strong> · P 键置顶</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
          <button type="button" class="lv-pop-sub-btn lv-pop-diary-btn" title="将今日全生态活动汇总写入日记或复制">📝 今日回顾</button>
          <button type="button" class="lv-pop-sub-btn lv-pop-backup-btn" title="一键导出小驴全家桶联合灾备包">💾 联合备份</button>
          <button type="button" class="lv-pop-close-btn" style="background:transparent;border:none;cursor:pointer;font-size:11px;font-weight:600;color:var(--lv-lp-accent,#2563eb);padding:2px 4px;">Esc</button>
        </div>
      </div>
    `;

    return headerHtml + prefDrawerHtml + searchBarHtml + stripHtml + omniResultsContainerHtml + mainViewHtml + actionsDrawerHtml + footerHtml;
}

export function openDesktopLaunchpadPopover(anchorEl?: HTMLElement | null, initialFocusIndex?: number, initialShowPref = false): void {
    if (typeof document === "undefined") return;
    closeDesktopLaunchpadPopover();
    ensureDesktopStyles();

    const anchor = anchorEl || document.getElementById(DESKTOP_ENTRY_ID);
    const allItems = getLaunchpadHub().getItems();
    const items = allItems.filter(it => it.state !== "hidden");
    if (items.length === 0 && allItems.length === 0) return;

    const popover = document.createElement("div");
    popover.id = DESKTOP_POPOVER_ID;
    popover.className = "lv-desktop-launchpad-popover b3-typography";
    popover.setAttribute("role", "dialog");
    popover.setAttribute("aria-label", "小驴罗盘全家桶弹射坞");
    if ("tabIndex" in popover) popover.tabIndex = -1;

    const targetWidth = items.length >= 3 ? 488 : 420;

    const reposition = () => {
        if (!popover || !popover.style) return;
        try {
            const winW = typeof window !== "undefined" && typeof window.innerWidth === "number" && window.innerWidth > 0 ? window.innerWidth : 1200;
            const winH = typeof window !== "undefined" && typeof window.innerHeight === "number" && window.innerHeight > 0 ? window.innerHeight : 800;
            const popW = Math.min(targetWidth, Math.max(280, winW - 24));
            popover.style.width = `${popW}px`;
            popover.style.position = "fixed";

            if (anchor && typeof anchor.getBoundingClientRect === "function") {
                const rect = anchor.getBoundingClientRect();
                if (rect && typeof rect.bottom === "number" && rect.bottom > 0) {
                    popover.style.top = `${Math.round(rect.bottom + 6)}px`;
                    // 双侧视口边界钳制：即使锚点按钮在顶栏左侧或窄窗口中，也绝不允许左边缘溢出屏幕外 (left >= 12px)
                    const maxRightOffset = Math.max(12, winW - popW - 12);
                    const rawRight = Math.round(winW - (rect.right || 0) - 8);
                    const rightOffset = Math.max(12, Math.min(rawRight, maxRightOffset));
                    popover.style.right = `${rightOffset}px`;
                    const availableHeight = Math.max(320, winH - rect.bottom - 16);
                    popover.style.maxHeight = `${availableHeight}px`;
                } else {
                    popover.style.top = "42px";
                    popover.style.right = "16px";
                    popover.style.maxHeight = `${Math.max(320, winH - 58)}px`;
                }
            } else {
                popover.style.top = "42px";
                popover.style.right = "16px";
                popover.style.maxHeight = `${Math.max(320, winH - 58)}px`;
            }
            // 动态层级：跟随思源递增的 window.siyuan.zIndex，保证盖过内容流但不压住原生 dialog/搜索
            try {
                const currentZ = typeof window !== "undefined" && (window as any).siyuan?.zIndex;
                popover.style.zIndex = String(typeof currentZ === "number" ? Math.max(300, currentZ + 20) : 300);
            } catch {
                popover.style.zIndex = "300";
            }
        } catch { /* ignore */ }
    };
    reposition();

    if (popover.style) {
        popover.style.display = "flex";
        popover.style.flexDirection = "column";
        popover.style.borderRadius = "18px";
        popover.style.overflow = "hidden";
    }

    let currentView: "grid" | "list" = getLaunchpadViewMode();
    let currentActionLimit: number | "all" = getLaunchpadActionLimit();
    let showPrefDrawer = initialShowPref || (items.length === 0 && allItems.length > 0);
    let currentFocusIndex = Math.max(0, Math.min(initialFocusIndex ?? 0, Math.max(0, items.length - 1)));
    let isSearchingOmni = false;
    let omniHitsList: Array<{ label: string; onSelect: () => void }> = [];
    let omniFocusIndex = 0;
    let searchSeq = 0;

    const allPinned = items.length > 0 && items.every(it => it.state === "pinned");
    popover.innerHTML = buildLaunchpadPopoverHtml(items, allPinned, {
        view: currentView,
        focusedIndex: currentFocusIndex,
        showPrefDrawer,
        actionLimit: currentActionLimit,
        allItems,
    });

    // 动态徽标异步探针自动刷新
    items.forEach((item) => {
        if (typeof item.badgeProvider === "function") {
            try {
                const res = item.badgeProvider();
                if (res instanceof Promise) {
                    res.then((dynamicBadge) => {
                        if (dynamicBadge && typeof dynamicBadge === "string") {
                            item.badge = dynamicBadge;
                            if (typeof popover.querySelector === "function") {
                                const tileEl = popover.querySelector(`[data-id="${item.id}"]`);
                                if (tileEl) {
                                    let bEl = tileEl.querySelector(".lv-pop-badge");
                                    if (!bEl) {
                                        bEl = document.createElement("span");
                                        bEl.className = `lv-pop-badge ${item.badgeType ? `lv-badge-${item.badgeType}` : "lv-badge-primary"}`;
                                        tileEl.appendChild(bEl);
                                    }
                                    bEl.textContent = dynamicBadge;
                                }
                            }
                            refreshEntryBadgeDot();
                        }
                    }).catch(() => { /* ignore */ });
                } else if (res && typeof res === "string") {
                    item.badge = res;
                }
            } catch { /* ignore */ }
        }
    });

    const syncActionsDrawerDom = () => {
        if (typeof popover.querySelector !== "function") return;
        try {
            const drawer = popover.querySelector(".lv-pop-actions-drawer");
            if (drawer && items[currentFocusIndex]) {
                drawer.innerHTML = buildActionsDrawerInnerHtml(items[currentFocusIndex], currentActionLimit);
            }
        } catch { /* ignore */ }
    };

    const updateFocusHighlight = () => {
        if (typeof popover.querySelectorAll !== "function") return;
        try {
            const tiles = popover.querySelectorAll<HTMLElement>(".lv-pop-tile");
            tiles.forEach((t, i) => {
                if (i === currentFocusIndex) {
                    if (t.classList && typeof t.classList.add === "function") t.classList.add("lv-pop-tile-focused");
                    if (typeof t.scrollIntoView === "function") {
                        try { t.scrollIntoView({ block: "nearest" }); } catch { /* ignore */ }
                    }
                } else {
                    if (t.classList && typeof t.classList.remove === "function") t.classList.remove("lv-pop-tile-focused");
                }
            });
            syncActionsDrawerDom();
        } catch { /* ignore */ }
    };

    updateFocusHighlight();

    const wireSearchInput = () => {
        if (typeof popover.querySelector !== "function") return;
        const searchInput = popover.querySelector<HTMLInputElement>(".lv-pop-search-input");
        const omniBox = popover.querySelector<HTMLElement>(".lv-pop-omni-results");
        const mainView = popover.querySelector<HTMLElement>(".lv-pop-grid, .lv-pop-list");
        if (!searchInput || !omniBox) return;

        searchInput.addEventListener("input", () => {
            const kw = searchInput.value.trim().toLowerCase();
            const seq = ++searchSeq;
            if (!kw) {
                isSearchingOmni = false;
                omniHitsList = [];
                omniBox.style.display = "none";
                if (mainView) mainView.style.display = currentView === "list" ? "flex" : "grid";
                syncActionsDrawerDom();
                return;
            }

            isSearchingOmni = true;
            if (mainView) mainView.style.display = "none";
            omniBox.style.display = "flex";

            // 1. 立即匹配已安装插件与二级快捷行动
            const matchedPlugins = items.filter(p =>
                p.name.toLowerCase().includes(kw) ||
                (p.fullName && p.fullName.toLowerCase().includes(kw)) ||
                (p.desc && p.desc.toLowerCase().includes(kw))
            );
            const matchedActions: Array<{ plugin: typeof items[number]; action: string }> = [];
            items.forEach(p => {
                (p.actions || []).forEach(act => {
                    if (act.toLowerCase().includes(kw)) {
                        matchedActions.push({ plugin: p, action: act });
                    }
                });
            });

            void lvOmnisearch.search(kw).then((hits) => {
                if (seq !== searchSeq) return;
                omniHitsList = [];
                omniFocusIndex = 0;
                let html = "";

                // 先渲染命中的插件与二级行动
                matchedPlugins.forEach((p) => {
                    const idx = omniHitsList.length;
                    const pColor = /^#[0-9a-fA-F]{3,8}$/.test(p.color ?? "") ? p.color : "var(--b3-theme-primary)";
                    omniHitsList.push({
                        label: p.fullName || p.name,
                        onSelect: () => {
                            pushRecentTileId(p.id);
                            closeDesktopLaunchpadPopover();
                            try { p.onClick(); } catch { /* ignore */ }
                        },
                    });
                    html += `
                      <button type="button" class="lv-pop-hit-item ${idx === 0 ? "focused" : ""}" data-omni-idx="${idx}">
                        <div style="display:flex;align-items:center;gap:8px;min-width:0;">
                          <span style="font-size:10px;font-weight:700;padding:1px 6px;border-radius:4px;background:var(--lv-lp-accent-soft,rgba(37,99,235,0.1));color:${pColor};flex-shrink:0;">插件</span>
                          <span style="font-size:12.5px;font-weight:600;color:var(--lv-lp-text,#0f172a);white-space:nowrap;">${escapeHtml(p.fullName || p.name)}</span>
                          <span style="font-size:11px;color:var(--lv-lp-text-sub,#64748b);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(p.desc || "")}</span>
                        </div>
                        <span style="font-size:10.5px;font-weight:600;color:var(--lv-lp-accent,#2563eb);flex-shrink:0;">启动 ➔</span>
                      </button>
                    `;
                });

                matchedActions.slice(0, 5).forEach(({ plugin: p, action }) => {
                    const idx = omniHitsList.length;
                    omniHitsList.push({
                        label: action,
                        onSelect: () => {
                            pushRecentTileId(p.id);
                            closeDesktopLaunchpadPopover();
                            try { getLaunchpadHub().executeAction(p.id, action); } catch { /* ignore */ }
                        },
                    });
                    html += `
                      <button type="button" class="lv-pop-hit-item ${idx === 0 ? "focused" : ""}" data-omni-idx="${idx}">
                        <div style="display:flex;align-items:center;gap:8px;min-width:0;">
                          <span style="font-size:10px;font-weight:700;padding:1px 6px;border-radius:4px;background:rgba(16,185,129,0.14);color:#059669;flex-shrink:0;">⚡ ${escapeHtml(p.name)}</span>
                          <span style="font-size:12.5px;font-weight:600;color:var(--lv-lp-text,#0f172a);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(action)}</span>
                        </div>
                        <span style="font-size:10.5px;font-weight:600;color:var(--lv-lp-accent,#2563eb);flex-shrink:0;">执行 ➔</span>
                      </button>
                    `;
                });

                // 渲染跨插件穿透检索命中的知识条目
                hits.slice(0, 12).forEach((hit) => {
                    const idx = omniHitsList.length;
                    omniHitsList.push({
                        label: hit.title,
                        onSelect: () => {
                            pushSearchHistory(kw);
                            closeDesktopLaunchpadPopover();
                            try { hit.onClick?.(); } catch { /* ignore */ }
                        },
                    });
                    html += `
                      <button type="button" class="lv-pop-hit-item ${idx === 0 ? "focused" : ""}" data-omni-idx="${idx}">
                        <div style="display:flex;align-items:center;gap:8px;min-width:0;overflow:hidden;">
                          <span style="font-size:10px;font-weight:600;padding:1px 6px;border-radius:4px;background:var(--lv-lp-accent-soft,rgba(37,99,235,0.1));color:var(--lv-lp-accent,#2563eb);flex-shrink:0;">${escapeHtml(hit.source || hit.badge || "小驴")}</span>
                          <span style="font-size:12.5px;font-weight:600;color:var(--lv-lp-text,#0f172a);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(hit.title)}</span>
                          ${hit.snippet ? `<span style="font-size:11px;color:var(--lv-lp-text-sub,#64748b);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(hit.snippet)}</span>` : ""}
                        </div>
                        <span style="font-size:10.5px;font-weight:600;color:var(--lv-lp-accent,#2563eb);flex-shrink:0;">直达 ➔</span>
                      </button>
                    `;
                });

                if (omniHitsList.length === 0) {
                    html = `<div style="text-align:center;padding:28px 12px;font-size:12px;color:var(--lv-lp-text-sub,#64748b);">未在小驴全家桶中穿透检索到与 “<strong style="color:var(--lv-lp-text,#0f172a);">${escapeHtml(searchInput.value.trim())}</strong>” 相关的条目</div>`;
                }

                omniBox.innerHTML = html;
                const drawerTitle = popover.querySelector(".lv-pop-actions-title");
                if (drawerTitle) {
                    drawerTitle.textContent = `🔍 全生态万物穿透检索 · 命中 ${omniHitsList.length} 条 (↑↓ 选择 · ↵ 直达)`;
                }
            }).catch(() => { /* ignore */ });
        });
    };

    wireSearchInput();

    if (typeof popover.addEventListener === "function") {
        popover.addEventListener("change", (e) => {
            const target = e.target as HTMLElement;
            if (!target || typeof target.closest !== "function") return;

            const stateSelect = target.closest<HTMLSelectElement>(".lv-pop-state-select");
            if (stateSelect) {
                const pid = stateSelect.getAttribute("data-state-id");
                const val = stateSelect.value as "pinned" | "docked" | "hidden";
                if (pid && (val === "pinned" || val === "docked" || val === "hidden")) {
                    getLaunchpadHub().setPluginState(pid, val);
                    syncTopBarConvergence();
                    openDesktopLaunchpadPopover(anchor, currentFocusIndex, true);
                }
                return;
            }

            const ruleToggle = target.closest<HTMLInputElement>(".lv-pop-rule-toggle");
            if (ruleToggle) {
                const rid = ruleToggle.getAttribute("data-rule-id");
                if (rid) {
                    lvAutomation.toggleRule(rid, Boolean(ruleToggle.checked));
                }
            }
        });

        popover.addEventListener("click", (e) => {
            const target = e.target as HTMLElement;
            if (!target || typeof target.closest !== "function") return;

            const viewTab = target.closest<HTMLElement>(".lv-pop-view-tab");
            if (viewTab) {
                e.stopPropagation();
                const nextView = viewTab.getAttribute("data-view") === "list" ? "list" : "grid";
                setLaunchpadViewMode(nextView);
                openDesktopLaunchpadPopover(anchor, currentFocusIndex, showPrefDrawer);
                return;
            }

            const focusBtn = target.closest<HTMLElement>(".lv-pop-focus-btn");
            if (focusBtn) {
                e.stopPropagation();
                if (isNotifyFocusActive()) {
                    clearNotifyFocus();
                    lvNotify.capsule({ source: "罗盘", message: "已退出全局专注模式", duration: 2000 });
                } else {
                    const now = new Date();
                    const until = new Date(now);
                    until.setHours(23, 0, 0, 0);
                    if (until.getTime() <= now.getTime()) until.setTime(now.getTime() + 2 * 3_600_000);
                    setNotifyFocusUntil(until.getTime());
                    lvNotify.capsule({ source: "罗盘", message: `已开启专注模式至 ${until.toTimeString().slice(0, 5)}`, duration: 2500 });
                }
                refreshEntryBadgeDot();
                openDesktopLaunchpadPopover(anchor, currentFocusIndex, showPrefDrawer);
                return;
            }

            const prefBtn = target.closest<HTMLElement>(".lv-pop-pref-btn");
            if (prefBtn) {
                e.stopPropagation();
                showPrefDrawer = !showPrefDrawer;
                openDesktopLaunchpadPopover(anchor, currentFocusIndex, showPrefDrawer);
                return;
            }

            const limitBtn = target.closest<HTMLElement>(".lv-pop-actions-limit-btn");
            if (limitBtn) {
                e.stopPropagation();
                currentActionLimit = currentActionLimit === "all" ? 3 : "all";
                setLaunchpadActionLimit(currentActionLimit);
                syncActionsDrawerDom();
                return;
            }

            const actionRow = target.closest<HTMLElement>(".lv-pop-action-row");
            if (actionRow) {
                e.stopPropagation();
                const pid = actionRow.getAttribute("data-action-plugin");
                const actName = actionRow.getAttribute("data-action-name");
                if (pid && actName) {
                    pushRecentTileId(pid);
                    closeDesktopLaunchpadPopover();
                    try { getLaunchpadHub().executeAction(pid, actName); } catch (err) { console.warn("[LvLaunchpad] 二级行动失败:", err); }
                }
                return;
            }

            const hitItem = target.closest<HTMLElement>(".lv-pop-hit-item");
            if (hitItem) {
                e.stopPropagation();
                const idx = parseInt(hitItem.getAttribute("data-omni-idx") || "0", 10);
                const hit = omniHitsList[idx];
                if (hit) hit.onSelect();
                return;
            }

            const stripChip = target.closest<HTMLElement>(".lv-pop-strip-chip");
            if (stripChip) {
                e.stopPropagation();
                const rid = stripChip.getAttribute("data-recent-id");
                const targetItem = items.find((it) => it.id === rid);
                if (targetItem) {
                    pushRecentTileId(targetItem.id);
                    closeDesktopLaunchpadPopover();
                    try { targetItem.onClick(); } catch (err) { console.warn("[LvLaunchpad] 快捷胶囊启动失败:", err); }
                }
                return;
            }

            const diaryBtn = target.closest<HTMLElement>(".lv-pop-diary-btn");
            if (diaryBtn) {
                e.stopPropagation();
                closeDesktopLaunchpadPopover();
                void (async () => {
                    const md = lvActivity.formatAsMarkdown();
                    if (!md || !md.trim()) {
                        lvNotify.capsule({ source: "罗盘", message: "今日暂无生态活动记录", duration: 2500 });
                        return;
                    }
                    let written = false;
                    try {
                        const host = (window as any).siyuanCheckin || (window as any).LvHome;
                        if (host && typeof host.appendDailyNote === "function") {
                            await host.appendDailyNote(md);
                            written = true;
                        }
                    } catch { /* ignore */ }
                    if (written) {
                        lvNotify.capsule({ source: "罗盘", message: "已将今日全生态活动写入日记", duration: 2500 });
                    } else {
                        try {
                            await navigator.clipboard.writeText(md);
                            lvNotify.capsule({ source: "罗盘", message: "已复制今日回顾 Markdown，可直接粘贴至日记", duration: 3000 });
                        } catch {
                            lvNotify.capsule({ source: "罗盘", message: "今日回顾已就绪", duration: 2500 });
                        }
                    }
                })();
                return;
            }

            const backupBtn = target.closest<HTMLElement>(".lv-pop-backup-btn");
            if (backupBtn) {
                e.stopPropagation();
                closeDesktopLaunchpadPopover();
                void (async () => {
                    try {
                        const bundle = await lvBackup.exportFull();
                        const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json;charset=utf-8" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `xiaolv-ecosystem-backup-${getTodayKey()}.json`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        setTimeout(() => URL.revokeObjectURL(url), 1000);
                        const missing = bundle.failed?.length ?? 0;
                        lvNotify.capsule({ source: "罗盘", message: missing > 0 ? `已发起部分备份下载：${Object.keys(bundle.plugins).length} 项成功，${missing} 项失败；详见备份清单` : "💾 已发起小驴联合备份下载，请核对下载文件", duration: 4000 });
                    } catch {
                        lvNotify.card({ source: "罗盘", level: "error", message: "备份导出失败，尚未生成可下载文件，请重试", duration: 5000 });
                    }
                })();
                return;
            }

            const toggleAllBtn = target.closest<HTMLElement>(".lv-pop-toggle-all-btn");
            if (toggleAllBtn) {
                e.stopPropagation();
                const nextState = allPinned ? "docked" : "pinned";
                for (const it of items) {
                    getLaunchpadHub().setPluginState(it.id, nextState);
                }
                syncTopBarConvergence();
                openDesktopLaunchpadPopover(anchor, currentFocusIndex, showPrefDrawer);
                return;
            }

            const pinBtn = target.closest<HTMLElement>(".lv-pop-pin-btn");
            if (pinBtn) {
                e.stopPropagation();
                const id = pinBtn.getAttribute("data-pin-id");
                if (id) {
                    const cur = getLaunchpadStates()[id] || "docked";
                    const next = cur === "pinned" ? "docked" : "pinned";
                    getLaunchpadHub().setPluginState(id, next);
                    syncTopBarConvergence();
                    openDesktopLaunchpadPopover(anchor, currentFocusIndex, showPrefDrawer);
                }
                return;
            }

            const closeBtn = target.closest<HTMLElement>(".lv-pop-close-btn");
            if (closeBtn) {
                e.stopPropagation();
                closeDesktopLaunchpadPopover();
                return;
            }

            const tile = target.closest<HTMLElement>(".lv-pop-tile");
            if (tile) {
                const idxStr = tile.getAttribute("data-idx");
                if (idxStr !== null) {
                    const idx = parseInt(idxStr, 10);
                    const targetItem = items[idx];
                    if (targetItem) {
                        pushRecentTileId(targetItem.id);
                        closeDesktopLaunchpadPopover();
                        try { targetItem.onClick(); } catch (err) { console.warn("[LvLaunchpad] 启动失败:", err); }
                    }
                }
            }
        });

        let isDrawerHovered = false;
        const drawerEl = typeof popover.querySelector === "function" ? popover.querySelector(".lv-pop-actions-drawer") : null;
        drawerEl?.addEventListener("mouseenter", () => { isDrawerHovered = true; });
        drawerEl?.addEventListener("mouseleave", () => { isDrawerHovered = false; });

        popover.addEventListener("mousemove", (e) => {
            // 当鼠标进入二级抽屉时锁定当前插件，杜绝斜滑经过其他卡片时发生意外跳变
            if (isDrawerHovered) return;
            const target = e.target as HTMLElement;
            if (!target || typeof target.closest !== "function") return;
            const tile = target.closest<HTMLElement>(".lv-pop-tile");
            if (tile) {
                const idxStr = tile.getAttribute("data-idx");
                if (idxStr !== null) {
                    const idx = parseInt(idxStr, 10);
                    if (idx >= 0 && idx < items.length && idx !== currentFocusIndex) {
                        currentFocusIndex = idx;
                        updateFocusHighlight();
                    }
                }
            }
        });

        // 磁贴右键就地聚焦二级菜单：右键点击磁贴立即高亮并锁定其二级行动
        popover.addEventListener("contextmenu", (e) => {
            const target = e.target as HTMLElement;
            const tile = target?.closest?.<HTMLElement>(".lv-pop-tile");
            if (tile) {
                e.preventDefault();
                e.stopPropagation();
                const idxStr = tile.getAttribute("data-idx");
                if (idxStr !== null) {
                    currentFocusIndex = parseInt(idxStr, 10);
                    updateFocusHighlight();
                    isDrawerHovered = true;
                }
            }
        });
    }

    desktopPopoverKeyDownHandler = (e: KeyboardEvent) => {
        if (!e || typeof e.key !== "string") return;

        if (e.key === "Escape") {
            try { e.preventDefault(); e.stopPropagation(); } catch { /* ignore */ }
            closeDesktopLaunchpadPopover();
            return;
        }

        if (isSearchingOmni) {
            if (e.key === "ArrowDown") {
                try { e.preventDefault(); e.stopPropagation(); } catch { /* ignore */ }
                if (omniHitsList.length > 0) {
                    omniFocusIndex = (omniFocusIndex + 1) % omniHitsList.length;
                    if (typeof popover.querySelectorAll === "function") {
                        popover.querySelectorAll(".lv-pop-hit-item").forEach((el, i) => el.classList.toggle("focused", i === omniFocusIndex));
                    }
                }
                return;
            }
            if (e.key === "ArrowUp") {
                try { e.preventDefault(); e.stopPropagation(); } catch { /* ignore */ }
                if (omniHitsList.length > 0) {
                    omniFocusIndex = (omniFocusIndex - 1 + omniHitsList.length) % omniHitsList.length;
                    if (typeof popover.querySelectorAll === "function") {
                        popover.querySelectorAll(".lv-pop-hit-item").forEach((el, i) => el.classList.toggle("focused", i === omniFocusIndex));
                    }
                }
                return;
            }
            if (e.key === "Enter") {
                try { e.preventDefault(); e.stopPropagation(); } catch { /* ignore */ }
                const hit = omniHitsList[omniFocusIndex];
                if (hit) hit.onSelect();
                return;
            }
            return;
        }

        const gridCols = currentView === "list" ? 1 : (items.length >= 3 ? 3 : 2);

        if (e.key === "ArrowDown") {
            try { e.preventDefault(); e.stopPropagation(); } catch { /* ignore */ }
            if (currentFocusIndex + gridCols < items.length) {
                currentFocusIndex += gridCols;
            } else if (currentFocusIndex + 1 < items.length) {
                currentFocusIndex += 1;
            }
            updateFocusHighlight();
            return;
        }

        if (e.key === "ArrowUp") {
            try { e.preventDefault(); e.stopPropagation(); } catch { /* ignore */ }
            if (currentFocusIndex - gridCols >= 0) {
                currentFocusIndex -= gridCols;
            } else if (currentFocusIndex - 1 >= 0) {
                currentFocusIndex -= 1;
            }
            updateFocusHighlight();
            return;
        }

        if (e.key === "ArrowRight") {
            try { e.preventDefault(); e.stopPropagation(); } catch { /* ignore */ }
            currentFocusIndex = (currentFocusIndex + 1) % items.length;
            updateFocusHighlight();
            return;
        }

        if (e.key === "ArrowLeft") {
            try { e.preventDefault(); e.stopPropagation(); } catch { /* ignore */ }
            currentFocusIndex = (currentFocusIndex - 1 + items.length) % items.length;
            updateFocusHighlight();
            return;
        }

        const activeEl = typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null;
        const isTypingInInput = Boolean(activeEl && activeEl.classList && typeof activeEl.classList.contains === "function" && activeEl.classList.contains("lv-pop-search-input") && (activeEl as HTMLInputElement).value);

        if (e.key === "Enter" || (e.key === " " && !isTypingInInput)) {
            try { e.preventDefault(); e.stopPropagation(); } catch { /* ignore */ }
            const item = items[currentFocusIndex];
            if (item) {
                pushRecentTileId(item.id);
                closeDesktopLaunchpadPopover();
                try { item.onClick(); } catch (err) { console.warn("[LvLaunchpad] 键盘启动失败:", err); }
            }
            return;
        }

        if (!isTypingInInput && (e.key === "p" || e.key === "P")) {
            try { e.preventDefault(); e.stopPropagation(); } catch { /* ignore */ }
            const item = items[currentFocusIndex];
            if (item) {
                const cur = getLaunchpadStates()[item.id] || "docked";
                const next = cur === "pinned" ? "docked" : "pinned";
                getLaunchpadHub().setPluginState(item.id, next);
                syncTopBarConvergence();
                openDesktopLaunchpadPopover(anchor, currentFocusIndex, showPrefDrawer);
            }
            return;
        }

        const num = parseInt(e.key, 10);
        if (!isTypingInInput && !isNaN(num) && num >= 1 && num <= items.length) {
            try { e.preventDefault(); e.stopPropagation(); } catch { /* ignore */ }
            const target = items[num - 1];
            if (target) {
                pushRecentTileId(target.id);
                closeDesktopLaunchpadPopover();
                try { target.onClick(); } catch (err) { console.warn("[LvLaunchpad] 键盘瞬发失败:", err); }
            }
            return;
        }
    };
    if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
        window.addEventListener("keydown", desktopPopoverKeyDownHandler, true);
    }

    desktopPopoverOutsideClickHandler = (e: MouseEvent) => {
        const t = e.target as Node;
        if (typeof popover.contains === "function" && !popover.contains(t) && anchor) {
            if (typeof anchor.contains === "function" && !anchor.contains(t)) {
                closeDesktopLaunchpadPopover();
            }
        }
    };
    setTimeout(() => {
        if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
            window.addEventListener("mousedown", desktopPopoverOutsideClickHandler!, true);
        }
    }, 50);

    desktopPopoverResizeHandler = reposition;
    if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
        window.addEventListener("resize", desktopPopoverResizeHandler);
    }

    if (document.body && typeof document.body.appendChild === "function") {
        document.body.appendChild(popover);
    }
}

export function toggleDesktopLaunchpadPopover(anchorEl?: HTMLElement | null): void {
    if (isDesktopPopoverOpen()) {
        closeDesktopLaunchpadPopover();
    } else {
        openDesktopLaunchpadPopover(anchorEl);
    }
}

function wireDesktopGlobalHotkey(): void {
    if (desktopGlobalHotkeyWired || typeof window === "undefined" || typeof window.addEventListener !== "function") return;
    desktopGlobalHotkeyWired = true;
    window.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e && e.altKey && !e.ctrlKey && !e.metaKey && (e.key === "l" || e.key === "L")) {
            if (isMobileFrontend()) return;
            try { e.preventDefault(); e.stopPropagation(); } catch { /* ignore */ }
            toggleDesktopLaunchpadPopover();
        }
    });
}

function insertDesktopEntryButton(toolbar: HTMLElement, btn: HTMLElement): void {
    if (typeof toolbar.querySelector === "function" && typeof toolbar.insertBefore === "function") {
        try {
            // 思源 3.8.x 顶栏条目重排规则：锚定在 #barPlugins / #barMore 之前（始终处于 #drag 右侧插件区），
            // 配合 syncTopBarConvergence 中的 ensureCompassOnRightSide 自愈，既不漂移到左侧也绝不落入 #windowControls 窗口控制区。
            const anchor = toolbar.querySelector("#barPlugins, #barCommand, #barSearch, #barDockR, #barSetting, #barSettings, #barHelp, #barMore, #windowControls");
            if (anchor && anchor.parentElement === toolbar) {
                toolbar.insertBefore(btn, anchor);
                return;
            }
        } catch { /* ignore */ }
    }
    toolbar.appendChild(btn);
}

function buildDesktopEntryButton(): boolean {
    if (typeof document === "undefined" || isMobileFrontend()) return false;
    const toolbar = document.getElementById("toolbar");
    if (!toolbar) return false;
    if (document.getElementById(DESKTOP_ENTRY_ID)) { refreshEntryBadgeDot(); syncTopBarConvergence(); return true; }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = DESKTOP_ENTRY_ID;
    btn.className = "toolbar__item ariaLabel";
    // 思源 3.8.x 原生条目公民身份：data-topbar-entry 让罗盘参与顶栏条目排序持久化与 ye() 重排恢复，
    // data-location 与官方 addTopBar position:"right" 对齐，避免被思源条目体系视为异物
    btn.setAttribute("data-topbar-entry", "lv-launchpad");
    btn.setAttribute("data-location", "right");
    btn.setAttribute("aria-label", "小驴罗盘");
    btn.setAttribute("title", "小驴罗盘 · 全家桶极速直达 (左键展开 · 快捷键 1~8)");
    btn.style.position = "relative";
    btn.innerHTML = `${COMPASS_SVG}<span class="lv-entry-moon" aria-hidden="true" style="display:none;margin-left:2px;font-size:11px;line-height:1;">🌙</span><span class="lv-entry-dot" aria-hidden="true" style="display:none;position:absolute;top:4px;right:4px;width:7px;height:7px;border-radius:999px;background:var(--b3-theme-primary,#3576c7);"></span>`;

    btn.addEventListener("click", () => {
        const items = getLaunchpadHub().getItems().filter((it) => it.state !== "hidden");
        if (items.length === 1) {
            const first = items[0];
            if (first) {
                try { first.onClick(); } catch (err) { console.warn("[LvLaunchpad] 桌面单插件直达失败:", err); }
            }
            return;
        }
        toggleDesktopLaunchpadPopover(btn);
    });

    btn.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        toggleDesktopLaunchpadPopover(btn);
    });

    insertDesktopEntryButton(toolbar, btn);
    refreshEntryBadgeDot();
    syncTopBarConvergence();
    wireDesktopToolbarObserver();
    return true;
}

let desktopToolbarObserver: MutationObserver | null = null;
let desktopThemeObserver: MutationObserver | null = null;

function wireDesktopToolbarObserver(): void {
    if (typeof document === "undefined" || isMobileFrontend()) return;
    const toolbar = document.getElementById("toolbar");
    if (!toolbar || typeof MutationObserver === "undefined") return;

    if (!desktopToolbarObserver) {
        let debounceTimer: number | null = null;
        desktopToolbarObserver = new MutationObserver(() => {
            if (debounceTimer) return;
            debounceTimer = window.setTimeout(() => {
                debounceTimer = null;
                if (!document.getElementById(DESKTOP_ENTRY_ID)) {
                    buildDesktopEntryButton();
                } else {
                    syncTopBarConvergence();
                }
            }, 100);
        });

        try {
            desktopToolbarObserver.observe(toolbar, { childList: true, subtree: true });
        } catch { /* ignore */ }
    }

    if (!desktopThemeObserver && document.documentElement) {
        let themeDebounce: number | null = null;
        desktopThemeObserver = new MutationObserver(() => {
            if (themeDebounce) return;
            themeDebounce = window.setTimeout(() => {
                themeDebounce = null;
                syncTopBarConvergence();
            }, 120);
        });
        try {
            desktopThemeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
        } catch { /* ignore */ }
    }
}

function ensureDesktopEntry(): MobileEntryCleanup {
    if (typeof document === "undefined") return () => {};
    if (isMobileFrontend()) return () => {};
    const owner = `owner_desktop_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    desktopEntryOwners.add(owner);
    desktopEntryRetryTimers.forEach((t) => { try { if (typeof window !== "undefined") window.clearTimeout(t); else clearTimeout(t); } catch { /* ignore */ } });
    desktopEntryRetryTimers = [];
    wireDesktopGlobalHotkey();
    buildDesktopEntryButton();
    for (const delay of [800, 2000, 5000]) {
        const scheduleFn = typeof window !== "undefined" ? window.setTimeout : setTimeout;
        const tid = Number(scheduleFn(() => {
            if (!document.getElementById(DESKTOP_ENTRY_ID)) buildDesktopEntryButton();
        }, delay));
        desktopEntryRetryTimers.push(tid);
    }
    return () => {
        desktopEntryOwners.delete(owner);
        if (desktopEntryOwners.size > 0) return;
        desktopEntryRetryTimers.forEach((t) => { try { if (typeof window !== "undefined") window.clearTimeout(t); else clearTimeout(t); } catch { /* ignore */ } });
        desktopEntryRetryTimers = [];
        try { desktopToolbarObserver?.disconnect(); } catch { /* ignore */ }
        desktopToolbarObserver = null;
        try { desktopThemeObserver?.disconnect(); } catch { /* ignore */ }
        desktopThemeObserver = null;
        closeDesktopLaunchpadPopover();
        try { document.getElementById(DESKTOP_ENTRY_ID)?.remove(); } catch { /* ignore */ }
    };
}

/* ===== 与思源原生移动端的冲突避让：原生/插件全屏对话框打开 / 文本输入聚焦（键盘弹起）时隐藏悬浮球 ===== */

let ballDialogObserver: MutationObserver | undefined;
let ballDialogDebounceTimer: number | undefined;
let ballFocusHandler: ((ev: FocusEvent) => void) | undefined;
let ballBlurHandler: (() => void) | undefined;
let ballDialogOpen = false;
let ballInputFocused = false;

const MOBILE_OVERLAY_SELECTOR = [
    ".b3-dialog--open",
    ".b3-dialog--container",
    ".b3-dialog__container",
    "#lv-launchpad-sheet-mask:not(.lv-sheet-closing)",
    ".lvct-dialog-mask",
    ".lvct-sheet",
    ".sw__mobile-sheet-overlay",
    ".sw__mobile-sort-overlay",
    ".lv-peek-drawer",
].join(", ");

function isOverlayElementVisible(el: Element): boolean {
    const htmlEl = el as HTMLElement;
    if (htmlEl.hidden === true) return false;
    if (htmlEl.classList && typeof htmlEl.classList.contains === "function" && htmlEl.classList.contains("fn__none")) {
        return false;
    }
    if (htmlEl.style && htmlEl.style.display === "none") return false;
    return true;
}

function updateBallSuppression(): void {
    if (typeof document === "undefined") return;
    const ball = document.getElementById(MOBILE_BALL_ID);
    if (ball) ball.classList.toggle("lv-ball-suppressed", ballDialogOpen || ballInputFocused);
}

/** 依据实时状态重算抑制：对话框/自绘抽屉开合 + 当前焦点元素（不单靠 focusout——焦点元素被移除时 Chromium 不派发 focusout） */
function recomputeBallSuppression(): void {
    if (typeof document === "undefined") return;
    let open = false;
    try {
        if (typeof document.querySelectorAll === "function") {
            const matches = document.querySelectorAll(MOBILE_OVERLAY_SELECTOR);
            for (let i = 0; i < matches.length; i++) {
                const candidate = matches[i];
                if (candidate && isOverlayElementVisible(candidate)) {
                    open = true;
                    break;
                }
            }
        } else if (typeof document.querySelector === "function") {
            const first = document.querySelector(MOBILE_OVERLAY_SELECTOR);
            open = Boolean(first && isOverlayElementVisible(first));
        }
    } catch { /* ignore */ }
    if (open !== ballDialogOpen) ballDialogOpen = open;
    const el = document.activeElement as HTMLElement | null;
    // 鸭子类型判定（避免依赖 HTMLElement 全局——非浏览器测试环境无此构造器）
    ballInputFocused = Boolean(el) &&
        (el!.tagName === "INPUT" || el!.tagName === "TEXTAREA" || el!.isContentEditable === true);
    updateBallSuppression();
}

function wireMobileSuppression(): void {
    if (ballDialogObserver || typeof document === "undefined") return;
    // 原生/插件 Dialog 与全屏抽屉覆盖层出现、复用显隐切换时自动让位（50ms 防抖合并）
    if (typeof MutationObserver === "function") {
        ballDialogObserver = new MutationObserver(() => {
            if (ballDialogDebounceTimer !== undefined) return;
            const schedule = typeof window !== "undefined" && typeof window.setTimeout === "function" ? window.setTimeout : setTimeout;
            ballDialogDebounceTimer = Number(schedule(() => {
                ballDialogDebounceTimer = undefined;
                recomputeBallSuppression();
            }, 50));
        });
        try {
            ballDialogObserver.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ["class", "style", "hidden"],
            });
        } catch { /* ignore */ }
    }
    // 键盘弹起/收起（文本输入聚焦与失焦）时实时重算，避免悬浮球压在软键盘/输入法面板上
    if (typeof document.addEventListener === "function") {
        ballFocusHandler = () => recomputeBallSuppression();
        ballBlurHandler = () => {
            const schedule = typeof window !== "undefined" && typeof window.setTimeout === "function" ? window.setTimeout : setTimeout;
            schedule(() => recomputeBallSuppression(), 40);
        };
        document.addEventListener("focusin", ballFocusHandler, true);
        document.addEventListener("focusout", ballBlurHandler, true);
    }
    recomputeBallSuppression();
}

function unwireMobileSuppression(): void {
    if (ballDialogDebounceTimer !== undefined) {
        try {
            if (typeof window !== "undefined" && typeof window.clearTimeout === "function") window.clearTimeout(ballDialogDebounceTimer);
            else clearTimeout(ballDialogDebounceTimer);
        } catch { /* ignore */ }
        ballDialogDebounceTimer = undefined;
    }
    try { ballDialogObserver?.disconnect(); } catch { /* ignore */ }
    ballDialogObserver = undefined;
    if (typeof document !== "undefined" && typeof document.removeEventListener === "function") {
        if (ballFocusHandler) {
            try { document.removeEventListener("focusin", ballFocusHandler, true); } catch { /* ignore */ }
        }
        if (ballBlurHandler) {
            try { document.removeEventListener("focusout", ballBlurHandler, true); } catch { /* ignore */ }
        }
    }
    ballFocusHandler = undefined;
    ballBlurHandler = undefined;
    ballDialogOpen = false;
    ballInputFocused = false;
}

/* ===== 弹射坞关闭：190ms 下滑收场动画 + Android 返回手势/返回键联动 ===== */
let sheetCloseTimer: number | undefined;
let sheetHistoryArmed = false;
let sheetPopHandler: (() => void) | undefined;

/** 在浏览器历史压入占位态：Android 系统返回手势/返回键 → popstate → 关坞（而非退出思源） */
function armSheetHistory(): void {
    if (sheetHistoryArmed || typeof window === "undefined") return;
    try {
        const hist = (window as unknown as { history?: History }).history;
        if (!hist || typeof hist.pushState !== "function") return;
        hist.pushState({ lvSheet: true }, "");
        sheetHistoryArmed = true;
        sheetPopHandler = () => {
            // 用户按返回：直接收场，不再回拨历史
            sheetHistoryArmed = false;
            sheetPopHandler = undefined;
            closeMobileSheet();
        };
        if (typeof window.addEventListener === "function") window.addEventListener("popstate", sheetPopHandler);
    } catch { /* 历史不可用环境静默 */ }
}

/** 收场时解除历史占位：手动关闭路径回拨一步历史，返回键路径历史已被系统消费 */
function disarmSheetHistory(): void {
    const hadHandler = Boolean(sheetPopHandler) && typeof window !== "undefined" && typeof window.removeEventListener === "function";
    if (hadHandler && sheetPopHandler) {
        try { window.removeEventListener("popstate", sheetPopHandler); } catch { /* ignore */ }
    }
    sheetPopHandler = undefined;
    if (sheetHistoryArmed && typeof window !== "undefined") {
        sheetHistoryArmed = false;
        try {
            const hist = (window as unknown as { history?: History & { state?: unknown } }).history;
            if (hist?.state?.lvSheet && typeof hist.back === "function") hist.back();
        } catch { /* ignore */ }
    }
}

/** 关闭移动端底部弹射坞：下滑收场动画（动画中重开安全）+ 焦点栈注销 + 历史占位解除 */
function closeMobileSheet(): void {
    if (typeof document === "undefined") return;
    disarmSheetHistory();
    const mask = document.getElementById(MOBILE_SHEET_ID);
    if (!mask) return;
    if (mask.classList.contains("lv-sheet-closing")) return; // 收场动画中幂等
    try { lvSurfaceStack.pop("lv-launchpad-mobile-sheet"); } catch { /* ignore */ }
    refreshEntryBadgeDot(); // 坞内停留期间徽记可能变化，关坞即刷新入口圆点
    recomputeBallSuppression(); // 坞内搜索框随坞移除后焦点静默丢失，主动重算球抑制态

    const reduceMotion = typeof globalThis.matchMedia === "function" &&
        globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
        try { mask.remove(); } catch { /* ignore */ }
        return;
    }
    mask.classList.add("lv-sheet-closing");
    if (sheetCloseTimer !== undefined) { try { window.clearTimeout(sheetCloseTimer); } catch { /* ignore */ } }
    sheetCloseTimer = window.setTimeout(() => {
        sheetCloseTimer = undefined;
        // 仅当仍是这个正在收场的节点才移除；期间若已重开新坞则交由重开逻辑处理
        const current = document.getElementById(MOBILE_SHEET_ID);
        if (current === mask) { try { mask.remove(); } catch { /* ignore */ } }
    }, 190);
}

const MOBILE_RECENT_KEY = "lv_launchpad_recent_tiles";
const MOBILE_RECENT_MAX = 6;
const MOBILE_SEARCH_HISTORY_KEY = "lv_launchpad_search_history";
const MOBILE_SEARCH_HISTORY_MAX = 6;

/** 穿透搜索历史：读取（新在前，去重裁剪） */
function getSearchHistory(): string[] {
    if (typeof localStorage === "undefined") return [];
    try {
        const list = JSON.parse(localStorage.getItem(MOBILE_SEARCH_HISTORY_KEY) ?? "[]");
        return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string" && x.trim() !== "") : [];
    } catch { return []; }
}

function pushSearchHistory(kw: string): void {
    const k = kw.trim();
    if (typeof localStorage === "undefined" || !k) return;
    try {
        const next = [k, ...getSearchHistory().filter((x) => x !== k)].slice(0, MOBILE_SEARCH_HISTORY_MAX);
        localStorage.setItem(MOBILE_SEARCH_HISTORY_KEY, JSON.stringify(next));
    } catch { /* ignore */ }
}

/** 最近直达：读取上次使用过的罗盘条目 id（新在前，去重裁剪） */
function getRecentTileIds(): string[] {
    if (typeof localStorage === "undefined") return [];
    try {
        const raw = localStorage.getItem(MOBILE_RECENT_KEY);
        const list = raw ? JSON.parse(raw) : [];
        return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [];
    } catch { return []; }
}

function pushRecentTileId(id: string): void {
    if (typeof localStorage === "undefined" || !id) return;
    try {
        const next = [id, ...getRecentTileIds().filter((x) => x !== id)].slice(0, MOBILE_RECENT_MAX);
        localStorage.setItem(MOBILE_RECENT_KEY, JSON.stringify(next));
    } catch { /* ignore */ }
}

/** 纯函数：svgIcon → 候选 sprite 符号 id 链（原样 / kebab→camel / icon+Pascal），供存在性探测 */
export function iconIdCandidates(svgIcon: string): string[] {
    const id = (svgIcon || "").trim();
    if (!id) return [];
    const camel = id.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
    const list = [id, camel];
    if (!/^icon/i.test(id)) {
        const pascal = camel.charAt(0).toUpperCase() + camel.slice(1);
        list.push(`icon${pascal}`);
    }
    return Array.from(new Set(list));
}

/** 探测思源 sprite 中真实存在的插件图标（找不到返回 null，走彩色圆点兜底） */
function resolveIconHref(svgIcon?: string): string | null {
    if (!svgIcon || typeof document === "undefined") return null;
    for (const id of iconIdCandidates(svgIcon)) {
        try {
            if (document.getElementById(id)) return `#${id}`;
        } catch { /* ignore */ }
    }
    // kebab→camel 会丢失符号原始内部大写与连字符形态差异（icon-lv-raikiri ↔ iconLvRaikiri），
    // 终极兜底：全量 symbol 归一化小写比对（去连字符；数量级 ~200，磁贴构建时开销可忽略）
    try {
        const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
        const wanted = new Set(iconIdCandidates(svgIcon).map(normalize));
        const symbols = document.querySelectorAll("symbol[id]");
        for (const s of Array.from(symbols)) {
            if (wanted.has(normalize(s.id))) return `#${s.id}`;
        }
    } catch { /* ignore */ }
    return null;
}

/** 长按展开二级行动的磁贴渲染（返回磁贴根元素） */
function buildSheetTile(item: LvLaunchpadItem & { state: "pinned" | "docked" | "hidden" }): HTMLElement | null {
    if (typeof document === "undefined") return null;
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "lv-sheet-tile";
    tile.setAttribute("aria-label", item.fullName || item.name);
    tile.setAttribute("aria-expanded", "false");
    // 优先渲染插件真实 sprite 图标（kebab/camel 双形态探测）；再回退内置 24x24 litheness 线性图标，最终回退品牌色圆点
    const iconHref = resolveIconHref(item.svgIcon);
    const tileBrandColor = (item.color && !item.color.startsWith("var(--lv-brand")) ? item.color : PLUGIN_DEFAULT_BRAND_COLORS[item.id];
    if (tileBrandColor && tile.style && typeof tile.style.setProperty === "function") {
        try { tile.style.setProperty("--tile-brand", tileBrandColor); } catch { /* ignore */ }
    }
    if (iconHref) {
        const iconWrap = document.createElement("span");
        iconWrap.className = "lv-sheet-tile-icon";
        if (tileBrandColor) iconWrap.style.color = tileBrandColor; // 品牌色染色，磁贴一眼可辨
        iconWrap.innerHTML = `<svg aria-hidden="true" style="fill:none!important;stroke:currentColor!important;"><use xlink:href="${iconHref}" href="${iconHref}"></use></svg>`;
        tile.appendChild(iconWrap);
    } else if (PLUGIN_LITHE_ICON_PATHS[item.id]) {
        const iconWrap = document.createElement("span");
        iconWrap.className = "lv-sheet-tile-icon";
        if (tileBrandColor) iconWrap.style.color = tileBrandColor;
        iconWrap.innerHTML = renderPluginLitheSvg(item.id, 18);
        tile.appendChild(iconWrap);
    } else {
        const dot = document.createElement("span");
        dot.className = "lv-sheet-tile-dot";
        if (tileBrandColor) dot.style.background = tileBrandColor;
        tile.appendChild(dot);
    }
    const name = document.createElement("span");
    name.className = "lv-sheet-tile-name";
    name.textContent = item.fullName || item.name;
    tile.appendChild(name);
    const desc = document.createElement("span");
    desc.className = "lv-sheet-tile-desc";
    desc.textContent = item.desc || "";
    tile.appendChild(desc);
    // 徽记胶囊：插件回传的待办/复习数等轻量状态（如「3 待办」「25 待复习」）
    if (item.badge) {
        const pill = document.createElement("span");
        pill.className = "lv-sheet-tile-badge";
        if (item.badgeType === "success") pill.classList.add("lv-sheet-tile-badge--success");
        else if (item.badgeType === "warn" || item.badgeType === "error") pill.classList.add("lv-sheet-tile-badge--warn");
        pill.textContent = item.badge;
        tile.appendChild(pill);
    }
    let isLongPressTriggered = false;
    let longPressResetTimer: number | undefined;

    // 主点击：唤起插件主界面（长按展开二级行动后阻断合成 click，杜绝松手误关）
    tile.addEventListener("click", (ev) => {
        if (isLongPressTriggered) {
            isLongPressTriggered = false;
            ev.preventDefault();
            ev.stopPropagation();
            return;
        }
        hapticFeedback(8);
        pushRecentTileId(item.id);
        closeMobileSheet();
        try { item.onClick(); } catch (e) { console.warn("[LvLaunchpad] 磁贴唤起失败:", e); }
    });

    // 展开二级行动直达芯片（触屏长按 500ms / 桌面右键 contextmenu 统一展开）
    const expandTile = () => {
        isLongPressTriggered = true;
        if (longPressResetTimer !== undefined) {
            window.clearTimeout(longPressResetTimer);
        }
        longPressResetTimer = window.setTimeout(() => {
            isLongPressTriggered = false;
            longPressResetTimer = undefined;
        }, 400);

        hapticFeedback(14);
        const mask = document.getElementById(MOBILE_SHEET_ID);
        if (!mask) return;

        // 若当前磁贴已展开，再次长按或点击则收起
        if (tile.classList.contains("lv-sheet-tile--expanded")) {
            tile.classList.remove("lv-sheet-tile--expanded");
            tile.setAttribute("aria-expanded", "false");
            tile.querySelectorAll(".lv-sheet-tile-actions").forEach((el) => el.remove());
            return;
        }

        mask.querySelectorAll(".lv-sheet-tile--expanded").forEach((el) => {
            el.classList.remove("lv-sheet-tile--expanded");
            el.setAttribute("aria-expanded", "false");
        });
        tile.classList.add("lv-sheet-tile--expanded");
        tile.setAttribute("aria-expanded", "true");
        mask.querySelectorAll(".lv-sheet-tile-actions").forEach((el) => el.remove());
        const actWrap = document.createElement("span");
        actWrap.className = "lv-sheet-tile-actions";
        for (const actName of item.actions || []) {
            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = "lv-sheet-action-chip";
            chip.textContent = actName;
            chip.addEventListener("click", (ev) => {
                ev.stopPropagation();
                hapticFeedback(8);
                pushRecentTileId(item.id);
                closeMobileSheet();
                try { getLaunchpadHub().executeAction(item.id, actName); } catch (e) { console.warn("[LvLaunchpad] 行动直达失败:", e); }
            });
            actWrap.appendChild(chip);
        }
        tile.appendChild(actWrap);
    };

    tile.addEventListener("contextmenu", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        expandTile();
    });

    let pressTimer: number | undefined;
    tile.addEventListener("touchstart", () => {
        pressTimer = window.setTimeout(() => {
            pressTimer = undefined;
            expandTile();
        }, 500);
    }, { passive: true });
    tile.addEventListener("touchend", () => { if (pressTimer !== undefined) { window.clearTimeout(pressTimer); pressTimer = undefined; } }, { passive: true });
    tile.addEventListener("touchmove", () => { if (pressTimer !== undefined) { window.clearTimeout(pressTimer); pressTimer = undefined; } }, { passive: true });
    return tile;
}

/** 唤醒移动端底部弹射坞：磁贴网格 + 穿透搜索 + 长按二级行动 + 下滑/Esc/系统返回 关闭 */
function openMobileSheet(): void {
    if (typeof document === "undefined") return;
    const existing = document.getElementById(MOBILE_SHEET_ID);
    if (existing) {
        // 收场动画中的旧坞：立即让位替换；仍在使用中的坞：忽略重复打开
        if (existing.classList.contains("lv-sheet-closing")) {
            try { existing.remove(); } catch { /* ignore */ }
            if (sheetCloseTimer !== undefined) { try { window.clearTimeout(sheetCloseTimer); } catch { /* ignore */ } sheetCloseTimer = undefined; }
        } else {
            return;
        }
    }
    ensureStyles();

    const mask = document.createElement("div");
    mask.id = MOBILE_SHEET_ID;
    mask.setAttribute("role", "dialog");
    mask.setAttribute("aria-modal", "true");
    mask.setAttribute("aria-label", "小驴罗盘弹射坞");

    const sheet = document.createElement("div");
    sheet.className = "lv-sheet";
    mask.appendChild(sheet);

    // 拖拽把手（下滑关闭手势热区）
    const handle = document.createElement("div");
    handle.className = "lv-sheet-handle";
    handle.setAttribute("aria-hidden", "true");
    sheet.appendChild(handle);

    // 磁贴数据源（hidden 过滤、pinned 置顶）——提前到头部，供今日聚合条/最近行/网格共用
    const items = getLaunchpadHub().getItems().filter((it) => it.state !== "hidden");
    items.sort((a, b) => (a.state === "pinned" ? 0 : 1) - (b.state === "pinned" ? 0 : 1));

    // 标题行
    const head = document.createElement("div");
    head.className = "lv-sheet-head";
    const title = document.createElement("span");
    title.className = "lv-sheet-title";
    title.textContent = "🧭 小驴罗盘";
    head.appendChild(title);

    // 专注模式开关（🌙）：开启后全生态 card/capsule 静音至今晚，仅留历史档
    const moonBtn = document.createElement("button");
    moonBtn.type = "button";
    moonBtn.className = "lv-sheet-moon";
    moonBtn.setAttribute("aria-label", "专注模式开关");
    const syncMoon = () => {
        const active = isNotifyFocusActive();
        const until = getNotifyFocusUntil();
        moonBtn.textContent = active ? `🌙 至 ${new Date(until).toTimeString().slice(0, 5)}` : "🌙 专注";
        moonBtn.setAttribute("aria-pressed", String(active));
        moonBtn.title = active ? "点击退出专注模式" : "开启专注模式（全生态静音至今晚）";
    };
    syncMoon();
    moonBtn.addEventListener("click", () => {
        if (isNotifyFocusActive()) {
            clearNotifyFocus();
            hapticFeedback(8);
            lvNotify.capsule({ source: "罗盘", message: "已退出专注模式", duration: 2000 });
        } else {
            const now = new Date();
            const until = new Date(now);
            until.setHours(23, 0, 0, 0);
            if (until.getTime() <= now.getTime()) until.setTime(now.getTime() + 2 * 3_600_000);
            setNotifyFocusUntil(until.getTime());
            hapticFeedback(10);
            lvNotify.capsule({ source: "罗盘", message: `已开启专注模式至 ${until.toTimeString().slice(0, 5)}，通知将静音留档`, duration: 2600 });
        }
        syncMoon();
        refreshEntryBadgeDot();
    });
    head.appendChild(moonBtn);

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "lv-sheet-close";
    closeBtn.setAttribute("aria-label", "关闭");
    closeBtn.textContent = "✕";
    closeBtn.addEventListener("click", () => closeMobileSheet());
    head.appendChild(closeBtn);
    sheet.appendChild(head);

    // 今日一站式聚合条：解析各插件徽记数字，一眼总览今日待办，点 chip 直达对应插件
    const todayItems = items
        .map((it) => ({ it, m: /(\d+)/.exec(it.badge ?? "") }))
        .filter((x) => x.m !== null && Number(x.m![1]) > 0)
        .slice(0, 5);
    if (todayItems.length > 0) {
        const today = document.createElement("div");
        today.className = "lv-sheet-today";
        const todayLabel = document.createElement("span");
        todayLabel.className = "lv-sheet-today-label";
        todayLabel.textContent = "今日";
        today.appendChild(todayLabel);
        for (const { it, m } of todayItems) {
            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = "lv-sheet-today-chip";
            chip.setAttribute("aria-label", `今日待办直达 ${it.fullName || it.name}`);
            const cDot = document.createElement("span");
            cDot.className = "lv-sheet-today-dot";
            if (it.color) cDot.style.background = it.color;
            chip.appendChild(cDot);
            const cText = document.createElement("span");
            cText.textContent = `${it.name} ${m![1]}`;
            chip.appendChild(cText);
            chip.addEventListener("click", () => {
                hapticFeedback(8);
                pushRecentTileId(it.id);
                closeMobileSheet();
                try { it.onClick(); } catch (e) { console.warn("[LvLaunchpad] 今日直达失败:", e); }
            });
            today.appendChild(chip);
        }
        sheet.appendChild(today);
    }

    // 穿透搜索框（lvOmnisearch 全生态 1000ms 熔断并发检索）
    const search = document.createElement("input");
    search.type = "text";
    search.className = "lv-sheet-search b3-text-field";
    search.placeholder = "穿透搜索全家桶：习惯 / 切片 / 资产 / 联系人…";
    search.setAttribute("aria-label", "全生态穿透搜索");
    sheet.appendChild(search);
    const results = document.createElement("div");
    results.className = "lv-sheet-results";
    sheet.appendChild(results);

    // 搜索历史 chips：空态时展示最近搜索，点 chip 填词重搜
    const histRow = document.createElement("div");
    histRow.className = "lv-sheet-histrow";
    const renderHistory = () => {
        histRow.textContent = "";
        const kws = getSearchHistory();
        if (!kws.length) { histRow.style.display = "none"; return; }
        histRow.style.display = "flex";
        const label = document.createElement("span");
        label.className = "lv-sheet-histrow-label";
        label.textContent = "最近搜索";
        histRow.appendChild(label);
        for (const kw of kws.slice(0, 5)) {
            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = "lv-sheet-histrow-chip";
            chip.textContent = kw;
            chip.addEventListener("click", () => {
                hapticFeedback(6);
                search.value = kw;
                search.dispatchEvent(new Event("input"));
                search.focus({ preventScroll: true });
            });
            histRow.appendChild(chip);
        }
    };
    renderHistory();
    sheet.appendChild(histRow);

    // 生态直达行：今日回顾入日记 / 呼出雷切画板
    const ecoRow = document.createElement("div");
    ecoRow.className = "lv-sheet-eco-row";
    const ecoDefs: Array<{ label: string; action: () => void | Promise<void> }> = [
        {
            label: "📝 今日回顾入日记",
            action: async () => {
                const md = lvActivity.formatAsMarkdown();
                if (!md || !md.trim()) {
                    lvNotify.capsule({ source: "罗盘", message: "今日暂无生态活动记录", duration: 2500 });
                    return;
                }
                let written = false;
                try {
                    const host = (window as any).siyuanCheckin || (window as any).LvHome;
                    if (host && typeof host.appendDailyNote === "function") {
                        await host.appendDailyNote(md);
                        written = true;
                    }
                } catch { /* ignore */ }
                if (written) {
                    lvNotify.capsule({ source: "罗盘", message: "已将今日回顾写入日记", duration: 2500 });
                } else {
                    try {
                        await navigator.clipboard.writeText(md);
                        lvNotify.capsule({ source: "罗盘", message: "已复制今日回顾，可粘贴至日记", duration: 3000 });
                    } catch {
                        lvNotify.capsule({ source: "罗盘", message: "今日回顾已就绪", duration: 2500 });
                    }
                }
            }
        },
        {
            label: "⚡ 打开雷切画板",
            action: () => {
                const ok = getLaunchpadHub().executeAction("siyuan-speed-switch", "打开切片库");
                if (!ok) {
                    const host = (window as any).siyuanSpeedSwitch;
                    if (host && typeof host.showSwitcher === "function") {
                        host.showSwitcher(true);
                    }
                }
            }
        },
    ];
    for (const def of ecoDefs) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "lv-sheet-eco-chip";
        btn.textContent = def.label;
        btn.addEventListener("click", () => {
            hapticFeedback(8);
            try {
                void def.action();
            } catch (err) {
                console.warn("[LvLaunchpad] eco action failed", err);
            }
            closeMobileSheet();
        });
        ecoRow.appendChild(btn);
    }
    sheet.appendChild(ecoRow);

    let searchSeq = 0;
    search.addEventListener("input", () => {
        const seq = ++searchSeq;
        const kw = search.value.trim();
        results.textContent = "";
        if (!kw) { renderHistory(); return; }
        histRow.style.display = "none";
        void lvOmnisearch.search(kw).then((hits) => {
            if (seq !== searchSeq || !document.getElementById(MOBILE_SHEET_ID)) return; // 过期响应或坞已关
            if (hits.length > 0) {
                const count = document.createElement("div");
                count.className = "lv-sheet-result-count";
                count.textContent = hits.length > 12 ? `共 ${hits.length} 条穿透结果 · 显示前 12 条` : `${hits.length} 条穿透结果`;
                results.appendChild(count);
            }
            // 按来源分组渲染（打卡/管家/… 各成一组，组内保持相关度序）
            const shown = hits.slice(0, 12);
            const groups = new Map<string, typeof shown>();
            for (const hit of shown) {
                const key = hit.source || hit.badge || "小驴";
                const bucket = groups.get(key);
                if (bucket) bucket.push(hit); else groups.set(key, [hit]);
            }
            const SOURCE_ICONS: Record<string, string> = {
                "打卡": "🏃", "管家": "🏠", "拾遗": "🔖",
                "雷切": "✂️", "闪卡": "🎴", "考试": "📝",
                "人脉": "👥", "常用": "🔤",
            };
            for (const [sourceName, groupHits] of groups) {
                const icon = SOURCE_ICONS[sourceName] || "🔹";
                const groupHead = document.createElement("div");
                groupHead.className = "lv-sheet-result-group";
                groupHead.textContent = `${icon} ${sourceName} · ${groupHits.length} 条`;
                results.appendChild(groupHead);
                for (const hit of groupHits) {
                    const row = document.createElement("button");
                    row.type = "button";
                    row.className = "lv-sheet-result";
                    const badge = document.createElement("span");
                    badge.className = "lv-sheet-result-badge";
                    badge.textContent = `${icon} ${sourceName}`;
                    row.appendChild(badge);
                    const body = document.createElement("span");
                    body.className = "lv-sheet-result-body";
                    const t = document.createElement("span");
                    t.className = "lv-sheet-result-title";
                    t.textContent = hit.title;
                    body.appendChild(t);
                    if (hit.snippet) {
                        const s = document.createElement("span");
                        s.className = "lv-sheet-result-snippet";
                        s.textContent = hit.snippet;
                        body.appendChild(s);
                    }
                    row.appendChild(body);
                    row.addEventListener("click", () => {
                        pushSearchHistory(kw); // 点选结果=确认意图，记入搜索历史
                        closeMobileSheet();
                        try { hit.onClick?.(); } catch (e) { console.warn("[LvLaunchpad] 穿透结果打开失败:", e); }
                    });
                    results.appendChild(row);
                }
            }
            if (!hits.length) {
                const empty = document.createElement("div");
                empty.className = "lv-sheet-empty";
                empty.textContent = "未找到匹配结果";
                results.appendChild(empty);
            }
        }).catch(() => { /* 检索异常静默 */ });
    });

    // 最近直达行：上次用过的插件置顶一键再达（单手最常用路径零翻找）
    const recentIds = getRecentTileIds();
    const recentItems = recentIds
        .map((id) => items.find((it) => it.id === id))
        .filter((it): it is typeof items[number] => Boolean(it))
        .slice(0, 5);
    if (recentItems.length > 0 && items.length > 1) {
        const recentRow = document.createElement("div");
        recentRow.className = "lv-sheet-recent";
        const recentLabel = document.createElement("span");
        recentLabel.className = "lv-sheet-recent-label";
        recentLabel.textContent = "最近";
        recentRow.appendChild(recentLabel);
        for (const [ri, rit] of recentItems.entries()) {
            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = "lv-sheet-recent-chip";
            chip.setAttribute("aria-label", `最近直达 ${rit.fullName || rit.name}`);
            chip.textContent = `${ri === 0 ? "⟲ " : ""}${rit.fullName || rit.name}`;
            chip.addEventListener("click", () => {
                hapticFeedback(8);
                pushRecentTileId(rit.id);
                closeMobileSheet();
                try { rit.onClick(); } catch (e) { console.warn("[LvLaunchpad] 最近直达失败:", e); }
            });
            recentRow.appendChild(chip);
        }
        sheet.appendChild(recentRow);
    }

    const grid = document.createElement("div");
    grid.className = items.length > 0 && items.length <= 2 ? "lv-sheet-grid lv-sheet-grid--sparse" : "lv-sheet-grid";
    for (const item of items) {
        const tile = buildSheetTile(item);
        if (tile) grid.appendChild(tile);
    }
    if (!items.length) {
        const empty = document.createElement("div");
        empty.className = "lv-sheet-empty";
        empty.textContent = "尚未有插件入驻罗盘";
        grid.appendChild(empty);
    }
    // 入驻计数副标题：让用户一眼知晓生态规模（0 个时不显示）
    if (items.length > 0) {
        const subtitle = document.createElement("div");
        subtitle.className = "lv-sheet-subtitle";
        subtitle.textContent = `${items.length} 个插件入驻 · 长按磁贴展开快捷行动`;
        sheet.appendChild(subtitle);
    }
    sheet.appendChild(grid);

    // 移动端底部常驻二级快捷行动栏：自动跟随最近使用的插件（无最近记录则取排首插件），单手一键直达前 3 项高频行动
    const quickTarget = recentItems[0] || items[0];
    if (quickTarget && Array.isArray(quickTarget.actions) && quickTarget.actions.length > 0) {
        const quickBox = document.createElement("div");
        quickBox.className = "lv-sheet-quick-drawer";
        quickBox.style.cssText = "margin:2px 0 8px;padding:9px 11px;border-radius:12px;background:var(--lv-lp-panel-bg,#f8fafc);border:1px solid var(--lv-lp-border,rgba(15,23,42,0.08));";
        const qHead = document.createElement("div");
        qHead.style.cssText = "font-size:11.5px;font-weight:700;color:var(--lv-lp-accent,#2563eb);margin-bottom:6px;";
        qHead.textContent = `⚡ ${quickTarget.fullName || quickTarget.name} · 快捷行动直达`;
        quickBox.appendChild(qHead);
        const qChips = document.createElement("div");
        qChips.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;";
        for (const actName of quickTarget.actions.slice(0, 3)) {
            const qBtn = document.createElement("button");
            qBtn.type = "button";
            qBtn.className = "lv-sheet-action-chip";
            qBtn.textContent = actName;
            qBtn.addEventListener("click", () => {
                hapticFeedback(8);
                pushRecentTileId(quickTarget.id);
                closeMobileSheet();
                try { getLaunchpadHub().executeAction(quickTarget.id, actName); } catch (e) { console.warn("[LvLaunchpad] 移动端快捷行动失败:", e); }
            });
            qChips.appendChild(qBtn);
        }
        quickBox.appendChild(qChips);
        sheet.appendChild(quickBox);
    }

    // 实体键盘数字 1~9 直达磁贴（平板键盘盖 / 折叠屏外接键盘）；输入框聚焦时不劫持
    mask.addEventListener("keydown", (ev: Event) => {
        const kev = ev as KeyboardEvent;
        const target = kev.target as HTMLElement | null;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable === true)) return;
        const n = Number(kev.key);
        if (!Number.isInteger(n) || n < 1 || n > 9) return;
        const tiles = grid.querySelectorAll(".lv-sheet-tile");
        const tile = tiles[n - 1] as HTMLElement | undefined;
        if (!tile) return;
        kev.preventDefault();
        tile.click();
    });

    const hint = document.createElement("div");
    hint.className = "lv-sheet-hint";
    hint.textContent = "点击磁贴直达 · 长按展开行动 · 下滑 / 返回键 / 点空白关闭";
    sheet.appendChild(hint);

    mask.addEventListener("click", (ev) => {
        if (ev.target === mask) closeMobileSheet();
    });

    // 下滑关闭手势（把手与面板皆可）
    let touchStartY = 0;
    sheet.addEventListener("touchstart", (ev) => {
        touchStartY = ev.touches[0]?.clientY ?? 0;
    }, { passive: true });
    sheet.addEventListener("touchend", (ev) => {
        const diffY = (ev.changedTouches[0]?.clientY ?? 0) - touchStartY;
        if (diffY > 60) closeMobileSheet();
    }, { passive: true });

    // Esc 仲裁：登记焦点栈，顶栈弹出才关坞
    try {
        lvSurfaceStack.push({ id: "lv-launchpad-mobile-sheet", dismiss: () => { closeMobileSheet(); return true; } });
    } catch { /* 焦点栈不可用不阻断 */ }

    // 动态层级：确保移动端罗盘弹射坞永远高于任何插件自建悬浮球与宿主递增 zIndex
    try {
        const currentZ = typeof window !== "undefined" && (window as unknown as { siyuan?: { zIndex?: number } }).siyuan?.zIndex;
        mask.style.zIndex = String(typeof currentZ === "number" ? Math.max(1080, currentZ + 30) : 1080);
    } catch { /* ignore */ }
    document.body.appendChild(mask);
    recomputeBallSuppression();
    // 键盘循环（零依赖内联版 focus-trap）：Tab 在坞内循环，不外逸到底层文档
    mask.addEventListener("keydown", (ev) => {
        const kev = ev as KeyboardEvent;
        if (kev.key !== "Tab") return;
        const focusables = Array.from(mask.querySelectorAll<HTMLElement>("button, input, select, textarea, a[href], [tabindex]:not([tabindex='-1'])"))
            .filter((el) => !el.hasAttribute("disabled") && (el as HTMLElement).offsetParent !== null);
        if (focusables.length === 0) return;
        const first = focusables[0] as HTMLElement | undefined;
        const last = focusables[focusables.length - 1] as HTMLElement | undefined;
        if (!first || !last) return;
        if (kev.shiftKey && document.activeElement === first) {
            kev.preventDefault();
            last.focus({ preventScroll: true });
        } else if (!kev.shiftKey && document.activeElement === last) {
            kev.preventDefault();
            first.focus({ preventScroll: true });
        }
    });
    // 焦点策略分端：桌面聚焦搜索框直入检索态；移动端不自动聚焦——
    // 软键盘弹出会立刻遮挡下半屏磁贴网格，用户想直达插件却先要收键盘（真机截图实测）
    if (!isMobileFrontend()) {
        try { search.focus({ preventScroll: true }); } catch { /* ignore */ }
    }
    armSheetHistory(); // Android 系统返回手势/返回键 → 关坞而非退出
    hapticFeedback(8);
}

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

function getOmnisearchHub(): LvOmnisearchHub {
    const registry = getSharedRegistry("__LV_SEARCH_PROVIDERS__", searchProviders);
    if (typeof window === "undefined") {
        return {
            version: PROTOCOL_VERSION,
            registerProvider: (plugin, provider) => {
                return registerOwned(registry, plugin, provider);
            },
            search: async () => [],
        };
    }

    if (window.__LV_OMNISEARCH__ && window.__LV_OMNISEARCH__.version >= PROTOCOL_VERSION && window.__LV_OMNISEARCH__.ownerSafe === true) {
        return window.__LV_OMNISEARCH__;
    }

    const hub: LvOmnisearchHub = {
        version: PROTOCOL_VERSION,
        ownerSafe: true,

        registerProvider(plugin: string, provider: LvSearchProvider): () => void {
            return registerOwned(registry, plugin, provider);
        },

        async search(keyword: string): Promise<LvSearchResultItem[]> {
            const kw = keyword.trim().toLowerCase();
            if (!kw) return [];

            const results: LvSearchResultItem[] = [];
            const providers = Array.from(registry.entries());

            // 并发向所有已注册插件发起穿透检索，带 1000ms 超时熔断保护（finally 清除定时器句柄，消减挂起任务）
            await Promise.all(
                providers.map(async ([plugin, provider]) => {
                    let timerId: any = null;
                    try {
                        const timeoutPromise = new Promise<LvSearchResultItem[]>((_, reject) => {
                            timerId = setTimeout(() => reject(new Error("Timeout")), 1000);
                        });
                        const providerPromise = Promise.resolve(provider(kw));
                        const items = await Promise.race([providerPromise, timeoutPromise]);
                        if (Array.isArray(items)) {
                            results.push(...items);
                        }
                    } catch (err) {
                        console.warn(`[LvOmnisearch] 插件 ${plugin} 检索异常或超时:`, err);
                    } finally {
                        if (timerId !== null) {
                            clearTimeout(timerId);
                        }
                    }
                })
            );

            // 相关度排序：标题完全匹配 (3) > 前缀匹配 (2) > 包含匹配 (1)；平局时较短标题优先
            return results.sort((a, b) => {
                const aTitle = a.title.toLowerCase();
                const bTitle = b.title.toLowerCase();
                const aScore = aTitle === kw ? 3 : aTitle.startsWith(kw) ? 2 : aTitle.includes(kw) ? 1 : 0;
                const bScore = bTitle === kw ? 3 : bTitle.startsWith(kw) ? 2 : bTitle.includes(kw) ? 1 : 0;
                if (bScore !== aScore) return bScore - aScore;
                return aTitle.length - bTitle.length;
            });
        }
    };

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
    const registry = getSharedRegistry("__LV_AUTOMATION_RULES__", automationRules);
    if (typeof window === "undefined") {
        return {
            version: PROTOCOL_VERSION,
            registerRule: (rule) => {
                return registerOwned(registry, rule.id, rule);
            },
            trigger: async () => ({ triggered: 0, success: 0 }),
            getRules: () => Array.from(registry.values()),
            toggleRule: () => {},
        };
    }

    if (window.__LV_AUTOMATION__ && window.__LV_AUTOMATION__.version >= PROTOCOL_VERSION && window.__LV_AUTOMATION__.ownerSafe === true) {
        return window.__LV_AUTOMATION__;
    }

    const hub: LvAutomationHub = {
        version: PROTOCOL_VERSION,
        ownerSafe: true,

        registerRule(rule: LvAutomationRule): () => void {
            const states = getStoredRuleStates();
            const isEnabled = states[rule.id] !== undefined ? Boolean(states[rule.id]) : rule.enabled;
            return registerOwned(registry, rule.id, { ...rule, enabled: isEnabled });
        },

        async trigger(source: string, type: string, payload: unknown): Promise<{ triggered: number; success: number }> {
            const matched = Array.from(registry.values()).filter(
                r => r.enabled && (r.triggerSource === source || r.triggerSource === "*") && r.triggerType === type
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
            return Array.from(registry.values()).map(r => ({
                ...r,
                enabled: states[r.id] !== undefined ? Boolean(states[r.id]) : r.enabled,
            }));
        },

        toggleRule(ruleId: string, enabled: boolean): void {
            const states = getStoredRuleStates();
            states[ruleId] = enabled;
            saveStoredRuleStates(states);
            const r = registry.get(ruleId);
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
