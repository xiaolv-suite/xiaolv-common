"use strict";

// R423 · 弹窗大视窗与左侧专属剪贴板快调面板契约验证：
// 1. 桌面端弹窗尺寸放大至 min(1280px, 95vw) × min(880px, 94vh)
// 2. 剪贴板专属面板（.xlc-clip-panel）默认展开并支持折叠（.xlc-clip-panel--collapsed）
// 3. 当前最新剪贴板卡片（.xlc-clip-current-card）与极速动作（⤓ 插入当前、⭐ 存常用、🧼 清洗、📋 复制）
// 4. 剪贴板历史列表（.xlc-clip-history-list）与单项快捷动作
// 5. 存储模型 SearchPrefs 支持 clipPanelCollapsed 持久化记忆

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const dialogTs = fs.readFileSync(path.join(root, "src", "ui", "dialog.ts"), "utf8");
const indexScss = fs.readFileSync(path.join(root, "src", "styles", "index.scss"), "utf8");
const tokensScss = fs.readFileSync(path.join(root, "src", "styles", "tokens-r187.scss"), "utf8");
const storageTs = fs.readFileSync(path.join(root, "src", "model", "storage.ts"), "utf8");

test("R423 · 弹窗大视窗尺寸规格契约", () => {
    // 桌面端 Dialog 初始化宽度应为 1280px 档位，高度为 880px 档位
    assert.match(dialogTs, /width:\s*isMobile\s*\?\s*"100vw"\s*:\s*"min\(1280px,\s*95vw\)"/, "桌面端宽度必须为 min(1280px, 95vw)");
    assert.match(dialogTs, /height:\s*isMobile\s*\?\s*"100dvh"\s*:\s*"min\(880px,\s*94vh\)"/, "桌面端高度必须为 min(880px, 94vh)");

    // 迷你模式退出后恢复的尺寸也必须一致
    assert.match(dialogTs, /containerEl\.style\.width\s*=\s*isMobile\s*\?\s*"100vw"\s*:\s*"min\(1280px,\s*95vw\)"/, "迷你模式退出恢复宽度必须对齐大视窗");
    assert.match(dialogTs, /containerEl\.style\.height\s*=\s*isMobile\s*\?\s*"100dvh"\s*:\s*"min\(880px,\s*94vh\)"/, "迷你模式退出恢复高度必须对齐大视窗");
});

test("R423 · 剪贴板专属面板架构与 DOM 契约", () => {
    // 检查 buildClipPanel 方法声明
    assert.match(dialogTs, /private\s+buildClipPanel\(\):\s*HTMLElement/, "必须包含 buildClipPanel 方法");
    // 检查 renderClipPanelContent 方法声明
    assert.match(dialogTs, /private\s+renderClipPanelContent\(\):\s*void/, "必须包含 renderClipPanelContent 方法");
    // 检查 toggleClipPanelCollapse 方法声明
    assert.match(dialogTs, /private\s+toggleClipPanelCollapse\(/, "必须包含 toggleClipPanelCollapse 方法");
    // 检查桌面端在 bodyWrap 中挂载剪贴板面板
    assert.match(dialogTs, /if\s*\(!isMobile\)\s*\{\s*bodyWrap\.appendChild\(this\.buildClipPanel\(\)\);\s*\}/, "桌面端必须在主体区域挂载剪贴板面板");

    // 核心卡片与操作选择器存在性
    assert.ok(dialogTs.includes("xlc-clip-current-card"), "必须包含当前最新剪贴板卡片");
    assert.ok(dialogTs.includes("xlc-clip-actions-bar"), "必须包含剪贴板极速动作栏");
    assert.ok(dialogTs.includes("xlc-clip-history-list"), "必须包含剪贴板历史记录列表");
    assert.ok(dialogTs.includes("insertClipDirect"), "必须包含直接插入当前文档动作");
    assert.ok(dialogTs.includes("promoteClipToCommon"), "必须包含沉淀存为常用语动作");
    assert.ok(dialogTs.includes("showClipCleanMenu"), "必须包含格式清洗菜单");
});

test("R423 · 剪贴板面板样式与三栏设计契约", () => {
    // index.scss 中必须声明 .xlc-clip-panel 样式与折叠状态
    assert.ok(indexScss.includes(".xlc-clip-panel"), "index.scss 必须声明 .xlc-clip-panel 样式");
    assert.ok(indexScss.includes("&--collapsed"), "必须支持折叠状态 &--collapsed");
    assert.ok(indexScss.includes(".xlc-clip-collapsed-strip"), "必须支持折叠条 .xlc-clip-collapsed-strip");

    // tokens-r187.scss 中必须有三栏比例声明
    assert.ok(tokensScss.includes(".xlc-clip-panel"), "tokens-r187 必须声明 .xlc-clip-panel 宽度");
    assert.ok(tokensScss.includes(".xlc-clip-panel--collapsed"), "tokens-r187 必须声明折叠宽度");

    // 迷你模式下必须隐藏剪贴板面板
    assert.match(indexScss, /\.xlc-pane,\s*\.xlc-clip-panel\s*\{\s*display:\s*none\s*!important;\s*\}/, "迷你悬浮模式下必须隐藏剪贴板面板");
});

test("R423 · 存储模型支持面板折叠偏好跨会话记忆", () => {
    assert.ok(storageTs.includes("clipPanelCollapsed?: boolean;"), "SearchPrefs 必须支持 clipPanelCollapsed 属性");
    assert.ok(storageTs.includes("clipPanelCollapsed: (obj.search !== null"), "normalizeState 必须归一化 clipPanelCollapsed");
});
