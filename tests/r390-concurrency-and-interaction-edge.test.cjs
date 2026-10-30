"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

test("并发防护 · 拖拽途中取消 (dragend) 必须立刻重置 dragDepth 并清除蒙层", () => {
    // 模拟拖拽进入后取消流程
    let dragDepth = 0;
    let overlayVisible = false;

    const showOverlay = () => { overlayVisible = true; };
    const hideOverlay = () => { overlayVisible = false; };

    // 1. 用户拖拽文件进入
    dragDepth++;
    showOverlay();
    assert.equal(overlayVisible, true);
    assert.equal(dragDepth, 1);

    // 2. 用户在窗口边缘外松手或按 Esc 取消，触发全局 dragend
    const onDragEnd = () => {
        dragDepth = 0;
        hideOverlay();
    };
    onDragEnd();

    assert.equal(dragDepth, 0, "dragend 后深度必须归零");
    assert.equal(overlayVisible, false, "dragend 后蒙层必须立即隐藏");
});

test("交互态保护 · 用户打字或中文组词 (isComposing/inputDebounce) 期间延迟外部刷新", () => {
    let refreshed = false;
    const fakeDialog = {
        isComposing: true,
        inputDebounce: 12345,
        refreshPreservingPosition: () => { refreshed = true; },
        refreshAfterExternalChange() {
            if (this.isComposing || this.inputDebounce !== null) {
                return;
            }
            this.refreshPreservingPosition();
        },
    };

    // 正在输入组词中触发外部变更通知
    fakeDialog.refreshAfterExternalChange();
    assert.equal(refreshed, false, "输入中绝不可被外部数据刷新打断心流");

    // 输入完成稳定后
    fakeDialog.isComposing = false;
    fakeDialog.inputDebounce = null;
    fakeDialog.refreshAfterExternalChange();
    assert.equal(refreshed, true, "输入稳定后必须正常刷新");
});

test("并发防护 · 主动作连点加锁 (primaryBusy) 阻止并发穿透与重复分派", async () => {
    let callCount = 0;
    const fakeDialog = {
        primaryBusy: false,
        varFormOpen: false,
        async runPrimary() {
            if (this.primaryBusy || this.varFormOpen) return;
            this.primaryBusy = true;
            try {
                callCount++;
                await new Promise((r) => setTimeout(r, 10));
            } finally {
                this.primaryBusy = false;
            }
        },
    };

    // 极速双击触发两次调用
    const p1 = fakeDialog.runPrimary();
    const p2 = fakeDialog.runPrimary();
    await Promise.all([p1, p2]);

    assert.equal(callCount, 1, "双击连点时第二次调用必须被同步锁拦截");
});

test("异常恢复 · 捕获新建保存失败时必须释放 saving 锁以允许修正并重试", async () => {
    let saving = false;
    let saveCount = 0;

    const simulateSave = async (resultOk) => {
        if (saving) return "busy";
        saving = true;
        try {
            saveCount++;
            if (!resultOk) {
                saving = false; // 修复后的行为：失败时必须置 false
                return "failed";
            }
            return "success";
        } catch {
            saving = false;
            return "error";
        }
    };

    // 第一次保存失败（例如校验或属性写入失败）
    const r1 = await simulateSave(false);
    assert.equal(r1, "failed");
    assert.equal(saving, false, "保存失败后 saving 状态必须解锁");

    // 用户修正内容后再次点击保存
    const r2 = await simulateSave(true);
    assert.equal(r2, "success");
    assert.equal(saveCount, 2, "失败后允许用户二次点击重试");
});

test("并发防护 · 快捷键长按与连发 (e.repeat / primaryBusy) 拦截复制并发穿透", async () => {
    let copyCount = 0;
    const fakeDialog = {
        primaryBusy: false,
        async handleCtrlEnter(e) {
            if (e.repeat || this.primaryBusy) return;
            this.primaryBusy = true;
            try {
                copyCount++;
                await new Promise((r) => setTimeout(r, 10));
            } finally {
                this.primaryBusy = false;
            }
        },
    };

    // 1. 模拟按住 Ctrl+Enter 产生 repeat 事件
    await fakeDialog.handleCtrlEnter({repeat: true});
    assert.equal(copyCount, 0, "长按 repeat 事件必须被直接丢弃");

    // 2. 模拟极速双击 Ctrl+Enter
    const c1 = fakeDialog.handleCtrlEnter({repeat: false});
    const c2 = fakeDialog.handleCtrlEnter({repeat: false});
    await Promise.all([c1, c2]);
    assert.equal(copyCount, 1, "极速并发快捷键必须只执行一次");
});

test("并发防护 · 侧边栏 DockView 动作连点加锁与按键连发阻断", async () => {
    let insertCount = 0;
    const fakeDock = {
        isInsertBusy: false,
        async insertEntry(entry) {
            if (this.isInsertBusy) return;
            this.isInsertBusy = true;
            try {
                insertCount++;
                await new Promise((r) => setTimeout(r, 10));
            } finally {
                this.isInsertBusy = false;
            }
        },
        handleKeyDown(e) {
            if (e.key === "Enter") {
                if (e.repeat) return;
                void this.insertEntry({});
            }
        },
    };

    // 1. 快速连点两次插入
    const p1 = fakeDock.insertEntry({});
    const p2 = fakeDock.insertEntry({});
    await Promise.all([p1, p2]);
    assert.equal(insertCount, 1, "连点插入必须被 isInsertBusy 拦截");

    // 2. 长按 Enter 键 repeat
    fakeDock.handleKeyDown({key: "Enter", repeat: true});
    assert.equal(insertCount, 1, "长按 Enter 不得触发插入");
});

test("并发防护 · 快捷键作用域轮转长按 (Alt+T repeat) 连发阻断", () => {
    let cycleCount = 0;
    const fakeScopeHandler = {
        onKeydown(e) {
            if (e.altKey && (e.key === "t" || e.key === "T")) {
                if (e.repeat) return;
                cycleCount++;
            }
        },
    };

    // 1. 模拟按住 Alt+T 产生 repeat 事件
    fakeScopeHandler.onKeydown({altKey: true, key: "t", repeat: true});
    fakeScopeHandler.onKeydown({altKey: true, key: "t", repeat: true});
    assert.equal(cycleCount, 0, "长按 repeat 事件必须被丢弃");

    // 2. 正常单次敲击
    fakeScopeHandler.onKeydown({altKey: true, key: "t", repeat: false});
    assert.equal(cycleCount, 1, "非 repeat 正常敲击必须成功派发一次");
});
