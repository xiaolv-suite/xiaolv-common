"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    indentLines,
    outdentLines,
    validateFormat,
    filterMarkdownTable,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveValidArg,
} = entry.placeholders;

test("indentLines & outdentLines: adds and removes indentation with space or tab options", () => {
    const raw = `
line 1
  line 2

line 3
`.trim();

    // 1. 默认增加 2 空格缩进 (跳过空行)
    const indented2 = indentLines(raw, 2);
    const expectedIndent = "  line 1\n    line 2\n\n  line 3";
    assert.equal(indented2, expectedIndent);

    // 2. 反向缩进 2 空格
    const outdented2 = outdentLines(indented2, 2);
    assert.equal(outdented2, raw);

    // 3. Tab 缩进与反缩进
    const tabIndented = indentLines("hello\nworld", {count: 1, indentChar: "\t"});
    assert.equal(tabIndented, "\thello\n\tworld");
    const tabOutdented = outdentLines(tabIndented, {count: 1, indentChar: "\t"});
    assert.equal(tabOutdented, "hello\nworld");
});

test("validateFormat: validates email, phone, idcard, ipv4, url, and numbers accurately", () => {
    // 1. Email
    assert.equal(validateFormat("user.name+tag@example.co.uk", "email"), true);
    assert.equal(validateFormat("invalid-email@", "email"), false);

    // 2. Phone (中国大陆11位手机号)
    assert.equal(validateFormat("13800138000", "phone"), true);
    assert.equal(validateFormat("12800138000", "phone"), false); // 12 开头非法
    assert.equal(validateFormat("138000", "phone"), false);

    // 3. IPv4
    assert.equal(validateFormat("192.168.1.1", "ipv4"), true);
    assert.equal(validateFormat("256.1.1.1", "ipv4"), false);
    assert.equal(validateFormat("1.2.3", "ipv4"), false);

    // 4. URL
    assert.equal(validateFormat("https://github.com/xiaolv-suite/xiaolv-common", "url"), true);
    assert.equal(validateFormat("not_a_url", "url"), false);

    // 5. Number
    assert.equal(validateFormat("-42.5", "number"), true);
    assert.equal(validateFormat("NaN", "number"), false);
});

test("filterMarkdownTable: filters rows by column value while preserving header and separator", () => {
    const table = `
| 姓名 | 等级 | 部门 |
| :--- | :---: | ---: |
| 张三 | A | 研发 |
| 李四 | B | 运营 |
| 王五 | A | 市场 |
| 赵六 | C | 运维 |
`.trim();

    // 1. 筛选第 2 列等于 "A" 的行
    const filteredA = filterMarkdownTable(table, 2, "A");
    const linesA = filteredA.split("\n");
    assert.equal(linesA.length, 4); // 表头 + 分隔线 + 2 数据行
    assert.ok(linesA[2].includes("张三"));
    assert.ok(linesA[3].includes("王五"));

    // 2. 正则筛选第 3 列包含 "研|运" 的行
    const filteredDept = filterMarkdownTable(table, 3, /^(研发|运维)$/);
    const linesDept = filteredDept.split("\n");
    assert.equal(linesDept.length, 4);
    assert.ok(linesDept[2].includes("张三"));
    assert.ok(linesDept[3].includes("赵六"));

    // 3. 反向筛选排除第 2 列包含 "C" 的行
    const filteredNoC = filterMarkdownTable(table, 2, "C", {invert: true});
    assert.ok(!filteredNoC.includes("赵六"));
    assert.ok(filteredNoC.includes("张三"));
});

test("Valid macro: evaluates {{xlc:valid}} placeholders for format checks", () => {
    const now = new Date(2026, 9, 28, 12, 0, 0);

    // 1. 默认冒号语法返回 true/false
    const tpl1 = "邮箱合法性: {{xlc:valid:email|dev@siyuan.local}}";
    assert.equal(applyPlaceholders(tpl1, now, true), "邮箱合法性: true");

    const tpl2 = "手机号合法性: {{xlc:valid:phone|123456}}";
    assert.equal(applyPlaceholders(tpl2, now, true), "手机号合法性: false");

    // 2. 自定义通过/不通过文本 (OK / FAIL)
    const tpl3 = "状态: {{xlc:valid:phone|13912345678|有效手机号|无效手机号}}";
    assert.equal(applyPlaceholders(tpl3, now, true), "状态: 有效手机号");

    // 3. 管道语法检查 IPv4
    const tpl4 = "IP检查: {{xlc:valid|ipv4|10.0.0.1|内网IP合法|非法IP}}";
    assert.equal(applyPlaceholders(tpl4, now, true), "IP检查: 内网IP合法");
});
