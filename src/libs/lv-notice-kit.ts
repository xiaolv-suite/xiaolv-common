
/* ========================================================================= */
/* 1. 通知套件类型定义与协议信封                                             */
/* ========================================================================= */

export type LvNoticeLevel = "info" | "success" | "warn" | "error";

export interface LvNoticeAction {
    label: string;
    primary?: boolean;
    onClick?: () => void | Promise<void>;
    dismissAfterClick?: boolean;
}

export interface LvNoticeSnoozeOption {
    label: string;
    durationMs?: number;
    muteToday?: boolean;
    muteDays?: number;
}

export interface CardNoticeOptions {
    source?: string;
    category?: string;
    title?: string;
    message: string;
    level?: LvNoticeLevel;
    duration?: number;
    actions?: LvNoticeAction[];
    snooze?: {
        options?: LvNoticeSnoozeOption[];
    };
    onDismiss?: () => void;
    firstRun?: boolean;
}

export interface CapsuleNoticeOptions {
    source?: string;
    category?: string;
    message: string;
    level?: LvNoticeLevel;
    duration?: number;
    archive?: boolean;
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
    dismiss: () => boolean | void | "keep";
}

/* ========================================================================= */
/* 3. 全局单例接口与自协商常量                                               */
/* ========================================================================= */

const PROTOCOL_VERSION = 200;
declare const __dirname: string | undefined;
const STORAGE_PREFIX = "lv_notice_mute_today_";
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
    lifeLogDocumentId?: string;
    lifeLogDocumentTitle?: string;
    diaryNotebookId?: string;
    quickNoteNotebookId?: string;
    quickNoteDocumentId?: string;
    quickNoteDocumentTitle?: string;
    quickNoteAttachMode?: "assets" | "local-link";
    diaryZoneDefaultFolded?: boolean;
    diaryZoneHeadingLevel?: 3 | 4;
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
    recentErrorCount?: number;
}

export interface LvAiConfig {
    endpoint: string;    // e.g. "https://api.deepseek.com/v1" or "https://dashscope.aliyuncs.com/compatible-mode/v1"
    apiKey?: string;
    hasSecret?: boolean;
    secretSlot?: string;
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
    snoozeCategory?: (category: string, durationMs: number) => void;
    isCategorySnoozed?: (category: string) => boolean;
    clearCategorySnooze?: (category: string) => void;
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
    movePluginOrder?: (id: string, direction: "up" | "down") => boolean;
    resetPluginOrder?: () => void;
    getPluginOrder?: () => string[];
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
    openQuickWorkspaceConfig?: (tab?: string) => void;
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

const LV_STYLE_SCOPE = ":is([data-lv-ui],#lv-notice-host,#lv-launchpad-sheet-mask,#lv-launchpad-mobile-ball,#lvLaunchpadDesktopEntry,#lvLaunchpadMobileEntry,#lv-shared-block-capsule,.lv-shared-ba-capsule,.lv-bam,.lv-bam-mobile-mask,.lv-toast,.b3-dialog.xlc-sovereign-dialog)";
const STYLES = `${LV_STYLE_SCOPE}{--lv-safe-surface: #ffffff;--lv-safe-surface-sub: #f8fafc;--lv-safe-text: #0f172a;--lv-safe-text-muted: #64748b;--lv-safe-border: rgba(0, 0, 0, .08)}:is([data-theme-mode=dark],[data-appearance=dark],body.body--dark,body.theme--dark,html.dark,body.dark) ${LV_STYLE_SCOPE},${LV_STYLE_SCOPE}[data-lv-theme=dark]{--lv-safe-surface: #1e222b;--lv-safe-surface-sub: #272c37;--lv-safe-text: #f1f5f9;--lv-safe-text-muted: #94a3b8;--lv-safe-border: rgba(255, 255, 255, .1)}#lv-notice-host,#lv-launchpad-sheet-mask,#lv-launchpad-mobile-ball,#lvLaunchpadMobileEntry{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;letter-spacing:normal;text-transform:none;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;&,*,*:before,*:after{box-sizing:border-box}button{font-family:inherit;text-transform:none;letter-spacing:normal}}#lvLaunchpadMobileEntry{position:relative}#lv-notice-host{position:fixed;right:max(20px,env(safe-area-inset-right,0px));bottom:max(38px,calc(var(--b3-toolbar-height,0px) + 12px + env(safe-area-inset-bottom,0px)));transition:bottom .16s ease,right .16s ease;z-index:999;pointer-events:none;font-family:var(--b3-font-family,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif);display:flex;flex-direction:column;align-items:flex-end;gap:8px;max-height:calc(100vh - 64px);max-height:calc(100dvh - 64px);overflow-y:auto;overscroll-behavior:contain;scrollbar-width:none}#lv-notice-host::-webkit-scrollbar{display:none}.lv-notice-more{pointer-events:auto;align-self:flex-end;border:1px solid rgba(15,23,42,.1);background:#f1f5f9;color:#475569;font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;cursor:pointer;font-family:inherit;-webkit-tap-highlight-color:transparent}:is([data-theme-mode=dark],[data-appearance=dark],body.body--dark,body.theme--dark,html.dark) .lv-notice-more{background:#ffffff14;border-color:#ffffff1f;color:#cbd5e1}.lv-notice-card{--lv-nt-bg:rgba(255,255,255,.97);--lv-nt-border:rgba(15,23,42,.085);--lv-nt-text:#0f172a;--lv-nt-text-sub:#475569;--lv-nt-pill-bg:#f1f5f9;--lv-nt-accent:var(--lv-brand,#2563eb);--lv-nt-on-accent:#ffffff;pointer-events:auto;width:min(380px,calc(100vw - 32px));width:min(380px,calc(100dvw - 32px));box-sizing:border-box;padding:13px 15px;border-radius:14px;background:var(--lv-nt-bg);border:1px solid var(--lv-nt-border);box-shadow:0 12px 32px -6px #0f172a24,0 4px 10px -2px #0f172a0f,inset 0 1px #ffffffe6;backdrop-filter:blur(14px) saturate(180%);-webkit-backdrop-filter:blur(14px) saturate(180%);color:var(--lv-nt-text);font-size:13px;line-height:1.45;transition:transform .3s cubic-bezier(.16,1,.3,1),opacity .25s ease;position:relative;overflow:hidden}:is([data-theme-mode=dark],[data-appearance=dark],body.body--dark,body.theme--dark,html.dark) .lv-notice-card{--lv-nt-bg:rgba(28,33,45,.96);--lv-nt-border:rgba(255,255,255,.1);--lv-nt-text:#f8fafc;--lv-nt-text-sub:#cbd5e1;--lv-nt-pill-bg:rgba(255,255,255,.08);box-shadow:0 14px 36px -6px #00000073,inset 0 1px #ffffff14}.lv-notice-card:before{content:"";position:absolute;top:0;left:0;bottom:0;width:3.5px;background:var(--lv-nt-accent);border-top-left-radius:14px;border-bottom-left-radius:14px}.lv-notice-card[data-level=error]:before{background:var(--b3-theme-error,#ef4444)}.lv-notice-card[data-level=warn]:before{background:#f59e0b}.lv-notice-card[data-level=success]:before{background:#10b981}.lv-notice-header{display:flex;align-items:center;gap:6px;margin-bottom:6px}.lv-notice-source-badge{font-size:10.5px;font-weight:600;padding:1.5px 7px;border-radius:6px;background:#2563eb1a;color:var(--lv-nt-accent);line-height:1.4;white-space:nowrap}.lv-notice-title{font-weight:650;font-size:13px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--lv-nt-text)}.lv-notice-repeat{font-size:10px;font-weight:700;font-variant-numeric:tabular-nums;padding:1px 5px;border-radius:10px;background:var(--lv-nt-accent);color:#fff}.lv-notice-close-btn{background:transparent;border:none;cursor:pointer;min-width:28px;min-height:28px;display:inline-flex;align-items:center;justify-content:center;padding:0;margin:-4px -4px 0 0;color:var(--lv-nt-text-sub);font-size:14px;line-height:1;border-radius:6px;touch-action:manipulation;transition:transform .15s ease,background .15s ease,color .15s ease}.lv-notice-close-btn:hover{background:var(--lv-nt-pill-bg);color:var(--lv-nt-text);transform:scale(1.08)}.lv-notice-close-btn:active{transform:scale(.92)}.lv-notice-body{font-size:12.5px;color:var(--lv-nt-text-sub);margin-bottom:8px;word-break:break-word;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;cursor:default}.lv-notice-body--expanded{-webkit-line-clamp:999;cursor:zoom-out}.lv-notice-actions{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:4px}.lv-notice-btn{border:1px solid var(--lv-nt-border);cursor:pointer;font-size:11.5px;font-weight:600;padding:4px 10px;border-radius:7px;background:var(--lv-nt-pill-bg);color:var(--lv-nt-text);transition:background .15s ease,transform .1s ease}.lv-notice-btn:hover{border-color:var(--lv-nt-accent);color:var(--lv-nt-accent)}.lv-notice-btn:active{transform:scale(.97)}.lv-notice-btn--primary{border-color:transparent;background:var(--lv-nt-accent);color:#fff!important}.lv-notice-btn--primary:hover{background:var(--lv-nt-accent)!important;color:#fff!important;filter:brightness(1.08)}.lv-notice-snooze-row{display:flex;flex-wrap:wrap;align-items:center;gap:5px;width:100%;margin-top:4px;padding-top:6px;border-top:1px dashed var(--lv-nt-border)}.lv-notice-btn--mute{font-size:11px;font-weight:500;padding:3px 8px;border-radius:6px;background:transparent;color:var(--lv-nt-text-sub);border:1px solid var(--lv-nt-border)}.lv-notice-btn--mute:hover{background:var(--lv-nt-pill-bg);color:var(--lv-nt-text);border-color:var(--lv-nt-accent)}.lv-notice-capsule{pointer-events:auto;display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:999px;background:#fffffff7;border:1px solid rgba(15,23,42,.09);box-shadow:0 8px 24px -4px #0f172a24,0 2px 6px #0f172a0d;backdrop-filter:blur(14px);font-size:12.5px;font-weight:500;color:#0f172a;animation:lvNoticeFadeIn .25s cubic-bezier(.16,1,.3,1)}:is([data-theme-mode=dark],[data-appearance=dark],body.body--dark,body.theme--dark,html.dark) .lv-notice-capsule{background:#1c212df5;border-color:#ffffff1a;color:#f8fafc;box-shadow:0 10px 28px -4px #00000073}.lv-notice-capsule-action{background:var(--lv-nt-accent,#3576c7);color:var(--lv-nt-on-accent,#ffffff);border:none;border-radius:999px;padding:2px 10px;font-size:11px;font-weight:500;cursor:pointer;margin-left:6px;line-height:1.4;transition:transform .15s cubic-bezier(.16,1,.3,1),opacity .15s ease;box-sizing:border-box;white-space:nowrap}.lv-notice-capsule-action:hover{filter:brightness(1.1);transform:scale(1.05)}.lv-notice-capsule-action:active{transform:scale(.95)}@keyframes lvInlinePop{0%{transform:scale(1)}40%{transform:scale(1.12)}to{transform:scale(1)}}.lv-inline-feedback-active{animation:lvInlinePop .3s ease-out!important}.lv-inline-feedback--success{color:#10b981!important}.lv-inline-feedback--error{color:#ef4444!important}:is(body.body--mobile,[data-is-mobile=true]) #lv-notice-host{right:0;left:0;top:calc(var(--mobile-topbar-height,48px) + env(safe-area-inset-top,0px) + 8px);bottom:auto;align-items:center;padding:0 max(12px,env(safe-area-inset-right,0px)) 0 max(12px,env(safe-area-inset-left,0px));max-height:calc(100dvh - 140px);overflow-y:auto;overscroll-behavior:contain}@media(max-width:640px){#lv-notice-host{right:0;left:0;top:calc(var(--mobile-topbar-height,48px) + env(safe-area-inset-top,0px) + 8px);bottom:auto;align-items:center;padding:0 max(12px,env(safe-area-inset-right,0px)) 0 max(12px,env(safe-area-inset-left,0px));max-height:calc(100dvh - 140px);overflow-y:auto;overscroll-behavior:contain}.lv-notice-card{width:100%;max-width:380px;box-shadow:0 6px 20px #00000029;touch-action:pan-y}.lv-notice-capsule{max-width:calc(100vw - 24px);max-width:calc(100dvw - 24px);touch-action:pan-y}.lv-notice-close-btn{min-width:38px!important;min-height:38px!important;padding:8px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}.lv-notice-btn{min-height:38px!important;padding:6px 14px!important;font-size:12px!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}.lv-notice-capsule-action{min-height:32px!important;padding:4px 12px!important;font-size:12px!important;touch-action:manipulation!important}}@keyframes lvNoticeFadeIn{0%{opacity:0;transform:translateY(8px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}#lv-launchpad-mobile-ball{position:fixed;z-index:970;width:46px;height:46px;border-radius:999px;display:grid;place-items:center;color:#0f172a;background:#ffffffeb;border:1px solid rgba(15,23,42,.1);box-shadow:0 6px 20px #0f172a29,inset 0 1px #fffc;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);-webkit-tap-highlight-color:transparent;touch-action:none;cursor:pointer;transition:left .22s cubic-bezier(.22,1,.36,1),transform .26s cubic-bezier(.22,1,.36,1),opacity .2s ease,box-shadow .2s ease}:is([data-theme-mode=dark],[data-appearance=dark],body.body--dark,body.theme--dark,html.dark) #lv-launchpad-mobile-ball{color:#f8fafc;background:#1e2431e6;border-color:#ffffff1f;box-shadow:0 6px 22px #00000073,inset 0 1px #ffffff14}#lv-launchpad-mobile-ball:active,#lv-launchpad-mobile-ball.lv-ball-pressing{transform:scale(.92);box-shadow:0 4px 16px #2563eb47,0 0 0 3px #2563eb29}#lv-launchpad-mobile-ball.lv-ball-edge-left.lv-ball-idle,#lv-launchpad-mobile-ball.lv-ball-edge-left.lv-ball-immersive{transform:translate(-40%) scale(.9);opacity:.55}#lv-launchpad-mobile-ball.lv-ball-edge-right.lv-ball-idle,#lv-launchpad-mobile-ball.lv-ball-edge-right.lv-ball-immersive{transform:translate(40%) scale(.9);opacity:.55}#lv-launchpad-mobile-ball.lv-ball-dragging{transition:none;transform:scale(1.1);opacity:.96;z-index:990}#lv-launchpad-mobile-ball.lv-ball-suppressed{display:none}@keyframes lvSpin{0%{transform:rotate(0)}to{transform:rotate(360deg)}}#lv-shared-block-capsule.lv-shared-ba-capsule{position:fixed;top:0;left:0;will-change:transform;z-index:99990;pointer-events:auto;display:inline-flex;align-items:center;gap:3px;padding:2px 6px;border-radius:var(--b3-border-radius,6px);background:var(--b3-menu-background,var(--b3-theme-surface,#fff));color:var(--b3-theme-on-surface,var(--b3-theme-on-background,#222));border:1px solid var(--b3-border-color,rgba(128,128,128,.22));box-shadow:var(--b3-dialog-shadow,0 4px 14px rgba(0,0,0,.12));font-family:var(--b3-font-family,inherit);font-size:11.5px;line-height:1.2;user-select:none}#lv-shared-block-capsule .lv-shared-ba-capsule__trigger,#lv-shared-block-capsule .lv-shared-ba-capsule__quick-btn{border:none;background:transparent;color:inherit;cursor:pointer;padding:2px 5px;border-radius:var(--b3-border-radius,6px);display:inline-flex;align-items:center;gap:4px;font-size:11.5px;font-weight:500;line-height:1.2;font-family:var(--b3-font-family,inherit)}#lv-shared-block-capsule .lv-shared-ba-capsule__trigger:hover,#lv-shared-block-capsule .lv-shared-ba-capsule__quick-btn:hover{background:var(--b3-list-hover,rgba(128,128,128,.1))}#lv-shared-block-capsule .lv-shared-ba-capsule__dot.dot-card{width:6px;height:6px;border-radius:50%;background:var(--b3-theme-primary,#3575f0);display:inline-block;flex-shrink:0}#lv-shared-block-capsule.lv-shared-ba-capsule[data-readonly=true] .lv-shared-ba-capsule__trigger{color:var(--b3-card-warning-color,#d97706)}@media(max-width:640px),(pointer:coarse){.lv-bam{max-width:calc(100vw - 24px)!important;max-height:70dvh!important}.lv-bam .lv-bam-item,.lv-bam .lv-bam-store-btn{min-height:44px!important;padding:8px 12px!important;font-size:13px!important}#lv-shared-block-capsule.lv-shared-ba-capsule{padding:3px 6px;gap:4px}#lv-shared-block-capsule .lv-shared-ba-capsule__trigger,#lv-shared-block-capsule .lv-shared-ba-capsule__quick-btn{min-height:44px;min-width:44px;justify-content:center;padding:6px 10px;font-size:12.5px}}@media print{#lvLaunchpadDesktopEntry,#lvLaunchpadMobileEntry,#lv-desktop-launchpad-popover,#lv-launchpad-sheet-mask,#lv-launchpad-mobile-ball,#lv-notice-host,#lv-quick-workspace-mask,#lv-block-assistant-portal,#lv-shared-block-capsule,#lv-block-ai-result-card,#lv-block-type-picker-root,#lv-block-action-store-mask,#lv-ai-tier4-confirm-mask,#lv-ai-wait-overlay-mask,.lv-ai-wait-mask,.lv-bam,.lv-bam-mobile-mask,.lv-card-badge-pill,.lv-shared-ba-capsule,.lv-toast,.lv-floating-note,.lv-qw-mask,.lv-desktop-launchpad-popover{display:none!important;visibility:hidden!important}}`;

const STYLES_VERSION = "4.1";

function ensureStyles(): void {
    if (typeof document === "undefined" || !document.head || typeof document.createElement !== "function") return;
    const styleId = "lv-notice-styles";
    const existing = typeof document.getElementById === "function" ? document.getElementById(styleId) : null;
    if (existing) {
        if (existing.getAttribute?.("data-lv-ver") === STYLES_VERSION) return;
        existing.textContent = STYLES;
        existing.setAttribute?.("data-lv-ver", STYLES_VERSION);
        return;
    }
    const styleEl = document.createElement("style");
    styleEl.id = styleId;
    styleEl.setAttribute?.("data-lv-ver", STYLES_VERSION);
    styleEl.textContent = STYLES;
    document.head.appendChild(styleEl);
}

export const LV_ECOSYSTEM_TOGGLES_KEY = "lv_ecosystem_toggles_v1";
const LV_ECOSYSTEM_PLUGIN_IDS = ["siyuan-checkin","siyuan-home","siyuan-contacts","siyuan-glean","siyuan-lv-cards","siyuan-exam","xiaolv-common","siyuan-speed-switch"] as const;

export interface LvEcosystemToggles {
    blockAssistant: boolean; blockAssistantAltBOnly: boolean; launchpad: boolean; noticeCenter: boolean;
    externalModalHarmonizer: boolean; nativeMessageBridge: boolean; aiSiyuanOnly: boolean;
    aiSharedKeyAllowedPlugins: Record<string, boolean>; activityLog: boolean; autoSnapshotVault: boolean;
}

const SOURCE_ALIAS_MAP: Record<string, string> = {
    "siyuan-checkin":"siyuan-checkin","checkin":"siyuan-checkin","打卡":"siyuan-checkin","小驴打卡":"siyuan-checkin",
    "siyuan-home":"siyuan-home","home":"siyuan-home","管家":"siyuan-home","小驴管家":"siyuan-home",
    "siyuan-contacts":"siyuan-contacts","contacts":"siyuan-contacts","人脉":"siyuan-contacts","小驴人脉":"siyuan-contacts",
    "siyuan-glean":"siyuan-glean","glean":"siyuan-glean","拾遗":"siyuan-glean","小驴拾遗":"siyuan-glean",
    "siyuan-lv-cards":"siyuan-lv-cards","lv-cards":"siyuan-lv-cards","cards":"siyuan-lv-cards","闪卡":"siyuan-lv-cards","小驴闪卡":"siyuan-lv-cards",
    "siyuan-exam":"siyuan-exam","exam":"siyuan-exam","考试":"siyuan-exam","小驴考试":"siyuan-exam",
    "xiaolv-common":"xiaolv-common","common":"xiaolv-common","常用":"xiaolv-common","小驴常用":"xiaolv-common",
    "siyuan-speed-switch":"siyuan-speed-switch","speed-switch":"siyuan-speed-switch","raikiri":"siyuan-speed-switch","leiqie":"siyuan-speed-switch","雷切":"siyuan-speed-switch","小驴雷切":"siyuan-speed-switch",
};

export class LvAiPolicyBlockedError extends Error {
    readonly code: "ai_siyuan_only" | "ai_shared_key_denied" | "ai_origin_mismatch";
    readonly pluginId: string;
    readonly channel: string;
    constructor(code: "ai_siyuan_only" | "ai_shared_key_denied" | "ai_origin_mismatch", pluginId = "", channel = "", message?: string) {
        super(message || `AI policy blocked: ${code}`);
        this.name = "LvAiPolicyBlockedError"; this.code = code; this.pluginId = pluginId; this.channel = channel;
    }
}

function getCoreAiGateDelegate(): any {
    const w = typeof window !== "undefined" ? (window as any) : null;
    const g = typeof globalThis !== "undefined" ? (globalThis as any) : null;
    const ex = w?.__LV_AI_GATE__ || g?.__LV_AI_GATE__;
    if (ex?.assertLvAiChannelAllowed && !ex.__isShellBridge) return ex;
    return null;
}

if (typeof window !== "undefined") {
    const wAny = window as any;
    if (!wAny.__LV_AI_GATE__) {
        wAny.__LV_AI_GATE__ = {
            __isShellBridge: true,
            normalizeLvPluginId: (s?: string | null) => normalizeLvPluginId(s),
            resolveLvAiDestinationLabel: (ctx: any) => resolveLvAiDestinationLabel(ctx),
            getLvEcosystemToggles: () => getLvEcosystemToggles(),
            setLvEcosystemToggles: (p: any) => setLvEcosystemToggles(p),
            isLvPluginSharedKeyAllowed: (s?: string | null) => isLvPluginSharedKeyAllowed(s),
            assertLvAiChannelAllowed: (ctx: any) => assertLvAiChannelAllowed(ctx),
            LvAiPolicyBlockedError,
        };
    }
}

export function normalizeLvPluginId(source?: string | null): string {
    const d = getCoreAiGateDelegate();
    if (d?.normalizeLvPluginId) return d.normalizeLvPluginId(source);
    const raw = String(source || "").trim().toLowerCase();
    if (!raw) return "";
    if (SOURCE_ALIAS_MAP[raw]) return SOURCE_ALIAS_MAP[raw]!;
    for (const [k, v] of Object.entries(SOURCE_ALIAS_MAP)) if (raw.includes(k)) return v;
    return raw;
}

export function resolveLvAiDestinationLabel(ctx: { channel?: string; endpoint?: string; url?: string }) {
    const d = getCoreAiGateDelegate();
    if (d?.resolveLvAiDestinationLabel) return d.resolveLvAiDestinationLabel(ctx);
    const ch = String(ctx?.channel || "").trim().toLowerCase();
    const rawUrl = String(ctx?.url || ctx?.endpoint || "").trim();
    let origin = "", hostname = "", pathname = "";
    if (rawUrl.startsWith("/") && !rawUrl.startsWith("//")) pathname = rawUrl;
    else if (rawUrl) { try { const u = new URL(rawUrl); origin = u.origin; hostname = u.hostname; pathname = u.pathname; } catch {} }
    if (ch === "rule_fallback") return { kind: "rule_fallback", label: "本地离线规则", hostname: "local", origin: "" };
    if (((ch === "siyuan" || ch === "siyuan_editor" || ch === "siyuan_legacy") && (!rawUrl || (!origin && pathname.startsWith("/api/ai/")))) || (!ch && !origin && pathname.startsWith("/api/ai/"))) {
        return { kind: "siyuan", label: "思源内置 AI", hostname: "siyuan-kernel", origin: "" };
    }
    if (ch === "public_free") return { kind: "public_free", label: "免密公用池", hostname: hostname || "text.pollinations.ai", origin: origin || "https://text.pollinations.ai" };
    if (ch === "ollama") return { kind: "ollama", label: "本地 Ollama", hostname: hostname || "127.0.0.1", origin: origin || "http://127.0.0.1:11434" };
    return { kind: "user_custom", label: hostname ? `用户自配 ${hostname}` : "用户自配外部接口", hostname, origin };
}

let cachedEcosystemToggles: LvEcosystemToggles | null = null;

export function getLvEcosystemToggles(): LvEcosystemToggles {
    const d = getCoreAiGateDelegate();
    if (d?.getLvEcosystemToggles) return d.getLvEcosystemToggles();
    if (cachedEcosystemToggles) return cachedEcosystemToggles;
    const ls = getSafeLocalStorage();
    const allowed: Record<string, boolean> = {};
    for (const id of LV_ECOSYSTEM_PLUGIN_IDS) allowed[id] = true;
    const def: LvEcosystemToggles = { blockAssistant: false, blockAssistantAltBOnly: false, launchpad: true, noticeCenter: true, externalModalHarmonizer: true, nativeMessageBridge: true, aiSiyuanOnly: false, aiSharedKeyAllowedPlugins: allowed, activityLog: true, autoSnapshotVault: true };
    if (!ls) return def;
    try {
        const parsedRaw = ls.getItem(LV_ECOSYSTEM_TOGGLES_KEY);
        const p = parsedRaw ? JSON.parse(parsedRaw) : null;
        const ba = ls.getItem("lv_block_assistant_enabled_v1");
        if (p?.aiSharedKeyAllowedPlugins) for (const [k, v] of Object.entries(p.aiSharedKeyAllowedPlugins)) if (typeof v === "boolean") allowed[normalizeLvPluginId(k) || k] = v;
        cachedEcosystemToggles = { blockAssistant: ba === "true" ? true : ba === "false" ? false : p?.blockAssistant === true, blockAssistantAltBOnly: p?.blockAssistantAltBOnly === true, launchpad: p?.launchpad !== false, noticeCenter: p?.noticeCenter !== false, externalModalHarmonizer: p?.externalModalHarmonizer !== false, nativeMessageBridge: p?.nativeMessageBridge !== false, aiSiyuanOnly: p?.aiSiyuanOnly === true, aiSharedKeyAllowedPlugins: allowed, activityLog: p?.activityLog !== false, autoSnapshotVault: p?.autoSnapshotVault !== false };
        return cachedEcosystemToggles;
    } catch { return def; }
}

export function setLvEcosystemToggles(patch: Partial<LvEcosystemToggles>): LvEcosystemToggles {
    const d = getCoreAiGateDelegate();
    let next: LvEcosystemToggles;
    if (d?.setLvEcosystemToggles) next = d.setLvEcosystemToggles(patch);
    else {
        const cur = getLvEcosystemToggles();
        const nextAllowed = { ...cur.aiSharedKeyAllowedPlugins };
        if (patch.aiSharedKeyAllowedPlugins) for (const [k, v] of Object.entries(patch.aiSharedKeyAllowedPlugins)) if (typeof v === "boolean") nextAllowed[normalizeLvPluginId(k) || k] = v;
        next = { ...cur, ...patch, aiSharedKeyAllowedPlugins: nextAllowed };
        cachedEcosystemToggles = next;
        const ls = getSafeLocalStorage();
        try { ls?.setItem(LV_ECOSYSTEM_TOGGLES_KEY, JSON.stringify(next)); if (typeof patch.blockAssistant === "boolean") ls?.setItem("lv_block_assistant_enabled_v1", patch.blockAssistant ? "true" : "false"); } catch {}
        try { if (typeof window !== "undefined") window.dispatchEvent?.(new CustomEvent("lv-ecosystem-toggles-changed", { detail: next })); } catch {}
    }
    applyEcosystemToggleSideEffects(next);
    return next;
}

function isLvPluginSharedKeyAllowed(source?: string | null): boolean {
    const t = getLvEcosystemToggles(); const pid = normalizeLvPluginId(source);
    return !pid || !Object.prototype.hasOwnProperty.call(t.aiSharedKeyAllowedPlugins, pid) || t.aiSharedKeyAllowedPlugins[pid] !== false;
}

export function assertLvAiChannelAllowed(ctx: { source?: string; pluginId?: string; channel?: string; endpoint?: string; url?: string; usesSharedKey?: boolean; expectedOrigin?: string }) {
    const d = getCoreAiGateDelegate();
    if (d?.assertLvAiChannelAllowed) return d.assertLvAiChannelAllowed(ctx);
    const pluginId = normalizeLvPluginId(ctx?.pluginId || ctx?.source);
    const t = getLvEcosystemToggles();
    const dest = resolveLvAiDestinationLabel(ctx || {});
    if (t.aiSiyuanOnly === true && dest.kind !== "siyuan" && dest.kind !== "rule_fallback") throw new LvAiPolicyBlockedError("ai_siyuan_only", pluginId, dest.kind);
    if (ctx?.usesSharedKey === true && !isLvPluginSharedKeyAllowed(pluginId)) throw new LvAiPolicyBlockedError("ai_shared_key_denied", pluginId, dest.kind);
    const exp = String(ctx?.expectedOrigin || "").trim();
    if (exp && dest.kind !== "siyuan" && dest.kind !== "rule_fallback" && (!dest.origin || dest.origin !== exp)) throw new LvAiPolicyBlockedError("ai_origin_mismatch", pluginId, dest.kind);
    return { ...dest, pluginId };
}

function applyEcosystemToggleSideEffects(toggles: LvEcosystemToggles): void {
    try {
        if (!toggles.launchpad && typeof document !== "undefined") {
            closeDesktopLaunchpadPopover(true); closeMobileSheet(true);
            for (const id of [DESKTOP_ENTRY_ID, MOBILE_ENTRY_ID, MOBILE_BALL_ID]) { try { document.getElementById(id)?.remove(); } catch {} }
        } else if (toggles.launchpad && typeof document !== "undefined") {
            if (getSharedDesktopEntryOwners().size > 0) { buildDesktopEntryButton(true); scheduleTopBarConvergence(40); }
            if (getSharedMobileEntryOwners().size > 0) scheduleMobileEntryDom(20);
        }
        if (toggles.blockAssistant === false || toggles.blockAssistantAltBOnly === true) { try { getBlockAssistantHub().dispose(); } catch {} }
        if (toggles.autoSnapshotVault === false) { try { lvSnapshotVault.cancelScheduledBackups(); } catch {} }
    } catch {}
}

if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    const wAny = window as any;
    if (!wAny.__LV_TOGGLE_LISTENER_WIRED__) {
        wAny.__LV_TOGGLE_LISTENER_WIRED__ = true;
        window.addEventListener("lv-ecosystem-toggles-changed", (ev: Event) => { const d = (ev as CustomEvent<LvEcosystemToggles>)?.detail; if (d) { cachedEcosystemToggles = d; applyEcosystemToggleSideEffects(d); } });
        window.addEventListener("storage", (ev: Event) => {
            const k = (ev as StorageEvent)?.key;
            if (!k || k === LV_ECOSYSTEM_TOGGLES_KEY || k === "lv_block_assistant_enabled_v1") cachedEcosystemToggles = null;
        });
    }
}

export function bindVisualViewportInset(el: HTMLElement | null | undefined, options?: { keyboardThreshold?: number; maxHeightProp?: string; onUpdate?: (s: { keyboardOpen: boolean; viewportHeight: number; offsetTop: number }) => void }): () => void {
    if (!el || typeof window === "undefined") return () => {};
    const threshold = options?.keyboardThreshold ?? 110;
    const sync = () => {
        const vv = (window as any).visualViewport; const winH = window.innerHeight || 800; const vvH = vv?.height ?? winH; const vvTop = vv?.offsetTop ?? 0; const keyboardOpen = winH - vvH > threshold;
        try {
            el.style.setProperty("--lv-vv-h", `${Math.round(vvH)}px`);
            if (options?.maxHeightProp) el.style.setProperty(options.maxHeightProp, `${Math.max(180, Math.round(vvH - 24))}px`);
            if (keyboardOpen) el.setAttribute?.("data-keyboard-open", "true"); else el.removeAttribute?.("data-keyboard-open");
        } catch {}
        options?.onUpdate?.({ keyboardOpen, viewportHeight: vvH, offsetTop: vvTop });
    };
    sync();
    const vv = (window as any).visualViewport;
    vv?.addEventListener?.("resize", sync); vv?.addEventListener?.("scroll", sync); window.addEventListener?.("resize", sync);
    return () => { vv?.removeEventListener?.("resize", sync); vv?.removeEventListener?.("scroll", sync); window.removeEventListener?.("resize", sync); };
}

function injectChunkStyles(chunkId: string, cssText: string): void {
    if (!cssText || typeof document === "undefined" || !document.head) return;
    ensureStyles();
    const styleEl = document.getElementById?.("lv-notice-styles");
    if (!styleEl) return;
    const loadedSet = new Set((styleEl.getAttribute?.("data-lv-chunks") || "").split(",").filter(Boolean));
    if (loadedSet.has(chunkId)) return;
    loadedSet.add(chunkId);
    styleEl.setAttribute?.("data-lv-chunks", Array.from(loadedSet).join(","));
    styleEl.textContent = `${styleEl.textContent || ""}\n${cssText}`;
}

export function resolveLvAssetBase(preferredPluginId?: string): string {
    try {
        const loc = (typeof window !== "undefined" && window.location) ? window.location : (typeof location !== "undefined" ? location : undefined);
        const proto = String(loc?.protocol || "").toLowerCase();
        if (proto !== "http:" && proto !== "https:") return "./";
        const pathname = String(loc?.pathname || "");
        const stageIdx = pathname.indexOf("/stage/");
        const basePrefix = stageIdx >= 0 ? pathname.slice(0, stageIdx) : "";
        let pid = String(preferredPluginId || "").trim();
        if (!pid) { try { pid = String(getSharedLaunchpadRegistry().keys().next().value || ""); } catch {} }
        if (!pid) {
            const plugins = (window as any)?.siyuan?.ws?.app?.plugins || (window as any)?.app?.plugins || [];
            const found = Array.isArray(plugins) ? plugins.find((p: any) => p?.name && /xiaolv|siyuan-(checkin|home|contacts|glean|lv-cards|exam|speed-switch)/i.test(p.name)) : null;
            if (found?.name) pid = found.name;
        }
        return pid ? `${basePrefix}/plugins/${encodeURIComponent(pid)}/` : "./";
    } catch { return "./"; }
}

const fallbackChunkInstanceCache = new Map<string, any>();

function getChunkInstanceMap(): Map<string, any> {
    if (typeof window !== "object") return fallbackChunkInstanceCache;
    const w = window as any, cur = w.__LV_KIT_CHUNK_INSTANCES__;
    if (cur && typeof cur.get === "function" && typeof cur.set === "function") return cur;
    const map = new Map<string, any>();
    if (cur && typeof cur === "object") for (const [k, v] of Object.entries(cur)) if (v) map.set(k, v);
    return (w.__LV_KIT_CHUNK_INSTANCES__ = map);
}

function buildChunkHostBridge(): any {
    const w = typeof window !== "undefined" ? window : ({} as any);
    const d = typeof document !== "undefined" ? document : undefined;
    const setT = typeof window !== "undefined" && typeof window.setTimeout === "function" ? window.setTimeout.bind(window) : (typeof setTimeout === "function" ? setTimeout : w.setTimeout);
    const clrT = typeof window !== "undefined" && typeof window.clearTimeout === "function" ? window.clearTimeout.bind(window) : (typeof clearTimeout === "function" ? clearTimeout : w.clearTimeout);
    const setI = typeof window !== "undefined" && typeof window.setInterval === "function" ? window.setInterval.bind(window) : (typeof setInterval === "function" ? setInterval : w.setInterval);
    const clrI = typeof window !== "undefined" && typeof window.clearInterval === "function" ? window.clearInterval.bind(window) : (typeof clearInterval === "function" ? clearInterval : w.clearInterval);
    return {
        window: w, document: d, localStorage: getSafeLocalStorage(),
        Date: typeof Date === "function" ? Date : w.Date,
        location: typeof location !== "undefined" ? location : w.location,
        navigator: typeof navigator !== "undefined" ? navigator : w.navigator,
        fetch: typeof fetch === "function" ? fetch.bind(globalThis) : w.fetch,
        setTimeout: setT, clearTimeout: clrT, setInterval: setI, clearInterval: clrI,
        requestAnimationFrame: typeof requestAnimationFrame === "function" ? requestAnimationFrame : w.requestAnimationFrame,
        cancelAnimationFrame: typeof cancelAnimationFrame === "function" ? cancelAnimationFrame : w.cancelAnimationFrame,
        CustomEvent: typeof CustomEvent === "function" ? CustomEvent : w.CustomEvent,
        Event: typeof Event === "function" ? Event : w.Event,
        AbortController: typeof AbortController === "function" ? AbortController : w.AbortController,
        MutationObserver: typeof MutationObserver === "function" ? MutationObserver : w.MutationObserver,
        PROTOCOL_VERSION, ensureStyles, injectChunkStyles, safeRequire, resolveLvAssetBase,
        getLvEcosystemToggles, setLvEcosystemToggles, normalizeLvPluginId, isLvPluginSharedKeyAllowed, resolveLvAiDestinationLabel, assertLvAiChannelAllowed,
        getTodayKey, getSafeLocalStorage, escapeHtml, lvSurfaceStack, withDocLock, getNotifyFocusUntil, isNotifyFocusActive, setNotifyFocusUntil, clearNotifyFocus,
        lvNotify, persistSecretToSiyuanSlot, getAiHub, getActivityHub, lvActivity, lvBackup, LV_FEEDBACK_QQ_GROUP, LV_FEEDBACK_EMAIL, openJoinQqGroup, lvEcosystem,
        getReconciliationWhitelist, saveReconciliationWhitelist, addReconciliationWhitelist, removeReconciliationWhitelist, isReconciliationWhitelisted,
        formatSyTimestamp, formatBlockType, isBenignHomonymTitle,
        getLvAiJudge: () => getInitializedChunkSync("lv-kit-ai-hub")?.lvAiJudge ?? lvAiJudge,
        getAiHubUi: () => getInitializedChunkSync("lv-kit-ai-hub"),
        loadAiHubUi: () => loadLvKitChunk("lv-kit-ai-hub"),
        mountLvAiThinkingCard, getLvAiPresetStages,
        getLaunchpadStates, restoreAllHiddenPlugins, getLaunchpadHub, getSharedLaunchpadRegistry,
        MOBILE_ENTRY_ID, DESKTOP_ENTRY_ID, MOBILE_SHEET_ID, isMobileFrontend, hapticFeedback, getMobileEntryMode, setMobileEntryMode, refreshEntryBadgeDot,
        getLastMobileTopbarTap: () => lastMobileTopbarTap,
        setLastMobileTopbarTap: (val: { ts: number; x: number; y: number }) => { lastMobileTopbarTap = val; },
        getLaunchpadRuntimeBag, syncTopBarConvergence, DESKTOP_POPOVER_ID, resetPopoverPressGuard, lvPopoverSafeSwap,
        getLaunchpadViewMode, setLaunchpadViewMode, getLaunchpadActionLimit, setLaunchpadActionLimit,
        isDesktopPopoverOpen, closeDesktopLaunchpadPopover, recomputeBallSuppression, wireMobileSuppression, armSheetHistory, closeMobileSheet,
        getSearchHistory, pushSearchHistory, getRecentTileIds, pushRecentTileId, resolveIconHref, dismissActiveMobilePluginDialogs,
        showMessage, DEFAULT_LIFELOG_CATEGORIES, getQuickWorkspaceConfig, saveQuickWorkspaceConfig, lvKernelPost, createSafeAbortController,
        getCategoryEmoji, getCurrentOpenDocInfo, listOpenNotebooks, resolveDailyNotebookId, openDocumentById, openBlockById,
        getDailyNoteBucket, invalidateTodayDailyNoteCache, getXiaolvDiaryZoneConfig, setXiaolvDiaryZoneConfig, escapeKitIalValue, buildXiaolvLifeLogAttrs,
        escapeSql, parseKitIalMap, parseXiaolvLifeLogBlock, formatXiaolvLifeLogText, formatXiaolvLifeLogMarkdown,
        lvOmnisearch, lvAutomation, customConfigSections, showDocTreeNativeMenu, sanitizeFileNameSegment, lvBlockAssistant,
        getDoubleClickActionId, setDoubleClickActionId, getTodaySummary, syncEntryOpenState, openQuickWorkspaceConfig,
        readBlockAssistantEnabled,
        setBlockAssistantEnabledInternal: (next: boolean, opts?: { keepStoreDialog?: boolean }) => { getBlockAssistantHub(); (window as any)?.__LV_BA_SET_ENABLED__?.(next, opts); },
        readCustomActionsFromStorage, writeCustomActionsToStorage, DEFAULT_DOUBLE_CLICK_ACTION_ID, DOUBLE_CLICK_ACTION_DISABLED, DEFAULT_PINNED_ACTION_IDS, DEFAULT_ENABLED_ACTION_IDS,
        normalizeDoubleClickActionId, readStoreConfigFromStorage, writeStoreConfigToStorage, sharedBlockActions, blockAssistantOwners, customRegisteredActionIds,
        ensureNoticeKitAiHubMounted, getCleanBlockText, isInsidePluginReviewOrPreviewSubtree, isExcludedBlockAssistElement,
        cancelPendingCapsuleSchedule: () => { (window as any)?.__LV_BA_CANCEL_SCHEDULE__?.(); },
        unmountSharedCapsule: (destroy?: boolean) => { (window as any)?.__LV_BA_UNMOUNT__?.(destroy); },
        isReadOnlySafeBlockAction, isActionAllowedForSnapshot, buildBlockSnapshot, queryBlockElementById, queryActiveProtyle, extractCoreMarkdown, getBlockAssistantHub,
        removeDetachedBodyPortalById, removeDetachedBodyPortalsBySelector, lvSafeCopyToClipboard, isBlockOrProtyleReadOnly,
        lvConfirm: (title: string, msg: string) => {
            const c = getInitializedChunkSync("lv-kit-compass");
            if (c?.lvConfirm) return c.lvConfirm(title, msg);
            return loadLvKitChunk("lv-kit-compass").then((ch) => ch.lvConfirm(title, msg));
        },
        lvPrompt: (title: string, ph?: string, defVal?: string) => {
            const c = getInitializedChunkSync("lv-kit-compass");
            if (c?.lvPrompt) return c.lvPrompt(title, ph, defVal);
            return loadLvKitChunk("lv-kit-compass").then((ch) => ch.lvPrompt(title, ph, defVal));
        },
        openVaultRestoreWizard: async () => { await lvSnapshotVault.openRestoreWizardDialog(); },
    };
}

function initializeChunkEntry(chunkName: string, entry: any): any {
    if (!entry) return null;
    const instMap = getChunkInstanceMap();
    const existing = instMap.get(chunkName);
    const entryProto = typeof entry.protocol === "number" ? entry.protocol : 0;
    const existingProto = typeof existing?.version === "number" ? existing.version : (typeof existing?.protocol === "number" ? existing.protocol : 0);
    if (existing && (entryProto <= 0 || existingProto >= entryProto)) return existing;
    const instance = typeof entry.init === "function" ? entry.init(buildChunkHostBridge()) : entry;
    instMap.set(chunkName, instance);
    return instance;
}

function getInitializedChunkSync<T = any>(chunkName: string): T | null {
    const instMap = getChunkInstanceMap();
    const isValidEntry = (e: any): boolean => Boolean(e && (typeof e.init === "function" || (typeof e.protocol === "number" && e.protocol >= 200)));
    const readGlobalChunkReg = (): any => {
        const wReg = typeof window !== "undefined" ? (window as any).__LV_KIT_CHUNKS__?.[chunkName] : undefined;
        if (isValidEntry(wReg)) return wReg;
        const gReg = typeof globalThis !== "undefined" ? (globalThis as any).__LV_KIT_CHUNKS__?.[chunkName] : undefined;
        return isValidEntry(gReg) ? gReg : null;
    };
    if (instMap.has(chunkName)) {
        const existingInst = instMap.get(chunkName);
        const reg = readGlobalChunkReg();
        const regProto = typeof reg?.protocol === "number" ? reg.protocol : 0;
        const curProto = typeof existingInst?.version === "number" ? existingInst.version : (typeof existingInst?.protocol === "number" ? existingInst.protocol : 0);
        if (!reg || regProto <= curProto) return existingInst as T;
        return initializeChunkEntry(chunkName, reg) as T;
    }
    const preReg = readGlobalChunkReg();
    if (preReg) return initializeChunkEntry(chunkName, preReg) as T;
    const loc = (typeof window !== "undefined" && window.location) ? window.location : (typeof location !== "undefined" ? location : undefined);
    const proto = String(loc?.protocol || "").toLowerCase();
    if (proto !== "http:" && proto !== "https:") {
        const candidates = [
            `./dist-chunks/${chunkName}.js`, `../dist-chunks/${chunkName}.js`, `../../dist-chunks/${chunkName}.js`,
            `./public/${chunkName}.js`, `../public/${chunkName}.js`, `../../public/${chunkName}.js`,
            `./${chunkName}.js`,
        ];
        const p = safeRequire<any>("path");
        const dir = typeof __dirname !== "undefined" ? __dirname : "";
        const gProc = typeof globalThis !== "undefined" ? (globalThis as any).process : undefined;
        const cwd = gProc && typeof gProc.cwd === "function" ? gProc.cwd() : "";
        try {
            if (p && dir) {
                candidates.unshift(
                    p.join(dir, "dist-chunks", `${chunkName}.js`),
                    p.join(dir, "..", "dist-chunks", `${chunkName}.js`),
                    p.join(dir, "public", `${chunkName}.js`),
                    p.join(dir, "..", "public", `${chunkName}.js`),
                    p.join(dir, "..", "..", "public", `${chunkName}.js`)
                );
            }
            if (p && cwd) {
                candidates.push(p.join(cwd, "dist-chunks", `${chunkName}.js`), p.join(cwd, "public", `${chunkName}.js`));
            }
        } catch {}
        for (const c of candidates) {
            const mod = safeRequire<any>(c);
            if (isValidEntry(mod)) return initializeChunkEntry(chunkName, mod) as T;
            const regAfterRequire = readGlobalChunkReg();
            if (regAfterRequire) return initializeChunkEntry(chunkName, regAfterRequire) as T;
        }
        try {
            const fsMod = safeRequire<any>("fs");
            const vmMod = safeRequire<any>("vm");
            if (fsMod && typeof fsMod.existsSync === "function" && typeof fsMod.readFileSync === "function" && vmMod && typeof vmMod.compileFunction === "function") {
                for (const c of candidates) {
                    const resolved = p && typeof p.isAbsolute === "function" && !p.isAbsolute(c)
                        ? (dir ? p.resolve(dir, c) : (cwd ? p.resolve(cwd, c) : p.resolve(c)))
                        : c;
                    if (!fsMod.existsSync(resolved)) continue;
                    const code = fsMod.readFileSync(resolved, "utf8");
                    const modObj: any = { exports: {} };
                    const compiled = vmMod.compileFunction(code, ["exports", "module"]);
                    compiled(modObj.exports, modObj);
                    const loaded = isValidEntry(modObj.exports) ? modObj.exports : readGlobalChunkReg();
                    if (isValidEntry(loaded)) return initializeChunkEntry(chunkName, loaded) as T;
                }
            }
        } catch {}
    }
    return null;
}

export async function loadLvKitChunk<T = any>(chunkName: string, preferredPluginId?: string): Promise<T> {
    const existing = getInitializedChunkSync<T>(chunkName);
    if (existing) return existing;
    if (typeof window === "undefined" || typeof document === "undefined" || typeof document.createElement !== "function") throw new Error(`[LvKitChunk] Unable to load chunk "${chunkName}"`);
    const w = window as any;
    if (!w.__LV_KIT_CHUNKS__) w.__LV_KIT_CHUNKS__ = {};
    if (!w.__LV_KIT_CHUNK_PROMISES__) w.__LV_KIT_CHUNK_PROMISES__ = {};
    if (w.__LV_KIT_CHUNK_PROMISES__[chunkName]) return initializeChunkEntry(chunkName, await w.__LV_KIT_CHUNK_PROMISES__[chunkName]) as T;
    const candidates: string[] = [];
    if (preferredPluginId) candidates.push(preferredPluginId);
    try { for (const id of getSharedLaunchpadRegistry().keys()) if (!candidates.includes(id)) candidates.push(id); } catch {}
    if (candidates.length === 0) candidates.push("");
    const loadViaScript = (srcUrl: string) => new Promise<any>((resolve, reject) => {
        const sid = `lv-kit-chunk-${chunkName}`;
        try { document.getElementById(sid)?.remove(); } catch {}
        const s = document.createElement("script"); s.id = sid; s.src = srcUrl; s.async = false;
        s.onload = () => { const e = w.__LV_KIT_CHUNKS__?.[chunkName]; if (e) resolve(e); else reject(new Error(`Chunk ${chunkName} missing registration`)); };
        s.onerror = () => { try { s.remove(); } catch {} reject(new Error(`Failed script: ${srcUrl}`)); };
        (document.head || document.body).appendChild(s);
    });
    const loadPromise = (async () => {
        let lastErr: unknown = null;
        for (const pid of candidates) { try { return await loadViaScript(`${resolveLvAssetBase(pid || undefined)}${chunkName}.js`); } catch (err) { lastErr = err; } }
        throw lastErr instanceof Error ? lastErr : new Error(`Failed chunk ${chunkName}`);
    })();
    w.__LV_KIT_CHUNK_PROMISES__[chunkName] = loadPromise;
    try { return initializeChunkEntry(chunkName, await loadPromise) as T; } catch (err) { delete w.__LV_KIT_CHUNK_PROMISES__[chunkName]; throw err; }
}

function runWithCompassChunk<T>(fn: (c: any) => T): T | undefined { const s = getInitializedChunkSync("lv-kit-compass"); if (s) return fn(s); void loadLvKitChunk("lv-kit-compass").then((c) => fn(c)).catch(() => {}); return undefined; }
function runWithBaStoreChunk<T>(fn: (c: any) => T): T | undefined { const s = getInitializedChunkSync("lv-kit-ba-store"); if (s) return fn(s); void loadLvKitChunk("lv-kit-ba-store").then((c) => fn(c)).catch(() => {}); return undefined; }

export interface LvVaultPluginAdapter {
    pluginId: string; label: string; schemaVersion: number;
    countRecords(snapshot: Record<string, unknown>): number;
    exportSnapshot(): Promise<Record<string, unknown>>;
    previewDiff(incoming: Record<string, unknown>): Promise<{ currentCount: number; incomingCount: number; summary: string }>;
    importMerge(incoming: Record<string, unknown>): Promise<boolean>;
}

const fallbackVaultAdapters = new Map<string, LvVaultPluginAdapter>();
let vaultIdleGen = 0;
let vaultIdleCancel: (() => void) | null = null;

function getSharedVaultAdapters(): Map<string, LvVaultPluginAdapter> {
    if (typeof window !== "object" || !window) return fallbackVaultAdapters;
    const w = window as any, cur = w.__LV_VAULT_ADAPTERS__;
    if (cur && typeof cur.get === "function" && typeof cur.set === "function" && typeof cur.delete === "function") return cur;
    const map = new Map<string, LvVaultPluginAdapter>();
    if (Array.isArray(cur)) { for (const x of cur) if (x?.pluginId) map.set(x.pluginId, x); }
    else if (cur && typeof cur === "object") { for (const [k, v] of Object.entries(cur)) if ((v as any)?.pluginId) map.set((v as any).pluginId || k, v as LvVaultPluginAdapter); }
    return (w.__LV_VAULT_ADAPTERS__ = map);
}

function clearVaultIdle(): void {
    vaultIdleGen++;
    const w = typeof window === "object" && window ? (window as any) : null;
    if (w) {
        w.__LV_VAULT_IDLE_GEN__ = Math.max(w.__LV_VAULT_IDLE_GEN__ | 0, vaultIdleGen - 1) + 1;
        w.__LV_VAULT_IDLE_SCHEDULED__ = false;
    }
    const fn = vaultIdleCancel || w?.__LV_VAULT_IDLE_CANCEL__;
    vaultIdleCancel = null;
    if (w) w.__LV_VAULT_IDLE_CANCEL__ = null;
    if (typeof fn === "function") try { fn(); } catch {}
}

function syncVaultAdaptersToChunk(v: any): void {
    if (typeof v?.register === "function") for (const ad of getSharedVaultAdapters().values()) v.register(ad);
}

async function withVaultChunk(fn: (v: any) => Promise<any>): Promise<any> {
    const v = await loadLvKitChunk("lv-kit-vault");
    syncVaultAdaptersToChunk(v);
    return await fn(v);
}

export const lvSnapshotVault = {
    register(adapter: LvVaultPluginAdapter): () => void {
        if (!adapter?.pluginId) return () => {};
        getSharedVaultAdapters().set(adapter.pluginId, adapter);
        const l = getInitializedChunkSync("lv-kit-vault");
        if (l) return l.register(adapter);
        const wAny = typeof window === "object" && window ? (window as any) : null;
        if (getLvEcosystemToggles().autoSnapshotVault && wAny && !wAny.__LV_VAULT_IDLE_SCHEDULED__) {
            const g = Math.max(wAny.__LV_VAULT_IDLE_GEN__ | 0, vaultIdleGen) + 1;
            vaultIdleGen = wAny.__LV_VAULT_IDLE_GEN__ = g;
            wAny.__LV_VAULT_IDLE_SCHEDULED__ = true;
            const winRef = wAny;
            let done = false;
            const cb = () => {
                done = true;
                if (typeof window === "undefined" || !window || window !== winRef || (winRef.__LV_VAULT_IDLE_GEN__ | 0) !== g) return;
                winRef.__LV_VAULT_IDLE_SCHEDULED__ = false;
                vaultIdleCancel = winRef.__LV_VAULT_IDLE_CANCEL__ = null;
                if (getSharedVaultAdapters().size > 0 && getLvEcosystemToggles().autoSnapshotVault) {
                    void loadLvKitChunk("lv-kit-vault").then(syncVaultAdaptersToChunk).catch(() => {});
                }
            };
            const useIdle = typeof winRef.requestIdleCallback === "function";
            const id = useIdle ? winRef.requestIdleCallback(cb) : winRef.setTimeout(cb, 15000);
            if (!done) {
                const cancel = () => {
                    try { winRef.__LV_VAULT_IDLE_SCHEDULED__ = false; } catch {}
                    try { useIdle ? winRef.cancelIdleCallback?.(id) : winRef.clearTimeout?.(id); } catch {}
                };
                vaultIdleCancel = winRef.__LV_VAULT_IDLE_CANCEL__ = cancel;
            }
        }
        return () => {
            const cur = getSharedVaultAdapters();
            if (cur.get(adapter.pluginId) === adapter) cur.delete(adapter.pluginId);
            getInitializedChunkSync("lv-kit-vault")?.unregister?.(adapter.pluginId);
            if (cur.size === 0) clearVaultIdle();
        };
    },
    unregister(pluginId: string) {
        const cur = getSharedVaultAdapters();
        cur.delete(pluginId);
        getInitializedChunkSync("lv-kit-vault")?.unregister?.(pluginId);
        if (cur.size === 0) clearVaultIdle();
    },
    getAdapters(): LvVaultPluginAdapter[] { const l = getInitializedChunkSync("lv-kit-vault"); if (l) { syncVaultAdaptersToChunk(l); return l.getAdapters(); } return Array.from(getSharedVaultAdapters().values()); },
    scheduleAutoBackup(pluginId?: string, delayMs = 60000) {
        if (!getLvEcosystemToggles().autoSnapshotVault) return;
        const l = getInitializedChunkSync("lv-kit-vault");
        if (l) { syncVaultAdaptersToChunk(l); l.scheduleAutoBackup(pluginId, delayMs); return; }
        void loadLvKitChunk("lv-kit-vault").then((v) => { syncVaultAdaptersToChunk(v); v.scheduleAutoBackup(pluginId, delayMs); }).catch(() => {});
    },
    cancelScheduledBackups() { clearVaultIdle(); getInitializedChunkSync("lv-kit-vault")?.cancelScheduledBackups?.(); },
    runBackupNow(pluginId?: string, opts?: { force?: boolean }): Promise<any> { return withVaultChunk((v) => v.runBackupNow(pluginId, opts)); },
    runBackupAll(opts?: { force?: boolean }): Promise<any> { return withVaultChunk((v) => v.runBackupAll(opts)); },
    inspectRemoteSnapshots(): Promise<any> { return withVaultChunk((v) => v.inspectRemoteSnapshots()); },
    restorePlugin(pluginId: string): Promise<any> { return withVaultChunk((v) => v.restorePlugin(pluginId)); },
    openRestoreWizardDialog(): Promise<any> { return withVaultChunk((v) => v.openRestoreWizardDialog()); },
};

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

const SNOOZE_UNTIL_STORAGE_KEY = "lv_notice_snooze_until_v1";

let memorySnoozeUntilCache: Record<string, number> = {};
let memoryMuteUntilCache: Record<string, number> = {};

function cleanCategoryKey(category: string): string {
    return (category || "").trim().toLowerCase().replace(/^(?:exam-|siyuan-)/, "").replace(/-reminder[s]?$/, "");
}

function loadSnoozeUntilMap(): Record<string, number> {
    const ls = getSafeLocalStorage();
    const now = Date.now();
    const active: Record<string, number> = {};
    const winCache = typeof window !== "undefined" ? (window as any).__LV_SNOOZE_UNTIL_CACHE__ || memorySnoozeUntilCache : memorySnoozeUntilCache;
    for (const [k, v] of Object.entries(winCache)) {
        if (typeof v === "number" && Number.isFinite(v) && v > now) active[k] = v;
    }
    if (ls) {
        try {
            const raw = ls.getItem(SNOOZE_UNTIL_STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                    for (const [k, v] of Object.entries(parsed)) {
                        if (typeof v === "number" && Number.isFinite(v) && v > now) {
                            active[k] = Math.max(active[k] ?? 0, v);
                        }
                    }
                }
            }
        } catch { /* ignore */ }
    }
    memorySnoozeUntilCache = { ...active };
    if (typeof window !== "undefined") (window as any).__LV_SNOOZE_UNTIL_CACHE__ = memorySnoozeUntilCache;
    return active;
}

function saveSnoozeUntilMap(map: Record<string, number>): void {
    memorySnoozeUntilCache = { ...map };
    if (typeof window !== "undefined") (window as any).__LV_SNOOZE_UNTIL_CACHE__ = memorySnoozeUntilCache;
    const ls = getSafeLocalStorage();
    if (!ls) return;
    try {
        ls.setItem(SNOOZE_UNTIL_STORAGE_KEY, JSON.stringify(map));
    } catch { /* ignore */ }
}

function snoozeCategoryImpl(category: string, durationMs: number): void {
    if (!category || !Number.isFinite(durationMs) || durationMs <= 0) return;
    const map = loadSnoozeUntilMap();
    map[category] = Date.now() + durationMs;
    saveSnoozeUntilMap(map);
}

function isCategorySnoozedImpl(category: string): boolean {
    if (!category) return false;
    const now = Date.now();
    const map = loadSnoozeUntilMap();
    if (map[category] && map[category] > now) return true;
    const cleanCat = cleanCategoryKey(category);
    for (const [k, until] of Object.entries(map)) {
        if (until > now && cleanCategoryKey(k) === cleanCat) return true;
    }
    return false;
}

function clearCategorySnoozeImpl(category: string): void {
    if (!category) return;
    const map = loadSnoozeUntilMap();
    const cleanCat = cleanCategoryKey(category);
    let changed = false;
    for (const k of Object.keys(map)) {
        if (k === category || cleanCategoryKey(k) === cleanCat) {
            delete map[k];
            changed = true;
        }
    }
    if (changed) saveSnoozeUntilMap(map);
}

function loadMuteUntilMap(): Record<string, number> {
    const muteBag = getMuteSyncBag();
    if (!muteBag.hasSyncedMuteFromDisk && typeof window !== "undefined") {
        void syncMuteUntilFromDisk();
    }
    const ls = getSafeLocalStorage();
    const now = Date.now();
    const active: Record<string, number> = {};
    const winCache = typeof window !== "undefined" ? (window as any).__LV_MUTE_UNTIL_CACHE__ || memoryMuteUntilCache : memoryMuteUntilCache;
    for (const [k, v] of Object.entries(winCache)) {
        if (typeof v === "number" && Number.isFinite(v) && v > now) active[k] = v;
    }
    if (ls) {
        try {
            const raw = ls.getItem(MUTE_UNTIL_STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                    for (const [k, v] of Object.entries(parsed)) {
                        if (typeof v === "number" && Number.isFinite(v) && v > now) {
                            active[k] = Math.max(active[k] ?? 0, v);
                        }
                    }
                }
            }
        } catch { /* ignore */ }
    }
    memoryMuteUntilCache = { ...active };
    if (typeof window !== "undefined") (window as any).__LV_MUTE_UNTIL_CACHE__ = memoryMuteUntilCache;
    return active;
}

const NOTICE_MUTE_FILE_PATH = "/data/storage/petal/xiaolv-suite/notice-mute.json";
interface LvMuteSyncBag {
    hasSyncedMuteFromDisk: boolean;
    isDiskMuteSyncInFlight: boolean;
    diskMuteSyncTimer: any;
    pendingDeletedMuteKeys: Set<string>;
    pendingResyncMap: Record<string, number> | null;
}
let fallbackMuteSyncBag: LvMuteSyncBag | null = null;
function getMuteSyncBag(): LvMuteSyncBag {
    if (typeof window !== "undefined") {
        const w = window as any;
        if (!w.__LV_MUTE_SYNC_BAG__) {
            w.__LV_MUTE_SYNC_BAG__ = {
                hasSyncedMuteFromDisk: false,
                isDiskMuteSyncInFlight: false,
                diskMuteSyncTimer: null,
                pendingDeletedMuteKeys: new Set<string>(),
                pendingResyncMap: null,
            } as LvMuteSyncBag;
        }
        return w.__LV_MUTE_SYNC_BAG__ as LvMuteSyncBag;
    }
    if (!fallbackMuteSyncBag) {
        fallbackMuteSyncBag = {
            hasSyncedMuteFromDisk: false,
            isDiskMuteSyncInFlight: false,
            diskMuteSyncTimer: null,
            pendingDeletedMuteKeys: new Set<string>(),
            pendingResyncMap: null,
        };
    }
    return fallbackMuteSyncBag;
}

async function syncMuteUntilFromDisk(): Promise<void> {
    const muteBag = getMuteSyncBag();
    if (typeof window === "undefined" || muteBag.hasSyncedMuteFromDisk) return;
    const g = globalThis as any;
    if (typeof g.process !== "undefined" && (g.process.env?.NODE_ENV === "test" || g.process.env?.VITEST)) return;
    muteBag.hasSyncedMuteFromDisk = true;
    try {
        let parsed: any = null;
        if (typeof fetch === "function") {
            try {
                const resp = await fetch("/api/file/getFile", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ path: NOTICE_MUTE_FILE_PATH }),
                });
                if (resp.status === 200) {
                    const txt = await resp.text();
                    try { parsed = JSON.parse(txt); } catch { /* ignore */ }
                }
            } catch { /* ignore */ }
        }
        if (!parsed) {
            try {
                const res = await lvKernelPost("/api/file/getFile", { path: NOTICE_MUTE_FILE_PATH });
                if (res) {
                    if (res.code === 0 && res.data) {
                        const text = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
                        try { parsed = JSON.parse(text); } catch { /* ignore */ }
                    } else if (typeof (res as any).code === "undefined" && typeof res === "object") {
                        parsed = res;
                    }
                }
            } catch { /* ignore */ }
        }
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return;

        const now = Date.now();
        const map = loadMuteUntilMap();
        let updated = false;

        for (const [k, v] of Object.entries(parsed)) {
            if (muteBag.pendingDeletedMuteKeys.has(k)) continue; // 本会话已显式取消的 key 不再从磁盘复活
            if (typeof v === "number" && Number.isFinite(v) && v > now) {
                if (!map[k] || v > map[k]) {
                    map[k] = v;
                    updated = true;
                }
            }
        }

        if (updated) {
            saveMuteUntilMap(map, false);
        }
    } catch {

        muteBag.hasSyncedMuteFromDisk = false;
    }
}

if (typeof window !== "undefined") {
    void syncMuteUntilFromDisk();
}

function scheduleSaveMuteUntilToDisk(map: Record<string, number>): void {
    if (typeof window === "undefined") return;
    const g = globalThis as any;
    if (typeof g.process !== "undefined" && (g.process.env?.NODE_ENV === "test" || g.process.env?.VITEST)) return;
    const muteBag = getMuteSyncBag();
    if (muteBag.diskMuteSyncTimer) clearTimeout(muteBag.diskMuteSyncTimer);
    muteBag.diskMuteSyncTimer = setTimeout(async () => {
        muteBag.diskMuteSyncTimer = null;
        if (muteBag.isDiskMuteSyncInFlight) {
            muteBag.pendingResyncMap = { ...map };
            return;
        }
        muteBag.isDiskMuteSyncInFlight = true;

        const settledTombstones = new Set(muteBag.pendingDeletedMuteKeys);
        try {
            let diskMap: Record<string, number> = {};
            if (typeof fetch === "function") {
                try {
                    const resp = await fetch("/api/file/getFile", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ path: NOTICE_MUTE_FILE_PATH }),
                    });
                    if (resp.status === 200) {
                        const txt = await resp.text();
                        try {
                            const p = JSON.parse(txt);
                            if (p && typeof p === "object" && !Array.isArray(p)) diskMap = p;
                        } catch { /* ignore */ }
                    }
                } catch { /* ignore */ }
            }
            const now = Date.now();
            const merged: Record<string, number> = {};
            for (const [k, v] of Object.entries(diskMap)) {
                if (muteBag.pendingDeletedMuteKeys.has(k)) continue; // 墓碑 key 不从磁盘旧值复活（取消免打扰跨重启失效根治）
                if (typeof v === "number" && Number.isFinite(v) && v > now) {
                    merged[k] = v;
                }
            }
            for (const [k, v] of Object.entries(map)) {
                if (typeof v === "number" && Number.isFinite(v) && v > now) {
                    merged[k] = Math.max(merged[k] ?? 0, v);
                }
            }

            const bodyStr = JSON.stringify(merged, null, 2);
            if (typeof FormData !== "undefined" && typeof Blob !== "undefined" && typeof fetch === "function") {
                const fd = new FormData();
                fd.append("path", NOTICE_MUTE_FILE_PATH);
                fd.append("file", new Blob([bodyStr], { type: "application/json" }), "notice-mute.json");
                await fetch("/api/file/putFile", { method: "POST", body: fd });

                for (const k of settledTombstones) muteBag.pendingDeletedMuteKeys.delete(k);
            }
        } catch {
            /* 磁盘写入降级 */
        } finally {
            muteBag.isDiskMuteSyncInFlight = false;
            if (muteBag.pendingResyncMap) {
                const nextMap = muteBag.pendingResyncMap;
                muteBag.pendingResyncMap = null;
                scheduleSaveMuteUntilToDisk(nextMap);
            }
        }
    }, 400);
}

function saveMuteUntilMap(map: Record<string, number>, persistToDisk = true): void {
    memoryMuteUntilCache = { ...map };
    if (typeof window !== "undefined") (window as any).__LV_MUTE_UNTIL_CACHE__ = memoryMuteUntilCache;
    const ls = getSafeLocalStorage();
    if (ls) {
        try {
            ls.setItem(MUTE_UNTIL_STORAGE_KEY, JSON.stringify(map));
        } catch { /* ignore */ }
    }
    if (persistToDisk) {
        scheduleSaveMuteUntilToDisk(map);
    }
}

function muteCategoryUntilImpl(category: string, untilTimestamp: number): void {
    if (!category || !Number.isFinite(untilTimestamp)) return;
    const muteBag = getMuteSyncBag();
    const cleanCat = cleanCategoryKey(category);
    for (const k of Array.from(muteBag.pendingDeletedMuteKeys)) {
        if (k === category || cleanCategoryKey(k) === cleanCat) {
            muteBag.pendingDeletedMuteKeys.delete(k);
        }
    }
    const map = loadMuteUntilMap();
    map[category] = untilTimestamp;
    saveMuteUntilMap(map);
}

function muteCategoryDaysImpl(category: string, days: number): void {
    if (!category || !Number.isFinite(days) || days <= 0) return;
    const d = new Date();

    d.setDate(d.getDate() + Math.floor(days));
    d.setHours(23, 59, 59, 999);
    muteCategoryUntilImpl(category, d.getTime());
}

function muteCategoryTodayImpl(category: string): void {
    if (!category) return;
    const d = new Date();
    const now = d.getTime();
    d.setHours(23, 59, 59, 999);
    const endOfDay = d.getTime();

    const minSafeDuration = 8 * 3600 * 1000;
    const until = Math.max(endOfDay, now + minSafeDuration);
    muteCategoryUntilImpl(category, until);
    const ls = getSafeLocalStorage();
    if (!ls) return;
    try {
        const key = `${STORAGE_PREFIX}${getTodayKey()}`;
        try {
            if (typeof ls.length === "number" && typeof ls.key === "function" && typeof ls.removeItem === "function") {
                for (let i = ls.length - 1; i >= 0; i--) {
                    const k = ls.key(i);

                    if (k && k !== MUTE_UNTIL_STORAGE_KEY && k !== SNOOZE_UNTIL_STORAGE_KEY && (k.startsWith(STORAGE_PREFIX) || k.startsWith("lv_notice_mute_20")) && k !== key) {
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
    const now = Date.now();
    const map = loadMuteUntilMap();
    if (map[category] && map[category] > now) {
        return true;
    }
    const cleanCat = cleanCategoryKey(category);
    for (const [k, until] of Object.entries(map)) {
        if (until > now && cleanCategoryKey(k) === cleanCat) return true;
    }
    const ls = getSafeLocalStorage();
    if (!ls) return false;
    try {
        const key = `${STORAGE_PREFIX}${getTodayKey()}`;
        const raw = ls.getItem(key) || ls.getItem(`lv_notice_mute_${getTodayKey()}`);
        if (!raw) return false;
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
            if (list.includes(category)) return true;
            for (const c of list) {
                if (cleanCategoryKey(String(c)) === cleanCat) return true;
            }
        }
        return false;
    } catch {
        return false;
    }
}

function clearCategoryMuteImpl(category: string): void {
    if (!category) return;
    const muteBag = getMuteSyncBag();
    const map = loadMuteUntilMap();
    const cleanCat = cleanCategoryKey(category);
    let changed = false;
    for (const k of Object.keys(map)) {
        if (k === category || cleanCategoryKey(k) === cleanCat) {
            delete map[k];
            muteBag.pendingDeletedMuteKeys.add(k); // 墓碑：防止磁盘 Read-Merge-Write 把本次取消回写复活
            changed = true;
        }
    }
    if (changed) saveMuteUntilMap(map);
    const ls = getSafeLocalStorage();
    if (!ls) return;
    try {
        const key = `${STORAGE_PREFIX}${getTodayKey()}`;
        const raw = ls.getItem(key);
        if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
                ls.setItem(key, JSON.stringify(list.filter((c: string) => c !== category && cleanCategoryKey(c) !== cleanCat)));
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
            const untilStr = until >= now + 365 * 24 * 3600 * 1000
                ? "永久免打扰"
                : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
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

const NOTICE_HISTORY_RETENTION_DAYS = 7;
function parseHistoryKeyDateMs(key: string): number | null {
    if (!key.startsWith(HISTORY_STORAGE_PREFIX)) return null;
    const m = key.slice(HISTORY_STORAGE_PREFIX.length).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const ts = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return Number.isFinite(ts) ? ts : null;
}
function loadTodayNoticeHistory(): LvNoticePacket[] {
    const ls = getSafeLocalStorage();
    if (!ls) return [];
    try {
        const todayDateMs = parseHistoryKeyDateMs(`${HISTORY_STORAGE_PREFIX}${getTodayKey()}`) ?? Date.now();
        const rawList: LvNoticePacket[] = [];
        for (let offset = 0; offset < NOTICE_HISTORY_RETENTION_DAYS; offset++) {
            const d = new Date(todayDateMs - offset * 86_400_000);
            const raw = ls.getItem(`${HISTORY_STORAGE_PREFIX}${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`);
            if (!raw) continue;
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) for (const p of parsed) if (p && typeof p.id === "string" && typeof p.message === "string") { rawList.push(p); if (rawList.length >= MAX_PERSISTED_HISTORY) break; }
            } catch {}
            if (rawList.length >= MAX_PERSISTED_HISTORY) break;
        }
        if (rawList.length === 0) return [];

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
                    const todayMs = parseHistoryKeyDateMs(key) ?? Date.now();
                    const maxAgeMs = (NOTICE_HISTORY_RETENTION_DAYS - 1) * 86_400_000;
                    for (let i = ls.length - 1; i >= 0; i--) {
                        const k = ls.key(i);
                        if (!k || !k.startsWith(HISTORY_STORAGE_PREFIX) || k === key) continue;
                        const kMs = parseHistoryKeyDateMs(k);
                        if (kMs === null || (todayMs - kMs) > maxAgeMs || (todayMs - kMs) < -86_400_000) ls.removeItem(k);
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

/* ===== 首启弹层队列（First-Run Notice Queue · Protocol v1.8.6） =====
 * 新工作区首启时多家插件的引导卡/提醒卡同时投递，底部卡片互相堆叠（真机走查实证五层同屏）。
 * - firstRun 卡片按指纹（source|title|category）当天去重，重载不复现；
 * - 同一时刻只渲染一张：active>0 时新卡进入 pending，卡片离场（手动/自动/Esc/滑走统一走 dismiss→onDismiss）
 *   400ms 后串行补投下一张；
 * - 状态挂 window 单例，8 仓模块实例共享同一队列。 */
const FIRST_RUN_DONE_STORAGE_KEY = "lv_notice_first_run_done_v1";

interface FirstRunSharedState {
    active: number;
    pending: LvNoticePacket[];
}

function getFirstRunShared(): FirstRunSharedState {
    if (typeof window !== "undefined") {
        const w = window as unknown as { __LV_FIRST_RUN_STATE__?: FirstRunSharedState };
        if (!w.__LV_FIRST_RUN_STATE__) w.__LV_FIRST_RUN_STATE__ = { active: 0, pending: [] };
        return w.__LV_FIRST_RUN_STATE__;
    }
    const g = globalThis as unknown as { __LV_FIRST_RUN_STATE_NODE__?: FirstRunSharedState };
    if (!g.__LV_FIRST_RUN_STATE_NODE__) g.__LV_FIRST_RUN_STATE_NODE__ = { active: 0, pending: [] };
    return g.__LV_FIRST_RUN_STATE_NODE__;
}

function firstRunFingerprint(packet: LvNoticePacket): string {
    return `${packet.source || ""}|${packet.title || ""}|${packet.category || ""}`;
}

function loadFirstRunDoneSet(): Set<string> {
    const ls = getSafeLocalStorage();
    if (!ls) return new Set();
    try {
        const raw = ls.getItem(FIRST_RUN_DONE_STORAGE_KEY);
        const today = getTodayKey();
        if (raw) {
            const parsed = JSON.parse(raw) as { day?: string; keys?: string[] };
            if (parsed?.day === today && Array.isArray(parsed.keys)) return new Set(parsed.keys);
        }
    } catch { /* ignore */ }
    return new Set();
}

function saveFirstRunDoneSet(done: Set<string>): void {
    const ls = getSafeLocalStorage();
    if (!ls) return;
    try {
        ls.setItem(FIRST_RUN_DONE_STORAGE_KEY, JSON.stringify({ day: getTodayKey(), keys: Array.from(done).slice(0, 60) }));
    } catch { /* ignore */ }
}

function gateFirstRunNotice(packet: LvNoticePacket): boolean {
    const done = loadFirstRunDoneSet();
    const fp = firstRunFingerprint(packet);
    if (done.has(fp)) return false;
    done.add(fp);
    saveFirstRunDoneSet(done);
    return true;
}

function wrapFirstRunDismiss(packet: LvNoticePacket, flush: () => void): LvNoticePacket {
    const inner = packet.onDismiss;
    return {
        ...packet,
        onDismiss: () => {
            try { inner?.(); } catch { /* ignore */ }
            const shared = getFirstRunShared();
            shared.active = Math.max(0, shared.active - 1);
            const schedule = typeof window !== "undefined" && typeof window.setTimeout === "function" ? window.setTimeout : setTimeout;
            schedule(() => flush(), 400);
        },
    };
}

function flushFirstRunPending(repost: () => ((p: LvNoticePacket) => void)): void {
    const shared = getFirstRunShared();
    if (shared.active > 0) return;
    const next = shared.pending.shift();
    if (!next) return;
    const replay = { ...next, id: `${next.id}_frq_${Date.now().toString(36)}` } as LvNoticePacket & { __frqReplay?: boolean };
    replay.__frqReplay = true;
    const post = repost();
    post(replay);
}

function createCoordinator(initialPlugin: string): LvNoticeHub {    let hostEl = typeof document.getElementById === "function" ? document.getElementById("lv-notice-host") : null;
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

    let unregisterNoticeSurface: (() => void) | null = null;
    let avoidanceCleanup: (() => void) | null = null;
    let avoidanceRafId: number | null = null;

    function syncNoticeHostAvoidance() {
        if (!hostEl || typeof document === "undefined" || typeof document.querySelectorAll !== "function") return;
        if (document.hidden) return;
        try {
            const vw = typeof window !== "undefined" ? (window.innerWidth || 1440) : 1440;
            const vh = typeof window !== "undefined" ? (window.innerHeight || 900) : 900;
            const candidates = document.querySelectorAll<HTMLElement>(
                ".lv-bam, .b3-dialog.xlc-dialog--pinned, .xlc-dialog--pinned, .xlc-dialog--mini, .sw-floating-ball"
            );
            let avoidBottom = 0;
            candidates.forEach((node) => {
                if (!node) return;
                if (typeof node.closest === "function" && node.closest(".fn__none")) return;
                const rect = typeof node.getBoundingClientRect === "function" ? node.getBoundingClientRect() : null;
                if (rect && (rect.width > 0 || rect.height > 0)) {

                    if (rect.right > vw - 460 && rect.bottom > vh - 420) {
                        const neededBottom = Math.max(120, Math.round(vh - rect.top + 14));
                        avoidBottom = Math.max(avoidBottom, Math.min(neededBottom, Math.max(180, vh - 160)));
                    }
                } else {

                    avoidBottom = Math.max(avoidBottom, 220);
                }
            });
            if (avoidBottom > 0) {
                hostEl.style.bottom = `${avoidBottom}px`;
                hostEl.setAttribute?.("data-lv-avoiding", "true");
            } else {
                if (hostEl.style.bottom) hostEl.style.bottom = "";
                hostEl.removeAttribute?.("data-lv-avoiding");
            }

            let avoidRight = 0;
            const popEl = typeof document.getElementById === "function" ? document.getElementById("lv-desktop-launchpad-popover") : null;
            if (popEl && !popEl.classList?.contains?.("lv-popover-closing") && !popEl.classList?.contains?.("fn__none")) {
                const pRect = typeof popEl.getBoundingClientRect === "function" ? popEl.getBoundingClientRect() : null;
                if (pRect && (pRect.width > 0 || pRect.height > 0)) {
                    if (pRect.right > vw - 460 && pRect.bottom > vh - 420 && pRect.left > 240) {
                        avoidRight = Math.max(20, Math.round(vw - pRect.left + 16));
                    }
                } else {
                    const pw = parseInt(popEl.style?.width || "520", 10) || 520;
                    const pr = parseInt(popEl.style?.right || "16", 10) || 16;
                    if (vw - pw - pr > 200) {
                        avoidRight = pw + pr + 16;
                    }
                }
            }
            if (avoidRight > 0) {
                hostEl.style.right = `${avoidRight}px`;
                hostEl.setAttribute?.("data-lv-avoiding-popover", "true");
            } else {
                if (hostEl.style.right) hostEl.style.right = "";
                hostEl.removeAttribute?.("data-lv-avoiding-popover");
            }
        } catch { /* ignore */ }
    }
    if (typeof window !== "undefined") {
        (window as any).__LV_SYNC_NOTICE_AVOIDANCE__ = syncNoticeHostAvoidance;
    }

    function teardownAvoidanceWatchers() {
        if (avoidanceRafId !== null) {
            try {
                if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(avoidanceRafId);
                else clearTimeout(avoidanceRafId);
            } catch { /* ignore */ }
            avoidanceRafId = null;
        }
        if (avoidanceCleanup) {
            try { avoidanceCleanup(); } catch { /* ignore */ }
            avoidanceCleanup = null;
        }
    }

    function syncNoticeSurface() {
        const hasVisible = activePackets.length > 0;
        const canObserveAvoidance = typeof window !== "undefined"
            && typeof document !== "undefined"
            && typeof document.querySelectorAll === "function";
        if (hasVisible && !avoidanceCleanup && canObserveAvoidance) {
            const scheduleAvoidanceSync = () => {
                if (activePackets.length === 0 || (hostEl && hostEl.isConnected === false)) {
                    teardownAvoidanceWatchers();
                    return;
                }
                if (typeof document !== "undefined" && document.hidden) return;
                if (avoidanceRafId !== null) return;
                const run = () => {
                    avoidanceRafId = null;
                    if (activePackets.length === 0 || (hostEl && hostEl.isConnected === false)) {
                        teardownAvoidanceWatchers();
                        return;
                    }
                    syncNoticeHostAvoidance();
                };
                if (typeof requestAnimationFrame === "function") {
                    avoidanceRafId = requestAnimationFrame(run);
                } else {
                    avoidanceRafId = window.setTimeout(run, 16);
                }
            };
            let ro: ResizeObserver | null = null;
            if (typeof ResizeObserver === "function" && document.body) {
                try {
                    ro = new ResizeObserver(scheduleAvoidanceSync);
                    ro.observe(document.body);
                } catch { ro = null; }
            }
            let mo: MutationObserver | null = null;
            if (typeof MutationObserver === "function" && document.body) {
                try {
                    mo = new MutationObserver(scheduleAvoidanceSync);
                    mo.observe(document.body, { childList: true, subtree: false });
                } catch { mo = null; }
            }
            const onVisibility = () => {
                if (typeof document !== "undefined" && !document.hidden) scheduleAvoidanceSync();
            };
            try { window.addEventListener?.("resize", scheduleAvoidanceSync, { passive: true } as any); } catch { /* ignore */ }
            try { document.addEventListener?.("visibilitychange", onVisibility, { passive: true } as any); } catch { /* ignore */ }
            avoidanceCleanup = () => {
                try { ro?.disconnect(); } catch { /* ignore */ }
                try { mo?.disconnect(); } catch { /* ignore */ }
                try { window.removeEventListener?.("resize", scheduleAvoidanceSync as any); } catch { /* ignore */ }
                try { document.removeEventListener?.("visibilitychange", onVisibility as any); } catch { /* ignore */ }
            };
        } else if (!hasVisible && avoidanceCleanup) {
            teardownAvoidanceWatchers();
        }
        if (hasVisible && !unregisterNoticeSurface) {
            unregisterNoticeSurface = lvSurfaceStack.push({
                id: "lv-notice-active-card",
                type: "card",
                dismiss: () => {

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
        syncNoticeHostAvoidance();

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
                const actionHtml = packet.action ? `<button type="button" class="lv-notice-capsule-action" data-role="capsule-action">${escapeHtml(packet.action.label)}</button>` : "";
                const repeatHtml = (packet.repeatCount || 1) > 1 ? `<span class="lv-notice-repeat">×${packet.repeatCount}</span>` : "";
                card.innerHTML = `<span class="lv-notice-source-badge">${escapeHtml(packet.source || "提示")}</span><span>${escapeHtml(packet.message)}</span>${repeatHtml}${actionHtml}`;
                if (packet.action) {
                    const actBtn = card.querySelector<HTMLElement>("[data-role='capsule-action']");
                    actBtn?.addEventListener("click", async (e) => {
                        e.stopPropagation();
                        try {
                            await packet.action?.onClick?.();
                        } catch (err) {
                            console.error("[LvNotice] capsule action error", err);
                            /* 模式二留痕（2026-11-14 审计）：动作失败不再只 console——用户可见反馈 + 诊断入环 */
                            pushDiagError({ source: packet.source || "通知中心", message: `动作执行失败：${err instanceof Error ? err.message : String(err)}` });
                            hub.post({ id: `cap_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, mode: "capsule", source: "通知中心", message: "⚠️ 动作执行失败，已记录诊断", level: "error", duration: 2600, archive: false, createdAt: Date.now(), repeatCount: 1 });
                        }
                        hub.dismiss(packet.id);
                    });
                }
            } else {
                const actionsHtml = (packet.actions || []).map((act, idx) => `<button type="button" class="lv-notice-btn ${act.primary ? "lv-notice-btn--primary" : ""}" data-action-idx="${idx}">${escapeHtml(act.label)}</button>`).join("");

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
                        if (!resolvedSnoozeOpts.some(o => (o.muteDays && o.muteDays >= 365) || (o as any).muteForever)) {
                            resolvedSnoozeOpts.push({ label: "永久不再通知", muteDays: 3650 });
                        }
                    }
                }

                const snoozeHtml = resolvedSnoozeOpts.length > 0
                    ? `<div class="lv-notice-snooze-row">${resolvedSnoozeOpts.map((opt, sIdx) => {
                        const isMute = Boolean(opt.muteToday || (typeof opt.muteDays === "number" && opt.muteDays > 0));
                        return `<button type="button" class="lv-notice-btn ${isMute ? "lv-notice-btn--mute" : ""}" data-snooze-idx="${sIdx}">${escapeHtml(opt.label)}</button>`;
                    }).join("")}</div>`
                    : "";

                card.innerHTML = `<div class="lv-notice-header"><span class="lv-notice-source-badge">${escapeHtml(packet.source || "小驴")}</span><span class="lv-notice-title">${escapeHtml(packet.title || "")}</span>${packet.repeatCount > 1 ? `<span class="lv-notice-repeat">×${packet.repeatCount}</span>` : ""}<button type="button" class="lv-notice-close-btn" data-role="close" aria-label="关闭">✕</button></div><div class="lv-notice-body">${escapeHtml(packet.message)}</div>${actionsHtml || snoozeHtml ? `<div class="lv-notice-actions">${actionsHtml}${snoozeHtml}</div>` : ""}`;

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
                            try { await act.onClick(); } catch (err) {
                                console.error("[LvNotice] action error", err);
                                /* 模式二留痕（2026-11-14 审计）：卡片动作失败补可见反馈 + 诊断入环 */
                                pushDiagError({ source: packet.source || "通知中心", message: `动作执行失败：${err instanceof Error ? err.message : String(err)}` });
                                hub.post({ id: `cap_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, mode: "capsule", source: "通知中心", message: "⚠️ 动作执行失败，已记录诊断", level: "error", duration: 2600, archive: false, createdAt: Date.now(), repeatCount: 1 });
                            }
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
                            muteCategoryDaysImpl(packet.category, opt.muteDays);
                            if (typeof hub.muteDays === "function") hub.muteDays(packet.category, opt.muteDays);
                            hub.dismiss(packet.id);
                            const desc = opt.muteDays >= 365 ? "永久" : opt.muteDays === 7 ? "未来一周" : `未来 ${opt.muteDays} 天`;
                            lvNotify.capsule({
                                source: packet.source || "免打扰",
                                message: `🔕 已关闭「${packet.title || packet.category}」提醒（${desc}不通知）`,
                                duration: 2800,
                                archive: false,
                            });
                            if (opt.muteDays >= 365 && typeof window !== "undefined") {
                                try {
                                    window.dispatchEvent(new CustomEvent("lv-notice-mute-forever", {
                                        detail: { category: packet.category, source: packet.source, days: opt.muteDays }
                                    }));
                                } catch { /* ignore */ }
                            }
                        } else if (opt?.muteToday && packet.category) {
                            muteCategoryTodayImpl(packet.category);
                            if (typeof hub.muteToday === "function") hub.muteToday(packet.category);
                            hub.dismiss(packet.id);
                            lvNotify.capsule({
                                source: packet.source || "免打扰",
                                message: `🔕 已关闭「${packet.title || packet.category}」提醒（今日免打扰）`,
                                duration: 2400,
                                archive: false,
                            });
                        } else if (opt?.durationMs) {

                            if (packet.category) {
                                snoozeCategoryImpl(packet.category, opt.durationMs);
                                const minutes = Math.round(opt.durationMs / 60000);
                                const desc = minutes >= 60 ? `${Math.round(minutes / 60)} 小时` : `${minutes} 分钟`;
                                lvNotify.capsule({
                                    source: packet.source || "稍后提醒",
                                    message: `⏰ 「${packet.title || packet.category}」将在 ${desc} 后再次提醒`,
                                    duration: 2400,
                                    archive: false,
                                });
                            }
                            hub.snooze(packet.id, opt.durationMs);
                        } else {
                            hub.dismiss(packet.id);
                        }
                    });
                });
            }

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

    let harmonizerDisposer: (() => void) | undefined;
    let aiProgressSuppressorDisposer: (() => void) | undefined;

    const hub: LvNoticeHub = {
        version: PROTOCOL_VERSION,
        hostPlugin: initialPlugin,

        post(packet: LvNoticePacket) {
            if (getLvEcosystemToggles().noticeCenter === false && packet.mode !== "silent") return;
            packet.read = packet.read ?? false;
            packet.repeatCount = typeof packet.repeatCount === "number" && packet.repeatCount > 0 ? packet.repeatCount : 1;

            if (packet.category && (isCategoryMutedImpl(packet.category) || isCategorySnoozedImpl(packet.category))) {
                return;
            }

            if (packet.level === "error") {
                pushDiagError({
                    source: packet.source || "unknown",
                    message: `${packet.title ? `${packet.title}：` : ""}${packet.message || ""}`.trim(),
                });
            }

            if (packet.firstRun && packet.mode === "card") {
                const replayPacket = packet as unknown as { __frqReplay?: boolean };
                const isReplay = replayPacket.__frqReplay === true;
                if (isReplay) delete replayPacket.__frqReplay;
                if (!isReplay) {
                    if (!gateFirstRunNotice(packet)) return;
                    if (getFirstRunShared().active > 0) {
                        getFirstRunShared().pending.push(packet);
                        return;
                    }
                }
            }

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

                if (timers.has(existing.id)) {
                    clearTimeout(timers.get(existing.id));
                    timers.delete(existing.id);
                }
                const nextDuration = packet.duration ?? (packet.level === "error" ? 0 : 4000);
                if (nextDuration > 0) {
                    const t = window.setTimeout(() => {
                        this.dismiss(existing.id);
                    }, nextDuration);
                    timers.set(existing.id, t);
                }
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

            if (packet.firstRun && packet.mode === "card") {
                getFirstRunShared().active++;
                packet = wrapFirstRunDismiss(packet, () => flushFirstRunPending(() => hub.post.bind(hub)));
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

                const cardEl = hostEl?.querySelector(`[data-id="${id}"]`);
                const hasMoreBadge = Boolean(hostEl?.querySelector(".lv-notice-more"));
                if (cardEl && activePackets.length < 3 && !hasMoreBadge) {
                    try { cardEl.remove(); } catch { /* ignore */ }
                    syncNoticeSurface();
                } else {
                    render();
                }
            }
        },

        snooze(id: string, durationMs: number) {
            const item = activePackets.find((p) => p.id === id);
            if (!item) return;

            if (item.category && Number.isFinite(durationMs) && durationMs > 0) {
                snoozeCategoryImpl(item.category, durationMs);
            }
            this.dismiss(id);
            setTimeout(() => {
                if (item.category) clearCategorySnoozeImpl(item.category);
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

        snoozeCategory(category: string, durationMs: number) {
            snoozeCategoryImpl(category, durationMs);
        },

        isCategorySnoozed(category: string): boolean {
            return isCategorySnoozedImpl(category);
        },

        clearCategorySnooze(category: string) {
            clearCategorySnoozeImpl(category);
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
            if (harmonizerDisposer) {
                try { harmonizerDisposer(); } catch { /* ignore */ }
                harmonizerDisposer = undefined;
            }
            if (aiProgressSuppressorDisposer) {
                try { aiProgressSuppressorDisposer(); } catch { /* ignore */ }
                aiProgressSuppressorDisposer = undefined;
            }
            timers.forEach((t) => clearTimeout(t));
            timers.clear();
            teardownAvoidanceWatchers();
            if (typeof window !== "undefined" && (window as any).__LV_SYNC_NOTICE_AVOIDANCE__ === syncNoticeHostAvoidance) {
                delete (window as any).__LV_SYNC_NOTICE_AVOIDANCE__;
            }
            hostEl?.remove();
            hostEl = null;
            if (window.__LV_NOTICE_HUB__ === this) {
                delete window.__LV_NOTICE_HUB__;
            }
        }
    };

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

    /* 原生加载/进度类提示白名单：思源会在每次打开文档、索引、处理任务时弹出瞬时进度条，
     * 高频时同一句被折叠成 ×130 一类的历史记录（真机截图实证）。这类提示在思源界面本身
     * 已即时反馈，属于纯瞬态噪音——不再归档进通知历史（异常类即使命中也照常留档追踪）。 */
    const NATIVE_SNACKBAR_NOISE_RE = /正在打开|请稍等|正在加载|加载中|正在处理|正在索引|正在重建索引|正在构建索引|正在缓存|构建缓存|正在写入|正在导出|正在导入/i;
    const isNativeSnackbarNoise = (text: string): boolean => NATIVE_SNACKBAR_NOISE_RE.test(text || "");

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
            const isNoise = isNativeSnackbarNoise(text);
            const isUpgradeNotice = /新版本|可升级|升级到|新版|version|update/i.test(text);
            const packetId = `sy_native_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

            if ((err || isUpgradeNotice) && el.style) {
                try { el.style.display = "none"; } catch { /* ignore */ }
            }

            const noticeMode: "card" | "capsule" | "silent" = err ? "capsule" : (isUpgradeNotice ? "capsule" : (isNoise ? "silent" : "capsule"));
            const noticeDuration = isUpgradeNotice ? 8000 : (err ? 4200 : 3500);

            hub.post({
                id: packetId,
                mode: noticeMode,
                duration: noticeDuration,
                source: isUpgradeNotice ? "思源官方" : "思源原生",
                category: isUpgradeNotice ? "siyuan-upgrade" : (err ? "siyuan-error" : "siyuan-native"),
                title: isUpgradeNotice ? "🎉 发现思源新版本" : (err ? "思源异常" : undefined),
                message: text,
                level: err ? "error" : "info",
                createdAt: Date.now(),
                repeatCount: 1,
                read: !err && !isUpgradeNotice,
                archive: isNoise ? false : undefined,
            });
            const top = historyList[0];
            nativeSnackbarToPacketId.set(el, top && top.message === text ? top.id : packetId);
        } catch { /* ignore */ }
    };

    const recordExternalFloatingReminder = (el: HTMLElement) => {
        try {
            if (!el || typeof el.querySelector !== "function") return;
            const isExternalModal = Boolean(
                el.querySelector?.("[data-tm-semantic-summary]") ||
                el.classList?.contains?.("tm-remind-modal") ||
                el.classList?.contains?.("tm-semantic-date-confirm-modal") ||
                (el.textContent?.includes("个提醒") && el.textContent?.includes("稍后处理"))
            );
            if (isExternalModal) {
                const raw = (el.textContent || "").replace(/\s+/g, " ").trim();
                if (raw && !raw.includes("小驴全家桶") && !raw.includes("小驴罗盘")) {

                    const cleaned = raw.replace(/\d+\s*个提醒/g, " ").replace(/稍后处理/g, " ").replace(/\s+/g, " ").trim() || raw;
                    const snippet = cleaned.length > 70 ? cleaned.slice(0, 70) + "…" : cleaned;
                    const packetId = `sy_ext_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
                    hub.post({
                        id: packetId,
                        mode: "capsule",
                        source: "日程与任务",
                        category: "external-reminder",
                        title: "日程提醒已收拢",
                        message: snippet,
                        level: "info",
                        createdAt: Date.now(),
                        repeatCount: 1,
                        read: false,
                    });
                }
            }
        } catch { /* ignore */ }
    };

    const snackHandler = (muts: MutationRecord[]) => {
        if (getLvEcosystemToggles().nativeMessageBridge === false) return;
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
                    recordExternalFloatingReminder(el);
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
        if (getLvEcosystemToggles().nativeMessageBridge === false) return false;
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

                    bridge.obs.observe(document.body, { childList: true, subtree: false });
                }
            } catch { /* ignore */ }
        }
    }

    if (typeof document !== "undefined" && typeof MutationObserver === "function" && document.body) {
        harmonizerDisposer = wireExternalModalHarmonizer(hub);
    }

    if (typeof document !== "undefined" && document.body) {
        aiProgressSuppressorDisposer = installLvAiProgressSuppressor();
    }

    return hub;
}

function wireExternalModalHarmonizer(hub: LvNoticeHub): () => void {
    if (typeof window === "undefined" || typeof document === "undefined" || !document.body || typeof MutationObserver === "undefined") {
        return () => {};
    }
    const win = window as unknown as {
        __LV_MODAL_HARMONIZER__?: {
            obs: MutationObserver | null;
            refCount: number;
            sweepStopped: boolean;
            sweepTimer: ReturnType<typeof setTimeout> | null;
            processedEls: WeakSet<HTMLElement> | null;
            recentSigs: Map<string, number> | null;
        };
    };
    const holder = win.__LV_MODAL_HARMONIZER__ ||
        (win.__LV_MODAL_HARMONIZER__ = { obs: null, refCount: 0, sweepStopped: false, sweepTimer: null, processedEls: null, recentSigs: null });
    holder.refCount++;

    const LV_OWN_SURFACE_SELECTOR = "#lv-notice-host, #lv-launchpad-sheet-mask, #lv-launchpad-mobile-ball, #lv-launchpad-mobile-entry, #lvLaunchpadDesktopEntry, #lv-desktop-launchpad-popover";

    if (!holder.processedEls) holder.processedEls = new WeakSet<HTMLElement>();
    if (!holder.recentSigs) holder.recentSigs = new Map<string, number>();
    const processedEls = holder.processedEls;
    const recentSigs = holder.recentSigs;

    const isOwnSurface = (el: HTMLElement): boolean => {
        try { return Boolean(el.closest?.(LV_OWN_SURFACE_SELECTOR)); } catch { return false; }
    };

    const isInteracting = (el: HTMLElement): boolean => {
        try {
            const active = typeof document !== "undefined" ? document.activeElement : null;
            if (active && el.contains?.(active)) return true;

            if (typeof el.querySelector === "function") {
                if (el.querySelector("textarea, input[type=text], input[type=search], [contenteditable=true], .protyle-wysiwyg")) return true;
            }
            if (typeof el.matches === "function" && el.matches(":hover")) return true;
        } catch { /* ignore */ }
        return false;
    };

    const collapseExternalReminderEl = (el: HTMLElement) => {
        if (getLvEcosystemToggles().externalModalHarmonizer === false) return;
        try {
            processedEls.add(el);
            const raw = (el.textContent || "").replace(/\s+/g, " ").trim();
            if (raw && !raw.includes("小驴全家桶") && !raw.includes("小驴罗盘")) {

                const clean = raw.replace(/\d+\s*个提醒/g, " ").replace(/稍后处理/g, " ").replace(/\s+/g, " ").trim();
                const base = clean || raw;
                const snippet = base.length > 70 ? base.slice(0, 70) + "…" : base;

                const sig = snippet.slice(0, 40);
                const now = Date.now();
                try {
                    for (const [key, ts] of recentSigs) {
                        if (now - ts > 60000) recentSigs.delete(key);
                    }
                } catch { /* ignore */ }
                if (!recentSigs.has(sig)) {
                    recentSigs.set(sig, now);
                    hub.post({
                        id: `sy_ext_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                        mode: "card",
                        source: "日程与任务",
                        category: "external-reminder",
                        title: "日程提醒已由罗盘统一收拢",
                        message: snippet,
                        level: "info",
                        createdAt: Date.now(),
                        repeatCount: 1,
                        read: false,
                        actions: [
                            {
                                label: "查看罗盘",
                                primary: true,
                                onClick: () => getLaunchpadHub().open(),
                                dismissAfterClick: true,
                            }
                        ]
                    });
                }
            }
            const closeBtn = el.querySelector<HTMLElement>('.tm-calendar-reminder-close, [data-tm-semantic-action="close"], [data-tm-penalty-action="close"], .tm-semantic-date-confirm-close');
            if (closeBtn && typeof closeBtn.click === "function") {
                setTimeout(() => { try { closeBtn.click(); } catch { /* ignore */ } }, 60);
            } else {
                el.style.setProperty("display", "none", "important");
                el.style.setProperty("pointer-events", "none", "important");
            }
        } catch { /* ignore */ }
    };

    const sweepExternalReminderEls = () => {
        try {
            if (typeof document === "undefined" || document.hidden) return;
            const body = document.body;
            if (!body || typeof body.querySelectorAll !== "function") return;
            const hasPotentialModal = typeof body.querySelector === "function"
                ? Boolean(body.querySelector(
                    ".b3-dialog--open, .tm-remind-modal, .tm-semantic-date-confirm-modal, .tm-calendar-reminder-toast, .tm-prompt-modal, [data-tm-semantic-summary]"
                ))
                : true;
            if (!hasPotentialModal) return;

            const structural = body.querySelectorAll<HTMLElement>(
                ".tm-remind-modal, .tm-semantic-date-confirm-modal, .tm-calendar-reminder-toast, .tm-prompt-modal, [data-tm-semantic-summary]",
            );
            structural.forEach((el) => {
                if (processedEls.has(el) || isOwnSurface(el) || isInteracting(el)) return;

                if (el.classList?.contains?.("tm-prompt-modal")) {
                    const t = el.textContent || "";
                    if (!(t.includes("个提醒") && t.includes("稍后处理"))) return;
                }
                collapseExternalReminderEl(el);
            });

            const looksLikeReminderHost = (classId: string): boolean =>
                classId.includes("tm-") || classId.includes("task-horizon") ||
                /remind|notif|alert|popup|dialog|modal/i.test(classId);
            const candidates: HTMLElement[] = [];
            const children = body.children;
            for (let i = 0; i < children.length; i++) {
                const el = children[i] as HTMLElement;
                if (!el || el.nodeType !== 1) continue;
                const classId = `${el.className || ""} ${el.id || ""}`;
                if (!looksLikeReminderHost(classId)) continue;
                candidates.push(el);
                const grand = el.children;
                for (let j = 0; j < grand.length; j++) {
                    const g = grand[j] as HTMLElement;
                    if (!g || g.nodeType !== 1) continue;
                    const gc = `${g.className || ""} ${g.id || ""}`;
                    if (looksLikeReminderHost(gc)) candidates.push(g);
                }
            }
            for (const el of candidates) {
                if (processedEls.has(el) || isOwnSurface(el) || isInteracting(el)) continue;
                const text = el.textContent || "";
                if (!(text.includes("个提醒") && text.includes("稍后处理"))) continue;
                if (text.includes("小驴全家桶") || text.includes("小驴罗盘") || text.includes("小驴通知中心")) continue;
                collapseExternalReminderEl(el);
            }
        } catch { /* ignore */ }
    };

    const scheduleSweep = (delayMs: number) => {
        if (holder.sweepStopped) return;
        try {
            holder.sweepTimer = setTimeout(() => {
                holder.sweepTimer = null;
                if (holder.sweepStopped) return;
                if (typeof document === "undefined" || !document.hidden) {
                    sweepExternalReminderEls();
                }
                scheduleSweep(10000);
            }, delayMs);
        } catch { /* ignore */ }
    };

    if (!holder.obs) {

        scheduleSweep(1200);
        holder.obs = new MutationObserver((muts) => {
            if (typeof document !== "undefined" && document.hidden) return;
            for (const m of muts) {
                m.addedNodes?.forEach?.((n) => {
                    const el = n as HTMLElement;
                    if (!el || typeof el.querySelector !== "function") return;
                    if (processedEls.has(el) || isOwnSurface(el) || isInteracting(el)) return;
                    const classId = `${el.className || ""} ${el.id || ""}`;
                    const mayBeModal = el.classList?.contains?.("b3-dialog--open")
                        || el.classList?.contains?.("tm-remind-modal")
                        || el.classList?.contains?.("tm-semantic-date-confirm-modal")
                        || classId.includes("tm-")
                        || classId.includes("task-horizon")
                        || /remind|notif|alert|popup|dialog|modal/i.test(classId);
                    if (!mayBeModal) return;
                    const txt = el.textContent || "";
                    if (txt.includes("小驴全家桶") || txt.includes("小驴罗盘") || txt.includes("小驴通知中心")) return;
                    const isExternalModal = Boolean(
                        el.querySelector?.(".tm-semantic-date-confirm-box, [data-tm-semantic-summary]") ||
                        el.classList?.contains?.("tm-remind-modal") ||
                        el.classList?.contains?.("tm-semantic-date-confirm-modal") ||
                        (txt.includes("个提醒") && txt.includes("稍后处理"))
                    );
                    if (isExternalModal) {
                        collapseExternalReminderEl(el);
                    }
                });
            }
        });
        try {
            holder.obs.observe(document.body, { childList: true, subtree: false });
        } catch { /* ignore */ }
    }

    return () => {
        holder.refCount--;
        if (holder.refCount <= 0 && holder.obs) {
            try { holder.obs.disconnect(); } catch { /* ignore */ }
            holder.obs = null;
            holder.sweepStopped = true;
            if (holder.sweepTimer !== null) {
                try { clearTimeout(holder.sweepTimer); } catch { /* ignore */ }
                holder.sweepTimer = null;
            }
            delete win.__LV_MODAL_HARMONIZER__;
        }
    };
}

function escapeHtml(str: string): string {

    str = String(str ?? "");
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
                if (packet.category && isCategorySnoozedImpl(packet.category)) {
                    return;
                }

                if (packet.level === "error") {
                    pushDiagError({
                        source: packet.source || "unknown",
                        message: `${packet.title ? `${packet.title}：` : ""}${packet.message || ""}`.trim(),
                    });
                }
                const shouldArchive = packet.archive !== false || packet.level === "warn" || packet.level === "error";
                if (!shouldArchive) return;
                recordIntoHistory(nodeHistoryList, packet);
                saveTodayNoticeHistory(nodeHistoryList);
            },
            dismiss() {},
            snooze(id: string, durationMs: number) {

                const item = nodeHistoryList.find((p) => p.id === id);
                if (item?.category && Number.isFinite(durationMs) && durationMs > 0) {
                    snoozeCategoryImpl(item.category, durationMs);
                }
            },
            muteToday(category: string) { muteCategoryTodayImpl(category); },
            snoozeCategory(category: string, durationMs: number) { snoozeCategoryImpl(category, durationMs); },
            isCategorySnoozed(category: string) { return isCategorySnoozedImpl(category); },
            clearCategorySnooze(category: string) { clearCategorySnoozeImpl(category); },
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

    installDiagErrorCapture();

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

        window.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.isComposing || e.keyCode === 229) return;
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
                    (e as any).stopImmediatePropagation?.();
                    if (handled !== "keep") {
                        const curIdx = stack.indexOf(item);
                        if (curIdx >= 0) stack.splice(curIdx, 1);
                    }
                    break;
                }
            }
        }, true);
    }
    return window.__LV_SURFACE_STACK__;
}

export const lvSurfaceStack = {
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

    let migratedSubs: Array<[string, LvTickerSubscription]> = [];
    let migratedDateCross: Array<[string, (todayKey: string) => void]> = [];
    if (window.__LV_TICKER__) {
        const oldTicker = window.__LV_TICKER__ as LvTickerHub & {
            _snapshot?: () => { subs: Array<[string, LvTickerSubscription]>; dateCross: Array<[string, (todayKey: string) => void]> };
        };
        try {
            const snap = oldTicker._snapshot?.();
            if (snap) {
                migratedSubs = snap.subs;
                migratedDateCross = snap.dateCross;
            }
        } catch { /* ignore */ }
        try { oldTicker.destroy(); } catch { /* ignore */ }
    }

    const subscribers = new Map<string, LvTickerSubscription>(migratedSubs);
    const dateCrossSubscribers = new Map<string, (todayKey: string) => void>(migratedDateCross);
    let lastDateKey = getTodayKey();
    let timerId: number | null = null;
    let baseIntervalMs = 10000; // 前台默认 10 秒微节拍

    function tick() {
        const now = new Date();
        const today = getTodayKey(now);

        if (today !== lastDateKey) {
            lastDateKey = today;
            dateCrossSubscribers.forEach((cb) => {
                try { cb(today); } catch (e) { console.error("[LvTicker] DateCross error:", e); }
            });
        }

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

    const tickerHub: LvTickerHub & {
        _snapshot?: () => { subs: Array<[string, LvTickerSubscription]>; dateCross: Array<[string, (todayKey: string) => void]> };
        _removeSub?: (id: string) => void;
        _removeDateCross?: (id: string) => void;
    } = {
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
                const active = (typeof window !== "undefined" ? (window.__LV_TICKER__ as any) : null);
                if (active && typeof active._removeSub === "function") {
                    active._removeSub(id);
                } else {
                    subscribers.delete(id);
                    if (subscribers.size === 0 && dateCrossSubscribers.size === 0) {
                        this.destroy();
                    }
                }
            };
        },

        onDateCross(plugin: string, cb: (todayKey: string) => void): () => void {
            const id = `dc_${plugin}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            dateCrossSubscribers.set(id, cb);
            return () => {
                const active = (typeof window !== "undefined" ? (window.__LV_TICKER__ as any) : null);
                if (active && typeof active._removeDateCross === "function") {
                    active._removeDateCross(id);
                } else {
                    dateCrossSubscribers.delete(id);
                    if (subscribers.size === 0 && dateCrossSubscribers.size === 0) {
                        this.destroy();
                    }
                }
            };
        },

        _snapshot() {
            return {
                subs: Array.from(subscribers.entries()),
                dateCross: Array.from(dateCrossSubscribers.entries()),
            };
        },
        _removeSub(id: string) {
            subscribers.delete(id);
            if (subscribers.size === 0 && dateCrossSubscribers.size === 0) {
                this.destroy();
            }
        },
        _removeDateCross(id: string) {
            dateCrossSubscribers.delete(id);
            if (subscribers.size === 0 && dateCrossSubscribers.size === 0) {
                this.destroy();
            }
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
    subscribe(pluginName: string, intervalMs: number, callback: (now: Date) => void): () => void {
        const hub = getTicker(pluginName);
        return hub.subscribe(pluginName, intervalMs, callback);
    },

    onMinute(pluginName: string, callback: (now: Date) => void): () => void {
        return this.subscribe(pluginName, 60000, callback);
    },

    onHour(pluginName: string, callback: (now: Date) => void): () => void {
        return this.subscribe(pluginName, 3600000, callback);
    },

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

        finish();
        throw error;
    } finally { if (timer !== undefined) clearTimeout(timer); }
    const taskPromise = Promise.resolve().then(task);

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
    setFocusUntil(ts: number): void {
        setNotifyFocusUntil(ts);
    },

    clearFocus(): void {
        clearNotifyFocus();
    },

    isFocusActive(): boolean {
        return isNotifyFocusActive();
    },

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

    undo(options: { source?: string; message: string; undoLabel?: string; duration?: number; onUndo: () => void | Promise<void> }): string {
        let undoFired = false; let capsuleId = "";
        capsuleId = this.capsule({
            source: options.source || "撤销", message: options.message, duration: options.duration ?? 5000, archive: false,
            action: { label: options.undoLabel || "撤销", onClick: async () => { if (undoFired) return; undoFired = true; try { if (capsuleId) lvNotify.dismiss(capsuleId); } catch {} await options.onUndo(); } },
        });
        return capsuleId;
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

    snoozeCategory(category: string, durationMs: number): void {
        snoozeCategoryImpl(category, durationMs);
        const hub = getHub();
        if (typeof (hub as any).snoozeCategory === "function") {
            (hub as any).snoozeCategory(category, durationMs);
        }
    },

    isCategorySnoozed(category: string): boolean {
        return isCategorySnoozedImpl(category);
    },

    clearCategorySnooze(category: string): void {
        clearCategorySnoozeImpl(category);
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

    syncMuteFromDisk(): Promise<void> {
        return syncMuteUntilFromDisk();
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

    getHistory(): LvNoticePacket[] {
        if (typeof window !== "undefined" && typeof document !== "undefined") {
            const existingHub = window.__LV_NOTICE_HUB__;
            if (existingHub) return existingHub.getHistory?.() ?? [];
            return loadTodayNoticeHistory();
        }
        const hub = getHub();
        return hub.getHistory?.() ?? [];
    },

    clearHistory(): void {
        const hub = getHub();
        hub.clearHistory?.();
    },

    markAllRead(): void {
        const hub = getHub();
        hub.markAllRead?.();
    },

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
const SHARED_SECRET_SLOT = "lv_ai_secret_tier2_apikey";
let inMemorySharedApiKey = "";
let sharedSecretQueue: Promise<unknown> = Promise.resolve();
let pendingLegacySharedMigration: { key: string; promise: Promise<{ ok: boolean; reason?: string }> } | null = null;

function hasPersistedSharedSecretInHost(): boolean {
    try {
        const w = typeof window !== "undefined" ? (window as any) : (typeof globalThis !== "undefined" ? (globalThis as any) : null);
        const pluginReader = w?.__LV_SECRET_PLUGIN__ || w?.__LV_HOST_API__?.plugin;
        if (pluginReader && typeof pluginReader.getSecret === "function") {
            const k = String(pluginReader.getSecret(SHARED_SECRET_SLOT) || "").trim();
            if (k.length > 3) return true;
        }
        const items = w?.siyuan?.config?.secrets?.items;
        if (Array.isArray(items)) {
            const hit = items.find((it: any) => it && (it.name === SHARED_SECRET_SLOT || it.key === SHARED_SECRET_SLOT));
            if (hit && typeof hit.value === "string" && hit.value.trim().length > 3) return true;
        }
    } catch { /* ignore */ }
    return false;
}

export async function waitForLegacySharedSecretMigration(): Promise<void> {
    if (pendingLegacySharedMigration) {
        try {
            await pendingLegacySharedMigration.promise;
        } catch { /* ignore */ }
    }
}

function scheduleLegacySharedSecretMigration(legacyKey: string): void {
    if (!legacyKey) return;
    if (pendingLegacySharedMigration && pendingLegacySharedMigration.key === legacyKey) {
        return;
    }
    const promise = persistSecretToSiyuanSlot(legacyKey).then((res) => {
        if (res.ok) {
            try {
                if (typeof localStorage !== "undefined") {
                    const latestRaw = localStorage.getItem(AI_STORAGE_KEY);
                    if (latestRaw) {
                        const latestParsed = JSON.parse(latestRaw);
                        if (latestParsed && typeof latestParsed === "object") {
                            const latestLegacy = typeof latestParsed.apiKey === "string" ? latestParsed.apiKey.trim() : "";
                            if (latestLegacy === legacyKey) {
                                const { apiKey: _stripped, ...rest } = latestParsed;
                                const cleaned: LvAiConfig = { ...rest, hasSecret: true, secretSlot: SHARED_SECRET_SLOT };
                                localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(cleaned));
                            }
                        }
                    }
                }
            } catch { /* ignore */ }
        }
        return res;
    }).finally(() => {
        if (pendingLegacySharedMigration?.promise === promise) {
            pendingLegacySharedMigration = null;
        }
    });
    pendingLegacySharedMigration = { key: legacyKey, promise };
}

function resolveSharedSecretFromHost(source?: string): string {
    if (source && !isLvPluginSharedKeyAllowed(source)) return "";
    if (inMemorySharedApiKey && inMemorySharedApiKey.trim()) return inMemorySharedApiKey.trim();
    try {
        const w = typeof window !== "undefined" ? (window as any) : (typeof globalThis !== "undefined" ? (globalThis as any) : null);
        if (typeof w?.resolveTier2ApiKey === "function") {
            const k = String(w.resolveTier2ApiKey() || "").trim();
            if (k) return k;
        }
        const pluginReader = w?.__LV_SECRET_PLUGIN__ || w?.__LV_HOST_API__?.plugin;
        if (pluginReader && typeof pluginReader.getSecret === "function") {
            const k = String(pluginReader.getSecret(SHARED_SECRET_SLOT) || "").trim();
            if (k) return k;
        }
        const items = w?.siyuan?.config?.secrets?.items;
        if (Array.isArray(items)) {
            const hit = items.find((it: any) => it && (it.name === SHARED_SECRET_SLOT || it.key === SHARED_SECRET_SLOT));
            if (hit && typeof hit.value === "string" && hit.value.trim()) return hit.value.trim();
        }
    } catch { /* ignore */ }
    return "";
}

function persistSecretToSiyuanSlot(val: string): Promise<{ ok: boolean; reason?: string }> {
    const trimmed = val.trim();
    inMemorySharedApiKey = trimmed;
    const w = typeof window !== "undefined" ? (window as any) : null;
    if (w && typeof w.saveTier2SecretToHost === "function") {
        return w.saveTier2SecretToHost(trimmed);
    }
    if (typeof fetch !== "function" || w?.siyuan?.isReadOnly === true || w?.isReadOnly === true || w?.isAdmin === false) {
        return Promise.resolve({ ok: false, reason: "readonly_or_no_fetch" });
    }
    const task = sharedSecretQueue.catch(() => {}).then(async () => {
        try {
            const existingItems: Array<{ name: string; value: string; allowedHosts?: string[] | null }> = Array.isArray(w?.siyuan?.config?.secrets?.items)
                ? w.siyuan.config.secrets.items.filter(Boolean).map((it: any) => ({
                    name: it.name || it.key || "",
                    value: String(it.value ?? ""),
                    allowedHosts: it.allowedHosts ?? null,
                }))
                : [];
            const idx = existingItems.findIndex((it) => it.name === SHARED_SECRET_SLOT);
            const nextEntry = { name: SHARED_SECRET_SLOT, value: trimmed, allowedHosts: idx >= 0 ? existingItems[idx]?.allowedHosts ?? null : null };
            if (idx >= 0) existingItems[idx] = nextEntry;
            else existingItems.push(nextEntry);
            const resp = await fetch("/api/setting/setSecrets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: existingItems }),
            });
            if (!resp.ok) return { ok: false, reason: `http_${resp.status}` };
            const json = await resp.json().catch((): any => null);
            if (json && typeof json.code === "number" && json.code !== 0) {
                return { ok: false, reason: json.msg || `code_${json.code}` };
            }
            if (w?.siyuan?.config) {
                if (!w.siyuan.config.secrets) w.siyuan.config.secrets = { items: [] };
                w.siyuan.config.secrets.items = Array.isArray(json?.data?.items) ? json.data.items : existingItems;
            }
            return { ok: true };
        } catch (err: any) {
            return { ok: false, reason: err?.message || "setSecrets_failed" };
        }
    });
    sharedSecretQueue = task;
    return task;
}

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

    function readRouterUserCustomFallback(): LvAiConfig | null {
        try {
            if (typeof localStorage === "undefined") return null;
            const routerRaw = localStorage.getItem("lv_ai_router_config_v1");
            if (!routerRaw) return null;
            const parsed = JSON.parse(routerRaw);
            const uc = parsed?.userCustom;
            if (!uc || typeof uc !== "object") return null;
            const ep = typeof uc.baseUrl === "string" ? uc.baseUrl.trim() : "";
            const mdl = typeof uc.model === "string" ? uc.model.trim() : "";
            const hasSec = hasPersistedSharedSecretInHost() || uc.hasSecret === true;
            if (!ep && !mdl && !hasSec) return null;
            return {
                endpoint: ep,
                model: mdl,
                hasSecret: hasSec,
                secretSlot: SHARED_SECRET_SLOT,
            };
        } catch {
            return null;
        }
    }

    async function executeChatRequest(cfg: LvAiConfig | null, opts: LvAiRequestOptions): Promise<LvAiResponse> {
        const routerFallback = (!cfg?.endpoint || !cfg?.model) ? readRouterUserCustomFallback() : null;
        const rawEndpoint = opts.endpoint || cfg?.endpoint || routerFallback?.endpoint || "https://api.deepseek.com/v1";
        assertLvAiChannelAllowed({
            source: opts.source, channel: "user_custom", endpoint: rawEndpoint,
            usesSharedKey: !(opts.apiKey && opts.apiKey.trim()) && !(cfg?.apiKey && cfg.apiKey.trim()),
            expectedOrigin: (opts as LvAiRequestOptions & { expectedOrigin?: string }).expectedOrigin,
        });
        const apiKey = opts.apiKey || resolveSharedSecretFromHost(opts.source) || cfg?.apiKey;
        if (!apiKey) throw new Error("[LvAiGateway] 未配置共享 API Key（请在任意小驴插件设置中配置）");
        const endpoint = rawEndpoint.replace(/\/+$/, "");
        const targetUrl = endpoint.endsWith("/chat/completions") ? endpoint : `${endpoint}/chat/completions`;
        const model = opts.model || cfg?.model || routerFallback?.model || "deepseek-chat";
        const aiChunk = await loadLvKitChunk("lv-kit-ai-hub");
        return await aiChunk.executeAiChatRequest({ targetUrl, apiKey, model, messages: opts.messages, temperature: opts.temperature ?? cfg?.temperature ?? 0.7, maxTokens: cfg?.maxTokens, maxRetries: opts.maxRetries, signal: opts.signal });
    }

    const aiHub: LvAiGatewayHub = {
        version: PROTOCOL_VERSION,
        setConfig(cfg: LvAiConfig) {
            try {
                const rawKey = typeof cfg?.apiKey === "string" ? cfg.apiKey.trim() : "";
                let existingLegacyKey = "";
                if (!rawKey && typeof localStorage !== "undefined") {
                    try {
                        const prevRaw = localStorage.getItem(AI_STORAGE_KEY);
                        if (prevRaw) {
                            const prevParsed = JSON.parse(prevRaw);
                            if (prevParsed && typeof prevParsed === "object" && typeof prevParsed.apiKey === "string") {
                                existingLegacyKey = prevParsed.apiKey.trim();
                            }
                        }
                    } catch { /* ignore */ }
                }
                if (rawKey) {
                    inMemorySharedApiKey = rawKey;
                    const p = persistSecretToSiyuanSlot(rawKey).then((res) => {
                        if (res.ok) {
                            try {
                                if (typeof localStorage !== "undefined") {
                                    const curRaw = localStorage.getItem(AI_STORAGE_KEY);
                                    const curObj = curRaw ? JSON.parse(curRaw) : {};
                                    if (curObj && typeof curObj === "object") {
                                        const { apiKey: _s, ...restCur } = curObj;
                                        localStorage.setItem(AI_STORAGE_KEY, JSON.stringify({
                                            ...restCur,
                                            hasSecret: true,
                                            secretSlot: SHARED_SECRET_SLOT,
                                        }));
                                    }
                                }
                            } catch { /* ignore */ }
                        }
                        return res;
                    });
                    pendingLegacySharedMigration = { key: rawKey, promise: p };
                    void p.finally(() => {
                        if (pendingLegacySharedMigration?.promise === p) {
                            pendingLegacySharedMigration = null;
                        }
                    });
                }
                const { apiKey: _stripped, ...rest } = cfg || ({} as LvAiConfig);
                const persistedInHost = hasPersistedSharedSecretInHost();
                const sanitized: LvAiConfig = {
                    ...rest,

                    ...(!rawKey && existingLegacyKey ? { apiKey: existingLegacyKey } : {}),
                    hasSecret: persistedInHost,
                    secretSlot: SHARED_SECRET_SLOT,
                };
                if (typeof localStorage !== "undefined") {
                    localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(sanitized));
                }
                if (!rawKey && existingLegacyKey) {
                    inMemorySharedApiKey = existingLegacyKey;
                    scheduleLegacySharedSecretMigration(existingLegacyKey);
                }
            } catch { /* storage fallback */ }
        },
        getConfig(): LvAiConfig | null {
            try {
                if (typeof localStorage !== "undefined") {
                    const raw = localStorage.getItem(AI_STORAGE_KEY);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (parsed && typeof parsed === "object") {
                            const legacyKey = typeof parsed.apiKey === "string" ? parsed.apiKey.trim() : "";
                            if (legacyKey) {
                                inMemorySharedApiKey = legacyKey;

                                scheduleLegacySharedSecretMigration(legacyKey);
                                const { apiKey: _omitPlaintext, ...rest } = parsed;
                                return {
                                    ...rest,
                                    hasSecret: hasPersistedSharedSecretInHost(),
                                    secretSlot: SHARED_SECRET_SLOT,
                                } as LvAiConfig;
                            }
                            if (!parsed.endpoint || !parsed.model) {
                                const fb = readRouterUserCustomFallback();
                                if (fb) {
                                    return {
                                        ...parsed,
                                        endpoint: parsed.endpoint || fb.endpoint,
                                        model: parsed.model || fb.model,
                                    } as LvAiConfig;
                                }
                            }
                            return parsed as LvAiConfig;
                        }
                    }
                }
            } catch { /* fallback */ }
            return readRouterUserCustomFallback();
        },
        chat(opts: LvAiRequestOptions): Promise<LvAiResponse> {
            try {
                const cfgForGate = this.getConfig();
                const rawEpForGate = opts.endpoint || cfgForGate?.endpoint || readRouterUserCustomFallback()?.endpoint || "https://api.deepseek.com/v1";
                assertLvAiChannelAllowed({
                    source: opts.source, channel: "user_custom", endpoint: rawEpForGate,
                    usesSharedKey: !(opts.apiKey && opts.apiKey.trim()) && !(cfgForGate?.apiKey && cfgForGate.apiKey.trim()),
                    expectedOrigin: (opts as LvAiRequestOptions & { expectedOrigin?: string }).expectedOrigin,
                });
            } catch (err) {
                return Promise.reject(err);
            }
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
                    let onRaceAbort: (() => void) | null = null;
                    try {
                        const raceAbort = opts.signal ? new Promise<never>((_, rej) => {
                            if (opts.signal!.aborted) {
                                rej(new DOMException("The operation was aborted", "AbortError"));
                                return;
                            }
                            onRaceAbort = () => rej(new DOMException("The operation was aborted", "AbortError"));
                            opts.signal!.addEventListener("abort", onRaceAbort, { once: true });
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
                    } finally {
                        if (opts.signal && onRaceAbort) {
                            opts.signal.removeEventListener("abort", onRaceAbort);
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
    setConfig(config: LvAiConfig): void {
        getAiHub().setConfig(config);
    },
    getConfig(): LvAiConfig | null {
        return getAiHub().getConfig();
    },
    chat(options: LvAiRequestOptions): Promise<LvAiResponse> {
        return getAiHub().chat(options);
    },
    waitForLegacyMigration(): Promise<void> {
        return waitForLegacySharedSecretMigration();
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
        const wAct = window as unknown as { __LV_ACTIVITY_TICKER_OFF__?: (() => void) | null };
        try { wAct.__LV_ACTIVITY_TICKER_OFF__?.(); } catch { /* ignore */ }
        wAct.__LV_ACTIVITY_TICKER_OFF__ = lvTicker.onDateCross("lv-activity", (newDay) => {
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

        const safeTitle = String(r.title ?? "").replace(/[\r\n]+/g, " ").trim();
        const safeDetail = String(r.detail ?? "").replace(/[\r\n]+/g, " ").trim();
        lines.push(`- **${r.timeStr}** [${r.source}] ${icon} ${safeTitle}${safeDetail ? ` — *${safeDetail}*` : ""}${link}`);
    });

    return lines.join("\n");
}

export const lvActivity = {
    record(item: Omit<LvActivityRecord, "id" | "timestamp" | "timeStr">): void { if (!getLvEcosystemToggles().activityLog) return; getActivityHub().record(item); },
    getTodayRecords(): LvActivityRecord[] {
        return getActivityHub().getTodayRecords();
    },
    onActivity(callback: (item: LvActivityRecord) => void): () => void {
        return getActivityHub().onActivity(callback);
    },
    formatAsMarkdown(): string {
        return getActivityHub().formatAsMarkdown();
    },
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
            return await (await loadLvKitChunk("lv-kit-compass")).exportBackupFull(registry, options);
        },
        async restoreFull(bundle: LvEcosystemFullBackup): Promise<{ success: string[]; failed: string[] }> {
            return await (await loadLvKitChunk("lv-kit-compass")).restoreBackupFull(registry, bundle);
        }
    };

    if (typeof window !== "undefined") window.__LV_BACKUP_HUB__ = hub;
    return hub;
}

export const lvBackup = {
    register(
        pluginName: string,
        backupFn: () => Promise<Record<string, unknown>>,
        restoreFn: (data: Record<string, unknown>) => Promise<boolean>
    ): () => void {
        return getBackupHub().register(pluginName, backupFn, restoreFn);
    },

    exportFull(options?: { timeoutMs?: number }): Promise<LvEcosystemFullBackup> {
        return getBackupHub().exportFull(options);
    },

    restoreFull(bundle: LvEcosystemFullBackup): Promise<{ success: string[]; failed: string[] }> {
        return getBackupHub().restoreFull(bundle);
    }
};

/* ========================================================================= */
/* ========================================================================= */
/* 12b. 诊断环形缓冲与一键诊断报告（用户 bug 分诊数据源，Protocol v1.8.6）      */
/* ========================================================================= */

export interface LvDiagErrorEntry {
    ts: number;
    source: string;
    message: string;
    stack?: string;
    count: number;
}

const DIAG_ERROR_RING_KEY = "lv_diag_error_ring_v1";
const DIAG_ERROR_RING_MAX = 50;
const DIAG_ERROR_MSG_MAX = 300;
const DIAG_ERROR_STACK_MAX = 600;

export const LV_FEEDBACK_QQ_GROUP = "871707735";
export const LV_FEEDBACK_EMAIL = "68298100@qq.com";

export const LV_SPONSOR_CARD_IMAGE = "";
export function openSponsorModal(): void { runWithCompassChunk((c) => c.openSponsorModal()); }

export function openJoinQqGroup(): void {
    const groupNum = LV_FEEDBACK_QQ_GROUP; // "871707735"

    try {
        const nav = (typeof navigator !== "undefined" ? navigator : null) || (typeof window !== "undefined" ? (window as any).navigator : null);
        if (nav && nav.clipboard && typeof nav.clipboard.writeText === "function") {
            nav.clipboard.writeText(groupNum).catch(() => {});
        }
    } catch { /* 旁路 */ }

    const qqProtocolUrl = `tencent://groupwpa/?subcmd=all&param=7B2267726F757055696E223A3837313730373733352C2274696D655374616D70223A313533353435333830307D`;
    const qqWebUrl = `https://qm.qq.com/cgi-bin/qm/qr?k=1&jump_from=webapi&authKey=1&group_code=${groupNum}`;

    let launched = false;
    try {
        let electron = safeRequire<any>("electron");
        if (!electron && typeof window !== "undefined" && (window as any).require) {
            try { electron = (window as any).require("electron"); } catch { /* ignore */ }
        }
        const shell = electron?.shell || ((window as any)?.require ? (window as any).require("electron")?.shell : null);
        if (shell && typeof shell.openExternal === "function") {
            shell.openExternal(qqProtocolUrl).catch(() => {
                shell.openExternal(qqWebUrl).catch(() => {});
            });
            launched = true;
        }
    } catch { /* ignore */ }

    if (!launched && typeof window !== "undefined") {
        try {
            const ifr = document.createElement("iframe");
            ifr.style.display = "none";
            ifr.src = qqProtocolUrl;
            document.body.appendChild(ifr);
            setTimeout(() => { try { ifr.remove(); } catch { /* ignore */ } }, 2000);
        } catch {
            try { window.open(qqProtocolUrl, "_blank"); } catch { /* ignore */ }
        }
    }

    lvNotify.capsule({
        source: "小驴罗盘",
        message: `✓ 已复制 QQ 群号 ${groupNum}，正在呼起 QQ 客户端申请加群…`,
        duration: 3500,
        level: "success",
        archive: false,
    });
}

function loadDiagRing(): LvDiagErrorEntry[] {
    if (typeof localStorage === "undefined") return [];
    try {
        const raw = localStorage.getItem(DIAG_ERROR_RING_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr.filter((e) => e && typeof e.message === "string").slice(-DIAG_ERROR_RING_MAX) : [];
    } catch {
        return [];
    }
}

function saveDiagRing(entries: LvDiagErrorEntry[]): void {
    if (typeof localStorage === "undefined") return;
    try {
        localStorage.setItem(DIAG_ERROR_RING_KEY, JSON.stringify(entries.slice(-DIAG_ERROR_RING_MAX)));
    } catch { /* 容量满或隐私模式：诊断永不影响主流程 */ }
}

function summarizeDiagStack(stack?: string): string | undefined {
    if (!stack) return undefined;
    try {
        const lines = String(stack).split("\n").slice(0, 3).join("\n");
        return lines.length > DIAG_ERROR_STACK_MAX ? `${lines.slice(0, DIAG_ERROR_STACK_MAX)}…` : lines;
    } catch {
        return undefined;
    }
}

export function pushDiagError(entry: { source: string; message: string; stack?: string }): void {
    try {
        const msg = String(entry.message || "").trim().slice(0, DIAG_ERROR_MSG_MAX);
        if (!msg) return;
        const ring = loadDiagRing();
        const last = ring[ring.length - 1];
        if (last && last.source === entry.source && last.message === msg) {
            last.count += 1;
            last.ts = Date.now();
        } else {
            ring.push({ ts: Date.now(), source: String(entry.source || "unknown").slice(0, 60), message: msg, stack: summarizeDiagStack(entry.stack), count: 1 });
        }
        saveDiagRing(ring);
    } catch { /* 诊断路径永不抛错，避免二次错误风暴 */ }
}

export function getRecentDiagErrors(): LvDiagErrorEntry[] {
    return loadDiagRing();
}

export function clearRecentDiagErrors(): void {
    if (typeof localStorage === "undefined") return;
    try {
        localStorage.removeItem(DIAG_ERROR_RING_KEY);
    } catch { /* ignore */ }
}

let diagCaptureInstalled = false;

function installDiagErrorCapture(): void {
    if (diagCaptureInstalled || typeof window === "undefined") return;
    try {
        const w = window as unknown as { __LV_DIAG_CAPTURE__?: boolean };
        if (w.__LV_DIAG_CAPTURE__) {
            diagCaptureInstalled = true;
            return;
        }
        w.__LV_DIAG_CAPTURE__ = true;
        window.addEventListener("error", (ev) => {
            try {
                const err = ev.error as Error | undefined;
                pushDiagError({
                    source: "window.error",
                    message: err?.message || ev.message || "未知脚本错误",
                    stack: err?.stack,
                });
            } catch { /* ignore */ }
        });
        window.addEventListener("unhandledrejection", (ev) => {
            try {
                const reason = (ev as PromiseRejectionEvent).reason;
                pushDiagError({
                    source: "unhandledrejection",
                    message: typeof reason === "string" ? reason : (reason as Error)?.message || String(reason ?? "未知 Promise 拒绝"),
                    stack: (reason as Error)?.stack,
                });
            } catch { /* ignore */ }
        });
        diagCaptureInstalled = true;
    } catch {
        diagCaptureInstalled = false;
    }
}

/* 13. 全生态健康自省与指示器 (Lv Ecosystem Diagnostics)                       */
/* ========================================================================= */

export const lvEcosystem = {
    getDiagnostics(): LvEcosystemDiagnostics {
        const noticeHub = typeof window !== "undefined" ? window.__LV_NOTICE_HUB__ : undefined;
        const aiHub = typeof window !== "undefined" ? window.__LV_AI_GATEWAY__ : undefined;
        const aiCfg = aiHub?.getConfig();
        const activities = typeof window !== "undefined" ? window.__LV_ACTIVITY_STREAM__?.getTodayRecords() ?? [] : [];
        const registered = getBackupHub().getRegisteredPlugins?.() ?? [];
        return { version: PROTOCOL_VERSION, coordinatorHost: noticeHub?.hostPlugin ?? "none", registeredPlugins: registered, todayActivitiesCount: activities.length, hasSharedAiConfig: Boolean(aiCfg?.apiKey || aiCfg?.hasSecret || (typeof window !== "undefined" && (window as any).hasTier2SecretConfigured?.())), sharedAiModel: aiCfg?.model, recentErrorCount: getRecentDiagErrors().length };
    },
    getRecentErrors(): LvDiagErrorEntry[] { return getRecentDiagErrors(); },
    clearRecentErrors(): void { clearRecentDiagErrors(); },
    async buildDiagnosticReport(): Promise<string> { return await (await loadLvKitChunk("lv-kit-compass")).buildDiagnosticReport(); },
    getStatusBadgeText(): string { const d = this.getDiagnostics(); const c = d.registeredPlugins.length; return `🐴 小驴全家桶 · ${c > 0 ? `${c} 插件已联结` : "单机模式"} · 今日活动 ${d.todayActivitiesCount} 项`; },
    CANONICAL_HUB_NOTEBOOK_NAME: "🐴 小驴生态",
    isHubNotebook(name?: string): boolean { return Boolean(name && /^(🐴\s*)?小驴(生态|空间|笔记本)/.test(name.trim())); },
};
export const CANONICAL_HUB_NOTEBOOK_NAME = "🐴 小驴生态";
export function isXiaoLvHubNotebook(name?: string): boolean {
    return lvEcosystem.isHubNotebook(name);
}

/* ========================================================================= */
/* 13.5. 全生态对账、去重与同步冲突治理中枢 (Lv Deduplicator Engine)         */
/* ========================================================================= */

export interface LvConflictDocItem {
    id: string;
    box: string;
    hpath: string;
    title: string;
    updated: string;
    length?: number;
    childCount?: number;
    baseDocId?: string;
    baseDocTitle?: string;
    baseDocHPath?: string;
    baseDocLength?: number;
    baseDocUpdated?: string;
}

export interface LvDuplicateDocEntry {
    id: string;
    box: string;
    hpath: string;
    updated: string;
    length: number;
    childCount?: number;
}

export interface LvDuplicateDocGroup {
    title: string;
    count: number;
    docs: LvDuplicateDocEntry[];
    recommendedKeepId: string;
    isBenign?: boolean;
    isContentDivergent?: boolean;
    divergenceReason?: string;
    isIgnored?: boolean;
    hasEmptyShell?: boolean;
    isSuspectedFork?: boolean;
}

export const RECONCILIATION_WHITELIST_KEY = "lv_reconciliation_whitelist_v1";

export function getReconciliationWhitelist(): Set<string> {
    try {
        const ls = getSafeLocalStorage();
        const raw = ls?.getItem(RECONCILIATION_WHITELIST_KEY);
        if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) return new Set(arr.map((s) => String(s).trim()).filter(Boolean));
        }
    } catch { /* ignore */ }
    return new Set();
}

export function saveReconciliationWhitelist(set: Set<string>): void {
    try {
        const ls = getSafeLocalStorage();
        ls?.setItem(RECONCILIATION_WHITELIST_KEY, JSON.stringify(Array.from(set)));
    } catch { /* ignore */ }
}

export function addReconciliationWhitelist(title: string): void {
    const trimmed = title.trim();
    if (!trimmed) return;
    const set = getReconciliationWhitelist();
    set.add(trimmed);
    saveReconciliationWhitelist(set);
}

export function removeReconciliationWhitelist(title: string): void {
    const trimmed = title.trim();
    const set = getReconciliationWhitelist();
    set.delete(trimmed);
    saveReconciliationWhitelist(set);
}

export function isReconciliationWhitelisted(title: string): boolean {
    return getReconciliationWhitelist().has(title.trim());
}

export interface LvOrphanDailyNoteEntry {
    id: string;
    box: string;
    boxName: string;
    hpath: string;
    date: string; // YYYY-MM-DD
    length: number;
    updated: string;
    mainDocId?: string;
    mainDocBox?: string;
    mainDocLength?: number;
    snippet: string;
    isEmpty: boolean;
    pendingBlocksCount?: number;
}

export interface LvDocDuplicateBlockGroup {
    content: string;
    type?: string;
    count: number;
    blockIds: string[];
}

export interface LvDuplicateClipDoc {
    id: string;
    title: string;
    box: string;
    hpath: string;
    updated: string;
}

export interface LvDuplicateClipGroup {
    url: string;
    count: number;
    docIds: string[];
    docs?: LvDuplicateClipDoc[];
}

export function formatSyTimestamp(ts?: string): string {
    if (!ts || ts.length < 8) return "";
    if (ts.length >= 14) {
        return `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)} ${ts.slice(8, 10)}:${ts.slice(10, 12)}`;
    }
    if (ts.length >= 8) {
        return `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}`;
    }
    return ts;
}

export function formatBlockType(type?: string): string {
    switch (type) {
        case "p": return "📝 段落";
        case "h": return "📑 标题";
        case "i": return "☑️ 列表项";
        case "c": return "💻 代码块";
        case "b": return "💬 引述块";
        default: return "🧱 内容块";
    }
}

export function isBenignHomonymTitle(title: string): boolean {
    const trimmed = title.trim();
    if (!trimmed) return true;

    if (/^(1[0-2]|0?[1-9])(月)?$/i.test(trimmed)) return true;
    if (/^\d{4}(年)?$/i.test(trimmed)) return true;
    if (/^Q[1-4]$/i.test(trimmed)) return true;
    if (/^第[一二三四五六七八九十0-9]+[章节部分篇卷讲课]$/i.test(trimmed)) return true;

    if (/^(未命名|未命名文档|Untitled|新建文档|新建笔记|首页|目录|概述|导言|学习闪卡|题库|知识点|笔记|临时)$/i.test(trimmed)) return true;
    return false;
}

/* ========================================================================= */
/* 10b. 双栏内容级 Diff 与 LCS 差异比对引擎                                   */
/* ========================================================================= */

export interface LvDocDiffResult { docA: any; docB: any; similarityPercent: number; diffLines: any[]; onlyA: string[]; onlyB: string[]; identicalCount: number; }
export function computeStringSimilarity(s1: string, s2: string): number { return getInitializedChunkSync("lv-kit-compass")?.computeStringSimilarity(s1, s2) ?? (s1 === s2 ? 1 : 0); }
export function computeInlineTokenDiff(a: string, b: string) { return getInitializedChunkSync("lv-kit-compass")?.computeInlineTokenDiff(a, b) ?? { htmlA: escapeHtml(a), htmlB: escapeHtml(b) }; }
export function computeBlockLevelLcsDiff(a: any[], b: any[]) { return getInitializedChunkSync("lv-kit-compass")?.computeBlockLevelLcsDiff(a, b) ?? { rows: [], onlyA: [], onlyB: [], identicalCount: 0, similarityPercent: 0 }; }
export const lvDeduplicator: any = new Proxy({}, {
    get(_t, prop: string) {
        if (prop === "generateAuditReportMarkdown") return (p: any) => getInitializedChunkSync("lv-kit-compass")?.lvDeduplicator?.generateAuditReportMarkdown?.(p) ?? "";
        return async (...args: any[]) => await (await loadLvKitChunk("lv-kit-compass")).lvDeduplicator[prop](...args);
    },
});
export interface LvAiJudgeDocInfo { id: string; title: string; box: string; boxName?: string; hpath: string; updated: string; length: number; snippet: string; }
export interface LvAiJudgeReport { channel: any; latencyMs?: number; fallbackTrace?: string; similarityPercent: number; category: any; categoryLabel: string; categoryBadgeColor: string; keyDifferences: string[]; recommendation: string; suggestedAction: any; suggestedRenameTitle?: string; rawMarkdown: string; }
export const lvAiJudge = {
    heuristicJudge(a: LvAiJudgeDocInfo, b: LvAiJudgeDocInfo): LvAiJudgeReport { return getInitializedChunkSync("lv-kit-ai-hub")?.lvAiJudge?.heuristicJudge(a, b) ?? { channel: "heuristic", similarityPercent: 50, category: "independent-topic", categoryLabel: "独立主题文档", categoryBadgeColor: "var(--b3-theme-success,#059669)", keyDifferences: [], recommendation: "", suggestedAction: "keep-both", rawMarkdown: "" }; },
    async judgeDocPair(a: LvAiJudgeDocInfo, b: LvAiJudgeDocInfo, opts?: { signal?: AbortSignal }) { return await (await loadLvKitChunk("lv-kit-ai-hub")).lvAiJudge.judgeDocPair(a, b, opts); },
    judgeConflictPair(c: LvConflictDocItem) { return getInitializedChunkSync("lv-kit-ai-hub")?.lvAiJudge?.judgeConflictPair(c) ?? { recommendation: "", suggestedAction: "manual-review", suggestedTitle: c.title, details: [] }; },
    judgeOrphanDailyNote(o: LvOrphanDailyNoteEntry) { return getInitializedChunkSync("lv-kit-ai-hub")?.lvAiJudge?.judgeOrphanDailyNote(o) ?? { recommendation: "", details: [], safeToMerge: true }; },
};

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
            if (p.isUnloaded || p.unloaded || p.disposing) continue;
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
                        actions: ["极速页签预览切换", "聚合工作区", "恢复最近关闭页签", "分屏"],
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
                cachedLaunchpadStatesRaw = raw;

                try {
                    const parsedStates = JSON.parse(raw);
                    cachedLaunchpadStatesParsed = (parsedStates && typeof parsedStates === "object" && !Array.isArray(parsedStates))
                        ? parsedStates
                        : null;
                } catch {
                    cachedLaunchpadStatesParsed = null;
                }
            }
            return { ...memoryLaunchpadStates, ...(cachedLaunchpadStatesParsed ?? {}) };
        }
        cachedLaunchpadStatesRaw = null;
        cachedLaunchpadStatesParsed = null;
    } catch { /* ignore */ }
    return { ...memoryLaunchpadStates };
}

const LAUNCHPAD_ORDER_STORAGE_KEY = "lv_launchpad_tile_order_v1";
let memoryLaunchpadTileOrder: string[] = [];

function getLaunchpadTileOrder(): string[] {
    const ls = getSafeLocalStorage();
    if (!ls) return [...memoryLaunchpadTileOrder];
    try {
        const raw = ls.getItem(LAUNCHPAD_ORDER_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                const clean = parsed.filter((x: unknown): x is string => typeof x === "string" && x.trim().length > 0);
                memoryLaunchpadTileOrder = clean;
                return [...clean];
            }
        }
    } catch { /* ignore */ }
    return [...memoryLaunchpadTileOrder];
}

function saveLaunchpadTileOrder(order: string[]): void {
    const clean: string[] = [];
    const seen = new Set<string>();
    for (const id of order) {
        if (typeof id === "string" && id.trim() && !seen.has(id)) {
            seen.add(id);
            clean.push(id);
        }
    }
    memoryLaunchpadTileOrder = clean;
    const ls = getSafeLocalStorage();
    if (!ls) return;
    try {
        ls.setItem(LAUNCHPAD_ORDER_STORAGE_KEY, JSON.stringify(clean));
    } catch { /* ignore */ }
}

function resetLaunchpadTileOrder(): void {
    memoryLaunchpadTileOrder = [];
    const ls = getSafeLocalStorage();
    if (!ls) return;
    try {
        ls.removeItem(LAUNCHPAD_ORDER_STORAGE_KEY);
    } catch { /* ignore */ }
}

function sortLaunchpadItems<T extends { id: string; digit?: number }>(list: T[]): T[] {
    const sorted = [...list].sort((a, b) => (a.digit ?? 99) - (b.digit ?? 99));
    const customOrder = getLaunchpadTileOrder();
    if (customOrder.length === 0) return sorted;
    const orderMap = new Map<string, number>();
    customOrder.forEach((id, idx) => orderMap.set(id, idx));
    return sorted.sort((a, b) => {
        const ia = orderMap.has(a.id) ? orderMap.get(a.id)! : Number.MAX_SAFE_INTEGER;
        const ib = orderMap.has(b.id) ? orderMap.get(b.id)! : Number.MAX_SAFE_INTEGER;
        if (ia !== ib) return ia - ib;
        return (a.digit ?? 99) - (b.digit ?? 99);
    });
}

function moveLaunchpadTileInItems(
    items: Array<{ id: string }>,
    pluginId: string,
    direction: "up" | "down"
): boolean {
    const ids = items.map((it) => it.id);
    const idx = ids.indexOf(pluginId);
    if (idx < 0) return false;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= ids.length) return false;
    const tmp = ids[idx]!;
    ids[idx] = ids[swapIdx]!;
    ids[swapIdx] = tmp;
    saveLaunchpadTileOrder(ids);
    return true;
}

function restoreAllHiddenPlugins(): number {
    const items = getLaunchpadHub().getItems();
    const states = getLaunchpadStates();
    let restored = 0;
    for (const it of items) {
        if (it.state === "hidden" || states[it.id] === "hidden") {
            states[it.id] = "docked";
            restored++;
        }
    }
    if (restored > 0) {
        saveLaunchpadStates(states);
        syncTopBarConvergence({ ignoreHysteresis: true });
        refreshEntryBadgeDot();
    }
    return restored;
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

function filterRetiredCompassActions(actions?: string[]): string[] | undefined {
    if (!Array.isArray(actions)) return actions;
    return actions.filter((act) => {
        const s = String(act || "").trim();
        return s.length > 0 && !/开关动作悬浮球|动作悬浮球|floatingball|exoskeleton|外骨骼/i.test(s);
    });
}

function getLaunchpadHub(): LvLaunchpadHub {
    if (typeof window === "undefined") {
        return {
            version: PROTOCOL_VERSION,
            register: (item) => {
                const normId = String(item?.id || "").trim().toLowerCase();
                if (!normId || normId === "siyuan-exoskeleton" || normId === "exoskeleton" || normId === "siyuan-quickgate" || normId === "quickgate") {
                    return () => {};
                }
                const sanitized = { ...item, actions: filterRetiredCompassActions(item.actions) };
                launchpadRegistry.set(item.id, sanitized);
                return () => launchpadRegistry.delete(item.id);
            },
            getItems: () => {
                const states = getLaunchpadStates();
                const list = Array.from(launchpadRegistry.values())
                    .filter((item) => {
                        const normId = String(item?.id || "").trim().toLowerCase();
                        return normId !== "siyuan-exoskeleton" && normId !== "exoskeleton" && normId !== "siyuan-quickgate" && normId !== "quickgate";
                    })
                    .map(item => ({
                        ...item,
                        actions: filterRetiredCompassActions(item.actions),
                        state: states[item.id] || "docked",
                    }));
                return sortLaunchpadItems(list);
            },
            setPluginState: (id, state) => {
                const states = getLaunchpadStates();
                states[id] = state;
                saveLaunchpadStates(states);
            },
            movePluginOrder: (id, direction) => {
                const list = sortLaunchpadItems(
                    Array.from(launchpadRegistry.values()).filter((item) => {
                        const normId = String(item?.id || "").trim().toLowerCase();
                        return normId !== "siyuan-exoskeleton" && normId !== "exoskeleton" && normId !== "siyuan-quickgate" && normId !== "quickgate";
                    })
                );
                return moveLaunchpadTileInItems(list, id, direction);
            },
            resetPluginOrder: () => {
                resetLaunchpadTileOrder();
            },
            getPluginOrder: () => getLaunchpadTileOrder(),
            updateItem: (id, patch) => {
                const item = launchpadRegistry.get(id);
                if (item) {
                    const nextPatch = patch.actions !== undefined ? { ...patch, actions: filterRetiredCompassActions(patch.actions) } : patch;
                    Object.assign(item, nextPatch);
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

    if (window.__LV_LAUNCHPAD__ && typeof window.__LV_LAUNCHPAD__.getItems === "function") {
        try {
            const prevHub = window.__LV_LAUNCHPAD__ as any;
            const prevItems = prevHub.getItems();
            if (Array.isArray(prevItems)) for (const prev of prevItems) if (prev?.id && !sharedRegistry.has(prev.id)) { const { state: _s, ...rest } = prev; sharedRegistry.set(prev.id, { ...rest, actions: filterRetiredCompassActions(rest.actions) }); }
            try { prevHub.close?.(); prevHub.destroy?.(); } catch {}
            if (typeof document !== "undefined") for (const oid of ["lvLaunchpadDesktopEntry","lvLaunchpadMobileEntry","lv-launchpad-mobile-ball"]) { try { document.getElementById(oid)?.remove(); } catch {} }
        } catch {}
    }

    const hub: LvLaunchpadHub = {
        version: PROTOCOL_VERSION,

        register(item: LvLaunchpadItem): () => void {
            const normId = String(item?.id || "").trim().toLowerCase();
            if (!normId || normId === "siyuan-exoskeleton" || normId === "exoskeleton" || normId === "siyuan-quickgate" || normId === "quickgate") {
                return () => {};
            }
            const sanitized: LvLaunchpadItem = {
                ...item,
                actions: filterRetiredCompassActions(item.actions),
            };
            const reg = getSharedLaunchpadRegistry();
            reg.set(item.id, sanitized);
            let baDisposer: (() => void) | null = null;
            try {
                baDisposer = getBlockAssistantHub().ensureLeader(item.id);
            } catch { /* ignore */ }
            maybeShowOnboardingCard();
            scheduleTopBarConvergence(60);
            return () => {
                if (reg.get(item.id) === sanitized) reg.delete(item.id);
                try { baDisposer?.(); } catch { /* ignore */ }
                scheduleTopBarConvergence(60);
            };
        },

        getItems(): Array<LvLaunchpadItem & { state: "pinned" | "docked" | "hidden" }> {
            const reg = getSharedLaunchpadRegistry();
            healMissingPluginsFromHost(reg);
            const states = getLaunchpadStates();
            const list = Array.from(reg.values())
                .filter((item) => {
                    const normId = String(item?.id || "").trim().toLowerCase();
                    return normId !== "siyuan-exoskeleton" && normId !== "exoskeleton" && normId !== "siyuan-quickgate" && normId !== "quickgate";
                })
                .map(item => ({
                    ...item,
                    actions: filterRetiredCompassActions(item.actions),
                    state: states[item.id] || "docked",
                }));
            return sortLaunchpadItems(list);
        },

        setPluginState(id: string, state: "pinned" | "docked" | "hidden"): void {
            const states = getLaunchpadStates();
            states[id] = state;
            saveLaunchpadStates(states);
            syncTopBarConvergence();
        },

        movePluginOrder(id: string, direction: "up" | "down"): boolean {
            const items = hub.getItems();
            const moved = moveLaunchpadTileInItems(items, id, direction);
            if (moved) syncTopBarConvergence();
            return moved;
        },

        resetPluginOrder(): void {
            resetLaunchpadTileOrder();
            syncTopBarConvergence();
        },

        getPluginOrder(): string[] {
            return getLaunchpadTileOrder();
        },

        updateItem(id: string, patch: Partial<LvLaunchpadItem>): void {
            const reg = getSharedLaunchpadRegistry();
            const item = reg.get(id);
            if (item) {
                const nextPatch = patch.actions !== undefined ? { ...patch, actions: filterRetiredCompassActions(patch.actions) } : patch;
                Object.assign(item, nextPatch);
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

                try {
                    const res: unknown = item.onAction(actionName);
                    if (res && typeof (res as Promise<unknown>).catch === "function") {
                        (res as Promise<unknown>).catch((err: unknown) => {
                            try { console.warn("[LvLaunchpad] 弹射坞动作处理器异常:", err); } catch { /* ignore */ }
                        });
                    }
                } catch (err) {
                    try { console.warn("[LvLaunchpad] 弹射坞动作处理器异常:", err); } catch { /* ignore */ }
                }
                return true;
            }
            item.onClick();
            return true;
        },

        open(_mode?: "popover" | "center"): void {

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
        },

        openQuickWorkspaceConfig(tab?: string): void {
            openQuickWorkspaceConfig(tab);
        }
    };

    (hub as any).destroy = () => { try { closeDesktopLaunchpadPopover(true); closeMobileSheet(true); } catch {} if (typeof document !== "undefined") for (const eid of [DESKTOP_ENTRY_ID,MOBILE_ENTRY_ID,MOBILE_BALL_ID]) { try { document.getElementById(eid)?.remove(); } catch {} } };
    (hub as any).__v220 = true;
    (hub as any).__v210 = true;
    (hub as any).__v180 = true;
    (hub as any).openMobileSheet = () => openMobileSheet();
    (hub as any).closeMobileSheet = () => closeMobileSheet();
    (hub as any).openDesktopPopover = () => openDesktopLaunchpadPopover();
    (hub as any).getTodaySummary = () => getTodaySummary(hub.getItems());
    (hub as any).openQuickWorkspaceConfig = (tab?: string) => openQuickWorkspaceConfig(tab);
    window.__LV_LAUNCHPAD__ = hub;
    healMissingPluginsFromHost(sharedRegistry);
    return hub;
}

function isIsolatedSettingsOrChildWindow(pluginHost?: unknown): boolean {
    const h = pluginHost as Record<string, unknown> | undefined;
    if (h && (h.settingsWindow === true || h.openInWindow === true || h.isSettingsWindow === true)) {
        return true;
    }
    try {
        const sy = typeof window !== "undefined" ? (window as unknown as { siyuan?: Record<string, unknown> }).siyuan : undefined;
        if (sy && (sy.isSettingsWindow === true || sy.openInWindow === true)) return true;
        if (typeof location !== "undefined" && typeof location.search === "string" && /[?&](?:settingsWindow|openInWindow)=true\b/i.test(location.search)) {
            return true;
        }
    } catch { /* ignore */ }
    return false;
}

export const lvLaunchpad = {
    openSettings: (tab?: string) => openQuickWorkspaceConfig(tab),
    register: (item: LvLaunchpadItem) => getLaunchpadHub().register(item),
    getItems: () => getLaunchpadHub().getItems(),
    setPluginState: (id: string, state: "pinned" | "docked" | "hidden") => getLaunchpadHub().setPluginState(id, state),
    movePluginOrder: (id: string, dir: "up" | "down") => getLaunchpadHub().movePluginOrder?.(id, dir) ?? false,
    resetPluginOrder: () => getLaunchpadHub().resetPluginOrder?.(),
    getPluginOrder: () => getLaunchpadHub().getPluginOrder?.() ?? [],
    updateItem: (id: string, patch: Partial<LvLaunchpadItem>) => getLaunchpadHub().updateItem?.(id, patch),
    executeAction: (id: string, name: string) => getLaunchpadHub().executeAction(id, name),
    open: (mode?: "popover" | "center") => getLaunchpadHub().open(mode),
    close: () => getLaunchpadHub().close(),
    getTodaySummary: () => getTodaySummary(getLaunchpadHub().getItems()),
    isMobileFrontend: () => isMobileFrontend(),
    ensureMobileEntry: () => ensureMobileEntry(),
    ensureDesktopEntry: () => ensureDesktopEntry(),
    registerHostApi(api: { openTab?: (opts: any) => any; openMobileFileById?: (app: any, id: string, action?: any) => any; fetchSyncPost?: (url: string, data?: any) => Promise<any>; app?: unknown }) {
        if (typeof window === "undefined") return;
        const w = window as any; const prev = w.__LV_HOST_API__ || {};
        w.__LV_HOST_API__ = { openTab: api.openTab || prev.openTab, openMobileFileById: api.openMobileFileById || prev.openMobileFileById, fetchSyncPost: api.fetchSyncPost || prev.fetchSyncPost, app: api.app || prev.app };
    },
    ensureUnifiedEntry(pluginHost?: unknown): () => void {
        if (isIsolatedSettingsOrChildWindow(pluginHost)) return () => {};
        ensureStyles();
        const cleanM = ensureMobileEntry();
        const cleanD = ensureDesktopEntry();
        const host = pluginHost as any;
        if (host?.app && typeof window !== "undefined") {
            const w = window as any;
            if (!w.__LV_HOST_API__) w.__LV_HOST_API__ = {};
            if (!w.__LV_HOST_API__.app) w.__LV_HOST_API__.app = host.app;
        }
        const wakeAndOpen = (fromGlobal = false) => {
            if (fromGlobal) {
                try {
                    const el = safeRequire<any>("electron") || (typeof window !== "undefined" && (window as any).require ? (window as any).require("electron") : null);
                    const win = (el?.remote || safeRequire<any>("@electron/remote"))?.getCurrentWindow?.();
                    if (win) {
                        if (win.isMinimized?.()) win.restore();
                        win.show?.(); win.focus?.();
                        if (win.setAlwaysOnTop) { win.setAlwaysOnTop(true); setTimeout(() => { try { win.setAlwaysOnTop(false); } catch {} }, 300); }
                    }
                } catch {}
                try { window.focus?.(); } catch {}
                window.setTimeout(() => { if (isMobileFrontend()) openMobileSheet(); else openDesktopLaunchpadPopover(); }, 80);
                return;
            }
            if (isMobileFrontend()) openMobileSheet(); else toggleDesktopLaunchpadPopover();
        };
        const regCmd = (th: any, tw: (fg?: boolean) => void) => {
            if (!th?.addCommand || typeof window === "undefined") return false;
            const w = window as any;
            w.__LV_LAUNCHPAD_CMD_REGISTERED__ = true; w.__LV_LAUNCHPAD_CMD_OWNER__ = th;
            try { th.addCommand({ langKey: "openLaunchpad", langText: "小驴罗盘：全家桶极速直达与工作台 (Ctrl+Alt+Shift+K 支持最小化呼出)", hotkey: "⌥⇧⌘K", callback: () => tw(false), globalCallback: () => tw(true) }); return true; }
            catch { w.__LV_LAUNCHPAD_CMD_REGISTERED__ = false; w.__LV_LAUNCHPAD_CMD_OWNER__ = undefined; return false; }
        };
        let didReg = false;
        if (host?.addCommand && typeof window !== "undefined") {
            const w = window as any;
            if (!Array.isArray(w.__LV_LAUNCHPAD_CMD_CANDIDATES__)) w.__LV_LAUNCHPAD_CMD_CANDIDATES__ = [];
            if (!w.__LV_LAUNCHPAD_CMD_CANDIDATES__.some((c: any) => c.host === host)) w.__LV_LAUNCHPAD_CMD_CANDIDATES__.push({ host, wakeAndOpen });
            if (!w.__LV_LAUNCHPAD_CMD_REGISTERED__) didReg = regCmd(host, wakeAndOpen);
        }
        const hostPid = String(host?.name || host?.id || "").trim();
        let autoBaDispose: (() => void) | null = null;
        if (hostPid) { try { autoBaDispose = getBlockAssistantHub().ensureLeader(hostPid); } catch {} }
        ensureBlockAssistantAltBFallback();
        let urlCleanup: (() => void) | null = null;
        if (host?.eventBus?.on) {
            const onUrl = (ev: CustomEvent<{ url?: string }>) => {
                const rawUrl = String(ev?.detail?.url || "");
                if (rawUrl.includes("lv-launchpad") || rawUrl.includes("launchpad") || rawUrl.includes("luopan") || rawUrl.includes("action=compass") || rawUrl.includes("action=launchpad")) wakeAndOpen(true);
            };
            try { host.eventBus.on("open-siyuan-url-plugin", onUrl); urlCleanup = () => { try { host.eventBus.off("open-siyuan-url-plugin", onUrl); } catch {} }; } catch {}
        }
        return () => {
            cleanM(); cleanD(); urlCleanup?.(); autoBaDispose?.();
            if (typeof window !== "undefined") {
                const w = window as any;
                if (Array.isArray(w.__LV_LAUNCHPAD_CMD_CANDIDATES__)) w.__LV_LAUNCHPAD_CMD_CANDIDATES__ = w.__LV_LAUNCHPAD_CMD_CANDIDATES__.filter((c: any) => c.host !== host);
                if ((didReg || w.__LV_LAUNCHPAD_CMD_OWNER__ === host) && w.__LV_LAUNCHPAD_CMD_OWNER__ === host) {
                    w.__LV_LAUNCHPAD_CMD_REGISTERED__ = false; w.__LV_LAUNCHPAD_CMD_OWNER__ = undefined;
                    for (const next of (w.__LV_LAUNCHPAD_CMD_CANDIDATES__ || [])) if (regCmd(next.host, next.wakeAndOpen)) break;
                }
            }
        };
    },
    openQuickNote: () => openQuickNoteDialog(),
    openLifeLog: () => openLifeLogDialog(),
    openDiaryBottom: async () => await openDiaryBottom(),
    openTaskManager: () => openTaskManager(),
    openNewTask: () => openNewTask(),
    reloadUI: () => reloadUI(),
    randomWalk: () => randomWalk(),
    pasteToDailyNote: () => pasteToDailyNote(),
    getQuickWorkspaceConfig: () => getQuickWorkspaceConfig(),
    saveQuickWorkspaceConfig: (patch: Partial<LvQuickWorkspaceConfig>) => saveQuickWorkspaceConfig(patch),
    openJoinQqGroup: () => openJoinQqGroup(),
    openSponsorModal: () => openSponsorModal(),
    openMobileSheet: () => openMobileSheet(),
    closeMobileSheet: () => closeMobileSheet(),
    haptic: (ms = 10) => hapticFeedback(ms),
    getMobileEntryMode: () => getMobileEntryMode(),
    setMobileEntryMode: (m: LvMobileEntryMode) => setMobileEntryMode(m),
    checkBedlineReminder: (now?: Date) => checkAndTriggerBedline(now),
};
/* ========================================================================= */
/* 14b. 移动端统一入口与底部弹射坞 (Lv Mobile Entry & Bottom Sheet)            */
/* ========================================================================= */

const MOBILE_ENTRY_ID = "lvLaunchpadMobileEntry";
const DESKTOP_ENTRY_ID = "lvLaunchpadDesktopEntry";
const MOBILE_SHEET_ID = "lv-launchpad-sheet-mask";

export function isMobileFrontend(): boolean {
    if (typeof document === "undefined" || typeof document.getElementById !== "function") return false;
    try {

        if (typeof location !== "undefined" && location.pathname.includes("/stage/build/mobile/")) return true;
    } catch { /* ignore */ }
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

    if (/Macintosh/i.test(ua) && ((navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints ?? 0) > 1) return true;
    return false;
}

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

export function normalizeBallPosition(raw: unknown): LvBallPosition {
    const obj = (raw && typeof raw === "object") ? raw as Record<string, unknown> : {};
    const edge = obj.edge === "right" ? "right" : "left";
    const y = typeof obj.yRatio === "number" && Number.isFinite(obj.yRatio) ? obj.yRatio : 0.5;
    return { edge, yRatio: Math.min(0.85, Math.max(0.15, y)), immersive: obj.immersive === true };
}

export function clampBallYRatio(v: number): number {
    return Math.min(0.85, Math.max(0.15, v));
}

let lastBadgeDotCheckTime = 0;
let lastBadgeDotState = "";

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

const COMPASS_SVG = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="fill:none!important;stroke:currentColor!important;" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5" fill="none"/><path d="M17.5 2.5 21.5 6.5 17.5 10.5 13.5 6.5Z" fill="none"/><rect x="3" y="14" width="7" height="7" rx="1.5" fill="none"/><rect x="14" y="14" width="7" height="7" rx="1.5" fill="none"/></svg>`;
const entryInnerHtml = (dotRectCss: string) => `${COMPASS_SVG}<span class="lv-entry-moon" aria-hidden="true" style="display:none;margin-left:2px;font-size:11px;line-height:1;">🌙</span><span class="lv-entry-dot" aria-hidden="true" style="display:none;position:absolute;${dotRectCss};border-radius:999px;background:var(--b3-theme-primary,#3576c7);box-shadow:0 0 0 1.5px var(--b3-theme-surface,#fff);pointer-events:none;"></span>`;
let lastMobileTopbarTap = { ts: 0, x: 0, y: 0 };

function buildMobileEntryButton(): boolean {
    if (typeof document === "undefined") return false;
    ensureStyles();
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
    btn.style.position = "relative";

    btn.innerHTML = entryInnerHtml("top:4px;right:4px;width:6px;height:6px");
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
    updateBallSuppression();
    refreshEntryBadgeDot();
    return true;
}

/* ===== 悬浮球（罗盘 FAB）：可拖拽、贴边吸附、闲置半隐、长按沉浸，点击弹射坞 ===== */

interface LvLaunchpadRuntimeBag {
    ballIdleTimer: number | undefined;
    ballCurrentPos: LvBallPosition | undefined;
    ballResizeHandler: (() => void) | undefined;
    ballResizeTimer: number | undefined;
    desktopPopoverKeyDownHandler: ((e: KeyboardEvent) => void) | null;
    desktopPopoverOutsideClickHandler: ((e: MouseEvent) => void) | null;
    desktopPopoverOutsideBindTimer: number | null;
    desktopPopoverResizeHandler: (() => void) | null;
    desktopGlobalHotkeyWired: boolean;
    desktopGlobalHotkeyHandler: ((e: KeyboardEvent) => void) | null;
    ballDialogObserver: MutationObserver | undefined;
    ballDialogDebounceTimer: number | undefined;
    ballFocusHandler: ((ev: FocusEvent) => void) | undefined;
    ballBlurHandler: (() => void) | undefined;
    ballDialogOpen: boolean;
    ballInputFocused: boolean;
    sheetCloseTimer: number | undefined;
    sheetHistoryArmed: boolean;
    sheetPopHandler: (() => void) | undefined;
    sheetViewportCleanup: (() => void) | undefined;
    lvPopoverPressDepth: number;
    lvPopoverDeferredSwap: (() => void) | null;
    lvPopoverPressCleanups: Array<() => void>;
    desktopToolbarDebounceTimer: number | null;
    desktopThemeDebounceTimer: number | null;
    compassTrailingRetryTimer: number | null;
    mobileTopBarDebounceTimer: number | null;
    mobileSyncRetryTimers: number[];
}
let fallbackLaunchpadRuntimeBag: LvLaunchpadRuntimeBag | null = null;
function createDefaultRuntimeBag(): LvLaunchpadRuntimeBag {
    return {
        ballIdleTimer: undefined, ballCurrentPos: undefined, ballResizeHandler: undefined, ballResizeTimer: undefined,
        desktopPopoverKeyDownHandler: null, desktopPopoverOutsideClickHandler: null, desktopPopoverOutsideBindTimer: null, desktopPopoverResizeHandler: null,
        desktopGlobalHotkeyWired: false, desktopGlobalHotkeyHandler: null,
        ballDialogObserver: undefined, ballDialogDebounceTimer: undefined, ballFocusHandler: undefined, ballBlurHandler: undefined,
        ballDialogOpen: false, ballInputFocused: false,
        sheetCloseTimer: undefined, sheetHistoryArmed: false, sheetPopHandler: undefined, sheetViewportCleanup: undefined,
        lvPopoverPressDepth: 0, lvPopoverDeferredSwap: null, lvPopoverPressCleanups: [],
        desktopToolbarDebounceTimer: null, desktopThemeDebounceTimer: null, compassTrailingRetryTimer: null,
        mobileTopBarDebounceTimer: null, mobileSyncRetryTimers: [],
    };
}
function getLaunchpadRuntimeBag(): LvLaunchpadRuntimeBag {
    if (typeof window !== "undefined") {
        const w = window as any;
        if (!w.__LV_LAUNCHPAD_RUNTIME_BAG__) w.__LV_LAUNCHPAD_RUNTIME_BAG__ = createDefaultRuntimeBag();
        return w.__LV_LAUNCHPAD_RUNTIME_BAG__ as LvLaunchpadRuntimeBag;
    }
    if (!fallbackLaunchpadRuntimeBag) fallbackLaunchpadRuntimeBag = createDefaultRuntimeBag();
    return fallbackLaunchpadRuntimeBag;
}

function applyBallPosition(ball: HTMLElement, pos: LvBallPosition, idle: boolean): void {
    ensureStyles();
    getLaunchpadRuntimeBag().ballCurrentPos = pos; // 供旋转/折叠屏开合后重钳制使用
    try {
        const vw = typeof window !== "undefined" && Number.isFinite(window.innerWidth) ? window.innerWidth : 390;
        const vh = typeof window !== "undefined" && Number.isFinite(window.innerHeight) ? window.innerHeight : 800;

        const top = Math.min(vh - 88, Math.max(56, Math.round(pos.yRatio * vh)));
        ball.style.position = "fixed";
        ball.style.width = "46px";
        ball.style.height = "46px";
        ball.style.borderRadius = "999px";
        ball.style.zIndex = "970";
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
    const bag = getLaunchpadRuntimeBag();
    if (bag.ballIdleTimer !== undefined) { try { window.clearTimeout(bag.ballIdleTimer); } catch { /* ignore */ } }
    bag.ballIdleTimer = window.setTimeout(() => {
        bag.ballIdleTimer = undefined;
        applyBallPosition(ball, pos, true);
    }, MOBILE_BALL_IDLE_MS);
}

function buildMobileBallButton(): boolean {
    const _ballDblHint = "双击悬浮球：极速直达 LifeLog"; void _ballDblHint;
    if (typeof document === "undefined" || !document.body || !getLvEcosystemToggles().launchpad) return false;
    ensureStyles();
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
            suppressClick = true; // 长按切换沉浸态后，阻止松手触发 click 弹开底部罗盘坞
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

            const yMin = 56 / vh;
            const yMax = Math.max(yMin, (vh - 88) / vh);
            pos = { ...pos, edge: x < vw / 2 ? "left" : "right", yRatio: Math.min(yMax, Math.max(yMin, top / vh)) };
            const ballLeft = Math.min(vw - 56, Math.max(10, Math.round(x - 23)));
            ball.style.left = `${ballLeft}px`;
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

    ball.addEventListener("click", (e) => {
        if (suppressClick) { suppressClick = false; e?.preventDefault?.(); e?.stopPropagation?.(); return; } // 拖拽或长按结束的合成 click 不开坞
        const now = Date.now();
        if (now - lastBallClickTime < 250) {

            lastBallClickTime = 0;
            if (ballSingleTimer !== undefined) {
                try { window.clearTimeout(ballSingleTimer); } catch { /* ignore */ }
                ballSingleTimer = undefined;
            }
            hapticFeedback(14);
            closeMobileSheet(true);
            openLifeLogDialog();
            return;
        }
        lastBallClickTime = now;
        ballSingleTimer = window.setTimeout(() => {
            ballSingleTimer = undefined;
            hapticFeedback(8);
            openMobileSheet();
            scheduleBallIdle(ball, pos);
        }, 250);
    });
    ball.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        if (suppressClick) return;
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
function wireViewportWatch(): void {
    const bag = getLaunchpadRuntimeBag();
    if (bag.ballResizeHandler || typeof window === "undefined" || typeof window.addEventListener !== "function") return;
    bag.ballResizeHandler = () => {
        if (bag.ballResizeTimer !== undefined) { try { window.clearTimeout(bag.ballResizeTimer); } catch { /* ignore */ } }
        bag.ballResizeTimer = window.setTimeout(() => {
            bag.ballResizeTimer = undefined;
            const ball = typeof document !== "undefined" ? document.getElementById(MOBILE_BALL_ID) : null;
            if (ball && bag.ballCurrentPos) applyBallPosition(ball, bag.ballCurrentPos, false);
        }, 150); // 折叠屏开合/旋转会连发多次 resize，防抖合并
    };
    window.addEventListener("resize", bag.ballResizeHandler);
    window.addEventListener("orientationchange", bag.ballResizeHandler);
}

function unwireViewportWatch(): void {
    const bag = getLaunchpadRuntimeBag();
    if (bag.ballResizeHandler && typeof window !== "undefined" && typeof window.removeEventListener === "function") {
        try {
            window.removeEventListener("resize", bag.ballResizeHandler);
            window.removeEventListener("orientationchange", bag.ballResizeHandler);
        } catch { /* ignore */ }
    }
    bag.ballResizeHandler = undefined;
    if (bag.ballResizeTimer !== undefined) { try { window.clearTimeout(bag.ballResizeTimer); } catch { /* ignore */ } bag.ballResizeTimer = undefined; }
}

function syncMobileEntryDom(): void {
    if (typeof document === "undefined" || !isMobileFrontend()) return;
    ensureStyles();
    const mode = getMobileEntryMode();
    if (mode === "topbar" || mode === "both") {
        buildMobileEntryButton();
    } else {
        try { document.getElementById(MOBILE_ENTRY_ID)?.remove(); } catch { /* ignore */ }
    }

    const bag = getLaunchpadRuntimeBag();
    if (Array.isArray(bag.mobileSyncRetryTimers) && bag.mobileSyncRetryTimers.length > 0) {
        bag.mobileSyncRetryTimers.forEach((t) => { try { window.clearTimeout(t); } catch { /* ignore */ } });
        bag.mobileSyncRetryTimers = [];
    }
    if (!mobileEntryFullyApplied()) {
        if (!Array.isArray(bag.mobileSyncRetryTimers)) bag.mobileSyncRetryTimers = [];
        for (const delay of [1200, 4000]) {
            const tid = Number(window.setTimeout(() => {
                if (getSharedMobileEntryOwners().size === 0) return;
                syncMobileEntryDom();
            }, delay));
            bag.mobileSyncRetryTimers.push(tid);
        }
    }
    if (mode === "ball" || mode === "both") {
        buildMobileBallButton();
    } else {
        try { document.getElementById(MOBILE_BALL_ID)?.remove(); } catch { /* ignore */ }
    }
    selfHealMobileEntryPlacement();
    refreshEntryBadgeDot();
}

/* 顶栏塌陷自愈：思源移动端在无文档视图等状态下 mobileTopBar 可能塌陷为 0 高，
 * static 子项会被居中悬到视口上缘外（48px 按钮只露下半，触控目标减半——真机走查实证）。
 * 检测到宿主塌陷时把入口提升为固定定位钉在视口左上，宿主恢复后还原内联。 */
function selfHealMobileEntryPlacement(): void {
    if (typeof document === "undefined") return;
    const entry = document.getElementById(MOBILE_ENTRY_ID);
    if (!entry) return;
    const topBar = document.getElementById("mobileTopBar");

    const topBarH = topBar ? Math.round(topBar.getBoundingClientRect().height) : 0;
    if (topBarH < 24) {

        try {
            if (entry.parentElement !== document.body) document.body.appendChild(entry);
        } catch { /* ignore */ }
        entry.style.position = "fixed";
        entry.style.left = "max(6px, env(safe-area-inset-left, 6px))";
        entry.style.top = "max(6px, env(safe-area-inset-top, 6px))";
        entry.style.zIndex = "960";
        entry.style.visibility = getLaunchpadRuntimeBag().ballDialogOpen ? "" : "visible";
    } else if (topBar) {

        try {
            if (entry.parentElement !== topBar) topBar.appendChild(entry);
        } catch { /* ignore */ }
        entry.style.position = "relative";
        entry.style.top = "";
        entry.style.left = "";
        entry.style.zIndex = "";
    }
}

function mobileEntryFullyApplied(): boolean {
    const mode = getMobileEntryMode();
    const wantTopbar = mode === "topbar" || mode === "both";
    const wantBall = mode === "ball" || mode === "both";
    const topbarOk = !wantTopbar || Boolean(document.getElementById(MOBILE_ENTRY_ID));
    const ballOk = !wantBall || Boolean(document.getElementById(MOBILE_BALL_ID));
    return topbarOk && ballOk;
}

/* ===== 罗盘开启与生态引导持久化（Launchpad Onboarding Persistence · Protocol v1.8.7） ===== */
const ONBOARDING_KEY = "lv_launchpad_onboarding_done";
const DESKTOP_CONVERGENCE_ONBOARDING_KEY = "lv_desktop_convergence_onboarding_done";

export function markLaunchpadOnboardingDonePermanently(): void {
    const ls = getSafeLocalStorage();
    try { ls?.setItem(ONBOARDING_KEY, "1"); } catch { /* ignore */ }
    try { ls?.setItem(DESKTOP_CONVERGENCE_ONBOARDING_KEY, "1"); } catch { /* ignore */ }
    if (typeof window !== "undefined") {
        (window as unknown as { __LV_LAUNCHPAD_ONBOARDING_DONE__?: boolean }).__LV_LAUNCHPAD_ONBOARDING_DONE__ = true;
    }
    try {
        lvNotify.muteDays("launchpad-convergence", 3650);
        lvNotify.muteDays("launchpad-onboarding", 3650);
        lvNotify.muteDays("launchpad", 3650);
    } catch { /* ignore */ }
}

export function isLaunchpadOnboardingDone(): boolean {
    if (typeof window !== "undefined" && (window as unknown as { __LV_LAUNCHPAD_ONBOARDING_DONE__?: boolean }).__LV_LAUNCHPAD_ONBOARDING_DONE__) {
        return true;
    }
    const ls = getSafeLocalStorage();
    if (ls) {
        try {
            if (ls.getItem(DESKTOP_CONVERGENCE_ONBOARDING_KEY) === "1" || ls.getItem(ONBOARDING_KEY) === "1") {
                return true;
            }
        } catch { /* ignore */ }
    }
    try {
        if (lvNotify.isCategoryMuted("launchpad-convergence") || lvNotify.isCategoryMuted("launchpad-onboarding") || lvNotify.isCategoryMuted("launchpad")) {
            return true;
        }
    } catch { /* ignore */ }
    return false;
}

function maybeShowOnboardingCard(): void {
    if (typeof document === "undefined" || isLaunchpadOnboardingDone()) return;
    const items = getLaunchpadHub().getItems();
    if (items.length < 3) return; // 单双插件用户不弹欢迎卡
    markLaunchpadOnboardingDonePermanently();
    lvNotify.card({
        source: "罗盘",
        category: "launchpad-onboarding",
        title: "👋 欢迎使用小驴罗盘",
        message: `已为你收敛 ${items.length} 个插件的入口：点磁贴直达主界面、长按磁贴展开快捷行动、顶部搜索穿透全家桶、🌙 一键专注静音。可在各插件设置中自定义。`,
        level: "info",
        duration: 0,
        firstRun: true,
        actions: [
            {
                label: "我知道了",
                primary: true,
                onClick: () => {
                    markLaunchpadOnboardingDonePermanently();
                },
            },
        ],
        onDismiss: () => {
            markLaunchpadOnboardingDonePermanently();
        },
    });
}

/* ===== 睡前日报定时提醒（Protocol v1.7）：22:30 且今日有活动时一次性卡片 ===== */
const BEDLINE_KEY = "lv_launchpad_bedline_reminder"; // "on"（默认）/ "off"
const BEDLINE_LAST_KEY = "lv_launchpad_bedline_last"; // 上次提醒日期 YYYY-MM-DD
const BEDLINE_FORCE_KEY = "lv_launchpad_bedline_force"; // 测试钩子：强制阈值 hh:mm

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

export function checkAndTriggerBedline(now = new Date()): boolean {
    if (!bedlineEnabled() || !bedlineDue(now) || isNotifyFocusActive()) return false;

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
    if (typeof window === "undefined") return;
    const w = window as unknown as { __LV_BEDLINE_TICKER__?: boolean; __LV_BEDLINE_TICKER_OFF__?: (() => void) | null };
    if (w.__LV_BEDLINE_TICKER__) return;
    w.__LV_BEDLINE_TICKER__ = true;
    w.__LV_BEDLINE_TICKER_OFF__ = lvTicker.onMinute("lv-launchpad", (now) => {
        checkAndTriggerBedline(now);
    });
}

function stopBedlineReminder(): void {
    if (typeof window === "undefined") return;
    const w = window as unknown as { __LV_BEDLINE_TICKER__?: boolean; __LV_BEDLINE_TICKER_OFF__?: (() => void) | null };
    try { w.__LV_BEDLINE_TICKER_OFF__?.(); } catch { /* ignore */ }
    w.__LV_BEDLINE_TICKER_OFF__ = null;
    w.__LV_BEDLINE_TICKER__ = false;
}

function cleanupSharedLaunchpadTickerIfIdle(): void {
    if (typeof window === "undefined") return;
    if (getSharedDesktopEntryOwners().size > 0 || getSharedMobileEntryOwners().size > 0) return;
    stopBedlineReminder();
    const w = window as unknown as { __LV_ACTIVITY_TICKER_OFF__?: (() => void) | null };
    try { w.__LV_ACTIVITY_TICKER_OFF__?.(); } catch { /* ignore */ }
    w.__LV_ACTIVITY_TICKER_OFF__ = null;
}

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

    const bag = getLaunchpadRuntimeBag();
    mobileTopBarObserver = new MutationObserver(() => {
        if (bag.mobileTopBarDebounceTimer !== null || getSharedMobileEntryOwners().size === 0) return;
        bag.mobileTopBarDebounceTimer = window.setTimeout(() => {
            bag.mobileTopBarDebounceTimer = null;
            if (getSharedMobileEntryOwners().size === 0) return;
            if (!document.getElementById(MOBILE_ENTRY_ID)) {
                syncMobileEntryDom();
            } else {

                selfHealMobileEntryPlacement();
            }
        }, 120);
    });

    try {
        mobileTopBarObserver.observe(topBar, { childList: true, attributes: true, attributeFilter: ["class", "style"] });
        if (typeof window !== "undefined") (window as unknown as { __LV_MOBILE_TOPBAR_OBS__?: MutationObserver }).__LV_MOBILE_TOPBAR_OBS__ = mobileTopBarObserver;
    } catch { /* ignore */ }
}

/* 移动入口塌陷自愈哨兵：共享 window 单例定时器，8 仓模块实例共用一个 */
let mobileEntryHealTimer: number | null = null;
function startMobileEntryHealSentinel(): void {
    if (typeof window === "undefined") return;
    const w = window as unknown as { __LV_MOBILE_ENTRY_HEAL__?: number };
    if (w.__LV_MOBILE_ENTRY_HEAL__ || mobileEntryHealTimer) return;
    if (typeof window.setInterval !== "function" || typeof window.clearInterval !== "function") return;
    mobileEntryHealTimer = Number(window.setInterval(() => {
        try {
            if (typeof document !== "undefined" && document.hidden) return; // 页面隐藏失焦时杜绝空转开销
            if (getSharedMobileEntryOwners().size === 0) { stopMobileEntryHealSentinel(); return; }
            selfHealMobileEntryPlacement();
        } catch { /* ignore */ }
    }, 30000));
    w.__LV_MOBILE_ENTRY_HEAL__ = mobileEntryHealTimer;
}
function stopMobileEntryHealSentinel(): void {
    if (typeof window === "undefined") return;
    const w = window as unknown as { __LV_MOBILE_ENTRY_HEAL__?: number };
    if (mobileEntryHealTimer) { try { clearInterval(mobileEntryHealTimer); } catch { /* ignore */ } mobileEntryHealTimer = null; }
    if (w.__LV_MOBILE_ENTRY_HEAL__) { try { window.clearInterval(w.__LV_MOBILE_ENTRY_HEAL__); } catch { /* ignore */ } delete w.__LV_MOBILE_ENTRY_HEAL__; }
}

function ensureMobileEntry(): MobileEntryCleanup {
    if (typeof document === "undefined" || isIsolatedSettingsOrChildWindow() || !getLvEcosystemToggles().launchpad) return () => {};
    ensureStyles();
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
        startMobileEntryHealSentinel(); // 5s 低频哨兵：视图切换引发顶栏塌陷/恢复时自愈入口定位
        maybeStartBedlineReminder(); // 睡前日报定时提醒随首个宿主启动（lvTicker 单例，全局一次）
    }
    if (!mobileEntryFullyApplied()) {

        for (const delay of [800, 1500, 4000, 10000]) {
            const tid = window.setTimeout(() => {
                if (getSharedMobileEntryOwners().size === 0) return;
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
        stopMobileEntryHealSentinel();
        try {
            mobileTopBarObserver?.disconnect();
            if (typeof window !== "undefined") {
                const w = window as unknown as { __LV_MOBILE_TOPBAR_OBS__?: MutationObserver };
                w.__LV_MOBILE_TOPBAR_OBS__?.disconnect();
                delete w.__LV_MOBILE_TOPBAR_OBS__;
            }
        } catch { /* ignore */ }
        mobileTopBarObserver = null;
        const bag = getLaunchpadRuntimeBag();
        if (bag.mobileTopBarDebounceTimer !== null && bag.mobileTopBarDebounceTimer !== undefined) {
            try { window.clearTimeout(bag.mobileTopBarDebounceTimer); } catch { /* ignore */ }
            bag.mobileTopBarDebounceTimer = null;
        }
        if (Array.isArray(bag.mobileSyncRetryTimers) && bag.mobileSyncRetryTimers.length > 0) {
            bag.mobileSyncRetryTimers.forEach((t) => { try { window.clearTimeout(t); } catch { /* ignore */ } });
            bag.mobileSyncRetryTimers = [];
        }
        if (mobileEntryDebounceTimer !== null) {
            try { window.clearTimeout(mobileEntryDebounceTimer); } catch { /* ignore */ }
            mobileEntryDebounceTimer = null;
        }
        if (bag.ballIdleTimer !== undefined) { try { window.clearTimeout(bag.ballIdleTimer); } catch { /* ignore */ } bag.ballIdleTimer = undefined; }
        unwireMobileSuppression();
        unwireViewportWatch();
        cleanupSharedLaunchpadTickerIfIdle();
        bag.ballCurrentPos = undefined;
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
    "barMainMenu", "barWorkspace", "barExit"
]);

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

            if (el.id && SIYUAN_NATIVE_BUTTON_IDS.has(el.id)) continue;

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

            if (item.fullName && (ariaLabel.includes(item.fullName) || title.includes(item.fullName))) {
                return el;
            }

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

function maybeShowDesktopConvergenceOnboarding(itemCount: number): void {
    if (typeof document === "undefined" || isLaunchpadOnboardingDone()) return;
    markLaunchpadOnboardingDonePermanently();
    lvNotify.card({
        source: "小驴罗盘",
        category: "launchpad-convergence",
        title: "🧭 顶栏已升级为小驴罗盘中枢",
        message: `已为您将 ${itemCount} 个插件自动收敛至顶栏罗盘图标，告别顶栏拥挤。点击罗盘可直达所有插件与 LifeLog 随手记；若习惯老版独立图标，可一键恢复平铺顶栏！`,
        level: "info",
        duration: 12000,
        firstRun: true,
        actions: [
            {
                label: "我知道了",
                primary: true,
                onClick: () => {
                    markLaunchpadOnboardingDonePermanently();
                },
            },
            {
                label: "打开罗盘看看",
                onClick: () => {
                    markLaunchpadOnboardingDonePermanently();
                    openDesktopLaunchpadPopover();
                },
            },
            {
                label: "一键恢复平铺顶栏",
                onClick: () => {
                    markLaunchpadOnboardingDonePermanently();
                    const hub = getLaunchpadHub();
                    const allItems = hub.getItems();
                    for (const it of allItems) {
                        hub.setPluginState(it.id, "pinned");
                    }
                    syncTopBarConvergence();
                },
            },
        ],
        onDismiss: () => {
            markLaunchpadOnboardingDonePermanently();
        },
    });
}

export function scheduleTopBarConvergence(delayMs = 80): void {
    if (typeof window === "undefined" || typeof document === "undefined" || isMobileFrontend() || typeof window.setTimeout !== "function") return;
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
    if (typeof window === "undefined" || typeof document === "undefined" || !isMobileFrontend() || typeof window.setTimeout !== "function") return;
    if (mobileEntryDebounceTimer !== null) {
        window.clearTimeout(mobileEntryDebounceTimer);
    }
    mobileEntryDebounceTimer = window.setTimeout(() => {
        mobileEntryDebounceTimer = null;
        syncMobileEntryDom();
    }, delayMs);
}

const DESKTOP_RIGHT_ANCHOR_SELECTOR = "#barMore, #barSetting, #barSettings, #barHelp, #barMode, #barExit, #windowControls";

function findDesktopRightAnchor(toolbar: HTMLElement): HTMLElement | null {
    if (!toolbar || typeof toolbar.querySelector !== "function") return null;
    try {
        const candidates = DESKTOP_RIGHT_ANCHOR_SELECTOR.split(",").map((s) => s.trim());
        for (const sel of candidates) {
            const el = toolbar.querySelector<HTMLElement>(sel);
            if (el && el.parentElement === toolbar) return el;
        }
    } catch { /* ignore */ }
    return null;
}

export function syncTopBarConvergence(opts?: { ignoreHysteresis?: boolean }): void {
    if (typeof document === "undefined" || isMobileFrontend()) return;
    try {
        const hub = getLaunchpadHub();
        const items = hub.getItems();
        const activeItems = items.filter(it => it.state !== "hidden");

        const hasAnyRegistered = items.length >= 1;
        const hasAnyActive = activeItems.length >= 1;
        const nowTs = Date.now();
        if (hasAnyRegistered) lastCompassActiveAtLeastTwoAt = nowTs;
        const needShowCompass = hasAnyRegistered || (!opts?.ignoreHysteresis && (nowTs - lastCompassActiveAtLeastTwoAt < 6000));
        const needConverge = hasAnyActive;

        const compassBtn = document.getElementById(DESKTOP_ENTRY_ID);
        if (compassBtn && typeof compassBtn === "object" && "style" in compassBtn && compassBtn.style) {

            const toolbar = document.getElementById("toolbar");
            if (toolbar && compassBtn.parentElement === toolbar && typeof toolbar.querySelector === "function") {
                ensureCompassOnRightSide(toolbar, compassBtn);
            }
            const nextDisplay = needShowCompass ? "inline-flex" : "none";
            if (compassBtn.style.display !== nextDisplay) {
                compassBtn.style.display = nextDisplay;
            }
            refreshEntryBadgeDot();
            if (activeItems.length >= 2) {
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
                const isPinned = needConverge ? item.state === "pinned" : item.state !== "hidden";
                const targetDisplay = isPinned ? "" : "none";
                if (el.style.display !== targetDisplay) {
                    el.style.display = targetDisplay;
                }
                if (isPinned) {
                    if (typeof el.getAttribute !== "function" || el.getAttribute("data-lv-pinned") !== "true") {
                        el.setAttribute?.("data-lv-pinned", "true");
                    }
                } else {
                    if (typeof el.hasAttribute !== "function" || el.hasAttribute("data-lv-pinned")) {
                        el.removeAttribute?.("data-lv-pinned");
                    }
                }
            }
        }
    } catch (err) {
        console.warn("[LvLaunchpad] 顶栏收敛同步异常:", err);
    }
}

let lastCompassMoveAt = 0;
let lastCompassRebuildAt = 0;
let lastCompassActiveAtLeastTwoAt = 0;

export function resetTopBarConvergenceHysteresis(): void {
    lastCompassActiveAtLeastTwoAt = 0;
    lastCompassMoveAt = 0;
    lastCompassRebuildAt = 0;
}

export function resetLaunchpadRegistryForTesting(): void {
    launchpadRegistry.clear();
    if (typeof window !== "undefined" && (window as any).__LV_LAUNCHPAD_REGISTRY__) {
        try { (window as any).__LV_LAUNCHPAD_REGISTRY__.clear(); } catch { /* ignore */ }
    }
    resetTopBarConvergenceHysteresis();
}

function placeCompassInRightZone(toolbar: HTMLElement, btn: HTMLElement): void {
    if (!toolbar || !btn) return;

    const barMore = toolbar.querySelector<HTMLElement>("#barMore");
    if (barMore && barMore.parentElement === toolbar && barMore !== btn) {
        if (typeof barMore.after === "function") {
            barMore.after(btn);
            return;
        }
        if (barMore.nextSibling) {
            toolbar.insertBefore(btn, barMore.nextSibling);
            return;
        }
        toolbar.insertBefore(btn, barMore);
        return;
    }
    try {
        const anchor = findDesktopRightAnchor(toolbar);
        if (anchor && anchor.parentElement === toolbar && anchor !== btn) {
            toolbar.insertBefore(btn, anchor);
            return;
        }
    } catch { /* ignore */ }
    const winCtrl = toolbar.querySelector<HTMLElement>("#windowControls");
    if (winCtrl && winCtrl.parentElement === toolbar && winCtrl !== btn) {
        toolbar.insertBefore(btn, winCtrl);
        return;
    }
    toolbar.appendChild(btn);
}

function ensureCompassOnRightSide(toolbar: HTMLElement, btn: HTMLElement): void {
    try {
        if (!btn || btn.parentElement !== toolbar) return;
        const children = Array.from(toolbar.children || []);
        const dragIdx = children.findIndex((c) => c.id === "drag");
        const btnIdx = children.indexOf(btn);

        if (dragIdx !== -1 && btnIdx > dragIdx) {
            return;
        }

        if (btnIdx === -1 || (dragIdx !== -1 && btnIdx < dragIdx)) {
            const now = Date.now();
            if (now - lastCompassMoveAt < 600) return;
            lastCompassMoveAt = now;
            placeCompassInRightZone(toolbar, btn);
        }
    } catch { /* ignore */ }
}

const DESKTOP_POPOVER_ID = "lv-desktop-launchpad-popover";

/* ROBS-1 按压中保护：弹层 DOM 交换在用户按压（pointerdown→pointerup）期间延迟执行，
   防止 badge 探针/omni 流式渲染把被按压节点中途摘除导致 click 改派公共祖先而被吞。 */
function resetPopoverPressGuard(): void {
    const bag = getLaunchpadRuntimeBag();
    bag.lvPopoverPressDepth = 0;
    bag.lvPopoverDeferredSwap = null;
    if (bag.lvPopoverPressCleanups.length > 0) {
        const list = bag.lvPopoverPressCleanups.splice(0, bag.lvPopoverPressCleanups.length);
        for (const fn of list) {
            try { fn(); } catch { /* ignore */ }
        }
    }
}
function lvPopoverSafeSwap(mutate: () => void): void {
    const bag = getLaunchpadRuntimeBag();
    if (bag.lvPopoverPressDepth > 0) {
        bag.lvPopoverDeferredSwap = mutate;
        return;
    }
    mutate();
}
const LAUNCHPAD_VIEW_KEY = "lv_launchpad_view_mode";
const LAUNCHPAD_ACTION_LIMIT_KEY = "lv_launchpad_action_limit";

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
    resetPopoverPressGuard();
    syncEntryOpenState(false);
    try { refreshEntryBadgeDot(); } catch { /* ignore */ }
    const el = document.getElementById(DESKTOP_POPOVER_ID);
    if (!el) return;

    const bag = getLaunchpadRuntimeBag();
    if (bag.desktopPopoverOutsideBindTimer !== null) {
        try { if (typeof window !== "undefined") window.clearTimeout(bag.desktopPopoverOutsideBindTimer); else clearTimeout(bag.desktopPopoverOutsideBindTimer); } catch { /* ignore */ }
        bag.desktopPopoverOutsideBindTimer = null;
    }
    if (bag.desktopPopoverKeyDownHandler && typeof window !== "undefined") {
        window.removeEventListener("keydown", bag.desktopPopoverKeyDownHandler, true);
        bag.desktopPopoverKeyDownHandler = null;
    }
    if (bag.desktopPopoverOutsideClickHandler && typeof window !== "undefined") {
        window.removeEventListener("mousedown", bag.desktopPopoverOutsideClickHandler, true);
        bag.desktopPopoverOutsideClickHandler = null;
    }
    if (bag.desktopPopoverResizeHandler && typeof window !== "undefined") {
        window.removeEventListener("resize", bag.desktopPopoverResizeHandler);
        bag.desktopPopoverResizeHandler = null;
    }

    if (immediate) {
        try { el.remove(); } catch { /* ignore */ }
        try { if (typeof window !== "undefined") (window as any).__LV_SYNC_NOTICE_AVOIDANCE__?.(); } catch { /* ignore */ }
        return;
    }

    if (el.classList && typeof el.classList.add === "function") {
        el.classList.add("lv-popover-closing");
    }
    try { if (typeof window !== "undefined") (window as any).__LV_SYNC_NOTICE_AVOIDANCE__?.(); } catch { /* ignore */ }
    setTimeout(() => {
        try { el.remove(); } catch { /* ignore */ }
        try { if (typeof window !== "undefined") (window as any).__LV_SYNC_NOTICE_AVOIDANCE__?.(); } catch { /* ignore */ }
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

export function getTodaySummary(items: ReadonlyArray<LvLaunchpadItem & { state?: "pinned" | "docked" | "hidden" }>): LvTodaySummary {
    const pillars = [
        {
            id: "checkin",
            pluginId: "siyuan-checkin",
            name: "习惯打卡",
            shortName: "打卡",
            color: "#10b981",
            iconSvg: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="fill:none!important;stroke:currentColor!important;" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none"/><path d="m9 12 2 2 4-4" fill="none"/></svg>`,
        },
        {
            id: "cards",
            pluginId: "siyuan-lv-cards",
            name: "卡片复习",
            shortName: "闪卡",
            color: "#f59e0b",
            iconSvg: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="fill:none!important;stroke:currentColor!important;" aria-hidden="true"><rect width="18" height="14" x="3" y="5" rx="2" fill="none"/><path d="M7 15h4M7 9h10" fill="none"/></svg>`,
        },
        {
            id: "home",
            pluginId: "siyuan-home",
            name: "生活到期",
            shortName: "管家",
            color: "#3b82f6",
            iconSvg: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="fill:none!important;stroke:currentColor!important;" aria-hidden="true"><rect width="18" height="18" x="3" y="4" rx="2" fill="none"/><line x1="16" x2="16" y1="2" y2="6" fill="none"/><line x1="8" x2="8" y1="2" y2="6" fill="none"/><line x1="3" x2="21" y1="10" y2="10" fill="none"/></svg>`,
        },
        {
            id: "glean",
            pluginId: "siyuan-glean",
            name: "稍后阅读",
            shortName: "拾遗",
            color: "#8b5cf6",
            iconSvg: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="fill:none!important;stroke:currentColor!important;" aria-hidden="true"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" fill="none"/><path d="M6 6h10M6 10h10" fill="none"/></svg>`,
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

export function toggleDesktopLaunchpadPopover(anchorEl?: HTMLElement | null): void {
    if (isDesktopPopoverOpen()) {
        closeDesktopLaunchpadPopover();
    } else {
        openDesktopLaunchpadPopover(anchorEl);
    }
}

function wireDesktopGlobalHotkey(): void {
    const bag = getLaunchpadRuntimeBag();
    if (bag.desktopGlobalHotkeyWired || typeof window === "undefined" || typeof window.addEventListener !== "function") return;
    bag.desktopGlobalHotkeyWired = true;
    bag.desktopGlobalHotkeyHandler = (e: KeyboardEvent) => {
        if (e && e.altKey && !e.ctrlKey && !e.metaKey && (e.key === "l" || e.key === "L")) {
            if (isMobileFrontend()) return;
            try { e.preventDefault(); e.stopPropagation(); } catch { /* ignore */ }
            toggleDesktopLaunchpadPopover();
        }

        if (e && e.altKey && e.ctrlKey && e.shiftKey && !e.metaKey && (e.key === "k" || e.key === "K")) {
            if (isMobileFrontend()) return;
            try { e.preventDefault(); e.stopPropagation(); } catch { /* ignore */ }
            toggleDesktopLaunchpadPopover();
        }
    };
    window.addEventListener("keydown", bag.desktopGlobalHotkeyHandler);
}

function insertDesktopEntryButton(toolbar: HTMLElement, btn: HTMLElement): void {
    if (!toolbar || !btn) return;

    const drag = toolbar.querySelector<HTMLElement>("#drag");
    const barMore = toolbar.querySelector<HTMLElement>("#barMore");
    const winCtrl = toolbar.querySelector<HTMLElement>("#windowControls");
    const barMainMenu = toolbar.querySelector<HTMLElement>("#barMainMenu") || toolbar.querySelector<HTMLElement>("#barWorkspace");
    if (!drag && !barMore && !winCtrl && !barMainMenu) {
        return;
    }
    if (!drag && !barMore && !winCtrl) {
        return;
    }

    if (btn.parentElement === toolbar && btn.isConnected) {
        const children = Array.from(toolbar.children || []);
        const dragIdx = children.findIndex((c) => c.id === "drag");
        const btnIdx = children.indexOf(btn);
        if (dragIdx !== -1 && btnIdx > dragIdx) {
            return;
        }
    }

    const duplicates: HTMLElement[] = typeof toolbar.querySelectorAll === "function" ? Array.from(toolbar.querySelectorAll<HTMLElement>("#" + DESKTOP_ENTRY_ID)) : [];
    if (duplicates.length > 0) {
        let kept = false;
        duplicates.forEach((el) => {
            if (!kept && (el === btn || !btn.isConnected)) {
                kept = true;
            } else {
                try { el.remove(); } catch { /* ignore */ }
            }
        });
        if (btn.isConnected && btn.parentElement === toolbar) {
            const children = Array.from(toolbar.children || []);
            const dragIdx = children.findIndex((c) => c.id === "drag");
            const btnIdx = children.indexOf(btn);
            if (dragIdx !== -1 && btnIdx > dragIdx) return;
        }
    }

    placeCompassInRightZone(toolbar, btn);
}

function buildDesktopEntryButton(forceRebuild = false): boolean {
    if (typeof document === "undefined" || isMobileFrontend() || !getLvEcosystemToggles().launchpad) return false;
    const toolbar = document.getElementById("toolbar");
    if (!toolbar) return false;
    if (document.getElementById(DESKTOP_ENTRY_ID)) { refreshEntryBadgeDot(); scheduleTopBarConvergence(80); return true; }

    if (!toolbar.querySelector("#drag") && !toolbar.querySelector("#barMore") && !toolbar.querySelector("#windowControls")) {
        wireDesktopToolbarObserver();
        return false;
    }

    const w = typeof window !== "undefined" ? (window as unknown as { __LV_DESKTOP_ENTRY_CREATING__?: boolean }) : null;
    if (w) {
        if (w.__LV_DESKTOP_ENTRY_CREATING__) return true;
        w.__LV_DESKTOP_ENTRY_CREATING__ = true;
    }

    try {

        if (!forceRebuild) {
            const nowGuard = Date.now();
            if (lastCompassRebuildAt && nowGuard - lastCompassRebuildAt < 250) {
                const bag = getLaunchpadRuntimeBag();
                if (bag.compassTrailingRetryTimer === null) {
                    const scheduleFn = typeof window !== "undefined" ? window.setTimeout : setTimeout;
                    bag.compassTrailingRetryTimer = Number(scheduleFn(() => {
                        bag.compassTrailingRetryTimer = null;
                        if (getSharedDesktopEntryOwners().size === 0) return;
                        if (!document.getElementById(DESKTOP_ENTRY_ID)) buildDesktopEntryButton();
                    }, 280));
                }
                return false;
            }
            lastCompassRebuildAt = nowGuard;
        }

        const btn = document.createElement("button");
        btn.type = "button";
        btn.id = DESKTOP_ENTRY_ID;
        btn.className = "toolbar__item ariaLabel";

        btn.setAttribute("data-location", "right");
        btn.setAttribute("aria-label", "小驴罗盘");
        btn.setAttribute("aria-haspopup", "dialog");
        btn.setAttribute("title", "小驴罗盘 · 全家桶极速直达 (左键展开 · 快捷键 1~8)");
        btn.style.position = "relative";

        const initialAllCount = getLaunchpadHub().getItems().length;
        btn.style.display = initialAllCount >= 1 ? "inline-flex" : "none";
        btn.innerHTML = entryInnerHtml("top:1px;right:1px;width:5.5px;height:5.5px");

        btn.addEventListener("click", () => {

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
    } finally {
        if (w) w.__LV_DESKTOP_ENTRY_CREATING__ = false;
    }
}

let desktopToolbarObserver: MutationObserver | null = null;
let desktopThemeObserver: MutationObserver | null = null;

/* ===== 罗盘保活哨兵（Compass Keep-Alive Sentry） =====
 * 思源在工作区切换/设置保存/布局加载等时机会整表重刷 #toolbar；虽然 MutationObserver
 * 会补位重建，但 observer 本身也可能被竞态断开（如旧实例清理误伤了共享观察器）。
 * 只要有任一存活小驴插件持有罗盘，就以 5s 低频哨兵兜底重校「存在 + 右侧锚位」，
 * 彻底杜绝"突然消失且不再回来"。共享单例挂 window，8 仓模块实例共用一个定时器。 */
let compassKeepAliveTimer: number | null = null;
function startCompassKeepAlive(): void {
    if (typeof window === "undefined") return;
    const w = window as unknown as { __LV_COMPASS_KEEPALIVE__?: number };
    if (w.__LV_COMPASS_KEEPALIVE__ || compassKeepAliveTimer) return;

    if (typeof window.setInterval !== "function" || typeof window.clearInterval !== "function") return;
    const tick = () => {
        try {
            if (typeof document !== "undefined" && document.hidden) return; // 页面隐藏失焦时杜绝空转开销
            if (getSharedDesktopEntryOwners().size === 0) { stopCompassKeepAlive(); return; }
            const btn = document.getElementById(DESKTOP_ENTRY_ID);
            if (!btn) {
                buildDesktopEntryButton(true);
                return;
            }
            const toolbar = document.getElementById("toolbar");
            if (toolbar && btn.parentElement === toolbar) ensureCompassOnRightSide(toolbar, btn);
        } catch { /* ignore */ }
    };
    compassKeepAliveTimer = Number(window.setInterval(tick, 30000));
    w.__LV_COMPASS_KEEPALIVE__ = compassKeepAliveTimer;
}
function stopCompassKeepAlive(): void {
    if (typeof window === "undefined") return;
    const w = window as unknown as { __LV_COMPASS_KEEPALIVE__?: number };
    if (compassKeepAliveTimer) { try { clearInterval(compassKeepAliveTimer); } catch { /* ignore */ } compassKeepAliveTimer = null; }
    if (w.__LV_COMPASS_KEEPALIVE__) { try { window.clearInterval(w.__LV_COMPASS_KEEPALIVE__); } catch { /* ignore */ } delete w.__LV_COMPASS_KEEPALIVE__; }
}

function wireDesktopToolbarObserver(): void {
    if (typeof document === "undefined" || isMobileFrontend()) return;
    const toolbar = document.getElementById("toolbar");
    if (!toolbar || typeof MutationObserver === "undefined") return;
    const w = typeof window !== "undefined" ? (window as unknown as { __LV_DESKTOP_TOOLBAR_OBS__?: MutationObserver; __LV_DESKTOP_THEME_OBS__?: MutationObserver }) : {};
    const bag = getLaunchpadRuntimeBag();

    if (!desktopToolbarObserver && !w.__LV_DESKTOP_TOOLBAR_OBS__) {
        desktopToolbarObserver = new MutationObserver(() => {
            if (bag.desktopToolbarDebounceTimer !== null || getSharedDesktopEntryOwners().size === 0) return;
            bag.desktopToolbarDebounceTimer = window.setTimeout(() => {
                bag.desktopToolbarDebounceTimer = null;
                if (getSharedDesktopEntryOwners().size === 0) return;
                if (!document.getElementById(DESKTOP_ENTRY_ID)) {
                    buildDesktopEntryButton();
                } else {
                    scheduleTopBarConvergence(120);
                }
            }, 150);
        });

        try {

            desktopToolbarObserver.observe(toolbar, { childList: true });
            w.__LV_DESKTOP_TOOLBAR_OBS__ = desktopToolbarObserver;
        } catch { /* ignore */ }
    }

    if (!desktopThemeObserver && !w.__LV_DESKTOP_THEME_OBS__ && document.documentElement) {
        desktopThemeObserver = new MutationObserver(() => {
            if (bag.desktopThemeDebounceTimer !== null || getSharedDesktopEntryOwners().size === 0) return;
            bag.desktopThemeDebounceTimer = window.setTimeout(() => {
                bag.desktopThemeDebounceTimer = null;
                if (getSharedDesktopEntryOwners().size === 0) return;
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
    if (typeof document === "undefined" || isIsolatedSettingsOrChildWindow()) return () => {};
    ensureStyles();
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
                if (getSharedDesktopEntryOwners().size === 0) return;
                if (!document.getElementById(DESKTOP_ENTRY_ID)) buildDesktopEntryButton();
            }, delay));
            desktopEntryRetryTimers.push(tid);
        }
        startCompassKeepAlive();
    } else {
        if (!document.getElementById(DESKTOP_ENTRY_ID)) {

            buildDesktopEntryButton(true);
        } else {
            scheduleTopBarConvergence(80);
        }
    }
    return () => {
        owners.delete(owner);
        desktopEntryRetryTimers.forEach((t) => { try { if (typeof window !== "undefined") window.clearTimeout(t); else clearTimeout(t); } catch { /* ignore */ } });
        desktopEntryRetryTimers = [];

        if (owners.size > 0) return;
        stopCompassKeepAlive();
        try {
            desktopToolbarObserver?.disconnect();
            if (typeof window !== "undefined") {
                const w = window as unknown as { __LV_DESKTOP_TOOLBAR_OBS__?: MutationObserver; __LV_TOPBAR_CONVERGENCE_TIMER__?: number | null };
                w.__LV_DESKTOP_TOOLBAR_OBS__?.disconnect();
                delete w.__LV_DESKTOP_TOOLBAR_OBS__;
                if (w.__LV_TOPBAR_CONVERGENCE_TIMER__ !== undefined && w.__LV_TOPBAR_CONVERGENCE_TIMER__ !== null) {
                    try { window.clearTimeout(w.__LV_TOPBAR_CONVERGENCE_TIMER__); } catch { /* ignore */ }
                    w.__LV_TOPBAR_CONVERGENCE_TIMER__ = null;
                }
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
        const bag = getLaunchpadRuntimeBag();
        const clr = (id: number | null | undefined) => {
            if (id !== null && id !== undefined) {
                try { if (typeof window !== "undefined") window.clearTimeout(id); else clearTimeout(id); } catch { /* ignore */ }
            }
        };
        clr(bag.desktopToolbarDebounceTimer);
        bag.desktopToolbarDebounceTimer = null;
        clr(bag.desktopThemeDebounceTimer);
        bag.desktopThemeDebounceTimer = null;
        clr(bag.compassTrailingRetryTimer);
        bag.compassTrailingRetryTimer = null;
        if (bag.desktopGlobalHotkeyHandler && typeof window !== "undefined" && typeof window.removeEventListener === "function") {
            window.removeEventListener("keydown", bag.desktopGlobalHotkeyHandler);
        }
        bag.desktopGlobalHotkeyHandler = null;
        bag.desktopGlobalHotkeyWired = false;
        cleanupSharedLaunchpadTickerIfIdle();
        closeDesktopLaunchpadPopover();
        try { document.getElementById(DESKTOP_ENTRY_ID)?.remove(); } catch { /* ignore */ }
    };
}

/* ===== 与思源原生移动端的冲突避让：原生/插件全屏对话框打开 / 文本输入聚焦（键盘弹起）时隐藏悬浮球 ===== */

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

    let cur: Element | null = el;
    for (let depth = 0; cur && depth < 12; depth++, cur = cur.parentElement) {
        if (cur === document.body) break;
        const htmlEl = cur as HTMLElement;
        if (htmlEl.hidden === true) return false;
        if (htmlEl.classList && typeof htmlEl.classList.contains === "function" && htmlEl.classList.contains("fn__none")) {
            return false;
        }
        if (htmlEl.style && htmlEl.style.display === "none") return false;
    }
    return true;
}

function updateBallSuppression(): void {
    if (typeof document === "undefined") return;
    const bag = getLaunchpadRuntimeBag();
    const ball = document.getElementById(MOBILE_BALL_ID);
    if (ball) {

        ball.classList.toggle("lv-ball-suppressed", bag.ballDialogOpen);
        if (bag.ballInputFocused && !bag.ballDialogOpen) {
            ball.classList.add("lv-ball-idle");
        }
    }
    const mobileEntry = document.getElementById(MOBILE_ENTRY_ID);
    if (mobileEntry) {
        mobileEntry.classList.toggle("lv-entry-suppressed", bag.ballDialogOpen);
    }
}

function recomputeBallSuppression(): void {
    if (typeof document === "undefined") return;
    const bag = getLaunchpadRuntimeBag();
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
    if (open !== bag.ballDialogOpen) bag.ballDialogOpen = open;
    const el = document.activeElement as HTMLElement | null;

    bag.ballInputFocused = Boolean(el) &&
        (el!.tagName === "INPUT" || el!.tagName === "TEXTAREA" || el!.isContentEditable === true);
    updateBallSuppression();
}

function wireMobileSuppression(): void {
    const bag = getLaunchpadRuntimeBag();
    if (bag.ballDialogObserver || typeof document === "undefined") return;

    if (typeof MutationObserver === "function") {
        bag.ballDialogObserver = new MutationObserver(() => {
            if (bag.ballDialogDebounceTimer !== undefined) return;
            const schedule = typeof window !== "undefined" && typeof window.setTimeout === "function" ? window.setTimeout : setTimeout;
            bag.ballDialogDebounceTimer = Number(schedule(() => {
                bag.ballDialogDebounceTimer = undefined;
                recomputeBallSuppression();
            }, 50));
        });
        try {

            bag.ballDialogObserver.observe(document.body, {
                childList: true,
                subtree: false,
            });
        } catch { /* ignore */ }
    }

    if (typeof document.addEventListener === "function") {
        bag.ballFocusHandler = () => recomputeBallSuppression();
        bag.ballBlurHandler = () => {
            const schedule = typeof window !== "undefined" && typeof window.setTimeout === "function" ? window.setTimeout : setTimeout;
            schedule(() => recomputeBallSuppression(), 40);
        };
        document.addEventListener("focusin", bag.ballFocusHandler, true);
        document.addEventListener("focusout", bag.ballBlurHandler, true);
    }
    recomputeBallSuppression();
}

function unwireMobileSuppression(): void {
    const bag = getLaunchpadRuntimeBag();
    if (bag.ballDialogDebounceTimer !== undefined) {
        try {
            if (typeof window !== "undefined" && typeof window.clearTimeout === "function") window.clearTimeout(bag.ballDialogDebounceTimer);
            else clearTimeout(bag.ballDialogDebounceTimer);
        } catch { /* ignore */ }
        bag.ballDialogDebounceTimer = undefined;
    }
    try { bag.ballDialogObserver?.disconnect(); } catch { /* ignore */ }
    bag.ballDialogObserver = undefined;
    if (typeof document !== "undefined" && typeof document.removeEventListener === "function") {
        if (bag.ballFocusHandler) {
            try { document.removeEventListener("focusin", bag.ballFocusHandler, true); } catch { /* ignore */ }
        }
        if (bag.ballBlurHandler) {
            try { document.removeEventListener("focusout", bag.ballBlurHandler, true); } catch { /* ignore */ }
        }
    }
    bag.ballFocusHandler = undefined;
    bag.ballBlurHandler = undefined;
    bag.ballDialogOpen = false;
    bag.ballInputFocused = false;
}

/* ===== 弹射坞关闭：190ms 下滑收场动画 + Android 返回手势/返回键联动 ===== */

function armSheetHistory(): void {
    const bag = getLaunchpadRuntimeBag();
    if (bag.sheetHistoryArmed || typeof window === "undefined") return;
    try {
        const hist = (window as unknown as { history?: History }).history;
        if (!hist || typeof hist.pushState !== "function") return;
        hist.pushState({ lvSheet: true }, "");
        bag.sheetHistoryArmed = true;
        bag.sheetPopHandler = () => {

            bag.sheetHistoryArmed = false;
            bag.sheetPopHandler = undefined;
            closeMobileSheet();
        };
        if (typeof window.addEventListener === "function") window.addEventListener("popstate", bag.sheetPopHandler);
    } catch { /* 历史不可用环境静默 */ }
}

function disarmSheetHistory(): void {
    const bag = getLaunchpadRuntimeBag();
    const hadHandler = Boolean(bag.sheetPopHandler) && typeof window !== "undefined" && typeof window.removeEventListener === "function";
    if (hadHandler && bag.sheetPopHandler) {
        try { window.removeEventListener("popstate", bag.sheetPopHandler); } catch { /* ignore */ }
    }
    bag.sheetPopHandler = undefined;
    if (bag.sheetHistoryArmed && typeof window !== "undefined") {
        bag.sheetHistoryArmed = false;
        try {
            const hist = (window as unknown as { history?: History & { state?: unknown } }).history;
            if (hist?.state?.lvSheet && typeof hist.back === "function") hist.back();
        } catch { /* ignore */ }
    }
}

function closeMobileSheet(immediate = false): void {
    if (typeof document === "undefined") return;
    const bag = getLaunchpadRuntimeBag();
    syncEntryOpenState(false);
    if (bag.sheetViewportCleanup) {
        try { bag.sheetViewportCleanup(); } catch { /* ignore */ }
        bag.sheetViewportCleanup = undefined;
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
        if (bag.sheetCloseTimer !== undefined) { try { window.clearTimeout(bag.sheetCloseTimer); } catch { /* ignore */ } bag.sheetCloseTimer = undefined; }
        try { mask.remove(); } catch { /* ignore */ }
        return;
    }
    mask.classList.add("lv-sheet-closing");
    if (bag.sheetCloseTimer !== undefined) { try { window.clearTimeout(bag.sheetCloseTimer); } catch { /* ignore */ } }
    bag.sheetCloseTimer = window.setTimeout(() => {
        bag.sheetCloseTimer = undefined;

        const current = document.getElementById(MOBILE_SHEET_ID);
        if (current === mask) { try { mask.remove(); } catch { /* ignore */ } }
    }, 190);
}

const MOBILE_RECENT_KEY = "lv_launchpad_recent_tiles";
const MOBILE_RECENT_MAX = 6;
const MOBILE_SEARCH_HISTORY_KEY = "lv_launchpad_search_history";
const MOBILE_SEARCH_HISTORY_MAX = 6;

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

function resolveIconHref(svgIcon?: string): string | null {
    if (!svgIcon || typeof document === "undefined") return null;
    for (const id of iconIdCandidates(svgIcon)) {
        try {
            if (document.getElementById(id)) return `#${id}`;
        } catch { /* ignore */ }
    }

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

function dismissActiveMobilePluginDialogs(): void {
    if (typeof document === "undefined" || !isMobileFrontend()) return;
    try {
        const selectors = [
            ".b3-dialog__container.lc-checkin-dialog",
            ".b3-dialog__container.lvct-mobile-dialog",
            ".b3-dialog__container.glean-dialog--fullscreen",
            ".lv-hub-mobile-dialog",
            ".lv-review-mobile-dialog",
            ".b3-dialog__container.lv-exam-dialog",
            ".b3-dialog__container.sw-mobile-switcher-dialog",
            ".b3-dialog__container.xlc-sheet",
        ];
        const openContainers = new Set<HTMLElement>();
        document.querySelectorAll<HTMLElement>(selectors.join(", ")).forEach((el) => openContainers.add(el));
        document.querySelectorAll<HTMLElement>(".lv-mobile-host").forEach((host) => {
            const c = host.closest?.(".b3-dialog__container") as HTMLElement | null;
            if (c) openContainers.add(c);
        });
        openContainers.forEach((container) => {
            const closeEl = container.querySelector<HTMLElement>(".b3-dialog__close")
                || container.closest(".b3-dialog--open")?.querySelector<HTMLElement>(".b3-dialog__close");
            if (closeEl) {
                closeEl.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
            }
        });
    } catch { /* ignore */ }
}

export function buildLaunchpadPopoverHtml(items: ReadonlyArray<LvLaunchpadItem & { state: "pinned" | "docked" | "hidden" }>, isMobile: boolean, opts?: LvPopoverBuildOptions): string { return getInitializedChunkSync("lv-kit-compass")?.buildLaunchpadPopoverHtml(items, isMobile, opts) ?? ""; }
export function openDesktopLaunchpadPopover(anchorEl?: HTMLElement | null): void { if (getLvEcosystemToggles().launchpad) runWithCompassChunk((c) => c.openDesktopLaunchpadPopover(anchorEl)); }
export function openMobileSheet(): void { if (getLvEcosystemToggles().launchpad) runWithCompassChunk((c) => c.openMobileSheet()); }
export function openConflictResolverDialog(): void { runWithCompassChunk((c) => c.openConflictResolverDialog()); }
export function openQuickNoteDialog(initialPrefix = ""): void { runWithCompassChunk((c) => c.openQuickNoteDialog(initialPrefix)); }
export function openLifeLogDialog(): void { runWithCompassChunk((c) => c.openLifeLogDialog()); }
export function openQuickWorkspaceConfig(initialTab = "topbar"): void { runWithCompassChunk((c) => c.openQuickWorkspaceConfig(initialTab)); }
export function openTaskManager(): void { runWithCompassChunk((c) => c.openTaskManager()); }
export async function openNewTask(): Promise<void> { return await (await loadLvKitChunk("lv-kit-compass")).openNewTask(); }
export async function reloadUI(): Promise<void> { return await (await loadLvKitChunk("lv-kit-compass")).reloadUI(); }
export async function randomWalk(): Promise<void> { return await (await loadLvKitChunk("lv-kit-compass")).randomWalk(); }
export async function pasteToDailyNote(): Promise<void> { return await (await loadLvKitChunk("lv-kit-compass")).pasteToDailyNote(); }
export async function openDiaryBottom(): Promise<void> { return await (await loadLvKitChunk("lv-kit-compass")).openDiaryBottom(); }
export async function compressAndPutImageFile(file: File | Blob, stampBase: string, idx: number): Promise<{ path: string; thumb: string } | null> { return await (await loadLvKitChunk("lv-kit-compass")).compressAndPutImageFile(file, stampBase, idx); }

export function showMessage(message: string, timeout = 3000, type: "info" | "error" = "info", source?: string): void {
    const raw = String(message ?? "");
    if (type === "error") {
        lvNotify.card({ source, title: source ? `${source}提示` : undefined, message: raw, level: "error", duration: Math.max(timeout, 6000) });
    } else {
        lvNotify.capsule({ source, message: raw, duration: timeout });
    }
}

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
                lifeLogDocumentId: typeof data.lifeLogDocumentId === "string" ? data.lifeLogDocumentId : undefined,
                lifeLogDocumentTitle: typeof data.lifeLogDocumentTitle === "string" ? data.lifeLogDocumentTitle : undefined,
                diaryNotebookId: typeof data.diaryNotebookId === "string" ? data.diaryNotebookId : undefined,
                quickNoteNotebookId: typeof data.quickNoteNotebookId === "string" ? data.quickNoteNotebookId : undefined,
                quickNoteDocumentId: typeof data.quickNoteDocumentId === "string" ? data.quickNoteDocumentId : undefined,
                quickNoteDocumentTitle: typeof data.quickNoteDocumentTitle === "string" ? data.quickNoteDocumentTitle : undefined,
                quickNoteAttachMode: data.quickNoteAttachMode === "local-link" ? "local-link" : "assets",
                diaryZoneDefaultFolded: data.diaryZoneDefaultFolded !== undefined ? Boolean(data.diaryZoneDefaultFolded) : undefined,
                diaryZoneHeadingLevel: data.diaryZoneHeadingLevel === 3 ? 3 : (data.diaryZoneHeadingLevel === 4 ? 4 : undefined),
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
    const normalizeKernelResponse = (raw: any): { code: number; msg: string; data?: any } => {
        if (!raw || typeof raw !== "object") {
            return { code: -1, msg: "内核返回异常" };
        }
        if (typeof raw.code === "number") {
            return { code: raw.code, msg: typeof raw.msg === "string" ? raw.msg : "", data: raw.data };
        }
        return { code: -1, msg: typeof raw.msg === "string" ? raw.msg : "内核返回缺少状态码", data: raw.data };
    };

    const isAi = endpoint.startsWith("/api/ai/") || endpoint.includes("/ai/chat");
    if (!isAi) {
        try {
            const hostApi = typeof window !== "undefined" ? (window as any).__LV_HOST_API__ : null;
            if (hostApi && typeof hostApi.fetchSyncPost === "function") {
                return normalizeKernelResponse(await hostApi.fetchSyncPost(endpoint, payload));
            }
            if (typeof (globalThis as any).fetchSyncPost === "function") {
                return normalizeKernelResponse(await (globalThis as any).fetchSyncPost(endpoint, payload));
            }
            const sy = safeRequire("siyuan");
            if (sy && typeof sy.fetchSyncPost === "function") {
                return normalizeKernelResponse(await sy.fetchSyncPost(endpoint, payload));
            }
        } catch (err) {
            let msg = "请求异常";
            try { msg = err instanceof Error ? (err.message || msg) : String(err); } catch { /* ignore */ }
            return { code: -1, msg };
        }
    }
    try {
        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const json = await res.json().catch((): any => null);
        if (!res.ok) {
            if (json && typeof json === "object" && typeof json.code === "number" && json.code !== 0) {
                return { code: json.code, msg: typeof json.msg === "string" ? json.msg : `HTTP ${res.status}`, data: json.data };
            }
            return { code: -1, msg: (json && typeof json.msg === "string" && json.msg) ? json.msg : `HTTP ${res.status}` };
        }
        return normalizeKernelResponse(json);
    } catch (err) {
        let msg = "请求异常";
        try { msg = err instanceof Error ? (err.message || "请求异常") : String(err); } catch { /* ignore */ }
        return { code: -1, msg };
    }
}

export async function lvAiPost(
    endpoint: string,
    payload: Record<string, unknown>,
    options?: { signal?: AbortSignal; timeoutMs?: number }
): Promise<{ code: number; msg: string; data?: any }> {
    const endAiWait = beginLvAiWaitSession();
    const timeoutMs = options?.timeoutMs ?? 90000;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const onAbort = () => ctrl.abort();
    if (options?.signal) {
        if (options.signal.aborted) ctrl.abort();
        else options.signal.addEventListener("abort", onAbort, { once: true });
    }
    try {
        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err: any) {
        if (ctrl.signal.aborted && options?.signal?.aborted) {
            throw new Error("AI request aborted");
        }
        if (ctrl.signal.aborted) {
            throw new Error(`AI request timeout after ${timeoutMs}ms`);
        }
        throw err;
    } finally {
        clearTimeout(timer);
        if (options?.signal) options.signal.removeEventListener("abort", onAbort);
        endAiWait();
    }
}

export interface LvAiStageDefinition {
    afterSec: number;
    text: string;
    icon?: string;
}

export type LvAiPresetScenario = "socratic" | "question-gen" | "extract-contacts" | "transform" | "doc-judge" | "general";

export function getLvAiPresetStages(scenario: LvAiPresetScenario): LvAiStageDefinition[] {
    const c = getInitializedChunkSync("lv-kit-ai-hub");
    if (c?.getLvAiPresetStages) return c.getLvAiPresetStages(scenario);
    return [{ afterSec: 0, text: "🧠 正在连接 AI 引擎并读取上下文…", icon: "🧠" }];
}

export function syncLvAiProgressSuppression(): void { getInitializedChunkSync("lv-kit-ai-hub")?.syncLvAiProgressSuppression?.(); }
export function installLvAiProgressSuppressor(): () => void { const c = getInitializedChunkSync("lv-kit-ai-hub"); return c ? c.installLvAiProgressSuppressor() : (() => {}); }
function beginLvAiWaitSession(): () => void { const c = getInitializedChunkSync("lv-kit-ai-hub"); return c?.beginLvAiWaitSession ? c.beginLvAiWaitSession() : (() => {}); }
export interface LvAiProgressState { elapsedSec: number; stageText: string; stageIcon: string; busy: boolean; }
export interface LvAiProgressTracker { getElapsedSec: () => number; getStageText: () => string; getStageIcon: () => string; getState: () => LvAiProgressState; stop: () => void; dispose: () => void; renderThinkingCardHtml: (cardOpts?: any) => string; }
export interface LvAiThinkingMountOptions { scenario?: LvAiPresetScenario; stages?: LvAiStageDefinition[]; defaultIcon?: string; title?: string; subtitle?: string; cancelLabel?: string | false; compact?: boolean; extraClass?: string; signal?: AbortSignal; onCancel?: () => void; replaceContent?: boolean; }
export interface LvAiThinkingCardHandle { update: (p: any) => void; done: (o?: { keepDom?: boolean }) => void; destroy: () => void; cancel: () => void; readonly signal: AbortSignal; readonly aborted: boolean; readonly element: HTMLElement | null; readonly tracker: LvAiProgressTracker; }
export interface LvAiWaitOverlayOptions extends Omit<LvAiThinkingMountOptions, "replaceContent" | "compact"> { closeOnEsc?: boolean; closeOnMaskClick?: boolean; showCloseButton?: boolean; id?: string; }
export interface LvAiWaitOverlayHandle extends LvAiThinkingCardHandle { readonly mask: HTMLElement | null; }
function createSafeAbortController(): AbortController {
    if (typeof AbortController !== "undefined") return new AbortController();
    const ls = new Set<() => void>();
    const sig: any = { aborted: false, reason: undefined, addEventListener(_t: string, f: any) { if (typeof f === "function") ls.add(f); }, removeEventListener(_t: string, f: any) { ls.delete(f); }, dispatchEvent() { return true; }, onabort: null, throwIfAborted() { if (sig.aborted) throw sig.reason ?? new Error("Aborted"); } };
    return { signal: sig, abort(r?: any) { if (sig.aborted) return; sig.aborted = true; sig.reason = r; ls.forEach((f) => { try { f(); } catch {} }); try { sig.onabort?.(); } catch {} } } as AbortController;
}
export function createLvAiProgressTracker(options: any = {}): LvAiProgressTracker {
    const c = getInitializedChunkSync("lv-kit-ai-hub");
    if (c) return c.createLvAiProgressTracker(options);
    ensureStyles();
    return { getElapsedSec: () => 0, getStageText: () => "正在思考…", getStageIcon: () => "✨", getState: () => ({ elapsedSec: 0, stageText: "正在思考…", stageIcon: "✨", busy: false }), stop: () => {}, dispose: () => {}, renderThinkingCardHtml: () => "" };
}
export function mountLvAiThinkingCard(container: HTMLElement | null | undefined, options: LvAiThinkingMountOptions = {}): LvAiThinkingCardHandle {
    const c = getInitializedChunkSync("lv-kit-ai-hub");
    if (c) return c.mountLvAiThinkingCard(container, options);
    const ctrl = createSafeAbortController();
    return { update() {}, done() {}, destroy() {}, cancel() { ctrl.abort(); }, get signal(): AbortSignal { return ctrl.signal; }, get aborted(): boolean { return ctrl.signal.aborted; }, get element(): HTMLElement | null { return null; }, tracker: createLvAiProgressTracker({ skipSuppressor: true }) };
}
export function openLvAiWaitOverlay(options: LvAiWaitOverlayOptions = {}): LvAiWaitOverlayHandle {
    const c = getInitializedChunkSync("lv-kit-ai-hub");
    if (c) return c.openLvAiWaitOverlay(options);
    return { ...mountLvAiThinkingCard(null, options), get mask(): HTMLElement | null { return null; } };
}
export async function withLvAiWait<T>(options: LvAiWaitOverlayOptions & { container?: HTMLElement | null; compact?: boolean; replaceContent?: boolean }, taskFn: (signal: AbortSignal, controls: LvAiThinkingCardHandle) => Promise<T>): Promise<T> {
    const c = getInitializedChunkSync("lv-kit-ai-hub") ?? (await loadLvKitChunk("lv-kit-ai-hub").catch((): any => null));
    if (c) return await c.withLvAiWait(options, taskFn);
    return await taskFn(createSafeAbortController().signal, mountLvAiThinkingCard(null, options));
}

const CATEGORY_EMOJI_MAP: Record<string, string> = {
    "日记": "📔", "工作": "💼", "家庭": "🏠", "思考": "💡", "记录": "📝",
    "学习": "📚", "运动": "🏃", "生活": "☕", "阅读": "📖", "灵感": "✨",
    "随笔": "✍️", "复盘": "🎯"
};

function getCategoryEmoji(cat: string): string {
    return CATEGORY_EMOJI_MAP[cat] || "🏷️";
}

function queryActiveProtyle(): HTMLElement | null {
    if (typeof document === "undefined" || typeof document.querySelector !== "function") return null;
    try {
        return (
            document.querySelector<HTMLElement>(".layout__wnd--active .protyle:not(.fn__none)") ||
            document.querySelector<HTMLElement>(".layout__wnd--active .protyle") ||
            document.querySelector<HTMLElement>(".protyle:not(.fn__none)") ||
            document.querySelector<HTMLElement>(".protyle")
        );
    } catch {
        return null;
    }
}

function getCurrentOpenDocInfo(): { id: string; title: string } | null {
    if (typeof document === "undefined") return null;
    try {
        const activeProtyle = queryActiveProtyle();
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

export type LvDailyNotePostFn = (
    endpoint: string,
    payload: Record<string, unknown>
) => Promise<{ code?: number; msg?: string; data?: any }>;

export interface LvDailyNoteResolveOptions {
    date?: Date;
    postFn?: LvDailyNotePostFn;
    getNow?: () => Date;
    strictNotebook?: boolean;
    strictSprig?: boolean;
    skipNormalize?: boolean;
    cacheScope?: object;
}

export interface LvDailyNoteFindOrCreateOptions extends LvDailyNoteResolveOptions {
    skipPreLockProbe?: boolean;
    expectedNotebookId?: string;
    expectedYmd?: string;
}

async function listOpenNotebooks(force = false, postFn?: LvDailyNotePostFn): Promise<Array<{ id: string; name: string }>> {
    const now = Date.now();
    if (!force && !postFn && cachedOpenNotebooks.length > 0 && now - lastNotebooksFetchTime < 30_000) {
        return cachedOpenNotebooks;
    }
    const post = postFn ?? lvKernelPost;
    try {
        const res = await post("/api/notebook/lsNotebooks", {});
        const nbs = res?.data?.notebooks;
        if (Array.isArray(nbs) && nbs.length > 0) {
            const list = nbs
                .filter((nb: any) => nb && nb.id && !nb.closed)
                .map((nb: any) => ({ id: String(nb.id).trim(), name: String(nb.name || nb.id) }));
            if (!postFn) {
                cachedOpenNotebooks = list;
                lastNotebooksFetchTime = now;
            }
            return list;
        }
    } catch { /* ignore */ }
    return postFn ? [] : cachedOpenNotebooks;
}

export async function resolveDailyNotebookId(postFn?: LvDailyNotePostFn): Promise<string> {
    const conf = getQuickWorkspaceConfig();
    const explicit = conf.lifeLogNotebookId?.trim() || conf.diaryNotebookId?.trim() || conf.quickNoteNotebookId?.trim();
    if (explicit) return explicit;

    const post = postFn ?? lvKernelPost;
    const now = Date.now();
    try {
        if (typeof window !== "undefined") {
            const w = window as any;
            const stored = w.siyuan?.storage?.["local-dailynoteid"]
                || (w.siyuan?.config?.note as any)?.dailyNote?.notebook
                || (w.siyuan?.config?.general as any)?.dailyNote?.notebook;
            if (stored && typeof stored === "string" && stored.trim()) {
                if (!postFn) {
                    cachedDailyNotebookId = stored.trim();
                    lastNotebookCheckTime = now;
                }
                return stored.trim();
            }
            const ls = getSafeLocalStorage();
            const lsId = ls?.getItem("local-dailynoteid");
            if (lsId && typeof lsId === "string" && lsId.trim()) {
                if (!postFn) {
                    cachedDailyNotebookId = lsId.trim();
                    lastNotebookCheckTime = now;
                }
                return lsId.trim();
            }
        }
    } catch { /* ignore */ }

    if (!postFn && cachedDailyNotebookId && now - lastNotebookCheckTime < 60000) {
        return cachedDailyNotebookId;
    }

    try {
        const sqlRes = await post("/api/query/sql", {
            stmt: "SELECT box FROM blocks WHERE type='d' AND (ial LIKE '%custom-dailynote-%' OR hpath LIKE '%/daily note/%' OR hpath LIKE '%/日记/%') AND box != '' AND content NOT LIKE '%(冲突%' AND content NOT LIKE '%conflict%' AND content NOT LIKE '%(Conflicted%' AND hpath NOT LIKE '%(冲突%' AND hpath NOT LIKE '%conflict%' AND hpath NOT LIKE '%(Conflicted%' ORDER BY updated DESC LIMIT 1",
        });
        if (sqlRes.code === 0 && Array.isArray(sqlRes.data) && sqlRes.data[0]?.box) {
            const candidateBox = String(sqlRes.data[0].box).trim();
            const openNbs = await listOpenNotebooks(false, postFn);
            const match = openNbs.find((nb) => nb.id === candidateBox && !/管家|人脉|题库|闪卡|拾遗|生态|空间|exam|contacts|home|checkin|glean/i.test(nb.name));
            if (match && match.id) {
                if (!postFn) {
                    cachedDailyNotebookId = match.id;
                    lastNotebookCheckTime = now;
                }
                return match.id;
            }
        }
    } catch { /* ignore */ }

    try {
        const openNbs = await listOpenNotebooks(false, postFn);
        if (openNbs.length > 0) {

            const preferred = openNbs.find((nb) => /^(日记|Daily|Journal|我的笔记|默认)/i.test(nb.name))
                || openNbs.find((nb) => /日记|daily\s*note|journal/i.test(nb.name) && !/管家|人脉|题库|闪卡|拾遗|生态|空间|exam|contacts|home|checkin|glean/i.test(nb.name))
                || openNbs.find((nb) => !/管家|人脉|题库|闪卡|拾遗|生态|空间|exam|contacts|home|checkin|glean/i.test(nb.name))
                || openNbs[0];
            if (preferred && preferred.id) {
                if (!postFn) {
                    cachedDailyNotebookId = preferred.id;
                    lastNotebookCheckTime = now;
                }
                return preferred.id;
            }
        }
    } catch { /* ignore */ }

    return "";
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

export async function openBlockById(blockId: string, rootId?: string): Promise<boolean> {
    if (!blockId) return false;
    const isMobile = isMobileFrontend();
    try {
        const sy = (window as any).siyuan;
        const hostApi = (window as any).__LV_HOST_API__;
        const app = hostApi?.app || sy?.app || (window as any).siyuanApp;
        if (!isMobile) {
            const openTabFn = hostApi?.openTab || (window as any).openTab;
            if (typeof openTabFn === "function") {
                await openTabFn({
                    app,
                    doc: { id: rootId || blockId, action: ["cb-get-hl", "cb-get-focus"] },
                    blockId: blockId !== rootId ? blockId : undefined,
                });
                return true;
            }
        }
    } catch { /* ignore */ }
    return openDocumentById(blockId);
}

interface DailyNoteSingleFlightResult {
    docId: string;
    ymd: string;
    notebookId: string;
}

interface DailyNoteCacheBucket {
    ymd: string;
    notebookId: string;
    docId: { date: string; ymd: string; notebookId: string; docId: string } | null;
    flightMap: Map<string, Promise<DailyNoteSingleFlightResult | null>>;
}

const dailyNoteCreatingMap = new Map<string, Promise<DailyNoteSingleFlightResult | null>>();
const defaultDailyNoteBucket: DailyNoteCacheBucket = {
    ymd: "",
    notebookId: "",
    docId: null,
    flightMap: dailyNoteCreatingMap,
};
const scopedDailyNoteBuckets = new WeakMap<object, DailyNoteCacheBucket>();

function getDailyNoteBucket(cacheScope?: object): DailyNoteCacheBucket {
    if (!cacheScope) return defaultDailyNoteBucket;
    let bucket = scopedDailyNoteBuckets.get(cacheScope);
    if (!bucket) {
        bucket = {
            ymd: "",
            notebookId: "",
            docId: null,
            flightMap: new Map<string, Promise<DailyNoteSingleFlightResult | null>>(),
        };
        scopedDailyNoteBuckets.set(cacheScope, bucket);
    }
    return bucket;
}

export type DailyNoteProbeResult =
    | { status: "found"; docId: string }
    | { status: "confirmed-missing"; notebookId: string; ymd: string }
    | { status: "unknown"; reason: string };

export function invalidateTodayDailyNoteCache(cacheScope?: object): void {
    const bucket = getDailyNoteBucket(cacheScope);
    bucket.ymd = "";
    bucket.notebookId = "";
    bucket.docId = null;
}

export async function findTodayDailyNoteProbe(notebook?: string, opts?: LvDailyNoteResolveOptions): Promise<DailyNoteProbeResult>;
export async function findTodayDailyNoteProbe(notebook?: string, d?: Date, opts?: LvDailyNoteResolveOptions): Promise<DailyNoteProbeResult>;
export async function findTodayDailyNoteProbe(notebook?: string, optsOrDate?: LvDailyNoteResolveOptions | Date, extraOpts?: LvDailyNoteResolveOptions): Promise<DailyNoteProbeResult> {
    const opts = optsOrDate instanceof Date ? { ...(extraOpts || {}), date: optsOrDate } : optsOrDate;
    return await (await loadLvKitChunk("lv-kit-compass")).findTodayDailyNoteProbe(notebook, opts);
}
export async function findTodayDailyNoteDocId(notebook?: string, opts?: LvDailyNoteResolveOptions): Promise<string | null>;
export async function findTodayDailyNoteDocId(notebook?: string, d?: Date, opts?: LvDailyNoteResolveOptions): Promise<string | null>;
export async function findTodayDailyNoteDocId(notebook?: string, optsOrDate?: LvDailyNoteResolveOptions | Date, extraOpts?: LvDailyNoteResolveOptions): Promise<string | null> {
    const opts = optsOrDate instanceof Date ? { ...(extraOpts || {}), date: optsOrDate } : optsOrDate;
    return await (await loadLvKitChunk("lv-kit-compass")).findTodayDailyNoteDocId(notebook, opts);
}
export async function findOrCreateTodayDailyNoteDocId(notebook?: string, opts?: LvDailyNoteFindOrCreateOptions): Promise<string | null>;
export async function findOrCreateTodayDailyNoteDocId(notebook?: string, d?: Date, opts?: LvDailyNoteFindOrCreateOptions): Promise<string | null>;
export async function findOrCreateTodayDailyNoteDocId(notebook?: string, optsOrDate?: LvDailyNoteFindOrCreateOptions | Date, extraOpts?: LvDailyNoteFindOrCreateOptions): Promise<string | null> {
    const opts = optsOrDate instanceof Date ? { ...(extraOpts || {}), date: optsOrDate } : optsOrDate;
    return await (await loadLvKitChunk("lv-kit-compass")).findOrCreateTodayDailyNoteDocId(notebook, opts);
}
export async function ensureXiaolvDiaryZone(docId: string, opts?: EnsureXiaolvDiaryZoneOptions): Promise<EnsureXiaolvDiaryZoneResult> {
    return await (await loadLvKitChunk("lv-kit-compass")).ensureXiaolvDiaryZone(docId, opts);
}
export const XIAOLV_DIARY_ZONE_ATTR = "custom-lv-diary-zone";
export const XIAOLV_DIARY_ZONE_HEADING = "#### 🐴 小驴记录";
const XIAOLV_DIARY_ZONE_CONFIG_KEY = "lv_diary_zone_config_v1";

export interface XiaolvDiaryZoneConfig {
    defaultFolded: boolean;
    headingLevel: 3 | 4;
}

export interface EnsureXiaolvDiaryZoneOptions {
    defaultFolded?: boolean;
    headingLevel?: 3 | 4;
    postFn?: (endpoint: string, payload: Record<string, unknown>) => Promise<{ code: number; msg?: string; data?: any }>;
}

export interface EnsureXiaolvDiaryZoneResult {
    ok: boolean;
    docId: string;
    zoneHeadingId: string;
    anchorBlockId: string;
    insertPosition: "after";
    created: boolean;
    folded: boolean;
    headingLevel: 3 | 4;
}

let inMemoryXiaolvDiaryZoneConfig: XiaolvDiaryZoneConfig = {
    defaultFolded: true,
    headingLevel: 4,
};

export function getXiaolvDiaryZoneConfig(): XiaolvDiaryZoneConfig {
    const ls = getSafeLocalStorage();
    if (ls) {
        try {
            const raw = ls.getItem(XIAOLV_DIARY_ZONE_CONFIG_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as Record<string, unknown>;
                const headingLevel: 3 | 4 = parsed.headingLevel === 3 ? 3 : 4;
                const defaultFolded = parsed.defaultFolded !== false;
                inMemoryXiaolvDiaryZoneConfig = { defaultFolded, headingLevel };
                return { ...inMemoryXiaolvDiaryZoneConfig };
            }
        } catch { /* ignore */ }
    }
    const qw = getQuickWorkspaceConfig();
    if (qw.diaryZoneHeadingLevel || qw.diaryZoneDefaultFolded !== undefined) {
        inMemoryXiaolvDiaryZoneConfig = {
            defaultFolded: qw.diaryZoneDefaultFolded !== false,
            headingLevel: qw.diaryZoneHeadingLevel === 3 ? 3 : 4,
        };
    }
    return { ...inMemoryXiaolvDiaryZoneConfig };
}

export function setXiaolvDiaryZoneConfig(patch: {
    defaultFolded?: boolean;
    headingLevel?: 3 | 4;
}): XiaolvDiaryZoneConfig {
    const cur = getXiaolvDiaryZoneConfig();
    const next: XiaolvDiaryZoneConfig = {
        defaultFolded: patch.defaultFolded !== undefined ? Boolean(patch.defaultFolded) : cur.defaultFolded,
        headingLevel: patch.headingLevel === 3 ? 3 : (patch.headingLevel === 4 ? 4 : cur.headingLevel),
    };
    inMemoryXiaolvDiaryZoneConfig = next;
    const ls = getSafeLocalStorage();
    if (ls) {
        try {
            ls.setItem(XIAOLV_DIARY_ZONE_CONFIG_KEY, JSON.stringify(next));
        } catch { /* ignore */ }
    }
    saveQuickWorkspaceConfig({
        diaryZoneDefaultFolded: next.defaultFolded,
        diaryZoneHeadingLevel: next.headingLevel,
    });
    return { ...next };
}

function parseKitIalMap(ial: unknown): Record<string, string> {
    if (!ial) return {};
    if (typeof ial === "object" && !Array.isArray(ial)) {
        const out: Record<string, string> = {};
        for (const [k, v] of Object.entries(ial as Record<string, unknown>)) {
            if (v !== undefined && v !== null) out[k] = String(v);
        }
        return out;
    }
    const raw = String(ial);
    const out: Record<string, string> = {};
    for (const m of raw.matchAll(/([a-zA-Z0-9-]+)="([^"]*)"/g)) {
        const key = m[1];
        if (!key) continue;
        out[key] = (m[2] ?? "")
            .replace(/&quot;/g, '"')
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&");
    }
    return out;
}

export interface XiaolvLifeLogEntry {
    time?: string;
    date?: string;
    type: string;
    icon?: string;
    body: string;
    tags?: string[];
    refDocId?: string;
    refDocTitle?: string;
    source?: string;
    module?: string;
    eventId?: string;
    target?: string;
    amount?: string | number;
    quantity?: string | number;
    odometer?: string | number;
    extraAttrs?: Record<string, string>;
    notebook?: string;
    docId?: string;
    useDiaryZone?: boolean;
}

export interface ParsedXiaolvLifeLog {
    blockId: string;
    docId?: string;
    time: string;
    date: string;
    type: string;
    body: string;
    tags: string[];
    refDocId?: string;
    refDocTitle?: string;
    source: string;
    module: string;
    eventId?: string;
    target?: string;
    amount?: string;
    quantity?: string;
    odometer?: string;
    rawContent: string;
    attrs: Record<string, string>;
    isLegacy: boolean;
}

function normalizeKitLifeLogType(rawType: string): string {
    return String(rawType || "日常记录")
        .replace(/[\r\n\s]+/g, " ")
        .replace(/[：:]/g, "-")
        .trim() || "日常记录";
}

function escapeKitIalValue(v: string): string {
    return String(v ?? "").replace(/[\r\n]+/g, " ").replace(/"/g, "&quot;");
}

function validateKitCustomAttrMap(attrs: Record<string, string>): Record<string, string> {
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(attrs)) {
        if (!/^custom-[a-z][a-z0-9-]*$/.test(k)) {
            throw new Error(`[DIARY-ATTR-INVALID] Illegal custom attribute name "${k}"`);
        }
        if (v !== undefined && v !== null) {
            clean[k] = String(v);
        }
    }
    return clean;
}

export function buildXiaolvLifeLogAttrs(entry: XiaolvLifeLogEntry): Record<string, string> {
    const pad = (v: number) => String(v).padStart(2, "0");
    const now = new Date();
    const dateStr = (entry.date || `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`).slice(0, 10);
    const timeStr = entry.time || `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const cleanType = normalizeKitLifeLogType(entry.type);
    const cleanSource = String(entry.source || "lv-launchpad").trim() || "lv-launchpad";
    const cleanModule = String(entry.module || "lifelog").trim() || "lifelog";
    const eventId = String(
        entry.eventId ||
        `ll-${cleanSource.replace(/[^a-zA-Z0-9_-]/g, "")}-${cleanModule.replace(/[^a-zA-Z0-9_-]/g, "")}-${dateStr.replace(/-/g, "")}-${timeStr.replace(/:/g, "")}-${Math.random().toString(36).slice(2, 8)}`
    ).trim();
    const attrs: Record<string, string> = {
        "custom-lifelog-type": cleanType,
        "custom-lv-lifelog": "1",
        "custom-lv-source": cleanSource,
        "custom-lv-module": cleanModule,
        "custom-lv-event-id": eventId,
        "custom-lv-date": dateStr,
    };
    if (entry.target !== undefined && String(entry.target).trim() !== "") {
        attrs["custom-lv-target"] = String(entry.target).trim();
    }
    if (entry.amount !== undefined && String(entry.amount).trim() !== "") {
        attrs["custom-lv-amount"] = String(entry.amount).trim();
    }
    if (entry.quantity !== undefined && String(entry.quantity).trim() !== "") {
        attrs["custom-lv-quantity"] = String(entry.quantity).trim();
    }
    if (entry.odometer !== undefined && String(entry.odometer).trim() !== "") {
        attrs["custom-lv-odometer"] = String(entry.odometer).trim();
    }
    if (entry.extraAttrs) {
        for (const [k, v] of Object.entries(entry.extraAttrs)) {
            attrs[k] = v;
        }
    }
    return validateKitCustomAttrMap(attrs);
}

export function formatXiaolvLifeLogText(entry: XiaolvLifeLogEntry): string {
    const pad = (v: number) => String(v).padStart(2, "0");
    const now = new Date();
    const timeStr = entry.time || `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const cleanType = normalizeKitLifeLogType(entry.type);
    const cleanIcon = entry.icon ? String(entry.icon).trim() : "";
    const typeLabel = cleanIcon && !cleanType.startsWith(cleanIcon) ? `${cleanIcon} ${cleanType}` : cleanType;
    const cleanBody = String(entry.body || "已记录").replace(/[\r\n\s]+/g, " ").trim() || "已记录";
    const tagsPart = entry.tags?.length
        ? ` ${entry.tags.map((t) => String(t).trim()).filter(Boolean).map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ")}`
        : "";
    const refPart = entry.refDocId
        ? ` ((${entry.refDocId} "${(entry.refDocTitle || "查看台账").replace(/"/g, "'")}"))`
        : "";
    return `${timeStr} ${typeLabel}：${cleanBody}${tagsPart}${refPart}`;
}

export function formatXiaolvLifeLogMarkdown(entry: XiaolvLifeLogEntry): string {
    const text = formatXiaolvLifeLogText(entry);
    const attrs = buildXiaolvLifeLogAttrs(entry);
    const ialStr = Object.entries(attrs)
        .map(([k, v]) => `${k}="${escapeKitIalValue(v)}"`)
        .join(" ");
    return `${text}\n{: ${ialStr} }`;
}

export function parseXiaolvLifeLogBlock(block: {
    id?: string;
    blockId?: string;
    content?: string;
    markdown?: string;
    dom?: string;
    root_id?: string;
    rootID?: string;
    created?: string;
    updated?: string;
    ial?: string | Record<string, string>;
    attrs?: Record<string, string>;
} | null | undefined): ParsedXiaolvLifeLog | null {
    if (!block || typeof block !== "object") return null;

    const attrs: Record<string, string> = {
        ...parseKitIalMap(block.ial),
        ...(block.attrs || {}),
    };
    if (block.dom) {
        const domOpen = block.dom.match(/<div[^>]*data-node-id="[^"]*"[^>]*>/i)?.[0] || block.dom;
        for (const m of domOpen.matchAll(/(custom-[a-z][a-z0-9-]*)="([^"]*)"/g)) {
            const key = m[1];
            if (!key || attrs[key]) continue;
            attrs[key] = (m[2] ?? "")
                .replace(/&quot;/g, '"')
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&amp;/g, "&");
        }
    }
    if (block.markdown) {
        const mdIalMatch = block.markdown.match(/\{:([^}]*)\}\s*$/);
        if (mdIalMatch && mdIalMatch[1]) {
            const mdAttrs = parseKitIalMap(mdIalMatch[1]);
            for (const [k, v] of Object.entries(mdAttrs)) {
                if (!attrs[k]) attrs[k] = v;
            }
        }
    }

    let rawText = "";
    if (typeof block.markdown === "string" && block.markdown.trim()) {
        rawText = block.markdown.replace(/\{:[^}]*\}\s*$/g, "").trim();
    } else if (typeof block.content === "string" && block.content.trim()) {
        rawText = block.content.trim();
    } else if (typeof block.dom === "string" && block.dom.trim()) {
        const matches = [...block.dom.matchAll(/<div[^>]*contenteditable="true"[^>]*>([\s\S]*?)<\/div>/gi)];
        rawText = matches
            .map((m) => (m[1] ?? "").replace(/<[^>]+>/g, ""))
            .join("\n")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/\u200b/g, "")
            .trim();
    }
    rawText = rawText.replace(/^[-*+]\s+/, "").trim();
    if (!rawText) return null;

    const hasUnifiedFlag = attrs["custom-lv-lifelog"] === "1";
    const hasLegacyType = Boolean(attrs["custom-lifelog-type"]);
    const hasEnvelopeEvent = attrs["custom-lv-type"] === "event-log";
    const lineMatch = rawText.match(/^(\d{2}:\d{2})\s+([^：:]+)[：:]\s*([\s\S]+)$/);

    if (!hasUnifiedFlag && !hasLegacyType && !hasEnvelopeEvent && !lineMatch) {
        return null;
    }

    const time = lineMatch?.[1] || "";
    const parsedType = lineMatch?.[2]?.trim() || attrs["custom-lifelog-type"] || attrs["custom-lv-action"] || "日常记录";
    let bodyAndRest = lineMatch?.[3]?.trim() || rawText;

    let refDocId: string | undefined;
    let refDocTitle: string | undefined;
    const refMatch = bodyAndRest.match(/\s*\(\(([a-zA-Z0-9-]+)(?:\s+["']([^"']*)["'])?\)\)\s*$/);
    if (refMatch) {
        refDocId = refMatch[1];
        refDocTitle = refMatch[2] || undefined;
        bodyAndRest = bodyAndRest.slice(0, refMatch.index).trim();
    }

    const tags: string[] = [];
    const bodyWithoutTags = bodyAndRest
        .replace(/(?:^|\s)#([^\s#]+)/g, (_m, tag: string) => {
            const cleanTag = tag.replace(/#$/, "").trim();
            if (cleanTag && !tags.includes(cleanTag)) tags.push(cleanTag);
            return "";
        })
        .replace(/\s+/g, " ")
        .trim();

    let dateStr = attrs["custom-lv-date"] || attrs["custom-lv-biz-date"] || "";
    if (!dateStr && block.created) {
        const c = String(block.created).replace(/\D/g, "");
        if (c.length >= 8) {
            dateStr = `${c.slice(0, 4)}-${c.slice(4, 6)}-${c.slice(6, 8)}`;
        }
    }

    return {
        blockId: String(block.blockId || block.id || ""),
        docId: block.root_id || block.rootID,
        time,
        date: dateStr,
        type: attrs["custom-lifelog-type"] || parsedType,
        body: bodyWithoutTags || bodyAndRest,
        tags,
        refDocId,
        refDocTitle,
        source: attrs["custom-lv-source"] || "legacy",
        module: attrs["custom-lv-module"] || "lifelog",
        eventId: attrs["custom-lv-event-id"],
        target: attrs["custom-lv-target"],
        amount: attrs["custom-lv-amount"],
        quantity: attrs["custom-lv-quantity"],
        odometer: attrs["custom-lv-odometer"],
        rawContent: rawText,
        attrs,
        isLegacy: !hasUnifiedFlag,
    };
}

export async function appendMarkdownToDailyNote(markdown: string, notebook?: string, opts?: any) {
    return await (await loadLvKitChunk("lv-kit-compass")).appendMarkdownToDailyNote(markdown, notebook, opts);
}
export async function appendXiaolvLifeLogToDailyNote(entry: XiaolvLifeLogEntry, opts?: any) {
    return await (await loadLvKitChunk("lv-kit-compass")).appendXiaolvLifeLogToDailyNote(entry, opts);
}
export async function queryXiaolvLifeLogs(filter?: any) {
    return await (await loadLvKitChunk("lv-kit-compass")).queryXiaolvLifeLogs(filter);
}

export async function appendQuickNoteToDailyNote(
    textOrOpts: string | { text: string; notebook?: string; tags?: string[]; source?: string; module?: string },
    notebook?: string
): Promise<{ ok: boolean; msg?: string; docId?: string; blockId?: string; ids?: string[]; zoneHeadingId?: string }> {
    if (typeof textOrOpts === "string") {
        return appendMarkdownToDailyNote(textOrOpts, notebook);
    }
    const md = textOrOpts.text;
    return appendMarkdownToDailyNote(md, textOrOpts.notebook ?? notebook);
}

export async function appendLifeLogEntryToDailyNote(
    entry: XiaolvLifeLogEntry,
    notebook?: string
): Promise<{ ok: boolean; blockId?: string; docId?: string; msg?: string; zoneHeadingId?: string }> {
    return appendXiaolvLifeLogToDailyNote({
        ...entry,
        notebook: entry.notebook ?? notebook,
    });
}

/* ========================================================================= */
/* 15. 统一全局万物穿透搜索引擎 (Lv Omnisearch Engine)                         */
/* ========================================================================= */

const searchProviders = new Map<string, LvSearchProvider>();

function sortOmniResults(results: LvSearchResultItem[], kw: string): LvSearchResultItem[] {

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
    registerProvider(pluginName: string, provider: LvSearchProvider): () => void {
        return getOmnisearchHub().registerProvider(pluginName, provider);
    },

    search(keyword: string): Promise<LvSearchResultItem[]> {
        return getOmnisearchHub().search(keyword);
    },

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
    registerRule(rule: LvAutomationRule): () => void {
        return getAutomationHub().registerRule(rule);
    },

    trigger(sourcePlugin: string, eventType: string, payload: unknown): Promise<{ triggered: number; success: number }> {
        return getAutomationHub().trigger(sourcePlugin, eventType, payload);
    },

    getRules(): LvAutomationRule[] {
        return getAutomationHub().getRules();
    },

    toggleRule(ruleId: string, enabled: boolean): void {
        getAutomationHub().toggleRule(ruleId, enabled);
    }
};

/* ========================================================================= */
/* 13b. 小驴罗盘 · 独立分类设置窗口 (Section-Driven Launchpad Settings)       */
/* ========================================================================= */

export interface LvConfigSectionDef {
    id: string;
    title: string;
    icon: string;
    badge?: string;
    render: (panel: HTMLElement, toast: (msg?: string) => void) => void;
}

const customConfigSections: LvConfigSectionDef[] = [];

export function registerQuickWorkspaceSection(section: LvConfigSectionDef): () => void {
    customConfigSections.push(section);
    return () => {
        const idx = customConfigSections.indexOf(section);
        if (idx >= 0) customConfigSections.splice(idx, 1);
    };
}

/* ========================================================================= */
/* 14. 思源宿主新特性适配桥接 (SiYuan Host Native Bridge · v3.8.10+)         */
/* ========================================================================= */

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

export function isLvSyncLockError(err: unknown): boolean {
    if (!err) return false;
    let msg = "";
    if (typeof err === "string") {
        msg = err;
    } else if (err instanceof Error) {
        msg = `${err.message || ""} ${err.stack || ""}`;
    } else if (typeof err === "object") {
        const obj = err as Record<string, unknown>;
        msg = `${String(obj.msg || "")} ${String(obj.message || "")} ${String(obj.data || "")}`;
    }
    const lower = msg.toLowerCase();
    return (
        msg.includes("正在应用同步改动") ||
        msg.includes("同步过程中") ||
        msg.includes("同步中止") ||
        msg.includes("正在同步") ||
        lower.includes("database is locked") ||
        lower.includes("busy") ||
        lower.includes("resource locked") ||
        lower.includes("file is locked")
    );
}

export async function lvWithSyncRetry<T>(
    operation: () => Promise<T>,
    options?: {
        maxRetries?: number;
        baseDelayMs?: number;
        onRetry?: (attempt: number, delayMs: number, err: unknown) => void;
    }
): Promise<T> {
    const maxRetries = options?.maxRetries ?? 3;
    const baseDelay = options?.baseDelayMs ?? 500;
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxRetries + 1; attempt += 1) {
        try {
            return await operation();
        } catch (err) {
            lastError = err;
            if (attempt <= maxRetries && isLvSyncLockError(err)) {
                const delayMs = Math.round(baseDelay * Math.pow(2, attempt - 1));
                options?.onRetry?.(attempt, delayMs, err);
                await new Promise((resolve) => setTimeout(resolve, delayMs));
                continue;
            }
            throw err;
        }
    }
    throw lastError;
}

export const lvHostBridge = {
    safeDocTitleFromHPath,
    showDocTreeNativeMenu,
    openNativeAssetPicker,
    toggleNativeDock,
    isNativeDockVisible,
    lvAiPost,
    installLvAiProgressSuppressor,
    syncLvAiProgressSuppression,
    createLvAiProgressTracker,
    getLvAiPresetStages,
    mountLvAiThinkingCard,
    openLvAiWaitOverlay,
    withLvAiWait,
    isLvSyncLockError,
    lvWithSyncRetry,
    openJoinQqGroup,
    openSponsorModal,
};

/* ========================================================================= */
/* 15. 小驴全能块助手通用中枢与资产库 (Universal Block Assistant & Action Store) */
/* ========================================================================= */

export type UniversalBlockActionCategory =
    | "flashcard"
    | "study"
    | "reading"
    | "native"
    | "organization"
    | "time"
    | "clipboard"
    | "community"
    | "plugin";

export interface UniversalBlockAction {
    id: string;
    group: string; // group / category
    label: string;
    subtitle?: string;
    glyph: string;
    featured?: boolean;
    badgeText?: string;
    sourcePlugin?: string;
    sourcePluginId?: string;
    sourceType?: "native" | "ecosystem" | "community" | "plugin-discovery" | "custom";
    destructive?: boolean;
    supportsBatch?: boolean;
    singleOnly?: boolean;
    preferredBlockKinds?: string[];
    excludedBlockKinds?: string[];
    tags?: string[];
    installed?: boolean;
    requiresPlugin?: string;
    enabledByDefault?: boolean;
    isPinnedByDefault?: boolean;
    readOnlySafe?: boolean;
    getDynamicLabel?: (snapshot?: any) => string;
    isAvailable?: (snapshot: any) => boolean;
    execute: (blockID: string, snapshot?: any, batchIDs?: string[]) => void | Promise<void>;
}

export interface BlockActionStoreConfig {
    version: number;
    enabledActionIds: string[];
    pinnedActionIds: string[];
    doubleClickActionId?: string;
    customSortOrder?: string[];
    updatedAt?: number;
}

export interface CustomBlockActionDef {
    id: string;
    label: string;
    subtitle?: string;
    glyph: string;
    group: string;
    actionType: "prefix-suffix" | "attr";
    prefix?: string;
    suffix?: string;
    attrKey?: string;
    attrValue?: string;
    createdAt?: number;
}

const CUSTOM_ACTIONS_STORAGE_KEY = "lv_block_assistant_custom_actions_v1";
const BLOCK_ASSISTANT_MASTER_STORAGE_KEY = "lv_block_assistant_enabled_v1";

let cachedBlockAssistantEnabled: boolean | null = null;
let cachedStoreConfig: BlockActionStoreConfig | null = null;

function invalidateBlockAssistantConfigCache(key?: string | null): void {
    if (!key || key === BLOCK_ASSISTANT_MASTER_STORAGE_KEY) {
        cachedBlockAssistantEnabled = null;
    }
    if (!key || key === BLOCK_ACTION_STORE_STORAGE_KEY || key === BLOCK_ACTION_LEGACY_STORE_STORAGE_KEY) {
        cachedStoreConfig = null;
    }
}

function hasLegacyBlockAssistantCustomization(ls: Storage): boolean {
    try { const p = JSON.parse(ls.getItem(CUSTOM_ACTIONS_STORAGE_KEY) || "null"); if (Array.isArray(p) && p.length > 0) return true; } catch {}
    for (const k of [BLOCK_ACTION_STORE_STORAGE_KEY, BLOCK_ACTION_LEGACY_STORE_STORAGE_KEY]) {
        try {
            const p = JSON.parse(ls.getItem(k) || "null");
            if (!p || typeof p !== "object") continue;
            if ((typeof p.updatedAt === "number" && p.updatedAt > 0)
                || (Array.isArray(p.pinnedActionIds) && JSON.stringify(p.pinnedActionIds) !== JSON.stringify(DEFAULT_PINNED_ACTION_IDS))
                || (Array.isArray(p.enabledActionIds) && JSON.stringify(p.enabledActionIds) !== JSON.stringify(DEFAULT_ENABLED_ACTION_IDS))
                || (typeof p.doubleClickActionId === "string" && p.doubleClickActionId && p.doubleClickActionId !== DEFAULT_DOUBLE_CLICK_ACTION_ID)) return true;
        } catch {}
    }
    try { const pu = JSON.parse(ls.getItem("lv_cards_block_action_usage") || "null"); if (pu && typeof pu === "object" && !Array.isArray(pu) && Object.keys(pu).length > 0) return true; } catch {}
    return false;
}
function readBlockAssistantEnabled(): boolean {
    if (cachedBlockAssistantEnabled !== null) return cachedBlockAssistantEnabled;
    try {
        if (typeof localStorage === "undefined") return false;
        const raw = localStorage.getItem(BLOCK_ASSISTANT_MASTER_STORAGE_KEY);
        if (raw === "true") { cachedBlockAssistantEnabled = true; return true; }
        if (raw === "false") { cachedBlockAssistantEnabled = false; return false; }
        const migrated = hasLegacyBlockAssistantCustomization(localStorage);
        try { localStorage.setItem(BLOCK_ASSISTANT_MASTER_STORAGE_KEY, migrated ? "true" : "false"); } catch {}
        cachedBlockAssistantEnabled = migrated;
        return migrated;
    } catch { return false; }
}

function writeBlockAssistantEnabled(enabled: boolean): void {
    const normalized = Boolean(enabled);
    cachedBlockAssistantEnabled = normalized;
    try {
        if (typeof localStorage !== "undefined") {
            localStorage.setItem(BLOCK_ASSISTANT_MASTER_STORAGE_KEY, normalized ? "true" : "false");
        }
    } catch { /* ignore */ }
}

function readCustomActionsFromStorage(): CustomBlockActionDef[] {
    try {
        if (typeof localStorage === "undefined") return [];
        const raw = localStorage.getItem(CUSTOM_ACTIONS_STORAGE_KEY);

        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        return parsed.filter((d: any) => d && (d.actionType === "prefix-suffix" || d.actionType === "attr")) as CustomBlockActionDef[];
    } catch { return []; }
}

function writeCustomActionsToStorage(defs: CustomBlockActionDef[]): void {
    try {
        if (typeof localStorage !== "undefined") {
            localStorage.setItem(CUSTOM_ACTIONS_STORAGE_KEY, JSON.stringify(defs));
        }
    } catch { /* ignore */ }
}

export interface LvBaBadgeResult { isCard?: boolean; dotColor?: string; tooltipHint?: string; }
export type LvBaBadgeProvider = (blockID: string, el?: HTMLElement | null) => LvBaBadgeResult | null;
export interface UniversalBlockAssistantHub {
    version: string;
    protocolVersion?: number;
    hotkey: string;
    registerBadgeProvider?: (id: string, fn: LvBaBadgeProvider) => () => void;
    refreshCapsule?: (blockID?: string) => void;
    leaderPlugin: string | null;
    isEnabled: () => boolean;
    setEnabled: (enabled: boolean) => void;
    dispose: () => void;
    register: (action: UniversalBlockAction) => () => void;
    getActions: (force?: boolean) => UniversalBlockAction[];
    getEnabledActions: (force?: boolean, snapshot?: BlockSnapshot | string | null) => UniversalBlockAction[];
    getPinnedActions: (force?: boolean, snapshot?: BlockSnapshot | string | null) => UniversalBlockAction[];
    getAvailableActions?: (blockIDOrSnapshot: BlockSnapshot | string, force?: boolean) => UniversalBlockAction[];
    getBlockSnapshot?: (blockID: string, el?: HTMLElement | null) => BlockSnapshot;
    ensureLeader: (pluginId: string, openMenuFn?: (blockID: string, anchor: HTMLElement) => void) => () => void;
    openMenu: (blockID: string, anchor: HTMLElement) => void;
    getStoreConfig: () => BlockActionStoreConfig;
    saveStoreConfig: (config: BlockActionStoreConfig) => void;
    resetStoreConfig: () => BlockActionStoreConfig;
    getDoubleClickActionId?: () => string;
    setDoubleClickActionId?: (actionId: string) => string;
    executeDoubleClickAction?: (blockID: string, snapshot?: BlockSnapshot | null) => Promise<{ ok: boolean; status: string; actionId: string }>;
    onDisable?: (cb: () => void) => () => void;
    openStoreDialog: (options?: { onConfigChange?: (config: BlockActionStoreConfig) => void }) => void;
    scanPlugins: (force?: boolean) => UniversalBlockAction[];
    getScanCacheStatus?: () => {
        lastScanTime: number;
        scanCount: number;
        fingerprint: string;
        ttlMs: number;
    };
}

const BLOCK_ACTION_STORE_STORAGE_KEY = "lv_block_assistant_store_v1";
const BLOCK_ACTION_LEGACY_STORE_STORAGE_KEY = "lv_block_action_store_v1";
export const DEFAULT_BLOCK_ASSISTANT_ACTION_ID = "morph-block-type";
export const DEFAULT_DOUBLE_CLICK_ACTION_ID = "morph-block-type";
export const DOUBLE_CLICK_ACTION_DISABLED = "none";

const DEFAULT_PINNED_ACTION_IDS: string[] = [
    "morph-block-type",   // 默认主动作 & 常驻第 1 位：转换块类型
    "focus-block",        // 聚焦当前块
    "copy-block-ref",     // 复制块引用
    "toggle-block-fold",  // 折叠 / 展开子分支
    "duplicate-block",    // 制作副本
];

const DEFAULT_ENABLED_ACTION_IDS: string[] = [

    "morph-block-type", "focus-block", "copy-embed-ref", "toggle-block-fold",
    "duplicate-block", "native-move-up", "native-move-down",
    "insert-block-above", "insert-block-below", "cut-block", "delete-block",

    "copy-block-content", "copy-block-ref", "copy-plain-text", "copy-block-id",

    "edit-card-qa", "make-cloze", "make-occlusion", "add-to-deck", "to-exam-question", "exam-ai-generate",

    "to-glean-library", "ghostreader-explain", "capture-quote-common", "contacts-interaction",

    "bind-checkin-item", "add-memo", "copy-code-for-snippet",

    "community-mindmap", "plugin-pangu-spacing", "plugin-convert-punctuation", "plugin-database-attr", "plugin-wordcount",
    "plugin-table-format", "plugin-toc-locate", "plugin-mermaid-zoom"
];

const RETIRED_BLOCK_ACTION_ID_SET = new Set([
    "plugin-code-run",
    "plugin-calendar-event",
    "plugin-kanban-card",
    "plugin-card-toolbox-qa",
    "plugin-dailynote-append",
    "plugin-image-tools",
    "custom-actions-script",
]);

function normalizeBlockActionId(raw: unknown): string {
    const id = String(raw ?? "").trim();
    if (id === "speedswitch-workbench") return "copy-code-for-snippet";
    if (id === "add-checkin-item") return "bind-checkin-item";
    return id;
}

function normalizeDoubleClickActionId(raw: unknown): string {
    const s = String(raw ?? "").trim();
    if (!s) return DEFAULT_DOUBLE_CLICK_ACTION_ID;
    if (s === DOUBLE_CLICK_ACTION_DISABLED || s === "off" || s === "disabled") {
        return DOUBLE_CLICK_ACTION_DISABLED;
    }
    const id = normalizeBlockActionId(s);
    if (!id || RETIRED_BLOCK_ACTION_ID_SET.has(id) || id === "delete-block" || id === "cut-block") {
        return DEFAULT_DOUBLE_CLICK_ACTION_ID;
    }
    return id;
}

function normalizeStoreActionIds(ids: unknown[]): string[] {
    const out: string[] = [];
    for (const raw of ids) {
        const id = normalizeBlockActionId(raw);
        if (!id || RETIRED_BLOCK_ACTION_ID_SET.has(id) || out.includes(id)) continue;
        out.push(id);
    }
    return out;
}

function cloneStoreConfig(cfg: BlockActionStoreConfig): BlockActionStoreConfig {
    return {
        ...cfg,
        enabledActionIds: [...cfg.enabledActionIds],
        pinnedActionIds: [...cfg.pinnedActionIds],
    };
}

function readStoreConfigFromStorage(): BlockActionStoreConfig {
    if (cachedStoreConfig !== null) {
        return cloneStoreConfig(cachedStoreConfig);
    }
    const def = (): BlockActionStoreConfig => ({
        version: 1,
        enabledActionIds: [...DEFAULT_ENABLED_ACTION_IDS],
        pinnedActionIds: [...DEFAULT_PINNED_ACTION_IDS],
        doubleClickActionId: DEFAULT_DOUBLE_CLICK_ACTION_ID,
    });
    try {
        if (typeof localStorage === "undefined") {
            return def();
        }
        const raw =
            localStorage.getItem(BLOCK_ACTION_STORE_STORAGE_KEY) ||
            localStorage.getItem(BLOCK_ACTION_LEGACY_STORE_STORAGE_KEY);
        if (!raw) {
            const fallback = def();
            cachedStoreConfig = cloneStoreConfig(fallback);
            return fallback;
        }
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.enabledActionIds) && Array.isArray(parsed.pinnedActionIds)) {
            const normalized: BlockActionStoreConfig = {
                ...parsed,
                enabledActionIds: normalizeStoreActionIds(parsed.enabledActionIds),
                pinnedActionIds: normalizeStoreActionIds(parsed.pinnedActionIds),
                doubleClickActionId: normalizeDoubleClickActionId(parsed.doubleClickActionId),
            };
            cachedStoreConfig = cloneStoreConfig(normalized);
            return normalized;
        }
    } catch { /* ignore */ }
    const fallback = def();
    if (typeof localStorage !== "undefined") {
        cachedStoreConfig = cloneStoreConfig(fallback);
    }
    return fallback;
}

function writeStoreConfigToStorage(cfg: BlockActionStoreConfig): void {
    try {
        const prev = readStoreConfigFromStorage();
        const normalized: BlockActionStoreConfig = {
            ...cfg,
            version: typeof cfg.version === "number" ? cfg.version : 1,
            enabledActionIds: normalizeStoreActionIds(Array.isArray(cfg.enabledActionIds) ? cfg.enabledActionIds : prev.enabledActionIds),
            pinnedActionIds: normalizeStoreActionIds(Array.isArray(cfg.pinnedActionIds) ? cfg.pinnedActionIds : prev.pinnedActionIds),
            doubleClickActionId:
                cfg.doubleClickActionId !== undefined
                    ? normalizeDoubleClickActionId(cfg.doubleClickActionId)
                    : (prev.doubleClickActionId || DEFAULT_DOUBLE_CLICK_ACTION_ID),
            updatedAt: Date.now(),
        };
        cachedStoreConfig = cloneStoreConfig(normalized);
        if (typeof localStorage !== "undefined") {
            localStorage.setItem(BLOCK_ACTION_STORE_STORAGE_KEY, JSON.stringify(normalized));
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("lv-block-action-store-updated", { detail: normalized }));
            }
        }
    } catch { /* ignore */ }
}

let sharedBlockActions = new Map<string, UniversalBlockAction>();
const customRegisteredActionIds = new Set<string>();
let blockAssistantLeader: string | null = null;
let blockAssistantOpenFn: ((blockID: string, anchor: HTMLElement) => void) | null = null;
const blockAssistantOpenFns = new Map<string, (blockID: string, anchor: HTMLElement) => void>();
const blockAssistantOwners = new Set<string>();
const blockAssistantDisableHooks = new Set<() => void>();
const blockAssistantBadgeProviders = new Map<string, LvBaBadgeProvider>();

function buildNoticeKitHubContextInput(context: any, piiPolicy: string = "standard", maxChars = 12000): string {
    const applyMask = (s: string) => {
        if (!s || piiPolicy === "none") return s;
        let out = String(s);
        out = out.replace(/\b(sk-[a-zA-Z0-9_-]{20,}|ghp_[a-zA-Z0-9]{30,}|Bearer\s+[a-zA-Z0-9._-]{20,})\b/g, "[KEY_REDACTED]");
        out = out.replace(/\b([1-9]\d{5})(?:18|19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])(\d{3}[\dXx])\b/g, "$1********$2");
        out = out.replace(/(?<!\d)(1[3-9]\d)(\d{4})(\d{4})(?!\d)/g, "$1****$3");
        out = out.replace(/(?<!\d)([4-6]\d{3})\s?(\d{4})\s?(\d{4})\s?(\d{4,7})(?!\d)/g, "$1 **** **** [BANK_CARD]");
        return out;
    };
    const headParts: string[] = [];
    const tailParts: string[] = [];
    const heading = typeof context?.parentOutlineHeading === "string" ? context.parentOutlineHeading.trim() : "";
    if (heading) headParts.push(`[大纲] ${applyMask(heading).slice(0, 300)}`);
    const prev = typeof context?.siblingContext?.prev === "string" ? context.siblingContext.prev.trim() : "";
    if (prev) headParts.push(`[上文] ${applyMask(prev).slice(0, 400)}`);
    const next = typeof context?.siblingContext?.next === "string" ? context.siblingContext.next.trim() : "";
    if (next) tailParts.push(`[下文] ${applyMask(next).slice(0, 400)}`);
    if (Array.isArray(context?.referenceLinks) && context.referenceLinks.length > 0) {
        const refs = context.referenceLinks
            .slice(0, 8)
            .map((r: unknown) => applyMask(String(r || "").trim()))
            .filter(Boolean);
        if (refs.length > 0) tailParts.push(`[引用] ${refs.join(" | ").slice(0, 600)}`);
    }
    const overhead = [...headParts, ...tailParts].reduce((acc, s) => acc + s.length + 2, 0);
    const focusRaw = applyMask(String(context?.focusBlockContent || ""));
    const focusBudget = Math.max(128, maxChars - overhead);
    const focus = focusRaw.length <= focusBudget
        ? focusRaw
        : `${focusRaw.slice(0, Math.max(0, focusBudget - 1))}…`;
    const joined = [...headParts, ...(focus ? [focus] : []), ...tailParts].join("\n\n");
    if (joined.length <= maxChars) return joined;
    return `${joined.slice(0, Math.max(0, maxChars - 1))}…`;
}

function mapNoticeKitPreferredTier(preferredTier?: string): string | undefined {
    if (!preferredTier) return undefined;
    if (preferredTier === "siyuan_editor" || preferredTier === "siyuan_legacy" || preferredTier === "siyuan") return "siyuan";
    if (preferredTier === "user_custom" || preferredTier === "ollama" || preferredTier === "public_free" || preferredTier === "rule_fallback") {
        return preferredTier;
    }
    return undefined;
}

function ensureNoticeKitAiHubMounted(): any {
    const g = typeof globalThis !== "undefined" ? (globalThis as any) : null;
    const w = typeof window !== "undefined" ? (window as any) : null;
    if (w?.__LV_AI_HUB__) return w.__LV_AI_HUB__;
    if (g?.__LV_AI_HUB__) { if (w) w.__LV_AI_HUB__ = g.__LV_AI_HUB__; return g.__LV_AI_HUB__; }
    try {
        if (typeof w?.ensureSharedAiHubMounted === "function") { const h = w.ensureSharedAiHubMounted(); if (h) return h; }
        if (typeof w?.getSharedAiRouter === "function") { const h = w.getSharedAiRouter()?.getHubDelegate?.(); if (h) { if (w) w.__LV_AI_HUB__ = h; if (g) g.__LV_AI_HUB__ = h; return h; } }
    } catch {}
    const stats = { activeRequests: 0, totalRequests: 0, fallbackCount: 0 };
    const api = {
        protocol: PROTOCOL_VERSION,
        async runTask(hubPayload: any): Promise<any> {
            stats.activeRequests++; stats.totalRequests++;
            try {
                const text = buildNoticeKitHubContextInput(hubPayload?.context, hubPayload?.piiPolicy || "standard", 12000);
                const preferredProvider = mapNoticeKitPreferredTier(hubPayload?.preferredTier);
                if (hubPayload?.signal?.aborted) return { templateId: "T6", headline: "已取消，未发起写回", state: "done", outcome: { cancelReason: hubPayload?.cancelReasonHint || "user", completeness: 0 }, controls: { canStop: false, canBackground: false, canRetry: true }, evidence: [], blocks: [], actions: [], meta: { provider: "siyuan_editor", model: "aborted", promptId: hubPayload?.promptId || "legacy", promptVersion: hubPayload?.promptVersion || 1, generatedAt: new Date().toISOString(), sourceHash: "", aiSourceAttr: "editor", savedToDisk: false, errorReason: "aborted" } };
                const router = w?.getSharedAiRouter?.();
                if (router?.chat) {
                    const res = await router.chat({ messages: [{ role: "user", content: text }], taskType: hubPayload?.taskType === "block_skill" ? "chat" : (hubPayload?.taskType || "chat"), preferredProvider, preferredTier: hubPayload?.preferredTier, allowPublicFree: hubPayload?.allowFreePool === true, source: hubPayload?.sourcePlugin, expectedOrigin: hubPayload?.expectedOrigin, signal: hubPayload?.signal, onChunk: hubPayload?.onChunk });
                    return { templateId: "T1", headline: res.ok ? "已完成" : "已降级本地草稿", state: res.ok ? "done" : "failedFallback", outcome: { completeness: res.ok ? 1 : 0 }, controls: { canStop: false, canBackground: false, canRetry: true }, evidence: [], blocks: res.content ? [{ type: "markdown", text: res.content }] : [], actions: [], meta: { provider: res.provider === "siyuan" ? "siyuan_editor" : res.provider, model: res.model, promptId: hubPayload?.promptId || "legacy", promptVersion: hubPayload?.promptVersion || 1, generatedAt: new Date().toISOString(), sourceHash: "", aiSourceAttr: "editor", offlineDegraded: !res.ok, savedToDisk: false, errorReason: res.error } };
                }
                if (preferredProvider && preferredProvider !== "siyuan" && preferredProvider !== "rule_fallback") assertLvAiChannelAllowed({ source: hubPayload?.sourcePlugin, channel: preferredProvider, expectedOrigin: hubPayload?.expectedOrigin });
                const aiChunk = await loadLvKitChunk("lv-kit-ai-hub").catch((): any => null);
                const syContent = aiChunk ? await aiChunk.lvEditorChatFallback(text, hubPayload?.signal, true) : "";
                if (syContent) return { templateId: "T1", headline: "已完成", state: "done", outcome: { completeness: 1 }, controls: { canStop: false, canBackground: false, canRetry: true }, evidence: [], blocks: [{ type: "markdown", text: syContent }], actions: [], meta: { provider: "siyuan_editor", model: "siyuan-editor", promptId: hubPayload?.promptId || "legacy", promptVersion: hubPayload?.promptVersion || 1, generatedAt: new Date().toISOString(), sourceHash: "", aiSourceAttr: "editor", offlineDegraded: false, savedToDisk: false } };
                return { templateId: "T6", headline: "当前离线或通道不可用", state: "failedFallback", outcome: { completeness: 0 }, controls: { canStop: false, canBackground: false, canRetry: true }, evidence: [], blocks: [], actions: [], meta: { provider: "rule_fallback", model: "local-heuristic-engine", promptId: hubPayload?.promptId || "legacy", promptVersion: hubPayload?.promptVersion || 1, generatedAt: new Date().toISOString(), sourceHash: "", aiSourceAttr: "editor", offlineDegraded: true, savedToDisk: false, errorReason: "offline_fallback" } };
            } finally { stats.activeRequests = Math.max(0, stats.activeRequests - 1); }
        },
        getStats: () => ({ ...stats }),
    };
    if (w) w.__LV_AI_HUB__ = api;
    if (g) g.__LV_AI_HUB__ = api;
    return api;
}
export function escapeSql(value: unknown): string {
    return String(value ?? "").replace(/'/g, "''");
}

const WINDOWS_RESERVED_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

export function sanitizeFileNameSegment(name: string, fallback = "未命名", maxLength = 80): string {
    const raw = typeof name === "string" ? name.trim() : "";
    if (!raw) return fallback;
    let clean = raw
        .replace(/[<>:"/\\|?*\u0000-\u001f\r\n\t#~]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/[. ]+$/g, "");
    if (WINDOWS_RESERVED_NAMES.test(clean)) {
        clean = `_${clean}`;
    }
    if (clean.length > maxLength) {
        clean = clean.slice(0, maxLength).trim().replace(/[. ]+$/g, "");
    }
    return clean || fallback;
}

export function sanitizeHPath(rawPath: string, fallback = "/未命名"): string {
    if (!rawPath || typeof rawPath !== "string") return fallback;
    const parts = rawPath.split("/").map((seg) => sanitizeFileNameSegment(seg, "")).filter(Boolean);
    if (parts.length === 0) return fallback;
    return "/" + parts.join("/");
}

export function getCleanBlockText(el: HTMLElement | null | undefined): string {
    if (!el) return "";
    const stripZws = (s: string) => s.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
    const edit = el.querySelector<HTMLElement>(':scope > [contenteditable="true"]')
        || el.querySelector<HTMLElement>('[contenteditable="true"]');
    if (edit) {
        const clone = edit.cloneNode(true) as HTMLElement;
        clone.querySelectorAll(".protyle-attr, .protyle-action, .protyle-gutters, .lv-card-badge-pill, .protyle-action__drag, .protyle-action__menu").forEach(n => n.remove());
        return stripZws(clone.textContent || "");
    }
    const clone = el.cloneNode(true) as HTMLElement;
    clone.querySelectorAll(".protyle-attr, .protyle-action, .protyle-gutters, .lv-card-badge-pill, .protyle-action__drag, .protyle-action__menu").forEach(n => n.remove());
    return stripZws(clone.textContent || "");
}

const LV_BLOCK_ASSIST_EXCLUDED_SUBTREE_CLASSES = [
    "protyle-breadcrumb",
    "protyle-title",
    "lv-review",
    "lv-cards-root",
    "lv-card-content",
    "lv-peek-body",
    "lv-detail-preview",
] as const;

const LV_BLOCK_ASSIST_NON_EDITABLE_PLUGIN_CLASSES = [
    "lv-review",
    "lv-cards-root",
    "lv-card-content",
    "lv-peek-body",
    "lv-detail-preview",
] as const;

function hasClassInAncestors(el: Element | null | undefined, classNames: readonly string[]): boolean {
    let cur: Element | null | undefined = el;
    while (cur) {
        const cls = (cur.className && typeof cur.className === "string") ? cur.className.split(/\s+/) : [];
        for (const c of classNames) {
            if (cls.includes(c)) return true;
        }
        cur = cur.parentElement;
    }
    return false;
}

function isInsidePluginReviewOrPreviewSubtree(el: Element | null | undefined): boolean {
    if (!el) return false;
    try {
        if (typeof el.closest === "function" && el.closest(".lv-review, .lv-cards-root, .lv-card-content, .lv-peek-body, .lv-detail-preview")) {
            return true;
        }
    } catch { /* ignore */ }
    return hasClassInAncestors(el, LV_BLOCK_ASSIST_NON_EDITABLE_PLUGIN_CLASSES);
}

function isExcludedBlockAssistElement(el: Element | null | undefined): boolean {
    if (!el) return false;
    try {
        if (typeof el.closest === "function" && el.closest(".protyle-breadcrumb, .protyle-title, .lv-review, .lv-cards-root, .lv-card-content, .lv-peek-body, .lv-detail-preview")) {
            return true;
        }
    } catch { /* ignore */ }
    return hasClassInAncestors(el, LV_BLOCK_ASSIST_EXCLUDED_SUBTREE_CLASSES);
}

export interface BlockSnapshot {
    blockId: string;
    docId?: string;
    blockKind?: string;
    rawType?: string;
    subtype?: string;
    cleanText?: string;
    hasText?: boolean;
    hasSelection?: boolean;
    hasImage?: boolean;
    hasSvg?: boolean;
    hasMermaid?: boolean;
    isDocument?: boolean;
    isCard?: boolean;
    isAv?: boolean;
    hasAv?: boolean;
    hasCloze?: boolean;
    hasQaPattern?: boolean;
    isFolded?: boolean;
    isReadOnly?: boolean;
}

export const READ_ONLY_SAFE_BLOCK_ACTION_IDS: ReadonlySet<string> = new Set([
    "focus-block",
    "copy-block-content",
    "copy-embed-ref",
    "copy-block-ref",
    "copy-plain-text",
    "copy-block-id",
    "copy-code-for-snippet",
    "ghostreader-explain",
    "plugin-wordcount",
    "plugin-toc-locate",
    "plugin-mermaid-zoom",
]);

export function isReadOnlySafeBlockAction(action: { id?: string; readOnlySafe?: boolean } | string | null | undefined): boolean {
    if (!action) return false;
    if (typeof action === "string") return READ_ONLY_SAFE_BLOCK_ACTION_IDS.has(action);
    if (action.readOnlySafe === true) return true;
    return Boolean(action.id && READ_ONLY_SAFE_BLOCK_ACTION_IDS.has(action.id));
}

export function isBlockOrProtyleReadOnly(blockID?: string, el?: HTMLElement | null): boolean {
    try {
        const w = typeof window !== "undefined" ? (window as any) : null;
        if (w?.siyuan?.isReadOnly === true || w?.isReadOnly === true) return true;
        const targetEl = el || (blockID ? queryBlockElementById(blockID) : null);
        const protyle = (targetEl?.closest?.(".protyle") as HTMLElement | null) || queryActiveProtyle();
        if (protyle) {
            if ((protyle as any).disabled === true) return true;
            if ((protyle as any)?.model?.editor?.protyle?.disabled === true) return true;
            if (protyle.getAttribute?.("data-readonly") === "true" || protyle.classList?.contains?.("protyle--readonly")) return true;
        }
        const isReadOnlyAttr = (node: HTMLElement | null | undefined): boolean => {
            if (!node) return false;
            for (const attr of ["custom-sy-readonly", "custom-siyuan-readonly"]) {
                const ro = node.getAttribute?.(attr);
                if (ro === "true" || ro === "1") return true;
            }
            return false;
        };
        const wysiwyg = (targetEl?.closest?.(".protyle-wysiwyg") as HTMLElement | null)
            || (protyle?.querySelector?.(".protyle-wysiwyg") as HTMLElement | null);
        if (wysiwyg) {
            if (wysiwyg.getAttribute?.("contenteditable") === "false") return true;
            if (isReadOnlyAttr(wysiwyg)) return true;
        }
        const titleEl = protyle?.querySelector?.(".protyle-title") as HTMLElement | null;
        for (const node of [targetEl, protyle, titleEl]) {
            if (isReadOnlyAttr(node)) return true;
        }
        if (targetEl?.getAttribute?.("contenteditable") === "false") return true;
    } catch { /* ignore */ }
    return false;
}

const FLASHCARD_BLOCK_ATTR_NAMES = [
    "custom-riff-decks",
    "custom-riff-title",
    "custom-lv-question",
    "custom-lv-answer",
    "custom-card-answer",
    "custom-riff-answer",
] as const;

export function isFlashcardBlockElement(el: HTMLElement | null | undefined): boolean {
    if (!el || typeof el.hasAttribute !== "function") return false;
    if (el.getAttribute?.("data-flashcard-source") === "true") return true;
    for (const attr of FLASHCARD_BLOCK_ATTR_NAMES) {
        if (el.hasAttribute(attr)) {
            const val = el.getAttribute?.(attr);
            if (val !== null && val !== undefined && String(val).trim() !== "") {
                return true;
            }
        }
    }
    return false;
}

export function buildBlockSnapshot(blockID: string, el?: HTMLElement | null): BlockSnapshot {
    const targetEl = el || queryBlockElementById(blockID);
    const rawType = targetEl?.getAttribute?.("data-type") || "";
    const subtype = targetEl?.getAttribute?.("data-subtype") || "";
    const blockKind = rawType === "NodeHeading" ? "heading"
        : rawType === "NodeCodeBlock" ? "code"
        : rawType === "NodeMathBlock" ? "math"
        : rawType === "NodeTable" ? "table"
        : rawType === "NodeAttributeView" ? "av"
        : rawType === "NodeList" || rawType === "NodeListItem" ? (subtype === "t" ? "task" : subtype === "o" ? "ordered-list" : "list")
        : rawType === "NodeBlockquote" ? "quote"
        : rawType === "NodeSuperBlock" ? "superblock"
        : rawType === "NodeDocument" ? "document"
        : "paragraph";
    const text = getCleanBlockText(targetEl);
    const hasImage = Boolean(targetEl?.querySelector?.("img"));
    const hasSvg = Boolean(targetEl?.querySelector?.("svg"));
    const hasMermaid = Boolean(/^(mermaid|echarts|graphviz|plantuml)$/i.test(subtype) || targetEl?.querySelector?.('[data-subtype="mermaid"], .language-mermaid'));
    const isCard = isFlashcardBlockElement(targetEl);
    const isFolded = Boolean(
        targetEl?.getAttribute?.("fold") === "1"
        || targetEl?.getAttribute?.("data-fold") === "1"
        || targetEl?.classList?.contains?.("protyle-wysiwyg--fold")
    );
    const protyle = (targetEl?.closest?.(".protyle") as HTMLElement | null) || queryActiveProtyle();
    const docId = protyle?.querySelector?.(".protyle-wysiwyg")?.getAttribute?.("data-doc-id") || undefined;
    return {
        blockId: blockID,
        docId,
        blockKind,
        rawType,
        subtype,
        cleanText: text,
        hasText: text.length > 0,
        hasImage,
        hasSvg,
        hasMermaid,
        isDocument: rawType === "NodeDocument",
        isCard,
        isAv: blockKind === "av",
        isFolded,
        isReadOnly: isBlockOrProtyleReadOnly(blockID, targetEl),
    };
}

export function isActionAllowedForSnapshot(action: UniversalBlockAction, snapshot?: BlockSnapshot | null): boolean {
    if (!action) return false;
    if (snapshot?.isReadOnly && !isReadOnlySafeBlockAction(action)) {
        return false;
    }
    if (typeof action.isAvailable === "function" && snapshot) {
        try {
            return Boolean(action.isAvailable(snapshot));
        } catch {
            return false;
        }
    }
    return true;
}

export function queryBlockElementById(blockID: string, anchor?: Element | null): HTMLElement | null {
    if (typeof document === "undefined" || typeof document.querySelectorAll !== "function" || !blockID) return null;
    try {
        const pickFirstValid = (nodes: Iterable<HTMLElement> | null | undefined): HTMLElement | null => {
            if (!nodes) return null;
            for (const el of nodes) {
                if (!isExcludedBlockAssistElement(el)) return el;
            }
            return null;
        };

        if (anchor && typeof anchor.closest === "function") {
            const ap = anchor.closest(".protyle");
            if (ap && typeof ap.querySelectorAll === "function") { const inSame = pickFirstValid(ap.querySelectorAll<HTMLElement>(`.protyle-wysiwyg [data-node-id="${blockID}"]`)); if (inSame) return inSame; }
        }

        if (typeof document.querySelector === "function") {
            const activeProtyle = document.querySelector<HTMLElement>(".layout__wnd--active .protyle:not(.fn__none)")
                || document.querySelector<HTMLElement>(".layout__wnd--active .protyle");
            if (activeProtyle && typeof activeProtyle.querySelectorAll === "function") {
                const inActiveWysiwyg = pickFirstValid(
                    activeProtyle.querySelectorAll<HTMLElement>(`.protyle-wysiwyg [data-node-id="${blockID}"]`)
                );
                if (inActiveWysiwyg) return inActiveWysiwyg;
                const inActiveProtyle = pickFirstValid(
                    activeProtyle.querySelectorAll<HTMLElement>(`[data-node-id="${blockID}"]`)
                );
                if (inActiveProtyle) return inActiveProtyle;
            }
        }

        const inVisibleProtyle = pickFirstValid(
            document.querySelectorAll<HTMLElement>(`.protyle:not(.fn__none) .protyle-wysiwyg [data-node-id="${blockID}"]`)
        );
        if (inVisibleProtyle) return inVisibleProtyle;

        const inWysiwyg = pickFirstValid(
            document.querySelectorAll<HTMLElement>(`.protyle-wysiwyg [data-node-id="${blockID}"]`)
        );
        if (inWysiwyg) return inWysiwyg;

        const inTypography = pickFirstValid(
            document.querySelectorAll<HTMLElement>(`.b3-typography [data-node-id="${blockID}"]`)
        );
        if (inTypography) return inTypography;

        const all = document.querySelectorAll<HTMLElement>(`[data-node-id="${blockID}"]`);
        const valid = pickFirstValid(all);
        if (valid) return valid;

        for (const el of all) {
            if (!isInsidePluginReviewOrPreviewSubtree(el)) return el;
        }
        return null;
    } catch {
        return null;
    }
}

export interface BlockMorphTarget {
    id: string;               // 标识，如 "paragraph" | "h1" | ...
    name: string;             // 显示名，如 "普通正文"
    glyph: string;            // 符号徽章，如 "¶"
    shortcut: string;         // 单键快捷键，如 "0", "1", "T"
    category: "basic" | "heading" | "container"; // 分组
    description: string;      // 描述说明
    formatMarkdown: (content: string) => string;
}

export const BLOCK_MORPH_TARGETS: readonly BlockMorphTarget[] = [

    {
        id: "paragraph",
        name: "普通正文",
        glyph: "¶",
        shortcut: "0",
        category: "basic",
        description: "常规段落文本，清除标题与列表符号",
        formatMarkdown: (c) => c,
    },
    {
        id: "task",
        name: "待办任务",
        glyph: "☑",
        shortcut: "T",
        category: "basic",
        description: "带复选框的任务清单项 (* [ ])",
        formatMarkdown: (c) => `* [ ] ${c}`,
    },
    {
        id: "list",
        name: "无序列表",
        glyph: "•",
        shortcut: "U",
        category: "basic",
        description: "圆点项目符号无序列表 (*)",
        formatMarkdown: (c) => `* ${c}`,
    },
    {
        id: "ordered-list",
        name: "有序列表",
        glyph: "1.",
        shortcut: "O",
        category: "basic",
        description: "递增数字顺序列表 (1.)",
        formatMarkdown: (c) => `1. ${c}`,
    },

    {
        id: "h1",
        name: "一级标题",
        glyph: "H1",
        shortcut: "1",
        category: "heading",
        description: "最高级别大纲章节标题 (#)",
        formatMarkdown: (c) => `# ${c}`,
    },
    {
        id: "h2",
        name: "二级标题",
        glyph: "H2",
        shortcut: "2",
        category: "heading",
        description: "核心分区次级标题 (##)",
        formatMarkdown: (c) => `## ${c}`,
    },
    {
        id: "h3",
        name: "三级标题",
        glyph: "H3",
        shortcut: "3",
        category: "heading",
        description: "小节与知识点标题 (###)",
        formatMarkdown: (c) => `### ${c}`,
    },
    {
        id: "h4",
        name: "四级标题",
        glyph: "H4",
        shortcut: "4",
        category: "heading",
        description: "细分小标题 (####)",
        formatMarkdown: (c) => `#### ${c}`,
    },
    {
        id: "h5",
        name: "五级标题",
        glyph: "H5",
        shortcut: "5",
        category: "heading",
        description: "五级辅助段标 (#####)",
        formatMarkdown: (c) => `##### ${c}`,
    },
    {
        id: "h6",
        name: "六级标题",
        glyph: "H6",
        shortcut: "6",
        category: "heading",
        description: "六级末级段标 (######)",
        formatMarkdown: (c) => `###### ${c}`,
    },

    {
        id: "quote",
        name: "引述高亮",
        glyph: "❝",
        shortcut: "Q",
        category: "container",
        description: "带侧边线的引文/重点批注块 (>)",
        formatMarkdown: (c) => c.split(/\r?\n/).map(l => l.trim() ? `> ${l}` : ">").join("\n"),
    },
    {
        id: "callout",
        name: "提示块",
        glyph: "💡",
        shortcut: "N",
        category: "container",
        description: "带高亮背景与图标的提示容器 (> [!NOTE])",
        formatMarkdown: (c) => `> [!NOTE]\n> ${c}`,
    },
    {
        id: "code",
        name: "代码块",
        glyph: "</>",
        shortcut: "C",
        category: "container",
        description: "等宽代码高亮容器 (```)",
        formatMarkdown: (c) => "```\n" + c + "\n```",
    },
    {
        id: "math",
        name: "数学公式",
        glyph: "∑",
        shortcut: "M",
        category: "container",
        description: "LaTeX 块级居中数学公式 ($$)",
        formatMarkdown: (c) => "$$\n" + c + "\n$$",
    },
    {
        id: "superblock",
        name: "超级块",
        glyph: "⊞",
        shortcut: "S",
        category: "container",
        description: "将块包装为超级块布局容器 ({{{ ... }}})",
        formatMarkdown: (c) => `{{{\n${c}\n}}}`,
    },
];

export function extractCoreMarkdown(rawMd: string): string {
    if (!rawMd || typeof rawMd !== "string") return "";
    let text = rawMd.replace(/\{:[^}]*\}\s*$/g, "").trim();

    const superMatch = text.match(/^\{\{\{(?:row|col)?\s*\r?\n([\s\S]*?)\r?\n\}\}\}$/);
    if (superMatch) return extractCoreMarkdown((superMatch[1] ?? "").trim());

    const codeMatch = text.match(/^```[^\r\n]*\r?\n([\s\S]*?)\r?\n?```$/);
    if (codeMatch) return (codeMatch[1] ?? "").trim();

    const mathMatch = text.match(/^\$\$[\s\r\n]*([\s\S]*?)[\s\r\n]*\$\$$/);
    if (mathMatch) return (mathMatch[1] ?? "").trim();

    if (/^>\s*/m.test(text)) {
        text = text.replace(/^>\s*\[![^\]]+\]\s*\r?\n?/i, "");
        text = text.split(/\r?\n/).map(line => line.replace(/^>\s?/, "")).join("\n").trim();
    }

    text = text.replace(/^([-*+]\s*\[[ xX]\]\s*)/, "");

    text = text.replace(/^([-*+]\s+)/, "");

    text = text.replace(/^(\d+\.\s+)/, "");

    text = text.replace(/^(#{1,6}\s+)/, "");

    return text.trim();
}

export function detectCurrentBlockType(el: HTMLElement | null, rawMd?: string): string {
    if (el) {
        const type = el.getAttribute("data-type");
        const subtype = el.getAttribute("data-subtype");
        if (type === "NodeSuperBlock") return "superblock";
        if (type === "NodeHeading") {
            if (subtype && /^h[1-6]$/i.test(subtype)) return subtype.toLowerCase();
            return "h1";
        }
        if (type === "NodeCallout") return "callout";
        if (type === "NodeBlockquote") return "quote";
        if (type === "NodeCodeBlock") return "code";
        if (type === "NodeMathBlock") return "math";

        const listItem = el.closest('[data-type="NodeListItem"]');
        if (listItem) {
            const listSubtype = listItem.getAttribute("data-subtype");
            const isTask = listItem.classList.contains("protyle-action--task")
                || Boolean(listItem.querySelector(".protyle-action--task"))
                || listSubtype === "t"
                || el.classList.contains("protyle-action--task");
            if (isTask) return "task";
            if (listSubtype === "o") return "ordered-list";
            if (listSubtype === "u") return "list";
        }
    }
    if (rawMd) {
        const clean = rawMd.replace(/\{:[^}]*\}\s*$/g, "").trim();
        if (/^\{\{\{(?:row|col)?\s*\r?\n/.test(clean)) return "superblock";
        if (/^```/.test(clean)) return "code";
        if (/^\$\$/.test(clean)) return "math";
        if (/^>\s*\[!/i.test(clean)) return "callout";
        if (/^>\s*/.test(clean)) return "quote";
        if (/^#{1,6}\s+/.test(clean)) {
            const matchH = clean.match(/^(#{1,6})/);
            const level = (matchH && matchH[1]) ? matchH[1].length : 1;
            return `h${level}`;
        }
        if (/^[-*+]\s*\[[ xX]\]/.test(clean)) return "task";
        if (/^\d+\.\s+/.test(clean)) return "ordered-list";
        if (/^[-*+]\s+/.test(clean)) return "list";
    }
    return "paragraph";
}
export async function morphBlockTypeTo(blockID: string, targetType: string, options?: any): Promise<boolean> { return await (await loadLvKitChunk("lv-kit-ba-store")).morphBlockTypeTo(blockID, targetType, options); }
export function openBlockTypeMorphPicker(blockID: string, anchor?: HTMLElement | null, onSelected?: (t: string) => void | Promise<void>, options?: any): () => void {
    const c = getInitializedChunkSync("lv-kit-ba-store");
    if (c) return c.openBlockTypeMorphPicker(blockID, anchor, onSelected, options);
    void loadLvKitChunk("lv-kit-ba-store").then((ch) => ch.openBlockTypeMorphPicker(blockID, anchor, onSelected, options)).catch(() => {});
    return () => {};
}

    const EDITOR_ZERO_TOUCH_ANCESTOR_SELECTOR = ".protyle-wysiwyg, [data-node-id], .protyle-attr, [contenteditable='true']";

    const isInsideEditorZeroTouchSubtree = (el: Element | null | undefined): boolean => {
        if (!el) return false;
        const htmlEl = el as HTMLElement;
        if (typeof htmlEl.closest === "function") {
            try {
                if (htmlEl.closest(EDITOR_ZERO_TOUCH_ANCESTOR_SELECTOR)) return true;
            } catch { /* ignore */ }
        }
        const body = typeof document !== "undefined" ? document.body : null;
        let cur: HTMLElement | null = htmlEl;
        let depth = 0;
        while (cur && cur !== body && depth < 64) {
            if (
                cur.classList?.contains?.("protyle-wysiwyg") ||
                cur.classList?.contains?.("protyle-attr") ||
                cur.hasAttribute?.("data-node-id") ||
                cur.getAttribute?.("contenteditable") === "true"
            ) {
                return true;
            }
            cur = cur.parentElement;
            depth++;
        }
        return false;
    };

    const isDetachedBodyPortalNode = (el: Element | null | undefined): el is HTMLElement => {
        if (!el || typeof document === "undefined" || !document.body) return false;
        const htmlEl = el as HTMLElement;
        if (htmlEl.parentElement !== document.body) return false;
        return !isInsideEditorZeroTouchSubtree(htmlEl);
    };

    const removeDetachedBodyPortalById = (id: string): void => {
        if (typeof document === "undefined" || !document.body) return;
        try {
            const el = document.getElementById(id);
            if (isDetachedBodyPortalNode(el)) {
                el.remove();
            }
        } catch { /* ignore */ }
    };

    const removeDetachedBodyPortalsBySelector = (selector: string): void => {
        if (typeof document === "undefined" || !document.body || typeof document.querySelectorAll !== "function") return;
        try {
            document.querySelectorAll(selector)?.forEach((el) => {
                try {
                    if (isDetachedBodyPortalNode(el)) {
                        el.remove();
                    }
                } catch { /* ignore */ }
            });
        } catch { /* ignore */ }
    };

    const lvSafeCopyToClipboard = async (text: string): Promise<boolean> => {
        try {
            if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            }
        } catch { /* 降级到 textarea */ }
        try {
            if (typeof document !== "undefined") {
                const ta = document.createElement("textarea");
                ta.value = text;
                ta.style.position = "fixed";
                ta.style.opacity = "0";
                ta.style.pointerEvents = "none";
                document.body.appendChild(ta);
                ta.select();
                const ok = document.execCommand("copy");
                ta.remove();
                return ok;
            }
        } catch { /* ignore */ }
        return false;
    };

function getBlockAssistantHub(): UniversalBlockAssistantHub {
    const w = typeof window !== "undefined" ? (window as unknown as { __LV_BLOCK_ASSISTANT_HUB__?: UniversalBlockAssistantHub }) : {};
    const existingHub = w.__LV_BLOCK_ASSISTANT_HUB__ as any;
    if (existingHub && typeof existingHub.getStoreConfig === "function" && typeof existingHub.protocolVersion === "number" && existingHub.protocolVersion >= 500) return existingHub;
    if (existingHub) {
        try {
            if (typeof existingHub.getActions === "function") for (const act of existingHub.getActions()) if (act?.id && !sharedBlockActions.has(act.id)) sharedBlockActions.set(act.id, act);
            if (existingHub.leaderPlugin) blockAssistantOwners.add(existingHub.leaderPlugin);
            existingHub.dispose?.();
        } catch {}
    }
    const openStoreDialog = (opts?: { onConfigChange?: (config: BlockActionStoreConfig) => void }) => runWithBaStoreChunk((c) => c.openStoreDialog(opts));
    const scanPlugins = (force = false): UniversalBlockAction[] => getInitializedChunkSync("lv-kit-ba-store")?.scanPlugins?.(force) ?? Array.from(sharedBlockActions.values());
    getInitializedChunkSync("lv-kit-ba-store");
    const isCardsLeaderActive = (): boolean => blockAssistantOpenFns.has("siyuan-lv-cards") || Boolean(typeof document !== "undefined" && document.getElementById?.("lv-cards-floating-pill"));

    const SHARED_CAPSULE_ID = "lv-shared-block-capsule";
    const CAPSULE_IDLE_MOUNT_DELAY_MS = 400;
    const CAPSULE_SELECTION_MOUNT_DELAY_MS = 80;
    const CAPSULE_TYPING_SILENCE_MS = 650;
    let sharedCapsuleEl: HTMLElement | null = null;
    let sharedCapsuleTriggerBtn: HTMLButtonElement | null = null;
    let sharedCapsuleTriggerIconEl: HTMLElement | null = null;
    let sharedCapsuleTriggerTextEl: HTMLElement | null = null;
    let sharedCapsuleQuickBtns: HTMLButtonElement[] = [];
    let sharedCapsuleRenderedSignature = "";
    let sharedCapsuleBlockId: string | null = null;
    let sharedCapsuleBlockEl: HTMLElement | null = null;
    let sharedCapsuleWired = false;
    let sharedCapsuleClickTimer: ReturnType<typeof setTimeout> | null = null;
    let sharedCapsuleDebounceTimer: ReturnType<typeof setTimeout> | null = null;
    let sharedCapsuleRafId: number | null = null;
    let pendingCapsuleTarget: HTMLElement | null = null;
    let hasPendingCapsuleTarget = false;
    let lastCapsuleTypingAt = 0;
    let sharedCapsuleListenersCleanup: (() => void) | null = null;
    let lastMenuClosedByTriggerAt = 0;

    const cleanupLegacyBlockAssistantDomResidues = (opts?: { keepStoreDialog?: boolean }) => {
        if (typeof document === "undefined" || !document.body) return;

        removeDetachedBodyPortalById("lv-block-focus-highlight-overlay");
        removeDetachedBodyPortalById(SHARED_CAPSULE_ID);
        removeDetachedBodyPortalById("lv-block-assistant-portal");
        removeDetachedBodyPortalById("lv-block-type-picker-root");
        if (!opts?.keepStoreDialog) {
            removeDetachedBodyPortalById("lv-block-action-store-mask");
        }
        removeDetachedBodyPortalById("lv-block-ai-result-card");
        removeDetachedBodyPortalsBySelector(
            ".lv-shared-ba-capsule, .lv-bam, .lv-bam-mobile-mask, .lv-card-badge-pill"
        );
    };

    const clearCapsuleClickTimer = () => {
        if (sharedCapsuleClickTimer !== null) {
            clearTimeout(sharedCapsuleClickTimer);
            sharedCapsuleClickTimer = null;
        }
    };

    const cancelPendingCapsuleSchedule = () => {
        if (sharedCapsuleDebounceTimer !== null) {
            clearTimeout(sharedCapsuleDebounceTimer);
            sharedCapsuleDebounceTimer = null;
        }
        if (sharedCapsuleRafId !== null) {
            try {
                if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(sharedCapsuleRafId);
                else clearTimeout(sharedCapsuleRafId as any);
            } catch { /* ignore */ }
            sharedCapsuleRafId = null;
        }
        hasPendingCapsuleTarget = false;
        pendingCapsuleTarget = null;
    };

    const unmountSharedCapsule = (destroyNode = false) => {
        clearCapsuleClickTimer();
        if (sharedCapsuleEl) {
            try {
                if (!isInsideEditorZeroTouchSubtree(sharedCapsuleEl)) {
                    sharedCapsuleEl.remove();
                }
            } catch { /* ignore */ }
            if (destroyNode) {
                sharedCapsuleEl = null;
                sharedCapsuleTriggerBtn = null;
                sharedCapsuleTriggerIconEl = null;
                sharedCapsuleTriggerTextEl = null;
                sharedCapsuleQuickBtns = [];
                sharedCapsuleRenderedSignature = "";
            }
        }
        if (destroyNode && typeof document !== "undefined") {
            removeDetachedBodyPortalById(SHARED_CAPSULE_ID);
        }
        sharedCapsuleBlockId = null;
        sharedCapsuleBlockEl = null;
    };

    const teardownSharedCapsuleController = () => {
        cancelPendingCapsuleSchedule();
        unmountSharedCapsule(true);
        if (sharedCapsuleListenersCleanup) {
            try { sharedCapsuleListenersCleanup(); } catch { /* ignore */ }
            sharedCapsuleListenersCleanup = null;
        }
        sharedCapsuleWired = false;
    };

    const isElementConnectedAndVisible = (el: HTMLElement | null | undefined): boolean => {
        if (!el) return false;
        if (el.isConnected === false) return false;
        if (typeof el.closest === "function" && el.closest(".fn__none")) return false;
        if (typeof document !== "undefined" && document.body) {
            let cur: HTMLElement | null = el;
            let steps = 0;
            while (cur && steps < 64) {
                if (cur.isConnected === false) return false;
                if (cur.classList?.contains?.("fn__none")) return false;
                if (cur === document.body) return true;
                cur = cur.parentElement;
                steps++;
            }
            if (cur !== document.body) return false;
        }
        return true;
    };

    const getNormalizedRect = (rect: { top?: number; bottom?: number; left?: number; right?: number; width?: number; height?: number } | null | undefined) => {
        if (!rect) return null;
        const width = typeof rect.width === "number" ? rect.width : (typeof rect.right === "number" && typeof rect.left === "number" ? rect.right - rect.left : 0);
        const height = typeof rect.height === "number" ? rect.height : (typeof rect.bottom === "number" && typeof rect.top === "number" ? rect.bottom - rect.top : 0);
        const top = typeof rect.top === "number" ? rect.top : 0;
        const bottom = typeof rect.bottom === "number" ? rect.bottom : top + height;
        const left = typeof rect.left === "number" ? rect.left : 0;
        const right = typeof rect.right === "number" ? rect.right : left + width;
        return { width, height, top, bottom, left, right };
    };

    const isRectVisibleInViewport = (rect: { top?: number; bottom?: number; left?: number; right?: number; width?: number; height?: number } | null | undefined): boolean => {
        const r = getNormalizedRect(rect);
        if (!r) return false;
        const winH = typeof window !== "undefined" ? (window.innerHeight || 900) : 900;
        return r.width > 0 && r.height > 0 && r.bottom > 24 && r.top < winH - 24;
    };

    const isValidSharedCapsuleBlock = (
        el: HTMLElement | null | undefined,
        opts?: { checkRect?: boolean }
    ): el is HTMLElement => {
        if (!el || typeof el.getAttribute !== "function") return false;
        if (!isElementConnectedAndVisible(el)) return false;
        const bid = el.getAttribute("data-node-id");
        if (!bid) return false;
        if (el.getAttribute("data-type") === "NodeDocument") return false;
        if (el.id === SHARED_CAPSULE_ID || el.classList?.contains?.("lv-shared-ba-capsule")) return false;
        if (isExcludedBlockAssistElement(el) || isInsidePluginReviewOrPreviewSubtree(el)) return false;
        if (el.classList?.contains?.("protyle-title") || el.querySelector?.(":scope > .protyle-title__input")) return false;
        if (opts?.checkRect && typeof el.getBoundingClientRect === "function") {
            try {
                if (!isRectVisibleInViewport(el.getBoundingClientRect())) return false;
            } catch {
                return false;
            }
        }
        return true;
    };

    const getDoubleClickActionIdInternal = (): string => {
        return normalizeDoubleClickActionId(readStoreConfigFromStorage().doubleClickActionId);
    };

    const executeDoubleClickActionInternal = async (blockID: string, snapshotOrEl?: BlockSnapshot | HTMLElement | null) => {
        const c = await loadLvKitChunk("lv-kit-ba-store");
        return await c.executeDoubleClickActionInternal(blockID, snapshotOrEl);
    };
    const ensureSharedCapsuleNode = () => {
        if (sharedCapsuleEl) return sharedCapsuleEl;
        if (typeof document !== "undefined") {
            removeDetachedBodyPortalById(SHARED_CAPSULE_ID);
        }
        const capsule = document.createElement("div");
        capsule.id = SHARED_CAPSULE_ID;
        capsule.className = "lv-shared-ba-capsule";
        capsule.setAttribute("data-lv-shared-capsule", "true");

        const triggerBtn = document.createElement("button");
        triggerBtn.type = "button";
        triggerBtn.className = "lv-shared-ba-capsule__trigger";
        triggerBtn.setAttribute("data-role", "capsule-trigger");

        const dotSpan = document.createElement("span"); dotSpan.className = "lv-shared-ba-capsule__dot dot-card"; dotSpan.style.display = "none";
        const iconSpan = document.createElement("span"); iconSpan.textContent = "🧩";
        const labelSpan = document.createElement("span"); labelSpan.textContent = "块助手";
        triggerBtn.appendChild(dotSpan); triggerBtn.appendChild(iconSpan); triggerBtn.appendChild(labelSpan);

        const openMenuForCurrentCapsule = () => {
            if (!readBlockAssistantEnabled() || isCardsLeaderActive()) return;
            const curId = sharedCapsuleBlockId;
            const curEl = sharedCapsuleBlockEl;
            if (!curId || !curEl || !isValidSharedCapsuleBlock(curEl, { checkRect: true })) {
                unmountSharedCapsule(false);
                return;
            }
            hub.openMenu(curId, curEl);
        };

        triggerBtn.addEventListener("mousedown", (e) => {
            e.preventDefault();
            e.stopPropagation();
        });

        triggerBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            clearCapsuleClickTimer();
            if (typeof document !== "undefined" && document.querySelector?.(".lv-bam")) {
                removeDetachedBodyPortalsBySelector(".lv-bam, .lv-bam-mobile-mask");
                lastMenuClosedByTriggerAt = 0;
                return;
            }
            if (lastMenuClosedByTriggerAt > 0 && Date.now() - lastMenuClosedByTriggerAt < 400) {
                lastMenuClosedByTriggerAt = 0;
                return;
            }
            const curDblId = getDoubleClickActionIdInternal();
            if (curDblId === DOUBLE_CLICK_ACTION_DISABLED) {
                openMenuForCurrentCapsule();
                return;
            }
            if ((e as MouseEvent).detail && (e as MouseEvent).detail >= 2) {
                return;
            }
            sharedCapsuleClickTimer = setTimeout(() => {
                sharedCapsuleClickTimer = null;
                openMenuForCurrentCapsule();
            }, 180);
        });

        triggerBtn.addEventListener("dblclick", (e) => {
            e.preventDefault();
            e.stopPropagation();
            clearCapsuleClickTimer();
            lastMenuClosedByTriggerAt = 0;
            removeDetachedBodyPortalsBySelector(".lv-bam");
            const curId = sharedCapsuleBlockId;
            const curEl = sharedCapsuleBlockEl;
            if (!curId || !curEl || !isValidSharedCapsuleBlock(curEl, { checkRect: true })) {
                unmountSharedCapsule(false);
                return;
            }
            const freshSnap = buildBlockSnapshot(curId, curEl);
            void executeDoubleClickActionInternal(curId, freshSnap);
        });

        capsule.appendChild(triggerBtn);
        sharedCapsuleEl = capsule;
        sharedCapsuleTriggerBtn = triggerBtn;
        sharedCapsuleTriggerIconEl = iconSpan;
        sharedCapsuleTriggerTextEl = labelSpan;
        (capsule as any).__lvDotEl = dotSpan;
        sharedCapsuleQuickBtns = [];
        sharedCapsuleRenderedSignature = "";
        return capsule;
    };

    const mountSharedCapsuleForBlock = (blockEl: HTMLElement) => {
        if (
            typeof document === "undefined" ||
            !document.body ||
            !readBlockAssistantEnabled() ||
            getLvEcosystemToggles().blockAssistantAltBOnly === true ||
            isIsolatedSettingsOrChildWindow() ||
            isCardsLeaderActive() ||
            (blockAssistantOwners.size === 0 && !blockAssistantLeader) ||
            !isValidSharedCapsuleBlock(blockEl)
        ) {
            unmountSharedCapsule(false);
            return;
        }
        const blockID = blockEl.getAttribute("data-node-id") || "";
        if (!blockID) {
            unmountSharedCapsule(false);
            return;
        }
        if (sharedCapsuleBlockId === blockID && sharedCapsuleBlockEl === blockEl && sharedCapsuleEl?.isConnected && sharedCapsuleEl.parentElement === document.body) {
            return;
        }

        let normRect: { width: number; height: number; top: number; bottom: number; left: number; right: number } | null = null;
        try {
            if (typeof blockEl.getBoundingClientRect === "function") {
                normRect = getNormalizedRect(blockEl.getBoundingClientRect());
                if (!isRectVisibleInViewport(normRect)) {
                    unmountSharedCapsule(false);
                    return;
                }
            }
        } catch {
            unmountSharedCapsule(false);
            return;
        }

        ensureStyles();
        clearCapsuleClickTimer();

        const snap = buildBlockSnapshot(blockID, blockEl);
        let badgeMeta: LvBaBadgeResult | null = null;
        for (const pFn of blockAssistantBadgeProviders.values()) { try { const r = pFn(blockID, blockEl); if (r && (r.isCard || r.dotColor || r.tooltipHint)) { badgeMeta = r; if (r.isCard) snap.isCard = true; break; } } catch {} }
        const pinned = hub.getPinnedActions(false, snap).filter((a) => a.installed !== false).slice(0, 3);
        const dblId = getDoubleClickActionIdInternal();
        const dblAction = dblId !== DOUBLE_CLICK_ACTION_DISABLED ? sharedBlockActions.get(dblId) : null;
        const dblHint = dblAction && dblAction.installed !== false ? `双击：${dblAction.label}` : "双击已关闭";
        const capsule = ensureSharedCapsuleNode();
        sharedCapsuleBlockId = blockID; sharedCapsuleBlockEl = blockEl;
        capsule.setAttribute("data-block-id", blockID); capsule.setAttribute("data-readonly", snap.isReadOnly ? "true" : "false"); capsule.setAttribute("data-is-card", snap.isCard ? "true" : "false");
        const dotEl = (capsule as any).__lvDotEl as HTMLElement | undefined;
        if (dotEl) { dotEl.style.display = (snap.isCard || badgeMeta?.dotColor) ? "inline-block" : "none"; dotEl.style.background = badgeMeta?.dotColor || "var(--b3-theme-primary, #3575f0)"; }
        const nextSignature = `${snap.isReadOnly ? "1" : "0"}|${snap.isCard ? "1" : "0"}|${snap.isFolded ? "1" : "0"}|${badgeMeta?.tooltipHint || ""}|${dblHint}|${pinned.map((a) => a.id).join(",")}`;
        if (sharedCapsuleRenderedSignature !== nextSignature) {
            sharedCapsuleRenderedSignature = nextSignature;
            if (sharedCapsuleTriggerBtn) sharedCapsuleTriggerBtn.setAttribute("title", `单击展开${badgeMeta?.tooltipHint || (snap.isCard ? "闪卡块助手菜单" : "块助手菜单")} · ${dblHint}`);
            if (sharedCapsuleTriggerIconEl) {
                sharedCapsuleTriggerIconEl.textContent = snap.isCard ? "✦" : "🧩";
            }
            if (sharedCapsuleTriggerTextEl) {
                sharedCapsuleTriggerTextEl.textContent = snap.isReadOnly
                    ? (snap.isCard ? "只读闪卡" : "只读助手")
                    : (snap.isCard ? "闪卡" : "块助手");
            }
            for (const oldBtn of sharedCapsuleQuickBtns) {
                try { oldBtn.remove(); } catch { /* ignore */ }
            }
            sharedCapsuleQuickBtns = [];
            for (const pAct of pinned) {
                const pLabel = typeof pAct.getDynamicLabel === "function" ? pAct.getDynamicLabel(snap) : pAct.label;
                const qBtn = document.createElement("button");
                qBtn.type = "button";
                qBtn.className = "lv-shared-ba-capsule__quick-btn";
                qBtn.setAttribute("data-action-id", pAct.id);
                qBtn.setAttribute("title", pLabel);
                qBtn.textContent = pAct.glyph || "⚡";
                qBtn.addEventListener("mousedown", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
                qBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    clearCapsuleClickTimer();
                    const curId = sharedCapsuleBlockId;
                    const curEl = sharedCapsuleBlockEl;
                    if (!curId || !curEl || !isValidSharedCapsuleBlock(curEl, { checkRect: true })) {
                        unmountSharedCapsule(false);
                        return;
                    }
                    const freshSnap = buildBlockSnapshot(curId, curEl);
                    const liveAct = sharedBlockActions.get(pAct.id) || pAct;
                    if (freshSnap.isReadOnly && !isReadOnlySafeBlockAction(liveAct)) {
                        showMessage("当前文档处于只读状态，已拦截写入操作", 1800, "info", "块助手");
                        return;
                    }
                    if (!isActionAllowedForSnapshot(liveAct, freshSnap)) {
                        showMessage(`当前块不支持「${liveAct.label}」`, 1800, "info", "块助手");
                        return;
                    }
                    void Promise.resolve(liveAct.execute(curId, freshSnap)).catch(() => { /* ignore */ });
                });
                capsule.appendChild(qBtn);
                sharedCapsuleQuickBtns.push(qBtn);
            }
        }

        if (!capsule.isConnected || capsule.parentElement !== document.body) {
            document.body.appendChild(capsule);
        }

        let top = 72;
        let left = 240;
        const winW = typeof window !== "undefined" ? (window.innerWidth || 1200) : 1200;
        const winH = typeof window !== "undefined" ? (window.innerHeight || 900) : 900;
        const capsuleW = Math.max(40, Number((capsule as any).offsetWidth) || 168);
        const capsuleH = Math.max(20, Number((capsule as any).offsetHeight) || 28);
        const maxLeft = Math.max(8, winW - capsuleW - 8);
        const maxTop = Math.max(8, winH - capsuleH - 8);
        const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

        if (normRect) {
            let isCoarsePointer = false;
            try {
                isCoarsePointer = typeof window !== "undefined" && typeof window.matchMedia === "function"
                    ? Boolean(window.matchMedia("(pointer: coarse)")?.matches)
                    : false;
            } catch { /* ignore */ }
            const vv = (window as any).visualViewport; const vvTop = vv?.offsetTop ?? 0; const vvH = vv?.height ?? winH; const softKeyboardOpen = winH - vvH > 110;
            const isMobileOrNarrow = winW <= 768 || isCoarsePointer;
            left = clamp(normRect.right - capsuleW, 8, maxLeft);
            if (isMobileOrNarrow) {
                const aboveTop = normRect.top - capsuleH - 6; const belowTop = normRect.bottom + 6;
                if (softKeyboardOpen) { if (aboveTop >= vvTop + 8) top = aboveTop; else { unmountSharedCapsule(false); return; } }
                else if (aboveTop >= 8) top = aboveTop;
                else if (belowTop + capsuleH <= winH - 8) top = belowTop;
                else top = Math.max(8, normRect.top - 2);
            } else top = normRect.top - 2;
        }
        left = clamp(left, 8, maxLeft);
        top = clamp(top, 8, maxTop);
        capsule.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
    };

    const syncSharedCapsuleState = () => {
        if (!sharedCapsuleWired && typeof document !== "undefined" && document.body) {
            cleanupLegacyBlockAssistantDomResidues({ keepStoreDialog: true });
        }
        if (
            typeof document === "undefined" ||
            !readBlockAssistantEnabled() ||
            isIsolatedSettingsOrChildWindow() ||
            isCardsLeaderActive() ||
            (blockAssistantOwners.size === 0 && !blockAssistantLeader)
        ) {
            teardownSharedCapsuleController();
            return;
        }
        if (sharedCapsuleWired) return;
        if (typeof document.addEventListener !== "function") return;

        cleanupLegacyBlockAssistantDomResidues({ keepStoreDialog: true });

        const isInTypingSilence = (): boolean =>
            lastCapsuleTypingAt > 0 && (Date.now() - lastCapsuleTypingAt) < CAPSULE_TYPING_SILENCE_MS;

        const resolveTargetBlock = (rawEl: Element | null | undefined): HTMLElement | null => {
            if (!rawEl || typeof rawEl.closest !== "function") return null;
            if (rawEl.closest("#lv-shared-block-capsule, .lv-bam, #lv-block-action-store-mask, #lv-block-type-picker-root")) {
                return sharedCapsuleBlockEl && isValidSharedCapsuleBlock(sharedCapsuleBlockEl) ? sharedCapsuleBlockEl : null;
            }
            if (isExcludedBlockAssistElement(rawEl) || isInsidePluginReviewOrPreviewSubtree(rawEl)) {
                return null;
            }
            const candidate = (rawEl.closest(".protyle-wysiwyg [data-node-id]") || rawEl.closest("[data-node-id]")) as HTMLElement | null;
            return isValidSharedCapsuleBlock(candidate) ? candidate : null;
        };

        const isCapsuleMounted = () => Boolean(sharedCapsuleEl?.isConnected && sharedCapsuleEl.parentElement === document.body);

        const hideCapsuleImmediately = () => {
            cancelPendingCapsuleSchedule();
            if (isCapsuleMounted() || sharedCapsuleBlockEl || sharedCapsuleBlockId) {
                unmountSharedCapsule(false);
            }
        };

        const markTypingActivityAndHideCapsule = () => {
            lastCapsuleTypingAt = Date.now();
            hideCapsuleImmediately();
        };

        const scheduleSharedCapsuleUpdate = (target: HTMLElement | null, delayMs = CAPSULE_IDLE_MOUNT_DELAY_MS) => {
            if (getLvEcosystemToggles().blockAssistantAltBOnly === true) { hideCapsuleImmediately(); return; }
            if (isInTypingSilence()) return;
            if (target) { if (target === sharedCapsuleBlockEl && isCapsuleMounted()) { if (hasPendingCapsuleTarget && pendingCapsuleTarget !== target) cancelPendingCapsuleSchedule(); return; } }
            else { if (!sharedCapsuleBlockEl && !isCapsuleMounted()) { if (hasPendingCapsuleTarget && pendingCapsuleTarget !== null) cancelPendingCapsuleSchedule(); return; } }
            if (hasPendingCapsuleTarget && pendingCapsuleTarget === target) return;
            cancelPendingCapsuleSchedule(); hasPendingCapsuleTarget = true; pendingCapsuleTarget = target;
            const sched = typeof window !== "undefined" && typeof window.setTimeout === "function" ? window.setTimeout : setTimeout;
            sharedCapsuleDebounceTimer = sched(() => {
                sharedCapsuleDebounceTimer = null;
                if (!hasPendingCapsuleTarget || isInTypingSilence()) { hasPendingCapsuleTarget = false; pendingCapsuleTarget = null; return; }
                if (pendingCapsuleTarget && !isValidSharedCapsuleBlock(pendingCapsuleTarget)) { hasPendingCapsuleTarget = false; pendingCapsuleTarget = null; unmountSharedCapsule(false); return; }
                const commitFrame = () => {
                    sharedCapsuleRafId = null;
                    if (!hasPendingCapsuleTarget || isInTypingSilence()) { hasPendingCapsuleTarget = false; pendingCapsuleTarget = null; return; }
                    const nt = pendingCapsuleTarget; hasPendingCapsuleTarget = false; pendingCapsuleTarget = null;
                    if (!nt || !isValidSharedCapsuleBlock(nt)) unmountSharedCapsule(false);
                    else if (nt !== sharedCapsuleBlockEl || !isCapsuleMounted()) mountSharedCapsuleForBlock(nt);
                };
                if (typeof requestAnimationFrame === "function") sharedCapsuleRafId = requestAnimationFrame(commitFrame); else commitFrame();
            }, delayMs);
        };
        let pointerDownCoord: { x: number; y: number } | null = null;
        const onPointerDown = (e: Event) => {
            const rt = (e as PointerEvent).target as Element | null;
            if (rt?.closest?.("#lv-shared-block-capsule, .lv-bam, #lv-block-action-store-mask, #lv-block-type-picker-root")) return;
            cancelPendingCapsuleSchedule();
            const pe = e as PointerEvent; pointerDownCoord = { x: pe.clientX || 0, y: pe.clientY || 0 };
            if (rt?.closest?.(".protyle-gutters button")) {
                const ap = rt.closest(".protyle") || queryActiveProtyle();
                const sb = ap?.querySelector?.(".protyle-wysiwyg--select[data-node-id], .protyle-wysiwyg [data-node-id]:focus-within") as HTMLElement | null;
                if (sb && isValidSharedCapsuleBlock(sb)) mountSharedCapsuleForBlock(sb);
            }
        };
        const onPointerUp = (e: Event) => {
            if (isInTypingSilence()) return;
            const rt = (e as PointerEvent).target as Element | null;
            if (rt?.closest?.("#lv-shared-block-capsule, .lv-bam, #lv-block-action-store-mask, #lv-block-type-picker-root")) return;
            const pe = e as PointerEvent;
            const dist = pointerDownCoord ? Math.hypot((pe.clientX || 0) - pointerDownCoord.x, (pe.clientY || 0) - pointerDownCoord.y) : 0;
            pointerDownCoord = null;
            if (dist > 6) return;
            scheduleSharedCapsuleUpdate(resolveTargetBlock(rt), CAPSULE_IDLE_MOUNT_DELAY_MS);
        };
        const onFocusIn = (e: Event) => { if (!isInTypingSilence()) { const t = resolveTargetBlock((e as FocusEvent).target as Element | null); if (t) scheduleSharedCapsuleUpdate(t, CAPSULE_IDLE_MOUNT_DELAY_MS); } };
        const onSelectionChange = () => {
            if (isInTypingSilence()) return;
            try {
                const sel = typeof document.getSelection === "function" ? document.getSelection() : null;
                if (!sel || sel.rangeCount === 0) return;
                const node = sel.anchorNode as (Node & { parentElement?: Element | null }) | null;
                const anchorEl = node && (node.nodeType === 1 ? (node as unknown as Element) : node.parentElement);
                const t = resolveTargetBlock(anchorEl);
                if (t) scheduleSharedCapsuleUpdate(t, sel.isCollapsed === false ? CAPSULE_SELECTION_MOUNT_DELAY_MS : CAPSULE_IDLE_MOUNT_DELAY_MS);
            } catch {}
        };
        const onKeyDown = (e: Event) => {
            const ke = e as KeyboardEvent; const key = ke.key || "";
            if (key === "Escape") { markTypingActivityAndHideCapsule(); return; }
            const isPureMod = key === "Shift" || key === "Control" || key === "Alt" || key === "Meta" || key === "CapsLock";
            const isEditOrNav = key === "Backspace" || key === "Delete" || key === "Enter" || key === "ArrowUp" || key === "ArrowDown" || key === "ArrowLeft" || key === "ArrowRight";
            const isEditSc = (ke.ctrlKey || ke.metaKey) && !isPureMod && /^(x|v|z|y|backspace|delete|enter)$/i.test(key);
            if (isEditOrNav || isEditSc || (!isPureMod && !ke.ctrlKey && !ke.metaKey && !ke.altKey)) markTypingActivityAndHideCapsule();
        };
        const onTypingOrEdit = () => { markTypingActivityAndHideCapsule(); };
        const onScrollOrTouchMove = (e: Event) => { const rt = e.target as Element | null; if (!rt?.closest?.(".lv-bam, #lv-block-action-store-mask, #lv-block-type-picker-root")) hideCapsuleImmediately(); };
        const onViewportResize = () => { hideCapsuleImmediately(); };
        const onConfigUpdated = () => { sharedCapsuleRenderedSignature = ""; const cur = sharedCapsuleBlockEl; if (cur?.isConnected) { sharedCapsuleBlockId = null; mountSharedCapsuleForBlock(cur); } };
        const onStorage = (e: Event) => { invalidateBlockAssistantConfigCache((e as StorageEvent)?.key); if (!readBlockAssistantEnabled()) { teardownSharedCapsuleController(); return; } onConfigUpdated(); };
        document.addEventListener("pointerdown", onPointerDown, { capture: true, passive: true } as any);
        document.addEventListener("pointerup", onPointerUp, { passive: true } as any);
        document.addEventListener("focusin", onFocusIn, { passive: true } as any);
        document.addEventListener("selectionchange", onSelectionChange, { passive: true } as any);
        document.addEventListener("keydown", onKeyDown, { capture: true, passive: true } as any);
        document.addEventListener("beforeinput", onTypingOrEdit, { capture: true, passive: true } as any);
        document.addEventListener("input", onTypingOrEdit, { capture: true, passive: true } as any);
        document.addEventListener("compositionstart", onTypingOrEdit, { capture: true, passive: true } as any);
        document.addEventListener("cut", onTypingOrEdit, { capture: true, passive: true } as any);
        document.addEventListener("paste", onTypingOrEdit, { capture: true, passive: true } as any);
        document.addEventListener("scroll", onScrollOrTouchMove, { capture: true, passive: true } as any);
        document.addEventListener("touchmove", onScrollOrTouchMove, { capture: true, passive: true } as any);
        if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
            window.addEventListener("scroll", onScrollOrTouchMove, { passive: true } as any);
            window.addEventListener("resize", onViewportResize, { passive: true } as any);
            window.addEventListener("lv-block-action-store-updated", onConfigUpdated);
            window.addEventListener("lv-block-action-config-changed", onConfigUpdated);
            window.addEventListener("storage", onStorage);
        }
        sharedCapsuleListenersCleanup = () => {
            document.removeEventListener("pointerdown", onPointerDown as any, true);
            document.removeEventListener("pointerup", onPointerUp as any);
            document.removeEventListener("focusin", onFocusIn as any);
            document.removeEventListener("selectionchange", onSelectionChange as any);
            document.removeEventListener("keydown", onKeyDown as any, true);
            document.removeEventListener("beforeinput", onTypingOrEdit as any, true);
            document.removeEventListener("input", onTypingOrEdit as any, true);
            document.removeEventListener("compositionstart", onTypingOrEdit as any, true);
            document.removeEventListener("cut", onTypingOrEdit as any, true);
            document.removeEventListener("paste", onTypingOrEdit as any, true);
            document.removeEventListener("scroll", onScrollOrTouchMove as any, true);
            document.removeEventListener("touchmove", onScrollOrTouchMove as any, true);
            if (typeof window !== "undefined" && typeof window.removeEventListener === "function") {
                window.removeEventListener("scroll", onScrollOrTouchMove as any);
                window.removeEventListener("resize", onViewportResize as any);
                window.removeEventListener("lv-block-action-store-updated", onConfigUpdated);
                window.removeEventListener("lv-block-action-config-changed", onConfigUpdated);
                window.removeEventListener("storage", onStorage);
            }
        };
        sharedCapsuleWired = true;
    };

    const disposeBlockAssistantUi = (opts?: { keepStoreDialog?: boolean }) => {
        teardownSharedCapsuleController();
        if (typeof document !== "undefined") {
            cleanupLegacyBlockAssistantDomResidues(opts);
        }
        for (const hook of Array.from(blockAssistantDisableHooks)) {
            try { hook(); } catch { /* ignore */ }
        }
    };

    const setBlockAssistantEnabledInternal = (next: boolean, opts?: { keepStoreDialog?: boolean }): void => {
        const enabled = Boolean(next);
        writeBlockAssistantEnabled(enabled);
        if (!enabled) {
            disposeBlockAssistantUi(opts);
        } else {
            syncSharedCapsuleState();
        }
        try {
            if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
                window.dispatchEvent(new CustomEvent("lv-block-assistant-toggle", { detail: { enabled } }));
            }
        } catch { /* ignore */ }
    };

    const builtinFallbackOpenMenuFn = (blockID: string, anchor: HTMLElement): void => {
        if (!readBlockAssistantEnabled() || typeof document === "undefined" || !document.body) return;
        runWithBaStoreChunk((c) => c.openUniqueBamMenu(blockID, anchor, { onClosedByTrigger: () => { clearCapsuleClickTimer(); lastMenuClosedByTriggerAt = Date.now(); } }));
    };
    const resolveBlockSnapshot = (blockIDOrSnapshot?: BlockSnapshot | string | null): BlockSnapshot | null => {
        if (!blockIDOrSnapshot) return null;
        if (typeof blockIDOrSnapshot === "string") {
            return buildBlockSnapshot(blockIDOrSnapshot);
        }
        return blockIDOrSnapshot;
    };

    const refreshCapsuleInternal = (blockID?: string): void => {
        if (!readBlockAssistantEnabled() || isCardsLeaderActive()) { unmountSharedCapsule(false); return; }
        const target = blockID ? queryBlockElementById(blockID) : sharedCapsuleBlockEl;
        if (target && isValidSharedCapsuleBlock(target)) { sharedCapsuleRenderedSignature = ""; sharedCapsuleBlockId = null; mountSharedCapsuleForBlock(target); }
    };
    const hub: UniversalBlockAssistantHub = {
        version: "5.0.0", protocolVersion: 500, hotkey: "Alt+B",
        registerBadgeProvider(id: string, fn: LvBaBadgeProvider): () => void {
            if (!id || typeof fn !== "function") return () => {};
            blockAssistantBadgeProviders.set(id, fn); refreshCapsuleInternal();
            return () => { if (blockAssistantBadgeProviders.get(id) === fn) { blockAssistantBadgeProviders.delete(id); refreshCapsuleInternal(); } };
        },
        refreshCapsule(blockID?: string): void { refreshCapsuleInternal(blockID); },
        get leaderPlugin() { return blockAssistantLeader; },
        isEnabled(): boolean {
            return readBlockAssistantEnabled();
        },
        setEnabled(next: boolean): void {
            setBlockAssistantEnabledInternal(next);
        },
        dispose(): void {
            disposeBlockAssistantUi();
        },
        onDisable(cb: () => void): () => void {
            if (typeof cb !== "function") return () => {};
            blockAssistantDisableHooks.add(cb);
            return () => {
                blockAssistantDisableHooks.delete(cb);
            };
        },
        register(action: UniversalBlockAction): () => void { customRegisteredActionIds.add(action.id); sharedBlockActions.set(action.id, action); return () => { customRegisteredActionIds.delete(action.id); sharedBlockActions.delete(action.id); }; },
        getActions(force = false): UniversalBlockAction[] {
            scanPlugins(force);
            return Array.from(sharedBlockActions.values());
        },
        getEnabledActions(force = false, snapshotOrBlockId?: BlockSnapshot | string | null): UniversalBlockAction[] {
            scanPlugins(force);
            const cfg = readStoreConfigFromStorage();
            const enabledSet = new Set(cfg.enabledActionIds);
            const snap = resolveBlockSnapshot(snapshotOrBlockId);
            return Array.from(sharedBlockActions.values())
                .filter((a) => a.installed !== false && enabledSet.has(a.id) && isActionAllowedForSnapshot(a, snap));
        },
        getPinnedActions(force = false, snapshotOrBlockId?: BlockSnapshot | string | null): UniversalBlockAction[] {
            scanPlugins(force);
            const cfg = readStoreConfigFromStorage();
            const snap = resolveBlockSnapshot(snapshotOrBlockId);
            return cfg.pinnedActionIds
                .map(id => sharedBlockActions.get(id))
                .filter((a): a is UniversalBlockAction => Boolean(a))
                .filter((a) => a.installed !== false && isActionAllowedForSnapshot(a, snap));
        },
        getAvailableActions(blockIDOrSnapshot: BlockSnapshot | string, force = false): UniversalBlockAction[] {
            scanPlugins(force);
            const snap = resolveBlockSnapshot(blockIDOrSnapshot);
            return Array.from(sharedBlockActions.values())
                .filter((a) => a.installed !== false && isActionAllowedForSnapshot(a, snap));
        },
        getBlockSnapshot(blockID: string, el?: HTMLElement | null): BlockSnapshot {
            return buildBlockSnapshot(blockID, el);
        },
        ensureLeader(pluginId: string, openMenuFn?: (blockID: string, anchor: HTMLElement) => void): () => void {
            blockAssistantOwners.add(pluginId);
            if (openMenuFn) {
                blockAssistantOpenFns.set(pluginId, openMenuFn);
            }
            const curHasCustom = blockAssistantLeader ? blockAssistantOpenFns.has(blockAssistantLeader) : false;
            if (!blockAssistantLeader || (openMenuFn && !curHasCustom)) {
                blockAssistantLeader = pluginId;
                blockAssistantOpenFn = openMenuFn || builtinFallbackOpenMenuFn;
            }
            scanPlugins(true);
            syncSharedCapsuleState();
            return () => {
                blockAssistantOwners.delete(pluginId);
                blockAssistantOpenFns.delete(pluginId);
                if (blockAssistantLeader === pluginId) {
                    let nextLeader: string | null = null;
                    for (const owner of blockAssistantOwners) {
                        if (blockAssistantOpenFns.has(owner)) {
                            nextLeader = owner;
                            break;
                        }
                    }
                    if (!nextLeader) {
                        nextLeader = blockAssistantOwners.values().next().value || null;
                    }
                    if (!nextLeader) {
                        const reg = getSharedLaunchpadRegistry();
                        for (const id of reg.keys()) {
                            const norm = String(id || "").trim().toLowerCase();
                            if (norm && norm !== "siyuan-exoskeleton" && norm !== "exoskeleton" && norm !== "siyuan-quickgate" && norm !== "quickgate") {
                                nextLeader = id;
                                blockAssistantOwners.add(id);
                                break;
                            }
                        }
                    }
                    blockAssistantLeader = nextLeader;
                    blockAssistantOpenFn = nextLeader ? (blockAssistantOpenFns.get(nextLeader) || builtinFallbackOpenMenuFn) : null;
                }
                scanPlugins(true);
                syncSharedCapsuleState();
            };
        },
        openMenu(blockID: string, anchor: HTMLElement): void {
            if (!readBlockAssistantEnabled()) return;
            if (anchor && isInsidePluginReviewOrPreviewSubtree(anchor)) return;
            const fn = blockAssistantOpenFn || (blockAssistantLeader ? builtinFallbackOpenMenuFn : null);
            if (fn) {
                fn(blockID, anchor);
            }
        },
        getStoreConfig(): BlockActionStoreConfig {
            return readStoreConfigFromStorage();
        },
        saveStoreConfig(config: BlockActionStoreConfig): void {
            writeStoreConfigToStorage(config);
        },
        resetStoreConfig(): BlockActionStoreConfig {
            const def: BlockActionStoreConfig = {
                version: 1,
                enabledActionIds: [...DEFAULT_ENABLED_ACTION_IDS],
                pinnedActionIds: [...DEFAULT_PINNED_ACTION_IDS],
                doubleClickActionId: DEFAULT_DOUBLE_CLICK_ACTION_ID,
            };
            writeStoreConfigToStorage(def);
            return def;
        },
        getDoubleClickActionId(): string {
            return getDoubleClickActionIdInternal();
        },
        setDoubleClickActionId(actionId: string): string {
            const cur = readStoreConfigFromStorage();
            const normalized = normalizeDoubleClickActionId(actionId);
            writeStoreConfigToStorage({
                ...cur,
                doubleClickActionId: normalized,
            });
            return normalized;
        },
        executeDoubleClickAction(blockID: string, snapshot?: BlockSnapshot | null) {
            return executeDoubleClickActionInternal(blockID, snapshot || null);
        },
        openStoreDialog,
        scanPlugins,
        getScanCacheStatus() { return getInitializedChunkSync("lv-kit-ba-store")?.getScanCacheStatus?.() ?? { lastScanTime: 0, scanCount: 0, fingerprint: "", ttlMs: 5000 }; },
    };

    if (typeof window !== "undefined") {
        (window as any).__LV_BLOCK_ASSISTANT_HUB__ = hub;
        (window as any).__LV_BA_SET_ENABLED__ = setBlockAssistantEnabledInternal;
        (window as any).__LV_BA_CANCEL_SCHEDULE__ = cancelPendingCapsuleSchedule;
        (window as any).__LV_BA_UNMOUNT__ = unmountSharedCapsule;
        (window as any).__LV_BA_SET_ENABLED__ = setBlockAssistantEnabledInternal;
        (window as any).__LV_BA_CANCEL_SCHEDULE__ = cancelPendingCapsuleSchedule;
        (window as any).__LV_BA_UNMOUNT__ = unmountSharedCapsule;
        (window as any).LvBlockAssistant = Object.assign({
            registerAction: (a: UniversalBlockAction) => hub.register(a),
            getBlockSnapshot: (id: string, el?: HTMLElement | null) => buildBlockSnapshot(id, el),
            executeAction: async (actionId: string, blockID: string, snapshot?: any) => {
                const snap = resolveBlockSnapshot(snapshot || blockID);
                const act = hub.getActions().find(a => a.id === normalizeBlockActionId(actionId));
                if (!act || act.installed === false || !isActionAllowedForSnapshot(act, snap)) {
                    if (snap?.isReadOnly) showMessage("当前文档处于只读状态，已拦截写入操作", 1800, "info", "块助手");
                    return;
                }
                if (typeof act.execute === "function") await act.execute(blockID, snap);
            },
            scanInstalledPlugins: (f?: boolean) => hub.scanPlugins(f),
            getSharedCapsuleStatus: () => ({
                wired: sharedCapsuleWired,
                mounted: Boolean(sharedCapsuleEl?.isConnected && sharedCapsuleEl.parentElement === document.body && sharedCapsuleBlockEl),
                activeBlockId: sharedCapsuleBlockId,
                cardsLeaderActive: isCardsLeaderActive(),
            }),
            openTypePicker: (id: string, anchor?: HTMLElement | null) => openBlockTypeMorphPicker(id, anchor),
            morphType: (id: string, t: string) => morphBlockTypeTo(id, t),
            morphTargets: BLOCK_MORPH_TARGETS,
        }, hub);
    }
    cleanupLegacyBlockAssistantDomResidues();
    return hub;
}

export const lvBlockAssistant = {
    hotkey: "Alt+B" as const,
    isEnabled(): boolean { try { return getBlockAssistantHub().isEnabled(); } catch { return readBlockAssistantEnabled(); } },
    setEnabled(next: boolean): void { try { getBlockAssistantHub().setEnabled(next); } catch { writeBlockAssistantEnabled(Boolean(next)); } },
    dispose(): void { try { getBlockAssistantHub().dispose(); } catch {} },
    onDisable(cb: () => void): () => void { try { return getBlockAssistantHub().onDisable?.(cb) ?? (() => {}); } catch { return () => {}; } },
    registerBadgeProvider(id: string, fn: LvBaBadgeProvider): () => void { try { return getBlockAssistantHub().registerBadgeProvider?.(id, fn) ?? (() => {}); } catch { return () => {}; } },
    refreshCapsule(blockID?: string): void { try { getBlockAssistantHub().refreshCapsule?.(blockID); } catch {} },
    registerAction(action: UniversalBlockAction): () => void { try { return getBlockAssistantHub().register(action); } catch { return () => {}; } },
    getActions(force = false): UniversalBlockAction[] { try { return getBlockAssistantHub().getActions(force); } catch { return Array.from(sharedBlockActions.values()); } },
    getEnabledActions(force = false, snapshot?: BlockSnapshot | string | null): UniversalBlockAction[] { try { return getBlockAssistantHub().getEnabledActions(force, snapshot); } catch { return []; } },
    getPinnedActions(force = false, snapshot?: BlockSnapshot | string | null): UniversalBlockAction[] { try { return getBlockAssistantHub().getPinnedActions(force, snapshot); } catch { return []; } },
    getAvailableActions(blockIDOrSnapshot: BlockSnapshot | string, force = false): UniversalBlockAction[] { try { return getBlockAssistantHub().getAvailableActions?.(blockIDOrSnapshot, force) ?? []; } catch { return []; } },
    getBlockSnapshot(blockID: string, el?: HTMLElement | null): BlockSnapshot { return buildBlockSnapshot(blockID, el); },
    ensureLeader(pluginId: string, openMenuFn?: (blockID: string, anchor: HTMLElement) => void): () => void { try { return getBlockAssistantHub().ensureLeader(pluginId, openMenuFn); } catch { return () => {}; } },
    openMenu(blockID: string, anchor: HTMLElement): void { try { getBlockAssistantHub().openMenu(blockID, anchor); } catch {} },
    getStoreConfig(): BlockActionStoreConfig { try { return getBlockAssistantHub().getStoreConfig(); } catch { return readStoreConfigFromStorage(); } },
    saveStoreConfig(cfg: BlockActionStoreConfig): void { try { getBlockAssistantHub().saveStoreConfig(cfg); } catch { writeStoreConfigToStorage(cfg); } },
    resetStoreConfig(): BlockActionStoreConfig { try { return getBlockAssistantHub().resetStoreConfig?.() ?? readStoreConfigFromStorage(); } catch { return readStoreConfigFromStorage(); } },
    getDoubleClickActionId(): string { try { return getBlockAssistantHub().getDoubleClickActionId?.() ?? DEFAULT_DOUBLE_CLICK_ACTION_ID; } catch { return DEFAULT_DOUBLE_CLICK_ACTION_ID; } },
    setDoubleClickActionId(actionId: string): string { try { return getBlockAssistantHub().setDoubleClickActionId?.(actionId) ?? normalizeDoubleClickActionId(actionId); } catch { return normalizeDoubleClickActionId(actionId); } },
    async executeDoubleClickAction(blockID: string, snapshot?: BlockSnapshot | null) { try { return await (getBlockAssistantHub().executeDoubleClickAction?.(blockID, snapshot || null) ?? { ok: false, status: "hub_unavailable", actionId: DEFAULT_DOUBLE_CLICK_ACTION_ID }); } catch { return { ok: false, status: "hub_unavailable", actionId: DEFAULT_DOUBLE_CLICK_ACTION_ID }; } },
    getSharedCapsuleStatus(): { wired: boolean; mounted: boolean; activeBlockId: string | null; cardsLeaderActive: boolean } { try { getBlockAssistantHub(); return (window as any)?.LvBlockAssistant?.getSharedCapsuleStatus?.() ?? { wired: false, mounted: false, activeBlockId: null, cardsLeaderActive: false }; } catch { return { wired: false, mounted: false, activeBlockId: null, cardsLeaderActive: false }; } },
    openStoreDialog(options?: { onConfigChange?: (config: BlockActionStoreConfig) => void }): void { try { getBlockAssistantHub().openStoreDialog(options); } catch {} },
    scanInstalledPlugins(force = false): UniversalBlockAction[] { try { return getBlockAssistantHub().scanPlugins(force); } catch { return []; } },
    scanPlugins(force = false): UniversalBlockAction[] { return lvBlockAssistant.scanInstalledPlugins(force); },
    getScanCacheStatus() { try { return (getBlockAssistantHub() as any).getScanCacheStatus?.() ?? { lastScanTime: 0, scanCount: 0, fingerprint: "", ttlMs: 5000 }; } catch { return { lastScanTime: 0, scanCount: 0, fingerprint: "", ttlMs: 5000 }; } },
    openTypePicker(blockID: string, anchor?: HTMLElement | null): () => void { return openBlockTypeMorphPicker(blockID, anchor); },
    morphType(blockID: string, targetType: string): Promise<boolean> { return morphBlockTypeTo(blockID, targetType); },
    get morphTargets(): readonly BlockMorphTarget[] { return BLOCK_MORPH_TARGETS; },
};
function ensureBlockAssistantAltBFallback(): void {
    if (typeof window === "undefined" || typeof document === "undefined" || typeof window.addEventListener !== "function") return;
    const w = window as unknown as { __LV_BA_ALT_B_WIRED__?: boolean };
    if (w.__LV_BA_ALT_B_WIRED__) return;
    w.__LV_BA_ALT_B_WIRED__ = true;

    window.addEventListener("keydown", (e: KeyboardEvent) => {
        if (!e || e.defaultPrevented) return;
        if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
        const k = String(e.key || "").toLowerCase();
        const code = String(e.code || "").toLowerCase();
        if (k !== "b" && code !== "keyb") return;
        if (!readBlockAssistantEnabled()) return;

        const hub = getBlockAssistantHub();
        if (!hub.leaderPlugin && blockAssistantOwners.size === 0) return;

        if (blockAssistantOpenFns.has("siyuan-lv-cards") || Boolean(document.getElementById("lv-cards-floating-pill"))) return;
        try {
            const wAny = window as any;
            const hostBl = wAny?.siyuan?.config?.keymap?.editor?.general?.backlinks;
            if (hostBl) {
                const activeHotkey = typeof hostBl.custom === "string" ? hostBl.custom : hostBl.default;
                if (activeHotkey === "⌥B") return;
            }
        } catch { /* ignore */ }

        const evTarget = e.target as Element | null;
        if (evTarget && isInsidePluginReviewOrPreviewSubtree(evTarget)) return;

        let blockEl: HTMLElement | null = null;
        const activeProtyle = queryActiveProtyle();
        if (activeProtyle && typeof activeProtyle.querySelector === "function") {
            const focusedList = typeof activeProtyle.querySelectorAll === "function"
                ? Array.from(activeProtyle.querySelectorAll(".protyle-wysiwyg [data-node-id]:focus-within")) as HTMLElement[]
                : [];
            const deepestFocused = focusedList.length > 0 ? focusedList[focusedList.length - 1] : null;
            blockEl = (deepestFocused
                || activeProtyle.querySelector(".protyle-wysiwyg [data-node-id]:focus-within")
                || activeProtyle.querySelector(".protyle-wysiwyg--select[data-node-id]")) as HTMLElement | null;
        }
        if (!blockEl && typeof window.getSelection === "function") {
            try {
                const anchorNode = window.getSelection()?.anchorNode as (Node & { parentElement?: Element | null }) | null;
                const startEl = anchorNode && (anchorNode.nodeType === 1 ? (anchorNode as unknown as Element) : anchorNode.parentElement);
                const candidate = startEl?.closest?.("[data-node-id]") as HTMLElement | null;
                if (candidate && !isExcludedBlockAssistElement(candidate)) {
                    blockEl = candidate;
                }
            } catch { /* ignore */ }
        }
        if (!blockEl && evTarget && typeof evTarget.closest === "function") {
            const candidate = evTarget.closest("[data-node-id]") as HTMLElement | null;
            if (candidate && !isExcludedBlockAssistElement(candidate)) {
                blockEl = candidate;
            }
        }
        const blockID = blockEl?.getAttribute?.("data-node-id") || "";
        if (!blockID || !blockEl) return;

        try { e.preventDefault?.(); } catch { /* ignore */ }
        hub.openMenu(blockID, blockEl);
    });
}

export function getDoubleClickActionId(): string {
    return lvBlockAssistant.getDoubleClickActionId();
}

export function setDoubleClickActionId(actionId: string): string {
    return lvBlockAssistant.setDoubleClickActionId(actionId);
}

if (typeof window !== "undefined") {
    ensureNoticeKitAiHubMounted();
    ensureBlockAssistantAltBFallback();
}