// UI 契约静态门禁（T-0753）：
// 1. zh-CN.json 与 en.json 键集合与 %s 占位符数量完全一致；
// 2. src/**/*.ts 中所有 t("key", ...) 调用的键必须存在于语言包，且实参个数与 %s 数量一致；
// 3. 禁止使用 Electron 不支持或阻塞宿主的 window.prompt / window.alert；
// 4. 禁止在 innerHTML 模板字符串中直接拼接未经转义的插值表达式。
"use strict";

const fs = require("fs");
const path = require("path");

function walkTs(dir) {
    let out = [];
    for (const ent of fs.readdirSync(dir, {withFileTypes: true})) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) {
            if (ent.name === "libs") continue; // 外部快门同步的生态标准库不属于本插件私有 UI
            out.push(...walkTs(p));
        } else if (ent.name.endsWith(".ts")) out.push(p);
    }
    return out;
}

function stripComments(source) {
    // 保留换行符以维持行号，把注释内容替换为空格
    return source
        .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
        .replace(/\/\/[^\n]*/g, "");
}

function isSafeInnerHtmlExpr(expr) {
    const trimmed = expr.trim();
    if (/^(?:escapeHtml|escapeDockHtml)\s*\(/.test(trimmed)) return true;
    if (/^safe[A-Z]\w*$/.test(trimmed)) return true;
    if (/\.length$/.test(trimmed)) return true;
    if (/^[A-Za-z0-9_$.]+\s*\?\s*(["'])(?:[^"'\\]|\\.)*\1\s*:\s*(["'])(?:[^"'\\]|\\.)*\2$/.test(trimmed)) return true;
    return false;
}

function scanUiContracts(options = {}) {
    const root = options.root || path.resolve(__dirname, "..");
    const zhPath = options.zhPath || path.join(root, "src", "i18n", "zh-CN.json");
    const enPath = options.enPath || path.join(root, "src", "i18n", "en.json");
    const srcDir = options.srcDir || path.join(root, "src");

    const zh = JSON.parse(fs.readFileSync(zhPath, "utf8"));
    const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
    const violations = [];

    const zhKeys = new Set(Object.keys(zh));
    const enKeys = new Set(Object.keys(en));
    for (const k of zhKeys) {
        if (!enKeys.has(k)) violations.push({kind: "i18n-missing-en", key: k, message: `en.json 缺少语言键 "${k}"`});
    }
    for (const k of enKeys) {
        if (!zhKeys.has(k)) violations.push({kind: "i18n-missing-zh", key: k, message: `zh-CN.json 缺少语言键 "${k}"`});
    }
    for (const k of zhKeys) {
        if (!enKeys.has(k)) continue;
        const zc = (String(zh[k]).match(/%s/g) || []).length;
        const ec = (String(en[k]).match(/%s/g) || []).length;
        if (zc !== ec) {
            violations.push({
                kind: "i18n-placeholder-locale-mismatch",
                key: k,
                message: `语言键 "${k}" 的 %s 占位符数量不一致：zh-CN=${zc}, en=${ec}`,
            });
        }
    }

    const files = options.files || walkTs(srcDir);
    for (const f of files) {
        const raw = fs.readFileSync(f, "utf8");
        const clean = stripComments(raw);
        const rel = path.relative(root, f).replace(/\\/g, "/");

        // 1) t("key", ...) 调用与 %s 参数个数检查
        const tRe = /(?:^|[^\w$])(?:this\.deps\.t|deps\.t|ctx\.t|this\.t|t)\(\s*(["'])([A-Za-z0-9_.-]+)\1\s*([,)])/g;
        let m;
        while ((m = tRe.exec(clean))) {
            const key = m[2];
            const sep = m[3];
            const line = clean.slice(0, m.index).split("\n").length;
            if (!(key in zh)) {
                violations.push({
                    kind: "missing-i18n-key",
                    file: rel,
                    line,
                    key,
                    message: `${rel}:${line} 调用了不存在的语言键 "${key}"`,
                });
                continue;
            }
            const expected = (String(zh[key]).match(/%s/g) || []).length;
            let argCount = 0;
            if (sep === ",") {
                let idx = tRe.lastIndex;
                let depth = 1;
                let inStr = null;
                let cur = "";
                const args = [];
                while (idx < clean.length && depth > 0) {
                    const ch = clean[idx++];
                    if (inStr) {
                        cur += ch;
                        if (ch === "\\") {
                            if (idx < clean.length) cur += clean[idx++];
                            continue;
                        }
                        if (ch === inStr) inStr = null;
                        continue;
                    }
                    if (ch === '"' || ch === "'" || ch === "`") {
                        inStr = ch;
                        cur += ch;
                        continue;
                    }
                    if (ch === "(" || ch === "[" || ch === "{") depth++;
                    else if (ch === ")" || ch === "]" || ch === "}") {
                        depth--;
                        if (depth === 0) {
                            if (cur.trim()) args.push(cur.trim());
                            break;
                        }
                    } else if (ch === "," && depth === 1) {
                        args.push(cur.trim());
                        cur = "";
                        continue;
                    }
                    cur += ch;
                }
                argCount = args.length;
            }
            if (expected !== argCount) {
                violations.push({
                    kind: "i18n-arg-count-mismatch",
                    file: rel,
                    line,
                    key,
                    message: `${rel}:${line} 语言键 "${key}" 需要 ${expected} 个 %s 参数，实际传入 ${argCount} 个`,
                });
            }
        }

        // 2) 禁用阻塞/不兼容 API：window.prompt / window.alert
        const bannedRe = /(?:^|[^\w$.])(?:window\.)?(prompt|alert)\s*\(/g;
        while ((m = bannedRe.exec(clean))) {
            const line = clean.slice(0, m.index).split("\n").length;
            violations.push({
                kind: "banned-browser-dialog",
                file: rel,
                line,
                api: m[1],
                message: `${rel}:${line} 禁止调用阻塞式/Electron 不兼容的 ${m[1]}()，请改用宿主 Dialog`,
            });
        }

        // 3) 禁止 innerHTML 模板插值拼接未转义变量
        const innerRe = /\.innerHTML\s*\+?=\s*`((?:[^`\\]|\\.)*)`/g;
        while ((m = innerRe.exec(clean))) {
            const tpl = m[1];
            const line = clean.slice(0, m.index).split("\n").length;
            const exprRe = /\$\{([^}]+)\}/g;
            let em;
            while ((em = exprRe.exec(tpl))) {
                const expr = em[1];
                if (!isSafeInnerHtmlExpr(expr)) {
                    violations.push({
                        kind: "unsafe-innerhtml-interpolation",
                        file: rel,
                        line,
                        expr: expr.trim(),
                        message: `${rel}:${line} innerHTML 模板字符串包含未转义插值 \${${expr.trim()}}`,
                    });
                }
            }
        }
    }

    return violations;
}

if (require.main === module) {
    const violations = scanUiContracts();
    if (violations.length > 0) {
        console.error(`✖ check-ui-contracts 发现 ${violations.length} 处违规：`);
        for (const v of violations) console.error(`  - [${v.kind}] ${v.message}`);
        process.exit(1);
    }
    console.log("✔ check-ui-contracts 通过（语言包双语对齐、%s 参数完整、零 prompt/alert、零未转义 innerHTML 插值）");
}

module.exports = {scanUiContracts};
