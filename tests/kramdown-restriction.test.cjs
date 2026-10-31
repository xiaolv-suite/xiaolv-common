"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {kramdown} = require("./.build/entry.cjs");
const {bodyWriteRestriction} = kramdown;

test("bodyWriteRestriction：合法单行文本与行内语法均放行", () => {
    assert.equal(bodyWriteRestriction("这是一个普通的常用短语"), undefined);
    assert.equal(bodyWriteRestriction("请运行 `pnpm test` 查看结果"), undefined);
    assert.equal(bodyWriteRestriction("您好，订单号为：{{xlc:ask:订单号}}"), undefined);
    assert.equal(bodyWriteRestriction("今天日期：{{xlc:date|+1d}}"), undefined);
    assert.equal(bodyWriteRestriction("https://example.com/api/v1"), undefined);
});

test("bodyWriteRestriction：合法代码围栏及首尾包含带空格空白行安全清洗放行", () => {
    assert.equal(bodyWriteRestriction("```js\nconst a = 1;\n```"), undefined);
    assert.equal(bodyWriteRestriction("````ts\nconst b: number = 2;\n````"), undefined);
    assert.equal(bodyWriteRestriction("~~~python\nprint(1)\n~~~"), undefined);
    assert.equal(bodyWriteRestriction("\n\n```js\nconst x = 1;\n```\n\n"), undefined);
    // 包含纯空格与制表符的空白行清洗
    assert.equal(bodyWriteRestriction("  \n\t \n```js\nconst x = 1;\n```\n  \n\t"), undefined);
});

test("bodyWriteRestriction：单行结构标记拦截，防止思源派生多块或容器结构", () => {
    const errorPattern = /multi-line or structured content cannot be written into an existing single block/;
    // 引用块
    assert.match(bodyWriteRestriction("> 这是一个单行引用"), errorPattern);
    assert.match(bodyWriteRestriction("  > 缩进引用块"), errorPattern);
    // 无序列表
    assert.match(bodyWriteRestriction("- 列表项 1"), errorPattern);
    assert.match(bodyWriteRestriction("* 列表项 2"), errorPattern);
    assert.match(bodyWriteRestriction("+ 列表项 3"), errorPattern);
    assert.match(bodyWriteRestriction("   - 缩进列表项"), errorPattern);
    // 有序列表
    assert.match(bodyWriteRestriction("1. 有序第一项"), errorPattern);
    assert.match(bodyWriteRestriction("99. 有序第99项"), errorPattern);
    // 任务列表
    assert.match(bodyWriteRestriction("- [ ] 待办任务"), errorPattern);
    assert.match(bodyWriteRestriction("* [x] 已完成任务"), errorPattern);
    // 表格
    assert.match(bodyWriteRestriction("| 表头1 | 表头2 |"), errorPattern);
    assert.match(bodyWriteRestriction("  | 缩进表格 |"), errorPattern);
    // 分割线
    assert.match(bodyWriteRestriction("---"), errorPattern);
    assert.match(bodyWriteRestriction("***"), errorPattern);
    assert.match(bodyWriteRestriction("- - - "), errorPattern);
    // 思源块级 IAL 标记与超级块分界
    assert.match(bodyWriteRestriction("段落文本 {: id=20240101-abcdef}"), errorPattern);
    assert.match(bodyWriteRestriction("{{{ 展开超级块"), errorPattern);
    assert.match(bodyWriteRestriction("}}}"), errorPattern);
});

test("bodyWriteRestriction：非围栏多行、未闭合围栏与超限拒绝", () => {
    // 空文本与纯空白
    assert.equal(bodyWriteRestriction(""), "body is empty");
    assert.equal(bodyWriteRestriction("   \n\t  "), "body is empty");
    // 多行未包装段落
    assert.match(bodyWriteRestriction("第一行\n第二行"), /multi-line or structured content cannot be written into an existing single block/);
    // 未闭合代码围栏
    assert.match(bodyWriteRestriction("```js\nconsole.log(1);"), /multi-line or structured content cannot be written into an existing single block/);
    // 围栏符号不匹配
    assert.match(bodyWriteRestriction("```js\nconsole.log(1);\n~~~"), /multi-line or structured content cannot be written into an existing single block/);
    // 闭合后有尾随内容
    assert.match(bodyWriteRestriction("```js\nconsole.log(1);\n```\n尾随内容"), /multi-line or structured content cannot be written into an existing single block/);
    // 控制字符
    assert.match(bodyWriteRestriction("行内\u2028换行"), /multi-line content cannot be written into an existing single block/);
    // 超限
    assert.equal(bodyWriteRestriction("a".repeat(102401)), "body exceeds the supported size; nothing was written");
});

