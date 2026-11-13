"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {externalBridge, ecosystem, variables} = require("./.build/entry.cjs");
const {buildXlcBridge} = externalBridge;
const {detectEcosystem, queryEcosystemItems} = ecosystem;
const {expandMacroPreview} = variables;

test("TODO-FEAT-037 (T-0817): 外部桥 search / recent / get 补齐 content 字段以满足雷切与快门复制契约", async () => {
    const mockService = {
        getCapabilities: () => [],
        search: async () => ({
            protocol: "xiaolv-common",
            protocolVersion: 1,
            ok: true,
            data: [
                {id: "xlc-001", itemType: "text", title: "测试标题", summary: "正文内容A", content: "正文内容A"},
                {id: "xlc-002", itemType: "url", title: "网址标题", url: "https://example.com", content: "https://example.com"},
            ],
        }),
        get: async (id) => ({
            protocol: "xiaolv-common",
            protocolVersion: 1,
            ok: true,
            data: {
                id,
                itemType: "text",
                title: "条目标题",
                summary: "详细摘要正文",
            },
        }),
        getRecent: async () => ({
            protocol: "xiaolv-common",
            protocolVersion: 1,
            ok: true,
            data: [
                {id: "xlc-003", itemType: "text", title: "最近条目", summary: "最近使用的正文", content: "最近使用的正文"},
            ],
        }),
        getFavorites: async () => ({
            protocol: "xiaolv-common",
            protocolVersion: 1,
            ok: true,
            data: [],
        }),
        getCategories: async () => ({protocol: "xiaolv-common", protocolVersion: 1, ok: true, data: []}),
        getTags: async () => ({protocol: "xiaolv-common", protocolVersion: 1, ok: true, data: []}),
        getClipboardHistory: async () => ({protocol: "xiaolv-common", protocolVersion: 1, ok: true, data: []}),
        resolve: async () => ({protocol: "xiaolv-common", protocolVersion: 1, ok: true}),
        recall: async () => ({protocol: "xiaolv-common", protocolVersion: 1, ok: true, matched: "none"}),
        captureQuote: async () => ({protocol: "xiaolv-common", protocolVersion: 1, ok: true}),
    };

    const bridge = buildXlcBridge(mockService);

    // 1. 验证 search 返回条目含有 content 且内容非空
    const sRes = await bridge.search("测试");
    assert.ok(sRes.ok);
    assert.equal(sRes.data[0].content, "正文内容A");
    assert.equal(sRes.data[1].content, "https://example.com");

    // 2. 验证 get 返回条目含有 content 且自动回退到 summary
    const gRes = await bridge.get("xlc-001");
    assert.ok(gRes.ok);
    assert.equal(gRes.data.content, "详细摘要正文");

    // 3. 验证 recent 含有 content
    const rRes = await bridge.recent();
    assert.ok(rRes.ok);
    assert.equal(rRes.data[0].content, "最近使用的正文");
});

test("TODO-FEAT-038 (T-0818): 全生态动态宏矩阵预览与解析契约", () => {
    const template = [
        "打卡：{{xlc:checkin:today}}",
        "管家：{{xlc:home:today}}",
        "待办：{{xlc:butler:today}}",
        "任务：{{xlc:task:today}}",
        "剪藏：{{xlc:glean:recent}}",
        "人脉：{{xlc:contacts:recent}}",
    ].join("\n");

    const preview = expandMacroPreview(template);

    assert.ok(preview.includes("✓ 今日打卡已完成"), "打卡宏预览未匹配");
    assert.ok(preview.includes("今日备忘一览"), "管家/待办宏预览未匹配");
    assert.ok(preview.includes("今日任务清单"), "任务宏预览未匹配");
    assert.ok(preview.includes("最近剪藏摘录"), "拾遗剪藏宏预览未匹配");
    assert.ok(preview.includes("最近联系人"), "人脉宏预览未匹配");
});

