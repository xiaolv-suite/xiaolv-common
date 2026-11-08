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
});
