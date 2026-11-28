// 全生态跨机容灾底座适配器（lvSnapshotVault · xiaolv-common）
// 覆盖：常用条目/模板库配置、置顶/收藏/分组/变量默认值、触发词/Espanso 规则、最近使用频次与偏好设置。
// 安全红线：绝不导出本地剪贴板历史（防密码/OTP 泄露），绝不导出任何 API Key / Token / 明文密钥。
import {EXPORT_SCHEMA_VERSION, LIMITS, PROTOCOL_NAME, STORAGE_KEYS} from "../constants";
import {CommonItem} from "../model/item";
import {
    LibraryConfig,
    PluginState,
    ProviderRecord,
    RecentEntry,
    SavedDiscoveryView,
    CustomTransform,
    UsageEntry,
    normalizeLibraryConfig,
    normalizeState,
} from "../model/storage";
import {ExportBundle, ExportedItem, buildBundle, validateImport} from "../model/transfer";
import {countRememberedFields, normalizeVariableMemory, type VariableMemory} from "../model/variable-memory";
import {pushDiagError, type LvVaultPluginAdapter} from "../libs/lv-notice-kit";
import {toErrorMessage} from "../model/errors";
import type {XiaolvCommonPluginContext} from "./plugin-context";

export const VAULT_PLUGIN_ID = "xiaolv-common";
export const VAULT_PLUGIN_LABEL = "小驴常用";
export const VAULT_SCHEMA_VERSION = 1;

const HARMLESS_SECRET_META_KEY_RE = /^(?:hasSecret|secretSlot|secretSlots|configuredSecretSlots|secretSlotsToRebind|tokenCount|totalTokens|promptTokens|completionTokens|maxTokens|tokensUsed|tokenUsage|tokenBudget|tokenLimit|tokensPerMinute)$/i;
const SENSITIVE_KEY_EXACT_RE = /^(?:api[-_]?key|fallback[-_]?key|access[-_]?token|refresh[-_]?token|auth[-_]?token|bearer[-_]?token|gist[-_]?token|bot[-_]?token|client[-_]?secret|app[-_]?secret|secret[-_]?key|private[-_]?key|password|passwd|pwd|credential|aiKey|backupKey|wereadApiKey|wereadIntegration|webhookUrl|barkUrl|token|secret|密码|口令|密钥|私钥|令牌)$/i;
const SENSITIVE_KEY_PARTIAL_RE = /(?:api[-_]?key|fallback[-_]?key|access[-_]?token|refresh[-_]?token|auth[-_]?token|bearer[-_]?token|gist[-_]?token|bot[-_]?token|client[-_]?secret|app[-_]?secret|secret[-_]?key|private[-_]?key|password|passwd|credential|webhookUrl|密码|口令|密钥|私钥|令牌)/i;

const SECRET_VALUE_PATTERNS: readonly RegExp[] = [
    /sk-[A-Za-z0-9_-]{8,}/g,
    /Bearer\s+[A-Za-z0-9._-]{6,}/gi,
    /ghp_[A-Za-z0-9]{10,}/g,
    /xox[baprs]-[A-Za-z0-9-]{8,}/g,
    /AIza[0-9A-Za-z_-]{20,}/g,
    /AKIA[0-9A-Z]{16}/g,
];

export function isSensitiveVaultKey(key: string, value?: unknown): boolean {
    if (!key) return false;
    const trimmed = key.trim();
    if (HARMLESS_SECRET_META_KEY_RE.test(trimmed)) return false;
    if (SENSITIVE_KEY_EXACT_RE.test(trimmed) || SENSITIVE_KEY_PARTIAL_RE.test(trimmed)) {
        return !(typeof value === "number" || typeof value === "boolean");
    }
    if (
        typeof value === "string" &&
        /(?:token|secret|key|password)$/i.test(trimmed) &&
        !/(?:count|limit|budget|usage|slot|slots|name|label|mode|type|hotkey|shortcut)$/i.test(trimmed)
    ) {
        return true;
    }
    return false;
}

export function containsPlaintextSecret(text: string): boolean {
    if (!text) return false;
    for (const re of SECRET_VALUE_PATTERNS) {
        re.lastIndex = 0;
        if (re.test(text)) return true;
    }
    return false;
}

export function sanitizeStringForVault(raw: string): string {
    let out = raw;
    for (const re of SECRET_VALUE_PATTERNS) {
        const cloned = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
        out = out.replace(cloned, "[REDACTED_SECRET]");
    }
    return out;
}

