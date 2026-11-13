"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const indexScss = fs.readFileSync(path.join(root, "src", "styles", "index.scss"), "utf8");
const dockTs = fs.readFileSync(path.join(root, "src", "ui", "dock-view.ts"), "utf8");
const quickEditTs = fs.readFileSync(path.join(root, "src", "ui", "quick-edit.ts"), "utf8");

test("UI/UX Pro Max · 侧边栏 DockView 顶栏与清空按钮无障碍 ARIA 规范", () => {
    // 1. 顶栏按钮无障碍标签绑定
    assert.match(dockTs, /newBtn\.setAttribute\("aria-label",\s*newBtn\.title\);/);
    assert.match(dockTs, /refreshBtn\.setAttribute\("aria-label",\s*refreshBtn\.title\);/);
    assert.match(dockTs, /gearBtn\.setAttribute\("aria-label",\s*gearBtn\.title\);/);

    // 2. 搜索清空按钮
    assert.match(dockTs, /this\.clearBtn\.setAttribute\("aria-label",\s*this\.clearBtn\.title\);/);
});

test("UI/UX Pro Max · 侧边栏 DockView 过滤 Chips 单选组与状态同步", () => {
    assert.match(dockTs, /this\.chipsContainer\.setAttribute\("role",\s*"radiogroup"\);/);
    assert.match(dockTs, /this\.chipsContainer\.setAttribute\("aria-label",\s*"侧边栏内容过滤"\);/);
    assert.match(dockTs, /chip\.setAttribute\("role",\s*"radio"\);/);
    assert.match(dockTs, /chip\.setAttribute\("aria-checked",\s*isActive \? "true" : "false"\);/);
    assert.match(dockTs, /btn\.setAttribute\("aria-checked",\s*isActive \? "true" : "false"\);/);
});

test("UI/UX Pro Max · 侧边栏行动作 24px 最小触控靶点与键盘聚焦透出", () => {
    // 动作按钮 aria-label 与收藏动态翻转
    assert.match(dockTs, /insertBtn\.setAttribute\("aria-label",\s*insertBtn\.title\);/);
    assert.match(dockTs, /copyBtn\.setAttribute\("aria-label",\s*copyBtn\.title\);/);
    assert.match(dockTs, /favBtn\.setAttribute\("aria-label",\s*favTitle\);/);
    assert.match(dockTs, /favBtn\.setAttribute\("aria-label",\s*updatedTitle\);/);

    // 样式规范：24px 靶点与 focus-visible
    assert.match(indexScss, /\.xlc-dock-act-btn\s*\{[\s\S]*?min-width:\s*24px;/);
    assert.match(indexScss, /\.xlc-dock-act-btn\s*\{[\s\S]*?min-height:\s*24px;/);
    assert.match(indexScss, /\.xlc-dock-act-btn\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);

    // 键盘聚焦行透出动作
    assert.match(indexScss, /&:focus-within\s*\{[\s\S]*?\.xlc-dock-row-actions\s*\{[\s\S]*?opacity:\s*1;/);
});

test("UI/UX Pro Max · 就地快编辅助信息行与动态字数统计", () => {
    // TS 结构生成与动态字数统计
    assert.match(quickEditTs, /footer\.className = "xlc-quick-edit-footer";/);
    // 桌面保留键盘提示；移动视口按端适配为触屏语义（R11 移动语境专项）
    assert.match(quickEditTs, /hint\.textContent = isMobileModal \? "点「保存」应用修改 · 点 ✕ 关闭" : "Ctrl\+Enter 保存 · Esc 取消";/);
    assert.match(quickEditTs, /counter\.textContent = `\$\{textarea\.value\.length\} 字符`;/);
    assert.match(quickEditTs, /textarea\.addEventListener\("input",\s*updateCount\);/);

    // SCSS 规范
    assert.match(indexScss, /\.xlc-quick-edit-footer\s*\{[\s\S]*?justify-content:\s*space-between;/);
    assert.match(indexScss, /\.xlc-quick-edit-counter\s*\{[\s\S]*?font-variant-numeric:\s*tabular-nums;/);
});

test("UI/UX Pro Max · 就地快编保存忙态与取消防穿透", () => {
    // cancelBtn 与 Escape 在 saving 期间阻断关闭
    assert.match(quickEditTs, /cancelBtn\.addEventListener\("click",\s*\(\)\s*=>\s*\{\s*if\s*\(saving\)\s*return;\s*dialog\.destroy\(\);/);
    assert.match(quickEditTs, /if \(e\.key === "Escape"\) \{\s*if \(saving\) return;/);
    assert.match(quickEditTs, /cancelBtn\.disabled = true;/);
    assert.match(quickEditTs, /cancelBtn\.disabled = false;/);
});
