"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const indexScss = fs.readFileSync(path.join(root, "src", "styles", "index.scss"), "utf8");
const quickEditTs = fs.readFileSync(path.join(root, "src", "ui", "quick-edit.ts"), "utf8");
const dockTs = fs.readFileSync(path.join(root, "src", "ui", "dock-view.ts"), "utf8");
const exportSanitizerTs = fs.readFileSync(path.join(root, "src", "ui", "export-sanitizer-modal.ts"), "utf8");
const syncDiffTs = fs.readFileSync(path.join(root, "src", "ui", "sync-diff-modal.ts"), "utf8");

test("T-0701 · 全域快编弹窗表单可访问性、字数统计实时状态播报与操作栏 toolbar 语义", () => {
    // 1. textarea 关联说明与标签
    assert.match(quickEditTs, /textarea\.id = "xlc-quick-edit-textarea";/);
    assert.match(quickEditTs, /textarea\.setAttribute\("aria-label",\s*`\$\{deps\.t\("quickEditBlock"\)\} \(\$\{blockId\}\)`\);/);
    assert.match(quickEditTs, /textarea\.setAttribute\("aria-describedby",\s*"xlc-quick-edit-hint xlc-quick-edit-counter xlc-quick-edit-error"\);/);

    // 2. 动态字数统计 role="status" 与 aria-live="polite"
    assert.match(quickEditTs, /counter\.id = "xlc-quick-edit-counter";/);
    assert.match(quickEditTs, /counter\.setAttribute\("role",\s*"status"\);/);
    assert.match(quickEditTs, /counter\.setAttribute\("aria-live",\s*"polite"\);/);

    // 3. 错误提示 alert 语义
    assert.match(quickEditTs, /errHint\.id = "xlc-quick-edit-error";/);
    assert.match(quickEditTs, /errHint\.setAttribute\("role",\s*"alert"\);/);
    assert.match(quickEditTs, /errHint\.setAttribute\("aria-live",\s*"assertive"\);/);

    // 4. 操作按钮栏 toolbar 语义与水平/垂直漫游轮巡
    assert.match(quickEditTs, /btnRow\.setAttribute\("role",\s*"toolbar"\);/);
    assert.match(quickEditTs, /btnRow\.setAttribute\("aria-label",\s*"快编操作栏"\);/);
    assert.match(quickEditTs, /if \(e\.key === "ArrowRight" \|\| e\.key === "ArrowDown"\)/);
    assert.match(quickEditTs, /else if \(e\.key === "ArrowLeft" \|\| e\.key === "ArrowUp"\)/);
    assert.match(quickEditTs, /else if \(e\.key === "Home"\)/);
    assert.match(quickEditTs, /else if \(e\.key === "End"\)/);
});

