"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {placeholders} = require("./.build/entry.cjs");

const {resolvePlaceholder, renderPlaceholder, applyPlaceholders} = placeholders;

test("Placeholder shorthand macros: year, quarter, month, day, hour, minute", () => {
    // 构造固定时间：2026-10-28 14:30:00 (属于第 4 季度 Q4)
    const fixedDate = new Date(2026, 9, 28, 14, 30, 0);

    // 1. 年份
    assert.equal(renderPlaceholder("year", fixedDate), "2026");
    assert.equal(resolvePlaceholder("year", "short", fixedDate), "26");

    // 2. 季度
    assert.equal(renderPlaceholder("quarter", fixedDate), "Q4");
    assert.equal(resolvePlaceholder("quarter", "zh", fixedDate), "第四季度");
    assert.equal(resolvePlaceholder("quarter", "full", fixedDate), "2026Q4");

    // 3. 月份
    assert.equal(renderPlaceholder("month", fixedDate), "10");
    assert.equal(resolvePlaceholder("month", "zh", fixedDate), "10月");

    // 4. 日期
    assert.equal(renderPlaceholder("day", fixedDate), "28");
    assert.equal(resolvePlaceholder("day", "zh", fixedDate), "28日");

    // 5. 小时与分钟
    assert.equal(renderPlaceholder("hour", fixedDate), "14");
    assert.equal(renderPlaceholder("minute", fixedDate), "30");

    // 6. applyPlaceholders 复合模板展开
    const template = "报告周期：{{xlc:year}}年{{xlc:quarter|zh}}，生成于{{xlc:month}}月{{xlc:day}}日 {{xlc:hour}}:{{xlc:minute}}";
    const rendered = applyPlaceholders(template, fixedDate, true);
    assert.equal(rendered, "报告周期：2026年第四季度，生成于10月28日 14:30");
});

test("Markdown link formatting helper for URL entries", () => {
    function buildMarkdownLink(title, url) {
        const cleanTitle = (title || "链接").replace(/[[\]]/g, "");
        return `[${cleanTitle}](${url})`;
    }

    assert.equal(buildMarkdownLink("小驴常用仓库", "https://github.com/xiaolv-suite/xiaolv-common"), "[小驴常用仓库](https://github.com/xiaolv-suite/xiaolv-common)");
    assert.equal(buildMarkdownLink("含[括号]标题", "https://example.com"), "[含括号标题](https://example.com)");
});
