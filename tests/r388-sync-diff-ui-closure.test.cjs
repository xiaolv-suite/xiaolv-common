"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const { openSyncDiffModal } = entry.syncDiffModal || entry;
const { diffLibraries, planLibrarySync } = entry.syncDiff || entry;

function createMockEntry(id, title, kramdown, overrides = {}) {
    return {
        id,
        title,
        kramdown,
        itemType: "text",
        tags: ["common"],
        category: "default",
        createdAt: 1000,
        updatedAt: 1000,
        ...overrides,
    };
}

test("SyncDiffModal · 真实浏览器环境下的 Dialog 挂载与全流程确认合并闭环", async () => {
    const localList = [
        createMockEntry("1", "发票资料", "纳税人识别号: 911101..."),
        createMockEntry("2", "待更新条目", "旧正文"),
    ];
    const remoteList = [
        createMockEntry("1", "发票资料", "纳税人识别号: 911101..."), // 一致
        createMockEntry("2", "待更新条目", "新正文(最新)"), // 更新
        createMockEntry("3", "全新远端条目", "正文内容"), // 新增
    ];

    const report = diffLibraries(localList, remoteList);
    let confirmedReceipt = null;
    let confirmedPlan = null;
    let cancelled = false;

    // 打开比对模态框
    const modal = openSyncDiffModal({
        report,
        localEntries: localList,
        title: "内容库同步差异比对",
        onConfirm: (receipt, plan) => {
            confirmedReceipt = receipt;
            confirmedPlan = plan;
        },
        onCancel: () => {
            cancelled = true;
        },
    });

    assert.ok(modal.element, "模态框必须具备根容器 element");
    assert.equal(modal.getCurrentStrategy(), "smart-merge", "默认合并策略应为 smart-merge");

    // 检查预计计划
    const plan = modal.getCurrentPlan();
    assert.equal(plan.summary.create, 1, "应识别 1 个新增项");
    assert.equal(plan.summary.update, 1, "应识别 1 个更新项");
    assert.equal(plan.summary.noop, 1, "应识别 1 个完全相同项");

    // 模拟确认执行合并
    const receipt = await modal.applySync();
    assert.equal(receipt.success, 3, "合并必须执行成功 3 项");
    assert.equal(receipt.failed, 0, "合并失败项应为 0");
    assert.ok(confirmedReceipt, "必须触发 onConfirm 回调");
    assert.equal(confirmedPlan.summary.create, 1);
});
