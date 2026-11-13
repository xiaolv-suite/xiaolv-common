/**
 * 小驴全生态跨插件联邦 SDK（零外部依赖，直接复制到各插件工程内使用）
 * Lv Ecosystem Federation SDK · Epoch 7 Standard
 *
 * 适用插件：
 * 1. siyuan-exoskeleton (思源外骨骼 · 桌面宿主)
 * 2. siyuan-checkin   (小驴打卡)
 * 3. siyuan-contacts  (小驴人脉)
 * 4. siyuan-home      (小驴管家)
 * 5. siyuan-speed-switch (小驴雷切)
 * 6. siyuan-glean     (小驴拾遗)
 * 7. siyuan-exam      (小驴考试)
 * 8. siyuan-lv-cards  (小驴闪卡)
 * 9. xiaolv-common    (小驴常用)
 *
 * 铁律保障：
 * - 零强依赖：兄弟插件未安装时自动触发 fallback，绝不抛出未捕获异常
 * - 进程内零私有存储穿透：只走公开桥方法与 DOM CustomEvent
 * - 类型完备：涵盖全生态 9 大插件标准公开接口
 */

/* ========================================================================= */
/* 1. 结果包装信封 (ActionResult Envelope)                                    */
/* ========================================================================= */

export interface ActionResult<T = unknown> {
    ok: boolean;
    data?: T;
    code?: string;
    message?: string;
    details?: unknown;
}

/* ========================================================================= */
/* 2. 小驴生态统一事件信封 (Unified Event Bus Envelope v1)                    */
/* ========================================================================= */

export interface EcosystemEventEnvelope<T = Record<string, unknown>> {
    v: 1;
    source: string;
    type: string;
    eventId: string;
    at: string;
    payload: T;
    idempotencyKey: string;
}

export const ECOSYSTEM_EVENTS = Object.freeze({
    // 打卡
    CHECKIN_RECORDED: "checkin:event-recorded",
    CHECKIN_DELETED: "checkin:event-deleted",
    // 人脉
    CONTACTS_INTERACTION: "lv-contacts:interaction-logged",
    CONTACTS_PERSON_CREATED: "lv-contacts:person-created",
    CONTACTS_DATA_CHANGED: "lv-contacts:data-changed",
    // 管家
    HOME_DATA_CHANGED: "lv-home:data-changed",
    // 雷切
    RAIKIRI_NAVIGATED: "lv-raikiri:navigated",
    // 拾遗
    GLEAN_DATA_CHANGED: "lv-glean:data-changed",
    GLEAN_STATUS_CHANGED: "lv-glean:clip-status-changed",
    // 考试
    EXAM_SESSION_ENDED: "lv-exam:session-ended",
    EXAM_WRONGBOOK_CHANGED: "lv-exam:wrongbook-changed",
    EXAM_STATS: "lv-exam:stats",
    // 闪卡
    CARDS_REVIEWED: "lv-cards:reviewed",
    CARDS_INCREMENTAL_EXTRACT: "lv-cards:incremental-extract",
    // 任务视界 (Task Horizon) 联动
    HORIZON_ACTION_CREATED: "horizon:action-created",
    // 常用
    COMMON_CREATED: "xiaolv:common:item-created",
    COMMON_UPDATED: "xiaolv:common:item-updated",
    COMMON_DELETED: "xiaolv:common:item-deleted",
    // 快门
    RAIKIRI_COMMAND_EXECUTED: "lv-raikiri:command-executed",
    RAIKIRI_DATA_CHANGED: "lv-raikiri:data-changed",
    // 联盟伙伴：Task Horizon (任务视界)
    TASK_COMPLETED: "tm:task-completed",
} as const);

/* ========================================================================= */
/* 3. 各插件公开桥类型定义 (Public Bridge Interfaces)                        */
/* ========================================================================= */

// --- ① 小驴打卡 (siyuan-checkin) ---
export interface CheckinItem {
    id: string;
    name: string;
    kind: string;
    unit?: string;
    archived?: boolean;
}

export interface CheckinBatchInput {
    itemId: string;
    value?: number;
    unit?: string;
    source: "api";
    externalRef?: string;
    note?: string;
    occurredAt?: string;
}

export interface CheckinBatchResult {
    kind: "recorded" | "duplicate" | "discarded" | "blocked" | "rejected";
    eventId?: string;
    reason?: string;
    usedFallbackTime?: boolean;
}

export interface CheckinOccasionItem {
    id: string;
    name: string;
    date: string;
    category?: string;
    enabled: boolean;
    priority?: string;
    time?: string;
}

export interface CheckinBridgeApi {
    readonly protocol: "siyuan-checkin";
    readonly version: number;
    whenReady(): Promise<boolean>;
    hasCapability(name: string): boolean;
    queryItems(options?: { includeArchived?: boolean; limit?: number }): CheckinItem[];
    recordEventsBatch(inputs: CheckinBatchInput[]): Promise<CheckinBatchResult[]>;
    getStreaks(itemIds?: string[]): Record<string, { current: number; longest: number }>;
    getStrengthSummary?(): unknown;
    queryOccasions?(options?: { category?: string; includeDisabled?: boolean }): CheckinOccasionItem[];
    completeOccasion?(id: string, occurrenceDate: string, completed: boolean): Promise<boolean>;
}

// --- ② 小驴人脉 (siyuan-contacts) ---
export interface ContactsPerson {
    docId: string;
    itemId: string;
    name: string;
    group: string;
    tags: string[];
}

