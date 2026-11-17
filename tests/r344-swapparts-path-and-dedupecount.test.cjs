"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    swapLineParts,
    parsePathParts,
    deduplicateWithCount,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolvePathArg,
} = entry.placeholders;

test("swapLineParts: swaps key-value pairs and delimited columns on each line", () => {
    // 1. 冒号分隔对调
    const colonLines = "name: Alice\nage: 28\ncity: Beijing";
    const swappedColon = swapLineParts(colonLines);
    assert.equal(swappedColon, "Alice: name\n28: age\nBeijing: city");

    // 2. 箭头分隔对调
    const arrowLines = "source -> target\ninput -> output";
    const swappedArrow = swapLineParts(arrowLines, "->", {outputSeparator: " -> "});
    assert.equal(swappedArrow, "target -> source\noutput -> input");

    // 3. 逗号分隔对调
    const commaLines = "Smith, John\nDoe, Jane";
    const swappedComma = swapLineParts(commaLines, ",", {outputSeparator: ", "});
    assert.equal(swappedComma, "John, Smith\nJane, Doe");
});

test("parsePathParts: parses file paths and URLs into structured components", () => {
    // 1. Unix 风格深层路径
    const p1 = parsePathParts("/users/admin/projects/auth.service.ts");
    assert.equal(p1.dir, "/users/admin/projects");
    assert.equal(p1.filename, "auth.service.ts");
    assert.equal(p1.stem, "auth.service");
    assert.equal(p1.ext, "ts");

    // 2. Windows 风格反斜杠路径
    const p2 = parsePathParts("C:\\Documents\\Reports\\Q3_Summary.docx");
    assert.equal(p2.dir, "C:/Documents/Reports");
    assert.equal(p2.filename, "Q3_Summary.docx");
    assert.equal(p2.stem, "Q3_Summary");
    assert.equal(p2.ext, "docx");

    // 3. 带查询参数与 Hash 的 URL
    const p3 = parsePathParts("https://example.com/assets/images/banner.png?v=123#top");
    assert.equal(p3.filename, "banner.png");
    assert.equal(p3.ext, "png");
    assert.equal(p3.stem, "banner");

    // 4. 点号隐藏文件
    const p4 = parsePathParts("/root/.gitignore");
    assert.equal(p4.filename, ".gitignore");
    assert.equal(p4.stem, ".gitignore");
    assert.equal(p4.ext, "");
});

test("deduplicateWithCount: deduplicates lines and attaches frequency count sorted by frequency", () => {
    const raw = `
error 500
error 404
error 500
error 500
error 404
ok 200
`.trim();

    // 1. 默认按出现频次降序排序
    const res1 = deduplicateWithCount(raw);
    const lines1 = res1.split("\n");
    assert.equal(lines1.length, 3);
    assert.equal(lines1[0], "error 500 (3)");
    assert.equal(lines1[1], "error 404 (2)");
    assert.equal(lines1[2], "ok 200 (1)");

    // 2. 自定义格式模板
    const res2 = deduplicateWithCount(raw, {formatTemplate: "[{count}次] {line}"});
    const lines2 = res2.split("\n");
    assert.equal(lines2[0], "[3次] error 500");
    assert.equal(lines2[1], "[2次] error 404");
    assert.equal(lines2[2], "[1次] ok 200");
});

test("Path macro: evaluates {{xlc:path}} placeholders for path components", () => {
    const now = new Date(2026, 9, 28, 12, 0, 0);
    const mockDoc = {title: "我的日记", path: "/notebooks/diary/2026-10-28.md"};

    // 1. 无参形态保持原文档路径
    const tpl1 = "当前路径: {{xlc:path}}";
    assert.equal(applyPlaceholders(tpl1, now, true, mockDoc), "当前路径: /notebooks/diary/2026-10-28.md");

    // 2. 提取输入路径的文件名与扩展名
    const tpl2 = "文件名: {{xlc:path:filename|/data/export/report.pdf}}";
    assert.equal(applyPlaceholders(tpl2, now, true, mockDoc), "文件名: report.pdf");

    const tpl3 = "扩展名: {{xlc:path:ext|/data/export/report.pdf}}";
    assert.equal(applyPlaceholders(tpl3, now, true, mockDoc), "扩展名: pdf");

    // 3. 提取输入路径的基本名与目录
    const tpl4 = "基本名: {{xlc:path:stem|archive.tar.gz}}";
    assert.equal(applyPlaceholders(tpl4, now, true, mockDoc), "基本名: archive.tar");

    const tpl5 = "目录: {{xlc:path:dir|/a/b/c/file.txt}}";
    assert.equal(applyPlaceholders(tpl5, now, true, mockDoc), "目录: /a/b/c");

    // 4. 当前文档自动回退：{{xlc:path:filename}} 不传参取当前文档文件名
    const tpl6 = "文档名: {{xlc:path:filename}}";
    assert.equal(applyPlaceholders(tpl6, now, true, mockDoc), "文档名: 2026-10-28.md");
});
