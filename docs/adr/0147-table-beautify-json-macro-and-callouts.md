# ADR 0147：Markdown表格等宽美化、JSON路径查询宏与Callout告警块转换 (Table Beautify, JSON Path Macro & Markdown Callouts)

## 状态
已接受，T-0535~T-0539（2026-10-29）。

## 背景与上下文
在思源笔记内容资产的高品质排版、结构化数据模板以及多层级视觉标注场景中，存在三类高频实用痛点：
1. **Markdown 表格源码视觉等宽对齐与美化**：
   手工编写或从各处拼接的 Markdown 表格由于中英文混排与单元格长短不一，源码中竖线错落杂乱难以阅读与校对。用户需要纯函数智能计算包含中英 CJK 双倍宽度的最大列宽，自动填充空格实现各列边框竖线完全垂直对齐，并保持对齐方向（`:---`、`:---:`、`---:`）；
2. **JSON 数据路径安全提取与 `{{xlc:json}}` 动态宏体系**：
   在对接 Webhook 回执、AI 接口响应、日志记录与结构化表单时，用户需要在模板中直接按点号路径或数组下标（如 `user.roles[0].name`、`status`）提取目标字段值，或一键提取顶层键名列表（`keys`）；
3. **Markdown Callout 告警提示块智能包装与转换**：
   在 Obsidian、GitHub 及现代 Markdown 规范中，Callout（如 `> [!NOTE]`、`> [!TIP]`、`> [!WARNING]`）被广泛用于知识库警示与技巧提示。用户需要快速将选中文本或现有引用块包装为指定类型的 Callout，支持折叠语法（`> [!NOTE]- 标题`），并支持一键剥离还原为常规正文。

## 决策与落地
1. **Markdown 复杂表格自动等宽对齐与视觉美化引擎 (`beautifyMarkdownTable`)**：
   - 纯函数实现，自动提取表格区块并识别各列现有对齐方向；
   - 结合中英双倍字宽（CJK 算 2 宽，ASCII 算 1 宽）计算各列视觉极值，为单元格与分隔线填充空格以达到完美的视觉垂直对齐；
   - 动作菜单接线「✨ 美化对齐 Markdown 表格列宽并复制」，表单格式栏接入「✦ 表格列宽美化」。
2. **JSON 数据路径安全提取与查询引擎 (`queryJsonPath`) 与 `{{xlc:json}}` 动态宏**：
   - 纯函数实现，严格 zero-eval 属性键遍历，支持点号与方括号（`a.b[0].c`），支持无效路径 fallback；
   - 扩展动态宏体系 `{{xlc:json|user.name|{"user":{"name":"Alice"}}}}`、`{{xlc:json:keys|{"a":1,"b":2}}}`、`{{xlc:json:pretty|{"x":1}}}`；
   - 动作菜单接线「🔍 提取 JSON 顶层键名并复制」，表单变量栏补充 `{{xlc:json|key|JSON}}`，格式栏接入「✦ 提取JSON键」。
3. **Markdown Callout 告警提示块智能包装与转换引擎 (`formatMarkdownCallout`)**：
   - 纯函数实现，支持 `NOTE`、`TIP`、`IMPORTANT`、`WARNING`、`CAUTION`、`INFO` 等 10 种常见样式；
   - 自动处理已有引用块，避免产生 `> >` 冗余前缀；支持自定义标题与折叠参数；支持 `strip: true` 一键还原；
   - 动作菜单接线「💡 包装为 Callout 提示块 (> [!NOTE]) 并复制」，表单格式栏接入「✦ 包装Callout」。
4. **自动化门禁与双向严格负向验证**：
   - 新增 `tests/r373-tablebeautify-jsonmacro-and-callout.test.cjs` 专项测试；
   - 注入负向突变 127（破坏表格等宽填充）、负向突变 128（破坏 JSON 路径解析）、负向突变 129（破坏 Callout 包装逻辑），三项负向测试均被精确拦截；
   - 源码恢复后复验全绿通过，单元测试总数正式跨越 **1000/1000 项全绿**里程碑。

## 结果与证据
- 单元测试增至 **1000/1000 项全绿**，耗时 ~7.0s；
- 负向违规注入测试精确拦截率 100%（累计完成 129 轮严格负向验证）；
- TypeScript 类型检查 0 错误（`pnpm run check`）；
- 异常处理安全检查通过（`pnpm run check:errors`）；
- 变更日志检查通过（`pnpm run check:changelog`）；
- 包资源检查校验通过（`pnpm run check:package`，版本 0.10.65）；
- Webpack 生产构建产出 `./package.zip`。
