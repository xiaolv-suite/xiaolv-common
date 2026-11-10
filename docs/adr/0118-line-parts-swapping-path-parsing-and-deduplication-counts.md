# ADR 0118：多行部分位置对调、文件路径与URL结构解析及去重频次统计 (Line Parts Swapping, Path Parsing & Deduplication Counts)

## 状态
已接受，T-0390~T-0394（2026-10-29）。

## 背景与上下文
在思源笔记内容资产层的高频使用与文本工程场景中，存在三类高频实用需求：
1. **多行键值对或分隔列位置对调**：
   在技术配置、数据重构或对照表梳理中，用户常需要将每行按特定分隔符（冒号、等号、箭头、逗号等）将前后两部分对调（如 `key: value` 转换为 `value: key` 或 `source -> target` 转换为 `target -> source`）；
2. **文件路径与 URL 结构化解析**：
   在技术写作、代码引用与文档资产管理中，用户需要快速从完整路径或 URL 中提取各组成部分：父目录（`dir`）、完整文件名（`filename`）、不带扩展名的基本名（`stem`）以及扩展名（`ext`），并支持在模板中无缝引用当前文档各部件（如 `{{xlc:path:filename}}` 提取当前文档文件名）；
3. **多行去重并保留频次统计信息**：
   在分析报错日志、归纳问卷反馈或梳理词频时，简单的去重会丢弃条目的热度信息。用户需要将重复行去重的同时，在行尾或行首标注出现次数，并默认按出现频次降序呈现。

## 决策与落地
1. **多行文本两部分位置互换对调引擎 (`swapLineParts`)**：
   - 纯函数实现，灵活支持配置分隔符（字符串或正则）与输出连接符（`outputSeparator`）；
   - 支持首尾空白修剪（`trimParts: true`）；
   - 动作菜单接线「🔄 对调每行前后两部分位置并复制」，表单格式栏接入「✦ 对调前后」。
2. **文件路径与 URL 结构解析引擎 (`parsePathParts`) 与 `{{xlc:path}}` 动态宏体系**：
   - 纯函数实现，自动处理 Windows/Unix 路径斜杠及 URL 查询参数/Hash；
   - 结构化提取 `dir`, `filename`, `stem`, `ext`；
   - 扩展动态宏体系 `{{xlc:path:filename|...}}`、`{{xlc:path:ext|...}}`、`{{xlc:path:stem|...}}` 与当前活动文档自动回退 `{{xlc:path:filename}}` / `{{xlc:path:ext}}`；
   - 动作菜单接线「📁 提取路径文件名与基本名并复制」，表单格式栏接入「✦ 提取文件名」，表单变量栏补充 `{{xlc:path:filename}}` 与 `{{xlc:path:ext}}`。
3. **多行文本去重并输出行出现频次统计引擎 (`deduplicateWithCount`)**：
   - 纯函数实现，支持按频次降序排列（`sortByCount: true`）；
   - 支持自定义模板（默认 `{line} ({count})`，支持 `{count}` 与 `{line}` 占位符）；
   - 动作菜单接线「📊 统计多行频次去重并按热度排序复制」，表单格式栏接入「✦ 频次去重」。
4. **自动化门禁与双向严格负向验证**：
   - 新增 `tests/r344-swapparts-path-and-dedupecount.test.cjs` 专项测试；
   - 注入负向破坏行位置对调顺序与路径扩展名点号判定，确认两项负向测试均被精准拦截；
   - 源码恢复后复验全绿通过，单元测试总数达到 898/898 项。

## 结果与证据
- 单元测试增至 **898/898 项全绿**，耗时 ~7.2s；
- 负向违规注入测试精确拦截率 100%；
- TypeScript 类型检查 0 错误（`pnpm run check`）；
- 异常处理安全检查通过（`pnpm run check:errors`）；
- 变更日志检查通过（`pnpm run check:changelog`）；
- 包资源检查校验通过（`pnpm run check:package`，版本 0.10.36）；
- Webpack 生产构建产出 `./package.zip`。
