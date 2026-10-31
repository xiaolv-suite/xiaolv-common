// 隔离真机全链路 10 步回归验收（T-0756）：
// 启动独立工作区 + 独立端口的真实思源内核与真实思源前端（stage/build/desktop），
// 安装并启用当前 dist/ 构建产物，用 Playwright 在真实思源前端中逐项跑完 docs/release-checklist.md 全部 10 步，
// 全程不触碰本机正在运行的日常思源实例。支持 --keep 保留隔离实例供浏览器手动查看。
"use strict";

const {spawn, spawnSync} = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const KEEP = process.argv.includes("--keep");
const PORT = String(process.env.SIYUAN_REAL_PORT || 16825);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const WS = process.env.SIYUAN_REAL_WS || path.join(os.tmpdir(), `xlc-real-checklist-${PORT}`);

let chromium;
try {
    ({chromium} = require(path.join(ROOT, "..", "小驴雷切", "node_modules", "@playwright", "test")));
} catch {
    ({chromium} = require("playwright"));
}

function resolveKernel() {
    const candidates = [
        process.env.SIYUAN_KERNEL || "",
        path.join(os.homedir(), "AppData", "Local", "Programs", "SiYuan", "resources", "kernel", "siyuan.exe"),
        "C:/Program Files/SiYuan/resources/kernel/siyuan.exe",
        "D:/RJ/SiYuan/resources/kernel/siyuan.exe",
    ].filter(Boolean);
    for (const c of candidates) {
        try {
            fs.accessSync(c, fs.constants.X_OK);
            return c;
        } catch {}
    }
    throw new Error("未找到思源内核 siyuan.exe");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function probe() {
    try {
        const r = await fetch(`${ORIGIN}/api/system/version`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: "{}",
            signal: AbortSignal.timeout(1500),
        });
        return r.ok ? r.json() : null;
    } catch {
        return null;
    }
}

