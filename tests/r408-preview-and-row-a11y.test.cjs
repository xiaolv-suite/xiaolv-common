"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const indexScss = fs.readFileSync(path.join(root, "src", "styles", "index.scss"), "utf8");
const tokensScss = fs.readFileSync(path.join(root, "src", "styles", "tokens-r187.scss"), "utf8");
const previewTs = fs.readFileSync(path.join(root, "src", "ui", "preview-renderer.ts"), "utf8");
const dialogTs = fs.readFileSync(path.join(root, "src", "ui", "dialog.ts"), "utf8");

test("T-0716 · 代码预览信息栏行数徽标与行频次状态属性声明", () => {
    // 1. 代码行数徽标 status 角色与精准 aria-label
    assert.match(previewTs, /countBadge\.setAttribute\("role",\s*"status"\);/);
    assert.match(previewTs, /countBadge\.setAttribute\("aria-label",\s*`代码行数：\$\{lines\.length\} 行`\);/);

    // 2. 使用频次标签 status 角色与 aria-label
    assert.match(dialogTs, /useSpan\.setAttribute\("role",\s*"status"\);/);
    assert.match(dialogTs, /useSpan\.setAttribute\("aria-label",\s*this\.deps\.t\("useCount",\s*String\(useCount\)\)\);/);
});

test("T-0717 · 代码信息栏行数文本与度量指标排版样式令牌化收敛", () => {
    // 1. 代码行数文本 tabular-nums 与微字距
    assert.match(tokensScss, /\.xlc-code-lines\s*\{[\s\S]*?font-variant-numeric:\s*tabular-nums;/);
    assert.match(tokensScss, /\.xlc-code-lines\s*\{[\s\S]*?letter-spacing:\s*-0\.01em;/);
});

test("T-0718 · 快捷搜索结果列表行 listitem / aria-current 状态机与导航聚焦透出", () => {
    // 1. 列表行标准 listitem 角色与动态 aria-current
    assert.match(dialogTs, /row\.setAttribute\("role",\s*"listitem"\);/);
    assert.match(dialogTs, /row\.setAttribute\("aria-current",\s*index === this\.activeIndex \? "true" : "false"\);/);

    // 2. 键盘导航动态更新 aria-current
    assert.match(dialogTs, /child\.setAttribute\("aria-current",\s*active \? "true" : "false"\);/);

    // 3. 搜索输入框关联活动后代
    assert.match(dialogTs, /input\?\.setAttribute\("aria-activedescendant",\s*active\.id\);/);
});

test("T-0719 · 代码预览与代码围栏容器 focus-visible 焦点环与动效降级规范", () => {
    // 1. 代码预览容器高对比度聚焦环
    assert.match(tokensScss, /\.xlc-preview-code\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);

    // 2. prefers-reduced-motion 涵盖代码信息栏
    assert.match(indexScss, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.xlc-code-banner[\s\S]*?transition:\s*none !important;/);
});
