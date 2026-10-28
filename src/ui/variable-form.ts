// 变量填充卡片（R67/F1，质感基准 docs/design/prototype.html 屏 4）：
// 含 {{xlc:ask:…}} 的条目在插入前弹出轻量表单——Enter 插入 / Tab 切字段 / Esc 取消。
// 填充值仅作用于本次插入（草稿不回写库）；同名重复变量只询问一次（listAskFields 已去重）。
// 安全：字段名/选项一律 textContent 注入，绝不 innerHTML。
import {Dialog} from "siyuan";
import {getDialogBody} from "./dialog-dom";
import {AskField, askFieldTag, expandAsks, stripCursorToken} from "../model/variables";
import {ItemType} from "../model/item";
import {formatPanguSpacing, tsvToMarkdownTable, stripUrlTrackingParams, normalizeListFormatting, normalizePunctuation, deduplicateLines, compactWhitespaceAndLines, convertWidth, encodeBase64, encodeUrlText, toggleMarkdownBlockquote, escapeHtmlEntities, unescapeHtmlEntities, formatMarkdownTable, csvToJson, toggleMarkdownTaskStatus, extractMarkdownLinks, affixLines, titleCaseLines, reverseLines, numberLines, trimLinesAdvanced, normalizeObjectQuotes, stripAffixes, propertiesToJson, maskSensitiveText, joinLinesWithDelimiter, splitTextToLines, extractInitials} from "../model/clipboard-cleaner";
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

    return bar;
}
