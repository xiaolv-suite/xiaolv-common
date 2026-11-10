"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    titleCaseLines,
    reverseLines,
    sortLinesByLength,
    numberLines,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveNumberArg,
} = entry.placeholders;

test("titleCaseLines: formats multi-line text into Title Case or Sentence Case", () => {
    const raw = [
        "the quick brown fox jumps over the lazy dog",
        "a guide to software engineering in 2026",
        "hello world and peace of mind",
    ].join("\n");

    // 1. 标准 Title Case (首尾词大写，常见介词/冠词在中间小写保护)
    const titleRes = titleCaseLines(raw, {style: "title"});
    const titleLines = titleRes.split("\n");
    assert.equal(titleLines[0], "The Quick Brown Fox Jumps Over the Lazy Dog");
    assert.equal(titleLines[1], "A Guide to Software Engineering in 2026");
    assert.equal(titleLines[2], "Hello World and Peace of Mind");

    // 2. Sentence Case (每行句首首字母大写)
    const sentenceRaw = "this is line one.\nanother line two.";
    const sentenceRes = titleCaseLines(sentenceRaw, {style: "sentence"});
    assert.equal(sentenceRes, "This is line one.\nAnother line two.");
});

test("reverseLines and sortLinesByLength: reorders multi-line text by line or length", () => {
    const text = [
        "short",
        "medium line",
        "a",
        "very long text line here",
    ].join("\n");

    // 1. 倒序反转
    const reversed = reverseLines(text);
    assert.equal(reversed, "very long text line here\n\na\nmedium line\nshort".replace("\n\n", "\n"));
    assert.equal(reversed.split("\n")[0], "very long text line here");
    assert.equal(reversed.split("\n")[3], "short");

    // 2. 按行长度升序 (从短到长)
    const sortedAsc = sortLinesByLength(text, {descending: false});
    const ascLines = sortedAsc.split("\n");
    assert.equal(ascLines[0], "a");
    assert.equal(ascLines[1], "short");
    assert.equal(ascLines[3], "very long text line here");

    // 3. 按行长度降序 (从长到短)
    const sortedDesc = sortLinesByLength(text, {descending: true});
    const descLines = sortedDesc.split("\n");
    assert.equal(descLines[0], "very long text line here");
    assert.equal(descLines[3], "a");
});

test("numberLines: formats and numbers multi-line text with various styles", () => {
    const list = [
        "第一项任务",
        "第二项任务",
        "",
        "第三项任务",
    ].join("\n");

    // 1. 默认 decimal 格式 (1. 2. 空行跳过)
    const decRes = numberLines(list, {format: "decimal", ignoreEmpty: true});
    assert.equal(decRes.lineCount, 4);
    assert.equal(decRes.numberedCount, 3);
    assert.equal(decRes.result, "1. 第一项任务\n2. 第二项任务\n\n3. 第三项任务");

    // 2. 两位补零 padded 格式 (01. 02. )
    const padRes = numberLines(list, {format: "padded", ignoreEmpty: true});
    assert.equal(padRes.result, "01. 第一项任务\n02. 第二项任务\n\n03. 第三项任务");

    // 3. bracket 格式 ([1] [2] )
    const bracketRes = numberLines(list, {format: "bracket", ignoreEmpty: true});
    assert.equal(bracketRes.result, "[1] 第一项任务\n[2] 第二项任务\n\n[3] 第三项任务");

    // 4. circled 格式 (① ② )
    const circledRes = numberLines(list, {format: "circled", ignoreEmpty: true});
    assert.equal(circledRes.result, "① 第一项任务\n② 第二项任务\n\n③ 第三项任务");

    // 5. 指定起始序号 startFrom: 5
    const startRes = numberLines("A\nB", {startFrom: 5});
    assert.equal(startRes.result, "5. A\n6. B");
});

test("Number macro: dynamic template expansion for line numbering", () => {
    const now = new Date(2026, 9, 28, 12, 0, 0);

    // 默认 decimal
    const tpl1 = "步骤：\n{{xlc:number:lines|第一步\n第二步}}";
    const res1 = applyPlaceholders(tpl1, now, true);
    assert.equal(res1, "步骤：\n1. 第一步\n2. 第二步");

    // padded 两位补零
    const tpl2 = "待办：\n{{xlc:number|padded|签收\n核对\n归档}}";
    const res2 = applyPlaceholders(tpl2, now, true);
    assert.equal(res2, "待办：\n01. 签收\n02. 核对\n03. 归档");

    // 直接调用 resolveNumberArg
    assert.equal(resolveNumberArg("甲\n乙", "bracket"), "[1] 甲\n[2] 乙");
    assert.equal(resolveNumberArg("测试", "unknown_format"), null);
});
