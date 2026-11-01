"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {storage} = require("./.build/entry.cjs");
const {
    normalizeState,
    getClipboardTimeGroup,
    applyCustomOrder,
    reorderItem,
    normalizeCustomItemOrder,
} = storage;

test("TODO-FEAT-011: 主搜索「紧凑单行 / 舒适卡片」视图密度数据模型与状态持久化契约", () => {
    // 1. 默认状态保底为 comfortable
    const stateDefault = normalizeState({});
    assert.equal(stateDefault.search.density, "comfortable");

    // 2. 显式 compact 状态被正确规范化
    const stateCompact = normalizeState({
        search: {
            density: "compact",
        },
    });
    assert.equal(stateCompact.search.density, "compact");

    // 3. 非法值自动回退为 comfortable
    const stateInvalid = normalizeState({
        search: {
            density: "ultra-wide-invalid",
        },
    });
    assert.equal(stateInvalid.search.density, "comfortable");
});

test("TODO-FEAT-012: 剪贴板自然时间分段聚合纯函数契约 (今天/昨天/更早)", () => {
    // 设定一个固定的模拟当前时间：2026-11-01 14:00:00
    const mockNow = new Date("2026-11-01T14:00:00.000Z").getTime();
    const nowDate = new Date(mockNow);
    const todayStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();

    // 1. 今天产生的记录（如今天早晨 09:00）
    const todayClip = todayStart + 9 * 3600 * 1000;
    assert.equal(getClipboardTimeGroup(todayClip, mockNow), "today");

    // 2. 昨天产生的记录（如昨天下午 15:00）
    const yesterdayClip = todayStart - 5 * 3600 * 1000;
    assert.equal(getClipboardTimeGroup(yesterdayClip, mockNow), "yesterday");

    // 3. 3天前产生的记录
    const earlierClip = todayStart - 3 * 24 * 3600 * 1000;
    assert.equal(getClipboardTimeGroup(earlierClip, mockNow), "earlier");

    // 4. 非法时间戳保护
    assert.equal(getClipboardTimeGroup(0, mockNow), "earlier");
    assert.equal(getClipboardTimeGroup(-1000, mockNow), "earlier");
    assert.equal(getClipboardTimeGroup(NaN, mockNow), "earlier");
});

test("TODO-FEAT-013: 条目自定义手动排序权重与重排算法契约 (applyCustomOrder / reorderItem)", () => {
    const items = [
        {id: "xlc-item-a", title: "条目A"},
        {id: "xlc-item-b", title: "条目B"},
        {id: "xlc-item-c", title: "条目C"},
        {id: "xlc-item-d", title: "条目D"},
    ];

    // 1. 空权重字典保持原顺序
    const sortedDefault = applyCustomOrder(items, {});
    assert.deepEqual(sortedDefault.map((i) => i.id), ["xlc-item-a", "xlc-item-b", "xlc-item-c", "xlc-item-d"]);

    // 2. 指定权重字典重排
    const customOrder = {
        "xlc-item-c": 10,
        "xlc-item-a": 20,
        "xlc-item-d": 30,
        "xlc-item-b": 40,
    };
    const sorted = applyCustomOrder(items, customOrder);
    assert.deepEqual(sorted.map((i) => i.id), ["xlc-item-c", "xlc-item-a", "xlc-item-d", "xlc-item-b"]);

    // 3. 部分未指定权重的条目保底排在最后
    const partialOrder = {
        "xlc-item-d": 10,
    };
    const sortedPartial = applyCustomOrder(items, partialOrder);
    assert.equal(sortedPartial[0].id, "xlc-item-d");

    // 4. reorderItem 上移测试：将位于第 2 位的 item-a 上移到第 1 位
    const orderAfterUp = reorderItem(sorted, "xlc-item-a", "up", customOrder);
    assert.equal(orderAfterUp["xlc-item-a"], 10);
    assert.equal(orderAfterUp["xlc-item-c"], 20);

    // 5. reorderItem 下移测试：将首位的 item-c 下移到第 2 位
    const orderAfterDown = reorderItem(sorted, "xlc-item-c", "down", customOrder);
    assert.equal(orderAfterDown["xlc-item-a"], 10);
    assert.equal(orderAfterDown["xlc-item-c"], 20);

    // 6. 边界越界保护：首位再上移、末位再下移不产生破坏
    const boundaryUp = reorderItem(sorted, "xlc-item-c", "up", customOrder);
    assert.deepEqual(boundaryUp, customOrder);
    const boundaryDown = reorderItem(sorted, "xlc-item-b", "down", customOrder);
    assert.deepEqual(boundaryDown, customOrder);

    // 7. normalizeCustomItemOrder 校验规范化
    const rawOrder = {
        "xlc-item-1": 10.5,
        "invalid-id": 20,
        "xlc-item-2": "not-number",
    };
    const normalized = normalizeCustomItemOrder(rawOrder);
    assert.deepEqual(normalized, {"xlc-item-1": 11});
});