export function sanitizeValueForVault<T>(value: T): T {
    if (value === null || value === undefined) return value;
    if (typeof value === "string") {
        return sanitizeStringForVault(value) as unknown as T;
    }
    if (Array.isArray(value)) {
        return value.map((entry) => sanitizeValueForVault(entry)) as unknown as T;
    }
    if (typeof value === "object") {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            if (isSensitiveVaultKey(k, v)) continue;
            out[k] = sanitizeValueForVault(v);
        }
        return out as T;
    }
    return value;
}

function sanitizeKeyValueMap(map: Readonly<Record<string, string>> | undefined): Record<string, string> {
    const out: Record<string, string> = {};
    if (!map || typeof map !== "object") return out;
    for (const [k, v] of Object.entries(map)) {
        if (typeof k !== "string" || typeof v !== "string") continue;
        if (isSensitiveVaultKey(k, v) || containsPlaintextSecret(v)) continue;
        out[k] = v;
    }
    return out;
}

function sanitizeVariableMemoryForVault(mem: VariableMemory | undefined): VariableMemory {
    const normalized = normalizeVariableMemory(mem);
    const cleanValues: VariableMemory["values"] = {};
    for (const [k, entry] of Object.entries(normalized.values)) {
        if (isSensitiveVaultKey(k, entry.value) || containsPlaintextSecret(entry.value)) continue;
        cleanValues[k] = {
            value: sanitizeStringForVault(entry.value),
            lastAt: entry.lastAt,
        };
    }
    return {
        enabled: normalized.enabled,
        values: cleanValues,
    };
}

function sanitizeVariablePresetsForVault(
    presets: Record<string, Record<string, Record<string, string>>> | undefined,
): Record<string, Record<string, Record<string, string>>> {
    const out: Record<string, Record<string, Record<string, string>>> = {};
    if (!presets || typeof presets !== "object") return out;
    for (const [itemId, schemes] of Object.entries(presets)) {
        if (!schemes || typeof schemes !== "object") continue;
        const cleanSchemes: Record<string, Record<string, string>> = {};
        for (const [schemeName, fills] of Object.entries(schemes)) {
            if (isSensitiveVaultKey(schemeName, fills)) continue;
            const cleanFills = sanitizeKeyValueMap(fills);
            if (Object.keys(cleanFills).length > 0) {
                cleanSchemes[schemeName] = cleanFills;
            }
        }
        if (Object.keys(cleanSchemes).length > 0) {
            out[itemId] = cleanSchemes;
        }
    }
    return out;
}

export function sanitizeStateForVault(state: PluginState | null | undefined): Record<string, unknown> {
    const norm = normalizeState(state ?? null);
    // 严格剥离剪贴板历史，防止用户在其他应用复制的密码、验证码或 Token 随跨机快照同步外泄
    const withoutClipboard: PluginState = {
        ...norm,
        clipboardHistory: [],
        variableMemory: sanitizeVariableMemoryForVault(norm.variableMemory),
        variablePresets: sanitizeVariablePresetsForVault(norm.variablePresets),
        profilePresets: sanitizeKeyValueMap(norm.profilePresets),
        search: {
            ...norm.search,
            lastQuery: containsPlaintextSecret(norm.search.lastQuery) ? "" : norm.search.lastQuery,
            recentQueries: (norm.search.recentQueries ?? []).filter((q) => !containsPlaintextSecret(q)),
        },
        ai: {
            enabled: norm.ai.enabled,
            shareContent: norm.ai.shareContent,
            customTransforms: norm.ai.customTransforms.map((ct) => ({
                id: ct.id,
                name: sanitizeStringForVault(ct.name),
                prompt: sanitizeStringForVault(ct.prompt),
            })),
        },
    };
    return sanitizeValueForVault(withoutClipboard) as unknown as Record<string, unknown>;
}

function extractSnapshotItems(snapshot: Record<string, unknown> | null | undefined): ExportedItem[] {
    if (!snapshot || typeof snapshot !== "object") return [];
    const bundle = snapshot.itemsBundle as {items?: unknown} | undefined;
    if (bundle && Array.isArray(bundle.items)) {
        return bundle.items.filter((x): x is ExportedItem => Boolean(x && typeof x === "object"));
    }
    if (Array.isArray(snapshot.items)) {
        return snapshot.items.filter((x): x is ExportedItem => Boolean(x && typeof x === "object"));
    }
    return [];
}

