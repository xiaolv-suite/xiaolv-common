"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const indexScss = fs.readFileSync(path.join(root, "src", "styles", "index.scss"), "utf8");
const captureTs = fs.readFileSync(path.join(root, "src", "ui", "capture.ts"), "utf8");

test("T-0711 · 快速捕获表单操作栏 toolbar 语义与左右键盘漫游轮巡", () => {
    // 1. 操作栏 toolbar 语义与无障碍标签
    assert.match(captureTs, /actions\.setAttribute\("role",\s*"toolbar"\);/);
    assert.match(captureTs, /actions\.setAttribute\("aria-label",\s*"捕获表单操作栏"\);/);
    assert.match(captureTs, /cancelBtn\.setAttribute\("aria-label",\s*t\("cancel"\)\s*\|\|\s*"取消新建"\);/);
    assert.match(captureTs, /saveBtn\.setAttribute\("aria-label",\s*t\("save"\)\s*\|\|\s*"保存常用语"\);/);

    // 2. 操作栏水平键盘漫游轮巡与 Home/End 首末直达
    assert.match(captureTs, /actions\.addEventListener\("keydown",\s*\(e:\s*any\)\s*=>\s*\{/);
    assert.match(captureTs, /if \(e\.key === "ArrowRight" \|\| e\.key === "ArrowDown"\)/);
    assert.match(captureTs, /else if \(e\.key === "ArrowLeft" \|\| e\.key === "ArrowUp"\)/);
    assert.match(captureTs, /else if \(e\.key === "Home"\)/);
    assert.match(captureTs, /else if \(e\.key === "End"\)/);
});

test("T-0712 · 快捷标签栏与草稿恢复横幅无障碍语义与按键漫游强化", () => {
    // 1. 常用标签栏 toolbar 角色与水平按键漫游
    assert.match(captureTs, /tagPillsWrap\.setAttribute\("role",\s*"toolbar"\);/);
    assert.match(captureTs, /tagPillsWrap\.setAttribute\("aria-label",\s*"常用标签快捷填充栏"\);/);
    assert.match(captureTs, /tagPillsWrap\.addEventListener\("keydown",\s*\(e:\s*any\)\s*=>\s*\{/);

    // 2. 草稿恢复横幅 region 角色与按钮 toolbar
    assert.match(captureTs, /draftBanner\.setAttribute\("role",\s*"region"\);/);
    assert.match(captureTs, /draftBanner\.setAttribute\("aria-label",\s*"未保存草稿提示"\);/);
    assert.match(captureTs, /btnWrap\.setAttribute\("role",\s*"toolbar"\);/);
    assert.match(captureTs, /btnWrap\.setAttribute\("aria-label",\s*"草稿操作栏"\);/);
    assert.match(captureTs, /resumeBtn\.setAttribute\("aria-label",\s*"恢复上次未保存的内容草稿"\);/);
    assert.match(captureTs, /discardBtn\.setAttribute\("aria-label",\s*"放弃草稿"\);/);

    // 3. AI 建议行 region 角色与采纳按钮无障碍标签
    assert.match(captureTs, /sugrow\.setAttribute\("role",\s*"region"\);/);
    assert.match(captureTs, /sugrow\.setAttribute\("aria-label",\s*"AI整理建议栏"\);/);
    assert.match(captureTs, /adoptBtn\.setAttribute\("aria-label",\s*t\("adoptAll"\)\s*\|\|\s*"一键采纳所有建议"\);/);
});

test("T-0713 · 捕获内容字符计数实时状态播报与防抖动排版", () => {
    // 1. 计数器 status 角色与 aria-live 播报
    assert.match(captureTs, /counterEl\.setAttribute\("role",\s*"status"\);/);
    assert.match(captureTs, /counterEl\.setAttribute\("aria-live",\s*"polite"\);/);

    // 2. 样式表 tabular-nums 排版
    assert.match(indexScss, /\.xlc-form-counter\s*\{[\s\S]*?font-variant-numeric:\s*tabular-nums;/);
});

test("T-0714 · 捕获操作区按钮与草稿横幅 24px 触控靶点、高对比度焦点环与样式收拢", () => {
    // 1. 建议采纳按钮 24px 靶点与 focus-visible
    assert.match(indexScss, /\.xlc-sugrow-adopt\s*\{[\s\S]*?min-height:\s*24px;/);
    assert.match(indexScss, /\.xlc-sugrow-adopt\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);

    // 2. 草稿横幅内按钮 24px 靶点与 focus-visible
    assert.match(indexScss, /\.xlc-draft-resume-banner\s*\{[\s\S]*?\.b3-button\s*\{[\s\S]*?min-height:\s*24px;/);
    assert.match(indexScss, /\.xlc-draft-resume-banner\s*\{[\s\S]*?&:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--xlc-accent\);/);

    // 3. prefers-reduced-motion 涵盖采纳按钮与草稿按钮
    assert.match(indexScss, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.xlc-sugrow-adopt,[\s\S]*?\.xlc-draft-resume-banner \.b3-button[\s\S]*?transition:\s*none !important;/);
});
