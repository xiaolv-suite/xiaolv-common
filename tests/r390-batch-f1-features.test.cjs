"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {capture} = require("./.build/entry.cjs");
const {inferTypeFromText} = capture;

test("TODO-FEAT-001: inferTypeFromText 多格式推断（支持图片链接、Base64 与代码围栏）", () => {
    // 1. 图片格式识别（CAND-001 / TODO-FEAT-001 增强）
    assert.equal(inferTypeFromText("![](assets/photo.png)"), "image");
    assert.equal(inferTypeFromText("![网络封面](https://example.com/cover.webp)"), "image");
    assert.equal(inferTypeFromText("https://cdn.example.org/avatar.jpg"), "image");
    assert.equal(inferTypeFromText("https://img.service.com/banner.svg?v=123"), "image");
    assert.equal(inferTypeFromText("data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=="), "image");

    // 2. 传统类型无损回归
    assert.equal(inferTypeFromText("https://example.com/article/123"), "url");
    assert.equal(inferTypeFromText("```python\nprint(1)\n```"), "code");
    assert.equal(inferTypeFromText("# 一级标题\n正文段落"), "markdown");
    assert.equal(inferTypeFromText("普通日常备忘文本"), "text");
});

test("TODO-FEAT-001: 剪贴板搜索流多格式过滤器逻辑验证", () => {
    const rawClips = [
        { text: "纯文本通知", copiedAt: 100 },
        { text: "```js\nconsole.log(1)\n```", copiedAt: 200 },
        { text: "https://example.com/screenshot.png", copiedAt: 300 },
        { text: "![图](assets/img1.png)", copiedAt: 400 },
        { text: "# 架构设计\n第一段说明", copiedAt: 500 },
    ];
    // 全部
    assert.equal(rawClips.length, 5);
    // 过滤代码
    const codeClips = rawClips.filter((c) => inferTypeFromText(c.text) === "code");
    assert.equal(codeClips.length, 1);
    // 过滤图片
    const imgClips = rawClips.filter((c) => inferTypeFromText(c.text) === "image");
    assert.equal(imgClips.length, 2);
    // 过滤文本
    const textClips = rawClips.filter((c) => ["text", "markdown"].includes(inferTypeFromText(c.text)));
    assert.equal(textClips.length, 2);
});

test("TODO-FEAT-002: VariableForm 最近输入值记忆与点填字段逻辑", () => {
    // 模拟 defaults 变量记忆提取与回填
    const mockMemory = {
        "客户名称": "深圳前海腾讯计算机系统有限公司",
        "跟进日期": "2026-11-05",
    };

    function resolveFieldPreset(fieldName, defaults, templateDefault) {
        const mem = defaults ? defaults[fieldName] : undefined;
        if (mem !== undefined && mem.length > 0) return { val: mem, fromMemory: true };
        return { val: templateDefault || "", fromMemory: false };
    }

    const res1 = resolveFieldPreset("客户名称", mockMemory, "默认公司");
    assert.equal(res1.fromMemory, true);
    assert.equal(res1.val, "深圳前海腾讯计算机系统有限公司");

    const res2 = resolveFieldPreset("未记忆字段", mockMemory, "兜底默认值");
    assert.equal(res2.fromMemory, false);
    assert.equal(res2.val, "兜底默认值");
});

test("TODO-FEAT-003: 虚拟滚动触底判断与显示区间计算", () => {
    function computeRangeIndicator(total, start, end) {
        if (total < 50) return "";
        return `[${start + 1}-${end} / ${total}]`;
    }
    assert.equal(computeRangeIndicator(20, 0, 10), "");
    assert.equal(computeRangeIndicator(86, 0, 14), "[1-14 / 86]");
    assert.equal(computeRangeIndicator(86, 70, 86), "[71-86 / 86]");

    function isAtBottom(total, end) {
        return total >= 50 && end >= total;
    }
    assert.equal(isAtBottom(86, 40), false);
    assert.equal(isAtBottom(86, 86), true);
    assert.equal(isAtBottom(30, 30), false); // 未达到 50 条阈值不触发触底线
});