function countVariablePresetSchemes(presets: unknown): number {
    if (!presets || typeof presets !== "object") return 0;
    let total = 0;
    for (const schemes of Object.values(presets as Record<string, unknown>)) {
        if (schemes && typeof schemes === "object") {
            total += Object.keys(schemes as Record<string, unknown>).length;
        }
    }
    return total;
}

export interface SnapshotStats {
    items: number;
    triggers: number;
    pinned: number;
    savedViews: number;
    customTransforms: number;
    presets: number;
    memoryFields: number;
}

export function inspectSnapshotStats(snapshot: Record<string, unknown> | null | undefined): SnapshotStats {
    const items = extractSnapshotItems(snapshot);
    const stateRaw = snapshot && typeof snapshot.state === "object" ? (snapshot.state as Record<string, unknown>) : null;
    const normState = stateRaw ? normalizeState(stateRaw) : normalizeState(null);

    const triggers = items.filter((it) => typeof it.shortcode === "string" && it.shortcode.trim().length > 0).length;
    const pinnedSet = new Set<string>([
        ...(normState.favorites ?? []),
        ...(normState.pinnedTopChips ?? []),
    ]);
    const savedViews = normState.search.savedDiscoveryViews?.length ?? 0;
    const customTransforms = normState.ai.customTransforms.length;
    const presets = countVariablePresetSchemes(normState.variablePresets) + Object.keys(normState.profilePresets ?? {}).length;
    const memoryFields = countRememberedFields(normState.variableMemory);

    return {
        items: items.length,
        triggers,
        pinned: pinnedSet.size,
        savedViews,
        customTransforms,
        presets,
        memoryFields,
    };
}

export function countVaultRecords(snapshot: Record<string, unknown>): number {
    const stats = inspectSnapshotStats(snapshot);
    return stats.items + stats.savedViews + stats.customTransforms + stats.presets + stats.memoryFields;
}

export function formatSnapshotDiffSummary(
    current: Record<string, unknown>,
    incoming: Record<string, unknown>,
): {currentCount: number; incomingCount: number; summary: string} {
    const curStats = inspectSnapshotStats(current);
    const incStats = inspectSnapshotStats(incoming);
    const currentCount = countVaultRecords(current);
    const incomingCount = countVaultRecords(incoming);
    return {
        currentCount,
        incomingCount,
        summary: `当前 ${curStats.items} 条常用（触发词 ${curStats.triggers} / 置顶 ${curStats.pinned}） vs 快照 ${incStats.items} 条常用（触发词 ${incStats.triggers} / 置顶 ${incStats.pinned}）`,
    };
}

function mergeIdList(primary: readonly string[], secondary: readonly string[], cap: number): string[] {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const id of [...primary, ...secondary]) {
        if (typeof id !== "string" || !id || seen.has(id)) continue;
        seen.add(id);
        out.push(id);
        if (out.length >= cap) break;
    }
    return out;
}

export function mergeVaultLibraryConfig(
    current: LibraryConfig | null,
    incomingRaw: unknown,
): LibraryConfig | null {
    const incoming = normalizeLibraryConfig(incomingRaw);
    if (!current) return incoming;
    if (!incoming || current.mode !== incoming.mode) return current;
    return normalizeLibraryConfig({
        ...current,
        notebookIds: mergeIdList(current.notebookIds, incoming.notebookIds, 16),
        containerDocIds: mergeIdList(current.containerDocIds, incoming.containerDocIds, 64),
        createdDocIds: mergeIdList(current.createdDocIds, incoming.createdDocIds, 64),
        createdNotebookIds: mergeIdList(current.createdNotebookIds ?? [], incoming.createdNotebookIds ?? [], 16),
        configuredAt: current.configuredAt || incoming.configuredAt,
    });
}

