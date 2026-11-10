"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const indexScss = fs.readFileSync(path.join(root, "src", "styles", "index.scss"), "utf8");
const dialogTs = fs.readFileSync(path.join(root, "src", "ui", "dialog.ts"), "utf8");
const wizardTs = fs.readFileSync(path.join(root, "src", "ui", "csv-tsv-wizard.ts"), "utf8");

test("UI/UX Pro Max · 排序直选菜单 menuitemradio 语义与上下键循环导航", () => {
    // 1. 单选菜单项 ARIA 属性
    assert.match(dialogTs, /option\.setAttribute\("role",\s*"menuitemradio"\);/);
    assert.match(dialogTs, /option\.setAttribute\("aria-checked",\s*isSelected \? "true" : "false"\);/);

    // 2. 键盘 ↑↓ 循环漫游与 Home/End 导航
    assert.match(dialogTs, /if \(e\.key === "ArrowDown" \|\| e\.key === "ArrowUp"\)/);
    assert.match(dialogTs, /if \(e\.key === "Home" \|\| e\.key === "End"\)/);
});

test("UI/UX Pro Max · 表格向导输入框与映射下拉列表无障碍标签精准关联", () => {
    // 文本输入框 aria-label
    assert.match(wizardTs, /ta\.setAttribute\("aria-label",\s*t\("csvImportTitle"\) \|\| "表格文本输入"\);/);

    // 映射下拉框 htmlFor 与 id 严格关联
    assert.match(wizardTs, /const selectId = `xlc-wizard-field-\$\{String\(fieldName\)\}`;/);
    assert.match(wizardTs, /label\.htmlFor = selectId;/);
    assert.match(wizardTs, /select\.id = selectId;/);
    assert.match(wizardTs, /select\.setAttribute\("aria-label",\s*labelText\);/);
});

test("UI/UX Pro Max · 表格向导解析预览区键盘可聚焦滚动与快捷键推进", () => {
    // 预览区键盘聚焦与 region 角色
    assert.match(wizardTs, /preview\.className = "xlc-form-hint xlc-wizard-preview-box";/);
    assert.match(wizardTs, /preview\.tabIndex = 0;/);
    assert.match(wizardTs, /preview\.setAttribute\("role",\s*"region"\);/);
    assert.match(wizardTs, /preview\.setAttribute\("aria-label",\s*"表格解析预览"\);/);

    // Ctrl+Enter 快捷完成推进
    assert.match(wizardTs, /if \(\(e\.ctrlKey \|\| e\.metaKey\) && e\.key === "Enter"\) \{\s*if \(e\.repeat \|\| nextBtn\.disabled\) return;\s*e\.preventDefault\(\);\s*nextBtn\.click\(\);/);
});

test("UI/UX Pro Max · 表格向导样式规范与焦点轮廓断言", () => {
    assert.match(indexScss, /\.xlc-wizard-mapping-grid\s*\{[\s\S]*?display:\s*grid;/);
    assert.match(indexScss, /\.xlc-wizard-preview-box\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);
});
