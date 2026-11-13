// 测试专用 siyuan 桩件：仅提供被测代码引用的运行时符号，不做任何真实行为。
// 真实宿主行为不在单测里冒充（验收走真实思源 E2E）。
"use strict";
module.exports = {
    getFrontend: () => "desktop",
    getActiveEditor: () => null,
    openTab: () => {},
    Dialog: class {
        constructor() {
            const children = [];
            const bodyEl = {
                innerHTML: "",
                children,
                appendChild: (child) => { children.push(child); return child; },
                querySelector: (sel) => {
                    const search = (node) => {
                        if (!node) return null;
                        if (sel.startsWith(".") && node.className && node.className.includes(sel.slice(1))) return node;
                        for (const c of node.children || []) {
                            const found = search(c);
                            if (found) return found;
                        }
                        return null;
                    };
                    for (const c of children) {
                        const found = search(c);
                        if (found) return found;
                    }
                    return null;
                },
                querySelectorAll: (sel) => {
                    const res = [];
                    const collect = (node) => {
                        if (!node) return;
                        if (sel.startsWith(".") && node.className && node.className.includes(sel.slice(1))) res.push(node);
                        for (const c of node.children || []) collect(c);
                    };
                    for (const c of children) collect(c);
                    return res;
                },
            };
            const containerClasses = new Set();
            const containerEl = {
                classList: {
                    add: (...cls) => { cls.forEach((c) => containerClasses.add(c)); },
                    remove: (...cls) => { cls.forEach((c) => containerClasses.delete(c)); },
                    contains: (c) => containerClasses.has(c),
                },
                _classes: containerClasses,
                style: {},
                children: [bodyEl],
            };
            const headerEl = { querySelector: () => ({ appendChild: () => {}, textContent: "" }) };
            this.element = {
                querySelector: (sel) => {
                    if (sel === ".b3-dialog__container") return containerEl;
                    if (sel === ".b3-dialog__header") return headerEl;
                    if (sel === ".b3-dialog__body" || sel === ".b3-dialog__content") return bodyEl;
                    return bodyEl.querySelector(sel);
                },
                querySelectorAll: (sel) => bodyEl.querySelectorAll(sel),
                classList: { add: () => {} },
                isConnected: true,
            };
            if (typeof document !== "undefined" && document.body && typeof document.body.appendChild === "function") {
                document.body.appendChild(this.element);
            }
        }
        destroy() {}
    },
    confirm: () => {},
    showMessage: () => {},
    fetchSyncPost: async () => ({code: -1, msg: "stub", data: null}),
};
