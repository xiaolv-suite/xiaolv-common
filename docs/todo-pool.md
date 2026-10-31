# 小驴常用 · 存量材料盘点、全链路审查与唯一待办池（Single Source of Truth）

> **更新时间**：2026-10-31（版本基线：`v0.10.79`）
> **原则**：全仓待办、原型对照、功能全链路验收与缺陷/界面审查以本文件为**唯一事实来源（Single Source of Truth）**。原文件一律保留不删，仅在原文件头部注明迁移去向；过期原型已归档至 [`docs/design/archive/`](./design/archive/README.md)。

---

## 一、 存量材料全量盘点与四态归类

全量扫描源码（`src/`、`tests/`、`scripts/`）与构建产物（`dist/`）以外的所有文件（排除 `node_modules/`、`.git/`、`.jeikcode/`），按内容归为 8 类，逐份判定为 **有效、过期、重复、已落地未标记** 四态之一：

| 类别 | 文件路径 / 范围 | 体量分级 | 四态判定 | 处置与迁移去向说明 |
| :--- | :--- | :--- | :--- | :--- |
| **1. 路线与阻塞基线** | `ROADMAP.md` | 中（精读） | **有效（部分状态滞后）** | 头部已注入单一事实来源指针（指向本文件 `docs/todo-pool.md`）；未闭环项并入下方待办池 `TD-007`~`TD-010`。 |
| **1. 路线与阻塞基线** | `BLOCKERS.md` | 中（精读） | **有效** | 真实宿主边界 `B-001`~`B-006` 仍为客观环境约束事实源，原样保留并作为待办池依赖项依据。 |
| **1. 路线与阻塞基线** | `AGENTS.md`、`SECURITY.md`、`ECOSYSTEM-INTEGRATION-DIRECTIVE.md` | 小（看头部/全文） | **有效** | 开发协议、安全基线与小驴生态桥接规范，持续有效。 |
| **2. 专项任务与计划** | `.tasks/TASK-20261031-github-benchmark-fusion.md` | 小（精读） | **已落地未标记（含半成品尾项）** | T-0741~T-0745 核心模型已落地，但 `:shortcode` 新建/编辑/导入导出与宏求值一致性存在半成品断点；头部已注明迁移至本文件 `TD-004`、`TD-005` 并在本轮闭环。 |
| **2. 专项任务与计划** | `.zcode/plans/plan-session_c89962d5d0a0805e7b3889fd6928dc11.md` | 小（精读） | **已落地未标记（含遗漏点）** | 对应 T-0530~T-0534 质量加固，但遗漏了 `src/index.ts` 编辑弹窗 `/[,,]/` 标签正则笔误与侧栏刷新联动；头部已注明迁移至本文件 `TD-003` 并在本轮修复。 |
| **2. 专项任务与计划** | `docs/on-demand-discovery-plan.md` | 中（读摘要） | **已落地未标记** | T-0032~T-0080 已实现当前文档/笔记本/文档树发现与保存视图；仅全笔记本真机性能验收随 `B-001`/`B-005` 挂起（归入 `TD-008`）。 |
| **3. 竞品与用研材料** | `docs/competitive-gap-analysis.md` | 中（精读） | **已落地未标记** | 表中 `G22`~`G26` 此前仍标为「待实现」，实际已在 R280~R284 全部落地；已更新原表状态并注明剩余尾项迁移至本文件 `TD-006`~`TD-010`。 |
| **3. 竞品与用研材料** | `docs/positioning.md`、`docs/research-2026-10-14.md`、`docs/research-content-examples-2026-10-18.md`、`docs/research-quick-add-2026-10-09.md` | 中（看头部/摘要） | **有效（历史调研基线）** | 确立「思源笔记内容资产层」定位与三大核心场景的调研证据，保留备查。 |
| **4. 视觉原型与规范** | `docs/design/prototype.html`、`docs/design/design-spec.md`、`docs/ui-component-catalog.md` | 大（精读核心） | **有效（唯一视觉事实源）** | v4 权威原型（含规范板、8 主屏、屏 10 发现页、屏 11 状态镜像）及设计令牌规范，作为本轮原型对照与界面审查基准。 |
| **4. 视觉原型与规范** | `docs/design/prototype-r187.html` | 小（精读） | **过期** | R187 早期四页切换工作流草图，不代表 `Dialog` 宿主与 v4 状态板；已归档至 [`docs/design/archive/prototype-r187.html`](./design/archive/prototype-r187.html) 并附归档说明，原文件保留并注入归档横幅。 |
| **4. 视觉原型与规范** | `docs/design/production-*.png`（25 张）、`docs/design/prototype-*.png`（14 张）、`docs/design/real-*.png`（17 张） | 图像资产 | **有效** | 生产 CSS+DOM 实测渲染截图、权威原型渲染图与隔离宿主实测截图；本轮 UI 变更后已通过 `pnpm run test:ui` 重新生成最新 `production-*.png`。 |
| **4. 视觉原型与规范** | `docs/design/harness.html`、`docs/design/harness-bundle.js`、`docs/design/sweep.html`、`docs/design-token-convergence-2026-10-14.md` | 构建/测试夹具 | **有效（自动生成）** | 由 `scripts/render-production.cjs` 与 `scripts/ui-interaction-audit.cjs` 每次运行动态重新生成。 |
| **5. 架构决策记录** | `docs/adr/0001-*.md` ~ `docs/adr/0163-*.md`（共 162 份） | 集合（分级抽检） | **有效** | 历次非显然架构取舍记录；最新 `0150`~`0163` 精读核对，本轮新增 `0164-full-chain-closure-and-material-convergence.md`。 |
| **6. 开发阶段账本** | `docs/dev-plan-2026-10-06.md` ~ `docs/dev-plan-2026-10-27-r300.md`（共 42 份） | 大（精读最新账本） | **有效（历史账本）** | 记录 T-0001~T-0745 演进流水；本轮新增 [`docs/dev-plan-2026-10-31-r414.md`](./dev-plan-2026-10-31-r414.md) 记录 T-0746~T-0751。 |
| **7. 验收、审计与发布** | `docs/acceptance/*`、`docs/acceptance-audit-2026-10-12.md`、`docs/code-function-audit-2026-10-18.md`、`docs/status-audit-*.md`、`docs/electron-*.md`、`docs/multiblock-integrity-2026-10-18.md`、`docs/perf-*.md`、`docs/host-contract.md`、`docs/provider-guide.md`、`docs/delivery.md` | 中（读摘要） | **有效（阶段证据）** | 历史审计与宿主契约证据，保留备查。 |
| **7. 验收、审计与发布** | `docs/release-v0.6.0.md` ~ `docs/release-v0.10.17.md`（49 份）、`docs/bazaar-pr-draft.md`、`docs/b004-upstream-report.md` | 小（看头部） | **重复（与 CHANGELOG 重叠）** | 早期单版本发布草稿，完整内容已汇总于 `CHANGELOG.md`；原文件保留不删。 |
| **8. 临时日志与历史包** | `build-before.log`、`build-after.log`、`tmp-fuzz-trace.log`、`prep-r165*.tmp`~`prep-r169.tmp`、`docs/noUncheckedIndexedAccess-audit.txt`、`rel-024.zip`、`package-v0.10.77.zip` | 小（看头部） | **过期（历史构建/调试日志）与回滚包** | 历史调试快照原样保留不删；本轮新增 `package-v0.10.78.zip` 作为 `v0.10.79` 的上一版可回滚产物。 |

