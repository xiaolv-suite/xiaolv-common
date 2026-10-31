// Offline production-service contracts. These do not execute SiYuan's Markdown parser;
// real-kernel behaviour is covered by scripts/integration-kernel.cjs (ADR 0165).
const test = require("node:test");
const assert = require("node:assert/strict");
const {library: {LibraryService}, importer, kramdown} = require("./.build/entry.cjs");
const DOC = "20240101120001-hijklmn";
const HEAD = "20240101120002-bbbbbbb";
const TAIL = "20240101120003-ccccccc";
const OTHER = "20240101120004-ddddddd";
const ID = "xlc-boundary00001";

function harness(overrides = {}) {
    const calls = [];
    const attrs = {"custom-xlc-id": ID, "custom-xlc-type": "text"};
    const handlers = {
        getChildBlocks: () => [{id: HEAD, type: "p"}],
        getBlockAttrs: () => attrs,
        batchGetBlockAttrs: () => ({[HEAD]: attrs}),
        getBlockKramdown: ({id}) => ({id, kramdown: "原文"}),
        appendBlock: ({parentID}) => [{doOperations: [{id: TAIL, action: "insert", parentID}]}],
        setBlockAttrs: () => null,
        updateBlock: () => null,
        deleteBlock: () => null,
        ...overrides,
    };
    const service = new LibraryService({async request(endpoint, payload) {
        calls.push({endpoint, payload});
        if (!handlers[endpoint]) throw new Error(`unexpected endpoint ${endpoint}`);
        return handlers[endpoint](payload);
    }});
    service.setConfig({configVersion: 1, mode: "doc", containerDocIds: [DOC], notebookIds: [], createdDocIds: [], configuredAt: 1});
    return {service, calls, attrs};
}
const writes = (calls) => calls.filter(({endpoint}) => ["appendBlock", "setBlockAttrs", "updateBlock", "deleteBlock"].includes(endpoint));

test("ADR 0165: create and update reject only empty, oversized, or container-breaking bodies before any kernel write", async () => {
    const unsupported = ["", "  \n\t ", "{{{row\n甲", "甲\n}}}", "  }}} 收尾", "x".repeat(kramdown.ITEM_BODY_MAX_CHARS + 1)];
    for (const markdown of unsupported) {
        const {service, calls} = harness();
        const created = await service.createItem({itemType: "markdown", markdown});
        assert.equal(created.ok, false, markdown.slice(0, 30));
        assert.equal(calls.length, 0, "create must reject before a kernel request");
        if (markdown.trim()) {
            const updated = await service.updateItem(ID, {markdown, title: "不应写入"});
            assert.equal(updated.ok, false);
            assert.equal(writes(calls).length, 0);
        }
    }
    // 围栏内的 {{{ / }}} 是正文字面量，不影响容器边界
    const {service} = harness();
    const fenced = await service.createItem({itemType: "markdown", markdown: "说明\n\n```txt\n{{{row\n}}}\n```"});
    assert.equal(fenced.ok, true, fenced.message);
});

test("ADR 0165: multi-block bodies are written as one superblock container", async () => {
    for (const markdown of ["甲\n\n乙", "# 标题\n正文", "- 一\n- 二", "> 引用", "```js\nx\n```\n尾段", "甲\u2028乙"]) {
        const {service, calls} = harness();
        const created = await service.createItem({itemType: "markdown", markdown});
        assert.equal(created.ok, true, created.message);
        const data = calls.find(({endpoint}) => endpoint === "appendBlock").payload.data;
        assert.match(data, /^\{\{\{row\n[\s\S]*\n\}\}\}$/, markdown);
        assert.equal(calls.filter(({endpoint}) => endpoint === "appendBlock").length, 1);
    }
});

