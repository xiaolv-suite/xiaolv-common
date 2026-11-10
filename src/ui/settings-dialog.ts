// 设置界面（自 index.ts 拆出，R19）：首次引导 / 完整设置 / 库选择器 / AI / 搜索 / 数据区 / 标签体检 / 导入策略。
// 依赖经 SettingsUiContext 注入（不持有插件实例）；状态对象按引用共享，落盘由 persistSoon 节流。
import {Dialog, confirm} from "siyuan";
import {adaptSecondaryDialogForMobile, getDialogBody, isMobileDialogViewport, mountPlatformDialogTitleWrap} from "./dialog-dom";
import {CONFIG_VERSION, LibraryConfig, PluginState, summarizeUsage} from "../model/storage";
import {LIMITS} from "../constants";
import {validateImport, ConflictPolicy, ImportIssue, ImportReceipt, ExportedItem} from "../model/transfer";
import {buildZip} from "../model/zip";
import {buildMarkdownExport, ExportIntegrityError} from "../service/export-markdown";
import {parseMarkdownPack} from "../service/import-markdown";
import {LibraryService} from "../service/library";
import {AiAssistant} from "../service/ai";
import {ProviderRegistry} from "../service/providers";
import {CommonItem, newLogicalId} from "../model/item";
import {toErrorMessage} from "../model/errors";
import {collectTags} from "../model/search";
import {PROMPT_PACK_MD, REFORMULATION_PACK_MD, TASK_HORIZON_PACK_MD, CALLOUT_PACK_MD, ACADEMIC_CITATION_PACK_MD} from "../service/prompt-pack";
import type {SavedDiscoveryScope, SavedDiscoveryView} from "../model/storage";
import {openCsvTsvImportWizard} from "./csv-tsv-wizard";
import {diagnoseLibraryHealth, type HealthDoctorItem} from "../model/health-doctor";
import {calculateUsageInsights, calculateHeatmap, buildDailyUsageMap, filterKnownTopItems, type UsageItemMeta} from "../model/usage-insights";
import {detectEcosystem} from "../service/ecosystem";
import {lvEcosystem} from "../libs/lv-notice-kit";
import {openSanitizerOptionsDialog} from "./export-sanitizer-modal";
import type {SanitizerOptions} from "../model/export-sanitizer";
import {openSyncDiffModal} from "./sync-diff-modal";
import {diffLibraries, SyncEntry} from "../model/sync-diff";
import {countRememberedFields, clearAllMemory} from "../model/variable-memory";
import {openStepByStepGuideDialog} from "./guide-dialog";
import {openStarterPacksHubDialog} from "./starter-packs-dialog";

type TFn = (key: string, ...args: string[]) => string;

// 设置/首次引导是单实例浮层。入口可能同时来自命令面板、空态和移动端底栏；
// 复用已打开的实例可避免重复点击堆积多个遮罩层，并保持焦点与当前表单状态。
let activeSetupDialog: Dialog | null = null;
let activeSettingsDialog: Dialog | null = null;

// Espanso 解析器连同 js-yaml 仅在用户打开导入窗口时需要；保持设置首屏不加载重型 YAML 依赖。
let espansoParserPromise: Promise<typeof import("../service/espanso-import")> | null = null;
function loadEspansoParser(): Promise<typeof import("../service/espanso-import")> {
    espansoParserPromise ??= import("../service/espanso-import");
    return espansoParserPromise;
}

// CSV/TSV 表格解析器按需懒加载；避免首屏预载表格解析模块。
let csvTsvParserPromise: Promise<typeof import("../service/csv-tsv-import")> | null = null;
function loadCsvTsvParser(): Promise<typeof import("../service/csv-tsv-import")> {
    csvTsvParserPromise ??= import("../service/csv-tsv-import");
    return csvTsvParserPromise;
}

/** 开关行统一构造（文本+说明在左，开关右贴；input 语义不变） */
function buildSwitchRow(text: string, sub: string | null, checked: boolean, onChange: (value: boolean) => void): HTMLLabelElement {
    const row = document.createElement("label");
    row.className = "xlc-setting-row";
    const cap = document.createElement("span");
    cap.className = "xlc-setting-text";
    cap.textContent = text;
    if (sub) {
        // span 内不嵌 div（内容模型）：副文案用 span + 块状样式（R138）
        const subEl = document.createElement("span");
        subEl.className = "xlc-setting-sub";
        subEl.textContent = sub;
        cap.appendChild(subEl);
    }
    const box = document.createElement("input");
    box.type = "checkbox";
    box.className = "xlc-switch";
    box.dataset.xlcControl = `settings.switch.${text}`;
    box.checked = checked;
    box.addEventListener("change", () => onChange(box.checked));
    row.appendChild(cap);
    row.appendChild(box);
    return row;
}

export interface SettingsUiContext {
    t: TFn;
    state: PluginState;
    getConfig(): LibraryConfig | null;
    library: LibraryService;
    ai: AiAssistant;
    registry: ProviderRegistry;
    notify(kind: "info" | "error", message: string): void;
    applyConfig(config: LibraryConfig): void;
    persistSoon(): void;
    exportBundle(): Promise<string>;
    importBundleText(text: string, policy: ConflictPolicy): Promise<ImportReceipt>;
    importMarkdownItems(items: ReadonlyArray<ExportedItem>, policy: ConflictPolicy): Promise<ImportReceipt>;
    fetchAssetBytes(assetPath: string): Promise<Uint8Array | null>;
    aiErrorText(err: unknown): string;
    applyPinyinAdapter(): void;
    refreshSearch?(): void;
    openLibraryDoc?(): void;
    /** Saved tag-scoped discovery shortcuts. The source blocks remain canonical. */
    getSavedDiscoveryViews?(): readonly SavedDiscoveryView[];
    openSavedDiscoveryView?(view: SavedDiscoveryView): void;
    deleteSavedDiscoveryView?(id: string): void;
}

export interface SetupDialogOptions {
    /** 配置落地后回调 */
    onConfigured?: () => void;
    /** 用户点击「稍后再说」 */
    onDismiss?: () => void;
}

/** 首次引导（仅库选择，两步式；完整设置见 openSettingsDialog） */
export function openSetupDialog(ctx: SettingsUiContext, opts?: SetupDialogOptions): void {
    if (activeSetupDialog?.element?.isConnected) {
        activeSetupDialog.element.querySelector<HTMLElement>("input, select, button")?.focus();
        return;
    }
    activeSetupDialog = null;
    const t = ctx.t;
    const isMobileModal = isMobileDialogViewport();
    const dialog = new Dialog({
        title: t("setupTitle"),
        content: "",
        width: isMobileModal ? "100vw" : "min(680px, 92vw)",
        height: isMobileModal ? "100dvh" : "min(820px, 92vh)", // 首次快速开始卡需要留出阅读空间，长屏仍保持视口内滚动（R175）
    });
    activeSetupDialog = dialog;
    dialog.element.querySelector(".b3-dialog__container")?.classList.add("xlc-form-host", "xlc-settings-host", "xlc-setup-root-host");
    mountPlatformDialogTitleWrap(dialog.element, t("setupTitle"));
    adaptSecondaryDialogForMobile(dialog, t("close"));
    const body = getDialogBody(dialog.element);
    if (!body) return;
    body.innerHTML = "";
    const root = document.createElement("div");
    root.className = "xlc-form xlc-setup";
    buildLibraryPickerSection(ctx, root, () => {
        dialog.destroy();
        opts?.onConfigured?.();
    }, {onDismiss: () => dialog.destroy()});
    body.appendChild(root);
}

/** 完整设置：库管理（含更改库）+ AI + 搜索 + 数据 */
export function openSettingsDialog(ctx: SettingsUiContext): void {
    if (activeSettingsDialog?.element?.isConnected) {
        activeSettingsDialog.element.querySelector<HTMLElement>("input, select, button")?.focus();
        return;
    }
    activeSettingsDialog = null;
    const t = ctx.t;
    const isMobileModal = isMobileDialogViewport();
    const dialog = new Dialog({
        title: t("openSettings"),
        content: "",
        width: isMobileModal ? "100vw" : "min(720px, 92vw)",
        height: isMobileModal ? "100dvh" : "min(860px, 92vh)", // 固定高：展开/收起/提示行显隐不再顶跳弹窗（R146）
    });
    activeSettingsDialog = dialog;
    dialog.element.querySelector(".b3-dialog__container")?.classList.add("xlc-form-host", "xlc-settings-host", "xlc-settings-root-host");
    mountPlatformDialogTitleWrap(dialog.element, t("openSettings"));
    adaptSecondaryDialogForMobile(dialog, t("close"));
    const body = getDialogBody(dialog.element);
    if (!body) return;
    body.innerHTML = "";
    const root = document.createElement("div");
    root.className = "xlc-form xlc-settings";
    const intro = document.createElement("p");
    intro.className = "xlc-page-intro";
    intro.textContent = t("settingsIntro");
    root.appendChild(intro);

    // 顶部快速定位胶囊导航条（解决长面板反复滚动的痛点，顺序严格与物理卡片一致）
    const navBar = document.createElement("div");
    navBar.className = "xlc-settings-nav-bar";
    navBar.setAttribute("role", "tablist");
    navBar.setAttribute("aria-label", "设置分区导航");
    const navTabs = [
        {id: "xlc-settings-lib", label: "📦 库配置"},
        {id: "xlc-settings-ai", label: "🤖 AI模型"},
        {id: "xlc-settings-prefs", label: "⚙️ 偏好设置"},
        {id: "xlc-settings-search", label: "🔍 搜索配置"},
        {id: "xlc-settings-health", label: "🏥 健康体检"},
        {id: "xlc-settings-ext", label: "⚡ 外部联动"},
        {id: "xlc-settings-data", label: "💾 数据导入导出"},
    ];
    for (const tab of navTabs) {
        const pill = document.createElement("button");
        pill.type = "button";
        const isActive = tab.id === "xlc-settings-lib";
        pill.className = "xlc-settings-nav-pill" + (isActive ? " xlc-settings-nav-pill--active" : "");
        pill.textContent = tab.label;
        pill.setAttribute("role", "tab");
        pill.setAttribute("aria-selected", isActive ? "true" : "false");
        pill.setAttribute("aria-controls", tab.id);
        pill.addEventListener("click", () => {
            navBar.querySelectorAll(".xlc-settings-nav-pill").forEach((p) => {
                p.classList.remove("xlc-settings-nav-pill--active");
                p.setAttribute("aria-selected", "false");
            });
            pill.classList.add("xlc-settings-nav-pill--active");
            pill.setAttribute("aria-selected", "true");
            const el = root.querySelector<HTMLElement>(`#${tab.id}`);
            if (el) {
                // sticky 导航条跳转落点补偿（R431）：按实际吸顶高度写入 scroll-margin，
                // 否则目标章节标题会被导航条盖住
                root.style.setProperty("--xlc-nav-h", `${navBar.offsetHeight + 8}px`);
                el.scrollIntoView({behavior: "smooth", block: "start"});
            }
        });
        pill.addEventListener("keydown", (e) => {
            if (e.isComposing || e.keyCode === 229) return;
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault();
                e.stopPropagation();
                const pills = Array.from(navBar.querySelectorAll<HTMLButtonElement>(".xlc-settings-nav-pill"));
                if (!pills.length) return;
                const idx = pills.indexOf(pill);
                const nextIdx = e.key === "ArrowRight"
                    ? (idx + 1) % pills.length
                    : (idx - 1 + pills.length) % pills.length;
                pills[nextIdx]?.focus();
                pills[nextIdx]?.click();
                return;
            }
            if (e.key === "Home" || e.key === "End") {
                e.preventDefault();
                e.stopPropagation();
                const pills = Array.from(navBar.querySelectorAll<HTMLButtonElement>(".xlc-settings-nav-pill"));
                if (!pills.length) return;
                const target = e.key === "Home" ? pills[0] : pills[pills.length - 1];
                target?.focus();
                target?.click();
            }
        });
        navBar.appendChild(pill);
    }
    root.appendChild(navBar);

    // 库管理：状态行 + 「更改内容库」展开选择器（分区卡片）
    const libSec = document.createElement("div");
    libSec.id = "xlc-settings-lib";
    libSec.className = "xlc-form-field xlc-card";
    const libLabel = document.createElement("span");
    libLabel.className = "xlc-form-label";
    libLabel.textContent = t("librarySection");
    libSec.appendChild(libLabel);
    const libStatus = document.createElement("div");
    libStatus.className = "xlc-form-hint";
    const cfg = ctx.getConfig();
    libStatus.textContent = cfg
        ? cfg.mode === "notebook" ? t("libModeNotebook", String(cfg.notebookIds.length))
            : cfg.mode === "tree" ? t("libModeTree", String(cfg.containerDocIds.length))
                : t("libModeDoc", String(cfg.containerDocIds.length))
        : t("libraryNone");
    const changeBtn = document.createElement("button");
    changeBtn.type = "button";
    changeBtn.className = "b3-button";
    changeBtn.dataset.xlcControl = "settings.library.change";
    changeBtn.textContent = t("openSettingsChangeLib");
    changeBtn.setAttribute("aria-expanded", "false");
    // 原型屏 5：状态与按钮同行（状态左、按钮右贴）
    const libRow = document.createElement("div");
    libRow.className = "xlc-setting-row";
    const statusText = document.createElement("span");
    statusText.className = "xlc-setting-text";
    statusText.textContent = libStatus.textContent;
    libRow.appendChild(statusText);
    const libBtnWrap = document.createElement("div");
    libBtnWrap.className = "xlc-lib-btn-wrap";
    libBtnWrap.style.display = "inline-flex";
    libBtnWrap.style.alignItems = "center";
    libBtnWrap.style.flexWrap = "wrap";
    libBtnWrap.style.gap = "8px";
    if (cfg && ctx.openLibraryDoc) {
        const openLibBtn = document.createElement("button");
        openLibBtn.type = "button";
        openLibBtn.className = "b3-button";
        openLibBtn.dataset.xlcControl = "settings.library.open-doc";
        openLibBtn.textContent = "📄 打开库文档";
        openLibBtn.title = "在思源笔记编辑器中直接打开当前常用库文档";
        openLibBtn.addEventListener("click", () => {
            dialog.destroy();
            ctx.openLibraryDoc?.();
        });
        libBtnWrap.appendChild(openLibBtn);
    }
    const guideBtn = document.createElement("button");
    guideBtn.type = "button";
    guideBtn.className = "b3-button";
    guideBtn.dataset.xlcControl = "settings.library.step-guide";
    guideBtn.textContent = "🎓 新手指引";
    guideBtn.title = "打开分步实操指引，学习智能注解与高效使用技巧";
    guideBtn.addEventListener("click", () => {
        openStepByStepGuideDialog({t: ctx.t});
    });
    libBtnWrap.appendChild(guideBtn);
    libBtnWrap.appendChild(changeBtn);
    libRow.appendChild(libBtnWrap);
    libSec.appendChild(libRow);
    const pickerHost = document.createElement("div");
    pickerHost.style.display = "none";
    changeBtn.addEventListener("click", () => {
        const show = pickerHost.style.display === "none";
        pickerHost.style.display = show ? "" : "none";
        changeBtn.setAttribute("aria-expanded", show ? "true" : "false");
        if (show && pickerHost.childElementCount === 0) {
            buildLibraryPickerSection(ctx, pickerHost, () => dialog.destroy());
        }
        // 展开即聚焦文档搜索框（R129，对齐「添加即聚焦」惯例）；
        // 布局变更同帧强制聚焦是 Blink 敏感路径（B-004 嫌疑点），rAF 延一帧缓解（R138）
        if (show) requestAnimationFrame(() => {
            try {
                pickerHost.querySelector<HTMLInputElement>(".b3-text-field")?.focus();
            } catch {
                // 聚焦失败不致命：选择器仍可点击
            }
        });
    });
    libSec.appendChild(pickerHost);
    root.appendChild(libSec);

    if (cfg) {
        const modeLabel = libStatus.textContent ?? "";
        const setLocation = (location: string): void => { statusText.textContent = `${modeLabel} · ${location}`; };
        if (cfg.mode === "notebook") {
            void ctx.library.listNotebooks().then((result) => {
                if (!result.ok) return;
                const names = cfg.notebookIds.map((id) => result.data.find((nb) => nb.id === id)?.name ?? id);
                if (names.length) setLocation(names.join(", "));
            });
        } else {
            const docId = cfg.containerDocIds[0];
            if (docId) void ctx.library.getDocPath(docId).then((hPath) => { if (hPath) setLocation(hPath); });
        }
    }

    buildAiSection(ctx, root);
    buildInsertSection(ctx, root);
    buildSearchSection(ctx, root);
    buildSavedViewsSection(ctx, root, () => dialog.destroy());
    buildHealthSection(ctx, root);
    buildExternalIntegrationSection(ctx, root);
    buildProviderSection(ctx, root);
    buildDataSection(ctx, root);
    const ecoOverviewBadge = document.createElement("div");
    ecoOverviewBadge.className = "xlc-settings-eco-badge";
    ecoOverviewBadge.textContent = lvEcosystem.getStatusBadgeText();
    root.appendChild(ecoOverviewBadge);
    body.appendChild(root);
}

/** 模板包导出（F6，原型屏 8 右帧）：包名 / 分类筛选 / 内容清单 → items.md+assets ZIP。
 *  分享的是「活的块」：导入方得到真实思源块，可继续编辑与再分享。 */
