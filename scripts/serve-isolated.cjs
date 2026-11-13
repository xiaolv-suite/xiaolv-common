/**
 * 隔离环境独立网页服务脚本 (Isolated Live Web Environment)
 *
 * 专门用于为用户拉起一个完全隔离的、带完整图形界面的真实思源桌面网页端：
 * 1. 默认独立工作区位于 D:\思源插件配套\测试工作区\小驴常用-isolated-preview，零占用 C 盘空间；
 * 2. 挂载真实思源内核与思源官方桌面 Web 前端 (http://127.0.0.1:43920/stage/build/desktop/)；
 * 3. 自动同步安装最新 dist/ 构建产物（小驴常用），开启集市信任与插件挂载；
 * 4. 自动预置测试笔记本、体验文档与常用库，开箱即用无需重复引导；
 * 5. 以 Windows 后台独立进程守护运行（关闭终端不丢失，支持随时刷新浏览器）；
 * 6. 支持 node scripts/serve-isolated.cjs --stop 一键优雅退出清理。
 */
"use strict";

const {spawn, spawnSync, execSync} = require("node:child_process");
const fs = require("node:fs");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const PLUGIN_ID = "xiaolv-common";
const HOST = "127.0.0.1";
// 专属独立测试端口：43925（避开日常思源 6806、小驴管家 43919、小驴人脉 43920、小驴考试 43921 与小驴拾遗 46919）
const PREFERRED_PORT = 43925;
const FORBIDDEN_PORTS = new Set([6806, 14680, 43919, 43920, 43921, 43929, 46919]);
const INSTANCE_RECORD = path.join(ROOT, "scripts", ".last-live-instance.json");

function resolveWorkspace() {
    if (process.env.SIYUAN_LIVE_WS) return path.resolve(process.env.SIYUAN_LIVE_WS);
    // 默认测试数据与源码分开存放；其他环境沿用仓库旁目录与临时目录回退。
    if (process.platform === "win32" && fs.existsSync("D:\\")) {
        return path.join("D:\\思源插件配套", "测试工作区", "小驴常用-isolated-preview");
    }
    const parentDir = path.dirname(ROOT);
    const dPreview = path.join(parentDir, "小驴常用-isolated-preview");
    if (fs.existsSync(parentDir)) {
        return dPreview;
    }
    const dTemp = "D:\\Temp";
    if (fs.existsSync(dTemp) || fs.existsSync("D:\\")) {
        return path.join(dTemp, "xiaolv-common-live-workspace");
    }
    return path.join(os.tmpdir(), "xiaolv-common-live-workspace");
}
const WORKSPACE = resolveWorkspace();

const args = process.argv.slice(2);
const IS_STOP = args.includes("--stop");
const IS_RESTART = args.includes("--restart");
const IS_FRESH = args.includes("--fresh");

function checkPortFree(port) {
    return new Promise((resolve) => {
        const srv = net.createServer();
        srv.once("error", () => resolve(false));
        srv.listen({host: HOST, port, exclusive: true}, () => srv.close(() => resolve(true)));
    });
}

async function findAvailablePort(startPort = PREFERRED_PORT) {
    if (!FORBIDDEN_PORTS.has(startPort) && (await checkPortFree(startPort))) return startPort;
    for (let p = startPort + 1; p < startPort + 50; p++) {
        if (FORBIDDEN_PORTS.has(p)) continue;
        if (await checkPortFree(p)) return p;
    }
    throw new Error("未找到可用的回环测试端口");
}

function resolveKernel() {
    const candidates = [
        process.env.SIYUAN_KERNEL,
        "D:\\RJ\\SiYuan\\resources\\kernel\\SiYuan-Kernel.exe",
        "D:\\RJ\\SiYuan\\resources\\kernel\\siyuan.exe",
        path.join(process.env.ProgramFiles || "C:\\Program Files", "SiYuan", "resources", "kernel", "SiYuan-Kernel.exe"),
        path.join(os.homedir(), "AppData", "Local", "Programs", "SiYuan", "resources", "kernel", "SiYuan-Kernel.exe"),
    ].filter(Boolean);
    const kernel = candidates.find((c) => fs.existsSync(c));
    if (!kernel) throw new Error("未找到 SiYuan-Kernel.exe，可通过环境变量 SIYUAN_KERNEL 指定");
    const appDir = path.resolve(path.dirname(kernel), "..");
    return {kernel, appDir};
}

async function probe(url) {
    try {
        const r = await fetch(`${url}/api/system/version`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: "{}",
            signal: AbortSignal.timeout(1500),
        });
        return r.ok ? await r.json() : null;
    } catch {
        return null;
    }
}

