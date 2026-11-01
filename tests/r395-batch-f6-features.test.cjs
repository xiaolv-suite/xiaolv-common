"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {search, storage, clipboard} = require("./.build/entry.cjs");
const {parseSearchPrefix} = search;
const {matchProfilePreset, normalizeProfilePresets} = storage;
const {formatItemContent} = clipboard;

test("TODO-FEAT-014: 搜索框符号前缀极速过滤解析纯函数契约 (#标签 / @分类 / type:类型 / scope:范围)", () => {
    // 1. #标签 解析并提取干净查询词
    const res1 = parseSearchPrefix("#售后 致歉声明模板");
    assert.equal(res1.tagFilter, "售后");
    assert.equal(res1.cleanQuery, "致歉声明模板");

    // 2. @分类 解析
    const res2 = parseSearchPrefix("@客户服务 延期补偿");
    assert.equal(res2.categoryFilter, "客户服务");
    assert.equal(res2.cleanQuery, "延期补偿");

    // 3. type:code 类型解析
    const res3 = parseSearchPrefix("type:code 数据库连接池");
    assert.equal(res3.typeFilter, "code");
    assert.equal(res3.cleanQuery, "数据库连接池");

    // 4. scope:clip 范围解析
    const res4 = parseSearchPrefix("scope:clip 验证码");
    assert.equal(res4.scopeFilter, "clipboard");
    assert.equal(res4.cleanQuery, "验证码");

    // 5. 组合前缀解析（#标签 + @分类 + type:类型）
    const res5 = parseSearchPrefix("#致歉 @客服 type:markdown 客户挽回");
    assert.equal(res5.tagFilter, "致歉");
    assert.equal(res5.categoryFilter, "客服");
    assert.equal(res5.typeFilter, "markdown");
    assert.equal(res5.cleanQuery, "客户挽回");

    // 6. 普通无前缀查询词不受影响
    const res6 = parseSearchPrefix("普通查询词 发票开具");
    assert.equal(res6.tagFilter, undefined);
    assert.equal(res6.categoryFilter, undefined);
    assert.equal(res6.typeFilter, undefined);
    assert.equal(res6.cleanQuery, "普通查询词 发票开具");
});

test("TODO-FEAT-015: 全局名片池/个人档案自动预填模糊匹配契约 (matchProfilePreset)", () => {
    const presets = {
        "姓名": "张三",
        "手机号": "18588888888",
        "邮箱": "service@xiaolv.com",
        "公司": "小驴科技有限公司",
        "税号": "91440300123456789X",
    };

    // 1. 精确匹配
    assert.equal(matchProfilePreset("姓名", presets), "张三");
    assert.equal(matchProfilePreset("手机号", presets), "18588888888");

    // 2. 别名族命中：名字/联系人 -> 姓名
    assert.equal(matchProfilePreset("名字", presets), "张三");
    assert.equal(matchProfilePreset("联系人", presets), "张三");
    assert.equal(matchProfilePreset("name", presets), "张三");

    // 3. 别名族命中：电话/联系电话/phone -> 手机号
    assert.equal(matchProfilePreset("电话", presets), "18588888888");
    assert.equal(matchProfilePreset("联系方式", presets), "18588888888");
    assert.equal(matchProfilePreset("phone", presets), "18588888888");

    // 4. 别名族命中：电子邮箱/email -> 邮箱
    assert.equal(matchProfilePreset("电子邮箱", presets), "service@xiaolv.com");
    assert.equal(matchProfilePreset("email", presets), "service@xiaolv.com");

    // 5. 别名族命中：统一社会信用代码/纳税人识别号 -> 税号
    assert.equal(matchProfilePreset("统一社会信用代码", presets), "91440300123456789X");

    // 6. 未知字段返回 undefined
    assert.equal(matchProfilePreset("未知项目代号", presets), undefined);
    assert.equal(matchProfilePreset("", presets), undefined);

    // 7. normalizeProfilePresets 规范化清洗
    const raw = {
        "  姓名  ": "  李四  ",
        "123": "",
    };
    const norm = normalizeProfilePresets(raw);
    assert.deepEqual(norm, {"姓名": "李四"});
});

test("TODO-FEAT-016: 多格式极速复制转换纯函数契约 (formatItemContent)", () => {
    const rawMd = "# 致歉说明\n\n尊敬的 **用户**，非常抱歉给您带来不便。\n\n- 补偿方案 A\n- 补偿方案 B\n\n```js\nconsole.log(1)\n```";
    const meta = {
        id: "20261101140000-sampleid",
        title: "核心致歉说明",
    };

    // 1. markdown 原样保留
    const resMd = formatItemContent(rawMd, "markdown", meta);
    assert.equal(resMd.text, rawMd);
    assert.equal(resMd.html, undefined);

    // 2. text 纯净无格式文本：脱除 # 标题标记、** 粗体与代码块反引号
    const resText = formatItemContent(rawMd, "text", meta);
    assert.ok(!resText.text.includes("**用户**"));
    assert.ok(resText.text.includes("用户"));
    assert.ok(!resText.text.includes("```"));
    assert.equal(resText.html, undefined);

    // 3. wechat-html 富文本排版：生成内联样式的 HTML 实体与纯文本 fallback
    const resHtml = formatItemContent(rawMd, "wechat-html", meta);
    assert.ok(resHtml.html);
    assert.ok(resHtml.html.includes("<p style="));
    assert.ok(resHtml.html.includes("致歉说明"));
    assert.ok(resHtml.text.length > 0);

    // 4. blockref 原生块引用语法
    const resRef = formatItemContent(rawMd, "blockref", meta);
    assert.equal(resRef.text, "((20261101140000-sampleid '核心致歉说明'))");
});