export interface ContactsInteractionResult {
    recorded: number;
    applied: number;
    skipped: number;
    failed: number;
    unknown: number;
    complete: boolean;
    results: Array<{
        index: number;
        docId?: string;
        status: "applied" | "skipped" | "failed" | "unknown";
        writeState: "not_sent" | "rejected" | "unknown" | "verified";
    }>;
}

export interface ContactsBridgeApi {
    readonly protocol: 2;
    whenReady?(): Promise<boolean>;
    hasCapability?(name: string): boolean;
    getOverview?(): unknown;
    searchPeople(kw?: string): Promise<ContactsPerson[]>;
    getPerson(docId: string): Promise<ContactsPerson | null>;
    ensurePerson(name: string, options?: { ref?: string; docId?: string }): Promise<ContactsPerson & { created: boolean }>;
    recordInteraction(docIds: readonly string[], meta?: { ref?: string; date?: string; place?: string; note?: string }): Promise<ContactsInteractionResult>;
    appendFact?(personDocId: string, input: { text: string; category?: string; sourceRef?: string }): Promise<unknown>;
    getFacts?(personDocId: string): Promise<unknown[]>;
}

// --- ③ 小驴管家 (siyuan-home) ---
export interface HomeSummary {
    overdue: number;
    soon: number;
    today: number;
    updatedAt: string;
}

export interface HomeBridgeApi {
    readonly protocol: 1;
    readonly capabilities: readonly string[];
    whenReady(): Promise<boolean>;
    hasCapability?(name: string): boolean;
    getOverview?(): unknown;
    summary(): HomeSummary;
    addMemo(title: string, dueDate: string): Promise<void>;
    openButler(): void;
    openReminders(): void;
}

// --- ④ 小驴雷切 (siyuan-speed-switch) ---
export interface RaikiriHomeModuleOptions {
    moduleId: string;
    title: string;
    icon?: string;
    category?: string;
    supportedDevices?: Array<"desktop" | "sidebar" | "mobile">;
    sizes?: Array<"xs" | "small" | "medium" | "tall" | "wide" | "large" | "full">;
    description?: string;
    source?: { pluginId: string; name: string; version?: string };
    read: (config: unknown, device: string, options?: unknown) => Promise<{ title?: string; items: Array<{ label: string; value?: string; command?: string }> }>;
    open?: () => void;
}

export interface RaikiriBridgeApi {
    readonly protocol: 1;
    readonly capabilities: readonly string[];
    whenReady(): boolean | Promise<boolean>;
    hasCapability?(name: string): boolean;
    openSwitcher(focusSearch?: boolean): ActionResult<boolean>;
    openWorkbench(options?: { tab?: string; entry?: string }): ActionResult<boolean>;
    registerHomeModule?(options: RaikiriHomeModuleOptions): (() => void) | { unregister?: () => void };
}

// --- ⑤ 小驴拾遗 (siyuan-glean) ---
export interface GleanClip {
    id: string;
    title: string;
    hpath: string;
    status: "inbox" | "later" | "reading" | "done" | "archived";
    url?: string;
    site?: string;
    tags?: string[];
    summary?: string;
}

export interface GleanBridgeApi {
    readonly protocol: 1;
    readonly apiVersion: 1;
    readonly capabilities: readonly string[];
    whenReady(): Promise<boolean>;
    hasCapability?(name: string): boolean;
    listClips(filter?: { status?: string; tag?: string; keyword?: string; limit?: number }): Promise<GleanClip[]>;
    getClip(id: string): Promise<GleanClip | null>;
    setClipStatus(id: string, status: "inbox" | "later" | "reading" | "done" | "archived"): Promise<void>;
}

// --- ⑥ 小驴考试 (siyuan-exam) ---
export interface ExamStats {
    streakDays: number;
    accuracyPercent: number;
    todayAnswered: number;
    wrongbookCount: number;
}

export interface ExamBridgeApi {
    readonly protocol: 1;
    readonly capabilities: readonly string[];
    whenReady(): Promise<boolean>;
    hasCapability?(name: string): boolean;
    getOverview?(): unknown;
    statsRead(): Promise<ExamStats>;
    practice(): void;
    wrongbook(): void;
    mock(): void;
}

// --- ⑦ 小驴闪卡 (siyuan-lv-cards) ---
export interface CardsStats {
    todayReviews: number;
    todayNew: number;
    todayForget: number;
    streak: number;
    dueCount: number;
}

export interface CardsDueSummary {
    unreviewedCount: number;
    unreviewedNewCardCount: number;
    unreviewedOldCardCount: number;
    todayReviewedCount?: number;
    updatedAt: string;
}

/** 渐进阅读划词摘录载荷（Issue #17 标准） */
export interface IncrementalExtractPayload {
    text: string;
    sourceBlockId: string;
    docId: string;
    docTitle?: string;
    sourceUrl?: string;
    tags?: string[];
    createdAt?: string;
}

/** 任务视界 (Task Horizon) 联动行动项载荷 */
export interface TaskHorizonActionPayload {
    taskMarkdown: string;
    quoteText: string;
    sourceDocId: string;
    sourceBlockId?: string;
    sourceTitle?: string;
    sourceUrl?: string;
    priority?: string;
    createdAt?: string;
}

export function formatTaskHorizonItem(quote: string, docId: string, title: string, blockId?: string): string {
    const cleanQuote = quote.replace(/[\r\n]+/g, " ").trim().slice(0, 80);
    const refId = blockId || docId;
    const cleanTitle = title || "文章";
    return `- [ ] 落地阅读行动项：${cleanQuote} 来源：(( ${refId} '${cleanTitle}' )) {: custom-status="todo" custom-priority="medium" }`;
}

