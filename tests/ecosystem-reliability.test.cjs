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

test('ECO-016: 极速工作台全端核心动作、桌面端重新加载及配置均有效且可调', async () => {
    const c = load('lv-notice-kit.ts');
    try {
        const lp = c.api.lvLaunchpad;
        assert.ok(lp, 'lvLaunchpad must be exported');
        assert.equal(typeof lp.openQuickNote, 'function');
        assert.equal(typeof lp.openLifeLog, 'function');
        assert.equal(typeof lp.openDiaryBottom, 'function');
        assert.equal(typeof lp.openTaskManager, 'function');
        assert.equal(typeof lp.openNewTask, 'function');
        assert.equal(typeof lp.reloadUI, 'function');
        assert.equal(typeof lp.randomWalk, 'function');
        assert.equal(typeof lp.pasteToDailyNote, 'function');
        assert.equal(typeof lp.getQuickWorkspaceConfig, 'function');
        assert.equal(typeof lp.saveQuickWorkspaceConfig, 'function');

        // Config defaults
        const conf = lp.getQuickWorkspaceConfig();
        assert.ok(Array.isArray(conf.lifeLogCategories), 'lifeLogCategories must be an array');
        assert.ok(conf.lifeLogCategories.includes('日记'), 'default categories must include 日记');

        // Save patch including notebookId
        lp.saveQuickWorkspaceConfig({ lifeLogCategories: ['测试1', '测试2'], lifeLogNotebookId: 'nb-123' });
        const updated = lp.getQuickWorkspaceConfig();
        assert.deepEqual(updated.lifeLogCategories, ['测试1', '测试2']);
        assert.equal(updated.lifeLogNotebookId, 'nb-123');

        // Check HTML builder includes quick actions
        const html = c.api.buildLaunchpadPopoverHtml([], false);
        assert.match(html, /lv-pop-quick-strip/, 'Popover HTML must contain quick strip');
        assert.match(html, /lv-quick-note-btn/, 'Must have QuickNote button');
        assert.match(html, /lv-quick-lifelog-btn/, 'Must have LifeLog button');
        assert.match(html, /lv-quick-diary-bottom-btn/, 'Must have DiaryBottom button');
        assert.match(html, /lv-quick-clip-btn/, 'Must have ClipBtn button');
        assert.match(html, /lv-quick-random-walk-btn/, 'Must have RandomWalk button');
        assert.match(html, /lv-quick-task-mgr-btn/, 'Must have TaskManager button');
        assert.match(html, /lv-quick-new-task-btn/, 'Must have NewTask button');
        assert.match(html, /lv-quick-reload-btn/, 'Desktop Popover HTML must have Reload button');
        assert.match(html, /lv-pop-today-ticker/, 'Desktop Popover must use compact single-line today ticker');
        assert.ok(html.indexOf('lv-pop-quick-wrap') < html.indexOf('lv-pop-search-bar'), 'Quick workbench must appear before compact search bar');

        // Check mobile settings & double click ball & smart tags & new task action in source
        const src = fs.readFileSync(find('lv-notice-kit.ts'), 'utf8');
        assert.match(src, /lv-sheet-pref-btn/, 'Mobile sheet must have settings button');
        assert.match(src, /lv-sheet-today-ticker/, 'Mobile sheet must use compact single-line today ticker');
        assert.match(src, /双击悬浮球：极速直达 LifeLog/, 'Mobile floating ball must support double-click LifeLog');
        assert.match(src, /lv-qw-tags-row/, 'Quick Note must include quick tag insertion chips');
        assert.match(src, /lv-qw-time-offsets/, 'LifeLog must include time offset selectors');
        assert.match(src, /lv-qw-add-cat-btn/, 'LifeLog must support inline category addition');
        assert.match(src, /data-action="new-task"/, 'Mobile sheet must contain new-task action card');
        assert.match(src, /data-action="paste-clip"/, 'Mobile sheet must contain paste-clip action card');
        assert.match(src, /data-action="random-walk"/, 'Mobile sheet must contain random-walk action card');
        assert.match(src, /tmQuickAddOpen/, 'openNewTask must cascade to tmQuickAddOpen');
        assert.match(src, /\/api\/ui\/reloadUI/, 'reloadUI must call SiYuan /api/ui/reloadUI');
        assert.match(src, /ORDER BY random\(\)/, 'randomWalk must query with random ordering');
        assert.equal(typeof c.api.resolveDailyNotebookId, 'function');
        assert.match(src, /resolveDailyNotebookId/, 'appendMarkdownToDailyNote must use resolveDailyNotebookId');
        assert.match(src, /local-dailynoteid/, 'resolveDailyNotebookId must check local-dailynoteid');

        // Ensure mobile quick grid does NOT contain reloadUI
        const mobileQuickMatch = src.match(/quickGrid\.innerHTML\s*=\s*`([\s\S]*?)`;/);
        assert.ok(mobileQuickMatch, 'Mobile quickGrid HTML block must exist');
        assert.ok(!/reload/i.test(mobileQuickMatch[1]) && !/重新加载/.test(mobileQuickMatch[1]), 'Mobile sheet must not contain reload button');
    } finally { c.close(); }
});

