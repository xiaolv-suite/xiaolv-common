"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {calculator} = require("./.build/entry.cjs");

const {evaluateMathExpression, formatCalculationResult} = calculator;

test("evaluateMathExpression: evaluates expressions with prefixes and thousands separators", () => {
    // 1. 带前缀等号 =
    assert.equal(evaluateMathExpression("=100 * 1.13"), "113");
    assert.equal(evaluateMathExpression("= 500 * 0.85"), "425");

    // 2. 带 calc: / 计算：前缀
    assert.equal(evaluateMathExpression("calc: 128 * 8"), "1024");
    assert.equal(evaluateMathExpression("计算：200 + 300"), "500");

    // 3. 千分位逗号数字
    assert.equal(evaluateMathExpression("1,000 * 2.5"), "2500");
    assert.equal(evaluateMathExpression("=10,000 / 4"), "2500");

    // 4. 函数嵌套求值
    assert.equal(evaluateMathExpression("round(50 / 3, 2)"), "16.67");
    assert.equal(evaluateMathExpression("max(10, 25, 8)"), "25");
});

test("evaluateMathExpression: safely rejects invalid and non-math inputs", () => {
    // 非算式普通搜索词
    assert.equal(evaluateMathExpression("客服退款流程"), null);
    assert.equal(evaluateMathExpression("hello world"), null);
    assert.equal(evaluateMathExpression(""), null);

    // 除以零
    assert.equal(evaluateMathExpression("100 / 0"), null);
});

test("formatCalculationResult: trims JavaScript floating point errors", () => {
    // 0.1 + 0.2 在原生 JS 下为 0.30000000000000004
    assert.equal(formatCalculationResult(0.1 + 0.2), "0.3");
});
