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
    parseMarkdownBlocks,
    renderSafePreview,
} = entry.previewRenderer;

test("beautifyMarkdownTable: pads header columns when header has fewer cells than body rows", () => {
    // 表头仅2列，数据行有3列
    const rawTable = `
| 标题 | 分类 |
| --- | --- |
| 项目A | 研发 | 补充说明列 |
`.trim();

    const beautified = beautifyMarkdownTable(rawTable);
    const lines = beautified.split("\n");
    assert.equal(lines.length, 3);

    // 表头和分隔行都必须扩展补齐至3列，杜绝破损不对齐
    const headerCols = lines[0].split(/(?<!\\)\|/).slice(1, -1).map((s) => s.trim());
    const sepCols = lines[1].split(/(?<!\\)\|/).slice(1, -1).map((s) => s.trim());
    const bodyCols = lines[2].split(/(?<!\\)\|/).slice(1, -1).map((s) => s.trim());

    assert.equal(headerCols.length, 3);
    assert.equal(sepCols.length, 3);
    assert.equal(bodyCols.length, 3);
    assert.equal(headerCols[0], "标题");
    assert.equal(headerCols[1], "分类");
    assert.equal(headerCols[2], ""); // 自动补齐空列
    assert.equal(bodyCols[2], "补充说明列");
});

test("queryJsonPath: strips quotes inside bracket access and defends against prototype pollution", () => {
    const data = {
        users: [
            { id: 101, "first name": "John", status: "active" },
            { id: 102, "first name": "Sarah", status: "pending" },
        ],
        settings: {
            "api.key": "sk-123456",
        },
    };
    const jsonStr = JSON.stringify(data);

    // 1. 带单双引号的方括号访问语法
    assert.equal(queryJsonPath(jsonStr, 'users[0]["first name"]'), "John");
    assert.equal(queryJsonPath(jsonStr, "users[1]['first name']"), "Sarah");
    assert.equal(queryJsonPath(jsonStr, 'settings["api.key"]'), "sk-123456");
    assert.equal(queryJsonPath(jsonStr, 'users["length"]'), "2");

    // 2. 原型链穿透攻击防御（不得泄露 JS 原生函数）
    assert.equal(queryJsonPath(jsonStr, "toString", { fallback: "SAFE" }), "SAFE");
    assert.equal(queryJsonPath(jsonStr, "constructor", { fallback: "SAFE" }), "SAFE");
    assert.equal(queryJsonPath(jsonStr, "__proto__", { fallback: "SAFE" }), "SAFE");
    assert.equal(queryJsonPath(jsonStr, "users.toString", { fallback: "SAFE" }), "SAFE");
});

test("formatMarkdownCallout: gracefully tolerates leading blank lines for wrapping and stripping", () => {
    const textWithLeadingBlanks = `\n\n  \n> [!WARNING] 权限变更注意\n> 修改管理员权限需二次验证。`;

    // 1. 剥离测试（能容错前置空行精准定位并剥离 Callout 头部）
    const stripped = formatMarkdownCallout(textWithLeadingBlanks, "WARNING", { strip: true });
    assert.ok(stripped.includes("> **权限变更注意**"));
    assert.ok(!stripped.includes("[!WARNING]"));

    // 2. 包装测试（容错前置空行）
    const rawToWrap = `\n\n第一行正文\n第二行正文`;
    const wrapped = formatMarkdownCallout(rawToWrap, "TIP", { title: "核心技巧" });
    assert.ok(wrapped.startsWith("> [!TIP] 核心技巧"));
    assert.ok(wrapped.includes("> 第一行正文"));
    assert.ok(wrapped.includes("> 第二行正文"));
});

test("previewRenderer: structures and renders callouts with semantic badges and icons", () => {
    const calloutMarkdown = `> [!NOTE] 部署提醒\n> 请在发布前核对环境变量。\n> 确保数据库已初始化。`;

    // 1. 解析块
    const blocks = parseMarkdownBlocks(calloutMarkdown);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].type, "callout");
    assert.equal(blocks[0].calloutType, "NOTE");
    assert.equal(blocks[0].calloutTitle, "部署提醒");
    assert.equal(blocks[0].calloutBodyLines.length, 2);

    // 2. 模拟 DOM 渲染
    const fakeDoc = {
        createElement(tag) {
            return {
                tagName: tag.toUpperCase(),
                className: "",
                textContent: "",
                style: {},
                children: [],
                appendChild(child) {
                    this.children.push(child);
                    return child;
                },
            };
        },
        createTextNode(text) {
            return { text };
        },
    };

    const container = fakeDoc.createElement("div");
    renderSafePreview(container, calloutMarkdown, "text", fakeDoc);

    assert.equal(container.children.length, 1);
    const card = container.children[0];
    assert.ok(card.className.includes("xlc-md-callout"));
    assert.ok(card.className.includes("xlc-md-callout--note"));
    assert.equal(card.children.length, 2); // header and body

    const header = card.children[0];
    assert.equal(header.className, "xlc-md-callout-header");
    const icon = header.children[0];
    assert.equal(icon.textContent, "💡");
    const title = header.children[1];
    assert.equal(title.textContent, "部署提醒");
});
