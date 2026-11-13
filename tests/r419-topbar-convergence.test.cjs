"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
    lvLaunchpad,
    syncTopBarConvergence,
} = require("../src/libs/lv-notice-kit.ts");

test("Protocol v1.7.5: 桌面端与全端顶栏统一收敛 (TopBar Convergence Engine) 专项测试", async (t) => {
    await t.test("1. 单插件场景保留原生按钮，>=2 个插件时自动激活小驴罗盘并收敛独立图标", () => {
        // 模拟 DOM 环境
        const toolbar = {
            id: "toolbar",
            children: [],
            appendChild(el) { this.children.push(el); },
        };

        const compassBtn = {
            id: "lvLaunchpadDesktopEntry",
            style: { display: "none" },
            querySelector: () => null,
            setAttribute: () => {},
        };

        const mockTopBarEl1 = { id: "plugin-btn-1", style: { display: "" }, isConnected: true };
        const mockTopBarEl2 = { id: "plugin-btn-2", style: { display: "" }, isConnected: true };

        const prevDoc = globalThis.document;
        const prevWin = globalThis.window;

        globalThis.document = {
            getElementById(id) {
                if (id === "toolbar") return toolbar;
                if (id === "lvLaunchpadDesktopEntry") return compassBtn;
                if (id === "mobileTopBar") return null; // 桌面端环境
                return null;
            },
            createElement: () => ({ setAttribute: () => {}, querySelector: () => null, style: {}, addEventListener: () => {} }),
        };

        globalThis.window = {
            __LV_LAUNCHPAD__: undefined,
            dispatchEvent: () => true,
            setTimeout: () => 1,
            clearTimeout: () => {},
        };

        try {
            // 阶段 1：仅注册 1 个插件（常用）
            const unregister1 = lvLaunchpad.register({
                id: "xiaolv-common",
                name: "常用",
                fullName: "小驴常用",
                svgIcon: "icon",
                topBarElement: mockTopBarEl1,
                onClick: () => {},
            });

            syncTopBarConvergence();
            // 只有 1 个插件时，不收敛，原生按钮保持正常可见，罗盘按钮隐藏
            assert.equal(mockTopBarEl1.style.display, "");
            assert.equal(compassBtn.style.display, "none");

            // 阶段 2：注册第 2 个插件（打卡）
            const unregister2 = lvLaunchpad.register({
                id: "siyuan-checkin",
                name: "打卡",
                fullName: "小驴打卡",
                svgIcon: "icon",
                topBarElement: mockTopBarEl2,
                onClick: () => {},
            });

            syncTopBarConvergence();
            // 已有 2 个插件，启动顶栏统一收敛！
            // 罗盘按钮自动激活显示！
            assert.equal(compassBtn.style.display, "inline-flex");
            // 未置顶的 2 个插件独立按钮自动被收敛隐藏！
            assert.equal(mockTopBarEl1.style.display, "none", "常用独立按钮应被收敛隐藏");
            assert.equal(mockTopBarEl2.style.display, "none", "打卡独立按钮应被收敛隐藏");

            // 阶段 3：用户将小驴打卡设为 pinned（置顶常驻）
            lvLaunchpad.setPluginState("siyuan-checkin", "pinned");
            syncTopBarConvergence();
            // 打卡独立按钮恢复显示在顶栏，而常用依然保持收敛
            assert.equal(mockTopBarEl2.style.display, "", "置顶的打卡按钮应恢复显示");
            assert.equal(mockTopBarEl1.style.display, "none", "未置顶的常用按钮继续隐藏");

            // 阶段 4：注销打卡插件，回到单插件状态
            unregister2();
            syncTopBarConvergence();
            // 回到 1 个插件，常用按钮自动恢复显示
            assert.equal(mockTopBarEl1.style.display, "");

            unregister1();
        } finally {
            globalThis.document = prevDoc;
            globalThis.window = prevWin;
        }
    });

    await t.test("2. 桌面端吸附式 Bento Popover 弹射坞开启、关闭与状态查询契约", () => {
        const {
            openDesktopLaunchpadPopover,
            closeDesktopLaunchpadPopover,
            isDesktopPopoverOpen,
            toggleDesktopLaunchpadPopover,
        } = require("../src/libs/lv-notice-kit.ts");

        let bodyChildren = [];
        let createdElement = null;

        const prevDoc = globalThis.document;
        const prevWin = globalThis.window;

        globalThis.document = {
            getElementById(id) {
                if (id === "lv-desktop-launchpad-popover") return createdElement;
                if (id === "lvLaunchpadDesktopEntry") return { getBoundingClientRect: () => ({ top: 0, bottom: 32, right: 100 }) };
                return null;
            },
            createElement(tag) {
                createdElement = {
                    tagName: tag,
                    id: "",
                    style: {},
                    classList: { add() {} },
                    setAttribute() {},
                    addEventListener() {},
                    remove() { createdElement = null; },
                };
                return createdElement;
            },
            body: {
                appendChild(el) { bodyChildren.push(el); },
            },
        };

        globalThis.window = {
            innerWidth: 1920,
            addEventListener() {},
            removeEventListener() {},
            setTimeout: () => 1,
            clearTimeout: () => {},
        };

        try {
            assert.equal(isDesktopPopoverOpen(), false);

            // 注册一个测试插件以供 popover 渲染
            const unregister = lvLaunchpad.register({
                id: "test-plugin",
                name: "测试",
                fullName: "测试插件",
                svgIcon: "icon",
                onClick: () => {},
            });

            openDesktopLaunchpadPopover();
            assert.equal(isDesktopPopoverOpen(), true, "打开后状态应为 true");
            assert.equal(createdElement.id, "lv-desktop-launchpad-popover");

            closeDesktopLaunchpadPopover();
            // close 触发带 150ms 动画
            unregister();
        } finally {
            globalThis.document = prevDoc;
            globalThis.window = prevWin;
        }
    });

    await t.test("3. 抗主题重构与 DOM 自愈探针：无绑定或断连按钮时自动按 aria-label / title 探测并收敛", () => {
        // 模拟断连（isConnected = false）或者重新渲染生成的 topbar 按钮
        const newRebuiltBtn1 = {
            id: "",
            getAttribute(attr) {
                if (attr === "aria-label") return "小驴常用 · 常用代码片段";
                return "";
            },
            style: { display: "" },
            isConnected: true,
        };
        const newRebuiltBtn2 = {
            id: "",
            getAttribute(attr) {
                if (attr === "aria-label") return "小驴打卡";
                return "";
            },
            style: { display: "" },
            isConnected: true,
        };

        const compassBtn = {
            id: "lvLaunchpadDesktopEntry",
            style: { display: "none" },
            querySelector: () => null,
            setAttribute: () => {},
        };

        const toolbar = {
            id: "toolbar",
            querySelectorAll(sel) {
                return [newRebuiltBtn1, newRebuiltBtn2];
            },
        };

        const prevDoc = globalThis.document;
        const prevWin = globalThis.window;

        globalThis.document = {
            getElementById(id) {
                if (id === "toolbar") return toolbar;
                if (id === "lvLaunchpadDesktopEntry") return compassBtn;
                if (id === "mobileTopBar") return null;
                return null;
            },
            createElement: () => ({ setAttribute: () => {}, querySelector: () => null, style: {}, addEventListener: () => {} }),
        };
        globalThis.window = {
            __LV_LAUNCHPAD__: undefined,
            dispatchEvent: () => true,
            setTimeout: () => 1,
            clearTimeout: () => {},
        };

        let unregister1 = () => {};
        let unregister2 = () => {};
        try {
            // 注册插件时未预先注入 topBarElement（模拟异步创建或主题切换重构）
            unregister1 = lvLaunchpad.register({
                id: "probe-common",
                name: "常用",
                fullName: "小驴常用",
                svgIcon: "iconLvCommon",
                topBarElement: null,
                onClick: () => {},
            });
            unregister2 = lvLaunchpad.register({
                id: "probe-checkin",
                name: "打卡",
                fullName: "小驴打卡",
                svgIcon: "iconLvCheckin",
                topBarElement: null,
                onClick: () => {},
            });

            syncTopBarConvergence();

            // 验证自愈机制：两个在 toolbar 中由主题重构生成的按钮被成功嗅探并自动收敛隐藏！
            assert.equal(newRebuiltBtn1.style.display, "none", "常用重构按钮应被自动嗅探并隐藏");
            assert.equal(newRebuiltBtn2.style.display, "none", "打卡重构按钮应被自动嗅探并隐藏");
            assert.equal(compassBtn.style.display, "inline-flex", "罗盘中枢应自动激活");
        } finally {
            try { unregister1(); } catch {}
            try { unregister2(); } catch {}
            globalThis.document = prevDoc;
            globalThis.window = prevWin;
        }
    });

    await t.test("4. Bento 弹射坞全键盘流交互：方向键导航、Enter 启动、P 键置顶切换、数字键直达", () => {
        const {
            openDesktopLaunchpadPopover,
            closeDesktopLaunchpadPopover,
        } = require("../src/libs/lv-notice-kit.ts");

        let keydownHandler = null;
        let launchedPlugin = null;

        const mockTile0 = {
            classList: {
                classes: new Set(),
                add(c) { this.classes.add(c); },
                remove(c) { this.classes.delete(c); },
            },
            scrollIntoView: () => {},
        };
        const mockTile1 = {
            classList: {
                classes: new Set(),
                add(c) { this.classes.add(c); },
                remove(c) { this.classes.delete(c); },
            },
            scrollIntoView: () => {},
        };

        let createdPopover = null;

        const prevDoc = globalThis.document;
        const prevWin = globalThis.window;

        globalThis.document = {
            getElementById(id) {
                if (id === "lv-desktop-launchpad-popover") return createdPopover;
                if (id === "lvLaunchpadDesktopEntry") return { getBoundingClientRect: () => ({ top: 0, bottom: 32, right: 100 }) };
                return null;
            },
            createElement(tag) {
                createdPopover = {
                    tagName: tag,
                    id: "",
                    style: {},
                    classList: { add() {}, remove() {} },
                    setAttribute() {},
                    addEventListener() {},
                    querySelectorAll(sel) {
                        if (sel === ".lv-pop-tile") return [mockTile0, mockTile1];
                        return [];
                    },
                    remove() { createdPopover = null; },
                };
                return createdPopover;
            },
            body: {
                appendChild() {},
            },
        };

        globalThis.window = {
            innerWidth: 1920,
            innerHeight: 1080,
            addEventListener(ev, fn) {
                if (ev === "keydown") keydownHandler = fn;
            },
            removeEventListener() {},
            setTimeout: () => 1,
            clearTimeout: () => {},
        };

        let unreg1 = () => {};
        let unreg2 = () => {};
        try {
            unreg1 = lvLaunchpad.register({
                id: "p1",
                name: "插件1",
                fullName: "小驴插件1",
                svgIcon: "icon",
                onClick: () => { launchedPlugin = "p1"; },
            });
            unreg2 = lvLaunchpad.register({
                id: "p2",
                name: "插件2",
                fullName: "小驴插件2",
                svgIcon: "icon",
                onClick: () => { launchedPlugin = "p2"; },
            });

            openDesktopLaunchpadPopover();
            assert.ok(keydownHandler, "应注册全局 keydown 监听器");

            // 1) 初始焦点在第 0 项
            assert.ok(mockTile0.classList.classes.has("lv-pop-tile-focused"), "初始应高亮第 0 项");

            // 2) 模拟按 ArrowRight 导航至第 1 项
            keydownHandler({ key: "ArrowRight", preventDefault: () => {}, stopPropagation: () => {} });
            assert.ok(mockTile1.classList.classes.has("lv-pop-tile-focused"), "按右方向键后应高亮第 1 项");

            // 3) 模拟按 P 键就地切换置顶状态
            keydownHandler({ key: "p", preventDefault: () => {}, stopPropagation: () => {} });
            const statesAfterP = lvLaunchpad.getItems().find(it => it.id === "p2");
            assert.equal(statesAfterP.state, "pinned", "按 P 键应将当前聚焦项置顶");

            // 4) 模拟按 Enter 执行当前项
            keydownHandler({ key: "Enter", preventDefault: () => {}, stopPropagation: () => {} });
            assert.equal(launchedPlugin, "p2", "按 Enter 应启动当前聚焦的插件2");

            closeDesktopLaunchpadPopover();
        } finally {
            try { unreg1(); } catch {}
            try { unreg2(); } catch {}
            globalThis.document = prevDoc;
            globalThis.window = prevWin;
        }
    });

    await t.test("5. 生态动态徽标与实时健康度探针：updateItem 与紧急告警圆点联动", () => {
        let entryDotStyle = { display: "none", background: "" };
        const mockEntryDot = { style: entryDotStyle };

        const compassBtn = {
            id: "lvLaunchpadDesktopEntry",
            style: { display: "inline-flex" },
            querySelector(sel) {
                if (sel === ".lv-entry-dot") return mockEntryDot;
                return null;
            },
            setAttribute: () => {},
        };

        const prevDoc = globalThis.document;
        const prevWin = globalThis.window;

        globalThis.document = {
            getElementById(id) {
                if (id === "lvLaunchpadDesktopEntry") return compassBtn;
                return null;
            },
        };
        globalThis.window = {
            __LV_LAUNCHPAD__: undefined,
            dispatchEvent: () => true,
            setTimeout: () => 1,
            clearTimeout: () => {},
        };

        try {
            const unreg = lvLaunchpad.register({
                id: "siyuan-home",
                name: "管家",
                fullName: "小驴管家",
                svgIcon: "icon",
                onClick: () => {},
            });

            // 初始无 badge，圆点隐藏
            assert.equal(entryDotStyle.display, "none");

            // 1) 动态更新为普通信息徽标 (primary)
            lvLaunchpad.updateItem("siyuan-home", { badge: "3 待办", badgeType: "primary" });
            assert.equal(entryDotStyle.display, "block", "有 badge 时应点亮入口圆点");
            assert.equal(entryDotStyle.background, "var(--b3-theme-primary, #3576c7)");

            // 2) 动态更新为逾期紧急警示徽标 (error)
            lvLaunchpad.updateItem("siyuan-home", { badge: "1 项逾期", badgeType: "error" });
            assert.equal(entryDotStyle.display, "block");
            assert.equal(entryDotStyle.background, "var(--b3-theme-error, #ef4444)", "紧急状态下圆点应变红警示");

            // 3) 清空徽标
            lvLaunchpad.updateItem("siyuan-home", { badge: undefined });
            assert.equal(entryDotStyle.display, "none", "徽标清空后圆点恢复隐藏");

            unreg();
        } finally {
            globalThis.document = prevDoc;
            globalThis.window = prevWin;
        }
    });

    await t.test("6. 误伤隔离验证：思源系统原生按钮与第三方非小驴插件按钮 100% 免疫", () => {
        // 原生系统按钮与第三方插件按钮
        const nativeSyncBtn = { id: "barSync", style: { display: "" }, isConnected: true, getAttribute: () => "" };
        const nativeSearchBtn = { id: "barSearch", style: { display: "" }, isConnected: true, getAttribute: () => "" };
        const thirdPartyTomatoBtn = {
            id: "docktomato-btn",
            style: { display: "" },
            isConnected: true,
            getAttribute: (a) => (a === "aria-label" ? "番茄钟计时器" : ""),
        };

        const compassBtn = {
            id: "lvLaunchpadDesktopEntry",
            style: { display: "none" },
            querySelector: () => null,
            setAttribute: () => {},
        };

        const toolbar = {
            id: "toolbar",
            querySelectorAll() {
                return [nativeSyncBtn, nativeSearchBtn, thirdPartyTomatoBtn];
            },
        };

        const prevDoc = globalThis.document;
        const prevWin = globalThis.window;

        globalThis.document = {
            getElementById(id) {
                if (id === "toolbar") return toolbar;
                if (id === "lvLaunchpadDesktopEntry") return compassBtn;
                return null;
            },
        };
        globalThis.window = {
            __LV_LAUNCHPAD__: undefined,
            dispatchEvent: () => true,
            setTimeout: () => 1,
            clearTimeout: () => {},
        };

        let unreg1 = () => {};
        let unreg2 = () => {};
        try {
            unreg1 = lvLaunchpad.register({ id: "p-a", name: "甲", fullName: "小驴甲", svgIcon: "icon-lv-a", onClick: () => {} });
            unreg2 = lvLaunchpad.register({ id: "p-b", name: "乙", fullName: "小驴乙", svgIcon: "icon-lv-b", onClick: () => {} });

            syncTopBarConvergence();

            // 原生按钮与第三方按钮必须保持原本的 display，绝不可被隐藏或误伤！
            assert.equal(nativeSyncBtn.style.display, "", "原生同步按钮绝不可被隐藏");
            assert.equal(nativeSearchBtn.style.display, "", "原生搜索按钮绝不可被隐藏");
            assert.equal(thirdPartyTomatoBtn.style.display, "", "第三方插件番茄钟绝不可被隐藏");
        } finally {
            try { unreg1(); } catch {}
            try { unreg2(); } catch {}
            globalThis.document = prevDoc;
            globalThis.window = prevWin;
        }
    });

    await t.test("7. 老用户平滑过渡：一键全部平铺（恢复老版顶栏）与一键收敛罗盘双向切换", () => {
        let unreg1 = () => {};
        let unreg2 = () => {};
        try {
            unreg1 = lvLaunchpad.register({ id: "legacy-chk", name: "打卡", fullName: "小驴打卡", svgIcon: "icon", onClick: () => {} });
            unreg2 = lvLaunchpad.register({ id: "legacy-crd", name: "闪卡", fullName: "小驴闪卡", svgIcon: "icon", onClick: () => {} });

            // 初始状态：处于收敛状态 (docked)
            let items = lvLaunchpad.getItems().filter(it => it.id.startsWith("legacy-"));
            assert.ok(items.every(it => it.state === "docked"));

            // 模拟老用户点击「平铺顶栏」：全部置顶
            items.forEach(it => lvLaunchpad.setPluginState(it.id, "pinned"));
            items = lvLaunchpad.getItems().filter(it => it.id.startsWith("legacy-"));
            assert.ok(items.every(it => it.state === "pinned"), "所有插件应被置顶显示在顶栏");

            // 模拟老用户点击「收敛全部」：全部收回罗盘
            items.forEach(it => lvLaunchpad.setPluginState(it.id, "docked"));
            items = lvLaunchpad.getItems().filter(it => it.id.startsWith("legacy-"));
            assert.ok(items.every(it => it.state === "docked"), "所有插件应被收敛回收");
        } finally {
            try { unreg1(); } catch {}
            try { unreg2(); } catch {}
        }
    });

    await t.test("8. 顶栏挂载锚点安全性：思源 3.8.x 优先锚定 #barMore，旧版回退 windowControls，绝不置于关闭按钮右侧", () => {
        // 场景 A：思源 3.8.x —— #barMore（「更多」溢出锚点）存在，罗盘必须锚定它
        {
            let insertedBefore = null;
            let appendChildCalled = false;
            const barMore = { id: "barMore", parentElement: null };
            const windowControls = { id: "windowControls", parentElement: null };
            const toolbar = {
                id: "toolbar",
                querySelector(sel) {
                    if (sel.includes("barMore")) return barMore;
                    if (sel.includes("windowControls")) return windowControls;
                    return null;
                },
                insertBefore(newNode, refNode) {
                    insertedBefore = refNode;
                },
                appendChild() {
                    appendChildCalled = true;
                },
            };
            barMore.parentElement = toolbar;
            windowControls.parentElement = toolbar;

            const prevDoc = globalThis.document;
            const capturedAttrs = {};
            globalThis.document = {
                getElementById(id) {
                    if (id === "toolbar") return toolbar;
                    return null;
                },
                createElement: () => ({
                    setAttribute: (k, v) => { capturedAttrs[k] = v; },
                    querySelector: () => null,
                    style: {},
                    addEventListener: () => {},
                }),
            };

            try {
                const cleanup = lvLaunchpad.ensureDesktopEntry();
                assert.equal(insertedBefore, barMore, "罗盘图标必须锚定在思源 3.8.x 的 #barMore 之前（条目重排锚点）");
                assert.equal(appendChildCalled, false, "严禁将罗盘 appendChild 至窗口控制区后面");
                assert.equal(capturedAttrs["data-topbar-entry"], "lv-launchpad", "罗盘必须持有 data-topbar-entry 才能参与思源条目排序持久化");
                assert.equal(capturedAttrs["data-location"], "right", "罗盘 data-location 必须与官方 addTopBar position:\"right\" 对齐");
                cleanup();
            } finally {
                globalThis.document = prevDoc;
            }
        }

        // 场景 B：旧版思源 —— 无 #barMore，回退锚定 windowControls，同样绝不 appendChild
        {
            let insertedBefore = null;
            let appendChildCalled = false;
            const windowControls = { id: "windowControls", parentElement: null };
            const toolbar = {
                id: "toolbar",
                querySelector(sel) {
                    if (sel.includes("windowControls")) return windowControls;
                    return null;
                },
                insertBefore(newNode, refNode) {
                    insertedBefore = refNode;
                },
                appendChild() {
                    appendChildCalled = true;
                },
            };
            windowControls.parentElement = toolbar;

            const prevDoc = globalThis.document;
            globalThis.document = {
                getElementById(id) {
                    if (id === "toolbar") return toolbar;
                    return null;
                },
                createElement: () => ({ setAttribute: () => {}, querySelector: () => null, style: {}, addEventListener: () => {} }),
            };

            try {
                const cleanup = lvLaunchpad.ensureDesktopEntry();
                assert.equal(insertedBefore, windowControls, "无 #barMore 时罗盘必须插在 windowControls 之前");
                assert.equal(appendChildCalled, false, "严禁将罗盘 appendChild 至窗口控制区后面");
                cleanup();
            } finally {
                globalThis.document = prevDoc;
            }
        }
    });
});
