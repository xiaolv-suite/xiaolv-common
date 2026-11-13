"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
    transfer,
} = require("./.build/entry.cjs");

const {
    buildBundle,
    serializeCompactBundle,
    deserializeCompactBundle,
    COMPACT_BUNDLE_PREFIX,
} = transfer;

test("Compact Bundle: single item serialization and deserialization fidelity", () => {
    const item = {
        id: "xlc-share0001",
        itemType: "markdown",
        title: "会议纪要模板",
        alias: "hyjy",
        tags: ["商务", "会议"],
        category: "工作模板",
        source: {sourceType: "manual"},
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
    };
    const kramdownText = "### 会议纪要\n- 主题：{{xlc:ask:主题}}\n- 时间：{{xlc:date}}";
    const kramdowns = new Map([[item.id, kramdownText]]);

    // 1. 生成单条 Bundle 并序列化
    const bundle = buildBundle([item], kramdowns, 1700000000000);
    const shareCode = serializeCompactBundle(bundle);

    assert.ok(typeof shareCode === "string" && shareCode.startsWith(COMPACT_BUNDLE_PREFIX));

    // 2. 反序列化
    const deserialized = deserializeCompactBundle(shareCode);
    assert.ok(deserialized !== null);
    assert.equal(deserialized.items.length, 1);

    const importedItem = deserialized.items[0];
    assert.equal(importedItem.id, item.id);
    assert.equal(importedItem.title, item.title);
    assert.equal(importedItem.alias, item.alias);
    assert.deepEqual(importedItem.tags, item.tags);
    assert.equal(importedItem.category, item.category);
    assert.equal(importedItem.kramdown, kramdownText);
});

test("Search box compact bundle sniffer detects valid share links and safely rejects invalid ones", () => {
    function detectShareBundle(query) {
        const text = (query || "").trim();
        if (text.startsWith(COMPACT_BUNDLE_PREFIX) || text.startsWith("xlc://import?")) {
            const compact = deserializeCompactBundle(text);
            if (compact && compact.items && compact.items.length > 0) {
                return {
                    isShareLink: true,
                    itemCount: compact.items.length,
                    firstTitle: compact.items[0]?.title || "",
                };
            }
        }
        return {isShareLink: false, itemCount: 0, firstTitle: ""};
    }

    const testItem = {
        id: "xlc-test1",
        itemType: "text",
        title: "快捷回复",
        source: {sourceType: "manual"},
    };
    const testKramdowns = new Map([[testItem.id, "感谢您的来信！"]]);
    const testBundle = buildBundle([testItem], testKramdowns, Date.now());
    const validCode = serializeCompactBundle(testBundle);

    // 1. 合法分享码
    const res1 = detectShareBundle(validCode);
    assert.equal(res1.isShareLink, true);
    assert.equal(res1.itemCount, 1);
    assert.equal(res1.firstTitle, "快捷回复");

    // 2. URL 协议形式
    const urlProtocolCode = validCode.replace("xlc-bundle:", "xlc://import?bundle=");
    const res2 = detectShareBundle(urlProtocolCode);
    assert.equal(res2.isShareLink, true);
    assert.equal(res2.itemCount, 1);
    assert.equal(res2.firstTitle, "快捷回复");

    // 3. 普通搜索词
    const res3 = detectShareBundle("客服回复");
    assert.equal(res3.isShareLink, false);

    // 4. 损坏的分享码
    const res4 = detectShareBundle("xlc-bundle:not-valid-base64");
    assert.equal(res4.isShareLink, false);
});
