# ADR 0134：键值对转Markdown表格、英文单复数智能切换宏与多级标题大纲TOC生成 (KV to Table, Plural Macro & Markdown TOC Generation)

## 状态
已接受，T-0470~T-0474（2026-10-29）。

## 背景与上下文
在思源笔记内容资产的数据展示、模板语法动态渲染与长篇大纲梳理场景中，存在三类高频实用痛点：
1. **键值对或 JSON 文本一键生成 Markdown 表格**：
   用户在编写配置笔记、接口契约或参数清单时，常常持有 Properties（`key=value`）、YAML（`key: value`）、JSON 对象或箭头定义（`key -> value`）。需要将其自动格式化为美观对称的双列 Markdown 表格（`| 键名 | 取值 |`），并自动对键值中出现的 `|` 执行转义保护；
2. **英文单词单复数智能切换引擎与 `{{xlc:plural}}` 动态宏**：
   在代码生成器、表单模板及英文文案中，同一词汇常需要根据外部参数动态调整单复数（如 `1 item` vs `2 items`，`1 category` vs `3 categories`，`1 person` vs `5 people`）。用户需要动态宏自动完成不规则变化与规则词尾转换；
3. **Markdown 各级标题大纲目录（TOC）纯函数提取与生成**：
   在长文快速导航、导读索引及电子书排版时，用户需要一键根据各级标题（`#` ~ `######`）提取生成缩进严密、携带锚点链接的 TOC 列表，同时必须精准避开代码块（` ``` `）内部的 Shell 注释符号。

## 决策与落地
1. **键值对文本或 JSON 转 Markdown 表格转换引擎 (`keyValueToMarkdownTable`)**：
   - 纯函数实现，自动兼容 JSON 对象、YAML、Properties 及自定义分隔符；
   - 自动生成标准 Markdown 表头与左对齐分隔行，自动转义管道符 `\|`；
   - 动作菜单接线「📊 转换键值对为 Markdown 表格并复制」，表单格式栏接入「✦ 键值转表格」。
2. **英文单复数智能切换引擎 (`pluralizeText`) 与 `{{xlc:plural}}` 动态宏**：
   - 纯函数实现，覆盖 `ies`、`ves`、`es`、`s` 规则变化与常见不规则复数表（`person` -> `people`, `man` -> `men`, `knife` -> `knives`）；
   - 支持根据动态数量判定（数量为 1 为单数，其余为复数）；
   - 扩展动态宏体系 `{{xlc:plural|item}}`、`{{xlc:plural|item|1}}`、`{{xlc:plural|category|2}}`、`{{xlc:plural:singular|people}}`；
   - 表单变量栏补充 `{{xlc:plural|item|2}}`。
3. **Markdown 文本各级标题大纲目录（TOC）纯函数提取引擎 (`generateMarkdownToc`)**：
   - 纯函数实现，过滤代码围栏行，提取 H1~H6 标题级别，计算相对缩进空格，生成干净的 GitHub/SiYuan 兼容小写 Slug 锚点；
   - 支持无序列表（`- [title](#slug)`）与有序列表（`1. [title](#slug)`）双重风格；
   - 动作菜单接线「📑 提取多级标题目录 (TOC) 并复制」，表单格式栏接入「✦ 提取目录TOC」。
4. **自动化门禁与双向严格负向验证**：
   - 新增 `tests/r360-kvtotable-pluralmacro-and-markdowntoc.test.cjs` 专项测试；
   - 负向突变 99 破坏键值表格转换输出，负向突变 100 破坏代码围栏过滤逻辑，两项负向测试均被精确拦截；
   - 源码恢复后复验全绿通过，单元测试总数达到 959/959 项。

## 结果与证据
- 单元测试增至 **959/959 项全绿**，耗时 ~7.2s；
- 负向违规注入测试精确拦截率 100%；
- TypeScript 类型检查 0 错误（`pnpm run check`）；
- 异常处理安全检查通过（`pnpm run check:errors`）；
- 变更日志检查通过（`pnpm run check:changelog`）；
- 包资源检查校验通过（`pnpm run check:package`，版本 0.10.52）；
- Webpack 生产构建产出 `./package.zip`。
