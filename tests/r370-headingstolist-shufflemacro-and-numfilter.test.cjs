"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    convertHeadingsToList,
    shuffleList,
    filterNumericRangeLines,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveShuffleArg,
} = entry.placeholders;

test("convertHeadingsToList: converts between markdown headings and indented lists bidirectionally", () => {
    const headings = `
# 第一章 引言
## 1.1 背景
### 1.1.1 现状
## 1.2 目标
`.trim();

    // 1. 标题转层级列表
    const list = convertHeadingsToList(headings, "headings_to_list");
    const lLines = list.split("\n");
    assert.equal(lLines[0], "- 第一章 引言");
    assert.equal(lLines[1], "  - 1.1 背景");
    assert.equal(lLines[2], "    - 1.1.1 现状");
    assert.equal(lLines[3], "  - 1.2 目标");

    // 2. 列表转回标题 (默认 baseHeadingLevel: 1)
    const backToHeadings = convertHeadingsToList(list, "list_to_headings");
    const hLines = backToHeadings.split("\n");
    assert.equal(hLines[0], "# 第一章 引言");
    assert.equal(hLines[1], "## 1.1 背景");
    assert.equal(hLines[2], "### 1.1.1 现状");
    assert.equal(hLines[3], "## 1.2 目标");
});

test("shuffleList and {{xlc:shuffle}}: randomly shuffles lists by delimiter or lines", () => {
    // 1. 逗号列表打乱（元素保持不变）
    const commaList = "苹果,香蕉,橙子,西瓜,芒果";
    const shuffled = shuffleList(commaList);
    const items = shuffled.split(",");
    assert.equal(items.length, 5);
    assert.ok(items.includes("苹果"));
    assert.ok(items.includes("香蕉"));
    assert.ok(items.includes("芒果"));

    // 2. 动态宏占位符测试
    const now = new Date("2026-10-29T12:00:00");
    const macroRes = applyPlaceholders("{{xlc:shuffle|A,B,C,D,E}}", now, true);
    const macroItems = macroRes.split(",");
    assert.equal(macroItems.length, 5);
    assert.ok(macroItems.includes("A"));
    assert.ok(macroItems.includes("E"));
});

test("filterNumericRangeLines: filters lines based on numeric values in range", () => {
    const report = `
项目 Alpha: 45 分
项目 Beta: 120 分
项目 Gamma: 88 分
项目 Delta: 240 分
项目 Epsilon: 15 分
`.trim();

    // 1. 过滤 >= 100 的行
    const highScores = filterNumericRangeLines(report, 100);
    const hLines = highScores.split("\n");
    assert.equal(hLines.length, 2);
    assert.ok(highScores.includes("项目 Beta: 120 分"));
    assert.ok(highScores.includes("项目 Delta: 240 分"));
    assert.ok(!highScores.includes("项目 Alpha"));

    // 2. 过滤 50 ~ 100 区间
    const midScores = filterNumericRangeLines(report, 50, 100);
    assert.equal(midScores, "项目 Gamma: 88 分");
});
