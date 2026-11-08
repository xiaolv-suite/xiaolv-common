// 变量填充卡片（R67/F1，质感基准 docs/design/prototype.html 屏 4）：
// 含 {{xlc:ask:…}} 的条目在插入前弹出轻量表单——Enter 插入 / Tab 切字段 / Esc 取消。
// 填充值仅作用于本次插入（草稿不回写库）；同名重复变量只询问一次（listAskFields 已去重）。
// 安全：字段名/选项一律 textContent 注入，绝不 innerHTML。
import {Dialog} from "siyuan";
import {getDialogBody, isMobileDialogViewport, openInfoDialog, openTextPromptDialog} from "./dialog-dom";
import {AskField, askFieldTag, expandAsks, stripCursorToken} from "../model/variables";
import {ItemType} from "../model/item";
import {formatPanguSpacing, tsvToMarkdownTable, stripUrlTrackingParams, normalizeListFormatting, normalizePunctuation, deduplicateLines, compactWhitespaceAndLines, convertWidth, encodeBase64, encodeUrlText, toggleMarkdownBlockquote, escapeHtmlEntities, unescapeHtmlEntities, formatMarkdownTable, csvToJson, toggleMarkdownTaskStatus, extractMarkdownLinks, affixLines, titleCaseLines, reverseLines, numberLines, trimLinesAdvanced, normalizeObjectQuotes, stripAffixes, propertiesToJson, jsonToProperties, maskSensitiveText, joinLinesWithDelimiter, splitTextToLines, extractInitials, stripMarkdownFormatting, shuffleLines, reverseText, romanToArabic, arabicToRoman, padLines, convertChineseVariant, compactBlankLines, countWordFrequency, surroundEachLine, extractExecutiveSummary, convertIndentation, sumNumericLines, extractRepeatedPhrases, extractColumnFromLines, pluralizeText, transposeMatrixText, expandEnglishContractions, convertColorFormat, humanizeIdentifier, slugifyText, setOperationsOnLines, convertRadix, stripAffixWords, sortLinesByColumn, extractKvValue, formatByRegexGroups, indentLines, outdentLines, validateFormat, filterMarkdownTable, swapLineParts, parsePathParts, deduplicateWithCount, normalizeSmartQuotes, interleaveLines, convertObjectKeysCase, formatUnitSpacing, filterCharacterSet, generateNanoId, toggleLineComments, renderSimpleTemplate, checkBracketsBalance, normalizePunctuationAdaptive, obfuscateText, wrapTextLines, shiftMarkdownHeadings, ensureLineAffixes, regexReplaceMultiline, detectCodeLanguage, scrambleText, compactRepeatedCharacters, calculateTaskProgress, sliceLinesByPattern, formatNumberGrouping, shiftMarkdownBlockquotes, calculateChecksum, alignDelimitedColumns, stripCodeComments, groupLinesByPattern, normalizeHorizontalRules, alignMarkdownTableColumns, padOrTruncate, sanitizeLineEndingsAndSpaces, convertIdentifierNamingStyle, generateNumericSequence, markdownTableToDelimited, convertListStyle, generateShortHash, filterTaskItems, filterLinesByAffix, generateRandomColor, renumberOrderedList, convertMarkdownLinks, truncateByBytes, formatPunctuationSpacing, markdownTableToKeyValue, extractChinesePinyinInitials, normalizeBlankLinesStrict, keyValueToMarkdownTable, generateMarkdownToc, setMarkdownCodeFenceLang, escapeMacroPipe, formatTextColumnsGrid, sortMarkdownList, repeatText, sortLinesByVisualWidth, invertTaskStatus, centerText, convertListDelimiter, normalizeMarkdownFootnotes, escapeBackslash, chunkLinesByDelimiter, flattenMarkdownBlockquotes, reverseWords, stripInlineMarkdownFormatting, formatKpiSummaryCard, generateRandomName, groupLinesByAlphabet, measureVisualWidth, shiftListIndentation, flattenNestedList, maskTextRange, formatCJKSpacingComprehensive, convertNumberSymbols, extractCodeBlocksFromMarkdown, convertHeadingsToList, filterNumericRangeLines, numberMarkdownHeadings, formatTaskProgressBar, transposeMarkdownTable, beautifyMarkdownTable, queryJsonPath, formatMarkdownCallout} from "../model/clipboard-cleaner";
import {autoParameterizeText} from "../model/template-wizard";
import {transformCase} from "../model/placeholders";
import {escapeHtml} from "../model/clipboard";
import {matchProfilePreset} from "../model/storage";

const TYPE_BADGES: Partial<Record<ItemType, string>> = {
    text: "TXT", markdown: "MD", url: "URL", code: "CODE",
    image: "IMG", asset: "FILE", blockref: "REF", structure: "BLK",
};

export interface VariableFillOptions {
    t: (key: string, ...args: string[]) => string;
    itemType: ItemType;
    title: string;
    fields: AskField[];
    /** 字段初值预填表（字段名 -> 预填值，由记忆表提供，ADR 0074） */
    defaults?: Record<string, string>;
    /** 全局常驻名片池 / 身份档案（CAND-016 / TODO-FEAT-015） */
    profilePresets?: Record<string, string>;
    /** 模板原始内容（用于交互式实时展开预览，G24 / ADR 0076） */
    templateText?: string;
    itemId?: string;
    /** 用户预存的参数预设方案字典（方案名 -> 字段值对） */
    presets?: Record<string, Record<string, string>>;
    onSavePreset?: (name: string, fills: Record<string, string>) => void;
    onDeletePreset?: (name: string) => void;
    /** 确认：收集到的填充值（键=字段名；空值字段已由展开层兜底为 __名称__） */
    onConfirm: (fills: Record<string, string>) => void;
    /** 复制：将展开结果直接写入剪贴板并关闭（便于跨窗口粘贴，G49） */
    onCopy?: (fills: Record<string, string>) => void;
    /** 取消/关闭回调（缺省仅销毁） */
    onCancel?: () => void;
}

/**
 * 纯函数：根据当前已收集填充值渲染实时展开预览文本（G24 / ADR 0076）
 * 自动剥离光标标记，纯文本防 XSS，支持超长安全截断
 */
export function renderLivePreviewText(templateText: string, fills: Record<string, string>, maxChars = 1000): string {
    if (!templateText) return "";
    const expanded = stripCursorToken(expandAsks(templateText, fills));
    if (expanded.length > maxChars) {
        return expanded.slice(0, maxChars) + "…";
    }
    return expanded;
}

