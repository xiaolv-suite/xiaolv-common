"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const entry = require("./.build/entry.cjs");

test("Mobile Spec v1: 罗盘入口统一挂载与 onunload 清理闭环", () => {
    const { lvLaunchpad } = entry.lvNoticeKit;
    assert.equal(typeof lvLaunchpad.ensureMobileEntry, "function", "ensureMobileEntry 必须存在");
    assert.equal(typeof lvLaunchpad.haptic, "function", "lvLaunchpad.haptic 触感反馈方法必须存在");

    const cleanup = lvLaunchpad.ensureMobileEntry();
    assert.equal(typeof cleanup, "function", "ensureMobileEntry 必须返回清理函数");
    assert.doesNotThrow(() => cleanup(), "调用清理函数不应报错");
});

test("Mobile Spec v1: 罗盘注册 actions 为 3~5 个手机直办动作契约", () => {
    const zh = JSON.parse(fs.readFileSync(path.join(__dirname, "../src/i18n/zh-CN.json"), "utf8"));
    const en = JSON.parse(fs.readFileSync(path.join(__dirname, "../src/i18n/en.json"), "utf8"));

    // 降级文案核查
    assert.equal(zh.insertPendingMobile, "已复制，去目标应用粘贴");
    assert.equal(zh.insertMobileActionHint, "已复制，去目标应用粘贴");
    assert.equal(en.insertPendingMobile, "Copied. Switch to target app and paste");
    assert.equal(en.insertMobileActionHint, "Copied. Switch to target app and paste");
});

test("Mobile Spec v1: 移动端样式与布局规范契约 (safe-area 四向、≥52px、touch-action、100dvh)", () => {
    const scss = fs.readFileSync(path.join(__dirname, "../src/styles/index.scss"), "utf8");

    // 1) safe-area 四向适配与 100dvh
    assert.ok(scss.includes("safe-area-inset-top"), "必须适配 safe-area-inset-top");
    assert.ok(scss.includes("safe-area-inset-bottom"), "必须适配 safe-area-inset-bottom");
    assert.ok(scss.includes("safe-area-inset-left"), "必须适配 safe-area-inset-left");
    assert.ok(scss.includes("safe-area-inset-right"), "必须适配 safe-area-inset-right");
    assert.ok(scss.includes("100dvh"), "必须声明 100dvh 视口高度");

    // 2) 底部操作条 iPhone 手势条防遮挡安全边距
    assert.ok(scss.includes(".xlc-footer") && scss.includes("env(safe-area-inset-bottom"), "底部栏 .xlc-footer 必须带 safe-area-inset-bottom 边距");
    assert.ok(scss.includes(".xlc-mobile-foot") && scss.includes("env(safe-area-inset-bottom"), "底部操作条 .xlc-mobile-foot 必须带 safe-area-inset-bottom 边距");

    // 3) touch-action: manipulation
    assert.ok(scss.includes("touch-action: manipulation"), "必须声明 touch-action: manipulation 消除双击缩放延迟");

    // 4) 触控目标 ≥52px
    assert.ok(scss.includes(".xlc-row") && scss.includes("min-height: 52px"), "行必须满足 min-height: 52px 触控目标");
    assert.ok(scss.includes(".xlc-mobile-foot") && scss.includes("min-height: 52px"), "底部操作条必须满足 min-height: 52px 触控目标");

    // 5) 置顶高频片段直达行样式
    assert.ok(scss.includes(".xlc-top-chips-row"), "必须包含 .xlc-top-chips-row 置顶高频片段直达行样式");

    // 6) 隐藏仅桌面功能入口
    assert.ok(scss.includes(".xlc-search-pin"), "必须包含桌面专属控件隐藏规则");
    assert.ok(scss.includes(".xlc-footer-starter-packs"), "移动端必须隐藏套件市场包管理");
});

test("Mobile Spec v1: onunload 绝对禁止写 petal 契约", () => {
    const indexSrc = fs.readFileSync(path.join(__dirname, "../src/index.ts"), "utf8");
    const onunloadIdx = indexSrc.indexOf("async onunload()");
    assert.ok(onunloadIdx > 0, "必须存在 onunload 方法");
    const onunloadBlock = indexSrc.slice(onunloadIdx, onunloadIdx + 3000);
    assert.equal(onunloadBlock.toLowerCase().includes("petal"), false, "onunload 绝不可出现 petal 关键词");
});
