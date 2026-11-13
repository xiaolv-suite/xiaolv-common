"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    escapeHtmlEntities,
    unescapeHtmlEntities,
    formatMarkdownTable,
} = entry.clipboardCleaner;

const {
    generateSecurePassword,
    resolvePasswordArg,
    applyPlaceholders,
} = entry.placeholders;

test("generateSecurePassword: creates passwords matching strength constraints", () => {
    // 1. complex 默认模式（大小写字母、数字与符号齐全）
    const pwdComplex = generateSecurePassword(16, "complex");
    assert.equal(pwdComplex.length, 16);
    assert.match(pwdComplex, /[a-z]/);
    assert.match(pwdComplex, /[A-Z]/);
    assert.match(pwdComplex, /[0-9]/);
    assert.match(pwdComplex, /[!@#$%^&*()_+~=]/);

    // 2. pin 模式（纯数字）
    const pin = generateSecurePassword(6, "pin");
    assert.equal(pin.length, 6);
    assert.match(pin, /^\d{6}$/);

    // 3. hex 模式（十六进制）
    const hex = generateSecurePassword(12, "hex");
    assert.equal(hex.length, 12);
    assert.match(hex, /^[0-9a-f]{12}$/);

    // 4. simple 模式（排除易混淆字符）
    const simple = generateSecurePassword(10, "simple");
    assert.equal(simple.length, 10);
    assert.match(simple, /^[a-zA-Z0-9]+$/);
});

test("Password macro: {{xlc:password}} dynamic expansion in templates", () => {
    const now = new Date(2026, 9, 28, 12, 0, 0);

    // 默认 14 位
    const defTpl = "初始密码：{{xlc:password}}";
    const defRes = applyPlaceholders(defTpl, now, true);
    assert.match(defRes, /^初始密码：.{14}$/);

    // 指定 8 位数字验证码
    const pinTpl = "验证码：{{xlc:password|8|pin}}";
    const pinRes = applyPlaceholders(pinTpl, now, true);
    assert.match(pinRes, /^验证码：\d{8}$/);

    // 指定 20 位高强度密钥
    const secretTpl = "API_KEY={{xlc:password|20|complex}}";
    const secretRes = applyPlaceholders(secretTpl, now, true);
    assert.match(secretRes, /^API_KEY=.{20}$/);
});

test("HTML entities escape and unescape: security & roundtrip fidelity", () => {
    const raw = `<button class="btn" onclick="alert('test & demo')">提交</button>`;
    const escaped = escapeHtmlEntities(raw);
    assert.ok(!escaped.includes("<button"));
    assert.ok(escaped.includes("&lt;button"));
    assert.ok(escaped.includes("&quot;btn&quot;"));
    assert.ok(escaped.includes("&amp; demo"));

    const unescaped = unescapeHtmlEntities(escaped);
    assert.equal(unescaped, raw);

    // 宏展开测试
    const now = new Date(2026, 9, 28, 12, 0, 0);
    const macroEsc = applyPlaceholders("代码：{{xlc:html:escape|<div id=\"app\">}}", now, true);
    assert.equal(macroEsc, "代码：&lt;div id=&quot;app&quot;&gt;");

    const macroUnesc = applyPlaceholders("还原：{{xlc:html:unescape|&lt;span&gt;}}", now, true);
    assert.equal(macroUnesc, "还原：<span>");
});

test("formatMarkdownTable: normalizes column widths and aligns cells", () => {
    const messyTable = [
        "| Name | Role | Location |",
        "|---|:---:|---:|",
        "| Alice | Admin | Beijing, China |",
        "| Bob | Dev | Tokyo |",
    ].join("\n");

    const res = formatMarkdownTable(messyTable);
    assert.equal(res.isTable, true);
    assert.equal(res.rowCount, 4);
    assert.equal(res.colCount, 3);

    // 验证第一列最大宽度对齐
    const lines = res.result.split("\n");
    assert.equal(lines.length, 4);
    assert.ok(lines[0].startsWith("| Name "));
    assert.ok(lines[1].includes(":---:"));
    assert.ok(lines[1].includes("---:"));

    // 非表格文本保持原样
    const nonTable = "这是一段普通的单行文本";
    const nonRes = formatMarkdownTable(nonTable);
    assert.equal(nonRes.isTable, false);
    assert.equal(nonRes.result, nonTable);
});
