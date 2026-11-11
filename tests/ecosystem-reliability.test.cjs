const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const repo = process.env.LV_RELIABILITY_REPO || path.resolve(__dirname, '..');
let transpile;
function resolveTool(tool) {
    const checkPaths = [
        path.join(repo, 'node_modules', tool),
        path.resolve(__dirname, '..', 'node_modules', tool),
        path.resolve(__dirname, '../..', 'node_modules', tool),
        path.resolve(__dirname, '../../小驴打卡', 'node_modules', tool),
        path.resolve(__dirname, '../../小驴闪卡', 'node_modules', tool),
    ];
    for (const c of checkPaths) {
        try { return require(c); } catch { /* next */ }
    }
    return null;
}
const ts = resolveTool('typescript');
if (ts && typeof ts.transpileModule === 'function') {
    transpile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
} else {
    const esbuild = resolveTool('esbuild');
    if (esbuild && typeof esbuild.transformSync === 'function') {
        transpile = source => esbuild.transformSync(source, { loader: 'ts', format: 'cjs', target: 'es2022' }).code;
    } else {
        throw new Error('Neither typescript nor esbuild could be resolved for transpilation');
    }
}
const candidates = basename => [
    path.join(__dirname, basename),
    path.join(repo, 'src/libs/', basename),
    path.join(repo, 'src/', basename),
    path.join(repo, 'src/render/', basename),
    path.join(repo, 'src/api/', basename)
];
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

test('ECO-009: lvNotify history ring buffer tracks unread state, markRead, persistence, and clear', () => {
    const store = new Map([['lv_notice_history_2000-01-01', '[]']]);
    const fakeStorage = {
        get length() { return store.size; },
        key(i) { return Array.from(store.keys())[i] ?? null; },
        getItem(k) { return store.has(k) ? store.get(k) : null; },
        setItem(k, v) { store.set(k, String(v)); },
        removeItem(k) { store.delete(k); },
    };
    const c = load('lv-notice-kit.ts', {}, { localStorage: fakeStorage });
    try {
        c.api.lvNotify.clearHistory();
        assert.equal(c.api.lvNotify.getUnreadCount(), 0);
        c.api.lvNotify.silent({ source: '打卡', message: '打卡完成', level: 'success' });
        c.api.lvNotify.capsule({ source: '管家', message: '事项到期', level: 'warn' });
        assert.equal(c.api.lvNotify.getUnreadCount(), 2);
        const hist = c.api.lvNotify.getHistory();
        assert.equal(hist.length, 2);
        assert.equal(store.has('lv_notice_history_2000-01-01'), false);

        // Single-item markRead
        c.api.lvNotify.markRead(hist[0].id);
        assert.equal(c.api.lvNotify.getUnreadCount(), 1);
        assert.equal(c.api.lvNotify.getHistory()[0].read, true);
        assert.equal(c.api.lvNotify.getHistory()[1].read, false);
    } finally { c.close(); }

    // Reload module with same localStorage -> history & read flags survive
    const reloaded = load('lv-notice-kit.ts', {}, { localStorage: fakeStorage });
    try {
        assert.equal(reloaded.api.lvNotify.getHistory().length, 2);
        assert.equal(reloaded.api.lvNotify.getUnreadCount(), 1);
        reloaded.api.lvNotify.markAllRead();
        assert.equal(reloaded.api.lvNotify.getUnreadCount(), 0);
        reloaded.api.lvNotify.clearHistory();
        assert.equal(reloaded.api.lvNotify.getHistory().length, 0);
    } finally { reloaded.close(); }
});

