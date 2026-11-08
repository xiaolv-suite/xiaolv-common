// 交互式 CSV/TSV 字段映射向导（G13，R271）：
// 粘贴表格文本后自动检测列数并展示「标题/正文/分类/标签/别名/链接」映射下拉框；
// 支持拖拽重排、一键「智能推断」（基于表头关键词匹配）；
// 实时预览前 5 行解析结果，确认后再进入导入策略对话框。

import {Dialog} from "siyuan";
import {adaptSecondaryDialogForMobile, getDialogBody, isMobileDialogViewport, mountPlatformDialogTitleWrap} from "./dialog-dom";
import {inferColumnMapping} from "../service/csv-tsv-import";
import {ExportedItem} from "../model/transfer";
import {toErrorMessage} from "../model/errors";
import type {SettingsUiContext} from "./settings-dialog";

export interface CsvTsvWizardState {
    rawText: string;
    delimiter: string;
    grid: string[][];
    mapping: {
        titleIndex: number;
        contentIndex: number;
        categoryIndex: number;
        tagsIndex: number;
        aliasIndex: number;
        urlIndex: number;
    };
    previewRows: ExportedItem[];
}

/** 交互式字段映射向导对话框 */
export function openCsvTsvImportWizard(ctx: SettingsUiContext, onClose?: () => void): void {
    const t = ctx.t;
    let released = false;
    let parseTimer: ReturnType<typeof setTimeout> | undefined;

    const release = (): void => {
        if (released) return;
        released = true;
        if (parseTimer) {
            clearTimeout(parseTimer);
            parseTimer = undefined;
        }
        if (typeof window !== "undefined" && window.visualViewport) {
            window.visualViewport.removeEventListener("resize", handleViewport);
            window.visualViewport.removeEventListener("scroll", handleViewport);
        }
        observer?.disconnect();
        onClose?.();
    };

    const isMobileModal = isMobileDialogViewport();
    const dialog = new Dialog({
        title: t("csvImportTitle"),
        content: "",
        width: isMobileModal ? "100vw" : "min(800px, 96vw)",
        // R433：高度自适应内容——固定高度会让空态 body 底部留出 ~230px 空白断层
        destroyCallback: () => {
            release();
        },
    });
    const container = dialog.element.querySelector(".b3-dialog__container") as HTMLElement | null;
    if (container) container.classList.add("xlc-form-host", "xlc-settings-host");
    mountPlatformDialogTitleWrap(dialog.element, t("csvImportTitle"));
    adaptSecondaryDialogForMobile(dialog, t("cancel") || "关闭");

    // 移动端虚拟键盘安全避让
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
    if (!body) {
        onClose?.();
        return;
    }
    body.innerHTML = "";
    const root = document.createElement("div");
    root.className = "xlc-form";

    // 步骤 1：粘贴表格文本
    const hint = document.createElement("p");
    hint.className = "xlc-form-hint";
    hint.textContent = t("csvImportHint");
    root.appendChild(hint);

    const ta = document.createElement("textarea");
    ta.className = "b3-text-field";
    ta.dataset.xlcControl = "wizard.csv.text";
    ta.rows = 8;
    ta.placeholder = t("csvImportPlaceholder");
    ta.setAttribute("spellcheck", "false");
    ta.setAttribute("aria-label", t("csvImportTitle") || "表格文本输入");
    root.appendChild(ta);

    // 状态管理
    let state: CsvTsvWizardState = {
        rawText: "",
        delimiter: ",",
        grid: [],
        mapping: {
            titleIndex: -1,
            contentIndex: -1,
            categoryIndex: -1,
            tagsIndex: -1,
            aliasIndex: -1,
            urlIndex: -1,
        },
        previewRows: [],
    };

    // 步骤 2：字段映射区域
    const mapRow = document.createElement("div");
    mapRow.className = "xlc-wizard-mapping-row";
    mapRow.style.display = "none";
    const mapTitle = document.createElement("h4");
    mapTitle.className = "xlc-form-title";
    mapTitle.textContent = t("fieldMapping");
    mapRow.appendChild(mapTitle);

    const mappingGrid = document.createElement("div");
    mappingGrid.className = "xlc-wizard-mapping-grid";

    const FIELD_METAS: Array<{key: keyof typeof state.mapping; label: string}> = [
        {key: "titleIndex", label: "标题 (Title)"},
        {key: "contentIndex", label: "正文 (Content)"},
        {key: "categoryIndex", label: "分类 (Category)"},
        {key: "tagsIndex", label: "标签 (Tags)"},
        {key: "aliasIndex", label: "别名 (Alias)"},
        {key: "urlIndex", label: "链接 (URL)"},
    ];

    const createMappingItem = (fieldName: keyof typeof state.mapping, labelText: string): HTMLElement => {
        const itemWrap = document.createElement("div");
        itemWrap.className = "xlc-wizard-field-item";

        const selectId = `xlc-wizard-field-${String(fieldName)}`;
        const label = document.createElement("label");
        label.className = "xlc-form-label";
        label.textContent = labelText;
        label.htmlFor = selectId;
        itemWrap.appendChild(label);

        const select = document.createElement("select");
        select.id = selectId;
        select.className = "b3-text-field xlc-wizard-select";
        select.dataset.xlcControl = `wizard.field.${fieldName}`;
        select.setAttribute("aria-label", labelText);
        select.addEventListener("change", () => {
            state.mapping[fieldName] = parseInt(select.value, 10);
            updatePreview();
        });
        itemWrap.appendChild(select);
        return itemWrap;
    };

    for (const {key, label} of FIELD_METAS) {
        const item = createMappingItem(key, label);
        mappingGrid.appendChild(item);
    }

    const btnRow = document.createElement("div");
    btnRow.className = "xlc-form-actions";
    btnRow.style.justifyContent = "flex-start";
    btnRow.style.gap = "8px";
    if (typeof btnRow.setAttribute === "function") {
        btnRow.setAttribute("role", "toolbar");
        btnRow.setAttribute("aria-label", "智能推断工具栏");
    }

    const autoBtn = document.createElement("button");
    autoBtn.type = "button";
    autoBtn.className = "b3-button b3-button--secondary";
    autoBtn.textContent = "✨ " + t("autoInfer");
    if (typeof autoBtn.setAttribute === "function") {
        autoBtn.setAttribute("aria-label", "一键智能推断表头映射");
    }
    autoBtn.addEventListener("click", () => {
        const inferred = inferColumnMapping(state.grid);
        state.mapping.titleIndex = inferred.titleIndex;
        state.mapping.contentIndex = inferred.contentIndex;
        state.mapping.categoryIndex = inferred.categoryIndex;
        state.mapping.tagsIndex = inferred.tagsIndex;
        state.mapping.aliasIndex = inferred.aliasIndex;
        state.mapping.urlIndex = inferred.urlIndex;
        syncMappingToUI();
        updatePreview();
    });
    btnRow.appendChild(autoBtn);

    mapRow.appendChild(mappingGrid);
    mapRow.appendChild(btnRow);
    root.appendChild(mapRow);

    // 步骤 3：预览区域（R433：空态隐藏，避免粘贴区下方出现孤立白条）
    const preview = document.createElement("div");
    preview.className = "xlc-form-hint xlc-wizard-preview-box";
    preview.tabIndex = 0;
    preview.setAttribute("role", "region");
    preview.setAttribute("aria-label", "表格解析预览");
    preview.style.display = "none";
    const setPreview = (text: string): void => {
        preview.textContent = text;
        preview.style.display = text ? "" : "none";
    };
    root.appendChild(preview);

    // 底部按钮
    const foot = document.createElement("div");
    foot.className = "xlc-form-actions";
    foot.style.justifyContent = "flex-end";
    foot.style.gap = "8px";
    if (typeof foot.setAttribute === "function") {
        foot.setAttribute("role", "toolbar");
        foot.setAttribute("aria-label", "导入向导操作栏");
    }

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "b3-button";
    cancelBtn.textContent = t("cancel");
    if (typeof cancelBtn.setAttribute === "function") {
        cancelBtn.setAttribute("aria-label", t("cancel") || "取消导入");
    }
    cancelBtn.addEventListener("click", () => {
        dialog.destroy();
        release();
    });

    let isSubmitting = false;
    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "b3-button xlc-btn-primary";
    nextBtn.textContent = t("setupNext");
    nextBtn.disabled = true;
    if (typeof nextBtn.setAttribute === "function") {
        nextBtn.setAttribute("aria-label", t("setupNext") || "下一步，配置导入策略");
    }
    nextBtn.addEventListener("click", () => {
        if (isSubmitting || nextBtn.disabled || !parsedItems.length || parsedText !== state.rawText) return;
        isSubmitting = true;
        nextBtn.disabled = true;
        dialog.destroy();
        release();
        void loadParser().then((parser) => {
            const fullResult = parser.parseCsvTsvItems(state.rawText, state.delimiter, Date.now(), state.mapping);
            const importIssues = fullResult.issues.map((reason, index) => ({index, reason}));
            void import("./settings-dialog").then((mod) => {
                mod.openImportPolicyDialog(
                    ctx,
                    {items: fullResult.items.map((i) => ({id: i.id, title: i.title}))},
                    importIssues,
                    {kind: "csv-tsv", items: fullResult.items},
                );
            });
        });
    });

    foot.addEventListener("keydown", (e: any) => {
        const buttons = [cancelBtn, nextBtn].filter((b) => !b.disabled);
        if (buttons.length <= 1) return;
        const curIdx = buttons.indexOf(document.activeElement as HTMLButtonElement);
        if (curIdx === -1) return;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            buttons[(curIdx + 1) % buttons.length]?.focus();
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            buttons[(curIdx - 1 + buttons.length) % buttons.length]?.focus();
        } else if (e.key === "Home") {
            e.preventDefault();
            buttons[0]?.focus();
        } else if (e.key === "End") {
            e.preventDefault();
            buttons[buttons.length - 1]?.focus();
        }
    });

    root.addEventListener("keydown", (e) => {
        if (e.isComposing || (e as KeyboardEvent).keyCode === 229) return;
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            if (e.repeat || nextBtn.disabled) return;
            e.preventDefault();
            nextBtn.click();
        }
    });

    foot.appendChild(cancelBtn);
    foot.appendChild(nextBtn);
    root.appendChild(foot);
    body.appendChild(root);

    let observer: MutationObserver | null = null;
    observer = typeof MutationObserver === "undefined" ? null : new MutationObserver(() => {
        if (!dialog.element.isConnected) release();
    });
    observer?.observe(document.body, {childList: true, subtree: true});

    let parsedItems: ExportedItem[] = [];
    let parsedText: string | null = null;
    let parserPromise: Promise<typeof import("../service/csv-tsv-import")> | null = null;

    const loadParser = async (): Promise<typeof import("../service/csv-tsv-import")> => {
        if (!parserPromise) parserPromise = import("../service/csv-tsv-import");
        return parserPromise;
    };

    const updatePreview = async (): Promise<void> => {
        if (!state.rawText.trim()) {
            setPreview(t("noData"));
            nextBtn.disabled = true;
            return;
        }

        try {
            const parser = await loadParser();
            const {delimiter, grid} = parser.parseDelimitedTable(state.rawText, state.delimiter);
            state.delimiter = delimiter;
            state.grid = grid;

            // 若尚未映射字段，自动触发初次智能推断（粘完立得识别，无需手动多点一次）
            const allUnset = Object.values(state.mapping).every((val) => val === -1);
            if (allUnset && grid.length > 0) {
                const inferred = inferColumnMapping(grid);
                state.mapping.titleIndex = inferred.titleIndex;
                state.mapping.contentIndex = inferred.contentIndex;
                state.mapping.categoryIndex = inferred.categoryIndex;
                state.mapping.tagsIndex = inferred.tagsIndex;
                state.mapping.aliasIndex = inferred.aliasIndex;
                state.mapping.urlIndex = inferred.urlIndex;
            }

            // 显示字段映射区域并同步动态选项
            mapRow.style.display = "block";
            syncMappingToUI();

            const result = parser.parseCsvTsvItems(state.rawText, state.delimiter, Date.now(), state.mapping);
            parsedItems = result.items.slice(0, 5);
            parsedText = state.rawText;

            const lines = [`解析出 ${result.validRows} 条（分隔符「${delimiter === "\t" ? "Tab" : delimiter === ";" ? "分号" : "逗号"}」）`];
            for (const item of parsedItems) {
                lines.push(`• ${item.title} (${item.itemType})`);
            }
            if (parsedItems.length < result.validRows) {
                lines.push(`· …+${result.validRows - parsedItems.length}`);
            }
            setPreview(lines.join("\n"));
            nextBtn.disabled = parsedItems.length === 0;
        } catch (err) {
            setPreview(t("importFailed", toErrorMessage(err).slice(0, 120)));
            nextBtn.disabled = true;
        }
    };

    const syncMappingToUI = (): void => {
        const headerRow = state.grid[0] || [];
        const selects = mappingGrid.querySelectorAll<HTMLSelectElement>(".xlc-wizard-select");
        for (const sel of Array.from(selects)) {
            const fieldName = sel.dataset.xlcControl?.replace("wizard.field.", "") as keyof typeof state.mapping;
            sel.innerHTML = "";

            const optNone = document.createElement("option");
            optNone.value = "-1";
            optNone.textContent = "（不映射）";
            sel.appendChild(optNone);

            for (let i = 0; i < headerRow.length; i++) {
                const opt = document.createElement("option");
                opt.value = String(i);
                const colName = (headerRow[i] || "").trim().slice(0, 16);
                opt.textContent = `第 ${i + 1} 列${colName ? ` (${colName})` : ""}`;
                sel.appendChild(opt);
            }

            if (fieldName && fieldName in state.mapping) {
                sel.value = String(state.mapping[fieldName]);
            }
        }
    };

    ta.addEventListener("input", () => {
        if (parseTimer) clearTimeout(parseTimer);
        state.rawText = ta.value;
        mapRow.style.display = "none";
        setPreview(t("loading"));
        nextBtn.disabled = true;
        parseTimer = setTimeout(() => { void updatePreview(); }, 400);
    });

    cancelBtn.addEventListener("click", () => {
        dialog.destroy();
        release();
    });

    ta.focus();
}
