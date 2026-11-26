// 发现视图与保存规则助手（DiscoveryViewsHelper · S10）
import {DiscoveryReceipt, DiscoveryService, DiscoverySessionView} from "./discovery";
import {DiscoveryDialogController} from "../ui/discovery-dialog";
import {SavedDiscoveryView, normalizeSavedDiscoveryViews} from "../model/storage";
import {isBlockId} from "../model/item";
import {toErrorMessage} from "../model/errors";
import type {XiaolvCommonPluginContext} from "./plugin-context";

declare const __webpack_require__: unknown;
declare const require: any;

export class DiscoveryViewsHelper {
    public discoveryDialog: DiscoveryDialogController | null = null;

    constructor(private readonly plugin: XiaolvCommonPluginContext) {}

    async discoverCurrentDocument(): Promise<DiscoveryReceipt<DiscoverySessionView>> {
        return this.discoverForScope("document");
    }

    async discoverCurrentNotebook(): Promise<DiscoveryReceipt<DiscoverySessionView>> {
        return this.discoverForScope("notebook");
    }

    async discoverForScope(scope: "document" | "notebook"): Promise<DiscoveryReceipt<DiscoverySessionView>> {
        const docId = this.plugin.host?.currentDocId();
        const t = this.plugin.i18nFn();
        if (!docId) {
            const result: DiscoveryReceipt<DiscoverySessionView> = {
                ok: false,
                reason: "invalid-input",
                message: t("discoveryNoDocument"),
            };
            this.plugin.notify("error", result.message);
            return result;
        }
        const discovery = this.plugin.discovery;
        let result: DiscoveryReceipt<DiscoverySessionView>;
        try {
            if (scope === "notebook") {
                const discoverNotebook = (discovery as DiscoveryService & {
                    discoverCurrentNotebook?: (currentDocId: string) => Promise<DiscoveryReceipt<DiscoverySessionView>>;
                }).discoverCurrentNotebook;
                result = discoverNotebook
                    ? await discoverNotebook.call(discovery, docId)
                    : {ok: false, reason: "invalid-input", message: t("discoveryNotebookUnavailable")};
            } else {
                result = await discovery.discoverCurrentDocument(docId);
            }
        } catch (error) {
            const message = toErrorMessage(error);
            result = {ok: false, reason: "kernel-error", message};
        }
        if (!result.ok) {
            this.plugin.notify("error", this.discoveryFailureText(result));
            return result;
        }
        const count = result.data.candidates.length;
        const scannedDocs = (result.data as DiscoverySessionView & {scannedDocs?: number}).scannedDocs;
        this.plugin.notify("info", count > 0
            ? scope === "notebook"
                ? t("discoveryFoundNotebook", String(scannedDocs ?? 0), String(count))
                : t("discoveryFound", String(count))
            : t(scope === "notebook" ? "discoveryEmptyNotebook" : "discoveryEmpty"));
        return result;
    }

    openDiscoveryForCurrentDocument(scope: "document" | "notebook" = "document"): void {
        const t = this.plugin.i18nFn();
        if (!this.plugin.sidecarReady) {
            this.plugin.notify("info", t("sidecarLoading"));
            return;
        }
        if (!this.plugin.config) {
            this.plugin.openSetup();
            return;
        }
        const docId = this.plugin.host?.currentDocId();
        if (!docId) {
            this.plugin.notify("error", t("discoveryNoDocument"));
            return;
        }
        const discovery = this.plugin.discovery;
        if (scope === "notebook" && !(discovery as DiscoveryService & {discoverCurrentNotebook?: unknown}).discoverCurrentNotebook) {
            this.plugin.notify("info", t("discoveryNotebookUnavailable"));
            return;
        }
        void this.plugin.library.getDocPath(docId).then((sourcePath: string) => {
            if (this.plugin.unloading) return;
            this.plugin.showDiscoveryDialog(docId, scope, sourcePath);
        }).catch(() => {
            if (this.plugin.unloading) return;
            this.plugin.showDiscoveryDialog(docId, scope);
        });
    }

    openDiscoveryForTreeRoot(target: {docId: string; path: string}): void {
        const t = this.plugin.i18nFn();
        if (!this.plugin.sidecarReady) {
            this.plugin.notify("info", t("sidecarLoading"));
            return;
        }
        if (!this.plugin.config) {
            this.plugin.openSetup();
            return;
        }
        void this.plugin.library.getDocPath(target.docId).then((sourcePath: string) => {
            if (this.plugin.unloading) return;
            this.plugin.showDiscoveryDialog(target.docId, "tree", sourcePath || target.path, target.docId);
        }).catch(() => {
            if (this.plugin.unloading) return;
            this.plugin.showDiscoveryDialog(target.docId, "tree", target.path, target.docId);
        });
    }

