"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    normalizeSmartQuotes,
    interleaveLines,
    convertObjectKeysCase,
} = entry.clipboardCleaner;

test("normalizeSmartQuotes: converts quotes between straight, curly, and corner brackets", () => {
    // 1. 直引号规范化 (straight)
    const rawQuotes = "他说：“这是‘重要’事情”，还有「书名」与『篇目』。";
    const straight = normalizeSmartQuotes(rawQuotes, "straight");
    assert.equal(straight, '他说："这是\'重要\'事情"，还有"书名"与"篇目"。');

    // 2. 中文规范双弯引号 (curly)
    const rawStraight = '他说："这是\'重要\'事情"';
    const curly = normalizeSmartQuotes(rawStraight, "curly");
    assert.equal(curly, "他说：“这是‘重要’事情”");

    // 3. 直角引号规范化 (corner)
    const corner = normalizeSmartQuotes(rawStraight, "corner");
    assert.equal(corner, "他说：「这是『重要』事情」");
});

test("interleaveLines: merges two multi-line lists alternating line by line", () => {
    const questions = "问题 1\n问题 2\n问题 3";
    const answers = "答案 1\n答案 2\n答案 3";

    // 1. 等长行交替合并
    const interleaved = interleaveLines(questions, answers);
    const expected = "问题 1\n答案 1\n问题 2\n答案 2\n问题 3\n答案 3";
    assert.equal(interleaved, expected);

    // 2. 不等长多行合并 (默认保留多余行)
    const shortA = "A1\nA2";
    const longB = "B1\nB2\nB3\nB4";
    const resKeep = interleaveLines(shortA, longB, {keepExceeding: true});
    assert.equal(resKeep, "A1\nB1\nA2\nB2\nB3\nB4");

    // 3. 不等长多行合并 (截断多余行)
    const resTrunc = interleaveLines(shortA, longB, {keepExceeding: false});
    assert.equal(resTrunc, "A1\nB1\nA2\nB2");
});

test("convertObjectKeysCase: transforms object keys across camel, snake, and kebab styles", () => {
    // 1. JSON 嵌套对象转驼峰 (camelCase)
    const jsonSnake = JSON.stringify({
        user_name: "Alice",
        user_age: 28,
        contact_info: {
            mobile_phone: "13800000000",
            postal_code: "100000",
        },
    });

    const resCamel = convertObjectKeysCase(jsonSnake, "camel");
    const parsedCamel = JSON.parse(resCamel);
    assert.equal(parsedCamel.userName, "Alice");
    assert.equal(parsedCamel.userAge, 28);
    assert.equal(parsedCamel.contactInfo.mobilePhone, "13800000000");
    assert.equal(parsedCamel.contactInfo.postalCode, "100000");

    // 2. JSON 对象转蛇形 (snake_case)
    const jsonCamel = JSON.stringify({
        firstName: "Bob",
        orderId: 101,
    });
    const resSnake = convertObjectKeysCase(jsonCamel, "snake");
    const parsedSnake = JSON.parse(resSnake);
    assert.equal(parsedSnake.first_name, "Bob");
    assert.equal(parsedSnake.order_id, 101);

    // 3. Properties 文本行键名转换
    const props = "user_id: 1001\nuser_token=abc_xyz\nis_admin: true";
    const resProps = convertObjectKeysCase(props, "camel");
    assert.equal(resProps, "userId: 1001\nuserToken=abc_xyz\nisAdmin: true");
});
