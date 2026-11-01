// 小驴常用 · 资源占用与性能极速微基准压测套件
// 严格对标：内存有界性、CPU 纳秒级响应、零泄露与大规模检索低开销

"use strict";

const {
    search,
    storage,
    expansion,
    contextualRecommend,
    clipboard,
    usageInsights,
} = require("../tests/.build/entry.cjs");

const {searchEntries, splitSearchTokens} = search;
const {cleanExpansionBuffer, findExpansionMatch} = expansion;
const {calculateContextualScore, getRecommendedEntries} = contextualRecommend;
const {calculateMagneticSnap, normalizeState, pushRecentQuery, pushClipboardHistory} = storage;
const {calculateHeatmap, buildDailyUsageMap} = usageInsights;
const {mergeTrayContents} = clipboard;

function measure(name, fn, iterations = 1) {
    // 预热 JIT
    for (let i = 0; i < Math.min(iterations, 10); i++) fn();

    const start = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) {
        fn();
    }
    const end = process.hrtime.bigint();
    const totalNs = Number(end - start);
    const avgMs = (totalNs / iterations) / 1_000_000;
    return avgMs;
}

console.log("=================================================");
console.log("   小驴常用 · 资源占用与核心性能微基准压测报告   ");
console.log("=================================================\n");

let passedAll = true;

// 1. 简码自展开高频匹配性能 (1000条字典)
const dict1000 = [];
for (let i = 0; i < 1000; i++) {
    dict1000.push({
        trigger: `:snippet_${i}`,
        item: {id: `item_${i}`, title: `常用条目 ${i}`, content: `这是第 ${i} 条常用语的详细内容模板。`},
    });
}
dict1000.push({
    trigger: ":sjh",
    item: {id: "target_sjh", title: "主手机号", content: "18588888888"},
});

const expansionTime = measure("简码自展开末尾匹配 (1000条字典)", () => {
    findExpansionMatch("你好，我的手机号是:sjh", dict1000);
}, 2000);
console.log(`[自展开引擎] 1000条简码字典匹配延迟: ${expansionTime.toFixed(4)} ms / 次 (门禁: < 0.2ms)`);
if (expansionTime >= 0.2) passedAll = false;

// 2. 击键缓冲区有界截断测试 (防内存泄漏)
let longBuffer = "";
for (let i = 0; i < 10000; i++) {
    longBuffer += "abcdefghijklmnopqrstuvwxyz";
    longBuffer = cleanExpansionBuffer(longBuffer, 32);
}
console.log(`[击键缓冲区] 10000次追加后内存驻留长度: ${longBuffer.length} 字符 (严格限制 ≤ 32字符，零内存泄露)`);
if (longBuffer.length > 32) passedAll = false;

// 3. 上下文语义感知推荐算法 (1000条候选块打分)
const entries1000 = [];
for (let i = 0; i < 1000; i++) {
    entries1000.push({
        id: `entry_${i}`,
        title: i % 10 === 0 ? `发票报销凭证_${i}` : `日常研发说明_${i}`,
        category: i % 5 === 0 ? "财务/发票" : "综合事务",
        tags: i % 3 === 0 ? ["发票", "报销"] : ["常用"],
        summary: `这是第 ${i} 条测试条目的摘要信息`,
        content: `这是第 ${i} 条测试条目的完整正文内容`,
    });
}

const docCtx = {
    docId: "doc-20261101-sample",
    title: "2026年第四季度发票与财务报销复盘指南",
    hPath: "财务部/发票与报销/2026指南",
    tags: ["发票"],
};

const recommendTime = measure("1000条条目全量上下文打分并排序", () => {
    getRecommendedEntries(entries1000, docCtx, 5);
}, 100);
console.log(`[上下文推荐] 1000条条目全量打分与Top5排序延迟: ${recommendTime.toFixed(3)} ms (门禁: < 5.0ms)`);
if (recommendTime >= 5.0) passedAll = false;