---

## 二、 原型与实现逐屏对照（基于 `docs/design/prototype.html` v4）

| 原型屏幕 / 模块 | 生产实现位置 | 对照判定 | 详细差异与取舍说明 |
| :--- | :--- | :--- | :--- |
| **Screen 0：设计规范板（Tokens）** | `src/styles/tokens-r187.scss`、`src/styles/index.scss` | **已实现且一致（正向演进）** | 亮/暗双主题语义色、三档阴影、类型彩色徽标、等宽数字 `tabular-nums` 完全落地；v0.10.72 起进一步将操作主色（`#5e59cb`）与正向数据绿（`#059669`）解耦。 |
| **Screen 1 & 2：桌面搜索双栏弹窗（亮/暗）** | `src/ui/dialog.ts` (`CommonSearchDialog`) | **已实现且一致（扩展增强）** | 双栏列表+详情预览、筛选 chips、来源失效横幅、操作提示键帽栏均一致；生产版额外增加了顶部 4 指标概览条（`.xlc-metrics-strip`）、右侧面板折叠按钮、`:shortcode` 简码徽标与宏双态实时预览。 |
| **Screen 3：新建/编辑捕获表单** | `src/ui/capture.ts`、`src/index.ts` (`openEditDialog`) | **实现走样 → 本轮已修复一致** | 原型包含 AI 草稿、内容、变量快捷栏、AI 建议、标题、别名｜类型、标签｜分类；此前 T-0741 新增 `:shortcode` 模型后未在新建和编辑表单提供输入框，且编辑弹窗漏掉平台标题栏与中文标点标签切分，本轮（`TD-003`/`TD-004`）已完整补齐。 |
| **Screen 4：插入前变量填充卡** | `src/ui/variable-form.ts` (`openVariableFillCard`) | **已实现且一致（扩展增强）** | 文本/下拉/多行/日期/开关/多选胶囊、预设方案保存与切换、底部实时展开预览均已实现且通过交互审计。 |
| **Screen 5：设置面板** | `src/ui/settings-dialog.ts` (`openSettingsDialog`) | **实现走样 → 本轮已修复一致** | 7 大分区粘性胶囊导航、AI 开关与自定义变换、使用统计 Bento 看板、健康体检、外部联动、数据导入导出均已落地；此前缺失「变量填写历史记忆清空」入口，且「同步冲突比对」读取标准 JSON 导出包时漏读 `it.kramdown`，本轮（`TD-001`/`TD-006`）已修复。 |
| **Screen 6：首次运行库选择向导** | `src/ui/settings-dialog.ts` (`openSetupDialog`) | **已实现且一致** | 三步快速开始卡、新建专用库文档（推荐）/独立笔记本/现有文档/文档树模式、两步确认与回滚提示全部对齐并有 UI smoke 守护。 |
| **Screen 7：条目更多动作菜单（含 AI 变换）** | `src/ui/dialog.ts` (`showActionMenu`) | **已实现且一致（扩展增强）** | 动作分区、AI 变换分区（内置 5 种 + 自定义变换）、次级管理分区、底部原文/变换结果预览盒完全一致；本轮补齐 `jsonToProperties` 双向动作接线（`TD-006`）。 |
| **Screen 8：导入冲突策略与模板包导出** | `src/ui/settings-dialog.ts` (`openImportPolicyDialog`, `openPackExportDialog`) | **已实现且一致** | 跳过/覆盖/重名并存三策略单选卡、包名与变量/子片段依赖树预览、导出分类筛选与隐私脱敏配置弹窗均已闭环。 |
| **Screen 9：移动端底部 Sheet 形态** | `src/ui/dialog.ts`、`src/styles/index.scss` | **已实现且一致（诚实降级）** | 单列列表、点按选择后由底栏主按钮执行、长按呼出底部整宽动作菜单均已实现；真实 Android 宿主剪贴板与直接插入按 `B-002`/`B-003` 诚实标注待验证。 |
| **Screen 10：按需发现候选弹窗** | `src/ui/discovery-dialog.ts` (`DiscoveryDialog`) | **已实现且一致** | 范围选择、标签分面胶囊、候选复选与预览、批量收录与批次撤销、命名保存视图及关闭确认全部通过 `test:ix` 审计。 |
| **Screen 11：状态矩阵镜像（加载/成功/失败/空/鉴权）** | `src/ui/dialog.ts`、`src/ui/empty-state.ts` | **已实现且一致** | 鉴权/权限错误原位重试、范围受限空态一键回退全库、空搜索回车自愈新建均已实现并通过 smoke 断言。 |
| **过期原型：`prototype-r187.html`** | 已归档至 `docs/design/archive/prototype-r187.html` | **原型已过期** | 早期独立侧栏四页切换草图，已被 `prototype.html` v4 全面取代并归档。 |

