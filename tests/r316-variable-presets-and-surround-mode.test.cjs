"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {storage} = require("./.build/entry.cjs");

const {normalizeState} = storage;

test("normalizeState: normalizes and persists variablePresets cleanly", () => {
    const raw = {
        schemaVersion: 2,
        favorites: [],
        recents: [],
        usage: {},
        sort: "manual",
        variablePresets: {
            "xlc-item1": {
                "方案A": {
                    "客户名": "阿里巴巴",
                    "折扣": "8折",
                },
                "方案B": {
                    "客户名": "腾讯",
                    "折扣": "9折",
                },
            },
        },
    };

    const state = normalizeState(raw);
    assert.ok(state.variablePresets);
    assert.equal(typeof state.variablePresets["xlc-item1"], "object");
    assert.deepEqual(state.variablePresets["xlc-item1"]["方案A"], {
        "客户名": "阿里巴巴",
        "折扣": "8折",
    });
    assert.deepEqual(state.variablePresets["xlc-item1"]["方案B"], {
        "客户名": "腾讯",
        "折扣": "9折",
    });

    // 损坏/空输入安全降级为空对象
    const emptyState = normalizeState({schemaVersion: 2});
    assert.deepEqual(emptyState.variablePresets, {});
});

test("Selection surround recognition: detects {{xlc:selection}} in content and summary", () => {
    function hasSelectionToken(entry) {
        return Boolean(entry.content?.includes("{{xlc:selection}}") || entry.summary?.includes("{{xlc:selection}}"));
    }

    const surroundItem = {
        id: "xlc-surround1",
        title: "代码块包裹",
        content: "```typescript\n{{xlc:selection}}\n```",
    };
    assert.equal(hasSelectionToken(surroundItem), true);

    const normalItem = {
        id: "xlc-normal1",
        title: "普通问候",
        content: "您好，欢迎咨询！",
    };
    assert.equal(hasSelectionToken(normalItem), false);
});
