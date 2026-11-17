"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {lvNoticeKit, ai} = require("./.build/entry.cjs");
const {lvNotify, lvSurfaceStack, withDocLock, lvTicker, lvActivity, lvAi, lvBackup, lvEcosystem, lvLaunchpad, lvOmnisearch, lvAutomation} = lvNoticeKit;
const {aiSmartExpandTemplate, aiSmartFillVariables, aiGenerateSnippetVariants} = ai;

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
            const id = setTimeout(fn, ms);
            if (id && typeof id.unref === "function") id.unref();
            return id;
        },
        clearTimeout(t) {
            clearTimeout(t);
        },
        setInterval(fn, ms) {
            const id = setInterval(fn, ms);
            if (id && typeof id.unref === "function") id.unref();
            return id;
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
            delete global.window.__LV_AI_GATEWAY__;
            delete global.window.__LV_ACTIVITY_STREAM__;
            delete global.window.__LV_BACKUP_HUB__;
            delete global.window.__LV_LAUNCHPAD__;
            delete global.window.__LV_OMNISEARCH__;
            delete global.window.__LV_AUTOMATION__;
            delete global.document;
            delete global.window;
            delete global.localStorage;
        }
    };
}

test("lvNoticeKit · 全生态统一基础设施套件 (Epoch 7 Phase 7 标准验收)", async (t) => {
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

        // 验证并发写入正确串行化
        const lockMap = global.window?.__LV_DOC_LOCKS__;
        assert.ok(lockMap, "lockMap 必须存在");
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

    await t.test("lvSurfaceStack：支持返回 false 阻止关闭且保留在栈中", () => {
        let dummyDismissCount = 0;
        let shouldDismiss = false;

        const popDummy = lvSurfaceStack.push({
            id: "surface-dummy-inactive",
            type: "card",
            dismiss: () => {
                dummyDismissCount++;
                return shouldDismiss ? true : false;
            },
        });

        // 第一次按 Escape：返回 false，不移除
        const evt1 = domScope.dispatchKeydown("Escape");
        assert.equal(dummyDismissCount, 1);
        assert.equal(lvSurfaceStack.top()?.id, "surface-dummy-inactive", "返回 false 时应保留在栈中");

        // 第二次按 Escape：返回 true，正常关闭出栈
        shouldDismiss = true;
        const evt2 = domScope.dispatchKeydown("Escape");
        assert.equal(dummyDismissCount, 2);
        assert.equal(evt2.defaultPrevented, true);
        assert.equal(lvSurfaceStack.top(), undefined, "返回 true 时应移出栈");

        popDummy();
    });

    await t.test("lvActivity · 今日全生态活动主干流：广播记录、升序获取与一键 Markdown 汇编", () => {
        let broadcastReceived = null;
        const unlisten = lvActivity.onActivity((item) => {
            broadcastReceived = item;
        });

        // 模拟广播应用重要常用片段
        lvActivity.record({
            source: "常用",
            category: "note",
            title: "应用常用模版「工作周报」",
            linkBlockId: "20261103120000-block123",
            detail: "含 3 个动态宏",
        });

        assert.notEqual(broadcastReceived, null, "应实时收到活动广播事件");
        assert.equal(broadcastReceived.source, "常用");
        assert.equal(broadcastReceived.category, "note");
        assert.equal(broadcastReceived.title, "应用常用模版「工作周报」");

        const todayRecords = lvActivity.getTodayRecords();
        assert.ok(todayRecords.length >= 1, "今日记录列表中应包含刚才记录的项");
        const lastRecord = todayRecords[todayRecords.length - 1];
        assert.equal(lastRecord.title, "应用常用模版「工作周报」");
        assert.ok(/^\d{2}:\d{2}$/.test(lastRecord.timeStr), "应包含格式为 HH:mm 的时间戳字符串");

        const md = lvActivity.formatAsMarkdown();
        assert.ok(md.includes("### 🐴 小驴全家桶 · 今日活动汇编"), "Markdown 汇编应包含全家桶头部");
        assert.ok(md.includes("[常用] 💡 应用常用模版「工作周报」"), "Markdown 应正确识别 note 类型的 💡 图标与来源前缀");
        assert.ok(md.includes("siyuan://blocks/20261103120000-block123"), "Markdown 应包含思源块引用超链接");

        unlisten();
    });

    await t.test("lvAi · 统一凭据配置与读取", () => {
        lvAi.setConfig({
            apiKey: "sk-test-shared-key-123456",
            endpoint: "https://api.deepseek.com/v1",
            model: "deepseek-chat",
        });

        const cfg = lvAi.getConfig();
        assert.notEqual(cfg, null);
        assert.equal(cfg.apiKey, "sk-test-shared-key-123456");
        assert.equal(cfg.model, "deepseek-chat");
    });

    await t.test("lvBackup · 全家桶一键联合灾备切面：注册、全量导出与一键联合恢复", async () => {
        let restoredDataCommon = null;
        let restoredDataGate = null;

        const unregCommon = lvBackup.register(
            "xiaolv-common",
            async () => ({
                config: { mode: "doc" },
                itemsCount: 42,
            }),
            async (data) => {
                restoredDataCommon = data;
                return true;
            }
        );

        const unregGate = lvBackup.register(
            "siyuan-quickgate",
            async () => ({
                settings: { theme: "dark" },
            }),
            async (data) => {
                restoredDataGate = data;
                return true;
            }
        );

        // 全量联合导出
        const bundle = await lvBackup.exportFull();
        assert.equal(bundle.v, 1);
        assert.equal(bundle.ecosystem, "xiaolv");
        assert.ok(bundle.exportedAt);
        assert.ok(bundle.plugins["xiaolv-common"]);
        assert.equal(bundle.plugins["xiaolv-common"].data.itemsCount, 42);
        assert.ok(bundle.plugins["siyuan-quickgate"]);
        assert.deepEqual(bundle.plugins["siyuan-quickgate"].data.settings, { theme: "dark" });

        // 全量联合恢复
        const result = await lvBackup.restoreFull(bundle);
        assert.deepEqual(result.failed, []);
        assert.ok(result.success.includes("xiaolv-common"));
        assert.ok(result.success.includes("siyuan-quickgate"));
        assert.equal(restoredDataCommon.itemsCount, 42);
        assert.deepEqual(restoredDataGate.settings, { theme: "dark" });

        // 注销清理
        unregCommon();
        unregGate();
    });

    await t.test("lvEcosystem · 全生态健康自省与指示徽章", () => {
        const unreg = lvBackup.register(
            "xiaolv-common",
            async () => ({}),
            async () => true
        );

        const diag = lvEcosystem.getDiagnostics();
        assert.ok(diag.version >= 170);
        assert.ok(diag.registeredPlugins.includes("xiaolv-common"));
        assert.equal(typeof diag.todayActivitiesCount, "number");

        const badgeText = lvEcosystem.getStatusBadgeText();
        assert.ok(badgeText.startsWith("🐴 小驴全家桶"));
        assert.ok(badgeText.includes("插件已联结"));
        assert.ok(badgeText.includes("今日活动"));

        unreg();
    });

    await t.test("lvLaunchpad · 小驴罗盘顶栏收敛与极速二级行动", () => {
        let clicked = false;
        let actionExecuted = "";

        const unreg = lvLaunchpad.register({
            id: "xiaolv-common",
            name: "常用",
            fullName: "小驴常用",
            svgIcon: "icon-lv-common",
            color: "#14b8a6",
            desc: "常用片段 · 宏模版",
            digit: 8,
            badge: "常用 18 项",
            badgeType: "primary",
            actions: ["快速搜索片段代码", "新建常用富文本宏模版", "查看近期高频调用历史记录"],
            onClick: () => { clicked = true; },
            onAction: (act) => { actionExecuted = act; },
        });

        const items = lvLaunchpad.getItems();
        const commonItem = items.find(i => i.id === "xiaolv-common");
        assert.ok(commonItem, "罗盘内应成功注册 xiaolv-common");
        assert.equal(commonItem.name, "常用");
        assert.equal(commonItem.digit, 8);
        assert.equal(commonItem.state, "docked", "默认状态应为收敛入坞 docked");
        assert.deepEqual(commonItem.actions, ["快速搜索片段代码", "新建常用富文本宏模版", "查看近期高频调用历史记录"]);

        // 测试点击主入口
        commonItem.onClick();
        assert.equal(clicked, true, "onClick 应被正常触发");

        // 测试二级快捷行动
        commonItem.onAction?.("新建常用富文本宏模版");
        assert.equal(actionExecuted, "新建常用富文本宏模版", "onAction 应接收到正确的二级动作名");

        // 测试用户设定三态呈现属性 (pinned / docked / hidden)
        lvLaunchpad.setPluginState("xiaolv-common", "pinned");
        const pinnedItems = lvLaunchpad.getItems();
        assert.equal(pinnedItems.find(i => i.id === "xiaolv-common")?.state, "pinned", "状态应更新为 pinned 置顶在外");

        // 测试注销清理
        unreg();
        const afterUnreg = lvLaunchpad.getItems();
        assert.equal(afterUnreg.find(i => i.id === "xiaolv-common"), undefined, "注销后应从罗盘列表移除");
    });

    await t.test("lvActivity · 获取今日生态活动量化指标 (getDailyStats)", () => {
        lvActivity.record({
            source: "常用",
            category: "note",
            title: "应用常用模版「工作周报」",
        });
        const stats = lvActivity.getDailyStats();
        assert.ok(stats.total >= 1, "total 指标应至少为 1");
        assert.ok(stats.note >= 1, "note category 指标应至少为 1");
        assert.ok(stats["常用"] >= 1, "常用 source 指标应至少为 1");
    });

    await t.test("lvLaunchpad · 二级快捷行动 executeAction 穿透直达", () => {
        let executedAction = "";
        const unreg = lvLaunchpad.register({
            id: "xiaolv-common",
            name: "常用",
            fullName: "小驴常用",
            svgIcon: "icon-lv-common",
            color: "#14b8a6",
            actions: ["快速搜索片段代码", "新建常用富文本宏模版", "查看近期高频调用历史记录", "生成常用智能变体"],
            onClick: () => {},
            onAction: (act) => { executedAction = act; },
        });

        const ok = lvLaunchpad.executeAction("xiaolv-common", "生成常用智能变体");
        assert.equal(ok, true, "executeAction 应返回 true");
        assert.equal(executedAction, "生成常用智能变体", "应成功执行指定的二级动作");

        unreg();
    });

    await t.test("aiSmartExpandTemplate · 模版根据上下文智能展开与补全", async () => {
        const originalFetch = global.fetch;
        try {
            lvAi.setConfig({
                apiKey: "sk-test-ai-key",
                endpoint: "https://api.deepseek.com/v1",
                model: "deepseek-chat",
            });

            global.fetch = async (url, opts) => {
                const reqBody = JSON.parse(opts.body);
                assert.ok(reqBody.messages);
                return {
                    ok: true,
                    status: 200,
                    async json() {
                        return {
                            choices: [{
                                message: {
                                    content: "尊敬的项目组：请于 2026-11-05 前提交 核心功能开发周报，谢谢！"
                                }
                            }],
                            model: "deepseek-chat"
                        };
                    }
                };
            };

            const template = "尊敬的{{xlc:ask:team}}：请于 {{xlc:ask:deadline}} 前提交 {{xlc:ask:reportName}}，谢谢！";
            const expanded = await aiSmartExpandTemplate(template, {
                docTitle: "项目进度管理",
                before: "当前进入核心功能冲刺阶段",
            });

            assert.ok(expanded.includes("核心功能开发周报"));
            assert.ok(expanded.includes("2026-11-05"));

            // 智能变量推断键值对测试
            global.fetch = async () => ({
                ok: true,
                status: 200,
                async json() {
                    return {
                        choices: [{
                            message: {
                                content: JSON.stringify({
                                    team: "前端研发组",
                                    deadline: "周五下班前",
                                    reportName: "Sprint 42 进展"
                                })
                            }
                        }],
                        model: "deepseek-chat"
                    };
                }
            });

            const fills = await aiSmartFillVariables(template, { docTitle: "研发周例会" });
            assert.equal(fills.team, "前端研发组");
            assert.equal(fills.deadline, "周五下班前");
            assert.equal(fills.reportName, "Sprint 42 进展");
        } finally {
            global.fetch = originalFetch;
        }
    });

    await t.test("aiGenerateSnippetVariants · 常用片段生成中英双语版、礼貌商务版、极简要点版子模版", async () => {
        const originalFetch = global.fetch;
        try {
            lvAi.setConfig({
                apiKey: "sk-test-ai-key",
                endpoint: "https://api.deepseek.com/v1",
                model: "deepseek-chat",
            });

            global.fetch = async () => ({
                ok: true,
                status: 200,
                async json() {
                    return {
                        choices: [{
                            message: {
                                content: JSON.stringify({
                                    bilingual: "请尽快确认需求 / Please confirm the requirements ASAP.",
                                    business: "烦请各位领导与同事在百忙之中协助确认需求，感谢您的支持与配合！",
                                    concise: "- 需求确认：请尽快完成"
                                })
                            }
                        }],
                        model: "deepseek-chat"
                    };
                }
            });

            const variants = await aiGenerateSnippetVariants("需求确认通知", "请确认需求");
            assert.equal(variants.length, 3);
            const [bilingual, business, concise] = variants;

            assert.equal(bilingual.type, "bilingual");
            assert.equal(bilingual.label, "中英双语版");
            assert.equal(bilingual.titleSuffix, " (中英双语版)");
            assert.ok(bilingual.content.includes("Please confirm"));

            assert.equal(business.type, "business");
            assert.equal(business.label, "礼貌商务版");
            assert.equal(business.titleSuffix, " (礼貌商务版)");
            assert.ok(business.content.includes("协助确认需求"));

            assert.equal(concise.type, "concise");
            assert.equal(concise.label, "极简要点版");
            assert.equal(concise.titleSuffix, " (极简要点版)");
            assert.ok(concise.content.includes("- 需求确认"));
        } finally {
            global.fetch = originalFetch;
        }
    });

    await t.test("lvOmnisearch · 统一全局穿透搜索与跨插件全文检索", async () => {
        let insertedId = "";

        const unregCommon = lvOmnisearch.registerProvider("xiaolv-common", async (keyword) => {
            if (keyword.includes("周报") || keyword.includes("工作")) {
                return [{
                    id: "snippet-weekly-001",
                    source: "常用",
                    category: "note",
                    title: "工作周报模板",
                    snippet: "本周工作总结与下周计划...",
                    onClick: () => { insertedId = "snippet-weekly-001"; },
                }];
            }
            return [];
        });

        const unregGate = lvOmnisearch.registerProvider("siyuan-quickgate", async (keyword) => {
            if (keyword.includes("周报") || keyword.includes("文档")) {
                return [{
                    id: "doc-weekly-999",
                    source: "快门",
                    category: "note",
                    title: "2026年第44周工作周报",
                    snippet: "项目研发进度记录",
                    onClick: () => {},
                }];
            }
            return [];
        });

        // 检索命中多插件
        const results = await lvOmnisearch.search("周报");
        assert.equal(results.length, 2, "应检索出来自不同插件的 2 条结果");
        assert.ok(results.some(r => r.source === "常用" && r.title === "工作周报模板"));
        assert.ok(results.some(r => r.source === "快门" && r.title === "2026年第44周工作周报"));

        // 点击动作执行
        const hit = results.find(r => r.id === "snippet-weekly-001");
        assert.ok(hit);
        hit.onClick();
        assert.equal(insertedId, "snippet-weekly-001");

        // 注销清理
        unregCommon();
        unregGate();
        const afterUnreg = await lvOmnisearch.search("周报");
        assert.equal(afterUnreg.length, 0, "注销后检索结果应为空");
    });
});

