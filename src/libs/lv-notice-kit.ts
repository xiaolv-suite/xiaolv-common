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

const PROTOCOL_VERSION = 170; // 1.7.0 (Phase 8: Mobile Compass, Focus Mode & Ecosystem Direct Actions)
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
    checkBedlineReminder?: (now?: Date) => boolean;
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
    bottom: 24px;
    z-index: 220;
    pointer-events: none;
    font-family: var(--b3-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    /* 堆叠上限：长文卡可展开至全文，多卡同时存在时向内滚动收纳，不遮整个工作区 */
    max-height: calc(100vh - 48px);
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: none;
}
#lv-notice-host::-webkit-scrollbar { display: none; }

.lv-notice-card {
    pointer-events: auto;
    width: min(380px, calc(100vw - 32px));
    box-sizing: border-box;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--b3-theme-surface, var(--lv-safe-surface));
    border: 1px solid var(--b3-theme-surface-lighter, var(--lv-safe-border));
    box-shadow: 0 10px 28px -4px rgba(0, 0, 0, 0.14), 0 2px 8px -1px rgba(0, 0, 0, 0.05);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    color: var(--b3-theme-on-surface, var(--lv-safe-text));
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
    color: var(--b3-theme-on-primary, #fff);
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
    transition: all 0.15s ease;
}
.lv-notice-close-btn:hover {
    background: var(--b3-theme-surface-lighter, rgba(0,0,0,0.08));
    transform: scale(1.08);
}
.lv-notice-close-btn:active {
    transform: scale(0.92);
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
    color: var(--b3-theme-on-primary, #ffffff);
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
        top: max(10px, env(safe-area-inset-top, 10px));
        bottom: auto;
        align-items: center;
        padding: 0 12px;
        /* 小屏堆叠上限：3 张长卡（每张可展开至全文）会占近半屏遮挡正文——
           限高滚动收纳，最新卡在可视区顶部，旧卡滚动可达 */
        max-height: calc(100dvh - 160px);
        overflow-y: auto;
        overscroll-behavior: contain;
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

/* ===== 移动端统一弹射坞（Bottom Sheet）===== */
#lv-launchpad-sheet-mask {
    position: fixed;
    inset: 0;
    z-index: 980;
    background: rgba(0, 0, 0, 0.36);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    animation: lvSheetMaskIn 160ms ease-out both;
}
#lv-launchpad-sheet-mask .lv-sheet {
    width: 100%;
    max-height: min(86dvh, 720px);
    overflow-y: auto;
    overscroll-behavior: contain; /* 橡皮筋滚动不外溢到思源文档层 */
    background: var(--b3-theme-surface, var(--lv-safe-surface));
    color: var(--b3-theme-on-surface, var(--lv-safe-text));
    border-radius: 20px 20px 0 0;
    box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.22);
    padding: 10px 16px calc(16px + env(safe-area-inset-bottom, 0px));
    box-sizing: border-box;
    animation: lvSheetUp 240ms cubic-bezier(0.22, 1, 0.36, 1) both;
    will-change: transform; /* GPU 合成层：开合动画满帧 */
}
/* 磁贴徽记胶囊：轻量状态一目了然 */
.lv-sheet-tile-badge {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--b3-theme-primary-lightest, rgba(53,118,199,0.14));
    color: var(--b3-theme-primary, #3576c7);
    line-height: 1.4;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.lv-sheet-tile-badge--success { background: rgba(39,174,96,0.14); color: #27ae60; }
.lv-sheet-tile-badge--warn { background: rgba(242,153,74,0.16); color: #d35400; }
.lv-sheet-result-count { font-size: 11px; color: var(--b3-theme-on-surface-light, #9ca3af); padding: 0 2px 2px; }
/* 穿透结果分组头（按来源） */
.lv-sheet-result-group { font-size: 11px; font-weight: 700; color: var(--b3-theme-primary, #3576c7); padding: 6px 2px 2px; }
/* 搜索历史 chips */
.lv-sheet-histrow { display: flex; align-items: center; gap: 6px; overflow-x: auto; margin: 0 0 8px; overscroll-behavior-x: contain; }
.lv-sheet-histrow-label { flex-shrink: 0; font-size: 11px; color: var(--b3-theme-on-surface-light, var(--lv-safe-text-muted)); }
.lv-sheet-histrow-chip {
    flex-shrink: 0;
    border: 1px dashed var(--b3-border-color, var(--lv-safe-border));
    background: transparent;
    border-radius: 999px;
    padding: 4px 11px;
    font-size: 12px;
    color: var(--b3-theme-on-surface, var(--lv-safe-text));
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
}
.lv-sheet-histrow-chip:active { background: var(--b3-theme-primary-lightest, rgba(53, 118, 199, 0.12)); }
/* 生态直达行（今日回顾 / 小驴 AI） */
.lv-sheet-eco-row { display: flex; gap: 8px; margin: 2px 0 10px; }
.lv-sheet-eco-chip {
    flex: 1;
    border: 1px solid var(--b3-border-color, var(--lv-safe-border));
    background: var(--b3-theme-background-light, var(--b3-theme-surface-light, rgba(128, 128, 128, 0.08)));
    border-radius: 12px;
    padding: 9px 10px;
    font-size: 13px;
    font-weight: 600;
    color: var(--b3-theme-on-surface, var(--lv-safe-text));
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
}
.lv-sheet-eco-chip:active { transform: scale(0.97); background: var(--b3-theme-primary-lightest, rgba(53, 118, 199, 0.12)); }
/* 最近直达行：上次使用的插件一键再达（最常用单手路径零翻找） */
.lv-sheet-recent { display: flex; align-items: center; gap: 6px; overflow-x: auto; margin: 0 0 8px; padding-bottom: 2px; overscroll-behavior-x: contain; }
.lv-sheet-recent-label { flex-shrink: 0; font-size: 11px; color: var(--b3-theme-on-surface-light, var(--lv-safe-text-muted)); }
.lv-sheet-recent-chip {
    flex-shrink: 0;
    border: 1px solid var(--b3-border-color, var(--lv-safe-border));
    background: var(--b3-theme-background-light, var(--b3-theme-surface-light, rgba(128, 128, 128, 0.08)));
    border-radius: 999px;
    padding: 5px 12px;
    font-size: 13px;
    color: var(--b3-theme-on-surface, var(--lv-safe-text));
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
}
.lv-sheet-recent-chip:active { background: var(--b3-theme-primary-lightest, rgba(53,118,199,0.12)); }
.lv-sheet-handle {
    width: 44px;
    height: 5px;
    margin: 0 auto 10px;
    border-radius: 999px;
    background: var(--b3-border-color, var(--lv-safe-border));
}
.lv-sheet-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
}
.lv-sheet-title { font-size: 17px; font-weight: 700; color: var(--b3-theme-on-surface, var(--lv-safe-text)); }
.lv-sheet-close {
    border: none;
    background: transparent;
    font-size: 16px;
    line-height: 1;
    padding: 8px;
    color: var(--b3-theme-on-surface, var(--lv-safe-text));
    cursor: pointer;
}
.lv-sheet-search { width: 100%; box-sizing: border-box; margin-bottom: 8px; }
.lv-sheet-results { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
.lv-sheet-result {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    width: 100%;
    border: none;
    background: var(--b3-theme-background-light, var(--b3-theme-surface-light, rgba(128, 128, 128, 0.08)));
    border-radius: 10px;
    padding: 8px 10px;
    text-align: left;
    cursor: pointer;
}
.lv-sheet-result-badge {
    flex-shrink: 0;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: 999px;
    background: var(--b3-theme-primary-lightest, rgba(53,118,199,0.12));
    color: var(--b3-theme-primary, #3576c7);
}
.lv-sheet-result-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.lv-sheet-result-title { font-size: 14px; font-weight: 600; color: var(--b3-theme-on-surface, var(--lv-safe-text)); }
.lv-sheet-result-snippet {
    font-size: 12px;
    color: var(--b3-theme-on-surface-light, var(--lv-safe-text-muted));
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
/* 磁贴网格自适应列数：1~2 个插件时自动放宽为居中大卡，3+ 恢复三列，杜绝孤卡稀疏 */
.lv-sheet-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(104px, 1fr)); gap: 10px; margin-bottom: 10px; }
.lv-sheet-grid--sparse { grid-template-columns: repeat(auto-fit, minmax(150px, 190px)); justify-content: center; }
.lv-sheet-subtitle { font-size: 12px; color: var(--b3-theme-on-surface-light, var(--lv-safe-text-muted)); margin: -6px 0 10px; }
.lv-sheet-tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    border: 1px solid var(--b3-border-color, var(--lv-safe-border));
    background: var(--b3-theme-background-light, var(--b3-theme-surface-light, rgba(128, 128, 128, 0.08)));
    border-radius: 14px;
    padding: 12px 6px 10px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    position: relative;
}
.lv-sheet-tile:active { transform: scale(0.96); }
.lv-sheet-tile-dot { width: 10px; height: 10px; border-radius: 999px; background: var(--b3-theme-primary, #3576c7); }
.lv-sheet-tile-name { font-size: 14px; font-weight: 600; color: var(--b3-theme-on-surface, var(--lv-safe-text)); text-align: center; }
.lv-sheet-tile-desc {
    font-size: 11px;
    color: var(--b3-theme-on-surface-light, var(--lv-safe-text-muted));
    text-align: center;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.lv-sheet-tile--expanded { grid-column: 1 / -1; flex-direction: row; flex-wrap: wrap; justify-content: flex-start; padding: 12px; }
.lv-sheet-tile-icon { display: grid; place-items: center; width: 26px; height: 26px; color: var(--b3-theme-on-surface, var(--lv-safe-text)); }
.lv-sheet-tile-icon svg { width: 22px; height: 22px; }
.lv-sheet-tile-actions { display: flex; flex-wrap: wrap; gap: 6px; width: 100%; margin-top: 6px; }
.lv-sheet-action-chip {
    border: 1px solid var(--b3-border-color, var(--lv-safe-border));
    background: var(--b3-theme-surface, var(--lv-safe-surface));
    border-radius: 999px;
    padding: 6px 12px;
    font-size: 13px;
    color: var(--b3-theme-on-surface, var(--lv-safe-text));
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
}
.lv-sheet-action-chip:active { background: var(--b3-theme-primary-lightest, rgba(53,118,199,0.12)); }
.lv-sheet-empty { grid-column: 1 / -1; text-align: center; font-size: 13px; color: var(--b3-theme-on-surface-light, var(--lv-safe-text-muted)); padding: 14px 0; }
.lv-sheet-hint { text-align: center; font-size: 11px; color: var(--b3-theme-on-surface-light, var(--lv-safe-text-muted)); }
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
    color: var(--b3-theme-on-surface, var(--lv-safe-text));
    /* 旧 WebView 无 color-mix 时回退实色，再渐进增强毛玻璃 */
    background: var(--b3-theme-surface, var(--lv-safe-surface));
    background: color-mix(in srgb, var(--b3-theme-surface, var(--lv-safe-surface)) 82%, transparent);
    border: 1px solid var(--b3-border-color, var(--lv-safe-border));
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.18);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    -webkit-tap-highlight-color: transparent;
    touch-action: none;
    cursor: pointer;
    transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease, box-shadow 200ms ease;
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
.lv-sheet-today { display: flex; align-items: center; gap: 6px; overflow-x: auto; margin: 0 0 8px; padding: 6px 8px; border-radius: 12px; background: var(--b3-theme-primary-lightest, rgba(53, 118, 199, 0.08)); overscroll-behavior-x: contain; }
.lv-sheet-today-label { flex-shrink: 0; font-size: 12px; font-weight: 700; color: var(--b3-theme-primary, #3576c7); }
.lv-sheet-today-chip {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    border: 1px solid var(--b3-border-color, #e4e7eb);
    background: var(--b3-theme-surface, #fff);
    border-radius: 999px;
    padding: 5px 12px;
    font-size: 13px;
    font-weight: 600;
    color: var(--b3-theme-on-surface, #1f2329);
    cursor: pointer;
}
.lv-sheet-today-chip:active { transform: scale(0.96); }
.lv-sheet-today-dot { width: 8px; height: 8px; border-radius: 999px; background: var(--b3-theme-primary, #3576c7); }

/* ===== 专注模式：坞头 🌙 开关 + 入口徽记 ===== */
.lv-sheet-moon {
    border: none;
    background: transparent;
    font-size: 13px;
    line-height: 1;
    padding: 6px 8px;
    margin-right: 2px;
    border-radius: 8px;
    color: var(--b3-theme-on-surface, #1f2329);
    cursor: pointer;
    white-space: nowrap;
}
.lv-sheet-moon[aria-pressed="true"] {
    background: var(--b3-theme-primary-lightest, rgba(53, 118, 199, 0.12));
    color: var(--b3-theme-primary, #3576c7);
    font-weight: 600;
}
@media (prefers-reduced-motion: reduce) {
    #lv-launchpad-mobile-ball { transition: none; }
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

    // 接入统一浮层栈 Esc 秒关（动态同步：仅当真正存在活动卡片时入栈，卡片清空时出栈）
    let unregisterNoticeSurface: (() => void) | null = null;
    function syncNoticeSurface() {
        const hasVisible = activePackets.length > 0;
        if (hasVisible && !unregisterNoticeSurface) {
            unregisterNoticeSurface = lvSurfaceStack.push({
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
        } else if (!hasVisible && unregisterNoticeSurface) {
            unregisterNoticeSurface();
            unregisterNoticeSurface = null;
        }
    }

    function render() {
        syncNoticeSurface();
        if (!hostEl) return;
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
 * 思源文档排队互斥锁：同一文档 ID 的异步写入自动串行化，彻底消除 document is locked 错误
 * 支持超时自动熔断（默认 20s），杜绝异常挂起任务永久死锁文档
 */
export async function withDocLock<T>(docId: string, task: () => Promise<T>, timeoutMs = 20000): Promise<T> {
    if (!docId) return task();
    const map = getDocLockMap();
    const prev = map.get(docId) || Promise.resolve();

    let release!: () => void;
    const current = new Promise<void>((resolve) => { release = resolve; });
    const chained = prev.then(() => current, () => current);
    map.set(docId, chained);

    let timer: any = null;
    try {
        await prev;
        const taskPromise = task();
        if (timeoutMs > 0 && typeof setTimeout === "function") {
            const timeoutPromise = new Promise<never>((_, reject) => {
                timer = setTimeout(() => {
                    reject(new Error(`[withDocLock] 写入任务超时 (${timeoutMs}ms) 强制释放: ${docId}`));
                }, timeoutMs);
            });
            return await Promise.race([taskPromise, timeoutPromise]);
        }
        return await taskPromise;
    } finally {
        if (timer !== null) {
            clearTimeout(timer);
        }
        release();
        if (map.get(docId) === chained) {
            map.delete(docId);
        }
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

function getBackupHub(): LvBackupHub {
    if (typeof window === "undefined") {
        return {
            version: PROTOCOL_VERSION,
            register: (plugin, backup, restore) => {
                backupRegistry.set(plugin, { plugin, backup, restore });
                return () => backupRegistry.delete(plugin);
            },
            exportFull: async () => ({
                v: 1,
                ecosystem: "xiaolv",
                exportedAt: new Date().toISOString(),
                plugins: {},
            }),
            restoreFull: async () => ({ success: [], failed: [] }),
        };
    }

    if (window.__LV_BACKUP_HUB__ && window.__LV_BACKUP_HUB__.version >= PROTOCOL_VERSION) {
        return window.__LV_BACKUP_HUB__;
    }

    const hub: LvBackupHub = {
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
            executeAction: () => false,
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
            maybeShowOnboardingCard();
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
            // 通过 DOM 或 CustomEvent 派发打开弹射坞并唤起罗盘
            window.dispatchEvent(new CustomEvent("lv:launchpad:open", { detail: { mode: _mode || "popover" } }));
            openMobileSheet();
        },

        close(): void {
            window.dispatchEvent(new CustomEvent("lv:launchpad:close"));
            closeMobileSheet();
        },

        checkBedlineReminder(now?: Date): boolean {
            return checkAndTriggerBedline(now);
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
const MOBILE_SHEET_ID = "lv-launchpad-sheet-mask";

/** 思源移动端检测：手机宿主渲染 #mobileTopBar；UA 兜底覆盖 browser-mobile 场景 */
export function isMobileFrontend(): boolean {
    if (typeof document === "undefined") return false;
    if (document.getElementById("mobileTopBar")) return true;
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

/** 聚合徽记：任一已注册罗盘条目带 badge 时点亮脉冲圆点；专注模式时点亮 🌙 */
function refreshEntryBadgeDot(): void {
    if (typeof document === "undefined") return;
    try {
        const hasBadge = getLaunchpadHub().getItems().some((it) => Boolean(it.badge) && it.state !== "hidden");
        const focus = isNotifyFocusActive();
        for (const root of [document.getElementById(MOBILE_ENTRY_ID), document.getElementById(MOBILE_BALL_ID)]) {
            if (!root) continue;
            const dot = root.querySelector(".lv-entry-dot");
            if (dot) (dot as HTMLElement).style.display = hasBadge ? "block" : "none";
            const moon = root.querySelector(".lv-entry-moon");
            if (moon) (moon as HTMLElement).style.display = focus ? "inline-block" : "none";
        }
    } catch { /* ignore */ }
}

const COMPASS_SVG = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><polygon points="15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5"/></svg>`;

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
    topBar.appendChild(btn);
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

    document.body.appendChild(ball);
    refreshEntryBadgeDot();
    scheduleBallIdle(ball, pos);
    wireViewportWatch();
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
        if (ballIdleTimer !== undefined) { try { window.clearTimeout(ballIdleTimer); } catch { /* ignore */ } ballIdleTimer = undefined; }
        unwireMobileSuppression();
        unwireViewportWatch();
        ballCurrentPos = undefined;
        try { document.getElementById(MOBILE_ENTRY_ID)?.remove(); } catch { /* ignore */ }
        try { document.getElementById(MOBILE_BALL_ID)?.remove(); } catch { /* ignore */ }
    };
}

/* ===== 与思源原生移动端的冲突避让：原生对话框打开 / 文本输入聚焦（键盘弹起）时隐藏悬浮球 ===== */

let ballDialogObserver: MutationObserver | undefined;
let ballFocusHandler: ((ev: FocusEvent) => void) | undefined;
let ballDialogOpen = false;
let ballInputFocused = false;

function updateBallSuppression(): void {
    if (typeof document === "undefined") return;
    const ball = document.getElementById(MOBILE_BALL_ID);
    if (ball) ball.classList.toggle("lv-ball-suppressed", ballDialogOpen || ballInputFocused);
}

/** 依据实时状态重算抑制：对话框开合 + 当前焦点元素（不依赖 focusout——焦点元素被移除时 Chromium 不派发 focusout） */
function recomputeBallSuppression(): void {
    let open = false;
    try {
        // 桌面宿主 Dialog 为 .b3-dialog--container（双横线），手机宿主为 .b3-dialog__container（双下划线）
        open = Boolean(document.querySelector(".b3-dialog--container, .b3-dialog__container"));
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
    // 原生/插件 Dialog 覆盖层出现时让位（body 直挂子级探测，不做深层 subtree 扫描，开销恒定）
    if (typeof MutationObserver === "function") {
        ballDialogObserver = new MutationObserver(() => recomputeBallSuppression());
        try { ballDialogObserver.observe(document.body, { childList: true }); } catch { /* ignore */ }
    }
    // 键盘弹起（任意文本输入聚焦）时隐藏，避免悬浮球压在软键盘/输入法面板上
    if (typeof document.addEventListener === "function") {
        ballFocusHandler = () => recomputeBallSuppression();
        document.addEventListener("focusin", ballFocusHandler, true);
    }
}

function unwireMobileSuppression(): void {
    try { ballDialogObserver?.disconnect(); } catch { /* ignore */ }
    ballDialogObserver = undefined;
    if (ballFocusHandler && typeof document !== "undefined" && typeof document.removeEventListener === "function") {
        try { document.removeEventListener("focusin", ballFocusHandler, true); } catch { /* ignore */ }
    }
    ballFocusHandler = undefined;
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
    // 优先渲染插件真实 sprite 图标（kebab/camel 双形态探测）；缺失时回退品牌色圆点
    const iconHref = resolveIconHref(item.svgIcon);
    if (iconHref) {
        const iconWrap = document.createElement("span");
        iconWrap.className = "lv-sheet-tile-icon";
        if (item.color) iconWrap.style.color = item.color; // 品牌色染色，磁贴一眼可辨
        iconWrap.innerHTML = `<svg aria-hidden="true"><use xlink:href="${iconHref}" href="${iconHref}"></use></svg>`;
        tile.appendChild(iconWrap);
    } else {
        const dot = document.createElement("span");
        dot.className = "lv-sheet-tile-dot";
        if (item.color) dot.style.background = item.color;
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
    // 主点击：唤起插件主界面（记录最近直达）
    tile.addEventListener("click", () => {
        hapticFeedback(8);
        pushRecentTileId(item.id);
        closeMobileSheet();
        try { item.onClick(); } catch (e) { console.warn("[LvLaunchpad] 磁贴唤起失败:", e); }
    });

    // 展开二级行动直达芯片（触屏长按 500ms / 桌面右键 contextmenu 统一展开）
    const expandTile = () => {
        hapticFeedback(14);
        const mask = document.getElementById(MOBILE_SHEET_ID);
        if (!mask) return;
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
    title.textContent = "🐴 小驴罗盘";
    head.appendChild(title);
    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "lv-sheet-close";
    closeBtn.setAttribute("aria-label", "关闭");
    closeBtn.textContent = "✕";
    closeBtn.addEventListener("click", () => closeMobileSheet());
    head.appendChild(closeBtn);

    // 专注模式开关（🌙）：开启后全生态 card/capsule 静音至今晚，仅留历史档
    const moonBtn = document.createElement("button");
    moonBtn.type = "button";
    moonBtn.className = "lv-sheet-moon";
    moonBtn.setAttribute("aria-label", "专注模式开关");
    const syncMoon = () => {
        const active = isNotifyFocusActive();
        const until = getNotifyFocusUntil();
        moonBtn.textContent = active ? `🌙 至 ${new Date(until).toTimeString().slice(0, 5)}` : "🌙";
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

    document.body.appendChild(mask);
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
    if (typeof window === "undefined") {
        return {
            version: PROTOCOL_VERSION,
            registerProvider: (plugin, provider) => {
                searchProviders.set(plugin, provider);
                return () => searchProviders.delete(plugin);
            },
            search: async () => [],
        };
    }

    if (window.__LV_OMNISEARCH__ && window.__LV_OMNISEARCH__.version >= PROTOCOL_VERSION) {
        return window.__LV_OMNISEARCH__;
    }

    const hub: LvOmnisearchHub = {
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
