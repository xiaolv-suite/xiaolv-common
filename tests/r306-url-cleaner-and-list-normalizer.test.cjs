"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {clipboardCleaner} = require("./.build/entry.cjs");

const {
    stripUrlTrackingParams,
    normalizeListFormatting,
    cleanClipboardText,
} = clipboardCleaner;

test("stripUrlTrackingParams: removes tracking analytics parameters and preserves business queries", () => {
    // 1. 常见营销 utm_* 参数
    const raw1 = "请访问文章：https://example.com/blog/article?utm_source=twitter&utm_medium=social&id=9527#section-1";
    const res1 = stripUrlTrackingParams(raw1);
    assert.equal(res1.cleanedCount, 2);
    assert.equal(res1.result, "请访问文章：https://example.com/blog/article?id=9527#section-1");

    // 2. 常见国内分享追踪参数 (spm_id_from, vd_source, share_token)
    const raw2 = "https://www.bilibili.com/video/BV1xx411c7X?spm_id_from=333.337.search&vd_source=abcdef123";
    const res2 = stripUrlTrackingParams(raw2);
    assert.equal(res2.cleanedCount, 2);
    assert.equal(res2.result, "https://www.bilibili.com/video/BV1xx411c7X");

    // 3. 社交平台参数 (fbclid, igshid, si)
    const raw3 = "https://music.example.com/track/123?si=spotify123&user=alice";
    const res3 = stripUrlTrackingParams(raw3);
    assert.equal(res3.cleanedCount, 1);
    assert.equal(res3.result, "https://music.example.com/track/123?user=alice");

    // 4. 无追踪参数的 URL 保持原样
    const cleanUrl = "https://github.com/xiaolv-suite/xiaolv-common?tab=readme";
    const res4 = stripUrlTrackingParams(cleanUrl);
    assert.equal(res4.cleanedCount, 0);
    assert.equal(res4.result, cleanUrl);
});

test("normalizeListFormatting: transforms mixed list syntax into standard markdown ordered list", () => {
    const raw = [
        "1、需求评审与排期",
        "2. 前端界面与动效研发",
        "（3）端到端契约测试",
        "4: 发布与上线验证",
    ].join("\n");

    const converted = normalizeListFormatting(raw, "markdown-ol");
    assert.equal(converted.convertedCount, 4);
    const expected = [
        "1. 需求评审与排期",
        "2. 前端界面与动效研发",
        "3. 端到端契约测试",
        "4. 发布与上线验证",
    ].join("\n");
    assert.equal(converted.result, expected);
});

test("normalizeListFormatting: transforms into Chinese circled digits (①②③)", () => {
    const raw = [
        "- 晨会同步",
        "- 需求对齐",
        "- 代码审查",
    ].join("\n");

    const converted = normalizeListFormatting(raw, "chinese-circled");
    assert.equal(converted.convertedCount, 3);
    const expected = [
        "① 晨会同步",
        "② 需求对齐",
        "③ 代码审查",
    ].join("\n");
    assert.equal(converted.result, expected);
});

test("normalizeListFormatting: non-list plain text is safely preserved", () => {
    const normalText = "这是一段普通的单行文本，不包含任何列表特征。";
    const res = normalizeListFormatting(normalText);
    assert.equal(res.convertedCount, 0);
    assert.equal(res.result, normalText);
});

test("cleanClipboardText: integration with stripUrlTrackers", () => {
    const text = "参考链接：https://example.com/p?utm_source=wechat&tag=tech\u200B";
    const cleaned = cleanClipboardText(text, {
        stripInvisible: true,
        stripUrlTrackers: true,
    });
    assert.equal(cleaned.cleanedText, "参考链接：https://example.com/p?tag=tech");
    assert.ok(cleaned.changeDetails.some((d) => d.includes("URL 跟踪分析参数")));
});
