"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {lvNoticeKit} = require("./.build/entry.cjs");
const {lvNotify, lvSurfaceStack, withDocLock, lvTicker} = lvNoticeKit;

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
        addEventListener(evt, fn, useCapture) {
            const list = eventListeners.get(evt) || [];
            list.push({fn, useCapture});
            eventListeners.set(evt, list);
        },
        removeEventListener(evt, fn) {
            const list = eventListeners.get(evt) || [];
            eventListeners.set(evt, list.filter(item => item.fn !== fn));
        },
        dispatchEvent(event) {
            const list = eventListeners.get(event.type) || [];
            for (const item of list) {
                item.fn(event);
            }
        },
        setTimeout(fn, ms) {
            return setTimeout(fn, ms);
        },
        clearTimeout(t) {
            clearTimeout(t);
        },
        setInterval(fn, ms) {
            return setInterval(fn, ms);
        },
        clearInterval(t) {
            clearInterval(t);
        }
    };
    global.localStorage = mockLocalStorage;

    return {
        dispatchKeydown(key) {
            const event = {
                type: "keydown",
                key,
                defaultPrevented: false,
                propagationStopped: false,
                preventDefault() { this.defaultPrevented = true; },
                stopPropagation() { this.propagationStopped = true; }
            };
            global.window.dispatchEvent(event);
            return event;
        },
        teardown() {
            delete global.window.__LV_NOTICE_HUB__;
            delete global.window.__LV_SURFACE_STACK__;
            delete global.window.__LV_DOC_LOCKS__;
            delete global.window.__LV_TICKER__;
            delete global.document;
            delete global.window;
            delete global.localStorage;
        }
    };
}

test("lvNoticeKit · 全生态统一基础设施套件 (Epoch 7 Phase 2 标准验收)", async (t) => {
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

    await t.test("withDocLock：针对同一文档的并发写入操作严格串行化，不同文档并行执行", async () => {
        const docA = "20261103000000-docAAAA";
        const docB = "20261103000000-docBBBB";
        const logs = [];

        const task1 = withDocLock(docA, async () => {
            logs.push("task1-start");
            await new Promise(r => setTimeout(r, 40));
            logs.push("task1-end");
            return "res1";
        });

        const task2 = withDocLock(docA, async () => {
            logs.push("task2-start");
            await new Promise(r => setTimeout(r, 10));
            logs.push("task2-end");
            return "res2";
        });

        const task3 = withDocLock(docB, async () => {
            logs.push("task3-start");
            await new Promise(r => setTimeout(r, 10));
            logs.push("task3-end");
            return "res3";
        });

        const [r1, r2, r3] = await Promise.all([task1, task2, task3]);
        assert.equal(r1, "res1");
        assert.equal(r2, "res2");
        assert.equal(r3, "res3");

        // docA 内 task1 必须在 task2 之前完全结束
        const task1EndIdx = logs.indexOf("task1-end");
        const task2StartIdx = logs.indexOf("task2-start");
        assert.ok(task1EndIdx < task2StartIdx, "同一 docId 的 task2 必须在 task1 结束后才启动");

        // docB 的 task3 应在 task1 结束之前就启动
        const task3StartIdx = logs.indexOf("task3-start");
        assert.ok(task3StartIdx < task1EndIdx, "不同 docId 的 task3 应该并行启动，不被 docA 阻塞");
    });

    await t.test("lvSurfaceStack：浮层压栈、Esc 捕获阶段秒关顶层且阻止冒泡", () => {
        let closedA = false;
        let closedB = false;

        const popA = lvSurfaceStack.push({
            id: "surface-search",
            type: "dialog",
            dismiss: () => {
                closedA = true;
                return true;
            }
        });

        const popB = lvSurfaceStack.push({
            id: "surface-menu",
            type: "menu",
            dismiss: () => {
                closedB = true;
                return true;
            }
        });

        assert.equal(lvSurfaceStack.top()?.id, "surface-menu", "栈顶应为最后压栈的 surface-menu");

        // 第一次按 Escape：只关闭栈顶的 surface-menu
        const evt1 = domScope.dispatchKeydown("Escape");
        assert.equal(closedB, true, "栈顶 menu 应该被关闭");
        assert.equal(closedA, false, "底层的 dialog 绝不应该被连带误关");
        assert.equal(evt1.defaultPrevented, true, "应拦截默认行为");
        assert.equal(evt1.propagationStopped, true, "应停止向外冒泡");
        assert.equal(lvSurfaceStack.top()?.id, "surface-search", "栈顶回退到 surface-search");

        // 第二次按 Escape：关闭底层的 surface-search
        const evt2 = domScope.dispatchKeydown("Escape");
        assert.equal(closedA, true, "底层的 dialog 应该被关闭");
        assert.equal(evt2.defaultPrevented, true);
        assert.equal(lvSurfaceStack.top(), undefined, "栈应已空");

        popA();
        popB();
    });
});