export function openVariableFillCard(options: VariableFillOptions): void {
    const t = options.t;
    let liveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
    let container: HTMLElement | null = null;

    // 移动端虚拟键盘避让（window.visualViewport 动态抬升，防遮挡按钮）
    const handleViewport = () => {
        if (!container || typeof window === "undefined" || !window.visualViewport) return;
        const offset = Math.max(0, window.innerHeight - window.visualViewport.height);
        container.style.paddingBottom = offset > 0 ? `${offset + 12}px` : "";
    };

    const isMobileModal = isMobileDialogViewport();
    const dialog = new Dialog({
        title: t("varFormTitle"),
        content: "",
        width: isMobileModal ? "100vw" : "min(440px, 92vw)",
        height: "auto",
        // 所有关闭路径（Esc/scrim）统一走 onCancel：上层搜索弹窗焦点回归（R128）；
        // 按钮确认/取消已自行结算，不在此重复触发（R138 结算语义）
        destroyCallback: () => {
            if (liveDebounceTimer) {
                clearTimeout(liveDebounceTimer);
                liveDebounceTimer = null;
            }
            if (typeof window !== "undefined" && window.visualViewport) {
                window.visualViewport.removeEventListener("resize", handleViewport);
                window.visualViewport.removeEventListener("scroll", handleViewport);
            }
            if (!settled) options.onCancel?.();
        },
    });
    // 原型屏 4：紧凑卡形态，卡头（徽标+标题+Esc 取消）即标题，隐藏宿主标题栏
    container = dialog.element.querySelector(".b3-dialog__container") as HTMLElement | null;
    if (container) {
        container.classList.add("xlc-varform-host");
        if (isMobileModal) container.classList.add("xlc-mobile-modal");
    }

    if (typeof window !== "undefined" && window.visualViewport) {
        window.visualViewport.addEventListener("resize", handleViewport);
        window.visualViewport.addEventListener("scroll", handleViewport);
    }

    const body = getDialogBody(dialog.element);
    if (!body) return;
    body.innerHTML = "";
    const root = document.createElement("div");
    root.className = "xlc-varform";

    // 头部：类型徽标 + 条目标题 + Esc 提示
    const head = document.createElement("div");
    head.className = "xlc-varform-head";
    head.setAttribute("role", "toolbar");
    head.setAttribute("aria-label", "变量卡标题栏");
    const badge = document.createElement("span");
    badge.className = "xlc-badge xlc-badge--markdown";
    badge.textContent = TYPE_BADGES[options.itemType] ?? "TXT";
    head.appendChild(badge);
    const title = document.createElement("span");
    title.className = "xlc-varform-title";
    title.textContent = options.title || t("unknownType");
    head.appendChild(title);
    const escHint = document.createElement("span");
    escHint.className = "xlc-kbd";
    escHint.textContent = "Esc " + t("cancel");
    head.appendChild(escHint);
    const headCloseBtn = document.createElement("button");
    headCloseBtn.type = "button";
    headCloseBtn.className = "xlc-varform-close xlc-dialog-close-btn";
    headCloseBtn.dataset.xlcControl = "variable.close";
    headCloseBtn.textContent = "✕";
    headCloseBtn.title = t("cancel") || "关闭";
    headCloseBtn.setAttribute("aria-label", t("cancel") || "关闭");
    headCloseBtn.addEventListener("click", () => cancelBtn.click());
    head.appendChild(headCloseBtn);
    root.appendChild(head);

    const sub = document.createElement("div");
    sub.className = "xlc-varform-sub";
    sub.textContent = t("varFormSub", String(options.fields.length));
    root.appendChild(sub);

    // 字段区：text→input / select→input+datalist（↑↓ 选择，保键盘一致） / date→input[type=date]
    // textarea→textarea（R160：Enter=换行，插入走按钮/Tab；其余 Enter=插入）
    // wrap 用 label 元素：点字段任意处聚焦输入框，读屏器可朗读字段名（R115）
    // 字段独立成滚动区（R162）：字段多/textarea 高时只滚字段，插入/取消按钮常驻可见
    const inputs: Array<HTMLInputElement | HTMLTextAreaElement> = [];
    const fieldsWrap = document.createElement("div");
    fieldsWrap.className = "xlc-varform-fields";
    fieldsWrap.tabIndex = 0;
    fieldsWrap.setAttribute("role", "region");
    fieldsWrap.setAttribute("aria-label", "变量输入表单");
    for (const [fieldIndex, field] of options.fields.entries()) {
        const wrap = document.createElement("label");
        wrap.className = "xlc-varform-field";
        const inputId = `xlc-var-input-${fieldIndex}`;
        wrap.htmlFor = inputId;
        const label = document.createElement("span");
        label.className = "xlc-varform-label";
        label.textContent = field.name;
        const tag = document.createElement("span");
        tag.className = "xlc-varform-tag";
        tag.textContent = askFieldTag(field);
        label.appendChild(tag);
        wrap.appendChild(label);
        const input = field.kind === "textarea"
            ? document.createElement("textarea")
            : document.createElement("input");
        input.id = inputId;
        input.setAttribute("aria-label", `${field.name} (${askFieldTag(field)})`);
        input.className = "b3-text-field";
        if (field.kind === "textarea") {
            (input as HTMLTextAreaElement).rows = 3;
            (input as HTMLTextAreaElement).setAttribute("spellcheck", "false");
        } else {
            input.setAttribute("enterkeyhint", "done");
        }
        if (field.kind === "date") (input as HTMLInputElement).type = "date";
        if (field.kind === "text" && (
            /(?:数量|金额|数目|次数|年龄|端口|序号|编号|价格|比例|count|num|amount|price|port|index|age|qty)/i.test(field.name) ||
            /^(?:\d+|\d+\.\d+)$/.test(field.defaultValue || "")
        )) {
            (input as HTMLInputElement).type = "number";
            input.setAttribute("inputmode", "numeric");
        }
        if (field.kind === "select") {
            // datalist id 按索引起：字段名安全化后可能碰撞（如「a,b」与「a：b」），错绑候选列表（R138）
            input.setAttribute("list", `xlc-varform-list-${fieldIndex}`);
            const datalist = document.createElement("datalist");
            datalist.id = `xlc-varform-list-${fieldIndex}`;
            for (const opt of field.options) {
                const option = document.createElement("option");
                option.value = opt;
                datalist.appendChild(option);
            }
            wrap.appendChild(datalist);
        }
        input.dataset.xlcVarField = field.name;
        // 初值预填逻辑（ADR 0074）：记忆值优先，次之全局名片池档案（CAND-016 / TODO-FEAT-015），最后回退至模板声明的 defaultValue
        const memoryValue = options.defaults ? options.defaults[field.name] : undefined;
        const profileValue = matchProfilePreset(field.name, options.profilePresets);
        if (memoryValue !== undefined && memoryValue.length > 0) {
            input.value = memoryValue;
        } else if (profileValue !== undefined && profileValue.length > 0) {
            input.value = profileValue;
        } else if (field.defaultValue) {
            input.value = field.defaultValue;
        }

        // 全局个人档案命中指示徽章（CAND-016 / TODO-FEAT-015）
        if ((!memoryValue || !memoryValue.trim()) && profileValue && profileValue.trim() && field.kind !== "toggle" && field.kind !== "multi") {
            const profileBadge = document.createElement("span");
            profileBadge.className = "xlc-varform-profile-badge";
            profileBadge.dataset.xlcControl = `varform.profile.${fieldIndex}`;
            profileBadge.title = `已从全局常用档案预填「${profileValue}」`;
            profileBadge.setAttribute("aria-label", `已从全局常用档案预填「${profileValue}」`);
            profileBadge.innerHTML = `<span class="xlc-profile-prefix" aria-hidden="true">👤 档案</span>`;
            label.appendChild(profileBadge);
        }

        // 变量最近输入值极速点填胶囊（CAND-002 / TODO-FEAT-002）
        if (memoryValue && memoryValue.trim() && field.kind !== "toggle" && field.kind !== "multi") {
            const recentChip = document.createElement("button");
            recentChip.type = "button";
            recentChip.className = "xlc-varform-recent-chip";
            recentChip.dataset.xlcControl = `varform.recent.${fieldIndex}`;
            recentChip.title = `点击填入上次使用值: ${memoryValue}`;
            if (typeof recentChip.setAttribute === "function") {
                recentChip.setAttribute("aria-label", `上次使用值: ${memoryValue}`);
            }
            const displayVal = memoryValue.length > 12 ? `${memoryValue.slice(0, 12)}…` : memoryValue;
            const safeRecentVal = escapeHtml(displayVal);
            recentChip.innerHTML = `<span class="xlc-recent-prefix" aria-hidden="true">⏱ 上次:</span> <span class="xlc-recent-val">${safeRecentVal}</span>`;
            recentChip.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                input.value = memoryValue;
                input.dispatchEvent(new Event("input", {bubbles: true}));
                input.dispatchEvent(new Event("change", {bubbles: true}));
                input.focus();
            });
            label.appendChild(recentChip);
        }
        wrap.appendChild(input);

        if (field.kind === "toggle") {
            input.style.display = "none";
            const toggleRow = document.createElement("div");
            toggleRow.className = "xlc-varform-toggle-row";
            const toggleSwitch = document.createElement("input");
            toggleSwitch.type = "checkbox";
            toggleSwitch.className = "b3-switch xlc-varform-toggle";
            const defaultVal = field.defaultValue || "是";
            toggleSwitch.checked = Boolean(input.value && input.value !== "否" && input.value !== "false" && input.value !== "0");
            const toggleHint = document.createElement("span");
            toggleHint.className = "xlc-form-hint";
            toggleHint.textContent = toggleSwitch.checked ? `包含：${defaultVal}` : "关闭：不包含此内容";
            toggleSwitch.addEventListener("change", () => {
                input.value = toggleSwitch.checked ? defaultVal : "";
                toggleHint.textContent = toggleSwitch.checked ? `包含：${defaultVal}` : "关闭：不包含此内容";
                input.dispatchEvent(new Event("input", {bubbles: true}));
                input.dispatchEvent(new Event("change", {bubbles: true}));
            });
            toggleRow.append(toggleSwitch, toggleHint);
            wrap.appendChild(toggleRow);
        }

        if (field.kind === "multi") {
            input.style.display = "none";
            const multiWrap = document.createElement("div");
            multiWrap.className = "xlc-varform-multi-options";
            const currentSelected = new Set(
                (input.value ? input.value.split(/[,，、]/) : (field.defaultValue ? field.defaultValue.split(/[,，、]/) : []))
                    .map((s) => s.trim())
                    .filter(Boolean)
            );
            input.value = Array.from(currentSelected).join("、");

            const updateMultiVal = () => {
                input.value = Array.from(currentSelected).join("、");
                input.dispatchEvent(new Event("input", {bubbles: true}));
                input.dispatchEvent(new Event("change", {bubbles: true}));
            };

            for (const opt of field.options) {
                const optBtn = document.createElement("button");
                optBtn.type = "button";
                const isSelected = currentSelected.has(opt);
                optBtn.className = "xlc-multi-option-pill" + (isSelected ? " xlc-multi-option-pill--selected" : "");
                optBtn.textContent = opt;
                optBtn.title = `点击切换选中 "${opt}"`;
                optBtn.setAttribute("aria-label", optBtn.title);
                optBtn.setAttribute("aria-pressed", isSelected ? "true" : "false");
                optBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    if (currentSelected.has(opt)) {
                        currentSelected.delete(opt);
                        optBtn.classList.remove("xlc-multi-option-pill--selected");
                        optBtn.setAttribute("aria-pressed", "false");
                    } else {
                        currentSelected.add(opt);
                        optBtn.classList.add("xlc-multi-option-pill--selected");
                        optBtn.setAttribute("aria-pressed", "true");
                    }
                    updateMultiVal();
                });
                multiWrap.appendChild(optBtn);
            }
            wrap.appendChild(multiWrap);
        }

        // 快捷候选项胶囊行（快速单点填充并联动实时预览，对标移动端与参考图交互 · G45）
        const candidateOptions = new Set<string>();
        if (field.kind !== "multi" && field.options && Array.isArray(field.options)) {
            for (const opt of field.options) {
                if (opt && opt.trim()) candidateOptions.add(opt.trim());
            }
        }
        if (field.defaultValue && field.defaultValue.trim()) {
            candidateOptions.add(field.defaultValue.trim());
        }
        if (candidateOptions.size > 0) {
            const pillsWrap = document.createElement("div");
            pillsWrap.className = "xlc-varform-quick-options";
            pillsWrap.setAttribute("role", "toolbar");
            pillsWrap.setAttribute("aria-label", "快捷候选项");
            pillsWrap.addEventListener("keydown", (e: any) => {
                if (e.isComposing || e.keyCode === 229) return;
                if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                    const btns = Array.from(pillsWrap.querySelectorAll<HTMLButtonElement>("button.xlc-quick-option-pill"));
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
                    const btns = Array.from(pillsWrap.querySelectorAll<HTMLButtonElement>("button.xlc-quick-option-pill"));
                    if (!btns.length) return;
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.key === "Home") btns[0]?.focus();
                    else btns[btns.length - 1]?.focus();
                }
            });
            const syncPills = () => {
                pillsWrap.querySelectorAll<HTMLElement>(".xlc-quick-option-pill").forEach((pill) => {
                    const isPicked = pill.textContent === input.value;
                    pill.classList.toggle("xlc-quick-option-pill--selected", isPicked);
                    pill.setAttribute("aria-pressed", isPicked ? "true" : "false");
                });
            };
            for (const opt of Array.from(candidateOptions).slice(0, 8)) {
                const optBtn = document.createElement("button");
                optBtn.type = "button";
                const isPicked = input.value === opt;
                optBtn.className = "xlc-quick-option-pill" + (isPicked ? " xlc-quick-option-pill--selected" : "");
                optBtn.textContent = opt;
                optBtn.title = `点击填入 "${opt}"`;
                optBtn.setAttribute("aria-label", optBtn.title);
                optBtn.setAttribute("aria-pressed", isPicked ? "true" : "false");
                optBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    input.value = opt;
                    input.dispatchEvent(new Event("input", {bubbles: true}));
                    input.dispatchEvent(new Event("change", {bubbles: true}));
                    input.focus();
                });
                pillsWrap.appendChild(optBtn);
            }
            input.addEventListener("input", syncPills);
            input.addEventListener("change", syncPills);
            wrap.appendChild(pillsWrap);
        }

        inputs.push(input);
        fieldsWrap.appendChild(wrap);
    }
    root.appendChild(fieldsWrap);

    const collect = (): Record<string, string> => {
        const fills: Record<string, string> = {};
        for (const input of inputs) {
            const name = input.dataset.xlcVarField ?? "";
            if (name) fills[name] = input.value;
        }
        return fills;
    };

    let previewBox: HTMLElement | null = null;

    if (options.templateText) {
        const previewWrap = document.createElement("div");
        previewWrap.className = "xlc-varform-preview-wrap";

        const previewHead = document.createElement("div");
        previewHead.className = "xlc-varform-preview-head";
        previewHead.textContent = "🔍 实时展开预览：";

        previewBox = document.createElement("div");
        previewBox.className = "xlc-varform-preview";
        previewBox.tabIndex = 0;
        previewBox.setAttribute("role", "region");
        previewBox.setAttribute("aria-label", "实时展开预览");

        previewWrap.append(previewHead, previewBox);
        root.appendChild(previewWrap);

        const updatePreview = () => {
            if (!previewBox || !options.templateText) return;
            const text = renderLivePreviewText(options.templateText, collect());
            previewBox.textContent = text;
        };

        const scheduleLiveUpdate = () => {
            if (liveDebounceTimer) clearTimeout(liveDebounceTimer);
            liveDebounceTimer = setTimeout(updatePreview, 30);
        };

        // 初始预览渲染
        updatePreview();

        for (const input of inputs) {
            input.addEventListener("input", scheduleLiveUpdate);
            input.addEventListener("change", scheduleLiveUpdate);
        }
    }

    // 预设方案管理栏（Presets / Form Profiles）
    const presetSchemes: Record<string, Record<string, string>> = {...(options.presets || {})};
    const presetWrap = document.createElement("div");
    presetWrap.className = "xlc-varform-preset-wrap";
    presetWrap.setAttribute("role", "toolbar");
    presetWrap.setAttribute("aria-label", "预设方案操作栏");
    presetWrap.addEventListener("keydown", (e: any) => {
        if (e.isComposing || e.keyCode === 229) return;
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            const btns = Array.from(presetWrap.querySelectorAll<HTMLElement>("select, button"));
            if (!btns.length) return;
            const idx = btns.indexOf(document.activeElement as HTMLElement);
            if (idx === -1) return;
            e.preventDefault();
            e.stopPropagation();
            const nextIdx = e.key === "ArrowRight" ? (idx + 1) % btns.length : (idx - 1 + btns.length) % btns.length;
            btns[nextIdx]?.focus();
            return;
        }
        if (e.key === "Home" || e.key === "End") {
            const btns = Array.from(presetWrap.querySelectorAll<HTMLElement>("select, button"));
            if (!btns.length) return;
            e.preventDefault();
            e.stopPropagation();
            if (e.key === "Home") btns[0]?.focus();
            else btns[btns.length - 1]?.focus();
        }
    });
    presetWrap.style.display = "flex";
    presetWrap.style.alignItems = "center";
    presetWrap.style.gap = "8px";
    presetWrap.style.margin = "8px 0";
    presetWrap.style.fontSize = "12px";

    const presetLabel = document.createElement("span");
    presetLabel.className = "xlc-form-hint";
    presetLabel.textContent = "📋 预设方案：";
    presetWrap.appendChild(presetLabel);

    const presetSelect = document.createElement("select");
    presetSelect.className = "b3-select";
    presetSelect.style.flex = "1";
    presetSelect.style.fontSize = "12px";
    presetSelect.dataset.xlcControl = "variable.preset-select";
    presetSelect.setAttribute("aria-label", "预设方案选择");

    const defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = "-- 选择预设方案 --";
    presetSelect.appendChild(defaultOpt);

    const syncPresetOptions = () => {
        presetSelect.innerHTML = "";
        presetSelect.appendChild(defaultOpt);
        for (const name of Object.keys(presetSchemes)) {
            const opt = document.createElement("option");
            opt.value = name;
            opt.textContent = name;
            presetSelect.appendChild(opt);
        }
    };
    syncPresetOptions();

    presetSelect.addEventListener("change", () => {
        const selectedScheme = presetSelect.value;
        if (!selectedScheme || !presetSchemes[selectedScheme]) return;
        const schemeFills = presetSchemes[selectedScheme];
        for (const input of inputs) {
            const name = input.dataset.xlcVarField ?? "";
            if (name && schemeFills[name] !== undefined) {
                input.value = schemeFills[name]!;
                input.dispatchEvent(new Event("input", {bubbles: true}));
                input.dispatchEvent(new Event("change", {bubbles: true}));
            }
        }
    });
    presetWrap.appendChild(presetSelect);

    const savePresetBtn = document.createElement("button");
    savePresetBtn.type = "button";
    savePresetBtn.className = "b3-button b3-button--text";
    savePresetBtn.style.fontSize = "12px";
    savePresetBtn.textContent = "💾 存为预设";
    savePresetBtn.setAttribute("aria-label", "存为预设方案");
    savePresetBtn.dataset.xlcControl = "variable.save-preset";
    savePresetBtn.addEventListener("click", () => {
        openTextPromptDialog({
            title: "存为预设方案",
            label: "请输入此套参数预设的名称（如：客户A专票）：",
            defaultValue: `方案 ${Object.keys(presetSchemes).length + 1}`,
            maxLength: 32,
            controlId: "variable.save-preset.input",
            onConfirm: (name) => {
                const cleanName = name.trim().slice(0, 32);
                if (!cleanName) return;
                const currentFills = collect();
                presetSchemes[cleanName] = currentFills;
                syncPresetOptions();
                presetSelect.value = cleanName;
                options.onSavePreset?.(cleanName, currentFills);
            },
        });
    });
    presetWrap.appendChild(savePresetBtn);

    const deletePresetBtn = document.createElement("button");
    deletePresetBtn.type = "button";
    deletePresetBtn.className = "b3-button b3-button--text";
    deletePresetBtn.style.fontSize = "12px";
    deletePresetBtn.textContent = "🗑";
    deletePresetBtn.title = "删除当前选中的预设方案";
    deletePresetBtn.setAttribute("aria-label", deletePresetBtn.title);
    deletePresetBtn.dataset.xlcControl = "variable.delete-preset";
    deletePresetBtn.addEventListener("click", () => {
        const selectedScheme = presetSelect.value;
        if (!selectedScheme || !presetSchemes[selectedScheme]) return;
        delete presetSchemes[selectedScheme];
        syncPresetOptions();
        presetSelect.value = "";
        options.onDeletePreset?.(selectedScheme);
    });
    presetWrap.appendChild(deletePresetBtn);

    root.appendChild(presetWrap);

    const foot = document.createElement("div");
    foot.className = "xlc-varform-foot";
    foot.setAttribute("role", "toolbar");
    foot.setAttribute("aria-label", "变量卡操作栏");
    foot.addEventListener("keydown", (e: any) => {
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
    const kbdHint = document.createElement("span");
    kbdHint.className = "xlc-varform-hint";
    // 含 textarea 字段时 Enter 语义变化（R160）：提示行如实告知，不沿用「Enter 插入」
    kbdHint.textContent = options.fields.some((f) => f.kind === "textarea") ? t("varFormHintMultiline") : t("varFormHint");
    foot.appendChild(kbdHint);
    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "b3-button";
    cancelBtn.dataset.xlcControl = "variable.cancel";
    cancelBtn.textContent = t("cancel");
    cancelBtn.setAttribute("aria-label", t("cancel"));
    foot.appendChild(cancelBtn);

    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "b3-button xlc-btn-ghost";
    resetBtn.dataset.xlcControl = "variable.reset-defaults";
    resetBtn.textContent = "↺ " + (t("resetDefaults") || "恢复默认");
    resetBtn.title = "清空当前输入，恢复所有字段到模板初始默认值";
    resetBtn.setAttribute("aria-label", resetBtn.title);
    resetBtn.addEventListener("click", () => {
        for (const input of inputs) {
            const name = input.dataset.xlcVarField ?? "";
            const field = options.fields.find((f) => f.name === name);
            input.value = field?.defaultValue ?? "";
            input.dispatchEvent(new Event("input", {bubbles: true}));
            input.dispatchEvent(new Event("change", {bubbles: true}));
        }
    });
    foot.appendChild(resetBtn);

    if (options.onCopy) {
        const copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.className = "b3-button xlc-btn-ghost";
        copyBtn.dataset.xlcControl = "variable.copy";
        copyBtn.textContent = "⧉ " + (t("copy") || "复制");
        copyBtn.title = "将填入变量后的展开结果复制到剪贴板并关闭 (Alt+C)";
        copyBtn.setAttribute("aria-label", copyBtn.title);
        copyBtn.addEventListener("click", () => {
            if (liveDebounceTimer) clearTimeout(liveDebounceTimer);
            if (settled) return;
            settled = true;
            dialog.destroy();
            options.onCopy?.(collect());
        });
        foot.appendChild(copyBtn);
    }

    const insertBtn = document.createElement("button");
    insertBtn.type = "button";
    insertBtn.className = "b3-button xlc-btn-primary";
    insertBtn.textContent = t("insert");
    insertBtn.setAttribute("aria-label", t("insert"));
    foot.appendChild(insertBtn);
    root.appendChild(foot);

    body.appendChild(root);

    // 结算语义（R138）：按钮确认/取消即「已结算」；未结算时的销毁（Esc/点遮罩）才视为取消。
    // 修复：此前确认路径也会先触发 onCancel、点取消会触发两次（destroyCallback + 显式调用）。
    let settled = false;
    const confirm = (): void => {
        if (liveDebounceTimer) clearTimeout(liveDebounceTimer);
        if (settled) return;
        settled = true;
        dialog.destroy();
        options.onConfirm(collect());
    };
    insertBtn.addEventListener("click", confirm);
    cancelBtn.addEventListener("click", () => {
        if (liveDebounceTimer) clearTimeout(liveDebounceTimer);
        if (settled) return;
        settled = true;
        dialog.destroy();
        options.onCancel?.();
    });
    // Enter=插入（焦点在输入框时）；焦点在按钮上时由原生激活该按钮（取消=取消）
    root.addEventListener("keydown", (ev) => {
        // IME 组合态（中文组词候选未上屏）：Enter 属选词，不得触发插入（对齐 dialog.ts 惯例，R138）
        if (ev.isComposing || (ev as KeyboardEvent).keyCode === 229) return;
        if (ev.key === "Escape") {
            ev.preventDefault();
            ev.stopPropagation();
            if (liveDebounceTimer) {
                clearTimeout(liveDebounceTimer);
                liveDebounceTimer = null;
            }
            if (settled) return;
            settled = true;
            dialog.destroy();
            options.onCancel?.();
            return;
        }
        // Ctrl+Enter / Cmd+Enter: 在任何输入控件/多行文本中直接快速确认提交 (G46)
        if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) {
            if (ev.repeat) return;
            ev.preventDefault();
            confirm();
            return;
        }
        // Alt+C / Ctrl+Shift+C: 快捷复制展开结果并关闭 (G49)
        if ((ev.altKey && (ev.key === "c" || ev.key === "C")) || (ev.ctrlKey && ev.shiftKey && (ev.key === "C" || ev.key === "c"))) {
            if (options.onCopy) {
                if (ev.repeat) return;
                ev.preventDefault();
                if (liveDebounceTimer) {
                    clearTimeout(liveDebounceTimer);
                    liveDebounceTimer = null;
                }
                if (settled) return;
                settled = true;
                dialog.destroy();
                options.onCopy(collect());
                return;
            }
        }
        if (ev.key === "Enter" && !ev.altKey && !ev.ctrlKey && !ev.metaKey) {
            if (ev.repeat) return;
            if ((ev.target as HTMLElement).tagName === "BUTTON") return;
            // textarea 字段（R160）：Enter=换行，插入只走按钮或 Tab 到按钮后回车
            if ((ev.target as HTMLElement).tagName === "TEXTAREA") return;
            const el = ev.target as HTMLInputElement;
            if (el instanceof HTMLInputElement && el.list) {
                // datalist 高亮项：先让浏览器提交选中值，下一拍再收集（否则采到旧值，R138）
                setTimeout(() => confirm(), 0);
                return;
            }
            ev.preventDefault();
            confirm();
            return;
        }
        if (ev.key === "Tab") {
            const focusables = Array.from(
                root.querySelectorAll<HTMLElement>("input, textarea, select, button"),
            ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
            if (focusables.length === 0) return;
            const index = focusables.indexOf(document.activeElement as HTMLElement);
            ev.preventDefault();
            const next = ev.shiftKey
                ? (index - 1 + focusables.length) % focusables.length
                : (index + 1) % focusables.length;
            focusables[next]?.focus();
        }
    });
    inputs[0]?.focus();
}

/** 变量快捷插入条（F1 创作侧，原型屏 3）：点选在目标 textarea 光标处插入变量语法。捕获与编辑弹窗共用。 */
export function buildVariableBar(t: (key: string, ...args: string[]) => string, getTarget: () => HTMLTextAreaElement): HTMLElement {
    const bar = document.createElement("div");
    bar.className = "xlc-varbar";
    bar.setAttribute("role", "toolbar");
    bar.setAttribute("aria-label", t("insertVariable"));
    bar.addEventListener("keydown", (e) => {
        if (e.isComposing || e.keyCode === 229) return;
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            const btns = Array.from(bar.querySelectorAll<HTMLButtonElement>("button")).filter((b) => !b.hidden && !b.closest("[hidden]"));
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
            const btns = Array.from(bar.querySelectorAll<HTMLButtonElement>("button")).filter((b) => !b.hidden && !b.closest("[hidden]"));
            if (!btns.length) return;
            e.preventDefault();
            e.stopPropagation();
            if (e.key === "Home") btns[0]?.focus();
            else btns[btns.length - 1]?.focus();
        }
    });
    const cap = document.createElement("span");
    cap.className = "xlc-varbar-cap";
    cap.textContent = t("insertVariable");
    bar.appendChild(cap);
    const snippets = [
        {id: "ask", text: "{{xlc:ask:字段}}"},
        {id: "ask.options", text: "{{xlc:ask:字段|选项A,选项B}}"},
        {id: "ask.textarea", text: "{{xlc:ask:字段|textarea}}"},
        {id: "ask.multi", text: "{{xlc:ask:字段|选项A,选项B,选项C|multi}}"},
        {id: "ask.toggle", text: "{{xlc:ask:字段=默认内容|toggle}}"},
        {id: "case.camel", text: "{{xlc:case:camel|字段}}"},
        {id: "case.snake", text: "{{xlc:case:snake|字段}}"},
        {id: "selection", text: "{{xlc:selection}}"},
        {id: "snippet", text: "{{xlc:snippet:标题}}"},
        {id: "cursor", text: "{{xlc:cursor}}"},
        {id: "date", text: "{{xlc:date}}"},
        {id: "year", text: "{{xlc:year}}"},
        {id: "quarter", text: "{{xlc:quarter}}"},
        {id: "date.tomorrow", text: "{{xlc:date:明天}}"},
        {id: "date.nextweek", text: "{{xlc:date:下周一}}"},
        {id: "date.offset", text: "{{xlc:date|+3d}}"},
        {id: "week", text: "{{xlc:week}}"},
        {id: "timestamp", text: "{{xlc:timestamp}}"},
        {id: "calc", text: "{{xlc:calc:100*1.13}}"},
        {id: "count", text: "{{xlc:count:chars|文本}}"},
        {id: "hash", text: "{{xlc:hash|文本}}"},
        {id: "number", text: "{{xlc:number:lines|文本}}"},
        {id: "truncate", text: "{{xlc:truncate|30|文本}}"},
        {id: "mask", text: "{{xlc:mask|phone|手机号}}"},
        {id: "currency", text: "{{xlc:currency|1234.56}}"},
        {id: "filesize", text: "{{xlc:filesize|1048576}}"},
        {id: "reverse", text: "{{xlc:reverse|文本}}"},
        {id: "cron", text: "{{xlc:cron|0 30 9 * * 1-5}}"},
        {id: "timeago", text: "{{xlc:timeago|1761624000}}"},
        {id: "summary", text: "{{xlc:summary|100|文本}}"},
        {id: "lunar", text: "{{xlc:lunar:year}}"},
        {id: "choose", text: "{{xlc:choose|VIP:70,普通:30}}"},
        {id: "words.en", text: "{{xlc:words:en|42}}"},
        {id: "color.rgb", text: "{{xlc:color:rgb|#336699}}"},
        {id: "stats", text: "{{xlc:stats|10,20,30,40,50}}"},
        {id: "radix.hex", text: "{{xlc:radix:hex|255}}"},
        {id: "radix.bin", text: "{{xlc:radix:bin|42}}"},
        {id: "kv", text: "{{xlc:kv:key|key=value}}"},
        {id: "match", text: "{{xlc:match|(\\d+)|[$1]|123}}"},
        {id: "valid.email", text: "{{xlc:valid:email|test@example.com}}"},
        {id: "valid.phone", text: "{{xlc:valid:phone|13800000000}}"},
        {id: "path.name", text: "{{xlc:path:filename}}"},
        {id: "path.ext", text: "{{xlc:path:ext}}"},
        {id: "nanoid", text: "{{xlc:nanoid|12}}"},
        {id: "template", text: "{{xlc:template|你好 {name}|name=张三}}"},
        {id: "obfuscate", text: "{{xlc:obfuscate|rot13|Hello}}"},
        {id: "scramble", text: "{{xlc:scramble|words|one two three}}"},
        {id: "thousands", text: "{{xlc:thousands|1234567.89}}"},
        {id: "checksum", text: "{{xlc:checksum|hello}}"},
        {id: "pad", text: "{{xlc:pad|10|hello}}"},
        {id: "seq", text: "{{xlc:seq|1|10}}"},
        {id: "fingerprint", text: "{{xlc:fingerprint|hello}}"},
        {id: "randomcolor", text: "{{xlc:randomcolor}}"},
        {id: "btruncate", text: "{{xlc:btruncate|100|长文本}}"},
        {id: "initials", text: "{{xlc:initials|思源笔记}}"},
        {id: "plural", text: "{{xlc:plural|item|2}}"},
        {id: "escape", text: "{{xlc:escape|hello|world}}"},
        {id: "repeat", text: "{{xlc:repeat|=|20}}"},
        {id: "center", text: "{{xlc:center|20|标题}}"},
        {id: "slash", text: "{{xlc:slash|C:\\\\Users}}"},
        {id: "revwords", text: "{{xlc:revwords|the quick brown fox}}"},
        {id: "randomname", text: "{{xlc:randomname}}"},
        {id: "if", text: "{{xlc:if|1 > 0|真|假}}"},
        {id: "smask", text: "{{xlc:smask|keep|1234567890|2|2}}"},
        {id: "censor", text: "{{xlc:censor|文本|敏感词|***}}"},
        {id: "shuffle", text: "{{xlc:shuffle|A,B,C}}"},
        {id: "progress", text: "{{xlc:progress|7|10}}"},
        {id: "json", text: "{{xlc:json|key|JSON}}"},
        {id: "regex.mreplace", text: "{{xlc:regex:mreplace|^(\\s*)|// |文本}}"},
        {id: "password", text: "{{xlc:password|16}}"},
        {id: "url-enc", text: "{{xlc:url:encode|https://siyuan-note.com}}"},
        {id: "base64", text: "{{xlc:base64:encode|Hello}}"},
        {id: "random", text: "{{xlc:random|选项A,选项B}}"},
        {id: "greeting", text: "{{xlc:greeting}}"},
        {id: "doc", text: "{{xlc:doc}}"},
        {id: "clipboard", text: "{{xlc:clipboard}}"},
    ];
    for (const snippet of snippets) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "xlc-varbtn";
        btn.dataset.xlcControl = `capture.variable.${snippet.id}`;
        btn.textContent = snippet.text;
        btn.setAttribute("aria-label", `插入宏变量: ${snippet.text}`);
        btn.title = `点击插入 ${snippet.text}`;
        btn.addEventListener("click", () => {
            const el = getTarget();
            const start = el.selectionStart ?? el.value.length;
            const end = el.selectionEnd ?? start;
            el.value = el.value.slice(0, start) + snippet.text + el.value.slice(end);
            const caret = start + snippet.text.length;
            el.focus();
            el.setSelectionRange(caret, caret);
            // 编程赋值不触发 input 事件：派发一次，清除表单的必填红描边等监听态（R138）
            el.dispatchEvent(new Event("input", {bubbles: true}));
        });
        bar.appendChild(btn);
    }

    // 常用格式净化与转换快捷动作
    const panguBtn = document.createElement("button");
    panguBtn.type = "button";
    panguBtn.className = "xlc-varbtn xlc-btn-ghost";
    panguBtn.dataset.xlcControl = "capture.format.pangu";
    panguBtn.textContent = "✦ 盘古排版";
    panguBtn.title = "在中英文与数字间自动插入规范空格，清洗全角标点空格";
    panguBtn.addEventListener("click", () => {
        const el = getTarget();
        const pangu = formatPanguSpacing(el.value);
        if (pangu.spacedCount > 0) {
            el.value = pangu.result;
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(panguBtn);

    const tableBtn = document.createElement("button");
    tableBtn.type = "button";
    tableBtn.className = "xlc-varbtn xlc-btn-ghost";
    tableBtn.dataset.xlcControl = "capture.format.tsv-table";
    tableBtn.textContent = "⊞ 转MD表格";
    tableBtn.title = "将剪贴板或文本中的制表符表格 (TSV) 一键转换为标准 Markdown 表格";
    tableBtn.addEventListener("click", () => {
        const el = getTarget();
        const table = tsvToMarkdownTable(el.value);
        if (table) {
            el.value = table.result;
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(tableBtn);

    const cleanUrlBtn = document.createElement("button");
    cleanUrlBtn.type = "button";
    cleanUrlBtn.className = "xlc-varbtn xlc-btn-ghost";
    cleanUrlBtn.dataset.xlcControl = "capture.format.clean-url";
    cleanUrlBtn.textContent = "✦ 净URL";
    cleanUrlBtn.title = "自动剔除 URL 后的追踪分析参数 (utm_*, spm_id_from, share_token 等)";
    cleanUrlBtn.addEventListener("click", () => {
        const el = getTarget();
        const cleaned = stripUrlTrackingParams(el.value);
        if (cleaned.cleanedCount > 0) {
            el.value = cleaned.result;
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(cleanUrlBtn);

    const listBtn = document.createElement("button");
    listBtn.type = "button";
    listBtn.className = "xlc-varbtn xlc-btn-ghost";
    listBtn.dataset.xlcControl = "capture.format.norm-list";
    listBtn.textContent = "✦ 规整列表";
    listBtn.title = "将 1、/ 1. / (1) / ① / - 等混合列表一键重构为标准 Markdown 有序列表";
    listBtn.addEventListener("click", () => {
        const el = getTarget();
        const formatted = normalizeListFormatting(el.value, "markdown-ol");
        if (formatted.convertedCount > 0) {
            el.value = formatted.result;
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(listBtn);

    const punctBtn = document.createElement("button");
    punctBtn.type = "button";
    punctBtn.className = "xlc-varbtn xlc-btn-ghost";
    punctBtn.dataset.xlcControl = "capture.format.norm-punct";
    punctBtn.textContent = "✦ 标点规整";
    punctBtn.title = "将中文语境下的英文逗号、句号、问叹号与冒号一键规整为全角标点，跳过小数与URL";
    punctBtn.addEventListener("click", () => {
        const el = getTarget();
        const res = normalizePunctuation(el.value, "to-cjk");
        if (res.convertedCount > 0) {
            el.value = res.result;
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(punctBtn);

    const paramBtn = document.createElement("button");
    paramBtn.type = "button";
    paramBtn.className = "xlc-varbtn xlc-btn-ghost";
    paramBtn.dataset.xlcControl = "capture.format.auto-params";
    paramBtn.textContent = "✦ 变量推导";
    paramBtn.title = "智能侦测日期、称呼、金额、手机、邮箱等槽位，一键转换为动态常用语模板";
    paramBtn.addEventListener("click", () => {
        const el = getTarget();
        const paramRes = autoParameterizeText(el.value);
        if (paramRes.suggestedCount > 0) {
            el.value = paramRes.result;
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(paramBtn);

    const dedupeBtn = document.createElement("button");
    dedupeBtn.type = "button";
    dedupeBtn.className = "xlc-varbtn xlc-btn-ghost";
    dedupeBtn.dataset.xlcControl = "capture.format.dedupe-lines";
    dedupeBtn.textContent = "✦ 行去重";
    dedupeBtn.title = "对多行文本顺序去重，剔除重复行并保留首次出现的相对顺序";
    dedupeBtn.addEventListener("click", () => {
        const el = getTarget();
        const res = deduplicateLines(el.value);
        if (res.removedCount > 0) {
            el.value = res.result;
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(dedupeBtn);

    const compactBtn = document.createElement("button");
    compactBtn.type = "button";
    compactBtn.className = "xlc-varbtn xlc-btn-ghost";
    compactBtn.dataset.xlcControl = "capture.format.compact-lines";
    compactBtn.textContent = "✦ 净空行";
    compactBtn.title = "清除每行行首行尾多余空白，并将多重连续空行压缩为一个空行";
    compactBtn.addEventListener("click", () => {
        const el = getTarget();
        const res = compactWhitespaceAndLines(el.value, true);
        if (res.trimmedLines > 0 || res.result !== el.value) {
            el.value = res.result;
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(compactBtn);

    const applyCaseTransform = (style: "camel" | "snake") => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const transformed = transformCase(targetText, style);
        if (transformed && transformed !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + transformed + el.value.slice(end);
                el.setSelectionRange(start, start + transformed.length);
            } else {
                el.value = transformed;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    };

    const camelBtn = document.createElement("button");
    camelBtn.type = "button";
    camelBtn.className = "xlc-varbtn xlc-btn-ghost";
    camelBtn.dataset.xlcControl = "capture.format.camel-case";
    camelBtn.textContent = "✦ 转驼峰";
    camelBtn.title = "将选中文本或全文转换为驼峰命名 (camelCase)";
    camelBtn.addEventListener("click", () => applyCaseTransform("camel"));
    bar.appendChild(camelBtn);

    const snakeBtn = document.createElement("button");
    snakeBtn.type = "button";
    snakeBtn.className = "xlc-varbtn xlc-btn-ghost";
    snakeBtn.dataset.xlcControl = "capture.format.snake-case";
    snakeBtn.textContent = "✦ 转下划线";
    snakeBtn.title = "将选中文本或全文转换为下划线命名 (snake_case)";
    snakeBtn.addEventListener("click", () => applyCaseTransform("snake"));
    bar.appendChild(snakeBtn);

    const halfWidthBtn = document.createElement("button");
    halfWidthBtn.type = "button";
    halfWidthBtn.className = "xlc-varbtn xlc-btn-ghost";
    halfWidthBtn.dataset.xlcControl = "capture.format.to-half-width";
    halfWidthBtn.textContent = "✦ 全角转半角";
    halfWidthBtn.title = "将全角字母数字与标点一键转为标准半角字符 (如 １２３→123)";
    halfWidthBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = convertWidth(targetText, "to-half");
        if (res.convertedCount > 0) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res.result + el.value.slice(end);
                el.setSelectionRange(start, start + res.result.length);
            } else {
                el.value = res.result;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(halfWidthBtn);

    const urlEncBtn = document.createElement("button");
    urlEncBtn.type = "button";
    urlEncBtn.className = "xlc-varbtn xlc-btn-ghost";
    urlEncBtn.dataset.xlcControl = "capture.format.url-encode";
    urlEncBtn.textContent = "✦ URL编码";
    urlEncBtn.title = "对选中文本或全文执行 URL 组件编码 (encodeURIComponent)";
    urlEncBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        if (!targetText) return;
        const encoded = encodeUrlText(targetText, true);
        if (encoded !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + encoded + el.value.slice(end);
                el.setSelectionRange(start, start + encoded.length);
            } else {
                el.value = encoded;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(urlEncBtn);

    const base64Btn = document.createElement("button");
    base64Btn.type = "button";
    base64Btn.className = "xlc-varbtn xlc-btn-ghost";
    base64Btn.dataset.xlcControl = "capture.format.base64-encode";
    base64Btn.textContent = "✦ Base64";
    base64Btn.title = "对选中文本或全文执行 UTF-8 安全 Base64 编码";
    base64Btn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        if (!targetText) return;
        const encoded = encodeBase64(targetText);
        if (encoded) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + encoded + el.value.slice(end);
                el.setSelectionRange(start, start + encoded.length);
            } else {
                el.value = encoded;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(base64Btn);

    const quoteWrapBtn = document.createElement("button");
    quoteWrapBtn.type = "button";
    quoteWrapBtn.className = "xlc-varbtn xlc-btn-ghost";
    quoteWrapBtn.dataset.xlcControl = "capture.format.quote-wrap";
    quoteWrapBtn.textContent = "✦ 引用包裹";
    quoteWrapBtn.title = "在选中文本或每行前切换 Markdown 引用前缀 (>)";
    quoteWrapBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        if (!targetText) return;
        const toggled = toggleMarkdownBlockquote(targetText);
        if (toggled.result !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + toggled.result + el.value.slice(end);
                el.setSelectionRange(start, start + toggled.result.length);
            } else {
                el.value = toggled.result;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(quoteWrapBtn);

    const fmtTableBtn = document.createElement("button");
    fmtTableBtn.type = "button";
    fmtTableBtn.className = "xlc-varbtn xlc-btn-ghost";
    fmtTableBtn.dataset.xlcControl = "capture.format.fmt-table";
    fmtTableBtn.textContent = "✦ 表格对齐";
    fmtTableBtn.title = "规整 Markdown 表格，自适应对齐各列宽度与分隔线";
    fmtTableBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = formatMarkdownTable(targetText);
        if (res.isTable) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res.result + el.value.slice(end);
                el.setSelectionRange(start, start + res.result.length);
            } else {
                el.value = res.result;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(fmtTableBtn);

    const escapeHtmlBtn = document.createElement("button");
    escapeHtmlBtn.type = "button";
    escapeHtmlBtn.className = "xlc-varbtn xlc-btn-ghost";
    escapeHtmlBtn.dataset.xlcControl = "capture.format.escape-html";
    escapeHtmlBtn.textContent = "✦ 转义HTML";
    escapeHtmlBtn.title = "将选中文本或全文中的 <, >, &, \", ' 转义为标准 HTML 实体";
    escapeHtmlBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = escapeHtmlEntities(targetText);
        if (res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(escapeHtmlBtn);

    const unescapeHtmlBtn = document.createElement("button");
    unescapeHtmlBtn.type = "button";
    unescapeHtmlBtn.className = "xlc-varbtn xlc-btn-ghost";
    unescapeHtmlBtn.dataset.xlcControl = "capture.format.unescape-html";
    unescapeHtmlBtn.textContent = "✦ 还原HTML";
    unescapeHtmlBtn.title = "将 &lt;, &gt;, &amp;, &quot; 等 HTML 实体还原为可读字符";
    unescapeHtmlBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = unescapeHtmlEntities(targetText);
        if (res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(unescapeHtmlBtn);

    const csvJsonBtn = document.createElement("button");
    csvJsonBtn.type = "button";
    csvJsonBtn.className = "xlc-varbtn xlc-btn-ghost";
    csvJsonBtn.dataset.xlcControl = "capture.format.csv-json";
    csvJsonBtn.textContent = "✦ 表格转JSON";
    csvJsonBtn.title = "将 CSV/TSV 表格文本一键转换为标准结构化 JSON 数组";
    csvJsonBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = csvToJson(targetText);
        if (res.ok) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res.result + el.value.slice(end);
                el.setSelectionRange(start, start + res.result.length);
            } else {
                el.value = res.result;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(csvJsonBtn);

    const resetTasksBtn = document.createElement("button");
    resetTasksBtn.type = "button";
    resetTasksBtn.className = "xlc-varbtn xlc-btn-ghost";
    resetTasksBtn.dataset.xlcControl = "capture.format.reset-tasks";
    resetTasksBtn.textContent = "✦ 重置待办";
    resetTasksBtn.title = "将选中文本或全文中的 Markdown 待办项全部重置为未完成 (- [ ])";
    resetTasksBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = toggleMarkdownTaskStatus(targetText, "uncheck-all");
        if (res.changedCount > 0) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res.result + el.value.slice(end);
                el.setSelectionRange(start, start + res.result.length);
            } else {
                el.value = res.result;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(resetTasksBtn);

    const extractLinksBtn = document.createElement("button");
    extractLinksBtn.type = "button";
    extractLinksBtn.className = "xlc-varbtn xlc-btn-ghost";
    extractLinksBtn.dataset.xlcControl = "capture.format.extract-links";
    extractLinksBtn.textContent = "✦ 提链接";
    extractLinksBtn.title = "提取选中文本或全文中的全部 Markdown 链接与 URL 为列表";
    extractLinksBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = extractMarkdownLinks(targetText, {outputFormat: "list"});
        if (res.count > 0) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res.result + el.value.slice(end);
                el.setSelectionRange(start, start + res.result.length);
            } else {
                el.value = res.result;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(extractLinksBtn);

    const affixLinesBtn = document.createElement("button");
    affixLinesBtn.type = "button";
    affixLinesBtn.className = "xlc-varbtn xlc-btn-ghost";
    affixLinesBtn.dataset.xlcControl = "capture.format.affix-lines";
    affixLinesBtn.textContent = "✦ 加列表行";
    affixLinesBtn.title = "为选中文本或全文的多行批量添加列表项前缀 (- )";
    affixLinesBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = affixLines(targetText, {prefix: "- ", ignoreEmpty: true});
        if (res.changedCount > 0) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res.result + el.value.slice(end);
                el.setSelectionRange(start, start + res.result.length);
            } else {
                el.value = res.result;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(affixLinesBtn);

    const titleCaseBtn = document.createElement("button");
    titleCaseBtn.type = "button";
    titleCaseBtn.className = "xlc-varbtn xlc-btn-ghost";
    titleCaseBtn.dataset.xlcControl = "capture.format.title-case";
    titleCaseBtn.textContent = "✦ 英文标题";
    titleCaseBtn.title = "将选中文本或全文转换为英文标题大小写规范 (Title Case)";
    titleCaseBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = titleCaseLines(targetText, {style: "title"});
        if (res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(titleCaseBtn);

    const reverseLinesBtn = document.createElement("button");
    reverseLinesBtn.type = "button";
    reverseLinesBtn.className = "xlc-varbtn xlc-btn-ghost";
    reverseLinesBtn.dataset.xlcControl = "capture.format.reverse-lines";
    reverseLinesBtn.textContent = "✦ 多行倒序";
    reverseLinesBtn.title = "将选中文本或全文的多行行顺序完全反转倒序";
    reverseLinesBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = reverseLines(targetText);
        if (res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(reverseLinesBtn);

    const numberLinesBtn = document.createElement("button");
    numberLinesBtn.type = "button";
    numberLinesBtn.className = "xlc-varbtn xlc-btn-ghost";
    numberLinesBtn.dataset.xlcControl = "capture.format.number-lines";
    numberLinesBtn.textContent = "✦ 批量编号";
    numberLinesBtn.title = "为选中文本或全文的多行文本批量添加数字序号 (1. 2. )";
    numberLinesBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = numberLines(targetText, {format: "decimal", ignoreEmpty: true});
        if (res.numberedCount > 0) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res.result + el.value.slice(end);
                el.setSelectionRange(start, start + res.result.length);
            } else {
                el.value = res.result;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(numberLinesBtn);

    const trimAdvBtn = document.createElement("button");
    trimAdvBtn.type = "button";
    trimAdvBtn.className = "xlc-varbtn xlc-btn-ghost";
    trimAdvBtn.dataset.xlcControl = "capture.format.trim-advanced";
    trimAdvBtn.textContent = "✦ 净首尾";
    trimAdvBtn.title = "修剪整篇文本首尾多余空行并清理每行行尾空格";
    trimAdvBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = trimLinesAdvanced(targetText);
        if (res.hasChanges) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res.result + el.value.slice(end);
                el.setSelectionRange(start, start + res.result.length);
            } else {
                el.value = res.result;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(trimAdvBtn);

    const quoteJsonBtn = document.createElement("button");
    quoteJsonBtn.type = "button";
    quoteJsonBtn.className = "xlc-varbtn xlc-btn-ghost";
    quoteJsonBtn.dataset.xlcControl = "capture.format.quote-json";
    quoteJsonBtn.textContent = "✦ 转JSON键";
    quoteJsonBtn.title = "将 JS/Python 对象属性名与单引号字符串标准化为标准 JSON 双引号";
    quoteJsonBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = normalizeObjectQuotes(targetText, "to-json");
        if (res.convertedCount > 0) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res.result + el.value.slice(end);
                el.setSelectionRange(start, start + res.result.length);
            } else {
                el.value = res.result;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(quoteJsonBtn);

    const stripAffixesBtn = document.createElement("button");
    stripAffixesBtn.type = "button";
    stripAffixesBtn.className = "xlc-varbtn xlc-btn-ghost";
    stripAffixesBtn.dataset.xlcControl = "capture.format.strip-affixes";
    stripAffixesBtn.textContent = "✦ 剥前后缀";
    stripAffixesBtn.title = "剥离选中文本或全文多行的列表项 (- / * / 1. ) 与引用标记 (>)";
    stripAffixesBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = stripAffixes(targetText, {prefix: "list"});
        if (res.strippedCount > 0) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res.result + el.value.slice(end);
                el.setSelectionRange(start, start + res.result.length);
            } else {
                el.value = res.result;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(stripAffixesBtn);

    const propsJsonBtn = document.createElement("button");
    propsJsonBtn.type = "button";
    propsJsonBtn.className = "xlc-varbtn xlc-btn-ghost";
    propsJsonBtn.dataset.xlcControl = "capture.format.props-json";
    propsJsonBtn.textContent = "✦ 键值转JSON";
    propsJsonBtn.title = "将 Properties 键值对文本 (key=value 或 key: value) 转换为标准 JSON";
    propsJsonBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = propertiesToJson(targetText);
        if (res.ok && res.count > 0) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res.result + el.value.slice(end);
                el.setSelectionRange(start, start + res.result.length);
            } else {
                el.value = res.result;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(propsJsonBtn);

    const jsonPropsBtn = document.createElement("button");
    jsonPropsBtn.type = "button";
    jsonPropsBtn.className = "xlc-varbtn xlc-btn-ghost";
    jsonPropsBtn.dataset.xlcControl = "capture.format.json-props";
    jsonPropsBtn.textContent = "✦ JSON转键值";
    jsonPropsBtn.title = "将 JSON 对象字符串转换为 Properties (key=value) 键值对文本";
    jsonPropsBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = jsonToProperties(targetText);
        if (res.ok && res.count > 0) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res.result + el.value.slice(end);
                el.setSelectionRange(start, start + res.result.length);
            } else {
                el.value = res.result;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(jsonPropsBtn);

    const maskTextBtn = document.createElement("button");
    maskTextBtn.type = "button";
    maskTextBtn.className = "xlc-varbtn xlc-btn-ghost";
    maskTextBtn.dataset.xlcControl = "capture.format.mask-text";
    maskTextBtn.textContent = "✦ 敏感脱敏";
    maskTextBtn.title = "自动对选中文本或全文中的手机号、身份证、邮箱进行掩码脱敏";
    maskTextBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = maskSensitiveText(targetText, "auto");
        if (res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(maskTextBtn);

    const joinLinesBtn = document.createElement("button");
    joinLinesBtn.type = "button";
    joinLinesBtn.className = "xlc-varbtn xlc-btn-ghost";
    joinLinesBtn.dataset.xlcControl = "capture.format.join-lines";
    joinLinesBtn.textContent = "✦ 连成单行";
    joinLinesBtn.title = "将选中文本或全文的多行文本合并为逗号分隔的单行文本";
    joinLinesBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = joinLinesWithDelimiter(targetText, ", ");
        if (res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(joinLinesBtn);

    const splitLinesBtn = document.createElement("button");
    splitLinesBtn.type = "button";
    splitLinesBtn.className = "xlc-varbtn xlc-btn-ghost";
    splitLinesBtn.dataset.xlcControl = "capture.format.split-lines";
    splitLinesBtn.textContent = "✦ 拆为多行";
    splitLinesBtn.title = "将以逗号、分号或竖线分隔的单行文本拆分为多行";
    splitLinesBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = splitTextToLines(targetText);
        if (res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(splitLinesBtn);

    const initialsBtn = document.createElement("button");
    initialsBtn.type = "button";
    initialsBtn.className = "xlc-varbtn xlc-btn-ghost";
    initialsBtn.dataset.xlcControl = "capture.format.extract-initials";
    initialsBtn.textContent = "✦ 提首字母";
    initialsBtn.title = "提取选中文本或词组的首字母大写缩写 (如 Central Processing Unit -> CPU)";
    initialsBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = extractInitials(targetText);
        if (res) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(initialsBtn);

    const stripMdBtn = document.createElement("button");
    stripMdBtn.type = "button";
    stripMdBtn.className = "xlc-varbtn xlc-btn-ghost";
    stripMdBtn.dataset.xlcControl = "capture.format.strip-markdown";
    stripMdBtn.textContent = "✦ 纯文本";
    stripMdBtn.title = "剥离选中文本或全文中的粗体、代码、链接、标题等 Markdown 标记";
    stripMdBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = stripMarkdownFormatting(targetText);
        if (res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(stripMdBtn);

    const shuffleBtn = document.createElement("button");
    shuffleBtn.type = "button";
    shuffleBtn.className = "xlc-varbtn xlc-btn-ghost";
    shuffleBtn.dataset.xlcControl = "capture.format.shuffle-lines";
    shuffleBtn.textContent = "✦ 随机打乱";
    shuffleBtn.title = "对选中文本或全文多行进行公平随机洗牌打乱顺序";
    shuffleBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = shuffleLines(targetText);
        if (res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(shuffleBtn);

    const reverseTextBtn = document.createElement("button");
    reverseTextBtn.type = "button";
    reverseTextBtn.className = "xlc-varbtn xlc-btn-ghost";
    reverseTextBtn.dataset.xlcControl = "capture.format.reverse-text";
    reverseTextBtn.textContent = "✦ 字符反转";
    reverseTextBtn.title = "将选中文本或全文进行纯字符字面逆序反转 (Unicode/Emoji安全)";
    reverseTextBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = reverseText(targetText);
        if (res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(reverseTextBtn);

    const romanBtn = document.createElement("button");
    romanBtn.type = "button";
    romanBtn.className = "xlc-varbtn xlc-btn-ghost";
    romanBtn.dataset.xlcControl = "capture.format.roman-num";
    romanBtn.textContent = "✦ 罗马数字";
    romanBtn.title = "在罗马数字与阿拉伯数字之间双向转换 (如 XIV <-> 14)";
    romanBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = (hasSel ? el.value.slice(start, end) : el.value).trim();
        let resStr = "";
        if (/^[IVXLCDM]+$/i.test(targetText)) {
            const num = romanToArabic(targetText);
            if (num !== null) resStr = String(num);
        } else if (/^\d{1,4}$/.test(targetText)) {
            const roman = arabicToRoman(Number(targetText));
            if (roman) resStr = roman;
        }

        if (resStr && resStr !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + resStr + el.value.slice(end);
                el.setSelectionRange(start, start + resStr.length);
            } else {
                el.value = resStr;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(romanBtn);

    const padLinesBtn = document.createElement("button");
    padLinesBtn.type = "button";
    padLinesBtn.className = "xlc-varbtn xlc-btn-ghost";
    padLinesBtn.dataset.xlcControl = "capture.format.pad-lines";
    padLinesBtn.textContent = "✦ 等宽对齐";
    padLinesBtn.title = "多行文本等宽左对齐排版，自动依据最长行对齐填充空格";
    padLinesBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = padLines(targetText, {align: "left"});
        if (res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(padLinesBtn);

    const s2tBtn = document.createElement("button");
    s2tBtn.type = "button";
    s2tBtn.className = "xlc-varbtn xlc-btn-ghost";
    s2tBtn.dataset.xlcControl = "capture.format.s2t";
    s2tBtn.textContent = "✦ 简转繁";
    s2tBtn.title = "将选中文本或全文常用汉字转换为繁体中文";
    s2tBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = convertChineseVariant(targetText, "s2t");
        if (res.convertedCount > 0) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res.result + el.value.slice(end);
                el.setSelectionRange(start, start + res.result.length);
            } else {
                el.value = res.result;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(s2tBtn);

    const t2sBtn = document.createElement("button");
    t2sBtn.type = "button";
    t2sBtn.className = "xlc-varbtn xlc-btn-ghost";
    t2sBtn.dataset.xlcControl = "capture.format.t2s";
    t2sBtn.textContent = "✦ 繁转简";
    t2sBtn.title = "将选中文本或全文常用汉字转换为简体中文";
    t2sBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = convertChineseVariant(targetText, "t2s");
        if (res.convertedCount > 0) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res.result + el.value.slice(end);
                el.setSelectionRange(start, start + res.result.length);
            } else {
                el.value = res.result;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(t2sBtn);

    const compactBlankBtn = document.createElement("button");
    compactBlankBtn.type = "button";
    compactBlankBtn.className = "xlc-varbtn xlc-btn-ghost";
    compactBlankBtn.dataset.xlcControl = "capture.format.compact-blank";
    compactBlankBtn.textContent = "✦ 压空行";
    compactBlankBtn.title = "将选中文本或全文多行中连续的多行空行压缩为单行空行";
    compactBlankBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = compactBlankLines(targetText, {maxConsecutive: 1});
        if (res.collapsedCount > 0) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res.result + el.value.slice(end);
                el.setSelectionRange(start, start + res.result.length);
            } else {
                el.value = res.result;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(compactBlankBtn);

    const wordFreqBtn = document.createElement("button");
    wordFreqBtn.type = "button";
    wordFreqBtn.className = "xlc-varbtn xlc-btn-ghost";
    wordFreqBtn.dataset.xlcControl = "capture.format.word-freq";
    wordFreqBtn.textContent = "✦ 词频统计";
    wordFreqBtn.title = "统计选中文本或全文中的高频词出现次数与占比分布";
    wordFreqBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = countWordFrequency(targetText, {topN: 5, ignoreStopWords: true});
        if (res.items.length > 0) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res.result + el.value.slice(end);
                el.setSelectionRange(start, start + res.result.length);
            } else {
                el.value = res.result;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(wordFreqBtn);

    const surroundBtn = document.createElement("button");
    surroundBtn.type = "button";
    surroundBtn.className = "xlc-varbtn xlc-btn-ghost";
    surroundBtn.dataset.xlcControl = "capture.format.surround-lines";
    surroundBtn.textContent = "✦ 双边包裹";
    surroundBtn.title = "为选中文本或全文多行的每一行双边添加引号包裹";
    surroundBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = surroundEachLine(targetText, '"');
        if (res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(surroundBtn);

    const summaryBtn = document.createElement("button");
    summaryBtn.type = "button";
    summaryBtn.className = "xlc-varbtn xlc-btn-ghost";
    summaryBtn.dataset.xlcControl = "capture.format.extract-summary";
    summaryBtn.textContent = "✦ 提精要";
    summaryBtn.title = "提炼文本首个有效核心段落并生成精简摘要 (100字)";
    summaryBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = extractExecutiveSummary(targetText, 100);
        if (res) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(summaryBtn);

    const indentTabsBtn = document.createElement("button");
    indentTabsBtn.type = "button";
    indentTabsBtn.className = "xlc-varbtn xlc-btn-ghost";
    indentTabsBtn.dataset.xlcControl = "capture.format.indent-tabs";
    indentTabsBtn.textContent = "✦ 空格转Tab";
    indentTabsBtn.title = "将选中文本或全文行首的 4 空格缩进转换为制表符 Tab";
    indentTabsBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = convertIndentation(targetText, "spaces-to-tabs", 4);
        if (res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(indentTabsBtn);

    const sumNumericBtn = document.createElement("button");
    sumNumericBtn.type = "button";
    sumNumericBtn.className = "xlc-varbtn xlc-btn-ghost";
    sumNumericBtn.dataset.xlcControl = "capture.format.sum-lines";
    sumNumericBtn.textContent = "✦ 数值求和";
    sumNumericBtn.title = "自动提取选中文本或全文多行中的数值并计算求和、平均值与极值";
    sumNumericBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = sumNumericLines(targetText);
        if (res.count > 0) {
            const summaryLine = `\n${res.result}`;
            if (hasSel) {
                el.value = el.value.slice(0, start) + targetText + summaryLine + el.value.slice(end);
            } else {
                el.value = el.value + summaryLine;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(sumNumericBtn);

    const repPhrasesBtn = document.createElement("button");
    repPhrasesBtn.type = "button";
    repPhrasesBtn.className = "xlc-varbtn xlc-btn-ghost";
    repPhrasesBtn.dataset.xlcControl = "capture.format.repeated-phrases";
    repPhrasesBtn.textContent = "✦ 查重复词";
    repPhrasesBtn.title = "检测选中文本或全文中高频重复出现的 2~4 字词组短语";
    repPhrasesBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = extractRepeatedPhrases(targetText, {minCount: 2, minLength: 2, maxLength: 4});
        if (res.items.length > 0) {
            const report = `\n\n【重复词组检测结果】\n${res.result}`;
            if (hasSel) {
                el.value = el.value.slice(0, start) + targetText + report + el.value.slice(end);
            } else {
                el.value = el.value + report;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(repPhrasesBtn);

    const extractCol1Btn = document.createElement("button");
    extractCol1Btn.type = "button";
    extractCol1Btn.className = "xlc-varbtn xlc-btn-ghost";
    extractCol1Btn.dataset.xlcControl = "capture.format.extract-col1";
    extractCol1Btn.textContent = "✦ 提首列";
    extractCol1Btn.title = "提取选中文本或全文多行中的第 1 列数据";
    extractCol1Btn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = extractColumnFromLines(targetText, 1);
        if (res) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(extractCol1Btn);

    const extractCol2Btn = document.createElement("button");
    extractCol2Btn.type = "button";
    extractCol2Btn.className = "xlc-varbtn xlc-btn-ghost";
    extractCol2Btn.dataset.xlcControl = "capture.format.extract-col2";
    extractCol2Btn.textContent = "✦ 提次列";
    extractCol2Btn.title = "提取选中文本或全文多行中的第 2 列数据";
    extractCol2Btn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = extractColumnFromLines(targetText, 2);
        if (res) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(extractCol2Btn);

    const pluralBtn = document.createElement("button");
    pluralBtn.type = "button";
    pluralBtn.className = "xlc-varbtn xlc-btn-ghost";
    pluralBtn.dataset.xlcControl = "capture.format.pluralize";
    pluralBtn.textContent = "✦ 转复数";
    pluralBtn.title = "将选中文本或单词快速转换为英文复数形式";
    pluralBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = (hasSel ? el.value.slice(start, end) : el.value).trim();
        const res = pluralizeText(targetText, "plural");
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(pluralBtn);

    const transposeBtn = document.createElement("button");
    transposeBtn.type = "button";
    transposeBtn.className = "xlc-varbtn xlc-btn-ghost";
    transposeBtn.dataset.xlcControl = "capture.format.transpose";
    transposeBtn.textContent = "✦ 表格转置";
    transposeBtn.title = "多行多列表格行列互换转置 (横向转纵向/纵向转横向)";
    transposeBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = transposeMatrixText(targetText);
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(transposeBtn);

    const expandContractionsBtn = document.createElement("button");
    expandContractionsBtn.type = "button";
    expandContractionsBtn.className = "xlc-varbtn xlc-btn-ghost";
    expandContractionsBtn.dataset.xlcControl = "capture.format.expand-contractions";
    expandContractionsBtn.textContent = "✦ 展开缩写";
    expandContractionsBtn.title = "将英文日常缩写展开为正式公文形态 (如 don't -> do not, can't -> cannot)";
    expandContractionsBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = expandEnglishContractions(targetText);
        if (res.expandedCount > 0) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res.result + el.value.slice(end);
                el.setSelectionRange(start, start + res.result.length);
            } else {
                el.value = res.result;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(expandContractionsBtn);

    const colorRgbBtn = document.createElement("button");
    colorRgbBtn.type = "button";
    colorRgbBtn.className = "xlc-varbtn xlc-btn-ghost";
    colorRgbBtn.dataset.xlcControl = "capture.format.color-rgb";
    colorRgbBtn.textContent = "✦ 转RGB色";
    colorRgbBtn.title = "将选中文本中的十六进制 HEX 颜色 (#fff / #1E88E5) 转换为 rgb()";
    colorRgbBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = convertColorFormat(targetText, "rgb");
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(colorRgbBtn);

    const humanizeBtn = document.createElement("button");
    humanizeBtn.type = "button";
    humanizeBtn.className = "xlc-varbtn xlc-btn-ghost";
    humanizeBtn.dataset.xlcControl = "capture.format.humanize";
    humanizeBtn.textContent = "✦ 变短语";
    humanizeBtn.title = "将驼峰/下划线变量标识符 (如 getUserById) 转换为自然单词短语";
    humanizeBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = humanizeIdentifier(targetText);
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(humanizeBtn);

    const slugBtn = document.createElement("button");
    slugBtn.type = "button";
    slugBtn.className = "xlc-varbtn xlc-btn-ghost";
    slugBtn.dataset.xlcControl = "capture.format.slugify";
    slugBtn.textContent = "✦ 转Slug";
    slugBtn.title = "将选中文本或标题转换为 URL / Git 连字符安全别名 (Slug)";
    slugBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = slugifyText(targetText);
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(slugBtn);

    const setOpsBtn = document.createElement("button");
    setOpsBtn.type = "button";
    setOpsBtn.className = "xlc-varbtn xlc-btn-ghost";
    setOpsBtn.dataset.xlcControl = "capture.format.set-diff";
    setOpsBtn.textContent = "✦ 差集过滤";
    setOpsBtn.title = "对多行文本按 --- 分割的前后两段列表计算差集 A - B (在 A 中剔除 B)";
    setOpsBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        if (targetText.includes("---")) {
            const parts = targetText.split(/\n\s*---\s*\n/);
            if (parts.length >= 2) {
                const res = setOperationsOnLines(parts[0]!, parts[1]!, "difference");
                if (hasSel) {
                    el.value = el.value.slice(0, start) + res + el.value.slice(end);
                    el.setSelectionRange(start, start + res.length);
                } else {
                    el.value = res;
                }
                el.focus();
                el.dispatchEvent(new Event("input", {bubbles: true}));
            }
        }
    });
    bar.appendChild(setOpsBtn);

    const radixBtn = document.createElement("button");
    radixBtn.type = "button";
    radixBtn.className = "xlc-varbtn xlc-btn-ghost";
    radixBtn.dataset.xlcControl = "capture.format.radix-hex";
    radixBtn.textContent = "✦ 转十六进制";
    radixBtn.title = "将选中的十进制数字转换为十六进制 (如 255 -> 0xFF)";
    radixBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = (hasSel ? el.value.slice(start, end) : el.value).trim();
        if (/^\d+$/.test(targetText)) {
            const res = convertRadix(targetText, 10, 16, {prefix: true, uppercase: true});
            if (res) {
                if (hasSel) {
                    el.value = el.value.slice(0, start) + res + el.value.slice(end);
                    el.setSelectionRange(start, start + res.length);
                } else {
                    el.value = res;
                }
                el.focus();
                el.dispatchEvent(new Event("input", {bubbles: true}));
            }
        }
    });
    bar.appendChild(radixBtn);

    const stripAffixBtn = document.createElement("button");
    stripAffixBtn.type = "button";
    stripAffixBtn.className = "xlc-varbtn xlc-btn-ghost";
    stripAffixBtn.dataset.xlcControl = "capture.format.strip-affixes";
    stripAffixBtn.textContent = "✦ 剥离词缀";
    stripAffixBtn.title = "批量剥离常见代码词缀 (如 get_, is_, _id, Dto)";
    stripAffixBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = stripAffixWords(targetText, {
            prefix: /^(get_|set_|is_|has_)/i,
            suffix: /(_id|_ids|Dto|DTO|VO|Vo)$/,
        });
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(stripAffixBtn);

    const sortColBtn = document.createElement("button");
    sortColBtn.type = "button";
    sortColBtn.className = "xlc-varbtn xlc-btn-ghost";
    sortColBtn.dataset.xlcControl = "capture.format.sort-column";
    sortColBtn.textContent = "✦ 按列排序";
    sortColBtn.title = "对多列数据按第 1 列进行字母/拼音字典序排序";
    sortColBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const sorted = sortLinesByColumn(targetText, 1);
        if (sorted && sorted !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + sorted + el.value.slice(end);
                el.setSelectionRange(start, start + sorted.length);
            } else {
                el.value = sorted;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(sortColBtn);

    const kvBtn = document.createElement("button");
    kvBtn.type = "button";
    kvBtn.className = "xlc-varbtn xlc-btn-ghost";
    kvBtn.dataset.xlcControl = "capture.format.extract-kv";
    kvBtn.textContent = "✦ 提键值";
    kvBtn.title = "提取 URL 查询串中的参数为格式化键值对";
    kvBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        if (targetText.includes("=") || targetText.includes(":")) {
            const val = extractKvValue(targetText, "name") || extractKvValue(targetText, "id") || extractKvValue(targetText, "title");
            if (val) {
                if (hasSel) {
                    el.value = el.value.slice(0, start) + val + el.value.slice(end);
                    el.setSelectionRange(start, start + val.length);
                } else {
                    el.value = val;
                }
                el.focus();
                el.dispatchEvent(new Event("input", {bubbles: true}));
            }
        }
    });
    bar.appendChild(kvBtn);

    const regexMatchBtn = document.createElement("button");
    regexMatchBtn.type = "button";
    regexMatchBtn.className = "xlc-varbtn xlc-btn-ghost";
    regexMatchBtn.dataset.xlcControl = "capture.format.regex-match";
    regexMatchBtn.textContent = "✦ 正则重组";
    regexMatchBtn.title = "将日期 YYYY-MM-DD 快速重组为 YYYY年MM月DD日";
    regexMatchBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = formatByRegexGroups(targetText, /(\d{4})-(\d{2})-(\d{2})/, "$1年$2月$3日");
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(regexMatchBtn);

    const indentBtn = document.createElement("button");
    indentBtn.type = "button";
    indentBtn.className = "xlc-varbtn xlc-btn-ghost";
    indentBtn.dataset.xlcControl = "capture.format.indent-lines";
    indentBtn.textContent = "✦ 增缩进";
    indentBtn.title = "对多行文本整体增加 2 空格缩进";
    indentBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = indentLines(targetText, 2);
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(indentBtn);

    const outdentBtn = document.createElement("button");
    outdentBtn.type = "button";
    outdentBtn.className = "xlc-varbtn xlc-btn-ghost";
    outdentBtn.dataset.xlcControl = "capture.format.outdent-lines";
    outdentBtn.textContent = "✦ 减缩进";
    outdentBtn.title = "对多行文本整体反向减少 2 空格缩进";
    outdentBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = outdentLines(targetText, 2);
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(outdentBtn);

    const filterTableBtn = document.createElement("button");
    filterTableBtn.type = "button";
    filterTableBtn.className = "xlc-varbtn xlc-btn-ghost";
    filterTableBtn.dataset.xlcControl = "capture.format.filter-table";
    filterTableBtn.textContent = "✦ 表格筛选";
    filterTableBtn.title = "剔除 Markdown 表格中第 1 列为空值的行";
    filterTableBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        if (targetText.includes("|") && targetText.includes("\n")) {
            const res = filterMarkdownTable(targetText, 1, (v) => v.trim().length > 0);
            if (res && res !== targetText) {
                if (hasSel) {
                    el.value = el.value.slice(0, start) + res + el.value.slice(end);
                    el.setSelectionRange(start, start + res.length);
                } else {
                    el.value = res;
                }
                el.focus();
                el.dispatchEvent(new Event("input", {bubbles: true}));
            }
        }
    });
    bar.appendChild(filterTableBtn);

    const verifyFormatBtn = document.createElement("button");
    verifyFormatBtn.type = "button";
    verifyFormatBtn.className = "xlc-varbtn xlc-btn-ghost";
    verifyFormatBtn.dataset.xlcControl = "capture.format.verify-format";
    verifyFormatBtn.textContent = "✦ 校验格式";
    verifyFormatBtn.title = "校验选中文本是否为合法邮箱/手机号/URL并在控制台或属性反馈";
    verifyFormatBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = (hasSel ? el.value.slice(start, end) : el.value).trim();
        if (targetText) {
            const isEmail = validateFormat(targetText, "email");
            const isPhone = validateFormat(targetText, "phone");
            const isUrl = validateFormat(targetText, "url");
            const res = isEmail ? "email:valid" : (isPhone ? "phone:valid" : (isUrl ? "url:valid" : "invalid"));
            el.setAttribute("data-xlc-validated", res);
        }
    });
    bar.appendChild(verifyFormatBtn);

    const swapPartsBtn = document.createElement("button");
    swapPartsBtn.type = "button";
    swapPartsBtn.className = "xlc-varbtn xlc-btn-ghost";
    swapPartsBtn.dataset.xlcControl = "capture.format.swap-parts";
    swapPartsBtn.textContent = "✦ 对调前后";
    swapPartsBtn.title = "将多行按冒号/等号/逗号对调前后位置 (如 A: B -> B: A)";
    swapPartsBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = swapLineParts(targetText);
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(swapPartsBtn);

    const dedupeCountBtn = document.createElement("button");
    dedupeCountBtn.type = "button";
    dedupeCountBtn.className = "xlc-varbtn xlc-btn-ghost";
    dedupeCountBtn.dataset.xlcControl = "capture.format.dedupe-count";
    dedupeCountBtn.textContent = "✦ 频次去重";
    dedupeCountBtn.title = "多行文本去重并标注出现频次 (按频次降序)";
    dedupeCountBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = deduplicateWithCount(targetText);
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(dedupeCountBtn);

    const pathPartBtn = document.createElement("button");
    pathPartBtn.type = "button";
    pathPartBtn.className = "xlc-varbtn xlc-btn-ghost";
    pathPartBtn.dataset.xlcControl = "capture.format.path-part";
    pathPartBtn.textContent = "✦ 提取文件名";
    pathPartBtn.title = "从选中路径中提取文件名 (包含扩展名)";
    pathPartBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = (hasSel ? el.value.slice(start, end) : el.value).trim();
        if (targetText) {
            const parts = parsePathParts(targetText);
            const res = parts.filename;
            if (res && res !== targetText) {
                if (hasSel) {
                    el.value = el.value.slice(0, start) + res + el.value.slice(end);
                    el.setSelectionRange(start, start + res.length);
                } else {
                    el.value = res;
                }
                el.focus();
                el.dispatchEvent(new Event("input", {bubbles: true}));
            }
        }
    });
    bar.appendChild(pathPartBtn);

    const quotesBtn = document.createElement("button");
    quotesBtn.type = "button";
    quotesBtn.className = "xlc-varbtn xlc-btn-ghost";
    quotesBtn.dataset.xlcControl = "capture.format.smart-quotes";
    quotesBtn.textContent = "✦ 规整引号";
    quotesBtn.title = "将选中文本中的引号规范化为中文双弯引号 (“”)";
    quotesBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = normalizeSmartQuotes(targetText, "curly");
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(quotesBtn);

    const keysCaseBtn = document.createElement("button");
    keysCaseBtn.type = "button";
    keysCaseBtn.className = "xlc-varbtn xlc-btn-ghost";
    keysCaseBtn.dataset.xlcControl = "capture.format.keys-camel";
    keysCaseBtn.textContent = "✦ 键转驼峰";
    keysCaseBtn.title = "将 JSON 或键值对的属性键名批量转换为驼峰 (camelCase)";
    keysCaseBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = convertObjectKeysCase(targetText, "camel");
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(keysCaseBtn);

    const interleaveBtn = document.createElement("button");
    interleaveBtn.type = "button";
    interleaveBtn.className = "xlc-varbtn xlc-btn-ghost";
    interleaveBtn.dataset.xlcControl = "capture.format.interleave";
    interleaveBtn.textContent = "✦ 交替合并";
    interleaveBtn.title = "对多行文本按 --- 分割的前后两段列表穿插交替合并";
    interleaveBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        if (targetText.includes("---")) {
            const parts = targetText.split(/\n\s*---\s*\n/);
            if (parts.length >= 2) {
                const res = interleaveLines(parts[0]!, parts[1]!);
                if (hasSel) {
                    el.value = el.value.slice(0, start) + res + el.value.slice(end);
                    el.setSelectionRange(start, start + res.length);
                } else {
                    el.value = res;
                }
                el.focus();
                el.dispatchEvent(new Event("input", {bubbles: true}));
            }
        }
    });
    bar.appendChild(interleaveBtn);

    const unitSpacingBtn = document.createElement("button");
    unitSpacingBtn.type = "button";
    unitSpacingBtn.className = "xlc-varbtn xlc-btn-ghost";
    unitSpacingBtn.dataset.xlcControl = "capture.format.unit-spacing";
    unitSpacingBtn.textContent = "✦ 单位间距";
    unitSpacingBtn.title = "规范数字与常见度量单位 (MB/GB/kg/km/GHz) 之间的规范半角间距";
    unitSpacingBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = formatUnitSpacing(targetText);
        if (res.spacedCount > 0) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res.result + el.value.slice(end);
                el.setSelectionRange(start, start + res.result.length);
            } else {
                el.value = res.result;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(unitSpacingBtn);

    const alnumBtn = document.createElement("button");
    alnumBtn.type = "button";
    alnumBtn.className = "xlc-varbtn xlc-btn-ghost";
    alnumBtn.dataset.xlcControl = "capture.format.alnum-only";
    alnumBtn.textContent = "✦ 纯字母数字";
    alnumBtn.title = "剔除选中文本中的标点、特殊符号与汉字，仅保留字母与数字";
    alnumBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = filterCharacterSet(targetText, "alphanumeric-only");
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(alnumBtn);

    const chineseBtn = document.createElement("button");
    chineseBtn.type = "button";
    chineseBtn.className = "xlc-varbtn xlc-btn-ghost";
    chineseBtn.dataset.xlcControl = "capture.format.chinese-only";
    chineseBtn.textContent = "✦ 仅留汉字";
    chineseBtn.title = "仅提取选中文本中的纯中文字符";
    chineseBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = filterCharacterSet(targetText, "chinese-only");
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(chineseBtn);

    const nanoBtn = document.createElement("button");
    nanoBtn.type = "button";
    nanoBtn.className = "xlc-varbtn xlc-btn-ghost";
    nanoBtn.dataset.xlcControl = "capture.format.gen-nanoid";
    nanoBtn.textContent = "✦ 插入NanoID";
    nanoBtn.title = "在当前光标处生成并插入 10 位随机紧凑 NanoID";
    nanoBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? el.value.length;
        const end = el.selectionEnd ?? start;
        const id = generateNanoId(10);
        el.value = el.value.slice(0, start) + id + el.value.slice(end);
        el.setSelectionRange(start + id.length, start + id.length);
        el.focus();
        el.dispatchEvent(new Event("input", {bubbles: true}));
    });
    bar.appendChild(nanoBtn);

    const toggleCommentsBtn = document.createElement("button");
    toggleCommentsBtn.type = "button";
    toggleCommentsBtn.className = "xlc-varbtn xlc-btn-ghost";
    toggleCommentsBtn.dataset.xlcControl = "capture.format.toggle-comments";
    toggleCommentsBtn.textContent = "✦ 切换注释";
    toggleCommentsBtn.title = "对选中文本或全文多行批量添加/移除代码注释前缀 (// )";
    toggleCommentsBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = toggleLineComments(targetText, "// ");
        if (res.changedLines > 0) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res.result + el.value.slice(end);
                el.setSelectionRange(start, start + res.result.length);
            } else {
                el.value = res.result;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(toggleCommentsBtn);

    const checkBracketsBtn = document.createElement("button");
    checkBracketsBtn.type = "button";
    checkBracketsBtn.className = "xlc-varbtn xlc-btn-ghost";
    checkBracketsBtn.dataset.xlcControl = "capture.format.check-brackets";
    checkBracketsBtn.textContent = "✦ 检查括号";
    checkBracketsBtn.title = "校验文本中的中英文括号与标点是否成对闭合平衡";
    checkBracketsBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = checkBracketsBalance(targetText);
        el.setAttribute("data-xlc-brackets", res.isBalanced ? "balanced" : "unbalanced");
        el.title = res.isBalanced ? "✓ 括号配对完全闭合" : `⚠ ${res.errorSummary}`;
    });
    bar.appendChild(checkBracketsBtn);

    const renderTplBtn = document.createElement("button");
    renderTplBtn.type = "button";
    renderTplBtn.className = "xlc-varbtn xlc-btn-ghost";
    renderTplBtn.dataset.xlcControl = "capture.format.render-tpl";
    renderTplBtn.textContent = "✦ 渲染模板";
    renderTplBtn.title = "按 --- 分割渲染简单的变量插值模板 (前半段模板，后半段键值)";
    renderTplBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        if (targetText.includes("---")) {
            const [tpl, data] = targetText.split(/\n\s*---\s*\n/);
            const res = renderSimpleTemplate(tpl || "", data || "");
            if (res && res !== targetText) {
                if (hasSel) {
                    el.value = el.value.slice(0, start) + res + el.value.slice(end);
                    el.setSelectionRange(start, start + res.length);
                } else {
                    el.value = res;
                }
                el.focus();
                el.dispatchEvent(new Event("input", {bubbles: true}));
            }
        }
    });
    bar.appendChild(renderTplBtn);

    const adaptivePunctBtn = document.createElement("button");
    adaptivePunctBtn.type = "button";
    adaptivePunctBtn.className = "xlc-varbtn xlc-btn-ghost";
    adaptivePunctBtn.dataset.xlcControl = "capture.format.adaptive-punct";
    adaptivePunctBtn.textContent = "✦ 自适应标点";
    adaptivePunctBtn.title = "智能自适应纠错中英混排标点符号 (保护数字、URL与小数)";
    adaptivePunctBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = normalizePunctuationAdaptive(targetText);
        if (res.convertedCount > 0) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res.result + el.value.slice(end);
                el.setSelectionRange(start, start + res.result.length);
            } else {
                el.value = res.result;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(adaptivePunctBtn);

    const rot13Btn = document.createElement("button");
    rot13Btn.type = "button";
    rot13Btn.className = "xlc-varbtn xlc-btn-ghost";
    rot13Btn.dataset.xlcControl = "capture.format.rot13";
    rot13Btn.textContent = "✦ ROT13混淆";
    rot13Btn.title = "对选中文本执行 ROT13 对称可逆安全混淆/还原";
    rot13Btn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = obfuscateText(targetText, "rot13");
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(rot13Btn);

    const wrapLinesBtn = document.createElement("button");
    wrapLinesBtn.type = "button";
    wrapLinesBtn.className = "xlc-varbtn xlc-btn-ghost";
    wrapLinesBtn.dataset.xlcControl = "capture.format.wrap-lines";
    wrapLinesBtn.textContent = "✦ 宽度折行";
    wrapLinesBtn.title = "按 80 列宽度对超长文本行执行智能硬换行";
    wrapLinesBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = wrapTextLines(targetText, 80);
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(wrapLinesBtn);

    const shiftDownBtn = document.createElement("button");
    shiftDownBtn.type = "button";
    shiftDownBtn.className = "xlc-varbtn xlc-btn-ghost";
    shiftDownBtn.dataset.xlcControl = "capture.format.shift-down";
    shiftDownBtn.textContent = "✦ 标题降级";
    shiftDownBtn.title = "将选中文本中的 Markdown 标题整体降低一级 (如 H1->H2)";
    shiftDownBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = shiftMarkdownHeadings(targetText, 1);
        if (res.shiftedCount > 0) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res.result + el.value.slice(end);
                el.setSelectionRange(start, start + res.result.length);
            } else {
                el.value = res.result;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(shiftDownBtn);

    const shiftUpBtn = document.createElement("button");
    shiftUpBtn.type = "button";
    shiftUpBtn.className = "xlc-varbtn xlc-btn-ghost";
    shiftUpBtn.dataset.xlcControl = "capture.format.shift-up";
    shiftUpBtn.textContent = "✦ 标题升级";
    shiftUpBtn.title = "将选中文本中的 Markdown 标题整体升高一级 (如 H2->H1)";
    shiftUpBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = shiftMarkdownHeadings(targetText, -1);
        if (res.shiftedCount > 0) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res.result + el.value.slice(end);
                el.setSelectionRange(start, start + res.result.length);
            } else {
                el.value = res.result;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(shiftUpBtn);

    const quotesAffixBtn = document.createElement("button");
    quotesAffixBtn.type = "button";
    quotesAffixBtn.className = "xlc-varbtn xlc-btn-ghost";
    quotesAffixBtn.dataset.xlcControl = "capture.format.quotes-affix";
    quotesAffixBtn.textContent = "✦ 补单引号";
    quotesAffixBtn.title = "为每行幂等补齐单引号与逗号 ('...',) 方便SQL与数组";
    quotesAffixBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = ensureLineAffixes(targetText, {prefix: "'", suffix: "',"});
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(quotesAffixBtn);

    const multiRegexBtn = document.createElement("button");
    multiRegexBtn.type = "button";
    multiRegexBtn.className = "xlc-varbtn xlc-btn-ghost";
    multiRegexBtn.dataset.xlcControl = "capture.format.multi-regex";
    multiRegexBtn.textContent = "✦ 行首加序号";
    multiRegexBtn.title = "通过多行正则锚点为每行行首补齐自增序号格式";
    multiRegexBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = regexReplaceMultiline(targetText, "^(?!$)", "- ");
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(multiRegexBtn);

    const detectLangBtn = document.createElement("button");
    detectLangBtn.type = "button";
    detectLangBtn.className = "xlc-varbtn xlc-btn-ghost";
    detectLangBtn.dataset.xlcControl = "capture.format.detect-lang";
    detectLangBtn.textContent = "✦ 嗅探语言";
    detectLangBtn.title = "自动探测文本编程语言并封装为对应语言的 Markdown 代码块";
    detectLangBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const info = detectCodeLanguage(targetText);
        const lang = info.isCode ? info.language : "text";
        const wrapped = `\`\`\`${lang}\n${targetText}\n\`\`\``;
        if (hasSel) {
            el.value = el.value.slice(0, start) + wrapped + el.value.slice(end);
            el.setSelectionRange(start, start + wrapped.length);
        } else {
            el.value = wrapped;
        }
        el.focus();
        el.dispatchEvent(new Event("input", {bubbles: true}));
    });
    bar.appendChild(detectLangBtn);

    const scrambleBtn = document.createElement("button");
    scrambleBtn.type = "button";
    scrambleBtn.className = "xlc-varbtn xlc-btn-ghost";
    scrambleBtn.dataset.xlcControl = "capture.format.scramble-words";
    scrambleBtn.textContent = "✦ 单词洗牌";
    scrambleBtn.title = "随机打乱句子中的单词顺序 (适合单词背诵与记忆测试)";
    scrambleBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = scrambleText(targetText, "words");
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(scrambleBtn);

    const compactRepeatedBtn = document.createElement("button");
    compactRepeatedBtn.type = "button";
    compactRepeatedBtn.className = "xlc-varbtn xlc-btn-ghost";
    compactRepeatedBtn.dataset.xlcControl = "capture.format.compact-punct";
    compactRepeatedBtn.textContent = "✦ 压重标点";
    compactRepeatedBtn.title = "将连续多余的感叹号、问号、波浪号压缩为规范单标点 (！！！->！)";
    compactRepeatedBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = compactRepeatedCharacters(targetText, 1);
        if (res.compressedCount > 0) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res.result + el.value.slice(end);
                el.setSelectionRange(start, start + res.result.length);
            } else {
                el.value = res.result;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(compactRepeatedBtn);

    const taskProgressBtn = document.createElement("button");
    taskProgressBtn.type = "button";
    taskProgressBtn.className = "xlc-varbtn xlc-btn-ghost";
    taskProgressBtn.dataset.xlcControl = "capture.format.task-progress";
    taskProgressBtn.textContent = "✦ 任务进度";
    taskProgressBtn.title = "统计 Markdown 待办列表 (- [ ]) 的完成进度百分比并追加进度条";
    taskProgressBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = calculateTaskProgress(targetText);
        if (res.total > 0) {
            const output = `${targetText}\n\n${res.summary}\n${res.progressBar}`;
            if (hasSel) {
                el.value = el.value.slice(0, start) + output + el.value.slice(end);
                el.setSelectionRange(start, start + output.length);
            } else {
                el.value = output;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(taskProgressBtn);

    const thousandsBtn = document.createElement("button");
    thousandsBtn.type = "button";
    thousandsBtn.className = "xlc-varbtn xlc-btn-ghost";
    thousandsBtn.dataset.xlcControl = "capture.format.thousands-group";
    thousandsBtn.textContent = "✦ 加千分位";
    thousandsBtn.title = "将选中的纯数值转换为带逗号的千分位格式 (如 1234567.89 -> 1,234,567.89)";
    thousandsBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = (hasSel ? el.value.slice(start, end) : el.value).trim();
        const res = formatNumberGrouping(targetText, "add");
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(thousandsBtn);

    const sliceLinesBtn = document.createElement("button");
    sliceLinesBtn.type = "button";
    sliceLinesBtn.className = "xlc-varbtn xlc-btn-ghost";
    sliceLinesBtn.dataset.xlcControl = "capture.format.slice-lines";
    sliceLinesBtn.textContent = "✦ 截取区间";
    sliceLinesBtn.title = "按 --- 标记截取多行文本的首个片段";
    sliceLinesBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        if (targetText.includes("---")) {
            const res = sliceLinesByPattern(targetText, /^[^\s]/, "---", {includeEnd: false});
            if (res && res !== targetText) {
                if (hasSel) {
                    el.value = el.value.slice(0, start) + res + el.value.slice(end);
                    el.setSelectionRange(start, start + res.length);
                } else {
                    el.value = res;
                }
                el.focus();
                el.dispatchEvent(new Event("input", {bubbles: true}));
            }
        }
    });
    bar.appendChild(sliceLinesBtn);

    const shiftQuoteUpBtn = document.createElement("button");
    shiftQuoteUpBtn.type = "button";
    shiftQuoteUpBtn.className = "xlc-varbtn xlc-btn-ghost";
    shiftQuoteUpBtn.dataset.xlcControl = "capture.format.shift-quote-up";
    shiftQuoteUpBtn.textContent = "✦ 引用升层";
    shiftQuoteUpBtn.title = "对多行选中文本整体增加一层 Markdown 引用 (> )";
    shiftQuoteUpBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = shiftMarkdownBlockquotes(targetText, 1);
        if (res.shiftedCount > 0) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res.result + el.value.slice(end);
                el.setSelectionRange(start, start + res.result.length);
            } else {
                el.value = res.result;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(shiftQuoteUpBtn);

    const shiftQuoteDownBtn = document.createElement("button");
    shiftQuoteDownBtn.type = "button";
    shiftQuoteDownBtn.className = "xlc-varbtn xlc-btn-ghost";
    shiftQuoteDownBtn.dataset.xlcControl = "capture.format.shift-quote-down";
    shiftQuoteDownBtn.textContent = "✦ 引用降层";
    shiftQuoteDownBtn.title = "对多行选中文本整体减少一层 Markdown 引用前缀";
    shiftQuoteDownBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = shiftMarkdownBlockquotes(targetText, -1);
        if (res.shiftedCount > 0) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res.result + el.value.slice(end);
                el.setSelectionRange(start, start + res.result.length);
            } else {
                el.value = res.result;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(shiftQuoteDownBtn);

    const alignColBtn = document.createElement("button");
    alignColBtn.type = "button";
    alignColBtn.className = "xlc-varbtn xlc-btn-ghost";
    alignColBtn.dataset.xlcControl = "capture.format.align-columns";
    alignColBtn.textContent = "✦ 列对齐";
    alignColBtn.title = "按逗号或分号等宽填充对齐多行多列文本";
    alignColBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const delim = targetText.includes(",") ? "," : (targetText.includes(":") ? ":" : ";");
        const res = alignDelimitedColumns(targetText, delim);
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(alignColBtn);

    const checksumBtn = document.createElement("button");
    checksumBtn.type = "button";
    checksumBtn.className = "xlc-varbtn xlc-btn-ghost";
    checksumBtn.dataset.xlcControl = "capture.format.checksum-crc32";
    checksumBtn.textContent = "✦ 校验和";
    checksumBtn.title = "计算选中文本的 CRC32 校验和短码";
    checksumBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = (hasSel ? el.value.slice(start, end) : el.value).trim();
        if (targetText) {
            const cs = calculateChecksum(targetText, "crc32");
            el.setAttribute("data-xlc-crc32", cs);
            el.title = `CRC32: ${cs}`;
        }
    });
    bar.appendChild(checksumBtn);

    const stripCommentsBtn = document.createElement("button");
    stripCommentsBtn.type = "button";
    stripCommentsBtn.className = "xlc-varbtn xlc-btn-ghost";
    stripCommentsBtn.dataset.xlcControl = "capture.format.strip-comments";
    stripCommentsBtn.textContent = "✦ 剥离注释";
    stripCommentsBtn.title = "批量安全剥离代码中的单行与块级注释 (保护字符串字面量)";
    stripCommentsBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = stripCodeComments(targetText);
        if (res.removedCount > 0) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res.result + el.value.slice(end);
                el.setSelectionRange(start, start + res.result.length);
            } else {
                el.value = res.result;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(stripCommentsBtn);

    const groupLinesBtn = document.createElement("button");
    groupLinesBtn.type = "button";
    groupLinesBtn.className = "xlc-varbtn xlc-btn-ghost";
    groupLinesBtn.dataset.xlcControl = "capture.format.group-lines";
    groupLinesBtn.textContent = "✦ 分组聚合";
    groupLinesBtn.title = "按行首日志级别或前缀将多行文本分类聚合为二级标题大纲";
    groupLinesBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = groupLinesByPattern(targetText);
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(groupLinesBtn);

    const hrulesBtn = document.createElement("button");
    hrulesBtn.type = "button";
    hrulesBtn.className = "xlc-varbtn xlc-btn-ghost";
    hrulesBtn.dataset.xlcControl = "capture.format.hrules-norm";
    hrulesBtn.textContent = "✦ 规整分割线";
    hrulesBtn.title = "将各类水平分割线 (***, ___, ---) 规整为统一规范形态并确保空行防误伤";
    hrulesBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = normalizeHorizontalRules(targetText, "---");
        if (res.normalizedCount > 0) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res.result + el.value.slice(end);
                el.setSelectionRange(start, start + res.result.length);
            } else {
                el.value = res.result;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(hrulesBtn);

    const tableCenterBtn = document.createElement("button");
    tableCenterBtn.type = "button";
    tableCenterBtn.className = "xlc-varbtn xlc-btn-ghost";
    tableCenterBtn.dataset.xlcControl = "capture.format.table-center";
    tableCenterBtn.textContent = "✦ 表格居中";
    tableCenterBtn.title = "批量将 Markdown 表格各列对齐方式修改为居中对齐";
    tableCenterBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = alignMarkdownTableColumns(targetText, "center");
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(tableCenterBtn);

    const tableCsvBtn = document.createElement("button");
    tableCsvBtn.type = "button";
    tableCsvBtn.className = "xlc-varbtn xlc-btn-ghost";
    tableCsvBtn.dataset.xlcControl = "capture.format.table-to-csv";
    tableCsvBtn.textContent = "✦ 表格转CSV";
    tableCsvBtn.title = "将选中的 Markdown 表格转换为标准 RFC 4180 CSV 格式";
    tableCsvBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = markdownTableToDelimited(targetText, "csv");
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(tableCsvBtn);

    const sanitizeSpacesBtn = document.createElement("button");
    sanitizeSpacesBtn.type = "button";
    sanitizeSpacesBtn.className = "xlc-varbtn xlc-btn-ghost";
    sanitizeSpacesBtn.dataset.xlcControl = "capture.format.sanitize-spaces";
    sanitizeSpacesBtn.textContent = "✦ 清洗空格";
    sanitizeSpacesBtn.title = "清理多行文本中的行尾多余空格与 NBSP 不换行隐形空格";
    sanitizeSpacesBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = sanitizeLineEndingsAndSpaces(targetText);
        if (res.fixedCount > 0) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res.result + el.value.slice(end);
                el.setSelectionRange(start, start + res.result.length);
            } else {
                el.value = res.result;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(sanitizeSpacesBtn);

    const camelCaseBtn = document.createElement("button");
    camelCaseBtn.type = "button";
    camelCaseBtn.className = "xlc-varbtn xlc-btn-ghost";
    camelCaseBtn.dataset.xlcControl = "capture.format.camel-case";
    camelCaseBtn.textContent = "✦ 驼峰转换";
    camelCaseBtn.title = "将选中的变量标识符智能转换为小驼峰命名 (camelCase)";
    camelCaseBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = convertIdentifierNamingStyle(targetText, "camel");
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(camelCaseBtn);

    const padTruncBtn = document.createElement("button");
    padTruncBtn.type = "button";
    padTruncBtn.className = "xlc-varbtn xlc-btn-ghost";
    padTruncBtn.dataset.xlcControl = "capture.format.pad-truncate";
    padTruncBtn.textContent = "✦ 定长补齐";
    padTruncBtn.title = "将每行或选中文本定长补齐至 10 个字符宽度（不足补空格）";
    padTruncBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = padOrTruncate(targetText, 10);
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(padTruncBtn);

    const seqGenBtn = document.createElement("button");
    seqGenBtn.type = "button";
    seqGenBtn.className = "xlc-varbtn xlc-btn-ghost";
    seqGenBtn.dataset.xlcControl = "capture.format.seq-gen";
    seqGenBtn.textContent = "✦ 序号序列";
    seqGenBtn.title = "在选区或光标处快速生成 1~10 的序号序列";
    seqGenBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const seq = generateNumericSequence(1, 10);
        el.value = el.value.slice(0, start) + seq + el.value.slice(end);
        el.setSelectionRange(start, start + seq.length);
        el.focus();
        el.dispatchEvent(new Event("input", {bubbles: true}));
    });
    bar.appendChild(seqGenBtn);

    const listOrderedBtn = document.createElement("button");
    listOrderedBtn.type = "button";
    listOrderedBtn.className = "xlc-varbtn xlc-btn-ghost";
    listOrderedBtn.dataset.xlcControl = "capture.format.list-ordered";
    listOrderedBtn.textContent = "✦ 有序列表";
    listOrderedBtn.title = "将无序列表批量转换为编号递增的有序列表 (1. 2. 3.)";
    listOrderedBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = convertListStyle(targetText, "ordered");
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(listOrderedBtn);

    const listUnorderedBtn = document.createElement("button");
    listUnorderedBtn.type = "button";
    listUnorderedBtn.className = "xlc-varbtn xlc-btn-ghost";
    listUnorderedBtn.dataset.xlcControl = "capture.format.list-unordered";
    listUnorderedBtn.textContent = "✦ 无序列表";
    listUnorderedBtn.title = "将有序数字列表批量转换为圆点无序列表 (- )";
    listUnorderedBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = convertListStyle(targetText, "unordered");
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(listUnorderedBtn);

    const filterTasksBtn = document.createElement("button");
    filterTasksBtn.type = "button";
    filterTasksBtn.className = "xlc-varbtn xlc-btn-ghost";
    filterTasksBtn.dataset.xlcControl = "capture.format.filter-tasks-pending";
    filterTasksBtn.textContent = "✦ 未完成待办";
    filterTasksBtn.title = "从多行任务列表中仅筛选提取尚未完成的待办事项 (- [ ])";
    filterTasksBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = filterTaskItems(targetText, "pending");
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(filterTasksBtn);

    const shortHashBtn = document.createElement("button");
    shortHashBtn.type = "button";
    shortHashBtn.className = "xlc-varbtn xlc-btn-ghost";
    shortHashBtn.dataset.xlcControl = "capture.format.short-hash";
    shortHashBtn.textContent = "✦ 8位指纹";
    shortHashBtn.title = "计算选中文本或全文字段的 8 位短哈希指纹";
    shortHashBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = generateShortHash(targetText, 8);
        if (res) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(shortHashBtn);

    const renumberBtn = document.createElement("button");
    renumberBtn.type = "button";
    renumberBtn.className = "xlc-varbtn xlc-btn-ghost";
    renumberBtn.dataset.xlcControl = "capture.format.renumber-list";
    renumberBtn.textContent = "✦ 序号重排";
    renumberBtn.title = "自动重排有序列表行号 (1, 2, 3...) 保持连续自增";
    renumberBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = renumberOrderedList(targetText);
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(renumberBtn);

    const filterAffixBtn = document.createElement("button");
    filterAffixBtn.type = "button";
    filterAffixBtn.className = "xlc-varbtn xlc-btn-ghost";
    filterAffixBtn.dataset.xlcControl = "capture.format.filter-affix";
    filterAffixBtn.textContent = "✦ 筛选注释行";
    filterAffixBtn.title = "仅筛选并保留以 // 开头的代码注释行";
    filterAffixBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = filterLinesByAffix(targetText, "//", "prefix");
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(filterAffixBtn);

    const randColorBtn = document.createElement("button");
    randColorBtn.type = "button";
    randColorBtn.className = "xlc-varbtn xlc-btn-ghost";
    randColorBtn.dataset.xlcControl = "capture.format.random-color";
    randColorBtn.textContent = "✦ 随机色值";
    randColorBtn.title = "在光标处生成一个鲜艳明亮的随机十六进制颜色代码";
    randColorBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const color = generateRandomColor("hex", {tone: "vibrant"});
        el.value = el.value.slice(0, start) + color + el.value.slice(end);
        el.setSelectionRange(start, start + color.length);
        el.focus();
        el.dispatchEvent(new Event("input", {bubbles: true}));
    });
    bar.appendChild(randColorBtn);

    const stripLinkBtn = document.createElement("button");
    stripLinkBtn.type = "button";
    stripLinkBtn.className = "xlc-varbtn xlc-btn-ghost";
    stripLinkBtn.dataset.xlcControl = "capture.format.strip-links";
    stripLinkBtn.textContent = "✦ 剥离超链接";
    stripLinkBtn.title = "将选中的 Markdown 超链接 [标题](URL) 剥离转换为纯文本标题";
    stripLinkBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = convertMarkdownLinks(targetText, "strip");
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(stripLinkBtn);

    const btruncBtn = document.createElement("button");
    btruncBtn.type = "button";
    btruncBtn.className = "xlc-varbtn xlc-btn-ghost";
    btruncBtn.dataset.xlcControl = "capture.format.byte-truncate";
    btruncBtn.textContent = "✦ 255字节截断";
    btruncBtn.title = "严格按照 UTF-8 边界安全截断至 255 字节（防多字节乱码）";
    btruncBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = truncateByBytes(targetText, 255, {ellipsis: true});
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(btruncBtn);

    const punctSpaceBtn = document.createElement("button");
    punctSpaceBtn.type = "button";
    punctSpaceBtn.className = "xlc-varbtn xlc-btn-ghost";
    punctSpaceBtn.dataset.xlcControl = "capture.format.punct-spacing";
    punctSpaceBtn.textContent = "✦ 标点空格规整";
    punctSpaceBtn.title = "规整中英标点与文字间的空格间距（清理中文标点空格，规范英文标点空格）";
    punctSpaceBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = formatPunctuationSpacing(targetText);
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(punctSpaceBtn);

    const tableYamlBtn = document.createElement("button");
    tableYamlBtn.type = "button";
    tableYamlBtn.className = "xlc-varbtn xlc-btn-ghost";
    tableYamlBtn.dataset.xlcControl = "capture.format.table-to-yaml";
    tableYamlBtn.textContent = "✦ 表格转YAML";
    tableYamlBtn.title = "将双列 Markdown 表格自动转换为键值对 YAML 格式";
    tableYamlBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = markdownTableToKeyValue(targetText, {format: "yaml"});
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(tableYamlBtn);

    const pinyinInitBtn = document.createElement("button");
    pinyinInitBtn.type = "button";
    pinyinInitBtn.className = "xlc-varbtn xlc-btn-ghost";
    pinyinInitBtn.dataset.xlcControl = "capture.format.pinyin-initials";
    pinyinInitBtn.textContent = "✦ 拼音首字母";
    pinyinInitBtn.title = "提取选中文本或词组中汉字与英文的拼音大写首字母缩写";
    pinyinInitBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = extractChinesePinyinInitials(targetText);
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(pinyinInitBtn);

    const cleanBlankBtn = document.createElement("button");
    cleanBlankBtn.type = "button";
    cleanBlankBtn.className = "xlc-varbtn xlc-btn-ghost";
    cleanBlankBtn.dataset.xlcControl = "capture.format.clean-blank-lines";
    cleanBlankBtn.textContent = "✦ 压缩多余空行";
    cleanBlankBtn.title = "严格压缩连续多余空行（保留最多1行）并修剪首尾空行";
    cleanBlankBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = normalizeBlankLinesStrict(targetText, 1);
        if (res.cleanedLines > 0) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res.result + el.value.slice(end);
                el.setSelectionRange(start, start + res.result.length);
            } else {
                el.value = res.result;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(cleanBlankBtn);

    const kvToTableBtn = document.createElement("button");
    kvToTableBtn.type = "button";
    kvToTableBtn.className = "xlc-varbtn xlc-btn-ghost";
    kvToTableBtn.dataset.xlcControl = "capture.format.kv-to-table";
    kvToTableBtn.textContent = "✦ 键值转表格";
    kvToTableBtn.title = "将多行键值对或 JSON 转换为标准 Markdown 表格";
    kvToTableBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = keyValueToMarkdownTable(targetText);
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(kvToTableBtn);

    const tocGenBtn = document.createElement("button");
    tocGenBtn.type = "button";
    tocGenBtn.className = "xlc-varbtn xlc-btn-ghost";
    tocGenBtn.dataset.xlcControl = "capture.format.generate-toc";
    tocGenBtn.textContent = "✦ 提取目录TOC";
    tocGenBtn.title = "从 Markdown 标题自动提取生成大纲目录链接列表";
    tocGenBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = generateMarkdownToc(targetText);
        if (res) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(tocGenBtn);

    const codeLangBtn = document.createElement("button");
    codeLangBtn.type = "button";
    codeLangBtn.className = "xlc-varbtn xlc-btn-ghost";
    codeLangBtn.dataset.xlcControl = "capture.format.code-fence-lang";
    codeLangBtn.textContent = "✦ 补全代码TS高亮";
    codeLangBtn.title = "为未标明语言的代码围栏 (```) 统一补全 ts 语言标识";
    codeLangBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = setMarkdownCodeFenceLang(targetText, "ts");
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(codeLangBtn);

    const escapePipeBtn = document.createElement("button");
    escapePipeBtn.type = "button";
    escapePipeBtn.className = "xlc-varbtn xlc-btn-ghost";
    escapePipeBtn.dataset.xlcControl = "capture.format.escape-pipe";
    escapePipeBtn.textContent = "✦ 转义管道符";
    escapePipeBtn.title = "转义选中文本中的管道符 (| -> \\|) 避免与宏分隔符冲突";
    escapePipeBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = escapeMacroPipe(targetText, "escape");
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(escapePipeBtn);

    const gridColsBtn = document.createElement("button");
    gridColsBtn.type = "button";
    gridColsBtn.className = "xlc-varbtn xlc-btn-ghost";
    gridColsBtn.dataset.xlcControl = "capture.format.grid-columns";
    gridColsBtn.textContent = "✦ 3列分栏网格";
    gridColsBtn.title = "将多行清单按 3 列等宽对齐排版为紧凑网格";
    gridColsBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = formatTextColumnsGrid(targetText, 3);
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(gridColsBtn);

    const sortListBtn = document.createElement("button");
    sortListBtn.type = "button";
    sortListBtn.className = "xlc-varbtn xlc-btn-ghost";
    sortListBtn.dataset.xlcControl = "capture.format.sort-markdown-list";
    sortListBtn.textContent = "✦ 列表拼音排序";
    sortListBtn.title = "将选中的 Markdown 列表项按拼音/字母自然升序排列";
    sortListBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = sortMarkdownList(targetText);
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(sortListBtn);

    const sortByWidthBtn = document.createElement("button");
    sortByWidthBtn.type = "button";
    sortByWidthBtn.className = "xlc-varbtn xlc-btn-ghost";
    sortByWidthBtn.dataset.xlcControl = "capture.format.sort-by-width";
    sortByWidthBtn.textContent = "✦ 按长短排序";
    sortByWidthBtn.title = "将多行文本按中英视觉宽度从短到长排列";
    sortByWidthBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = sortLinesByVisualWidth(targetText);
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(sortByWidthBtn);

    const repeatBtn = document.createElement("button");
    repeatBtn.type = "button";
    repeatBtn.className = "xlc-varbtn xlc-btn-ghost";
    repeatBtn.dataset.xlcControl = "capture.format.repeat-text";
    repeatBtn.textContent = "✦ 重复10次";
    repeatBtn.title = "将选中的字符或短语重复输出 10 次";
    repeatBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = repeatText(targetText, 10);
        if (res) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(repeatBtn);

    const invertTaskBtn = document.createElement("button");
    invertTaskBtn.type = "button";
    invertTaskBtn.className = "xlc-varbtn xlc-btn-ghost";
    invertTaskBtn.dataset.xlcControl = "capture.format.invert-task-status";
    invertTaskBtn.textContent = "✦ 反转待办勾选";
    invertTaskBtn.title = "反转选中的 Markdown 任务待办项勾选状态 ([ ] <-> [x])";
    invertTaskBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = invertTaskStatus(targetText, "invert");
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(invertTaskBtn);

    const centerBtn = document.createElement("button");
    centerBtn.type = "button";
    centerBtn.className = "xlc-varbtn xlc-btn-ghost";
    centerBtn.dataset.xlcControl = "capture.format.center-text";
    centerBtn.textContent = "✦ 居中填充";
    centerBtn.title = "按 20 个字符视觉宽度将选中文本对称居中填充空格";
    centerBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = centerText(targetText, 20);
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(centerBtn);

    const delimConvertBtn = document.createElement("button");
    delimConvertBtn.type = "button";
    delimConvertBtn.className = "xlc-varbtn xlc-btn-ghost";
    delimConvertBtn.dataset.xlcControl = "capture.format.convert-delimiter";
    delimConvertBtn.textContent = "✦ 逗号换行互转";
    delimConvertBtn.title = "自动嗅探并将多行列表与逗号分隔列表互相转换";
    delimConvertBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const targetDelim = targetText.includes("\n") ? ", " : "\n";
        const res = convertListDelimiter(targetText, targetDelim);
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(delimConvertBtn);

    const footnotesBtn = document.createElement("button");
    footnotesBtn.type = "button";
    footnotesBtn.className = "xlc-varbtn xlc-btn-ghost";
    footnotesBtn.dataset.xlcControl = "capture.format.normalize-footnotes";
    footnotesBtn.textContent = "✦ 规整脚注";
    footnotesBtn.title = "重新按顺序对 Markdown 脚注编号 (1, 2, 3...) 并将定义归集到文档末尾";
    footnotesBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = normalizeMarkdownFootnotes(targetText);
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(footnotesBtn);

    const escapeSlashBtn = document.createElement("button");
    escapeSlashBtn.type = "button";
    escapeSlashBtn.className = "xlc-varbtn xlc-btn-ghost";
    escapeSlashBtn.dataset.xlcControl = "capture.format.escape-slash";
    escapeSlashBtn.textContent = "✦ 转义反斜杠";
    escapeSlashBtn.title = "将选中文本中的反斜杠与换行符进行转义 (\\ -> \\\\)";
    escapeSlashBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = escapeBackslash(targetText, "escape");
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(escapeSlashBtn);

    const chunkLinesBtn = document.createElement("button");
    chunkLinesBtn.type = "button";
    chunkLinesBtn.className = "xlc-varbtn xlc-btn-ghost";
    chunkLinesBtn.dataset.xlcControl = "capture.format.chunk-lines";
    chunkLinesBtn.textContent = "✦ 分割线分段";
    chunkLinesBtn.title = "按水平分割线 (--- / ===) 将长文本切分为有序分块并追加小标题";
    chunkLinesBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = chunkLinesByDelimiter(targetText);
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(chunkLinesBtn);

    const flattenQuoteBtn = document.createElement("button");
    flattenQuoteBtn.type = "button";
    flattenQuoteBtn.className = "xlc-varbtn xlc-btn-ghost";
    flattenQuoteBtn.dataset.xlcControl = "capture.format.flatten-quotes";
    flattenQuoteBtn.textContent = "✦ 剥离引用";
    flattenQuoteBtn.title = "剥离选中文本中的所有 Markdown 引用符号 (>) 转为普通段落";
    flattenQuoteBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = flattenMarkdownBlockquotes(targetText, "strip");
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(flattenQuoteBtn);

    const revWordsBtn = document.createElement("button");
    revWordsBtn.type = "button";
    revWordsBtn.className = "xlc-varbtn xlc-btn-ghost";
    revWordsBtn.dataset.xlcControl = "capture.format.reverse-words";
    revWordsBtn.textContent = "✦ 单词逆序";
    revWordsBtn.title = "将选中文本中的单词按逆序从后往前排列";
    revWordsBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = reverseWords(targetText);
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(revWordsBtn);

    const stripInlineBtn = document.createElement("button");
    stripInlineBtn.type = "button";
    stripInlineBtn.className = "xlc-varbtn xlc-btn-ghost";
    stripInlineBtn.dataset.xlcControl = "capture.format.strip-inline-markdown";
    stripInlineBtn.textContent = "✦ 剥离行内标记";
    stripInlineBtn.title = "剥离粗体、斜体、删除线、行内代码等标记并保留纯文本";
    stripInlineBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = stripInlineMarkdownFormatting(targetText);
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(stripInlineBtn);

    const kpiCardBtn = document.createElement("button");
    kpiCardBtn.type = "button";
    kpiCardBtn.className = "xlc-varbtn xlc-btn-ghost";
    kpiCardBtn.dataset.xlcControl = "capture.format.kpi-card";
    kpiCardBtn.textContent = "✦ KPI看板";
    kpiCardBtn.title = "将多行键值对数据格式化为 Markdown 核心指标汇总看板卡片";
    kpiCardBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = formatKpiSummaryCard(targetText);
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(kpiCardBtn);

    const randNameBtn = document.createElement("button");
    randNameBtn.type = "button";
    randNameBtn.className = "xlc-varbtn xlc-btn-ghost";
    randNameBtn.dataset.xlcControl = "capture.format.random-name";
    randNameBtn.textContent = "✦ 随机姓名";
    randNameBtn.title = "在选区或光标处生成一个真实的随机中文姓名";
    randNameBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const name = generateRandomName("zh");
        el.value = el.value.slice(0, start) + name + el.value.slice(end);
        el.setSelectionRange(start, start + name.length);
        el.focus();
        el.dispatchEvent(new Event("input", {bubbles: true}));
    });
    bar.appendChild(randNameBtn);

    const alphabetGroupBtn = document.createElement("button");
    alphabetGroupBtn.type = "button";
    alphabetGroupBtn.className = "xlc-varbtn xlc-btn-ghost";
    alphabetGroupBtn.dataset.xlcControl = "capture.format.alphabet-group";
    alphabetGroupBtn.textContent = "✦ 首字字母分节";
    alphabetGroupBtn.title = "将多行清单按首字符的拼音/英文字母分组聚合为大纲小节";
    alphabetGroupBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = groupLinesByAlphabet(targetText);
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(alphabetGroupBtn);

    const indentShiftBtn = document.createElement("button");
    indentShiftBtn.type = "button";
    indentShiftBtn.className = "xlc-varbtn xlc-btn-ghost";
    indentShiftBtn.dataset.xlcControl = "capture.format.shift-list-indent";
    indentShiftBtn.textContent = "✦ 列表缩进+2";
    indentShiftBtn.title = "将选中的多行列表项整体向右增加 2 个空格的层级缩进";
    indentShiftBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = shiftListIndentation(targetText, 2);
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(indentShiftBtn);

    const measureWidthBtn = document.createElement("button");
    measureWidthBtn.type = "button";
    measureWidthBtn.className = "xlc-varbtn xlc-btn-ghost";
    measureWidthBtn.dataset.xlcControl = "capture.format.measure-width";
    measureWidthBtn.textContent = "✦ 统计字宽";
    measureWidthBtn.title = "统计选中文本或全文字段的视觉宽度、汉字数与字符数";
    measureWidthBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const m = measureVisualWidth(targetText);
        openInfoDialog("视觉宽度与字符统计", [
            `视觉宽度：${m.visualWidth}`,
            `字符总数：${m.charCount}`,
            `中文汉字：${m.cjkCount}`,
            `ASCII字符：${m.asciiCount}`,
        ]);
    });
    bar.appendChild(measureWidthBtn);

    const flattenListBtn = document.createElement("button");
    flattenListBtn.type = "button";
    flattenListBtn.className = "xlc-varbtn xlc-btn-ghost";
    flattenListBtn.dataset.xlcControl = "capture.format.flatten-list";
    flattenListBtn.textContent = "✦ 展开打平列表";
    flattenListBtn.title = "将选中的多层嵌套列表展开打平为统一顶层圆点列表";
    flattenListBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = flattenNestedList(targetText, "flat_bullets");
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(flattenListBtn);

    const maskRangeBtn = document.createElement("button");
    maskRangeBtn.type = "button";
    maskRangeBtn.className = "xlc-varbtn xlc-btn-ghost";
    maskRangeBtn.dataset.xlcControl = "capture.format.mask-range";
    maskRangeBtn.textContent = "✦ 留头尾脱敏";
    maskRangeBtn.title = "对选中文本保留前 2 位和后 2 位，中间字符批量替换为星号 (*)";
    maskRangeBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = maskTextRange(targetText, {keepStart: 2, keepEnd: 2});
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(maskRangeBtn);

    const cjkSpacingBtn = document.createElement("button");
    cjkSpacingBtn.type = "button";
    cjkSpacingBtn.className = "xlc-varbtn xlc-btn-ghost";
    cjkSpacingBtn.dataset.xlcControl = "capture.format.cjk-spacing-comprehensive";
    cjkSpacingBtn.textContent = "✦ 综合排版规整";
    cjkSpacingBtn.title = "一键执行盘古之白中英文空格、标点空格规范与 NBSP 隐形空格清洗";
    cjkSpacingBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = formatCJKSpacingComprehensive(targetText);
        if (res.changed) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res.result + el.value.slice(end);
                el.setSelectionRange(start, start + res.result.length);
            } else {
                el.value = res.result;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(cjkSpacingBtn);

    const circledNumBtn = document.createElement("button");
    circledNumBtn.type = "button";
    circledNumBtn.className = "xlc-varbtn xlc-btn-ghost";
    circledNumBtn.dataset.xlcControl = "capture.format.circled-numbers";
    circledNumBtn.textContent = "✦ 转圈号数字";
    circledNumBtn.title = "将选中文本中的数字 1~20 转换为圆圈序号 (①, ②, ③...)";
    circledNumBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = convertNumberSymbols(targetText, "circled");
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(circledNumBtn);

    const extractCodeBtn = document.createElement("button");
    extractCodeBtn.type = "button";
    extractCodeBtn.className = "xlc-varbtn xlc-btn-ghost";
    extractCodeBtn.dataset.xlcControl = "capture.format.extract-code-blocks";
    extractCodeBtn.textContent = "✦ 提取纯代码";
    extractCodeBtn.title = "从选中的 Markdown 文本中仅提取代码块内容并剔除其他说明文字";
    extractCodeBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = extractCodeBlocksFromMarkdown(targetText);
        if (res) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(extractCodeBtn);

    const headingToListBtn = document.createElement("button");
    headingToListBtn.type = "button";
    headingToListBtn.className = "xlc-varbtn xlc-btn-ghost";
    headingToListBtn.dataset.xlcControl = "capture.format.heading-to-list";
    headingToListBtn.textContent = "✦ 标题转列表";
    headingToListBtn.title = "将选中的各级 Markdown 标题转换为层级缩进列表";
    headingToListBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = convertHeadingsToList(targetText, "headings_to_list");
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(headingToListBtn);

    const numRangeFilterBtn = document.createElement("button");
    numRangeFilterBtn.type = "button";
    numRangeFilterBtn.className = "xlc-varbtn xlc-btn-ghost";
    numRangeFilterBtn.dataset.xlcControl = "capture.format.filter-numeric-range";
    numRangeFilterBtn.textContent = "✦ 筛选>=100";
    numRangeFilterBtn.title = "从多行数据中仅保留包含数值 >= 100 的记录行";
    numRangeFilterBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = filterNumericRangeLines(targetText, 100);
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(numRangeFilterBtn);

    const numberHeadingsBtn = document.createElement("button");
    numberHeadingsBtn.type = "button";
    numberHeadingsBtn.className = "xlc-varbtn xlc-btn-ghost";
    numberHeadingsBtn.dataset.xlcControl = "capture.format.number-headings";
    numberHeadingsBtn.textContent = "✦ 标题编序号";
    numberHeadingsBtn.title = "为多级 Markdown 标题自动生成层级数字序号（如 1. 、1.1 ）";
    numberHeadingsBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = numberMarkdownHeadings(targetText, { mode: "number" });
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(numberHeadingsBtn);

    const stripHeadingNumsBtn = document.createElement("button");
    stripHeadingNumsBtn.type = "button";
    stripHeadingNumsBtn.className = "xlc-varbtn xlc-btn-ghost";
    stripHeadingNumsBtn.dataset.xlcControl = "capture.format.strip-heading-numbers";
    stripHeadingNumsBtn.textContent = "✦ 标题剥序号";
    stripHeadingNumsBtn.title = "一键剥离多级标题中的层级数字序号";
    stripHeadingNumsBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = numberMarkdownHeadings(targetText, { mode: "strip" });
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(stripHeadingNumsBtn);

    const transposeTableBtn = document.createElement("button");
    transposeTableBtn.type = "button";
    transposeTableBtn.className = "xlc-varbtn xlc-btn-ghost";
    transposeTableBtn.dataset.xlcControl = "capture.format.transpose-table";
    transposeTableBtn.textContent = "✦ 表格行列转置";
    transposeTableBtn.title = "将 Markdown 表格的行与列互换（原第0列变为新表头）";
    transposeTableBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = transposeMarkdownTable(targetText);
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(transposeTableBtn);

    const progressBarBtn = document.createElement("button");
    progressBarBtn.type = "button";
    progressBarBtn.className = "xlc-varbtn xlc-btn-ghost";
    progressBarBtn.dataset.xlcControl = "capture.format.insert-progress-bar";
    progressBarBtn.textContent = "✦ 插入进度条";
    progressBarBtn.title = "插入 Unicode 方块进度条 [███████░░░] 7/10 70%";
    progressBarBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const barStr = formatTaskProgressBar(7, 10);
        el.value = el.value.slice(0, start) + barStr + el.value.slice(end);
        el.setSelectionRange(start, start + barStr.length);
        el.focus();
        el.dispatchEvent(new Event("input", {bubbles: true}));
    });
    bar.appendChild(progressBarBtn);

    const beautifyTableBtn = document.createElement("button");
    beautifyTableBtn.type = "button";
    beautifyTableBtn.className = "xlc-varbtn xlc-btn-ghost";
    beautifyTableBtn.dataset.xlcControl = "capture.format.beautify-table";
    beautifyTableBtn.textContent = "✦ 表格列宽美化";
    beautifyTableBtn.title = "计算 CJK 双倍字宽使各列边框完全垂直对齐";
    beautifyTableBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = beautifyMarkdownTable(targetText);
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(beautifyTableBtn);

    const calloutBtn = document.createElement("button");
    calloutBtn.type = "button";
    calloutBtn.className = "xlc-varbtn xlc-btn-ghost";
    calloutBtn.dataset.xlcControl = "capture.format.wrap-callout";
    calloutBtn.textContent = "✦ 包装Callout";
    calloutBtn.title = "将选中文本包装为 GitHub/Obsidian 告警提示块 (> [!NOTE])";
    calloutBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = formatMarkdownCallout(targetText, "NOTE");
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(calloutBtn);

    const jsonKeysBtn = document.createElement("button");
    jsonKeysBtn.type = "button";
    jsonKeysBtn.className = "xlc-varbtn xlc-btn-ghost";
    jsonKeysBtn.dataset.xlcControl = "capture.format.extract-json-keys";
    jsonKeysBtn.textContent = "✦ 提取JSON键";
    jsonKeysBtn.title = "提取 JSON 顶层键名列表";
    jsonKeysBtn.addEventListener("click", () => {
        const el = getTarget();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? el.value.length;
        const hasSel = start !== end;
        const targetText = hasSel ? el.value.slice(start, end) : el.value;
        const res = queryJsonPath(targetText, "keys");
        if (res && res !== targetText) {
            if (hasSel) {
                el.value = el.value.slice(0, start) + res + el.value.slice(end);
                el.setSelectionRange(start, start + res.length);
            } else {
                el.value = res;
            }
            el.focus();
            el.dispatchEvent(new Event("input", {bubbles: true}));
        }
    });
    bar.appendChild(jsonKeysBtn);

    // WCAG 2.2 强化：确保宏变量与文本格式化工具栏中每个操作按钮均拥有精准的 aria-label
    bar.querySelectorAll<HTMLButtonElement>("button").forEach((btn) => {
        if (!btn.getAttribute("aria-label")) {
            const label = btn.title || btn.textContent?.replace(/^✦\s*/, "") || "文本格式化动作";
            btn.setAttribute("aria-label", label);
        }
    });

    // 界面减法（T-0754）：工具栏默认只展示 10 个核心变量模板，其余宏与格式化按钮收进可搜索的「文本工具」抽屉，
    // 既保留全部 DOM 节点与 data-xlc-control，又把捕获/编辑表单从 2800px 压缩回单屏高度。
    const coreControls = new Set([
        "capture.variable.ask",
        "capture.variable.ask.options",
        "capture.variable.ask.textarea",
        "capture.variable.snippet",
        "capture.variable.cursor",
        "capture.variable.date",
        "capture.variable.date.offset",
        "capture.variable.random",
        "capture.variable.doc",
        "capture.variable.clipboard",
    ]);
    const extraButtons = Array.from(bar.querySelectorAll<HTMLButtonElement>("button"))
        .filter((btn) => !coreControls.has(btn.dataset.xlcControl ?? ""));

    const toolsToggleBtn = document.createElement("button");
    toolsToggleBtn.type = "button";
    toolsToggleBtn.className = "xlc-varbtn xlc-btn-ghost xlc-varbar-tools-toggle";
    toolsToggleBtn.dataset.xlcControl = "capture.varbar.tools-toggle";
    toolsToggleBtn.textContent = "🛠 文本工具…";
    toolsToggleBtn.title = "展开可搜索的扩展宏与文本格式化工具";
    toolsToggleBtn.setAttribute("aria-label", "展开可搜索的扩展宏与文本格式化工具");
    toolsToggleBtn.setAttribute("aria-expanded", "false");

    const toolsPanel = document.createElement("div");
    toolsPanel.className = "xlc-varbar-tools-panel";
    toolsPanel.dataset.xlcControl = "capture.varbar.tools-panel";
    toolsPanel.hidden = true;

    const toolsSearch = document.createElement("input");
    toolsSearch.type = "search";
    toolsSearch.className = "b3-text-field xlc-varbar-tools-search";
    toolsSearch.dataset.xlcControl = "capture.varbar.tools-search";
    toolsSearch.placeholder = "搜索宏或文本工具…";
    toolsSearch.setAttribute("aria-label", "搜索宏或文本工具");

    const toolsList = document.createElement("div");
    toolsList.className = "xlc-varbar-tools-list";
    for (const btn of extraButtons) {
        toolsList.appendChild(btn);
    }

    toolsSearch.addEventListener("input", () => {
        const kw = toolsSearch.value.trim().toLowerCase();
        for (const btn of extraButtons) {
            const hay = `${btn.textContent ?? ""} ${btn.title ?? ""} ${btn.dataset.xlcControl ?? ""}`.toLowerCase();
            btn.hidden = Boolean(kw) && !hay.includes(kw);
        }
    });
    toolsSearch.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            toolsPanel.hidden = true;
            toolsToggleBtn.setAttribute("aria-expanded", "false");
            toolsToggleBtn.focus();
            return;
        }
        e.stopPropagation();
    });

    toolsToggleBtn.addEventListener("click", () => {
        const nextOpen = toolsPanel.hidden;
        toolsPanel.hidden = !nextOpen;
        toolsToggleBtn.setAttribute("aria-expanded", nextOpen ? "true" : "false");
        if (nextOpen) {
            toolsSearch.value = "";
            for (const btn of extraButtons) btn.hidden = false;
            toolsSearch.focus();
        }
    });

    toolsPanel.append(toolsSearch, toolsList);
    bar.append(toolsToggleBtn, toolsPanel);

    return bar;
}
