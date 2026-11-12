# ADR 0158：同步差异比对弹窗真实宿主挂载与数据管理设置面板闭环 (Sync Diff UI Closure & Host Mount)

## 状态
已接受，T-0602~T-0606（2026-10-30）。

## 背景与上下文
在完成外部表格向导闭环后，进一步对“多源同步比对与精细化合并”（SyncDiffModal）进行了端到端全链路实测，发现两个关键断点：
1. **宿主弹窗未真实挂载**：`openSyncDiffModal` 在浏览器环境下仅创建了一个孤立的 `div.b3-dialog__container`，未包装至思源官方 `new Dialog({ ... })` 宿主中，导致用户在真实界面上点击后弹窗无法呈现；
2. **设置中心数据管理区缺少入口**：设置中心的数据导入导出面板中包含了 JSON 导入/导出、模板包、Espanso 和 CSV 向导，却缺少一个直观的“⚡ 同步冲突比对 (Diff Sync)”按钮，导致此强大的 Diff 对比功能对用户不可达。

## 决策与落地
1. **同步比对模态框接入真实思源 Dialog 宿主 (`src/ui/sync-diff-modal.ts`)**：
   - 在 `isBrowser` 环境下实例化真实 `new Dialog({ width: "min(960px, 94vw)", height: "min(860px, 92vh)" })`；
   - 提取其容器节点挂载 `xlc-sync-diff-modal` 结构与品牌标题栏；
   - 取消与确认按钮显式调用 `dialog.destroy()` 完成弹窗生命周期安全销毁。
2. **设置中心数据管理区接入同步比对入口 (`src/ui/settings-dialog.ts`)**：
   - 新增「⚡ 同步冲突比对」操作按钮（`settings.data.syncDiff`）；
   - 点击唤起外部 JSON 文件选择器，解析远端条目后与当前库进行 `diffLibraries(localList, remoteList)`；
   - 唤起差异比对模态框，用户可视化选择五大策略后确认合并，将结果落库导入并无感广播刷新。
3. **自动化测试与负向门禁验证**：
   - 新增专项测试 `tests/r388-sync-diff-ui-closure.test.cjs`；
   - 注入负向突变 148（破坏合并执行条数断言），门禁精准拦截红灯，恢复后复验全绿；
   - 单元测试增至 **1044/1044 项全绿**。

## 结果与证据
- 单元测试增至 **1044/1044 项全绿**；
- 负向违规注入测试精确拦截率 100%（累计完成 148 轮严格负向验证）；
- 生产截图测试 25/25 张全部通过（`pnpm run test:ui`）；
- UI 交互审计 77/77 全链路 100% 通过（`pnpm run test:ix`）；
- TypeScript 类型检查 0 错误（`pnpm run check`）；
- Webpack 生产构建产出 `./package.zip`。