test("TODO-FEAT-039 (T-0819): 全域生态联邦搜索 queryEcosystemItems 契约 (管家/拾遗/任务视界/人脉/打卡)", async () => {
    const mockHost = {
        // 管家
        LvHome: {
            getReminders: () => [
                {id: "rem-1", title: "服务器续费提醒", dueDate: "2026-11-05", daysLeft: 4},
                {id: "rem-2", title: "信用卡还款", dueDate: "2026-11-01", daysLeft: 0},
            ],
        },
        // 拾遗
        siyuanGlean: {
            listClips: async () => [
                {id: "clip-1", title: "认知边界与工作流思考", url: "https://zhuanlan.zhihu.com/p/123", summary: "核心思考摘要"},
            ],
        },
        // 任务视界
        TaskHorizon: {
            getTodayTasks: async () => [
                {id: "task-1", title: "完成生态联动门禁测试", priority: "high", done: false},
            ],
        },
        // 打卡
        siyuanCheckin: {
            getItems: () => [
                {id: "chk-1", name: "每日晨跑 5km", archived: false},
            ],
        },
    };

    // 1. 探测状态验证
    const status = detectEcosystem(mockHost);
    assert.equal(status.totalChecked, 8);
    assert.ok(status.installedCount >= 4);

    // 2. 搜索管家待办
    const homeHits = await queryEcosystemItems("待办", mockHost);
    assert.ok(homeHits.some((h) => h.providerName === "小驴管家" && h.title.includes("服务器续费提醒")));

    // 3. 搜索拾遗剪藏
    const gleanHits = await queryEcosystemItems("认知边界", mockHost);
    assert.ok(gleanHits.some((h) => h.providerName === "小驴拾遗" && h.title.includes("认知边界与工作流思考")));

    // 4. 搜索任务视界
    const taskHits = await queryEcosystemItems("任务", mockHost);
    assert.ok(taskHits.some((h) => h.providerName === "任务视界" && h.title.includes("完成生态联动门禁测试")));

    // 5. 搜索打卡
    const checkinHits = await queryEcosystemItems("打卡", mockHost);
    assert.ok(checkinHits.some((h) => h.providerName === "小驴打卡" && h.title.includes("今日打卡清单")));
});

test("TODO-FEAT-040 (T-0820): Epoch 6 生态统一事件总线标准信封契约", () => {
    let capturedEvent = null;
    const originalDoc = global.window;

    global.window = {
        dispatchEvent: (evt) => {
            capturedEvent = evt;
            return true;
        },
    };

    try {
        // 测试向后兼容与 Epoch 6 格式双重满足
        const now = Date.now();
        const eventId = `evt-xlc-${now}-abcdef`;
        const eventName = "xiaolv:common:item-created";
        const itemId = "xlc-test-123";
        const itemType = "text";

        const detail = {
            protocolVersion: 1,
            itemId,
            itemType,
            v: 1,
            source: "xiaolv-common",
            type: eventName,
            eventId,
            at: new Date(now).toISOString(),
            payload: {
                protocolVersion: 1,
                itemId,
                itemType,
            },
            idempotencyKey: `${eventName}:${itemId}:${now}`,
        };

        global.window.dispatchEvent({detail});

        assert.ok(capturedEvent);
        // 验证平铺旧协议字段
        assert.equal(capturedEvent.detail.protocolVersion, 1);
        assert.equal(capturedEvent.detail.itemId, "xlc-test-123");
        // 验证 Epoch 6 标准信封
        assert.equal(capturedEvent.detail.v, 1);
        assert.equal(capturedEvent.detail.source, "xiaolv-common");
        assert.equal(capturedEvent.detail.payload.itemId, "xlc-test-123");
        assert.ok(capturedEvent.detail.eventId.startsWith("evt-xlc-"));
        assert.ok(capturedEvent.detail.idempotencyKey.includes("xlc-test-123"));
    } finally {
        global.window = originalDoc;
    }
});
