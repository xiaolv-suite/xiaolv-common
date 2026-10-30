# ADR 0160：主弹窗底栏、搜索空态与资产发现无障碍与交互深度收敛 (Empty State, Footer and Discovery Dialog A11y & Interaction Convergence)

## 状态
已接受，T-0726~T-0730（2026-10-31）。

## 背景与上下文
基于 UI/UX Pro Max (`ui-ux-pro-max`) 设计智能与可访问性准则（WCAG 2.2 AA / AAA 级标准）对核心交互界面进行全域深度排查，排查到主搜索弹窗底栏、搜索空态（Empty State）与资产发现对话框（Discovery Dialog）存在如下可用性与无障碍断层：
1. **主搜索弹窗底栏缺少语义工具栏与键盘漫游**：底栏 `.xlc-footer` 内置移动端操作行、使用指南按钮及设置齿轮按钮，此前未声明 W3C ARIA `role="toolbar"`，各按钮缺少独立清晰的 `aria-label`；键盘用户无法通过方向键在底栏动作之间水平轮巡；统计计数文本动态变化时缺少 `role="status"` 宣告与等宽排版（`font-variant-numeric: tabular-nums`）；
2. **搜索空态推荐操作断层**：当关键词无命中或在受限范围（收藏/最近）未检索到条目时，弹窗呈现包含重试、指南、清除筛选、全库回退、全域检索及就地新建等多个操作按钮的 `.xlc-empty` 容器，但容器未声明 `role="status"` 与 `aria-live="polite"`，动作按钮之间未实现键盘左右漫游（`ArrowRight`/`ArrowLeft`）与极值跳转（`Home`/`End`），辅助技术用户在空态下无法流畅感知与穿梭；
3. **资产发现对话框缺少工具栏规范与度量排版**：发现操作底栏 `.xlc-discovery-footer`、筛选栏 `.xlc-discovery-filters` 与关闭确认操作栏 `.xlc-form-actions` 未声明 `role="toolbar"` 与独立 `aria-label`；已选候选条目计数标签未声明 `role="status"` 与 `tabular-nums` 等宽排版；关闭按钮与扫描按钮缺少显式 `aria-label`；
4. **触控靶点与动效降级规范收口**：空态操作按钮、底栏操作按钮与发现对话框操作按钮需确保 $\ge 24\times 24$ px 触控靶点与清晰的 `:focus-visible` 高对比度轮廓圈，并在 `@media (prefers-reduced-motion: reduce)` 下完成瞬态动效抑制。

## 决策与落地
1. **主搜索弹窗底栏 Toolbar 语义与按键漫游 (`src/ui/dialog.ts`)**：
   - 为底栏声明 `role="toolbar"` 与 `aria-label="主弹窗底栏工具栏"`；
   - 注入 `ArrowRight` / `ArrowLeft` 水平键盘漫游轮巡与 `Home` / `End` 快捷导航；
   - 为统计文本 `.xlc-footer-count` 声明 `role="status"`、`aria-live="polite"` 与 `aria-label="条目统计信息"`；
   - 为移动端新建/插入按钮、使用指南按钮与设置齿轮按钮补齐规范的 `aria-label`。
2. **搜索空状态状态播报、推荐操作按键漫游与全量按钮无障碍声明 (`src/ui/dialog.ts`)**：
   - 为 `.xlc-empty` 声明 `role="status"`、`aria-live="polite"` 与 `aria-label="搜索结果为空提示"`；
   - 监听 `empty` 键盘事件，支持用户在所有 `.xlc-empty-action` 推荐按钮间使用 `ArrowRight` / `ArrowLeft` 水平轮巡与 `Home` / `End` 跳转；
   - 为重试按钮、使用指南按钮、清空筛选按钮、全库范围回退按钮及全域笔记检索按钮统一配置显式 `aria-label`。
3. **资产发现对话框操作栏、筛选栏与关闭确认无障碍强化 (`src/ui/discovery-dialog.ts`)**：
   - 为 `.xlc-discovery-footer` 声明 `role="toolbar"`、`aria-label="发现操作栏"` 与键盘左右漫游；
   - 为已选候选条目计数 `.xlc-discovery-selected-label` 声明 `role="status"` 与 `aria-live="polite"`；
   - 为筛选栏 `.xlc-discovery-filters` 与关闭确认操作栏 `.xlc-form-actions` 声明 `role="toolbar"`；
   - 为关闭按钮、停止/重试扫描按钮、保存视图按钮及筛选选择按钮补齐 `aria-label`。
4. **触控靶点、高对比度焦点环与样式收拢 (`src/styles/index.scss`)**：
   - 在 `index.scss` 中将 `.xlc-empty-action` 最小高度统一收敛至 28px（$\ge 24\times 24$ px 触控靶点），并配置高对比度 `:focus-visible` 轮廓圈（`outline: 2px solid var(--xlc-accent); outline-offset: 1px;`）；
   - 为 `.xlc-footer-count` 与 `.xlc-discovery-selected-label` 注入 `font-variant-numeric: tabular-nums; letter-spacing: -0.01em;`；
   - 为底栏 `:is(.xlc-footer-gear, .xlc-footer-guide)` 注入 `min-width: 24px` 与 `:focus-visible` 轮廓；
   - 将 `.xlc-empty-action`、`.xlc-footer-gear`、`.xlc-footer-guide` 与 `.xlc-discovery-footer .b3-button` 统一纳入 `@media (prefers-reduced-motion: reduce)` 瞬态降级规范。
5. **自动化测试与负向门禁验证 (`tests/r410-empty-state-and-discovery-a11y.test.cjs`)**：
   - 编写全覆盖自动化契约测试，断言底栏 toolbar/漫游/状态属性、空态 status 角色/推荐操作按键漫游/全量按钮 aria-label、发现对话框操作栏/筛选栏 toolbar 语义及样式表属性；
   - 实施负向突变 172（篡改主搜索底栏 toolbar 角色触发红灯），门禁精准拦截报错，恢复后复验通过；
   - 全套单元测试正式突破 **1144/1144 项全绿**。

## 结果与证据
- 单元测试增至 **1144/1144 项全绿**（`pnpm test`）；
- 负向违规注入测试精确拦截率 100%（累计完成 172 轮严格负向验证）；
- 生产截图测试 25/25 张全部通过（`pnpm run test:ui`）；
- UI 交互审计 77/77 全链路 100% 通过（`pnpm run test:ix`）；
- TypeScript 类型检查 0 错误（`pnpm run check`）；
- Webpack 生产构建产出 `./package.zip`。
