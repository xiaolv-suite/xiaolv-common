// 空白区探针：dump 指定表面 modal 内各元素矩形，定位断层来源
const path = require("node:path");
const {chromium} = require(path.join("D:/思源插件/小驴常用", "..", "小驴雷切", "node_modules", "@playwright", "test"));
const ROOT = "D:/思源插件/小驴常用";
const name = process.argv[2] || "syncDiff";

(async () => {
    const browser = await chromium.launch({channel: "chrome"});
    const page = await browser.newPage({viewport: {width: 1280, height: 900}});
    await page.goto("file:///" + path.join(ROOT, "docs", "design", "surface-sweep", "surface-harness.html").replace(/\\/g, "/"));
    await page.waitForFunction(() => Boolean(window.XlcHarness));
    await page.evaluate((n) => window.XlcHarness.openSurface(n), name);
    await page.waitForTimeout(800);
    await page.evaluate((w) => {
        const container = document.querySelector(".b3-dialog__container");
        if (container) { container.style.margin = "30px auto"; container.style.width = Math.min(w, 1160) + "px"; container.style.maxHeight = "820px"; }
        const dialogRoot = document.querySelector(".b3-dialog");
        if (dialogRoot) document.getElementById("stage").appendChild(dialogRoot);
    }, 820);
    await page.waitForTimeout(250);
    const out = await page.evaluate(() => {
        const modal = document.querySelector(".xlc-sync-diff-modal, .xlc-csv-wizard, .xlc-promote-form, .xlc-form.xlc-guide, .xlc-guide");
        const root = modal ?? document.querySelector(".b3-dialog__body")?.firstElementChild;
        const dump = (el, depth) => {
            if (!el || depth > 4) return [];
            const rows = [];
            for (const c of el.children) {
                const r = c.getBoundingClientRect();
                const text = (c.textContent ?? "").trim().slice(0, 16);
                const cs = getComputedStyle(c);
                rows.push("  ".repeat(depth) + `${(c.className ?? "").toString().slice(0, 48)} h=${Math.round(r.height)} top=${Math.round(r.top)} disp=${cs.display} text="${text}"`);
                if (r.height > 80 && text === "") rows.push(...dump(c, depth + 1));
            }
            return rows;
        };
        const body = document.querySelector(".b3-dialog__body");
        const bodyRows = [];
        for (const c of body?.children ?? []) {
            const r = c.getBoundingClientRect();
            bodyRows.push(`${(c.className ?? "").toString().slice(0, 52)} h=${Math.round(r.height)} top=${Math.round(r.top)} text="${(c.textContent ?? "").trim().slice(0, 14)}"`);
        }
        return {
            bodyH: Math.round(body?.getBoundingClientRect().height ?? 0),
            bodyScrollH: body?.scrollHeight,
            bodyOverflowY: body ? getComputedStyle(body).overflowY : "",
            rootCls: root?.className,
            bodyChildren: bodyRows,
            tree: dump(root, 0).slice(0, 40),
        };
    }, name);
    console.log(JSON.stringify(out, null, 1));
    await browser.close();
})();
