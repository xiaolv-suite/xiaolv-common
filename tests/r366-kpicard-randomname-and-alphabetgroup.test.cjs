"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    formatKpiSummaryCard,
    generateRandomName,
    groupLinesByAlphabet,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveRandomNameArg,
} = entry.placeholders;

test("formatKpiSummaryCard: formats key-value lines and tables into professional Markdown KPI cards", () => {
    const rawMetrics = `
总营业额: 128,500 元
付费用户数: 3,420 人
次日留存率 = 42.5%
客单价 -> 188 元
`.trim();

    const card = formatKpiSummaryCard(rawMetrics);
    assert.ok(card.includes("> ### 📊 核心数据看板"));
    assert.ok(card.includes("> | 指标名称 | 核心数值 |"));
    assert.ok(card.includes("> | **总营业额** | `128,500 元` |"));
    assert.ok(card.includes("> | **付费用户数** | `3,420 人` |"));
    assert.ok(card.includes("> | **次日留存率** | `42.5%` |"));
    assert.ok(card.includes("> | **客单价** | `188 元` |"));

    // 自定义标题与无引用块
    const custom = formatKpiSummaryCard("Q3收入: 50万", {title: "运营周报", asBlockquote: false});
    assert.ok(custom.startsWith("### 运营周报"));
    assert.ok(!custom.startsWith(">"));
});

test("generateRandomName and {{xlc:randomname}}: generates realistic Chinese and English names", () => {
    // 1. 中文姓名 (2 或 3 个汉字)
    const zhName = generateRandomName("zh");
    assert.match(zhName, /^[\u4e00-\u9fa5]{2,3}$/);

    // 2. 英文姓名 (名 + 姓)
    const enName = generateRandomName("en");
    assert.match(enName, /^[A-Z][a-z]+ [A-Z][a-z]+$/);

    // 3. 动态宏占位符测试
    const now = new Date("2026-10-29T12:00:00");
    const macroZh = applyPlaceholders("{{xlc:randomname}}", now, true);
    assert.match(macroZh, /^[\u4e00-\u9fa5]{2,3}$/);

    const macroEn = applyPlaceholders("{{xlc:randomname:en}}", now, true);
    assert.match(macroEn, /^[A-Z][a-z]+ [A-Z][a-z]+$/);
});

test("groupLinesByAlphabet: groups multi-line text by initial letter and Chinese Pinyin", () => {
    const list = `
- 苹果 (Pingguo -> P)
- 橙子 (Chengzi -> C)
- Banana (B)
- Apple (A)
- 菠萝 (Boluo -> B)
`.trim();

    const grouped = groupLinesByAlphabet(list);
    assert.ok(grouped.includes("## A\n- Apple (A)"));
    assert.ok(grouped.includes("## B\n- 菠萝 (Boluo -> B)\n- Banana (B)"));
    assert.ok(grouped.includes("## C\n- 橙子 (Chengzi -> C)"));
    assert.ok(grouped.includes("## P\n- 苹果 (Pingguo -> P)"));
});
