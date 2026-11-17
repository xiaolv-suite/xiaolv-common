"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    markdownTableToKeyValue,
    extractChinesePinyinInitials,
    normalizeBlankLinesStrict,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveInitialsArg,
} = entry.placeholders;

test("markdownTableToKeyValue: converts markdown tables to YAML, Properties, and JSON", () => {
    const table = `
| 配置项 | 参数值 | 说明 |
| :--- | :--- | :--- |
| server_port | 8080 | 监听端口 |
| debug_mode | true | 调试开关 |
| app_name | "SiYuan App" | 应用名称 |
`.trim();

    // 1. YAML 格式 (默认前两列)
    const yaml = markdownTableToKeyValue(table, {format: "yaml"});
    const yamlLines = yaml.split("\n");
    assert.equal(yamlLines[0], "server_port: 8080");
    assert.equal(yamlLines[1], "debug_mode: true");
    assert.equal(yamlLines[2], 'app_name: "SiYuan App"');

    // 2. Properties 格式
    const props = markdownTableToKeyValue(table, {format: "properties"});
    assert.ok(props.includes("server_port=8080"));
    assert.ok(props.includes("debug_mode=true"));

    // 3. JSON 格式
    const jsonStr = markdownTableToKeyValue(table, {format: "json"});
    const parsed = JSON.parse(jsonStr);
    assert.equal(parsed.server_port, "8080");
    assert.equal(parsed.debug_mode, "true");

    // 4. 指定列索引 (keyCol: 0, valCol: 2 说明列)
    const descYaml = markdownTableToKeyValue(table, {keyColumn: 0, valueColumn: 2, format: "yaml"});
    assert.ok(descYaml.includes("server_port: 监听端口"));
    assert.ok(descYaml.includes("debug_mode: 调试开关"));
});

test("extractChinesePinyinInitials: extracts uppercase/lowercase initials for Chinese and mixed phrases", () => {
    // 1. 纯中文汉字词组
    assert.equal(extractChinesePinyinInitials("思源笔记"), "SYBJ");
    assert.equal(extractChinesePinyinInitials("小驴常用"), "XLCY");

    // 2. 中英混排词组
    assert.equal(extractChinesePinyinInitials("Vue 框架"), "VKJ");
    assert.equal(extractChinesePinyinInitials("TypeScript 开发指南"), "TKFZN");

    // 3. 纯英文词组
    assert.equal(extractChinesePinyinInitials("Central Processing Unit"), "CPU");

    // 4. 小写与自定义连接符
    assert.equal(extractChinesePinyinInitials("思源笔记", {uppercase: false}), "sybj");
    assert.equal(extractChinesePinyinInitials("思源笔记", {separator: "-"}), "S-Y-B-J");
});

test("{{xlc:initials}}: dynamic placeholder macro evaluates pinyin and acronym initials", () => {
    const now = new Date("2026-10-29T12:00:00");

    // 1. 默认大写拼音缩写
    assert.equal(applyPlaceholders("{{xlc:initials|思源笔记}}", now, true), "SYBJ");
    assert.equal(applyPlaceholders("{{xlc:initials|Random Access Memory}}", now, true), "RAM");

    // 2. 冒号子参数形态 (lower)
    assert.equal(applyPlaceholders("{{xlc:initials:lower|思源笔记}}", now, true), "sybj");

    // 3. 自定义连字符
    assert.equal(applyPlaceholders("{{xlc:initials|思源笔记|-}}", now, true), "S-Y-B-J");
});

test("normalizeBlankLinesStrict: strictly collapses consecutive blank lines and trims edges", () => {
    // 包含空白字符伪空行、连续多个空行、首尾空行
    const messy = "  \n\t  \n第一段内容\n   \n\t\t\n\n\n第二段内容\n  \n\n";
    const res = normalizeBlankLinesStrict(messy, 1);

    assert.ok(res.cleanedLines >= 4);
    assert.equal(res.result, "第一段内容\n\n第二段内容");

    // 0 空行模式（完全清除空行）
    const resZero = normalizeBlankLinesStrict("A\n\n\nB\n\nC", 0);
    assert.equal(resZero.result, "A\nB\nC");
});
