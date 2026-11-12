"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {usageInsights, storage, shareCard} = require("./.build/entry.cjs");
const {calculateHeatmap, buildDailyUsageMap} = usageInsights;
const {removeRecentQuery} = storage;
const {openShareCardDialog} = shareCard;

test("TODO-FEAT-008: 近 30 天每日资产复用活跃热力图数据模型与等级映射契约", () => {
    const fixedNow = new Date("2026-11-01T12:00:00Z").getTime();

    // 1. 测试 buildDailyUsageMap：合并已有 dailyUsage 与 usage.lastAt
    const rawDaily = {
        "2026-11-01": 15,
        "2026-10-31": 7,
        "2026-10-25": 2,
    };
    const legacyUsage = {
        "xlc-item1": {count: 20, lastAt: new Date("2026-10-20T10:00:00Z").getTime()},
    };
    const mergedDaily = buildDailyUsageMap(rawDaily, legacyUsage);
    assert.equal(mergedDaily["2026-11-01"], 15);
    assert.equal(mergedDaily["2026-10-31"], 7);
    assert.equal(mergedDaily["2026-10-25"], 2);
    assert.equal(mergedDaily["2026-10-20"], 5); // legacy 保底映射

    // 2. 测试 calculateHeatmap：近 30 天切片与等级划分契约
    const heatmap = calculateHeatmap(mergedDaily, 30, fixedNow);
    assert.equal(heatmap.days.length, 30);
    assert.equal(heatmap.days[29].date, "2026-11-01");
    assert.equal(heatmap.days[29].count, 15);
    assert.equal(heatmap.days[29].level, 4); // count >= 10 -> level 4

    assert.equal(heatmap.days[28].date, "2026-10-31");
    assert.equal(heatmap.days[28].count, 7);
    assert.equal(heatmap.days[28].level, 3); // 6 <= count <= 9 -> level 3

    assert.ok(heatmap.activeDays >= 3);
    assert.ok(heatmap.totalCalls30Days >= 24);
    assert.equal(heatmap.maxDayCount, 15);
});

test("TODO-FEAT-009: 搜索历史队列单条精准删除与不变性契约", () => {
    const history = ["合同模板", "错字查询xyz", "致歉信", "发票开具"];

    // 1. 删除中间的手误错词
    const result1 = removeRecentQuery(history, "错字查询xyz");
    assert.deepEqual(result1, ["合同模板", "致歉信", "发票开具"]);

    // 2. 带首尾空格的入参安全清洗
    const result2 = removeRecentQuery(history, "  致歉信  ");
    assert.deepEqual(result2, ["合同模板", "错字查询xyz", "发票开具"]);

    // 3. 删除不存在的词保持原样，原数组不被破坏
    const result3 = removeRecentQuery(history, "不存在的内容");
    assert.deepEqual(result3, history);
    assert.equal(history.length, 4); // 不可变性

    // 4. 空入参保护
    const result4 = removeRecentQuery(history, "");
    assert.deepEqual(result4, history);
});

test("TODO-FEAT-010: 单条便携分享码卡片 DOM 装配与复制闭环契约", async () => {
    const originalDoc = global.document;

    function makeElem(tag) {
        return {
            tagName: tag.toUpperCase(),
            style: {},
            className: "",
            textContent: "",
            value: "",
            rows: 0,
            dataset: {},
            children: [],
            appendChild(child) {
                this.children.push(child);
                return child;
            },
            append(...items) {
                for (const item of items) {
                    this.appendChild(item);
                }
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
            dispatchEvent(ev) {
                const fns = this._listeners?.[ev.type] || [];
                for (const f of fns) f(ev);
            },
            querySelector(sel) {
                if (sel === ".b3-dialog__body") return this;
                return null;
            },
        };
    }

    const mockDoc = {
        createElement: (tag) => makeElem(tag),
        createTextNode: (text) => ({ textNode: true, textContent: text }),
    };

    global.document = mockDoc;

    try {
        let copiedText = "";
        let notifiedMsg = "";
        const mockDeps = {
            t: (k) => k,
            copyText: async (text) => {
                copiedText = text;
                return true;
            },
            notify: (type, msg) => {
                notifiedMsg = msg;
            },
        };

        const item = {
            id: "xlc-sample001",
            title: "核心致歉说明",
            itemType: "text",
            category: "客户服务",
            tags: ["售后", "致歉"],
            summary: "尊敬的客户，非常抱歉给您带来不便...",
            varCount: 2,
        };

        const testShareCode = "xlc-bundle:eyJmb28iOiJiYXIifQ==";

        const dialog = openShareCardDialog(mockDeps, item, testShareCode);
        assert.ok(dialog);

        // 验证对话框容器
        const body = dialog.element.querySelector(".b3-dialog__body");
        assert.ok(body);
        assert.ok(body.children.length > 0);

        const container = body.children[0];
        assert.equal(container.className, "xlc-share-card-container");

        // 验证分享码文本域包含分享码
        const codeSec = container.children.find((c) => c.className === "xlc-share-card-code-sec");
        assert.ok(codeSec);
        const textarea = codeSec.children.find((c) => c.dataset?.xlcControl === "share-card.textarea");
        assert.ok(textarea);
        assert.equal(textarea.value, testShareCode);

        // 验证复制按钮触发
        const foot = container.children.find((c) => c.className === "xlc-share-card-actions");
        assert.ok(foot);
        const copyBtn = foot.children.find((c) => c.dataset?.xlcControl === "share-card.copy");
        assert.ok(copyBtn);

        // 触发复制
        await copyBtn._listeners["click"][0]();
        assert.equal(copiedText, testShareCode);
    } finally {
        global.document = originalDoc;
    }
});
