"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
    promptPack,
    importMarkdown,
    kramdown,
} = require("./.build/entry.cjs");

const {
    TASK_HORIZON_PACK_NAME,
    TASK_HORIZON_PACK_MD,
    CALLOUT_PACK_NAME,
    CALLOUT_PACK_MD,
} = promptPack;
const {parseMarkdownPack} = importMarkdown;
const {bodyWriteRestriction} = kramdown;

test("TASK_HORIZON_PACK_MD: parses into 3 valid SOP items with Task Horizon attributes", () => {
    assert.equal(TASK_HORIZON_PACK_NAME, "Task Horizon SOP 任务清单包");
    assert.ok(typeof TASK_HORIZON_PACK_MD === "string" && TASK_HORIZON_PACK_MD.length > 0);

    const parsed = parseMarkdownPack(TASK_HORIZON_PACK_MD);
    assert.equal(parsed.pack?.name, "Task Horizon SOP 任务清单包");
    assert.equal(parsed.items.length, 3);
    assert.equal(parsed.issues.length, 0);

    for (const item of parsed.items) {
        assert.equal(item.category, "任务清单");
        assert.ok(item.tags.includes("任务") && item.tags.includes("SOP"));
        // 验证含有 Task Horizon 标准属性
        assert.ok(item.kramdown.includes("custom-priority="));
        assert.ok(item.kramdown.includes("custom-status="));
        // 严格符合 B-006
        assert.equal(bodyWriteRestriction(item.kramdown), undefined);
    }
});

test("CALLOUT_PACK_MD: parses into 5 valid Callout items", () => {
    assert.equal(CALLOUT_PACK_NAME, "思源标准 Callout 提示框组件包");
    assert.ok(typeof CALLOUT_PACK_MD === "string" && CALLOUT_PACK_MD.length > 0);

    const parsed = parseMarkdownPack(CALLOUT_PACK_MD);
    assert.equal(parsed.pack?.name, "思源标准 Callout 提示框组件包");
    assert.equal(parsed.items.length, 5);
    assert.equal(parsed.issues.length, 0);

    const calloutKeywords = ["[!NOTE]", "[!TIP]", "[!IMPORTANT]", "[!WARNING]", "[!CAUTION]"];
    for (const kw of calloutKeywords) {
        assert.ok(parsed.items.some((i) => i.kramdown.includes(kw)), `Must contain ${kw}`);
    }

    for (const item of parsed.items) {
        assert.equal(item.category, "提示卡片");
        assert.ok(item.tags.includes("Callout"));
        // 严格符合 B-006
        assert.equal(bodyWriteRestriction(item.kramdown), undefined);
    }
});
