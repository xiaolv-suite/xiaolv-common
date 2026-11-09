const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const repo = process.env.LV_RELIABILITY_REPO || path.resolve(__dirname, '..');
let transpile;
try {
    const ts = require(path.join(repo, 'node_modules/typescript'));
    transpile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
} catch {
    // TypeScript 7 native compiler packages do not expose the former JS compiler API.
    const esbuild = require(path.join(repo, 'node_modules/esbuild'));
    transpile = source => esbuild.transformSync(source, { loader: 'ts', format: 'cjs', target: 'es2022' }).code;
}
const candidates = basename => ['src/libs/', 'src/', 'src/render/', 'src/api/'].map(p => path.join(repo, p, basename));
const find = basename => {
    if (process.env.LV_RELIABILITY_SOURCE) return path.join(process.env.LV_RELIABILITY_SOURCE, basename);
    const file = candidates(basename).find(p => fs.existsSync(p));
    assert.ok(file, `production source missing: ${basename}`);
    return file;
};
function load(name, window = {}, extra = {}) {
    const file = find(name);
    const timers = new Set();
    const context = {
        exports: {}, window, console: { warn() {}, error() {}, log() {} },
        localStorage: { getItem() { return null; }, setItem() {} },
        setTimeout(fn, ms) { const timer = setTimeout(() => { timers.delete(timer); fn(); }, ms); timers.add(timer); return timer; },
        clearTimeout(timer) { timers.delete(timer); clearTimeout(timer); },
        CustomEvent: class { constructor(type, opts) { this.type = type; this.detail = opts?.detail; } },
        ...extra,
    };
    context.module = { exports: context.exports };
    context.globalThis = context;
    vm.createContext(context);
    vm.runInContext(transpile(fs.readFileSync(file, 'utf8')), context, { filename: file });
    return { api: context.module.exports, window, timers, close() { for (const timer of timers) clearTimeout(timer); } };
}
const plain = value => JSON.parse(JSON.stringify(value));
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

