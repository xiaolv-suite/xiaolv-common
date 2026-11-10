// 侧车存储模型：库配置 + UI 状态（收藏/最近/排序/偏好/provider 注册）。
// 版本化 + 归一化 + 容量上限 + 损坏降级。侧车永远不是内容真源，可随时从库文档重建索引。
import {LIMITS, STATE_SCHEMA_VERSION} from "../constants";
import {isBlockId, isItemType, ItemType} from "./item";
import {normalizeVariableMemory, VariableMemory} from "./variable-memory";

// ---- 库配置 ----

export type LibraryMode = "doc" | "tree" | "notebook";

export interface LibraryConfig {
    /** 配置结构版本（R16 起：未来版本拒绝降级读取，防静默破坏） */
    configVersion: number;
    mode: LibraryMode;
    /** doc/tree：容器根文档；notebook：笔记本 ID */
    notebookIds: string[];
    containerDocIds: string[];
    /** 由插件创建的库文档（首次引导回执用） */
    createdDocIds: string[];
    /** 由插件创建的独立笔记本（Issue #1；旧配置缺省为空） */
    createdNotebookIds?: string[];
    configuredAt: number;
}

export const CONFIG_VERSION = 1;

const NOTEBOOK_ID_RE = /^\d{8,14}$/;

export function normalizeLibraryConfig(raw: unknown): LibraryConfig | null {
    if (!raw || typeof raw !== "object") return null;
    const obj = raw as Record<string, unknown>;
    // 未来配置版本：拒绝降级读取（返回 null → UI 提示重新设置），绝不静默改写
    const configVersion = typeof obj.configVersion === "number" ? Math.floor(obj.configVersion) : CONFIG_VERSION;
    if (configVersion > CONFIG_VERSION) return null;
    const mode = obj.mode === "doc" || obj.mode === "tree" || obj.mode === "notebook" ? obj.mode : null;
    if (!mode) return null;
    const ids = (v: unknown, predicate: (x: unknown) => boolean, cap: number): string[] => {
        if (!Array.isArray(v)) return [];
        return v.filter(predicate).slice(0, cap);
    };
    const containerDocIds = ids(obj.containerDocIds, isBlockId, 64);
    const notebookIds = ids(obj.notebookIds, (x) => typeof x === "string" && NOTEBOOK_ID_RE.test(x), 16);
    const createdDocIds = ids(obj.createdDocIds, isBlockId, 64);
    const createdNotebookIds = ids(obj.createdNotebookIds, (x) => typeof x === "string" && NOTEBOOK_ID_RE.test(x), 16);
    if (mode !== "notebook" && containerDocIds.length === 0) return null;
    if (mode === "notebook" && notebookIds.length === 0) return null;
    const configuredAt = Number(obj.configuredAt);
    return {
        configVersion: CONFIG_VERSION,
        mode,
        notebookIds,
        containerDocIds,
        createdDocIds,
        createdNotebookIds,
        configuredAt: Number.isFinite(configuredAt) && configuredAt > 0 ? configuredAt : 0,
    };
}

// ---- 收藏 / 最近 ----

export interface RecentEntry {
    id: string;
    usedAt: number;
}

// ---- provider 注册（xiaolv-common/v1 联动）----

export interface ProviderRecord {
    pluginId: string;
    displayName: string;
    /** 协议版本，整数。协商见 model/protocol.ts */
    protocolVersion: number;
    registeredAt: number;
}

// ---- 顶层状态 ----

export interface AiPrefs {
    /** AI 总开关（默认关；使用宿主思源「设置→人工智能」的模型） */
    enabled: boolean;
    /** 允许发送完整正文给 AI（元数据级功能不需要） */
    shareContent: boolean;
    /** 自定义 AI 变换（F7）：与内置五种并列出现在动作菜单 ✦ 区 */
    customTransforms: CustomTransform[];
}

export interface CustomTransform {
    /** 稳定 ID（xltf- 前缀） */
    id: string;
    /** 菜单显示名 */
    name: string;
    /** 变换指令（发给 AI 的提示正文） */
    prompt: string;
}

const CUSTOM_TRANSFORM_ID_RE = /^xltf-[0-9a-z]{4,24}$/;

