"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    setOperationsOnLines,
    convertRadix,
    stripAffixWords,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveRadixArg,
} = entry.placeholders;

test("setOperationsOnLines: calculates difference, intersection, and union across multi-line lists", () => {
    const listA = "apple\nbanana\norange\nbanana\npear";
    const listB = "banana\nPEAR\ngrape";

    // 1. difference (A - B) 默认区分大小写
    const diffCase = setOperationsOnLines(listA, listB, "difference");
    assert.equal(diffCase, "apple\norange\npear"); // PEAR 在 B 中但大小写不同，因此 pear 保留

    // 2. difference (A - B) 不区分大小写
    const diffNoCase = setOperationsOnLines(listA, listB, "difference", {caseSensitive: false});
    assert.equal(diffNoCase, "apple\norange"); // pear 被忽略大小写匹配剔除

    // 3. intersection (A ∩ B) 保留 A 顺序并去重
    const intersect = setOperationsOnLines(listA, listB, "intersection", {caseSensitive: false});
    assert.equal(intersect, "banana\npear");

    // 4. union (A ∪ B) 合并去重
    const union = setOperationsOnLines("A\nB", "B\nC", "union");
    assert.equal(union, "A\nB\nC");
});

test("convertRadix: converts numbers across DEC, HEX, BIN, and OCT with formatting options", () => {
    // 1. 十进制转十六进制 (大写 + 前缀)
    assert.equal(convertRadix(255, 10, 16, {prefix: true, uppercase: true}), "0xFF");
    assert.equal(convertRadix("255", 10, 16, {prefix: false, uppercase: false}), "ff");

    // 2. 十六进制转十进制 (自动处理 0x 前缀)
    assert.equal(convertRadix("0xFF", 16, 10), "255");
    assert.equal(convertRadix("2A", 16, 10), "42");

    // 3. 十进制转二进制与前缀位对齐
    assert.equal(convertRadix(42, 10, 2, {prefix: true}), "0b101010");
    assert.equal(convertRadix(5, 10, 2, {padBits: 8}), "00000101");

    // 4. 二进制转十进制 (自动处理 0b 前缀)
    assert.equal(convertRadix("0b101010", 2, 10), "42");

    // 5. 八进制转换
    assert.equal(convertRadix(64, 10, 8, {prefix: true}), "0o100");
    assert.equal(convertRadix("0o100", 8, 10), "64");
});

test("stripAffixWords: strips prefixes and suffixes from code variable names", () => {
    const codeLines = `
getUserInfo
setUserName
isActive
hasPermission
userId
orderDto
sysUserVO
`;

    // 1. 正则剥离前缀与后缀
    const stripped = stripAffixWords(codeLines, {
        prefix: /^(get|set|is|has)/i,
        suffix: /(Id|Dto|VO)$/i,
    });

    const expected = `
UserInfo
UserName
Active
Permission
user
order
sysUser
`;
    assert.equal(stripped.trim(), expected.trim());

    // 2. 字符串前缀与后缀
    const tblLines = "tbl_users_bak\ntbl_orders_bak";
    const resTbl = stripAffixWords(tblLines, {prefix: "tbl_", suffix: "_bak"});
    assert.equal(resTbl, "users\norders");
});

test("Radix macro: evaluates {{xlc:radix}} placeholders for multi-base numbers", () => {
    const now = new Date(2026, 9, 28, 12, 0, 0);

    // 1. 默认十进制转十六进制
    const tpl1 = "内存地址: {{xlc:radix|255}}";
    assert.equal(applyPlaceholders(tpl1, now, true), "内存地址: 0xFF");

    // 2. 冒号子命令十进制转二进制
    const tpl2 = "二进制掩码: {{xlc:radix:bin|42}}";
    assert.equal(applyPlaceholders(tpl2, now, true), "二进制掩码: 0b101010");

    // 3. 管道语法十六进制转十进制
    const tpl3 = "端口号: {{xlc:radix|hex2dec|0x1F90}}";
    assert.equal(applyPlaceholders(tpl3, now, true), "端口号: 8080");

    // 4. 二进制转十进制
    const tpl4 = "数值: {{xlc:radix:bin2dec|101010}}";
    assert.equal(applyPlaceholders(tpl4, now, true), "数值: 42");
});
