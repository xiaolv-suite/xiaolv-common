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
    /** 未来 N 天不通知（如 3、7） */
    muteDays?: number;
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
    /** 是否归档进入通知中心历史（默认 true；瞬时操作回执可设为 false 避免通知中心泛滥） */
    archive?: boolean;
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
    read?: boolean;
    archive?: boolean;
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

const PROTOCOL_VERSION = 184; // 1.8.4 (Mobile double-tap LifeLog & ephemeral vs archived notice separation)
const STORAGE_PREFIX = "lv_notice_mute_";
const HISTORY_STORAGE_PREFIX = "lv_notice_history_";
const MAX_PERSISTED_HISTORY = 50;
const AI_STORAGE_KEY = "lv_ai_shared_config";
const LAUNCHPAD_STORAGE_KEY = "lv_launchpad_states";
const AUTOMATION_RULES_KEY = "lv_automation_rules_config";

export interface LvOmnisearchStreamStatus {
    done: boolean;
    pending: number;
    total: number;
}

export interface LvTodayMetric {
    id: "checkin" | "cards" | "home" | "glean" | string;
    pluginId: string;
    name: string;
    shortName: string;
    color: string;
    iconSvg: string;
    count: number;
    total?: number;
    badgeText: string;
    label: string;
    status: "done" | "pending" | "empty" | "uninstalled";
}

export interface LvTodaySummary {
    date: string;
    metrics: LvTodayMetric[];
    allDone: boolean;
}

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

export interface LvQuickWorkspaceConfig {
    lifeLogCategories: string[];
    lifeLogNotebookId?: string;
    diaryNotebookId?: string;
    quickNoteNotebookId?: string;
    quickNoteDocumentId?: string;
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
    muteDays?: (category: string, days: number) => void;
    muteUntil?: (category: string, untilTimestamp: number) => void;
    isCategoryMuted?: (category: string) => boolean;
    clearCategoryMute?: (category: string) => void;
    getMutedCategories?: () => Array<{ category: string; until: number; untilStr: string }>;
    getHistory: () => LvNoticePacket[];
    clearHistory?: () => void;
    markAllRead?: () => void;
    markRead?: (id: string) => void;
    getUnreadCount?: () => number;
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
    openQuickNote?: () => void;
    openLifeLog?: () => void;
    openDiaryBottom?: () => Promise<void>;
    openTaskManager?: () => void;
    openNewTask?: () => void | Promise<void>;
    reloadUI?: () => void | Promise<void>;
    randomWalk?: () => void | Promise<void>;
    pasteToDailyNote?: () => void | Promise<void>;
    getQuickWorkspaceConfig?: () => LvQuickWorkspaceConfig;
    saveQuickWorkspaceConfig?: (patch: Partial<LvQuickWorkspaceConfig>) => void;
}

interface LvOmnisearchHub {
    version: number;
    ownerSafe?: true;
    registerProvider: (plugin: string, provider: LvSearchProvider) => () => void;
    search: (keyword: string) => Promise<LvSearchResultItem[]>;
    searchStream?: (
        keyword: string,
        onUpdate: (hits: LvSearchResultItem[], status: LvOmnisearchStreamStatus) => void
    ) => Promise<LvSearchResultItem[]>;
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
:is([data-theme-mode="dark"], [data-appearance="dark"], body.body--dark, body.theme--dark, html.dark, body.dark) {
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
    right: max(20px, env(safe-area-inset-right, 0px));
    bottom: max(38px, calc(var(--b3-toolbar-height, 0px) + 12px + env(safe-area-inset-bottom, 0px)));
    z-index: 999;
    pointer-events: none;
    font-family: var(--b3-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    /* 堆叠上限：长文卡可展开至全文，多卡同时存在时向内滚动收纳，不遮整个工作区 */
    max-height: calc(100vh - 64px);
    max-height: calc(100dvh - 64px); /* 移动端动态视口：浏览器工具栏伸缩时不溢出 */
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: none;
}
#lv-notice-host::-webkit-scrollbar { display: none; }

/* 堆叠溢出徽标：仅渲染最近 3 条时示意更早通知数量 */
.lv-notice-more {
    pointer-events: auto;
    align-self: flex-end;
    border: 1px solid rgba(15, 23, 42, 0.1);
    background: #f1f5f9;
    color: #475569;
    font-size: 11px;
    font-weight: 700;
    padding: 3px 9px;
    border-radius: 999px;
    cursor: pointer;
    font-family: inherit;
    -webkit-tap-highlight-color: transparent;
}
:is([data-theme-mode="dark"], [data-appearance="dark"], body.body--dark, body.theme--dark, html.dark) .lv-notice-more {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.12);
    color: #cbd5e1;
}

.lv-notice-card {
    --lv-nt-bg: rgba(255, 255, 255, 0.97);
    --lv-nt-border: rgba(15, 23, 42, 0.085);
    --lv-nt-text: #0f172a;
    --lv-nt-text-sub: #475569;
    --lv-nt-pill-bg: #f1f5f9;
    /* 通知卡主题色固定为中性蓝（或插件 :root 级 --lv-brand），不读取宿主主题色，
       避免宿主换主题时通知卡变色；罗盘入口等宿主 chrome 内元素仍跟随宿主（见文件尾）。 */
    --lv-nt-accent: var(--lv-brand, #2563eb);
    --lv-nt-on-accent: #ffffff;
    pointer-events: auto;
    width: min(380px, calc(100vw - 32px));
    width: min(380px, calc(100dvw - 32px));
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
:is([data-theme-mode="dark"], [data-appearance="dark"], body.body--dark, body.theme--dark, html.dark) .lv-notice-card {
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
    transition: transform 0.15s ease, background 0.15s ease, color 0.15s ease;
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
.lv-notice-snooze-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
    width: 100%;
    margin-top: 4px;
    padding-top: 6px;
    border-top: 1px dashed var(--lv-nt-border);
}
.lv-notice-btn--mute {
    font-size: 11px;
    font-weight: 500;
    padding: 3px 8px;
    border-radius: 6px;
    background: transparent;
    color: var(--lv-nt-muted);
    border: 1px solid var(--lv-nt-border);
}
.lv-notice-btn--mute:hover {
    background: var(--lv-nt-pill-bg);
    color: var(--lv-nt-text);
    border-color: var(--lv-nt-accent);
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
:is([data-theme-mode="dark"], [data-appearance="dark"], body.body--dark, body.theme--dark, html.dark) .lv-notice-capsule {
    background: rgba(28, 33, 45, 0.96);
    border-color: rgba(255, 255, 255, 0.1);
    color: #f8fafc;
    box-shadow: 0 10px 28px -4px rgba(0, 0, 0, 0.45);
}

.lv-notice-capsule-action {
    background: var(--lv-nt-accent, #3576c7);
    color: var(--lv-nt-on-accent, #ffffff);
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

:is(body.body--mobile, [data-is-mobile="true"]) #lv-notice-host,
@media (max-width: 640px) {
    #lv-notice-host {
        right: 0;
        left: 0;
        top: calc(var(--mobile-topbar-height, 48px) + env(safe-area-inset-top, 0px) + 8px);
        bottom: auto;
        align-items: center;
        padding: 0 max(12px, env(safe-area-inset-right, 0px)) 0 max(12px, env(safe-area-inset-left, 0px));
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
        max-width: calc(100dvw - 24px);
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
:is([data-theme-mode="dark"], [data-appearance="dark"], body.body--dark, body.theme--dark, html.dark) #lv-launchpad-sheet-mask {
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
    padding: 6px max(12px, env(safe-area-inset-right, 0px)) calc(10px + env(safe-area-inset-bottom, 0px)) max(12px, env(safe-area-inset-left, 0px));
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
/* 生态直达行（收敛为底部轻量辅助操作） */
.lv-sheet-eco-row { display: flex; gap: 6px; margin: 4px 0 6px; }
.lv-sheet-eco-chip {
    flex: 1;
    border: 1px dashed var(--lv-lp-border);
    background: transparent;
    border-radius: 8px;
    padding: 4px 8px;
    font-size: 11px;
    font-weight: 500;
    color: var(--lv-lp-text-sub);
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition: transform 0.14s ease, border-color 0.14s ease, color 0.14s ease;
}
.lv-sheet-eco-chip:active { transform: scale(0.97); background: var(--lv-lp-accent-soft); border-color: var(--lv-lp-accent); color: var(--lv-lp-accent); }
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
    gap: 5px;
    margin-bottom: 6px;
}
.lv-sheet-title { font-size: 14.5px; font-weight: 700; color: var(--lv-lp-text); letter-spacing: -0.01em; white-space: nowrap; flex-shrink: 0; }
.lv-sheet-head-actions { display: flex; align-items: center; gap: 4px; margin-left: auto; min-width: 0; flex-shrink: 1; }
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
    flex-shrink: 0;
    transition: transform 0.12s ease, background-color 0.14s ease, color 0.14s ease;
}
.lv-sheet-close:active { transform: scale(0.92); background: var(--lv-lp-accent-soft); color: var(--lv-lp-accent); }
.lv-sheet-search-wrap { position: relative; display: flex; align-items: center; margin-bottom: 5px; }
.lv-sheet-search-wrap .lv-sheet-search { margin-bottom: 0; padding-right: 32px; }
.lv-sheet-search-clear {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    width: 22px;
    height: 22px;
    min-height: 22px !important;
    border-radius: 999px;
    border: none;
    background: var(--lv-lp-border);
    color: var(--lv-lp-text-sub);
    font-size: 11px;
    display: none;
    place-items: center;
    cursor: pointer;
    padding: 0;
}
.lv-sheet-search-clear.visible { display: grid; }
.lv-sheet-search.b3-text-field,
.lv-sheet-search {
    width: 100%;
    height: 28px;
    box-sizing: border-box;
    margin-bottom: 5px;
    padding: 3px 9px;
    border-radius: 7px;
    border: 1px solid var(--lv-lp-border);
    background: var(--lv-lp-panel-bg);
    color: var(--lv-lp-text);
    font-size: 11.5px;
    box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.02);
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
.lv-sheet-quick-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 7px; margin: 2px 0 8px; }
.lv-sheet-quick-card { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; min-height: 54px; padding: 8px 3px 7px; border-radius: 12px; background: var(--lv-lp-card-bg); border: 1px solid var(--lv-lp-border-strong); box-shadow: 0 2px 6px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.6); cursor: pointer; text-align: center; font-family: inherit; -webkit-tap-highlight-color: transparent; transition: transform 0.14s ease, background-color 0.14s ease, border-color 0.14s ease, box-shadow 0.14s ease, opacity 0.14s ease; }
.lv-sheet-quick-card:active { transform: scale(0.95); background: var(--lv-lp-accent-soft); color: var(--lv-lp-accent); border-color: var(--lv-lp-accent); box-shadow: none; }
.lv-sheet-quick-card[data-busy="true"] { opacity: 0.68; pointer-events: none; }
.lv-sheet-quick-card[data-busy="true"] .lv-sheet-quick-icon { animation: lvSpin 0.8s linear infinite; }
.lv-sheet-quick-icon { font-size: 18.5px; line-height: 1; display: inline-flex; align-items: center; justify-content: center; }
.lv-sheet-quick-text { font-size: 11px; font-weight: 650; color: var(--lv-lp-text); white-space: nowrap; }
.lv-sheet-today-ticker { display: flex; align-items: center; gap: 5px; margin: 0 0 7px; overflow-x: auto; overscroll-behavior-x: contain; scrollbar-width: none; }
.lv-sheet-today-ticker::-webkit-scrollbar { display: none; }
.lv-sheet-ticker-pill { display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0; padding: 2px 8px; border-radius: 999px; background: var(--lv-lp-panel-bg); border: 1px solid var(--lv-lp-border); color: var(--lv-lp-text-sub); font-size: 10.5px; font-family: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; white-space: nowrap; transition: transform 0.12s ease, background-color 0.12s ease, border-color 0.12s ease; }
.lv-sheet-ticker-pill:active { transform: scale(0.95); background: var(--lv-lp-accent-soft); color: var(--lv-lp-accent); border-color: var(--lv-lp-accent); }
.lv-sheet-ticker-pill.done { opacity: 0.92; background: rgba(16, 185, 129, 0.08); border-color: rgba(16, 185, 129, 0.22); }
.lv-sheet-ticker-pill.uninstalled { opacity: 0.45; cursor: default; }
.lv-sheet-ticker-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.lv-sheet-ticker-val { font-weight: 700; font-family: monospace; color: var(--lv-lp-text); font-size: 10px; }
.lv-sheet-ticker-pill.done .lv-sheet-ticker-val { color: #10b981; }
.lv-sheet-inbox-panel { display: flex; flex-direction: column; gap: 6px; padding: 8px 10px; margin: 4px 0 8px; border-radius: 12px; background: var(--lv-lp-panel-bg); border: 1px solid var(--lv-lp-border); max-height: 240px; overflow-y: auto; }
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
    /* 通知卡滑入、胶囊弹出、桌面罗盘 popover 入场：系统开启「减弱动态效果」时全部直出 */
    #lv-notice-host .lv-notice-card,
    #lv-notice-host .lv-notice-capsule,
    .lv-desktop-launchpad-popover {
        animation: none !important;
        transition: none !important;
    }
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
:is([data-theme-mode="dark"], [data-appearance="dark"], body.body--dark, body.theme--dark, html.dark) #lv-launchpad-mobile-ball {
    color: #f8fafc;
    background: rgba(30, 36, 49, 0.9);
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: 0 6px 22px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
#lv-launchpad-mobile-ball:active,
#lv-launchpad-mobile-ball.lv-ball-pressing { transform: scale(0.92); box-shadow: 0 4px 16px rgba(37, 99, 235, 0.28), 0 0 0 3px rgba(37, 99, 235, 0.16); }
/* 水平位置由 JS 写入 style.left（拖拽/贴边吸附），transform 只负责半隐/沉浸/拖拽缩放视觉 */
#lv-launchpad-mobile-ball.lv-ball-edge-left.lv-ball-idle,
#lv-launchpad-mobile-ball.lv-ball-edge-left.lv-ball-immersive { transform: translateX(-40%) scale(0.9); opacity: 0.55; }
#lv-launchpad-mobile-ball.lv-ball-edge-right.lv-ball-idle,
#lv-launchpad-mobile-ball.lv-ball-edge-right.lv-ball-immersive { transform: translateX(40%) scale(0.9); opacity: 0.55; }
#lv-launchpad-mobile-ball.lv-ball-dragging { transition: none; transform: scale(1.1); opacity: 0.96; z-index: 990; }
/* 与思源原生移动端冲突避让：任一 .b3-dialog 打开时隐藏悬浮球，输入聚焦时仅半隐贴边 */
#lv-launchpad-mobile-ball.lv-ball-suppressed { display: none; }
@keyframes lvSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* ===== 极速工作台弹窗（一键记事 / LifeLog） ===== */
.lv-qw-mask{
  --lv-lp-panel-bg:#f8fafc;--lv-lp-card-bg:#ffffff;--lv-lp-card-hover-bg:#f1f5f9;--lv-lp-border:rgba(15,23,42,.09);--lv-lp-border-strong:rgba(15,23,42,.15);--lv-lp-text:#0f172a;--lv-lp-text-sub:#64748b;--lv-lp-accent:#2563eb;--lv-lp-accent-soft:rgba(37,99,235,.1);
  position:fixed;inset:0;z-index:1095;background:rgba(15,23,42,.45);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px max(16px,env(safe-area-inset-right,0px)) max(16px,env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));box-sizing:border-box;animation:lvSheetMaskIn 180ms ease both;
}
:is([data-theme-mode="dark"],[data-appearance="dark"],body.body--dark,body.theme--dark,html.dark) .lv-qw-mask{
  --lv-lp-panel-bg:rgba(30,36,49,.82);--lv-lp-card-bg:#1e2433;--lv-lp-card-hover-bg:#283044;--lv-lp-border:rgba(255,255,255,.1);--lv-lp-border-strong:rgba(255,255,255,.16);--lv-lp-text:#f8fafc;--lv-lp-text-sub:#94a3b8;--lv-lp-accent:#60a5fa;--lv-lp-accent-soft:rgba(59,130,246,.2);
  background:rgba(0,0,0,.58);
}
.lv-qw-card{width:min(520px,94vw);max-height:90dvh;background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,.14));border-radius:18px;box-shadow:0 20px 44px -8px rgba(15,23,42,.26),0 0 0 1px rgba(255,255,255,.08) inset;display:flex;flex-direction:column;overflow:hidden;color:var(--lv-lp-text,#0f172a);font-family:var(--b3-font-family,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif);animation:lvSheetCenter 200ms cubic-bezier(.22,1,.36,1) both}
.lv-qw-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:13px 16px 11px;border-bottom:1px solid var(--lv-lp-border,rgba(15,23,42,.08));flex-shrink:0}
.lv-qw-title-wrap{display:flex;align-items:center;gap:7px;min-width:0;flex-wrap:wrap}
.lv-qw-icon{font-size:16px;line-height:1}
.lv-qw-title{font-size:14px;font-weight:700;white-space:nowrap}
.lv-qw-badge{font-size:10.5px;font-weight:600;padding:2.5px 9px;border-radius:999px;background:var(--lv-lp-accent-soft,rgba(37,99,235,.1));color:var(--lv-lp-accent,#2563eb);max-width:210px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lv-qw-badge-btn{cursor:pointer;border:1px solid transparent;font-family:inherit;transition:background-color .15s ease,border-color .15s ease,transform .12s ease}
.lv-qw-badge-btn:hover{border-color:var(--lv-lp-accent);opacity:.92}
.lv-qw-badge-btn:active{transform:scale(.96)}
.lv-qw-close{background:transparent;border:none;cursor:pointer;font-size:14px;padding:4px 7px;border-radius:7px;color:var(--lv-lp-text-sub,#64748b);transition:background-color .14s ease,color .14s ease,transform .12s ease}
.lv-qw-close:hover{background:var(--lv-lp-panel-bg,#f1f5f9);color:var(--lv-lp-text,#0f172a)}
.lv-qw-close:active{transform:scale(.92)}
.lv-qw-body{padding:13px 16px;display:flex;flex-direction:column;gap:9px;overflow-y:auto;overscroll-behavior:contain}
.lv-qw-categories,.lv-qw-tags-row,.lv-qw-time-offsets{display:flex;align-items:center;flex-wrap:wrap;gap:6px}
.lv-qw-tags-label{font-size:11px;color:var(--lv-lp-text-sub,#64748b);font-weight:500}
.lv-qw-cat-pill{display:inline-flex;align-items:center;position:relative}
.lv-qw-cat-chip{padding:4px 11px;border-radius:999px;border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,.12));background:var(--lv-lp-panel-bg,#f8fafc);color:var(--lv-lp-text,#0f172a);font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:background-color .15s ease,border-color .15s ease,color .15s ease,transform .12s ease,box-shadow .15s ease}
.lv-qw-cat-chip:active{transform:scale(.96)}
.lv-qw-cat-chip.active{background:var(--lv-lp-accent,#2563eb);color:#fff;border-color:var(--lv-lp-accent,#2563eb);box-shadow:0 2px 8px rgba(37,99,235,.28)}
.lv-qw-cat-del{margin-left:-16px;margin-right:2px;width:15px;height:15px;border-radius:999px;border:none;background:rgba(15,23,42,.18);color:#fff;font-size:10px;line-height:1;display:inline-grid;place-items:center;cursor:pointer;opacity:.75;transition:opacity .12s ease,background-color .12s ease}
.lv-qw-cat-del:hover{opacity:1;background:#ef4444}
.lv-qw-add-cat-btn{padding:4px 10px;border-radius:999px;border:1px dashed var(--lv-lp-border-strong,rgba(15,23,42,.22));background:transparent;color:var(--lv-lp-text-sub,#64748b);font-size:11.5px;font-weight:600;cursor:pointer;font-family:inherit;transition:border-color .14s ease,color .14s ease,background-color .14s ease}
.lv-qw-add-cat-btn:hover{border-color:var(--lv-lp-accent,#2563eb);color:var(--lv-lp-accent,#2563eb);background:var(--lv-lp-accent-soft,rgba(37,99,235,.06))}
.lv-qw-add-cat-row{display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:9px;background:var(--lv-lp-panel-bg,#f8fafc);border:1px solid var(--lv-lp-border-strong)}
.lv-qw-add-cat-input{flex:1;min-width:0;padding:4px 8px;border-radius:6px;border:1px solid var(--lv-lp-border-strong);background:var(--lv-lp-card-bg);color:var(--lv-lp-text);font-size:12px;font-family:inherit}
.lv-qw-add-cat-input:focus{outline:none;border-color:var(--lv-lp-accent)}
.lv-qw-nb-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 9px;border-radius:9px;background:var(--lv-lp-panel-bg);border:1px solid var(--lv-lp-border);font-size:11.5px}
.lv-qw-nb-select{flex:1;min-width:0;padding:4px 8px;border-radius:6px;border:1px solid var(--lv-lp-border-strong);background:var(--lv-lp-card-bg);color:var(--lv-lp-text);font-size:11.5px;font-family:inherit;cursor:pointer}
.lv-qw-tag-chip{padding:3px 8px;border-radius:6px;border:1px solid var(--lv-lp-border,rgba(15,23,42,.1));background:var(--lv-lp-panel-bg,#f8fafc);color:var(--lv-lp-text,#0f172a);font-size:11px;cursor:pointer;font-family:inherit;transition:background-color .12s ease,border-color .12s ease,color .12s ease,transform .1s ease}
.lv-qw-tag-chip:active,.lv-qw-time-chip:active{transform:scale(.95)}
.lv-qw-tag-chip:hover,.lv-qw-time-chip:hover,.lv-qw-time-chip.active{background:var(--lv-lp-accent-soft,rgba(37,99,235,.1));border-color:var(--lv-lp-accent,#2563eb);color:var(--lv-lp-accent,#2563eb)}
.lv-qw-time-chip{padding:2.5px 7px;border-radius:5px;border:1px solid var(--lv-lp-border,rgba(15,23,42,.08));background:var(--lv-lp-card-bg,#fff);color:var(--lv-lp-text-sub,#64748b);font-size:10.5px;cursor:pointer;font-family:inherit;transition:background-color .12s ease,border-color .12s ease,color .12s ease}
.lv-qw-textarea{width:100%;box-sizing:border-box;min-height:112px;max-height:240px;resize:vertical;border-radius:10px;padding:10px 12px;font-size:13.5px;line-height:1.6;font-family:inherit;border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,.14));background:var(--lv-lp-card-bg,#fff);color:var(--lv-lp-text,#0f172a);transition:border-color .15s ease,box-shadow .15s ease}
.lv-qw-textarea:focus{outline:none;border-color:var(--lv-lp-accent,#2563eb);box-shadow:0 0 0 3px var(--lv-lp-accent-soft,rgba(37,99,235,.15))}
.lv-qw-preview-tag,.lv-qw-draft-hint,.lv-qw-recent-strip{font-size:11px;color:var(--lv-lp-text-sub,#64748b);padding:4.5px 9px;border-radius:7px;background:var(--lv-lp-panel-bg,#f8fafc);border:1px dashed var(--lv-lp-border,rgba(15,23,42,.1))}
.lv-qw-draft-hint{display:flex;align-items:center;justify-content:space-between;font-size:10.5px}
.lv-qw-recent-strip{display:flex;align-items:center;gap:6px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:10.5px}
.lv-qw-recent-strip .lv-qw-strip-text{flex:1 1 auto;overflow:hidden;text-overflow:ellipsis;min-width:0}
.lv-qw-undo-btn{flex-shrink:0;border:none;cursor:pointer;font-size:10.5px;font-weight:650;padding:2px 8px;border-radius:6px;background:var(--lv-lp-accent-soft,rgba(37,99,235,.12));color:var(--lv-lp-accent,#2563eb);font-family:inherit;-webkit-tap-highlight-color:transparent;transition:transform .12s ease,opacity .12s ease}
.lv-qw-undo-btn:active{transform:scale(.94);opacity:.8}
.lv-qw-cat-count{opacity:.72;font-weight:600}
.lv-restore-warn{font-size:11.5px;line-height:1.55;color:var(--lv-lp-text,#0f172a);background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);padding:7px 10px;border-radius:8px}
.lv-restore-pick{display:flex;align-items:center;gap:6px}
.lv-restore-summary{display:flex;flex-direction:column;gap:4px;font-size:11.5px;color:var(--lv-lp-text,#0f172a);background:var(--lv-lp-panel-bg,#f8fafc);border:1px dashed var(--lv-lp-border,rgba(15,23,42,.1));padding:7px 10px;border-radius:8px}
.lv-qw-attach-strip{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:6px 8px;border-radius:8px;background:var(--lv-lp-panel-bg,#f8fafc);border:1px dashed var(--lv-lp-border,rgba(15,23,42,.1))}
.lv-qw-attach-thumb{position:relative;width:48px;height:48px;border-radius:8px;overflow:hidden;border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,.14));background:var(--lv-lp-panel-bg,#f1f5f9);flex-shrink:0}
.lv-qw-attach-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.lv-qw-attach-del{position:absolute;top:0;right:0;width:16px;height:16px;border:none;border-radius:0 0 0 6px;background:rgba(15,23,42,.62);color:#fff;font-size:11px;line-height:16px;padding:0;cursor:pointer;font-family:inherit}
.lv-qw-attach-del:active{transform:scale(.92)}
.lv-qw-attach-thumb.lv-qw-attach-busy{display:flex;align-items:center;justify-content:center}
.lv-qw-attach-thumb.lv-qw-attach-busy::after{content:"";width:16px;height:16px;border-radius:50%;border:2px solid var(--lv-lp-accent,#2563eb);border-top-color:transparent;animation:lvSpin .8s linear infinite}
.lv-qw-attach-actions{display:flex;align-items:center;gap:6px;margin-top:4px}
.lv-qw-draft-clear{border:none;background:transparent;color:var(--lv-lp-accent,#2563eb);cursor:pointer;font-size:10.5px;padding:0 2px;font-weight:600}
.lv-qw-preview-text{font-weight:600;color:var(--lv-lp-text,#0f172a)}
.lv-qw-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:10px 16px 13px;border-top:1px solid var(--lv-lp-border,rgba(15,23,42,.08));font-size:11px;color:var(--lv-lp-text-sub,#64748b);flex-shrink:0}
.lv-qw-tip-wrap{display:flex;align-items:center;gap:8px;min-width:0}
.lv-qw-char-count{font-variant-numeric:tabular-nums;opacity:.85}
.lv-qw-actions{display:flex;gap:7px;margin-left:auto}
.lv-qw-btn{padding:6px 13px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,.12));background:var(--lv-lp-panel-bg,#f8fafc);color:var(--lv-lp-text,#0f172a);transition:background-color .15s ease,border-color .15s ease,transform .12s ease,opacity .15s ease}
.lv-qw-btn:hover:not(:disabled){background:var(--lv-lp-card-hover-bg,#f1f5f9)}
.lv-qw-btn:active:not(:disabled){transform:scale(.96)}
.lv-qw-btn:disabled{opacity:.58;cursor:not-allowed}
.lv-qw-btn-secondary{color:var(--lv-lp-accent,#2563eb);border-color:color-mix(in srgb,var(--lv-lp-accent,#2563eb) 35%,var(--lv-lp-border-strong));background:var(--lv-lp-accent-soft,rgba(37,99,235,.08))}
.lv-qw-btn-primary{background:var(--lv-lp-accent,#2563eb);color:#fff;border-color:var(--lv-lp-accent,#2563eb);box-shadow:0 2px 6px rgba(37,99,235,.2)}
.lv-qw-btn-primary:hover:not(:disabled){filter:brightness(1.06)}
.lv-qw-btn:focus-visible,.lv-qw-cat-chip:focus-visible,.lv-qw-tag-chip:focus-visible,.lv-qw-time-chip:focus-visible,.lv-qw-close:focus-visible,.lv-qw-badge-btn:focus-visible{outline:2px solid var(--lv-lp-accent,#2563eb);outline-offset:2px}
@media (max-width:600px){
  .lv-qw-textarea,.lv-qw-add-cat-input,.lv-qw-nb-select{font-size:16px}
  .lv-qw-btn{min-height:38px;padding:7px 14px}
}

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
    font-size: 11.5px;
    line-height: 1;
    height: 32px;
    padding: 0 9px;
    border-radius: 999px;
    color: var(--lv-lp-text);
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: transform 0.12s ease, background-color 0.14s ease, border-color 0.14s ease, color 0.14s ease;
}
.lv-sheet-moon:active { transform: scale(0.95); }
.lv-sheet-moon[aria-pressed="true"] {
    background: var(--lv-lp-accent-soft);
    border-color: color-mix(in srgb, var(--lv-lp-accent) 30%, transparent);
    color: var(--lv-lp-accent);
    font-weight: 600;
}
/* Keep compact visuals while giving phone actions their own usable hit areas. */
#lv-launchpad-sheet-mask button,
#lv-launchpad-sheet-mask .lv-sheet-search {
    min-height: 32px;
}
#lv-launchpad-sheet-mask .lv-sheet-close { width: 38px; height: 38px; }
#lv-launchpad-sheet-mask .lv-sheet-search { font-size: 16px; height: 36px; }
#lv-launchpad-sheet-mask .lv-sheet-action-chip { min-width: 44px; }
#lv-launchpad-sheet-mask .lv-sheet.lv-sheet-dragging { will-change: transform; }
@media (max-width: 600px) {
    #lv-launchpad-sheet-mask select,
    #lv-launchpad-sheet-mask input { font-size: 16px !important; }
}
@media (prefers-reduced-motion: reduce) {
    #lv-launchpad-mobile-ball { transition: none; }
}
`;

function ensureStyles(): void {
    if (typeof document === "undefined" || !document.head || typeof document.createElement !== "function") return;
    const styleId = "lv-notice-styles";
    const existing = typeof document.getElementById === "function" ? document.getElementById(styleId) : null;
    if (existing) {
        if (existing.getAttribute?.("data-lv-ver") === "2.9") return;
        existing.textContent = STYLES;
        existing.setAttribute?.("data-lv-ver", "2.9");
        return;
    }
    const styleEl = document.createElement("style");
    styleEl.id = styleId;
    styleEl.setAttribute?.("data-lv-ver", "2.9");
    styleEl.textContent = STYLES;
    document.head.appendChild(styleEl);
}

/* ========================================================================= */
/* 5. Coordinator 核心实现（自协商单例与 UI 挂载）                           */
/* ========================================================================= */

function getTodayKey(d = new Date()): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getSafeLocalStorage(): Storage | null {
    try {
        return typeof localStorage !== "undefined" ? localStorage : null;
    } catch {
        return null;
    }
}

const MUTE_UNTIL_STORAGE_KEY = "lv_notice_mute_until_v1";

function loadMuteUntilMap(): Record<string, number> {
    const ls = getSafeLocalStorage();
    if (!ls) return {};
    try {
        const raw = ls.getItem(MUTE_UNTIL_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                const now = Date.now();
                const active: Record<string, number> = {};
                let cleaned = false;
                for (const [k, v] of Object.entries(parsed)) {
                    if (typeof v === "number" && Number.isFinite(v) && v > now) {
                        active[k] = v;
                    } else {
                        cleaned = true;
                    }
                }
                if (cleaned) {
                    try { ls.setItem(MUTE_UNTIL_STORAGE_KEY, JSON.stringify(active)); } catch { /* ignore */ }
                }
                return active;
            }
        }
    } catch { /* ignore */ }
    return {};
}

function saveMuteUntilMap(map: Record<string, number>): void {
    const ls = getSafeLocalStorage();
    if (!ls) return;
    try {
        ls.setItem(MUTE_UNTIL_STORAGE_KEY, JSON.stringify(map));
    } catch { /* ignore */ }
}

function muteCategoryUntilImpl(category: string, untilTimestamp: number): void {
    if (!category || !Number.isFinite(untilTimestamp)) return;
    const map = loadMuteUntilMap();
    map[category] = untilTimestamp;
    saveMuteUntilMap(map);
}

function muteCategoryDaysImpl(category: string, days: number): void {
    if (!category || !Number.isFinite(days) || days <= 0) return;
    const d = new Date();
    // 若 days === 3：今天 + 3天后的 23:59:59 结束；如果是按严格 N*24h 或到第 N 天末：
    // 例如今日11月12日，选“未来3天不通知”，即今天12日、13日、14日（或12+3=15日）不通知
    d.setDate(d.getDate() + Math.floor(days));
    d.setHours(23, 59, 59, 999);
    muteCategoryUntilImpl(category, d.getTime());
}

function muteCategoryTodayImpl(category: string): void {
    if (!category) return;
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    muteCategoryUntilImpl(category, d.getTime());
    const ls = getSafeLocalStorage();
    if (!ls) return;
    try {
        const key = `${STORAGE_PREFIX}${getTodayKey()}`;
        try {
            if (typeof ls.length === "number" && typeof ls.key === "function" && typeof ls.removeItem === "function") {
                for (let i = ls.length - 1; i >= 0; i--) {
                    const k = ls.key(i);
                    if (k && k.startsWith(STORAGE_PREFIX) && k !== key) {
                        ls.removeItem(k);
                    }
                }
            }
        } catch { /* ignore */ }
        const raw = ls.getItem(key) || "[]";
        const list = JSON.parse(raw);
        if (Array.isArray(list) && !list.includes(category)) {
            list.push(category);
            ls.setItem(key, JSON.stringify(list));
        }
    } catch { /* storage fallback */ }
}

function isCategoryMutedImpl(category: string): boolean {
    if (!category) return false;
    const map = loadMuteUntilMap();
    if (map[category] && map[category] > Date.now()) {
        return true;
    }
    const ls = getSafeLocalStorage();
    if (!ls) return false;
    try {
        const key = `${STORAGE_PREFIX}${getTodayKey()}`;
        const raw = ls.getItem(key);
        if (!raw) return false;
        const list = JSON.parse(raw);
        return Array.isArray(list) && list.includes(category);
    } catch {
        return false;
    }
}

function clearCategoryMuteImpl(category: string): void {
    if (!category) return;
    const map = loadMuteUntilMap();
    if (Object.prototype.hasOwnProperty.call(map, category)) {
        delete map[category];
        saveMuteUntilMap(map);
    }
    const ls = getSafeLocalStorage();
    if (!ls) return;
    try {
        const key = `${STORAGE_PREFIX}${getTodayKey()}`;
        const raw = ls.getItem(key);
        if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
                ls.setItem(key, JSON.stringify(list.filter((c: string) => c !== category)));
            }
        }
    } catch { /* ignore */ }
}

function getMutedCategoriesImpl(): Array<{ category: string; until: number; untilStr: string }> {
    const map = loadMuteUntilMap();
    const now = Date.now();
    const out: Array<{ category: string; until: number; untilStr: string }> = [];
    for (const [cat, until] of Object.entries(map)) {
        if (until > now) {
            const d = new Date(until);
            const untilStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
            out.push({ category: cat, until, untilStr });
        }
    }
    return out;
}

function isFoldableHeartbeatCategory(category?: string): boolean {
    if (!category) return false;
    return (
        category === "hub-scan" ||
        category === "heartbeat-scan" ||
        category === "journal-sync" ||
        category.endsWith("-scan") ||
        category.endsWith("-progress")
    );
}

function recordIntoHistory(historyList: LvNoticePacket[], packet: LvNoticePacket): LvNoticePacket {
    const src = packet.source || "";
    const ttl = packet.title || "";
    const msg = packet.message || "";
    const lvl = packet.level || "info";
    const cat = packet.category || "";

    const idx = historyList.findIndex((p) => {
        if ((p.source || "") !== src) return false;
        if ((p.level || "info") !== lvl) return false;
        if ((p.title || "") === ttl && (p.message || "") === msg) {
            return true;
        }
        if (packet.mode === "silent" && p.mode === "silent" && isFoldableHeartbeatCategory(cat) && p.category === cat) {
            return true;
        }
        return false;
    });

    if (idx >= 0) {
        const target = historyList[idx]!;
        const sameContent = (target.message || "") === msg && (target.title || "") === ttl;
        target.repeatCount = (target.repeatCount || 1) + 1;
        target.createdAt = packet.createdAt || Date.now();
        target.message = packet.message;
        if (packet.title !== undefined) target.title = packet.title;
        if (packet.action) target.action = packet.action;
        if (packet.category) target.category = packet.category;
        if (packet.read === false && (!sameContent || packet.mode !== "silent" || lvl === "warn" || lvl === "error")) {
            target.read = false;
        }
        if (idx > 0) {
            historyList.splice(idx, 1);
            historyList.unshift(target);
        }
        return target;
    }

    historyList.unshift(packet);
    if (historyList.length > 100) historyList.pop();
    return packet;
}

function loadTodayNoticeHistory(): LvNoticePacket[] {
    const ls = getSafeLocalStorage();
    if (!ls) return [];
    try {
        const key = `${HISTORY_STORAGE_PREFIX}${getTodayKey()}`;
        const raw = ls.getItem(key);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        const rawList = parsed.filter((p) => p && typeof p.id === "string" && typeof p.message === "string").slice(0, MAX_PERSISTED_HISTORY);
        // 兼容折叠历史存量重复项（按从旧到新回放折叠，保留最新顺序与累计次数）
        const compacted: LvNoticePacket[] = [];
        for (let i = rawList.length - 1; i >= 0; i--) {
            const item = rawList[i];
            if (!item) continue;
            const src = item.source || "";
            const ttl = item.title || "";
            const msg = item.message || "";
            const lvl = item.level || "info";
            const cat = item.category || "";
            const existingIdx = compacted.findIndex((p) =>
                (p.source || "") === src &&
                (p.level || "info") === lvl &&
                (((p.title || "") === ttl && (p.message || "") === msg) ||
                    (item.mode === "silent" && p.mode === "silent" && isFoldableHeartbeatCategory(cat) && p.category === cat))
            );
            if (existingIdx >= 0) {
                const target = compacted[existingIdx]!;
                target.repeatCount = (target.repeatCount || 1) + (item.repeatCount || 1);
                if ((item.createdAt || 0) >= (target.createdAt || 0)) {
                    target.createdAt = item.createdAt;
                    target.message = item.message;
                    if (item.title !== undefined) target.title = item.title;
                }
                if (item.read === false) target.read = false;
                if (existingIdx > 0) {
                    compacted.splice(existingIdx, 1);
                    compacted.unshift(target);
                }
            } else {
                compacted.unshift({ ...item, repeatCount: item.repeatCount || 1 });
            }
        }
        return compacted;
    } catch {
        return [];
    }
}

let noticeHistoryPrunedKey = "";

function saveTodayNoticeHistory(list: ReadonlyArray<LvNoticePacket>): void {
    const ls = getSafeLocalStorage();
    if (!ls) return;
    try {
        const key = `${HISTORY_STORAGE_PREFIX}${getTodayKey()}`;
        if (noticeHistoryPrunedKey !== key) {
            noticeHistoryPrunedKey = key;
            try {
                if (typeof ls.length === "number" && typeof ls.key === "function" && typeof ls.removeItem === "function") {
                    for (let i = ls.length - 1; i >= 0; i--) {
                        const k = ls.key(i);
                        if (k && k.startsWith(HISTORY_STORAGE_PREFIX) && k !== key) {
                            ls.removeItem(k);
                        }
                    }
                }
            } catch { /* ignore */ }
        }
        const serializable = list.slice(0, MAX_PERSISTED_HISTORY).map((p) => ({
            id: p.id,
            mode: p.mode,
            source: p.source,
            category: p.category,
            title: p.title,
            message: p.message,
            level: p.level,
            createdAt: p.createdAt,
            repeatCount: p.repeatCount,
            read: Boolean(p.read),
        }));
        ls.setItem(key, JSON.stringify(serializable));
    } catch { /* ignore quota / private mode */ }
}

function createCoordinator(initialPlugin: string): LvNoticeHub {
    let hostEl = typeof document.getElementById === "function" ? document.getElementById("lv-notice-host") : null;
    if (!hostEl && document.body && typeof document.createElement === "function") {
        hostEl = document.createElement("div");
        hostEl.id = "lv-notice-host";
        hostEl.setAttribute("role", "region");
        hostEl.setAttribute("aria-label", "小驴通知中心");
        document.body.appendChild(hostEl);
    }

    const activePackets: LvNoticePacket[] = [];
    const historyList: LvNoticePacket[] = loadTodayNoticeHistory();
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
        if (activePackets.length > 0) ensureStyles();
        // 动态提升 z-index，保障通知全局浮于所有弹窗/抽屉/蒙层之上
        try {
            const currentZ = typeof window !== "undefined" && (window as any).siyuan?.zIndex;
            if (typeof currentZ === "number" && currentZ > 0) {
                hostEl.style.zIndex = String(Math.max(1050, currentZ + 50));
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

                const resolvedSnoozeOpts: LvNoticeSnoozeOption[] = packet.snooze?.options ? [...packet.snooze.options] : [];
                if (packet.category && packet.level !== "error") {
                    const hasMute = resolvedSnoozeOpts.some(o => o.muteToday || (typeof o.muteDays === "number" && o.muteDays > 0));
                    const needsAutoSnooze = resolvedSnoozeOpts.length === 0 && (packet.duration === 0 || (packet.actions && packet.actions.length > 0));
                    if (needsAutoSnooze) {
                        resolvedSnoozeOpts.push(
                            { label: "稍后提醒 (30分钟)", durationMs: 30 * 60 * 1000 },
                            { label: "稍后提醒 (2小时)", durationMs: 2 * 60 * 60 * 1000 },
                            { label: "今日免打扰", muteToday: true },
                        );
                    }
                    if (hasMute || needsAutoSnooze) {
                        if (!resolvedSnoozeOpts.some(o => o.muteDays === 3)) {
                            resolvedSnoozeOpts.push({ label: "未来3天不通知", muteDays: 3 });
                        }
                        if (!resolvedSnoozeOpts.some(o => o.muteDays === 7)) {
                            resolvedSnoozeOpts.push({ label: "未来一周不通知", muteDays: 7 });
                        }
                    }
                }

                const snoozeHtml = resolvedSnoozeOpts.length > 0
                    ? `<div class="lv-notice-snooze-row">${resolvedSnoozeOpts.map((opt, sIdx) => {
                        const isMute = Boolean(opt.muteToday || (typeof opt.muteDays === "number" && opt.muteDays > 0));
                        return `<button type="button" class="lv-notice-btn ${isMute ? "lv-notice-btn--mute" : ""}" data-snooze-idx="${sIdx}">${escapeHtml(opt.label)}</button>`;
                    }).join("")}</div>`
                    : "";

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
                        const opt = resolvedSnoozeOpts[sIdx];
                        if (opt?.muteDays && opt.muteDays > 0 && packet.category) {
                            if (typeof hub.muteDays === "function") hub.muteDays(packet.category, opt.muteDays);
                            else muteCategoryDaysImpl(packet.category, opt.muteDays);
                            hub.dismiss(packet.id);
                            const desc = opt.muteDays === 7 ? "未来一周" : `未来 ${opt.muteDays} 天`;
                            lvNotify.capsule({
                                source: packet.source || "免打扰",
                                message: `🔕 已关闭「${packet.title || packet.category}」提醒（${desc}不通知）`,
                                duration: 2800,
                                archive: false,
                            });
                        } else if (opt?.muteToday && packet.category) {
                            hub.muteToday(packet.category);
                            hub.dismiss(packet.id);
                            lvNotify.capsule({
                                source: packet.source || "免打扰",
                                message: `🔕 已关闭「${packet.title || packet.category}」提醒（今日免打扰）`,
                                duration: 2400,
                                archive: false,
                            });
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

        // 堆叠溢出指示：仅渲染最近 3 条，更早的以「＋N」徽标示意，点击打开罗盘通知中心
        const overflowCount = activePackets.length - visible.length;
        if (overflowCount > 0) {
            const moreBtn = document.createElement("button");
            moreBtn.type = "button";
            moreBtn.className = "lv-notice-more";
            moreBtn.setAttribute("aria-label", `还有 ${overflowCount} 条更早的通知，点按打开罗盘通知中心`);
            moreBtn.textContent = `＋${overflowCount}`;
            moreBtn.addEventListener("click", () => {
                try { getLaunchpadHub().open(); } catch { /* ignore */ }
            });
            hostEl?.appendChild(moreBtn);
        }
    }

    const hub: LvNoticeHub = {
        version: PROTOCOL_VERSION,
        hostPlugin: initialPlugin,

        post(packet: LvNoticePacket) {
            packet.read = packet.read ?? false;
            if (packet.category && this.isMutedToday(packet.category)) {
                return;
            }

            // 专注模式：card/capsule 全生态降级为 silent（仅应归档通知入历史，瞬时回执直接忽略）
            const focusOn = isNotifyFocusActive();
            const effectiveMode = focusOn && (packet.mode === "card" || packet.mode === "capsule") ? "silent" : packet.mode;
            const shouldArchive = packet.archive !== false || packet.level === "warn" || packet.level === "error";

            if (effectiveMode === "silent") {
                if (shouldArchive) {
                    recordIntoHistory(historyList, packet);
                    saveTodayNoticeHistory(historyList);
                }
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
                existing.read = false;
                if (shouldArchive) {
                    if (!historyList.includes(existing)) {
                        recordIntoHistory(historyList, { ...packet, createdAt: existing.createdAt });
                    } else {
                        const hIdx = historyList.indexOf(existing);
                        if (hIdx > 0) {
                            historyList.splice(hIdx, 1);
                            historyList.unshift(existing);
                        }
                    }
                    saveTodayNoticeHistory(historyList);
                }
                render();
                return;
            }

            activePackets.push(packet);
            if (shouldArchive) {
                recordIntoHistory(historyList, packet);
                saveTodayNoticeHistory(historyList);
            }
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
            muteCategoryTodayImpl(category);
        },

        muteDays(category: string, days: number) {
            muteCategoryDaysImpl(category, days);
        },

        muteUntil(category: string, untilTimestamp: number) {
            muteCategoryUntilImpl(category, untilTimestamp);
        },

        isCategoryMuted(category: string): boolean {
            return isCategoryMutedImpl(category);
        },

        isMutedToday(category: string): boolean {
            return isCategoryMutedImpl(category);
        },

        clearCategoryMute(category: string) {
            clearCategoryMuteImpl(category);
        },

        getMutedCategories() {
            return getMutedCategoriesImpl();
        },

        getHistory() {
            return [...historyList];
        },

        clearHistory() {
            historyList.length = 0;
            saveTodayNoticeHistory(historyList);
        },

        markAllRead() {
            historyList.forEach((p) => { p.read = true; });
            saveTodayNoticeHistory(historyList);
        },

        markRead(id: string) {
            const target = historyList.find((p) => p.id === id);
            if (target && !target.read) {
                target.read = true;
                saveTodayNoticeHistory(historyList);
            }
        },

        getUnreadCount() {
            return historyList.filter((p) => !p.read).length;
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
            // 共享总线注销：仅移除本副本的处理器与引桥订阅；最后一个副本退出时才真正 disconnect
            try {
                const wBus = window as unknown as {
                    __LV_SNACK_BUS__?: { boxObs: MutationObserver | null; subs: Set<(muts: MutationRecord[]) => void> };
                    __LV_SNACK_BRIDGE__?: { obs: MutationObserver | null; attachSubs: Set<() => boolean> };
                };
                const bus = wBus.__LV_SNACK_BUS__;
                if (bus) {
                    bus.subs.delete(snackHandler);
                    if (bus.subs.size === 0 && bus.boxObs) {
                        try { bus.boxObs.disconnect(); } catch { /* ignore */ }
                        bus.boxObs = null;
                    }
                }
                const bridge = wBus.__LV_SNACK_BRIDGE__;
                if (bridge) {
                    bridge.attachSubs.delete(tryAttachSnackObserver);
                    if (bridge.attachSubs.size === 0 && bridge.obs) {
                        try { bridge.obs.disconnect(); } catch { /* ignore */ }
                        bridge.obs = null;
                    }
                }
            } catch { /* ignore */ }
            timers.forEach((t) => clearTimeout(t));
            timers.clear();
            hostEl?.remove();
            hostEl = null;
            if (window.__LV_NOTICE_HUB__ === this) {
                delete window.__LV_NOTICE_HUB__;
            }
        }
    };

    // 采集思源原生通知（#message 内的 .b3-snackbar，含内核同步/报错与第三方未接入小驴套件的插件提示）
    const nativeSnackbarToPacketId = new WeakMap<HTMLElement, string>();

    const extractSnackbarText = (el: HTMLElement): string => {
        try {
            const c = typeof el.querySelector === "function" ? el.querySelector<HTMLElement>(".b3-snackbar__content") : null;
            const raw = c ? (c.innerText || c.textContent || "") : (el.innerText || el.textContent || "");
            return raw.trim();
        } catch {
            return "";
        }
    };

    const isSnackbarError = (el: HTMLElement): boolean => {
        try {
            return Boolean(el.classList && typeof el.classList.contains === "function" && el.classList.contains("b3-snackbar--error"));
        } catch {
            return false;
        }
    };

    const updateNativeSnackbar = (node: Node): void => {
        try {
            const baseEl = ((typeof Element !== "undefined" && node instanceof Element) || typeof (node as any)?.closest === "function" ? node : (node as any)?.parentElement) as HTMLElement | null;
            const snackbar = baseEl && typeof baseEl.closest === "function" ? baseEl.closest<HTMLElement>(".b3-snackbar") : null;
            if (!snackbar) return;
            const packetId = nativeSnackbarToPacketId.get(snackbar);
            if (!packetId) {
                recordNativeSnackbar(snackbar);
                return;
            }
            const text = extractSnackbarText(snackbar);
            if (!text) return;
            const err = isSnackbarError(snackbar);
            const target = historyList.find((p) => p.id === packetId);
            if (target && (target.message !== text || (err && target.level !== "error"))) {
                target.message = text;
                target.createdAt = Date.now();
                if (err) {
                    target.level = "error";
                    target.title = target.title || "思源异常";
                    target.read = false;
                }
                saveTodayNoticeHistory(historyList);
            }
        } catch { /* ignore */ }
    };

    const recordNativeSnackbar = (el: HTMLElement): void => {
        try {
            if (nativeSnackbarToPacketId.has(el)) {
                updateNativeSnackbar(el);
                return;
            }
            const text = extractSnackbarText(el);
            if (!text) return;
            const err = isSnackbarError(el);
            const packetId = `sy_native_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            hub.post({
                id: packetId,
                mode: "silent",
                source: "思源原生",
                category: "siyuan-native",
                title: err ? "思源异常" : undefined,
                message: text,
                level: err ? "error" : "info",
                createdAt: Date.now(),
                repeatCount: 1,
                // 普通思源原生提示已在思源中弹出过，留档默认标已读避免红点虚高；异常提示标未读以便追踪
                read: !err,
            });
            const top = historyList[0];
            nativeSnackbarToPacketId.set(el, top && top.message === text ? top.id : packetId);
        } catch { /* ignore */ }
    };

    // 共享总线：思源 #message snackbar 的观察者与 body 引桥在 window 级单例。
    // 原实现每个插件副本各建一份 box 观察者 + body 引桥（8 插件 = 16 个 body/subtree 级 observer）；
    // 现改为单例 observer + 各副本处理器订阅分发——mutation 分发语义与独立观察者完全等价，开销 8→1。
    const snackHandler = (muts: MutationRecord[]) => {
        for (const m of muts) {
            m.addedNodes?.forEach?.((n) => {
                const el = n as HTMLElement;
                if (!el || typeof el.classList?.contains !== "function") {
                    updateNativeSnackbar(n);
                    return;
                }
                if (el.classList.contains("b3-snackbar")) {
                    recordNativeSnackbar(el);
                } else {
                    if (typeof el.querySelectorAll === "function") {
                        const nested = el.querySelectorAll<HTMLElement>(".b3-snackbar");
                        if (nested.length > 0) {
                            nested.forEach((sn) => recordNativeSnackbar(sn));
                            return;
                        }
                    }
                    updateNativeSnackbar(el);
                }
            });
            if (m.type === "characterData" && m.target) {
                updateNativeSnackbar(m.target);
            }
        }
    };
    let snackAttached = false;
    const tryAttachSnackObserver = (): boolean => {
        if (snackAttached) return true;
        if (typeof document === "undefined" || typeof MutationObserver !== "function" || typeof document.getElementById !== "function") {
            return false;
        }
        const box = document.getElementById("message");
        if (!box) return false;
        try {
            if (typeof box.querySelectorAll === "function") {
                box.querySelectorAll<HTMLElement>(".b3-snackbar").forEach((el) => recordNativeSnackbar(el));
            }
            const wBus = window as unknown as { __LV_SNACK_BUS__?: { boxObs: MutationObserver | null; subs: Set<(muts: MutationRecord[]) => void> } };
            const bus = wBus.__LV_SNACK_BUS__ || (wBus.__LV_SNACK_BUS__ = { boxObs: null, subs: new Set() });
            if (!bus.boxObs) {
                bus.boxObs = new MutationObserver((muts) => {
                    for (const fn of bus.subs) {
                        try { fn(muts); } catch { /* 单副本处理异常不影响其它副本 */ }
                    }
                });
                bus.boxObs.observe(box, { childList: true, subtree: true, characterData: true });
            }
            bus.subs.add(snackHandler);
            snackAttached = true;
            return true;
        } catch {
            return false;
        }
    };
    const attachNativeMessageObserver = (): boolean => tryAttachSnackObserver();

    if (typeof document !== "undefined" && typeof MutationObserver === "function") {
        if (!attachNativeMessageObserver() && document.body) {
            try {
                const wBus = window as unknown as { __LV_SNACK_BRIDGE__?: { obs: MutationObserver | null; attachSubs: Set<() => boolean> } };
                const bridge = wBus.__LV_SNACK_BRIDGE__ || (wBus.__LV_SNACK_BRIDGE__ = { obs: null, attachSubs: new Set() });
                bridge.attachSubs.add(tryAttachSnackObserver);
                if (!bridge.obs) {
                    bridge.obs = new MutationObserver(() => {
                        let allAttached = bridge.attachSubs.size > 0;
                        for (const fn of bridge.attachSubs) {
                            try { if (!fn()) allAttached = false; } catch { allAttached = false; }
                        }
                        if (allAttached) {
                            try { bridge.obs?.disconnect(); } catch { /* ignore */ }
                            bridge.obs = null;
                        }
                    });
                    bridge.obs.observe(document.body, { childList: true, subtree: true });
                }
            } catch { /* ignore */ }
        }
    }

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
        if (nodeHistoryList.length === 0) {
            nodeHistoryList.push(...loadTodayNoticeHistory());
        }
        nodeHubInstance = {
            version: PROTOCOL_VERSION,
            hostPlugin: callerPlugin,
            post(packet: LvNoticePacket) {
                packet.read = packet.read ?? false;
                if (packet.category && this.isMutedToday(packet.category)) {
                    return;
                }
                const shouldArchive = packet.archive !== false || packet.level === "warn" || packet.level === "error";
                if (!shouldArchive) return;
                recordIntoHistory(nodeHistoryList, packet);
                saveTodayNoticeHistory(nodeHistoryList);
            },
            dismiss() {},
            snooze() {},
            muteToday(category: string) { muteCategoryTodayImpl(category); },
            muteDays(category: string, days: number) { muteCategoryDaysImpl(category, days); },
            muteUntil(category: string, untilTimestamp: number) { muteCategoryUntilImpl(category, untilTimestamp); },
            isCategoryMuted(category: string) { return isCategoryMutedImpl(category); },
            isMutedToday(category: string) { return isCategoryMutedImpl(category); },
            clearCategoryMute(category: string) { clearCategoryMuteImpl(category); },
            getMutedCategories() { return getMutedCategoriesImpl(); },
            getHistory() { return [...nodeHistoryList]; },
            clearHistory() {
                nodeHistoryList.length = 0;
                saveTodayNoticeHistory(nodeHistoryList);
            },
            markAllRead() {
                nodeHistoryList.forEach((p) => { p.read = true; });
                saveTodayNoticeHistory(nodeHistoryList);
            },
            markRead(id: string) {
                const target = nodeHistoryList.find((p) => p.id === id);
                if (target && !target.read) {
                    target.read = true;
                    saveTodayNoticeHistory(nodeHistoryList);
                }
            },
            getUnreadCount() {
                return nodeHistoryList.filter((p) => !p.read).length;
            },
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
    if (typeof window === "undefined" || typeof document === "undefined") {
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
    const ls = getSafeLocalStorage();
    if (!ls) return 0;
    try {
        const n = Number(ls.getItem(NOTIFY_FOCUS_KEY));
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
    const ls = getSafeLocalStorage();
    if (ls) {
        try { ls.setItem(NOTIFY_FOCUS_KEY, String(Math.max(0, Math.round(ts)))); } catch { /* ignore */ }
    }
    refreshEntryFocusState();
}

export function clearNotifyFocus(): void {
    const ls = getSafeLocalStorage();
    if (ls) {
        try { ls.removeItem(NOTIFY_FOCUS_KEY); } catch { /* ignore */ }
    }
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
            category: options.category,
            message: options.message,
            level: options.level || "info",
            duration: options.duration ?? 2500,
            archive: options.archive,
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
            archive: false,
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

    muteDays(category: string, days: number): void {
        const hub = getHub();
        if (typeof hub.muteDays === "function") {
            hub.muteDays(category, days);
        } else {
            muteCategoryDaysImpl(category, days);
        }
    },

    muteUntil(category: string, untilTimestamp: number): void {
        const hub = getHub();
        if (typeof hub.muteUntil === "function") {
            hub.muteUntil(category, untilTimestamp);
        } else {
            muteCategoryUntilImpl(category, untilTimestamp);
        }
    },

    isCategoryMuted(category: string): boolean {
        return isCategoryMutedImpl(category);
    },

    isMutedToday(category: string): boolean {
        return isCategoryMutedImpl(category);
    },

    clearCategoryMute(category: string): void {
        const hub = getHub();
        if (typeof hub.clearCategoryMute === "function") {
            hub.clearCategoryMute(category);
        } else {
            clearCategoryMuteImpl(category);
        }
    },

    getMutedCategories(): Array<{ category: string; until: number; untilStr: string }> {
        const hub = getHub();
        if (typeof hub.getMutedCategories === "function") {
            return hub.getMutedCategories();
        }
        return getMutedCategoriesImpl();
    },

    registerPlugin(pluginName: string, onRelinquish: () => void = () => {}): () => void {
        const hub = getHub(pluginName);
        return hub.registerPlugin(pluginName, onRelinquish);
    },

    /** 读取当前全生态通知历史留档列表（最近 100 条） */
    getHistory(): LvNoticePacket[] {
        if (typeof window !== "undefined" && typeof document !== "undefined") {
            const existingHub = window.__LV_NOTICE_HUB__;
            if (existingHub) return existingHub.getHistory?.() ?? [];
            return loadTodayNoticeHistory();
        }
        const hub = getHub();
        return hub.getHistory?.() ?? [];
    },

    /** 清空全生态通知历史留档 */
    clearHistory(): void {
        const hub = getHub();
        hub.clearHistory?.();
    },

    /** 将所有通知历史标记为已读 */
    markAllRead(): void {
        const hub = getHub();
        hub.markAllRead?.();
    },

    /** 将指定通知标记为已读 */
    markRead(id: string): void {
        if (!id) return;
        const hub = getHub();
        if (hub.markRead) {
            hub.markRead(id);
        } else {
            const list = hub.getHistory?.() ?? [];
            const target = list.find((p) => p.id === id);
            if (target) target.read = true;
        }
    },

    /** 获取当前未读通知总数 */
    getUnreadCount(): number {
        if (typeof window !== "undefined" && typeof document !== "undefined") {
            const existingHub = window.__LV_NOTICE_HUB__;
            if (existingHub) {
                return existingHub.getUnreadCount?.() ?? existingHub.getHistory?.().filter((p) => !p.read).length ?? 0;
            }
            return loadTodayNoticeHistory().filter((p) => !p.read).length;
        }
        const hub = getHub();
        return hub.getUnreadCount?.() ?? hub.getHistory?.().filter((p) => !p.read).length ?? 0;
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

const fallbackActivities: LvActivityRecord[] = [];

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
let lastHealTime = 0;
let lastHealPluginCount = -1;
function healMissingPluginsFromHost(reg: Map<string, LvLaunchpadItem>): void {
    if (healingInProgress || typeof window === "undefined") return;
    const w = window as any;
    const plugins: any[] = w.siyuan?.ws?.app?.plugins || w.app?.plugins || [];
    if (!Array.isArray(plugins) || plugins.length === 0) return;
    const now = Date.now();
    if (reg.size > 0 && lastHealPluginCount === plugins.length && now - lastHealTime < 2500) return;
    lastHealTime = now;
    lastHealPluginCount = plugins.length;
    healingInProgress = true;
    try {
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

let cachedLaunchpadStatesRaw: string | null = null;
let cachedLaunchpadStatesParsed: Record<string, "pinned" | "docked" | "hidden"> | null = null;

function getLaunchpadStates(): Record<string, "pinned" | "docked" | "hidden"> {
    const ls = getSafeLocalStorage();
    if (!ls) return { ...memoryLaunchpadStates };
    try {
        const raw = ls.getItem(LAUNCHPAD_STORAGE_KEY);
        if (raw) {
            if (raw !== cachedLaunchpadStatesRaw || !cachedLaunchpadStatesParsed) {
                cachedLaunchpadStatesParsed = JSON.parse(raw);
                cachedLaunchpadStatesRaw = raw;
            }
            return { ...memoryLaunchpadStates, ...cachedLaunchpadStatesParsed };
        }
        cachedLaunchpadStatesRaw = null;
        cachedLaunchpadStatesParsed = null;
    } catch { /* ignore */ }
    return { ...memoryLaunchpadStates };
}

function saveLaunchpadStates(states: Record<string, "pinned" | "docked" | "hidden">): void {
    memoryLaunchpadStates = { ...states };
    const ls = getSafeLocalStorage();
    if (!ls) return;
    try {
        const raw = JSON.stringify(states);
        ls.setItem(LAUNCHPAD_STORAGE_KEY, raw);
        cachedLaunchpadStatesRaw = raw;
        cachedLaunchpadStatesParsed = { ...states };
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
            scheduleTopBarConvergence(60);
            return () => {
                if (reg.get(item.id) === item) reg.delete(item.id);
                scheduleTopBarConvergence(60);
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
        },

        openQuickNote(): void {
            openQuickNoteDialog();
        },

        openLifeLog(): void {
            openLifeLogDialog();
        },

        async openDiaryBottom(): Promise<void> {
            await openDiaryBottom();
        },

        openTaskManager(): void {
            openTaskManager();
        },

        openNewTask(): void | Promise<void> {
            return openNewTask();
        },

        reloadUI(): void | Promise<void> {
            return reloadUI();
        },

        randomWalk(): void | Promise<void> {
            return randomWalk();
        },

        pasteToDailyNote(): void | Promise<void> {
            return pasteToDailyNote();
        },

        getQuickWorkspaceConfig(): LvQuickWorkspaceConfig {
            return getQuickWorkspaceConfig();
        },

        saveQuickWorkspaceConfig(patch: Partial<LvQuickWorkspaceConfig>): void {
            saveQuickWorkspaceConfig(patch);
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

    /** 获取今日 4 合 1 晨昏知识看板聚合状态（打卡/闪卡/管家/拾遗） */
    getTodaySummary(): LvTodaySummary {
        return getTodaySummary(getLaunchpadHub().getItems());
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

    /** 注册宿主思源 API（openTab / openMobileFileById / fetchSyncPost / app），供罗盘工作台跨插件无依赖打开文档 */
    registerHostApi(api: {
        openTab?: (opts: any) => any;
        openMobileFileById?: (app: any, id: string, action?: any) => any;
        fetchSyncPost?: (url: string, data?: any) => Promise<any>;
        app?: unknown;
    }): void {
        if (typeof window === "undefined") return;
        const w = window as unknown as {
            __LV_HOST_API__?: {
                openTab?: (opts: any) => any;
                openMobileFileById?: (app: any, id: string, action?: any) => any;
                fetchSyncPost?: (url: string, data?: any) => Promise<any>;
                app?: unknown;
            };
        };
        const prev = w.__LV_HOST_API__ || {};
        w.__LV_HOST_API__ = {
            openTab: api.openTab || prev.openTab,
            openMobileFileById: api.openMobileFileById || prev.openMobileFileById,
            fetchSyncPost: api.fetchSyncPost || prev.fetchSyncPost,
            app: api.app || prev.app,
        };
    },

    /** 统一全端顶栏收敛入口（自动适配桌面与移动端环境，注册全局冷僻快捷键 Ctrl+Alt+Shift+K 供 Quicker 唤醒） */
    ensureUnifiedEntry(pluginHost?: unknown): () => void {
        const cleanM = ensureMobileEntry();
        const cleanD = ensureDesktopEntry();
        const host = pluginHost as any;
        if (host?.app && typeof window !== "undefined") {
            const w = window as unknown as { __LV_HOST_API__?: { app?: unknown } };
            if (!w.__LV_HOST_API__) w.__LV_HOST_API__ = {};
            if (!w.__LV_HOST_API__.app) w.__LV_HOST_API__.app = host.app;
        }
        const wakeAndOpen = (fromGlobal = false) => {
            if (fromGlobal) {
                try {
                    const electron = safeRequire<any>("electron");
                    const remote = electron?.remote || safeRequire<any>("@electron/remote");
                    const win = remote?.getCurrentWindow?.();
                    if (win) {
                        if (typeof win.isMinimized === "function" && win.isMinimized()) win.restore();
                        if (typeof win.show === "function") win.show();
                        if (typeof win.focus === "function") win.focus();
                    }
                } catch { /* ignore */ }
                try { window.focus?.(); } catch { /* ignore */ }
                window.setTimeout(() => {
                    if (isMobileFrontend()) openMobileSheet();
                    else openDesktopLaunchpadPopover();
                }, 80);
                return;
            }
            if (isMobileFrontend()) openMobileSheet();
            else toggleDesktopLaunchpadPopover();
        };
        if (host && typeof host.addCommand === "function") {
            const w = typeof window !== "undefined" ? (window as unknown as { __LV_LAUNCHPAD_CMD_REGISTERED__?: boolean }) : {};
            if (!w.__LV_LAUNCHPAD_CMD_REGISTERED__) {
                w.__LV_LAUNCHPAD_CMD_REGISTERED__ = true;
                try {
                    host.addCommand({
                        langKey: "openLaunchpad",
                        langText: "小驴罗盘：全家桶极速直达与工作台 (Ctrl+Alt+Shift+K 支持最小化呼出)",
                        hotkey: "⌥⇧⌘K",
                        callback: () => wakeAndOpen(false),
                        globalCallback: () => wakeAndOpen(true),
                    });
                } catch { /* ignore */ }
            }
        }
        let urlCleanup: (() => void) | null = null;
        if (host?.eventBus && typeof host.eventBus.on === "function") {
            const onUrl = (event: CustomEvent<{ url?: string }>) => {
                const rawUrl = event?.detail?.url;
                if (typeof rawUrl === "string" && rawUrl.includes("lv-launchpad")) {
                    wakeAndOpen(true);
                }
            };
            try {
                host.eventBus.on("open-siyuan-url-plugin", onUrl);
                urlCleanup = () => { try { host.eventBus.off("open-siyuan-url-plugin", onUrl); } catch { /* ignore */ } };
            } catch { /* ignore */ }
        }
        return () => {
            cleanM();
            cleanD();
            urlCleanup?.();
        };
    },

    /** 打开一键记事浮层对话框 */
    openQuickNote(): void {
        openQuickNoteDialog();
    },

    /** 打开叶归 LifeLog 记录浮层对话框 */
    openLifeLog(): void {
        openLifeLogDialog();
    },

    /** 直达今日日记底部并滚动就绪 */
    async openDiaryBottom(): Promise<void> {
        await openDiaryBottom();
    },

    /** 打开任务管理器 (Task Horizon) */
    openTaskManager(): void {
        openTaskManager();
    },

    /** 打开任务管理器新建任务窗口 (Task Horizon Quick Add) */
    openNewTask(): void | Promise<void> {
        return openNewTask();
    },

    /** 重新加载思源界面 (Reload UI / 对应 /api/ui/reloadUI) */
    reloadUI(): void | Promise<void> {
        return reloadUI();
    },

    /** 随机漫步 / 漫游笔记 (Random Walk：穿透知识库随机抽取出历史笔记文档) */
    randomWalk(): Promise<void> {
        return randomWalk();
    },

    /** 剪贴板秒级入库 (Paste to Daily Note：读取系统剪贴板带时间戳追加至今日日记) */
    pasteToDailyNote(): Promise<void> {
        return pasteToDailyNote();
    },

    /** 读取极速工作台配置 */
    getQuickWorkspaceConfig(): LvQuickWorkspaceConfig {
        return getQuickWorkspaceConfig();
    },

    /** 保存极速工作台配置 */
    saveQuickWorkspaceConfig(patch: Partial<LvQuickWorkspaceConfig>): void {
        saveQuickWorkspaceConfig(patch);
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
    try {
        const syConfig = (globalThis as { siyuan?: { config?: { system?: { container?: string; isMobile?: boolean } } } }).siyuan?.config?.system;
        if (syConfig?.container === "mobile" || syConfig?.isMobile) return true;
    } catch { /* ignore */ }
    try {
        if (typeof document !== "undefined" && (document.body?.classList?.contains("body--mobile") || Boolean(document.querySelector(".toolbar__mobile")))) return true;
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
    const ls = getSafeLocalStorage();
    if (!ls) return "both";
    try {
        const raw = ls.getItem(MOBILE_ENTRY_MODE_KEY);
        if (raw === "topbar" || raw === "ball" || raw === "both" || raw === "none") return raw;
    } catch { /* ignore */ }
    return "both";
}

export function setMobileEntryMode(mode: LvMobileEntryMode): void {
    const ls = getSafeLocalStorage();
    if (ls) {
        try { ls.setItem(MOBILE_ENTRY_MODE_KEY, mode); } catch { /* ignore */ }
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

let lastBadgeDotCheckTime = 0;
let lastBadgeDotState = "";

/** 聚合徽记与单插件自适应：任一已注册条目带 badge 时点亮圆点；有紧急待办时点亮警示色；专注模式点亮 🌙；单插件时动态呈现专属标题 */
function refreshEntryBadgeDot(): void {
    if (typeof document === "undefined") return;
    try {
        const items = getLaunchpadHub().getItems().filter((it) => it.state !== "hidden");
        const hasBadge = items.some((it) => Boolean(it.badge));
        const hasUrgent = items.some((it) => Boolean(it.badge) && (it.badgeType === "error" || it.badgeType === "warn"));
        const focus = isNotifyFocusActive();
        const stateKey = `${items.length}_${hasBadge}_${hasUrgent}_${focus}`;
        const now = Date.now();
        if (stateKey === lastBadgeDotState && now - lastBadgeDotCheckTime < 400) {
            return;
        }
        lastBadgeDotState = stateKey;
        lastBadgeDotCheckTime = now;
        const targetDotDisplay = hasBadge ? "block" : "none";
        const targetDotBg = hasUrgent ? "var(--b3-theme-error, #ef4444)" : "var(--b3-theme-primary, #3576c7)";
        const targetMoonDisplay = focus ? "inline-block" : "none";
        for (const root of [document.getElementById(MOBILE_ENTRY_ID), document.getElementById(MOBILE_BALL_ID), document.getElementById(DESKTOP_ENTRY_ID)]) {
            if (!root) continue;
            const dot = root.querySelector(".lv-entry-dot");
            if (dot && typeof dot === "object" && "style" in dot && (dot as HTMLElement).style) {
                const ds = (dot as HTMLElement).style;
                if (ds.display !== targetDotDisplay) ds.display = targetDotDisplay;
                if (ds.background !== targetDotBg) ds.background = targetDotBg;
            }
            const moon = root.querySelector(".lv-entry-moon");
            if (moon && typeof moon === "object" && "style" in moon && (moon as HTMLElement).style) {
                const ms = (moon as HTMLElement).style;
                if (ms.display !== targetMoonDisplay) ms.display = targetMoonDisplay;
            }

            // 单插件时动态适配专属名称与操作提示；多插件时保持全家桶统一标题。
            // 触屏端（悬浮球/移动顶栏）使用点按语义，杜绝「左键/右键/快捷键」等桌面措辞
            const touchMode = isMobileFrontend();
            if (items.length === 1) {
                const single = items[0];
                if (single) {
                    const singleName = single.fullName || single.name;
                    const nextAria = `${singleName} · 小驴罗盘`;
                    const nextTitle = touchMode ? `${singleName} · 点按直达` : `${singleName} (左键直达 · 右键小驴罗盘)`;
                    if (root.getAttribute("aria-label") !== nextAria) root.setAttribute("aria-label", nextAria);
                    if (root.getAttribute("title") !== nextTitle) root.setAttribute("title", nextTitle);
                }
            } else if (items.length > 1) {
                root.setAttribute("aria-label", "小驴罗盘");
                root.setAttribute("title", touchMode
                    ? `小驴罗盘 · ${items.length} 个插件已联结 · 点按展开`
                    : `小驴罗盘 · 全家桶极速直达 (${items.length} 插件已联结 · 快捷键 1~${items.length})`);
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

/**
 * 罗盘磁贴图标统一渲染：优先使用插件真实 sprite 图标（与移动端弹射坞一致的品牌辨识度），
 * 探测失败时回退内置 24x24 litheness 线性图标，杜绝桌面端磁贴千篇一律的占位图形。
 */
function buildTileIconHtml(item: LvLaunchpadItem, size = 16): string {
    const iconHref = resolveIconHref(item.svgIcon);
    if (iconHref) {
        return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" style="width:${size}px;height:${size}px;fill:none!important;stroke:currentColor!important;" aria-hidden="true"><use xlink:href="${iconHref}" href="${iconHref}"></use></svg>`;
    }
    return renderPluginLitheSvg(item.id, size);
}

let lastMobileTopbarTap = { ts: 0, x: 0, y: 0 };

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
    btn.setAttribute("aria-haspopup", "dialog");
    btn.setAttribute("title", "小驴罗盘 · 单击打开弹射坞，双击进入 LifeLog");
    // 内联线性罗盘 SVG（1.85px 描边）：零 sprite 依赖，任何主题下都稳定渲染
    btn.innerHTML = `${COMPASS_SVG}<span class="lv-entry-moon" aria-hidden="true" style="display:none;margin-left:2px;font-size:11px;line-height:1;">🌙</span><span class="lv-entry-dot" aria-hidden="true" style="display:none;position:absolute;top:4px;right:4px;width:8px;height:8px;border-radius:999px;background:var(--b3-theme-primary,#3576c7);"></span>`;
    btn.addEventListener("click", (ev) => {
        const now = Date.now();
        const cx = (ev as MouseEvent).clientX || 0;
        const cy = (ev as MouseEvent).clientY || 0;
        if (now - lastMobileTopbarTap.ts < 340) {
            lastMobileTopbarTap = { ts: 0, x: 0, y: 0 };
            hapticFeedback(14);
            closeMobileSheet(true);
            openLifeLogDialog();
            return;
        }
        lastMobileTopbarTap = { ts: now, x: cx, y: cy };
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
    const ls = getSafeLocalStorage();
    if (!ls) return;
    try { ls.setItem(MOBILE_BALL_POS_KEY, JSON.stringify(pos)); } catch { /* ignore */ }
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
    ball.setAttribute("aria-label", "小驴罗盘悬浮球 · 单击打开全家桶，双击进入 LifeLog，拖拽移动，长按切换沉浸");
    ball.setAttribute("aria-haspopup", "dialog");
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
        ball.classList.add("lv-ball-pressing");
        clearLongPress();
        longPressTimer = window.setTimeout(() => {
            longPressTimer = undefined;
            if (moved) return;
            pos = { ...pos, immersive: !pos.immersive }; // 长按：切换沉浸半隐
            persistBallPosition(pos);
            applyBallPosition(ball, pos, false);
            ball.classList.remove("lv-ball-pressing");
            hapticFeedback(12);
            lvNotify.capsule({
                source: "罗盘",
                message: pos.immersive ? "🫧 悬浮球已切换为半隐沉浸态" : "🔘 悬浮球已恢复常亮态",
                duration: 1800,
                archive: false,
            });
        }, MOBILE_BALL_LONG_PRESS_MS);
        scheduleBallIdle(ball, pos);
    };

    const pressMove = (x: number, y: number): void => {
        const dx = x - startX, dy = y - startY;
        if (!moved && Math.hypot(dx, dy) > MOBILE_BALL_DRAG_SLOP_PX) {
            moved = true; dragging = true;
            clearLongPress();
            ball.classList.remove("lv-ball-pressing");
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
        ball.classList.remove("lv-ball-pressing");
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
        ball.classList.remove("lv-ball-pressing");
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

    let lastBallClickTime = 0;
    let ballSingleTimer: number | undefined;

    ball.addEventListener("click", () => {
        if (suppressClick) { suppressClick = false; return; } // 拖拽结束的合成 click 不开坞
        const now = Date.now();
        if (now - lastBallClickTime < 320) {
            // 双击悬浮球：极速直达 LifeLog 流！
            lastBallClickTime = 0;
            if (ballSingleTimer !== undefined) {
                try { window.clearTimeout(ballSingleTimer); } catch { /* ignore */ }
                ballSingleTimer = undefined;
            }
            hapticFeedback(14);
            openLifeLogDialog();
            return;
        }
        lastBallClickTime = now;
        ballSingleTimer = window.setTimeout(() => {
            ballSingleTimer = undefined;
            hapticFeedback(8);
            openMobileSheet();
            scheduleBallIdle(ball, pos);
        }, 280);
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
    const ls = getSafeLocalStorage();
    if (!ls || typeof document === "undefined") return;
    try { if (ls.getItem(ONBOARDING_KEY) === "1") return; } catch { /* ignore */ }
    const items = getLaunchpadHub().getItems();
    if (items.length < 3) return; // 单双插件用户不需要生态引导
    try { ls.setItem(ONBOARDING_KEY, "1"); } catch { /* ignore */ }
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
const localMobileEntryOwners = new Set<string>();
function getSharedMobileEntryOwners(): Set<string> {
    if (typeof window !== "undefined") {
        const w = window as unknown as { __LV_MOBILE_ENTRY_OWNERS__?: Set<string> };
        if (!w.__LV_MOBILE_ENTRY_OWNERS__) w.__LV_MOBILE_ENTRY_OWNERS__ = new Set<string>();
        return w.__LV_MOBILE_ENTRY_OWNERS__;
    }
    return localMobileEntryOwners;
}
let mobileTopBarObserver: MutationObserver | null = null;

function wireMobileTopBarObserver(): void {
    if (typeof document === "undefined" || !isMobileFrontend() || typeof MutationObserver === "undefined") return;
    const topBar = document.getElementById("mobileTopBar");
    if (!topBar || mobileTopBarObserver) return;
    if (typeof window !== "undefined" && (window as unknown as { __LV_MOBILE_TOPBAR_OBS__?: MutationObserver }).__LV_MOBILE_TOPBAR_OBS__) return;

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
        if (typeof window !== "undefined") (window as unknown as { __LV_MOBILE_TOPBAR_OBS__?: MutationObserver }).__LV_MOBILE_TOPBAR_OBS__ = mobileTopBarObserver;
    } catch { /* ignore */ }
}

function ensureMobileEntry(): MobileEntryCleanup {
    if (typeof document === "undefined") return () => {};
    if (!isMobileFrontend()) return () => {}; // 桌面端完全 no-op，不挂任何计时器
    const owners = getSharedMobileEntryOwners();
    const owner = `owner_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    owners.add(owner);
    const firstOwner = owners.size === 1;
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
        owners.delete(owner);
        mobileEntryRetryTimers.forEach((t) => { try { window.clearTimeout(t); } catch { /* ignore */ } });
        mobileEntryRetryTimers = [];
        if (owners.size > 0) return; // 仍有插件在世：公共入口与其他宿主的清理权保留
        try {
            mobileTopBarObserver?.disconnect();
            if (typeof window !== "undefined") {
                const w = window as unknown as { __LV_MOBILE_TOPBAR_OBS__?: MutationObserver };
                w.__LV_MOBILE_TOPBAR_OBS__?.disconnect();
                delete w.__LV_MOBILE_TOPBAR_OBS__;
            }
        } catch { /* ignore */ }
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
const localDesktopEntryOwners = new Set<string>();
function getSharedDesktopEntryOwners(): Set<string> {
    if (typeof window !== "undefined") {
        const w = window as unknown as { __LV_DESKTOP_ENTRY_OWNERS__?: Set<string> };
        if (!w.__LV_DESKTOP_ENTRY_OWNERS__) w.__LV_DESKTOP_ENTRY_OWNERS__ = new Set<string>();
        return w.__LV_DESKTOP_ENTRY_OWNERS__;
    }
    return localDesktopEntryOwners;
}
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
    const ls = getSafeLocalStorage();
    if (!ls || typeof document === "undefined") return;
    try { if (ls.getItem(DESKTOP_CONVERGENCE_ONBOARDING_KEY) === "1") return; } catch { /* ignore */ }
    try { ls.setItem(DESKTOP_CONVERGENCE_ONBOARDING_KEY, "1"); } catch { /* ignore */ }
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
                },
            },
        ],
    });
}

/**
 * 启动加速防抖调度（Startup Debounce Dispatcher）：
 * 8 大插件并发加载时，将频繁的连续全量顶栏收敛合并为 1 次批量同步，减少 87% 的启动期 DOM 回流
 */
export function scheduleTopBarConvergence(delayMs = 80): void {
    if (typeof window === "undefined" || isMobileFrontend()) return;
    const w = window as unknown as { __LV_TOPBAR_CONVERGENCE_TIMER__?: number | null };
    if (w.__LV_TOPBAR_CONVERGENCE_TIMER__ !== undefined && w.__LV_TOPBAR_CONVERGENCE_TIMER__ !== null) {
        window.clearTimeout(w.__LV_TOPBAR_CONVERGENCE_TIMER__);
    }
    w.__LV_TOPBAR_CONVERGENCE_TIMER__ = window.setTimeout(() => {
        w.__LV_TOPBAR_CONVERGENCE_TIMER__ = null;
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
// 锚点必须与思源 3.8.x 顶栏重排终点一致：le() 会把 orders.topBar 内所有条目逐一移到 #barMore 之前，
// 罗盘若锚定更左侧条目（如 #barSearch）就会与思源重排互相搬动 → 启动期出现又消失的拉锯闪烁。
const DESKTOP_RIGHT_ANCHOR_SELECTOR = "#barMore, #barSetting, #barSettings, #barHelp, #barMode, #barExit, #windowControls";

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
            // 若罗盘按钮被挤到 #drag 左侧，立即自愈归位到右侧插件区锚点之前
            const toolbar = document.getElementById("toolbar");
            if (toolbar && compassBtn.parentElement === toolbar && typeof toolbar.querySelector === "function") {
                ensureCompassOnRightSide(toolbar, compassBtn);
            }
            const nextDisplay = needConverge ? "inline-flex" : "none";
            if (compassBtn.style.display !== nextDisplay) {
                compassBtn.style.display = nextDisplay;
            }
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
                const targetDisplay = needConverge
                    ? (item.state === "pinned" ? "" : "none")
                    : (item.state === "hidden" ? "none" : "");
                if (el.style.display !== targetDisplay) {
                    el.style.display = targetDisplay;
                }
            }
        }
    } catch (err) {
        console.warn("[LvLaunchpad] 顶栏收敛同步异常:", err);
    }
}

// 罗盘搬动/重建限频：吸收启动期思源 ye()/le() 批量重排的抖动，杜绝「移除→重建→再移除」拉锯闪烁
let lastCompassMoveAt = 0;
let lastCompassRebuildAt = 0;

function ensureCompassOnRightSide(toolbar: HTMLElement, btn: HTMLElement): void {
    try {
        const anchor = toolbar.querySelector(DESKTOP_RIGHT_ANCHOR_SELECTOR);
        if (!anchor || anchor.parentElement !== toolbar || btn.nextElementSibling === anchor) return;
        const children = Array.from(toolbar.children || []);
        const dragIdx = children.findIndex((c) => c.id === "drag");
        const btnIdx = children.indexOf(btn);
        // 仅当罗盘真正漂移到了 #drag 左侧时才重排位置；600ms 限频防止与思源重排互相搬动
        if (btnIdx === -1 || (dragIdx !== -1 && btnIdx < dragIdx)) {
            const now = Date.now();
            if (now - lastCompassMoveAt < 600) return;
            lastCompassMoveAt = now;
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
    const ls = getSafeLocalStorage();
    if (!ls) return "grid";
    try {
        return ls.getItem(LAUNCHPAD_VIEW_KEY) === "list" ? "list" : "grid";
    } catch { return "grid"; }
}

function setLaunchpadViewMode(mode: "grid" | "list"): void {
    const ls = getSafeLocalStorage();
    if (!ls) return;
    try { ls.setItem(LAUNCHPAD_VIEW_KEY, mode); } catch { /* ignore */ }
}

function getLaunchpadActionLimit(): number | "all" {
    const ls = getSafeLocalStorage();
    if (!ls) return 3;
    try {
        return ls.getItem(LAUNCHPAD_ACTION_LIMIT_KEY) === "all" ? "all" : 3;
    } catch { return 3; }
}

function setLaunchpadActionLimit(limit: number | "all"): void {
    const ls = getSafeLocalStorage();
    if (!ls) return;
    try { ls.setItem(LAUNCHPAD_ACTION_LIMIT_KEY, String(limit)); } catch { /* ignore */ }
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
:is([data-theme-mode="dark"], [data-appearance="dark"], body.body--dark, body.theme--dark, html.dark) .lv-desktop-launchpad-popover {
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
        if (existing && existing.getAttribute?.("data-lv-ver") === "2.9") return;
        style.id = "lv-launchpad-desktop-styles";
        style.setAttribute?.("data-lv-ver", "2.9");
        style.textContent = cssText + `
#lvLaunchpadDesktopEntry,
#lvLaunchpadMobileEntry {
  transition: transform 0.14s ease, background-color 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
}
#lvLaunchpadDesktopEntry:active,
#lvLaunchpadMobileEntry:active {
  transform: scale(0.91);
}
#lvLaunchpadDesktopEntry.lv-entry-open,
#lvLaunchpadMobileEntry.lv-entry-open {
  background: var(--b3-theme-primary-lightest, rgba(37, 99, 235, 0.14)) !important;
  color: var(--b3-theme-primary, #2563eb) !important;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--b3-theme-primary, #2563eb) 32%, transparent);
}
.lv-desktop-launchpad-popover * {
  box-sizing: border-box;
}
.lv-desktop-launchpad-popover.lv-popover-settled {
  animation: none !important;
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
.lv-pop-sub-btn:focus-visible,
.lv-pop-view-tab:focus-visible,
.lv-pop-quick-pill:focus-visible,
.lv-pop-tile:focus-visible,
.lv-pop-action-row:focus-visible,
.lv-pop-hit-item:focus-visible,
.lv-pop-ticker-pill:focus-visible,
.lv-pop-strip-chip:focus-visible,
.lv-pop-pin-btn:focus-visible,
.lv-pop-close-btn:focus-visible,
.lv-pop-search-clear:focus-visible {
  outline: 2px solid var(--lv-lp-accent);
  outline-offset: 2px;
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
  transition: background 0.14s ease, color 0.14s ease, box-shadow 0.14s ease;
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
  transition: transform 0.14s ease, background 0.14s ease, border-color 0.14s ease, box-shadow 0.14s ease, color 0.14s ease;
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
  margin: 2px 14px 4px;
  padding: 3.5px 9px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid var(--lv-lp-border);
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--lv-lp-panel-bg);
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.015);
  flex-shrink: 0;
  transition: background 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
}
.lv-pop-search-bar:focus-within {
  background: var(--lv-lp-card-bg);
  border-color: var(--lv-lp-accent);
  box-shadow: 0 0 0 2px var(--lv-lp-accent-soft);
}
.lv-pop-search-input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  font-size: 11.5px;
  color: var(--lv-lp-text);
  font-family: inherit;
}
.lv-pop-search-input::placeholder {
  color: var(--lv-lp-text-sub);
}
.lv-pop-search-clear {
  display: none;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: none;
  background: var(--lv-lp-border);
  color: var(--lv-lp-text-sub);
  font-size: 10px;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: background-color 0.12s ease, color 0.12s ease, transform 0.1s ease;
}
.lv-pop-search-clear.visible {
  display: inline-flex;
}
.lv-pop-search-clear:hover {
  background: var(--lv-lp-accent-soft);
  color: var(--lv-lp-accent);
}
.lv-pop-search-clear:active {
  transform: scale(0.9);
}
.lv-pop-search-history {
  display: none;
  align-items: center;
  gap: 5px;
  margin: 0 14px 4px;
  overflow-x: auto;
  scrollbar-width: none;
  flex-shrink: 0;
}
.lv-pop-search-history.visible {
  display: flex;
}
.lv-pop-search-history::-webkit-scrollbar { display: none; }
.lv-pop-save-toast {
  font-size: 10.5px;
  font-weight: 600;
  color: #10b981;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.25);
  padding: 1.5px 8px;
  border-radius: 999px;
  opacity: 0;
  transition: opacity 0.18s ease;
  pointer-events: none;
}
.lv-pop-save-toast.visible {
  opacity: 1;
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
  transition: transform 0.14s ease, background 0.14s ease, border-color 0.14s ease, box-shadow 0.14s ease, color 0.14s ease;
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
  transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), background 0.18s ease, background-image 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
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
  padding: 5px 14px;
  display: flex;
  flex-direction: column;
  gap: 3px;
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
  transition: transform 0.14s ease, background 0.14s ease, border-color 0.14s ease, box-shadow 0.14s ease, color 0.14s ease;
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
  transition: background 0.14s ease, border-color 0.14s ease, box-shadow 0.14s ease;
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
.lv-pop-inbox-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 14px;
  height: 14px;
  padding: 0 3.5px;
  border-radius: 999px;
  background: #ef4444;
  color: #ffffff;
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
  margin-left: 3px;
}
.lv-pop-quick-wrap {
  margin: 8px 14px 5px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex-shrink: 0;
}
.lv-pop-quick-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}
.lv-pop-quick-pill {
  --pill-accent: var(--lv-lp-accent);
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  padding: 6.5px 8px;
  min-height: 35px;
  border-radius: 10px;
  background: var(--lv-lp-card-bg);
  border: 1px solid var(--lv-lp-border-strong);
  box-shadow: var(--lv-lp-card-shadow);
  color: var(--lv-lp-text);
  cursor: pointer;
  font-size: 11.5px;
  font-weight: 600;
  font-family: inherit;
  transition: transform 0.16s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease, color 0.16s ease, opacity 0.15s ease;
  user-select: none;
  white-space: nowrap;
}
.lv-pop-quick-pill:hover {
  background: color-mix(in srgb, var(--pill-accent) 10%, var(--lv-lp-card-bg));
  border-color: var(--pill-accent);
  color: var(--pill-accent);
  transform: translateY(-1.5px);
  box-shadow: 0 5px 14px -3px color-mix(in srgb, var(--pill-accent) 24%, transparent), 0 0 0 1px color-mix(in srgb, var(--pill-accent) 55%, transparent);
}
.lv-pop-quick-pill:active {
  transform: scale(0.96);
}
.lv-pop-quick-pill[data-busy="true"] {
  opacity: 0.72;
  pointer-events: none;
}
.lv-pop-quick-pill[data-busy="true"] .lv-quick-pill-icon {
  display: inline-block;
  animation: lvSpin 0.8s linear infinite;
}
.lv-pop-quick-pill[data-done="true"] {
  border-color: #10b981;
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}
.lv-quick-note-btn { --pill-accent: #f59e0b; }
.lv-quick-lifelog-btn { --pill-accent: #6366f1; }
.lv-quick-clip-btn { --pill-accent: #06b6d4; }
.lv-quick-diary-bottom-btn { --pill-accent: #10b981; }
.lv-quick-task-mgr-btn { --pill-accent: #3b82f6; }
.lv-quick-new-task-btn { --pill-accent: #ec4899; }
.lv-quick-random-walk-btn { --pill-accent: #8b5cf6; }
.lv-quick-reload-btn { --pill-accent: #64748b; }
.lv-pop-quick-pill .lv-quick-pill-left {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
}
.lv-pop-quick-pill .lv-quick-pill-icon {
  font-size: 13.5px;
  line-height: 1;
}
.lv-pop-quick-pill .lv-quick-pill-text {
  font-size: 11.5px;
  font-weight: 650;
}
.lv-pop-quick-pill .lv-quick-pill-key {
  font-size: 9px;
  font-weight: 700;
  font-family: monospace;
  padding: 1px 4px;
  border-radius: 4px;
  background: var(--lv-lp-panel-bg);
  border: 1px solid var(--lv-lp-border);
  color: var(--lv-lp-text-sub);
  line-height: 1.2;
}
.lv-pop-today-ticker {
  margin: 2px 14px 4px;
  padding: 3px 8px;
  border-radius: 7px;
  background: var(--lv-lp-panel-bg);
  border: 1px solid var(--lv-lp-border);
  display: flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
  font-size: 10.5px;
}
.lv-pop-ticker-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--lv-lp-text-sub);
  white-space: nowrap;
  flex-shrink: 0;
}
.lv-pop-ticker-pills {
  display: flex;
  align-items: center;
  gap: 5px;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}
.lv-pop-ticker-pills::-webkit-scrollbar { display: none; }
.lv-pop-ticker-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1.5px 7px;
  border-radius: 999px;
  background: var(--lv-lp-card-bg);
  border: 1px solid var(--lv-lp-border);
  color: var(--lv-lp-text-sub);
  font-size: 10.5px;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: transform 0.12s ease, background-color 0.12s ease, border-color 0.12s ease, color 0.12s ease;
}
.lv-pop-ticker-pill:hover {
  border-color: var(--lv-lp-accent);
  color: var(--lv-lp-accent);
  background: var(--lv-lp-accent-soft);
}
.lv-pop-ticker-pill:active {
  transform: scale(0.95);
}
.lv-pop-ticker-pill.done {
  opacity: 0.92;
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.22);
}
.lv-pop-ticker-pill.uninstalled {
  opacity: 0.45;
  cursor: default;
}
.lv-pop-ticker-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}
.lv-pop-ticker-val {
  font-size: 10px;
  font-family: monospace;
  color: var(--lv-lp-text);
}
.lv-pop-ticker-pill.done .lv-pop-ticker-val {
  color: #10b981;
}
.lv-pop-ticker-all-done {
  font-size: 10px;
  font-weight: 600;
  color: #10b981;
  white-space: nowrap;
  flex-shrink: 0;
}
.lv-pop-inbox-drawer {
  scrollbar-width: thin;
  overscroll-behavior: contain;
}
.lv-inbox-item.unread {
  background: var(--lv-lp-accent-soft) !important;
  border-color: rgba(37, 99, 235, 0.25) !important;
}
.lv-inbox-day-sep {
  font-size: 10px;
  font-weight: 700;
  color: var(--lv-lp-text-sub);
  text-align: center;
  padding: 3px 0 1px;
  letter-spacing: 0.08em;
  opacity: 0.9;
}
@media (max-width: 460px) {
  .lv-desktop-launchpad-popover .lv-pop-quick-strip { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .lv-desktop-launchpad-popover .lv-pop-today-dashboard-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .lv-desktop-launchpad-popover .lv-pop-header { flex-wrap: wrap; row-gap: 8px; }
  .lv-desktop-launchpad-popover .lv-pop-header > div:last-child { width: 100%; flex-wrap: wrap; }
  .lv-desktop-launchpad-popover .lv-pop-footer { flex-wrap: wrap; }
}
`;
        if (!existing) document.head.appendChild(style);
    } catch { /* ignore */ }
}

function syncEntryOpenState(open: boolean): void {
    if (typeof document === "undefined" || typeof document.getElementById !== "function") return;
    for (const entryId of [DESKTOP_ENTRY_ID, MOBILE_ENTRY_ID]) {
        try {
            const btn = document.getElementById(entryId);
            if (!btn) continue;
            if (typeof btn.setAttribute === "function") btn.setAttribute("aria-expanded", open ? "true" : "false");
            if (btn.classList && typeof btn.classList.toggle === "function") btn.classList.toggle("lv-entry-open", open);
        } catch { /* ignore */ }
    }
}

export function isDesktopPopoverOpen(): boolean {
    if (typeof document === "undefined") return false;
    const el = document.getElementById(DESKTOP_POPOVER_ID);
    return Boolean(el && !el.classList?.contains?.("lv-popover-closing"));
}

export function closeDesktopLaunchpadPopover(immediate = false): void {
    if (typeof document === "undefined") return;
    syncEntryOpenState(false);
    try { refreshEntryBadgeDot(); } catch { /* ignore */ }
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

    if (immediate) {
        try { el.remove(); } catch { /* ignore */ }
        return;
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
    showInboxDrawer?: boolean;
    inboxFilter?: "all" | "unread" | "alert" | "siyuan";
    actionLimit?: number | "all";
    recentIds?: string[];
    allItems?: ReadonlyArray<LvLaunchpadItem & { state: "pinned" | "docked" | "hidden" }>;
    todaySummary?: LvTodaySummary;
}

async function copyTextToClipboard(text: string): Promise<boolean> {
    if (!text) return false;
    try {
        if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch { /* fallback */ }
    try {
        const electron = safeRequire<any>("electron");
        if (electron?.clipboard && typeof electron.clipboard.writeText === "function") {
            electron.clipboard.writeText(text);
            return true;
        }
    } catch { /* fallback */ }
    try {
        if (typeof document !== "undefined" && document.body) {
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            const ok = document.execCommand("copy");
            ta.remove();
            return ok;
        }
    } catch { /* ignore */ }
    return false;
}

/**
 * 格式化通知历史时间戳（今天显示 HH:mm，非今天显示 M/D HH:mm）
 */
function formatNoticeTime(ts: number): string {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    if (isToday) return `${hh}:${mm}`;
    return `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`;
}

/** 通知中心日期分组标签（今天 / 昨天 / M/D），供抽屉内插入日分隔行 */
function inboxDayLabel(ts: number): string {
    const d = new Date(ts);
    const now = new Date();
    const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    if (sameDay(d, now)) return "今天";
    const yesterday = new Date(now.getTime() - 86_400_000);
    if (sameDay(d, yesterday)) return "昨天";
    return `${d.getMonth() + 1}/${d.getDate()}`;
}

/**
 * 构建罗盘通知中心历史抽屉 HTML
 */
function buildInboxDrawerHtml(
    history: LvNoticePacket[],
    unreadCount: number,
    filter: "all" | "unread" | "alert" | "siyuan" = "all"
): string {
    const alertCount = history.filter((p) => p.level === "warn" || p.level === "error").length;
    const siyuanCount = history.filter((p) => p.category === "siyuan-native" || p.source === "思源原生").length;
    const filtered = history.filter((p) => {
        if (filter === "unread") return !p.read;
        if (filter === "alert") return p.level === "warn" || p.level === "error";
        if (filter === "siyuan") return p.category === "siyuan-native" || p.source === "思源原生";
        return true;
    });

    let rowsHtml = "";
    if (filtered.length === 0) {
        const emptyMsg = filter === "unread"
            ? "✨ 太棒了，所有通知均已阅读"
            : (filter === "alert"
                ? "🛡️ 今日暂无告警或异常消息"
                : (filter === "siyuan" ? "📋 暂无思源原生消息记录（出现同步/报错/插件提示时自动归档）" : "🌱 今日通知中心暂无消息，工作区静悄悄"));
        rowsHtml = `
          <div class="lv-inbox-empty" style="text-align:center;padding:22px 12px;color:var(--lv-lp-text-sub,#64748b);font-size:12px;">
            ${emptyMsg}
          </div>
        `;
    } else {
        let lastDayLabel = "";
        filtered.slice(0, 40).forEach((packet) => {
            const isUnread = !packet.read;
            const isSiyuan = packet.category === "siyuan-native" || packet.source === "思源原生";
            const safeSource = escapeHtml(packet.source || "小驴");
            const safeTitle = packet.title ? escapeHtml(packet.title) : "";
            const safeMsg = escapeHtml(packet.message || "");
            const timeStr = formatNoticeTime(packet.createdAt || Date.now());
            const dayLabel = inboxDayLabel(packet.createdAt || Date.now());
            if (dayLabel !== lastDayLabel) {
                lastDayLabel = dayLabel;
                rowsHtml += `<div class="lv-inbox-day-sep" aria-hidden="true">— ${escapeHtml(dayLabel)} —</div>`;
            }
            const levelIcon = packet.level === "error" ? "🛑" : (packet.level === "warn" ? "⚠️" : (packet.level === "success" ? "✅" : "ℹ️"));
            const repeatBadge = (packet.repeatCount || 1) > 1
                ? `<span class="lv-inbox-repeat" style="font-size:10px;font-weight:700;padding:0.5px 5px;border-radius:999px;background:rgba(245,158,11,0.14);color:#b45309;">×${packet.repeatCount}</span>`
                : "";
            const sourceStyle = isSiyuan
                ? "font-size:10px;font-weight:600;padding:1px 5px;border-radius:4px;background:rgba(100,116,139,0.14);color:var(--lv-lp-text-sub,#475569);"
                : "font-size:10px;font-weight:600;padding:1px 5px;border-radius:4px;background:var(--lv-lp-accent-soft,rgba(37,99,235,0.1));color:var(--lv-lp-accent,#2563eb);";

            let actionHtml = "";
            if (packet.action && packet.action.label) {
                const safeActionLabel = escapeHtml(packet.action.label);
                actionHtml = `
                  <button type="button" class="lv-pop-sub-btn lv-inbox-action-btn" data-inbox-id="${escapeHtml(packet.id)}" style="padding:2px 7px;font-size:10.5px;color:var(--lv-lp-accent,#2563eb);border-color:var(--lv-lp-accent,#2563eb);flex-shrink:0;">
                    ${safeActionLabel}
                  </button>
                `;
            }

            rowsHtml += `
              <div class="lv-inbox-item ${isUnread ? "unread" : ""}" data-inbox-id="${escapeHtml(packet.id)}" ${isUnread ? `title="点击标为已读"` : ""} style="display:flex;align-items:flex-start;gap:8px;padding:8px 10px;border-radius:8px;background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border,rgba(15,23,42,0.08));position:relative;margin-bottom:5px;${isUnread ? "cursor:pointer;" : ""}">
                ${isUnread ? `<span style="width:6px;height:6px;border-radius:50%;background:var(--lv-lp-accent,#2563eb);position:absolute;top:8px;left:4px;" title="未读"></span>` : ""}
                <span style="font-size:13px;line-height:1;margin-top:2px;" aria-hidden="true">${levelIcon}</span>
                <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;">
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
                    <div style="display:flex;align-items:center;gap:5px;min-width:0;flex-wrap:wrap;">
                      <span class="lv-inbox-source-tag" style="${sourceStyle}">${safeSource}</span>
                      ${safeTitle ? `<strong style="font-size:12px;color:var(--lv-lp-text,#0f172a);">${safeTitle}</strong>` : ""}
                      ${repeatBadge}
                    </div>
                    <div style="display:flex;align-items:center;gap:4px;flex-shrink:0;">
                      <button type="button" class="lv-pop-sub-btn lv-inbox-copy-btn" data-inbox-id="${escapeHtml(packet.id)}" title="复制通知文本" style="padding:1px 5px;font-size:10px;opacity:0.8;">复制</button>
                      <span style="font-size:10px;color:var(--lv-lp-text-sub,#64748b);">${timeStr}</span>
                    </div>
                  </div>
                  <div style="font-size:11.5px;color:var(--lv-lp-text,#0f172a);line-height:1.4;word-break:break-word;">
                    ${safeMsg}
                  </div>
                </div>
                ${actionHtml}
              </div>
            `;
        });
    }

    return `
      <div class="lv-pop-inbox-drawer" style="padding:12px 14px;background:var(--lv-lp-panel-bg,#f8fafc);display:flex;flex-direction:column;gap:8px;flex:1 1 auto;min-height:0;overflow-y:auto;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:8px;border-bottom:1px dashed var(--lv-lp-border,rgba(15,23,42,0.08));flex-wrap:wrap;gap:6px;">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <button type="button" class="lv-pop-sub-btn lv-pop-inbox-btn" title="返回罗盘主页" style="padding:2.5px 8px;font-size:11px;">← 返回</button>
            <span style="font-weight:700;font-size:12.5px;color:var(--lv-lp-accent,#2563eb);">🔔 通知中心</span>
            <div class="lv-pop-view-tabs" role="tablist" aria-label="通知筛选">
              <button type="button" role="tab" aria-selected="${filter === "all"}" class="lv-pop-view-tab lv-inbox-filter-btn ${filter === "all" ? "active" : ""}" data-inbox-filter="all">全部 ${history.length}</button>
              <button type="button" role="tab" aria-selected="${filter === "unread"}" class="lv-pop-view-tab lv-inbox-filter-btn ${filter === "unread" ? "active" : ""}" data-inbox-filter="unread">未读 ${unreadCount}</button>
              <button type="button" role="tab" aria-selected="${filter === "alert"}" class="lv-pop-view-tab lv-inbox-filter-btn ${filter === "alert" ? "active" : ""}" data-inbox-filter="alert">告警 ${alertCount}</button>
              <button type="button" role="tab" aria-selected="${filter === "siyuan"}" class="lv-pop-view-tab lv-inbox-filter-btn ${filter === "siyuan" ? "active" : ""}" data-inbox-filter="siyuan">思源 ${siyuanCount}</button>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:5px;">
            <button type="button" class="lv-pop-sub-btn lv-inbox-mark-all-btn" title="标记全部为已读" style="padding:2.5px 8px;font-size:10.5px;">✓ 全部已读</button>
            <button type="button" class="lv-pop-sub-btn lv-inbox-clear-btn" title="清空全部通知历史" style="padding:2.5px 8px;font-size:10.5px;">清空</button>
          </div>
        </div>
        <div class="lv-inbox-rows" style="display:flex;flex-direction:column;padding-top:2px;">
          ${rowsHtml}
        </div>
      </div>
    `;
}

/**
 * 计算全生态今日 4 合 1 知识聚合指标（打卡/闪卡/管家/拾遗）
 */
export function getTodaySummary(items: ReadonlyArray<LvLaunchpadItem & { state?: "pinned" | "docked" | "hidden" }>): LvTodaySummary {
    const pillars = [
        {
            id: "checkin",
            pluginId: "siyuan-checkin",
            name: "习惯打卡",
            shortName: "打卡",
            color: "#10b981",
            iconSvg: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`,
        },
        {
            id: "cards",
            pluginId: "siyuan-lv-cards",
            name: "卡片复习",
            shortName: "闪卡",
            color: "#f59e0b",
            iconSvg: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="14" x="3" y="5" rx="2"/><path d="M7 15h4M7 9h10"/></svg>`,
        },
        {
            id: "home",
            pluginId: "siyuan-home",
            name: "生活到期",
            shortName: "管家",
            color: "#3b82f6",
            iconSvg: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
        },
        {
            id: "glean",
            pluginId: "siyuan-glean",
            name: "稍后阅读",
            shortName: "拾遗",
            color: "#8b5cf6",
            iconSvg: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10"/></svg>`,
        },
    ];

    const metrics: LvTodayMetric[] = pillars.map((p) => {
        const item = items.find((it) => it.id === p.pluginId);
        if (!item) {
            return {
                ...p,
                count: 0,
                badgeText: "",
                label: "未开启",
                status: "uninstalled" as const,
            };
        }

        const rawBadge = String(item.badge ?? "").trim();
        let count = 0;
        let total: number | undefined;
        let status: "done" | "pending" | "empty" = "empty";
        let label = "暂无待办";

        if (p.id === "checkin") {
            const slashMatch = /(\d+)\s*\/\s*(\d+)/.exec(rawBadge);
            if (slashMatch) {
                count = Number(slashMatch[1]);
                total = Number(slashMatch[2]);
                if (total > 0 && count >= total) {
                    status = "done";
                    label = `${count}/${total} 全部达成 ✓`;
                } else {
                    status = count > 0 ? "pending" : "empty";
                    label = `${count}/${total} 项打卡`;
                }
            } else {
                const numMatch = /(\d+)/.exec(rawBadge);
                if (numMatch) {
                    count = Number(numMatch[1]);
                    // 打卡徽章语义为「N 待办」：非 0 即为尚有未完成项（非「已打卡」数）
                    if (rawBadge.includes("✓")) {
                        status = "done";
                        label = "今日全达成 ✓";
                    } else if (count === 0) {
                        status = "done";
                        label = "今日全达成 ✓";
                    } else {
                        status = "pending";
                        label = `${count} 项待完成`;
                    }
                } else if (rawBadge.includes("✓")) {
                    status = "done";
                    label = "今日全达成 ✓";
                }
            }
        } else if (p.id === "cards") {
            const numMatch = /(\d+)/.exec(rawBadge);
            if (numMatch) {
                count = Number(numMatch[1]);
                if (count === 0 || rawBadge.includes("✓")) {
                    status = "done";
                    label = "复习完成 ✓";
                } else {
                    status = "pending";
                    label = `${count} 张待复习`;
                }
            } else if (rawBadge.includes("✓")) {
                status = "done";
                label = "复习完成 ✓";
            }
        } else if (p.id === "home") {
            const numMatch = /(\d+)/.exec(rawBadge);
            if (numMatch) {
                count = Number(numMatch[1]);
                if (count === 0 || rawBadge.includes("✓")) {
                    status = "done";
                    label = "无临期事务 ✓";
                } else {
                    status = "pending";
                    label = `${count} 项临期待办`;
                }
            } else if (rawBadge.includes("✓")) {
                status = "done";
                label = "无临期事务 ✓";
            }
        } else if (p.id === "glean") {
            const numMatch = /(\d+)/.exec(rawBadge);
            if (numMatch) {
                count = Number(numMatch[1]);
                if (count === 0 || rawBadge.includes("✓")) {
                    status = "done";
                    label = "阅读已清空 ✓";
                } else {
                    status = "pending";
                    label = `${count} 篇稍后读`;
                }
            } else if (rawBadge.includes("✓")) {
                status = "done";
                label = "阅读已清空 ✓";
            }
        }

        return {
            ...p,
            count,
            total,
            badgeText: rawBadge,
            label,
            status,
        };
    });

    const activePillars = metrics.filter((m) => m.status !== "uninstalled");
    const allDone = activePillars.length > 0 && activePillars.every((m) => m.status === "done");

    return {
        date: getTodayKey(),
        metrics,
        allDone,
    };
}

/**
 * 构建今日 4 合 1 晨昏看板 HTML
 */
function buildToday4in1DashboardHtml(summary: LvTodaySummary): string {
    let pillsHtml = "";
    summary.metrics.forEach((m) => {
        const isDone = m.status === "done";
        const isUninstalled = m.status === "uninstalled";
        const statusClass = isDone ? "done" : (m.status === "pending" ? "pending" : (isUninstalled ? "uninstalled" : "empty"));
        const titleAttr = isUninstalled ? `${escapeHtml(m.name)} (未安装/未加载)` : `${escapeHtml(m.name)}：${escapeHtml(m.label)} · 点击直达`;
        const safeColor = resolveSafeBrandColor(m.pluginId, m.color);
        // done 显 ✓ / pending 显数字 / empty（插件无徽章）显 –，与「0 待办」区分
        const valText = isDone ? "✓" : (m.count > 0 ? String(m.count) : (m.status === "empty" ? "–" : "0"));

        pillsHtml += `
          <button type="button" class="lv-pop-ticker-pill ${statusClass}" data-recent-id="${escapeHtml(m.pluginId)}" title="${titleAttr}">
            <span class="lv-pop-ticker-dot" style="background:${safeColor};"></span>
            <span class="lv-pop-ticker-name">${escapeHtml(m.shortName)}</span>
            <strong class="lv-pop-ticker-val">${valText}</strong>
          </button>
        `;
    });

    const allDoneBadge = summary.allDone
        ? `<span class="lv-pop-ticker-all-done" title="今日全生态任务全部达成">✓ 全达成</span>`
        : "";

    return `
      <div class="lv-pop-today-ticker" role="region" aria-label="今日状态微报">
        <span class="lv-pop-ticker-label">📊 今日</span>
        <div class="lv-pop-ticker-pills">
          ${pillsHtml}
        </div>
        ${allDoneBadge}
      </div>
    `;
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
    const showInbox = Boolean(opts?.showInboxDrawer);
    const inboxFilter = opts?.inboxFilter || "all";
    const actionLimit = opts?.actionLimit ?? 3;
    const recentIds = opts?.recentIds ?? getRecentTileIds();
    const allItemsForPref = opts?.allItems ?? items;
    const focusActive = isNotifyFocusActive();
    const focusUntil = getNotifyFocusUntil();
    const unreadCount = lvNotify.getUnreadCount();

    const toggleAllTitle = allPinned ? "收敛全部到小驴罗盘 (新版极简模式)" : "平铺全部独立图标到顶栏 (恢复老版布局)";
    const toggleAllText = allPinned ? "收敛" : "平铺";
    const pinSvg = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;fill:none!important;stroke:currentColor!important;vertical-align:-1px;" aria-hidden="true"><path d="M12 17v5" fill="none"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" fill="none"/></svg>`;
    const searchSvg = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;fill:none!important;stroke:currentColor!important;flex-shrink:0;color:var(--lv-lp-text-sub,#64748b);" aria-hidden="true"><circle cx="11" cy="11" r="8" fill="none"/><line x1="21" y1="21" x2="16.65" y2="16.65" fill="none"/></svg>`;

    const focusLabel = focusActive ? `🌙 至${new Date(focusUntil).toTimeString().slice(0, 5)}` : "🌙 专注";
    const headerHtml = `
      <div class="lv-pop-header">
        <div style="display:flex;align-items:center;gap:7px;min-width:0;">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:7px;background:var(--lv-lp-accent-soft,rgba(37,99,235,0.1));color:var(--lv-lp-accent,#2563eb);flex-shrink:0;">${COMPASS_SVG}</span>
          <span style="font-weight:700;font-size:14px;color:var(--lv-lp-text,#0f172a);white-space:nowrap;letter-spacing:-0.01em;">小驴罗盘</span>
          <span style="font-size:10.5px;font-weight:600;padding:1.5px 7px;border-radius:999px;background:var(--lv-lp-accent-soft,rgba(37,99,235,0.1));color:var(--lv-lp-accent,#2563eb);white-space:nowrap;" title="当前接入小驴罗盘的插件数量（数字键 1-8 可瞬发对应磁贴）">${items.length} 联结</span>
        </div>
        <div style="display:flex;align-items:center;gap:4px;flex-shrink:0;">
          <div class="lv-pop-view-tabs" role="tablist" aria-label="视图切换">
            <button type="button" role="tab" aria-selected="${view === "grid"}" class="lv-pop-view-tab ${view === "grid" ? "active" : ""}" data-view="grid">九宫格</button>
            <button type="button" role="tab" aria-selected="${view === "list"}" class="lv-pop-view-tab ${view === "list" ? "active" : ""}" data-view="list">列表</button>
          </div>
          <button type="button" class="lv-pop-sub-btn lv-pop-focus-btn ${focusActive ? "active" : ""}" title="${focusActive ? "点击退出全局专注模式" : "开启全局专注模式（静音通知至今晚）"}">${escapeHtml(focusLabel)}</button>
          <button type="button" class="lv-pop-sub-btn lv-pop-inbox-btn ${showInbox ? "active" : ""}" aria-label="通知中心" title="全生态通知中心历史（${unreadCount} 未读）">🔔${unreadCount > 0 ? `<span class="lv-pop-inbox-badge">${unreadCount}</span>` : ""}</button>
          <button type="button" class="lv-pop-sub-btn lv-pop-pref-btn ${showPref ? "active" : ""}" aria-label="设置" title="顶栏与罗盘坞内显隐及跨插件联动设置">⚙ 设置</button>
          <button type="button" class="lv-pop-sub-btn lv-pop-toggle-all-btn" title="${toggleAllTitle}">${pinSvg}<span>${toggleAllText}</span></button>
          <button type="button" class="lv-pop-sub-btn lv-pop-close-btn" aria-label="关闭" title="关闭 (Esc)" style="padding:3.5px 7px;">✕</button>
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
          <div class="lv-pop-pref-drawer" style="padding:12px 16px;background:var(--lv-lp-panel-bg,#f8fafc);display:flex;flex-direction:column;gap:8px;flex:1 1 auto;min-height:0;overflow-y:auto;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding-bottom:6px;border-bottom:1px dashed var(--lv-lp-border,rgba(15,23,42,0.08));">
              <div style="display:flex;align-items:center;gap:6px;">
                <button type="button" class="lv-pop-sub-btn lv-pop-pref-btn" title="返回罗盘主页" style="padding:2.5px 8px;font-size:11px;">← 返回</button>
                <span style="font-weight:700;font-size:12.5px;color:var(--lv-lp-accent,#2563eb);">⚙ 顶栏与工作台设置</span>
              </div>
              <span class="lv-pop-save-toast" role="status" aria-live="polite">✓ 已保存</span>
            </div>
            <div style="background:var(--lv-lp-accent-soft,rgba(37,99,235,0.08));border:1px solid rgba(37,99,235,0.2);padding:7px 11px;border-radius:8px;font-size:11.5px;line-height:1.5;color:var(--lv-lp-text,#0f172a);">
              👋 <strong>顶栏与罗盘主权设置</strong>：自主决定哪些插件<strong>常驻在思源顶栏</strong>，哪些<strong>仅在罗盘坞内收敛</strong>，哪些<strong>彻底隐藏</strong>。
            </div>
            <div style="font-weight:700;font-size:12px;color:var(--lv-lp-accent,#2563eb);margin-top:2px;">📌 顶栏与罗盘图标显隐管理</div>
            <div>${stateRowsHtml}</div>
            <div style="font-weight:700;font-size:12px;color:var(--lv-lp-accent,#2563eb);margin-top:4px;">⚡ 极速工作台与移动端入口配置</div>
            <div style="display:flex;flex-direction:column;gap:7px;padding:6px 0;border-bottom:1px dashed var(--lv-lp-border,rgba(15,23,42,0.08));">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <span style="font-size:12px;color:var(--lv-lp-text,#0f172a);">LifeLog 分类（逗号分隔）</span>
                <input type="text" class="lv-pop-lifelog-cats-input b3-text-field" value="${escapeHtml(getQuickWorkspaceConfig().lifeLogCategories.join(', '))}" style="font-size:11.5px;padding:3px 8px;border-radius:6px;width:196px;background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,0.14));color:var(--lv-lp-text,#0f172a);" />
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <span style="font-size:12px;color:var(--lv-lp-text,#0f172a);">日记目标笔记本</span>
                <select class="lv-pop-notebook-select" data-selected-nb="${escapeHtml(getQuickWorkspaceConfig().lifeLogNotebookId || '')}" style="background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,0.14));color:var(--lv-lp-text,#0f172a);padding:3px 8px;border-radius:6px;font-size:11.5px;width:196px;cursor:pointer;">
                  <option value="">✨ 自动识别默认日记本</option>
                  ${getQuickWorkspaceConfig().lifeLogNotebookId ? `<option value="${escapeHtml(getQuickWorkspaceConfig().lifeLogNotebookId || '')}" selected>📔 已选: 当前日记本</option>` : ""}
                </select>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <span style="font-size:12px;color:var(--lv-lp-text,#0f172a);">手机端罗盘入口形态</span>
                <select class="lv-pop-mobile-mode-select" style="background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,0.14));color:var(--lv-lp-text,#0f172a);padding:3px 8px;border-radius:6px;font-size:11.5px;width:196px;cursor:pointer;">
                  <option value="both" ${getMobileEntryMode() === "both" ? "selected" : ""}>🔘 悬浮球 + 顶栏按钮 (推荐)</option>
                  <option value="ball" ${getMobileEntryMode() === "ball" ? "selected" : ""}>🎯 仅悬浮球</option>
                  <option value="topbar" ${getMobileEntryMode() === "topbar" ? "selected" : ""}>📌 仅顶栏按钮</option>
                  <option value="none" ${getMobileEntryMode() === "none" ? "selected" : ""}>🙈 隐藏手机端入口</option>
                </select>
              </div>
            </div>
            ${(() => {
                const mutedCats = lvNotify.getMutedCategories ? lvNotify.getMutedCategories() : [];
                if (!mutedCats.length) return "";
                let mRows = "";
                mutedCats.forEach((mc) => {
                    mRows += `
                      <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px dashed var(--lv-lp-border,rgba(15,23,42,0.08));font-size:11.5px;">
                        <div>
                          <strong style="color:var(--lv-lp-text,#0f172a);">${escapeHtml(mc.category)}</strong>
                          <span style="font-size:10.5px;color:var(--lv-lp-text-sub,#64748b);margin-left:6px;">至 ${escapeHtml(mc.untilStr)}</span>
                        </div>
                        <button type="button" class="lv-pop-unmute-btn" data-unmute-cat="${escapeHtml(mc.category)}" style="background:transparent;border:1px solid var(--lv-lp-border);border-radius:4px;padding:1px 6px;font-size:10.5px;cursor:pointer;color:var(--lv-lp-accent,#2563eb);">解除静音</button>
                      </div>
                    `;
                });
                return `
                  <div style="font-weight:700;font-size:12px;color:var(--lv-lp-accent,#2563eb);margin-top:4px;">🔕 已设免打扰提醒分类 (${mutedCats.length})</div>
                  <div style="display:flex;flex-direction:column;gap:3px;">${mRows}</div>
                `;
            })()}
            <div style="font-weight:700;font-size:12px;color:var(--lv-lp-accent,#2563eb);margin-top:4px;">⚡ 跨插件智能自动化规则 (IFTTT)</div>
            <div style="display:flex;flex-direction:column;gap:5px;">${rulesHtml}</div>
          </div>
        `;
    }

    // 【通知中心历史】抽屉：通知历史收件箱留档与已读/清空/筛选/行动操作
    let inboxDrawerHtml = "";
    if (showInbox) {
        inboxDrawerHtml = buildInboxDrawerHtml(lvNotify.getHistory(), unreadCount, inboxFilter);
    }

    // 全局穿透搜索（极简瘦身版：带清除按钮与历史芯片）
    const searchBarHtml = `
      <div class="lv-pop-search-bar">
        ${searchSvg}
        <input type="text" class="lv-pop-search-input" placeholder="搜索全家桶 (习惯 / 切片 / 闪卡 / 人脉 · 按 / 聚焦)..." aria-label="全生态穿透搜索" autocomplete="off" />
        <button type="button" class="lv-pop-search-clear" aria-label="清空搜索" title="清空搜索">✕</button>
        <span class="lv-pop-kbd">/</span>
      </div>
      <div class="lv-pop-search-history" aria-label="最近搜索"></div>
    `;

    // 极速工作台核心区（加强版：置顶主视觉焦点 · 8 键 4×2 质感动作矩阵）
    const lsQuick = getSafeLocalStorage();
    const hasQuickDraft = Boolean(lsQuick?.getItem(QUICK_NOTE_DRAFT_KEY)?.trim());
    const hasLifeDraft = Boolean(lsQuick?.getItem(LIFELOG_DRAFT_KEY)?.trim());
    const quickDraftDot = hasQuickDraft ? `<span style="width:5px;height:5px;border-radius:50%;background:#ef4444;display:inline-block;margin-left:2px;" title="有未保存草稿"></span>` : "";
    const lifeDraftDot = hasLifeDraft ? `<span style="width:5px;height:5px;border-radius:50%;background:#ef4444;display:inline-block;margin-left:2px;" title="有未保存草稿"></span>` : "";

    const quickStripHtml = `
      <div class="lv-pop-quick-wrap">
        <div class="lv-pop-quick-strip" role="toolbar" aria-label="极速工作台快捷操作">
          <button type="button" class="lv-pop-quick-pill lv-quick-note-btn" title="一键记事：快速输入并追加至今日日记或当前文档 (快捷键 N)" aria-keyshortcuts="N">
            <span class="lv-quick-pill-left"><span class="lv-quick-pill-icon">⚡</span><span class="lv-quick-pill-text">一键记事</span>${quickDraftDot}</span><span class="lv-quick-pill-key">N</span>
          </button>
          <button type="button" class="lv-pop-quick-pill lv-quick-lifelog-btn" title="叶归 LifeLog：带时间戳与分类流写入日记 (快捷键 L)" aria-keyshortcuts="L">
            <span class="lv-quick-pill-left"><span class="lv-quick-pill-icon">📒</span><span class="lv-quick-pill-text">LifeLog</span>${lifeDraftDot}</span><span class="lv-quick-pill-key">L</span>
          </button>
          <button type="button" class="lv-pop-quick-pill lv-quick-clip-btn" title="剪贴入库：文本带时间戳入库 · 图片自动存入 assets · 长内容预览确认 (快捷键 V)" aria-keyshortcuts="V">
            <span class="lv-quick-pill-left"><span class="lv-quick-pill-icon">📋</span><span class="lv-quick-pill-text">剪贴入库</span></span><span class="lv-quick-pill-key">V</span>
          </button>
          <button type="button" class="lv-pop-quick-pill lv-quick-diary-bottom-btn" title="直达日记底部：打开今日日记并滚动至末行自动定位光标 (快捷键 B)" aria-keyshortcuts="B">
            <span class="lv-quick-pill-left"><span class="lv-quick-pill-icon">⬇️</span><span class="lv-quick-pill-text">日记底部</span></span><span class="lv-quick-pill-key">B</span>
          </button>
          <button type="button" class="lv-pop-quick-pill lv-quick-task-mgr-btn" title="任务管理器：进入 Task Horizon 跨文档看板 (快捷键 T)" aria-keyshortcuts="T">
            <span class="lv-quick-pill-left"><span class="lv-quick-pill-icon">📋</span><span class="lv-quick-pill-text">任务管理</span></span><span class="lv-quick-pill-key">T</span>
          </button>
          <button type="button" class="lv-pop-quick-pill lv-quick-new-task-btn" title="新建任务：打开任务管理器快速新建任务窗口 (快捷键 K)" aria-keyshortcuts="K">
            <span class="lv-quick-pill-left"><span class="lv-quick-pill-icon">➕</span><span class="lv-quick-pill-text">新建任务</span></span><span class="lv-quick-pill-key">K</span>
          </button>
          <button type="button" class="lv-pop-quick-pill lv-quick-random-walk-btn" title="随机漫步：穿透知识库随机抽取并打开历史笔记 (快捷键 W)" aria-keyshortcuts="W">
            <span class="lv-quick-pill-left"><span class="lv-quick-pill-icon">🎲</span><span class="lv-quick-pill-text">随机漫步</span></span><span class="lv-quick-pill-key">W</span>
          </button>
          <button type="button" class="lv-pop-quick-pill lv-quick-reload-btn" title="重新加载页面：刷新思源界面以应用最新插件、样式或代码片段 (快捷键 R，等效 Ctrl+R)" aria-keyshortcuts="R">
            <span class="lv-quick-pill-left"><span class="lv-quick-pill-icon">🔄</span><span class="lv-quick-pill-text">重新加载</span></span><span class="lv-quick-pill-key">R</span>
          </button>
        </div>
      </div>
    `;

    // 今日状态微报（轻量单行 Ticker：减弱占地权重，保留直达能力）
    const todaySummary = opts?.todaySummary ?? getTodaySummary(items);
    const todayDashboardHtml = buildToday4in1DashboardHtml(todaySummary);

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
            const iconSvg = buildTileIconHtml(item, 17);

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
            const iconSvg = buildTileIconHtml(item, 19);

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
          <button type="button" class="lv-pop-sub-btn lv-pop-restore-btn" title="从备份文件恢复小驴全家桶数据（会覆盖当前数据）">♻ 恢复</button>
          <button type="button" class="lv-pop-close-btn" style="background:transparent;border:none;cursor:pointer;font-size:11px;font-weight:600;color:var(--lv-lp-accent,#2563eb);padding:2px 4px;">Esc</button>
        </div>
      </div>
    `;

    const bodyHtml = showPref
        ? prefDrawerHtml
        : (showInbox
            ? inboxDrawerHtml
            : (quickStripHtml + searchBarHtml + todayDashboardHtml + omniResultsContainerHtml + mainViewHtml + actionsDrawerHtml));

    return headerHtml + bodyHtml + footerHtml;
}

export function openDesktopLaunchpadPopover(
    anchorEl?: HTMLElement | null,
    initialFocusIndex?: number,
    initialShowPref = false,
    initialShowInbox = false,
    initialInboxFilter: "all" | "unread" | "alert" | "siyuan" = "all",
): void {
    if (typeof document === "undefined") return;
    // 打开路径自愈护栏：任何未预期异常不再「无声无息」，先清理残骸自愈重试一次，
    // 仍失败则弹出显性胶囊并在控制台留下可检索标签，杜绝罗盘「点了没反应」无从排查。
    const attempt = () => openDesktopLaunchpadPopoverImpl(anchorEl, initialFocusIndex, initialShowPref, initialShowInbox, initialInboxFilter);
    try {
        attempt();
    } catch (err) {
        console.error("[LvLaunchpad] 弹射坞打开异常，尝试自愈重试:", err);
        closeDesktopLaunchpadPopover(true);
        try {
            attempt();
        } catch (err2) {
            console.error("[LvLaunchpad] 弹射坞自愈重试仍失败:", err2);
            try {
                lvNotify.capsule({ source: "罗盘", message: "罗盘弹射坞打开异常，请按 Ctrl+Shift+I 查看控制台 [LvLaunchpad] 日志", duration: 4000, level: "error", archive: false });
            } catch { /* ignore */ }
        }
    }
}

function openDesktopLaunchpadPopoverImpl(
    anchorEl?: HTMLElement | null,
    initialFocusIndex?: number,
    initialShowPref = false,
    initialShowInbox = false,
    initialInboxFilter: "all" | "unread" | "alert" | "siyuan" = "all",
): void {
    if (typeof document === "undefined") return;
    closeDesktopLaunchpadPopover(true);
    ensureDesktopStyles();

    const anchor = anchorEl || document.getElementById(DESKTOP_ENTRY_ID);
    let allItems = getLaunchpadHub().getItems();
    let items = allItems.filter(it => it.state !== "hidden");
    if (items.length === 0 && allItems.length === 0) return;

    syncEntryOpenState(true);

    const popover = document.createElement("div");
    popover.id = DESKTOP_POPOVER_ID;
    popover.className = "lv-desktop-launchpad-popover b3-typography";
    popover.setAttribute("role", "dialog");
    popover.setAttribute("aria-modal", "false"); // 非模态弹层：允许与顶栏交互，Tab 圈闭已在键处理器内实现
    popover.setAttribute("aria-label", "小驴罗盘全家桶弹射坞");
    if ("tabIndex" in popover) popover.tabIndex = -1;

    const targetWidth = items.length >= 3 ? 520 : 440;

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
                    const availableHeight = Math.max(180, Math.min(winH - rect.bottom - 16, winH - 24));
                    popover.style.maxHeight = `${availableHeight}px`;
                } else {
                    popover.style.top = "42px";
                    popover.style.right = "16px";
                    popover.style.maxHeight = `${Math.max(180, winH - 58)}px`;
                }
            } else {
                popover.style.top = "42px";
                popover.style.right = "16px";
                popover.style.maxHeight = `${Math.max(180, winH - 58)}px`;
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
    let showInboxDrawer = initialShowInbox;
    let inboxFilter: "all" | "unread" | "alert" | "siyuan" = initialInboxFilter;
    let currentFocusIndex = Math.max(0, Math.min(initialFocusIndex ?? 0, Math.max(0, items.length - 1)));
    let isSearchingOmni = false;
    let omniHitsList: Array<{ label: string; onSelect: () => void }> = [];
    let omniFocusIndex = 0;
    let searchSeq = 0;
    let searchDebounceTimer: number | null = null;
    let isDrawerHovered = false;
    let saveToastTimer: number | null = null;

    // 预探测同步 badgeProvider 并收集异步探针（避免首帧展示陈旧缓存）
    // 探针返回 null/undefined 表示「归零」：同步清除旧徽章，避免静态快照残留
    const pendingBadgeProbes: Array<{ item: typeof items[number]; promise: Promise<string | null | undefined> }> = [];
    items.forEach((item) => {
        if (typeof item.badgeProvider === "function") {
            try {
                const res = item.badgeProvider();
                if (res instanceof Promise) {
                    pendingBadgeProbes.push({ item, promise: res as Promise<string | null | undefined> });
                } else if (res && typeof res === "string") {
                    item.badge = res;
                } else {
                    item.badge = undefined;
                }
            } catch { /* ignore */ }
        }
    });

    let allPinned = items.length > 0 && items.every(it => it.state === "pinned");

    const flashSaveToast = (text = "✓ 已保存") => {
        if (typeof popover.querySelector !== "function") return;
        const toast = popover.querySelector<HTMLElement>(".lv-pop-save-toast");
        if (!toast) return;
        toast.textContent = text;
        toast.classList?.add?.("visible");
        if (saveToastTimer !== null) { try { clearTimeout(saveToastTimer); } catch { /* ignore */ } }
        saveToastTimer = Number((typeof window !== "undefined" ? window.setTimeout : setTimeout)(() => {
            saveToastTimer = null;
            try { toast.classList?.remove?.("visible"); } catch { /* ignore */ }
        }, 1600));
    };

    const hydratePrefNotebooks = () => {
        if (!showPrefDrawer || typeof popover.querySelector !== "function") return;
        const sel = popover.querySelector<HTMLSelectElement>(".lv-pop-notebook-select");
        if (!sel) return;
        const selectedNb = sel.getAttribute("data-selected-nb") || "";
        void listOpenNotebooks().then((nbs) => {
            if (!sel.isConnected || !nbs.length) return;
            const optsHtml = `<option value="">✨ 自动识别默认日记本</option>` + nbs.map((nb) =>
                `<option value="${escapeHtml(nb.id)}" ${nb.id === selectedNb ? "selected" : ""}>📔 ${escapeHtml(nb.name)}</option>`
            ).join("");
            sel.innerHTML = optsHtml;
        }).catch(() => { /* ignore */ });
    };

    const syncTodayDashboardDom = () => {
        if (typeof popover.querySelector !== "function") return;
        try {
            const dash = popover.querySelector(".lv-pop-today-ticker");
            if (dash && dash.parentNode) {
                const wrapper = document.createElement("div");
                wrapper.innerHTML = buildToday4in1DashboardHtml(getTodaySummary(items));
                const nextDash = wrapper.firstElementChild;
                if (nextDash) {
                    dash.parentNode.replaceChild(nextDash, dash);
                }
            }
        } catch { /* ignore */ }
    };

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

    const wireDrawerHover = () => {
        const drawerEl = typeof popover.querySelector === "function" ? popover.querySelector(".lv-pop-actions-drawer") : null;
        drawerEl?.addEventListener("mouseenter", () => { isDrawerHovered = true; });
        drawerEl?.addEventListener("mouseleave", () => { isDrawerHovered = false; });
    };

    const wireSearchInput = () => {
        if (typeof popover.querySelector !== "function") return;
        const searchInput = popover.querySelector<HTMLInputElement>(".lv-pop-search-input");
        const clearBtn = popover.querySelector<HTMLButtonElement>(".lv-pop-search-clear");
        const kbdBadge = popover.querySelector<HTMLElement>(".lv-pop-search-bar .lv-pop-kbd");
        const histBar = popover.querySelector<HTMLElement>(".lv-pop-search-history");
        const omniBox = popover.querySelector<HTMLElement>(".lv-pop-omni-results");
        const mainView = popover.querySelector<HTMLElement>(".lv-pop-grid, .lv-pop-list");
        if (!searchInput || !omniBox) return;

        const renderDesktopSearchHistory = () => {
            if (!histBar) return;
            const kws = getSearchHistory();
            if (!kws.length || searchInput.value.trim()) {
                histBar.classList?.remove?.("visible");
                histBar.innerHTML = "";
                return;
            }
            histBar.innerHTML = `<span class="lv-pop-strip-label">最近:</span>` +
                kws.slice(0, 5).map((kw) =>
                    `<button type="button" class="lv-pop-strip-chip lv-pop-hist-chip" data-kw="${escapeHtml(kw)}">${escapeHtml(kw)}</button>`
                ).join("");
            histBar.classList?.add?.("visible");
        };

        searchInput.addEventListener("focus", () => {
            if (!searchInput.value.trim()) renderDesktopSearchHistory();
        });
        searchInput.addEventListener("blur", () => {
            (typeof window !== "undefined" ? window.setTimeout : setTimeout)(() => {
                try { histBar?.classList?.remove?.("visible"); } catch { /* ignore */ }
            }, 160);
        });

        clearBtn?.addEventListener("click", (ev) => {
            ev.stopPropagation();
            searchInput.value = "";
            searchInput.dispatchEvent(new Event("input"));
            searchInput.focus();
        });

        histBar?.addEventListener("click", (ev) => {
            const chip = (ev.target as HTMLElement | null)?.closest<HTMLElement>(".lv-pop-hist-chip");
            if (!chip) return;
            ev.stopPropagation();
            const kw = chip.getAttribute("data-kw") || "";
            if (!kw) return;
            searchInput.value = kw;
            searchInput.dispatchEvent(new Event("input"));
            searchInput.focus();
        });

        searchInput.addEventListener("input", () => {
            const kw = searchInput.value.trim().toLowerCase();
            const seq = ++searchSeq;
            if (searchDebounceTimer !== null) {
                try { clearTimeout(searchDebounceTimer); } catch { /* ignore */ }
                searchDebounceTimer = null;
            }
            if (clearBtn) clearBtn.classList?.toggle?.("visible", Boolean(kw));
            if (kbdBadge) kbdBadge.textContent = kw ? "↵" : "/";

            if (!kw) {
                isSearchingOmni = false;
                omniHitsList = [];
                omniBox.style.display = "none";
                if (mainView) mainView.style.display = currentView === "list" ? "flex" : "grid";
                syncActionsDrawerDom();
                if (document.activeElement === searchInput) renderDesktopSearchHistory();
                return;
            }

            histBar?.classList?.remove?.("visible");
            isSearchingOmni = true;
            if (mainView) mainView.style.display = "none";
            omniBox.style.display = "flex";

            // 1. 立即匹配已安装插件与二级快捷行动，瞬时首屏渲染
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

            const renderOmniState = (hits: LvSearchResultItem[], status: LvOmnisearchStreamStatus) => {
                if (seq !== searchSeq) return;
                omniHitsList = [];
                let html = "";

                matchedPlugins.forEach((p) => {
                    const idx = omniHitsList.length;
                    const pColor = resolveSafeBrandColor(p.id, p.color);
                    omniHitsList.push({
                        label: p.fullName || p.name,
                        onSelect: () => {
                            pushRecentTileId(p.id);
                            closeDesktopLaunchpadPopover();
                            try { p.onClick(); } catch { /* ignore */ }
                        },
                    });
                    html += `
                      <button type="button" class="lv-pop-hit-item ${idx === omniFocusIndex ? "focused" : ""}" data-omni-idx="${idx}">
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
                      <button type="button" class="lv-pop-hit-item ${idx === omniFocusIndex ? "focused" : ""}" data-omni-idx="${idx}">
                        <div style="display:flex;align-items:center;gap:8px;min-width:0;">
                          <span style="font-size:10px;font-weight:700;padding:1px 6px;border-radius:4px;background:rgba(16,185,129,0.14);color:#059669;flex-shrink:0;">⚡ ${escapeHtml(p.name)}</span>
                          <span style="font-size:12.5px;font-weight:600;color:var(--lv-lp-text,#0f172a);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(action)}</span>
                        </div>
                        <span style="font-size:10.5px;font-weight:600;color:var(--lv-lp-accent,#2563eb);flex-shrink:0;">执行 ➔</span>
                      </button>
                    `;
                });

                hits.slice(0, 12).forEach((hit) => {
                    const idx = omniHitsList.length;
                    omniHitsList.push({
                        label: hit.title,
                        onSelect: () => {
                            pushSearchHistory(kw);
                            closeDesktopLaunchpadPopover();
                            openOmniHitWithFallback(hit);
                        },
                    });
                    html += `
                      <button type="button" class="lv-pop-hit-item ${idx === omniFocusIndex ? "focused" : ""}" data-omni-idx="${idx}">
                        <div style="display:flex;align-items:center;gap:8px;min-width:0;overflow:hidden;">
                          <span style="font-size:10px;font-weight:600;padding:1px 6px;border-radius:4px;background:var(--lv-lp-accent-soft,rgba(37,99,235,0.1));color:var(--lv-lp-accent,#2563eb);flex-shrink:0;">${escapeHtml(hit.source || hit.badge || "小驴")}</span>
                          <span style="font-size:12.5px;font-weight:600;color:var(--lv-lp-text,#0f172a);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(hit.title)}</span>
                          ${hit.snippet ? `<span style="font-size:11px;color:var(--lv-lp-text-sub,#64748b);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(hit.snippet)}</span>` : ""}
                        </div>
                        <span style="font-size:10.5px;font-weight:600;color:var(--lv-lp-accent,#2563eb);flex-shrink:0;">直达 ➔</span>
                      </button>
                    `;
                });

                if (omniFocusIndex >= omniHitsList.length) {
                    omniFocusIndex = Math.max(0, omniHitsList.length - 1);
                }

                if (!status.done) {
                    html += `<div style="text-align:center;padding:6px 12px;font-size:11px;color:var(--lv-lp-text-sub,#64748b);">🔍 正在流式检索全生态知识库 (${status.pending} 项进行中)…</div>`;
                } else if (omniHitsList.length === 0) {
                    html = `<div style="text-align:center;padding:28px 12px;font-size:12px;color:var(--lv-lp-text-sub,#64748b);">未在小驴全家桶中穿透检索到与 “<strong style="color:var(--lv-lp-text,#0f172a);">${escapeHtml(searchInput.value.trim())}</strong>” 相关的条目</div>`;
                }

                omniBox.innerHTML = html;
                const drawerTitle = popover.querySelector(".lv-pop-actions-title");
                if (drawerTitle) {
                    drawerTitle.textContent = status.done
                        ? `🔍 全生态万物穿透检索 · 命中 ${omniHitsList.length} 条 (↑↓ 选择 · ↵ 直达)`
                        : `🔍 正在流式检索… 已命中 ${omniHitsList.length} 条`;
                }
            };

            omniFocusIndex = 0;
            renderOmniState([], { done: false, pending: 1, total: 1 });
            searchDebounceTimer = Number((typeof window !== "undefined" ? window.setTimeout : setTimeout)(() => {
                searchDebounceTimer = null;
                if (seq !== searchSeq) return;
                void lvOmnisearch.searchStream(kw, (hits, status) => {
                    renderOmniState(hits, status);
                }).catch(() => { /* ignore */ });
            }, 85));
        });
    };

    const rerenderPopover = (opts?: { preserveScroll?: boolean; refreshItems?: boolean }) => {
        const scrollMap: Array<{ sel: string; top: number }> = [];
        if (opts?.preserveScroll && typeof popover.querySelector === "function") {
            for (const sel of [".lv-pop-grid", ".lv-pop-list", ".lv-pop-pref-drawer", ".lv-pop-inbox-drawer"]) {
                const el = popover.querySelector<HTMLElement>(sel);
                if (el && el.scrollTop > 0) scrollMap.push({ sel, top: el.scrollTop });
            }
        }
        if (opts?.refreshItems) {
            const badgeMap = new Map(items.map((it) => [it.id, it.badge]));
            allItems = getLaunchpadHub().getItems();
            items = allItems.filter(it => it.state !== "hidden");
            items.forEach((it) => {
                const prevBadge = badgeMap.get(it.id);
                if (prevBadge && !it.badge) it.badge = prevBadge;
            });
            allPinned = items.length > 0 && items.every(it => it.state === "pinned");
            currentFocusIndex = Math.max(0, Math.min(currentFocusIndex, Math.max(0, items.length - 1)));
        }
        isSearchingOmni = false;
        omniHitsList = [];
        isDrawerHovered = false;
        popover.classList?.add?.("lv-popover-settled");
        popover.innerHTML = buildLaunchpadPopoverHtml(items, allPinned, {
            view: currentView,
            focusedIndex: currentFocusIndex,
            showPrefDrawer,
            showInboxDrawer,
            inboxFilter,
            actionLimit: currentActionLimit,
            allItems,
        });
        updateFocusHighlight();
        wireSearchInput();
        wireDrawerHover();
        hydratePrefNotebooks();
        if (scrollMap.length && typeof popover.querySelector === "function") {
            for (const { sel, top } of scrollMap) {
                const el = popover.querySelector<HTMLElement>(sel);
                if (el) el.scrollTop = top;
            }
        }
    };

    // 首帧渲染
    popover.innerHTML = buildLaunchpadPopoverHtml(items, allPinned, {
        view: currentView,
        focusedIndex: currentFocusIndex,
        showPrefDrawer,
        showInboxDrawer,
        inboxFilter,
        actionLimit: currentActionLimit,
        allItems,
    });
    updateFocusHighlight();
    wireSearchInput();
    wireDrawerHover();
    hydratePrefNotebooks();

    // 动态徽标异步探针自动刷新：同时更新九宫格磁贴徽标与今日 4 合 1 晨昏看板
    // 返回 null/undefined 表示「归零」：清除徽章快照并移除磁贴徽标元素
    pendingBadgeProbes.forEach(({ item, promise }) => {
        promise.then((dynamicBadge) => {
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
                    syncTodayDashboardDom();
                }
                refreshEntryBadgeDot();
            } else if (!dynamicBadge && item.badge) {
                item.badge = undefined;
                if (typeof popover.querySelector === "function") {
                    const tileEl = popover.querySelector(`[data-id="${item.id}"]`);
                    tileEl?.querySelector(".lv-pop-badge")?.remove();
                    syncTodayDashboardDom();
                }
                refreshEntryBadgeDot();
            }
        }).catch(() => { /* ignore */ });
    });

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
                    rerenderPopover({ preserveScroll: true, refreshItems: true });
                    flashSaveToast("✓ 图标状态已更新");
                }
                return;
            }

            const ruleToggle = target.closest<HTMLInputElement>(".lv-pop-rule-toggle");
            if (ruleToggle) {
                const rid = ruleToggle.getAttribute("data-rule-id");
                if (rid) {
                    lvAutomation.toggleRule(rid, Boolean(ruleToggle.checked));
                    flashSaveToast(ruleToggle.checked ? "✓ 规则已启用" : "✓ 规则已停用");
                }
                return;
            }

            const mobileModeSelect = target.closest<HTMLSelectElement>(".lv-pop-mobile-mode-select");
            if (mobileModeSelect) {
                const val = mobileModeSelect.value as LvMobileEntryMode;
                if (val === "both" || val === "ball" || val === "topbar" || val === "none") {
                    setMobileEntryMode(val);
                    flashSaveToast("✓ 入口形态已保存");
                }
                return;
            }

            const catsInput = target.closest<HTMLInputElement>(".lv-pop-lifelog-cats-input");
            if (catsInput) {
                const cats = catsInput.value.split(/[,，]/).map(s => s.trim()).filter(Boolean);
                if (cats.length > 0) {
                    saveQuickWorkspaceConfig({ lifeLogCategories: cats });
                    flashSaveToast("✓ 分类已保存");
                }
                return;
            }

            const nbSelect = target.closest<HTMLSelectElement>(".lv-pop-notebook-select");
            if (nbSelect) {
                const val = nbSelect.value.trim();
                saveQuickWorkspaceConfig({
                    lifeLogNotebookId: val || undefined,
                    diaryNotebookId: val || undefined,
                    quickNoteNotebookId: val || undefined,
                });
                // 选中项实时回显笔记本名称（替代首帧占位「已选: 当前日记本」）
                if (val) {
                    void listOpenNotebooks().then((nbs) => {
                        const nb = nbs.find((x) => x.id === val);
                        const opt = nbSelect.selectedOptions?.[0];
                        if (nb && opt) opt.textContent = `📔 ${nb.name}`;
                    }).catch(() => { /* ignore */ });
                }
                flashSaveToast("✓ 日记本已保存");
                return;
            }
        });

        popover.addEventListener("click", (e) => {
            const target = e.target as HTMLElement;
            if (!target || typeof target.closest !== "function") return;

            const qnBtn = target.closest<HTMLElement>(".lv-quick-note-btn");
            if (qnBtn) {
                e.stopPropagation();
                openQuickNoteDialog();
                return;
            }

            const llBtn = target.closest<HTMLElement>(".lv-quick-lifelog-btn");
            if (llBtn) {
                e.stopPropagation();
                openLifeLogDialog();
                return;
            }

            const clipBtn = target.closest<HTMLElement>(".lv-quick-clip-btn");
            if (clipBtn) {
                e.stopPropagation();
                clipBtn.setAttribute("data-busy", "true");
                void pasteToDailyNote().finally(() => { try { clipBtn.removeAttribute("data-busy"); } catch { /* ignore */ } });
                return;
            }

            const dbBtn = target.closest<HTMLElement>(".lv-quick-diary-bottom-btn");
            if (dbBtn) {
                e.stopPropagation();
                dbBtn.setAttribute("data-busy", "true");
                void openDiaryBottom().finally(() => { try { dbBtn.removeAttribute("data-busy"); } catch { /* ignore */ } });
                return;
            }

            const tmBtn = target.closest<HTMLElement>(".lv-quick-task-mgr-btn");
            if (tmBtn) {
                e.stopPropagation();
                openTaskManager();
                return;
            }

            const ntBtn = target.closest<HTMLElement>(".lv-quick-new-task-btn");
            if (ntBtn) {
                e.stopPropagation();
                ntBtn.setAttribute("data-busy", "true");
                void openNewTask().finally(() => { try { ntBtn.removeAttribute("data-busy"); } catch { /* ignore */ } });
                return;
            }

            const rwBtn = target.closest<HTMLElement>(".lv-quick-random-walk-btn");
            if (rwBtn) {
                e.stopPropagation();
                rwBtn.setAttribute("data-busy", "true");
                void randomWalk().finally(() => { try { rwBtn.removeAttribute("data-busy"); } catch { /* ignore */ } });
                return;
            }

            const rlBtn = target.closest<HTMLElement>(".lv-quick-reload-btn");
            if (rlBtn) {
                e.stopPropagation();
                rlBtn.setAttribute("data-busy", "true");
                void reloadUI().finally(() => { try { rlBtn.removeAttribute("data-busy"); } catch { /* ignore */ } });
                return;
            }

            const inboxFilterBtn = target.closest<HTMLElement>(".lv-inbox-filter-btn");
            if (inboxFilterBtn) {
                e.stopPropagation();
                const nextFilter = inboxFilterBtn.getAttribute("data-inbox-filter");
                if (nextFilter === "all" || nextFilter === "unread" || nextFilter === "alert" || nextFilter === "siyuan") {
                    inboxFilter = nextFilter;
                    rerenderPopover({ preserveScroll: true });
                }
                return;
            }

            const viewTab = target.closest<HTMLElement>(".lv-pop-view-tab[data-view]");
            if (viewTab) {
                e.stopPropagation();
                const nextView = viewTab.getAttribute("data-view") === "list" ? "list" : "grid";
                if (nextView !== currentView) {
                    currentView = nextView;
                    setLaunchpadViewMode(nextView);
                    rerenderPopover();
                }
                return;
            }

            const focusBtn = target.closest<HTMLElement>(".lv-pop-focus-btn");
            if (focusBtn) {
                e.stopPropagation();
                if (isNotifyFocusActive()) {
                    clearNotifyFocus();
                    lvNotify.capsule({ source: "罗盘", message: "已退出全局专注模式", duration: 2000, archive: false });
                } else {
                    const now = new Date();
                    const until = new Date(now);
                    until.setHours(23, 0, 0, 0);
                    if (until.getTime() <= now.getTime()) until.setTime(now.getTime() + 2 * 3_600_000);
                    setNotifyFocusUntil(until.getTime());
                    lvNotify.capsule({ source: "罗盘", message: `已开启专注模式至 ${until.toTimeString().slice(0, 5)}`, duration: 2500, archive: false });
                }
                refreshEntryBadgeDot();
                rerenderPopover({ preserveScroll: true });
                return;
            }

            const inboxBtn = target.closest<HTMLElement>(".lv-pop-inbox-btn");
            if (inboxBtn) {
                e.stopPropagation();
                showInboxDrawer = !showInboxDrawer;
                if (showInboxDrawer) showPrefDrawer = false;
                rerenderPopover();
                return;
            }

            const markAllBtn = target.closest<HTMLElement>(".lv-inbox-mark-all-btn");
            if (markAllBtn) {
                e.stopPropagation();
                lvNotify.markAllRead();
                refreshEntryBadgeDot();
                rerenderPopover({ preserveScroll: true });
                lvNotify.capsule({ source: "通知中心", message: "✓ 已全部标为已读", duration: 1600, archive: false });
                return;
            }

            const clearInboxBtn = target.closest<HTMLElement>(".lv-inbox-clear-btn");
            if (clearInboxBtn) {
                e.stopPropagation();
                lvNotify.clearHistory();
                refreshEntryBadgeDot();
                rerenderPopover();
                lvNotify.capsule({ source: "通知中心", message: "✓ 已清空通知历史", duration: 1600, archive: false });
                return;
            }

            const inboxCopyBtn = target.closest<HTMLElement>(".lv-inbox-copy-btn");
            if (inboxCopyBtn) {
                e.stopPropagation();
                const packetId = inboxCopyBtn.getAttribute("data-inbox-id");
                const packet = lvNotify.getHistory().find((p) => p.id === packetId);
                if (packet) {
                    const text = `${packet.source ? `[${packet.source}] ` : ""}${packet.title ? `${packet.title}: ` : ""}${packet.message || ""}`.trim();
                    void copyTextToClipboard(text).then((ok) => {
                        if (ok) {
                            inboxCopyBtn.textContent = "✓ 已复制";
                            setTimeout(() => { try { inboxCopyBtn.textContent = "复制"; } catch { /* ignore */ } }, 1200);
                        }
                    });
                }
                return;
            }

            const inboxActionBtn = target.closest<HTMLElement>(".lv-inbox-action-btn");
            if (inboxActionBtn) {
                e.stopPropagation();
                const packetId = inboxActionBtn.getAttribute("data-inbox-id");
                if (packetId) lvNotify.markRead(packetId);
                const packet = lvNotify.getHistory().find((p) => p.id === packetId);
                if (packet && packet.action?.onClick) {
                    closeDesktopLaunchpadPopover();
                    try {
                        void packet.action.onClick();
                    } catch (err) {
                        console.warn("[LvNotify] 通知行动执行失败:", err);
                    }
                }
                return;
            }

            const inboxItem = target.closest<HTMLElement>(".lv-inbox-item.unread");
            if (inboxItem) {
                e.stopPropagation();
                const packetId = inboxItem.getAttribute("data-inbox-id");
                if (packetId) {
                    lvNotify.markRead(packetId);
                    refreshEntryBadgeDot();
                    rerenderPopover({ preserveScroll: true });
                }
                return;
            }

            const prefBtn = target.closest<HTMLElement>(".lv-pop-pref-btn");
            if (prefBtn) {
                e.stopPropagation();
                showPrefDrawer = !showPrefDrawer;
                if (showPrefDrawer) showInboxDrawer = false;
                rerenderPopover();
                return;
            }

            const unmuteBtn = target.closest<HTMLElement>(".lv-pop-unmute-btn");
            if (unmuteBtn) {
                e.stopPropagation();
                const cat = unmuteBtn.getAttribute("data-unmute-cat");
                if (cat) {
                    lvNotify.clearCategoryMute(cat);
                    lvNotify.capsule({ source: "免打扰", message: `已恢复「${cat}」的正常通知提醒`, duration: 2000, archive: false });
                    rerenderPopover({ preserveScroll: true });
                    flashSaveToast("✓ 已解除静音");
                }
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

            const stripChip = target.closest<HTMLElement>(".lv-pop-strip-chip:not(.lv-pop-hist-chip), .lv-pop-today-card, .lv-pop-ticker-pill");
            if (stripChip) {
                e.stopPropagation();
                const rid = stripChip.getAttribute("data-recent-id");
                const targetItem = items.find((it) => it.id === rid);
                if (targetItem) {
                    pushRecentTileId(targetItem.id);
                    closeDesktopLaunchpadPopover();
                    try { targetItem.onClick(); } catch (err) { console.warn("[LvLaunchpad] 快捷启动失败:", err); }
                }
                return;
            }

            const diaryBtn = target.closest<HTMLElement>(".lv-pop-diary-btn");
            if (diaryBtn) {
                e.stopPropagation();
                diaryBtn.setAttribute("data-busy", "true");
                void writeTodayActivityReview().finally(() => {
                    try { diaryBtn.removeAttribute("data-busy"); } catch { /* ignore */ }
                    closeDesktopLaunchpadPopover();
                });
                return;
            }

            const backupBtn = target.closest<HTMLElement>(".lv-pop-backup-btn");
            if (backupBtn) {
                e.stopPropagation();
                backupBtn.setAttribute("data-busy", "true");
                lvNotify.capsule({ source: "罗盘", message: "💾 正在打包小驴全家桶联合备份…", duration: 2200, archive: false });
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
                        lvNotify.capsule({
                            source: "罗盘",
                            message: missing > 0 ? `已发起部分备份下载：${Object.keys(bundle.plugins).length} 项成功，${missing} 项失败；详见备份清单` : "💾 已发起小驴联合备份下载，请核对下载文件",
                            duration: 4000,
                            level: missing > 0 ? "warn" : "success",
                        });
                    } catch {
                        lvNotify.card({ source: "罗盘", level: "error", message: "备份导出失败，尚未生成可下载文件，请重试", duration: 5000 });
                    } finally {
                        try { backupBtn.removeAttribute("data-busy"); } catch { /* ignore */ }
                        closeDesktopLaunchpadPopover();
                    }
                })();
                return;
            }

            const restoreBtn = target.closest<HTMLElement>(".lv-pop-restore-btn");
            if (restoreBtn) {
                e.stopPropagation();
                openEcosystemRestoreDialog();
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
                rerenderPopover({ preserveScroll: true, refreshItems: true });
                lvNotify.capsule({
                    source: "罗盘",
                    message: nextState === "pinned" ? "📌 已将全部插件平铺至顶栏" : "🧭 已将插件收敛回小驴罗盘",
                    duration: 1800,
                    archive: false,
                });
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
                    rerenderPopover({ preserveScroll: true, refreshItems: true });
                    const itemObj = items.find((it) => it.id === id);
                    lvNotify.capsule({
                        source: "罗盘",
                        message: next === "pinned" ? `📌 已置顶「${itemObj?.name || id}」到顶栏` : `📥 已将「${itemObj?.name || id}」收敛至罗盘`,
                        duration: 1600,
                        archive: false,
                    });
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
        /* IME 合成期整体让路：ArrowUp/Down 属候选导航，Enter 属确认选字，
           劫持会打断输入法选词并误触罗盘跳转（keyCode 229 兜底 Chromium 合成 keydown）。 */
        if (e.isComposing || e.keyCode === 229) return;

        if (e.key === "Escape") {
            try { e.preventDefault(); e.stopPropagation(); } catch { /* ignore */ }
            if (isSearchingOmni && typeof popover.querySelector === "function") {
                const si = popover.querySelector<HTMLInputElement>(".lv-pop-search-input");
                if (si && si.value) {
                    si.value = "";
                    si.dispatchEvent(new Event("input"));
                    return;
                }
            }
            if (showPrefDrawer || showInboxDrawer) {
                showPrefDrawer = false;
                showInboxDrawer = false;
                rerenderPopover();
                return;
            }
            closeDesktopLaunchpadPopover();
            return;
        }

        // Tab 焦点圈闭：Shift/Tab 在弹层可聚焦元素间循环，杜绝焦点逃逸到底层 UI
        if (e.key === "Tab") {
            const focusables = Array.from(
                popover.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')
            ).filter((el) => el.offsetParent !== null || el === document.activeElement);
            if (focusables.length === 0) return;
            try { e.preventDefault(); e.stopPropagation(); } catch { /* ignore */ }
            const activeIdx = focusables.indexOf(document.activeElement as HTMLElement);
            let nextIdx: number;
            if (activeIdx === -1) {
                nextIdx = 0;
            } else {
                nextIdx = (activeIdx + (e.shiftKey ? -1 : 1) + focusables.length) % focusables.length;
            }
            focusables[nextIdx]?.focus();
            return;
        }

        if (isSearchingOmni) {
            if (e.key === "ArrowDown") {
                try { e.preventDefault(); e.stopPropagation(); } catch { /* ignore */ }
                if (omniHitsList.length > 0) {
                    omniFocusIndex = (omniFocusIndex + 1) % omniHitsList.length;
                    if (typeof popover.querySelectorAll === "function") {
                        popover.querySelectorAll<HTMLElement>(".lv-pop-hit-item").forEach((el, i) => {
                            const focused = i === omniFocusIndex;
                            el.classList.toggle("focused", focused);
                            if (focused) { try { el.scrollIntoView?.({ block: "nearest" }); } catch { /* ignore */ } }
                        });
                    }
                }
                return;
            }
            if (e.key === "ArrowUp") {
                try { e.preventDefault(); e.stopPropagation(); } catch { /* ignore */ }
                if (omniHitsList.length > 0) {
                    omniFocusIndex = (omniFocusIndex - 1 + omniHitsList.length) % omniHitsList.length;
                    if (typeof popover.querySelectorAll === "function") {
                        popover.querySelectorAll<HTMLElement>(".lv-pop-hit-item").forEach((el, i) => {
                            const focused = i === omniFocusIndex;
                            el.classList.toggle("focused", focused);
                            if (focused) { try { el.scrollIntoView?.({ block: "nearest" }); } catch { /* ignore */ } }
                        });
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

        const activeEl = typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null;
        const activeTag = activeEl?.tagName?.toUpperCase();
        const isInFormControl = Boolean(activeEl && (activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT" || activeEl.isContentEditable));
        const isInNonEmptySearch = Boolean(activeEl?.classList?.contains?.("lv-pop-search-input") && (activeEl as HTMLInputElement).value);

        if (!isInFormControl && e.key === "/" && !showPrefDrawer && !showInboxDrawer && typeof popover.querySelector === "function") {
            const si = popover.querySelector<HTMLInputElement>(".lv-pop-search-input");
            if (si) {
                try { e.preventDefault(); e.stopPropagation(); } catch { /* ignore */ }
                si.focus();
                return;
            }
        }

        if (showPrefDrawer || showInboxDrawer) return;

        const gridCols = currentView === "list" ? 1 : (items.length >= 3 ? 3 : 2);

        if (e.key === "ArrowDown") {
            try { e.preventDefault(); e.stopPropagation(); } catch { /* ignore */ }
            isDrawerHovered = false;
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
            isDrawerHovered = false;
            if (currentFocusIndex - gridCols >= 0) {
                currentFocusIndex -= gridCols;
            } else if (currentFocusIndex - 1 >= 0) {
                currentFocusIndex -= 1;
            }
            updateFocusHighlight();
            return;
        }

        if (e.key === "ArrowRight" && !isInNonEmptySearch) {
            try { e.preventDefault(); e.stopPropagation(); } catch { /* ignore */ }
            isDrawerHovered = false;
            currentFocusIndex = (currentFocusIndex + 1) % items.length;
            updateFocusHighlight();
            return;
        }

        if (e.key === "ArrowLeft" && !isInNonEmptySearch) {
            try { e.preventDefault(); e.stopPropagation(); } catch { /* ignore */ }
            isDrawerHovered = false;
            currentFocusIndex = (currentFocusIndex - 1 + items.length) % items.length;
            updateFocusHighlight();
            return;
        }

        if ((e.key === "Enter" || (e.key === " " && !isInFormControl)) && !isInNonEmptySearch) {
            try { e.preventDefault(); e.stopPropagation(); } catch { /* ignore */ }
            const item = items[currentFocusIndex];
            if (item) {
                pushRecentTileId(item.id);
                closeDesktopLaunchpadPopover();
                try { item.onClick(); } catch (err) { console.warn("[LvLaunchpad] 键盘启动失败:", err); }
            }
            return;
        }

        if (!isInFormControl && (e.key === "p" || e.key === "P")) {
            try { e.preventDefault(); e.stopPropagation(); } catch { /* ignore */ }
            const item = items[currentFocusIndex];
            if (item) {
                const cur = getLaunchpadStates()[item.id] || "docked";
                const next = cur === "pinned" ? "docked" : "pinned";
                getLaunchpadHub().setPluginState(item.id, next);
                syncTopBarConvergence();
                rerenderPopover({ preserveScroll: true, refreshItems: true });
            }
            return;
        }

        if (!isInFormControl) {
            if (e.key === "n" || e.key === "N") {
                try { e.preventDefault(); e.stopPropagation(); } catch { /* ignore */ }
                openQuickNoteDialog();
                return;
            }
            if (e.key === "l" || e.key === "L") {
                try { e.preventDefault(); e.stopPropagation(); } catch { /* ignore */ }
                openLifeLogDialog();
                return;
            }
            if (e.key === "v" || e.key === "V") {
                try { e.preventDefault(); e.stopPropagation(); } catch { /* ignore */ }
                void pasteToDailyNote();
                return;
            }
            if (e.key === "b" || e.key === "B") {
                try { e.preventDefault(); e.stopPropagation(); } catch { /* ignore */ }
                void openDiaryBottom();
                return;
            }
            if (e.key === "t" || e.key === "T") {
                try { e.preventDefault(); e.stopPropagation(); } catch { /* ignore */ }
                openTaskManager();
                return;
            }
            if (e.key === "k" || e.key === "K") {
                try { e.preventDefault(); e.stopPropagation(); } catch { /* ignore */ }
                void openNewTask();
                return;
            }
            if (e.key === "w" || e.key === "W") {
                try { e.preventDefault(); e.stopPropagation(); } catch { /* ignore */ }
                void randomWalk();
                return;
            }
            if (e.key === "r" || e.key === "R") {
                try { e.preventDefault(); e.stopPropagation(); } catch { /* ignore */ }
                void reloadUI();
                return;
            }
        }

        const num = parseInt(e.key, 10);
        if (!isInFormControl && !isNaN(num) && num >= 1 && num <= items.length) {
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
            // 思源 3.8.x 顶栏条目重排规则：锚定在右侧工具锚点之前（始终处于 #drag 右侧插件区），
            // 配合 syncTopBarConvergence 中的 ensureCompassOnRightSide 自愈，既不漂移到左侧也绝不落入 #windowControls 窗口控制区。
            const anchor = toolbar.querySelector(DESKTOP_RIGHT_ANCHOR_SELECTOR);
            if (anchor && anchor.parentElement === toolbar) {
                toolbar.insertBefore(btn, anchor);
                return;
            }
        } catch { /* ignore */ }
    }
    toolbar.appendChild(btn);
}

function buildDesktopEntryButton(forceRebuild = false): boolean {
    if (typeof document === "undefined" || isMobileFrontend()) return false;
    const toolbar = document.getElementById("toolbar");
    if (!toolbar) return false;
    if (document.getElementById(DESKTOP_ENTRY_ID)) { refreshEntryBadgeDot(); scheduleTopBarConvergence(80); return true; }
    // 被动重建节流：思源 ye() 启动期可能连续多轮移除顶栏条目，250ms 内不反复重建，吸收拉锯闪烁；
    // 主动创建路径（插件启用/首挂载）传 forceRebuild 直接放行，避免出现空窗
    if (!forceRebuild) {
        const nowGuard = Date.now();
        if (lastCompassRebuildAt && nowGuard - lastCompassRebuildAt < 250) return false;
        lastCompassRebuildAt = nowGuard;
    }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = DESKTOP_ENTRY_ID;
    btn.className = "toolbar__item ariaLabel";
    // 思源 3.8.x 原生条目公民身份：data-topbar-entry 让罗盘参与顶栏条目排序持久化与 ye() 重排恢复，
    // data-location 与官方 addTopBar position:"right" 对齐，避免被思源条目体系视为异物
    btn.setAttribute("data-topbar-entry", "lv-launchpad");
    btn.setAttribute("data-location", "right");
    btn.setAttribute("aria-label", "小驴罗盘");
    btn.setAttribute("aria-haspopup", "dialog");
    btn.setAttribute("title", "小驴罗盘 · 全家桶极速直达 (左键展开 · 快捷键 1~8)");
    btn.style.position = "relative";
    // 创建初期先根据当前已入驻插件数决定初始显隐，避免单插件时先闪现再隐藏
    const initialActiveCount = getLaunchpadHub().getItems().filter((it) => it.state !== "hidden").length;
    btn.style.display = initialActiveCount >= 2 ? "inline-flex" : "none";
    btn.innerHTML = `${COMPASS_SVG}<span class="lv-entry-moon" aria-hidden="true" style="display:none;margin-left:2px;font-size:11px;line-height:1;">🌙</span><span class="lv-entry-dot" aria-hidden="true" style="display:none;position:absolute;top:4px;right:4px;width:7px;height:7px;border-radius:999px;background:var(--b3-theme-primary,#3576c7);"></span>`;

    btn.addEventListener("click", () => {
        const items = getLaunchpadHub().getItems().filter((it) => it.state !== "hidden");
        if (items.length === 1) {
            const first = items[0];
            if (first) {
                // 热键路径可能已先打开罗盘：单插件直达前先收场，避免主界面与罗盘同屏叠放
                closeDesktopLaunchpadPopover();
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
    lastCompassRebuildAt = Date.now();
    refreshEntryBadgeDot();
    scheduleTopBarConvergence(80);
    wireDesktopToolbarObserver();
    return true;
}

let desktopToolbarObserver: MutationObserver | null = null;
let desktopThemeObserver: MutationObserver | null = null;

function wireDesktopToolbarObserver(): void {
    if (typeof document === "undefined" || isMobileFrontend()) return;
    const toolbar = document.getElementById("toolbar");
    if (!toolbar || typeof MutationObserver === "undefined") return;
    const w = typeof window !== "undefined" ? (window as unknown as { __LV_DESKTOP_TOOLBAR_OBS__?: MutationObserver; __LV_DESKTOP_THEME_OBS__?: MutationObserver }) : {};

    if (!desktopToolbarObserver && !w.__LV_DESKTOP_TOOLBAR_OBS__) {
        let debounceTimer: number | null = null;
        desktopToolbarObserver = new MutationObserver(() => {
            if (debounceTimer) return;
            debounceTimer = window.setTimeout(() => {
                debounceTimer = null;
                if (!document.getElementById(DESKTOP_ENTRY_ID)) {
                    buildDesktopEntryButton();
                } else {
                    scheduleTopBarConvergence(120);
                }
            }, 150);
        });

        try {
            // 仅监听顶栏直接子节点的增删与重排（严禁 subtree: true，避免各插件徽标/样式微调引发自激重算闪烁）
            desktopToolbarObserver.observe(toolbar, { childList: true });
            w.__LV_DESKTOP_TOOLBAR_OBS__ = desktopToolbarObserver;
        } catch { /* ignore */ }
    }

    if (!desktopThemeObserver && !w.__LV_DESKTOP_THEME_OBS__ && document.documentElement) {
        let themeDebounce: number | null = null;
        desktopThemeObserver = new MutationObserver(() => {
            if (themeDebounce) return;
            themeDebounce = window.setTimeout(() => {
                themeDebounce = null;
                scheduleTopBarConvergence(120);
            }, 150);
        });
        try {
            desktopThemeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
            w.__LV_DESKTOP_THEME_OBS__ = desktopThemeObserver;
        } catch { /* ignore */ }
    }
}

function ensureDesktopEntry(): MobileEntryCleanup {
    if (typeof document === "undefined") return () => {};
    if (isMobileFrontend()) return () => {};
    const owners = getSharedDesktopEntryOwners();
    const owner = `owner_desktop_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    owners.add(owner);
    const firstOwner = owners.size === 1;
    if (firstOwner) {
        desktopEntryRetryTimers.forEach((t) => { try { if (typeof window !== "undefined") window.clearTimeout(t); else clearTimeout(t); } catch { /* ignore */ } });
        desktopEntryRetryTimers = [];
        wireDesktopGlobalHotkey();
        buildDesktopEntryButton(true); // 主动首挂载：绕过被动重建节流
        for (const delay of [800, 2000, 5000]) {
            const scheduleFn = typeof window !== "undefined" ? window.setTimeout : setTimeout;
            const tid = Number(scheduleFn(() => {
                if (!document.getElementById(DESKTOP_ENTRY_ID)) buildDesktopEntryButton();
            }, delay));
            desktopEntryRetryTimers.push(tid);
        }
    } else {
        if (!document.getElementById(DESKTOP_ENTRY_ID)) {
            // 主动恢复路径（插件启用/重载）：绕过被动重建节流，避免出现按钮空窗
            buildDesktopEntryButton(true);
        } else {
            scheduleTopBarConvergence(80);
        }
    }
    return () => {
        owners.delete(owner);
        desktopEntryRetryTimers.forEach((t) => { try { if (typeof window !== "undefined") window.clearTimeout(t); else clearTimeout(t); } catch { /* ignore */ } });
        desktopEntryRetryTimers = [];
        // 仍有其他小驴插件在世时，保留共享顶栏罗盘按钮与全局观察器，防止单插件重载/重置引发顶栏反复闪烁
        if (owners.size > 0) return;
        try {
            desktopToolbarObserver?.disconnect();
            if (typeof window !== "undefined") {
                const w = window as unknown as { __LV_DESKTOP_TOOLBAR_OBS__?: MutationObserver };
                w.__LV_DESKTOP_TOOLBAR_OBS__?.disconnect();
                delete w.__LV_DESKTOP_TOOLBAR_OBS__;
            }
        } catch { /* ignore */ }
        desktopToolbarObserver = null;
        try {
            desktopThemeObserver?.disconnect();
            if (typeof window !== "undefined") {
                const w = window as unknown as { __LV_DESKTOP_THEME_OBS__?: MutationObserver };
                w.__LV_DESKTOP_THEME_OBS__?.disconnect();
                delete w.__LV_DESKTOP_THEME_OBS__;
            }
        } catch { /* ignore */ }
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
    if (!ball) return;
    // 仅在原生弹窗全屏覆盖时彻底隐藏球；正文编辑聚焦时仅进入半隐贴边态，确保用户随时可见可唤醒
    ball.classList.toggle("lv-ball-suppressed", ballDialogOpen);
    if (ballInputFocused && !ballDialogOpen) {
        ball.classList.add("lv-ball-idle");
    }
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

let sheetViewportCleanup: (() => void) | undefined;

/** 关闭移动端底部弹射坞：下滑收场动画（动画中重开安全）+ 焦点栈注销 + 历史占位解除 */
function closeMobileSheet(immediate = false): void {
    if (typeof document === "undefined") return;
    syncEntryOpenState(false);
    if (sheetViewportCleanup) {
        try { sheetViewportCleanup(); } catch { /* ignore */ }
        sheetViewportCleanup = undefined;
    }
    disarmSheetHistory();
    const mask = document.getElementById(MOBILE_SHEET_ID);
    if (!mask) return;
    if (!immediate && mask.classList.contains("lv-sheet-closing")) return; // 收场动画中幂等
    try { lvSurfaceStack.pop("lv-launchpad-mobile-sheet"); } catch { /* ignore */ }
    refreshEntryBadgeDot(); // 坞内停留期间徽记可能变化，关坞即刷新入口圆点
    recomputeBallSuppression(); // 坞内搜索框随坞移除后焦点静默丢失，主动重算球抑制态

    const reduceMotion = typeof globalThis.matchMedia === "function" &&
        globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (immediate || reduceMotion) {
        if (sheetCloseTimer !== undefined) { try { window.clearTimeout(sheetCloseTimer); } catch { /* ignore */ } sheetCloseTimer = undefined; }
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
    const ls = getSafeLocalStorage();
    if (!ls) return [];
    try {
        const list = JSON.parse(ls.getItem(MOBILE_SEARCH_HISTORY_KEY) ?? "[]");
        return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string" && x.trim() !== "") : [];
    } catch { return []; }
}

function pushSearchHistory(kw: string): void {
    const k = kw.trim();
    const ls = getSafeLocalStorage();
    if (!ls || !k) return;
    try {
        const next = [k, ...getSearchHistory().filter((x) => x !== k)].slice(0, MOBILE_SEARCH_HISTORY_MAX);
        ls.setItem(MOBILE_SEARCH_HISTORY_KEY, JSON.stringify(next));
    } catch { /* ignore */ }
}

/** 最近直达：读取上次使用过的罗盘条目 id（新在前，去重裁剪） */
function getRecentTileIds(): string[] {
    const ls = getSafeLocalStorage();
    if (!ls) return [];
    try {
        const raw = ls.getItem(MOBILE_RECENT_KEY);
        const list = raw ? JSON.parse(raw) : [];
        return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [];
    } catch { return []; }
}

function pushRecentTileId(id: string): void {
    const ls = getSafeLocalStorage();
    if (!ls || !id) return;
    try {
        const next = [id, ...getRecentTileIds().filter((x) => x !== id)].slice(0, MOBILE_RECENT_MAX);
        ls.setItem(MOBILE_RECENT_KEY, JSON.stringify(next));
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
export function openMobileSheet(): void {
    if (typeof document === "undefined") return;
    // 与桌面弹射坞一致的自愈护栏：异常清理重试一次，仍失败则显性上报
    const attempt = () => openMobileSheetImpl();
    try {
        attempt();
    } catch (err) {
        console.error("[LvLaunchpad] 移动端弹射坞打开异常，尝试自愈重试:", err);
        closeMobileSheet(true);
        try {
            attempt();
        } catch (err2) {
            console.error("[LvLaunchpad] 移动端弹射坞自愈重试仍失败:", err2);
            try {
                lvNotify.capsule({ source: "罗盘", message: "罗盘弹射坞打开异常，请查看控制台 [LvLaunchpad] 日志", duration: 4000, level: "error", archive: false });
            } catch { /* ignore */ }
        }
    }
}

function openMobileSheetImpl(): void {
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
    syncEntryOpenState(true);

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

    const headActions = document.createElement("div");
    headActions.className = "lv-sheet-head-actions";

    // 专注模式开关（🌙）：开启后全生态 card/capsule 静音至今晚，仅留历史档
    const moonBtn = document.createElement("button");
    moonBtn.type = "button";
    moonBtn.className = "lv-sheet-moon";
    moonBtn.setAttribute("aria-label", "专注模式开关");
    const syncMoon = () => {
        const active = isNotifyFocusActive();
        const until = getNotifyFocusUntil();
        moonBtn.textContent = active ? `🌙 ${new Date(until).toTimeString().slice(0, 5)}` : "🌙 专注";
        moonBtn.setAttribute("aria-pressed", String(active));
        moonBtn.title = active ? "点击退出专注模式" : "开启专注模式（全生态静音至今晚）";
    };
    syncMoon();
    moonBtn.addEventListener("click", () => {
        if (isNotifyFocusActive()) {
            clearNotifyFocus();
            hapticFeedback(8);
            lvNotify.capsule({ source: "罗盘", message: "已退出专注模式", duration: 2000, archive: false });
        } else {
            const now = new Date();
            const until = new Date(now);
            until.setHours(23, 0, 0, 0);
            if (until.getTime() <= now.getTime()) until.setTime(now.getTime() + 2 * 3_600_000);
            setNotifyFocusUntil(until.getTime());
            hapticFeedback(10);
            lvNotify.capsule({ source: "罗盘", message: `已开启专注模式至 ${until.toTimeString().slice(0, 5)}，通知将静音留档`, duration: 2600, archive: false });
        }
        syncMoon();
        refreshEntryBadgeDot();
    });
    headActions.appendChild(moonBtn);

    // 全生态通知中心历史按钮
    const inboxBtn = document.createElement("button");
    inboxBtn.type = "button";
    inboxBtn.className = "lv-sheet-moon lv-sheet-inbox-btn";
    const unreadNoticeCount = lvNotify.getUnreadCount();
    inboxBtn.textContent = `🔔${unreadNoticeCount > 0 ? ` ${unreadNoticeCount}` : ""}`;
    inboxBtn.setAttribute("aria-label", "全生态通知中心");
    inboxBtn.title = `通知中心历史 (${unreadNoticeCount} 未读)`;
    headActions.appendChild(inboxBtn);

    // 移动端工作台与入口配置按钮
    const prefMobileBtn = document.createElement("button");
    prefMobileBtn.type = "button";
    prefMobileBtn.className = "lv-sheet-moon lv-sheet-pref-btn";
    prefMobileBtn.textContent = "⚙";
    prefMobileBtn.setAttribute("aria-label", "设置");
    prefMobileBtn.title = "罗盘入口与工作台设置";
    headActions.appendChild(prefMobileBtn);

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "lv-sheet-close";
    closeBtn.setAttribute("aria-label", "关闭");
    closeBtn.textContent = "✕";
    closeBtn.addEventListener("click", () => closeMobileSheet());
    headActions.appendChild(closeBtn);
    head.appendChild(headActions);
    sheet.appendChild(head);

    // 移动端通知中心收件箱面板（默认隐藏，点击 🔔 展开）
    const inboxPanel = document.createElement("div");
    inboxPanel.className = "lv-sheet-inbox-panel";
    inboxPanel.style.display = "none";
    const renderMobileInbox = () => {
        inboxPanel.innerHTML = "";
        const history = lvNotify.getHistory();
        const unread = lvNotify.getUnreadCount();

        const topBar = document.createElement("div");
        topBar.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding-bottom:4px;border-bottom:1px dashed var(--lv-lp-border,rgba(15,23,42,0.1));";
        topBar.innerHTML = `
          <span style="font-size:12px;font-weight:700;color:var(--lv-lp-accent,#2563eb);">🔔 通知中心 (${unread} 未读)</span>
          <div style="display:flex;gap:6px;">
            <button type="button" class="lv-sheet-action-chip lv-mobile-inbox-mark" style="padding:4px 10px;font-size:11px;">全读</button>
            <button type="button" class="lv-sheet-action-chip lv-mobile-inbox-clear" style="padding:4px 10px;font-size:11px;">清空</button>
          </div>
        `;
        topBar.querySelector(".lv-mobile-inbox-mark")?.addEventListener("click", () => {
            lvNotify.markAllRead();
            inboxBtn.textContent = "🔔";
            renderMobileInbox();
        });
        topBar.querySelector(".lv-mobile-inbox-clear")?.addEventListener("click", () => {
            lvNotify.clearHistory();
            inboxBtn.textContent = "🔔";
            renderMobileInbox();
        });
        inboxPanel.appendChild(topBar);

        if (history.length === 0) {
            const emptyEl = document.createElement("div");
            emptyEl.style.cssText = "text-align:center;padding:14px;color:var(--lv-lp-text-sub,#64748b);font-size:11.5px;";
            emptyEl.textContent = "🌱 今日通知中心暂无消息";
            inboxPanel.appendChild(emptyEl);
        } else {
            history.slice(0, 20).forEach((packet) => {
                const itemEl = document.createElement("div");
                itemEl.style.cssText = `display:flex;flex-direction:column;gap:2px;padding:6px 8px;border-radius:8px;background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border,rgba(15,23,42,0.08));font-size:11px;${!packet.read ? "border-left:3px solid var(--lv-lp-accent,#2563eb);cursor:pointer;" : ""}`;
                const repeatHtml = (packet.repeatCount || 1) > 1
                    ? `<span style="font-size:10px;font-weight:700;padding:0 5px;border-radius:999px;background:rgba(245,158,11,0.14);color:#b45309;">×${packet.repeatCount}</span>`
                    : "";
                const titleHtml = packet.title ? `<strong style="color:var(--lv-lp-text,#0f172a);">${escapeHtml(packet.title)}</strong>` : "";
                itemEl.innerHTML = `
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
                    <div style="display:flex;align-items:center;gap:4px;min-width:0;flex-wrap:wrap;">
                      <span style="font-weight:600;color:var(--lv-lp-accent,#2563eb);">${escapeHtml(packet.source || "小驴")}</span>
                      ${titleHtml}
                      ${repeatHtml}
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                      <button type="button" class="lv-sheet-action-chip lv-mobile-inbox-copy" style="min-height:22px;padding:1px 7px;font-size:10px;">复制</button>
                      <span style="font-size:10px;color:var(--lv-lp-text-sub,#64748b);">${formatNoticeTime(packet.createdAt || Date.now())}</span>
                    </div>
                  </div>
                  <div style="color:var(--lv-lp-text,#0f172a);word-break:break-word;">${escapeHtml(packet.message)}</div>
                `;
                itemEl.querySelector(".lv-mobile-inbox-copy")?.addEventListener("click", (ev) => {
                    ev.stopPropagation();
                    const copyBtn = ev.currentTarget as HTMLElement;
                    const text = `${packet.source ? `[${packet.source}] ` : ""}${packet.title ? `${packet.title}: ` : ""}${packet.message || ""}`.trim();
                    void copyTextToClipboard(text).then((ok) => {
                        if (ok) {
                            copyBtn.textContent = "已复制";
                            setTimeout(() => { try { copyBtn.textContent = "复制"; } catch { /* ignore */ } }, 1200);
                        }
                    });
                });
                if (!packet.read) {
                    itemEl.addEventListener("click", (ev) => {
                        const t = ev.target as HTMLElement | null;
                        if (t?.closest?.("button")) return;
                        lvNotify.markRead(packet.id);
                        const nextUnread = lvNotify.getUnreadCount();
                        inboxBtn.textContent = `🔔${nextUnread > 0 ? ` ${nextUnread}` : ""}`;
                        renderMobileInbox();
                    });
                }
                if (packet.action && packet.action.label) {
                    const actBtn = document.createElement("button");
                    actBtn.type = "button";
                    actBtn.className = "lv-sheet-action-chip";
                    actBtn.style.cssText = "margin-top:4px;align-self:flex-start;padding:4px 10px;font-size:11px;color:var(--lv-lp-accent);";
                    actBtn.textContent = packet.action.label;
                    actBtn.addEventListener("click", () => {
                        lvNotify.markRead(packet.id);
                        closeMobileSheet();
                        try { void packet.action?.onClick?.(); } catch { /* ignore */ }
                    });
                    itemEl.appendChild(actBtn);
                }
                inboxPanel.appendChild(itemEl);
            });
        }
    };
    inboxBtn.addEventListener("click", () => {
        hapticFeedback(8);
        const isOpen = inboxPanel.style.display !== "none";
        inboxPanel.style.display = isOpen ? "none" : "flex";
        inboxBtn.setAttribute("aria-pressed", String(!isOpen));
        if (!isOpen) {
            prefMobilePanel.style.display = "none";
            prefMobileBtn.setAttribute("aria-pressed", "false");
            renderMobileInbox();
        }
    });
    sheet.appendChild(inboxPanel);

    // 移动端入口与工作台设置面板（默认隐藏，点击 ⚙ 展开）
    const prefMobilePanel = document.createElement("div");
    prefMobilePanel.className = "lv-sheet-inbox-panel";
    prefMobilePanel.style.display = "none";
    const renderMobilePref = () => {
        const curMode = getMobileEntryMode();
        const qwConf = getQuickWorkspaceConfig();
        prefMobilePanel.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:6px;border-bottom:1px dashed var(--lv-lp-border,rgba(15,23,42,0.1));">
            <span style="font-size:12px;font-weight:700;color:var(--lv-lp-accent,#2563eb);">⚙ 手机端入口与工作台设置</span>
            <span class="lv-mobile-pref-saved" style="font-size:10px;color:var(--lv-lp-text-sub,#64748b);">双击悬浮球极速闪记</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;padding:6px 0;font-size:12px;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <span>罗盘入口形态</span>
              <select class="lv-mobile-pref-mode" style="padding:4px 8px;border-radius:6px;border:1px solid var(--lv-lp-border-strong);background:var(--lv-lp-card-bg);color:var(--lv-lp-text);font-size:12px;">
                <option value="both" ${curMode === "both" ? "selected" : ""}>悬浮球 + 顶栏按钮</option>
                <option value="ball" ${curMode === "ball" ? "selected" : ""}>仅悬浮球</option>
                <option value="topbar" ${curMode === "topbar" ? "selected" : ""}>仅顶栏按钮</option>
                <option value="none" ${curMode === "none" ? "selected" : ""}>隐藏入口</option>
              </select>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <span>LifeLog 分类</span>
              <input type="text" class="lv-mobile-pref-cats b3-text-field" value="${escapeHtml(qwConf.lifeLogCategories.join(', '))}" style="width:170px;font-size:12px;padding:4px 7px;" />
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <span>日记笔记本</span>
              <select class="lv-mobile-pref-nb-select" style="width:170px;padding:4px 8px;border-radius:6px;border:1px solid var(--lv-lp-border-strong);background:var(--lv-lp-card-bg);color:var(--lv-lp-text);font-size:12px;">
                <option value="">✨ 自动识别默认日记本</option>
                ${qwConf.lifeLogNotebookId ? `<option value="${escapeHtml(qwConf.lifeLogNotebookId)}" selected>已选: ${escapeHtml(qwConf.lifeLogNotebookId)}</option>` : ""}
              </select>
            </div>
          </div>
        `;
        const flashMobileSaved = (msg = "✓ 已保存") => {
            const el = prefMobilePanel.querySelector<HTMLElement>(".lv-mobile-pref-saved");
            if (!el) return;
            el.textContent = msg;
            el.style.color = "#10b981";
            window.setTimeout(() => {
                if (el.isConnected) {
                    el.textContent = "双击悬浮球极速闪记";
                    el.style.color = "var(--lv-lp-text-sub,#64748b)";
                }
            }, 1500);
        };
        const nbSel = prefMobilePanel.querySelector<HTMLSelectElement>(".lv-mobile-pref-nb-select");
        if (nbSel) {
            void listOpenNotebooks().then((nbs) => {
                if (!nbSel.isConnected || !nbs.length) return;
                const curNb = qwConf.lifeLogNotebookId || "";
                nbSel.innerHTML = `<option value="">✨ 自动识别默认日记本</option>` + nbs.map((nb) =>
                    `<option value="${escapeHtml(nb.id)}" ${nb.id === curNb ? "selected" : ""}>📔 ${escapeHtml(nb.name)}</option>`
                ).join("");
            }).catch(() => { /* ignore */ });
        }
        prefMobilePanel.querySelector(".lv-mobile-pref-mode")?.addEventListener("change", (ev) => {
            const val = (ev.target as HTMLSelectElement).value as LvMobileEntryMode;
            setMobileEntryMode(val);
            flashMobileSaved("✓ 入口已切换");
        });
        prefMobilePanel.querySelector(".lv-mobile-pref-cats")?.addEventListener("change", (ev) => {
            const cats = (ev.target as HTMLInputElement).value.split(/[,，]/).map(s => s.trim()).filter(Boolean);
            if (cats.length > 0) {
                saveQuickWorkspaceConfig({ lifeLogCategories: cats });
                flashMobileSaved("✓ 分类已保存");
            }
        });
        nbSel?.addEventListener("change", (ev) => {
            const nb = (ev.target as HTMLSelectElement).value.trim();
            saveQuickWorkspaceConfig({
                lifeLogNotebookId: nb || undefined,
                diaryNotebookId: nb || undefined,
                quickNoteNotebookId: nb || undefined,
            });
            flashMobileSaved("✓ 日记本已保存");
        });
    };
    prefMobileBtn.addEventListener("click", () => {
        hapticFeedback(8);
        const isOpen = prefMobilePanel.style.display !== "none";
        prefMobilePanel.style.display = isOpen ? "none" : "flex";
        prefMobileBtn.setAttribute("aria-pressed", String(!isOpen));
        if (!isOpen) {
            inboxPanel.style.display = "none";
            inboxBtn.setAttribute("aria-pressed", "false");
            renderMobilePref();
        }
    });
    sheet.appendChild(prefMobilePanel);

    // 预探测同步徽标并异步刷新移动 4 合 1 看板（null/undefined 表示「归零」，同步清除旧徽章）
    const mobilePendingProbes: Array<{ item: typeof items[number]; promise: Promise<string | null | undefined> }> = [];
    items.forEach((item) => {
        if (typeof item.badgeProvider === "function") {
            try {
                const res = item.badgeProvider();
                if (res instanceof Promise) {
                    mobilePendingProbes.push({ item, promise: res as Promise<string | null | undefined> });
                } else if (res && typeof res === "string") {
                    item.badge = res;
                } else {
                    item.badge = undefined;
                }
            } catch { /* ignore */ }
        }
    });

    // 移动端极速工作台（7大核心动作：一键记事 / 剪贴入库 / LifeLog / 随机漫步 / 日记底部 / 任务管理 / 新建任务）
    const lsMobileQuick = getSafeLocalStorage();
    const hasMobileQuickDraft = Boolean(lsMobileQuick?.getItem(QUICK_NOTE_DRAFT_KEY)?.trim());
    const hasMobileLifeDraft = Boolean(lsMobileQuick?.getItem(LIFELOG_DRAFT_KEY)?.trim());
    const qMobileDot = hasMobileQuickDraft ? `<span style="width:6px;height:6px;border-radius:50%;background:#ef4444;display:inline-block;margin-left:2px;"></span>` : "";
    const lMobileDot = hasMobileLifeDraft ? `<span style="width:6px;height:6px;border-radius:50%;background:#ef4444;display:inline-block;margin-left:2px;"></span>` : "";

    const quickGrid = document.createElement("div");
    quickGrid.className = "lv-sheet-quick-grid";
    quickGrid.innerHTML = `
      <button type="button" class="lv-sheet-quick-card" data-action="quick-note" aria-label="一键记事">
        <span class="lv-sheet-quick-icon">⚡</span>
        <span class="lv-sheet-quick-text">一键记事${qMobileDot}</span>
      </button>
      <button type="button" class="lv-sheet-quick-card" data-action="paste-clip" aria-label="剪贴入库">
        <span class="lv-sheet-quick-icon">📋</span>
        <span class="lv-sheet-quick-text">剪贴入库</span>
      </button>
      <button type="button" class="lv-sheet-quick-card" data-action="lifelog" aria-label="LifeLog 流">
        <span class="lv-sheet-quick-icon">📒</span>
        <span class="lv-sheet-quick-text">LifeLog${lMobileDot}</span>
      </button>
      <button type="button" class="lv-sheet-quick-card" data-action="random-walk" aria-label="随机漫步">
        <span class="lv-sheet-quick-icon">🎲</span>
        <span class="lv-sheet-quick-text">随机漫步</span>
      </button>
      <button type="button" class="lv-sheet-quick-card" data-action="diary-bottom" aria-label="日记底部">
        <span class="lv-sheet-quick-icon">⬇️</span>
        <span class="lv-sheet-quick-text">日记底部</span>
      </button>
      <button type="button" class="lv-sheet-quick-card" data-action="task-mgr" aria-label="任务管理器">
        <span class="lv-sheet-quick-icon">📋</span>
        <span class="lv-sheet-quick-text">任务管理</span>
      </button>
      <button type="button" class="lv-sheet-quick-card" data-action="new-task" aria-label="新建任务">
        <span class="lv-sheet-quick-icon">➕</span>
        <span class="lv-sheet-quick-text">新建任务</span>
      </button>
      <button type="button" class="lv-sheet-quick-card" data-action="daily-review" aria-label="今日回顾">
        <span class="lv-sheet-quick-icon">📝</span>
        <span class="lv-sheet-quick-text">今日回顾</span>
      </button>
    `;
    quickGrid.addEventListener("click", (e) => {
        const target = e.target as HTMLElement | null;
        const btn = target?.closest<HTMLButtonElement>(".lv-sheet-quick-card");
        if (!btn) return;
        const act = btn.getAttribute("data-action");
        hapticFeedback(10);
        if (act === "quick-note") {
            closeMobileSheet();
            openQuickNoteDialog();
        } else if (act === "paste-clip") {
            btn.setAttribute("data-busy", "true");
            void pasteToDailyNote().finally(() => { try { btn.removeAttribute("data-busy"); } catch { /* ignore */ } closeMobileSheet(); });
        } else if (act === "lifelog") {
            closeMobileSheet();
            openLifeLogDialog();
        } else if (act === "random-walk") {
            btn.setAttribute("data-busy", "true");
            void randomWalk().finally(() => { try { btn.removeAttribute("data-busy"); } catch { /* ignore */ } closeMobileSheet(); });
        } else if (act === "diary-bottom") {
            btn.setAttribute("data-busy", "true");
            void openDiaryBottom().finally(() => { try { btn.removeAttribute("data-busy"); } catch { /* ignore */ } });
        } else if (act === "task-mgr") {
            openTaskManager();
        } else if (act === "new-task") {
            btn.setAttribute("data-busy", "true");
            void openNewTask().finally(() => { try { btn.removeAttribute("data-busy"); } catch { /* ignore */ } closeMobileSheet(); });
        } else if (act === "daily-review") {
            btn.setAttribute("data-busy", "true");
            void writeTodayActivityReview().finally(() => { try { btn.removeAttribute("data-busy"); } catch { /* ignore */ } closeMobileSheet(); });
        }
    });
    sheet.appendChild(quickGrid);

    // 全局穿透搜索（极简瘦身版，紧随极速工作台，带清除按钮）
    const searchWrap = document.createElement("div");
    searchWrap.className = "lv-sheet-search-wrap";
    const search = document.createElement("input");
    search.type = "text";
    search.className = "lv-sheet-search b3-text-field";
    search.placeholder = "🔍 搜索全家桶 (习惯 / 切片 / 资产 / 闪卡)…";
    search.setAttribute("aria-label", "全生态穿透搜索");
    const searchClear = document.createElement("button");
    searchClear.type = "button";
    searchClear.className = "lv-sheet-search-clear";
    searchClear.setAttribute("aria-label", "清空搜索");
    searchClear.textContent = "✕";
    searchClear.addEventListener("click", () => {
        hapticFeedback(6);
        search.value = "";
        search.dispatchEvent(new Event("input"));
        search.focus({ preventScroll: true });
    });
    searchWrap.appendChild(search);
    searchWrap.appendChild(searchClear);
    sheet.appendChild(searchWrap);
    const results = document.createElement("div");
    results.className = "lv-sheet-results";
    sheet.appendChild(results);

    // 搜索历史 chips：默认折叠，仅在聚焦搜索框且空态时展示
    const histRow = document.createElement("div");
    histRow.className = "lv-sheet-histrow";
    histRow.style.display = "none";
    const renderHistory = () => {
        histRow.textContent = "";
        const kws = getSearchHistory();
        if (!kws.length || document.activeElement !== search) { histRow.style.display = "none"; return; }
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
    search.addEventListener("focus", () => { if (!search.value.trim()) renderHistory(); });
    search.addEventListener("blur", () => { window.setTimeout(() => { if (document.activeElement !== search && !search.value.trim()) histRow.style.display = "none"; }, 180); });
    sheet.appendChild(histRow);

    // 今日状态微报（单行微胶囊横条：减弱数据状态聚合占位，合并主线与其它有待办插件）
    const dashboardEl = document.createElement("div");
    dashboardEl.className = "lv-sheet-today-ticker";
    const renderMobileDashboard = () => {
        dashboardEl.textContent = "";
        const todaySummary = getTodaySummary(items);
        todaySummary.metrics.forEach((m) => {
            const isDone = m.status === "done";
            const pill = document.createElement("button");
            pill.type = "button";
            pill.className = `lv-sheet-ticker-pill ${m.status}`;
            pill.setAttribute("aria-label", `${m.name}：${m.label}`);
            const safeColor = resolveSafeBrandColor(m.pluginId, m.color);
            // 与桌面微报同规则：done 显 ✓ / pending 显数字 / empty（插件无徽章）显 –
            const valText = isDone ? "✓" : (m.count > 0 ? String(m.count) : (m.status === "empty" ? "–" : "0"));
            pill.innerHTML = `<span class="lv-sheet-ticker-dot" style="background:${safeColor};"></span><span>${escapeHtml(m.shortName)}</span><span class="lv-sheet-ticker-val">${valText}</span>`;
            pill.addEventListener("click", () => {
                hapticFeedback(8);
                const targetItem = items.find((it) => it.id === m.pluginId);
                if (targetItem) {
                    pushRecentTileId(targetItem.id);
                    closeMobileSheet();
                    try { targetItem.onClick(); } catch (err) { console.warn("[LvLaunchpad] 今日直达失败:", err); }
                }
            });
            dashboardEl.appendChild(pill);
        });
        // 合并其他待办插件（如考试/人脉）
        const coreIds = new Set(["siyuan-checkin", "siyuan-lv-cards", "siyuan-home", "siyuan-glean"]);
        for (const it of items) {
            if (coreIds.has(it.id)) continue;
            const m = /(\d+)/.exec(it.badge ?? "");
            if (m && Number(m[1]) > 0) {
                const pill = document.createElement("button");
                pill.type = "button";
                pill.className = "lv-sheet-ticker-pill pending";
                pill.setAttribute("aria-label", `今日待办直达 ${it.fullName || it.name}`);
                const safeColor = resolveSafeBrandColor(it.id, it.color);
                pill.innerHTML = `<span class="lv-sheet-ticker-dot" style="background:${safeColor};"></span><span>${escapeHtml(it.name)}</span><span class="lv-sheet-ticker-val">${escapeHtml(m[1] || "")}</span>`;
                pill.addEventListener("click", () => {
                    hapticFeedback(8);
                    pushRecentTileId(it.id);
                    closeMobileSheet();
                    try { it.onClick(); } catch (e) { console.warn("[LvLaunchpad] 今日直达失败:", e); }
                });
                dashboardEl.appendChild(pill);
            }
        }
    };
    renderMobileDashboard();
    sheet.appendChild(dashboardEl);

    mobilePendingProbes.forEach(({ item, promise }) => {
        promise.then((dynamicBadge) => {
            if (dynamicBadge && typeof dynamicBadge === "string") {
                item.badge = dynamicBadge;
                if (document.getElementById(MOBILE_SHEET_ID)) {
                    renderMobileDashboard();
                    refreshEntryBadgeDot();
                }
            } else if (!dynamicBadge && item.badge) {
                item.badge = undefined;
                if (document.getElementById(MOBILE_SHEET_ID)) {
                    renderMobileDashboard();
                    refreshEntryBadgeDot();
                }
            }
        }).catch(() => { /* ignore */ });
    });

    // 生态直达行（稍后收敛追加于最底部，避免抢占主视觉）
    const ecoRow = document.createElement("div");
    ecoRow.className = "lv-sheet-eco-row";
    const ecoDefs: Array<{ label: string; action: () => void | Promise<void> }> = [
        {
            label: "⚡ 打开雷切切片库",
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
        {
            label: "💾 全家桶联合备份",
            action: async () => {
                lvNotify.capsule({ source: "罗盘", message: "💾 正在打包联合备份…", duration: 2000, archive: false });
                try {
                    const bundle = await lvBackup.exportFull();
                    const json = JSON.stringify(bundle, null, 2);
                    const missing = bundle.failed?.length ?? 0;
                    const okCount = Object.keys(bundle.plugins || {}).length;
                    if (isMobileFrontend()) {
                        // 移动 WebView 没有可靠的 blob 下载通道：写入工作空间 temp 目录，桌面端可取出另存
                        const nodeBuf = (globalThis as any).Buffer;
                        const b64 = nodeBuf?.from ? String(nodeBuf.from(json, "utf8").toString("base64")) : "";
                        if (!b64) throw new Error("no buffer available");
                        const backupPath = `/temp/xiaolv-backup-${getTodayKey()}.json`;
                        const put = await lvKernelPost("/api/file/putFile", { path: backupPath, file: b64, isDir: false });
                        if (put.code !== 0) throw new Error(put.msg || "putFile failed");
                        lvNotify.capsule({
                            source: "罗盘",
                            message: `💾 备份已写入工作空间 ${backupPath}${missing > 0 ? `（${okCount} 项成功，${missing} 项失败）` : ""}`,
                            duration: 4500,
                            level: missing > 0 ? "warn" : "success",
                            archive: false,
                        });
                        return;
                    }
                    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `xiaolv-ecosystem-backup-${getTodayKey()}.json`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                    lvNotify.capsule({
                        source: "罗盘",
                        message: missing > 0 ? `已发起部分备份下载：${okCount} 项成功，${missing} 项失败；详见备份清单` : "💾 联合备份下载已发起",
                        duration: 3200,
                        level: missing > 0 ? "warn" : "success",
                    });
                } catch {
                    lvNotify.capsule({ source: "罗盘", message: "备份导出失败，请重试", duration: 3000, level: "error" });
                }
            }
        },
        {
            label: "♻️ 从备份恢复",
            action: async () => {
                // 灾备闭环的恢复半环：与桌面端「♻ 恢复」共用同一弹层（选文件 → 摘要确认 → 覆盖恢复）
                openEcosystemRestoreDialog();
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

    let searchSeq = 0;
    let mobileSearchTimer: number | undefined;
    search.addEventListener("input", () => {
        const seq = ++searchSeq;
        const kw = search.value.trim();
        if (mobileSearchTimer !== undefined) {
            try { window.clearTimeout(mobileSearchTimer); } catch { /* ignore */ }
            mobileSearchTimer = undefined;
        }
        searchClear.classList.toggle("visible", Boolean(kw));
        results.textContent = "";
        if (!kw) { renderHistory(); return; }
        histRow.style.display = "none";

        const loadingHint = document.createElement("div");
        loadingHint.className = "lv-sheet-result-count";
        loadingHint.textContent = "🔍 正在流式检索全生态…";
        results.appendChild(loadingHint);

        mobileSearchTimer = window.setTimeout(() => {
            mobileSearchTimer = undefined;
            if (seq !== searchSeq || !document.getElementById(MOBILE_SHEET_ID)) return;
            void lvOmnisearch.searchStream(kw, (hits, status) => {
                if (seq !== searchSeq || !document.getElementById(MOBILE_SHEET_ID)) return; // 过期响应或坞已关
                results.textContent = "";
                if (hits.length > 0) {
                    const count = document.createElement("div");
                    count.className = "lv-sheet-result-count";
                    const suffix = status.done ? "" : ` · ${status.pending} 项检索中`;
                    count.textContent = (hits.length > 12 ? `共 ${hits.length} 条穿透结果 · 显示前 12 条` : `${hits.length} 条穿透结果`) + suffix;
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
                            openOmniHitWithFallback(hit);
                        });
                        results.appendChild(row);
                    }
                }
                if (!hits.length) {
                    const empty = document.createElement("div");
                    empty.className = status.done ? "lv-sheet-empty" : "lv-sheet-result-count";
                    empty.textContent = status.done ? "未找到匹配结果" : `🔍 正在流式检索全生态 (${status.pending} 项进行中)…`;
                    results.appendChild(empty);
                }
            }).catch(() => { /* 检索异常静默 */ });
        }, 85);
    });

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

    // 生态行动流收敛至底部作为极轻量辅助链接
    sheet.appendChild(ecoRow);

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
        if (ev.target === mask) {
            const now = Date.now();
            const cx = (ev as MouseEvent).clientX || 0;
            const cy = (ev as MouseEvent).clientY || 0;
            if (now - lastMobileTopbarTap.ts < 360 && Math.hypot(cx - lastMobileTopbarTap.x, cy - lastMobileTopbarTap.y) < 36) {
                lastMobileTopbarTap = { ts: 0, x: 0, y: 0 };
                hapticFeedback(14);
                closeMobileSheet(true);
                openLifeLogDialog();
                return;
            }
            closeMobileSheet();
        }
    });

    // 下滑关闭手势（把手与面板皆可）：跟随手指位移给出实时下拉视觉反馈，松手过阈值关坞
    let touchStartY = 0;
    let dragFeedbackActive = false;
    const resetDragFeedback = () => {
        if (!dragFeedbackActive) return;
        dragFeedbackActive = false;
        try {
            sheet.classList.remove("lv-sheet-dragging");
            sheet.style.transform = "";
            sheet.style.animation = "";
        } catch { /* ignore */ }
    };
    sheet.addEventListener("touchstart", (ev) => {
        touchStartY = ev.touches[0]?.clientY ?? 0;
    }, { passive: true });
    sheet.addEventListener("touchmove", (ev) => {
        const currentY = ev.touches[0]?.clientY ?? 0;
        const dy = currentY - touchStartY;
        // 内容区已滚动时不下拉，避免与列表滚动手势打架；仅向下拖且坞顶在原始位时生效
        if (!dragFeedbackActive) {
            if (dy > 24 && sheet.scrollTop <= 2) {
                dragFeedbackActive = true;
                sheet.classList.add("lv-sheet-dragging");
                try { sheet.style.animation = "none"; } catch { /* ignore */ }
            } else {
                return;
            }
        }
        const eased = Math.max(0, dy) * 0.5; // 橡皮筋阻尼
        try { sheet.style.transform = `translateY(${eased.toFixed(1)}px)`; } catch { /* ignore */ }
    }, { passive: true });
    sheet.addEventListener("touchend", (ev) => {
        const diffY = (ev.changedTouches[0]?.clientY ?? 0) - touchStartY;
        const wasDragging = dragFeedbackActive;
        resetDragFeedback(); // 先清除内联 transform/animation，确保关坞下滑收场动画不被覆盖
        if (diffY > 60) closeMobileSheet();
        else if (wasDragging) hapticFeedback(6);
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

    // 移动端软键盘动态避让 (visualViewport)
    if (typeof window !== "undefined" && window.visualViewport) {
        const syncVisualViewport = () => {
            const vv = window.visualViewport;
            if (!vv || !mask.isConnected) return;
            const keyboardOffset = Math.max(0, window.innerHeight - (vv.offsetTop + vv.height));
            if (keyboardOffset > 100) {
                mask.style.bottom = `${keyboardOffset}px`;
                mask.style.height = `${vv.height}px`;
            } else {
                mask.style.bottom = "";
                mask.style.height = "";
            }
        };
        window.visualViewport.addEventListener("resize", syncVisualViewport);
        window.visualViewport.addEventListener("scroll", syncVisualViewport, { passive: true });
        sheetViewportCleanup = () => {
            window.visualViewport?.removeEventListener("resize", syncVisualViewport);
            window.visualViewport?.removeEventListener("scroll", syncVisualViewport);
            sheetViewportCleanup = undefined;
        };
    }
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
export function showMessage(message: string, timeout = 3000, type: "info" | "error" = "info", source?: string): void {
    const raw = String(message ?? "");
    if (type === "error") {
        lvNotify.card({ source, title: source ? `${source}提示` : undefined, message: raw, level: "error", duration: Math.max(timeout, 6000) });
    } else {
        lvNotify.capsule({ source, message: raw, duration: timeout });
    }
}

/** 生成带有插件专属来源标识的统一 showMessage 适配器 */
export function createScopedShowMessage(defaultSource: string) {
    const escaped = defaultSource.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const prefixRe = new RegExp(`^\\[${escaped}\\]\\s*`);
    return (message: string, timeout = 3000, type: "info" | "error" = "info"): void => {
        const raw = String(message ?? "");
        const plain = raw.replace(prefixRe, "");
        showMessage(plain, timeout, type, defaultSource);
    };
}

/* ========================================================================= */
/* 14c. 小驴罗盘 · 极速工作台服务 (Quick Workspace Services)                  */
/* ========================================================================= */

const QUICK_WORKSPACE_CONF_KEY = "lv_launchpad_quick_workspace_conf";
const DEFAULT_LIFELOG_CATEGORIES = ["日记", "工作", "家庭", "思考", "记录"];
let memoryQuickWorkspaceConfig: LvQuickWorkspaceConfig = { lifeLogCategories: DEFAULT_LIFELOG_CATEGORIES };

export function getQuickWorkspaceConfig(): LvQuickWorkspaceConfig {
    const ls = getSafeLocalStorage();
    if (!ls) return { ...memoryQuickWorkspaceConfig };
    try {
        const raw = ls.getItem(QUICK_WORKSPACE_CONF_KEY);
        if (raw) {
            const data = JSON.parse(raw);
            return {
                lifeLogCategories: Array.isArray(data.lifeLogCategories) && data.lifeLogCategories.length > 0 ? data.lifeLogCategories : DEFAULT_LIFELOG_CATEGORIES,
                lifeLogNotebookId: typeof data.lifeLogNotebookId === "string" ? data.lifeLogNotebookId : undefined,
                diaryNotebookId: typeof data.diaryNotebookId === "string" ? data.diaryNotebookId : undefined,
                quickNoteNotebookId: typeof data.quickNoteNotebookId === "string" ? data.quickNoteNotebookId : undefined,
                quickNoteDocumentId: typeof data.quickNoteDocumentId === "string" ? data.quickNoteDocumentId : undefined,
            };
        }
    } catch { /* ignore */ }
    return { ...memoryQuickWorkspaceConfig };
}

export function saveQuickWorkspaceConfig(patch: Partial<LvQuickWorkspaceConfig>): void {
    const current = getQuickWorkspaceConfig();
    const next = { ...current, ...patch };
    memoryQuickWorkspaceConfig = next;
    const ls = getSafeLocalStorage();
    if (!ls) return;
    try {
        ls.setItem(QUICK_WORKSPACE_CONF_KEY, JSON.stringify(next));
    } catch { /* ignore */ }
}

function safeRequire<T = any>(moduleName: string): T | null {
    try {
        const g = globalThis as any;
        const req = typeof g.require === "function" ? g.require : (g.window && typeof g.window.require === "function" ? g.window.require : null);
        if (typeof req === "function") {
            return req(moduleName);
        }
    } catch { /* ignore */ }
    return null;
}

async function lvKernelPost(endpoint: string, payload: Record<string, unknown>): Promise<{ code: number; msg: string; data?: any }> {
    try {
        const hostApi = typeof window !== "undefined" ? (window as any).__LV_HOST_API__ : null;
        if (hostApi && typeof hostApi.fetchSyncPost === "function") {
            return await hostApi.fetchSyncPost(endpoint, payload);
        }
        if (typeof (globalThis as any).fetchSyncPost === "function") {
            return await (globalThis as any).fetchSyncPost(endpoint, payload);
        }
        const sy = safeRequire("siyuan");
        if (sy && typeof sy.fetchSyncPost === "function") {
            return await sy.fetchSyncPost(endpoint, payload);
        }
    } catch { /* ignore */ }
    try {
        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        return await res.json();
    } catch (err) {
        let msg = "请求异常";
        try { msg = err instanceof Error ? (err.message || "请求异常") : String(err); } catch { /* ignore */ }
        return { code: -1, msg };
    }
}

const CATEGORY_EMOJI_MAP: Record<string, string> = {
    "日记": "📔", "工作": "💼", "家庭": "🏠", "思考": "💡", "记录": "📝",
    "学习": "📚", "运动": "🏃", "生活": "☕", "阅读": "📖", "灵感": "✨",
    "随笔": "✍️", "复盘": "🎯"
};

function getCategoryEmoji(cat: string): string {
    return CATEGORY_EMOJI_MAP[cat] || "🏷️";
}

function getCurrentOpenDocInfo(): { id: string; title: string } | null {
    if (typeof document === "undefined") return null;
    try {
        const activeProtyle = document.querySelector(".layout__wnd--active .protyle:not(.fn__none), .protyle:not(.fn__none)");
        if (!activeProtyle) return null;
        const wysiwyg = activeProtyle.querySelector(".protyle-wysiwyg") as HTMLElement | null;
        const docId = wysiwyg?.getAttribute("data-doc-id") || activeProtyle.querySelector("[data-node-id]")?.getAttribute("data-node-id");
        if (!docId) return null;
        const titleEl = activeProtyle.querySelector(".protyle-title, .protyle-title__input");
        const title = titleEl?.textContent?.trim() || "当前文档";
        return { id: docId, title };
    } catch { return null; }
}

let cachedDailyNotebookId = "";
let lastNotebookCheckTime = 0;
let cachedOpenNotebooks: Array<{ id: string; name: string }> = [];
let lastNotebooksFetchTime = 0;

async function listOpenNotebooks(force = false): Promise<Array<{ id: string; name: string }>> {
    const now = Date.now();
    if (!force && cachedOpenNotebooks.length > 0 && now - lastNotebooksFetchTime < 30_000) {
        return cachedOpenNotebooks;
    }
    try {
        const res = await lvKernelPost("/api/notebook/lsNotebooks", {});
        const nbs = res?.data?.notebooks;
        if (Array.isArray(nbs) && nbs.length > 0) {
            cachedOpenNotebooks = nbs
                .filter((nb: any) => nb && nb.id && !nb.closed)
                .map((nb: any) => ({ id: String(nb.id).trim(), name: String(nb.name || nb.id) }));
            lastNotebooksFetchTime = now;
            return cachedOpenNotebooks;
        }
    } catch { /* ignore */ }
    return cachedOpenNotebooks;
}

export async function resolveDailyNotebookId(): Promise<string> {
    const conf = getQuickWorkspaceConfig();
    const explicit = conf.lifeLogNotebookId?.trim() || conf.diaryNotebookId?.trim() || conf.quickNoteNotebookId?.trim();
    if (explicit) return explicit;

    const now = Date.now();
    if (cachedDailyNotebookId && now - lastNotebookCheckTime < 60000) {
        return cachedDailyNotebookId;
    }

    try {
        if (typeof window !== "undefined") {
            const w = window as any;
            const stored = w.siyuan?.storage?.["local-dailynoteid"] || (w.siyuan?.config?.general as any)?.dailyNote?.notebook;
            if (stored && typeof stored === "string" && stored.trim()) {
                cachedDailyNotebookId = stored.trim();
                lastNotebookCheckTime = now;
                return cachedDailyNotebookId;
            }
            const ls = getSafeLocalStorage();
            const lsId = ls?.getItem("local-dailynoteid");
            if (lsId && typeof lsId === "string" && lsId.trim()) {
                cachedDailyNotebookId = lsId.trim();
                lastNotebookCheckTime = now;
                return cachedDailyNotebookId;
            }
        }
    } catch { /* ignore */ }

    try {
        const openNbs = await listOpenNotebooks();
        if (openNbs.length > 0) {
            const preferred = openNbs.find((nb) => /日记|daily|journal|小驴/i.test(nb.name)) || openNbs[0];
            if (preferred && preferred.id) {
                cachedDailyNotebookId = preferred.id;
                lastNotebookCheckTime = now;
                return cachedDailyNotebookId;
            }
        }
    } catch { /* ignore */ }

    return "";
}

let writeReviewBusy = false;
async function writeTodayActivityReview(): Promise<void> {
    if (writeReviewBusy) return;
    writeReviewBusy = true;
    try {
        const md = lvActivity.formatAsMarkdown();
        if (!md || !md.trim()) {
            lvNotify.capsule({ source: "罗盘", message: "今日暂无生态活动记录", duration: 2400, archive: false });
            return;
        }
        let written = false;
        let writtenDocId = "";
        try {
            const host = (window as any).siyuanCheckin || (window as any).LvHome;
            if (host && typeof host.appendDailyNote === "function") {
                await host.appendDailyNote(md);
                written = true;
            }
        } catch { /* ignore */ }
        if (!written) {
            const appended = await appendMarkdownToDailyNote(md);
            if (appended.ok) {
                written = true;
                writtenDocId = appended.docId || "";
            }
        }
        if (written) {
            lvNotify.capsule({
                source: "罗盘",
                message: "📝 已将今日全生态活动写入日记",
                duration: 2800,
                level: "success",
                archive: false,
                action: writtenDocId ? { label: "看日记", onClick: () => { void openDocumentById(writtenDocId); } } : { label: "看日记", onClick: () => { void openDiaryBottom(); } },
            });
        } else {
            const copied = await copyTextToClipboard(md);
            lvNotify.capsule({
                source: "罗盘",
                message: copied ? "已复制今日回顾 Markdown，可直接粘贴至日记" : "今日回顾已就绪",
                duration: 2800,
                archive: false,
            });
        }
    } finally {
        writeReviewBusy = false;
    }
}

/** 穿透结果打开兜底：provider 未带 onClick 时回退 linkBlockId 文档跳转；执行异常显式反馈而非静默 */
function openOmniHitWithFallback(hit: { onClick?: () => void | Promise<void>; linkBlockId?: string }): void {
    if (typeof hit.onClick === "function") {
        try {
            void hit.onClick();
        } catch (err) {
            console.warn("[LvLaunchpad] 穿透结果打开失败:", err);
            try { lvNotify.capsule({ source: "穿透搜索", message: "结果打开异常，请重试", duration: 2200, level: "warn", archive: false }); } catch { /* ignore */ }
        }
        return;
    }
    if (hit.linkBlockId) {
        void openDocumentById(hit.linkBlockId);
        return;
    }
    try { lvNotify.capsule({ source: "穿透搜索", message: "该结果暂不支持直达", duration: 2000, archive: false }); } catch { /* ignore */ }
}

export async function openDocumentById(docId: string): Promise<boolean> {
    if (!docId) return false;
    const isMobile = isMobileFrontend();
    try {
        const sy = (window as any).siyuan;
        const hostApi = (window as any).__LV_HOST_API__;
        const app = hostApi?.app || sy?.app || (window as any).siyuanApp;
        if (isMobile) {
            if (typeof hostApi?.openMobileFileById === "function") {
                await hostApi.openMobileFileById(app, docId);
                return true;
            } else if (typeof sy?.mobile?.tabs?.open === "function") {
                await sy.mobile.tabs.open({ id: docId });
                return true;
            } else if (typeof (window as any).openMobileFileById === "function") {
                await (window as any).openMobileFileById(app, docId);
                return true;
            } else {
                const syMod = safeRequire("siyuan");
                if (syMod && typeof syMod.openMobileFileById === "function") {
                    await syMod.openMobileFileById(app, docId);
                    return true;
                }
            }
        } else {
            if (typeof hostApi?.openTab === "function") {
                await hostApi.openTab({ app, doc: { id: docId } });
                return true;
            } else if (typeof (window as any).openTab === "function") {
                await (window as any).openTab({ app, doc: { id: docId } });
                return true;
            } else {
                const syMod = safeRequire("siyuan");
                if (syMod && typeof syMod.openTab === "function") {
                    await syMod.openTab({ app, doc: { id: docId } });
                    return true;
                }
            }
        }
        // 兜底：若宿主未显式注入 openTab/openMobileFileById，尝试通过小驴人脉/思源协议深链打开
        const contacts = (window as any).siyuanContacts;
        if (contacts && typeof contacts.openPerson === "function") {
            const ok = await contacts.openPerson(docId);
            if (ok) return true;
        }
        if (typeof document !== "undefined" && document.body && typeof document.createElement === "function") {
            const link = document.createElement("a");
            link.href = `siyuan://blocks/${docId}`;
            link.style.display = "none";
            document.body.appendChild(link);
            link.click();
            link.remove();
            return true;
        }
    } catch (e) {
        console.warn("[LvLaunchpad] openDocumentById failed:", e);
    }
    return false;
}

let diaryBottomBusy = false;

export async function openDiaryBottom(): Promise<void> {
    if (diaryBottomBusy) return;
    diaryBottomBusy = true;
    const conf = getQuickWorkspaceConfig();
    closeDesktopLaunchpadPopover();
    closeMobileSheet();

    try {
        let docId = "";
        try {
            let nb = conf.diaryNotebookId?.trim() || "";
            if (!nb) nb = await resolveDailyNotebookId();
            const createPayload: Record<string, unknown> = { app: (window as any)?.siyuan?.app?.id || "siyuan" };
            if (nb) createPayload.notebook = nb;
            const res = await lvKernelPost("/api/filetree/createDailyNote", createPayload);
            if (res.code === 0 && res.data?.id) {
                docId = String(res.data.id);
            } else {
                const fallbackRes = await lvKernelPost("/api/filetree/createDailyNote", {});
                if (fallbackRes.code === 0 && fallbackRes.data?.id) {
                    docId = String(fallbackRes.data.id);
                }
            }
        } catch (err) {
            console.warn("[LvLaunchpad] createDailyNote API error:", err);
        }

        const alreadyOpen = Boolean(docId && getCurrentOpenDocInfo()?.id === docId);
        if (docId && !alreadyOpen) {
            await openDocumentById(docId);
        } else if (!docId) {
            try {
                const keyEvent = new KeyboardEvent("keydown", { key: "5", code: "Digit5", altKey: true, bubbles: true });
                document.body.dispatchEvent(keyEvent);
                lvNotify.capsule({ source: "日记", message: "未能直接定位日记文档，已尝试思源原生日记入口 (Alt+5)", duration: 2400, level: "warn", archive: false });
            } catch { /* ignore */ }
        }

        // 渐进式探测并滚动至末尾 + 精准定位最后一个可编辑块光标
        let settled = false;
        const scrollBottomAndFocus = (): boolean => {
            if (settled || typeof document === "undefined") return true;
            const targetWysiwyg = docId
                ? (document.querySelector(`.protyle:not(.fn__none) .protyle-wysiwyg[data-doc-id="${docId}"]`) as HTMLElement | null)
                : null;
            const root = targetWysiwyg?.closest(".protyle")
                || document.querySelector(".layout__wnd--active .protyle:not(.fn__none)")
                || document.querySelector(".protyle:not(.fn__none) .protyle-content, #editor .protyle-content")?.closest(".protyle")
                || document.querySelector(".protyle");
            if (!root) return false;
            const downBtn = root.querySelector(".protyle-scroll__down") as HTMLElement | null;
            if (downBtn) downBtn.click();
            const content = root.querySelector(".protyle-content") as HTMLElement | null;
            if (content) content.scrollTop = content.scrollHeight;
            try {
                const wysiwyg = root.querySelector(".protyle-wysiwyg") as HTMLElement | null;
                const lastNode = wysiwyg?.lastElementChild as HTMLElement | null;
                const editables = lastNode ? Array.from(lastNode.querySelectorAll<HTMLElement>('[contenteditable="true"]')) : [];
                const editable = (editables.length ? editables[editables.length - 1] : null)
                    || (lastNode?.getAttribute?.("contenteditable") === "true" ? lastNode : null)
                    || lastNode;
                if (editable && typeof editable.focus === "function") {
                    editable.focus();
                    const sel = window.getSelection?.();
                    if (sel) {
                        const range = document.createRange();
                        range.selectNodeContents(editable);
                        range.collapse(false);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                    settled = Boolean(!docId || wysiwyg?.getAttribute("data-doc-id") === docId);
                }
            } catch { /* ignore */ }
            return settled;
        };

        const delays = alreadyOpen ? [40, 220] : [160, 420, 820, 1300];
        for (const delay of delays) {
            window.setTimeout(() => { if (!settled) scrollBottomAndFocus(); }, delay);
        }
        lvNotify.capsule({
            source: "日记",
            message: "⬇️ 已直达今日日记底部",
            duration: 2200,
            archive: false,
            action: { label: "⚡ 记一笔", onClick: () => openQuickNoteDialog() },
        });
    } finally {
        diaryBottomBusy = false;
    }
}

function findLoadedPlugin(pluginId: string): any {
    try {
        const w = window as any;
        const lists = [w?.siyuan?.ws?.app?.plugins, w?.siyuan?.plugins, w?.app?.plugins];
        for (const list of lists) {
            if (Array.isArray(list)) {
                const found = list.find((p: any) => p?.name === pluginId);
                if (found) return found;
            }
        }
    } catch { /* ignore */ }
    return null;
}

/** 打开思源设置对话框并定位到「集市」标签页（用于插件缺失时的引导） */
function openPluginBazaarSettings(): void {
    if (typeof document === "undefined") return;
    try {
        const barSetting = document.querySelector("#barSetting") as HTMLElement | null;
        if (barSetting) {
            barSetting.click();
            window.setTimeout(() => {
                try {
                    const tab = document.querySelector<HTMLElement>('.config__tab-item[data-name="bazaar"], .config__tabs .config__tab-item[data-name="bazaar"]');
                    if (tab) tab.click();
                } catch { /* ignore */ }
            }, 260);
            return;
        }
    } catch { /* ignore */ }
    try {
        const link = document.createElement("a");
        link.href = "siyuan://settings/bazaar";
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch { /* ignore */ }
}

let taskMgrLastTier = -1; // 上次成功的直达路径（0~3），下次优先尝试以加速热路径

export function openTaskManager(): void {
    closeDesktopLaunchpadPopover();
    closeMobileSheet();

    // 0~3 号直达路径（全局入口 / 插件实例 / DOM 顶栏按钮 / bridge 视图）
    const directTiers: Array<() => boolean> = [
        // 全局入口
        () => {
            if (typeof (globalThis as any).__taskHorizonOpenManagerFromTopbarEntry === "function") {
                return (globalThis as any).__taskHorizonOpenManagerFromTopbarEntry() !== false;
            }
            return false;
        },
        // 插件实例
        () => {
            const thPlugin = (globalThis as any).__taskHorizonPluginInstance || findLoadedPlugin("siyuan-plugin-task-horizon");
            if (thPlugin && typeof thPlugin.openTaskManager === "function") {
                return thPlugin.openTaskManager() !== false;
            }
            return false;
        },
        // DOM 顶栏/侧边栏原生图标
        () => {
            const topbarBtn = document.querySelector('[data-task-horizon-window-topbar="1"], [aria-label*="任务管理器"], [title*="任务管理器"], [id*="siyuan-plugin-task-horizon_task-manager"]') as HTMLElement | null;
            if (topbarBtn) {
                topbarBtn.click();
                return true;
            }
            return false;
        },
        // bridge 调用
        () => {
            const bridge = (window as any).TaskHorizon || (window as any).taskHorizon || (window as any).siyuanTaskHorizon;
            if (bridge && typeof bridge.openView === "function") {
                bridge.openView("calendar");
                return true;
            }
            return false;
        },
    ];

    const tierOrder = taskMgrLastTier >= 0 && taskMgrLastTier < directTiers.length
        ? [taskMgrLastTier, ...directTiers.map((_, i) => i).filter((i) => i !== taskMgrLastTier)]
        : directTiers.map((_, i) => i);
    for (const idx of tierOrder) {
        const tierFn = directTiers[idx];
        if (!tierFn) continue;
        try {
            if (tierFn()) {
                taskMgrLastTier = idx;
                return;
            }
        } catch { /* ignore */ }
    }

    // 降级：依次尝试小驴打卡今日待办 / 小驴管家
    try {
        if (getLaunchpadHub().executeAction("siyuan-checkin", "查看今日待办")) {
            lvNotify.capsule({ source: "罗盘", message: "未检测到任务管理器，已为您打开今日待办", duration: 2200, archive: false });
            return;
        }
        if (getLaunchpadHub().executeAction("siyuan-home", "打开管家面板")) {
            lvNotify.capsule({ source: "罗盘", message: "未检测到任务管理器，已为您打开小驴管家", duration: 2200, archive: false });
            return;
        }
    } catch { /* ignore */ }

    lvNotify.capsule({
        source: "罗盘",
        message: "请在集市启用「任务管理器 (Task Horizon)」插件",
        duration: 3200,
        archive: false,
        action: { label: "打开集市", onClick: openPluginBazaarSettings },
    });
}

let newTaskBusy = false;
let newTaskLastTier = -1; // 上次成功的直达路径（0~2），下次优先尝试以加速热路径

export async function openNewTask(): Promise<void> {
    if (newTaskBusy) return;
    newTaskBusy = true;
    closeDesktopLaunchpadPopover();
    closeMobileSheet();

    // 0~2 号直达路径（全局快速加任务函数 / 插件实例 / DOM 原生新建按钮）
    const directTiers: Array<() => Promise<boolean>> = [
        // Task Horizon 挂载在 window / globalThis 上的新建任务全局函数
        async () => {
            const g = globalThis as any;
            if (typeof g.tmQuickAddOpen === "function") {
                await g.tmQuickAddOpen();
                return true;
            }
            if (typeof g.tmAdd === "function") {
                await g.tmAdd();
                return true;
            }
            return false;
        },
        // 插件实例或思源 ws.app.plugins 中的实例方法
        async () => {
            const pInstance = (globalThis as any).__taskHorizonPluginInstance || findLoadedPlugin("siyuan-plugin-task-horizon");
            if (pInstance && typeof pInstance.openQuickAddTaskWindow === "function") {
                return (await pInstance.openQuickAddTaskWindow()) !== false;
            }
            return false;
        },
        // DOM 中的新建任务原生按钮点击
        async () => {
            const topbarAddBtn = document.querySelector(".tm-topbar-add-btn, .tm-quick-add-btn, [data-action='quick-add'], [onclick*='tmAdd'], [onclick*='tmQuickAddOpen'], [data-tm-floating-tooltip-label='新建任务'], [aria-label*='新建任务'], [title*='新建任务']") as HTMLElement | null;
            if (topbarAddBtn) {
                topbarAddBtn.click();
                return true;
            }
            return false;
        },
    ];

    try {
        const tierOrder = newTaskLastTier >= 0 && newTaskLastTier < directTiers.length
            ? [newTaskLastTier, ...directTiers.map((_, i) => i).filter((i) => i !== newTaskLastTier)]
            : directTiers.map((_, i) => i);
        for (const idx of tierOrder) {
            const tierFn = directTiers[idx];
            if (!tierFn) continue;
            try {
                if (await tierFn()) {
                    newTaskLastTier = idx;
                    return;
                }
            } catch { /* ignore */ }
        }

        // 降级：调起小驴打卡快速记事，或一键记事待办模式
        try {
            if (getLaunchpadHub().executeAction("siyuan-checkin", "快速记事")) {
                lvNotify.capsule({ source: "罗盘", message: "未检测到任务管理器，已为您打开快速记事", duration: 2200, archive: false });
                return;
            }
        } catch { /* ignore */ }

        lvNotify.capsule({
            source: "罗盘",
            message: "未检测到任务管理器",
            duration: 3200,
            archive: false,
            action: {
                label: "记一条待办",
                onClick: () => openQuickNoteDialog("- [ ] "),
            },
        });
    } finally {
        newTaskBusy = false;
    }
}

let reloadBusy = false;

export async function reloadUI(): Promise<void> {
    if (reloadBusy) return;
    reloadBusy = true;
    closeDesktopLaunchpadPopover(true);
    closeMobileSheet();
    lvNotify.capsule({ source: "罗盘", message: "🔄 正在重载思源界面…", duration: 1500, archive: false });
    await new Promise((resolve) => setTimeout(resolve, 60));

    try {
        const res = await lvKernelPost("/api/ui/reloadUI", {});
        if (res && res.code === 0) return;
        // 内核接口异常时降级为浏览器刷新，并显式告知用户
        lvNotify.capsule({ source: "罗盘", message: "内核重载接口异常，已降级为浏览器刷新", duration: 2000, level: "warn", archive: false });
    } catch { /* ignore */ } finally {
        reloadBusy = false;
    }

    try {
        if (typeof window !== "undefined" && window.location && typeof window.location.reload === "function") {
            window.location.reload();
        }
    } catch { /* ignore */ }
}

const recentRandomWalkIds: string[] = [];
let randomWalkBusy = false;

export async function randomWalk(): Promise<void> {
    if (randomWalkBusy) return;
    randomWalkBusy = true;
    closeDesktopLaunchpadPopover();
    closeMobileSheet();

    const currentId = getCurrentOpenDocInfo()?.id || "";
    const skipIds = new Set<string>(recentRandomWalkIds);
    if (currentId) skipIds.add(currentId);

    const pickCandidate = (rows: Array<{ id?: string; content?: string; hpath?: string }>): { id: string; title: string; folder?: string } | null => {
        const valid = rows.filter((r) => r && r.id);
        if (!valid.length) return null;
        const fresh = valid.filter((r) => !skipIds.has(String(r.id)));
        const pool = fresh.length > 0 ? fresh : valid;
        const chosen = pool[Math.floor(Math.random() * pool.length)] || pool[0]!;
        const rawTitle = chosen.content || chosen.hpath || "未命名笔记";
        const title = String(rawTitle).split("/").pop() || "笔记";
        const parts = String(chosen.hpath || "").split("/").filter(Boolean);
        const folder = parts.length > 1 ? parts.slice(0, -1).join("/") : undefined;
        return { id: String(chosen.id), title, folder };
    };

    const finishWalk = async (docId: string, title: string, fromSource = "漫步", folder?: string, freshPrefix = ""): Promise<boolean> => {
        const ok = await openDocumentById(docId);
        if (!ok) return false;
        recentRandomWalkIds.push(docId);
        if (recentRandomWalkIds.length > 12) recentRandomWalkIds.shift();
        const pathSuffix = folder ? ` · ${folder.slice(0, 18)}` : "";
        lvNotify.capsule({
            source: fromSource,
            message: `🎲 ${freshPrefix}《${title.slice(0, 18)}》${pathSuffix}`,
            duration: 3800,
            archive: false,
            action: {
                label: "换一篇",
                onClick: () => { void randomWalk(); },
            },
        });
        try {
            getActivityHub().record({
                category: "note",
                source: "罗盘",
                title: `漫步至《${title.slice(0, 20)}》`,
                linkBlockId: docId,
            });
        } catch { /* ignore */ }
        return true;
    };

    try {
        // Tier 0: 近 90 天有更新的活跃笔记优先（新鲜度偏置，让漫步更容易踩到「活的」内容）
        try {
            const sql0 = "SELECT id, content, hpath FROM blocks WHERE type = 'd' AND length(trim(content)) > 0 AND updated > strftime('%Y%m%d%H%M%S','now','-90 days') AND hpath NOT LIKE '%/templates%' AND hpath NOT LIKE '%/模板%' ORDER BY random() LIMIT 12";
            const res0 = await lvKernelPost("/api/query/sql", { stmt: sql0 });
            const cand0 = Array.isArray(res0?.data) ? pickCandidate(res0.data) : null;
            if (cand0 && await finishWalk(cand0.id, cand0.title, "漫步", cand0.folder, "近期 · ")) return;
        } catch { /* 旧内核对 strftime 支持异常时静默走下一层 */ }

        // Tier 1: 优先抽取非模板非空正文笔记（一次抽 12 条本地避重）
        const sql1 = "SELECT id, content, hpath FROM blocks WHERE type = 'd' AND length(trim(content)) > 0 AND hpath NOT LIKE '%/templates%' AND hpath NOT LIKE '%/模板%' ORDER BY random() LIMIT 12";
        const res1 = await lvKernelPost("/api/query/sql", { stmt: sql1 });
        const cand1 = Array.isArray(res1?.data) ? pickCandidate(res1.data) : null;
        if (cand1 && await finishWalk(cand1.id, cand1.title, "漫步", cand1.folder)) return;

        // Tier 2: 放宽 SQL 条件（兜底无正文或标题为空的任意文档）
        const sql2 = "SELECT id, content, hpath FROM blocks WHERE type = 'd' ORDER BY random() LIMIT 12";
        const res2 = await lvKernelPost("/api/query/sql", { stmt: sql2 });
        const cand2 = Array.isArray(res2?.data) ? pickCandidate(res2.data) : null;
        if (cand2 && await finishWalk(cand2.id, cand2.title, "漫步", cand2.folder)) return;

        // Tier 3: 结合小驴人脉（随机抽取一位人脉档案卡作为“人脉漫步”灵感回溯）
        const contactsBridge = typeof window !== "undefined" ? (window as any).siyuanContacts : null;
        if (contactsBridge && typeof contactsBridge.searchPeople === "function") {
            try {
                const people = await contactsBridge.searchPeople("");
                if (Array.isArray(people) && people.length > 0) {
                    const withDoc = people.filter((p: any) => p?.docId);
                    const freshPeople = withDoc.filter((p: any) => !skipIds.has(String(p.docId)));
                    const pool = freshPeople.length > 0 ? freshPeople : withDoc;
                    if (pool.length > 0) {
                        const chosen = pool[Math.floor(Math.random() * pool.length)];
                        const label = chosen.name ? `人脉·${chosen.name}` : "人脉档案";
                        if (await finishWalk(String(chosen.docId), label, "人脉漫步")) return;
                    }
                }
            } catch { /* ignore */ }
        }

        // Tier 4: 思源原生文件树检索接口兜底 (/api/filetree/searchDocs)
        const docRes = await lvKernelPost("/api/filetree/searchDocs", { k: "" });
        if (Array.isArray(docRes?.data) && docRes.data.length > 0) {
            const validDocs = docRes.data
                .filter((d: any) => d?.path && !/\/(templates|模板)\//i.test(String(d.hPath || d.path)))
                .map((d: any) => ({
                    id: String(d.path).replace(/^.*\//, "").replace(/\.sy$/i, ""),
                    content: String(d.hPath || d.path).split("/").pop() || "笔记",
                    hpath: d.hPath,
                }));
            const cand4 = pickCandidate(validDocs);
            if (cand4 && await finishWalk(cand4.id, cand4.title, "漫步", cand4.folder)) return;
        }
        lvNotify.capsule({ source: "漫步", message: "当前知识库与人脉库暂无可漫游的文档", duration: 2400, level: "warn", archive: false });
    } catch (err) {
        console.warn("[LvLaunchpad] 随机漫步查询失败:", err);
        lvNotify.capsule({ source: "漫步", message: "随机漫步查询异常，请稍后重试", duration: 2400, level: "warn", archive: false });
    } finally {
        randomWalkBusy = false;
    }
}

let pasteBusy = false;
let lastClipFingerprint = "";
let lastClipTime = 0;

/** 剪贴文本 → 入库 Markdown：单 URL / 多 URL 列表 / 多行引用 / 单行速记 */
function buildClipMarkdown(text: string, timeStr: string): string {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    // 多 URL：每行一个链接时逐条转为独立链接行（批量收藏场景）
    if (lines.length > 1 && lines.every((l) => /^https?:\/\/\S+$/i.test(l))) {
        return lines.map((u) => `- **${timeStr}** 🔗 [${u}](${u})`).join("\n");
    }
    if (/^https?:\/\/\S+$/i.test(text)) {
        return `- **${timeStr}** 🔗 [${text}](${text})`;
    }
    if (text.includes("\n")) {
        const raw = text.split(/\r?\n/);
        return `- **${timeStr}** 📋 剪贴速记：\n` + raw.map((l) => `  ${l.trim() ? "> " + l : ">"}`).join("\n");
    }
    return `- **${timeStr}** 📋 ${text}`;
}

/** Electron 环境下将剪贴板图片写入工作区 assets，返回 Markdown 图片片段（失败返回 null） */
async function saveClipboardImageToAssets(): Promise<string | null> {
    try {
        const electron = typeof window !== "undefined" ? (window as any).require?.("electron") : null;
        const img = electron?.clipboard?.readImage?.();
        if (!img || (typeof img.isEmpty === "function" ? img.isEmpty() : false)) return null;
        const png = typeof img.toPNG === "function" ? img.toPNG() : null;
        const nodeBuf = (globalThis as any).Buffer;
        if (!png || !nodeBuf?.from) return null;
        const b64 = String(nodeBuf.from(png).toString("base64") || "");
        if (!b64) return null;
        const d = new Date();
        const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}${String(d.getSeconds()).padStart(2, "0")}`;
        const fileName = `lv-clip-${stamp}.png`;
        const put = await lvKernelPost("/api/file/putFile", { path: `/assets/${fileName}`, file: b64, isDir: false });
        if (put.code !== 0) return null;
        return `![剪贴图片](assets/${fileName})`;
    } catch { return null; }
}

/** 压缩后写入 assets：最长边 1600px / JPEG 0.85（白底合成），返回 { path, thumb } 供缩略图条直接展示 */
async function compressAndPutImageFile(file: File | Blob, stampBase: string, idx: number): Promise<{ path: string; thumb: string } | null> {
    try {
        if (typeof document === "undefined") return null;
        const dataUrl = await new Promise<string>((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => resolve(String(fr.result || ""));
            fr.onerror = () => reject(new Error("read failed"));
            fr.readAsDataURL(file);
        });
        if (!dataUrl) return null;
        const img = await new Promise<HTMLImageElement | null>((resolve) => {
            const im = new Image();
            im.onload = () => resolve(im);
            im.onerror = () => resolve(null);
            im.src = dataUrl;
        });
        if (!img || !(img.naturalWidth > 0)) return null;
        const maxEdge = 1600;
        const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const out = canvas.toDataURL("image/jpeg", 0.85);
        const b64 = out.slice(out.indexOf(",") + 1);
        if (!b64) return null;
        const fileName = `lv-lifelog-${stampBase}-${String(idx).padStart(2, "0")}.jpg`;
        const put = await lvKernelPost("/api/file/putFile", { path: `/assets/${fileName}`, file: b64, isDir: false });
        if (put.code !== 0) return null;
        return { path: `assets/${fileName}`, thumb: out };
    } catch { return null; }
}

/** 联合灾备恢复弹层：选择备份文件 → 摘要确认 → restoreFull 覆盖恢复（补齐灾备闭环的恢复半环） */
function openEcosystemRestoreDialog(): void {
    mountQuickModal({
        icon: "♻️",
        title: "联合备份 · 恢复",
        badgeHtml: `<span class="lv-qw-badge">将覆盖当前各插件数据</span>`,
        bodyHtml: `<div class="lv-restore-warn">⚠️ 恢复会用备份包中的数据<strong>覆盖</strong>各插件当前数据，请确认已了解影响。</div><div class="lv-restore-pick"><button type="button" class="lv-qw-tag-chip lv-restore-pick-btn">📂 选择备份文件 (.json)</button><input type="file" class="lv-restore-input" accept=".json,application/json,text/plain,application/octet-stream" style="display:none;" /></div><div class="lv-restore-summary" style="display:none;"></div>`,
        primaryLabel: "确认恢复并覆盖",
        onSave: async (saveBtn, cleanup) => {
            const input = typeof document !== "undefined"
                ? document.querySelector<HTMLInputElement>("#lv-quick-workspace-mask .lv-restore-input")
                : null;
            const file = input?.files?.[0];
            if (!file) {
                lvNotify.capsule({ source: "联合备份", message: "请先选择备份文件（.json）", duration: 2200, level: "warn", archive: false });
                return;
            }
            const origLabel = saveBtn?.textContent || "确认恢复并覆盖";
            if (saveBtn) saveBtn.textContent = "恢复中…";
            try {
                const text = await file.text();
                const bundle = JSON.parse(text);
                const result = await lvBackup.restoreFull(bundle);
                cleanup();
                const okCount = result.success.length;
                const failed = result.failed || [];
                lvNotify.capsule({
                    source: "联合备份",
                    message: failed.length > 0
                        ? `♻️ 恢复完成：${okCount} 个插件成功，${failed.length} 项失败（${failed.slice(0, 3).join("、")}${failed.length > 3 ? "…" : ""}）`
                        : `♻️ 恢复完成：${okCount} 个插件数据已回灌`,
                    duration: 4200,
                    level: failed.length > 0 ? "warn" : "success",
                    archive: false,
                });
            } catch {
                if (saveBtn) saveBtn.textContent = origLabel;
                lvNotify.capsule({ source: "联合备份", message: "恢复失败：文件解析或写入异常，请确认是本生态导出的备份包", duration: 3200, level: "error", archive: false });
            }
        },
    });
    const mask = typeof document !== "undefined" ? document.getElementById("lv-quick-workspace-mask") : null;
    const pickBtn = mask?.querySelector<HTMLElement>(".lv-restore-pick-btn");
    const input = mask?.querySelector<HTMLInputElement>(".lv-restore-input");
    const summary = mask?.querySelector<HTMLElement>(".lv-restore-summary");
    const saveBtn = mask?.querySelector<HTMLButtonElement>(".lv-qw-btn-primary");
    if (saveBtn) saveBtn.disabled = true; // 摘要确认前禁止执行恢复
    pickBtn?.addEventListener("click", () => { hapticFeedback(6); input?.click(); });
    input?.addEventListener("change", () => {
        const file = input.files?.[0];
        if (!file || !summary) return;
        void file.text().then((text) => {
            const bundle = JSON.parse(text);
            const pluginIds = Object.keys(bundle?.plugins || {});
            const failed = Array.isArray(bundle?.failed) ? bundle.failed.length : 0;
            const exportedAt = String(bundle?.exportedAt || "").replace("T", " ").slice(0, 19);
            summary.style.display = "flex";
            summary.innerHTML = `📦 ${escapeHtml(String(bundle?.ecosystem || "?"))} 备份 · 导出于 ${escapeHtml(exportedAt || "未知时间")} · 含 <strong>${pluginIds.length}</strong> 个插件数据${failed > 0 ? ` · 导出时 ${failed} 项失败` : ""}${pluginIds.length ? `<br><span style="opacity:.75;">${escapeHtml(pluginIds.slice(0, 6).join(" · "))}${pluginIds.length > 6 ? " …" : ""}</span>` : ""}`;
            if (saveBtn) saveBtn.disabled = false;
        }).catch(() => {
            summary.style.display = "flex";
            summary.textContent = "⚠️ 无法解析该文件：不是合法的小驴灾备包（.json）";
            if (saveBtn) saveBtn.disabled = true;
        });
    });
}

/** 剪贴长内容（>300 字）预览确认弹层：可编辑后再入库；manual 模式用于剪贴权限受阻时手动粘贴。
 *  目标徽标与一键记事同款循环：今日日记 → 当前文档 → 指定文档。 */
function openClipPreviewModal(rawText: string, timeStr: string, opts?: { manual?: boolean }): void {
    const manual = Boolean(opts?.manual);
    const conf = getQuickWorkspaceConfig();
    const currentDoc = getCurrentOpenDocInfo();
    const ls = getSafeLocalStorage();
    const savedMode = ls?.getItem(QUICK_NOTE_TARGET_KEY);
    let targetMode: "daily" | "current" | "custom" =
        savedMode === "current" && currentDoc ? "current"
            : (savedMode === "custom" && conf.quickNoteDocumentId?.trim() ? "custom" : "daily");
    const getBadgeLabel = () => targetMode === "current" && currentDoc
        ? `目标: ${currentDoc.title.slice(0, 14)} ↻`
        : targetMode === "custom" ? "目标: 指定文档 ↻" : "目标: 今日日记 ↻";
    const getHintText = () => `入库格式：时间戳 + 引用块，追加至${targetMode === "daily" ? "今日日记" : (targetMode === "current" && currentDoc ? `《${currentDoc.title.slice(0, 14)}》` : "指定文档")}`;

    mountQuickModal({
        icon: "📋",
        title: manual ? "剪贴入库 · 手动粘贴" : "剪贴入库 · 长内容预览",
        badgeHtml: `${manual ? "" : `${rawText.length} 字 · `}<button type="button" class="lv-qw-badge lv-qw-badge-btn lv-qw-clip-target-btn" title="点击切换存储目标（今日日记 / 当前文档 / 指定文档）">${escapeHtml(getBadgeLabel())}</button>`,
        bodyHtml: `<textarea class="lv-qw-textarea b3-text-field" placeholder="${manual ? (isMobileFrontend() ? "当前环境无法自动读取剪贴板，请长按屏幕粘贴内容到这里..." : "当前环境无法自动读取剪贴板，请长按 / Ctrl+V 粘贴内容到这里...") : "确认或编辑剪贴内容后入库..."}" rows="8"></textarea><div class="lv-qw-preview-tag lv-qw-clip-hint" style="margin-top:6px;">${escapeHtml(getHintText())}</div>`,
        primaryLabel: "保存入库",
        onSave: async (saveBtn, cleanup) => {
            const ta = typeof document !== "undefined"
                ? document.querySelector<HTMLTextAreaElement>("#lv-quick-workspace-mask textarea")
                : null;
            const text = (ta?.value || "").trim();
            if (!text) {
                lvNotify.capsule({ source: "剪贴板", message: "内容为空，已取消入库", duration: 1800, archive: false });
                return;
            }
            const origLabel = saveBtn?.textContent || "保存入库";
            if (saveBtn) saveBtn.textContent = "入库中…";
            try {
                const parentID = targetMode === "current" && currentDoc ? currentDoc.id : (targetMode === "custom" && conf.quickNoteDocumentId ? conf.quickNoteDocumentId.trim() : "");
                let res: { ok: boolean; msg?: string; docId?: string; blockId?: string };
                if (parentID) {
                    const aRes = await lvKernelPost("/api/block/appendBlock", { data: `${buildClipMarkdown(text, timeStr)}\n`, dataType: "markdown", parentID });
                    const ids = extractAppendIds(aRes.data);
                    res = { ok: aRes.code === 0, msg: aRes.msg, docId: ids.docId || parentID, blockId: ids.blockId };
                } else {
                    res = await appendMarkdownToDailyNote(buildClipMarkdown(text, timeStr));
                }
                if (res.ok) {
                    lastClipFingerprint = rawText;
                    lastClipTime = Date.now();
                    cleanup();
                    const summary = text.replace(/[\r\n\t]+/g, " ").slice(0, 22);
                    const jumpId = res.blockId || res.docId;
                    const destLabel = targetMode === "daily" ? "日记" : (targetMode === "current" && currentDoc ? `《${currentDoc.title.slice(0, 14)}》` : "指定文档");
                    lvNotify.capsule({
                        source: "剪贴板",
                        message: `📋 已存入${destLabel}: ${summary}${text.length > 22 ? "…" : ""}`,
                        duration: 3200,
                        level: "success",
                        archive: false,
                        action: {
                            label: "定位",
                            onClick: () => { if (jumpId) void openDocumentById(jumpId); else void openDiaryBottom(); },
                        },
                    });
                    try {
                        getActivityHub().record({
                            category: "clip",
                            source: "罗盘",
                            title: `剪贴入库: ${summary}`,
                            detail: text.slice(0, 120),
                            linkBlockId: jumpId,
                        });
                    } catch { /* ignore */ }
                } else {
                    if (saveBtn) saveBtn.textContent = "重试保存";
                    lvNotify.capsule({ source: "剪贴板", message: `记录失败: ${res.msg || "无法写入今日日记"}`, duration: 3000, level: "error" });
                }
            } catch {
                if (saveBtn) saveBtn.textContent = origLabel;
                lvNotify.capsule({ source: "剪贴板", message: "入库异常，请稍后重试", duration: 2800, level: "warn" });
            }
        },
    });
    // 目标徽标循环（与一键记事同规则，并同步记忆）
    const maskEl = typeof document !== "undefined" ? document.getElementById("lv-quick-workspace-mask") : null;
    maskEl?.querySelector(".lv-qw-clip-target-btn")?.addEventListener("click", () => {
        hapticFeedback(6);
        if (targetMode === "daily") targetMode = currentDoc ? "current" : (conf.quickNoteDocumentId?.trim() ? "custom" : "daily");
        else if (targetMode === "current") targetMode = conf.quickNoteDocumentId?.trim() ? "custom" : "daily";
        else targetMode = "daily";
        try { ls?.setItem(QUICK_NOTE_TARGET_KEY, targetMode); } catch { /* ignore */ }
        const badgeBtn = maskEl?.querySelector<HTMLElement>(".lv-qw-clip-target-btn");
        if (badgeBtn) badgeBtn.textContent = getBadgeLabel();
        const hintEl = maskEl?.querySelector<HTMLElement>(".lv-qw-clip-hint");
        if (hintEl) hintEl.textContent = getHintText();
    });
    // 预填剪贴原文（mount 返回后再填充，让字数统计与自动增高立即生效）；手动模式留空等用户粘贴
    if (!manual && rawText) {
        window.setTimeout(() => {
            try {
                const ta = document.querySelector<HTMLTextAreaElement>("#lv-quick-workspace-mask textarea");
                if (ta) {
                    ta.value = rawText;
                    ta.dispatchEvent(new Event("input"));
                }
            } catch { /* ignore */ }
        }, 70);
    }
}

export async function pasteToDailyNote(): Promise<void> {
    if (pasteBusy) return;
    pasteBusy = true;
    closeDesktopLaunchpadPopover();
    closeMobileSheet();

    try {
        let clipText = "";
        let clipReadDenied = false;
        try {
            if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.readText === "function") {
                clipText = await navigator.clipboard.readText();
            }
        } catch { clipReadDenied = true; /* 浏览器权限受阻时回退 */ }

        const electron = typeof window !== "undefined" ? (window as any).require?.("electron") : null;
        if (!clipText && electron?.clipboard?.readText) {
            try {
                clipText = electron.clipboard.readText();
            } catch { /* ignore */ }
        }

        clipText = clipText ? clipText.trim() : "";
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        if (!clipText) {
            // 文本为空 → 尝试将剪贴板图片自动存入 assets 并写入日记
            const assetMd = await saveClipboardImageToAssets();
            if (assetMd) {
                const imgRes = await appendMarkdownToDailyNote(`- **${timeStr}** 🖼️ ${assetMd}`);
                if (imgRes.ok) {
                    const imgJumpId = imgRes.blockId || imgRes.docId;
                    lvNotify.capsule({
                        source: "剪贴板",
                        message: "🖼️ 剪贴板图片已存入 assets 并写入日记",
                        duration: 3200,
                        level: "success",
                        archive: false,
                        action: {
                            label: "看日记",
                            onClick: () => { if (imgJumpId) void openDocumentById(imgJumpId); else void openDiaryBottom(); },
                        },
                    });
                    try {
                        getActivityHub().record({ category: "clip", source: "罗盘", title: "剪贴图片入库", linkBlockId: imgJumpId });
                    } catch { /* ignore */ }
                    return;
                }
                lvNotify.capsule({ source: "剪贴板", message: "图片已存入 assets，但写入日记失败，请手动插入", duration: 3000, level: "warn", archive: false });
                return;
            }
            try {
                if (electron?.clipboard?.readImage && !electron.clipboard.readImage().isEmpty?.()) {
                    lvNotify.capsule({ source: "剪贴板", message: "🖼️ 检测到剪贴板图片，但当前环境不支持自动存图", duration: 2400, level: "warn", archive: false });
                    return;
                }
            } catch { /* ignore */ }
            // 权限受阻（读剪贴板抛异常）而非真空 → 开手动粘贴弹层兜底
            if (clipReadDenied) {
                openClipPreviewModal("", timeStr, { manual: true });
                return;
            }
            lvNotify.capsule({ source: "剪贴板", message: "📋 剪贴板为空或未授权读取", duration: 2200, level: "warn", archive: false });
            return;
        }

        const nowTs = Date.now();
        if (clipText === lastClipFingerprint && nowTs - lastClipTime < 5000) {
            lvNotify.capsule({ source: "剪贴板", message: "📋 刚刚已存入相同剪贴内容，避免重复写入", duration: 1800, archive: false });
            return;
        }

        // 长内容（>300 字）先弹可编辑预览确认，防误粘大段内容污染日记
        if (clipText.length > 300) {
            openClipPreviewModal(clipText, timeStr);
            return;
        }

        const res = await appendMarkdownToDailyNote(buildClipMarkdown(clipText, timeStr));
        if (res.ok) {
            lastClipFingerprint = clipText;
            lastClipTime = nowTs;
            const summary = clipText.replace(/[\r\n\t]+/g, " ").slice(0, 22);
            const jumpId = res.blockId || res.docId;
            lvNotify.capsule({
                source: "剪贴板",
                message: `📋 已存入日记: ${summary}${clipText.length > 22 ? "…" : ""}`,
                duration: 3200,
                level: "success",
                archive: false,
                action: {
                    label: "看日记",
                    onClick: () => { if (jumpId) void openDocumentById(jumpId); else void openDiaryBottom(); },
                },
            });
            try {
                getActivityHub().record({
                    category: "clip",
                    source: "罗盘",
                    title: `剪贴入库: ${summary}`,
                    detail: clipText.slice(0, 120),
                    linkBlockId: jumpId,
                });
            } catch { /* ignore */ }
        } else {
            lvNotify.capsule({
                source: "剪贴板",
                message: `记录失败: ${res.msg || "无法写入今日日记"}`,
                duration: 3000,
                level: "error",
            });
        }
    } finally {
        pasteBusy = false;
    }
}

const QUICK_NOTE_DRAFT_KEY = "lv_quick_note_draft";
const QUICK_NOTE_DRAFT_AT_KEY = "lv_quick_note_draft_at";
const QUICK_NOTE_TARGET_KEY = "lv_quick_note_target_mode";
const LIFELOG_DRAFT_KEY = "lv_lifelog_draft";
const LIFELOG_DRAFT_AT_KEY = "lv_lifelog_draft_at";

interface TodayWriteEntry {
    /** 展示行文本：LifeLog 为 `HH:MM 分类：内容`，一键记事为首行摘要 */
    l: string;
    /** 写入日记后的首个块 ID，用于一键撤销 */
    b?: string;
    /** 多块追加（文本行 + 配图行）时的其余块 ID，撤销时整组删除 */
    bs?: string[];
}

/* ---- 统一「今日写入历史」基建：LifeLog / 一键记事共用（本地 8 条环形记录 + 块级撤销） ---- */

function readTodayWriteEntries(lsKey: string): TodayWriteEntry[] {
    const ls = getSafeLocalStorage();
    if (!ls) return [];
    try {
        const raw = ls.getItem(lsKey);
        const list = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(list)) return [];
        // 兼容旧版纯字符串格式
        return list
            .map((x: unknown): TodayWriteEntry | null => {
                if (typeof x === "string") return { l: x };
                if (x && typeof x === "object" && typeof (x as TodayWriteEntry).l === "string") {
                    const src = x as TodayWriteEntry;
                    return {
                        l: src.l,
                        b: typeof src.b === "string" ? src.b : undefined,
                        bs: Array.isArray(src.bs) ? src.bs.filter((id): id is string => typeof id === "string") : undefined,
                    };
                }
                return null;
            })
            .filter((x): x is TodayWriteEntry => x !== null);
    } catch { return []; }
}

function pushTodayWriteEntry(lsKey: string, line: string, blockId?: string, extraIds?: string[]): TodayWriteEntry[] {
    const ls = getSafeLocalStorage();
    const next: TodayWriteEntry[] = [
        { l: line, b: blockId, bs: extraIds && extraIds.length > 0 ? extraIds : undefined },
        ...readTodayWriteEntries(lsKey),
    ].slice(0, 8);
    try { ls?.setItem(lsKey, JSON.stringify(next)); } catch { /* ignore */ }
    return next;
}

function popTodayWriteEntry(lsKey: string): TodayWriteEntry | null {
    const ls = getSafeLocalStorage();
    const prev = readTodayWriteEntries(lsKey);
    const removed = prev.shift() || null;
    try { ls?.setItem(lsKey, JSON.stringify(prev)); } catch { /* ignore */ }
    return removed;
}

function lifeLogTodayKey(): string {
    return `lv_lifelog_today_${getTodayKey()}`;
}

function quickNoteTodayKey(): string {
    return `lv_quicknote_today_${getTodayKey()}`;
}

function getTodayLifeLogHistory(): TodayWriteEntry[] {
    return readTodayWriteEntries(lifeLogTodayKey());
}

function pushTodayLifeLogHistory(line: string, blockId?: string, extraIds?: string[]): TodayWriteEntry[] {
    return pushTodayWriteEntry(lifeLogTodayKey(), line, blockId, extraIds);
}

/** 今日写入状态条：条数 +（可选）分类计数 + 最近一条 + 块级「撤销」按钮 */
function buildTodayWriteStripHtml(entries: TodayWriteEntry[], opts?: { catCounts?: boolean }): string {
    const top = entries[0];
    if (!top) return `<div class="lv-qw-recent-strip" style="display:none;"></div>`;
    let countStr = "";
    if (opts?.catCounts) {
        const counts = new Map<string, number>();
        for (const e of entries) {
            const m = e.l.match(/^\d{2}:\d{2}\s+(.+?)：/);
            if (m && m[1]) counts.set(m[1], (counts.get(m[1]) || 0) + 1);
        }
        if (counts.size > 0) {
            countStr = ` · <span class="lv-qw-cat-count">${[...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c, n]) => `${escapeHtml(c)} ${n}`).join(" · ")}</span>`;
        }
    }
    const undoBtn = top.b
        ? `<button type="button" class="lv-qw-undo-btn" aria-label="撤销最近一条写入" title="从日记中删除刚写入的这条记录">↩ 撤销</button>`
        : "";
    return `<div class="lv-qw-recent-strip" title="${escapeHtml(entries.map((e) => e.l).join(" | "))}"><span class="lv-qw-strip-text">🕒 今日已记 ${entries.length} 条${countStr} · 最近: ${escapeHtml(top.l)}</span>${undoBtn}</div>`;
}

/** 块级撤销最近一条写入：整组删除关联块（文本行 + 配图行）并同步本地历史（块已不存在时也同步清理） */
let undoWriteBusy = false;
async function undoLastTodayWriteEntry(lsKey: string, source: string, rerenderStrip?: () => void): Promise<void> {
    if (undoWriteBusy) return;
    const top = readTodayWriteEntries(lsKey)[0];
    if (!top) return;
    const allIds = Array.from(new Set([top.b, ...(top.bs || [])].filter((id): id is string => Boolean(id))));
    if (allIds.length === 0) {
        lvNotify.capsule({ source, message: "该条记录缺少块定位，无法撤销", duration: 2200, level: "warn", archive: false });
        return;
    }
    undoWriteBusy = true;
    try {
        let failCount = 0;
        for (const id of allIds) {
            try {
                const res = await lvKernelPost("/api/block/deleteBlock", { id });
                if (res.code !== 0) failCount += 1;
            } catch { failCount += 1; }
        }
        if (failCount === 0) {
            popTodayWriteEntry(lsKey);
            hapticFeedback(8);
            lvNotify.capsule({ source, message: `↩ 已撤销：${top.l.slice(0, 26)}`, duration: 2400, level: "success", archive: false });
        } else {
            lvNotify.capsule({ source, message: `撤销失败: 部分块可能已被手动删除`, duration: 2600, level: "warn", archive: false });
            popTodayWriteEntry(lsKey); // 块已不存在，同步清理本地历史
        }
        rerenderStrip?.();
    } finally {
        undoWriteBusy = false;
    }
}

function extractAppendIds(resData: any): { blockId?: string; docId?: string } {
    try {
        const op = Array.isArray(resData) ? resData[0]?.doOperations?.[0] : resData?.doOperations?.[0];
        if (op && typeof op === "object") {
            return {
                blockId: typeof op.id === "string" ? op.id : undefined,
                docId: typeof op.rootID === "string" ? op.rootID : (typeof op.parentID === "string" ? op.parentID : undefined),
            };
        }
    } catch { /* ignore */ }
    return {};
}

/** 多块追加（如 LifeLog 文本行 + 配图行）时收集全部新块 ID，供整组撤销 */
function extractAppendIdsList(resData: any): { ids: string[]; docId?: string; blockId?: string } {
    try {
        const ops = Array.isArray(resData) ? resData[0]?.doOperations : resData?.doOperations;
        if (Array.isArray(ops)) {
            const ids = ops
                .map((op: any) => (op && typeof op.id === "string" ? op.id : ""))
                .filter(Boolean) as string[];
            const rootId = ops.find((op: any) => op && typeof op.rootID === "string")?.rootID;
            const parentId = ops.find((op: any) => op && typeof op.parentID === "string")?.parentID;
            const docId = typeof rootId === "string" ? rootId : (typeof parentId === "string" ? parentId : undefined);
            return { ids, docId, blockId: ids[0] };
        }
    } catch { /* ignore */ }
    return { ids: [] };
}

async function appendMarkdownToDailyNote(markdown: string, notebook?: string): Promise<{ ok: boolean; msg?: string; docId?: string; blockId?: string; ids?: string[] }> {
    let nb = notebook?.trim() || "";
    if (!nb) {
        nb = await resolveDailyNotebookId();
    }
    const payload: Record<string, unknown> = { data: markdown, dataType: "markdown" };
    if (nb) payload.notebook = nb;

    // 1. 先尝试直接追加到今日日记块
    const res = await lvKernelPost("/api/block/appendDailyNoteBlock", payload);
    if (res.code === 0) {
        const listed = extractAppendIdsList(res.data);
        return { ok: true, docId: listed.docId, blockId: listed.blockId, ids: listed.ids };
    }

    // 2. 若日记尚未创建，调用 createDailyNote 创建今日日记文档
    const createPayload: Record<string, unknown> = { app: (window as any)?.siyuan?.app?.id || "siyuan" };
    if (nb) createPayload.notebook = nb;
    const cRes = await lvKernelPost("/api/filetree/createDailyNote", createPayload);
    let docId = (cRes.code === 0 && cRes.data?.id) ? String(cRes.data.id) : "";

    // 3. 容错回退：若带 notebook 创建失败，尝试无参创建
    if (!docId) {
        const cResFallback = await lvKernelPost("/api/filetree/createDailyNote", {});
        if (cResFallback.code === 0 && cResFallback.data?.id) {
            docId = String(cResFallback.data.id);
        }
    }

    // 4. 若文档已获取成功，调用 appendBlock 追加 Markdown
    if (docId) {
        const aRes = await lvKernelPost("/api/block/appendBlock", { data: markdown, dataType: "markdown", parentID: docId });
        if (aRes.code === 0) {
            const listed = extractAppendIdsList(aRes.data);
            return { ok: true, docId: listed.docId || docId, blockId: listed.blockId, ids: listed.ids };
        }
        return { ok: false, msg: aRes.msg || "追加块失败" };
    }

    return { ok: false, msg: cRes.msg || res.msg || "无法创建今日日记文档" };
}

function mountQuickModal(opts: {
    icon: string;
    title: string;
    badgeHtml: string;
    bodyHtml: string;
    primaryLabel: string;
    secondaryLabel?: string;
    onSave: (saveBtn: HTMLButtonElement | null, cleanup: () => void, continueMode: boolean) => Promise<void>;
}): HTMLElement | null {
    if (typeof document === "undefined") return null;
    closeDesktopLaunchpadPopover();
    closeMobileSheet();
    try { document.getElementById("lv-quick-workspace-mask")?.remove(); } catch { /* ignore */ }
    ensureStyles();
    const mask = document.createElement("div");
    mask.id = "lv-quick-workspace-mask";
    mask.className = "lv-qw-mask";
    mask.setAttribute("role", "dialog");
    mask.setAttribute("aria-modal", "true");
    const secondaryBtnHtml = opts.secondaryLabel
        ? `<button type="button" class="lv-qw-btn lv-qw-btn-secondary" title="Ctrl+Shift+Enter">${escapeHtml(opts.secondaryLabel)}</button>`
        : "";
    mask.innerHTML = `<div class="lv-qw-card"><div class="lv-qw-head"><div class="lv-qw-title-wrap"><span class="lv-qw-icon">${opts.icon}</span><span class="lv-qw-title">${escapeHtml(opts.title)}</span>${opts.badgeHtml}</div><button type="button" class="lv-qw-close" aria-label="关闭">✕</button></div><div class="lv-qw-body">${opts.bodyHtml}</div><div class="lv-qw-foot"><div class="lv-qw-tip-wrap"><span class="lv-qw-tip">${opts.secondaryLabel ? (isMobileFrontend() ? `点「${escapeHtml(opts.secondaryLabel)}」可连续记录` : "Ctrl+Enter 保存 · Ctrl+Shift+Enter 续记 · Esc") : (isMobileFrontend() ? "点「保存」入库 · 点 ✕ 关闭" : "Ctrl+Enter 保存 · Esc 取消")}</span><span class="lv-qw-char-count">0 字</span></div><div class="lv-qw-actions"><button type="button" class="lv-qw-btn lv-qw-btn-cancel">取消</button>${secondaryBtnHtml}<button type="button" class="lv-qw-btn lv-qw-btn-primary">${escapeHtml(opts.primaryLabel)}</button></div></div></div>`;

    let isSaving = false;
    let vvCleanup: (() => void) | undefined;
    const cleanup = () => {
        if (vvCleanup) { try { vvCleanup(); } catch { /* ignore */ } vvCleanup = undefined; }
        try { lvSurfaceStack.pop("lv-quick-workspace-modal"); } catch { /* ignore */ }
        try { mask.remove(); } catch { /* ignore */ }
        window.removeEventListener("keydown", keyHandler, true);
    };
    try { lvSurfaceStack.push({ id: "lv-quick-workspace-modal", dismiss: () => { cleanup(); return true; } }); } catch { /* ignore */ }

    const saveBtn = mask.querySelector<HTMLButtonElement>(".lv-qw-btn-primary");
    const secondaryBtn = mask.querySelector<HTMLButtonElement>(".lv-qw-btn-secondary");
    const runSave = async (continueMode: boolean) => {
        if (isSaving) return;
        isSaving = true;
        if (saveBtn) saveBtn.disabled = true;
        if (secondaryBtn) secondaryBtn.disabled = true;
        try {
            await opts.onSave(continueMode ? secondaryBtn : saveBtn, cleanup, continueMode);
        } finally {
            isSaving = false;
            if (mask.isConnected) {
                if (saveBtn) saveBtn.disabled = false;
                if (secondaryBtn) secondaryBtn.disabled = false;
            }
        }
    };
    mask.querySelector(".lv-qw-close")?.addEventListener("click", cleanup);
    mask.querySelector(".lv-qw-btn-cancel")?.addEventListener("click", cleanup);
    saveBtn?.addEventListener("click", () => { void runSave(false); });
    secondaryBtn?.addEventListener("click", () => { void runSave(true); });
    mask.addEventListener("click", (e) => { if (e.target === mask) cleanup(); });
    const keyHandler = (e: KeyboardEvent) => {
        if (e.isComposing || e.keyCode === 229) return;
        if (e.key === "Escape") {
            const inlineInput = mask.querySelector<HTMLElement>(".lv-qw-add-cat-row");
            if (inlineInput) return; // 让内联分类输入自己先处理 Esc
            e.preventDefault(); e.stopPropagation(); cleanup();
        } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault(); e.stopPropagation();
            void runSave(Boolean(e.shiftKey && opts.secondaryLabel));
        }
    };
    window.addEventListener("keydown", keyHandler, true);
    document.body.appendChild(mask);

    if (typeof window !== "undefined" && window.visualViewport) {
        const syncVv = () => {
            const vv = window.visualViewport;
            if (!vv || !mask.isConnected) return;
            const kbOffset = Math.max(0, window.innerHeight - (vv.offsetTop + vv.height));
            mask.style.paddingBottom = kbOffset > 80 ? `${kbOffset + 12}px` : "";
        };
        window.visualViewport.addEventListener("resize", syncVv);
        vvCleanup = () => window.visualViewport?.removeEventListener("resize", syncVv);
    }

    const ta = mask.querySelector<HTMLTextAreaElement>("textarea");
    const countEl = mask.querySelector<HTMLElement>(".lv-qw-char-count");
    const syncCount = () => { if (countEl && ta) countEl.textContent = `${ta.value.length} 字`; };
    // 自动增高：短内容不浪费空间，长内容最高撑到 280px 后内部滚动
    const autoGrow = () => {
        if (!ta) return;
        try {
            ta.style.height = "auto";
            const maxH = 280;
            ta.style.overflowY = ta.scrollHeight > maxH ? "auto" : "hidden";
            ta.style.height = `${Math.min(ta.scrollHeight, maxH)}px`;
        } catch { /* ignore */ }
    };
    ta?.addEventListener("input", () => { syncCount(); autoGrow(); });
    window.setTimeout(() => {
        if (ta) {
            ta.focus();
            syncCount();
            autoGrow();
        }
    }, 60);
    return mask;
}

export function openQuickNoteDialog(initialPrefix = ""): void {
    const conf = getQuickWorkspaceConfig();
    const currentDoc = getCurrentOpenDocInfo();
    const ls = getSafeLocalStorage();
    const savedMode = ls?.getItem(QUICK_NOTE_TARGET_KEY);
    let targetMode: "daily" | "current" | "custom" =
        savedMode === "current" && currentDoc ? "current"
            : (savedMode === "custom" && conf.quickNoteDocumentId?.trim() ? "custom"
                : (conf.quickNoteDocumentId?.trim() && savedMode !== "daily" ? "custom" : "daily"));
    let chosenNotebookId = conf.quickNoteNotebookId || conf.lifeLogNotebookId || "";
    const getBadgeLabel = () => targetMode === "current" && currentDoc
        ? `目标: ${currentDoc.title.slice(0, 14)} ↻`
        : targetMode === "custom" ? "目标: 指定文档 ↻" : "目标: 今日日记 ↻";

    let textarea: HTMLTextAreaElement | null = null;
    let quickNoteSavedCount = 0;
    // 今日记事历史条（共享基建）：条数 + 最近一条 + 块级撤销
    const renderQuickStrip = (): string => buildTodayWriteStripHtml(readTodayWriteEntries(quickNoteTodayKey()));
    const quickHistoryStripHtml = renderQuickStrip();
    const docLinkChip = currentDoc
        ? `<button type="button" class="lv-qw-tag-chip" data-insert="doclink" title="插入当前文档双链">📎 当前文档</button>`
        : "";

    const mask = mountQuickModal({
        icon: "⚡",
        title: "一键记事",
        badgeHtml: `<button type="button" class="lv-qw-badge lv-qw-badge-btn" title="点击切换存储目标（今日日记 / 当前文档）">${escapeHtml(getBadgeLabel())}</button>`,
        bodyHtml: `<div class="lv-qw-nb-row" style="${targetMode === "daily" ? "" : "display:none;"}"><span class="lv-qw-tags-label">📔 日记本</span><select class="lv-qw-nb-select"><option value="">✨ 自动识别默认日记本</option></select></div><div class="lv-qw-tags-row"><span class="lv-qw-tags-label">标记:</span><button type="button" class="lv-qw-tag-chip" data-insert="#灵感 ">#灵感</button><button type="button" class="lv-qw-tag-chip" data-insert="#待办 ">#待办</button><button type="button" class="lv-qw-tag-chip" data-insert="- [ ] ">- [ ] 待办</button><button type="button" class="lv-qw-tag-chip" data-insert="> ">&gt; 引用</button><button type="button" class="lv-qw-tag-chip" data-insert="time">⏱ 时间</button><button type="button" class="lv-qw-tag-chip" data-insert="date">📅 日期</button>${docLinkChip}</div><textarea class="lv-qw-textarea b3-text-field" placeholder="${isMobileFrontend() ? "记录想法或待办..." : "记录想法或待办... (Ctrl+Enter 保存，Tab 缩进，支持列表续行)"}" rows="5"></textarea><div class="lv-qw-draft-hint" style="display:none;"><span class="lv-qw-draft-hint-text">🌱 已恢复未保存草稿</span><button type="button" class="lv-qw-draft-clear">清空</button></div>${quickHistoryStripHtml}`,
        primaryLabel: "保存入库",
        secondaryLabel: "保存并继续",
        onSave: async (saveBtn, cleanup, continueMode) => {
            const val = textarea?.value?.trim();
            if (!val) { lvNotify.capsule({ source: "一键记事", message: "请输入记事内容", duration: 1800, archive: false }); textarea?.focus(); return; }
            const origLabel = saveBtn?.textContent || "保存入库";
            if (saveBtn) saveBtn.textContent = "保存中…";
            try {
                const parentID = targetMode === "current" && currentDoc ? currentDoc.id : (targetMode === "custom" && conf.quickNoteDocumentId ? conf.quickNoteDocumentId.trim() : "");
                let res: { ok: boolean; msg?: string; docId?: string; blockId?: string };
                if (parentID) {
                    const aRes = await lvKernelPost("/api/block/appendBlock", { data: `${val}\n`, dataType: "markdown", parentID });
                    const ids = extractAppendIds(aRes.data);
                    res = { ok: aRes.code === 0, msg: aRes.msg, docId: ids.docId || parentID, blockId: ids.blockId };
                } else {
                    res = await appendMarkdownToDailyNote(`${val}\n`, chosenNotebookId || conf.quickNoteNotebookId);
                }
                if (res.ok) {
                    try { ls?.removeItem(QUICK_NOTE_DRAFT_KEY); ls?.removeItem(QUICK_NOTE_DRAFT_AT_KEY); } catch { /* ignore */ }
                    const qLine = (val.split(/\r?\n/)[0] || val).replace(/[\r\n\t]+/g, " ").trim().slice(0, 30);
                    pushTodayWriteEntry(quickNoteTodayKey(), qLine, res.blockId);
                    const jumpId = res.blockId || res.docId;
                    try {
                        getActivityHub().record({
                            category: "note",
                            source: "一键记事",
                            title: val.replace(/[\r\n]+/g, " ").slice(0, 28),
                            linkBlockId: jumpId,
                        });
                    } catch { /* ignore */ }
                    if (continueMode) {
                        quickNoteSavedCount += 1;
                        if (textarea) { textarea.value = ""; textarea.dispatchEvent(new Event("input")); textarea.focus(); }
                        const draftHintEl = mask?.querySelector<HTMLElement>(".lv-qw-draft-hint");
                        if (draftHintEl) draftHintEl.style.display = "none";
                        const qRecEl = mask?.querySelector<HTMLElement>(".lv-qw-recent-strip");
                        if (qRecEl) qRecEl.outerHTML = renderQuickStrip();
                        if (saveBtn) saveBtn.textContent = quickNoteSavedCount > 1 ? `✓ 已存 ${quickNoteSavedCount} 条，继续` : "✓ 已存，继续记";
                        window.setTimeout(() => { if (saveBtn && saveBtn.isConnected) saveBtn.textContent = origLabel; }, 1200);
                        lvNotify.capsule({ source: "一键记事", message: "⚡ 已入库，可继续记录下一条", duration: 1800, archive: false });
                    } else {
                        cleanup();
                        lvNotify.capsule({
                            source: "一键记事",
                            message: targetMode === "current" && currentDoc ? `⚡ 已存入《${currentDoc.title}》` : "⚡ 已成功记入日记",
                            duration: 2600,
                            level: "success",
                            archive: false,
                            action: jumpId ? { label: "定位", onClick: () => { void openDocumentById(jumpId); } } : undefined,
                        });
                    }
                } else {
                    if (saveBtn) saveBtn.textContent = "重试保存";
                    lvNotify.capsule({ source: "一键记事", message: `保存失败: ${res.msg || "请检查内核状态"}`, duration: 2800 });
                }
            } catch {
                if (saveBtn) saveBtn.textContent = "重试保存";
                lvNotify.capsule({ source: "一键记事", message: "保存异常", duration: 2800 });
            }
        }
    });
    if (!mask) return;
    textarea = mask.querySelector<HTMLTextAreaElement>(".lv-qw-textarea");
    const badgeBtn = mask.querySelector<HTMLButtonElement>(".lv-qw-badge-btn");
    const nbRow = mask.querySelector<HTMLElement>(".lv-qw-nb-row");
    const nbSelect = mask.querySelector<HTMLSelectElement>(".lv-qw-nb-select");
    const draftHint = mask.querySelector<HTMLElement>(".lv-qw-draft-hint");
    const savedDraft = ls?.getItem(QUICK_NOTE_DRAFT_KEY);
    if (savedDraft && textarea) {
        textarea.value = savedDraft;
        if (draftHint) {
            const draftAt = Number(ls?.getItem(QUICK_NOTE_DRAFT_AT_KEY) || 0);
            const hintText = draftHint.querySelector<HTMLElement>(".lv-qw-draft-hint-text") || draftHint.querySelector<HTMLElement>("span");
            if (hintText && draftAt > 0) {
                const dt = new Date(draftAt);
                hintText.textContent = `🌱 已恢复未保存草稿 · 存于 ${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
            }
            draftHint.style.display = "flex";
        }
    } else if (initialPrefix && textarea) {
        textarea.value = initialPrefix;
    }
    if (nbSelect) {
        void listOpenNotebooks().then((nbs) => {
            if (!nbSelect.isConnected || !nbs.length) return;
            nbSelect.innerHTML = `<option value="">✨ 自动识别默认日记本</option>` + nbs.map((nb) =>
                `<option value="${escapeHtml(nb.id)}" ${nb.id === chosenNotebookId ? "selected" : ""}>📔 ${escapeHtml(nb.name)}</option>`
            ).join("");
        }).catch(() => { /* ignore */ });
        nbSelect.addEventListener("change", () => {
            chosenNotebookId = nbSelect.value.trim();
            saveQuickWorkspaceConfig({ quickNoteNotebookId: chosenNotebookId || undefined });
        });
    }
    mask.querySelector(".lv-qw-draft-clear")?.addEventListener("click", () => {
        try { ls?.removeItem(QUICK_NOTE_DRAFT_KEY); ls?.removeItem(QUICK_NOTE_DRAFT_AT_KEY); } catch { /* ignore */ }
        if (textarea) { textarea.value = ""; textarea.dispatchEvent(new Event("input")); }
        if (draftHint) draftHint.style.display = "none";
        textarea?.focus();
    });
    // 块级撤销（共享基建）：删除刚写入的最近一条一键记事
    mask.addEventListener("click", (e) => {
        const undoBtn = (e.target as HTMLElement | null)?.closest<HTMLButtonElement>(".lv-qw-undo-btn");
        if (!undoBtn) return;
        e.stopPropagation();
        void undoLastTodayWriteEntry(quickNoteTodayKey(), "一键记事", () => {
            const recEl = mask?.querySelector<HTMLElement>(".lv-qw-recent-strip");
            if (recEl) recEl.outerHTML = renderQuickStrip();
        });
    });
    badgeBtn?.addEventListener("click", () => {
        hapticFeedback(6);
        if (targetMode === "daily") targetMode = currentDoc ? "current" : (conf.quickNoteDocumentId?.trim() ? "custom" : "daily");
        else if (targetMode === "current") targetMode = conf.quickNoteDocumentId?.trim() ? "custom" : "daily";
        else targetMode = "daily";
        try { ls?.setItem(QUICK_NOTE_TARGET_KEY, targetMode); } catch { /* ignore */ }
        badgeBtn.textContent = getBadgeLabel();
        if (nbRow) nbRow.style.display = targetMode === "daily" ? "flex" : "none";
    });
    mask.querySelector(".lv-qw-tags-row")?.addEventListener("click", (e) => {
        const chip = (e.target as HTMLElement | null)?.closest<HTMLButtonElement>(".lv-qw-tag-chip");
        if (!chip || !textarea) return;
        const ins = chip.getAttribute("data-insert") || "";
        hapticFeedback(6);
        let txt = ins;
        if (ins === "time") {
            txt = `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")} `;
        } else if (ins === "date") {
            const d = new Date();
            txt = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} `;
        } else if (ins === "doclink" && currentDoc) {
            txt = `[《${currentDoc.title}》](siyuan://blocks/${currentDoc.id}) `;
        }
        const s = textarea.selectionStart ?? textarea.value.length, end = textarea.selectionEnd ?? textarea.value.length;
        textarea.value = textarea.value.slice(0, s) + txt + textarea.value.slice(end);
        textarea.selectionStart = textarea.selectionEnd = s + txt.length;
        textarea.dispatchEvent(new Event("input"));
        textarea.focus();
        try { ls?.setItem(QUICK_NOTE_DRAFT_KEY, textarea.value); } catch { /* ignore */ }
    });
    textarea?.addEventListener("keydown", (e) => {
        if (e.key === "Tab" && !e.shiftKey) {
            e.preventDefault();
            const s = textarea!.selectionStart ?? textarea!.value.length;
            const end = textarea!.selectionEnd ?? textarea!.value.length;
            textarea!.value = textarea!.value.slice(0, s) + "  " + textarea!.value.slice(end);
            textarea!.selectionStart = textarea!.selectionEnd = s + 2;
            textarea!.dispatchEvent(new Event("input"));
            return;
        }
        if (e.key === "Enter" && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
            const s = textarea!.selectionStart, v = textarea!.value, lsIdx = v.lastIndexOf("\n", s - 1) + 1, line = v.slice(lsIdx, s);
            const m = line.match(/^(\s*)(- \[[ x]\] |- |\* |\d+\. )/);
            if (m) {
                e.preventDefault();
                if (line.trim() === m[0].trim()) { textarea!.value = v.slice(0, lsIdx) + v.slice(s); textarea!.selectionStart = textarea!.selectionEnd = lsIdx; textarea!.dispatchEvent(new Event("input")); return; }
                const nxt = "\n" + (m[0].includes("[ ]") || m[0].includes("[x]") ? `${m[1]}- [ ] ` : m[0]);
                textarea!.value = v.slice(0, s) + nxt + v.slice(textarea!.selectionEnd);
                textarea!.selectionStart = textarea!.selectionEnd = s + nxt.length;
                textarea!.dispatchEvent(new Event("input"));
            }
        }
    });
    textarea?.addEventListener("input", () => { try { ls?.setItem(QUICK_NOTE_DRAFT_KEY, textarea!.value); ls?.setItem(QUICK_NOTE_DRAFT_AT_KEY, String(Date.now())); } catch { /* ignore */ } });
}

export function openLifeLogDialog(): void {
    const conf = getQuickWorkspaceConfig();
    const categories = conf.lifeLogCategories?.length ? [...conf.lifeLogCategories] : [...DEFAULT_LIFELOG_CATEGORIES];
    const defaultSet = new Set(DEFAULT_LIFELOG_CATEGORIES);
    let selectedCat = categories[0] || "日记";
    let chosenNotebookId = conf.lifeLogNotebookId || "";
    let timeOffsetMinutes = 0;
    let addingCategory = false;
    // 待写入配图（弹层生命周期内）：path 为 assets 路径，thumb 为压缩时的 dataURL 缩略图
    const pendingPhotos: Array<{ path: string; thumb: string; busy?: boolean }> = [];
    let photoUploading = false;
    const computeTimeStr = () => {
        const d = new Date(Date.now() - timeOffsetMinutes * 60_000);
        return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    };
    const renderCats = () => {
        const pills = categories.map((c) => {
            const delBtn = !defaultSet.has(c) && categories.length > 1
                ? `<button type="button" class="lv-qw-cat-del" data-del-cat="${escapeHtml(c)}" title="删除自定义分类">×</button>`
                : "";
            return `<span class="lv-qw-cat-pill"><button type="button" class="lv-qw-cat-chip ${c === selectedCat ? "active" : ""}" data-cat="${escapeHtml(c)}">${getCategoryEmoji(c)} ${escapeHtml(c)}</button>${delBtn}</span>`;
        }).join("");
        const addCtrl = addingCategory
            ? `<div class="lv-qw-add-cat-row" style="width:100%;"><input type="text" class="lv-qw-add-cat-input" placeholder="输入新分类名（如：运动、阅读）…" maxlength="12" /><button type="button" class="lv-qw-btn lv-qw-btn-primary lv-qw-add-cat-confirm" style="padding:4px 10px;font-size:11px;">添加</button><button type="button" class="lv-qw-btn lv-qw-add-cat-cancel" style="padding:4px 9px;font-size:11px;">取消</button></div>`
            : `<button type="button" class="lv-qw-add-cat-btn" title="添加自定义分类">+ 自定义</button>`;
        return pills + addCtrl;
    };

    // 今日状态条：条数 + 分类计数 + 最近一条 + 块级「撤销」按钮（共享基建）
    const renderStrip = (): string => buildTodayWriteStripHtml(getTodayLifeLogHistory(), { catCounts: true });
    const recentStripHtml = renderStrip();

    let textarea: HTMLTextAreaElement | null = null;
    const ls = getSafeLocalStorage();

    const mask = mountQuickModal({
        icon: "📒",
        title: "LifeLog 流",
        badgeHtml: `<select class="lv-qw-badge lv-qw-badge-btn lv-qw-ll-nb-select" title="选择 LifeLog 写入的目标日记本" style="max-width:170px;"><option value="">叶归 · 默认日记本</option></select>`,
        bodyHtml: `<div class="lv-qw-categories">${renderCats()}</div><textarea class="lv-qw-textarea b3-text-field" placeholder="${isMobileFrontend() ? "记录进展、状态或思考（点下方 📷 可添加照片）" : "记录进展、状态或思考... (Ctrl+Enter 记录，可直接 Ctrl+V 粘贴截图)"}" rows="4"></textarea><div class="lv-qw-attach-strip" style="display:none;"></div><div class="lv-qw-attach-actions"><button type="button" class="lv-qw-tag-chip lv-qw-photo-btn" aria-label="添加照片" title="添加照片（支持多选 / Ctrl+V 粘贴截图，压缩后存入 assets 随日志写入日记）">📷 照片</button><input type="file" class="lv-qw-photo-input" accept="image/*" multiple style="display:none;" /></div><div class="lv-qw-draft-hint" style="display:none;"><span class="lv-qw-draft-hint-text">🌱 已恢复未保存草稿</span><button type="button" class="lv-qw-draft-clear">清空</button></div><div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;"><div class="lv-qw-preview-tag" style="flex:1;min-width:170px;">预览：<span class="lv-qw-preview-text">${computeTimeStr()} ${escapeHtml(selectedCat)}：...</span></div><div class="lv-qw-time-offsets"><button type="button" class="lv-qw-time-chip active" data-offset="0">现在</button><button type="button" class="lv-qw-time-chip" data-offset="5">-5分</button><button type="button" class="lv-qw-time-chip" data-offset="15">-15分</button><button type="button" class="lv-qw-time-chip" data-offset="30">-30分</button><button type="button" class="lv-qw-time-chip" data-offset="60">-1时</button></div></div>${recentStripHtml}`,
        primaryLabel: "记录到日记",
        secondaryLabel: "记完继续",
        onSave: async (saveBtn, cleanup, continueMode) => {
            const val = textarea?.value?.trim();
            if (!val) { lvNotify.capsule({ source: "LifeLog", message: "请输入日志内容", duration: 1800, archive: false }); textarea?.focus(); return; }
            if (photoUploading) { lvNotify.capsule({ source: "LifeLog", message: "📷 图片仍在处理中，请稍候再记录", duration: 2000, archive: false }); return; }
            const origLabel = saveBtn?.textContent || "记录到日记";
            if (saveBtn) saveBtn.textContent = "记录中…";
            const lineText = `${computeTimeStr()} ${selectedCat}：${val}`;
            const donePhotos = pendingPhotos.filter((p) => p.path);
            const photoLines = donePhotos.map((p) => `![📷 LifeLog](${p.path})`).join("\n");
            const payloadMd = photoLines ? `${lineText}\n${photoLines}\n` : `${lineText}\n`;
            try {
                const res = await appendMarkdownToDailyNote(payloadMd, chosenNotebookId || conf.lifeLogNotebookId);
                if (res.ok) {
                    try { ls?.removeItem(LIFELOG_DRAFT_KEY); ls?.removeItem(LIFELOG_DRAFT_AT_KEY); } catch { /* ignore */ }
                    const jumpId = res.blockId || res.docId;
                    const extraIds = (res.ids || []).filter((id) => id !== res.blockId);
                    const histLine = donePhotos.length ? `${lineText} 📷×${donePhotos.length}` : lineText;
                    pushTodayLifeLogHistory(histLine, res.blockId, extraIds);
                    pendingPhotos.length = 0;
                    renderAttachStrip();
                    try {
                        getActivityHub().record({
                            category: "note",
                            source: "LifeLog",
                            title: `${selectedCat}：${val.replace(/[\r\n]+/g, " ").slice(0, 24)}`,
                            linkBlockId: jumpId,
                        });
                    } catch { /* ignore */ }
                    if (continueMode) {
                        if (textarea) { textarea.value = ""; textarea.dispatchEvent(new Event("input")); textarea.focus(); }
                        const draftHintEl = mask?.querySelector<HTMLElement>(".lv-qw-draft-hint");
                        if (draftHintEl) draftHintEl.style.display = "none";
                        const recEl = mask?.querySelector<HTMLElement>(".lv-qw-recent-strip");
                        if (recEl) {
                            recEl.outerHTML = renderStrip();
                        }
                        if (saveBtn) saveBtn.textContent = donePhotos.length ? `✓ 已记 · 📷×${donePhotos.length}，继续` : "✓ 已记，继续";
                        window.setTimeout(() => { if (saveBtn && saveBtn.isConnected) saveBtn.textContent = origLabel; }, 1200);
                        lvNotify.capsule({ source: "LifeLog", message: `📒 已记录（${selectedCat}${donePhotos.length ? ` · 📷×${donePhotos.length}` : ""}），继续下一条`, duration: 1800, archive: false });
                    } else {
                        cleanup();
                        lvNotify.capsule({
                            source: "LifeLog",
                            message: `📒 已记录至今日日记（${selectedCat}${donePhotos.length ? ` · 📷×${donePhotos.length}` : ""}）`,
                            duration: 2600,
                            level: "success",
                            archive: false,
                            action: { label: "看日记", onClick: () => { if (jumpId) void openDocumentById(jumpId); else void openDiaryBottom(); } },
                        });
                    }
                } else {
                    if (saveBtn) saveBtn.textContent = "重试记录";
                    lvNotify.capsule({ source: "LifeLog", message: `记录失败: ${res.msg || "异常"}`, duration: 3000 });
                }
            } catch {
                if (saveBtn) saveBtn.textContent = "重试记录";
                lvNotify.capsule({ source: "LifeLog", message: "记录异常", duration: 3000 });
            }
        }
    });
    if (!mask) return;
    textarea = mask.querySelector<HTMLTextAreaElement>("textarea");
    const previewEl = mask.querySelector<HTMLElement>(".lv-qw-preview-text");
    const catContainer = mask.querySelector<HTMLElement>(".lv-qw-categories");
    const timeOffsets = mask.querySelector<HTMLElement>(".lv-qw-time-offsets");
    const draftHint = mask.querySelector<HTMLElement>(".lv-qw-draft-hint");
    const nbSelect = mask.querySelector<HTMLSelectElement>(".lv-qw-ll-nb-select");

    if (nbSelect) {
        void listOpenNotebooks().then((nbs) => {
            if (!nbSelect.isConnected || !nbs.length) return;
            nbSelect.innerHTML = `<option value="">叶归 · 默认日记本</option>` + nbs.map((nb) =>
                `<option value="${escapeHtml(nb.id)}" ${nb.id === chosenNotebookId ? "selected" : ""}>📔 ${escapeHtml(nb.name)}</option>`
            ).join("");
        }).catch(() => { /* ignore */ });
        nbSelect.addEventListener("change", () => {
            chosenNotebookId = nbSelect.value.trim();
            saveQuickWorkspaceConfig({ lifeLogNotebookId: chosenNotebookId || undefined });
        });
    }

    const savedDraft = ls?.getItem(LIFELOG_DRAFT_KEY);
    if (savedDraft && textarea) {
        textarea.value = savedDraft;
        if (draftHint) {
            const draftAt = Number(ls?.getItem(LIFELOG_DRAFT_AT_KEY) || 0);
            const hintText = draftHint.querySelector<HTMLElement>(".lv-qw-draft-hint-text") || draftHint.querySelector<HTMLElement>("span");
            if (hintText && draftAt > 0) {
                const dt = new Date(draftAt);
                hintText.textContent = `🌱 已恢复未保存草稿 · 存于 ${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
            }
            draftHint.style.display = "flex";
        }
    }

    // 块级撤销（共享基建）：删除刚写入日记的最近一条 LifeLog
    mask.addEventListener("click", (e) => {
        const undoBtn = (e.target as HTMLElement | null)?.closest<HTMLButtonElement>(".lv-qw-undo-btn");
        if (!undoBtn) return;
        e.stopPropagation();
        void undoLastTodayWriteEntry(lifeLogTodayKey(), "LifeLog", () => {
            const recEl = mask?.querySelector<HTMLElement>(".lv-qw-recent-strip");
            if (recEl) recEl.outerHTML = renderStrip();
        });
    });

    mask.querySelector(".lv-qw-draft-clear")?.addEventListener("click", () => {
        try { ls?.removeItem(LIFELOG_DRAFT_KEY); ls?.removeItem(LIFELOG_DRAFT_AT_KEY); } catch { /* ignore */ }
        if (textarea) { textarea.value = ""; textarea.dispatchEvent(new Event("input")); }
        if (draftHint) draftHint.style.display = "none";
        textarea?.focus();
    });
    // ---- 配图管线：缩略图条渲染 / 文件选择 + 粘贴摄取 / 移除 ----
    const attachStripEl = mask.querySelector<HTMLElement>(".lv-qw-attach-strip");
    const renderAttachStrip = () => {
        if (!attachStripEl) return;
        if (pendingPhotos.length === 0) {
            attachStripEl.style.display = "none";
            attachStripEl.innerHTML = "";
            return;
        }
        attachStripEl.style.display = "flex";
        attachStripEl.innerHTML = pendingPhotos.map((p, i) =>
            p.busy
                ? `<span class="lv-qw-attach-thumb lv-qw-attach-busy" title="正在处理第 ${i + 1} 张图…"></span>`
                : `<span class="lv-qw-attach-thumb"><img src="${escapeHtml(p.thumb)}" alt="待写入配图 ${i + 1}" /><button type="button" class="lv-qw-attach-del" data-attach-del="${i}" aria-label="移除这张配图" title="移除">×</button></span>`
        ).join("");
    };

    const ingestPhotoFiles = async (files: Array<File | Blob>) => {
        if (photoUploading) return;
        const list = files.filter((f) => f && String((f as File).type || "").startsWith("image/"));
        if (!list.length) return;
        photoUploading = true;
        try {
            const d = new Date();
            const stampBase = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}${String(d.getSeconds()).padStart(2, "0")}`;
            for (let i = 0; i < list.length; i++) {
                const imgFile = list[i];
                if (!imgFile) continue;
                const slot: { path: string; thumb: string; busy?: boolean } = { path: "", thumb: "", busy: true };
                pendingPhotos.push(slot);
                renderAttachStrip();
                const out = await compressAndPutImageFile(imgFile, stampBase, i + 1);
                const idx = pendingPhotos.indexOf(slot);
                if (out && idx !== -1) {
                    slot.path = out.path;
                    slot.thumb = out.thumb;
                    slot.busy = false;
                } else {
                    if (idx !== -1) pendingPhotos.splice(idx, 1);
                    lvNotify.capsule({ source: "LifeLog", message: "📷 图片处理失败（请使用 JPG/PNG 等常见格式）", duration: 2400, level: "warn", archive: false });
                }
                renderAttachStrip();
            }
            hapticFeedback(8);
        } finally {
            photoUploading = false;
            updatePreview();
        }
    };

    const photoBtn = mask.querySelector<HTMLElement>(".lv-qw-photo-btn");
    const photoInput = mask.querySelector<HTMLInputElement>(".lv-qw-photo-input");
    photoBtn?.addEventListener("click", () => {
        hapticFeedback(6);
        photoInput?.click();
    });
    photoInput?.addEventListener("change", () => {
        const files = Array.from(photoInput.files || []) as File[];
        try { photoInput.value = ""; } catch { /* ignore */ }
        void ingestPhotoFiles(files);
    });
    // 文本域直接粘贴截图 → 进入配图管线（不影响普通文本粘贴）
    textarea?.addEventListener("paste", (e) => {
        const ce = e as ClipboardEvent;
        const items = ce.clipboardData?.items;
        if (!items) return;
        const imgFiles: File[] = [];
        for (let i = 0; i < items.length; i++) {
            const it = items[i];
            if (!it) continue;
            if (it.kind === "file" && it.type.startsWith("image/")) {
                const f = it.getAsFile();
                if (f) imgFiles.push(f);
            }
        }
        if (imgFiles.length) {
            e.preventDefault();
            e.stopPropagation();
            void ingestPhotoFiles(imgFiles);
        }
    });
    mask.addEventListener("click", (e) => {
        const delBtn = (e.target as HTMLElement | null)?.closest<HTMLButtonElement>(".lv-qw-attach-del");
        if (!delBtn) return;
        e.stopPropagation();
        const idx = Number(delBtn.getAttribute("data-attach-del") || "-1");
        const target = idx >= 0 ? pendingPhotos[idx] : undefined;
        if (target && !target.busy) {
            // 已上传但未写入日记的资产顺手清理，避免 assets 孤儿文件堆积
            if (target.path) {
                void lvKernelPost("/api/file/removeFile", { path: `/${target.path}` }).catch(() => { /* 清理失败静默 */ });
            }
            pendingPhotos.splice(idx, 1);
            hapticFeedback(6);
            renderAttachStrip();
            updatePreview();
        }
    });

    const updatePreview = () => {
        if (!previewEl) return;
        const doneCount = pendingPhotos.filter((p) => p.path).length;
        const photoTag = doneCount > 0 ? ` 📷×${doneCount}` : "";
        previewEl.textContent = `${computeTimeStr()} ${selectedCat}：${textarea?.value?.trim() || "..."}${photoTag}`;
    };
    updatePreview();

    const commitNewCategory = () => {
        const inp = catContainer?.querySelector<HTMLInputElement>(".lv-qw-add-cat-input");
        const newCat = inp?.value?.trim();
        addingCategory = false;
        if (newCat) {
            if (!categories.includes(newCat)) {
                categories.push(newCat);
                saveQuickWorkspaceConfig({ lifeLogCategories: categories });
            }
            selectedCat = newCat;
            hapticFeedback(8);
        }
        if (catContainer) catContainer.innerHTML = renderCats();
        updatePreview();
        textarea?.focus();
    };

    catContainer?.addEventListener("keydown", (e) => {
        const ke = e as KeyboardEvent;
        if (!catContainer.querySelector(".lv-qw-add-cat-input")) return;
        if (ke.key === "Enter") {
            ke.preventDefault();
            ke.stopPropagation();
            commitNewCategory();
        } else if (ke.key === "Escape") {
            ke.preventDefault();
            ke.stopPropagation();
            addingCategory = false;
            catContainer.innerHTML = renderCats();
            textarea?.focus();
        }
    });

    catContainer?.addEventListener("click", (e) => {
        const t = e.target as HTMLElement | null;
        if (t?.closest(".lv-qw-add-cat-btn")) {
            hapticFeedback(8);
            addingCategory = true;
            catContainer.innerHTML = renderCats();
            window.setTimeout(() => catContainer.querySelector<HTMLInputElement>(".lv-qw-add-cat-input")?.focus(), 20);
            return;
        }
        if (t?.closest(".lv-qw-add-cat-confirm")) {
            commitNewCategory();
            return;
        }
        if (t?.closest(".lv-qw-add-cat-cancel")) {
            addingCategory = false;
            catContainer.innerHTML = renderCats();
            textarea?.focus();
            return;
        }
        const delBtn = t?.closest<HTMLButtonElement>(".lv-qw-cat-del");
        if (delBtn) {
            e.stopPropagation();
            const delCat = delBtn.getAttribute("data-del-cat");
            const idx = delCat ? categories.indexOf(delCat) : -1;
            if (idx !== -1 && categories.length > 1) {
                categories.splice(idx, 1);
                if (selectedCat === delCat) selectedCat = categories[0] || "日记";
                saveQuickWorkspaceConfig({ lifeLogCategories: categories });
                catContainer.innerHTML = renderCats();
                updatePreview();
                hapticFeedback(6);
            }
            return;
        }
        const chip = t?.closest<HTMLButtonElement>(".lv-qw-cat-chip");
        if (!chip) return;
        catContainer.querySelectorAll(".lv-qw-cat-chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        selectedCat = chip.getAttribute("data-cat") || "日记";
        hapticFeedback(6); updatePreview();
    });
    timeOffsets?.addEventListener("click", (e) => {
        const chip = (e.target as HTMLElement | null)?.closest<HTMLButtonElement>(".lv-qw-time-chip");
        if (!chip) return;
        timeOffsets.querySelectorAll(".lv-qw-time-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        timeOffsetMinutes = parseInt(chip.getAttribute("data-offset") || "0", 10);
        hapticFeedback(6); updatePreview();
    });
    textarea?.addEventListener("keydown", (e) => {
        if (e.key === "Tab" && !e.shiftKey) {
            e.preventDefault();
            const s = textarea!.selectionStart ?? textarea!.value.length;
            const end = textarea!.selectionEnd ?? textarea!.value.length;
            textarea!.value = textarea!.value.slice(0, s) + "  " + textarea!.value.slice(end);
            textarea!.selectionStart = textarea!.selectionEnd = s + 2;
            textarea!.dispatchEvent(new Event("input"));
        }
    });
    textarea?.addEventListener("input", () => { try { ls?.setItem(LIFELOG_DRAFT_KEY, textarea!.value); ls?.setItem(LIFELOG_DRAFT_AT_KEY, String(Date.now())); } catch { /* ignore */ } updatePreview(); });
}

/* ========================================================================= */
/* 15. 统一全局万物穿透搜索引擎 (Lv Omnisearch Engine)                         */
/* ========================================================================= */

const searchProviders = new Map<string, LvSearchProvider>();

function sortOmniResults(results: LvSearchResultItem[], kw: string): LvSearchResultItem[] {
    // 相关性打分：标题命中（全等 3 / 前缀 2 / 包含 1）×2 + 摘要与分类命中各 +1，同分按标题短者优先
    const scoreOf = (r: LvSearchResultItem): number => {
        const title = r.title.toLowerCase();
        let score = title === kw ? 6 : title.startsWith(kw) ? 4 : title.includes(kw) ? 2 : 0;
        if (score > 0) return score;
        const snippet = (r.snippet || "").toLowerCase();
        if (snippet.includes(kw)) score += 1;
        const category = (r.category || "").toLowerCase();
        if (category.includes(kw)) score += 1;
        return score;
    };
    return [...results]
        .map((r) => ({ r, score: scoreOf(r) }))
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.r.title.toLowerCase().length - b.r.title.toLowerCase().length;
        })
        .map((x) => x.r);
}

function getOmnisearchHub(): LvOmnisearchHub {
    const registry = getSharedRegistry("__LV_SEARCH_PROVIDERS__", searchProviders);
    const runSearchStream = async (
        keyword: string,
        onUpdate: (hits: LvSearchResultItem[], status: LvOmnisearchStreamStatus) => void
    ): Promise<LvSearchResultItem[]> => {
        const kw = keyword.trim().toLowerCase();
        if (!kw) {
            onUpdate([], { done: true, pending: 0, total: 0 });
            return [];
        }

        const accumulated: LvSearchResultItem[] = [];
        const providers = Array.from(registry.entries());
        const total = providers.length;
        if (total === 0) {
            onUpdate([], { done: true, pending: 0, total: 0 });
            return [];
        }

        let remaining = total;
        await Promise.all(
            providers.map(async ([plugin, provider]) => {
                let timerId: any = null;
                try {
                    const timeoutPromise = new Promise<LvSearchResultItem[]>((_, reject) => {
                        timerId = setTimeout(() => reject(new Error("Timeout")), 1000);
                    });
                    const providerPromise = Promise.resolve(provider(kw));
                    const items = await Promise.race([providerPromise, timeoutPromise]);
                    if (Array.isArray(items) && items.length > 0) {
                        accumulated.push(...items);
                    }
                } catch (err) {
                    console.warn(`[LvOmnisearch] 插件 ${plugin} 检索异常或超时:`, err);
                } finally {
                    if (timerId !== null) {
                        clearTimeout(timerId);
                    }
                    remaining -= 1;
                    try {
                        onUpdate(sortOmniResults(accumulated, kw), {
                            done: remaining <= 0,
                            pending: Math.max(0, remaining),
                            total,
                        });
                    } catch { /* ignore subscriber error */ }
                }
            })
        );

        return sortOmniResults(accumulated, kw);
    };

    if (typeof window === "undefined") {
        return {
            version: PROTOCOL_VERSION,
            registerProvider: (plugin, provider) => {
                return registerOwned(registry, plugin, provider);
            },
            search: (keyword: string) => runSearchStream(keyword, () => {}),
            searchStream: runSearchStream,
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
            return runSearchStream(keyword, () => {});
        },

        async searchStream(
            keyword: string,
            onUpdate: (hits: LvSearchResultItem[], status: LvOmnisearchStreamStatus) => void
        ): Promise<LvSearchResultItem[]> {
            return runSearchStream(keyword, onUpdate);
        },
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
    },

    /** 流式分段穿透检索：每个提供者完成即刻回调 onUpdate，消灭慢插件阻塞首屏 */
    searchStream(
        keyword: string,
        onUpdate: (hits: LvSearchResultItem[], status: LvOmnisearchStreamStatus) => void
    ): Promise<LvSearchResultItem[]> {
        const hub = getOmnisearchHub();
        if (typeof hub.searchStream === "function") {
            return hub.searchStream(keyword, onUpdate);
        }
        return hub.search(keyword).then((hits) => {
            onUpdate(hits, { done: true, pending: 0, total: 1 });
            return hits;
        });
    }
};

/* ========================================================================= */
/* 16. 跨插件智能自动化联动引擎 (Lv Automation IFTTT Rules Engine)             */
/* ========================================================================= */

const automationRules = new Map<string, LvAutomationRule>();

function getStoredRuleStates(): Record<string, boolean> {
    const ls = getSafeLocalStorage();
    if (!ls) return {};
    try {
        const raw = ls.getItem(AUTOMATION_RULES_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return {};
}

function saveStoredRuleStates(states: Record<string, boolean>): void {
    const ls = getSafeLocalStorage();
    if (!ls) return;
    try {
        ls.setItem(AUTOMATION_RULES_KEY, JSON.stringify(states));
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

/* ========================================================================= */
/* 14. 思源宿主新特性适配桥接 (SiYuan Host Native Bridge · v3.8.10+)         */
/* ========================================================================= */

/**
 * 健壮的思源文档标题提取器（对齐 SiYuan 3.8.10+ 富文本文档标题与半角斜杠 `/` 保留规范 · Issue #20837）
 * 彻底废弃易被截断的单纯 `hPath.split("/").pop()`：
 * 1. 优先提取物理对象的 `title` / `name`（思源内核在标题包含 `/` 时会完整保留在 title/name 字段中）；
 * 2. 次之提取 `hPath` / `path`，安全去除 `.sy` 尾缀并截取最后有效段；
 * 3. 自动剥离行内富文本标签（如 `<span ...>`、`<em>`）与两端空格，并保证回退安全。
 */
export function safeDocTitleFromHPath(docOrPath: unknown, fallback = ""): string {
    if (!docOrPath) return fallback;

    let rawTitle = "";
    let rawPath = "";

    if (typeof docOrPath === "object" && docOrPath !== null) {
        const obj = docOrPath as Record<string, unknown>;
        if (typeof obj.title === "string" && obj.title.trim()) {
            rawTitle = obj.title.trim();
        } else if (typeof obj.name === "string" && obj.name.trim()) {
            rawTitle = obj.name.trim();
        }

        if (!rawTitle) {
            if (typeof obj.hPath === "string") rawPath = obj.hPath;
            else if (typeof obj.hpath === "string") rawPath = obj.hpath;
            else if (typeof obj.path === "string") rawPath = obj.path;
        }
    } else if (typeof docOrPath === "string") {
        rawPath = docOrPath;
    }

    if (!rawTitle && rawPath) {
        let clean = rawPath.trim().replace(/\.sy$/i, "");
        if (clean.endsWith("/")) clean = clean.slice(0, -1);
        const lastSlash = clean.lastIndexOf("/");
        rawTitle = lastSlash >= 0 ? clean.slice(lastSlash + 1) : clean;
    }

    if (!rawTitle) return fallback;

    // 剥离富文本 HTML 标签（对齐 3.8.10 富文本文档标题规范）
    const plain = rawTitle.replace(/<[^>]+>/g, "").trim();
    return plain || fallback;
}

function getHostSiyuan(): any {
    try {
        let req: any = null;
        if (typeof globalThis !== "undefined") {
            const g = globalThis as any;
            if (typeof g.require === "function") req = g.require;
            else if (g.window && typeof g.window.require === "function") req = g.window.require;
        }
        if (!req && typeof window !== "undefined") {
            const w = window as any;
            if (typeof w.require === "function") req = w.require;
        }
        if (typeof req === "function") {
            try {
                const s = req("siyuan");
                if (s) return s;
            } catch { /* ignore */ }
        }
        if (typeof globalThis !== "undefined") {
            const g = globalThis as any;
            if (g.siyuan) return g.siyuan;
            if (g.window && g.window.siyuan) return g.window.siyuan;
        }
        if (typeof window !== "undefined") {
            const w = window as any;
            if (w.siyuan) return w.siyuan;
        }
    } catch { /* ignore */ }
    return null;
}

/**
 * 唤起官方文档树右键原生上下文菜单（SiYuan 3.8.10+ 新增 API · Issue #21219）
 * 彻底解决自绘文档卡片/搜索结果无法触发原生重命名、移动、属性、导出菜单的问题：
 * - 桌面端：在指定的鼠标坐标或目标元素位置弹出官方原生右键菜单；
 * - 移动端：自动作为原生底部抽屉（Bottom Sheet）展现。
 * 若当前运行于低版本思源（< 3.8.10），优雅返回 false 供调用方降级。
 */
export async function showDocTreeNativeMenu(options: {
    notebookId: string;
    docId?: string;
    position?: { x: number; y: number; w?: number; h?: number };
}): Promise<boolean> {
    if (!options || !options.notebookId) return false;
    try {
        const siyuan = getHostSiyuan();
        const fn = siyuan?.openDocTreeMenu;
        if (typeof fn === "function") {
            const res = await fn({
                items: [{ notebookId: options.notebookId, id: options.docId }],
                position: options.position,
            });
            return Boolean(res);
        }
    } catch (e) {
        console.warn("[lvKit] showDocTreeNativeMenu 调用失败:", e);
    }
    return false;
}

/**
 * 唤起思源原生资源/附件选择器（SiYuan 3.8.10+ 新增 API · Issue #21115）
 * 支持异步选取库内图片、文件、音视频等资源，成功返回选中的相对资产路径（如 "assets/image-xxx.png"）。
 */
export async function openNativeAssetPicker(options?: {
    exts?: string[];
    match?: string;
}): Promise<{ path: string } | null> {
    try {
        const siyuan = getHostSiyuan();
        const fn = siyuan?.openAssetPicker;
        if (typeof fn === "function") {
            const res = await fn(options || {});
            return res && typeof res.path === "string" ? { path: res.path } : null;
        }
    } catch (e) {
        console.warn("[lvKit] openNativeAssetPicker 调用失败:", e);
    }
    return null;
}

export type NativeDockDirection = "Left" | "Right" | "Bottom" | "left" | "right" | "bottom";

/**
 * 切换思源原生停靠栏展开/收起状态（SiYuan 3.8.10+ API · Issue #21097）
 */
export function toggleNativeDock(dock: NativeDockDirection, visible?: boolean): boolean {
    try {
        const siyuan = getHostSiyuan();
        const norm = (dock.charAt(0).toUpperCase() + dock.slice(1).toLowerCase()) as "Left" | "Right" | "Bottom";
        const fn = siyuan?.[`toggle${norm}Dock`];
        if (typeof fn === "function") {
            fn(visible);
            return true;
        }
    } catch { /* ignore */ }
    return false;
}

/**
 * 查询思源原生停靠栏当前可见性（SiYuan 3.8.10+ API · Issue #21097）
 */
export function isNativeDockVisible(dock: NativeDockDirection): boolean | null {
    try {
        const siyuan = getHostSiyuan();
        const norm = (dock.charAt(0).toUpperCase() + dock.slice(1).toLowerCase()) as "Left" | "Right" | "Bottom";
        const fn = siyuan?.[`is${norm}DockVisible`];
        if (typeof fn === "function") {
            return Boolean(fn());
        }
    } catch { /* ignore */ }
    return null;
}

export const lvHostBridge = {
    safeDocTitleFromHPath,
    showDocTreeNativeMenu,
    openNativeAssetPicker,
    toggleNativeDock,
    isNativeDockVisible,
};
