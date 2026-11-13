"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {search, omniSearch} = require("./.build/entry.cjs");
const {calculateFrecencyScore, searchEntries} = search;
const {fetchAdjacentBlocks} = omniSearch;

test("calculateFrecencyScore: 阶梯时间衰减与频次权重计算", () => {
    const now = 1000000000000;
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;

    // 1. 当天内（<= 1天）：权重 100
    assert.equal(calculateFrecencyScore(5, now - 2 * oneHour, now), 500);

    // 2. 一周内（<= 7天）：权重 70
    assert.equal(calculateFrecencyScore(5, now - 3 * oneDay, now), 350);

    // 3. 一月内（<= 30天）：权重 40
    assert.equal(calculateFrecencyScore(5, now - 15 * oneDay, now), 200);

    // 4. 一季内（<= 90天）：权重 20
    assert.equal(calculateFrecencyScore(5, now - 45 * oneDay, now), 100);

    // 5. 远古/无记录：权重 5
    assert.equal(calculateFrecencyScore(5, now - 120 * oneDay, now), 25);
    assert.equal(calculateFrecencyScore(5, 0, now), 25);
    assert.equal(calculateFrecencyScore(0, now, now), 0);
});

test("searchEntries: frecency 排序使近期高频条目自然排在远期条目之前", () => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    const entries = [
        {
            id: "xlc-old-frequent",
            title: "半年前的老条目",
            summary: "老条目",
            itemType: "text",
            tags: [],
            category: "",
            createdAt: now - 200 * oneDay,
            updatedAt: now - 200 * oneDay,
        },
        {
            id: "xlc-recent-active",
            title: "今天的新条目",
            summary: "新条目",
            itemType: "text",
            tags: [],
            category: "",
            createdAt: now - oneDay,
            updatedAt: now - oneDay,
        },
    ];

    const ctx = {
        favorites: new Set(),
        recents: new Map([
            ["xlc-old-frequent", now - 150 * oneDay],
            ["xlc-recent-active", now - 2 * 60 * 60 * 1000], // 2小时前
        ]),
        usage: new Map([
            ["xlc-old-frequent", 10], // 10次 * 5 = 50分
            ["xlc-recent-active", 3],  // 3次 * 100 = 300分
        ]),
        sort: "frecency",
        now,
    };

    const hits = searchEntries(entries, {text: "", scope: "all"}, ctx);
    assert.equal(hits.length, 2);
    // 尽管老条目使用过 10 次，但今天使用的 3 次条目根据 Frecency 权重排在首位
    assert.equal(hits[0].entry.id, "xlc-recent-active");
    assert.equal(hits[1].entry.id, "xlc-old-frequent");
});

test("fetchAdjacentBlocks: 探针正确提取前后相邻兄弟块", async () => {
    const mockKernel = {
        request: async (endpoint, payload) => {
            if (endpoint === "getChildBlocks") {
                return [
                    {id: "20240101120000-bl00001", type: "p"},
                    {id: "20240101120000-bl00002", type: "p"},
                    {id: "20240101120000-bl00003", type: "p"},
                ];
            }
            if (endpoint === "getBlockKramdowns") {
                return {
                    "20240101120000-bl00001": "前置上下文句子",
                    "20240101120000-bl00002": "当前核心命中句子",
                    "20240101120000-bl00003": "后置承接上下文句子",
                };
            }
            return null;
        },
    };

    const res = await fetchAdjacentBlocks(
        mockKernel,
        "20240101120000-bl00002",
        "20240101120000-doc0001"
    );

    assert.ok(res);
    assert.equal(res.current.id, "20240101120000-bl00002");
    assert.equal(res.current.content, "当前核心命中句子");
    assert.ok(res.prev);
    assert.equal(res.prev.id, "20240101120000-bl00001");
    assert.equal(res.prev.content, "前置上下文句子");
    assert.ok(res.next);
    assert.equal(res.next.id, "20240101120000-bl00003");
    assert.equal(res.next.content, "后置承接上下文句子");
});
