"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const { DockView } = entry.dockView;
const { extractUrlComponent, prefixLines, suffixLines } = entry.textFormatting || entry;
const { applyPlaceholders } = entry.placeholders || entry;

function createMockElement(tag) {
    const children = [];
    const classList = new Set();
    const listeners = {};
    const dataset = {};
    const style = {};
    let innerHtmlVal = "";
    let textContentVal = "";

    return {
        tagName: tag.toUpperCase(),
        className: "",
        get textContent() {
            if (children.length === 0) return textContentVal;
            return children.map((c) => c.textContent || "").join(" ");
        },
        set textContent(val) { textContentVal = val; },
        get innerHTML() { return innerHtmlVal; },
        set innerHTML(val) {
            innerHtmlVal = val;
            if (val === "") children.length = 0;
        },
        style,
        dataset,
        children,
        draggable: false,
        disabled: false,
        value: "",
        attributes: {},
        setAttribute(k, v) { this.attributes[k] = String(v); },
        getAttribute(k) { return this.attributes[k] || null; },
        classList: {
            add: (cls) => classList.add(cls),
            remove: (cls) => classList.delete(cls),
            contains: (cls) => classList.has(cls),
            toggle: (cls, force) => {
                if (force === undefined) {
                    if (classList.has(cls)) classList.delete(cls);
                    else classList.add(cls);
                } else if (force) {
                    classList.add(cls);
                } else {
                    classList.delete(cls);
                }
            },
        },
        appendChild: (child) => {
            children.push(child);
            return child;
        },
        addEventListener: (event, handler) => {
            listeners[event] = listeners[event] || [];
            listeners[event].push(handler);
        },
        dispatchEvent: (event) => {
            const handlers = listeners[event.type] || [];
            for (const h of handlers) h(event);
        },
        querySelector: (selector) => {
            for (const c of children) {
                if (selector.startsWith(".") && c.className && c.className.includes(selector.slice(1))) return c;
            }
            return null;
        },
        querySelectorAll: (selector) => {
            const results = [];
            for (const c of children) {
                if (selector.startsWith(".") && c.className && c.className.includes(selector.slice(1))) results.push(c);
            }
            return results;
        },
        focus: () => {},
        remove: () => {},
    };
}

test("DockView · 分类折叠状态跨刷新与多实例记忆保持", () => {
    const originalDocument = global.document;
    global.document = {
        createElement: (tag) => createMockElement(tag),
        createTextNode: (text) => ({ text }),
    };

    try {
        const mockContainer = createMockElement("div");
        const mockItems = [
            { id: "1", title: "话术一", category: "常用话术", content: "你好" },
            { id: "2", title: "模板一", category: "代码模板", content: "console.log" },
        ];
        const deps = {
            search: async () => mockItems,
            t: (k) => k,
            runAction: async () => ({ ok: true }),
            toggleFavorite: () => {},
            isFavorite: () => false,
            copyText: async () => true,
            copyProviderPayload: async () => true,
            openSource: async () => ({ ok: true, message: "" }),
            newItem: () => {},
            isSourceMissing: () => false,
        };

        const dock = new DockView(mockContainer, deps);
        // 折叠 "代码模板"
        dock.setCategoryCollapsed("代码模板", true);
        assert.deepEqual(dock.getCollapsedCategories().includes("代码模板"), true, "已折叠分类必须被记忆记录");

        // 创建第二个实例模拟重新打开侧边栏
        const secondContainer = createMockElement("div");
        const secondDock = new DockView(secondContainer, deps);
        assert.deepEqual(secondDock.getCollapsedCategories().includes("代码模板"), true, "新实例必须保留既有折叠状态");

        // 展开并验证同步恢复
        secondDock.setCategoryCollapsed("代码模板", false);
        assert.equal(secondDock.getCollapsedCategories().includes("代码模板"), false, "展开后折叠状态同步移除");
    } finally {
        global.document = originalDocument;
    }
});

test("URL 组件提取纯函数 · extractUrlComponent 精准提取 query、host、path", () => {
    const url = "https://api.github.com/v1/repos?owner=xiaolv-suite&repo=xiaolv-common#readme";
    assert.equal(extractUrlComponent(url, "param", "owner"), "xiaolv-suite");
    assert.equal(extractUrlComponent(url, "param", "repo"), "xiaolv-common");
    assert.equal(extractUrlComponent(url, "param", "non_exist"), null);
    assert.equal(extractUrlComponent(url, "host"), "api.github.com");
    assert.equal(extractUrlComponent(url, "path"), "/v1/repos");
    assert.equal(extractUrlComponent(url, "protocol"), "https:");

    // 容错与无协议 URL
    assert.equal(extractUrlComponent("example.com/login?token=abc1234", "param", "token"), "abc1234");
    assert.equal(extractUrlComponent("", "host"), null);
    assert.equal(extractUrlComponent("invalid", "param", "foo"), null);
});

test("多行前缀与后缀装饰纯函数 · prefixLines 与 suffixLines 批量处理与空行保护", () => {
    const rawCode = "const x = 10;\n\nconst y = 20;";
    const commented = prefixLines(rawCode, "// ");
    assert.equal(commented, "// const x = 10;\n\n// const y = 20;", "默认必须保留空行不注入前缀");

    const fullQuoted = prefixLines(rawCode, "> ", { skipEmpty: false });
    assert.equal(fullQuoted, "> const x = 10;\n> \n> const y = 20;", "skipEmpty=false 时每行均注入");

    const suffixed = suffixLines("apple\nbanana", ";");
    assert.equal(suffixed, "apple;\nbanana;");
});

test("动态宏引擎 · {{xlc:url}} 结构化参数提取与 {{xlc:line}} 批量装饰求值", () => {
    const now = new Date("2026-10-29T10:00:00Z");

    // 1. URL 参数提取宏
    const urlTemplate = "Token={{xlc:url:param|token|https://auth.io/callback?token=sec_789&user=alice}}";
    assert.equal(applyPlaceholders(urlTemplate, now, true), "Token=sec_789");

    const hostTemplate = "Server={{xlc:url:host|https://master.cluster.local:8080/metrics}}";
    assert.equal(applyPlaceholders(hostTemplate, now, true), "Server=master.cluster.local");

    const pathTemplate = "API={{xlc:url:path|https://api.io/v2/users/info?id=1}}";
    assert.equal(applyPlaceholders(pathTemplate, now, true), "API=/v2/users/info");

    // 2. 文本行批量前缀装饰宏
    const linePrefixTemplate = "{{xlc:line:prefix|- |待办一\n待办二}}";
    assert.equal(applyPlaceholders(linePrefixTemplate, now, true), "- 待办一\n- 待办二");

    const lineSuffixTemplate = "{{xlc:line:suffix|,|apple\nbanana}}";
    assert.equal(applyPlaceholders(lineSuffixTemplate, now, true), "apple,\nbanana,");

    const lineTrimTemplate = "{{xlc:line:trim|  first  \n  second  }}";
    assert.equal(applyPlaceholders(lineTrimTemplate, now, true), "first\nsecond");
});