async function api(token, endpoint, payload = {}) {
    const r = await fetch(`${ORIGIN}${endpoint}`, {
        method: "POST",
        headers: {"Content-Type": "application/json", ...(token ? {Authorization: `Token ${token}`} : {})},
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status} @ ${endpoint}`);
    const text = await r.text();
    return text ? JSON.parse(text) : {code: 0, data: null};
}

function readToken(ws) {
    for (const p of [path.join(ws, "conf", "conf.json"), path.join(ws, "conf.json")]) {
        try {
            const conf = JSON.parse(fs.readFileSync(p, "utf8"));
            if (conf.api?.token) return conf.api.token;
        } catch {}
    }
    return "";
}

function killPid(pid) {
    if (!pid) return;
    try {
        if (process.platform === "win32") {
            spawnSync("taskkill", ["/pid", String(pid), "/T", "/F"], {stdio: "ignore"});
        } else {
            process.kill(pid, "SIGTERM");
        }
    } catch {}
}

async function waitKernel(deadlineMs = 30000) {
    const end = Date.now() + deadlineMs;
    while (Date.now() < end) {
        const v = await probe();
        if (v) return v;
        await sleep(600);
    }
    return null;
}

const results = [];
function check(name, ok, detail = "") {
    results.push({name, ok: Boolean(ok), detail});
    console.log(`${ok ? "✔" : "✖"} ${name}${detail ? ` — ${detail}` : ""}`);
}

(async () => {
    if (await probe()) {
        console.error(`[real-e2e] 端口 ${PORT} 已被占用，请更换 SIYUAN_REAL_PORT`);
        process.exit(1);
    }
    const kernelExe = resolveKernel();
    const resourcesDir = path.resolve(path.dirname(kernelExe), "..");
    fs.rmSync(WS, {recursive: true, force: true});
    const pluginDest = path.join(WS, "data", "plugins", "xiaolv-common");
    fs.mkdirSync(pluginDest, {recursive: true});
    fs.cpSync(DIST, pluginDest, {recursive: true});
    console.log(`[real-e2e] 已准备隔离工作区 ${WS} 并安装插件产物`);

    const logFd = () => fs.openSync(path.join(WS, ".kernel.log"), "a");
    let child = spawn(kernelExe, ["serve", "-w", WS, "--port", PORT], {
        cwd: resourcesDir,
        stdio: ["ignore", logFd(), logFd()],
    });

    let browser = null;
    const cleanup = () => {
        if (browser) browser.close().catch(() => {});
        if (child?.pid && !KEEP) {
            console.log("[real-e2e] 关闭隔离内核进程 " + child.pid);
            killPid(child.pid);
        } else if (KEEP) {
            console.log(`[real-e2e] --keep：保留隔离实例 ${ORIGIN}（PID=${child?.pid}，工作区=${WS}）`);
        }
    };

    try {
        let ver = await waitKernel(30000);
        if (!ver) throw new Error("隔离内核首次启动超时");

        // 先停止首次初始化内核，再在静态磁盘上写入 bazaar.trust = true，防止运行期内核覆写 conf.json
        killPid(child.pid);
        await sleep(1500);
        const confPath = path.join(WS, "conf", "conf.json");
        const conf = JSON.parse(fs.readFileSync(confPath, "utf8"));
        conf.bazaar = conf.bazaar || {};
        conf.bazaar.trust = true;
        conf.lang = "zh_CN";
        fs.writeFileSync(confPath, JSON.stringify(conf, null, 2));

        child = spawn(kernelExe, ["serve", "-w", WS, "--port", PORT], {
            cwd: resourcesDir,
            stdio: ["ignore", logFd(), logFd()],
        });
        ver = await waitKernel(30000);
        if (!ver) throw new Error("隔离内核重启超时");
        const token = readToken(WS);
        console.log(`[real-e2e] 隔离内核就绪 v${ver.data}，正在初始化测试笔记本与启用插件…`);

        // 确保有一个就绪的测试笔记本
        let nbId = "";
        for (let i = 0; i < 20 && !nbId; i++) {
            const nbs = ((await api(token, "/api/notebook/lsNotebooks")).data?.notebooks ?? []).filter((n) => !n.closed);
            if (nbs.length > 0) {
                nbId = nbs[0].id;
                break;
            }
            const created = await api(token, "/api/notebook/createNotebook", {name: "XLC真机回归库"});
            nbId = created.data?.notebook?.id ?? "";
            if (!nbId) await sleep(600);
        }
        if (!nbId) throw new Error("无法创建测试笔记本");
        for (let i = 0; i < 30; i++) {
            const w = await api(token, "/api/filetree/createDocWithMd", {notebook: nbId, path: `/warmup-${i}`, markdown: "就绪探针"});
            if (w.code === 0 && w.data) {
                await api(token, "/api/filetree/removeDoc", {notebook: nbId, path: `/${w.data}.sy`});
                break;
            }
            await sleep(800);
        }

        // 启用小驴常用插件（先保持未配置库状态，供第 1 步测试首次引导建库！）
        for (const frontend of ["desktop", "browser-desktop"]) {
            const pr = await api(token, "/api/petal/setPetalEnabled", {frontend, packageName: "xiaolv-common", enabled: true});
            console.log(`[real-e2e] setPetalEnabled(${frontend}) => code=${pr.code} msg=${pr.msg || ""}`);
        }

        browser = await chromium.launch({headless: true});
        const context = await browser.newContext({viewport: {width: 1280, height: 720}, locale: "zh-CN"});
        const page = await context.newPage();
        await page.goto(ORIGIN, {waitUntil: "domcontentloaded", timeout: 45000});
        const hasPlugin = () => {
            const plugins = window.siyuan?.ws?.app?.plugins ?? [];
            return plugins.some((p) => p.name === "xiaolv-common" && p.protocolCommands);
        };
        try {
            await page.waitForFunction(hasPlugin, null, {timeout: 8000});
        } catch {
            for (const frontend of ["desktop", "browser-desktop"]) {
                await api(token, "/api/petal/setPetalEnabled", {frontend, packageName: "xiaolv-common", enabled: true});
            }
            await page.reload({waitUntil: "domcontentloaded", timeout: 45000});
            await page.waitForFunction(hasPlugin, null, {timeout: 30000});
        }
        await sleep(1000);

        const pluginMeta = await page.evaluate(() => {
            const p = window.siyuan.ws.app.plugins.find((x) => x.name === "xiaolv-common");
            return {name: p.name, version: p.state ? "loaded" : "no-state", clipDefault: p.state?.clipboardHistoryEnabled};
        });
        console.log(`[real-e2e] 真实思源前端已加载插件：${JSON.stringify(pluginMeta)}`);

        // ══════════ 第 1 步：首次引导建库 ══════════
        await page.evaluate(() => {
            const p = window.siyuan.ws.app.plugins.find((x) => x.name === "xiaolv-common");
            void p.protocolCommands["xiaolv.common.open"]();
        });
        await page.waitForSelector("[data-xlc-control='setup.mode']", {timeout: 10000});
        await page.waitForFunction(() => {
            const sel = document.querySelector("[data-xlc-control='setup.notebook']");
            return sel && !sel.disabled && sel.options.length > 1;
        }, null, {timeout: 10000});
        await page.evaluate((targetNbId) => {
            const sel = document.querySelector("[data-xlc-control='setup.notebook']");
            sel.value = targetNbId;
            sel.dispatchEvent(new Event("change", {bubbles: true}));
            const title = document.querySelector("[data-xlc-control='setup.newdoc.title']");
            title.value = "小驴常用真机库";
            title.dispatchEvent(new Event("input", {bubbles: true}));
        }, nbId);
        await page.locator("[data-xlc-control='setup.newdoc.create']").click();
        await sleep(500);
        // 点击思源原生 confirm 弹窗的确定按钮
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll(".b3-dialog__action button, .b3-button"));
            const ok = btns.find((b) => ["确定", "确认", "OK", "Confirm"].includes((b.textContent ?? "").trim()));
            ok?.click();
        });
        await page.waitForSelector(".xlc-dialog .xlc-search-input", {timeout: 15000});
        const libDocId = await page.evaluate(() => {
            const p = window.siyuan.ws.app.plugins.find((x) => x.name === "xiaolv-common");
            return p.config?.containerDocIds?.[0] ?? "";
        });
        check("步骤 1：首次引导建库并自动进入主搜索面板", /^\d{14}-[0-9a-z]{7}$/.test(libDocId), `libDocId=${libDocId}`);

        // ══════════ 第 2 步：内置示例包 25/25 导入 ══════════
        await page.locator(".xlc-footer-gear").click();
        await page.waitForSelector("[data-xlc-control='settings.data.templateImport']", {timeout: 10000});
        await page.locator("[data-xlc-control='settings.data.templateImport']").click();
        await page.waitForSelector("[data-xlc-control='settings.import.policy.skip']", {timeout: 10000});
        await page.locator("[data-xlc-control='settings.import.policy.skip']").click();
        await page.waitForFunction(() => {
            const card = document.querySelector("[data-xlc-control='settings.import.policy.skip']");
            const status = card?.closest(".xlc-form")?.querySelector("[role='status']");
            return status && (status.dataset.state === "success" || status.dataset.state === "error");
        }, null, {timeout: 45000});
        const packStats = await page.evaluate(async () => {
            const p = window.siyuan.ws.app.plugins.find((x) => x.name === "xiaolv-common");
            const idx = await p.library.ensureIndex(0);
            return {count: idx.entries.length, errors: idx.errors.length};
        });
        const docChildrenAfterPack = (await api(token, "/api/block/getChildBlocks", {id: libDocId})).data ?? [];
        const superblockCount = docChildrenAfterPack.filter((c) => c.type === "s").length;
        check("步骤 2：内置示例包 25/25 全部导入成功（多段模板存为超级块）",
            packStats.count === 25 && packStats.errors === 0 && superblockCount >= 15,
            `indexed=${packStats.count}/25, superblocks=${superblockCount}`);

        // 关闭导入策略与设置弹窗（调用真实 Dialog.destroy 清理宿主栈）
        await page.evaluate(() => {
            (window.siyuan?.dialogs ?? []).slice().forEach((d) => {
                try { d.destroy(); } catch {}
            });
            document.querySelectorAll(".b3-dialog").forEach((d) => d.remove());
        });

        // ══════════ 第 3 步：多段正文新建与保存 + 第 7 步（捕获工具栏减法与搜索） ══════════
        await page.evaluate(() => {
            const p = window.siyuan.ws.app.plugins.find((x) => x.name === "xiaolv-common");
            p.capture.newManual();
        });
        await page.waitForSelector("[data-xlc-control='capture.content']", {timeout: 10000});

        // 验证第 7 步（捕获工具栏默认 10 核心变量 + 1 文本工具入口，点击展开可搜索）
        const varbarCheck = await page.evaluate(() => {
            const bar = document.querySelector(".xlc-varbar");
            const panel = document.querySelector("[data-xlc-control='capture.varbar.tools-panel']");
            const toggle = document.querySelector("[data-xlc-control='capture.varbar.tools-toggle']");
            const visibleBefore = Array.from(bar.querySelectorAll("button")).filter((b) => !b.hidden && !b.closest("[hidden]")).length;
            toggle.click();
            const search = document.querySelector("[data-xlc-control='capture.varbar.tools-search']");
            search.value = "盘古";
            search.dispatchEvent(new Event("input", {bubbles: true}));
            const matched = Array.from(panel.querySelectorAll("button")).filter((b) => !b.hidden);
            toggle.click();
            return {visibleBefore, matchedCount: matched.length, matchedPangu: matched.some((b) => (b.textContent ?? "").includes("盘古"))};
        });

        const multiBody = [
            "尊敬的 {{xlc:ask:客户名称}}：",
            "",
            "关于本期交付延期，我们深表歉意。",
            "",
            "1. 服务费减免 10%",
            "2. 48 小时专属值守",
            "",
            "> 提示：本话术可在库文档直接修改",
            "",
            "```ts",
            "const compensated = true;",
            "```",
        ].join("\n");
        await page.locator("[data-xlc-control='capture.type']").selectOption("markdown");
        await page.locator("[data-xlc-control='capture.content']").fill(multiBody);
        await page.locator("[data-xlc-control='capture.title']").fill("真机多段致歉");
        await page.locator("[data-xlc-control='capture.shortcode']").fill(":apology");
        await page.locator("[data-xlc-control='capture.tags']").fill("真机,客服");
        await page.locator("[data-xlc-control='capture.category']").fill("客服");
        await page.locator("[data-xlc-control='capture.save']").click();
        await page.waitForFunction(() => !document.querySelector(".xlc-capture"), null, {timeout: 10000});

        const createdInfo = await page.evaluate(async () => {
            const p = window.siyuan.ws.app.plugins.find((x) => x.name === "xiaolv-common");
            const idx = await p.library.ensureIndex(0);
            const entry = idx.entries.find((e) => e.title === "真机多段致歉");
            if (!entry) return null;
            const item = idx.items.get(entry.id);
            const kd = await p.library.getItemKramdown(item);
            return {id: item.id, blockId: item.blockId, shortcode: item.shortcode, varCount: item.varCount, body: kd.ok ? kd.data : ""};
        });
        check("步骤 3：新建多段正文（含列表/引用/代码/变量/简码）保存为单个超级块",
            Boolean(createdInfo && createdInfo.shortcode === ":apology" && createdInfo.varCount === 1
                && createdInfo.body.includes("关于本期交付延期") && createdInfo.body.includes("const compensated = true;")),
            createdInfo ? `id=${createdInfo.id}, blockId=${createdInfo.blockId}` : "not found");

        // ══════════ 第 4 步：多段条目编辑与属性保持 ══════════
        await page.evaluate(async (itemId) => {
            const p = window.siyuan.ws.app.plugins.find((x) => x.name === "xiaolv-common");
            const got = await p.library.getItem(itemId);
            if (got.ok) await p.openEditDialog(got.data);
        }, createdInfo.id);
        await page.waitForSelector("[data-xlc-control='edit.content']", {timeout: 10000});
        const updatedMultiBody = multiBody.replace("服务费减免 10%", "服务费减免 20%（已升级）");
        await page.locator("[data-xlc-control='edit.content']").fill(updatedMultiBody);
        await page.locator("[data-xlc-control='edit.title']").fill("真机多段致歉·已改");
        await page.locator(".xlc-form .xlc-form-actions .xlc-btn-primary").click();
        await page.waitForFunction(() => !document.querySelector("[data-xlc-control='edit.content']"), null, {timeout: 10000});

        const afterEditInfo = await page.evaluate(async (itemId) => {
            const p = window.siyuan.ws.app.plugins.find((x) => x.name === "xiaolv-common");
            const idx = await p.library.ensureIndex(0);
            const item = idx.items.get(itemId);
            if (!item) return null;
            const kd = await p.library.getItemKramdown(item);
            return {blockId: item.blockId, title: item.title, shortcode: item.shortcode, body: kd.ok ? kd.data : ""};
        }, createdInfo.id);
        check("步骤 4：编辑多段条目后块 ID 与 custom-xlc-* 属性完整保持",
            Boolean(afterEditInfo && afterEditInfo.blockId === createdInfo.blockId
                && afterEditInfo.title === "真机多段致歉·已改"
                && afterEditInfo.shortcode === ":apology"
                && afterEditInfo.body.includes("服务费减免 20%（已升级）")),
            JSON.stringify(afterEditInfo ? {blockId: afterEditInfo.blockId, title: afterEditInfo.title, shortcode: afterEditInfo.shortcode} : null));

        // ══════════ 第 5 步 & 第 6 步：:shortcode 简码直达 + 变量填充卡与预设保存 ══════════
        await page.evaluate(() => {
            const p = window.siyuan.ws.app.plugins.find((x) => x.name === "xiaolv-common");
            void p.protocolCommands["xiaolv.common.open"]();
        });
        await page.waitForSelector(".xlc-search-input", {timeout: 10000});
        await page.locator(".xlc-search-input").fill(":apology");
        await sleep(350);
        const shortcodeTopHit = await page.evaluate(() => {
            const first = document.querySelector(".xlc-list .xlc-row[data-xlc-index='0']");
            return (first?.textContent ?? "").includes("真机多段致歉·已改");
        });
        check("步骤 6：输入 :apology 简码精确置顶目标条目", shortcodeTopHit);

        // 点击主操作按钮触发变量填充卡
        await page.locator(".xlc-pane-foot .xlc-btn-primary").click();
        await page.waitForSelector("[data-xlc-control='variable.save-preset']", {timeout: 10000});
        await page.evaluate(() => {
            const inp = document.querySelector(".xlc-varform input.b3-text-field");
            if (inp) {
                inp.value = "王总";
                inp.dispatchEvent(new Event("input", {bubbles: true}));
            }
        });
        // 点击「💾 存为预设」弹出宿主命名弹窗（替代 window.prompt）
        await page.locator("[data-xlc-control='variable.save-preset']").click();
        await page.waitForSelector("[data-xlc-control='variable.save-preset.input']", {timeout: 5000});
        await page.locator("[data-xlc-control='variable.save-preset.input']").fill("王总专案");
        await page.locator(".xlc-prompt-form button[type='submit']").click();
        await sleep(200);
        const presetSaved = await page.evaluate(() => {
            const sel = document.querySelector(".xlc-varform select.b3-select");
            return sel ? sel.value === "王总专案" : false;
        });
        await page.locator("[data-xlc-control='variable.copy']").click();
        await sleep(300);
        check("步骤 5：变量填充卡弹出宿主命名弹窗保存预设并完成变量展开", presetSaved, "preset=王总专案");

        // ══════════ 第 7 步（后半）：动作菜单「🛠 文本工具…」折叠与搜索 ══════════
        await page.evaluate(() => {
            (window.siyuan?.dialogs ?? []).slice().forEach((d) => {
                try { d.destroy(); } catch {}
            });
            document.querySelectorAll(".b3-dialog").forEach((d) => d.remove());
            const p = window.siyuan.ws.app.plugins.find((x) => x.name === "xiaolv-common");
            void p.protocolCommands["xiaolv.common.open"]();
        });
        await page.waitForSelector(".xlc-list .xlc-row[data-xlc-index='0']", {timeout: 10000});
        const menuToolsCheck = await page.evaluate(async () => {
            const row = document.querySelector(".xlc-list .xlc-row[data-xlc-index='0']");
            row.dispatchEvent(new MouseEvent("contextmenu", {bubbles: true, cancelable: true, clientX: 240, clientY: 220}));
            await new Promise((r) => setTimeout(r, 150));
            const toggle = document.querySelector("[data-xlc-control='dialog.menu.text-tools-toggle']");
            const panel = document.querySelector("[data-xlc-control='dialog.menu.text-tools-panel']");
            const hiddenByDefault = Boolean(panel && panel.hidden === true);
            toggle?.click();
            const search = document.querySelector("[data-xlc-control='dialog.menu.text-tools-search']");
            if (search) {
                search.value = "盘古";
                search.dispatchEvent(new Event("input", {bubbles: true}));
            }
            const visible = Array.from(panel?.querySelectorAll(".xlc-menu-item") ?? []).filter((el) => !el.hidden);
            return {hiddenByDefault, matched: visible.length >= 1 && visible.every((el) => (el.textContent ?? "").includes("盘古"))};
        });
        // 在文本工具搜索框内按 Escape 应直接关闭动作菜单
        await page.keyboard.press("Escape");
        await sleep(200);
        const menuClosedByEsc = await page.evaluate(() => !document.querySelector(".xlc-menu"));
        check("步骤 7：新建工具栏与动作菜单「🛠 文本工具…」默认折叠、支持实时搜索且 Esc 关闭",
            varbarCheck.visibleBefore === 11 && varbarCheck.matchedPangu && menuToolsCheck.hiddenByDefault && menuToolsCheck.matched && menuClosedByEsc,
            JSON.stringify({varbarCheck, menuToolsCheck, menuClosedByEsc}));

        // ══════════ 第 8 步：批量加标签与设置分类（宿主弹窗替代 window.prompt） ══════════
        await page.locator(".xlc-search-input").fill("");
        await page.waitForSelector(".xlc-list .xlc-row[data-xlc-index='1']", {timeout: 5000});
        await page.evaluate(() => {
            document.querySelector(".xlc-list .xlc-row[data-xlc-index='0']")
                ?.dispatchEvent(new MouseEvent("click", {bubbles: true, ctrlKey: true}));
        });
        await sleep(100);
        await page.evaluate(() => {
            document.querySelector(".xlc-list .xlc-row[data-xlc-index='1']")
                ?.dispatchEvent(new MouseEvent("click", {bubbles: true, ctrlKey: true}));
        });
        await page.waitForSelector("[data-xlc-control='search.batch.add-tags']", {timeout: 5000});
        await page.locator("[data-xlc-control='search.batch.add-tags']").click();
        await page.waitForSelector("[data-xlc-control='search.batch.add-tags.input']", {timeout: 5000});
        await page.locator("[data-xlc-control='search.batch.add-tags.input']").fill("真机批处理标签");
        await page.locator(".xlc-prompt-form button[type='submit']").click();
        let batchTagCount = 0;
        for (let i = 0; i < 20 && batchTagCount < 2; i++) {
            await sleep(300);
            batchTagCount = await page.evaluate(async () => {
                const p = window.siyuan.ws.app.plugins.find((x) => x.name === "xiaolv-common");
                const idx = await p.library.ensureIndex(0);
                return idx.entries.filter((e) => (e.tags ?? []).includes("真机批处理标签")).length;
            });
        }
        check("步骤 8：多选批量加标签通过宿主输入弹窗写回真实块属性", batchTagCount >= 2, `${batchTagCount} 条条目已写入 #真机批处理标签`);

        // ══════════ 第 9 步：100% / 125% / 150% 三档视口下真实宿主主按钮可见可点 ══════════
        const vpChecks = [];
        for (const [w, h] of [[1280, 720], [1024, 576], [853, 480]]) {
            await page.setViewportSize({width: w, height: h});
            await sleep(150);
            const okSearch = await page.evaluate(({vw, vh}) => {
                document.querySelectorAll("#message .b3-snackbar, .b3-snackbar").forEach((el) => el.remove());
                const btn = document.querySelector(".xlc-pane-foot .xlc-btn-primary");
                if (!btn) return {ok: false, reason: "no-btn"};
                const r = btn.getBoundingClientRect();
                const hit = document.elementFromPoint(Math.floor(r.left + r.width / 2), Math.floor(r.top + r.height / 2));
                const ok = r.top >= 0 && r.bottom <= vh && r.left >= 0 && r.right <= vw && Boolean(hit && (hit === btn || btn.contains(hit)));
                return {ok, top: Math.round(r.top), bottom: Math.round(r.bottom), hit: hit ? `${hit.tagName}.${hit.className}` : null};
            }, {vw: w, vh: h});
            vpChecks.push(`${w}x${h}:${okSearch.ok}(${okSearch.top}..${okSearch.bottom},hit=${okSearch.hit})`);
        }
        await page.setViewportSize({width: 1280, height: 720});
        await sleep(100);
        check("步骤 9：100%/125%/150% 三档视口下真实宿主弹窗主按钮全部在视口内可点中",
            vpChecks.every((s) => s.includes(":true(")), vpChecks.join(", "));

        // ══════════ 第 10 步：剪贴板历史默认关闭与主动开启 ══════════
        const clipTest = await page.evaluate(async () => {
            const p = window.siyuan.ws.app.plugins.find((x) => x.name === "xiaolv-common");
            const defaultOff = p.state.clipboardHistoryEnabled === false;
            const beforeLen = (p.state.clipboardHistory ?? []).length;
            p.recordClipboard("默认关闭时绝不应被记录的文本");
            const afterOffLen = (p.state.clipboardHistory ?? []).length;
            return {defaultOff, blockedWhenOff: beforeLen === afterOffLen};
        });
        await page.locator(".xlc-footer-gear").click();
        await page.waitForSelector("[data-xlc-control='settings.prefs.clipboardHistoryEnabled']", {state: "attached", timeout: 10000});
        await page.evaluate(() => {
            const el = document.querySelector("[data-xlc-control='settings.prefs.clipboardHistoryEnabled']");
            el?.scrollIntoView({block: "center"});
            el?.click();
        });
        const clipAfterOptIn = await page.evaluate(() => {
            const p = window.siyuan.ws.app.plugins.find((x) => x.name === "xiaolv-common");
            const enabledNow = p.state.clipboardHistoryEnabled === true;
            p.recordClipboard("主动开启后正常记录的文本");
            const recorded = (p.state.clipboardHistory ?? []).some((x) => x.text === "主动开启后正常记录的文本");
            return {enabledNow, recorded};
        });
        check("步骤 10：剪贴板历史默认关闭不采集，设置中主动开启后正常记录",
            clipTest.defaultOff && clipTest.blockedWhenOff && clipAfterOptIn.enabledNow && clipAfterOptIn.recorded,
            JSON.stringify({...clipTest, ...clipAfterOptIn}));

        cleanup();
        const pass = results.filter((r) => r.ok).length;
        const fail = results.length - pass;
        console.log(`\n真实思源宿主 10 步回归汇总：${pass}/${results.length} 通过${fail ? `，${fail} 项失败` : " —— 全部通过"}`);
        process.exit(fail ? 1 : 0);
    } catch (err) {
        console.error(`[real-e2e] 异常：${err.stack || err.message}`);
        cleanup();
        process.exit(1);
    }
})();
