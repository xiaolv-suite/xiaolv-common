"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const indexScss = fs.readFileSync(path.join(root, "src", "styles", "index.scss"), "utf8");
const settingsTs = fs.readFileSync(path.join(root, "src", "ui", "settings-dialog.ts"), "utf8");

test("UI/UX Pro Max · 首次引导与库选择模式下拉与文档检索输入框精确无障碍关联", () => {
    // 1. 快速上手步骤引导 region 语义
    assert.match(settingsTs, /quickStart\.setAttribute\("role",\s*"region"\);/);
    assert.match(settingsTs, /quickStart\.setAttribute\("aria-labelledby",\s*"xlc-setup-quickstart-title"\);/);

    // 2. 模式下拉框 label 与 select 关联
    assert.match(settingsTs, /modeSelect\.setAttribute\("aria-label",\s*t\("setupModeLabel"\)\);/);
    assert.match(settingsTs, /modeLabel\.htmlFor = modeSelect\.id;/);

    // 3. 笔记本下拉框无障碍名称
    assert.match(settingsTs, /nbSelect\.setAttribute\("aria-label",\s*t\("setupNotebook"\)\);/);
});

test("UI/UX Pro Max · 备选文档清单 listbox 角色、option 语义与垂直键盘上下轮巡", () => {
    // 1. 文档候选列表 listbox 角色
    assert.match(settingsTs, /pickerList\.setAttribute\("role",\s*"listbox"\);/);
    assert.match(settingsTs, /pickerList\.setAttribute\("aria-label",\s*t\("docPicker"\)\);/);

    // 2. 候选文档垂直键盘轮巡与首尾直达
    assert.match(settingsTs, /if \(e\.key === "ArrowDown" \|\| e\.key === "ArrowUp"\)/);
    assert.match(settingsTs, /const items = Array\.from\(pickerList\.querySelectorAll<HTMLButtonElement>\("\.xlc-doclist-item"\)\);/);
    assert.match(settingsTs, /const nextIdx = e\.key === "ArrowDown"\s*\?\s*\(idx \+ 1\) % items\.length/);
    assert.match(settingsTs, /if \(e\.key === "Home" \|\| e\.key === "End"\)/);

    // 3. 单项 option 角色与 aria-selected 状态
    assert.match(settingsTs, /item\.setAttribute\("role",\s*"option"\);/);
    assert.match(settingsTs, /item\.setAttribute\("aria-selected",\s*isPicked \? "true" : "false"\);/);
    assert.match(settingsTs, /item\.setAttribute\("aria-label",\s*hit\.hPath \|\| hit\.name \|\| hit\.id\);/);
});

test("UI/UX Pro Max · 新建库文档表单与两步向导操作按钮可访问属性与键盘快捷提交", () => {
    // 1. 向导操作栏 toolbar 角色
    assert.match(settingsTs, /step1Actions\.setAttribute\("role",\s*"toolbar"\);/);
    assert.match(settingsTs, /step2Actions\.setAttribute\("role",\s*"toolbar"\);/);

    // 2. 向导核心按钮 aria-label
    assert.match(settingsTs, /createBtn\.setAttribute\("aria-label",\s*t\("create"\)\);/);
    assert.match(settingsTs, /nextBtn\.setAttribute\("aria-label",\s*t\("setupNext"\)\);/);
    assert.match(settingsTs, /backBtn\.setAttribute\("aria-label",\s*t\("setupBack"\)\);/);
    assert.match(settingsTs, /finishBtn\.setAttribute\("aria-label",\s*t\("setupFinish"\)\);/);

    // 3. 向导全局 Ctrl+Enter 快捷提交
    assert.match(settingsTs, /if \(\(e\.ctrlKey \|\| e\.metaKey\) && e\.key === "Enter"\) \{\s*if \(e\.repeat\) return;\s*if \(step === 1\) \{/);
});

test("UI/UX Pro Max · 文档选择项高对比度焦点环、微触觉缩放与减动效降级规范", () => {
    // 1. 文档候选卡焦点环与微触觉反馈
    assert.match(indexScss, /\.xlc-doclist-item\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);
    assert.match(indexScss, /\.xlc-doclist-item\s*\{[\s\S]*?&:active\s*\{[\s\S]*?transform:\s*scale\(0\.98\);/);

    // 2. prefers-reduced-motion 涵盖 .xlc-doclist-item
    assert.match(indexScss, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.xlc-doclist-item\s*\{[\s\S]*?transition:\s*none !important;/);
});
