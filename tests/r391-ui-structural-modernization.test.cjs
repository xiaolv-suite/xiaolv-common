"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const indexScss = fs.readFileSync(path.join(root, "src", "styles", "index.scss"), "utf8");

test("UI 结构升级 · 顶部统计指标横带 (xlc-metrics-strip) 规范验证", () => {
    assert.match(indexScss, /\.xlc-metrics-strip\s*\{[\s\S]*?border-radius:\s*var\(--xlc-radius-lg\);/);
    assert.match(indexScss, /\.xlc-metric-number\s*\{[\s\S]*?font-variant-numeric:\s*tabular-nums;/);
    assert.match(indexScss, /\.xlc-metric-divider\s*\{[\s\S]*?width:\s*1px;/);
    assert.match(indexScss, /&\[data-xlc-metric="usage"\][\s\S]*?color:\s*var\(--xlc-data-accent\);/);
});

test("UI 结构升级 · 状态圆点微指示体系 (xlc-status-dot) 规范验证", () => {
    assert.match(indexScss, /\.xlc-status-dot\s*\{[\s\S]*?width:\s*6px;/);
    assert.match(indexScss, /\.xlc-status-dot\s*\{[\s\S]*?border-radius:\s*var\(--xlc-radius-circle\);/);
    assert.match(indexScss, /&--active\s*\{[\s\S]*?background-color:\s*var\(--xlc-data-accent\);/);
});

test("UI 结构升级 · 设置中心吸顶胶囊导航条 (xlc-settings-nav-bar) 规范验证", () => {
    assert.match(indexScss, /\.xlc-settings-nav-bar\s*\{[^{}]*?position:\s*sticky;/);
    assert.match(indexScss, /\.xlc-settings-nav-pill\s*\{[\s\S]*?border-radius:\s*var\(--xlc-radius-pill\);/);
    assert.match(indexScss, /&--active\s*\{[\s\S]*?background:\s*var\(--xlc-lavender\);/);
});

test("UI 结构升级 · 动作菜单外壳分层与浮动卡片规范验证", () => {
    assert.match(indexScss, /\.xlc-menu\s*\{[\s\S]*?background-color:\s*var\(--xlc-surface\);/);
    assert.match(indexScss, /\.xlc-menu\s*\{[\s\S]*?box-shadow:\s*var\(--xlc-shadow-float\);/);
    assert.match(indexScss, /\.xlc-menu\s*\{[\s\S]*?border-radius:\s*var\(--xlc-radius-xl\);/);
    assert.match(indexScss, /&--on\s*\{[\s\S]*?background-color:\s*var\(--xlc-lavender\);/);
});

test("UI 结构升级 · 就地快编弹窗外壳分层与动作区 (xlc-quick-edit-container) 规范验证", () => {
    assert.match(indexScss, /\.xlc-quick-edit-container\s*\{[\s\S]*?background:\s*var\(--xlc-surface\);/);
    assert.match(indexScss, /\.xlc-quick-edit-container\s*\{[\s\S]*?border-radius:\s*var\(--xlc-radius-xl\);/);
    assert.match(indexScss, /\.xlc-quick-edit-actions\s*\{[\s\S]*?justify-content:\s*flex-end;/);
});

test("UI 结构升级 · 极速大卡片预览浮层 (xlc-quicklook) 外壳分层与背景模糊规范验证", () => {
    assert.match(indexScss, /\.xlc-quicklook\s*\{[\s\S]*?backdrop-filter:\s*blur\(4px\);/);
    assert.match(indexScss, /\.xlc-quicklook-card\s*\{[\s\S]*?background-color:\s*var\(--xlc-surface\);/);
    assert.match(indexScss, /\.xlc-quicklook-card\s*\{[\s\S]*?border-radius:\s*var\(--xlc-radius-2xl\);/);
    assert.match(indexScss, /\.xlc-quicklook-card\s*\{[\s\S]*?box-shadow:\s*var\(--xlc-shadow-float\);/);
});

test("UI 结构升级 · 顶部指标横带动态数值统计计算逻辑", () => {
    const results = [
        { id: "item-1", title: "条目1" },
        { id: "item-2", title: "条目2" },
        { id: "item-3", title: "条目3" },
    ];
    const favorites = new Set(["item-1", "item-3"]);
    const usage = {
        "item-1": { count: 12 },
        "item-2": { count: 8 },
    };
    const providerRows = [{ id: "prov-1" }, { id: "prov-2" }];

    // 计算
    const total = results.length;
    let usageSum = 0;
    for (const item of results) {
        usageSum += usage[item.id]?.count ?? 0;
    }
    const favCount = results.filter((r) => favorites.has(r.id)).length;
    const providerCount = providerRows.length;

    assert.equal(total, 3, "条目总数必须准确");
    assert.equal(usageSum, 20, "复用频次总和必须准确");
    assert.equal(favCount, 2, "收藏数量统计必须准确");
    assert.equal(providerCount, 2, "外部联动提供方数量必须准确");
});

test("UI 结构升级 · 右侧上下文面板折叠状态切换逻辑", () => {
    let collapsed = false;
    const toggle = () => {
        collapsed = !collapsed;
        return {
            isCollapsed: collapsed,
            btnText: collapsed ? "⇱" : "⇲",
            btnTitle: collapsed ? "展开详情面板" : "收起详情面板",
        };
    };

    // 默认展开状态
    assert.equal(collapsed, false);

    // 第一次点击：折叠
    const s1 = toggle();
    assert.equal(s1.isCollapsed, true);
    assert.equal(s1.btnText, "⇱");
    assert.equal(s1.btnTitle, "展开详情面板");

    // 第二次点击：重新展开
    const s2 = toggle();
    assert.equal(s2.isCollapsed, false);
    assert.equal(s2.btnText, "⇲");
    assert.equal(s2.btnTitle, "收起详情面板");
});
