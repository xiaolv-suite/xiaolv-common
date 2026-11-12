"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
    clipboardCleaner,
    templateWizard,
} = require("./.build/entry.cjs");

const {normalizePunctuation} = clipboardCleaner;
const {autoParameterizeText} = templateWizard;

test("normalizePunctuation: to-cjk converts halfwidth punctuation in Chinese context and preserves decimals/URLs", () => {
    const raw = "客户您好,当前版本为v1.2,圆周率是3.14159.请访问https://example.com/api:v1查看详情!有问题吗?";
    const {result, convertedCount} = normalizePunctuation(raw, "to-cjk");

    assert.ok(convertedCount >= 4);
    assert.ok(result.includes("客户您好，"));
    assert.ok(result.includes("3.14159")); // 小数点不受破坏
    assert.ok(result.includes("https://example.com/api:v1")); // URL 与协议不受破坏
    assert.ok(result.includes("查看详情！"));
    assert.ok(result.includes("有问题吗？"));
});

test("normalizePunctuation: to-ascii converts fullwidth punctuation to ASCII", () => {
    const raw = "你好，世界。请查看：【通知】（重要）！";
    const {result, convertedCount} = normalizePunctuation(raw, "to-ascii");

    assert.ok(convertedCount >= 5);
    assert.ok(result.includes(", "));
    assert.ok(result.includes(". "));
    assert.ok(result.includes(": "));
    assert.ok(result.includes("[通知]"));
    assert.ok(result.includes("(重要)"));
    assert.ok(result.includes("!"));
});

test("autoParameterizeText: auto-derives variables from phone, email, date, amount and name", () => {
    const raw = "尊敬的王经理您好，请在2026-10-30前将￥500汇款至财务，联系电话13812345678，邮箱finance@example.com。";
    const res = autoParameterizeText(raw);

    assert.equal(res.suggestedCount, 5);
    assert.ok(res.result.includes("尊敬的{{xlc:ask:姓名}}经理您好"));
    assert.ok(res.result.includes("{{xlc:date}}"));
    assert.ok(res.result.includes("{{xlc:ask:金额}}"));
    assert.ok(res.result.includes("{{xlc:ask:手机号}}"));
    assert.ok(res.result.includes("{{xlc:ask:邮箱}}"));

    assert.ok(res.suggestions.some((s) => s.fieldLabel === "手机号"));
    assert.ok(res.suggestions.some((s) => s.fieldLabel === "邮箱"));
    assert.ok(res.suggestions.some((s) => s.fieldLabel === "当前日期"));
    assert.ok(res.suggestions.some((s) => s.fieldLabel === "金额"));
    assert.ok(res.suggestions.some((s) => s.fieldLabel === "姓名"));
});

test("autoParameterizeText: plain text with no variable slots returns unmodified", () => {
    const plain = "这是一句完全没有可变槽位的静态通用话术。";
    const res = autoParameterizeText(plain);
    assert.equal(res.suggestedCount, 0);
    assert.equal(res.result, plain);
});
