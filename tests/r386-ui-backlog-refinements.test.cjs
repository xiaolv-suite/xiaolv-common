"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const indexScss = fs.readFileSync(path.join(root, "src", "styles", "index.scss"), "utf8");

test("UI-01 修复验证 · 搜索历史记录栏支持横向单行流动与无缝滚动", () => {
    // 桌面主规则必须是 flex-wrap: nowrap 与 overflow-x: auto
    assert.match(indexScss, /\.xlc-search-history-bar\s*\{[\s\S]*?flex-wrap:\s*nowrap;[\s\S]*?overflow-x:\s*auto;[\s\S]*?\.xlc-history-label/);
});

test("UI-02 修复验证 · 侧栏分类树展开指示符显式光学居中对齐", () => {
    assert.match(indexScss, /\.xlc-dock-group-arrow[\s\S]*display:\s*inline-flex;/);
    assert.match(indexScss, /\.xlc-dock-group-arrow[\s\S]*vertical-align:\s*middle;/);
});

test("UI-03 修复验证 · 变量填充多选胶囊采用通透薰衣草色高亮与柔和边框", () => {
    assert.match(indexScss, /\.xlc-multi-option-pill[\s\S]*&--selected[\s\S]*background-color:\s*var\(--xlc-lavender\)/);
    assert.match(indexScss, /\.xlc-multi-option-pill[\s\S]*&--selected[\s\S]*color:\s*var\(--xlc-accent-text\)/);
});

test("UI-04 修复验证 · 发现状态行与操作间距收敛至 8px 标准栅格", () => {
    assert.match(indexScss, /\.xlc-discovery-status-row[\s\S]*gap:\s*var\(--xlc-space-2\);/);
});