export interface CreateCardInput {
    requestId?: string;
    sourceBlockId?: string;
    deckName?: string;
    front: string;
    back: string;
    tags?: string[];
    sourceDocId?: string;
}

export interface CardsBridgeApi {
    readonly protocol: number;
    readonly capabilities: readonly string[];
    whenReady(): Promise<boolean>;
    hasCapability?(name: string): boolean;
    getOverview?(): unknown;
    getStats(): Promise<ActionResult<CardsStats>>;
    getDueSummary(): Promise<ActionResult<CardsDueSummary>>;
    openHub?(tab?: string): Promise<ActionResult<boolean>>;
    openReview?(options?: unknown): Promise<ActionResult<boolean>>;
    createCard?(input: CreateCardInput): Promise<ActionResult<boolean | { kind?: "atomic"; createdBlockID?: string; blockID?: string; enrolled?: boolean; ok?: boolean }>>;
    receiveExtract?(envelope: {
        requestId?: string;
        content: string;
        sourceBlockId: string;
        sourceDocId?: string;
        sourceTitle?: string;
        tags?: string[];
    }): Promise<ActionResult<{ kind?: "extract" | "atomic"; createdBlockID?: string; blockID?: string; enrolled?: boolean; ok?: boolean }>>;
}

// --- ⑧ 小驴常用 (xiaolv-common) ---
export interface CommonSnippet {
    id: string;
    title: string;
    content: string;
    category?: string;
    tags?: string[];
    alias?: string;
}

export interface CommonBridgeApi {
    readonly protocol: number;
    readonly capabilities: readonly string[];
    whenReady(): Promise<boolean>;
    hasCapability?(name: string): boolean;
    search(kw: string): Promise<ActionResult<CommonSnippet[]>>;
    get(id: string): Promise<ActionResult<CommonSnippet | null>>;
    recent(): Promise<ActionResult<CommonSnippet[]>>;
    favorites(): Promise<ActionResult<CommonSnippet[]>>;
    captureQuote?(input: {
        quote: string;
        author?: string;
        sourceDocId?: string;
        sourceBlockId?: string;
        sourceTitle?: string;
        tags?: string[];
        category?: string;
        alias?: string;
        shortcode?: string;
    }): Promise<ActionResult<{ id?: string }>>;
}

// --- ⑨ 思源雷切命令画板 / 思源外骨骼 ---
export interface SpeedSwitchCommandBridgeApi {
    readonly protocol: number;
    readonly capabilities?: readonly string[];
    whenReady?(): Promise<boolean>;
    hasCapability?(name: string): boolean;
    ping?(): Promise<ActionResult<{ name: string; version: string }>>;
    listCommands?(plugin?: string): Promise<ActionResult<unknown[]>>;
    runCommand?(plugin: string, command: string): Promise<ActionResult<unknown>>;
    openCommandPalette?(focusSearch?: boolean): void;
    getEditorContext?(): ActionResult<{ blockId: string; docId: string; selectedText: string }>;
}
/** @deprecated 已退役，兼容旧类型别名 */
export type QuickGateBridgeApi = SpeedSwitchCommandBridgeApi;

// --- ⑩ Task Horizon 任务视界 (siyuan-plugin-task-horizon) ---
export interface TaskHorizonItem {
    id: string;
    blockId: string;
    title: string;
    docId: string;
    status: string;
    done: boolean;
    priority: "high" | "medium" | "low" | "none" | string;
    startDate?: string;
    completionTime?: string;
    tags: string[];
}

export interface TaskHorizonQueryOptions {
    date?: "today" | string;
    scope?: "current" | "all";
    limit?: number;
    includeCompleted?: boolean;
}

export interface TaskHorizonQueryResult {
    tasks: TaskHorizonItem[];
    total: number;
    partial: boolean;
    truncated: boolean;
}

export interface TaskHorizonStatusOption {
    id: string;
    name: string;
    marker: string;
}

export interface TaskHorizonCompletedEventDetail {
    id: string;
    title: string;
    blockId: string;
    docId: string;
    completedAt: number;
    tags: string[];
    operationId?: string;
    occurrenceId?: string;
    source?: string;
}

export interface TaskHorizonBridgeApi {
    readonly protocol: "task-horizon";
    readonly apiVersion: number;
    readonly version: string;
    readonly capabilities?: readonly string[];
    isReady(): boolean;
    whenReady(): Promise<boolean>;
    hasCapability?(name: string): boolean;
    getTodayTasks(): Promise<TaskHorizonItem[]>;
    queryTasks(options?: TaskHorizonQueryOptions): Promise<TaskHorizonQueryResult>;
    getStatusOptions(): TaskHorizonStatusOption[];
    setTaskStatus(blockId: string, statusId: string): Promise<boolean>;
    openView(viewType: "list" | "checklist" | "timeline" | "kanban" | "calendar" | "whiteboard"): Promise<void> | void;
}

/* ========================================================================= */
/* 4. 统一别名检索表 (Ecosystem Bridge Aliases Registry)                      */
/* ========================================================================= */

