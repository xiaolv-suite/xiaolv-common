// 插件宿主上下文强类型契约（消除服务层 plugin: any 逃逸 · 0 循环依赖）
import type {ICommand, IPluginDockTab, Custom, MobileCustom, EventBus} from "siyuan";
import type {IKernelClient} from "../kernel/client";
import type {CommonItem} from "../model/item";
import type {ConflictPolicy, ExportedItem, ImportReceipt} from "../model/transfer";
import type {LibraryConfig, PluginState, SavedDiscoveryView} from "../model/storage";
import type {SearchContext} from "../model/search";
import type {CompositeDisposable} from "../model/disposer";
import type {InsertMode} from "../model/actions";
import type {LibraryService} from "./library";
import type {ActionExecutor, HostBridge} from "./commands";
import type {AiAssistant} from "./ai";
import type {ProviderRegistry} from "./providers";
import type {XiaolvCommonService} from "./service";
import type {StorageManager} from "./storage-manager";
import type {ClipboardMonitor} from "./clipboard-monitor";
import type {PreviewCacheService} from "./preview-cache";
import type {SearchCoordinator} from "./search-coordinator";
import type {CaptureCoordinator} from "./capture-coordinator";
import type {DiscoveryCoordinator} from "./discovery-coordinator";
import type {DiscoveryService} from "./discovery";
import type {OmniSearchService} from "./omni-search";
import type {StarterPackMeta} from "./prompt-pack";
import type {CommonSearchDialog} from "../ui/dialog";
import type {SearchScope} from "../ui/empty-state";
import type {DiscoveryDialogController} from "../ui/discovery-dialog";
import type {DockView, DockViewDeps} from "../ui/dock-view";

export type PluginI18nFn = (key: string, ...args: string[]) => string;

export interface XiaolvCommonPluginContext {
    readonly name: string;
    eventBus: EventBus;
    i18n: Record<string, unknown>;

    kernelClient: IKernelClient;
    library: LibraryService;
    host: HostBridge;
    executor: ActionExecutor;
    registry: ProviderRegistry;
    ai: AiAssistant;
    service: XiaolvCommonService;
    discovery: DiscoveryService;
    omniSearch: OmniSearchService;
    state: PluginState;
    config: LibraryConfig | null;
    searchDialog: CommonSearchDialog | null;
    storageManager: StorageManager;
    clipboardMonitor: ClipboardMonitor;
    readonly previewCacheService: PreviewCacheService;
    searchCoordinator: SearchCoordinator;
    captureCoordinator: CaptureCoordinator;
    discoveryCoordinator: DiscoveryCoordinator;
    readonly disposer: CompositeDisposable;

    topBarElement: HTMLElement | null;
    sidecarReady: boolean;
    unloading: boolean;
    protyleSlash: Array<{
        filter: string[];
        html: string;
        id: string;
        showInLite?: boolean;
        callback(protyle: unknown, nodeElement: HTMLElement): void;
    }>;
    missingSources: Set<string>;
    discoveryDialog: DiscoveryDialogController | null;
    dockView: DockView | null;
    quickAccessPopoverDismiss: (() => void) | null;

    linkMenuHandler: ((event: any) => void) | null;
    imageMenuHandler: ((event: any) => void) | null;
    docTreeMenuHandler: ((event: any) => void) | null;
    blockIconMenuHandler: ((event: any) => void) | null;
    editorTitleMenuHandler: ((event: any) => void) | null;
    switchProtyleHandler: ((event: any) => void) | null;
    wsMainHandler: ((event: any) => void) | null;
    wsSyncTimer: ReturnType<typeof setTimeout> | null;
    cachedWatchedIds: Set<string> | null;
    cachedLibDocIds: Set<string> | null;
    lastHealthPrefetch: number;
    accessFailureNoticeAt: Record<"auth" | "permission", number>;

