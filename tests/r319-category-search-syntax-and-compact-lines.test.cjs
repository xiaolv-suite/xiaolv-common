"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {search, clipboardCleaner} = require("./.build/entry.cjs");

const {parseSearchGrammar} = search;
const {compactWhitespaceAndLines} = clipboardCleaner;

test("parseSearchGrammar: parses @category syntax mirrored with #tag", () => {
    // 1. 同时包含 #标签 和 @分类
    const parsed1 = parseSearchGrammar("#常用 @工作 发版清单");
    assert.equal(parsed1.tag, "常用");
    assert.deepEqual(parsed1.tags, ["常用"]);
    assert.equal(parsed1.category, "工作");
    assert.equal(parsed1.text, "发版清单");

    // 2. 单独 @分类 语法
    const parsed2 = parseSearchGrammar("@客服 退款流程");
    assert.equal(parsed2.category, "客服");
    assert.equal(parsed2.text, "退款流程");

    // 3. 经典 cat:分类 保持兼容
    const parsed3 = parseSearchGrammar("cat:运维 告警排查");
    assert.equal(parsed3.category, "运维");
    assert.equal(parsed3.text, "告警排查");
});

test("compactWhitespaceAndLines: cleans trailing whitespaces and collapses redundant empty lines", () => {
    const raw = "第一行  \t\n\n\n\n  第二行   \n\n\n第三行";
    const res = compactWhitespaceAndLines(raw, true);

    // 连续 3+ 个空行应该被压缩为最多单个空行（即 \n\n）
    assert.ok(!res.result.includes("\n\n\n"));
    assert.equal(res.result, "第一行\n\n第二行\n\n第三行");
    assert.ok(res.trimmedLines > 0);
});
