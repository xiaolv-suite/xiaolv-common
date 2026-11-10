"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    filterLinesByAffix,
    generateRandomColor,
    renumberOrderedList,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveRandomColorArg,
} = entry.placeholders;

test("filterLinesByAffix: accurately filters lines by prefix or suffix with invert and case options", () => {
    const code = `
import {a} from "./a";
const x = 10;
import {b} from "./b";
// 这是单行注释
let y = 20;
// 这是另一条注释
import {c} from "./c";
`.trim();

    // 1. 前缀提取 (prefix: "import ")
    const imports = filterLinesByAffix(code, "import ", "prefix");
    assert.equal(imports, 'import {a} from "./a";\nimport {b} from "./b";\nimport {c} from "./c";');

    // 2. 缩进前缀匹配 (trimBeforeCheck: true)
    const indented = "  // 行内注释\n  const z = 30;\n    // 深层注释";
    const comments = filterLinesByAffix(indented, "//", "prefix");
    assert.equal(comments, "  // 行内注释\n    // 深层注释");

    // 3. 后缀匹配 (suffix: ";") 与反选排除 (invert: true)
    const files = `
report.doc
index.ts
avatar.png
service.ts
config.json
`.trim();
    const tsFiles = filterLinesByAffix(files, ".ts", "suffix");
    assert.equal(tsFiles, "index.ts\nservice.ts");

    const nonTsFiles = filterLinesByAffix(files, ".ts", "suffix", {invert: true});
    assert.equal(nonTsFiles, "report.doc\navatar.png\nconfig.json");
});

test("generateRandomColor: generates hex, rgb, and hsl colors across different tones", () => {
    // 1. HEX 格式 (默认大写 6 位十六进制)
    const hex = generateRandomColor("hex");
    assert.match(hex, /^#[0-9A-F]{6}$/);

    // 2. RGB 格式
    const rgb = generateRandomColor("rgb");
    assert.match(rgb, /^rgb\(\d{1,3}, \d{1,3}, \d{1,3}\)$/);

    // 3. HSL 格式
    const hsl = generateRandomColor("hsl");
    assert.match(hsl, /^hsl\(\d{1,3}, \d{1,3}%, \d{1,3}%\)$/);

    // 4. 指定色调主题 (vibrant, pastel, dark, light)
    const pastel = generateRandomColor("hex", {tone: "pastel"});
    assert.match(pastel, /^#[0-9A-F]{6}$/);
});

test("{{xlc:randomcolor}}: dynamic placeholder macro generates random color codes", () => {
    const now = new Date("2026-10-29T12:00:00");

    // 1. 默认 HEX
    const resHex = applyPlaceholders("{{xlc:randomcolor}}", now, true);
    assert.match(resHex, /^#[0-9A-F]{6}$/);

    // 2. 冒号子格式 (rgb / hsl)
    const resRgb = applyPlaceholders("{{xlc:randomcolor:rgb}}", now, true);
    assert.match(resRgb, /^rgb\(\d{1,3}, \d{1,3}, \d{1,3}\)$/);

    const resHsl = applyPlaceholders("{{xlc:randomcolor:hsl}}", now, true);
    assert.match(resHsl, /^hsl\(\d{1,3}, \d{1,3}%, \d{1,3}%\)$/);

    // 3. 管道参数指定色调
    const resPastel = applyPlaceholders("{{xlc:randomcolor|pastel}}", now, true);
    assert.match(resPastel, /^#[0-9A-F]{6}$/);
});

test("renumberOrderedList: fixes broken ordering and renumbers lists sequentially per indentation level", () => {
    // 1. 混乱/断裂序号修复重排
    const messyList = `
1. 第一步
1. 第二步
5. 第三步
2. 第四步
`.trim();

    const fixed = renumberOrderedList(messyList);
    assert.equal(fixed, "1. 第一步\n2. 第二步\n3. 第三步\n4. 第四步");

    // 2. 多层级嵌套独立编号
    const nested = `
1. 总体架构
   5. 数据层
   2. 业务层
4. 部署方案
   9. 容器编排
`.trim();

    const fixedNested = renumberOrderedList(nested);
    const lines = fixedNested.split("\n");
    assert.equal(lines[0], "1. 总体架构");
    assert.equal(lines[1], "   1. 数据层");
    assert.equal(lines[2], "   2. 业务层");
    assert.equal(lines[3], "2. 部署方案");
    assert.equal(lines[4], "   1. 容器编排");

    // 3. 自定义起始编号与括号风格 (parenthesis)
    const custom = `
1) 初始项
1) 后续项
`.trim();
    const fixedCustom = renumberOrderedList(custom, {startNumber: 10, style: "parenthesis"});
    assert.equal(fixedCustom, "10) 初始项\n11) 后续项");
});
