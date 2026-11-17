"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    formatUnitSpacing,
    filterCharacterSet,
    generateNanoId,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveNanoIdArg,
} = entry.placeholders;

test("formatUnitSpacing: inserts standard space between numbers and measurement units", () => {
    // 1. 数据存储与网络带宽单位
    const rawData = "下载包大小为100MB，带宽速率2.5Gbps，延迟只有15ms。";
    const resData = formatUnitSpacing(rawData);
    assert.equal(resData.result, "下载包大小为100 MB，带宽速率2.5 Gbps，延迟只有15 ms。");
    assert.equal(resData.spacedCount, 3);

    // 2. 物理与工程度量单位
    const rawPhysics = "主机重50kg，主频3.5GHz，高度为180cm。";
    const resPhysics = formatUnitSpacing(rawPhysics);
    assert.equal(resPhysics.result, "主机重50 kg，主频3.5 GHz，高度为180 cm。");
    assert.equal(resPhysics.spacedCount, 3);

    // 3. 保护已有空格与百分比符号不被破坏
    const rawProtected = "已具备 100 MB 空间，CPU占用率为99.9%，温度25°C。";
    const resProtected = formatUnitSpacing(rawProtected);
    assert.equal(resProtected.result, rawProtected);
    assert.equal(resProtected.spacedCount, 0);
});

test("filterCharacterSet: filters and purifies specific character sets", () => {
    const mixed = "Hello 世界！2026-10-29 🚀 [Admin@System]";

    // 1. 仅提取中文字符
    const chineseOnly = filterCharacterSet(mixed, "chinese-only");
    assert.equal(chineseOnly, "世界");

    // 2. 仅保留英文字母与数字
    const alnumOnly = filterCharacterSet(mixed, "alphanumeric-only");
    assert.equal(alnumOnly, "Hello20261029AdminSystem");

    // 3. 剔除标点符号与特殊符号
    const noPunct = filterCharacterSet("你好，世界！“思源笔记” (v0.10.38)", "strip-punctuation");
    assert.equal(noPunct.trim(), "你好世界思源笔记 v01038");

    // 4. 剔除 Emoji 表情
    const noEmoji = filterCharacterSet("工作完成 🚀 打卡成功 🎉 坚持就是胜利", "strip-emoji");
    assert.equal(noEmoji.replace(/\s+/g, " ").trim(), "工作完成 打卡成功 坚持就是胜利");
});

test("generateNanoId: generates URL-safe compact unique identifiers", () => {
    // 1. 默认 10 位长度
    const id10 = generateNanoId();
    assert.equal(id10.length, 10);
    assert.ok(/^[0-9A-Za-z]+$/.test(id10));

    // 2. 自定义 16 位长度
    const id16 = generateNanoId(16);
    assert.equal(id16.length, 16);
    assert.ok(/^[0-9A-Za-z]+$/.test(id16));

    // 3. 随机唯一性 (连续两个不相等)
    assert.notEqual(generateNanoId(12), generateNanoId(12));
});

test("NanoID macro: evaluates {{xlc:nanoid}} placeholders dynamically", () => {
    const now = new Date(2026, 9, 29, 12, 0, 0);

    // 1. 默认 10 位 NanoID
    const tpl1 = "ID: {{xlc:nanoid}}";
    const res1 = applyPlaceholders(tpl1, now, true);
    assert.ok(/^ID: [0-9A-Za-z]{10}$/.test(res1));

    // 2. 管道指定 16 位长度
    const tpl2 = "TOKEN: {{xlc:nanoid|16}}";
    const res2 = applyPlaceholders(tpl2, now, true);
    assert.ok(/^TOKEN: [0-9A-Za-z]{16}$/.test(res2));

    // 3. 冒号指定 12 位长度
    const tpl3 = "SHORT: {{xlc:nanoid:12}}";
    const res3 = applyPlaceholders(tpl3, now, true);
    assert.ok(/^SHORT: [0-9A-Za-z]{12}$/.test(res3));
});
