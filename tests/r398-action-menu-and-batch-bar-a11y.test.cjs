"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const indexScss = fs.readFileSync(path.join(root, "src", "styles", "index.scss"), "utf8");
const dialogTs = fs.readFileSync(path.join(root, "src", "ui", "dialog.ts"), "utf8");

test("UI/UX Pro Max · 条目动作菜单 Home / End 极值跳转与无障碍导航", () => {
    // 动作菜单 Home / End 导航
    assert.match(dialogTs, /if \(e\.key === "Home" \|\| e\.key === "End"\) \{\s*const items = Array\.from\(menu\.querySelectorAll<HTMLElement>\("\.xlc-menu-item"\)\);/);
    assert.match(dialogTs, /if \(e\.key === "Home"\) items\[0\]\?\.focus\(\);/);
    assert.match(dialogTs, /else items\[items\.length - 1\]\?\.focus\(\);/);
});

test("UI/UX Pro Max · 极速大卡片预览 (QuickLook) 正文容器键盘聚焦滚动与 region 语义", () => {
    // QuickLook 预览区 region 语义与键盘可聚焦滚动
    assert.match(dialogTs, /body\.className = "xlc-quicklook-body";/);
    assert.match(dialogTs, /body\.tabIndex = 0;/);
    assert.match(dialogTs, /body\.setAttribute\("role",\s*"region"\);/);
    assert.match(dialogTs, /body\.setAttribute\("aria-label",\s*"条目全文极速预览"\);/);
});

test("UI/UX Pro Max · 批量多选管理栏 toolbar 角色声明与水平方向键漫游轮巡", () => {
    // 1. 批量管理栏 toolbar 角色
    assert.match(dialogTs, /bar\.setAttribute\("role",\s*"toolbar"\);/);
    assert.match(dialogTs, /bar\.setAttribute\("aria-label",\s*"批量多选操作栏"\);/);

    // 2. 批量动作按钮水平键盘轮巡
    assert.match(dialogTs, /if \(e\.key === "ArrowRight" \|\| e\.key === "ArrowLeft"\)/);
    assert.match(dialogTs, /const btns = Array\.from\(actions\.querySelectorAll<HTMLButtonElement>\("button:not\(\[style\*='display: none'\]\)"\)\);/);
    assert.match(dialogTs, /const nextIdx = e\.key === "ArrowRight"\s*\?\s*\(idx \+ 1\) % btns\.length/);
    assert.match(dialogTs, /if \(e\.key === "Home" \|\| e\.key === "End"\)/);

    // 3. 退出按钮可访问名称
    assert.match(dialogTs, /exitBtn\.setAttribute\("aria-label",\s*"退出多选模式"\);/);
});

test("UI/UX Pro Max · 批量操作栏已选计数动态播报与状态指示", () => {
    // 已选计数 status 角色与动态播报
    assert.match(dialogTs, /countSpan\.className = "xlc-batch-count";/);
    assert.match(dialogTs, /countSpan\.setAttribute\("role",\s*"status"\);/);
    assert.match(dialogTs, /countSpan\.setAttribute\("aria-live",\s*"polite"\);/);
});

test("UI/UX Pro Max · 批量栏与极速预览焦点环、触控靶点与等宽字距规范", () => {
    // 1. QuickLook 预览区聚焦轮廓
    assert.match(indexScss, /\.xlc-quicklook-body\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);

    // 2. 批量栏计数器等宽数字与微字距
    assert.match(indexScss, /\.xlc-batch-count\s*\{[\s\S]*?font-variant-numeric:\s*tabular-nums;[\s\S]*?letter-spacing:\s*-0\.02em;/);

    // 3. 批量动作按钮 24px 靶点与焦点环
    assert.match(indexScss, /\.xlc-batch-actions\s*\{[\s\S]*?\.b3-button\s*\{[\s\S]*?min-height:\s*24px;[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);
});
