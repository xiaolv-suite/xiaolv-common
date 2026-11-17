"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    diffLinesQuick,
    convertColorFormat,
    humanizeIdentifier,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveColorArg,
} = entry.placeholders;

test("diffLinesQuick: generates line-level unified diff between text A and text B", () => {
    const textA = [
        "第一行不变",
        "第二行将被修改",
        "第三行将被删除",
    ].join("\n");

    const textB = [
        "第一行不变",
        "第二行修改完成",
        "第四行全新添加",
    ].join("\n");

    const diff = diffLinesQuick(textA, textB);
    assert.equal(diff.unchangedCount, 1);
    assert.equal(diff.removedCount, 2);
    assert.equal(diff.addedCount, 2);
    assert.ok(diff.diffResult.includes("  第一行不变"));
    assert.ok(diff.diffResult.includes("- 第二行将被修改"));
    assert.ok(diff.diffResult.includes("+ 第二行修改完成"));
    assert.ok(diff.diffResult.includes("+ 第四行全新添加"));
});

test("convertColorFormat: converts between HEX, RGB, and HSL color formats", () => {
    // 1. 6 位与 3 位 HEX -> RGB
    assert.equal(convertColorFormat("#1E88E5", "rgb"), "rgb(30, 136, 229)");
    assert.equal(convertColorFormat("#fff", "rgb"), "rgb(255, 255, 255)");

    // 2. RGB -> HEX
    assert.equal(convertColorFormat("rgb(255, 0, 128)", "hex"), "#FF0080");

    // 3. HEX -> HSL
    assert.equal(convertColorFormat("#ff0000", "hsl"), "hsl(0, 100%, 50%)");

    // 4. 非法格式容错原样返回
    assert.equal(convertColorFormat("not-a-color"), "not-a-color");
});

test("humanizeIdentifier: converts camelCase, snake_case, and kebab-case to readable phrases", () => {
    // 1. camelCase -> Words
    assert.equal(humanizeIdentifier("getUserProfileById"), "Get User Profile By Id");

    // 2. snake_case -> Words
    assert.equal(humanizeIdentifier("user_auth_token"), "User Auth Token");

    // 3. kebab-case -> Words
    assert.equal(humanizeIdentifier("api-gateway-service"), "Api Gateway Service");

    // 4. 不首字母大写
    assert.equal(humanizeIdentifier("get_user_name", {capitalize: false}), "get user name");
});

test("Color macro: dynamic placeholder expansion for color conversions", () => {
    const now = new Date(2026, 9, 28, 12, 0, 0);

    // 1. 冒号子命令转 RGB
    const tpl1 = "背景色：{{xlc:color:rgb|#ffffff}}";
    const res1 = applyPlaceholders(tpl1, now, true);
    assert.equal(res1, "背景色：rgb(255, 255, 255)");

    // 2. 管道指定目标格式转 HEX
    const tpl2 = "十六进制：{{xlc:color|hex|rgb(0, 0, 0)}}";
    const res2 = applyPlaceholders(tpl2, now, true);
    assert.equal(res2, "十六进制：#000000");

    // 3. 直接调用 resolveColorArg
    assert.equal(resolveColorArg("#00ff00", "rgb"), "rgb(0, 255, 0)");
    assert.equal(resolveColorArg(""), null);
});
