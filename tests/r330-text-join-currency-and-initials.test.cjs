"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    joinLinesWithDelimiter,
    splitTextToLines,
    formatChineseCurrency,
    extractInitials,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveCurrencyArg,
} = entry.placeholders;

test("joinLinesWithDelimiter and splitTextToLines: joins and splits text lines with delimiters", () => {
    const lines = [
        "apple",
        "  banana  ",
        "",
        "orange",
    ].join("\n");

    // 1. 默认逗号连接 (自动清洗首尾空白并忽略空行)
    const joinedDefault = joinLinesWithDelimiter(lines);
    assert.equal(joinedDefault, "apple, banana, orange");

    // 2. 自定义竖线分隔符
    const joinedPipe = joinLinesWithDelimiter(lines, " | ");
    assert.equal(joinedPipe, "apple | banana | orange");

    // 3. 拆分为多行文本 (splitTextToLines)
    const textWithCommas = "alpha, beta，gamma; delta | epsilon";
    const splitted = splitTextToLines(textWithCommas);
    assert.equal(splitted, "alpha\nbeta\ngamma\ndelta\nepsilon");
});

test("formatChineseCurrency: converts numbers and amounts to standard Chinese currency characters", () => {
    // 1. 纯整数与万元整
    assert.equal(formatChineseCurrency(100), "壹佰元整");
    assert.equal(formatChineseCurrency(1000000), "壹佰万元整");
    assert.equal(formatChineseCurrency(0), "零元整");

    // 2. 带角分四舍五入
    assert.equal(formatChineseCurrency(1234.56), "壹仟贰佰叁拾肆元伍角陆分");
    assert.equal(formatChineseCurrency("￥88.88"), "捌拾捌元捌角捌分");

    // 3. 零的进位规则 (10005 -> 壹万零伍元整)
    assert.equal(formatChineseCurrency(10005), "壹万零伍元整");

    // 4. 纯小数角分
    assert.equal(formatChineseCurrency(0.85), "捌角伍分");

    // 5. 负数金额
    assert.equal(formatChineseCurrency(-50.5), "负伍拾元伍角");
});

test("extractInitials: extracts uppercase acronyms and initials from phrases", () => {
    // 1. 标准英文字符串大写首字母
    assert.equal(extractInitials("Central Processing Unit"), "CPU");
    assert.equal(extractInitials("as soon as possible"), "ASAP");

    // 2. 带自定义点号分隔符与小写
    assert.equal(extractInitials("united states of america", {separator: "."}), "U.S.O.A");
    assert.equal(extractInitials("Hello World", {uppercase: false}), "HW");
});

test("Currency macro: dynamic placeholder expansion for Chinese uppercase amount", () => {
    const now = new Date(2026, 9, 28, 12, 0, 0);

    // 1. 宏替换
    const tpl1 = "合同总金额：{{xlc:currency|9999.99}}";
    const res1 = applyPlaceholders(tpl1, now, true);
    assert.equal(res1, "合同总金额：玖仟玖佰玖拾玖元玖角玖分");

    // 2. 带符号金额输入
    const tpl2 = "实付：{{xlc:currency|￥520.13}}";
    const res2 = applyPlaceholders(tpl2, now, true);
    assert.equal(res2, "实付：伍佰贰拾元壹角叁分");

    // 3. 直接调用 resolveCurrencyArg
    assert.equal(resolveCurrencyArg("100"), "壹佰元整");
    assert.equal(resolveCurrencyArg(""), null);
});