async function openPackExportDialog(ctx: SettingsUiContext): Promise<void> {
    const t = ctx.t;
    const idx = await ctx.library.ensureIndex();
    if (idx.truncated || idx.stopped || idx.errors.length > 0) {
        throw new ExportIntegrityError("index-incomplete");
    }
    // 性能（R76 修正 R71 回归）：打开对话框零 kramdown 预取——
    // 「含变量」徽标用写入期 varCount 属性（索引免费读取），正文在点导出时才按筛选取
    const all: CommonItem[] = Array.from(idx.items.values());
    const categories = Array.from(new Set(all.map((i) => i.category).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));

    const isMobileModal = isMobileDialogViewport();
    const dialog = new Dialog({
        title: t("packExportTitle"),
        content: "",
        width: isMobileModal ? "100vw" : "min(580px, 92vw)",
        height: isMobileModal ? "100dvh" : "min(680px, 90vh)", // 固定高：分类切换不顶跳（R146）
    });
    dialog.element.querySelector(".b3-dialog__container")?.classList.add("xlc-form-host", "xlc-settings-host");
    mountPlatformDialogTitleWrap(dialog.element, t("packExportTitle"));
    adaptSecondaryDialogForMobile(dialog, t("close"));
    const body = getDialogBody(dialog.element);
    if (!body) return;
    body.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "xlc-form";

    // 元数据徽标行（随筛选联动）
    const meta = document.createElement("div");
    meta.className = "xlc-import-meta";
    meta.setAttribute("role", "status");
    meta.setAttribute("aria-live", "polite");
    wrap.appendChild(meta);
    const paintMeta = (count: number, varCount: number): void => {
        meta.textContent = "";
        const countBadge = document.createElement("span");
        countBadge.className = "xlc-badge xlc-badge--markdown";
        countBadge.setAttribute("role", "status");
        countBadge.setAttribute("aria-label", t("itemCountBadge", String(count)));
        countBadge.textContent = t("itemCountBadge", String(count));
        meta.appendChild(countBadge);
        if (varCount > 0) {
            const varBadge = document.createElement("span");
            varBadge.className = "xlc-badge xlc-badge--var";
            varBadge.setAttribute("role", "status");
            varBadge.setAttribute("aria-label", t("packVarsBadge", String(varCount)));
            varBadge.textContent = t("packVarsBadge", String(varCount));
            meta.appendChild(varBadge);
        }
    };

    // 分类筛选（全部 / 各分类）
    const catWrap = document.createElement("div");
    catWrap.className = "xlc-form-field";
    const catLabel = document.createElement("label");
    catLabel.className = "xlc-form-label";
    catLabel.textContent = t("packCategoryLabel");
    catWrap.appendChild(catLabel);
    const catSelect = document.createElement("select");
    catSelect.className = "b3-select";
    catSelect.id = "xlc-pack-category";
    catSelect.setAttribute("aria-label", t("packCategoryLabel"));
    catLabel.htmlFor = catSelect.id;
    const allOpt = document.createElement("option");
    allOpt.value = "";
    allOpt.textContent = t("allCategories");
    catSelect.appendChild(allOpt);
    for (const c of categories) {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        catSelect.appendChild(opt);
    }
    catWrap.appendChild(catSelect);
    wrap.appendChild(catWrap);

    // 包名称
    const nameWrap = document.createElement("div");
    nameWrap.className = "xlc-form-field";
    const nameLabel = document.createElement("label");
    nameLabel.className = "xlc-form-label";
    nameLabel.textContent = t("packNameLabel");
    nameWrap.appendChild(nameLabel);
    const nameInput = document.createElement("input");
    nameInput.className = "b3-text-field";
    nameInput.id = "xlc-pack-name";
    nameInput.setAttribute("aria-label", t("packNameLabel"));
    nameLabel.htmlFor = nameInput.id;
    nameInput.value = t("packNameDefault");
    nameWrap.appendChild(nameInput);
    wrap.appendChild(nameWrap);

    // 隐私安全脱敏选项（G31）
    let currentSanitizer: SanitizerOptions | null = null;
    const sanitizeRow = document.createElement("div");
    sanitizeRow.className = "xlc-form-field";
    sanitizeRow.style.display = "flex";
    sanitizeRow.style.alignItems = "center";
    sanitizeRow.style.justifyContent = "space-between";
    sanitizeRow.style.flexWrap = "wrap";
    sanitizeRow.style.gap = "8px";
    sanitizeRow.style.marginTop = "8px";

    const sanitizeLabelWrap = document.createElement("label");
    sanitizeLabelWrap.className = "fn__flex";
    sanitizeLabelWrap.style.alignItems = "center";
    sanitizeLabelWrap.style.gap = "8px";
    sanitizeLabelWrap.style.cursor = "pointer";

    const sanitizeCheckbox = document.createElement("input");
    sanitizeCheckbox.type = "checkbox";
    sanitizeCheckbox.className = "b3-switch";
    sanitizeCheckbox.dataset.xlcControl = "settings.pack-export.sanitizer-toggle";
    sanitizeCheckbox.setAttribute("aria-label", t("packSanitizeLabel"));

    const sanitizeLabelText = document.createElement("span");
    sanitizeLabelText.className = "xlc-form-label";
    sanitizeLabelText.style.marginBottom = "0";
    sanitizeLabelText.textContent = t("packSanitizeLabel");
    sanitizeLabelWrap.append(sanitizeCheckbox, sanitizeLabelText);

    const configSanitizeBtn = document.createElement("button");
    configSanitizeBtn.type = "button";
    configSanitizeBtn.className = "b3-button b3-button--text";
    configSanitizeBtn.dataset.xlcControl = "settings.pack-export.sanitizer-config";
    configSanitizeBtn.textContent = t("packSanitizeConfigBtn");
    configSanitizeBtn.setAttribute("aria-label", t("packSanitizeConfigBtn"));
    configSanitizeBtn.style.fontSize = "12px";
    configSanitizeBtn.addEventListener("click", () => {
        openSanitizerOptionsDialog(currentSanitizer ?? {}, (opts) => {
            currentSanitizer = opts;
            sanitizeCheckbox.checked = true;
            ctx.notify("info", t("packSanitizeConfigured"));
        });
    });

    sanitizeRow.append(sanitizeLabelWrap, configSanitizeBtn);
    wrap.appendChild(sanitizeRow);

    // 包含内容说明
    const contents = document.createElement("div");
    contents.className = "xlc-form-hint";
    contents.style.lineHeight = "1.8";
    // 清单含 \n 三行结构：pre-line 才能换行（默认 div 会塌成一行，R111 修）
    contents.style.whiteSpace = "pre-line";
    contents.textContent = t("packContentsHint");
    wrap.appendChild(contents);
    const trustHint = document.createElement("div");
    trustHint.className = "xlc-form-hint";
    trustHint.style.marginTop = "8px";
    trustHint.textContent = t("packTrustHint");
    wrap.appendChild(trustHint);

    const actions = document.createElement("div");
    actions.className = "xlc-form-actions";
    actions.setAttribute("role", "toolbar");
    actions.setAttribute("aria-label", "模板包导出操作栏");
    actions.addEventListener("keydown", (e: any) => {
        if (e.isComposing || e.keyCode === 229) return;
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            const btns = Array.from(actions.querySelectorAll<HTMLButtonElement>("button:not([disabled])"));
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
            const btns = Array.from(actions.querySelectorAll<HTMLButtonElement>("button:not([disabled])"));
            if (!btns.length) return;
            e.preventDefault();
            e.stopPropagation();
            if (e.key === "Home") btns[0]?.focus();
            else btns[btns.length - 1]?.focus();
        }
    });
    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "b3-button";
    cancelBtn.dataset.xlcControl = "settings.pack-export.cancel";
    cancelBtn.textContent = t("cancel");
    cancelBtn.setAttribute("aria-label", t("cancel"));
    actions.appendChild(cancelBtn);
    const exportBtn = document.createElement("button");
    exportBtn.type = "button";
    exportBtn.className = "b3-button xlc-btn-primary";
    exportBtn.textContent = t("packExportBtn");
    exportBtn.setAttribute("aria-label", t("packExportBtn"));
    exportBtn.addEventListener("click", () => {
        const packName = nameInput.value.trim() || t("packNameDefault");
        const category = catSelect.value;
        const items = category ? all.filter((i) => i.category === category) : all;
        if (items.length === 0) {
            ctx.notify("error", t("exportEmpty"));
            return;
        }
        // 导出执行期保留对话框：按钮飞行态防重入（此前 destroy 后可并发再次导出，R138）
        if (exportBtn.disabled) return;
        exportBtn.disabled = true;
        exportBtn.textContent = t("indexing");
        void (async () => {
            // 导出时才按筛选取正文（打开对话框零预取）
            const kramdownById = await collectKramdown(ctx, items);
            const sanitizer = sanitizeCheckbox.checked ? (currentSanitizer ?? {mode: "mask"}) : undefined;
            const result = await buildMarkdownExport(items, kramdownById, (assetPath) => ctx.fetchAssetBytes(assetPath), {
                pack: {name: packName},
                sanitizer,
            });
            const zipBytes = buildZip(result.entries);
            const blob = new Blob([zipBytes as unknown as BlobPart], {type: "application/zip"});
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            // 全部替换成特殊字符时保底名，避免产出「--.zip」（R138）
            const safeName = packName.replace(/[\\/:*?"<>|\s]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "pack";
            a.download = `${safeName}-${new Date().toISOString().slice(0, 10)}.zip`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 4000); // 下载启动后再回收（R138）
            dialog.destroy();
            ctx.notify("info", t("exportMdDone", String(result.itemCount), String(result.assetCount), String(result.skippedAssets.length)));
        })().catch((err: unknown) => {
            exportBtn.disabled = false;
            exportBtn.textContent = t("packExportBtn");
            ctx.notify("error", formatExportError(ctx, err));
        });
    });
    actions.appendChild(exportBtn);
    wrap.appendChild(actions);

    wrap.addEventListener("keydown", (e) => {
        if (e.isComposing || (e as KeyboardEvent).keyCode === 229) return;
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            if (e.repeat || exportBtn.disabled) return;
            e.preventDefault();
            exportBtn.click();
        }
    });

    body.appendChild(wrap);

    const repaint = (): void => {
        const category = catSelect.value;
        const items = category ? all.filter((i) => i.category === category) : all;
        // 含变量条数用写入期 varCount 徽标（零内核调用；行为以插入时现场内容为准）
        const withVars = items.filter((i) => (i.varCount ?? 0) > 0).length;
        paintMeta(items.length, withVars);
    };
    catSelect.addEventListener("change", repaint);
    repaint();
}

/** 收集筛选后条目的 kramdown（导出确认时才取正文） */
async function collectKramdown(
    ctx: SettingsUiContext,
    items: readonly CommonItem[],
): Promise<Map<string, string>> {
    const kramdownById = new Map<string, string>();
    for (const item of items) {
        const kd = await ctx.library.getStoredItemKramdown(item);
        if (!kd.ok) throw new ExportIntegrityError("item-unreadable", item.title || item.id, kd.message);
        kramdownById.set(item.id, kd.data);
    }
    return kramdownById;
}

function formatExportError(ctx: Pick<SettingsUiContext, "t">, err: unknown): string {
    if (err instanceof ExportIntegrityError) {
        switch (err.reason) {
            case "index-incomplete": return ctx.t("exportIncompleteIndex");
            case "item-unreadable": return ctx.t("exportItemReadFailed", err.itemLabel, err.detail);
            case "body-missing": return ctx.t("exportBodyMissing", err.itemLabel);
            case "too-large": return ctx.t("exportTooLarge", err.detail);
        }
    }
    return ctx.t("kernelError", toErrorMessage(err));
}

/** 变量与插入（F1/F3，原型屏 5）：插入前询问 / 使用计数开关 / 清空统计 */
function buildInsertSection(ctx: SettingsUiContext, root: HTMLElement): void {
    const t = ctx.t;
    const sec = document.createElement("div");
    sec.id = "xlc-settings-prefs";
    sec.className = "xlc-form-field xlc-card";
    const label = document.createElement("span");
    label.className = "xlc-form-label";
    label.textContent = t("insertSection");
    sec.appendChild(label);
    sec.appendChild(buildSwitchRow(
        t("promptVariablesToggle"),
        t("promptVariablesSub"),
        ctx.state.insert.promptVariables,
        (value) => {
            ctx.state.insert.promptVariables = value;
            ctx.persistSoon();
        },
    ));
    sec.appendChild(buildSwitchRow(
        t("recordUsageToggle"),
        t("recordUsageSub"),
        ctx.state.insert.recordUsage,
        (value) => {
            ctx.state.insert.recordUsage = value;
            ctx.persistSoon();
        },
    ));
    const clipSwitchRow = buildSwitchRow(
        t("clipboardHistoryToggle"),
        t("clipboardHistorySub"),
        !(ctx.state.clipboardHistoryEnabled === false),
        (value) => {
            ctx.state.clipboardHistoryEnabled = value;
            syncClipLimitUi();
            ctx.persistSoon();
        },
    );
    const clipSwitchInput = clipSwitchRow.querySelector<HTMLInputElement>("input[type='checkbox']");
    if (clipSwitchInput) clipSwitchInput.dataset.xlcControl = "settings.prefs.clipboardHistoryEnabled";
    sec.appendChild(clipSwitchRow);

    // 剪贴板历史容量设置行（默认 30 条，支持 30/50/80/100 或自定义，最大 100 条）
    const clipLimitRow = document.createElement("div");
    clipLimitRow.className = "xlc-setting-row";
    clipLimitRow.dataset.xlcControl = "settings.prefs.clipboardLimitRow";

    const clipLimitCol = document.createElement("div");
    clipLimitCol.className = "xlc-setting-text";
    const clipLimitTitle = document.createElement("div");
    clipLimitTitle.textContent = t("clipboardLimitLabel");
    const clipLimitSub = document.createElement("div");
    clipLimitSub.className = "xlc-setting-sub";
    clipLimitSub.textContent = t("clipboardLimitSub");
    clipLimitCol.append(clipLimitTitle, clipLimitSub);
    clipLimitRow.appendChild(clipLimitCol);

    const clipLimitControls = document.createElement("div");
    clipLimitControls.className = "xlc-clip-limit-controls";
    clipLimitControls.style.cssText = "display:inline-flex; align-items:center; flex-wrap:wrap; gap:8px;";

    const clipLimitSelect = document.createElement("select");
    clipLimitSelect.className = "b3-select";
    clipLimitSelect.dataset.xlcControl = "settings.prefs.clipboardLimitSelect";
    clipLimitSelect.setAttribute("aria-label", t("clipboardLimitLabel"));
    const presets = [
        {value: "30", label: "30 条（推荐）"},
        {value: "50", label: "50 条"},
        {value: "80", label: "80 条"},
        {value: "100", label: "100 条（上限）"},
        {value: "custom", label: "自定义..."},
    ];
    for (const p of presets) {
        const opt = document.createElement("option");
        opt.value = p.value;
        opt.textContent = p.label;
        clipLimitSelect.appendChild(opt);
    }

    const clipLimitInput = document.createElement("input");
    clipLimitInput.type = "number";
    clipLimitInput.inputMode = "numeric";
    clipLimitInput.className = "b3-text-field";
    clipLimitInput.style.cssText = "width:72px; text-align:center; display:none;";
    clipLimitInput.min = "10";
    clipLimitInput.max = "100";
    clipLimitInput.step = "1";
    clipLimitInput.dataset.xlcControl = "settings.prefs.clipboardLimitInput";
    clipLimitInput.setAttribute("aria-label", "自定义条数");

    const currentLimit = ctx.state.clipboardHistoryLimit ?? 30;
    const isPreset = ["30", "50", "80", "100"].includes(String(currentLimit));
    clipLimitSelect.value = isPreset ? String(currentLimit) : "custom";
    clipLimitInput.value = String(currentLimit);
    if (!isPreset) clipLimitInput.style.display = "";

    const applyNewLimit = (val: number): void => {
        const clamped = Math.max(10, Math.min(100, Math.round(val) || 30));
        ctx.state.clipboardHistoryLimit = clamped;
        if (ctx.state.clipboardHistory && ctx.state.clipboardHistory.length > clamped) {
            ctx.state.clipboardHistory = ctx.state.clipboardHistory.slice(0, clamped);
        }
        ctx.persistSoon();
    };

    clipLimitSelect.addEventListener("change", () => {
        if (clipLimitSelect.value === "custom") {
            clipLimitInput.style.display = "";
            clipLimitInput.focus();
            clipLimitInput.select();
        } else {
            clipLimitInput.style.display = "none";
            const val = Number(clipLimitSelect.value);
            clipLimitInput.value = String(val);
            applyNewLimit(val);
        }
    });

    clipLimitInput.addEventListener("change", () => {
        const val = Number(clipLimitInput.value);
        applyNewLimit(val);
        clipLimitInput.value = String(ctx.state.clipboardHistoryLimit ?? 30);
    });

    const clearClipBtn = document.createElement("button");
    clearClipBtn.type = "button";
    clearClipBtn.className = "b3-button";
    clearClipBtn.dataset.xlcControl = "settings.prefs.clearClipboardHistory";
    clearClipBtn.textContent = t("clearClipboardBtn");
    clearClipBtn.title = t("clearClipboardBtn");
    clearClipBtn.addEventListener("click", () => {
        const count = (ctx.state.clipboardHistory ?? []).length;
        if (count === 0) {
            ctx.notify("info", t("clearClipboardEmpty"));
            return;
        }
        confirm("⚠️ " + t("clearClipboardBtn"), t("clearClipboardConfirm"), () => {
            ctx.state.clipboardHistory = [];
            ctx.persistSoon();
            ctx.notify("info", t("clearClipboardDone"));
        });
    });

    clipLimitControls.append(clipLimitSelect, clipLimitInput, clearClipBtn);
    clipLimitRow.appendChild(clipLimitControls);
    sec.appendChild(clipLimitRow);

    // 剪贴板智能匹配（默认关闭，设置内 opt-in · Mobile Spec v2）
    const smartMatchSwitchRow = buildSwitchRow(
        t("clipboardSmartMatchToggle"),
        t("clipboardSmartMatchSub"),
        ctx.state.clipboardSmartMatchEnabled === true,
        (value) => {
            ctx.state.clipboardSmartMatchEnabled = value;
            ctx.persistSoon();
        },
    );
    const smartMatchInput = smartMatchSwitchRow.querySelector<HTMLInputElement>("input[type='checkbox']");
    if (smartMatchInput) smartMatchInput.dataset.xlcControl = "settings.prefs.clipboardSmartMatchEnabled";
    sec.appendChild(smartMatchSwitchRow);

    const syncClipLimitUi = (): void => {
        const on = !(ctx.state.clipboardHistoryEnabled === false);
        clipLimitRow.style.display = on ? "" : "none";
    };
    syncClipLimitUi();
    const foot = document.createElement("div");
    foot.className = "xlc-setting-row";
    const hint = document.createElement("span");
    hint.className = "xlc-setting-text";
    hint.textContent = t("usageStatsHint");
    foot.appendChild(hint);
    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "b3-button";
    clearBtn.setAttribute("aria-label", t("clearUsageBtn"));
    const hasUsage = (): boolean =>
        Object.values(ctx.state.usage).some((item) => item.count > 0) ||
        Object.values(ctx.state.dailyUsage ?? {}).some((c) => c > 0);
    const syncClearUsage = (): void => {
        clearBtn.disabled = !hasUsage();
        clearBtn.textContent = hasUsage() ? t("clearUsageBtn") : t("clearUsageEmpty");
    };
    syncClearUsage();
    clearBtn.addEventListener("click", () => {
        if (!hasUsage()) return;
        confirm("⚠️ " + t("clearUsageBtn"), t("clearUsageConfirm"), () => {
            ctx.state.usage = {};
            ctx.state.dailyUsage = {};
            ctx.persistSoon();
            ctx.refreshSearch?.();
            syncClearUsage();
            paintSummary();
            ctx.notify("info", t("clearUsageDone"));
        });
    });
    foot.appendChild(clearBtn);
    sec.appendChild(foot);

    // 变量填写历史记忆管理（G22 / TD-006：提供侧车变量记忆项数可视化与一键清空入口）
    const memRow = document.createElement("div");
    memRow.className = "xlc-setting-row";
    const memHint = document.createElement("span");
    memHint.className = "xlc-setting-text";
    memHint.textContent = t("variableMemoryHint") || "变量填写历史记忆保存在本机侧车，插入填写时自动预填上次输入值。";
    memRow.appendChild(memHint);
    const clearMemBtn = document.createElement("button");
    clearMemBtn.type = "button";
    clearMemBtn.className = "b3-button";
    clearMemBtn.dataset.xlcControl = "settings.variable-memory.clear";
    const syncClearMem = (): void => {
        const memCount = countRememberedFields(ctx.state.variableMemory);
        clearMemBtn.disabled = memCount === 0;
        const labelText = memCount > 0
            ? `${t("clearVariableMemoryBtn") || "清空变量记忆"} (${memCount})`
            : (t("clearVariableMemoryEmpty") || "暂无变量记忆");
        clearMemBtn.textContent = labelText;
        clearMemBtn.setAttribute("aria-label", labelText);
    };
    syncClearMem();
    clearMemBtn.addEventListener("click", () => {
        if (countRememberedFields(ctx.state.variableMemory) === 0) return;
        const confirmTitle = "⚠️ " + (t("clearVariableMemoryBtn") || "清空变量记忆");
        const confirmBody = t("clearVariableMemoryConfirm") || "确定清空本机记住的所有变量历史填写值吗？条目模板本身不会受影响。";
        confirm(confirmTitle, confirmBody, () => {
            ctx.state.variableMemory = clearAllMemory(ctx.state.variableMemory);
            ctx.persistSoon();
            syncClearMem();
            ctx.notify("info", t("clearVariableMemoryDone") || "已清空变量填写历史记忆");
        });
    });
    memRow.appendChild(clearMemBtn);
    sec.appendChild(memRow);

    const summary = document.createElement("div");
    summary.className = "xlc-usage-summary";
    summary.dataset.xlcControl = "settings.usage.summary";
    summary.setAttribute("role", "status");
    summary.setAttribute("aria-live", "polite");

    const insightsBox = document.createElement("div");
    insightsBox.className = "xlc-usage-insights";
    insightsBox.dataset.xlcControl = "settings.usage.insights";
    insightsBox.tabIndex = 0;
    insightsBox.setAttribute("role", "region");
    insightsBox.setAttribute("aria-label", "复用洞察分析");

    const paintInsights = async (): Promise<void> => {
        insightsBox.replaceChildren();
        const usage = ctx.state.usage;
        const total = Object.values(usage).reduce((sum, u) => sum + (u.count || 0), 0);
        if (total === 0) return;

        let items: UsageItemMeta[] = [];
        try {
            const index = await ctx.library.ensureIndex();
            items = index.entries.map((e) => ({
                id: e.id,
                title: e.title || e.id,
                contentLength: e.summary ? e.summary.length * 3 : 25,
            }));
        } catch {
            items = [];
        }

        const insights = calculateUsageInsights(usage, items, Date.now());

        // 参考图同款：Bento Grid 双色数据看板卡片
        const bentoDeck = document.createElement("div");
        bentoDeck.className = "xlc-bento-deck";

        const mangoCard = document.createElement("div");
        mangoCard.className = "xlc-bento-card xlc-bento-card--mango";
        const mangoHead = document.createElement("div");
        mangoHead.className = "xlc-bento-head";
        mangoHead.textContent = "🔥 累计调用";
        const mangoVal = document.createElement("div");
        mangoVal.className = "xlc-bento-value";
        const valSpan = document.createElement("span");
        valSpan.style.cssText = "font-size:12px; font-weight:normal;";
        valSpan.textContent = " 次";
        mangoVal.append(document.createTextNode(String(insights.totalCalls)), valSpan);
        const mangoSub = document.createElement("div");
        mangoSub.className = "xlc-bento-sub";
        mangoSub.textContent = `节省约 ${insights.totalSavedKeystrokes} 字符`;
        mangoCard.append(mangoHead, mangoVal, mangoSub);

        const lilacCard = document.createElement("div");
        lilacCard.className = "xlc-bento-card xlc-bento-card--lilac";
        const lilacHead = document.createElement("div");
        lilacHead.className = "xlc-bento-head";
        lilacHead.textContent = "⚡ 效率增益";
        const lilacVal = document.createElement("div");
        lilacVal.className = "xlc-bento-value";
        lilacVal.textContent = insights.formattedTimeSaved;
        const lilacSub = document.createElement("div");
        lilacSub.className = "xlc-bento-sub";
        lilacSub.textContent = `近7天活跃 ${insights.activeItems7Days} 项`;
        lilacCard.append(lilacHead, lilacVal, lilacSub);

        bentoDeck.append(mangoCard, lilacCard);
        insightsBox.appendChild(bentoDeck);

        const grid = document.createElement("div");
        grid.className = "xlc-insights-grid";

        const mkMetric = (numText: string, labelText: string): HTMLElement => {
            const card = document.createElement("div");
            card.className = "xlc-insights-metric";
            const val = document.createElement("strong");
            val.className = "xlc-insights-val";
            val.textContent = numText;
            const cap = document.createElement("span");
            cap.className = "xlc-insights-cap";
            cap.textContent = labelText;
            card.append(val, cap);
            return card;
        };

        grid.append(
            mkMetric(String(insights.totalCalls), "累计调用 (次)"),
            mkMetric(String(insights.totalSavedKeystrokes), "节省击键 (字符)"),
            mkMetric(insights.formattedTimeSaved, "估算节省时间"),
            mkMetric(String(insights.activeItems7Days), "7天活跃条目"),
        );
        insightsBox.appendChild(grid);

        // 高频资产 Top 榜单直达（G52）；R431：过滤已从库中删除的幽灵条目，
        // 避免榜单露出裸块 ID（xlc-xxxx）且点击复制静默失败
        const knownItemIds = new Set(items.map((it) => it.id));
        const visibleTopItems = filterKnownTopItems(insights.topItems, knownItemIds);
        if (visibleTopItems.length > 0) {
            const topSec = document.createElement("div");
            topSec.className = "xlc-insights-top";
            topSec.style.cssText = "margin-top:10px; display:flex; flex-direction:column; gap:6px;";
            const topHead = document.createElement("div");
            topHead.style.cssText = "font-size:13px; font-weight:600; color:var(--b3-theme-on-surface); display:flex; align-items:center; gap:4px;";
            topHead.textContent = "⭐ 高频资产 Top 榜（点击直接复制）：";
            topSec.appendChild(topHead);

            const pillsWrap = document.createElement("div");
            pillsWrap.style.cssText = "display:flex; flex-wrap:wrap; gap:6px;";

            for (const [idx, item] of visibleTopItems.slice(0, 5).entries()) {
                const pill = document.createElement("button");
                pill.type = "button";
                pill.className = "xlc-quick-pill";
                pill.style.cssText = "padding:3px 10px; font-size:12px; display:inline-flex; align-items:center; gap:5px;";
                pill.textContent = `#${idx + 1} ${item.title} (${item.count}次)`;
                pill.title = `点击复制「${item.title}」正文`;
                pill.addEventListener("click", async () => {
                    try {
                        const got = await ctx.library.getItem(item.id);
                        if (got.ok) {
                            const kd = await ctx.library.getItemKramdown(got.data);
                            if (kd.ok && navigator.clipboard) {
                                await navigator.clipboard.writeText(kd.data);
                                ctx.notify("info", `已复制高频资产「${item.title}」到剪贴板`);
                            }
                        }
                    } catch {
                        // ignore
                    }
                });
                pillsWrap.appendChild(pill);
            }
            topSec.appendChild(pillsWrap);
            insightsBox.appendChild(topSec);
        }

        // 近 30 天资产复用活跃热力图（TODO-FEAT-008 / CAND-009）
        const dailyMap = buildDailyUsageMap(ctx.state.dailyUsage, usage);
        const heatmap = calculateHeatmap(dailyMap, 30, Date.now());

        const heatmapSec = document.createElement("div");
        heatmapSec.className = "xlc-heatmap-section";
        heatmapSec.dataset.xlcControl = "settings.usage.heatmap";
        heatmapSec.setAttribute("role", "region");
        heatmapSec.setAttribute("aria-label", "近30天资产复用活跃热力图");

        const heatmapHead = document.createElement("div");
        heatmapHead.className = "xlc-heatmap-head";

        const heatmapTitle = document.createElement("span");
        heatmapTitle.className = "xlc-heatmap-title";
        // 「窗口内」措辞（R431）：此计数只统计 30 天窗口，与上方「累计调用」的全期口径不同，
        // 旧称「累计」会让历史使用（窗口外）用户误读为数据矛盾
        heatmapTitle.textContent = `📅 近 30 天资产复用活跃度（窗口内 ${heatmap.totalCalls30Days} 次 · 活跃 ${heatmap.activeDays} 天）：`;
        heatmapHead.appendChild(heatmapTitle);

        const heatmapGrid = document.createElement("div");
        heatmapGrid.className = "xlc-heatmap-grid";
        heatmapGrid.setAttribute("role", "grid");
        heatmapGrid.setAttribute("aria-label", "30天每日活跃热力格");

        for (const day of heatmap.days) {
            const cell = document.createElement("div");
            cell.className = `xlc-heatmap-cell xlc-heatmap-cell--l${day.level}`;
            cell.dataset.date = day.date;
            cell.dataset.count = String(day.count);
            cell.dataset.level = String(day.level);
            cell.title = `${day.date}：${day.count} 次复用`;
            cell.setAttribute("aria-label", cell.title);
            cell.tabIndex = 0;
            heatmapGrid.appendChild(cell);
        }

        const heatmapFoot = document.createElement("div");
        heatmapFoot.className = "xlc-heatmap-foot";

        const legendLabelLess = document.createElement("span");
        legendLabelLess.className = "xlc-heatmap-legend-label";
        legendLabelLess.textContent = "少";

        const legendTrack = document.createElement("div");
        legendTrack.className = "xlc-heatmap-legend-track";
        for (let lvl = 0; lvl <= 4; lvl++) {
            const legendCell = document.createElement("span");
            legendCell.className = `xlc-heatmap-cell xlc-heatmap-cell--l${lvl}`;
            legendCell.title = lvl === 0 ? "0 次" : lvl === 1 ? "1~2 次" : lvl === 2 ? "3~5 次" : lvl === 3 ? "6~9 次" : "10+ 次";
            legendCell.setAttribute("aria-label", legendCell.title);
            legendTrack.appendChild(legendCell);
        }

        const legendLabelMore = document.createElement("span");
        legendLabelMore.className = "xlc-heatmap-legend-label";
        legendLabelMore.textContent = "多";

        heatmapFoot.append(legendLabelLess, legendTrack, legendLabelMore);

        heatmapSec.append(heatmapHead, heatmapGrid, heatmapFoot);
        insightsBox.appendChild(heatmapSec);
    };

    const paintSummary = (): void => {
        const current = summarizeUsage(ctx.state.usage);
        summary.textContent = t("usageStatsSummary", String(current.totalCount), String(current.trackedItems));
        void paintInsights();
    };
    paintSummary();
    sec.appendChild(summary);
    sec.appendChild(insightsBox);
    root.appendChild(sec);
}

