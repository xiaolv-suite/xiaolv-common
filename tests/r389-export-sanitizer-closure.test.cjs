"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const { openSanitizerOptionsDialog, renderSanitizerOptionsModal } = entry.exportSanitizerModal || entry;

test("SanitizerModal · 脱敏配置弹窗参数提取与确认闭环", async () => {
    let confirmedOptions = null;
    let cancelled = false;

    const modal = renderSanitizerOptionsModal({
        initialOptions: {
            mode: "placeholder",
            sanitizePhones: true,
            sanitizeEmails: false,
            sanitizeIdCards: true,
            sanitizeTokens: false,
            customReplacements: {
                "内部项目": "机密项目",
            },
        },
        onConfirm: (opts) => {
            confirmedOptions = opts;
        },
        onCancel: () => {
            cancelled = true;
        },
    });

    assert.ok(modal.element, "脱敏弹窗必须成功渲染根节点");

    // 验证初始选项提取
    const current = modal.getOptions();
    assert.equal(current.mode, "placeholder", "脱敏模式应为 placeholder");
    assert.equal(current.sanitizePhones, true, "应勾选手机号");
    assert.equal(current.sanitizeEmails, false, "不应勾选邮箱");
    assert.equal(current.sanitizeTokens, false, "不应勾选Token");
    assert.equal(current.customReplacements["内部项目"], "机密项目", "自定义词典应正确解析");

    // 触发确认
    const confirmBtn = modal.element.querySelector(".b3-button--primary");
    assert.ok(confirmBtn, "必须存在确认按钮");
    confirmBtn.click();

    assert.ok(confirmedOptions, "必须触发 onConfirm 回调");
    assert.equal(confirmedOptions.mode, "placeholder");
});
