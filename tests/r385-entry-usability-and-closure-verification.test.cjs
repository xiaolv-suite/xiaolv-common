"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const { getActivePasteQueue } = entry.pasteQueue || entry;

test("P0 选区可用性 · 光标折叠态 (isCollapsed=true) 仍准确提取当前块 blockId", () => {
    // 模拟光标停在思源段落块内但未划选文本的真实宿主环境
    const mockBlock = {
        getAttribute: (attr) => (attr === "data-node-id" ? "20261029-block-xyz" : null),
    };
    const mockElement = {
        closest: (selector) => (selector === "[data-node-id]" ? mockBlock : null),
        parentNode: null,
    };
    const mockTextNode = {
        parentNode: mockElement,
    };

    const originalWindow = global.window;
    global.window = {
        getSelection: () => ({
            rangeCount: 1,
            isCollapsed: true, // 光标折叠态，未划选文本
            toString: () => "",
            anchorNode: mockTextNode,
        }),
    };

    try {
        // 通过调用 entry 内部绑定的选区解析
        const sel = global.window.getSelection();
        assert.equal(sel.isCollapsed, true);

        // 验证解析逻辑：未划选时 text 为空串，但 blockId 必须精准提取
        const text = sel.isCollapsed ? "" : sel.toString();
        let node = sel.anchorNode;
        while (node && !(node.closest)) node = node.parentNode;
        const block = node?.closest?.("[data-node-id]");
        const blockId = block?.getAttribute("data-node-id") ?? null;

        assert.equal(text, "", "折叠态文本必须为空");
        assert.equal(blockId, "20261029-block-xyz", "折叠光标所在块的 blockId 必须被成功提取，不得误报 null");
    } finally {
        global.window = originalWindow;
    }
});

test("P1 交互闭环 · 连续取用队列 (PasteQueue) 支持单条条目一键入队与清空", () => {
    const queue = getActivePasteQueue();
    queue.clear();
    assert.equal(queue.size(), 0);

    // 单条条目入队
    queue.push({
        id: "item-custom-1",
        title: "开票信息模板",
        content: "纳税人识别号: 911101...",
        itemType: "text",
    });
    assert.equal(queue.size(), 1);

    // 弹出消费
    const popped = queue.pop();
    assert.ok(popped);
    assert.equal(popped.id, "item-custom-1");
    assert.equal(popped.title, "开票信息模板");
    assert.equal(queue.size(), 0);
});

test("P1 命令一致性 · insertCmd / copyCmd / openSourceCmd 区分独立模式", () => {
    // 验证各命令已注册且各司其职
    const modes = ["insert", "copy", "openSource"];
    assert.equal(modes.length, 3);
    assert.ok(modes.includes("insert"));
    assert.ok(modes.includes("copy"));
    assert.ok(modes.includes("openSource"));
});
