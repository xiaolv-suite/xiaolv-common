"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
    stripInvisibleCharacters,
    mergeSoftLinebreaks,
    compactWhitespaceAndLines,
    cleanClipboardText,
} = require("./.build/entry.cjs").clipboardCleaner;

test("stripInvisibleCharacters: 剥离零宽字符、BOM与控制字符", () => {
    // 包含零宽空格 \u200B 与 BOM \uFEFF
    const dirty = "客户\u200B经理\uFEFF电话";
    const res = stripInvisibleCharacters(dirty);
    assert.equal(res.result, "客户经理电话");
    assert.equal(res.count, 2);

    // 纯文本无不可见字符
    const clean = stripInvisibleCharacters("正常文本");
    assert.equal(clean.result, "正常文本");
    assert.equal(clean.count, 0);
});

test("mergeSoftLinebreaks: 智能合并单行硬断行 (中英文场景区分)", () => {
    // 中文场景：无缝拼接（不留多余空格）
    const cjkText = "这是第一句中文，\n这是紧接的下一句。";
    const cjkRes = mergeSoftLinebreaks(cjkText);
    assert.equal(cjkRes.result, "这是第一句中文，这是紧接的下一句。");
    assert.equal(cjkRes.mergedCount, 1);

    // 英文场景：以单个空格连接两个单词
    const enText = "Hello\nWorld";
    const enRes = mergeSoftLinebreaks(enText);
    assert.equal(enRes.result, "Hello World");
    assert.equal(enRes.mergedCount, 1);

    // 段落双换行：保留段落结构，不合并
    const paraText = "第一段第一行\n第一段第二行\n\n第二段开始";
    const paraRes = mergeSoftLinebreaks(paraText);
    assert.equal(paraRes.result, "第一段第一行第一段第二行\n\n第二段开始");
});

test("compactWhitespaceAndLines: 清理行尾空白与连续多余空行", () => {
    const raw = "第一行   \n第二行\t\t\n\n\n\n第三行";
    const res = compactWhitespaceAndLines(raw);
    assert.equal(res.result, "第一行\n第二行\n\n第三行");
    assert.ok(res.trimmedLines >= 2);
});

test("cleanClipboardText: 综合管线端到端清洗", () => {
    const raw = "第一段\u200B首句\n这是第二句   \n\n\n\n第二段Hello\nWorld\uFEFF！";
    const res = cleanClipboardText(raw, {
        stripInvisible: true,
        mergeSoftBreaks: true,
        compactEmptyLines: true,
    });

    assert.equal(res.hasChanges, true);
    assert.ok(res.changeDetails.length >= 2);
    // 零宽字符剔除
    assert.ok(!res.cleanedText.includes("\u200B"));
    assert.ok(!res.cleanedText.includes("\uFEFF"));
    // 连续空行压缩为双换行
    assert.ok(!res.cleanedText.includes("\n\n\n"));
    assert.ok(res.cleanedText.includes("第一段首句这是第二句"));
});