/** 内容提供方列表：注册状态一目了然（可执行 = 本次会话已接线；待重载 = 提供方需重新 register） */
function buildProviderSection(ctx: SettingsUiContext, root: HTMLElement): void {
    const t = ctx.t;
    const provSec = document.createElement("div");
    provSec.className = "xlc-form-field xlc-card";
    const provLabel = document.createElement("span");
    provLabel.className = "xlc-form-label";
    provLabel.textContent = t("providerSection");
    provSec.appendChild(provLabel);
    const providers = ctx.registry.list();
    if (providers.length === 0) {
        const empty = document.createElement("div");
        empty.className = "xlc-form-hint";
        empty.textContent = t("providerNone");
        provSec.appendChild(empty);
    } else {
        const provList = document.createElement("div");
        provList.className = "xlc-provider-list";
        provList.setAttribute("role", "list");
        provList.setAttribute("aria-label", t("providerSection"));
        for (const p of providers) {
            const row = document.createElement("div");
            row.className = "xlc-setting-row";
            row.setAttribute("role", "listitem");
            const statusLabel = p.runtime ? t("providerExecutable") : t("providerPendingReload");
            row.setAttribute("aria-label", `${p.record.displayName}（v${p.record.protocolVersion}）· ${statusLabel}`);
            const status = document.createElement("span");
            // 可执行=AI 蓝（原型屏 5 同款）；待重载=warn 红保持
            status.className = "xlc-badge " + (p.runtime ? "xlc-badge--ai" : "xlc-badge--warn");
            status.textContent = statusLabel;
            const cap = document.createElement("span");
            cap.textContent = `${p.record.displayName}（v${p.record.protocolVersion}）`;
            row.appendChild(status);
            row.appendChild(cap);
            provList.appendChild(row);
        }
        provSec.appendChild(provList);
    }
    root.appendChild(provSec);
}

/** 步骤指示（原型屏 6）：dot(+状态) — 线 — dot + 文案 */
function buildStepsEl(current: 1 | 2, caption: string): HTMLElement {
    const steps = document.createElement("div");
    steps.className = "xlc-steps";
    const dot1 = document.createElement("span");
    dot1.className = "xlc-step-dot" + (current === 1 ? " xlc-step-dot--on" : "");
    dot1.textContent = current === 1 ? "1" : "✓";
    steps.appendChild(dot1);
    const line = document.createElement("span");
    line.className = "xlc-step-line";
    steps.appendChild(line);
    const dot2 = document.createElement("span");
    dot2.className = "xlc-step-dot" + (current === 2 ? " xlc-step-dot--on" : "");
    dot2.textContent = "2";
    steps.appendChild(dot2);
    const cap = document.createElement("span");
    cap.className = "xlc-step-cap";
    cap.textContent = caption;
    steps.appendChild(cap);
    return steps;
}

/**
 * 库选择器（首跑引导与「更改库」共用；onConfigured 在配置落地后回调）。
 * 两步式（原型屏 6）：① 选库方式（文档选择器/笔记本/新建）→ ② 确认落点后写入。
 * 创建新库文档仍为立即动作（confirm 后直达配置）。onDismiss 提供「稍后再说」。
 */
