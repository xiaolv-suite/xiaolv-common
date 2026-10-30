"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const indexScss = fs.readFileSync(path.join(root, "src", "styles", "index.scss"), "utf8");
const settingsTs = fs.readFileSync(path.join(root, "src", "ui", "settings-dialog.ts"), "utf8");

test("UI/UX Pro Max · AI 自定义变换编辑器 list/listitem 语义与操作按钮可访问属性声明", () => {
    // 1. 变换清单 list 容器角色
    assert.match(settingsTs, /ctList\.className = "xlc-ct-list";/);
    assert.match(settingsTs, /ctList\.setAttribute\("role",\s*"list"\);/);
    assert.match(settingsTs, /ctList\.setAttribute\("aria-label",\s*t\("customTransformSection"\)\);/);

    // 2. 变换项 listitem 角色与删除/添加按钮 aria-label
    assert.match(settingsTs, /row\.setAttribute\("role",\s*"listitem"\);/);
    assert.match(settingsTs, /delBtn\.setAttribute\("aria-label",\s*`\$\{t\("delete"\)\}：\$\{ct\.name\}`\);/);
    assert.match(settingsTs, /addCtBtn\.setAttribute\("aria-label",\s*t\("customTransformAdd"\)\);/);
});

test("UI/UX Pro Max · 内容提供方生态清单 list/listitem 语义结构与状态可访问标签", () => {
    // 1. 提供方清单 list 角色
    assert.match(settingsTs, /provList\.className = "xlc-provider-list";/);
    assert.match(settingsTs, /provList\.setAttribute\("role",\s*"list"\);/);
    assert.match(settingsTs, /provList\.setAttribute\("aria-label",\s*t\("providerSection"\)\);/);

    // 2. 提供方行 listitem 角色与状态无障碍名称
    assert.match(settingsTs, /row\.setAttribute\("role",\s*"listitem"\);/);
    assert.match(settingsTs, /row\.setAttribute\("aria-label",\s*`\$\{p\.record\.displayName\}（v\$\{p\.record\.protocolVersion\}）· \$\{statusLabel\}`\);/);
});

test("UI/UX Pro Max · 变量偏好与复用数据洞察区域可聚焦性与清理动作标签", () => {
    // 1. 清空复用统计按钮 aria-label
    assert.match(settingsTs, /clearBtn\.setAttribute\("aria-label",\s*t\("clearUsageBtn"\)\);/);

    // 2. 复用洞察分析卡片 region 语义与可聚焦性
    assert.match(settingsTs, /insightsBox\.className = "xlc-usage-insights";/);
    assert.match(settingsTs, /insightsBox\.tabIndex = 0;/);
    assert.match(settingsTs, /insightsBox\.setAttribute\("role",\s*"region"\);/);
    assert.match(settingsTs, /insightsBox\.setAttribute\("aria-label",\s*"复用洞察分析"\);/);
});

test("UI/UX Pro Max · 自定义变换操作按钮与数据洞察容器 24px 靶点与焦点环规范", () => {
    // 1. 删除变换按钮 24px 靶点与焦点环
    assert.match(indexScss, /\.xlc-ct-del\s*\{[\s\S]*?min-height:\s*24px;[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);

    // 2. 数据洞察容器高对比度聚焦环
    assert.match(indexScss, /\.xlc-usage-insights\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);
});
