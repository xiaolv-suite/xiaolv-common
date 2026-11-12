"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    trimLinesAdvanced,
    normalizeObjectQuotes,
    truncateText,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveTruncateArg,
} = entry.placeholders;

test("trimLinesAdvanced: trims trailing whitespace, document ends, and common indent", () => {
    // 1. 首尾空行与行尾空白修剪
    const dirtyText = [
        "",
        "   ",
        "第一行   \t",
        "第二行内部无多余空白",
        "第三行尾部空格  ",
        "",
        "   ",
    ].join("\n");

    const res1 = trimLinesAdvanced(dirtyText, {trimTrailing: true, trimDocumentEnds: true});
    assert.equal(res1.hasChanges, true);
    assert.equal(res1.result, "第一行\n第二行内部无多余空白\n第三行尾部空格");

    // 2. 最小公共缩进修剪 (trimCommonIndent)
    const indentedCode = [
        "    function hello() {",
        "        console.log('hi');",
        "    }",
    ].join("\n");

    const res2 = trimLinesAdvanced(indentedCode, {trimCommonIndent: true});
    assert.equal(res2.result, "function hello() {\n    console.log('hi');\n}");
});

test("normalizeObjectQuotes: converts between JSON double-quotes and JS clean keys", () => {
    // 1. 转标准 JSON 格式 (to-json)
    const jsObj = "{\n  name: '小驴常用',\n  version: '0.10.20',\n  'active': true\n}";
    const jsonRes = normalizeObjectQuotes(jsObj, "to-json");
    assert.equal(jsonRes.convertedCount, 5); // 3 个 key + 2 个 value
    assert.ok(jsonRes.result.includes('"name": "小驴常用"'));
    assert.ok(jsonRes.result.includes('"version": "0.10.20"'));
    assert.ok(jsonRes.result.includes('"active": true'));

    // 2. 转 JS 简洁属性名 (to-js)
    const standardJson = '{\n  "title": "常用语",\n  "count": 42\n}';
    const jsRes = normalizeObjectQuotes(standardJson, "to-js");
    assert.equal(jsRes.convertedCount, 2);
    assert.ok(jsRes.result.includes('title: "常用语"'));
    assert.ok(jsRes.result.includes("count: 42"));
});

test("truncateText: truncates long text and appends ellipsis", () => {
    const text = "小驴常用是思源笔记的高效内容资产层，高频复用利器。";

    // 1. 短于最大长度不截断
    assert.equal(truncateText(text, 100), text);

    // 2. 超过最大长度截断并追加默认省略号 ...
    assert.equal(truncateText(text, 10), "小驴常用是思源笔记的...");

    // 3. 自定义省略号
    assert.equal(truncateText(text, {maxLength: 8, ellipsis: "…(略)"}), "小驴常用是思源笔…(略)");
});

test("Truncate macro: dynamic placeholder expansion for length truncation", () => {
    const now = new Date(2026, 9, 28, 12, 0, 0);
    const longText = "这是一段非常长并且超过限制的文本内容，用于测试占位符截断。";

    // 1. 指定截断长度管道语法
    const tpl1 = "摘要：{{xlc:truncate|12|" + longText + "}}";
    const res1 = applyPlaceholders(tpl1, now, true);
    assert.equal(res1, "摘要：这是一段非常长并且超过限...");

    // 2. 冒号兼容语法
    const tpl2 = "摘要：{{xlc:truncate:10|" + longText + "}}";
    const res2 = applyPlaceholders(tpl2, now, true);
    assert.equal(res2, "摘要：这是一段非常长并且超...");

    // 3. 直接调用 resolveTruncateArg
    assert.equal(resolveTruncateArg("测试文本", "2"), "测试...");
    assert.equal(resolveTruncateArg("测试文本", "invalid_number"), null);
});
