"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
    generateMigrationPlan,
    scanLegacyAssets,
    executeMigrationPlan,
    STANDARD_SUBDIR_MAP,
} = require("../src/libs/ecosystem-migration-kit.ts");

test("小驴全生态 · 老用户平滑过渡与空间归拢引擎专项测试", async (t) => {
    const mockScanData = {
        totalAssetsFound: 5,
        scannedNotebookCount: 4,
        hasDedicatedXiaoLvNotebook: false,
        plugins: {
            "siyuan-checkin": {
                pluginId: "siyuan-checkin",
                pluginName: "小驴打卡",
                featureTitle: "习惯打卡",
                count: 12,
                docIds: ["doc-checkin-1"],
                notebookNames: ["日常记录"],
            },
            "siyuan-home": {
                pluginId: "siyuan-home",
                pluginName: "小驴管家",
                featureTitle: "家庭资产台账",
                count: 8,
                docIds: ["doc-home-1"],
                notebookNames: ["家庭生活"],
            },
            "siyuan-lv-cards": {
                pluginId: "siyuan-lv-cards",
                pluginName: "小驴闪卡",
                featureTitle: "闪卡牌组",
                count: 45,
                docIds: ["doc-cards-1", "doc-cards-2"],
                notebookNames: ["考研与自学"],
            },
            "siyuan-exam": {
                pluginId: "siyuan-exam",
                pluginName: "小驴考试",
                featureTitle: "试卷考题",
                count: 30,
                docIds: ["doc-exam-1"],
                notebookNames: ["考研与自学"],
            },
            "siyuan-contacts": { pluginId: "siyuan-contacts", pluginName: "小驴人脉", featureTitle: "人物档案", count: 0, docIds: [], notebookNames: [] },
            "siyuan-glean": { pluginId: "siyuan-glean", pluginName: "小驴拾遗", featureTitle: "渐进阅读", count: 0, docIds: [], notebookNames: [] },
            "xiaolv-common": { pluginId: "xiaolv-common", pluginName: "小驴常用", featureTitle: "常用模板", count: 0, docIds: [], notebookNames: [] },
        },
    };

    await t.test("1. 原地兼容模式 (In-Place Mode)：零文件移动、零强迁、就地保留各笔记本结构", () => {
        const plan = generateMigrationPlan(mockScanData, "in-place");

        assert.equal(plan.mode, "in-place");
        assert.equal(plan.needsCreateNotebook, false, "原地兼容模式不创建新笔记本");
        assert.equal(plan.totalDocsToMove, 0, "原地兼容模式不移动任何物理文档");
        assert.ok(plan.steps.length >= 2);
        assert.equal(plan.steps[0].phase, "backup", "第一步必须是联合快照备份防线");
        assert.ok(plan.steps.some(s => s.description.includes("维持散落在 4 个笔记本中的原始结构")));
    });

    await t.test("2. 一键归拢模式 (Consolidated Mode)：标准 7 大子目录规划与零断链迁移计划", () => {
        const plan = generateMigrationPlan(mockScanData, "consolidated", "🐴 小驴空间");

        assert.equal(plan.mode, "consolidated");
        assert.equal(plan.needsCreateNotebook, true, "尚无小驴笔记本时必须规划创建步骤");
        assert.equal(plan.totalDocsToMove, 5, "应规划移动 5 篇历史文档");

        // 验证第一步永远是联合备份防线
        assert.equal(plan.steps[0].phase, "backup");
        // 验证包含建库步骤
        assert.ok(plan.steps.some(s => s.phase === "create-notebook" && s.description.includes("🐴 小驴空间")));

        // 验证各领域文档精准映射到标准子目录
        const moveSteps = plan.steps.filter(s => s.phase === "move-docs");
        assert.equal(moveSteps.length, 5);

        const checkinMove = moveSteps.find(s => s.sourceDocId === "doc-checkin-1");
        assert.equal(checkinMove.targetPath, STANDARD_SUBDIR_MAP["siyuan-checkin"].folder);

        const homeMove = moveSteps.find(s => s.sourceDocId === "doc-home-1");
        assert.equal(homeMove.targetPath, STANDARD_SUBDIR_MAP["siyuan-home"].folder);

        const cardsMove1 = moveSteps.find(s => s.sourceDocId === "doc-cards-1");
        assert.equal(cardsMove1.targetPath, STANDARD_SUBDIR_MAP["siyuan-lv-cards"].folder);

        const examMove = moveSteps.find(s => s.sourceDocId === "doc-exam-1");
        assert.equal(examMove.targetPath, STANDARD_SUBDIR_MAP["siyuan-exam"].folder);
    });

    await t.test("3. 存量资产启发式嗅探 (scanLegacyAssets)：单次 SQL 扫描并准确归类", async () => {
        const mockApi = {
            lsNotebooks: async () => [
                { id: "nb-1", name: "工作笔记", closed: false },
                { id: "nb-2", name: "生活杂记", closed: false },
                { id: "nb-3", name: "归档库", closed: true },
            ],
            sql: async (stmt) => {
                assert.ok(stmt.includes("SELECT root_id, name"), "必须使用单次高效属性聚合查询");
                return [
                    { root_id: "doc-chk-1", name: "custom-checkin-id", cnt: 3 },
                    { root_id: "doc-home-1", name: "custom-home-location", cnt: 12 },
                    { root_id: "doc-card-1", name: "custom-riff-deck", cnt: 20 },
                    { root_id: "doc-exam-1", name: "custom-exam-wrong", cnt: 5 },
                    { root_id: "doc-con-1", name: "custom-person", cnt: 1 },
                ];
            },
        };

        const scan = await scanLegacyAssets(mockApi);

        assert.equal(scan.scannedNotebookCount, 2, "仅统计未关闭的在线笔记本");
        assert.equal(scan.hasDedicatedXiaoLvNotebook, false);
        assert.equal(scan.totalAssetsFound, 5);
        assert.equal(scan.plugins["siyuan-checkin"].docIds[0], "doc-chk-1");
        assert.equal(scan.plugins["siyuan-home"].docIds[0], "doc-home-1");
        assert.equal(scan.plugins["siyuan-lv-cards"].docIds[0], "doc-card-1");
        assert.equal(scan.plugins["siyuan-exam"].docIds[0], "doc-exam-1");
        assert.equal(scan.plugins["siyuan-contacts"].docIds[0], "doc-con-1");
    });

    await t.test("4. 迁移计划执行器 (executeMigrationPlan)：原子化推进、备份前置与事件广播", async () => {
        let backupCalled = false;
        let createdNbName = "";
        const movedCalls = [];

        const mockApi = {
            exportBackup: async () => { backupCalled = true; return true; },
            createNotebook: async (name) => { createdNbName = name; return { id: "nb-target-new", name }; },
            moveDocs: async (ids, toNb, toPath) => { movedCalls.push({ ids, toNb, toPath }); return true; },
            sql: async () => [],
            lsNotebooks: async () => [],
        };

        const plan = generateMigrationPlan(mockScanData, "consolidated", "🐴 小驴统一空间");
        const execRes = await executeMigrationPlan(plan, mockApi);

        assert.equal(execRes.ok, true);
        assert.equal(backupCalled, true, "执行迁移前必须先触发全生态备份");
        assert.equal(createdNbName, "🐴 小驴统一空间");
        assert.equal(movedCalls.length, 5, "应逐项安全调用 moveDocs");
        assert.equal(execRes.movedDocIds.length, 5);
    });
});