test("ADR 0165: pasted host IAL ids are stripped and line-start variables are kept out of embed blocks", async () => {
    const {service, calls} = harness();
    const created = await service.createItem({itemType: "markdown", markdown: "甲\n{: id=\"20240101120004-ddddddd\" custom-xlc-id=\"xlc-forged00001\" style=\"color:red\"}\n\n{{xlc:ask:姓名}}\n- {{xlc:cursor}}"});
    assert.equal(created.ok, true, created.message);
    const data = calls.find(({endpoint}) => endpoint === "appendBlock").payload.data;
    assert.doesNotMatch(data, /20240101120004-ddddddd|xlc-forged/);
    assert.match(data, /style="color:red"/);
    assert.match(data, /\n\u200b\{\{xlc:ask:姓名\}\}\n- \u200b\{\{xlc:cursor\}\}/);
});
test("ADR 0165: single-line templates and complete code fences stay plain blocks", async () => {
    for (const markdown of ["demo@example.com", "收件人：{{xlc:ask:姓名}} / 地址：{{xlc:ask:地址}}", "```json\n{\n  \"ok\": true\n}\n```", "~~~~txt\r\n```\r\n\r\n~~~~"]) {
        const {service, calls} = harness();
        const result = await service.createItem({itemType: "text", markdown});
        assert.equal(result.ok, true, result.message);
        assert.equal(calls.find(({endpoint}) => endpoint === "appendBlock").payload.data, markdown.replace(/\r\n/g, "\n"));
    }
});
test("B-006: append setAttrs operations never become owned or deleted parts", async () => {
    const {service, calls} = harness({
        appendBlock: ({parentID}) => [{doOperations: [
            {id: TAIL, action: "insert", parentID},
            {id: OTHER, action: "setAttrs"},
        ]}],
        setBlockAttrs: () => { throw new Error("permission denied"); },
    });
    const result = await service.createItem({itemType: "text", markdown: "单行"});
    assert.equal(result.ok, false);
    assert.deepEqual(calls.filter(({endpoint}) => endpoint === "deleteBlock").map(({payload}) => payload.id), [TAIL]);
});

test("B-006: unverified append actions and wrong parents never trigger attribute writes or deletion", async () => {
    for (const operation of [{id: OTHER}, {id: OTHER, action: "delete", parentID: DOC}, {id: OTHER, action: "insert", parentID: OTHER}]) {
        const {service, calls} = harness({appendBlock: () => [{doOperations: [operation]}]});
        const result = await service.createItem({itemType: "text", markdown: "单行"});
        assert.equal(result.ok, false);
        assert.match(result.message, /inspect library document/);
        assert.equal(writes(calls).length, 1, "only the already-issued append is allowed");
    }
});

test("B-006: parts outside the anchor document or overlapping another item are rejected before reading tail bodies", async () => {
    for (const state of ["outside", "reordered", "gap", "owned", "missing-attrs"]) {
        const attrs = {"custom-xlc-id": ID, "custom-xlc-parts": `${HEAD},${TAIL}`};
        const {service, calls} = harness({
            getChildBlocks: () => (state === "outside" ? [HEAD] : state === "reordered" ? [TAIL, HEAD] : state === "gap" ? [HEAD, OTHER, TAIL] : [HEAD, TAIL]).map((id) => ({id, type: "p"})),
            batchGetBlockAttrs: () => ({[HEAD]: attrs, ...(state === "missing-attrs" ? {} : {[TAIL]: state === "owned" ? {"custom-xlc-id": "xlc-another00001"} : {}})}),
        });
        const item = {id: ID, blockId: HEAD, libraryDocId: DOC, partBlockIds: [HEAD, TAIL]};
        const result = await service.getStoredItemKramdown(item);
        assert.equal(result.ok, false, state);
        assert.equal(calls.some(({endpoint}) => endpoint === "getBlockKramdown"), false, state);
    }
});

test("ADR 0165: overwrite import rejects container-breaking incoming bodies before any write", async () => {
    const incoming = {id: ID, itemType: "text", kramdown: "新首段\n}}}\n新尾段", title: "", alias: "", category: "", tags: [], source: {}};
    const {service, calls} = harness();
    assert.equal(await importer.applyOverwriteImport(service, incoming, ID), false);
    assert.equal(writes(calls).length, 0);
});

