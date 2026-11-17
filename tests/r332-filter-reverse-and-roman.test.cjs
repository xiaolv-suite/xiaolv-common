"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    filterLines,
    reverseText,
    romanToArabic,
    arabicToRoman,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveReverseArg,
} = entry.placeholders;

test("filterLines: filters lines matching keyword or regex, supports inversion", () => {
    const logText = [
        "2026-10-28 [INFO] 系统启动成功",
        "2026-10-28 [DEBUG] 正在拉取配置文件",
        "2026-10-28 [ERROR] 数据库连接超时",
        "2026-10-28 [INFO] 重试完成",
        "2026-10-28 [ERROR] 响应失败",
    ].join("\n");

    // 1. 保留包含 ERROR 的行
    const resError = filterLines(logText, "ERROR");
    assert.equal(resError.matchedCount, 2);
    assert.equal(resError.totalCount, 5);
    assert.equal(
        resError.result,
        "2026-10-28 [ERROR] 数据库连接超时\n2026-10-28 [ERROR] 响应失败"
    );

    // 2. 排除包含 DEBUG 的行 (invert: true)
    const resNoDebug = filterLines(logText, "DEBUG", {invert: true});
    assert.equal(resNoDebug.matchedCount, 1);
    assert.ok(!resNoDebug.result.includes("DEBUG"));
    assert.equal(resNoDebug.result.split("\n").length, 4);

    // 3. 正则表达式过滤
    const resRegex = filterLines(logText, /\[(INFO|DEBUG)\]/);
    assert.equal(resRegex.matchedCount, 3);
});

test("reverseText: reverses characters safely with Unicode and Emoji support", () => {
    // 1. ASCII 与中文字符反转
    assert.equal(reverseText("Hello World"), "dlroW olleH");
    assert.equal(reverseText("小驴常用思源插件"), "件插源思用常驴小");

    // 2. Emoji 与多字节代理对符号安全反转 (不出现乱码破裂)
    const emojiText = "Hello 😊 世界";
    assert.equal(reverseText(emojiText), "界世 😊 olleH");
});

test("romanToArabic and arabicToRoman: bidirectional conversion between Roman and Arabic numerals", () => {
    // 1. 阿拉伯 -> 罗马
    assert.equal(arabicToRoman(1), "I");
    assert.equal(arabicToRoman(4), "IV");
    assert.equal(arabicToRoman(9), "IX");
    assert.equal(arabicToRoman(14), "XIV");
    assert.equal(arabicToRoman(2026), "MMXXVI");

    // 2. 罗马 -> 阿拉伯
    assert.equal(romanToArabic("I"), 1);
    assert.equal(romanToArabic("xiv"), 14);
    assert.equal(romanToArabic("MMXXVI"), 2026);

    // 3. 非法罗马字符容错
    assert.equal(romanToArabic("ABC"), null);
    assert.equal(romanToArabic(""), null);
});

test("Reverse macro: dynamic placeholder expansion for text reversal", () => {
    const now = new Date(2026, 9, 28, 12, 0, 0);

    // 1. 动态宏展开
    const tpl1 = "镜像：{{xlc:reverse|ABC-123}}";
    const res1 = applyPlaceholders(tpl1, now, true);
    assert.equal(res1, "镜像：321-CBA");

    // 2. 直接调用 resolveReverseArg
    assert.equal(resolveReverseArg("思源"), "源思");
    assert.equal(resolveReverseArg(""), "");
});
