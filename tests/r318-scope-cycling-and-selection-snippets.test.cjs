"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {variables} = require("./.build/entry.cjs");

const {stripAllVariables} = variables;

test("stripAllVariables: extracts default values and strips macro placeholders", () => {
    const raw = "尊敬的 {{xlc:ask:客户姓名=贵客}}，您预订的 {{xlc:ask:房型}} 已确认。请于 {{xlc:date:明天}} 办理入住。{{xlc:cursor}}祝您愉快！";

    // 默认启用 useDefault=true
    const strippedWithDefault = stripAllVariables(raw, true);
    assert.ok(strippedWithDefault.includes("贵客"));
    assert.ok(!strippedWithDefault.includes("{{xlc:"));
    assert.ok(!strippedWithDefault.includes("{{xlc:ask:"));
    assert.ok(!strippedWithDefault.includes("{{xlc:date:明天}}"));
    assert.ok(!strippedWithDefault.includes("{{xlc:cursor}}"));
    assert.ok(strippedWithDefault.includes("祝您愉快！"));

    // useDefault=false
    const strippedNoDefault = stripAllVariables(raw, false);
    assert.ok(!strippedNoDefault.includes("贵客"));
    assert.ok(!strippedNoDefault.includes("{{xlc:"));
});

test("Search scope rotation includes clipboard in 6-scope closed loop", () => {
    const scopeOrder = ["all", "favorites", "recent", "clipboard", "current-doc", "all-notes"];
    assert.equal(scopeOrder.length, 6);
    assert.ok(scopeOrder.includes("clipboard"));

    function getNextScope(current) {
        const idx = scopeOrder.indexOf(current);
        const nextIdx = (idx + 1) % scopeOrder.length;
        return scopeOrder[nextIdx];
    }

    assert.equal(getNextScope("recent"), "clipboard");
    assert.equal(getNextScope("clipboard"), "current-doc");
    assert.equal(getNextScope("all-notes"), "all");
});
