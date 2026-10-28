"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    flattenNestedList,
    maskTextRange,
    formatCJKSpacingComprehensive,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveSmaskArg,
} = entry.placeholders;

test("flattenNestedList: flattens multi-level nested lists to flat bullets or parent-prefixed items", () => {
    const nested = `
- 研发部
  - 前端团队
    - Vue 小组
    - React 小组
  - 后端团队
    - Node.js 小组
`.trim();

    // 1. 扁平化为纯顶层圆点列表 (flat_bullets)
    const flat = flattenNestedList(nested, "flat_bullets");
    const fLines = flat.split("\n");
    assert.equal(fLines.length, 6);
    assert.equal(fLines[0], "- 研发部");
    assert.equal(fLines[1], "- 前端团队");
    assert.equal(fLines[2], "- Vue 小组");
    assert.equal(fLines[3], "- React 小组");
    assert.equal(fLines[4], "- 后端团队");
    assert.equal(fLines[5], "- Node.js 小组");

    // 2. 携带父级路径前缀 (prefix_parent)
    const prefixed = flattenNestedList(nested, "prefix_parent");
    assert.ok(prefixed.includes("- 研发部 > 前端团队: Vue 小组"));
    assert.ok(prefixed.includes("- 研发部 > 后端团队: Node.js 小组"));
});

test("maskTextRange and {{xlc:smask}}: masks arbitrary text ranges or keeps start and end characters", () => {
    // 1. 留头尾脱敏 (keepStart: 3, keepEnd: 4)
    const phone = "13812345678";
    assert.equal(maskTextRange(phone, {keepStart: 3, keepEnd: 4}), "138****5678");

    // 2. 银行卡号留头尾 (keepStart: 4, keepEnd: 4)
    const card = "6222021234567890";
    assert.equal(maskTextRange(card, {keepStart: 4, keepEnd: 4}), "6222********7890");

    // 3. 指定起始位置和长度脱敏 (start: 2, length: 3)
    assert.equal(maskTextRange("abcdefgh", {start: 2, length: 3, maskChar: "#"}), "ab###fgh");

    // 4. 动态宏占位符测试
    const now = new Date("2026-10-29T12:00:00");
    assert.equal(applyPlaceholders("{{xlc:smask|keep|13812345678|3|4}}", now, true), "138****5678");
    assert.equal(applyPlaceholders("{{xlc:smask:ends|1234567890|2|2}}", now, true), "12******90");
    assert.equal(applyPlaceholders("{{xlc:smask|hello world|0|5}}", now, true), "***** world");
});

test("formatCJKSpacingComprehensive: performs integrated CJK spacing, punctuation cleanup, and NBSP removal", () => {
    // 包含 NBSP、中英贴合、全角标点多余空格、英文逗号缺少空格
    const messy = "你好\u00A0world ， 测试一下100MB容量！hello,world";
    const res = formatCJKSpacingComprehensive(messy);

    assert.ok(res.changed);
    // 1. NBSP 被清理
    assert.ok(!res.result.includes("\u00A0"));
    // 2. 中英盘古空格生效
    assert.ok(res.result.includes("你好 world，测试一下 100MB 容量！"));
    // 3. 英文逗号规范空格生效
    assert.ok(res.result.includes("hello, world"));
});
