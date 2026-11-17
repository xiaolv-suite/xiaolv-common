"use strict";

// R422 · UI 缺陷修复回归契约（用户三张截图实证的 5 项缺陷）：
// 1. 三个弹窗缺令牌作用域 host 类 → padding 塌陷、关闭按钮贴出容器边缘
// 2. 空库态右预览栏空白割裂 → solo 布局契约
// 3. 设置面板 sticky 导航条被滚动容器顶部 padding 顶离滚动口 → 顶缝露裁切行
// 4. Top 榜露出已删除条目的裸块 ID → 幽灵条目过滤
// 5. 热力图「累计」措辞与全期「累计调用」口径冲突 → 窗口内措辞

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const entry = require("./.build/entry.cjs");
const {starterPacksDialog, pinboard, shareCard, usageInsights} = entry;
const {openStarterPacksHubDialog} = starterPacksDialog;
const {openPinboardDialog} = pinboard;
const {openShareCardDialog} = shareCard;
const {filterKnownTopItems} = usageInsights;

const root = path.resolve(__dirname, "..");
const indexScss = fs.readFileSync(path.join(root, "src", "styles", "index.scss"), "utf8");
const settingsDialogTs = fs.readFileSync(path.join(root, "src", "ui", "settings-dialog.ts"), "utf8");

function makeElem(tag) {
    return {
        tagName: String(tag || "div").toUpperCase(),
        style: {},
        className: "",
        textContent: "",
        children: [],
        dataset: {},
        appendChild(child) {
            this.children.push(child);
            return child;
        },
        append(...items) {
            for (const it of items) this.appendChild(it);
        },
        setAttribute(k, v) { this[k] = v; },
        removeAttribute(k) { delete this[k]; },
        classList: {
            _classes: new Set(),
            add(...cls) { cls.forEach((c) => this._classes.add(c)); },
            remove(...cls) { cls.forEach((c) => this._classes.delete(c)); },
            contains(c) { return this._classes.has(c); },
        },
        addEventListener(ev, fn) {
            this._listeners ??= {};
            this._listeners[ev] ??= [];
            this._listeners[ev].push(fn);
        },
        querySelector(sel) {
            if (sel === ".b3-dialog__body") return this;
            const search = (node) => {
                for (const c of node.children || []) {
                    if (typeof c.className === "string" && c.className.split(/\s+/).includes(sel.slice(1))) return c;
                    const found = search(c);
                    if (found) return found;
                }
                return null;
            };
            return search(this);
        },
        querySelectorAll() { return []; },
    };
}

function withMockDoc(fn) {
    const originalDoc = global.document;
    global.document = {
        createElement: (tag) => makeElem(tag),
        createElementNS: (_ns, tag) => makeElem(tag),
        createTextNode: (t) => ({textContent: t}),
    };
    try {
        return fn();
    } finally {
        global.document = originalDoc;
    }
}

test("R422-1: 三个弹窗容器必须挂令牌作用域 host 类（缺类时 --xlc-* 全失效、padding 塌陷、按钮贴边）", () => {
    withMockDoc(() => {
        // 1) 套件市场
        const hubDlg = openStarterPacksHubDialog({
            t: (k) => k,
            importStarterPackDirect: async () => ({ok: true, count: 6}),
            onImportSuccess: () => {},
        });
        const hubContainer = hubDlg.element.querySelector(".b3-dialog__container");
        assert.ok(hubContainer, "套件市场容器存在");
        assert.ok(
            hubContainer._classes.has("xlc-dialog-host"),
            "套件市场弹窗必须挂 xlc-dialog-host（截图实证：缺类时关闭按钮贴出容器右缘）",
        );

        // 2) 连环取用拼板
        const pinDlg = openPinboardDialog(
            {t: (k) => k, copyText: async () => true},
            "对公转账四件套",
            [{id: "xlc-1", title: "开户行", content: "XX 银行"}],
        );
        const pinContainer = pinDlg.element.querySelector(".b3-dialog__container");
        assert.ok(pinContainer, "拼板容器存在");
        assert.ok(pinContainer._classes.has("xlc-dialog-host"), "拼板弹窗必须挂 xlc-dialog-host");

        // 3) 分享卡片
        const shareDlg = openShareCardDialog(
            {t: (k) => k, copyText: async () => true},
            {id: "xlc-2", title: "SLA 标准", itemType: "text"},
            "xlc-bundle-demo",
        );
        const shareContainer = shareDlg.element.querySelector(".b3-dialog__container");
        assert.ok(shareContainer, "分享卡片容器存在");
        assert.ok(shareContainer._classes.has("xlc-dialog-host"), "分享卡片弹窗必须挂 xlc-dialog-host");
    });
});

