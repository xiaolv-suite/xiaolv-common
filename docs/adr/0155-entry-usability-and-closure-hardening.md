# ADR 0155：对外承诺入口可用性穷举审计与闭环加固 (Entry Usability & Closure Hardening)

## 状态
已接受，T-0585~T-0589（2026-10-29）。

## 背景与上下文
在完成设计令牌与视觉层现代化后，本轮按指令跳出代码层面的泛化找错，全面围绕“用户能否把功能完整做完”对插件暴露给用户的所有一级、二级和三级入口进行穷举实测，重点排查伪实现、调用断点与名实不符问题：
1. **P0 选区可用性断点**：`getSelectionInfo()` 在光标折叠态（`isCollapsed === true`，光标停在块内但未划选文字）时粗暴返回 `blockId: null`，导致右键菜单“保存当前块为常用”和快捷键 `⌥⇧B` 在最经典的使用场景下误报“未找到光标所在的块”，核心功能承诺落空；
2. **P1 命令面板行为名实不符**：命令面板的 `insertCmd`（搜索并插入）、`copyCmd`（搜索并复制）、`openSourceCmd`（搜索并打开来源）三个独立命令此前均无参打开同一搜索弹窗，用户点击复制或打开来源命令按 Enter 依然执行插入，承诺行为未兑现；
3. **P1 连续取用队列入口绕路**：单条常用条目的“更多动作菜单”缺失一键加入取用队列入口，用户必须切换到批量多选模式才能入队；
4. **P2 快捷键容错与反馈**：`⌥⇧D` 切换 Dock 侧栏时若页面尚未渲染 DOM 按钮缺少引导提示。

## 决策与落地
1. **P0 选区断点修复 (`src/index.ts`)**：
   - 重构 `getSelectionInfo()`：当 `sel.isCollapsed === true` 时，`text` 设为空串，但继续向上回溯 `sel.anchorNode.closest("[data-node-id]")`，准确获取当前块 ID；
   - 彻底解决光标停在块内未划选时按 `⌥⇧B` 或右键“保存当前块为常用”报空的问题。
2. **P1 命令面板主动作模式精准分流 (`src/index.ts`, `src/ui/dialog.ts`)**：
   - `openSearch` 增加 `defaultAction?: "insert" | "copy" | "openSource"` 启动参数并在 `CommonSearchDialog` 落地；
   - 用户从 `copyCmd` 启动时，按 Enter 键直接执行纯文本复制；从 `openSourceCmd` 启动时，按 Enter 直接打开来源块/文档。
3. **P1 单条条目一键入队闭环**：
   - 在条目更多动作菜单（`.xlc-menu`）中新增“📋 加入连续取用队列 (⌥⇧Q)”入口；
   - 点击调用 `queue.add()` 并在顶部队列胶囊实时更新剩余项数，无缝衔接 `⌥⇧Q` 弹出上屏。
4. **P2 侧栏快捷键引导反馈**：
   - 在 `toggleDock` 命令中增加移动端保护与 DOM 节点缺失提示，杜绝静默无响应。
5. **自动化测试与负向门禁验证**：
   - 新增专项测试 `tests/r385-entry-usability-and-closure-verification.test.cjs`；
   - 注入负向突变 145（破坏折叠光标 blockId 提取），门禁精准拦截红灯，恢复后复验全绿；
   - 单元测试增至 **1038/1038 项全绿**。

## 结果与证据
- 单元测试增至 **1038/1038 项全绿**；
- 负向违规注入测试精确拦截率 100%（累计完成 145 轮严格负向验证）；
- 生产截图测试 25/25 张全部通过（`pnpm run test:ui`）；
- UI 交互审计 77/77 全链路 100% 通过（`pnpm run test:ix`）；
- TypeScript 类型检查 0 错误（`pnpm run check`）；
- Webpack 生产构建产出 `./package.zip`。