---

## 三、 缺陷排查、功能全链路验证与半成品识别

### 3.1 缺陷排查（按项目实际命中类别，附可复现步骤与当前表现）

1. **[数据/状态类缺陷 · TD-001] 设置中心「⚡ 同步冲突比对」读取导出 JSON 正文为空且合并策略错配**
   - **位置**：`src/ui/settings-dialog.ts:2608-2655`、`src/model/sync-diff.ts:10-22`
   - **可复现步骤**：在设置中心点击「导出全部条目（JSON）」生成标准备份包（条目正文字段名为 `kramdown`），随后点击「⚡ 同步冲突比对」选择该 JSON 文件并点击「确认执行合并」。
   - **修复前表现**：`remoteList` 映射写成了 `kramdown: it.markdown || it.content || it.summary || ""`（漏写了 `it.kramdown`），导致标准导出包所有条目的远端正文变成空串 `""`，一致条目被误判为修改/冲突；且 `onConfirm` 将 `update` 动作一律按 `"rename"` 导入（产生重复条目而非覆盖更新），`fork` 动作生成的 `xlc-fork-...` 含非法连字符导致 `isLogicalId` 校验失败。
   - **本轮修复**：补全 `it.kramdown` 首选读取与本地真实 `getStoredItemKramdown` 读取，对齐 `alias`/`shortcode`/`url`/`targetBlockId` 字段；合并时将 `update` 分流至 `"overwrite"`、`create`/`fork` 分流至 `"rename"`（使用合法 `pi.forkedId || newLogicalId()`）、`delete` 分流至 `removeItem`。

