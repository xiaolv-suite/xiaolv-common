"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const transfer = entry.transfer;
const hierarchy = entry.hierarchy;
const performanceUtils = entry.performanceUtils;
const hotkeys = entry.hotkeys;

test("T-0696 · 模板分享包 CRC-32 防伪哈希签名与完整性校验", () => {
    const item = {
        id: "xlc-chk0000001",
        itemType: "text",
        title: "测试标题",
        alias: "test",
        tags: ["工作"],
        category: "办公",
        source: {sourceDocId: "doc1", sourceBlockId: "blk1", sourceType: "manual"},
        url: "",
        targetBlockId: "",
        createdAt: 1000,
        updatedAt: 2000,
    };
    const kramdownMap = new Map([[item.id, "真实正文内容"]]);

    // 1. 构建带有完整性校验和的 Bundle
    const bundle = transfer.buildBundle([item], kramdownMap, 123456);
    assert.ok(bundle.checksum, "bundle 必须包含防伪校验和");
    assert.equal(typeof bundle.checksum, "string");
    assert.equal(bundle.checksum.length, 8);

    // 2. 校验通过正向断言
    assert.equal(transfer.verifyBundleChecksum(bundle), true);

    // 3. 篡改条目内容后校验失败
    const tamperedBundle = JSON.parse(JSON.stringify(bundle));
    tamperedBundle.items[0].title = "篡改后的标题";
    assert.equal(transfer.verifyBundleChecksum(tamperedBundle), false);

    // 4. validateImport 拦截防伪签名不匹配
    const validation = transfer.validateImport(JSON.stringify(tamperedBundle));
    assert.ok(validation.ok);
    const hasMismatch = validation.issues.some((issue) => issue.reason === "checksum-mismatch");
    assert.equal(hasMismatch, true, "应当检测出 checksum-mismatch 问题");
});

test("T-0697 · 层次化分类路径变更、级联重命名与同级自定义重排", () => {
    // 1. 父级迁移 (reparentHierarchyPath)
    assert.equal(hierarchy.reparentHierarchyPath("客服/退款", "财务"), "财务/退款");
    assert.equal(hierarchy.reparentHierarchyPath("客服/售后/退款", ""), "退款");
    assert.equal(hierarchy.reparentHierarchyPath("开发/前端/Vue", "技术/Web"), "技术/Web/Vue");
    assert.equal(hierarchy.reparentHierarchyPath("", "财务"), "");

    // 2. 级联重命名 (renameHierarchyNode)
    assert.equal(
        hierarchy.renameHierarchyNode("客服/售后/退款", "客服/售后", "客服/技术支持"),
        "客服/技术支持/退款",
    );
    assert.equal(
        hierarchy.renameHierarchyNode("客服/售后", "客服/售后", "客户服务"),
        "客户服务",
    );
    assert.equal(
        hierarchy.renameHierarchyNode("其他/售后", "客服/售后", "客户服务"),
        "其他/售后",
    );

    // 3. 节点同级重排 (reorderHierarchyNodes)
    const tree = hierarchy.buildHierarchyTree(["开发/前端", "生活/餐饮", "客服/退款", "开发/后端"]);
    const reordered = hierarchy.reorderHierarchyNodes(tree, ["生活", "客服", "开发"]);
    assert.equal(reordered[0]?.name, "生活");
    assert.equal(reordered[1]?.name, "客服");
    assert.equal(reordered[2]?.name, "开发");
});

test("T-0698 · 超大条目库 (5000+项) 虚拟滚动视口计算与缓冲区保护", () => {
    const totalCount = 6000;
    const itemHeight = 44;
    const viewportHeight = 440; // 10 行可视

    // 1. 顶部滚动位置
    const topWin = performanceUtils.calculateVirtualScrollWindow(totalCount, 0, itemHeight, viewportHeight, 4);
    assert.equal(topWin.totalHeight, 6000 * 44);
    assert.equal(topWin.visibleCount, 10);
    assert.equal(topWin.startIndex, 0);
    assert.equal(topWin.endIndex, 14); // 0 + 10 + 4
    assert.equal(topWin.offsetY, 0);

    // 2. 中间滚动位置 (滚动到第 100 个元素)
    const midWin = performanceUtils.calculateVirtualScrollWindow(totalCount, 100 * 44, itemHeight, viewportHeight, 4);
    assert.equal(midWin.startIndex, 96); // 100 - 4
    assert.equal(midWin.endIndex, 114); // 100 + 10 + 4
    assert.equal(midWin.offsetY, 96 * 44);

    // 3. 边界与空数据防御
    const zeroWin = performanceUtils.calculateVirtualScrollWindow(0, 100, itemHeight, viewportHeight);
    assert.equal(zeroWin.totalHeight, 0);
    assert.equal(zeroWin.startIndex, 0);
    assert.equal(zeroWin.endIndex, 0);
});

test("T-0699 · 跨平台快捷键提示符号化与热键冲突检测预检", () => {
    // 1. 快捷键格式化
    assert.equal(hotkeys.formatPlatformShortcut("Alt + Shift + Enter", false), "Alt + Shift + Enter");
    assert.equal(hotkeys.formatPlatformShortcut("Alt + Shift + Enter", true), "⌥ ⇧ Enter");
    assert.equal(hotkeys.formatPlatformShortcut("Ctrl + Enter", true), "⌘ Enter");

    // 2. 快捷键冲突检测 (detectShortcutConflicts)
    const definitions = [
        {id: "action.copy", key: "Ctrl + Enter"},
        {id: "action.duplicate", key: "ctrl+enter"},
        {id: "action.insert", key: "Enter"},
        {id: "action.embed", key: "Shift+Enter"},
        {id: "action.alt.embed", key: "shift + enter"},
    ];
    const conflicts = hotkeys.detectShortcutConflicts(definitions);
    assert.equal(conflicts.length, 2);
    assert.deepEqual(conflicts[0]?.conflictingIds, ["action.copy", "action.duplicate"]);
    assert.deepEqual(conflicts[1]?.conflictingIds, ["action.embed", "action.alt.embed"]);
});
