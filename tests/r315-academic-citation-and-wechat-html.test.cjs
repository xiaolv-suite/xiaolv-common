"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
    promptPack,
    importMarkdown,
    clipboard,
    previewRenderer,
    kramdown,
} = require("./.build/entry.cjs");

const {
    ACADEMIC_CITATION_PACK_NAME,
    ACADEMIC_CITATION_PACK_MD,
} = promptPack;
const {parseMarkdownPack} = importMarkdown;
const {renderWechatArticleHtml} = clipboard;
const {parseMarkdownBlocks} = previewRenderer;
const {bodyWriteRestriction} = kramdown;

test("ACADEMIC_CITATION_PACK_MD: parses into 4 valid CSL citation templates", () => {
    assert.equal(ACADEMIC_CITATION_PACK_NAME, "学术科研规范引文模板包");
    assert.ok(typeof ACADEMIC_CITATION_PACK_MD === "string" && ACADEMIC_CITATION_PACK_MD.length > 0);

    const parsed = parseMarkdownPack(ACADEMIC_CITATION_PACK_MD);
    assert.equal(parsed.pack?.name, "学术科研规范引文模板包");
    assert.equal(parsed.items.length, 4);
    assert.equal(parsed.issues.length, 0);

    const titles = parsed.items.map((i) => i.title);
    assert.ok(titles.some((t) => t.includes("GB/T 7714-2015 期刊文章")));
    assert.ok(titles.some((t) => t.includes("GB/T 7714-2015 专著图书")));
    assert.ok(titles.some((t) => t.includes("GB/T 7714-2015 学位论文")));
    assert.ok(titles.some((t) => t.includes("APA 7th 英文期刊引文")));

    for (const item of parsed.items) {
        assert.equal(item.category, "学术科研");
        assert.ok(item.tags.includes("引文") || item.tags.includes("学术"));
        assert.equal(bodyWriteRestriction(item.kramdown), undefined);
    }
});

test("renderWechatArticleHtml: produces sanitized WeChat-compatible inline styles", () => {
    const md = "### 公众号文章标题\n\n这是一段正文，包含 **重要加粗** 和 `代码`。\n\n> 引用名言";
    const html = renderWechatArticleHtml(md);

    assert.ok(html.includes("letter-spacing: 0.5px"));
    assert.ok(html.includes("text-align: justify"));
    assert.ok(html.includes("font-size: 15px"));
    assert.ok(html.includes("<section"));
    assert.ok(html.includes("重要加粗"));

    // 空内容安全处理
    assert.equal(renderWechatArticleHtml(""), "");
});

test("parseMarkdownBlocks: correctly flags indented nested list and task items", () => {
    const md = [
        "- [ ] 根任务",
        "    - [ ] 嵌套二级子任务",
        "- 普通根项",
        "  - 嵌套列表项",
    ].join("\n");

    const blocks = parseMarkdownBlocks(md);
    assert.equal(blocks.length, 4);
    assert.equal(blocks[0].isNested, false);
    assert.equal(blocks[1].isNested, true);
    assert.equal(blocks[2].isNested, false);
    assert.equal(blocks[3].isNested, true);
});
