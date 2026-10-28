"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    convertNumberSymbols,
    censorText,
    extractCodeBlocksFromMarkdown,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveCensorArg,
} = entry.placeholders;

test("convertNumberSymbols: converts between plain digits, circled numbers, and bracketed symbols", () => {
    // 1. 数字转圈号 (1 -> ①, 20 -> ⑳)
    const text = "步骤 1: 准备; 步骤 2: 执行; 步骤 20: 验收";
    const circled = convertNumberSymbols(text, "circled");
    assert.equal(circled, "步骤 ①: 准备; 步骤 ②: 执行; 步骤 ⑳: 验收");

    // 2. 数字转括号序号 (bracketed)
    const bracketed = convertNumberSymbols("条款 1 与 条款 2", "bracketed");
    assert.equal(bracketed, "条款 ⑴ 与 条款 ⑵");

    // 3. 圈号/括号序号反转回普通阿拉伯数字 (digits)
    assert.equal(convertNumberSymbols(circled, "digits"), text);
    assert.equal(convertNumberSymbols("⑴ 与 ⑵", "digits"), "1 与 2");
});

test("censorText and {{xlc:censor}}: censors keywords or matches with custom replacement or mask", () => {
    const content = "This is a secret and classified message.";

    // 1. 数组形式多关键词替换
    const censored = censorText(content, ["secret", "classified"], "***");
    assert.equal(censored, "This is a *** and *** message.");

    // 2. 逗号分隔形式
    const commaCensored = censorText(content, "secret, classified", "[REDACTED]");
    assert.equal(commaCensored, "This is a [REDACTED] and [REDACTED] message.");

    // 3. 动态宏占位符测试
    const now = new Date("2026-10-29T12:00:00");
    assert.equal(applyPlaceholders("{{xlc:censor|hello bad world|bad|***}}", now, true), "hello *** world");
    assert.equal(applyPlaceholders("{{xlc:censor:mask|hello secret world|secret}}", now, true), "hello ****** world");
});

test("extractCodeBlocksFromMarkdown: extracts code snippets and optionally filters by language", () => {
    const md = `
# 教程文章
这是一些段落说明。

\`\`\`python
def hello():
    print("world")
\`\`\`

中间的解释文本，不应被提取。

\`\`\`javascript
console.log("js code");
\`\`\`

尾部说明。
`.trim();

    // 1. 提取全部代码块
    const allCode = extractCodeBlocksFromMarkdown(md);
    assert.ok(allCode.includes('def hello():\n    print("world")'));
    assert.ok(allCode.includes('console.log("js code");'));
    assert.ok(!allCode.includes("这是一些段落说明"));
    assert.ok(!allCode.includes("中间的解释文本"));

    // 2. 按语言筛选 (languageFilter: "python")
    const pyOnly = extractCodeBlocksFromMarkdown(md, {languageFilter: "python"});
    assert.ok(pyOnly.includes("def hello():"));
    assert.ok(!pyOnly.includes("console.log"));

    // 3. 包含语言头部注解 (includeLanguageHeader: true)
    const withHeader = extractCodeBlocksFromMarkdown(md, {languageFilter: "javascript", includeLanguageHeader: true});
    assert.ok(withHeader.startsWith("// [javascript]"));
    assert.ok(withHeader.includes('console.log("js code");'));
});
