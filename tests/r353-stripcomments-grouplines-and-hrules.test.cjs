"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    stripCodeComments,
    groupLinesByPattern,
    normalizeHorizontalRules,
} = entry.clipboardCleaner;

test("stripCodeComments: safely strips line and block comments while protecting string literals", () => {
    const jsCode = `
// 这是顶部注释
const url = "https://siyuan-note.com/api"; // URL 内部的双斜杠不可误删
const color = '#ff0000'; /* 颜色值 */
/* 
 * 块级多行注释
 */
function greet() {
    return "Hello // World";
}
`.trim();

    const res = stripCodeComments(jsCode);
    assert.equal(res.removedCount, 4);
    assert.ok(!res.result.includes("// 这是顶部注释"));
    assert.ok(!res.result.includes("/* 颜色值 */"));
    assert.ok(!res.result.includes("块级多行注释"));
    // 保护字符串字面量
    assert.ok(res.result.includes('"https://siyuan-note.com/api"'));
    assert.ok(res.result.includes('"Hello // World"'));
    assert.ok(res.result.includes("'#ff0000'"));
});

test("groupLinesByPattern: groups and aggregates multi-line text by prefix patterns", () => {
    const logs = `
[ERROR] Database connection failed
[INFO] Server started on port 8080
[ERROR] Query timeout on table sys_users
[WARN] Cache hit ratio lower than 80%
[INFO] Health check passed
`.trim();

    const res = groupLinesByPattern(logs);
    assert.ok(res.includes("### ERROR (2)"));
    assert.ok(res.includes("### INFO (2)"));
    assert.ok(res.includes("### WARN (1)"));
    assert.ok(res.includes("[ERROR] Database connection failed"));
    assert.ok(res.includes("[ERROR] Query timeout on table sys_users"));
});

test("normalizeHorizontalRules: standardizes horizontal rules and prevents Setext H2 heading trap", () => {
    // 1. 各种形态的分割线统一为 ---
    const messyRules = `
第一节内容
***
第二节内容
* * *
第三节内容
___
`.trim();

    const res = normalizeHorizontalRules(messyRules, "---");
    assert.equal(res.normalizedCount, 3);
    const lines = res.result.split("\n");
    // 验证分割线两侧均保证有空行隔离（防止第一节内容紧贴 --- 变成二级标题！）
    assert.ok(res.result.includes("第一节内容\n\n---"));
    assert.ok(res.result.includes("---\n\n第二节内容"));
});
