"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    alignMarkdownTableColumns,
    padOrTruncate,
    sanitizeLineEndingsAndSpaces,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolvePadArg,
} = entry.placeholders;

test("alignMarkdownTableColumns: batch converts table delimiter row alignments", () => {
    const table = `
| 姓名 | 年龄 | 职业 | 城市 |
| --- | --- | --- | --- |
| Alice | 25 | Engineer | Beijing |
| Bob | 30 | Designer | Shanghai |
`.trim();

    // 1. 单个对齐方式应用于全表所有列
    const centerAll = alignMarkdownTableColumns(table, "center");
    assert.ok(centerAll.includes("| :---: | :---: | :---: | :---: |"));
    assert.ok(centerAll.includes("| Alice | 25 | Engineer | Beijing |"));

    const rightAll = alignMarkdownTableColumns(table, "right");
    assert.ok(rightAll.includes("| ---: | ---: | ---: | ---: |"));

    const leftAll = alignMarkdownTableColumns(table, "left");
    assert.ok(leftAll.includes("| :--- | :--- | :--- | :--- |"));

    // 2. 指定每列不同对齐方式
    const mixed = alignMarkdownTableColumns(table, ["left", "right", "center", "right"]);
    assert.ok(mixed.includes("| :--- | ---: | :---: | ---: |"));

    // 3. 非表格文本安全原样返回
    const nonTable = "这是一个普通段落\n没有表格结构";
    assert.equal(alignMarkdownTableColumns(nonTable, "center"), nonTable);
});

test("padOrTruncate: pads short text to fixed width and truncates long text", () => {
    // 1. 左对齐（右侧补齐）
    assert.equal(padOrTruncate("hello", 10), "hello     ");
    assert.equal(padOrTruncate("hello", 10, {direction: "left"}), "hello     ");

    // 2. 右对齐（左侧补齐）与自定义填充符
    assert.equal(padOrTruncate("hello", 10, {direction: "right"}), "     hello");
    assert.equal(padOrTruncate("42", 6, {direction: "right", padChar: "0"}), "000042");

    // 3. 居中补齐
    const centered = padOrTruncate("test", 10, {direction: "center"});
    assert.equal(centered.length, 10);
    assert.equal(centered, "   test   ");

    // 4. 超长文本截断（不带省略号）
    assert.equal(padOrTruncate("internationalization", 8), "internat");

    // 5. 超长文本截断（带省略号）
    assert.equal(padOrTruncate("internationalization", 8, {ellipsis: true}), "inter...");

    // 6. CJK 中文字符双倍视觉宽度
    // "你好" 视觉宽度 4，补齐到 8 -> 右侧补 4 空格
    assert.equal(padOrTruncate("你好", 8), "你好    ");
    // "你好世界" 视觉宽度 8，截断到 6 -> "你好世" (视觉宽度 6)
    assert.equal(padOrTruncate("你好世界", 6), "你好世");
});

test("{{xlc:pad}}: dynamic placeholder macro evaluates fixed width padding and truncation", () => {
    const now = new Date("2026-10-29T12:00:00");

    // 1. 默认左对齐补齐
    assert.equal(applyPlaceholders("{{xlc:pad|10|hello}}", now, true), "hello     ");

    // 2. 冒号子命令指定右对齐与居中
    assert.equal(applyPlaceholders("{{xlc:pad:right|10|hello}}", now, true), "     hello");
    assert.equal(applyPlaceholders("{{xlc:pad:center|10|test}}", now, true), "   test   ");

    // 3. 右对齐前导零数值补齐
    assert.equal(applyPlaceholders("{{xlc:pad:right|8|123|0}}", now, true), "00000123");

    // 4. 超长内容截断
    assert.equal(applyPlaceholders("{{xlc:pad|5|abcdefghijk}}", now, true), "abcde");

    // 5. 参数内管道形式指定方向
    assert.equal(applyPlaceholders("{{xlc:pad|right|8|99|0}}", now, true), "00000099");
});

test("sanitizeLineEndingsAndSpaces: cleans trailing whitespace, NBSP, and normalizes line endings", () => {
    // 包含行尾空格、制表符、\r\n 换行符以及 NBSP (\u00A0)
    const messy = "Title line    \r\nFirst paragraph with\u00A0non-breaking\u00A0space.\t\t\r\n\r\nCode line: console.log('ok');   \r\n";
    const res = sanitizeLineEndingsAndSpaces(messy);

    assert.ok(res.fixedCount > 0);
    // 保证不再包含 \r 或行尾空格
    assert.ok(!res.result.includes("\r"));
    assert.ok(!res.result.includes("\u00A0"));
    assert.ok(res.result.includes("First paragraph with non-breaking space."));
    assert.ok(res.result.includes("Code line: console.log('ok');"));
});
