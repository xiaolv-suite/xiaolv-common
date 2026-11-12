"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    compactBlankLines,
    formatRelativeTime,
    countWordFrequency,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveTimeagoArg,
} = entry.placeholders;

test("compactBlankLines: collapses multiple consecutive empty lines to single empty line", () => {
    const raw = [
        "第一段文字",
        "",
        "   ",
        "\t\t",
        "",
        "第二段文字",
        "",
        "",
        "第三段文字",
    ].join("\n");

    const res = compactBlankLines(raw, {maxConsecutive: 1});
    assert.equal(res.collapsedCount, 4);
    assert.equal(
        res.result,
        "第一段文字\n\n第二段文字\n\n第三段文字"
    );
});

test("formatRelativeTime: formats timestamps into human-readable relative time", () => {
    const now = new Date(2026, 9, 28, 12, 0, 0); // 2026-10-28 12:00:00

    // 1. 刚刚 (30秒前)
    const justNow = new Date(now.getTime() - 30 * 1000);
    assert.equal(formatRelativeTime(justNow, now), "刚刚");

    // 2. 10 分钟前
    const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000);
    assert.equal(formatRelativeTime(tenMinAgo, now), "10分钟前");

    // 3. 2 小时前
    const twoHoursAgo = new Date(now.getTime() - 2 * 3600 * 1000);
    assert.equal(formatRelativeTime(twoHoursAgo, now), "2小时前");

    // 4. 昨天
    const yesterday = new Date(now.getTime() - 36 * 3600 * 1000);
    assert.equal(formatRelativeTime(yesterday, now), "昨天");

    // 5. 5 天前
    const fiveDaysAgo = new Date(now.getTime() - 5 * 86400 * 1000);
    assert.equal(formatRelativeTime(fiveDaysAgo, now), "5天前");

    // 6. 未来时间
    const future = new Date(now.getTime() + 15 * 60 * 1000);
    assert.equal(formatRelativeTime(future, now), "15分钟后");
});

test("countWordFrequency: counts top frequent words and calculates distribution", () => {
    const article = [
        "Siyuan is a privacy-first personal knowledge management system.",
        "Siyuan supports local-first data storage and sync.",
        "Siyuan is powerful and fast for knowledge assets.",
    ].join(" ");

    // 统计 top 3 词频（过滤停用词 is, a, and, for 等）
    const freqRes = countWordFrequency(article, {topN: 3, ignoreStopWords: true});
    assert.ok(freqRes.items.length > 0);
    assert.equal(freqRes.items[0].word, "siyuan");
    assert.equal(freqRes.items[0].count, 3);
    assert.ok(freqRes.items[0].frequency > 0);
    assert.ok(freqRes.result.includes("1. siyuan: 3次"));
});

test("Timeago macro: dynamic placeholder expansion for relative time", () => {
    const now = new Date(2026, 9, 28, 12, 0, 0);

    // 1. 刚刚语法
    const tpl1 = "更新状态：{{xlc:timeago|now}}";
    const res1 = applyPlaceholders(tpl1, now, true);
    assert.equal(res1, "更新状态：刚刚");

    // 2. 过去时间戳 (5 分钟前)
    const fiveMinAgoSec = Math.floor((now.getTime() - 5 * 60 * 1000) / 1000);
    const tpl2 = "耗时：{{xlc:timeago|" + fiveMinAgoSec + "}}";
    const res2 = applyPlaceholders(tpl2, now, true);
    assert.equal(res2, "耗时：5分钟前");

    // 3. 直接调用 resolveTimeagoArg
    assert.equal(resolveTimeagoArg("now", now), "刚刚");
    assert.equal(resolveTimeagoArg("", now), "刚刚");
});
