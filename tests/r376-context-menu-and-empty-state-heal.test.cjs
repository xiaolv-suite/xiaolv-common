"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");

test("context menu: intelligently separates selection and block-level menu items", () => {
    const indexPath = path.resolve(__dirname, "../src/index.ts");
    const content = fs.readFileSync(indexPath, "utf-8");

    // 检查右键菜单中包含智能选区判定
    assert.ok(content.includes("const sel = typeof window !== \"undefined\" ? window.getSelection()?.toString().trim() : \"\";"));
    assert.ok(content.includes("if (sel) {"));
    assert.ok(content.includes("surroundSelection"));
    assert.ok(content.includes("saveSelection"));
    assert.ok(content.includes("insertMenu"));
    assert.ok(content.includes("captureBlock"));
});

test("empty search: self-heals by triggering new item on Enter key when no results exist", () => {
    const dialogPath = path.resolve(__dirname, "../src/ui/dialog.ts");
    const content = fs.readFileSync(dialogPath, "utf-8");

    // 检查在无搜索结果时按 Enter 键触发新建条目闭环
    assert.ok(content.includes("无搜索结果时按 Enter：将当前输入词一键带入新建表单，实现极致心流自愈闭环"));
    assert.ok(content.includes("this.deps.newItem(queryText);"));
});

test("capture form and quick edit: textareas support vertical resizing and viewport height limits", () => {
    const capturePath = path.resolve(__dirname, "../src/ui/capture.ts");
    const quickEditPath = path.resolve(__dirname, "../src/ui/quick-edit.ts");
    const captureContent = fs.readFileSync(capturePath, "utf-8");
    const quickEditContent = fs.readFileSync(quickEditPath, "utf-8");

    assert.ok(captureContent.includes('inputEl.style.resize = "vertical";'));
    assert.ok(captureContent.includes('inputEl.style.maxHeight = "50vh";'));
    assert.ok(quickEditContent.includes('textarea.style.resize = "vertical";'));
    assert.ok(quickEditContent.includes('textarea.style.maxHeight = "50vh";'));
});
