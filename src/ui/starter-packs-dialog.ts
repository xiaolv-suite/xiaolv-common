// 开箱即用套件中心对话框（Starter Packs Hub · CAND-037 / TODO-FEAT-032）
// 用户按需挑选、自由决定、随时一键启用预置资产库
// 纯 DOM 装配、零 innerHTML、强 XSS 免疫

import {Dialog} from "siyuan";
import {adaptSecondaryDialogForMobile, getDialogBody, isMobileDialogViewport, mountPlatformDialogTitleWrap} from "./dialog-dom";
import {
    STARTER_PACKS,
    StarterPackMeta,
    PROMPT_PACK_MD,
    PROMPT_PACK_NAME,
    REFORMULATION_PACK_MD,
    TASK_HORIZON_PACK_MD,
    CALLOUT_PACK_MD,
    ACADEMIC_CITATION_PACK_MD,
} from "../service/prompt-pack";
import {parseMarkdownPack} from "../service/import-markdown";

export interface StarterPacksHubDeps {
    t: (key: string, ...args: string[]) => string;
    notify?: (type: "info" | "error", message: string) => void;
    importStarterPackDirect: (markdown: string) => Promise<{ok: boolean; count: number}>;
    /** 在思源笔记本创建专属结构化文档并纳管（CAND-040 / TODO-FEAT-035） */
    createStarterPackDedicatedDoc?: (pack: StarterPackMeta) => Promise<{ok: boolean; count: number; docId?: string; hPath?: string}>;
    onImportSuccess?: () => void;
}

/** 扩展的全量开箱即用套件货架清单 */
export const ALL_HUB_PACKS: StarterPackMeta[] = [
    ...STARTER_PACKS,
    {
        id: "pack-general-demo",
        icon: "🌟",
        name: PROMPT_PACK_NAME,
        tagline: "地址/邮箱/联系方式/客服/代码/身份",
        description: "25项经典通用常用语综合示例包，覆盖日常生活、办公与研发基础高频件。",
        category: "综合通用",
        itemCount: 25,
        markdown: PROMPT_PACK_MD,
    },
    {
        id: "pack-callout",
        icon: "💡",
        name: "Callout 结构化提示包",
        tagline: "重点/注意/危险/成功等五类警告块",
        description: "专为思源笔记定制的现代 Callout 提示块语法模板，排版必备。",
        category: "笔记排版",
        itemCount: 5,
        markdown: CALLOUT_PACK_MD,
    },
    {
        id: "pack-supermemo",
        icon: "🔄",
        name: "渐进反思与间隔复习包",
        tagline: "SuperMemo式卡片思考与批判性反思",
        description: "深度思考与知识内化模板，助力构建长期复利知识体系。",
        category: "知识管理",
        itemCount: 6,
        markdown: REFORMULATION_PACK_MD,
    },
    {
        id: "pack-citation",
        icon: "📖",
        name: "学术引文与参考文献包",
        tagline: "专著/期刊/学位论文标准规范",
        description: "国标与英文引文规范，论文写作与学术笔记引用。",
        category: "学术科研",
        itemCount: 4,
        markdown: ACADEMIC_CITATION_PACK_MD,
    },
    {
        id: "pack-task-horizon",
        icon: "🎯",
        name: "Task Horizon 任务规划包",
        tagline: "日计划/周复盘/月度视界看板",
        description: "GTD 与时间管理模板，掌控每日待办与战略节奏。",
        category: "生产力规划",
        itemCount: 3,
        markdown: TASK_HORIZON_PACK_MD,
    },
];

