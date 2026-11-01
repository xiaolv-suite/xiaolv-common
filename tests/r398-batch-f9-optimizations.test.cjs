"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {storage, clipboard} = require("./.build/entry.cjs");
const {calculateMagneticSnap} = storage;
const {mergeTrayContents} = clipboard;

test("TODO-OPT-05: 迷你悬浮条拖拽贴边自动磁吸算法契约 (calculateMagneticSnap)", () => {
    const vpW = 1920;
    const vpH = 1080;
    const boxW = 320;
    const boxH = 400;

    // 1. 左侧 ≤ 24px 阈值：自动吸附到 0
    const snapLeft = calculateMagneticSnap(15, 100, boxW, boxH, vpW, vpH, 24);
    assert.equal(snapLeft.x, 0);
    assert.equal(snapLeft.y, 100);
    assert.equal(snapLeft.snapped, true);
    assert.equal(snapLeft.edge, "left");

    // 2. 右侧 ≤ 24px 阈值：自动吸附到 vpW - boxW = 1600
    const snapRight = calculateMagneticSnap(1585, 100, boxW, boxH, vpW, vpH, 24);
    assert.equal(snapRight.x, 1600);
    assert.equal(snapRight.y, 100);
    assert.equal(snapRight.snapped, true);
    assert.equal(snapRight.edge, "right");

    // 3. 顶部 ≤ 24px 阈值：自动吸附到 0
    const snapTop = calculateMagneticSnap(500, 18, boxW, boxH, vpW, vpH, 24);
    assert.equal(snapTop.x, 500);
    assert.equal(snapTop.y, 0);
    assert.equal(snapTop.snapped, true);
    assert.equal(snapTop.edge, "top");

    // 4. 底部 ≤ 24px 阈值：自动吸附到 vpH - boxH = 680
    const snapBottom = calculateMagneticSnap(500, 670, boxW, boxH, vpW, vpH, 24);
    assert.equal(snapBottom.x, 500);
    assert.equal(snapBottom.y, 680);
    assert.equal(snapBottom.snapped, true);
    assert.equal(snapBottom.edge, "bottom");

    // 5. 居中未越过阈值：保持原样，snapped 为 false
    const noSnap = calculateMagneticSnap(500, 300, boxW, boxH, vpW, vpH, 24);
    assert.equal(noSnap.x, 500);
    assert.equal(noSnap.y, 300);
    assert.equal(noSnap.snapped, false);
});

test("TODO-OPT-06: 暂存托盘购物车自定义段落分隔符契约 (mergeTrayContents)", () => {
    const items = [
        {content: "第一段：致歉"},
        {content: "第二段：原因"},
        {content: "第三段：方案"},
    ];

    // 1. 默认 double-newline 分隔
    const resDefault = mergeTrayContents(items);
    assert.equal(resDefault, "第一段：致歉\n\n第二段：原因\n\n第三段：方案");

    // 2. 水平分割线 hr (---) 分隔
    const resHr = mergeTrayContents(items, "hr");
    assert.equal(resHr, "第一段：致歉\n\n---\n\n第二段：原因\n\n---\n\n第三段：方案");

    // 3. 紧凑 compact 单换行分隔
    const resCompact = mergeTrayContents(items, "compact");
    assert.equal(resCompact, "第一段：致歉\n第二段：原因\n第三段：方案");
});
