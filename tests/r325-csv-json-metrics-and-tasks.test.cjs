"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    csvToJson,
    toggleMarkdownTaskStatus,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveCountArg,
} = entry.placeholders;

test("csvToJson: converts CSV and TSV text to structured JSON array", () => {
    // 1. 标准 CSV 转换
    const csv = [
        "name,role,department",
        "Alice,Admin,Security",
        "Bob,Engineer,Infrastructure",
    ].join("\n");

    const res = csvToJson(csv, {pretty: false});
    assert.equal(res.ok, true);
    assert.equal(res.count, 2);
    assert.deepEqual(res.headers, ["name", "role", "department"]);
    const parsed = JSON.parse(res.result);
    assert.equal(parsed.length, 2);
    assert.equal(parsed[0].name, "Alice");
    assert.equal(parsed[1].department, "Infrastructure");

    // 2. 制表符 TSV 嗅探转换
    const tsv = [
        "id\ttitle\tstatus",
        "101\t登录优化\t完成",
        "102\t性能监控\t进行中",
    ].join("\n");
    const tsvRes = csvToJson(tsv);
    assert.equal(tsvRes.ok, true);
    assert.equal(tsvRes.count, 2);
    assert.deepEqual(tsvRes.headers, ["id", "title", "status"]);

    // 3. 引号包裹逗号字段与转义引号
    const escapedCsv = [
        "user,bio",
        "\"John, Doe\",\"He said \"\"Hello\"\"\"",
    ].join("\n");
    const escRes = csvToJson(escapedCsv);
    assert.equal(escRes.ok, true);
    const escParsed = JSON.parse(escRes.result);
    assert.equal(escParsed[0].user, "John, Doe");
    assert.equal(escParsed[0].bio, 'He said "Hello"');
});

test("toggleMarkdownTaskStatus: batch checks, unchecks, and inverts task list", () => {
    const rawList = [
        "- [ ] 第一项待办",
        "- [x] 第二项已完成",
        "* [ ] 第三项未完成",
        "普通说明文字，不应受影响",
        "+ [X] 第四项大写完成",
    ].join("\n");

    // 1. 全部重置为未完成 (uncheck-all)
    const uncheckRes = toggleMarkdownTaskStatus(rawList, "uncheck-all");
    assert.equal(uncheckRes.totalTasks, 4);
    assert.equal(uncheckRes.changedCount, 2);
    assert.ok(uncheckRes.result.includes("- [ ] 第二项已完成"));
    assert.ok(uncheckRes.result.includes("+ [ ] 第四项大写完成"));
    assert.ok(uncheckRes.result.includes("普通说明文字，不应受影响"));

    // 2. 全部标记为已完成 (check-all)
    const checkRes = toggleMarkdownTaskStatus(rawList, "check-all");
    assert.equal(checkRes.changedCount, 2);
    assert.ok(checkRes.result.includes("- [x] 第一项待办"));
    assert.ok(checkRes.result.includes("* [x] 第三项未完成"));

    // 3. 反转状态 (invert)
    const invertRes = toggleMarkdownTaskStatus(rawList, "invert");
    assert.equal(invertRes.changedCount, 4);
    assert.ok(invertRes.result.includes("- [x] 第一项待办"));
    assert.ok(invertRes.result.includes("- [ ] 第二项已完成"));
});

test("Count macro: dynamic text metrics calculation in templates", () => {
    const now = new Date(2026, 9, 28, 12, 0, 0);

    // 字符数
    const charsTpl = "字符总数：{{xlc:count:chars|小驴常用插件}}";
    assert.equal(applyPlaceholders(charsTpl, now, true), "字符总数：6");

    // 行数
    const linesTpl = "行数：{{xlc:count:lines|第一行\n第二行\n第三行}}";
    assert.equal(applyPlaceholders(linesTpl, now, true), "行数：3");

    // CJK 汉字数与词数（Hello world + 常用语 = 2 + 3 = 5 词）
    assert.equal(resolveCountArg("Hello 世界 2026", "cjk"), "2");
    assert.equal(resolveCountArg("Hello world 常用语", "words"), "5");
});
