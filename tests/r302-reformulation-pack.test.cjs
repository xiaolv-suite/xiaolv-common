"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
    promptPack,
    importMarkdown,
    kramdown,
} = require("./.build/entry.cjs");

const {REFORMULATION_PACK_NAME, REFORMULATION_PACK_MD} = promptPack;
const {parseMarkdownPack} = importMarkdown;
const {bodyWriteRestriction} = kramdown;

test("REFORMULATION_PACK_MD is well-formed and parses into 6 valid items", () => {
    assert.equal(REFORMULATION_PACK_NAME, "渐进反思批判模板包");
    assert.ok(typeof REFORMULATION_PACK_MD === "string" && REFORMULATION_PACK_MD.length > 0);

    const parsed = parseMarkdownPack(REFORMULATION_PACK_MD);
    assert.equal(parsed.pack?.name, "渐进反思批判模板包");
    assert.equal(parsed.items.length, 6, `Expected exactly 6 reformulation items, got ${parsed.items.length}`);
    assert.equal(parsed.issues.length, 0, `Expected 0 parsing issues, got: ${JSON.stringify(parsed.issues)}`);

    const titles = parsed.items.map((i) => i.title);
    assert.ok(titles.some((t) => t.includes("核心论点提炼")));
    assert.ok(titles.some((t) => t.includes("反思质疑批判")));
    assert.ok(titles.some((t) => t.includes("知识网状联结")));
    assert.ok(titles.some((t) => t.includes("现实生活行动")));
    assert.ok(titles.some((t) => t.includes("绝妙金句摘录")));
    assert.ok(titles.some((t) => t.includes("四维一体重述卡片")));

    // 每一条均归类为渐进思考
    for (const item of parsed.items) {
        assert.equal(item.category, "渐进思考");
        assert.ok(item.tags.includes("思考") || item.tags.includes("金句"));
    }
});

test("All 6 reformulation items strictly satisfy B-006 body write restrictions (100% usable)", () => {
    const parsed = parseMarkdownPack(REFORMULATION_PACK_MD);
    assert.equal(parsed.items.length, 6);

    for (const item of parsed.items) {
        const restriction = bodyWriteRestriction(item.kramdown);
        assert.equal(
            restriction,
            undefined,
            `Item "${item.title}" failed B-006 restriction: ${restriction}. Body: ${item.kramdown}`
        );
    }
});
