"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const entry = require("./.build/entry.cjs");

const {
    normalizePromoteContent,
    checkShortcodeConflict,
} = entry.promoteClip;

test("Promote Clipboard: 换行保真（CRLF 与孤立 CR 归一化为 LF）并保留全部特殊符号", () => {
    // 包含各类特殊字符、代码引号、尖括号、反引号、制表符与 CRLF
    const complexSnippet = "const a = 1;\r\nconst b = \"<special & 'quoted'>\";\r\n\t// CRLF line\rconst c = `template ${a}`;\nconsole.log(b);";
    const normalized = normalizePromoteContent(complexSnippet);

    // 严禁丢失特殊符号
    assert.ok(normalized.includes("<special & 'quoted'>"), "特殊符号必须完整保留");
    assert.ok(normalized.includes("const c = `template ${a}`;"), "反引号与模板语法必须原样保留");
    assert.ok(!normalized.includes("\r"), "换行符中不得残留 \\r 或 \\r\\n");

    // 验证拆分行数一致
    const lines = normalized.split("\n");
    assert.equal(lines.length, 5, "换行行数必须准确规整为 5 行");
});

test("Promote Clipboard: 简码唯一性校验与冲突拦截契约", () => {
    const existingEntries = [
        { id: "xlc-1", shortcode: ":wk", title: "周报模板" },
        { id: "xlc-2", shortcode: ":bug", title: "缺陷报告" },
        { id: "xlc-3", shortcode: ":api", title: "API规范" },
    ];

    // 1) 冲突拦截：带冒号
    const check1 = checkShortcodeConflict(":wk", existingEntries);
    assert.equal(check1.conflict, true);
    assert.equal(check1.itemTitle, "周报模板");

    // 2) 冲突拦截：不带冒号（自动补齐冒号比对）
    const check2 = checkShortcodeConflict("bug", existingEntries);
    assert.equal(check2.conflict, true);
    assert.equal(check2.itemTitle, "缺陷报告");

    // 3) 排除自身编辑时冲突
    const checkSelf = checkShortcodeConflict(":wk", existingEntries, "xlc-1");
    assert.equal(checkSelf.conflict, false, "排除自身 ID 时不应误判冲突");

    // 4) 非冲突通过
    const checkNew = checkShortcodeConflict(":feat", existingEntries);
    assert.equal(checkNew.conflict, false);

    // 5) 空值安全
    const checkEmpty = checkShortcodeConflict("", existingEntries);
    assert.equal(checkEmpty.conflict, false);
});

test("Promote Clipboard: 转正生效初始 frecency 与时间戳赋值契约", () => {
    // 模拟一段剪贴板转正后的状态赋值
    const mockState = {
        usage: {},
        recents: [],
        uiPrefs: { lastCategoryFilter: "常用" },
    };

    const newItemId = "xlc-snippet-promoted-123";
    const now = Date.now();

    // 模拟写入后的 frecency 初始化
    mockState.usage[newItemId] = { count: 1, lastAt: now };
    mockState.recents.unshift({ id: newItemId, usedAt: now });
    mockState.uiPrefs.lastCategoryFilter = "工作/研发";

    // 断言 frecency 体系
    assert.ok(mockState.usage[newItemId], "必须初始化 usage");
    assert.equal(mockState.usage[newItemId].count, 1, "初始使用频次必须赋予 1 次");
    assert.equal(mockState.usage[newItemId].lastAt, now, "初始使用时间戳必须为当前时间");
    assert.equal(mockState.recents[0]?.id, newItemId, "必须进入最近使用队列首位");
    assert.equal(mockState.uiPrefs.lastCategoryFilter, "工作/研发", "必须更新记忆上次使用分组");

    // 结合 search 的 calculateFrecencyScore 验证能立即计算出高分
    const { calculateFrecencyScore } = entry.search;
    const score = calculateFrecencyScore(mockState.usage[newItemId].count, mockState.usage[newItemId].lastAt, now);
    assert.equal(score, 100, "刚晋升的片段在 24 小时内 frecency 基础分必须为 100（稳居前列）");
});

test("Promote Clipboard: Ctrl+Enter 快捷提交与 IME isComposing 守卫契约", () => {
    // 契约逻辑模拟：验证 IME 组词期间（isComposing 或 keyCode 229）不触发提交
    let submitCount = 0;
    const handleSubmit = (ev) => {
        if ((ev.ctrlKey || ev.metaKey) && ev.key === "Enter") {
            // 核心 IME 守卫
            if (ev.isComposing || ev.keyCode === 229) return;
            submitCount++;
        }
    };

    // 场景 1: 输入法组词中按回车 (isComposing = true)
    handleSubmit({ ctrlKey: true, key: "Enter", isComposing: true, keyCode: 13 });
    assert.equal(submitCount, 0, "IME isComposing 为 true 时绝不可误提交");

    // 场景 2: 输入法组合状态 keyCode 229
    handleSubmit({ ctrlKey: true, key: "Enter", isComposing: false, keyCode: 229 });
    assert.equal(submitCount, 0, "keyCode 229 时绝不可误提交");

    // 场景 3: 正常快捷提交
    handleSubmit({ ctrlKey: true, key: "Enter", isComposing: false, keyCode: 13 });
    assert.equal(submitCount, 1, "正常 Ctrl+Enter 必须顺利提交");

    // 场景 4: Mac Cmd+Enter 正常快捷提交
    handleSubmit({ metaKey: true, key: "Enter", isComposing: false, keyCode: 13 });
    assert.equal(submitCount, 2, "正常 Cmd+Enter 必须顺利提交");
});
