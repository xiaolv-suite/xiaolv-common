"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {lvNoticeKit} = require("./.build/entry.cjs");
const {lvNotify} = lvNoticeKit;

// Setup a mock DOM environment for node:test
function setupMockDom() {
    const elements = new Map();
    const eventListeners = new Map();

    const mockBody = {
        appendChild(child) {
            elements.set(child.id || `node_${Math.random()}`, child);
            return child;
        },
        removeChild(child) {
            elements.delete(child.id);
            return child;
        }
    };

    const mockHead = {
        appendChild(child) {
            elements.set(child.id, child);
            return child;
        }
    };

    const mockDoc = {
        body: mockBody,
        head: mockHead,
        getElementById(id) {
            return elements.get(id) || null;
        },
        createElement(tagName) {
            let _innerHTML = "";
            const el = {
                tagName: tagName.toUpperCase(),
                id: "",
                className: "",
                classList: {
                    _classes: new Set(),
                    add(...cls) { cls.forEach((c) => this._classes.add(c)); },
                    remove(...cls) { cls.forEach((c) => this._classes.delete(c)); },
                    contains(c) { return this._classes.has(c); },
                    toggle(c, force) {
                        if (force === undefined) {
                            if (this._classes.has(c)) this._classes.delete(c);
                            else this._classes.add(c);
                        } else if (force) {
                            this._classes.add(c);
                        } else {
                            this._classes.delete(c);
                        }
                    }
                },
                dataset: {},
                children: [],
                get innerHTML() { return _innerHTML; },
                set innerHTML(val) {
                    _innerHTML = String(val);
                    if (_innerHTML === "") {
                        this.children = [];
                    }
                },
                textContent: "",
                style: {},
                attributes: new Map(),
                setAttribute(k, v) { this.attributes.set(k, String(v)); },
                getAttribute(k) { return this.attributes.has(k) ? this.attributes.get(k) : null; },
                removeAttribute(k) { this.attributes.delete(k); },
                appendChild(c) { this.children.push(c); return c; },
                remove() {
                    elements.delete(this.id);
                },
                querySelector() { return null; },
                querySelectorAll() { return []; },
                addEventListener() {},
                removeEventListener() {}
            };
            return el;
        }
    };

    const mockStorage = new Map();
    const mockLocalStorage = {
        getItem(k) { return mockStorage.get(k) || null; },
        setItem(k, v) { mockStorage.set(k, String(v)); },
        removeItem(k) { mockStorage.delete(k); }
    };

    global.document = mockDoc;
    global.window = {
        addEventListener(evt, fn) {
            eventListeners.set(evt, fn);
        },
        removeEventListener(evt) {
            eventListeners.delete(evt);
        },
        setTimeout(fn, ms) {
            return setTimeout(fn, ms);
        },
        clearTimeout(t) {
            clearTimeout(t);
        }
    };
    global.localStorage = mockLocalStorage;

    return {
        teardown() {
            delete global.window.__LV_NOTICE_HUB__;
            delete global.document;
            delete global.window;
            delete global.localStorage;
        }
    };
}

test("lvNotify · 全生态去中心化统一通知系统标准套件接入验收", async (t) => {
    let domScope;

    t.beforeEach(() => {
        domScope = setupMockDom();
    });

    t.afterEach(() => {
        domScope.teardown();
    });

    await t.test("inline 原位微动效：直接给触发目标添加临时微动效类，坚决不向 DOM 添加弹窗", () => {
        const btn = global.document.createElement("button");
        global.document.body.appendChild(btn);

        lvNotify.inline(btn, "已复制", true);
        assert.equal(btn.classList.contains("lv-inline-feedback-active"), true, "必须包含微动效类 lv-inline-feedback-active");
        assert.equal(btn.classList.contains("lv-inline-feedback--success"), true, "成功必须包含 lv-inline-feedback--success");
        assert.equal(btn.getAttribute("title"), "已复制", "标题应提示已复制");

        const host = global.document.getElementById("lv-notice-host");
        assert.equal(host, null, "inline 原位微动效绝不创建全局弹窗宿主");
    });

    await t.test("capsule 瞬时微胶囊：创建轻量级 capsule 容器并在 2.5s 后自然销毁", () => {
        const id = lvNotify.capsule({
            source: "小驴常用",
            message: "已保存片段",
            duration: 2500,
        });

        assert.ok(id.startsWith("cap_"), "capsule 生成 cap_ 前缀 ID");
        const host = global.document.getElementById("lv-notice-host");
        assert.notEqual(host, null, "capsule 应挂载到全局 host");
        assert.equal(host.children.length, 1, "host 内应存在 1 个 capsule");
        assert.equal(host.children[0].className, "lv-notice-capsule", "节点类名应为 lv-notice-capsule");
    });

    await t.test("card 重点交互卡片：支持错误高亮并记入历史", () => {
        const id = lvNotify.card({
            source: "小驴常用",
            title: "保存失败",
            message: "网络异常或内核不可用",
            level: "error",
            duration: 6000,
        });

        assert.ok(id.startsWith("card_"), "card 生成 card_ 前缀 ID");
        const host = global.document.getElementById("lv-notice-host");
        assert.notEqual(host, null);
        assert.equal(host.children.length, 1);
        assert.equal(host.children[0].className, "lv-notice-card");
        assert.equal(host.children[0].dataset.level, "error");
    });

    await t.test("silent 静默入库：绝不渲染到 DOM，仅进入历史记录", () => {
        lvNotify.silent({
            source: "小驴常用",
            message: "后台同步完毕",
        });

        const host = global.document.getElementById("lv-notice-host");
        assert.equal(host?.children.length || 0, 0, "silent 绝不向 DOM 添加任何子节点");
        const history = global.window.__LV_NOTICE_HUB__?.getHistory() || [];
        assert.equal(history.length, 1);
        assert.equal(history[0].message, "后台同步完毕");
    });

    await t.test("同类高频消息 3 秒内自动折叠与计数", () => {
        lvNotify.capsule({source: "小驴常用", message: "连击测试"});
        lvNotify.capsule({source: "小驴常用", message: "连击测试"});
        lvNotify.capsule({source: "小驴常用", message: "连击测试"});

        const host = global.document.getElementById("lv-notice-host");
        assert.equal(host.children.length, 1, "3次同类消息应合并为1个节点");
    });

    await t.test("生命周期 registerPlugin 与注销交棒 (Relinquish)", () => {
        const unregCommon = lvNotify.registerPlugin("xiaolv-common");
        const unregRaikiri = lvNotify.registerPlugin("siyuan-speed-switch");

        assert.notEqual(global.document.getElementById("lv-notice-host"), null);
        assert.equal(global.window.__LV_NOTICE_HUB__?.hostPlugin, "xiaolv-common");

        unregCommon(); // xiaolv-common 注销，交棒给下一个插件
        assert.notEqual(global.document.getElementById("lv-notice-host"), null, "还有其他插件注册时 DOM 保持");
        assert.equal(global.window.__LV_NOTICE_HUB__?.hostPlugin, "siyuan-speed-switch", "应平滑交棒给下一个插件");

        unregRaikiri(); // 最后一个插件注销，清理 DOM
        assert.equal(global.document.getElementById("lv-notice-host"), null, "全员离线时应销毁 host");
        assert.equal(global.window.__LV_NOTICE_HUB__, undefined, "全局 Hub 引用应已删除");
    });
});
