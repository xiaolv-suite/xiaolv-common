// 剪贴板历史晋升常用语片段微弹窗（断点消除战役 · Promote Clipboard to Snippet）
// 核心使命：剪贴板里闪现的好代码好文案，一键"转正"为永久常用片段——进入 frecency 排序与 :简码 直达
import {Dialog} from "siyuan";
import {lvLaunchpad, lvSurfaceStack} from "../libs/lv-notice-kit";
import {cleanShortcode, parseSnippetAnnotations} from "../model/item";
import {SearchEntry} from "../model/search";
import {adaptSecondaryDialogForMobile, getDialogBody, isMobileDialogViewport, mountPlatformDialogTitleWrap} from "./dialog-dom";

export interface PromoteClipPayload {
    markdown: string;
    title: string;
    shortcode: string;
    category: string;
    tags: string[];
}

export interface PromoteClipDialogOptions {
    t: (key: string, ...args: string[]) => string;
    entry: SearchEntry;
    categories: string[];
    defaultCategory?: string;
    entries: readonly SearchEntry[];
    onPromote: (payload: PromoteClipPayload) => Promise<boolean>;
    notify?: (kind: "info" | "error", message: string) => void;
}

/** 换行符归一化并完整保留文本特殊符号（保真红线：杜绝转义丢失） */
export function normalizePromoteContent(raw: string): string {
    if (!raw || typeof raw !== "string") return "";
    return raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

/** 简码唯一性校验纯函数（冲突返回 true 及被占用的条目标题） */
export function checkShortcodeConflict(
    shortcode: string,
    entries: readonly { id?: string; shortcode?: string; title?: string }[],
    excludeId?: string
): { conflict: boolean; itemTitle?: string } {
    const clean = cleanShortcode(shortcode);
    if (!clean) return { conflict: false };
    const match = entries.find((e) => e.id !== excludeId && cleanShortcode(e.shortcode) === clean);
    return { conflict: Boolean(match), itemTitle: match?.title };
}

/**
 * 打开剪贴板转正微弹窗（微 Dialog / Popover 形式，Esc + ✕ 可关）
 */
export function openPromoteClipDialog(options: PromoteClipDialogOptions): Dialog {
    const t = options.t;
    const isMobileModal = isMobileDialogViewport();
    const dialogTitle = "⭐ " + (t("promoteToCommon") || "存为常用片段");
    const dialog = new Dialog({
        title: dialogTitle,
        content: "",
        width: isMobileModal ? "100vw" : "min(460px, 92vw)",
        height: "auto",
        destroyCallback: () => {
            surfaceUnreg();
        },
    });

    const container = dialog.element.querySelector<HTMLElement>(".b3-dialog__container");
    if (container) {
        container.classList.add("xlc-promote-clip-host", "xlc-form-host");
    }
    mountPlatformDialogTitleWrap(dialog.element, dialogTitle);
    adaptSecondaryDialogForMobile(dialog, t("close") || "关闭");

    // 接入生态焦点栈：Esc 捕获阶段秒关且阻止事件冒泡
    const surfaceUnreg = lvSurfaceStack.push({
        id: "xlc-promote-clip-dialog",
        type: "dialog",
        dismiss: () => {
            dialog.destroy();
            return true;
        },
    });

    const body = getDialogBody(dialog.element);
    if (!body) return dialog;
    body.innerHTML = "";

    const form = document.createElement("div");
    form.className = "xlc-form xlc-promote-form";

    // 1. 内容预览与微调区（预填纯文本，换行符归一化，完整保留特殊符号）
    const contentLabel = document.createElement("label");
    contentLabel.className = "xlc-form-field";
    const contentTitle = document.createElement("span");
    contentTitle.className = "xlc-form-label";
    contentTitle.textContent = "片段正文内容";
    contentLabel.appendChild(contentTitle);

    const rawText = options.entry.content || options.entry.summary || options.entry.title || "";
    // R432 真机实证：剪贴板原文带尾部注解（如 18988889999@紧急报障电话）时，
    // 预填必须先过注解剥离，否则纯净正文承诺落空、库内出现带注解的脏条目
    const annotationParsed = parseSnippetAnnotations(rawText);
    const normalizedText = normalizePromoteContent(annotationParsed.cleanText);
    const textarea = document.createElement("textarea");
    textarea.className = "b3-text-field xlc-promote-content";
    textarea.rows = 4;
    textarea.value = normalizedText;
    textarea.dataset.xlcControl = "promote.content";
    textarea.setAttribute("aria-label", "片段正文内容");
    contentLabel.appendChild(textarea);
    form.appendChild(contentLabel);

    // 2. 简码名称输入框（自动聚焦，实时唯一性校验）
    const scField = document.createElement("label");
    scField.className = "xlc-form-field";
    const scTitle = document.createElement("span");
    scTitle.className = "xlc-form-label";
    scTitle.textContent = t("shortcode") || "简码 (:shortcode)";
    scField.appendChild(scTitle);

    const scInput = document.createElement("input");
    scInput.type = "text";
    scInput.className = "b3-text-field xlc-promote-shortcode";
    scInput.placeholder = t("shortcodePlaceholder") || "如 :wk、:bug（选填，输入即置顶直达）";
    scInput.dataset.xlcControl = "promote.shortcode";
    scInput.setAttribute("aria-label", t("shortcode") || "简码");
    scField.appendChild(scInput);

    // 轻量红字提示容器
    const statusHint = document.createElement("div");
    statusHint.className = "xlc-shortcode-status";
    statusHint.style.cssText = "font-size:12px; margin-top:4px; display:none; color:var(--b3-theme-error);";
    scField.appendChild(statusHint);
    form.appendChild(scField);

    // 3. 分组下拉选择框（默认选中上次使用分组）
    const catField = document.createElement("label");
    catField.className = "xlc-form-field";
    const catTitle = document.createElement("span");
    catTitle.className = "xlc-form-label";
    catTitle.textContent = t("category") || "分组分类";
    catField.appendChild(catTitle);

    const catSelect = document.createElement("select");
    catSelect.className = "b3-select xlc-promote-category";
    catSelect.dataset.xlcControl = "promote.category";
    catSelect.setAttribute("aria-label", t("category") || "分组分类");

    const allCategories = Array.from(new Set([
        "常用",
        ...(options.defaultCategory ? [options.defaultCategory] : []),
        ...(options.categories || []),
    ].filter(Boolean)));

    for (const cat of allCategories) {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        catSelect.appendChild(opt);
    }
    const defaultCat = options.defaultCategory || "常用";
    catSelect.value = allCategories.includes(defaultCat) ? defaultCat : (allCategories[0] || "常用");
    catField.appendChild(catSelect);
    form.appendChild(catField);

    // 4. 底部操作栏（取消与确认按钮，动态按钮补 type="button"）
    const foot = document.createElement("div");
    foot.className = "xlc-form-actions";
    foot.style.cssText = "display:flex; justify-content:flex-end; gap:8px; margin-top:16px;";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "b3-button b3-button--cancel";
    cancelBtn.textContent = t("cancel") || "取消";
    cancelBtn.dataset.xlcControl = "promote.cancel";
    cancelBtn.addEventListener("click", () => dialog.destroy());

    const submitBtn = document.createElement("button");
    submitBtn.type = "button";
    submitBtn.className = "b3-button xlc-btn-primary";
    submitBtn.textContent = (t("save") || "转正保存") + " (Ctrl+Enter)";
    submitBtn.dataset.xlcControl = "promote.submit";

    // 实时唯一性校验
    const validateShortcode = (): boolean => {
        const val = scInput.value.trim();
        if (!val) {
            statusHint.style.display = "none";
            statusHint.textContent = "";
            submitBtn.disabled = false;
            return true;
        }
        const check = checkShortcodeConflict(val, options.entries, options.entry.id);
        if (check.conflict) {
            const clean = cleanShortcode(val);
            statusHint.textContent = `⚠️ 简码 ${clean} 已被「${check.itemTitle || "其他条目"}」占用`;
            statusHint.style.display = "block";
            submitBtn.disabled = true;
            return false;
        } else {
            statusHint.style.display = "none";
            statusHint.textContent = "";
            submitBtn.disabled = false;
            return true;
        }
    };

    scInput.addEventListener("input", validateShortcode);

    let isSubmitting = false;
    const doSubmit = async () => {
        if (isSubmitting) return;
        if (!validateShortcode()) return;
        const finalContent = normalizePromoteContent(textarea.value);
        if (!finalContent.trim()) {
            options.notify?.("error", "正文内容不能为空");
            textarea.focus();
            return;
        }

        const rawSc = scInput.value.trim();
        const finalShortcode = rawSc ? cleanShortcode(rawSc) : "";
        const cleanTitle = (options.entry.title || "").replace(/^[📋🔍☵★☆✦✓\s]+/, "").trim()
            || (finalShortcode ? finalShortcode.replace(/^:/, "") : finalContent.slice(0, 24).trim());

        isSubmitting = true;
        submitBtn.disabled = true;
        submitBtn.textContent = "保存中…";

        try {
            const ok = await options.onPromote({
                markdown: finalContent,
                title: cleanTitle,
                shortcode: finalShortcode,
                category: catSelect.value || "常用",
                tags: Array.from(new Set(["剪贴板", ...(options.entry.tags || [])].filter(Boolean))),
            });
            if (ok) {
                // 转正生效反馈：轻触感 haptic(10)
                lvLaunchpad.haptic(10);
                dialog.destroy();
            } else {
                submitBtn.disabled = false;
                submitBtn.textContent = (t("save") || "转正保存") + " (Ctrl+Enter)";
            }
        } catch (err) {
            submitBtn.disabled = false;
            submitBtn.textContent = (t("save") || "转正保存") + " (Ctrl+Enter)";
        } finally {
            isSubmitting = false;
        }
    };

    submitBtn.addEventListener("click", () => void doSubmit());
    foot.append(cancelBtn, submitBtn);
    form.appendChild(foot);
    body.appendChild(form);

    // 键盘监听：Ctrl+Enter 快捷提交（补 IME isComposing 守卫）与 Esc 关闭
    form.addEventListener("keydown", (ev: KeyboardEvent) => {
        if (ev.key === "Escape") {
            ev.preventDefault();
            ev.stopPropagation();
            dialog.destroy();
            return;
        }
        if ((ev.ctrlKey || ev.metaKey) && ev.key === "Enter") {
            // IME isComposing 守卫：中文输入法选词回车不触发提交
            if (ev.isComposing || ev.keyCode === 229) return;
            ev.preventDefault();
            ev.stopPropagation();
            void doSubmit();
        }
    });

    // 自动聚焦简码输入框
    setTimeout(() => {
        scInput.focus();
    }, 60);

    return dialog;
}
