# ADR 0133：Markdown表格转键值对与YAML、中文拼音缩写提取宏与多行空行严格归一化 (Markdown Table to KV/YAML, Pinyin Initials Macro & Strict Blank Lines Normalization)

## 状态
已接受，T-0465~T-0469（2026-10-29）。

## 背景与上下文
在思源笔记内容资产的数据结构化整理、缩写快速生成与多行排版清洗场景中，存在三类高频实用痛点：
1. **Markdown 表格转键值对与 YAML / Properties / JSON 导出**：
   用户在笔记中记录配置清单、数据字典或属性列表时，通常采用直观的双列表格（`| key | value |`）。在导入工程项目、编辑配置文件或调用 API 时，需要将表格快速转为标准的 YAML、Properties 或 JSON 对象结构，避免手工复制逐行修改；
2. **中文拼音首字母缩写提取引擎与 `{{xlc:initials}}` 动态宏**：
   在变量命名、代号生成、客户编码或缩写检索时，用户需要快速从中文词组中提取大写的拼音首字母（如 `思源笔记` -> `SYBJ`，`小驴常用` -> `XLCY`），并与英文单词首字母天然融合（如 `Vue 框架` -> `VKJ`，`TypeScript 脚本` -> `TJB`）；
3. **多行文本空行严格归一化与边缘修剪**：
   从网络、聊天记录或 PDF 复制的文本常常伴随大量由空格或制表符构成的假空行，以及连续 3~5 行的多余空段。需要纯函数彻底将空白字符行收敛为纯净空行，并将连续空行严格压缩至最多 $N$ 行（默认 1 行），同时自动修剪文档首尾边缘的悬挂空行。

## 决策与落地
1. **Markdown 表格转键值对与 YAML 引擎 (`markdownTableToKeyValue`)**：
   - 纯函数实现，跳过 Markdown 对齐分隔线行，解析任意指定键列（默认第 0 列）与值列（默认第 1 列）；
   - 支持 `yaml`（含特殊字符引号保护）、`properties`（`k=v`）与 `json`（标准 JSON 对象格式）3 种导出模式；
   - 动作菜单接线「📋 转换 Markdown 表格为 YAML 键值对并复制」，表单格式栏接入「✦ 表格转YAML」。
2. **汉字拼音首字母缩写提取引擎 (`extractChinesePinyinInitials`) 与 `{{xlc:initials}}` 动态宏**：
   - 纯函数实现，深度结合 `pinyin-tiny` 与多音词映射字典，支持中英混排词组首字母提取；
   - 支持大写/小写转换（`uppercase`）与自定义连接符（`separator`，如 `-`）；
   - 扩展动态宏体系 `{{xlc:initials|思源笔记}}`、`{{xlc:initials:lower|思源笔记}}`、`{{xlc:initials|思源笔记|-}}`；
   - 动作菜单接线「🔤 提取汉字拼音首字母缩写并复制」，表单格式栏接入「✦ 拼音首字母」，表单变量栏补充 `{{xlc:initials|思源笔记}}`。
3. **多行文本空行严格归一化压缩引擎 (`normalizeBlankLinesStrict`)**：
   - 纯函数实现，将仅含空白字符的假空行规整为无字符空行，将连续空行严格压缩至指定阈值（默认 1），并自动修剪首尾空行；
   - 动作菜单接线「🧹 严格压缩多余空行并修剪首尾并复制」，表单格式栏接入「✦ 压缩多余空行」。
4. **自动化门禁与双向严格负向验证**：
   - 新增 `tests/r359-tabletokv-initialsmacro-and-blanklines.test.cjs` 专项测试；
   - 负向突变 97 破坏拼音首字母输出，负向突变 98 破坏首尾空行修剪逻辑，两项负向测试均被精确拦截；
   - 源码恢复后复验全绿通过，单元测试总数达到 956/956 项。

## 结果与证据
- 单元测试增至 **956/956 项全绿**，耗时 ~7.1s；
- 负向违规注入测试精确拦截率 100%；
- TypeScript 类型检查 0 错误（`pnpm run check`）；
- 异常处理安全检查通过（`pnpm run check:errors`）；
- 变更日志检查通过（`pnpm run check:changelog`）；
- 包资源检查校验通过（`pnpm run check:package`，版本 0.10.51）；
- Webpack 生产构建产出 `./package.zip`。