// ADR 0165：真内核 getBlockKramdown 原样输出（v3.8.9 隔离内核实测样本）→ 条目正文
test("storedKramdownToBody：剥离宿主块 IAL、超级块容器与零宽空格，保留用户 IAL 与代码原文", () => {
    const raw = [
        "{{{row",
        "尊敬的 {{xlc:ask:客户名称}}：",
        "{: id=\"20261031092743-4bflhb4\" updated=\"20261031092743\"}",
        "",
        "1. {: id=\"20261031092743-bidrnzn\" updated=\"20261031092743\"}服务费减免",
        "   {: id=\"20261031092743-u1t516u\" updated=\"20261031092743\"}",
        "{: id=\"20261031092743-ex0lyic\" updated=\"20261031092743\"}",
        "",
        "- {: id=\"20261031092743-upku3ex\" updated=\"20261031092743\"}[ ] 待办 {: custom-priority=\"high\"}",
        "  {: id=\"20261031092743-e3ukkp6\" updated=\"20261031092743\"}",
        "{: id=\"20261031092743-owus7mx\" updated=\"20261031092743\"}",
        "",
        "> 提示：可修改",
        "> {: id=\"20261031092743-nr6slx6\" updated=\"20261031092743\"}",
        ">",
        "{: id=\"20261031092743-e84u235\" updated=\"20261031092743\"}",
        "",
        "按 \u200b`Tab`\u200b 键，\u200b{{xlc:cursor}}",
        "\u200b{{xlc:ask:公司}}",
        "{: id=\"20261031092743-hxw3f14\" updated=\"20261031092743\"}",
        "",
        "```js",
        "{: id=\"20240101000000-keepkep\"} \u200b`字面`",
        "```",
        "{: id=\"20261031092743-lq5ph1m\" updated=\"20261031092743\"}",
        "",
        "}}}",
        "{: id=\"20261031092743-b8jbzra\" updated=\"20261031092743\" custom-xlc-id=\"xlc-a1\"}",
    ].join("\n");
    assert.equal(kramdown.storedKramdownToBody(raw), [
        "尊敬的 {{xlc:ask:客户名称}}：",
        "",
        "1. 服务费减免",
        "",
        "- [ ] 待办 {: custom-priority=\"high\"}",
        "",
        "> 提示：可修改",
        "",
        "按 `Tab` 键，{{xlc:cursor}}",
        "{{xlc:ask:公司}}",
        "",
        "```js",
        "{: id=\"20240101000000-keepkep\"} \u200b`字面`",
        "```",
    ].join("\n"));
    // 单段条目：只剥离尾随 IAL；行尾两空格硬换行保持原样
    assert.equal(kramdown.storedKramdownToBody("单行  \n{: id=\"20261031092743-zusse0e\" updated=\"1\"}"), "单行");
    assert.equal(kramdown.storedKramdownToBody("甲  \n乙\n{: id=\"20261031092743-zusse0e\"}"), "甲  \n乙");
});

test("toItemStorageMarkdown → storedKramdownToBody：容器往返保持正文", () => {
    const body = "{{xlc:ask:姓名}}｜{{xlc:ask:职位}}\n- {{xlc:cursor}}\n\n> 引用";
    const stored = kramdown.toItemStorageMarkdown(body);
    assert.match(stored, /^\{\{\{row\n\u200b\{\{xlc:ask:姓名\}\}/);
    assert.equal(kramdown.storedKramdownToBody(stored), body);
    assert.equal(kramdown.toItemStorageMarkdown("单行"), "单行");
    assert.equal(kramdown.toItemStorageMarkdown("单行", true), "{{{row\n单行\n}}}");
    assert.equal(kramdown.itemBodyRestriction("甲\n\n- 乙\n\n```\n}}}\n```"), undefined);
    assert.match(kramdown.itemBodyRestriction("甲\n{{{col\n乙"), /superblock markers/);
});