test('ECO-010: getTodaySummary computes 4-in-1 morning/evening aggregation with authoritative status', () => {
    const c = load('lv-notice-kit.ts');
    try {
        const items = [
            { id: 'siyuan-checkin', name: '小驴打卡', badge: '3/5', state: 'docked' },
            { id: 'siyuan-lv-cards', name: '小驴闪卡', badge: '12', state: 'docked' },
            { id: 'siyuan-home', name: '小驴管家', badge: '0', state: 'docked' },
            { id: 'siyuan-glean', name: '小驴拾遗', badge: '4', state: 'docked' },
        ];
        const s = c.api.getTodaySummary(items);
        assert.equal(s.metrics.length, 4);
        assert.equal(s.allDone, false);

        const checkin = s.metrics.find(m => m.id === 'checkin');
        assert.equal(checkin.status, 'pending');
        assert.match(checkin.label, /3\/5/);

        const cards = s.metrics.find(m => m.id === 'cards');
        assert.equal(cards.status, 'pending');
        assert.match(cards.label, /12/);

        const home = s.metrics.find(m => m.id === 'home');
        assert.equal(home.status, 'done');

        const glean = s.metrics.find(m => m.id === 'glean');
        assert.equal(glean.status, 'pending');

        // All done condition
        const doneItems = [
            { id: 'siyuan-checkin', name: '小驴打卡', badge: '5/5', state: 'docked' },
            { id: 'siyuan-lv-cards', name: '小驴闪卡', badge: '0', state: 'docked' },
            { id: 'siyuan-home', name: '小驴管家', badge: '0', state: 'docked' },
            { id: 'siyuan-glean', name: '小驴拾遗', badge: '0', state: 'docked' },
        ];
        const doneSummary = c.api.getTodaySummary(doneItems);
        assert.equal(doneSummary.allDone, true);

        // Missing plugin condition
        const partialItems = [
            { id: 'siyuan-checkin', name: '小驴打卡', badge: '1', state: 'docked' }
        ];
        const partialSummary = c.api.getTodaySummary(partialItems);
        assert.equal(partialSummary.metrics.find(m => m.id === 'cards').status, 'uninstalled');
    } finally { c.close(); }
});

test('ECO-011: lvOmnisearch.searchStream emits fast providers immediately without waiting for slow ones', async () => {
    const c = load('lv-notice-kit.ts');
    try {
        c.api.lvOmnisearch.registerProvider('fast', () => [
            { id: 'f1', source: '常用', category: 'snippet', title: 'fast-hit', onClick() {} }
        ]);
        let releaseSlow;
        c.api.lvOmnisearch.registerProvider('slow', () => new Promise(resolve => { releaseSlow = resolve; }));

        const chunks = [];
        const streamPromise = c.api.lvOmnisearch.searchStream('hit', (hits, status) => {
            chunks.push({ count: hits.length, done: status.done, pending: status.pending });
        });
        await delay(10);
        assert.ok(chunks.length >= 1, 'fast provider should emit before slow resolves');
        assert.equal(chunks[0].count, 1);
        assert.equal(chunks[0].done, false);
        assert.equal(chunks[0].pending, 1);

        releaseSlow([{ id: 's1', source: '拾遗', category: 'doc', title: 'hit', onClick() {} }]);
        const finalHits = await streamPromise;
        assert.equal(finalHits.length, 2);
        assert.equal(finalHits[0].title, 'hit'); // exact match sorted first
        const lastChunk = chunks[chunks.length - 1];
        assert.equal(lastChunk.done, true);
        assert.equal(lastChunk.pending, 0);
    } finally { c.close(); }
});

test('ECO-012: buildLaunchpadPopoverHtml renders inbox filters safely and supports unread/alert modes', () => {
    const c = load('lv-notice-kit.ts');
    try {
        c.api.lvNotify.clearHistory();
        c.api.lvNotify.silent({ source: '打卡', message: '一般记录', level: 'info' });
        c.api.lvNotify.card({ source: '管家<script>x</script>', message: '紧急告警<b>xss</b>', level: 'error' });
        const hist = c.api.lvNotify.getHistory();
        c.api.lvNotify.markRead(hist[1].id);

        const items = [{ id: 'siyuan-checkin', name: '小驴打卡', desc: '习惯', state: 'docked', onClick() {} }];
        const unreadHtml = c.api.buildLaunchpadPopoverHtml(items, false, { showInboxDrawer: true, inboxFilter: 'unread' });
        assert.ok(!unreadHtml.includes('<script>x</script>'));
        assert.ok(!unreadHtml.includes('<b>xss</b>'));
        assert.ok(unreadHtml.includes('紧急告警&lt;b&gt;xss&lt;/b&gt;'));
        assert.ok(!unreadHtml.includes('一般记录'), 'read info item should be filtered out in unread tab');

        const alertHtml = c.api.buildLaunchpadPopoverHtml(items, false, { showInboxDrawer: true, inboxFilter: 'alert' });
        assert.ok(alertHtml.includes('紧急告警'));
        assert.ok(!alertHtml.includes('一般记录'));
    } finally { c.close(); }
});

