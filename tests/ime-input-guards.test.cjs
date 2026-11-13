"use strict";

/**
 * IME 合成期守卫契约（R18 全生态专项 / R19 固化为回归保护）：
 * 片段 Dock 搜索框的 Arrow/Enter 键盘流必须在 isComposing || keyCode === 229 时
 * 整体让路给输入法，防止拼音候选导航被劫持或误插切片。
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

test("常用 · Dock 搜索框 IME 合成期让路 (R18/R19)", () => {
    const src = fs.readFileSync(path.join(root, "src", "ui", "dock-view.ts"), "utf8");
    const count = (src.match(/(?:e|event)\.isComposing\s*\|\|\s*(?:e|event)\.keyCode === 229/g) || []).length;
    assert.equal(count, 1, "dock-view.ts 搜索框 keydown 处理器顶部必须有 IME 守卫");
    // 在 searchInput 自己的 keydown 处理器切片内断言：守卫先于 ArrowDown 导航分支
    // （合成期 ArrowUp/Down 属候选导航，文档更早处的其他 ArrowDown 与本契约无关）
    const handlerStart = src.indexOf('this.searchInput.addEventListener("keydown"');
    assert.ok(handlerStart >= 0, "必须存在 searchInput keydown 处理器");
    const handlerBody = src.slice(handlerStart, handlerStart + 900);
    const guardIdx = handlerBody.indexOf("e.isComposing");
    const arrowIdx = handlerBody.indexOf('e.key === "ArrowDown"');
    assert.ok(guardIdx >= 0 && arrowIdx > guardIdx, "IME 守卫必须位于搜索框 ArrowDown 导航分支之前");
});
