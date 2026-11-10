"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const indexScss = fs.readFileSync(path.join(root, "src", "styles", "index.scss"), "utf8");
const syncDiffTs = fs.readFileSync(path.join(root, "src", "ui", "sync-diff-modal.ts"), "utf8");
const varFormTs = fs.readFileSync(path.join(root, "src", "ui", "variable-form.ts"), "utf8");
const exportSanitizerTs = fs.readFileSync(path.join(root, "src", "ui", "export-sanitizer-modal.ts"), "utf8");

test("UI/UX Pro Max · 同步比对统计卡片 aria-pressed 状态机与键盘激活", () => {
    // 1. 骨架 HTML 中具备 aria-pressed 属性绑定
    assert.match(syncDiffTs, /aria-pressed="\$\{isPress\(null\)\}"/);
    assert.match(syncDiffTs, /aria-pressed="\$\{isPress\("added"\)\}"/);

    // 2. 点击与键盘 Enter/Space 激发状态同步
    assert.match(syncDiffTs, /c\.setAttribute\("aria-pressed",\s*isAct \? "true" : "false"\);/);
    assert.match(syncDiffTs, /if \(e\.key === "Enter" \|\| e\.key === " "\) \{\s*e\.preventDefault\(\);\s*toggleCard\(\);/);
});

test("UI/UX Pro Max · 变量填充卡快捷胶囊与多选胶囊 aria-pressed 与 aria-label", () => {
    // 快捷选项单选胶囊
    assert.match(varFormTs, /optBtn\.setAttribute\("aria-label",\s*optBtn\.title\);/);
    assert.match(varFormTs, /optBtn\.setAttribute\("aria-pressed",\s*isPicked \? "true" : "false"\);/);
    assert.match(varFormTs, /pill\.setAttribute\("aria-pressed",\s*isPicked \? "true" : "false"\);/);

    // 多选复选胶囊
    assert.match(varFormTs, /optBtn\.setAttribute\("aria-label",\s*optBtn\.title\);/);
    assert.match(varFormTs, /optBtn\.setAttribute\("aria-pressed",\s*isSelected \? "true" : "false"\);/);
    assert.match(varFormTs, /optBtn\.setAttribute\("aria-pressed",\s*"false"\);/);
    assert.match(varFormTs, /optBtn\.setAttribute\("aria-pressed",\s*"true"\);/);
});

test("UI/UX Pro Max · 导出脱敏表单 aria-label 标签与 Ctrl+Enter 快捷提交", () => {
    assert.match(exportSanitizerTs, /aria-label="脱敏策略模式"/);
    assert.match(exportSanitizerTs, /aria-label="过滤大陆 11 位手机号码"/);
    assert.match(exportSanitizerTs, /aria-label="过滤电子邮箱地址"/);
    assert.match(exportSanitizerTs, /aria-label="过滤 18 位身份证号码"/);
    assert.match(exportSanitizerTs, /aria-label="过滤 API 密钥与 Bearer Token"/);
    assert.match(exportSanitizerTs, /aria-label="自定义字面替换词典"/);

    // Ctrl+Enter / Cmd+Enter 快捷保存
    assert.match(exportSanitizerTs, /if \(\(e\.ctrlKey \|\| e\.metaKey\) && e\.key === "Enter"\) \{\s*if \(e\.repeat\) return;\s*e\.preventDefault\(\);\s*doConfirm\(\);/);
});

test("UI/UX Pro Max · 同步卡片与变量胶囊 focus-visible 与数据语义色解耦", () => {
    // 同步卡片焦点与微触觉反馈
    assert.match(indexScss, /\.xlc-summary-card\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);
    assert.match(indexScss, /\.xlc-summary-card\s*\{[\s\S]*?&:active\s*\{[\s\S]*?transform:\s*scale\(0\.97\);/);

    // 数据语义色解耦：正向新增使用 --xlc-data-accent
    assert.match(indexScss, /&\.xlc-card-added \.xlc-card-value\s*\{\s*color:\s*var\(--xlc-data-accent\);\s*\}/);

    // 变量胶囊 focus-visible 与 active 反馈
    assert.match(indexScss, /\.xlc-quick-option-pill\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);
    assert.match(indexScss, /\.xlc-multi-option-pill\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);
});
