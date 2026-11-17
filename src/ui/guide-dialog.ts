import {Dialog} from "siyuan";
import {adaptSecondaryDialogForMobile, getDialogBody, isMobileDialogViewport, mountPlatformDialogTitleWrap} from "./dialog-dom";

export interface GuideDialogDeps {
    t: (key: string, ...args: string[]) => string;
    isMobile?: () => boolean;
    onOpenSearch?: () => void;
}

let activeGuideDialog: Dialog | null = null;

/**
 * 交互式分步新手实操指引弹窗（Step-by-step Interactive Guide）
 * 一步步教大家怎么使用小驴常用：呼出检索、手机/邮箱智能注解剥离、极速插入复制与思源双向联动。
 */
export function openStepByStepGuideDialog(deps: GuideDialogDeps): void {
    if (activeGuideDialog?.element?.isConnected) {
        activeGuideDialog.element.querySelector<HTMLElement>("button, input")?.focus();
        return;
    }
    activeGuideDialog = null;

    const t = deps.t;
    const isMobileModal = (deps.isMobile?.() ?? false) || isMobileDialogViewport();
    const dialogTitle = t("stepGuideTitle") || "新手实操使用指引";

    const dialog = new Dialog({
        title: dialogTitle,
        content: "",
        width: isMobileModal ? "100vw" : "min(680px, 94vw)",
        height: isMobileModal ? "100dvh" : "min(680px, 92vh)",
    });
    activeGuideDialog = dialog;

    mountPlatformDialogTitleWrap(dialog.element, dialogTitle, "实操引导", "iconXlcCommon");
    dialog.element.querySelector(".b3-dialog__container")?.classList.add("xlc-form-host", "xlc-guide-host");
    adaptSecondaryDialogForMobile(dialog, t("close") || "关闭");

    const body = getDialogBody(dialog.element);
    if (!body) return;
    body.innerHTML = "";

    const root = document.createElement("div");
    root.className = "xlc-form xlc-guide xlc-guide-stepper-root";

    // 顶部副标题
    const subIntro = document.createElement("p");
    subIntro.className = "xlc-form-hint xlc-guide-subtitle";
    subIntro.textContent = t("stepGuideSub") || "4 步掌握高频常用语极速复用技能，告别重复输入";
    root.appendChild(subIntro);

    // 顶部步骤指示器
    const stepperNav = document.createElement("div");
    stepperNav.className = "xlc-stepper-nav";
    stepperNav.setAttribute("role", "tablist");
    stepperNav.setAttribute("aria-label", "引导步骤");

    const stepTitles = [
        t("stepGuideStep1") || "① 呼出与检索",
        t("stepGuideStep2") || "② 手机/邮箱注解",
        t("stepGuideStep3") || "③ 极速复用与关闭",
        t("stepGuideStep4") || "④ 变量与双向联动",
    ];

    let currentStep = 0;
    const tabButtons: HTMLButtonElement[] = [];

    stepTitles.forEach((title, idx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `xlc-stepper-tab ${idx === 0 ? "xlc-stepper-tab--active" : ""}`;
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-selected", idx === 0 ? "true" : "false");
        btn.textContent = title;
        btn.dataset.step = String(idx);
        btn.addEventListener("click", () => switchStep(idx));
        tabButtons.push(btn);
        stepperNav.appendChild(btn);
    });
    root.appendChild(stepperNav);

    // 步骤内容容器
    const contentArea = document.createElement("div");
    contentArea.className = "xlc-guide-content-area";
    root.appendChild(contentArea);

    // 底部操作栏
    const footActions = document.createElement("div");
    footActions.className = "xlc-form-actions xlc-guide-foot-actions";

    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "b3-button b3-button--cancel xlc-guide-prev-btn";
    prevBtn.textContent = t("stepGuidePrev") || "上一步";
    prevBtn.style.display = "none";
    prevBtn.addEventListener("click", () => {
        if (currentStep > 0) switchStep(currentStep - 1);
    });

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "b3-button xlc-btn-primary xlc-guide-next-btn";
    nextBtn.textContent = t("stepGuideNext") || "下一步";
    nextBtn.addEventListener("click", () => {
        if (currentStep < stepTitles.length - 1) {
            switchStep(currentStep + 1);
        } else {
            dialog.destroy();
            deps.onOpenSearch?.();
        }
    });

    footActions.append(prevBtn, nextBtn);
    root.appendChild(footActions);
    body.appendChild(root);

    function switchStep(index: number): void {
        currentStep = index;
        tabButtons.forEach((btn, idx) => {
            const active = idx === index;
            btn.classList.toggle("xlc-stepper-tab--active", active);
            btn.setAttribute("aria-selected", active ? "true" : "false");
        });

        prevBtn.style.display = index === 0 ? "none" : "";
        nextBtn.textContent = index === stepTitles.length - 1 ? (t("stepGuideFinish") || "完成引导 · 开始体验") : (t("stepGuideNext") || "下一步");

        contentArea.innerHTML = "";
        const panel = document.createElement("section");
        panel.className = "xlc-guide-step-panel";
        panel.setAttribute("role", "tabpanel");

        if (index === 0) {
            renderStep1(panel);
        } else if (index === 1) {
            renderStep2(panel);
        } else if (index === 2) {
            renderStep3(panel);
        } else {
            renderStep4(panel);
        }
        contentArea.appendChild(panel);
    }

    // Step 1: 随时呼出与闪电检索
    function renderStep1(container: HTMLElement): void {
        container.innerHTML = `
            <div class="xlc-guide-card">
                <div class="xlc-guide-card-head">
                    <span class="xlc-guide-card-icon">⚡</span>
                    <strong>随时随地，键盘秒级呼出</strong>
                </div>
                <p class="xlc-guide-card-text">
                    无需在多个窗口间切来切去寻找备忘录。在思源笔记中，您有两个极速呼出入口：
                </p>
                <div class="xlc-guide-feature-grid">
                    <div class="xlc-guide-feature-box">
                        <span class="xlc-guide-kbd">Alt + Shift + C</span>
                        <div class="xlc-guide-box-title">打开检索</div>
                        <div class="xlc-guide-box-desc">默认快捷键，可在思源快捷键设置中修改。跨应用迷你条默认使用 Alt + Shift + M。</div>
                    </div>
                    <div class="xlc-guide-feature-box">
                        <span class="xlc-guide-kbd">/常用</span>
                        <div class="xlc-guide-box-title">编辑器原生 Slash 菜单</div>
                        <div class="xlc-guide-box-desc">在任意思源笔记文档正文中直接输入 <code>/常用</code> 原生激活，无缝嵌入当前光标段落。</div>
                    </div>
                </div>
            </div>

            <div class="xlc-guide-card" style="margin-top: 12px;">
                <div class="xlc-guide-card-head">
                    <span class="xlc-guide-card-icon">🔍</span>
                    <strong>支持汉字与拼音混合模糊检索</strong>
                </div>
                <p class="xlc-guide-card-text">
                    即使只记得一两个字，也能瞬间定位：
                </p>
                <ul class="xlc-guide-bullet-list">
                    <li><strong>拼音首字母检索</strong>：如输入 <code>sjh</code> 即可命中「常用手机号」，输入 <code>yx</code> 即可命中「工作邮箱」；</li>
                    <li><strong>多关键词 AND 匹配</strong>：支持空格分隔多个词，如 <code>手机 备用</code> 同时命中。</li>
                </ul>
            </div>
        `;
    }

    // Step 2: 手机/邮箱智能注解规则
    function renderStep2(container: HTMLElement): void {
        container.innerHTML = `
            <div class="xlc-guide-card">
                <div class="xlc-guide-card-head">
                    <span class="xlc-guide-card-icon">🏷️</span>
                    <strong>智能注解规则：检索靠关键字，输出自动剥离纯净正文</strong>
                </div>
                <p class="xlc-guide-card-text">
                    <strong>传统痛点</strong>：纯数字电话容易忘；但如果在电话后写上「张三手机」，插入时又得手动删掉后面的汉字，非常繁琐。<br>
                    <strong>小驴常用解法</strong>：输入时带注解，检索时搜关键字；<strong>插入与复制时，插件自动剥离注解，只输出纯净内容！</strong>
                </p>

                <div class="xlc-guide-demo-box">
                    <div class="xlc-guide-demo-row">
                        <div class="xlc-guide-demo-col">
                            <div class="xlc-guide-demo-badge">您录入的格式（带尾部注解）</div>
                            <code class="xlc-guide-code-block">18588888888@手机号</code>
                            <code class="xlc-guide-code-block" style="margin-top:6px;">contact@domain.com @工作邮箱</code>
                            <code class="xlc-guide-code-block" style="margin-top:6px;">13800138000 // 备用电话</code>
                            <code class="xlc-guide-code-block" style="margin-top:6px;">[公司税号] 91110108MA00000000</code>
                        </div>
                        <div class="xlc-guide-demo-arrow">➔ 按 Enter 插入</div>
                        <div class="xlc-guide-demo-col">
                            <div class="xlc-guide-demo-badge xlc-guide-demo-badge--success">实际插入/复制的纯净正文</div>
                            <code class="xlc-guide-code-block xlc-guide-code-clean">18588888888</code>
                            <code class="xlc-guide-code-block xlc-guide-code-clean" style="margin-top:6px;">contact@domain.com</code>
                            <code class="xlc-guide-code-block xlc-guide-code-clean" style="margin-top:6px;">13800138000</code>
                            <code class="xlc-guide-code-block xlc-guide-code-clean" style="margin-top:6px;">91110108MA00000000</code>
                        </div>
                    </div>
                </div>

                <p class="xlc-form-hint" style="margin-top: 10px; font-size: 12px;">
                    ✨ <strong>智能保护机制</strong>：对于 <code>user@domain.com</code> 这种标准合法邮箱，内部 @ 字符受严格保护绝不误删，仅识别尾部注解。
                </p>
            </div>
        `;
    }

    // Step 3: 极速复用与自动关闭
    function renderStep3(container: HTMLElement): void {
        container.innerHTML = `
            <div class="xlc-guide-card">
                <div class="xlc-guide-card-head">
                    <span class="xlc-guide-card-icon">🚀</span>
                    <strong>一气呵成：操作完成弹窗自动退出</strong>
                </div>
                <p class="xlc-guide-card-text">
                    为了让打字写作的心流不被打断，插入或复制成功后，搜索面板会自动退出，焦点瞬间回归思源编辑器光标处。
                </p>
                <div class="xlc-guide-feature-grid">
                    <div class="xlc-guide-feature-box">
                        <span class="xlc-guide-kbd">Enter</span>
                        <div class="xlc-guide-box-title">直接插入正文</div>
                        <div class="xlc-guide-box-desc">将选中的常用语直接注入光标所在块，弹窗自动关闭。</div>
                    </div>
                    <div class="xlc-guide-feature-box">
                        <span class="xlc-guide-kbd">Ctrl + Enter</span>
                        <div class="xlc-guide-box-title">复制到剪贴板</div>
                        <div class="xlc-guide-box-desc">将剥离后的核心纯文本送入剪贴板，供外部软件秒贴，弹窗自动关闭。</div>
                    </div>
                    <div class="xlc-guide-feature-box">
                        <span class="xlc-guide-kbd">Alt + 1~9</span>
                        <div class="xlc-guide-box-title">数字键瞬发直达</div>
                        <div class="xlc-guide-box-desc">输入关键词后，无需上下移动光标，直接按 Alt+1 即插入第 1 项，Alt+Shift+1 复制第 1 项。</div>
                    </div>
                    <div class="xlc-guide-feature-box">
                        <span class="xlc-guide-kbd">Alt + P</span>
                        <div class="xlc-guide-box-title">固定模式（Pin）</div>
                        <div class="xlc-guide-box-desc">需要连续向文档插入多段常用语时，按 Alt+P 钉住面板，插入后窗口保持打开。</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Step 4: 动态变量与思源双向联动
    function renderStep4(container: HTMLElement): void {
        container.innerHTML = `
            <div class="xlc-guide-card">
                <div class="xlc-guide-card-head">
                    <span class="xlc-guide-card-icon">🧩</span>
                    <strong>动态变量表单：智能插值</strong>
                </div>
                <p class="xlc-guide-card-text">
                    模板中支持写灵活的动态占位符，调用时动态展开：
                </p>
                <div class="xlc-guide-tag-list">
                    <span class="xlc-badge"><code>{{xlc:date}}</code> 当天日期</span>
                    <span class="xlc-badge"><code>{{xlc:time}}</code> 当前时间</span>
                    <span class="xlc-badge"><code>{{xlc:clipboard}}</code> 剪贴板文本</span>
                    <span class="xlc-badge"><code>{{xlc:ask:客户姓名}}</code> 弹窗填写</span>
                    <span class="xlc-badge"><code>{{xlc:cursor}}</code> 插入后光标落点</span>
                </div>
            </div>

            <div class="xlc-guide-card" style="margin-top: 12px;">
                <div class="xlc-guide-card-head">
                    <span class="xlc-guide-card-icon">🔗</span>
                    <strong>思源笔记双向联动与原块直达</strong>
                </div>
                <p class="xlc-guide-card-text">
                    条目本质是您思源笔记文档中的真实物理块，永不丢失：
                </p>
                <ul class="xlc-guide-bullet-list">
                    <li><strong>双向引用模式</strong>：支持插入为原生块引用 <code>((block_id '锚文本'))</code> 或嵌入块 <code>{{select * from blocks where id='...'}}</code>；</li>
                    <li><strong>一键直达原块</strong>：在预览面板点击「📦 库内原块」，即可直接跳转打开思源笔记对应文档并精确定位高亮该块！</li>
                </ul>
            </div>

            <div class="xlc-guide-media-examples" style="margin-top: 12px;" aria-labelledby="xlc-guide-media-title">
                <p id="xlc-guide-media-title" class="xlc-form-label">真实资源示例（需先在思源添加）</p>
                <ul class="xlc-guide-media-list">
                    <li data-xlc-control="guide.media.image">图片 / 身份证照片：先将图片添加到思源，再保存为常用条目。</li>
                    <li data-xlc-control="guide.media.attachment">公司介绍 PPT、PDF、DOCX：先拖入思源生成附件，支持复制和打开资源链接。</li>
                    <li data-xlc-control="guide.media.resume">简历：正文可作为超级块保存，文件版需先在思源添加。</li>
                </ul>
            </div>
        `;
    }

    // 默认展示第 1 步
    switchStep(0);
}
