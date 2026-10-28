// 变量填充卡片（R67/F1，质感基准 docs/design/prototype.html 屏 4）：
// 含 {{xlc:ask:…}} 的条目在插入前弹出轻量表单——Enter 插入 / Tab 切字段 / Esc 取消。
// 填充值仅作用于本次插入（草稿不回写库）；同名重复变量只询问一次（listAskFields 已去重）。
// 安全：字段名/选项一律 textContent 注入，绝不 innerHTML。
import {Dialog} from "siyuan";
import {getDialogBody} from "./dialog-dom";
import {AskField, askFieldTag, expandAsks, stripCursorToken} from "../model/variables";
import {ItemType} from "../model/item";
import {formatPanguSpacing, tsvToMarkdownTable, stripUrlTrackingParams, normalizeListFormatting, normalizePunctuation, deduplicateLines, compactWhitespaceAndLines, convertWidth, encodeBase64, encodeUrlText, toggleMarkdownBlockquote, escapeHtmlEntities, unescapeHtmlEntities, formatMarkdownTable, csvToJson, toggleMarkdownTaskStatus, extractMarkdownLinks, affixLines, titleCaseLines, reverseLines, numberLines, trimLinesAdvanced, normalizeObjectQuotes, stripAffixes, propertiesToJson, maskSensitiveText, joinLinesWithDelimiter, splitTextToLines, extractInitials, stripMarkdownFormatting, shuffleLines, reverseText, romanToArabic, arabicToRoman, padLines, convertChineseVariant, compactBlankLines, countWordFrequency, surroundEachLine, extractExecutiveSummary, convertIndentation, sumNumericLines, extractRepeatedPhrases, extractColumnFromLines, pluralizeText, transposeMatrixText, expandEnglishContractions, convertColorFormat, humanizeIdentifier, slugifyText, setOperationsOnLines, convertRadix, stripAffixWords, sortLinesByColumn, extractKvValue, formatByRegexGroups, indentLines, outdentLines, validateFormat, filterMarkdownTable, swapLineParts, parsePathParts, deduplicateWithCount, normalizeSmartQuotes, interleaveLines, convertObjectKeysCase, formatUnitSpacing, filterCharacterSet, generateNanoId, toggleLineComments, renderSimpleTemplate, checkBracketsBalance, normalizePunctuationAdaptive, obfuscateText, wrapTextLines, shiftMarkdownHeadings, ensureLineAffixes, regexReplaceMultiline} from "../model/clipboard-cleaner";
import {autoParameterizeText} from "../model/template-wizard";
import {transformCase} from "../model/placeholders";

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
    const dialog = new Dialog({
        title: t("varFormTitle"),
        content: "",
        width: "min(440px, 92vw)",
        height: "auto",
        // 所有关闭路径（Esc/scrim）统一走 onCancel：上层搜索弹窗焦点回归（R128）；
        // 按钮确认/取消已自行结算，不在此重复触发（R138 结算语义）
        destroyCallback: () => {
            if (typeof window !== "undefined" && window.visualViewport) {
                window.visualViewport.removeEventListener("resize", handleViewport);
                window.visualViewport.removeEventListener("scroll", handleViewport);
            }
            if (!settled) options.onCancel?.();
        },
    });
    // 原型屏 4：紧凑卡形态，卡头（徽标+标题+Esc 取消）即标题，隐藏宿主标题栏
    const container = dialog.element.querySelector(".b3-dialog__container") as HTMLElement | null;
    if (container) container.classList.add("xlc-varform-host");

    // 移动端虚拟键盘避让（window.visualViewport 动态抬升，防遮挡按钮）
    const handleViewport = () => {
        if (!container || typeof window === "undefined" || !window.visualViewport) return;
        const offset = Math.max(0, window.innerHeight - window.visualViewport.height);
        container.style.paddingBottom = offset > 0 ? `${offset + 12}px` : "";
    };
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
    for (const [fieldIndex, field] of options.fields.entries()) {
        const wrap = document.createElement("label");
        wrap.className = "xlc-varform-field";
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
        input.className = "b3-text-field";
        if (field.kind === "textarea") {
            (input as HTMLTextAreaElement).rows = 3;
            (input as HTMLTextAreaElement).setAttribute("spellcheck", "false");
        } else {
            input.setAttribute("enterkeyhint", "done");
        }
        if (field.kind === "date") (input as HTMLInputElement).type = "date";
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
        // 初值预填逻辑（ADR 0074）：记忆值优先，无记忆值时回退至模板声明的 defaultValue
        const memoryValue = options.defaults ? options.defaults[field.name] : undefined;
        if (memoryValue !== undefined && memoryValue.length > 0) {
            input.value = memoryValue;
        } else if (field.defaultValue) {
            input.value = field.defaultValue;
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
                optBtn.className = "xlc-multi-option-pill" + (currentSelected.has(opt) ? " xlc-multi-option-pill--selected" : "");
                optBtn.textContent = opt;
                optBtn.title = `点击切换选中 "${opt}"`;
                optBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    if (currentSelected.has(opt)) {
                        currentSelected.delete(opt);
                        optBtn.classList.remove("xlc-multi-option-pill--selected");
                    } else {
                        currentSelected.add(opt);
                        optBtn.classList.add("xlc-multi-option-pill--selected");
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
            const syncPills = () => {
                pillsWrap.querySelectorAll<HTMLElement>(".xlc-quick-option-pill").forEach((pill) => {
                    pill.classList.toggle("xlc-quick-option-pill--selected", pill.textContent === input.value);
                });
            };
            for (const opt of Array.from(candidateOptions).slice(0, 8)) {
                const optBtn = document.createElement("button");
                optBtn.type = "button";
                optBtn.className = "xlc-quick-option-pill" + (input.value === opt ? " xlc-quick-option-pill--selected" : "");
                optBtn.textContent = opt;
                optBtn.title = `点击填入 "${opt}"`;
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
    let liveDebounceTimer: ReturnType<typeof setTimeout> | null = null;

    if (options.templateText) {
        const previewWrap = document.createElement("div");
        previewWrap.className = "xlc-varform-preview-wrap";

        const previewHead = document.createElement("div");
        previewHead.className = "xlc-varform-preview-head";
        previewHead.textContent = "🔍 实时展开预览：";

        previewBox = document.createElement("div");
        previewBox.className = "xlc-varform-preview";
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
    savePresetBtn.dataset.xlcControl = "variable.save-preset";
    savePresetBtn.addEventListener("click", () => {
        const name = (typeof window !== "undefined" && typeof window.prompt === "function")
            ? window.prompt("请输入此套参数预设的名称（如：客户A专票）：", `方案 ${Object.keys(presetSchemes).length + 1}`)
            : null;
        if (!name || !name.trim()) return;
        const cleanName = name.trim().slice(0, 32);
        const currentFills = collect();
        presetSchemes[cleanName] = currentFills;
        syncPresetOptions();
        presetSelect.value = cleanName;
        options.onSavePreset?.(cleanName, currentFills);
    });
    presetWrap.appendChild(savePresetBtn);

    const deletePresetBtn = document.createElement("button");
    deletePresetBtn.type = "button";
    deletePresetBtn.className = "b3-button b3-button--text";
    deletePresetBtn.style.fontSize = "12px";
    deletePresetBtn.textContent = "🗑";
    deletePresetBtn.title = "删除当前选中的预设方案";
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
    const kbdHint = document.createElement("span");
    kbdHint.className = "xlc-varform-hint";
    // 含 textarea 字段时 Enter 语义变化（R160）：提示行如实告知，不沿用「Enter 插入」
    kbdHint.textContent = options.fields.some((f) => f.kind === "textarea") ? t("varFormHintMultiline") : t("varFormHint");
    foot.appendChild(kbdHint);
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "b3-button";
    cancelBtn.dataset.xlcControl = "variable.cancel";
    cancelBtn.textContent = t("cancel");
    foot.appendChild(cancelBtn);

    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "b3-button xlc-btn-ghost";
    resetBtn.dataset.xlcControl = "variable.reset-defaults";
    resetBtn.textContent = "↺ " + (t("resetDefaults") || "恢复默认");
    resetBtn.title = "清空当前输入，恢复所有字段到模板初始默认值";
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
    insertBtn.className = "b3-button xlc-btn-primary";
    insertBtn.textContent = t("insert");
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
        // Ctrl+Enter / Cmd+Enter: 在任何输入控件/多行文本中直接快速确认提交 (G46)
        if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) {
            ev.preventDefault();
            confirm();
            return;
        }
        // Alt+C / Ctrl+Shift+C: 快捷复制展开结果并关闭 (G49)
        if ((ev.altKey && (ev.key === "c" || ev.key === "C")) || (ev.ctrlKey && ev.shiftKey && (ev.key === "C" || ev.key === "c"))) {
            if (options.onCopy) {
                ev.preventDefault();
                if (liveDebounceTimer) clearTimeout(liveDebounceTimer);
                if (settled) return;
                settled = true;
                dialog.destroy();
                options.onCopy(collect());
                return;
            }
        }
        if (ev.key === "Enter" && !ev.altKey && !ev.ctrlKey && !ev.metaKey) {
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
                root.querySelectorAll<HTMLElement>("input, textarea, button"),
            ).filter((el) => !el.hasAttribute("disabled"));
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

    return bar;
}
