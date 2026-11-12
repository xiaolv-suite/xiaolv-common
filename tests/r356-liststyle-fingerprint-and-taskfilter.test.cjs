"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    convertListStyle,
    generateShortHash,
    filterTaskItems,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveFingerprintArg,
} = entry.placeholders;

test("convertListStyle: converts between ordered and unordered lists with nested indentation support", () => {
    // 1. 基础无序转有序
    const unordered = `
- 需求梳理
- 架构设计
- 编码实现
- 门禁测试
`.trim();

    const ordered = convertListStyle(unordered, "ordered");
    assert.equal(ordered, "1. 需求梳理\n2. 架构设计\n3. 编码实现\n4. 门禁测试");

    // 2. 有序转无序
    const backToUnordered = convertListStyle(ordered, "unordered");
    assert.equal(backToUnordered, "- 需求梳理\n- 架构设计\n- 编码实现\n- 门禁测试");

    // 3. 嵌套多级列表（独立层级递增编号）
    const nested = `
- 阶段一
  - 任务 1.1
  - 任务 1.2
- 阶段二
  - 任务 2.1
`.trim();

    const nestedOrdered = convertListStyle(nested, "ordered");
    const lines = nestedOrdered.split("\n");
    assert.equal(lines[0], "1. 阶段一");
    assert.equal(lines[1], "  1. 任务 1.1");
    assert.equal(lines[2], "  2. 任务 1.2");
    assert.equal(lines[3], "2. 阶段二");
    assert.equal(lines[4], "  1. 任务 2.1");

    // 4. 包含待办复选框保持状态
    const tasks = `
- [ ] 待办 A
- [x] 已完成 B
`.trim();
    const orderedTasks = convertListStyle(tasks, "ordered");
    assert.equal(orderedTasks, "1. [ ] 待办 A\n2. [x] 已完成 B");
});

test("generateShortHash: produces deterministic, uniform short hashes with configurable lengths", () => {
    const textA = "siyuan-plugin-xiaolv-common";
    const textB = "siyuan-plugin-xiaolv-common-different";

    // 1. 确定性（同一输入输出恒等）
    const hashA1 = generateShortHash(textA, 8);
    const hashA2 = generateShortHash(textA, 8);
    assert.equal(hashA1, hashA2);
    assert.equal(hashA1.length, 8);
    assert.match(hashA1, /^[0-9a-f]{8}$/);

    // 2. 差异性（不同输入哈希相异）
    const hashB = generateShortHash(textB, 8);
    assert.notEqual(hashA1, hashB);

    // 3. 可选长度截取
    const hash6 = generateShortHash(textA, 6);
    assert.equal(hash6.length, 6);
    assert.equal(hashA1.slice(0, 6), hash6);

    const hash12 = generateShortHash(textA, 12);
    assert.equal(hash12.length, 12);
});

test("{{xlc:fingerprint}}: dynamic placeholder macro generates short hashes", () => {
    const now = new Date("2026-10-29T12:00:00");

    // 1. 默认 8 位指纹
    const res8 = applyPlaceholders("{{xlc:fingerprint|asset-v1.0.0}}", now, true);
    assert.equal(res8.length, 8);
    assert.match(res8, /^[0-9a-f]{8}$/);

    // 2. 冒号指定长度
    const res6 = applyPlaceholders("{{xlc:fingerprint:6|asset-v1.0.0}}", now, true);
    assert.equal(res6.length, 6);
    assert.equal(res8.slice(0, 6), res6);

    // 3. 管道参数指定长度
    const res10 = applyPlaceholders("{{xlc:fingerprint|10|asset-v1.0.0}}", now, true);
    assert.equal(res10.length, 10);
});

test("filterTaskItems: extracts tasks by status and optionally strips checkbox brackets", () => {
    const list = `
# 冲刺任务清单
- [ ] 编写核心算法
- [x] 完成架构设计
普通文本段落，不含待办标记
- [ ] 修复边界异常
- [X] 更新发布日志
`.trim();

    // 1. 仅提取未完成待办 (pending)
    const pendingOnly = filterTaskItems(list, "pending");
    assert.ok(pendingOnly.includes("- [ ] 编写核心算法"));
    assert.ok(pendingOnly.includes("- [ ] 修复边界异常"));
    assert.ok(!pendingOnly.includes("完成架构设计"));
    assert.ok(!pendingOnly.includes("普通文本段落"));

    // 2. 仅提取已完成待办 (completed)
    const completedOnly = filterTaskItems(list, "completed");
    assert.ok(completedOnly.includes("- [x] 完成架构设计"));
    assert.ok(completedOnly.includes("- [X] 更新发布日志"));
    assert.ok(!completedOnly.includes("编写核心算法"));

    // 3. 剥离复选框 (stripCheckbox: true)
    const stripped = filterTaskItems(list, "pending", {stripCheckbox: true});
    assert.equal(stripped, "- 编写核心算法\n- 修复边界异常");
});
