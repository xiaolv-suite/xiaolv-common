"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    convertMarkdownLinks,
    truncateByBytes,
    formatPunctuationSpacing,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveBtruncateArg,
} = entry.placeholders;

test("convertMarkdownLinks: converts markdown links across strip, bare_url, text_and_url, and auto_markdown", () => {
    const text = "访问 [思源官网](https://b3log.org/siyuan) 获取更多信息，参考 [GitHub 仓库](https://github.com/siyuan-note/siyuan)。";

    // 1. 剥离链接保留标题 (strip)
    assert.equal(
        convertMarkdownLinks(text, "strip"),
        "访问 思源官网 获取更多信息，参考 GitHub 仓库。"
    );

    // 2. 提取裸 URL (bare_url)
    assert.equal(
        convertMarkdownLinks(text, "bare_url"),
        "访问 https://b3log.org/siyuan 获取更多信息，参考 https://github.com/siyuan-note/siyuan。"
    );

    // 3. 标题加括号 URL (text_and_url)
    assert.equal(
        convertMarkdownLinks(text, "text_and_url"),
        "访问 思源官网 (https://b3log.org/siyuan) 获取更多信息，参考 GitHub 仓库 (https://github.com/siyuan-note/siyuan)。"
    );

    // 4. 裸链接自动包裹 (auto_markdown)
    const bare = "文档位于 https://docs.siyuan.org 请查阅";
    assert.equal(
        convertMarkdownLinks(bare, "auto_markdown"),
        "文档位于 [https://docs.siyuan.org](https://docs.siyuan.org) 请查阅"
    );
});

test("truncateByBytes: safely truncates text at UTF-8 code point boundaries avoiding broken bytes", () => {
    // 1. 汉字 UTF-8 边界安全截断（每个汉字 3 字节）
    // "你好世界" = 12 字节
    // 截断到 10 字节 -> 无法放下第四个字（3+3+3=9 字节，还剩 1 字节），因此精确截为 "你好世"
    assert.equal(truncateByBytes("你好世界", 10), "你好世");
    assert.equal(truncateByBytes("你好世界", 9), "你好世");
    assert.equal(truncateByBytes("你好世界", 8), "你好");

    // 2. 包含省略号 (ellipsis: true)
    // 限制 10 字节，省略号 "..." 占 3 字节，预留 7 字节空间 -> 可放下 2 个汉字（6 字节） -> "你好..."
    assert.equal(truncateByBytes("你好世界", 10, {ellipsis: true}), "你好...");

    // 3. 4 字节 Emoji 表情安全截断
    // "A😀B" = 1 + 4 + 1 = 6 字节
    assert.equal(truncateByBytes("A😀B", 4), "A");
    assert.equal(truncateByBytes("A😀B", 5), "A😀");
});

test("{{xlc:btruncate}}: dynamic placeholder macro evaluates byte-safe truncation", () => {
    const now = new Date("2026-10-29T12:00:00");

    // 1. 基础按字节截断
    assert.equal(applyPlaceholders("{{xlc:btruncate|10|你好世界}}", now, true), "你好世");

    // 2. 冒号子参数形态
    assert.equal(applyPlaceholders("{{xlc:btruncate:10|你好世界}}", now, true), "你好世");

    // 3. 带省略号
    assert.equal(applyPlaceholders("{{xlc:btruncate:10|...|你好世界}}", now, true), "你好...");
});

test("formatPunctuationSpacing: cleans punctuation spacing for mixed Chinese and English text", () => {
    // 1. 清理中文全角标点前后多余的空格
    const messyZh = "你好 ， 这是 思源笔记 。 我们 欢迎你 ！";
    const cleanZh = formatPunctuationSpacing(messyZh);
    assert.equal(cleanZh, "你好，这是 思源笔记。我们 欢迎你！");

    // 2. 规范英文标点后面的半角空格
    const messyEn = "hello,world;item:value!great?yes";
    const cleanEn = formatPunctuationSpacing(messyEn);
    assert.equal(cleanEn, "hello, world; item: value! great? yes");

    // 3. 清理英文标点前面的多余空白
    const messyBefore = "apple , banana ; orange";
    const cleanBefore = formatPunctuationSpacing(messyBefore);
    assert.equal(cleanBefore, "apple, banana; orange");
});
