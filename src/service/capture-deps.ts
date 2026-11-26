// 捕获对话框依赖构建器（CaptureDeps · S10）
import {getSelectionInfo} from "./commands";
import {findDuplicateByContent} from "../model/dedupe";
import {collectCategories, collectTags} from "../model/search";
import type {CaptureDeps} from "../ui/capture-types";
import type {NewItemInput, WriteOptions} from "./library";
import {formatAiError} from "./ai";
import type {XiaolvCommonPluginContext} from "./plugin-context";

export function createCaptureDeps(plugin: XiaolvCommonPluginContext): CaptureDeps {
    return {
        t: plugin.i18nFn(),
        getSelectionText: () => getSelectionInfo(),
        currentDocId: () => plugin.host.currentDocId(),
        readClipboardText: async () => {
            if (!navigator.clipboard?.readText) throw new Error("clipboard unavailable");
            return navigator.clipboard.readText();
        },
        createItem: async (input: NewItemInput, options?: WriteOptions) => {
            const result = await plugin.captureCoordinator.saveItem(input, undefined, options);
            if (!result.ok) return {ok: false, message: result.message};
            plugin.notify("info", plugin.i18nFn()("saved", result.data.item.title));
            plugin.notifyExternalDataChange();
            return {ok: true, message: result.data.item.title, itemId: result.data.item.id};
        },
        notify: (k, m) => plugin.notify(k, m),
        getBlockKramdown: async (blockId: string) => {
            const kd = await plugin.library.getItemKramdown({
                id: "xlc-proxy", blockId, libraryDocId: "", itemType: "blockref", title: "", alias: "",
                tags: [], category: "", summary: "", varCount: 0,
                source: {sourceDocId: "", sourceBlockId: blockId, sourceType: "block"},
                url: "", targetBlockId: blockId, createdAt: 0, updatedAt: 0, droppedFields: [],
            });
            return kd.ok ? kd.data : null;
        },
        exportDocContent: async (docId: string) => {
            const res = await plugin.library.exportDocContent(docId);
            return res.ok ? res.data : null;
        },
        aiEnabled: () => Boolean(plugin.state?.ai?.enabled),
        aiTidy: async (content: string, opts?: {signal?: AbortSignal}) => {
            try {
                const r = await plugin.ai.tidy(content, opts?.signal);
                return r ? {ok: true, ...r} : {ok: false, message: plugin.i18nFn()("aiEmpty")};
            } catch (err) {
                return {ok: false, message: formatAiError(err, plugin.i18nFn())};
            }
        },
        aiDraft: async (desc: string, opts?: {signal?: AbortSignal}) => {
            try {
                const r = await plugin.ai.draft(desc, opts?.signal);
                return {ok: true, text: r};
            } catch (err) {
                return {ok: false, message: formatAiError(err, plugin.i18nFn())};
            }
        },
        findDuplicate: async (content: string, options?: {excludeId?: string}) => {
            const idx = await plugin.library.ensureIndex();
            return findDuplicateByContent(content, idx.entries, options);
        },
        getLibraryName: async () => {
            const cfg = plugin.config;
            if (!cfg) return null;
            if (cfg.mode === "notebook") {
                const first = cfg.notebookIds[0];
                if (!first) return null;
                const nbs = await plugin.library.listNotebooks();
                return nbs.ok ? nbs.data.find((nb) => nb.id === first)?.name ?? null : null;
            }
            const docId = cfg.containerDocIds[0];
            if (!docId) return null;
            return await plugin.library.getDocPath(docId);
        },
        isConfigured: () => Boolean(plugin.config),
        onNotConfigured: () => plugin.openSetup(),
        getExistingTags: () => collectTags(plugin.library.getIndex()?.entries ?? []),
        getExistingCategories: () => collectCategories(plugin.library.getIndex()?.entries ?? []),
    };
}