function normalizeCustomTransforms(raw: unknown): CustomTransform[] {
    const out: CustomTransform[] = [];
    if (!Array.isArray(raw)) return out;
    const seen = new Set<string>();
    for (const entry of raw) {
        if (!entry || typeof entry !== "object") continue;
        const id = (entry as CustomTransform).id;
        const name = typeof (entry as CustomTransform).name === "string" ? ((entry as CustomTransform).name as string).trim().slice(0, LIMITS.customNameChars) : "";
        const prompt = typeof (entry as CustomTransform).prompt === "string" ? ((entry as CustomTransform).prompt as string).trim().slice(0, LIMITS.customPromptChars) : "";
        if (typeof id !== "string" || !CUSTOM_TRANSFORM_ID_RE.test(id) || seen.has(id)) continue;
        if (!name || !prompt) continue;
        seen.add(id);
        out.push({id, name, prompt});
        if (out.length >= LIMITS.maxCustomTransforms) break;
    }
    return out;
}

export interface MiniPosition {
    x: number;
    y: number;
}

export interface SearchPrefs {
    /** 拼音搜索（全拼/首字母注解；默认开，可在设置关闭） */
    pinyin: boolean;
    /** 动态占位符（插入/复制时替换 {{xlc:date}} 等；默认开，存储内容始终保留模板原文） */
    placeholders: boolean;
    /** 上次搜索词（跨会话保留，200 字符截断；空串=无） */
    lastQuery: string;
    /** 最近搜索词历史（上限 10 条，LRU 去重保序，ADR 0043 / T-0070） */
    recentQueries?: string[];
    /** Saved tag-scoped discovery shortcuts. Sidecar UI state only; source blocks remain canonical. */
    savedDiscoveryViews?: SavedDiscoveryView[];
    /** 搜索结果行显示密度（CAND-012 / TODO-FEAT-011）："comfortable" (默认卡片双行) | "compact" (单行极速) */
    density?: "comfortable" | "compact";
    /** 极窄悬浮迷你模式（CAND-018 / TODO-FEAT-017）：单列紧凑浮条无遮挡 */
    miniMode?: boolean;
    /** 迷你悬浮条拖拽停留位置坐标（CAND-022 / TODO-FEAT-020） */
    miniPosition?: MiniPosition;
    /** 迷你条折叠贴边微型胶囊状态（CAND-023 / TODO-FEAT-021） */
    miniCollapsed?: boolean;
}

export type SavedDiscoveryScope = "document" | "notebook" | "tree" | "selected-notebook" | "all-notebooks";

export interface SavedDiscoveryView {
    id: string;
    name: string;
    tag: string;
    scope: SavedDiscoveryScope;
    targetDocId: string;
    targetNotebookId: string;
    pathLabel: string;
    defaultCategory: string;
}

const SAVED_VIEW_ID_RE = /^xlc-view-[0-9a-z]{6,32}$/;
const SAVED_DISCOVERY_SCOPES: readonly SavedDiscoveryScope[] = [
    "document", "notebook", "tree", "selected-notebook", "all-notebooks",
];

export function isSavedDiscoveryScope(value: unknown): value is SavedDiscoveryScope {
    return typeof value === "string" && (SAVED_DISCOVERY_SCOPES as readonly string[]).includes(value);
}

export function normalizeSavedDiscoveryViews(raw: unknown): SavedDiscoveryView[] {
    if (!Array.isArray(raw)) return [];
    const result: SavedDiscoveryView[] = [];
    const seen = new Set<string>();
    for (const value of raw) {
        if (!value || typeof value !== "object") continue;
        const item = value as Partial<SavedDiscoveryView>;
        const id = typeof item.id === "string" ? item.id : "";
        const name = typeof item.name === "string" ? item.name.trim().slice(0, LIMITS.savedViewNameChars) : "";
        const tag = typeof item.tag === "string" ? item.tag.trim().slice(0, LIMITS.tag) : "";
        const scope = item.scope;
        if (!SAVED_VIEW_ID_RE.test(id) || seen.has(id) || !name || !tag || !isSavedDiscoveryScope(scope)) continue;
        let targetDocId = typeof item.targetDocId === "string" && isBlockId(item.targetDocId) ? item.targetDocId : "";
        const targetNotebookId = typeof item.targetNotebookId === "string" && isBlockId(item.targetNotebookId) ? item.targetNotebookId : "";
        if ((scope === "document" || scope === "tree") && !targetDocId) continue;
        // Keep legacy anchor-only notebook shortcuts visible, but callers must never infer
        // their notebook from an anchor that may have moved. New rules use the frozen ID.
        if (scope === "notebook" && !targetNotebookId && !targetDocId) continue;
        if (scope === "selected-notebook" && !targetNotebookId) continue;
        if ((scope === "notebook" || scope === "selected-notebook") && targetNotebookId) targetDocId = "";
        const pathLabel = typeof item.pathLabel === "string" ? item.pathLabel.trim().slice(0, LIMITS.savedViewPathChars) : "";
        const defaultCategory = typeof item.defaultCategory === "string" ? item.defaultCategory.trim().slice(0, LIMITS.category) : "";
        seen.add(id);
        result.push({id, name, tag, scope, targetDocId, targetNotebookId, pathLabel, defaultCategory});
        if (result.length >= LIMITS.maxSavedDiscoveryViews) break;
    }
    return result;
}