export const BRIDGE_ALIASES = Object.freeze({
    checkin: ["siyuanCheckin", "LvCheckin", "lvCheckin", "xiaolvCheckin"],
    contacts: ["LvContacts", "lvContacts", "xiaolvContacts", "siyuanContacts"],
    home: ["LvHome", "lvHome", "xiaolvHome", "siyuanHome"],
    raikiri: ["siyuanSpeedSwitch", "xiaolvSpeedSwitch", "xiaolvRaikiri", "lvRaikiri"],
    glean: ["siyuanGlean", "xiaolvGlean", "lvGlean", "LvGlean"],
    exam: ["LvExam", "siyuanExam", "xiaolvExam", "lvExam"],
    cards: ["xiaolvCards", "lvCards", "LvCards", "siyuanCards"],
    common: ["xiaolvCommon", "LvCommon", "lvCommon", "siyuanCommon"],
    quickgate: ["siyuanSpeedSwitch", "xiaolvSpeedSwitch", "xiaolvRaikiri", "lvRaikiri"],
    taskHorizon: ["TaskHorizon", "taskHorizon", "siyuanTaskHorizon"],
    sireader: ["sireader", "SiReader", "siyuanSireader"],
    simedia: ["siyuanMediaPlayer", "siplayer", "SiMedia"],
} as const);

/* ========================================================================= */
/* 5. 核心工具函数：安全探测、调用与优雅降级                                 */
/* ========================================================================= */

/**
 * 安全获取宿主窗口上的公开桥（自动遍历多别名）
 */
export function getBridgeSafely<T = unknown>(target: keyof typeof BRIDGE_ALIASES): T | undefined {
    if (typeof window === "undefined") return undefined;
    const aliases = BRIDGE_ALIASES[target] || [];
    const w = window as unknown as Record<string, unknown>;
    for (const alias of aliases) {
        if (w[alias] && typeof w[alias] === "object") {
            return w[alias] as T;
        }
    }
    return undefined;
}

/**
 * 跨插件安全执行器（核心范式：自动就绪等待、能力协商、超时熔断、全异常隔离、优雅降级）
 */
export interface BridgeCallOutcome<T> {
    state: "applied" | "unavailable" | "not_ready" | "unsupported" | "rejected" | "unknown";
    data?: T;
    operationId?: string;
    message?: string;
}

/** A write timeout ends the wait, not the operation. Consumers must reconcile unknown results. */
export async function callBridgeOutcome<TBridge, TResult>(
    target: keyof typeof BRIDGE_ALIASES,
    requiredCapability: string,
    caller: (bridge: TBridge) => Promise<TResult> | TResult,
    options: { timeoutMs?: number; operationId?: string } = {},
): Promise<BridgeCallOutcome<TResult>> {
    const timeoutMs = options.timeoutMs ?? 2500;
    const outcome = (state: BridgeCallOutcome<TResult>["state"], message?: string): BridgeCallOutcome<TResult> => ({ state, operationId: options.operationId, message });
    const timeoutSentinel = {};
    const bounded = async <T>(task: () => Promise<T> | T): Promise<T> => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
            return await Promise.race([
                Promise.resolve().then(task),
                new Promise<never>((_, reject) => { timer = setTimeout(() => reject(timeoutSentinel), timeoutMs); }),
            ]);
        } finally { if (timer !== undefined) clearTimeout(timer); }
    };
    let bridge: TBridge | undefined;
    try {
        bridge = getBridgeSafely<TBridge>(target);
        if (!bridge) return outcome("unavailable");
        const probe = bridge as Record<string, unknown>;
        if (typeof probe.whenReady === "function") {
            try {
                const ready = await bounded(() => (probe.whenReady as () => unknown)());
                if (ready === false) return outcome("not_ready");
            } catch { return outcome("not_ready"); }
        }
        if (typeof probe.hasCapability === "function" && !(probe.hasCapability as (name: string) => boolean)(requiredCapability)) {
            return outcome("unsupported");
        }
    } catch { return outcome("unavailable", "bridge-probe-failed"); }
    try {
        return { state: "applied", data: await bounded(() => caller(bridge!)), operationId: options.operationId };
    } catch (error) {
        // A thrown transport error may arrive after the side effect committed.
        return outcome("unknown", error === timeoutSentinel ? "operation-timeout" : "operation-result-unconfirmed");
    }
}

/** Legacy read/boolean adapter. Write callers needing reconciliation use callBridgeOutcome. */
export async function callBridge<TBridge, TResult>(
    target: keyof typeof BRIDGE_ALIASES,
    requiredCapability: string,
    caller: (bridge: TBridge) => Promise<TResult> | TResult,
    fallback: () => TResult,
    timeoutMs = 2500
): Promise<TResult> {
    const result = await callBridgeOutcome(target, requiredCapability, caller, { timeoutMs });
    return result.state === "applied" ? result.data as TResult : fallback();
}

/* ========================================================================= */
/* 6. 高频业务辅助工具 (Business Action Helpers)                              */
/* ========================================================================= */

/**
 * 自动向小驴打卡记录行为事实（考试、闪卡、拾遗、人脉等专用）
 * 自动处理打卡插件存在性探测与回执对账，未安装时安静返回 false，绝不报错
 */
export async function logCheckinEventSafely(options: {
    itemId: string;
    value?: number;
    unit?: string;
    externalRef: string;
    note?: string;
    occurredAt?: string;
}): Promise<boolean> {
    return await callBridge<CheckinBridgeApi, boolean>(
        "checkin",
        "events.record.batch",
        async (bridge) => {
            const results = await bridge.recordEventsBatch([{
                itemId: options.itemId,
                value: options.value ?? 1,
                unit: options.unit,
                source: "api",
                externalRef: options.externalRef,
                note: options.note,
                occurredAt: options.occurredAt ?? new Date().toISOString(),
            }]);
            const r = results[0];
            return r?.kind === "recorded" || r?.kind === "duplicate";
        },
        () => false
    );
}

/**
 * 向小驴闪卡（siyuan-lv-cards）安全推送制卡（IDEA-15 联动）
 */
