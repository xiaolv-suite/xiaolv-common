// 模板包导入导出与全生态统一灾备服务（DataBackupService · S10）
import {ConflictPolicy, ExportBundle, ExportedItem, ImportReceipt, buildBundle, validateImport} from "../model/transfer";
import {CommonItem} from "../model/item";
import {ExportIntegrityError} from "./export-markdown";
import {normalizeLibraryConfig, normalizeState} from "../model/storage";
import {EXPORT_SCHEMA_VERSION, PROTOCOL_NAME, STORAGE_KEYS} from "../constants";
import {toErrorMessage} from "../model/errors";
import {pushDiagError} from "../libs/lv-notice-kit";
import {resolveTargetHPath} from "./commands";
import type {StarterPackMeta} from "./prompt-pack";
import type {XiaolvCommonPluginContext} from "./plugin-context";

export class DataBackupService {
    constructor(private readonly plugin: XiaolvCommonPluginContext) {}

    async exportBundle(): Promise<string> {
        const library = this.plugin.library;
        if (!library) throw new Error("library unavailable");
        const idx = await library.ensureIndex();
        if (idx.truncated || idx.stopped || idx.errors.length > 0) {
            throw new ExportIntegrityError("index-incomplete");
        }
        const items: CommonItem[] = [];
        const kramdownById = new Map<string, string>();
        for (const item of idx.items.values()) {
            const kd = await library.getStoredItemKramdown(item);
            if (!kd.ok) throw new ExportIntegrityError("item-unreadable", item.title || item.id, kd.message);
            items.push(item);
            kramdownById.set(item.id, kd.data);
        }
        return JSON.stringify(buildBundle(items, kramdownById, Date.now()), null, 2);
    }

    async importBundleText(jsonText: string, policy: ConflictPolicy): Promise<ImportReceipt> {
        const library = this.plugin.library;
        if (!library) throw new Error("library unavailable");
        const validation = validateImport(jsonText);
        if (!validation.ok || !validation.parsed) {
            throw new Error(validation.reason ?? "invalid");
        }
        const {importBundle: importBundleCore} = await import(/* webpackChunkName: "importer" */ "./importer");
        return importBundleCore(library, validation.parsed, policy);
    }

    async importMarkdownItems(items: ReadonlyArray<ExportedItem>, policy: ConflictPolicy): Promise<ImportReceipt> {
        const library = this.plugin.library;
        if (!library) throw new Error("library unavailable");
        const {importMarkdownBundle} = await import(/* webpackChunkName: "import-markdown" */ "./import-markdown");
        return importMarkdownBundle(library, items, policy);
    }

    async importStarterPackDirect(markdown: string): Promise<{ok: boolean; count: number}> {
        const library = this.plugin.library;
        if (!library) return {ok: false, count: 0};
        try {
            const {parseMarkdownPack} = await import(/* webpackChunkName: "import-markdown" */ "./import-markdown");
            const parsed = parseMarkdownPack(markdown);
            if (parsed.items.length === 0) return {ok: false, count: 0};
            const receipt = await this.importMarkdownItems(parsed.items, "skip");
            if (receipt.created > 0 || receipt.skipped > 0 || receipt.failed === 0) {
                await library.ensureIndex(0);
                this.plugin.notifyExternalDataChange();
                return {ok: true, count: receipt.created || receipt.total};
            }
            return {ok: false, count: 0};
        } catch {
            return {ok: false, count: 0};
        }
    }

    async createStarterPackDedicatedDoc(pack: StarterPackMeta): Promise<{ok: boolean; count: number; docId?: string; hPath?: string}> {
        const library = this.plugin.library;
        const kernelClient = this.plugin.kernelClient;
        if (!library || !kernelClient) return {ok: false, count: 0};
        try {
            const nbReceipt = await library.listNotebooks();
            if (!nbReceipt.ok || nbReceipt.data.length === 0) {
                return {ok: false, count: 0};
            }
            const hubNb = nbReceipt.data.find((n: any) => /^(🐴\s*)?小驴(生态|空间|笔记本)/.test(n.name || ""));
            const cfg = this.plugin.config;
            const configuredNbId = cfg?.mode === "notebook" ? cfg.notebookIds?.[0] : undefined;
            const validConfiguredNb = configuredNbId && nbReceipt.data.some((n: any) => n.id === configuredNbId) ? configuredNbId : undefined;
            const targetNotebookId = validConfiguredNb || hubNb?.id || nbReceipt.data[0]!.id;
            const targetNbMeta = nbReceipt.data.find((n: any) => n.id === targetNotebookId);
            const isHubNb = Boolean(targetNbMeta && /^(🐴\s*)?小驴(生态|空间|笔记本)/.test(targetNbMeta.name || ""));
            const docTitle = `常用资产 · ${pack.name}`;
            const targetHPath = resolveTargetHPath(docTitle, isHubNb);
            const {buildDedicatedDocMarkdown} = await import(/* webpackChunkName: "prompt-pack" */ "./prompt-pack");
            const docMd = buildDedicatedDocMarkdown(pack);
            const res = await kernelClient.request<string>("createDocWithMd", {
                notebook: targetNotebookId,
                path: targetHPath,
                markdown: docMd,
            });
            if (res) {
                await library.ensureIndex(0);
                this.plugin.notifyExternalDataChange();
                return {ok: true, count: pack.itemCount, docId: res, hPath: targetHPath};
            }
            return {ok: false, count: 0};
        } catch {
            return {ok: false, count: 0};
        }
    }

