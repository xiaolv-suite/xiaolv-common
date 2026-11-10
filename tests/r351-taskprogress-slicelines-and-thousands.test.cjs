"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    calculateTaskProgress,
    sliceLinesByPattern,
    formatNumberGrouping,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveThousandsArg,
} = entry.placeholders;

test("calculateTaskProgress: accurately computes counts, percentage, and progress bar", () => {
    const list = `
- [x] 架构设计
- [X] 数据模型
- [ ] 自动化测试
* [ ] 文档编写
1. [x] 发布包构建
`.trim();

    // 1. 统计任务列表
    const res = calculateTaskProgress(list);
    assert.equal(res.total, 5);
    assert.equal(res.completed, 3);
    assert.equal(res.pending, 2);
    assert.equal(res.percent, 60);

    // 2. 进度条结构验证
    assert.ok(res.progressBar.includes("60%"));
    assert.ok(res.progressBar.includes("██████░░░░"));
    assert.equal(res.summary, "任务进度: 3/5 已完成 (60%)");
});

test("sliceLinesByPattern: slices multi-line text by start and end delimiter patterns", () => {
    const doc = `
前言说明
<!-- START_SECTION -->
第一条记录
第二条记录
第三条记录
<!-- END_SECTION -->
后续总结
`.trim();

    // 1. 截取区间包含起止
    const resAll = sliceLinesByPattern(doc, "<!-- START_SECTION -->", "<!-- END_SECTION -->");
    const linesAll = resAll.split("\n");
    assert.equal(linesAll.length, 5);
    assert.equal(linesAll[0], "<!-- START_SECTION -->");
    assert.equal(linesAll[4], "<!-- END_SECTION -->");

    // 2. 截取区间不包含标记
    const resInner = sliceLinesByPattern(doc, "<!-- START_SECTION -->", "<!-- END_SECTION -->", {
        includeStart: false,
        includeEnd: false,
    });
    const linesInner = resInner.split("\n");
    assert.equal(linesInner.length, 3);
    assert.equal(linesInner[0], "第一条记录");
    assert.equal(linesInner[2], "第三条记录");
});

test("formatNumberGrouping: formats numbers with thousands separators and strips them", () => {
    // 1. 正常数值添加千分位
    assert.equal(formatNumberGrouping(1234567.89), "1,234,567.89");
    assert.equal(formatNumberGrouping("-987654321"), "-987,654,321");

    // 2. 剥离千分位逗号
    assert.equal(formatNumberGrouping("1,234,567.89", "remove"), "1234567.89");
    assert.equal(formatNumberGrouping("-987,654,321", "remove"), "-987654321");
});

test("Thousands macro: evaluates {{xlc:thousands}} placeholders dynamically", () => {
    const now = new Date(2026, 9, 29, 12, 0, 0);

    // 1. 默认添加千分位
    const tpl1 = "总金额: {{xlc:thousands|1234567.89}} 元";
    assert.equal(applyPlaceholders(tpl1, now, true), "总金额: 1,234,567.89 元");

    // 2. 冒号子命令剥离千分位
    const tpl2 = "纯数字: {{xlc:thousands:clean|1,234,567.89}}";
    assert.equal(applyPlaceholders(tpl2, now, true), "纯数字: 1234567.89");

    // 3. 管道参数语法剥离千分位
    const tpl3 = "纯数字: {{xlc:thousands|remove|9,876,543}}";
    assert.equal(applyPlaceholders(tpl3, now, true), "纯数字: 9876543");
});
