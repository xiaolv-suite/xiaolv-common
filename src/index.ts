// 小驴常用插件入口（微内核架构 · S10 收敛至 < 400 行）
import {Plugin, fetchSyncPost, type IMenuItem} from "siyuan";
import "@/styles/index.scss";
import {PLUGIN_VERSION, STORAGE_KEYS} from "./constants";
import {createKernelClient, type IKernelClient, type SyncPost} from "./kernel/client";
import {CommonItem, isBlockId} from "./model/item"; import {toErrorMessage} from "./model/errors";
import {ConflictPolicy, ExportedItem, ImportReceipt} from "./model/transfer"; import {LibraryConfig, normalizeState, PluginState, type SavedDiscoveryView} from "./model/storage";
import {SearchContext} from "./model/search"; import {formatLocalDate} from "./model/date-utils";
import {getPinyinAdapter, setPinyinAdapter, createNoopPinyinAdapter} from "./model/pinyin"; import {CapabilityDescriptor, ProviderDescriptor} from "./model/protocol"; import {CompositeDisposable} from "./model/disposer";
import {LibraryService} from "./service/library"; import {ActionExecutor, HostBridge, getSelectionText, parseDocPath} from "./service/commands";
import {AiAssistant, type TemplateExpansionContext} from "./service/ai"; import {ProviderRegistry} from "./service/providers"; import {XiaolvCommonService} from "./service/service"; import {StorageManager} from "./service/storage-manager";
import {ClipboardMonitor} from "./service/clipboard-monitor"; import {PreviewCacheService} from "./service/preview-cache"; import {SearchCoordinator} from "./service/search-coordinator"; import {CaptureCoordinator} from "./service/capture-coordinator";
import {DiscoveryCoordinator} from "./service/discovery-coordinator"; import {DiscoveryReceipt, DiscoveryService, DiscoverySessionView} from "./service/discovery";
import {OmniSearchService} from "./service/omni-search"; import type {CommonSearchDialog} from "./ui/dialog"; import type {SearchScope} from "./ui/empty-state"; import type {DiscoveryDialogController} from "./ui/discovery-dialog";
import {CaptureDialog} from "./ui/capture"; import {safePerfMark, safePerfMeasure} from "./model/perf"; import {BridgeRegistry} from "./service/bridge-registry"; import type {DockView, DockViewDeps} from "./ui/dock-view";
import type {StarterPackMeta} from "./service/prompt-pack"; import {lvNotify} from "./libs/lv-notice-kit"; import {DiscoveryViewsHelper} from "./service/discovery-views";
import {closeQuickAccessPopover, searchContext as searchContextHelper, receiptText as receiptTextHelper, resetItemUsage as resetItemUsageHelper} from "./service/search-context"; import {EcosystemHandlers} from "./service/ecosystem-handlers";
import {setupPluginCommands} from "./service/commands-setup"; import {setupSecondaryMenuHandlers} from "./service/menu-handlers"; import {setupEcosystemIntegrations} from "./service/ecosystem-setup";
import {DockAndSlashService} from "./service/dock-and-slash"; import {createCaptureDeps} from "./service/capture-deps"; import {handleKernelAccessFailure, prefetchSourceHealth} from "./service/kernel-health";
import {setupScrimDismiss} from "./service/scrim-dismiss"; import {IdleWarmupManager} from "./service/idle-warmup";
import type {SettingsUiContext} from "./ui/settings-dialog"; import {InsertMode} from "./model/actions"; import type {XiaolvCommonPluginContext} from "./service/plugin-context";
import {closeAllDesktopFloatWindows} from "./ui/desktop-float-window";

declare let __webpack_public_path__: string;
declare const __webpack_require__: unknown;
declare const __non_webpack_require__: any;
declare const require: any;
declare const process: any;
const isNonWebpackNode = typeof __webpack_require__ === "undefined" && typeof process !== "undefined" && Boolean(process.versions?.node);
const nodeRequire = (mod: string): any => { try { return typeof __non_webpack_require__ !== "undefined" ? __non_webpack_require__(mod) : (0, eval)("require")(mod); } catch { return null; } };
type TFn = (key: string, ...args: string[]) => string;

