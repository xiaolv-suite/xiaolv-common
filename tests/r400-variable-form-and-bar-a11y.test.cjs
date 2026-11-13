"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const indexScss = fs.readFileSync(path.join(root, "src", "styles", "index.scss"), "utf8");
const varFormTs = fs.readFileSync(path.join(root, "src", "ui", "variable-form.ts"), "utf8");

test("UI/UX Pro Max · 变量输入卡表单控件 htmlFor/id 严密绑定与可聚焦滚动区域", () => {
    // 1. 字段滚动区 region 语义与键盘可聚焦
    assert.match(varFormTs, /fieldsWrap\.className = "xlc-varform-fields";/);
    assert.match(varFormTs, /fieldsWrap\.tabIndex = 0;/);
    assert.match(varFormTs, /fieldsWrap\.setAttribute\("role",\s*"region"\);/);
    assert.match(varFormTs, /fieldsWrap\.setAttribute\("aria-label",\s*"变量输入表单"\);/);

    // 2. 表单字段 label 与 input htmlFor/id 绑定
    assert.match(varFormTs, /const inputId = `xlc-var-input-\$\{fieldIndex\}`;/);
    assert.match(varFormTs, /wrap\.htmlFor = inputId;/);
    assert.match(varFormTs, /input\.id = inputId;/);
    assert.match(varFormTs, /input\.setAttribute\("aria-label",\s*`\$\{field\.name\} \(\$\{askFieldTag\(field\)\}\)`\);/);
});

test("UI/UX Pro Max · 变量实时展开预览与预设方案控制无障碍角色声明", () => {
    // 1. 实时预览区 region 语义与可聚焦滚动
    assert.match(varFormTs, /previewBox\.tabIndex = 0;/);
    assert.match(varFormTs, /previewBox\.setAttribute\("role",\s*"region"\);/);
    assert.match(varFormTs, /previewBox\.setAttribute\("aria-label",\s*"实时展开预览"\);/);

    // 2. 预设方案下拉与按钮 aria-label 属性
    assert.match(varFormTs, /presetSelect\.setAttribute\("aria-label",\s*"预设方案选择"\);/);
    assert.match(varFormTs, /savePresetBtn\.setAttribute\("aria-label",\s*"存为预设方案"\);/);
    assert.match(varFormTs, /deletePresetBtn\.setAttribute\("aria-label",\s*deletePresetBtn\.title\);/);
    assert.match(varFormTs, /resetBtn\.setAttribute\("aria-label",\s*resetBtn\.title\);/);
    assert.match(varFormTs, /copyBtn\.setAttribute\("aria-label",\s*copyBtn\.title\);/);
});

test("UI/UX Pro Max · 创作侧宏变量快捷工具栏 toolbar 语义与左右键盘漫游轮巡", () => {
    // 1. 宏变量工具栏 toolbar 角色
    assert.match(varFormTs, /bar\.setAttribute\("role",\s*"toolbar"\);/);
    assert.match(varFormTs, /bar\.setAttribute\("aria-label",\s*t\("insertVariable"\)\);/);

    // 2. 水平键盘轮巡与 Home/End 直达
    assert.match(varFormTs, /if \(e\.key === "ArrowRight" \|\| e\.key === "ArrowLeft"\)/);
    assert.match(varFormTs, /const btns = Array\.from\(bar\.querySelectorAll<HTMLButtonElement>\("button"\)\)/);
    assert.match(varFormTs, /const nextIdx = e\.key === "ArrowRight"\s*\?\s*\(idx \+ 1\) % btns\.length/);
    assert.match(varFormTs, /if \(e\.key === "Home" \|\| e\.key === "End"\)/);

    // 3. 宏变量按钮独立可访问名称
    assert.match(varFormTs, /btn\.setAttribute\("aria-label",\s*`插入宏变量: \$\{snippet\.text\}`\);/);
});

test("UI/UX Pro Max · 宏变量胶囊与格式化快捷动作 24px 触控靶点与高对比度焦点环规范", () => {
    // 宏变量胶囊 24px 靶点与焦点环
    assert.match(indexScss, /\.xlc-varbtn\s*\{[\s\S]*?min-height:\s*24px;[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);
});

test("UI/UX Pro Max · 变量表单与预览卡片样式令牌化与减动效降级规范", () => {
    // 1. 字段滚动区与预览区聚焦环
    assert.match(indexScss, /\.xlc-varform-fields\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);
    assert.match(indexScss, /\.xlc-varform-preview\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);

    // 2. prefers-reduced-motion 降级涵盖 .xlc-varbtn
    assert.match(indexScss, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.xlc-varbtn[\s\S]*?transition:\s*none !important;/);
});
