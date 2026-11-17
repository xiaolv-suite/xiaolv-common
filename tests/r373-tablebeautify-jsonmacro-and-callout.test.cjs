"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    beautifyMarkdownTable,
    queryJsonPath,
    formatMarkdownCallout,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveJsonArg,
} = entry.placeholders;

test("beautifyMarkdownTable: vertically aligns columns with CJK double-width awareness", () => {
    const rawTable = `
| 姓名 | 年龄 | 城市 |
| :--- | :---: | ---: |
| 张三 | 24 | 北京 |
| Christopher | 30 | San Francisco |
`.trim();

    const beautified = beautifyMarkdownTable(rawTable);
    const lines = beautified.split("\n");
    assert.equal(lines.length, 4);

    // 每一行的首尾与分割线竖线对齐
    assert.ok(lines[0].startsWith("| "));
    assert.ok(lines[0].endsWith(" |"));
    assert.ok(lines[1].includes(":-"));
    assert.ok(/:-+:/.test(lines[1]));
    assert.ok(lines[1].includes("-:"));

    // 确保长英文列 Christopher (11) 使得第0列宽度足够宽且对齐（张三后填充7个空格平齐）
    assert.ok(lines[2].includes("张三       "));
    assert.ok(lines[3].includes("Christopher"));

    // 非法或空值回退
    assert.equal(beautifyMarkdownTable(""), "");
    assert.equal(beautifyMarkdownTable("不是表格内容"), "不是表格内容");
});

test("queryJsonPath and {{xlc:json}}: safely extracts properties via dot and bracket paths", () => {
    const jsonStr = JSON.stringify({
        user: {
            name: "Alice",
            age: 28,
            roles: ["admin", "editor"],
            loginCount: 15,
        },
        status: "success",
    });

    // 1. 点号访问
    assert.equal(queryJsonPath(jsonStr, "user.name"), "Alice");
    assert.equal(queryJsonPath(jsonStr, "status"), "success");
    assert.equal(queryJsonPath(jsonStr, "user.loginCount"), "15");

    // 2. 数组下标与嵌套
    assert.equal(queryJsonPath(jsonStr, "user.roles[0]"), "admin");
    assert.equal(queryJsonPath(jsonStr, "user.roles[1]"), "editor");

    // 3. 顶层键名提取
    assert.equal(queryJsonPath(jsonStr, "keys"), "user, status");

    // 4. 容错与 fallback
    assert.equal(queryJsonPath(jsonStr, "user.notExist", { fallback: "N/A" }), "N/A");
    assert.equal(queryJsonPath("坏 JSON", "a.b", { fallback: "error" }), "error");

    // 5. 动态宏解析 (JSON 后加空格与宏花括号隔离)
    assert.equal(resolveJsonArg(""), null);
    const macro1 = applyPlaceholders(`用户姓名：{{xlc:json|user.name|${jsonStr} }}`, new Date(), true);
    assert.equal(macro1, "用户姓名：Alice");

    const macro2 = applyPlaceholders(`所有键名：{{xlc:json:keys|${jsonStr} }}`, new Date(), true);
    assert.equal(macro2, "所有键名：user, status");
});

test("formatMarkdownCallout: wraps text in GitHub/Obsidian callout format and strips cleanly", () => {
    const body = `第一行提示内容\n第二行关键细节`;

    // 1. 默认 NOTE callout
    const noteCallout = formatMarkdownCallout(body, "NOTE");
    const nLines = noteCallout.split("\n");
    assert.equal(nLines[0], "> [!NOTE]");
    assert.equal(nLines[1], "> 第一行提示内容");
    assert.equal(nLines[2], "> 第二行关键细节");

    // 2. 自定义标题与折叠 TIP callout
    const tipCallout = formatMarkdownCallout(body, "TIP", { title: "实用小技巧", collapsible: true });
    const tLines = tipCallout.split("\n");
    assert.equal(tLines[0], "> [!TIP]- 实用小技巧");
    assert.equal(tLines[1], "> 第一行提示内容");

    // 3. 针对已有引用块进行包装（不重复嵌套 >>）
    const existingQuote = `> 已经引用的文字\n> 第二行`;
    const wrapped = formatMarkdownCallout(existingQuote, "WARNING");
    assert.ok(wrapped.startsWith("> [!WARNING]"));
    assert.ok(wrapped.includes("> 已经引用的文字"));
    assert.ok(!wrapped.includes("> > 已经引用的文字"));

    // 4. 剥离 Callout 头部
    const stripped = formatMarkdownCallout(tipCallout, "TIP", { strip: true });
    assert.ok(stripped.includes("> **实用小技巧**"));
    assert.ok(!stripped.includes("[!TIP]"));
});