export function mergeVaultPluginState(
    currentRaw: PluginState | null | undefined,
    incomingRaw: unknown,
): PluginState {
    const cur = normalizeState(currentRaw ?? null);
    if (!incomingRaw || typeof incomingRaw !== "object") return cur;
    const inc = normalizeState(incomingRaw);

    const favorites = mergeIdList(cur.favorites, inc.favorites, LIMITS.maxFavorites);
    const pinnedTopChips = mergeIdList(cur.pinnedTopChips ?? [], inc.pinnedTopChips ?? [], 5);

    const recentsMap = new Map<string, RecentEntry>();
    for (const r of [...inc.recents, ...cur.recents]) {
        const prev = recentsMap.get(r.id);
        if (!prev || r.usedAt > prev.usedAt) {
            recentsMap.set(r.id, {id: r.id, usedAt: r.usedAt});
        }
    }
    const recents = Array.from(recentsMap.values())
        .sort((a, b) => b.usedAt - a.usedAt)
        .slice(0, LIMITS.maxRecents);

    const usageMap = new Map<string, UsageEntry>();
    for (const [id, entry] of Object.entries(inc.usage)) {
        usageMap.set(id, {...entry});
    }
    for (const [id, entry] of Object.entries(cur.usage)) {
        const prev = usageMap.get(id);
        usageMap.set(id, {
            count: prev ? Math.max(prev.count, entry.count) : entry.count,
            lastAt: prev ? Math.max(prev.lastAt, entry.lastAt) : entry.lastAt,
        });
    }
    const usageEntries = Array.from(usageMap.entries())
        .sort((a, b) => b[1].lastAt - a[1].lastAt)
        .slice(0, LIMITS.maxUsage);
    const usage: Record<string, UsageEntry> = {};
    for (const [id, entry] of usageEntries) usage[id] = entry;

    const dailyUsage: Record<string, number> = {...(inc.dailyUsage ?? {})};
    for (const [date, count] of Object.entries(cur.dailyUsage ?? {})) {
        dailyUsage[date] = Math.max(dailyUsage[date] ?? 0, count);
    }

    const customItemOrder: Record<string, number> = {
        ...(inc.customItemOrder ?? {}),
        ...(cur.customItemOrder ?? {}),
    };

    const providerMap = new Map<string, ProviderRecord>();
    for (const p of [...inc.providers, ...cur.providers]) {
        if (!providerMap.has(p.pluginId)) providerMap.set(p.pluginId, p);
    }
    const providers = Array.from(providerMap.values()).slice(0, LIMITS.maxProviders);

    const ctMap = new Map<string, CustomTransform>();
    for (const ct of [...cur.ai.customTransforms, ...inc.ai.customTransforms]) {
        if (!ctMap.has(ct.id)) ctMap.set(ct.id, ct);
    }
    const customTransforms = Array.from(ctMap.values()).slice(0, LIMITS.maxCustomTransforms);

    const savedViewsMap = new Map<string, SavedDiscoveryView>();
    for (const v of [...(cur.search.savedDiscoveryViews ?? []), ...(inc.search.savedDiscoveryViews ?? [])]) {
        if (!savedViewsMap.has(v.id)) savedViewsMap.set(v.id, v);
    }
    const savedDiscoveryViews = Array.from(savedViewsMap.values()).slice(0, LIMITS.maxSavedDiscoveryViews);

    const recentQueries = mergeIdList(
        cur.search.recentQueries ?? [],
        (inc.search.recentQueries ?? []).filter((q) => !containsPlaintextSecret(q)),
        10,
    );

    const mergedValues: VariableMemory["values"] = {...inc.variableMemory.values};
    for (const [k, entry] of Object.entries(cur.variableMemory.values)) {
        const prev = mergedValues[k];
        if (!prev || entry.lastAt >= prev.lastAt) {
            mergedValues[k] = entry;
        }
    }
    const variableMemory = sanitizeVariableMemoryForVault({
        enabled: cur.variableMemory.enabled,
        values: mergedValues,
    });

    const variablePresets: Record<string, Record<string, Record<string, string>>> = {};
    const allPresetItemIds = new Set([
        ...Object.keys(inc.variablePresets ?? {}),
        ...Object.keys(cur.variablePresets ?? {}),
    ]);
    for (const itemId of allPresetItemIds) {
        const mergedSchemes: Record<string, Record<string, string>> = {
            ...(inc.variablePresets?.[itemId] ?? {}),
            ...(cur.variablePresets?.[itemId] ?? {}),
        };
        if (Object.keys(mergedSchemes).length > 0) {
            variablePresets[itemId] = mergedSchemes;
        }
    }

    const profilePresets: Record<string, string> = {
        ...sanitizeKeyValueMap(inc.profilePresets),
        ...sanitizeKeyValueMap(cur.profilePresets),
    };

    return normalizeState({
        schemaVersion: cur.schemaVersion,
        favorites,
        pinnedTopChips,
        recents,
        usage,
        dailyUsage,
        customItemOrder,
        sort: cur.sort !== "manual" ? cur.sort : inc.sort,
        uiPrefs: {
            lastTypeFilter: cur.uiPrefs.lastTypeFilter || inc.uiPrefs.lastTypeFilter,
            lastTagFilter: cur.uiPrefs.lastTagFilter || inc.uiPrefs.lastTagFilter,
            lastCategoryFilter: cur.uiPrefs.lastCategoryFilter || inc.uiPrefs.lastCategoryFilter,
        },
        providers,
        ai: {
            enabled: cur.ai.enabled,
            shareContent: cur.ai.shareContent,
            customTransforms,
        },
        search: {
            pinyin: cur.search.pinyin,
            placeholders: cur.search.placeholders,
            lastQuery: cur.search.lastQuery || inc.search.lastQuery,
            recentQueries,
            savedDiscoveryViews,
            density: cur.search.density ?? inc.search.density,
            miniMode: cur.search.miniMode ?? inc.search.miniMode,
            miniPosition: cur.search.miniPosition ?? inc.search.miniPosition,
            miniCollapsed: cur.search.miniCollapsed ?? inc.search.miniCollapsed,
            clipPanelCollapsed: cur.search.clipPanelCollapsed ?? inc.search.clipPanelCollapsed,
            homeRecentClipCollapsed: cur.search.homeRecentClipCollapsed ?? inc.search.homeRecentClipCollapsed,
            columnWidths: cur.search.columnWidths ?? inc.search.columnWidths,
        },
        insert: {
            promptVariables: cur.insert.promptVariables,
            recordUsage: cur.insert.recordUsage,
        },
        variableMemory,
        variablePresets: sanitizeVariablePresetsForVault(variablePresets),
        profilePresets,
        // 严格保留本机剪贴板历史，绝不从跨机快照覆盖或混入
        clipboardHistoryEnabled: cur.clipboardHistoryEnabled,
        clipboardHistoryLimit: cur.clipboardHistoryLimit,
        clipboardHistory: cur.clipboardHistory,
        clipboardSmartMatchEnabled: cur.clipboardSmartMatchEnabled ?? inc.clipboardSmartMatchEnabled,
    });
}

