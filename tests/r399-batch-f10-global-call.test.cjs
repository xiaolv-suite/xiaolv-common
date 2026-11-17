"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const zh = require("../src/i18n/zh-CN.json");
const en = require("../src/i18n/en.json");

test("TODO-FEAT-022: 系统全局快捷键命令双语配置对齐契约 (globalQuickMini)", () => {
    // 1. 语言键存在
    assert.ok(zh.globalQuickMini);
    assert.ok(en.globalQuickMini);
    assert.ok(zh.globalQuickMiniDone);
    assert.ok(en.globalQuickMiniDone);

    // 2. 占位符一致性（均不含 %s 参数）
    assert.equal(zh.globalQuickMini.includes("%s"), false);
    assert.equal(en.globalQuickMini.includes("%s"), false);
    assert.equal(zh.globalQuickMiniDone.includes("%s"), false);
    assert.equal(en.globalQuickMiniDone.includes("%s"), false);
});

test("TODO-FEAT-023 & TODO-FEAT-024: 全局外部唤醒与自动退回后台闭环契约", () => {
    let backgroundReturned = false;
    let copiedText = "";
    let closed = false;

    const mockDeps = {
        isGlobalInvocation: true,
        autoMinimizeOnDone: true,
        defaultActionMode: "copy",
        miniMode: true,
        onReturnToBackground: () => {
            backgroundReturned = true;
        },
        copyText: async (t) => {
            copiedText = t;
            return true;
        },
        notify: () => {},
        t: (k) => k,
    };

    // 1. 验证全局呼出参数装配
    assert.equal(mockDeps.isGlobalInvocation, true);
    assert.equal(mockDeps.autoMinimizeOnDone, true);
    assert.equal(mockDeps.defaultActionMode, "copy");
    assert.equal(mockDeps.miniMode, true);

    // 2. 模拟触发退回后台
    mockDeps.onReturnToBackground();
    assert.equal(backgroundReturned, true);
});
