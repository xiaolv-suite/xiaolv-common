// @ts-check
const assert = require("node:assert/strict");
const path = require("node:path");

console.log("Starting text-formatting (pangu) tests...");

// 读取 entry 或本地编译库
const entry = require("./.build/entry.cjs");
const { formatPanguSpacing, normalizeSnippetTypography } = entry.textFormatting;

// 1. 中英文与数字自动补充半角空格
assert.equal(
    formatPanguSpacing("优化React性能30%"),
    "优化 React 性能 30%",
    "中英文字符与数字之间必须补充半角空格"
);

assert.equal(
    formatPanguSpacing("Hello世界"),
    "Hello 世界",
    "英文与中文之间必须补充半角空格"
);

// 2. 保护 URL 链接不被破坏
assert.equal(
    formatPanguSpacing("请访问https://github.com/ai68298100/xiaolv-common仓库查阅"),
    "请访问 https://github.com/ai68298100/xiaolv-common 仓库查阅",
    "URL 链接内部不能被插入空格，两端与中文之间必须加空格"
);

// 3. 保护行内代码与代码块
assert.equal(
    formatPanguSpacing("在终端运行`pnpm test`即可测试"),
    "在终端运行 `pnpm test` 即可测试",
    "行内代码块内部不应被修改，两端应正确与中文分隔"
);

// 4. 冗余空格清理
assert.equal(
    formatPanguSpacing("文本   多空格   测试"),
    "文本 多空格 测试",
    "连续多余空格应规范化为单一空格"
);

console.log("✓ text-formatting 盘古之白排版测试全部通过！");