export async function createCardSafely(options: {
    requestId?: string;
    sourceBlockId?: string;
    front: string;
    back: string;
    tags?: string[];
    deckName?: string;
    sourceDocId?: string;
}): Promise<{ ok: boolean; state: BridgeCallOutcome<unknown>["state"]; createdBlockID?: string; createdDocID?: string; message?: string }> {
    const outcome = await callBridgeOutcome<CardsBridgeApi, ActionResult<boolean | { kind?: string; enrolled?: boolean; createdBlockID?: string; blockID?: string; ok?: boolean }>>(
        "cards",
        "createCard",
        async (bridge) => {
            if (typeof bridge.createCard === "function") {
                return await bridge.createCard({
                    requestId: options.requestId,
                    sourceBlockId: options.sourceBlockId,
                    deckName: options.deckName ?? "人脉常识",
                    front: options.front,
                    back: options.back,
                    tags: options.tags ?? ["人脉常识"],
                    sourceDocId: options.sourceDocId,
                });
            }
            return { ok: false, message: "createCard-not-supported" };
        },
        { operationId: options.requestId },
    );
    if (outcome.state !== "applied") return { ok: false, state: outcome.state, message: outcome.message };
    const res = outcome.data;
    const failedData = res?.data && typeof res.data === "object" ? res.data : undefined;
    const details = res?.details && typeof res.details === "object" ? res.details as { createdBlockID?: string; docID?: string } : undefined;
    const partialId = failedData?.createdBlockID || failedData?.blockID || details?.createdBlockID;
    if (res?.ok !== true || res.data === false) return { ok: false, state: partialId || details?.docID || res?.code === "write-unknown" ? "unknown" : "rejected", createdBlockID: partialId, createdDocID: details?.docID, message: res?.message };
    const data = typeof res.data === "object" ? res.data : undefined;
    const createdBlockID = data?.createdBlockID || data?.blockID;
    if (!createdBlockID) return { ok: false, state: "unknown", message: "missing-created-card-id" };
    const confirmed = data?.enrolled === true && data.ok !== false && data.kind !== "extract";
    return { ok: confirmed, state: confirmed ? "applied" : "unknown", createdBlockID, message: res.message };
}

/** Boolean compatibility adapter for older UI consumers. */
export async function pushFlashcardSafely(options: Parameters<typeof createCardSafely>[0]): Promise<boolean> {
    return (await createCardSafely(options)).ok;
}

/**
 * 将大额合同、保单条款或长篇说明书安全推入小驴拾遗渐进阅读流
 */
export async function pushToGleanReadingSafely(options: {
    docId?: string;
    blockId?: string;
    title: string;
    module: string;
    summary?: string;
}): Promise<{ mode: "bridge" | "clipboard"; text: string; state?: BridgeCallOutcome<unknown>["state"]; docId?: string }> {
    const fallbackText = `📖 【渐进阅读切片 · ${options.title}】\n* 来源：小驴管家 · ${options.module}\n${options.docId ? `* 关联文档：((${options.docId} '${options.title}'))\n` : ""}${options.summary ? `* 要点摘要：${options.summary}\n` : ""}* 渐进建议：每日消化 1~2 个条款切片，厘清权益与免责条款。`;

    if (typeof window === "undefined") {
        return { mode: "clipboard", text: fallbackText };
    }

    const result = await callBridgeOutcome<any, { ok: boolean; docId?: string }>("glean", "ingestClip", async (glean) => {
            if (typeof glean.ingestClip !== "function") return { ok: false };
            return await glean.ingestClip({
                title: options.title,
                docId: options.docId,
                blockId: options.blockId,
                tags: ["管家资产", options.module],
                summary: options.summary,
            });
    });
    if (result.state === "applied" && result.data?.ok === true && result.data.docId) {
        return { mode: "bridge", text: fallbackText, state: "applied", docId: result.data.docId };
    }
    const partial = result.data?.docId;
    return { mode: "clipboard", text: fallbackText, docId: partial, state: result.state === "applied" ? (partial ? "unknown" : "rejected") : result.state };
}

/**
 * 向小驴雷切工作台安全注册小组件
 */
export function registerRaikiriModuleSafely(options: RaikiriHomeModuleOptions): () => void {
    if (typeof window === "undefined") return () => {};
    const raikiri = getBridgeSafely<RaikiriBridgeApi>("raikiri");
    if (!raikiri || typeof raikiri.registerHomeModule !== "function") return () => {};
    try {
        const handle = raikiri.registerHomeModule(options);
        if (typeof handle === "function") return handle;
        if (handle && typeof handle.unregister === "function") return () => handle.unregister!();
    } catch (e) {
        console.warn("[小驴生态联邦] 注册雷切小组件失败:", e);
    }
    return () => {};
}

/**
 * 订阅生态广播事件（返回自动退订函数，卸载时调用）
 */
export function subscribeEcosystemEvent<T = Record<string, unknown>>(
    eventName: string,
    handler: (detail: EcosystemEventEnvelope<T>) => void
): () => void {
    if (typeof window === "undefined" || typeof window.addEventListener !== "function") {
        return () => {};
    }
    const listener = (evt: Event) => {
        try {
            const custom = evt as CustomEvent<EcosystemEventEnvelope<T>>;
            if (custom.detail) handler(custom.detail);
        } catch (e) {
            console.error(`[小驴生态联邦] 处理事件 ${eventName} 异常:`, e);
        }
    };
    window.addEventListener(eventName, listener);
    return () => {
        window.removeEventListener(eventName, listener);
    };
}

/**
 * 监听 Task Horizon 任务完成事件 (tm:task-completed 及兼容事件名 task-horizon:task-completed)
 * 返回注销清理函数
 */