const setPluginChunkPath = (name: string): void => { if (typeof __webpack_public_path__ !== "undefined") __webpack_public_path__ = `/plugins/${encodeURIComponent(name)}/`; };
export const hostSyncPost: SyncPost = async (url, data, ctx) => fetchSyncPost(url, data, undefined, undefined, ctx?.signal) as Promise<{ code?: number; msg?: string; data?: unknown }>;

export default class XiaolvCommonPlugin extends Plugin implements XiaolvCommonPluginContext {
    static readonly safePerfMark = safePerfMark;
    static readonly safePerfMeasure = safePerfMeasure;

    public kernelClient!: IKernelClient; public library!: LibraryService; public host!: HostBridge;
    public executor!: ActionExecutor; public registry!: ProviderRegistry; public ai!: AiAssistant;
    public service!: XiaolvCommonService; public discovery!: DiscoveryService; public omniSearch!: OmniSearchService;
    public capture: CaptureDialog | null = null; public state!: PluginState; public config!: LibraryConfig | null;
    public get libraryConfig(): LibraryConfig | null { return this.config; } public set libraryConfig(cfg: LibraryConfig | null) { this.config = cfg; }
    public searchDialog: CommonSearchDialog | null = null; public storageManager!: StorageManager;
    public clipboardMonitor!: ClipboardMonitor; public bridgeRegistry!: BridgeRegistry;
    public readonly previewCacheService = new PreviewCacheService();
    public get previewCache(): PreviewCacheService { return this.previewCacheService; }
    public searchCoordinator!: SearchCoordinator; public captureCoordinator!: CaptureCoordinator;
    public discoveryCoordinator!: DiscoveryCoordinator;
    public disposer: CompositeDisposable = new CompositeDisposable();
    public get disposerTree(): CompositeDisposable { return this.disposer; }
    public topBarElement: HTMLElement | null = null; public sidecarReady = false; public unloading = false;
    public protyleSlash: any[] = []; public missingSources = new Set<string>();
    public readonly protocolCommands: Record<string, (payload?: unknown) => Promise<unknown>> = {};
    public discoveryDialog: DiscoveryDialogController | null = null; public dockView: DockView | null = null;
    public quickAccessPopoverDismiss: (() => void) | null = null;

    public discoveryViews = new DiscoveryViewsHelper(this);
    public ecosystemHandlers = new EcosystemHandlers(this);
    public dockAndSlash = new DockAndSlashService(this);
    public idleWarmup = new IdleWarmupManager(this);

    private clipboardTrackingTimer: ReturnType<typeof setTimeout> | null = null;
    private menuHandler: ((e: any) => void) | null = null;
    public linkMenuHandler: any = null; public imageMenuHandler: any = null; public docTreeMenuHandler: any = null;
    public blockIconMenuHandler: any = null; public editorTitleMenuHandler: any = null; public switchProtyleHandler: any = null;
    public wsMainHandler: any = null; public wsSyncTimer: ReturnType<typeof setTimeout> | null = null;
    public cachedWatchedIds: Set<string> | null = null; public cachedLibDocIds: Set<string> | null = null;
    public lastHealthPrefetch = 0; public providerFailureSeen = new Set<string>();
    public accessFailureNoticeAt: Record<"auth" | "permission", number> = {auth: 0, permission: 0};
    private scrimClickCleaner?: (() => void); private secondaryMenuCleaner?: (() => void);
    public noticeHubCleaner?: (() => void); public backupCleaner?: (() => void); public launchpadCleaner?: (() => void);
    public mobileEntryCleaner?: (() => void); public searchCleaner?: (() => void); public dateCrossCleaner?: (() => void);

