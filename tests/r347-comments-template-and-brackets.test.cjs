"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    toggleLineComments,
    renderSimpleTemplate,
    checkBracketsBalance,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveTemplateArg,
} = entry.placeholders;

test("toggleLineComments: adds and removes comment prefixes on multi-line code", () => {
    const code = `
const a = 1;
  const b = 2;

const c = 3;
`.trim();

    // 1. 批量添加 // 注释 (保持原有缩进)
    const commented = toggleLineComments(code, "// ");
    assert.equal(commented.mode, "comment");
    assert.equal(commented.changedLines, 3);
    const expectedCommented = "// const a = 1;\n  // const b = 2;\n\n// const c = 3;";
    assert.equal(commented.result, expectedCommented);

    // 2. 全部行已注释时，再次调用自动切换为取消注释
    const uncommented = toggleLineComments(commented.result, "// ");
    assert.equal(uncommented.mode, "uncomment");
    assert.equal(uncommented.changedLines, 3);
    assert.equal(uncommented.result, code);

    // 3. 自定义 # 注释前缀 (Python / Shell / YAML)
    const pyCode = "import sys\nimport os";
    const pyCommented = toggleLineComments(pyCode, "# ");
    assert.equal(pyCommented.result, "# import sys\n# import os");
});

test("renderSimpleTemplate: interpolates dictionary or query data into {key} placeholders", () => {
    // 1. 对象数据插值
    const tpl1 = "尊敬的 {name}，您的订单号为 {order_id}，已发货至 {city}。";
    const res1 = renderSimpleTemplate(tpl1, {name: "李雷", order_id: "SN123", city: "上海"});
    assert.equal(res1, "尊敬的 李雷，您的订单号为 SN123，已发货至 上海。");

    // 2. URL 查询串格式数据与双花括号兼容
    const tpl2 = "Hello {{user}}, welcome to {{place}}!";
    const res2 = renderSimpleTemplate(tpl2, "user=Bob&place=Beijing");
    assert.equal(res2, "Hello Bob, welcome to Beijing!");

    // 3. JSON 字符串数据
    const tpl3 = "Token: {token}, Expire: {expire}";
    const res3 = renderSimpleTemplate(tpl3, JSON.stringify({token: "xyz789", expire: "3600s"}));
    assert.equal(res3, "Token: xyz789, Expire: 3600s");
});

test("checkBracketsBalance: verifies pair balancing and detects unclosed/unexpected brackets", () => {
    // 1. 完全平衡闭合
    const balanced1 = "function test(a, [b, {c}]) { return 《书名》.get('「章节」'); }";
    const res1 = checkBracketsBalance(balanced1);
    assert.equal(res1.isBalanced, true);
    assert.equal(res1.unclosed.length, 0);
    assert.equal(res1.unexpected.length, 0);

    // 2. 未闭合左括号
    const unclosedStr = "const list = [1, 2, 3; console.log(a);";
    const res2 = checkBracketsBalance(unclosedStr);
    assert.equal(res2.isBalanced, false);
    assert.deepEqual(res2.unclosed, ["["]);

    // 3. 多余右括号
    const unexpectedStr = "calc(10 + 20))";
    const res3 = checkBracketsBalance(unexpectedStr);
    assert.equal(res3.isBalanced, false);
    assert.deepEqual(res3.unexpected, [")"]);
});

test("Template macro: evaluates {{xlc:template}} placeholders with key-value data", () => {
    const now = new Date(2026, 9, 29, 12, 0, 0);

    // 1. 查询串参数格式
    const tpl1 = "提醒：{{xlc:template|您的快递 {sn} 已送达 {site}|sn=SF100&site=东门驿站}}";
    const res1 = applyPlaceholders(tpl1, now, true);
    assert.equal(res1, "提醒：您的快递 SF100 已送达 东门驿站");

    // 2. YAML 换行键值格式
    const tpl2 = "配置：{{xlc:template|主机: {host}, 端口: {port}|host: localhost\nport: 8080}}";
    const res2 = applyPlaceholders(tpl2, now, true);
    assert.equal(res2, "配置：主机: localhost, 端口: 8080");

    // 3. JSON 格式参数 (末尾留空格避免 }} 撞宏闭合标记)
    const tpl3 = '通知：{{xlc:template|用户 {user} 角色变更: {role}|{"user":"Alice","role":"管理员"} }}';
    const res3 = applyPlaceholders(tpl3, now, true);
    assert.equal(res3, "通知：用户 Alice 角色变更: 管理员");
});
