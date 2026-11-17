"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    invertTaskStatus,
    centerText,
    convertListDelimiter,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveCenterArg,
} = entry.placeholders;

test("invertTaskStatus: inverts task checkbox states, checks all, or unchecks all", () => {
    const tasks = `
# 今日待办
- [ ] 编写测试用例
- [x] 架构设计确认
- [ ] 提交代码补丁
普通段落不含待办
- [X] 更新系统文档
`.trim();

    // 1. 反转状态 (invert)
    const inverted = invertTaskStatus(tasks, "invert");
    assert.ok(inverted.includes("- [x] 编写测试用例"));
    assert.ok(inverted.includes("- [ ] 架构设计确认"));
    assert.ok(inverted.includes("- [x] 提交代码补丁"));
    assert.ok(inverted.includes("- [ ] 更新系统文档"));
    assert.ok(inverted.includes("普通段落不含待办"));

    // 2. 全选完成 (check_all)
    const checkedAll = invertTaskStatus(tasks, "check_all");
    assert.ok(checkedAll.includes("- [x] 编写测试用例"));
    assert.ok(checkedAll.includes("- [x] 架构设计确认"));

    // 3. 全选未完成 (uncheck_all)
    const uncheckedAll = invertTaskStatus(tasks, "uncheck_all");
    assert.ok(uncheckedAll.includes("- [ ] 编写测试用例"));
    assert.ok(uncheckedAll.includes("- [ ] 架构设计确认"));
    assert.ok(uncheckedAll.includes("- [ ] 更新系统文档"));
});

test("centerText and {{xlc:center}}: centers text with CJK double width and custom pad characters", () => {
    // 1. 英文居中
    assert.equal(centerText("HELLO", 11), "   HELLO   ");

    // 2. 中文视觉字宽居中 ("你好" 宽 4，补到 8 宽 -> 左右各补 2 空格)
    assert.equal(centerText("你好", 8), "  你好  ");

    // 3. 自定义填充符号
    assert.equal(centerText("TITLE", 15, {padChar: "="}), "=====TITLE=====");

    // 4. 动态宏求值
    const now = new Date("2026-10-29T12:00:00");
    assert.equal(applyPlaceholders("{{xlc:center|15|TITLE}}", now, true), "     TITLE     ");
    assert.equal(applyPlaceholders("{{xlc:center|15|TITLE|=}}", now, true), "=====TITLE=====");
    assert.equal(applyPlaceholders("{{xlc:center|TITLE|15|=}}", now, true), "=====TITLE=====");
});

test("convertListDelimiter: converts list delimiters with automatic detection and item trimming", () => {
    // 1. 逗号转换行
    const commaList = "apple, banana, orange, grape";
    assert.equal(convertListDelimiter(commaList, "\n"), "apple\nbanana\norange\ngrape");

    // 2. 换行转逗号
    const newlineList = "apple\nbanana\norange";
    assert.equal(convertListDelimiter(newlineList, ", "), "apple, banana, orange");

    // 3. 分号转管道符
    const semiList = "host; port; timeout";
    assert.equal(convertListDelimiter(semiList, " | "), "host | port | timeout");
});
