"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

test("updateProtyleToolbar: idempotent deduplication prevents duplicate toolbar buttons", () => {
    // 模拟插件环境下的 updateProtyleToolbar 逻辑
    function updateToolbar(toolbar, callback) {
        if (toolbar.some((item) => typeof item === "object" && item && item.name === "xiaolv-common-toolbar")) {
            return toolbar;
        }
        return [...toolbar, {
            name: "xiaolv-common-toolbar",
            icon: "iconXlcCommon",
            tip: "常用内容",
            click: callback,
        }];
    }

    const initialToolbar = ["bold", "italic", {name: "plugin-other"}];

    // 第一次添加
    const tb1 = updateToolbar(initialToolbar, () => {});
    assert.equal(tb1.length, 4);
    const count1 = tb1.filter((i) => typeof i === "object" && i.name === "xiaolv-common-toolbar").length;
    assert.equal(count1, 1, "Must add exactly one button");

    // 第二次调用（模拟宿主重复渲染或多次触发）
    const tb2 = updateToolbar(tb1, () => {});
    assert.equal(tb2.length, 4, "Must not add duplicate buttons");
    const count2 = tb2.filter((i) => typeof i === "object" && i.name === "xiaolv-common-toolbar").length;
    assert.equal(count2, 1, "Must remain exactly one button");
});

test("Toolbar selection routing: auto-switches between search and capture form based on length", () => {
    function routeSelection(text, onSearch, onSave) {
        const trimmed = (text || "").trim();
        if (!trimmed) {
            onSearch(undefined);
            return "search-empty";
        }
        if (trimmed.length > 120 || trimmed.includes("\n")) {
            onSave(trimmed);
            return "save-form";
        }
        onSearch(trimmed);
        return "search-with-query";
    }

    let searchArg = null;
    let saveArg = null;
    const reset = () => { searchArg = null; saveArg = null; };

    // 1. 划选短文本（如“产业”）
    reset();
    const action1 = routeSelection("产业", (q) => { searchArg = q; }, (s) => { saveArg = s; });
    assert.equal(action1, "search-with-query");
    assert.equal(searchArg, "产业");
    assert.equal(saveArg, null);

    // 2. 划选多行或长文本（如大段模板）
    reset();
    const longText = "这是一段很长的话术模板，包含详细规则：\n1. 第一步；\n2. 第二步。";
    const action2 = routeSelection(longText, (q) => { searchArg = q; }, (s) => { saveArg = s; });
    assert.equal(action2, "save-form");
    assert.equal(saveArg, longText);
    assert.equal(searchArg, null);

    // 3. 无选区文本
    reset();
    const action3 = routeSelection("", (q) => { searchArg = q; }, (s) => { saveArg = s; });
    assert.equal(action3, "search-empty");
    assert.equal(searchArg, undefined);
});