test("ADR 0165: overwrite import updates multi-paragraph bodies in place and restores attributes", async () => {
    const incoming = {id: ID, itemType: "text", kramdown: "新首段\n\n新尾段", title: "新标题", alias: "", category: "", tags: [], source: {}};
    const {service, calls} = harness({getBlockAttrs: () => ({"custom-xlc-id": ID, "custom-xlc-type": "text", "custom-user": "保留", id: HEAD, updated: "1"})});
    assert.equal(await importer.applyOverwriteImport(service, incoming, ID), true);
    const update = calls.find(({endpoint}) => endpoint === "updateBlock");
    assert.equal(update.payload.data, "{{{row\n新首段\n\n新尾段\n}}}");
    const attrWrites = calls.filter(({endpoint}) => endpoint === "setBlockAttrs");
    const last = attrWrites[attrWrites.length - 1].payload.attrs;
    assert.equal(last["custom-user"], "保留");
    assert.equal(last["custom-xlc-id"], ID);
    assert.equal(last["custom-xlc-title"], "新标题");
    assert.equal("id" in last || "updated" in last, false);
    assert.ok(calls.indexOf(update) < calls.indexOf(attrWrites[attrWrites.length - 1]), "attributes are re-applied after updateBlock drops them");
});
test("B-006: cached single anchors moved out of the indexed document cannot be read, updated, or deleted", async () => {
    let moved = false;
    const {service, calls} = harness({getChildBlocks: () => moved ? [] : [{id: HEAD, type: "p"}]});
    const item = (await service.ensureIndex()).items.get(ID);
    moved = true;
    const read = await service.getStoredItemKramdown(item);
    const update = await service.updateItem(ID, {title: "不应改库外块"});
    const remove = await service.removeItem(ID);
    assert.equal(read.ok, false);
    assert.equal(update.ok, false);
    assert.equal(remove.ok, false);
    assert.equal(writes(calls).length, 0);
});

test("ADR 0165: body editing requires a readable old body before writing metadata", async () => {
    for (const getBlockKramdown of [() => null, () => { throw new Error("kernel down"); }]) {
        const {service, calls} = harness({getBlockKramdown});
        const result = await service.updateItem(ID, {title: "新元数据", markdown: "新单行"});
        assert.equal(result.ok, false);
        assert.equal(writes(calls).length, 0);
    }
});

test("ADR 0165: superblock items keep their container on single-line edits and roll back on failure", async () => {
    const {service, calls} = harness({
        getChildBlocks: () => [{id: HEAD, type: "s"}],
        getBlockKramdown: ({id}) => ({id, kramdown: "{{{row\n旧首段\n{: id=\"20240101120005-eeeeeee\"}\n\n旧尾段\n}}}\n{: id=\"20240101120002-bbbbbbb\"}"}),
    });
    const ok = await service.updateItem(ID, {markdown: "收敛为一段"});
    assert.equal(ok.ok, true, ok.message);
    assert.equal(calls.find(({endpoint}) => endpoint === "updateBlock").payload.data, "{{{row\n收敛为一段\n}}}");

    let failNext = true;
    const failing = harness({
        getChildBlocks: () => [{id: HEAD, type: "s"}],
        getBlockKramdown: ({id}) => ({id, kramdown: "{{{row\n旧首段\n\n旧尾段\n}}}"}),
        updateBlock: () => { if (failNext) { failNext = false; throw new Error("update failed"); } return null; },
    });
    const failed = await failing.service.updateItem(ID, {markdown: "新正文"});
    assert.equal(failed.ok, false);
    const updates = failing.calls.filter(({endpoint}) => endpoint === "updateBlock").map(({payload}) => payload.data);
    assert.deepEqual(updates, ["{{{row\n新正文\n}}}", "{{{row\n旧首段\n\n旧尾段\n}}}"]);
});
test("ADR 0165: import receipt names the container restriction and leaves skip policy unchanged", async () => {
    const item = {id: ID, itemType: "text", kramdown: "多段\n{{{row\n正文", title: "多段", tags: [], source: {}};
    const {service, calls} = harness();
    const rejected = await importer.importBundle(service, {items: [item]}, "overwrite");
    assert.equal(rejected.failed, 1);
    assert.match(rejected.lines[0].error, /superblock markers/);
    assert.equal(writes(calls).length, 0);
    const skipped = await importer.importBundle(service, {items: [item]}, "skip");
    assert.equal(skipped.skipped, 1);
    assert.equal(skipped.failed, 0);
});
