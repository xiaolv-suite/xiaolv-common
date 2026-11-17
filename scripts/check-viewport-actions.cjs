// 弹窗主操作按钮视口可见性门禁（T-0753）：
// 在 100%（1280×720）、125% 等效（1024×576）、150% 等效（853×480）三档视口下，
// 逐一打开「主搜索」「新建/捕获」「首跑引导」「发现」四个核心弹窗，
// 核验每个弹窗的主操作按钮完全位于视口内，且中心点经 document.elementFromPoint 实测未被遮挡或裁切。
"use strict";

const path = require("node:path");
const ROOT = path.resolve(__dirname, "..");
const HARNESS_URL = "file:///" + path.join(ROOT, "docs", "design", "harness.html").replace(/\\/g, "/");

let chromium;
try {
    ({chromium} = require(path.join(ROOT, "..", "小驴雷切", "node_modules", "@playwright", "test")));
} catch {
    ({chromium} = require("playwright"));
}

const VIEWPORTS = [
    {label: "100% (1280x720)", width: 1280, height: 720},
    {label: "125% (1024x576)", width: 1024, height: 576},
    {label: "150% (853x480)", width: 853, height: 480},
];

const DIALOGS = [
    {
        name: "search",
        open: () => window.XlcHarness.openDialog({}),
        selector: ".xlc-pane-foot .xlc-btn-primary",
    },
    {
        name: "capture",
        open: () => window.XlcHarness.openCapture(false),
        selector: "[data-xlc-control='capture.save']",
    },
    {
        name: "setup",
        open: () => window.XlcHarness.openSetup(),
        selector: "[data-xlc-control='setup.oneclick.create']",
    },
    {
        name: "discovery",
        open: () => window.XlcHarness.openDiscovery(),
        selector: ".xlc-discovery-footer .xlc-btn-primary",
    },
];

async function runViewportCheck(injectFault = false) {
    const browser = await chromium.launch({channel: "chrome"});
    const page = await browser.newPage();
    await page.goto(HARNESS_URL);

    if (injectFault) {
        await page.addStyleTag({
            content: ".xlc-pane-body { min-height: 900px !important; } .xlc-varbar-tools-panel[hidden] { display: block !important; height: 2200px !important; }",
        });
    }

    const failures = [];
    const results = [];

    for (const vp of VIEWPORTS) {
        await page.setViewportSize({width: vp.width, height: vp.height});
        for (const dlg of DIALOGS) {
            await page.evaluate(() => {
                document.querySelectorAll(".b3-dialog").forEach((el) => el.remove());
                const stage = document.getElementById("stage");
                if (stage) stage.innerHTML = "";
            });
            await page.evaluate(dlg.open);
            await page.waitForTimeout(50);
            const res = await page.evaluate(({sel, vw, vh}) => {
                const btn = document.querySelector(sel);
                if (!btn) return {found: false, inViewport: false, clickable: false};
                const r = btn.getBoundingClientRect();
                const inViewport = r.width >= 20 && r.height >= 20 && r.top >= 0 && r.left >= 0 && r.bottom <= vh && r.right <= vw;
                const cx = Math.floor(r.left + r.width / 2);
                const cy = Math.floor(r.top + r.height / 2);
                const hitEl = (cx >= 0 && cy >= 0 && cx < vw && cy < vh) ? document.elementFromPoint(cx, cy) : null;
                const clickable = !!hitEl && (hitEl === btn || btn.contains(hitEl));
                return {
                    found: true,
                    rect: {top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height)},
                    inViewport,
                    clickable,
                    hitTag: hitEl ? `${hitEl.tagName.toLowerCase()}.${hitEl.className}` : null,
                };
            }, {sel: dlg.selector, vw: vp.width, vh: vp.height});
            const ok = res.found && res.inViewport && res.clickable;
            results.push({viewport: vp.label, dialog: dlg.name, ok, ...res});
            if (!ok) {
                failures.push(`${vp.label} [${dlg.name}] (${dlg.selector}): inViewport=${res.inViewport} clickable=${res.clickable} rect=${JSON.stringify(res.rect)} hit=${res.hitTag}`);
            }
        }
    }

    await browser.close();
    return {ok: failures.length === 0, failures, results};
}

if (require.main === module) {
    const injectFault = process.argv.includes("--inject-fault");
    runViewportCheck(injectFault).then(({ok, failures, results}) => {
        for (const r of results) {
            console.log(`${r.ok ? "✔" : "✖"} ${r.viewport} | ${r.dialog} | rect=${JSON.stringify(r.rect)} hit=${r.hitTag}`);
        }
        if (!ok) {
            console.error(`✖ check-viewport-actions 失败（${failures.length} 项超出视口或被遮挡）`);
            process.exit(1);
        }
        console.log(`✔ check-viewport-actions 全部通过（${results.length}/${results.length} 项在 100%/125%/150% 视口内且可点中）`);
    }).catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = {runViewportCheck};
