"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const tokensScss = fs.readFileSync(path.join(root, "src", "styles", "tokens-r187.scss"), "utf8");
const indexScss = fs.readFileSync(path.join(root, "src", "styles", "index.scss"), "utf8");

test("设计令牌 · 两色分工机制：显式声明数据语义色与操作语义色解耦", () => {
    assert.match(tokensScss, /--xlc-accent:\s*#5e59cb;/);
    assert.match(tokensScss, /--xlc-data-accent:\s*#059669;/);
    assert.match(tokensScss, /--xlc-data-soft:\s*#edf7f2;/);
});

test("设计令牌 · 重点对比块：声明明度 11.5% 左右的主题相近黑对比卡底色与文本", () => {
    assert.match(tokensScss, /--xlc-dark-card:\s*#171622;/);
    assert.match(tokensScss, /--xlc-dark-card-ink:\s*#f1f0f8;/);
});

test("设计令牌 · 不对称动效曲线：声明进入缓出曲线与退出干脆曲线", () => {
    assert.match(tokensScss, /--xlc-ease-in:\s*cubic-bezier\(0\.16,\s*1,\s*0\.3,\s*1\);/);
    assert.match(tokensScss, /--xlc-ease-out:\s*cubic-bezier\(0\.4,\s*0,\s*1,\s*1\);/);
});

test("设计令牌 · 多层近远叠加软阴影与白卡浮动层", () => {
    assert.match(tokensScss, /--xlc-shadow-float:\s*0\s+2px\s+4px\s+rgba\(41,\s*34,\s*72,\s*0\.03\),\s*0\s+8px\s+24px\s+rgba\(41,\s*34,\s*72,\s*0\.06\);/);
    assert.match(tokensScss, /\.xlc-list[\s\S]*box-shadow:\s*var\(--xlc-shadow-float\);/);
    assert.match(tokensScss, /\.xlc-pane[\s\S]*box-shadow:\s*var\(--xlc-shadow-float\);/);
});

test("样式生产门禁 · 数据透视指标使用深色对比块与大字阶层级", () => {
    assert.match(indexScss, /\.xlc-insights-metric[\s\S]*background-color:\s*var\(--xlc-dark-card\);/);
    assert.match(indexScss, /\.xlc-insights-val[\s\S]*color:\s*var\(--xlc-data-accent\);/);
    assert.match(indexScss, /\.xlc-row-usecount[\s\S]*color:\s*var\(--xlc-data-accent\);/);
});
