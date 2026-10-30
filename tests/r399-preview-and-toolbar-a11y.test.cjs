"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const indexScss = fs.readFileSync(path.join(root, "src", "styles", "index.scss"), "utf8");
const tokensScss = fs.readFileSync(path.join(root, "src", "styles", "tokens-r187.scss"), "utf8");
const dialogTs = fs.readFileSync(path.join(root, "src", "ui", "dialog.ts"), "utf8");
const previewRendererTs = fs.readFileSync(path.join(root, "src", "ui", "preview-renderer.ts"), "utf8");

test("UI/UX Pro Max · 搜索历史工具栏 toolbar 语义与水平按键轮巡漫游", () => {
    // 1. 搜索历史工具栏 toolbar 角色与无障碍名称
    assert.match(dialogTs, /historyBar\.setAttribute\("role",\s*"toolbar"\);/);
    assert.match(dialogTs, /historyBar\.setAttribute\("aria-label",\s*"搜索历史"\);/);

    // 2. 左右方向键漫游与 Home/End 直达
    assert.match(dialogTs, /if \(e\.key === "ArrowRight" \|\| e\.key === "ArrowLeft"\)/);
    assert.match(dialogTs, /const btns = Array\.from\(historyBar\.querySelectorAll<HTMLButtonElement>\("button"\)\);/);
    assert.match(dialogTs, /const nextIdx = e\.key === "ArrowRight"\s*\?\s*\(idx \+ 1\) % btns\.length/);

    // 3. 历史胶囊与清空按钮无障碍标签
    assert.match(dialogTs, /pill\.setAttribute\("aria-label",\s*pill\.title\);/);
    assert.match(dialogTs, /clearBtn\.setAttribute\("aria-label",\s*clearBtn\.title\);/);
});

test("UI/UX Pro Max · 常用标签筛选工具栏 toolbar、aria-pressed 状态机与键盘漫游", () => {
    // 1. 常用标签 toolbar 角色与无障碍名称
    assert.match(dialogTs, /quickPillsHost\.setAttribute\("role",\s*"toolbar"\);/);
    assert.match(dialogTs, /quickPillsHost\.setAttribute\("aria-label",\s*"常用标签筛选"\);/);

    // 2. 常用标签按钮语义与 pressed 状态
    assert.match(dialogTs, /btn\.setAttribute\("role",\s*"button"\);/);
    assert.match(dialogTs, /btn\.setAttribute\("aria-pressed",\s*isSelected \? "true" : "false"\);/);
    assert.match(dialogTs, /btn\.setAttribute\("aria-label",\s*isSelected \? `清除 #\$\{t\} 过滤` : `按 #\$\{t\} 过滤`\);/);

    // 3. 常用标签水平键盘漫游
    assert.match(dialogTs, /const btns = Array\.from\(quickPillsHost\.querySelectorAll<HTMLButtonElement>\("\.xlc-quick-pill"\)\);/);
    assert.match(dialogTs, /if \(e\.key === "Home" \|\| e\.key === "End"\)/);
});

test("UI/UX Pro Max · 详情预览代码与表格容器键盘聚焦滚动与 region 语义", () => {
    // 1. 代码块预览区 region 语义与可聚焦滚动
    assert.match(previewRendererTs, /pre\.className = "xlc-preview-code";\s*pre\.tabIndex = 0;[\s\S]*?pre\.setAttribute\("role",\s*"region"\);\s*pre\.setAttribute\("aria-label",\s*"代码预览"\);/);
    assert.match(previewRendererTs, /pre\.className = "xlc-preview-code xlc-preview-code--inline";\s*pre\.tabIndex = 0;[\s\S]*?pre\.setAttribute\("role",\s*"region"\);\s*pre\.setAttribute\("aria-label",\s*"代码块预览"\);/);

    // 2. 表格预览区横向滚动 region 语义
    assert.match(previewRendererTs, /wrap\.className = "xlc-md-table-wrap";\s*wrap\.tabIndex = 0;[\s\S]*?wrap\.setAttribute\("role",\s*"region"\);\s*wrap\.setAttribute\("aria-label",\s*"表格内容预览"\);/);
});

test("UI/UX Pro Max · 预览富文本 Callout 提示卡片语义声明与外链无障碍属性补全", () => {
    // 1. Callout 提示卡片 note 角色与无障碍名称
    assert.match(previewRendererTs, /card\.setAttribute\("role",\s*"note"\);/);
    assert.match(previewRendererTs, /card\.setAttribute\("aria-label",\s*`\$\{block\.calloutTitle \|\| block\.calloutType \|\| "NOTE"\} 提示卡片`\);/);

    // 2. 任务待办与链接无障碍标签
    assert.match(previewRendererTs, /checkbox\.setAttribute\("aria-label",\s*block\.rawText\.slice\(0, 40\) \|\| "任务待办状态"\);/);
    assert.match(previewRendererTs, /linkSpan\.setAttribute\("aria-label",\s*`\$\{inline\.text\} \(链接目标: \$\{inline\.url\}\)`\);/);
});

test("UI/UX Pro Max · 工具栏胶囊与预览容器 24px 触控靶点及高对比度焦点环规范", () => {
    // 1. 历史胶囊与快捷标签 24px 靶点与焦点环
    assert.match(indexScss, /\.xlc-history-pill\s*\{[\s\S]*?min-height:\s*24px;[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);
    assert.match(indexScss, /\.xlc-quick-filter-pills[\s\S]*?\.xlc-quick-pill\s*\{[\s\S]*?min-height:\s*24px;[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);

    // 2. 代码高亮块与表格容器聚焦轮廓
    assert.match(tokensScss, /\.xlc-preview-code\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);
    assert.match(tokensScss, /\.xlc-md-table-wrap\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);
    assert.match(tokensScss, /\.xlc-md-link\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);
});
