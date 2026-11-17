"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    extractColumnFromLines,
    pickWeightedOption,
    pluralizeText,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveChooseArg,
} = entry.placeholders;

test("extractColumnFromLines: extracts specified column across multi-line text", () => {
    const tableData = [
        "101\tAlice\tAdmin",
        "102\tBob\tEngineer",
        "103\tCharlie\tDesigner",
    ].join("\n");

    // 1. 提取第 1 列 (ID)
    const col1 = extractColumnFromLines(tableData, 1);
    assert.equal(col1, "101\n102\n103");

    // 2. 提取第 2 列 (Name)
    const col2 = extractColumnFromLines(tableData, 2);
    assert.equal(col2, "Alice\nBob\nCharlie");

    // 3. 提取第 3 列 (Role)
    const col3 = extractColumnFromLines(tableData, 3);
    assert.equal(col3, "Admin\nEngineer\nDesigner");

    // 4. 自定义逗号分隔符
    const csvData = "apple, 10, red\nbanana, 20, yellow";
    const csvCol2 = extractColumnFromLines(csvData, 2, ",");
    assert.equal(csvCol2, "10\n20");
});

test("pickWeightedOption: picks options according to relative weights", () => {
    // 1. 单项 100% 命中
    assert.equal(pickWeightedOption("唯一选项:100"), "唯一选项");

    // 2. 多项加权抽样命中有效项
    const pool = "方案A:80, 方案B:20";
    const picked = pickWeightedOption(pool);
    assert.ok(picked === "方案A" || picked === "方案B");

    // 3. 无权重标记等概率退化
    const unweighted = "红, 绿, 蓝";
    const pickedUnweighted = pickWeightedOption(unweighted);
    assert.ok(["红", "绿", "蓝"].includes(pickedUnweighted));

    // 4. 非法输入返回 null
    assert.equal(pickWeightedOption(""), null);
});

test("pluralizeText: converts English nouns between singular and plural forms", () => {
    // 1. 常规复数 -s, -es, -ies, -ves
    assert.equal(pluralizeText("apple", "plural"), "apples");
    assert.equal(pluralizeText("box", "plural"), "boxes");
    assert.equal(pluralizeText("city", "plural"), "cities");
    assert.equal(pluralizeText("life", "plural"), "lives");

    // 2. 不规则复数
    assert.equal(pluralizeText("child", "plural"), "children");
    assert.equal(pluralizeText("person", "plural"), "people");

    // 3. 单数还原 singular
    assert.equal(pluralizeText("apples", "singular"), "apple");
    assert.equal(pluralizeText("children", "singular"), "child");
    assert.equal(pluralizeText("cities", "singular"), "city");
    assert.equal(pluralizeText("lives", "singular"), "life");

    // 4. 首字母大写保持
    assert.equal(pluralizeText("Apple", "plural"), "Apples");
    assert.equal(pluralizeText("Children", "singular"), "Child");
});

test("Choose macro: dynamic placeholder expansion for weighted option picking", () => {
    const now = new Date(2026, 9, 28, 12, 0, 0);

    // 1. 动态宏展开
    const tpl1 = "分配客服：{{xlc:choose|专员A:100}}";
    const res1 = applyPlaceholders(tpl1, now, true);
    assert.equal(res1, "分配客服：专员A");

    // 2. 加权候选
    const tpl2 = "优先级：{{xlc:choose|高:90, 低:10}}";
    const res2 = applyPlaceholders(tpl2, now, true);
    assert.ok(res2 === "优先级：高" || res2 === "优先级：低");

    // 3. 直接调用 resolveChooseArg
    assert.equal(resolveChooseArg("固定:10"), "固定");
    assert.equal(resolveChooseArg(""), null);
});
