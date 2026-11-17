# ADR 0148：全方位质量加固、Markdown Callout 告警卡片化预览与原型链安全防御 (Quality Hardening, Callout Preview & Prototype Defense)

## 状态
已接受，T-0540~T-0544（2026-10-29）。

## 背景与上下文
随着小驴常用插件能力演进至 1000+ 单元测试和 70+ 纯函数工具箱，对核心内容资产的稳定性、排版质感与安全防御提出了更高要求：
1. **Markdown 表格等宽列补齐对称性**：
   在 `beautifyMarkdownTable` 处理不对称表格（如表头列数少于数据行单元格数）时，原逻辑仅对数据行补齐，未补齐表头行，导致美化后的表头列数破损、竖线与数据列错位；
2. **JSON 路径查询引号嵌套与原型链安全防御**：
   在 `queryJsonPath` 中，使用方括号携带单双引号语法（如 `items[0]["name"]`、`settings["api.key"]`）时，原字符切分逻辑未剥除引号且对包含点号的键名过度拆分，导致查询失败；同时，在访问对象不存在的属性时若撞上 JavaScript 原型链属性（如 `toString`、`constructor`、`__proto__`），会意外泄露原生函数字符串而非返回 fallback，存在原型穿透风险；
3. **Markdown Callout 转换容错前置空行**：
   在 `formatMarkdownCallout` 包装或剥离 Callout 时，若文本带有前导空行，原有固定首行判定导致头部匹配失效与冗余嵌套；
4. **Markdown Callout 告警提示块原生卡片化渲染**：
   原富文本预览器 `previewRenderer` 将所有以 `>` 开头的行一律降级为普通灰色引用块，缺乏对现代知识库主流规范 Callout（`> [!NOTE]` 等）的语义化着色、图标与卡片呈现；
5. **文档与更新日志结构化治理**：
   根据用户指示，梳理插件的整体定位、核心功能与作用，更新日志规范化为仅展示最新内容，历史版本优雅折叠收起。

## 决策与落地
1. **Markdown 复杂表格列补齐对称性修复 (`beautifyMarkdownTable`)**：
   - 在计算全局最大列数 `colCount` 后，确保表头行与所有数据行均补齐至 `colCount` 列，保证表头、分隔线与数据行结构严格对称垂直对齐。
2. **JSON 路径查询增强与原型链安全防御 (`queryJsonPath`)**：
   - 编写状态机属性路径 Tokenizer，完整支持方括号内嵌套单双引号与转义符的复杂键名（如 `settings["api.key"]`）；
   - 严格进行自有属性审查（`Object.prototype.hasOwnProperty.call(cur, seg)`），对于数组允许访问数字索引与 `length`，坚决拦截任何原型链继承属性访问。
3. **Callout 转换容错前置空行 (`formatMarkdownCallout`)**：
   - 智能寻找首个有效非空行作为 Callout 头部候选行，彻底杜绝前置空白行导致的匹配遗漏与双重嵌套。
4. **Markdown Callout 告警卡片化原生预览 (`previewRenderer` & SCSS)**：
   - `parseMarkdownBlocks` 扩展识别 GitHub/Obsidian 规范的 `> [!TYPE] Title`，提取连续引用行生成结构化 `callout` 块；
   - `renderSafePreview` 将其结构化渲染为高质感提示卡片，配备专属语义色彩（NOTE 蓝、TIP 绿、WARNING 暖橙、DANGER 绯红、IMPORTANT 紫等）、语义化图标（💡/🚀/⚠️/🛑/📌）与正文排版；
   - 设计令牌 `tokens-r187.scss` 补充 Callout 样式体系，并在 forced-colors 高对比度模式下赋予专属 1px CanvasText 边框与背景适配。
5. **文档与展示体验全面升级**：
   - 梳理提炼插件整体定位与核心功能全景，更新日志中仅展示最新 `v0.10.66` 更新亮点，历史演进记录使用 `<details><summary>` 折叠收起。
6. **自动化门禁与双向严格负向验证**：
   - 新增 `tests/r374-quality-and-callout-enhancement.test.cjs` 专项测试；
   - 注入负向突变 130（破坏表头列补齐）、负向突变 131（破坏原型链安全防御）、负向突变 132（破坏前置空行容错），三项负向测试均被精确拦截；
   - 源码恢复后复验全绿通过，单元测试总数扩增至 **1004/1004 项全绿**。

## 结果与证据
- 单元测试增至 **1010/1010 项全绿**，耗时 ~7.1s；
- 负向违规注入测试精确拦截率 100%（累计完成 136 轮严格负向验证，涵盖突变 130~136）；
- TypeScript 类型检查 0 错误（`pnpm run check`）；
- 异常处理安全检查通过（`pnpm run check:errors`）；
- 变更日志检查通过（`pnpm run check:changelog`）；
- 包资源检查校验通过（`pnpm run check:package`，版本 0.10.66）；
- Webpack 生产构建产出 `./package.zip`。