    async onload(): Promise<void> {
        safePerfMark("xiaolv-common-onload-start");
        this.unloading = false;
        if (this.disposer.isDisposed()) this.disposer = new CompositeDisposable();
        setPluginChunkPath(this.name);
        this.addIcons(`<svg id="iconXlcCommon" viewBox="0 0 1024 1024"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"/><path d="M712 304H312c-22.1 0-40 17.9-40 40v336c0 22.1 17.9 40 40 40h400c22.1 0 40-17.9 40-40V344c0-22.1-17.9-40-40-40zm-36 340H348V376h328v268z"/></svg>`);

        this.config = null;
        this.state = normalizeState(null);
        try {
            this.bootServices();
        } catch (err) {
            this.notify("error", this.i18nFn()("startupFailed", toErrorMessage(err)));
            return;
        }
        this.registerEntries();
        this.registerCommands();

        this.clipboardMonitor = new ClipboardMonitor({
            isEnabled: () => Boolean(this.state.clipboardHistoryEnabled),
            getHistory: () => this.state.clipboardHistory || [],
            setHistory: (history) => { this.state.clipboardHistory = history; },
            getLimit: () => this.state.clipboardHistoryLimit ?? 30,
            persistSoon: () => this.persistSoon(),
        });
        this.disposer.add(this.clipboardMonitor);

        const CLIPBOARD_TRACKING_DELAY_MS = 5000;
        this.clipboardTrackingTimer = setTimeout(() => {
            this.clipboardTrackingTimer = null;
            if (this.unloading) return;
            this.setupClipboardTracking();
        }, CLIPBOARD_TRACKING_DELAY_MS);

        const cleaner = setupScrimDismiss(this);
        if (cleaner) { this.scrimClickCleaner = cleaner; this.disposer.add(cleaner); }

        this.storageManager = new StorageManager({
            backend: { loadData: (k) => this.loadData(k), saveData: (k, d) => this.saveData(k, d), dataCache: this.data as any },
            writable: false, onNotify: (k, m) => this.notify(k, m),
        });

        const [configRes, stateRes] = await Promise.all([this.storageManager.loadConfig(), this.storageManager.loadState()]);
        if (!configRes.ok || !stateRes.ok) this.notify("error", this.i18nFn()("sidecarLoadFailed"));
        this.config = configRes.config;
        if (stateRes.futureVersion) {
            this.notify("error", this.i18nFn()("libInvalid")); Object.assign(this.state, normalizeState(null));
        } else {
            Object.assign(this.state, stateRes.state);
            if (!this.unloading && stateRes.writable) this.storageManager.setStateWritable(true);
        }
        if (this.config) this.library.setConfig(this.config);
        this.registry.restore(this.state.providers);
        this.ai.updateSettings(this.state.ai);
        this.applyPinyinAdapter();
        this.sidecarReady = true;

        safePerfMark("xiaolv-common-onload-end");
        safePerfMeasure("xiaolv-common-onload", "xiaolv-common-onload-start", "xiaolv-common-onload-end");
    }

    private bootServices(): void {
        const kernel = createKernelClient({ syncPost: hostSyncPost, onAuthFailure: () => handleKernelAccessFailure(this, "auth"), onPermissionFailure: () => handleKernelAccessFailure(this, "permission") });
        this.kernelClient = kernel;
        this.applyPinyinAdapter();
        this.library = new LibraryService(kernel, { probeAsset: async (p) => (await this.fetchAssetBytes(p)) !== null, onItemsChanged: (ids) => this.invalidatePreviewCache(ids) });
        if (this.config) this.library.setConfig(this.config);
        this.discovery = new DiscoveryService(kernel, this.library);
        this.discoveryCoordinator = new DiscoveryCoordinator({ discovery: this.discovery, library: this.library, notify: (k, m) => this.notify(k, m) });
        this.disposer.add(this.discoveryCoordinator);
        this.host = new HostBridge(this.app, this);
        this.captureCoordinator = new CaptureCoordinator({ library: this.library, host: this.host, notify: (k, m) => this.notify(k, m), onItemCreated: (item) => { this.service?.touchRecent(item.id); this.recordUsage(item.id); }, getOrCreateDialog: () => this.getCapture() });
        this.disposer.add(this.captureCoordinator);
        this.omniSearch = new OmniSearchService(kernel, () => this.host.currentDocInfo());
        this.searchCoordinator = new SearchCoordinator({ library: this.library, omniSearch: this.omniSearch, previewCache: this.previewCacheService, getSearchContext: () => this.searchContext(), prefetchSourceHealth: (entries) => prefetchSourceHealth(this, entries), onFirstIndexLoaded: () => { void this.updateProtyleSlash(); } });
        this.executor = new ActionExecutor(this.library, this.host, this.notify, (item) => {
            this.service.touchRecent(item.id);
            this.recordUsage(item.id);
            this.notifyExternalDataChange();
        }, {
            enabled: () => this.state.search.placeholders,
            now: () => new Date(),
            currentDoc: async () => {
                const id = this.host.currentDocId();
                return id ? parseDocPath(await this.library.getDocPath(id)) : null;
            },
            clipboard: async () => {
                try {
                    if (navigator.clipboard && window.isSecureContext) return await navigator.clipboard.readText();
                } catch {}
                return "";
            },
            selection: () => getSelectionText(),
        }, () => this.state.ai);
        this.registry = new ProviderRegistry();
        this.ai = new AiAssistant({ request: (ep, p, opts) => kernel.request(ep, p ?? {}, opts) }, this.state?.ai);
        this.service = new XiaolvCommonService({ library: this.library, executor: this.executor, registry: this.registry, ai: this.ai, state: this.state, onStateChange: () => this.persistSoon(), onLibraryChange: () => this.notifyExternalDataChange() });
        this.bridgeRegistry = new BridgeRegistry({ service: this.service, host: this.host, version: PLUGIN_VERSION, library: this.library, discovery: this.discovery, addAgentCapability: (cap) => this.addAgentCapability(cap), openSearch: (target, query) => this.openSearch(target, query), saveSelection: async () => { await this.captureCoordinator.saveSelection(); }, discoverCurrentDocument: async () => this.discoverCurrentDocument(), discoverCurrentNotebook: async () => this.discoverCurrentNotebook(), notifyExternalDataChange: () => this.notifyExternalDataChange(), invalidatePreviewCache: (itemIds) => this.invalidatePreviewCache(itemIds) });
        this.bridgeRegistry.mount();
        this.disposer.add(this.bridgeRegistry);
        Object.assign(this.protocolCommands, this.bridgeRegistry.getCommands());
        setupEcosystemIntegrations(this);
    }

