"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");

test("dialog.ts: Esc key in multi-select mode exits multi-select without closing dialog", () => {
    const dialogPath = path.resolve(__dirname, "../src/ui/dialog.ts");
    const content = fs.readFileSync(dialogPath, "utf-8");

    // 检查 Esc 事件中优先拦截多选模式
    assert.ok(content.includes("if (this.multiSelectMode && e.key === \"Escape\") {"));
    assert.ok(content.includes("this.exitMultiSelectMode();"));
});

test("dialog.ts: Alt+Backspace clears scope path prefixes in search input", () => {
    const dialogPath = path.resolve(__dirname, "../src/ui/dialog.ts");
    const content = fs.readFileSync(dialogPath, "utf-8");

    // 检查 Alt+Backspace 清除路径限定符
    assert.ok(content.includes('e.altKey && (e.key === "Backspace" || e.key === "Delete")'));
    assert.ok(content.includes('replace(/(?:in|path|book|box):[^\\s]+/gi, "")'));
});

test("capture.ts: alias input performs debounced duplicate check and warns inline", () => {
    const capturePath = path.resolve(__dirname, "../src/ui/capture.ts");
    const content = fs.readFileSync(capturePath, "utf-8");

    // 检查别名输入框查重事件与提示
    assert.ok(content.includes("this.deps.checkAliasConflict(currentAlias)"));
    assert.ok(content.includes("⚠️ 该别名已被「"));
    assert.ok(content.includes("aliasHint.style.color = \"var(--xlc-warm-ink)\""));
});
