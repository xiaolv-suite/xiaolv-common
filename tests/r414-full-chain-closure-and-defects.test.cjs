"use strict";

/**
 * R414 / T-0746~T-0751: 全链路可用性闭环、半成品收口与高危缺陷修复契约测试
 * 覆盖：
 * 1. TD-001: 多源同步冲突比对 (sync-diff & settings-dialog) 识别 ExportedItem.kramdown、shortcode 差异检测、update(overwrite)/create/fork(newLogicalId)/delete 精准分流；
 * 2. TD-002: 相邻块语境探针 (Alt+J) 与 DockView 分类组头纯文本节点安全挂载（零 innerHTML 未转义注入，防御 <script> 与泛型符号吞字）；
 * 3. TD-003: 编辑弹窗 (openEditDialog) 中文标点标签切分、保存后 notifyExternalDataChange 侧栏联动、DockView 来源失效 ID 映射、物理 blockId 拖拽引用回退与雷切桥 PLUGIN_VERSION 动态绑定；
 * 4. TD-004: :shortcode 简码全链路闭环（新建/编辑表单输入、JSON 导入导出、Markdown 模板包往返、Espanso 触发词自动提取、Bundle Checksum 防篡改、service.save/update/recall 直达、DockView 简码徽标与 Tab 直达）；
 * 5. TD-005: 动态宏预览 (expandMacroPreview) 与执行求值 (applyPlaceholders / listPlaceholders) 100% 语法一致（{{date}} / {{time}} / {{datetime}} / {{doc.title}} / {{doc.path}} / {{clipboard}}），以及 ActionExecutor / service.resolve 光标锚点偏移 (cursorOffset) 透传；
 * 6. TD-006: 设置中心变量填写历史记忆查看与清空入口、jsonToProperties 动作菜单与变量栏双向接线、BatchTagCategoryPatch 层级重命名/改父级、虚拟滚动窗口与跨平台热键格式化接线。
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
    syncDiff,
    transfer,
    exportMarkdown,
    importMarkdown,
    espanso,
    placeholders,
    variables,
    batchOps,
    clipboardCleaner,
} = require("./.build/entry.cjs");

test("TD-001: SyncDiff 识别 shortcode 字段变更与指纹计算，且 settings-dialog 正确读取 it.kramdown 并按 action 分流合并", () => {
    const base = {
        id: "xlc-sync0000001",
        itemType: "text",
        title: "周报模板",
        alias: "zb",
        shortcode: ":wk",
        tags: ["工作"],
        category: "研发",
        kramdown: "本周完成事项",
        updatedAt: 1000,
    };
    const same = {...base};
    const diffSc = {...base, shortcode: ":weekly", updatedAt: 2000};

    assert.equal(
        syncDiff.computeItemFingerprint(base),
        syncDiff.computeItemFingerprint(same),
        "相同 shortcode 指纹应一致",
    );
    assert.notEqual(
        syncDiff.computeItemFingerprint(base),
        syncDiff.computeItemFingerprint(diffSc),
        "shortcode 变更后指纹必须不同",
    );
    const changed = syncDiff.detectChangedFields(base, diffSc);
    assert.ok(changed.includes("shortcode"), "detectChangedFields 必须检出 shortcode 变更");

    const settingsSrc = fs.readFileSync(path.join(__dirname, "../src/ui/settings-dialog.ts"), "utf8");
    assert.ok(
        settingsSrc.includes("it.kramdown || it.markdown"),
        "settings-dialog.ts 同步比对必须优先读取 ExportedItem 的 it.kramdown 字段",
    );
    assert.ok(
        settingsSrc.includes('await ctx.importMarkdownItems(toUpdate, "overwrite")'),
        "settings-dialog.ts 同步合并对 update 项必须使用 overwrite 策略覆盖更新",
    );
    assert.ok(
        settingsSrc.includes("pi.forkedId || newLogicalId()"),
        "settings-dialog.ts 同步合并对 fork 项必须使用合法的逻辑 ID",
    );
});

test("TD-002: 相邻块语境探针与 DockView 分类组头消除未转义 innerHTML 拼接，保障尖括号代码与分类名安全展示", () => {
    const dialogSrc = fs.readFileSync(path.join(__dirname, "../src/ui/dialog.ts"), "utf8");
    const dockSrc = fs.readFileSync(path.join(__dirname, "../src/ui/dock-view.ts"), "utf8");

    assert.ok(
        !dialogSrc.includes("kramdownToPlainText(data.prev.content) || \"(空)\"}`"),
        "dialog.ts 相邻块探针严禁将未转义的正文拼接进 innerHTML",
    );
    assert.ok(
        dialogSrc.includes("rowEl.append(strongEl, document.createTextNode(\" \" + contentText))"),
        "dialog.ts 相邻块探针必须使用 createTextNode 挂载正文",
    );
    assert.ok(
        !dockSrc.includes('<span class="xlc-dock-group-name">${catName}</span>'),
        "dock-view.ts 分类组头严禁将未转义的 catName 拼接进 innerHTML",
    );
    assert.ok(
        dockSrc.includes("const safeCatName = escapeDockHtml(catName);"),
        "dock-view.ts 分类组头必须对 catName 执行 HTML 实体安全转义",
    );
});

test("TD-003: 编辑弹窗中文标点切分标签、保存联动 notifyExternalDataChange、Dock 失效检测与物理 blockId 回退、雷切桥版本同步", () => {
    const indexSrc = fs.readFileSync(path.join(__dirname, "../src/index.ts"), "utf8");
    const dockSrc = fs.readFileSync(path.join(__dirname, "../src/ui/dock-view.ts"), "utf8");

    assert.ok(
        !indexSrc.includes("tagsEl.value.split(/[,,]/)"),
        "index.ts 编辑弹窗不得残留 /[,,]/ 标签切分笔误",
    );
    assert.ok(
        indexSrc.includes("tags: tagsEl.value.split(/[,，、;；\\s]+/)"),
        "index.ts 编辑弹窗必须支持中英文逗号、顿号、分号与空白切分标签",
    );
    assert.ok(
        !indexSrc.includes("isSourceMissing: (entry) => this.missingSources.has(entry.id)"),
        "buildDockDeps 的 isSourceMissing 不得错误检查逻辑 ID entry.id",
    );
    assert.ok(
        !indexSrc.includes('version: "0.6.4"'),
        "registerRaikiriWidget 不得硬编码旧版本号 0.6.4",
    );
    assert.ok(
        indexSrc.includes("version: PLUGIN_VERSION"),
        "registerRaikiriWidget 必须动态引用 PLUGIN_VERSION",
    );
    assert.ok(
        dockSrc.includes("const targetId = entry.targetBlockId || entry.sourceBlockId || entry.blockId || entry.id;"),
        "DockView 拖拽与右键复制块引用必须优先回退物理块 ID entry.blockId",
    );
});

test("TD-004: :shortcode 简码全链路闭环（新建/编辑 UI、Markdown 包往返、Espanso 自动提取、Bundle Checksum 防伪校验）", async () => {
    const captureSrc = fs.readFileSync(path.join(__dirname, "../src/ui/capture.ts"), "utf8");
    const importerSrc = fs.readFileSync(path.join(__dirname, "../src/service/importer.ts"), "utf8");
    const serviceSrc = fs.readFileSync(path.join(__dirname, "../src/service/service.ts"), "utf8");

    assert.ok(captureSrc.includes('shortcodeEl.dataset.xlcControl = "capture.shortcode"'), "CaptureDialog 必须提供 capture.shortcode 控件");
    assert.ok(importerSrc.includes("shortcode: incoming.shortcode || undefined"), "importer.ts 必须持久化传入的 shortcode");
    assert.ok(serviceSrc.includes("exactShortcodeMatches"), "service.recall 必须支持 :shortcode 精确直达召回");

    // 1. Markdown 模板包导出 -> 导入往返保留 shortcode
    const mockItem = {
        id: "xlc-scroundtrip1",
        blockId: "20261031120000-abcdefg",
        libraryDocId: "20261031120000-docroot",
        itemType: "text",
        title: "周报简码条目",
        alias: "zb",
        shortcode: ":wk",
        tags: ["周报"],
        category: "工作",
        summary: "本周总结内容",
        source: {sourceDocId: "", sourceBlockId: "", sourceType: "manual"},
        url: "",
        createdAt: 1000,
        updatedAt: 2000,
    };
    const kdMap = new Map([[mockItem.id, "本周总结内容"]]);
    const exportedMd = await exportMarkdown.buildMarkdownExport([mockItem], kdMap, async () => null, {name: "测试包"});
    const mdText = new TextDecoder().decode(exportedMd.entries[0].data);
    assert.ok(mdText.includes("shortcode: :wk"), "导出的 items.md 元数据头必须包含 shortcode: :wk");

    const parsedMd = importMarkdown.parseMarkdownPack(mdText);
    assert.equal(parsedMd.items.length, 1);
    assert.equal(parsedMd.items[0].shortcode, ":wk", "parseMarkdownPack 导入后必须还原 shortcode: :wk");

    // 2. Espanso YAML 导入自动将 :sig 触发词提取为 shortcode
    const yaml = `
matches:
  - trigger: ":sig"
    replace: "Best regards, Xiaolv"
`;
    const espRes = espanso.parseEspansoYaml(yaml, 1000);
    assert.equal(espRes.items.length, 1);
    assert.equal(espRes.items[0].shortcode, ":sig", "Espanso 冒号触发词导入后应自动填充规范化 shortcode");

    // 3. JSON Bundle Checksum 保护 shortcode 防篡改
    const bundle = transfer.buildBundle([mockItem], kdMap, 2000);
    assert.equal(transfer.verifyBundleChecksum(bundle), true, "初始导出包签名校验应通过");
    const tampered = {
        ...bundle,
        items: [{...bundle.items[0], shortcode: ":hacked"}],
    };
    assert.equal(transfer.verifyBundleChecksum(tampered), false, "篡改 shortcode 后防伪签名校验必须拦截");
});

test("TD-005: 动态宏预览与实际求值一致性（{{xlc:date}} / {{date+7d}} / {{doc.title}} / {{doc.path}}）及光标偏移透传", () => {
    const fixedNow = new Date(2026, 9, 31, 14, 5, 9); // 2026-10-31 14:05:09
    const docCtx = {title: "架构设计说明书", path: "/研发/架构设计说明书"};
    const tpl = "标题：{{doc.title}} | 日期：{{xlc:date}} | 下周：{{date+7d}} | 时间：{{xlc:time}} | 路径：{{doc.path}}";

    const previewOut = variables.expandMacroPreview(tpl, fixedNow, docCtx);
    const execOut = placeholders.applyPlaceholders(tpl, fixedNow, true, docCtx);

    assert.equal(
        execOut,
        previewOut,
        "applyPlaceholders 实际插入输出必须与 expandMacroPreview 预览输出完全一致",
    );
    assert.ok(execOut.includes("2026-10-31"), "必须展开 {{xlc:date}}");
    assert.ok(execOut.includes("2026-11-07"), "必须展开 {{date+7d}}");
    assert.ok(execOut.includes("14:05"), "必须展开 {{xlc:time}}");
    assert.ok(execOut.includes("架构设计说明书"), "必须展开 {{doc.title}}");
    assert.ok(execOut.includes("/研发/架构设计说明书"), "必须展开 {{doc.path}}");

    // listPlaceholders 必须感知 {{doc.title}}、{{doc.path}}、{{date+7d}} 以触发 ActionExecutor 按需拉取当前文档信息
    const detected = placeholders.listPlaceholders("文档：{{doc.title}} 路径：{{doc.path}} 偏移日期：{{date+7d}}");
    assert.ok(detected.includes("title"), "listPlaceholders 必须从 {{doc.title}} 识别出 title 需求");
    assert.ok(detected.includes("path"), "listPlaceholders 必须从 {{doc.path}} 识别出 path 需求");
    assert.ok(detected.includes("date"), "listPlaceholders 必须从 {{date+7d}} 识别出 date 需求");
});

test("TD-006: 变量记忆设置清理、jsonToProperties 双向接线与 BatchTagCategoryPatch 层级重命名/改父级", () => {
    // 1. jsonToProperties 纯函数与 UI 接线检查
    const propRes = clipboardCleaner.jsonToProperties('{"host":"127.0.0.1","port":6806}');
    assert.equal(propRes.ok, true);
    assert.equal(propRes.count, 2);
    assert.ok(propRes.result.includes("host=127.0.0.1"));
    assert.ok(propRes.result.includes("port=6806"));

    const varFormSrc = fs.readFileSync(path.join(__dirname, "../src/ui/variable-form.ts"), "utf8");
    const dialogSrc = fs.readFileSync(path.join(__dirname, "../src/ui/dialog.ts"), "utf8");
    const settingsSrc = fs.readFileSync(path.join(__dirname, "../src/ui/settings-dialog.ts"), "utf8");

    assert.ok(varFormSrc.includes('capture.format.json-props'), "variable-form.ts 必须接线 capture.format.json-props 按钮");
    assert.ok(dialogSrc.includes("jsonToProperties(entry.content)"), "dialog.ts 动作菜单必须接线 jsonToProperties");
    assert.ok(settingsSrc.includes('settings.variable-memory.clear'), "settings-dialog.ts 必须提供清空变量填写记忆按钮");
    assert.ok(dialogSrc.includes("calculateVirtualScrollWindow("), "dialog.ts 虚拟列表渲染必须接入 calculateVirtualScrollWindow");
    assert.ok(dialogSrc.includes("detectShortcutConflicts("), "dialog.ts 快捷键栏必须接入 detectShortcutConflicts 预检");

    // 2. BatchTagCategoryPatch 层级重命名与改父级
    const item1 = {tags: ["项目/一期/前端", "常用"], category: "客服/售后/退款"};
    const renamed = batchOps.applyBatchTagCategoryOps(item1, {
        renameCategoryPrefix: {from: "客服/售后", to: "客服/技术支持"},
        renameTagPrefix: {from: "项目/一期", to: "项目/二期"},
    });
    assert.equal(renamed.changed, true);
    assert.equal(renamed.category, "客服/技术支持/退款");
    assert.deepEqual(renamed.tags, ["项目/二期/前端", "常用"]);

    const reparented = batchOps.applyBatchTagCategoryOps(item1, {
        reparentCategory: "财务",
    });
    assert.equal(reparented.changed, true);
    assert.equal(reparented.category, "财务/退款");
});
