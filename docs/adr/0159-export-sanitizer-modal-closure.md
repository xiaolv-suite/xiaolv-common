# ADR 0159：导出脱敏配置弹窗结构优化与样式收敛 (Export Sanitizer Modal Closure & Hierarchy)

## 状态
已接受，T-0607~T-0611（2026-10-30）。

## 背景与上下文
在对导出全流程执行可用性实测时，排查到模板包导出时配置隐私安全脱敏（`openSanitizerOptionsDialog`）存在一处严重的容器结构嵌套缺陷：
1. **双重标题栏与双重边框**：`openSanitizerOptionsDialog` 创建了思源宿主 Dialog，但内层调用的 `renderSanitizerOptionsModal` 内部同时硬编码输出了 `.b3-dialog__header` 和独立的外框，挂载到 `dialog.body` 后在真实界面上产生了冗余重叠的双标题栏和双层分割线；
2. **样式收敛缺失**：脱敏弹窗内表单与字段缺少专用样式收口，与 R187 统一设计令牌存在间距差异。

## 决策与落地
1. **消除冗余内层标题栏与双层容器 (`src/ui/export-sanitizer-modal.ts`)**：
   - 将 `renderSanitizerOptionsModal` 内层表单重构为纯净的 `.xlc-export-sanitizer-form.xlc-form` 内容层；
   - 挂载至宿主 Dialog 时，通过 `mountPlatformDialogTitleWrap` 统一接管外层标题栏，消除内层重复标题；
   - 取消与保存操作按钮直接对齐宿主对话框底部操作流。
2. **脱敏弹窗样式卡片化与令牌对齐 (`src/styles/index.scss`)**：
   - 为 `.xlc-export-sanitizer-modal` 补充规范的半透明发丝分割线与自适应网格间距；
   - 自定义词典输入框统一样式与等宽字体排版。
3. **自动化测试与负向门禁验证**：
   - 新增专项测试 `tests/r389-export-sanitizer-closure.test.cjs`；
   - 注入负向突变 149（破坏脱敏模式断言），门禁精准拦截红灯，恢复后复验全绿；
   - 单元测试增至 **1045/1045 项全绿**。

## 结果与证据
- 单元测试增至 **1045/1045 项全绿**；
- 负向违规注入测试精确拦截率 100%（累计完成 149 轮严格负向验证）；
- 生产截图测试 25/25 张全部通过（`pnpm run test:ui`）；
- UI 交互审计 77/77 全链路 100% 通过（`pnpm run test:ix`）；
- TypeScript 类型检查 0 错误（`pnpm run check`）；
- Webpack 生产构建产出 `./package.zip`。
