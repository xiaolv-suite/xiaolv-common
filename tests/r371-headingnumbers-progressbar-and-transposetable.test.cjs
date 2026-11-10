"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    numberMarkdownHeadings,
    formatTaskProgressBar,
    transposeMarkdownTable,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveProgressArg,
} = entry.placeholders;

test("numberMarkdownHeadings: numbers hierarchical headings and strips numbers cleanly", () => {
    const rawHeadings = `
# 绪论
正文第一段说明。
## 研究背景
### 国内外现状
## 研究目标
### 预期产出
# 系统设计
## 架构选型
\`\`\`ts
# 这不是标题，是代码注释
const x = 1;
\`\`\`
### 模块拆解
`.trim();

    // 1. 自动编排层级序号
    const numbered = numberMarkdownHeadings(rawHeadings, { mode: "number" });
    const lines = numbered.split("\n");
    assert.equal(lines[0], "# 1. 绪论");
    assert.equal(lines[1], "正文第一段说明。");
    assert.equal(lines[2], "## 1.1 研究背景");
    assert.equal(lines[3], "### 1.1.1 国内外现状");
    assert.equal(lines[4], "## 1.2 研究目标");
    assert.equal(lines[5], "### 1.2.1 预期产出");
    assert.equal(lines[6], "# 2. 系统设计");
    assert.equal(lines[7], "## 2.1 架构选型");
    // 代码块内注释不得被当作标题误编号
    assert.ok(numbered.includes("# 这不是标题，是代码注释"));
    assert.ok(numbered.includes("### 2.1.1 模块拆解"));

    // 2. 幂等性：再次编号不重复产生 1. 1. 绪论
    const reNumbered = numberMarkdownHeadings(numbered, { mode: "number" });
    assert.equal(reNumbered, numbered);

    // 3. 剥离序号
    const stripped = numberMarkdownHeadings(numbered, { mode: "strip" });
    const sLines = stripped.split("\n");
    assert.equal(sLines[0], "# 绪论");
    assert.equal(sLines[2], "## 研究背景");
    assert.equal(sLines[3], "### 国内外现状");
    assert.equal(sLines[4], "## 研究目标");

    // 4. 自定义末尾点号与起始级别
    const customDot = numberMarkdownHeadings(rawHeadings, { mode: "number", trailingDot: true });
    assert.ok(customDot.includes("## 1.1. 研究背景"));
});

test("formatTaskProgressBar and {{xlc:progress}}: generates block, circle and ascii progress indicators", () => {
    // 1. 方块进度条 (block)
    const p1 = formatTaskProgressBar(7, 10);
    assert.ok(p1.includes("[███████░░░]"));
    assert.ok(p1.includes("7/10"));
    assert.ok(p1.includes("70%"));

    // 2. 仅百分比模式
    const p2 = formatTaskProgressBar(80);
    assert.ok(p2.includes("[████████░░]"));
    assert.ok(p2.includes("80%"));

    // 3. 圆点模式 (circle)
    const p3 = formatTaskProgressBar(3, { total: 5, style: "circle" });
    assert.ok(p3.includes("[●●●○○]"));
    assert.ok(p3.includes("3/5"));
    assert.ok(p3.includes("60%"));

    // 4. ASCII 模式
    const p4 = formatTaskProgressBar(4, { total: 10, style: "ascii" });
    assert.ok(p4.includes("[===>      ]"));
    assert.ok(p4.includes("4/10"));
    assert.ok(p4.includes("40%"));

    // 5. 动态宏解析
    assert.equal(resolveProgressArg(""), null);
    const macro1 = applyPlaceholders("任务完成度：{{xlc:progress|7|10}}", new Date(), true);
    assert.ok(macro1.includes("[███████░░░] 7/10 70%"));

    const macro2 = applyPlaceholders("当前进度：{{xlc:progress:circle|3|5}}", new Date(), true);
    assert.ok(macro2.includes("[●●●○○] 3/5 60%"));

    const macro3 = applyPlaceholders("百分比：{{xlc:progress|45}}", new Date(), true);
    assert.ok(macro3.includes("45%"));
});

test("transposeMarkdownTable: transposes markdown table rows into columns and vice versa", () => {
    const table = `
| 季度 | 收入 | 支出 |
| :--- | :--- | :--- |
| Q1 | 100 | 80 |
| Q2 | 120 | 85 |
`.trim();

    // 1. 转置矩阵
    const transposed = transposeMarkdownTable(table);
    const tLines = transposed.split("\n");
    assert.equal(tLines[0], "| 季度 | Q1 | Q2 |");
    assert.equal(tLines[1], "| :--- | :--- | :--- |");
    assert.equal(tLines[2], "| 收入 | 100 | 120 |");
    assert.equal(tLines[3], "| 支出 | 80 | 85 |");

    // 2. 再次转置恢复原矩阵 (M^TT = M)
    const doubleTransposed = transposeMarkdownTable(transposed);
    const dLines = doubleTransposed.split("\n");
    assert.equal(dLines[0], "| 季度 | 收入 | 支出 |");
    assert.equal(dLines[1], "| :--- | :--- | :--- |");
    assert.equal(dLines[2], "| Q1 | 100 | 80 |");
    assert.equal(dLines[3], "| Q2 | 120 | 85 |");

    // 3. 自定义居中对齐
    const centerT = transposeMarkdownTable(table, { alignment: "center" });
    assert.ok(centerT.includes("| :---: | :---: | :---: |"));

    // 4. 空值与非表格兼容
    assert.equal(transposeMarkdownTable(""), "");
    assert.equal(transposeMarkdownTable("非表格普通单行文本"), "非表格普通单行文本");
});
