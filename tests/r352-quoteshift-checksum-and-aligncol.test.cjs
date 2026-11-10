"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    shiftMarkdownBlockquotes,
    calculateChecksum,
    alignDelimitedColumns,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveChecksumArg,
} = entry.placeholders;

test("shiftMarkdownBlockquotes: increases and decreases nested blockquote levels", () => {
    const raw = `
第一行段落
> 第二行一级引用
>> 第三行二级引用
`.trim();

    // 1. 整体升一级引用 (delta = 1)
    const shiftedUp = shiftMarkdownBlockquotes(raw, 1);
    const linesUp = shiftedUp.result.split("\n");
    assert.equal(linesUp[0], "> 第一行段落");
    assert.equal(linesUp[1], "> > 第二行一级引用");
    assert.equal(linesUp[2], "> >> 第三行二级引用");
    assert.equal(shiftedUp.shiftedCount, 3);

    // 2. 整体降一级引用 (delta = -1)
    const shiftedDown = shiftMarkdownBlockquotes(shiftedUp.result, -1);
    assert.equal(shiftedDown.result, raw);
    assert.equal(shiftedDown.shiftedCount, 3);

    // 3. 无引用行降级不报错且保持原状
    const resNoQuote = shiftMarkdownBlockquotes("纯文本", -1);
    assert.equal(resNoQuote.result, "纯文本");
    assert.equal(resNoQuote.shiftedCount, 0);
});

test("calculateChecksum: computes standard CRC32 and Adler32 checksums", () => {
    // 1. 标准测试向量 "123456789" 的 CRC32 校验和为 cbf43926
    const crc = calculateChecksum("123456789", "crc32");
    assert.equal(crc, "cbf43926");

    // 2. Adler32 校验和
    const adler = calculateChecksum("123456789", "adler32");
    assert.equal(adler.length, 8);
    assert.equal(calculateChecksum("123456789", "adler32"), adler);

    // 3. 空值安全防护
    assert.equal(calculateChecksum("", "crc32"), "00000000");
});

test("alignDelimitedColumns: aligns delimited table cells to equal width", () => {
    const csv = `
name,age,city
Alice,28,Beijing
Bob,5,San Francisco
Charlie,32,Tokyo
`.trim();

    // 1. 默认对齐
    const aligned = alignDelimitedColumns(csv, ",");
    const lines = aligned.split("\n");
    assert.equal(lines.length, 4);

    // 验证各行第 1 个逗号前宽对齐 (最大宽度是 Charlie: 7 字符)
    assert.equal(lines[0].startsWith("name   ,"), true);
    assert.equal(lines[1].startsWith("Alice  ,"), true);
    assert.equal(lines[2].startsWith("Bob    ,"), true);
    assert.equal(lines[3].startsWith("Charlie,"), true);
});

test("Checksum macro: evaluates {{xlc:checksum}} placeholders dynamically", () => {
    const now = new Date(2026, 9, 29, 12, 0, 0);

    // 1. 默认 CRC32 管道语法
    const tpl1 = "CRC: {{xlc:checksum|123456789}}";
    assert.equal(applyPlaceholders(tpl1, now, true), "CRC: cbf43926");

    // 2. 冒号子命令 Adler32 语法
    const tpl2 = "ADLER: {{xlc:checksum:adler32|123456789}}";
    const res2 = applyPlaceholders(tpl2, now, true);
    assert.ok(/^ADLER: [0-9a-f]{8}$/.test(res2));
});
