import {Dialog} from "siyuan";
import {PLUGIN_DISPLAY_VERSION} from "../constants";

/**
 * SiYuan 弹窗内容容器兼容层（R142 P0）。
 * 真实 v3.8.x 前端的 Dialog 内容容器是 .b3-dialog__body（旧版为 .b3-dialog__content）。
 * 此前全部弹窗用单一选择器查询，真实前端查不到即静默空壳——真机验收（R142）坐实。
 * 规则：一律经由本函数取挂载点；stub-dom 已对齐真实 __body 结构。
 */
export function getDialogBody(root: HTMLElement | Document): HTMLElement | null {
    return root.querySelector<HTMLElement>(".b3-dialog__body")
        ?? root.querySelector<HTMLElement>(".b3-dialog__content");
}

/**
 * 给思源原生 Dialog 标题栏装配统一的品牌标题栏规范（.lv-dialog-title-wrap）。
 * 包含 22×22 帝王紫底白标 + 标题 + 版本胶囊，重复调用保持幂等。
 */
export function mountPlatformDialogTitleWrap(
    dialogElement: HTMLElement | null | undefined,
    titleText: string,
    badgeText = PLUGIN_DISPLAY_VERSION,
    iconName = "iconXlcCommon",
): HTMLElement | null {
    if (!dialogElement || typeof dialogElement.querySelector !== "function") return null;
    const header = dialogElement.querySelector(".b3-dialog__header");
    const titleEl = header?.querySelector(".b3-dialog__title");
    if (!header || !titleEl) return null;
    const existing = header.querySelector(".lv-dialog-title-wrap") as HTMLElement | null;
    if (existing) return existing;

    const wrap = document.createElement("div");
    wrap.className = "lv-dialog-title-wrap";
    wrap.setAttribute("role", "heading");
    wrap.setAttribute("aria-level", "1");
    wrap.setAttribute("aria-label", `${titleText} ${badgeText ? `版本 ${badgeText}` : ""}`.trim());
    const iconSpan = document.createElement("span");
    iconSpan.className = "lv-dialog-title-icon";
    iconSpan.setAttribute("aria-hidden", "true");
    const safeIcon = (iconName || "iconXlcCommon").replace(/[^A-Za-z0-9_-]/g, "") || "iconXlcCommon";
    const svg = typeof document.createElementNS === "function"
        ? document.createElementNS("http://www.w3.org/2000/svg", "svg")
        : document.createElement("svg");
    const use = typeof document.createElementNS === "function"
        ? document.createElementNS("http://www.w3.org/2000/svg", "use")
        : document.createElement("use");
    use.setAttribute("xlink:href", `#${safeIcon}`);
    svg.appendChild(use);
    iconSpan.appendChild(svg);
    const titleSpan = document.createElement("span");
    titleSpan.className = "lv-dialog-title-text";
    titleSpan.textContent = titleText || "";
    wrap.append(iconSpan, titleSpan);
    if (badgeText) {
        const badgeSpan = document.createElement("span");
        badgeSpan.className = "lv-dialog-title-pill";
        badgeSpan.setAttribute("role", "status");
        badgeSpan.setAttribute("aria-label", `插件版本：${badgeText}`);
        badgeSpan.textContent = badgeText;
        wrap.appendChild(badgeSpan);
    }
    titleEl.textContent = "";
    titleEl.appendChild(wrap);
    return wrap;
}

export interface TextPromptDialogOptions {
    title: string;
    label: string;
    defaultValue?: string;
    placeholder?: string;
    allowEmpty?: boolean;
    maxLength?: number;
    confirmText?: string;
    cancelText?: string;
    controlId?: string;
    onConfirm: (value: string) => void;
}

/**
 * 替代在 Electron 宿主中被禁用的 window.prompt()，提供无障碍、支持 Enter/Esc 的单字段输入弹窗。
 */
export function openTextPromptDialog(options: TextPromptDialogOptions): Dialog {
    const dialog = new Dialog({
        title: options.title,
        content: "",
        width: "min(440px, 92vw)",
    });
    dialog.element.querySelector(".b3-dialog__container")?.classList.add("xlc-form-host");
    mountPlatformDialogTitleWrap(dialog.element, options.title);
    const body = getDialogBody(dialog.element);
    if (!body) {
        dialog.destroy();
        return dialog;
    }
    const form = document.createElement("form");
    form.className = "xlc-form xlc-prompt-form";
    form.noValidate = true;

    const field = document.createElement("label");
    field.className = "xlc-form-field";
    const caption = document.createElement("span");
    caption.className = "xlc-form-label";
    caption.textContent = options.label;
    const input = document.createElement("input");
    input.type = "text";
    input.className = "b3-text-field";
    if (options.controlId) input.dataset.xlcControl = options.controlId;
    if (options.maxLength) input.maxLength = options.maxLength;
    if (options.placeholder) input.placeholder = options.placeholder;
    input.value = options.defaultValue ?? "";
    field.append(caption, input);

    const actions = document.createElement("div");
    actions.className = "xlc-form-actions";
    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "b3-button b3-button--cancel";
    cancelBtn.textContent = options.cancelText || "取消";
    cancelBtn.addEventListener("click", () => dialog.destroy());

    const submitBtn = document.createElement("button");
    submitBtn.type = "submit";
    submitBtn.className = "b3-button xlc-btn-primary";
    submitBtn.textContent = options.confirmText || "确定";
    actions.append(cancelBtn, submitBtn);

    form.append(field, actions);
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const val = input.value;
        if (!options.allowEmpty && !val.trim()) {
            input.focus();
            return;
        }
        dialog.destroy();
        options.onConfirm(val);
    });
    body.appendChild(form);
    setTimeout(() => {
        input.focus();
        if (typeof input.select === "function") input.select();
    }, 0);
    return dialog;
}

/**
 * 替代阻塞式的 window.alert()，以非阻塞宿主弹窗展示统计或提示信息。
 */
export function openInfoDialog(title: string, lines: string[], closeText = "关闭"): Dialog {
    const dialog = new Dialog({
        title,
        content: "",
        width: "min(400px, 92vw)",
    });
    dialog.element.querySelector(".b3-dialog__container")?.classList.add("xlc-form-host");
    mountPlatformDialogTitleWrap(dialog.element, title);
    const body = getDialogBody(dialog.element);
    if (!body) {
        dialog.destroy();
        return dialog;
    }
    const wrap = document.createElement("div");
    wrap.className = "xlc-form";
    const list = document.createElement("div");
    list.className = "xlc-form-hint";
    for (const line of lines) {
        const row = document.createElement("div");
        row.textContent = line;
        list.appendChild(row);
    }
    const actions = document.createElement("div");
    actions.className = "xlc-form-actions";
    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "b3-button xlc-btn-primary";
    closeBtn.textContent = closeText;
    closeBtn.addEventListener("click", () => dialog.destroy());
    actions.appendChild(closeBtn);
    wrap.append(list, actions);
    body.appendChild(wrap);
    setTimeout(() => closeBtn.focus(), 0);
    return dialog;
}
