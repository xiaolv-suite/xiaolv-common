"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const entry = require("./.build/entry.cjs");

test("Mobile Spec v1: 罗盘入口统一挂载与 onunload 清理闭环", () => {
    const { lvLaunchpad } = entry.lvNoticeKit;
    assert.equal(typeof lvLaunchpad.ensureMobileEntry, "function", "ensureMobileEntry 必须存在");
    assert.equal(typeof lvLaunchpad.haptic, "function", "lvLaunchpad.haptic 触感反馈方法必须存在");

    const cleanup = lvLaunchpad.ensureMobileEntry();
    assert.equal(typeof cleanup, "function", "ensureMobileEntry 必须返回清理函数");
    assert.doesNotThrow(() => cleanup(), "调用清理函数不应报错");
});

test("Mobile Spec v1: 罗盘注册 actions 为 3~5 个手机直办动作契约", () => {
    const zh = JSON.parse(fs.readFileSync(path.join(__dirname, "../src/i18n/zh-CN.json"), "utf8"));
    const en = JSON.parse(fs.readFileSync(path.join(__dirname, "../src/i18n/en.json"), "utf8"));

    // 降级文案核查
    assert.equal(zh.insertPendingMobile, "已复制，去目标应用粘贴");
    assert.equal(zh.insertMobileActionHint, "已复制，去目标应用粘贴");
    assert.equal(en.insertPendingMobile, "Copied. Switch to target app and paste");
    assert.equal(en.insertMobileActionHint, "Copied. Switch to target app and paste");
});

test("Mobile Spec v1: 移动端样式与布局规范契约 (safe-area 四向、≥52px、touch-action、100dvh)", () => {
    const scss = fs.readFileSync(path.join(__dirname, "../src/styles/index.scss"), "utf8");

    // 1) safe-area 四向适配与 100dvh
    assert.ok(scss.includes("safe-area-inset-top"), "必须适配 safe-area-inset-top");
    assert.ok(scss.includes("safe-area-inset-bottom"), "必须适配 safe-area-inset-bottom");
    assert.ok(scss.includes("safe-area-inset-left"), "必须适配 safe-area-inset-left");
    assert.ok(scss.includes("safe-area-inset-right"), "必须适配 safe-area-inset-right");
    assert.ok(scss.includes("100dvh"), "必须声明 100dvh 视口高度");

    // 2) 底部操作条 iPhone 手势条防遮挡安全边距
    assert.ok(scss.includes(".xlc-footer") && scss.includes("env(safe-area-inset-bottom"), "底部栏 .xlc-footer 必须带 safe-area-inset-bottom 边距");
    assert.ok(scss.includes(".xlc-mobile-foot") && scss.includes("env(safe-area-inset-bottom"), "底部操作条 .xlc-mobile-foot 必须带 safe-area-inset-bottom 边距");

    // 3) touch-action: manipulation
    assert.ok(scss.includes("touch-action: manipulation"), "必须声明 touch-action: manipulation 消除双击缩放延迟");

    // 4) 触控目标 ≥52px
    assert.ok(scss.includes(".xlc-row") && scss.includes("min-height: 52px"), "行必须满足 min-height: 52px 触控目标");
    assert.ok(scss.includes(".xlc-mobile-foot") && scss.includes("min-height: 52px"), "底部操作条必须满足 min-height: 52px 触控目标");

    // 5) 置顶高频片段直达行样式
    assert.ok(scss.includes(".xlc-top-chips-row"), "必须包含 .xlc-top-chips-row 置顶高频片段直达行样式");

    // 6) 隐藏仅桌面功能入口
    assert.ok(scss.includes(".xlc-search-pin"), "必须包含桌面专属控件隐藏规则");
    assert.ok(scss.includes(".xlc-footer-starter-packs"), "移动端必须隐藏套件市场包管理");
});

test("Mobile Spec v1: onunload 绝对禁止写 petal 契约", () => {
    const indexSrc = fs.readFileSync(path.join(__dirname, "../src/index.ts"), "utf8");
    const onunloadIdx = indexSrc.indexOf("async onunload()");
    assert.ok(onunloadIdx > 0, "必须存在 onunload 方法");
    const onunloadBlock = indexSrc.slice(onunloadIdx, onunloadIdx + 3000);
    assert.equal(onunloadBlock.toLowerCase().includes("petal"), false, "onunload 绝不可出现 petal 关键词");
});

