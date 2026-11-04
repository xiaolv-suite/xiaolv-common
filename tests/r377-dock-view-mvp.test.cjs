"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const { DockView } = entry.dockView;

function createMockContainer() {
    const children = [];
    const classList = new Set();
    const style = {};

    return {
        children,
        classList: {
            add: (cls) => classList.add(cls),
            remove: (cls) => classList.delete(cls),
            contains: (cls) => classList.has(cls),
            toggle: (cls, force) => {
                if (force === undefined) {
                    if (classList.has(cls)) classList.delete(cls);
                    else classList.add(cls);
                } else if (force) {
                    classList.add(cls);
                } else {
                    classList.delete(cls);
                }
            },
        },
        style,
        innerHTML: "",
        appendChild: (child) => {
            children.push(child);
            return child;
        },
        querySelector: (selector) => {
            // 递归查找匹配元素
            const searchNode = (node) => {
                if (!node) return null;
                if (selector.startsWith(".") && node.className && node.className.includes(selector.slice(1))) {
                    return node;
                }
                if (selector.startsWith("#") && node.id === selector.slice(1)) {
                    return node;
                }
                if (selector.startsWith("[data-scope=") && node.dataset && node.dataset.scope === selector.slice(13, -2)) {
                    return node;
                }
                for (const c of node.children || []) {
                    const found = searchNode(c);
                    if (found) return found;
                }
                return null;
            };
            for (const child of children) {
                const found = searchNode(child);
                if (found) return found;
            }
            return null;
        },
        querySelectorAll: (selector) => {
            const results = [];
            const collect = (node) => {
                if (!node) return;
                if (selector.startsWith(".") && node.className && node.className.includes(selector.slice(1))) {
                    results.push(node);
                }
                if (selector.startsWith("[data-") && node.dataset) {
                    results.push(node);
                }
                for (const c of node.children || []) collect(c);
            };
            for (const child of children) collect(child);
            return results;
        },
    };
}

function createMockElement(tag) {
    const children = [];
    const classList = new Set();
    const listeners = {};
    const dataset = {};
    const style = {};
    let innerHtmlVal = "";
    let textContentVal = "";

    return {
        tagName: tag.toUpperCase(),
        className: "",
        get textContent() {
            if (children.length === 0) return textContentVal;
            return children.map((c) => c.textContent || "").join(" ");
        },
        set textContent(val) { textContentVal = val; },
        get innerHTML() { return innerHtmlVal; },
        set innerHTML(val) {
            innerHtmlVal = val;
            if (val === "") children.length = 0;
        },
        style,
        dataset,
        children,
        draggable: false,
        disabled: false,
        value: "",
        attributes: {},
        setAttribute(k, v) { this.attributes[k] = String(v); },
        getAttribute(k) { return this.attributes[k] || null; },
        removeAttribute(k) { delete this.attributes[k]; },
        classList: {
            add: (cls) => classList.add(cls),
            remove: (cls) => classList.delete(cls),
            contains: (cls) => classList.has(cls),
            toggle: (cls, force) => {
                if (force === undefined) {
                    if (classList.has(cls)) classList.delete(cls);
                    else classList.add(cls);
                } else if (force) {
                    classList.add(cls);
                } else {
                    classList.delete(cls);
                }
            },
        },
        appendChild: (child) => {
            children.push(child);
            return child;
        },
        addEventListener: (event, handler) => {
            listeners[event] = listeners[event] || [];
            listeners[event].push(handler);
        },
        dispatchEvent: (event) => {
            const handlers = listeners[event.type] || [];
            for (const h of handlers) h(event);
        },
        querySelector: (selector) => {
            for (const c of children) {
                if (selector.startsWith(".") && c.className && c.className.includes(selector.slice(1))) return c;
            }
            return null;
        },
        querySelectorAll: (selector) => {
            const results = [];
            for (const c of children) {
                if (selector.startsWith(".") && c.className && c.className.includes(selector.slice(1))) results.push(c);
            }
            return results;
        },
        focus: () => {},
    };
}

