"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
    pasteQueue,
    clipboardCleaner,
} = require("./.build/entry.cjs");

const {PasteQueue, getActivePasteQueue} = pasteQueue;
const {formatJsonText, compactJsonText} = clipboardCleaner;

test("PasteQueue: FIFO sequential paste queue lifecycle", () => {
    const queue = new PasteQueue();
    assert.equal(queue.size(), 0);
    assert.equal(queue.pop(), undefined);

    queue.setQueue([
        {id: "1", title: "姓名", content: "张三"},
        {id: "2", title: "银行卡号", content: "6222000011112222"},
        {id: "3", title: "开户行", content: "招商银行"},
    ]);

    assert.equal(queue.size(), 3);
    assert.equal(queue.peek()?.title, "姓名");

    // 1. 弹出第 1 项
    const item1 = queue.pop();
    assert.equal(item1?.title, "姓名");
    assert.equal(item1?.content, "张三");
    assert.equal(queue.size(), 2);

    // 2. 弹出第 2 项
    const item2 = queue.pop();
    assert.equal(item2?.title, "银行卡号");
    assert.equal(item2?.content, "6222000011112222");
    assert.equal(queue.size(), 1);

    // 3. 追加新项
    queue.add({id: "4", title: "金额", content: "100.00"});
    assert.equal(queue.size(), 2);

    // 4. 继续弹出
    const item3 = queue.pop();
    assert.equal(item3?.title, "开户行");
    const item4 = queue.pop();
    assert.equal(item4?.title, "金额");

    // 5. 队列已空
    assert.equal(queue.size(), 0);
    assert.equal(queue.pop(), undefined);
});

test("formatJsonText: formats composite JSON and safely preserves invalid text", () => {
    const messy = '{"name":"xiaolv","tags":["common","tool"],"enabled":true}';
    const formatted = formatJsonText(messy);
    assert.equal(formatted.formatted, true);
    assert.ok(formatted.result.includes('\n  "name": "xiaolv"'));

    // 非 JSON 安全原样返回
    const nonJson = "普通纯文本非 JSON";
    const res = formatJsonText(nonJson);
    assert.equal(res.formatted, false);
    assert.equal(res.result, nonJson);
});

test("compactJsonText: compacts multi-line JSON into single line", () => {
    const multiLine = [
        "{",
        '  "title": "测试",',
        '  "count": 42',
        "}",
    ].join("\n");

    const compacted = compactJsonText(multiLine);
    assert.equal(compacted.compacted, true);
    assert.equal(compacted.result, '{"title":"测试","count":42}');

    // 非 JSON 安全原样返回
    const bad = "{ bad json }";
    const res = compactJsonText(bad);
    assert.equal(res.compacted, false);
    assert.equal(res.result, bad);
});
