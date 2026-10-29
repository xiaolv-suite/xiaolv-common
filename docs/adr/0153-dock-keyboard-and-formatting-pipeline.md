# ADR 0153：Dock 侧栏键盘上下焦点漫游、CSV 转列表与 URL Query 构建引擎 (Dock Keyboard & Formatting Pipeline)

## 状态
已接受，T-0574~T-0578（2026-10-29）。

## 背景与上下文
在侧栏 (DockView) 成为常驻桌面级货架后，用户提出了进一步的键盘操作与常用文本快速转换诉求：
1. **侧栏全键盘无鼠标操作**：侧栏搜索框输入后，用户希望直接按 `ArrowDown` / `ArrowUp` 漫游选中条目，按 `Enter` 触发直接插入当前选中项，按 `Ctrl+Enter` 触发复制，实现与主搜索弹窗完全一致的盲操体验；
2. **CSV/TSV 快速转 Markdown 列表**：用户从电子表格或网页复制逗号/Tab 分隔的文本，需要在常用语中一键转为规范的 Markdown 无序列表或有序列表；
3. **URL Query 安全序列化与构建**：用户常需要在模板中根据多行键值对反向拼接生成携带参数的 API 或跳转链接。

## 决策与落地
1. **Dock 侧栏键盘上下焦点漫游与快捷插入 (`src/ui/dock-view.ts`)**：
   - 在搜索框监听 `ArrowDown` 与 `ArrowUp`，平滑移动 `activeIndex` 高亮行，并自动调用 `scrollToActiveRow()` 保持选中行在可见视口内；
   - 监听 `Enter`，若当前有选中的高亮条目优先执行插入（无选中则回落第 0 项，无结果且有输入词则跳转新建表单）；
   - 监听 `Ctrl+Enter` / `Meta+Enter`，快捷将选中的条目正文复制到系统剪贴板。
2. **CSV/TSV 转列表引擎与动态宏 (`src/service/text-formatting.ts`, `src/model/placeholders.ts`)**：
   - 实现纯函数 `csvToList(text, delimiter, listPrefix)`，支持按自定义分隔符拆分并自动过滤纯空项；
   - 扩展动态宏：`{{xlc:csv:list|苹果, 香蕉}}`（`- 苹果\n- 香蕉`）、`{{xlc:csv:numbered|步骤1, 步骤2}}`（`1. 步骤1\n2. 步骤2`）、`{{xlc:csv:list|\t|Col1\tCol2}}`。
3. **Key-Value 键值对安全序列化构建 URL Query 引擎与动态宏**：
   - 实现纯函数 `buildUrlQuery(pairsInput, baseUrl?)`，智能解析多行 `k=v` 文本，通过 `URLSearchParams` 安全转义并根据基础 URL 自动选择 `?` 或 `&` 衔接；
   - 扩展动态宏：`{{xlc:url:query|k1=v1\nk2=v2|https://api.io}}` 与 `{{xlc:url:build|k1=v1}}`。
4. **自动化测试与负向门禁验证**：
   - 新增专项测试 `tests/r383-dock-keyboard-and-formatting-pipeline.test.cjs`；
   - 注入负向突变 143（故意破坏 csvToList 转换结果），门禁精准拦截红灯，恢复后复验全绿；
   - 单元测试增至 **1030/1030 项全绿**。

## 结果与证据
- 单元测试增至 **1030/1030 项全绿**；
- 负向违规注入测试精确拦截率 100%（累计完成 143 轮严格负向验证）；
- 生产截图测试 25/25 张全部通过（`pnpm run test:ui`）；
- UI 交互审计 77/77 全链路 100% 通过（`pnpm run test:ix`）；
- TypeScript 类型检查 0 错误（`pnpm run check`）；
- Webpack 生产构建产出 `./package.zip`。
