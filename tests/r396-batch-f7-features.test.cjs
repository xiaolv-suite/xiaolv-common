"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {storage, clipboard} = require("./.build/entry.cjs");
const {normalizeState} = storage;
const {mergeTrayContents} = clipboard;

test("TODO-FEAT-017: 主搜索极窄悬浮迷你模式数据模型与持久化契约 (miniMode)", () => {
    // 1. 默认状态为 false
    const stateDefault = normalizeState({});
    assert.equal(stateDefault.search.miniMode, false);

    // 2. 显式 true 保持
    const stateMini = normalizeState({
        search: {
            miniMode: true,
        },
    });
    assert.equal(stateMini.search.miniMode, true);

    // 3. 非布尔值安全回退
    const stateInvalid = normalizeState({
        search: {
            miniMode: "invalid-string",
        },
    });
    assert.equal(stateInvalid.search.miniMode, false);
});

test("TODO-FEAT-018: 常用语购物车暂存托盘批量合并拼接纯函数契约 (mergeTrayContents)", () => {
    // 1. 空数组返回空串
    assert.equal(mergeTrayContents([]), "");

    // 2. 单项原样输出并去除多余首尾换行
    const single = [{content: "  单项常用语内容  "}];
    assert.equal(mergeTrayContents(single), "单项常用语内容");

    // 3. 多项按序以双换行拼接，保留内部结构，自动过滤纯空白项
    const items = [
        {content: "段落一：尊敬的客户您好"},
        {content: "   "},
        {content: "段落二：关于您咨询的问题已处理完毕"},
        {content: "段落三：如有疑问请随时联系我们"},
    ];
    const merged = mergeTrayContents(items);
    const expected = "段落一：尊敬的客户您好\n\n段落二：关于您咨询的问题已处理完毕\n\n段落三：如有疑问请随时联系我们";
    assert.equal(merged, expected);

    // 4. 不变性与容错保护
    assert.equal(mergeTrayContents([null, undefined, {content: ""}]), "");
});