test('ECO-017: 通知系统长效免打扰（未来3天/未来一周）及统一 showMessage 适配器均可靠有效', () => {
    const store = new Map();
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
        assert.equal(c.api.lvNotify.isCategoryMuted('exam-review'), false);
        assert.equal(c.api.lvNotify.isMutedToday('exam-review'), false);

        // 未来 3 天不通知
        c.api.lvNotify.muteDays('exam-review', 3);
        assert.equal(c.api.lvNotify.isCategoryMuted('exam-review'), true);
        assert.equal(c.api.lvNotify.isMutedToday('exam-review'), true);

        // 未来 1 周不通知
        c.api.lvNotify.muteDays('daily-reminder', 7);
        assert.equal(c.api.lvNotify.isCategoryMuted('daily-reminder'), true);

        // 验证处于免打扰期的分类被静默拦截
        c.api.lvNotify.card({ source: '小驴考试', category: 'exam-review', title: '每日提醒', message: '不应弹出' });
        assert.equal(c.api.lvNotify.getHistory().length, 0);

        // 获取静音分类清单
        const mutedList = c.api.lvNotify.getMutedCategories();
        assert.equal(mutedList.length, 2);
        assert.ok(mutedList.some((x) => x.category === 'exam-review'));
        assert.ok(mutedList.some((x) => x.category === 'daily-reminder'));

        // 重载实例仍持久化生效，解除静音后恢复
        const reloaded = load('lv-notice-kit.ts', {}, { localStorage: fakeStorage });
        try {
            assert.equal(reloaded.api.lvNotify.isCategoryMuted('exam-review'), true);
            reloaded.api.lvNotify.clearCategoryMute('exam-review');
            assert.equal(reloaded.api.lvNotify.isCategoryMuted('exam-review'), false);
            assert.equal(reloaded.api.lvNotify.isCategoryMuted('daily-reminder'), true);
        } finally { reloaded.close(); }

        // Scoped showMessage 适配器校验
        const scopedShow = c.api.createScopedShowMessage('小驴打卡');
        scopedShow('[小驴打卡] 打卡成功', 2000, 'info');
        const hist = c.api.lvNotify.getHistory();
        assert.equal(hist.length, 1);
        assert.equal(hist[0].source, '小驴打卡');
        assert.equal(hist[0].message, '打卡成功');

        // 源码自动补全未来3天/未来一周验证
        const src = fs.readFileSync(find('lv-notice-kit.ts'), 'utf8');
        assert.match(src, /未来3天不通知/, 'Card renderer must support 3-day mute option');
        assert.match(src, /未来一周不通知/, 'Card renderer must support 7-day mute option');
        assert.match(src, /lv-pop-unmute-btn/, 'Settings drawer must provide unmute trigger');
    } finally { c.close(); }
});