/** 追加并更新最近搜索历史队列（LRU 去重保序，上限 10 条） */
export function pushRecentQuery(history: readonly string[], newQuery: string, limit = 10): string[] {
    const trimmed = (newQuery ?? "").trim().slice(0, LIMITS.queryChars);
    if (!trimmed) return [...history];
    return [trimmed, ...history.filter((q) => q !== trimmed)].slice(0, limit);
}

/** 从最近搜索历史队列中移除指定历史词（TODO-FEAT-009） */
export function removeRecentQuery(history: readonly string[], queryToRemove: string): string[] {
    const target = (queryToRemove ?? "").trim();
    if (!target) return [...history];
    return history.filter((q) => q !== target);
}

/** 使用计数（F3）：插入/复制成功 +1；「常用」排序=次数×最近使用时间。侧车存储，可重建可清空。 */
export interface UsageEntry {
    count: number;
    lastAt: number;
}

export interface UsageSummary {
    totalCount: number;
    trackedItems: number;
    latestAt: number | null;
}

/** 汇总本机使用计数；只返回聚合数字，不暴露条目正文或来源。 */
export function summarizeUsage(usage: Readonly<Record<string, UsageEntry>>): UsageSummary {
    let totalCount = 0;
    let trackedItems = 0;
    let latestAt: number | null = null;
    for (const entry of Object.values(usage)) {
        if (!Number.isInteger(entry.count) || entry.count <= 0 || !Number.isFinite(entry.lastAt) || entry.lastAt <= 0) continue;
        totalCount += entry.count;
        trackedItems++;
        latestAt = latestAt === null ? entry.lastAt : Math.max(latestAt, entry.lastAt);
    }
    return {totalCount, trackedItems, latestAt};
}

/** 插入偏好（F1/F3）：插入前询问变量 / 记录使用次数。默认都开。 */
export interface InsertPrefs {
    promptVariables: boolean;
    recordUsage: boolean;
}

export interface ClipboardHistoryEntry {
    text: string;
    copiedAt: number;
}

export type ItemSortMode = "manual" | "recent" | "frequent" | "frecency" | "title";

export interface PluginState {
    schemaVersion: number;
    favorites: string[];
    recents: RecentEntry[];
    usage: Record<string, UsageEntry>;
    sort: ItemSortMode;
    uiPrefs: {
        lastTypeFilter: "" | ItemType;
        lastTagFilter: string;
        lastCategoryFilter: string;
    };
    providers: ProviderRecord[];
    ai: AiPrefs;
    search: SearchPrefs;
    insert: InsertPrefs;
    /** 变量填写值记忆（ADR 0074 / G22 / T-0133）：只存侧车，绝不出域 */
    variableMemory: VariableMemory;
    /** 剪贴板历史开关（默认 true 开启，可在设置中随时关闭；关闭时不读取剪贴板，已有记录保留） */
    clipboardHistoryEnabled?: boolean;
    /** 剪贴板历史暂存容量上限（默认 30 条，支持 30/50/80/100 或自由输入，严格上限 100 条） */
    clipboardHistoryLimit?: number;
    /** 剪贴板历史暂存（流式暂存栈，上限根据设置动态修剪 10~100 条，只存侧车不建块） */
    clipboardHistory: ClipboardHistoryEntry[];
    /** 变量填参预设方案（按条目或模板标题归档的多套方案：itemId -> 方案名 -> 字段键值对） */
    variablePresets?: Record<string, Record<string, Record<string, string>>>;
    /** 近 30 天每日使用统计计数（TODO-FEAT-008）：YYYY-MM-DD -> 计数 */
    dailyUsage?: Record<string, number>;
    /** 条目自定义手动排序权重字典（CAND-014 / TODO-FEAT-013）：itemId -> 排序权重序号 */
    customItemOrder?: Record<string, number>;
    /** 全局常用名片池 / 身份档案（CAND-016 / TODO-FEAT-015）：变量名匹配时自动预填 */
    profilePresets?: Record<string, string>;
    /** 剪贴板智能匹配开关（默认 false 关闭，设置内 opt-in · Mobile Spec v2） */
    clipboardSmartMatchEnabled?: boolean;
    /** 手机端高频直达行固定条目 ID 列表 (Mobile Spec v2) */
    pinnedTopChips?: string[];
}

