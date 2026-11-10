"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    stripAffixes,
    propertiesToJson,
    jsonToProperties,
    maskSensitiveText,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveMaskArg,
} = entry.placeholders;

test("stripAffixes: strips list prefixes, quote markers, and custom affixes", () => {
    // 1. 剥离无序/有序列表前缀 (preset "list")
    const listText = [
        "- 第一项内容",
        "* 第二项内容",
        "1. 第三项内容",
        "① 第四项内容",
        "",
        "普通未带前缀文本",
    ].join("\n");

    const res1 = stripAffixes(listText, {prefix: "list"});
    assert.equal(res1.strippedCount, 4);
    assert.equal(res1.lineCount, 6);
    assert.equal(
        res1.result,
        "第一项内容\n第二项内容\n第三项内容\n第四项内容\n\n普通未带前缀文本"
    );

    // 2. 剥离引用块标记 (preset "quote")
    const quoteText = "> 第一行引用\n> 第二行引用\n普通正文";
    const res2 = stripAffixes(quoteText, {prefix: "quote"});
    assert.equal(res2.strippedCount, 2);
    assert.equal(res2.result, "第一行引用\n第二行引用\n普通正文");

    // 3. 自定义前后缀 (如 SQL 字符串单引号与逗号: 'item',)
    const sqlItems = "'apple',\n'banana',\n'orange',";
    const res3 = stripAffixes(sqlItems, {prefix: "'", suffix: "',"});
    assert.equal(res3.strippedCount, 3);
    assert.equal(res3.result, "apple\nbanana\norange");
});

test("propertiesToJson and jsonToProperties: bidirectional conversion between key-value and JSON", () => {
    const props = [
        "# 基础系统配置",
        "app.name = 小驴常用",
        "app.version: 0.10.21",
        "! 忽略的注释行",
        "",
        "server.port = 8080",
    ].join("\n");

    // 1. properties -> JSON
    const jsonRes = propertiesToJson(props);
    assert.equal(jsonRes.ok, true);
    assert.equal(jsonRes.count, 3);
    const parsed = JSON.parse(jsonRes.result);
    assert.equal(parsed["app.name"], "小驴常用");
    assert.equal(parsed["app.version"], "0.10.21");
    assert.equal(parsed["server.port"], "8080");

    // 2. JSON -> properties
    const propsRes = jsonToProperties(jsonRes.result);
    assert.equal(propsRes.ok, true);
    assert.equal(propsRes.count, 3);
    assert.ok(propsRes.result.includes("app.name=小驴常用"));
    assert.ok(propsRes.result.includes("server.port=8080"));
});

test("maskSensitiveText: masks phones, ID cards, and emails accurately", () => {
    // 1. 手机号脱敏 (前3后4，中间4位掩码)
    assert.equal(maskSensitiveText("联系电话：13800138000 敬请联系", "phone"), "联系电话：138****8000 敬请联系");

    // 2. 身份证脱敏 (前6后4，中间8位掩码)
    assert.equal(maskSensitiveText("身份证：420104199001011234", "idcard"), "身份证：420104********1234");

    // 3. 邮箱脱敏 (保留首字母，其余到@前用***)
    assert.equal(maskSensitiveText("邮箱：admin@siyuan-note.com", "email"), "邮箱：a***@siyuan-note.com");

    // 4. auto 自动综合脱敏
    const mixed = "用户张三，手机 13912345678，邮箱 service@company.cn，证件 11010119950505123X。";
    const maskedMixed = maskSensitiveText(mixed, "auto");
    assert.ok(maskedMixed.includes("139****5678"));
    assert.ok(maskedMixed.includes("s***@company.cn"));
    assert.ok(maskedMixed.includes("110101********123X"));
});

test("Mask macro: dynamic placeholder expansion for sensitive text masking", () => {
    const now = new Date(2026, 9, 28, 12, 0, 0);

    // 1. 显式手机号脱敏
    const tpl1 = "客户号码：{{xlc:mask|phone|13711223344}}";
    const res1 = applyPlaceholders(tpl1, now, true);
    assert.equal(res1, "客户号码：137****3344");

    // 2. auto 综合脱敏管道语法
    const tpl2 = "账号信息：{{xlc:mask|auto|绑定手机 18699887766，邮箱 test@domain.org}}";
    const res2 = applyPlaceholders(tpl2, now, true);
    assert.equal(res2, "账号信息：绑定手机 186****7766，邮箱 t***@domain.org");

    // 3. 冒号兼容子命令
    const tpl3 = "脱敏：{{xlc:mask:email|support@siyuan.cn}}";
    const res3 = applyPlaceholders(tpl3, now, true);
    assert.equal(res3, "脱敏：s***@siyuan.cn");

    // 4. 直接调用 resolveMaskArg
    assert.equal(resolveMaskArg("13588776655", "phone"), "135****6655");
    assert.equal(resolveMaskArg("内容", "invalid_type"), null);
});