export function onTaskHorizonCompleted(
    listener: (detail: TaskHorizonCompletedEventDetail) => void
): () => void {
    if (typeof window === "undefined" || typeof window.addEventListener !== "function") {
        return () => {};
    }
    const recentKeys = new Set<string>();
    const handler = (evt: Event) => {
        try {
            const custom = evt as CustomEvent<TaskHorizonCompletedEventDetail & {taskId?: string}>;
            const raw = custom.detail;
            if (!raw) return;
            const blockId = String(raw.blockId || raw.id || raw.taskId || "");
            const dedupeKey = String(raw.operationId || `${blockId}:${raw.completedAt || ""}`);
            if (dedupeKey && recentKeys.has(dedupeKey)) return;
            if (dedupeKey) {
                recentKeys.add(dedupeKey);
                if (recentKeys.size > 256) {
                    const oldest = recentKeys.values().next().value;
                    if (oldest) recentKeys.delete(oldest);
                }
            }
            listener({...raw, id: String(raw.id || blockId), blockId});
        } catch (e) {
            console.error("[小驴生态联邦] 处理 Task Horizon 完成事件异常:", e);
        }
    };
    window.addEventListener("tm:task-completed", handler);
    window.addEventListener("task-horizon:task-completed", handler);
    return () => {
        window.removeEventListener("tm:task-completed", handler);
        window.removeEventListener("task-horizon:task-completed", handler);
    };
}

/**
 * T-2022：探测宿主窗口是否已加载 Task Horizon 公共接口
 */
export function isTaskHorizonAvailable(): boolean {
    const bridge = getBridgeSafely<TaskHorizonBridgeApi>("taskHorizon");
    return Boolean(bridge && bridge.protocol === "task-horizon");
}

/**
 * T-2022：安全拉取 Task Horizon 今日待办列表（有界超时，未安装或未就绪时优雅返回空数组）
 */
export async function fetchTaskHorizonTodayTasks(limit = 8): Promise<TaskHorizonItem[]> {
    const capped = Math.max(1, Math.min(20, Math.round(limit) || 8));
    return await callBridge<TaskHorizonBridgeApi, TaskHorizonItem[]>(
        "taskHorizon",
        "tasks.query",
        async (bridge) => {
            if (typeof bridge.queryTasks === "function") {
                const res = await bridge.queryTasks({date: "today", scope: "all", limit: capped, includeCompleted: false});
                return Array.isArray(res?.tasks) ? res.tasks : [];
            }
            if (typeof bridge.getTodayTasks === "function") {
                const tasks = await bridge.getTodayTasks();
                return Array.isArray(tasks) ? tasks.slice(0, capped) : [];
            }
            return [];
        },
        () => [],
        2000,
    );
}

/**
 * T-2022：通过 Task Horizon 公共接口安全切换任务完成状态
 */
export async function setTaskHorizonTaskDoneSafely(blockId: string, done: boolean): Promise<boolean> {
    if (!blockId) return false;
    return await callBridge<TaskHorizonBridgeApi, boolean>(
        "taskHorizon",
        "tasks.status.write",
        async (bridge) => {
            if (typeof bridge.setTaskStatus !== "function") return false;
            const options = typeof bridge.getStatusOptions === "function" ? bridge.getStatusOptions() : [];
            let targetStatus = done ? "done" : "todo";
            if (Array.isArray(options) && options.length) {
                const matched = done
                    ? options.find((opt) => opt.id === "done" || opt.marker.toUpperCase() === "X")
                    : options.find((opt) => opt.id === "todo" || opt.marker === " ");
                if (matched?.id) targetStatus = matched.id;
            }
            return (await bridge.setTaskStatus(blockId, targetStatus)) === true;
        },
        () => false,
        2500,
    );
}

/**
 * T-2022：一键唤起 Task Horizon 指定视图（calendar / kanban / timeline / list 等）
 */
export async function openTaskHorizonViewSafely(
    viewType: "list" | "checklist" | "timeline" | "kanban" | "calendar" | "whiteboard" = "calendar",
): Promise<boolean> {
    return await callBridge<TaskHorizonBridgeApi, boolean>(
        "taskHorizon",
        "views.open",
        async (bridge) => {
            if (typeof bridge.openView !== "function") return false;
            await bridge.openView(viewType);
            return true;
        },
        () => false,
        3000,
    );
}

/**
 * 安全查询小驴打卡事项簿列表（支持按分类筛选，如 birthday/anniversary/expense/subscription 等）
 */
export async function queryCheckinOccasionsSafely(options?: { category?: string; includeDisabled?: boolean }): Promise<CheckinOccasionItem[]> {
    return await callBridge<CheckinBridgeApi, CheckinOccasionItem[]>(
        "checkin",
        "occasions.read",
        (bridge) => {
            if (typeof bridge.queryOccasions !== "function") return [];
            return bridge.queryOccasions(options) || [];
        },
        () => []
    );
}

/**
 * 安全完成小驴打卡指定事项
 */
export async function completeCheckinOccasionSafely(id: string, occurrenceDate: string, completed = true): Promise<boolean> {
    return await callBridge<CheckinBridgeApi, boolean>(
        "checkin",
        "occasions.complete",
        async (bridge) => {
            if (typeof bridge.completeOccasion !== "function") return false;
            return await bridge.completeOccasion(id, occurrenceDate, completed);
        },
        () => false
    );
}

/* ========================================================================= */
/* 7. 专项生态联邦安全互通工具 (Specialized Interop Helpers)                  */
/* ========================================================================= */

