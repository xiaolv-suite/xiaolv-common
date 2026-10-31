"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {storage} = require("./.build/entry.cjs");
const {pushClipboardHistory, normalizeState} = storage;

test("pushClipboardHistory: 剪贴板历史暂存栈推入、置顶与去重", () => {
    let list = [];

    // 1. 推入第一条
    list = pushClipboardHistory(list, "第一条剪贴板文本");
    assert.equal(list.length, 1);
    assert.equal(list[0].text, "第一条剪贴板文本");
    assert.ok(list[0].copiedAt > 0);

    // 2. 推入第二条
    list = pushClipboardHistory(list, "第二条剪贴板文本");
    assert.equal(list.length, 2);
    assert.equal(list[0].text, "第二条剪贴板文本");
    assert.equal(list[1].text, "第一条剪贴板文本");

    // 3. 再次推入第一条：去重并重新置顶
    list = pushClipboardHistory(list, "第一条剪贴板文本");
    assert.equal(list.length, 2);
    assert.equal(list[0].text, "第一条剪贴板文本");
    assert.equal(list[1].text, "第二条剪贴板文本");
});

test("pushClipboardHistory: 长度防御与垃圾数据过滤", () => {
    let list = [];

    // 空串或单字不过滤入栈
    list = pushClipboardHistory(list, "");
    assert.equal(list.length, 0);

    list = pushClipboardHistory(list, "   ");
    assert.equal(list.length, 0);

    list = pushClipboardHistory(list, "a");
    assert.equal(list.length, 0);

    // 超过 8000 字符超大文本不进入暂存栈
    const giant = "X".repeat(8500);
    list = pushClipboardHistory(list, giant);
    assert.equal(list.length, 0);

    // 合法文本正常进入
    list = pushClipboardHistory(list, "合法剪贴板文本");
    assert.equal(list.length, 1);
});

test("pushClipboardHistory: 容量上限 FIFO 先进先出自动淘汰", () => {
    let list = [];
    const MAX = 5;

    for (let i = 1; i <= 10; i++) {
        list = pushClipboardHistory(list, `文本条目 ${i}`, MAX);
    }

    assert.equal(list.length, MAX);
    // 最新一条在最前
    assert.equal(list[0].text, "文本条目 10");
    assert.equal(list[MAX - 1].text, "文本条目 6");
});

test("normalizeState: 剪贴板历史安全归一化", () => {
    const raw = {
        clipboardHistory: [
            {text: "有效暂存 1", copiedAt: 1000},
            {text: "有效暂存 1", copiedAt: 2000}, // 重复项
            {text: "", copiedAt: 3000}, // 空项
            null, // 坏值
            {text: "有效暂存 2", copiedAt: -1}, // 非法时间
            {text: "有效暂存 3", copiedAt: 4000},
        ],
    };

    const state = normalizeState(raw);
    assert.ok(Array.isArray(state.clipboardHistory));
    assert.equal(state.clipboardHistory.length, 2);
    assert.equal(state.clipboardHistory[0].text, "有效暂存 1");
    assert.equal(state.clipboardHistory[1].text, "有效暂存 3");
});

test("service: getClipboardHistory 读取状态中的剪贴板历史", async () => {
    const {service, library, ai, providers} = require("./.build/entry.cjs");
    const lib = new library.LibraryService({
        request: () => Promise.resolve(null),
    });
    const state = normalizeState({
        clipboardHistory: [
            {text: "剪贴板条目测试", copiedAt: 123456789},
        ],
    });
    const s = new service.XiaolvCommonService({
        library: lib,
        executor: {},
        registry: new providers.ProviderRegistry(),
        ai: new ai.AiAssistant({request: async () => ({code: 0, data: null})}, state.ai),
        state,
        onStateChange: () => {},
    });
    const res = await s.getClipboardHistory();
    assert.equal(res.ok, true);
    assert.equal(res.data.length, 1);
    assert.equal(res.data[0].text, "剪贴板条目测试");
});

test("normalizeState: 剪贴板历史采集默认开启，支持设置容量上限（默认30，最高100），显式false时关闭", () => {
    const def = normalizeState({
        clipboardHistory: [{text: "已有记录不丢失", copiedAt: 100}],
    });
    assert.equal(def.clipboardHistoryEnabled, true, "未显式关闭时默认必须为 true");
    assert.equal(def.clipboardHistoryLimit, 30, "未显式指定上限时默认必须为 30");
    assert.equal(def.clipboardHistory.length, 1, "不得删除用户已有历史数据");

    const closed = normalizeState({
        clipboardHistoryEnabled: false,
        clipboardHistory: [{text: "已有记录不丢失", copiedAt: 100}],
    });
    assert.equal(closed.clipboardHistoryEnabled, false);

    // 容量上限边界（上限 100 钳制，下限 10）
    const cap100 = normalizeState({ clipboardHistoryLimit: 150 });
    assert.equal(cap100.clipboardHistoryLimit, 100, "超过 100 自动钳制到 100");

    const cap50 = normalizeState({ clipboardHistoryLimit: 50 });
    assert.equal(cap50.clipboardHistoryLimit, 50);

    const capLow = normalizeState({ clipboardHistoryLimit: 5 });
    assert.equal(capLow.clipboardHistoryLimit, 10, "小于 10 自动钳制到 10");
});
