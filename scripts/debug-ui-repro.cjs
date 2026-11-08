// UI 问题复现脚本（debug 专用，不进门禁）：三张用户截图对应的三个表面
//   1) 主面板空库态：左列 330px + 右预览栏空白割裂
//   2) 套件市场弹窗：容器令牌作用域缺失 → padding 失效、关闭按钮贴边
//   3) 设置弹窗滚动：sticky 导航条与被裁切首行
// 用法：node scripts/debug-ui-repro.cjs  （输出 docs/design/debug-*.png + 诊断 JSON）
const path = require("node:path");
const fs = require("node:fs");
const esbuild = require("esbuild");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "docs", "design");
const STUB = path.join(__dirname, "harness", "stub-dom.cjs");

let chromium;
try {
    ({chromium} = require(path.join(ROOT, "..", "小驴雷切", "node_modules", "@playwright", "test")));
} catch {
    ({chromium} = require("playwright"));
}

const bundlePath = path.join(OUT, "harness-bundle.js");
esbuild.buildSync({
    entryPoints: [path.join(__dirname, "harness", "entry.ts")],
    outfile: bundlePath,
    bundle: true,
    format: "iife",
    platform: "browser",
    target: "es2019",
    logLevel: "silent",
    alias: {siyuan: STUB},
});

