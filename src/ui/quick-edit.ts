// 全域块就地快编弹窗（Omni Block Quick Edit · G14）：
// 在搜索全域结果时，支持快捷就地微调思源块内容；
// 写入前严格遵循 B-006 单行正文或完整代码围栏边界约束，杜绝破坏排版层级。

import {Dialog} from "siyuan";
import {getDialogBody, mountPlatformDialogTitleWrap} from "./dialog-dom";
import {validateOmniBlockUpdate} from "../service/omni-search";
import {toErrorMessage} from "../model/errors";

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
    const prevActive = typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null;
    const dialog = new Dialog({
        title: `${deps.t("quickEditBlock")} (${blockId})`,
        content: "",
        width: "min(620px, 92vw)",
        destroyCallback: () => {
            closed = true;
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
    const handleViewport = () => {
        if (!containerDialog || typeof window === "undefined" || !window.visualViewport) return;
        const offset = Math.max(0, window.innerHeight - window.visualViewport.height);
        containerDialog.style.paddingBottom = offset > 0 ? `${offset + 12}px` : "";
    };
    if (typeof window !== "undefined" && window.visualViewport) {
        window.visualViewport.addEventListener("resize", handleViewport);
        window.visualViewport.addEventListener("scroll", handleViewport);
    }

    const body = getDialogBody(dialog.element);
    const container = document.createElement("div");
    container.className = "xlc-quick-edit-container";

    const textarea = document.createElement("textarea");
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

    const footer = document.createElement("div");
    footer.className = "xlc-quick-edit-footer";

    const hint = document.createElement("span");
    hint.className = "xlc-quick-edit-hint";
    hint.textContent = "Ctrl+Enter 保存 · Esc 取消";

    const counter = document.createElement("span");
    counter.className = "xlc-quick-edit-counter";
    const updateCount = () => {
        counter.textContent = `${textarea.value.length} 字符`;
    };
    updateCount();
    textarea.addEventListener("input", updateCount);

    footer.appendChild(hint);
    footer.appendChild(counter);

    const errHint = document.createElement("div");
    errHint.className = "xlc-form-error";
    errHint.style.color = "var(--b3-theme-error)";
    errHint.style.fontSize = "12px";
    errHint.style.minHeight = "18px";
    errHint.style.display = "none";
    errHint.dataset.xlcControl = "quick-edit.error";

    const btnRow = document.createElement("div");
    btnRow.className = "xlc-quick-edit-actions";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "b3-button b3-button--cancel";
    cancelBtn.textContent = deps.t("cancel");
    cancelBtn.dataset.xlcControl = "quick-edit.cancel";
    cancelBtn.addEventListener("click", () => {
        if (saving) return;
        dialog.destroy();
    });

    const saveBtn = document.createElement("button");
    saveBtn.className = "b3-button xlc-btn-primary";
    saveBtn.textContent = deps.t("saveChanges");
    saveBtn.dataset.xlcControl = "quick-edit.save";

    const doSave = async () => {
        if (saving || closed) return;
        const val = textarea.value.trim();
        if (!val) {
            errHint.textContent = deps.t("captureContentRequired");
            errHint.style.display = "";
            return;
        }

        // B-006 写前校验
        const check = validateOmniBlockUpdate(val);
        if (!check.valid) {
            errHint.textContent = check.error || "B-006 validation error";
            errHint.style.display = "";
            deps.notify("error", check.error || "B-006 validation error");
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
    container.appendChild(errHint);
    container.appendChild(btnRow);

    if (body) {
        body.appendChild(container);
    }
    setTimeout(() => textarea.focus(), 50);

    return dialog;
}
