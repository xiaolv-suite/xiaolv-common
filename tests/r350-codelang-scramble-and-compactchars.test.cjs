"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    detectCodeLanguage,
    scrambleText,
    compactRepeatedCharacters,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveScrambleArg,
} = entry.placeholders;

test("detectCodeLanguage: accurately detects programming languages and markup formats", () => {
    // 1. JSON 检测
    const jsonSnippet = '{"userId": 1001, "isActive": true, "roles": ["admin"]}';
    const resJson = detectCodeLanguage(jsonSnippet);
    assert.equal(resJson.language, "json");
    assert.equal(resJson.isCode, true);

    // 2. Python 检测
    const pySnippet = "def calculate_tax(amount):\n    return amount * 0.13";
    const resPy = detectCodeLanguage(pySnippet);
    assert.equal(resPy.language, "python");
    assert.equal(resPy.isCode, true);

    // 3. SQL 检测
    const sqlSnippet = "SELECT id, username, email FROM sys_users WHERE is_deleted = 0;";
    const resSql = detectCodeLanguage(sqlSnippet);
    assert.equal(resSql.language, "sql");
    assert.equal(resSql.isCode, true);

    // 4. TypeScript 检测
    const tsSnippet = "interface AccountInfo {\n    accountName: string;\n    balance: number;\n}";
    const resTs = detectCodeLanguage(tsSnippet);
    assert.equal(resTs.language, "typescript");
    assert.equal(resTs.isCode, true);

    // 5. HTML 检测
    const htmlSnippet = '<div class="alert-box"><span>Warning</span></div>';
    const resHtml = detectCodeLanguage(htmlSnippet);
    assert.equal(resHtml.language, "html");
    assert.equal(resHtml.isCode, true);

    // 6. 普通文本
    const plainText = "这是一篇普通的日常随笔记录，没有任何程序代码。";
    const resPlain = detectCodeLanguage(plainText);
    assert.equal(resPlain.isCode, false);
});

test("scrambleText: shuffles words or characters randomly preserving content set", () => {
    // 1. 单词乱序 (words)
    const sentence = "apple banana cherry date elderberry fig";
    const wordsOriginal = sentence.split(" ").sort();
    const scrambledWords = scrambleText(sentence, "words");
    const wordsScrambled = scrambledWords.split(" ").sort();
    assert.deepEqual(wordsScrambled, wordsOriginal);

    // 2. 字符乱序 (chars)
    const word = "HelloWorld";
    const charsOriginal = word.split("").sort();
    const scrambledChars = scrambleText(word, "chars");
    const charsScrambled = scrambledChars.split("").sort();
    assert.deepEqual(charsScrambled, charsOriginal);
    assert.equal(scrambledChars.length, word.length);
});

test("compactRepeatedCharacters: compresses multiple repetitive punctuation marks and symbols", () => {
    // 1. 压缩多余感叹号与问号
    const rawPunct = "太棒了！！！！真的吗？？？？还有波浪号~~~~~~";
    const resPunct = compactRepeatedCharacters(rawPunct, 1);
    assert.equal(resPunct.result, "太棒了！真的吗？还有波浪号~");
    assert.ok(resPunct.compressedCount >= 8);

    // 2. 允许保留 2 个重复字符 (如 ！！)
    const resMax2 = compactRepeatedCharacters("开心！！！！！", 2);
    assert.equal(resMax2.result, "开心！！");
});

test("Scramble macro: evaluates {{xlc:scramble}} placeholders dynamically", () => {
    const now = new Date(2026, 9, 29, 12, 0, 0);

    // 1. 默认单词乱序
    const tpl1 = "单词乱序: {{xlc:scramble|words|alpha beta gamma delta}}";
    const res1 = applyPlaceholders(tpl1, now, true);
    assert.ok(res1.startsWith("单词乱序: "));
    const words = res1.slice("单词乱序: ".length).split(" ").sort();
    assert.deepEqual(words, ["alpha", "beta", "delta", "gamma"]);

    // 2. 冒号子命令字符级打乱
    const tpl2 = "乱序: {{xlc:scramble:chars|abcdef}}";
    const res2 = applyPlaceholders(tpl2, now, true);
    assert.ok(res2.startsWith("乱序: "));
    const chars = res2.slice("乱序: ".length).split("").sort();
    assert.deepEqual(chars, ["a", "b", "c", "d", "e", "f"]);
});
