"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {clipboardCleaner} = require("./.build/entry.cjs");

const {deduplicateLines, sortLines} = clipboardCleaner;

test("deduplicateLines: removes duplicates while strictly preserving original first-occurrence order", () => {
    const raw = [
        "apple",
        "banana",
        "orange",
        "apple",
        "banana",
        "watermelon",
        "orange",
    ].join("\n");

    const res = deduplicateLines(raw);
    assert.equal(res.removedCount, 3);
    assert.equal(res.originalCount, 7);
    assert.equal(res.uniqueCount, 4);

    const expected = ["apple", "banana", "orange", "watermelon"].join("\n");
    assert.equal(res.result, expected);
});

test("deduplicateLines: handles case sensitivity and whitespace trimming", () => {
    const raw = [
        "Apple ",
        "apple",
        "  banana",
        "BANANA",
        "orange",
    ].join("\n");

    // 大小写不敏感去重
    const insensitive = deduplicateLines(raw, {caseSensitive: false, trimLines: true});
    assert.equal(insensitive.removedCount, 2);
    assert.deepEqual(insensitive.result.split("\n"), ["Apple", "banana", "orange"]);

    // 单行无换行
    const single = deduplicateLines("单行文本");
    assert.equal(single.removedCount, 0);
    assert.equal(single.result, "单行文本");
});

test("sortLines: sorts lines ascending and descending by locale", () => {
    const lines = ["香蕉", "苹果", "西瓜", "草莓"].join("\n");

    // 升序 (拼音: c草莓 -> p苹果 -> x西瓜 -> x香蕉)
    const asc = sortLines(lines, {descending: false});
    const ascArr = asc.result.split("\n");
    assert.equal(asc.lineCount, 4);
    assert.equal(ascArr[0], "草莓");

    // 降序
    const desc = sortLines(lines, {descending: true});
    const descArr = desc.result.split("\n");
    assert.equal(descArr[0], "香蕉");
});