test('ECO-013: safeDocTitleFromHPath extracts titles safely, preserving half-width slashes and stripping rich text tags', () => {
    const c = load('lv-notice-kit.ts');
    try {
        const fn = c.api.safeDocTitleFromHPath;
        assert.ok(typeof fn === 'function', 'safeDocTitleFromHPath must be exported');

        // 1. Doc with slash in title (SiYuan 3.8.10 Issue #20837)
        const docWithSlash = {
            id: 'doc-1',
            title: 'React/Vue 架构对比分析',
            hPath: '/技术笔记/前端/React/Vue 架构对比分析',
        };
        assert.equal(fn(docWithSlash), 'React/Vue 架构对比分析', 'title with slash must not be split or truncated');

        // 2. Doc with name property
        const docWithName = {
            id: 'doc-2',
            name: '2026/11/10 核心复盘',
            hPath: '/日常/2026/11/10 核心复盘',
        };
        assert.equal(fn(docWithName), '2026/11/10 核心复盘');

        // 3. Pure string hPath ending with .sy
        assert.equal(fn('/工作空间/年度规划.sy'), '年度规划');
        assert.equal(fn('/工作空间/年度规划'), '年度规划');

        // 4. Rich text title tags stripping
        const richDoc = {
            title: '<span style="color:red">核心</span><b>架构</b>方案',
            hPath: '/架构方案',
        };
        assert.equal(fn(richDoc), '核心架构方案');

        // 5. Fallback on empty or invalid inputs
        assert.equal(fn(null, '未命名文档'), '未命名文档');
        assert.equal(fn('', '默认文档'), '默认文档');
    } finally { c.close(); }
});

test('ECO-014: lvHostBridge handles host bridge calls and graceful fallbacks', async () => {
    const c = load('lv-notice-kit.ts');
    try {
        const bridge = c.api.lvHostBridge;
        assert.ok(bridge, 'lvHostBridge must be exported');
        assert.equal(typeof bridge.safeDocTitleFromHPath, 'function');
        assert.equal(typeof bridge.showDocTreeNativeMenu, 'function');
        assert.equal(typeof bridge.openNativeAssetPicker, 'function');
        assert.equal(typeof bridge.toggleNativeDock, 'function');
        assert.equal(typeof bridge.isNativeDockVisible, 'function');

        // In test VM where siyuan is not installed, methods should return graceful fallbacks rather than crashing
        const menuResult = await bridge.showDocTreeNativeMenu({ notebookId: 'nb-1', docId: 'doc-1' });
        assert.equal(menuResult, false);

        const assetResult = await bridge.openNativeAssetPicker();
        assert.equal(assetResult, null);

        const dockToggle = bridge.toggleNativeDock('Left');
        assert.equal(dockToggle, false);

        const dockVisible = bridge.isNativeDockVisible('Right');
        assert.equal(dockVisible, null);
    } finally { c.close(); }
});

test('ECO-015: 罗盘弹窗键盘导航在 IME 合成期整体让路 (isComposing/229 守卫)', () => {
    const src = fs.readFileSync(find('lv-notice-kit.ts'), 'utf8');
    const handlerIdx = src.indexOf('desktopPopoverKeyDownHandler = (e: KeyboardEvent) => {');
    assert.ok(handlerIdx > 0, 'desktopPopoverKeyDownHandler 必须存在');
    const handlerBody = src.slice(handlerIdx, handlerIdx + 400);
    assert.match(handlerBody, /e\.isComposing \|\| e\.keyCode === 229/, 'handler 顶部必须有 IME 合成期守卫');
    // 守卫必须位于 Escape 分支之前：合成期 Escape 优先归还输入法（取消候选），而非关闭弹窗
    const guardIdx = handlerBody.indexOf('if (e.isComposing');
    const escapeIdx = handlerBody.indexOf('e.key === "Escape"');
    assert.ok(guardIdx >= 0 && escapeIdx > guardIdx, 'IME 守卫必须先于 Escape 分支');
});