// 4. 贴边自动磁吸算法 (极速响应)
const snapTime = measure("贴边磁吸几何吸附计算", () => {
    calculateMagneticSnap(15, 1070, 320, 400, 1920, 1080, 24);
}, 10000);
console.log(`[磁吸算法] 拖拽吸附几何计算延迟: ${(snapTime * 1000).toFixed(2)} µs / 次 (门禁: < 50µs)`);
if (snapTime * 1000 >= 50) passedAll = false;

// 5. 30天日历格热力图数据模型计算
const rawDaily = {};
for (let i = 0; i < 60; i++) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    rawDaily[dateStr] = (i * 3) % 15;
}
const heatmapTime = measure("30天热力图聚合与等级映射", () => {
    calculateHeatmap(rawDaily, 30, Date.now());
}, 1000);
console.log(`[使用热力图] 30天日历格切片与等级计算延迟: ${heatmapTime.toFixed(4)} ms (门禁: < 0.2ms)`);
if (heatmapTime >= 0.2) passedAll = false;

// 6. 2000条大规模常用语多词 AND 搜索延迟 (工业级压测)
const largeEntries = [];
for (let i = 0; i < 2000; i++) {
    largeEntries.push({
        id: `xlc-bench-${i}`,
        title: `售后客户致歉与延期补偿说明协议模板_${i}`,
        alias: `sh_${i}`,
        shortcode: `:apology_${i}`,
        category: i % 4 === 0 ? "客户服务" : "常规话术",
        tags: ["客服", "致歉", "补偿"],
        summary: `尊敬的客户您好，关于订单 ${i} 的交付延期，我们深表歉意并将提供专属服务费减免。`,
        content: `尊敬的客户您好，关于订单 ${i} 的交付延期，我们深表歉意。`,
        createdAt: Date.now() - i * 1000,
        updatedAt: Date.now() - i * 500,
    });
}

const searchCtx = {
    favorites: new Set(["xlc-bench-1", "xlc-bench-5"]),
    recents: new Map([["xlc-bench-2", Date.now()]]),
    usage: new Map([["xlc-bench-3", 25]]),
    sort: "manual",
};

const searchTime1 = measure("2000条条目单词前缀检索", () => {
    searchEntries(largeEntries, {text: "致歉"}, searchCtx);
}, 50);

const searchTime2 = measure("2000条条目多词 AND 组合检索 (致歉 补偿)", () => {
    searchEntries(largeEntries, {text: "致歉 补偿"}, searchCtx);
}, 50);

const searchTime3 = measure("2000条条目拼音首字母缩写检索 (sh)", () => {
    searchEntries(largeEntries, {text: "sh"}, searchCtx);
}, 50);

console.log(`[搜索性能] 2000条大库单词检索延迟: ${searchTime1.toFixed(3)} ms (门禁: < 15ms)`);
console.log(`[搜索性能] 2000条大库多词AND检索延迟: ${searchTime2.toFixed(3)} ms (门禁: < 20ms)`);
console.log(`[搜索性能] 2000条大库拼音首字母检索延迟: ${searchTime3.toFixed(3)} ms (门禁: < 20ms)`);
if (searchTime1 >= 15 || searchTime2 >= 20 || searchTime3 >= 20) passedAll = false;

// 7. 内存持久化有界性保护
let testHistory = [];
for (let i = 0; i < 1000; i++) {
    testHistory = pushRecentQuery(testHistory, `query_${i}`);
}
console.log(`[持久化保护] 搜索历史1000次追加后队列长度: ${testHistory.length} 条 (严格限制 ≤ 10条)`);
if (testHistory.length > 10) passedAll = false;

let testClips = [];
for (let i = 0; i < 1000; i++) {
    testClips = pushClipboardHistory(testClips, `clip_text_${i}`, 30);
}
console.log(`[持久化保护] 剪贴板历史1000次追加后队列长度: ${testClips.length} 条 (严格限制 ≤ 30条)`);
if (testClips.length > 30) passedAll = false;

console.log("\n=================================================");
if (passedAll) {
    console.log("✔ 全量资源占用与性能微基准压测全部达标 (全绿通过)");
} else {
    console.error("✖ 存在未达标的性能项");
    process.exit(1);
}
console.log("=================================================");
