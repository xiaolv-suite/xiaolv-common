"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    setMarkdownCodeFenceLang,
    escapeMacroPipe,
    formatTextColumnsGrid,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveEscapeArg,
} = entry.placeholders;

test("setMarkdownCodeFenceLang: sets language tag on bare code fences and supports overwrite", () => {
    const md = `
这是顶部文本。
\`\`\`
const x = 10;
\`\`\`
中间段落。
\`\`\`python
print("hello")
\`\`\`
尾部文本。
`.trim();

    // 1. 默认仅补全裸代码块 (不覆盖已有 python)
    const withTs = setMarkdownCodeFenceLang(md, "typescript");
    assert.ok(withTs.includes("```typescript\nconst x = 10;"));
    assert.ok(withTs.includes("```python\nprint(\"hello\")"));

    // 2. 覆盖已有语言标识 (overwriteExisting: true)
    const overwritten = setMarkdownCodeFenceLang(md, "js", {overwriteExisting: true});
    assert.ok(overwritten.includes("```js\nconst x = 10;"));
    assert.ok(overwritten.includes("```js\nprint(\"hello\")"));

    // 3. 闭合围栏保持裸围栏不被篡改
    const lines = withTs.split("\n");
    assert.equal(lines[3], "```");
});

test("escapeMacroPipe and {{xlc:escape}}: escapes and unescapes pipe delimiters", () => {
    // 1. 转义管道符
    assert.equal(escapeMacroPipe("a|b|c"), "a\\|b\\|c");
    assert.equal(escapeMacroPipe("pattern: (\\d+|\\w+)"), "pattern: (\\d+\\|\\w+)");

    // 2. 反转义
    assert.equal(escapeMacroPipe("a\\|b\\|c", "unescape"), "a|b|c");
    assert.equal(escapeMacroPipe("a&#124;b", "unescape"), "a|b");
    assert.equal(escapeMacroPipe("a%7Cb", "unescape"), "a|b");

    // 3. 动态宏占位符测试
    const now = new Date("2026-10-29T12:00:00");
    assert.equal(applyPlaceholders("{{xlc:escape|foo|bar}}", now, true), "foo\\|bar");
    assert.equal(applyPlaceholders("{{xlc:escape:unescape|foo\\|bar}}", now, true), "foo|bar");
});

test("formatTextColumnsGrid: formats multi-line text into balanced visual column grid", () => {
    const items = `
Item 1
Very Long Item Name
Item 3
Item 4
Item 5
Item 6
`.trim();

    // 1. 三列排版
    const grid = formatTextColumnsGrid(items, 3, {columnGap: 2});
    const rows = grid.split("\n");
    assert.equal(rows.length, 2);
    // 第一行有 3 列
    assert.ok(rows[0].includes("Item 1"));
    assert.ok(rows[0].includes("Very Long Item Name"));
    assert.ok(rows[0].includes("Item 3"));

    // 2. 支持中文字符双倍视觉宽度对齐
    const cjkItems = "苹果\n超长香蕉品类名称\n橙子\n西瓜";
    const cjkGrid = formatTextColumnsGrid(cjkItems, 2, {columnGap: 4});
    const cjkRows = cjkGrid.split("\n");
    assert.equal(cjkRows.length, 2);
    assert.ok(cjkRows[0].startsWith("苹果"));
    assert.ok(cjkRows[0].includes("超长香蕉品类名称"));
});
