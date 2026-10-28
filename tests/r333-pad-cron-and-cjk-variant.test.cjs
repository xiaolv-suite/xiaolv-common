"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    padLines,
    explainCronExpression,
    convertChineseVariant,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveCronArg,
} = entry.placeholders;

test("padLines: aligns multi-line text to equal width with left, center, or right padding", () => {
    const lines = [
        "short",
        "longer text",
        "mid",
    ].join("\n");

    // 1. 默认左对齐右填充 (依据最长行 'longer text' 11 字符)
    const resLeft = padLines(lines, {align: "left"});
    const leftLines = resLeft.split("\n");
    assert.equal(leftLines[0], "short      ");
    assert.equal(leftLines[1], "longer text");
    assert.equal(leftLines[2], "mid        ");

    // 2. 右对齐左填充
    const resRight = padLines(lines, {align: "right"});
    const rightLines = resRight.split("\n");
    assert.equal(rightLines[0], "      short");
    assert.equal(rightLines[2], "        mid");

    // 3. 居中填充与自定义字符
    const resCenter = padLines("hi\nhello world", {align: "center", padChar: "-"});
    assert.equal(resCenter.split("\n")[0], "----hi-----");
});

test("explainCronExpression: explains 5 to 7 segment cron expressions in natural language", () => {
    // 1. 基础每分钟与间隔
    assert.equal(explainCronExpression("* * * * *"), "每分钟执行一次");
    assert.equal(explainCronExpression("*/10 * * * *"), "每 10 分钟执行一次");

    // 2. 每日定时与整点
    assert.equal(explainCronExpression("0 * * * *"), "每小时整点执行一次");
    assert.equal(explainCronExpression("0 0 * * *"), "每天 00:00 执行一次");
    assert.equal(explainCronExpression("30 9 * * *"), "每天 09:30 执行一次");
    assert.equal(explainCronExpression("0 30 9 * * *"), "每天 09:30 执行一次");

    // 3. 工作日与周末
    assert.equal(explainCronExpression("0 0 18 * * 1-5"), "工作日 (周一至周五) 18:00 执行一次");
    assert.equal(explainCronExpression("0 0 10 * * 0,6"), "周末 (周六和周日) 10:00 执行一次");
});

test("convertChineseVariant: bidirectional conversion between Simplified and Traditional Chinese", () => {
    // 1. 简转繁 (s2t)
    const simp = "开发现代化思源常用语与资产库";
    const resS2T = convertChineseVariant(simp, "s2t");
    assert.ok(resS2T.convertedCount >= 4);
    assert.ok(resS2T.result.includes("開"));
    assert.ok(resS2T.result.includes("發"));
    assert.ok(resS2T.result.includes("語"));
    assert.ok(resS2T.result.includes("與"));

    // 2. 繁转简 (t2s)
    const trad = "開發現代化思源常用語與資產庫";
    const resT2S = convertChineseVariant(trad, "t2s");
    assert.ok(resT2S.convertedCount >= 4);
    assert.ok(resT2S.result.includes("开发"));
    assert.ok(resT2S.result.includes("语"));
    assert.ok(resT2S.result.includes("与"));
});

test("Cron macro: dynamic placeholder expansion for cron expression explanation", () => {
    const now = new Date(2026, 9, 28, 12, 0, 0);

    // 1. 动态宏展开
    const tpl1 = "巡检周期：{{xlc:cron|0 30 9 * * 1-5}}";
    const res1 = applyPlaceholders(tpl1, now, true);
    assert.equal(res1, "巡检周期：工作日 (周一至周五) 09:30 执行一次");

    // 2. 每天零点语法
    const tpl2 = "定时：{{xlc:cron|0 0 * * *}}";
    const res2 = applyPlaceholders(tpl2, now, true);
    assert.equal(res2, "定时：每天 00:00 执行一次");

    // 3. 直接调用 resolveCronArg
    assert.equal(resolveCronArg("* * * * *"), "每分钟执行一次");
    assert.equal(resolveCronArg(""), null);
});
