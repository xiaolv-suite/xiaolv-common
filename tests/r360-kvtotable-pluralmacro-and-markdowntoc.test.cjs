"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    keyValueToMarkdownTable,
    pluralizeText,
    generateMarkdownToc,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolvePluralArg,
} = entry.placeholders;

test("keyValueToMarkdownTable: converts key-value text and JSON objects into Markdown tables", () => {
    // 1. 普通冒号/等号键值对行
    const kvText = `
name: SiYuan
version: 3.8.4
author = xiaolv-suite
status -> active
`.trim();

    const table = keyValueToMarkdownTable(kvText);
    const lines = table.split("\n");
    assert.equal(lines[0], "| 键名 | 取值 |");
    assert.equal(lines[1], "| :--- | :--- |");
    assert.equal(lines[2], "| name | SiYuan |");
    assert.equal(lines[3], "| version | 3.8.4 |");
    assert.equal(lines[4], "| author | xiaolv-suite |");
    assert.equal(lines[5], "| status | active |");

    // 2. JSON 对象转表格
    const jsonText = JSON.stringify({host: "127.0.0.1", port: 6806});
    const jsonTable = keyValueToMarkdownTable(jsonText, {keyHeader: "Field", valueHeader: "Config"});
    assert.ok(jsonTable.includes("| Field | Config |"));
    assert.ok(jsonTable.includes("| host | 127.0.0.1 |"));
    assert.ok(jsonTable.includes("| port | 6806 |"));

    // 3. 转义管道符
    const pipeText = "expr: a | b";
    const pipeTable = keyValueToMarkdownTable(pipeText);
    assert.ok(pipeTable.includes("| expr | a \\| b |"));
});

test("{{xlc:plural}}: dynamic placeholder macro evaluates English singular/plural rules", () => {
    const now = new Date("2026-10-29T12:00:00");

    // 1. 默认转复数
    assert.equal(applyPlaceholders("{{xlc:plural|item}}", now, true), "items");
    assert.equal(applyPlaceholders("{{xlc:plural|box}}", now, true), "boxes");
    assert.equal(applyPlaceholders("{{xlc:plural|category}}", now, true), "categories");
    assert.equal(applyPlaceholders("{{xlc:plural|knife}}", now, true), "knives");
    assert.equal(applyPlaceholders("{{xlc:plural|person}}", now, true), "people");

    // 2. 根据数量动态判定 (数量为 1 时单数，其余复数)
    assert.equal(applyPlaceholders("{{xlc:plural|item|1}}", now, true), "item");
    assert.equal(applyPlaceholders("{{xlc:plural|item|0}}", now, true), "items");
    assert.equal(applyPlaceholders("{{xlc:plural|item|3}}", now, true), "items");
    assert.equal(applyPlaceholders("{{xlc:plural|person|1}}", now, true), "person");
    assert.equal(applyPlaceholders("{{xlc:plural|person|4}}", now, true), "people");

    // 3. 冒号子参数指定转单数 (singular)
    assert.equal(applyPlaceholders("{{xlc:plural:singular|categories}}", now, true), "category");
    assert.equal(applyPlaceholders("{{xlc:plural:singular|people}}", now, true), "person");
});

test("generateMarkdownToc: extracts outline TOC with nested levels, anchor slugs, and ignores code blocks", () => {
    const mdContent = `
# 项目概述
这里是正文介绍。

## 快速上手
\`\`\`bash
# 这是代码注释，绝不可被提取为大纲标题
npm install
\`\`\`

### 安装配置
配置说明。

## 核心架构
架构设计。
`.trim();

    // 1. 无序列表大纲
    const toc = generateMarkdownToc(mdContent);
    const lines = toc.split("\n");
    assert.equal(lines.length, 4);
    assert.equal(lines[0], "- [项目概述](#项目概述)");
    assert.equal(lines[1], "  - [快速上手](#快速上手)");
    assert.equal(lines[2], "    - [安装配置](#安装配置)");
    assert.equal(lines[3], "  - [核心架构](#核心架构)");

    // 2. 有序列表大纲
    const orderedToc = generateMarkdownToc(mdContent, {style: "ordered"});
    assert.ok(orderedToc.includes("1. [项目概述](#项目概述)"));
    assert.ok(orderedToc.includes("  1. [快速上手](#快速上手)"));

    // 3. 指定层级过滤 (minLevel: 2, maxLevel: 2 仅提取二级标题)
    const h2Only = generateMarkdownToc(mdContent, {minLevel: 2, maxLevel: 2});
    const h2Lines = h2Only.split("\n");
    assert.equal(h2Lines.length, 2);
    assert.equal(h2Lines[0], "- [快速上手](#快速上手)");
    assert.equal(h2Lines[1], "- [核心架构](#核心架构)");
});
