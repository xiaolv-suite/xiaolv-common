"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const entry = require("./.build/entry.cjs");

const {
    shiftMarkdownHeadings,
    ensureLineAffixes,
    regexReplaceMultiline,
} = entry.clipboardCleaner;

const {
    applyPlaceholders,
    resolveRegexArg,
} = entry.placeholders;

test("shiftMarkdownHeadings: raises and lowers heading levels within min/max boundaries", () => {
    const md = `
# 一级标题
正文段落
## 二级小节
### 三级子项
###### 六级上限
`.trim();

    // 1. 标题层级整体降级一级 (H1->H2, H2->H3, H3->H4, H6保持H6上限)
    const shiftedDown = shiftMarkdownHeadings(md, 1);
    const linesDown = shiftedDown.result.split("\n");
    assert.equal(linesDown[0], "## 一级标题");
    assert.equal(linesDown[1], "正文段落");
    assert.equal(linesDown[2], "### 二级小节");
    assert.equal(linesDown[3], "#### 三级子项");
    assert.equal(linesDown[4], "###### 六级上限");
    assert.equal(shiftedDown.shiftedCount, 3); // 只有3个未达上限的标题发生了变动

    // 2. 标题层级整体升级一级 (H2->H1, H1保持H1下限)
    const shiftedUp = shiftMarkdownHeadings(shiftedDown.result, -1);
    const linesUp = shiftedUp.result.split("\n");
    assert.equal(linesUp[0], "# 一级标题");
    assert.equal(linesUp[2], "## 二级小节");
});

test("ensureLineAffixes: idempotently ensures prefixes and suffixes on each line", () => {
    const raw = `
apple
'banana',
cherry
`.trim();

    // 1. 构造 SQL/数组单引号与尾随逗号 (幂等防重)
    const resSql = ensureLineAffixes(raw, {prefix: "'", suffix: "',"});
    const linesSql = resSql.split("\n");
    assert.equal(linesSql[0], "'apple',");
    assert.equal(linesSql[1], "'banana',"); // banana 原本已有，不重复加前缀与后缀
    assert.equal(linesSql[2], "'cherry',");

    // 2. 构造 Markdown 任务列表前缀
    const tasks = "任务一\n- [ ] 任务二\n任务三";
    const resTasks = ensureLineAffixes(tasks, {prefix: "- [ ] "});
    assert.equal(resTasks, "- [ ] 任务一\n- [ ] 任务二\n- [ ] 任务三");
});

test("regexReplaceMultiline: matches line start and end anchors across multi-line text", () => {
    const lines = "first\nsecond\nthird";

    // 1. 行首锚点 ^ 插入
    const withPrefix = regexReplaceMultiline(lines, "^", "-> ");
    assert.equal(withPrefix, "-> first\n-> second\n-> third");

    // 2. 行尾锚点 $ 追加
    const withSuffix = regexReplaceMultiline(lines, "$", " ;");
    assert.equal(withSuffix, "first ;\nsecond ;\nthird ;");
});

test("Regex macro enhancement: evaluates multiline anchors via mreplace", () => {
    const now = new Date(2026, 9, 29, 12, 0, 0);

    // 1. 冒号子命令 mreplace 行首加前缀
    const tpl1 = "列表：\n{{xlc:regex:mreplace|^|* |Java\nPython\nGo}}";
    const res1 = applyPlaceholders(tpl1, now, true);
    assert.equal(res1, "列表：\n* Java\n* Python\n* Go");

    // 2. 管道参数语法 mreplace 行尾加逗号
    const tpl2 = "{{xlc:regex|mreplace|$|,|100\n200\n300}}";
    const res2 = applyPlaceholders(tpl2, now, true);
    assert.equal(res2, "100,\n200,\n300,");
});
