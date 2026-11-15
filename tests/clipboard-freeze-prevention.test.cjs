const test = require("node:test");
const assert = require("node:assert");
const { previewRenderer, item } = require("./.build/entry.cjs");

test("tokenizeMarkdownInlines 杜绝死循环：各种未闭合符号与括号文本均安全秒级解析", () => {
    const maliciousCases = [
        "[小驴闪卡] 小驴闪卡提示: 部分插件数据保存失败（自动重试仍失败）。",
        "[13:08:20] [思源原生] ×10 思源异常：data block DOM failed: found invalid ID [h2-pending-memos] v3.8.10",
        "未闭合粗体 **text 还有很多内容",
        "未闭合行内代码 `code 还有很多内容",
        "未闭合占位符 {{xlc:name 还有很多内容",
        "普通中文字符串没有任何 Markdown 标记",
        "[有效链接](https://example.com) 以及 [未闭合方括号 与 [常规方括号] 混合",
        "[[双层括号引用]] 与常规 [链接文本](http://test.org)",
        "[",
        "[[",
        "[]",
        "**",
        "***",
        "`",
        "``",
        "{{xlc:",
        "{{xlc:}}",
    ];

    for (const tc of maliciousCases) {
        const start = Date.now();
        const tokens = previewRenderer.tokenizeMarkdownInlines(tc);
        const elapsed = Date.now() - start;
        assert.ok(elapsed < 20, `解析用时过长 (${elapsed}ms)，可能存在死循环风险: "${tc.slice(0, 30)}"`);
        assert.ok(Array.isArray(tokens), `返回值应为数组: "${tc.slice(0, 30)}"`);
        assert.ok(tokens.length > 0, `对于非空输入应返回有效 token: "${tc.slice(0, 30)}"`);
    }
});

test("parseSnippetAnnotations 性能与安全性早退：超长文本与多行长文本跳过正则回溯", () => {
    // 1. 超过400字符的长文本（如生态诊断报告或代码块）秒级跳过注解剥离
    const longText = "这是一段非常长的文本，模拟用户从网页或诊断报告复制的内容。" + "a".repeat(1000);
    const startLong = Date.now();
    const resLong = item.parseSnippetAnnotations(longText);
    const elapsedLong = Date.now() - startLong;
    assert.ok(elapsedLong < 5, `长文本解析应在 5ms 内 O(1) 早退: ${elapsedLong}ms`);
    assert.strictEqual(resLong.cleanText, longText);
    assert.strictEqual(resLong.title, "");

    // 2. 多行文本（带换行符）秒级早退，不触发贪婪正则回溯
    const multiline = "第一行内容\n第二行内容 [注释]\n第三行内容";
    const resMulti = item.parseSnippetAnnotations(multiline);
    assert.strictEqual(resMulti.cleanText, multiline);

    // 3. 常规短单行注解保持 100% 正常解析
    const s1 = item.parseSnippetAnnotations("13800138000 @手机号 @常用电话");
    assert.strictEqual(s1.cleanText, "13800138000");
    assert.deepStrictEqual(s1.tags, ["手机号", "常用电话"]);

    const s2 = item.parseSnippetAnnotations("[公司税号] 91110108MA000000");
    assert.strictEqual(s2.cleanText, "91110108MA000000");
    assert.strictEqual(s2.title, "公司税号");
});