function killPid(pid) {
    if (!pid) return;
    try {
        if (process.platform === "win32") {
            spawnSync("cmd.exe", ["/c", `taskkill /pid ${pid} /T /F`], {stdio: "ignore"});
        } else {
            process.kill(pid, "SIGTERM");
        }
    } catch {}
}

async function stopLiveInstance() {
    let stopped = false;
    if (fs.existsSync(INSTANCE_RECORD)) {
        try {
            const info = JSON.parse(fs.readFileSync(INSTANCE_RECORD, "utf8"));
            if (info?.pid) {
                console.log(`[serve-isolated] 正在停止后台隔离内核（PID=${info.pid}，端口=${info.port}）…`);
                try {
                    await fetch(`http://${HOST}:${info.port}/api/system/exit`, {
                        method: "POST",
                        headers: {"Content-Type": "application/json", ...(info.token ? {Authorization: `Token ${info.token}`} : {})},
                        body: JSON.stringify({force: true}),
                        signal: AbortSignal.timeout(2000),
                    });
                } catch {}
                killPid(info.pid);
                stopped = true;
            }
        } catch {}
        try { fs.unlinkSync(INSTANCE_RECORD); } catch {}
    }
    if (stopped) {
        console.log("✔ 已成功停止隔离网页测试服务！");
    } else {
        console.log("ℹ 未发现运行中的隔离测试实例。");
    }
}

function copyDistToWorkspace(workspace) {
    if (!fs.existsSync(path.join(DIST, "index.js"))) {
        console.log("[serve-isolated] 正在构建最新插件产物 dist/…");
        execSync("pnpm run build", {cwd: ROOT, stdio: "inherit"});
    }
    const pluginDst = path.join(workspace, "data", "plugins", PLUGIN_ID);
    fs.mkdirSync(pluginDst, {recursive: true});
    fs.cpSync(DIST, pluginDst, {recursive: true});
}

function writePetalsConfig(workspace) {
    const petalsPath = path.join(workspace, "data", "storage", "petal", "petals.json");
    fs.mkdirSync(path.dirname(petalsPath), {recursive: true});
    const petals = [
        {
            name: PLUGIN_ID,
            displayName: "小驴常用",
            version: "0.10.80",
            enabled: true,
            incompatible: false,
            disabledInPublish: true,
            userDisabledInPublish: false,
            disallowInstall: false,
            js: "",
            css: "",
            i18n: null,
            kernel: {js: "", existed: true, incompatible: false},
        },
    ];
    fs.writeFileSync(petalsPath, JSON.stringify(petals, null, 2), "utf8");
}

function readWorkspaceToken(workspace) {
    try {
        const conf = JSON.parse(fs.readFileSync(path.join(workspace, "conf", "conf.json"), "utf8"));
        return conf?.api?.token || "";
    } catch {
        return "";
    }
}

