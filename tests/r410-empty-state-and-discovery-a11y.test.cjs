"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const indexScss = fs.readFileSync(path.join(root, "src", "styles", "index.scss"), "utf8");
const dialogTs = fs.readFileSync(path.join(root, "src", "ui", "dialog.ts"), "utf8");
const discoveryTs = fs.readFileSync(path.join(root, "src", "ui", "discovery-dialog.ts"), "utf8");

test("T-0726 · 主搜索弹窗底栏工具栏 Toolbar 语义、统计状态度量与按键漫游轮巡", () => {
    // 1. 底栏 Toolbar 角色与无障碍标签
    assert.match(dialogTs, /footer\.setAttribute\("role",\s*"toolbar"\);/);
    assert.match(dialogTs, /footer\.setAttribute\("aria-label",\s*"主弹窗底栏工具栏"\);/);

    // 2. 底栏键盘按键漫游导航
    assert.match(dialogTs, /footer\.addEventListener\("keydown",\s*\(e:\s*any\)\s*=>\s*\{[\s\S]*?e\.key === "ArrowRight" \|\| e\.key === "ArrowLeft"/);

    // 3. 统计计数 role=status 与 aria-live
    assert.match(dialogTs, /count\.setAttribute\("role",\s*"status"\);/);
    assert.match(dialogTs, /count\.setAttribute\("aria-live",\s*"polite"\);/);
    assert.match(dialogTs, /count\.setAttribute\("aria-label",\s*"条目统计信息"\);/);

    // 4. 底栏操作按钮独立 aria-label 强化
    assert.match(dialogTs, /guide\.setAttribute\("aria-label",\s*this\.deps\.t\("usageGuideBtn"\)\);/);
    assert.match(dialogTs, /gear\.setAttribute\("aria-label",\s*this\.deps\.t\("openSettings"\)\);/);
    assert.match(dialogTs, /newBtn\.setAttribute\("aria-label",\s*this\.deps\.t\("quickNew"\)\);/);
});

test("T-0727 · 主搜索空状态 (Empty State) 状态播报、推荐操作按键漫游与全量按钮无障碍声明", () => {
    // 1. 空态容器 status 角色、实时播报与说明
    assert.match(dialogTs, /empty\.setAttribute\("role",\s*"status"\);/);
    assert.match(dialogTs, /empty\.setAttribute\("aria-live",\s*"polite"\);/);
    assert.match(dialogTs, /empty\.setAttribute\("aria-label",\s*"搜索结果为空提示"\);/);

    // 2. 空态推荐动作按键漫游
    assert.match(dialogTs, /empty\.addEventListener\("keydown",\s*\(e:\s*any\)\s*=>\s*\{[\s\S]*?button\.xlc-empty-action:not\(\[disabled\]\)/);

    // 3. 重试、使用指南、清空筛选、清空路径限制等按钮全量 aria-label 补齐
    assert.match(dialogTs, /retry\.setAttribute\("aria-label",\s*this\.deps\.t\("retry"\)\);/);
    assert.match(dialogTs, /guide\.setAttribute\("aria-label",\s*this\.deps\.t\("usageGuideBtn"\)\);/);
    assert.match(dialogTs, /clear\.setAttribute\("aria-label",\s*this\.deps\.t\("clearFilters"\)\);/);
    assert.match(dialogTs, /clearScopeBtn\.setAttribute\("aria-label",\s*"清除路径限定，在全库无限制搜索"\);/);
});

test("T-0728 · 资产发现对话框 (Discovery Dialog) 操作栏与筛选条 toolbar 语义、已选计数度量及无障碍强化", () => {
    // 1. 发现操作栏 toolbar 语义与按键漫游
    assert.match(discoveryTs, /footer\.setAttribute\("role",\s*"toolbar"\);/);
    assert.match(discoveryTs, /footer\.setAttribute\("aria-label",\s*"发现操作栏"\);/);
    assert.match(discoveryTs, /footer\.addEventListener\("keydown",\s*\(e:\s*any\)\s*=>\s*\{[\s\S]*?e\.key === "ArrowRight" \|\| e\.key === "ArrowLeft"/);

    // 2. 已选候选计数 status 角色与无障碍标签
    assert.match(discoveryTs, /this\.selectedLabel\.className = "xlc-form-hint xlc-discovery-selected-label";/);
    assert.match(discoveryTs, /this\.selectedLabel\.setAttribute\("role",\s*"status"\);/);
    assert.match(discoveryTs, /this\.selectedLabel\.setAttribute\("aria-live",\s*"polite"\);/);

    // 3. 筛选栏 toolbar 角色与关闭确认操作栏
    assert.match(discoveryTs, /filters\.setAttribute\("role",\s*"toolbar"\);/);
    assert.match(discoveryTs, /filters\.setAttribute\("aria-label",\s*"发现筛选工具栏"\);/);
    assert.match(discoveryTs, /actions\.setAttribute\("role",\s*"toolbar"\);/);
    assert.match(discoveryTs, /actions\.setAttribute\("aria-label",\s*"关闭确认操作栏"\);/);
    assert.match(discoveryTs, /cancel\.setAttribute\("aria-label",\s*this\.tx\("discoveryCloseCancel"\)\);/);
    assert.match(discoveryTs, /confirm\.setAttribute\("aria-label",\s*this\.tx\("discoveryCloseConfirm"\)\);/);

    // 4. 关闭与扫描按钮 aria-label 补全
    assert.match(discoveryTs, /this\.closeButton\.setAttribute\("aria-label",\s*this\.tx\("discoveryClose"\)\);/);
    assert.match(discoveryTs, /this\.scanButton\.setAttribute\("aria-label",\s*this\.tx\("discoveryCancelScan"\)\);/);
});

test("T-0729 · 底栏操作按钮、空态动作与发现操作区 24px 触控靶点、高对比度焦点环与样式收拢", () => {
    // 1. 空态操作按钮 28px 靶点与 focus-visible
    assert.match(indexScss, /\.xlc-empty-action\s*\{[\s\S]*?min-height:\s*28px;/);
    assert.match(indexScss, /\.xlc-empty-action\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);

    // 2. 底栏计数 tabular-nums 与齿轮/指南按钮 24px 靶点
    assert.match(indexScss, /\.xlc-footer-count\s*\{[\s\S]*?font-variant-numeric:\s*tabular-nums;/);
    assert.match(indexScss, /\.xlc-footer-count\s*\{[\s\S]*?letter-spacing:\s*-0\.01em;/);
    assert.match(indexScss, /:is\(\.xlc-footer-gear,\s*\.xlc-footer-guide\)\s*\{[\s\S]*?min-width:\s*24px;/);
    assert.match(indexScss, /:is\(\.xlc-footer-gear,\s*\.xlc-footer-guide\)\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);

    // 3. 发现对话框已选度量 tabular-nums 与按钮 28px 靶点
    assert.match(indexScss, /\.xlc-discovery-selected-label\s*\{[\s\S]*?font-variant-numeric:\s*tabular-nums;/);
    assert.match(indexScss, /\.xlc-discovery-head > \[data-xlc-discovery-action='close'\]\s*\{[\s\S]*?min-height:\s*28px;/);
    assert.match(indexScss, /\.xlc-discovery-footer\s*\{[\s\S]*?\.b3-button\s*\{[\s\S]*?min-height:\s*28px;/);

    // 4. prefers-reduced-motion 涵盖空态按钮、底栏操作与发现按钮
    assert.match(indexScss, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.xlc-empty-action,[\s\S]*?\.xlc-footer-gear,[\s\S]*?\.xlc-footer-guide,[\s\S]*?\.xlc-discovery-footer \.b3-button[\s\S]*?transition:\s*none !important;/);
});
