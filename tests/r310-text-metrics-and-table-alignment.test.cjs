"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
    textMetrics,
    previewRenderer,
} = require("./.build/entry.cjs");

const {calculateTextMetrics, formatReadingMetrics} = textMetrics;
const {parseMarkdownBlocks} = previewRenderer;

test("calculateTextMetrics: handles empty and whitespace text safely", () => {
    const emptyRes = calculateTextMetrics("");
    assert.equal(emptyRes.totalChars, 0);
    assert.equal(emptyRes.cjkChars, 0);
    assert.equal(emptyRes.words, 0);
    assert.equal(emptyRes.readingTimeSeconds, 0);
    assert.equal(emptyRes.formattedReadingTime, "< 1 分钟");
    assert.equal(formatReadingMetrics(emptyRes), "");
});

test("calculateTextMetrics: accurately counts CJK, words, and estimates reading time", () => {
    // 600 个汉字 + 160 个英文单词
    // 中文 600 字 / 5 = 120 秒 (2 分钟)
    // 英文 160 词 / 2.67 ≈ 60 秒 (1 分钟)
    // 合计约 180 秒 = 约 3 分钟
    const cjk = "思源笔记高频内容资产管理复用中枢常用语".repeat(30); // 600 汉字
    const eng = "hello world fast speed search snippet ".repeat(26) + "final word"; // 160 英文词
    const text = `${cjk}\n\n${eng}`;

    const metrics = calculateTextMetrics(text);
    assert.equal(metrics.cjkChars, 570);
    assert.equal(metrics.words >= 155 && metrics.words <= 165, true);
    assert.ok(metrics.readingTimeSeconds >= 170 && metrics.readingTimeSeconds <= 190);
    assert.equal(metrics.formattedReadingTime, "约 3 分钟");

    const formatted = formatReadingMetrics(metrics);
    assert.ok(formatted.includes("字符 · 约 3 分钟"));
});

test("parseMarkdownBlocks: correctly parses table column alignments", () => {
    const md = [
        "| 左对齐 | 居中对齐 | 右对齐 | 默认对齐 |",
        "| :--- | :---: | ---: | --- |",
        "| L1 | C1 | R1 | D1 |",
    ].join("\n");

    const blocks = parseMarkdownBlocks(md);
    const table = blocks.find((b) => b.type === "table");
    assert.ok(table, "Table block must be detected");
    assert.deepEqual(table.tableAlignments, ["left", "center", "right", "left"]);
});
