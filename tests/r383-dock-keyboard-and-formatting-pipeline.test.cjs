"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const { DockView } = entry.dockView;
const { csvToList, buildUrlQuery } = entry.textFormatting || entry;
const { applyPlaceholders } = entry.placeholders || entry;

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
            const findNode = (node) => {
                if (!node) return null;
                if (selector.startsWith(".") && node.className && node.className.includes(selector.slice(1))) {
                    return node;
                }
                for (const c of node.children || []) {
                    const found = findNode(c);
                    if (found) return found;
                }
                return null;
            };
            for (const c of children) {
                const found = findNode(c);
                if (found) return found;
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
        scrollIntoView: () => {},
        remove: () => {},
    };
}

test("DockView · 键盘上下焦点漫游与 Enter / Ctrl+Enter 快捷分派", async () => {
    const originalDocument = global.document;
    global.document = {
        createElement: (tag) => createMockElement(tag),
        createTextNode: (text) => ({ text }),
    };

    try {
        const mockContainer = createMockElement("div");
        const mockItems = [
            { id: "item-1", title: "条目一", category: "默认", content: "第一条" },
            { id: "item-2", title: "条目二", category: "默认", content: "第二条" },
            { id: "item-3", title: "条目三", category: "默认", content: "第三条" },
        ];

        let lastAction = "";
        let lastTargetId = "";

        const deps = {
            search: async () => ({ entries: mockItems, truncated: false, total: mockItems.length }),
            t: (k) => k,
            runAction: async (id, action) => {
                lastAction = action;
                lastTargetId = id;
                return { ok: true };
            },
            toggleFavorite: () => {},
            isFavorite: () => false,
            copyText: async () => true,
            copyProviderPayload: async () => true,
            openSource: async () => ({ ok: true, message: "" }),
            newItem: () => {},
            isSourceMissing: () => false,
        };

        const dock = new DockView(mockContainer, deps);
        await dock.refresh();

        // 查找 searchInput
        const searchInput = mockContainer.querySelector(".xlc-dock-search-input");
        assert.ok(searchInput, "搜索输入框必须存在");

        // 初始 activeIndex
        assert.equal(dock.getActiveIndex(), -1);

        // 1. 按 ArrowDown 漫游到第 0 项
        searchInput.dispatchEvent({ type: "keydown", key: "ArrowDown", preventDefault: () => {} });
        assert.equal(dock.getActiveIndex(), 0);

        // 2. 再次按 ArrowDown 漫游到第 1 项
        searchInput.dispatchEvent({ type: "keydown", key: "ArrowDown", preventDefault: () => {} });
        assert.equal(dock.getActiveIndex(), 1);

        // 3. 按 Enter 插入当前选中的第 1 项
        searchInput.dispatchEvent({ type: "keydown", key: "Enter", preventDefault: () => {} });
        assert.equal(lastAction, "insert");
        assert.equal(lastTargetId, "item-2");

        // 4. 按 Ctrl+Enter 快捷复制第 1 项
        lastAction = "";
        lastTargetId = "";
        searchInput.dispatchEvent({ type: "keydown", key: "Enter", ctrlKey: true, preventDefault: () => {} });
        assert.equal(lastAction, "copy");
        assert.equal(lastTargetId, "item-2");

        // 5. 按 ArrowUp 回退到第 0 项
        searchInput.dispatchEvent({ type: "keydown", key: "ArrowUp", preventDefault: () => {} });
        assert.equal(dock.getActiveIndex(), 0);
    } finally {
        global.document = originalDocument;
    }
});

test("CSV 转 Markdown 列表纯函数 · csvToList 智能分词与列表构建", () => {
    // 基础逗号列表
    const csv1 = "苹果, 香蕉, 橙子";
    assert.equal(csvToList(csv1, ",", "- "), "- 苹果\n- 香蕉\n- 橙子");

    // 制表符与多行混合
    const tsv = "ItemA\tItemB\nItemC\tItemD";
    assert.equal(csvToList(tsv, "\\t", "- "), "- ItemA\n- ItemB\n- ItemC\n- ItemD");

    // 容错空项与空字符串
    assert.equal(csvToList("  ,   ,,  "), "");
    assert.equal(csvToList(""), "");
});

test("URL Query 构建纯函数 · buildUrlQuery 安全参数序列化与合并", () => {
    const pairs = "user=alice\nrole=admin&active=true";
    assert.equal(buildUrlQuery(pairs), "user=alice&role=admin&active=true");

    const withBase = buildUrlQuery(pairs, "https://api.github.com/v1");
    assert.equal(withBase, "https://api.github.com/v1?user=alice&role=admin&active=true");

    // 已有 query 时自动用 & 追加
    const withExisting = buildUrlQuery("page=2", "https://api.io/items?type=all");
    assert.equal(withExisting, "https://api.io/items?type=all&page=2");

    // 容错
    assert.equal(buildUrlQuery("", "https://api.io"), "https://api.io");
});

test("动态占位符宏引擎 · {{xlc:csv:list}} 与 {{xlc:url:query}} 宏求值", () => {
    const now = new Date("2026-10-29T10:00:00Z");

    // CSV 转列表宏
    const t1 = "{{xlc:csv:list|任务A, 任务B, 任务C}}";
    assert.equal(applyPlaceholders(t1, now, true), "- 任务A\n- 任务B\n- 任务C");

    // CSV 转有序列表宏
    const t2 = "{{xlc:csv:numbered|步骤1, 步骤2}}";
    assert.equal(applyPlaceholders(t2, now, true), "1. 步骤1\n2. 步骤2");

    // URL Query 构建宏
    const t3 = "{{xlc:url:query|env=prod\ntoken=xyz|https://gateway.internal}}";
    assert.equal(applyPlaceholders(t3, now, true), "https://gateway.internal?env=prod&token=xyz");

    // 单独生成 query string
    const t4 = "{{xlc:url:build|from=search\nlimit=10}}";
    assert.equal(applyPlaceholders(t4, now, true), "from=search&limit=10");
});
