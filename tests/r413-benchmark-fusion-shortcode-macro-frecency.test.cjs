"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const {
    item,
    search,
    variables,
    placeholders,
    previewRenderer,
} = require("./.build/entry.cjs");

const root = path.resolve(__dirname, "..");
const indexScss = fs.readFileSync(path.join(root, "src", "styles", "index.scss"), "utf8");
const dialogTs = fs.readFileSync(path.join(root, "src", "ui", "dialog.ts"), "utf8");

test("T-0741 · 常用条目绑定 :shortcode 极速简码与前缀精准命中", () => {
    // 1. cleanShortcode 规范化
    assert.equal(item.cleanShortcode(":wk"), ":wk");
    assert.equal(item.cleanShortcode("wk"), ":wk");
    assert.equal(item.cleanShortcode("  :BUG  "), ":bug");
    assert.equal(item.cleanShortcode(""), "");
    assert.equal(item.cleanShortcode(null), "");

    // 2. normalizeCommonItem 保留 shortcode
    const normalized = item.normalizeCommonItem({
        blockId: "20261031100000-aaaaaaa",
        libraryDocId: "20261031100000-bbbbbbb",
        attrs: {
            "custom-xlc-id": "xlc-2026103101abcdef1234",
            "custom-xlc-title": "周报框架",
            "custom-xlc-shortcode": ":wk",
        },
    });
    assert.ok(normalized);
    assert.equal(normalized.shortcode, ":wk");

    // 3. calculateShortcodeBoost 极速置顶加权
    const entryWk = {
        id: "xlc-wk0000001",
        blockId: "20261031100000-aaaaaaa",
        libraryDocId: "20261031100000-bbbbbbb",
        itemType: "text",
        title: "周报模板",
        alias: "",
        shortcode: ":wk",
        tags: [],
        category: "",
        summary: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
    assert.equal(search.calculateShortcodeBoost(entryWk, ":wk", [":wk"]), search.SHORTCODE_EXACT_MATCH_BOOST);
    assert.equal(search.calculateShortcodeBoost(entryWk, "wk", ["wk"]), search.SHORTCODE_EXACT_MATCH_BOOST);
    assert.equal(search.calculateShortcodeBoost(entryWk, ":w", [":w"]), search.SHORTCODE_PREFIX_MATCH_BOOST);
    assert.equal(search.calculateShortcodeBoost(entryWk, ":other", [":other"]), 0);

    // 4. findExactShortcodeMatch 唯一匹配
    const entryMtg = {...entryWk, id: "xlc-mtg000001", shortcode: ":mtg", title: "会议纪要"};
    assert.equal(search.findExactShortcodeMatch([entryWk, entryMtg], ":wk")?.id, "xlc-wk0000001");
    assert.equal(search.findExactShortcodeMatch([entryWk, entryMtg], "wk")?.id, "xlc-wk0000001");
    assert.equal(search.findExactShortcodeMatch([entryWk, entryMtg], ":unknown"), null);

    // 存在同名简码歧义时放弃直达
    const entryWkDup = {...entryWk, id: "xlc-wk0000002"};
    assert.equal(search.findExactShortcodeMatch([entryWk, entryWkDup], ":wk"), null);

    // 5. searchEntries 简码查询置顶
    const ctx = {
        favorites: new Set(),
        recents: new Map(),
        now: Date.now(),
    };
    const results = search.searchEntries([entryMtg, entryWk], {text: ":wk"}, ctx);
    assert.equal(results.length, 1);
    assert.equal(results[0]?.entry.id, "xlc-wk0000001");
    assert.equal(results[0]?.matchedBy, "shortcode");
});

test("T-0742 · 宏展开引擎支持 {{cursor}}、{{date+Nd}} 及 {{input:...}} 填空微表单", () => {
    // 1. 光标落点锚定（{{cursor}}, {{xlc:cursor}}, $|$）
    assert.equal(variables.hasCursorToken("开头 {{cursor}} 结尾"), true);
    assert.equal(variables.hasCursorToken("开头 {{xlc:cursor}} 结尾"), true);
    assert.equal(variables.hasCursorToken("开头 $|$ 结尾"), true);
    assert.equal(variables.hasCursorToken("普通文本"), false);

    assert.equal(variables.stripCursorToken("前 {{cursor}} 中 $|$ 后"), "前  中  后");

    const cursorExtracted = variables.extractCursorPosition("前缀内容$|$后缀内容");
    assert.equal(cursorExtracted.cursorOffset, 4);
    assert.equal(cursorExtracted.text, "前缀内容后缀内容");

    // 2. 相对日期偏移 {{date+Nd}} 与格式化
    const FIXED_NOW = new Date(2026, 9, 31, 10, 0, 0); // 2026-10-31
    const offsetPlus7 = placeholders.applyPlaceholders("下周今天：{{date+7d}}", FIXED_NOW, true);
    assert.equal(offsetPlus7, "下周今天：2026-11-07");

    const offsetMinus1 = placeholders.applyPlaceholders("昨天：{{date-1d}}", FIXED_NOW, true);
    assert.equal(offsetMinus1, "昨天：2026-10-30");

    const customFmt = placeholders.applyPlaceholders("排期：{{date:YYYY年MM月DD日}}", FIXED_NOW, true);
    assert.equal(customFmt, "排期：2026年10月31日");

    const weekFmt = placeholders.applyPlaceholders("周次：{{date:gggg-[W]ww}}", FIXED_NOW, true);
    assert.equal(weekFmt, "周次：2026-W44");

    // 3. 交互式微表单 {{input:...}} 与 {{select:...}} / {{choice:...}}
    const formTpl = "项目：{{input:项目名=小驴常用}}\n状态：{{choice:状态:进行中|已完成|阻塞}}\n详情：$|$";
    const askFields = variables.listAskFields(formTpl);
    assert.equal(askFields.length, 2);

    const inputField = askFields.find((f) => f.name === "项目名");
    assert.ok(inputField);
    assert.equal(inputField.kind, "text");
    assert.equal(inputField.defaultValue, "小驴常用");

    const choiceField = askFields.find((f) => f.name === "状态");
    assert.ok(choiceField);
    assert.equal(choiceField.kind, "select");
    assert.deepEqual(choiceField.options, ["进行中", "已完成", "阻塞"]);

    // expandAsks 渲染展开
    const filled = variables.expandAsks(formTpl, {状态: "已完成"});
    assert.equal(filled.includes("项目：小驴常用"), true);
    assert.equal(filled.includes("状态：已完成"), true);
});

test("T-0743 · Frecency 智能热度排序兼顾高频老条目与近期刚用条目", () => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;

    // scoreFrecency 纯函数计算
    const scoreFrequentOld = search.scoreFrecency(50, tenDaysAgo, now); // 50 * 40 = 2000
    const scoreOneOffRecent = search.scoreFrecency(1, oneHourAgo, now);  // 1 * 100 = 100
    assert.ok(scoreFrequentOld > scoreOneOffRecent, "高频老条目热度应显著高于偶发点错一次的近期条目");

    // listByScope 针对 recent 作用域应用 Frecency 排序
    const entryA = {id: "xlc-freq-old", title: "高频老条目", tags: [], createdAt: 0, updatedAt: 0};
    const entryB = {id: "xlc-oneoff-new", title: "偶发新条目", tags: [], createdAt: 0, updatedAt: 0};

    const ctx = {
        favorites: new Set(),
        recents: new Map([
            [entryA.id, tenDaysAgo],
            [entryB.id, oneHourAgo],
        ]),
        usage: new Map([
            [entryA.id, 50],
            [entryB.id, 1],
        ]),
        now,
    };

    const recentList = search.listByScope([entryB, entryA], "recent", ctx);
    assert.equal(recentList.length, 2);
    assert.equal(recentList[0]?.id, "xlc-freq-old", "Frecency 智能排序应使高频条目优先排在偶发条目之上");
});

