"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    surroundEachLine,
    extractExecutiveSummary,
    convertIndentation,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveSummaryArg,
} = entry.placeholders;

test("surroundEachLine: surrounds lines with quotes, brackets, or custom wrappers", () => {
    const list = [
        "apple",
        "banana",
        "",
        "orange",
    ].join("\n");

    // 1. 默认双引号包裹 (空行忽略)
    const resQuote = surroundEachLine(list, '"');
    assert.equal(resQuote, '"apple"\n"banana"\n\n"orange"');

    // 2. 括号预设对识别 (如 "()")
    const resParen = surroundEachLine(list, "()");
    assert.equal(resParen, "(apple)\n(banana)\n\n(orange)");

    // 3. 中文书名号识别 (如 "《》")
    const resBook = surroundEachLine(list, "《》");
    assert.equal(resBook, "《apple》\n《banana》\n\n《orange》");

    // 4. 自定义元组包裹 (如 Markdown 列表粗体 "- **" 与 "**")
    const resMd = surroundEachLine(list, ["- **", "**"]);
    assert.equal(resMd, "- **apple**\n- **banana**\n\n- **orange**");
});

test("extractExecutiveSummary: extracts first non-header paragraph and strips formatting", () => {
    const doc = [
        "# 思源常用资产层架构说明",
        "---",
        "",
        "小驴常用是基于思源笔记块级原子能力的**高效内容资产复用**与*知识沉淀*插件，专为提升输入与管理效率而设计。",
        "",
        "## 第二章节更多内容",
        "后续更多实现细节...",
    ].join("\n");

    // 1. 提取首段精要并剥离 Markdown 粗体与斜体
    const summary = extractExecutiveSummary(doc, 40);
    assert.ok(!summary.includes("#"));
    assert.ok(!summary.includes("**"));
    assert.ok(!summary.includes("*"));
    assert.ok(summary.includes("小驴常用是基于思源笔记块级原子能力的"));
    assert.ok(summary.endsWith("..."));
    assert.ok(summary.length <= 43); // 40 + '...'
});

test("convertIndentation: converts leading indentation between spaces and tabs", () => {
    // 1. 空格转制表符 (spaces-to-tabs, 4 空格 -> 1 Tab)
    const spaceCode = "    function hello() {\n        return 'world';\n    }";
    const tabCode = convertIndentation(spaceCode, "spaces-to-tabs", 4);
    assert.equal(tabCode, "\tfunction hello() {\n\t\treturn 'world';\n\t}");

    // 2. 制表符转空格 (tabs-to-spaces, 1 Tab -> 4 空格)
    const backToSpaces = convertIndentation(tabCode, "tabs-to-spaces", 4);
    assert.equal(backToSpaces, spaceCode);
});

test("Summary macro: dynamic placeholder expansion for executive summary", () => {
    const now = new Date(2026, 9, 28, 12, 0, 0);
    const longArticle = "# 会议纪要\n---\n今天下午团队召开了产品研发周会，重点确认了性能门禁与安全策略的落地进展。";

    // 1. 指定长度截断
    const tpl1 = "摘要：{{xlc:summary|20|" + longArticle + "}}";
    const res1 = applyPlaceholders(tpl1, now, true);
    assert.ok(res1.includes("今天下午团队召开了产品研发周会"));
    assert.ok(res1.endsWith("..."));

    // 2. 直接调用 resolveSummaryArg
    const directRes = resolveSummaryArg("第一段核心文字内容", "10");
    assert.equal(directRes, "第一段核心文字内容");
});