    showDiscoveryDialog(
        docId: string,
        scope: "document" | "notebook" | "tree",
        sourcePath?: string,
        initialTreeRootId?: string,
        preset?: any,
    ): void {
        this.plugin.showDiscoveryDialog(docId, scope, sourcePath, initialTreeRootId, preset);
    }

    saveDiscoveryView(view: Omit<SavedDiscoveryView, "id">): boolean {
        const t = this.plugin.i18nFn();
        const [normalized] = normalizeSavedDiscoveryViews([{
            id: `xlc-view-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`,
            ...view,
        }]);
        if (!normalized || (normalized.scope === "notebook" && !isBlockId(normalized.targetNotebookId))) {
            this.plugin.notify("error", t("discoverySaveViewInvalid"));
            return false;
        }
        const current = this.plugin.state.search.savedDiscoveryViews ?? [];
        const sameRule = current.find((entry: any) => entry.name === normalized.name
            && entry.tag === normalized.tag
            && entry.scope === normalized.scope
            && entry.targetDocId === normalized.targetDocId
            && entry.targetNotebookId === normalized.targetNotebookId);
        const id = sameRule?.id ?? normalized.id;
        const next = normalizeSavedDiscoveryViews([
            {...normalized, id},
            ...current.filter((entry: any) => entry.id !== sameRule?.id),
        ]);
        this.plugin.state.search.savedDiscoveryViews = next;
        this.plugin.persistSoon();
        this.plugin.notify("info", t("discoverySaveViewDone", normalized.name));
        return true;
    }

    openSavedDiscoveryView(view: SavedDiscoveryView): void {
        const t = this.plugin.i18nFn();
        if (!this.plugin.sidecarReady) {
            this.plugin.notify("info", t("sidecarLoading"));
            return;
        }
        if (!this.plugin.config) {
            this.plugin.openSetup();
            return;
        }
        if (view.scope === "selected-notebook" || view.scope === "all-notebooks") {
            this.plugin.notify("info", t("discoveryScopeUnavailable"));
            return;
        }
        const discovery = this.plugin.discovery;
        const library = this.plugin.library;
        if (view.scope === "notebook") {
            if (!isBlockId(view.targetNotebookId)) {
                this.plugin.notify("error", t("discoverySavedNotebookUnfixed"));
                return;
            }
            if (!discovery.discoverNotebook) {
                this.plugin.notify("info", t("discoveryNotebookUnavailable"));
                return;
            }
        }
        if (view.scope === "tree" && (!discovery.discoverTree || !library.searchDocs)) {
            this.plugin.notify("info", t("discoveryScopeUnavailable"));
            return;
        }
        if (view.scope !== "notebook" && !isBlockId(view.targetDocId)) {
            this.plugin.notify("error", t("discoverySourceUnavailable"));
            return;
        }
        this.plugin.showDiscoveryDialog(view.scope === "notebook" ? "" : view.targetDocId, view.scope, view.pathLabel || undefined, view.scope === "tree" ? view.targetDocId : undefined, {
            initialTag: view.tag,
            ...(view.scope === "notebook" ? {initialNotebookId: view.targetNotebookId} : {}),
            autoSelectFiltered: true,
            referenceOnly: true,
            defaultCategory: view.defaultCategory,
        });
    }

    deleteSavedDiscoveryView(id: string): void {
        const current = this.plugin.state.search.savedDiscoveryViews ?? [];
        const next = current.filter((view: any) => view.id !== id);
        if (next.length === current.length) return;
        this.plugin.state.search.savedDiscoveryViews = next;
        this.plugin.persistSoon();
    }

    discoveryFailureText(result: Extract<DiscoveryReceipt<unknown>, {ok: false}>): string {
        const t = this.plugin.i18nFn();
        switch (result.reason) {
            case "not-configured": return t("discoveryNotConfigured");
            case "library-document": return t("discoveryLibraryDocument");
            case "library-boundary-unknown": return t("discoveryBoundaryUnknown");
            case "invalid-response": return t("discoveryInvalidResponse");
            case "timeout": return t("timeout");
            default: return t("discoveryFailed");
        }
    }
}