/**
 * 安全推送渐进摘录至小驴闪卡（siyuan-lv-cards）
 * 自动建立双向反链血缘并纳入轻量级渐进学习轮转箱，绝不破坏 FSRS 主队列
 */
export async function sendExtractToCardsSafely(envelope: {
    requestId?: string;
    content: string;
    sourceBlockId: string;
    sourceDocId?: string;
    sourceTitle?: string;
    tags?: string[];
}): Promise<{ ok: boolean; message?: string; state?: BridgeCallOutcome<unknown>["state"]; createdBlockID?: string; createdDocID?: string }> {
    const outcome = await callBridgeOutcome<CardsBridgeApi, ActionResult<{ kind?: string; createdBlockID?: string; blockID?: string; enrolled?: boolean; ok?: boolean }>>(
        "cards",
        "receiveExtract",
        async (bridge) => {
            if (typeof bridge.receiveExtract !== "function") return { ok: false, message: "not-supported" };
            return await bridge.receiveExtract(envelope);
        },
        { operationId: envelope.requestId },
    );
    if (outcome.state !== "applied") return { ok: false, state: outcome.state, message: outcome.message || "cards-not-available" };
    const res = outcome.data;
    const data = res?.data;
    const details = res?.details && typeof res.details === "object" ? res.details as { createdBlockID?: string; docID?: string } : undefined;
    const createdBlockID = data?.createdBlockID || data?.blockID || details?.createdBlockID;
    const confirmed = res?.ok === true && Boolean(createdBlockID) && data?.ok !== false && (data?.kind === "extract" || data?.enrolled === true);
    return { ok: confirmed, state: confirmed ? "applied" : (createdBlockID || details?.docID || res?.code === "write-unknown" ? "unknown" : "rejected"), createdBlockID, createdDocID: details?.docID, message: res?.message };
}

/**
 * 安全读取小驴闪卡今日待复习量与已复习量（只读）
 */
export async function getCardsDueSummarySafely(): Promise<{ ok: boolean; unreviewedCount: number; todayReviewedCount?: number }> {
    return await callBridge<CardsBridgeApi, { ok: boolean; unreviewedCount: number; todayReviewedCount?: number }>(
        "cards",
        "due",
        async (bridge) => {
            if (typeof bridge.getDueSummary !== "function") return { ok: false, unreviewedCount: 0 };
            const res = await bridge.getDueSummary();
            if (res?.ok && res.data) {
                return {
                    ok: true,
                    unreviewedCount: Number.isFinite(res.data.unreviewedCount) && res.data.unreviewedCount >= 0
                        ? res.data.unreviewedCount
                        : Math.max(0, Number(res.data.unreviewedNewCardCount) || 0) + Math.max(0, Number(res.data.unreviewedOldCardCount) || 0),
                    todayReviewedCount: res.data.todayReviewedCount ?? 0,
                };
            }
            return { ok: false, unreviewedCount: 0 };
        },
        () => ({ ok: false, unreviewedCount: 0 })
    );
}

/**
 * 安全唤起小驴闪卡复习界面
 */
export async function openCardsReviewSafely(): Promise<boolean> {
    return await callBridge<CardsBridgeApi, boolean>(
        "cards",
        "openReview",
        async (bridge) => {
            if (typeof bridge.openReview === "function") {
                const res = await bridge.openReview();
                return Boolean(res?.ok);
            }
            if (typeof bridge.openHub === "function") {
                const res = await bridge.openHub();
                return Boolean(res?.ok);
            }
            return false;
        },
        () => false
    );
}

/**
 * 安全检索联系人（小驴人脉 siyuan-contacts）
 */
export async function searchPersonSafely(keyword: string): Promise<ContactsPerson | null> {
    const kw = (keyword || "").trim();
    if (!kw) return null;
    return await callBridge<ContactsBridgeApi, ContactsPerson | null>(
        "contacts",
        "searchPeople",
        async (bridge) => {
            const list = await bridge.searchPeople(kw);
            if (!Array.isArray(list) || list.length === 0) return null;
            const exact = list.find((p) => p.name === kw);
            return exact || list[0] || null;
        },
        () => null
    );
}

/**
 * 一键安全沉淀联系人至小驴人脉（创建或查找）
 */
export async function ensurePersonSafely(name: string, options?: { docId?: string }): Promise<{ ok: boolean; person?: ContactsPerson; created?: boolean }> {
    const cleanName = (name || "").trim();
    if (!cleanName) return { ok: false };
    return await callBridge<ContactsBridgeApi, { ok: boolean; person?: ContactsPerson; created?: boolean }>(
        "contacts",
        "ensurePerson",
        async (bridge) => {
            const person = await bridge.ensurePerson(cleanName, options);
            return { ok: Boolean(person?.docId), person, created: Boolean(person?.created) };
        },
        () => ({ ok: false })
    );
}

/**
 * 安全向小驴人脉联系人主档案追加事实项（appendFact）
 */
export async function appendPersonFactSafely(
    personDocId: string,
    fact: { text: string; category?: string; sourceRef?: string }
): Promise<boolean> {
    if (!personDocId || !fact.text) return false;
    return await callBridge<ContactsBridgeApi, boolean>(
        "contacts",
        "appendFact",
        async (bridge) => {
            if (typeof bridge.appendFact !== "function") return false;
            await bridge.appendFact(personDocId, fact);
            return true;
        },
        () => false
    );
}

/**
 * 一键安全存入金句/常用片段至小驴常用（xiaolv-common）
 */