2. **[安全/渲染类缺陷 · TD-002] 相邻块语境探针 (`Alt+J`) 与侧栏分类组头未转义 `innerHTML` 拼接导致尖括号内容破损**
   - **位置**：`src/ui/dialog.ts:6547-6580`、`src/ui/dock-view.ts:92, 389, 569`
   - **可复现步骤**：源文档相邻块包含 `<script>` 或 TypeScript 泛型 `<T extends Record<string, unknown>>`，在搜索面板按 `Alt+J` 展开相邻块探针；或条目分类名为 `<前端/组件>` 时查看 Dock 侧栏。
   - **修复前表现**：直接用模板字符串拼接 `prevEl.innerHTML`、`curEl.innerHTML`、`nextEl.innerHTML` 与 `groupHead.innerHTML`，导致 `<T...>` 被浏览器解析为未知 HTML 标签而吞字，且违反 `ROADMAP.md` 约束 #7（外部文本不注入 HTML）。
   - **本轮修复**：`dialog.ts` 相邻块探针全部改为 `document.createElement` + `textContent` / `createTextNode` 安全挂载；`dock-view.ts` 对所有动态插值执行 `escapeDockHtml` 实体转义。

3. **[状态/集成类缺陷 · TD-003] 编辑弹窗中文标点切分标签失效、保存漏刷 Dock 侧栏、侧栏失效检测与拖拽块引用 ID 错配、雷切桥版本硬编码**
   - **位置**：`src/index.ts:1229, 2106, 2115, 2148`、`src/ui/dock-view.ts:441, 579`
   - **可复现步骤**：
     1. 右键条目选择「编辑」，在标签栏输入 `客服，售后；重点` 并保存 → `tagsEl.value.split(/[,,]/)` 仅按英文逗号分割，整串变成单个错误标签；
     2. 编辑保存后观察右侧常驻 Dock 侧栏 → 侧栏内容未刷新（仅调用了 `searchDialog?.refreshAfterExternalChange()`）；
     3. 手工新建无外部来源的条目后，在 Dock 侧栏按住 `Alt` 拖拽到编辑器 → 生成 `((xlc-xxxx '标题'))` 逻辑 ID 而非思源块 ID `entry.blockId`；
     4. 删除条目的来源块后观察 Dock 侧栏 → `buildDockDeps` 写成了 `this.missingSources.has(entry.id)`，永远返回 `false`。
   - **本轮修复**：编辑弹窗标签切分统一为 `/[,，、;；\s]+/`，保存后调用 `this.notifyExternalDataChange()` 同步刷新弹窗与侧栏；`buildDockDeps.isSourceMissing` 改为核对 `sourceBlockId`/`sourceDocId`；侧栏拖拽与右键块引用回退链补齐 `entry.blockId`；`registerRaikiriWidget` 版本号绑定 `PLUGIN_VERSION`。

