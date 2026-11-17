"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    stripMarkdownFormatting,
    formatByteSize,
    shuffleLines,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveFilesizeArg,
} = entry.placeholders;

test("stripMarkdownFormatting: strips headers, bold, code fences, and links down to plain text", () => {
    const md = [
        "# 一级标题",
        "## 二级标题与 **粗体强调** 以及 *斜体* 与 ~~删除线~~",
        "欢迎访问 [思源笔记官网](https://b3log.org/siyuan) 获取更新",
        "这是一个行内代码 `const a = 1;` 演示",
        "> 这是一个引用说明块",
        "```ts",
        "function run() { return true; }",
        "```",
        "---",
    ].join("\n");

    const plain = stripMarkdownFormatting(md);
    assert.ok(plain.includes("一级标题"));
    assert.ok(plain.includes("二级标题与 粗体强调 以及 斜体 与 删除线"));
    assert.ok(plain.includes("欢迎访问 思源笔记官网 获取更新"));
    assert.ok(plain.includes("这是一个行内代码 const a = 1; 演示"));
    assert.ok(plain.includes("这是一个引用说明块"));
    assert.ok(plain.includes("function run() { return true; }"));
    assert.ok(!plain.includes("#"));
    assert.ok(!plain.includes("**"));
    assert.ok(!plain.includes("```"));
    assert.ok(!plain.includes("https://b3log.org/siyuan"));
});

test("formatByteSize: formats byte values into human-readable units", () => {
    // 1. 基础单位
    assert.equal(formatByteSize(0), "0 B");
    assert.equal(formatByteSize(512), "512 B");

    // 2. KB、MB、GB
    assert.equal(formatByteSize(1024), "1 KB");
    assert.equal(formatByteSize(1048576), "1 MB");
    assert.equal(formatByteSize(1073741824), "1 GB");

    // 3. 带小数与非整倍数
    assert.equal(formatByteSize(1536, 1), "1.5 KB");
    assert.equal(formatByteSize(2500000, 2), "2.38 MB");

    // 4. 字符串输入与负数
    assert.equal(formatByteSize("2048"), "2 KB");
    assert.equal(formatByteSize(-1048576), "-1 MB");
});

test("shuffleLines: randomly shuffles lines while keeping elements intact", () => {
    const items = [
        "第一项 Alpha",
        "第二项 Beta",
        "第三项 Gamma",
        "第四项 Delta",
        "第五项 Epsilon",
    ].join("\n");

    const shuffled = shuffleLines(items);
    const shuffledLines = shuffled.split("\n");
    assert.equal(shuffledLines.length, 5);

    // 集合元素完整不变
    const origSet = new Set(items.split("\n"));
    for (const l of shuffledLines) {
        assert.ok(origSet.has(l));
    }
});

test("Filesize macro: dynamic placeholder expansion for byte capacity formatting", () => {
    const now = new Date(2026, 9, 28, 12, 0, 0);

    // 1. 默认格式化
    const tpl1 = "文件大小：{{xlc:filesize|2097152}}";
    const res1 = applyPlaceholders(tpl1, now, true);
    assert.equal(res1, "文件大小：2 MB");

    // 2. 带小数位参数
    const tpl2 = "下载体积：{{xlc:filesize|1536|1}}";
    const res2 = applyPlaceholders(tpl2, now, true);
    assert.equal(res2, "下载体积：1.5 KB");

    // 3. 直接调用 resolveFilesizeArg
    assert.equal(resolveFilesizeArg("1024"), "1 KB");
    assert.equal(resolveFilesizeArg(""), null);
});
