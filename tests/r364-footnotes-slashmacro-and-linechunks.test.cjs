"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    normalizeMarkdownFootnotes,
    escapeBackslash,
    chunkLinesByDelimiter,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveSlashArg,
} = entry.placeholders;

test("normalizeMarkdownFootnotes: re-indexes footnotes sequentially and groups definitions at bottom", () => {
    const text = `
这是正文第一段，包含一个命名脚注[^note]。
中间穿插了脚注定义：
[^note]: 这是关于命名的第一条说明。

这是正文第二段，包含另一个乱序数字脚注[^99]。
这是正文第三段，再次引用首个脚注[^note]。

[^99]: 这是乱序 99 号说明。
[^orphan]: 孤立未引用的补充说明。
`.trim();

    const normalized = normalizeMarkdownFootnotes(text);
    const lines = normalized.split("\n");

    // 1. 正文中的引用被重新编号为 [^1] 和 [^2]
    assert.ok(normalized.includes("包含一个命名脚注[^1]。"));
    assert.ok(normalized.includes("包含另一个乱序数字脚注[^2]。"));
    assert.ok(normalized.includes("再次引用首个脚注[^1]。"));

    // 2. 所有的定义被归集到最底端，按 1, 2, 3... 排序
    assert.ok(normalized.includes("[^1]: 这是关于命名的第一条说明。"));
    assert.ok(normalized.includes("[^2]: 这是乱序 99 号说明。"));
    assert.ok(normalized.includes("[^3]: 孤立未引用的补充说明。"));

    // 3. 正文中间的脚注定义行已被剥离
    assert.ok(!normalized.includes("中间穿插了脚注定义：\n[^note]:"));
});

test("escapeBackslash and {{xlc:slash}}: escapes and unescapes backslashes and control characters", () => {
    // 1. 转义 Windows 路径反斜杠
    const winPath = "C:\\Windows\\System32\\drivers";
    const escapedPath = escapeBackslash(winPath);
    assert.equal(escapedPath, "C:\\\\Windows\\\\System32\\\\drivers");

    // 2. 转义换行符与制表符
    const controlText = "Line1\nLine2\tTab";
    const escapedControl = escapeBackslash(controlText);
    assert.equal(escapedControl, "Line1\\nLine2\\tTab");

    // 3. 反转义还原
    assert.equal(escapeBackslash(escapedPath, "unescape"), winPath);
    assert.equal(escapeBackslash(escapedControl, "unescape"), controlText);

    // 4. 动态宏占位符测试
    const now = new Date("2026-10-29T12:00:00");
    assert.equal(applyPlaceholders("{{xlc:slash|C:\\Users}}", now, true), "C:\\\\Users");
    assert.equal(applyPlaceholders("{{xlc:slash:unescape|C:\\\\Users}}", now, true), "C:\\Users");
});

test("chunkLinesByDelimiter: chunks multi-line text by delimiters and assigns titles", () => {
    const text = `
第一节内容
详述步骤 1
---
第二节内容
详述步骤 2
---
第三节内容
详述步骤 3
`.trim();

    // 1. 默认分段
    const chunked = chunkLinesByDelimiter(text);
    assert.ok(chunked.includes("### 分段 1\n第一节内容\n详述步骤 1"));
    assert.ok(chunked.includes("### 分段 2\n第二节内容\n详述步骤 2"));
    assert.ok(chunked.includes("### 分段 3\n第三节内容\n详述步骤 3"));

    // 2. 自定义标题前缀
    const customTitle = chunkLinesByDelimiter(text, "^---+$", {titlePrefix: "## 步骤"});
    assert.ok(customTitle.includes("## 步骤 1\n第一节内容"));
    assert.ok(customTitle.includes("## 步骤 2\n第二节内容"));

    // 3. 无分割线文本原样返回
    const plain = "没有分割线的普通段落";
    assert.equal(chunkLinesByDelimiter(plain), plain);
});