test('ECO-001: due total is authoritative; old bridges can supply disjoint components', async () => {
    const w = { xiaolvCards: { hasCapability: () => true, getDueSummary: async () => ({ ok: true, data: { unreviewedCount: 10, unreviewedNewCardCount: 4, unreviewedOldCardCount: 6 } }) } };
    const c = load('ecosystem-bridge-kit.ts', w);
    try {
        assert.equal((await c.api.getCardsDueSummarySafely()).unreviewedCount, 10);
        w.xiaolvCards.getDueSummary = async () => ({ ok: true, data: { unreviewedNewCardCount: 4, unreviewedOldCardCount: 6 } });
        assert.equal((await c.api.getCardsDueSummarySafely()).unreviewedCount, 10);
        w.xiaolvCards.getDueSummary = async () => ({ ok: true, data: { unreviewedCount: 0, unreviewedNewCardCount: 4, unreviewedOldCardCount: 6 } });
        assert.equal((await c.api.getCardsDueSummarySafely()).unreviewedCount, 0);
    } finally { c.close(); }
});
test('ECO-002: rejected capture is not bridge success and does not dispatch another write', async () => {
    let events = 0;
    const w = { siyuanGlean: { ingestClip: async () => ({ ok: false }) }, dispatchEvent() { events++; } };
    const c = load('ecosystem-bridge-kit.ts', w);
    try { const result = await c.api.pushToGleanReadingSafely({ title: 'a', module: 'insurance', docId: 'doc' }); assert.equal(result.mode, 'clipboard'); assert.equal(events, 0); } finally { c.close(); }
});
test('ECO-003: atomic card helper negotiates actual createCard capability', async () => {
    let writes = 0;
    const w = { xiaolvCards: { hasCapability: key => key === 'createCard', createCard: async () => { writes++; return { ok: true, data: { kind: 'atomic', enrolled: true, createdBlockID: 'new-card' } }; } } };
    const c = load('ecosystem-bridge-kit.ts', w);
    try { assert.equal(await c.api.pushFlashcardSafely({ front: 'a', back: 'b' }), true); assert.equal(writes, 1); } finally { c.close(); }
});
test('ECO-004: explicit false readiness prevents the caller; probe exceptions are isolated', async () => {
    let writes = 0;
    const w = { siyuanCheckin: { whenReady: async () => false, hasCapability: () => true } };
    const c = load('ecosystem-bridge-kit.ts', w);
    try {
        assert.equal(await c.api.callBridge('checkin', 'x', () => { writes++; return true; }, () => false, 20), false);
        assert.equal(writes, 0);
        w.siyuanCheckin = { hasCapability() { throw Error('probe rejected'); } };
        assert.equal(await c.api.callBridge('checkin', 'x', () => true, () => false, 20), false);
    } finally { c.close(); }
});
test('ECO-004: write timeout exposes unknown; successful ready timers are cleared', async () => {
    const w = { siyuanCheckin: { whenReady: async () => true, hasCapability: () => true } };
    const c = load('ecosystem-bridge-kit.ts', w);
    try {
        assert.equal(await c.api.callBridge('checkin', 'x', () => true, () => false, 5000), true);
        assert.equal(c.timers.size, 0);
        let finish;
        const result = await c.api.callBridgeOutcome('checkin', 'x', () => new Promise(r => { finish = r; }), { timeoutMs: 5, operationId: 'write-a' });
        assert.equal(result.state, 'unknown');
        assert.equal(result.operationId, 'write-a');
        finish(true);
        await delay(0);
    } finally { c.close(); }
});
test('ECO-005: timeout never releases the lock before its underlying write settles', async () => {
    const c = load('lv-notice-kit.ts');
    try {
        let finish;
        let secondStarted = false;
        const first = c.api.withDocLock('doc', () => new Promise(resolve => { finish = resolve; }), 5);
        await assert.rejects(first, /超时/);
        const second = c.api.withDocLock('doc', async () => { secondStarted = true; return 2; }, 100);
        await delay(10);
        assert.equal(secondStarted, false);
        finish(1);
        assert.equal(await second, 2);
        assert.equal(c.window.__LV_DOC_LOCKS__.size, 0);
    } finally { c.close(); }
});
test('ECO-005: same-document rejection releases safely, different documents do not block', async () => {
    const c = load('lv-notice-kit.ts');
    try {
        await assert.rejects(c.api.withDocLock('doc', async () => { throw Error('rejected'); }), /rejected/);
        assert.equal(await c.api.withDocLock('doc', async () => 2), 2);
        let finish;
        const held = c.api.withDocLock('a', () => new Promise(r => { finish = r; }), 0);
        assert.equal(await c.api.withDocLock('b', async () => 3), 3);
        finish(1); await held;
    } finally { c.close(); }
});
test('ECO-005: a queued request can time out without sending later or bypassing its predecessor', async () => {
    const c = load('lv-notice-kit.ts');
    try {
        let finish; let cancelledWrites = 0; let finalWrites = 0;
        const held = c.api.withDocLock('a', () => new Promise(resolve => { finish = resolve; }), 0);
        await assert.rejects(c.api.withDocLock('a', async () => { cancelledWrites++; }, 5), /尚未发送/);
        const final = c.api.withDocLock('a', async () => { finalWrites++; }, 100);
        await delay(5); assert.equal(finalWrites, 0);
        finish(); await Promise.all([held, final]);
        assert.equal(cancelledWrites, 0); assert.equal(finalWrites, 1);
    } finally { c.close(); }
});
test('ECO-006: failed backup is explicit, successful data remain available', async () => {
    const c = load('lv-notice-kit.ts');
    try {
        c.api.lvBackup.register('good', async () => ({ a: 1 }), async () => true);
        c.api.lvBackup.register('bad', async () => { throw Error('disk rejected'); }, async () => true);
        const result = await c.api.lvBackup.exportFull();
        assert.equal(result.partial, true);
        assert.deepEqual(plain(result.expectedPlugins), ['good', 'bad']);
        assert.deepEqual(plain(result.failed), ['bad']);
        assert.equal(result.plugins.good.data.a, 1);
        assert.equal(result.plugins.bad, undefined);
    } finally { c.close(); }
});
test('ECO-007: diagnostics are shared between two independently evaluated plugin modules', () => {
    const w = {}; const a = load('lv-notice-kit.ts', w); const b = load('lv-notice-kit.ts', w);
    try {
        a.api.lvBackup.register('a', async () => ({}), async () => true);
        b.api.lvBackup.register('b', async () => ({}), async () => true);
        assert.deepEqual(plain(a.api.lvEcosystem.getDiagnostics().registeredPlugins), ['a', 'b']);
        assert.deepEqual(plain(b.api.lvEcosystem.getDiagnostics().registeredPlugins), ['a', 'b']);
        assert.doesNotMatch(b.api.lvEcosystem.getStatusBadgeText(), /协同正常/);
    } finally { a.close(); b.close(); }
});
test('ECO-006: a hanging reader is a visible partial backup; restore reports missing expected data', async () => {
    const c = load('lv-notice-kit.ts');
    try {
        c.api.lvBackup.register('hung', () => new Promise(() => {}), async () => true);
        const result = await c.api.lvBackup.exportFull({ timeoutMs: 5 });
        assert.equal(result.partial, true);
        assert.deepEqual(plain(result.failed), ['hung']);
        const restored = await c.api.lvBackup.restoreFull(result);
        assert.deepEqual(plain(restored.failed), ['hung']);
    } finally { c.close(); }
});
test('ECO-007: old backup/search/rule disposers cannot remove replacement owners', async () => {
    const w = {}; const a = load('lv-notice-kit.ts', w); const b = load('lv-notice-kit.ts', w);
    try {
        const oldBackup = a.api.lvBackup.register('same', async () => ({ version: 'old' }), async () => true);
        b.api.lvBackup.register('same', async () => ({ version: 'new' }), async () => true);
        oldBackup(); assert.equal((await b.api.lvBackup.exportFull()).plugins.same.data.version, 'new');
        const oldSearch = a.api.lvOmnisearch.registerProvider('same', async () => [{ title: 'old' }]);
        b.api.lvOmnisearch.registerProvider('same', async () => [{ title: 'new' }]);
        oldSearch(); assert.equal((await b.api.lvOmnisearch.search('new'))[0].title, 'new');
        const rule = { id: 'same', name: 'a', enabled: true, triggerSource: 'a', triggerType: 'x', execute: async () => true };
        const oldRule = a.api.lvAutomation.registerRule(rule);
        b.api.lvAutomation.registerRule({ ...rule, name: 'replacement' });
        oldRule(); assert.equal(b.api.lvAutomation.getRules()[0].name, 'replacement');
    } finally { a.close(); b.close(); }
});
test('extract receipt requires confirmed new identity; isolated extract may have enrolled=false', async () => {
    const w = { xiaolvCards: { hasCapability: () => true, receiveExtract: async () => ({ ok: true, data: { enrolled: false, ok: false } }) } };
    const c = load('ecosystem-bridge-kit.ts', w);
    try {
        assert.equal((await c.api.sendExtractToCardsSafely({ content: 'a', sourceBlockId: 'source' })).ok, false);
        w.xiaolvCards.receiveExtract = async () => ({ ok: true, data: { kind: 'extract', createdBlockID: 'new-extract', enrolled: false } });
        const result = await c.api.sendExtractToCardsSafely({ content: 'a', sourceBlockId: 'source', requestId: 'extract-b' });
        assert.equal(result.ok, true); assert.equal(result.createdBlockID, 'new-extract');
    } finally { c.close(); }
});
test('atomic receipt needs a real target ID; a legacy boolean or elapsed wait stays unconfirmed', async () => {
    const w = { xiaolvCards: { hasCapability: () => true, createCard: async () => ({ ok: true, data: true }) } };
    const c = load('ecosystem-bridge-kit.ts', w);
    try {
        assert.equal((await c.api.createCardSafely({ front: 'a', back: 'b', requestId: 'atomic-a' })).state, 'unknown');
        w.xiaolvCards.createCard = async () => ({ ok: true, data: { kind: 'atomic', enrolled: true, createdBlockID: 'created-a' } });
        const result = await c.api.createCardSafely({ front: 'a', back: 'b', requestId: 'atomic-a' });
        assert.equal(result.ok, true); assert.equal(result.createdBlockID, 'created-a');
        w.xiaolvCards.createCard = async () => ({ ok: true, data: { kind: 'atomic', enrolled: false, createdBlockID: 'partial-a' } });
        const partial = await c.api.createCardSafely({ front: 'a', back: 'b' });
        assert.equal(partial.state, 'unknown'); assert.equal(partial.createdBlockID, 'partial-a');
        w.xiaolvCards.createCard = async () => ({ ok: false, code: 'write-unknown', details: { createdBlockID: 'partial-b', docID: 'created-doc' } });
        const unknown = await c.api.createCardSafely({ front: 'a', back: 'b' });
        assert.equal(unknown.state, 'unknown'); assert.equal(unknown.createdBlockID, 'partial-b'); assert.equal(unknown.createdDocID, 'created-doc');
        w.xiaolvCards.createCard = async () => { throw Error('response lost after commit'); };
        assert.equal((await c.api.createCardSafely({ front: 'a', back: 'b' })).state, 'unknown');
    } finally { c.close(); }
});
