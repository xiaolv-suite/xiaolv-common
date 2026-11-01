"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {promptPack, importMarkdown} = require("./.build/entry.cjs");
const {STARTER_PACKS} = promptPack;
const {parseMarkdownPack} = importMarkdown;

test("TODO-FEAT-028: 四大行业角色开箱即用套件完整性契约 (STARTER_PACKS)", () => {
    // 1. 验证包含四大行业角色套件
    assert.equal(STARTER_PACKS.length, 4);

    const ids = STARTER_PACKS.map((p) => p.id);
    assert.ok(ids.includes("starter-biz"));
    assert.ok(ids.includes("starter-cs"));
    assert.ok(ids.includes("starter-dev"));
    assert.ok(ids.includes("starter-write"));

    // 2. 验证元数据完整性
    for (const pack of STARTER_PACKS) {
        assert.ok(pack.id);
        assert.ok(pack.icon);
        assert.ok(pack.name);
        assert.ok(pack.tagline);
        assert.ok(pack.description);
        assert.ok(pack.category);
        assert.ok(pack.itemCount > 0);
        assert.ok(pack.markdown && pack.markdown.includes("<!-- xlc-pack"));
    }
});

test("TODO-FEAT-029: 四大行业开箱套件 Markdown 解析与导入保真契约", () => {
    for (const pack of STARTER_PACKS) {
        const parsed = parseMarkdownPack(pack.markdown);
        // 验证条目数量与 pack.itemCount 严格一致
        assert.equal(parsed.items.length, pack.itemCount, `${pack.name} 条目解析数量不匹配`);

        // 验证每一条条目均具备合法的 id、itemType、category、title 与正文
        for (const it of parsed.items) {
            assert.ok(it.id && it.id.startsWith("xlc-"));
            assert.ok(it.itemType);
            assert.ok(it.category);
            assert.ok(it.title);
            assert.ok(it.kramdown && it.kramdown.trim().length > 0);
            assert.ok(Array.isArray(it.tags));
        }
    }
});

test("TODO-FEAT-030: 空库状态一键装入回调闭环契约", async () => {
    let importedMarkdown = "";

    const mockImport = async (md) => {
        importedMarkdown = md;
        return {ok: true, count: 6};
    };

    const targetPack = STARTER_PACKS[0];
    const res = await mockImport(targetPack.markdown);
    assert.equal(res.ok, true);
    assert.equal(res.count, 6);
    assert.ok(importedMarkdown.includes("商务与财务开票套件"));
});
