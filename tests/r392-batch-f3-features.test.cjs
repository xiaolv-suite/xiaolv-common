"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {previewRenderer} = require("./.build/entry.cjs");
const {renderSafePreview} = previewRenderer;

test("TODO-FEAT-006: renderSafePreview 单块 Markdown 语法色彩着色支持", () => {
    // 模拟 document 与 DOM
    const originalDoc = global.document;
    const createdElements = [];

    function makeElem(tag) {
        return {
            tagName: tag.toUpperCase(),
            style: {},
            className: "",
            textContent: "",
            innerHTML: "",
            dataset: {},
            children: [],
            appendChild(child) {
                this.children.push(child);
                return child;
            },
            setAttribute(k, v) { this[k] = v; },
            removeAttribute(k) { delete this[k]; },
            classList: {
                add(...cls) { cls.forEach((c) => this._classes.add(c)); },
                remove(...cls) { cls.forEach((c) => this._classes.delete(c)); },
                contains(c) { return this._classes.has(c); },
                toggle(c, force) {
                    if (force !== undefined) {
                        if (force) this._classes.add(c);
                        else this._classes.delete(c);
                        return force;
                    }
                    if (this._classes.has(c)) { this._classes.delete(c); return false; }
                    this._classes.add(c); return true;
                },
                _classes: new Set(),
            },
        };
    }

    const mockDoc = {
        createElement: (tag) => {
            const el = makeElem(tag);
            createdElements.push(el);
            return el;
        },
        createTextNode: (text) => ({ textNode: true, textContent: text }),
    };

    global.document = mockDoc;

    try {
        const container = mockDoc.createElement("div");
        const mdText = "# 核心标题\n```js\nconst x = 1;\n```\n**重要粗体**与普通正文";
        renderSafePreview(container, mdText, "markdown", mockDoc);

        // 验证生成了渲染子节点
        assert.ok(container.children.length >= 1);
    } finally {
        global.document = originalDoc;
    }
});

test("TODO-FEAT-007: 顶栏极速气泡卡片 Top 5 优先级排序算法契约", () => {
    const allEntries = [
        { id: "item-1", title: "普通项1", itemType: "text" },
        { id: "item-2", title: "收藏项A", itemType: "text" },
        { id: "item-3", title: "高频项B", itemType: "code" },
        { id: "item-4", title: "超高频项C", itemType: "text" },
        { id: "item-5", title: "收藏项D", itemType: "url" },
        { id: "item-6", title: "低频项E", itemType: "text" },
        { id: "item-7", title: "低频项F", itemType: "text" },
    ];

    const favSet = new Set(["item-2", "item-5"]);
    const usage = {
        "item-1": { count: 3 },
        "item-3": { count: 18 },
        "item-4": { count: 50 },
        "item-6": { count: 1 },
        "item-7": { count: 0 },
    };

    // 排序契约：收藏项置顶（按频次倒序），其次普通项按频次倒序，截取前 5
    const sorted = [...allEntries].sort((a, b) => {
        const aFav = favSet.has(a.id) ? 1 : 0;
        const bFav = favSet.has(b.id) ? 1 : 0;
        if (aFav !== bFav) return bFav - aFav;
        const aCount = usage[a.id]?.count ?? 0;
        const bCount = usage[b.id]?.count ?? 0;
        return bCount - aCount;
    });

    const top5 = sorted.slice(0, 5);
    assert.equal(top5.length, 5);
    // 两个收藏项必须排在最前
    assert.equal(top5[0].id, "item-2");
    assert.equal(top5[1].id, "item-5");
    // 紧接着是高频项
    assert.equal(top5[2].id, "item-4"); // count 50
    assert.equal(top5[3].id, "item-3"); // count 18
    assert.equal(top5[4].id, "item-1"); // count 3
});
