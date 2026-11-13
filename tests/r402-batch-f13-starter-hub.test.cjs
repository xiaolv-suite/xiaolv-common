"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {starterPacksDialog} = require("./.build/entry.cjs");
const {ALL_HUB_PACKS, openStarterPacksHubDialog} = starterPacksDialog;

test("TODO-FEAT-031 & TODO-FEAT-032: 开箱即用套件市场货架数据完整性契约 (ALL_HUB_PACKS)", () => {
    // 1. 验证包含四大行业专属与经典五大套件 (4 + 5 = 9套)
    assert.equal(ALL_HUB_PACKS.length, 9);

    const names = ALL_HUB_PACKS.map((p) => p.name);
    assert.ok(names.includes("商务与财务开票套件"));
    assert.ok(names.includes("电商客服与售后沟通套件"));
    assert.ok(names.includes("开发与系统运维常用指令套件"));
    assert.ok(names.includes("写作排版与学术规范套件"));
    assert.ok(names.includes("Callout 结构化提示包"));
    assert.ok(names.includes("渐进反思与间隔复习包"));

    // 2. 验证所有套件均有有效条目数与 Markdown 实体
    for (const p of ALL_HUB_PACKS) {
        assert.ok(p.id);
        assert.ok(p.icon);
        assert.ok(p.tagline);
        assert.ok(p.itemCount > 0);
        assert.ok(p.markdown && p.markdown.includes("<!-- xlc-pack"));
    }
});

test("TODO-FEAT-033: 开箱即用套件市场对话框 DOM 装配与一键启用闭环契约", async () => {
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
        let importedMd = "";
        let notified = "";
        const mockDeps = {
            t: (k) => k,
            notify: (type, msg) => {
                notified = msg;
            },
            importStarterPackDirect: async (md) => {
                importedMd = md;
                return {ok: true, count: 6};
            },
            onImportSuccess: () => {},
        };

        const dlg = openStarterPacksHubDialog(mockDeps);
        assert.ok(dlg);

        const body = dlg.element.querySelector(".b3-dialog__body");
        assert.ok(body);
        assert.ok(body.children.length > 0);

        const container = body.children[0];
        assert.equal(container.className, "xlc-starter-hub-container");

        // 验证 9 套套件卡片全部生成
        const list = container.children.find((c) => c.className === "xlc-starter-hub-list");
        assert.ok(list);
        assert.equal(list.children.length, 9);

        // 验证第一套卡片（商务财务）的一键启用按钮
        const firstCard = list.children[0];
        const cardActs = firstCard.children.find((c) => c.className === "xlc-starter-hub-card-acts");
        assert.ok(cardActs);
        const installBtn = cardActs.children.find((c) => c.dataset?.xlcControl === "starter-hub.install.starter-biz");
        assert.ok(installBtn);

        // 点击一键启用
        await installBtn._listeners["click"][0]();
        assert.ok(importedMd.includes("商务与财务开票套件"));
        assert.equal(installBtn.textContent, "✓ 已启用");
        assert.ok(notified.includes("商务与财务开票套件"));
    } finally {
        global.document = originalDoc;
    }
});
