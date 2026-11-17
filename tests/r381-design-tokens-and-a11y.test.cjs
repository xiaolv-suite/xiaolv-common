"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const tokensScss = fs.readFileSync(path.join(root, "src", "styles", "tokens-r187.scss"), "utf8");
const indexScss = fs.readFileSync(path.join(root, "src", "styles", "index.scss"), "utf8");

test("设计令牌 · 声明统一三档系统阴影（sm / md / lg）并对齐明暗主题", () => {
    assert.match(tokensScss, /--xlc-shadow-sm:\s*0\s+1px\s+3px/);
    assert.match(tokensScss, /--xlc-shadow-md:\s*0\s+4px\s+14px/);
    assert.match(tokensScss, /--xlc-shadow-lg:\s*0\s+12px\s+36px/);
    assert.match(tokensScss, /--xlc-shadow-1:\s*var\(--xlc-shadow-sm\);/);
    assert.match(tokensScss, /--xlc-shadow-2:\s*var\(--xlc-shadow-md\);/);
    assert.match(tokensScss, /--xlc-shadow-3:\s*var\(--xlc-shadow-lg\);/);
});

test("设计令牌 · 声明状态切换、层级进出与空间连续三类标准动效时长", () => {
    assert.match(tokensScss, /--xlc-dur-state:\s*var\(--xlc-dur-fast\);/);
    assert.match(tokensScss, /--xlc-dur-elevation:\s*var\(--xlc-dur\);/);
    assert.match(tokensScss, /--xlc-dur-spatial:\s*var\(--xlc-dur-slow\);/);
});

test("设计令牌 · 完善 prefers-reduced-motion 减少动效偏好无障碍支持", () => {
    assert.match(tokensScss, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    assert.match(tokensScss, /--xlc-dur-state:\s*0ms\s*!important;/);
    assert.match(tokensScss, /--xlc-dur-elevation:\s*0ms\s*!important;/);
    assert.match(tokensScss, /--xlc-dur-spatial:\s*0ms\s*!important;/);
});

test("设计令牌 · 数字与计时统计类使用 tabular-nums 等宽排版", () => {
    assert.match(tokensScss, /font-variant-numeric:\s*tabular-nums;/);
    assert.match(tokensScss, /font-feature-settings:\s*"tnum";/);
    assert.match(tokensScss, /\.xlc-row-ordinal/);
    assert.match(tokensScss, /\.xlc-row-usecount/);
});

test("样式生产门禁 · index.scss 保持 0 十六进制硬编码色值残留", () => {
    // 过滤掉注释行与 url 内嵌 SVG data 编码
    const lines = indexScss.split("\n");
    const hexViolations = [];
    lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.includes("url(\"data:")) return;
        const match = trimmed.match(/#[0-9a-fA-F]{3,8}/);
        if (match) {
            hexViolations.push(`Line ${idx + 1}: ${trimmed}`);
        }
    });
    assert.equal(hexViolations.length, 0, `index.scss 不得出现未令牌化的十六进制颜色:\n${hexViolations.join("\n")}`);
});

test("样式生产门禁 · index.scss 保持 0 linear-gradient 拟物渐变残留", () => {
    const lines = indexScss.split("\n");
    const gradientViolations = [];
    lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("/*")) return;
        if (trimmed.includes("linear-gradient")) {
            gradientViolations.push(`Line ${idx + 1}: ${trimmed}`);
        }
    });
    assert.equal(gradientViolations.length, 0, `index.scss 不得出现拟物渐变:\n${gradientViolations.join("\n")}`);
});
