"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {placeholders} = require("./.build/entry.cjs");

const {transformCase, splitWords, resolveCaseArg} = placeholders;

test("transformCase: converts between various casing conventions accurately", () => {
    const raw = "user_account_id";

    // 1. 转驼峰 (camelCase)
    assert.equal(transformCase(raw, "camel"), "userAccountId");

    // 2. 转帕斯卡/大驼峰 (PascalCase)
    assert.equal(transformCase(raw, "pascal"), "UserAccountId");

    // 3. 转短横线 (kebab-case)
    assert.equal(transformCase(raw, "kebab"), "user-account-id");

    // 4. 转常量大写 (CONSTANT_CASE)
    assert.equal(transformCase("userAccountId", "constant"), "USER_ACCOUNT_ID");

    // 5. 转下划线 (snake_case)
    assert.equal(transformCase("UserAccountId", "snake"), "user_account_id");
});

test("splitWords: handles mixed alphanumeric, spaces and punctuation", () => {
    const words = splitWords("getHTTPResponseCode200");
    assert.deepEqual(words, ["get", "HTTP", "Response", "Code", "200"]);

    const hyphenated = splitWords("data-table-view");
    assert.deepEqual(hyphenated, ["data", "table", "view"]);
});

test("resolveCaseArg: template macro resolution for casing", () => {
    // {{xlc:case:camel|order_item_list}}
    const res1 = resolveCaseArg("camel|order_item_list");
    assert.equal(res1, "orderItemList");

    // {{xlc:case:snake|orderItemList}}
    const res2 = resolveCaseArg("snake|orderItemList");
    assert.equal(res2, "order_item_list");
});
