"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
    item,
    search,
    variables,
    expansion,
} = require("./.build/entry.cjs");

test("T-0751 · Frecency 智能热度与时间半衰期衰减极限边界鲁棒性", () => {
    const now = 1762500000000;

    // 1. 系统时钟回退或未来时间戳（lastUsedAt > now）防御
    const futureTime = now + 10000000;
    const scoreFuture = search.calculateFrecencyScore(5, futureTime, now);
    // 应当钳制 deltaMs 为 0，享受 <= 1 天的满额权重 100
    assert.equal(scoreFuture, 5 * 100);

    // 2. 异常 count 输入（NaN, 负数, null, undefined）防御
    assert.equal(search.calculateFrecencyScore(NaN, now, now), 0);
    assert.equal(search.calculateFrecencyScore(-10, now, now), 0);
    assert.equal(search.calculateFrecencyScore(null, now, now), 0);
    assert.equal(search.calculateFrecencyScore(undefined, now, now), 0);

    // 3. 缺失或非法 lastUsedAt（0, 负数, NaN）回退到基础保底权重 5
    assert.equal(search.calculateFrecencyScore(8, 0, now), 8 * 5);
    assert.equal(search.calculateFrecencyScore(8, -500, now), 8 * 5);
    assert.equal(search.calculateFrecencyScore(8, NaN, now), 8 * 5);
    assert.equal(search.calculateFrecencyScore(8, undefined, now), 8 * 5);

    // 4. 时间阶梯衰减阈值精确边界
    const oneDayMs = 24 * 60 * 60 * 1000;
    // 刚好 24 小时整：权重 100
    assert.equal(search.calculateFrecencyScore(1, now - oneDayMs, now), 100);
    // 24 小时零 1 毫秒：权重 70
    assert.equal(search.calculateFrecencyScore(1, now - (oneDayMs + 1), now), 70);
    // 刚好 7 天整：权重 70
    assert.equal(search.calculateFrecencyScore(1, now - (7 * oneDayMs), now), 70);
    // 7 天零 1 毫秒：权重 40
    assert.equal(search.calculateFrecencyScore(1, now - (7 * oneDayMs + 1), now), 40);
    // 刚好 30 天整：权重 40
    assert.equal(search.calculateFrecencyScore(1, now - (30 * oneDayMs), now), 40);
    // 30 天零 1 毫秒：权重 20
    assert.equal(search.calculateFrecencyScore(1, now - (30 * oneDayMs + 1), now), 20);
    // 刚好 90 天整：权重 20
    assert.equal(search.calculateFrecencyScore(1, now - (90 * oneDayMs), now), 20);
    // 超过 90 天：权重 5
    assert.equal(search.calculateFrecencyScore(1, now - (90 * oneDayMs + 1), now), 5);

    // 5. calculateRecencyDecay 半衰期指数衰减函数单调性与极限
    const halfLife = 7 * oneDayMs;
    // deltaMs = 0 -> 1.0
    assert.equal(search.calculateRecencyDecay(now, now, halfLife), 1.0);
    // deltaMs = halfLife -> 0.5
    assert.equal(search.calculateRecencyDecay(now - halfLife, now, halfLife), 0.5);
    // deltaMs = 2 * halfLife -> 0.25
    assert.equal(search.calculateRecencyDecay(now - 2 * halfLife, now, halfLife), 0.25);
    // 缺失或非法 lastUsedMs 返回 0
    assert.equal(search.calculateRecencyDecay(undefined, now, halfLife), 0);
    assert.equal(search.calculateRecencyDecay(-1, now, halfLife), 0);
});

