# ADR 0161：变量填充卡、预设管理与平台标题栏无障碍与触控靶点收敛 (Variable Fill Card, Preset Bar and Platform Title Wrap A11y & Touch Target Convergence)

## 状态
已接受，T-0731~T-0735（2026-10-31）。

## 背景与上下文
遵循 UI/UX Pro Max (`ui-ux-pro-max`) 设计智能准则与 WCAG 2.2 AA / AAA 级标准，对变量填充卡（`openVariableFillCard`）、预设管理栏、快捷候选项胶囊行以及全弹窗通用品牌标题栏组件（`mountPlatformDialogTitleWrap`）进行系统性可访问性审视，定位到如下体验缺陷：
1. **变量填充卡标题栏与底栏缺少语义工具栏与键盘漫游**：卡片顶栏 `.xlc-varform-head` 与底栏 `.xlc-varform-foot` 此前为普通容器，未声明 W3C ARIA `role="toolbar"`；底栏的取消、恢复默认、复制与插入等核心操作按钮不支持 `ArrowRight` / `ArrowLeft` 水平键盘漫游轮巡与 `Home` / `End` 极值跳转，取消与插入按钮缺少显式 `aria-label`；
2. **快捷候选项胶囊与预设方案管理栏工具栏语义缺失**：单字段下的快捷候选项胶囊行 `.xlc-varform-quick-options` 与预设方案栏 `.xlc-varform-preset-wrap` 未声明 `role="toolbar"` 与独立 `aria-label`；候选项胶囊按钮缺少左右方向键漫游轮巡；
3. **平台品牌标题栏组件结构无障碍断层**：全插件 10 余处 Dialog 统一装配的 `mountPlatformDialogTitleWrap` 内部标题层 `.lv-dialog-title-wrap` 未声明 `role="heading"` 与 `aria-level="1"`，使得盲人读屏用户进入弹窗后难以通过标题路标快速定位对话框主旨；装饰性 SVG 图标未标记 `aria-hidden="true"`，版本胶囊标签未声明 `role="status"` 与 `font-variant-numeric: tabular-nums`；
4. **触控靶点与动效降级规范收口**：变量填充卡底栏按钮、候选项胶囊与移动端深色悬浮新建按钮（FAB）需满足 WCAG 2.2 触控靶点规范（$\ge 24\times 24$ px），并具备标准 `:focus-visible` 高对比度焦点环与 `@media (prefers-reduced-motion: reduce)` 瞬态动效抑制。

## 决策与落地
1. **变量卡标题栏与操作底栏 toolbar 语义及键盘漫游 (`src/ui/variable-form.ts`)**：
   - 为 `.xlc-varform-head` 声明 `role="toolbar"` 与 `aria-label="变量卡标题栏"`；
   - 为 `.xlc-varform-foot` 声明 `role="toolbar"`、`aria-label="变量卡操作栏"`，并注入 `ArrowRight` / `ArrowLeft` 水平键盘漫游轮巡与 `Home` / `End` 快捷导航；
   - 为取消按钮与插入按钮补齐显式 `aria-label`。
2. **变量预设工具栏与候选项胶囊 toolbar 语义及按键漫游 (`src/ui/variable-form.ts`)**：
   - 为快捷候选项行 `.xlc-varform-quick-options` 声明 `role="toolbar"`、`aria-label="快捷候选项"` 与左右按键漫游；
   - 为预设管理栏 `.xlc-varform-preset-wrap` 声明 `role="toolbar"`、`aria-label="预设方案操作栏"` 与交互控件间水平漫游。
3. **统一品牌标题栏组件 heading/status 语义及版本等宽排版 (`src/ui/dialog-dom.ts`, `src/styles/index.scss`)**：
   - 为 `.lv-dialog-title-wrap` 声明 `role="heading"`、`aria-level="1"` 与包含标题和版本的完整 `aria-label`；
   - 为装饰图标 `.lv-dialog-title-icon` 注入 `aria-hidden="true"`；
   - 为版本胶囊 `.lv-dialog-title-pill` 声明 `role="status"`、`aria-label="插件版本：${badgeText}"` 与 `font-variant-numeric: tabular-nums; letter-spacing: -0.01em;`。
4. **触控靶点、高对比度焦点环与样式收拢 (`src/styles/index.scss`)**：
   - 将 `.xlc-varform-foot .b3-button` 最小高度统一收敛至 28px，并配置 `:focus-visible` 高对比度轮廓圈（`outline: 2px solid var(--xlc-accent); outline-offset: 1px;`）；
   - 为 `.xlc-quick-option-pill` 注入 `min-height: 24px;` 触控靶点；
   - 为实时展开预览容器 `.xlc-varform-preview` 注入 `font-variant-numeric: tabular-nums; letter-spacing: -0.01em;`；
   - 为移动端悬浮新建键 `.xlc-fab-new` 注入 `:focus-visible` 焦点环（`outline: 2px solid var(--xlc-accent); outline-offset: 2px;`）；
   - 将 `.xlc-quick-option-pill`、`.xlc-varform-foot .b3-button` 与 `.xlc-fab-new` 统一纳入 `@media (prefers-reduced-motion: reduce)` 瞬态降级规范。
5. **自动化测试与负向门禁验证 (`tests/r411-variable-card-and-title-wrap-a11y.test.cjs`)**：
   - 编写全覆盖自动化契约测试，断言变量卡 head/foot toolbar 语义、快捷候选项/预设栏漫游、标题栏 heading/status 属性及样式表属性；
   - 实施负向突变 173（篡改平台标题栏 heading 角色触发红灯），门禁精准拦截报错，恢复后复验通过；
   - 全套单元测试正式突破 **1148/1148 项全绿**。

## 结果与证据
- 单元测试增至 **1148/1148 项全绿**（`pnpm test`）；
- 负向违规注入测试精确拦截率 100%（累计完成 173 轮严格负向验证）；
- 生产截图测试 25/25 张全部通过（`pnpm run test:ui`）；
- UI 交互审计 77/77 全链路 100% 通过（`pnpm run test:ix`）；
- TypeScript 类型检查 0 错误（`pnpm run check`）；
- Webpack 生产构建产出 `./package.zip`。
