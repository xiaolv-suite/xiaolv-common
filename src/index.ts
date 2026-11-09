// 小驴常用插件入口：生命周期、命令注册、UI 装配、协议事件、首次引导。
import {
    Dialog,
    Plugin,
    confirm,
} from "siyuan";
import type {IMenuItem} from "siyuan";
import {fetchSyncPost} from "siyuan";
import {lvActivity, lvBackup, lvLaunchpad, lvNotify, lvOmnisearch, lvSurfaceStack, withDocLock, lvTicker} from "./libs/lv-notice-kit";
import {adaptSecondaryDialogForMobile, getDialogBody, isMobileDialogViewport, mountPlatformDialogTitleWrap} from "./ui/dialog-dom";
import "@/styles/index.scss";
import {EXPORT_SCHEMA_VERSION, LIMITS, PLUGIN_VERSION, PROTOCOL_NAME, SIDECAR_LOAD_TIMEOUT_MS, STORAGE_KEYS} from "./constants";
import {createKernelClient, parseExistingMap, type IKernelClient, type SyncPost, type SyncPostContext} from "./kernel/client";
import {CommonItem, cleanShortcode, isBlockId, isItemType, isSafeHttpUrl, kramdownToPlainText, parseSnippetAnnotations, resolveBlockRefTarget} from "./model/item";
import {toErrorMessage} from "./model/errors";
import {getSingleDocTreeDiscoveryTarget} from "./model/discovery-target";
import {InsertMode, buildBlockRef, buildEmbedBlock} from "./model/actions";
import {escapeHtml, isMarkdownFormattingPresent, renderSafeHtmlFromMarkdown} from "./model/clipboard";
import {collectDefaults, rememberValues} from "./model/variable-memory";
import {ExportBundle, ExportedItem, buildBundle, validateImport, ConflictPolicy, ImportReceipt} from "./model/transfer";
import {importBundle as importBundleCore} from "./service/importer";
import {importMarkdownBundle, parseMarkdownPack} from "./service/import-markdown";
import {LibraryConfig, CONFIG_VERSION, migrateState, normalizeLibraryConfig, normalizeSavedDiscoveryViews, normalizeState, PluginState, pushRecentQuery, removeRecentQuery, type SavedDiscoveryView, pushClipboardHistory} from "./model/storage";
import {SearchContext, collectCategories, collectTags, searchEntries, applyBasicFilters, SearchEntry} from "./model/search";
import {findDuplicateByContent} from "./model/dedupe";
import {LruCache, PREVIEW_CACHE_CAPACITY, PREVIEW_CACHE_TTL_MS} from "./model/lru";
import {formatLocalDate} from "./model/placeholders";
import {readWithTimeout} from "./model/startup";
import {setPinyinAdapter, createNoopPinyinAdapter, getPinyinAdapter} from "./model/pinyin";
import {createTinyPinyinAdapter} from "./model/pinyin-tiny";
import {buildProviderRows} from "./model/provider-section";
import {CapabilityDescriptor, ProviderDescriptor} from "./model/protocol";
import {LibraryService} from "./service/library";
import {ExportIntegrityError} from "./service/export-markdown";
import {ActionExecutor, HostBridge} from "./service/commands";
import {AiAssistant, AiUnavailableError, SearchMetaEntry, type AiEndpointName, aiSmartExpandTemplate, aiGenerateSnippetVariants, type TemplateExpansionContext} from "./service/ai";
import {PromoteClipPayload} from "./ui/promote-clip";
import {ProviderRegistry} from "./service/providers";
import {XiaolvCommonService} from "./service/service";
import {DiscoveryService, type DiscoveryReceipt, type DiscoverySessionView} from "./service/discovery";
import {OmniSearchService, deriveOmniItemMetadata} from "./service/omni-search";
import {CommonSearchDialog} from "./ui/dialog";
import type {SearchScope} from "./ui/empty-state";
import {openDiscoveryDialog, type DiscoveryDialogController} from "./ui/discovery-dialog";
import {CaptureDialog, confirmDelete, classifyLinkTarget} from "./ui/capture";
import {openQuickEditDialog} from "./ui/quick-edit";
import {ICONS} from "./ui/icons";
import type {SettingsUiContext} from "./ui/settings-dialog";
import {buildVariableBar, openVariableFillCard} from "./ui/variable-form";
import {listAskFields} from "./model/variables";
import type {TransformKind} from "./service/ai";
import {mountXlcBridge} from "./service/external-bridge";
import {queryEcosystemItems} from "./service/ecosystem";
import {registerRaikiriModuleSafely} from "./ecosystem-bridge-kit";
import {outputNextPasteQueueItem} from "./service/paste-queue";
import {DockView, type DockViewDeps} from "./ui/dock-view";
import {buildDedicatedDocMarkdown, StarterPackMeta} from "./service/prompt-pack";

declare let __webpack_public_path__: string;

type TFn = (key: string, ...args: string[]) => string;

const setPluginChunkPath = (pluginName: string): void => {
    if (typeof __webpack_public_path__ === "undefined") return;
    __webpack_public_path__ = `/plugins/${encodeURIComponent(pluginName)}/`;
};

/** 回执 toast 的标题展示截断：标题最长 512 字，原样进通知条会撑爆全屏（原文不受影响） */
const TOAST_TITLE_MAX = 48;
const shortTitle = (title: string): string => (title.length > TOAST_TITLE_MAX ? `${title.slice(0, TOAST_TITLE_MAX)}…` : title);

/** 将思源官方泛型传输函数收窄为内核客户端需要的统一信封。 */
const hostSyncPost: SyncPost = async (url, data, context?: SyncPostContext) => {
    // 当前 siyuan 版本的 fetchSyncPost 只声明两个参数；运行时多余的 context 会被忽略，
    // 但通过兼容签名传递 AbortSignal，未来宿主支持取消时无需再改内核客户端。
    const post = fetchSyncPost as unknown as (requestUrl: string, body: unknown, requestContext?: SyncPostContext) => Promise<unknown>;
    const raw = await post(url, data, context);
    if (!raw || typeof raw !== "object") return {data: raw};
    const body = raw as unknown as Record<string, unknown>;
    return {
        code: typeof body.code === "number" ? body.code : undefined,
        msg: typeof body.msg === "string" ? body.msg : undefined,
        data: body.data,
    };
};

export default class XiaolvCommonPlugin extends Plugin {
    private kernelClient!: IKernelClient;
    private library!: LibraryService;
    private host!: HostBridge;
    private executor!: ActionExecutor;
    private registry!: ProviderRegistry;
    private ai!: AiAssistant;
    private service!: XiaolvCommonService;
    private discovery!: DiscoveryService;
    private omniSearch!: OmniSearchService;
    private capture: CaptureDialog | null = null;
    private state!: PluginState;
    private config!: LibraryConfig | null;
    private searchDialog: CommonSearchDialog | null = null;
    private saveTimer: ReturnType<typeof setTimeout> | null = null;
    /** 顶栏罗盘挂载元素（launchpad 注册与徽标探测共用，T-0820 顶栏收敛） */
    private topBarElement: HTMLElement | null = null;
    private sidecarReady = false;
    /** Future or unreadable sidecar data must survive this older runtime unchanged. */
    private sidecarStateWritable = false;
    /** 右键菜单处理器引用（onunload 解绑） */
    private menuHandler: ((event: {detail: {menu: {addItem: (item: {icon: string; label: string; click: () => void}) => void}}}) => void) | null = null;
    private blockRefMenuHandler: ((event: {detail: {menu: {addItem: (item: {icon: string; label: string; click: () => void}) => void}; element?: Element}}) => void) | null = null;
    private linkMenuHandler: ((event: {detail: {menu: {addItem: (item: {icon: string; label: string; click: () => void}) => void}; element?: Element}}) => void) | null = null;
    private imageMenuHandler: ((event: {detail: {menu: {addItem: (item: {icon: string; label: string; click: () => void}) => void}; element?: Element}}) => void) | null = null;
    private docTreeMenuHandler: ((event: {detail: {menu: {addItem: (item: {icon: string; label: string; click: () => void}) => void}; elements?: Array<Element | null> | NodeListOf<HTMLElement>; type?: string; items?: Array<{id: string; path: string; notebookId: string}>}}) => void) | null = null;
    private blockIconMenuHandler: ((event: {detail: {menu: {addItem: (item: {icon: string; label: string; click: () => void}) => void}; blockElements?: Array<HTMLElement | null>; protyle?: {block?: {rootID?: string}}}}) => void) | null = null;
    private editorTitleMenuHandler: ((event: {detail: {menu: {addItem: (item: {icon: string; label: string; click: () => void}) => void}; data?: {id?: string; rootID?: string; name?: string}; protyle?: {block?: {rootID?: string}}}}) => void) | null = null;
    private switchProtyleHandler: ((event: {detail?: {protyle?: unknown}}) => void) | null = null;
    private wsMainHandler: ((event: {detail?: {cmd?: string; data?: unknown}}) => void) | null = null;
    private wsSyncTimer: ReturnType<typeof setTimeout> | null = null;
    /** 来源失效预检缓存（每次搜索刷新时批量重建；仅为列表徽标，打开来源仍实时校验） */
    private missingSources = new Set<string>();
    /** 协议命令 ID → 执行器（xiaolv.common.*，供雷切等按稳定 ID 调用） */
    public readonly protocolCommands: Record<string, (payload?: unknown) => Promise<unknown>> = {};
    /** 对外窗口桥卸载器（T-0031 · ADR-0013；onunload 注销 window.xiaolvCommon） */
    private bridgeDisposer: (() => void) | null = null;
    /** 雷切工作台小组件卸载器（Epoch 6 标准） */
    private raikiriDisposer: (() => void) | null = null;
    private clipboardListenerCleanup: (() => void) | null = null;
    private discoveryDialog: DiscoveryDialogController | null = null;
    private dockView: DockView | null = null;
    private quickAccessPopoverDismiss: (() => void) | null = null;
    /** 小驴全生态统一通知套件 · 卸载注销清理器 (Epoch 7) */
    private noticeHubCleaner?: (() => void);
    /** 小驴全生态统一灾备总线 · 卸载注销清理器 (Epoch 7 Phase 4) */
    private backupCleaner?: (() => void);
    /** 小驴罗盘 · 弹射坞卸载注销清理器 (Epoch 7 Phase 5) */
    private launchpadCleaner?: (() => void);
    /** 小驴全生态统一手机端入口清理器 (Protocol v1.6.0 Mobile) */
    private mobileEntryCleaner?: (() => void);
    /** 小驴穿透搜索 · 卸载注销清理器 (Epoch 7 Phase 7) */
    private searchCleaner?: (() => void);
    /** 小驴统一心跳时钟跨日清理器 */
    private dateCrossCleaner?: (() => void);
    /** 全局遮罩点击即关清理器 */
    private scrimClickCleaner?: (() => void);
    private unloading = false;

    async onload(): Promise<void> {
        this.unloading = false;
        this.sidecarStateWritable = false;
        setPluginChunkPath(this.name);
        try {
            this.addIcons(ICONS);
        } catch (err) {
            const detail = toErrorMessage(err);
            this.notify("error", this.i18nFn()("startupFailed", detail || "icon registration failed"));
        }
        // 先装配安全默认值并注册入口。宿主 loadData 在存储损坏/网络异常时可能悬挂，
        // 入口不能依赖侧车读取成功才出现；读取完成后再原位更新共享状态对象。
        this.config = null;
        this.state = normalizeState(null);
        this.registerEntries();
        this.registerCommands();
        this.setupClipboardTracking();

        // 全局遮罩点击即关（Backdrop Scrim Click-to-Dismiss · 对齐常用全弹窗人体工程学）
        if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
            const onCommonScrimClick = (e: MouseEvent) => {
                const target = e.target as HTMLElement | null;
                if (target && target.classList?.contains("b3-dialog__scrim")) {
                    const dialogEl = target.closest(".b3-dialog");
                    if (dialogEl && dialogEl.querySelector('[class*="xlc-"], [id*="xlc-"]')) {
                        const closeBtn = dialogEl.querySelector<HTMLElement>(".b3-dialog__close, [data-action='close'], .xlc-dialog-close");
                        if (closeBtn) closeBtn.click();
                    }
                }
            };
            window.addEventListener("click", onCommonScrimClick, true);
            this.scrimClickCleaner = () => window.removeEventListener("click", onCommonScrimClick, true);
        }
        try {
            this.bootServices();
        } catch (err) {
            const detail = toErrorMessage(err);
            this.notify("error", this.i18nFn()("startupFailed", detail || "unknown error"));
            return;
        }

        // 官方存储会话缓存防御（对齐 SiYuan Issue #19908）：
        // loadData 读取失败时会回退到 this.data[key]，若其他窗口已删除该文件可能返回陈旧数据。
        // 调用前清除会话缓存，确保真实读取磁盘最新状态。
        try {
            if (this.data && typeof this.data === "object") {
                delete this.data[STORAGE_KEYS.config];
                delete this.data[STORAGE_KEYS.state];
            }
        } catch {
            // ignore
        }

