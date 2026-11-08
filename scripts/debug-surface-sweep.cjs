// 全表面视觉审计（R433）：渲染所有用户可触达弹窗 → 截图 docs/design/surface-sweep/*.png
// 用法：node scripts/debug-surface-sweep.cjs
const path = require("node:path");
const fs = require("node:fs");
const esbuild = require("esbuild");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "docs", "design", "surface-sweep");
const STUB = path.join(__dirname, "harness", "stub-dom.cjs");
fs.mkdirSync(OUT, {recursive: true});

let chromium;
try {
    ({chromium} = require(path.join(ROOT, "..", "小驴雷切", "node_modules", "@playwright", "test")));
} catch {
    ({chromium} = require("playwright"));
}

const bundlePath = path.join(OUT, "surface-bundle.js");
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
const b3Vars = `
.b3-scope { font-family: "PingFang SC", "Microsoft YaHei", -apple-system, "Segoe UI", sans-serif; }
:root {
  --b3-theme-primary: #3575f0; --b3-theme-primary-light: #7f9ff5; --b3-theme-primary-lighter: #c6d5fa;
  --b3-theme-on-primary: #fff; --b3-theme-background: #fff; --b3-theme-surface: #f7f8fa;
  --b3-theme-on-background: #1f2329; --b3-theme-on-surface: #7d8085; --b3-border-color: #e5e7eb;
  --b3-list-hover: #eef1f6; --b3-menu-background: #fff; --b3-theme-error: #d23f31;
  --b3-dialog-shadow: 0 8px 32px rgba(31,35,41,.14), 0 2px 8px rgba(31,35,41,.08);
}
/* R433 暗色主题（对齐真实思源暗色变量） */
.b3-scope.dark {
  --b3-theme-primary: #5a8af2; --b3-theme-primary-light: #3d4a66; --b3-theme-primary-lighter: #2c3a55;
  --b3-theme-on-primary: #fff; --b3-theme-background: #1e1e1f; --b3-theme-surface: #26262a;
  --b3-theme-on-background: #dcdcdc; --b3-theme-on-surface: #8a8a93; --b3-border-color: #36363a;
  --b3-list-hover: #2c2c31; --b3-menu-background: #26262a; --b3-theme-error: #d23f31;
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
textarea.b3-text-field { min-height: 110px; resize: vertical; font-family: inherit; }
/* SiYuan 宿主工具类（真实前端全局可用，harness 需模拟以保证渲染保真） */
.fn__flex { display: flex; min-width: 0; }
.fn__flex-1 { flex: 1; min-width: 0; }
.fn__block { display: block; width: 100%; }
`;
const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>${b3Vars}</style><style>${prodCss}</style></head>
<body><div class="b3-scope light" id="stage"></div>
<script src="${path.basename(bundlePath)}"></script></body></html>`;
fs.writeFileSync(path.join(OUT, "surface-harness.html"), html);

const SURFACES = [
    ["starterHub", 720],
    ["quickEdit", 720], ["syncDiff", 820], ["csvWizard", 720], ["shareCard", 560],
    ["pinboard", 640], ["promoteClip", 480], ["sanitizer", 560], ["varForm", 560], ["guide", 640],
];

(async () => {
    const browser = await chromium.launch({channel: "chrome"});
    const page = await browser.newPage({viewport: {width: 1280, height: 900}, deviceScaleFactor: 2});
    await page.goto("file:///" + path.join(OUT, "surface-harness.html").replace(/\\/g, "/"));
    await page.waitForFunction(() => Boolean(window.XlcHarness));
    const themes = ["light", "dark"];
    for (const theme of themes) {
        for (const [name, width] of SURFACES) {
            await page.evaluate((t) => {
                document.querySelectorAll(".b3-dialog").forEach((el) => el.remove());
                const stage = document.getElementById("stage");
                stage.innerHTML = "";
                stage.className = "b3-scope " + t;
            }, theme);
            await page.evaluate((n) => window.XlcHarness.openSurface(n), name);
            await page.waitForTimeout(700);
            await page.evaluate((w) => {
                const container = document.querySelector(".b3-dialog__container");
                if (container) {
                    container.style.margin = "30px auto";
                    container.style.width = Math.min(w, 1160) + "px";
                    container.style.maxHeight = "820px";
                }
                const dialogRoot = document.querySelector(".b3-dialog");
                if (dialogRoot) document.getElementById("stage").appendChild(dialogRoot);
            }, width);
            await page.waitForTimeout(250);
            await page.screenshot({path: path.join(OUT, `surface-${name}-${theme}.png`)});
            console.log("shot:", `${name}-${theme}`);
        }
    }
    await browser.close();
    console.log("surface sweep done →", OUT);
})();
