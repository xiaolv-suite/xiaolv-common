"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    normalizePunctuationAdaptive,
    obfuscateText,
    wrapTextLines,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveObfuscateArg,
} = entry.placeholders;

test("normalizePunctuationAdaptive: adapts punctuation according to surrounding Chinese and English context", () => {
    // 1. 中文汉字上下文自动将半角标点纠错为全角标点
    const zhText = "你好,世界.这是测试!真的吗?请看:分号测试;";
    const resZh = normalizePunctuationAdaptive(zhText);
    assert.equal(resZh.result, "你好，世界。这是测试！真的吗？请看：分号测试；");
    assert.equal(resZh.convertedCount, 6);

    // 2. 英文单词上下文自动将全角标点纠错为半角加空格
    const enText = "Hello，world。Are you ready？";
    const resEn = normalizePunctuationAdaptive(enText);
    assert.equal(resEn.result.trim(), "Hello, world. Are you ready?");

    // 3. 保护数值小数与千分位不受破坏
    const mathText = "计算结果为 3.14159，总金额为 1,000,000 元整。";
    const resMath = normalizePunctuationAdaptive(mathText);
    assert.ok(resMath.result.includes("3.14159"));
    assert.ok(resMath.result.includes("1,000,000"));
});

test("obfuscateText: obfuscates and decodes text via ROT13 and Leet substitutions", () => {
    // 1. ROT13 对称可逆加解密
    const original = "SecretPassword123!";
    const encrypted = obfuscateText(original, "rot13");
    assert.equal(encrypted, "FrpergCnffjbeq123!");
    const decrypted = obfuscateText(encrypted, "rot13");
    assert.equal(decrypted, original);

    // 2. Leet 字符极客变换
    const leetStr = "Attack at Dawn";
    const resLeet = obfuscateText(leetStr, "leet");
    assert.equal(resLeet, "4774ck 47 D4wn");
});

test("wrapTextLines: wraps long lines according to column width preserving word boundaries", () => {
    // 1. 短行保持不变
    assert.equal(wrapTextLines("Short line", 40), "Short line");

    // 2. 英文超长行在单词空格边界折行
    const longEn = "The quick brown fox jumps over the lazy dog repeatedly until sunset.";
    const wrappedEn = wrapTextLines(longEn, 25);
    const linesEn = wrappedEn.split("\n");
    assert.ok(linesEn.length >= 3);
    for (const l of linesEn) {
        assert.ok(l.length <= 25);
    }

    // 3. 中文全角字符双倍宽度计算折行
    const longZh = "思源笔记常用内容快速调用器与资产复用插件。";
    const wrappedZh = wrapTextLines(longZh, 16);
    const linesZh = wrappedZh.split("\n");
    assert.ok(linesZh.length >= 2);
});

test("Obfuscate macro: evaluates {{xlc:obfuscate}} placeholders dynamically", () => {
    const now = new Date(2026, 9, 29, 12, 0, 0);

    // 1. 默认管道语法 ROT13 混淆
    const tpl1 = "混淆密文: {{xlc:obfuscate|rot13|HelloWorld}}";
    assert.equal(applyPlaceholders(tpl1, now, true), "混淆密文: UryybJbeyq");

    // 2. 冒号子命令语法
    const tpl2 = "密文: {{xlc:obfuscate:rot13|AdminToken}}";
    assert.equal(applyPlaceholders(tpl2, now, true), "密文: NqzvaGbxra");

    // 3. Leet 模式
    const tpl3 = "Leet: {{xlc:obfuscate|leet|Elite}}";
    assert.equal(applyPlaceholders(tpl3, now, true), "Leet: 3l173");
});
