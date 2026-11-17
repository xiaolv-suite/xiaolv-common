"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {spawnSync} = require("node:child_process");
const {pasteQueue} = require("./.build/entry.cjs");

const {PasteQueue} = pasteQueue;

const root = path.resolve(__dirname, "..");
const checker = path.join(root, "scripts", "check-changelog.cjs");

test("check-changelog: passes when CHANGELOG contains current package version", () => {
    const res = spawnSync(process.execPath, [checker], {encoding: "utf8"});
    assert.equal(res.status, 0, res.stderr);
    assert.ok(res.stdout.includes("check-changelog ✓"));
});

test("check-changelog: negative verification rejects changelog missing current version", (t) => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "xlc-changelog-test-"));
    t.after(() => fs.rmSync(tempDir, {recursive: true, force: true}));

    // 写入 package.json 与故意不包含当前版本的旧 CHANGELOG
    fs.writeFileSync(path.join(tempDir, "package.json"), JSON.stringify({version: "99.9.9"}));
    fs.writeFileSync(path.join(tempDir, "CHANGELOG.md"), "## [0.5.0] — 2026-10-19\n旧版本记录");

    const res = spawnSync(process.execPath, [checker, tempDir], {encoding: "utf8"});
    assert.equal(res.status, 1);
    assert.ok(res.stderr.includes("check-changelog 失败"));
});

test("PasteQueue: visual status and queue size synchronization", () => {
    const q = new PasteQueue();
    assert.equal(q.size(), 0);

    q.setQueue([
        {id: "1", title: "条目1", content: "AAA"},
        {id: "2", title: "条目2", content: "BBB"},
    ]);
    assert.equal(q.size(), 2);

    const first = q.pop();
    assert.equal(first?.title, "条目1");
    assert.equal(q.size(), 1);

    q.clear();
    assert.equal(q.size(), 0);
    assert.equal(q.pop(), undefined);
});
