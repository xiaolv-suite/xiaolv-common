"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    measureVisualWidth,
    evaluateTernaryCondition,
    shiftListIndentation,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveIfArg,
} = entry.placeholders;

test("measureVisualWidth: accurately measures visual width, CJK characters, and ASCII characters", () => {
    // 1. 纯 ASCII 英文
    const mAscii = measureVisualWidth("hello");
    assert.equal(mAscii.visualWidth, 5);
    assert.equal(mAscii.charCount, 5);
    assert.equal(mAscii.cjkCount, 0);
    assert.equal(mAscii.asciiCount, 5);

    // 2. 纯中文汉字
    const mCjk = measureVisualWidth("你好世界");
    assert.equal(mCjk.visualWidth, 8); // 每个汉字算 2 宽
    assert.equal(mCjk.charCount, 4);
    assert.equal(mCjk.cjkCount, 4);
    assert.equal(mCjk.asciiCount, 0);

    // 3. 中英混排
    const mMixed = measureVisualWidth("思源笔记 Pro");
    // "思源笔记" = 8, " " = 1, "Pro" = 3 -> 12 宽
    assert.equal(mMixed.visualWidth, 12);
    assert.equal(mMixed.charCount, 8);
    assert.equal(mMixed.cjkCount, 4);
    assert.equal(mMixed.asciiCount, 4);
});

test("evaluateTernaryCondition and {{xlc:if}}: evaluates comparisons, substring matching, and truthiness safely", () => {
    const now = new Date("2026-10-29T12:00:00");

    // 1. 数值比较 (>, <=)
    assert.equal(applyPlaceholders("{{xlc:if|10 > 5|大于五|小于等于五}}", now, true), "大于五");
    assert.equal(applyPlaceholders("{{xlc:if|3 >= 5|真|假}}", now, true), "假");

    // 2. 字符串比较 (==, !=)
    assert.equal(applyPlaceholders("{{xlc:if|role == 'admin'|管理员面板|普通用户}}", now, true), "普通用户");
    assert.equal(applyPlaceholders("{{xlc:if|'admin' == 'admin'|管理员面板|普通用户}}", now, true), "管理员面板");

    // 3. 子串包含判断 (contains)
    assert.equal(applyPlaceholders("{{xlc:if|'思源笔记' contains '笔记'|包含|未包含}}", now, true), "包含");

    // 4. 真假值判断 (true, 0, false)
    assert.equal(applyPlaceholders("{{xlc:if|true|开启|关闭}}", now, true), "开启");
    assert.equal(applyPlaceholders("{{xlc:if|0|开启|关闭}}", now, true), "关闭");

    // 5. 反转条件 (:not)
    assert.equal(applyPlaceholders("{{xlc:if:not|true|开启|关闭}}", now, true), "关闭");
});

test("shiftListIndentation: batch shifts list item indentation levels while preserving paragraphs", () => {
    const list = `
# 标题行
- 列表项 A
  - 嵌套项 B
1. 有序项 C
普通正文段落
`.trim();

    // 1. 缩进增加 2 空格
    const shifted = shiftListIndentation(list, 2);
    const lines = shifted.split("\n");
    assert.equal(lines[0], "# 标题行");
    assert.equal(lines[1], "  - 列表项 A");
    assert.equal(lines[2], "    - 嵌套项 B");
    assert.equal(lines[3], "  1. 有序项 C");
    assert.equal(lines[4], "普通正文段落");

    // 2. 缩进减少 2 空格 (底限 0)
    const outdented = shiftListIndentation(shifted, -2);
    assert.equal(outdented, list);
});