### 3.2 核心功能全链路验证与半成品收口（输入 → 处理 → 持久化 → 重载 → 异常恢复）

| 功能模块 | 全链路验证结果（输入/处理/持久化/重载/恢复） | 半成品排查与本轮收口情况 | 最终三分类结论 |
| :--- | :--- | :--- | :--- |
| **首次引导与专用库配置**（单文档/独立笔记本/文档树） | 输入校验、两步创建、异常回滚与孤儿笔记本 ID 复制回执完备，侧车 `config.json` 重载保持 | 无半成品 | **已实现且可用** |
| **条目 CRUD 与来源回链**（新建/编辑/删除/恢复/失效检测） | 块属性 `custom-xlc-*` 持久化与索引重建完整；修复编辑弹窗标签切分与侧栏联动（`TD-003`） | 本轮已收口 `openEditDialog` 与 Dock 联动断点 | **已实现且可用** |
| **`:shortcode` 简码极速触发**（T-0741） | 此前仅落盘模型与搜索加权，**缺少 UI 新建/编辑输入框与导入导出持久化** | **识别为半成品（TD-004）并已在本轮彻底收口**：补齐新建/编辑简码框、JSON/Markdown 导入导出、Espanso 自动提取、Checksum 签名、`recall` 协议直达与侧栏徽标/Tab 直达 | **已实现且可用** |
| **动态占位符、内联微表单与实时双态预览**（T-0742~T-0745） | 此前 `listPlaceholders` 未识别 `{{doc.title}}`/`{{doc.path}}`/`{{date+Nd}}` 导致执行器漏拉取当前文档信息，且 `extractCursorPosition` 未接入执行器 | **识别为半成品（TD-005）并已在本轮彻底收口**：`listPlaceholders` 与 `ActionExecutor` 完整打通，预览与实际插入 100% 一致，`cursorOffset` 透传至执行回执与 `service.resolve` | **已实现且可用** |
| **变量填写记忆与预设方案**（G22 / R316） | 变量历史自动写入侧车 `state.variableMemory` 并支持多套预设；此前设置页缺少清空变量记忆按钮 | **识别为尾项（TD-006）并已在本轮收口**：设置页新增记忆字段计数与一键清空入口 | **已实现且可用** |
| **纯文本清洗与格式化工具箱**（80+ 纯函数） | 此前 `jsonToProperties`、`hotkeys.ts`、`calculateVirtualScrollWindow`、`hierarchy.ts` 重命名/改父级仅在单测调用 | **识别为未接线纯函数（TD-006）并已在本轮全部接线**至动作菜单、变量工具栏、批量元数据补丁与主搜索弹窗 | **已实现且可用** |
| **JSON / Markdown 模板包 / CSV 向导 / Espanso / 多源同步比对** | 修复 `syncDiffBtn` 读取 `it.kramdown` 与 `overwrite`/`rename`/`delete` 分流（`TD-001`）后，全链路往返保真 | 本轮已收口同步比对合并链路 | **已实现且可用** |
| **按需发现工作台與保存视图**（当前文档/笔记本/文档树） | 扫描、分面筛选、预览、引用/复制收录、批次撤销、视图冻结持久化全链路通过 | 全工作区跨全部笔记本大规模真机性能验收受 `B-005` 隔离环境限制，见 `TD-008` | **已实现且可用** |
| **多块复合 Markdown 结构直接写回**（列表/引用/多段混合块） | 写前由 `bodyWriteRestriction` 拦截并给出行内错误提示，不产生半截残块 | **受平台限制无法实现（B-006）**：上游思源 `appendBlock`/`updateBlock` 对多段 Markdown 可能仅返回首块 ID，直接写回会导致尾块脱离属性管理。**替代方案**：使用单个完整代码围栏保存多行内容，或通过「保存为块引用 / 发现页引用模式」锚定原文档块。 | **受平台限制无法实现（已配替代方案）** |
| **宿主 AI 端到端与 Android 真机位图剪贴板** | 插件端零密钥服务、双开关门禁、失败重试与移动端降级复制均已就绪 | **受平台限制无法实现（B-001/B-002/B-003）**：依赖用户在真实思源宿主配置大模型 API 及 Android 真机 WebView 剪贴板权限。**替代方案**：未配置 AI 时默认关闭并隐藏出域动作；移动端自动降级为复制纯文本/Markdown 链接并给出明确 Toast 回执。 | **受平台限制无法实现（已配替代方案）** |