export function normalizeState(raw: unknown): PluginState {
    const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const favorites = Array.isArray(obj.favorites)
        ? Array.from(new Set(obj.favorites.filter((x): x is string => typeof x === "string" && x.startsWith("xlc-") && x.length <= 48)))
            .slice(0, LIMITS.maxFavorites)
        : [];
    const recentsRaw = Array.isArray(obj.recents) ? obj.recents : [];
    const seen = new Set<string>();
    const recents: RecentEntry[] = [];
    for (const entry of recentsRaw) {
        if (!entry || typeof entry !== "object") continue;
        const id = (entry as RecentEntry).id;
        const usedAt = Number((entry as RecentEntry).usedAt);
        if (typeof id !== "string" || !id.startsWith("xlc-") || id.length > 48 || seen.has(id)) continue;
        if (!Number.isFinite(usedAt) || usedAt <= 0) continue;
        seen.add(id);
        recents.push({id, usedAt});
        if (recents.length >= LIMITS.maxRecents) break;
    }
    const sort = obj.sort === "manual" || obj.sort === "recent" || obj.sort === "frequent" || obj.sort === "frecency" || obj.sort === "title" ? obj.sort : "manual";
    const prefsRaw = (obj.uiPrefs ?? {}) as Record<string, unknown>;
    const lastTypeFilter = (prefsRaw.lastTypeFilter === "" || isItemType(prefsRaw.lastTypeFilter))
        ? prefsRaw.lastTypeFilter as "" | ItemType
        : "";
    // 使用计数（F3）：形状不可信逐条丢弃；超限保留最近使用的 maxUsage 条
    const usageRaw = (obj.usage ?? {}) as Record<string, unknown>;
    const usageEntries: Array<{id: string; entry: UsageEntry}> = [];
    for (const [id, value] of Object.entries(usageRaw)) {
        if (!id.startsWith("xlc-") || id.length > 48 || !value || typeof value !== "object") continue;
        const count = Number((value as UsageEntry).count);
        const lastAt = Number((value as UsageEntry).lastAt);
        if (!Number.isInteger(count) || count <= 0 || count > 1_000_000) continue;
        if (!Number.isFinite(lastAt) || lastAt <= 0) continue;
        usageEntries.push({id, entry: {count, lastAt}});
    }
    usageEntries.sort((a, b) => b.entry.lastAt - a.entry.lastAt);
    const usage: Record<string, UsageEntry> = {};
    for (const {id, entry} of usageEntries.slice(0, LIMITS.maxUsage)) usage[id] = entry;
    const insertRaw = (obj.insert ?? {}) as Record<string, unknown>;
    const providersRaw = Array.isArray(obj.providers) ? obj.providers : [];
    const providers: ProviderRecord[] = [];
    const providerSeen = new Set<string>();
    for (const p of providersRaw) {
        if (!p || typeof p !== "object") continue;
        const pluginId = (p as ProviderRecord).pluginId;
        if (typeof pluginId !== "string" || !pluginId || providerSeen.has(pluginId)) continue;
        providerSeen.add(pluginId);
        providers.push({
            pluginId: pluginId.slice(0, 128),
            displayName: typeof (p as ProviderRecord).displayName === "string"
                ? (p as ProviderRecord).displayName.slice(0, 128)
                : pluginId,
            protocolVersion: typeof (p as ProviderRecord).protocolVersion === "number"
                ? Math.floor((p as ProviderRecord).protocolVersion)
                : 1,
            registeredAt: Number((p as ProviderRecord).registeredAt) || 0,
        });
        if (providers.length >= LIMITS.maxProviders) break;
    }
    return {
        schemaVersion: STATE_SCHEMA_VERSION,
        favorites,
        recents,
        usage,
        sort,
        uiPrefs: {
            lastTypeFilter,
            lastTagFilter: typeof prefsRaw.lastTagFilter === "string" ? prefsRaw.lastTagFilter.slice(0, LIMITS.category) : "",
            lastCategoryFilter: typeof prefsRaw.lastCategoryFilter === "string" ? prefsRaw.lastCategoryFilter.slice(0, LIMITS.category) : "",
        },
        providers,
        // AI 硬边界：任何输入下默认都关（门禁测试锁定）；自定义变换列表逐条校验（F7）
        ai: {
            enabled: obj.ai !== null && typeof obj.ai === "object" && (obj.ai as AiPrefs).enabled === true,
            shareContent: obj.ai !== null && typeof obj.ai === "object" && (obj.ai as AiPrefs).shareContent === true,
            customTransforms: normalizeCustomTransforms(obj.ai !== null && typeof obj.ai === "object" ? (obj.ai as AiPrefs).customTransforms : []),
        },
        // 拼音搜索默认开（本地注解，无出域；可关）
        search: {
            pinyin: !(obj.search !== null && typeof obj.search === "object" && (obj.search as SearchPrefs).pinyin === false),
            placeholders: !(obj.search !== null && typeof obj.search === "object" && (obj.search as SearchPrefs).placeholders === false),
            lastQuery: obj.search !== null && typeof obj.search === "object" && typeof (obj.search as SearchPrefs).lastQuery === "string"
                ? ((obj.search as SearchPrefs).lastQuery as string).slice(0, LIMITS.queryChars)
                : "",
            recentQueries: obj.search !== null && typeof obj.search === "object" && Array.isArray((obj.search as SearchPrefs).recentQueries)
                ? Array.from(new Set(
                    ((obj.search as SearchPrefs).recentQueries as unknown[])
                        .filter((q): q is string => typeof q === "string" && q.trim().length > 0)
                        .map((q) => q.trim().slice(0, LIMITS.queryChars))
                )).slice(0, 10)
                : [],
            savedDiscoveryViews: obj.search !== null && typeof obj.search === "object"
                ? normalizeSavedDiscoveryViews((obj.search as SearchPrefs).savedDiscoveryViews)
                : [],
            density: (obj.search !== null && typeof obj.search === "object" && (obj.search as SearchPrefs).density === "compact")
                ? "compact"
                : "comfortable",
            miniMode: (obj.search !== null && typeof obj.search === "object" && (obj.search as SearchPrefs).miniMode === true),
            miniPosition: normalizeMiniPosition((obj.search as SearchPrefs)?.miniPosition),
            miniCollapsed: (obj.search !== null && typeof obj.search === "object" && (obj.search as SearchPrefs).miniCollapsed === true),
        },
        // 插入偏好默认开（F1/F3）；显式 false 才关
        insert: {
            promptVariables: !(insertRaw.promptVariables === false),
            recordUsage: !(insertRaw.recordUsage === false),
        },
        variableMemory: normalizeVariableMemory(obj.variableMemory),
        clipboardHistoryEnabled: !(obj.clipboardHistoryEnabled === false),
        clipboardHistoryLimit: normalizeClipboardLimit(obj.clipboardHistoryLimit),
        clipboardHistory: normalizeClipboardHistory(obj.clipboardHistory, normalizeClipboardLimit(obj.clipboardHistoryLimit)),
        variablePresets: normalizeVariablePresets(obj.variablePresets),
        dailyUsage: normalizeDailyUsage(obj.dailyUsage),
        customItemOrder: normalizeCustomItemOrder(obj.customItemOrder),
        profilePresets: normalizeProfilePresets(obj.profilePresets),
        clipboardSmartMatchEnabled: obj.clipboardSmartMatchEnabled === true,
        pinnedTopChips: Array.isArray(obj.pinnedTopChips)
            ? obj.pinnedTopChips.filter((x): x is string => typeof x === "string" && x.startsWith("xlc-") && x.length <= 48).slice(0, 5)
            : [],
    };
}

