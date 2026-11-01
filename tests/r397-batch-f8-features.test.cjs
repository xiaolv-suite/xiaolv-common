"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {storage} = require("./.build/entry.cjs");
const {normalizeState, normalizeMiniPosition} = storage;

test("TODO-FEAT-020: 迷你悬浮条拖拽停留坐标规范化契约 (normalizeMiniPosition)", () => {
    // 1. 合法坐标保真
    const valid = normalizeMiniPosition({x: 320, y: 150});
    assert.deepEqual(valid, {x: 320, y: 150});

    // 2. 浮点数安全取整
    const floatPos = normalizeMiniPosition({x: 100.8, y: 200.2});
    assert.deepEqual(floatPos, {x: 101, y: 200});

    // 3. 越界保护（负数坐标或超出合理屏幕极大值）
    assert.equal(normalizeMiniPosition({x: -50, y: 100}), undefined);
    assert.equal(normalizeMiniPosition({x: 100, y: -20}), undefined);
    assert.equal(normalizeMiniPosition({x: 20000, y: 100}), undefined);

    // 4. 非法类型与空值保护
    assert.equal(normalizeMiniPosition(null), undefined);
    assert.equal(normalizeMiniPosition(undefined), undefined);
    assert.equal(normalizeMiniPosition({x: "100", y: NaN}), undefined);
});

test("TODO-FEAT-021: 迷你模式折叠贴边微型胶囊状态契约 (miniCollapsed)", () => {
    // 1. 默认状态为 false
    const stateDefault = normalizeState({});
    assert.equal(stateDefault.search.miniCollapsed, false);

    // 2. 显式 true 保持
    const stateCollapsed = normalizeState({
        search: {
            miniCollapsed: true,
        },
    });
    assert.equal(stateCollapsed.search.miniCollapsed, true);

    // 3. 非布尔值自动安全回退
    const stateInvalid = normalizeState({
        search: {
            miniCollapsed: "not-a-bool",
        },
    });
    assert.equal(stateInvalid.search.miniCollapsed, false);
});