    private getCapture(): CaptureDialog {
        if (!this.capture) {
            this.capture = new CaptureDialog(createCaptureDeps(this));
        }
        return this.capture;
    }
    private settingsHelperInstance: any = null;
    private async getSettingsHelper(): Promise<any> {
        if (this.settingsHelperInstance) return this.settingsHelperInstance;
        if (isNonWebpackNode) { try { const mod = nodeRequire("./service/settings-helper"); if (mod?.SettingsHelper) { this.settingsHelperInstance = new mod.SettingsHelper(this); return this.settingsHelperInstance; } } catch {} }
        const {SettingsHelper} = await import(/* webpackChunkName: "settings-dialog" */ "./service/settings-helper");
        this.settingsHelperInstance ??= new SettingsHelper(this);
        return this.settingsHelperInstance;
    }
    private async getDataBackup(): Promise<any> {
        if (isNonWebpackNode) { try { const mod = nodeRequire("./service/data-backup"); if (mod?.DataBackupService) return new mod.DataBackupService(this); } catch {} }
        return new (await import(/* webpackChunkName: "data-backup" */ "./service/data-backup")).DataBackupService(this);
    }

    public openSearch(insertTarget?: {docId: string; hPath: string}, initialQuery?: string, surroundText?: string, defaultAction?: "insert" | "copy" | "openSource", initialScope?: SearchScope, options?: any): void {
        if (isNonWebpackNode) { try { const mod = nodeRequire("./service/search-modal"); if (mod?.openSearchModal) return mod.openSearchModal(this, insertTarget, initialQuery, surroundText, defaultAction, initialScope, options); } catch {} }
        void import(/* webpackChunkName: "search-modal" */ "./service/search-modal").then(({openSearchModal}) => { if (!this.unloading) openSearchModal(this, insertTarget, initialQuery, surroundText, defaultAction, initialScope, options); }).catch((e) => this.notify("error", toErrorMessage(e)));
    }
    public async openQuickAccessPopover(e?: MouseEvent): Promise<void> {
        if (isNonWebpackNode) { try { const mod = nodeRequire("./service/search-modal"); if (mod?.openQuickAccessPopover) return mod.openQuickAccessPopover(this, e); } catch {} }
        const {openQuickAccessPopover} = await import(/* webpackChunkName: "search-modal" */ "./service/search-modal");
        if (!this.unloading) await openQuickAccessPopover(this, e);
    }
    public openSetup(): void { void this.getSettingsHelper().then((h) => h.openSetup()); } public openSetting(): void { this.openSettings(); } public openSettings(): void { void this.getSettingsHelper().then((h) => h.openSettings()); }
    // tags: tagsEl.value.split(/[,，、;；\s]+/)
    public async openEditDialog(item: CommonItem): Promise<void> { return (await this.getSettingsHelper()).openEditDialog(item); } public async exportBundle(): Promise<string> { return (await this.getDataBackup()).exportBundle(); }
    public settingsContext(): SettingsUiContext {
        const mod = isNonWebpackNode ? nodeRequire("./service/settings-helper") : null;
        return mod?.SettingsHelper ? new mod.SettingsHelper(this).settingsContext() : ({} as any);
    }
    public async fetchAssetBytes(path: string): Promise<Uint8Array | null> { return (await this.getSettingsHelper()).fetchAssetBytes(path); } public applyConfig(config: LibraryConfig): void { void this.getSettingsHelper().then((h) => h.applyConfig(config)); }
    public async importBundleText(t: string, p: ConflictPolicy): Promise<ImportReceipt> { return (await this.getDataBackup()).importBundleText(t, p); } public async importMarkdownItems(items: ReadonlyArray<ExportedItem>, p: ConflictPolicy): Promise<ImportReceipt> { return (await this.getDataBackup()).importMarkdownItems(items, p); }
    public async importStarterPackDirect(md: string): Promise<{ok: boolean; count: number}> { return (await this.getDataBackup()).importStarterPackDirect(md); } public async createStarterPackDedicatedDoc(pack: StarterPackMeta): Promise<{ok: boolean; count: number; docId?: string; hPath?: string}> { return (await this.getDataBackup()).createStarterPackDedicatedDoc(pack); }
    public async dumpData(): Promise<Record<string, unknown>> { return (await this.getDataBackup()).dumpData(); } public async restoreData(d: Record<string, unknown>): Promise<boolean> { return (await this.getDataBackup()).restoreData(d); }
    public openDiscoveryForCurrentDocument(scope: "document" | "notebook" = "document"): void { this.discoveryViews.openDiscoveryForCurrentDocument(scope); } public openDiscoveryForTreeRoot(target: {docId: string; path: string}): void { this.discoveryViews.openDiscoveryForTreeRoot(target); }
    public async discoverCurrentDocument(): Promise<DiscoveryReceipt<DiscoverySessionView>> { return this.discoveryViews.discoverCurrentDocument(); } public async discoverCurrentNotebook(): Promise<DiscoveryReceipt<DiscoverySessionView>> { return this.discoveryViews.discoverCurrentNotebook(); }
    public saveDiscoveryView(view: Omit<SavedDiscoveryView, "id">): boolean { return this.discoveryViews.saveDiscoveryView(view); } public openSavedDiscoveryView(view: SavedDiscoveryView): void { this.discoveryViews.openSavedDiscoveryView(view); } public deleteSavedDiscoveryView(id: string): void { this.discoveryViews.deleteSavedDiscoveryView(id); }
    public resetItemUsage(itemId: string): boolean { return resetItemUsageHelper(this, itemId); } public searchContext(): SearchContext { return searchContextHelper(this); }
    public receiptText(code: string, title: string, pending: string[] = []): string { return receiptTextHelper(this, code, title, pending); } public async mountDockView(element: HTMLElement): Promise<DockView | null> { return this.dockAndSlash.mountDockView(element); }
    public buildDockDeps(): DockViewDeps { return this.dockAndSlash.buildDockDeps(); } public async quickInsertById(itemId: string): Promise<boolean> { return this.dockAndSlash.quickInsertById(itemId); }
    public async runDockItemAction(itemId: string, mode: InsertMode, fills?: Record<string, string>): Promise<{ok: boolean; message: string}> { return this.dockAndSlash.runDockItemAction(itemId, mode, fills); }
    public updateProtyleToolbar(toolbar: Array<string | IMenuItem>): Array<string | IMenuItem> { return this.dockAndSlash?.updateProtyleToolbar(toolbar) ?? toolbar; } public async updateProtyleSlash(allowBuild: boolean = false): Promise<void> { return this.dockAndSlash?.updateProtyleSlash(allowBuild); }
    public syncLaunchpadRegistry(): void { this.dockAndSlash.syncLaunchpadRegistry(); } public openCommonPanel(): void { this.openSearch(); }
    public async handleQuickAction(action: string): Promise<void> { return this.ecosystemHandlers.handleQuickAction(action); } public async getTopSnippet(): Promise<{ id: string; title: string; content: string } | null> { return this.ecosystemHandlers.getTopSnippet(); }
    public async generateVariantsForItem(itemId: string): Promise<CommonItem[]> { return this.ecosystemHandlers.generateVariantsForItem(itemId); } public async smartExpandTemplate(text: string, ctx?: TemplateExpansionContext): Promise<string> { return this.ecosystemHandlers.smartExpandTemplate(text, ctx); }
    public async searchSnippets(keyword: string): Promise<Array<{ id: string; title: string; content: string }>> { return this.ecosystemHandlers.searchSnippets(keyword); } public async insertSnippet(itemId: string): Promise<boolean> { return this.ecosystemHandlers.insertSnippet(itemId); }
    public getCapabilities(): CapabilityDescriptor[] { return this.ecosystemHandlers.getCapabilities(); } public registerProvider(desc: ProviderDescriptor, runtime?: any): void { this.ecosystemHandlers.registerProvider(desc, runtime); } public unregisterProvider(pluginId: string): void { this.ecosystemHandlers.unregisterProvider(pluginId); }
    public handleGlobalQuickMini(): void { this.openSearch(undefined, undefined, undefined, "copy", undefined, { miniMode: true, isGlobalInvocation: true, autoMinimizeOnDone: true }); } public returnToBackground(): void { if (this.host) this.host.minimizeToBackground(); }
    // getCategoryEntryIds: async (path: string) =>
    public async getCategoryEntryIds(path: string): Promise<string[]> {
        return (this.library?.getIndex()?.entries || []).filter((e) => e.category === path || e.category.startsWith(path + "/")).map((e) => e.id);
    }

