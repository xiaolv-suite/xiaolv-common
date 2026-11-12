"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const indexScss = fs.readFileSync(path.join(root, "src", "styles", "index.scss"), "utf8");
const settingsTs = fs.readFileSync(path.join(root, "src", "ui", "settings-dialog.ts"), "utf8");

test("UI/UX Pro Max · 设置分区导航 tablist 键盘左右轮巡与首尾直达漫游", () => {
    // 1. 设置导航胶囊 keydown 左右方向键漫游
    assert.match(settingsTs, /if \(e\.key === "ArrowRight" \|\| e\.key === "ArrowLeft"\)/);
    assert.match(settingsTs, /const pills = Array\.from\(navBar\.querySelectorAll<HTMLButtonElement>\("\.xlc-settings-nav-pill"\)\);/);
    assert.match(settingsTs, /const nextIdx = e\.key === "ArrowRight"\s*\?\s*\(idx \+ 1\) % pills\.length/);

    // 2. Home / End 首尾直达
    assert.match(settingsTs, /if \(e\.key === "Home" \|\| e\.key === "End"\)/);
    assert.match(settingsTs, /const target = e\.key === "Home" \? pills\[0\] : pills\[pills\.length - 1\];/);
});

test("UI/UX Pro Max · 导入冲突策略卡 radiogroup/radio 语义化与键盘上下循环选择", () => {
    // 1. 策略列表 radiogroup 语义
    assert.match(settingsTs, /policyList\.setAttribute\("role",\s*"radiogroup"\);/);
    assert.match(settingsTs, /policyList\.setAttribute\("aria-label",\s*t\("importPolicyTitle"\)\);/);

    // 2. 策略卡 radio 角色与 aria-checked 状态
    assert.match(settingsTs, /card\.setAttribute\("role",\s*"radio"\);/);
    assert.match(settingsTs, /card\.setAttribute\("aria-checked",\s*recommended \? "true" : "false"\);/);
    assert.match(settingsTs, /card\.setAttribute\("aria-label",\s*`\$\{title\} · \$\{desc\}`\);/);

    // 3. 策略卡方向键上下漫游与首尾直达
    assert.match(settingsTs, /if \(e\.key === "ArrowDown" \|\| e\.key === "ArrowUp"\)/);
    assert.match(settingsTs, /const cards = Array\.from\(policyList\.querySelectorAll<HTMLButtonElement>\("\.xlc-policy"\)\);/);
    assert.match(settingsTs, /const nextIdx = e\.key === "ArrowDown"\s*\?\s*\(idx \+ 1\) % cards\.length/);
    assert.match(settingsTs, /if \(e\.key === "Home" \|\| e\.key === "End"\)/);
});

test("UI/UX Pro Max · 嵌套片段依赖树可滚动区域与导入导出全局快捷提交", () => {
    // 1. 依赖树 region 语义与键盘聚焦滚动
    assert.match(settingsTs, /depTree\.tabIndex = 0;/);
    assert.match(settingsTs, /depTree\.setAttribute\("role",\s*"region"\);/);
    assert.match(settingsTs, /depTree\.setAttribute\("aria-label",\s*t\("packDepTreeTitle"\) \|\| "嵌套片段依赖关系"\);/);

    // 2. 导入策略对话框快捷保存默认推荐项
    assert.match(settingsTs, /if \(\(e\.ctrlKey \|\| e\.metaKey\) && e\.key === "Enter"\) \{\s*const recommendedCard = policyCards\.find/);
    assert.match(settingsTs, /recommendedCard\.click\(\);/);

    // 3. 模板包导出对话框控件 aria-label 与快捷导出
    assert.match(settingsTs, /catSelect\.setAttribute\("aria-label",\s*t\("packCategoryLabel"\)\);/);
    assert.match(settingsTs, /nameInput\.setAttribute\("aria-label",\s*t\("packNameLabel"\)\);/);
    assert.match(settingsTs, /sanitizeCheckbox\.setAttribute\("aria-label",\s*t\("packSanitizeLabel"\)\);/);
    assert.match(settingsTs, /if \(\(e\.ctrlKey \|\| e\.metaKey\) && e\.key === "Enter"\) \{\s*if \(e\.repeat \|\| exportBtn\.disabled\) return;\s*e\.preventDefault\(\);\s*exportBtn\.click\(\);/);
});

test("UI/UX Pro Max · 健康体检诊断清单 W3C ARIA list/listitem 语义与无障碍状态反馈", () => {
    // 1. 诊断问题列表 list 语义与键盘可滚动
    assert.match(settingsTs, /issuesContainer\.tabIndex = 0;/);
    assert.match(settingsTs, /issuesContainer\.setAttribute\("role",\s*"list"\);/);
    assert.match(settingsTs, /issuesContainer\.setAttribute\("aria-label",\s*t\("healthSection"\)\);/);

    // 2. 诊断项 listitem 语义与无障碍标签
    assert.match(settingsTs, /row\.setAttribute\("role",\s*"listitem"\);/);
    assert.match(settingsTs, /row\.setAttribute\("aria-label",\s*`\$\{sevLabel\} · \$\{issue\.itemTitle \|\| issue\.itemId\} · \$\{issue\.message\}`\);/);
});

test("UI/UX Pro Max · 策略卡与设置交互样式令牌化收拢与高对比度焦点环规范", () => {
    // 1. 策略卡焦点环与微触觉缩放
    assert.match(indexScss, /\.xlc-policy\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);
    assert.match(indexScss, /\.xlc-policy\s*\{[\s\S]*?&:active\s*\{[\s\S]*?transform:\s*scale\(0\.98\);/);

    // 2. 依赖树与健康体检列表焦点环
    assert.match(indexScss, /\.xlc-import-dep-tree\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);
    assert.match(indexScss, /\.xlc-health-issues\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);

    // 3. prefers-reduced-motion 涵盖 .xlc-policy
    assert.match(indexScss, /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\.xlc-policy[\s\S]*?transition:\s*none !important;/);
});
