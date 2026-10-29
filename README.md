# 小驴常用 (Lv Common)

> **思源笔记的高频内容资产层与跨平台极速调用中枢**<br>
> 将零散的代码片段、客服话术、Prompt 提示词、常用表格、文本模板沉淀为有元数据、有来源追溯、可参数化动态求值的思源笔记原生块资产。

[![CI](https://github.com/ai68298100/xiaolv-common/actions/workflows/ci.yml/badge.svg)](https://github.com/ai68298100/xiaolv-common/actions/workflows/ci.yml)
[![Version](https://img.shields.io/github/v/tag/ai68298100/xiaolv-common?label=%E7%89%88%E6%9C%AC&sort=semver)](https://github.com/ai68298100/xiaolv-common/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 💡 为什么需要小驴常用？

在日常使用电脑、写作、编码、沟通时，我们每天都在重复输入大量相同或相似的内容：公司的开票资料、固定的客户答复话术、精调好的 AI 提示词（Prompt）、一段经常调用的 SQL 或脚手架代码。

传统的解决方案往往有明显痛点：
- **痛点 1：传统外部剪贴板/常用语工具脱离知识库**
  外部工具存的数据是孤岛，无法双向关联到笔记，无法利用思源强大的双链体系；一旦修改，到处都是陈旧版本。
- **痛点 2：静态内容无法适应动态上下文**
  复制出来的话术或模板，常常需要手动修改“客户姓名”、“当前日期”、“订单金额”、“指定选项”，人工改字极其容易漏改、改错。
- **痛点 3：全库笔记中沉淀的高价值片段难以秒级调取**
  写在某篇笔记里的优质金句、核心配置或任务清单，想用的时候往往需要翻箱倒柜搜索，打断心流。

**小驴常用的解决方案**：
- **以思源真实块为唯一真源**：每条常用语都锚定在真实思源块上，拥有完整属性与双链回溯能力，来源块失效或移动状态一目了然。
- **动态变量填参与宏求值引擎**：模板内嵌可变槽位、自然语言日期算术、随机选项、大写金额、安全脱敏，调用前秒级填参生成，告别死模板。
- **毫秒级拼音搜索与全域内容终端**：拼音首字母缩写秒搜，别名 Tab 闪电直达；支持零 SQL 穿透检索全库笔记，一键收录为常用资产。
- **跨平台全局可用**：提供成熟的窗口桥、协议命令与 Quicker / Raycast / AutoHotkey 联动脚本，在微信、Word、浏览器、IDE 中任意上屏。

---

## 🎯 五大典型使用场景

| 场景 | 典型内容 | 小驴常用赋能特性 |
| :--- | :--- | :--- |
| **👩‍💼 客服支持与运营沟通** | 售后指引、退换货条款、问候致谢、物流查询说明 | 动态变量卡片 `{{xlc:ask:客户名}}` 填参、语境自适应问候宏 `{{xlc:greeting}}`、手机号/邮箱敏感信息掩码脱敏 `{{xlc:mask}}`、一键复制纯文本 |
| **🤖 AI 提示词 (Prompt) 库** | 结构化 CoT 思维链、角色设定、论文润色、代码 Review 指令 | 选区包裹模式（`⌥⇧W` 划选文本一键包裹进 Prompt 模板）、片段嵌套组合 `{{xlc:snippet:角色设定}}`、多预设方案保存 |
| **💻 研发与技术常用件** | 高频 SQL 模板、Docker/K8s 指令、正则规则、脚手架配置 | 代码语言围栏保留、JSON/Properties 互转、Base64 与 URL 编解码、文本哈希指纹、前置缩进 Tab/空格转换 |
| **📑 商务、采购与财务发票** | 公司开票资质、公户账号、报价单模板、差旅报销说明 | 中文人民币金额大写转换宏 `{{xlc:currency}}`、多行费用数值一键求和汇总 (`sumNumericLines`)、TSV 表格一键转标准 Markdown 表格 |
| **✍️ 知识沉淀与日常写作** | 论文引文标准 (CSL/APA)、会议纪要模板、任务 SOP 清单 | 盘古之白排版加空格 (`formatPanguSpacing`)、Markdown 待办任务清单批量重置、多行自动编号、长文精要摘要提炼 |

---

## 🚀 3 步极速上手指南

### 1. 配置内容库
首次启动插件时，系统会自动弹出引导卡片：
- **新建专用库文档（推荐）**：在现有笔记本中一键创建名为 `小驴常用库` 的专属归档文档；
- **新建独立笔记本**：为常用内容单独创建一个隔离笔记本；
- **绑定已有文档**：选择已有任意文档作为常用语存放地。

### 2. 录入与资产沉淀
- **快捷键唤起**：按 `⌥⇧N`（或 `Alt+Shift+N`）直接打开新建表单；
- **划选收录**：在思源编辑器中选中任意文本，点击浮动工具栏的小驴图标一键存入；
- **剪贴板一键资产化**：在搜索弹窗切到 `📋 剪贴板` 视图，选中任意复制过的历史片段按 `Alt+S` 一秒入库；
- **全域穿透收录**：在搜索工作台直接搜索思源全库笔记，按 `Alt+S` 即可将普通笔记块收录为常用资产。

### 3. 秒级检索与调用
- **呼出主面板**：按顶部工具栏图标，或使用快捷键呼出常用语工作台；
- **快速拼音搜索**：直接敲拼音首字母（如输入 `cwbx` 秒搜 `财务报销`）；
- **执行调用**：
  - `Enter`：将内容直接插入当前思源编辑器光标处；
  - `Ctrl + Enter`（Mac: `⌘ + Enter`）：复制纯文本/富文本到系统剪贴板（供微信/邮件等外部软件粘贴）；
  - `Shift + Enter`：作为实时同步嵌入块插入（源块变动，插入处自动同步更新）；
  - `Alt + Enter`：作为双链块引用插入（`((id '锚文本'))`）；
  - `Alt + 1 ~ 9`：快速插入对应序号条目；`Alt + Shift + 1 ~ 9`：快速复制对应序号条目；
  - `空格键`：唤起 Quick Look 沉浸式居中大卡片预览。

---

## 🛠️ 核心功能与作用全景

### 一、思源原生内容资产层（安全真源）
- **思源块真源原则（Zero-SQL）**：条目即真实思源块，正文严格由思源块管理，元数据走 `custom-xlc-*` 属性，侧车（`loadData`）仅管理本地收藏/排序/UI 偏好，随时可重建迁移。
- **7 种丰富条目形态**：原生识别并支持纯文本 (Text)、Markdown、代码块 (Code，保留语法高亮)、网址 (URL)、图片 (Image)、附件资源 (Asset)、块引用 (Blockref) 与超级块结构 (Structure)。
- **富文本与结构化原生预览**：内置零安全隐患的富文本渲染器，原生支持代码高亮着色、Markdown 任务清单交互样式、表格多列对齐与 Callout 告警卡片化预览（💡 NOTE、🚀 TIP、⚠️ WARNING、🛑 DANGER 等）。
- **场景分类与层次化标签**：预置商务天蓝、客服翡翠绿、开发淡紫、写作暖琥珀、AI 亮靛语义徽标；支持 `/` 斜杠路径多层级标签与级联筛选。
- **智能热度混合排序 (Frecency)**：结合使用频次与时间衰减阶梯（24小时/7天/30天/90天），高频常用条目自适应置顶。
- **别名唯一匹配 Tab 直达**：输入词与条目别名完全吻合且全局唯一时，行内呈现金色 ⚡ 徽标，按 Tab 闪电插入，心流毫无停顿。
- **Space 沉浸大卡片预览**：非输入态按空格键即可弹出居中 720px 沉浸式 Quick Look 大卡片，阅读长文与代码无需受右侧窄栏限制。

### 二、交互式填参表单与选区包裹
- **交互填参卡片**：`{{xlc:ask:客户名}}`（单行输入）、`{{xlc:ask:方案|标准版,旗舰版}}`（下拉单选）、`{{xlc:ask:需求|UI,开发,测试|multi}}`（多选胶囊）、`{{xlc:ask:日期|date}}`（日期拾取器）、`{{xlc:ask:备注|textarea}}`（多行文本输入）。
- **光标选区包裹模式**：支持 `{{xlc:selection}}` 与 `{{xlc:selection|默认内容}}`，在思源编辑器中划选文本即可一键包裹进 Prompt 模板、引用块或代码围栏。
- **变量历史记忆与预设**：自动本地记忆变量最近输入值（LRU 200 项），支持「💾 存为预设方案」与多套方案自由切换。
- **实时展开动态预览**：填写卡底部实时防抖求值并展示展开后预览效果，所见即所得。

### 三、强大动态宏计算引擎（35+ 动态宏体系）
在模板中嵌入 `{{xlc:...}}` 语法，插入或复制时自动完成动态求值与替换：
- **时间与日期**：`{{xlc:date}}`、`{{xlc:time}}`、`{{xlc:datetime}}`、`{{xlc:weekday}}`、`{{xlc:year}}`、`{{xlc:quarter}}`、`{{xlc:month}}`、`{{xlc:day}}`、`{{xlc:timeago}}`（自然语言相对时间，如“刚刚”、“3分钟前”）、`{{xlc:lunar}}`（农历干支生肖年份）、`{{xlc:cron}}`（Cron 表达式自然语言解析）、`{{xlc:greeting}}`（早中晚自适应问候语）。
- **随机生成与采样**：`{{xlc:uuid}}`（标准 UUIDv4）、`{{xlc:id}}`（短 ID）、`{{xlc:nanoid}}`（紧凑安全 NanoID）、`{{xlc:password}}`（高安全密码生成）、`{{xlc:random}}`（等概率随机选择）、`{{xlc:choose}}`（加权概率抽取）、`{{xlc:seq}}`（区间数字序列生成，支持步长、前导零补齐与换行分列）、`{{xlc:randomcolor}}`（随机 HEX/RGB/HSL 色值）、`{{xlc:randomname}}`（拟真中英文随机姓名）。
- **数值、算法与逻辑**：
  - `{{xlc:if|10 > 5|大|小}}` / `{{xlc:if|role == 'admin'|管理员|用户}}`：安全递归无 eval 三元条件判断；
  - `{{xlc:calc|100*1.13}}`：递归下降零 eval 纯数学计算器；
  - `{{xlc:stats|10,20,30,40}}`：均值、中位数、方差与总和快速计算；
  - `{{xlc:thousands|1234567.89}}`：数值千分位逗号添加与清洗；
  - `{{xlc:checksum|hello}}`：CRC32 与 Adler32 十六进制轻量校验和短码；
  - `{{xlc:currency|1234.56}}`：中文人民币大写金额转换；
  - `{{xlc:plural|item|2}}`：英文单词单复数规则与不规则智能转换。
- **文本转换与脱敏保护**：
  - `{{xlc:case:camel|text}}`：全大写、全小写、小驼峰、大驼峰、蛇形等 8 种代码命名规范转换；
  - `{{xlc:radix:16:10|0xFF}}`：二进制/八进制/十进制/十六进制跨进制互转；
  - `{{xlc:smask|keep|13812345678|3|4}}`：任意字符串留头留尾区间脱敏（`138****5678`）；
  - `{{xlc:censor|文本|敏感词|***}}`：敏感词屏蔽与等长星号遮罩；
  - `{{xlc:json|user.name|JSON}}` / `{{xlc:json:keys|JSON}}` / `{{xlc:json:pretty|JSON}}`：安全提取多层属性与数组下标（支持单双引号方括号语法，如 `users[0]["name"]`、`settings["api.key"]`），严密防御原型链穿透，支持格式化与键名提取；
  - `{{xlc:progress|7|10}}` / `{{xlc:progress:circle|3|5}}` / `{{xlc:progress|75}}`：生成方块/圆点/ASCII 多种视觉形态的任务进度条；
  - `{{xlc:shuffle|A,B,C}}`：列表候选项 Fisher-Yates 伪随机均匀打乱；
  - `{{xlc:btruncate|10|你好世界}}`：UTF-8 字节安全边界截断，彻底避免汉字多字节被劈开导致乱码；
  - `{{xlc:initials|思源笔记}}`：中文汉字拼音首字母与英文首字母缩写提取（`SYBJ`）；
  - `{{xlc:repeat|=|20}}`：字符/短语指定次数重复生成；
  - `{{xlc:center|20|标题}}`：中英视觉字宽对称居中对齐填充；
  - `{{xlc:revwords|the quick brown fox}}`：单词级别逆序反转；
  - `{{xlc:escape|a|b|c}}`：宏嵌套管道符 `\|` 转义保护；
  - `{{xlc:slash|C:\Users}}`：反斜杠转义保护；
  - `{{xlc:template|你好 {name}|name=张三}}`：迷你模板变量插值渲染；
  - `{{xlc:snippet:公共头}}`：片段嵌套引用调用（支持环路熔断保护）。

### 四、纯文本与排版工程处理工具箱（70+ 纯函数，动作菜单与表单快捷栏一键执行）
- **Markdown 专业排版与结构化**：
  - Markdown 表格列宽美化与对齐（`beautifyMarkdownTable`，计算 CJK 双倍字宽最大列宽，智能填充空格使整张表格在源码视图完全垂直对齐，自动补齐不对称列）；
  - Markdown 表格矩阵行列转置（`transposeMarkdownTable`，行与列互换，$M^{TT} = M$ 可逆转置）；
  - Markdown Callout 告警提示块智能包装与转换（`formatMarkdownCallout`，支持包装为 GitHub/Obsidian 规范的 `> [!NOTE]` 等 Callout 警告块及折叠语法，支持一键纯净剥离）；
  - Markdown 标题十进制层级序号自动编排与剥离（`numberMarkdownHeadings`，自动编排 `1.`、`1.1`、`1.1.1` 序号或安全剥离）；
  - 盘古之白中英文智能空格排版（`formatPanguSpacing`）；
  - 中英混排标点间距与全半角空白规范化（`formatPunctuationSpacing`）；
  - 全流程综合排版规整（`formatCJKSpacingComprehensive`）；
  - 水平分割线标准化与防 Setext 二级标题误解析保护（`normalizeHorizontalRules`）；
  - 引用块层级升降（`shiftMarkdownBlockquotes`）与引用块扁平化剥离（`flattenMarkdownBlockquotes`）；
  - 代码围栏语言高亮批量补全（`setMarkdownCodeFenceLang`）；
  - 各级标题与缩进列表双向智能互转（`convertHeadingsToList`）；
  - 多级标题大纲目录 TOC 提取与锚点 Slug 生成（`generateMarkdownToc`）；
  - 脚注编号自动重排与底端归集（`normalizeMarkdownFootnotes`）；
  - 超链接批量提取与形态转换（`convertMarkdownLinks`）；
  - 行内粗体、斜体、删除线、代码标记批量剥离（`stripInlineMarkdownFormatting`）。
- **表格数据全能转换**：
  - TSV / CSV 转 Markdown 对称表格；
  - Markdown 表格列对齐方式批量设置（居中、靠右、靠左，`alignMarkdownTableColumns`）；
  - Markdown 表格按指定列排序（`sortLinesByColumn`）与条件筛选（`filterMarkdownTable`）；
  - Markdown 表格导出为标准 RFC 4180 CSV / TSV（`markdownTableToDelimited`）；
  - Markdown 表格导出为 YAML / Properties / JSON 键值对（`markdownTableToKeyValue`）；
  - 键值对 / YAML / JSON 对象快速生成 Markdown 表格（`keyValueToMarkdownTable`）；
  - 多行关键数据自动生成 KPI 核心指标汇总看板卡片（`formatKpiSummaryCard`）。
- **列表与待办深度重整**：
  - 有序与无序列表双向批量互转（`convertListStyle`）；
  - 有序列表断裂序号重新按序连续自增编号（`renumberOrderedList`）；
  - 列表项按拼音/字母自然排序（`sortMarkdownList`）；
  - 多层嵌套列表展开打平或祖先路径展开（`flattenNestedList`）；
  - 列表层级缩进批量升降（`shiftListIndentation`，增加或减少 2 空格）；
  - 列表分隔符智能嗅探与逗号/换行批量互转（`convertListDelimiter`）；
  - Markdown 任务列表进度条与统计（`calculateTaskProgress`）；
  - 待办任务状态智能反转（`invertTaskStatus`）与任务状态筛选提取（`filterTaskItems`）。
- **代码与文本深度清洗**：
  - 代码注释批量安全剥离（状态机追踪单双引号与反引号，保护字符串字面量中的 `//` 和 `#`）；
  - 代码语言智能嗅探（高置信度识别 10+ 门主流语言特征并自动包裹代码块）；
  - 多行日志/任务按前缀标记自动分组聚合（`groupLinesByPattern`）；
  - 变量命名法智能互转（camelCase、snake_case、PascalCase、kebab-case）；
  - Markdown 纯代码块提取并剥离文字解释（`extractCodeBlocksFromMarkdown`）；
  - 多行文本基于列宽网格分栏排版（`formatTextColumnsGrid`）；
  - 多行文本按中英视觉宽度升降序排序（`sortLinesByVisualWidth`）；
  - 多行文本按首字拼音/字母分节大纲生成（`groupLinesByAlphabet`）；
  - 行尾多余空白与不可见 NBSP 严格清洗（`sanitizeLineEndingsAndSpaces`）；
  - 连续多余空行严格归一化压缩与首尾边缘修剪（`normalizeBlankLinesStrict`）；
  - 阿拉伯数字 1~20 与圈号序号符号（`①`~`⑳`）、括号序号双向转换（`convertNumberSymbols`）；
  - 多行数值区间范围筛选（`filterNumericRangeLines`）；
  - 多行文本前后缀幂等补齐（`ensureLineAffixes`）与剥离（`stripAffixes`）；
  - 多行文本集合运算（差集、交集、并集，`setOperationsOnLines`）。

### 五、全域搜索与外部全局联动生态
- **全库块穿透检索 (Omni-Search)**：输入 `@`、`/` 或 `sy:` 穿透搜索思源全库块资产，免写 SQL，支持 `in:路径` 限定范围。
- **连续粘贴取用队列 (Paste Queue)**：多选常用条目设为取用队列，按下 `⌥⇧Q` 连续出栈粘贴填入，大幅提高多表单填写效率。
- **外部桌面全局直喷**：开放 `window.xiaolvCommon` 窗口桥与公开思源协议命令，设置面板提供开箱即用的 Quicker 动作配置、Mac Raycast 脚本与 AutoHotkey 脚本。

### 六、资产健康体检与效率收益透视
- **内容库语法与依赖健康体检中心**：一键全库扫描死链、损坏占位符与嵌套死循环，分级输出诊断报告。
- **打字时间节省与工时收益看板**：基于调用频次与字符数，在设置面板实时量化呈现累计击键节省量与工时收益。

---

## 🔒 设计安全与已知限制说明

- **B-006 Kramdown 写前保守防御**：为杜绝思源底层多层容器块解析失控并恪守块真源原则，新建、正文更新和导入严格执行写前安全检验，支持单行内容或一个完整代码围栏；多段复杂排版请使用代码围栏或块引用。
- **零 SQL 核心依赖红线**：严禁调用 `/api/query/sql`，所有块级操作严格使用官方结构化数据 API。
- **移动端边界**：Android 真实设备触控与图片直接写系统剪贴板受限于移动端宿主沙箱，已做好优雅降级提示。

---

## 🆕 最新更新动态

### [v0.10.66] — 2026-10-29（最新）

全方位质量加固、右键菜单智能分流、搜索未命中回车自愈与界面交互深度优化：
- **右键菜单智能上下文感知分流**：根据当前编辑器是否有划选文本精准分流——有选区时展示选区包裹与划选保存，无选区时展示常用调用、当前块捕获与文档发现，彻底杜绝主右键菜单过度平铺臃肿。
- **搜索无结果一键自愈新建 (`newItem`)**：当检索结果为空且输入框有输入内容时，按 `Enter` 键直接触发将当前输入词带入新建常用语表单，打造 0 鼠标点击心流自愈闭环。
- **作用域过滤输入保护**：移除输入时强制打回 `all` 的异常行为，全面恢复在收藏、最近、剪贴板等作用域下的关键词二次搜索过滤。
- **表格转置上下文正文保护 (`transposeMarkdownTable`)**：智能识别表格区块边界，转置后完整保留表格前后的说明段落与上下文文本。
- **预览窗格动作栏流动排版**：重构 `.xlc-pane-foot` 为自适应流动布局，消除多按钮横向溢出被右侧边框截断的问题。
- **设置面板顶部粘性胶囊导航**：增加 `📦 库配置`、`⚙️ 偏好设置`、`🤖 AI模型`、`🔍 搜索配置`、`🏥 健康体检`、`⚡ 外部联动`、`💾 数据导入导出` 7 大分类快速导航胶囊，一键平滑滚动直达。
- **表单多行输入弹性缩放**：新建表单与快速编辑支持 `resize: vertical` 垂直拉伸与 `50vh` 视口高度保护，显著提升长代码与复杂模板编辑体验。
- **Quick Look 响应式与设计令牌统一**：大卡片样式对齐 R187 令牌体系，设定 `max-width: min(720px, 92vw)` 保证窄屏与分屏呼吸边距，补充高对比度适配。
- **Markdown Callout 告警卡片化原生预览 (`previewRenderer`)**：富文本预览引擎全新支持识别 GitHub/Obsidian 规范的 Callout 语法（`> [!NOTE]`、`> [!TIP]`、`> [!WARNING]`、`> [!DANGER]`、`> [!IMPORTANT]` 等），在主工作台与 Quick Look 大卡片中结构化渲染为高质感提示卡，呈现专属色彩边框、语义化图标（💡/🚀/⚠️/🛑/📌）与正文排版，并在 forced-colors 高对比度模式下赋予专属边框保护。
- **JSON 路径查询增强与原型链安全防御 (`queryJsonPath`)**：属性路径 tokenizer 深度重构，完美支持嵌套引号的方括号复杂语法（如 `settings["api.key"]`、`items[0]['id']`）；严格落地自有属性安全审查（`hasOwnProperty`），坚决拦截 `toString`、`constructor`、`__proto__` 等原型链穿透，杜绝原生函数字面量泄露。
- **Markdown 表格等宽美化列补齐修复 (`beautifyMarkdownTable`)**：针对表头列数少于数据行单元格数的不对称表格，自动补齐表头空单元格与分隔线，彻底杜绝表格美化后列数破损与竖线错位。
- **Callout 转换容错前置空行 (`formatMarkdownCallout`)**：在文本包装或一键剥离还原时，智能容错并跳过文本前置的空白行与连续换行，精准锚定首个有效 Callout 头部。
- **文档与展示体验全面升级**：重新梳理提炼插件整体定位与核心功能全景，更新日志规范化仅展示最新内容并将历史版本优雅折叠收起。
- **全套质量门禁突破**：单元测试正式扩增至 **1010/1010 项全绿**，双向严格负向突变注入验证（突变 130 ~ 136）拦截通过。

<details>
<summary><b>📜 点击展开历史版本演进记录 (v0.1.0 ~ v0.10.65，已折叠)</b></summary>

| 里程碑版本 | 核心更新亮点摘要 | 架构决策 |
| :--- | :--- | :--- |
| **v0.10.65** | 表格等宽美化 (`beautifyMarkdownTable`)、JSON 路径提取宏 (`queryJsonPath` / `{{xlc:json}}`) 与 Callout 转换 | [ADR 0147](./docs/adr/0147-table-beautify-json-macro-and-callout-converter.md) |
| **v0.10.64** | 全面质量优化、生命周期治理 (零泄漏)、语法高亮对齐与交互稳定性提升 | [ADR 0146](./docs/adr/0146-comprehensive-quality-optimization-and-reliability.md) |
| **v0.10.63** | Markdown 标题层级序号编排剥离 (`numberMarkdownHeadings`)、任务进度条宏 (`{{xlc:progress}}`) 与表格行列转置 | [ADR 0145](./docs/adr/0145-heading-numbers-progressbar-and-transpose-table.md) |
| **v0.10.62** | Markdown 标题与列表双向互转 (`convertHeadingsToList`)、列表打乱宏 (`shuffleList` / `{{xlc:shuffle}}`) 与数值区间行过滤 | [ADR 0144](./docs/adr/0144-headings-to-list-shuffle-macro-and-numeric-filter.md) |
| **v0.10.61** | 数字圈号序号互转 (`convertNumberSymbols`)、敏感词遮罩过滤宏 (`censorText` / `{{xlc:censor}}`) 与 Markdown 纯代码块提取 | [ADR 0143](./docs/adr/0143-number-symbols-censor-macro-and-extract-code.md) |
| **v0.10.60** | Markdown 嵌套列表展开打平 (`flattenNestedList`)、任意文本范围脱敏宏 (`maskTextRange` / `{{xlc:smask}}`) 与中英文排版综合规整 | [ADR 0142](./docs/adr/0142-flatten-list-smask-macro-and-cjk-spacing.md) |
| **v0.10.59** | 文本字符视觉宽度度量 (`measureVisualWidth`)、动态三元条件求值宏 (`{{xlc:if}}`) 与列表缩进批量升降 | [ADR 0141](./docs/adr/0141-visual-width-if-macro-and-shift-indent.md) |
| **v0.10.58** | Markdown 核心指标 KPI 看板卡片生成 (`formatKpiSummaryCard`)、拟真随机姓名宏 (`{{xlc:randomname}}`) 与首字拼音分节大纲 | [ADR 0140](./docs/adr/0140-kpi-card-random-name-and-alphabet-group.md) |
| **v0.10.57** | Markdown 引用块扁平化剥离 (`flattenMarkdownBlockquotes`)、单词逆序反转宏 (`{{xlc:revwords}}`) 与行内格式标记批量剥离 | [ADR 0139](./docs/adr/0139-flatten-quotes-revwords-and-strip-inline.md) |
| **v0.10.56** | Markdown 脚注编号重整底端归集 (`normalizeMarkdownFootnotes`)、反斜杠转义宏 (`{{xlc:slash}}`) 与分割线分段归集 | [ADR 0138](./docs/adr/0138-footnotes-slash-macro-and-line-chunks.md) |
| **v0.10.55** | Markdown 任务状态智能反转 (`invertTaskStatus`)、字宽居中对齐宏 (`{{xlc:center}}`) 与分隔符智能嗅探互转 | [ADR 0137](./docs/adr/0137-invert-task-center-macro-and-delim-convert.md) |
| **v0.10.54** | Markdown 列表项拼音自然排序 (`sortMarkdownList`)、字符重复宏 (`{{xlc:repeat}}`) 与文本行视觉宽度排序 | [ADR 0136](./docs/adr/0136-sort-list-repeat-macro-and-sort-by-width.md) |
| **v0.10.53** | Markdown 代码块语言标识批量补全 (`setMarkdownCodeFenceLang`)、宏管道符转义宏 (`{{xlc:escape}}`) 与多列网格分栏排版 | [ADR 0135](./docs/adr/0135-code-fence-lang-escape-macro-and-grid-columns.md) |
| **v0.10.52** | 键值对转 Markdown 表格 (`keyValueToMarkdownTable`)、英文单复数智能切换宏 (`{{xlc:plural}}`) 与多级大纲 TOC 生成 | [ADR 0134](./docs/adr/0134-kv-to-table-plural-macro-and-markdown-toc.md) |
| **v0.10.51** | Markdown 表格转 YAML/键值对 (`markdownTableToKeyValue`)、拼音缩写宏 (`{{xlc:initials}}`) 与多行空行严格归一化 | [ADR 0133](./docs/adr/0133-table-to-kv-initials-macro-and-blank-lines.md) |
| **v0.10.50** | Markdown 超链接批量转换提取 (`convertMarkdownLinks`)、UTF-8 字节截断宏 (`{{xlc:btruncate}}`) 与标点间距排版规整 | [ADR 0132](./docs/adr/0132-markdown-links-btruncate-and-punctuation-spacing.md) |
| **v0.10.40 ~ v0.10.49** | 标点自适应纠错、文本混淆、代码注释切换、单位间距、括号平衡、集合运算、进制转换等 30+ 纯函数工具扩展 | [CHANGELOG.md](./CHANGELOG.md) |
| **v0.10.0 ~ v0.10.39** | 纯文本清洗工具箱、模板参数化表单、变量预设记忆、全库穿透检索 (Omni-Search)、Quicker/Raycast 联动直喷 | [CHANGELOG.md](./CHANGELOG.md) |
| **v0.1.0 ~ v0.9.x** | 原生块真源架构奠定、拼音搜索、双链回溯、导出脱敏与基础功能搭建 | [CHANGELOG.md](./CHANGELOG.md) |

> 📌 完整的 520+ 项研发演进记录与提交历史，请参阅完整版 [CHANGELOG.md](./CHANGELOG.md)。
</details>

---

## ⌨️ 常用快捷键速查

| 快捷键 (Windows/Linux) | 快捷键 (macOS) | 触发位置 | 动作效果 |
| :--- | :--- | :--- | :--- |
| `Alt + Shift + N` | `⌥ + ⇧ + N` | 全局 | 打开新建常用语录入表单 |
| `Alt + Shift + V` | `⌥ + ⇧ + V` | 全局 | 一步快速捕获当前剪贴板入库 |
| `Alt + Shift + W` | `⌥ + ⇧ + W` | 编辑器 | 用常用模板包裹当前选中文本 |
| `Alt + Shift + Q` | `⌥ + ⇧ + Q` | 全局 | 连续粘贴队列出栈填入下一项 |
| `Enter` | `Enter` | 常用工作台 | 将选中条目直接插入当前编辑器光标处 |
| `Ctrl + Enter` | `⌘ + Enter` | 常用工作台 | 复制选中条目纯文本/富文本到系统剪贴板 |
| `Shift + Enter` | `Shift + Enter` | 常用工作台 | 将选中条目作为实时同步嵌入块插入 |
| `Alt + Enter` | `⌥ + Enter` | 常用工作台 | 将选中条目作为思源双链块引用插入 |
| `Alt + 1 ~ 9` | `⌥ + 1 ~ 9` | 常用工作台 | 闪电直达：直接插入对应序号条目 |
| `Alt + Shift + 1 ~ 9` | `⌥ + ⇧ + 1 ~ 9` | 常用工作台 | 闪电直达：直接复制对应序号条目 |
| `Space (空格)` | `Space (空格)` | 常用工作台 (非输入态) | 唤起/关闭 Quick Look 居中沉浸大卡片预览 |
| `Tab` | `Tab` | 常用工作台 (输入态) | 别名唯一匹配时闪电直达插入；或切换预览操作区焦点 |
| `Alt + S` | `⌥ + S` | 常用工作台 | 一键收录：将剪贴板条目或全库检索块沉淀入库 |
| `Alt + T` | `⌥ + T` | 常用工作台 | 顺序轮转作用域（全部/常用/最近/收藏/剪贴板/全域） |
| `Alt + P` | `⌥ + P` | 常用工作台 | 切换窗口固定常驻模式（连续取用不关闭窗口） |

---

## 🐴 小驴系列插件家族

小驴系列插件均坚持本地优先与思源原生块体系设计，各模块可按需安装并协同联动：

| 插件 | 核心定位 | 开源仓库 |
| :--- | :--- | :--- |
| **小驴常用** | 内容资产复用层、模板参数化与极速调用中枢 | [ai68298100/xiaolv-common](https://github.com/ai68298100/xiaolv-common) |
| **小驴雷切** | 统一导航与工作上下文平台，连接页签、工作台与快捷入口 | [ai68298100/siyuan-speed-switch](https://github.com/ai68298100/siyuan-speed-switch) |
| **小驴打卡** | 本地优先的习惯、目标打卡与复盘看板 | [ai68298100/siyuan-checkin](https://github.com/ai68298100/siyuan-checkin) |
| **小驴人脉** | 在思源中沉淀人际网络、联系人画像与互动足迹 | [ai68298100/siyuan-contacts](https://github.com/ai68298100/siyuan-contacts) |
| **小驴拾遗** | 思源剪藏与深度阅读管理工作台 | [ai68298100/siyuan-glean](https://github.com/ai68298100/siyuan-glean) |
| **小驴考试** | 本地题库备考工作台，刷题、模考与错题本复盘 | [ai68298100/siyuan-exam](https://github.com/ai68298100/siyuan-exam) |
| **小驴管家** | 家庭档案、生活资产台账与到期事务中枢 | [ai68298100/siyuan-home](https://github.com/ai68298100/siyuan-home) |

---

## 💬 交流与反馈

- **内测交流 QQ 群**：**871707735**（欢迎反馈 Bug、交流模板方案与提出新功能需求）
- **Issue 讨论区**：[GitHub Issues](https://github.com/ai68298100/xiaolv-common/issues)
- **开源协议**：[MIT License](./LICENSE)
