"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const indexScss = fs.readFileSync(path.join(root, "src", "styles", "index.scss"), "utf8");
const varFormTs = fs.readFileSync(path.join(root, "src", "ui", "variable-form.ts"), "utf8");
const csvWizardTs = fs.readFileSync(path.join(root, "src", "ui", "csv-tsv-wizard.ts"), "utf8");
const dialogTs = fs.readFileSync(path.join(root, "src", "ui", "dialog.ts"), "utf8");

test("T-0706 · 宏变量工具栏 50+ 格式化动作按钮 WCAG 2.2 批量 aria-label 补全与可访问性强化", () => {
    // 1. 静态源码中具备全量按钮 aria-label 兜底与补全逻辑
    assert.match(varFormTs, /bar\.querySelectorAll<HTMLButtonElement>\("button"\)\.forEach\(\(btn\)\s*=>\s*\{/);
    assert.match(varFormTs, /if \(!btn\.getAttribute\("aria-label"\)\)\s*\{/);
    assert.match(varFormTs, /btn\.setAttribute\("aria-label",\s*label\);/);
});

test("T-0707 · CSV/TSV 字段映射向导工具栏 toolbar 语义与按键漫游轮巡", () => {
    // 1. 智能推断工具栏 toolbar 语义与 aria-label
    assert.match(csvWizardTs, /btnRow\.setAttribute\("role",\s*"toolbar"\);/);
    assert.match(csvWizardTs, /btnRow\.setAttribute\("aria-label",\s*"智能推断工具栏"\);/);
    assert.match(csvWizardTs, /autoBtn\.setAttribute\("aria-label",\s*"一键智能推断表头映射"\);/);

    // 2. 底部操作栏 toolbar 语义与 aria-label
    assert.match(csvWizardTs, /foot\.setAttribute\("role",\s*"toolbar"\);/);
    assert.match(csvWizardTs, /foot\.setAttribute\("aria-label",\s*"导入向导操作栏"\);/);
    assert.match(csvWizardTs, /cancelBtn\.setAttribute\("aria-label",\s*t\("cancel"\)\s*\|\|\s*"取消导入"\);/);
    assert.match(csvWizardTs, /nextBtn\.setAttribute\("aria-label",\s*t\("setupNext"\)\s*\|\|\s*"下一步，配置导入策略"\);/);

    // 3. 底部操作栏水平按键漫游与首末直达
    assert.match(csvWizardTs, /foot\.addEventListener\("keydown",\s*\(e:\s*any\)\s*=>\s*\{/);
    assert.match(csvWizardTs, /if \(e\.key === "ArrowRight" \|\| e\.key === "ArrowDown"\)/);
    assert.match(csvWizardTs, /else if \(e\.key === "ArrowLeft" \|\| e\.key === "ArrowUp"\)/);
    assert.match(csvWizardTs, /else if \(e\.key === "Home"\)/);
    assert.match(csvWizardTs, /else if \(e\.key === "End"\)/);
});

test("T-0708 · 详情阅读度量指标 tabular-nums 排版与状态指示强化", () => {
    // 1. readingSpan 赋予 role="status" 与 aria-label
    assert.match(dialogTs, /readingSpan\.setAttribute\("role",\s*"status"\);/);
    assert.match(dialogTs, /readingSpan\.setAttribute\("aria-label",\s*`阅读度量：\$\{formatReadingMetrics\(metrics\)\}`\);/);

    // 2. SCSS 注入 tabular-nums
    assert.match(indexScss, /\.xlc-pane-reading-metrics\s*\{[\s\S]*?font-variant-numeric:\s*tabular-nums;/);
    assert.match(indexScss, /\.xlc-pane-reading-metrics\s*\{[\s\S]*?letter-spacing:\s*-0\.01em;/);
});

test("T-0709 · 向导操作按钮与格式化动作 24px 触控靶点、高对比度焦点环与样式收拢", () => {
    // 1. 向导内按钮 28px 靶点与 focus-visible
    assert.match(indexScss, /\.xlc-wizard-mapping-row\s*\{[\s\S]*?\.b3-button\s*\{[\s\S]*?min-height:\s*28px;/);
    assert.match(indexScss, /\.xlc-wizard-mapping-row\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);

    // 2. 预览框 tabular-nums 与 focus-visible
    assert.match(indexScss, /\.xlc-wizard-preview-box\s*\{[\s\S]*?font-variant-numeric:\s*tabular-nums;/);
    assert.match(indexScss, /\.xlc-wizard-preview-box\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);

    // 3. prefers-reduced-motion 涵盖向导操作按钮
    assert.match(indexScss, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.xlc-wizard-mapping-row \.b3-button[\s\S]*?transition:\s*none !important;/);
});
