"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    padOrTruncate,
    generateNumericSequence,
    formatByRegexGroups,
    censorText,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveMatchArg,
    resolveRegexArg,
    isDangerousRegex,
} = entry.placeholders;

const {
    cleanTagList,
    deriveTitle,
} = entry.item;

test("cleanString & deriveTitle: preserves UTF-16 surrogate pairs and never leaves orphaned high surrogates", () => {
    // 1. Emoji 完整保留
    const emojiStr = "这是一个测试🚀";
    const title1 = deriveTitle(emojiStr, "text");
    assert.ok(title1.includes("🚀"));

    // 2. 边界截断测试：构造恰好在 Emoji 代理对截断的字符串
    // 🚀 的 UTF-16 编码为 \uD83D\uDE80（两码元：高代理 \uD83D，低代理 \uDE80）
    // 标题上限为 LIMITS.title = 512。构造 511 个普通字符 + 🚀（总码元 513）
    const str511 = "a".repeat(511) + "🚀"; // 长度 513 码元
    const derived = deriveTitle(str511, "text");
    assert.equal(derived.length, 511); // 截断到 512 时截中了高代理，cleanString 应剔除孤立高代理回到 511
    assert.equal(derived, "a".repeat(511));

    // 3. 标签分隔符全面兼容中英文逗号与分号
    const rawTags = cleanTagList("工作，技术, 思源；插件 ; 常用");
    assert.deepEqual(rawTags, ["工作", "技术", "思源", "插件", "常用"]);
});

test("ReDoS and safe execution in regex macros: rejects catastrophic backtracking and caps length", () => {
    // 1. 危险回溯正则检测
    assert.equal(isDangerousRegex("(a+)+$"), true);
    assert.equal(isDangerousRegex("([a-zA-Z]+)*"), true);
    assert.equal(isDangerousRegex("(x+x+)+y"), true);
    assert.equal(isDangerousRegex("^[a-z0-9_-]+$"), false);

    // 2. resolveMatchArg 拦截危险正则
    const matchDangerous = resolveMatchArg("(a+)+$|$1|aaaaaaaaaaaaaaaaaaaaaaX");
    assert.equal(matchDangerous, null);

    // 3. resolveRegexArg 拦截 multiline 危险正则
    const regexDangerous = resolveRegexArg("mreplace|(a+)+$|X|aaaaaaaaaaaaaaaaaaaaaaX");
    assert.equal(regexDangerous, null);

    // 4. 安全正则正常执行
    const matchSafe = resolveMatchArg("(\\d{4})-(\\d{2})-(\\d{2})|$1年$2月$3日|2026-10-29");
    assert.equal(matchSafe, "2026年10月29日");
});

test("padOrTruncate and generateNumericSequence: safe bounds prevent RangeError on huge width", () => {
    // 1. 极大 padWidth 不崩溃，安全截断至上限
    assert.doesNotThrow(() => {
        const padded = padOrTruncate("test", 999999999);
        assert.ok(padded.length <= 10000);
    });

    // 2. generateNumericSequence 极大 padWidth 不崩溃
    assert.doesNotThrow(() => {
        const seq = generateNumericSequence(1, 5, { padWidth: 999999999, limit: 5 });
        assert.ok(seq.length > 0);
    });
});

test("formatByRegexGroups and censorText: fast single-pass execution without loop allocations", () => {
    // 1. 模板变量组多重替换
    const formatted = formatByRegexGroups(
        "User: Alice, Role: Admin",
        "User: (\\w+), Role: (\\w+)",
        "姓名=$1 | 权限=$2 (全匹配=$0)",
    );
    assert.equal(formatted, "姓名=Alice | 权限=Admin (全匹配=User: Alice, Role: Admin)");

    // 2. 敏感词多关键词单正则单遍替换
    const censored1 = censorText("这是一篇包含机密与内部以及敏感的测试文档", ["机密", "内部", "敏感"]);
    assert.equal(censored1, "这是一篇包含**与**以及**的测试文档");

    const censored2 = censorText("这是一篇包含机密与内部以及敏感的测试文档", "机密, 内部, 敏感", "[REDACTED]");
    assert.equal(censored2, "这是一篇包含[REDACTED]与[REDACTED]以及[REDACTED]的测试文档");
});