test('ECO-018: notification history folds duplicates (including non-consecutive & scan heartbeats) and captures SiYuan #message snackbars', () => {
    const store = new Map();
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
        c.api.lvNotify.silent({ source: '小驴管家', category: 'hub-scan', message: '管家扫描完成：1 项逾期，0 项临期（共 1 项）' });
        c.api.lvNotify.silent({ source: '小驴管家', category: 'journal-sync', message: '后台流水与日记文档增量同步完成' });
        c.api.lvNotify.silent({ source: '小驴管家', category: 'hub-scan', message: '管家扫描完成：1 项逾期，0 项临期（共 1 项）' });
        c.api.lvNotify.silent({ source: '小驴管家', category: 'hub-scan', message: '管家扫描完成：0 项逾期，0 项临期（共 0 项）' });

        const hist = c.api.lvNotify.getHistory();
        assert.equal(hist.length, 2, 'non-consecutive hub-scan notices should fold into 1 row');
        assert.equal(hist[0].category, 'hub-scan');
        assert.equal(hist[0].repeatCount, 3);
        assert.match(hist[0].message, /0 项逾期/);

        const items = [{ id: 'siyuan-home', name: '小驴管家', desc: '管家', state: 'docked', onClick() {} }];
        const inboxHtml = c.api.buildLaunchpadPopoverHtml(items, false, { showInboxDrawer: true, inboxFilter: 'all' });
        assert.ok(inboxHtml.includes('×3'), 'inbox drawer should render ×3 repeat badge');
        assert.ok(inboxHtml.includes('lv-inbox-copy-btn'), 'inbox drawer should render copy button');
        assert.ok(inboxHtml.includes('data-inbox-filter="siyuan"'), 'inbox drawer should include SiYuan native filter tab');
    } finally { c.close(); }

    // 模拟 SiYuan 原生 #message 容器与 MutationObserver 采集
    const observers = [];
    class MockMutationObserver {
        constructor(cb) { this.cb = cb; this.disconnected = false; observers.push(this); }
        observe() {}
        disconnect() { this.disconnected = true; }
    }
    const makeEl = (tag, cls = '', text = '') => {
        const classes = new Set(cls ? cls.split(/\s+/).filter(Boolean) : []);
        const children = [];
        return {
            tagName: tag.toUpperCase(),
            style: {},
            dataset: {},
            textContent: text,
            innerText: text,
            classList: {
                add: (...c) => c.forEach((x) => classes.add(x)),
                remove: (...c) => c.forEach((x) => classes.delete(x)),
                contains: (c) => classes.has(c),
            },
            setAttribute() {},
            getAttribute() { return null; },
            addEventListener() {},
            appendChild(ch) { children.push(ch); return ch; },
            querySelector(sel) {
                if (sel === '.b3-snackbar__content') return children.find((x) => x.classList?.contains('b3-snackbar__content')) || null;
                return null;
            },
            querySelectorAll() { return []; },
            closest(sel) { return sel === '.b3-snackbar' && classes.has('b3-snackbar') ? this : null; },
            remove() {},
        };
    };
    const msgBox = makeEl('div');
    const hostDiv = makeEl('div');
    const mockDoc = {
        body: makeEl('body'),
        head: makeEl('head'),
        getElementById(id) {
            if (id === 'message') return msgBox;
            if (id === 'lv-notice-host') return hostDiv;
            return null;
        },
        createElement(tag) { return makeEl(tag); },
    };
    const c2 = load('lv-notice-kit.ts', {}, { localStorage: fakeStorage, document: mockDoc, MutationObserver: MockMutationObserver });
    try {
        c2.api.lvNotify.clearHistory();
        c2.api.lvNotify.registerPlugin('测试插件');
        const msgObs = observers.find((o) => !o.disconnected);
        assert.ok(msgObs, 'should attach MutationObserver to #message');

        const infoSnack = makeEl('div', 'b3-snackbar', '工作空间同步完成');
        const errSnack = makeEl('div', 'b3-snackbar b3-snackbar--error', 'SQL 查询语法错误');
        msgObs.cb([{ type: 'childList', addedNodes: [infoSnack, errSnack] }]);

        const nativeHist = c2.api.lvNotify.getHistory();
        assert.equal(nativeHist.length, 2);
        assert.equal(nativeHist[0].source, '思源原生');
        assert.equal(nativeHist[0].level, 'error');
        assert.equal(nativeHist[0].read, false);
        assert.equal(nativeHist[1].source, '思源原生');
        assert.equal(nativeHist[1].level, 'info');
        assert.equal(nativeHist[1].read, true, 'non-error SiYuan native notice should be archived as read');

        // 同元素原地文本更新（如思源进度消息），不新增重复条目
        errSnack.textContent = 'SQL 查询语法错误（已重试）';
        errSnack.innerText = 'SQL 查询语法错误（已重试）';
        msgObs.cb([{ type: 'characterData', target: errSnack, addedNodes: [] }]);
        const updatedHist = c2.api.lvNotify.getHistory();
        assert.equal(updatedHist.length, 2);
        assert.equal(updatedHist[0].message, 'SQL 查询语法错误（已重试）');

        const items = [{ id: 'siyuan-home', name: '小驴管家', desc: '管家', state: 'docked', onClick() {} }];
        const syHtml = c2.api.buildLaunchpadPopoverHtml(items, false, { showInboxDrawer: true, inboxFilter: 'siyuan' });
        assert.ok(syHtml.includes('SQL 查询语法错误（已重试）'));
        assert.ok(syHtml.includes('思源 2'));
    } finally { c2.close(); }
});

