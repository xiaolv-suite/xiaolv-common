// 搜索弹窗（生产版，质感基准：docs/design/prototype.html）：
// 桌面双栏（左列表右预览，窄容器单列降级）/ 移动端底部 sheet（同一 DOM，CSS 形态切换）。
// 安全：所有内容字符串只走 textContent，绝不 innerHTML 注入外部文本。
// 键盘：↑↓ 选择（预览跟随）、Enter 插入、Ctrl+Enter 复制、Esc 关闭；搜索框首焦点。
// 触控：44px 命中区、长按 550ms（移动 <10px 判定）弹动作菜单；不依赖 hover、不做坐标猜测。
// AI：? 前缀语义找条目（默认仅元数据出域）；动作菜单 AI 变换（预览后选插入，原文永不被改写）。
import {Dialog} from "siyuan";
import {lvEcosystem, lvLaunchpad, lvNotify, lvSurfaceStack} from "../libs/lv-notice-kit";
import {adaptSecondaryDialogForMobile, getDialogBody, isMobileDialogViewport, mountPlatformDialogTitleWrap, openTextPromptDialog} from "./dialog-dom";
import {ITEM_TYPES, ItemType, getCategoryColorVariant, deriveSmartSummary, isBlockId, kramdownToPlainText, parseSnippetAnnotations, extractCleanPayload} from "../model/item";
import {ItemSortMode} from "../model/storage";
import {cleanClipboardText, formatPanguSpacing, tsvToMarkdownTable, formatJsonText, compactJsonText, stripUrlTrackingParams, normalizeListFormatting, deduplicateLines, compactWhitespaceAndLines, convertWidth, encodeBase64, decodeBase64, encodeUrlText, decodeUrlText, toggleMarkdownBlockquote, escapeHtmlEntities, unescapeHtmlEntities, formatMarkdownTable, csvToJson, toggleMarkdownTaskStatus, extractMarkdownLinks, generateTextHash, titleCaseLines, reverseLines, sortLinesByLength, numberLines, trimLinesAdvanced, normalizeObjectQuotes, truncateText, stripAffixes, propertiesToJson, jsonToProperties, maskSensitiveText, joinLinesWithDelimiter, splitTextToLines, formatChineseCurrency, extractInitials, stripMarkdownFormatting, formatByteSize, shuffleLines, filterLines, reverseText, romanToArabic, arabicToRoman, padLines, explainCronExpression, convertChineseVariant, compactBlankLines, formatRelativeTime, countWordFrequency, surroundEachLine, extractExecutiveSummary, convertIndentation, sumNumericLines, getChineseZodiacAndStemBranch, extractRepeatedPhrases, extractColumnFromLines, pickWeightedOption, pluralizeText, transposeMatrixText, numberToEnglishWords, expandEnglishContractions, diffLinesQuick, convertColorFormat, humanizeIdentifier, zipLines, calculateStats, slugifyText, setOperationsOnLines, convertRadix, stripAffixWords, parseKeyValuePairs, sortLinesByColumn, formatByRegexGroups, indentLines, outdentLines, validateFormat, filterMarkdownTable, swapLineParts, parsePathParts, deduplicateWithCount, normalizeSmartQuotes, interleaveLines, convertObjectKeysCase, formatUnitSpacing, filterCharacterSet, generateNanoId, toggleLineComments, renderSimpleTemplate, checkBracketsBalance, normalizePunctuationAdaptive, obfuscateText, wrapTextLines, shiftMarkdownHeadings, ensureLineAffixes, regexReplaceMultiline, detectCodeLanguage, scrambleText, compactRepeatedCharacters, calculateTaskProgress, sliceLinesByPattern, formatNumberGrouping, shiftMarkdownBlockquotes, calculateChecksum, alignDelimitedColumns, stripCodeComments, groupLinesByPattern, normalizeHorizontalRules, alignMarkdownTableColumns, padOrTruncate, sanitizeLineEndingsAndSpaces, convertIdentifierNamingStyle, generateNumericSequence, markdownTableToDelimited, convertListStyle, generateShortHash, filterTaskItems, filterLinesByAffix, generateRandomColor, renumberOrderedList, convertMarkdownLinks, truncateByBytes, formatPunctuationSpacing, markdownTableToKeyValue, extractChinesePinyinInitials, normalizeBlankLinesStrict, keyValueToMarkdownTable, generateMarkdownToc, setMarkdownCodeFenceLang, escapeMacroPipe, formatTextColumnsGrid, sortMarkdownList, repeatText, sortLinesByVisualWidth, invertTaskStatus, centerText, convertListDelimiter, normalizeMarkdownFootnotes, escapeBackslash, chunkLinesByDelimiter, flattenMarkdownBlockquotes, reverseWords, stripInlineMarkdownFormatting, formatKpiSummaryCard, generateRandomName, groupLinesByAlphabet, measureVisualWidth, shiftListIndentation, flattenNestedList, formatCJKSpacingComprehensive, convertNumberSymbols, extractCodeBlocksFromMarkdown, convertHeadingsToList, filterNumericRangeLines, numberMarkdownHeadings, formatTaskProgressBar, transposeMarkdownTable, beautifyMarkdownTable, queryJsonPath, formatMarkdownCallout} from "../model/clipboard-cleaner";
import {inferTypeFromText} from "./capture";
import {getActivePasteQueue} from "../model/paste-queue";
import {calculateTextMetrics, formatReadingMetrics} from "../model/text-metrics";
import {toErrorMessage} from "../model/errors";
import {SearchEntry, SearchQuery, splitSearchTokens, findExactAliasMatch, findExactShortcodeMatch, parseSearchPrefix} from "../model/search";
import {BatchTagCategoryPatch, BatchOperationReceipt} from "../model/batch-ops";
import {InsertMode, buildBlockRef, buildEmbedBlock} from "../model/actions";
import {TransformKind} from "../service/ai";
import {ProviderRow} from "../model/provider-section";
import {AskField, askFieldTag, hasCursorToken, listAskFields, listSnippetRefs, expandAsks, applyAskDefaults, stripCursorToken, stripAllVariables, hasDynamicMacros, expandMacroPreview} from "../model/variables";
import {openVariableFillCard} from "./variable-form";
import {formatScopeFallbackQuery, shouldShowOmniSearchFallback, shouldShowScopeFallback, SearchScope} from "./empty-state";
import {getPinyinAdapter} from "../model/pinyin";
import {findPinyinMatches} from "../model/pinyin-tiny";
import {renderSafePreview, renderDualMacroPreview} from "./preview-renderer";
import {buildHierarchyTree, flattenHierarchyTree} from "../model/hierarchy";
import {formatPlatformShortcut, detectShortcutConflicts} from "../model/hotkeys";
import {calculateVirtualScrollWindow} from "./performance-utils";
import {buildBundle, serializeCompactBundle, deserializeCompactBundle, COMPACT_BUNDLE_PREFIX, ExportBundle} from "../model/transfer";
import {renderWechatArticleHtml, writeRichClipboard, formatItemContent, ItemCopyFormat, mergeTrayContents, TraySeparatorKind} from "../model/clipboard";
import {transformCase} from "../model/placeholders";
import {evaluateMathExpression} from "../model/calculator";

import {AdjacentBlocksContext} from "../service/omni-search";
import {openStepByStepGuideDialog} from "./guide-dialog";
import {openShareCardDialog} from "./share-card";
import {openPinboardDialog} from "./pinboard";
import {openStarterPacksHubDialog} from "./starter-packs-dialog";
import {getRecommendedEntries, DocumentContext} from "../model/contextual-recommend";
import {callBridge, getBridgeSafely} from "../ecosystem-bridge-kit";
import {getClipboardTimeGroup, MiniPosition, calculateMagneticSnap} from "../model/storage";
import {STARTER_PACKS, StarterPackMeta} from "../service/prompt-pack";
import {openPromoteClipDialog, PromoteClipPayload} from "./promote-clip";

/**
 * 提取条目关联的真实 22 位思源物理块 ID（T-0757 / FN-02）：
 * 全域检索条目的 entry.id 带 "xlc-omni-" 前缀，必须优先读取 targetBlockId / sourceBlockId / blockId 或剥离前缀。
 */
export function resolveEntryBlockId(entry: SearchEntry): string {
    const strippedOmni = entry.id.startsWith("xlc-omni-") ? entry.id.slice("xlc-omni-".length) : entry.id;
    const candidates = [entry.targetBlockId, entry.sourceBlockId, entry.blockId, strippedOmni];
    return candidates.find((id): id is string => typeof id === "string" && isBlockId(id)) ?? "";
}

export interface DialogDeps {
    t: (key: string, ...args: string[]) => string;
    notify?: (kind: "info" | "error", message: string) => void;
    /** 打开搜索面板时主动注入的初始查询词（例如从编辑器划选文本时带入） */
    initialQuery?: string;
    /** 打开搜索面板时主动指定的初始范围（如直接从斜杠菜单呼出 clipboard 剪贴板历史） */
    initialScope?: SearchScope;
    search: (query: SearchQuery) => Promise<{entries: SearchEntry[]; truncated: boolean; total: number; loading?: boolean; error?: string}>;
    /** 文档搜索（插入到指定文档的选择器） */
    searchDocs: (k: string) => Promise<Array<{id: string; hPath: string; name: string}>>;
    /** 全域搜索终端扩展（G12 / T-0123 / G14 / T-0126） */
    searchCurrentDoc?: (keyword: string) => Promise<SearchEntry[]>;
    searchAllNotes?: (keyword: string) => Promise<SearchEntry[]>;
    createFromOmni?: (entry: SearchEntry) => Promise<boolean>;
    captureOmniWithForm?: (entry: SearchEntry) => void;
    quickEditBlock?: (blockId: string, currentContent: string) => Promise<void> | void;
    openDocBlock?: (blockId: string) => Promise<void> | void;
    getDocPath?: (docId: string) => Promise<string>;
    getAdjacentBlocks?: (blockId: string, docId: string) => Promise<AdjacentBlocksContext | null>;
    insertToDoc: (itemId: string, docId: string, hPath: string, fills?: Record<string, string>, mode?: "insert" | "insert-content" | "insert-ref" | "insert-embed") => Promise<boolean>;
    duplicateItem: (itemId: string) => Promise<void>;
    /** AI 变换结果存为新条目（来源=原条目；原条目不被修改） */
    saveTransformed: (itemId: string, transformLabel: string, text: string) => Promise<void>;
    getTags: () => Promise<string[]>;
    /** 分类面（F4 分类筛选下拉） */
    getCategories: () => Promise<string[]>;
    preview: (itemId: string) => Promise<string>;
    runAction: (itemId: string, mode: InsertMode) => Promise<{ok: boolean; message: string}>;
    /** 变量填充：填充值随动作进入执行层（F1） */
    runActionWithFills: (itemId: string, mode: InsertMode, fills?: Record<string, string>) => Promise<{ok: boolean; message: string}>;
    /** 获取变量记忆预填值（ADR 0074 / G22 / T-0133） */
    getVariableDefaults?: (labels: string[]) => Record<string, string>;
    /** 记录变量填写值（ADR 0074 / G22 / T-0133） */
    rememberVariables?: (fills: Record<string, string>) => void;
    /** 批量更新条目标签与分类（G30 / ADR 0082 / T-0142） */
    batchUpdateMetadata?: (itemIds: string[], patch: BatchTagCategoryPatch) => Promise<BatchOperationReceipt>;
    openSource: (itemId: string) => Promise<{ok: boolean; message: string}>;
    pullFromSource?: (itemId: string) => Promise<boolean>;
    pushToSource?: (itemId: string) => Promise<boolean>;
    editItem: (itemId: string) => Promise<void>;
    deleteItem: (itemId: string) => Promise<void>;
    /** 筛选状态持久化（类型/标签/分类跨会话记忆；state.uiPrefs 承载） */
    getFilters: () => {type: string; tag: string; category: string};
    setFilters: (f: {type: string; tag: string; category: string}) => void;
    /** 上次搜索词（跨会话保留；空串=无） */
    getLastQuery: () => string;
    setLastQuery: (q: string) => void;
    /** 最近搜索历史队列（ADR 0043 / T-0070） */
    getRecentQueries?: () => string[];
    addRecentQuery?: (q: string) => void;
    removeRecentQuery?: (q: string) => void;
    clearRecentQueries?: () => void;
    getClipboardHistory?: () => Array<{text: string; copiedAt: number}>;
    clearClipboardHistory?: () => void;
    addClipboardHistory?: (text: string) => void;
    syncSystemClipboard?: () => Promise<string | null>;
    importBundleText?: (text: string) => Promise<unknown>;
    /** 当前活动选区文本（选区包裹模式唤起时传入） */
    surroundText?: string;
    /** 获取条目的变量预设方案 */
    getVariablePresets?: (itemId: string) => Record<string, Record<string, string>> | undefined;
    /** 保存条目的变量预设方案 */
    saveVariablePreset?: (itemId: string, name: string, fills: Record<string, string>) => void;
    /** 删除条目的变量预设方案 */
    deleteVariablePreset?: (itemId: string, name: string) => void;
    /** 定向插入目标（文档树入口；设置后 Enter/点按插入到该文档而非活动编辑器） */
    insertTarget?: {docId: string; hPath: string} | null;
    /** 启动主动作预设模式（从特定命令唤起时支持默认快速复制或打开来源） */
    defaultActionMode?: "insert" | "copy" | "openSource";
    toggleFavorite: (itemId: string) => boolean;
    isFavorite: (itemId: string) => boolean;
    insertRaw: (markdown: string, target?: {docId: string; hPath: string}) => Promise<boolean>;
    /** 写剪贴板（复制变换结果用，区别于条目原始内容的 runAction copy） */
    copyText: (text: string) => Promise<boolean>;
    getSort: () => ItemSortMode;
    /** 排序直选（R108：排序应可枚举而非循环切换——Raycast 动作可枚举惯例） */
    setSort: (sort: ItemSortMode) => void;
    /** 搜索结果行显示密度（CAND-012 / TODO-FEAT-011） */
    density?: "comfortable" | "compact";
    onDensityChange?: (density: "comfortable" | "compact") => void;
    /** 极窄悬浮迷你模式（CAND-018 / TODO-FEAT-017） */
    miniMode?: boolean;
    onMiniModeChange?: (mini: boolean) => void;
    /** 迷你悬浮条拖拽停留位置坐标（CAND-022 / TODO-FEAT-020） */
    miniPosition?: MiniPosition;
    onMiniPositionChange?: (pos: MiniPosition) => void;
    /** 迷你条折叠贴边微型胶囊状态（CAND-023 / TODO-FEAT-021） */
    miniCollapsed?: boolean;
    onMiniCollapsedChange?: (collapsed: boolean) => void;
    /** 是否从外部软件全局热键呼出（CAND-027 / TODO-FEAT-022） */
    isGlobalInvocation?: boolean;
    /** 复制完成或关闭时是否自动退回后台归还焦点（CAND-029 / TODO-FEAT-024） */
    autoMinimizeOnDone?: boolean;
    onReturnToBackground?: () => void;
    /** 获取当前活动编辑文档上下文（CAND-031 / TODO-FEAT-026） */
    getDocumentContext?: () => DocumentContext;
    openSetup: () => void;
    /** 全局常驻名片池 / 身份档案（CAND-016 / TODO-FEAT-015） */
    getProfilePresets?: () => Record<string, string>;
    /** 提供方候选（pv: 虚拟条目；绝不进入块执行器） */
    providerSearch: (query: string) => Promise<ProviderRow[]>;
    insertProviderPayload: (payload: string, target?: {docId: string; hPath: string}) => Promise<boolean>;
    copyProviderPayload: (payload: string) => Promise<boolean>;
    /** 使用计数（F3 展示：行 meta 与预览徽标；侧车只读） */
    getUsage: () => Record<string, {count: number; lastAt: number}>;
    /** 重置单条条目使用频次（ADR 0045 / T-0072） */
    resetItemUsage?: (itemId: string) => boolean;
    /** 一键极速灌入开箱即用行业套件（CAND-034 / TODO-FEAT-029） */
    importStarterPackDirect?: (markdown: string) => Promise<{ok: boolean; count: number}>;
    /** 在思源笔记本创建开箱套件专属文档并纳管（CAND-040 / TODO-FEAT-035） */
    createStarterPackDedicatedDoc?: (pack: StarterPackMeta) => Promise<{ok: boolean; count: number; docId?: string; hPath?: string}>;
    /** 手动新建条目（移动端「＋ 新建」入口） */
    newItem: (titleCandidate?: string) => void;
    /** 从文本快速创建草稿（拖拽放置 / 面板非输入区快捷粘贴，ADR 0034 / T-0061） */
    newWithContent?: (content: string, options?: {title?: string}) => void;
    /** AI 语义找（? 前缀触发；仅元数据出域；候选先按当前筛选过滤） */
    aiSemantic: (desc: string, filters: {itemType: string; tag: string; category: string; scope: "all" | "favorites" | "recent"}) => Promise<{ok: true; entries: SearchEntry[]} | {ok: false; message: string}>;
    /** AI 变换（需正文出域权限） */
    aiTransform: (itemId: string, kind: TransformKind) => Promise<{ok: true; text: string} | {ok: false; message: string}>;
    /** 自定义 AI 变换（F7）：与内置并列出现在菜单 ✦ 区 */
    listCustomTransforms: () => Array<{id: string; name: string}>;
    aiTransformCustom: (itemId: string, customId: string) => Promise<{ok: true; text: string} | {ok: false; message: string}>;
    aiEnabled: () => boolean;
    /** 当前是否存在可直接写入的活动编辑器；没有时主动作会降级为复制。 */
    hasActiveEditor?: () => boolean;
    /** 当前编辑器快照的位置仍有效；失效时不能改写到另一个活动编辑器。 */
    hasInsertTarget?: () => boolean;
    /** 插入前询问变量（F1；设置可关） */
    promptVariables: () => boolean;
    isSourceMissing: (entry: SearchEntry) => boolean;
    close: () => void;
    isMobile: () => boolean;
    isClipboardSmartMatchEnabled?: () => boolean;
    getPinnedTopChips?: () => string[];
    setPinnedTopChips?: (ids: string[]) => void;
    promoteClipboardEntry?: (entry: SearchEntry, payload: PromoteClipPayload) => Promise<boolean>;
}

const TYPE_BADGES: Record<ItemType, string> = {
    text: "TXT", markdown: "MD", url: "URL", code: "CODE",
    image: "IMG", asset: "FILE", blockref: "REF", structure: "BLK",
};

const TRANSFORM_KINDS: TransformKind[] = ["polish", "shorten", "formal", "translate-en", "bulletize"];

export class CommonSearchDialog {
    private dialog: Dialog | null = null;
    private results: SearchEntry[] = [];
    private providerRows: ProviderRow[] = [];
    private activeProvider = -1;
    private aiResults = false;
    private activeIndex = 0;
    private searchSeq = 0;
    private previewSeq = 0;
    private quickLookOpen = false;
    private quickLookSeq = 0;
    private quickLookReturnFocus: HTMLElement | null = null;
    private currentScope: SearchScope = "all";
    private autoSwitchedToAllNotes = false;
    private lastPreviewId: string | null = null;
    /** 窗口固定模式（连续调用时不关闭弹窗，Alt+P 切换） */
    private pinWindow = false;
    /** 空状态文案（refresh 计算后交 renderList 渲染大空态；瞬态/错误仍走 status 行） */
    private emptyMessage = "";
    /** 使用计数快照（refresh 时取自侧车；行 meta 与预览徽标展示用） */
    private usageCounts = new Map<string, number>();
    /** 最近一次查询词（行标题命中高亮用；空串=不高亮） */
    private lastQueryText = "";
    private multiSelectMode = false;
    private selectedIds = new Set<string>();
    private capturedOmniIds = new Set<string>();
    private batchBarEl: HTMLElement | null = null;
    /** 移动端置顶高频片段直达行容器 (Mobile Spec v1) */
    private topChipsContainer: HTMLElement | null = null;
    /** 剪贴板智能匹配横幅元素 (Mobile Spec v2) */
    private smartMatchBannerEl: HTMLElement | null = null;
    /** 移动端多级分类面包屑导航元素 (Mobile Spec v2) */
    private mobileBreadcrumbsEl: HTMLElement | null = null;
    /** 连续复制连击追踪器 (Mobile Spec v2: 30秒内≥2次触发提示) */
    private copyCombo = { itemId: "", count: 0, lastTime: 0 };
    /** 连击批量提示栏元素 */
    private copyComboBannerEl: HTMLElement | null = null;
    /** 动作菜单 document 监听兜底清理（destroy 时调用；防键盘关弹窗残留监听） */
    private menuDismiss: (() => void) | null = null;
    private inputDebounce: ReturnType<typeof setTimeout> | null = null;
    private longPressCancel: (() => void) | null = null;
    /** IME 组合输入中（中文输入法组词期间跳过刷新，compositionend 后统一刷新） */
    private isComposing = false;
    private filterOptionsSeq = 0;
    private primaryBusy = false;
    private varFormOpen = false;
    /** 大结果集只保留视口附近的行；窗口回调由 renderList 安装并在销毁/重绘时清理。 */
    private virtualListCleanup: (() => void) | null = null;
    private virtualEnsureIndex: ((index: number) => void) | null = null;
    private visualViewportCleanup: (() => void) | null = null;
    private syncMobileFilterToggleRef: (() => void) | null = null;
    private updateHistoryBarRef: (() => void) | null = null;
    private syncQueueChipRef: (() => void) | null = null;
    private compactBundleCandidate: ExportBundle | null = null;
    /** 剪贴板搜索流格式过滤（全部/纯文本/图片素材/代码片段 · CAND-001 / TODO-FEAT-001） */
    private clipboardFormatFilter: "all" | "text" | "image" | "code" = "all";
    /** 宿主拒绝请求时覆盖旧列表，避免用户继续对过期结果执行写操作。 */
    private accessIssueMessage: string | null = null;
    /** 搜索服务最多返回 100 条；80 以上即可明显减少首屏 DOM，同时保留小结果集的简单路径。 */
    private static readonly VIRTUAL_THRESHOLD = 80;
    private static readonly VIRTUAL_ROW_HEIGHT = 72;
    private static readonly VIRTUAL_OVERSCAN = 8;
    /** 搜索结果行显示密度（紧凑单行 / 舒适卡片 · CAND-012 / TODO-FEAT-011） */
    private density: "comfortable" | "compact" = "comfortable";
    private densityBtn: HTMLButtonElement | null = null;
    private listEl: HTMLElement | null = null;
    /** 极窄悬浮迷你模式（CAND-018 / TODO-FEAT-017） */
    private miniMode = false;
    private miniModeBtn: HTMLButtonElement | null = null;
    /** 迷你悬浮条停留坐标与折叠状态（CAND-022 / CAND-023） */
    private miniPosition?: MiniPosition;
    private miniCollapsed = false;
    private collapsedPillEl: HTMLElement | null = null;
    /** 常用语购物车暂存托盘（CAND-019 / TODO-FEAT-018） */
    private pasteTrayItems: Array<{id: string; title: string; content?: string}> = [];
    private pasteTrayEl: HTMLElement | null = null;
    private traySeparator: TraySeparatorKind = "double-newline";
    private surfaceUnregister?: (() => void);

    constructor(private readonly deps: DialogDeps) {
        if (deps.density) this.density = deps.density;
        if (deps.miniMode !== undefined) this.miniMode = deps.miniMode;
        if (deps.miniPosition) this.miniPosition = deps.miniPosition;
        if (deps.miniCollapsed !== undefined) this.miniCollapsed = deps.miniCollapsed;
    }

    /** 定向插入目标（文档树入口；设置后 Enter/点按插入到该文档而非活动编辑器） */
    insertTarget?: {docId: string; hPath: string} | null;
    open(): void {
        const isMobile = this.deps.isMobile();
        void this.deps.syncSystemClipboard?.();
        if (this.deps.initialScope) {
            this.currentScope = this.deps.initialScope;
        }
        this.clipboardFormatFilter = "all";
        this.prevActiveElement = (document.activeElement as HTMLElement | null);

        // 全生态统一浮层栈注册 (lvSurfaceStack)：Esc 键秒级仲裁与光标保护
        this.surfaceUnregister = lvSurfaceStack.push({
            id: `xlc-search-dialog-${Date.now()}`,
            type: "dialog",
            dismiss: () => {
                if (this.quickLookOpen) {
                    this.closeQuickLook();
                    return "keep";
                }
                if (this.menuDismiss) {
                    this.menuDismiss();
                    this.menuDismiss = null;
                    return "keep";
                }
                if (this.multiSelectMode) {
                    this.exitMultiSelectMode();
                    return "keep";
                }
                this.destroy();
                return true;
            }
        });

        const dialog = new Dialog({
            title: this.deps.t("pluginName"),
            content: "",
            // 桌面采用宽松密度，减少截断并让双栏预览一次展示更多内容；移动端仍由 sheet 占满视口。
            width: isMobile ? "100vw" : "min(960px, 94vw)",
            height: isMobile ? "100dvh" : "min(820px, 92vh)",
            destroyCallback: () => {
                this.destroy();
                this.dialog = null;
                this.deps.close();
            },
        });
        this.dialog = dialog;
        dialog.element.addEventListener("keydown", (e) => {
            if (e.key === "Tab") {
                void this.onKeydown(e);
            }
        });
        const content = this.buildDom(isMobile);
        this.setupDragAndPaste(content);
        const body = getDialogBody(dialog.element);
        if (body) {
            body.innerHTML = "";
            body.appendChild(content);
            void this.refreshFilterOptions().then((changed) => {
                if (changed) void this.refresh();
            });
        }
        const container = this.dialog.element.querySelector<HTMLElement>(".b3-dialog__container");
        if (container) container.classList.add(isMobile ? "xlc-sheet" : "xlc-dialog-host");
        this.bindMobileVisualViewport(isMobile, container, content);
        mountPlatformDialogTitleWrap(this.dialog.element, this.deps.t("pluginName"));
        if (!isMobile) {
            adaptSecondaryDialogForMobile(this.dialog, this.deps.t("close") || "关闭");
        }
        this.applyMiniMode();
        this.syncScopeChips();
        const input = this.dialog.element.querySelector<HTMLInputElement>(".xlc-search-input");
        if (input) {
            const initial = this.deps.initialQuery?.trim();
            const queryToFill = initial || this.deps.getLastQuery();
            if (queryToFill) {
                input.value = queryToFill;
                if (!this.deps.initialScope) {
                    this.currentScope = "all";
                }
                input.dispatchEvent(new Event("input", {bubbles: true}));
                if (initial && !isMobile) {
                    // 若是由划选文本带入，全选以便用户可直接回车确认或敲键覆盖
                    input.select();
                }
            }
            if (!isMobile) {
                input.focus();
            }
        }
        void this.refresh();
    }

    /**
     * 绑定移动端 visualViewport 软键盘自适应监听：
     * 实时同步容器 --xlc-vv-h，并在软键盘弹起或输入框获焦时标记 data-keyboard-open="true"；
     * 弹窗销毁时完整移除全部监听，严防泄漏。
     */
    private bindMobileVisualViewport(isMobile: boolean, container: HTMLElement | null, root: HTMLElement): void {
        this.visualViewportCleanup?.();
        this.visualViewportCleanup = null;
        if (!isMobile || typeof window === "undefined") return;

        const vv = window.visualViewport ?? null;
        let lastWidth = window.innerWidth || 0;
        let baseHeight = Math.max(window.innerHeight || 0, vv?.height || 0);
        let blurSettleTimer: ReturnType<typeof setTimeout> | null = null;

        const syncViewport = (): void => {
            const curWinW = window.innerWidth || 0;
            const curWinH = window.innerHeight || 0;
            const vvHeight = vv && vv.height > 0 ? vv.height : curWinH;
            if (Math.abs(curWinW - lastWidth) > 80) {
                lastWidth = curWinW;
                baseHeight = Math.max(curWinH, vvHeight);
            } else if (Math.max(curWinH, vvHeight) > baseHeight) {
                baseHeight = Math.max(curWinH, vvHeight);
            }
            if (container && container.style && typeof container.style.setProperty === "function" && vvHeight > 0) {
                container.style.setProperty("--xlc-vv-h", `${Math.round(vvHeight)}px`);
            }
            const activeEl = typeof document !== "undefined" ? document.activeElement : null;
            const activeTag = activeEl ? activeEl.tagName : "";
            const isInputFocused = Boolean(
                activeEl
                && typeof root.contains === "function"
                && root.contains(activeEl)
                && (activeTag === "INPUT" || activeTag === "TEXTAREA")
            );
            const shrunkVsWindow = curWinH > 0 && vvHeight > 0 && vvHeight < curWinH * 0.78;
            const shrunkVsBase = baseHeight > 540 && vvHeight > 0 && vvHeight < baseHeight * 0.78;
            const keyboardOpen = shrunkVsWindow || shrunkVsBase || isInputFocused;
            if (keyboardOpen) {
                root.dataset.keyboardOpen = "true";
            } else {
                delete root.dataset.keyboardOpen;
            }
        };

        const onFocusChange = (): void => {
            if (blurSettleTimer) {
                clearTimeout(blurSettleTimer);
                blurSettleTimer = null;
            }
            blurSettleTimer = setTimeout(() => {
                blurSettleTimer = null;
                syncViewport();
            }, 30);
        };

        syncViewport();
        if (vv && typeof vv.addEventListener === "function") {
            vv.addEventListener("resize", syncViewport);
            vv.addEventListener("scroll", syncViewport);
        }
        if (typeof window.addEventListener === "function") {
            window.addEventListener("resize", syncViewport);
        }
        if (typeof root.addEventListener === "function") {
            root.addEventListener("focusin", syncViewport);
            root.addEventListener("focusout", onFocusChange);
        }

        this.visualViewportCleanup = () => {
            if (blurSettleTimer) {
                clearTimeout(blurSettleTimer);
                blurSettleTimer = null;
            }
            if (vv && typeof vv.removeEventListener === "function") {
                vv.removeEventListener("resize", syncViewport);
                vv.removeEventListener("scroll", syncViewport);
            }
            if (typeof window.removeEventListener === "function") {
                window.removeEventListener("resize", syncViewport);
            }
            if (typeof root.removeEventListener === "function") {
                root.removeEventListener("focusin", syncViewport);
                root.removeEventListener("focusout", onFocusChange);
            }
        };
    }

    public focusInput(): void {
        this.dialog?.element?.querySelector<HTMLInputElement>(".xlc-search-input")?.focus();
    }

    private buildDom(isMobile: boolean): HTMLElement {
        const root = document.createElement("div");
        root.className = "xlc-search xlc-dialog" + (isMobile ? " xlc-dialog--mobile" : "");

        // 顶部：搜索框。把普通搜索与 ? 语义搜索拆成可读提示，避免用户只看到一个神秘符号。
        const top = document.createElement("div");
        top.className = "xlc-top";

        // 极窄迷你悬浮条拖拽把手与折叠按钮（CAND-020 / CAND-022 / CAND-023）
        const miniDragBar = document.createElement("div");
        miniDragBar.className = "xlc-mini-drag-bar";
        miniDragBar.dataset.xlcControl = "search.mini.drag-bar";

        const handleText = document.createElement("span");
        handleText.className = "xlc-mini-drag-handle";
        handleText.textContent = "⠿ 常用语";
        handleText.title = "按住拖拽移动悬浮条位置，双击折叠/展开";
        handleText.addEventListener("dblclick", () => {
            this.toggleMiniCollapse();
        });

        handleText.addEventListener("mousedown", (ev: MouseEvent) => {
            if (ev.button !== 0) return;
            const container = this.dialog?.element?.querySelector<HTMLElement>(".b3-dialog__container") ?? this.dialog?.element;
            if (!container) return;
            ev.preventDefault();

            const rect = container.getBoundingClientRect();
            const shiftX = ev.clientX - rect.left;
            const shiftY = ev.clientY - rect.top;

            const onMouseMove = (moveEv: MouseEvent) => {
                const newX = Math.max(0, Math.min(window.innerWidth - 80, moveEv.clientX - shiftX));
                const newY = Math.max(0, Math.min(window.innerHeight - 40, moveEv.clientY - shiftY));
                container.style.position = "fixed";
                container.style.left = `${newX}px`;
                container.style.top = `${newY}px`;
                container.style.right = "auto";
                container.style.margin = "0";
                container.style.transform = "none";
                this.miniPosition = {x: Math.round(newX), y: Math.round(newY)};
            };

            const onMouseUp = () => {
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
                const containerRect = container.getBoundingClientRect();
                const curLeft = parseFloat(container.style.left) || rect.left;
                const curTop = parseFloat(container.style.top) || rect.top;
                const snap = calculateMagneticSnap(
                    curLeft,
                    curTop,
                    containerRect.width,
                    containerRect.height,
                    window.innerWidth,
                    window.innerHeight,
                    24
                );
                container.style.left = `${snap.x}px`;
                container.style.top = `${snap.y}px`;
                this.miniPosition = {x: snap.x, y: snap.y};
                this.deps.onMiniPositionChange?.(this.miniPosition);
                if (snap.snapped) {
                    container.classList.add("xlc-dialog--snapped");
                    setTimeout(() => container.classList.remove("xlc-dialog--snapped"), 250);
                }
            };

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        });

        const collapseBtn = document.createElement("button");
        collapseBtn.type = "button";
        collapseBtn.className = "xlc-mini-bar-btn";
        collapseBtn.dataset.xlcControl = "search.mini.collapse";
        collapseBtn.textContent = "─";
        collapseBtn.title = "折叠为贴边微型灵动胶囊";
        collapseBtn.setAttribute("aria-label", "折叠为贴边微型灵动胶囊");
        collapseBtn.addEventListener("click", () => this.toggleMiniCollapse());

        miniDragBar.append(handleText, collapseBtn);
        top.appendChild(miniDragBar);

        if (this.deps.surroundText) {
            const surroundBanner = document.createElement("div");
            surroundBanner.className = "xlc-surround-banner";
            surroundBanner.dataset.xlcControl = "search.surround-banner";
            surroundBanner.textContent = `✦ 选区包裹模式（已选 ${this.deps.surroundText.length} 字符）· 选中下方模板按回车即可直接包裹替换`;
            top.appendChild(surroundBanner);
        }
        const topMain = document.createElement("div");
        topMain.className = "xlc-top-main";
        const searchBlock = document.createElement("div");
        searchBlock.className = "xlc-search-block";
        const search = document.createElement("div");
        search.className = "xlc-search";
        const qMark = document.createElement("span");
        qMark.className = "xlc-search-icon";
        qMark.setAttribute("aria-hidden", "true");
        const input = document.createElement("input");
        input.className = "b3-text-field xlc-search-input";
        input.dataset.xlcControl = "search.input";
        input.placeholder = this.deps.t("searchPlaceholder");
        // 移动端软键盘细节：回车=搜索、关拉丁自动更正；关自动填充（自定义候选弹层之上不叠浏览器浮层）
        input.setAttribute("enterkeyhint", "search");
        input.setAttribute("autocomplete", "off");
        input.setAttribute("autocapitalize", "off");
        input.setAttribute("autocorrect", "off");
        input.setAttribute("spellcheck", "false");
        input.setAttribute("role", "combobox");
        input.setAttribute("aria-expanded", "true");
        input.setAttribute("aria-label", this.deps.t("searchPlaceholder"));
        // 输入以 ? 开头时，搜索前缀保留在文本中；左侧始终显示搜索图标。
        const syncQMark = (): void => {
            clearBtn.classList.toggle("xlc-search-clear--on", input.value.length > 0);
        };
        // 清空按钮（通用输入细节）：有输入时出现，一键清空并回焦
        const clearBtn = document.createElement("button");
        clearBtn.type = "button";
        clearBtn.className = "xlc-search-clear";
        clearBtn.dataset.xlcControl = "search.clear";
        clearBtn.textContent = "×";
        clearBtn.setAttribute("aria-label", this.deps.t("clearSearch"));
        clearBtn.addEventListener("click", () => {
            input.value = "";
            syncQMark();
            updateHistoryBar();
            input.focus();
            if (this.inputDebounce) {
                clearTimeout(this.inputDebounce);
                this.inputDebounce = null;
            }
            this.currentScope = "all";
            this.syncScopeChips();
            if (!this.navigatingHistory) {
                this.historyCursor = -1;
            }
            this.deps.setLastQuery("");
            void this.refresh();
        });
        input.addEventListener("input", () => {
            syncQMark();
            updateHistoryBar();
            const rawVal = input.value.trim();
            // 穿透前缀识别：输入以 @ 或 / 或 sy: 开头，自动切换为全库笔记范围 (all-notes)；
            // 仅当由前缀自动进入 all-notes 时，清空输入才退回 all（用户手动点击全库胶囊时不退回）。
            if (rawVal.startsWith("@") || rawVal.startsWith("/") || rawVal.startsWith("sy:")) {
                if (this.currentScope !== "all-notes") {
                    this.autoSwitchedToAllNotes = true;
                    this.currentScope = "all-notes";
                }
            } else if (this.currentScope === "all-notes" && !rawVal && this.autoSwitchedToAllNotes) {
                this.autoSwitchedToAllNotes = false;
                this.currentScope = "all";
            }
            this.syncScopeChips(); // 范围切换后同步 chip 选中态（R138）
            // 真实手动输入时退出历史回退态
            if (!this.navigatingHistory) {
                this.historyCursor = -1;
            }
            // 持久化剥离 ? 前缀：重开弹窗预填普通查询，绝不自动触发 AI 语义找
            this.deps.setLastQuery(input.value.replace(/^\?+/, ""));
            // IME 组合输入（中文输入法组词）期间跳过刷新——候选词未上屏不过滤；
            // compositionend 后统一刷新一次
            if (this.isComposing) return;
            // 200ms 输入防抖（雷切同款预算）：本地过滤本身便宜，但 ? 语义找/provider 请求每键一次不可接受
            if (this.inputDebounce) clearTimeout(this.inputDebounce);
            this.inputDebounce = setTimeout(() => {
                this.inputDebounce = null;
                void this.refresh();
            }, 200);
        });
        input.addEventListener("compositionstart", () => {
            this.isComposing = true;
        });
        input.addEventListener("compositionend", () => {
            this.isComposing = false;
            syncQMark();
            this.syncScopeChips();
            if (this.inputDebounce) clearTimeout(this.inputDebounce);
            this.inputDebounce = setTimeout(() => {
                this.inputDebounce = null;
                void this.refresh();
            }, 50);
        });
        input.addEventListener("keydown", (e) => void this.onKeydown(e));
        search.appendChild(qMark);
        search.appendChild(input);
        search.appendChild(clearBtn);

        if (isMobile) {
            const mobileNewBtn = document.createElement("button");
            mobileNewBtn.type = "button";
            mobileNewBtn.className = "xlc-mobile-new-btn";
            mobileNewBtn.dataset.xlcControl = "search.mobile.new";
            mobileNewBtn.textContent = "＋";
            mobileNewBtn.title = this.deps.t("newItem");
            mobileNewBtn.setAttribute("aria-label", this.deps.t("newItem"));
            mobileNewBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.deps.newItem();
            });
            search.appendChild(mobileNewBtn);

            // 审计 1: 消除 Esc-only 隐患，手机端提供可见 ✕ 关闭按钮
            const mobileCloseBtn = document.createElement("button");
            mobileCloseBtn.type = "button";
            mobileCloseBtn.className = "xlc-mobile-close-btn";
            mobileCloseBtn.dataset.xlcControl = "search.mobile.close";
            mobileCloseBtn.textContent = "✕";
            mobileCloseBtn.title = this.deps.t("close") || "关闭";
            mobileCloseBtn.setAttribute("aria-label", this.deps.t("close") || "关闭搜索弹窗");
            mobileCloseBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.destroy();
            });
            search.appendChild(mobileCloseBtn);
        }

        if (!isMobile) {
            // 窗口固定按钮（连续取用时不自动关闭窗口，支持 Alt+P 快捷切换 · G50）
            const pinBtn = document.createElement("button");
            pinBtn.type = "button";
            pinBtn.className = "xlc-search-pin" + (this.pinWindow ? " xlc-search-pin--active" : "");
            pinBtn.dataset.xlcControl = "search.pin";
            pinBtn.textContent = "📌";
            pinBtn.title = "固定窗口（连续复制/插入不关闭，Alt+P 切换）";
            pinBtn.setAttribute("aria-label", "固定窗口");
            pinBtn.setAttribute("aria-pressed", String(this.pinWindow));
            pinBtn.addEventListener("click", () => {
                this.togglePinWindow();
            });
            search.appendChild(pinBtn);

            // 视图密度切换按钮（紧凑单行 / 舒适卡片双视图，支持 Alt+V 切换 · CAND-012 / TODO-FEAT-011）
            const densityBtn = document.createElement("button");
            densityBtn.type = "button";
            densityBtn.className = "xlc-search-density-btn" + (this.density === "compact" ? " xlc-search-density-btn--compact" : "");
            densityBtn.dataset.xlcControl = "search.density.toggle";
            densityBtn.textContent = this.density === "compact" ? "☰" : "☷";
            densityBtn.title = this.density === "compact" ? "当前为紧凑单行视图（点击或 Alt+V 切换为舒适卡片）" : "当前为舒适卡片视图（点击或 Alt+V 切换为紧凑单行）";
            densityBtn.setAttribute("aria-label", "切换视图密度");
            densityBtn.setAttribute("aria-pressed", String(this.density === "compact"));
            densityBtn.addEventListener("click", () => {
                this.toggleDensity();
            });
            this.densityBtn = densityBtn;
            search.appendChild(densityBtn);

            // 极窄迷你悬浮模式切换按钮（📐，Alt+M · CAND-018 / TODO-FEAT-017）
            const miniModeBtn = document.createElement("button");
            miniModeBtn.type = "button";
            miniModeBtn.className = "xlc-search-mini-btn" + (this.miniMode ? " xlc-search-mini-btn--active" : "");
            miniModeBtn.dataset.xlcControl = "search.mini.toggle";
            miniModeBtn.textContent = "📐";
            miniModeBtn.title = "迷你悬浮浮条模式（极窄单列无遮挡，Alt+M 切换）";
            miniModeBtn.setAttribute("aria-label", "切换迷你悬浮模式");
            miniModeBtn.setAttribute("aria-pressed", String(this.miniMode));
            miniModeBtn.addEventListener("click", () => {
                this.toggleMiniMode();
            });
            this.miniModeBtn = miniModeBtn;
            search.appendChild(miniModeBtn);
        }

        searchBlock.appendChild(search);

        // 剪贴板智能匹配横幅 (Mobile Spec v2: 默认关闭，设置内 opt-in)
        const smartBanner = document.createElement("div");
        smartBanner.className = "xlc-smart-match-banner";
        smartBanner.dataset.xlcControl = "search.smart-match-banner";
        smartBanner.style.display = "none";
        this.smartMatchBannerEl = smartBanner;
        searchBlock.appendChild(smartBanner);

        // 连续复制连击批量导出提示栏 (Mobile Spec v2)
        const comboBanner = document.createElement("div");
        comboBanner.className = "xlc-combo-copy-banner";
        comboBanner.dataset.xlcControl = "search.combo-banner";
        comboBanner.style.display = "none";
        this.copyComboBannerEl = comboBanner;
        searchBlock.appendChild(comboBanner);

        // 移动端置顶高频片段直达行 (Mobile Spec v1: 位于搜索框正下方，frecency 前 5 个 chips)
        if (isMobile) {
            const chipsRow = document.createElement("div");
            chipsRow.className = "xlc-top-chips-row";
            chipsRow.dataset.xlcControl = "search.mobile.top-chips";
            this.topChipsContainer = chipsRow;
            searchBlock.appendChild(chipsRow);

            // 移动端多级分类面包屑导航 (Mobile Spec v2: 面包屑 + 左滑返回上级)
            const breadcrumbs = document.createElement("div");
            breadcrumbs.className = "xlc-mobile-breadcrumbs";
            breadcrumbs.dataset.xlcControl = "search.mobile.breadcrumbs";
            breadcrumbs.style.display = "none";
            this.mobileBreadcrumbsEl = breadcrumbs;
            searchBlock.appendChild(breadcrumbs);
        }

        const searchHint = document.createElement("div");
        searchHint.className = "xlc-search-hint";
        searchHint.textContent = this.deps.t("searchHint");
        searchBlock.appendChild(searchHint);

        const historyBar = document.createElement("div");
        historyBar.className = "xlc-search-history-bar";
        const updateHistoryBar = (): void => {
            const hasText = input.value.trim().length > 0;
            if (this.currentScope === "clipboard") {
                const clips = this.deps.getClipboardHistory ? this.deps.getClipboardHistory() : [];
                if (clips.length === 0 || hasText) {
                    historyBar.style.display = "none";
                    return;
                }
                historyBar.replaceChildren();
                const lbl = document.createElement("span");
                lbl.className = "xlc-history-label";
                lbl.textContent = `📋 剪贴板暂存 (${clips.length}条):`;
                historyBar.appendChild(lbl);

                const tip = document.createElement("span");
                tip.style.cssText = "font-size:11px; opacity:0.8; margin-right:8px;";
                tip.textContent = "仅侧车暂存，不污染思源块";
                historyBar.appendChild(tip);

                if (this.deps.clearClipboardHistory) {
                    const clearBtn = document.createElement("button");
                    clearBtn.type = "button";
                    clearBtn.className = "xlc-history-clear";
                    clearBtn.textContent = "清空暂存";
                    clearBtn.title = "清空剪贴板暂存历史";
                    clearBtn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        this.deps.clearClipboardHistory?.();
                        this.deps.notify?.("info", "已清空剪贴板暂存历史");
                        updateHistoryBar();
                        void this.refresh();
                    });
                    historyBar.appendChild(clearBtn);
                }
                historyBar.style.display = "flex";
                return;
            }

            if (hasText) {
                historyBar.style.display = "none";
                return;
            }
            const history = (this.deps.getRecentQueries?.() ?? []).slice(0, 5);
            if (history.length === 0) {
                historyBar.style.display = "none";
                return;
            }
            historyBar.replaceChildren();
            historyBar.setAttribute("role", "toolbar");
            historyBar.setAttribute("aria-label", "搜索历史");
            historyBar.addEventListener("keydown", (e) => {
                if (e.isComposing || e.keyCode === 229) return;
                if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                    const btns = Array.from(historyBar.querySelectorAll<HTMLButtonElement>("button"));
                    if (!btns.length) return;
                    const idx = btns.indexOf(document.activeElement as HTMLButtonElement);
                    if (idx === -1) return;
                    e.preventDefault();
                    e.stopPropagation();
                    const nextIdx = e.key === "ArrowRight" ? (idx + 1) % btns.length : (idx - 1 + btns.length) % btns.length;
                    btns[nextIdx]?.focus();
                    return;
                }
                if (e.key === "Home" || e.key === "End") {
                    const btns = Array.from(historyBar.querySelectorAll<HTMLButtonElement>("button"));
                    if (!btns.length) return;
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.key === "Home") btns[0]?.focus();
                    else btns[btns.length - 1]?.focus();
                }
            });
            const lbl = document.createElement("span");
            lbl.className = "xlc-history-label";
            lbl.textContent = "🕐 历史:";
            historyBar.appendChild(lbl);

            for (const word of history) {
                const pill = document.createElement("div");
                pill.className = "xlc-history-pill";
                pill.dataset.xlcControl = "search.history.pill";
                pill.title = `历史词「${word}」`;
                pill.setAttribute("aria-label", pill.title);

                const wordBtn = document.createElement("button");
                wordBtn.type = "button";
                wordBtn.className = "xlc-history-text-btn";
                wordBtn.textContent = word;
                wordBtn.title = `点击检索「${word}」`;
                wordBtn.setAttribute("aria-label", wordBtn.title);
                wordBtn.dataset.xlcControl = "search.history.item";
                wordBtn.addEventListener("click", () => {
                    input.value = word;
                    input.dispatchEvent(new Event("input", {bubbles: true}));
                    input.focus();
                    if (this.inputDebounce) {
                        clearTimeout(this.inputDebounce);
                        this.inputDebounce = null;
                    }
                    void this.refresh();
                });
                pill.appendChild(wordBtn);

                if (this.deps.removeRecentQuery) {
                    const delBtn = document.createElement("button");
                    delBtn.type = "button";
                    delBtn.className = "xlc-history-del-btn";
                    delBtn.textContent = "×";
                    delBtn.title = `删除历史「${word}」`;
                    delBtn.setAttribute("aria-label", delBtn.title);
                    delBtn.dataset.xlcControl = "search.history.delete-item";
                    delBtn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        this.deps.removeRecentQuery?.(word);
                        updateHistoryBar();
                    });
                    pill.appendChild(delBtn);
                }

                historyBar.appendChild(pill);
            }

            if (this.deps.clearRecentQueries) {
                const clearBtn = document.createElement("button");
                clearBtn.type = "button";
                clearBtn.className = "xlc-history-clear";
                clearBtn.textContent = "清空";
                clearBtn.title = "清空搜索历史";
                clearBtn.setAttribute("aria-label", clearBtn.title);
                clearBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    this.deps.clearRecentQueries?.();
                    updateHistoryBar();
                });
                historyBar.appendChild(clearBtn);
            }
            historyBar.style.display = "flex";
        };
        updateHistoryBar();
        this.updateHistoryBarRef = updateHistoryBar;
        searchBlock.appendChild(historyBar);
        topMain.appendChild(searchBlock);
        let kbdRow: HTMLDivElement | null = null;
        // 头部快捷键提示（桌面；每项都写清按键对应动作，避免只显示符号）
        if (!isMobile) {
            const isApple = /Mac|iPhone|iPad/i.test(navigator.platform || "");
            kbdRow = document.createElement("div");
            kbdRow.className = "xlc-kbdrow";
            kbdRow.tabIndex = 0;
            kbdRow.setAttribute("aria-label", this.deps.t("keyboardHelp"));
            const kbdLabel = document.createElement("span");
            kbdLabel.className = "xlc-kbdrow-label";
            kbdLabel.textContent = this.deps.t("shortcutLabel");
            kbdRow.appendChild(kbdLabel);
            // 界面减法（T-0754）：操作提示收敛为 5 个高频核心键，一行排下不再折成三行。
            const kbdDefinitions = [
                {id: "insert", key: "Enter", action: this.deps.t("insert")},
                {id: "copy", key: formatPlatformShortcut("Ctrl+Enter", isApple).replace(/\+/g, " + "), action: this.deps.t("kbdCopy")},
                {id: "quickInsert", key: `${isApple ? "⌥" : "Alt"} + 1-9`, action: this.deps.t("kbdQuickInsert")},
                {id: "tab", key: "Tab", action: this.deps.t("kbdTabActions")},
                {id: "close", key: "Esc", action: this.deps.t("kbdClose")},
            ];
            kbdRow.dataset.xlcHotkeyConflicts = String(detectShortcutConflicts(kbdDefinitions).length);
            for (const hint of kbdDefinitions) {
                const kbd = document.createElement("span");
                kbd.className = "xlc-kbd xlc-kbd-hint";
                kbd.title = `${hint.key}：${hint.action}`;
                const key = document.createElement("span");
                key.className = "xlc-kbd-key";
                key.textContent = hint.key;
                const action = document.createElement("span");
                action.className = "xlc-kbd-label";
                action.textContent = hint.action;
                kbd.append(key, action);
                kbdRow.appendChild(kbd);
            }
            // 常驻新建入口（截图②）：搜索时无需先清空或离开弹窗即可添加条目。
            // 移动端在底栏保留同一动作，避免窄屏顶栏拥挤。
            const topActions = document.createElement("div");
            topActions.className = "xlc-top-actions";
            const topNew = document.createElement("button");
            topNew.type = "button";
            topNew.className = "b3-button xlc-btn-primary xlc-top-new";
            topNew.dataset.xlcControl = "search.new";
            topNew.textContent = this.deps.t("quickNew");
            topNew.setAttribute("aria-label", this.deps.t("newItem"));
            topNew.addEventListener("click", () => this.deps.newItem());
            topActions.appendChild(topNew);
            topMain.appendChild(topActions);
        }
        top.appendChild(topMain);
        if (kbdRow) top.appendChild(kbdRow);
        root.appendChild(top);

        // 筛选 chips 行：每个控件的首项都带上语义前缀，避免「标签/分类」被误解成当前值。
        const filters = document.createElement("div");
        filters.className = "xlc-filters";
        const typeSelect = document.createElement("select");
        typeSelect.className = "b3-select xlc-type-select";
        typeSelect.dataset.xlcControl = "filter.type";
        typeSelect.setAttribute("aria-label", this.deps.t("type"));
        const allOpt = document.createElement("option");
        allOpt.value = "";
        allOpt.textContent = this.deps.t("filterAllType");
        typeSelect.appendChild(allOpt);
        for (const t of ITEM_TYPES) {
            const opt = document.createElement("option");
            opt.value = t;
            opt.textContent = this.deps.t(`type.${t}`);
            typeSelect.appendChild(opt);
        }
        // 跨会话筛选记忆：预填上次选择
        const savedFilters = this.deps.getFilters();
        if (savedFilters.type) typeSelect.value = savedFilters.type;
        typeSelect.addEventListener("change", () => {
            this.deps.setFilters({
                type: typeSelect.value,
                tag: tagSelect?.value ?? "",
                category: categorySelect?.value ?? "",
            });
            this.syncMobileFilterToggleRef?.();
            void this.refresh();
        });
        filters.appendChild(typeSelect);

        const tagSelect = document.createElement("select");
        tagSelect.className = "b3-select xlc-tag-select";
        tagSelect.dataset.xlcControl = "filter.tag";
        tagSelect.setAttribute("aria-label", this.deps.t("tags"));
        tagSelect.disabled = true;
        tagSelect.addEventListener("change", () => {
            this.deps.setFilters({
                type: typeSelect.value,
                tag: tagSelect.value,
                category: categorySelect?.value ?? "",
            });
            this.syncMobileFilterToggleRef?.();
            void this.refresh();
        });
        filters.appendChild(tagSelect);

        // 分类筛选（F4，原型屏 1：类型/标签/分类三下拉）
        const categorySelect = document.createElement("select");
        categorySelect.className = "b3-select xlc-category-select";
        categorySelect.dataset.xlcControl = "filter.category";
        categorySelect.setAttribute("aria-label", this.deps.t("category"));
        categorySelect.disabled = true;
        categorySelect.addEventListener("change", () => {
            this.deps.setFilters({type: typeSelect.value, tag: tagSelect.value, category: categorySelect.value});
            this.syncMobileFilterToggleRef?.();
            void this.refresh();
        });
        filters.appendChild(categorySelect);

        const scopes = ["all", "favorites", "recent", "clipboard", "current-doc", "all-notes"] as const;
        const track = document.createElement("div");
        track.className = "xlc-segmented-track";
        track.setAttribute("role", "radiogroup");
        track.setAttribute("aria-label", "搜索作用域切换");

        for (const scope of scopes) {
            const chip = document.createElement("button");
            chip.type = "button";
            const on = this.currentScope === scope;
            chip.className = "xlc-chip xlc-scope-chip" + (on ? " xlc-chip--on xlc-scope-chip--on" : "");
            chip.dataset.scope = scope;
            chip.dataset.xlcControl = `filter.scope.${scope}`;
            let text = "";
            if (scope === "all") text = this.deps.t("scopeAll") || "全部";
            else if (scope === "favorites") text = "★ " + this.deps.t("filterFavorites");
            else if (scope === "recent") text = "🕐 " + this.deps.t("filterRecent");
            else if (scope === "clipboard") text = "📋 " + (this.deps.t("scopeClipboard") || "剪贴板");
            else if (scope === "current-doc") text = "☵ " + this.deps.t("scopeCurrentDoc");
            else if (scope === "all-notes") text = "🔍 " + this.deps.t("scopeAllNotes");
            chip.textContent = text;
            chip.addEventListener("click", () => {
                this.autoSwitchedToAllNotes = false;
                this.currentScope = scope === "all" ? "all" : (this.currentScope === scope ? "all" : scope);
                this.syncScopeChips();
                void this.refresh();
            });
            track.appendChild(chip);
        }
        filters.appendChild(track);

        // 剪贴板流多格式切换胶囊（全部/纯文本/图片素材/代码片段 · CAND-001 / TODO-FEAT-001）
        const clipFormatTrack = document.createElement("div");
        clipFormatTrack.className = "xlc-clip-format-pills";
        clipFormatTrack.dataset.xlcControl = "filter.clipboard-formats";
        if (typeof clipFormatTrack.setAttribute === "function") {
            clipFormatTrack.setAttribute("role", "radiogroup");
            clipFormatTrack.setAttribute("aria-label", "剪贴板格式过滤");
        }
        clipFormatTrack.style.display = this.currentScope === "clipboard" ? "inline-flex" : "none";

        const clipFormats: Array<{id: "all" | "text" | "image" | "code"; label: string}> = [
            {id: "all", label: "全部"},
            {id: "text", label: "纯文本"},
            {id: "image", label: "图片素材"},
            {id: "code", label: "代码片段"},
        ];

        for (const fmt of clipFormats) {
            const pill = document.createElement("button");
            pill.type = "button";
            pill.className = "xlc-chip xlc-clip-format-chip" + (this.clipboardFormatFilter === fmt.id ? " xlc-chip--on" : "");
            pill.dataset.format = fmt.id;
            pill.dataset.xlcControl = `filter.clip.${fmt.id}`;
            pill.textContent = fmt.label;
            pill.addEventListener("click", () => {
                this.clipboardFormatFilter = fmt.id;
                for (const p of clipFormatTrack.querySelectorAll<HTMLButtonElement>(".xlc-clip-format-chip")) {
                    p.classList.toggle("xlc-chip--on", p.dataset.format === fmt.id);
                }
                void this.refresh();
            });
            clipFormatTrack.appendChild(pill);
        }
        filters.appendChild(clipFormatTrack);

        const queueChip = document.createElement("button");
        queueChip.type = "button";
        queueChip.className = "xlc-chip xlc-queue-chip";
        queueChip.dataset.xlcControl = "queue.status-chip";
        queueChip.style.display = "none";
        const syncQueueChip = (): void => {
            const queue = getActivePasteQueue();
            const count = queue.size();
            if (count > 0) {
                queueChip.style.display = "inline-flex";
                queueChip.textContent = `📋 队列: ${count}项 (⌥⇧Q) · [清空]`;
                queueChip.title = `连续取用队列中还有 ${count} 项，按 ⌥⇧Q 依次粘贴输出。点击可一键清空队列。`;
            } else {
                queueChip.style.display = "none";
            }
        };
        queueChip.addEventListener("click", () => {
            const queue = getActivePasteQueue();
            queue.clear();
            syncQueueChip();
            this.deps.notify?.("info", "已清空连续粘贴取用队列");
        });
        this.syncQueueChipRef = syncQueueChip;
        filters.appendChild(queueChip);
        syncQueueChip();
        // AI 语义结果横幅（? 查询命中时显示；原型顺序=筛选行首位）
        const aiBanner = document.createElement("span");
        aiBanner.className = "xlc-chip xlc-ai-banner";
        aiBanner.style.display = "none";
        filters.insertBefore(aiBanner, filters.firstChild);
        // 排序 chip：点击弹直选菜单（4 档可枚举，当前档 ✓；替代不可见的循环切换）
        const sortChip = document.createElement("button");
        sortChip.type = "button";
        sortChip.className = "xlc-chip xlc-sort-chip";
        sortChip.dataset.xlcControl = "sort.open";
        const paintSort = (): void => {
            const sort = this.deps.getSort();
            sortChip.textContent = "⇅ " + this.deps.t("sort") + "：" + this.deps.t(`sort.${sort}`);
            sortChip.title = this.deps.t(`sortHint.${sort}`);
            sortChip.setAttribute("aria-label", `${this.deps.t("sort")}：${this.deps.t(`sort.${sort}`)}。${this.deps.t(`sortHint.${sort}`)}`);
            // 非默认档高亮（原型屏 1：⇅常用 为选中态）
            sortChip.classList.toggle("xlc-chip--on", sort !== "manual");
            this.syncMobileFilterToggleRef?.();
        };
        paintSort();
        sortChip.addEventListener("click", () => {
            // 菜单开着时点 chip：pointerdown 先关、click 再到——间隔内不重开，保证「再点即关」（R138）
            if (Date.now() - this.sortMenuClosedAt < 300) return;
            this.showSortMenu(paintSort);
        });
        filters.appendChild(sortChip);

        if (isMobile) {
            const filterToggleBtn = document.createElement("button");
            filterToggleBtn.type = "button";
            filterToggleBtn.className = "xlc-chip xlc-mobile-filter-toggle";
            filterToggleBtn.dataset.xlcControl = "filter.mobile.toggle";
            const syncMobileFilterToggle = (): void => {
                const f = this.deps.getFilters();
                const activeCount = (f.type ? 1 : 0)
                    + (f.tag ? 1 : 0)
                    + (f.category ? 1 : 0)
                    + (this.deps.getSort() !== "manual" ? 1 : 0);
                const isOpen = root.dataset.mobileFiltersOpen === "true";
                filterToggleBtn.textContent = activeCount > 0 ? `筛选 (${activeCount})` : "筛选";
                filterToggleBtn.classList.toggle("xlc-chip--on", isOpen || activeCount > 0);
                filterToggleBtn.setAttribute("aria-expanded", String(isOpen));
                filterToggleBtn.setAttribute(
                    "aria-label",
                    activeCount > 0 ? `筛选（已激活 ${activeCount} 项）` : "展开或收起筛选条件",
                );
            };
            filterToggleBtn.addEventListener("click", () => {
                const nextOpen = root.dataset.mobileFiltersOpen !== "true";
                if (nextOpen) {
                    root.dataset.mobileFiltersOpen = "true";
                } else {
                    delete root.dataset.mobileFiltersOpen;
                }
                syncMobileFilterToggle();
            });
            this.syncMobileFilterToggleRef = syncMobileFilterToggle;
            syncMobileFilterToggle();
            filters.appendChild(filterToggleBtn);
        }
        // 定向插入模式横幅（R116）：文档树入口进入时明示落点，防止误以为插入当前编辑器
        if (this.insertTarget) {
            const targetBanner = document.createElement("span");
            targetBanner.className = "xlc-chip xlc-target-banner";
            targetBanner.textContent = "⤓ " + this.deps.t("insertTargetBanner", this.insertTarget.hPath || this.insertTarget.docId);
            filters.insertBefore(targetBanner, filters.firstChild);
        } else {
            const targetBanner = document.createElement("span");
            targetBanner.className = "xlc-chip xlc-target-banner";
            const hasEditor = this.deps.hasActiveEditor?.() ?? true;
            const hasTarget = this.deps.hasInsertTarget?.() ?? hasEditor;
            const fallbackKey = this.deps.isMobile()
                ? "insertMobileActionHint"
                : hasTarget ? "insertCurrentEditorBanner" : hasEditor ? "insertTargetUnavailableBanner" : "insertNoEditorBanner";
            targetBanner.textContent = "⤓ " + this.deps.t(fallbackKey);
            targetBanner.setAttribute("role", "note");
            targetBanner.setAttribute("aria-label", this.deps.t(fallbackKey));
            filters.insertBefore(targetBanner, filters.firstChild);
        }
        root.appendChild(filters);

        // 热门标签快速筛选胶囊行（桌面与平板快捷直达）
        const quickPills = document.createElement("div");
        quickPills.className = "xlc-quick-filter-pills";
        quickPills.style.display = "none";
        root.appendChild(quickPills);

        // 状态行（aria-live）
        const status = document.createElement("div");
        status.className = "xlc-status";
        status.setAttribute("aria-live", "polite");
        root.appendChild(status);

        // 双栏主体：列表 + 预览（桌面）
        const bodyWrap = document.createElement("div");
        bodyWrap.className = "xlc-body";
        const list = document.createElement("div");
        list.className = "xlc-list";
        this.listEl = list;
        this.applyDensity();
        this.applyMiniMode();
        list.id = "xlc-search-results";
        list.tabIndex = 0;
        // 行内收藏/标签筛选按钮是可聚焦控件，不能嵌在 ARIA listbox option 内。
        // 用普通 list/listitem 保留活动后代与键盘导航，同时允许这些动作保持可访问。
        list.setAttribute("role", "list");
        list.setAttribute("aria-label", this.deps.t("pluginName"));
        input.setAttribute("aria-controls", list.id);
        list.addEventListener("keydown", (e) => void this.onKeydown(e));
        list.addEventListener("click", (e) => {
            if ((e.target as HTMLElement).closest(".xlc-row-action")) return;
            const row = (e.target as HTMLElement).closest<HTMLElement>("[data-xlc-index]");
            if (!row) return;
            const index = Number(row.dataset.xlcIndex);
            const entry = this.results[index];
            if (!entry) return;

            // 多选模式或按住 Shift/Ctrl 点击行：切换选择状态
            if (this.multiSelectMode || e.shiftKey || e.ctrlKey || e.metaKey) {
                if (!this.multiSelectMode) {
                    this.multiSelectMode = true;
                }
                if (this.selectedIds.has(entry.id)) {
                    this.selectedIds.delete(entry.id);
                } else {
                    this.selectedIds.add(entry.id);
                }
                this.renderBatchBar();
                this.renderList(list);
                return;
            }

            if (isMobile) {
                this.activeIndex = index;
                this.activeProvider = -1;
                this.paintActive();
                // 规范 5: 手机核心场景点击即复制 + 轻触感 haptic(12) + inline 打勾，坚决不弹窗
                lvLaunchpad.haptic(12);
                const text = entry.content || entry.summary || entry.title;
                void this.deps.copyText(text).then((ok) => {
                    if (ok) {
                        lvNotify.inline(row, "已复制");
                        this.trackCopyCombo(entry);
                    }
                });
                return;
            }
            void this.runPrimary(entry);
        });
        // 悬停更新预览（触屏设备无 hover 不受影响）
        list.addEventListener("mouseover", (e) => {
            if (isMobile) return;
            const row = (e.target as HTMLElement).closest<HTMLElement>("[data-xlc-index]");
            if (!row) return;
            const entry = this.results[Number(row.dataset.xlcIndex)];
            if (entry && this.activeIndex !== Number(row.dataset.xlcIndex)) {
                this.activeIndex = Number(row.dataset.xlcIndex);
                this.activeProvider = -1; // 回到库行必须退出提供方激活态，否则预览/高亮与悬停行脱节（R138）
                this.paintActive();
                this.schedulePreview(entry);
            }
        });
        this.attachLongPress(list, isMobile);

        // 移动端片段多级分类左滑返回上级分类手势 (Mobile Spec v2 专项深化 2)
        if (isMobile) {
            let touchStartX = 0;
            let touchStartY = 0;
            list.addEventListener("touchstart", (e) => {
                touchStartX = e.touches[0]?.clientX ?? 0;
                touchStartY = e.touches[0]?.clientY ?? 0;
            }, {passive: true});

            list.addEventListener("touchend", (e) => {
                const endX = e.changedTouches[0]?.clientX ?? 0;
                const endY = e.changedTouches[0]?.clientY ?? 0;
                const dx = endX - touchStartX;
                const dy = endY - touchStartY;
                if (dx < -60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                    const currentFilters = this.deps.getFilters();
                    const currentCat = currentFilters.category?.trim();
                    if (currentCat) {
                        const parts = currentCat.split("/").filter(Boolean);
                        if (parts.length > 0) {
                            parts.pop();
                            const parentCat = parts.join("/");
                            this.deps.setFilters({ ...currentFilters, category: parentCat });
                            lvLaunchpad.haptic(12);
                            void this.refresh();
                        }
                    }
                }
            }, {passive: true});
        }

        bodyWrap.appendChild(list);

        // 参考图同款：移动端右下角深色悬浮快捷新建加号键（FAB）
        if (isMobile) {
            const fabNew = document.createElement("button");
            fabNew.type = "button";
            fabNew.className = "xlc-fab-new";
            fabNew.setAttribute("aria-label", this.deps.t("quickNew"));
            fabNew.title = this.deps.t("quickNew");
            fabNew.textContent = "＋";
            fabNew.addEventListener("click", () => this.deps.newItem());
            bodyWrap.appendChild(fabNew);
        }

        if (!isMobile) {
            const pane = document.createElement("div");
            pane.className = "xlc-pane";
            pane.setAttribute("role", "complementary");
            pane.setAttribute("aria-label", "详情侧边窗格");
            pane.appendChild(this.buildPaneHead());
            // 元数据行（R108，Raycast Detail.Metadata 惯例：结构化信息进详情面板，行保持克制）
            const paneMeta = document.createElement("div");
            paneMeta.className = "xlc-pane-meta";
            paneMeta.style.display = "none";
            pane.appendChild(paneMeta);
            // 变量提示行（F1，原型屏 1）：「插入时将询问 N 个变量：{{…}}」
            const paneVars = document.createElement("div");
            paneVars.className = "xlc-pane-vars";
            paneVars.style.display = "none";
            pane.appendChild(paneVars);
            const warn = document.createElement("div");
            warn.className = "xlc-pane-warn";
            warn.style.display = "none";
            pane.appendChild(warn);
            const mediaHint = document.createElement("p");
            mediaHint.className = "xlc-page-intro";
            mediaHint.dataset.xlcControl = "preview.media-hint";
            mediaHint.setAttribute("role", "note");
            mediaHint.textContent = this.deps.t("mediaContentHint");
            mediaHint.style.padding = "var(--xlc-space-2) var(--xlc-space-4)";
            mediaHint.style.flexShrink = "0";
            mediaHint.hidden = true;
            pane.appendChild(mediaHint);
            const paneBody = document.createElement("div");
            paneBody.className = "xlc-pane-body xlc-pane-body--muted";
            paneBody.tabIndex = 0;
            paneBody.setAttribute("role", "region");
            paneBody.setAttribute("aria-label", "条目详情预览");
            paneBody.textContent = this.deps.t("previewUnavailable");
            pane.appendChild(paneBody);
            pane.appendChild(this.buildPaneFoot());
            bodyWrap.appendChild(pane);
        }
        root.appendChild(bodyWrap);
        root.appendChild(this.buildBatchBar());

        // 常用语购物车暂存托盘栏（CAND-019 / TODO-FEAT-018）
        const trayEl = document.createElement("div");
        trayEl.className = "xlc-paste-tray";
        trayEl.dataset.xlcControl = "search.paste-tray";
        trayEl.style.display = "none";
        this.pasteTrayEl = trayEl;
        root.appendChild(trayEl);

        // 底栏（原型：左计数 / 右真源声明 + 设置入口；移动端=操作钮行 + 点按提示）
        const footer = document.createElement("div");
        footer.className = "xlc-footer";
        footer.setAttribute("role", "toolbar");
        footer.setAttribute("aria-label", "主弹窗底栏工具栏");
        footer.addEventListener("keydown", (e: any) => {
            if (e.isComposing || e.keyCode === 229) return;
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                const btns = Array.from(footer.querySelectorAll<HTMLButtonElement>("button:not([disabled]):not([style*='display: none'])"));
                if (!btns.length) return;
                const idx = btns.indexOf(document.activeElement as HTMLButtonElement);
                if (idx === -1) return;
                e.preventDefault();
                e.stopPropagation();
                const nextIdx = e.key === "ArrowRight" ? (idx + 1) % btns.length : (idx - 1 + btns.length) % btns.length;
                btns[nextIdx]?.focus();
                return;
            }
            if (e.key === "Home" || e.key === "End") {
                const btns = Array.from(footer.querySelectorAll<HTMLButtonElement>("button:not([disabled]):not([style*='display: none'])"));
                if (!btns.length) return;
                e.preventDefault();
                e.stopPropagation();
                if (e.key === "Home") btns[0]?.focus();
                else btns[btns.length - 1]?.focus();
            }
        });
        const count = document.createElement("span");
        count.className = "xlc-footer-count";
        count.setAttribute("role", "status");
        count.setAttribute("aria-live", "polite");
        count.setAttribute("aria-label", "条目统计信息");
        if (isMobile) {
            // 操作钮行（原型屏 7：＋新建 / 插入选中；44px 命中）
            const footBtns = document.createElement("div");
            footBtns.className = "xlc-mobile-foot";
            const newBtn = document.createElement("button");
            newBtn.type = "button";
            newBtn.className = "b3-button";
            newBtn.dataset.xlcControl = "search.new";
            newBtn.textContent = this.deps.t("quickNew");
            newBtn.setAttribute("aria-label", this.deps.t("quickNew"));
            newBtn.addEventListener("click", () => this.deps.newItem());
            footBtns.appendChild(newBtn);
            const insertBtn = document.createElement("button");
            insertBtn.type = "button";
            insertBtn.className = "b3-button xlc-btn-primary xlc-mobile-insert";
            insertBtn.dataset.xlcControl = "preview.mobile-primary";
            insertBtn.textContent = this.deps.t(this.mobilePrimaryIsCopy() ? "copy" : "quickInsertSelected");
            insertBtn.disabled = true;
            const insertLabel = this.deps.t(this.mobilePrimaryIsCopy() ? "copy" : "quickInsertSelected");
            insertBtn.setAttribute("aria-label", insertLabel);
            if (this.mobilePrimaryIsCopy()) {
                insertBtn.title = this.deps.t("insertMobileActionHint");
                insertBtn.setAttribute("aria-label", this.deps.t("insertMobileActionHint"));
            }
            insertBtn.addEventListener("click", () => {
                const entry = this.results[this.activeIndex];
                if (entry) {
                    lvLaunchpad.haptic(12);
                    const text = entry.content || entry.summary || entry.title;
                    void this.deps.copyText(text).then((ok) => {
                        if (ok) {
                            lvNotify.inline(insertBtn, "已复制");
                            this.trackCopyCombo(entry);
                        }
                    });
                }
            });
            footBtns.appendChild(insertBtn);
            footer.appendChild(footBtns);
            count.textContent = this.deps.t("usageHintMobile");
        } else {
            count.textContent = "";
        }
        footer.appendChild(count);
        if (!isMobile) {
            const claim = document.createElement("span");
            // 这是保存位置的静态状态说明，不应与可点击胶囊混淆。
            claim.className = "xlc-footer-claim xlc-footer-claim--static";
            claim.textContent = this.deps.t("dataTruth");
            claim.title = this.deps.t("dataTruthHint");
            claim.setAttribute("role", "note");
            claim.setAttribute("aria-label", this.deps.t("dataTruthHint"));
            footer.appendChild(claim);

            const ecoBadge = document.createElement("span");
            ecoBadge.className = "xlc-footer-eco-badge";
            ecoBadge.textContent = lvEcosystem.getStatusBadgeText();
            ecoBadge.title = "小驴全生态协同健康指示器";
            footer.appendChild(ecoBadge);
        }
        // 使用说明双端可达：把常见的捕获、搜索、插入与整理路径放在弹窗内，降低首次上手成本。
        const guide = document.createElement("button");
        guide.type = "button";
        guide.className = "b3-button b3-button--text xlc-btn-ghost xlc-footer-guide";
        guide.dataset.xlcControl = "footer.help";
        guide.textContent = isMobile ? "ⓘ 帮助" : ("ⓘ " + this.deps.t("usageGuideBtn"));
        guide.setAttribute("aria-label", this.deps.t("usageGuideBtn"));
        guide.addEventListener("click", () => this.openUsageGuide());
        footer.appendChild(guide);

        // 新手分步实操指引与套件包市场（仅桌面端展示，手机端隐藏保持界面纯粹 · Mobile Spec v1）
        if (!isMobile) {
            const stepGuide = document.createElement("button");
            stepGuide.type = "button";
            stepGuide.className = "b3-button b3-button--text xlc-btn-ghost xlc-footer-stepguide";
            stepGuide.dataset.xlcControl = "footer.stepguide";
            stepGuide.textContent = "🎓 " + (this.deps.t("stepGuideTitle") || "新手实操指引");
            stepGuide.setAttribute("aria-label", this.deps.t("stepGuideTitle") || "新手实操指引");
            stepGuide.addEventListener("click", () => {
                openStepByStepGuideDialog({
                    t: this.deps.t,
                    isMobile: this.deps.isMobile,
                    onOpenSearch: () => this.focusInput(),
                });
            });
            footer.appendChild(stepGuide);

            // 开箱即用套件市场直达入口（随时自主挑选启用 · CAND-036 / TODO-FEAT-031）
            const starterPacksBtn = document.createElement("button");
            starterPacksBtn.type = "button";
            starterPacksBtn.className = "b3-button b3-button--text xlc-btn-ghost xlc-footer-starter-packs";
            starterPacksBtn.dataset.xlcControl = "footer.starter-packs";
            starterPacksBtn.textContent = "📦 " + (this.deps.t("starterPacksBtn") || "开箱套件");
            starterPacksBtn.title = "打开开箱即用套件市场，随时挑选启用行业场景常用语";
            starterPacksBtn.setAttribute("aria-label", "打开开箱即用套件市场");
            starterPacksBtn.addEventListener("click", () => {
                if (this.deps.importStarterPackDirect) {
                    openStarterPacksHubDialog({
                        t: this.deps.t,
                        notify: this.deps.notify,
                        importStarterPackDirect: this.deps.importStarterPackDirect,
                        createStarterPackDedicatedDoc: this.deps.createStarterPackDedicatedDoc,
                        onImportSuccess: () => void this.refresh(),
                    });
                }
            });
            footer.appendChild(starterPacksBtn);
        }

        // 设置入口双端可达（移动端无顶栏/命令面板，此处是唯一设置路径）
        const gear = document.createElement("button");
        gear.type = "button";
        gear.className = "b3-button b3-button--text xlc-btn-ghost xlc-footer-gear";
        gear.dataset.xlcControl = "footer.settings";
        gear.textContent = isMobile ? "⚙ 设置" : ("⚙ " + this.deps.t("openSettings"));
        gear.setAttribute("aria-label", this.deps.t("openSettings"));
        gear.addEventListener("click", () => {
            this.destroy();
            this.deps.openSetup();
        });
        footer.appendChild(gear);
        root.appendChild(footer);

        // 迷你模式贴边折叠灵动药丸胶囊（CAND-023 / TODO-FEAT-021）
        const pill = document.createElement("div");
        pill.className = "xlc-mini-collapsed-pill";
        pill.dataset.xlcControl = "search.mini.collapsed-pill";
        const pillIcon = document.createElement("span");
        pillIcon.textContent = "🐴 常用语";
        const pillKbd = document.createElement("span");
        pillKbd.className = "xlc-pill-shortcut";
        pillKbd.setAttribute("aria-hidden", "true");
        pillKbd.textContent = "Alt+M";
        pill.append(pillIcon, pillKbd);
        pill.title = "点击展开常用语悬浮条 (Alt+M)";
        pill.addEventListener("click", () => {
            this.setMiniCollapsed(false);
        });
        this.collapsedPillEl = pill;
        root.appendChild(pill);

        return root;
    }

    /** 打开一页内置使用说明（不离开搜索弹窗，适合首次使用与移动端）。 */
    private openUsageGuide(): void {
        const isMobileModal = isMobileDialogViewport();
        const guideDialog = new Dialog({
            title: this.deps.t("usageGuideTitle"),
            content: "",
            width: isMobileModal ? "100vw" : "min(600px, 92vw)",
            height: isMobileModal ? "100dvh" : "min(680px, 88vh)",
        });
        mountPlatformDialogTitleWrap(guideDialog.element, this.deps.t("usageGuideTitle"));
        guideDialog.element.querySelector(".b3-dialog__container")?.classList.add("xlc-form-host");
        adaptSecondaryDialogForMobile(guideDialog, this.deps.t("close"));
        const body = getDialogBody(guideDialog.element);
        if (!body) return;
        body.innerHTML = "";
        const root = document.createElement("div");
        root.className = "xlc-form xlc-guide";

        // 顶部引导 Banner
        const stepBanner = document.createElement("div");
        stepBanner.style.cssText = "display:flex; align-items:center; justify-content:space-between; gap:8px; padding:10px 14px; border:1px solid var(--b3-theme-primary); border-radius:var(--b3-border-radius); background:color-mix(in srgb, var(--b3-theme-primary) 8%, var(--b3-theme-surface)); margin-bottom:12px; cursor:pointer;";
        stepBanner.innerHTML = `<strong>🎓 推荐：体验分步式实操教学指引（一步步上手）</strong><span style="font-size:12px; color:var(--b3-theme-primary); font-weight:600;">点击进入 ➔</span>`;
        stepBanner.addEventListener("click", () => {
            guideDialog.destroy();
            openStepByStepGuideDialog({
                t: this.deps.t,
                isMobile: this.deps.isMobile,
                onOpenSearch: () => this.focusInput(),
            });
        });
        root.appendChild(stepBanner);

        const intro = document.createElement("p");
        intro.className = "xlc-form-hint xlc-guide-intro";
        intro.textContent = this.deps.t("usageGuideIntro");
        root.appendChild(intro);
        const steps = document.createElement("ol");
        steps.className = "xlc-guide-list";
        const guideKeys = ["usageGuideAdd", "usageGuideSearch", this.deps.isMobile() ? "usageGuideInsertMobile" : "usageGuideInsert", "usageGuideOrganize"];
        for (const key of guideKeys) {
            const item = document.createElement("li");
            item.textContent = this.deps.t(key);
            steps.appendChild(item);
        }
        root.appendChild(steps);
        const variables = document.createElement("p");
        variables.className = "xlc-form-hint xlc-guide-vars";
        variables.textContent = this.deps.t("usageGuideVariables");
        root.appendChild(variables);
        const media = document.createElement("p");
        media.className = "xlc-form-hint xlc-guide-vars";
        media.textContent = this.deps.t("usageGuideMedia");
        root.appendChild(media);
        const mediaExamples = document.createElement("section");
        mediaExamples.className = "xlc-guide-media-examples";
        mediaExamples.setAttribute("aria-labelledby", "xlc-guide-media-title");
        const mediaTitle = document.createElement("p");
        mediaTitle.id = "xlc-guide-media-title";
        mediaTitle.className = "xlc-form-label";
        mediaTitle.textContent = this.deps.t("usageGuideMediaExamplesTitle");
        mediaExamples.appendChild(mediaTitle);
        const mediaList = document.createElement("ul");
        mediaList.className = "xlc-guide-media-list";
        for (const [control, key] of [
            ["guide.media.image", "usageGuideMediaImageExample"],
            ["guide.media.attachment", "usageGuideMediaAttachmentExample"],
            ["guide.media.resume", "usageGuideMediaResumeExample"],
        ] as const) {
            const item = document.createElement("li");
            item.dataset.xlcControl = control;
            item.textContent = this.deps.t(key);
            mediaList.appendChild(item);
        }
        mediaExamples.appendChild(mediaList);
        root.appendChild(mediaExamples);
        const multiblock = document.createElement("p");
        multiblock.className = "xlc-form-hint xlc-guide-vars";
        multiblock.textContent = this.deps.t("usageGuideMultiblock");
        root.appendChild(multiblock);
        const actions = document.createElement("div");
        actions.className = "xlc-form-actions";
        const close = document.createElement("button");
        close.type = "button";
        close.className = "b3-button xlc-btn-primary";
        close.dataset.xlcControl = "guide.close";
        close.textContent = this.deps.t("close");
        close.addEventListener("click", () => guideDialog.destroy());
        actions.appendChild(close);
        root.appendChild(actions);
        body.appendChild(root);
    }

    private buildPaneHead(): HTMLElement {
        const head = document.createElement("div");
        head.className = "xlc-pane-head";
        const title = document.createElement("span");
        title.className = "xlc-pane-title";
        head.appendChild(title);
        const badge = document.createElement("span");
        badge.className = "xlc-badge xlc-badge--ai xlc-pane-ai";
        badge.style.display = "none";
        badge.textContent = "✦ " + this.deps.t("aiFound");
        head.appendChild(badge);
        // 使用徽标（F3，原型屏 1：「✦ 常用 · N 次」；AI 徽标优先，二者不同时现）
        const usage = document.createElement("span");
        usage.className = "xlc-badge xlc-badge--ai xlc-pane-usage";
        usage.style.display = "none";
        head.appendChild(usage);

        // 上下文面板折叠/展开切换按钮（参考图三段式布局体系）
        const collapseBtn = document.createElement("button");
        collapseBtn.type = "button";
        collapseBtn.className = "b3-button b3-button--text xlc-pane-collapse-btn";
        collapseBtn.dataset.xlcControl = "preview.collapse";
        const titleCollapse = this.deps.t("paneCollapse") || "收起详情面板";
        const titleExpand = this.deps.t("paneExpand") || "展开详情面板";
        collapseBtn.title = titleCollapse;
        collapseBtn.setAttribute("aria-label", titleCollapse);
        collapseBtn.setAttribute("aria-expanded", "true");
        collapseBtn.textContent = "⇲";
        collapseBtn.addEventListener("click", () => {
            const pane = this.dialog?.element.querySelector<HTMLElement>(".xlc-pane");
            if (pane) {
                const isCollapsed = pane.classList.toggle("xlc-pane--collapsed");
                collapseBtn.textContent = isCollapsed ? "⇱" : "⇲";
                const label = isCollapsed ? titleExpand : titleCollapse;
                collapseBtn.title = label;
                collapseBtn.setAttribute("aria-label", label);
                collapseBtn.setAttribute("aria-expanded", String(!isCollapsed));
            }
        });
        head.appendChild(collapseBtn);
        return head;
    }

    private buildPaneFoot(): HTMLElement {
        const foot = document.createElement("div");
        foot.className = "xlc-pane-foot";
        foot.setAttribute("role", "toolbar");
        foot.setAttribute("aria-label", "详情动作操作栏");
        foot.addEventListener("keydown", (e) => {
            if (e.isComposing || e.keyCode === 229) return;
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                const btns = Array.from(foot.querySelectorAll<HTMLButtonElement>("button:not([disabled]):not([style*='display: none'])"));
                if (!btns.length) return;
                const idx = btns.indexOf(document.activeElement as HTMLButtonElement);
                if (idx === -1) return;
                e.preventDefault();
                e.stopPropagation();
                const nextIdx = e.key === "ArrowRight" ? (idx + 1) % btns.length : (idx - 1 + btns.length) % btns.length;
                btns[nextIdx]?.focus();
                return;
            }
            if (e.key === "Home" || e.key === "End") {
                const btns = Array.from(foot.querySelectorAll<HTMLButtonElement>("button:not([disabled]):not([style*='display: none'])"));
                if (!btns.length) return;
                e.preventDefault();
                e.stopPropagation();
                if (e.key === "Home") btns[0]?.focus();
                else btns[btns.length - 1]?.focus();
            }
        });
        const insert = document.createElement("button");
        insert.type = "button";
        insert.className = "b3-button xlc-btn-primary";
        insert.textContent = this.deps.t("insert");
        insert.dataset.xlcPaneAct = "insert";
        insert.dataset.xlcControl = "preview.insert";
        insert.setAttribute("aria-label", this.deps.t("insert"));
        insert.addEventListener("click", () => {
            // 提供方行激活：插入的是 payload（与 Enter 键路径一致），不是库条目（R138 错位修复）
            if (this.activeProvider >= 0) {
                const row = this.providerRows[this.activeProvider];
                if (row) void this.deps.insertProviderPayload(row.payload, this.insertTarget ?? undefined);
                return;
            }
            const entry = this.results[this.activeIndex];
            if (entry) void this.runPrimary(entry);
        });
        const copy = document.createElement("button");
        copy.type = "button";
        copy.className = "b3-button";
        copy.textContent = this.deps.t("copy");
        copy.dataset.xlcPaneAct = "copy";
        copy.dataset.xlcControl = "preview.copy";
        copy.setAttribute("aria-label", this.deps.t("copy"));
        copy.addEventListener("click", () => {
            if (this.activeProvider >= 0) {
                const row = this.providerRows[this.activeProvider];
                if (row) {
                    void this.deps.copyProviderPayload(row.payload).then((ok) => {
                        if (ok) lvNotify.inline(copy, "已复制");
                        else this.deps.notify?.("error", this.deps.t("copyFailed"));
                    });
                }
                if (!this.pinWindow) setTimeout(() => this.destroy(), 350);
                return;
            }
            const entry = this.results[this.activeIndex];
            if (entry) {
                if (entry.isOmni) {
                    const textToCopy = kramdownToPlainText(entry.content || entry.summary || "");
                    void this.deps.copyText(textToCopy).then((ok) => {
                        if (ok) {
                            lvNotify.inline(copy, "已复制");
                        } else {
                            this.deps.notify?.("error", this.deps.t("copyFailed"));
                        }
                    });
                } else {
                    void this.deps.runAction(entry.id, "copy").then((res) => {
                        if (res.ok) {
                            lvNotify.inline(copy, "已复制");
                        }
                    });
                }
                if (!this.pinWindow) setTimeout(() => this.destroy(), 350);
            }
        });

        copy.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            const entry = this.results[this.activeIndex];
            if (entry) void this.showCopyFormatMenu(copy, entry);
        });

        const copyFormatBtn = document.createElement("button");
        copyFormatBtn.type = "button";
        copyFormatBtn.className = "b3-button xlc-copy-format-toggle";
        copyFormatBtn.dataset.xlcControl = "preview.copy-format-toggle";
        copyFormatBtn.textContent = "▾";
        copyFormatBtn.title = "选择复制格式 (纯文本/富文本HTML/Markdown/块引用)";
        copyFormatBtn.setAttribute("aria-label", "选择复制格式");
        copyFormatBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const entry = this.results[this.activeIndex];
            if (entry) void this.showCopyFormatMenu(copyFormatBtn, entry);
        });

        const copyWrap = document.createElement("div");
        copyWrap.className = "xlc-copy-btn-group";
        copyWrap.appendChild(copy);
        copyWrap.appendChild(copyFormatBtn);

        // AI 变换：打开动作菜单（含 AI 变换分区；原型窗格底部第三按钮）
        const aiBtn = document.createElement("button");
        aiBtn.type = "button";
        aiBtn.className = "b3-button xlc-btn-ai";
        aiBtn.textContent = "✦ " + this.deps.t("aiTransform");
        aiBtn.dataset.xlcPaneAct = "ai";
        aiBtn.dataset.xlcControl = "preview.ai";
        aiBtn.setAttribute("aria-label", "AI 变换动作菜单");
        aiBtn.addEventListener("click", () => {
            const entry = this.results[this.activeIndex];
            if (entry) void this.showActionMenu(entry);
        });

        // 嵌入同步块按钮（Shift+Enter）
        const embedBtn = document.createElement("button");
        embedBtn.type = "button";
        embedBtn.className = "b3-button b3-button--text xlc-btn-ghost";
        embedBtn.textContent = "⊞ " + (this.deps.t("insertEmbed") || "同步嵌入");
        embedBtn.title = "作为思源原生嵌入块插入（源变动时多处自动同步更新，Shift+Enter）";
        embedBtn.dataset.xlcPaneAct = "embed";
        embedBtn.dataset.xlcControl = "preview.embed";
        embedBtn.setAttribute("aria-label", embedBtn.title);
        embedBtn.addEventListener("click", () => {
            const entry = this.results[this.activeIndex];
            if (entry) void this.insertEntryEmbedOrRef(entry, "embed");
        });

        // 插入块引用按钮（Alt+Enter）
        const refBtn = document.createElement("button");
        refBtn.type = "button";
        refBtn.className = "b3-button b3-button--text xlc-btn-ghost";
        refBtn.textContent = "＋ " + (this.deps.t("insertRef") || "插入引用");
        refBtn.title = "作为思源原生块引用插入（Alt+Enter）";
        refBtn.dataset.xlcPaneAct = "ref";
        refBtn.dataset.xlcControl = "preview.ref";
        refBtn.setAttribute("aria-label", refBtn.title);
        refBtn.addEventListener("click", () => {
            const entry = this.results[this.activeIndex];
            if (entry) void this.insertEntryEmbedOrRef(entry, "ref");
        });

        const spacer = document.createElement("span");
        spacer.className = "xlc-foot-spacer";
        const source = document.createElement("button");
        source.type = "button";
        source.className = "b3-button b3-button--text xlc-btn-ghost";
        source.textContent = this.deps.t("openSource");
        source.dataset.xlcPaneAct = "source";
        source.dataset.xlcControl = "preview.source";
        source.setAttribute("aria-label", this.deps.t("openSource"));
        source.addEventListener("click", () => {
            const entry = this.results[this.activeIndex];
            if (entry) {
                if (entry.isOmni && this.deps.openDocBlock) {
                    void this.deps.openDocBlock(resolveEntryBlockId(entry) || entry.id);
                } else {
                    void this.deps.openSource(entry.id);
                }
            }
        });
        const edit = document.createElement("button");
        edit.type = "button";
        edit.className = "b3-button b3-button--text xlc-btn-ghost";
        edit.textContent = this.deps.t("edit");
        edit.dataset.xlcPaneAct = "edit";
        edit.dataset.xlcControl = "preview.edit";
        edit.setAttribute("aria-label", this.deps.t("edit"));
        edit.addEventListener("click", () => {
            const entry = this.results[this.activeIndex];
            if (entry) {
                if (entry.isOmni) {
                    if (this.deps.quickEditBlock) {
                        void this.deps.quickEditBlock(resolveEntryBlockId(entry) || entry.id, entry.content || entry.summary || "");
                    }
                } else {
                    void this.deps.editItem(entry.id);
                }
            }
        });
        const editAndCapture = document.createElement("button");
        editAndCapture.type = "button";
        editAndCapture.className = "b3-button b3-button--text xlc-btn-ghost";
        editAndCapture.textContent = "✎ " + this.deps.t("editAndCapture");
        editAndCapture.dataset.xlcPaneAct = "edit-and-capture-omni";
        editAndCapture.dataset.xlcControl = "preview.edit-and-capture-omni";
        editAndCapture.style.display = "none";
        editAndCapture.addEventListener("click", () => {
            const entry = this.results[this.activeIndex];
            if (entry && this.deps.captureOmniWithForm) {
                this.deps.captureOmniWithForm(entry);
            }
        });
        const saveOmni = document.createElement("button");
        saveOmni.type = "button";
        saveOmni.className = "b3-button b3-button--text xlc-btn-ghost";
        saveOmni.textContent = "✦ " + this.deps.t("saveToCommon");
        saveOmni.dataset.xlcPaneAct = "save-omni";
        saveOmni.dataset.xlcControl = "preview.save-omni";
        saveOmni.style.display = "none";
        saveOmni.addEventListener("click", () => {
            const entry = this.results[this.activeIndex];
            if (entry && this.deps.createFromOmni) {
                const isClip = Boolean(entry && entry.id.startsWith("xlc-clip-"));
                const label = isClip ? (this.deps.t("promoteToCommon") || "沉淀为常用语") : this.deps.t("saveToCommon");
                saveOmni.disabled = true;
                saveOmni.textContent = this.deps.t("loading");
                void this.deps.createFromOmni(entry).then((ok) => {
                    if (ok) {
                        this.capturedOmniIds.add(entry.id);
                        saveOmni.textContent = "✓ 已" + label;
                        const activeRow = this.dialog?.element.querySelector<HTMLElement>(`[data-xlc-item-id="${entry.id}"]`);
                        const rowSaveBtn = activeRow?.querySelector<HTMLButtonElement>('[data-xlc-control="item.save-to-common"]');
                        if (rowSaveBtn) {
                            rowSaveBtn.textContent = "✓";
                            rowSaveBtn.disabled = true;
                            rowSaveBtn.title = "已" + label;
                        }
                    } else {
                        saveOmni.disabled = false;
                        const icon = isClip ? "⭐ " : "✦ ";
                        saveOmni.textContent = icon + label + " (Alt+S)";
                    }
                }).catch((err) => {
                    saveOmni.disabled = false;
                    const icon = isClip ? "⭐ " : "✦ ";
                    saveOmni.textContent = icon + label + " (Alt+S)";
                    this.deps.notify?.("error", toErrorMessage(err));
                });
            }
        });
        foot.appendChild(insert);
        foot.appendChild(copyWrap);
        foot.appendChild(embedBtn);
        foot.appendChild(refBtn);
        foot.appendChild(aiBtn);
        foot.appendChild(spacer);
        foot.appendChild(source);
        foot.appendChild(edit);
        foot.appendChild(editAndCapture);
        foot.appendChild(saveOmni);

        const cleanClipBtn = document.createElement("button");
        cleanClipBtn.type = "button";
        cleanClipBtn.className = "b3-button b3-button--text xlc-btn-ghost";
        cleanClipBtn.textContent = "🧹 格式清洗";
        cleanClipBtn.title = "剥离零宽字符、合并软换行与压缩多余空行";
        cleanClipBtn.dataset.xlcPaneAct = "clean-clip";
        cleanClipBtn.dataset.xlcControl = "preview.clean-clip";
        cleanClipBtn.style.display = "none";
        cleanClipBtn.addEventListener("click", async () => {
            const entry = this.results[this.activeIndex];
            if (entry && entry.content) {
                const cleaned = cleanClipboardText(entry.content, {mergeSoftBreaks: true});
                if (cleaned.hasChanges) {
                    entry.content = cleaned.cleanedText;
                    entry.summary = cleaned.cleanedText.slice(0, 100).replace(/[\s\r\n]+/g, " ");
                    try {
                        await this.deps.copyProviderPayload(cleaned.cleanedText);
                        this.updatePreview(entry.id);
                        this.deps.notify?.("info", `已清洗并复制到剪贴板: ${cleaned.changeDetails.join("、") || "文本已规整"}`);
                    } catch (err) {
                        this.deps.notify?.("error", toErrorMessage(err));
                    }
                } else {
                    this.deps.notify?.("info", "文本结构规范，无需清洗");
                }
            }
        });
        foot.appendChild(cleanClipBtn);
        return foot;
    }

    /** 重新加载标签/分类选项；成功时清理已经不存在的持久化筛选，失败时保留当前筛选并给出提示。 */
    private async refreshFilterOptions(): Promise<boolean> {
        const tagSelect = this.dialog?.element.querySelector<HTMLSelectElement>(".xlc-tag-select");
        const categorySelect = this.dialog?.element.querySelector<HTMLSelectElement>(".xlc-category-select");
        if (!tagSelect || !categorySelect) return false;
        const seq = ++this.filterOptionsSeq;
        const current = this.deps.getFilters();
        tagSelect.disabled = true;
        categorySelect.disabled = true;
        tagSelect.title = "";
        categorySelect.title = "";
        tagSelect.replaceChildren();
        categorySelect.replaceChildren();
        const tagAll = document.createElement("option");
        tagAll.value = "";
        tagAll.textContent = this.deps.t("filterAllTags");
        tagSelect.appendChild(tagAll);
        const categoryAll = document.createElement("option");
        categoryAll.value = "";
        categoryAll.textContent = this.deps.t("filterAllCategories");
        categorySelect.appendChild(categoryAll);
        const [tagsResult, categoriesResult] = await Promise.allSettled([this.deps.getTags(), this.deps.getCategories()]);
        if (seq !== this.filterOptionsSeq || !this.dialog) return false;
        const tags = tagsResult.status === "fulfilled" ? Array.from(new Set(tagsResult.value.filter(Boolean))) : [];
        const categories = categoriesResult.status === "fulfilled" ? Array.from(new Set(categoriesResult.value.filter(Boolean))) : [];

        const tagTree = buildHierarchyTree(tags);
        const flatTags = flattenHierarchyTree(tagTree, {includeCount: false, showPrefixBranch: true});
        for (const item of flatTags) {
            const option = document.createElement("option");
            option.value = item.path;
            option.textContent = item.label;
            tagSelect.appendChild(option);
        }

        const catTree = buildHierarchyTree(categories);
        const flatCats = flattenHierarchyTree(catTree, {includeCount: false, showPrefixBranch: true});
        for (const item of flatCats) {
            const option = document.createElement("option");
            option.value = item.path;
            option.textContent = item.label;
            categorySelect.appendChild(option);
        }

        if (tagsResult.status === "rejected") {
            tagSelect.title = this.deps.t("kernelError", this.deps.t("tags"));
            if (current.tag) {
                const option = document.createElement("option");
                option.value = current.tag;
                option.textContent = current.tag;
                tagSelect.appendChild(option);
            }
        }
        if (categoriesResult.status === "rejected") {
            categorySelect.title = this.deps.t("kernelError", this.deps.t("category"));
            if (current.category) {
                const option = document.createElement("option");
                option.value = current.category;
                option.textContent = current.category;
                categorySelect.appendChild(option);
            }
        }
        const validTagPaths = new Set(flatTags.map((t) => t.path).concat(tags));
        const validCatPaths = new Set(flatCats.map((c) => c.path).concat(categories));
        const nextTag = tagsResult.status === "fulfilled" ? (current.tag && validTagPaths.has(current.tag) ? current.tag : "") : current.tag;
        const nextCategory = categoriesResult.status === "fulfilled" ? (current.category && validCatPaths.has(current.category) ? current.category : "") : current.category;
        tagSelect.value = nextTag;
        categorySelect.value = nextCategory;
        tagSelect.disabled = false;
        categorySelect.disabled = false;
        const changed = (tagsResult.status === "fulfilled" && nextTag !== current.tag)
            || (categoriesResult.status === "fulfilled" && nextCategory !== current.category);
        if (changed) {
            this.deps.setFilters({type: current.type, tag: nextTag, category: nextCategory});
        }
        this.syncMobileFilterToggleRef?.();

        // 渲染热门标签快捷筛选胶囊
        const quickPillsHost = this.dialog?.element.querySelector<HTMLElement>(".xlc-quick-filter-pills");
        if (quickPillsHost) {
            quickPillsHost.replaceChildren();
            quickPillsHost.setAttribute("role", "toolbar");
            quickPillsHost.setAttribute("aria-label", "常用标签筛选");
            quickPillsHost.addEventListener("keydown", (e) => {
                if (e.isComposing || e.keyCode === 229) return;
                if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                    const btns = Array.from(quickPillsHost.querySelectorAll<HTMLButtonElement>(".xlc-quick-pill"));
                    if (!btns.length) return;
                    const idx = btns.indexOf(document.activeElement as HTMLButtonElement);
                    if (idx === -1) return;
                    e.preventDefault();
                    e.stopPropagation();
                    const nextIdx = e.key === "ArrowRight" ? (idx + 1) % btns.length : (idx - 1 + btns.length) % btns.length;
                    btns[nextIdx]?.focus();
                    return;
                }
                if (e.key === "Home" || e.key === "End") {
                    const btns = Array.from(quickPillsHost.querySelectorAll<HTMLButtonElement>(".xlc-quick-pill"));
                    if (!btns.length) return;
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.key === "Home") btns[0]?.focus();
                    else btns[btns.length - 1]?.focus();
                }
            });
            const topTags = tags.filter(Boolean).slice(0, 6);
            if (topTags.length > 0) {
                const label = document.createElement("span");
                label.className = "xlc-quick-pill-label";
                label.textContent = "常用标签:";
                quickPillsHost.appendChild(label);

                for (const t of topTags) {
                    const btn = document.createElement("button");
                    btn.type = "button";
                    const isSelected = nextTag === t;
                    btn.className = "xlc-quick-pill" + (isSelected ? " xlc-quick-pill--on" : "");
                    btn.setAttribute("role", "button");
                    btn.setAttribute("aria-pressed", isSelected ? "true" : "false");
                    btn.setAttribute("aria-label", isSelected ? `清除 #${t} 过滤` : `按 #${t} 过滤`);
                    btn.textContent = `#${t}`;
                    btn.title = isSelected ? `清除 #${t} 过滤` : `按 #${t} 过滤`;
                    btn.addEventListener("click", () => {
                        this.filterByTag(t);
                    });
                    quickPillsHost.appendChild(btn);
                }
                quickPillsHost.style.display = "flex";
            } else {
                quickPillsHost.style.display = "none";
            }
        }

        return changed;
    }

    private attachLongPress(list: HTMLElement, isMobile: boolean): void {
        let pressTimer: ReturnType<typeof setTimeout> | undefined;
        let startY = 0;
        let startX = 0;
        const cancel = (): void => {
            if (pressTimer) clearTimeout(pressTimer);
            pressTimer = undefined;
        };
        this.longPressCancel = cancel;
        // 桌面 contextmenu 与长按定时器会先后各开一次菜单——先到者取消后者（R138）
        list.addEventListener("contextmenu", cancel);
        list.addEventListener("touchstart", (e) => {
            startY = e.touches[0]?.clientY ?? 0;
            startX = e.touches[0]?.clientX ?? 0;
            const row = (e.target as HTMLElement).closest<HTMLElement>("[data-xlc-index]");
            if (!row) return;
            const entry = this.results[Number(row.dataset.xlcIndex)];
            if (!entry) return;
            cancel();
            pressTimer = setTimeout(() => void this.showActionMenu(entry), 550);
        }, {passive: true});
        list.addEventListener("touchmove", (e) => {
            const dy = Math.abs((e.touches[0]?.clientY ?? 0) - startY);
            const dx = Math.abs((e.touches[0]?.clientX ?? 0) - startX);
            if (Math.max(dx, dy) > 10) cancel();
        }, {passive: true});
        list.addEventListener("touchend", cancel, {passive: true});
        list.addEventListener("touchcancel", cancel, {passive: true});
        list.addEventListener("pointercancel", cancel, {passive: true});
        list.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            const row = (e.target as HTMLElement).closest<HTMLElement>("[data-xlc-index]");
            const entry = row ? this.results[Number(row.dataset.xlcIndex)] : this.results[this.activeIndex];
            if (entry) void this.showActionMenu(entry);
        });
        void isMobile;
    }

    private syncScopeChips(): void {
        this.dialog?.element.querySelectorAll<HTMLElement>(".xlc-scope-chip").forEach((chip) => {
            const on = chip.dataset.scope === this.currentScope;
            chip.classList.toggle("xlc-chip--on", on);
            chip.classList.toggle("xlc-scope-chip--on", on);
        });
        const clipFormatTrack = this.dialog?.element.querySelector<HTMLElement>(".xlc-clip-format-pills");
        if (clipFormatTrack) {
            clipFormatTrack.style.display = this.currentScope === "clipboard" ? "inline-flex" : "none";
        }
        const searchBox = this.dialog?.element.querySelector<HTMLElement>(".xlc-search");
        if (searchBox) {
            searchBox.classList.toggle("xlc-search--omni-mode", this.currentScope === "all-notes");
        }
        const input = this.dialog?.element.querySelector<HTMLInputElement>(".xlc-search-input");
        if (input) {
            let ph = this.deps.t("searchPlaceholder");
            if (this.currentScope === "all-notes") {
                ph = "🔍 " + (this.deps.t("scopeAllNotesPlaceholder") || "搜索思源全库内容块与文档...");
            } else if (this.currentScope === "clipboard") {
                ph = "📋 " + (this.deps.t("scopeClipboardPlaceholder") || "搜索剪贴板历史暂存...");
            } else if (this.currentScope === "current-doc") {
                ph = "☵ " + (this.deps.t("scopeCurrentDocPlaceholder") || "搜索当前打开文档中的内容块...");
            } else if (this.currentScope === "favorites") {
                ph = "★ " + (this.deps.t("filterFavorites") || "收藏常用语");
            } else if (this.currentScope === "recent") {
                ph = "🕐 " + (this.deps.t("filterRecent") || "最近使用常用语");
            } else {
                ph = this.deps.t("searchPlaceholder") + " (@ / 检索全库)";
            }
            input.placeholder = ph;
            input.setAttribute("aria-label", ph);
        }
        this.updateHistoryBarRef?.();
    }

    private buildQuery(): SearchQuery {
        const el = this.dialog?.element;
        const rawText = el?.querySelector<HTMLInputElement>(".xlc-search-input")?.value ?? "";
        const itemType = (el?.querySelector<HTMLSelectElement>(".xlc-type-select")?.value ?? "") as "" | ItemType;
        const tag = el?.querySelector<HTMLSelectElement>(".xlc-tag-select")?.value ?? "";
        const category = el?.querySelector<HTMLSelectElement>(".xlc-category-select")?.value ?? "";

        // 解析符号快捷前缀（#标签 / @分类 / type:类型 / scope:范围 · CAND-015 / TODO-FEAT-014）
        const parsed = parseSearchPrefix(rawText);
        const effectiveType = parsed.typeFilter || itemType;
        const effectiveTag = parsed.tagFilter || tag;
        const effectiveCategory = parsed.categoryFilter || category;
        const effectiveScope = parsed.scopeFilter || this.currentScope;

        return {
            text: parsed.cleanQuery,
            itemType: effectiveType,
            tag: effectiveTag,
            category: effectiveCategory,
            scope: effectiveScope,
        };
    }

    private async refresh(): Promise<void> {
        const seq = ++this.searchSeq;
        this.accessIssueMessage = null;
        this.syncMobileFilterToggleRef?.();
        const query = this.buildQuery();
        // 命中高亮快照（renderList 用；AI 语义找结果不高亮——匹配依据是语义而非字面）
        this.lastQueryText = query.text.trim();
        // 使用计数快照（F3 展示；侧车只读，不入索引）
        this.usageCounts = new Map(Object.entries(this.deps.getUsage()).map(([id, u]) => [id, u.count]));
        const list = this.dialog?.element.querySelector<HTMLElement>(".xlc-list");
        const status = this.dialog?.element.querySelector<HTMLElement>(".xlc-status");
        const footer = this.dialog?.element.querySelector<HTMLElement>(".xlc-footer");
        const aiBanner = this.dialog?.element.querySelector<HTMLElement>(".xlc-ai-banner");
        if (!list) return;
        this.dialog?.element.removeAttribute("data-xlc-access-issue");
        if (status) {
            status.textContent = "";
            status.classList.remove("xlc-status--error");
            status.setAttribute("role", "status");
        }
        const mobileInsert = this.dialog?.element.querySelector<HTMLButtonElement>(".xlc-mobile-insert");
        if (mobileInsert) mobileInsert.disabled = true;
        this.lastPreviewId = null;
        // 搜索刷新中的轻量反馈：列表半透明 + aria-busy（R106）
        list.classList.add("xlc-list--loading");
        list.setAttribute("aria-busy", "true");
        let total = 0;
        let truncated = false;
        let loading = false;
        let loadError: string | undefined;
        let directError = "";
        try {
            const text = query.text.trim();
            this.compactBundleCandidate = null;
            if (text.startsWith(COMPACT_BUNDLE_PREFIX) || text.startsWith("xlc://import?")) {
                const compact = deserializeCompactBundle(text);
                if (compact && compact.items && compact.items.length > 0) {
                    this.compactBundleCandidate = compact;
                    this.results = [];
                    total = compact.items.length;
                    truncated = false;
                    loading = false;
                    this.aiResults = false;
                    if (aiBanner) aiBanner.style.display = "none";
                }
            } else if (text.startsWith("?") && text.length > 1) {
                // AI 语义找（仅元数据出域；未启用/失败诚实提示）
                const aiScope: "all" | "favorites" | "recent" = this.currentScope === "favorites" || this.currentScope === "recent" ? this.currentScope : "all";
                const aiResult = await this.deps.aiSemantic(text.slice(1), {itemType: query.itemType ?? "", tag: query.tag ?? "", category: query.category ?? "", scope: aiScope});
                if (seq !== this.searchSeq) return;
                if (aiResult.ok) {
                    this.results = aiResult.entries;
                    this.aiResults = true;
                    total = aiResult.entries.length;
                } else {
                    this.results = [];
                    this.aiResults = false;
                    // 保留服务层的诚实失败原因；后面的空态计算不应覆盖它。
                    directError = aiResult.message;
                }
                if (aiBanner) aiBanner.style.display = this.aiResults && this.results.length ? "" : "none";
                if (aiBanner && this.aiResults) {
                    aiBanner.textContent = `✦ ${this.deps.t("aiResultCount", String(this.results.length))}`;
                }
            } else if (this.currentScope === "current-doc" && this.deps.searchCurrentDoc) {
                const entries = await this.deps.searchCurrentDoc(query.text);
                if (seq !== this.searchSeq) return;
                this.results = entries;
                total = entries.length;
                truncated = false;
                loading = false;
                this.aiResults = false;
                if (aiBanner) aiBanner.style.display = "none";
            } else if (this.currentScope === "clipboard") {
                const history = this.deps.getClipboardHistory ? this.deps.getClipboardHistory() : [];
                const cleanKeyword = query.text.trim().toLowerCase();
                let filtered = history;
                if (cleanKeyword) {
                    const adapter = getPinyinAdapter();
                    filtered = history.filter((h) => {
                        if (h.text.toLowerCase().includes(cleanKeyword)) return true;
                        const parsed = parseSnippetAnnotations(h.text);
                        if (parsed.title && parsed.title.toLowerCase().includes(cleanKeyword)) return true;
                        if (parsed.tags.some((t) => t.toLowerCase().includes(cleanKeyword))) return true;
                        if (parsed.title && adapter?.annotate) {
                            try {
                                const anno = adapter.annotate({title: parsed.title, alias: ""});
                                if (anno?.pyi && anno.pyi.toLowerCase().includes(cleanKeyword)) return true;
                            } catch {}
                        }
                        return false;
                    });
                }
                // 剪贴板格式过滤器（CAND-001 / TODO-FEAT-001）
                if (this.clipboardFormatFilter !== "all") {
                    filtered = filtered.filter((h) => {
                        const parsed = parseSnippetAnnotations(h.text);
                        const cleanText = parsed.cleanText || h.text;
                        const inferred = inferTypeFromText(cleanText);
                        if (this.clipboardFormatFilter === "image") {
                            return inferred === "image";
                        }
                        if (this.clipboardFormatFilter === "code") {
                            return inferred === "code";
                        }
                        if (this.clipboardFormatFilter === "text") {
                            return inferred === "text" || inferred === "markdown";
                        }
                        return true;
                    });
                }
                const adapter = getPinyinAdapter();
                const entries: SearchEntry[] = filtered.map((h, i) => {
                    const parsed = parseSnippetAnnotations(h.text);
                    const firstLine = h.text.trim().split(/[\r\n]+/)[0]?.slice(0, 35) || "剪贴板文本";
                    const displayTitle = parsed.title ? `📋 ${parsed.title}` : `📋 ${firstLine}`;
                    const tags = Array.from(new Set(["剪贴板", ...parsed.tags].filter(Boolean)));
                    const cleanText = parsed.cleanText || h.text;
                    let clipAlias = "";
                    if (parsed.title && adapter?.annotate) {
                        try {
                            const anno = adapter.annotate({title: parsed.title, alias: ""});
                            if (anno?.pyi) clipAlias = anno.pyi.toLowerCase().slice(0, 8);
                        } catch {}
                    }
                    return {
                        id: `xlc-clip-${i}`,
                        blockId: "",
                        libraryDocId: "",
                        title: displayTitle,
                        content: h.text,
                        summary: cleanText.slice(0, 100).replace(/[\s\r\n]+/g, " "),
                        itemType: inferTypeFromText(cleanText),
                        category: "剪贴板",
                        tags,
                        alias: clipAlias,
                        createdAt: h.copiedAt,
                        updatedAt: h.copiedAt,
                        isOmni: true,
                    };
                });
                if (seq !== this.searchSeq) return;
                this.results = entries;
                total = entries.length;
                truncated = false;
                loading = false;
                this.aiResults = false;
                if (aiBanner) aiBanner.style.display = "none";
            } else if (this.currentScope === "all-notes" && this.deps.searchAllNotes) {
                const cleanKeyword = query.text.replace(/^(@|\/|sy:)/, "").trim();
                const entries = await this.deps.searchAllNotes(cleanKeyword);
                if (seq !== this.searchSeq) return;
                this.results = entries;
                total = entries.length;
                truncated = false;
                loading = false;
                this.aiResults = false;
                if (aiBanner) aiBanner.style.display = "none";
            } else {
                const result = await this.deps.search(query);
                if (seq !== this.searchSeq) return;
                this.results = result.entries;
                total = result.total;
                truncated = result.truncated;
                loading = result.loading === true;
                loadError = result.error;
                this.aiResults = false;
                if (aiBanner) aiBanner.style.display = "none";

                // 自适应级联穿透：在全部范围（all）、无特定筛选且有查询词时，
                // 若常用库匹配结果较少（< 4 条），自动轻量追加全库思源笔记块
                const trimmedQuery = query.text.trim();
                const canCascade = this.currentScope === "all"
                    && !query.itemType
                    && !query.tag
                    && !query.category
                    && trimmedQuery.length >= 2
                    && this.results.length < 4
                    && Boolean(this.deps.searchAllNotes);

                if (canCascade && this.deps.searchAllNotes) {
                    try {
                        const omniHits = await this.deps.searchAllNotes(trimmedQuery);
                        if (seq === this.searchSeq && omniHits.length > 0) {
                            const existingIds = new Set(this.results.map((r) => r.id));
                            const supplemental = omniHits.filter((o) => !existingIds.has(o.id)).slice(0, 6);
                            if (supplemental.length > 0) {
                                this.results = [...this.results, ...supplemental];
                                total = this.results.length;
                            }
                        }
                    } catch {
                        // 级联失败安全静默，绝不破坏常用库主结果
                    }
                }

                // 算式求值嗅探：若输入包含明确等号或数学运算符，置顶呈现即时计算结果行
                const isExplicitCalc = trimmedQuery.startsWith("=") || /^(?:calc|计算)[:：]\s*/i.test(trimmedQuery);
                const hasMathOp = /[+\-*/%^]/.test(trimmedQuery) && /\d/.test(trimmedQuery);
                if (isExplicitCalc || hasMathOp) {
                    const mathVal = evaluateMathExpression(trimmedQuery);
                    if (mathVal !== null && mathVal !== trimmedQuery) {
                        const calcEntry: SearchEntry = {
                            id: "xlc-virtual-calc",
                            blockId: "",
                            libraryDocId: "",
                            title: `🧮 算式求值: ${mathVal}`,
                            content: mathVal,
                            summary: `${trimmedQuery.replace(/^=/, "")} = ${mathVal}`,
                            itemType: "text",
                            category: "计算器",
                            tags: ["计算器", "算式求值"],
                            alias: "",
                            varCount: 0,
                            createdAt: Date.now(),
                            updatedAt: Date.now(),
                        };
                        this.results.unshift(calcEntry);
                        total++;
                    }
                }
            }
        } catch (err) {
            if (seq !== this.searchSeq) return;
            this.results = [];
            this.providerRows = [];
            this.activeIndex = 0;
            this.activeProvider = -1;
            this.aiResults = false;
            this.emptyMessage = "";
            if (aiBanner) aiBanner.style.display = "none";
            if (status) {
                status.textContent = this.deps.t("kernelError", toErrorMessage(err));
                status.classList.add("xlc-status--error");
            }
            if (footer) {
                const count = footer.querySelector<HTMLElement>(".xlc-footer-count");
                // 错误态不留「共 0 条」——会被误读成空库（R138）
                if (count && !this.deps.isMobile()) count.textContent = "";
            }
            this.finishSearchLoad(list);
            this.renderList(list);
            return;
        }
        if (seq !== this.searchSeq) return;
        this.activeIndex = 0;
        this.activeProvider = -1;
        if (status) {
            this.emptyMessage = "";
            const isError = Boolean(directError || loadError);
            status.classList.toggle("xlc-status--error", isError);
            if (directError) {
                status.textContent = directError;
            } else if (loadError) {
                // 索引部分成功时也要说明结果可能不完整，不能用“有结果”掩盖失败。
                status.textContent = this.deps.t("kernelError", loadError);
            } else if (this.results.length) {
                status.textContent = "";
            } else if (loading) {
                status.textContent = this.deps.t("indexing");
            } else {
                // 空态文案移入列表大空态（图标 + 主文案 + 语义找提示）；status 保持安静；
                // 收藏/最近范围给分区专属文案（无 AI 建议提示）
                status.textContent = "";
                if (this.currentScope === "current-doc") {
                    this.emptyMessage = this.deps.t("emptyCurrentDoc");
                } else if (this.currentScope === "clipboard") {
                    this.emptyMessage = this.deps.t("emptyClipboard");
                } else if (this.currentScope === "all-notes") {
                    this.emptyMessage = this.deps.t("emptyAllNotes");
                } else if (!query.text.trim() && this.currentScope === "favorites") {
                    this.emptyMessage = this.deps.t("emptyFavorites");
                } else if (!query.text.trim() && this.currentScope === "recent") {
                    this.emptyMessage = this.deps.t("emptyRecent");
                } else if (!query.text.trim() && this.currentScope === "all"
                    && Boolean(query.itemType || query.tag || query.category)) {
                    this.emptyMessage = this.deps.t("emptyFiltered");
                } else if (query.text.trim() && !query.text.trim().startsWith("?") && this.deps.aiEnabled()) {
                    this.emptyMessage = this.deps.t("semanticSuggestion");
                } else if (total === 0 && !query.text.trim()) {
                    // 空库（F4 总量与筛选无关）：给「去哪加内容」的下一步，而非误导性的「没有匹配」
                    this.emptyMessage = this.deps.t("emptyLibrary");
                } else {
                    this.emptyMessage = this.deps.t("empty");
                }
            }
        }
        if (footer) {
            const count = footer.querySelector<HTMLElement>(".xlc-footer-count");
            if (count && !this.deps.isMobile()) {
                // 原型屏 1：常用排序时计数带排序名
                const sortSuffix = this.deps.getSort() === "frequent" ? ` · ${this.deps.t("sort.frequent")}` : "";
                // 截断标记带可读说明（悬停可见），不再是裸 ⚠（R138）
                if (directError) {
                    count.textContent = "";
                    count.title = "";
                } else {
                    const countLabel = this.aiResults
                        ? this.deps.t("aiResultCount", String(total))
                        : this.deps.t("totalItems", String(total));
                    count.textContent = countLabel + (!this.aiResults ? sortSuffix : "") + (truncated ? " ⚠" : "");
                    count.title = truncated ? this.deps.t("truncatedHint") : "";
                }
            }
        }
        // 提供方分区（有查询词且注册了可执行 provider 时；pv: 虚拟行不进键盘导航/执行器）
        this.providerRows = [];
        const q = query.text.trim();
        if (q && !q.startsWith("?")) {
            try {
                this.providerRows = await this.deps.providerSearch(q);
            } catch {
                this.providerRows = [];
            }
            if (seq !== this.searchSeq) return;
        }
        this.finishSearchLoad(list);
        this.renderList(list);
        this.renderTopChips();
        this.renderMobileBreadcrumbs();
        void this.checkClipboardSmartMatch();
        this.updatePreview();
        this.syncQueueChipRef?.();
    }

    /**
     * 移动端置顶高频片段直达行 (Mobile Spec v1 + v2):
     * 固定的条目排在最前并带 📌 标记；未固定的按使用频次与热度补齐到前 5 个；
     * 支持长按 500ms 切换固定/取消固定；点击复制并触发连击计数。
     */
    private renderTopChips(): void {
        if (!this.topChipsContainer || !this.deps.isMobile()) return;
        this.topChipsContainer.innerHTML = "";
        const candidates = (this.results || []).filter((r) => !r.isOmni);
        if (candidates.length === 0) {
            this.topChipsContainer.style.display = "none";
            return;
        }

        const usage = this.usageCounts;
        const pinnedIds = new Set(this.deps.getPinnedTopChips?.() ?? []);

        const sorted = candidates.slice().sort((a, b) => {
            const isPinnedA = pinnedIds.has(a.id) ? 1 : 0;
            const isPinnedB = pinnedIds.has(b.id) ? 1 : 0;
            if (isPinnedB !== isPinnedA) return isPinnedB - isPinnedA; // 固定的排在最前！
            const countA = usage.get(a.id) ?? 0;
            const countB = usage.get(b.id) ?? 0;
            if (countB !== countA) return countB - countA;
            const isFavA = this.deps.isFavorite(a.id) ? 1 : 0;
            const isFavB = this.deps.isFavorite(b.id) ? 1 : 0;
            if (isFavB !== isFavA) return isFavB - isFavA;
            const timeDiff = (b.updatedAt || 0) - (a.updatedAt || 0);
            if (timeDiff !== 0) return timeDiff;
            return a.id.localeCompare(b.id);
        });

        const top5 = sorted.slice(0, 5);
        if (top5.length === 0) {
            this.topChipsContainer.style.display = "none";
            return;
        }

        this.topChipsContainer.style.display = "flex";
        for (const entry of top5) {
            const isPinned = pinnedIds.has(entry.id);
            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = "xlc-top-chip" + (isPinned ? " xlc-top-chip--pinned" : "");
            chip.title = `点击复制，长按${isPinned ? "取消固定" : "固定"}「${entry.title}」`;
            chip.setAttribute("aria-label", chip.title);

            const iconSpan = document.createElement("span");
            iconSpan.className = "xlc-top-chip-icon";
            iconSpan.textContent = isPinned ? "📌" : "⚡";

            const textSpan = document.createElement("span");
            textSpan.className = "xlc-top-chip-text";
            textSpan.textContent = entry.title || "常用片段";

            chip.append(iconSpan, textSpan);

            // 长按固定/取消固定 (Mobile Spec v2 专项深化 3)
            let chipLongPressTimer: ReturnType<typeof setTimeout> | undefined;
            let chipMoved = false;
            let startX = 0;
            let startY = 0;

            chip.addEventListener("touchstart", (e) => {
                chipMoved = false;
                startX = e.touches[0]?.clientX ?? 0;
                startY = e.touches[0]?.clientY ?? 0;
                chipLongPressTimer = setTimeout(() => {
                    chipLongPressTimer = undefined;
                    lvLaunchpad.haptic(12);
                    const currentPinned = (this.deps.getPinnedTopChips?.() ?? []).slice();
                    let nextPinned: string[];
                    if (currentPinned.includes(entry.id)) {
                        nextPinned = currentPinned.filter((id) => id !== entry.id);
                        lvNotify.inline(chip, "已取消固定");
                    } else {
                        nextPinned = [entry.id, ...currentPinned.filter((id) => id !== entry.id)].slice(0, 5);
                        lvNotify.inline(chip, "已固定到直达行");
                    }
                    this.deps.setPinnedTopChips?.(nextPinned);
                    this.renderTopChips();
                }, 500);
            }, {passive: true});

            chip.addEventListener("touchmove", (e) => {
                const dx = Math.abs((e.touches[0]?.clientX ?? 0) - startX);
                const dy = Math.abs((e.touches[0]?.clientY ?? 0) - startY);
                if (Math.max(dx, dy) > 8 && chipLongPressTimer) {
                    clearTimeout(chipLongPressTimer);
                    chipLongPressTimer = undefined;
                    chipMoved = true;
                }
            }, {passive: true});

            chip.addEventListener("touchend", () => {
                if (chipLongPressTimer) {
                    clearTimeout(chipLongPressTimer);
                    chipLongPressTimer = undefined;
                }
            }, {passive: true});

            chip.addEventListener("click", async (e) => {
                e.stopPropagation();
                if (chipMoved) return;
                lvLaunchpad.haptic(12);
                const text = entry.content || entry.summary || entry.title;
                const ok = await this.deps.copyText(text);
                if (ok) {
                    iconSpan.textContent = "✓";
                    lvNotify.inline(chip, "已复制");
                    setTimeout(() => { iconSpan.textContent = isPinned ? "📌" : "⚡"; }, 1500);
                    this.trackCopyCombo(entry);
                }
            });
            this.topChipsContainer.appendChild(chip);
        }
    }

    /**
     * 剪贴板智能匹配 (Mobile Spec v2 专项深化 1):
     * 若系统剪贴板文本与某片段名或内容前缀匹配（≥4 字符），顶部显示一键替换横幅。
     */
    private async checkClipboardSmartMatch(): Promise<void> {
        if (!this.deps.isClipboardSmartMatchEnabled?.() || !this.smartMatchBannerEl) return;
        try {
            if (!navigator.clipboard?.readText || (typeof window !== "undefined" && !window.isSecureContext)) return;
            const clipText = (await navigator.clipboard.readText() || "").trim();
            if (clipText.length < 4) {
                this.smartMatchBannerEl.style.display = "none";
                return;
            }

            const matched = this.results.find((entry) => {
                const title = (entry.title || "").trim();
                const alias = (entry.alias || "").trim();
                const content = (entry.content || entry.summary || "").trim();
                if (title && (title.toLowerCase().startsWith(clipText.toLowerCase()) || clipText.toLowerCase().startsWith(title.toLowerCase()))) return true;
                if (alias && alias.toLowerCase() === clipText.toLowerCase()) return true;
                if (content && (content.toLowerCase().startsWith(clipText.toLowerCase()) || clipText.toLowerCase().startsWith(content.slice(0, 40).toLowerCase()))) return true;
                return false;
            });

            if (!matched) {
                this.smartMatchBannerEl.style.display = "none";
                return;
            }

            this.smartMatchBannerEl.innerHTML = "";
            this.smartMatchBannerEl.style.display = "flex";

            const bannerText = document.createElement("span");
            bannerText.className = "xlc-smart-match-text";
            bannerText.textContent = this.deps.t("clipboardSmartMatchBanner", matched.title);

            const replaceBtn = document.createElement("button");
            replaceBtn.type = "button";
            replaceBtn.className = "b3-button b3-button--small xlc-btn-primary";
            replaceBtn.textContent = "一键替换";
            replaceBtn.addEventListener("click", async () => {
                lvLaunchpad.haptic(12);
                const text = matched.content || matched.summary || matched.title;
                const ok = await this.deps.copyText(text);
                if (ok) {
                    bannerText.textContent = this.deps.t("clipboardSmartMatchDone");
                    lvNotify.inline(replaceBtn, "已复制");
                    setTimeout(() => {
                        if (this.smartMatchBannerEl) this.smartMatchBannerEl.style.display = "none";
                    }, 1500);
                }
            });

            const closeBtn = document.createElement("button");
            closeBtn.type = "button";
            closeBtn.className = "xlc-banner-close";
            closeBtn.textContent = "✕";
            closeBtn.addEventListener("click", () => {
                if (this.smartMatchBannerEl) this.smartMatchBannerEl.style.display = "none";
            });

            this.smartMatchBannerEl.append(bannerText, replaceBtn, closeBtn);
        } catch {
            // 用户未授权或环境限制时静默处理
        }
    }

    /**
     * 移动端多级分类面包屑导航 (Mobile Spec v2 专项深化 2):
     * 支持面包屑节点快速切换分类与左滑返回上一级分类。
     */
    private renderMobileBreadcrumbs(): void {
        if (!this.mobileBreadcrumbsEl || !this.deps.isMobile()) return;
        const currentFilters = this.deps.getFilters();
        const category = currentFilters.category?.trim();
        if (!category || !category.includes("/")) {
            this.mobileBreadcrumbsEl.style.display = "none";
            this.mobileBreadcrumbsEl.innerHTML = "";
            return;
        }

        this.mobileBreadcrumbsEl.innerHTML = "";
        this.mobileBreadcrumbsEl.style.display = "flex";

        const parts = category.split("/").filter(Boolean);
        const allBtn = document.createElement("button");
        allBtn.type = "button";
        allBtn.className = "xlc-breadcrumb-item";
        allBtn.textContent = "全部";
        allBtn.addEventListener("click", () => {
            this.deps.setFilters({ ...currentFilters, category: "" });
            void this.refresh();
        });
        this.mobileBreadcrumbsEl.appendChild(allBtn);

        let acc = "";
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!part) continue;
            const sep = document.createElement("span");
            sep.className = "xlc-breadcrumb-sep";
            sep.textContent = "›";
            this.mobileBreadcrumbsEl.appendChild(sep);

            acc = acc ? `${acc}/${part}` : part;
            const targetCat = acc;
            const partBtn = document.createElement("button");
            partBtn.type = "button";
            partBtn.className = "xlc-breadcrumb-item" + (i === parts.length - 1 ? " xlc-breadcrumb-item--active" : "");
            partBtn.textContent = part;
            if (i < parts.length - 1) {
                partBtn.addEventListener("click", () => {
                    this.deps.setFilters({ ...currentFilters, category: targetCat });
                    void this.refresh();
                });
            }
            this.mobileBreadcrumbsEl.appendChild(partBtn);
        }
    }

    /**
     * 复制连击计数 (Mobile Spec v2 专项深化 4):
     * 同一片段 30 秒内连续复制 ≥2 次时提示批量导出并提供多选入口。
     */
    private trackCopyCombo(entry: SearchEntry): void {
        const now = Date.now();
        if (this.copyCombo.itemId === entry.id && (now - this.copyCombo.lastTime) <= 30_000) {
            this.copyCombo.count++;
        } else {
            this.copyCombo.itemId = entry.id;
            this.copyCombo.count = 1;
        }
        this.copyCombo.lastTime = now;

        if (this.copyCombo.count >= 2) {
            this.showCopyComboBanner(entry, this.copyCombo.count);
        }
    }

    private showCopyComboBanner(entry: SearchEntry, count: number): void {
        if (!this.copyComboBannerEl) return;
        this.copyComboBannerEl.innerHTML = "";
        this.copyComboBannerEl.style.display = "flex";

        const textSpan = document.createElement("span");
        textSpan.className = "xlc-combo-text";
        textSpan.textContent = this.deps.t("copyComboCount", String(count));

        const multiBtn = document.createElement("button");
        multiBtn.type = "button";
        multiBtn.className = "b3-button b3-button--small xlc-btn-primary";
        multiBtn.textContent = this.deps.t("enterMultiSelect");
        multiBtn.addEventListener("click", () => {
            this.multiSelectMode = true;
            this.selectedIds.add(entry.id);
            this.copyComboBannerEl!.style.display = "none";
            this.renderBatchBar();
            if (this.listEl) this.renderList(this.listEl);
        });

        const closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.className = "xlc-banner-close";
        closeBtn.textContent = "✕";
        closeBtn.addEventListener("click", () => {
            this.copyComboBannerEl!.style.display = "none";
        });

        this.copyComboBannerEl.append(textSpan, multiBtn, closeBtn);
    }

    /** 收尾一次搜索刷新：解除列表加载反馈（成功与失败路径共用）。 */
    private finishSearchLoad(list: HTMLElement): void {
        list.classList.remove("xlc-list--loading");
        list.removeAttribute("aria-busy");
    }

    /** 菜单关闭后把焦点还给搜索框（键盘连续性；弹窗已销毁则静默忽略）。 */
    private restoreFocusToSearch(): void {
        this.dialog?.element.querySelector<HTMLElement>(".xlc-search-input")?.focus();
    }

    /**
     * 命中高亮：支持多关键词按空格/多维标点分词高亮，收集匹配区间并合并重叠区域，注入 mark span。
     * 文本一律 textContent / createTextNode，绝不使用 innerHTML（ADR 0036 / T-0063 / T-0117）。
     */
    private appendHighlighted(parent: HTMLElement, text: string, query: string): void {
        const tokens = splitSearchTokens(query).map((t) => t.toLowerCase());

        if (tokens.length === 0) {
            parent.appendChild(document.createTextNode(text));
            return;
        }

        const lowerText = text.toLowerCase();
        // 收集所有 token 在 text 中的命中区间 [start, end)
        const intervals: Array<[number, number]> = [];
        for (const token of tokens) {
            let cursor = 0;
            while (cursor <= lowerText.length - token.length) {
                const at = lowerText.indexOf(token, cursor);
                if (at < 0) break;
                intervals.push([at, at + token.length]);
                cursor = at + Math.max(1, token.length);
            }
            // 拼音首字母与全拼对应汉字字符级定位高亮（ADR 0038 / T-0065）
            const pyMatches = findPinyinMatches(text, token);
            for (const pm of pyMatches) {
                intervals.push(pm);
            }
        }

        if (intervals.length === 0) {
            parent.appendChild(document.createTextNode(text));
            return;
        }

        // 合并重叠与相邻区间（Merge Intervals）
        intervals.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        const merged: Array<[number, number]> = [];
        for (const [start, end] of intervals) {
            const prev = merged[merged.length - 1];
            if (prev && start <= prev[1]) {
                prev[1] = Math.max(prev[1], end);
            } else {
                merged.push([start, end]);
            }
        }

        // 渲染文本节点与高亮 mark
        let cursor = 0;
        for (const [start, end] of merged) {
            if (start > cursor) {
                parent.appendChild(document.createTextNode(text.slice(cursor, start)));
            }
            const mark = document.createElement("mark");
            mark.className = "xlc-hit";
            mark.textContent = text.slice(start, end);
            parent.appendChild(mark);
            cursor = end;
        }
        if (cursor < text.length) {
            parent.appendChild(document.createTextNode(text.slice(cursor)));
        }
    }

    /** 创建一行真实库条目。抽出后虚拟列表可以复用同一套交互与无障碍属性。 */
    private createEntryRow(entry: SearchEntry, index: number): HTMLElement {
        const fav = this.deps.isFavorite(entry.id);
        const row = document.createElement("div");
        row.className = "xlc-row"
            + (index === this.activeIndex ? " xlc-row--active" : "")
            + (fav ? " xlc-row--fav" : "");
        if (this.multiSelectMode && this.selectedIds.has(entry.id)) {
            row.classList.add("xlc-row--selected");
        }
        row.dataset.xlcControl = "item.row";
        row.dataset.xlcIndex = String(index);
        row.dataset.xlcItemId = entry.id;
        row.id = `xlc-result-${index}`;
        row.setAttribute("role", "listitem");
        row.setAttribute("aria-current", index === this.activeIndex ? "true" : "false");
        row.setAttribute("aria-posinset", String(index + 1));
        row.setAttribute("aria-setsize", String(this.results.length));

        if (this.multiSelectMode) {
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "xlc-row-checkbox";
            checkbox.checked = this.selectedIds.has(entry.id);
            checkbox.setAttribute("aria-label", `选择 ${entry.title}`);
            checkbox.addEventListener("click", (e) => {
                e.stopPropagation();
                if (checkbox.checked) {
                    this.selectedIds.add(entry.id);
                } else {
                    this.selectedIds.delete(entry.id);
                }
                this.renderBatchBar();
            });
            row.appendChild(checkbox);
        }

        const main = document.createElement("div");
        main.className = "xlc-row-main";
        const title = document.createElement("div");
        title.className = "xlc-row-title";
        if (index < 9) {
            const ordinal = document.createElement("span");
            ordinal.className = "xlc-row-ordinal";
            const numStr = String(index + 1);
            ordinal.textContent = numStr;
            const hint = this.deps.t("ordinalShortcutHint", numStr, numStr);
            ordinal.title = hint;
            ordinal.setAttribute("aria-label", hint);
            title.appendChild(ordinal);
        }
        const badge = document.createElement("span");
        badge.className = `xlc-badge xlc-badge--${entry.itemType}`;
        badge.textContent = TYPE_BADGES[entry.itemType] ?? "TXT";
        badge.title = this.deps.t(`type.${entry.itemType}`);
        badge.setAttribute("aria-label", this.deps.t(`type.${entry.itemType}`));
        title.appendChild(badge);
        if (entry.isOmni) {
            const omniBadge = document.createElement("span");
            omniBadge.className = "xlc-badge xlc-badge--omni";
            omniBadge.textContent = entry.tags?.includes("全库块") ? "思源块" : (entry.tags?.includes("当前文档") ? "本文档" : "思源");
            omniBadge.title = "思源全库检索条目，可直接复用或一键收录为常用语 (Alt+S)";
            title.appendChild(omniBadge);
        }
        if (entry.category && entry.category.trim() && !entry.isOmni) {
            const catBadge = document.createElement("span");
            const variant = getCategoryColorVariant(entry.category);
            catBadge.className = `xlc-badge xlc-badge--cat xlc-cat--${variant}`;
            catBadge.textContent = entry.category.trim();
            catBadge.title = `${this.deps.t("category")}：${entry.category.trim()}`;
            catBadge.setAttribute("aria-label", `${this.deps.t("category")}：${entry.category.trim()}`);
            title.appendChild(catBadge);
        }
        const hasSelectionPlaceholder = Boolean(entry.content?.includes("{{xlc:selection}}") || entry.summary?.includes("{{xlc:selection}}"));
        if (hasSelectionPlaceholder) {
            const surroundBadge = document.createElement("span");
            surroundBadge.className = "xlc-badge xlc-badge--surround";
            surroundBadge.textContent = "✦ 包裹";
            surroundBadge.title = "支持选区包裹：插入时自动将当前选区文本嵌入此模板";
            title.appendChild(surroundBadge);
        }
        // G27 / ADR 0080 / TASK-20261031: 唯一简码或别名精确匹配金色直达徽标
        const cleanQuery = this.lastQueryText.trim().toLowerCase();
        const isShortcodeHit = Boolean(cleanQuery && entry.shortcode && (entry.shortcode.trim().toLowerCase() === cleanQuery || entry.shortcode.trim().toLowerCase() === ":" + cleanQuery));
        const isAliasHit = Boolean(cleanQuery && entry.alias && entry.alias.trim().toLowerCase() === cleanQuery);
        if (isShortcodeHit || isAliasHit) {
            const directBadge = document.createElement("span");
            directBadge.className = "xlc-badge xlc-badge--direct";
            directBadge.textContent = "⚡ Tab直达";
            directBadge.title = isShortcodeHit ? "简码唯一命中：按 Tab 或 Enter 极速插入" : "唯一别名精确匹配：按 Tab 或 Enter 极速插入";
            title.appendChild(directBadge);
        }
        if (entry.shortcode) {
            const scBadge = document.createElement("span");
            scBadge.className = "xlc-badge xlc-badge--shortcode";
            scBadge.textContent = entry.shortcode;
            scBadge.title = `简码：输入 ${entry.shortcode} 触发`;
            title.appendChild(scBadge);
        }
        if (this.miniMode && index < 9) {
            const miniNum = document.createElement("span");
            miniNum.className = "xlc-mini-row-num";
            miniNum.textContent = String(index + 1);
            miniNum.title = `按键直达：${index + 1} 插入 / Shift+${index + 1} 复制`;
            miniNum.setAttribute("aria-hidden", "true");
            title.appendChild(miniNum);
        }
        const titleText = document.createElement("span");
        titleText.className = "xlc-row-titletext";
        const highlight = this.lastQueryText.length > 0
            && !this.lastQueryText.startsWith("?")
            && !this.aiResults;
        if (highlight) this.appendHighlighted(titleText, entry.title || this.deps.t("unknownType"), this.lastQueryText);
        else titleText.textContent = entry.title || this.deps.t("unknownType");
        title.appendChild(titleText);
        if ((entry.varCount ?? 0) > 0) {
            const varBadge = document.createElement("span");
            varBadge.className = "xlc-badge xlc-badge--var";
            varBadge.textContent = this.deps.t("varCountBadge", String(entry.varCount));
            title.appendChild(varBadge);
        }
        if (this.deps.isSourceMissing(entry)) {
            const warn = document.createElement("span");
            warn.className = "xlc-row-warn";
            warn.textContent = "⚠";
            warn.title = this.deps.t("sourceMissing") + " · " + this.deps.t("sourceGone");
            warn.setAttribute("aria-label", this.deps.t("sourceMissing"));
            title.appendChild(warn);
        }
        main.appendChild(title);
        const meta = document.createElement("div");
        meta.className = "xlc-row-meta";

        // 全域条目显示精细面包屑路径（手机端已有分组标题头，省略行内重复路径避免挤占摘要）
        const isMobileRow = this.deps.isMobile();
        if (entry.isOmni && entry.category && !isMobileRow) {
            const breadcrumb = document.createElement("span");
            breadcrumb.className = "xlc-row-breadcrumb";
            const cleanPath = entry.category.replace(/^\/+/, "").replace(/\.sy$/, "");
            const parts = cleanPath.split("/").filter(Boolean);
            breadcrumb.textContent = parts.length > 0 ? parts.join(" › ") : entry.category;
            breadcrumb.title = `所属文档路径：${entry.category}`;
            meta.appendChild(breadcrumb);
        }

        const currentFilters = this.deps.getFilters();
        const cleanTags = entry.tags.filter((tg) => Boolean(tg) && !(isMobileRow && entry.isOmni && (tg === "全库块" || tg === "当前文档")));
        const shownTags = cleanTags.slice(0, 3);
        if (shownTags.length > 0) {
            const tagsWrapper = document.createElement("span");
            tagsWrapper.className = "xlc-row-tags";
            for (const tag of shownTags) {
                const isSelected = currentFilters.tag === tag;
                const pill = document.createElement("button");
                pill.type = "button";
                pill.className = "xlc-tag-pill" + (isSelected ? " xlc-tag-pill--on" : "");
                pill.dataset.xlcControl = "row.filter.tag";
                pill.textContent = `#${tag}`;
                const tip = this.deps.t(isSelected ? "clearThisTagFilter" : "filterByThisTag", tag);
                pill.title = tip;
                pill.setAttribute("aria-label", tip);
                pill.setAttribute("aria-pressed", String(isSelected));
                pill.addEventListener("click", (e) => {
                    e.stopPropagation();
                    this.filterByTag(tag);
                });
                tagsWrapper.appendChild(pill);
            }
            if (cleanTags.length > shownTags.length) {
                const more = document.createElement("span");
                more.className = "xlc-tag-pill xlc-tag-pill--more";
                more.textContent = `+${cleanTags.length - shownTags.length}`;
                tagsWrapper.appendChild(more);
            }
            meta.appendChild(tagsWrapper);
        }

        const useCount = this.usageCounts.get(entry.id) ?? 0;
        const sourceTextForSummary = entry.content || entry.summary || "";
        if (sourceTextForSummary) {
            const summarySpan = document.createElement("span");
            summarySpan.className = "xlc-row-summary";
            const tokens = this.lastQueryText ? splitSearchTokens(this.lastQueryText) : [];
            const cleanSummarySource = (entry.itemType !== "code") ? extractCleanPayload(sourceTextForSummary) : sourceTextForSummary;
            const summaryText = deriveSmartSummary(cleanSummarySource, tokens, 90);
            const prefix = (shownTags.length > 0 || (entry.isOmni && entry.category)) ? " · " : "";
            if (prefix) summarySpan.appendChild(document.createTextNode(prefix));
            if (this.lastQueryText && !this.lastQueryText.startsWith("?") && !this.aiResults) {
                this.appendHighlighted(summarySpan, summaryText, this.lastQueryText);
            } else {
                summarySpan.appendChild(document.createTextNode(summaryText));
            }
            meta.appendChild(summarySpan);
        }
        if (useCount > 0) {
            const useSpan = document.createElement("span");
            useSpan.className = "xlc-row-usecount";
            if (typeof useSpan.setAttribute === "function") {
                useSpan.setAttribute("role", "status");
                useSpan.setAttribute("aria-label", this.deps.t("useCount", String(useCount)));
            }
            useSpan.textContent = (shownTags.length > 0 || entry.summary ? " · " : "") + this.deps.t("useCount", String(useCount));
            meta.appendChild(useSpan);
        }
        main.appendChild(meta);
        row.appendChild(main);

        if (entry.isOmni) {
            if (entry.id.startsWith("xlc-clip-")) {
                const actionsWrap = document.createElement("div");
                actionsWrap.className = "xlc-row-action-wrap";
                actionsWrap.style.cssText = "display:flex; align-items:center; gap:4px;";

                const isCaptured = this.capturedOmniIds.has(entry.id);
                const saveBtn = document.createElement("button");
                saveBtn.type = "button";
                saveBtn.className = "b3-button b3-button--small xlc-row-action";
                saveBtn.dataset.xlcControl = "item.save-to-common";
                saveBtn.textContent = isCaptured ? "✓" : "⭐";
                saveBtn.title = isCaptured ? "已存为常用" : "存为常用 (转正为永久片段)";
                saveBtn.setAttribute("aria-label", isCaptured ? "已存为常用" : "存为常用");
                saveBtn.disabled = isCaptured;
                saveBtn.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    if (saveBtn.disabled || this.capturedOmniIds.has(entry.id)) return;
                    if (this.deps.promoteClipboardEntry) {
                        const existingCategories = Array.from(new Set(this.results.map((r) => r.category).filter(Boolean)));
                        const lastCategory = this.deps.getFilters().category || "常用";
                        openPromoteClipDialog({
                            t: this.deps.t,
                            entry,
                            categories: existingCategories,
                            defaultCategory: lastCategory,
                            entries: this.results,
                            notify: this.deps.notify,
                            onPromote: async (payload) => {
                                const ok = await this.deps.promoteClipboardEntry!(entry, payload);
                                if (ok) {
                                    this.capturedOmniIds.add(entry.id);
                                    saveBtn.textContent = "✓";
                                    saveBtn.disabled = true;
                                    saveBtn.title = "已存为常用";
                                    lvNotify.inline(saveBtn, "已存为常用");
                                    this.syncPaneActions();
                                }
                                return ok;
                            },
                        });
                        return;
                    }
                    saveBtn.disabled = true;
                    saveBtn.textContent = "…";
                    if (this.deps.createFromOmni) {
                        try {
                            const ok = await this.deps.createFromOmni(entry);
                            if (ok) {
                                this.capturedOmniIds.add(entry.id);
                                saveBtn.textContent = "✓";
                                saveBtn.disabled = true;
                                saveBtn.title = "已沉淀为常用语";
                                this.syncPaneActions();
                            } else {
                                saveBtn.disabled = false;
                                saveBtn.textContent = "⭐";
                            }
                        } catch {
                            saveBtn.disabled = false;
                            saveBtn.textContent = "⭐";
                        }
                    } else {
                        saveBtn.disabled = false;
                        saveBtn.textContent = "⭐";
                    }
                });
                actionsWrap.appendChild(saveBtn);

                if (this.deps.captureOmniWithForm && !this.deps.isMobile()) {
                    const editBtn = document.createElement("button");
                    editBtn.type = "button";
                    editBtn.className = "b3-button b3-button--small xlc-row-action";
                    editBtn.dataset.xlcControl = "item.edit-capture";
                    editBtn.textContent = "✎";
                    editBtn.title = "编辑后沉淀为常用语";
                    editBtn.setAttribute("aria-label", "编辑后沉淀为常用语");
                    editBtn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        this.deps.captureOmniWithForm?.(entry);
                    });
                    actionsWrap.appendChild(editBtn);
                }

                const homeBridge = getBridgeSafely<any>("home");
                if (homeBridge && typeof homeBridge.addMemo === "function") {
                    const memoBtn = document.createElement("button");
                    memoBtn.type = "button";
                    memoBtn.className = "b3-button b3-button--small xlc-row-action";
                    memoBtn.dataset.xlcControl = "item.promote-to-home";
                    memoBtn.textContent = "📋";
                    memoBtn.title = "推送到小驴管家备忘";
                    memoBtn.setAttribute("aria-label", "推送到小驴管家备忘");
                    memoBtn.addEventListener("click", async (e) => {
                        e.stopPropagation();
                        memoBtn.disabled = true;
                        memoBtn.textContent = "…";
                        const content = entry.summary || entry.title || "";
                        const cleanTitle = content.replace(/\s+/g, " ").slice(0, 50).trim();
                        const todayStr = new Date().toISOString().slice(0, 10);
                        const ok = await callBridge<any, boolean>(
                            "home",
                            "addMemo",
                            async (b) => {
                                await b.addMemo(cleanTitle, todayStr);
                                return true;
                            },
                            () => false
                        );
                        if (ok) {
                            memoBtn.textContent = "✓";
                            memoBtn.title = "已推送到管家备忘";
                            this.deps.notify?.("info", "已推送到小驴管家备忘");
                        } else {
                            memoBtn.disabled = false;
                            memoBtn.textContent = "📋";
                        }
                    });
                    actionsWrap.appendChild(memoBtn);
                }

                row.appendChild(actionsWrap);
            } else {
                const actionsWrap = document.createElement("div");
                actionsWrap.className = "xlc-row-action-wrap";
                actionsWrap.style.cssText = "display:flex; align-items:center; gap:4px;";

                const insertBtn = document.createElement("button");
                insertBtn.type = "button";
                insertBtn.className = "b3-button b3-button--small xlc-row-action xlc-row-action--pill xlc-row-action--primary";
                insertBtn.dataset.xlcControl = "item.insert-omni";
                insertBtn.textContent = this.mobilePrimaryIsCopy() ? this.deps.t("copy") : "↵ 插入";
                insertBtn.title = this.mobilePrimaryIsCopy() ? this.deps.t("insertMobileActionHint") : "直接将此内容块插入到当前光标处 (Enter)";
                insertBtn.setAttribute("aria-label", this.mobilePrimaryIsCopy() ? this.deps.t("copy") : "插入内容块");
                insertBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    void this.runPrimary(entry);
                });
                actionsWrap.appendChild(insertBtn);

                const copyBtn = document.createElement("button");
                copyBtn.type = "button";
                copyBtn.className = "b3-button b3-button--small xlc-row-action xlc-row-action--pill";
                copyBtn.dataset.xlcControl = "item.copy-omni";
                copyBtn.textContent = "复制";
                copyBtn.title = "复制此内容块纯文本到剪贴板 (Ctrl+Enter)";
                copyBtn.setAttribute("aria-label", "复制内容块");
                copyBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const text = entry.content || entry.summary || entry.title || "";
                    void this.deps.copyText(text).then((ok) => {
                        if (ok) {
                            copyBtn.textContent = "✓ 已复制";
                            lvNotify.inline(copyBtn, "已复制");
                            setTimeout(() => { copyBtn.textContent = "复制"; }, 1400);
                        }
                    });
                });
                actionsWrap.appendChild(copyBtn);

                const isCaptured = this.capturedOmniIds.has(entry.id);
                const saveBtn = document.createElement("button");
                saveBtn.type = "button";
                saveBtn.className = "b3-button b3-button--small xlc-row-action xlc-row-action--pill";
                saveBtn.dataset.xlcControl = "item.save-to-common";
                saveBtn.textContent = isCaptured ? "✓ 已存" : "✦ 存常用";
                saveBtn.title = isCaptured ? "已收录入常用库" : "一键收录入常用库 (Alt+S)";
                saveBtn.setAttribute("aria-label", isCaptured ? "已收录入常用库" : "一键收录入常用库");
                saveBtn.disabled = isCaptured;
                saveBtn.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    if (saveBtn.disabled || this.capturedOmniIds.has(entry.id)) return;
                    saveBtn.disabled = true;
                    saveBtn.textContent = "…";
                    if (this.deps.createFromOmni) {
                        try {
                            const ok = await this.deps.createFromOmni(entry);
                            if (ok) {
                                this.capturedOmniIds.add(entry.id);
                                saveBtn.textContent = "✓ 已存";
                                saveBtn.disabled = true;
                                saveBtn.title = "已收录入常用库";
                                this.syncPaneActions();
                            } else {
                                saveBtn.disabled = false;
                                saveBtn.textContent = "✦ 存常用";
                            }
                        } catch {
                            saveBtn.disabled = false;
                            saveBtn.textContent = "✦ 存常用";
                        }
                    } else {
                        saveBtn.disabled = false;
                        saveBtn.textContent = "✦ 存常用";
                    }
                });
                actionsWrap.appendChild(saveBtn);

                if (this.deps.openDocBlock) {
                    const locateBtn = document.createElement("button");
                    locateBtn.type = "button";
                    locateBtn.className = "b3-button b3-button--small xlc-row-action xlc-row-action--pill";
                    locateBtn.dataset.xlcControl = "item.locate-source";
                    locateBtn.textContent = "↗ 原文";
                    locateBtn.title = "在思源笔记中打开并定位到此原始块";
                    locateBtn.setAttribute("aria-label", "在思源中定位源块");
                    locateBtn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        void this.deps.openDocBlock?.(entry.targetBlockId || entry.id);
                    });
                    actionsWrap.appendChild(locateBtn);
                }

                row.appendChild(actionsWrap);
            }
        } else {
            const actionsWrap = document.createElement("div");
            actionsWrap.className = "xlc-row-action-wrap";
            actionsWrap.style.cssText = "display:flex; align-items:center; gap:4px;";

            if (this.miniMode || this.lastQueryText.trim().length > 0) {
                const insertBtn = document.createElement("button");
                insertBtn.type = "button";
                insertBtn.className = "b3-button b3-button--small xlc-row-action xlc-row-action--pill xlc-row-action--primary";
                insertBtn.dataset.xlcControl = "item.insert-common";
                insertBtn.textContent = this.mobilePrimaryIsCopy() ? this.deps.t("copy") : "↵ 插入";
                insertBtn.title = this.mobilePrimaryIsCopy() ? this.deps.t("insertMobileActionHint") : "将此常用语插入到当前光标处 (Enter)";
                insertBtn.setAttribute("aria-label", this.mobilePrimaryIsCopy() ? this.deps.t("copy") : "插入常用语");
                insertBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    void this.runPrimary(entry);
                });
                actionsWrap.appendChild(insertBtn);

                const copyBtn = document.createElement("button");
                copyBtn.type = "button";
                copyBtn.className = "b3-button b3-button--small xlc-row-action xlc-row-action--pill";
                copyBtn.dataset.xlcControl = "item.copy-common";
                copyBtn.textContent = "复制";
                copyBtn.title = "复制此常用语到剪贴板 (Ctrl+Enter)";
                copyBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const text = entry.content || entry.summary || entry.title || "";
                    void this.deps.copyText(text).then((ok) => {
                        if (ok) {
                            copyBtn.textContent = "✓ 已复制";
                            lvNotify.inline(copyBtn, "已复制");
                            setTimeout(() => { copyBtn.textContent = "复制"; }, 1400);
                        }
                    });
                });
                actionsWrap.appendChild(copyBtn);
            }

            const star = document.createElement("button");
            star.type = "button";
            star.className = "b3-button b3-button--small xlc-row-action";
            star.dataset.xlcControl = "item.favorite";
            star.textContent = fav ? "★" : "☆";
            star.setAttribute("aria-label", fav ? this.deps.t("unfavorite") : this.deps.t("favorite"));
            star.addEventListener("click", (e) => {
                e.stopPropagation();
                this.deps.toggleFavorite(entry.id);
                const isFav = this.deps.isFavorite(entry.id);
                star.textContent = isFav ? "★" : "☆";
                lvNotify.inline(star, isFav ? "已收藏" : "已取消收藏");
                void this.refreshPreservingPosition().then(() => this.restoreFocusToSearch());
            });
            actionsWrap.appendChild(star);

            // 常用语购物车暂存托盘按钮（仅桌面端展示，手机端隐藏 · CAND-019 / Mobile Spec v1）
            if (!this.deps.isMobile()) {
                const trayBtn = document.createElement("button");
                trayBtn.type = "button";
                trayBtn.className = "b3-button b3-button--small xlc-row-action xlc-row-action-tray";
                trayBtn.dataset.xlcControl = "item.add-tray";
                const inTray = this.pasteTrayItems.some((it) => it.id === entry.id);
                trayBtn.textContent = inTray ? "✓" : "🛒";
                trayBtn.title = inTray ? "已加入暂存托盘" : "加入暂存托盘 (Alt+A)";
                trayBtn.setAttribute("aria-label", trayBtn.title);
                trayBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    this.togglePasteTrayItem(entry);
                    const nowIn = this.pasteTrayItems.some((it) => it.id === entry.id);
                    trayBtn.textContent = nowIn ? "✓" : "🛒";
                    lvNotify.inline(trayBtn, nowIn ? "已暂存" : "已移出");
                });
                actionsWrap.appendChild(trayBtn);
            }
            row.appendChild(actionsWrap);
        }
        return row;
    }

    private renderList(list: HTMLElement): void {
        this.virtualListCleanup?.();
        this.virtualListCleanup = null;
        this.virtualEnsureIndex = null;
        list.innerHTML = "";
        // 空库态独占整宽（R431 截图实证）：空库下右预览栏无条目可预览，只剩大片灰白空白，
        // 与左侧 330px 空态卡片形成割裂。此时隐藏右栏让空态居中铺满。
        const bodyWrapEl = list.parentElement;
        if (bodyWrapEl) {
            const soloEmpty = this.results.length === 0 && this.providerRows.length === 0
                && this.emptyMessage === this.deps.t("emptyLibrary");
            bodyWrapEl.classList.toggle("xlc-body--solo", soloEmpty);
        }
        // 大空态（无结果且无提供方行；图标 + 主文案 + ? 语义找提示）
        if (this.results.length === 0 && this.providerRows.length === 0 && this.emptyMessage) {
            const empty = document.createElement("div");
            empty.className = "xlc-empty";
            empty.setAttribute("role", "status");
            empty.setAttribute("aria-live", "polite");
            empty.setAttribute("aria-label", "搜索结果为空提示");
            empty.addEventListener("keydown", (e: any) => {
                if (e.isComposing || e.keyCode === 229) return;
                if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                    const btns = Array.from(empty.querySelectorAll<HTMLButtonElement>("button.xlc-empty-action:not([disabled])"));
                    if (!btns.length) return;
                    const idx = btns.indexOf(document.activeElement as HTMLButtonElement);
                    if (idx === -1) return;
                    e.preventDefault();
                    e.stopPropagation();
                    const nextIdx = e.key === "ArrowRight" ? (idx + 1) % btns.length : (idx - 1 + btns.length) % btns.length;
                    btns[nextIdx]?.focus();
                    return;
                }
                if (e.key === "Home" || e.key === "End") {
                    const btns = Array.from(empty.querySelectorAll<HTMLButtonElement>("button.xlc-empty-action:not([disabled])"));
                    if (!btns.length) return;
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.key === "Home") btns[0]?.focus();
                    else btns[btns.length - 1]?.focus();
                }
            });
            const icon = document.createElement("div");
            icon.className = "xlc-empty-icon";
            if (typeof icon.setAttribute === "function") {
                icon.setAttribute("aria-hidden", "true");
            }
            icon.textContent = "✦";
            empty.appendChild(icon);
            const text = document.createElement("div");
            text.className = "xlc-empty-text";
            text.textContent = this.emptyMessage;
            empty.appendChild(text);
            if (this.accessIssueMessage) {
                const retry = document.createElement("button");
                retry.type = "button";
                retry.className = "b3-button xlc-btn-primary xlc-empty-action";
                retry.dataset.xlcControl = "access.retry";
                retry.textContent = this.deps.t("retry");
                retry.setAttribute("aria-label", this.deps.t("retry"));
                retry.addEventListener("click", () => {
                    this.accessIssueMessage = null;
                    this.emptyMessage = "";
                    const status = this.dialog?.element.querySelector<HTMLElement>(".xlc-status");
                    if (status) {
                        status.textContent = "";
                        status.classList.remove("xlc-status--error");
                        status.setAttribute("role", "status");
                    }
                    void this.refresh();
                });
                empty.appendChild(retry);
                list.appendChild(empty);
                return;
            }
            // 普通关键词无结果且 AI 已开启时，补充明确的语义搜索入口；
            // 不依赖空态主文案做分支，避免中英文文案相同导致空库/筛选态误显示 AI 提示。
            const queryText = this.lastQueryText.trim();
            if (queryText && !queryText.startsWith("?")) {
                const titleHint = document.createElement("div");
                titleHint.className = "xlc-empty-hint";
                titleHint.textContent = this.deps.t("emptyQueryHint");
                empty.appendChild(titleHint);
                if (this.deps.aiEnabled()) {
                    const hint = document.createElement("div");
                    hint.className = "xlc-empty-hint";
                    hint.textContent = this.deps.t("aiSemanticHint");
                    empty.appendChild(hint);
                }
            } else if (queryText.startsWith("?")) {
                const hint = document.createElement("div");
                hint.className = "xlc-empty-hint";
                hint.textContent = this.deps.t("semanticEmptyHint");
                empty.appendChild(hint);
            } else if (this.emptyMessage === this.deps.t("emptyFavorites")) {
                const hint = document.createElement("div");
                hint.className = "xlc-empty-hint";
                hint.textContent = this.deps.t("emptyFavoritesSub");
                empty.appendChild(hint);
            } else if (this.emptyMessage === this.deps.t("emptyLibrary")) {
                // 空库：声明去哪捕获 + 就地新建（首跑引导完成后的第一个落点）
                const hint = document.createElement("div");
                hint.className = "xlc-empty-hint";
                hint.textContent = this.deps.t("emptyLibrarySub");
                empty.appendChild(hint);

                // 行业开箱即用套件一秒直装（CAND-034 / TODO-FEAT-029）
                if (this.deps.importStarterPackDirect) {
                    const kitsBox = document.createElement("div");
                    kitsBox.className = "xlc-starter-kits-box";
                    kitsBox.dataset.xlcControl = "empty.starter-kits";

                    const kitsTitle = document.createElement("div");
                    kitsTitle.className = "xlc-starter-kits-title";
                    kitsTitle.textContent = "🚀 挑选场景专属预置库，一秒装载直接上手：";
                    kitsBox.appendChild(kitsTitle);

                    const kitsGrid = document.createElement("div");
                    kitsGrid.className = "xlc-starter-kits-grid";

                    for (const pack of STARTER_PACKS) {
                        const card = document.createElement("div");
                        card.className = "xlc-starter-kit-card";
                        card.dataset.xlcControl = `starter-kit.card.${pack.id}`;

                        const cardTop = document.createElement("div");
                        cardTop.className = "xlc-starter-kit-card-top";

                        const iconSpan = document.createElement("span");
                        iconSpan.className = "xlc-starter-kit-icon";
                        iconSpan.textContent = pack.icon;

                        const nameSpan = document.createElement("strong");
                        nameSpan.className = "xlc-starter-kit-name";
                        nameSpan.textContent = pack.name;

                        cardTop.append(iconSpan, nameSpan);

                        const tagLine = document.createElement("div");
                        tagLine.className = "xlc-starter-kit-tagline";
                        tagLine.textContent = pack.tagline;

                        const installBtn = document.createElement("button");
                        installBtn.type = "button";
                        installBtn.className = "b3-button b3-button--small xlc-btn-primary xlc-starter-kit-btn";
                        installBtn.dataset.xlcControl = `starter-kit.install.${pack.id}`;
                        installBtn.textContent = `＋ 装入 (${pack.itemCount}项)`;
                        installBtn.addEventListener("click", async () => {
                            installBtn.disabled = true;
                            installBtn.textContent = "⏳ 装入中...";
                            try {
                                const res = await this.deps.importStarterPackDirect!(pack.markdown);
                                if (res.ok) {
                                    this.deps.notify?.("info", `已成功装入「${pack.name}」共 ${res.count} 项常用语！`);
                                    void this.refresh();
                                } else {
                                    installBtn.disabled = false;
                                    installBtn.textContent = `＋ 装入 (${pack.itemCount}项)`;
                                    this.deps.notify?.("error", "装入失败，请稍后重试");
                                }
                            } catch {
                                installBtn.disabled = false;
                                installBtn.textContent = `＋ 装入 (${pack.itemCount}项)`;
                                this.deps.notify?.("error", "装入失败，请稍后重试");
                            }
                        });

                        card.append(cardTop, tagLine, installBtn);
                        kitsGrid.appendChild(card);
                    }

                    kitsBox.appendChild(kitsGrid);
                    empty.appendChild(kitsBox);
                }

                // 空库是新用户最常遇到的页面，保留一条随时可回看的使用路径。
                const guide = document.createElement("button");
                guide.type = "button";
                guide.className = "b3-button xlc-btn-ghost xlc-empty-action";
                guide.dataset.xlcAction = "help";
                guide.dataset.xlcControl = "empty.help";
                guide.textContent = "ⓘ " + this.deps.t("usageGuideBtn");
                guide.setAttribute("aria-label", this.deps.t("usageGuideBtn"));
                guide.addEventListener("click", () => this.openUsageGuide());
                empty.appendChild(guide);
            }
            if (this.emptyMessage === this.deps.t("emptyFiltered")) {
                const clear = document.createElement("button");
                clear.type = "button";
                clear.className = "b3-button xlc-btn-ghost xlc-empty-action";
                clear.dataset.xlcAction = "clear-filters";
                clear.dataset.xlcControl = "empty.clear-filters";
                clear.textContent = this.deps.t("clearFilters");
                clear.setAttribute("aria-label", this.deps.t("clearFilters"));
                clear.addEventListener("click", () => {
                    this.deps.setFilters({type: "", tag: "", category: ""});
                    this.dialog?.element.querySelectorAll<HTMLSelectElement>(".xlc-type-select, .xlc-tag-select, .xlc-category-select")
                        .forEach((select) => { select.value = ""; });
                    void this.refresh();
                });
                empty.appendChild(clear);
            }
            const query = this.lastQueryText.trim();
            if (this.currentScope === "all-notes" && /(?:in|path|book|box):/i.test(query)) {
                const clearScopeBtn = document.createElement("button");
                clearScopeBtn.type = "button";
                clearScopeBtn.className = "b3-button xlc-btn-primary xlc-empty-action";
                clearScopeBtn.textContent = "🔍 清除路径限定，在全库无限制搜索 (Alt+⌫)";
                clearScopeBtn.setAttribute("aria-label", "清除路径限定，在全库无限制搜索");
                clearScopeBtn.addEventListener("click", () => {
                    const input = this.dialog?.element.querySelector<HTMLInputElement>(".xlc-search-input");
                    if (input) {
                        input.value = query.replace(/(?:in|path|book|box):[^\s]+/gi, "").trim();
                        input.dispatchEvent(new Event("input", {bubbles: true}));
                        input.focus();
                    }
                });
                empty.appendChild(clearScopeBtn);
            }

            // 全库搜索无结果时的技巧提示（自愈引导）
            if (this.currentScope === "all-notes" && query) {
                const tips = document.createElement("div");
                tips.className = "xlc-empty-hint xlc-empty-omni-tips";
                tips.innerHTML = `
                    <div>• 尝试缩短关键词或改用拼音/首字母</div>
                    <div>• 支持 <code>type:code</code> 专门检索代码块</div>
                    <div>• 支持 <code>type:h</code> 专门检索大纲标题</div>
                    <div>• 支持 <code>in:目录名</code> 缩小检索范围</div>
                `;
                empty.appendChild(tips);
            }

            // 范围限制回退引导（ADR 0046 / T-0073）：
            // 若在收藏/最近等受限范围下搜索无结果，优先提供一键切换到全库范围搜索该词的推荐动作。
            const hasScopeLimitation = shouldShowScopeFallback(query, this.currentScope);
            if (hasScopeLimitation) {
                const scopeFallback = document.createElement("button");
                scopeFallback.type = "button";
                scopeFallback.className = "b3-button xlc-btn-primary xlc-empty-action";
                scopeFallback.dataset.xlcControl = "empty.scope-fallback";
                scopeFallback.dataset.xlcAction = "scope-all";
                const shortQ = formatScopeFallbackQuery(query);
                const label = this.deps.t("searchAllScopeAction", shortQ);
                scopeFallback.textContent = "⤢ " + label;
                scopeFallback.setAttribute("aria-label", label);
                scopeFallback.title = label;
                scopeFallback.addEventListener("click", () => {
                    this.currentScope = "all";
                    this.syncScopeChips();
                    void this.refresh().then(() => this.restoreFocusToSearch());
                });
                empty.appendChild(scopeFallback);
            }

            // 全域内容扩展引导（G12 / T-0123，小驴常用全域搜索终端）：
            // 当常用库中无匹配条目时，提供「在当前打开文档中检索」与「在全库笔记中检索」两大终端级直达入口。
            if (this.currentScope === "all" && query && shouldShowOmniSearchFallback(query, this.currentScope)) {
                if (this.deps.searchCurrentDoc) {
                    const currentDocBtn = document.createElement("button");
                    currentDocBtn.type = "button";
                    currentDocBtn.className = "b3-button xlc-btn-primary xlc-empty-action";
                    currentDocBtn.dataset.xlcControl = "empty.omni-current-doc";
                    const shortQ = formatScopeFallbackQuery(query);
                    const label = this.deps.t("searchCurrentDocAction", shortQ);
                    currentDocBtn.textContent = "☵ " + label;
                    currentDocBtn.setAttribute("aria-label", label);
                    currentDocBtn.title = label;
                    currentDocBtn.addEventListener("click", () => {
                        this.currentScope = "current-doc";
                        this.syncScopeChips();
                        void this.refresh().then(() => this.restoreFocusToSearch());
                    });
                    empty.appendChild(currentDocBtn);
                }

                if (this.deps.searchAllNotes) {
                    const allNotesBtn = document.createElement("button");
                    allNotesBtn.type = "button";
                    allNotesBtn.className = "b3-button xlc-btn-primary xlc-empty-action";
                    allNotesBtn.dataset.xlcControl = "empty.omni-all-notes";
                    const shortQ = formatScopeFallbackQuery(query);
                    const label = this.deps.t("searchAllNotesAction", shortQ);
                    allNotesBtn.textContent = "🔍 " + label;
                    allNotesBtn.setAttribute("aria-label", label);
                    allNotesBtn.title = label;
                    allNotesBtn.addEventListener("click", () => {
                        this.currentScope = "all-notes";
                        this.syncScopeChips();
                        void this.refresh().then(() => this.restoreFocusToSearch());
                    });
                    empty.appendChild(allNotesBtn);
                }
            }

            if (this.compactBundleCandidate && this.deps.importBundleText) {
                const candidate = this.compactBundleCandidate;
                const importBtn = document.createElement("button");
                importBtn.type = "button";
                importBtn.className = "b3-button xlc-btn-primary xlc-empty-action";
                importBtn.dataset.xlcControl = "empty.import-compact-bundle";
                const label = this.deps.t("detectedCompactBundle", String(candidate.items.length));
                importBtn.textContent = label;
                importBtn.setAttribute("aria-label", label);
                importBtn.addEventListener("click", async () => {
                    importBtn.disabled = true;
                    importBtn.textContent = this.deps.t("loading");
                    try {
                        await this.deps.importBundleText!(this.lastQueryText);
                        this.deps.notify?.("info", this.deps.t("importCompactBundleDone"));
                        this.dialog?.element.querySelector<HTMLInputElement>(".xlc-search-input")?.focus();
                    } catch (err) {
                        this.deps.notify?.("error", toErrorMessage(err));
                        importBtn.disabled = false;
                    }
                });
                empty.appendChild(importBtn);
            }

            // 搜索无命中时同样提供下一步，避免用户只能返回其他入口再新建。
            // 空库分支沿用既有按钮；收藏/最近空态不显示，防止动作与当前范围语义冲突。
            if (this.emptyMessage === this.deps.t("emptyLibrary")
                || this.emptyMessage === this.deps.t("emptyFiltered")
                || query) {
                const create = document.createElement("button");
                create.type = "button";
                create.className = "b3-button " + (hasScopeLimitation ? "xlc-btn-ghost" : "xlc-btn-primary") + " xlc-empty-action";
                create.dataset.xlcAction = "new-item";
                create.dataset.xlcControl = "empty.new-item";
                const fullTitleCandidate = query && !query.startsWith("?") ? query.slice(0, 120) : "";
                const buttonTitle = fullTitleCandidate.length > 24
                    ? `${fullTitleCandidate.slice(0, 24)}…`
                    : fullTitleCandidate;
                create.textContent = buttonTitle
                    ? this.deps.t("newItemActionWithQuery", buttonTitle)
                    : this.deps.t("newItemAction");
                const accessibleLabel = fullTitleCandidate
                    ? this.deps.t("newItemWithTitle", fullTitleCandidate)
                    : this.deps.t("newItemAction");
                create.setAttribute("aria-label", accessibleLabel);
                create.title = accessibleLabel;
                create.addEventListener("click", () => {
                    this.deps.newItem(fullTitleCandidate || undefined);
                });
                empty.appendChild(create);
            }
            list.appendChild(empty);
        }
        // 分组头（F4 完整形态，原型屏 1）：浏览态（全部范围 + 非标题排序）按
        // 「置顶(manual) → 分类(α) → 无分类」分区展示；搜索结果同样分组（原型屏 1 同款）。
        // 分组 = 对 this.results 重排到展示序（仅展示副本，不动索引/真源），键盘/Alt+N 线性导航不变。
        const grouping = this.currentScope === "all" && this.deps.getSort() !== "title";
        const groupLabels: Array<{label: string; count: number}> = [];
        if (grouping && this.results.length > 0) {
            const isManual = this.deps.getSort() === "manual";
            const favs: SearchEntry[] = [];
            const rest: SearchEntry[] = [];
            for (const e of this.results) {
                // 只有手动排序才把收藏单独置顶；其他排序仍把收藏放回分类桶。
                if (isManual && e && this.deps.isFavorite(e.id)) favs.push(e);
                else rest.push(e);
            }
            const byCat = new Map<string, SearchEntry[]>();
            const uncategorized: SearchEntry[] = [];
            for (const e of rest) {
                const cat = e?.category ?? "";
                if (!cat) {
                    uncategorized.push(e);
                    continue;
                }
                const bucket = byCat.get(cat) ?? [];
                bucket.push(e);
                byCat.set(cat, bucket);
            }
            const catKeys = Array.from(byCat.keys()).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
            const ordered: SearchEntry[] = [];
            if (isManual && favs.length > 0) {
                groupLabels.push({label: "★ " + this.deps.t("groupFavorites"), count: favs.length});
                ordered.push(...favs);
            }
            for (const key of catKeys) {
                const bucket = byCat.get(key) ?? [];
                groupLabels.push({label: key, count: bucket.length});
                ordered.push(...bucket);
            }
            if (uncategorized.length > 0) {
                groupLabels.push({label: this.deps.t("groupUncategorized"), count: uncategorized.length});
                ordered.push(...uncategorized);
            }
            if (groupLabels.length > 1) {
                this.results = ordered;
            } else {
                groupLabels.length = 0;
            }
        }
        let headCursor = -1;
        const headStarts: number[] = [];
        let groupAcc = 0;
        for (const g of groupLabels) {
            headStarts.push(groupAcc);
            groupAcc += g.count;
        }
        const placeGroupHead = (label: string, count: number): void => {
            const head = document.createElement("div");
            head.className = "xlc-group-head";
            head.dataset.xlcHead = "1";
            head.setAttribute("aria-hidden", "true");
            head.textContent = `${label} · ${count}`;
            list.appendChild(head);
        };
        // 查询结果超过阈值时启用固定行高的窗口渲染；分组/提供方仍保留完整 DOM，避免改变其语义顺序。
        const canVirtualize = this.results.length > CommonSearchDialog.VIRTUAL_THRESHOLD
            && groupLabels.length === 0
            && this.providerRows.length === 0;
        if (canVirtualize) {
            const rowHeight = this.deps.isMobile() ? 64 : CommonSearchDialog.VIRTUAL_ROW_HEIGHT;
            const overscan = CommonSearchDialog.VIRTUAL_OVERSCAN;
            const topSpacer = document.createElement("div");
            topSpacer.dataset.xlcSpacer = "top";
            const bottomSpacer = document.createElement("div");
            bottomSpacer.dataset.xlcSpacer = "bottom";
            const renderWindow = (requestedIndex?: number): void => {
                const viewport = Math.max(list.clientHeight || 480, rowHeight * 6);
                let start: number;
                let end: number;
                if (requestedIndex === undefined) {
                    const win = calculateVirtualScrollWindow(this.results.length, list.scrollTop, rowHeight, viewport, overscan);
                    start = win.startIndex;
                    end = win.endIndex;
                } else {
                    const visible = Math.ceil(viewport / rowHeight);
                    const rawStart = Math.max(0, requestedIndex - overscan);
                    start = Math.max(0, Math.min(rawStart, this.results.length - 1));
                    end = Math.min(this.results.length, start + visible + overscan * 2);
                }
                topSpacer.style.height = `${start * rowHeight}px`;
                bottomSpacer.style.height = `${Math.max(0, (this.results.length - end) * rowHeight)}px`;
                list.replaceChildren(topSpacer);
                for (let i = start; i < end; i++) {
                    const entry = this.results[i];
                    if (entry) list.appendChild(this.createEntryRow(entry, i));
                }
                list.appendChild(bottomSpacer);
                // 虚拟列表触底分割线（CAND-003 / TODO-FEAT-003）
                if (this.results.length >= 50 && end >= this.results.length) {
                    const bottomDivider = document.createElement("div");
                    bottomDivider.className = "xlc-list-end-divider";
                    bottomDivider.dataset.xlcControl = "search.list-end";
                    bottomDivider.innerHTML = `<span class="xlc-end-mark" aria-hidden="true">✓</span> <span>已加载全部 ${this.results.length} 项常用语</span>`;
                    list.appendChild(bottomDivider);
                }
                this.paintActive();
                // 实时更新底栏可视区间（如 [1-12 / 86]）
                const countEl = this.dialog?.element.querySelector<HTMLElement>(".xlc-footer-count");
                if (countEl && !this.deps.isMobile() && this.results.length >= 50) {
                    const base = countEl.dataset.baseText || countEl.textContent || "";
                    if (!countEl.dataset.baseText) countEl.dataset.baseText = base;
                    const cleanBase = countEl.dataset.baseText.replace(/\s*·\s*\[\d+-\d+\s*\/\s*\d+\]/, "");
                    countEl.textContent = `${cleanBase} · [${start + 1}-${end} / ${this.results.length}]`;
                }
            };
            let rafId: number | null = null;
            const scheduleRender = (): void => {
                if (rafId !== null) return;
                const raf = typeof requestAnimationFrame === "function"
                    ? requestAnimationFrame
                    : (cb: FrameRequestCallback) => setTimeout(cb, 16) as unknown as number;
                rafId = raf(() => {
                    rafId = null;
                    renderWindow();
                });
            };
            const onScroll = (): void => scheduleRender();
            list.classList.add("xlc-list--virtual");
            list.addEventListener("scroll", onScroll, {passive: true});
            this.virtualListCleanup = () => {
                if (rafId !== null) {
                    const caf = typeof cancelAnimationFrame === "function"
                        ? cancelAnimationFrame
                        : (id: number) => clearTimeout(id);
                    caf(rafId);
                    rafId = null;
                }
                list.removeEventListener("scroll", onScroll);
                list.classList.remove("xlc-list--virtual");
            };
            this.virtualEnsureIndex = (index: number) => {
                if (rafId !== null) {
                    const caf = typeof cancelAnimationFrame === "function"
                        ? cancelAnimationFrame
                        : (id: number) => clearTimeout(id);
                    caf(rafId);
                    rafId = null;
                }
                renderWindow(index);
            };
            renderWindow();
        } else {
            let commonHeaderPlaced = false;
            let omniHeaderPlaced = false;
            let lastClipTimeGroup: "today" | "yesterday" | "earlier" | null = null;
            const hasCommon = this.results.some((r) => !r.isOmni);
            const hasOmni = this.results.some((r) => r.isOmni);

            // 当前文档上下文智能感知推荐（CAND-031 / TODO-FEAT-026）
            if (this.currentScope === "all" && !this.lastQueryText && groupLabels.length === 0 && this.deps.getDocumentContext) {
                const docCtx = this.deps.getDocumentContext();
                const recs = getRecommendedEntries(this.results, docCtx, 3);
                if (recs.length > 0) {
                    const recHead = document.createElement("div");
                    recHead.className = "xlc-group-head xlc-group-head--recommend";
                    recHead.dataset.xlcControl = "search.recommend-head";
                    recHead.textContent = `🎯 当前文档智能推荐 (${recs.length})`;
                    list.appendChild(recHead);
                    for (const r of recs) {
                        const recRow = this.createEntryRow(r.entry, -1);
                        recRow.classList.add("xlc-row--recommend");
                        if (r.reasons.length > 0) {
                            const reasonSpan = document.createElement("span");
                            reasonSpan.className = "xlc-recommend-reason";
                            reasonSpan.textContent = r.reasons[0]!;
                            recRow.querySelector(".xlc-row-title")?.appendChild(reasonSpan);
                        }
                        list.appendChild(recRow);
                    }
                }
            }

            const totalCount = this.results.length;
            const renderCount = this.deps.isMobile() ? Math.min(totalCount, 50) : totalCount;
            for (let i = 0; i < renderCount; i++) {
                while (headCursor + 1 < groupLabels.length && i === headStarts[headCursor + 1]) {
                    headCursor++;
                    const head = groupLabels[headCursor];
                    if (head) placeGroupHead(head.label, head.count);
                }
                const entry = this.results[i];
                if (this.currentScope === "clipboard" && entry?.createdAt && groupLabels.length === 0) {
                    const tg = getClipboardTimeGroup(entry.createdAt);
                    if (tg !== lastClipTimeGroup) {
                        lastClipTimeGroup = tg;
                        const timeHead = document.createElement("div");
                        timeHead.className = `xlc-group-head xlc-clipboard-time-head xlc-clipboard-time-head--${tg}`;
                        timeHead.dataset.xlcControl = "search.clipboard.time-head";
                        timeHead.dataset.timeGroup = tg;
                        timeHead.setAttribute("aria-hidden", "true");
                        const icon = tg === "today" ? "📌" : tg === "yesterday" ? "⏱️" : "📅";
                        const title = tg === "today" ? "今天" : tg === "yesterday" ? "昨天" : "更早";
                        timeHead.textContent = `${icon} ${title}`;
                        list.appendChild(timeHead);
                    }
                }
                if (entry && !entry.isOmni && !commonHeaderPlaced && hasCommon && hasOmni && groupLabels.length === 0) {
                    commonHeaderPlaced = true;
                    const cHead = document.createElement("div");
                    cHead.className = "xlc-group-head xlc-group-head--common";
                    const commonCount = this.results.filter((r) => !r.isOmni).length;
                    const cLabel = document.createElement("span");
                    cLabel.textContent = `📌 常用语资产 (${commonCount})`;
                    const cTip = document.createElement("span");
                    cTip.className = "xlc-group-head-tip";
                    cTip.textContent = "点击直接插入 · 右侧可复制";
                    cHead.append(cLabel, cTip);
                    list.appendChild(cHead);
                }
                if (entry && entry.isOmni && !omniHeaderPlaced) {
                    omniHeaderPlaced = true;
                    const omniHead = document.createElement("div");
                    omniHead.className = "xlc-group-head xlc-group-head--omni";
                    const omniCount = this.results.filter((r) => r.isOmni).length;
                    const oLabel = document.createElement("span");
                    oLabel.textContent = `🔍 思源全库匹配内容块 (${omniCount})`;
                    const oTip = document.createElement("span");
                    oTip.className = "xlc-group-head-tip";
                    oTip.textContent = "点击直接插入 · 点右侧「复制 / 存常用 / 原文」";
                    omniHead.append(oLabel, oTip);
                    list.appendChild(omniHead);
                }
                if (entry) list.appendChild(this.createEntryRow(entry, i));
            }
            if (this.deps.isMobile() && totalCount > 50) {
                const limitNotice = document.createElement("div");
                limitNotice.className = "xlc-list-end-divider";
                limitNotice.dataset.xlcControl = "search.mobile.limit-notice";
                const noticeSpan = document.createElement("span");
                noticeSpan.textContent = `已显示前 50 条高频结果（共 ${totalCount} 条），输入关键词可精准查找`;
                limitNotice.appendChild(noticeSpan);
                list.appendChild(limitNotice);
            }
        }
        // 提供方分区（pv: 虚拟行；点击弹小菜单=插入/复制 payload；不进键盘导航）
        if (this.providerRows.length > 0) {
            const header = document.createElement("div");
            header.className = "xlc-provider-header";
            header.dataset.xlcHead = "1";
            header.setAttribute("aria-hidden", "true");
            header.textContent = "✦ " + this.deps.t("providerSection") + " · " + this.providerRows.length;
            list.appendChild(header);
            for (const row of this.providerRows) {
                const el = document.createElement("div");
                el.className = "xlc-row xlc-row--provider";
                el.dataset.xlcVirtualId = row.virtualId;
                el.id = `xlc-provider-${this.providerRows.indexOf(row)}`;
                el.setAttribute("role", "listitem");
                el.setAttribute("aria-current", "false");
                const main = document.createElement("div");
                main.className = "xlc-row-main";
                const title = document.createElement("div");
                title.className = "xlc-row-title";
                const badge = document.createElement("span");
                badge.className = "xlc-badge xlc-badge--ai";
                // 长提供方名截断留省略号 + 悬停全名（R139）
                badge.textContent = row.providerName.length > 12 ? row.providerName.slice(0, 12) + "…" : row.providerName;
                badge.title = row.providerName;
                title.appendChild(badge);
                const titleText = document.createElement("span");
                titleText.className = "xlc-row-titletext";
                titleText.textContent = row.title || row.payload.slice(0, 40);
                title.appendChild(titleText);
                main.appendChild(title);
                const meta = document.createElement("div");
                meta.className = "xlc-row-meta";
                meta.textContent = row.payload.slice(0, 120);
                main.appendChild(meta);
                el.appendChild(main);
                el.addEventListener("click", () => void this.showProviderMenu(row, el));
                el.addEventListener("contextmenu", (e) => {
                    e.preventDefault();
                    void this.showProviderMenu(row, el);
                });
                list.appendChild(el);
            }
        }
        this.paintActive();
        this.syncPaneActions();
    }

    /** 预览区动作随当前选中行同步；键盘切换/来源预检也必须更新按钮状态。 */
    private syncPaneActions(): void {
        const actionable = this.results.length > 0;
        const scope = this.dialog?.element ?? document;
        const targetBanner = scope.querySelector<HTMLElement>(".xlc-target-banner");
        if (targetBanner && !this.insertTarget) {
            const hasEditor = this.deps.hasActiveEditor?.() ?? true;
            const hasTarget = this.deps.hasInsertTarget?.() ?? hasEditor;
            const fallbackKey = this.deps.isMobile()
                ? "insertMobileActionHint"
                : hasTarget ? "insertCurrentEditorBanner" : hasEditor ? "insertTargetUnavailableBanner" : "insertNoEditorBanner";
            targetBanner.textContent = "⤓ " + this.deps.t(fallbackKey);
            targetBanner.setAttribute("aria-label", this.deps.t(fallbackKey));
        }
        scope.querySelectorAll<HTMLButtonElement>(".xlc-pane-foot .b3-button")
            .forEach((btn) => {
                if (this.activeProvider >= 0) {
                    const act = btn.dataset.xlcPaneAct ?? "";
                    btn.disabled = this.primaryBusy || !(act === "insert" || act === "copy");
                    return;
                }
                const entry = this.results[this.activeIndex];
                const act = btn.dataset.xlcPaneAct ?? "";
                const isOmniScope = this.currentScope === "current-doc" || this.currentScope === "all-notes" || this.currentScope === "clipboard";
                const isClipEntry = Boolean(entry && entry.id.startsWith("xlc-clip-"));
                const unavailable = !entry
                    || (act === "ai" && !this.deps.aiEnabled())
                    || (act === "source" && (isOmniScope ? !this.deps.openDocBlock : this.deps.isSourceMissing(entry)))
                    || (act === "edit" && isOmniScope && !this.deps.quickEditBlock);
                const showOmniSave = act === "save-omni" && isOmniScope && Boolean(this.deps.createFromOmni);
                const showOmniEditCapture = act === "edit-and-capture-omni" && isOmniScope && Boolean(this.deps.captureOmniWithForm);
                const isClipScope = this.currentScope === "clipboard" || isClipEntry;
                if (act === "clean-clip") {
                    btn.style.display = isClipEntry ? "" : "none";
                } else if (act === "save-omni") {
                    btn.style.display = showOmniSave ? "" : "none";
                } else if (act === "edit-and-capture-omni") {
                    btn.style.display = showOmniEditCapture ? "" : "none";
                } else if (isOmniScope && (act === "embed" || act === "ref" || act === "ai")) {
                    // 全域/剪贴板范围底栏优先展示定位、快编与收录按钮，避免 9 个按钮同排挤出视口
                    btn.style.display = "none";
                } else if (isClipScope && (act === "source" || act === "edit")) {
                    // 剪贴板侧车暂存项无物理思源块与源文档，不显示「在文档中定位 / 就地修改块内容」
                    btn.style.display = "none";
                } else {
                    btn.style.display = "";
                }
                if (act === "save-omni") {
                    const isCaptured = entry ? this.capturedOmniIds.has(entry.id) : false;
                    const isClip = Boolean(entry && entry.id.startsWith("xlc-clip-"));
                    const label = isClip ? (this.deps.t("promoteToCommon") || "沉淀为常用语") : this.deps.t("saveToCommon");
                    const icon = isClip ? "⭐ " : "✦ ";
                    btn.textContent = isCaptured ? "✓ 已" + label : icon + label + " (Alt+S)";
                    btn.disabled = isCaptured;
                }
                if (act === "edit-and-capture-omni") {
                    const isClip = Boolean(entry && entry.id.startsWith("xlc-clip-"));
                    btn.textContent = isClip ? "✎ " + (this.deps.t("editAndPromote") || "编辑后沉淀为常用语") : "✎ " + this.deps.t("editAndCapture");
                }
                if (act === "edit") {
                    btn.textContent = (isOmniScope && this.deps.quickEditBlock) ? "✎ " + this.deps.t("quickEditBlock") : this.deps.t("edit");
                }
                if (act === "source") {
                    btn.textContent = isOmniScope ? "↗ " + this.deps.t("locateInDoc") : this.deps.t("openSource");
                }
                btn.disabled = !actionable || unavailable || this.primaryBusy || this.varFormOpen;
                btn.removeAttribute("title");
                if (act === "ai" && !this.deps.aiEnabled()) btn.title = this.deps.t("aiDisabled");
                if (act === "source" && entry && this.deps.isSourceMissing(entry)) btn.title = this.deps.t("sourceGone");
            });
        const insertBtn = scope.querySelector<HTMLButtonElement>('[data-xlc-pane-act="insert"]');
        if (insertBtn) {
            const copyFallback = this.activeProvider >= 0
                ? !this.insertTarget && (this.deps.isMobile() || !(this.deps.hasInsertTarget?.() ?? this.deps.hasActiveEditor?.() ?? true))
                : this.mobilePrimaryIsCopy() || (!this.insertTarget && !(this.deps.hasInsertTarget?.() ?? this.deps.hasActiveEditor?.() ?? true));
            insertBtn.textContent = copyFallback ? this.deps.t("copy") : this.deps.t("insert");
            const hint = this.deps.isMobile() && !this.insertTarget
                ? this.deps.t("insertMobileActionHint")
                : !this.insertTarget && !(this.deps.hasInsertTarget?.() ?? this.deps.hasActiveEditor?.() ?? true)
                    ? this.deps.t((this.deps.hasActiveEditor?.() ?? true) ? "insertTargetUnavailableBanner" : "insertNoEditorBanner")
                    : "";
            insertBtn.title = hint;
            if (hint) insertBtn.setAttribute("aria-label", hint);
            else insertBtn.removeAttribute("aria-label");
            insertBtn.setAttribute("aria-busy", this.primaryBusy ? "true" : "false");
        }
        const mobileInsert = scope.querySelector<HTMLButtonElement>(".xlc-mobile-foot .xlc-btn-primary");
        if (mobileInsert) {
            mobileInsert.disabled = !actionable || this.primaryBusy || this.varFormOpen;
            mobileInsert.textContent = this.deps.t(this.mobilePrimaryIsCopy() ? "copy" : "quickInsertSelected");
            const hint = this.mobilePrimaryIsCopy() ? this.deps.t("insertMobileActionHint") : "";
            mobileInsert.title = hint;
            if (hint) mobileInsert.setAttribute("aria-label", hint);
            else mobileInsert.removeAttribute("aria-label");
            mobileInsert.setAttribute("aria-busy", this.primaryBusy ? "true" : "false");
        }
    }

    private mobilePrimaryIsCopy(): boolean {
        // R432 门禁实证：移动端带插入目标时标签曾显示「插入选中」而点击行为仍是复制
        // ——标签与行为不一致。移动端插入尚未在真实宿主验收（R430 决策：一律诚实降级），
        // 故移动端主操作恒为复制并携带降级提示。
        return this.deps.isMobile();
    }

    private async showProviderMenu(row: ProviderRow, anchor: HTMLElement): Promise<void> {
        this.menuDismiss?.();
        this.menuDismiss = null;
        const menu = document.createElement("div");
        menu.className = "xlc-menu";
        menu.setAttribute("role", "menu");
        menu.setAttribute("aria-label", row.providerName + " · " + this.deps.t("providerSection"));
        const lbl = document.createElement("div");
        lbl.className = "xlc-menu-lbl";
        lbl.textContent = row.providerName + " · " + this.deps.t("providerSection");
        menu.appendChild(lbl);
        const sec = document.createElement("div");
        sec.className = "xlc-menu-sec";
        sec.appendChild(this.menuButton("＋", this.deps.t("providerInsert"), "xlc-menu-item", async () => {
            const execution = this.deps.insertProviderPayload(row.payload, this.insertTarget ?? undefined);
            this.destroy();
            await execution;
        }));
        sec.appendChild(this.menuButton("⧉", this.deps.t("providerCopy"), "xlc-menu-item", async () => {
            this.destroy();
            await this.deps.copyProviderPayload(row.payload);
        }));
        menu.appendChild(sec);
        // 菜单挂在 .xlc-dialog 内（样式作用域 + 相对弹窗定位）；无弹窗时兜底 anchor
        const host = (this.dialog?.element.querySelector(".xlc-dialog")) ?? this.dialog?.element ?? anchor;
        host.appendChild(menu);
        const dismiss = (e: Event) => {
            if (!menu.contains(e.target as Node)) {
                menu.remove();
                if (this.menuDismiss === dismissMenu) this.menuDismiss = null;
                document.removeEventListener("pointerdown", dismiss, true);
                this.restoreFocusToSearch();
            }
        };
        const dismissMenu = (): void => {
            menu.remove();
            document.removeEventListener("pointerdown", dismiss, true);
        };
        this.menuDismiss = dismissMenu;
        document.addEventListener("pointerdown", dismiss, true);
        // Esc 关闭提供方菜单（隔离宿主全局 Esc，防整弹窗连带关闭；R112）
        menu.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                menu.remove();
                if (this.menuDismiss === dismissMenu) this.menuDismiss = null;
                document.removeEventListener("pointerdown", dismiss, true);
                this.restoreFocusToSearch();
            }
        });
        menu.querySelector<HTMLElement>(".xlc-menu-item")?.focus();
    }

    /** 外部变更（动作菜单内删除/建副本等）后的列表同步入口（R138/R390：输入中与组词中防冲刷覆盖）。 */
    public refreshAfterExternalChange(): void {
        if (this.isComposing || this.inputDebounce !== null) {
            // 用户正在打字或中文组词输入中，延迟到输入稳定后再执行差量同步，防丢失用户心流
            return;
        }
        void this.refreshPreservingPosition();
    }

    /** 思源文档页签切换后的上下文联动：同步插入目标横幅，若处于「当前文档」范围则自动刷新当前文档块列表。 */
    public syncActiveContextAfterTabSwitch(): void {
        this.syncPaneActions();
        if (this.currentScope === "current-doc" && !this.isComposing) {
            if (this.inputDebounce) {
                clearTimeout(this.inputDebounce);
                this.inputDebounce = null;
            }
            void this.refresh();
        }
    }

    /** 鉴权/权限错误由统一内核处理器调用；旧列表失效后保留查询条件并提供显式重试。 */
    public showKernelAccessIssue(kind: "auth" | "permission", message: string): void {
        ++this.searchSeq;
        ++this.previewSeq;
        if (this.inputDebounce) clearTimeout(this.inputDebounce);
        this.inputDebounce = null;
        this.accessIssueMessage = message;
        this.emptyMessage = message;
        this.results = [];
        this.providerRows = [];
        this.activeIndex = 0;
        this.activeProvider = -1;
        this.lastPreviewId = null;

        const status = this.dialog?.element.querySelector<HTMLElement>(".xlc-status");
        if (status) {
            status.textContent = this.deps.t(kind === "auth" ? "kernelAuthStatus" : "kernelPermissionStatus");
            status.classList.add("xlc-status--error");
            status.setAttribute("role", "alert");
        }
        const list = this.dialog?.element.querySelector<HTMLElement>(".xlc-list");
        if (list) {
            list.classList.remove("xlc-list--loading");
            list.setAttribute("aria-busy", "false");
            this.renderList(list);
        }
        const count = this.dialog?.element.querySelector<HTMLElement>(".xlc-footer-count");
        if (count) count.textContent = "";
        this.updatePreview();
        // keep kind in the API so UI variants may differentiate auth recovery from permission recovery.
        this.dialog?.element.setAttribute("data-xlc-access-issue", kind);
    }

    private async refreshPreservingPosition(): Promise<void> {
        const list = this.dialog?.element.querySelector<HTMLElement>(".xlc-list");
        const scrollTop = list?.scrollTop ?? 0;
        const selectedId = this.results[this.activeIndex]?.id;
        await this.refreshFilterOptions();
        await this.refresh();
        if (selectedId) {
            const next = this.results.findIndex((entry) => entry.id === selectedId);
            if (next >= 0 && next !== this.activeIndex) {
                this.activeIndex = next;
                if (list) this.renderList(list);
                this.updatePreview();
            }
        }
        if (list) {
            list.scrollTop = scrollTop;
        }
    }

    /** 统一导航位：0..results.length-1 为库条目，之后为提供方行 */
    private setNav(pos: number): void {
        if (pos < this.results.length) {
            this.activeIndex = pos;
            this.activeProvider = -1;
        } else {
            this.activeIndex = Math.max(Math.min(pos, Math.max(this.results.length - 1, 0)), 0);
            this.activeProvider = pos - this.results.length;
        }
    }

    private navPosition(): number {
        return this.activeProvider >= 0 ? this.results.length + this.activeProvider : this.activeIndex;
    }

    private paintActive(): void {
        const list = this.dialog?.element.querySelector<HTMLElement>(".xlc-list");
        if (!list) return;
        // 分组头不参与导航（F4-lite）：只遍历真实行
        const rows = Array.from(list.children).filter((el) => {
            const node = el as HTMLElement;
            return !node.dataset.xlcHead && !node.dataset.xlcSpacer;
        }) as HTMLElement[];
        // 键盘移动到窗口外的条目时先把它带入窗口，再重新绘制活动态。
        if (this.activeProvider < 0 && !rows.some((row) => row.dataset.xlcIndex === String(this.activeIndex))) {
            this.virtualEnsureIndex?.(this.activeIndex);
            return;
        }
        rows.forEach((child) => {
            // 虚拟窗口中的 rows 只是当前可见片段，不能用局部数组序号匹配全局 activeIndex。
            // 提供方行没有 data-xlc-index，使用稳定的 provider id 单独匹配。
            const resultIndex = child.dataset.xlcIndex;
            const active = resultIndex !== undefined
                ? this.activeProvider < 0 && Number(resultIndex) === this.activeIndex
                : this.activeProvider >= 0 && child.id === `xlc-provider-${this.activeProvider}`;
            child.classList.toggle("xlc-row--active", active);
            child.setAttribute("aria-current", active ? "true" : "false");
        });
        const active = this.activeProvider >= 0
            ? rows.find((row) => row.id === `xlc-provider-${this.activeProvider}`)
            : rows.find((row) => row.dataset.xlcIndex === String(this.activeIndex));
        const input = this.dialog?.element.querySelector<HTMLInputElement>(".xlc-search-input");
        if (active?.id) input?.setAttribute("aria-activedescendant", active.id);
        else input?.removeAttribute("aria-activedescendant");
        active?.scrollIntoView({block: "nearest"});
    }

    private schedulePreview(entry: SearchEntry): void {
        this.updatePreview(entry.id);
    }

    /** 变量提示行：从预览文本解析 ask 字段、嵌套片段与光标标记并列出语法 chip（code/提供方行不展示）。 */
    private paintPaneVars(text: string | null, itemType: ItemType | "provider" | undefined): void {
        const paneVars = this.dialog?.element.querySelector<HTMLElement>(".xlc-pane-vars");
        if (!paneVars) return;
        const hasCursor = Boolean(text && hasCursorToken(text));
        const isNormalTemplate = Boolean(itemType && itemType !== "code" && itemType !== "provider" && text);
        const fields = isNormalTemplate && text ? listAskFields(text) : [];
        const snippets = isNormalTemplate && text ? listSnippetRefs(text) : [];
        paneVars.textContent = "";
        if (fields.length === 0 && snippets.length === 0 && !hasCursor) {
            paneVars.style.display = "none";
            return;
        }
        if (fields.length > 0) {
            const label = document.createElement("span");
            label.textContent = this.deps.t("paneVarsLabel", String(fields.length));
            paneVars.appendChild(label);
            for (const field of fields) {
                const chip = document.createElement("code");
                chip.textContent = askFieldTag(field);
                paneVars.appendChild(chip);
            }
        }
        if (snippets.length > 0) {
            const sep = fields.length > 0 ? " · " : "";
            const label = document.createElement("span");
            label.textContent = sep + this.deps.t("paneSnippetsLabel", String(snippets.length));
            paneVars.appendChild(label);
            for (const snippetTitle of snippets) {
                const chip = document.createElement("code");
                chip.dataset.xlcControl = "preview.snippet-tag";
                chip.textContent = `{{xlc:snippet:${snippetTitle}}}`;
                paneVars.appendChild(chip);
            }
        }
        // 光标落点提示（原型屏 1：内容含 {{xlc:cursor}} 时附带说明）
        if (hasCursor) {
            const sep = document.createElement("span");
            sep.textContent = (fields.length > 0 || snippets.length > 0 ? " · " : "") + this.deps.t("cursorHint");
            paneVars.appendChild(sep);
            const chip = document.createElement("code");
            chip.textContent = "{{xlc:cursor}}";
            paneVars.appendChild(chip);
        }
        if (text && text.trim().length > 0) {
            const metrics = calculateTextMetrics(text);
            if (metrics.nonWhitespaceChars > 0) {
                const readingSpan = document.createElement("span");
                readingSpan.className = "xlc-pane-reading-metrics";
                readingSpan.dataset.xlcControl = "preview.reading-metrics";
                if (typeof readingSpan.setAttribute === "function") {
                    readingSpan.setAttribute("role", "status");
                    readingSpan.setAttribute("aria-label", `阅读度量：${formatReadingMetrics(metrics)}`);
                }
                readingSpan.textContent = (fields.length > 0 || snippets.length > 0 || hasCursor ? " · " : "") + formatReadingMetrics(metrics);
                paneVars.appendChild(readingSpan);
            }
        }
        // 样式表默认 display:none，显示需显式内联覆盖
        paneVars.style.display = "flex";
    }

    /** 排序直选菜单（R108）：4 档可枚举、当前档 ✓，替代不可见的循环切换。 */
    private showSortMenu(paintSort: () => void): void {
        this.menuDismiss?.();
        this.menuDismiss = null;
        const modes = ["manual", "frecency", "frequent", "recent", "title"] as const;
        const current = this.deps.getSort();
        const menu = document.createElement("div");
        menu.className = "xlc-menu xlc-menu--compact";
        menu.setAttribute("role", "menu");
        menu.setAttribute("aria-label", this.deps.t("sort"));
        const lbl = document.createElement("div");
        lbl.className = "xlc-menu-lbl";
        lbl.textContent = this.deps.t("sort");
        menu.appendChild(lbl);
        const sec = document.createElement("div");
        sec.className = "xlc-menu-sec";
        for (const mode of modes) {
            const isSelected = mode === current;
            const option = this.menuButton(isSelected ? "✓" : " ", this.deps.t(`sort.${mode}`), "xlc-menu-item" + (isSelected ? " xlc-menu-item--on" : ""), async () => {
                this.sortMenuClosedAt = Date.now();
                this.menuDismiss?.();
                this.menuDismiss = null;
                this.deps.setSort(mode);
                paintSort();
                this.restoreFocusToSearch();
                void this.refresh();
            });
            option.title = this.deps.t(`sortHint.${mode}`);
            option.setAttribute("role", "menuitemradio");
            option.setAttribute("aria-checked", isSelected ? "true" : "false");
            sec.appendChild(option);
        }
        menu.appendChild(sec);
        const host = (this.dialog?.element.querySelector(".xlc-dialog")) ?? this.dialog?.element ?? document.body;
        host.appendChild(menu);
        const dismiss = (e: Event) => {
            if (!menu.contains(e.target as Node)) {
                menu.remove();
                this.sortMenuClosedAt = Date.now();
                if (this.menuDismiss === dismissMenu) this.menuDismiss = null;
                document.removeEventListener("pointerdown", dismiss, true);
                this.restoreFocusToSearch();
            }
        };
        const dismissMenu = (): void => {
            menu.remove();
            document.removeEventListener("pointerdown", dismiss, true);
        };
        this.menuDismiss = dismissMenu;
        document.addEventListener("pointerdown", dismiss, true);
        // 键盘无障碍漫游：Esc 关闭、↑↓ 项间循环切换、Home/End 直达首尾
        menu.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                menu.remove();
                this.sortMenuClosedAt = Date.now();
                if (this.menuDismiss === dismissMenu) this.menuDismiss = null;
                document.removeEventListener("pointerdown", dismiss, true);
                this.restoreFocusToSearch();
                return;
            }
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                const items = Array.from(menu.querySelectorAll<HTMLButtonElement>(".xlc-menu-item"));
                if (items.length === 0) return;
                const idx = items.indexOf(document.activeElement as HTMLButtonElement);
                e.preventDefault();
                e.stopPropagation();
                const nextIdx = e.key === "ArrowDown"
                    ? (idx + 1) % items.length
                    : (idx - 1 + items.length) % items.length;
                items[nextIdx]?.focus();
                return;
            }
            if (e.key === "Home" || e.key === "End") {
                const items = Array.from(menu.querySelectorAll<HTMLButtonElement>(".xlc-menu-item"));
                if (items.length === 0) return;
                e.preventDefault();
                e.stopPropagation();
                if (e.key === "Home") items[0]?.focus();
                else items[items.length - 1]?.focus();
            }
        });
        menu.querySelector<HTMLElement>(".xlc-menu-item")?.focus();
    }

    /** 直选或反选标签筛选（ADR 0044 / T-0071） */
    private filterByTag(tag: string): void {
        const current = this.deps.getFilters();
        const nextTag = current.tag === tag ? "" : tag;
        this.deps.setFilters({
            type: current.type,
            tag: nextTag,
            category: current.category,
        });
        const tagSelect = this.dialog?.element.querySelector<HTMLSelectElement>(".xlc-tag-select");
        if (tagSelect) tagSelect.value = nextTag;
        void this.refresh().then(() => this.restoreFocusToSearch());
    }

    /** 预览窗格元数据行（R108，Raycast Detail.Metadata 惯例）：类型徽标 + 分类/标签可点筛选 + 更新日期。 */
    private paintPaneMeta(entry: SearchEntry | undefined): void {
        const meta = this.dialog?.element.querySelector<HTMLElement>(".xlc-pane-meta");
        if (!meta) return;
        meta.textContent = "";
        if (!entry) {
            meta.style.display = "none";
            return;
        }
        const typeBadge = document.createElement("span");
        typeBadge.className = `xlc-badge xlc-badge--${entry.itemType}`;
        typeBadge.textContent = TYPE_BADGES[entry.itemType] ?? "TXT";
        meta.appendChild(typeBadge);
        if (entry.isOmni) {
            const omniBadge = document.createElement("span");
            omniBadge.className = "xlc-badge xlc-badge--omni";
            omniBadge.textContent = entry.tags?.includes("全库块") ? "思源全库块" : (entry.tags?.includes("当前文档") ? "当前文档块" : "思源文档");
            meta.appendChild(omniBadge);
        }
        const setFilter = (patch: {tag?: string; category?: string}): void => {
            const current = this.deps.getFilters();
            const next = {
                type: current.type,
                tag: patch.tag ?? current.tag,
                category: patch.category ?? current.category,
            };
            this.deps.setFilters(next);
            const tagSelect = this.dialog?.element.querySelector<HTMLSelectElement>(".xlc-tag-select");
            const categorySelect = this.dialog?.element.querySelector<HTMLSelectElement>(".xlc-category-select");
            if (tagSelect) tagSelect.value = next.tag;
            if (categorySelect) categorySelect.value = next.category;
            void this.refresh();
        };
        const toggleChip = (value: string, active: string | undefined): string => (active === value ? "" : value);
        const currentFilters = this.deps.getFilters();
        if (entry.category && !entry.isOmni) {
            const cat = document.createElement("button");
            cat.type = "button";
            cat.className = "xlc-meta-chip" + (currentFilters.category === entry.category ? " xlc-meta-chip--on" : "");
            cat.dataset.xlcControl = "preview.filter.category";
            cat.textContent = entry.category;
            cat.title = this.deps.t("category");
            cat.setAttribute("aria-pressed", String(currentFilters.category === entry.category));
            cat.addEventListener("click", () => setFilter({category: toggleChip(entry.category, this.deps.getFilters().category)}));
            meta.appendChild(cat);
        }
        // 空字符串标签防御（索引切分可能产生空段，R118）
        const cleanTags = entry.tags.filter(Boolean);
        const shownTags = cleanTags.slice(0, 3);
        for (const tag of shownTags) {
            const isSelected = currentFilters.tag === tag;
            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = "xlc-meta-chip xlc-meta-chip--clickable" + (isSelected ? " xlc-meta-chip--on" : "");
            chip.dataset.xlcControl = "preview.filter.tag";
            chip.textContent = `#${tag}`;
            const tip = this.deps.t(isSelected ? "clearThisTagFilter" : "filterByThisTag", tag);
            chip.title = tip;
            chip.setAttribute("aria-label", tip);
            chip.setAttribute("aria-pressed", String(isSelected));
            chip.addEventListener("click", () => this.filterByTag(tag));
            meta.appendChild(chip);
        }
        if (cleanTags.length > shownTags.length) {
            const more = document.createElement("span");
            more.className = "xlc-meta-chip xlc-meta-chip--static";
            more.textContent = `+${cleanTags.length - shownTags.length}`;
            meta.appendChild(more);
        }
        const effectiveDocPath = entry.sourceDocPath
            || (entry.isOmni && entry.category && entry.category !== "全库内容" && entry.category !== "剪贴板"
                ? entry.category.replace(/^\/+/, "").replace(/\.sy$/, "")
                : undefined);
        const hasExternalSourceDoc = !entry.isOmni && isBlockId(entry.sourceDocId) && entry.sourceDocId !== entry.libraryDocId;
        if (effectiveDocPath || hasExternalSourceDoc) {
            const pathBtn = document.createElement("button");
            pathBtn.type = "button";
            pathBtn.className = "xlc-meta-chip xlc-meta-chip--path";
            pathBtn.dataset.xlcControl = "preview.open-path";
            pathBtn.textContent = "📄 " + (effectiveDocPath || "来源文档");
            pathBtn.title = "点击在思源中打开并定位此文档或块 (Alt+D)";
            pathBtn.addEventListener("click", () => {
                if (!this.pinWindow) this.destroy();
                if (entry.isOmni && this.deps.openDocBlock) {
                    void this.deps.openDocBlock(resolveEntryBlockId(entry) || entry.id);
                } else {
                    void this.deps.openSource(entry.id);
                }
            });
            meta.appendChild(pathBtn);
            if (!effectiveDocPath && hasExternalSourceDoc && this.deps.getDocPath && entry.sourceDocId) {
                void this.deps.getDocPath(entry.sourceDocId).then((resolvedPath) => {
                    if (!resolvedPath) return;
                    entry.sourceDocPath = resolvedPath;
                    if (pathBtn.isConnected) {
                        pathBtn.textContent = "📄 " + resolvedPath;
                    }
                }).catch(() => {});
            }
        }
        if (!entry.isOmni && isBlockId(entry.blockId)) {
            const libBlockBtn = document.createElement("button");
            libBlockBtn.type = "button";
            libBlockBtn.className = "xlc-meta-chip xlc-meta-chip--path";
            libBlockBtn.dataset.xlcControl = "preview.open-lib-block";
            libBlockBtn.textContent = "📦 库内原块";
            libBlockBtn.title = "点击在思源常用库文档中直接定位此条目的本体块";
            libBlockBtn.addEventListener("click", () => {
                if (!this.pinWindow) this.destroy();
                if (this.deps.openDocBlock) {
                    void this.deps.openDocBlock(entry.blockId);
                } else {
                    void this.deps.openSource(entry.id);
                }
            });
            meta.appendChild(libBlockBtn);
            if (this.deps.getDocPath && isBlockId(entry.libraryDocId)) {
                void this.deps.getDocPath(entry.libraryDocId).then((libPath) => {
                    if (libPath && libBlockBtn.isConnected) {
                        libBlockBtn.title = `在思源常用库文档 (${libPath}) 中定位此块`;
                    }
                }).catch(() => {});
            }
        }
        if (!entry.isOmni && isBlockId(entry.sourceBlockId) && entry.sourceBlockId !== entry.blockId) {
            if (this.deps.pullFromSource) {
                const pullBtn = document.createElement("button");
                pullBtn.type = "button";
                pullBtn.className = "xlc-meta-chip";
                pullBtn.dataset.xlcControl = "preview.pull-source";
                pullBtn.textContent = "↻ 拉取原块";
                pullBtn.title = "从思源来源块拉取最新内容并更新本条目";
                pullBtn.addEventListener("click", () => {
                    void this.deps.pullFromSource?.(entry.id);
                });
                meta.appendChild(pullBtn);
            }
            if (this.deps.pushToSource && entry.itemType !== "blockref") {
                const pushBtn = document.createElement("button");
                pushBtn.type = "button";
                pushBtn.className = "xlc-meta-chip";
                pushBtn.dataset.xlcControl = "preview.push-source";
                pushBtn.textContent = "⤴ 回写原块";
                pushBtn.title = "将本条目当前正文回写至思源来源块";
                pushBtn.addEventListener("click", () => {
                    void this.deps.pushToSource?.(entry.id);
                });
                meta.appendChild(pushBtn);
            }
        }
        if (this.deps.getAdjacentBlocks && isBlockId(resolveEntryBlockId(entry)) && isBlockId(entry.sourceDocId || entry.libraryDocId)) {
            const probeBtn = document.createElement("button");
            probeBtn.type = "button";
            probeBtn.className = "xlc-meta-chip";
            probeBtn.dataset.xlcControl = "preview.adjacent-probe";
            probeBtn.textContent = "🔍 前后文 (Alt+J)";
            probeBtn.title = "就地展开源文档中的前后相邻上下文块 (Alt+J)";
            probeBtn.addEventListener("click", () => void this.toggleAdjacentContextProbe());
            meta.appendChild(probeBtn);
        }
        // 更新日期（Raycast accessory date 惯例的详情面板版；1970 级脏值不显示）
        if (Number.isFinite(entry.updatedAt) && entry.updatedAt > 946684800000) {
            const date = document.createElement("span");
            date.className = "xlc-pane-meta-date";
            date.textContent = this.deps.t("updatedAtLabel", new Date(entry.updatedAt).toLocaleDateString());
            meta.appendChild(date);
        }
        meta.style.display = "flex";
    }

    private updatePreview(forceId?: string): void {
        const paneBody = this.dialog?.element.querySelector<HTMLElement>(".xlc-pane-body");
        const paneTitle = this.dialog?.element.querySelector<HTMLElement>(".xlc-pane-title");
        const paneWarn = this.dialog?.element.querySelector<HTMLElement>(".xlc-pane-warn");
        const paneAi = this.dialog?.element.querySelector<HTMLElement>(".xlc-pane-ai");
        const paneUsage = this.dialog?.element.querySelector<HTMLElement>(".xlc-pane-usage");
        if (!paneBody || !paneTitle || !paneWarn || !paneAi || !paneUsage) return;
        const mediaHint = this.dialog?.element.querySelector<HTMLElement>('[data-xlc-control="preview.media-hint"]');
        const activeEntry = this.activeProvider < 0 ? this.results[this.activeIndex] : undefined;
        if (mediaHint) mediaHint.hidden = activeEntry?.itemType !== "image" && activeEntry?.itemType !== "asset";
        this.syncPaneActions();
        const paintUsageBadge = (entry: SearchEntry | undefined): void => {
            const count = entry ? (this.usageCounts.get(entry.id) ?? 0) : 0;
            // AI 徽标优先（原型：AI 结果态只显示 AI 找到的）
            if (this.aiResults || count <= 0) {
                paneUsage.style.display = "none";
                return;
            }
            paneUsage.textContent = `✦ ${this.deps.t("sort.frequent")} · ${this.deps.t("useCount", String(count))}`;
            paneUsage.style.display = "inline-block";
        };
        // 提供方行：预览直接展示 payload（无内核取用、无来源语义、无变量询问）
        if (this.activeProvider >= 0) {
            const row = this.providerRows[this.activeProvider];
            if (row) {
                this.lastPreviewId = row.virtualId;
                paneTitle.textContent = row.title || row.providerName;
                paneAi.style.display = "none";
                paneUsage.style.display = "none";
                paneWarn.style.display = "none";
                this.paintPaneMeta(undefined);
                paneBody.classList.remove("xlc-pane-body--muted", "xlc-pane-body--code");
                this.paintPaneVars(null, "provider");
                try {
                    renderSafePreview(paneBody, row.payload, "provider");
                } catch {
                    paneBody.textContent = row.payload;
                }
                return;
            }
            this.activeProvider = -1;
        }
        const entry = this.results[this.activeIndex];
        const id = forceId ?? entry?.id ?? null;
        // 元数据行跟活动条目走（含清空态隐藏），先于预览缓存的早退执行
        this.paintPaneMeta(entry);
        if (!id) {
            ++this.previewSeq;
            this.lastPreviewId = "";
            paneTitle.textContent = "";
            paneAi.style.display = "none";
            paneWarn.style.display = "none";
            paneUsage.style.display = "none";
            paneBody.classList.add("xlc-pane-body--muted");
            paneBody.classList.remove("xlc-pane-body--code");
            paneBody.textContent = this.deps.t("previewNoResult");
            paneBody.scrollTop = 0;
            this.paintPaneVars(null, undefined);
            return;
        }
        if (!id || id === this.lastPreviewId) return;
        const seq = ++this.previewSeq;
        this.lastPreviewId = id;
        if (paneTitle) paneTitle.textContent = entry?.title ?? "";
        if (paneAi) paneAi.style.display = this.aiResults ? "" : "none";
        paintUsageBadge(entry);
        if (paneWarn) {
            const missing = Boolean(entry && this.deps.isSourceMissing(entry));
            paneWarn.style.display = missing ? "" : "none";
            if (missing) paneWarn.textContent = "⚠ " + this.deps.t("sourceGone");
        }
        this.paintPaneVars(null, entry?.itemType);
            paneBody.classList.add("xlc-pane-body--muted");
            paneBody.textContent = this.deps.t("loading"); // 本地内核预览不用「AI 处理中」文案，避免误导（R138）
        void this.deps.preview(id).then((text) => {
            if (seq !== this.previewSeq) return;
            const finalText = text || this.deps.t("previewUnavailable");
            // 占位（暂无预览）保持降调；真内容恢复主文字色
            paneBody.classList.toggle("xlc-pane-body--muted", finalText === this.deps.t("previewUnavailable"));
            if (text) {
                try {
                    const parsedAnnotation = (entry?.itemType !== "code") ? parseSnippetAnnotations(text) : null;
                    const previewText = parsedAnnotation && parsedAnnotation.cleanText ? parsedAnnotation.cleanText : text;
                    if (entry?.itemType !== "code" && hasDynamicMacros(previewText)) {
                        const expanded = expandMacroPreview(previewText);
                        renderDualMacroPreview(
                            paneBody,
                            previewText,
                            expanded,
                            entry?.itemType,
                            {
                                templateSource: this.deps.t("previewTemplateSource") || "模板源码",
                                expandedEffect: this.deps.t("previewExpandedEffect") || "展开后真实效果",
                            },
                        );
                    } else {
                        renderSafePreview(paneBody, previewText, entry?.itemType);
                    }
                    if (parsedAnnotation && parsedAnnotation.tags.length > 0) {
                        const annotHint = document.createElement("div");
                        annotHint.className = "xlc-form-hint";
                        annotHint.style.marginTop = "8px";
                        annotHint.style.fontSize = "11px";
                        annotHint.style.color = "var(--b3-theme-primary)";
                        annotHint.textContent = `🏷️ 检索关键字：${parsedAnnotation.tags.map((t) => `@${t}`).join(" ")}（插入/复制时自动剥离，仅输出有效数据）`;
                        paneBody.appendChild(annotHint);
                    }
                } catch {
                    paneBody.textContent = finalText;
                }
            } else {
                paneBody.textContent = finalText;
            }
            // 切换条目后回到顶部（长内容滚动位置不残留）
            paneBody.scrollTop = 0;
            // 代码条目预览用等宽字体（纯文本渲染不变，仅观感）
            paneBody.classList.toggle("xlc-pane-body--code", entry?.itemType === "code");
            this.paintPaneVars(text, entry?.itemType);
        }).catch(() => {
            if (seq !== this.previewSeq) return;
            paneBody.classList.add("xlc-pane-body--muted");
            paneBody.textContent = this.deps.t("kernelError", "preview");
            paneBody.classList.remove("xlc-pane-body--code");
            this.paintPaneVars(null, entry?.itemType);
        });
    }

    /** 普通点击 = 主动作（insert；blockref = 插入引用）。含变量时先弹填充卡片（F1）。
     *  执行期防重入（R138）：双击行/按住 Enter 不得重复插入同一块。 */
    /** AI 变换代次：连点两个变换时丢弃慢的旧结果（R138） */
    private transformSeq = 0;
    /** 排序菜单关闭时刻：chip 的 click 在 pointerdown 关闭之后到达，不得立刻重开（R138 toggle） */
    private sortMenuClosedAt = 0;
    private historyCursor = -1;
    private tempQueryBeforeHistory = "";
    private navigatingHistory = false;

    private async runPrimary(entry: SearchEntry): Promise<void> {
        const cleanQuery = this.lastQueryText.replace(/^\?+/, "").trim();
        if (cleanQuery) this.deps.addRecentQuery?.(cleanQuery);
        if (this.primaryBusy || this.varFormOpen) return;
        if (this.deps.defaultActionMode === "copy") {
            this.primaryBusy = true;
            try {
                const raw = entry.isOmni ? (entry.content || entry.summary || "") : await this.deps.preview(entry.id);
                const plain = kramdownToPlainText(raw || entry.summary || "");
                await this.deps.copyProviderPayload(plain);
                if (this.deps.autoMinimizeOnDone) {
                    this.destroy();
                    this.deps.notify?.("info", this.deps.t("globalQuickMiniDone"));
                } else {
                    if (!this.pinWindow) this.destroy();
                    this.deps.notify?.("info", "已复制条目内容到剪贴板");
                }
            } finally {
                this.primaryBusy = false;
            }
            return;
        }
        if (this.deps.defaultActionMode === "openSource") {
            this.primaryBusy = true;
            try {
                if (!this.pinWindow) this.destroy();
                await this.deps.openSource(entry.id);
            } finally {
                this.primaryBusy = false;
            }
            return;
        }
        await this.insertEntryWithVars(entry, (fills) => this.runActionFor(entry, fills));
    }

    /** 统一处理「插入嵌入块 / 插入块引用」（T-0757 / FN-02 & FN-07）：
     *  - 全域条目提取真实 22 位块 ID 并走 insertProviderPayload；
     *  - 库内条目统一走 runActionFor -> ActionExecutor，记录使用频次且只发一次真实回执（消除双 Toast）。 */
    private async insertEntryEmbedOrRef(entry: SearchEntry, kind: "embed" | "ref"): Promise<void> {
        const targetBlockId = resolveEntryBlockId(entry);
        if (!isBlockId(targetBlockId)) {
            this.deps.notify?.("error", kind === "embed" ? "无法嵌入：未关联有效块 ID" : "无法引用：未关联有效块 ID");
            return;
        }
        await this.runActionFor(entry, undefined, kind === "embed" ? "insert-embed" : "insert-ref");
        if (!this.pinWindow) this.destroy();
    }

    private runActionFor(entry: SearchEntry, fills?: Record<string, string>, overrideMode?: InsertMode): Promise<unknown> {
        // 全域检索条目未入库索引，按真实物理块 ID 或正文直接上屏
        if (entry.isOmni) {
            if (overrideMode === "insert-embed") {
                const targetBlockId = resolveEntryBlockId(entry);
                return this.deps.insertProviderPayload(buildEmbedBlock(targetBlockId), this.insertTarget ?? undefined);
            }
            if (overrideMode === "insert-ref") {
                const targetBlockId = resolveEntryBlockId(entry);
                const anchor = (entry.title || entry.summary || "引用").slice(0, 50).replace(/[\r\n]+/g, " ");
                return this.deps.insertProviderPayload(buildBlockRef(targetBlockId, anchor), this.insertTarget ?? undefined);
            }
            let finalContent = entry.content || entry.summary || "";
            if (fills) {
                finalContent = expandAsks(finalContent, fills);
            }
            finalContent = applyAskDefaults(stripCursorToken(finalContent));
            return this.deps.insertProviderPayload(finalContent, this.insertTarget ?? undefined);
        }
        // 定向插入模式（文档树入口）：插入到指定文档而非活动编辑器
        if (this.insertTarget) {
            const target = this.insertTarget;
            const insertMode = overrideMode === "insert-embed" || overrideMode === "insert-ref" || overrideMode === "insert-content"
                ? overrideMode
                : "insert";
            return this.deps.insertToDoc(entry.id, target.docId, target.hPath, fills, insertMode);
        }
        const mode: InsertMode = overrideMode || (entry.itemType === "blockref" ? "insert-ref" : "insert");
        return fills
            ? this.deps.runActionWithFills(entry.id, mode, fills)
            : this.deps.runAction(entry.id, mode);
    }

    /** F1：插入前询问变量（设置可关；无 ask 字段零打扰；code 条目不询问）。
     *  perform 收到 fills（undefined=未触发询问，走原路径）。 */
    private async insertEntryWithVars(entry: SearchEntry, perform: (fills?: Record<string, string>) => Promise<unknown>, options?: {beforePerform?: () => void}): Promise<void> {
        if (this.varFormOpen || this.primaryBusy) return;
        this.primaryBusy = true;
        this.syncPaneActions();
        const releaseBusy = (): void => {
            this.primaryBusy = false;
            this.syncPaneActions();
        };
        if (!this.deps.promptVariables()) {
            try {
                await perform();
            } finally {
                releaseBusy();
            }
            return;
        }
        let fields: AskField[] = [];
        let previewFailed = false;
        let templateText = "";
        try {
            const content = entry.isOmni ? (entry.content || entry.summary || "") : await this.deps.preview(entry.id);
            templateText = content || "";
            fields = entry.itemType === "code" || !content ? [] : listAskFields(content);
        } catch {
            fields = [];
            previewFailed = true;
        }
        if (fields.length === 0) {
            // 预览失败但条目声明含变量：按原样插入前给出可见提示，不静默（R139）
            if (previewFailed && (entry.varCount ?? 0) > 0) {
                const status = this.dialog?.element.querySelector<HTMLElement>(".xlc-status");
                if (status) {
                    status.textContent = this.deps.t("varParseFailed");
                    status.classList.add("xlc-status--error");
                }
            }
            try {
                const execution = perform();
                if (options?.beforePerform) options.beforePerform();
                else if (!this.pinWindow) this.destroy();
                await execution;
            } finally {
                releaseBusy();
            }
            return;
        }
        // 填充卡已在屏上时不得叠开第二张（双击行会走到这里，R138）
        if (this.varFormOpen) {
            releaseBusy();
            return;
        }
        this.varFormOpen = true;
        this.syncPaneActions();
        const labels = fields.map((f) => f.name);
        const defaults = this.deps.getVariableDefaults ? this.deps.getVariableDefaults(labels) : undefined;
        openVariableFillCard({
            t: this.deps.t,
            itemType: entry.itemType,
            title: entry.title,
            fields,
            defaults,
            profilePresets: this.deps.getProfilePresets?.(),
            templateText,
            itemId: entry.id,
            presets: this.deps.getVariablePresets?.(entry.id),
            onSavePreset: (name, fills) => {
                this.deps.saveVariablePreset?.(entry.id, name, fills);
            },
            onDeletePreset: (name) => {
                this.deps.deleteVariablePreset?.(entry.id, name);
            },
            onConfirm: (fills) => {
                this.varFormOpen = false;
                this.syncPaneActions();
                try {
                    this.deps.rememberVariables?.(fills);
                } catch {
                    // 记忆写入失败不得阻断条目插入
                }
                // 主列表保留原行为；动作菜单传入 beforePerform，让取消填写时搜索上下文仍在。
                const execution = perform(fills);
                if (options?.beforePerform) options.beforePerform();
                else if (!this.pinWindow) this.destroy();
                void execution.finally(() => {
                    releaseBusy();
                });
                if (this.pinWindow) this.deps.notify?.("info", "已插入（窗口已固定，可连续选择）");
            },
            onCopy: async (fills) => {
                this.varFormOpen = false;
                this.syncPaneActions();
                try {
                    this.deps.rememberVariables?.(fills);
                } catch {
                    // 记忆写入失败不得阻断
                }
                if (!this.pinWindow) this.destroy();
                try {
                    if (entry.isOmni) {
                        let finalContent = entry.content || entry.summary || "";
                        finalContent = expandAsks(finalContent, fills);
                        finalContent = applyAskDefaults(stripCursorToken(finalContent));
                        await this.deps.copyProviderPayload(finalContent);
                    } else {
                        await this.deps.runActionWithFills(entry.id, "copy", fills);
                    }
                    this.deps.notify?.("info", this.pinWindow ? "已根据填入变量复制到剪贴板（窗口已固定，可连续取用）" : "已根据填入变量复制到剪贴板，可直接在外部窗口粘贴 (Ctrl+V)");
                } finally {
                    releaseBusy();
                }
            },
            // 取消/关闭（Esc/scrim/取消钮）后焦点回搜索框，与浮层菜单一致（R128）
            onCancel: () => {
                this.varFormOpen = false;
                releaseBusy();
                this.restoreFocusToSearch();
            },
        });
    }

    /** 菜单按钮统一构造：图标列 + 文本（createTextNode 注入，绝不 innerHTML） */
    private menuButton(icon: string, label: string, cls: string, run: () => void | Promise<unknown>): HTMLButtonElement {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = cls;
        btn.setAttribute("role", "menuitem");
        if (typeof btn.setAttribute === "function") {
            btn.setAttribute("aria-label", label);
        }
        const ic = document.createElement("span");
        ic.className = "xlc-menu-ic";
        if (typeof ic.setAttribute === "function") {
            ic.setAttribute("aria-hidden", "true");
        }
        ic.textContent = icon;
        btn.appendChild(ic);
        btn.appendChild(document.createTextNode(label));
        btn.addEventListener("click", () => void run());
        return btn;
    }

    /**
     * 极速多格式复制直选菜单（CAND-017 / TODO-FEAT-016）
     */
    private async showCopyFormatMenu(anchor: HTMLElement, entry: SearchEntry): Promise<void> {
        this.menuDismiss?.();
        this.menuDismiss = null;

        const menu = document.createElement("div");
        menu.className = "xlc-menu xlc-copy-format-menu";
        menu.setAttribute("role", "menu");
        menu.setAttribute("aria-label", "多格式复制菜单");

        const formats: Array<{kind: ItemCopyFormat; icon: string; title: string; desc: string}> = [
            {kind: "text", icon: "📄", title: "纯净文本 (无格式)", desc: "剥离 Markdown 符号，适用于微信聊天/钉钉"},
            {kind: "wechat-html", icon: "🌐", title: "微信富文本 HTML", desc: "带排版样式，复制后粘贴到微信公众号/邮件"},
            {kind: "markdown", icon: "📝", title: "原始 Markdown", desc: "保留完整 Markdown 反引号与标记"},
            {kind: "blockref", icon: "🔗", title: "思源块引用语法", desc: "生成 ((id '标题')) 原生块引用"},
        ];

        for (const fmt of formats) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "xlc-menu-item";
            btn.setAttribute("role", "menuitem");
            btn.dataset.xlcControl = `copy-format.${fmt.kind}`;
            const ic = document.createElement("span");
            ic.className = "xlc-menu-icon";
            ic.setAttribute("aria-hidden", "true");
            ic.textContent = fmt.icon;

            const titleEl = document.createElement("strong");
            titleEl.textContent = fmt.title;

            const subEl = document.createElement("div");
            subEl.className = "xlc-menu-sub";
            subEl.textContent = fmt.desc;

            btn.append(ic, titleEl, subEl);
            btn.addEventListener("click", async () => {
                this.menuDismiss?.();
                let fullContent = entry.content || entry.summary || "";
                if (typeof this.deps.preview === "function") {
                    try {
                        const kd = await this.deps.preview(entry.id);
                        if (kd) fullContent = kd;
                    } catch {}
                }
                const formatted = formatItemContent(fullContent, fmt.kind, {
                    id: resolveEntryBlockId(entry) || entry.id,
                    title: entry.title,
                });
                let success = false;
                if (fmt.kind === "wechat-html" && formatted.html) {
                    success = await writeRichClipboard(formatted.text, formatted.html);
                } else {
                    success = await this.deps.copyText(formatted.text);
                }
                if (success) {
                    lvNotify.inline(anchor, "已复制");
                    if (!this.pinWindow) setTimeout(() => this.destroy(), 350);
                } else {
                    this.deps.notify?.("error", this.deps.t("copyFailed"));
                }
            });
            menu.appendChild(btn);
        }

        const rect = anchor.getBoundingClientRect();
        const menuW = Math.min(290, Math.max(180, window.innerWidth - 16));
        const clampedLeft = Math.max(8, Math.min(rect.left - 80, window.innerWidth - menuW - 8));
        const clampedBottom = Math.max(8, Math.min(window.innerHeight - rect.top + 6, window.innerHeight - 240));
        menu.style.position = "fixed";
        menu.style.bottom = `${clampedBottom}px`;
        menu.style.left = `${clampedLeft}px`;
        menu.style.zIndex = "99999";
        document.body.appendChild(menu);

        const onDocClick = (ev: MouseEvent) => {
            if (!menu.contains(ev.target as Node)) {
                this.menuDismiss?.();
            }
        };
        const onDocKey = (ev: KeyboardEvent) => {
            if (ev.key === "Escape") {
                this.menuDismiss?.();
            }
        };
        setTimeout(() => {
            document.addEventListener("click", onDocClick);
            document.addEventListener("keydown", onDocKey);
        }, 10);

        this.menuDismiss = () => {
            document.removeEventListener("click", onDocClick);
            document.removeEventListener("keydown", onDocKey);
            menu.remove();
            this.menuDismiss = null;
        };
    }

    private async showActionMenu(entry: SearchEntry): Promise<void> {
        this.menuDismiss?.();
        this.menuDismiss = null;
        const menu = document.createElement("div");
        menu.className = "xlc-menu";
        menu.setAttribute("role", "menu");
        menu.setAttribute("aria-label", entry.title || this.deps.t("unknownType"));
        const rebuild = (render: () => void): void => {
            menu.innerHTML = "";
            render();
        };
        const appendMediaHint = (): void => {
            if (entry.itemType !== "image" && entry.itemType !== "asset") return;
            const hint = document.createElement("p");
            hint.className = "xlc-pickdoc-empty";
            hint.dataset.xlcControl = "dialog.media-hint";
            hint.setAttribute("role", "note");
            hint.textContent = this.deps.t("mediaContentHint");
            menu.appendChild(hint);
        };

        const buildDefault = (): void => {
            // 标题行（条目名 · 动作，移动端补齐可见 ✕ 关闭按钮）
            const lbl = document.createElement("div");
            lbl.className = "xlc-menu-lbl";
            const lblText = document.createElement("span");
            lblText.textContent = (entry.title || this.deps.t("unknownType")) + " · " + this.deps.t("actionsNoun");
            lbl.appendChild(lblText);

            if (this.deps.isMobile()) {
                const closeBtn = document.createElement("button");
                closeBtn.type = "button";
                closeBtn.className = "xlc-menu-close-btn";
                closeBtn.textContent = "✕";
                closeBtn.title = this.deps.t("close") || "关闭菜单";
                closeBtn.setAttribute("aria-label", closeBtn.title);
                closeBtn.addEventListener("click", (ev) => {
                    ev.stopPropagation();
                    this.menuDismiss?.();
                    this.menuDismiss = null;
                });
                lbl.appendChild(closeBtn);
            }
            menu.appendChild(lbl);
            appendMediaHint();
            // 预览盒（原文摘要）：原型屏 2 置于动作分区之后（先见动作，预览兜底）；占位降调
            const previewBox = document.createElement("pre");
            previewBox.className = "xlc-menu-preview xlc-menu-preview--muted";
            previewBox.tabIndex = 0;
            if (typeof previewBox.setAttribute === "function") {
                previewBox.setAttribute("role", "region");
                previewBox.setAttribute("aria-label", "原文摘要预览");
            }
            previewBox.textContent = this.deps.t("previewUnavailable");
            void this.deps.preview(entry.id).then((text) => {
                if (text) {
                    previewBox.textContent = text.slice(0, 500);
                    previewBox.classList.remove("xlc-menu-preview--muted");
                }
            }).catch(() => {
                previewBox.textContent = this.deps.t("kernelError", "preview");
            });

            const sec1 = document.createElement("div");
            sec1.className = "xlc-menu-sec";
            if (typeof sec1.setAttribute === "function") {
                sec1.setAttribute("role", "group");
                sec1.setAttribute("aria-label", "主要操作");
            }
            const addAction = (icon: string, label: string, run: () => Promise<unknown>, cls = "xlc-menu-item", destroyBeforeRun = true): void => {
                let btn: HTMLElement;
                btn = this.menuButton(icon, label, cls, async () => {
                    const isCopyAction = icon === "⧉" || label.includes("复制") || label.includes("Copy");
                    if (isCopyAction) {
                        try {
                            await run();
                            lvNotify.inline(btn, "已复制");
                            if (destroyBeforeRun && !this.pinWindow) {
                                setTimeout(() => this.destroy(), 350);
                            }
                        } catch (err) {
                            this.deps.notify?.("error", toErrorMessage(err));
                        }
                    } else {
                        const execution = run();
                        if (destroyBeforeRun) this.destroy();
                        else {
                            this.menuDismiss?.();
                            this.menuDismiss = null;
                        }
                        try {
                            await execution;
                        } catch (err) {
                            this.deps.notify?.("error", toErrorMessage(err));
                        }
                    }
                });
                sec1.appendChild(btn);
            };
            if (entry.itemType === "blockref") {
                addAction("＋", this.deps.t("insertRef"), () => this.insertTarget
                    ? this.deps.insertToDoc(entry.id, this.insertTarget.docId, this.insertTarget.hPath, undefined, "insert-ref")
                    : this.deps.runAction(entry.id, "insert-ref"));
                addAction("↳", this.deps.t("insertSourceContent"), () => this.insertEntryWithVars(entry, (fills) => this.insertTarget
                    ? this.deps.insertToDoc(entry.id, this.insertTarget.docId, this.insertTarget.hPath, fills, "insert-content")
                    : fills
                        ? this.deps.runActionWithFills(entry.id, "insert-content", fills)
                        : this.deps.runAction(entry.id, "insert-content"), {beforePerform: () => this.destroy()}), "xlc-menu-item", false);
                addAction("⊞", this.deps.t("insertEmbed"), () => this.insertTarget
                    ? this.deps.insertToDoc(entry.id, this.insertTarget.docId, this.insertTarget.hPath, undefined, "insert-embed")
                    : this.deps.runAction(entry.id, "insert-embed"));
                addAction("⧉", this.deps.t("insertCopy"), () => this.deps.runAction(entry.id, "copy-content"));
            } else {
                // 插入含变量条目同样先弹填充卡（F1）；复制保持模板原样
                addAction("＋", this.deps.t("insert"), () => this.insertEntryWithVars(entry, (fills) => this.runActionFor(entry, fills), {beforePerform: () => this.destroy()}), "xlc-menu-item", false);
                addAction("⧉", this.deps.t("copy"), () => this.deps.runAction(entry.id, "copy"));
                if ((entry.varCount ?? 0) > 0) {
                    addAction("📄", this.deps.t("copyRawTemplate"), async () => {
                        const raw = await this.deps.preview(entry.id);
                        await this.deps.copyProviderPayload(raw || entry.content || "");
                    });
                }
            }

            // 快捷插入块引用/嵌入块 + 复制块引用语法 (Alt+B / Alt+E / Alt+R)
            const targetBlockId = resolveEntryBlockId(entry);
            if (isBlockId(targetBlockId)) {
                if (entry.itemType !== "blockref") {
                    addAction("((•))", (this.deps.t("insertBlockRef") || "插入为思源块引用") + " (Alt+B)", () => this.insertEntryEmbedOrRef(entry, "ref"), "xlc-menu-item", false);
                    addAction("{{•}}", (this.deps.t("insertEmbed") || "插入为思源同步嵌入块") + " (Alt+E)", () => this.insertEntryEmbedOrRef(entry, "embed"), "xlc-menu-item", false);
                }
                addAction("((•))", "复制块引用语法 (Alt+R)", async () => {
                    const anchor = (entry.title || entry.summary || "引用").slice(0, 50).replace(/[\r\n]+/g, " ");
                    const refCode = buildBlockRef(targetBlockId, anchor);
                    await this.deps.copyProviderPayload(refCode);
                }, "xlc-menu-item", !this.pinWindow);
            }

            // 快捷复制清洗纯文本 (Alt+Shift+C)
            addAction("📄", "复制纯文本 (Alt+Shift+C)", async () => {
                const raw = entry.isOmni ? (entry.content || entry.summary || "") : await this.deps.preview(entry.id);
                const plain = kramdownToPlainText(raw || entry.summary || "");
                await this.deps.copyProviderPayload(plain);
            }, "xlc-menu-item", !this.pinWindow);
            menu.appendChild(sec1);

            // AI 变换（启用时展示；需要正文出域权限，失败在预览盒诚实提示；
            // 内置五种 + 用户自定义变换（F7）并列）
            if (this.deps.aiEnabled()) {
                const secAi = document.createElement("div");
                secAi.className = "xlc-menu-sec xlc-menu-sec--ai";
                if (typeof secAi.setAttribute === "function") {
                    secAi.setAttribute("role", "group");
                    secAi.setAttribute("aria-label", "AI智能变换");
                }
                const openTransform = (transformLabel: string, run: () => Promise<{ok: true; text: string} | {ok: false; message: string}>): void => {
                    const gen = ++this.transformSeq; // 代次守卫：慢的旧变换不得覆盖新视图（R138）
                    rebuild(() => buildTransformView(entry.title + " · " + transformLabel, transformLabel));
                    void runTransformView(run, gen);
                };
                for (const kind of TRANSFORM_KINDS) {
                    secAi.appendChild(this.menuButton("✦", this.deps.t(`tf.${kind}`), "xlc-menu-item xlc-menu-item--ai", () => {
                        openTransform(this.deps.t(`tf.${kind}`), async () => this.deps.aiTransform(entry.id, kind));
                    }));
                }
                for (const ct of this.deps.listCustomTransforms()) {
                    secAi.appendChild(this.menuButton("✦", ct.name, "xlc-menu-item xlc-menu-item--ai", () => {
                        openTransform(ct.name, async () => this.deps.aiTransformCustom(entry.id, ct.id));
                    }));
                }
                menu.appendChild(secAi);
            }

            const sec2 = document.createElement("div");
            sec2.className = "xlc-menu-sec";
            if (typeof sec2.setAttribute === "function") {
                sec2.setAttribute("role", "group");
                sec2.setAttribute("aria-label", "扩展操作");
            }
            let silentTarget: HTMLElement = sec2;
            const addSilent = (icon: string, label: string, run: () => Promise<unknown> | void, cls = "xlc-menu-item", title?: string): HTMLButtonElement => {
                const btn = this.menuButton(icon, label, cls, async () => {
                    // 统一走 menuDismiss：document 监听必须摘除、账目不被错清（此前 menu.remove() 泄漏监听，
                    // 后续 pointerdown 会把焦点从编辑弹窗抢回搜索框，R138）
                    this.menuDismiss?.();
                    this.menuDismiss = null;
                    await run();
                });
                if (title) btn.title = title;
                silentTarget.appendChild(btn);
                return btn;
            };
            if (entry.isOmni) {
                if (entry.id.startsWith("xlc-clip-")) {
                    const table = tsvToMarkdownTable(entry.content || "");
                    if (table) {
                        addSilent("⊞", `转为 Markdown 表格并复制 (${table.rowCount}行×${table.colCount}列)`, async () => {
                            await this.deps.copyProviderPayload(table.result);
                            this.deps.notify?.("info", `已转为 Markdown 表格并复制 (${table.rowCount}行)`);
                        });
                    }
                    if (this.deps.promoteClipboardEntry) {
                        addSilent("⭐", "⭐ 存为常用 (转正为永久片段)", () => {
                            const existingCategories = Array.from(new Set(this.results.map((r) => r.category).filter(Boolean)));
                            const lastCategory = this.deps.getFilters().category || "常用";
                            openPromoteClipDialog({
                                t: this.deps.t,
                                entry,
                                categories: existingCategories,
                                defaultCategory: lastCategory,
                                entries: this.results,
                                notify: this.deps.notify,
                                onPromote: async (payload) => {
                                    const ok = await this.deps.promoteClipboardEntry!(entry, payload);
                                    if (ok) {
                                        this.capturedOmniIds.add(entry.id);
                                        this.syncPaneActions();
                                        const activeRow = this.dialog?.element.querySelector<HTMLElement>(`[data-xlc-item-id="${entry.id}"]`);
                                        const rowSaveBtn = activeRow?.querySelector<HTMLButtonElement>('[data-xlc-control="item.save-to-common"]');
                                        if (rowSaveBtn) {
                                            rowSaveBtn.textContent = "✓";
                                            rowSaveBtn.disabled = true;
                                            rowSaveBtn.title = "已存为常用";
                                            lvNotify.inline(rowSaveBtn, "已存为常用");
                                        }
                                    }
                                    return ok;
                                },
                            });
                        });
                    } else if (this.deps.createFromOmni) {
                        addSilent("⭐", "一键沉淀为常用语 (Alt+S)", async () => {
                            const ok = await this.deps.createFromOmni!(entry);
                            if (ok) {
                                this.capturedOmniIds.add(entry.id);
                                this.syncPaneActions();
                                const activeRow = this.dialog?.element.querySelector<HTMLElement>(`[data-xlc-item-id="${entry.id}"]`);
                                const rowSaveBtn = activeRow?.querySelector<HTMLButtonElement>('[data-xlc-control="item.save-to-common"]');
                                if (rowSaveBtn) {
                                    rowSaveBtn.textContent = "✓";
                                    rowSaveBtn.disabled = true;
                                    rowSaveBtn.title = "已沉淀为常用语";
                                }
                            }
                        });
                    }
                    if (this.deps.captureOmniWithForm) {
                        addSilent("✎", "编辑后沉淀为常用语", () => {
                            this.deps.captureOmniWithForm!(entry);
                        });
                    }
                    addSilent("🧹", "清洗格式并复制 (去除断行/零宽符)", async () => {
                        const cleaned = cleanClipboardText(entry.content || "", {mergeSoftBreaks: true});
                        await this.deps.copyProviderPayload(cleaned.cleanedText);
                        this.deps.notify?.("info", `已清洗并复制: ${cleaned.changeDetails.join("、") || "文本已规整"}`);
                    });
                    if (this.deps.captureOmniWithForm) {
                        addSilent("✦", "清洗格式并存为常用语", () => {
                            const cleaned = cleanClipboardText(entry.content || "", {mergeSoftBreaks: true});
                            this.deps.captureOmniWithForm!({...entry, content: cleaned.cleanedText, summary: cleaned.cleanedText.slice(0, 100)});
                        });
                    }
                } else {
                    if (this.deps.openDocBlock) {
                        addSilent("↗", this.deps.t("locateInDoc"), () => this.deps.openDocBlock!(resolveEntryBlockId(entry) || entry.id));
                    }
                    if (this.deps.quickEditBlock) {
                        addSilent("✎", this.deps.t("quickEditBlock"), () => this.deps.quickEditBlock!(resolveEntryBlockId(entry) || entry.id, entry.content || entry.summary || ""));
                    }
                    if (this.deps.captureOmniWithForm) {
                        addSilent("✦", this.deps.t("editAndCapture"), () => this.deps.captureOmniWithForm!(entry));
                    }
                    if (this.deps.createFromOmni) {
                        addSilent("✓", this.deps.t("saveToCommon"), () => this.deps.createFromOmni!(entry));
                    }
                }
            } else {
                addSilent("↗", this.deps.t("openSource"), () => this.deps.openSource(entry.id));
                if (this.deps.openDocBlock && isBlockId(entry.blockId) && isBlockId(entry.sourceDocId) && entry.sourceDocId !== entry.libraryDocId) {
                    addSilent("📦", "在思源库文档中定位本体块", () => this.deps.openDocBlock!(entry.blockId));
                }
                if (isBlockId(entry.sourceBlockId) && entry.sourceBlockId !== entry.blockId) {
                    if (this.deps.pullFromSource) {
                        addSilent("↻", "从思源来源块拉取最新内容", () => this.deps.pullFromSource!(entry.id));
                    }
                    if (this.deps.pushToSource && entry.itemType !== "blockref") {
                        addSilent("⤴", "将本条内容回写至思源来源块", () => this.deps.pushToSource!(entry.id));
                    }
                }
                addSilent("✎", this.deps.t("edit"), () => this.deps.editItem(entry.id));
                addSilent("⧉", this.deps.t("duplicateItem"), () => this.deps.duplicateItem(entry.id));
                const rawContent = (entry.content || "").trim();
                const targetUrl = entry.url || (/^https?:\/\/\S+$/i.test(rawContent) ? rawContent : "");
                if (targetUrl) {
                    addSilent("🌐", "打开网页外链", async () => {
                        window.open(targetUrl, "_blank");
                        this.deps.notify?.("info", "已打开网页外链");
                    });
                    const mdLinkTitle = (entry.title || "链接").replace(/[[\]]/g, "");
                    const mdLink = `[${mdLinkTitle}](${targetUrl})`;
                    addSilent("🔗", `复制为 Markdown 链接: ${mdLinkTitle}`, async () => {
                        await this.deps.copyProviderPayload(mdLink);
                        this.deps.notify?.("info", `已复制 Markdown 链接: ${mdLink}`);
                    });
                }
                addSilent("📦", this.deps.t("copyCompactBundle"), async () => {
                    const raw = entry.content || await this.deps.preview(entry.id) || "";
                    const kramdowns = new Map([[entry.id, raw]]);
                    const itemObj: any = {
                        id: entry.id,
                        blockId: entry.blockId || entry.id,
                        libraryDocId: entry.libraryDocId || "",
                        itemType: entry.itemType,
                        title: entry.title,
                        alias: entry.alias || "",
                        tags: entry.tags || [],
                        category: entry.category || "",
                        summary: entry.summary || "",
                        varCount: entry.varCount || 0,
                        source: {sourceType: "manual"},
                        createdAt: entry.createdAt || Date.now(),
                        updatedAt: entry.updatedAt || Date.now(),
                    };
                    const bundle = buildBundle([itemObj], kramdowns, Date.now());
                    const code = serializeCompactBundle(bundle);
                    await this.deps.copyProviderPayload(code);
                    this.deps.notify?.("info", this.deps.t("copyCompactBundleSuccess"));
                    openShareCardDialog({
                        t: this.deps.t,
                        copyText: (text) => this.deps.copyProviderPayload(text),
                        notify: this.deps.notify,
                    }, itemObj, code);
                });

                // 界面减法（T-0754）：~180 个文本清洗/转换动作收进一个可搜索的「文本工具…」入口，默认不撑长菜单。
                const textToolsPanel = document.createElement("div");
                textToolsPanel.className = "xlc-menu-text-tools-panel";
                textToolsPanel.dataset.xlcControl = "dialog.menu.text-tools-panel";
                textToolsPanel.hidden = true;

                const textToolsSearch = document.createElement("input");
                textToolsSearch.type = "search";
                textToolsSearch.className = "b3-text-field xlc-menu-text-tools-search";
                textToolsSearch.dataset.xlcControl = "dialog.menu.text-tools-search";
                textToolsSearch.placeholder = "搜索文本工具…";
                textToolsSearch.setAttribute("aria-label", "搜索文本工具");
                textToolsSearch.addEventListener("keydown", (ev) => {
                    if (ev.key !== "Escape") ev.stopPropagation();
                });

                const textToolsList = document.createElement("div");
                textToolsList.className = "xlc-menu-text-tools-list";
                textToolsPanel.append(textToolsSearch, textToolsList);

                const textToolsToggleBtn = this.menuButton("🛠", "文本工具…", "xlc-menu-item", () => {
                    const nextOpen = textToolsPanel.hidden;
                    textToolsPanel.hidden = !nextOpen;
                    textToolsToggleBtn.setAttribute("aria-expanded", nextOpen ? "true" : "false");
                    if (nextOpen) {
                        textToolsSearch.value = "";
                        textToolsList.querySelectorAll<HTMLElement>(".xlc-menu-item").forEach((el) => {
                            el.hidden = false;
                        });
                        textToolsSearch.focus();
                    }
                });
                textToolsToggleBtn.dataset.xlcControl = "dialog.menu.text-tools-toggle";
                textToolsToggleBtn.setAttribute("aria-expanded", "false");
                sec2.appendChild(textToolsToggleBtn);
                sec2.appendChild(textToolsPanel);

                textToolsSearch.addEventListener("input", () => {
                    const kw = textToolsSearch.value.trim().toLowerCase();
                    textToolsList.querySelectorAll<HTMLElement>(".xlc-menu-item").forEach((el) => {
                        const hay = `${el.textContent ?? ""} ${el.title ?? ""}`.toLowerCase();
                        el.hidden = Boolean(kw) && !hay.includes(kw);
                    });
                });

                silentTarget = textToolsList;
                addSilent("✦", "盘古排版 (中英文加空格并复制)", async () => {
                    const raw = entry.content || await this.deps.preview(entry.id) || "";
                    const pangu = formatPanguSpacing(raw);
                    await this.deps.copyProviderPayload(pangu.result);
                    this.deps.notify?.("info", `已执行盘古排版规范化 (${pangu.spacedCount} 处间距调整)`);
                });
                addSilent("📱", "复制为公众号排版 (内联CSS)", async () => {
                    const raw = entry.content || await this.deps.preview(entry.id) || "";
                    const html = renderWechatArticleHtml(raw);
                    const plain = kramdownToPlainText(raw) || raw;
                    const ok = await writeRichClipboard(plain, html);
                    if (ok) {
                        this.deps.notify?.("info", "已复制为微信公众号专属内联排版，可直接粘贴进后台！");
                    } else {
                        await this.deps.copyProviderPayload(raw);
                    }
                });
                const jsonCheck = formatJsonText(entry.content || "");
                if (jsonCheck.formatted) {
                    addSilent("{}", this.deps.t("jsonFormat"), async () => {
                        await this.deps.copyProviderPayload(jsonCheck.result);
                        this.deps.notify?.("info", "已格式化 JSON 并复制到剪贴板");
                    });
                    const compacted = compactJsonText(entry.content || "");
                    if (compacted.compacted) {
                        addSilent("{}", this.deps.t("jsonCompact"), async () => {
                            await this.deps.copyProviderPayload(compacted.result);
                            this.deps.notify?.("info", "已压缩 JSON 并复制到剪贴板");
                        });
                    }
                }
                const urlClean = stripUrlTrackingParams(entry.content || "");
                if (urlClean.cleanedCount > 0) {
                    addSilent("🔗", `清洗 URL 追踪参数并复制 (清理 ${urlClean.cleanedCount} 个)`, async () => {
                        await this.deps.copyProviderPayload(urlClean.result);
                        this.deps.notify?.("info", `已清洗 ${urlClean.cleanedCount} 个 URL 追踪分析参数并复制`);
                    });
                }
                const listCheck = normalizeListFormatting(entry.content || "", "markdown-ol");
                if (listCheck.convertedCount > 0) {
                    addSilent("☰", "规整为标准序号列表 (1. 2. 3.)", async () => {
                        await this.deps.copyProviderPayload(listCheck.result);
                        this.deps.notify?.("info", `已规整 ${listCheck.convertedCount} 行列表并复制`);
                    });
                    const circledCheck = normalizeListFormatting(entry.content || "", "chinese-circled");
                    addSilent("①", "规整为带圈序号列表 (①②③)", async () => {
                        await this.deps.copyProviderPayload(circledCheck.result);
                        this.deps.notify?.("info", "已转为带圈序号列表并复制");
                    });
                }
                const dedupeRes = deduplicateLines(entry.content || "");
                if (dedupeRes.removedCount > 0) {
                    addSilent("✂", `消除重复行并复制 (剔除 ${dedupeRes.removedCount} 处重复)`, async () => {
                        await this.deps.copyProviderPayload(dedupeRes.result);
                        this.deps.notify?.("info", `已消除 ${dedupeRes.removedCount} 处重复行并复制`);
                    });
                }
                const compactRes = compactWhitespaceAndLines(entry.content || "", true);
                if (compactRes.trimmedLines > 0 || (entry.content && compactRes.result !== entry.content.trim())) {
                    addSilent("🧹", "压缩空行与缩进并复制", async () => {
                        await this.deps.copyProviderPayload(compactRes.result);
                        this.deps.notify?.("info", "已压缩多余空行与缩进并复制");
                    });
                }
                const contentText = (entry.content || "").trim();
                if (contentText && !contentText.includes("\n") && /[a-zA-Z]/.test(contentText) && contentText.length <= 120) {
                    const camel = transformCase(contentText, "camel");
                    if (camel && camel !== contentText) {
                        addSilent("🔤", `转驼峰 (camelCase) 并复制: ${camel}`, async () => {
                            await this.deps.copyProviderPayload(camel);
                            this.deps.notify?.("info", `已转驼峰并复制: ${camel}`);
                        });
                    }
                    const snake = transformCase(contentText, "snake");
                    if (snake && snake !== contentText) {
                        addSilent("🔤", `转下划线 (snake_case) 并复制: ${snake}`, async () => {
                            await this.deps.copyProviderPayload(snake);
                            this.deps.notify?.("info", `已转下划线并复制: ${snake}`);
                        });
                    }
                }
                if (contentText && !contentText.includes("\n") && /[+\-*/%^]/.test(contentText) && /\d/.test(contentText)) {
                    const calcVal = evaluateMathExpression(contentText);
                    if (calcVal !== null && calcVal !== contentText) {
                        addSilent("🧮", `算式求值并复制 (= ${calcVal})`, async () => {
                            await this.deps.copyProviderPayload(calcVal);
                            this.deps.notify?.("info", `已计算并复制结果: ${calcVal}`);
                        });
                    }
                }
                const halfRes = convertWidth(entry.content || "", "to-half");
                if (halfRes.convertedCount > 0) {
                    addSilent("🔤", `全角转半角并复制 (规整 ${halfRes.convertedCount} 处)`, async () => {
                        await this.deps.copyProviderPayload(halfRes.result);
                        this.deps.notify?.("info", `已转换 ${halfRes.convertedCount} 处全角字符为半角并复制`);
                    });
                }
                if (entry.content && entry.content.trim()) {
                    addSilent(">", "切换 Markdown 引用 (>) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const toggled = toggleMarkdownBlockquote(raw);
                        await this.deps.copyProviderPayload(toggled.result);
                        this.deps.notify?.("info", toggled.isWrapped ? "已添加 Markdown 引用语法并复制" : "已解开 Markdown 引用语法并复制");
                    });
                }
                if (contentText && contentText.length <= 500 && !contentText.includes("\n")) {
                    addSilent("🔒", "Base64 编码并复制", async () => {
                        const b64 = encodeBase64(contentText);
                        await this.deps.copyProviderPayload(b64);
                        this.deps.notify?.("info", "已生成 Base64 编码并复制到剪贴板");
                    });
                    const b64Dec = decodeBase64(contentText);
                    if (b64Dec.ok && b64Dec.result !== contentText && b64Dec.result.length > 0) {
                        addSilent("🔓", `Base64 解码并复制: ${b64Dec.result.slice(0, 30)}`, async () => {
                            await this.deps.copyProviderPayload(b64Dec.result);
                            this.deps.notify?.("info", "已解码 Base64 文本并复制");
                        });
                    }
                    const urlEnc = encodeUrlText(contentText, true);
                    if (urlEnc !== contentText) {
                        addSilent("🔗", "URL 组件编码并复制", async () => {
                            await this.deps.copyProviderPayload(urlEnc);
                            this.deps.notify?.("info", "已进行 URL 编码并复制");
                        });
                    }
                    if (contentText.includes("%")) {
                        const urlDec = decodeUrlText(contentText, true);
                        if (urlDec.ok && urlDec.result !== contentText) {
                            addSilent("🔗", `URL 解码并复制: ${urlDec.result.slice(0, 30)}`, async () => {
                                await this.deps.copyProviderPayload(urlDec.result);
                                this.deps.notify?.("info", "已进行 URL 解码并复制");
                            });
                        }
                    }
                }
                if (entry.content && entry.content.includes("|") && entry.content.includes("\n")) {
                    const tableCheck = formatMarkdownTable(entry.content);
                    if (tableCheck.isTable && tableCheck.result !== entry.content.trim()) {
                        addSilent("⊞", `规整对齐 Markdown 表格 (${tableCheck.rowCount}行${tableCheck.colCount}列)`, async () => {
                            await this.deps.copyProviderPayload(tableCheck.result);
                            this.deps.notify?.("info", `已规整对齐 ${tableCheck.rowCount} 行 Markdown 表格并复制`);
                        });
                    }
                }
                if (contentText && (contentText.includes("<") || contentText.includes(">") || contentText.includes("&"))) {
                    if (/&(?:amp|lt|gt|quot|#39);/i.test(contentText)) {
                        const unescaped = unescapeHtmlEntities(contentText);
                        if (unescaped !== contentText) {
                            addSilent("✦", "还原 HTML 实体并复制", async () => {
                                await this.deps.copyProviderPayload(unescaped);
                                this.deps.notify?.("info", "已还原 HTML 实体并复制");
                            });
                        }
                    } else {
                        const escaped = escapeHtmlEntities(contentText);
                        if (escaped !== contentText) {
                            addSilent("✦", "转义 HTML 实体并复制", async () => {
                                await this.deps.copyProviderPayload(escaped);
                                this.deps.notify?.("info", "已转义 HTML 实体并复制");
                            });
                        }
                    }
                }
                if (entry.content && /[-*+]\s+\[[ xX]\]/.test(entry.content)) {
                    addSilent("☐", "全部重置待办状态 (- [ ]) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const res = toggleMarkdownTaskStatus(raw, "uncheck-all");
                        await this.deps.copyProviderPayload(res.result);
                        this.deps.notify?.("info", `已重置 ${res.changedCount} 项待办状态并复制`);
                    });
                    addSilent("☑", "全部完成待办状态 (- [x]) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const res = toggleMarkdownTaskStatus(raw, "check-all");
                        await this.deps.copyProviderPayload(res.result);
                        this.deps.notify?.("info", `已完成 ${res.changedCount} 项待办状态并复制`);
                    });
                }
                if (entry.content && entry.content.includes("\n") && (entry.content.includes(",") || entry.content.includes("\t") || entry.content.includes(";"))) {
                    const csvCheck = csvToJson(entry.content);
                    if (csvCheck.ok && csvCheck.count > 0) {
                        addSilent("{}", `转为 JSON 数组并复制 (${csvCheck.count}条记录)`, async () => {
                            await this.deps.copyProviderPayload(csvCheck.result);
                            this.deps.notify?.("info", `已转换 ${csvCheck.count} 条表格记录为 JSON 数组并复制`);
                        });
                    }
                }
                if (entry.content && (/\]\([a-zA-Z0-9+.-]+:[^)]+\)/.test(entry.content) || /https?:\/\//.test(entry.content))) {
                    addSilent("🔗", "提取链接清单并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const linksRes = extractMarkdownLinks(raw, {outputFormat: "list"});
                        if (linksRes.count > 0) {
                            await this.deps.copyProviderPayload(linksRes.result);
                            this.deps.notify?.("info", `已提取 ${linksRes.count} 个链接清单并复制`);
                        } else {
                            this.deps.notify?.("info", "未检测到有效链接");
                        }
                    });
                }
                if (entry.content && entry.content.trim()) {
                    addSilent("#", "计算散列指纹 (FNV-1a) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const hash = generateTextHash(raw, "fnv1a");
                        if (hash) {
                            await this.deps.copyProviderPayload(hash);
                            this.deps.notify?.("info", `已计算散列指纹 ${hash} 并复制`);
                        }
                    });
                }
                if (entry.content && entry.content.includes("\n")) {
                    addSilent("🔤", "英文标题大小写规整 (Title Case) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const formatted = titleCaseLines(raw, {style: "title"});
                        await this.deps.copyProviderPayload(formatted);
                        this.deps.notify?.("info", "已规整英文标题大小写并复制");
                    });
                    addSilent("↕", "多行倒序 (Reverse Lines) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const reversed = reverseLines(raw);
                        await this.deps.copyProviderPayload(reversed);
                        this.deps.notify?.("info", "已反转多行文本顺序并复制");
                    });
                    addSilent("🔢", "批量编号多行文本 (1. 2. ) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const numbered = numberLines(raw, {format: "decimal"});
                        await this.deps.copyProviderPayload(numbered.result);
                        this.deps.notify?.("info", `已为 ${numbered.numberedCount} 行添加编号并复制`);
                    });
                    addSilent("📏", "按行长度升序排列并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const sorted = sortLinesByLength(raw, {descending: false});
                        await this.deps.copyProviderPayload(sorted);
                        this.deps.notify?.("info", "已按行长度升序排列并复制");
                    });
                    addSilent("🧹", "行首尾空白修剪并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const res = trimLinesAdvanced(raw);
                        await this.deps.copyProviderPayload(res.result);
                        this.deps.notify?.("info", `已修剪行首尾空白并复制`);
                    });
                    addSilent("✂", "剥离列表/引用前缀并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const res = stripAffixes(raw, {prefix: "list"});
                        await this.deps.copyProviderPayload(res.result);
                        this.deps.notify?.("info", `已剥离 ${res.strippedCount} 处列表前缀并复制`);
                    });
                    addSilent("🔗", "多行合并为逗号行并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const joined = joinLinesWithDelimiter(raw, ", ");
                        await this.deps.copyProviderPayload(joined);
                        this.deps.notify?.("info", "已合并多行为逗号分隔单行并复制");
                    });
                    addSilent("🔀", "随机打乱行顺序 (Shuffle Lines) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const shuffled = shuffleLines(raw);
                        await this.deps.copyProviderPayload(shuffled);
                        this.deps.notify?.("info", "已随机打乱多行文本顺序并复制");
                    });
                    addSilent("🔍", "过滤非空非注释行并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const filtered = filterLines(raw, /^\s*[^#\/\s]/);
                        await this.deps.copyProviderPayload(filtered.result);
                        this.deps.notify?.("info", `已保留 ${filtered.matchedCount} 行有效正文并复制`);
                    });
                    addSilent("📐", "多行等宽对齐排版并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const padded = padLines(raw, {align: "left"});
                        await this.deps.copyProviderPayload(padded);
                        this.deps.notify?.("info", "已等宽对齐排版多行并复制");
                    });
                    if (entry.content.includes("\n\n")) {
                        addSilent("🧹", "折叠多余连续空行并复制", async () => {
                            const raw = entry.content || await this.deps.preview(entry.id) || "";
                            const res = compactBlankLines(raw, {maxConsecutive: 1});
                            await this.deps.copyProviderPayload(res.result);
                            this.deps.notify?.("info", `已压缩 ${res.collapsedCount} 个多余空行并复制`);
                        });
                    }
                    addSilent("🔄", "多行双边双引号包裹并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const surrounded = surroundEachLine(raw, '"');
                        await this.deps.copyProviderPayload(surrounded);
                        this.deps.notify?.("info", "已双边包裹多行并复制");
                    });
                    if (entry.content.startsWith("  ") || entry.content.includes("\n  ")) {
                        addSilent("⇥", "缩进转换 (空格转Tab) 并复制", async () => {
                            const raw = entry.content || await this.deps.preview(entry.id) || "";
                            const converted = convertIndentation(raw, "spaces-to-tabs", 4);
                            await this.deps.copyProviderPayload(converted);
                            this.deps.notify?.("info", "已将空格缩进转换为制表符并复制");
                        });
                    }
                    if (/\d+/.test(entry.content)) {
                        addSilent("🧮", "多行数值求和与统计并复制", async () => {
                            const raw = entry.content || await this.deps.preview(entry.id) || "";
                            const summary = sumNumericLines(raw);
                            await this.deps.copyProviderPayload(summary.result);
                            this.deps.notify?.("info", `数值汇总：${summary.result}`);
                        });
                    }
                    if (entry.content.includes(" ") || entry.content.includes("\t") || entry.content.includes(",")) {
                        addSilent("📑", "提取多行第 1 列并复制", async () => {
                            const raw = entry.content || await this.deps.preview(entry.id) || "";
                            const col1 = extractColumnFromLines(raw, 1);
                            await this.deps.copyProviderPayload(col1);
                            this.deps.notify?.("info", "已提取多行第 1 列数据并复制");
                        });
                        addSilent("🔄", "多行多列表格行列转置并复制", async () => {
                            const raw = entry.content || await this.deps.preview(entry.id) || "";
                            const transposed = transposeMatrixText(raw);
                            await this.deps.copyProviderPayload(transposed);
                            this.deps.notify?.("info", "已行列转置并复制");
                        });
                    }
                    addSilent("🔍", "与当前条目草稿进行行级比对并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const diff = diffLinesQuick(raw, raw.trim());
                        await this.deps.copyProviderPayload(diff.diffResult);
                        this.deps.notify?.("info", `已生成行级比对结果 (${diff.unchangedCount}行一致)`);
                    });
                    if (entry.content.split("\n").filter(Boolean).length >= 2) {
                        addSilent("🔗", "前半段与后半段多行两两配对并复制", async () => {
                            const raw = entry.content || await this.deps.preview(entry.id) || "";
                            const lines = raw.split("\n").filter(Boolean);
                            const half = Math.ceil(lines.length / 2);
                            const firstHalf = lines.slice(0, half).join("\n");
                            const secondHalf = lines.slice(half).join("\n");
                            const zipped = zipLines(firstHalf, secondHalf, {separator: ": "});
                            await this.deps.copyProviderPayload(zipped);
                            this.deps.notify?.("info", "已配对合并两段列表并复制");
                        });
                    }
                    if (entry.content.includes("---")) {
                        const parts = entry.content.split(/\n\s*---\s*\n/);
                        if (parts.length >= 2) {
                            addSilent("⊖", "前后两段列表多行求差集 (A - B) 并复制", async () => {
                                const raw = entry.content || await this.deps.preview(entry.id) || "";
                                const [pA, pB] = raw.split(/\n\s*---\s*\n/);
                                const res = setOperationsOnLines(pA || "", pB || "", "difference");
                                await this.deps.copyProviderPayload(res);
                                this.deps.notify?.("info", "已计算两段差集 (A - B) 并复制");
                            });
                            addSilent("∪", "前后两段列表多行求并集 (A ∪ B) 并复制", async () => {
                                const raw = entry.content || await this.deps.preview(entry.id) || "";
                                const [pA, pB] = raw.split(/\n\s*---\s*\n/);
                                const res = setOperationsOnLines(pA || "", pB || "", "union");
                                await this.deps.copyProviderPayload(res);
                                this.deps.notify?.("info", "已合并两段并集去重 (A ∪ B) 并复制");
                            });
                            addSilent("🔀", "前后两段列表多行交替穿插合并并复制", async () => {
                                const raw = entry.content || await this.deps.preview(entry.id) || "";
                                const [pA, pB] = raw.split(/\n\s*---\s*\n/);
                                const res = interleaveLines(pA || "", pB || "");
                                await this.deps.copyProviderPayload(res);
                                this.deps.notify?.("info", "已交替穿插合并两段列表并复制");
                            });
                        }
                    }
                }
                if (entry.content && (/(get_|set_|is_|has_)/i.test(entry.content) || /(_id|_ids|Dto|DTO|VO|Vo)\b/.test(entry.content))) {
                    addSilent("✂", "批量剥离常见代码词缀 (get_/is_/_id/Dto) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const res = stripAffixWords(raw, {
                            prefix: /^(get_|set_|is_|has_)/i,
                            suffix: /(_id|_ids|Dto|DTO|VO|Vo)$/,
                        });
                        await this.deps.copyProviderPayload(res);
                        this.deps.notify?.("info", "已剥离常见变量词缀并复制");
                    });
                }
                if (entry.content && /^(0x[0-9a-fA-F]+|\d+|0b[01]+)$/.test(entry.content.trim())) {
                    const trimmed = entry.content.trim();
                    if (/^\d+$/.test(trimmed)) {
                        addSilent("🔢", "数值转十六进制 (DEC→HEX) 并复制", async () => {
                            const res = convertRadix(trimmed, 10, 16, {prefix: true, uppercase: true});
                            await this.deps.copyProviderPayload(res);
                            this.deps.notify?.("info", `已转换十六进制：${res}`);
                        });
                        addSilent("🔢", "数值转二进制 (DEC→BIN) 并复制", async () => {
                            const res = convertRadix(trimmed, 10, 2, {prefix: true});
                            await this.deps.copyProviderPayload(res);
                            this.deps.notify?.("info", `已转换二进制：${res}`);
                        });
                    } else if (trimmed.startsWith("0x") || /^[0-9a-fA-F]+$/.test(trimmed)) {
                        addSilent("🔢", "十六进制转十进制 (HEX→DEC) 并复制", async () => {
                            const res = convertRadix(trimmed, 16, 10);
                            await this.deps.copyProviderPayload(res);
                            this.deps.notify?.("info", `已转换十进制：${res}`);
                        });
                    }
                }
                if (entry.content && entry.content.includes("\n") && (entry.content.includes("\t") || entry.content.includes(",") || entry.content.includes("|"))) {
                    addSilent("📊", "按第 1 列对多行数据排序并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const sorted = sortLinesByColumn(raw, 1);
                        await this.deps.copyProviderPayload(sorted);
                        this.deps.notify?.("info", "已按第 1 列排序多行并复制");
                    });
                    addSilent("📊", "按第 2 列数值/字典序对多行排序并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const sorted = sortLinesByColumn(raw, 2, {numeric: true});
                        await this.deps.copyProviderPayload(sorted);
                        this.deps.notify?.("info", "已按第 2 列排序多行并复制");
                    });
                }
                if (entry.content && !entry.content.includes("\n") && entry.content.includes("&") && entry.content.includes("=")) {
                    addSilent("🔑", "解析 URL 查询串为换行键值对并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const kv = parseKeyValuePairs(raw);
                        const formatted = Object.entries(kv).map(([k, v]) => `${k}: ${v}`).join("\n");
                        await this.deps.copyProviderPayload(formatted);
                        this.deps.notify?.("info", `已解析 ${Object.keys(kv).length} 个键值对并复制`);
                    });
                }
                if (entry.content && /^\d{4}-\d{2}-\d{2}$/.test(entry.content.trim())) {
                    addSilent("📅", "重构日期为中文格式 (YYYY年MM月DD日) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const formatted = formatByRegexGroups(raw.trim(), /(\d{4})-(\d{2})-(\d{2})/, "$1年$2月$3日");
                        await this.deps.copyProviderPayload(formatted);
                        this.deps.notify?.("info", `已格式化日期：${formatted}`);
                    });
                }
                if (entry.content && (entry.content.includes('"') || entry.content.includes("'") || entry.content.includes("“") || entry.content.includes("「"))) {
                    addSilent("“”", "规范化引号为中文弯引号 (“”) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const formatted = normalizeSmartQuotes(raw, "curly");
                        await this.deps.copyProviderPayload(formatted);
                        this.deps.notify?.("info", "已统一引号为中文规范弯引号并复制");
                    });
                    addSilent("「」", "规范化引号为直角引号 (「」) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const formatted = normalizeSmartQuotes(raw, "corner");
                        await this.deps.copyProviderPayload(formatted);
                        this.deps.notify?.("info", "已统一引号为直角引号并复制");
                    });
                }
                if (entry.content && ((entry.content.includes("{") && entry.content.includes(":")) || (entry.content.includes("=") && entry.content.includes("\n")))) {
                    addSilent("🔤", "转换属性键名为驼峰命名 (camelCase) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const res = convertObjectKeysCase(raw, "camel");
                        await this.deps.copyProviderPayload(res);
                        this.deps.notify?.("info", "已转换属性键名为驼峰并复制");
                    });
                    addSilent("🔤", "转换属性键名为蛇形命名 (snake_case) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const res = convertObjectKeysCase(raw, "snake");
                        await this.deps.copyProviderPayload(res);
                        this.deps.notify?.("info", "已转换属性键名为下划线并复制");
                    });
                }
                if (entry.content && /^(\s*#{1,6}\s+)/m.test(entry.content)) {
                    addSilent("📑", "标题层级批量降一级 (H1->H2) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const res = shiftMarkdownHeadings(raw, 1);
                        await this.deps.copyProviderPayload(res.result);
                        this.deps.notify?.("info", `已降级 ${res.shiftedCount} 处标题并复制`);
                    });
                    addSilent("📑", "标题层级批量升一级 (H2->H1) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const res = shiftMarkdownHeadings(raw, -1);
                        await this.deps.copyProviderPayload(res.result);
                        this.deps.notify?.("info", `已升级 ${res.shiftedCount} 处标题并复制`);
                    });
                }
                if (entry.content && entry.content.includes("\n")) {
                    addSilent("🔤", "每行补齐单引号与逗号 ('...',) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const res = ensureLineAffixes(raw, {prefix: "'", suffix: "',"});
                        await this.deps.copyProviderPayload(res);
                        this.deps.notify?.("info", "已为每行补齐单引号与逗号并复制");
                    });
                    addSilent("💬", "批量切换代码行注释 (//) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const res = toggleLineComments(raw, "// ");
                        await this.deps.copyProviderPayload(res.result);
                        this.deps.notify?.("info", res.mode === "comment" ? `已添加注释 (${res.changedLines}行)` : `已移除注释 (${res.changedLines}行)`);
                    });
                    addSilent("➡️", "多行整体增加 2 空格缩进并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const indented = indentLines(raw, 2);
                        await this.deps.copyProviderPayload(indented);
                        this.deps.notify?.("info", "已多行整体缩进 2 空格并复制");
                    });
                    addSilent("⬅️", "多行整体反向减少 2 空格缩进并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const outdented = outdentLines(raw, 2);
                        await this.deps.copyProviderPayload(outdented);
                        this.deps.notify?.("info", "已多行整体减缩进 2 空格并复制");
                    });
                    addSilent("📑", "为多行文本每行行首补齐项目符号 (- ) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const res = regexReplaceMultiline(raw, "^(?!$)", "- ");
                        await this.deps.copyProviderPayload(res);
                        this.deps.notify?.("info", "已为每行行首补齐项目符号并复制");
                    });
                    addSilent("💬", "引用层级批量升一级 (> -> >>) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const res = shiftMarkdownBlockquotes(raw, 1);
                        await this.deps.copyProviderPayload(res.result);
                        this.deps.notify?.("info", `已升高 ${res.shiftedCount} 行引用层级并复制`);
                    });
                    addSilent("💬", "引用层级批量降一级 (>> -> >) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const res = shiftMarkdownBlockquotes(raw, -1);
                        await this.deps.copyProviderPayload(res.result);
                        this.deps.notify?.("info", `已降低 ${res.shiftedCount} 行引用层级并复制`);
                    });
                    if (entry.content.includes(",") || entry.content.includes(":") || entry.content.includes(";")) {
                        addSilent("📐", "按分隔符等宽对齐多列并复制", async () => {
                            const raw = entry.content || await this.deps.preview(entry.id) || "";
                            const delim = raw.includes(",") ? "," : (raw.includes(":") ? ":" : ";");
                            const aligned = alignDelimitedColumns(raw, delim);
                            await this.deps.copyProviderPayload(aligned);
                            this.deps.notify?.("info", "已等宽对齐各列并复制");
                        });
                    }
                }
                if (entry.content && entry.content.includes("|") && entry.content.includes("\n") && (entry.content.includes("-|-") || entry.content.includes("---|---"))) {
                    addSilent("⊞", "Markdown 表格按第 1 列排除空值行并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const filtered = filterMarkdownTable(raw, 1, (v) => v.trim().length > 0);
                        await this.deps.copyProviderPayload(filtered);
                        this.deps.notify?.("info", "已过滤表格空值行并复制");
                    });
                }
                if (entry.content && !entry.content.includes("\n") && (entry.content.includes("@") || /^\d{11}$/.test(entry.content.trim()) || /^https?:\/\//.test(entry.content.trim()))) {
                    const trimmed = entry.content.trim();
                    const type = trimmed.includes("@") ? "email" : (/^\d{11}$/.test(trimmed) ? "phone" : "url");
                    const valid = validateFormat(trimmed, type);
                    addSilent(valid ? "✅" : "❌", `校验是否为合法 ${type} (${valid ? "合法" : "非法"}) 并复制`, async () => {
                        await this.deps.copyProviderPayload(String(valid));
                        this.deps.notify?.("info", `${type} 格式校验结果: ${valid ? "规范合法" : "格式非法"}`);
                    });
                }
                if (entry.content && (entry.content.includes(":") || entry.content.includes("：") || entry.content.includes("->") || entry.content.includes(","))) {
                    addSilent("🔄", "对调每行前后两部分位置并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const swapped = swapLineParts(raw);
                        await this.deps.copyProviderPayload(swapped);
                        this.deps.notify?.("info", "已对调行前后部分并复制");
                    });
                }
                if (entry.content && !entry.content.includes("\n") && (entry.content.includes("/") || entry.content.includes("\\")) && entry.content.includes(".")) {
                    addSilent("📁", "提取路径文件名与基本名并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const parts = parsePathParts(raw);
                        const res = `${parts.filename} (基本名: ${parts.stem}, 扩展名: ${parts.ext})`;
                        await this.deps.copyProviderPayload(parts.filename);
                        this.deps.notify?.("info", `提取文件信息：${res}`);
                    });
                }
                if (entry.content && (entry.content.includes("(") || entry.content.includes("[") || entry.content.includes("{") || entry.content.includes("《") || entry.content.includes("「"))) {
                    addSilent("🔍", "检测标点与括号闭合平衡性", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const res = checkBracketsBalance(raw);
                        if (res.isBalanced) {
                            this.deps.notify?.("info", "✓ 括号配对完全闭合平衡");
                        } else {
                            this.deps.notify?.("error", `⚠ 括号未闭合: ${res.errorSummary}`);
                        }
                    });
                }
                if (entry.content && (entry.content.includes("{") && entry.content.includes("}")) && entry.content.includes("---")) {
                    addSilent("📑", "按 --- 分割渲染变量模板并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const [tpl, data] = raw.split(/\n\s*---\s*\n/);
                        const res = renderSimpleTemplate(tpl || "", data || "");
                        await this.deps.copyProviderPayload(res);
                        this.deps.notify?.("info", "已完成模板变量渲染并复制");
                    });
                }
                if (entry.content && entry.content.includes("\n") && entry.content.split("\n").filter(Boolean).length >= 3) {
                    addSilent("📊", "统计多行频次去重并按热度排序复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const res = deduplicateWithCount(raw, {sortByCount: true, formatTemplate: "{line} (出现 {count} 次)"});
                        await this.deps.copyProviderPayload(res);
                        this.deps.notify?.("info", "已统计多行出现频次并排序复制");
                    });
                }
                if (entry.content && (entry.content.includes("，") || entry.content.includes("。") || entry.content.includes(",") || entry.content.includes("."))) {
                    addSilent("🀄", "中英混排自适应标点纠错并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const res = normalizePunctuationAdaptive(raw);
                        await this.deps.copyProviderPayload(res.result);
                        this.deps.notify?.("info", `已自适应规范 ${res.convertedCount} 处标点符号并复制`);
                    });
                }
                if (entry.content && /[a-zA-Z]/.test(entry.content)) {
                    addSilent("🔒", "ROT13 对称可逆混淆/解密并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const obfuscated = obfuscateText(raw, "rot13");
                        await this.deps.copyProviderPayload(obfuscated);
                        this.deps.notify?.("info", "已完成 ROT13 混淆/还原并复制");
                    });
                }
                if (entry.content && entry.content.length > 10) {
                    const codeInfo = detectCodeLanguage(entry.content);
                    if (codeInfo.isCode) {
                        addSilent("💻", `包装为 ${codeInfo.language} 代码块并复制`, async () => {
                            const raw = entry.content || await this.deps.preview(entry.id) || "";
                            const wrapped = `\`\`\`${codeInfo.language}\n${raw}\n\`\`\``;
                            await this.deps.copyProviderPayload(wrapped);
                            this.deps.notify?.("info", `已识别为 ${codeInfo.language} 并生成代码块复制`);
                        });
                    }
                }
                if (entry.content && !entry.content.includes("\n") && entry.content.includes(" ")) {
                    addSilent("🔀", "随机打乱句子单词顺序 (洗牌) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const scrambled = scrambleText(raw, "words");
                        await this.deps.copyProviderPayload(scrambled);
                        this.deps.notify?.("info", "已打乱句子单词顺序并复制");
                    });
                }
                if (entry.content && (/[！？!?~～]{2,}/.test(entry.content) || /[.。]{3,}/.test(entry.content))) {
                    addSilent("🧹", "压缩冗余连续重复标点并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const res = compactRepeatedCharacters(raw, 1);
                        await this.deps.copyProviderPayload(res.result);
                        this.deps.notify?.("info", `已压缩 ${res.compressedCount} 处冗余重复标点并复制`);
                    });
                }
                if (entry.content && !entry.content.includes("\n") && entry.content.length > 0) {
                    addSilent("🔏", "计算 CRC32 校验和并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const checksum = calculateChecksum(raw.trim(), "crc32");
                        await this.deps.copyProviderPayload(checksum);
                        this.deps.notify?.("info", `CRC32 校验和：${checksum}`);
                    });
                }
                if (entry.content && (entry.content.includes("//") || entry.content.includes("/*") || entry.content.includes("#"))) {
                    addSilent("🧹", "剥离代码单行与块级注释并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const res = stripCodeComments(raw);
                        await this.deps.copyProviderPayload(res.result);
                        this.deps.notify?.("info", `已剥离 ${res.removedCount} 处注释并复制`);
                    });
                }
                if (entry.content && entry.content.includes("\n") && (/\[[A-Z0-9_-]+\]/m.test(entry.content) || /^[A-Za-z0-9_\u4e00-\u9fa5]+\s*[:：]/m.test(entry.content))) {
                    addSilent("📑", "按前缀模式分组聚合多行并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const res = groupLinesByPattern(raw);
                        await this.deps.copyProviderPayload(res);
                        this.deps.notify?.("info", "已按前缀分组聚合多行并复制");
                    });
                }
                if (entry.content && /^\s*(?:(?:\*[\s]*){3,}|(?:-[\s]*){3,}|(?:_[\s]*){3,})\s*$/m.test(entry.content)) {
                    addSilent("📏", "规范化分割线 (防误伤标题) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const res = normalizeHorizontalRules(raw, "---");
                        await this.deps.copyProviderPayload(res.result);
                        this.deps.notify?.("info", `已规范化 ${res.normalizedCount} 处水平分割线并复制`);
                    });
                }
                if (entry.content && entry.content.includes("|") && /\|?\s*[-:]+\s*\|/.test(entry.content)) {
                    addSilent("📊", "批量转换表格列居中对齐并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const aligned = alignMarkdownTableColumns(raw, "center");
                        await this.deps.copyProviderPayload(aligned);
                        this.deps.notify?.("info", "已批量设置表格列居中对齐并复制");
                    });
                    addSilent("📊", "批量转换表格列靠右对齐并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const aligned = alignMarkdownTableColumns(raw, "right");
                        await this.deps.copyProviderPayload(aligned);
                        this.deps.notify?.("info", "已批量设置表格列靠右对齐并复制");
                    });
                    addSilent("📊", "转换 Markdown 表格为 CSV 格式并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const csv = markdownTableToDelimited(raw, "csv");
                        await this.deps.copyProviderPayload(csv);
                        this.deps.notify?.("info", "已将表格导出为标准 CSV 格式并复制");
                    });
                }
                if (entry.content && (entry.content.includes("\u00A0") || /[ \t]+$/m.test(entry.content) || entry.content.includes("\r"))) {
                    addSilent("🧼", "清理行尾空格与 NBSP 隐形空格并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const res = sanitizeLineEndingsAndSpaces(raw);
                        await this.deps.copyProviderPayload(res.result);
                        this.deps.notify?.("info", `已清洗 ${res.fixedCount} 处隐形与多余空白并复制`);
                    });
                }
                if (entry.content && (entry.content.includes("_") || /[a-z][A-Z]/.test(entry.content))) {
                    addSilent("🐫", "变量命名法转驼峰 (camelCase) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const converted = convertIdentifierNamingStyle(raw, "camel");
                        await this.deps.copyProviderPayload(converted);
                        this.deps.notify?.("info", "已将变量名转换为驼峰式并复制");
                    });
                    addSilent("🐍", "变量命名法转下划线 (snake_case) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const converted = convertIdentifierNamingStyle(raw, "snake");
                        await this.deps.copyProviderPayload(converted);
                        this.deps.notify?.("info", "已将变量名转换为下划线并复制");
                    });
                }
                if (entry.content && entry.content.length > 0 && entry.content.length < 50 && !entry.content.includes("\n")) {
                    addSilent("📏", "定长宽度补齐至 20 字符并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const padded = padOrTruncate(raw, 20);
                        await this.deps.copyProviderPayload(padded);
                        this.deps.notify?.("info", "已定长补齐并复制");
                    });
                }
                if (entry.content && /^\s*(\d+)\s*(?:[~-]|至|\.\.)\s*(\d+)\s*$/m.test(entry.content)) {
                    addSilent("🔢", "根据数字区间生成序列清单并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const match = raw.match(/^\s*(\d+)\s*(?:[~-]|至|\.\.)\s*(\d+)\s*$/m);
                        if (match) {
                            const seq = generateNumericSequence(parseInt(match[1]!, 10), parseInt(match[2]!, 10));
                            await this.deps.copyProviderPayload(seq);
                            this.deps.notify?.("info", "已生成数字区间序列并复制");
                        }
                    });
                }
                if (entry.content && (/^\s*[-*+]\s+/m.test(entry.content) || /^\s*\d+[.)]\s+/m.test(entry.content))) {
                    addSilent("🔢", "转换为有序数字列表 (1. 2. 3.) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const converted = convertListStyle(raw, "ordered");
                        await this.deps.copyProviderPayload(converted);
                        this.deps.notify?.("info", "已转换为有序列表并复制");
                    });
                    addSilent("•", "转换为无序圆点列表 (- ) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const converted = convertListStyle(raw, "unordered");
                        await this.deps.copyProviderPayload(converted);
                        this.deps.notify?.("info", "已转换为无序列表并复制");
                    });
                }
                if (entry.content && /^\s*(?:[-*+]|\d+[.)])\s+\[[ xX]\]/m.test(entry.content)) {
                    addSilent("📋", "仅提取未完成待办事项 (- [ ]) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const filtered = filterTaskItems(raw, "pending");
                        await this.deps.copyProviderPayload(filtered);
                        this.deps.notify?.("info", "已筛选未完成待办并复制");
                    });
                    addSilent("✅", "仅提取已完成待办事项 (- [x]) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const filtered = filterTaskItems(raw, "completed");
                        await this.deps.copyProviderPayload(filtered);
                        this.deps.notify?.("info", "已筛选已完成待办并复制");
                    });
                }
                if (entry.content && entry.content.length > 0) {
                    addSilent("🏷", "计算 8 位轻量指纹 (Fingerprint) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const hash = generateShortHash(raw, 8);
                        await this.deps.copyProviderPayload(hash);
                        this.deps.notify?.("info", `指纹：${hash} (已复制)`);
                    });
                }
                if (entry.content && /^\s*\d+[.)]\s+/m.test(entry.content)) {
                    addSilent("🔢", "重新按序重整列表编号 (1, 2, 3...) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const renumbered = renumberOrderedList(raw);
                        await this.deps.copyProviderPayload(renumbered);
                        this.deps.notify?.("info", "已重整有序列表编号并复制");
                    });
                }
                if (entry.content && entry.content.includes("\n") && entry.content.includes("//")) {
                    addSilent("🔍", "仅保留以 // 开头的注释行并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const filtered = filterLinesByAffix(raw, "//", "prefix");
                        await this.deps.copyProviderPayload(filtered);
                        this.deps.notify?.("info", "已筛选前缀匹配行并复制");
                    });
                }
                if (entry.content && entry.content.length > 0 && entry.content.length < 20) {
                    addSilent("🎨", "生成随机 HEX 颜色值并复制", async () => {
                        const color = generateRandomColor("hex", {tone: "vibrant"});
                        await this.deps.copyProviderPayload(color);
                        this.deps.notify?.("info", `随机颜色：${color} (已复制)`);
                    });
                }
                if (entry.content && /\[([^\]]+)\]\(([^)]+)\)/.test(entry.content)) {
                    addSilent("🔗", "提取所有 Markdown 链接 URL 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const urls = convertMarkdownLinks(raw, "bare_url");
                        await this.deps.copyProviderPayload(urls);
                        this.deps.notify?.("info", "已提取链接目标 URL 并复制");
                    });
                    addSilent("🔗", "剥离链接保留纯文本标题并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const stripped = convertMarkdownLinks(raw, "strip");
                        await this.deps.copyProviderPayload(stripped);
                        this.deps.notify?.("info", "已剥离链接标记并复制");
                    });
                }
                if (entry.content && entry.content.length > 200) {
                    addSilent("✂", "截断至 255 字节上限 (防超长截断) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const truncated = truncateByBytes(raw, 255, {ellipsis: true});
                        await this.deps.copyProviderPayload(truncated);
                        this.deps.notify?.("info", "已按 255 字节安全截断并复制");
                    });
                }
                if (entry.content && (entry.content.includes("，") || entry.content.includes("。") || entry.content.includes(","))) {
                    addSilent("🔤", "规整中英标点空格排版并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const formatted = formatPunctuationSpacing(raw);
                        await this.deps.copyProviderPayload(formatted);
                        this.deps.notify?.("info", "已规整中英标点空格排版并复制");
                    });
                }
                if (entry.content && entry.content.includes("|") && /\|?\s*[-:]+\s*\|/.test(entry.content)) {
                    addSilent("📋", "转换 Markdown 表格为 YAML 键值对并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const yaml = markdownTableToKeyValue(raw, {format: "yaml"});
                        await this.deps.copyProviderPayload(yaml);
                        this.deps.notify?.("info", "已转换为 YAML 键值对并复制");
                    });
                }
                if (entry.content && /[\u4e00-\u9fa5]/.test(entry.content)) {
                    addSilent("🔤", "提取汉字拼音首字母缩写并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const initials = extractChinesePinyinInitials(raw);
                        await this.deps.copyProviderPayload(initials);
                        this.deps.notify?.("info", `拼音首字母：${initials} (已复制)`);
                    });
                }
                if (entry.content && (/\n\s*\n\s*\n/.test(entry.content) || /^\s*\n|\n\s*$/.test(entry.content))) {
                    addSilent("🧹", "严格压缩多余空行并修剪首尾并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const res = normalizeBlankLinesStrict(raw, 1);
                        await this.deps.copyProviderPayload(res.result);
                        this.deps.notify?.("info", `已压缩 ${res.cleanedLines} 处多余空行并复制`);
                    });
                }
                if (entry.content && (entry.content.includes(":") || entry.content.includes("=")) && !entry.content.includes("|")) {
                    addSilent("📊", "转换键值对为 Markdown 表格并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const table = keyValueToMarkdownTable(raw);
                        await this.deps.copyProviderPayload(table);
                        this.deps.notify?.("info", "已转换为 Markdown 表格并复制");
                    });
                }
                if (entry.content && /^#{1,6}\s+/m.test(entry.content)) {
                    addSilent("📑", "提取多级标题目录 (TOC) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const toc = generateMarkdownToc(raw);
                        await this.deps.copyProviderPayload(toc);
                        this.deps.notify?.("info", "已生成大纲目录 TOC 并复制");
                    });
                }
                if (entry.content && /^```/m.test(entry.content)) {
                    addSilent("🏷", "批量为代码块补全 ts 语言高亮并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const res = setMarkdownCodeFenceLang(raw, "ts");
                        await this.deps.copyProviderPayload(res);
                        this.deps.notify?.("info", "已批量设置代码块语言并复制");
                    });
                }
                if (entry.content && entry.content.includes("|")) {
                    addSilent("🛡", "转义宏参数管道符 (\\|) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const escaped = escapeMacroPipe(raw, "escape");
                        await this.deps.copyProviderPayload(escaped);
                        this.deps.notify?.("info", "已转义管道符并复制");
                    });
                }
                if (entry.content && entry.content.split("\n").length >= 6) {
                    addSilent("📑", "紧凑 3 列分栏网格排版并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const grid = formatTextColumnsGrid(raw, 3);
                        await this.deps.copyProviderPayload(grid);
                        this.deps.notify?.("info", "已分栏网格排版并复制");
                    });
                }
                if (entry.content && /^\s*[-*+]|\d+[.)]\s+/m.test(entry.content)) {
                    addSilent("📶", "列表项按拼音/字母升序排序并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const sorted = sortMarkdownList(raw);
                        await this.deps.copyProviderPayload(sorted);
                        this.deps.notify?.("info", "已按拼音/字母排序列表并复制");
                    });
                }
                if (entry.content && entry.content.split("\n").length >= 3) {
                    addSilent("📐", "多行文本按视觉宽度升序排列并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const sorted = sortLinesByVisualWidth(raw);
                        await this.deps.copyProviderPayload(sorted);
                        this.deps.notify?.("info", "已按视觉宽度排列多行并复制");
                    });
                }
                if (entry.content && entry.content.length > 0 && entry.content.length <= 5 && !entry.content.includes("\n")) {
                    addSilent("🔁", "重复生成 20 次并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const repeated = repeatText(raw.trim(), 20);
                        await this.deps.copyProviderPayload(repeated);
                        this.deps.notify?.("info", "已重复生成 20 次并复制");
                    });
                }
                if (entry.content && entry.content.length > 80) {
                    addSilent("📄", "按 80 列宽度智能折行并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const wrapped = wrapTextLines(raw, 80);
                        await this.deps.copyProviderPayload(wrapped);
                        this.deps.notify?.("info", "已按 80 列宽度折行并复制");
                    });
                }
                if (entry.content && /^\s*(?:[-*+]|\d+\.)\s+\[[ xX]\]/m.test(entry.content)) {
                    addSilent("🔄", "反转任务待办勾选状态 ([ ] <-> [x]) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const inverted = invertTaskStatus(raw, "invert");
                        await this.deps.copyProviderPayload(inverted);
                        this.deps.notify?.("info", "已反转待办勾选状态并复制");
                    });
                    addSilent("📊", "统计任务列表进度条并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const progress = calculateTaskProgress(raw);
                        await this.deps.copyProviderPayload(`${progress.summary}\n${progress.progressBar}`);
                        this.deps.notify?.("info", `任务进度：${progress.percent}% (${progress.completed}/${progress.total})`);
                    });
                }
                if (entry.content && entry.content.length > 0 && entry.content.length < 30 && !entry.content.includes("\n")) {
                    addSilent("📐", "文本居中对齐填充至 30 宽度并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const centered = centerText(raw, 30);
                        await this.deps.copyProviderPayload(centered);
                        this.deps.notify?.("info", "已居中对齐填充并复制");
                    });
                }
                if (entry.content && (entry.content.includes(",") || entry.content.includes("，") || entry.content.includes("\n"))) {
                    addSilent("↔", "逗号与换行分隔符互转并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const targetDelim = raw.includes("\n") ? ", " : "\n";
                        const converted = convertListDelimiter(raw, targetDelim);
                        await this.deps.copyProviderPayload(converted);
                        this.deps.notify?.("info", "已转换列表分隔符并复制");
                    });
                }
                if (entry.content && entry.content.includes("[^")) {
                    addSilent("📑", "重整 Markdown 脚注编号并底端归集并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const normalized = normalizeMarkdownFootnotes(raw);
                        await this.deps.copyProviderPayload(normalized);
                        this.deps.notify?.("info", "已重整脚注编号并归集到底部");
                    });
                }
                if (entry.content && entry.content.includes("\\")) {
                    addSilent("🛡", "转义反斜杠 (\\ -> \\\\) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const escaped = escapeBackslash(raw, "escape");
                        await this.deps.copyProviderPayload(escaped);
                        this.deps.notify?.("info", "已转义反斜杠并复制");
                    });
                }
                if (entry.content && (/^---+$|^===+$/m.test(entry.content))) {
                    addSilent("📑", "按分割线将多行分块归集并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const chunked = chunkLinesByDelimiter(raw);
                        await this.deps.copyProviderPayload(chunked);
                        this.deps.notify?.("info", "已分块归集多行文本并复制");
                    });
                }
                if (entry.content && /^\s*>/m.test(entry.content)) {
                    addSilent("💬", "剥离所有引用符号 (>) 转为普通段落并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const stripped = flattenMarkdownBlockquotes(raw, "strip");
                        await this.deps.copyProviderPayload(stripped);
                        this.deps.notify?.("info", "已剥离引用符号并复制");
                    });
                }
                if (entry.content && entry.content.length > 0 && entry.content.includes(" ")) {
                    addSilent("🔄", "单词级别逆序反转并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const reversed = reverseWords(raw);
                        await this.deps.copyProviderPayload(reversed);
                        this.deps.notify?.("info", "已按单词逆序排列并复制");
                    });
                }
                if (entry.content && (entry.content.includes("**") || entry.content.includes("`") || entry.content.includes("~~"))) {
                    addSilent("🧹", "剥离行内加粗、斜体与代码标记并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const clean = stripInlineMarkdownFormatting(raw);
                        await this.deps.copyProviderPayload(clean);
                        this.deps.notify?.("info", "已剥离行内格式标记并复制");
                    });
                }
                if (entry.content && (entry.content.includes(":") || entry.content.includes("：") || entry.content.includes("=")) && entry.content.includes("\n")) {
                    addSilent("📊", "生成 KPI 核心数据汇总看板并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const card = formatKpiSummaryCard(raw);
                        await this.deps.copyProviderPayload(card);
                        this.deps.notify?.("info", "已生成 KPI 汇总看板并复制");
                    });
                }
                if (entry.content && entry.content.length > 0 && entry.content.length <= 10) {
                    addSilent("👤", "生成随机中文姓名并复制", async () => {
                        const name = generateRandomName("zh");
                        await this.deps.copyProviderPayload(name);
                        this.deps.notify?.("info", `随机姓名：${name} (已复制)`);
                    });
                }
                if (entry.content && entry.content.split("\n").length >= 3) {
                    addSilent("📑", "按字母/拼音首字分节大纲并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const grouped = groupLinesByAlphabet(raw);
                        await this.deps.copyProviderPayload(grouped);
                        this.deps.notify?.("info", "已按首字字母分组并复制");
                    });
                }
                if (entry.content && /^\s*[-*+]|\d+[.)]\s+/m.test(entry.content)) {
                    addSilent("➡️", "列表项层级缩进 (+2格) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const shifted = shiftListIndentation(raw, 2);
                        await this.deps.copyProviderPayload(shifted);
                        this.deps.notify?.("info", "已增加列表缩进并复制");
                    });
                }
                if (entry.content && entry.content.length > 0) {
                    addSilent("📏", "度量文本视觉宽度与字符统计", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const m = measureVisualWidth(raw);
                        this.deps.notify?.("info", `视觉宽度：${m.visualWidth}（汉字 ${m.cjkCount}，ASCII ${m.asciiCount}，总字符 ${m.charCount}）`);
                    });
                }
                if (entry.content && entry.content.includes("START_LOG") && entry.content.includes("END_LOG")) {
                    addSilent("📑", "截取 START_LOG 至 END_LOG 区间并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const sliced = sliceLinesByPattern(raw, "START_LOG", "END_LOG");
                        await this.deps.copyProviderPayload(sliced);
                        this.deps.notify?.("info", "已截取指定区间日志并复制");
                    });
                }
                if (entry.content && /^[+-]?\d{4,}(\.\d+)?$/.test(entry.content.trim())) {
                    addSilent("￥", "数值添加千分位逗号并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const formatted = formatNumberGrouping(raw.trim(), "add");
                        await this.deps.copyProviderPayload(formatted);
                        this.deps.notify?.("info", `已格式化千分位数值：${formatted}`);
                    });
                } else if (entry.content && /^[+-]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(entry.content.trim())) {
                    addSilent("￥", "剥离千分位逗号为纯数字并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const cleaned = formatNumberGrouping(raw.trim(), "remove");
                        await this.deps.copyProviderPayload(cleaned);
                        this.deps.notify?.("info", `已剥离千分位逗号：${cleaned}`);
                    });
                }
                if (entry.content && /^\s{2,}[-*+]|^\s{2,}\d+[.)]\s+/m.test(entry.content)) {
                    addSilent("📑", "扁平化展开嵌套多级列表并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const flattened = flattenNestedList(raw, "flat_bullets");
                        await this.deps.copyProviderPayload(flattened);
                        this.deps.notify?.("info", "已打平嵌套列表并复制");
                    });
                }
                if (entry.content && (/[a-zA-Z0-9][\u4e00-\u9fa5]|[\u4e00-\u9fa5][a-zA-Z0-9]/.test(entry.content) || entry.content.includes("\u00A0"))) {
                    addSilent("✨", "中英文与标点空格综合完美排版并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const res = formatCJKSpacingComprehensive(raw);
                        await this.deps.copyProviderPayload(res.result);
                        this.deps.notify?.("info", "已执行中英文与标点综合排版并复制");
                    });
                }
                if (entry.content && /\b([1-9]|1[0-9]|20)\b/.test(entry.content)) {
                    addSilent("①", "序号数字转圈号 (1 -> ①) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const converted = convertNumberSymbols(raw, "circled");
                        await this.deps.copyProviderPayload(converted);
                        this.deps.notify?.("info", "已转换为圈号数字并复制");
                    });
                }
                if (entry.content && /[①-⑳⑴-⒇]/.test(entry.content)) {
                    addSilent("🔢", "圈号数字转普通阿拉伯数字并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const converted = convertNumberSymbols(raw, "digits");
                        await this.deps.copyProviderPayload(converted);
                        this.deps.notify?.("info", "已转换为普通数字并复制");
                    });
                }
                if (entry.content && /```[\s\S]*?```/.test(entry.content)) {
                    addSilent("💻", "仅提取所有代码块并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const code = extractCodeBlocksFromMarkdown(raw);
                        await this.deps.copyProviderPayload(code);
                        this.deps.notify?.("info", "已提取全部纯代码块并复制");
                    });
                }
                if (entry.content && /^#{1,6}\s+/m.test(entry.content)) {
                    addSilent("📑", "转换各级标题为嵌套缩进列表并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const list = convertHeadingsToList(raw, "headings_to_list");
                        await this.deps.copyProviderPayload(list);
                        this.deps.notify?.("info", "已将标题转为嵌套列表并复制");
                    });
                    addSilent("🔢", "为各级标题编排递增层级序号并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const numbered = numberMarkdownHeadings(raw, { mode: "number" });
                        await this.deps.copyProviderPayload(numbered);
                        this.deps.notify?.("info", "已编排标题层级序号并复制");
                    });
                    addSilent("🧹", "一键剥离标题层级数字序号并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const stripped = numberMarkdownHeadings(raw, { mode: "strip" });
                        await this.deps.copyProviderPayload(stripped);
                        this.deps.notify?.("info", "已剥离标题数字序号并复制");
                    });
                }
                if (entry.content && entry.content.includes("|") && entry.content.includes("\n")) {
                    addSilent("🔄", "转置 Markdown 表格行列并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const transposed = transposeMarkdownTable(raw);
                        await this.deps.copyProviderPayload(transposed);
                        this.deps.notify?.("info", "已转置表格行列并复制");
                    });
                    addSilent("✨", "美化对齐 Markdown 表格列宽并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const beautified = beautifyMarkdownTable(raw);
                        await this.deps.copyProviderPayload(beautified);
                        this.deps.notify?.("info", "已美化对齐表格列宽并复制");
                    });
                }
                if (entry.content && (entry.content.trim().startsWith("{") || entry.content.trim().startsWith("["))) {
                    addSilent("🔍", "提取 JSON 顶层键名并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const keys = queryJsonPath(raw, "keys");
                        await this.deps.copyProviderPayload(keys);
                        this.deps.notify?.("info", `已提取 JSON 键名并复制`);
                    });
                }
                if (entry.content && entry.content.length > 5 && !entry.content.includes("|")) {
                    addSilent("💡", "包装为 Callout 提示块 (> [!NOTE]) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const callout = formatMarkdownCallout(raw, "NOTE");
                        await this.deps.copyProviderPayload(callout);
                        this.deps.notify?.("info", "已包装为 Callout 提示块并复制");
                    });
                }
                if (entry.content && /\[[ xX]\]/.test(entry.content)) {
                    addSilent("📊", "度量任务生成进度条指示器并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const stats = calculateTaskProgress(raw);
                        const bar = formatTaskProgressBar(stats.completed, stats.total);
                        await this.deps.copyProviderPayload(bar);
                        this.deps.notify?.("info", `已生成任务进度条 (${stats.percent}%) 并复制`);
                    });
                }
                if (entry.content && entry.content.includes("\n") && /\d+/.test(entry.content)) {
                    addSilent("🔍", "仅保留包含数值 >= 100 的行并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const filtered = filterNumericRangeLines(raw, 100);
                        await this.deps.copyProviderPayload(filtered);
                        this.deps.notify?.("info", "已筛选数值 >= 100 行并复制");
                    });
                }
                if (entry.content && /\d+(?:MB|GB|KB|TB|kg|g|km|cm|mm|GHz|MHz|kHz|Hz|Mbps|Gbps|ms|kW|MW)\b/.test(entry.content)) {
                    addSilent("📏", "规范数字与度量单位间距并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const formatted = formatUnitSpacing(raw);
                        await this.deps.copyProviderPayload(formatted.result);
                        this.deps.notify?.("info", `已规范 ${formatted.spacedCount} 处数字单位间距并复制`);
                    });
                }
                if (entry.content && entry.content.length > 5 && !entry.content.includes("\n")) {
                    addSilent("🀄", "仅提取纯汉字字符并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const res = filterCharacterSet(raw, "chinese-only");
                        await this.deps.copyProviderPayload(res);
                        this.deps.notify?.("info", `已提取 ${res.length} 个汉字并复制`);
                    });
                    addSilent("🔤", "仅提取纯字母与数字并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const res = filterCharacterSet(raw, "alphanumeric-only");
                        await this.deps.copyProviderPayload(res);
                        this.deps.notify?.("info", `已提取 ${res.length} 个字母数字并复制`);
                    });
                }
                addSilent("🆔", "生成紧凑唯一 NanoID (10位) 并复制", async () => {
                    const id = generateNanoId(10);
                    await this.deps.copyProviderPayload(id);
                    this.deps.notify?.("info", `已生成 NanoID: ${id}`);
                });
                if (entry.content && /^[+-]?\d{1,12}$/.test(entry.content.trim())) {
                    addSilent("🔤", "数字转英文拼写单词并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const words = numberToEnglishWords(raw.trim());
                        if (words) {
                            await this.deps.copyProviderPayload(words);
                            this.deps.notify?.("info", `英文拼写：${words}`);
                        }
                    });
                }
                if (entry.content && /['’]/.test(entry.content) && /[a-zA-Z]/.test(entry.content)) {
                    addSilent("📝", "英文日常缩写展开为正式词态并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const res = expandEnglishContractions(raw);
                        if (res.expandedCount > 0) {
                            await this.deps.copyProviderPayload(res.result);
                            this.deps.notify?.("info", `已展开 ${res.expandedCount} 处英文缩写并复制`);
                        }
                    });
                }
                if (entry.content && !entry.content.includes("\n") && /^[a-zA-Z]+$/.test(entry.content.trim())) {
                    addSilent("🔤", "单词转复数 (Plural) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const plural = pluralizeText(raw.trim(), "plural");
                        await this.deps.copyProviderPayload(plural);
                        this.deps.notify?.("info", `复数形式：${plural}`);
                    });
                    addSilent("🔤", "单词转单数 (Singular) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const singular = pluralizeText(raw.trim(), "singular");
                        await this.deps.copyProviderPayload(singular);
                        this.deps.notify?.("info", `单数形式：${singular}`);
                    });
                }
                if (entry.content && !entry.content.includes("\n") && (entry.content.includes(":") || entry.content.includes("：")) && (entry.content.includes(",") || entry.content.includes("，") || entry.content.includes("、"))) {
                    addSilent("🎲", "加权随机抽取一项并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const picked = pickWeightedOption(raw);
                        if (picked) {
                            await this.deps.copyProviderPayload(picked);
                            this.deps.notify?.("info", `抽取结果：${picked}`);
                        }
                    });
                }
                if (entry.content && (/^#[0-9a-fA-F]{3,8}$/.test(entry.content.trim()) || /^rgba?\(/.test(entry.content.trim()))) {
                    addSilent("🎨", "颜色格式转换 (HEX ⇋ RGB) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const clean = raw.trim();
                        const isHex = clean.startsWith("#");
                        const converted = convertColorFormat(clean, isHex ? "rgb" : "hex");
                        await this.deps.copyProviderPayload(converted);
                        this.deps.notify?.("info", `已转换颜色格式：${converted}`);
                    });
                }
                if (entry.content && !entry.content.includes("\n") && (entry.content.includes("_") || entry.content.includes("-") || /^[a-z]+[A-Z]/.test(entry.content.trim()))) {
                    addSilent("🔤", "标识符转人类可读短语并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const phrase = humanizeIdentifier(raw);
                        await this.deps.copyProviderPayload(phrase);
                        this.deps.notify?.("info", `自然短语：${phrase}`);
                    });
                }
                if (entry.content && !entry.content.includes("\n") && /[a-zA-Z0-9\s_-]{4,}/.test(entry.content.trim())) {
                    addSilent("🔗", "转为 URL/Git 连字符别名 (Slug) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const slug = slugifyText(raw);
                        if (slug) {
                            await this.deps.copyProviderPayload(slug);
                            this.deps.notify?.("info", `已生成 Slug 别名：${slug}`);
                        }
                    });
                }
                if (entry.content && /\d+.*[,，\s].*\d+/.test(entry.content.trim())) {
                    addSilent("🧮", "高级统计分析 (中位数/方差) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const stats = calculateStats(raw);
                        if (stats.count > 0) {
                            await this.deps.copyProviderPayload(stats.result);
                            this.deps.notify?.("info", `统计分析：${stats.result}`);
                        }
                    });
                }
                if (entry.content && /^(19\d\d|20\d\d)$/.test(entry.content.trim())) {
                    addSilent("🧧", "公历年转干支生肖并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const lunar = getChineseZodiacAndStemBranch(raw.trim());
                        await this.deps.copyProviderPayload(lunar.full);
                        this.deps.notify?.("info", `农历年份：${lunar.full}`);
                    });
                }
                if (entry.content && entry.content.trim().length > 30) {
                    addSilent("🔎", "检测高频重复词组短语并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const rep = extractRepeatedPhrases(raw, {minCount: 2, minLength: 2, maxLength: 4});
                        if (rep.items.length > 0) {
                            await this.deps.copyProviderPayload(rep.result);
                            this.deps.notify?.("info", `已检出 ${rep.items.length} 个重复短语并复制`);
                        } else {
                            this.deps.notify?.("info", "未检测到重复词组短语");
                        }
                    });
                }
                if (entry.content && entry.content.trim().length > 40) {
                    addSilent("📑", "提取精要摘要 (120字) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const summary = extractExecutiveSummary(raw, 120);
                        if (summary) {
                            await this.deps.copyProviderPayload(summary);
                            this.deps.notify?.("info", "已提取精要摘要并复制");
                        }
                    });
                }
                if (entry.content && /^\d{10,13}$/.test(entry.content.trim())) {
                    addSilent("⏱", "时间戳转相对时间并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const rel = formatRelativeTime(raw.trim());
                        if (rel) {
                            await this.deps.copyProviderPayload(rel);
                            this.deps.notify?.("info", `相对时间：${rel}`);
                        }
                    });
                }
                if (entry.content && entry.content.trim().length > 20) {
                    addSilent("📊", "统计词频分布并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const freq = countWordFrequency(raw, {topN: 5, ignoreStopWords: true});
                        if (freq.items.length > 0) {
                            await this.deps.copyProviderPayload(freq.result);
                            this.deps.notify?.("info", `已统计 ${freq.totalWords} 个单词的高频词并复制`);
                        }
                    });
                }
                if (entry.content && /^(\S+\s+){4,6}\S+$/.test(entry.content.trim())) {
                    addSilent("⏰", "解释 Cron 定时表达式并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const exp = explainCronExpression(raw.trim());
                        if (exp) {
                            await this.deps.copyProviderPayload(exp);
                            this.deps.notify?.("info", `已解释 Cron 表达式：${exp}`);
                        }
                    });
                }
                if (entry.content && /[\u4e00-\u9fa5]/.test(entry.content)) {
                    addSilent("🀄", "简体转繁体并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const res = convertChineseVariant(raw, "s2t");
                        await this.deps.copyProviderPayload(res.result);
                        this.deps.notify?.("info", `已转换 ${res.convertedCount} 字为繁体并复制`);
                    });
                    addSilent("🀄", "繁体转简体并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const res = convertChineseVariant(raw, "t2s");
                        await this.deps.copyProviderPayload(res.result);
                        this.deps.notify?.("info", `已转换 ${res.convertedCount} 字为简体并复制`);
                    });
                }
                if (entry.content && /^[IVXLCDM]+$/i.test(entry.content.trim())) {
                    addSilent("🏛", "罗马数字转阿拉伯数字并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const arabic = romanToArabic(raw.trim());
                        if (arabic !== null) {
                            await this.deps.copyProviderPayload(String(arabic));
                            this.deps.notify?.("info", `已转换为阿拉伯数字 ${arabic} 并复制`);
                        }
                    });
                } else if (entry.content && /^\d{1,4}$/.test(entry.content.trim()) && Number(entry.content.trim()) >= 1 && Number(entry.content.trim()) <= 3999) {
                    addSilent("🏛", "阿拉伯数字转罗马数字并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const roman = arabicToRoman(Number(raw.trim()));
                        if (roman) {
                            await this.deps.copyProviderPayload(roman);
                            this.deps.notify?.("info", `已转换为罗马数字 ${roman} 并复制`);
                        }
                    });
                }
                if (entry.content && entry.content.trim().length > 1 && !entry.content.includes("\n")) {
                    addSilent("🔄", "字符逆序反转并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const reversed = reverseText(raw);
                        await this.deps.copyProviderPayload(reversed);
                        this.deps.notify?.("info", "已反转字符并复制");
                    });
                }
                if (entry.content && (entry.content.includes("**") || entry.content.includes("`") || entry.content.includes("# ") || entry.content.includes("> "))) {
                    addSilent("📄", "剥离 Markdown 格式为纯文本并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const plain = stripMarkdownFormatting(raw);
                        await this.deps.copyProviderPayload(plain);
                        this.deps.notify?.("info", "已剥离 Markdown 格式为纯文本并复制");
                    });
                }
                if (entry.content && /^\d{3,12}$/.test(entry.content.trim())) {
                    addSilent("💾", "字节转易读容量单位并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const sizeStr = formatByteSize(raw.trim());
                        if (sizeStr) {
                            await this.deps.copyProviderPayload(sizeStr);
                            this.deps.notify?.("info", `已转换容量格式为 ${sizeStr} 并复制`);
                        }
                    });
                }
                if (entry.content && !entry.content.includes("\n") && (entry.content.includes(",") || entry.content.includes("，") || entry.content.includes(";"))) {
                    addSilent("↵", "逗号/分号拆为多行并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const splitted = splitTextToLines(raw);
                        await this.deps.copyProviderPayload(splitted);
                        this.deps.notify?.("info", "已拆分为多行并复制");
                    });
                }
                if (entry.content && /^[￥$]?\s*\d+(\.\d+)?$/.test(entry.content.trim())) {
                    addSilent("￥", "金额转中文大写汉字并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const cny = formatChineseCurrency(raw);
                        if (cny) {
                            await this.deps.copyProviderPayload(cny);
                            this.deps.notify?.("info", `已转换为中文大写金额并复制：${cny}`);
                        }
                    });
                }
                if (entry.content && entry.content.trim().length > 3) {
                    addSilent("🔤", "提取首字母缩写 (Initials) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const initials = extractInitials(raw);
                        if (initials) {
                            await this.deps.copyProviderPayload(initials);
                            this.deps.notify?.("info", `已提取首字母缩写 ${initials} 并复制`);
                        }
                    });
                }
                if (entry.content && (entry.content.includes("=") || (entry.content.includes(":") && entry.content.includes("\n")))) {
                    const propRes = propertiesToJson(entry.content);
                    if (propRes.ok && propRes.count > 0) {
                        addSilent("🌐", `键值对转 JSON 并复制 (${propRes.count}项)`, async () => {
                            await this.deps.copyProviderPayload(propRes.result);
                            this.deps.notify?.("info", `已转换 ${propRes.count} 项键值对为 JSON 并复制`);
                        });
                    }
                }
                if (entry.content && entry.content.trim().startsWith("{")) {
                    const jsonPropRes = jsonToProperties(entry.content);
                    if (jsonPropRes.ok && jsonPropRes.count > 0) {
                        addSilent("🌐", `JSON 转键值对 (Properties) 并复制 (${jsonPropRes.count}项)`, async () => {
                            await this.deps.copyProviderPayload(jsonPropRes.result);
                            this.deps.notify?.("info", `已转换 ${jsonPropRes.count} 项 JSON 属性为键值对并复制`);
                        });
                    }
                }
                if (entry.content && (/\d{11}/.test(entry.content) || /@/.test(entry.content))) {
                    addSilent("🔒", "敏感信息掩码脱敏并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const masked = maskSensitiveText(raw, "auto");
                        await this.deps.copyProviderPayload(masked);
                        this.deps.notify?.("info", "已脱敏手机/邮箱敏感信息并复制");
                    });
                }
                if (entry.content && (entry.content.includes(":") && (entry.content.includes("{") || entry.content.includes(",")))) {
                    addSilent("🔣", "属性名转双引号规范 (JSON) 并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const res = normalizeObjectQuotes(raw, "to-json");
                        await this.deps.copyProviderPayload(res.result);
                        this.deps.notify?.("info", `已转换 ${res.convertedCount} 处属性引号并复制`);
                    });
                }
                if (entry.content && entry.content.length > 50) {
                    addSilent("✂", "截断前 50 字并复制", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const truncated = truncateText(raw, 50);
                        await this.deps.copyProviderPayload(truncated);
                        this.deps.notify?.("info", "已截断前 50 字并复制");
                    });
                }
                const hasVariables = (entry.varCount ?? 0) > 0 || (entry.content || "").includes("{{xlc:");
                if (hasVariables) {
                    addSilent("📋", "复制剥离变量后的纯正文", async () => {
                        const raw = entry.content || await this.deps.preview(entry.id) || "";
                        const stripped = stripAllVariables(raw, true);
                        await this.deps.copyProviderPayload(stripped);
                        this.deps.notify?.("info", "已复制剥离变量标记后的纯正文");
                    });
                }
                silentTarget = sec2;
                const useCount = this.usageCounts.get(entry.id) ?? 0;
                if (useCount > 0 && this.deps.resetItemUsage) {
                    addSilent("↺", this.deps.t("resetItemUsage", String(useCount)), async () => {
                        const ok = this.deps.resetItemUsage?.(entry.id);
                        if (ok) {
                            this.usageCounts.delete(entry.id);
                            void this.refreshPreservingPosition();
                        }
                    }, "xlc-menu-item", this.deps.t("resetItemUsage", String(useCount)));
                }
                // 加入连续取用队列（解决单条必须进多选的断点）
                addSilent("📋", "加入连续取用队列 (⌥⇧Q)", async () => {
                    const queue = getActivePasteQueue();
                    queue.add({
                        id: entry.id,
                        title: entry.title || entry.summary || "未命名",
                        content: entry.content || entry.summary || "",
                        itemType: entry.itemType,
                    });
                    this.syncQueueChipRef?.();
                    this.deps.notify?.("info", `已加入连续取用队列（当前共 ${queue.size()} 项）`);
                }, "xlc-menu-item", "加入连续取用队列，随后按 ⌥⇧Q 依次取用上屏");
                // 删除 = 危险动作，固定语义红（样式层区分；确认弹窗不变）
                addSilent("🗑", this.deps.t("delete"), () => this.deps.deleteItem(entry.id), "xlc-menu-item xlc-menu-item--danger", `${this.deps.t("delete")} (Alt+Delete)`);
            }
            // 插入到指定文档（菜单内联文档选择器；无活动编辑器场景的主路径）
            const toDocBtn = this.menuButton("⤓", this.deps.t("insertToDoc"), "xlc-menu-item", () => {
                let sec = menu.querySelector<HTMLElement>(".xlc-menu-pickdoc");
                if (sec) {
                    sec.remove();
                    return;
                }
                sec = document.createElement("div");
                sec.className = "xlc-menu-sec xlc-menu-pickdoc";
                sec.style.flexDirection = "column";
                const input = document.createElement("input");
                input.className = "b3-text-field xlc-pickdoc-input";
                input.dataset.xlcControl = "dialog.pickdoc.input";
                input.placeholder = this.deps.t("insertToDocPick");
                input.setAttribute("aria-label", this.deps.t("insertToDocPick"));
                input.setAttribute("autocomplete", "off");
                let docDebounce: ReturnType<typeof setTimeout> | null = null;
                // Enter 选第一个命中；↑↓ 在输入框内移动光标不被菜单级 keydown 劫持（R138）
                input.addEventListener("keydown", (ev) => {
                    ev.stopPropagation();
                    if (ev.isComposing || (ev as KeyboardEvent).keyCode === 229) return;
                    if (ev.key === "Enter") {
                        ev.preventDefault();
                        if (docDebounce) {
                            clearTimeout(docDebounce);
                            docDebounce = null;
                            runDocSearch(input.value);
                        }
                        const first = sec.querySelector<HTMLButtonElement>(".xlc-pickdoc-hit");
                        first?.click();
                    }
                });
                sec.appendChild(input);
                let seq = 0;
                const searchStatus = document.createElement("div");
                searchStatus.className = "xlc-pickdoc-empty";
                searchStatus.setAttribute("role", "status");
                searchStatus.setAttribute("aria-live", "polite");
                sec.appendChild(searchStatus);
                const runDocSearch = (keyword: string): void => {
                    const mySeq = ++seq;
                    const k = keyword.trim();
                    sec!.querySelectorAll(".xlc-pickdoc-hit").forEach((el) => el.remove());
                    sec!.querySelectorAll(".xlc-pickdoc-empty").forEach((el) => el.remove());
                    if (!k) {
                        searchStatus.remove();
                        return;
                    }
                    if (!searchStatus.isConnected) sec!.appendChild(searchStatus);
                    searchStatus.className = "xlc-pickdoc-empty";
                    searchStatus.textContent = this.deps.t("docPickerLoading");
                    searchStatus.setAttribute("aria-busy", "true");
                    void this.deps.searchDocs(k).then((hits) => {
                        if (mySeq !== seq) return;
                        searchStatus.setAttribute("aria-busy", "false");
                        // 无匹配反馈（R120）：不再静默无反应
                        if (hits.length === 0) {
                            searchStatus.className = "xlc-pickdoc-empty";
                            searchStatus.textContent = this.deps.t("docPickerEmpty");
                            return;
                        }
                        searchStatus.remove();
                        for (const hit of hits.slice(0, 5)) {
                            sec!.appendChild(this.menuButton("⤓", hit.hPath || hit.name || hit.id, "xlc-menu-item xlc-pickdoc-hit", async () => {
                                this.menuDismiss?.();
                                this.menuDismiss = null;
                                await this.insertEntryWithVars(entry, (fills) => this.deps.insertToDoc(entry.id, hit.id, hit.hPath, fills));
                            }));
                        }
                    }).catch((err) => {
                        if (mySeq !== seq) return;
                        searchStatus.className = "xlc-pickdoc-empty xlc-status--error";
                        searchStatus.setAttribute("aria-busy", "false");
                        searchStatus.textContent = this.deps.t("kernelError", toErrorMessage(err));
                        const retry = document.createElement("button");
                        retry.type = "button";
                        retry.className = "b3-button xlc-btn-ghost xlc-pickdoc-retry";
                        retry.dataset.xlcControl = "dialog.pickdoc.retry";
                        retry.textContent = this.deps.t("retry");
                        retry.addEventListener("click", () => {
                            if (docDebounce) {
                                clearTimeout(docDebounce);
                                docDebounce = null;
                            }
                            runDocSearch(input.value);
                        });
                        searchStatus.appendChild(document.createTextNode(" "));
                        searchStatus.appendChild(retry);
                    });
                };
                input.addEventListener("input", () => {
                    if (docDebounce) clearTimeout(docDebounce);
                    docDebounce = setTimeout(() => {
                        docDebounce = null;
                        runDocSearch(input.value);
                    }, 200);
                });
                const actions2 = menu.querySelectorAll(".xlc-menu-sec");
                actions2[actions2.length - 1]?.before(sec);
                input.focus();
            });
            sec2.appendChild(toDocBtn);
            menu.appendChild(sec2);
            // 预览盒挂在次级分区之后（原型屏 2 顺序：标题 → 动作 → AI → 次级 → 预览）
            menu.appendChild(previewBox);
        };

        const buildTransformView = (viewLabel: string, transformLabel: string): void => {
            // 变换态：预览盒显示结果 + 插变换/复制变换/插原文/存为新条目/返回
            const lbl = document.createElement("div");
            lbl.className = "xlc-menu-lbl";
            lbl.textContent = viewLabel;
            menu.appendChild(lbl);
            appendMediaHint();
            const box = document.createElement("pre");
            box.className = "xlc-menu-preview xlc-menu-preview--muted";
            box.textContent = this.deps.t("aiWorking");
            menu.appendChild(box);
            const sec = document.createElement("div");
            sec.className = "xlc-menu-sec";
            // 结果未就绪（AI 处理中）时结果类操作禁用——防止插入空块
            const resultButtons: HTMLButtonElement[] = [];
            const syncReady = (): void => {
                const ready = Boolean(box.dataset.transformed);
                for (const b of resultButtons) b.disabled = !ready;
            };
            const insertBtn = this.menuButton("＋", this.deps.t("aiInsertTransformed"), "xlc-menu-item", async () => {
                const transformed = box.dataset.transformed ?? "";
                if (!transformed) return;
                const execution = this.deps.insertRaw(transformed, this.insertTarget ?? undefined);
                this.destroy();
                await execution;
            });
            const copyBtn = this.menuButton("⧉", this.deps.t("aiCopyTransformed"), "xlc-menu-item", async () => {
                // 复制的是「变换结果」本体（此前误复制条目原文，R77 修正）
                const transformed = box.dataset.transformed ?? "";
                if (!transformed) return;
                await this.deps.copyText(transformed);
            });
            resultButtons.push(insertBtn, copyBtn);
            sec.appendChild(insertBtn);
            sec.appendChild(copyBtn);
            syncReady();
            (menu as HTMLElement & {syncTransformReady?: () => void}).syncTransformReady = syncReady;
            sec.appendChild(this.menuButton("↩", this.deps.t("aiInsertOriginal"), "xlc-menu-item", async () => {
                // 与「插入变换结果」「存为新条目」一致：执行即关弹窗，防菜单残留导致重复插入（R137）
                const execution = this.runActionFor(entry);
                this.destroy();
                await execution;
            }));
            const saveBtn = this.menuButton("🗎", this.deps.t("saveTransformed"), "xlc-menu-item", async () => {
                const transformed = box.dataset.transformed ?? "";
                if (!transformed) return;
                this.destroy();
                await this.deps.saveTransformed(entry.id, transformLabel, transformed);
            });
            resultButtons.push(saveBtn);
            sec.appendChild(saveBtn);
            syncReady();
            menu.appendChild(sec);
            const secBack = document.createElement("div");
            secBack.className = "xlc-menu-sec";
            secBack.appendChild(this.menuButton("←", this.deps.t("more"), "xlc-menu-item", () => {
                rebuild(buildDefault);
            }));
            menu.appendChild(secBack);
            // 把最终文本挂到 dataset 供按钮使用（runTransformView 完成后填充并解除结果按钮禁用）
            (menu as HTMLElement & {applyTransform?: (text: string) => void}).applyTransform = (text: string): void => {
                box.dataset.transformed = text;
                box.textContent = text.slice(0, 800);
                box.classList.remove("xlc-menu-preview--muted");
                (menu as HTMLElement & {syncTransformReady?: () => void}).syncTransformReady?.();
            };
        };

        const runTransformView = async (run: () => Promise<{ok: true; text: string} | {ok: false; message: string}>, gen: number): Promise<void> => {
            let result: {ok: true; text: string} | {ok: false; message: string};
            try {
                result = await run();
            } catch (err) {
                result = {ok: false, message: this.deps.t("kernelError", toErrorMessage(err))};
            }
            if (gen !== this.transformSeq) return; // 连点两个变换：先返回的旧结果直接丢弃（R138）
            const apply = (menu as HTMLElement & {applyTransform?: (text: string) => void}).applyTransform;
            if (result.ok) {
                apply?.(result.text);
            } else {
                const box = menu.querySelector<HTMLElement>(".xlc-menu-preview");
                if (box) {
                    box.textContent = result.message;
                    box.classList.add("xlc-status--error");
                    const retry = document.createElement("button");
                    retry.type = "button";
                    retry.className = "b3-button xlc-btn-ghost xlc-transform-retry";
                    retry.dataset.xlcControl = "dialog.transform.retry";
                    retry.textContent = this.deps.t("retry");
                    retry.addEventListener("click", () => {
                        const retryGen = ++this.transformSeq;
                        box.textContent = this.deps.t("aiWorking");
                        box.classList.remove("xlc-status--error");
                        retry.remove();
                        void runTransformView(run, retryGen);
                    });
                    box.appendChild(document.createTextNode(" "));
                    box.appendChild(retry);
                }
            }
        };

        rebuild(buildDefault);
        // 菜单挂在 .xlc-dialog 内（样式作用域 + 相对弹窗定位）
        const host = (this.dialog?.element.querySelector(".xlc-dialog")) ?? this.dialog?.element ?? document.body;
        host.appendChild(menu);
        // Esc 关闭动作菜单（键盘可达性）；stopPropagation 隔离宿主 Dialog 的全局 Esc，
        // 防止「只想关菜单」时整个弹窗被连带关闭（R112）
        const escHandler = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                this.menuDismiss?.();
                this.menuDismiss = null;
                this.restoreFocusToSearch();
            }
        };
        menu.addEventListener("keydown", escHandler);
        // ↑↓ 在菜单项间移动焦点（键盘全链路；Enter 由焦点按钮原生触发，循环滚动）
        const focusMenuItem = (offset: number): void => {
            const items = Array.from(menu.querySelectorAll<HTMLElement>(".xlc-menu-item"));
            if (items.length === 0) return;
            const current = items.indexOf(document.activeElement as HTMLElement);
            const next = items[((current + offset) % items.length + items.length) % items.length];
            next?.focus();
        };
        menu.addEventListener("keydown", (e) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                e.stopPropagation();
                focusMenuItem(1);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                e.stopPropagation();
                focusMenuItem(-1);
            } else if (e.key === "Home" || e.key === "End") {
                const items = Array.from(menu.querySelectorAll<HTMLElement>(".xlc-menu-item"));
                if (items.length === 0) return;
                e.preventDefault();
                e.stopPropagation();
                if (e.key === "Home") items[0]?.focus();
                else items[items.length - 1]?.focus();
            } else if (e.key === "Tab") {
                // 菜单为模态浮层：Tab/Shift+Tab 在菜单项间循环（不逃逸到弹窗底层）
                e.preventDefault();
                e.stopPropagation();
                focusMenuItem(e.shiftKey ? -1 : 1);
            }
        });
        const dismiss = (e: Event) => {
            if (!menu.contains(e.target as Node)) {
                menu.remove();
                this.menuDismiss = null;
                document.removeEventListener("pointerdown", dismiss, true);
                this.restoreFocusToSearch();
            }
        };
        // destroy() 时兜底清理（弹窗经键盘关闭而菜单未点掉的场景）
        this.menuDismiss = () => {
            menu.remove();
            document.removeEventListener("pointerdown", dismiss, true);
        };
        document.addEventListener("pointerdown", dismiss, true);
        menu.querySelector<HTMLElement>(".xlc-menu-item")?.focus();
    }

    private async onKeydown(e: KeyboardEvent): Promise<void> {
        // IME 组合态（中文组词）：Enter/方向键属选词与候选导航，不得触发插入或移动选中（R138）
        if (e.isComposing || e.keyCode === 229) return;
        // 键盘可能在搜索框、结果行或列表容器任一层触发：统一由 this.dialog 根节点定位
        const list = this.dialog?.element.querySelector<HTMLElement>(".xlc-list");
        const input = this.dialog?.element.querySelector<HTMLInputElement>(".xlc-search-input");
        const isInputFocused = e.target === input || document.activeElement === input;

        // 空格键极速大卡片预览（G21 / ADR 0073）：浮层已开时空格关闭；
        // 非输入态且有条目选中时空格打开；输入框内打空格一律归还输入（不拦截）。
        if (e.key === " " && !e.ctrlKey && !e.metaKey && !e.altKey) {
            if (this.quickLookOpen) {
                e.preventDefault();
                this.closeQuickLook();
                return;
            }
            if (!list) return;
            if (!isInputFocused && this.hasActiveEntry() && this.openQuickLook()) {
                e.preventDefault();
                return;
            }
        }
        // 极速预览浮层优先吞下 Esc，避免误关整个搜索弹窗
        if (this.quickLookOpen && e.key === "Escape") {
            e.preventDefault();
            this.closeQuickLook();
            return;
        }

        // P1-1: 多选批量操作模式下按 Esc 优先退出多选模式，防止搜索弹窗误关导致勾选状态全部丢失
        if (this.multiSelectMode && e.key === "Escape") {
            e.preventDefault();
            this.exitMultiSelectMode();
            return;
        }

        // P1-3: Alt+Backspace / Alt+Delete 快速清除路径限定符 (如 in:目录名、path:xxx 等)
        if (e.altKey && (e.key === "Backspace" || e.key === "Delete") && input && isInputFocused) {
            const raw = input.value;
            if (/(?:in|path|book|box):[^\s]+/i.test(raw)) {
                e.preventDefault();
                input.value = raw.replace(/(?:in|path|book|box):[^\s]+/gi, "").trim();
                input.dispatchEvent(new Event("input", {bubbles: true}));
                return;
            }
        }

        // 历史回溯向下回退（ADR 0043）：支持 Alt+ArrowDown 或在历史态中向下
        const isHistoryDown = (e.altKey && e.key === "ArrowDown") || (e.key === "ArrowDown" && isInputFocused && this.historyCursor >= 0);
        if (isHistoryDown && input) {
            e.preventDefault();
            this.historyCursor--;
            const history = this.deps.getRecentQueries?.() ?? [];
            this.navigatingHistory = true;
            if (this.historyCursor >= 0) {
                input.value = history[this.historyCursor] ?? "";
            } else {
                input.value = this.tempQueryBeforeHistory;
            }
            input.dispatchEvent(new Event("input", {bubbles: true}));
            this.navigatingHistory = false;
            input.select();
            return;
        }

        // 历史回溯向上翻找（ADR 0043）：支持 Alt+ArrowUp 或（输入框为空且处于列表顶端时向上）
        const isHistoryUp = (e.altKey && e.key === "ArrowUp") ||
            (e.key === "ArrowUp" && isInputFocused && input && (this.historyCursor >= 0 || (!input.value.trim() && this.navPosition() === 0)));
        if (isHistoryUp && input) {
            const history = this.deps.getRecentQueries?.() ?? [];
            if (history.length > 0) {
                if (this.historyCursor < 0) {
                    this.tempQueryBeforeHistory = input.value;
                    this.historyCursor = 0;
                } else if (this.historyCursor + 1 < history.length) {
                    this.historyCursor++;
                }
                e.preventDefault();
                this.navigatingHistory = true;
                input.value = history[this.historyCursor] ?? "";
                input.dispatchEvent(new Event("input", {bubbles: true}));
                this.navigatingHistory = false;
                input.select();
                return;
            }
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            const total = this.results.length + this.providerRows.length;
            if (total > 0) this.setNav(Math.min(this.navPosition() + 1, total - 1));
            this.paintActive();
            this.updatePreview();
            if (this.quickLookOpen) this.refreshQuickLookContent();
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            this.setNav(Math.max(this.navPosition() - 1, 0));
            this.paintActive();
            this.updatePreview();
            if (this.quickLookOpen) this.refreshQuickLookContent();
        } else if (e.key === "Enter" && e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
            // Shift+Enter: 作为思源原生嵌入块（insert-embed，Notion Synced Block 同款实时同步）直接插入
            e.preventDefault();
            if (this.quickLookOpen) this.closeQuickLook();
            const entry = this.results[this.activeIndex];
            if (entry) {
                await this.insertEntryEmbedOrRef(entry, "embed");
            }
            return;
        } else if (e.key === "Enter" && e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
            // Alt+Enter: 作为思源原生块引用（insert-ref）直接插入
            e.preventDefault();
            if (this.quickLookOpen) this.closeQuickLook();
            const entry = this.results[this.activeIndex];
            if (entry) {
                await this.insertEntryEmbedOrRef(entry, "ref");
            }
            return;
        } else if (e.key === "Enter" && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
            // 焦点在行内按钮（★ 收藏等）时交给原生激活，不劫持为插入（R138）
            if ((e.target as HTMLElement).closest?.(".xlc-row-action")) return;
            if (e.repeat) return; // 按住 Enter 不得连续插入（R138）
            e.preventDefault();
            if (this.quickLookOpen) this.closeQuickLook();
            if (this.activeProvider >= 0) {
                if (this.primaryBusy) return;
                this.primaryBusy = true;
                try {
                    const row = this.providerRows[this.activeProvider];
                    if (row) {
                        // 定向模式一致性（R50）：provider payload 同样插入目标文档
                        const execution = this.deps.insertProviderPayload(row.payload, this.insertTarget ?? undefined);
                        if (!this.pinWindow) this.destroy();
                        await execution;
                        if (this.pinWindow) this.deps.notify?.("info", "已插入（窗口已固定，可连续选择）");
                    }
                } finally {
                    this.primaryBusy = false;
                }
                return;
            }
            const entry = this.results[this.activeIndex];
            if (entry) {
                await this.runPrimary(entry);
            } else if (isInputFocused && input && input.value.trim() && !input.value.startsWith("?")) {
                // 无搜索结果时按 Enter：将当前输入词一键带入新建表单，实现极致心流自愈闭环
                const queryText = input.value.trim();
                this.destroy();
                this.deps.newItem(queryText);
            }
        } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            if (e.repeat || this.primaryBusy) return;
            this.primaryBusy = true;
            e.preventDefault();
            try {
                if (this.quickLookOpen) this.closeQuickLook();
                if (this.activeProvider >= 0) {
                    const row = this.providerRows[this.activeProvider];
                    if (row) await this.deps.copyProviderPayload(row.payload);
                    return;
                }
                const entry = this.results[this.activeIndex];
                if (entry) await this.deps.runAction(entry.id, "copy");
            } finally {
                this.primaryBusy = false;
            }
        } else if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && (e.key === "c" || e.key === "C")) {
            // Alt+Shift+C: 纯文本清洗复制（自动剥离任何 Markdown / Kramdown 语法，适用于微信、QQ 等纯文本输入框）
            if (e.repeat || this.primaryBusy) return;
            this.primaryBusy = true;
            e.preventDefault();
            try {
                if (this.quickLookOpen) this.closeQuickLook();
                const entry = this.results[this.activeIndex];
                if (entry) {
                    const raw = entry.isOmni ? (entry.content || entry.summary || "") : await this.deps.preview(entry.id);
                    const plain = kramdownToPlainText(raw || entry.summary || "");
                    await this.deps.copyProviderPayload(plain);
                    const copyBtn = this.dialog?.element.querySelector<HTMLElement>('[data-xlc-control="preview.copy"]');
                    const targetEl = copyBtn || this.listEl?.querySelector<HTMLElement>(".xlc-row--active");
                    lvNotify.inline(targetEl, "已复制");
                    if (!this.pinWindow) setTimeout(() => this.destroy(), 350);
                }
            } finally {
                this.primaryBusy = false;
            }
            return;
        } else if ((e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey && (e.key === "c" || e.key === "C")) || (e.key === "Enter" && (e.ctrlKey || e.metaKey) && e.shiftKey)) {
            // Alt+C / Ctrl+Shift+Enter: 快捷复制（窗口固定时保留）
            if (e.repeat || this.primaryBusy) return;
            this.primaryBusy = true;
            e.preventDefault();
            try {
                if (this.quickLookOpen) this.closeQuickLook();
                if (this.activeProvider >= 0) {
                    const row = this.providerRows[this.activeProvider];
                    if (row) {
                        await this.deps.copyProviderPayload(row.payload);
                        const copyBtn = this.dialog?.element.querySelector<HTMLElement>('[data-xlc-control="preview.copy"]');
                        lvNotify.inline(copyBtn, "已复制");
                        if (!this.pinWindow) setTimeout(() => this.destroy(), 350);
                    }
                    return;
                }
                const entry = this.results[this.activeIndex];
                if (entry) {
                    if (entry.isOmni) {
                        await this.deps.copyProviderPayload(entry.content || entry.summary || "");
                    } else {
                        await this.deps.runAction(entry.id, "copy");
                    }
                    const copyBtn = this.dialog?.element.querySelector<HTMLElement>('[data-xlc-control="preview.copy"]');
                    const targetEl = copyBtn || this.listEl?.querySelector<HTMLElement>(".xlc-row--active");
                    lvNotify.inline(targetEl, "已复制");
                    if (!this.pinWindow) setTimeout(() => this.destroy(), 350);
                }
            } finally {
                this.primaryBusy = false;
            }
            return;
        } else if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === "r" || e.key === "R")) {
            // Alt+R: 快捷复制当前条目/全库块的思源块引用语法 ((blockId 'anchor'))
            e.preventDefault();
            if (this.quickLookOpen) this.closeQuickLook();
            const entry = this.results[this.activeIndex];
            if (entry) {
                const targetBlockId = resolveEntryBlockId(entry);
                if (isBlockId(targetBlockId)) {
                    const anchor = (entry.title || entry.summary || "引用").slice(0, 50).replace(/[\r\n]+/g, " ");
                    try {
                        const refCode = buildBlockRef(targetBlockId, anchor);
                        await this.deps.copyProviderPayload(refCode);
                        const copyBtn = this.dialog?.element.querySelector<HTMLElement>('[data-xlc-control="preview.copy"]');
                        const targetEl = copyBtn || this.listEl?.querySelector<HTMLElement>(".xlc-row--active");
                        lvNotify.inline(targetEl, "已复制");
                        if (!this.pinWindow) setTimeout(() => this.destroy(), 350);
                    } catch {
                        this.deps.notify?.("error", "无法生成块引用：目标块 ID 无效");
                    }
                } else {
                    this.deps.notify?.("error", "无法生成块引用：未关联有效块 ID");
                }
            }
            return;
        } else if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === "d" || e.key === "D")) {
            // Alt+D: 打开来源定位当前块/文档
            e.preventDefault();
            if (this.quickLookOpen) this.closeQuickLook();
            const entry = this.results[this.activeIndex];
            if (entry) {
                if (entry.isOmni) {
                    if (this.deps.openDocBlock) {
                        void this.deps.openDocBlock(resolveEntryBlockId(entry) || entry.id);
                    } else {
                        void this.deps.openSource(entry.id);
                    }
                } else {
                    void this.deps.openSource(entry.id);
                }
                if (!this.pinWindow) this.destroy();
            }
            return;
        } else if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && (e.key === "m" || e.key === "M")) {
            // Alt+Shift+M 切换多选模式（置于 Alt+M 之前，避免被无 Shift 分支遮蔽）
            e.preventDefault();
            this.toggleMultiSelectMode();
            return;
        } else if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === "m" || e.key === "M")) {
            // Alt+M: 复制条目原始 Markdown 语法到剪贴板
            e.preventDefault();
            if (this.quickLookOpen) this.closeQuickLook();
            const entry = this.results[this.activeIndex];
            if (entry) {
                const text = entry.isOmni ? (entry.content || entry.summary || "") : await this.deps.preview(entry.id);
                await this.deps.copyProviderPayload(text || entry.summary || "");
                if (!this.pinWindow) this.destroy();
                this.deps.notify?.("info", this.pinWindow ? "已复制原始 Markdown（窗口已固定，可连续取用）" : "已复制原始 Markdown 语法到剪贴板");
            }
            return;
        } else if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === "j" || e.key === "J")) {
            // Alt+J: 切换查看源文档前后相邻上下文语境探针
            e.preventDefault();
            void this.toggleAdjacentContextProbe();
            return;
        } else if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === "h" || e.key === "H")) {
            // Alt+H: 查看当前块所属真实源文档路径（绝不拿 category 冒充文档路径，T-0758 / FN-05）
            e.preventDefault();
            const entry = this.results[this.activeIndex];
            if (entry) {
                const targetBlockId = resolveEntryBlockId(entry);
                if (entry.sourceDocPath) {
                    this.deps.notify?.("info", `📍 所属文档路径: ${entry.sourceDocPath}${targetBlockId ? ` · [${targetBlockId}]` : ""}`);
                } else if (entry.sourceDocId || entry.libraryDocId) {
                    this.deps.notify?.("info", `📍 关联文档 ID: ${entry.sourceDocId || entry.libraryDocId}${targetBlockId ? ` · 块 [${targetBlockId}]` : ""}（按 Alt+D 可打开来源定位）`);
                } else {
                    this.deps.notify?.("info", "当前条目未关联思源源文档路径");
                }
            }
            return;
        } else if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === "p" || e.key === "P")) {
            // Alt+P: 切换窗口固定状态（Pin Window）
            e.preventDefault();
            this.togglePinWindow();
            return;
        } else if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === "v" || e.key === "V")) {
            // Alt+V: 切换搜索结果显示密度（紧凑单行 / 舒适卡片 · CAND-012 / TODO-FEAT-011）
            e.preventDefault();
            this.toggleDensity();
            return;
        } else if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === "m" || e.key === "M")) {
            // Alt+M: 切换极窄悬浮迷你模式（CAND-018 / TODO-FEAT-017）
            e.preventDefault();
            this.toggleMiniMode();
            return;
        } else if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === "a" || e.key === "A")) {
            // Alt+A: 切换当前条目的暂存托盘状态（CAND-019 / TODO-FEAT-018）
            e.preventDefault();
            const entry = this.results[this.activeIndex];
            if (entry) {
                this.togglePasteTrayItem(entry);
                if (this.listEl) this.renderList(this.listEl);
            }
            return;
        } else if (e.key === "Escape") {
            e.preventDefault();
            if (this.quickLookOpen) {
                this.closeQuickLook();
                return;
            }
            if (this.multiSelectMode) {
                this.exitMultiSelectMode();
                return;
            }
            this.destroy();
        } else if (
            e.key === " " && !isInputFocused && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey
            && !(e.target as HTMLElement | null)?.closest?.("input, textarea, select, button")
        ) {
            if (e.repeat) return;
            e.preventDefault();
            this.toggleQuickLook();
            return;
        } else if (
            this.miniMode && !e.ctrlKey && !e.metaKey && !e.altKey
            && (!isInputFocused || input?.value.trim() === "")
            && (/^[1-9]$/.test(e.key) || /^Digit[1-9]$/.test(e.code))
        ) {
            // 迷你常驻模式下前9项单数字键极速直达（CAND-026 / TODO-OPT-07）
            let num: number | null = null;
            if (/^[1-9]$/.test(e.key)) num = Number(e.key);
            else if (/^Digit[1-9]$/.test(e.code)) num = Number(e.code.replace("Digit", ""));
            if (num !== null && num >= 1 && num <= 9) {
                if (e.repeat) return;
                e.preventDefault();
                const idx = num - 1;
                const entry = this.results[idx];
                if (entry) {
                    if (e.shiftKey) {
                        if (this.primaryBusy) return;
                        this.primaryBusy = true;
                        try {
                            const res = await this.deps.runAction(entry.id, "copy");
                            if (res.ok) {
                                const copyBtn = this.dialog?.element.querySelector<HTMLElement>('[data-xlc-control="preview.copy"]');
                                const targetEl = copyBtn || this.listEl?.querySelector<HTMLElement>(`[data-xlc-index="${idx}"]`);
                                lvNotify.inline(targetEl, "已复制");
                            }
                        } finally {
                            this.primaryBusy = false;
                        }
                    } else {
                        await this.runPrimary(entry);
                    }
                    return;
                }
            }
        } else if (e.altKey && !e.ctrlKey && !e.metaKey && (/^[1-9]$/.test(e.key) || /^Digit[1-9]$/.test(e.code))) {
            let num: number | null = null;
            if (/^[1-9]$/.test(e.key)) {
                num = Number(e.key);
            } else if (/^Digit[1-9]$/.test(e.code)) {
                num = Number(e.code.replace("Digit", ""));
            }
            if (num !== null) {
                if (e.repeat) return; // 按住 Alt+数字不得连续触发（R138）
                e.preventDefault();
                const idx = num - 1;
                const entry = this.results[idx];
                if (entry) {
                    if (e.shiftKey) {
                        // Alt + Shift + 1~9：直达复制
                        if (this.primaryBusy) return;
                        this.primaryBusy = true;
                        try {
                            const res = await this.deps.runAction(entry.id, "copy");
                            if (res.ok) {
                                const copyBtn = this.dialog?.element.querySelector<HTMLElement>('[data-xlc-control="preview.copy"]');
                                const targetEl = copyBtn || this.listEl?.querySelector<HTMLElement>(`[data-xlc-index="${idx}"]`);
                                lvNotify.inline(targetEl, "已复制");
                            }
                        } finally {
                            this.primaryBusy = false;
                        }
                    } else {
                        // Alt + 1~9：直达插入
                        await this.runPrimary(entry);
                    }
                }
            }
        } else if (e.key === "Tab") {
            const root = this.dialog?.element;
            if (!root) return;
            const focusables = Array.from(root.querySelectorAll<HTMLElement>(
                'input:not([disabled]):not([type="hidden"]), select:not([disabled]), button:not([disabled]), [tabindex="0"]:not([disabled])'
            )).filter((el) => el.offsetParent !== null);
            if (focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            const active = document.activeElement as HTMLElement | null;

            // 搜索输入框按 Tab 时：
            const input = root.querySelector<HTMLInputElement>(".xlc-search-input");
            if (input && active === input && !e.shiftKey) {
                // G27 / ADR 0080 / TASK-20261031: 若输入框存在唯一精确简码或别名匹配项，按 Tab 闪电直达插入
                const exactMatch = findExactShortcodeMatch(this.results, input.value) || findExactAliasMatch(this.results, input.value);
                if (exactMatch && !this.primaryBusy && !this.varFormOpen) {
                    e.preventDefault();
                    await this.runPrimary(exactMatch);
                    return;
                }
                // 无匹配项且在 all 模式下，按 Tab 极速穿透到全库笔记检索
                if (this.currentScope === "all" && this.results.length === 0 && input.value.trim() && this.deps.searchAllNotes) {
                    e.preventDefault();
                    this.currentScope = "all-notes";
                    this.syncScopeChips();
                    void this.refresh().then(() => this.restoreFocusToSearch());
                    return;
                }
                const previewAction = root.querySelector<HTMLElement>(".xlc-pane-foot button:not([disabled])");
                if (previewAction && focusables.includes(previewAction)) {
                    e.preventDefault();
                    previewAction.focus();
                    return;
                }
            }

            // 焦点陷阱（Focus Trap）：首尾循环，防止 Tab 逃逸出搜索模态弹窗
            if (e.shiftKey && (active === first || active === root)) {
                e.preventDefault();
                last?.focus();
            } else if (!e.shiftKey && active === last) {
                e.preventDefault();
                first?.focus();
            }
        } else if ((e.altKey || ((e.ctrlKey || e.metaKey) && e.shiftKey)) && (e.key === "s" || e.key === "S")) {
            // 一键收录快捷键（Alt+S / Ctrl+Shift+S）：如果是全域或剪贴板结果则快速收录/沉淀入库
            const entry = this.results[this.activeIndex];
            if (entry?.isOmni && this.deps.createFromOmni) {
                if (this.capturedOmniIds.has(entry.id)) return;
                e.preventDefault();
                this.capturedOmniIds.add(entry.id);
                try {
                    const ok = await this.deps.createFromOmni(entry);
                    if (ok) {
                        this.syncPaneActions();
                        const activeRow = this.dialog?.element.querySelector<HTMLElement>(`[data-xlc-item-id="${entry.id}"]`);
                        const rowSaveBtn = activeRow?.querySelector<HTMLButtonElement>('[data-xlc-control="item.save-to-common"]');
                        if (rowSaveBtn) {
                            rowSaveBtn.textContent = "✓";
                            rowSaveBtn.disabled = true;
                            rowSaveBtn.title = entry.id.startsWith("xlc-clip-") ? "已沉淀为常用语" : "已收录入常用库";
                        }
                    } else {
                        this.capturedOmniIds.delete(entry.id);
                    }
                } catch {
                    this.capturedOmniIds.delete(entry.id);
                }
                return;
            }
        } else if ((e.ctrlKey || e.metaKey || e.altKey) && (e.key === "e" || e.key === "E")) {
            if (e.repeat) return;
            if (this.activeProvider >= 0) return;
            const entry = this.results[this.activeIndex];
            if (entry) {
                e.preventDefault();
                if (entry.isOmni) {
                    if (this.deps.quickEditBlock) {
                        void this.deps.quickEditBlock(resolveEntryBlockId(entry) || entry.id, entry.content || entry.summary || "");
                    }
                } else {
                    this.destroy();
                    await this.deps.editItem(entry.id);
                }
            }
        } else if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === "d" || e.key === "D")) {
            if (e.repeat) return;
            if (this.activeProvider >= 0) return;
            const entry = this.results[this.activeIndex];
            if (entry) {
                e.preventDefault();
                await this.deps.duplicateItem(entry.id);
                await this.refresh();
            }
        } else if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === "t" || e.key === "T")) {
            // Alt+T 轮转搜索范围 (all -> favorites -> recent -> clipboard -> current-doc -> all-notes -> all)
            if (e.repeat) return;
            e.preventDefault();
            const scopeOrder: SearchScope[] = ["all", "favorites", "recent", "clipboard", "current-doc", "all-notes"];
            const currentIdx = scopeOrder.indexOf(this.currentScope);
            const nextIdx = (currentIdx + 1) % scopeOrder.length;
            this.currentScope = scopeOrder[nextIdx] ?? "all";
            this.syncScopeChips();
            void this.refresh().then(() => this.restoreFocusToSearch());
            return;
        } else if (e.altKey && !e.ctrlKey && !e.metaKey && e.key === "0") {
            // Alt+0 重置全部范围
            if (e.repeat) return;
            e.preventDefault();
            this.currentScope = "all";
            this.syncScopeChips();
            void this.refresh().then(() => this.restoreFocusToSearch());
            return;
        } else if (
            (e.altKey && (e.key === "Delete" || e.key === "Backspace")) ||
            (!e.ctrlKey && !e.metaKey && !e.altKey && e.key === "Delete" && !(document.activeElement as HTMLElement | null)?.matches("input, textarea"))
        ) {
            if (e.repeat) return;
            if (this.activeProvider >= 0) return;
            const entry = this.results[this.activeIndex];
            if (entry) {
                e.preventDefault();
                await this.deps.deleteItem(entry.id);
            }
        } else if (
            e.altKey && !e.ctrlKey && !e.metaKey && (e.key === "f" || e.key === "F")
        ) {
            if (e.repeat) return;
            if (this.activeProvider >= 0) return;
            const entry = this.results[this.activeIndex];
            if (entry) {
                e.preventDefault();
                this.deps.toggleFavorite(entry.id);
                void this.refreshPreservingPosition().then(() => this.restoreFocusToSearch());
            }
        }
    }

    /** 是否有选中条目（空格极速预览入口前置判定） */
    hasActiveEntry(): boolean {
        return this.activeIndex >= 0 && this.activeIndex < this.results.length;
    }

    getActiveEntry(): SearchEntry | null {
        return this.results[this.activeIndex] ?? null;
    }

    public togglePinWindow(): boolean {
        this.pinWindow = !this.pinWindow;
        const pinBtn = this.dialog?.element.querySelector<HTMLElement>(".xlc-search-pin");
        if (pinBtn) {
            pinBtn.classList.toggle("xlc-search-pin--active", this.pinWindow);
            pinBtn.setAttribute("aria-pressed", String(this.pinWindow));
            pinBtn.title = this.pinWindow ? "已固定窗口（底层页面可自由点击编辑，连续复制/插入不关闭，Alt+P 切换）" : "固定窗口（连续复制/插入不关闭，Alt+P 切换）";
        }
        this.syncPassthroughMask();
        this.deps.notify?.("info", this.pinWindow ? "已开启窗口固定：底层笔记可自由点击编辑，连续复制或插入保持窗口打开 (Alt+P 切换)" : "已关闭窗口固定");
        return this.pinWindow;
    }

    private syncPassthroughMask(): void {
        const dialogWrap = this.dialog?.element;
        if (!dialogWrap) return;
        const passthrough = Boolean(this.miniMode || this.pinWindow);
        // 防御性清理：早期逻辑曾误将 xlc-dialog-mask--passthrough 加到 document.body，导致全页不可点
        try {
            if (typeof document !== "undefined") {
                document.body?.classList?.remove("xlc-dialog-mask--passthrough");
                document.documentElement?.classList?.remove("xlc-dialog-mask--passthrough");
            }
        } catch {
            // ignore
        }
        dialogWrap.classList.toggle("xlc-dialog-mask--passthrough", passthrough);
        const maskEl = dialogWrap.parentElement;
        if (maskEl && maskEl.tagName !== "BODY" && maskEl.tagName !== "HTML") {
            maskEl.classList.toggle("xlc-dialog-mask--passthrough", passthrough);
        }
        const containerEl = dialogWrap.querySelector<HTMLElement>(".b3-dialog__container");
        if (containerEl) {
            containerEl.classList.toggle("xlc-dialog--pinned", this.pinWindow);
        }
    }

    public toggleDensity(): "comfortable" | "compact" {
        this.density = this.density === "compact" ? "comfortable" : "compact";
        this.applyDensity();
        this.deps.onDensityChange?.(this.density);
        this.deps.notify?.("info", this.density === "compact" ? "已切换为紧凑单行视图 (Alt+V 切换)" : "已切换为舒适卡片视图 (Alt+V 切换)");
        return this.density;
    }

    public getDensity(): "comfortable" | "compact" {
        return this.density;
    }

    private applyDensity(): void {
        const isCompact = this.density === "compact";
        if (this.listEl) {
            this.listEl.classList.toggle("xlc-list--compact", isCompact);
        }
        if (this.densityBtn) {
            this.densityBtn.classList.toggle("xlc-search-density-btn--compact", isCompact);
            this.densityBtn.textContent = isCompact ? "☰" : "☷";
            this.densityBtn.title = isCompact ? "当前为紧凑单行视图（点击或 Alt+V 切换为舒适卡片）" : "当前为舒适卡片视图（点击或 Alt+V 切换为紧凑单行）";
            this.densityBtn.setAttribute("aria-pressed", String(isCompact));
        }
    }

    public toggleMiniMode(): boolean {
        this.miniMode = !this.miniMode;
        this.applyMiniMode();
        this.deps.onMiniModeChange?.(this.miniMode);
        this.deps.notify?.("info", this.miniMode ? "已开启极窄迷你模式（单列无遮挡，Alt+M 切换）" : "已切换为标准模式");
        return this.miniMode;
    }

    public getMiniMode(): boolean {
        return this.miniMode;
    }

    private applyMiniMode(): void {
        const isMobile = this.deps.isMobile();
        const effectiveMini = this.miniMode && !isMobile;
        const dialogWrap = this.dialog?.element;
        const containerEl = dialogWrap?.querySelector<HTMLElement>(".b3-dialog__container") ?? dialogWrap;
        const rootEl = dialogWrap?.querySelector<HTMLElement>(".xlc-dialog");
        if (dialogWrap) {
            dialogWrap.classList.toggle("xlc-dialog--mini", effectiveMini);
        }
        if (containerEl && containerEl !== dialogWrap) {
            containerEl.classList.toggle("xlc-dialog--mini", effectiveMini);
        }
        if (rootEl) {
            rootEl.classList.toggle("xlc-dialog--mini", effectiveMini);
        }
        if (containerEl) {
            if (effectiveMini) {
                containerEl.style.width = "min(380px, 92vw)";
                containerEl.style.maxWidth = "380px";
                containerEl.style.minWidth = "0";
                containerEl.style.height = "min(560px, 82vh)";
                containerEl.style.position = "fixed";
                if (this.miniPosition) {
                    containerEl.style.left = `${this.miniPosition.x}px`;
                    containerEl.style.top = `${this.miniPosition.y}px`;
                    containerEl.style.right = "auto";
                } else {
                    containerEl.style.right = "24px";
                    containerEl.style.top = "72px";
                    containerEl.style.left = "auto";
                }
                containerEl.style.margin = "0";
                containerEl.style.transform = "none";
            } else {
                containerEl.style.width = isMobile ? "100vw" : "min(960px, 94vw)";
                containerEl.style.maxWidth = "";
                containerEl.style.minWidth = "";
                containerEl.style.height = isMobile ? "100dvh" : "min(820px, 92vh)";
                containerEl.style.position = "";
                containerEl.style.left = "";
                containerEl.style.right = "";
                containerEl.style.top = "";
                containerEl.style.margin = "";
                containerEl.style.transform = "";
            }
        }

        // 非模态穿透协同（CAND-021 / TODO-FEAT-019）：
        // 迷你模式或固定窗口下开启背景遮罩穿透，用户可自由在底层编辑器中点击与打字
        this.syncPassthroughMask();

        if (this.miniModeBtn) {
            this.miniModeBtn.classList.toggle("xlc-search-mini-btn--active", this.miniMode);
            this.miniModeBtn.title = this.miniMode ? "已开启极窄迷你模式（Alt+M 恢复双栏）" : "迷你悬浮浮条模式（极窄单列无遮挡，Alt+M 切换）";
            this.miniModeBtn.setAttribute("aria-pressed", String(this.miniMode));
        }

        // R432 真机实证：mini 切换只切类不重渲染，行内 1-9 直达数字徽标要等下一次
        // refresh 才出现——与「按键直达可用」不同步。列表已有内容时立即重渲染。
        const miniListEl = this.listEl;
        if (miniListEl && miniListEl.childElementCount > 0 && !this.miniCollapsed) {
            this.renderList(miniListEl);
        }

        this.applyMiniCollapse();
    }

    public toggleMiniCollapse(): boolean {
        return this.setMiniCollapsed(!this.miniCollapsed);
    }

    public setMiniCollapsed(collapsed: boolean): boolean {
        this.miniCollapsed = collapsed;
        this.applyMiniCollapse();
        this.deps.onMiniCollapsedChange?.(this.miniCollapsed);
        if (!collapsed) {
            this.focusInput();
        }
        return this.miniCollapsed;
    }

    public getMiniCollapsed(): boolean {
        return this.miniCollapsed;
    }

    public getMiniPosition(): MiniPosition | undefined {
        return this.miniPosition;
    }

    public getCollapsedPillElement(): HTMLElement | null {
        return this.collapsedPillEl;
    }

    private applyMiniCollapse(): void {
        const dialogWrap = this.dialog?.element;
        if (!dialogWrap) return;
        const isCollapsed = this.miniMode && this.miniCollapsed;
        dialogWrap.classList.toggle("xlc-dialog--collapsed", isCollapsed);
        const containerEl = dialogWrap.querySelector<HTMLElement>(".b3-dialog__container");
        if (containerEl) {
            containerEl.classList.toggle("xlc-dialog--collapsed", isCollapsed);
        }
    }

    public togglePasteTrayItem(entry: SearchEntry): void {
        const idx = this.pasteTrayItems.findIndex((it) => it.id === entry.id);
        if (idx >= 0) {
            this.pasteTrayItems.splice(idx, 1);
            this.deps.notify?.("info", `已从暂存托盘移除「${entry.title}」`);
        } else {
            this.pasteTrayItems.push({
                id: entry.id,
                title: entry.title,
                content: entry.content || entry.summary || "",
            });
            this.deps.notify?.("info", `已加入暂存托盘 (当前共 ${this.pasteTrayItems.length} 项)`);
        }
        this.updatePasteTray();
    }

    public getPasteTrayItems(): Array<{id: string; title: string; content?: string}> {
        return [...this.pasteTrayItems];
    }

    public removeFromPasteTray(id: string): void {
        const idx = this.pasteTrayItems.findIndex((it) => it.id === id);
        if (idx >= 0) {
            this.pasteTrayItems.splice(idx, 1);
            this.updatePasteTray();
            if (this.listEl) this.renderList(this.listEl);
        }
    }

    public clearPasteTray(): void {
        this.pasteTrayItems = [];
        this.updatePasteTray();
    }

    private updatePasteTray(): void {
        if (!this.pasteTrayEl) return;
        if (this.pasteTrayItems.length === 0) {
            this.pasteTrayEl.style.display = "none";
            this.pasteTrayEl.replaceChildren();
            return;
        }

        this.pasteTrayEl.style.display = "flex";
        this.pasteTrayEl.replaceChildren();

        const headRow = document.createElement("div");
        headRow.className = "xlc-paste-tray-head";

        const badge = document.createElement("span");
        badge.className = "xlc-paste-tray-badge";
        badge.textContent = `🛒 暂存托盘 (${this.pasteTrayItems.length}项)`;

        const sepGroup = document.createElement("div");
        sepGroup.className = "xlc-paste-tray-seps";
        const seps: Array<{kind: TraySeparatorKind; label: string}> = [
            {kind: "double-newline", label: "换行"},
            {kind: "hr", label: "---分割线"},
            {kind: "compact", label: "紧凑"},
        ];
        for (const s of seps) {
            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = `xlc-paste-sep-chip ${this.traySeparator === s.kind ? "xlc-paste-sep-chip--active" : ""}`;
            chip.dataset.xlcControl = `paste-tray.sep.${s.kind}`;
            chip.textContent = s.label;
            chip.addEventListener("click", () => {
                this.traySeparator = s.kind;
                this.updatePasteTray();
            });
            sepGroup.appendChild(chip);
        }
        headRow.append(badge, sepGroup);

        const itemsRow = document.createElement("div");
        itemsRow.className = "xlc-paste-tray-items";
        for (const it of this.pasteTrayItems) {
            const itChip = document.createElement("span");
            itChip.className = "xlc-paste-item-chip";
            const itTitle = document.createElement("span");
            itTitle.className = "xlc-paste-item-title";
            itTitle.textContent = it.title || it.id;
            const delX = document.createElement("button");
            delX.type = "button";
            delX.className = "xlc-paste-item-del";
            delX.textContent = "×";
            delX.title = `移除「${it.title}」`;
            delX.dataset.xlcControl = `paste-tray.item-remove.${it.id}`;
            delX.addEventListener("click", () => this.removeFromPasteTray(it.id));
            itChip.append(itTitle, delX);
            itemsRow.appendChild(itChip);
        }

        const btnWrap = document.createElement("div");
        btnWrap.className = "xlc-paste-tray-actions";

        const insertBtn = document.createElement("button");
        insertBtn.type = "button";
        insertBtn.className = "b3-button xlc-btn-primary";
        insertBtn.dataset.xlcControl = "paste-tray.merge-insert";
        insertBtn.textContent = "⤓ 合并插入";
        insertBtn.title = "将托盘中的全部常用语按序拼接一次性插入到编辑器";
        insertBtn.setAttribute("aria-label", insertBtn.title);
        insertBtn.addEventListener("click", () => void this.mergeInsertPasteTray());

        const copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.className = "b3-button";
        copyBtn.dataset.xlcControl = "paste-tray.merge-copy";
        copyBtn.textContent = "⧉ 合并复制";
        copyBtn.title = "将托盘中的全部常用语拼接复制到剪贴板";
        copyBtn.setAttribute("aria-label", copyBtn.title);
        copyBtn.addEventListener("click", () => void this.mergeCopyPasteTray());

        const clearBtn = document.createElement("button");
        clearBtn.type = "button";
        clearBtn.className = "b3-button b3-button--cancel";
        clearBtn.dataset.xlcControl = "paste-tray.clear";
        clearBtn.textContent = "清空";
        clearBtn.addEventListener("click", () => this.clearPasteTray());

        const pinboardBtn = document.createElement("button");
        pinboardBtn.type = "button";
        pinboardBtn.className = "b3-button xlc-btn-ghost";
        pinboardBtn.dataset.xlcControl = "paste-tray.pinboard";
        pinboardBtn.textContent = "⊞ 连环拼板";
        pinboardBtn.title = "将托盘中的常用语以连环拼板卡片形式展开（点击秒复并高亮变绿）";
        pinboardBtn.setAttribute("aria-label", pinboardBtn.title);
        pinboardBtn.addEventListener("click", () => {
            openPinboardDialog({
                t: this.deps.t,
                copyText: (t) => this.deps.copyText(t),
                notify: this.deps.notify,
            }, "暂存常用语连环拼板", this.pasteTrayItems);
        });

        btnWrap.append(insertBtn, copyBtn, pinboardBtn, clearBtn);
        this.pasteTrayEl.append(headRow, itemsRow, btnWrap);
    }

    public async mergeInsertPasteTray(): Promise<void> {
        if (this.pasteTrayItems.length === 0) return;
        const contents: string[] = [];
        for (const it of this.pasteTrayItems) {
            let text = it.content || "";
            if (typeof this.deps.preview === "function") {
                try {
                    const kd = await this.deps.preview(it.id);
                    if (kd) text = kd;
                } catch {}
            }
            if (text.trim()) contents.push(text.trim());
        }
        const merged = mergeTrayContents(contents.map((c) => ({content: c})), this.traySeparator);
        const ok = await this.deps.insertRaw(merged, this.insertTarget ?? undefined);
        if (ok) {
            this.deps.notify?.("info", `已合并插入 ${this.pasteTrayItems.length} 项常用语`);
            this.clearPasteTray();
            if (!this.pinWindow) this.destroy();
        } else {
            this.deps.notify?.("error", "合并插入失败");
        }
    }

    public async mergeCopyPasteTray(): Promise<void> {
        if (this.pasteTrayItems.length === 0) return;
        const contents: string[] = [];
        for (const it of this.pasteTrayItems) {
            let text = it.content || "";
            if (typeof this.deps.preview === "function") {
                try {
                    const kd = await this.deps.preview(it.id);
                    if (kd) text = kd;
                } catch {}
            }
            if (text.trim()) contents.push(text.trim());
        }
        const merged = mergeTrayContents(contents.map((c) => ({content: c})), this.traySeparator);
        const ok = await this.deps.copyText(merged);
        if (ok) {
            const copyBtn = this.pasteTrayEl?.querySelector<HTMLButtonElement>("[data-xlc-control='paste-tray.merge-copy']");
            if (copyBtn) lvNotify.inline(copyBtn, "已合并复制");
            if (!this.pinWindow) setTimeout(() => this.destroy(), 350);
        } else {
            this.deps.notify?.("error", this.deps.t("copyFailed"));
        }
    }

    public isPinWindow(): boolean {
        return this.pinWindow;
    }

    /** 空格键极速大卡片预览的开关入口（供弹窗与测试共用） */
    toggleQuickLookPublic(): boolean {
        return this.toggleQuickLook();
    }

    /**
     * 空格键极速大卡片预览（G21 / ADR 0073）
     * 仅非输入态可用：搜索框打字中的空格一律归还输入框。
     */
    toggleQuickLook(): boolean {
        if (this.quickLookOpen) {
            this.closeQuickLook();
            return true;
        }
        return this.openQuickLook();
    }

    isQuickLookOpen(): boolean {
        return this.quickLookOpen;
    }

    closeQuickLook(): void {
        if (!this.quickLookOpen) return;
        this.quickLookOpen = false;
        this.quickLookSeq++;
        this.dialog?.element.querySelector(".xlc-quicklook")?.remove();
        const back = this.quickLookReturnFocus;
        this.quickLookReturnFocus = null;
        if (back && typeof back.focus === "function" && back.isConnected) {
            back.focus();
        }
    }

    private openQuickLook(): boolean {
        const root = this.dialog?.element;
        const entry = this.getActiveEntry();
        if (!root || !entry || this.quickLookOpen) return false;

        this.quickLookOpen = true;
        const active = root.ownerDocument?.activeElement as HTMLElement | null;
        this.quickLookReturnFocus = active && active !== root ? active : null;

        const host = root.querySelector<HTMLElement>(".xlc-root") ?? root.querySelector<HTMLElement>(".xlc-search-input")?.closest<HTMLElement>(".xlc-search") ?? root;
        const overlay = document.createElement("div");
        overlay.className = "xlc-quicklook";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-label", entry.title || "");

        const card = document.createElement("div");
        card.className = "xlc-quicklook-card";

        const head = document.createElement("div");
        head.className = "xlc-quicklook-head";
        if (typeof head.setAttribute === "function") {
            head.setAttribute("role", "toolbar");
            head.setAttribute("aria-label", "极速预览标题栏");
        }
        const title = document.createElement("strong");
        title.className = "xlc-quicklook-title";
        title.textContent = entry.title || "";
        const meta = document.createElement("span");
        meta.className = "xlc-quicklook-meta";
        if (typeof meta.setAttribute === "function") {
            meta.setAttribute("role", "status");
            meta.setAttribute("aria-label", `条目元数据：${entry.itemType}`);
        }
        meta.textContent = `${entry.itemType}${entry.varCount ? ` · {${entry.varCount}} 变量` : ""}${entry.alias ? ` · 别名: ${entry.alias}` : ""}`;
        const hints = document.createElement("span");
        hints.className = "xlc-quicklook-hints";
        if (typeof hints.setAttribute === "function") {
            hints.setAttribute("role", "note");
            hints.setAttribute("aria-label", "操作提示");
        }
        hints.textContent = entry.isOmni
            ? "Space / Esc 关闭　Enter 插入　Alt+S 收录到常用库"
            : "Space / Esc 关闭　Enter 插入　Alt+C 复制";

        const closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.className = "b3-button b3-button--text xlc-quicklook-close";
        closeBtn.textContent = "×";
        closeBtn.title = "关闭极速预览 (Esc / Space)";
        if (typeof closeBtn.setAttribute === "function") {
            closeBtn.setAttribute("aria-label", "关闭极速预览");
        }
        closeBtn.addEventListener("click", () => this.closeQuickLook());

        head.append(title, meta, hints, closeBtn);

        const body = document.createElement("div");
        body.className = "xlc-quicklook-body";
        body.tabIndex = 0;
        body.setAttribute("role", "region");
        body.setAttribute("aria-label", "条目全文极速预览");
        const loading = document.createElement("div");
        loading.className = "xlc-quicklook-loading";
        loading.textContent = "加载中…";
        body.appendChild(loading);

        card.append(head, body);
        card.addEventListener("pointerdown", (ev) => {
            // 阻止卡片内部点击事件冒泡到背景遮罩，允许正常选中文本与点击滚动条
            ev.stopPropagation();
        });
        overlay.appendChild(card);
        // 阻止遮罩上的指针事件把键盘焦点从列表抢走
        overlay.addEventListener("pointerdown", (ev) => {
            ev.preventDefault();
            this.closeQuickLook();
        });
        host.appendChild(overlay);
        this.refreshQuickLookContent();
        return true;
    }

    /** 刷新极速预览大卡片（打开时以及上下方向键切换条目时同步更新，含动态宏双态预览，UI-07 / T-0759）。 */
    private refreshQuickLookContent(): void {
        const root = this.dialog?.element;
        const overlay = root?.querySelector<HTMLElement>(".xlc-quicklook");
        const entry = this.getActiveEntry();
        if (!overlay || !entry || !this.quickLookOpen) return;

        const seq = ++this.quickLookSeq;
        overlay.setAttribute("aria-label", entry.title || "");
        const title = overlay.querySelector<HTMLElement>(".xlc-quicklook-title");
        const meta = overlay.querySelector<HTMLElement>(".xlc-quicklook-meta");
        const hints = overlay.querySelector<HTMLElement>(".xlc-quicklook-hints");
        const body = overlay.querySelector<HTMLElement>(".xlc-quicklook-body");
        if (!title || !meta || !hints || !body) return;

        title.textContent = entry.title || "";
        meta.setAttribute("aria-label", `条目元数据：${entry.itemType}`);
        const baseMeta = `${entry.itemType}${entry.varCount ? ` · {${entry.varCount}} 变量` : ""}${entry.alias ? ` · 别名: ${entry.alias}` : ""}`;
        meta.textContent = baseMeta;
        hints.textContent = entry.isOmni
            ? "Space / Esc 关闭　Enter 插入　Alt+S 收录到常用库"
            : "Space / Esc 关闭　Enter 插入　Alt+C 复制";

        const paintBody = (text: string) => {
            body.innerHTML = "";
            if (text) {
                const metrics = calculateTextMetrics(text);
                if (metrics.nonWhitespaceChars > 0) {
                    meta.textContent = `${baseMeta} · ${formatReadingMetrics(metrics)}`;
                }
            }
            if (entry.itemType !== "code" && hasDynamicMacros(text)) {
                renderDualMacroPreview(
                    body,
                    text,
                    expandMacroPreview(text),
                    entry.itemType,
                    {
                        templateSource: this.deps.t("previewTemplateSource") || "模板源码",
                        expandedEffect: this.deps.t("previewExpandedEffect") || "展开后真实效果",
                    },
                );
            } else {
                renderSafePreview(body, text, entry.itemType === "code" ? "code" : entry.itemType);
            }
        };

        if (entry.isOmni) {
            paintBody(entry.content || entry.summary || "");
        } else {
            body.innerHTML = "";
            const loading = document.createElement("div");
            loading.className = "xlc-quicklook-loading";
            loading.textContent = "加载中…";
            body.appendChild(loading);
            void this.deps.preview(entry.id).then((text) => {
                if (this.quickLookSeq !== seq || !this.quickLookOpen) return;
                paintBody(text || "");
            }).catch(() => {
                if (this.quickLookSeq !== seq || !this.quickLookOpen) return;
                loading.textContent = "预览加载失败";
            });
        }
    }

    /** 切换多选模式（G30 / ADR 0082） */
    toggleMultiSelectMode(): void {
        this.multiSelectMode = !this.multiSelectMode;
        if (!this.multiSelectMode) {
            this.selectedIds.clear();
        }
        this.renderBatchBar();
        const list = this.dialog?.element.querySelector<HTMLElement>(".xlc-list");
        if (list) this.renderList(list);
    }

    exitMultiSelectMode(): void {
        if (!this.multiSelectMode) return;
        this.multiSelectMode = false;
        this.selectedIds.clear();
        this.renderBatchBar();
        const list = this.dialog?.element.querySelector<HTMLElement>(".xlc-list");
        if (list) this.renderList(list);
    }

    isMultiSelectMode(): boolean {
        return this.multiSelectMode;
    }

    getSelectedCount(): number {
        return this.selectedIds.size;
    }

    getSelectedIds(): string[] {
        return Array.from(this.selectedIds);
    }

    /** 公开批量修改接口（供 UI 交互与测试桩调用） */
    async applyBatchUpdate(patch: BatchTagCategoryPatch): Promise<BatchOperationReceipt | null> {
        if (this.selectedIds.size === 0 || !this.deps.batchUpdateMetadata) return null;
        const ids = Array.from(this.selectedIds);
        const receipt = await this.deps.batchUpdateMetadata(ids, patch);
        this.exitMultiSelectMode();
        await this.refresh();
        return receipt;
    }

    private buildBatchBar(): HTMLElement {
        const bar = document.createElement("div");
        bar.className = "xlc-batch-bar";
        bar.dataset.xlcControl = "search.batch.bar";
        bar.setAttribute("role", "toolbar");
        bar.setAttribute("aria-label", "批量多选操作栏");
        bar.style.display = "none";

        const countSpan = document.createElement("span");
        countSpan.className = "xlc-batch-count";
        countSpan.setAttribute("role", "status");
        countSpan.setAttribute("aria-live", "polite");
        countSpan.textContent = "已选 0 项";

        const actions = document.createElement("div");
        actions.className = "xlc-batch-actions";
        actions.addEventListener("keydown", (e) => {
            if (e.isComposing || e.keyCode === 229) return;
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                const btns = Array.from(actions.querySelectorAll<HTMLButtonElement>("button:not([style*='display: none'])"));
                if (btns.length === 0) return;
                const idx = btns.indexOf(document.activeElement as HTMLButtonElement);
                if (idx === -1) return;
                e.preventDefault();
                e.stopPropagation();
                const nextIdx = e.key === "ArrowRight" ? (idx + 1) % btns.length : (idx - 1 + btns.length) % btns.length;
                btns[nextIdx]?.focus();
                return;
            }
            if (e.key === "Home" || e.key === "End") {
                const btns = Array.from(actions.querySelectorAll<HTMLButtonElement>("button:not([style*='display: none'])"));
                if (btns.length === 0) return;
                e.preventDefault();
                e.stopPropagation();
                if (e.key === "Home") btns[0]?.focus();
                else btns[btns.length - 1]?.focus();
            }
        });

        const addTagBtn = document.createElement("button");
        addTagBtn.type = "button";
        addTagBtn.className = "b3-button";
        addTagBtn.dataset.xlcControl = "search.batch.add-tags";
        addTagBtn.textContent = "＋ 加标签";
        addTagBtn.addEventListener("click", () => {
            if (this.selectedIds.size === 0 || !this.deps.batchUpdateMetadata) return;
            openTextPromptDialog({
                title: "＋ 批量加标签",
                label: "请输入要批量追加的标签（支持中英文逗号分号分隔）：",
                controlId: "search.batch.add-tags.input",
                onConfirm: (input) => {
                    const tags = input.split(/[,，、;；\s]+/).map((s) => s.trim()).filter(Boolean);
                    if (tags.length === 0) return;
                    void this.applyBatchUpdate({addTags: tags});
                },
            });
        });

        const removeTagBtn = document.createElement("button");
        removeTagBtn.type = "button";
        removeTagBtn.className = "b3-button";
        removeTagBtn.dataset.xlcControl = "search.batch.remove-tags";
        removeTagBtn.textContent = "－ 删标签";
        removeTagBtn.addEventListener("click", () => {
            if (this.selectedIds.size === 0 || !this.deps.batchUpdateMetadata) return;
            openTextPromptDialog({
                title: "－ 批量删标签",
                label: "请输入要批量移除的标签（大小写不敏感）：",
                controlId: "search.batch.remove-tags.input",
                onConfirm: (input) => {
                    const tags = input.split(/[,，、;；\s]+/).map((s) => s.trim()).filter(Boolean);
                    if (tags.length === 0) return;
                    void this.applyBatchUpdate({removeTags: tags});
                },
            });
        });

        const setCatBtn = document.createElement("button");
        setCatBtn.type = "button";
        setCatBtn.className = "b3-button";
        setCatBtn.dataset.xlcControl = "search.batch.set-category";
        setCatBtn.textContent = "🏷️ 设分类";
        setCatBtn.addEventListener("click", () => {
            if (this.selectedIds.size === 0 || !this.deps.batchUpdateMetadata) return;
            openTextPromptDialog({
                title: "🏷️ 批量设置分类",
                label: "请输入目标分类名称（留空表示清空分类）：",
                allowEmpty: true,
                controlId: "search.batch.set-category.input",
                onConfirm: (input) => {
                    void this.applyBatchUpdate({setCategory: input.trim()});
                },
            });
        });

        // 全域条目批量一键收录按钮
        const batchCaptureBtn = document.createElement("button");
        batchCaptureBtn.type = "button";
        batchCaptureBtn.className = "b3-button xlc-btn-primary";
        batchCaptureBtn.dataset.xlcControl = "search.batch.capture-omni";
        batchCaptureBtn.textContent = "✦ 批量收录";
        batchCaptureBtn.style.display = "none";
        batchCaptureBtn.addEventListener("click", async () => {
            if (this.selectedIds.size === 0 || !this.deps.createFromOmni) return;
            const omniSelected = this.results.filter((r) => this.selectedIds.has(r.id) && r.isOmni);
            if (omniSelected.length === 0) return;
            batchCaptureBtn.disabled = true;
            batchCaptureBtn.textContent = "正在收录…";
            let successCount = 0;
            let failedCount = 0;
            try {
                for (const item of omniSelected) {
                    try {
                        const ok = await this.deps.createFromOmni(item);
                        if (ok) {
                            successCount++;
                            this.capturedOmniIds.add(item.id);
                        } else {
                            failedCount++;
                        }
                    } catch {
                        failedCount++;
                    }
                }
                if (successCount === 0) {
                    this.deps.notify?.("error", `批量收录失败（共 ${failedCount} 项未能写入），请检查内容或重试`);
                    return;
                }
                this.deps.notify?.(
                    failedCount > 0 ? "error" : "info",
                    failedCount > 0
                        ? `批量收录完成：成功 ${successCount} 项，失败 ${failedCount} 项`
                        : `已成功批量收录 ${successCount} 项到常用语库`,
                );
                this.exitMultiSelectMode();
                await this.refresh();
            } finally {
                this.renderBatchBar();
            }
        });

        // 剪贴板/全域多条合并沉淀按钮
        const batchMergeBtn = document.createElement("button");
        batchMergeBtn.type = "button";
        batchMergeBtn.className = "b3-button xlc-btn-primary";
        batchMergeBtn.dataset.xlcControl = "search.batch.merge-omni";
        batchMergeBtn.textContent = "⊞ 合并收录";
        batchMergeBtn.style.display = "none";
        batchMergeBtn.addEventListener("click", () => {
            if (this.selectedIds.size < 2) return;
            const selectedItems = this.results.filter((r) => this.selectedIds.has(r.id));
            if (selectedItems.length === 0) return;
            const mergedText = selectedItems.map((i) => i.content || i.summary || "").filter(Boolean).join("\n\n");
            if (!mergedText.trim()) return;
            const first = selectedItems[0]!;
            this.exitMultiSelectMode();
            if (this.deps.captureOmniWithForm) {
                this.deps.captureOmniWithForm({
                    ...first,
                    title: `合并沉淀 (${selectedItems.length}项)`,
                    content: mergedText,
                    summary: mergedText.slice(0, 100),
                });
            }
        });

        const queueBtn = document.createElement("button");
        queueBtn.type = "button";
        queueBtn.className = "b3-button";
        queueBtn.dataset.xlcControl = "search.batch.set-queue";
        queueBtn.textContent = this.deps.t("setPasteQueue");
        queueBtn.addEventListener("click", () => {
            if (this.selectedIds.size === 0) return;
            const selectedItems = this.results.filter((r) => this.selectedIds.has(r.id));
            const queue = getActivePasteQueue();
            queue.setQueue(selectedItems.map((i) => ({
                id: i.id,
                title: i.title || i.summary || "未命名",
                content: i.content || i.summary || "",
                itemType: i.itemType,
            })));
            this.syncQueueChipRef?.();
            this.exitMultiSelectMode();
            this.deps.notify?.("info", this.deps.t("setPasteQueueSuccess", String(selectedItems.length)));
        });

        const exitBtn = document.createElement("button");
        exitBtn.type = "button";
        exitBtn.className = "b3-button xlc-btn-ghost";
        exitBtn.dataset.xlcControl = "search.batch.exit";
        exitBtn.setAttribute("aria-label", "退出多选模式");
        exitBtn.textContent = "退出多选 (Esc)";
        exitBtn.addEventListener("click", () => this.exitMultiSelectMode());

        actions.append(batchCaptureBtn, batchMergeBtn, queueBtn, addTagBtn, removeTagBtn, setCatBtn, exitBtn);
        bar.append(countSpan, actions);
        this.batchBarEl = bar;
        return bar;
    }

    private renderBatchBar(): void {
        if (!this.batchBarEl) return;
        this.batchBarEl.style.display = this.multiSelectMode ? "flex" : "none";
        const countSpan = this.batchBarEl.querySelector(".xlc-batch-count");
        if (countSpan) {
            countSpan.textContent = `已选 ${this.selectedIds.size} 项`;
        }
        const actionBtns = this.batchBarEl.querySelectorAll<HTMLButtonElement>("button:not([data-xlc-control='search.batch.exit'])");
        actionBtns.forEach((b) => {
            b.disabled = this.selectedIds.size === 0;
        });

        const batchCaptureBtn = this.batchBarEl.querySelector<HTMLButtonElement>("[data-xlc-control='search.batch.capture-omni']");
        const batchMergeBtn = this.batchBarEl.querySelector<HTMLButtonElement>("[data-xlc-control='search.batch.merge-omni']");
        const hasManagedSelected = this.results.some((r) => this.selectedIds.has(r.id) && !r.isOmni);
        const addTagBtn = this.batchBarEl.querySelector<HTMLButtonElement>("[data-xlc-control='search.batch.add-tags']");
        const removeTagBtn = this.batchBarEl.querySelector<HTMLButtonElement>("[data-xlc-control='search.batch.remove-tags']");
        const setCatBtn = this.batchBarEl.querySelector<HTMLButtonElement>("[data-xlc-control='search.batch.set-category']");
        if (addTagBtn) addTagBtn.style.display = hasManagedSelected ? "" : "none";
        if (removeTagBtn) removeTagBtn.style.display = hasManagedSelected ? "" : "none";
        if (setCatBtn) setCatBtn.style.display = hasManagedSelected ? "" : "none";

        const omniSelected = this.results.filter((r) => this.selectedIds.has(r.id) && r.isOmni);
        if (batchCaptureBtn) {
            if (omniSelected.length > 0) {
                batchCaptureBtn.style.display = "";
                batchCaptureBtn.textContent = `✦ 批量收录 (${omniSelected.length}项)`;
                batchCaptureBtn.disabled = false;
            } else {
                batchCaptureBtn.style.display = "none";
            }
        }
        if (batchMergeBtn) {
            if (omniSelected.length >= 2) {
                batchMergeBtn.style.display = "";
                batchMergeBtn.textContent = `⊞ 合并收录 (${omniSelected.length}项)`;
                batchMergeBtn.disabled = false;
            } else {
                batchMergeBtn.style.display = "none";
            }
        }
    }

    private isDestroying = false;
    private prevActiveElement: HTMLElement | null = null;

    destroy(): void {
        if (this.isDestroying) return;
        this.isDestroying = true;
        if (this.inputDebounce) {
            clearTimeout(this.inputDebounce);
            this.inputDebounce = null;
        }
        this.virtualListCleanup?.();
        this.virtualListCleanup = null;
        this.virtualEnsureIndex = null;
        this.visualViewportCleanup?.();
        this.visualViewportCleanup = null;
        this.syncMobileFilterToggleRef = null;
        this.longPressCancel?.();
        this.longPressCancel = null;
        this.dropCleanup?.();
        this.dropCleanup = null;
        if (this.dragOverlay) {
            this.dragOverlay.remove();
            this.dragOverlay = null;
        }
        if (this.menuDismiss) {
            this.menuDismiss();
            this.menuDismiss = null;
        }
        this.surfaceUnregister?.();
        this.surfaceUnregister = undefined;
        const dlg = this.dialog;
        this.dialog = null;
        dlg?.destroy();
        if (this.deps.autoMinimizeOnDone) {
            this.deps.onReturnToBackground?.();
        }
        try {
            this.prevActiveElement?.focus();
        } catch {}
        this.prevActiveElement = null;
        this.isDestroying = false;
    }

    private dragOverlay: HTMLElement | null = null;
    private dropCleanup: (() => void) | null = null;

    /** 拖拽放置与面板快捷粘贴治理（ADR 0034 / T-0061） */
    private setupDragAndPaste(root: HTMLElement): void {
        let dragDepth = 0;

        const showOverlay = (): void => {
            if (this.dragOverlay) return;
            const overlay = document.createElement("div");
            overlay.className = "xlc-drop-overlay";
            overlay.dataset.xlcControl = "search.drop";
            const text = document.createElement("span");
            text.className = "xlc-drop-text";
            text.textContent = "📥 " + this.deps.t("dropToAdd");
            overlay.appendChild(text);
            root.appendChild(overlay);
            this.dragOverlay = overlay;
        };

        const hideOverlay = (): void => {
            if (this.dragOverlay) {
                this.dragOverlay.remove();
                this.dragOverlay = null;
            }
        };

        const onDragEnter = (e: DragEvent): void => {
            const types = e.dataTransfer?.types;
            if (types && (types.includes("text/plain") || types.includes("text/uri-list") || types.includes("Files"))) {
                e.preventDefault();
                dragDepth++;
                showOverlay();
            }
        };

        const onDragOver = (e: DragEvent): void => {
            const types = e.dataTransfer?.types;
            if (types && (types.includes("text/plain") || types.includes("text/uri-list") || types.includes("Files"))) {
                e.preventDefault();
                if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
            }
        };

        const onDragLeave = (e: DragEvent): void => {
            e.preventDefault();
            dragDepth--;
            if (dragDepth <= 0) {
                dragDepth = 0;
                hideOverlay();
            }
        };

        const onDragEnd = (): void => {
            dragDepth = 0;
            hideOverlay();
        };

        const onDrop = (e: DragEvent): void => {
            e.preventDefault();
            dragDepth = 0;
            hideOverlay();
            const text = e.dataTransfer?.getData("text/plain") || e.dataTransfer?.getData("text/uri-list");
            if (text && text.trim() && this.deps.newWithContent) {
                this.destroy();
                this.deps.newWithContent(text.trim());
            }
        };

        const onPaste = (e: ClipboardEvent): void => {
            const active = document.activeElement as HTMLElement | null;
            // 焦点处于输入框（搜索框/筛选框/textarea 等）时，保留原生粘贴行为，供用户粘贴搜索关键词
            if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable)) {
                return;
            }
            const text = e.clipboardData?.getData("text/plain");
            if (text && text.trim() && this.deps.newWithContent) {
                e.preventDefault();
                this.destroy();
                this.deps.newWithContent(text.trim());
            }
        };

        root.addEventListener("dragenter", onDragEnter);
        root.addEventListener("dragover", onDragOver);
        root.addEventListener("dragleave", onDragLeave);
        root.addEventListener("drop", onDrop);
        root.addEventListener("paste", onPaste);
        if (typeof window !== "undefined") {
            window.addEventListener("dragend", onDragEnd);
        }

        this.dropCleanup = () => {
            hideOverlay();
            root.removeEventListener("dragenter", onDragEnter);
            root.removeEventListener("dragover", onDragOver);
            root.removeEventListener("dragleave", onDragLeave);
            root.removeEventListener("drop", onDrop);
            root.removeEventListener("paste", onPaste);
            if (typeof window !== "undefined") {
                window.removeEventListener("dragend", onDragEnd);
            }
        };
    }

    private async toggleAdjacentContextProbe(): Promise<void> {
        const entry = this.results[this.activeIndex];
        if (!entry) return;
        const targetBlockId = resolveEntryBlockId(entry);
        const sourceDocId = entry.sourceDocId || entry.libraryDocId;
        if (!isBlockId(targetBlockId) || !isBlockId(sourceDocId) || !this.deps.getAdjacentBlocks) {
            this.deps.notify?.("info", "当前条目未关联思源源文档，无法调取上下文");
            return;
        }

        const paneBody = this.dialog?.element.querySelector<HTMLElement>(".xlc-pane-body");
        if (!paneBody) return;

        let host = paneBody.querySelector<HTMLElement>(".xlc-adjacent-context-box");
        if (host) {
            host.remove();
            return;
        }

        host = document.createElement("div");
        host.className = "xlc-adjacent-context-box";
        host.style.cssText = "margin-top:16px; padding:12px; background:var(--xlc-soft); border:1px solid var(--b3-border-color); border-radius:8px; font-size:12px; display:flex; flex-direction:column; gap:8px;";
        const loadingTitle = document.createElement("div");
        loadingTitle.style.cssText = "font-weight:600; opacity:0.8;";
        loadingTitle.textContent = "🔍 上下文语境探针 (前后相邻块 · Alt+J 收起)：";
        const loadingBody = document.createElement("div");
        loadingBody.textContent = "正在调取前后文…";
        host.append(loadingTitle, loadingBody);
        paneBody.appendChild(host);

        const buildBlockRow = (tagLabel: string, contentText: string, isCurrent: boolean): HTMLDivElement => {
            const rowEl = document.createElement("div");
            rowEl.style.cssText = isCurrent
                ? "padding:8px; background:var(--b3-theme-background); border-left:3px solid var(--b3-theme-primary); border-radius:4px; font-weight:500;"
                : "padding:6px 8px; background:var(--b3-list-hover); border-left:2px solid var(--b3-border-color); opacity:0.75; font-size:11px;";
            const strongEl = document.createElement("strong");
            strongEl.style.cssText = isCurrent ? "color:var(--b3-theme-primary);" : "opacity:0.6;";
            strongEl.textContent = tagLabel;
            rowEl.append(strongEl, document.createTextNode(" " + contentText));
            return rowEl;
        };

        try {
            const data = await this.deps.getAdjacentBlocks(targetBlockId, sourceDocId);
            if (!data) {
                host.textContent = "";
                const emptyEl = document.createElement("div");
                emptyEl.style.opacity = "0.7";
                emptyEl.textContent = "未检索到相邻上下文块或源文档无其它子块";
                host.appendChild(emptyEl);
                return;
            }
            host.textContent = "";
            const headRow = document.createElement("div");
            headRow.style.cssText = "font-weight:600; color:var(--b3-theme-primary); display:flex; align-items:center; justify-content:space-between;";
            const headTitle = document.createElement("span");
            headTitle.textContent = "🔍 源文档前后相邻块语境 (Alt+J 收起)";
            const headSrc = document.createElement("span");
            headSrc.style.cssText = "font-size:11px; opacity:0.7; font-weight:normal;";
            headSrc.textContent = `来源：${entry.sourceDocPath || "源文档"}`;
            headRow.append(headTitle, headSrc);
            host.appendChild(headRow);

            if (data.prev) {
                host.appendChild(buildBlockRow("[上文]", kramdownToPlainText(data.prev.content) || "(空)", false));
            }

            host.appendChild(buildBlockRow("[当前]", kramdownToPlainText(data.current.content) || "(当前块内容)", true));

            if (data.next) {
                host.appendChild(buildBlockRow("[下文]", kramdownToPlainText(data.next.content) || "(空)", false));
            }
        } catch {
            host.textContent = "";
            const errEl = document.createElement("div");
            errEl.style.color = "var(--b3-theme-error)";
            errEl.textContent = "调取相邻上下文失败";
            host.appendChild(errEl);
        }
    }
}
