"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {promptPack, importMarkdown, starterPacksDialog} = require("./.build/entry.cjs");
const {STARTER_PACKS, buildDedicatedDocMarkdown} = promptPack;
const {parseMarkdownPack} = importMarkdown;
const {openStarterPacksHubDialog} = starterPacksDialog;

test("TODO-FEAT-034: 四大开箱套件全量条目精修契约 (简码shortcode、别名alias、规范变量与超级块)", () => {
    for (const pack of STARTER_PACKS) {
        const parsed = parseMarkdownPack(pack.markdown);
        for (const it of parsed.items) {
            // 1. 验证每项条目均配齐 shortcode 且以冒号开头
            assert.ok(it.shortcode, `${it.title} 缺失 shortcode`);
            assert.ok(it.shortcode.startsWith(":"), `${it.title} shortcode 未以冒号开头: ${it.shortcode}`);

            // 2. 验证配齐 alias 拼音别名
            assert.ok(it.alias && it.alias.length > 0, `${it.title} 缺失 alias 别名`);

            // 3. 验证分类与标签规范
            assert.ok(it.category, `${it.title} 缺失 category`);
            assert.ok(it.tags.length >= 2, `${it.title} 标签数量不足`);
        }
    }
});

test("TODO-FEAT-035: 套件生成思源笔记专属结构化文档与原生标签契约 (buildDedicatedDocMarkdown)", () => {
    const bizPack = STARTER_PACKS.find((p) => p.id === "starter-biz");
    assert.ok(bizPack);

    const docMd = buildDedicatedDocMarkdown(bizPack);

    // 1. 验证包含文档顶级标题
    assert.ok(docMd.includes(`# 常用资产 · ${bizPack.name}`));

    // 2. 验证注入思源原生分类标签
    assert.ok(docMd.includes(`#小驴常用/${bizPack.category}#`));

    // 3. 验证包含每个条目的真实思源块属性
    assert.ok(docMd.includes("custom-xlc-id="));
    assert.ok(docMd.includes("custom-xlc-shortcode=\":tax\""));
    assert.ok(docMd.includes("custom-xlc-alias="));
    assert.ok(docMd.includes("custom-xlc-category="));
});

test("TODO-FEAT-036: 套件中心双启用模式 (合并入库 vs 新建专属文档) 闭环契约", async () => {
    const originalDoc = global.document;

    function makeElem(tag) {
        return {
            tagName: tag.toUpperCase(),
            style: {},
            className: "",
            textContent: "",
            children: [],
            dataset: {},
            appendChild(child) {
                this.children.push(child);
                return child;
            },
            append(...items) {
                for (const it of items) this.appendChild(it);
            },
            setAttribute(k, v) { this[k] = v; },
            removeAttribute(k) { delete this[k]; },
            classList: {
                add(...cls) { cls.forEach((c) => this._classes.add(c)); },
                remove(...cls) { cls.forEach((c) => this._classes.delete(c)); },
                contains(c) { return this._classes.has(c); },
                _classes: new Set(),
            },
            addEventListener(ev, fn) {
                this._listeners ??= {};
                this._listeners[ev] ??= [];
                this._listeners[ev].push(fn);
            },
            querySelector(sel) {
                if (sel === ".b3-dialog__body") return this;
                return null;
            },
            querySelectorAll() { return []; },
        };
    }

    const mockDoc = {
        createElement: (tag) => makeElem(tag),
        createTextNode: (t) => ({ textContent: t }),
    };

    global.document = mockDoc;

    try {
        let directImported = false;
        let createdDocName = "";

        const mockDeps = {
            t: (k) => k,
            notify: () => {},
            importStarterPackDirect: async () => {
                directImported = true;
                return {ok: true, count: 6};
            },
            createStarterPackDedicatedDoc: async (pack) => {
                createdDocName = pack.name;
                return {ok: true, count: 6, docId: "doc-123", hPath: `/常用资产 · ${pack.name}`};
            },
        };

        const dlg = openStarterPacksHubDialog(mockDeps);
        assert.ok(dlg);

        const body = dlg.element.querySelector(".b3-dialog__body");
        const container = body.children[0];
        const list = container.children.find((c) => c.className === "xlc-starter-hub-list");
        const firstCard = list.children[0];
        const cardActs = firstCard.children.find((c) => c.className === "xlc-starter-hub-card-acts");

        // 验证同时存在「＋ 一键启用」与「📁 新建专属文档」双按钮
        const installBtn = cardActs.children.find((c) => c.dataset?.xlcControl === "starter-hub.install.starter-biz");
        const docBtn = cardActs.children.find((c) => c.dataset?.xlcControl === "starter-hub.doc.starter-biz");
        assert.ok(installBtn, "缺少一键启用按钮");
        assert.ok(docBtn, "缺少新建专属文档按钮");

        // 测试触发新建专属文档
        await docBtn._listeners["click"][0]();
        assert.equal(createdDocName, "商务与财务开票套件");
        assert.equal(docBtn.textContent, "✓ 文档已建");
    } finally {
        global.document = originalDoc;
    }
});
