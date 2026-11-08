// 常用条目便携分享卡片组件（TODO-FEAT-010 / CAND-011）
// 纯 DOM、零 innerHTML、无 XSS 风险：将单条资产编码为 xlc-bundle 紧凑字符串并提供可视化卡片与一键复制

import {Dialog} from "siyuan";
import {lvNotify} from "../libs/lv-notice-kit";
import {adaptSecondaryDialogForMobile, getDialogBody, isMobileDialogViewport, mountPlatformDialogTitleWrap} from "./dialog-dom";

export interface ShareCardDeps {
    t: (key: string, ...args: string[]) => string;
    copyText: (text: string) => Promise<boolean>;
    notify?: (type: "info" | "error", message: string) => void;
}

export interface ShareCardItem {
    id: string;
    title: string;
    itemType: string;
    category?: string;
    tags?: string[];
    summary?: string;
    varCount?: number;
}

export function openShareCardDialog(
    deps: ShareCardDeps,
    item: ShareCardItem,
    shareCode: string,
): Dialog {
    const isMobileModal = isMobileDialogViewport();
    const dialog = new Dialog({
        title: deps.t("shareCardTitle") || "常用条目便携分享卡片",
        content: "",
        width: isMobileModal ? "100vw" : "min(560px, 92vw)",
    });
    // 令牌作用域：与套件市场同源问题，缺 host 类时 --xlc-* 全部失效
    dialog.element.querySelector(".b3-dialog__container")?.classList.add("xlc-dialog-host", "xlc-form-host");

    mountPlatformDialogTitleWrap(dialog.element, deps.t("shareCardTitle") || "常用条目便携分享卡片");
    adaptSecondaryDialogForMobile(dialog, deps.t("close") || "关闭");

    const body = getDialogBody(dialog.element);
    if (!body) return dialog;

    const container = document.createElement("div");
    container.className = "xlc-share-card-container";
    container.dataset.xlcControl = "share-card.container";

    // 条目身份卡片
    const metaBox = document.createElement("div");
    metaBox.className = "xlc-share-card-meta";

    const titleRow = document.createElement("div");
    titleRow.className = "xlc-share-card-title-row";

    const typeBadge = document.createElement("span");
    typeBadge.className = "xlc-badge";
    typeBadge.textContent = item.itemType || "text";

    const titleEl = document.createElement("strong");
    titleEl.className = "xlc-share-card-title";
    titleEl.textContent = item.title || item.id;

    titleRow.append(typeBadge, titleEl);
    metaBox.appendChild(titleRow);

    const tagsRow = document.createElement("div");
    tagsRow.className = "xlc-share-card-tags";
    if (item.category) {
        const catChip = document.createElement("span");
        catChip.className = "xlc-share-chip xlc-share-chip--category";
        catChip.textContent = `📁 ${item.category}`;
        tagsRow.appendChild(catChip);
    }
    if (item.tags && item.tags.length > 0) {
        for (const t of item.tags.slice(0, 4)) {
            const tagChip = document.createElement("span");
            tagChip.className = "xlc-share-chip";
            tagChip.textContent = `#${t.replace(/^#/, "")}`;
            tagsRow.appendChild(tagChip);
        }
    }
    if (item.varCount && item.varCount > 0) {
        const varChip = document.createElement("span");
        varChip.className = "xlc-share-chip xlc-share-chip--var";
        varChip.textContent = `⚡ ${item.varCount} 变量`;
        tagsRow.appendChild(varChip);
    }
    if (tagsRow.children.length > 0) {
        metaBox.appendChild(tagsRow);
    }

    if (item.summary) {
        const preview = document.createElement("div");
        preview.className = "xlc-share-card-preview";
        preview.textContent = item.summary.slice(0, 300);
        metaBox.appendChild(preview);
    }

    // 分享码区域
    const codeSec = document.createElement("div");
    codeSec.className = "xlc-share-card-code-sec";

    const codeLabel = document.createElement("div");
    codeLabel.className = "xlc-share-card-label";
    codeLabel.textContent = "📋 便携分享码（Base64 紧凑格式，防篡改校验）：";

    const textarea = document.createElement("textarea");
    textarea.className = "b3-text-field fn__block xlc-share-card-textarea";
    textarea.readOnly = true;
    textarea.value = shareCode;
    textarea.rows = 4;
    textarea.setAttribute("aria-label", "便携分享码");
    textarea.dataset.xlcControl = "share-card.textarea";
    textarea.addEventListener("click", () => textarea.select());

    codeSec.append(codeLabel, textarea);

    // 提示栏
    const tip = document.createElement("div");
    tip.className = "xlc-share-card-tip";
    tip.textContent = deps.t("shareCardTip") || "💡 对方无需任何配置，直接在小驴常用主搜索框中粘贴此分享码（Ctrl+V），即可秒级自动导入！";

    // 底部按钮栏
    const foot = document.createElement("div");
    foot.className = "xlc-share-card-actions";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "b3-button b3-button--cancel";
    closeBtn.textContent = deps.t("close") || "关闭";
    closeBtn.dataset.xlcControl = "share-card.close";
    closeBtn.addEventListener("click", () => dialog.destroy());

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "b3-button xlc-btn-primary";
    copyBtn.textContent = deps.t("shareCardCopy") || "⧉ 复制分享码";
    copyBtn.dataset.xlcControl = "share-card.copy";
    copyBtn.addEventListener("click", async () => {
        const ok = await deps.copyText(shareCode);
        if (ok) {
            lvNotify.inline(copyBtn, "已复制");
        } else {
            deps.notify?.("error", deps.t("copyFailed") || "复制失败");
        }
    });

    foot.append(closeBtn, copyBtn);

    container.append(metaBox, codeSec, tip, foot);
    body.appendChild(container);

    return dialog;
}