const prodCss = fs.readFileSync(path.join(ROOT, "dist", "index.css"), "utf8");
// 与 render-production.cjs 相同的宿主 chrome 模拟变量
const b3Vars = `
.b3-scope { font-family: "PingFang SC", "Microsoft YaHei", -apple-system, "Segoe UI", sans-serif; }
.b3-dialog textarea.b3-text-field { min-height: 110px; resize: vertical; font-family: inherit; }
/* 真实思源宿主的 b3 主题变量挂在 :root（html）上，弹窗无论挂到哪都能取到 */
:root {
  --b3-theme-primary: #3575f0; --b3-theme-primary-light: #7f9ff5; --b3-theme-primary-lighter: #c6d5fa;
  --b3-theme-on-primary: #fff; --b3-theme-background: #fff; --b3-theme-surface: #f7f8fa;
  --b3-theme-on-background: #1f2329; --b3-theme-on-surface: #7d8085; --b3-border-color: #e5e7eb;
  --b3-list-hover: #eef1f6; --b3-menu-background: #fff;
  --b3-dialog-shadow: 0 8px 32px rgba(31,35,41,.14), 0 2px 8px rgba(31,35,41,.08);
}
.b3-scope.dark {
  --b3-theme-primary: #5a8af2; --b3-theme-primary-light: #3d4a66; --b3-theme-primary-lighter: #2c3a55;
  --b3-theme-on-primary: #fff; --b3-theme-background: #1e1e1f; --b3-theme-surface: #26262a;
  --b3-theme-on-background: #dcdcdc; --b3-theme-on-surface: #8a8a93; --b3-border-color: #36363a;
  --b3-list-hover: #2c2c31; --b3-menu-background: #26262a;
  --b3-dialog-shadow: 0 8px 32px rgba(0,0,0,.5), 0 2px 8px rgba(0,0,0,.35);
}
body { margin: 0; background: #eceef1; }
.b3-dialog__container {
  background: var(--b3-theme-background);
  border: 1px solid var(--b3-border-color);
  border-radius: 12px;
  box-shadow: var(--b3-dialog-shadow);
  overflow: hidden;
}
.b3-dialog__header { padding: 14px 16px 0; font-size: 15px; font-weight: 600; }
.b3-dialog__body { padding: 16px 20px 20px; }
.b3-button { border: 1px solid var(--b3-border-color); background: var(--b3-theme-background); color: var(--b3-theme-on-background); border-radius: 8px; padding: 4px 12px; font-size: 12.5px; cursor: pointer; }
.b3-button--small { padding: 2px 8px; }
.b3-button--text { border-color: transparent; background: transparent; }
.b3-select { border: 1px solid var(--b3-border-color); background: var(--b3-theme-surface); color: var(--b3-theme-on-background); }
.b3-text-field { border: 1px solid var(--b3-border-color); background: var(--b3-theme-surface); color: var(--b3-theme-on-background); outline: none; font-family: inherit; padding: 4px 8px; border-radius: 4px; box-sizing: border-box; }
.b3-dialog .xlc-search .b3-text-field { border: none; background: transparent; padding: 0; }
`;
const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>${b3Vars}</style><style>${prodCss}</style></head>
<body><div class="b3-scope light" id="stage"></div>
<script src="${path.basename(bundlePath)}"></script></body></html>`;
fs.writeFileSync(path.join(OUT, "debug-harness.html"), html);

const diagnostics = {};

(async () => {
    const browser = await chromium.launch({channel: "chrome"});
    const page = await browser.newPage({viewport: {width: 1280, height: 900}, deviceScaleFactor: 2});
    await page.goto("file:///" + path.join(OUT, "debug-harness.html").replace(/\\/g, "/"));
    await page.waitForFunction(() => Boolean(window.XlcHarness));

    const resetStage = () => page.evaluate(() => {
        document.querySelectorAll(".b3-dialog").forEach((el) => el.remove());
        const stage = document.getElementById("stage");
        stage.className = "b3-scope light";
        stage.innerHTML = "";
    });

    // ── 表面 1：主面板空库态 ─────────────────────────────────
    await resetStage();
    await page.evaluate(() => {
        window.XlcHarness.openDialog({empty: true, aiEnabled: true, query: ""});
        const dialogRoot = document.querySelector(".b3-dialog") ?? document.querySelector("[class*=b3-dialog]")?.parentElement;
        if (!dialogRoot) { diagnostics.err = document.body.innerHTML.slice(0, 400); }
        else document.getElementById("stage").appendChild(dialogRoot);
        const root = document.querySelector(".xlc-dialog");
        if (root) { root.style.height = "700px"; root.style.position = "relative"; }
        const container = document.querySelector(".b3-dialog__container");
        if (container) { container.style.margin = "0 auto"; container.style.maxWidth = "960px"; container.style.height = "760px"; }
        const input = document.querySelector(".xlc-search-input");
        if (input) { input.value = ""; input.dispatchEvent(new Event("input")); }
    });
    await page.waitForTimeout(600);
    diagnostics.mainEmpty = await page.evaluate(() => {
        const body = document.querySelector(".xlc-body");
        const list = document.querySelector(".xlc-list");
        const pane = document.querySelector(".xlc-pane");
        const empty = document.querySelector(".xlc-empty");
        return {
            bodyRect: body?.getBoundingClientRect().toJSON() ?? null,
            listRect: list?.getBoundingClientRect().toJSON() ?? null,
            paneRect: pane?.getBoundingClientRect().toJSON() ?? null,
            paneText: (pane?.textContent ?? "").slice(0, 40),
            paneHidden: pane ? getComputedStyle(pane).display === "none" : null,
            emptyRect: empty?.getBoundingClientRect().toJSON() ?? null,
        };
    });
    await page.screenshot({path: path.join(OUT, "debug-main-empty.png")});

    // ── 表面 2：套件市场弹窗 ─────────────────────────────────
    await resetStage();
    await page.evaluate(() => {
        window.XlcHarness.openStarterHub();
        const dialogRoot = document.querySelector(".b3-dialog") ?? document.querySelector("[class*=b3-dialog]")?.parentElement;
        if (!dialogRoot) { (window).__dbgErr = document.body.innerHTML.slice(0, 600); }
        else document.getElementById("stage").appendChild(dialogRoot);
        const container = document.querySelector(".b3-dialog__container");
        if (container) {
            container.style.margin = "60px auto";
            container.style.width = "720px";
            container.style.maxHeight = "none";
        }
    });
    await page.waitForTimeout(400);
    diagnostics.starterHub = await page.evaluate(() => {
        const container = document.querySelector(".xlc-starter-hub-container");
        const foot = document.querySelector(".xlc-starter-hub-foot");
        const closeBtn = document.querySelector("[data-xlc-control='starter-hub.close']");
        const cs = container ? getComputedStyle(container) : null;
        return {
            containerPadding: cs ? `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}` : null,
            space3Var: cs ? cs.getPropertyValue("--xlc-space-3").trim() : null,
            containerHostClass: document.querySelector(".b3-dialog__container")?.className,
            closeBtnRect: closeBtn?.getBoundingClientRect().toJSON() ?? null,
            bodyRect: document.querySelector(".b3-dialog__body")?.getBoundingClientRect().toJSON() ?? null,
            footRect: foot?.getBoundingClientRect().toJSON() ?? null,
        };
    });
    await page.screenshot({path: path.join(OUT, "debug-starter-hub.png"), fullPage: false});

    // ── 表面 3：设置弹窗（打开态 + 滚动态） ─────────────────
    await resetStage();
    await page.evaluate(() => {
        window.XlcHarness.openSettings("doc");
        const dialogRoot = document.querySelector(".b3-dialog") ?? document.querySelector("[class*=b3-dialog]")?.parentElement;
        if (!dialogRoot) { diagnostics.err = document.body.innerHTML.slice(0, 400); }
        else document.getElementById("stage").appendChild(dialogRoot);
        const container = document.querySelector(".b3-dialog__container");
        if (container) { container.style.margin = "40px auto"; container.style.height = "820px"; container.style.width = "720px"; }
    });
    await page.waitForTimeout(700);
    diagnostics.settingsOpen = await page.evaluate(() => {
        const body = document.querySelector(".b3-dialog__body");
        const nav = document.querySelector(".xlc-settings-nav-bar");
        return {
            scrollTop: body?.scrollTop ?? null,
            scrollHeight: body?.scrollHeight ?? null,
            clientHeight: body?.clientHeight ?? null,
            navRect: nav?.getBoundingClientRect().toJSON() ?? null,
            bodyRect: body?.getBoundingClientRect().toJSON() ?? null,
            navPosition: nav ? getComputedStyle(nav).position : null,
        };
    });
    await page.screenshot({path: path.join(OUT, "debug-settings-open.png")});

    // 滚到中部（模拟用户滚动到偏好设置区），观察 sticky 导航与首行裁切
    diagnostics.settingsScrolled = await page.evaluate(() => {
        const body = document.querySelector(".b3-dialog__body");
        if (!body) return null;
        const nav = document.querySelector(".xlc-settings-nav-bar");
        // 滚到「记录剪贴板历史」开关附近
        const target = Array.from(document.querySelectorAll(".xlc-switch-row, .xlc-setting-row")).find((el) => (el.textContent ?? "").includes("记录剪贴板历史"));
        if (target) target.scrollIntoView({block: "start"});
        return {
            scrollTopAfter: body.scrollTop,
            navRect: nav?.getBoundingClientRect().toJSON() ?? null,
            bodyRect: body?.getBoundingClientRect().toJSON() ?? null,
            targetRect: target?.getBoundingClientRect().toJSON() ?? null,
        };
    });
    await page.waitForTimeout(400);
    await page.screenshot({path: path.join(OUT, "debug-settings-scrolled.png")});

    fs.writeFileSync(path.join(OUT, "debug-ui-diagnostics.json"), JSON.stringify(diagnostics, null, 2));
    console.log(JSON.stringify(diagnostics, null, 2));
    await browser.close();
})();
