# ADR 0162：Markdown 预览引擎与设置模态弹窗无障碍与交互深度收敛 (Markdown Preview Engine & Settings Modals A11y Convergence)

## 状态
已接受，T-0736~T-0740（2026-10-31）。

## 背景与上下文
基于 UI/UX Pro Max (`ui-ux-pro-max`) 设计智能准则对全域富文本展示引擎与设置子模态弹窗（包导出、Espanso 导入、标签体检）进行系统化排查，定位到如下可用性与无障碍断层：
1. **Markdown 富文本预览语义断层**：在右侧详情预览窗格的纯 DOM 轻量渲染引擎中，标题块（H1, H2, H3）此前仅渲染为普通的 `div.xlc-md-h`，未声明 `role="heading"` 与对应层级 `aria-level`；引用块 `blockquote` 未声明 `role="note"`；列表与待办行未声明 `role="listitem"`；Markdown 表格数字文本缺少等宽排版（`font-variant-numeric: tabular-nums`），数值对比时存在排版抖动；
2. **模板包导出弹窗操作栏与状态徽标断层**：模板包导出对话框内筛选联动的条目数与变量数徽标未声明 `role="status"` 与 `aria-live="polite"`；底部的取消与导出按钮行未声明 `role="toolbar"`，不支持 `ArrowRight` / `ArrowLeft` 水平键盘漫游轮巡与 `Home` / `End` 快捷导航，脱敏配置按钮缺少独立 `aria-label`；
3. **Espanso 导入与标签体检操作栏语义缺失**：Espanso 导入底栏与标签体检关闭底栏未声明 `role="toolbar"`，各按钮未配置独立 `aria-label`；
4. **设置异步操作重试按钮靶点与样式收口**：设置面板内的异步错误重试按钮 `.xlc-operation-retry` 需确保 $\ge 24\times 24$ px 触控靶点，并具备清晰的高对比度 `:focus-visible` 轮廓圈与 `@media (prefers-reduced-motion: reduce)` 瞬态动效抑制。

## 决策与落地
1. **Markdown 预览渲染引擎 heading/note/listitem 语义及表格等宽排版 (`src/ui/preview-renderer.ts`, `src/styles/tokens-r187.scss`)**：
   - 为 H1/H2/H3 标题声明 `role="heading"` 与对应的 `aria-level="1"` / `"2"` / `"3"`；
   - 为引用块声明 `role="note"` 与 `aria-label="引用文本"`；
   - 为无序列表、有序列表与待办列表项声明 `role="listitem"`；
   - 在 `tokens-r187.scss` 中为 `.xlc-md-table` 注入 `font-variant-numeric: tabular-nums; letter-spacing: -0.01em;`。
2. **模板包导出弹窗操作栏与元数据徽标 toolbar/status 语义及键盘漫游 (`src/ui/settings-dialog.ts`)**：
   - 为元数据容器 `.xlc-import-meta` 及内部子徽标声明 `role="status"` 与 `aria-live="polite"`；
   - 为操作底栏 `.xlc-form-actions` 声明 `role="toolbar"`、`aria-label="模板包导出操作栏"`，并注入 `ArrowRight` / `ArrowLeft` 水平按键漫游与 `Home` / `End` 跳转；
   - 为脱敏配置按钮、取消按钮与导出按钮全量补齐独立的 `aria-label`。
3. **Espanso 导入与标签体检弹窗操作栏 toolbar 语义及全量按钮无障碍声明 (`src/ui/settings-dialog.ts`)**：
   - 为 Espanso 导入底栏声明 `role="toolbar"`、`aria-label="Espanso导入操作栏"` 与左右方向键键盘漫游；
   - 为标签体检操作底栏声明 `role="toolbar"` 与 `aria-label="标签体检操作栏"`；
   - 为各弹窗的取消、下一步、关闭按钮补齐显式 `aria-label`。
4. **触控靶点、高对比度焦点环与样式收拢 (`src/styles/index.scss`)**：
   - 为操作重试按钮 `.xlc-operation-retry` 注入 `min-height: 24px;` 触控靶点与 `:focus-visible` 高对比度轮廓圈（`outline: 2px solid var(--xlc-accent); outline-offset: 1px;`）；
   - 将 `.xlc-operation-retry` 统一纳入 `@media (prefers-reduced-motion: reduce)` 瞬态降级规范。
5. **自动化测试与负向门禁验证 (`tests/r412-preview-md-and-settings-modals-a11y.test.cjs`)**：
   - 编写全覆盖自动化契约测试，断言 Markdown 预览标题/引用/列表项语义、表格排版、导出弹窗与 Espanso/标签体检弹窗 toolbar/漫游属性；
   - 实施负向突变 174（篡改引用块 note 角色触发红灯），门禁精准拦截报错，恢复后复验通过；
   - 全套单元测试正式突破 **1152/1152 项全绿**。

## 结果与证据
- 单元测试增至 **1152/1152 项全绿**（`pnpm test`）；
- 负向违规注入测试精确拦截率 100%（累计完成 174 轮严格负向验证）；
- 生产截图测试 25/25 张全部通过（`pnpm run test:ui`）；
- UI 交互审计 77/77 全链路 100% 通过（`pnpm run test:ix`）；
- TypeScript 类型检查 0 错误（`pnpm run check`）；
- Webpack 生产构建产出 `./package.zip`。
