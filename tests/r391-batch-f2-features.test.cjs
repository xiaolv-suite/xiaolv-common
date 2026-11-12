"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {hierarchy} = require("./.build/entry.cjs");
const {buildHierarchyTree, splitHierarchyPath, isHierarchicalChild} = hierarchy;

test("TODO-FEAT-004: buildHierarchyTree 多层级父子树构建与级联计数", () => {
    const rawPaths = [
        "工作/客服/售后",
        "工作/客服/致歉",
        "工作/研发/前端",
        "生活日常",
    ];

    const counts = new Map([
        ["工作/客服/售后", 2],
        ["工作/客服/致歉", 3],
        ["工作/研发/前端", 1],
        ["生活日常", 5],
    ]);

    const tree = buildHierarchyTree(rawPaths, counts);
    assert.equal(tree.length, 2); // 两个根节点：工作、生活日常

    const workNode = tree.find((n) => n.name === "工作");
    assert.ok(workNode);
    assert.equal(workNode.depth, 0);
    assert.equal(workNode.count, 6); // 2 + 3 + 1 = 6
    assert.equal(workNode.children.length, 2); // 客服、研发

    const csNode = workNode.children.find((n) => n.name === "客服");
    assert.ok(csNode);
    assert.equal(csNode.depth, 1);
    assert.equal(csNode.count, 5); // 售后(2) + 致歉(3) = 5
    assert.equal(csNode.children.length, 2);

    const lifeNode = tree.find((n) => n.name === "生活日常");
    assert.ok(lifeNode);
    assert.equal(lifeNode.count, 5);
    assert.equal(lifeNode.children.length, 0);
});

test("TODO-FEAT-004: Dock 标签聚合模式分组逻辑", () => {
    const entries = [
        { id: "1", title: "话术1", tags: ["客服", "退换"] },
        { id: "2", title: "话术2", tags: ["客服", "问候"] },
        { id: "3", title: "命令1", tags: [] },
    ];

    const tagGroups = new Map();
    for (const e of entries) {
        const tags = e.tags && e.tags.length > 0 ? e.tags : ["未加标签"];
        for (const t of tags) {
            const key = `#${t.replace(/^#/, "")}`;
            if (!tagGroups.has(key)) tagGroups.set(key, []);
            tagGroups.get(key).push(e);
        }
    }

    assert.equal(tagGroups.size, 4); // #客服, #退换, #问候, #未加标签
    assert.equal(tagGroups.get("#客服").length, 2);
    assert.equal(tagGroups.get("#退换").length, 1);
    assert.equal(tagGroups.get("#未加标签").length, 1);
});

test("TODO-FEAT-005: 发现候选块字数长度分段筛选（短语/精炼段/长篇）", () => {
    function matchesLength(candidate, lengthRange) {
        if (!lengthRange || lengthRange === "all") return true;
        const len = (candidate.summary || candidate.title || "").trim().length;
        if (lengthRange === "short" && len >= 50) return false;
        if (lengthRange === "medium" && (len < 50 || len > 200)) return false;
        if (lengthRange === "long" && len <= 200) return false;
        return true;
    }

    const shortCandidate = { title: "短语", summary: "电话：18588888888" }; // 15字
    const mediumCandidate = { title: "精炼段", summary: "这是一段长达六十个字的精炼回复话术。".repeat(3) }; // ~60字
    const longCandidate = { title: "长篇协议", summary: "这是一段超过两百字的长篇合同条款说明。".repeat(12) }; // ~240字

    // 1. 全部
    assert.equal(matchesLength(shortCandidate, "all"), true);
    assert.equal(matchesLength(mediumCandidate, "all"), true);
    assert.equal(matchesLength(longCandidate, "all"), true);

    // 2. 短语 (<50)
    assert.equal(matchesLength(shortCandidate, "short"), true);
    assert.equal(matchesLength(mediumCandidate, "short"), false);
    assert.equal(matchesLength(longCandidate, "short"), false);

    // 3. 精炼段 (50~200)
    assert.equal(matchesLength(shortCandidate, "medium"), false);
    assert.equal(matchesLength(mediumCandidate, "medium"), true);
    assert.equal(matchesLength(longCandidate, "medium"), false);

    // 4. 长篇 (>200)
    assert.equal(matchesLength(shortCandidate, "long"), false);
    assert.equal(matchesLength(mediumCandidate, "long"), false);
    assert.equal(matchesLength(longCandidate, "long"), true);
});