test("T-0744 · 常用面板选中含宏条目双态实时预览渲染与样式契约", () => {
    // 1. hasDynamicMacros 判定
    assert.equal(variables.hasDynamicMacros("普通文本"), false);
    assert.equal(variables.hasDynamicMacros("今日：{{date+1d}}"), true);
    assert.equal(variables.hasDynamicMacros("填空：{{input:名称}}"), true);
    assert.equal(variables.hasDynamicMacros("光标：$|$"), true);

    // 2. expandMacroPreview 展开真实效果
    const previewText = variables.expandMacroPreview("报告：{{input:标题=默认周报}}\n日期：{{date}}\n落点：$|$");
    assert.equal(previewText.includes("报告：默认周报"), true);
    assert.equal(previewText.includes("$|$"), false);

    // 3. renderDualMacroPreview DOM 结构与 W3C 无障碍语义
    const dummyContainer = {
        textContent: "",
        ownerDocument: {
            createElement: (tag) => {
                const attrs = {};
                const children = [];
                return {
                    tagName: tag.toUpperCase(),
                    className: "",
                    attrs,
                    children,
                    setAttribute: (k, v) => { attrs[k] = v; },
                    getAttribute: (k) => attrs[k],
                    appendChild: (c) => children.push(c),
                };
            },
        },
        appendChild: function(c) { this.children = this.children || []; this.children.push(c); },
    };

    previewRenderer.renderDualMacroPreview(
        dummyContainer,
        "模板源码内容 {{input:test}}",
        "展开后真实效果内容",
        "text",
        {templateSource: "模板源码", expandedEffect: "展开后真实效果"},
    );

    const dualEl = dummyContainer.children[0];
    assert.ok(dualEl);
    assert.equal(dualEl.className, "xlc-preview-dual");
    assert.equal(dualEl.attrs["role"], "region");
    assert.equal(dualEl.attrs["aria-label"], "宏模板源码与展开效果双态实时预览");

    // 4. dialog.ts 源码调用契约
    assert.match(dialogTs, /renderDualMacroPreview\(/);
    assert.match(dialogTs, /hasDynamicMacros\(text\)/);
    assert.match(dialogTs, /expandMacroPreview\(text\)/);
    assert.match(dialogTs, /findExactShortcodeMatch\(this\.results,\s*input\.value\)/);

    // 5. index.scss 样式规范与无硬编码色值
    assert.match(indexScss, /\.xlc-badge--shortcode/);
    assert.match(indexScss, /\.xlc-preview-dual/);
    assert.match(indexScss, /\.xlc-preview-card/);
    assert.match(indexScss, /\.xlc-preview-card-pill[\s\S]*?&--live/);
    assert.match(indexScss, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.xlc-preview-card/);
});
