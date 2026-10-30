"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const indexScss = fs.readFileSync(path.join(root, "src", "styles", "index.scss"), "utf8");
const dialogTs = fs.readFileSync(path.join(root, "src", "ui", "dialog.ts"), "utf8");
const settingsTs = fs.readFileSync(path.join(root, "src", "ui", "settings-dialog.ts"), "utf8");
const captureTs = fs.readFileSync(path.join(root, "src", "ui", "capture.ts"), "utf8");
const zhCn = JSON.parse(fs.readFileSync(path.join(root, "src", "i18n", "zh-CN.json"), "utf8"));
const enUs = JSON.parse(fs.readFileSync(path.join(root, "src", "i18n", "en.json"), "utf8"));

test("UI/UX Pro Max · 指标横带与面板折叠国际化字典与 ARIA 规范", () => {
    // 1. 字典完备性断言
    const requiredKeys = ["metricTotal", "metricUsage", "metricFav", "metricProviders", "paneExpand", "paneCollapse"];
    for (const key of requiredKeys) {
        assert.ok(zhCn[key], `zh-CN 必须包含 ${key}`);
        assert.ok(enUs[key], `en 必须包含 ${key}`);
    }

    // 2. dialog.ts 源码中 aria-label 与 aria-expanded 属性绑定
    assert.match(dialogTs, /collapseBtn\.setAttribute\("aria-label",\s*titleCollapse\);/);
    assert.match(dialogTs, /collapseBtn\.setAttribute\("aria-expanded",\s*"true"\);/);
    assert.match(dialogTs, /collapseBtn\.setAttribute\("aria-expanded",\s*String\(!isCollapsed\)\);/);
});

test("UI/UX Pro Max · 设置中心吸顶胶囊导航 Tablist / Tab 语义与状态对齐", () => {
    assert.match(settingsTs, /navBar\.setAttribute\("role",\s*"tablist"\);/);
    assert.match(settingsTs, /navBar\.setAttribute\("aria-label",\s*"设置分区导航"\);/);
    assert.match(settingsTs, /pill\.setAttribute\("role",\s*"tab"\);/);
    assert.match(settingsTs, /pill\.setAttribute\("aria-selected",\s*isActive \? "true" : "false"\);/);
    assert.match(settingsTs, /pill\.setAttribute\("aria-controls",\s*tab\.id\);/);
    assert.match(settingsTs, /p\.setAttribute\("aria-selected",\s*"false"\);/);
    assert.match(settingsTs, /pill\.setAttribute\("aria-selected",\s*"true"\);/);
});

test("UI/UX Pro Max · 触控靶点、可见焦点轮廓 (:focus-visible) 规范断言", () => {
    // 折叠按钮具备 24x24 最小触控靶点与 focus-visible
    assert.match(indexScss, /\.xlc-pane-collapse-btn\s*\{[\s\S]*?min-width:\s*24px;/);
    assert.match(indexScss, /\.xlc-pane-collapse-btn\s*\{[\s\S]*?min-height:\s*24px;/);
    assert.match(indexScss, /\.xlc-pane-collapse-btn\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);

    // 设置导航胶囊具备 focus-visible
    assert.match(indexScss, /\.xlc-settings-nav-pill\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);
});

test("UI/UX Pro Max · 指标横带自适应微阴影、字距排版与减弱动效偏好", () => {
    // 自适应阴影与字距
    assert.match(indexScss, /\.xlc-metrics-strip\s*\{[\s\S]*?box-shadow:\s*var\(--xlc-shadow-sm\);/);
    assert.match(indexScss, /\.xlc-metrics-strip\s*\{[\s\S]*?user-select:\s*none;/);
    assert.match(indexScss, /\.xlc-metric-number\s*\{[\s\S]*?letter-spacing:\s*-0\.02em;/);
    assert.match(indexScss, /\.xlc-metric-label\s*\{[\s\S]*?letter-spacing:\s*0\.02em;/);

    // prefers-reduced-motion 降级
    assert.match(indexScss, /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\.xlc-pane[\s\S]*?transition:\s*none !important;/);
});

test("UI/UX Pro Max · 捕获表单按键长按防并发与提供方互斥锁", () => {
    // capture.ts submitOnEnter 与 form keydown repeat 阻断
    assert.match(captureTs, /ev\.isComposing \|\| ev\.keyCode === 229 \|\| ev\.repeat/);
    assert.match(captureTs, /ev\.isComposing \|\| \(ev as KeyboardEvent\)\.keyCode === 229 \|\| \(ev as KeyboardEvent\)\.repeat/);

    // dialog.ts activeProvider 互斥锁
    assert.match(dialogTs, /if \(this\.activeProvider >= 0\) \{\s*if \(this\.primaryBusy\) return;\s*this\.primaryBusy = true;/);
});