---

## 四、 界面审查记录（Token、一致性、8 态、响应式与层级）

基于 `pnpm run test:ui`（25 张生产 CSS+DOM 截图）与 `pnpm run test:ix`（77 项交互审计）实测核查：

1. **设计令牌引用与硬编码核查**：
   - 位置：`src/styles/tokens-r187.scss:1-600`、`src/styles/index.scss:1-5400`
   - 实测证据：`tests/r381-design-tokens-and-a11y.test.cjs` 门禁实测 `index.scss` 保持 **0 处十六进制硬编码色值**、**0 处 `linear-gradient` 拟物渐变**，所有颜色、圆角、三档阴影与动效时长均引用 `--xlc-*` 令牌。
   - 截图：`docs/design/production-desktop-light.png`、`docs/design/production-desktop-dark.png`。
2. **同一控件跨面板一致性**：
   - 位置：`src/ui/dialog-dom.ts:15`（`mountPlatformDialogTitleWrap`）、`src/index.ts:1968`
   - 发现与修复：主搜索、新建、设置、发现、CSV 向导、同步比对、脱敏弹窗均挂载了统一平台标题栏 `.lv-dialog-title-wrap`，唯独 `src/index.ts` 的 `openEditDialog` 漏挂平台标题栏且未为输入控件绑定 `htmlFor`/`id`；本轮已在 `src/index.ts:1969` 补齐，实现全弹窗 100% 统一。
   - 截图：`docs/design/production-capture-light.png`、`docs/design/production-settings-light.png`。
3. **可交互元素 8 态完整度與视觉区分**：
   - 位置：`src/styles/index.scss`、各弹窗控制器
   - 实测证据：默认、悬停（`--xlc-lavender`）、按下（`scale(0.98)`）、聚焦（`:focus-visible` 2px `--xlc-accent` 轮廓圈）、选中（`aria-selected`/`aria-checked`/`aria-current`）、禁用（45% 透明度 + `not-allowed`）、忙态（`aria-busy="true"` + 飞行态文案）、错误（`.xlc-input--error` + `role="alert"`）8 态齐全。
   - 截图：`docs/design/production-capture-validation-light.png`、`docs/design/production-auth-error-light.png`。
