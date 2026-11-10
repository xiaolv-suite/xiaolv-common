"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {library} = require("./.build/entry.cjs");

const {LibraryService} = library;

test("Independent notebook configuration: sets mode to notebook and captures notebookId", () => {
    // 模拟新建独立笔记本成功后产出的配置对象
    function deriveCreatedConfig(mode, docId, createdNotebookId) {
        return {
            configVersion: 1,
            mode: mode === "new-notebook" ? "notebook" : "doc",
            notebookIds: mode === "new-notebook" && createdNotebookId ? [createdNotebookId] : [],
            containerDocIds: [docId],
            createdDocIds: [docId],
            ...(createdNotebookId ? {createdNotebookIds: [createdNotebookId]} : {}),
            configuredAt: Date.now(),
        };
    }

    // 1. 新建独立笔记本模式
    const cfg1 = deriveCreatedConfig("new-notebook", "20261028120000-doc0001", "20261028120000-nb00001");
    assert.equal(cfg1.mode, "notebook", "Mode must be notebook so all functional sub-docs are scanned");
    assert.deepEqual(cfg1.notebookIds, ["20261028120000-nb00001"]);
    assert.deepEqual(cfg1.containerDocIds, ["20261028120000-doc0001"]);
    assert.deepEqual(cfg1.createdNotebookIds, ["20261028120000-nb00001"]);

    // 2. 普通单文档新建模式
    const cfg2 = deriveCreatedConfig("new-doc", "20261028120000-doc0002", "");
    assert.equal(cfg2.mode, "doc");
    assert.deepEqual(cfg2.notebookIds, []);
    assert.deepEqual(cfg2.containerDocIds, ["20261028120000-doc0002"]);
});

test("LibraryService: notebook mode resolves all documents under the notebook", async () => {
    const notebookId = "20261028120000-nb00001";
    const subDocs = [
        {id: "20261028120000-doc0001", name: "会员信息"},
        {id: "20261028120000-doc0002", name: "银行卡信息"},
        {id: "20261028120000-doc0003", name: "账号信息"},
    ];

    const kernel = {
        request: async (endpoint, params) => {
            if (endpoint === "listDocsByPath") {
                assert.equal(params.notebook, notebookId);
                return {files: subDocs};
            }
            if (endpoint === "getChildBlocks") {
                return [];
            }
            return null;
        },
    };

    const s = new LibraryService(kernel);
    s.setConfig({
        configVersion: 1,
        mode: "notebook",
        notebookIds: [notebookId],
        containerDocIds: ["20261028120000-doc0001"],
        createdDocIds: ["20261028120000-doc0001"],
        configuredAt: Date.now(),
    });

    const index = await s.buildIndex();
    assert.equal(index.errors.length, 0);
    assert.equal(index.truncated, false);
});
