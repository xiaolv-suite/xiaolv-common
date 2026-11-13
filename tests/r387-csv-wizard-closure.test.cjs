"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const { openCsvTsvImportWizard } = entry.csvTsvWizard || entry;

function createMockElement(tag) {
    const children = [];
    const classList = new Set();
    const listeners = {};
    const dataset = {};
    const style = {};
    let innerHtmlVal = "";
    let textContentVal = "";

    const el = {
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
        disabled: false,
        value: "",
        setAttribute: (k, v) => { dataset[k] = v; },
        getAttribute: (k) => dataset[k] ?? null,
        classList: {
            add: (cls) => classList.add(cls),
            remove: (cls) => classList.delete(cls),
            contains: (cls) => classList.has(cls),
        },
        appendChild: (child) => {
            children.push(child);
            return child;
        },
        append: (...items) => {
            for (const item of items) {
                if (typeof item === "string") textContentVal += item;
                else children.push(item);
            }
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
                if (selector.startsWith("[data-xlc-control=") && node.dataset && `wizard.field.${node.dataset.xlcControl?.replace("wizard.field.", "")}` === selector.slice(19, -2)) {
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
            const collect = (node) => {
                if (!node) return;
                if (selector.startsWith(".") && node.className && node.className.includes(selector.slice(1))) {
                    results.push(node);
                }
                for (const c of node.children || []) collect(c);
            };
            for (const c of children) collect(c);
            return results;
        },
        focus: () => {},
    };
    return el;
}

test("CSV/TSV 向导 · 动态 options 构建与字段标签闭环", async () => {
    const originalDocument = global.document;
    const bodyChildren = [];
    global.document = {
        createElement: (tag) => createMockElement(tag),
        createTextNode: (text) => ({ text }),
        body: {
            appendChild: (child) => bodyChildren.push(child),
        },
    };

    try {
        const ctx = {
            t: (k) => k,
            notify: () => {},
        };

        // 模拟打开向导
        let isClosed = false;
        openCsvTsvImportWizard(ctx, () => { isClosed = true; });

        // 验证对话框已被挂载
        assert.equal(bodyChildren.length > 0, true, "向导必须创建并挂载 Dialog");

        // 查找 textarea 输入框并模拟粘贴 3 列表格
        const rootContainer = bodyChildren[0];
        const ta = rootContainer.querySelector(".b3-text-field");
        assert.ok(ta, "文本输入框必须存在");

        // 输入 CSV 文本并触发 input 事件
        ta.value = "标题,正文内容,业务分类\n开票信息,91110108MA...,财务\n请假话术,由于个人事务...,人事";
        ta.dispatchEvent({ type: "input" });

        // 等待防抖解析
        await new Promise((r) => setTimeout(r, 450));

        // 查找标题列下拉框
        const selects = rootContainer.querySelectorAll(".xlc-wizard-select");
        assert.equal(selects.length, 6, "必须包含 6 个映射字段选择器");

        // 验证首个 select 内部已经动态注入了 options
        const titleSelect = selects[0];
        assert.ok(titleSelect.children.length >= 4, "每个选择器必须包含（不映射）及 3 个列选项");
        assert.equal(titleSelect.children[0].value, "-1", "首项必须是不映射 (-1)");
        assert.equal(titleSelect.children[1].value, "0", "第 1 列序号必须为 0");
        assert.equal(titleSelect.children[1].textContent.includes("标题"), true, "第 1 列必须正确提取表头名称「标题」");
    } finally {
        global.document = originalDocument;
    }
});