export function openStarterPacksHubDialog(deps: StarterPacksHubDeps): Dialog {
    const isMobileModal = isMobileDialogViewport();
    const dialog = new Dialog({
        title: deps.t("starterPacksTitle") || "开箱即用套件市场 (Starter Packs Hub)",
        content: "",
        width: isMobileModal ? "100vw" : "min(720px, 94vw)",
    });
    // 令牌作用域（R431）：不加 host 类时 --xlc-* 全部失效，容器 padding 塌陷、关闭按钮贴出边缘
    dialog.element.querySelector(".b3-dialog__container")?.classList.add("xlc-dialog-host", "xlc-form-host");

    mountPlatformDialogTitleWrap(dialog.element, deps.t("starterPacksTitle") || "开箱即用套件市场 (Starter Packs Hub)");
    adaptSecondaryDialogForMobile(dialog, deps.t("close") || "关闭");

    const body = getDialogBody(dialog.element);
    if (!body) return dialog;

    const container = document.createElement("div");
    container.className = "xlc-starter-hub-container";
    container.dataset.xlcControl = "starter-hub.container";

    // 头部说明
    const header = document.createElement("div");
    header.className = "xlc-starter-hub-header";

    const titleEl = document.createElement("strong");
    titleEl.className = "xlc-starter-hub-header-title";
    titleEl.textContent = "📦 挑选适合您工作流的开箱即用套件（准备就绪，随时自主启用）：";

    const descEl = document.createElement("p");
    descEl.className = "xlc-starter-hub-header-desc";
    descEl.textContent = "所有套件条目均为纯净正文与规范属性，一键装入当前常用库。已存在的条目自动跳过，绝不重复污染您的库。";

    header.append(titleEl, descEl);

    // 套件列表卡片容器
    const listEl = document.createElement("div");
    listEl.className = "xlc-starter-hub-list";

    for (const pack of ALL_HUB_PACKS) {
        const itemCard = document.createElement("div");
        itemCard.className = "xlc-starter-hub-card";
        itemCard.dataset.xlcControl = `starter-hub.card.${pack.id}`;

        const cardMain = document.createElement("div");
        cardMain.className = "xlc-starter-hub-card-main";

        const cardTop = document.createElement("div");
        cardTop.className = "xlc-starter-hub-card-top";

        const iconSpan = document.createElement("span");
        iconSpan.className = "xlc-starter-hub-icon";
        iconSpan.textContent = pack.icon;

        const nameSpan = document.createElement("span");
        nameSpan.className = "xlc-starter-hub-name";
        nameSpan.textContent = pack.name;

        const countBadge = document.createElement("span");
        countBadge.className = "xlc-starter-hub-count";
        countBadge.textContent = `${pack.itemCount} 项条目`;

        cardTop.append(iconSpan, nameSpan, countBadge);

        const taglineEl = document.createElement("div");
        taglineEl.className = "xlc-starter-hub-tagline";
        taglineEl.textContent = pack.tagline;

        const descText = document.createElement("div");
        descText.className = "xlc-starter-hub-desc";
        descText.textContent = pack.description;

        cardMain.append(cardTop, taglineEl, descText);

        // 操作区：预览 + 一键启用
        const cardActs = document.createElement("div");
        cardActs.className = "xlc-starter-hub-card-acts";

        const previewBtn = document.createElement("button");
        previewBtn.type = "button";
        previewBtn.className = "b3-button b3-button--cancel xlc-starter-hub-preview-btn";
        previewBtn.dataset.xlcControl = `starter-hub.preview.${pack.id}`;
        previewBtn.textContent = "👁 查看内容";

        const previewDrawer = document.createElement("div");
        previewDrawer.className = "xlc-starter-hub-drawer";
        previewDrawer.style.display = "none";

        previewBtn.addEventListener("click", () => {
            const isShowing = previewDrawer.style.display !== "none";
            if (isShowing) {
                previewDrawer.style.display = "none";
                previewBtn.textContent = "👁 查看内容";
            } else {
                if (previewDrawer.children.length === 0) {
                    const parsed = parseMarkdownPack(pack.markdown);
                    for (const it of parsed.items) {
                        const previewRow = document.createElement("div");
                        previewRow.className = "xlc-starter-hub-preview-row";
                        const rowTitle = document.createElement("span");
                        rowTitle.className = "xlc-starter-hub-preview-title";
                        rowTitle.textContent = `• ${it.title}`;
                        const rowTag = document.createElement("span");
                        rowTag.className = "xlc-starter-hub-preview-tag";
                        rowTag.textContent = `#${it.category || "常用"}`;
                        previewRow.append(rowTitle, rowTag);
                        previewDrawer.appendChild(previewRow);
                    }
                }
                previewDrawer.style.display = "flex";
                previewBtn.textContent = "▲ 收起内容";
            }
        });

        const installBtn = document.createElement("button");
        installBtn.type = "button";
        installBtn.className = "b3-button xlc-btn-primary xlc-starter-hub-install-btn";
        installBtn.dataset.xlcControl = `starter-hub.install.${pack.id}`;
        installBtn.textContent = `＋ 一键启用 (${pack.itemCount}项)`;

        installBtn.addEventListener("click", async () => {
            installBtn.disabled = true;
            installBtn.textContent = "⏳ 正在装入...";
            try {
                const res = await deps.importStarterPackDirect(pack.markdown);
                if (res.ok) {
                    installBtn.textContent = "✓ 已启用";
                    installBtn.classList.remove("xlc-btn-primary");
                    installBtn.classList.add("b3-button--cancel");
                    deps.notify?.("info", `已成功将「${pack.name}」共 ${res.count} 项条目装入当前库！`);
                    deps.onImportSuccess?.();
                } else {
                    installBtn.disabled = false;
                    installBtn.textContent = `＋ 一键启用 (${pack.itemCount}项)`;
                    deps.notify?.("error", "装入失败，请稍后重试");
                }
            } catch {
                installBtn.disabled = false;
                installBtn.textContent = `＋ 一键启用 (${pack.itemCount}项)`;
                deps.notify?.("error", "装入失败，请稍后重试");
            }
        });

        if (deps.createStarterPackDedicatedDoc) {
            const createDocBtn = document.createElement("button");
            createDocBtn.type = "button";
            createDocBtn.className = "b3-button b3-button--cancel xlc-starter-hub-doc-btn";
            createDocBtn.dataset.xlcControl = `starter-hub.doc.${pack.id}`;
            createDocBtn.textContent = "📁 新建专属文档";
            createDocBtn.title = "在思源当前笔记本中创建专属结构化大纲文档并自动纳管";
            createDocBtn.addEventListener("click", async () => {
                createDocBtn.disabled = true;
                createDocBtn.textContent = "⏳ 创建中...";
                try {
                    const res = await deps.createStarterPackDedicatedDoc!(pack);
                    if (res.ok) {
                        createDocBtn.textContent = "✓ 文档已建";
                        deps.notify?.("info", `已在思源中成功创建《常用资产 · ${pack.name}》专属文档！`);
                        deps.onImportSuccess?.();
                    } else {
                        createDocBtn.disabled = false;
                        createDocBtn.textContent = "📁 新建专属文档";
                        deps.notify?.("error", "文档创建失败，请检查笔记本状态");
                    }
                } catch {
                    createDocBtn.disabled = false;
                    createDocBtn.textContent = "📁 新建专属文档";
                    deps.notify?.("error", "文档创建失败，请检查笔记本状态");
                }
            });
            cardActs.append(previewBtn, installBtn, createDocBtn);
        } else {
            cardActs.append(previewBtn, installBtn);
        }
        itemCard.append(cardMain, cardActs, previewDrawer);
        listEl.appendChild(itemCard);
    }

    // 底部关闭栏
    const footEl = document.createElement("div");
    footEl.className = "xlc-starter-hub-foot";

    const footTip = document.createElement("span");
    footTip.className = "xlc-starter-hub-foot-tip";
    footTip.textContent = "💡 您可随时在此挑选并启用新套件，所有内容均保存在您的思源笔记库中。";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "b3-button xlc-btn-primary";
    closeBtn.dataset.xlcControl = "starter-hub.close";
    closeBtn.textContent = deps.t("close") || "关闭";
    closeBtn.addEventListener("click", () => dialog.destroy());

    footEl.append(footTip, closeBtn);

    container.append(header, listEl, footEl);
    body.appendChild(container);

    return dialog;
}
