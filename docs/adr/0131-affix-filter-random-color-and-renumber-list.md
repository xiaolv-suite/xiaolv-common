# ADR 0131：文本行前后缀精准过滤、随机颜色生成宏与有序列表编号自动重排 (Affix Line Filter, Random Color Macro & List Renumbering)

## 状态
已接受，T-0455~T-0459（2026-10-29）。

## 背景与上下文
在思源笔记常用内容资产的日常流转、结构重整与文档大纲维护场景中，存在三类高频实用痛点：
1. **多行文本行按前后缀模式精准过滤与提取**：
   在技术文档摘录、日志审计或代码整理中，用户常常需要从多行文本中提取特定特征行（如以 `import `、`// ` 开头的前缀行，或以 `.ts`、`;` 结尾的后缀行），或反向剔除这些匹配行。传统查找替换操作繁琐，需要纯函数一键式精准过滤；
2. **随机颜色生成引擎与 `{{xlc:randomcolor}}` 动态宏**：
   在编写 CSS 样式表、配置图表系列色、绘制 Markdown 徽标（Shields Badge）或文档彩色高亮卡片时，用户常常需要快速获取一个美观协调的颜色代码（十六进制 HEX、RGB 或 HSL），或限定为明亮纯色（`vibrant`）或柔和粉彩（`pastel`）；
3. **Markdown 有序列表序号混乱重排与自动序列化**：
   用户在思源笔记中频繁删减、粘贴或调整有序列表行，常导致列表编号断裂、重复或错乱（如连续多个 `1. ` 或跳跃的 `5. `、`9. `）。需要纯函数自动将每一缩进层级的编号重排为从 1 开始严格自增的连续序列，同时严密保护多级嵌套子列表独立编号与待办复选框结构。

## 决策与落地
1. **文本行按前后缀模式精准过滤引擎 (`filterLinesByAffix`)**：
   - 纯函数实现，支持 `prefix` 与 `suffix` 两种匹配模式；
   - 支持大小写敏感度开关（`caseSensitive`）、反向剔除匹配（`invert`）与忽略行首缩进选项（`trimBeforeCheck`）；
   - 动作菜单接线「🔍 仅保留以 // 开头的注释行并复制」，表单格式栏接入「✦ 筛选注释行」。
2. **随机颜色值生成引擎 (`generateRandomColor`) 与 `{{xlc:randomcolor}}` 动态宏**：
   - 纯函数实现，支持 `hex`（如 `#3B82F6`）、`rgb`（如 `rgb(59, 130, 246)`）与 `hsl` 输出；
   - 支持 `vibrant`、`pastel`、`dark`、`light` 与 `any` 5 种色调主题算法；
   - 扩展动态宏体系 `{{xlc:randomcolor}}`、`{{xlc:randomcolor:rgb}}`、`{{xlc:randomcolor:hsl}}`、`{{xlc:randomcolor|pastel}}`；
   - 动作菜单接线「🎨 生成随机 HEX 颜色值并复制」，表单格式栏接入「✦ 随机色值」，表单变量栏补充 `{{xlc:randomcolor}}`。
3. **Markdown 有序列表编号自动重排重整引擎 (`renumberOrderedList`)**：
   - 纯函数实现，维护缩进层级编号映射字典（`Map<number, number>`），遇到同层递增，遇到深层嵌套开启子序列，浅层返回时自动重置深层计数器；
   - 支持自定义起始编号（`startNumber`）与括号格式（`style: "parenthesis"`，如 `1) `）；
   - 动作菜单接线「🔢 重新按序重整列表编号 (1, 2, 3...) 并复制」，表单格式栏接入「✦ 序号重排」。
4. **自动化门禁与双向严格负向验证**：
   - 新增 `tests/r357-affixfilter-randomcolor-and-renumberlist.test.cjs` 专项测试；
   - 负向突变 93 破坏前后缀过滤逻辑，负向突变 94 破坏列表重排自增计数，两项负向测试均被精确拦截；
   - 源码恢复后复验全绿通过，单元测试总数达到 948/948 项。

## 结果与证据
- 单元测试增至 **948/948 项全绿**，耗时 ~7.2s；
- 负向违规注入测试精确拦截率 100%；
- TypeScript 类型检查 0 错误（`pnpm run check`）；
- 异常处理安全检查通过（`pnpm run check:errors`）；
- 变更日志检查通过（`pnpm run check:changelog`）；
- 包资源检查校验通过（`pnpm run check:package`，版本 0.10.49）；
- Webpack 生产构建产出 `./package.zip`。