    async dumpData(): Promise<Record<string, unknown>> {
        let itemsBundle: ExportBundle | null = null;
        const library = this.plugin.library;
        try {
            if (library) {
                const idx = await library.ensureIndex();
                if (idx && idx.items) {
                    const items: CommonItem[] = [];
                    const kramdownById = new Map<string, string>();
                    for (const item of idx.items.values()) {
                        try {
                            const kd = await library.getStoredItemKramdown(item);
                            if (kd.ok && kd.data) {
                                items.push(item);
                                kramdownById.set(item.id, kd.data);
                            }
                        } catch {}
                    }
                    itemsBundle = buildBundle(items, kramdownById, Date.now());
                }
            }
        } catch (e) {
            console.warn("[xiaolv-common] dumpData items error:", e);
        }

        return {
            version: 1,
            plugin: "xiaolv-common",
            exportedAt: new Date().toISOString(),
            config: this.plugin.config ?? null,
            state: this.plugin.state ?? null,
            itemsBundle: itemsBundle ?? null,
        };
    }

    async restoreData(data: Record<string, unknown>): Promise<boolean> {
        if (!data || typeof data !== "object") return false;
        const library = this.plugin.library;
        const storageManager = this.plugin.storageManager;
        try {
            let restoreFailed = false;
            let configRestored = false;
            if (data.config && typeof data.config === "object") {
                const normalizedConfig = normalizeLibraryConfig(data.config);
                if (normalizedConfig) {
                    this.plugin.config = normalizedConfig;
                    library?.setConfig(normalizedConfig);
                    configRestored = true;
                    const cfgSaved = storageManager
                        ? await storageManager.saveConfig(normalizedConfig, true)
                        : await Promise.resolve(this.plugin.persistSidecar(STORAGE_KEYS.config, normalizedConfig));
                    if (cfgSaved === false) {
                        restoreFailed = true;
                    }
                }
            }
            if (data.state && typeof data.state === "object") {
                const normalizedState = normalizeState(data.state);
                if (normalizedState) {
                    this.plugin.state = normalizedState;
                    const stateSaved = storageManager
                        ? await storageManager.saveStateNow(normalizedState, true)
                        : await Promise.resolve(this.plugin.persistSidecar(STORAGE_KEYS.state, normalizedState));
                    if (stateSaved === false) {
                        restoreFailed = true;
                    }
                    try {
                        this.plugin.ai?.updateSettings?.(normalizedState.ai);
                        this.plugin.registry?.restore?.(normalizedState.providers);
                        this.plugin.applyPinyinAdapter?.();
                    } catch {
                        // 侧栏/子系统同步失败不阻断数据落盘
                    }
                }
            }
            let itemsRestored = false;
            if (data.itemsBundle && typeof data.itemsBundle === "object") {
                try {
                    await this.importBundleText(JSON.stringify(data.itemsBundle), "overwrite");
                    itemsRestored = true;
                } catch (err) {
                    console.warn("[xiaolv-common] restoreData importBundle error:", err);
                    restoreFailed = true;
                    pushDiagError({ source: "小驴常用", message: `灾备恢复条目包失败：${toErrorMessage(err)}` });
                }
            } else if (Array.isArray(data.items)) {
                try {
                    const fallbackBundle = {
                        protocol: PROTOCOL_NAME,
                        schemaVersion: EXPORT_SCHEMA_VERSION,
                        exportedAt: Date.now(),
                        items: data.items,
                    };
                    await this.importBundleText(JSON.stringify(fallbackBundle), "overwrite");
                    itemsRestored = true;
                } catch (err) {
                    console.warn("[xiaolv-common] restoreData items array error:", err);
                    restoreFailed = true;
                    pushDiagError({ source: "小驴常用", message: `灾备恢复条目数组失败：${toErrorMessage(err)}` });
                }
            }
            if (storageManager && typeof storageManager.flush === "function") {
                await storageManager.flush();
            }
            if (library && (configRestored || itemsRestored)) {
                library.invalidateIndex();
                await library.ensureIndex(0);
            }
            this.plugin.invalidatePreviewCache?.();
            this.plugin.notifyExternalDataChange?.();
            return !restoreFailed;
        } catch (err) {
            console.error("[xiaolv-common] restoreData failed:", err);
            return false;
        }
    }
}