export async function captureQuoteToCommonSafely(input: {
    quote: string;
    author?: string;
    sourceDocId?: string;
    sourceBlockId?: string;
    sourceTitle?: string;
    tags?: string[];
    alias?: string;
    shortcode?: string;
}): Promise<{ ok: boolean; itemId?: string }> {
    if (!input.quote) return { ok: false };
    return await callBridge<CommonBridgeApi, { ok: boolean; itemId?: string }>(
        "common",
        "captureQuote",
        async (bridge) => {
            if (typeof bridge.captureQuote !== "function") return { ok: false };
            const res = await bridge.captureQuote({
                ...input,
                category: "拾遗金句",
            });
            return { ok: Boolean(res?.ok), itemId: res?.data?.id };
        },
        () => ({ ok: false })
    );
}

/**
 * 安全读取打卡项目的连续打卡天数（小驴打卡 siyuan-checkin）
 */
export async function getCheckinStreaksSafely(itemId?: string): Promise<{ current: number; longest: number } | null> {
    return await callBridge<CheckinBridgeApi, { current: number; longest: number } | null>(
        "checkin",
        "streaks.read",
        async (bridge) => {
            if (typeof bridge.getStreaks !== "function") return null;
            const list = bridge.getStreaks(itemId ? [itemId] : undefined);
            if (!Array.isArray(list) || list.length === 0) return null;
            const target = itemId ? list.find((s) => (s as any).itemId === itemId) : list[0];
            if (!target) return null;
            return { current: target.current ?? 0, longest: target.longest ?? 0 };
        },
        () => null
    );
}

/**
 * 自动探测小驴打卡中与闪卡复习最匹配的打卡项 ID（零配置智能联动）
 */
export async function findMatchingCheckinItemId(configuredId?: string): Promise<string | null> {
    if (configuredId && configuredId.trim()) {
        return configuredId.trim();
    }
    if (typeof window === "undefined") return null;
    const checkin = getBridgeSafely<CheckinBridgeApi>("checkin");
    if (!checkin || typeof checkin.queryItems !== "function") return null;
    try {
        const items = checkin.queryItems({ includeArchived: false });
        if (!Array.isArray(items) || items.length === 0) return null;
        // 1. 优先匹配名称包含「闪卡」的项目
        const flashcardItem = items.find(it => !it.archived && (it.name.includes("闪卡") || it.name.toLowerCase().includes("flashcard")));
        if (flashcardItem) return flashcardItem.id;
        // 2. 次优匹配名称包含「复习」或「记忆」
        const reviewItem = items.find(it => !it.archived && (it.name.includes("复习") || it.name.includes("记忆")));
        if (reviewItem) return reviewItem.id;
    } catch {
        // 静默隔离
    }
    return null;
}

/**
 * 安全查询小驴考试概览与考期目标（若安装且挂载）
 */
export async function getExamOverviewSafely(): Promise<{ name: string; days: number; activeWrongCount?: number } | null> {
    if (typeof window === "undefined") return null;
    const exam = getBridgeSafely<ExamBridgeApi>("exam");
    if (!exam) return null;
    try {
        if (typeof exam.getOverview === "function") {
            const overview: any = exam.getOverview();
            if (overview && typeof overview === "object") {
                const stats: any = overview.stats;
                const activeWrong = stats?.activeWrong ?? stats?.activeWrongCount ?? overview.activeWrongCount;
                const examDateStr = overview.examDate || overview.targetDate || stats?.examDate;
                if (examDateStr && typeof examDateStr === "string") {
                    const target = new Date(examDateStr.includes("T") ? examDateStr : examDateStr.replace(/-/g, "/"));
                    if (!Number.isNaN(target.getTime())) {
                        const now = new Date();
                        const diffMs = target.getTime() - now.getTime();
                        const days = Math.max(0, Math.ceil(diffMs / 86400000));
                        return {
                            name: overview.examTitle || overview.title || "小驴考试目标",
                            days,
                            activeWrongCount: activeWrong,
                        };
                    }
                }
                if (typeof activeWrong === "number") {
                    return {
                        name: overview.examTitle || overview.title || "小驴考试",
                        days: 0,
                        activeWrongCount: activeWrong,
                    };
                }
            }
        }
    } catch {
        // 静默隔离
    }
    return null;
}

/**
 * 安全打开小驴考试模块（练习台、错题本、模考等）
 */
export function openExamModuleSafely(action: "practice" | "wrongbook" | "mock" = "practice"): boolean {
    if (typeof window === "undefined") return false;
    const exam = getBridgeSafely<ExamBridgeApi>("exam");
    if (!exam) return false;
    try {
        if (action === "wrongbook" && typeof exam.wrongbook === "function") {
            exam.wrongbook();
            return true;
        }
        if (action === "mock" && typeof exam.mock === "function") {
            exam.mock();
            return true;
        }
        if (typeof exam.practice === "function") {
            exam.practice();
            return true;
        }
    } catch {
        // 静默隔离
    }
    return false;
}

/**
 * 安全获取小驴常用语中的收藏或最近条目（供制卡素材快速填入）
 */
export async function getCommonSnippetsSafely(): Promise<CommonSnippet[]> {
    if (typeof window === "undefined") return [];
    const common = getBridgeSafely<CommonBridgeApi>("common");
    if (!common) return [];
    try {
        if (typeof common.favorites === "function") {
            const favRes = await common.favorites();
            if (favRes && favRes.ok && Array.isArray(favRes.data) && favRes.data.length > 0) {
                return favRes.data;
            }
        }
        if (typeof common.recent === "function") {
            const recRes = await common.recent();
            if (recRes && recRes.ok && Array.isArray(recRes.data) && recRes.data.length > 0) {
                return recRes.data;
            }
        }
    } catch {
        // 静默隔离
    }
    return [];
}

