"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    transposeMarkdownTable,
    formatTaskProgressBar,
    numberMarkdownHeadings,
} = entry.clipboardCleaner;

test("transposeMarkdownTable: preserves leading and trailing context text around the table", () => {
    const raw = `
### 表格说明前言
以下是关键配置对照表：
| 配置项 | 开发环境 | 生产环境 |
| :--- | :---: | ---: |
| 端口 | 3000 | 8080 |
| 调试模式 | 开启 | 关闭 |
以上是环境配置详情，请注意核对。
`.trim();

    const transposed = transposeMarkdownTable(raw);
    const lines = transposed.split("\n");

    // 1. 前置正文必须完整保留
    assert.equal(lines[0], "### 表格说明前言");
    assert.equal(lines[1], "以下是关键配置对照表：");

    // 2. 表格必须成功转置（原3列转为3行数据行，原3行转为3列）
    assert.ok(lines[2].startsWith("| 配置项 | 端口 | 调试模式 |"));
    assert.ok(lines[3].includes("---"));
    assert.ok(lines[4].startsWith("| 开发环境 | 3000 | 开启 |"));
    assert.ok(lines[5].startsWith("| 生产环境 | 8080 | 关闭 |"));

    // 3. 后置正文必须完整保留
    assert.equal(lines[6], "以上是环境配置详情，请注意核对。");
});

test("formatTaskProgressBar: strictly defends against NaN, negative and zero totals", () => {
    // 1. total 为 NaN 时安全降级为 100
    const barNaN = formatTaskProgressBar(50, { total: NaN });
    assert.ok(barNaN.includes("50%"));
    assert.ok(!barNaN.includes("NaN"));

    // 2. total 为负数时安全降级为 100
    const barNeg = formatTaskProgressBar(30, { total: -10 });
    assert.ok(barNeg.includes("30%"));
    assert.ok(!barNeg.includes("-10"));

    // 3. 数字形式传入 NaN
    const barNumNaN = formatTaskProgressBar(20, NaN);
    assert.ok(barNumNaN.includes("20%"));
    assert.ok(!barNumNaN.includes("NaN"));
});

test("numberMarkdownHeadings: normalizes Windows CRLF without trailing carriage returns", () => {
    const textWithCrlf = "# 第一章 概述\r\n正文段落。\r\n## 背景与现状\r\n更多段落。\r\n### 行业痛点\r\n";

    const numbered = numberMarkdownHeadings(textWithCrlf, { startLevel: 1 });
    const lines = numbered.split("\n");

    assert.equal(lines[0], "# 1. 第一章 概述");
    assert.equal(lines[1], "正文段落。");
    assert.equal(lines[2], "## 1.1 背景与现状");
    assert.equal(lines[3], "更多段落。");
    assert.equal(lines[4], "### 1.1.1 行业痛点");
    assert.ok(!lines.some((l) => l.includes("\r")));
});