4. **窄窗口与系统缩放/高对比度表现**：
   - 位置：`src/styles/index.scss:3270-3400`、`src/styles/tokens-r187.scss`（`forced-colors: active`）
   - 实测证据：420px 窄视口下自动隐藏右侧预览窗格与顶部键帽提示行，切换为单列紧凑布局，无水平溢出截断；Dock 侧栏在 240px~300px 宽度下徽标设 `min-width: 28px` 防挤压。
   - 截图：`docs/design/production-narrow-light.png`、`docs/design/production-mobile-light.png`、`docs/design/production-discovery-mobile-light.png`。
5. **主次视觉层级与首屏关键操作可达性**：
   - 位置：`src/ui/dialog.ts:490-550`、`src/ui/settings-dialog.ts:105-145`
   - 实测证据：主搜索弹窗顶栏常驻「＋ 新建条目」主色按钮，右侧预览底栏常驻「插入 / 复制 / 打开来源 / 编辑」工具栏，无需滚动即可直达；设置面板顶部配备 `position: sticky` 7 大分区胶囊导航，点击即滚至对应卡片。
   - 截图：`docs/design/production-desktop-light.png`、`docs/design/production-settings-light.png`。

---

## 五、 全仓唯一待办池（Single Source of Truth Todo Pool）

> **优先级计算公式**：$\text{优先级得分} = \frac{\text{影响面 (1-5)} \times \text{触发频率 (1-5)}}{\text{实现成本 (1-5)}}$
> **取用顺序**：严格遵循「**先修缺陷 → 再补未完成功能 → 最后体验与新增**」。同一根因合并为单一条目。

