// 全域块就地快编弹窗（Omni Block Quick Edit · G14）：
// 在搜索全域结果时，支持快捷就地微调思源块内容；
// 写入前遵循单块边界（单行正文或完整代码围栏），原地更新不拆块、不破坏排版层级。

import {Dialog} from "siyuan";
import {adaptSecondaryDialogForMobile, getDialogBody, isMobileDialogViewport, mountPlatformDialogTitleWrap} from "./dialog-dom";
import {validateOmniBlockUpdate} from "../service/omni-search";
import {toErrorMessage} from "../model/errors";
import {renderSafePreview} from "./preview-renderer";

export interface QuickEditDeps {
    t: (key: string, ...args: string[]) => string;
    updateBlock: (blockId: string, content: string) => Promise<{success: boolean; error?: string}>;
    notify: (type: "info" | "error", message: string) => void;
    onUpdated?: (blockId: string, newContent: string) => void;
}

export function openQuickEditDialog(
    deps: QuickEditDeps,
    blockId: string,
    initialContent: string,
): Dialog {
    let closed = false;
    let saving = false;
    let isPreviewOpen = false;
    let previewDebounce: ReturnType<typeof setTimeout> | null = null;
    const isMobileModal = isMobileDialogViewport();
    const prevActive = typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null;
    const dialog = new Dialog({
        title: `${deps.t("quickEditBlock")} (${blockId})`,
        content: "",
        width: isMobileModal ? "100vw" : "min(620px, 92vw)",
        destroyCallback: () => {
            closed = true;
            if (previewDebounce) {
                clearTimeout(previewDebounce);
                previewDebounce = null;
            }
            if (typeof window !== "undefined" && window.visualViewport) {
                window.visualViewport.removeEventListener("resize", handleViewport);
                window.visualViewport.removeEventListener("scroll", handleViewport);
            }
            try {
                prevActive?.focus();
            } catch {}
        },
    });

    mountPlatformDialogTitleWrap(dialog.element, `${deps.t("quickEditBlock")} (${blockId.slice(0, 15)})`);

    const containerDialog = dialog.element.querySelector(".b3-dialog__container") as HTMLElement | null;
    if (containerDialog) containerDialog.classList.add("xlc-form-host", "xlc-dialog-host");
    adaptSecondaryDialogForMobile(dialog, deps.t("cancel") || "关闭");
    const handleViewport = () => {
        if (!containerDialog || typeof window === "undefined" || !window.visualViewport) return;
        const offset = Math.max(0, window.innerHeight - window.visualViewport.height);
        containerDialog.style.paddingBottom = offset > 0 ? `${offset + 12}px` : "";
    };
    if (typeof window !== "undefined" && window.visualViewport) {
        window.visualViewport.addEventListener("resize", handleViewport);
        window.visualViewport.addEventListener("scroll", handleViewport, { passive: true });
    }

    const body = getDialogBody(dialog.element);
    const container = document.createElement("div");
    container.className = "xlc-quick-edit-container";

    const textarea = document.createElement("textarea");
    textarea.id = "xlc-quick-edit-textarea";
    textarea.className = "b3-text-field fn__block";
    textarea.style.height = "180px";
    textarea.style.resize = "vertical";
    textarea.style.minHeight = "130px";
    textarea.style.maxHeight = "50vh";
    textarea.style.fontFamily = "var(--b3-font-family-code)";
    textarea.style.fontSize = "13px";
    textarea.style.lineHeight = "1.5";
    textarea.value = initialContent;
    textarea.dataset.xlcControl = "quick-edit.textarea";
    if (typeof textarea.setAttribute === "function") {
        textarea.setAttribute("aria-label", `${deps.t("quickEditBlock")} (${blockId})`);
        textarea.setAttribute("aria-describedby", "xlc-quick-edit-hint xlc-quick-edit-counter xlc-quick-edit-error");
    }

    const previewBox = document.createElement("div");
    previewBox.id = "xlc-quick-edit-preview";
    previewBox.className = "xlc-quick-edit-preview";
    previewBox.dataset.xlcControl = "quick-edit.preview";
    previewBox.style.display = "none";
    if (typeof previewBox.setAttribute === "function") {
        previewBox.setAttribute("role", "region");
        previewBox.setAttribute("aria-label", "Markdown 实时语法色彩预览");
    }

    const previewToggleBtn = document.createElement("button");
    previewToggleBtn.type = "button";
    previewToggleBtn.className = "b3-button b3-button--text xlc-quick-edit-preview-btn";
    previewToggleBtn.dataset.xlcControl = "quick-edit.toggle-preview";
    previewToggleBtn.textContent = "👁 语法色彩";
    previewToggleBtn.title = "展开/折叠 Markdown 轻量语法色彩实时预览";
    if (typeof previewToggleBtn.setAttribute === "function") {
        previewToggleBtn.setAttribute("aria-label", previewToggleBtn.title);
        previewToggleBtn.setAttribute("aria-expanded", "false");
    }

    const updatePreview = () => {
        if (!isPreviewOpen) return;
        renderSafePreview(previewBox, textarea.value, "markdown");
    };

    previewToggleBtn.addEventListener("click", () => {
        isPreviewOpen = !isPreviewOpen;
        previewBox.style.display = isPreviewOpen ? "block" : "none";
        previewToggleBtn.setAttribute("aria-expanded", String(isPreviewOpen));
        previewToggleBtn.textContent = isPreviewOpen ? "✕ 隐藏色彩" : "👁 语法色彩";
        if (isPreviewOpen) updatePreview();
    });

    const footer = document.createElement("div");
    footer.className = "xlc-quick-edit-footer";

    const hint = document.createElement("span");
    hint.id = "xlc-quick-edit-hint";
    hint.className = "xlc-quick-edit-hint";
    hint.textContent = "Ctrl+Enter 保存 · Esc 取消";

    const counter = document.createElement("span");
    counter.id = "xlc-quick-edit-counter";
    counter.className = "xlc-quick-edit-counter";
    if (typeof counter.setAttribute === "function") {
        counter.setAttribute("role", "status");
        counter.setAttribute("aria-live", "polite");
    }
    const errHint = document.createElement("div");
    errHint.id = "xlc-quick-edit-error";
    errHint.className = "xlc-form-error";
    errHint.style.color = "var(--b3-theme-error)";
    errHint.style.fontSize = "12px";
    errHint.style.minHeight = "18px";
    errHint.style.display = "none";
    errHint.dataset.xlcControl = "quick-edit.error";
    if (typeof errHint.setAttribute === "function") {
        errHint.setAttribute("role", "alert");
        errHint.setAttribute("aria-live", "assertive");
    }

    const updateCount = () => {
        counter.textContent = `${textarea.value.length} 字符`;
        if (errHint.style.display !== "none") {
            errHint.style.display = "none";
            errHint.textContent = "";
        }
        if (isPreviewOpen) {
            if (previewDebounce) clearTimeout(previewDebounce);
            previewDebounce = setTimeout(updatePreview, 60);
        }
    };
    updateCount();
    textarea.addEventListener("input", updateCount);

    footer.appendChild(hint);
    footer.appendChild(previewToggleBtn);
    footer.appendChild(counter);

    const btnRow = document.createElement("div");
    btnRow.className = "xlc-quick-edit-actions";
    if (typeof btnRow.setAttribute === "function") {
        btnRow.setAttribute("role", "toolbar");
        btnRow.setAttribute("aria-label", "快编操作栏");
    }

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "b3-button b3-button--cancel";
    cancelBtn.textContent = deps.t("cancel");
    cancelBtn.dataset.xlcControl = "quick-edit.cancel";
    if (typeof cancelBtn.setAttribute === "function") {
        cancelBtn.setAttribute("aria-label", deps.t("cancel") || "取消快编");
    }
    cancelBtn.addEventListener("click", () => {
        if (saving) return;
        dialog.destroy();
    });

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "b3-button xlc-btn-primary";
    saveBtn.textContent = deps.t("saveChanges");
    saveBtn.dataset.xlcControl = "quick-edit.save";
    if (typeof saveBtn.setAttribute === "function") {
        saveBtn.setAttribute("aria-label", deps.t("saveChanges") || "保存修改");
    }

    btnRow.addEventListener("keydown", (e) => {
        const buttons = [cancelBtn, saveBtn].filter((b) => !b.disabled);
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

    const doSave = async () => {
        if (saving || closed) return;
        const val = textarea.value.trim();
        if (!val) {
            errHint.textContent = deps.t("captureContentRequired");
            errHint.style.display = "";
            return;
        }

        // 单块写前校验：原地更新他人块不能拆出兄弟块
        const check = validateOmniBlockUpdate(val);
        if (!check.valid) {
            errHint.textContent = check.error || "single-block validation error";
            errHint.style.display = "";
            deps.notify("error", check.error || "single-block validation error");
            return;
        }

        saving = true;
        saveBtn.disabled = true;
        cancelBtn.disabled = true;
        saveBtn.textContent = deps.t("loading");
        errHint.style.display = "none";

        try {
            const res = await deps.updateBlock(blockId, val);
            if (closed) return;
            saving = false;
            saveBtn.disabled = false;
            cancelBtn.disabled = false;
            saveBtn.textContent = deps.t("saveChanges");

            if (res.success) {
                deps.notify("info", deps.t("blockUpdated"));
                deps.onUpdated?.(blockId, val);
                dialog.destroy();
            } else {
                const msg = res.error || deps.t("kernelError", "failed to update");
                errHint.textContent = msg;
                errHint.style.display = "";
                deps.notify("error", msg);
            }
        } catch (err) {
            if (closed) return;
            saving = false;
            saveBtn.disabled = false;
            cancelBtn.disabled = false;
            saveBtn.textContent = deps.t("saveChanges");
            const msg = toErrorMessage(err) || deps.t("kernelError", "failed to update");
            errHint.textContent = msg;
            errHint.style.display = "";
            deps.notify("error", msg);
        }
    };

    saveBtn.addEventListener("click", () => void doSave());
    textarea.addEventListener("keydown", (e) => {
        if (e.isComposing || (e as KeyboardEvent).keyCode === 229) return;
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            if (e.repeat) return;
            e.preventDefault();
            void doSave();
        } else if (e.key === "Escape") {
            if (saving) return;
            e.preventDefault();
            dialog.destroy();
        }
    });

    container.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (saving) return;
            e.preventDefault();
            dialog.destroy();
            return;
        }
        if (e.key === "Tab") {
            const focusables = [textarea, cancelBtn, saveBtn].filter((el) => !el.disabled);
            if (focusables.length === 0) return;
            const idx = focusables.indexOf(document.activeElement as any);
            e.preventDefault();
            const nextIdx = e.shiftKey
                ? (idx - 1 + focusables.length) % focusables.length
                : (idx + 1) % focusables.length;
            focusables[nextIdx]?.focus();
        }
    });

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(saveBtn);

    container.appendChild(textarea);
    container.appendChild(footer);
    container.appendChild(previewBox);
    container.appendChild(errHint);
    container.appendChild(btnRow);

    if (body) {
        body.appendChild(container);
    }
    setTimeout(() => textarea.focus(), 50);

    return dialog;
}
