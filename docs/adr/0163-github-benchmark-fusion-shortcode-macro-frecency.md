# ADR 0163：GitHub 对标三巨头能力融合（:shortcode 简码直达、宏引擎扩展与 Frecency 智能排序）

## 状态
已接受，T-0741~T-0745（2026-10-31）。

## 背景与上下文
深入调研 GitHub 顶级开源对标产品（[`espanso/espanso`](https://github.com/espanso/espanso)、[`SilentVoid13/Templater`](https://github.com/SilentVoid13/Templater)、[`microsoft/PowerToys`](https://github.com/microsoft/PowerToys)），针对「小驴常用」在常用语扩展领域的真实使用痛点，落地四大核心能力融合：
1. **触发简码绑定与极速置顶（借鉴 Espanso）**：为常用条目绑定 `:shortcode`（如 `:wk` 代表周报、`:mtg` 代表会议纪要），搜索框输入 `:wk` 时享受 +500 阶梯极速置顶加权与 Tab 闪电直达；
2. **显式光标落点锚定与微表单宏扩展（借鉴 Espanso + Templater）**：
   - 支持 `{{cursor}}` 与 `$|$`（以及兼容已有的 `{{xlc:cursor}}`）光标锚点，并提供 `extractCursorPosition` 准确定位落点偏移；
   - 相对日期偏移支持 `{{date+Nd}}`、`{{date-Nd}}`、自定义格式 `{{date:YYYY年MM月DD日}}` 及 ISO 周次 `{{date:gggg-[W]ww}}`；
   - 交互式微表单支持 `{{input:字段名}}` / `{{input:字段名=默认值}}`、`{{select:字段名:选项A|选项B}}` 及 `{{choice:...}}`；
3. **Frecency 智能热度排序（借鉴 PowerToys）**：结合总使用频次与时间半衰期衰减综合打分（`scoreFrecency`），优化 `common.recent` 与最近使用排序，彻底解决偶发误点条目长期霸占首位的问题；
4. **双态实时预览（Live Macro Preview，消除盲插焦虑）**：在常用面板选中含宏条目时，右侧窗格同时展示「📝 模板源码」（`pre.xlc-preview-source-code`）与「⚡ 展开后真实效果」（`div.xlc-preview-expanded-body`），并符合 W3C `role="region"` 与 `role="heading"` `aria-level="3"` 无障碍规范。

## 决策与落地
1. **条目模型与简码检索 (`src/constants.ts`, `src/model/item.ts`, `src/model/search.ts`, `src/ui/dialog.ts`)**：
   - 注册 `ATTR.shortcode: "custom-xlc-shortcode"`；
   - 提供 `cleanShortcode` 规范化工具，支持前缀补齐 `:` 与防注入截断；
   - 在 `search.ts` 中引入 `SHORTCODE_EXACT_MATCH_BOOST` (+500) 与 `SHORTCODE_PREFIX_MATCH_BOOST` (+250)；
   - 实现 `findExactShortcodeMatch` 支持输入框内唯一命中按 Tab 极速插入；
   - 弹窗条目渲染专属 `xlc-badge--shortcode` 徽标。
2. **宏引擎与日期算术扩展 (`src/model/variables.ts`, `src/model/placeholders.ts`, `src/service/commands.ts`)**：
   - 统一 `ASK_PATTERN` 支持 `xlc:ask`、`input:`、`select:`、`choice:`；
   - 增加 `CURSOR_TOKENS` 集合（`{{cursor}}`, `{{xlc:cursor}}`, `$|$`）与 `extractCursorPosition`；
   - `applyPlaceholders` 支持 `{{date+Nd}}`、`{{date-Nd}}`、`{{date:FORMAT}}`、`{{doc.title}}`、`{{doc.path}}`，并在 `commands.ts` 支持 `{{clipboard}}`；
   - 导出 `hasDynamicMacros` 与 `expandMacroPreview`。
3. **Frecency 热度分落地 (`src/model/search.ts`)**：
   - 导出 `scoreFrecency` 纯函数；
   - `listByScope(entries, "recent", ctx)` 与 `compareResults` 对 recent 排序采用 `scoreFrecency` 综合加权，使高频条目稳定领先于偶发单次条目。
4. **双态实时预览组件与设计令牌收拢 (`src/ui/preview-renderer.ts`, `src/ui/dialog.ts`, `src/styles/index.scss`)**：
   - 构建 `renderDualMacroPreview` 纯 DOM 安全渲染器，严格遵守零 innerHTML 原则；
   - 声明 `role="region"`、`role="heading"` `aria-level="3"`、`pre.xlc-preview-source-code` 焦点环与无障碍标签；
   - 样式表全部使用 R187 语义设计令牌，0 硬编码 hex 色值，完整纳入 `@media (prefers-reduced-motion: reduce)`。
5. **质量门禁与负向突变验证 (`tests/r413-benchmark-fusion-shortcode-macro-frecency.test.cjs`)**：
   - 编写全覆盖自动化测试，验证简码加权、宏解析、Frecency 排序与双态预览结构；
   - 实施负向突变 175（篡改 `findExactShortcodeMatch` 返回 null），门禁精准拦截报错，恢复后复验全绿；
   - 全套单元测试突破 **1156/1156 项全绿**，Webpack 生产编译与交互审计 100% 通过。

## 结果与证据
- 单元测试增至 **1156/1156 项全绿**（`pnpm test`）；
- 负向违规注入测试精确拦截率 100%（累计完成 175 轮严格负向验证）；
- 生产截图测试 25/25 张全部通过（`pnpm run test:ui`）；
- UI 交互审计 77/77 全链路 100% 通过（`pnpm run test:ix`）；
- TypeScript 类型检查 0 错误（`pnpm run check`）；
- Webpack 生产构建产出 `dist/index.js 835 KiB`, `dist/index.css 227 KiB`, `./package.zip 691 KiB`。
