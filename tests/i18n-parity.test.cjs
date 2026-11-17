"use strict";

/**
 * R21 i18n parity 契约：
 * zh-CN.json / en.json（嵌套）展平键集严格一致；源码 t("...") 字面量引用必须可命中 zh。
 * （scripts/i18n-audit.cjs 为孤立临时工具未接入流水线，本契约把核心 parity 检查固化进测试面。）
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

function flatten(obj, prefix = "", out = new Set()) {
    for (const [k, v] of Object.entries(obj)) {
        const key = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === "object") flatten(v, key, out);
        else out.add(key);
    }
    return out;
}

const zh = flatten(JSON.parse(fs.readFileSync(path.join(root, "src", "i18n", "zh-CN.json"), "utf8")));
const en = flatten(JSON.parse(fs.readFileSync(path.join(root, "src", "i18n", "en.json"), "utf8")));

function walk(dir, out = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) {
            if (["node_modules", "dist", "build", "release"].includes(e.name)) continue;
            walk(p, out);
        } else if (/\.(ts|svelte)$/.test(e.name)) out.push(p);
    }
    return out;
}

const collectUsed = () => {
    const used = new Set();
    for (const f of walk(path.join(root, "src"))) {
        if (f.split(path.sep).includes("i18n")) continue;
        const src = fs.readFileSync(f, "utf8");
        for (const m of src.matchAll(/(?<![\w$.])t\(\s*["']([a-z][\w-]*(?:\.[\w-]+)*)["']/g)) used.add(m[1]);
    }
    return used;
};

test("常用 · zh/en i18n 键集严格一致 (R21)", () => {
    const zhOnly = [...zh].filter(k => !en.has(k));
    const enOnly = [...en].filter(k => !zh.has(k));
    assert.deepEqual(zhOnly, [], `en.json 缺失 zh-CN 键（英文用户看到中文）: ${zhOnly.slice(0, 10).join(", ")}`);
    assert.deepEqual(enOnly, [], `zh-CN.json 缺失 en 键: ${enOnly.slice(0, 10).join(", ")}`);
});

test("常用 · 源码 t() 字面量引用闭环 (R21)", () => {
    const missing = [...collectUsed()].filter(k => !zh.has(k));
    assert.deepEqual(missing, [], `t() 引用存在未登记键: ${missing.slice(0, 10).join(", ")}`);
});
