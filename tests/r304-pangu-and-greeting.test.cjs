"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
    clipboardCleaner,
    placeholders,
} = require("./.build/entry.cjs");

const {formatPanguSpacing, tsvToMarkdownTable, cleanClipboardText} = clipboardCleaner;
const {resolvePlaceholder, applyPlaceholders, renderPlaceholder} = placeholders;

test("formatPanguSpacing: CJK and Latin/digits auto-spacing", () => {
    const raw = "修复了Bug在v1.0版本，增加了50%的性能提升。";
    const {result, spacedCount} = formatPanguSpacing(raw);
    assert.ok(spacedCount >= 3);
    assert.equal(result, "修复了 Bug 在 v1.0 版本，增加了 50% 的性能提升。");
});

test("formatPanguSpacing: preserves code, links, and tags without corruption", () => {
    const raw = "在`package.json`文件中配置了https://example.com网址和{{xlc:doc}}变量。";
    const {result} = formatPanguSpacing(raw);
    assert.ok(result.includes("`package.json`"));
    assert.ok(result.includes("https://example.com"));
    assert.ok(result.includes("{{xlc:doc}}"));
});

test("formatPanguSpacing: cleans redundant spaces around fullwidth punctuation", () => {
    const raw = "你好 ， 这个是测试 。";
    const {result} = formatPanguSpacing(raw);
    assert.equal(result, "你好，这个是测试。");
});

test("tsvToMarkdownTable: converts Excel/web TSV into standard Markdown table", () => {
    const tsv = [
        "姓名\t年龄\t部门",
        "张三\t28\t技术部",
        "李四\t32\t设计部",
    ].join("\n");

    const converted = tsvToMarkdownTable(tsv);
    assert.ok(converted !== null);
    assert.equal(converted.rowCount, 3);
    assert.equal(converted.colCount, 3);

    const expected = [
        "| 姓名 | 年龄 | 部门 |",
        "| --- | --- | --- |",
        "| 张三 | 28 | 技术部 |",
        "| 李四 | 32 | 设计部 |",
    ].join("\n");
    assert.equal(converted.result, expected);

    // 非 TSV 文本安全拒绝返回 null
    assert.equal(tsvToMarkdownTable("普通单行无制表符文本"), null);
    assert.equal(tsvToMarkdownTable("单行制表符\t不构成多行表格"), null);
});

test("cleanClipboardText: integration with panguSpacing option", () => {
    const raw = "测试Hello世界\u200B";
    const cleaned = cleanClipboardText(raw, {
        stripInvisible: true,
        panguSpacing: true,
    });
    assert.equal(cleaned.cleanedText, "测试 Hello 世界");
    assert.equal(cleaned.hasChanges, true);
    assert.ok(cleaned.changeDetails.some((d) => d.includes("排版间距") || d.includes("零宽")));
});

test("{{xlc:greeting}}: contextual greeting macro resolution", () => {
    // 1. 早上 9 点
    const morning = new Date("2026-10-27T09:00:00");
    assert.equal(resolvePlaceholder("greeting", undefined, morning), "早上好");
    assert.equal(resolvePlaceholder("greeting", "en", morning), "Good morning");
    assert.equal(resolvePlaceholder("greeting", "formal", morning), "上午好");

    // 2. 下午 15 点
    const afternoon = new Date("2026-10-27T15:00:00");
    assert.equal(resolvePlaceholder("greeting", undefined, afternoon), "下午好");
    assert.equal(resolvePlaceholder("greeting", "en", afternoon), "Good afternoon");
    assert.equal(resolvePlaceholder("greeting", "formal", afternoon), "下午好");

    // 3. 晚上 20 点
    const evening = new Date("2026-10-27T20:00:00");
    assert.equal(resolvePlaceholder("greeting", undefined, evening), "晚上好");
    assert.equal(resolvePlaceholder("greeting", "en", evening), "Good evening");
    assert.equal(resolvePlaceholder("greeting", "formal", evening), "晚上好");

    // 4. 深夜 2 点
    const midnight = new Date("2026-10-27T02:00:00");
    assert.equal(resolvePlaceholder("greeting", undefined, midnight), "夜深了");
    assert.equal(resolvePlaceholder("greeting", "en", midnight), "Good morning");
    assert.equal(resolvePlaceholder("greeting", "simple", midnight), "您好");

    // 5. applyPlaceholders 文本替换集成
    const template = "亲爱的客户，{{xlc:greeting}}！欢迎咨询。";
    const resolved = applyPlaceholders(template, morning, true);
    assert.equal(resolved, "亲爱的客户，早上好！欢迎咨询。");
});