function buildLibraryPickerSection(ctx: SettingsUiContext, root: HTMLElement, onConfigured: () => void, opts?: {onDismiss?: () => void}): void {
    const t = ctx.t;
    let step: 1 | 2 = 1;
    let setupRevision = 0;
    let pickedDoc: {id: string; hPath: string} | null = null;

    const stepsEl = buildStepsEl(1, t("setupStep1"));
    root.appendChild(stepsEl);
    const hint = document.createElement("p");
    hint.className = "xlc-form-hint";
    hint.style.marginBottom = "2px";
    hint.textContent = t("setupHint");
    root.appendChild(hint);
    // 首次设置就给出可执行的最短路径，避免用户配置完库后不知道如何开始。
    // 模板包仍由用户显式点击导入，避免在库中静默写入示例块。
    const usageGuide = document.createElement("p");
    usageGuide.className = "xlc-form-hint";
    usageGuide.style.whiteSpace = "pre-line";
    usageGuide.textContent = t("setupUsageGuide");
    root.appendChild(usageGuide);
    const recommendation = document.createElement("p");
    recommendation.className = "xlc-form-hint xlc-setup-recommendation";
    recommendation.textContent = t("setupRecommendation");
    root.appendChild(recommendation);
    const existingConfig = ctx.getConfig();
    const showQuickStart = !existingConfig;
    // 未配置用户优先读三步卡；详细变量说明留给可重复打开的完整帮助，避免首屏重复堆字。
    if (showQuickStart) usageGuide.style.display = "none";

    // 首次进入时把最短可用路径拆成可扫描的三步，避免用户只看到配置项却不知道配置完成后做什么。
    const quickStart = document.createElement("section");
    quickStart.className = "xlc-setup-quickstart";
    quickStart.setAttribute("role", "region");
    quickStart.setAttribute("aria-labelledby", "xlc-setup-quickstart-title");
    const quickStartTitle = document.createElement("h3");
    quickStartTitle.className = "xlc-setup-quickstart-title";
    quickStartTitle.id = "xlc-setup-quickstart-title";
    quickStartTitle.textContent = t("setupQuickStartTitle");
    quickStart.appendChild(quickStartTitle);
    const quickStartItems: Array<[string, string, string]> = [
        ["1", t("setupQuickStart1Title"), t("setupQuickStart1Desc")],
        ["2", t("setupQuickStart2Title"), t("setupQuickStart2Desc")],
        ["3", t("setupQuickStart3Title"), t("setupQuickStart3Desc")],
    ];
    for (const [number, title, desc] of quickStartItems) {
        const item = document.createElement("div");
        item.className = "xlc-setup-quickstart-item";
        const dot = document.createElement("span");
        dot.className = "xlc-setup-quickstart-dot";
        dot.textContent = number;
        dot.setAttribute("aria-hidden", "true");
        const copy = document.createElement("span");
        copy.className = "xlc-setup-quickstart-copy";
        const itemTitle = document.createElement("strong");
        itemTitle.className = "xlc-setup-quickstart-item-title";
        itemTitle.textContent = title;
        const itemDesc = document.createElement("span");
        itemDesc.className = "xlc-setup-quickstart-item-desc";
        itemDesc.textContent = desc;
        copy.append(itemTitle, itemDesc);
        item.append(dot, copy);
        quickStart.appendChild(item);
    }
    root.appendChild(quickStart);
    if (!showQuickStart) quickStart.style.display = "none";

    // 🚀 最简一键快速建库卡片（直达极简无脑完成路径）
    const oneClickCard = document.createElement("section");
    oneClickCard.className = "xlc-setup-oneclick-card";
    oneClickCard.setAttribute("role", "region");
    oneClickCard.setAttribute("aria-label", "最简极速方案");
    oneClickCard.style.cssText = "display: flex; flex-direction: column; gap: 8px; padding: 12px 14px; border: 1.5px solid var(--b3-theme-primary); border-radius: var(--xlc-radius-sm); background: color-mix(in srgb, var(--b3-theme-primary) 8%, var(--b3-theme-surface)); margin-bottom: 12px;";

    const oneClickHead = document.createElement("div");
    oneClickHead.style.cssText = "display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;";
    oneClickHead.innerHTML = `<strong>🚀 极速一键方案（最省心 · 推荐）</strong><span class="xlc-form-hint" style="font-size:12px;">自动建库与初始化，无脑点击即完成</span>`;
    oneClickCard.appendChild(oneClickHead);

    const oneClickBtn = document.createElement("button");
    oneClickBtn.type = "button";
    oneClickBtn.className = "b3-button xlc-btn-primary";
    oneClickBtn.dataset.xlcControl = "setup.oneclick.create";
    oneClickBtn.style.cssText = "min-height: 36px; font-size: 14px; font-weight: 600; justify-content: center;";
    oneClickBtn.textContent = "✨ 一键创建并开始使用（全自动）";
    let oneClickBusy = false;
    oneClickBtn.addEventListener("click", async () => {
        if (oneClickBusy) return;
        oneClickBusy = true;
        oneClickBtn.disabled = true;
        oneClickBtn.textContent = t("saving");
        try {
            const nbRes = await ctx.library.listNotebooks();
            const defaultDocTitle = t("setupNewDocName") || "常用内容库";
            if (nbRes.ok && nbRes.data.length > 0) {
                const targetNbId = nbRes.data[0]!.id;
                const docRes = await ctx.library.createLibraryDoc(targetNbId, defaultDocTitle, {seedInitialDoc: true});
                if (!docRes.ok) throw new Error(docRes.message);
                ctx.applyConfig({
                    configVersion: CONFIG_VERSION,
                    mode: "doc",
                    notebookIds: [],
                    containerDocIds: [docRes.data.docId],
                    createdDocIds: [docRes.data.docId],
                    configuredAt: Date.now(),
                });
            } else {
                const indepRes = await ctx.library.createIndependentLibrary(t("pluginName") || "小驴常用", defaultDocTitle, {seedInitialDoc: true});
                if (!indepRes.ok) throw new Error(indepRes.message);
                ctx.applyConfig({
                    configVersion: CONFIG_VERSION,
                    mode: "notebook",
                    notebookIds: [indepRes.data.notebookId],
                    containerDocIds: [indepRes.data.docId],
                    createdDocIds: [indepRes.data.docId],
                    createdNotebookIds: [indepRes.data.notebookId],
                    configuredAt: Date.now(),
                });
            }
            ctx.notify("info", t("libDocCreated", defaultDocTitle));
            onConfigured();
        } catch (err) {
            oneClickBusy = false;
            oneClickBtn.disabled = false;
            oneClickBtn.textContent = "✨ 一键创建并开始使用（全自动）";
            ctx.notify("error", t("kernelError", toErrorMessage(err)));
        }
    });
    oneClickCard.appendChild(oneClickBtn);

    const manualDivider = document.createElement("div");
    manualDivider.style.cssText = "display: flex; align-items: center; gap: 8px; margin: 4px 0 10px 0; color: var(--b3-theme-on-surface); font-size: 12px;";
    manualDivider.innerHTML = `<span style="flex:1; height:1px; background:var(--b3-border-color);"></span><span>或者：手动选择其他方式 ▼</span><span style="flex:1; height:1px; background:var(--b3-border-color);"></span>`;

    root.appendChild(oneClickCard);
    root.appendChild(manualDivider);

    // ---- 第 1 步：选库方式 ----
    const step1 = document.createElement("div");
    const modeWrap = document.createElement("div");
    modeWrap.className = "xlc-form-field";
    const modeLabel = document.createElement("label");
    modeLabel.className = "xlc-form-label";
    modeLabel.textContent = t("setupModeLabel");
    modeWrap.appendChild(modeLabel);
    const modeSelect = document.createElement("select");
    modeSelect.className = "b3-select";
    modeSelect.id = "xlc-setup-mode";
    modeSelect.dataset.xlcControl = "setup.mode";
    modeSelect.setAttribute("aria-label", t("setupModeLabel"));
    modeLabel.htmlFor = modeSelect.id;
    const modes: Array<{v: "new-doc" | "new-notebook" | "doc" | "tree" | "notebook"; label: string}> = [
        {v: "new-doc", label: t("setupCreateNewDoc")},
        {v: "new-notebook", label: t("setupCreateIndependentNotebook")},
        {v: "doc", label: t("setupPickDoc")},
        {v: "tree", label: t("setupPickDocTree")},
        {v: "notebook", label: t("setupNotebook")},
    ];
    for (const m of modes) {
        const opt = document.createElement("option");
        opt.value = m.v;
        opt.textContent = m.label;
        modeSelect.appendChild(opt);
    }
    if (existingConfig) modeSelect.value = existingConfig.mode;
    modeWrap.appendChild(modeSelect);
    step1.appendChild(modeWrap);

    // doc/tree：文档选择器（searchDocs 关键词搜索 → 点选使用）
    const pickerWrap = document.createElement("div");
    pickerWrap.className = "xlc-form-field";
    const pickerInput = document.createElement("input");
    pickerInput.className = "b3-text-field";
    pickerInput.placeholder = t("docPicker");
    pickerInput.setAttribute("aria-label", t("docPicker"));
    pickerInput.dataset.xlcControl = "setup.docs.query";
    pickerWrap.appendChild(pickerInput);
    const pickerList = document.createElement("div");
    pickerList.className = "xlc-doclist";
    pickerList.setAttribute("role", "listbox");
    pickerList.setAttribute("aria-label", t("docPicker"));
    pickerList.addEventListener("keydown", (e) => {
        if (e.isComposing || e.keyCode === 229) return;
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            const items = Array.from(pickerList.querySelectorAll<HTMLButtonElement>(".xlc-doclist-item"));
            if (!items.length) return;
            const idx = items.indexOf(document.activeElement as HTMLButtonElement);
            if (idx === -1) return;
            e.preventDefault();
            e.stopPropagation();
            const nextIdx = e.key === "ArrowDown" ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length;
            items[nextIdx]?.focus();
            return;
        }
        if (e.key === "Home" || e.key === "End") {
            const items = Array.from(pickerList.querySelectorAll<HTMLButtonElement>(".xlc-doclist-item"));
            if (!items.length) return;
            e.preventDefault();
            e.stopPropagation();
            if (e.key === "Home") items[0]?.focus();
            else items[items.length - 1]?.focus();
        }
    });
    pickerWrap.appendChild(pickerList);
    step1.appendChild(pickerWrap);
    let pickerSeq = 0;
    const currentDocId = existingConfig?.mode !== "notebook" ? existingConfig?.containerDocIds[0] : undefined;
    const showDocPickerMessage = (message: string, retry?: () => void): void => {
        pickerList.textContent = "";
        const status = document.createElement("div");
        status.className = "xlc-doclist-empty";
        status.setAttribute("role", "status");
        status.setAttribute("aria-live", "polite");
        status.textContent = message;
        pickerList.appendChild(status);
        if (retry) {
            const retryBtn = document.createElement("button");
            retryBtn.type = "button";
            retryBtn.className = "b3-button xlc-btn-ghost xlc-doclist-retry";
            retryBtn.dataset.xlcControl = "setup.docs.retry";
            retryBtn.textContent = t("retry");
            retryBtn.addEventListener("click", retry);
            pickerList.appendChild(retryBtn);
        }
    };
    const searchPickerDocs = (keyword: string): void => {
        const seq = ++pickerSeq;
        pickerList.innerHTML = "";
        pickerList.removeAttribute("aria-busy");
        pickedDoc = null;
        syncNextState();
        if (!keyword) return;
        pickerList.setAttribute("aria-busy", "true");
        showDocPickerMessage(t("loading"));
        void ctx.library.searchDocs(keyword).then((result) => {
            if (seq !== pickerSeq) return;
            pickerList.removeAttribute("aria-busy");
            if (!result.ok || result.data.length === 0) {
                const message = result.ok ? t("docPickerEmpty") : t("kernelError", result.message);
                showDocPickerMessage(message, result.ok ? undefined : () => {
                    if (pickerInput.value.trim() === keyword) searchPickerDocs(keyword);
                });
                return;
            }
            pickerList.textContent = "";
            for (const hit of result.data.slice(0, 8)) {
                const item = document.createElement("button");
                item.type = "button";
                item.className = "xlc-doclist-item";
                item.dataset.xlcControl = "setup.doc.result";
                item.setAttribute("role", "option");
                const isPicked = hit.id === currentDocId;
                item.setAttribute("aria-selected", isPicked ? "true" : "false");
                item.setAttribute("aria-label", hit.hPath || hit.name || hit.id);
                item.textContent = hit.hPath || hit.name || hit.id;
                if (isPicked) {
                    pickedDoc = {id: hit.id, hPath: hit.hPath};
                    item.classList.add("xlc-doclist-item--on");
                }
                item.addEventListener("click", () => {
                    pickedDoc = {id: hit.id, hPath: hit.hPath};
                    pickerList.querySelectorAll(".xlc-doclist-item").forEach((el) => {
                        el.classList.remove("xlc-doclist-item--on");
                        el.setAttribute("aria-selected", "false");
                    });
                    item.classList.add("xlc-doclist-item--on");
                    item.setAttribute("aria-selected", "true");
                    syncNextState();
                });
                pickerList.appendChild(item);
            }
            syncNextState();
        }).catch((err) => {
            if (seq !== pickerSeq) return;
            pickerList.removeAttribute("aria-busy");
            showDocPickerMessage(t("kernelError", toErrorMessage(err)), () => {
                if (pickerInput.value.trim() === keyword) searchPickerDocs(keyword);
            });
        });
    };
    pickerInput.addEventListener("input", () => searchPickerDocs(pickerInput.value.trim()));

    // notebook：笔记本下拉
    const nbWrap = document.createElement("div");
    nbWrap.className = "xlc-form-field";
    nbWrap.style.display = "none";
    const nbLabel = document.createElement("label");
    nbLabel.className = "xlc-form-label";
    nbLabel.textContent = t("setupNotebook");
    nbWrap.appendChild(nbLabel);
    const nbSelect = document.createElement("select");
    nbSelect.className = "b3-select";
    nbSelect.id = "xlc-setup-notebook";
    nbSelect.dataset.xlcControl = "setup.notebook";
    nbSelect.setAttribute("aria-label", t("setupNotebook"));
    nbSelect.disabled = true;
    if (existingConfig?.mode === "notebook" && existingConfig.notebookIds[0]) {
        nbSelect.dataset.currentNotebook = existingConfig.notebookIds[0];
    }
    nbLabel.htmlFor = nbSelect.id;
    nbWrap.appendChild(nbSelect);
    const nbStatus = document.createElement("p");
    nbStatus.className = "xlc-form-hint xlc-setup-notebook-status";
    nbStatus.textContent = t("setupNotebookLoading");
    nbWrap.appendChild(nbStatus);
    const retryNotebooksBtn = document.createElement("button");
    retryNotebooksBtn.type = "button";
    retryNotebooksBtn.className = "b3-button xlc-btn-ghost xlc-setup-notebook-retry";
    retryNotebooksBtn.dataset.xlcControl = "setup.notebook.retry";
    retryNotebooksBtn.textContent = t("retry");
    retryNotebooksBtn.style.display = "none";
    nbWrap.appendChild(retryNotebooksBtn);
    step1.appendChild(nbWrap);
    let notebooksLoaded = false;
    let notebooksLoading = false;
    let notebookDocsChecking = false;
    let checkedNotebookId = "";
    let notebookDocsState: "unchecked" | "ready" | "empty" | "error" = "unchecked";
    const loadNotebooks = (force = false): void => {
        if ((!force && notebooksLoaded) || notebooksLoading) return;
        notebooksLoading = true;
        notebooksLoaded = false;
        nbSelect.disabled = true;
        nbStatus.textContent = t("setupNotebookLoading");
        retryNotebooksBtn.style.display = "none";
        retryNotebookAction = () => { void loadNotebooks(true); };
        void ctx.library.listNotebooks().then((result) => {
            nbSelect.textContent = "";
            if (!result.ok) {
                return;
            }
            if (result.data.length === 0) {
                notebooksLoaded = true;
                return;
            }
            const choose = document.createElement("option");
            choose.value = "";
            choose.textContent = t("setupChooseNotebook");
            choose.disabled = true;
            nbSelect.appendChild(choose);
            for (const nb of result.data) {
                const opt = document.createElement("option");
                opt.value = nb.id;
                opt.textContent = nb.name;
                nbSelect.appendChild(opt);
            }
            nbSelect.value = nbSelect.dataset.currentNotebook && result.data.some((nb) => nb.id === nbSelect.dataset.currentNotebook)
                ? nbSelect.dataset.currentNotebook
                : "";
            notebooksLoaded = true;
            nbSelect.disabled = false;
        }).catch(() => {
        }).finally(() => {
            notebooksLoading = false;
            renderNotebookStatus();
            syncCreateState();
            syncNextState();
        });
    };
    let retryNotebookAction = (): void => { void loadNotebooks(true); };
    retryNotebooksBtn.addEventListener("click", () => retryNotebookAction());
    const renderNotebookStatus = (): void => {
        const selectedId = nbSelect.value;
        if (notebooksLoading) {
            nbStatus.textContent = t("setupNotebookLoading");
            retryNotebooksBtn.style.display = "none";
            return;
        }
        if (!notebooksLoaded) {
            nbStatus.textContent = t("setupNotebookLoadFailed");
            retryNotebooksBtn.style.display = "";
            retryNotebookAction = () => { void loadNotebooks(true); };
            return;
        }
        if (nbSelect.options.length <= 1) {
            nbStatus.textContent = t("setupNotebookEmpty");
            retryNotebooksBtn.style.display = "none";
            return;
        }
        if (modeSelect.value !== "notebook" || !selectedId) {
            nbStatus.textContent = t("setupNotebookReady");
            retryNotebooksBtn.style.display = "none";
            return;
        }
        if (notebookDocsChecking) {
            nbStatus.textContent = t("setupNotebookDocsChecking");
            retryNotebooksBtn.style.display = "none";
            return;
        }
        if (checkedNotebookId !== selectedId || notebookDocsState === "unchecked") {
            nbStatus.textContent = t("setupNotebookNeedsDocsCheck");
            retryNotebooksBtn.style.display = "none";
            return;
        }
        if (notebookDocsState === "ready") {
            nbStatus.textContent = t("setupNotebookDocsReady");
            retryNotebooksBtn.style.display = "none";
            return;
        }
        nbStatus.textContent = notebookDocsState === "empty" ? t("setupNotebookNoDocs") : t("setupNotebookDocsCheckFailed");
        retryNotebooksBtn.style.display = notebookDocsState === "error" ? "" : "none";
        retryNotebookAction = () => {
            const notebookId = nbSelect.value;
            const revision = setupRevision;
            void verifyNotebookHasDocs(notebookId).then((valid) => {
                if (valid && setupRevision === revision && modeSelect.value === "notebook" && nbSelect.value === notebookId) gotoStep(2);
            });
        };
    };
    async function verifyNotebookHasDocs(notebookId: string): Promise<boolean> {
        if (notebookDocsChecking || !notebookId) return false;
        notebookDocsChecking = true;
        checkedNotebookId = notebookId;
        notebookDocsState = "unchecked";
        nbSelect.disabled = true;
        renderNotebookStatus();
        try {
            const result = await ctx.library.listNotebookDocs(notebookId);
            if (!result.ok) {
                notebookDocsState = "error";
                ctx.notify("error", t("kernelError", result.message));
                return false;
            }
            if (result.data.length === 0) {
                notebookDocsState = "empty";
                ctx.notify("error", t("setupNotebookNoDocs"));
                return false;
            }
            notebookDocsState = "ready";
            return true;
        } catch (err) {
            notebookDocsState = "error";
            ctx.notify("error", t("kernelError", toErrorMessage(err)));
            return false;
        } finally {
            notebookDocsChecking = false;
            nbSelect.disabled = !notebooksLoaded || nbSelect.options.length <= 1;
            renderNotebookStatus();
            syncCreateState();
            syncNextState();
        }
    }

    // new-notebook：独立笔记本名称；与已有笔记本选择分开，避免把“创建”误解成切换已有容器。
    const independentNotebookWrap = document.createElement("div");
    independentNotebookWrap.className = "xlc-form-field xlc-setup-independent-notebook";
    independentNotebookWrap.style.display = "none";
    const independentNotebookLabel = document.createElement("label");
    independentNotebookLabel.className = "xlc-form-label";
    independentNotebookLabel.textContent = t("setupIndependentNotebookName");
    independentNotebookWrap.appendChild(independentNotebookLabel);
    const independentNotebookInput = document.createElement("input");
    independentNotebookInput.className = "b3-text-field";
    independentNotebookInput.id = "xlc-setup-independent-notebook";
    independentNotebookInput.placeholder = t("setupIndependentNotebookNamePlaceholder");
    independentNotebookInput.setAttribute("aria-label", t("setupIndependentNotebookName"));
    independentNotebookInput.dataset.xlcControl = "setup.new-notebook.name";
    independentNotebookLabel.htmlFor = independentNotebookInput.id;
    independentNotebookWrap.appendChild(independentNotebookInput);
    const independentNotebookHint = document.createElement("p");
    independentNotebookHint.className = "xlc-form-hint";
    independentNotebookHint.textContent = t("setupIndependentNotebookHint");
    independentNotebookWrap.appendChild(independentNotebookHint);
    const independentNotebookStatus = document.createElement("p");
    independentNotebookStatus.className = "xlc-form-hint xlc-setup-create-status";
    independentNotebookStatus.setAttribute("role", "status");
    independentNotebookStatus.setAttribute("aria-live", "polite");
    independentNotebookWrap.appendChild(independentNotebookStatus);

    let orphanReceiptEl: HTMLElement | null = null;
    const clearOrphanReceipt = (): void => {
        if (orphanReceiptEl) {
            orphanReceiptEl.remove();
            orphanReceiptEl = null;
        }
    };
    step1.appendChild(independentNotebookWrap);

    const syncModeUi = (): void => {
        clearOrphanReceipt();
        const mode = modeSelect.value;
        const needsNotebook = mode === "notebook" || mode === "new-doc";
        pickerWrap.style.display = mode === "doc" || mode === "tree" ? "" : "none";
        nbWrap.style.display = needsNotebook ? "" : "none";
        independentNotebookWrap.style.display = mode === "new-notebook" ? "" : "none";
        nameWrap.style.display = mode === "new-doc" || mode === "new-notebook" ? "" : "none";
        nbLabel.textContent = mode === "new-doc" ? t("setupCreateNotebook") : t("setupNotebook");
        createBtn.dataset.xlcControl = mode === "new-notebook" ? "setup.new-notebook.create" : "setup.newdoc.create";
        if (needsNotebook) loadNotebooks();
        renderNotebookStatus();
        syncCreateState();
        syncNextState();
    };
    modeSelect.addEventListener("change", () => {
        setupRevision++;
        syncModeUi();
    });

    // 新建库文档（立即动作：confirm → 创建 → 配置落地）
    const nameWrap = document.createElement("div");
    nameWrap.className = "xlc-form-field";
    const nameLabel = document.createElement("label");
    nameLabel.className = "xlc-form-label";
    nameLabel.textContent = t("setupNewDoc");
    nameWrap.appendChild(nameLabel);
    const nameRow = document.createElement("div");
    nameRow.className = "xlc-form-row";
    const nameInput = document.createElement("input");
    nameInput.className = "b3-text-field";
    nameInput.id = "xlc-setup-newdoc";
    nameInput.dataset.xlcControl = "setup.newdoc.title";
    nameLabel.htmlFor = nameInput.id;
    nameInput.value = t("setupNewDocName");
    nameRow.appendChild(nameInput);
    const createBtn = document.createElement("button");
    createBtn.type = "button";
    createBtn.className = "b3-button xlc-btn-primary";
    createBtn.dataset.xlcControl = "setup.newdoc.create";
    createBtn.style.whiteSpace = "nowrap";
    createBtn.textContent = t("create");
    createBtn.setAttribute("aria-label", t("create"));
    createBtn.disabled = true;
    let creatingLibrary = false;
    createBtn.addEventListener("click", () => {
        const mode = modeSelect.value;
        const notebookId = mode === "new-doc" ? nbSelect.value : "";
        const notebookName = independentNotebookInput.value.trim();
        const title = nameInput.value.trim();
        if ((mode === "new-doc" && !notebookId) || (mode === "new-notebook" && !notebookName) || !title) {
            ctx.notify("error", t("invalidItem"));
            return;
        }
        const revision = setupRevision;
        // 创建前明确确认（不静默写入）；执行期飞行态防重入——并发创建会产生孤儿库文档（R138）
        const confirmText = mode === "new-notebook"
            ? t("setupIndependentConfirmCreate", notebookName, title)
            : t("setupConfirmCreate", title);
        confirm("⚠️ " + t("setupTitle"), confirmText, () => {
            if (creatingLibrary || setupRevision !== revision || modeSelect.value !== mode
                || (mode === "new-doc" && nbSelect.value !== notebookId)
                || (mode === "new-notebook" && independentNotebookInput.value.trim() !== notebookName)
                || nameInput.value.trim() !== title) return;
            creatingLibrary = true;
            clearOrphanReceipt();
            modeSelect.disabled = true;
            nbSelect.disabled = true;
            nameInput.disabled = true;
            independentNotebookInput.disabled = true;
            createBtn.textContent = t("saving");
            independentNotebookStatus.textContent = mode === "new-notebook" ? t("setupIndependentStepNotebook") : "";
            independentNotebookStatus.classList.remove("xlc-form-error");
            syncCreateState();
            const createTask = mode === "new-notebook"
                ? ctx.library.createIndependentLibrary(notebookName, title, {
                    onProgress: (step) => {
                        if (setupRevision !== revision || !creatingLibrary) return;
                        if (step === "creating-notebook") {
                            independentNotebookStatus.textContent = t("setupIndependentStepNotebook");
                        } else if (step === "creating-doc") {
                            independentNotebookStatus.textContent = t("setupIndependentStepDoc");
                        } else if (step === "rolling-back") {
                            independentNotebookStatus.textContent = t("setupIndependentStepRollback");
                        }
                    },
                })
                : ctx.library.createLibraryDoc(notebookId, title);
            void createTask.then((result) => {
                creatingLibrary = false;
                modeSelect.disabled = false;
                nbSelect.disabled = !notebooksLoaded || nbSelect.options.length <= 1;
                nameInput.disabled = false;
                independentNotebookInput.disabled = false;
                createBtn.textContent = t("create");
                syncCreateState();
                if (!result.ok) {
                    const message = mode === "new-notebook"
                        ? t("setupIndependentCreateFailed", result.message)
                        : t("kernelError", result.message);
                    independentNotebookStatus.classList.toggle("xlc-form-error", mode === "new-notebook");
                    independentNotebookStatus.textContent = mode === "new-notebook" ? message : "";
                    nbStatus.textContent = mode === "new-notebook" ? message : t("kernelError", result.message);
                    if (mode === "new-notebook" && result.compensation === "failed" && result.notebookId) {
                        clearOrphanReceipt();
                        const orphanBox = document.createElement("div");
                        orphanBox.className = "xlc-form-field";
                        orphanBox.dataset.xlcControl = "setup.independent.orphan-notebook";
                        orphanBox.style.marginTop = "8px";

                        const warnP = document.createElement("p");
                        warnP.className = "xlc-form-hint xlc-form-error";
                        warnP.textContent = t("setupIndependentOrphanWarning", result.notebookId);
                        orphanBox.appendChild(warnP);

                        const copyBtn = document.createElement("button");
                        copyBtn.type = "button";
                        copyBtn.className = "b3-button";
                        copyBtn.dataset.xlcControl = "setup.independent.copy-orphan-id";
                        copyBtn.textContent = t("setupIndependentCopyOrphanId");
                        const orphanId = result.notebookId;
                        copyBtn.addEventListener("click", () => {
                            try {
                                if (navigator.clipboard?.writeText) {
                                    void navigator.clipboard.writeText(orphanId);
                                }
                            } catch {
                                // fallback ignored in offline test environment
                            }
                            copyBtn.textContent = t("setupIndependentOrphanCopied");
                            ctx.notify("info", t("setupIndependentOrphanCopied"));
                        });
                        orphanBox.appendChild(copyBtn);
                        independentNotebookWrap.appendChild(orphanBox);
                        orphanReceiptEl = orphanBox;
                    }
                    ctx.notify("error", message);
                    return;
                }
                const docId = result.data.docId;
                const createdNotebookId = mode === "new-notebook" && "notebookId" in result.data
                    && typeof result.data.notebookId === "string"
                    ? result.data.notebookId
                    : "";
                ctx.applyConfig({
                    configVersion: CONFIG_VERSION,
                    mode: mode === "new-notebook" ? "notebook" : "doc",
                    notebookIds: mode === "new-notebook" && createdNotebookId ? [createdNotebookId] : [],
                    containerDocIds: [docId],
                    createdDocIds: [docId],
                    ...(createdNotebookId ? {createdNotebookIds: [createdNotebookId]} : {}),
                    configuredAt: Date.now(),
                });
                independentNotebookStatus.textContent = "";
                independentNotebookStatus.classList.remove("xlc-form-error");
                ctx.notify("info", t("libDocCreated", title));
                onConfigured();
            }).catch((err) => {
                creatingLibrary = false;
                modeSelect.disabled = false;
                nbSelect.disabled = !notebooksLoaded || nbSelect.options.length <= 1;
                nameInput.disabled = false;
                independentNotebookInput.disabled = false;
                createBtn.textContent = t("create");
                syncCreateState();
                const message = mode === "new-notebook"
                    ? t("setupIndependentCreateFailed", toErrorMessage(err))
                    : t("kernelError", toErrorMessage(err));
                independentNotebookStatus.classList.toggle("xlc-form-error", mode === "new-notebook");
                independentNotebookStatus.textContent = mode === "new-notebook" ? message : "";
                ctx.notify("error", message);
            });
        });
    });
    nameRow.appendChild(createBtn);
    nameWrap.appendChild(nameRow);
    step1.appendChild(nameWrap);

    function syncCreateState(): void {
        const mode = modeSelect.value;
        const canCreate = !creatingLibrary
            && ((mode === "new-doc" && notebooksLoaded && Boolean(nbSelect.value) && Boolean(nameInput.value.trim()))
                || (mode === "new-notebook" && Boolean(independentNotebookInput.value.trim()) && Boolean(nameInput.value.trim())));
        createBtn.disabled = !canCreate;
        if (mode === "new-doc" || mode === "new-notebook") {
            nextBtn.disabled = !canCreate;
        }
    }
    nbSelect.addEventListener("change", () => {
        setupRevision++;
        checkedNotebookId = "";
        notebookDocsState = "unchecked";
        renderNotebookStatus();
        syncCreateState();
        syncNextState();
    });
    nameInput.addEventListener("input", () => {
        clearOrphanReceipt();
        syncCreateState();
    });
    nameInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey && !e.altKey && !createBtn.disabled) {
            e.preventDefault();
            createBtn.click();
        }
    });
    independentNotebookInput.addEventListener("input", () => {
        clearOrphanReceipt();
        syncCreateState();
    });
    independentNotebookInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey && !e.altKey && !createBtn.disabled) {
            e.preventDefault();
            createBtn.click();
        }
    });

    const step1Actions = document.createElement("div");
    step1Actions.className = "xlc-form-actions";
    step1Actions.setAttribute("role", "toolbar");
    step1Actions.setAttribute("aria-label", "向导第一步操作");
    if (opts?.onDismiss) {
        const dismissBtn = document.createElement("button");
        dismissBtn.type = "button";
        dismissBtn.className = "b3-button xlc-btn-ghost";
        dismissBtn.dataset.xlcControl = "setup.later";
        dismissBtn.textContent = t("setupLater");
        dismissBtn.setAttribute("aria-label", t("setupLater"));
        dismissBtn.addEventListener("click", () => opts.onDismiss?.());
        step1Actions.appendChild(dismissBtn);
    }
    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "b3-button xlc-btn-primary";
    nextBtn.dataset.xlcControl = "setup.next";
    nextBtn.textContent = t("setupNext");
    nextBtn.setAttribute("aria-label", t("setupNext"));
    nextBtn.disabled = true;
    nextBtn.addEventListener("click", () => {
        const mode = modeSelect.value;
        if (mode === "new-doc" || mode === "new-notebook") {
            createBtn.click();
            return;
        }
        if (mode === "notebook" && !nbSelect.value) {
            ctx.notify("error", nbSelect.disabled ? t("setupNotebookNotReady") : t("pickNotebookFirst"));
            return;
        }
        if (mode !== "notebook" && !pickedDoc) {
            ctx.notify("error", t("pickDocFirst"));
            return;
        }
        if (mode === "notebook") {
            const notebookId = nbSelect.value;
            const revision = setupRevision;
            nextBtn.disabled = true;
            void verifyNotebookHasDocs(notebookId).then((valid) => {
                if (valid && setupRevision === revision && modeSelect.value === "notebook" && nbSelect.value === notebookId) gotoStep(2);
            }).finally(() => syncNextState());
            return;
        }
        gotoStep(2);
    });
    step1Actions.appendChild(nextBtn);
    step1.appendChild(step1Actions);
    function syncNextState(): void {
        const mode = modeSelect.value;
        const rootCheckFailed = checkedNotebookId === nbSelect.value
            && (notebookDocsState === "empty" || notebookDocsState === "error");
        nextBtn.style.display = mode === "new-doc" || mode === "new-notebook" ? "none" : "";
        nextBtn.disabled = mode === "notebook"
            ? !notebooksLoaded || !nbSelect.value || notebookDocsChecking || rootCheckFailed
            : mode === "new-doc" || mode === "new-notebook" || !pickedDoc;
    }
    syncModeUi();
    root.appendChild(step1);

    // ---- 第 2 步：确认落点 ----
    const step2 = document.createElement("div");
    step2.style.display = "none";
    const summaryWrap = document.createElement("div");
    summaryWrap.className = "xlc-policy-list";
    step2.appendChild(summaryWrap);
    const summaryHint = document.createElement("p");
    summaryHint.className = "xlc-form-hint";
    summaryHint.style.marginTop = "12px";
    summaryHint.textContent = t("setupConfirmHint");
    step2.appendChild(summaryHint);
    const step2Actions = document.createElement("div");
    step2Actions.className = "xlc-form-actions";
    step2Actions.setAttribute("role", "toolbar");
    step2Actions.setAttribute("aria-label", "向导第二步操作");
    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "b3-button xlc-btn-ghost";
    backBtn.dataset.xlcControl = "setup.back";
    backBtn.textContent = t("setupBack");
    backBtn.setAttribute("aria-label", t("setupBack"));
    backBtn.addEventListener("click", () => gotoStep(1));
    step2Actions.appendChild(backBtn);
    const finishBtn = document.createElement("button");
    finishBtn.type = "button";
    finishBtn.className = "b3-button xlc-btn-primary";
    finishBtn.dataset.xlcControl = "setup.finish";
    finishBtn.textContent = t("setupFinish");
    finishBtn.setAttribute("aria-label", t("setupFinish"));
    finishBtn.addEventListener("click", () => {
        const mode = modeSelect.value as LibraryConfig["mode"];
        if (mode === "notebook") {
            const notebookId = nbSelect.value;
            if (!notebookId) {
                ctx.notify("error", t("invalidItem"));
                return;
            }
            const revision = setupRevision;
            finishBtn.disabled = true;
            void verifyNotebookHasDocs(notebookId).then((valid) => {
                if (setupRevision !== revision || step !== 2 || modeSelect.value !== "notebook" || nbSelect.value !== notebookId) return;
                if (!valid) {
                    gotoStep(1);
                    return;
                }
                ctx.applyConfig({
                    configVersion: CONFIG_VERSION,
                    mode: "notebook",
                    notebookIds: [notebookId],
                    containerDocIds: [],
                    createdDocIds: [],
                    configuredAt: Date.now(),
                });
                onConfigured();
            }).finally(() => {
                finishBtn.disabled = false;
                syncNextState();
            });
            return;
        }
        if (!pickedDoc) {
            ctx.notify("error", t("pickDocFirst"));
            return;
        }
        ctx.applyConfig({
            configVersion: CONFIG_VERSION,
            mode,
            notebookIds: [],
            containerDocIds: [pickedDoc.id],
            createdDocIds: [],
            configuredAt: Date.now(),
        });
        onConfigured();
    });
    step2Actions.appendChild(finishBtn);
    step2.appendChild(step2Actions);
    root.appendChild(step2);

    function paintSummary(): void {
        summaryWrap.textContent = "";
        const mode = modeSelect.value as LibraryConfig["mode"];
        const card = document.createElement("div");
        card.className = "xlc-policy xlc-policy--recommended";
        const icon = document.createElement("span");
        icon.className = "xlc-policy-ic";
        icon.textContent = "✓";
        card.appendChild(icon);
        const text = document.createElement("span");
        const titleEl = document.createElement("span");
        titleEl.className = "xlc-policy-title";
        titleEl.textContent = mode === "notebook"
            ? `${t("setupNotebook")} · ${nbSelect.selectedOptions[0]?.textContent ?? nbSelect.value}`
            : (pickedDoc?.hPath || pickedDoc?.id || "-");
        text.appendChild(titleEl);
        const desc = document.createElement("span");
        desc.className = "xlc-policy-desc";
        desc.textContent = mode === "notebook"
            ? t("setupSummaryNotebook")
            : mode === "tree" ? t("setupSummaryTree") : t("setupSummaryDoc");
        text.appendChild(desc);
        card.appendChild(text);
        summaryWrap.appendChild(card);
    }

    function gotoStep(next: 1 | 2): void {
        setupRevision++;
        step = next;
        stepsEl.remove();
        root.insertBefore(buildStepsEl(step, step === 1 ? t("setupStep1") : t("setupStep2")), root.firstChild);
        step1.style.display = step === 1 ? "" : "none";
        hint.style.display = step === 1 ? "" : "none";
        usageGuide.style.display = step === 1 && !showQuickStart ? "" : "none";
        recommendation.style.display = step === 1 ? "" : "none";
        quickStart.style.display = step === 1 && showQuickStart ? "" : "none";
        step2.style.display = step === 2 ? "" : "none";
        if (step === 2) paintSummary();
    }

    if (existingConfig && existingConfig.mode !== "notebook") {
        const currentDoc = existingConfig.containerDocIds[0];
        if (currentDoc) {
            void ctx.library.getDocPath(currentDoc).then((hPath) => {
                if (!hPath || pickerInput.value) return;
                const pathParts = hPath.split("/").filter(Boolean);
                pickerInput.value = pathParts[pathParts.length - 1] ?? hPath;
                pickerInput.dispatchEvent(new Event("input"));
            });
        }
    }

    root.addEventListener("keydown", (e) => {
        if (e.isComposing || (e as KeyboardEvent).keyCode === 229) return;
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            if (e.repeat) return;
            if (step === 1) {
                if (createBtn.offsetParent !== null && !createBtn.disabled) {
                    e.preventDefault();
                    createBtn.click();
                } else if (nextBtn.offsetParent !== null && !nextBtn.disabled) {
                    e.preventDefault();
                    nextBtn.click();
                }
            } else if (step === 2 && !finishBtn.disabled) {
                e.preventDefault();
                finishBtn.click();
            }
        }
    });
}