        const [configRead, stateRead] = await Promise.all([
            readWithTimeout(() => this.loadData(STORAGE_KEYS.config), SIDECAR_LOAD_TIMEOUT_MS),
            readWithTimeout(() => this.loadData(STORAGE_KEYS.state), SIDECAR_LOAD_TIMEOUT_MS),
        ]);
        const rawConfig = configRead.ok ? configRead.value : null;
        const rawState = stateRead.ok ? stateRead.value : null;
        if (!configRead.ok || !stateRead.ok) {
            this.notify("error", this.i18nFn()("sidecarLoadFailed"));
        }
        this.config = normalizeLibraryConfig(rawConfig);
        const migrated = migrateState(rawState);
        if ("rejected" in migrated) {
            // 未来版本数据：保留原样不降级改写，仅提示（诚实降级，不破坏）
            this.notify("error", this.i18nFn()("libInvalid"));
            Object.assign(this.state, normalizeState(null));
        } else {
            Object.assign(this.state, migrated.state);
            this.sidecarStateWritable = stateRead.ok;
        }
        if (this.config) this.library.setConfig(this.config);
        this.registry.restore(this.state.providers);
        this.ai.updateSettings(this.state.ai);
        this.applyPinyinAdapter();
        this.sidecarReady = true;
    }

    private bootServices(): void {
        const kernel = createKernelClient({
            syncPost: hostSyncPost,
            onAuthFailure: () => this.handleKernelAccessFailure("auth"),
            onPermissionFailure: () => this.handleKernelAccessFailure("permission"),
        });
        this.kernelClient = kernel;
        // 拼音适配器装配（ADR 0004/R5：tiny-pinyin 本地注解，设置可关；关闭即 noop 零开销）
        this.applyPinyinAdapter();
        this.library = new LibraryService(kernel, {
            // /api/file/getFile 返回二进制响应，不经过 fetchSyncPost 的 {code,msg,data} 信封。
            // 通过同源 fetch 探测资源存在性，失败时由 LibraryService 标记 assetMissing。
            probeAsset: async (path) => (await this.fetchAssetBytes(path)) !== null,
            onItemsChanged: (itemIds) => this.invalidatePreviewCache(itemIds),
        });
        if (this.config) this.library.setConfig(this.config);
        this.discovery = new DiscoveryService(kernel, this.library);
        this.host = new HostBridge(this.app, this);
        this.omniSearch = new OmniSearchService(kernel, () => this.host.currentDocInfo());
        this.registry = new ProviderRegistry();
        this.registry.restore(this.state.providers);
        const aiTransport = {
            request: <T = unknown>(endpoint: AiEndpointName, payload?: Record<string, unknown>): Promise<T> =>
                kernel.request<T>(endpoint, payload ?? {}),
        };
        this.ai = new AiAssistant(aiTransport, this.state.ai);
        this.executor = new ActionExecutor(this.library, this.host, this.notify, (item) => {
            this.service.touchRecent(item.id);
            this.recordUsage(item.id);
            this.notifyExternalDataChange();
        }, {
            enabled: () => this.state.search.placeholders,
            now: () => new Date(),
            currentDoc: async () => {
                const docId = this.host.currentDocId();
                if (!docId) return null;
                // 标题用内核权威 hPath 末段（不读内部 DOM，ADR 0003）
                const path = await this.library.getDocPath(docId);
                if (!path) return {title: "", path: ""};
                return {title: path.split("/").filter(Boolean).pop() ?? path, path};
            },
            clipboard: async () => {
                try {
                    if (navigator.clipboard && window.isSecureContext) {
                        return await navigator.clipboard.readText();
                    }
                } catch {
                    // 权限/平台限制：诚实降级为空串（占位符语义与无文档一致）
                }
                return "";
            },
            selection: () => {
                try {
                    const sel = window.getSelection();
                    return sel ? sel.toString() : "";
                } catch {
                    return "";
                }
            },
        });
        this.service = new XiaolvCommonService({
            library: this.library,
            executor: this.executor,
            registry: this.registry,
            ai: this.ai,
            state: this.state,
            onStateChange: () => this.persistSoon(),
            onLibraryChange: () => this.notifyExternalDataChange(),
        });
        // 对外窗口桥 window.xiaolvCommon v1（T-0031 · ADR-0013）：只读子集，服务已装配即可挂
        this.bridgeDisposer = mountXlcBridge(this.service);
        // 向小驴雷切注册“高频常用语”小组件（Epoch 6 标准）
        this.registerRaikiriWidget();
        try {
            // 思源智能体能力（3.8.x）：按关键词搜常用条目——只读 localRead，输出仅元数据
            this.addAgentCapability({
                name: "xiaolv_common_search",
                title: "搜索小驴常用（内测版）条目",
                description: "按关键词搜索用户的常用内容条目（标题/类型/标签）。只读；不含条目正文。",
                inputSchema: {
                    type: "object",
                    properties: {query: {type: "string", description: "搜索关键词"}},
                    required: ["query"],
                },
                effects: {localRead: true},
                handler: async (args) => {
                    try {
                        return await this.service.searchForAgent(args?.query);
                    } catch (err) {
                        return {error: toErrorMessage(err)};
                    }
                },
            });
        } catch {
            // 旧宿主无 addAgentCapability：智能体能力缺席，不影响插件本体
        }
        this.capture = new CaptureDialog({
            t: this.i18nFn(),
            getSelectionText: () => getSelectionInfo(),
            currentDocId: () => this.host.currentDocId(),
            readClipboardText: async () => {
                if (!navigator.clipboard?.readText) throw new Error("clipboard unavailable");
                return navigator.clipboard.readText();
            },
            createItem: async (input, options) => {
                const result = await this.library.createItem(input, undefined, options);
                if (!result.ok) return {ok: false, message: result.message};
                this.notify("info", this.i18nFn()("saved", result.data.item.title));
                this.notifyExternalDataChange();
                return {ok: true, message: result.data.item.title, itemId: result.data.item.id};
            },
            notify: this.notify,
            getBlockKramdown: async (blockId) => {
                const kd = await this.library.getItemKramdown({
                    id: "xlc-proxy", blockId, libraryDocId: "", itemType: "blockref", title: "", alias: "",
                    tags: [], category: "", summary: "", varCount: 0, source: {sourceDocId: "", sourceBlockId: blockId, sourceType: "block"},
                    url: "", targetBlockId: blockId, createdAt: 0, updatedAt: 0, droppedFields: [],
                });
                return kd.ok ? kd.data : null;
            },
            exportDocContent: async (docId) => {
                const result = await this.library.exportDocContent(docId);
                return result.ok ? result.data : null;
            },
            aiEnabled: () => this.state.ai.enabled,
            aiTidy: async (content) => {
                try {
                    return {ok: true as const, ...await this.ai.tidy(content)};
                } catch (err) {
                    return {ok: false as const, message: this.aiErrorText(err)};
                }
            },
            aiDraft: async (description) => {
                try {
                    return {ok: true as const, text: await this.ai.draft(description)};
                } catch (err) {
                    return {ok: false as const, message: this.aiErrorText(err)};
                }
            },
            findDuplicate: async (content, options) => {
                const idx = await this.library.ensureIndex();
                // 查重失败必须回到表单错误态，不能把“无法检查”伪装成“没有重复”。
                return findDuplicateByContent(content, idx.entries, options);
            },
            getLibraryName: async () => {
                const cfg = this.config;
                if (!cfg) return null;
                if (cfg.mode === "notebook") {
                    const first = cfg.notebookIds[0];
                    if (!first) return null;
                    const nbs = await this.library.listNotebooks();
                    return nbs.ok ? nbs.data.find((nb) => nb.id === first)?.name ?? null : null;
                }
                const docId = cfg.containerDocIds[0];
                if (!docId) return null;
                return await this.library.getDocPath(docId);
            },
            isConfigured: () => Boolean(this.config),
            onNotConfigured: () => this.openSetup(),
            getExistingTags: () => {
                const idx = this.library.getIndex();
                if (!idx) return [];
                const set = new Set<string>();
                for (const e of idx.entries) {
                    if (e.tags) for (const t of e.tags) if (t) set.add(t);
                }
                return Array.from(set).slice(0, 10);
            },
            getExistingCategories: () => {
                const idx = this.library.getIndex();
                if (!idx) return [];
                const set = new Set<string>();
                for (const e of idx.entries) {
                    if (e.category) set.add(e.category);
                }
                return Array.from(set).slice(0, 10);
            },
            checkAliasConflict: (alias: string) => {
                const trimmed = alias.trim();
                if (!trimmed) return {conflict: false};
                const idx = this.library.getIndex();
                if (!idx) return {conflict: false};
                const match = idx.entries.find((e) => e.alias && e.alias.toLowerCase() === trimmed.toLowerCase());
                return {conflict: Boolean(match), itemTitle: match?.title};
            },
        });
        // 协议命令面（稳定 ID；雷切等通过 app.plugins 获取本插件后调用）
        this.protocolCommands["xiaolv.common.open"] = async () => {
            this.openSearch();
            return {ok: true};
        };
        this.protocolCommands["xiaolv.common.saveSelection"] = async () => {
            await this.capture?.saveSelection();
            return {ok: true};
        };
        this.protocolCommands["xiaolv.common.insert"] = async (payload) => {
            const raw = payload as {itemId?: string; id?: string; mode?: string} | undefined;
            const itemId = raw?.itemId ?? raw?.id ?? "";
            return this.service.insert(itemId, {mode: raw?.mode ?? "insert"});
        };
        this.protocolCommands["xiaolv.common.copy"] = async (payload) => {
            const raw = payload as {itemId?: string; id?: string} | undefined;
            const itemId = raw?.itemId ?? raw?.id ?? "";
            return this.service.copy(itemId);
        };
        this.protocolCommands["xiaolv.common.openSource"] = async (payload) => {
            const raw = payload as {itemId?: string; id?: string} | undefined;
            const itemId = raw?.itemId ?? raw?.id ?? "";
            return this.service.openSource(itemId);
        };
        // 供 Quicker、外部脚本或兄弟插件无 UI 纯数据调用的 Headless 接口
        this.protocolCommands["xiaolv.common.search"] = async (payload) => {
            const raw = payload as {keyword?: string; text?: string; limit?: number} | undefined;
            const query = typeof raw?.keyword === "string" ? raw.keyword : (typeof raw?.text === "string" ? raw.text : "");
            return this.service.search({text: query});
        };
        this.protocolCommands["xiaolv.common.get"] = async (payload) => {
            const itemId = (payload as {itemId?: string; id?: string})?.itemId ?? (payload as {itemId?: string; id?: string})?.id ?? "";
            return this.service.get(itemId);
        };
        this.protocolCommands["xiaolv.common.resolve"] = async (payload) => {
            const raw = payload as {itemId?: string; id?: string; fills?: Record<string, string>} | undefined;
            const itemId = raw?.itemId ?? raw?.id ?? "";
            return this.service.resolve(itemId, raw?.fills);
        };
        this.protocolCommands["xiaolv.common.recall"] = async (payload) => {
            const raw = payload as {alias?: string; keyword?: string; fills?: Record<string, string>} | undefined;
            const key = raw?.alias ?? raw?.keyword ?? "";
            return this.service.recall(key, raw?.fills);
        };
        this.protocolCommands["xiaolv.common.recent"] = async (payload) => {
            const limit = (payload as {limit?: number})?.limit;
            return this.service.getRecent(limit);
        };
        this.protocolCommands["xiaolv.common.favorites"] = async () => {
            return this.service.getFavorites();
        };
        this.protocolCommands["xiaolv.common.getClipboardHistory"] = async () => {
            return this.service.getClipboardHistory();
        };
        this.protocolCommands["xiaolv.common.captureQuote"] = async (payload) => {
            return this.service.captureQuote(payload as any);
        };
        this.protocolCommands["xiaolv.common.pasteQueueNext"] = async () => {
            return outputNextPasteQueueItem(this.host);
        };
        // 按需发现协议面：提供当前文档/笔记本扫描、候选预览、收录与批次撤销。
        this.protocolCommands["xiaolv.common.discoverCurrentDocument"] = async () => this.discoverCurrentDocument();
        this.protocolCommands["xiaolv.common.discoverCurrentNotebook"] = async () => this.discoverCurrentNotebook();
        this.protocolCommands["xiaolv.common.previewDiscoveryCandidate"] = async (payload) => {
            const value = payload as {sessionId?: string; candidateKey?: string} | undefined;
            return this.discovery.previewCandidate(value?.sessionId ?? "", value?.candidateKey ?? "");
        };
        this.protocolCommands["xiaolv.common.addDiscoveryCandidate"] = async (payload) => {
            const value = payload as {sessionId?: string; candidateKey?: string; allowSameContent?: boolean; batchId?: string; category?: string} | undefined;
            return this.discovery.addCandidate(value?.sessionId ?? "", value?.candidateKey ?? "", {
                allowSameContent: value?.allowSameContent === true,
                batchId: value?.batchId,
                category: typeof value?.category === "string" ? value.category : undefined,
            });
        };
        this.protocolCommands["xiaolv.common.closeDiscoverySession"] = async (payload) => {
            const sessionId = (payload as {sessionId?: string} | undefined)?.sessionId;
            return this.discovery.closeSession(sessionId);
        };
        this.protocolCommands["xiaolv.common.beginDiscoveryBatch"] = async (payload) => {
            const sessionId = (payload as {sessionId?: string} | undefined)?.sessionId ?? "";
            return this.discovery.beginAddBatch(sessionId);
        };
        this.protocolCommands["xiaolv.common.finishDiscoveryBatch"] = async (payload) => {
            const value = payload as {sessionId?: string; batchId?: string} | undefined;
            return this.discovery.finishAddBatch(value?.sessionId ?? "", value?.batchId ?? "");
        };
        this.protocolCommands["xiaolv.common.undoDiscoveryBatch"] = async (payload) => {
            const value = payload as {sessionId?: string; batchId?: string} | undefined;
            return this.discovery.undoBatch(value?.sessionId ?? "", value?.batchId ?? "");
        };
        this.protocolCommands["xiaolv.common.adoptLibraryBlocks"] = async (payload) => {
            const blockIds = (payload as {blockIds?: string[]} | undefined)?.blockIds;
            const res = await this.library.adoptUnmanagedLibraryBlocks(blockIds);
            if (res.ok && res.data.adopted > 0) {
                this.notifyExternalDataChange();
            }
            return res;
        };
        this.protocolCommands["xiaolv.common.pullFromSource"] = async (payload) => {
            const itemId = (payload as {itemId?: string} | undefined)?.itemId ?? "";
            const res = await this.library.pullFromSourceBlock(itemId);
            if (res.ok) {
                this.invalidatePreviewCache([itemId]);
                this.notifyExternalDataChange();
            }
            return res;
        };
        this.protocolCommands["xiaolv.common.pushToSource"] = async (payload) => {
            const itemId = (payload as {itemId?: string} | undefined)?.itemId ?? "";
            return this.library.pushToSourceBlock(itemId);
        };

        // 小驴全生态统一通知套件 · 注册本插件并自举自协商 (Epoch 7)
        try {
            this.noticeHubCleaner = lvNotify.registerPlugin("xiaolv-common");
        } catch {
            // 环境无 DOM / SSR 防御
        }

        // 小驴全生态统一灾备总线 · 注册常用片段与宏模版备份恢复切面 (Epoch 7 Phase 4)
        try {
            this.backupCleaner = lvBackup.register(
                "xiaolv-common",
                async () => this.dumpData(),
                async (data) => this.restoreData(data)
            );
        } catch {
            // 环境防御
        }

        // 小驴罗盘 · 注册插件入口与二级行动直达 (Epoch 7 Phase 5)
        this.syncLaunchpadRegistry();

        // 小驴罗盘 · 全端统一收敛入口挂载 (Protocol v1.7 Unified Entry)
        try {
            this.mobileEntryCleaner = lvLaunchpad.ensureUnifiedEntry();
        } catch {
            // 环境防御
        }

        // 小驴穿透搜索 · 注册常用代码片段与模版检索切面 (Epoch 7 Phase 7 / Mobile Spec v1)
        try {
            this.searchCleaner = lvOmnisearch.registerProvider("xiaolv-common", async (keyword) => {
                const hits = await this.searchSnippets(keyword);
                return hits.slice(0, 5).map(s => ({
                    id: s.id,
                    source: "常用",
                    category: "note",
                    title: s.title,
                    snippet: s.content.slice(0, 60),
                    onClick: async () => {
                        lvLaunchpad.haptic(12);
                        if (this.host.isMobile()) {
                            let text = s.content;
                            if (this.library) {
                                const got = await this.library.getItem(s.id);
                                if (got.ok) {
                                    const kdRes = await this.library.getStoredItemKramdown(got.data);
                                    text = kdRes.ok && kdRes.data ? kdRes.data : (got.data.summary || s.content);
                                }
                            }
                            await this.host.writeClipboard(text);
                            this.notify("info", "已复制，去目标应用粘贴");
                        } else {
                            void this.insertSnippet(s.id);
                        }
                    },
                }));
            });
        } catch {
            // 环境防御
        }

        // 小驴统一节拍时钟 · 注册跨日日期刷新与缓存清理切面
        try {
            this.dateCrossCleaner = lvTicker.onDateCross("xiaolv-common", () => {
                this.previewCache.clear();
            });
        } catch {
            // 环境防御
        }
    }

    /** 当前文档发现的统一入口，供命令面板、右键菜单和协议调用复用。 */
    private async discoverCurrentDocument(): Promise<DiscoveryReceipt<DiscoverySessionView>> {
        return this.discoverForScope("document");
    }

    private async discoverCurrentNotebook(): Promise<DiscoveryReceipt<DiscoverySessionView>> {
        return this.discoverForScope("notebook");
    }

    private async discoverForScope(scope: "document" | "notebook"): Promise<DiscoveryReceipt<DiscoverySessionView>> {
        const docId = this.host?.currentDocId();
        if (!docId) {
            const result: DiscoveryReceipt<DiscoverySessionView> = {
                ok: false,
                reason: "invalid-input",
                message: this.i18nFn()("discoveryNoDocument"),
            };
            this.notify("error", result.message);
            return result;
        }
        let result: DiscoveryReceipt<DiscoverySessionView>;
        try {
            if (scope === "notebook") {
                const discoverNotebook = (this.discovery as DiscoveryService & {
                    discoverCurrentNotebook?: (currentDocId: string) => Promise<DiscoveryReceipt<DiscoverySessionView>>;
                }).discoverCurrentNotebook;
                result = discoverNotebook
                    ? await discoverNotebook.call(this.discovery, docId)
                    : {ok: false, reason: "invalid-input", message: this.i18nFn()("discoveryNotebookUnavailable")};
            } else {
                result = await this.discovery.discoverCurrentDocument(docId);
            }
        } catch (error) {
            const message = toErrorMessage(error);
            result = {ok: false, reason: "kernel-error", message};
        }
        if (!result.ok) {
            this.notify("error", this.discoveryFailureText(result));
            return result;
        }
        const count = result.data.candidates.length;
        const scannedDocs = (result.data as DiscoverySessionView & {scannedDocs?: number}).scannedDocs;
        this.notify("info", count > 0
            ? scope === "notebook"
                ? this.i18nFn()("discoveryFoundNotebook", String(scannedDocs ?? 0), String(count))
                : this.i18nFn()("discoveryFound", String(count))
            : this.i18nFn()(scope === "notebook" ? "discoveryEmptyNotebook" : "discoveryEmpty"));
        return result;
    }

    /** 用户入口：打开指定范围的发现面板。扫描和候选状态由临时会话管理。 */
    private openDiscoveryForCurrentDocument(scope: "document" | "notebook" = "document"): void {
        if (!this.sidecarReady) {
            this.notify("info", this.i18nFn()("sidecarLoading"));
            return;
        }
        if (!this.config) {
            this.openSetup();
            return;
        }
        const docId = this.host?.currentDocId();
        if (!docId) {
            this.notify("error", this.i18nFn()("discoveryNoDocument"));
            return;
        }
        if (scope === "notebook" && !(this.discovery as DiscoveryService & {discoverCurrentNotebook?: unknown}).discoverCurrentNotebook) {
            this.notify("info", this.i18nFn()("discoveryNotebookUnavailable"));
            return;
        }
        void this.library.getDocPath(docId).then((sourcePath) => {
            if (this.unloading) return;
            this.showDiscoveryDialog(docId, scope, sourcePath);
        }).catch(() => {
            if (this.unloading) return;
            this.showDiscoveryDialog(docId, scope);
        });
    }

    private openDiscoveryForTreeRoot(target: {docId: string; path: string}): void {
        if (!this.sidecarReady) {
            this.notify("info", this.i18nFn()("sidecarLoading"));
            return;
        }
        if (!this.config) {
            this.openSetup();
            return;
        }
        if (!isBlockId(target.docId)) {
            this.notify("error", this.i18nFn()("discoveryNoDocument"));
            return;
        }
        void this.library.getDocPath(target.docId).then((sourcePath) => {
            if (this.unloading) return;
            this.showDiscoveryDialog(target.docId, "tree", sourcePath || target.path, target.docId);
        }).catch(() => {
            if (this.unloading) return;
            this.showDiscoveryDialog(target.docId, "tree", target.path, target.docId);
        });
    }

    private showDiscoveryDialog(
        docId: string,
        scope: "document" | "notebook" | "tree",
        sourcePath?: string,
        initialTreeRootId?: string,
        preset?: {initialTag?: string; initialNotebookId?: string; autoSelectFiltered?: boolean; referenceOnly?: boolean; defaultCategory?: string},
    ): void {
        if (this.discoveryDialog) {
            const closingDialog = this.discoveryDialog;
            closingDialog.close(false, () => {
                if (this.discoveryDialog !== closingDialog || this.unloading) return;
                this.discoveryDialog = null;
                this.showDiscoveryDialog(docId, scope, sourcePath, initialTreeRootId, preset);
            });
            return;
        }
        this.discoveryDialog = openDiscoveryDialog({
            t: this.i18nFn(),
            service: this.discovery,
            notify: this.notify,
            listNotebooks: async () => {
                const result = await this.library.listNotebooks();
                if (!result.ok) throw new Error(result.message);
                return result.data;
            },
            searchDocs: async (keyword) => {
                const result = await this.library.searchDocs(keyword);
                if (!result.ok) throw new Error(result.message);
                return result.data;
            },
            onAdded: () => {
                this.notifyExternalDataChange();
            },
            savedViews: this.state.search.savedDiscoveryViews ?? [],
            onSaveView: (view) => this.saveDiscoveryView(view),
        }, {
            docId,
            sourcePath,
            scope,
            initialTreeRootId,
            title: scope === "tree" ? this.i18nFn()("discoveryTitleTree") : undefined,
            ...preset,
        });
    }

    /** 保存发现面板的标签规则；侧车只保留规则和入口元数据，不保存源块正文。 */
    private saveDiscoveryView(view: Omit<SavedDiscoveryView, "id">): boolean {
        const [normalized] = normalizeSavedDiscoveryViews([{
            id: `xlc-view-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`,
            ...view,
        }]);
        if (!normalized || (normalized.scope === "notebook" && !isBlockId(normalized.targetNotebookId))) {
            this.notify("error", this.i18nFn()("discoverySaveViewInvalid"));
            return false;
        }
        const current = this.state.search.savedDiscoveryViews ?? [];
        const sameRule = current.find((entry) => entry.name === normalized.name
            && entry.tag === normalized.tag
            && entry.scope === normalized.scope
            && entry.targetDocId === normalized.targetDocId
            && entry.targetNotebookId === normalized.targetNotebookId);
        const id = sameRule?.id ?? normalized.id;
        const next = normalizeSavedDiscoveryViews([
            {...normalized, id},
            ...current.filter((entry) => entry.id !== sameRule?.id),
        ]);
        this.state.search.savedDiscoveryViews = next;
        this.persistSoon();
        this.notify("info", this.i18nFn()("discoverySaveViewDone", normalized.name));
        return true;
    }

    /** 从设置页重开保存的标签视图；打开前校验目标，避免失效 ID 回退到当前文档。 */
    private openSavedDiscoveryView(view: SavedDiscoveryView): void {
        if (!this.sidecarReady) {
            this.notify("info", this.i18nFn()("sidecarLoading"));
            return;
        }
        if (!this.config) {
            this.openSetup();
            return;
        }
        if (view.scope === "selected-notebook" || view.scope === "all-notebooks") {
            this.notify("info", this.i18nFn()("discoveryScopeUnavailable"));
            return;
        }
        if (view.scope === "notebook") {
            if (!isBlockId(view.targetNotebookId)) {
                this.notify("error", this.i18nFn()("discoverySavedNotebookUnfixed"));
                return;
            }
            if (!this.discovery.discoverNotebook) {
                this.notify("info", this.i18nFn()("discoveryNotebookUnavailable"));
                return;
            }
        }
        if (view.scope === "tree" && (!this.discovery.discoverTree || !this.library.searchDocs)) {
            this.notify("info", this.i18nFn()("discoveryScopeUnavailable"));
            return;
        }
        if (view.scope !== "notebook" && !isBlockId(view.targetDocId)) {
            this.notify("error", this.i18nFn()("discoverySourceUnavailable"));
            return;
        }
        this.showDiscoveryDialog(view.scope === "notebook" ? "" : view.targetDocId, view.scope, view.pathLabel || undefined, view.scope === "tree" ? view.targetDocId : undefined, {
            initialTag: view.tag,
            ...(view.scope === "notebook" ? {initialNotebookId: view.targetNotebookId} : {}),
            autoSelectFiltered: true,
            referenceOnly: true,
            defaultCategory: view.defaultCategory,
        });
    }

    private deleteSavedDiscoveryView(id: string): void {
        const current = this.state.search.savedDiscoveryViews ?? [];
        const next = current.filter((view) => view.id !== id);
        if (next.length === current.length) return;
        this.state.search.savedDiscoveryViews = next;
        this.persistSoon();
    }

    private discoveryFailureText(result: Extract<DiscoveryReceipt<unknown>, {ok: false}>): string {
        const t = this.i18nFn();
        switch (result.reason) {
            case "not-configured": return t("discoveryNotConfigured");
            case "library-document": return t("discoveryLibraryDocument");
            case "library-boundary-unknown": return t("discoveryBoundaryUnknown");
            case "invalid-response": return t("discoveryInvalidResponse");
            case "timeout": return t("timeout");
            default: return t("discoveryFailed");
        }
    }

    private i18nFn(): TFn {
        return (key: string, ...args: string[]) => {
            let text: string = (this.i18n as Record<string, string>)[key] ?? key;
            args.forEach((arg, i) => {
                text = text.replace(`%s`, arg); // 逐个替换首个占位（按顺序消费）
                void i;
            });
            return text;
        };
    }

    async onLayoutReady(): Promise<void> {
        // 后台预热索引：打开搜索时通常已就绪（零等待）；失败静默——打开时会重建并如实报错
        try {
            await this.library.ensureIndex();
            await this.updateProtyleSlash();
        } catch {
            // 预热失败不打扰用户
        }
    }

    /**
     * R148 P0：覆盖 onDataChanged 向宿主声明「数据变更由本插件自行处理」。
     * 未覆盖时，宿主加载器在每次插件数据写入（persistSoon 节流的侧车保存：搜索输入、
     * 筛选变更、开关切换等都会触发）后重载整个插件——全部 UI 销毁重建，即用户看到的
     * 「每次输入闪一下 / 设置页疯狂闪烁」。覆盖后宿主改为调用本方法。
     * 处理策略：仅使索引缓存失效（可丢弃缓存，SWR 下次打开自动重建），绝不写盘以免循环。
     */
    onDataChanged(_reason?: string): void {
        try {
            if (this.data && typeof this.data === "object") {
                delete this.data[STORAGE_KEYS.config];
                delete this.data[STORAGE_KEYS.state];
            }
            this.library?.invalidateIndex();
            this.invalidatePreviewCache();
        } catch {
            // 索引失效失败无副作用（SWR 会兜底重建）
        }
    }

    /** 拼音适配器装配：开关变化/启动时调用；切换后需 reindex 重建注解 */
    private applyPinyinAdapter(): void {
        setPinyinAdapter(this.state.search.pinyin ? createTinyPinyinAdapter() : createNoopPinyinAdapter());
    }

    private notify = (kind: "info" | "error", message: string): void => {
        if (kind === "error") {
            lvNotify.card({
                source: "小驴常用",
                title: "小驴常用提示",
                message,
                level: "error",
                duration: 6000,
            });
        } else {
            lvNotify.capsule({
                source: "小驴常用",
                message,
                duration: 2500,
            });
        }
    };

    /** AI 错误 → 诚实文案（区分未启用/未配置/权限/超时/解析失败/内容超长） */
    private aiErrorText(err: unknown): string {
        const t = this.i18nFn();
        if (err instanceof AiUnavailableError) {
            switch (err.reason) {
                case "disabled": return t("aiDisabled");
                case "not-configured": return t("aiNotConfigured");
                case "empty-response": return t("aiEmpty");
                case "parse": return t("aiParseFailed");
                case "timeout": return t("aiTimeout");
                case "content-not-allowed": return t("aiContentNotAllowed");
                case "content-too-long": return t("aiContentTooLong", "4000");
                default: return t("aiTransport");
            }
        }
        return t("kernelError", toErrorMessage(err));
    }

    /** 来源失效预检节流（30s 内至多一次批量 checkBlocksExist；打开来源仍实时校验兜底） */
    private lastHealthPrefetch = 0;
    /** 提供方失败通知记忆（每提供方每会话一次；成功即清除） */
    private providerFailureSeen = new Set<string>();
    /** 全局鉴权回执做短暂节流；多请求同时失败时不连续覆盖宿主通知条。 */
    private accessFailureNoticeAt: Record<"auth" | "permission", number> = {auth: 0, permission: 0};

    /** 清除运行时派生数据并保留搜索上下文，等用户恢复宿主状态后可以原位重试。 */
    private handleKernelAccessFailure(kind: "auth" | "permission"): void {
        this.library?.invalidateIndex();
        this.previewCache?.clear();
        this.missingSources.clear();
        this.lastHealthPrefetch = 0;

        const t = this.i18nFn();
        const message = t(kind === "auth" ? "kernelAuthRequired" : "kernelPermissionDenied");
        this.searchDialog?.showKernelAccessIssue(kind, message);
        const now = Date.now();
        if (now - this.accessFailureNoticeAt[kind] >= 4_000) {
            this.accessFailureNoticeAt[kind] = now;
            this.notify("error", message);
        }
    }

    /** 列表来源失效预检（批量一次 checkBlocksExist；不阻塞渲染，喂完徽标即重绘当前列表）。
     *  节流 5s：防止逐键搜索连发内核调用；R166 真机发现 30s 节流 + 不重绘会让失效警告
     *  滞后到「下次搜索且超节流窗口」才可见——违反「来源删除必须可见」约束，现最坏滞后一个预检周期。 */
    private async prefetchSourceHealth(entries: Array<{sourceDocId?: string; sourceBlockId?: string}>): Promise<void> {
        const now = Date.now();
        if (now - this.lastHealthPrefetch < 5_000) return;
        this.lastHealthPrefetch = now;
        const ids = new Set<string>();
        for (const e of entries.slice(0, 100)) {
            if (e.sourceBlockId) ids.add(e.sourceBlockId);
            if (e.sourceDocId) ids.add(e.sourceDocId);
        }
        if (ids.size === 0) return;
        try {
            const map = parseExistingMap(await this.kernelClient.request("checkBlocksExist", {ids: Array.from(ids)}));
            this.missingSources = new Set(Object.entries(map).filter(([, ok]) => !ok).map(([id]) => id));
            // 重绘走保滚动位刷新；预检已被节流挡住，不会递归
            this.notifyExternalDataChange();
        } catch {
            // 预检失败不打扰用户：徽标缺席，打开来源时仍有实时校验兜底
        }
    }

    private persistSoon(): void {
        if (this.saveTimer) clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => {
            this.persistSidecar(STORAGE_KEYS.state, this.state);
        }, 400);
    }

    /** 侧车写入必须消费 Promise；失败时给出可见回执，避免 unhandled rejection。 */
    private persistSidecar(key: string, value: unknown, notifyFailure = true): void {
        if (key === STORAGE_KEYS.state && !this.sidecarStateWritable) {
            if (notifyFailure) this.notify("error", this.i18nFn()("sidecarReadOnly"));
            return;
        }
        // 对齐 SiYuan Issue #19908 存储写入契约：
        // 1. 负数错误码或网络异常可能使 Promise 持续挂起，增加 5 秒超时保护；
        // 2. 检查返回响应 code，不能仅将兑现视为写入成功。
        const timeoutPromise = new Promise<{code: number; msg: string}>((_, reject) => {
            setTimeout(() => reject(new Error("sidecar save timed out")), 5000);
        });
        void Promise.race([this.saveData(key, value), timeoutPromise])
            .then((res: unknown) => {
                const response = res as {code?: number; msg?: string} | undefined;
                if (response && typeof response.code === "number" && response.code !== 0) {
                    throw new Error(response.msg || `saveData failed with code ${response.code}`);
                }
            })
            .catch((err) => {
                if (notifyFailure) {
                    const detail = toErrorMessage(err);
                    this.notify("error", this.i18nFn()("kernelError", detail || "sidecar save failed"));
                }
            });
    }

    // ---- 命令与入口 ----

    private registerCommands(): void {
        const t = this.i18nFn();
        this.addCommand({
            langKey: "open",
            hotkey: "⌥⇧C",
            callback: () => this.openSearch(),
        });
        // 系统全局热键呼出常用语迷你条（跨软件/思源后台最小化可用 · CAND-027 / TODO-FEAT-022）
        this.addCommand({
            langKey: "globalQuickMini",
            hotkey: "⌥⇧M",
            globalCallback: () => this.handleGlobalQuickMini(),
            callback: () => this.handleGlobalQuickMini(),
        });
        this.addCommand({
            langKey: "toggleDock",
            hotkey: "⌥⇧D",
            callback: () => {
                if (this.host.isMobile()) {
                    this.notify("info", "移动端模式暂不支持侧边栏，请使用 Alt+Shift+C 呼出搜索面板");
                    return;
                }
                const dockBtn = typeof document !== "undefined"
                    ? document.querySelector<HTMLElement>('[data-type$="xiaolv-common-dock"]')
                    : null;
                if (dockBtn) {
                    dockBtn.click();
                } else {
                    this.notify("info", "侧边栏按钮未在当前布局显示，请在右侧面板栏或外观设置中启用「小驴常用」Dock");
                }
            },
        });
        this.addCommand({
            langKey: "pasteQueueNext",
            hotkey: "⌥⇧Q",
            callback: async () => {
                const result = await outputNextPasteQueueItem(this.host);
                if (result.reason === "empty") {
                    this.notify("info", this.i18nFn()("pasteQueueEmpty"));
                    return;
                }
                if (!result.ok) {
                    if (result.reason !== "busy") this.notify("error", result.reason === "queue-changed"
                        ? "输出期间队列已变化，请核实已输出内容；没有移除新队首。"
                        : "输出失败，条目仍在队首，请核实编辑器或剪贴板后重试。");
                    return;
                }
                this.notify("info", this.i18nFn()("pasteQueuePopped", result.item!.title, String(result.remaining)));
            },
        });
        this.addCommand({
            langKey: "surroundSelection",
            hotkey: "⌥⇧W",
            callback: () => {
                const sel = typeof window !== "undefined" ? window.getSelection()?.toString().trim() : "";
                if (!sel) {
                    this.notify("info", this.i18nFn()("surroundNoSelection"));
                    return;
                }
                this.openSearch(undefined, undefined, sel);
            },
        });
        this.addCommand({
            langKey: "saveSelection",
            hotkey: "⌥⇧S",
            callback: () => void this.capture?.saveSelection(),
        });
        this.addCommand({
            langKey: "saveClipboard",
            callback: () => void this.capture?.captureFromClipboard(),
        });
        this.addCommand({
            langKey: "quickCapture",
            hotkey: "⌥⇧V",
            callback: () => void this.capture?.quickCaptureFromClipboard(),
        });
        this.addCommand({
            // 手动新建也进入命令面板，给不在编辑器上下文里的用户一条明确入口。
            langKey: "newItem",
            hotkey: "⌥⇧N",
            callback: () => void this.capture?.newManual(),
        });
        this.addCommand({
            langKey: "captureBlock",
            hotkey: "⌥⇧B",
            callback: () => void this.capture?.captureCurrentBlock(),
        });
        this.addCommand({
            langKey: "captureDoc",
            callback: () => void this.capture?.captureCurrentDoc(),
        });
        this.addCommand({
            langKey: "insertCmd",
            callback: () => this.openSearch(undefined, undefined, undefined, "insert"),
        });
        this.addCommand({
            langKey: "copyCmd",
            callback: () => this.openSearch(undefined, undefined, undefined, "copy"),
        });
        this.addCommand({
            langKey: "openSourceCmd",
            callback: () => this.openSearch(undefined, undefined, undefined, "openSource"),
        });
        this.addCommand({
            langKey: "openClipboardHistory",
            hotkey: "⌥⇧H",
            callback: () => this.openSearch(undefined, undefined, undefined, undefined, "clipboard"),
        });
        this.addCommand({
            langKey: "discoverCurrentDocument",
            callback: () => this.openDiscoveryForCurrentDocument(),
        });
        this.addCommand({
            langKey: "discoverCurrentNotebook",
            callback: () => this.openDiscoveryForCurrentDocument("notebook"),
        });
        this.addCommand({
            langKey: "openLibraryDoc",
            callback: () => {
                this.openLibraryDocument();
            },
        });
        void t;
    }

    /** 在思源编辑器中直接打开当前配置的常用库文档（或定位指定库块）。 */
    public openLibraryDocument(blockId?: string): boolean {
        if (blockId && isBlockId(blockId)) {
            return this.host.openDoc("", blockId);
        }
        const cfg = this.config;
        if (!cfg) {
            this.openSetup();
            return false;
        }
        const firstDocId = cfg.containerDocIds[0];
        if (firstDocId && isBlockId(firstDocId)) {
            return this.host.openDoc(firstDocId);
        }
        const idx = this.library?.getIndex();
        const fallbackDocId = idx?.entries[0]?.libraryDocId;
        if (fallbackDocId && isBlockId(fallbackDocId)) {
            return this.host.openDoc(fallbackDocId);
        }
        this.notify("info", "当前为笔记本模式且尚无条目，请先新建一条常用内容以定位库文档");
        return false;
    }

    /** 划选浮动工具栏点击：智能感知当前活动选区 */
    private handleToolbarClick(): void {
        const selectedText = typeof window !== "undefined" ? window.getSelection()?.toString().trim() : "";
        if (selectedText) {
            // 如果划选的内容较长（如超过 120 字符）或包含换行，说明用户意图大概率是保存大段模板/文章
            if (selectedText.length > 120 || selectedText.includes("\n")) {
                void this.capture?.saveSelection();
            } else {
                // 简短词句（如“产业”）：直接弹出搜索弹窗并自动填入选定内容，立等检索并支持一键新建
                this.openSearch(undefined, selectedText);
            }
        } else {
            this.openSearch();
        }
    }

    /**
     * 编辑器工具栏入口（官方 Plugin.updateProtyleToolbar 覆写；宿主渲染工具栏时回调）。
     * 桌面/移动通用：给编辑器工具栏加「常用」按钮，严格去重防双胞胎图标。
     */
    public updateProtyleToolbar(toolbar: Array<string | IMenuItem>): Array<string | IMenuItem> {
        try {
            if (toolbar.some((item) => typeof item === "object" && item && item.name === "xiaolv-common-toolbar")) {
                return toolbar;
            }
            return [...toolbar, {
                name: "xiaolv-common-toolbar",
                icon: "iconXlcCommon",
                tip: this.i18nFn()("openSearch"),
                click: () => this.handleToolbarClick(),
            }];
        } catch {
            return toolbar;
        }
    }

    private registerEntries(): void {
        try {
            // 思源编辑器内联斜杠菜单（protyleSlash）：在笔记中输入 /常用、/cy、/xiaolv 直接就地唤起
            this.protyleSlash = [
                {
                    filter: ["常用", "常用语", "xiaolv", "cy", "changyong", "xlc", "snippet", "snippets"],
                    html: `<div class="b3-list-item__first"><span class="b3-list-item__text">${this.i18nFn()("openSearch") || "小驴常用：搜索与插入常用语"}</span><span class="b3-list-item__meta">⌥⇧C</span></div>`,
                    id: "xiaolv-common-slash-search",
                    callback: (protyle: any) => {
                        this.host?.recordActiveEditor(protyle);
                        this.openSearch();
                    },
                },
                {
                    filter: ["剪贴板历史", "剪贴板", "jtb", "clip", "clipboard", "lsjtb"],
                    html: `<div class="b3-list-item__first"><span class="b3-list-item__text">${this.i18nFn()("openClipboardHistory") || "小驴常用：查看剪贴板历史"}</span><span class="b3-list-item__meta">⌥⇧H</span></div>`,
                    id: "xiaolv-common-slash-clip-history",
                    callback: (protyle: any) => {
                        this.host?.recordActiveEditor(protyle);
                        this.openSearch(undefined, undefined, undefined, undefined, "clipboard");
                    },
                },
                {
                    filter: ["新建常用", "新建常用语", "xjcy", "new-snippet"],
                    html: `<div class="b3-list-item__first"><span class="b3-list-item__text">${this.i18nFn()("newItem") || "小驴常用：新建常用语"}</span><span class="b3-list-item__meta">⌥⇧N</span></div>`,
                    id: "xiaolv-common-slash-new",
                    callback: (protyle: any) => {
                        this.host?.recordActiveEditor(protyle);
                        void this.capture?.newManual();
                    },
                },
                {
                    filter: ["快速保存剪贴板", "保存剪贴板", "ksbz", "jtb", "quick-clip"],
                    html: `<div class="b3-list-item__first"><span class="b3-list-item__text">${this.i18nFn()("quickCapture") || "小驴常用：从剪贴板快速保存"}</span><span class="b3-list-item__meta">⌥⇧V</span></div>`,
                    id: "xiaolv-common-slash-clip",
                    callback: (protyle: any) => {
                        this.host?.recordActiveEditor(protyle);
                        void this.capture?.quickCaptureFromClipboard();
                    },
                },
            ];
            void this.updateProtyleSlash();
        } catch {
            // 旧宿主降级保护
        }
        try {
            const topBarEl = this.addTopBar({
                icon: "iconXlcCommon",
                title: `${this.i18nFn()("openSearch")} (Alt+Shift+N / Alt+Shift+V)`,
                callback: () => this.openSearch(),
                position: "right",
                // 官方 contextMenu 通道：右键「快捷访问面板」并入思源原生顶栏条目菜单，
                // 不再自建 contextmenu 监听拦截原生菜单（3.8.x 的固定/隐藏条目管理得以保留）
                contextMenu: (menu) => {
                    if (!menu || typeof menu.addItem !== "function") return;
                    menu.addItem({
                        iconHTML: "",
                        label: "⚡ 常用快捷访问面板",
                        click: () => void this.openQuickAccessPopover(),
                    });
                },
            });
            this.topBarElement = topBarEl;
            this.syncLaunchpadRegistry();
        } catch {
            // 旧宿主无此 API：命令面板仍可用
        }
        try {
            // 文档面包屑入口（官方 addBreadcrumbButton；callback 带该页签 protyle）：
            // 插入目标 = 当前活动编辑器，从面包屑点入时通常即该文档
            this.addBreadcrumbButton({
                id: "xiaolv-common-breadcrumb",
                icon: "iconXlcCommon",
                title: `${this.i18nFn()("openSearch")} (小驴常用)`,
                callback: () => this.openSearch(),
            });
        } catch {
            // 旧宿主无此 API：顶栏/命令入口仍可用
        }
        try {
            // 编辑器右键菜单：基于划选状态智能上下文分流，杜绝菜单过度平铺臃肿
            this.menuHandler = (event) => {
                if (!event?.detail?.menu) return;
                const {menu} = event.detail;
                const sel = typeof window !== "undefined" ? window.getSelection()?.toString().trim() : "";
                if (sel) {
                    // 有选区时：高亮呈现选区包裹与划选保存
                    menu.addItem({
                        icon: "iconXlcCommon",
                        label: this.i18nFn()("surroundSelection"),
                        click: () => this.openSearch(undefined, undefined, sel),
                    });
                    menu.addItem({
                        icon: "iconXlcCommon",
                        label: this.i18nFn()("saveSelection"),
                        click: () => void this.capture?.saveSelection(),
                    });
                } else {
                    // 无选区时：呈现常用调用、当前块捕获与文档发现
                    menu.addItem({
                        icon: "iconXlcCommon",
                        label: this.i18nFn()("insertMenu"),
                        click: () => this.openSearch(),
                    });
                    menu.addItem({
                        icon: "iconXlcCommon",
                        label: this.i18nFn()("captureBlock"),
                        click: () => void this.capture?.captureCurrentBlock(),
                    });
                    menu.addItem({
                        icon: "iconXlcCommon",
                        label: this.i18nFn()("discoverCurrentDocument"),
                        click: () => this.openDiscoveryForCurrentDocument(),
                    });
                }
            };
            this.eventBus.on("open-menu-content", this.menuHandler);
            // 块引用右键：把被引用块存为 blockref 条目（官方 detail.element data-id）
            this.blockRefMenuHandler = (event) => {
                if (!event?.detail?.menu) return;
                const {menu, element} = event.detail;
                const blockId = element?.getAttribute?.("data-id") ?? "";
                if (!blockId || !element) return;
                menu.addItem({
                    icon: "iconXlcCommon",
                    label: this.i18nFn()("captureBlockRefMenu"),
                    click: () => this.capture?.captureBlockRef(blockId, element.textContent ?? ""),
                });
            };
            this.eventBus.on("open-menu-blockref", this.blockRefMenuHandler);
            // 链接右键：http(s)/assets 存为 URL/资源条目（其余协议诚实拒绝）
            this.linkMenuHandler = (event) => {
                if (!event?.detail?.menu) return;
                const {menu, element} = event.detail;
                const href = element?.getAttribute?.("href") ?? "";
                if (!href || !element) return;
                menu.addItem({
                    icon: "iconXlcCommon",
                    label: this.i18nFn()("captureLinkMenu"),
                    click: () => this.capture?.captureLink(href, element.textContent ?? ""),
                });
            };
            this.eventBus.on("open-menu-link", this.linkMenuHandler);
            // 图片右键：把图片存为图片条目（官方 detail.element = assetElement，src 即 assets/ 路径）
            this.imageMenuHandler = (event) => {
                if (!event?.detail?.menu) return;
                const {menu, element} = event.detail;
                const src = element?.getAttribute?.("src") ?? "";
                const target = classifyLinkTarget(src.startsWith("assets/") ? src : "");
                if (!target) return;
                menu.addItem({
                    icon: "iconXlcCommon",
                    label: this.i18nFn()("captureImageMenu"),
                    click: () => this.capture?.captureImage(target.value, element?.getAttribute?.("title") ?? ""),
                });
            };
            this.eventBus.on("open-menu-image", this.imageMenuHandler);
            // 文档树右键：把选中文档一键设为常用库文档（doc 模式；多选取前 64 个）
            this.docTreeMenuHandler = (event) => {
                if (!event?.detail?.menu) return;
                const {menu, elements, type, items} = event.detail;
                if (type !== "items" && type !== "doc" && type !== "docs" && type !== undefined) return;
                const ids: string[] = [];
                if (type === "doc" || type === "docs") {
                    for (const item of items ?? []) {
                        if (isBlockId(item?.id) && ids.length < 64) ids.push(item.id);
                    }
                } else {
                    for (const el of elements ?? []) {
                        const id = el?.getAttribute?.("data-node-id") ?? "";
                        if (id && ids.length < 64) ids.push(id);
                    }
                }
                if (ids.length === 0) return;
                const treeTarget = getSingleDocTreeDiscoveryTarget(type, items);
                // 插入定向入口：打开搜索弹窗（定向模式，Enter 插入到首个选中文档）
                menu.addItem({
                    icon: "iconXlcCommon",
                    label: this.i18nFn()("insertToDocMenu"),
                    click: () => {
                        const docId = ids[0];
                        if (!docId) return;
                        void this.library.getDocPath(docId).then((path) => {
                            this.openSearch({docId, hPath: path});
                        }).catch((err) => this.notify("error", this.i18nFn()("kernelError", toErrorMessage(err))));
                    },
                });
                if (treeTarget) {
                    menu.addItem({
                        icon: "iconXlcCommon",
                        label: this.i18nFn()("discoveryFromTreeMenu"),
                        click: () => this.openDiscoveryForTreeRoot(treeTarget),
                    });
                }
                menu.addItem({
                    icon: "iconXlcCommon",
                    label: this.i18nFn()("setAsLibraryMenu"),
                    click: () => {
                        confirm("⚠️ " + this.i18nFn()("setupTitle"), this.i18nFn()("setAsLibraryConfirm", String(ids.length)), () => {
                            this.applyConfig({
                                configVersion: CONFIG_VERSION,
                                mode: "doc",
                                notebookIds: [],
                                containerDocIds: ids,
                                createdDocIds: [],
                                configuredAt: Date.now(),
                            });
                            // 不新建文档，是「设为常用库」——文案不得用「已创建」（R138）
                            this.notify("info", this.i18nFn()("libDocSet", String(ids.length)));
                        });
                    },
                });
            };
            this.eventBus.on("open-menu-doctree", this.docTreeMenuHandler);
            // 思源块标菜单（click-blockicon）：支持单块/多块框选收录、存为跟随原块的块引用、已入库块直接编辑
            this.blockIconMenuHandler = (event) => {
                const {menu, blockElements, protyle} = event.detail ?? ({} as any);
                if (!menu || typeof menu.addItem !== "function") return;
                const elements = Array.from(blockElements ?? []).filter((el): el is HTMLElement => Boolean(el));
                const blockIds = elements
                    .map((el) => el.getAttribute?.("data-node-id") ?? "")
                    .filter((id) => isBlockId(id));
                if (blockIds.length === 0) return;
                const docId = protyle?.block?.rootID || this.host?.currentDocId() || null;
                const firstBlockId = blockIds[0]!;
                const firstEl = elements[0];
                const customLogicalId = firstEl?.getAttribute?.("custom-xlc-id") ?? "";
                const idx = this.library?.getIndex();
                const matchedEntry = idx?.entries.find((e) =>
                    (customLogicalId && e.id === customLogicalId)
                    || e.blockId === firstBlockId
                    || e.targetBlockId === firstBlockId
                    || e.sourceBlockId === firstBlockId
                );
                if (matchedEntry && blockIds.length === 1) {
                    menu.addItem({
                        icon: "iconXlcCommon",
                        label: `在小驴常用中编辑「${shortTitle(matchedEntry.title || matchedEntry.id)}」`,
                        click: () => {
                            void this.library.getItem(matchedEntry.id).then((got) => {
                                if (got.ok) void this.openEditDialog(got.data);
                                else this.notify("error", got.message);
                            });
                        },
                    });
                }
                const isInLibraryDoc = Boolean(docId && this.config?.containerDocIds.includes(docId));
                if (isInLibraryDoc && !matchedEntry) {
                    menu.addItem({
                        icon: "iconXlcCommon",
                        label: `原地纳管为小驴常用条目（共 ${blockIds.length} 块，不复制块）`,
                        click: () => {
                            void this.library.adoptUnmanagedLibraryBlocks(blockIds).then((res) => {
                                if (res.ok) {
                                    this.notify("info", `已原地纳管 ${res.data.adopted} 个库文档块`);
                                    this.notifyExternalDataChange();
                                } else {
                                    this.notify("error", res.message);
                                }
                            });
                        },
                    });
                } else if (blockIds.length > 1) {
                    menu.addItem({
                        icon: "iconXlcCommon",
                        label: `合并选中的 ${blockIds.length} 个块存入小驴常用`,
                        click: () => void this.capture?.captureBlocksById(blockIds, docId),
                    });
                } else {
                    menu.addItem({
                        icon: "iconXlcCommon",
                        label: this.i18nFn()("captureBlock") || "存入小驴常用（复制块正文）",
                        click: () => void this.capture?.captureBlocksById(blockIds, docId),
                    });
                    menu.addItem({
                        icon: "iconXlcCommon",
                        label: this.i18nFn()("captureBlockRefMenu") || "存为小驴块引用（跟随原块实时变化）",
                        click: () => this.capture?.captureBlockRef(firstBlockId, firstEl?.textContent ?? "", docId),
                    });
                }
            };
            this.eventBus.on("click-blockicon" as any, this.blockIconMenuHandler as any);
            // 文档标题图标菜单（click-editortitleicon）：定向插入到本文档、扫描本文档候选、库文档手写块一键纳管
            this.editorTitleMenuHandler = (event) => {
                const {menu, data, protyle} = event.detail ?? ({} as any);
                if (!menu || typeof menu.addItem !== "function") return;
                const docId = data?.id || data?.rootID || protyle?.block?.rootID || this.host?.currentDocId() || "";
                if (!isBlockId(docId)) return;
                if (this.config?.containerDocIds.includes(docId)) {
                    menu.addItem({
                        icon: "iconXlcCommon",
                        label: "纳管本库文档中手写的新块",
                        click: () => {
                            void this.library.adoptUnmanagedLibraryBlocks().then((res) => {
                                if (res.ok) {
                                    this.notify("info", res.data.adopted > 0
                                        ? `已原地纳管 ${res.data.adopted} 个手写新块`
                                        : "当前库文档无待纳管的新块");
                                    this.notifyExternalDataChange();
                                } else {
                                    this.notify("error", res.message);
                                }
                            });
                        },
                    });
                }
                menu.addItem({
                    icon: "iconXlcCommon",
                    label: this.i18nFn()("insertToDocMenu") || "从小驴常用插入到此文档…",
                    click: () => {
                        void this.library.getDocPath(docId).then((path) => {
                            this.openSearch({docId, hPath: path || data?.name || docId});
                        }).catch((err) => this.notify("error", this.i18nFn()("kernelError", toErrorMessage(err))));
                    },
                });
                menu.addItem({
                    icon: "iconXlcCommon",
                    label: this.i18nFn()("discoverCurrentDocument") || "扫描本文档发现常用候选…",
                    click: () => this.openDiscoveryForCurrentDocument("document"),
                });
            };
            this.eventBus.on("click-editortitleicon" as any, this.editorTitleMenuHandler as any);
            // 页签切换与静态加载联动：记录最近活动 Protyle 编辑器并刷新「当前文档」范围与插入目标
            this.switchProtyleHandler = (event) => {
                const raw = (event?.detail?.protyle ?? event?.detail ?? (event as any)?.protyle) as any;
                if (raw) {
                    const normalized = raw.protyle ? raw : (raw.block?.rootID ? {protyle: raw} : raw);
                    this.host?.recordActiveEditor(normalized);
                }
                this.searchDialog?.syncActiveContextAfterTabSwitch();
            };
            this.eventBus.on("switch-protyle" as any, this.switchProtyleHandler as any);
            this.eventBus.on("loaded-protyle-static" as any, this.switchProtyleHandler as any);
            // 思源内核事务监听（ws-main）：用户在思源编辑器直接修改库文档或被引用源块时，自动无感同步到 Dock 与主搜索
            this.wsMainHandler = (event) => {
                const cmd = event?.detail?.cmd;
                if (cmd !== "transactions" && cmd !== "savedoc" && cmd !== "rename") return;
                if (!this.config || !this.library) return;
                const idx = this.library.getIndex();
                const currentDocId = this.host?.currentDocId() ?? "";
                const libDocIds = new Set<string>(this.config.containerDocIds);
                const watchedIds = new Set<string>(this.config.containerDocIds);
                if (idx) {
                    for (const e of idx.entries) {
                        if (e.libraryDocId) {
                            libDocIds.add(e.libraryDocId);
                            watchedIds.add(e.libraryDocId);
                        }
                        if (e.blockId) watchedIds.add(e.blockId);
                        if (e.sourceBlockId) watchedIds.add(e.sourceBlockId);
                        if (e.targetBlockId) watchedIds.add(e.targetBlockId);
                        if (e.sourceDocId) watchedIds.add(e.sourceDocId);
                    }
                }
                let relevant = Boolean(currentDocId && libDocIds.has(currentDocId));
                if (!relevant && Array.isArray(event?.detail?.data)) {
                    for (const tx of event.detail.data as Array<{doOperations?: Array<{id?: string; parentID?: string}>}>) {
                        for (const op of tx?.doOperations ?? []) {
                            if ((op?.id && watchedIds.has(op.id)) || (op?.parentID && watchedIds.has(op.parentID))) {
                                relevant = true;
                                break;
                            }
                        }
                        if (relevant) break;
                    }
                }
                if (!relevant) return;
                if (this.wsSyncTimer) clearTimeout(this.wsSyncTimer);
                this.wsSyncTimer = setTimeout(() => {
                    this.wsSyncTimer = null;
                    if (this.unloading) return;
                    this.library?.invalidateIndex();
                    this.invalidatePreviewCache();
                    this.notifyExternalDataChange();
                }, 320);
            };
            this.eventBus.on("ws-main" as any, this.wsMainHandler as any);
        } catch {
            // 事件契约变化时降级：右键入口缺席，其余入口仍可用
        }
        try {
            if (!this.host.isMobile()) {
                this.addDock({
                    config: {
                        position: "RightTop",
                        size: { width: 300, height: 0 },
                        icon: "iconXlcCommon",
                        title: this.i18nFn()("pluginName") || "小驴常用",
                    },
                    data: {},
                    type: "xiaolv-common-dock",
                    init: (custom: any) => {
                        this.mountDockView(custom.element as HTMLElement);
                    },
                    destroy: () => {
                        this.dockView?.destroy();
                        this.dockView = null;
                    },
                });
            }
        } catch {
            // 宿主无 addDock API 保护
        }
    }

    /** 挂载侧边栏视图实例（供宿主 addDock.init 与真机端到端回归复用同一生产装配）。 */
    public mountDockView(element: HTMLElement): DockView {
        this.dockView?.destroy();
        this.dockView = new DockView(element, this.buildDockDeps());
        return this.dockView;
    }

    /** 侧栏与主搜索共用同一执行与变量填充路径（executor.run + openVariableFillCard + 变量记忆）。 */
    private async runDockItemAction(
        itemId: string,
        mode: InsertMode,
        fills?: Record<string, string>,
    ): Promise<{ok: boolean; message: string}> {
        const got = await this.library.getItem(itemId);
        if (!got.ok) return {ok: false, message: got.message};
        const item = got.data;
        if (!fills && mode !== "insert-ref" && mode !== "insert-embed" && this.state.insert.promptVariables && item.itemType !== "code") {
            const kd = await this.library.getItemKramdown(item);
            if (kd.ok) {
                const expanded = await this.library.expandSnippetRefs(kd.data);
                const fields = listAskFields(expanded);
                if (fields.length > 0) {
                    const labels = fields.map((f) => f.name);
                    return new Promise((resolve) => {
                        let settled = false;
                        const finish = (res: {ok: boolean; message: string}) => {
                            if (settled) return;
                            settled = true;
                            resolve(res);
                        };
                        openVariableFillCard({
                            t: this.i18nFn(),
                            itemType: item.itemType,
                            title: item.title,
                            fields,
                            defaults: collectDefaults(this.state.variableMemory, labels),
                            templateText: expanded,
                            itemId: item.id,
                            onConfirm: (filled) => {
                                try {
                                    this.state.variableMemory = rememberValues(this.state.variableMemory, filled, Date.now());
                                    this.persistSoon();
                                } catch {}
                                void this.runDockItemAction(itemId, mode, filled).then(finish);
                            },
                            onCopy: async (filled) => {
                                try {
                                    this.state.variableMemory = rememberValues(this.state.variableMemory, filled, Date.now());
                                    this.persistSoon();
                                } catch {}
                                const copied = await this.runDockItemAction(itemId, "copy", filled);
                                finish(copied);
                                return copied.ok;
                            },
                            onCancel: () => finish({ok: false, message: ""}),
                        });
                    });
                }
            }
        }
        const receipt = await this.executor.run(item, mode, fills ? {fills} : undefined);
        const msg = receipt.ok
            ? this.receiptText(receipt.message, item.title, receipt.pendingVerification)
            : this.receiptText(receipt.message, item.title, receipt.pendingVerification) || this.i18nFn()("kernelError", receipt.message);
        return {ok: receipt.ok, message: msg};
    }

    private buildDockDeps(): DockViewDeps {
        return {
            t: this.i18nFn(),
            notify: (kind, msg) => this.notify(kind, msg),
            search: async (query) => {
                if (!this.library) {
                    return {entries: [], truncated: false, total: 0};
                }
                const loading = !this.library.getIndex();
                const idx = await this.library.ensureIndex(5 * 60_000);
                const results = searchEntries(idx.entries, query, this.searchContext());
                const entries = results.map((r) => r.entry);
                void this.prefetchSourceHealth(entries);
                const error = entries.length === 0 && idx.errors.length > 0 ? idx.errors[0] : undefined;
                return {entries, truncated: idx.truncated, total: idx.entries.length, loading, error};
            },
            preview: async (itemId) => {
                const cached = this.previewCache.get(itemId);
                if (cached !== undefined) return cached;
                const got = await this.library.getItem(itemId);
                if (!got.ok) return "";
                const kd = await this.library.getItemKramdown(got.data);
                return kd.ok ? await this.library.expandSnippetRefs(kd.data) : "";
            },
            runAction: async (itemId, mode) => this.runDockItemAction(itemId, mode),
            runActionWithFills: async (itemId, mode, fills) => this.runDockItemAction(itemId, mode, fills),
            toggleFavorite: (itemId) => {
                const fav = this.service.toggleFavorite(itemId);
                this.notifyExternalDataChange();
                return fav;
            },
            isFavorite: (itemId) => this.state.favorites.includes(itemId),
            copyText: async (text) => {
                const html = isMarkdownFormattingPresent(text) ? renderSafeHtmlFromMarkdown(text) : undefined;
                return this.host.writeClipboard(text, html);
            },
            copyProviderPayload: async (text) => {
                const html = isMarkdownFormattingPresent(text) ? renderSafeHtmlFromMarkdown(text) : undefined;
                return this.host.writeClipboard(text, html);
            },
            openSource: async (itemId) => {
                const res = await this.service.openSource(itemId);
                return {ok: res.ok, message: res.message ?? ""};
            },
            newItem: (initialTitle) => void this.capture?.newManual(initialTitle),
            openSettings: () => this.openSetting(),
            openLibraryDoc: () => {
                this.openLibraryDocument();
            },
            adoptLibraryBlocks: async () => {
                const res = await this.library.adoptUnmanagedLibraryBlocks();
                if (res.ok && res.data.adopted > 0) {
                    this.notify("info", `已自动纳管库文档中手写的 ${res.data.adopted} 个新块`);
                }
            },
            getUsage: () => this.state.usage,
            isSourceMissing: (entry) => {
                const block = entry.sourceBlockId;
                const doc = entry.sourceDocId;
                return (!!block && this.missingSources.has(block)) || (!!doc && this.missingSources.has(doc) && !entry.sourceBlockId);
            },
            hasActiveEditor: () => this.host.hasActiveEditor(),
            editItem: async (itemId) => {
                const got = await this.library.getItem(itemId);
                if (!got.ok) {
                    this.notify("error", got.message);
                    return;
                }
                this.openEditDialog(got.data);
            },
            getCustomOrder: () => this.state.customItemOrder ?? {},
            setCustomOrder: (ord) => {
                this.state.customItemOrder = ord;
                this.persistSoon();
            },
        };
    }

    /** 统一通知搜索弹窗与 Dock 侧边栏进行无感差量刷新 */
    private notifyExternalDataChange(): void {
        this.searchDialog?.refreshAfterExternalChange();
        void this.dockView?.refresh();
        void this.updateProtyleSlash();
        this.syncLaunchpadRegistry();
    }

    /** 同步向小驴罗盘注册的插件状态与动态条目数徽标 (Epoch 7 Phase 5) */
    public syncLaunchpadRegistry(): void {
        try {
            const count = this.library?.getIndex()?.items?.size;
            const badge = count !== undefined ? `常用 ${count} 项` : "常用";
            this.launchpadCleaner = lvLaunchpad.register({
                id: "xiaolv-common",
                name: "常用",
                fullName: "小驴常用",
                svgIcon: "iconLvCommon",
                color: "#14b8a6",
                desc: "常用片段 · 宏模版",
                digit: 8,
                badge,
                badgeType: "primary",
                actions: ["打开片段搜索", "复制置顶片段", "从剪贴板保存片段", "查看剪贴板历史"],
                topBarElement: this.topBarElement,
                onClick: () => this.openCommonPanel(),
                onAction: (action) => this.handleQuickAction(action),
            });
        } catch {
            // 环境防御
        }
    }

    /** 动态更新思源编辑器斜杠菜单（protyleSlash）：自动将包含简码、别名、常用或高频的条目注册为行内斜杠项 */
    public async updateProtyleSlash(): Promise<void> {
        const baseSlash = [
            {
                filter: ["常用", "常用语", "xiaolv", "cy", "changyong", "xlc", "snippet", "snippets"],
                html: `<div class="b3-list-item__first"><span class="b3-list-item__text">${this.i18nFn()("openSearch") || "小驴常用：搜索与插入常用语"}</span><span class="b3-list-item__meta">⌥⇧C</span></div>`,
                id: "xiaolv-common-slash-search",
                callback: (protyle: any) => {
                    this.host?.recordActiveEditor(protyle);
                    this.openSearch();
                },
            },
            {
                filter: ["剪贴板历史", "剪贴板", "jtb", "clip", "clipboard", "lsjtb"],
                html: `<div class="b3-list-item__first"><span class="b3-list-item__text">${this.i18nFn()("openClipboardHistory") || "小驴常用：查看剪贴板历史"}</span><span class="b3-list-item__meta">⌥⇧H</span></div>`,
                id: "xiaolv-common-slash-clip-history",
                callback: (protyle: any) => {
                    this.host?.recordActiveEditor(protyle);
                    this.openSearch(undefined, undefined, undefined, undefined, "clipboard");
                },
            },
            {
                filter: ["新建常用", "新建常用语", "xjcy", "new-snippet"],
                html: `<div class="b3-list-item__first"><span class="b3-list-item__text">${this.i18nFn()("newItem") || "小驴常用：新建常用语"}</span><span class="b3-list-item__meta">⌥⇧N</span></div>`,
                id: "xiaolv-common-slash-new",
                callback: (protyle: any) => {
                    this.host?.recordActiveEditor(protyle);
                    void this.capture?.newManual();
                },
            },
            {
                filter: ["快速保存剪贴板", "保存剪贴板", "ksbz", "jtb", "quick-clip"],
                html: `<div class="b3-list-item__first"><span class="b3-list-item__text">${this.i18nFn()("quickCapture") || "小驴常用：从剪贴板快速保存"}</span><span class="b3-list-item__meta">⌥⇧V</span></div>`,
                id: "xiaolv-common-slash-clip",
                callback: (protyle: any) => {
                    this.host?.recordActiveEditor(protyle);
                    void this.capture?.quickCaptureFromClipboard();
                },
            },
        ];

        if (!this.library) {
            this.protyleSlash = baseSlash;
            return;
        }

        try {
            const idx = this.library.getIndex() ?? await this.library.ensureIndex(60_000);
            const dynamicSlash: typeof baseSlash = [];
            const safeEscape = (s: string) => (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

            const candidateEntries = (idx.entries || []).filter((e) => {
                const u = this.state.usage[e.id];
                const count = typeof u === "number" ? u : (u?.count ?? 0);
                return Boolean(e.shortcode || e.alias || count > 0 || this.state.favorites.includes(e.id));
            }).slice(0, 60);

            for (const entry of candidateEntries) {
                const filters = new Set<string>();
                if (entry.shortcode) {
                    const cleanSc = entry.shortcode.replace(/^[:;；]/, "").trim().toLowerCase();
                    if (cleanSc) filters.add(cleanSc);
                }
                if (entry.alias) {
                    const cleanAl = entry.alias.trim().toLowerCase();
                    if (cleanAl) filters.add(cleanAl);
                }
                if (entry.title) {
                    const cleanTi = entry.title.trim().toLowerCase();
                    if (cleanTi && cleanTi.length <= 16) filters.add(cleanTi);
                }
                if (filters.size === 0) continue;

                const scDisplay = entry.shortcode ? ` [${entry.shortcode}]` : (entry.alias ? ` (${entry.alias})` : "");
                const summaryText = (entry.summary || "").slice(0, 32).replace(/[\r\n\s]+/g, " ");
                dynamicSlash.push({
                    filter: Array.from(filters),
                    html: `<div class="b3-list-item__first"><span class="b3-list-item__text">⚡ ${safeEscape(entry.title)}${safeEscape(scDisplay)}</span><span class="b3-list-item__meta">${safeEscape(summaryText)}</span></div>`,
                    id: `xlc-slash-${entry.id}`,
                    callback: async (protyle: any) => {
                        this.host?.recordActiveEditor(protyle);
                        await this.quickInsertById(entry.id);
                    },
                });
            }

            this.protyleSlash = [...baseSlash, ...dynamicSlash];
        } catch {
            this.protyleSlash = baseSlash;
        }
    }

    /** 通过条目 ID 在当前光标处极速插入（支持变量表单唤起与直接插入） */
    public async quickInsertById(itemId: string): Promise<boolean> {
        if (!this.library || !this.executor) return false;
        const got = await this.library.getItem(itemId);
        if (!got.ok) {
            this.notify("error", got.message);
            return false;
        }
        const item = got.data;
        const kd = await this.library.getItemKramdown(item);
        if (!kd.ok) {
            this.notify("error", kd.message);
            return false;
        }
        const fields = listAskFields(kd.data);
        if (fields.length > 0) {
            openVariableFillCard({
                t: this.i18nFn(),
                itemType: item.itemType,
                title: item.title,
                itemId: item.id,
                templateText: kd.data,
                fields,
                defaults: collectDefaults(this.state.variableMemory, fields.map((f) => f.name)),
                onConfirm: async (fills: Record<string, string>) => {
                    this.state.variableMemory = rememberValues(this.state.variableMemory, fills, Date.now());
                    this.persistSoon();
                    const receipt = await this.executor.run(item, "insert", {fills});
                    if (receipt.ok) {
                        this.recordUsage(item.id);
                        this.service.touchRecent(item.id);
                        this.notify("info", this.receiptText(receipt.message, item.title, receipt.pendingVerification));
                        this.notifyExternalDataChange();
                    } else {
                        this.notify("error", receipt.message);
                    }
                },
                onCopy: async (fills: Record<string, string>) => {
                    const receipt = await this.executor.run(item, "copy", {fills});
                    if (receipt.ok) {
                        this.recordUsage(item.id);
                        this.service.touchRecent(item.id);
                        this.notify("info", this.receiptText(receipt.message, item.title, receipt.pendingVerification));
                    } else {
                        this.notify("error", receipt.message);
                    }
                },
            });
            return true;
        }

        const receipt = await this.executor.run(item, "insert");
        if (receipt.ok) {
            this.recordUsage(item.id);
            this.service.touchRecent(item.id);
            this.notify("info", this.receiptText(receipt.message, item.title, receipt.pendingVerification));
            this.notifyExternalDataChange();
            return true;
        } else {
            this.notify("error", receipt.message);
            return false;
        }
    }

    // ---- 搜索界面 ----

    private searchContext(): SearchContext {
        const sort = this.state.sort;
        return {
            favorites: new Set(this.state.favorites),
            recents: new Map(this.state.recents.map((r) => [r.id, r.usedAt])),
            // 常用排序（F3）：使用计数（侧车，可重建）
            usage: new Map(Object.entries(this.state.usage).map(([id, u]) => [id, u.count])),
            // 手动/置顶 = 收藏序（收藏顺序即置顶顺序）
            manualOrder: sort === "manual" ? new Map(this.state.favorites.map((id, i) => [id, i])) : undefined,
            sort,
            now: Date.now(),
        };
    }

    /** 使用计数（F3）：插入/复制成功 +1；侧车上限由 normalize 兜底 */
    private recordUsage(itemId: string): void {
        if (!this.state.insert.recordUsage) return;
        const current = this.state.usage[itemId];
        this.state.usage[itemId] = {
            count: Math.min((current?.count ?? 0) + 1, 1_000_000),
            lastAt: Date.now(),
        };
        const today = formatLocalDate();
        this.state.dailyUsage ??= {};
        this.state.dailyUsage[today] = Math.min((this.state.dailyUsage[today] ?? 0) + 1, 1_000_000);
        this.persistSoon();
    }

    public recordClipboard(text: string): void {
        if (!this.state.clipboardHistoryEnabled) return;
        this.state.clipboardHistory = pushClipboardHistory(this.state.clipboardHistory, text, this.state.clipboardHistoryLimit ?? 30);
        this.persistSoon();
    }

    private setupClipboardTracking(): void {
        const onCopyCut = (e: ClipboardEvent) => {
            if (!this.state.clipboardHistoryEnabled) return;
            try {
                const text = e.clipboardData?.getData("text/plain") || window.getSelection()?.toString();
                if (text) this.recordClipboard(text);
            } catch {
                // ignore
            }
        };
        const onWindowFocus = async () => {
            if (!this.state.clipboardHistoryEnabled) return;
            try {
                if (navigator.clipboard?.readText && window.isSecureContext) {
                    const txt = await navigator.clipboard.readText();
                    if (txt) this.recordClipboard(txt);
                }
            } catch {
                // ignore
            }
        };
        if (typeof window !== "undefined") {
            window.addEventListener("copy", onCopyCut as any);
            window.addEventListener("cut", onCopyCut as any);
            window.addEventListener("focus", onWindowFocus);
            this.clipboardListenerCleanup = () => {
                window.removeEventListener("copy", onCopyCut as any);
                window.removeEventListener("cut", onCopyCut as any);
                window.removeEventListener("focus", onWindowFocus);
            };
        }
    }

    /** 预览文本的有界可丢弃缓存（60s TTL：同步变更后预览最多陈旧一分钟；插入/复制仍现场取正文） */
    private previewCache = new LruCache<string>(PREVIEW_CACHE_CAPACITY, PREVIEW_CACHE_TTL_MS);
    private previewTasks = new Map<string, Promise<string>>();
    private previewCacheGeneration = 0;

    private invalidatePreviewCache(itemIds?: readonly string[]): void {
        if (!itemIds) {
            this.previewCacheGeneration++;
            this.previewCache.clear();
            this.previewTasks.clear();
            return;
        }
        for (const itemId of new Set(itemIds)) {
            this.previewCache.delete(itemId);
            this.previewTasks.delete(itemId);
        }
    }

    private closeQuickAccessPopover(): void {
        this.quickAccessPopoverDismiss?.();
        this.quickAccessPopoverDismiss = null;
    }

    /** 顶栏图标右键极速气泡卡片（Top 5 收藏与高频项秒取 · CAND-008 / TODO-FEAT-007） */
    private async openQuickAccessPopover(e?: MouseEvent): Promise<void> {
        this.closeQuickAccessPopover();
        const prevFocused = typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null;
        const existing = typeof document !== "undefined" ? document.querySelector(".xlc-quick-popover") : null;
        if (existing) existing.remove();

        let entries: SearchEntry[] = [];
        try {
            const idx = await this.library.ensureIndex(0);
            const allEntries = idx.entries;
            const favSet = new Set(this.state?.favorites ?? []);
            const usage = this.state?.usage ?? {};

            const sorted = [...allEntries].sort((a, b) => {
                const aFav = favSet.has(a.id) ? 1 : 0;
                const bFav = favSet.has(b.id) ? 1 : 0;
                if (aFav !== bFav) return bFav - aFav;
                const aCount = usage[a.id]?.count ?? 0;
                const bCount = usage[b.id]?.count ?? 0;
                return bCount - aCount;
            });
            entries = sorted.slice(0, 5);
        } catch {
            entries = [];
        }

        if (typeof document === "undefined") return;

        const popover = document.createElement("div");
        popover.className = "xlc-quick-popover";
        popover.dataset.xlcControl = "host.quick-popover";
        if (typeof popover.setAttribute === "function") {
            popover.setAttribute("role", "dialog");
            popover.setAttribute("aria-label", "小驴常用极速气泡卡片");
        }

        // 锚点优先级：右键事件目标 > 顶栏按钮（官方 contextMenu 通道无鼠标事件）> 视口左上角兜底
        const anchorRect = (e?.currentTarget as HTMLElement | null)?.getBoundingClientRect?.()
            ?? (this.topBarElement as HTMLElement | null)?.getBoundingClientRect?.();
        const rect = anchorRect ?? {
            left: e?.clientX ?? 0,
            bottom: (e?.clientY ?? 0) + 8,
            right: (e?.clientX ?? 0) + 220,
        };
        const popW = typeof window !== "undefined" ? Math.min(250, Math.max(180, window.innerWidth - 16)) : 250;
        const posX = typeof window !== "undefined" ? Math.max(8, Math.min(rect.right - popW, window.innerWidth - popW - 8)) : 100;
        const posY = typeof window !== "undefined" ? Math.max(8, Math.min(rect.bottom + 6, window.innerHeight - 280)) : 100;

        popover.style.position = "fixed";
        popover.style.left = `${posX}px`;
        popover.style.top = `${posY}px`;
        // 动态层级：跟随思源递增的 window.siyuan.zIndex，保证盖过内容流但不压住原生 dialog/搜索
        try {
            const currentZ = (window as any).siyuan?.zIndex;
            popover.style.zIndex = String(typeof currentZ === "number" ? Math.max(300, currentZ + 20) : 300);
        } catch {
            popover.style.zIndex = "300";
        }

        const head = document.createElement("div");
        head.className = "xlc-quick-popover-head";
        const safeHeadTitle = escapeHtml("🐴 极速常用 (Top 5)");
        head.innerHTML = `<strong>${safeHeadTitle}</strong><button type="button" class="xlc-quick-popover-close" aria-label="关闭">×</button>`;
        head.querySelector(".xlc-quick-popover-close")?.addEventListener("click", () => this.closeQuickAccessPopover());
        popover.appendChild(head);

        const list = document.createElement("div");
        list.className = "xlc-quick-popover-list";

        if (entries.length === 0) {
            const empty = document.createElement("div");
            empty.className = "xlc-quick-popover-empty";
            empty.textContent = "暂无常用条目，点击下方打开常用库";
            list.appendChild(empty);
        } else {
            for (const entry of entries) {
                const itemEl = document.createElement("button");
                itemEl.type = "button";
                itemEl.className = "xlc-quick-popover-item";
                itemEl.dataset.xlcControl = `host.quick-popover.item.${entry.id}`;
                if (typeof itemEl.setAttribute === "function") {
                    itemEl.setAttribute("aria-label", `${entry.title || "条目"} (点击复用)`);
                }
                const isFav = (this.state?.favorites ?? []).includes(entry.id);
                const safeFavBadge = isFav ? "★ " : "";
                const safeTitle = escapeHtml(entry.title || "未命名条目");
                const safeType = escapeHtml(entry.itemType.slice(0, 3).toUpperCase());
                const safeItemType = escapeHtml(entry.itemType);
                itemEl.innerHTML = `<span class="xlc-badge xlc-badge--${safeItemType}">${safeType}</span><span class="xlc-popover-title">${safeFavBadge}${safeTitle}</span>`;
                itemEl.addEventListener("click", async () => {
                    this.closeQuickAccessPopover();
                    const got = await this.library.getItem(entry.id);
                    if (!got.ok) {
                        this.notify("error", "未找到该条目");
                        return;
                    }
                    const hasActive = this.host.hasActiveEditor();
                    const mode = hasActive ? "insert" : "copy";
                    const receipt = await this.executor.run(got.data, mode);
                    if (receipt.message) {
                        this.notify("info", receipt.message);
                    }
                });
                list.appendChild(itemEl);
            }
        }
        popover.appendChild(list);

        const foot = document.createElement("div");
        foot.className = "xlc-quick-popover-foot";
        const allBtn = document.createElement("button");
        allBtn.type = "button";
        allBtn.className = "b3-button b3-button--text xlc-quick-popover-all-btn";
        allBtn.dataset.xlcControl = "host.quick-popover.open-all";
        allBtn.textContent = "🔍 打开全部常用语（默认 Alt+Shift+C）";
        allBtn.addEventListener("click", () => {
            this.closeQuickAccessPopover();
            this.openSearch();
        });
        foot.appendChild(allBtn);
        popover.appendChild(foot);

        const onDismiss = (evt: MouseEvent | KeyboardEvent) => {
            if (evt instanceof KeyboardEvent && evt.key === "Escape") {
                this.closeQuickAccessPopover();
            } else if (evt instanceof MouseEvent && !popover.contains(evt.target as Node)) {
                this.closeQuickAccessPopover();
            }
        };

        const surfaceUnreg = lvSurfaceStack.push({
            id: "xlc-quick-access-popover",
            type: "menu",
            dismiss: () => {
                this.closeQuickAccessPopover();
                return true;
            }
        });

        popover.addEventListener("keydown", (evt) => {
            if (evt.key === "Tab") {
                const focusables = Array.from(popover.querySelectorAll<HTMLElement>("button:not([disabled])"));
                if (focusables.length === 0) return;
                const idx = focusables.indexOf(document.activeElement as HTMLElement);
                if (evt.shiftKey) {
                    if (idx <= 0) {
                        evt.preventDefault();
                        focusables[focusables.length - 1]?.focus();
                    }
                } else {
                    if (idx === -1 || idx >= focusables.length - 1) {
                        evt.preventDefault();
                        focusables[0]?.focus();
                    }
                }
            }
        });

        const cleanup = () => {
            surfaceUnreg();
            document.removeEventListener("mousedown", onDismiss);
            document.removeEventListener("keydown", onDismiss);
            popover.remove();
            try {
                if (prevFocused && document.body.contains(prevFocused)) {
                    prevFocused.focus();
                }
            } catch {
                // 回落忽略
            }
        };

        setTimeout(() => {
            document.addEventListener("mousedown", onDismiss);
            document.addEventListener("keydown", onDismiss);
        }, 50);

        document.body.appendChild(popover);
        this.quickAccessPopoverDismiss = cleanup;
    }

    public handleGlobalQuickMini(): void {
        this.openSearch(undefined, undefined, undefined, "copy", undefined, {
            miniMode: true,
            isGlobalInvocation: true,
            autoMinimizeOnDone: true,
        });
    }

    public returnToBackground(): void {
        try {
            if (typeof window !== "undefined" && (window as any).require) {
                const electron = (window as any).require("electron");
                const win = electron?.remote?.getCurrentWindow?.();
                if (win && typeof win.minimize === "function") {
                    win.minimize();
                    return;
                }
            }
        } catch {}
        if (typeof window !== "undefined") {
            window.blur();
        }
    }

    async importStarterPackDirect(markdown: string): Promise<{ok: boolean; count: number}> {
        if (!this.library) return {ok: false, count: 0};
        try {
            const parsed = parseMarkdownPack(markdown);
            if (parsed.items.length === 0) return {ok: false, count: 0};
            const receipt = await this.importMarkdownItems(parsed.items, "skip");
            if (receipt.created > 0 || receipt.skipped > 0 || receipt.failed === 0) {
                await this.library.ensureIndex(0);
                this.notifyExternalDataChange();
                return {ok: true, count: receipt.created || receipt.total};
            }
            return {ok: false, count: 0};
        } catch {
            return {ok: false, count: 0};
        }
    }

    async createStarterPackDedicatedDoc(pack: StarterPackMeta): Promise<{ok: boolean; count: number; docId?: string; hPath?: string}> {
        if (!this.library || !this.kernelClient) return {ok: false, count: 0};
        try {
            const nbReceipt = await this.library.listNotebooks();
            if (!nbReceipt.ok || nbReceipt.data.length === 0) {
                return {ok: false, count: 0};
            }
            const hubNb = nbReceipt.data.find((n) => /小驴空间|小驴生态统一测试空间|小驴笔记本|小驴常用/.test(n.name || ""));
            const targetNotebookId = this.config?.mode === "notebook"
                ? (this.config.notebookIds?.[0] || hubNb?.id || nbReceipt.data[0]!.id)
                : (hubNb?.id || nbReceipt.data[0]!.id);
            const targetNbMeta = nbReceipt.data.find((n) => n.id === targetNotebookId);
            const isHubNb = Boolean(targetNbMeta && /小驴空间|小驴生态统一测试空间|小驴笔记本/.test(targetNbMeta.name || ""));
            const docTitle = `常用资产 · ${pack.name}`;
            const targetHPath = isHubNb ? `/07-小驴常用/${docTitle}` : `/${docTitle}`;
            const docMd = buildDedicatedDocMarkdown(pack);
            const res = await this.kernelClient.request<string>("createDocWithMd", {
                notebook: targetNotebookId,
                path: targetHPath,
                markdown: docMd,
            });
            if (res) {
                await this.library.ensureIndex(0);
                this.notifyExternalDataChange();
                return {ok: true, count: pack.itemCount, docId: res, hPath: targetHPath};
            }
            return {ok: false, count: 0};
        } catch {
            return {ok: false, count: 0};
        }
    }

    /** 打开搜索弹窗；insertTarget 提供时进入定向插入模式，initialQuery 传入时自动预填搜索输入框，surroundText 传入时进入选区包裹模式，defaultAction 预设主操作模式，initialScope 预设初始检索范围 */
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
        }
    ): void {
        if (!this.library || !this.capture || !this.service) {
            this.notify("error", this.i18nFn()("startupFailed", "services unavailable"));
            return;
        }
        if (!this.sidecarReady) {
            this.notify("info", this.i18nFn()("sidecarLoading"));
            return;
        }
        if (!this.config) {
            this.openSetup();
            return;
        }
        const editorTarget = insertTarget ? null : this.host.captureInsertTarget();
        let targetRuns = 0;
        let dialogClosed = false;
        let targetReleased = false;
        const releaseTargetIfIdle = (): void => {
            if (editorTarget && dialogClosed && targetRuns === 0 && !targetReleased) {
                targetReleased = true;
                this.host.releaseInsertTarget(editorTarget);
            }
        };
        const withEditorTarget = <T>(mode: string, action: () => Promise<T>): Promise<T> => {
            if (!editorTarget || !mode.startsWith("insert")) return action();
            targetRuns += 1;
            let result: Promise<T>;
            try {
                result = action();
            } catch (err) {
                targetRuns -= 1;
                releaseTargetIfIdle();
                throw err;
            }
            return result.finally(() => {
                targetRuns -= 1;
                releaseTargetIfIdle();
            });
        };
        this.searchDialog?.destroy();
        const dialogInstance = new CommonSearchDialog({
            t: this.i18nFn(),
            initialQuery,
            initialScope,
            surroundText,
            defaultActionMode: defaultAction,
            density: this.state.search.density ?? "comfortable",
            onDensityChange: (density) => {
                this.state.search.density = density;
                this.persistSoon();
            },
            miniMode: options?.miniMode !== undefined ? options.miniMode : (this.state.search.miniMode ?? false),
            onMiniModeChange: (mini) => {
                this.state.search.miniMode = mini;
                this.persistSoon();
            },
            isGlobalInvocation: options?.isGlobalInvocation,
            autoMinimizeOnDone: options?.autoMinimizeOnDone,
            onReturnToBackground: () => this.returnToBackground(),
            miniPosition: this.state.search.miniPosition,
            onMiniPositionChange: (pos) => {
                this.state.search.miniPosition = pos;
                this.persistSoon();
            },
            miniCollapsed: this.state.search.miniCollapsed ?? false,
            onMiniCollapsedChange: (collapsed) => {
                this.state.search.miniCollapsed = collapsed;
                this.persistSoon();
            },
            getProfilePresets: () => this.state.profilePresets ?? {},
            getDocumentContext: () => {
                const info = this.host.currentDocInfo();
                return {
                    docId: info?.docId,
                    title: info?.hPath?.split("/").pop() || info?.hPath || "",
                    hPath: info?.hPath,
                };
            },
            importStarterPackDirect: (md) => this.importStarterPackDirect(md),
            createStarterPackDedicatedDoc: (pack) => this.createStarterPackDedicatedDoc(pack),
            notify: (kind, msg) => this.notify(kind, msg),
            search: async (query) => {
                const loading = !this.library.getIndex();
                // SWR：索引超过 5 分钟透明重建（重建期间弹窗状态行显示「正在构建索引…」）
                const idx = await this.library.ensureIndex(5 * 60_000);
                const results = searchEntries(idx.entries, query, this.searchContext());
                const entries = results.map((r) => r.entry);
                void this.prefetchSourceHealth(entries);
                // 全库加载失败时透传首条错误（诚实失败优先于「无条目」）
                const error = entries.length === 0 && idx.errors.length > 0 ? idx.errors[0] : undefined;
                return {entries, truncated: idx.truncated, total: idx.entries.length, loading, error};
            },
            searchDocs: async (k) => {
                const result = await this.library.searchDocs(k);
                if (!result.ok) throw new Error(result.message);
                return result.data;
            },
            searchCurrentDoc: async (keyword: string) => {
                return this.omniSearch.searchInCurrentDoc(keyword);
            },
            searchAllNotes: async (keyword: string) => {
                return this.omniSearch.searchInAllNotes(keyword);
            },
            createFromOmni: async (entry: SearchEntry) => {
                const content = (entry.content || entry.summary || "").trim();
                if (!content) return false;
                const isClip = entry.id.startsWith("xlc-clip-");
                const cleanTitle = (entry.title || "").replace(/^[📋🔍☵★☆✦✓\s]+/, "").trim() || entry.title;
                const meta = deriveOmniItemMetadata({...entry, title: cleanTitle});

                let finalMarkdown = content;
                let finalTitle = cleanTitle;
                let finalTags = meta.tags;
                let finalCategory = isClip ? (meta.category === "待整理" ? "常用" : meta.category) : meta.category;
                let finalAlias = meta.recommendedAlias || undefined;

                if (isClip) {
                    const parsed = parseSnippetAnnotations(content);
                    finalMarkdown = parsed.cleanText || content;
                    finalTitle = parsed.title || cleanTitle || "剪贴板条目";
                    finalTags = Array.from(new Set(["剪贴板", ...parsed.tags].filter(Boolean)));
                    finalCategory = "常用";
                    if (parsed.title) {
                        try {
                            const adapter = getPinyinAdapter();
                            if (typeof adapter?.annotate === "function") {
                                const anno = adapter.annotate({title: parsed.title, alias: ""});
                                if (anno && anno.pyi) {
                                    finalAlias = anno.pyi.toLowerCase().slice(0, 8);
                                }
                            }
                        } catch {
                            // ignore
                        }
                    }
                }

                const created = await this.library.createItem({
                    itemType: entry.itemType,
                    markdown: finalMarkdown,
                    title: finalTitle,
                    alias: finalAlias,
                    tags: finalTags,
                    category: finalCategory,
                    source: {
                        sourceDocId: entry.sourceDocId,
                        sourceBlockId: entry.targetBlockId || entry.sourceBlockId,
                        sourceType: isClip ? "clipboard" : "external",
                    },
                });
                if (created.ok) {
                    const notifyMsg = isClip
                        ? (this.i18nFn()("promoteClipboardSuccess", created.data.item.title) || `已将「${created.data.item.title}」沉淀为常用语`)
                        : this.i18nFn()("saved", created.data.item.title);
                    this.notify("info", notifyMsg);
                    this.notifyExternalDataChange();
                    return true;
                } else {
                    this.notify("error", created.message);
                    return false;
                }
            },
            promoteClipboardEntry: async (entry: SearchEntry, payload: PromoteClipPayload) => {
                if (!this.library) return false;
                const created = await this.library.createItem({
                    itemType: entry.itemType || "text",
                    markdown: payload.markdown,
                    title: payload.title,
                    shortcode: payload.shortcode || undefined,
                    tags: payload.tags,
                    category: payload.category,
                    source: {
                        sourceDocId: entry.sourceDocId || "",
                        sourceBlockId: entry.targetBlockId || entry.sourceBlockId || "",
                        sourceType: "clipboard",
                    },
                });

                if (created.ok) {
                    const itemId = created.data.item.id;
                    const now = Date.now();
                    // 转正生效：赋予初始使用频次与当前时间戳（进入 frecency 排序体系）
                    this.state.usage[itemId] = { count: 1, lastAt: now };
                    this.state.recents = [
                        { id: itemId, usedAt: now },
                        ...(this.state.recents || []).filter((r) => r.id !== itemId),
                    ].slice(0, 50);
                    if (payload.category) {
                        this.state.uiPrefs.lastCategoryFilter = payload.category;
                    }
                    this.persistSoon();

                    // 生态活动广播 (Epoch 7 Activity Stream)
                    const scTitle = payload.shortcode ? payload.shortcode : payload.title;
                    try {
                        lvActivity.record({
                            source: "常用",
                            category: "note",
                            title: `剪贴板晋升片段: ${scTitle}`,
                        });
                    } catch {}

                    const notifyMsg = this.i18nFn()("promoteClipboardSuccess", created.data.item.title)
                        || `已将「${created.data.item.title}」沉淀为常用语`;
                    this.notify("info", notifyMsg);
                    this.notifyExternalDataChange();
                    return true;
                } else {
                    this.notify("error", created.message);
                    return false;
                }
            },
            captureOmniWithForm: (entry: SearchEntry) => {
                this.capture?.captureOmniWithForm(entry);
            },
            quickEditBlock: (blockId: string, currentContent: string) => {
                openQuickEditDialog({
                    t: this.i18nFn(),
                    updateBlock: (bId, text) => this.omniSearch.updateBlockContent(bId, text),
                    notify: (type, msg) => this.notify(type, msg),
                    onUpdated: (_bId, newText) => {
                        const active = this.searchDialog?.getActiveEntry();
                        if (active && (active.targetBlockId === blockId || active.id.includes(blockId))) {
                            active.content = newText;
                            active.summary = newText.slice(0, 100);
                            this.notifyExternalDataChange();
                        }
                    },
                }, blockId, currentContent);
            },
            openDocBlock: (blockId: string) => {
                this.host.openDoc("", blockId);
            },
            getDocPath: (docId: string) => {
                return this.library.getDocPath(docId);
            },
            getAdjacentBlocks: (blockId: string, docId: string) => {
                return this.omniSearch.getAdjacentBlocks(blockId, docId);
            },
            insertToDoc: async (itemId, docId, hPath, fills, mode = "insert") => {
                const got = await this.library.getItem(itemId);
                if (!got.ok) {
                    this.notify("error", got.message);
                    return false;
                }
                const item = got.data;
                let markdown: string;
                const blockrefTarget = item.itemType === "blockref"
                    ? (resolveBlockRefTarget(item) || item.source.sourceBlockId || item.blockId)
                    : (isBlockId(item.blockId) ? item.blockId : (resolveBlockRefTarget(item) || item.source.sourceBlockId));
                if (mode === "insert-embed" && blockrefTarget) {
                    markdown = buildEmbedBlock(blockrefTarget);
                } else if ((mode === "insert-ref" || (item.itemType === "blockref" && mode !== "insert-content")) && blockrefTarget) {
                    markdown = buildBlockRef(blockrefTarget, item.title || "ref");
                } else {
                    const kd = await this.library.getItemKramdown(item);
                    if (!kd.ok) {
                        this.notify("error", kd.message);
                        return false;
                    }
                    // 占位符语义与活动编辑器路径一致（R51/R67：定向插入同样渲染 {{xlc:…}} 与变量填充）
                    markdown = await this.executor.renderForInsert(kd.data, item, fills);
                }
                try {
                    const inserted = await this.library.appendToDoc(markdown, docId);
                    if (inserted) {
                        this.service.touchRecent(item.id);
                        this.recordUsage(item.id);
                        this.notifyExternalDataChange();
                        this.notify("info", this.i18nFn()("insertToDocDone", shortTitle(hPath || docId)));
                    } else {
                        this.notify("error", this.i18nFn()("insertToDocFailed"));
                    }
                    return inserted;
                } catch (err) {
                    this.notify("error", toErrorMessage(err));
                    return false;
                }
            },
            duplicateItem: async (itemId) => {
                const got = await this.library.getItem(itemId);
                if (!got.ok) return;
                const kd = await this.library.getStoredItemKramdown(got.data);
                if (!kd.ok) {
                    this.notify("error", kd.message);
                    return;
                }
                const src = got.data;
                const created = await this.library.createItem({
                    itemType: src.itemType,
                    markdown: kd.data,
                    title: src.title ? `${src.title} 副本` : undefined,
                    alias: src.alias || undefined,
                    tags: src.tags,
                    category: src.category || undefined,
                    url: src.url || undefined,
                    targetBlockId: src.targetBlockId || undefined,
                    source: {...src.source},
                });
                if (created.ok) {
                    this.notify("info", this.i18nFn()("duplicated", shortTitle(created.data.item.title)));
                    // 副本即时出现在打开着的列表里（R138）
                    this.notifyExternalDataChange();
                } else {
                    this.notify("error", created.message);
                }
            },
            saveTransformed: async (itemId, transformLabel, text) => {
                const trimmed = (text ?? "").trim();
                if (!trimmed) return;
                const got = await this.library.getItem(itemId);
                if (!got.ok) {
                    this.notify("error", got.message);
                    return;
                }
                const created = await this.library.createItem({
                    itemType: "markdown",
                    markdown: trimmed,
                    title: `${got.data.title} · ${transformLabel}`,
                    tags: got.data.tags,
                    category: got.data.category || undefined,
                    source: {sourceDocId: got.data.libraryDocId, sourceBlockId: got.data.blockId, sourceType: "external"},
                });
                if (created.ok) {
                    this.notify("info", this.i18nFn()("saved", created.data.item.title));
                    this.notifyExternalDataChange();
                } else {
                    this.notify("error", created.message);
                }
            },
            openSetup: () => (this.config ? this.openSettings() : this.openSetup()),
            providerSearch: async (query) => {
                const rows = [];
                for (const provider of this.registry.listExecutable()) {
                    if (!provider.runtime?.search) continue;
                    try {
                        // 3s 超时保护：挂起的提供方不得卡住弹窗；
                        // 完成后清除定时器，避免输家 rejection 悬浮（R122，对齐 kernel/client 范式）
                        let timeoutTimer: ReturnType<typeof setTimeout> | undefined;
                        const hits = await Promise.race([
                            provider.runtime.search(query),
                            new Promise<never>((_, reject) => {
                                timeoutTimer = setTimeout(() => reject(new Error("provider timeout")), 3000);
                            }),
                        ]).finally(() => {
                            if (timeoutTimer) clearTimeout(timeoutTimer);
                        });
                        // 成功一次即清除失败通知记忆（恢复后正常提示）
                        this.providerFailureSeen.delete(provider.record.pluginId);
                        for (const hit of hits ?? []) {
                            rows.push({
                                providerId: provider.record.pluginId,
                                providerName: provider.record.displayName,
                                title: String(hit?.title ?? ""),
                                payload: String(hit?.payload ?? ""),
                            });
                        }
                    } catch (err) {
                        // 提供方失败不阻断主搜索；通知每提供方每会话仅一次（防刷新通知轰炸），恢复成功后清记忆
                        if (!this.providerFailureSeen.has(provider.record.pluginId)) {
                            this.providerFailureSeen.add(provider.record.pluginId);
                            this.notify("error", this.i18nFn()("providerUnavailable", provider.record.displayName) + ` (${toErrorMessage(err)})`);
                        }
                    }
                }
                // 小驴家族生态兄弟插件只读适配联动（零依赖、渐进增强）
                try {
                    const ecoHits = await queryEcosystemItems(query);
                    for (const hit of ecoHits) {
                        rows.push({
                            providerId: "xiaolv-family-ecosystem",
                            providerName: hit.providerName,
                            title: hit.title,
                            payload: hit.payload,
                        });
                    }
                } catch {
                    // 静默
                }
                return buildProviderRows(rows);
            },
            insertProviderPayload: (payload, target) => withEditorTarget("insert", async () => {
                const trimmed = (payload ?? "").trim();
                if (!trimmed) return false;
                // 与库条目一致的占位符语义（R24 定案）：插入前渲染 {{xlc:…}}
                const rendered = (await this.executor.renderProviderOutput(trimmed)) ?? trimmed;
                // 定向模式（文档树入口）：appendBlock 到目标文档
                if (target?.docId) {
                    try {
                        const inserted = await this.library.appendToDoc(rendered, target.docId);
                        if (inserted) this.notify("info", this.i18nFn()("insertToDocDone", shortTitle(target.hPath || target.docId)));
                        else this.notify("error", this.i18nFn()("insertToDocFailed"));
                        return inserted;
                    } catch (err) {
                        this.notify("error", toErrorMessage(err));
                        return false;
                    }
                }
                const insertTargetAvailable = editorTarget
                    ? this.host.canInsertAtTarget(editorTarget)
                    : this.host.hasActiveEditor();
                if (insertTargetAvailable && !this.host.isMobile()) {
                    const targetDocId = editorTarget?.docId || this.host.currentDocId() || "";
                    const inserted = await withDocLock(targetDocId, async () => {
                        return this.host.insertMarkdown(rendered, editorTarget ?? undefined);
                    });
                    if (inserted) this.notify("info", this.i18nFn()("providerInserted"));
                    else this.notify("error", this.i18nFn()("insertFailed"));
                    return inserted;
                }
                const html = isMarkdownFormattingPresent(rendered) ? renderSafeHtmlFromMarkdown(rendered) : undefined;
                const copied = await this.host.writeClipboard(rendered, html);
                const message = this.host.isMobile()
                    ? this.i18nFn()("insertPendingMobile")
                    : editorTarget?.editor ? this.i18nFn()("insertTargetUnavailableCopied") : this.i18nFn()("insertNoEditor");
                this.notify(copied ? "info" : "error", copied ? message : this.i18nFn()("copyFailed"));
                return copied;
            }),
            copyProviderPayload: async (payload) => {
                const text = (payload ?? "").trim();
                const html = isMarkdownFormattingPresent(text) ? renderSafeHtmlFromMarkdown(text) : undefined;
                const ok = await this.host.writeClipboard(text, html);
                if (!ok) this.notify("error", this.i18nFn()("copyFailed"));
                return ok;
            },
            getTags: async () => {
                const idx = await this.library.ensureIndex();
                return collectTags(idx.entries);
            },
            getCategories: async () => {
                const idx = await this.library.ensureIndex();
                return collectCategories(idx.entries);
            },
            getFilters: () => ({
                type: this.state.uiPrefs.lastTypeFilter,
                tag: this.state.uiPrefs.lastTagFilter,
                category: this.state.uiPrefs.lastCategoryFilter,
            }),
            setFilters: (f) => {
                this.state.uiPrefs.lastTypeFilter = (f.type === "" || isItemType(f.type) ? f.type : "") as typeof this.state.uiPrefs.lastTypeFilter;
                this.state.uiPrefs.lastTagFilter = f.tag.slice(0, 64);
                this.state.uiPrefs.lastCategoryFilter = f.category.slice(0, 64);
                this.persistSoon();
            },
            getLastQuery: () => this.state.search.lastQuery,
            setLastQuery: (q) => {
                this.state.search.lastQuery = q.slice(0, 200);
                this.persistSoon();
            },
            getRecentQueries: () => this.state.search.recentQueries ?? [],
            addRecentQuery: (q: string) => {
                this.state.search.recentQueries = pushRecentQuery(this.state.search.recentQueries ?? [], q);
                this.persistSoon();
            },
            removeRecentQuery: (q: string) => {
                this.state.search.recentQueries = removeRecentQuery(this.state.search.recentQueries ?? [], q);
                this.persistSoon();
            },
            clearRecentQueries: () => {
                this.state.search.recentQueries = [];
                this.persistSoon();
            },
            getClipboardHistory: () => this.state.clipboardHistory ?? [],
            clearClipboardHistory: () => {
                this.state.clipboardHistory = [];
                this.persistSoon();
            },
            addClipboardHistory: (text: string) => {
                this.recordClipboard(text);
            },
            importBundleText: async (text: string) => {
                return this.importBundleText(text, "rename");
            },
            getVariablePresets: (itemId: string) => {
                return this.state.variablePresets?.[itemId];
            },
            saveVariablePreset: (itemId: string, name: string, fills: Record<string, string>) => {
                this.state.variablePresets ??= {};
                this.state.variablePresets[itemId] ??= {};
                this.state.variablePresets[itemId][name] = fills;
                this.persistSoon();
            },
            deleteVariablePreset: (itemId: string, name: string) => {
                if (this.state.variablePresets?.[itemId]) {
                    delete this.state.variablePresets[itemId][name];
                    this.persistSoon();
                }
            },
            syncSystemClipboard: async () => {
                try {
                    if (navigator.clipboard?.readText && window.isSecureContext) {
                        const txt = await navigator.clipboard.readText();
                        if (txt) {
                            this.recordClipboard(txt);
                            return txt;
                        }
                    }
                } catch {
                    // ignore
                }
                return null;
            },
            preview: async (itemId) => {
                const cached = this.previewCache.get(itemId);
                if (cached !== undefined) return cached;
                const existingTask = this.previewTasks.get(itemId);
                if (existingTask) return existingTask;
                const generation = this.previewCacheGeneration;
                let task!: Promise<string>;
                task = (async (): Promise<string> => {
                    const got = await this.library.getItem(itemId);
                    if (!got.ok) return "";
                    const kd = await this.library.getItemKramdown(got.data);
                    // 片段引用展开后预览（F5）：预览/填充卡所见 = 插入所得；变量仍保留给填充卡
                    const text = kd.ok ? await this.library.expandSnippetRefs(kd.data) : "";
                    // 写入或换库发生后，旧异步读取不能把陈旧预览重新放回缓存。
                    if (text && generation === this.previewCacheGeneration && this.previewTasks.get(itemId) === task) {
                        this.previewCache.set(itemId, text);
                    }
                    return text;
                })();
                this.previewTasks.set(itemId, task);
                try {
                    return await task;
                } finally {
                    if (this.previewTasks.get(itemId) === task) this.previewTasks.delete(itemId);
                }
            },
            getSort: () => this.state.sort,
            setSort: (sort) => {
                this.state.sort = sort;
                this.persistSoon();
            },
            runAction: (itemId, mode) => withEditorTarget(mode, async () => {
                if (itemId.startsWith("xlc-omni-") || itemId.startsWith("xlc-clip-")) {
                    const active = this.searchDialog?.getActiveEntry();
                    const content = active?.content || active?.summary || "";
                    if (mode.startsWith("copy")) {
                        const ok = await this.host.writeClipboard(kramdownToPlainText(content));
                        const msg = ok ? this.i18nFn()("copied", shortTitle(active?.title || "条目")) : this.i18nFn()("copyFailed");
                        if (!ok) this.notify("error", msg);
                        else {
                            try {
                                lvActivity.record({
                                    source: "常用",
                                    category: "note",
                                    title: `应用常用模版「${shortTitle(active?.title || "条目")}」`,
                                    linkBlockId: active?.id,
                                });
                            } catch {}
                        }
                        return {ok, message: msg};
                    } else {
                        const targetDocId = editorTarget?.docId || this.host.currentDocId() || "";
                        const ok = await withDocLock(targetDocId, async () => {
                            return this.host.insertMarkdown(content, editorTarget ?? undefined);
                        });
                        const msg = ok ? this.i18nFn()("inserted", shortTitle(active?.title || "条目")) : this.i18nFn()("insertFailed");
                        this.notify(ok ? "info" : "error", msg);
                        if (ok) {
                            try {
                                lvActivity.record({
                                    source: "常用",
                                    category: "note",
                                    title: `应用常用模版「${shortTitle(active?.title || "条目")}」`,
                                    linkBlockId: active?.id,
                                });
                            } catch {}
                        }
                        return {ok, message: msg};
                    }
                }
                const got = await this.library.getItem(itemId);
                if (!got.ok) {
                    this.notify("error", got.message);
                    return {ok: false, message: got.message};
                }
                const receipt = await this.executor.run(got.data, mode, editorTarget ? {editorTarget} : undefined);
                const msg = receipt.ok
                    ? this.receiptText(receipt.message, got.data.title, receipt.pendingVerification)
                    : this.receiptText(receipt.message, got.data.title, receipt.pendingVerification) || this.i18nFn()("kernelError", receipt.message);
                if (!receipt.ok) {
                    this.notify("error", msg);
                } else if (!mode.startsWith("copy")) {
                    this.notify("info", msg);
                }
                return {ok: receipt.ok, message: msg};
            }),
            runActionWithFills: (itemId, mode, fills) => withEditorTarget(mode, async () => {
                if (itemId.startsWith("xlc-omni-") || itemId.startsWith("xlc-clip-")) {
                    const active = this.searchDialog?.getActiveEntry();
                    const content = active?.content || active?.summary || "";
                    if (mode.startsWith("copy")) {
                        const ok = await this.host.writeClipboard(kramdownToPlainText(content));
                        const msg = ok ? this.i18nFn()("copied", shortTitle(active?.title || "条目")) : this.i18nFn()("copyFailed");
                        if (!ok) this.notify("error", msg);
                        else {
                            try {
                                lvActivity.record({
                                    source: "常用",
                                    category: "note",
                                    title: `应用常用模版「${shortTitle(active?.title || "条目")}」`,
                                    linkBlockId: active?.id,
                                });
                            } catch {}
                        }
                        return {ok, message: msg};
                    } else {
                        const targetDocId = editorTarget?.docId || this.host.currentDocId() || "";
                        const ok = await withDocLock(targetDocId, async () => {
                            return this.host.insertMarkdown(content, editorTarget ?? undefined);
                        });
                        const msg = ok ? this.i18nFn()("inserted", shortTitle(active?.title || "条目")) : this.i18nFn()("insertFailed");
                        this.notify(ok ? "info" : "error", msg);
                        if (ok) {
                            try {
                                lvActivity.record({
                                    source: "常用",
                                    category: "note",
                                    title: `应用常用模版「${shortTitle(active?.title || "条目")}」`,
                                    linkBlockId: active?.id,
                                });
                            } catch {}
                        }
                        return {ok, message: msg};
                    }
                }
                const got = await this.library.getItem(itemId);
                if (!got.ok) {
                    this.notify("error", got.message);
                    return {ok: false, message: got.message};
                }
                const receipt = await this.executor.run(got.data, mode, editorTarget ? {fills, editorTarget} : {fills});
                const msg = receipt.ok
                    ? this.receiptText(receipt.message, got.data.title, receipt.pendingVerification)
                    : this.receiptText(receipt.message, got.data.title, receipt.pendingVerification) || this.i18nFn()("kernelError", receipt.message);
                if (!receipt.ok) {
                    this.notify("error", msg);
                } else if (!mode.startsWith("copy")) {
                    this.notify("info", msg);
                }
                return {ok: receipt.ok, message: msg};
            }),
            promptVariables: () => this.state.insert.promptVariables,
            getVariableDefaults: (labels) => collectDefaults(this.state.variableMemory, labels),
            rememberVariables: (fills) => {
                this.state.variableMemory = rememberValues(this.state.variableMemory, fills, Date.now());
                this.persistSoon();
            },
            batchUpdateMetadata: async (itemIds, patch) => {
                const receipt = await this.library.batchUpdateTagsAndCategory(itemIds, patch);
                if (receipt.failed > 0) {
                    this.notify("error", `批量更新完成：成功 ${receipt.updated} 项，失败 ${receipt.failed} 项`);
                } else if (receipt.updated > 0) {
                    this.notify("info", `已批量更新 ${receipt.updated} 个条目的元数据`);
                }
                return receipt;
            },
            getUsage: () => this.state.usage,
            resetItemUsage: (itemId: string) => this.resetItemUsage(itemId),
            newItem: (titleCandidate?: string) => this.capture?.newManual(titleCandidate),
            newWithContent: (content: string, options?: {title?: string}) => this.capture?.newWithContent(content, options),
            openSource: async (itemId) => {
                const got = await this.library.getItem(itemId);
                if (!got.ok) {
                    this.notify("error", got.message);
                    return {ok: false, message: got.message};
                }
                const receipt = await this.executor.openSource(got.data);
                if (!receipt.ok) {
                    const msg = receipt.message === "source-missing"
                        ? this.i18nFn()("sourceGone")
                        : receipt.message === "asset-missing"
                            ? this.i18nFn()("assetMissing")
                            : this.i18nFn()("kernelError", receipt.message);
                    this.notify("error", msg);
                    return {ok: false, message: msg};
                }
                this.notify("info", this.i18nFn()("sourceOpened"));
                return {ok: true, message: "opened"};
            },
            pullFromSource: async (itemId) => {
                const res = await this.library.pullFromSourceBlock(itemId);
                if (!res.ok) {
                    this.notify("error", res.message);
                    return false;
                }
                this.invalidatePreviewCache([itemId]);
                this.notify("info", `已从思源原块同步最新内容：「${shortTitle(res.data.item.title)}」`);
                this.notifyExternalDataChange();
                return true;
            },
            pushToSource: async (itemId) => {
                const res = await this.library.pushToSourceBlock(itemId);
                if (!res.ok) {
                    this.notify("error", res.message);
                    return false;
                }
                this.notify("info", "已将当前条目内容回写至思源来源块");
                return true;
            },
            insertRaw: (markdown, target) => withEditorTarget("insert", async () => {
                const trimmed = (markdown ?? "").trim();
                if (!trimmed) return false;
                if (target?.docId) {
                    const inserted = await this.library.appendToDoc(trimmed, target.docId);
                    this.notify(inserted ? "info" : "error", inserted
                        ? this.i18nFn()("insertToDocDone", shortTitle(target.hPath || target.docId))
                        : this.i18nFn()("insertToDocFailed"));
                    return inserted;
                }
                const insertTargetAvailable = editorTarget
                    ? this.host.canInsertAtTarget(editorTarget)
                    : this.host.hasActiveEditor();
                if (insertTargetAvailable && !this.host.isMobile()) {
                    const targetDocId = editorTarget?.docId || this.host.currentDocId() || "";
                    const inserted = await withDocLock(targetDocId, async () => {
                        return this.host.insertMarkdown(trimmed, editorTarget ?? undefined);
                    });
                    this.notify(inserted ? "info" : "error", inserted ? this.i18nFn()("aiOriginalPreserved") : this.i18nFn()("insertFailed"));
                    return inserted;
                }
                const html = isMarkdownFormattingPresent(trimmed) ? renderSafeHtmlFromMarkdown(trimmed) : undefined;
                const copied = await this.host.writeClipboard(trimmed, html);
                const message = this.host.isMobile()
                    ? this.i18nFn()("insertPendingMobile")
                    : editorTarget?.editor ? this.i18nFn()("insertTargetUnavailableCopied") : this.i18nFn()("insertNoEditor");
                this.notify(copied ? "info" : "error", copied ? message : this.i18nFn()("copyFailed"));
                return copied;
            }),
            copyText: async (text) => {
                const html = isMarkdownFormattingPresent(text) ? renderSafeHtmlFromMarkdown(text) : undefined;
                const ok = await this.host.writeClipboard(text, html);
                // 剪贴板写入失败不得静默（系统拒绝/权限受限时用户必须知道，R138）
                if (!ok) this.notify("error", this.i18nFn()("copyFailed"));
                return ok;
            },
            aiEnabled: () => this.state.ai.enabled,
            hasActiveEditor: () => editorTarget ? !!editorTarget.editor : this.host.hasActiveEditor(),
            hasInsertTarget: () => editorTarget ? this.host.canInsertAtTarget(editorTarget) : this.host.hasActiveEditor(),
            aiSemantic: async (desc, filters) => {
                try {
                    const idx = await this.library.ensureIndex();
                    // 语义找候选先按类型/标签/收藏范围过滤（与普通搜索的筛选语义一致）
                    const safeItemType = filters.itemType && isItemType(filters.itemType) ? filters.itemType : "";
                    const scoped = applyBasicFilters(idx.entries, {itemType: safeItemType, tag: filters.tag, category: filters.category, scope: filters.scope}, this.searchContext());
                    const meta: SearchMetaEntry[] = scoped.map((e) => ({
                        id: e.id,
                        title: e.title,
                        alias: e.alias,
                        tags: e.tags,
                        category: e.category,
                        summary: e.summary,
                        itemType: e.itemType,
                    }));
                    const picked = await this.ai.semanticPick(desc, meta);
                    const entryMap = new Map(scoped.map((e) => [e.id, e]));
                    return {ok: true as const, entries: picked.map((p) => entryMap.get(p.id)).filter((e): e is NonNullable<typeof e> => !!e)};
                } catch (err) {
                    return {ok: false as const, message: this.aiErrorText(err)};
                }
            },
            aiTransform: async (itemId, kind: TransformKind) => {
                try {
                    const got = await this.library.getItem(itemId);
                    if (!got.ok) return {ok: false as const, message: got.message};
                    const kd = await this.library.getItemKramdown(got.data);
                    if (!kd.ok) return {ok: false as const, message: kd.message};
                    return {ok: true as const, text: await this.ai.transform(kind, kd.data)};
                } catch (err) {
                    return {ok: false as const, message: this.aiErrorText(err)};
                }
            },
            listCustomTransforms: () => this.state.ai.customTransforms
                .filter((ct) => ct.name.trim() && ct.prompt.trim())
                .map((ct) => ({id: ct.id, name: ct.name})),
            aiTransformCustom: async (itemId, customId) => {
                try {
                    const ct = this.state.ai.customTransforms.find((c) => c.id === customId);
                    if (!ct) return {ok: false as const, message: "custom-xlc-transform-not-found"};
                    const got = await this.library.getItem(itemId);
                    if (!got.ok) return {ok: false as const, message: got.message};
                    const kd = await this.library.getItemKramdown(got.data);
                    if (!kd.ok) return {ok: false as const, message: kd.message};
                    return {ok: true as const, text: await this.ai.transformCustom(ct.prompt, kd.data)};
                } catch (err) {
                    return {ok: false as const, message: this.aiErrorText(err)};
                }
            },
            isSourceMissing: (entry) => {
                const block = entry.sourceBlockId;
                const doc = entry.sourceDocId;
                return (!!block && this.missingSources.has(block)) || (!!doc && this.missingSources.has(doc) && !entry.sourceBlockId);
            },
            editItem: async (itemId) => {
                const got = await this.library.getItem(itemId);
                if (!got.ok) {
                    this.notify("error", got.message);
                    return;
                }
                this.openEditDialog(got.data);
            },
            deleteItem: async (itemId) => {
                const got = await this.library.getItem(itemId);
                if (!got.ok) {
                    this.notify("error", got.message);
                    return;
                }
                confirmDelete(this.i18nFn(), got.data.title, async () => {
                    const removed = await this.library.removeItem(itemId);
                    if (removed.ok) {
                        this.invalidatePreviewCache([itemId]);
                        this.state.favorites = this.state.favorites.filter((id) => id !== itemId);
                        this.state.recents = this.state.recents.filter((r) => r.id !== itemId);
                        delete this.state.usage[itemId];
                        this.persistSoon();
                        // 删除回执即时给出；后台重建索引失败另行诚实提示（不吞 rejection，R138）
                        this.notify("info", this.i18nFn()("deleted", got.data.title));
                        // 搜索弹窗与侧栏同步移除已删行
                        this.notifyExternalDataChange();
                        this.library.reindex().catch((err) => {
                            this.notify("error", this.i18nFn()("kernelError", toErrorMessage(err)));
                        });
                    } else {
                        this.notify("error", removed.message);
                    }
                });
            },
            toggleFavorite: (itemId) => {
                const fav = this.service.toggleFavorite(itemId);
                void this.dockView?.refresh();
                return fav;
            },
            isFavorite: (itemId) => this.state.favorites.includes(itemId),
            close: () => {
                dialogClosed = true;
                // 防止旧弹窗 130ms 销毁动画回调迟到时误清空新打开的 searchDialog 实例
                if (this.searchDialog === dialogInstance) {
                    this.searchDialog = null;
                }
                releaseTargetIfIdle();
            },
            isMobile: () => this.host.isMobile(),
            isClipboardSmartMatchEnabled: () => this.state.clipboardSmartMatchEnabled === true,
            getPinnedTopChips: () => this.state.pinnedTopChips ?? [],
            setPinnedTopChips: (ids: string[]) => {
                this.state.pinnedTopChips = ids.slice(0, 5);
                this.persistSoon();
            },
        });
        this.searchDialog = dialogInstance;
        this.searchDialog.insertTarget = insertTarget ? {docId: insertTarget.docId, hPath: insertTarget.hPath} : null;
        this.searchDialog.open();
    }

    resetItemUsage(itemId: string): boolean {
        if (this.state.usage[itemId]) {
            delete this.state.usage[itemId];
            this.persistSoon();
            return true;
        }
        return false;
    }

    private receiptText(code: string, title: string, pending: string[]): string {
        const t = this.i18nFn();
        if (code === "no-editor-copied") return t("insertNoEditor");
        if (code === "target-unavailable-copied") return t("insertTargetUnavailableCopied");
        if (code === "no-editor-copy-failed" || code === "copy-failed") return t("copyFailed");
        if (code === "source-missing" || code === "doc-missing") return t("sourceGone");
        if (code === "insert-failed") return t("insertFailed");
        if (code === "copied") return t("copied", shortTitle(title));
        if (code === "inserted") return t("inserted", shortTitle(title));
        if (pending.includes("mobile-insert-unverified")) return t("insertPendingMobile");
        if (pending.includes("bitmap-clipboard-unverified")) return t("copiedRichPending");
        return "";
    }

    // ---- 编辑 ----

    private async openEditDialog(item: CommonItem): Promise<void> {
        const t = this.i18nFn();
        const kd = await this.library.getStoredItemKramdown(item);
        const initialKramdown = kd.ok ? kd.data : "";
        const isMobileModal = isMobileDialogViewport();
        const dialogTitle = `${t("edit")} · ${(item.title || t("unknownType")).slice(0, 24)}${item.title.length > 24 ? "…" : ""}`;
        const dialog = new Dialog({
            // 标题带条目名（截断 24 字）：确认正在编辑哪一条
            title: dialogTitle,
            content: "",
            width: isMobileModal ? "100vw" : "min(620px, 92vw)",
            height: isMobileModal ? "100dvh" : "min(860px, 92vh)",
        });
        dialog.element.querySelector(".b3-dialog__container")?.classList.add("xlc-form-host");
        dialog.element.addEventListener("click", (e) => {
            if (e.target === dialog.element || (e.target as HTMLElement).classList?.contains("b3-dialog__scrim")) {
                dialog.destroy();
            }
        });
        mountPlatformDialogTitleWrap(dialog.element, dialogTitle);
        adaptSecondaryDialogForMobile(dialog, t("close"));
        const body = getDialogBody(dialog.element);
        if (!body) return;
        body.innerHTML = "";
        const form = document.createElement("div");
        form.className = "xlc-form";
        let fieldIdx = 0;
        const mkField = (label: string, value: string, controlId?: string): HTMLInputElement => {
            const wrap = document.createElement("label");
            wrap.className = "xlc-form-field";
            const inputId = `xlc-edit-field-${++fieldIdx}`;
            wrap.htmlFor = inputId;
            const cap = document.createElement("span");
            cap.className = "xlc-form-label";
            cap.textContent = label;
            wrap.appendChild(cap);
            const input = document.createElement("input");
            input.id = inputId;
            input.className = "b3-text-field";
            input.setAttribute("aria-label", label);
            if (controlId) input.dataset.xlcControl = controlId;
            input.value = value;
            wrap.appendChild(input);
            form.appendChild(wrap);
            return input;
        };
        const titleEl = mkField(t("title"), item.title, "edit.title");
        const aliasEl = mkField(t("alias"), item.alias, "edit.alias");
        const shortcodeEl = mkField(t("shortcode") || "简码 (:shortcode)", item.shortcode ?? "", "edit.shortcode");
        shortcodeEl.placeholder = t("shortcodePlaceholder") || "如 :wk、:bug（选填，搜索框输入即置顶直达）";
        const tagsEl = mkField(t("tags"), item.tags.join(", "), "edit.tags");
        const categoryEl = mkField(t("category"), item.category, "edit.category");
        // 内容编辑（kramdown；保存走 updateBlock，保留类型语义由内容本身决定）
        const contentWrap = document.createElement("label");
        contentWrap.className = "xlc-form-field";
        contentWrap.htmlFor = "xlc-edit-field-content";
        const contentCap = document.createElement("span");
        contentCap.className = "xlc-form-label";
        contentCap.textContent = t("editContentLabel");
        contentWrap.appendChild(contentCap);
        const contentEl = document.createElement("textarea");
        contentEl.id = "xlc-edit-field-content";
        contentEl.className = "b3-text-field";
        contentEl.dataset.xlcControl = "edit.content";
        contentEl.setAttribute("aria-label", t("editContentLabel"));
        contentEl.rows = 8;
        contentEl.value = initialKramdown;
        // 行内必填反馈：内容为空保存时红描边（R109），输入即清除
        contentEl.addEventListener("input", () => contentEl.classList.remove("xlc-input--error"));
        contentWrap.appendChild(contentEl);
        form.appendChild(contentWrap);
        // 变量快捷插入条（F1 编辑侧：与捕获表单同款，点选在光标处插入）
        contentWrap.after(buildVariableBar(t, () => contentEl));
        // 来源状态与重新指定（文本单独 span：异步回填路径不得抹掉行内按钮）
        const srcRow = document.createElement("div");
        srcRow.className = "xlc-form-sourcerow";
        const srcText = document.createElement("span");
        srcText.textContent = item.source.sourceDocId
            ? t("sourceWithId", item.source.sourceDocId + (item.source.sourceBlockId ? t("sourceBlockSuffix", item.source.sourceBlockId) : ""))
            : t("sourceMissing");
        srcRow.appendChild(srcText);
        // 异步补全为可读路径（内核权威 hPath；失败保持 ID 显示）
        if (item.source.sourceDocId) {
            void this.library.getDocPath(item.source.sourceDocId).then((path) => {
                if (path) srcText.textContent = t("sourceWithId", path + (item.source.sourceBlockId ? t("sourceBlockSuffix", item.source.sourceBlockId) : ""));
            }).catch(() => undefined);
        }
        const relinkBtn = document.createElement("button");
        relinkBtn.type = "button";
        relinkBtn.className = "b3-button b3-button--text xlc-form-ai";
        relinkBtn.textContent = t("relinkCurrent");
        relinkBtn.addEventListener("click", () => {
            const docId = this.host.currentDocId();
            if (!docId) {
                this.notify("error", t("relinkNoDoc"));
                return;
            }
            void this.library.relinkSource(item.id, {sourceDocId: docId}).then((result) => {
                if (result.ok) {
                    this.invalidatePreviewCache([item.id]);
                    this.notify("info", t("relinkDone"));
                    void this.library.getDocPath(docId).then((path) => {
                        srcText.textContent = path ? t("sourceWithId", path) : t("sourceWithId", docId);
                    }).catch(() => undefined);
                } else {
                    this.notify("error", result.message);
                }
            }).catch((err) => this.notify("error", t("kernelError", toErrorMessage(err))));
        });
        srcRow.appendChild(relinkBtn);
        if (item.source.sourceDocId || item.source.sourceBlockId) {
            const clearBtn = document.createElement("button");
            clearBtn.type = "button";
            clearBtn.className = "b3-button b3-button--text xlc-form-ai";
            clearBtn.textContent = t("clearSource");
            clearBtn.addEventListener("click", () => {
                void this.library.clearSource(item.id).then((result) => {
                    if (result.ok) {
                        this.invalidatePreviewCache([item.id]);
                        this.notify("info", t("clearSourceDone"));
                        srcText.textContent = t("sourceMissing");
                    } else {
                        this.notify("error", result.message);
                    }
            }).catch((err) => this.notify("error", t("kernelError", toErrorMessage(err))));
            });
            srcRow.appendChild(clearBtn);
        }
        if (isBlockId(item.blockId)) {
            const openLibBlockBtn = document.createElement("button");
            openLibBlockBtn.type = "button";
            openLibBlockBtn.className = "b3-button b3-button--text xlc-form-ai";
            openLibBlockBtn.dataset.xlcControl = "edit.open-lib-block";
            openLibBlockBtn.textContent = "📦 在思源中定位此块";
            openLibBlockBtn.title = "关闭弹窗并在思源笔记编辑器中直接打开定位该条目所在的真实块";
            openLibBlockBtn.addEventListener("click", () => {
                dialog.destroy();
                this.host.openDoc(item.libraryDocId, item.blockId);
            });
            srcRow.appendChild(openLibBlockBtn);
        }
        if (isBlockId(item.source.sourceBlockId) && item.source.sourceBlockId !== item.blockId) {
            const pullSourceBtn = document.createElement("button");
            pullSourceBtn.type = "button";
            pullSourceBtn.className = "b3-button b3-button--text xlc-form-ai";
            pullSourceBtn.dataset.xlcControl = "edit.pull-source";
            pullSourceBtn.textContent = "↻ 从原块拉取";
            pullSourceBtn.title = "从关联的思源来源块拉取最新内容填入编辑框";
            pullSourceBtn.addEventListener("click", () => {
                void this.library.pullFromSourceBlock(item.id).then((res) => {
                    if (res.ok) {
                        contentEl.value = res.data.markdown;
                        tagsEl.value = res.data.item.tags.join(", ");
                        this.invalidatePreviewCache([item.id]);
                        this.notifyExternalDataChange();
                        this.notify("info", "已从思源来源块拉取最新内容");
                    } else {
                        this.notify("error", res.message);
                    }
                });
            });
            srcRow.appendChild(pullSourceBtn);
        }
        form.appendChild(srcRow);
        const actions = document.createElement("div");
        actions.className = "xlc-form-actions";
        const cancel = document.createElement("button");
        cancel.type = "button";
        cancel.className = "b3-button";
        cancel.textContent = t("cancel");
        cancel.addEventListener("click", () => dialog.destroy());
        const save = document.createElement("button");
        save.type = "button";
        save.className = "b3-button xlc-btn-primary";
        save.textContent = t("save");
        // 单行输入 Enter 提交（与捕获表单一致；textarea 换行合法，不绑）
        const submitOnEnter = (el: HTMLInputElement): void => {
            el.addEventListener("keydown", (ev) => {
                // IME 组合态：Enter 属选词确认，不得触发保存（对齐 capture.ts 惯例，R139 补漏）
                if (ev.isComposing || ev.keyCode === 229) return;
                if (ev.key === "Enter" && !ev.altKey && !ev.ctrlKey && !ev.metaKey) {
                    ev.preventDefault();
                    save.click();
                }
            });
        };
        [titleEl, aliasEl, shortcodeEl, tagsEl, categoryEl].forEach((el) => submitOnEnter(el));
        // 保存防重入 + 按钮禁用（连点会双写块）；失败恢复并诚实回执（R106）
        let saving = false;
        save.addEventListener("click", () => {
            if (saving) return;
            if (!contentEl.value.trim()) {
                contentEl.classList.add("xlc-input--error");
                contentEl.focus();
                this.notify("error", t("invalidItem"));
                return;
            }
            if (item.itemType === "url" && !isSafeHttpUrl(contentEl.value.trim())) {
                contentEl.classList.add("xlc-input--error");
                contentEl.focus();
                this.notify("error", t("invalidItem"));
                return;
            }
            saving = true;
            save.disabled = true;
            save.textContent = t("saving");
            cancel.disabled = true;
            const rawShortcode = shortcodeEl.value.trim();
            const resolvedShortcode = rawShortcode
                ? cleanShortcode(rawShortcode)
                : (aliasEl.value.trim().startsWith(":") ? cleanShortcode(aliasEl.value.trim()) : "");
            void this.library.updateItem(item.id, {
                title: titleEl.value,
                alias: aliasEl.value,
                shortcode: resolvedShortcode,
                tags: tagsEl.value.split(/[,，、;；\s]+/).map((s) => s.trim()).filter(Boolean),
                category: categoryEl.value,
                markdown: contentEl.value !== initialKramdown ? contentEl.value : undefined,
                // URL 条目的真实打开/插入目标来自 custom-xlc-url；编辑正文时同步更新，避免预览与实际动作分叉。
                url: item.itemType === "url" ? contentEl.value.trim() : undefined,
            }).then((result) => {
                if (result.ok) {
                    this.invalidatePreviewCache([item.id]);
                    this.notify("info", t("updated", shortTitle(result.data.item.title)));
                    this.notifyExternalDataChange();
                    dialog.destroy();
                } else {
                    saving = false;
                    save.disabled = false;
                    save.textContent = t("save");
                    cancel.disabled = false;
                    this.notify("error", result.message);
                }
            }).catch((err) => {
                saving = false;
                save.disabled = false;
                save.textContent = t("save");
                cancel.disabled = false;
            this.notify("error", t("kernelError", toErrorMessage(err)));
            });
        });
        actions.appendChild(cancel);
        actions.appendChild(save);
        form.appendChild(actions);
        body.appendChild(form);
    }

    private registerRaikiriWidget(): void {
        this.raikiriDisposer = registerRaikiriModuleSafely({
            moduleId: "common-quick-palette",
            title: "常用资产",
            description: "展示高频与最近使用的常用语资产",
            icon: "iconXlcCommon",
            category: "资产",
            source: {
                pluginId: "xiaolv-common",
                name: "小驴常用",
                version: PLUGIN_VERSION,
            },
            read: async () => {
                const res = await this.service.getRecent(5);
                const items = (res.ok && res.data)
                    ? res.data.map((it) => ({
                        label: it.title ?? it.id,
                        value: it.itemType,
                        command: `xiaolv.common.insert:${it.id}`,
                    }))
                    : [];
                return {
                    title: "常用资产",
                    items,
                };
            },
            open: () => {
                this.openSearch();
            },
        });
    }

    // ---- 首次引导 / 设置 ----

    private settingsContext(): SettingsUiContext {
        return {
            t: this.i18nFn(),
            state: this.state,
            getConfig: () => this.config,
            library: this.library,
            ai: this.ai,
            registry: this.registry,
            notify: this.notify,
            applyConfig: (config) => this.applyConfig(config),
            persistSoon: () => this.persistSoon(),
            exportBundle: () => this.exportBundle(),
            importBundleText: (text, policy) => this.importBundleText(text, policy),
            importMarkdownItems: (items, policy) => this.importMarkdownItems(items, policy),
            fetchAssetBytes: (path) => this.fetchAssetBytes(path),
            aiErrorText: (err) => this.aiErrorText(err),
            applyPinyinAdapter: () => this.applyPinyinAdapter(),
            refreshSearch: () => this.notifyExternalDataChange(),
            openLibraryDoc: () => {
                this.openLibraryDocument();
            },
            getSavedDiscoveryViews: () => this.state.search.savedDiscoveryViews ?? [],
            openSavedDiscoveryView: (view) => this.openSavedDiscoveryView(view),
            deleteSavedDiscoveryView: (id) => this.deleteSavedDiscoveryView(id),
        };
    }

    /** 首次引导（仅库选择；完整设置见 openSettings） */
    openSetup(): void {
        const context = this.settingsContext();
        void import("./ui/settings-dialog").then(({openSetupDialog}) => {
            openSetupDialog(context, {
                onConfigured: () => {
                    // 设置完成后自动打开搜索弹窗（空态引导用户开始捕获）
                    this.openSearch();
                },
            });
        }).catch((err: unknown) => {
            this.notify("error", this.i18nFn()("startupFailed", toErrorMessage(err)));
        });
    }

    /**
     * 官方思源插件设置入口（对齐 SiYuan hasPluginSetting 识别契约）：
     * 覆盖 Plugin 基类的 openSetting()，使宿主在已安装插件列表与顶栏菜单中正常呈现「设置」按钮。
     */
    openSetting(): void {
        this.openSettings();
    }

    /** 完整设置：库管理（含更改库）+ AI + 搜索 + 数据 */
    openSettings(): void {
        const context = this.settingsContext();
        void import("./ui/settings-dialog").then(({openSettingsDialog}) => {
            openSettingsDialog(context);
        }).catch((err: unknown) => {
            this.notify("error", this.i18nFn()("startupFailed", toErrorMessage(err)));
        });
    }

    /** 资源字节获取：/api/file/getFile 为二进制端点，fetchSyncPost 信封不适用，
     *  使用同源 fetch（思源前端鉴权走 cookie，随同源请求自动携带）。失败返回 null。
     *  路径校验：只接受 assets/ 相对路径，禁止 ..、反斜杠、空段与绝对路径。 */
    private async fetchAssetBytes(assetPath: string): Promise<Uint8Array | null> {
        const rel = assetPath.startsWith("assets/") ? assetPath.slice("assets/".length) : "";
        const safe = !!rel && !assetPath.includes("..") && !assetPath.includes("\\") && rel.split("/").every((part) => part.length > 0);
        if (!safe) return null;
        try {
            const res = await fetch(`/api/file/getFile?path=${encodeURIComponent(assetPath)}`);
            if (!res.ok) return null;
            return new Uint8Array(await res.arrayBuffer());
        } catch {
            return null;
        }
    }

    private applyConfig(config: LibraryConfig): void {
        this.config = config;
        this.library.setConfig(config);
        this.invalidatePreviewCache();
        this.persistSidecar(STORAGE_KEYS.config, config);
        this.notifyExternalDataChange();
        void this.library.reindex().then((idx) => {
            this.notifyExternalDataChange();
            this.notify("info", idx.truncated
                ? this.i18nFn()("reindexTruncated", String(LIMITS.maxItems))
                : this.i18nFn()("reindexDone", String(idx.entries.length)));
        }).catch((err) => this.notify("error", this.i18nFn()("kernelError", toErrorMessage(err))));
    }

    // ---- 导入导出 ----

    async exportBundle(): Promise<string> {
        const idx = await this.library.ensureIndex();
        if (idx.truncated || idx.stopped || idx.errors.length > 0) {
            throw new ExportIntegrityError("index-incomplete");
        }
        const items: CommonItem[] = [];
        const kramdownById = new Map<string, string>();
        for (const item of idx.items.values()) {
            const kd = await this.library.getStoredItemKramdown(item);
            if (!kd.ok) throw new ExportIntegrityError("item-unreadable", item.title || item.id, kd.message);
            items.push(item);
            kramdownById.set(item.id, kd.data);
        }
        return JSON.stringify(buildBundle(items, kramdownById, Date.now()), null, 2);
    }

    async importBundleText(jsonText: string, policy: ConflictPolicy): Promise<ImportReceipt> {
        const validation = validateImport(jsonText);
        if (!validation.ok || !validation.parsed) {
            throw new Error(validation.reason ?? "invalid");
        }
        // 逐条应用与 overwrite 更新语义在 service/importer.ts（可独立单测）
        return importBundleCore(this.library, validation.parsed, policy);
    }

    async importMarkdownItems(items: ReadonlyArray<ExportedItem>, policy: ConflictPolicy): Promise<ImportReceipt> {
        return importMarkdownBundle(this.library, items, policy);
    }

    // ---- 全家桶一键联合灾备切面 (Epoch 7 Phase 4) ----

    async dumpData(): Promise<Record<string, unknown>> {
        let itemsBundle: ExportBundle | null = null;
        try {
            if (this.library) {
                const idx = await this.library.ensureIndex();
                if (idx && idx.items) {
                    const items: CommonItem[] = [];
                    const kramdownById = new Map<string, string>();
                    for (const item of idx.items.values()) {
                        try {
                            const kd = await this.library.getStoredItemKramdown(item);
                            if (kd.ok && kd.data) {
                                items.push(item);
                                kramdownById.set(item.id, kd.data);
                            }
                        } catch {
                            // 单条读取异常不阻断全量导出
                        }
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
            config: this.config ?? null,
            state: this.state ?? null,
            itemsBundle: itemsBundle ?? null,
        };
    }

    async restoreData(data: Record<string, unknown>): Promise<boolean> {
        if (!data || typeof data !== "object") return false;
        try {
            if (data.config && typeof data.config === "object") {
                const normalizedConfig = normalizeLibraryConfig(data.config);
                if (normalizedConfig) {
                    this.config = normalizedConfig;
                    this.persistSidecar(STORAGE_KEYS.config, this.config);
                    this.library?.setConfig(normalizedConfig);
                }
            }
            if (data.state && typeof data.state === "object") {
                const normalizedState = normalizeState(data.state);
                if (normalizedState) {
                    this.state = normalizedState;
                    this.persistSidecar(STORAGE_KEYS.state, this.state);
                }
            }
            if (data.itemsBundle && typeof data.itemsBundle === "object") {
                try {
                    await this.importBundleText(JSON.stringify(data.itemsBundle), "overwrite");
                } catch (err) {
                    console.warn("[xiaolv-common] restoreData importBundle error:", err);
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
                } catch (err) {
                    console.warn("[xiaolv-common] restoreData items array error:", err);
                }
            }
            return true;
        } catch (err) {
            console.error("[xiaolv-common] restoreData failed:", err);
            return false;
        }
    }

    // ---- 小驴罗盘快捷行动入口 (Epoch 7 Phase 5) ----

    openCommonPanel(): void {
        this.openSearch();
    }

    async handleQuickAction(action: string): Promise<void> {
        if (action.includes("搜索")) {
            this.openSearch();
        } else if (action.includes("复制置顶") || action.includes("置顶")) {
            lvLaunchpad.haptic(12);
            const top = await this.getTopSnippet();
            if (top) {
                await this.host.writeClipboard(top.content);
                this.notify("info", `已复制「${top.title}」，去目标应用粘贴`);
            } else {
                this.notify("info", "暂无可复制的置顶常用片段");
            }
        } else if (action.includes("剪贴板保存") || action.includes("从剪贴板") || action.includes("新建")) {
            lvLaunchpad.haptic(12);
            void this.capture?.quickCaptureFromClipboard();
        } else if (action.includes("剪贴板历史") || action.includes("历史")) {
            this.openSearch(undefined, undefined, undefined, undefined, "clipboard");
        } else if (action.includes("变体") || action.includes("智能生成")) {
            const targetId = this.state.favorites[0] || this.state.recents[0]?.id;
            if (targetId) {
                try {
                    await this.generateVariantsForItem(targetId);
                } catch (err) {
                    this.notify("error", `生成变体失败: ${toErrorMessage(err)}`);
                }
            } else {
                this.notify("info", "暂无可生成变体的常用片段");
            }
        } else {
            this.openSearch();
        }
    }

    /** 读取首条置顶/高频常用片段，供手机端一键复制 (Mobile Spec v1) */
    async getTopSnippet(): Promise<{ id: string; title: string; content: string } | null> {
        if (!this.library) return null;
        try {
            const idx = await this.library.ensureIndex();
            if (!idx || idx.entries.length === 0) return null;
            let topId = this.state.favorites[0] || this.state.recents[0]?.id;
            let entry = topId ? idx.entries.find((e) => e.id === topId) : undefined;
            if (!entry && idx.entries.length > 0) {
                entry = idx.entries[0];
            }
            if (!entry) return null;
            const got = await this.library.getItem(entry.id);
            let content = entry.summary || entry.title;
            if (got.ok) {
                const kdRes = await this.library.getStoredItemKramdown(got.data);
                content = kdRes.ok && kdRes.data ? kdRes.data : (got.data.summary || entry.title);
            }
            return { id: entry.id, title: entry.title, content };
        } catch {
            return null;
        }
    }

    /**
     * 为指定常用片段一键由 AI 生成中英双语版、礼貌商务版、极简要点版，存为子模版 (Epoch 7 Phase 6)
     */
    async generateVariantsForItem(itemId: string): Promise<CommonItem[]> {
        if (!this.library) return [];
        const idx = await this.library.ensureIndex();
        const item = idx.items.get(itemId);
        if (!item) throw new Error("条目不存在");
        const kdRes = await this.library.getStoredItemKramdown(item);
        if (!kdRes.ok || !kdRes.data) throw new Error("无法读取条目内容");
        const variants = await aiGenerateSnippetVariants(item.title, kdRes.data);
        const createdItems: CommonItem[] = [];
        for (const variant of variants) {
            const receipt = await this.library.createItem({
                itemType: item.itemType === "code" ? "code" : "text",
                title: `${item.title}${variant.titleSuffix}`,
                markdown: variant.content,
                category: item.category || "常用",
                tags: [...(item.tags || []), "AI变体", variant.label],
            });
            if (receipt.ok && receipt.data?.item) {
                createdItems.push(receipt.data.item);
            }
        }
        this.notify("info", `已为「${item.title}」生成 ${createdItems.length} 个 AI 智能变体`);
        return createdItems;
    }

    /**
     * 模版根据上下文智能展开与补全 (Epoch 7 Phase 6)
     */
    async smartExpandTemplate(templateText: string, context?: TemplateExpansionContext): Promise<string> {
        return aiSmartExpandTemplate(templateText, context);
    }

    // ---- 小驴穿透搜索辅助接口 (Epoch 7 Phase 7) ----

    async searchSnippets(keyword: string): Promise<Array<{ id: string; title: string; content: string }>> {
        if (!this.library) return [];
        try {
            const idx = await this.library.ensureIndex();
            if (!idx) return [];
            const kw = (keyword || "").trim().toLowerCase();
            const hits: Array<{ id: string; title: string; content: string }> = [];
            for (const item of idx.items.values()) {
                const titleMatch = item.title.toLowerCase().includes(kw);
                const summaryMatch = (item.summary || "").toLowerCase().includes(kw);
                const tagMatch = item.tags.some(t => t.toLowerCase().includes(kw));
                const aliasMatch = (item.alias || "").toLowerCase().includes(kw);
                const shortcodeMatch = (item.shortcode || "").toLowerCase().includes(kw);
                if (!kw || titleMatch || summaryMatch || tagMatch || aliasMatch || shortcodeMatch) {
                    hits.push({
                        id: item.id,
                        title: item.title,
                        content: item.summary || item.title,
                    });
                }
            }
            // 覆盖手机高频实体：按使用频次与收藏权重排序
            hits.sort((a, b) => {
                const uA = this.state.usage[a.id];
                const countA = typeof uA === "number" ? uA : (uA?.count ?? 0);
                const uB = this.state.usage[b.id];
                const countB = typeof uB === "number" ? uB : (uB?.count ?? 0);
                if (countB !== countA) return countB - countA;
                const isFavA = this.state.favorites.includes(a.id) ? 1 : 0;
                const isFavB = this.state.favorites.includes(b.id) ? 1 : 0;
                return isFavB - isFavA;
            });
            return hits;
        } catch {
            return [];
        }
    }

    async insertSnippet(itemId: string): Promise<boolean> {
        if (!this.service) return false;
        try {
            const res = await this.service.insert(itemId, {mode: "insert"});
            return res.ok;
        } catch {
            return false;
        }
    }

    // ---- 协议能力（雷切等消费）----

    getCapabilities(): CapabilityDescriptor[] {
        return this.service.getCapabilities();
    }

    registerProvider(descriptor: ProviderDescriptor, runtime?: {search?(query: string): Promise<Array<{title: string; payload: string}>>}): void {
        const result = this.service.registerProvider(descriptor, runtime);
        if (result.ok) this.notifyExternalDataChange();
        this.notify(result.ok ? "info" : "error", result.ok
            ? this.i18nFn()("providerRegistered", descriptor.displayName)
            : (result.message ?? "rejected"));
    }

    unregisterProvider(pluginId: string): void {
        const result = this.service.unregisterProvider(pluginId);
        if (result.ok) this.notifyExternalDataChange();
        this.notify(result.ok ? "info" : "error", result.ok
            ? this.i18nFn()("providerUnregistered", pluginId)
            : (result.message ?? "rejected"));
    }

    async onunload(): Promise<void> {
        this.scrimClickCleaner?.();
        this.scrimClickCleaner = undefined;
        const unloadStartedAt = Date.now();
        const discoveryWaitBudgetMs = 4000;
        this.unloading = true;
        const discoveryShutdown = this.discovery?.shutdown(discoveryWaitBudgetMs);
        // 小驴全生态统一通知套件 · 注销与平滑交棒 (Epoch 7)
        try {
            this.noticeHubCleaner?.();
        } catch {
            // 宿主已销毁：忽略
        }
        this.noticeHubCleaner = undefined;
        // 小驴全生态统一灾备总线 · 注销切面 (Epoch 7 Phase 4)
        try {
            this.backupCleaner?.();
        } catch {
            // 宿主已销毁：忽略
        }
        this.backupCleaner = undefined;
        // 小驴罗盘 · 注销入口 (Epoch 7 Phase 5)
        try {
            this.launchpadCleaner?.();
        } catch {
            // 宿主已销毁：忽略
        }
        this.launchpadCleaner = undefined;
        // 小驴罗盘 · 移动端统一收敛入口卸载 (Protocol v1.6.0 Mobile)
        try {
            this.mobileEntryCleaner?.();
        } catch {
            // 宿主已销毁：忽略
        }
        this.mobileEntryCleaner = undefined;
        // 小驴穿透搜索 · 注销检索切面 (Epoch 7 Phase 7)
        try {
            this.searchCleaner?.();
        } catch {
            // 宿主已销毁：忽略
        }
        this.searchCleaner = undefined;
        // 小驴统一节拍时钟 · 注销跨日切面
        try {
            this.dateCrossCleaner?.();
        } catch {
            // 宿主已销毁：忽略
        }
        this.dateCrossCleaner = undefined;
        // 对外窗口桥先行注销（兄弟插件在桥消失后应得到 unsupported，而非悬挂调用）
        try {
            this.bridgeDisposer?.();
        } catch {
            // 宿主 window 已销毁：忽略
        }
        this.bridgeDisposer = null;
        try {
            this.raikiriDisposer?.();
        } catch {
            // 忽略
        }
        this.raikiriDisposer = null;
        try {
            this.clipboardListenerCleanup?.();
        } catch {
            // ignore
        }
        this.clipboardListenerCleanup = null;
        this.closeQuickAccessPopover();
        this.discoveryDialog?.close(true);
        this.discoveryDialog = null;
        // 事件总线/监听全部随 dialog destroy 释放；侧车已节流持久化
        if (this.menuHandler) {
            try {
                this.eventBus.off("open-menu-content", this.menuHandler);
            } catch {
                // 宿主事件总线已销毁：忽略
            }
            this.menuHandler = null;
        }
        const removeBlockrefHandler = this.blockRefMenuHandler;
        const removeLinkHandler = this.linkMenuHandler;
        const removeImageHandler = this.imageMenuHandler;
        const removeDoctreeHandler = this.docTreeMenuHandler;
        const removeBlockIconHandler = this.blockIconMenuHandler;
        const removeEditorTitleHandler = this.editorTitleMenuHandler;
        const removeSwitchProtyleHandler = this.switchProtyleHandler;
        const removeWsMainHandler = this.wsMainHandler;
        try {
            if (removeBlockrefHandler) this.eventBus.off("open-menu-blockref", removeBlockrefHandler);
        } catch {
            // 宿主事件总线已销毁：继续尝试解绑其余处理器
        }
        try {
            if (removeLinkHandler) this.eventBus.off("open-menu-link", removeLinkHandler);
        } catch {
            // 宿主事件总线已销毁：继续尝试解绑其余处理器
        }
        try {
            if (removeImageHandler) this.eventBus.off("open-menu-image", removeImageHandler);
        } catch {
            // 宿主事件总线已销毁：继续尝试解绑其余处理器
        }
        try {
            if (removeDoctreeHandler) this.eventBus.off("open-menu-doctree", removeDoctreeHandler);
        } catch {
            // 宿主事件总线已销毁：忽略
        }
        try {
            if (removeBlockIconHandler) this.eventBus.off("click-blockicon" as any, removeBlockIconHandler as any);
        } catch {
            // 忽略
        }
        try {
            if (removeEditorTitleHandler) this.eventBus.off("click-editortitleicon" as any, removeEditorTitleHandler as any);
        } catch {
            // 忽略
        }
        try {
            if (removeSwitchProtyleHandler) {
                this.eventBus.off("switch-protyle" as any, removeSwitchProtyleHandler as any);
                this.eventBus.off("loaded-protyle-static" as any, removeSwitchProtyleHandler as any);
            }
        } catch {
            // 忽略
        }
        try {
            if (removeWsMainHandler) this.eventBus.off("ws-main" as any, removeWsMainHandler as any);
        } catch {
            // 忽略
        }
        this.blockRefMenuHandler = null;
        this.linkMenuHandler = null;
        this.imageMenuHandler = null;
        this.docTreeMenuHandler = null;
        this.blockIconMenuHandler = null;
        this.editorTitleMenuHandler = null;
        this.switchProtyleHandler = null;
        this.wsMainHandler = null;
        this.protyleSlash = [];
        if (this.wsSyncTimer) {
            clearTimeout(this.wsSyncTimer);
            this.wsSyncTimer = null;
        }
        this.searchDialog?.destroy();
        this.searchDialog = null;
        this.capture?.destroy();
        this.capture = null;
        this.dockView?.destroy();
        this.dockView = null;
        if (this.saveTimer) clearTimeout(this.saveTimer);
        this.persistSidecar(STORAGE_KEYS.state, this.state, false);
        if (discoveryShutdown) {
            let timer: ReturnType<typeof setTimeout> | undefined;
            const remainingMs = Math.max(0, discoveryWaitBudgetMs - (Date.now() - unloadStartedAt));
            const timedOut = Symbol("discovery-shutdown-timeout");
            const result = await Promise.race([
                discoveryShutdown,
                new Promise<typeof timedOut>((resolve) => {
                    timer = setTimeout(() => resolve(timedOut), remainingMs);
                }),
            ]);
            if (timer !== undefined) clearTimeout(timer);
            if (result === timedOut) {
                console.warn("[LvCommon] 卸载等待发现收录清理超过 4 秒，当前条目清理结果尚未确认；思源可能继续拆除插件资源");
                void discoveryShutdown.then((lateResult) => {
                    if (lateResult.compensatedItemIds.length) {
                        console.info("[LvCommon] 卸载等待超时后，发现收录条件清理已完成", lateResult.compensatedItemIds);
                    }
                    for (const item of lateResult.unresolved) {
                        console.warn("[LvCommon] 卸载等待超时后仍无法确认发现收录状态", item);
                    }
                }).catch((error) => {
                    console.warn("[LvCommon] 卸载等待超时后发现收录清理仍未完成", error);
                });
            } else {
                for (const item of result.unresolved) {
                    console.warn("[LvCommon] 发现收录在插件卸载期间未能安全确认", item);
                }
            }
        }
    }

    uninstall(): Promise<void> {
        // 卸载不删用户库文档；侧车数据由宿主清理（data/storage/）
        return Promise.resolve();
    }
}

/** 官方选区读取：纯文本 + 当前块 ID（仅依赖公开的 data-node-id，见 ADR 0003） */
function getSelectionInfo(): {text: string; blockId: string | null} {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return {text: "", blockId: null};
    const text = sel.isCollapsed ? "" : sel.toString();
    let node: Node | null = sel.anchorNode;
    while (node && !(node instanceof Element)) node = node.parentNode;
    const el = node as Element | null;
    const block = el?.closest?.("[data-node-id]") as HTMLElement | null;
    return {text, blockId: block?.getAttribute("data-node-id") ?? null};
}
