"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const { DockView } = entry.dockView;

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
        remove: () => {},
    };
}

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
        attributes: {},
        setAttribute(k, v) { this.attributes[k] = String(v); },
        getAttribute(k) { return this.attributes[k] || null; },
        appendChild: (child) => {
            children.push(child);
            return child;
        },
        querySelector: (selector) => {
            const searchNode = (node) => {
                if (!node) return null;
                if (selector.startsWith(".") && node.className && node.className.includes(selector.slice(1))) {
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
                for (const c of node.children || []) collect(c);
            };
            for (const child of children) collect(child);
            return results;
        },
    };
}

test("DockView Phase 2: Category tree folding, advanced drag-and-drop modifiers, and context menu", async () => {
    const originalDocument = global.document;
    global.document = {
        createElement: (tag) => createMockElement(tag),
        createTextNode: (text) => ({ text }),
        body: createMockElement("body"),
        addEventListener: () => {},
        removeEventListener: () => {},
    };

    const container = createMockContainer();
    const fakeEntries = [
        {
            id: "item-1",
            title: "公司开票资料",
            alias: "kp",
            summary: "纳税人识别号: 911101...",
            itemType: "text",
            category: "商务合作",
            targetBlockId: "20260101000000-block1",
        },
        {
            id: "item-2",
            title: "报价单模板",
            alias: "bj",
            summary: "标准报价...",
            itemType: "text",
            category: "商务合作",
            targetBlockId: "20260101000000-block2",
        },
        {
            id: "item-3",
            title: "Docker构建脚本",
            alias: "dk",
            summary: "docker build ...",
            itemType: "code",
            category: "研发日常",
            targetBlockId: "20260101000000-block3",
        },
    ];

    const deps = {
        t: (k) => k,
        notify: () => {},
        search: async () => ({ entries: fakeEntries, truncated: false, total: fakeEntries.length }),
        preview: async () => "预览正文",
        runAction: async () => ({ ok: true, message: "ok" }),
        runActionWithFills: async () => ({ ok: true, message: "ok" }),
        toggleFavorite: () => true,
        isFavorite: () => false,
        copyText: async () => true,
        copyProviderPayload: async () => true,
        openSource: async () => ({ ok: true, message: "ok" }),
        newItem: () => {},
    };

    try {
        const dock = new DockView(container, deps);
        await new Promise((r) => setTimeout(r, 20));

        const listContainer = container.querySelector(".xlc-dock-list");
        assert.ok(listContainer);

        // 1. 验证分类大纲折叠树（浏览态默认呈现两个分类组头：商务合作、研发日常）
        const groupHeads = listContainer.querySelectorAll(".xlc-dock-group-head");
        assert.equal(groupHeads.length, 2);
        assert.ok(groupHeads[0].innerHTML.includes("商务合作"));
        assert.ok(groupHeads[0].innerHTML.includes("2")); // 商务合作有2条
        assert.ok(groupHeads[1].innerHTML.includes("研发日常"));
        assert.ok(groupHeads[1].innerHTML.includes("1")); // 研发日常有1条

        // 当前展开状态下，总行数 = 2个组头 + 3个条目行 = 5
        assert.equal(listContainer.children.length, 5);

        // 2. 点击收起第一个分类组
        groupHeads[0].dispatchEvent({ type: "click" });
        // 收起后，总行数 = 2个组头 + 1个条目行（只有研发日常展示） = 3
        assert.equal(listContainer.children.length, 3);

        // 再次点击展开
        const newHeads = listContainer.querySelectorAll(".xlc-dock-group-head");
        newHeads[0].dispatchEvent({ type: "click" });
        assert.equal(listContainer.children.length, 5);

        // 3. 验证高级拖拽修饰键多模态
        const rows = listContainer.querySelectorAll(".xlc-dock-row");
        assert.ok(rows.length >= 1);
        const firstRow = rows[0];

        // 3.1 普通拖拽 -> 纯文本
        let mockTransfer = { data: {}, setData(k, v) { this.data[k] = v; } };
        firstRow.dispatchEvent({ type: "dragstart", dataTransfer: mockTransfer, altKey: false, shiftKey: false });
        assert.ok(mockTransfer.data["text/plain"].includes("纳税人识别号"));

        // 3.2 Alt 键拖拽 -> 思源块引用语法
        mockTransfer = { data: {}, setData(k, v) { this.data[k] = v; } };
        firstRow.dispatchEvent({ type: "dragstart", dataTransfer: mockTransfer, altKey: true, shiftKey: false });
        assert.ok(mockTransfer.data["text/plain"].startsWith("((20260101000000-block1"));

        // 3.3 Shift 键拖拽 -> 思源嵌入块语法
        mockTransfer = { data: {}, setData(k, v) { this.data[k] = v; } };
        firstRow.dispatchEvent({ type: "dragstart", dataTransfer: mockTransfer, altKey: false, shiftKey: true });
        assert.ok(mockTransfer.data["text/plain"].startsWith("{{select * from blocks where id='20260101000000-block1'"));

        // 4. 验证右键上下文菜单
        let menuPrevented = false;
        firstRow.dispatchEvent({
            type: "contextmenu",
            clientX: 100,
            clientY: 200,
            preventDefault() { menuPrevented = true; },
        });
        assert.equal(menuPrevented, true);

        dock.destroy();
    } finally {
        global.document = originalDocument;
    }
});