test("T-0752 · 自展开简码字典与击键缓冲区极限容错", () => {
    const dict = [
        { trigger: ":wk", item: { id: "item-1", title: "周报" } },
        { trigger: ":weekly", item: { id: "item-2", title: "长周报" } },
        { trigger: ";phone", item: { id: "item-3", title: "手机号" } },
        { trigger: "invalid-short", item: { id: "item-4", title: "无效" } },
    ];

    // 1. 最长前缀优先：输入 "hello:weekly" 应优先命中长词 :weekly 而非 :wk
    const matchLong = expansion.findExpansionMatch("hello:weekly", dict);
    assert.ok(matchLong);
    assert.equal(matchLong.trigger, ":weekly");
    assert.equal(matchLong.item.id, "item-2");
    assert.equal(matchLong.matchLength, 7);

    // 2. 短词命中
    const matchShort = expansion.findExpansionMatch("hello:wk", dict);
    assert.ok(matchShort);
    assert.equal(matchShort.trigger, ":wk");
    assert.equal(matchShort.item.id, "item-1");
    assert.equal(matchShort.matchLength, 3);

    // 3. 大小写不敏感匹配
    const matchCase = expansion.findExpansionMatch("test:WK", dict);
    assert.ok(matchCase);
    assert.equal(matchCase.item.id, "item-1");

    // 4. 空缓冲区与未命中返回 null
    assert.equal(expansion.findExpansionMatch("", dict), null);
    assert.equal(expansion.findExpansionMatch("hello", dict), null);
    assert.equal(expansion.findExpansionMatch("hello:unknown", dict), null);
});

test("T-0753 · Levenshtein 最小编辑距离与模糊滑动匹配数学自洽性", () => {
    // 1. 相同字符串距离为 0
    assert.equal(search.levenshteinDistance("", ""), 0);
    assert.equal(search.levenshteinDistance("abc", "abc"), 0);
    assert.equal(search.levenshteinDistance("常用语", "常用语"), 0);

    // 2. 空串与非空串
    assert.equal(search.levenshteinDistance("", "abc"), 3);
    assert.equal(search.levenshteinDistance("hello", ""), 5);

    // 3. 经典单操作距离
    assert.equal(search.levenshteinDistance("cat", "hat"), 1); // 替换
    assert.equal(search.levenshteinDistance("cat", "cats"), 1); // 插入
    assert.equal(search.levenshteinDistance("cats", "cat"), 1); // 删除
    assert.equal(search.levenshteinDistance("kitten", "sitting"), 3); // 经典用例

    // 4. CJK 字符距离
    assert.equal(search.levenshteinDistance("常用", "常用语"), 1);
    assert.equal(search.levenshteinDistance("小驴常用", "大驴常用"), 1);

    // 5. fuzzyMatchHaystack 滑动窗口检测
    assert.equal(search.fuzzyMatchHaystack("这是一段常用语模板", "常用语", 1).matched, true);
    assert.equal(search.fuzzyMatchHaystack("这是一段常用语模板", "常用词", 1).matched, true);
    assert.equal(search.fuzzyMatchHaystack("短文本", "完全不相干的长串", 1).matched, false);
});

test("T-0754 · URL 协议安全守卫与变量表单解析鲁棒性", () => {
    // 1. 严格安全 HTTP/HTTPS URL
    assert.equal(item.isSafeHttpUrl("https://siyuan-note.com"), true);
    assert.equal(item.isSafeHttpUrl("http://localhost:6806"), true);
    assert.equal(item.isSafeHttpUrl("https://127.0.0.1:8080/api/test?foo=bar#hash"), true);

    // 2. 拦截危险伪协议与非标准链接
    assert.equal(item.isSafeHttpUrl("javascript:alert(1)"), false);
    assert.equal(item.isSafeHttpUrl("data:text/html,<script>alert(1)</script>"), false);
    assert.equal(item.isSafeHttpUrl("file:///C:/Windows/System32"), false);
    assert.equal(item.isSafeHttpUrl("vbscript:msgbox(1)"), false);
    assert.equal(item.isSafeHttpUrl(""), false);
    assert.equal(item.isSafeHttpUrl(null), false);
    assert.equal(item.isSafeHttpUrl("   "), false);
    assert.equal(item.isSafeHttpUrl("http://"), false);

    // 3. parseAskField 复合表单解析与默认值提炼
    const f1 = variables.parseAskField("姓名=张三", "");
    assert.ok(f1);
    assert.equal(f1.name, "姓名");
    assert.equal(f1.defaultValue, "张三");
    assert.equal(f1.kind, "text");

    const f2 = variables.parseAskField("权限=guest", "admin|editor|guest");
    assert.ok(f2);
    assert.equal(f2.name, "权限");
    assert.equal(f2.defaultValue, "guest");
    assert.equal(f2.kind, "select");
    assert.deepEqual(f2.options, ["admin", "editor", "guest"]);

    // 4. 空字段名防御
    assert.equal(variables.parseAskField("", ""), null);
    assert.equal(variables.parseAskField("  =默认值", ""), null);
});
