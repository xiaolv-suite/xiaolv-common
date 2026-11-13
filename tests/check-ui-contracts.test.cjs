"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {scanUiContracts} = require("../scripts/check-ui-contracts.cjs");

test("check-ui-contracts：生产源码语言键完整、%s 参数对齐、零 prompt/alert、零未转义 innerHTML 插值", () => {
    const violations = scanUiContracts();
    assert.deepEqual(violations, []);
});

test("check-ui-contracts：负向探针能拦截缺失语言键、%s 参数不匹配、window.prompt/alert 与未转义 innerHTML 插值", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "xlc-ui-contract-"));
    try {
        const zhPath = path.join(tmp, "zh-CN.json");
        const enPath = path.join(tmp, "en.json");
        const sampleTs = path.join(tmp, "sample.ts");
        fs.writeFileSync(zhPath, JSON.stringify({copied: "已复制：%s", onlyZh: "仅中文", badFmt: "%s - %s"}));
        fs.writeFileSync(enPath, JSON.stringify({copied: "Copied: %s", onlyEn: "Only EN", badFmt: "%s"}));
        fs.writeFileSync(sampleTs, [
            "export function demo(t: (k: string, ...a: string[]) => string, el: HTMLElement, raw: string) {",
            "    t('noSuchKey');",
            "    t('copied');",
            "    window.prompt('name');",
            "    window.alert('msg');",
            "    el.innerHTML = `<span>${raw}</span>`;",
            "}",
        ].join("\n"));
        const violations = scanUiContracts({root: tmp, zhPath, enPath, files: [sampleTs]});
        const kinds = new Set(violations.map((v) => v.kind));
        assert.ok(kinds.has("i18n-missing-en"), "应检出 en.json 缺失键");
        assert.ok(kinds.has("i18n-missing-zh"), "应检出 zh-CN.json 缺失键");
        assert.ok(kinds.has("i18n-placeholder-locale-mismatch"), "应检出双语 %s 数量不一致");
        assert.ok(kinds.has("missing-i18n-key"), "应检出源码调用了不存在的语言键");
        assert.ok(kinds.has("i18n-arg-count-mismatch"), "应检出 %s 参数个数不匹配");
        assert.ok(kinds.has("banned-browser-dialog"), "应检出禁用 prompt/alert");
        assert.ok(kinds.has("unsafe-innerhtml-interpolation"), "应检出未转义 innerHTML 模板插值");
    } finally {
        fs.rmSync(tmp, {recursive: true, force: true});
    }
});
