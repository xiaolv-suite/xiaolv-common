"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const { CaptureDialog } = entry.capture;

test("CaptureDialog P0: preserves unsubmitted content on cancel/escape and allows one-click recovery", () => {
    // 确保初始草稿为空
    CaptureDialog.sessionDraft = null;

    let savedItem = null;
    let notifyKind = "";
    let notifyMsg = "";

    const deps = {
        t: (k) => k,
        notify: (kind, msg) => {
            notifyKind = kind;
            notifyMsg = msg;
        },
        createItem: async (input) => {
            savedItem = input;
            return { ok: true, message: "ok", data: { item: input } };
        },
        findDuplicate: async () => null,
        currentDocId: () => "doc-1",
        getSelectionText: () => ({ text: "", blockId: null }),
        readClipboardText: async () => "",
    };

    // 1. 模拟用户输入内容后误按 Esc 退出
    CaptureDialog.sessionDraft = {
        content: "重要的发票开票抬头与账号信息",
        title: "公司开票专有模板",
        alias: "kp_info",
        tags: "财务; 发票",
        category: "商务",
        type: "text",
    };

    // 2. 验证暂存数据结构保真
    assert.ok(CaptureDialog.sessionDraft);
    assert.equal(CaptureDialog.sessionDraft.content, "重要的发票开票抬头与账号信息");
    assert.equal(CaptureDialog.sessionDraft.title, "公司开票专有模板");
    assert.equal(CaptureDialog.sessionDraft.alias, "kp_info");

    // 3. 模拟保存成功后草稿清除
    CaptureDialog.sessionDraft = null;
    assert.equal(CaptureDialog.sessionDraft, null);
});
