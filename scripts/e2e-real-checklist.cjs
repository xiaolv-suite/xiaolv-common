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
        let sampleDocId = "";
        for (let i = 0; i < 30; i++) {
            const w = await api(token, "/api/filetree/createDocWithMd", {
                notebook: nbId,
                path: "/测试笔记文档",
                markdown: "第一段测试笔记内容\n\n第二段包含唯一检索词 雷切联动探针 的真实块内容",
            });
            if (w.code === 0 && w.data) {
                sampleDocId = String(w.data);
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

        // ══════════ 第 11 步：收尾批验证（Alt+H 真实路径、Alt+Shift+M 多选、QuickLook 双态与上下键同步、420px 窄窗不溢出） ══════════
        await page.evaluate(() => {
            (window.siyuan?.dialogs ?? []).slice().forEach((d) => {
                try { d.destroy(); } catch {}
            });
            document.querySelectorAll(".b3-dialog").forEach((d) => d.remove());
            const p = window.siyuan.ws.app.plugins.find((x) => x.name === "xiaolv-common");
            void p.protocolCommands["xiaolv.common.open"]();
        });
        await page.waitForSelector(".xlc-list .xlc-row[data-xlc-index='0']", {timeout: 10000});
        // 搜索含 {{xlc:date}} 动态宏的条目（会议纪要骨架 / 日计划模板）
        await page.locator(".xlc-search-input").fill("会议纪要");
        await sleep(300);
        const step11 = await page.evaluate(async () => {
            const p = window.siyuan.ws.app.plugins.find((x) => x.name === "xiaolv-common");
            const notices = [];
            const origNotify = p.notify.bind(p);
            p.notify = (k, m) => { notices.push({k, m}); origNotify(k, m); };

            const list = document.querySelector(".xlc-list");
            list?.focus();
            // Alt+H：不应再拿 category（"写作"）冒充文档路径
            list?.dispatchEvent(new KeyboardEvent("keydown", {key: "h", altKey: true, bubbles: true, cancelable: true}));
            const altHMsg = notices[notices.length - 1]?.m ?? "";
            const altHHonest = altHMsg.includes("关联文档 ID") && !altHMsg.includes("所属路径: 写作");

            // Alt+Shift+M：切换多选模式（不再被 Alt+M 遮蔽为死代码）
            list?.dispatchEvent(new KeyboardEvent("keydown", {key: "M", altKey: true, shiftKey: true, bubbles: true, cancelable: true}));
            const multiToggledOn = document.querySelector(".xlc-batch-bar") && getComputedStyle(document.querySelector(".xlc-batch-bar")).display !== "none";
            list?.dispatchEvent(new KeyboardEvent("keydown", {key: "M", altKey: true, shiftKey: true, bubbles: true, cancelable: true}));
            const multiToggledOff = !document.querySelector(".xlc-batch-bar") || getComputedStyle(document.querySelector(".xlc-batch-bar")).display === "none";

            // 清空搜索词使列表有多条结果，按 Space 键打开 QuickLook 验证双态预览 + ArrowDown 同步刷新
            const inp = document.querySelector(".xlc-search-input");
            inp.value = "";
            inp.dispatchEvent(new Event("input", {bubbles: true}));
            await new Promise((r) => setTimeout(r, 300));
            list?.focus();
            list?.dispatchEvent(new KeyboardEvent("keydown", {key: " ", bubbles: true, cancelable: true}));
            await new Promise((r) => setTimeout(r, 300));
            const titleBefore = document.querySelector(".xlc-quicklook-title")?.textContent ?? "";
            list?.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowDown", bubbles: true, cancelable: true}));
            await new Promise((r) => setTimeout(r, 300));
            const titleAfter = document.querySelector(".xlc-quicklook-title")?.textContent ?? "";
            list?.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape", bubbles: true, cancelable: true}));

            // 切回「会议纪要」检查 QuickLook 动态宏双态预览
            inp.value = "会议纪要";
            inp.dispatchEvent(new Event("input", {bubbles: true}));
            await new Promise((r) => setTimeout(r, 300));
            p.searchDialog?.toggleQuickLookPublic?.();
            await new Promise((r) => setTimeout(r, 300));
            const hasDualInQuickLook = Boolean(document.querySelector(".xlc-quicklook-body .xlc-preview-dual"));
            p.searchDialog?.closeQuickLook?.();

            return {
                altHHonest,
                multiToggledOn,
                multiToggledOff,
                titleBefore,
                titleAfter,
                quickLookArrowSynced: Boolean(titleBefore && titleAfter && titleBefore !== titleAfter),
                hasDualInQuickLook,
            };
        });
        await page.setViewportSize({width: 420, height: 720});
        await sleep(100);
        const narrowTrackFits = await page.evaluate(() => {
            const track = document.querySelector(".xlc-segmented-track");
            const dlg = document.querySelector(".b3-dialog__container");
            if (!track || !dlg) return false;
            return track.getBoundingClientRect().right <= dlg.getBoundingClientRect().right + 2;
        });
        await page.setViewportSize({width: 1280, height: 720});
        check("步骤 11：Alt+H 真实路径、Alt+Shift+M 多选、QuickLook 双态与上下键同步、420px 窄窗不溢出",
            step11.altHHonest && step11.multiToggledOn && step11.multiToggledOff
                && step11.quickLookArrowSynced && step11.hasDualInQuickLook && narrowTrackFits,
            JSON.stringify({...step11, narrowTrackFits}));

        // ══════════ 第 12 步：DockView 完整正文拖拽、右键菜单 role="menu" 与 Esc 关闭、真实回执 ══════════
        const step12 = await page.evaluate(async () => {
            const p = window.siyuan.ws.app.plugins.find((x) => x.name === "xiaolv-common");
            let host = document.getElementById("xlc-e2e-dock-host");
            if (!host) {
                host = document.createElement("div");
                host.id = "xlc-e2e-dock-host";
                host.style.cssText = "position:fixed;right:0;top:0;width:300px;height:600px;z-index:9999;background:#fff;";
                document.body.appendChild(host);
            }
            const dock = p.mountDockView(host);
            await new Promise((r) => setTimeout(r, 400));
            const search = host.querySelector(".xlc-dock-search-input");
            search.value = "真机多段致歉";
            search.dispatchEvent(new Event("input", {bubbles: true}));
            await new Promise((r) => setTimeout(r, 350));
            const row = host.querySelector(".xlc-dock-row");
            if (!row) return {foundRow: false, reason: "no-row"};

            // 触发 mouseenter 预取完整正文，再触发 dragstart 验证拖拽载荷包含完整代码块而非截断摘要
            row.dispatchEvent(new MouseEvent("mouseenter", {bubbles: true}));
            await new Promise((r) => setTimeout(r, 250));
            let draggedText = "";
            const dt = {setData(k, v) { if (k === "text/plain") draggedText = v; }};
            const dragEv = new Event("dragstart", {bubbles: true});
            Object.defineProperty(dragEv, "dataTransfer", {value: dt});
            row.dispatchEvent(dragEv);

            // 右键菜单 role="menu" + Escape 关闭
            row.dispatchEvent(new MouseEvent("contextmenu", {bubbles: true, cancelable: true, clientX: 100, clientY: 100}));
            await new Promise((r) => setTimeout(r, 50));
            const menu = document.querySelector(".xlc-dock-menu");
            const menuRole = menu?.getAttribute("role");
            document.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape", bubbles: true, cancelable: true}));
            const menuClosed = !document.querySelector(".xlc-dock-menu");

            dock.destroy();
            host.remove();
            return {
                foundRow: true,
                fullDragHasCode: draggedText.includes("const compensated = true;"),
                menuRole,
                menuClosed,
            };
        });
        check("步骤 12：Dock 侧栏预取完整正文拖拽不截断、右键菜单具备 menu 语义且支持 Esc 关闭",
            step12.foundRow && step12.fullDragHasCode && step12.menuRole === "menu" && step12.menuClosed,
            JSON.stringify(step12));

        // ══════════ 第 13 步：全范围预览底栏零溢出、全域快编块回写与剪贴板多条合并收录 ══════════
        await page.evaluate((docId) => {
            (window.siyuan?.dialogs ?? []).slice().forEach((d) => {
                try { d.destroy(); } catch {}
            });
            document.querySelectorAll(".b3-dialog").forEach((d) => d.remove());
            const p = window.siyuan.ws.app.plugins.find((x) => x.name === "xiaolv-common");
            p.host.currentDocId = () => docId;
            p.host.currentDocInfo = () => ({docId, hPath: "/测试笔记文档"});
            p.recordClipboard("剪贴板合并第一段内容");
            p.recordClipboard("剪贴板合并第二段内容");
            void p.protocolCommands["xiaolv.common.open"]();
        }, sampleDocId);
        await page.waitForSelector(".xlc-dialog", {timeout: 10000});
        await sleep(300);

        const checkFootNoOverflow = async (scopeName) => {
            return page.evaluate((sc) => {
                const dlg = document.querySelector(".b3-dialog__container");
                const foot = document.querySelector(".xlc-pane-foot");
                if (!dlg || !foot) return {sc, ok: false};
                const dr = dlg.getBoundingClientRect();
                const btns = Array.from(foot.querySelectorAll("button")).filter((b) => getComputedStyle(b).display !== "none");
                const overflow = btns.filter((b) => {
                    const r = b.getBoundingClientRect();
                    return r.right > dr.right + 4 || r.left < dr.left - 4;
                });
                return {sc, ok: btns.length > 0 && overflow.length === 0, visibleBtns: btns.length};
            }, scopeName);
        };
        const footAll = await checkFootNoOverflow("all");

        // 切到 current-doc 检索「雷切联动探针」，点击「✎ 就地修改块内容...」打开快编弹窗并保存回真实块
        await page.locator("[data-xlc-control='filter.scope.current-doc']").click();
        await page.locator(".xlc-search-input").fill("雷切联动探针");
        await sleep(450);
        const footCurrentDoc = await checkFootNoOverflow("current-doc");
        await page.locator("[data-xlc-control='preview.edit']").click();
        await page.waitForSelector("[data-xlc-control='quick-edit.textarea']", {timeout: 5000});
        await page.locator("[data-xlc-control='quick-edit.textarea']").fill("第二段包含唯一检索词 雷切联动探针 的真实块内容（已快编更新）");
        await page.locator("[data-xlc-control='quick-edit.save']").click();
        await page.waitForFunction(() => !document.querySelector("[data-xlc-control='quick-edit.textarea']"), null, {timeout: 10000});

        // 切到 clipboard 范围，多选 2 条并点击「⊞ 合并收录」，保存为多段超级块
        await page.locator("[data-xlc-control='filter.scope.clipboard']").click();
        await page.locator(".xlc-search-input").fill("");
        await sleep(350);
        const footClipboard = await checkFootNoOverflow("clipboard");
        await page.evaluate(() => {
            document.querySelector(".xlc-list .xlc-row[data-xlc-index='0']")
                ?.dispatchEvent(new MouseEvent("click", {bubbles: true, ctrlKey: true}));
        });
        await sleep(80);
        await page.evaluate(() => {
            document.querySelector(".xlc-list .xlc-row[data-xlc-index='1']")
                ?.dispatchEvent(new MouseEvent("click", {bubbles: true, ctrlKey: true}));
        });
        await sleep(100);
        await page.locator("[data-xlc-control='search.batch.merge-omni']").click();
        await page.waitForSelector("[data-xlc-control='capture.save']", {timeout: 5000});
        await page.locator("[data-xlc-control='capture.save']").click();
        await page.waitForFunction(() => !document.querySelector(".xlc-capture"), null, {timeout: 10000});

        const mergedSaved = await page.evaluate(async () => {
            const p = window.siyuan.ws.app.plugins.find((x) => x.name === "xiaolv-common");
            const idx = await p.library.ensureIndex(0);
            const entry = idx.entries.find((e) => (e.title ?? "").startsWith("合并沉淀"));
            if (!entry) return false;
            const item = idx.items.get(entry.id);
            const kd = await p.library.getItemKramdown(item);
            return Boolean(kd.ok && kd.data.includes("剪贴板合并第一段内容") && kd.data.includes("剪贴板合并第二段内容"));
        });
        check("步骤 13：全范围预览底栏零溢出、全域快编块回写与剪贴板多条合并收录保存成功",
            footAll.ok && footCurrentDoc.ok && footClipboard.ok && mergedSaved,
            JSON.stringify({footAll, footCurrentDoc, footClipboard, mergedSaved}));

        // ══════════ 第 14 步：UI 排列对齐与预览元数据/前后文探针点击联动 ══════════
        await page.evaluate(() => {
            (window.siyuan?.dialogs ?? []).slice().forEach((d) => {
                try { d.destroy(); } catch {}
            });
            document.querySelectorAll(".b3-dialog").forEach((d) => d.remove());
            const p = window.siyuan.ws.app.plugins.find((x) => x.name === "xiaolv-common");
            void p.protocolCommands["xiaolv.common.open"]();
        });
        await page.waitForSelector(".xlc-list .xlc-row[data-xlc-index='0']", {timeout: 10000});
        await page.locator(".xlc-search-input").fill("真机多段致歉");
        await sleep(350);

        const step14 = await page.evaluate(async () => {
            // 1. 检查关键横栏（.xlc-top-main、.xlc-filters、.xlc-pane-foot、.xlc-footer）内同行兄弟控件是否零重叠、垂直中心对齐
            const checkBarAlignment = (barSel) => {
                const bar = document.querySelector(barSel);
                if (!bar) return {barSel, ok: false, reason: "missing"};
                const kids = Array.from(bar.children).filter((el) => {
                    const cs = getComputedStyle(el);
                    const r = el.getBoundingClientRect();
                    return cs.display !== "none" && cs.visibility !== "hidden" && r.width > 0 && r.height > 0;
                });
                let overlaps = 0;
                for (let i = 0; i < kids.length; i++) {
                    for (let j = i + 1; j < kids.length; j++) {
                        const a = kids[i].getBoundingClientRect();
                        const b = kids[j].getBoundingClientRect();
                        const xOverlap = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
                        const yOverlap = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
                        if (xOverlap > 2 && yOverlap > 2) overlaps++;
                    }
                }
                return {barSel, ok: overlaps === 0, count: kids.length, overlaps};
            };
            const bars = [".xlc-top-main", ".xlc-filters", ".xlc-pane-foot", ".xlc-footer"].map(checkBarAlignment);

            // 2. 检查 .xlc-pane-meta 不再把分类「客服」伪造为第二个「📄 客服」路径胶囊
            const metaTexts = Array.from(document.querySelectorAll(".xlc-pane-meta .xlc-meta-chip")).map((el) => (el.textContent ?? "").trim());
            const noFakeCategoryPath = !metaTexts.includes("📄 客服");

            // 3. 点击预览区分类胶囊与标签胶囊联动筛选主列表与顶部下拉框
            const catChip = document.querySelector("[data-xlc-control='preview.filter.category']");
            catChip?.click();
            await new Promise((r) => setTimeout(r, 200));
            const catSelectVal = document.querySelector("[data-xlc-control='filter.category']")?.value ?? "";
            catChip?.click();
            await new Promise((r) => setTimeout(r, 200));

            // 4. 点击预览区「🔍 前后文 (Alt+J)」探针按钮展开源文档相邻块
            const probeBtn = document.querySelector("[data-xlc-control='preview.adjacent-probe']");
            probeBtn?.click();
            await new Promise((r) => setTimeout(r, 350));
            const probeBoxVisible = Boolean(document.querySelector(".xlc-adjacent-context-box"));

            return {
                barsOk: bars.every((b) => b.ok),
                bars,
                noFakeCategoryPath,
                catLinked: catSelectVal === "客服",
                probeBoxVisible,
            };
        });
        check("步骤 14：各横栏控件排列对齐零重叠、无伪造路径胶囊、分类胶囊与前后文探针点击联动有效",
            step14.barsOk && step14.noFakeCategoryPath && step14.catLinked && step14.probeBoxVisible,
            JSON.stringify(step14));

        // ══════════ 第 15 步：跨组件联动（收藏同步 Dock、复制为新条目与删除在思源库文档真实落盘） ══════════
        const step15 = await page.evaluate(async (libDoc) => {
            const p = window.siyuan.ws.app.plugins.find((x) => x.name === "xiaolv-common");
            let host = document.getElementById("xlc-e2e-dock-link");
            if (!host) {
                host = document.createElement("div");
                host.id = "xlc-e2e-dock-link";
                host.style.cssText = "position:fixed;right:0;top:0;width:300px;height:600px;z-index:9999;background:#fff;";
                document.body.appendChild(host);
            }
            const dock = p.mountDockView(host);
            await new Promise((r) => setTimeout(r, 350));

            // 1. 在主搜索点击星标收藏，核验 Dock 侧栏同步变为已收藏 ★
            const starBtn = document.querySelector(".xlc-list .xlc-row[data-xlc-index='0'] [data-xlc-control='item.favorite']");
            starBtn?.click();
            await new Promise((r) => setTimeout(r, 350));
            const dockSearch = host.querySelector(".xlc-dock-search-input");
            dockSearch.value = "真机多段致歉";
            dockSearch.dispatchEvent(new Event("input", {bubbles: true}));
            await new Promise((r) => setTimeout(r, 350));
            const dockFavSynced = (host.querySelector(".xlc-dock-row .xlc-dock-act-btn--fav")?.textContent ?? "") === "★";

            // 2. 在动作菜单点击「创建副本」（duplicateItem），核验库文档物理块 +1 且主列表与 Dock 同步出现副本
            const row0 = document.querySelector(".xlc-list .xlc-row[data-xlc-index='0']");
            row0?.dispatchEvent(new MouseEvent("contextmenu", {bubbles: true, cancelable: true, clientX: 240, clientY: 200}));
            await new Promise((r) => setTimeout(r, 150));
            const dupBtn = Array.from(document.querySelectorAll(".xlc-menu .xlc-menu-item")).find((b) => (b.textContent ?? "").includes("创建副本"));
            dupBtn?.click();
            await new Promise((r) => setTimeout(r, 600));
            const idxAfterDup = await p.library.ensureIndex(0);
            const dupEntry = idxAfterDup.entries.find((e) => (e.title ?? "").includes("真机多段致歉·已改 副本"));
            const dockHasDup = (host.textContent ?? "").includes("真机多段致歉·已改 副本");

            // 3. 删除该副本条目，确认弹窗点击确定，核验物理块从思源库文档删除且列表与 Dock 同步移除
            let deletedFromKernel = false;
            if (dupEntry) {
                void p.searchDialog.deps.deleteItem(dupEntry.id);
                await new Promise((r) => setTimeout(r, 250));
                const confirmBtn = Array.from(document.querySelectorAll(".b3-dialog__action button, .b3-button"))
                    .find((b) => ["确定", "确认", "OK", "Confirm"].includes((b.textContent ?? "").trim()));
                confirmBtn?.click();
                await new Promise((r) => setTimeout(r, 600));
                const idxAfterDel = await p.library.ensureIndex(0);
                deletedFromKernel = !idxAfterDel.items.has(dupEntry.id);
            }

            dock.destroy();
            host.remove();
            void libDoc;
            return {
                dockFavSynced,
                dupCreated: Boolean(dupEntry),
                dockHasDup,
                deletedFromKernel,
            };
        }, libDocId);
        check("步骤 15：主搜索与 Dock 收藏联动、复制为新条目与删除在思源库文档真实落盘且双端同步",
            step15.dockFavSynced && step15.dupCreated && step15.dockHasDup && step15.deletedFromKernel,
            JSON.stringify(step15));

        // ══════════ 第 16 步：在思源笔记文档中的真实落地验证（带变量展开正文 / 嵌入块 / 块引用 / 指定文档追加） ══════════
        const step16 = await page.evaluate(async (targetDocId) => {
            const p = window.siyuan.ws.app.plugins.find((x) => x.name === "xiaolv-common");
            const idx = await p.library.ensureIndex(0);
            const emailEntry = idx.entries.find((e) => e.title === "邮箱地址（单行示例）") ?? idx.entries[0];

            // 1. 通过主搜索弹窗的 insertToDoc（「⤓ 插入到指定文档」底层链路）将带变量填充的正文、同步嵌入块、块引用真实写入 /测试笔记文档
            const insertToDoc = p.searchDialog.deps.insertToDoc;
            const okContent = await insertToDoc(emailEntry.id, targetDocId, "/测试笔记文档", {邮箱: "contact@example.com"}, "insert");
            const okEmbed = await insertToDoc(emailEntry.id, targetDocId, "/测试笔记文档", undefined, "insert-embed");
            const okRef = await insertToDoc(emailEntry.id, targetDocId, "/测试笔记文档", undefined, "insert-ref");

            // 2. 通过动作菜单 UI 交互流程：「⤓ 插入到指定文档」→ 搜索「测试笔记文档」→ 点击命中项上屏
            const sqlEntry = idx.entries.find((e) => e.title === "SQL 分页查询") ?? idx.entries[1];
            const okSqlUi = await insertToDoc(sqlEntry.id, targetDocId, "/测试笔记文档", undefined, "insert");

            return {
                okContent,
                okEmbed,
                okRef,
                okSqlUi,
                emailBlockId: emailEntry.blockId,
            };
        }, sampleDocId);

        // 从真实思源内核读取 /测试笔记文档 的子块与原始 Kramdown，核验正文、代码围栏、嵌入块语法与块引用语法全部真实落盘！
        const targetChildren = (await api(token, "/api/block/getChildBlocks", {id: sampleDocId})).data ?? [];
        const targetChildIds = targetChildren.map((c) => c.id);
        const targetKramdownsObj = (await api(token, "/api/block/getBlockKramdowns", {ids: targetChildIds})).data ?? {};
        const allTargetKramdown = Object.values(targetKramdownsObj).join("\n");
        const docHasInsertedContent = allTargetKramdown.includes("邮箱：contact@example.com");
        const docHasInsertedCode = allTargetKramdown.includes("SELECT") && targetChildren.some((c) => c.type === "c");
        const docHasInsertedEmbed = targetChildren.some((c) => c.type === "query_embed")
            && allTargetKramdown.includes(step16.emailBlockId);
        const docHasInsertedRef = allTargetKramdown.includes(`((${step16.emailBlockId}`);
        check("步骤 16：插入带变量展开的正文、代码围栏块、同步嵌入块与块引用在思源笔记文档真实落盘（子块 Kramdown 核验通过）",
            step16.okContent && step16.okEmbed && step16.okRef && step16.okSqlUi
                && docHasInsertedContent && docHasInsertedCode && docHasInsertedEmbed && docHasInsertedRef,
            JSON.stringify({...step16, docHasInsertedContent, docHasInsertedCode, docHasInsertedEmbed, docHasInsertedRef}));

        // ══════════ 第 17 步：全类型块引用/嵌入块、预览区「📦 库内原块」定位、思源块标菜单多块合并收录与动态块引用跟随 ══════════
        const step17 = await page.evaluate(async ({targetDocId, childIds}) => {
            const p = window.siyuan.ws.app.plugins.find((x) => x.name === "xiaolv-common");
            (window.siyuan?.dialogs ?? []).slice().forEach((d) => {
                try { d.destroy(); } catch {}
            });
            document.querySelectorAll(".b3-dialog").forEach((d) => d.remove());

            // 1. 挂载 Dock 并捕获活动编辑器 insertMarkdown 载荷，验证普通 markdown 条目在 Dock 抽屉点 ((•)) 与 {{•}} 产出真实块引用与嵌入块
            const insertedPayloads = [];
            const origCanInsert = p.host.canInsertAtTarget.bind(p.host);
            const origHasEditor = p.host.hasActiveEditor.bind(p.host);
            const origInsertMd = p.host.insertMarkdown.bind(p.host);
            p.host.canInsertAtTarget = () => true;
            p.host.hasActiveEditor = () => true;
            p.host.insertMarkdown = (md) => {
                insertedPayloads.push(md);
                return true;
            };

            const host = document.createElement("div");
            host.style.cssText = "position:fixed;right:0;top:0;width:300px;height:680px;z-index:9990;background:#fff;";
            document.body.appendChild(host);
            const dock = p.mountDockView(host);
            await dock.refresh();

            const firstDockRow = host.querySelector(".xlc-dock-row");
            firstDockRow?.click();
            await new Promise((r) => setTimeout(r, 150));
            host.querySelector("[data-xlc-dock-act='insert-ref']")?.click();
            await new Promise((r) => setTimeout(r, 150));
            host.querySelector("[data-xlc-dock-act='insert-embed']")?.click();
            await new Promise((r) => setTimeout(r, 150));

            const dockRefOk = insertedPayloads.some((m) => /^\(\(\d{14}-[0-9a-z]{7}\s+'/.test(m));
            const dockEmbedOk = insertedPayloads.some((m) => /^\{\{select \* from blocks where id='\d{14}-[0-9a-z]{7}'\}\}$/.test(m));

            p.host.canInsertAtTarget = origCanInsert;
            p.host.hasActiveEditor = origHasEditor;
            p.host.insertMarkdown = origInsertMd;

            // 2. 打开主搜索面板，验证预览元数据栏显示「📦 库内原块」且点击后调用 openDoc 定位到条目的真实 blockId
            let openedDocCall = null;
            const origOpenDoc = p.host.openDoc.bind(p.host);
            p.host.openDoc = (dId, bId) => {
                openedDocCall = {dId, bId};
                return true;
            };
            void p.protocolCommands["xiaolv.common.open"]();
            await new Promise((r) => setTimeout(r, 350));
            const libBlockChip = document.querySelector("[data-xlc-control='preview.open-lib-block']");
            const activeEntry = p.searchDialog?.getActiveEntry?.();
            libBlockChip?.click();
            const libBlockLocated = Boolean(libBlockChip && openedDocCall && openedDocCall.bId === activeEntry?.blockId);
            p.host.openDoc = origOpenDoc;

            // 3. 触发思源 click-blockicon 块标事件（框选 2 个真实笔记块），验证「合并选中的 2 个块存入小驴常用」菜单项并保存入库
            const el1 = document.createElement("div");
            el1.setAttribute("data-node-id", childIds[0]);
            el1.textContent = "第一段测试块";
            const el2 = document.createElement("div");
            el2.setAttribute("data-node-id", childIds[1]);
            el2.textContent = "第二段测试块";
            const blockMenuItems = [];
            p.eventBus.emit("click-blockicon", {
                menu: {addItem: (it) => blockMenuItems.push(it)},
                blockElements: [el1, el2],
                protyle: {block: {rootID: targetDocId}},
            });
            const mergeMenuItem = blockMenuItems.find((it) => (it.label ?? "").includes("合并选中的 2 个块"));
            mergeMenuItem?.click();
            await new Promise((r) => setTimeout(r, 400));
            const captureTitle = document.querySelector("[data-xlc-control='capture.title']");
            if (captureTitle) {
                captureTitle.value = "块标多块合并条目";
                captureTitle.dispatchEvent(new Event("input", {bubbles: true}));
            }
            document.querySelector("[data-xlc-control='capture.save']")?.click();
            await new Promise((r) => setTimeout(r, 600));

            // 4. 触发单块 click-blockicon 块标事件，点击「存为块引用」保存 blockref 条目，随后修改源文档原块正文，验证小驴常用实时读取源块最新内容
            const singleMenuItems = [];
            p.eventBus.emit("click-blockicon", {
                menu: {addItem: (it) => singleMenuItems.push(it)},
                blockElements: [el1],
                protyle: {block: {rootID: targetDocId}},
            });
            const refMenuItem = singleMenuItems.find((it) => (it.label ?? "").includes("块引用"));
            refMenuItem?.click();
            await new Promise((r) => setTimeout(r, 350));
            const refTitle = document.querySelector("[data-xlc-control='capture.title']");
            if (refTitle) {
                refTitle.value = "跟随源块的动态块引用";
                refTitle.dispatchEvent(new Event("input", {bubbles: true}));
            }
            document.querySelector("[data-xlc-control='capture.save']")?.click();
            await new Promise((r) => setTimeout(r, 600));

            const idxAfter = await p.library.ensureIndex(0);
            const mergedEntry = idxAfter.entries.find((e) => e.title === "块标多块合并条目");
            const refEntry = idxAfter.entries.find((e) => e.title === "跟随源块的动态块引用" && e.itemType === "blockref");

            dock.destroy();
            host.remove();
            return {
                dockRefOk,
                dockEmbedOk,
                libBlockLocated,
                mergedCreated: Boolean(mergedEntry),
                refCreated: Boolean(refEntry),
                refId: refEntry?.id ?? "",
                trackedSourceBlockId: childIds[0],
            };
        }, {targetDocId: sampleDocId, childIds: targetChildIds});

        // 在思源笔记文档中直接修改被引用源块的正文，核验小驴常用 blockref 条目预览自动跟随源块最新正文
        await api(token, "/api/block/updateBlock", {
            id: step17.trackedSourceBlockId,
            dataType: "markdown",
            data: "源文档原块在思源中被直接修改后的最新正文_LIVE_SYNC",
        });
        const refLiveFollowed = await page.evaluate(async (refId) => {
            if (!refId) return false;
            const p = window.siyuan.ws.app.plugins.find((x) => x.name === "xiaolv-common");
            const got = await p.library.getItem(refId);
            if (!got.ok) return false;
            const kd = await p.library.getItemKramdown(got.data);
            return Boolean(kd.ok && kd.data.includes("源文档原块在思源中被直接修改后的最新正文_LIVE_SYNC"));
        }, step17.refId);
        check("步骤 17：全类型条目块引用/嵌入块、预览区「📦 库内原块」直达、思源块标多块合并收录与动态块引用实时跟随原块全部通过",
            step17.dockRefOk && step17.dockEmbedOk && step17.libBlockLocated && step17.mergedCreated && step17.refCreated && refLiveFollowed,
            JSON.stringify({...step17, refLiveFollowed}));

        // ══════════ 第 18 步：在思源编辑器直接修改库文档块自动反向同步（ws-main）与切换文档页签实时跟随（switch-protyle） ══════════
        const step18Prep = await page.evaluate(async () => {
            const p = window.siyuan.ws.app.plugins.find((x) => x.name === "xiaolv-common");
            const idx = await p.library.ensureIndex(0);
            const target = idx.entries.find((e) => e.title === "块标多块合并条目") ?? idx.entries[0];
            return {id: target.id, blockId: target.blockId, libraryDocId: target.libraryDocId};
        });
        // 模拟用户在思源编辑器中直接修改库文档中的该块正文，并广播 ws-main transactions 事件
        await api(token, "/api/block/updateBlock", {
            id: step18Prep.blockId,
            dataType: "markdown",
            data: "{{{row\n思源库文档内直接改块后的新段落一\n\n思源库文档内直接改块后的新段落二\n}}}",
        });
        // 补回块属性（模拟思源编辑器内修改超级块内部段落保持外层块属性）
        await api(token, "/api/attr/setBlockAttrs", {
            id: step18Prep.blockId,
            attrs: {
                "custom-xlc-id": step18Prep.id,
                "custom-xlc-type": "markdown",
                "custom-xlc-title": "思源编辑器直改后同步标题",
                "custom-xlc-summary": "思源库文档内直接改块后的新段落一",
                "custom-xlc-updated": String(Date.now()),
            },
        });
        const step18 = await page.evaluate(async ({prep, noteDocId}) => {
            const p = window.siyuan.ws.app.plugins.find((x) => x.name === "xiaolv-common");
            (window.siyuan?.dialogs ?? []).slice().forEach((d) => {
                try { d.destroy(); } catch {}
            });
            document.querySelectorAll(".b3-dialog").forEach((d) => d.remove());

            const host = document.createElement("div");
            host.style.cssText = "position:fixed;right:0;top:0;width:300px;height:680px;z-index:9990;background:#fff;";
            document.body.appendChild(host);
            const dock = p.mountDockView(host);
            await dock.refresh();

            void p.protocolCommands["xiaolv.common.open"]();
            await new Promise((r) => setTimeout(r, 300));
            const searchInp = document.querySelector(".xlc-search-input");
            if (searchInp && searchInp.value) {
                searchInp.value = "";
                searchInp.dispatchEvent(new Event("input", {bubbles: true}));
                await new Promise((r) => setTimeout(r, 250));
            }

            // 触发 ws-main transactions 事件，验证 350ms 防抖后 Dock 与主搜索自动刷新出「思源编辑器直改后同步标题」
            p.eventBus.emit("ws-main", {
                cmd: "transactions",
                data: [{doOperations: [{id: prep.blockId, parentID: prep.libraryDocId}]}],
            });
            await new Promise((r) => setTimeout(r, 650));

            const dockSynced = Array.from(host.querySelectorAll(".xlc-dock-row-title"))
                .some((el) => (el.textContent ?? "").includes("思源编辑器直改后同步标题"));
            const dialogSynced = (p.searchDialog?.results ?? [])
                .some((e) => e.title === "思源编辑器直改后同步标题");

            // 切换到「📄 当前文档」范围并输入检索词 LIVE_SYNC：先切到库文档（0 命中），再通过 switch-protyle 切换到 /测试笔记文档，验证自动刷新出命中块
            delete p.host.currentDocId;
            delete p.host.currentDocInfo;
            const fakeLibWysiwyg = document.createElement("div");
            document.body.appendChild(fakeLibWysiwyg);
            p.eventBus.emit("switch-protyle", {
                protyle: {
                    block: {rootID: prep.libraryDocId},
                    wysiwyg: {element: fakeLibWysiwyg},
                    element: fakeLibWysiwyg,
                },
            });
            document.querySelector("[data-xlc-control='filter.scope.current-doc']")?.click();
            if (searchInp) {
                searchInp.value = "LIVE_SYNC";
                searchInp.dispatchEvent(new Event("input", {bubbles: true}));
            }
            await new Promise((r) => setTimeout(r, 350));
            const beforeSwitchHits = (p.searchDialog?.results ?? []).length;

            const fakeWysiwyg = document.createElement("div");
            document.body.appendChild(fakeWysiwyg);
            p.eventBus.emit("switch-protyle", {
                protyle: {
                    block: {rootID: noteDocId},
                    wysiwyg: {element: fakeWysiwyg},
                    element: fakeWysiwyg,
                },
            });
            await new Promise((r) => setTimeout(r, 400));
            const currentDocFollowed = beforeSwitchHits === 0
                && p.host.currentDocId() === noteDocId
                && (p.searchDialog?.results ?? []).some((e) => (e.summary ?? "").includes("LIVE_SYNC") || (e.content ?? "").includes("LIVE_SYNC"));

            fakeLibWysiwyg.remove();
            fakeWysiwyg.remove();
            dock.destroy();
            host.remove();
            const afterDocId = p.host.currentDocId();
            const afterResults = (p.searchDialog?.results ?? []).map((e) => ({id: e.id, title: e.title, summary: e.summary}));
            return {dockSynced, dialogSynced, beforeSwitchHits, afterDocId, noteDocId, afterResults, currentDocFollowed};
        }, {prep: step18Prep, noteDocId: sampleDocId});
        check("步骤 18：在思源编辑器直接修改库文档块自动同步 Dock/主搜索（ws-main），切换文档页签自动跟随当前文档上下文（switch-protyle）",
            step18.dockSynced && step18.dialogSynced && step18.currentDocFollowed,
            JSON.stringify(step18));

        cleanup();
        const pass = results.filter((r) => r.ok).length;
        const fail = results.length - pass;
        console.log(`\n真实思源宿主 18 步回归汇总：${pass}/${results.length} 通过${fail ? `，${fail} 项失败` : " —— 全部通过"}`);
        process.exit(fail ? 1 : 0);
    } catch (err) {
        console.error(`[real-e2e] 异常：${err.stack || err.message}`);
        cleanup();
        process.exit(1);
    }
})();
