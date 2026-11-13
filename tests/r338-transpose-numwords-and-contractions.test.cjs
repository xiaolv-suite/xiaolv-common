"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    transposeMatrixText,
    numberToEnglishWords,
    expandEnglishContractions,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveWordsArg,
} = entry.placeholders;

test("transposeMatrixText: transposes multi-line table rows and columns", () => {
    // 2 行 3 列
    const table = [
        "A1\tB1\tC1",
        "A2\tB2\tC2",
    ].join("\n");

    // 转置为 3 行 2 列
    const transposed = transposeMatrixText(table, "\t", "\t");
    const tRows = transposed.split("\n");
    assert.equal(tRows.length, 3);
    assert.equal(tRows[0], "A1\tA2");
    assert.equal(tRows[1], "B1\tB2");
    assert.equal(tRows[2], "C1\tC2");
});

test("numberToEnglishWords: converts integers to English words", () => {
    // 1. 基础数字与个位十位
    assert.equal(numberToEnglishWords(0), "zero");
    assert.equal(numberToEnglishWords(15), "fifteen");
    assert.equal(numberToEnglishWords(42), "forty-two");

    // 2. 百、千与百万
    assert.equal(numberToEnglishWords(100), "one hundred");
    assert.equal(numberToEnglishWords(1234), "one thousand two hundred thirty-four");
    assert.equal(numberToEnglishWords(1000000), "one million");

    // 3. 负数
    assert.equal(numberToEnglishWords(-7), "negative seven");
});

test("expandEnglishContractions: expands informal contractions into formal word forms", () => {
    const informal = "I'm sure you can't and won't do it, don't worry, it's fine.";
    const res = expandEnglishContractions(informal);

    assert.equal(res.expandedCount, 5);
    assert.ok(res.result.includes("I am sure"));
    assert.ok(res.result.includes("cannot and will not do it"));
    assert.ok(res.result.includes("do not worry"));
    assert.ok(res.result.includes("it is fine"));

    // 首字母大写保持
    const capRes = expandEnglishContractions("Don't panic!");
    assert.equal(capRes.result, "Do not panic!");
});

test("Words macro: dynamic placeholder expansion for English number words", () => {
    const now = new Date(2026, 9, 28, 12, 0, 0);

    // 1. 动态宏展开
    const tpl1 = "Item count: {{xlc:words:en|100}}";
    const res1 = applyPlaceholders(tpl1, now, true);
    assert.equal(res1, "Item count: one hundred");

    // 2. 管道指定语言语法
    const tpl2 = "Value: {{xlc:words|en|42}}";
    const res2 = applyPlaceholders(tpl2, now, true);
    assert.equal(res2, "Value: forty-two");

    // 3. 直接调用 resolveWordsArg
    assert.equal(resolveWordsArg("1024"), "one thousand twenty-four");
    assert.equal(resolveWordsArg(""), null);
});
