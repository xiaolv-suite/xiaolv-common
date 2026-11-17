"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    flattenMarkdownBlockquotes,
    reverseWords,
    stripInlineMarkdownFormatting,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveRevwordsArg,
} = entry.placeholders;

test("flattenMarkdownBlockquotes: strips or flattens multi-level blockquotes into clean paragraphs", () => {
    const text = `
> 这是第一级引用
>> 这是第二级引用
>>> 这是第三级引用
普通无引用段落
`.trim();

    // 1. 完全剥离引用标记 (strip)
    const stripped = flattenMarkdownBlockquotes(text, "strip");
    const sLines = stripped.split("\n");
    assert.equal(sLines[0], "这是第一级引用");
    assert.equal(sLines[1], "这是第二级引用");
    assert.equal(sLines[2], "这是第三级引用");
    assert.equal(sLines[3], "普通无引用段落");

    // 2. 扁平化为单级引用 (single_level)
    const singleLevel = flattenMarkdownBlockquotes(text, "single_level");
    const lLines = singleLevel.split("\n");
    assert.equal(lLines[0], "> 这是第一级引用");
    assert.equal(lLines[1], "> 这是第二级引用");
    assert.equal(lLines[2], "> 这是第三级引用");
    assert.equal(lLines[3], "普通无引用段落");
});

test("reverseWords and {{xlc:revwords}}: reverses word order while preserving line structure", () => {
    // 1. 单行单词逆序
    assert.equal(reverseWords("the quick brown fox"), "fox brown quick the");

    // 2. 多行保留行首缩进逆序
    const multi = "  first second\n    alpha beta gamma";
    const reversed = reverseWords(multi);
    assert.equal(reversed, "  second first\n    gamma beta alpha");

    // 3. 动态宏占位符测试
    const now = new Date("2026-10-29T12:00:00");
    assert.equal(applyPlaceholders("{{xlc:revwords|one two three}}", now, true), "three two one");
});

test("stripInlineMarkdownFormatting: strips bold, italic, strikethrough, highlight, and inline code", () => {
    const styled = "这是 **粗体**，这是 *斜体*，这是 ~~删除线~~，这是 ==高亮==，还有 `行内代码`。";
    const clean = stripInlineMarkdownFormatting(styled);
    assert.equal(clean, "这是 粗体，这是 斜体，这是 删除线，这是 高亮，还有 行内代码。");

    // 保护下划线变量名不被误伤 (如 user_first_name)
    const codeVars = "检查变量 user_first_name 与 MAX_RETRY_COUNT 是否正确。";
    assert.equal(stripInlineMarkdownFormatting(codeVars), codeVars);
});