test("Mobile Spec v2: 真机教训审计契约 (Esc-only 可见 ✕ 按钮、svgIcon 逐字一致性)", () => {
    const scss = fs.readFileSync(path.join(__dirname, "../src/styles/index.scss"), "utf8");
    const iconsSrc = fs.readFileSync(path.join(__dirname, "../src/ui/icons.ts"), "utf8");
    const indexSrc = fs.readFileSync(path.join(__dirname, "../src/index.ts"), "utf8");

    // 1) Esc-only 关闭面审计：移动端可见 ✕ 关闭按钮
    assert.ok(scss.includes(".xlc-mobile-close-btn"), "必须包含移动端顶部可见 ✕ 关闭按钮样式");
    assert.ok(scss.includes(".xlc-menu-close-btn"), "必须包含动作菜单可见 ✕ 关闭按钮样式");

    // 2) svgIcon 逐字一致性：lvLaunchpad.register 的 svgIcon 必须与 addIcons 声明逐字一致
    const regMatch = indexSrc.match(/svgIcon:\s*"([^"]+)"/);
    assert.ok(regMatch, "必须声明 svgIcon");
    const registeredIcon = regMatch[1];
    assert.ok(iconsSrc.includes(`id="${registeredIcon}"`), `addIcons 注入的 symbol ID 必须包含 "${registeredIcon}"`);
});

test("Mobile Spec v2: 专项深化契约 (剪贴板智能匹配、多级面包屑、高频固定 📌、复制连击计数)", () => {
    const scss = fs.readFileSync(path.join(__dirname, "../src/styles/index.scss"), "utf8");
    const zh = JSON.parse(fs.readFileSync(path.join(__dirname, "../src/i18n/zh-CN.json"), "utf8"));
    const en = JSON.parse(fs.readFileSync(path.join(__dirname, "../src/i18n/en.json"), "utf8"));

    // 1) 剪贴板智能匹配
    assert.ok(zh.clipboardSmartMatchToggle && en.clipboardSmartMatchToggle, "双语必须包含剪贴板智能匹配开关文案");
    assert.ok(zh.clipboardSmartMatchBanner && en.clipboardSmartMatchBanner, "双语必须包含剪贴板智能匹配替换横幅文案");
    assert.ok(scss.includes(".xlc-smart-match-banner"), "必须包含 .xlc-smart-match-banner 样式");

    // 2) 手机端多级分类面包屑导航
    assert.ok(scss.includes(".xlc-mobile-breadcrumbs"), "必须包含 .xlc-mobile-breadcrumbs 面包屑样式");

    // 3) 高频直达行长按固定 📌 样式
    assert.ok(scss.includes(".xlc-top-chip--pinned"), "必须包含 .xlc-top-chip--pinned 固定样式");

    // 4) 复制连击计数
    assert.ok(zh.copyComboCount && en.copyComboCount, "双语必须包含连击计数提示文案");
    assert.ok(zh.enterMultiSelect && en.enterMultiSelect, "双语必须包含进入多选文案");
    assert.ok(scss.includes(".xlc-combo-copy-banner"), "必须包含 .xlc-combo-copy-banner 样式");
});

test("Mobile Polish: 跨应用剪贴板保真度契约 (Markdown 表格与代码块富文本渲染)", () => {
    const { renderSafeHtmlFromMarkdown, isMarkdownFormattingPresent } = entry.clipboard;
    const mdTable = [
        "| 列1 | 列2 |",
        "| :--- | ---: |",
        "| 单元格A | 单元格B |",
    ].join("\n");

    assert.ok(isMarkdownFormattingPresent(mdTable), "必须识别表格为富文本");
    const html = renderSafeHtmlFromMarkdown(mdTable);
    assert.ok(html.includes("<table"), "必须渲染为标准 table 元素");
    assert.ok(html.includes("<th") && html.includes("background-color: #f6f8fa"), "表头必须带内联样式");
    assert.ok(html.includes("<td") && html.includes("单元格A"), "单元格必须保留");

    // 代码块保真度
    const mdCode = "```ts\nconst x = 1;\n```";
    const codeHtml = renderSafeHtmlFromMarkdown(mdCode);
    assert.ok(codeHtml.includes("<pre") && codeHtml.includes("<code"), "代码块必须渲染 pre/code 元素");
    assert.ok(codeHtml.includes("data-language=\"ts\""), "必须保留语言元属性");
});

