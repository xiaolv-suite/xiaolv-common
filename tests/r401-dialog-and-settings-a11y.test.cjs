"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const indexScss = fs.readFileSync(path.join(root, "src", "styles", "index.scss"), "utf8");
const dialogTs = fs.readFileSync(path.join(root, "src", "ui", "dialog.ts"), "utf8");
const settingsTs = fs.readFileSync(path.join(root, "src", "ui", "settings-dialog.ts"), "utf8");

test("UI/UX Pro Max · 桌面主面板移除统计指标横带并保留侧边窗格 W3C 区域语义增强", () => {
    // 1. 统计指标横带已移除（T-0754 界面减法），不再挤占主搜索纵向空间
    assert.doesNotMatch(dialogTs, /buildMetricsStrip/);

    // 2. 详情侧边窗格 complementary 角色与预览区 region
    assert.match(dialogTs, /pane\.className = "xlc-pane";/);
    assert.match(dialogTs, /pane\.setAttribute\("role",\s*"complementary"\);/);
    assert.match(dialogTs, /pane\.setAttribute\("aria-label",\s*"详情侧边窗格"\);/);
    assert.match(dialogTs, /paneBody\.tabIndex = 0;/);
    assert.match(dialogTs, /paneBody\.setAttribute\("role",\s*"region"\);/);
    assert.match(dialogTs, /paneBody\.setAttribute\("aria-label",\s*"条目详情预览"\);/);
});

test("UI/UX Pro Max · 详情预览操作栏 toolbar 语义与水平方向键漫游轮巡", () => {
    // 1. 详情操作栏 toolbar 角色
    assert.match(dialogTs, /foot\.setAttribute\("role",\s*"toolbar"\);/);
    assert.match(dialogTs, /foot\.setAttribute\("aria-label",\s*"详情动作操作栏"\);/);

    // 2. 水平键盘轮巡与 Home/End 直达
    assert.match(dialogTs, /if \(e\.key === "ArrowRight" \|\| e\.key === "ArrowLeft"\)/);
    assert.match(dialogTs, /const btns = Array\.from\(foot\.querySelectorAll<HTMLButtonElement>\("button:not\(\[disabled\]\):not\(\[style\*='display: none'\]\)"\)\);/);
    assert.match(dialogTs, /const nextIdx = e\.key === "ArrowRight"\s*\?\s*\(idx \+ 1\) % btns\.length/);
    assert.match(dialogTs, /if \(e\.key === "Home" \|\| e\.key === "End"\)/);

    // 3. 核心按钮无障碍标签
    assert.match(dialogTs, /insert\.setAttribute\("aria-label",\s*this\.deps\.t\("insert"\)\);/);
    assert.match(dialogTs, /copy\.setAttribute\("aria-label",\s*this\.deps\.t\("copy"\)\);/);
    assert.match(dialogTs, /source\.setAttribute\("aria-label",\s*this\.deps\.t\("openSource"\)\);/);
    assert.match(dialogTs, /edit\.setAttribute\("aria-label",\s*this\.deps\.t\("edit"\)\);/);
});

test("UI/UX Pro Max · 设置中心数据管理工具栏 toolbar 语义与按键漫游巡检", () => {
    // 1. 数据管理按钮栏 toolbar 角色
    assert.match(settingsTs, /dataBtns\.className = "xlc-settings-data-actions";/);
    assert.match(settingsTs, /dataBtns\.setAttribute\("role",\s*"toolbar"\);/);
    assert.match(settingsTs, /dataBtns\.setAttribute\("aria-label",\s*t\("dataSection"\)\);/);

    // 2. 数据管理按键水平漫游
    assert.match(settingsTs, /const btns = Array\.from\(dataBtns\.querySelectorAll<HTMLButtonElement>\("button:not\(\[disabled\]\)"\)\);/);
    assert.match(settingsTs, /const nextIdx = e\.key === "ArrowRight"\s*\?\s*\(idx \+ 1\) % btns\.length/);
    assert.match(settingsTs, /btn\.setAttribute\("aria-label",\s*label\);/);
});

test("UI/UX Pro Max · 已保存视图清单操作按钮可访问名称与列表语义对齐", () => {
    // 1. 列表项角色与综合可访问标签
    assert.match(settingsTs, /row\.setAttribute\("role",\s*"listitem"\);/);
    assert.match(settingsTs, /row\.setAttribute\("aria-label",\s*`\$\{view\.name\} · \$\{pieces\.join\(" · "\)\}`\);/);

    // 2. 独立动作按钮精确名称
    assert.match(settingsTs, /open\.setAttribute\("aria-label",\s*`\$\{t\("savedViewsOpen"\)\}：\$\{view\.name\}`\);/);
    assert.match(settingsTs, /remove\.setAttribute\("aria-label",\s*`\$\{t\("savedViewsDelete"\)\}：\$\{view\.name\}`\);/);
});

test("UI/UX Pro Max · 预览操作栏与设置数据动作按钮 24px 靶点与焦点环规范", () => {
    // 1. 详情操作栏 24px 靶点与焦点环
    assert.match(indexScss, /\.xlc-pane-foot\s*\{[\s\S]*?\.b3-button\s*\{[\s\S]*?min-height:\s*24px;[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);

    // 2. 设置数据管理 24px 靶点与焦点环
    assert.match(indexScss, /\.xlc-settings-data-actions\s*\{[\s\S]*?\.b3-button\s*\{[\s\S]*?min-height:\s*24px;[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);
});
