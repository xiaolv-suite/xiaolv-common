"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    extractMarkdownLinks,
    generateTextHash,
    affixLines,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveHashArg,
} = entry.placeholders;

test("extractMarkdownLinks: extracts Markdown links, images, and raw URLs", () => {
    const markdown = [
        "# 项目文档与常用资源",
        "官方主页: [思源笔记](https://b3log.org/siyuan)",
        "文档与下载: [社区集市](https://b3log.org/siyuan/package) 以及 https://github.com/siyuan-note/siyuan",
        "架构示意图: ![架构图](https://b3log.org/images/arch.png)",
        "重复链接: [官方网站](https://b3log.org/siyuan)",
    ].join("\n");

    // 1. 默认参数 (去重、包含图片和裸URL、输出Markdown列表)
    const res = extractMarkdownLinks(markdown);
    assert.equal(res.count, 4);
    assert.equal(res.links[0].text, "思源笔记");
    assert.equal(res.links[0].url, "https://b3log.org/siyuan");
    assert.equal(res.links[0].isImage, false);

    assert.equal(res.links[1].text, "社区集市");
    assert.equal(res.links[1].url, "https://b3log.org/siyuan/package");

    assert.equal(res.links[2].text, "架构图");
    assert.equal(res.links[2].url, "https://b3log.org/images/arch.png");
    assert.equal(res.links[2].isImage, true);

    assert.equal(res.links[3].text, "https://github.com/siyuan-note/siyuan");
    assert.equal(res.links[3].url, "https://github.com/siyuan-note/siyuan");
    assert.equal(res.links[3].isImage, false);

    // 验证 Markdown 列表格式输出
    assert.ok(res.result.includes("- [思源笔记](https://b3log.org/siyuan)"));
    assert.ok(res.result.includes("- ![架构图](https://b3log.org/images/arch.png)"));

    // 2. 纯 URL 换行输出 (urls)
    const urlsRes = extractMarkdownLinks(markdown, {outputFormat: "urls"});
    assert.equal(urlsRes.count, 4);
    const urlLines = urlsRes.result.split("\n");
    assert.equal(urlLines.length, 4);
    assert.equal(urlLines[0], "https://b3log.org/siyuan");

    // 3. 仅提取图片 (imagesOnly)
    const imgRes = extractMarkdownLinks(markdown, {imagesOnly: true});
    assert.equal(imgRes.count, 1);
    assert.equal(imgRes.links[0].url, "https://b3log.org/images/arch.png");

    // 4. 排除图片 (excludeImages)
    const noImgRes = extractMarkdownLinks(markdown, {excludeImages: true});
    assert.equal(noImgRes.count, 3);
    assert.ok(noImgRes.links.every((l) => !l.isImage));
});

test("generateTextHash: deterministic hashing algorithms across platforms", () => {
    const text = "hello world";

    // 1. FNV-1a 默认 8 字符 hex
    const hashFnv = generateTextHash(text, "fnv1a");
    assert.equal(typeof hashFnv, "string");
    assert.equal(hashFnv.length, 8);
    // 确定性验证
    assert.equal(hashFnv, generateTextHash(text, "fnv1a"));
    assert.notEqual(hashFnv, generateTextHash("hello world 2", "fnv1a"));

    // 2. DJB2
    const hashDjb = generateTextHash(text, "djb2");
    assert.equal(typeof hashDjb, "string");
    assert.equal(hashDjb.length, 8);
    assert.equal(hashDjb, generateTextHash(text, "djb2"));

    // 3. CRC-32
    const hashCrc = generateTextHash(text, "crc32");
    assert.equal(typeof hashCrc, "string");
    assert.equal(hashCrc.length, 8);
    assert.equal(hashCrc, generateTextHash(text, "crc32"));

    // 4. Base36 与截取长度
    const hashB36 = generateTextHash(text, {algorithm: "fnv1a", format: "base36", length: 6});
    assert.equal(typeof hashB36, "string");
    assert.equal(hashB36.length, 6);
});

test("affixLines: batches prefix and suffix on multi-line text", () => {
    const multiLine = [
        "apple",
        "banana",
        "",
        "orange",
    ].join("\n");

    // 1. 批量添加列表前缀 (- )，默认忽略空行
    const resPrefix = affixLines(multiLine, {prefix: "- "});
    assert.equal(resPrefix.lineCount, 4);
    assert.equal(resPrefix.changedCount, 3);
    assert.equal(resPrefix.result, "- apple\n- banana\n\n- orange");

    // 2. 批量添加 SQL IN 前后缀 ('item',)
    const resSql = affixLines(multiLine, {prefix: "'", suffix: "',", ignoreEmpty: true});
    assert.equal(resSql.changedCount, 3);
    assert.equal(resSql.result, "'apple',\n'banana',\n\n'orange',");

    // 3. 不忽略空行
    const resAll = affixLines(multiLine, {prefix: "> ", ignoreEmpty: false});
    assert.equal(resAll.changedCount, 4);
    assert.equal(resAll.result, "> apple\n> banana\n> \n> orange");
});

test("Hash macro: dynamic placeholder expansion for hash/fingerprint", () => {
    const now = new Date(2026, 9, 28, 12, 0, 0);

    // 默认 FNV-1a
    const tpl1 = "指纹：{{xlc:hash|hello world}}";
    const res1 = applyPlaceholders(tpl1, now, true);
    assert.equal(res1, `指纹：${generateTextHash("hello world", "fnv1a")}`);

    // 带算法参数管道语法
    const tpl2 = "CRC32：{{xlc:hash|crc32|config_data_2026}}";
    const res2 = applyPlaceholders(tpl2, now, true);
    assert.equal(res2, `CRC32：${generateTextHash("config_data_2026", "crc32")}`);

    // 冒号兼容语法
    const tpl3 = "DJB2：{{xlc:hash:djb2|siyuan_note}}";
    const res3 = applyPlaceholders(tpl3, now, true);
    assert.equal(res3, `DJB2：${generateTextHash("siyuan_note", "djb2")}`);

    // 直接调用 resolveHashArg
    assert.equal(resolveHashArg("测试文本", "crc32"), generateTextHash("测试文本", "crc32"));
    assert.equal(resolveHashArg("unknown_algo|abc"), null);
});