async function api(base, token, route, body = {}) {
    const res = await fetch(`${base}${route}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? {Authorization: `Token ${token}`} : {}),
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
    });
    return res.json();
}

async function main() {
    if (IS_STOP) {
        await stopLiveInstance();
        return;
    }

    if (!IS_RESTART && fs.existsSync(INSTANCE_RECORD)) {
        try {
            const info = JSON.parse(fs.readFileSync(INSTANCE_RECORD, "utf8"));
            const alive = await probe(`http://${HOST}:${info.port}`);
            if (alive) {
                console.log("\n======================================================================");
                console.log(" 🐴 小驴常用 · 隔离环境独立网页服务已在后台运行中：");
                console.log(` 🌐 浏览器直达链接: ${info.url}`);
                console.log(` 📡 隔离内核地址:   http://${HOST}:${info.port}`);
                console.log(` 📂 隔离工作区:     ${info.workspace}`);
                console.log(` 🛑 停止服务命令:   pnpm run serve:isolated --stop`);
                console.log("======================================================================\n");
                return;
            }
        } catch {}
    }

    if (IS_RESTART) {
        await stopLiveInstance();
    }

    const {kernel, appDir} = resolveKernel();
    const port = await findAvailablePort(PREFERRED_PORT);
    const base = `http://${HOST}:${port}`;
    const appUrl = `${base}/stage/build/desktop/`;

    if (IS_FRESH && fs.existsSync(WORKSPACE)) {
        try { fs.rmSync(WORKSPACE, {recursive: true, force: true}); } catch {}
    }
    fs.mkdirSync(WORKSPACE, {recursive: true});

    // 预写入 conf.json（保证初次冷启动即信任集市插件）
    const confPath = path.join(WORKSPACE, "conf", "conf.json");
    let conf = {};
    if (fs.existsSync(confPath)) {
        try { conf = JSON.parse(fs.readFileSync(confPath, "utf8")); } catch {}
    }
    conf.bazaar = conf.bazaar || {};
    conf.bazaar.trust = true;
    conf.bazaar.petal = true;
    conf.lang = "zh_CN";
    fs.mkdirSync(path.dirname(confPath), {recursive: true});
    fs.writeFileSync(confPath, JSON.stringify(conf, null, 2), "utf8");

    copyDistToWorkspace(WORKSPACE);
    writePetalsConfig(WORKSPACE);

    console.log(`[serve-isolated] 准备启动独立思源实例（端口=${port}，工作区=${WORKSPACE}）…`);

    const logPath = path.join(WORKSPACE, "kernel.log");
    const logFd = fs.openSync(logPath, "a");

    const child = spawn(
        kernel,
        ["serve", "--workspace", WORKSPACE, "--wd", appDir, "--port", String(port), "--lang", "zh-CN"],
        {
            stdio: ["ignore", logFd, logFd],
            detached: true,
            windowsHide: true,
        }
    );
    child.unref();
    const pid = child.pid;

    let isReady = false;
    for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 600));
        if (await probe(base)) { isReady = true; break; }
    }
    if (!isReady) {
        if (pid) killPid(pid);
        throw new Error(`隔离思源内核启动超时 (${base})，请查看日志：${logPath}`);
    }

    const token = readWorkspaceToken(WORKSPACE);
    // 确保插件已在桌面端与桌面浏览器前端挂载
    for (const frontend of ["desktop", "browser-desktop"]) {
        try {
            await api(base, token, "/api/petal/setPetalEnabled", {frontend, packageName: PLUGIN_ID, enabled: true});
        } catch {}
    }

    // 预置笔记本与开箱即用的测试文档及常用语库
    let nbId = "";
    try {
        const nbs = ((await api(base, token, "/api/notebook/lsNotebooks")).data?.notebooks ?? []);
        const opened = nbs.filter((n) => !n.closed);
        if (opened.length > 0) {
            nbId = opened[0].id;
        } else if (nbs.length > 0) {
            nbId = nbs[0].id;
            await api(base, token, "/api/notebook/openNotebook", {notebook: nbId});
        } else {
            const nbCreated = await api(base, token, "/api/notebook/createNotebook", {name: "小驴常用体验空间"});
            nbId = nbCreated.data?.notebook?.id ?? "";
            if (nbId) {
                await api(base, token, "/api/notebook/openNotebook", {notebook: nbId});
            }
        }
    } catch {}

    if (nbId) {
        // 创建 /体验与测试笔记.sy
        let sampleDocId = "";
        try {
            const docRes = await api(base, token, "/api/filetree/createDocWithMd", {
                notebook: nbId,
                path: "/体验与测试笔记",
                markdown: `# 体验与测试笔记\n\n欢迎在独立浏览器环境中测试「小驴常用」插件！\n\n在当前行输入 \`/常用\`、\`/cy\` 或 \`/新建常用\` 可就地唤起内联斜杠菜单；或按 **⌥⇧C (Alt+Shift+C)** 唤起常用搜索面板。\n\n也可以划选上面文字、或右键点击任意段落块标测试存入小驴常用。`,
            });
            sampleDocId = docRes.data || "";
        } catch {}

        // 创建 /常用内容库.sy 并导入预设条目
        let libDocId = "";
        try {
            const libRes = await api(base, token, "/api/filetree/createDocWithMd", {
                notebook: nbId,
                path: "/常用内容库",
                markdown: `# 常用内容库\n\n此文档是小驴常用条目的本体承载文档。在思源中直接修改此处的块，插件会实时双向同步。`,
            });
            libDocId = libRes.data || "";
        } catch {}

        if (libDocId) {
            // 初始化插件配置，直接绑定常用内容库
            const cfgDir = path.join(WORKSPACE, "data", "storage", "petal", "xiaolv-common");
            fs.mkdirSync(cfgDir, {recursive: true});
            const cfg = {
                configVersion: 1,
                mode: "doc",
                notebookIds: [],
                containerDocIds: [libDocId],
                createdDocIds: [libDocId],
                configuredAt: Date.now(),
            };
            fs.writeFileSync(path.join(cfgDir, "config.json"), JSON.stringify(cfg, null, 2), "utf8");

            // 预写入 3 条典型模板（致歉信/变量展开、SQL查询代码块、常用收件地址）
            try {
                // 1. 带变量的超级块致歉信
                const apologyMd = `{{{row\n尊敬的{{xlc:ask:王总:客户名称}}：\n\n非常抱歉，由于近期系统机房升级，您反馈的问题预计将于{{xlc:ask:明天下午:预计解决时间}}恢复正常。\n\n感谢您的理解与支持！\n}}}`;
                const appendRes = await api(base, token, "/api/block/appendBlock", {
                    parentID: libDocId,
                    dataType: "markdown",
                    data: apologyMd,
                });
                const apId = appendRes?.data?.[0]?.doOperations?.[0]?.id;
                if (apId) {
                    await api(base, token, "/api/attr/setBlockAttrs", {
                        id: apId,
                        attrs: {
                            "custom-xlc-id": "xlc-livedemo0001",
                            "custom-xlc-type": "structure",
                            "custom-xlc-title": "客户故障致歉与预计恢复说明",
                            "custom-xlc-shortcode": ":apology",
                            "custom-xlc-tags": "客服,致歉,高频",
                            "custom-xlc-category": "客服回复",
                            "custom-xlc-vars": "2",
                            "custom-xlc-created": String(Date.now()),
                            "custom-xlc-updated": String(Date.now()),
                        },
                    });
                }

                // 2. SQL 查询代码块
                const sqlMd = "```sql\nSELECT id, name, created_at\nFROM users\nWHERE status = 'active'\nORDER BY created_at DESC\nLIMIT 20;\n```";
                const appendSql = await api(base, token, "/api/block/appendBlock", {
                    parentID: libDocId,
                    dataType: "markdown",
                    data: sqlMd,
                });
                const sqlId = appendSql?.data?.[0]?.doOperations?.[0]?.id;
                if (sqlId) {
                    await api(base, token, "/api/attr/setBlockAttrs", {
                        id: sqlId,
                        attrs: {
                            "custom-xlc-id": "xlc-livedemo0002",
                            "custom-xlc-type": "code",
                            "custom-xlc-title": "活跃用户分页查询 SQL",
                            "custom-xlc-tags": "开发,SQL,数据库",
                            "custom-xlc-category": "开发模板",
                            "custom-xlc-created": String(Date.now()),
                            "custom-xlc-updated": String(Date.now()),
                        },
                    });
                }

                // 3. 常用收件地址文本（带思源原生 #标签#）
                const addrMd = "北京市海淀区中关村南大街 1 号创新大厦 8 层行政部 #快递# #常用地址#";
                const appendAddr = await api(base, token, "/api/block/appendBlock", {
                    parentID: libDocId,
                    dataType: "markdown",
                    data: addrMd,
                });
                const addrId = appendAddr?.data?.[0]?.doOperations?.[0]?.id;
                if (addrId) {
                    await api(base, token, "/api/attr/setBlockAttrs", {
                        id: addrId,
                        attrs: {
                            "custom-xlc-id": "xlc-livedemo0003",
                            "custom-xlc-type": "text",
                            "custom-xlc-title": "北京总部收件地址",
                            "custom-xlc-tags": "快递,常用地址",
                            "custom-xlc-category": "个人日常",
                            "custom-xlc-created": String(Date.now()),
                            "custom-xlc-updated": String(Date.now()),
                        },
                    });
                }

                // 4. 常用手机号（@注解剥离示范）
                const phone1Res = await api(base, token, "/api/block/appendBlock", {
                    parentID: libDocId,
                    dataType: "markdown",
                    data: "18588888888@手机号",
                });
                const phone1Id = phone1Res?.data?.[0]?.doOperations?.[0]?.id;
                if (phone1Id) {
                    await api(base, token, "/api/attr/setBlockAttrs", {
                        id: phone1Id,
                        attrs: {
                            "custom-xlc-id": "xlc-livedemophone01",
                            "custom-xlc-type": "text",
                            "custom-xlc-title": "常用主手机号",
                            "custom-xlc-tags": "手机号,联系电话",
                            "custom-xlc-category": "联系方式",
                            "custom-xlc-created": String(Date.now()),
                            "custom-xlc-updated": String(Date.now()),
                        },
                    });
                }

                // 5. 备用手机号
                const phone2Res = await api(base, token, "/api/block/appendBlock", {
                    parentID: libDocId,
                    dataType: "markdown",
                    data: "13800138000 @备用手机",
                });
                const phone2Id = phone2Res?.data?.[0]?.doOperations?.[0]?.id;
                if (phone2Id) {
                    await api(base, token, "/api/attr/setBlockAttrs", {
                        id: phone2Id,
                        attrs: {
                            "custom-xlc-id": "xlc-livedemophone02",
                            "custom-xlc-type": "text",
                            "custom-xlc-title": "备用手机号",
                            "custom-xlc-tags": "备用手机,电话",
                            "custom-xlc-category": "联系方式",
                            "custom-xlc-created": String(Date.now()),
                            "custom-xlc-updated": String(Date.now()),
                        },
                    });
                }

                // 6. 官方客服邮箱
                const email1Res = await api(base, token, "/api/block/appendBlock", {
                    parentID: libDocId,
                    dataType: "markdown",
                    data: "service@xiaolv.com @客服工作邮箱",
                });
                const email1Id = email1Res?.data?.[0]?.doOperations?.[0]?.id;
                if (email1Id) {
                    await api(base, token, "/api/attr/setBlockAttrs", {
                        id: email1Id,
                        attrs: {
                            "custom-xlc-id": "xlc-livedemoemail01",
                            "custom-xlc-type": "text",
                            "custom-xlc-title": "官方客服邮箱",
                            "custom-xlc-tags": "客服邮箱,工作邮箱",
                            "custom-xlc-category": "邮箱",
                            "custom-xlc-created": String(Date.now()),
                            "custom-xlc-updated": String(Date.now()),
                        },
                    });
                }

                // 7. 个人工作对接邮箱
                const email2Res = await api(base, token, "/api/block/appendBlock", {
                    parentID: libDocId,
                    dataType: "markdown",
                    data: "contact@domain.com @工作邮箱",
                });
                const email2Id = email2Res?.data?.[0]?.doOperations?.[0]?.id;
                if (email2Id) {
                    await api(base, token, "/api/attr/setBlockAttrs", {
                        id: email2Id,
                        attrs: {
                            "custom-xlc-id": "xlc-livedemoemail02",
                            "custom-xlc-type": "text",
                            "custom-xlc-title": "个人工作对接邮箱",
                            "custom-xlc-tags": "工作邮箱,商务对接",
                            "custom-xlc-category": "邮箱",
                            "custom-xlc-created": String(Date.now()),
                            "custom-xlc-updated": String(Date.now()),
                        },
                    });
                }

                // 8. 公司发票税号
                const taxRes = await api(base, token, "/api/block/appendBlock", {
                    parentID: libDocId,
                    dataType: "markdown",
                    data: "[公司税号] 91110108MA00000000",
                });
                const taxId = taxRes?.data?.[0]?.doOperations?.[0]?.id;
                if (taxId) {
                    await api(base, token, "/api/attr/setBlockAttrs", {
                        id: taxId,
                        attrs: {
                            "custom-xlc-id": "xlc-livedemotax001",
                            "custom-xlc-type": "text",
                            "custom-xlc-title": "企业统一社会信用代码（税号）",
                            "custom-xlc-tags": "公司税号,发票,财务",
                            "custom-xlc-category": "财务",
                            "custom-xlc-created": String(Date.now()),
                            "custom-xlc-updated": String(Date.now()),
                        },
                    });
                }
            } catch {}
        }
    }

    const record = {
        pid,
        port,
        url: appUrl,
        base,
        workspace: WORKSPACE,
        token,
        startedAt: new Date().toISOString(),
    };
    fs.writeFileSync(INSTANCE_RECORD, JSON.stringify(record, null, 2), "utf8");

    console.log("\n======================================================================");
    console.log(" 🎉 小驴常用 · 隔离环境独立网页服务已成功拉起并在后台保持运行！");
    console.log("----------------------------------------------------------------------");
    console.log(` 🌐 浏览器直达网页: ${appUrl}`);
    console.log(` 📡 隔离内核地址:   ${base}`);
    console.log(` 📂 独立工作区:     ${WORKSPACE}`);
    console.log(` 🔑 API 访问令牌:   ${token}`);
    console.log(` ⚙️ 守护进程 PID:   ${pid}`);
    console.log("----------------------------------------------------------------------");
    console.log(" 💡 使用指南：");
    console.log("  1. 复制上方【浏览器直达网页】在 Chrome / Edge / 内置浏览器直接打开；");
    console.log("  2. 已自动预置「体验与测试笔记」与已初始化的「常用内容库」；");
    console.log("  3. 在笔记正文中输入 /常用 或按 Alt+Shift+C 即可随心测试；");
    console.log("  4. 随时可以根据网页上的实际体验告诉 AI 哪里需要修改；");
    console.log("  5. 需要停止时在终端执行：pnpm run serve:isolated --stop");
    console.log("======================================================================\n");
}

main().catch((err) => {
    console.error(`[serve-isolated] 启动失败：${err.stack || err.message}`);
    process.exit(1);
});
