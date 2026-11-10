"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {search, service, library, ai, providers} = require("./.build/entry.cjs");
const {parseSearchGrammar, searchEntries} = search;

test("parseSearchGrammar: 提取 type / tag / #tag / cat / -excludeTokens 语法", () => {
    // 1. 混合语法复合解析
    const parsed = parseSearchGrammar("type:code tag:支付 #接口 cat:财务 -草稿 退款订单");
    assert.equal(parsed.itemType, "code");
    assert.equal(parsed.tag, "接口"); // 后续覆盖或提取
    assert.equal(parsed.category, "财务");
    assert.deepEqual(parsed.excludeTokens, ["草稿"]);
    assert.equal(parsed.text, "退款订单");

    // 2. 纯文本无特殊语法
    const plain = parseSearchGrammar("普通 搜索 词汇");
    assert.equal(plain.text, "普通 搜索 词汇");
    assert.equal(plain.itemType, undefined);
    assert.equal(plain.tag, undefined);
    assert.equal(plain.category, undefined);
    assert.deepEqual(plain.excludeTokens, []);
});

test("searchEntries: 多标签 #标签1 #标签2 交集过滤", () => {
    const entries = [
        {
            id: "xlc-multi-1",
            title: "微信退款处理",
            summary: "客服常用语",
            content: "退款流程",
            itemType: "text",
            tags: ["客服", "退款"],
            category: "财务",
            createdAt: 1000,
            updatedAt: 1000,
        },
        {
            id: "xlc-multi-2",
            title: "客服问候语",
            summary: "欢迎语",
            content: "欢迎光临",
            itemType: "text",
            tags: ["客服", "问候"],
            category: "通用",
            createdAt: 1000,
            updatedAt: 1000,
        },
    ];

    const ctx = {favorites: new Set(), recents: new Map()};
    // 检索 #客服 #退款：仅命中第一条
    const hits = searchEntries(entries, {text: "#客服 #退款", scope: "all"}, ctx);
    assert.equal(hits.length, 1);
    assert.equal(hits[0].entry.id, "xlc-multi-1");
});

test("searchEntries: 排除语法 -exclude 过滤命中项", () => {
    const entries = [
        {
            id: "xlc-1",
            title: "支付退款正式方案",
            summary: "这是正式文档",
            content: "正文内容",
            itemType: "text",
            tags: ["支付"],
            category: "财务",
            createdAt: 1000,
            updatedAt: 1000,
        },
        {
            id: "xlc-2",
            title: "支付退款草稿",
            summary: "这是草稿文档",
            content: "正文内容",
            itemType: "text",
            tags: ["支付"],
            category: "财务",
            createdAt: 1000,
            updatedAt: 1000,
        },
    ];

    const ctx = {
        favorites: new Set(),
        recents: new Map(),
    };

    // 搜索：支付 -草稿
    const hits = searchEntries(entries, {text: "支付 -草稿", scope: "all"}, ctx);
    assert.equal(hits.length, 1);
    assert.equal(hits[0].entry.id, "xlc-1");
    assert.equal(hits[0].entry.title, "支付退款正式方案");
});

test("resolve: 输出双格式直出载荷 (plainText & richHtml)", async () => {
    const lib = new library.LibraryService({
        request: () => Promise.resolve(null),
    });
    // Mock 一个条目
    lib.getItem = async () => ({
        ok: true,
        data: {
            id: "xlc-demo",
            title: "客户通知",
            itemType: "markdown",
            tags: ["客户"],
            category: "通知",
        },
    });
    lib.getItemKramdown = async () => ({
        ok: true,
        data: "尊敬的 **张总**：\n\n欢迎访问 [官网](https://siyuan-note.com)。",
    });
    lib.expandSnippetRefs = async (t) => t;

    const s = new service.XiaolvCommonService({
        library: lib,
        executor: {
            renderForInsert: async (text) => text,
        },
        registry: new providers.ProviderRegistry(),
        ai: new ai.AiAssistant({request: async () => ({code: 0, data: null})}, {enabled: false, shareContent: false}),
        state: {favorites: [], recents: [], usage: {}, providers: [], uiPrefs: {}},
        onStateChange: () => {},
    });

    const res = await s.resolve("xlc-demo");
    assert.equal(res.ok, true);
    assert.ok(res.data);
    // plainText: 剥离粗体与超链接 Markdown 语法
    assert.ok(res.data.plainText.includes("张总"));
    assert.ok(!res.data.plainText.includes("**"));
    assert.ok(res.data.plainText.includes("官网 https://siyuan-note.com"));

    // richHtml: 渲染为带 <strong> 标签的 HTML
    assert.ok(res.data.richHtml);
    assert.ok(res.data.richHtml.includes("<strong>张总</strong>"));
});