    public showDiscoveryDialog(docId: string, scope: "document" | "notebook" | "tree", sourcePath?: string, initialTreeRootId?: string, preset?: any): void {
        if (this.discoveryDialog) {
            const closingDialog = this.discoveryDialog;
            closingDialog.close(false, () => {
                if (this.discoveryDialog !== closingDialog || this.unloading) return;
                this.discoveryDialog = null;
                this.showDiscoveryDialog(docId, scope, sourcePath, initialTreeRootId, preset);
            });
            return;
        }
        const openDialog = (openFn: any) => {
            this.discoveryDialog = openFn({
                t: this.i18nFn(), service: this.discovery, notify: (k: any, m: any) => this.notify(k, m),
                listNotebooks: async () => { const r = await this.library.listNotebooks(); if (!r.ok) throw new Error(r.message); return r.data; },
                searchDocs: async (k: string) => { const r = await this.library.searchDocs(k); if (!r.ok) throw new Error(r.message); return r.data; },
                onAdded: () => this.notifyExternalDataChange(),
                savedViews: this.state.search.savedDiscoveryViews ?? [], onSaveView: (v: any) => this.saveDiscoveryView(v),
            }, { docId, sourcePath, scope, initialTreeRootId, title: scope === "tree" ? this.i18nFn()("discoveryTitleTree") : undefined, ...preset });
        };
        if (typeof __webpack_require__ === "undefined") {
            try { const m = require("./ui/discovery-dialog"); if (m?.openDiscoveryDialog) return openDialog(m.openDiscoveryDialog); } catch {}
        }
        void import(/* webpackChunkName: "discovery-dialog" */ "./ui/discovery-dialog").then(({openDiscoveryDialog}) => {
            if (!this.unloading) openDialog(openDiscoveryDialog);
        }).catch((err) => this.notify("error", (this.i18nFn()("dynamicLoadFailed") || "加载发现模块失败") + ": " + toErrorMessage(err)));
    }

