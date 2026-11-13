"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    parseKeyValuePairs,
    extractKvValue,
    sortLinesByColumn,
    formatByRegexGroups,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveKvArg,
    resolveMatchArg,
} = entry.placeholders;

test("parseKeyValuePairs & extractKvValue: parses URL query strings, YAML, and extracts keys", () => {
    // 1. URL 查询参数解析与 URL 解码
    const query = "?name=Alice+Smith&role=Senior%20Dev&active=true";
    const kv1 = parseKeyValuePairs(query);
    assert.equal(kv1.name, "Alice Smith");
    assert.equal(kv1.role, "Senior Dev");
    assert.equal(kv1.active, "true");

    // 2. 多行 Properties / YAML 键值解析
    const yaml = `
host: 127.0.0.1
port: 8080
env: production
`;
    const kv2 = parseKeyValuePairs(yaml);
    assert.equal(kv2.host, "127.0.0.1");
    assert.equal(kv2.port, "8080");
    assert.equal(kv2.env, "production");

    // 3. extractKvValue 单键提取与默认回退值
    assert.equal(extractKvValue(query, "name"), "Alice Smith");
    assert.equal(extractKvValue(query, "ROLE"), "Senior Dev"); // 大小写宽松回退
    assert.equal(extractKvValue(query, "missing", "default_val"), "default_val");
});

test("sortLinesByColumn: sorts lines by specified column with numeric, header, and descending options", () => {
    const data = `
Item\tScore\tRank
Apple\t85\tB
Banana\t100\tA
Cherry\t9\tC
Date\t92\tA
`.trim();

    // 1. 按第 2 列数值降序排序，保留表头
    const sortedNumDesc = sortLinesByColumn(data, 2, {numeric: true, descending: true, hasHeader: true});
    const lines1 = sortedNumDesc.split("\n");
    assert.equal(lines1[0], "Item\tScore\tRank");
    assert.equal(lines1[1], "Banana\t100\tA"); // 100
    assert.equal(lines1[2], "Date\t92\tA");     // 92
    assert.equal(lines1[3], "Apple\t85\tB");    // 85
    assert.equal(lines1[4], "Cherry\t9\tC");    // 9 (数值排序：9在最底)

    // 2. 按第 1 列字典序升序排序 (不带表头)
    const rawList = "Charlie\t30\nAlice\t50\nBob\t20";
    const sortedAlpha = sortLinesByColumn(rawList, 1);
    assert.equal(sortedAlpha, "Alice\t50\nBob\t20\nCharlie\t30");
});

test("formatByRegexGroups: transforms regex capture groups into formatted templates", () => {
    // 1. 日期格式重组
    const dateStr = "2026-10-28";
    const resDate = formatByRegexGroups(dateStr, /(\d{4})-(\d{2})-(\d{2})/, "$1年$2月$3日");
    assert.equal(resDate, "2026年10月28日");

    // 2. 用户信息重组
    const userStr = "姓名: 张三, 手机: 13800000000";
    const resUser = formatByRegexGroups(userStr, /姓名:\s*(\S+),\s*手机:\s*(\d+)/, "用户【$1】联系电话: $2");
    assert.equal(resUser, "用户【张三】联系电话: 13800000000");

    // 3. 不匹配时原样安全回退
    const nomatch = "Hello World";
    assert.equal(formatByRegexGroups(nomatch, /^\d+$/, "$1"), nomatch);
});

test("Placeholder macro: evaluates {{xlc:kv}} and {{xlc:match}} dynamically", () => {
    const now = new Date(2026, 9, 28, 12, 0, 0);

    // 1. kv 宏冒号语法
    const tpl1 = "用户名: {{xlc:kv:user|user=Alice&org=DevTeam}}";
    assert.equal(applyPlaceholders(tpl1, now, true), "用户名: Alice");

    // 2. kv 宏管道语法与多行文本
    const tpl2 = "端口: {{xlc:kv|port|host: 0.0.0.0\nport: 3000}}";
    assert.equal(applyPlaceholders(tpl2, now, true), "端口: 3000");

    // 3. match 正则分组宏
    const tpl3 = "日期重排: {{xlc:match|(\\d{4})-(\\d{2})-(\\d{2})|$2/$3/$1|2026-10-28}}";
    assert.equal(applyPlaceholders(tpl3, now, true), "日期重排: 10/28/2026");
});
