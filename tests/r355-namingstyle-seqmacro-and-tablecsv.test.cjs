"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    convertIdentifierNamingStyle,
    generateNumericSequence,
    markdownTableToDelimited,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveSeqArg,
} = entry.placeholders;

test("convertIdentifierNamingStyle: converts between naming styles and preserves affixes/indentation", () => {
    // 1. 下划线/中划线转驼峰与帕斯卡
    const snakeInput = `
user_first_name
order_item_id
total_amount
`.trim();

    const camelRes = convertIdentifierNamingStyle(snakeInput, "camel");
    assert.equal(camelRes, "userFirstName\norderItemId\ntotalAmount");

    const pascalRes = convertIdentifierNamingStyle(snakeInput, "pascal");
    assert.equal(pascalRes, "UserFirstName\nOrderItemId\nTotalAmount");

    // 2. 驼峰转蛇形与常量大写
    const camelInput = `
customerAddressInfo
maxRetryCount
`.trim();

    const snakeRes = convertIdentifierNamingStyle(camelInput, "snake");
    assert.equal(snakeRes, "customer_address_info\nmax_retry_count");

    const constantRes = convertIdentifierNamingStyle(camelInput, "constant");
    assert.equal(constantRes, "CUSTOMER_ADDRESS_INFO\nMAX_RETRY_COUNT");

    // 3. 转短横线 (kebab-case)
    assert.equal(convertIdentifierNamingStyle("activeTabPane", "kebab"), "active-tab-pane");

    // 4. 保护前导与尾随下划线（私有成员、魔术方法）
    assert.equal(convertIdentifierNamingStyle("_privateProperty", "snake"), "_private_property");
    assert.equal(convertIdentifierNamingStyle("__init__", "camel"), "__init__");
    assert.equal(convertIdentifierNamingStyle("$stateRef", "snake"), "$state_ref");

    // 5. 保留缩进结构
    const indented = "    const user_name = 1;";
    assert.ok(convertIdentifierNamingStyle(indented, "camel").startsWith("    "));
});

test("generateNumericSequence: generates sequences with steps, padding, and custom delimiters", () => {
    // 1. 基础递增与递减序列
    assert.equal(generateNumericSequence(1, 5), "1, 2, 3, 4, 5");
    assert.equal(generateNumericSequence(5, 1), "5, 4, 3, 2, 1");

    // 2. 自定义步长 (step)
    assert.equal(generateNumericSequence(1, 9, {step: 2}), "1, 3, 5, 7, 9");

    // 3. 前导零补齐 (padWidth)
    assert.equal(generateNumericSequence(1, 4, {padWidth: 3}), "001, 002, 003, 004");

    // 4. 自定义分隔符 (delimiter) 与前后缀
    assert.equal(generateNumericSequence(1, 3, {delimiter: "\n"}), "1\n2\n3");
    assert.equal(generateNumericSequence(1, 3, {delimiter: "; ", prefix: "ID-", suffix: "x"}), "ID-1x; ID-2x; ID-3x");

    // 5. 极端防死循环与单项
    assert.equal(generateNumericSequence(5, 5), "5");
});

test("{{xlc:seq}}: dynamic placeholder macro evaluates numeric sequences", () => {
    const now = new Date("2026-10-29T12:00:00");

    // 1. 基础序列
    assert.equal(applyPlaceholders("{{xlc:seq|1|5}}", now, true), "1, 2, 3, 4, 5");

    // 2. 步长与倒序
    assert.equal(applyPlaceholders("{{xlc:seq|1|10|2}}", now, true), "1, 3, 5, 7, 9");
    assert.equal(applyPlaceholders("{{xlc:seq|5|1}}", now, true), "5, 4, 3, 2, 1");

    // 3. 换行模式 (line)
    assert.equal(applyPlaceholders("{{xlc:seq:line|1|3}}", now, true), "1\n2\n3");
    assert.equal(applyPlaceholders("{{xlc:seq|line|1|3}}", now, true), "1\n2\n3");

    // 4. 定宽补齐模式 (pad)
    assert.equal(applyPlaceholders("{{xlc:seq:pad|1|3|3}}", now, true), "001, 002, 003");
});

test("markdownTableToDelimited: converts markdown tables to standard CSV and TSV", () => {
    const mdTable = `
| 姓名 | 年龄 | 城市 | 说明 |
| :--- | :---: | ---: | --- |
| Alice | 25 | "New York", NY | Regular user |
| Bob | 30 | London | VIP member |
`.trim();

    // 1. 转换为 RFC 4180 CSV（含逗号和双引号的单元格自动转义包裹）
    const csv = markdownTableToDelimited(mdTable, "csv");
    const lines = csv.split("\n");
    assert.equal(lines.length, 3);
    assert.equal(lines[0], "姓名,年龄,城市,说明");
    assert.equal(lines[1], 'Alice,25,"""New York"", NY",Regular user');
    assert.equal(lines[2], "Bob,30,London,VIP member");

    // 2. 转换为 TSV
    const tsv = markdownTableToDelimited(mdTable, "tsv");
    const tsvLines = tsv.split("\n");
    assert.equal(tsvLines.length, 3);
    assert.equal(tsvLines[0], "姓名\t年龄\t城市\t说明");
    assert.equal(tsvLines[2], "Bob\t30\tLondon\tVIP member");

    // 3. 非表格文本容错返回
    const plainText = "只是普通的一段话";
    assert.equal(markdownTableToDelimited(plainText), plainText);
});