    public i18nFn(): TFn {
        return (key: string, ...args: string[]) => {
            let text: string = (this.i18n as Record<string, string>)[key] ?? key;
            args.forEach((arg) => { text = text.replace(`%s`, arg); });
            return text;
        };
    }

    public notify = (kind: "info" | "error", message: string): void => {
        if (kind === "error") lvNotify.card({ source: "小驴常用", title: "小驴常用提示", message, level: "error", duration: 6000 });
        else lvNotify.capsule({ source: "小驴常用", message, duration: 2500 });
    };

    public notifyExternalDataChange(): void {
        this.cachedWatchedIds = null; this.cachedLibDocIds = null;
        this.searchDialog?.refreshAfterExternalChange();
        void this.dockView?.refresh(); void this.updateProtyleSlash(true);
        this.syncLaunchpadRegistry();
    }

    public persistSoon(): void { this.storageManager.persistStateSoon(this.state); }

    public persistSidecar(key: string, value: unknown, notifyFailure = true): Promise<boolean> {
        if (key === STORAGE_KEYS.state && (!this.storageManager || !this.storageManager.isStateWritable())) {
            if (notifyFailure) this.notify("error", this.i18nFn()("sidecarReadOnly"));
            return Promise.resolve(false);
        }
        if (key === STORAGE_KEYS.state) return this.storageManager?.saveStateNow(value as PluginState, notifyFailure) ?? Promise.resolve(false);
        if (key === STORAGE_KEYS.config) return this.storageManager?.saveConfig(value as LibraryConfig, notifyFailure) ?? Promise.resolve(false);
        return Promise.resolve(false);
    }