test("R434 安全契约：罗盘 popover 注册数据（名称/描述/徽标/ID）一律转义后进 innerHTML", () => {
    const {buildLaunchpadPopoverHtml} = lvNoticeKit;
    const evil = (over = {}) => ({
        id: "xlc-evil\"><img src=x onerror=whatever>",
        name: "<img src=x onerror=alert(1)>恶意插件",
        fullName: "<script>evil()</script>",
        svgIcon: "iconX",
        desc: "</span><script>evil2()</script>",
        badge: "<b>爆炸</b>",
        badgeType: "primary",
        color: "red;position:fixed;left:0;top:0;width:999px",
        state: "docked",
        onClick: () => {},
        ...over,
    });
    const html = buildLaunchpadPopoverHtml([evil()] , false);

    // 恶意载荷必须以文本实体形态出现，绝不能成为真实元素/属性逃逸
    assert.ok(!html.includes("<img src=x"), "img 载荷必须被转义");
    assert.ok(!html.includes("<script>"), "script 载荷必须被转义");
    assert.ok(!html.includes("</span><script"), "描述闭合逃逸必须被转义");
    assert.ok(!html.includes("<b>爆炸</b>"), "徽标 HTML 必须被转义");
    assert.ok(html.includes("&lt;img src=x"), "转义实体应出现在输出中");

    // 颜色白名单：非法 CSS 注入色必须回落到主题令牌
    assert.ok(!html.includes("position:fixed"), "颜色 style 注入必须被拦截");
    assert.ok(html.includes("color:var(--b3-theme-primary)"), "非法颜色回落到主题令牌");

    // 合法 hex 颜色保留
    const ok = buildLaunchpadPopoverHtml([evil({color: "#14b8a6", id: "xlc-ok000001", name: "小驴常用", desc: "正常描述", badge: "常用 18 项"})], true);
    assert.ok(ok.includes("color:#14b8a6"), "合法 hex 品牌色保留");
    assert.ok(ok.includes("小驴常用"), "正常名称原样保留");
    assert.ok(ok.includes("常用 18 项"), "正常徽标原样保留");
});
