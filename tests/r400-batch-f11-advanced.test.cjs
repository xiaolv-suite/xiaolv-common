"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {expansion, contextualRecommend, pinboard} = require("./.build/entry.cjs");
const {findExpansionMatch, cleanExpansionBuffer} = expansion;
const {calculateContextualScore, getRecommendedEntries} = contextualRecommend;
const {openPinboardDialog} = pinboard;

test("TODO-FEAT-025: 行内击键自展开引擎纯函数契约 (findExpansionMatch / cleanExpansionBuffer)", () => {
    const dictionary = [
        {trigger: ":sjh", item: {id: "1", title: "手机号", content: "18588888888"}},
        {trigger: ":phone_backup", item: {id: "2", title: "备用电话", content: "0755-12345678"}},
        {trigger: ";email", item: {id: "3", title: "客服邮箱", content: "service@xiaolv.com"}},
    ];

    // 1. 缓冲区末尾精准命中自展开简码
    const match1 = findExpansionMatch("你好，我的手机号是:sjh", dictionary);
    assert.ok(match1);
    assert.equal(match1.trigger, ":sjh");
    assert.equal(match1.matchLength, 4);
    assert.equal(match1.item.content, "18588888888");

    // 2. 长简码优先匹配（避免短前缀误吞）
    const match2 = findExpansionMatch("请联系我:phone_backup", dictionary);
    assert.ok(match2);
    assert.equal(match2.trigger, ":phone_backup");
    assert.equal(match2.matchLength, 13);

    // 3. 分号前缀命中
    const match3 = findExpansionMatch("请发送邮件至;email", dictionary);
    assert.ok(match3);
    assert.equal(match3.trigger, ";email");

    // 4. 未完整输入或中间打断时不命中
    assert.equal(findExpansionMatch("我的手机号是:sj", dictionary), null);
    assert.equal(findExpansionMatch("无匹配内容", dictionary), null);

    // 5. cleanExpansionBuffer 遇换行清空与容量截断
    assert.equal(cleanExpansionBuffer("第一行文字\n第二行:sjh"), "第二行:sjh");
    assert.equal(cleanExpansionBuffer("1234567890123456789012345678901234567890", 20), "12345678901234567890");
});

test("TODO-FEAT-026: 当前文档上下文语义感知与智能首屏推荐算法契约", () => {
    const entries = [
        {id: "e1", title: "开票税号", category: "财务/发票", tags: ["发票", "财务"]},
        {id: "e2", title: "售后致歉信", category: "客户服务", tags: ["客服", "致歉"]},
        {id: "e3", title: "数据库连接池配置", category: "技术研发", tags: ["后端", "数据库"]},
    ];

    // 1. 当当前文档标题包含「发票与报销说明」时，自动命中 e1
    const docCtx1 = {
        title: "发票与报销说明",
        hPath: "财务部/日常发票报销",
        tags: ["发票"],
    };
    const score1 = calculateContextualScore(entries[0], docCtx1);
    assert.ok(score1.score >= 80);
    assert.ok(score1.reasons.some((r) => r.includes("发票")));

    // 2. 无关条目（e3 研发）在此文档上下文下得分为 0
    const score3 = calculateContextualScore(entries[2], docCtx1);
    assert.equal(score3.score, 0);

    // 3. getRecommendedEntries 自动筛选并排序
    const recs = getRecommendedEntries(entries, docCtx1, 2);
    assert.equal(recs.length, 1);
    assert.equal(recs[0].entry.id, "e1");

    // 4. 空文档上下文安全保护
    const emptyRecs = getRecommendedEntries(entries, {});
    assert.equal(emptyRecs.length, 0);
});

test("TODO-FEAT-027: 主题套件连环取用拼板 DOM 装配与进度指示契约", async () => {
    const originalDoc = global.document;

    function makeElem(tag) {
        return {
            tagName: tag.toUpperCase(),
            style: {},
            className: "",
            textContent: "",
            children: [],
            dataset: {},
            appendChild(child) {
                this.children.push(child);
                return child;
            },
            append(...items) {
                for (const it of items) this.appendChild(it);
            },
            setAttribute(k, v) { this[k] = v; },
            getAttribute(k) { return this[k] ?? null; },
            removeAttribute(k) { delete this[k]; },
            classList: {
                add(...cls) { cls.forEach((c) => this._classes.add(c)); },
                remove(...cls) { cls.forEach((c) => this._classes.delete(c)); },
                contains(c) { return this._classes.has(c); },
                _classes: new Set(),
            },
            addEventListener(ev, fn) {
                this._listeners ??= {};
                this._listeners[ev] ??= [];
                this._listeners[ev].push(fn);
            },
            querySelector(sel) {
                if (sel === ".b3-dialog__body") return this;
                return null;
            },
            querySelectorAll() { return []; },
        };
    }

    const mockDoc = {
        createElement: (tag) => makeElem(tag),
        createTextNode: (t) => ({ textContent: t }),
    };

    global.document = mockDoc;

    try {
        let copiedText = "";
        const mockDeps = {
            t: (k) => k,
            copyText: async (t) => {
                copiedText = t;
                return true;
            },
            notify: () => {},
        };

        const items = [
            {id: "p1", title: "公司抬头", content: "小驴科技有限公司"},
            {id: "p2", title: "税号", content: "91440300123456789X"},
        ];

        const dlg = openPinboardDialog(mockDeps, "开票资料套件", items);
        assert.ok(dlg);

        const body = dlg.element.querySelector(".b3-dialog__body");
        assert.ok(body);
        assert.ok(body.children.length > 0);

        const container = body.children[0];
        assert.equal(container.className, "xlc-pinboard-container");

        // 验证卡片列表生成
        const grid = container.children.find((c) => c.className === "xlc-pinboard-grid");
        assert.ok(grid);
        assert.equal(grid.children.length, 2);

        // 触发卡片 1 复制
        const card1 = grid.children[0];
        assert.ok(card1._listeners["click"]);
        await card1._listeners["click"][0]();
        assert.equal(copiedText, "小驴科技有限公司");
        assert.ok(card1.classList.contains("xlc-pinboard-card--copied"));
    } finally {
        global.document = originalDoc;
    }
});