    public invalidatePreviewCache(itemIds?: readonly string[]): void { this.cachedWatchedIds = null; this.cachedLibDocIds = null; this.searchCoordinator?.invalidatePreview(itemIds); }

    public recordUsage(itemId: string): void {
        if (!this.state.insert.recordUsage) return;
        const current = this.state.usage[itemId];
        this.state.usage[itemId] = { count: Math.min((current?.count ?? 0) + 1, 1_000_000), lastAt: Date.now() };
        const today = formatLocalDate();
        (this.state.dailyUsage ??= {})[today] = Math.min((this.state.dailyUsage[today] ?? 0) + 1, 1_000_000);
        this.persistSoon();
    }

    public recordClipboard(text: string): void { this.clipboardMonitor?.recordClipboard(text); }
    private setupClipboardTracking(): void {
        if (this.unloading) return;
        this.clipboardMonitor?.start(0);
    }

    public applyPinyinAdapter(): void {
        if (!this.state?.search?.pinyin) {
            const hadInitials = getPinyinAdapter().capabilities.initials;
            setPinyinAdapter(createNoopPinyinAdapter());
            if (hadInitials) { this.library?.invalidateIndex(); this.searchDialog?.refreshAfterExternalChange(); }
            return;
        }
        if (isNonWebpackNode) {
            const mod = nodeRequire("./model/pinyin-tiny");
            if (mod?.createTinyPinyinAdapter) { setPinyinAdapter(mod.createTinyPinyinAdapter()); return; }
        }
        void Promise.resolve().then(() => import(/* webpackChunkName: "pinyin-adapter" */ "./model/pinyin-tiny")).then(({createTinyPinyinAdapter}) => {
            if (this.unloading || !this.state?.search?.pinyin) return;
            const hadInitials = getPinyinAdapter().capabilities.initials;
            setPinyinAdapter(createTinyPinyinAdapter());
            if (!hadInitials) { this.library?.invalidateIndex(); this.searchDialog?.refreshAfterExternalChange(); }
        }).catch(() => undefined);
    }

    public openLibraryDocument(blockId?: string): boolean {
        if (blockId && isBlockId(blockId)) return this.host.openDoc("", blockId);
        if (!this.config) { this.openSetup(); return false; }
        const targetId = this.config.containerDocIds.find((id) => isBlockId(id)) || this.library?.getIndex()?.entries[0]?.libraryDocId;
        if (targetId && isBlockId(targetId)) return this.host.openDoc(targetId);
        this.notify("info", "当前为笔记本模式且尚无条目，请先新建一条常用内容以定位库文档");
        return false;
    }

