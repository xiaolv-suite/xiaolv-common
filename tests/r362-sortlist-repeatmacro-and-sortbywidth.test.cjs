"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    sortMarkdownList,
    repeatText,
    sortLinesByVisualWidth,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveRepeatArg,
} = entry.placeholders;

test("sortMarkdownList: sorts list items by pinyin/alphabet while carrying nested sub-items and renumbering", () => {
    // 1. 无序列表按拼音字母自然升序 (橙子 -> 苹果 -> 香蕉)
    const unordered = `
- 香蕉
- 苹果
- 橙子
`.trim();

    const sortedUnordered = sortMarkdownList(unordered);
    const lines = sortedUnordered.split("\n");
    assert.equal(lines[0], "- 橙子");
    assert.equal(lines[1], "- 苹果");
    assert.equal(lines[2], "- 香蕉");

    // 2. 有序列表排序并自动连续递增自增重编号
    const ordered = `
1. 香蕉
2. 苹果
3. 橙子
`.trim();

    const sortedOrdered = sortMarkdownList(ordered);
    const ordLines = sortedOrdered.split("\n");
    assert.equal(ordLines[0], "1. 橙子");
    assert.equal(ordLines[1], "2. 苹果");
    assert.equal(ordLines[2], "3. 香蕉");

    // 3. 嵌套子列表整体随父项联动
    const nested = `
- 动物
  - 鸟类
  - 哺乳类
- 植物
  - 树木
`.trim();

    const sortedNested = sortMarkdownList(nested, {descending: true});
    assert.ok(sortedNested.startsWith("- 植物"));
    assert.ok(sortedNested.includes("  - 树木"));
    assert.ok(sortedNested.includes("- 动物"));
});

test("repeatText: repeats characters or phrases with delimiters and safety limits", () => {
    // 1. 基础重复
    assert.equal(repeatText("=", 10), "==========");
    assert.equal(repeatText("*", 5), "*****");

    // 2. 自定义分隔符
    assert.equal(repeatText("abc", 3, {delimiter: "-"}), "abc-abc-abc");

    // 3. 0次与空保护
    assert.equal(repeatText("a", 0), "");
    assert.equal(repeatText("", 10), "");

    // 4. 超长截断安全上限
    const longRep = repeatText("a", 3000);
    assert.equal(longRep.length, 500); // 单次上限 500
});

test("{{xlc:repeat}}: dynamic placeholder macro evaluates repeated text", () => {
    const now = new Date("2026-10-29T12:00:00");

    // 1. 符号与次数
    assert.equal(applyPlaceholders("{{xlc:repeat|=|20}}", now, true), "====================");
    assert.equal(applyPlaceholders("{{xlc:repeat|*|5}}", now, true), "*****");

    // 2. 次数在前、符号在后
    assert.equal(applyPlaceholders("{{xlc:repeat|8|#}}", now, true), "########");
});

test("sortLinesByVisualWidth: sorts lines by CJK double-width character visual length", () => {
    // 视觉长度比较:
    // "a" -> 1
    // "abc" -> 3
    // "你好" -> 4 (每个汉字 2 宽)
    // "Hello World" -> 11
    // "你好世界" -> 8
    const text = `
Hello World
a
你好
abc
你好世界
`.trim();

    // 1. 升序排列
    const sortedAsc = sortLinesByVisualWidth(text);
    const ascLines = sortedAsc.split("\n");
    assert.equal(ascLines[0], "a");
    assert.equal(ascLines[1], "abc");
    assert.equal(ascLines[2], "你好");
    assert.equal(ascLines[3], "你好世界");
    assert.equal(ascLines[4], "Hello World");

    // 2. 降序排列 (descending: true)
    const sortedDesc = sortLinesByVisualWidth(text, {descending: true});
    const descLines = sortedDesc.split("\n");
    assert.equal(descLines[0], "Hello World");
    assert.equal(descLines[descLines.length - 1], "a");
});