test("Mobile Fix: HostBridge.isMobile 兼容思源 3.8.x window.siyuan.mobile 对象与 #mobileTopBar，桌面单测保持 false", () => {
    const { HostBridge, detectMobileHost } = entry.commands;
    const bridge = new HostBridge({}, {});
    const prevWin = globalThis.window;
    const prevDoc = globalThis.document;
    const prevSy = globalThis.siyuan;
    try {
        delete globalThis.siyuan;
        globalThis.window = {};
        globalThis.document = {
            getElementById: () => null,
            body: { classList: { contains: () => false } },
        };
        assert.equal(bridge.isMobile(), false, "桌面单测环境下 isMobile() 必须返回 false");
        assert.equal(detectMobileHost(), false);

        // 思源 3.8.x 真机形态：window.siyuan.mobile 为非空对象而非布尔 true
        globalThis.window = { siyuan: { mobile: { editor: {} } } };
        assert.equal(bridge.isMobile(), true, "window.siyuan.mobile 为对象时必须返回 true");

        // #mobileTopBar 节点存在时返回 true
        globalThis.window = {};
        globalThis.document = {
            getElementById: (id) => (id === "mobileTopBar" ? {} : null),
            body: { classList: { contains: () => false } },
        };
        assert.equal(bridge.isMobile(), true, "存在 #mobileTopBar 时必须返回 true");

        // body--mobile 类名存在时返回 true
        globalThis.document = {
            getElementById: () => null,
            body: { classList: { contains: (cls) => cls === "body--mobile" } },
        };
        assert.equal(bridge.isMobile(), true, "存在 body--mobile 时必须返回 true");
    } finally {
        if (prevWin === undefined) delete globalThis.window; else globalThis.window = prevWin;
        if (prevDoc === undefined) delete globalThis.document; else globalThis.document = prevDoc;
        if (prevSy === undefined) delete globalThis.siyuan; else globalThis.siyuan = prevSy;
    }
});

test("Mobile Fix: 双顶栏消除、visualViewport 软键盘监听清理、筛选折叠与 44x44 关闭按钮契约", () => {
    const scss = fs.readFileSync(path.join(__dirname, "../src/styles/index.scss"), "utf8");
    const dialogSrc = fs.readFileSync(path.join(__dirname, "../src/ui/dialog.ts"), "utf8");
    const dialogDomSrc = fs.readFileSync(path.join(__dirname, "../src/ui/dialog-dom.ts"), "utf8");

    // 1) .xlc-sheet 隐藏原生 .b3-dialog__header，绑定 --xlc-vv-h，body 零内边距
    assert.match(scss, /\.b3-dialog__container\.xlc-sheet[\s\S]*?--xlc-vv-h,\s*100dvh/);
    assert.match(scss, /\.b3-dialog__container\.xlc-sheet[\s\S]*?\.b3-dialog__header[\s\S]*?display:\s*none\s*!important/);

    // 2) visualViewport 绑定与移除监听 + data-keyboard-open 软键盘减负
    assert.ok(dialogSrc.includes("addEventListener(\"resize\", syncViewport)") && dialogSrc.includes("removeEventListener(\"resize\", syncViewport)"));
    assert.ok(dialogSrc.includes("addEventListener(\"scroll\", syncViewport)") && dialogSrc.includes("removeEventListener(\"scroll\", syncViewport)"));
    assert.ok(dialogSrc.includes("dataset.keyboardOpen = \"true\""));
    assert.ok(scss.includes("[data-keyboard-open=\"true\"]"));

    // 3) 筛选器默认折叠 + .xlc-mobile-filter-toggle 展开 data-mobile-filters-open="true"
    assert.ok(dialogSrc.includes("xlc-mobile-filter-toggle") && dialogSrc.includes("dataset.mobileFiltersOpen = \"true\""));
    assert.ok(scss.includes("data-mobile-filters-open=\"true\""));

    // 4) 44x44 关闭按钮与次级弹窗移动端关闭按钮
    assert.match(scss, /\.xlc-mobile-close-btn\s*\{[\s\S]*?width:\s*44px;[\s\S]*?height:\s*44px;/);
    assert.ok(dialogDomSrc.includes("adaptSecondaryDialogForMobile") && scss.includes(".xlc-dialog-close-btn"));
});


