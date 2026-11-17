// 主题套件连环取用拼板组件（CAND-032 / TODO-FEAT-027）
// 对标 Mac 端知名剪贴板工具 Paste 的 Pinboard：
// 针对对公转账、开票资料、复杂填单等多项常用语连续出栈的痛点，
// 提供极简卡片拼板，点击秒级复制并高亮变绿标记完成进度，满足连环取用需求。
// 纯 DOM 装配、零 innerHTML、强 XSS 免疫。

import {Dialog} from "siyuan";
import {lvNotify} from "../libs/lv-notice-kit";
import {adaptSecondaryDialogForMobile, getDialogBody, isMobileDialogViewport, mountPlatformDialogTitleWrap} from "./dialog-dom";

export interface PinboardItem {
    id: string;
    title: string;
    content?: string;
    summary?: string;
}

export interface PinboardDeps {
    t: (key: string, ...args: string[]) => string;
    copyText: (text: string) => Promise<boolean>;
    notify?: (type: "info" | "error", message: string) => void;
}

export function openPinboardDialog(
    deps: PinboardDeps,
    title: string,
    items: PinboardItem[]
): Dialog {
    const isMobileModal = isMobileDialogViewport();
    const dialog = new Dialog({
        title: title || "连环取用拼板",
        content: "",
        width: isMobileModal ? "100vw" : "min(640px, 92vw)",
    });
    // 令牌作用域：与套件市场同源问题，缺 host 类时 --xlc-* 全部失效
    dialog.element.querySelector(".b3-dialog__container")?.classList.add("xlc-dialog-host", "xlc-form-host");

    mountPlatformDialogTitleWrap(dialog.element, title || "连环取用拼板");
    adaptSecondaryDialogForMobile(dialog, deps.t("close") || "关闭");

    const body = getDialogBody(dialog.element);
    if (!body) return dialog;

    const container = document.createElement("div");
    container.className = "xlc-pinboard-container";
    container.dataset.xlcControl = "pinboard.container";

    // 头部工具条：统计 + 重置
    const headBar = document.createElement("div");
    headBar.className = "xlc-pinboard-head";

    const titleEl = document.createElement("div");
    titleEl.className = "xlc-pinboard-title";
    titleEl.textContent = `📋 ${title}（共 ${items.length} 项，点击卡片即刻复制）：`;

    const progressEl = document.createElement("span");
    progressEl.className = "xlc-pinboard-progress";
    progressEl.textContent = `已复制 0 / ${items.length}`;

    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "b3-button b3-button--cancel xlc-pinboard-reset";
    resetBtn.dataset.xlcControl = "pinboard.reset";
    resetBtn.textContent = "重置进度";

    headBar.append(titleEl, progressEl, resetBtn);

    // 卡片网格
    const grid = document.createElement("div");
    grid.className = "xlc-pinboard-grid";
    grid.setAttribute("role", "list");

    const copiedSet = new Set<string>();

    const updateProgress = () => {
        progressEl.textContent = `已复制 ${copiedSet.size} / ${items.length}`;
    };

    resetBtn.addEventListener("click", () => {
        copiedSet.clear();
        updateProgress();
        grid.querySelectorAll(".xlc-pinboard-card").forEach((card) => {
            card.classList.remove("xlc-pinboard-card--copied");
            const status = card.querySelector(".xlc-pinboard-status");
            if (status) status.textContent = "点击复制";
        });
        deps.notify?.("info", "已重置拼板取用进度");
    });

    for (let i = 0; i < items.length; i++) {
        const it = items[i]!;
        const card = document.createElement("div");
        card.className = "xlc-pinboard-card";
        card.dataset.xlcControl = `pinboard.card.${i}`;
        card.setAttribute("role", "listitem");
        card.tabIndex = 0;

        const cardTop = document.createElement("div");
        cardTop.className = "xlc-pinboard-card-top";

        const ord = document.createElement("span");
        ord.className = "xlc-pinboard-ord";
        ord.textContent = String(i + 1);

        const cardTitle = document.createElement("strong");
        cardTitle.className = "xlc-pinboard-card-title";
        cardTitle.textContent = it.title || it.id;

        const statusBadge = document.createElement("span");
        statusBadge.className = "xlc-pinboard-status";
        statusBadge.textContent = "点击复制";

        cardTop.append(ord, cardTitle, statusBadge);

        const cardBody = document.createElement("div");
        cardBody.className = "xlc-pinboard-card-body";
        cardBody.textContent = (it.content || it.summary || "").slice(0, 120);

        card.append(cardTop, cardBody);

        const doCopy = async () => {
            const textToCopy = it.content || it.summary || "";
            const ok = await deps.copyText(textToCopy);
            if (ok) {
                copiedSet.add(it.id);
                card.classList.add("xlc-pinboard-card--copied");
                statusBadge.textContent = "✓ 已复制";
                updateProgress();
                lvNotify.inline(card, "已复制");
            } else {
                deps.notify?.("error", deps.t("copyFailed") || "复制失败");
            }
        };

        card.addEventListener("click", doCopy);
        card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                void doCopy();
            }
        });

        grid.appendChild(card);
    }

    // 底部关闭栏
    const footBar = document.createElement("div");
    footBar.className = "xlc-pinboard-foot";

    const tip = document.createElement("div");
    tip.className = "xlc-pinboard-tip";
    tip.textContent = "💡 支持一边在外部对公填单，一边点击上方卡片依次复制，无需重复搜索！";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "b3-button xlc-btn-primary";
    closeBtn.dataset.xlcControl = "pinboard.close";
    closeBtn.textContent = deps.t("close") || "关闭";
    closeBtn.addEventListener("click", () => dialog.destroy());

    footBar.append(tip, closeBtn);

    container.append(headBar, grid, footBar);
    body.appendChild(container);

    return dialog;
}
