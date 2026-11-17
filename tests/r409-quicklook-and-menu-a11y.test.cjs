"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const indexScss = fs.readFileSync(path.join(root, "src", "styles", "index.scss"), "utf8");
const dialogTs = fs.readFileSync(path.join(root, "src", "ui", "dialog.ts"), "utf8");

test("T-0721 · 极速预览模态浮层 QuickLook 显式关闭按钮与标题栏 Toolbar 语义", () => {
    // 1. QuickLook 标题栏 toolbar 角色与说明
    assert.match(dialogTs, /head\.setAttribute\("role",\s*"toolbar"\);/);
    assert.match(dialogTs, /head\.setAttribute\("aria-label",\s*"极速预览标题栏"\);/);
    assert.match(dialogTs, /hints\.setAttribute\("role",\s*"note"\);/);

    // 2. 显式关闭按钮与点击联动
    assert.match(dialogTs, /closeBtn\.setAttribute\("aria-label",\s*"关闭极速预览"\);/);
    assert.match(dialogTs, /closeBtn\.addEventListener\("click",\s*\(\)\s*=>\s*this\.closeQuickLook\(\)\);/);
});

test("T-0722 · 极速预览元数据度量 tabular-nums 排版与可访问性声明", () => {
    // 1. meta 容器 status 角色与无障碍标签
    assert.match(dialogTs, /meta\.setAttribute\("role",\s*"status"\);/);
    assert.match(dialogTs, /meta\.setAttribute\("aria-label",\s*`条目元数据：\$\{entry\.itemType\}`\);/);

    // 2. 样式表 tabular-nums 与微字距
    assert.match(indexScss, /\.xlc-quicklook-meta\s*\{[\s\S]*?font-variant-numeric:\s*tabular-nums;/);
    assert.match(indexScss, /\.xlc-quicklook-meta\s*\{[\s\S]*?letter-spacing:\s*-0\.01em;/);
});

test("T-0723 · 动作菜单摘要预览盒 region 语义与菜单按钮全量 aria-label 强化", () => {
    // 1. 摘要预览盒 region 角色与键盘可聚焦
    assert.match(dialogTs, /previewBox\.tabIndex = 0;/);
    assert.match(dialogTs, /previewBox\.setAttribute\("role",\s*"region"\);/);
    assert.match(dialogTs, /previewBox\.setAttribute\("aria-label",\s*"原文摘要预览"\);/);

    // 2. 菜单分组 group 角色与分组名
    assert.match(dialogTs, /sec1\.setAttribute\("role",\s*"group"\);/);
    assert.match(dialogTs, /sec1\.setAttribute\("aria-label",\s*"主要操作"\);/);

    // 3. menuButton 统一为所有操作项配置 aria-label
    assert.match(dialogTs, /btn\.setAttribute\("aria-label",\s*label\);/);
});

test("T-0724 · QuickLook 关闭按钮与菜单预览容器 24px 触控靶点、高对比度焦点环与样式收拢", () => {
    // 1. QuickLook 关闭按钮 24px 靶点与 focus-visible
    assert.match(indexScss, /\.xlc-quicklook-close\s*\{[\s\S]*?min-width:\s*24px;[\s\S]*?min-height:\s*24px;/);
    assert.match(indexScss, /\.xlc-quicklook-close\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);

    // 2. 菜单预览容器 focus-visible 焦点环
    assert.match(indexScss, /\.xlc-menu-preview\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);

    // 3. prefers-reduced-motion 涵盖关闭按钮与预览容器
    assert.match(indexScss, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.xlc-quicklook-close,[\s\S]*?\.xlc-menu-preview[\s\S]*?transition:\s*none !important;/);
});