test('ECO-019: ephemeral archive=false suppression, randomWalk contacts fallback, shared desktop owners, and global Quicker hotkey', async () => {
    const openedDocs = [];
    const registeredCommands = [];
    const fakeWindow = {
        setTimeout,
        clearTimeout,
        addEventListener() {},
        removeEventListener() {},
        siyuanContacts: {
            searchPeople: async () => [{ docId: 'person-doc-123', name: '张三' }],
        },
    };
    const fakeDoc = {
        getElementById() { return null; },
    };
    const c = load('lv-notice-kit.ts', fakeWindow, {
        document: fakeDoc,
        fetch: async () => ({ json: async () => ({ code: 0, data: [] }) }),
    });
    try {
        c.api.lvNotify.clearHistory();
        // 1. archive=false 瞬时回执与 undo 不污染通知中心历史
        c.api.lvNotify.capsule({ source: '罗盘', message: '瞬时回执', archive: false });
        c.api.lvNotify.undo({ source: '闪卡', message: '已撤销操作', onUndo() {} });
        assert.equal(c.api.lvNotify.getHistory().length, 0);
        assert.equal(c.api.lvNotify.getUnreadCount(), 0);
        // warn/error 级别即便传了 archive:false 仍保留告警留档
        c.api.lvNotify.capsule({ source: '罗盘', message: '重要警告', level: 'warn', archive: false });
        assert.equal(c.api.lvNotify.getHistory().length, 1);

        // 2. registerHostApi + randomWalk 在常规 SQL 为空时自动结合小驴人脉抽取并打开
        c.api.lvLaunchpad.registerHostApi({
            app: { id: 'test-app' },
            openTab: async (opts) => { openedDocs.push(opts?.doc?.id); },
        });
        await c.api.randomWalk();
        assert.deepEqual(openedDocs, ['person-doc-123']);

        // 3. ensureUnifiedEntry 仅全局注册一次冷僻全局快捷键 ⌥⇧⌘K（含 globalCallback）
        const clean1 = c.api.lvLaunchpad.ensureUnifiedEntry({
            app: { id: 'p1' },
            addCommand: (cmd) => registeredCommands.push(cmd),
        });
        const clean2 = c.api.lvLaunchpad.ensureUnifiedEntry({
            app: { id: 'p2' },
            addCommand: (cmd) => registeredCommands.push(cmd),
        });
        assert.equal(registeredCommands.length, 1);
        assert.equal(registeredCommands[0].hotkey, '⌥⇧⌘K');
        assert.equal(typeof registeredCommands[0].globalCallback, 'function');
        clean1();
        clean2();

        // 4. 验证顶栏共享 owners 跨插件去闪与双击进 LifeLog 源码契约
        const src = fs.readFileSync(find('lv-notice-kit.ts'), 'utf8');
        assert.match(src, /__LV_DESKTOP_ENTRY_OWNERS__/);
        assert.match(src, /__LV_TOPBAR_CONVERGENCE_TIMER__/);
        assert.match(src, /lastMobileTopbarTap/);
    } finally { c.close(); }
});

