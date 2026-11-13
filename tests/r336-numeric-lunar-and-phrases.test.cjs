"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    sumNumericLines,
    getChineseZodiacAndStemBranch,
    extractRepeatedPhrases,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveLunarArg,
} = entry.placeholders;

test("sumNumericLines: extracts numbers from lines and calculates sum, avg, min, and max", () => {
    const expenses = [
        "交通费: 35.5",
        "午餐餐饮: 80",
        "住宿发票: 320",
        "普通未带数字说明行",
        "补充耗材: 64.5",
    ].join("\n");

    const res = sumNumericLines(expenses);
    assert.equal(res.count, 4);
    assert.equal(res.sum, 500); // 35.5 + 80 + 320 + 64.5 = 500
    assert.equal(res.average, 125);
    assert.equal(res.min, 35.5);
    assert.equal(res.max, 320);
    assert.ok(res.result.includes("合计: 500"));
    assert.ok(res.result.includes("平均: 125"));
    assert.ok(res.result.includes("笔数: 4"));
});

test("getChineseZodiacAndStemBranch: converts Gregorian year to Chinese Stem-Branch and Zodiac", () => {
    // 1. 2026 丙午马年
    const res2026 = getChineseZodiacAndStemBranch(2026);
    assert.equal(res2026.stemBranch, "丙午");
    assert.equal(res2026.zodiac, "马");
    assert.equal(res2026.full, "丙午年 (马年)");

    // 2. 2024 甲辰龙年
    const res2024 = getChineseZodiacAndStemBranch(2024);
    assert.equal(res2024.stemBranch, "甲辰");
    assert.equal(res2024.zodiac, "龙");
    assert.equal(res2024.full, "甲辰年 (龙年)");
});

test("extractRepeatedPhrases: extracts high-frequency repeated phrases from text", () => {
    const text = [
        "思源笔记是一款注重隐私的本地优先个人知识管理工具。",
        "在思源笔记中，我们可以通过常用语插件沉淀高频资产。",
        "思源笔记的块级原子能力非常适合打造知识管理工作流。",
    ].join("\n");

    const res = extractRepeatedPhrases(text, {minCount: 2, minLength: 2, maxLength: 4});
    assert.ok(res.items.length > 0);
    // "思源笔记" 出现了 3 次
    const sy = res.items.find((it) => it.phrase === "思源笔记");
    assert.ok(sy !== undefined);
    assert.equal(sy.count, 3);
    assert.ok(res.result.includes("「思源笔记」: 重复 3 次"));
});

test("Lunar macro: dynamic placeholder expansion for Stem-Branch and Zodiac year", () => {
    const now = new Date(2026, 9, 28, 12, 0, 0);

    // 1. 当前年份农历宏 (全量)
    const tpl1 = "当前年份：{{xlc:lunar:year}}";
    const res1 = applyPlaceholders(tpl1, now, true);
    assert.equal(res1, "当前年份：丙午年 (马年)");

    // 2. 管道指定年份与干支模式
    const tpl2 = "2024干支：{{xlc:lunar|stembranch|2024}}";
    const res2 = applyPlaceholders(tpl2, now, true);
    assert.equal(res2, "2024干支：甲辰");

    // 3. 生肖模式
    const tpl3 = "生肖属相：{{xlc:lunar|zodiac|2026}}";
    const res3 = applyPlaceholders(tpl3, now, true);
    assert.equal(res3, "生肖属相：马");

    // 4. 直接调用 resolveLunarArg
    assert.equal(resolveLunarArg("2026", now, "full"), "丙午年 (马年)");
});