| 编号 | 类型 | 标题与根因合并说明 | 影响面 (1-5) | 频率 (1-5) | 成本 (1-5) | 依赖项 | 优先级得分与理由 | 状态 | 验收方式与实测证据 |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- | :--- | :--- | :--- |
| **TD-001** | **缺陷** | **多源同步冲突比对 (`syncDiffBtn`) 漏读 `it.kramdown` 正文及 `update`/`fork`/`delete` 合并策略错配** | 5 | 3 | 2 | 无 | **7.5（P0）**：导出 JSON 进行同步比对时远端正文全空且 `update` 误走 `rename` 产生重复块，直接破坏数据同步正确性，成本低必须首修。 | **本轮已完成** | 运行 `tests/r414-full-chain-closure-and-defects.test.cjs` TD-001 断言 + 负向验证通过。 |
| **TD-002** | **缺陷** | **相邻块探针 (`Alt+J`) 与 Dock 侧栏分类组头未转义 `innerHTML` 拼接导致尖括号吞字与注入风险** | 4 | 4 | 1 | 无 | **16.0（P0）**：含 `<T>` 或 `<script>` 的技术笔记与分类名高频出现，直接违反安全红线 #7，改造成本极低。 | **本轮已完成** | 运行 `tests/r414-full-chain-closure-and-defects.test.cjs` TD-002 断言通过。 |
| **TD-003** | **缺陷** | **编辑弹窗 (`openEditDialog`) `/[,,]/` 中文标点切分失效、漏刷 Dock 侧栏、侧栏失效检测与拖拽块引用 ID 错配、雷切桥版本硬编码** | 4 | 5 | 2 | 无 | **10.0（P0）**：中文分号/逗号标签编辑、侧栏拖拽引用与编辑后同步属于高频日常操作，合并同源生命周期断点一并根治。 | **本轮已完成** | 运行 `tests/r414-full-chain-closure-and-defects.test.cjs` TD-003 断言通过。 |
| **TD-004** | **功能（半成品补齐）** | **`:shortcode` 简码触发全链路闭环（新建/编辑输入框、JSON/Markdown 导入导出、Espanso 提取、Checksum 签名、`recall` 协议直达与侧栏徽标/Tab 直达）** | 5 | 4 | 2 | 无 | **10.0（P0）**：消除 T-0741 仅有搜索加权而无 UI 录入和导入导出持久化的半成品状态，形成完整闭环。 | **本轮已完成** | 运行 `tests/r414-full-chain-closure-and-defects.test.cjs` TD-004 往返与负向篡改拦截测试通过。 |
| **TD-005** | **功能（半成品补齐）** | **动态宏预览与执行求值一致性（`listPlaceholders` 识别 `{{doc.title}}`/`{{doc.path}}`/`{{date+Nd}}`）及 `cursorOffset` 偏移透传、侧栏抽屉双态预览** | 4 | 4 | 2 | 无 | **8.0（P1）**：消除预览与实际插入不一致问题，并将 `extractCursorPosition` 真正接入 `ActionExecutor` 与 `service.resolve`。 | **本轮已完成** | 运行 `tests/r414-full-chain-closure-and-defects.test.cjs` TD-005 与 `r6-placeholders.test.cjs` 通过。 |
| **TD-006** | **体验 / 技术债** | **孤立纯函数全面接线：设置页「清空变量记忆」入口、`jsonToProperties` 动作菜单/变量栏接线、`BatchTagCategoryPatch` 层级重命名/改父级、`dialog.ts` 虚拟窗口与热键冲突预检接入** | 3 | 3 | 2 | 无 | **4.5（P1）**：清理代码库中仅被单测引用的孤立导出函数，兑现设置页变量记忆管理与双向键值转换体验。 | **本轮已完成** | 运行 `tests/r414-full-chain-closure-and-defects.test.cjs` TD-006 断言与 `test:ui` / `test:ix` 全部通过。 |
| **TD-007** | **功能** | **多块复合结构（列表/引用/多段 Markdown）完整 AST 锚定、读回与更新** | 4 | 3 | 5 | 依赖 **B-005** 与 **B-006** 解除 | **2.4（P2·阻塞挂起）**：需在独立 OS 级隔离沙箱下验证思源内核多块 operation ID 与尾块归属，当前保持写前单行/代码围栏安全防御。 | **阻塞挂起（B-005/B-006）** | 待 B-005 隔离环境就绪后执行多块正负向 E2E 验收。 |
| **TD-008** | **体验** | **思源宿主真实 AI 大模型端到端验收与全笔记本发现大库压力复核** | 3 | 2 | 3 | 依赖 **B-001** 与 **B-005** | **2.0（P2·阻塞挂起）**：需宿主配置可用 AI 模型凭据及隔离环境后执行端到端核验。 | **阻塞挂起（B-001/B-005）** | 待宿主 AI 凭据就绪后运行真实模型 tidy/draft/transform/semantic 验收。 |
| **TD-009** | **体验** | **Android 移动端真机触控、底部 Sheet 与图片位图剪贴板验收** | 2 | 2 | 4 | 依赖 **B-002** 与 **B-003** | **1.0（P3·阻塞挂起）**：依赖 Android 真机/模拟器会话窗口，当前保持诚实复制降级提示。 | **阻塞挂起（B-002/B-003）** | 待 Android 真机会话具备后执行触控与剪贴板实测。 |
| **TD-010** | **技术债** | **设置弹窗高频混合切换 Chromium/Electron 异常根因最小复现追踪** | 2 | 1 | 4 | 依赖 **B-004** 与 **B-005** | **0.5（P3·阻塞挂起）**：812 步压力测试未复现，待正常宿主生命周期下捕获原生 crash dump 后再作针对性处理。 | **阻塞挂起（B-004/B-005）** | 持续保留 `rAF` 节流保护与 `scripts/electron-settings-stress-acceptance.cjs` 回归。 |