export function normalizeDailyUsage(raw: unknown): Record<string, number> {
    const dailyRaw = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const keys = Object.keys(dailyRaw).filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k)).sort();
    // 约束存储有界性：最多保留最近 365 天，防止长期挂机无限膨胀
    const keptKeys = keys.length > 365 ? keys.slice(-365) : keys;
    const dailyUsage: Record<string, number> = {};
    for (const dateKey of keptKeys) {
        const val = dailyRaw[dateKey];
        if (typeof val === "number" && Number.isInteger(val) && val > 0) {
            dailyUsage[dateKey] = Math.min(val, 1_000_000);
        }
    }
    return dailyUsage;
}

export function normalizeClipboardLimit(raw: unknown): number {
    const num = Number(raw);
    if (!Number.isInteger(num)) return 30;
    if (num < 10) return 10;
    if (num > 100) return 100;
    return num;
}

function normalizeVariablePresets(raw: unknown): Record<string, Record<string, Record<string, string>>> {
    const rawPresets = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const variablePresets: Record<string, Record<string, Record<string, string>>> = {};
    for (const [itemId, schemes] of Object.entries(rawPresets)) {
        if (!schemes || typeof schemes !== "object") continue;
        const validSchemes: Record<string, Record<string, string>> = {};
        for (const [schemeName, fills] of Object.entries(schemes as Record<string, unknown>)) {
            if (!fills || typeof fills !== "object") continue;
            const validFills: Record<string, string> = {};
            for (const [k, v] of Object.entries(fills as Record<string, unknown>)) {
                if (typeof k === "string" && typeof v === "string") {
                    validFills[k.slice(0, 64)] = v.slice(0, 2000);
                }
            }
            if (Object.keys(validFills).length > 0) {
                validSchemes[schemeName.trim().slice(0, 32)] = validFills;
            }
            if (Object.keys(validSchemes).length >= 5) break;
        }
        if (Object.keys(validSchemes).length > 0) {
            variablePresets[itemId.slice(0, 64)] = validSchemes;
        }
    }
    return variablePresets;
}

