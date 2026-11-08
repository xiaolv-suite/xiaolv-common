// R422 负向验证驱动器：单进程内完成 注入违规 → 重建测试 bundle → 跑 r422 → 恢复源码。
// 每个违规必须看到目标用例真的失败（exitCode/失败名双重确认），恢复后复验全绿。
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const {execFileSync} = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const TEST = path.join(ROOT, "tests", "r422-ui-defect-fixes.test.cjs");

const esbuild = require(path.join(ROOT, "node_modules", "esbuild"));
function rebuild() {
    esbuild.buildSync({
        entryPoints: [path.join(ROOT, "tests", "entry.ts")],
        outfile: path.join(ROOT, "tests", ".build", "entry.cjs"),
        bundle: true,
        format: "cjs",
        platform: "node",
        target: "node18",
        logLevel: "warning",
        alias: {siyuan: path.join(ROOT, "tests", "stub-siyuan.cjs")},
    });
}

function runTest() {
    try {
        execFileSync(process.execPath, ["--test", TEST], {cwd: ROOT, stdio: ["ignore", "pipe", "pipe"]});
        return {ok: true, out: ""};
    } catch (err) {
        return {ok: false, out: String(err.stdout ?? "")};
    }
}

const violations = [
    {
        id: "V1 host-class",
        file: "src/ui/starter-packs-dialog.ts",
        inject: (src) => src.replace('?.classList.add("xlc-dialog-host");', ""),
        expectFail: "R422-1",
    },
    {
        id: "V2 solo-width",
        file: "src/styles/index.scss",
        inject: (src) => src.replace(/flex: 1 1 auto;\r?\n      width: 100%;/, "flex: 0 0 46%;\n      width: 46%;"),
        expectFail: "R422-2",
    },
    {
        id: "V3 ghost-filter",
        file: "src/model/usage-insights.ts",
        inject: (src) => src.replace("return topItems.filter((item) => knownIds.has(item.id));", "return [...topItems];"),
        expectFail: "R422-4",
    },
    {
        id: "V4 sticky-padding",
        file: "src/styles/index.scss",
        inject: (src) => src.replace(/\.b3-dialog__container\.xlc-form-host\.xlc-settings-root-host \.b3-dialog__body,\r?\n\.b3-dialog__container:has\(> \.b3-dialog__body > \.xlc-settings\) \.b3-dialog__body \{\r?\n  padding-top: 0;\r?\n\}/, ".b3-dialog__container.xlc-form-host.xlc-settings-root-host .b3-dialog__body {\n  padding-top: var(--xlc-space-5);\n}"),
        expectFail: "R422-3",
    },
    {
        id: "V5 heatmap-wording",
        file: "src/ui/settings-dialog.ts",
        inject: (src) => src.replace("（窗口内 ${heatmap.totalCalls30Days} 次", "（累计 ${heatmap.totalCalls30Days} 次"),
        expectFail: "R522-wording",
    },
];

let allGood = true;
for (const v of violations) {
    const abs = path.join(ROOT, v.file);
    const original = fs.readFileSync(abs, "utf8");
    const expectKey = v.expectFail.startsWith("R52") ? "R422-5" : v.expectFail;
    const injected = v.inject(original);
    if (injected === original) {
        console.log(`✗ ${v.id}: 注入未生效（模式未匹配）`);
        allGood = false;
        continue;
    }
    fs.writeFileSync(abs, injected);
    rebuild();
    const res = runTest();
    const failed = !res.ok && res.out.includes(expectKey);
    fs.writeFileSync(abs, original);
    rebuild();
    const restored = runTest();
    if (failed && restored.ok) {
        console.log(`✓ ${v.id}: 注入后 ${expectKey} 确认失败，恢复后复验全绿`);
    } else {
        console.log(`✗ ${v.id}: failed=${failed} restoredOk=${restored.ok}`);
        allGood = false;
    }
}
process.exit(allGood ? 0 : 1);
