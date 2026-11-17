"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    convertWidth,
    encodeBase64,
    decodeBase64,
    encodeUrlText,
    decodeUrlText,
    toggleMarkdownBlockquote,
    wrapMarkdownCodefence,
} = entry.clipboardCleaner;

const {
    resolvePlaceholder,
    applyPlaceholders,
} = entry.placeholders;

test("convertWidth: to-half converts full-width numbers and letters to ASCII", () => {
    const raw = "订单编号：２０２６１０２８，型号：ＰＲＯＭＡＸ";
    const res = convertWidth(raw, "to-half", {alphanumericOnly: true});
    assert.equal(res.result, "订单编号：20261028，型号：PROMAX");
    assert.equal(res.convertedCount, 14);
});

test("convertWidth: to-half converts full-width punctuation and spaces", () => {
    const raw = "测试\u3000空格！全角！";
    const res = convertWidth(raw, "to-half");
    assert.equal(res.result, "测试 空格!全角!");
    assert.equal(res.convertedCount, 3);
});

test("convertWidth: to-full converts ASCII alphanumeric to full-width", () => {
    const raw = "Code 123";
    const res = convertWidth(raw, "to-full", {alphanumericOnly: true});
    assert.equal(res.result, "Ｃｏｄｅ １２３");
    assert.equal(res.convertedCount, 7);
});

test("Base64 codec: UTF-8 safe roundtrip for CJK and special characters", () => {
    const testCases = [
        "Hello World!",
        "思源笔记常用内容复用插件「小驴常用」",
        "multiline\ntext\r\nwith spaces and symbols: !@#$%^&*()",
        "JSON: {\"name\": \"小驴\", \"id\": 10086}",
    ];

    for (const text of testCases) {
        const encoded = encodeBase64(text);
        assert.ok(encoded.length > 0);
        const decoded = decodeBase64(encoded);
        assert.equal(decoded.ok, true);
        assert.equal(decoded.result, text);
    }

    // 非法 Base64 优雅容错
    const invalid = decodeBase64("!@#$%^&*InvalidBase64===");
    assert.equal(invalid.ok, false);
});

test("URL codec: encode and decode roundtrip", () => {
    const raw = "https://siyuan-note.com/search?keyword=小驴 常用&tag=研发";
    const encoded = encodeUrlText(raw, true);
    assert.ok(!encoded.includes(" "));
    assert.ok(encoded.includes("%E5%B0%8F%E9%A9%B4"));

    const decoded = decodeUrlText(encoded, true);
    assert.equal(decoded.ok, true);
    assert.equal(decoded.result, raw);
});

test("Dynamic placeholders: {{xlc:url:encode}}, {{xlc:url:decode}}, {{xlc:base64:encode}}, {{xlc:base64:decode}}", () => {
    const now = new Date(2026, 9, 28, 12, 0, 0);

    // 1. URL 编码宏
    const urlTemplate = "https://api.example.com/query?q={{xlc:url:encode|思源常用语}}";
    const urlRendered = applyPlaceholders(urlTemplate, now, true);
    assert.equal(urlRendered, "https://api.example.com/query?q=%E6%80%9D%E6%BA%90%E5%B8%B8%E7%94%A8%E8%AF%AD");

    // 2. URL 解码宏
    const urlDecTemplate = "原始参数：{{xlc:url:decode|%E6%80%9D%E6%BA%90%E5%B8%B8%E7%94%A8%E8%AF%AD}}";
    const urlDecRendered = applyPlaceholders(urlDecTemplate, now, true);
    assert.equal(urlDecRendered, "原始参数：思源常用语");

    // 3. Base64 编码宏
    const b64Template = "授权头：Basic {{xlc:base64:encode|user:123456}}";
    const b64Rendered = applyPlaceholders(b64Template, now, true);
    assert.equal(b64Rendered, "授权头：Basic dXNlcjoxMjM0NTY=");

    // 4. Base64 解码宏
    const b64DecTemplate = "明文：{{xlc:base64:decode|dXNlcjoxMjM0NTY=}}";
    const b64DecRendered = applyPlaceholders(b64DecTemplate, now, true);
    assert.equal(b64DecRendered, "明文：user:123456");

    // 5. 冒号子命令与管道子参数双模态兼容
    const pipeCompat = applyPlaceholders("{{xlc:base64|encode|小驴}}", now, true);
    assert.equal(pipeCompat, encodeBase64("小驴"));
});

test("Markdown blockquote toggle and codefence wrapper", () => {
    const text = "第一行内容\n第二行内容";
    const wrapped = toggleMarkdownBlockquote(text);
    assert.equal(wrapped.isWrapped, true);
    assert.equal(wrapped.result, "> 第一行内容\n> 第二行内容");

    const unwrapped = toggleMarkdownBlockquote(wrapped.result);
    assert.equal(unwrapped.isWrapped, false);
    assert.equal(unwrapped.result, text);

    const fenced = wrapMarkdownCodefence("const a = 1;", "typescript");
    assert.equal(fenced, "```typescript\nconst a = 1;\n```");
});