function normalizeClipboardHistory(raw: unknown, limit = 30): ClipboardHistoryEntry[] {
    const maxLimit = typeof limit === "number" && limit > 0 ? Math.min(100, limit) : 30;
    const clipRaw = Array.isArray(raw) ? raw : [];
    const clipboardHistory: ClipboardHistoryEntry[] = [];
    const clipSeen = new Set<string>();
    for (const c of clipRaw) {
        if (!c || typeof c !== "object") continue;
        const text = typeof (c as ClipboardHistoryEntry).text === "string" ? (c as ClipboardHistoryEntry).text.trim() : "";
        const copiedAt = Number((c as ClipboardHistoryEntry).copiedAt);
        if (!text || text.length > 8000 || clipSeen.has(text)) continue;
        if (!Number.isFinite(copiedAt) || copiedAt <= 0) continue;
        clipSeen.add(text);
        clipboardHistory.push({text, copiedAt});
        if (clipboardHistory.length >= maxLimit) break;
    }
    return clipboardHistory;
}

export function pushClipboardHistory(list: ClipboardHistoryEntry[] | undefined, text: string, max = 30): ClipboardHistoryEntry[] {
    const maxLimit = typeof max === "number" && max > 0 ? Math.min(100, max) : 30;
    const clean = (text ?? "").trim();
    if (!clean || clean.length < 2 || clean.length > 8000) return list ? [...list] : [];
    const current = (list ?? []).filter((e) => e.text !== clean);
    current.unshift({text: clean, copiedAt: Date.now()});
    return current.slice(0, maxLimit);
}

/**
 * 迁移：v1 → v2。
 * v1 形状（历史占位）：{schemaVersion:1, pinnedIds, recentIds, settings:{typeFilter, tagFilter}}。
 * 未知的未来版本拒绝降级读取（返回 null，由调用方保留原始数据等待升级），禁止静默改写。
 */