test("T-0702 · 侧栏画板 (DockView) 顶栏工具栏、检索状态实时播报与列表容器 listbox 语义结构", () => {
    // 1. 顶栏 actions toolbar 语义与左右键盘漫游
    assert.match(dockTs, /actions\.setAttribute\("role",\s*"toolbar"\);/);
    assert.match(dockTs, /actions\.setAttribute\("aria-label",\s*"侧栏快捷动作栏"\);/);
    assert.match(dockTs, /if \(e\.key === "ArrowRight" \|\| e\.key === "ArrowDown"\)/);

    // 2. 搜索框 aria-label 与状态提示 live region
    assert.match(dockTs, /this\.searchInput\.setAttribute\("aria-label",/);
    assert.match(dockTs, /this\.statusText\.setAttribute\("role",\s*"status"\);/);
    assert.match(dockTs, /this\.statusText\.setAttribute\("aria-live",\s*"polite"\);/);

    // 3. 过滤 Chips 水平键盘漫游
    assert.match(dockTs, /this\.chipsContainer\.addEventListener\("keydown",\s*\(e\)\s*=>\s*\{/);

    // 4. 列表容器 listbox 角色与条目 option/aria-selected
    assert.match(dockTs, /this\.listContainer\.setAttribute\("role",\s*"listbox"\);/);
    assert.match(dockTs, /this\.listContainer\.setAttribute\("aria-label",\s*"常用资产列表"\);/);
    assert.match(dockTs, /row\.setAttribute\("role",\s*"option"\);/);
    assert.match(dockTs, /row\.setAttribute\("aria-selected",\s*index === this\.activeIndex \? "true" : "false"\);/);

    // 5. 分类折叠头 button 角色与 aria-expanded
    assert.match(dockTs, /groupHead\.setAttribute\("role",\s*"button"\);/);
    assert.match(dockTs, /groupHead\.setAttribute\("aria-expanded",\s*!isCollapsed \? "true" : "false"\);/);
    assert.match(dockTs, /if \(e\.key === "Enter" \|\| e\.key === " "\)\s*\{\s*e\.preventDefault\(\);\s*toggleGroup\(\);/);

    // 6. 抽屉预览 region 与操作栏 toolbar
    assert.match(dockTs, /this\.drawerContainer\.setAttribute\("role",\s*"region"\);/);
    assert.match(dockTs, /this\.drawerContainer\.setAttribute\("aria-label",\s*"资产抽屉预览"\);/);
    assert.match(dockTs, /foot\.setAttribute\("role",\s*"toolbar"\);/);
    assert.match(dockTs, /foot\.setAttribute\("aria-label",\s*"抽屉操作栏"\);/);
});

test("T-0703 · 导出脱敏与数据同步比对模态框操作栏 toolbar 语义与按键漫游轮巡", () => {
    // 1. 导出脱敏操作栏 toolbar 语义与按键漫游
    assert.match(exportSanitizerTs, /<div class="b3-dialog__action xlc-form-actions xlc-export-sanitizer-actions" role="toolbar" aria-label="脱敏选项操作栏">/);
    assert.match(exportSanitizerTs, /actionsToolbar\?\.addEventListener\("keydown",\s*\(e: any\)\s*=>\s*\{/);

    // 2. 同步比对统计卡片 toolbar 语义与按键漫游
    assert.match(syncDiffTs, /<div class="xlc-sync-summary-cards" role="toolbar" aria-label="同步状态筛选">/);
    assert.match(syncDiffTs, /else if \(e\.key === "ArrowRight" \|\| e\.key === "ArrowDown"\)/);

    // 3. 同步表格容器 region 角色
    assert.match(syncDiffTs, /<div class="xlc-sync-diff-table-container" tabindex="0" role="region" aria-label="同步变动明细表格">/);

    // 4. 同步底栏操作区 toolbar 与按键漫游
    assert.match(syncDiffTs, /<div class="b3-dialog__action xlc-sync-diff-actions" role="toolbar" aria-label="同步比对操作栏">/);
    assert.match(syncDiffTs, /footerToolbar\?\.addEventListener\("keydown",\s*\(e: any\)\s*=>\s*\{/);

    // 5. 模态框全局 Ctrl+Enter 快捷提交
    assert.match(syncDiffTs, /if \(\(e\.ctrlKey \|\| e\.metaKey\) && e\.key === "Enter"\) \{\s*if \(e\.repeat \|\| applying\) return;\s*e\.preventDefault\(\);\s*dialog\?\.destroy\(\);\s*void performApply\(\);/);
});

test("T-0704 · 快编、侧栏与同步弹窗 24px 触控靶点、高对比度焦点环与令牌化样式收拢", () => {
    // 1. 快编按钮高对比度焦点环与触控尺寸
    assert.match(indexScss, /\.xlc-quick-edit-actions\s*\{[\s\S]*?\.b3-button\s*\{[\s\S]*?min-height:\s*28px;/);
    assert.match(indexScss, /\.xlc-quick-edit-actions\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);

    // 2. 侧栏按钮与分类折叠头焦点环
    assert.match(indexScss, /\.xlc-dock-btn-icon\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);
    assert.match(indexScss, /\.xlc-dock-group-head\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);
    assert.match(indexScss, /\.xlc-dock-menu-item\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);

    // 3. 同步表格容器焦点环
    assert.match(indexScss, /\.xlc-sync-diff-table-container\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);

    // 4. prefers-reduced-motion 涵盖侧栏、快编与同步元素
    assert.match(indexScss, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.xlc-dock-row,[\s\S]*?\.xlc-quick-edit-actions \.b3-button[\s\S]*?transition:\s*none !important;/);
});