test("DockView: instantiates and renders compact header, search, chips, and list", async () => {
    // 模拟最小 DOM 环境
    const originalDocument = global.document;
    global.document = {
        createElement: (tag) => createMockElement(tag),
        createTextNode: (text) => ({ text }),
    };

    const container = createMockContainer();
    const fakeEntries = [
        {
            id: "item-1",
            title: "公司开票资料",
            alias: "kp",
            summary: "纳税人识别号: 91110108MA...",
            itemType: "text",
            tags: ["财务"],
            category: "商务",
        },
        {
            id: "item-2",
            title: "SQL查询脚手架",
            alias: "sql",
            summary: "SELECT * FROM orders WHERE ...",
            itemType: "code",
            tags: ["开发"],
            category: "研发",
        },
    ];

    let insertedId = "";
    let copiedText = "";
    let newItemCalled = false;
    let settingsCalled = false;

    const deps = {
        t: (k) => k,
        notify: () => {},
        search: async (query) => {
            let entries = fakeEntries;
            if (query.text) {
                entries = entries.filter((e) => e.title.includes(query.text) || e.alias.includes(query.text));
            }
            return { entries, truncated: false, total: entries.length };
        },
        preview: async (id) => (id === "item-1" ? "完整发票抬头内容" : "SELECT * FROM orders;"),
        runAction: async (id, mode) => {
            if (mode === "insert") insertedId = id;
            if (mode === "copy") copiedText = id;
            return { ok: true, message: "ok" };
        },
        runActionWithFills: async () => ({ ok: true, message: "ok" }),
        toggleFavorite: () => true,
        isFavorite: (id) => id === "item-1",
        copyText: async () => true,
        copyProviderPayload: async () => true,
        openSource: async () => ({ ok: true, message: "ok" }),
        newItem: () => { newItemCalled = true; },
        openSettings: () => { settingsCalled = true; },
        getUsage: () => ({ "item-1": { count: 12, lastAt: Date.now() } }),
        isSourceMissing: () => false,
        hasActiveEditor: () => true,
    };

    try {
        const dock = new DockView(container, deps);

        // 1. 验证容器初始化挂载
        assert.ok(container.classList.contains("xlc-dock"));
        assert.ok(container.children.length >= 5);

        // 等待异步初始检索刷新
        await new Promise((r) => setTimeout(r, 20));

        // 2. 验证单列列表渲染
        const listContainer = container.querySelector(".xlc-dock-list");
        assert.ok(listContainer);
        const rows = listContainer.querySelectorAll(".xlc-dock-row");
        assert.equal(rows.length, 2);

        // 3. 验证第一行条目内容与可拖拽特性
        const row0 = rows[0];
        assert.ok(row0.className.includes("xlc-dock-row"));
        assert.equal(row0.draggable, true); // 原生 HTML5 拖拽属性

        // 4. 模拟拖拽数据打包
        const mockDataTransfer = {
            data: {},
            setData(k, v) { this.data[k] = v; },
        };
        row0.dispatchEvent({ type: "dragstart", dataTransfer: mockDataTransfer });
        assert.ok(mockDataTransfer.data["text/plain"].includes("纳税人识别号"));

        // 5. 验证快捷动作按钮
        const actionsWrap = row0.querySelector(".xlc-dock-row-actions");
        assert.ok(actionsWrap);
        const insertBtn = actionsWrap.children[0];
        assert.equal(insertBtn.textContent, "＋");
        insertBtn.dispatchEvent({ type: "click", stopPropagation: () => {} });
        assert.equal(insertedId, "item-1");

        const copyBtn = actionsWrap.children[1];
        assert.equal(copyBtn.textContent, "⧉");
        copyBtn.dispatchEvent({ type: "click", stopPropagation: () => {} });
        assert.equal(copiedText, "item-1");

        // 6. 验证搜索输入过滤
        const searchInput = container.querySelector(".xlc-dock-search-input");
        assert.ok(searchInput);
        searchInput.value = "SQL";
        await dock.refresh();
        assert.equal(listContainer.children.length, 1);
        assert.ok(listContainer.children[0].textContent.includes("SQL查询脚手架"));

        // 7. 验证顶栏新建与设置动作
        const headActions = container.querySelector(".xlc-dock-head-actions");
        assert.ok(headActions);
        const newBtn = headActions.children[0];
        newBtn.dispatchEvent({ type: "click" });
        assert.equal(newItemCalled, true);

        const gearBtn = headActions.children[2];
        gearBtn.dispatchEvent({ type: "click" });
        assert.equal(settingsCalled, true);

        // 8. 验证销毁清理
        dock.destroy();
        assert.equal(container.innerHTML, "");
    } finally {
        global.document = originalDocument;
    }
});
