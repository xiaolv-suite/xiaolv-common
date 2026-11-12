"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
    exportMarkdown,
    exportSanitizer,
    exportSanitizerModal,
} = require("./.build/entry.cjs");

const {buildMarkdownExport} = exportMarkdown;
const {sanitizeTextForExport} = exportSanitizer;

test("Export sanitizer correctly sanitizes phone, email, and tokens", () => {
    const dummyToken = ["sk", "1234567890abcdef1234"].join("-");
    const raw = `我的手机是 13812345678，邮箱是 alice@example.com，密钥是 ${dummyToken}。`;
    const res = sanitizeTextForExport(raw, {
        mode: "mask",
        sanitizePhones: true,
        sanitizeEmails: true,
        sanitizeTokens: true,
    });

    assert.equal(res.sanitizedCount >= 3, true);
    assert.equal(res.text.includes("13812345678"), false);
    assert.equal(res.text.includes("alice@example.com"), false);
    assert.equal(res.text.includes(dummyToken), false);
    assert.ok(res.text.includes("138****5678"));
});

test("buildMarkdownExport applies sanitizer option when passed", async () => {
    const items = [
        {
            id: "xlc-test1",
            itemType: "markdown",
            title: "联系方式",
            category: "联系",
            tags: ["测试"],
            source: {sourceType: "external"},
        },
    ];
    const dummyToken = ["sk", "abcdef1234567890"].join("-");
    const kramdowns = new Map([
        ["xlc-test1", `请联系 13987654321 或 support@example.com 领取 token ${dummyToken}`],
    ]);

    // 1. 无脱敏导出
    const resNormal = await buildMarkdownExport(items, kramdowns, async () => null, {name: "测试包"});
    const mdNormal = Buffer.from(resNormal.entries.find((e) => e.name === "items.md").data).toString("utf8");
    assert.ok(mdNormal.includes("13987654321"));

    // 2. 有脱敏导出
    const resSanitized = await buildMarkdownExport(items, kramdowns, async () => null, {
        pack: {name: "测试包"},
        sanitizer: {mode: "mask", sanitizePhones: true, sanitizeEmails: true, sanitizeTokens: true},
    });
    const mdSanitized = Buffer.from(resSanitized.entries.find((e) => e.name === "items.md").data).toString("utf8");
    assert.equal(mdSanitized.includes("13987654321"), false);
    assert.ok(mdSanitized.includes("139****4321"));
});
