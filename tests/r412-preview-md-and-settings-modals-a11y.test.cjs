"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const indexScss = fs.readFileSync(path.join(root, "src", "styles", "index.scss"), "utf8");
const tokensScss = fs.readFileSync(path.join(root, "src", "styles", "tokens-r187.scss"), "utf8");
const previewRendererTs = fs.readFileSync(path.join(root, "src", "ui", "preview-renderer.ts"), "utf8");
const settingsDialogTs = fs.readFileSync(path.join(root, "src", "ui", "settings-dialog.ts"), "utf8");

test("T-0736 · Markdown 预览渲染引擎 heading/note/listitem 语义及表格等宽排版", () => {
    // 1. Markdown 标题 role=heading 与 aria-level
    assert.match(previewRendererTs, /el\.setAttribute\("role",\s*"heading"\);[\s\S]*?el\.setAttribute\("aria-level",\s*"1"\);/);
    assert.match(previewRendererTs, /el\.setAttribute\("role",\s*"heading"\);[\s\S]*?el\.setAttribute\("aria-level",\s*"2"\);/);
    assert.match(previewRendererTs, /el\.setAttribute\("role",\s*"heading"\);[\s\S]*?el\.setAttribute\("aria-level",\s*"3"\);/);

    // 2. 引用块 role=note 与可访问标签
    assert.match(previewRendererTs, /el\.setAttribute\("role",\s*"note"\);/);
    assert.match(previewRendererTs, /el\.setAttribute\("aria-label",\s*"引用文本"\);/);

    // 3. 列表项与任务项 role=listitem
    assert.match(previewRendererTs, /block\.type === "list-bullet"[\s\S]*?el\.setAttribute\("role",\s*"listitem"\);/);
    assert.match(previewRendererTs, /block\.type === "list-ordered"[\s\S]*?el\.setAttribute\("role",\s*"listitem"\);/);
    assert.match(previewRendererTs, /block\.type === "task-item"[\s\S]*?el\.setAttribute\("role",\s*"listitem"\);/);

    // 4. Markdown 表格等宽排版与字距微调
    assert.match(tokensScss, /\.xlc-md-table\s*\{[\s\S]*?font-variant-numeric:\s*tabular-nums;/);
    assert.match(tokensScss, /\.xlc-md-table\s*\{[\s\S]*?letter-spacing:\s*-0\.01em;/);
});

test("T-0737 · 模板包导出弹窗操作栏与元数据徽标 toolbar/status 语义及键盘漫游", () => {
    // 1. 元数据徽标 status 角色与实时播报
    assert.match(settingsDialogTs, /meta\.setAttribute\("role",\s*"status"\);/);
    assert.match(settingsDialogTs, /meta\.setAttribute\("aria-live",\s*"polite"\);/);
    assert.match(settingsDialogTs, /countBadge\.setAttribute\("role",\s*"status"\);/);

    // 2. 导出操作栏 toolbar 语义与按键漫游
    assert.match(settingsDialogTs, /actions\.setAttribute\("role",\s*"toolbar"\);/);
    assert.match(settingsDialogTs, /actions\.setAttribute\("aria-label",\s*"模板包导出操作栏"\);/);
    assert.match(settingsDialogTs, /actions\.addEventListener\("keydown",\s*\(e:\s*any\)\s*=>\s*\{[\s\S]*?e\.key === "ArrowRight" \|\| e\.key === "ArrowLeft"/);

    // 3. 导出按钮与脱敏配置按钮独立 aria-label
    assert.match(settingsDialogTs, /cancelBtn\.setAttribute\("aria-label",\s*t\("cancel"\)\);/);
    assert.match(settingsDialogTs, /exportBtn\.setAttribute\("aria-label",\s*t\("packExportBtn"\)\);/);
    assert.match(settingsDialogTs, /configSanitizeBtn\.setAttribute\("aria-label",\s*t\("packSanitizeConfigBtn"\)\);/);
});

test("T-0738 · Espanso 导入与标签体检弹窗操作栏 toolbar 语义及全量按钮无障碍声明", () => {
    // 1. Espanso 导入操作栏 toolbar 角色与按键漫游
    assert.match(settingsDialogTs, /foot\.setAttribute\("role",\s*"toolbar"\);/);
    assert.match(settingsDialogTs, /foot\.setAttribute\("aria-label",\s*"Espanso导入操作栏"\);/);
    assert.match(settingsDialogTs, /foot\.addEventListener\("keydown",\s*\(e:\s*any\)\s*=>\s*\{[\s\S]*?e\.key === "ArrowRight" \|\| e\.key === "ArrowLeft"/);
    assert.match(settingsDialogTs, /cancelBtn\.setAttribute\("aria-label",\s*t\("cancel"\)\);/);
    assert.match(settingsDialogTs, /nextBtn\.setAttribute\("aria-label",\s*t\("setupNext"\)\);/);

    // 2. 标签体检弹窗操作栏 toolbar 角色与关闭按钮 aria-label
    assert.match(settingsDialogTs, /actions\.setAttribute\("role",\s*"toolbar"\);/);
    assert.match(settingsDialogTs, /actions\.setAttribute\("aria-label",\s*"标签体检操作栏"\);/);
    assert.match(settingsDialogTs, /close\.setAttribute\("aria-label",\s*t\("close"\)\);/);
});

test("T-0739 · 设置重试按钮与操作区 24px 触控靶点、高对比度焦点环与样式收拢", () => {
    // 1. 操作重试按钮 24px 触控靶点与 focus-visible
    assert.match(indexScss, /\.xlc-operation-retry\s*\{[\s\S]*?min-height:\s*24px;/);
    assert.match(indexScss, /\.xlc-operation-retry\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);

    // 2. prefers-reduced-motion 涵盖操作重试按钮
    assert.match(indexScss, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.xlc-operation-retry[\s\S]*?transition:\s*none !important;/);
});