function buildAiSection(ctx: SettingsUiContext, root: HTMLElement): void {
    const t = ctx.t;
    // AI 设置区（默认关；开启即视为同意元数据出域；正文出域单独开关）
    const aiSec = document.createElement("div");
    aiSec.id = "xlc-settings-ai";
    aiSec.className = "xlc-form-field xlc-card";
    const aiLabel = document.createElement("span");
    aiLabel.className = "xlc-form-label";
    aiLabel.textContent = t("aiSection");
    aiSec.appendChild(aiLabel);
    const aiRow = (key: "enabled" | "shareContent", text: string, sub: string): HTMLInputElement => {
        const row = buildSwitchRow(text, sub, ctx.state.ai[key], (value) => {
            ctx.state.ai[key] = value;
            if (key === "enabled" && !value) ctx.state.ai.shareContent = false;
            ctx.ai.updateSettings(ctx.state.ai);
            ctx.persistSoon();
        });
        aiSec.appendChild(row);
        return row.querySelector<HTMLInputElement>(".xlc-switch") as HTMLInputElement;
    };
    const aiEnabledBox = aiRow("enabled", t("aiEnabled"), t("aiEnabledSub"));
    const aiShareBox = aiRow("shareContent", t("aiShareContent"), t("aiShareContentSub"));
    const syncAiShare = (): void => {
        aiShareBox.disabled = !aiEnabledBox.checked;
        if (!aiEnabledBox.checked) {
            aiShareBox.checked = false;
            ctx.state.ai.shareContent = false;
        }
    };
    const dirtyShare = !aiEnabledBox.checked && ctx.state.ai.shareContent; // 总开关关但正文开关仍开（R138）
    syncAiShare();
    aiEnabledBox.addEventListener("change", syncAiShare);
    if (dirtyShare) ctx.persistSoon(); // 构建期修复的脏数据落盘，否则重载后回归
    // 自定义变换（F7）：与内置五种并列出现在条目动作菜单 ✦ 区
    const ctLabel = document.createElement("span");
    ctLabel.className = "xlc-form-label";
    ctLabel.style.marginTop = "6px";
    ctLabel.textContent = t("customTransformSection");
    aiSec.appendChild(ctLabel);
    const ctList = document.createElement("div");
    ctList.className = "xlc-ct-list";
    ctList.setAttribute("role", "list");
    ctList.setAttribute("aria-label", t("customTransformSection"));
    aiSec.appendChild(ctList);
    const persistCt = (): void => {
        ctx.ai.updateSettings(ctx.state.ai);
        ctx.persistSoon();
    };
    let addCtBtn: HTMLButtonElement | null = null;
    const repaintCt = (): void => {
        ctList.textContent = "";
        for (const ct of ctx.state.ai.customTransforms) {
            const row = document.createElement("div");
            row.className = "xlc-ct-row";
            row.setAttribute("role", "listitem");
            const nameInput = document.createElement("input");
            nameInput.className = "b3-text-field xlc-ct-name";
            nameInput.dataset.xlcControl = `settings.ai.custom-transform.name.${ct.id}`;
            nameInput.placeholder = t("customTransformName");
            nameInput.setAttribute("aria-label", t("customTransformName"));
            nameInput.value = ct.name;
            nameInput.maxLength = 20;
            nameInput.addEventListener("change", () => {
                ct.name = nameInput.value.trim().slice(0, 20);
                persistCt();
            });
            row.appendChild(nameInput);
            const promptInput = document.createElement("input");
            promptInput.className = "b3-text-field xlc-ct-prompt";
            promptInput.dataset.xlcControl = `settings.ai.custom-transform.prompt.${ct.id}`;
            promptInput.placeholder = t("customTransformPrompt");
            promptInput.setAttribute("aria-label", t("customTransformPrompt"));
            promptInput.value = ct.prompt;
            promptInput.maxLength = 500;
            promptInput.addEventListener("change", () => {
                ct.prompt = promptInput.value.trim().slice(0, 500);
                persistCt();
            });
            row.appendChild(promptInput);
            const delBtn = document.createElement("button");
            delBtn.type = "button";
            delBtn.className = "b3-button xlc-btn-ghost xlc-ct-del";
            delBtn.dataset.xlcControl = `settings.ai.custom-transform.delete.${ct.id}`;
            delBtn.textContent = t("delete");
            delBtn.setAttribute("aria-label", `${t("delete")}：${ct.name}`);
            delBtn.title = `${t("delete")}：${ct.name}`;
            delBtn.addEventListener("click", () => {
                // 危险操作对齐惯例：确认 + 回执（名称+指令一键即失，且不可恢复，R138）
                confirm(t("delete") + " · " + t("customTransformSection"), t("ctDeleteConfirm", ct.name), () => {
                    ctx.state.ai.customTransforms = ctx.state.ai.customTransforms.filter((c) => c.id !== ct.id);
                    persistCt();
                    repaintCt();
                    ctx.notify("info", t("ctDeleted", ct.name));
                });
            });
            row.appendChild(delBtn);
            ctList.appendChild(row);
        }
        if (ctx.state.ai.customTransforms.length === 0) {
            const empty = document.createElement("div");
            empty.className = "xlc-form-hint";
            empty.textContent = t("customTransformEmpty");
            ctList.appendChild(empty);
        }
        if (addCtBtn) addCtBtn.disabled = ctx.state.ai.customTransforms.length >= 10;
    };
    repaintCt();
    addCtBtn = document.createElement("button");
    addCtBtn.type = "button";
    addCtBtn.className = "b3-button";
    addCtBtn.dataset.xlcControl = "settings.ai.custom-transform.add";
    addCtBtn.style.alignSelf = "flex-start";
    addCtBtn.textContent = t("customTransformAdd");
    addCtBtn.setAttribute("aria-label", t("customTransformAdd"));
    addCtBtn.addEventListener("click", () => {
        if (ctx.state.ai.customTransforms.length >= 10) return;
        const id = `xltf-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
        ctx.state.ai.customTransforms = [...ctx.state.ai.customTransforms, {id, name: t("customTransformNewName"), prompt: ""}];
        persistCt();
        repaintCt();
        // 新行名称输入直接聚焦（R120）：添加即可改名，不用再点一次
        ctList.querySelector<HTMLInputElement>(".xlc-ct-row:last-child .xlc-ct-name")?.focus();
    });
    aiSec.appendChild(addCtBtn);
    const ctHint = document.createElement("span");
    ctHint.className = "xlc-form-hint";
    ctHint.textContent = t("customTransformHint");
    aiSec.appendChild(ctHint);
    root.appendChild(aiSec);
}

function buildSearchSection(ctx: SettingsUiContext, root: HTMLElement): void {
    const t = ctx.t;
    let pinyinSeq = 0; // 重索引代次（R138）
    // 搜索设置区（拼音：本地注解，无出域）
    const searchSec = document.createElement("div");
    searchSec.id = "xlc-settings-search";
    searchSec.className = "xlc-form-field xlc-card";
    const searchLabel = document.createElement("span");
    searchLabel.className = "xlc-form-label";
    searchLabel.textContent = t("searchSection");
    searchSec.appendChild(searchLabel);
    const pinyinRow = buildSwitchRow(t("pinyinToggle"), t("pinyinToggleSub"), ctx.state.search.pinyin, (value) => {
        // 代次守卫：快速来回拨动时丢弃过期的重索引回执（R138，对齐 doc picker seq 范式）
        const mySeq = ++pinyinSeq;
        ctx.state.search.pinyin = value;
        ctx.applyPinyinAdapter();
        ctx.persistSoon();
        const pinyinInput = pinyinRow.querySelector<HTMLInputElement>("input");
        pinyinInput?.setAttribute("aria-busy", "true");
        if (pinyinInput) pinyinInput.disabled = true;
        pinyinRow.setAttribute("aria-busy", "true");
        void ctx.library.reindex().then((idx) => {
            if (mySeq !== pinyinSeq) return;
            ctx.refreshSearch?.();
            ctx.notify("info", t("reindexDone", String(idx.entries.length)));
        }).catch((err) => {
            if (mySeq !== pinyinSeq) return;
            ctx.notify("error", t("kernelError", toErrorMessage(err)));
        }).finally(() => {
            if (pinyinInput) {
                pinyinInput.disabled = false;
                pinyinInput.removeAttribute("aria-busy");
            }
            pinyinRow.removeAttribute("aria-busy");
        });
    });
    searchSec.appendChild(pinyinRow);
    // 占位符开关
    const phRow = buildSwitchRow(t("placeholdersToggle"), t("placeholdersToggleSub"), ctx.state.search.placeholders, (value) => {
        ctx.state.search.placeholders = value;
        ctx.persistSoon();
    });
    searchSec.appendChild(phRow);
    root.appendChild(searchSec);
}

/** 已保存的标签发现视图：只管理侧车快捷配置，不触碰源块或内容库条目。 */
function buildSavedViewsSection(ctx: SettingsUiContext, root: HTMLElement, beforeOpen?: () => void): void {
    const t = ctx.t;
    const sec = document.createElement("div");
    sec.className = "xlc-form-field xlc-card xlc-saved-views";
    sec.dataset.xlcControl = "settings.saved-views";
    const label = document.createElement("span");
    label.className = "xlc-form-label";
    label.textContent = t("savedViewsSection");
    sec.appendChild(label);
    const list = document.createElement("div");
    list.className = "xlc-saved-view-list";
    list.setAttribute("role", "list");
    list.setAttribute("aria-label", t("savedViewsSection"));
    sec.appendChild(list);

    const readViews = (): readonly SavedDiscoveryView[] => {
        const fromContext = ctx.getSavedDiscoveryViews?.();
        return fromContext ?? ctx.state.search.savedDiscoveryViews ?? [];
    };
    const scopeLabel = (scope: SavedDiscoveryScope): string => {
        switch (scope) {
            case "document": return t("discoveryScopeDocument");
            case "notebook": return t("discoveryScopeNotebook");
            case "tree": return t("discoveryScopeTree");
            case "selected-notebook": return t("discoveryScopeSelectedNotebook");
            case "all-notebooks": return t("discoveryScopeAllNotebooks");
        }
    };
    const render = (): void => {
        list.replaceChildren();
        const views = readViews();
        if (views.length === 0) {
            const empty = document.createElement("span");
            empty.className = "xlc-form-hint xlc-saved-view-empty";
            empty.textContent = t("savedViewsEmpty");
            list.appendChild(empty);
            return;
        }
        for (const view of views) {
            const pieces = [`#${view.tag}`, scopeLabel(view.scope)];
            if (view.pathLabel) pieces.push(view.pathLabel);

            const row = document.createElement("div");
            row.className = "xlc-setting-row xlc-saved-view-row";
            row.dataset.xlcSavedViewId = view.id;
            row.setAttribute("role", "listitem");
            row.setAttribute("aria-label", `${view.name} · ${pieces.join(" · ")}`);

            const text = document.createElement("span");
            text.className = "xlc-setting-text";
            const name = document.createElement("strong");
            name.className = "xlc-saved-view-name";
            name.textContent = view.name;
            text.appendChild(name);
            const meta = document.createElement("span");
            meta.className = "xlc-setting-sub xlc-saved-view-meta";
            meta.textContent = pieces.join(" · ");
            text.appendChild(meta);
            row.appendChild(text);

            const actions = document.createElement("span");
            actions.className = "xlc-setting-actions";
            const open = document.createElement("button");
            open.type = "button";
            open.className = "b3-button xlc-btn-ghost";
            open.dataset.xlcControl = "settings.saved-view.open";
            open.textContent = t("savedViewsOpen");
            open.setAttribute("aria-label", `${t("savedViewsOpen")}：${view.name}`);
            open.disabled = !ctx.openSavedDiscoveryView;
            open.addEventListener("click", () => {
                if (!ctx.openSavedDiscoveryView) return;
                beforeOpen?.();
                ctx.openSavedDiscoveryView(view);
            });
            actions.appendChild(open);

            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "b3-button xlc-btn-ghost";
            remove.dataset.xlcControl = "settings.saved-view.delete";
            remove.textContent = t("savedViewsDelete");
            remove.setAttribute("aria-label", `${t("savedViewsDelete")}：${view.name}`);
            remove.addEventListener("click", () => {
                confirm("⚠️ " + t("savedViewsDelete"), t("savedViewsDeleteConfirm", view.name), () => {
                    if (ctx.deleteSavedDiscoveryView) {
                        ctx.deleteSavedDiscoveryView(view.id);
                    } else {
                        ctx.state.search.savedDiscoveryViews = (ctx.state.search.savedDiscoveryViews ?? [])
                            .filter((entry) => entry.id !== view.id);
                        ctx.persistSoon();
                    }
                    ctx.notify("info", `${t("savedViewsDelete")}: ${view.name}`);
                    render();
                });
            });
            actions.appendChild(remove);
            row.appendChild(actions);
            list.appendChild(row);
        }
    };
    render();
    root.appendChild(sec);
}