    noticeHubCleaner?: () => void;
    backupCleaner?: () => void;
    vaultBackupCleaner?: () => void;
    launchpadCleaner?: () => void;
    mobileEntryCleaner?: () => void;
    searchCleaner?: () => void;
    dateCrossCleaner?: () => void;

    addCommand(options: ICommand): void;
    addDock(options: {
        id?: string;
        config: IPluginDockTab;
        data: unknown;
        type: string;
        destroy?: (this: Custom | MobileCustom) => void;
        resize?: (this: Custom) => void;
        update?: (this: Custom | MobileCustom) => void;
        init: (this: Custom | MobileCustom, custom: Custom | MobileCustom) => void;
    }): unknown;

    openSearch(
        insertTarget?: {docId: string; hPath: string},
        initialQuery?: string,
        surroundText?: string,
        defaultAction?: "insert" | "copy" | "openSource",
        initialScope?: SearchScope,
        options?: {
            miniMode?: boolean;
            isGlobalInvocation?: boolean;
            autoMinimizeOnDone?: boolean;
        },
    ): void;
    openSetup(): void;
    openSetting(): void;
    openSettings(): void;
    openEditDialog(item: CommonItem): Promise<void>;
    exportBundle(): Promise<string>;
    fetchAssetBytes(path: string): Promise<Uint8Array | null>;
    applyConfig(config: LibraryConfig): void;
    importBundleText(t: string, p: ConflictPolicy): Promise<ImportReceipt>;
    importMarkdownItems(items: ReadonlyArray<ExportedItem>, p: ConflictPolicy): Promise<ImportReceipt>;
    importStarterPackDirect(md: string): Promise<{ok: boolean; count: number}>;
    createStarterPackDedicatedDoc(pack: StarterPackMeta): Promise<{ok: boolean; count: number; docId?: string; hPath?: string}>;
    dumpData(): Promise<Record<string, unknown>>;
    restoreData(d: Record<string, unknown>): Promise<boolean>;
    openDiscoveryForCurrentDocument(scope?: "document" | "notebook"): void;
    openDiscoveryForTreeRoot(target: {docId: string; path: string}): void;
    openSavedDiscoveryView(view: SavedDiscoveryView): void;
    deleteSavedDiscoveryView(id: string): void;
    resetItemUsage(itemId: string): boolean;
    searchContext(): SearchContext;
    receiptText(code: string, title: string, pending?: string[]): string;
    mountDockView(element: HTMLElement): Promise<DockView | null>;
    buildDockDeps(): DockViewDeps;
    quickInsertById(itemId: string): Promise<boolean>;
    runDockItemAction(itemId: string, mode: InsertMode, fills?: Record<string, string>): Promise<{ok: boolean; message: string}>;
    updateProtyleSlash(allowBuild?: boolean): Promise<void>;
    syncLaunchpadRegistry(): void;
    openCommonPanel(): void;
    handleQuickAction(action: string): Promise<void>;
    searchSnippets(keyword: string): Promise<Array<{id: string; title: string; content: string}>>;
    insertSnippet(itemId: string): Promise<boolean>;
    handleGlobalQuickMini(): void;
    returnToBackground(): void;
    showDiscoveryDialog(docId: string, scope: "document" | "notebook" | "tree", sourcePath?: string, initialTreeRootId?: string, preset?: Record<string, unknown>): void;
    i18nFn(): PluginI18nFn;
    notify: (kind: "info" | "error", message: string) => void;
    notifyExternalDataChange(): void;
    persistSoon(): void;
    scheduleVaultBackup?(): void;
    persistSidecar(key: string, value: unknown, notifyFailure?: boolean): Promise<boolean> | void;
    invalidatePreviewCache(itemIds?: readonly string[]): void;
    recordUsage(itemId: string): void;
    recordClipboard(text: string): void;
    applyPinyinAdapter(): void;
    openLibraryDocument(blockId?: string): boolean;
}
