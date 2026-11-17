"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    zipLines,
    calculateStats,
    slugifyText,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveStatsArg,
} = entry.placeholders;

test("zipLines: merges two multi-line texts pairwise or alternately", () => {
    const listA = "name\nage\ncity";
    const listB = "Alice\n28\nBeijing";

    // 1. inline 模式 (默认 ": " 分隔)
    const resInline = zipLines(listA, listB);
    assert.equal(resInline, "name: Alice\nage: 28\ncity: Beijing");

    // 2. 自定义分隔符
    const resArrow = zipLines(listA, listB, {separator: " -> "});
    assert.equal(resArrow, "name -> Alice\nage -> 28\ncity -> Beijing");

    // 3. alternate 交叉换行模式
    const resAlt = zipLines(listA, listB, {mode: "alternate"});
    assert.equal(resAlt, "name\nAlice\nage\n28\ncity\nBeijing");
});

test("calculateStats: calculates mean, median, variance, and standard deviation", () => {
    // 1. 奇数个样本 [10, 20, 30, 40, 50]
    const resOdd = calculateStats([10, 20, 30, 40, 50]);
    assert.equal(resOdd.count, 5);
    assert.equal(resOdd.sum, 150);
    assert.equal(resOdd.average, 30);
    assert.equal(resOdd.median, 30);
    assert.equal(resOdd.variance, 200); // sum((x-30)^2)/5 = (400+100+0+100+400)/5 = 200
    assert.equal(resOdd.stdDev, 14.14); // sqrt(200) ≈ 14.14

    // 2. 偶数个样本 [1, 2, 3, 4]
    const resEven = calculateStats("1, 2, 3, 4");
    assert.equal(resEven.count, 4);
    assert.equal(resEven.median, 2.5);

    // 3. 格式化结果输出
    assert.ok(resOdd.result.includes("均值: 30"));
    assert.ok(resOdd.result.includes("中位数: 30"));
});

test("slugifyText: converts titles and phrases into URL and Git slugs", () => {
    // 1. 纯英文标题与标点
    assert.equal(slugifyText("10 Tips for Better Code!"), "10-tips-for-better-code");

    // 2. 中英混排与多余空白
    assert.equal(slugifyText("  思源笔记 常用语 2026 插件  "), "思源笔记-常用语-2026-插件");

    // 3. 自定义下划线分隔符与保留大写
    assert.equal(slugifyText("User Profile Service", {separator: "_", lowercase: false}), "User_Profile_Service");
});

test("Stats macro: dynamic placeholder expansion for advanced numeric metrics", () => {
    const now = new Date(2026, 9, 28, 12, 0, 0);

    // 1. 默认全量输出
    const tpl1 = "统计看板：{{xlc:stats|10, 20, 30, 40, 50}}";
    const res1 = applyPlaceholders(tpl1, now, true);
    assert.ok(res1.includes("均值: 30"));
    assert.ok(res1.includes("中位数: 30"));

    // 2. 冒号子命令取中位数
    const tpl2 = "中位数：{{xlc:stats:median|10, 50, 30}}";
    const res2 = applyPlaceholders(tpl2, now, true);
    assert.equal(res2, "中位数：30");

    // 3. 管道语法取平均值
    const tpl3 = "均值：{{xlc:stats|avg|10, 20, 30}}";
    const res3 = applyPlaceholders(tpl3, now, true);
    assert.equal(res3, "均值：20");

    // 4. 直接调用 resolveStatsArg
    assert.equal(resolveStatsArg("10, 20, 30", "sum"), "60");
    assert.equal(resolveStatsArg("", "sum"), null);
});
