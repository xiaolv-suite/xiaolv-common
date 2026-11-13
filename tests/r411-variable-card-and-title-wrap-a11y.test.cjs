"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const indexScss = fs.readFileSync(path.join(root, "src", "styles", "index.scss"), "utf8");
const variableFormTs = fs.readFileSync(path.join(root, "src", "ui", "variable-form.ts"), "utf8");
const dialogDomTs = fs.readFileSync(path.join(root, "src", "ui", "dialog-dom.ts"), "utf8");

test("T-0731 · 变量填充卡 (Variable Fill Card) 标题栏与操作底栏 toolbar 语义及键盘漫游", () => {
    // 1. 变量卡标题栏 toolbar 角色与标签
    assert.match(variableFormTs, /head\.setAttribute\("role",\s*"toolbar"\);/);
    assert.match(variableFormTs, /head\.setAttribute\("aria-label",\s*"变量卡标题栏"\);/);

    // 2. 变量卡操作底栏 toolbar 角色与标签
    assert.match(variableFormTs, /foot\.setAttribute\("role",\s*"toolbar"\);/);
    assert.match(variableFormTs, /foot\.setAttribute\("aria-label",\s*"变量卡操作栏"\);/);

    // 3. 变量卡底栏按键漫游导航
    assert.match(variableFormTs, /foot\.addEventListener\("keydown",\s*\(e:\s*any\)\s*=>\s*\{[\s\S]*?e\.key === "ArrowRight" \|\| e\.key === "ArrowLeft"/);

    // 4. 取消与插入按钮独立 aria-label
    assert.match(variableFormTs, /cancelBtn\.setAttribute\("aria-label",\s*t\("cancel"\)\);/);
    assert.match(variableFormTs, /insertBtn\.setAttribute\("aria-label",\s*t\("insert"\)\);/);
});

test("T-0732 · 变量预设工具栏与候选项胶囊 toolbar 语义及按键漫游", () => {
    // 1. 快捷候选项胶囊栏 toolbar 角色与标签
    assert.match(variableFormTs, /pillsWrap\.setAttribute\("role",\s*"toolbar"\);/);
    assert.match(variableFormTs, /pillsWrap\.setAttribute\("aria-label",\s*"快捷候选项"\);/);

    // 2. 快捷候选项按键漫游导航
    assert.match(variableFormTs, /pillsWrap\.addEventListener\("keydown",\s*\(e:\s*any\)\s*=>\s*\{[\s\S]*?button\.xlc-quick-option-pill/);

    // 3. 预设方案操作栏 toolbar 角色与标签
    assert.match(variableFormTs, /presetWrap\.setAttribute\("role",\s*"toolbar"\);/);
    assert.match(variableFormTs, /presetWrap\.setAttribute\("aria-label",\s*"预设方案操作栏"\);/);

    // 4. 预设方案按键漫游导航
    assert.match(variableFormTs, /presetWrap\.addEventListener\("keydown",\s*\(e:\s*any\)\s*=>\s*\{[\s\S]*?presetWrap\.querySelectorAll<HTMLElement>\("select, button"\)/);
});

test("T-0733 · 统一品牌标题栏组件 (lv-dialog-title-wrap) heading/status 语义及版本等宽排版", () => {
    // 1. 标题栏容器 heading 角色与大纲层级
    assert.match(dialogDomTs, /wrap\.setAttribute\("role",\s*"heading"\);/);
    assert.match(dialogDomTs, /wrap\.setAttribute\("aria-level",\s*"1"\);/);

    // 2. 装饰图标语义隐藏
    assert.match(dialogDomTs, /iconSpan\.setAttribute\("aria-hidden",\s*"true"\);/);

    // 3. 版本胶囊 status 语义与无障碍标签
    assert.match(dialogDomTs, /badgeSpan\.setAttribute\("role",\s*"status"\);/);
    assert.match(dialogDomTs, /badgeSpan\.setAttribute\("aria-label",\s*`插件版本：\$\{badgeText\}`\);/);

    // 4. 版本胶囊 tabular-nums 排版
    assert.match(indexScss, /\.lv-dialog-title-pill\s*\{[\s\S]*?font-variant-numeric:\s*tabular-nums;/);
});

test("T-0734 · 变量卡操作按钮、候选项与移动端 FAB 24px 触控靶点、高对比度焦点环与样式收拢", () => {
    // 1. 变量卡底栏操作按钮 28px 靶点与 focus-visible
    assert.match(indexScss, /\.xlc-varform-foot\s*\{[\s\S]*?\.b3-button\s*\{[\s\S]*?min-height:\s*28px;/);
    assert.match(indexScss, /\.xlc-varform-foot\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);

    // 2. 快捷候选项胶囊 24px 触控靶点
    assert.match(indexScss, /\.xlc-quick-option-pill\s*\{[\s\S]*?min-height:\s*24px;/);

    // 3. 动态展开预览容器 tabular-nums 与 letter-spacing
    assert.match(indexScss, /\.xlc-varform-preview\s*\{[\s\S]*?font-variant-numeric:\s*tabular-nums;/);
    assert.match(indexScss, /\.xlc-varform-preview\s*\{[\s\S]*?letter-spacing:\s*-0\.01em;/);

    // 4. 移动端悬浮新建加号键 focus-visible 焦点环
    assert.match(indexScss, /\.xlc-fab-new\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);

    // 5. prefers-reduced-motion 涵盖候选项胶囊、变量卡按钮与悬浮新建键
    assert.match(indexScss, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.xlc-quick-option-pill,[\s\S]*?\.xlc-varform-foot \.b3-button,[\s\S]*?\.xlc-fab-new[\s\S]*?transition:\s*none !important;/);
});
