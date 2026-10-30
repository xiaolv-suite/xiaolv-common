"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const indexScss = fs.readFileSync(path.join(root, "src", "styles", "index.scss"), "utf8");
const discoveryTs = fs.readFileSync(path.join(root, "src", "ui", "discovery-dialog.ts"), "utf8");
const captureTs = fs.readFileSync(path.join(root, "src", "ui", "capture.ts"), "utf8");

test("UI/UX Pro Max · 发现中心候选列表上下键盘漫游与首尾跳转导航", () => {
    // 1. 候选卡片支持方向键漫游
    assert.match(discoveryTs, /if \(event\.key === "ArrowDown" \|\| event\.key === "ArrowUp"\)/);
    assert.match(discoveryTs, /const rows = Array\.from\(list\.querySelectorAll<HTMLElement>\("\.xlc-discovery-row"\)\);/);
    assert.match(discoveryTs, /const nextIdx = event\.key === "ArrowDown"/);

    // 2. 候选卡片 Home / End 极值直达
    assert.match(discoveryTs, /if \(event\.key === "Home" \|\| event\.key === "End"\)/);
    assert.match(discoveryTs, /if \(event\.key === "Home"\) rows\[0\]\?\.focus\(\);/);
    assert.match(discoveryTs, /else rows\[rows\.length - 1\]\?\.focus\(\);/);
});

test("UI/UX Pro Max · 标签分面筛选 toolbar 角色、aria-label 与左右轮巡漫游", () => {
    // 1. toolbar 容器角色与语义标签
    assert.match(discoveryTs, /this\.tagFacets\.setAttribute\("role",\s*"toolbar"\);/);
    assert.match(discoveryTs, /this\.tagFacets\.setAttribute\("aria-label",\s*this\.tx\("discoveryTagFacets"\)\);/);

    // 2. 左右方向键漫游与 Home / End
    assert.match(discoveryTs, /if \(e\.key === "ArrowRight" \|\| e\.key === "ArrowLeft"\)/);
    assert.match(discoveryTs, /const buttons = Array\.from\(host\.querySelectorAll<HTMLButtonElement>\("\.xlc-tag-facet"\)\);/);
    assert.match(discoveryTs, /const nextIdx = e\.key === "ArrowRight"\s*\?\s*\(idx \+ 1\) % buttons\.length/);
    assert.match(discoveryTs, /if \(e\.key === "Home" \|\| e\.key === "End"\)/);

    // 3. 分页器控件 aria-label 与语义结构
    assert.match(discoveryTs, /previous\.setAttribute\("aria-label",\s*this\.tx\("discoveryPreviousPage"\)\);/);
    assert.match(discoveryTs, /next\.setAttribute\("aria-label",\s*this\.tx\("discoveryNextPage"\)\);/);
});

test("UI/UX Pro Max · 发现预览区可聚焦滚动、语义角色与全局 Ctrl+Enter 快捷提交", () => {
    // 1. 预览区 region 语义与键盘可聚焦滚动
    assert.match(discoveryTs, /this\.preview\.tabIndex = 0;/);
    assert.match(discoveryTs, /this\.preview\.setAttribute\("role",\s*"region"\);/);
    assert.match(discoveryTs, /this\.preview\.setAttribute\("aria-label",\s*this\.tx\("discoveryPreviewTitle"\)\);/);

    // 2. Ctrl+Enter 快捷保存与长按防抖保护
    assert.match(discoveryTs, /if \(\(e\.ctrlKey \|\| e\.metaKey\) && e\.key === "Enter"\) \{\s*if \(e\.repeat \|\| this\.actionBusy \|\| !this\.addSelectedButton \|\| this\.addSelectedButton\.disabled\) return;/);
    assert.match(discoveryTs, /this\.addSelectedButton\.click\(\);/);
});

test("UI/UX Pro Max · 快速捕获表单控件 htmlFor/id 严格关联与别名胶囊可访问性", () => {
    // 1. 表单字段 label 与 input 关联
    assert.match(captureTs, /const fieldId = `xlc-capture-field-\$\{cls\.replace\(\/\[\^a-z0-9_-\]\/gi, "_"\)\}`;/);
    assert.match(captureTs, /wrap\.htmlFor = fieldId;/);
    assert.match(captureTs, /inputEl\.id = fieldId;/);
    assert.match(captureTs, /inputEl\.setAttribute\("aria-label",\s*label\);/);

    // 2. 类型下拉框 label 与 select 关联
    assert.match(captureTs, /const typeSelectId = "xlc-capture-field-type";/);
    assert.match(captureTs, /typeWrap\.htmlFor = typeSelectId;/);
    assert.match(captureTs, /typeSelect\.id = typeSelectId;/);
    assert.match(captureTs, /typeSelect\.setAttribute\("aria-label",\s*t\("type"\)\);/);

    // 3. 别名与快捷标签胶囊 aria-label
    assert.match(captureTs, /pill\.setAttribute\("aria-label",\s*pill\.title\);/);
});

test("UI/UX Pro Max · 发现中心与捕获表单焦点轮廓与减动效降级规范", () => {
    // 1. 发现候选行焦点环
    assert.match(indexScss, /\.xlc-discovery-row:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);

    // 2. 预览区与分面标签焦点环
    assert.match(indexScss, /\.xlc-discovery-preview-body\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);
    assert.match(indexScss, /\.xlc-tag-facet\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);

    // 3. 捕获快捷胶囊尺寸与焦点环
    assert.match(indexScss, /\.xlc-quick-pill\s*\{[\s\S]*?min-height:\s*24px;[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);

    // 4. prefers-reduced-motion 降级
    assert.match(indexScss, /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\.xlc-discovery-row,[\s\S]*?\.xlc-tag-facet,[\s\S]*?\.xlc-quick-pill[\s\S]*?transition:\s*none !important;/);
});