test('ECO-020: Launchpad v2.6 in-place rerender, search UX, dark QuickModal tokens, inline LifeLog category add, and URL clip formatting', async () => {
    const c = load('lv-notice-kit.ts');
    try {
        const items = [
            { id: 'siyuan-checkin', name: '打卡', fullName: '小驴打卡', desc: '习惯', state: 'docked', onClick() {} },
        ];
        const mainHtml = c.api.buildLaunchpadPopoverHtml(items, false);
        assert.ok(mainHtml.includes('lv-pop-search-clear'), 'Desktop search bar must include clear button');
        assert.ok(mainHtml.includes('lv-pop-search-history'), 'Desktop search bar must include history chips container');

        const prefHtml = c.api.buildLaunchpadPopoverHtml(items, false, { showPrefDrawer: true });
        assert.ok(prefHtml.includes('lv-pop-notebook-select'), 'Settings drawer must use real notebook select dropdown');
        assert.ok(prefHtml.includes('lv-pop-save-toast'), 'Settings drawer must include inline save feedback toast');
        assert.ok(!prefHtml.includes('lv-pop-grid'), 'Settings sub-view should not cram grid underneath');

        const inboxHtml = c.api.buildLaunchpadPopoverHtml(items, false, { showInboxDrawer: true });
        assert.ok(!inboxHtml.includes('lv-pop-grid'), 'Inbox sub-view should not cram grid underneath');

        const src = fs.readFileSync(find('lv-notice-kit.ts'), 'utf8');
        assert.doesNotMatch(src, /window\.prompt\(/, 'LifeLog must not use unsupported Electron window.prompt');
        assert.match(src, /lv-qw-add-cat-input/, 'LifeLog must provide inline category composer');
        assert.match(src, /lv-qw-ll-nb-select/, 'LifeLog must provide target notebook selector');
        assert.match(src, /data-action="daily-review"/, 'Mobile quickGrid should balance 4x2 with daily-review');
        assert.match(src, /rerenderPopover/, 'Desktop popover should rerender in-place without flickering destroy/recreate');
        assert.match(src, /lv-popover-settled/, 'In-place rerender must suppress re-entrance animation');
        assert.match(src, /querySelector\("\.lv-pop-today-ticker"\)/, 'syncTodayDashboardDom must target .lv-pop-today-ticker');
        assert.match(src, /isInFormControl/, 'Desktop popover must guard single-letter shortcuts inside form inputs');
        assert.match(src, /\[contenteditable="true"\]/, 'openDiaryBottom must focus editable child block');
        assert.match(src, /body\.body--dark[\s\S]{0,160}\.lv-qw-mask/, 'QuickModal must define dark mode theme tokens');
        assert.match(src, /resolveIconHref\(item\.svgIcon\)/, 'Desktop tiles must prefer real sprite plugin icons');
        assert.match(src, /lv-inbox-day-sep/, 'Inbox drawer should group notices by day');
        assert.match(src, /lv-sheet-dragging/, 'Mobile sheet should provide drag-down visual feedback');
        assert.match(src, /aria-haspopup/, 'Compass entries must declare dialog popup semantics');
        // Round-3：8 快捷功能逐项强化
        assert.match(src, /data-insert="date"/, 'QuickNote must provide date insertion chip');
        assert.match(src, /lv-qw-draft-hint-text/, 'Draft restore hint must show saved-at timestamp');
        assert.match(src, /quickNoteSavedCount \+= 1/, 'QuickNote continue mode must count saved entries');
        assert.match(src, /interface TodayWriteEntry/, 'Shared write history must carry line text + block id');
        assert.match(src, /readTodayWriteEntries/, 'LifeLog & QuickNote must share the write-history reader');
        assert.match(src, /buildTodayWriteStripHtml/, 'LifeLog & QuickNote must share the history strip builder');
        assert.match(src, /undoLastTodayWriteEntry/, 'LifeLog & QuickNote must share the block-level undo runner');
        assert.match(src, /lv_quicknote_today_/, 'QuickNote must keep its own today write history for undo');
        assert.match(src, /lv-qw-undo-btn/, 'LifeLog strip must offer one-click undo of latest entry');
        assert.match(src, /\/api\/block\/deleteBlock/, 'LifeLog undo must delete the written block');
        assert.match(src, /buildClipMarkdown/, 'Clip paste must centralize markdown formatting');
        assert.match(src, /lines\.every\(\(l\) => \/\^https\?:\\\/\\\/\\S\+\$\/i\.test\(l\)\)/, 'Clip paste must expand multi-URL lines into separate link entries');
        assert.match(src, /saveClipboardImageToAssets/, 'Clip paste must auto-save clipboard images into workspace assets');
        assert.match(src, /\/api\/file\/putFile/, 'Clipboard image save must use putFile API');
        assert.match(src, /openClipPreviewModal/, 'Long clipboard text must open editable preview before append');
        assert.match(src, /手动粘贴/, 'Clipboard permission denial must fall back to a manual paste modal');
        assert.match(src, /lv-qw-clip-target-btn/, 'Clip preview modal must offer cycling target badge like QuickNote');
        assert.match(src, /openPluginBazaarSettings/, 'Task-manager failure guidance must open plugin bazaar');
        assert.match(src, /taskMgrLastTier/, 'Task-manager should remember last successful invocation tier');
        assert.match(src, /newTaskLastTier/, 'New-task should remember last successful invocation tier');
        assert.match(src, /updated > strftime\('%Y%m%d%H%M%S','now','-90 days'\)/, 'Random walk must prefer docs updated within 90 days');
        assert.match(src, /内核重载接口异常，已降级为浏览器刷新/, 'Reload must surface degraded fallback feedback');
        assert.match(src, /aria-keyshortcuts/, 'Desktop quick pills must declare their hotkeys for assistive tech');
        // Round-5：LifeLog 配图
        assert.match(src, /lv-qw-photo-btn/, 'LifeLog must expose a photo picker chip');
        assert.match(src, /compressAndPutImageFile/, 'Photos must be canvas-compressed (1600px/JPEG0.85) before putFile');
        assert.match(src, /lv-lifelog-/, 'LifeLog photos must use the lv-lifelog asset name prefix');
        assert.match(src, /lv-qw-attach-strip/, 'LifeLog modal must render pending photo thumbnails strip');
        assert.match(src, /extractAppendIdsList/, 'Multi-block append must collect all created block ids');
        assert.match(src, /📷×/, 'History strip & preview must mark photo count');
        assert.match(src, /bs: extraIds && extraIds\.length > 0 \? extraIds : undefined/, 'Write history entries must carry sibling block ids for group undo');
        // Round-6：双端徽章动态化与语义修正
        assert.match(src, /item\.badge = undefined;/, 'badgeProvider null/undefined must clear stale badge snapshot (desktop sync probe)');
        assert.match(src, /else if \(!dynamicBadge && item\.badge\) \{\s*item\.badge = undefined;/, 'Async zeroed probe must clear stale badge too (desktop & mobile)');
        assert.match(src, /tileEl\?\.querySelector\("\.lv-pop-badge"\)\?\.remove\(\)/, 'Async zeroed probe must remove tile badge element');
        assert.match(src, /项待完成/, 'Checkin ticker label must reflect pending semantics ("N 待办" = N items left, not done)');
        assert.match(src, /\/temp\/xiaolv-backup-/, 'Mobile joint backup must write to workspace temp via putFile (no blob download in WebView)');
        assert.match(src, /打开雷切切片库/, 'Mobile eco chip label must match the actual action name (切片库, not 画板)');
        assert.match(src, /function openOmniHitWithFallback/, 'Omni hit click must fall back to linkBlockId jump when provider omits onClick');
        assert.match(src, /该结果暂不支持直达/, 'Omni hit with neither onClick nor linkBlockId must surface explicit feedback, not dead click');
        assert.match(src, /已选: 当前日记本/, 'Pref notebook select must not leak raw notebook hash id as first-frame label');
        assert.match(src, /selectedOptions\?\.\[0\];[\s\S]{0,80}nb\.name/, 'Notebook change must re-label selected option with real notebook name');
        // Round-8：焦点圈闭 / 资产卫生 / 搜索相关性 / 双端空态一致
        assert.match(src, /Tab 焦点圈闭/, 'Desktop popover must trap Tab focus cycling inside the surface');
        assert.match(src, /\/api\/file\/removeFile/, 'Removed pending photo must clean up its uploaded asset file');
        assert.match(src, /snippet\.includes\(kw\)\) score \+= 1/, 'Search relevance must also score snippet matches');
        assert.match(src, /m\.status === "empty" \? "–" : "0"/, 'Mobile dashboard ticker must match desktop empty "–" rendering');
        // Round-9：启动闪烁治理（锚点与思源 le() 重排终点对齐 + 拉锯限频）
        assert.match(src, /const DESKTOP_RIGHT_ANCHOR_SELECTOR = "#barMore,/, 'Compass anchor must match SiYuan le() reflow destination (#barMore) to stop tug-of-war flicker');
        assert.match(src, /now - lastCompassMoveAt < 600/, 'Compass repositioning must be rate-limited against SiYuan reflow');
        assert.match(src, /nowGuard - lastCompassRebuildAt < 250/, 'Observer rebuild path must be throttled during startup churn');
        assert.match(src, /buildDesktopEntryButton\(true\)/, 'Active re-mount path (plugin enable) must bypass the rebuild throttle');
        // Round-10：灾备闭环补齐（恢复半环）
        assert.match(src, /function openEcosystemRestoreDialog/, 'Ecosystem backup must have a restore dialog wired to restoreFull');
        assert.match(src, /lv-pop-restore-btn/, 'Desktop footer must expose the restore entry next to backup');
        assert.match(src, /从备份恢复/, 'Mobile eco row must expose restore chip');
        assert.match(src, /lv-restore-summary/, 'Restore dialog must show parsed backup summary before confirming');
        // Round-11：移动端文案去桌面化（触屏无键盘，Ctrl/Tab/Esc 提示按端适配）
        assert.match(src, /isMobileFrontend\(\) \? `点「\$\{escapeHtml\(opts\.secondaryLabel\)\}」可连续记录`/, 'QuickModal foot tips must switch to touch semantics on mobile');
        assert.match(src, /isMobileFrontend\(\) \? "记录想法或待办\.\.\." : "记录想法或待办\.\.\. \(Ctrl\+Enter/, 'QuickNote placeholder must drop keyboard hints on mobile');
        assert.match(src, /点下方 📷 可添加照片/, 'LifeLog placeholder must point to the photo chip on mobile instead of Ctrl+V');
        assert.match(src, /请长按屏幕粘贴内容到这里/, 'Manual paste placeholder must use long-press wording on mobile');
        assert.match(src, /touchMode \? `\$\{singleName\} · 点按直达`/, 'Mobile entry titles must use tap semantics, not left/right-click wording');
        assert.match(src, /lv-notice-more/, 'Notice stack must surface an overflow badge when older packets are hidden');
    } finally { c.close(); }
});