export function migrateState(raw: unknown): {state: PluginState} | {rejected: "future-version"; observedVersion: number} {
    if (!raw || typeof raw !== "object") return {state: normalizeState(null)};
    const obj = raw as Record<string, unknown>;
    const version = typeof obj.schemaVersion === "number" ? Math.floor(obj.schemaVersion) : 1;
    if (version > STATE_SCHEMA_VERSION) {
        return {rejected: "future-version", observedVersion: version};
    }
    let payload = obj;
    if (version === 1) {
        payload = {
            schemaVersion: 2,
            favorites: Array.isArray(obj.pinnedIds) ? obj.pinnedIds : obj.favorites,
            recents: Array.isArray(obj.recentIds)
                ? (obj.recentIds as unknown[]).map((id) => ({id, usedAt: Date.now()}))
                : obj.recents,
            sort: obj.sort,
            uiPrefs: {
                lastTypeFilter: (obj.settings as {typeFilter?: unknown})?.typeFilter,
                lastTagFilter: (obj.settings as {tagFilter?: unknown})?.tagFilter,
            },
            providers: obj.providers,
        };
    }
    return {state: normalizeState(payload)};
}

// ---- 持久化载荷组装（写入口径统一，杜绝散落的字段拼装）----

export function serializeState(state: PluginState): Record<string, unknown> {
    return normalizeState(state) as unknown as Record<string, unknown>;
}

export function serializeLibraryConfig(config: LibraryConfig): Record<string, unknown> {
    const normalized = normalizeLibraryConfig(config);
    if (!normalized) throw new Error("invalid library config");
    return normalized as unknown as Record<string, unknown>;
}

export function normalizeCustomItemOrder(raw: unknown): Record<string, number> {
    const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const result: Record<string, number> = {};
    for (const [id, val] of Object.entries(obj)) {
        if (typeof id === "string" && id.startsWith("xlc-") && id.length <= 48 && typeof val === "number" && Number.isFinite(val)) {
            result[id] = Math.round(val);
        }
    }
    return result;
}

/**
 * 纯函数：根据侧车自定义排序权重重排条目列表（CAND-014 / TODO-FEAT-013）
 * 未指定权重的条目自然保底排在最后，并保持既有相对顺序
 */
export function applyCustomOrder<T extends {id: string}>(
    items: readonly T[],
    customOrder?: Readonly<Record<string, number>>
): T[] {
    if (!customOrder || Object.keys(customOrder).length === 0) return [...items];
    return [...items].sort((a, b) => {
        const valA = customOrder[a.id];
        const valB = customOrder[b.id];
        const orderA = typeof valA === "number" ? valA : 999999;
        const orderB = typeof valB === "number" ? valB : 999999;
        if (orderA !== orderB) return orderA - orderB;
        return 0;
    });
}

/**
 * 纯函数：上移或下移分类列表内的条目，重新分配间隔权重并返回更新后的字典（CAND-014 / TODO-FEAT-013）
 */
export function reorderItem<T extends {id: string}>(
    items: readonly T[],
    targetId: string,
    direction: "up" | "down",
    currentOrder?: Readonly<Record<string, number>>
): Record<string, number> {
    const sorted = applyCustomOrder(items, currentOrder);
    const idx = sorted.findIndex((it) => it.id === targetId);
    if (idx < 0) return {...(currentOrder ?? {})};
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return {...(currentOrder ?? {})};

    const copy = [...sorted];
    const itemA = copy[idx];
    const itemB = copy[targetIdx];
    if (!itemA || !itemB) return {...(currentOrder ?? {})};
    copy[idx] = itemB;
    copy[targetIdx] = itemA;

    const result: Record<string, number> = {...(currentOrder ?? {})};
    copy.forEach((it, i) => {
        result[it.id] = (i + 1) * 10;
    });
    return result;
}

/**
 * 纯函数：根据时间戳计算剪贴板条目自然时间分段（今天/昨天/更早）（CAND-013 / TODO-FEAT-012）
 */
export function getClipboardTimeGroup(
    timestamp: number,
    now: number = Date.now()
): "today" | "yesterday" | "earlier" {
    if (!Number.isFinite(timestamp) || timestamp <= 0) return "earlier";
    const nowDate = new Date(now);
    const todayStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
    if (timestamp >= todayStart) {
        return "today";
    }
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
    if (timestamp >= yesterdayStart) {
        return "yesterday";
    }
    return "earlier";
}