test("R422-2: 空库态 solo 布局契约（隐藏右预览栏、列表独占整宽）", () => {
    assert.match(indexScss, /\.xlc-body\.xlc-body--solo\s*\{/, "solo 布局规则块必须存在");
    const soloBlock = indexScss.match(/\.xlc-body\.xlc-body--solo\s*\{[\s\S]*?\n  \}/)?.[0] ?? "";
    assert.ok(soloBlock, "solo 块可截取");
    assert.match(soloBlock, /\.xlc-pane\s*\{\s*display:\s*none;/, "空库态必须隐藏右预览栏");
    assert.match(soloBlock, /\.xlc-list\s*\{[\s\S]*?width:\s*100%/, "空库态列表必须独占整宽");
    assert.match(soloBlock, /flex:\s*1\s+1\s+auto/, "必须复位 46% 双栏的 flex 基准（否则 width:100% 不生效）");
    // renderList 中的切换逻辑
    const dialogTs = fs.readFileSync(path.join(root, "src", "ui", "dialog.ts"), "utf8");
    assert.match(dialogTs, /xlc-body--solo/, "renderList 必须按空库态切换 solo 类");
    assert.match(dialogTs, /emptyLibrary/, "solo 判定必须锚定空库文案（其余空态不受影响）");
});

test("R422-3: 设置面板 sticky 导航条必须贴住滚动口顶边（滚动容器顶部 padding 归零 + 顶距移到内容根）", () => {
    // 覆盖规则必须以不低于 form-host :has() 版 (0,4,0) 的强度书写，且出现于其后
    const overrideIdx = indexScss.indexOf(".b3-dialog__container.xlc-form-host.xlc-settings-root-host .b3-dialog__body");
    assert.ok(overrideIdx > 0, "设置面板 body padding-top:0 覆盖规则必须存在");
    const overrideBlock = indexScss.slice(overrideIdx, overrideIdx + 400);
    assert.match(overrideBlock, /padding-top:\s*0/, "必须清零滚动容器顶部 padding（截图实证：顶缝里露被裁切行）");
    assert.match(indexScss, /\.xlc-settings\s*\{\s*padding-top:\s*var\(--xlc-space-5\)/, "顶距必须移到内容根 .xlc-settings");
    // 导航跳转落点补偿
    assert.match(
        indexScss,
        /scroll-margin-top:\s*var\(--xlc-nav-h,\s*96px\)/,
        "章节 scroll-margin-top 必须存在（scrollIntoView 不感知 sticky 导航条）",
    );
    assert.match(settingsDialogTs, /--xlc-nav-h/, "导航点击时必须按实际吸顶高度写入 --xlc-nav-h");
});

test("R422-4: Top 榜幽灵条目过滤（已删除条目不得以裸块 ID 露出）", () => {
    const topItems = [
        {id: "xlc-live000001", title: "延期道歉", count: 5, lastAt: 1, savedKeystrokes: 100},
        {id: "xlc-ghost0001", title: "xlc-ghost0001", count: 2, lastAt: 1, savedKeystrokes: 50},
    ];
    const knownIds = new Set(["xlc-live000001"]);

    const visible = filterKnownTopItems(topItems, knownIds);
    assert.equal(visible.length, 1, "幽灵条目必须被过滤");
    assert.equal(visible[0]?.id, "xlc-live000001");

    // 全部为幽灵时返回空（调用方据此隐藏整个榜单区块）
    assert.equal(filterKnownTopItems(topItems, new Set()).length, 0);

    // knownIds 覆盖全部时原样保留（顺序与数量不变）
    const all = filterKnownTopItems(topItems, new Set(["xlc-live000001", "xlc-ghost0001"]));
    assert.equal(all.length, 2);
    assert.deepEqual(all.map((it) => it.id), ["xlc-live000001", "xlc-ghost0001"]);
});

test("R422-5: 热力图标题措辞必须是「窗口内」口径（与全期「累计调用」区分）", () => {
    assert.match(settingsDialogTs, /近 30 天资产复用活跃度（窗口内 \$\{heatmap\.totalCalls30Days\} 次/, "热力图标题必须写明窗口内口径");
    assert.doesNotMatch(
        settingsDialogTs,
        /近 30 天资产复用活跃度（累计/,
        "严禁再用「累计」描述 30 天窗口计数（历史使用用户会误读为数据矛盾）",
    );
});

test("R433-1: 弹窗内层容器严禁复用 .b3-dialog__container 类（宿主会二次施加 max-height+overflow 裁切内容）", () => {
    const sanitizerTs = fs.readFileSync(path.join(root, "src", "ui", "export-sanitizer-modal.ts"), "utf8");
    assert.doesNotMatch(
        sanitizerTs,
        /className\s*=\s*["'][^"']*b3-dialog__container/,
        "renderSanitizerOptionsModal 的内层容器不得携带 .b3-dialog__container（R433 截图实证：内容被宿主 80vh 裁切、按钮够不到）",
    );
    // 内层容器仍须有自身的样式钩子
    assert.match(sanitizerTs, /xlc-export-sanitizer-modal/, "内层容器必须保留 xlc-export-sanitizer-modal 样式钩子");
});