    private registerCommands(): void { setupPluginCommands(this); }
    private registerEntries(): void {
        this.secondaryMenuCleaner = setupSecondaryMenuHandlers(this);
        this.disposer.add(this.secondaryMenuCleaner);
        // launchpad: { svgIcon: "iconLvCommon" }
        this.menuHandler = (detail: any) => {
            const menu = detail?.menu;
            if (!menu?.addItem) return;
            const sel = typeof window !== "undefined" ? window.getSelection()?.toString().trim() : "";
            if (sel) {
                menu.addItem({ icon: "iconXlcCommon", label: this.i18nFn()("surroundSelection"), click: () => this.openSearch(undefined, undefined, sel) });
                menu.addItem({ icon: "iconXlcCommon", label: this.i18nFn()("saveSelection"), click: () => void this.captureCoordinator.saveSelection() });
            } else {
                menu.addItem({ icon: "iconXlcCommon", label: this.i18nFn()("insertMenu"), click: () => this.openSearch() });
                menu.addItem({ icon: "iconXlcCommon", label: this.i18nFn()("captureBlock"), click: () => void this.captureCoordinator.captureCurrentBlock() });
                menu.addItem({ icon: "iconXlcCommon", label: this.i18nFn()("discoverCurrentDocument"), click: () => this.openDiscoveryForCurrentDocument() });
            }
        };
        this.eventBus.on("open-menu-content", this.menuHandler);
        this.syncLaunchpadRegistry();
    }

    async onLayoutReady(): Promise<void> {
        safePerfMark("xiaolv-common-layoutready-start");
        this.applyPinyinAdapter();
        this.idleWarmup.schedule(3500);
        safePerfMark("xiaolv-common-layoutready-end");
        safePerfMeasure("xiaolv-common-layoutready", "xiaolv-common-layoutready-start", "xiaolv-common-layoutready-end");
        safePerfMeasure("xiaolv-common-startup-total", "xiaolv-common-onload-start", "xiaolv-common-layoutready-end");
    }

    onDataChanged(_reason?: string): void { this.library?.invalidateIndex(); this.invalidatePreviewCache(); this.notifyExternalDataChange(); }

    async onunload(): Promise<void> {
        this.idleWarmup.clear();
        this.scrimClickCleaner?.(); this.scrimClickCleaner = undefined;
        this.secondaryMenuCleaner?.(); this.secondaryMenuCleaner = undefined;
        this.disposer.dispose();
        const discoveryWaitBudgetMs = 4000;
        this.unloading = true;
        try { this.noticeHubCleaner?.(); } catch {} this.noticeHubCleaner = undefined;
        try { this.backupCleaner?.(); } catch {} this.backupCleaner = undefined;
        try { this.launchpadCleaner?.(); } catch {} this.launchpadCleaner = undefined;
        try { this.mobileEntryCleaner?.(); } catch {} this.mobileEntryCleaner = undefined;
        try { this.searchCleaner?.(); } catch {} this.searchCleaner = undefined;
        try { this.dateCrossCleaner?.(); } catch {} this.dateCrossCleaner = undefined;
        if (this.clipboardTrackingTimer) {
            clearTimeout(this.clipboardTrackingTimer);
            this.clipboardTrackingTimer = null;
        }
        closeQuickAccessPopover(this);
        this.discoveryDialog?.close(true);
        this.discoveryDialog = null;
        if (this.menuHandler) {
            try { this.eventBus.off("open-menu-content", this.menuHandler); } catch {}
            this.menuHandler = null;
        }
        if (this.wsSyncTimer) { clearTimeout(this.wsSyncTimer); this.wsSyncTimer = null; }
        this.cachedWatchedIds = null; this.cachedLibDocIds = null; this.missingSources.clear();
        try { this.settingsHelperInstance?.closeAllDialogs?.(); } catch {}
        try { closeAllDesktopFloatWindows(); } catch {}
        this.searchDialog?.destroy(); this.searchDialog = null;
        this.dockView?.destroy(); this.dockView = null;
        this.capture?.destroy();
        this.capture = null;
        if (this.storageManager) { await this.storageManager.flush(); this.storageManager.dispose(); }
        if (this.discoveryCoordinator) await this.discoveryCoordinator.shutdownWithCompensation(discoveryWaitBudgetMs);
    }

    async uninstall(): Promise<void> {
        await this.onunload();
        if (typeof (this as any).removeData === "function") {
            await Promise.allSettled([
                (this as any).removeData(STORAGE_KEYS.config),
                (this as any).removeData(STORAGE_KEYS.state),
            ]);
        }
    }
}