export function normalizeProfilePresets(raw: unknown): Record<string, string> {
    const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const result: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj)) {
        if (typeof k === "string" && k.trim() && typeof v === "string" && v.trim()) {
            result[k.trim().slice(0, 64)] = v.trim().slice(0, 500);
        }
    }
    return result;
}

/** 常用名片字段别名族（CAND-016 / TODO-FEAT-015） */
export const PROFILE_FIELD_ALIASES: Record<string, string[]> = {
    "姓名": ["姓名", "名字", "联系人", "收件人", "name"],
    "手机号": ["手机号", "手机", "电话", "联系电话", "联系方式", "phone", "mobile", "tel"],
    "邮箱": ["邮箱", "电子邮箱", "企业邮箱", "email", "mail"],
    "公司": ["公司", "公司名称", "企业", "企业名称", "单位", "company"],
    "税号": ["税号", "统一社会信用代码", "纳税人识别号", "taxid", "tax_no"],
    "地址": ["地址", "收件地址", "详细地址", "邮寄地址", "address"],
    "职务": ["职务", "职位", "头衔", "title", "position"],
};

/**
 * 纯函数：根据变量名在全局个人档案池中模糊匹配预填值（CAND-016 / TODO-FEAT-015）
 */
export function matchProfilePreset(fieldName: string, presets?: Readonly<Record<string, string>>): string | undefined {
    if (!presets || Object.keys(presets).length === 0) return undefined;
    const clean = fieldName.trim().toLowerCase();
    if (!clean) return undefined;

    // 1. 直接精确命中
    for (const [k, v] of Object.entries(presets)) {
        if (k.trim().toLowerCase() === clean && v) return v;
    }

    // 2. 别名族命中
    for (const [standardKey, aliases] of Object.entries(PROFILE_FIELD_ALIASES)) {
        const isMatched = clean === standardKey.toLowerCase() || aliases.some((a) => clean === a.toLowerCase() || clean.includes(a.toLowerCase()));
        if (isMatched) {
            // 在预设中寻找命中该族内任意别名的键
            for (const alias of aliases) {
                for (const [k, v] of Object.entries(presets)) {
                    if (k.trim().toLowerCase() === alias.toLowerCase() && v) {
                        return v;
                    }
                }
            }
        }
    }

    return undefined;
}

export function normalizeMiniPosition(raw: unknown): MiniPosition | undefined {
    if (!raw || typeof raw !== "object") return undefined;
    const obj = raw as Record<string, unknown>;
    const x = Number(obj.x);
    const y = Number(obj.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined;
    if (x < 0 || x > 10000 || y < 0 || y > 10000) return undefined;
    return {
        x: Math.round(x),
        y: Math.round(y),
    };
}

export interface SnapResult {
    x: number;
    y: number;
    snapped: boolean;
    edge?: "left" | "right" | "top" | "bottom";
}

/**
 * 纯函数：计算迷你悬浮条拖拽贴边自动磁吸对齐（CAND-024 / TODO-OPT-05）
 * 当距离屏幕四边 ≤ threshold 时自动平滑贴合，消除浮空缝隙
 */
export function calculateMagneticSnap(
    x: number,
    y: number,
    width: number,
    height: number,
    viewportWidth: number,
    viewportHeight: number,
    threshold = 24
): SnapResult {
    let finalX = Math.max(0, Math.min(viewportWidth - width, x));
    let finalY = Math.max(0, Math.min(viewportHeight - height, y));
    let snapped = false;
    let edge: SnapResult["edge"] | undefined;

    // 左边缘
    if (finalX <= threshold) {
        finalX = 0;
        snapped = true;
        edge = "left";
    }
    // 右边缘
    else if (viewportWidth - (finalX + width) <= threshold) {
        finalX = Math.max(0, viewportWidth - width);
        snapped = true;
        edge = "right";
    }

    // 顶边缘
    if (finalY <= threshold) {
        finalY = 0;
        snapped = true;
        edge = edge || "top";
    }
    // 底边缘
    else if (viewportHeight - (finalY + height) <= threshold) {
        finalY = Math.max(0, viewportHeight - height);
        snapped = true;
        edge = edge || "bottom";
    }

    return {
        x: Math.round(finalX),
        y: Math.round(finalY),
        snapped,
        edge,
    };
}