/** 常用内容库健康体检中心（G26 / ADR 0078 / ADR 0079） */
function buildHealthSection(ctx: SettingsUiContext, root: HTMLElement): void {
    const t = ctx.t;
    const sec = document.createElement("div");
    sec.id = "xlc-settings-health";
    sec.className = "xlc-form-field xlc-card xlc-health-card";

    const label = document.createElement("span");
    label.className = "xlc-form-label";
    label.textContent = t("healthSection");
    sec.appendChild(label);

    const desc = document.createElement("div");
    desc.className = "xlc-form-hint";
    desc.textContent = t("healthDesc");
    sec.appendChild(desc);

    const statusRow = document.createElement("div");
    statusRow.className = "xlc-health-status";
    statusRow.hidden = true;
    statusRow.dataset.xlcControl = "settings.health.summary";
    statusRow.setAttribute("role", "status");
    statusRow.setAttribute("aria-live", "polite");
    sec.appendChild(statusRow);

    const issuesContainer = document.createElement("div");
    issuesContainer.className = "xlc-health-issues";
    issuesContainer.dataset.xlcControl = "settings.health.list";
    issuesContainer.hidden = true;
    issuesContainer.tabIndex = 0;
    issuesContainer.setAttribute("role", "list");
    issuesContainer.setAttribute("aria-label", t("healthSection"));
    sec.appendChild(issuesContainer);

    const btnRow = document.createElement("div");
    btnRow.style.display = "flex";
    btnRow.style.gap = "8px";
    btnRow.style.marginTop = "8px";

    const runBtn = document.createElement("button");
    runBtn.type = "button";
    runBtn.className = "b3-button xlc-btn-primary";
    runBtn.dataset.xlcControl = "settings.health.run";
    runBtn.textContent = t("healthRunBtn");
    btnRow.appendChild(runBtn);
    sec.appendChild(btnRow);

    let isScanning = false;
    runBtn.addEventListener("click", async () => {
        if (isScanning) return;
        isScanning = true;
        runBtn.disabled = true;
        runBtn.setAttribute("aria-busy", "true");
        statusRow.hidden = false;
        statusRow.replaceChildren();
        const scanHint = document.createElement("span");
        scanHint.className = "xlc-form-hint";
        scanHint.textContent = t("healthScanning");
        statusRow.appendChild(scanHint);
        issuesContainer.hidden = true;
        issuesContainer.replaceChildren();

        try {
            const index = await ctx.library.ensureIndex();
            const entries = index.entries;
            if (entries.length === 0) {
                statusRow.textContent = t("healthEmpty");
                return;
            }

            const items: HealthDoctorItem[] = [];
            for (const entry of entries) {
                const kdReceipt = await ctx.library.getItemKramdown({
                    id: entry.id,
                    blockId: entry.blockId,
                    libraryDocId: entry.libraryDocId,
                    itemType: entry.itemType,
                } as CommonItem);
                items.push({
                    id: entry.id,
                    title: entry.title,
                    content: kdReceipt.ok ? kdReceipt.data : (entry.summary || ""),
                    itemType: entry.itemType,
                    url: entry.url,
                });
            }

            const result = diagnoseLibraryHealth(items);
            statusRow.replaceChildren();

            const summaryBadge = document.createElement("span");
            summaryBadge.className = result.hasErrors ? "xlc-form-error" : (result.warningCount > 0 ? "xlc-badge-warn" : "xlc-form-hint");
            summaryBadge.style.fontWeight = "600";
            if (result.issues.length === 0) {
                summaryBadge.textContent = `✓ ${t("healthClean")} (${result.totalScanned}/${result.totalScanned})`;
            } else {
                summaryBadge.textContent = t(
                    "healthSummary",
                    String(result.totalScanned),
                    String(result.healthyCount),
                    String(result.errorCount),
                    String(result.warningCount),
                );
            }
            statusRow.appendChild(summaryBadge);

            if (result.issues.length > 0) {
                issuesContainer.hidden = false;
                issuesContainer.replaceChildren();
                for (const issue of result.issues) {
                    const row = document.createElement("div");
                    row.className = `xlc-health-issue xlc-health-issue--${issue.severity}`;
                    row.setAttribute("role", "listitem");
                    const sevLabel = issue.severity === "error" ? t("healthErrorBadge") : t("healthWarnBadge");
                    row.setAttribute("aria-label", `${sevLabel} · ${issue.itemTitle || issue.itemId} · ${issue.message}`);

                    const pill = document.createElement("span");
                    pill.className = `xlc-health-pill xlc-health-pill--${issue.severity}`;
                    pill.textContent = sevLabel;

                    const titleSpan = document.createElement("strong");
                    titleSpan.className = "xlc-health-title";
                    titleSpan.textContent = issue.itemTitle || issue.itemId;

                    const msgSpan = document.createElement("span");
                    msgSpan.className = "xlc-health-msg";
                    msgSpan.textContent = issue.message;

                    row.append(pill, titleSpan, msgSpan);
                    issuesContainer.appendChild(row);
                }
            }
        } catch (err) {
            statusRow.replaceChildren();
            const errSpan = document.createElement("span");
            errSpan.className = "xlc-form-error";
            errSpan.textContent = t("kernelError", toErrorMessage(err));
            statusRow.appendChild(errSpan);
        } finally {
            isScanning = false;
            runBtn.disabled = false;
            runBtn.removeAttribute("aria-busy");
        }
    });

    root.appendChild(sec);
}

function buildExternalIntegrationSection(ctx: SettingsUiContext, root: HTMLElement): void {
    void ctx;
    const sec = document.createElement("div");
    sec.id = "xlc-settings-ext";
    sec.className = "xlc-form-field xlc-card xlc-external-integration";
    sec.dataset.xlcControl = "settings.external-integration";

    const label = document.createElement("span");
    label.className = "xlc-form-label";
    label.textContent = "全局可用与外部调用联动 (Quicker / Headless API)";
    sec.appendChild(label);

    const desc = document.createElement("div");
    desc.className = "xlc-form-hint";
    desc.style.lineHeight = "1.6";
    desc.textContent = "小驴常用已全面开放 Headless 纯求值与检索协议。支持在微信、Word、QQ、浏览器等任意外部窗口，通过全局热键、Quicker 动作或 AutoHotkey 脚本，免切思源窗口直接检索常用语并秒级喷射文本。";
    sec.appendChild(desc);

    const apiCard = document.createElement("div");
    apiCard.className = "xlc-api-code-block";

    apiCard.innerHTML = `
        <div class="xlc-api-title">开放协议命令（思源内部命令 / WebSocket / 窗口桥）：</div>
        <div>• <strong>xiaolv.common.recall</strong>: 别名闪电直达（输入别名或拼音缩写一步取回展开正文，含 plainText/richHtml）</div>
        <div>• <strong>xiaolv.common.resolve</strong>: 条目纯求值（自动展开嵌套片段并计算宏变量，支持填参 fills）</div>
        <div>• <strong>xiaolv.common.search</strong>: 按关键词检索常用条目清单（含别名/标签/分类/变量数）</div>
        <div>• <strong>xiaolv.common.getClipboardHistory</strong>: 获取会话剪贴板历史暂存文本流</div>
        <div>• <strong>xiaolv.common.recent</strong>: 获取最近使用过的常用条目</div>
        <div>• <strong>xiaolv.common.get</strong>: 获取条目完整定义与元数据</div>
    `;
    sec.appendChild(apiCard);

    const btnRow = document.createElement("div");
    btnRow.style.cssText = "display:flex; flex-wrap:wrap; gap:8px; margin-top:8px;";

    const copyQuickerBtn = document.createElement("button");
    copyQuickerBtn.type = "button";
    copyQuickerBtn.className = "b3-button xlc-btn-ghost";
    copyQuickerBtn.textContent = "⧉ 复制 Quicker 动作配置";
    copyQuickerBtn.addEventListener("click", () => {
        const examplePayload = JSON.stringify({
            target: "xiaolv-common",
            protocol: "xiaolv-common/v1",
            operations: {
                recall: { command: "xiaolv.common.recall", params: { alias: "yq", fills: { "客户姓名": "张经理" } } },
                search: { command: "xiaolv.common.search", params: { keyword: "退款", limit: 20 } },
                resolve: { command: "xiaolv.common.resolve", params: { itemId: "条目ID", fills: { "客户姓名": "张经理" } } },
                clipboardHistory: { command: "xiaolv.common.getClipboardHistory" }
            },
            quickerNote: "向思源内核 POST /api/command 发送上述指令，获取 recall/resolve 结果中的 plainText（微信/QQ专用）或 richHtml（Word专用），由 Quicker 写入剪贴板并模拟 Ctrl+V 喷射。"
        }, null, 2);

        void navigator.clipboard.writeText(examplePayload).then(() => {
            copyQuickerBtn.textContent = "✓ 已复制 Quicker 配置";
            setTimeout(() => {
                copyQuickerBtn.textContent = "⧉ 复制 Quicker 动作配置";
            }, 3000);
        });
    });

    const copyAhkBtn = document.createElement("button");
    copyAhkBtn.type = "button";
    copyAhkBtn.className = "b3-button xlc-btn-ghost";
    copyAhkBtn.textContent = "⚡ 复制 AutoHotkey (AHK) 全局直喷脚本";
    copyAhkBtn.addEventListener("click", () => {
        const ahkScript = `; ==========================================
; 小驴常用 · AutoHotkey 全局直出脚本 (Ctrl+Alt+V)
; 适用：微信、Word、QQ、浏览器输入框秒级上屏
; ==========================================
^!v::
    InputBox, alias, 小驴常用, 请输入常用语别名或拼音缩写:,, 300, 130
    if (ErrorLevel || alias = "")
        return
    ; 调用思源本地内核 HTTP API 执行 recall 别名闪电直达
    url := "http://127.0.0.1:6806/api/plugin/callPlugin"
    body := "{""plugin"":""xiaolv-common"",""action"":""recall"",""data"":{""alias"":""" . alias . """}}"
    http := ComObjCreate("MSXML2.ServerXMLHTTP.6.0")
    http.open("POST", url, false)
    http.setRequestHeader("Content-Type", "application/json")
    http.send(body)
    resp := http.responseText
    ; 提取 plainText 并粘贴到当前微信/Word 窗口
    RegExMatch(resp, """plainText"":""(.*?)""", m)
    if (m1 != "") {
        Clipboard := m1
        ClipWait, 1
        Send, ^v
    }
return`;

        void navigator.clipboard.writeText(ahkScript).then(() => {
            copyAhkBtn.textContent = "✓ 已复制 AHK 脚本";
            setTimeout(() => {
                copyAhkBtn.textContent = "⚡ 复制 AutoHotkey (AHK) 全局直喷脚本";
            }, 3000);
        });
    });

    const copyCurlBtn = document.createElement("button");
    copyCurlBtn.type = "button";
    copyCurlBtn.className = "b3-button xlc-btn-ghost";
    copyCurlBtn.textContent = "⌨ 复制 cURL / REST API 示例";
    copyCurlBtn.addEventListener("click", () => {
        const curlCmd = `curl -X POST "http://127.0.0.1:6806/api/plugin/callPlugin" \\
  -H "Content-Type: application/json" \\
  -d '{"plugin":"xiaolv-common","action":"recall","data":{"alias":"cwbx"}}'`;

        void navigator.clipboard.writeText(curlCmd).then(() => {
            copyCurlBtn.textContent = "✓ 已复制 cURL 示例";
            setTimeout(() => {
                copyCurlBtn.textContent = "⌨ 复制 cURL / REST API 示例";
            }, 3000);
        });
    });

    const copyRaycastBtn = document.createElement("button");
    copyRaycastBtn.type = "button";
    copyRaycastBtn.className = "b3-button xlc-btn-ghost";
    copyRaycastBtn.textContent = "⌘ 复制 Raycast Script 脚本";
    copyRaycastBtn.addEventListener("click", () => {
        const raycastScript = `#!/bin/bash
# @raycast.schemaVersion 1
# @raycast.title Xiaolv Recall
# @raycast.mode silent
# @raycast.packageName SiYuan
# @raycast.argument1 { "type": "text", "placeholder": "常用语别名或拼音" }

RES=$(curl -s -X POST "http://127.0.0.1:6806/api/plugin/callPlugin" \\
  -H "Content-Type: application/json" \\
  -d "{\\"plugin\\":\\"xiaolv-common\\",\\"action\\":\\"recall\\",\\"data\\":{\\"alias\\":\\"$1\\"}}")

TEXT=$(echo "$RES" | grep -o '"plainText":"[^"]*' | cut -d'"' -f4)
if [ -n "$TEXT" ]; then
  echo -n "$TEXT" | pbcopy
  osascript -e 'tell application "System Events" to keystroke "v" using command down'
  echo "已上屏: $TEXT"
else
  echo "未找到对应常用语"
fi`;

        void navigator.clipboard.writeText(raycastScript).then(() => {
            copyRaycastBtn.textContent = "✓ 已复制 Raycast 脚本";
            setTimeout(() => {
                copyRaycastBtn.textContent = "⌘ 复制 Raycast Script 脚本";
            }, 3000);
        });
    });

    btnRow.append(copyQuickerBtn, copyAhkBtn, copyRaycastBtn, copyCurlBtn);
    sec.appendChild(btnRow);

    // 小驴家族生态联动矩阵
    const ecoTitle = document.createElement("div");
    ecoTitle.className = "xlc-eco-matrix-title";
    ecoTitle.textContent = "小驴家族全家桶协同状态（零强依赖，自动感知）：";
    sec.appendChild(ecoTitle);

    const ecoDesc = document.createElement("div");
    ecoDesc.className = "xlc-form-hint";
    ecoDesc.textContent = "本插件完全独立运行，零外部依赖。若检测到宿主环境中已安装的小驴系列兄弟插件，将自动激活只读数据联动；未安装时静默跳过，无任何性能开销。";
    sec.appendChild(ecoDesc);

    const ecoStatus = detectEcosystem();
    const ecoList = document.createElement("div");
    ecoList.className = "xlc-eco-matrix-list";

    for (const p of ecoStatus.plugins) {
        const row = document.createElement("div");
        row.className = "xlc-eco-row";

        const left = document.createElement("div");
        const nameStrong = document.createElement("strong");
        nameStrong.textContent = p.name;
        const descSpan = document.createElement("span");
        descSpan.className = "xlc-eco-desc";
        descSpan.textContent = `(${p.description})`;
        left.append(nameStrong, descSpan);

        const badge = document.createElement("span");
        badge.className = "xlc-badge " + (p.installed ? "xlc-badge--ai" : "xlc-badge--text");
        badge.textContent = p.installed ? `✓ 已就绪 · ${p.capability}` : "未安装 (可单独使用)";

        row.appendChild(left);
        row.appendChild(badge);
        ecoList.appendChild(row);
    }
    sec.appendChild(ecoList);

    const ecoBadge = document.createElement("div");
    ecoBadge.className = "xlc-eco-status-badge";
    ecoBadge.textContent = lvEcosystem.getStatusBadgeText();
    sec.appendChild(ecoBadge);

    root.appendChild(sec);
}