export function createXiaolvCommonVaultAdapter(plugin: XiaolvCommonPluginContext): LvVaultPluginAdapter {
    const exportSnapshot = async (): Promise<Record<string, unknown>> => {
        let itemsBundle: ExportBundle | null = null;
        const library = plugin.library;
        try {
            if (library) {
                const idx = await library.ensureIndex();
                if (idx && idx.items) {
                    const items: CommonItem[] = [];
                    const kramdownById = new Map<string, string>();
                    for (const item of idx.items.values()) {
                        try {
                            const kd = await library.getStoredItemKramdown(item);
                            if (kd.ok && kd.data !== undefined) {
                                items.push(item);
                                kramdownById.set(item.id, sanitizeStringForVault(kd.data));
                            }
                        } catch {}
                    }
                    itemsBundle = buildBundle(items, kramdownById, Date.now());
                }
            }
        } catch (err) {
            console.warn("[xiaolv-common] vault exportSnapshot items error:", err);
        }

        const safeConfig = plugin.config ? normalizeLibraryConfig(plugin.config) : null;
        const safeState = sanitizeStateForVault(plugin.state);
        return sanitizeValueForVault({
            v: VAULT_SCHEMA_VERSION,
            plugin: VAULT_PLUGIN_ID,
            schemaVersion: VAULT_SCHEMA_VERSION,
            exportedAt: new Date().toISOString(),
            config: safeConfig,
            state: safeState,
            itemsBundle,
        });
    };

    return {
        pluginId: VAULT_PLUGIN_ID,
        label: VAULT_PLUGIN_LABEL,
        schemaVersion: VAULT_SCHEMA_VERSION,
        countRecords: (snapshot: Record<string, unknown>) => countVaultRecords(snapshot),
        exportSnapshot,
        previewDiff: async (incoming: Record<string, unknown>) => {
            const current = await exportSnapshot();
            return formatSnapshotDiffSummary(current, incoming);
        },
        importMerge: async (incoming: Record<string, unknown>): Promise<boolean> => {
            if (!incoming || typeof incoming !== "object") return false;
            const library = plugin.library;
            const storageManager = plugin.storageManager;
            let mergeFailed = false;
            let configChanged = false;
            let itemsChanged = false;

            try {
                // 1. 库配置合并（本机未配置时采用快照配置；同模式时补充缺失文档/笔记本 ID）
                if (incoming.config && typeof incoming.config === "object") {
                    const mergedCfg = mergeVaultLibraryConfig(plugin.config, incoming.config);
                    if (mergedCfg && mergedCfg !== plugin.config) {
                        plugin.config = mergedCfg;
                        library?.setConfig(mergedCfg);
                        configChanged = true;
                        const cfgSaved = storageManager
                            ? await storageManager.saveConfig(mergedCfg, true)
                            : await Promise.resolve(plugin.persistSidecar(STORAGE_KEYS.config, mergedCfg));
                        if (cfgSaved === false) mergeFailed = true;
                    }
                }

                // 2. 侧车状态幂等安全合并（保留本机剪贴板历史与明文隔离）
                if (incoming.state && typeof incoming.state === "object") {
                    const mergedState = mergeVaultPluginState(plugin.state, incoming.state);
                    Object.assign(plugin.state, mergedState);
                    const stateSaved = storageManager
                        ? await storageManager.saveStateNow(plugin.state, true)
                        : await Promise.resolve(plugin.persistSidecar(STORAGE_KEYS.state, plugin.state));
                    if (stateSaved === false) mergeFailed = true;
                    try {
                        plugin.ai?.updateSettings?.(mergedState.ai);
                        plugin.registry?.restore?.(mergedState.providers);
                        plugin.applyPinyinAdapter?.();
                    } catch {}
                }

                // 3. 常用条目/模板/触发词幂等安全合并（缺失条目补建；已有条目仅在快照 updatedAt 更新时覆盖）
                const incomingItems = extractSnapshotItems(incoming);
                if (incomingItems.length > 0 && library) {
                    const existingIndex = await library.ensureIndex(0);
                    const toCreate: ExportedItem[] = [];
                    const toUpdate: ExportedItem[] = [];
                    for (const item of incomingItems) {
                        if (!item || typeof item.id !== "string") continue;
                        const existing = existingIndex.items.get(item.id);
                        if (!existing) {
                            toCreate.push(item);
                        } else if ((Number(item.updatedAt) || 0) > (Number(existing.updatedAt) || 0)) {
                            toUpdate.push(item);
                        }
                    }

                    if (toCreate.length > 0) {
                        const createBundle = JSON.stringify({
                            protocol: PROTOCOL_NAME,
                            schemaVersion: EXPORT_SCHEMA_VERSION,
                            exportedAt: Date.now(),
                            items: toCreate,
                        });
                        const check = validateImport(createBundle);
                        if (check.ok && check.parsed) {
                            const receipt = await plugin.importBundleText(createBundle, "skip");
                            if (receipt.failed > 0 && receipt.created === 0) mergeFailed = true;
                            if (receipt.created > 0) itemsChanged = true;
                        }
                    }

                    if (toUpdate.length > 0) {
                        const updateBundle = JSON.stringify({
                            protocol: PROTOCOL_NAME,
                            schemaVersion: EXPORT_SCHEMA_VERSION,
                            exportedAt: Date.now(),
                            items: toUpdate,
                        });
                        const check = validateImport(updateBundle);
                        if (check.ok && check.parsed) {
                            const receipt = await plugin.importBundleText(updateBundle, "overwrite");
                            if (receipt.failed > 0 && receipt.overwritten === 0) mergeFailed = true;
                            if (receipt.overwritten > 0) itemsChanged = true;
                        }
                    }
                }

                if (storageManager && typeof storageManager.flush === "function") {
                    await storageManager.flush();
                }
                if (library && (configChanged || itemsChanged)) {
                    library.invalidateIndex();
                    await library.ensureIndex(0);
                }
                plugin.invalidatePreviewCache?.();
                plugin.notifyExternalDataChange?.();
                return !mergeFailed;
            } catch (err) {
                console.error("[xiaolv-common] vault importMerge failed:", err);
                pushDiagError({source: VAULT_PLUGIN_LABEL, message: `跨机容灾合并恢复失败：${toErrorMessage(err)}`});
                return false;
            }
        },
    };
}