function buildDataSection(ctx: SettingsUiContext, root: HTMLElement): void {
    const t = ctx.t;
    // 数据区：当前库 + 重建索引 + 清空最近 + 标签体检 + 导出/导入
    const dataSec = document.createElement("div");
    dataSec.id = "xlc-settings-data";
    dataSec.className = "xlc-form-field xlc-card";
    const dataLabel = document.createElement("span");
    dataLabel.className = "xlc-form-label";
    dataLabel.textContent = t("dataSection");
    dataSec.appendChild(dataLabel);
    const libRow = document.createElement("div");
    libRow.className = "xlc-form-hint";
    const cfg = ctx.getConfig();
    libRow.textContent = `${t("librarySection")}：${cfg
        ? (cfg.mode === "notebook" ? t("libModeNotebook", String(cfg.notebookIds.length))
            : cfg.mode === "tree" ? t("libModeTree", String(cfg.containerDocIds.length))
                : t("libModeDoc", String(cfg.containerDocIds.length)))
        : t("libraryNone")}`;
    dataSec.appendChild(libRow);
    // 数据动作统一使用可访问状态行，避免只依赖 toast：加载会锁定按钮，失败提供重试，
    // 空结果和成功都在动作区附近保留可观测反馈。
    const operationStatus = document.createElement("div");
    operationStatus.className = "xlc-operation-status";
    operationStatus.hidden = true;
    operationStatus.setAttribute("role", "status");
    operationStatus.setAttribute("aria-live", "polite");
    dataSec.appendChild(operationStatus);
    const setOperationStatus = (state: "loading" | "success" | "error" | "empty" | "idle", message = "", retry?: () => void): void => {
        operationStatus.dataset.state = state;
        operationStatus.hidden = state === "idle";
        operationStatus.replaceChildren();
        if (message) {
            const text = document.createElement("span");
            text.className = state === "error" ? "xlc-form-error" : "xlc-form-hint";
            text.textContent = message;
            operationStatus.appendChild(text);
        }
        if (retry && state === "error") {
            const retryBtn = document.createElement("button");
            retryBtn.type = "button";
            retryBtn.className = "b3-button xlc-btn-ghost xlc-operation-retry";
            retryBtn.dataset.xlcControl = "settings.data.retry";
            retryBtn.textContent = t("retry");
            retryBtn.addEventListener("click", retry);
            operationStatus.appendChild(retryBtn);
        }
    };
    const dataBtns = document.createElement("div");
    dataBtns.className = "xlc-settings-data-actions";
    dataBtns.setAttribute("role", "toolbar");
    dataBtns.setAttribute("aria-label", t("dataSection"));
    dataBtns.style.display = "flex";
    dataBtns.style.gap = "8px";
    dataBtns.style.flexWrap = "wrap";
    dataBtns.addEventListener("keydown", (e) => {
        if (e.isComposing || e.keyCode === 229) return;
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            const btns = Array.from(dataBtns.querySelectorAll<HTMLButtonElement>("button:not([disabled])"));
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
            const btns = Array.from(dataBtns.querySelectorAll<HTMLButtonElement>("button:not([disabled])"));
            if (!btns.length) return;
            e.preventDefault();
            e.stopPropagation();
            if (e.key === "Home") btns[0]?.focus();
            else btns[btns.length - 1]?.focus();
        }
    });
    const mkBtn = (label: string, onClick?: () => void, control?: string): HTMLButtonElement => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "b3-button";
        btn.textContent = label;
        btn.setAttribute("aria-label", label);
        if (control) btn.dataset.xlcControl = control;
        if (onClick) btn.addEventListener("click", onClick);
        dataBtns.appendChild(btn);
        return btn;
    };
    // 异步按钮统一飞行态：执行期间禁用防连击，失败时保留可重试入口。
    const withFlight = (btn: HTMLButtonElement, run: () => Promise<{status?: "empty"; message?: string} | void>, opts: {flightLabel?: string; loading?: string; success?: string; empty?: string; formatError?: (err: unknown) => string} = {}): void => {
        btn.addEventListener("click", () => {
            if (btn.disabled) return;
            btn.disabled = true;
            const original = btn.textContent ?? "";
            btn.setAttribute("aria-busy", "true");
            if (opts.flightLabel) btn.textContent = opts.flightLabel;
            setOperationStatus("loading", opts.loading ?? t("loading"));
            void Promise.resolve()
                .then(run)
                .then((result) => {
                    const value = result ?? {};
                    if (value.status === "empty") {
                        setOperationStatus("empty", value.message ?? opts.empty ?? t("empty"));
                    } else if (value.message || opts.success) {
                        setOperationStatus("success", value.message ?? opts.success ?? "");
                    } else {
                        setOperationStatus("idle");
                    }
                })
                .catch((err: unknown) => {
                    const message = opts.formatError?.(err) ?? t("kernelError", toErrorMessage(err));
                    ctx.notify("error", message);
                    setOperationStatus("error", message, () => btn.click());
                })
                .finally(() => {
                    btn.disabled = false;
                    btn.removeAttribute("aria-busy");
                    if (opts.flightLabel) btn.textContent = original;
                });
        });
    };
    const reindexBtn = mkBtn(t("reindexBtn"), undefined, "settings.data.reindex");
    withFlight(reindexBtn, async () => {
        const idx = await ctx.library.reindex();
        const message = idx.truncated
            ? t("reindexTruncated", String(LIMITS.maxItems))
            : t("reindexDone", String(idx.entries.length));
        ctx.refreshSearch?.();
        ctx.notify("info", message);
        return {message};
    }, {flightLabel: t("indexing"), loading: t("indexing")});
    const clearRecentsBtn = mkBtn(ctx.state.recents.length ? t("clearRecents") : t("clearRecentsEmpty"), undefined, "settings.data.clearRecents");
    clearRecentsBtn.addEventListener("click", () => {
        if (ctx.state.recents.length === 0 || clearRecentsBtn.disabled) return;
        confirm("⚠️ " + t("clearRecents"), t("clearRecentsConfirm"), () => {
            ctx.state.recents = [];
            ctx.persistSoon();
            ctx.refreshSearch?.();
            clearRecentsBtn.textContent = t("clearRecentsEmpty");
            clearRecentsBtn.disabled = true;
            ctx.notify("info", t("clearRecentsDone"));
            setOperationStatus("success", t("clearRecentsDone"));
        });
    });
    clearRecentsBtn.disabled = ctx.state.recents.length === 0;
    if (ctx.state.ai.enabled) {
        const auditBtn = mkBtn("✦ " + t("tagAuditBtn"), undefined, "settings.data.tagAudit");
        withFlight(auditBtn, async () => {
            const result = await runTagAudit(ctx);
            return result === "empty" ? {status: "empty" as const, message: t("tagAuditTooFew")} : undefined;
        }, {flightLabel: "✦ " + t("aiWorking"), loading: t("aiWorking"), formatError: (err) => toErrorMessage(err)});
    }
    const exportBtn = mkBtn(t("exportBtn"), undefined, "settings.data.export");
    withFlight(exportBtn, async () => {
        const json = await ctx.exportBundle();
        const count = (JSON.parse(json) as {items: unknown[]}).items.length;
        if (count === 0) {
            return {status: "empty" as const, message: t("exportEmpty")};
        }
        const blob = new Blob([json], {type: "application/json"});
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `xiaolv-common-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        const message = t("exportDone", String(count));
        ctx.notify("info", message);
        return {message};
    }, {flightLabel: t("indexing"), loading: t("indexing"), formatError: (err) => formatExportError(ctx, err)});
    const packBtn = mkBtn(t("packBtn"), undefined, "settings.data.packExport");
    withFlight(packBtn, async () => {
        await openPackExportDialog(ctx);
        return {message: t("packExportTitle")};
    }, {flightLabel: t("loading"), loading: t("loading"), formatError: (err) => formatExportError(ctx, err)});
    const importBtn = mkBtn(t("importBtn"), () => {
        if (importBtn.disabled) return;
        const originalLabel = importBtn.textContent ?? "";
        let finished = false;
        let focusTimer: number | null = null;
        let onFocus: () => void;
        const finish = (): void => {
            if (finished) return;
            finished = true;
            importBtn.disabled = false;
            importBtn.textContent = originalLabel;
            importBtn.removeAttribute("aria-busy");
            window.removeEventListener("focus", onFocus);
            if (focusTimer !== null) window.clearTimeout(focusTimer);
        };
        onFocus = (): void => {
            // 取消系统文件选择器时没有 change 事件，回焦后恢复按钮，避免永久锁死。
            focusTimer = window.setTimeout(finish, 350);
        };
        importBtn.disabled = true;
        importBtn.setAttribute("aria-busy", "true");
        importBtn.textContent = t("loading");
        setOperationStatus("loading", t("loading"));
        window.addEventListener("focus", onFocus, {once: true});
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.dataset.xlcControl = "settings.import.file";
        fileInput.accept = ".json,application/json,.md,text/markdown,.csv,text/csv,.tsv,text/tab-separated-values";
        fileInput.addEventListener("change", () => {
            const file = fileInput.files?.[0];
            if (!file) {
                finish();
                return;
            }
            if (file.size > LIMITS.maxImportBytes) {
                const message = t("importFailed", t("importReasonTooLarge"));
                ctx.notify("error", message);
                setOperationStatus("error", message, () => importBtn.click());
                finish();
                return;
            }
            void file.text().then((text) => {
                const isMd = /\.md$/i.test(file.name);
                const isCsvTsv = /\.(csv|tsv)$/i.test(file.name);
                if (isMd) {
                    // Markdown 包：解析 → 同一策略对话框 → importBundle
                    const parsed = parseMarkdownPack(text);
                    if (parsed.items.length === 0) {
                        const message = t("importFailed", t("importReasonNoMeta"));
                        ctx.notify("error", message);
                        setOperationStatus("error", message, () => importBtn.click());
                        finish();
                        return;
                    }
                    openImportPolicyDialog(ctx, {items: parsed.items, pack: parsed.pack}, parsed.issues, {kind: "markdown-pack", items: parsed.items});
                    setOperationStatus("success", t("importPreview", String(parsed.items.length), String(parsed.issues.length)));
                    finish();
                    return;
                }
                if (isCsvTsv) {
                    void loadCsvTsvParser().then((parser) => {
                        const parsed = parser.parseCsvTsvItems(text);
                        if (parsed.items.length === 0) {
                            const message = t("importFailed", parsed.issues[0] ?? t("importReasonNoMeta"));
                            ctx.notify("error", message);
                            setOperationStatus("error", message, () => importBtn.click());
                            finish();
                            return;
                        }
                        const importIssues: ImportIssue[] = parsed.issues.map((reason, index) => ({index, reason}));
                        openImportPolicyDialog(ctx, {items: parsed.items}, importIssues, {kind: "csv-tsv", items: parsed.items});
                        setOperationStatus("success", t("importPreview", String(parsed.items.length), String(parsed.issues.length)));
                        finish();
                    }).catch((err: unknown) => {
                        const message = t("importFailed", toErrorMessage(err));
                        ctx.notify("error", message);
                        setOperationStatus("error", message, () => importBtn.click());
                        finish();
                    });
                    return;
                }
                const validation = validateImport(text);
                if (!validation.ok || !validation.parsed) {
                    const message = t("importFailed", validation.reason ?? t("importReasonUnknown"));
                    ctx.notify("error", message);
                    setOperationStatus("error", message, () => importBtn.click());
                    finish();
                    return;
                }
                openImportPolicyDialog(ctx, validation.parsed, validation.issues, {kind: "json", text});
                setOperationStatus("success", t("importPreview", String(validation.parsed.items.length), String(validation.issues.length)));
                finish();
            }).catch((err: unknown) => {
                const message = t("importFailed", toErrorMessage(err));
                ctx.notify("error", message);
                setOperationStatus("error", message, () => importBtn.click());
                finish();
            });
        });
        fileInput.addEventListener("cancel", () => {
            finish();
            setOperationStatus("idle");
        });
        fileInput.click();
    });
    importBtn.dataset.xlcControl = "settings.data.import";
    const espansoBtn = mkBtn(t("espansoImportBtn"), undefined, "settings.data.espansoImport");
    // 打开 Espanso 输入对话框本身是同步动作，但仍需锁住按钮直到对话框关闭，
    // 防止连续点击叠出多个解析窗口。
    let espansoOpen = false;
    espansoBtn.addEventListener("click", () => {
        if (espansoOpen || espansoBtn.disabled) return;
        espansoOpen = true;
        espansoBtn.disabled = true;
        espansoBtn.setAttribute("aria-busy", "true");
        setOperationStatus("loading", t("loading"));
        openEspansoImportDialog(ctx, () => {
            espansoOpen = false;
            espansoBtn.disabled = false;
            espansoBtn.removeAttribute("aria-busy");
            setOperationStatus("idle");
        });
    });
    const csvImportBtn = mkBtn(t("csvImportBtn"), undefined, "settings.data.csvImport");
    let csvOpen = false;
    csvImportBtn.addEventListener("click", () => {
        if (csvOpen || csvImportBtn.disabled) return;
        csvOpen = true;
        csvImportBtn.disabled = true;
        csvImportBtn.setAttribute("aria-busy", "true");
        setOperationStatus("loading", t("loading"));
        openCsvTsvImportWizard(ctx, () => {
            csvOpen = false;
            csvImportBtn.disabled = false;
            csvImportBtn.removeAttribute("aria-busy");
            setOperationStatus("idle");
        });
    });
    dataBtns.appendChild(csvImportBtn);

    const syncDiffBtn = mkBtn("⚡ " + (t("syncDiffBtn") || "同步冲突比对"), undefined, "settings.data.syncDiff");
    syncDiffBtn.addEventListener("click", () => {
        if (syncDiffBtn.disabled) return;
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".json,application/json";
        fileInput.dataset.xlcControl = "settings.sync-diff.file";
        fileInput.addEventListener("change", () => {
            const file = fileInput.files?.[0];
            if (!file) return;
            void file.text().then(async (text) => {
                const validation = validateImport(text);
                if (!validation.ok || !validation.parsed) {
                    ctx.notify("error", t("importFailed", validation.reason ?? t("importReasonUnknown")));
                    return;
                }
                const idx = await ctx.library.ensureIndex();
                const localList: SyncEntry[] = [];
                for (const it of idx.items.values()) {
                    let body = it.summary || "";
                    try {
                        const kd = await ctx.library.getStoredItemKramdown(it);
                        if (kd.ok) body = kd.data;
                    } catch {
                        body = it.summary || "";
                    }
                    localList.push({
                        id: it.id,
                        title: it.title,
                        alias: it.alias || "",
                        ...(it.shortcode ? {shortcode: it.shortcode} : {}),
                        kramdown: body,
                        itemType: it.itemType,
                        tags: it.tags || [],
                        category: it.category || "",
                        url: it.url || "",
                        targetBlockId: it.targetBlockId || "",
                        createdAt: it.createdAt || 0,
                        updatedAt: it.updatedAt || Date.now(),
                    });
                }
                const remoteList: SyncEntry[] = validation.parsed.items.map((it: any) => ({
                    id: it.id,
                    title: it.title,
                    alias: it.alias || "",
                    ...(it.shortcode ? {shortcode: it.shortcode} : {}),
                    kramdown: it.kramdown || it.markdown || it.content || it.summary || "",
                    itemType: it.itemType,
                    tags: it.tags || [],
                    category: it.category || "",
                    url: it.url || "",
                    targetBlockId: it.targetBlockId || "",
                    createdAt: it.createdAt || 0,
                    updatedAt: it.updatedAt || Date.now(),
                }));
                const report = diffLibraries(localList, remoteList);
                openSyncDiffModal({
                    report,
                    localEntries: localList,
                    onConfirm: async (receipt, plan) => {
                        const toExported = (pi: typeof plan.items[number]): ExportedItem => {
                            const src = pi.entry!;
                            return {
                                id: pi.action === "fork" ? (pi.forkedId || newLogicalId()) : src.id,
                                title: pi.action === "fork" && !src.title.includes("副本") ? `${src.title} (副本)` : src.title,
                                alias: src.alias || "",
                                ...(src.shortcode ? {shortcode: src.shortcode} : {}),
                                itemType: src.itemType || "text",
                                kramdown: src.kramdown || "",
                                tags: [...(src.tags || [])],
                                category: src.category || "",
                                source: {sourceDocId: "", sourceBlockId: "", sourceType: "manual"},
                                url: src.url || "",
                                targetBlockId: src.targetBlockId || "",
                                createdAt: src.createdAt || Date.now(),
                                updatedAt: Date.now(),
                            };
                        };
                        const toUpdate = plan.items
                            .filter((pi) => pi.entry && pi.action === "update")
                            .map(toExported);
                        const toCreateOrFork = plan.items
                            .filter((pi) => pi.entry && (pi.action === "create" || pi.action === "fork"))
                            .map(toExported);
                        const toDelete = plan.items.filter((pi) => pi.action === "delete");

                        if (toUpdate.length > 0) {
                            await ctx.importMarkdownItems(toUpdate, "overwrite");
                        }
                        if (toCreateOrFork.length > 0) {
                            await ctx.importMarkdownItems(toCreateOrFork, "rename");
                        }
                        for (const del of toDelete) {
                            await ctx.library.removeItem(del.id);
                        }
                        if (toUpdate.length > 0 || toCreateOrFork.length > 0 || toDelete.length > 0) {
                            ctx.refreshSearch?.();
                            ctx.notify("info", `同步合并完成：处理 ${receipt.success} 项条目`);
                        }
                    },
                });
            });
        });
        fileInput.click();
    });
    dataBtns.appendChild(syncDiffBtn);
    dataSec.appendChild(dataBtns);
    
    // 开箱即用套件市场直达入口（CAND-038 / TODO-FEAT-033）
    const hubRow = document.createElement("div");
    hubRow.className = "xlc-setting-row xlc-template-import-row xlc-starter-hub-setting-row";
    const hubText = document.createElement("span");
    hubText.className = "xlc-setting-text";
    hubText.textContent = "📦 开箱即用套件市场：按需挑选商务财务、客服售后、开发运维与学术排版专属预置库。";
    hubRow.appendChild(hubText);
    const hubBtn = document.createElement("button");
    hubBtn.type = "button";
    hubBtn.className = "b3-button xlc-btn-primary";
    hubBtn.textContent = "📦 浏览全量套件市场";
    hubBtn.dataset.xlcControl = "settings.data.starterHub";
    hubBtn.addEventListener("click", () => {
        openStarterPacksHubDialog({
            t: ctx.t,
            notify: ctx.notify,
            importStarterPackDirect: async (md) => {
                const parsed = parseMarkdownPack(md);
                if (parsed.items.length === 0) return {ok: false, count: 0};
                const receipt = await ctx.importMarkdownItems(parsed.items, "skip");
                if (receipt.created > 0 || receipt.skipped > 0 || receipt.failed === 0) {
                    ctx.refreshSearch?.();
                    return {ok: true, count: receipt.created || receipt.total};
                }
                return {ok: false, count: 0};
            },
            onImportSuccess: () => ctx.refreshSearch?.(),
        });
    });
    hubRow.appendChild(hubBtn);
    dataSec.appendChild(hubRow);

    // 提示包导入（R74）
    const templateRow = document.createElement("div");
    templateRow.className = "xlc-setting-row xlc-template-import-row";
    const templateText = document.createElement("span");
    templateText.className = "xlc-setting-text";
    templateText.textContent = t("promptPackHint");
    templateRow.appendChild(templateText);
    const templateBtn = document.createElement("button");
    templateBtn.type = "button";
    templateBtn.className = "b3-button";
    templateBtn.textContent = t("promptPackBtn");
    templateBtn.dataset.xlcControl = "settings.data.templateImport";
    templateBtn.addEventListener("click", () => {
        if (templateBtn.disabled) return;
        templateBtn.disabled = true;
        templateBtn.setAttribute("aria-busy", "true");
        const originalLabel = templateBtn.textContent ?? "";
        templateBtn.textContent = t("loading");
        setOperationStatus("loading", t("loading"));
        const parsed = parseMarkdownPack(PROMPT_PACK_MD);
        if (parsed.items.length === 0) {
            const message = t("importFailed", t("importReasonPackEmpty"));
            ctx.notify("error", message);
            setOperationStatus("error", message, () => templateBtn.click());
            templateBtn.disabled = false;
            templateBtn.removeAttribute("aria-busy");
            templateBtn.textContent = originalLabel;
            return;
        }
        openImportPolicyDialog(ctx, {items: parsed.items, pack: parsed.pack}, parsed.issues, {kind: "markdown-pack", items: parsed.items});
        setOperationStatus("success", t("importPreview", String(parsed.items.length), String(parsed.issues.length)));
        templateBtn.disabled = false;
        templateBtn.removeAttribute("aria-busy");
        templateBtn.textContent = originalLabel;
    });
    templateRow.appendChild(templateBtn);
    dataSec.appendChild(templateRow);

    // 渐进批判反思模板包导入（Issue #2）
    const reformRow = document.createElement("div");
    reformRow.className = "xlc-setting-row xlc-template-import-row";
    const reformText = document.createElement("span");
    reformText.className = "xlc-setting-text";
    reformText.textContent = t("reformulationPackHint");
    reformRow.appendChild(reformText);
    const reformBtn = document.createElement("button");
    reformBtn.type = "button";
    reformBtn.className = "b3-button";
    reformBtn.textContent = t("reformulationPackBtn");
    reformBtn.dataset.xlcControl = "settings.data.reformulationImport";
    reformBtn.addEventListener("click", () => {
        if (reformBtn.disabled) return;
        reformBtn.disabled = true;
        reformBtn.setAttribute("aria-busy", "true");
        const originalLabel = reformBtn.textContent ?? "";
        reformBtn.textContent = t("loading");
        setOperationStatus("loading", t("loading"));
        const parsed = parseMarkdownPack(REFORMULATION_PACK_MD);
        if (parsed.items.length === 0) {
            const message = t("importFailed", t("importReasonPackEmpty"));
            ctx.notify("error", message);
            setOperationStatus("error", message, () => reformBtn.click());
            reformBtn.disabled = false;
            reformBtn.removeAttribute("aria-busy");
            reformBtn.textContent = originalLabel;
            return;
        }
        openImportPolicyDialog(ctx, {items: parsed.items, pack: parsed.pack}, parsed.issues, {kind: "markdown-pack", items: parsed.items});
        setOperationStatus("success", t("importPreview", String(parsed.items.length), String(parsed.issues.length)));
        reformBtn.disabled = false;
        reformBtn.removeAttribute("aria-busy");
        reformBtn.textContent = originalLabel;
    });
    reformRow.appendChild(reformBtn);
    dataSec.appendChild(reformRow);

    // Task Horizon 联动 SOP 任务清单包导入（Issue #3）
    const thRow = document.createElement("div");
    thRow.className = "xlc-setting-row xlc-template-import-row";
    const thText = document.createElement("span");
    thText.className = "xlc-setting-text";
    thText.textContent = t("taskHorizonPackHint");
    thRow.appendChild(thText);
    const thBtn = document.createElement("button");
    thBtn.type = "button";
    thBtn.className = "b3-button";
    thBtn.textContent = t("taskHorizonPackBtn");
    thBtn.dataset.xlcControl = "settings.data.taskHorizonImport";
    thBtn.addEventListener("click", () => {
        if (thBtn.disabled) return;
        thBtn.disabled = true;
        thBtn.setAttribute("aria-busy", "true");
        const originalLabel = thBtn.textContent ?? "";
        thBtn.textContent = t("loading");
        setOperationStatus("loading", t("loading"));
        const parsed = parseMarkdownPack(TASK_HORIZON_PACK_MD);
        if (parsed.items.length === 0) {
            const message = t("importFailed", t("importReasonPackEmpty"));
            ctx.notify("error", message);
            setOperationStatus("error", message, () => thBtn.click());
            thBtn.disabled = false;
            thBtn.removeAttribute("aria-busy");
            thBtn.textContent = originalLabel;
            return;
        }
        openImportPolicyDialog(ctx, {items: parsed.items, pack: parsed.pack}, parsed.issues, {kind: "markdown-pack", items: parsed.items});
        setOperationStatus("success", t("importPreview", String(parsed.items.length), String(parsed.issues.length)));
        thBtn.disabled = false;
        thBtn.removeAttribute("aria-busy");
        thBtn.textContent = originalLabel;
    });
    thRow.appendChild(thBtn);
    dataSec.appendChild(thRow);

    // 思源标准 Callout 提示框组件包导入（Issue #3）
    const calloutRow = document.createElement("div");
    calloutRow.className = "xlc-setting-row xlc-template-import-row";
    const calloutText = document.createElement("span");
    calloutText.className = "xlc-setting-text";
    calloutText.textContent = t("calloutPackHint");
    calloutRow.appendChild(calloutText);
    const calloutBtn = document.createElement("button");
    calloutBtn.type = "button";
    calloutBtn.className = "b3-button";
    calloutBtn.textContent = t("calloutPackBtn");
    calloutBtn.dataset.xlcControl = "settings.data.calloutImport";
    calloutBtn.addEventListener("click", () => {
        if (calloutBtn.disabled) return;
        calloutBtn.disabled = true;
        calloutBtn.setAttribute("aria-busy", "true");
        const originalLabel = calloutBtn.textContent ?? "";
        calloutBtn.textContent = t("loading");
        setOperationStatus("loading", t("loading"));
        const parsed = parseMarkdownPack(CALLOUT_PACK_MD);
        if (parsed.items.length === 0) {
            const message = t("importFailed", t("importReasonPackEmpty"));
            ctx.notify("error", message);
            setOperationStatus("error", message, () => calloutBtn.click());
            calloutBtn.disabled = false;
            calloutBtn.removeAttribute("aria-busy");
            calloutBtn.textContent = originalLabel;
            return;
        }
        openImportPolicyDialog(ctx, {items: parsed.items, pack: parsed.pack}, parsed.issues, {kind: "markdown-pack", items: parsed.items});
        setOperationStatus("success", t("importPreview", String(parsed.items.length), String(parsed.issues.length)));
        calloutBtn.disabled = false;
        calloutBtn.removeAttribute("aria-busy");
        calloutBtn.textContent = originalLabel;
    });
    calloutRow.appendChild(calloutBtn);
    dataSec.appendChild(calloutRow);

    // 学术科研规范引文模板包导入
    const citationRow = document.createElement("div");
    citationRow.className = "xlc-setting-row xlc-template-import-row";
    const citationText = document.createElement("span");
    citationText.className = "xlc-setting-text";
    citationText.textContent = t("academicCitationPackHint");
    citationRow.appendChild(citationText);
    const citationBtn = document.createElement("button");
    citationBtn.type = "button";
    citationBtn.className = "b3-button";
    citationBtn.textContent = t("academicCitationPackBtn");
    citationBtn.dataset.xlcControl = "settings.data.academicCitationImport";
    citationBtn.addEventListener("click", () => {
        if (citationBtn.disabled) return;
        citationBtn.disabled = true;
        citationBtn.setAttribute("aria-busy", "true");
        const originalLabel = citationBtn.textContent ?? "";
        citationBtn.textContent = t("loading");
        setOperationStatus("loading", t("loading"));
        const parsed = parseMarkdownPack(ACADEMIC_CITATION_PACK_MD);
        if (parsed.items.length === 0) {
            const message = t("importFailed", t("importReasonPackEmpty"));
            ctx.notify("error", message);
            setOperationStatus("error", message, () => citationBtn.click());
            citationBtn.disabled = false;
            citationBtn.removeAttribute("aria-busy");
            citationBtn.textContent = originalLabel;
            return;
        }
        openImportPolicyDialog(ctx, {items: parsed.items, pack: parsed.pack}, parsed.issues, {kind: "markdown-pack", items: parsed.items});
        setOperationStatus("success", t("importPreview", String(parsed.items.length), String(parsed.issues.length)));
        citationBtn.disabled = false;
        citationBtn.removeAttribute("aria-busy");
        citationBtn.textContent = originalLabel;
    });
    citationRow.appendChild(citationBtn);
    dataSec.appendChild(citationRow);

    // 思源原生属性视图（AV 数据库）自动化联动指引（G51）
    const avRow = document.createElement("div");
    avRow.className = "xlc-template-import-row";
    const avHint = document.createElement("div");
    avHint.className = "xlc-form-hint";
    const avStrong = document.createElement("strong");
    avStrong.textContent = "思源属性视图（AV 数据库块）自动化联动：";
    avHint.appendChild(avStrong);
    avHint.appendChild(document.createElement("br"));
    avHint.appendChild(document.createTextNode("所有条目均锚定在真实思源块并携带 custom-xlc-* 属性。您可在笔记中输入 /av 插入原生属性视图，配置自动收集规则「custom-xlc-id 存在」，即可自动以原生表格、看板等形态管理全部常用资产。"));
    avRow.appendChild(avHint);

    const avCopyBtn = document.createElement("button");
    avCopyBtn.type = "button";
    avCopyBtn.className = "b3-button";
    avCopyBtn.textContent = "📋 复制 AV 收集规则说明";
    avCopyBtn.addEventListener("click", () => {
        const guideText = `【思源属性视图 (AV 数据库) 常用资产自动化收集指引】\n1. 在思源笔记任意文档输入 /av 插入一个属性视图（数据库块）；\n2. 点击右上角视图设置 -> 自动收集规则 (Automations)；\n3. 添加块属性匹配条件：\n   - 属性名：custom-xlc-id\n   - 操作符：存在 (exists) 或 不为空\n4. （可选）按分类多维聚合：\n   - 属性名：custom-xlc-category\n   - 操作符：等于 (equals) 您指定的分类名\n5. 完成后，所有小驴常用资产将自动以思源官方原生表格、看板或列表形态全量汇聚，双向无缝读写！`;
        if (navigator.clipboard) {
            void navigator.clipboard.writeText(guideText).then(() => {
                ctx.notify("info", "已复制思源属性视图 (AV 数据库) 收集规则说明到剪贴板");
            }).catch(() => undefined);
        }
    });
    avRow.appendChild(avCopyBtn);
    dataSec.appendChild(avRow);

    root.appendChild(dataSec);
}

/** Espanso 配置导入（G2/R164）：粘贴 match YAML → 解析预览（条数+问题清单）→ 复用导入策略管道落库。 */
function openEspansoImportDialog(ctx: SettingsUiContext, onClose?: () => void): void {
    const t = ctx.t;
    const isMobileModal = isMobileDialogViewport();
    const dialog = new Dialog({
        title: t("espansoTitle"),
        content: "",
        width: isMobileModal ? "100vw" : "min(680px, 92vw)",
        height: isMobileModal ? "100dvh" : "min(680px, 86vh)",
    });
    const container = dialog.element.querySelector(".b3-dialog__container");
    if (container) container.classList.add("xlc-form-host", "xlc-settings-host");
    mountPlatformDialogTitleWrap(dialog.element, t("espansoTitle"));
    adaptSecondaryDialogForMobile(dialog, t("close"));
    const body = getDialogBody(dialog.element);
    if (!body) {
        onClose?.();
        return;
    }
    body.innerHTML = "";
    const root = document.createElement("div");
    root.className = "xlc-form";

    const hint = document.createElement("p");
    hint.className = "xlc-form-hint";
    hint.textContent = t("espansoHint");
    root.appendChild(hint);

    const ta = document.createElement("textarea");
    ta.className = "b3-text-field";
    ta.dataset.xlcControl = "settings.espanso.text";
    ta.rows = 10;
    ta.placeholder = t("espansoPlaceholder");
    ta.setAttribute("spellcheck", "false");
    root.appendChild(ta);

    const preview = document.createElement("div");
    preview.className = "xlc-form-hint";
    preview.style.whiteSpace = "pre-wrap";
    root.appendChild(preview);

    const foot = document.createElement("div");
    foot.className = "xlc-form-row";
    foot.setAttribute("role", "toolbar");
    foot.setAttribute("aria-label", "Espanso导入操作栏");
    foot.addEventListener("keydown", (e: any) => {
        if (e.isComposing || e.keyCode === 229) return;
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            const btns = Array.from(foot.querySelectorAll<HTMLButtonElement>("button:not([disabled])"));
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
            const btns = Array.from(foot.querySelectorAll<HTMLButtonElement>("button:not([disabled])"));
            if (!btns.length) return;
            e.preventDefault();
            e.stopPropagation();
            if (e.key === "Home") btns[0]?.focus();
            else btns[btns.length - 1]?.focus();
        }
    });
    foot.style.justifyContent = "flex-end";
    foot.style.gap = "8px";
    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "b3-button";
    cancelBtn.dataset.xlcControl = "settings.espanso.cancel";
    cancelBtn.textContent = t("cancel");
    cancelBtn.setAttribute("aria-label", t("cancel"));
    foot.appendChild(cancelBtn);
    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "b3-button xlc-btn-primary";
    nextBtn.dataset.xlcControl = "settings.espanso.next";
    nextBtn.textContent = t("setupNext");
    nextBtn.setAttribute("aria-label", t("setupNext"));
    nextBtn.disabled = true;
    foot.appendChild(nextBtn);
    root.appendChild(foot);
    body.appendChild(root);

    // Dialog 的右上角关闭按钮由宿主销毁 DOM；观察移除确保入口按钮不会永久锁定。
    let released = false;
    const release = (): void => {
        if (released) return;
        released = true;
        observer?.disconnect();
        onClose?.();
    };
    let observer: MutationObserver | null = null;
    observer = typeof MutationObserver === "undefined" ? null : new MutationObserver(() => {
        if (!dialog.element.isConnected) release();
    });
    observer?.observe(document.body, {childList: true, subtree: true});

    let parsedItems: ExportedItem[] = [];
    let parsedText: string | null = null;
    const runParse = async (): Promise<void> => {
        const sourceText = ta.value;
        parsedItems = [];
        parsedText = null;
        nextBtn.disabled = true;
        preview.textContent = "";
        let parser: typeof import("../service/espanso-import");
        try {
            parser = await loadEspansoParser();
        } catch (err) {
            preview.textContent = t("importFailed", toErrorMessage(err).slice(0, 120));
            return;
        }
        // 输入等待期间可能已经变化；旧解析结果不能覆盖最新文本。
        if (sourceText !== ta.value || !dialog.element.isConnected) return;
        const result = parser.parseEspansoYaml(sourceText);
        if (result.items.length === 0) {
            preview.textContent = result.issues.length ? result.issues.slice(0, 5).join("\n") : t("espansoNone");
            return;
        }
        parsedItems = result.items;
        parsedText = sourceText;
        const lines = [t("espansoParsed", String(result.items.length))];
        for (const issue of result.issues.slice(0, 5)) lines.push(`· ${issue}`);
        if (result.issues.length > 5) lines.push(`· …+${result.issues.length - 5}`);
        preview.textContent = lines.join("\n");
        nextBtn.disabled = false;
    };
    // 输入防抖 400ms（与搜索输入同节奏）：粘贴后无需额外点按钮
    let parseTimer: ReturnType<typeof setTimeout> | undefined;
    ta.addEventListener("input", () => {
        if (parseTimer) clearTimeout(parseTimer);
        // 立即让旧预览失效；400ms 防抖期间不能继续导入上一次的解析结果。
        parsedItems = [];
        parsedText = null;
        nextBtn.disabled = true;
        preview.textContent = "";
        parseTimer = setTimeout(() => { void runParse(); }, 400);
    });
    cancelBtn.addEventListener("click", () => {
        dialog.destroy();
        release();
    });
    nextBtn.addEventListener("click", () => {
        if (nextBtn.disabled || parsedItems.length === 0 || parsedText !== ta.value) return;
        dialog.destroy();
        release();
        openImportPolicyDialog(
            ctx,
            {items: parsedItems.map((i) => ({id: i.id, title: i.title}))},
            [],
            {kind: "espanso", items: parsedItems},
        );
    });
    ta.focus();
}

/** AI 标签体检：仅标签清单出域；结果只展示，不自动修改任何条目 */
async function runTagAudit(ctx: SettingsUiContext): Promise<"empty" | "shown"> {
    const t = ctx.t;
    let idx: Awaited<ReturnType<LibraryService["ensureIndex"]>>;
    try {
        idx = await ctx.library.ensureIndex();
    } catch (err) {
        throw new Error(t("kernelError", toErrorMessage(err)));
    }
    const tags = collectTags(idx.entries);
    if (tags.length < 2) {
        ctx.notify("info", t("tagAuditTooFew"));
        return "empty";
    }
    let suggestions;
    try {
        suggestions = await ctx.ai.tagAudit(tags);
    } catch (err) {
        throw new Error(ctx.aiErrorText(err));
    }
    const isMobileModal = isMobileDialogViewport();
    const dialog = new Dialog({
        title: t("tagAuditTitle"),
        content: "",
        width: isMobileModal ? "100vw" : "min(620px, 92vw)",
        height: isMobileModal ? "100dvh" : "min(600px, 84vh)", // 固定高：建议清单增长不顶跳（R146）
    });
    dialog.element.querySelector(".b3-dialog__container")?.classList.add("xlc-form-host", "xlc-settings-host");
    mountPlatformDialogTitleWrap(dialog.element, t("tagAuditTitle"));
    adaptSecondaryDialogForMobile(dialog, t("close"));
    const body = getDialogBody(dialog.element);
    if (!body) throw new Error(t("kernelError", "无法打开体检结果"));
    body.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "xlc-form";
    if (suggestions.length === 0) {
        const empty = document.createElement("p");
        empty.className = "xlc-form-hint";
        empty.textContent = t("tagAuditEmpty");
        wrap.appendChild(empty);
    } else {
        for (const s of suggestions) {
            const row = document.createElement("div");
            row.className = "xlc-sugrow";
            const label = document.createElement("span");
            label.textContent = `✦ ${t(s.type === "merge" ? "tagAuditMerge" : "tagAuditRename")}：${s.tags.join(" + ")} → ${s.suggestion}${s.reason ? `（${s.reason}）` : ""}`;
            row.appendChild(label);
            wrap.appendChild(row);
        }
        const hint = document.createElement("span");
        hint.className = "xlc-form-hint";
        hint.textContent = t("aiOriginalPreserved");
        wrap.appendChild(hint);
    }
    const actions = document.createElement("div");
    actions.className = "xlc-form-actions";
    actions.setAttribute("role", "toolbar");
    actions.setAttribute("aria-label", "标签体检操作栏");
    const close = document.createElement("button");
    close.type = "button";
    close.className = "b3-button";
    close.dataset.xlcControl = "settings.tag-audit.close";
    close.textContent = t("close");
    close.setAttribute("aria-label", t("close"));
    close.addEventListener("click", () => dialog.destroy());
    actions.appendChild(close);
    wrap.appendChild(actions);
    body.appendChild(wrap);
    return suggestions.length === 0 ? "empty" : "shown";
}

/** 导入策略确认（导入前校验已过；策略三选 → importBundleText → 汇总回执）。导出供渲染 harness 取证。 */
export function openImportPolicyDialog(
    ctx: SettingsUiContext,
    parsed: {items: Array<{id: string; title: string}>; pack?: {name: string; vars: string[]; snippets?: string[]; missingSnippets?: string[]; dependencyMap?: Record<string, string[]>}},
    issues: ImportIssue[],
    source: {kind: "json"; text: string} | {kind: "markdown-pack"; items: ExportedItem[]} | {kind: "espanso"; items: ExportedItem[]} | {kind: "csv-tsv"; items: ExportedItem[]},
): void {
    const t = ctx.t;
    const isMobileModal = isMobileDialogViewport();
    const dialog = new Dialog({
        title: t("importPolicyTitle"),
        content: "",
        width: isMobileModal ? "100vw" : "min(540px, 92vw)",
        height: isMobileModal ? "100dvh" : "min(640px, 86vh)", // 固定高：策略卡片高度稳定（R146）
    });
    dialog.element.querySelector(".b3-dialog__container")?.classList.add("xlc-form-host", "xlc-settings-host");
    mountPlatformDialogTitleWrap(dialog.element, t("importPolicyTitle"));
    adaptSecondaryDialogForMobile(dialog, t("close"));
    const body = getDialogBody(dialog.element);
    if (!body) return;
    body.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "xlc-form";
    // 元数据徽标行（原型屏 8：条目数 / 无效将跳过 / 模板包名·变量）
    const meta = document.createElement("div");
    meta.className = "xlc-import-meta";
    const metaCount = document.createElement("span");
    metaCount.className = "xlc-badge xlc-badge--markdown";
    metaCount.textContent = t("itemCountBadge", String(parsed.items.length));
    meta.appendChild(metaCount);
    if (issues.length > 0) {
        const metaInvalid = document.createElement("span");
        metaInvalid.className = "xlc-badge xlc-badge--warn";
        metaInvalid.textContent = t("invalidSkipBadge", String(issues.length));
        meta.appendChild(metaInvalid);
    }
    if (parsed.pack) {
        const metaPack = document.createElement("span");
        metaPack.className = "xlc-badge xlc-badge--var";
        let packText = `${parsed.pack.name} · ${t("packVarsBadge", String(parsed.pack.vars.length))}`;
        if (parsed.pack.snippets && parsed.pack.snippets.length > 0) {
            packText += ` · ${t("packSnippetsBadge", String(parsed.pack.snippets.length))}`;
        }
        metaPack.textContent = packText;
        meta.appendChild(metaPack);
        if (parsed.pack.missingSnippets && parsed.pack.missingSnippets.length > 0) {
            const metaMissing = document.createElement("span");
            metaMissing.className = "xlc-badge xlc-badge--warn";
            metaMissing.dataset.xlcControl = "import.pack.missing-snippets";
            metaMissing.textContent = t("packMissingSnippetsBadge", String(parsed.pack.missingSnippets.length));
            meta.appendChild(metaMissing);
        }
    }
    wrap.appendChild(meta);
    const preview = document.createElement("p");
    preview.className = "xlc-form-hint";
    preview.textContent = t("importPreview", String(parsed.items.length), String(issues.length));
    wrap.appendChild(preview);

    // G29 / T-0141: 模板包片段嵌套关系树可视化
    if (parsed.pack?.dependencyMap && Object.keys(parsed.pack.dependencyMap).length > 0) {
        const depWrap = document.createElement("div");
        depWrap.className = "xlc-import-dep-wrap";
        const depHead = document.createElement("div");
        depHead.className = "xlc-form-label";
        depHead.textContent = "🌲 " + (t("packDepTreeTitle") || "嵌套片段依赖关系：");
        depWrap.appendChild(depHead);

        const depTree = document.createElement("div");
        depTree.className = "xlc-import-dep-tree";
        depTree.dataset.xlcControl = "import.pack.dep-tree";
        depTree.tabIndex = 0;
        depTree.setAttribute("role", "region");
        depTree.setAttribute("aria-label", t("packDepTreeTitle") || "嵌套片段依赖关系");

        for (const [parentTitle, children] of Object.entries(parsed.pack.dependencyMap)) {
            const row = document.createElement("div");
            row.className = "xlc-dep-row";
            const pSpan = document.createElement("strong");
            pSpan.textContent = parentTitle;
            const arrow = document.createElement("span");
            arrow.className = "xlc-dep-arrow";
            arrow.textContent = " → 引用：";
            const cList = document.createElement("span");
            cList.textContent = children.join("、");
            row.append(pSpan, arrow, cList);
            depTree.appendChild(row);
        }
        depWrap.appendChild(depTree);
        wrap.appendChild(depWrap);
    }
    if (parsed.pack?.missingSnippets && parsed.pack.missingSnippets.length > 0) {
        const missingHint = document.createElement("p");
        missingHint.className = "xlc-form-hint xlc-form-error";
        missingHint.dataset.xlcControl = "import.pack.missing-hint";
        missingHint.textContent = t("packMissingSnippetsHint", parsed.pack.missingSnippets.join("、"));
        wrap.appendChild(missingHint);
    }
    const receiptHint = document.createElement("p");
    receiptHint.className = "xlc-form-hint";
    receiptHint.setAttribute("role", "status");
    receiptHint.setAttribute("aria-live", "polite");
    receiptHint.textContent = t("importReceiptHint");
    const policyCards: HTMLButtonElement[] = [];
    const run = async (policy: ConflictPolicy): Promise<void> => {
        if (policyCards.some((card) => card.disabled)) return;
        policyCards.forEach((card) => {
            card.disabled = true;
            card.setAttribute("aria-busy", "true");
        });
        receiptHint.dataset.state = "loading";
        receiptHint.textContent = t("loading");
        try {
            const receipt = source.kind === "json"
                ? await ctx.importBundleText(source.text, policy)
                : await ctx.importMarkdownItems(source.items, policy);
            ctx.refreshSearch?.();
            const message = t(
                "importDone",
                String(receipt.created),
                String(receipt.skipped),
                String(receipt.overwritten),
                String(receipt.renamed),
                String(receipt.failed),
            );
            receiptHint.dataset.state = receipt.failed > 0 ? "error" : "success";
            receiptHint.textContent = message;
            ctx.notify(receipt.failed > 0 ? "error" : "info", message);
        } catch (err) {
            // 执行期失败≠校验失败：写入可能已部分完成，文案不得谎称「原始数据未改动」。
            const message = t("importRunFailed", toErrorMessage(err));
            receiptHint.dataset.state = "error";
            receiptHint.replaceChildren();
            const error = document.createElement("span");
            error.className = "xlc-form-error";
            error.textContent = message;
            receiptHint.appendChild(error);
            const retryBtn = document.createElement("button");
            retryBtn.type = "button";
            retryBtn.className = "b3-button xlc-btn-ghost xlc-operation-retry";
            retryBtn.dataset.xlcControl = "settings.import.retry";
            retryBtn.textContent = t("retry");
            retryBtn.addEventListener("click", () => void run(policy));
            receiptHint.appendChild(retryBtn);
            ctx.notify("error", message);
            policyCards.forEach((card) => {
                card.disabled = false;
                card.removeAttribute("aria-busy");
            });
        }
    };
    // 策略卡（原型屏 8）：标题+说明+推荐档高亮；逐卡整行可点
    const policyList = document.createElement("div");
    policyList.className = "xlc-policy-list";
    policyList.setAttribute("role", "radiogroup");
    policyList.setAttribute("aria-label", t("importPolicyTitle"));
    for (const [policy, title, desc, recommended] of [
        ["skip", t("importPolicySkip"), t("importPolicySkipDesc"), false],
        ["overwrite", t("importPolicyOverwrite"), t("importPolicyOverwriteDesc"), false],
        ["rename", t("importPolicyRename"), t("importPolicyRenameDesc"), true],
    ] as Array<[ConflictPolicy, string, string, boolean]>) {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "xlc-policy" + (recommended ? " xlc-policy--recommended" : "");
        card.setAttribute("role", "radio");
        card.setAttribute("aria-checked", recommended ? "true" : "false");
        card.setAttribute("aria-label", `${title} · ${desc}`);
        const icon = document.createElement("span");
        icon.className = "xlc-policy-ic";
        // ○（U+25CB）：⃝ 组合字符在中文字体下渲染成错位小圈，换稳定字形
        icon.textContent = policy === "skip" ? "○" : policy === "overwrite" ? "⇄" : "＋";
        card.appendChild(icon);
        const text = document.createElement("span");
        const titleEl = document.createElement("span");
        titleEl.className = "xlc-policy-title";
        titleEl.textContent = title + (recommended ? `（${t("recommended")}）` : "");
        text.appendChild(titleEl);
        const descEl = document.createElement("span");
        descEl.className = "xlc-policy-desc";
        descEl.textContent = desc;
        text.appendChild(descEl);
        card.appendChild(text);
        card.dataset.xlcControl = `settings.import.policy.${policy}`;
        card.addEventListener("click", () => void run(policy));
        card.addEventListener("keydown", (e) => {
            if (e.isComposing || e.keyCode === 229) return;
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                e.stopPropagation();
                const cards = Array.from(policyList.querySelectorAll<HTMLButtonElement>(".xlc-policy"));
                if (!cards.length) return;
                const idx = cards.indexOf(card);
                const nextIdx = e.key === "ArrowDown"
                    ? (idx + 1) % cards.length
                    : (idx - 1 + cards.length) % cards.length;
                cards[nextIdx]?.focus();
                return;
            }
            if (e.key === "Home" || e.key === "End") {
                e.preventDefault();
                e.stopPropagation();
                const cards = Array.from(policyList.querySelectorAll<HTMLButtonElement>(".xlc-policy"));
                if (!cards.length) return;
                if (e.key === "Home") cards[0]?.focus();
                else cards[cards.length - 1]?.focus();
            }
        });
        policyCards.push(card);
        policyList.appendChild(card);
    }
    wrap.appendChild(policyList);
    wrap.appendChild(receiptHint);

    wrap.addEventListener("keydown", (e) => {
        if (e.isComposing || (e as KeyboardEvent).keyCode === 229) return;
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            const recommendedCard = policyCards.find((c) => c.classList.contains("xlc-policy--recommended")) || policyCards[0];
            if (e.repeat || !recommendedCard || recommendedCard.disabled) return;
            e.preventDefault();
            recommendedCard.click();
        }
    });

    body.appendChild(wrap);
}
