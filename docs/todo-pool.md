# 小驴常用 · 全界面与功能深度排查报告及开发待办池（Single Source of Truth）

> **执行更新（v0.10.80 · 2026-10-31 · T-0752~T-0760 / [ADR 0165](./adr/0165-superblock-item-container-and-surface-convergence.md)）**：本报告锁定的全部核心架构障碍与交互收尾项均已完成落地并通过隔离真思源前端+内核 12 步全链路回归（`pnpm run e2e:real` 12/12 通过）：
> 1. **存储容器破局（`LIM-01` / `FN-06`）**：多段正文装进单个超级块（`{{{row ... }}}`），补齐 `updateBlock` 属性自动重贴与行首 `{{` 零宽空格保护，内置示例包 25/25 全部可写且逐条回读一致；
> 2. **界面减法与视口可见（`UI-01..05`）**：工具栏只留 10 个核心变量 + 可搜索「🛠 文本工具…」、动作菜单约 180 项文本工具折叠检索、移除顶部指标横带、快捷键提示收敛为 5 项、420px 窄窗范围胶囊轨道横向滚动不溢出、100%/125%/150% 三档视口主按钮 12/12 可见可点；
> 3. **交互断链清零与通用门禁（`FN-01..08` / `UI-07..09`）**：消除全部 `window.prompt`/`alert`、补齐缺失词条与 `%s` 参数、统一 `resolveEntryBlockId` 提取全域条目真实 22 位块 ID、消除预览底栏嵌入/引用双回执、清理 `Alt+M`/`Alt+S`/`Ctrl+D` 快捷键遮蔽死代码（`Alt+Shift+M` 切换多选）与 `Alt+H` 假路径、修复旧弹窗 130ms 销毁回调覆盖新 `searchDialog` 的竞态、补齐 `QuickLook` 动态宏双态预览与上下键同步刷新、补齐 `DockView` 完整正文预取拖拽/真实回执/右键菜单 `role="menu"` 与 `Esc` 关闭、剪贴板历史改为默认关闭。详见 [`docs/dev-plan-2026-10-31-r415.md`](./dev-plan-2026-10-31-r415.md) 与 [`docs/release-checklist.md`](./release-checklist.md)。
>
> **排查基线**：`v0.10.79`（2026-10-31，只排查不改代码，一切结论基于源码走查与 Playwright 真实 Chromium 多倍率/窄窗实测）
> **UI 审查方法**：结合 `$ui-ux-pro-max` 技能规范与五大补充维度（设计令牌与内联硬编码、跨面板一致性、可交互元素 9 态、窄窗与 125%/150% 缩放实测、关键操作首屏可达性），覆盖主界面及全部 18 个次级面板/弹窗/抽屉/浮层。
> **功能排查方法**：穷举界面一级/二级/三级全部入口，逐项验证行为并按「输入 → 处理 → 持久化 → 重载后仍在 → 异常后可恢复」五环链路核查，识别半成品、假实现与静默吞异常。

---

## 一、 全界面入口全景盘点与五环链路验证表（一级 / 二级 / 三级）

| 层级与所属面板 | 入口名称 / 触发方式（按钮 / 菜单 / 命令 / 快捷键 / 拖拽） | 功能三分类判定 | 五环链路验证（输入→处理→持久化→重载→异常恢复）与发现问题 | 关联待办编号 |
| :--- | :--- | :--- | :--- | :--- |
| **1. 全局顶栏与命令面板** | 顶栏图标 `打开小驴常用` / 命令 `xiaolv.common.openSearch` | 已实现且可用 | 已配库打开主搜索，未配库进入首次引导；侧车超时降级不阻塞入口。 | — |
| **1. 全局顶栏与命令面板** | 命令 `搜索并插入` / `搜索并复制` / `搜索并打开来源` | 已实现且可用 | 通过 `defaultActionMode` 独立分派 `insert` / `copy` / `openSource`。 | — |
| **1. 全局顶栏与命令面板** | 命令 `切换常用语侧边栏` (`Alt+Shift+D`) / 右上 Dock 图标 | 已实现且可用 | 桌面端展开/收起右侧 Dock；移动端提示降级。 | — |
| **1. 全局顶栏与命令面板** | 命令 `新建常用语` (`Alt+Shift+N`) / `保存选中内容` (`Alt+Shift+S`) / `保存当前块` (`Alt+Shift+B`) / `保存整篇文档` / `从剪贴板保存` / `快速捕获剪贴板` (`Alt+Shift+V`) | 已实现且可用 | 折叠光标可回溯所在块 ID；超限与多段正文写前拦截并保留现场。 | — |
| **1. 全局顶栏与命令面板** | 命令 `用常用模板包裹选中文本` (`Alt+Shift+W`) / `连续粘贴队列出栈` (`Alt+Shift+Q`) | 已实现且可用 | 选区包裹自动筛选含 `{{xlc:selection}}` 条目；粘贴队列顺序出栈并更新顶栏胶囊。 | — |
| **1. 全局顶栏与命令面板** | 命令 `从当前文档发现常用语` / `从当前笔记本发现常用语` | 已实现且可用 | 打开按需发现弹窗，扫描顶层块并排除专用库边界。 | — |
| **2. 编辑器与文档树右键菜单** | 编辑器右键（有选区：`保存选中内容`、`用常用模板包裹选区`；无选区：`保存当前块`、`打开常用语`、`从当前文档发现`） | 已实现且可用 | 按选区上下文智能分流，避免菜单项堆叠。 | — |
| **2. 编辑器与文档树右键菜单** | 块引用右键 `保存为常用块引用` / 图片右键 `保存图片为常用条目` / 链接右键 `保存链接为常用条目` / 文档树右键 `从该文档树发现`、`插入常用语到此文档` | 已实现且可用 | 严格校验 `assets/` 路径、`http(s)` 外链与 22 位块 ID，非法目标诚实拒绝。 | — |
| **3. 主搜索工作台（一级/二级）** | 搜索输入框（拼音/多词/`#标签`/`@分类`/`-排除`/`?AI语义`/`xlc-bundle`导入嗅探/历史词 `Alt+↑↓`/路径清除 `Alt+⌫`） | 已实现且可用 | 防抖检索、IME 组词保护、`:shortcode` 与唯一别名 `Tab` 直达均正常。 | — |
| **3. 主搜索工作台（一级/二级）** | 顶栏 `📌 固定窗口` (`Alt+P`) / `＋ 新建条目` / 6 枚范围胶囊 (`Alt+T` 轮转) / 类型·标签·分类下拉 / 排序菜单 (`⇅ 排序`) | **部分异常（UI 溢出与靶点过小）** | 筛选持久化与重载恢复正常；但 **420px 窄窗下 `.xlc-segmented-track` 宽 695px 造成水平溢出截断**，且 `.xlc-search-pin`（22×22px）低于 24px 靶点标准。 | `UI-04`, `UI-05` |
| **3. 主搜索工作台（二级：右侧预览与底栏）** | 右侧预览正文 `.xlc-pane-body` + 底栏操作区 `.xlc-pane-foot`（`插入`、`⊞ 插入嵌入块`、`＋ 插入引用`、`复制`、`✦ AI 变换`、`打开来源`、`编辑`） | **严重缺陷（首屏裁切 + 双重回执 + 全域 ID 错配）** | 1. **主面板顶部 4 层横条占去 438px，导致 `.xlc-pane` 仅高 261px；当条目含变量提示与失效警告时，`.xlc-pane-body` 与 `.xlc-pane-foot` 被推至 `y=817..934` 并被 `.xlc-pane { overflow: hidden }` 完全裁切不可见**；<br>2. 点击「插入嵌入块 / 插入引用」绕过 `runAction` 走 `insertProviderPayload`，产生双 Toast 冲突且漏记使用频次；<br>3. 全域检索条目上 `targetBlockId` 误取 `"xlc-omni-..."` 导致嵌入与引用 100% 报错。 | `UI-01`, `FN-02`, `FN-07` |
| **3. 主搜索工作台（二级：键盘快捷键矩阵）** | `Enter` / `Ctrl+Enter` / `Shift+Enter` / `Alt+Enter` / `Alt+1~9` / `Alt+Shift+1~9` / `Alt+C` / `Alt+Shift+C` / `Alt+R` / `Alt+D` / `Alt+M` / `Alt+J` / `Alt+H` / `Alt+F` / `Alt+S` / `Ctrl+E` / `Ctrl+D` / `Alt+Delete` / `Space` | **多处断链（键位冲突 / 死代码 / 假实现 / 全域 ID 错配）** | 1. **`Alt+M` 在 line 5785 复制 Markdown 并 `return`，导致 line 5964 `Alt+M` 切换多选模式成为 100% 死代码**；<br>2. **`Alt+S` 在非全域条目上进入 line 5897 空分支后退出，导致 line 5970 `Alt+S` 收藏死代码**；<br>3. **`Alt+H` 层级大纲探针在普通条目上直接拿 `entry.category` 冒充文档路径（假实现）**；<br>4. **`Shift+Enter`、`Alt+Enter`、`Alt+R`、`Alt+J` 在全域条目上因 `entry.id` 前缀未剥离全部报错**。 | `FN-02`, `FN-04`, `FN-05` |
| **3. 主搜索工作台（三级：更多动作菜单 `.xlc-menu`）** | 条目 `…` 按钮或右键/长按呼出动作菜单（基础动作 + 5 种内置 AI 变换 + 自定义变换 + 80+ 文本清洗/排版/表格/编码动作 + 加入粘贴队列 + 单条分享码 + 重置频次 + 删除） | 已实现且可用 | 菜单键盘上下漫游、`Home`/`End`、变换结果预览三选、各纯函数转换并复制均验证可用。 | — |
| **3. 主搜索工作台（三级：批量多选栏 `.xlc-batch-bar`）** | 多选模式：`+ 加标签`、`- 删标签`、`🏷️ 设分类`、`📋 设为取用队列`、`✦ 批量收录`、`⊞ 合并收录`、`退出多选` | **严重断链（Electron 禁用 `prompt` + 合并违反 B-006 + 状态锁死）** | 1. **`+ 加标签`、`- 删标签`、`🏷️ 设分类` 直接调用 `window.prompt()`，在思源 Electron 宿主中完全无法弹出而失效**；<br>2. **`⊞ 合并收录` 用 `"\n\n"` 拼接多条文本带入新建表单，保存时必被 `B-006` 多段限制拦截**；<br>3. **`✦ 批量收录` 异常静默吞掉、0 成功仍报成功、按钮禁用态不恢复**。 | `FN-01`, `FN-06` |
| **3. 主搜索工作台（三级：QuickLook 极速预览）** | 非输入态按 `Space` 打开居中大卡片预览 | **部分不一致** | 预览渲染与关闭正常；但**对含动态宏条目未渲染 `renderDualMacroPreview` 双态预览**，且打开期间按上下方向键会移动背后列表焦点却不刷新大卡片内容。 | `UI-07` |
| **4. 常驻侧边栏 `DockView`（一级/二级/三级）** | 顶栏（`+` 新建、`↺` 刷新、`⚙` 设置）、搜索框（含 `Tab` 直达）、4 枚过滤胶囊、分类折叠组头、行悬停（`+` 插入、`⧉` 复制、`★` 收藏）、拖拽落块、右键菜单 `.xlc-dock-menu`、底部预览抽屉 `.xlc-dock-drawer` | **严重断链（半成品 + 未翻译键名 + `%s` 裸露 + 菜单无 Esc）** | 1. **侧栏第二个胶囊显示裸键名 `filterCommon`，刷新提示显示 `reindex`，复制提示显示 `已复制：%s`**；<br>2. **点击含 `{{xlc:ask:...}}` 变量的条目未调用变量填充卡，直接插入未填参的 `__字段__`**；<br>3. **插入成功固定弹「已插入其他插件内容」，无编辑器降级复制时仍谎报「已插入」**；<br>4. **普通拖拽仅取 240 字 `summary` 导致长文与代码围栏被截断**；<br>5. **右键菜单 `.xlc-dock-menu` 无 `role="menu"` 且按 `Esc` 无法关闭**。 | `UI-02`, `UI-07`, `UI-08`, `UI-09`, `FN-03` |
| **5. 新建捕获表单 `CaptureDialog` & 编辑弹窗 `openEditDialog`** | AI 草稿生成、正文框、120+ 按钮变量/格式工具栏 `.xlc-varbar`、AI 整理与采纳、标题、别名（含推荐与查重）、类型、标签（含快捷胶囊）、分类、简码 `:shortcode`、来源重绑/清除、草稿恢复条、取消/保存 | **交互阻塞（表单高 2827px 主按钮不可见 + `alert` 阻塞）** | CRUD 与属性持久化、重载恢复完备；但 **`.xlc-varbar` 平铺 120+ 个按钮把表单撑高至 2827px（窄屏 4553px），标题与底部「保存」按钮需滚动 2200px 才可见**；`.xlc-form-ai` 高度仅 17px；格式栏「`✦ 测字宽`」调用了阻塞式 `window.alert()`。 | `UI-03`, `UI-05`, `FN-01` |
| **6. 变量填充卡片 `openVariableFillCard`** | 预设下拉选择、`💾 存为预设`、`🗑 删除预设`、6 类动态字段输入、快捷候选胶囊、实时展开预览盒、`↺ 重置默认`、`⧉ 复制结果`、`取消`、`插入` | **持久化断链（Electron 禁用 `prompt`）** | 字段填参、历史记忆、重置与复制可用；但 **点击「`💾 存为预设`」调用 `window.prompt()` 输入方案名，在思源 Electron 桌面端无法弹出导致预设无法保存**。 | `FN-01` |
| **7. 首次引导向导 `openSetupDialog`** | 模式下拉（新建专用库文档/独立笔记本/现有文档/文档树）、笔记本选择、文档搜索与候选列表、两步确认与回滚、稍后设置 | **缩放遮挡** | 创建、回滚与配置持久化正常；但在 **100%/125%/150% 缩放下内容高 740px 超出 600px/468px/380px 容器，底部「创建 / 下一步」主按钮被推入折叠区下**。 | `UI-04` |
| **8. 设置中心 `openSettingsDialog`（二级/三级子弹窗）** | 7 大粘性胶囊导航、库更改、变量/频次开关、清空频次、清空变量记忆、AI 开关与自定义变换、拼音/占位符开关、常用视图管理、健康体检中心、外部联动（Quicker/AHK/Raycast/cURL 复制）、数据区（重建索引/清空最近/AI 标签体检/JSON 导出/模板包导出/导入/Espanso 导入/CSV 向导/同步冲突比对/5 套内置模板包导入/AV 规则复制） | **多处缺陷（裸露 `syncDiffBtn` + 复制无回退吞异常 + 缩放遮挡）** | 1. **数据区同步比对按钮显示裸键名 `⚡ syncDiffBtn`**；<br>2. **高频 Top 榜复制、AV 规则复制与 4 个外部脚本复制按钮裸调 `navigator.clipboard.writeText`，失败时无 `execCommand` 回退且静默吞掉异常**；<br>3. **`syncDiffBtn` 文件读取异步链缺少 `.catch()` 与按钮防重锁**。 | `UI-02`, `FN-08` |
| **9. 发现工作台 `DiscoveryDialog` / CSV 向导 / 同步比对 / 脱敏配置 / 快编弹窗** | 发现扫描/筛选/预览/收录/撤销/保存视图、CSV 粘贴/推断/映射/导入、同步比对 6 卡片筛选/5 策略/合并、脱敏模式/词典配置、就地快编保存 | **局部体验与样式问题** | 核心功能闭环；但 **发现面板在 125%/150% 缩放下底栏按钮超出视口，候选复选框仅 13×13px**；**同步比对模态框确认合并期间按钮无禁用忙态，且表头含内联硬编码宽度**。 | `UI-04`, `UI-05`, `UI-06`, `UI-09` |
| **10. 平台边界受限能力** | 多段复合 Markdown 直接写块（`LIM-01`）/ Android 真机直接插入与图片位图剪贴板（`LIM-02`）/ 插入后文内光标按字符偏移精确定位（`LIM-03`） | **受平台限制无法实现（共 3 项）** | 受思源底层 `appendBlock` 多块返回契约、Android WebView 剪贴板沙箱及 Protyle 插入 API 限制，已提供代码块/块引用、复制降级与 `cursorOffset` 偏移返回替代方案。 | `LIM-01` ~ `LIM-03` |

---

## 二、 待办池完整清单（UI 审查 9 条 + 功能排查 8 条 + 平台限制 3 条）

> **合格性门禁**：以下每条待办均严格具备 **① 可复现问题描述（位置+步骤+当前表现+期望表现）、② 解决方案与改动范围、③ 成本整数评估（1=小 / 2=中 / 3=大）与理由、④ 风险说明** 四要素。
> **优先级计算公式**：$\text{优先级得分} = \frac{\text{影响面 (1-5)} \times \text{触发频率 (1-5)}}{\text{成本 (1-3)}}$（均取整数打分并附理由）。

### A. 界面与交互待办（UI 审查：共 9 条，`UI-01` ~ `UI-09`）

#### `UI-01` · 【缺陷】主搜索面板顶部多层横条挤压右侧预览窗格，导致预览正文与底栏主操作按钮被 `overflow: hidden` 完全裁切不可见
- **优先级**：影响面 `5`（主搜索核心预览与插入/复制/编辑按钮不可见）× 频率 `5`（每次打开主面板必现）÷ 成本 `2`（中）= **`12.5`（P0 最高优）**
- **问题描述（可复现）**：
  - **位置**：`src/ui/dialog.ts:490-680, 1180-1280`、`src/styles/tokens-r187.scss:568, 584-608`、`src/styles/index.scss:1050-1419`。
  - **操作步骤**：在 1280×720（100% 缩放）或 125%/150% 缩放下打开主搜索面板，选中带有变量提示（`.xlc-pane-vars`）或来源失效提示（`.xlc-pane-warn`）的条目（如首条「延期道歉与补偿说明」），观察右侧详情窗格 `.xlc-pane`。
  - **当前表现**：主面板顶部 `.xlc-top`（105px）+ 三行 `.xlc-filters`（132px）+ `.xlc-metrics-strip`（59px）+ `.xlc-quick-filter-pills`（30px）+ 底栏 `.xlc-footer`（44px）共占去 **438px**，导致 `.xlc-body` 与 `.xlc-pane` 仅剩 **261.7px** 高（`bottom = 767`）；而 `.xlc-pane` 内部非滚动头部（`head` 60px + `meta` 40px + `vars` 152px + `warn` 57px = **309.4px**）超出窗格总高，将 `.xlc-pane-body`（`top = 817.7, height = 28px`）和 `.xlc-pane-foot`（`top = 845.7..934.7`，含「插入 / 同步嵌入 / 插入引用 / 复制 / 打开来源 / 编辑」）推到 `.xlc-pane` 底边之下并被 `overflow: hidden` 完全裁切，用户无法看到预览正文也无法点击底栏任何操作按钮。
  - **期望表现**：`.xlc-body` 至少保留 380px+ 高度；`.xlc-pane` 内部除 `.xlc-pane-head` 与固定底栏 `.xlc-pane-foot` 外，`.xlc-pane-meta`、`.xlc-pane-vars`、`.xlc-pane-warn` 与 `.xlc-pane-body` 应在可滚动区内部流式滚动，确保 `.xlc-pane-foot` 操作栏 100% 永远固定在 `.xlc-pane` 底部可见且不被裁切。
- **解决方案与改动范围**：
  1. 在 `src/ui/dialog.ts` 与 `src/styles/index.scss` / `tokens-r187.scss` 中压缩顶部冗余垂直高度：将 `.xlc-filters` 中的排序按钮合入第一行筛选条，将 `.xlc-metrics-strip` 改为单行紧凑微指标条（高 ≤ 32px，窄高视口 `@media (max-height: 640px)` 自动隐藏 `.xlc-metrics-strip` 与 `.xlc-kbdrow`）；
  2. 在 `src/styles/tokens-r187.scss` 与 `src/styles/index.scss` 中将 `.xlc-pane-vars` 的高度限制为 `max-height: 68px; overflow-y: auto; flex-shrink: 0;`，为 `.xlc-pane-body` 设定 `min-height: 96px; flex: 1 1 auto;`，并确保 `.xlc-pane-foot` 作为底部粘性/固定栏（`flex-shrink: 0; margin-top: auto;`）始终留在 `.xlc-pane` 可视底边内。
- **成本评估**：**中（2）**——涉及 `dialog.ts` 预览区 DOM 滚动容器包裹与 `tokens-r187.scss` / `index.scss` 响应式高度配比，需重跑 25 张 `test:ui` 截图与 `test:ix` 交互审计。
- **风险说明**：修改 `.xlc-pane` 子元素结构或高度时，需保持 `.xlc-pane-vars`、`.xlc-pane-warn`、`.xlc-pane-body`、`.xlc-pane-foot` 的既有类名与父子选择器不变，防止破坏 `scripts/render-production.cjs` 中的 `panePreview`、`paneVars` 等 smoke 断言。

---

#### `UI-02` · 【缺陷】设置面板与常驻侧边栏缺失 `i18n` 字典键且 `%s` 漏传参，导致按钮与胶囊直接显示英文内部键名 `syncDiffBtn`、`filterCommon`、`reindex` 及 `已复制：%s`
- **优先级**：影响面 `4`（设置页与常驻侧边栏直接向用户展示代码变量名与 `%s` 乱码）× 频率 `5`（每次打开侧栏或设置页必现）÷ 成本 `1`（小）= **`20.0`（P0 最高优）**
- **问题描述（可复现）**：
  - **位置**：`src/index.ts:701`、`src/ui/settings-dialog.ts:2628`、`src/ui/dock-view.ts:141, 275, 704`、`src/i18n/zh-CN.json`、`src/i18n/en.json`。
  - **操作步骤**：① 打开设置面板滾动至「数据与模板」区查看同步按钮；② 打开右侧常驻 Dock 侧边栏查看第 2 个过滤胶囊与顶栏刷新按钮 Tooltip；③ 在 Dock 侧边栏双击或点击 `⧉` 复制任意条目查看右上角 Toast。
  - **当前表现**：因 `i18nFn()` 在字典缺失时返回键名本身（非空字符串），导致 `t("key") || "兜底中文"` 的右侧回退永远不执行：① 设置页按钮显示 `⚡ syncDiffBtn`；② 侧栏胶囊显示 `filterCommon`；③ 侧栏刷新按钮 Tooltip 显示 `reindex`；④ 侧栏复制成功 Toast 调用 `t("copied")` 未传条目标题参数，直接弹出 `已复制：%s`。
  - **期望表现**：中英文字典完整收录 `syncDiffBtn`（同步冲突比对 / Sync Diff）、`filterCommon`（常用 / Frequent）、`reindex`（刷新内容库 / Refresh Library）；侧栏复制调用 `this.deps.t("copied", entry.title || "条目")` 正确替换 `%s`。
- **解决方案与改动范围**：
  1. 在 `src/i18n/zh-CN.json` 与 `src/i18n/en.json` 中补齐 `syncDiffBtn`、`filterCommon`、`reindex` 三个键值；
  2. 在 `src/ui/dock-view.ts:704` 将 `this.deps.t("copied")` 修正为 `this.deps.t("copied", entry.title || entry.summary || "")`；
  3. 新增静态扫描测试断言全仓所有 `t("...")` 调用键均存在于 `zh-CN.json` 与 `en.json` 且 `%s` 参数个数匹配。
- **成本评估**：**小（1）**——仅涉及 2 个 JSON 语言包补键与 `dock-view.ts` 单行传参修正。
- **风险说明**：无外部依赖风险；补齐字典后 `production-settings-light.png` 中按钮文案将从 `⚡ syncDiffBtn` 变为正确的 `⚡ 同步冲突比对`。

---

#### `UI-03` · 【体验】新建捕获表单与编辑弹窗内联平铺 120+ 个宏与格式按钮，撑高表单至 2827px 且底栏未吸底，导致标题输入框与「保存」主按钮需大幅滚动 2200px 才可见
- **优先级**：影响面 `4`（新建与编辑核心工作流首屏看不到标题栏与保存按钮）× 频率 `4`（每次新建或编辑条目均触发）÷ 成本 `2`（中）= **`8.0`（P1）**
- **问题描述（可复现）**：
  - **位置**：`src/ui/variable-form.ts:620-4320`（`buildVariableBar`）、`src/ui/capture.ts:535, 1044`、`src/index.ts:2007, 2062`、`src/styles/index.scss`。
  - **操作步骤**：按 `Alt+Shift+N` 打开「新建常用语」或右键条目点击「编辑」，在不滚动的情况下观察首屏可见内容。
  - **当前表现**：`buildVariableBar` 在正文框正下方一次性平铺渲染了 10 个核心变量按钮 + 110+ 个 `✦` 文本格式化按钮，导致 `.xlc-varbar` 独占约 **2100px** 高度（表单总滚动高度达 **2827px**，420px 窄屏达 **4553px**）；用户填写完正文后，首屏完全看不到下方的「标题、别名、类型、标签、分类、简码」字段以及底部的「取消 / 保存」操作栏，必须滚动 3~4 屏才能点击保存。
  - **期望表现**：首屏默认只展示 10 个核心动态变量按钮（`capture.variable.*`）与「展开/收起更多格式工具 (110+)」折叠开关（或限制 `.xlc-varbar` 最大高度 `max-height: 88px; overflow-y: auto;`）；同时将 `.xlc-form-actions`（「取消 / 保存」）设为底部粘性操作栏（`position: sticky; bottom: 0; background: var(--xlc-surface); z-index: 3;`），确保一打开新建/编辑窗口即可在同一屏看到正文、标题字段与底栏「保存」按钮。
- **解决方案与改动范围**：
  1. 在 `src/styles/index.scss` 中为 `.xlc-varbar` 设置 `max-height: 92px; overflow-y: auto;`（或提供折叠展开切换，保持所有按钮 DOM 存在且 `offsetParent !== null` 以兼容既有 smoke 断言）；
  2. 为 `.xlc-form-actions` 增加 `position: sticky; bottom: 0; background: var(--xlc-surface); padding-top: var(--xlc-space-2); border-top: 1px solid var(--xlc-line); z-index: 3;`。
- **成本评估**：**中（2）**——涉及 `.xlc-varbar` 与 `.xlc-form-actions` 的样式收敛及 `render-production.cjs` 截图复核。
- **风险说明**：`scripts/render-production.cjs` 会遍历点击 10 个 `capture.variable.*` 按钮验证插入光标位置，因此前 10 个核心变量按钮必须在 `.xlc-varbar` 首行直接可见且不可设为 `display: none`。

---

#### `UI-04` · 【体验】窄窗口（420px）下主搜索范围胶囊水平溢出截断，且 125%/150% 系统缩放下首次引导与发现面板底部主操作按钮被挤出视口外
- **优先级**：影响面 `4`（窄屏与 Windows 高分屏 125%/150% 缩放用户操作受阻）× 频率 `4`（高分屏笔记本默认缩放极为常见）÷ 成本 `2`（中）= **`8.0`（P1）**
- **问题描述（可复现）**：
  - **位置**：`src/styles/index.scss`（`.xlc-segmented-track`、`.xlc-setup`、`.xlc-discovery`）、`src/styles/tokens-r187.scss:555-565`。
  - **操作步骤**：① 将窗口缩窄至 420×720 打开主搜索面板，查看 `.xlc-filters` 中的 6 个范围胶囊；② 在 125%（等效 1024×576）或 150%（等效 853×480）系统缩放下打开「首次引导 (`SetupDialog`)」与「按需发现 (`DiscoveryDialog`)」。
  - **当前表现**：① 420px 宽度下 `.xlc-segmented-track` 宽达 **695px**（容器仅 **363px**），右侧「📋 剪贴板」、「📄 当前文档 (@)」、「🔍 全库搜索 (/)」3 个胶囊溢出容器右边界被截断；② `SetupDialog` 内容高 740px 超出容器高（600px/468px/380px），底部「创建 / 下一步」按钮被推入折叠区下；③ `DiscoveryDialog` 在 125%/150% 缩放下底部 `.xlc-discovery-footer`（「加入选中项」）超出视口底边。
  - **期望表现**：① `.xlc-segmented-track` 设置 `max-width: 100%; overflow-x: auto; flex-wrap: wrap;` 在窄屏下自动换行或可平滑横滚，消除 `.xlc-filters` 非预期水平溢出；② `SetupDialog` 与 `DiscoveryDialog` 的底部操作栏在任意缩放倍率下保持 `position: sticky; bottom: 0` 常驻可见。
- **解决方案与改动范围**：
  1. 在 `src/styles/index.scss` 中为 `.xlc-segmented-track` 增加 `max-width: 100%; flex-wrap: wrap;`（或移动端/窄屏 `overflow-x: auto`）；
  2. 为 `.xlc-setup .xlc-form-actions` 与桌面态 `.xlc-discovery-footer` 统一启用 `position: sticky; bottom: 0; background: var(--xlc-surface); z-index: 2;`。
- **成本评估**：**中（2）**——涉及 3 个面板的响应式 CSS 断点与粘性底栏调整。
- **风险说明**：需同步验证 `scripts/render-production.cjs` 中 720px 高度下的发现页撤销按钮可达性测试（`720px undo remains reachable`）不被粘性底栏遮挡（配合 `scroll-padding-bottom`）。

---

#### `UI-05` · 【体验】4 类高频交互控件尺寸低于 WCAG 2.2 AA 最小指针靶点标准（24×24px）
- **优先级**：影响面 `3`（点击易误触，违反无障碍靶点门禁）× 频率 `4`（行内标签筛选、固定窗口、AI 整理、候选勾选高频使用）÷ 成本 `1`（小）= **`12.0`（P1）**
- **问题描述（可复现）**：
  - **位置**：`src/styles/index.scss` 中 `.xlc-search-pin`、`.xlc-tag-pill`、`.xlc-form-ai`、`.xlc-discovery-row input[type="checkbox"]`。
  - **操作步骤**：打开主搜索面板、新建捕获面板（开启 AI）、按需发现面板，用浏览器开发者工具测量上述控件的物理渲染尺寸（`getBoundingClientRect`）。
  - **当前表现**：Playwright 实测尺寸分别为：`.xlc-search-pin` 仅 **22×22px**、行内标签胶囊 `.xlc-tag-pill` 高 **22px**、捕获表单 `.xlc-form-ai`（「✦ AI 整理」）高仅 **17px**、发现候选复选框 `input[data-xlc-control="discovery.candidate.select"]` 仅 **13×13px**，均低于 WCAG 2.2 AA `web-target-size`（24×24 CSS px）要求。
  - **期望表现**：四类交互控件的最小点击热区均达到 `min-width: 24px; min-height: 24px;`。
- **解决方案与改动范围**：
  - 在 `src/styles/index.scss` 与 `src/styles/tokens-r187.scss` 中为 `.xlc-search-pin`、`.xlc-tag-pill`、`.xlc-form-ai` 补充 `min-height: 24px; min-width: 24px; display: inline-flex; align-items: center;`，将发现页候选复选框尺寸设为 `width: 18px; height: 18px; padding: 3px;`（或外包 24×24px label 命中区）。
- **成本评估**：**小（1）**——纯样式表尺寸微调，不改变 DOM 结构。
- **风险说明**：提升 `.xlc-tag-pill` 高度 2px 时需确认列表行高（64px）不会产生折行跳动。

---

#### `UI-06` · 【技术债】样式表与 TS 组件残留 34 处裸 `px` 字号、6 处裸 `rgba()`（暗色模式不可见）及 45+ 处内联 `.style.cssText` 硬编码
- **优先级**：影响面 `3`（破坏主题令牌单一事实源，暗色模式下局部背景隐形）× 频率 `3`（暗色模式与跨面板浏览可见）÷ 成本 `2`（中）= **`4.5`（P2）**
- **问题描述（可复现）**：
  - **位置**：`src/styles/index.scss:263, 274, 303, 488, 1334, 1365, 2512, 2890, 3517, 4320-4414, 4383, 4854`；`src/ui/dialog.ts:391, 2143, 6565-6602`；`src/ui/settings-dialog.ts:401-450, 715, 767-780, 2157`；`src/ui/capture.ts:473-475, 551-613, 717-723`；`src/ui/quick-edit.ts:63-68, 103-105`；`src/ui/variable-form.ts:396-469`；`src/ui/sync-diff-modal.ts:234, 303-307`。
  - **操作步骤**：切换至思源暗色主题（Midnight），打开主搜索面板按 `Alt+J` 查看相邻块探针，或打开 Dock 侧边栏查看底部抽屉与代码块背景。
  - **当前表现**：`dialog.ts:6578` 与 `index.scss:4383` 硬编码了 `background: rgba(0, 0, 0, 0.03)`，在浅色底上是浅灰，但在暗色底 `#161522` 上对比度接近 1:1 完全不可见；`index.scss` 仍有 34 处未引用 `--xlc-font-*` 的裸 `px` 字号；6 个 TS 文件中存在 45+ 处内联 `.style.cssText` / `.style.*` 写死字号与间距。
  - **期望表现**：所有颜色/背景/阴影/字号全量收敛至 `tokens-r187.scss` 的 `--xlc-*` 变量（暗色底使用 `var(--xlc-soft)`），TS 文件只切换语义 CSS 类名而不写内联样式。
- **解决方案与改动范围**：
  1. 将 `index.scss` 中 34 处裸 `font-size` 替换为 `var(--xlc-font-2xs/xs/sm/md)`，将 `rgba(0,0,0,0.03)` 等替换为 `var(--xlc-soft)` / `var(--xlc-shadow-sm)`；
  2. 将 `dialog.ts`、`settings-dialog.ts`、`capture.ts`、`quick-edit.ts`、`variable-form.ts`、`sync-diff-modal.ts` 中的内联静态样式提取为 `index.scss` 规范类。
- **成本评估**：**中（2）**——涉及 6 个 TS 文件与 `index.scss` 样式抽离，逻辑零变更但文件面较广。
- **风险说明**：抽离内联样式时需保留动态计算属性（如虚拟列表 spacer 高度、菜单 `left/top` 坐标、移动端软键盘 `paddingBottom`）。

---

#### `UI-07` · 【体验】侧边栏右键菜单缺少 `role="menu"` 与 `Esc`/方向键导航，且 `QuickLook` 极速预览未接入宏双态预览及方向键联动
- **优先级**：影响面 `3`（键盘与无障碍体验断层、宏预览跨面板不一致）× 频率 `3`（侧栏右键与空格预览常驻高频使用）÷ 成本 `1`（小）= **`9.0`（P1）**
- **问题描述（可复现）**：
  - **位置**：`src/ui/dock-view.ts:582-648`（`showContextMenu`）、`src/ui/dialog.ts:5605-5616, 6041-6147`（`openQuickLook`）。
  - **操作步骤**：① 在 Dock 侧边栏右键任意条目弹出 `.xlc-dock-menu`，按键盘 `Esc` 或 `ArrowDown`/`ArrowUp`；② 在主搜索面板选中一条含动态宏（如 `{{xlc:date}}`）的条目，观察右侧预览窗格（显示「模板源码 + 展开后真实效果」双卡片），再按 `Space` 打开 `QuickLook` 大卡片预览，并按 `ArrowDown`。
  - **当前表现**：① `.xlc-dock-menu` 未设置 `role="menu"` / `role="menuitem"`，未自动聚焦首项，且没有绑定 `keydown` 监听器，按 `Esc` 无法关闭菜单，按上下方向键无法在菜单项间漫游；② `QuickLook` 大卡片只调用了 `renderSafePreview` 展示未展开的原始源码，与主预览窗格和侧栏抽屉的双态预览不一致；且 `QuickLook` 打开时按 `ArrowDown` 会切换背后列表选中项，但 `QuickLook` 卡片内容停留在旧条目不更新。
  - **期望表现**：① `.xlc-dock-menu` 具备标准 `role="menu"` / `role="menuitem"`，支持 `ArrowDown`/`ArrowUp`/`Home`/`End` 循环导航及 `Esc` 关闭并归还焦点；② `QuickLook` 对含动态宏的非代码条目统一调用 `renderDualMacroPreview`，且在 `QuickLook` 打开期间按上下方向键实时同步刷新 `QuickLook` 卡片内容。
- **解决方案与改动范围**：
  1. 在 `src/ui/dock-view.ts:showContextMenu` 中补齐 ARIA 角色、首项聚焦、方向键焦点漫游与 `Escape` 销毁还原焦点；
  2. 在 `src/ui/dialog.ts:openQuickLook` 中接入 `hasDynamicMacros` -> `renderDualMacroPreview` 分支，并在 `onKeyDown` 的 `ArrowDown`/`ArrowUp` 分支中若 `this.quickLookOpen` 为真则同步重绘 `QuickLook` 内容。
- **成本评估**：**小（1）**——复用已有的 `renderDualMacroPreview` 与菜单键盘漫游模式，仅改 2 个文件。
- **风险说明**：需确保 `QuickLook` 内焦点位于长文本滚动区（`.xlc-quicklook-body`）时，上下方向键用于滚动正文而不误切条目。

---

#### `UI-08` · 【体验】多处装饰性图标与符号未声明 `aria-hidden="true"`，导致屏幕阅读器朗读冗余 Emoji 与修饰符
- **优先级**：影响面 `2`（读屏软件冗余播报）× 频率 `4`（每个列表行、菜单项、侧栏顶栏均出现）÷ 成本 `1`（小）= **`8.0`（P2）**
- **问题描述（可复现）**：
  - **位置**：`src/ui/dock-view.ts:101, 163, 407, 612`、`src/ui/dialog.ts:3510`（`.xlc-menu-ic`）。
  - **操作步骤**：开启屏幕阅读器（NVDA / VoiceOver）或使用无障碍树检查器浏览 Dock 侧边栏顶栏、搜索框、分类组头、右键菜单及主面板更多操作菜单。
  - **当前表现**：`.xlc-dock-icon`（`🐴`）、`.xlc-dock-search-icon`（`🔍`）、`.xlc-dock-group-arrow`（`▸`/`▾`）、`.xlc-dock-menu-ic`、`.xlc-menu-ic` 均紧邻已有明确文字或 `aria-label` 的父控件，但自身未标记 `aria-hidden="true"`，违反 `$ui-ux-pro-max` `icon-context` 规则（可见文字旁的装饰性图标必须从无障碍树隐藏）。
  - **期望表现**：所有纯装饰性图标/符号容器统一声明 `aria-hidden="true"`。
- **解决方案与改动范围**：
  - 在 `src/ui/dock-view.ts` 与 `src/ui/dialog.ts` 构造上述图标 span 时统一添加 `aria-hidden="true"`。
- **成本评估**：**小（1）**——仅在 5 处 DOM 节点构造处补充属性。
- **风险说明**：无任何视觉或功能副作用。

---

#### `UI-09` · 【体验】侧栏底部抽屉缺少「块引用 / 嵌入块」显式按钮（仅靠修饰键拖拽），且同步比对模态框确认合并时缺少按钮加载禁用态
- **优先级**：影响面 `2`（触控板/键盘用户难以在侧栏使用 Alt/Shift 拖拽，同步合并缺乏忙态视觉反馈）× 频率 `3` ÷ 成本 `1`（小）= **`6.0`（P2）**
- **问题描述（可复现）**：
  - **位置**：`src/ui/dock-view.ts:746-766`（`openDrawer`）、`src/ui/sync-diff-modal.ts:460-475`（`confirmBtn`）。
  - **操作步骤**：① 在 Dock 侧边栏点击条目展开底部预览抽屉 `.xlc-dock-drawer-foot`，尝试在不拖拽的情况下将该条目作为「思源块引用」或「同步嵌入块」插入；② 在同步冲突比对模态框点击「确认执行合并」观察按钮状态。
  - **当前表现**：① 侧栏支持 `Alt+拖拽`（块引用）和 `Shift+拖拽`（嵌入块），但底部预览抽屉仅有「`＋ 插入`」和「`⧉ 复制`」两个按钮，未提供「块引用 / 嵌入块」单指针点击等价按钮（违反 WCAG 2.2 AA `dragging-alternative`）；② `sync-diff-modal.ts` 点击确认合并执行异步写入期间，确认按钮未置 `disabled = true` 与 `aria-busy="true"`。
  - **期望表现**：① 侧栏底部抽屉操作栏补充「`((•)) 引用`」按钮，右键菜单补充「`⊞ 插入同步嵌入块`」；② `sync-diff-modal.ts` 在 `performApply` 期间将确认按钮禁用并切换为「`正在合并…`」忙态。
- **解决方案与改动范围**：
  - 修改 `src/ui/dock-view.ts`（抽屉与右键菜单补齐块引用/嵌入操作）与 `src/ui/sync-diff-modal.ts`（确认按钮飞行态绑定）。
- **成本评估**：**小（1）**——局部 UI 按钮增补与忙态属性切换。
- **风险说明**：侧栏宽度较窄（240~300px），抽屉操作栏按钮需启用 `flex-wrap: wrap` 防止横向挤压。

---

### B. 功能实现与全链路待办（功能排查：共 8 条可开发项 `FN-01` ~ `FN-08`）

#### `FN-01` · 【缺陷】主搜索批量加删标签/设分类、变量填充卡保存预设、格式栏测字宽共 5 处功能使用了思源 Electron 禁用的 `window.prompt()` / `window.alert()`，在桌面端点击直接失效
- **优先级**：影响面 `5`（4 个核心持久化功能在真实思源桌面端 100% 不可用）× 频率 `4`（批量治理与保存变量预设高频使用）÷ 成本 `2`（中）= **`10.0`（P0 最高优）**
- **问题描述（可复现）**：
  - **位置**：`src/ui/dialog.ts:6237, 6251, 6265`（批量 `+ 加标签`、`- 删标签`、`🏷️ 设分类`）、`src/ui/variable-form.ts:453`（变量填充卡 `💾 存为预设`）、`src/ui/variable-form.ts:4283`（格式栏 `✦ 测字宽`）。
  - **操作步骤**：在思源桌面端（Electron 环境）中：① 打开主搜索进入多选模式，勾选条目后点击底部「`+ 加标签`」、「`- 删标签`」或「`🏷️ 设分类`」；② 打开含变量的条目进入变量填充卡，填写值后点击「`💾 存为预设`」；③ 在新建表单点击「`✦ 测字宽`」。
  - **当前表现**：Electron 渲染进程原生不支持 `window.prompt()`（调用返回 `null` 或抛异常，项目内 `discovery-dialog.ts:1588` 已明确记录 `Electron does not support window.prompt()`），导致批量加标签、批量删标签、批量设分类、保存变量预设 4 项功能点击后无任何反应或报错退出，完全无法完成输入与持久化；`✦ 测字宽` 使用同步 `window.alert()` 阻塞主线程并丢失编辑器焦点。
  - **期望表现**：彻底移除所有 `window.prompt()` 与 `window.alert()`；使用轻量内联输入浮层或思源官方 `Dialog` 命名表单（对齐 `discovery-dialog.ts` 的 `openSaveViewDialog` 模式）收集标签名、分类名与预设方案名，支持 Enter 提交、Esc 取消、IME 组合态保护与空值校验；`✦ 测字宽` 改为非阻塞 Toast 或行内状态回执。
- **解决方案与改动范围**：
  1. 在 `src/ui/dialog-dom.ts` 中封装通用的轻量单行输入对话框辅助函数 `openTextInputDialog({title, label, placeholder, defaultValue, allowEmpty, onSubmit})`（基于思源 `Dialog`，支持兼容无 DOM 环境的回退）；
  2. 将 `src/ui/dialog.ts:6237, 6251, 6265` 与 `src/ui/variable-form.ts:453` 的 `window.prompt` 全部替换为 `openTextInputDialog`；
  3. 将 `src/ui/variable-form.ts:4283` 的 `window.alert` 替换为非阻塞状态提示。
- **成本评估**：**中（2）**——封装 1 个共享输入弹窗组件并替换 5 处调用点，同步更新对应单测夹具。
- **风险说明**：检查 `tests/r289-batch-ops.test.cjs` 与 `tests/r316-variable-presets-and-surround-mode.test.cjs` 是否通过 mock `window.prompt` 进行测试；可在测试桩或回退分支保留对测试注入回调的兼容。

---

#### `FN-02` · 【缺陷】全域检索结果（`current-doc` / `all-notes`）在 10 处动作入口中误将逻辑 ID `"xlc-omni-..."` 当作物理块 ID，导致块引用、同步嵌入与前后文探针 100% 报错失效
- **优先级**：影响面 `5`（全域检索模式下块引用、嵌入块、前后文探针三大核心能力全部失效）× 频率 `4`（全库穿透检索常用操作）÷ 成本 `1`（小）= **`20.0`（P0 最高优）**
- **问题描述（可复现）**：
  - **位置**：`src/ui/dialog.ts` 共 10 处：lines `1214`（底栏嵌入按钮）、`1236`（底栏引用按钮）、`3374`（`runActionFor` 嵌入）、`3378`（`runActionFor` 引用）、`3628`（动作菜单复制块引用）、`5622`（`Shift+Enter`）、`5638`（`Alt+Enter`）、`5751`（`Alt+R`）、`5808`（`Alt+H`）、`6547`（`Alt+J` 前后文探针）。
  - **操作步骤**：在主搜索面板切换到「`📄 当前文档 (@)`」或「`🔍 全库搜索 (/)`」（或输入 `@关键词` / `/关键词`），选中任意检索出的思源笔记块，按 `Shift+Enter`（或点底栏「插入嵌入块」）、`Alt+Enter`（或点底栏「插入引用」）、`Alt+R`（复制块引用）或 `Alt+J`（前后相邻块探针）。
  - **当前表现**：`blockHitToSearchEntry`（`omni-search.ts:263`）生成的 `entry.id` 为 `"xlc-omni-2026..."`（真实 22 位块 ID 存于 `entry.targetBlockId` 与 `entry.blockId`）；但上述 10 处代码均写成了 `const targetBlockId = entry.isOmni ? entry.id : (entry.targetBlockId || ...)`，导致 `isBlockId("xlc-omni-...")` 校验恒为 `false`，100% 弹出错误提示「无法嵌入：未关联有效块 ID」/「无法引用：未关联有效块 ID」/「当前条目未关联思源源文档，无法调取上下文」。
  - **期望表现**：统一提取辅助函数 `resolveEntryBlockId(entry)`，优先取 `entry.targetBlockId || entry.sourceBlockId || entry.blockId`，对 `"xlc-omni-"` 前缀自动剥离还原真实块 ID，使全域检索结果上的块引用、同步嵌入、复制块引用与 `Alt+J` 前后文探针全部正常生效（同时对 `xlc-clip-` 剪贴板暂存项诚实禁用块级操作）。
- **解决方案与改动范围**：
  - 在 `src/ui/dialog.ts` 中定义统一的 `resolvePhysicalBlockId(entry: SearchEntry): string`（返回 `entry.targetBlockId || entry.sourceBlockId || entry.blockId || (entry.id.startsWith("xlc-omni-") ? entry.id.slice(9) : entry.id)`），替换全部 10 处 `entry.isOmni ? entry.id : ...`。
- **成本评估**：**小（1）**——集中在 `src/ui/dialog.ts` 单文件内统一收敛为 1 个纯函数调用。
- **风险说明**：剪贴板历史条目（`entry.id` 以 `"xlc-clip-"` 开头）本身无思源块 ID，`isBlockId(resolvePhysicalBlockId(clipEntry))` 仍正确返回 `false` 并给出友好提示。

---

#### `FN-03` · 【缺陷/半成品】常驻侧边栏 `DockView` 插入含变量条目时跳过填参弹窗、插入回执文案张冠李戴且普通拖拽截断长文与代码围栏
- **优先级**：影响面 `5`（侧边栏核心插入与拖拽链路半成品）× 频率 `4`（常驻侧边栏高频点击与拖拽）÷ 成本 `2`（中）= **`10.0`（P0 最高优）**
- **问题描述（可复现）**：
  - **位置**：`src/ui/dock-view.ts:440-452, 675-707`、`src/index.ts:1200-1210`。
  - **操作步骤**：① 在 Dock 侧边栏点击一条含 `{{xlc:ask:客户名称}}` 变量的条目上的 `＋` 插入按钮（或按 `Enter`）；② 在无活动编辑器（关闭所有文档标签页）时点击侧栏 `＋` 插入按钮；③ 在侧栏按住一条超过 240 字或带 ``` 代码围栏的条目直接拖拽到思源编辑器中。
  - **当前表现**：
    1. **跳过变量填充卡**：`DockViewDeps` 虽注入了 `runActionWithFills`，但 `DockView.insertEntry` 从未检查条目是否含 `ask` 变量，直接调 `runAction(entry.id, "insert")`，导致未弹出变量填写卡片而直接将 `__客户名称__` 兜底占位符插入文档；
    2. **回执张冠李戴且谎报结果**：`DockView.insertEntry` 成功后硬编码调用 `this.deps.t("providerInserted")`（弹出「已插入其他插件内容」），且当无活动编辑器自动降级为复制剪贴板时，仍提示「已插入其他插件内容」；
    3. **拖拽截断丢失格式**：`dragstart`（line 442）写为 `let dragPayload = entry.content || entry.summary || entry.title || ""`，而库内 `SearchEntry` 的 `entry.content` 为 `undefined`，`entry.summary` 仅保留前 240 字纯文本摘要，导致拖拽长模板或代码块时正文被截断在 240 字且丢失 Markdown/代码围栏结构。
  - **期望表现**：
    1. 侧栏插入/复制含 `ask` 变量的条目（且开启 `promptVariables`）时，自动弹出 `openVariableFillCard` 收集参数后调用 `runActionWithFills`；
    2. `buildDockDeps` 中的 `runAction` / `runActionWithFills` 与主面板共用 `receiptText` 真实回执（区分「已插入：标题」与「当前没有活动编辑器，已复制到剪贴板」）；
    3. 侧栏条目渲染或悬停/选中时预热 `preview(entry.id)` 缓存，使 `dragstart` 优先读取完整 Kramdown 正文（含展开片段与动态占位符）。
- **解决方案与改动范围**：
  - 修改 `src/index.ts`（`buildDockDeps` 注入变量填参钩子、预览缓存同步读取与真实 `receiptText` 回执）与 `src/ui/dock-view.ts`（`insertEntry`/`copyEntry` 接入变量卡询问，`dragstart` 读取完整缓存正文）。
- **成本评估**：**中（2）**——涉及 `src/index.ts` 与 `src/ui/dock-view.ts` 两处联动收口。
- **风险说明**：HTML5 `dragstart` 事件要求在同步事件周期内调用 `e.dataTransfer.setData`，因此需在列表渲染后或 `mouseenter`/`mousedown` 时将条目正文预取入内存 Map，供 `dragstart` 同步读取。

---

#### `FN-04` · 【缺陷】主搜索面板快捷键分派链存在 3 处分支覆盖与死代码（`Alt+M` 多选模式不可达、`Alt+S` 收藏分支死代码、`Alt+D` 键位语义冲突）
- **优先级**：影响面 `3`（多选模式无法用键盘开启、快捷键行为与代码意图背离）× 频率 `4`（全键盘流用户高频触发）÷ 成本 `1`（小）= **`12.0`（P1）**
- **问题描述（可复现）**：
  - **位置**：`src/ui/dialog.ts:5767-5796, 5897-5980`。
  - **操作步骤**：打开主搜索面板，选中任意库内条目，按 `Alt+M` 尝试开启多选模式；或按 `Alt+S` 观察行为。
  - **当前表现**：
    1. 在同一个 `if ... else if` 链中，line 5785 先匹配了 `e.altKey && !e.ctrlKey && !e.metaKey && (e.key === "m" || e.key === "M")`（执行复制原始 Markdown 并销毁窗口 + `return`），导致后方 line 5964 完全相同条件的 `else if (... (e.key === "m" || e.key === "M")) { this.toggleMultiSelectMode(); }` 成为 **100% 永远无法执行的死代码**；
    2. Line 5897 匹配了 `(e.altKey || ...) && (e.key === "s" || e.key === "S")`，内部仅当 `entry?.isOmni` 为真才收录，当 `entry.isOmni` 为假时直接落空退出整个 `if-else` 链，导致 line 5970 的 `e.key === "s" || e.key === "S"`（切换收藏）同样成为 **100% 死代码**；
    3. Line 5767 将 `Alt+D` 绑定为「打开来源定位」，而 line 5924 又写了 `(e.ctrlKey || e.metaKey || e.altKey) && (e.key === "d" || e.key === "D")`（创建副本）。
  - **期望表现**：消除重复与覆盖的快捷键条件分支：明确 `Ctrl+D` 创建副本、`Alt+D` 打开来源、`Alt+F` 切换收藏、`Alt+S` 收录全域/剪贴板条目、`Alt+M` 复制 Markdown、独立快捷键（如 `Alt+B` 或 `Ctrl+Shift+M`）切换批量多选模式，并更新顶部键帽提示与测试。
- **解决方案与改动范围**：
  - 梳理并重构 `src/ui/dialog.ts:5767-5980` 的快捷键分派分支，清除死代码并在 `detectShortcutConflicts` 中登记全量快捷键。
- **成本评估**：**小（1）**——仅修改 `src/ui/dialog.ts` 内 `onKeyDown` 分支条件。
- **风险说明**：`scripts/ui-interaction-audit.cjs` 断言了 `Ctrl+D`（复制副本）、`Ctrl+E`（编辑）、`Alt+Delete`（删除）、`Alt+F`（收藏），这些键位必须保持不变。

---

#### `FN-05` · 【功能/半成品】主搜索 `Alt+H`「块层级大纲路径探针」对库内条目未查询真实文档路径，直接拿业务分类名冒充文档路径（假实现）
- **优先级**：影响面 `3`（承诺功能名实不符，误导用户）× 频率 `2`（大纲溯源辅助操作）÷ 成本 `1`（小）= **`6.0`（P2）**
- **问题描述（可复现）**：
  - **位置**：`src/ui/dialog.ts:5802-5811`、`src/index.ts:1370-1925`。
  - **操作步骤**：在主搜索面板选中一条分类为 `"客服"` 的常用语条目，按 `Alt+H` 查看「层级大纲路径探针」。
  - **当前表现**：代码写为 `const docPath = entry.sourceDocPath || (entry.category ... ? entry.category : "未关联文档")`，而库内 `SearchEntry` 并未填充 `sourceDocPath`，导致直接把条目的业务分类 `"客服"` 当作思源文档路径弹出 `📍 所属路径: 客服 · [xlc-demo0000001]`，根本没有查询 `sourceDocId` 或 `libraryDocId` 的真实思源文档可读路径（`hPath`）。
  - **期望表现**：按 `Alt+H` 时，若 `entry.sourceDocPath` 缺失，调用 `library.getDocPath(entry.sourceDocId || entry.libraryDocId)` 异步解析真实思源文档层级路径（如 `/客户成功部/售后话术库`）并结合真实块 ID 展示在预览窗格顶部探针条或 Toast 中。
- **解决方案与改动范围**：
  - 在 `CommonSearchDialog` 的 `deps` 中注入 `getDocPath: (docId: string) => Promise<string | null>`（底层直接委托 `this.library.getDocPath`），在 `Alt+H` 分支中解析真实文档 `hPath` 后展示。
- **成本评估**：**小（1）**——`this.library.getDocPath` 已有现成实现（`openEditDialog` 已在使用），仅需注入 `dialog.ts` 调用。
- **风险说明**：当来源文档已被删除时，`getDocPath` 返回 `null`，需诚实提示「来源文档不存在或无法解析路径」。

---

#### `FN-06` · 【缺陷】多选栏「`⊞ 合并收录`」生成的双换行文本必然触发 `B-006` 写前拦截而无法保存，且「`✦ 批量收录`」异常静默吞掉、按钮状态锁死
- **优先级**：影响面 `4`（合并收录功能 100% 无法完成保存闭环，批量收录状态锁死）× 频率 `2`（剪贴板与全库多选整理场景）÷ 成本 `1`（小）= **`8.0`（P1）**
- **问题描述（可复现）**：
  - **位置**：`src/ui/dialog.ts:6279-6325`（`batchCaptureBtn` 与 `batchMergeBtn`）。
  - **操作步骤**：① 切换到「`📋 剪贴板`」或「`🔍 全库搜索`」，进入多选模式勾选 2 条纯文本条目，点击底部「`⊞ 合并收录`」，在弹出的新建表单中点击「保存」；② 在多选模式下点击「`✦ 批量收录`」收录多条含多段正文的笔记块，完成后再次进入多选模式观察按钮。
  - **当前表现**：
    1. `batchMergeBtn` 用 `"\n\n"` 拼接所选条目正文并以 `first.itemType`（常为 `"text"` 或 `"markdown"`）打开新建表单；用户点「保存」时，`bodyWriteRestriction` 立即报错拒绝多行/空行文本，导致合并收录的内容无法保存入库；
    2. `batchCaptureBtn` 循环调用 `createFromOmni` 时，若笔记块因多行受限返回 `false` 或抛异常，循环结束后即使 `successCount === 0` 仍弹出 `info` 提示「`已成功批量收录 0 项到常用语库`」；且未在 `finally` 中恢复 `batchCaptureBtn.disabled = false`，再次进入多选模式时按钮永久处于禁用且显示「`正在收录…`」。
  - **期望表现**：
    1. 「`⊞ 合并收录`」拼接多条内容时，若含多行则自动包裹为单个完整代码围栏（` ```text\n...\n``` `，类型设为 `"code"`）或合并为单行列表，确保符合 `B-006` 写前边界可直接保存；
    2. 「`✦ 批量收录`」统计成功与失败条数，在 `finally` 中恢复按钮可用状态，且汇总弹出一次清晰回执（如「批量收录完成：成功 X 项，跳过/失败 Y 项」）。
- **解决方案与改动范围**：
  - 修改 `src/ui/dialog.ts:6279-6325` 中 `batchCaptureBtn` 与 `batchMergeBtn` 的事件处理器。
- **成本评估**：**小（1）**——集中在 `src/ui/dialog.ts` 约 45 行代码内。
- **风险说明**：自动包裹代码围栏时需在表单提示中说明因多块保护已转为代码围栏格式，用户仍可在表单内自由编辑。

---

#### `FN-07` · 【缺陷】主搜索预览底栏与快捷键执行「插入嵌入块 / 插入引用」时误走 `insertProviderPayload`，产生双 Toast 冲突、无编辑器时谎报已插入且漏记使用频次
- **优先级**：影响面 `4`（块引用与嵌入块插入回执错误、漏统计 Frecency 频次）× 频率 `4`（`Shift+Enter` 与 `Alt+Enter` 为核心快捷键）÷ 成本 `1`（小）= **`16.0`（P0 最高优）**
- **问题描述（可复现）**：
  - **位置**：`src/ui/dialog.ts:1214-1244, 3373-3381, 5616-5647`。
  - **操作步骤**：选中任意库内常用语条目（或关闭所有文档处于无活动编辑器状态），按 `Shift+Enter`（或点击预览底栏「`⊞ 插入嵌入块`」）或 `Alt+Enter`（或点击「`＋ 插入引用`」）。
  - **当前表现**：`runActionFor` 在 `overrideMode === "insert-embed"` / `"insert-ref"` 时未区分库内条目与全域条目，一律调用 `this.deps.insertProviderPayload(...)`：
    1. 有编辑器时：`insertProviderPayload` 先弹出一次「已插入其他插件内容」，紧接着 `dialog.ts` 又弹出一次「已插入同步嵌入块 / 已插入块引用链接」（连续两次冲突 Toast）；
    2. 无编辑器时：`insertProviderPayload` 实际降级为复制到剪贴板并提示「当前没有活动编辑器…」，但 `dialog.ts:1218 / 5626` 紧接着覆盖弹出「已插入同步嵌入块」，谎报已插入文档；
    3. 因绕过了 `this.deps.runAction(entry.id, "insert-embed" | "insert-ref")`，库内条目的使用频次（`usage`）与最近使用（`recents`）完全未更新。
  - **期望表现**：对库内条目（`!entry.isOmni`），`overrideMode === "insert-embed"` 与 `"insert-ref"` 直接走标准 `this.deps.runAction(entry.id, overrideMode)`（由 `ActionExecutor` 统一执行、记录使用频次并返回准确的单次 Toast 回执）；仅对全域检索条目（`entry.isOmni`）构造引用/嵌入语法插入并依据返回的布尔值与编辑器状态给出单次诚实回执。
- **解决方案与改动范围**：
  - 修改 `src/ui/dialog.ts` 中 `runActionFor`（lines 3373-3394）、底栏按钮（lines 1211-1245）与快捷键分支（lines 5616-5647），移除外层多余的硬编码 `notify`。
- **成本评估**：**小（1）**——复用 `ActionExecutor` 已完备并经过单测验证的 `"insert-embed"` / `"insert-ref"` 分支。
- **风险说明**：需確認普通非 `blockref` 类型的库内条目在 `planAction`（`src/model/actions.ts`）中传入 `"insert-embed"` / `"insert-ref"` 时能按 `entry.blockId` 生成引用/嵌入语法；若 `planAction` 目前仅对 `itemType === "blockref"` 处理 `"insert-embed"` / `"insert-ref"`，则同步在 `planAction` 中放宽至任意具备合法 `blockId` 的库条目。

---

#### `TODO-FEAT-037 ~ 040` (Batch F15) · 小驴全生态深度联动强化与双向闭环落地（T-0817 ~ T-0820）
- **状态**：**已完成（100% 测试通过、全门禁验证、无安全泄露）**
- **对应功能与契约**：
  - **T-0817（TODO-FEAT-037）**：修复外部桥缺陷，为 `search/recent/favorites/get` 补齐 `content` 字段对齐雷切与生态消费契约；
  - **T-0818（TODO-FEAT-038）**：落地全生态动态宏矩阵，接入管家今日待办、任务视界任务、拾遗剪藏与人脉名片；
  - **T-0819（TODO-FEAT-039）**：落地全域生态联合联邦搜索，扩展 `ecosystem.ts` 联合检索管家、拾遗与任务视界并支持一键插入；
  - **T-0820（TODO-FEAT-040）**：剪贴板历史增加一键推送到管家备忘，并将生命周期事件全面升级为 Epoch 6 标准信封格式。
- **验证**：`tests/r404-batch-f15-ecosystem-linkage.test.cjs` 包含负向验证与 1223/1223 全套门禁测试全绿。

---

#### `FN-08` · 【缺陷】设置中心 6 处复制按钮裸调 `navigator.clipboard.writeText` 缺少兼容回退与错误提示，且同步比对文件加载异步链缺少 `.catch()` 与防重锁
- **优先级**：影响面 `3`（操作失败时无任何反馈，异步异常未捕获）× 频率 `2`（设置页复制脚本、AV 规则、Top 榜与同步比对操作）÷ 成本 `1`（小）= **`6.0`（P2）**
- **问题描述（可复现）**：
  - **位置**：`src/ui/settings-dialog.ts:751`（高频 Top 榜胶囊复制）、`2139, 2177, 2194, 2227`（Quicker/AHK/cURL/Raycast 脚本复制）、`2629-2725`（`syncDiffBtn`）、`2910`（AV 规则复制）。
  - **操作步骤**：① 在剪贴板权限受限或非 HTTPS 浏览器环境下点击设置页中的「高频资产 Top 榜胶囊」、「📋 复制 AV 收集规则说明」或 4 个外部联动脚本复制按钮；② 点击「⚡ 同步冲突比对」连续多次点击按钮或选入引发索引读取异常的文件。
  - **当前表现**：① 6 处复制按钮直接调用 `navigator.clipboard.writeText`，未使用项目统一的 `writeRichClipboard`（含 `textarea` + `execCommand("copy")` 降级回退），且 Top 榜复制与 AV 规则复制在 `catch` 中静默吞掉异常，4 个外部脚本复制甚至没有 `.catch()`，失败时用户毫无感知；② `syncDiffBtn` 点击后未像 `importBtn` / `espansoBtn` / `csvImportBtn` 一样锁定按钮防重入，且 `void file.text().then(async (text) => { ... })` 缺少 `.catch()`，一旦异常即产生 unhandled rejection。
  - **期望表现**：6 处复制统一调用 `writeRichClipboard(text)` 并在返回 `false` 时通过 `ctx.notify("error", t("copyFailed"))` 诚实提示；`syncDiffBtn` 补齐飞行态防重锁与 `.catch()` 错误回执。
- **解决方案与改动范围**：
  - 修改 `src/ui/settings-dialog.ts` 中上述 7 处按钮事件处理器，接入 `writeRichClipboard` 与 `setOperationStatus("error", ...)`。
- **成本评估**：**小（1）**——单文件局部加固。
- **风险说明**：无外部风险。

---

### C. 受平台限制无法实现项（共 3 条，`LIM-01` ~ `LIM-03`，不进入开发改动，保留降级与替代方案）

| 编号 | 功能描述 | 判定结论 | 平台限制来源 | 当前替代方案与验证状态 |
| :--- | :--- | :--- | :--- | :--- |
| **`LIM-01`** | 多段落复合 Markdown 结构（列表、引用块、多段文本）直接作为单条可更新/可自动删除条目写回思源块 | **受平台限制无法实现** | 思源内核 `/api/block/appendBlock` 与 `updateBlock` 对多段 Markdown 可能仅返回首块 `insert` ID（详见 `BLOCKERS.md` `B-006`），尾块无 `custom-xlc-*` 属性锚定会导致更新/删除残留孤儿块。 | 写前通过 `bodyWriteRestriction` 诚实拦截并提示；替代方案为使用**单个完整代码围栏**保存多行模板，或使用**块引用条目 (`blockref`) / 发现页引用模式**直接引用原文档块。 |
| **`LIM-02`** | Android 移动端直接向活动编辑器光标处插入内容，以及将图片条目作为二进制位图写入系统剪贴板 | **受平台限制无法实现** | 移动端呼出插件面板后思源宿主编辑器失焦回收选区，且 Android WebView 沙箱限制非 HTTPS 下 `ClipboardItem` 位图写入（`B-002` / `B-003`）。 | 移动端主按钮自动降级为复制纯文本或图片 Markdown 链接（`![](assets/...)`）至剪贴板，并弹出明确降级提示。 |
| **`LIM-03`** | 含 `{{cursor}}` / `$|$` 光标锚点的模板在插入思源富文本编辑器（Protyle）后自动将文内编辑光标定位到块内指定字符偏移处 | **受平台限制无法实现** | 思源官方 `protyle.insert()` 与 `insertContent()` API 仅支持在选区插入并将光标落于插入内容末尾，未开放跨 Lute 渲染 DOM 节点按字符偏移设置光标的公开稳定接口。 | 插入时由 `extractCursorPosition` 自动剥离光标标记避免污染正文，并在 `ExecutionReceipt`、`xiaolv:common:item-inserted` 事件与 `service.resolve` 中返回精确 `cursorOffset` 供外部启动器或纯文本控件定位。 |

---

## 三、 后续轮次分批开发计划（Batch Execution Plan）

为确保后续开发轮次可直接按序取用、每批均能在单轮内高质量闭环并通过全量门禁，将 **17 条可开发待办** 按「**先修 P0 核心阻断缺陷 → 再补 P1 功能断链与布局自适应 → 最后清偿 P2 体验细节与样式技术债**」分为三批：

### 第一批（Batch 1 · P0 核心阻断缺陷修复，共 6 项，预计 1 轮完成）
- **取用条目**：`UI-02`（优先级 20.0）、`FN-02`（20.0）、`FN-07`（16.0）、`UI-01`（12.5）、`FN-01`（10.0）、`FN-03`（10.0）。
- **本批目标**：
  1. 修复主搜索右侧预览窗格 `.xlc-pane` 垂直挤压导致正文与底栏按钮被 `overflow: hidden` 裁切不可见的问题（`UI-01`）；
  2. 补齐 `syncDiffBtn`、`filterCommon`、`reindex` 缺失字典键与侧栏复制 `%s` 传参（`UI-02`）；
  3. 用官方 `Dialog` 输入组件替换 Electron 不支持的 `window.prompt()` / `window.alert()`，恢复批量加删标签、设分类與保存变量预设功能（`FN-01`）；
  4. 统一 `resolvePhysicalBlockId` 并让库内条目引用/嵌入走标准 `runAction`，彻底修复全域检索块引用/嵌入/前后文探针报错及双 Toast 冲突（`FN-02`、`FN-07`）；
  5. 为 `DockView` 接入变量填充卡询问、修正真实插入/降级复制回执并预取完整拖拽正文（`FN-03`）。

### 第二批（Batch 2 · P1 快捷键冲突治理、功能半成品收口与多倍率/窄窗自适应，共 5 项，预计 1 轮完成）
- **取用条目**：`UI-05`（优先级 12.0）、`FN-04`（12.0）、`UI-03`（8.0）、`UI-04`（8.0）、`FN-06`（8.0）。
- **本批目标**：
  1. 解除主搜索 `Alt+M`、`Alt+S`、`Alt+D` 快捷键分支覆盖，激活多选模式与收藏快捷键（`FN-04`）；
  2. 修复多选栏「合并收录」违反 `B-006` 无法保存及「批量收录」状态锁死问题（`FN-06`）；
  3. 收拢新建/编辑表单 120+ 按钮的 `.xlc-varbar` 高度并将底部「取消 / 保存」设为 `sticky` 吸底，消除 2200px 滚动负担（`UI-03`）；
  4. 修复 420px 窄窗下 `.xlc-segmented-track` 水平溢出及 125%/150% 缩放下 `SetupDialog`/`DiscoveryDialog` 底栏按钮遮挡（`UI-04`）；
  5. 将 `.xlc-search-pin`、`.xlc-tag-pill`、`.xlc-form-ai`、发现页复选框尺寸统一提升至 ≥ 24×24px（`UI-05`）。

### 第三批（Batch 3 · P2 次级面板交互一致性、大纲探针真源化与样式令牌清债，共 6 项，预计 1 轮完成）
- **取用条目**：`UI-07`（优先级 9.0）、`UI-08`（8.0）、`UI-09`（6.0）、`FN-05`（6.0）、`FN-08`（6.0）、`UI-06`（4.5）。
- **本批目标**：
  1. 为 `Alt+H` 层级大纲探针接入真实 `library.getDocPath` 路径解析（`FN-05`）；
  2. 为设置中心 6 处复制按钮接入 `writeRichClipboard` 降级回退与错误回执，补齐 `syncDiffBtn` 异常捕获与防重锁（`FN-08`）；
  3. 为侧栏右键菜单补齐 `role="menu"`、`Esc` 关闭与方向键导航，为 `QuickLook` 补齐宏双态预览与方向键联动（`UI-07`）；
  4. 为所有装饰性图标补齐 `aria-hidden="true"`（`UI-08`），为侧栏抽屉补齐块引用按钮并为同步比对确认按钮补齐忙态（`UI-09`）；
  5. 清理 `index.scss` 34 处裸 `px` 字号、暗色模式不可见的 `rgba(0,0,0,0.03)` 及 TS 内联样式（`UI-06`）。

---

## 四、 存量优化阶段专项待办（按模块批次流转）

| 编号 | 所属模块与对象 | 拟优化内容与预期改善 | 建议批次 / 状态 |
| :--- | :--- | :--- | :---: |
| **TODO-OPT-01** | 模块 2：侧边栏 Dock 视图 | 针对 200px~240px 极限极窄宽度下的紧凑布局保护（CSS @container 容器查询响应式流式压缩），完善手势触控与分组折叠平滑过渡 | ✔ 已完成 |
| **TODO-OPT-02** | 模块 3：设置中心 | 5 套模板导入卡片在深色高对比度主题下的视觉层次微调（暗色适配与设计令牌投影升级）与长描述折叠增强 | ✔ 已完成 |
| **TODO-OPT-03** | 模块 4：发现面板 | 大文档多选候选块跨页分页时的勾选记忆与批次采纳后的反向高亮追踪 | ✔ 已完成（Set 持久化） |
| **TODO-OPT-04** | 模块 5：变量填空表单 | 多变量表单滚动穿透防护（overscroll-behavior: contain）与嵌套 Esc 层级栈安全回退机制加固（stopPropagation） | ✔ 已完成 |

---

## 五、 第二轮存量优化重排规划与压测验收（聚焦遗留与深度质感）

- **基线成就**：第一轮 222 项交互元素与 9 大思源联动专项 100.0% 走查全通；
- **第二轮重点与验收结论**：
  1. **极窄视口与移动端边界**：200px~240px 极限侧栏折叠手感与安全区（✔ 已落地 CSS `@container (max-width: 240px)` 响应式微型尺寸与内边距流式保护）；
  2. **暗色高对比度与无障碍精修**：针对 WCAG AAA 标杆，精细校准各状态下的轮廓与焦点环（✔ 消除全量硬编码颜色与阴影、补齐 `aria-hidden="true"` 装饰性图标隐藏与深色模式自适应背景）；
  3. **长时大数据量压测**：500+ 条目大规模加载、连续粘贴队列高频出栈下的 GC 与响应质感（✔ 通过 `pnpm test:scale` 500 条真实思源块创建与 2000ms 索引重建，实测精确/前缀/子串搜索延迟 4ms / 2ms / 1ms，远优于 <50ms 门禁；索引缓存命中 0ms < 5ms）。

---

## 六、 用户批准新功能待办池（自候选清单流转，按批次排期）

> 经 2026-11-01 用户逐项审阅决策，共 10 项候选功能获批转入开发待办池（分四批按序推进），1 项不采纳保留原因记录。

| 编号 | 来源候选 | 模块与功能名称 | 预估成本 | 核心收益与实现要点 | 计划批次 / 状态 |
| :--- | :--- | :--- | :---: | :--- | :---: |
| **TODO-FEAT-001** | `CAND-001` | 主搜索 · 剪贴板搜索流多格式过滤 | 0.5 天 | 剪贴板流增加全部/纯文本/图片/代码格式筛选胶囊，秒级定位图片与代码素材 | ✔ Batch F1 已完成 |
| **TODO-FEAT-002** | `CAND-002` | 变量卡 · 最近输入值快速点填胶囊 | 0.5 天 | 唤起动态变量卡时展示上一次填写值微型胶囊，点击秒级自动填入 | ✔ Batch F1 已完成 |
| **TODO-FEAT-003** | `CAND-003` | 主搜索 · 虚拟滚动触底反馈与可视区间 | 0.3 天 | 结果超过 50 条时提供触底分割线并在底栏展示 `1-12 / 86` 范围指示 | ✔ Batch F1 已完成 |
| **TODO-FEAT-004** | `CAND-004` | 侧边栏 · 多层级分类树与标签聚合折叠 | 1.0 天 | Dock 侧栏支持父子嵌套多级树形折叠及按标签聚合视图切换 | ✔ Batch F2 已完成 |
| **TODO-FEAT-005** | `CAND-006` | 发现面板 · 候选块按字数区间分段筛选 | 0.4 天 | 扫描结果支持按字数区间（短语/句子/段落）精细分流筛选 | ✔ Batch F2 已完成 |
| **TODO-FEAT-006** | `CAND-007` | 快编弹窗 · 原地单块轻量 Markdown 语法色彩 | 0.5 天 | 原地快编文本域增加行首标头、代码围栏与粗体语法轻色彩 | ✔ Batch F3 已完成 |
| **TODO-FEAT-007** | `CAND-008` | 宿主顶栏 · 图标右键极速常用气泡卡片 | 0.8 天 | 右键思源顶栏图标弹出气泡卡片秒级复制/插入 Top 5 高频项 | ✔ Batch F3 已完成 |
| **TODO-FEAT-008** | `CAND-009` | 设置中心 · 近 30 天资产复用活跃度热力图 | 0.5 天 | 在使用统计面板呈现 30 天日历格热力图，直观展现复用活跃度趋势 | ✔ Batch F4 已完成 |
| **TODO-FEAT-009** | `CAND-010` | 主搜索 · 搜索历史队列单条误搜词独立删除 | 0.2 天 | 历史回填浮层提供单条删除 × 按钮，支持精确移除手误敲错的词 | ✔ Batch F4 已完成 |
| **TODO-FEAT-010** | `CAND-011` | 动作菜单 · 常用条目一键生成便携式分享码卡片 | 0.4 天 | 一键将单条资产编码为 xlc-bundle 紧凑字符串并复制，便于他人快速复用 | ✔ Batch F4 已完成 |
| **TODO-FEAT-011** | `CAND-012` | 主搜索 · 「紧凑单行 / 舒适卡片」双视图切换 | 0.4 天 | 搜索结果支持双视图一键切换并持久化偏好，紧凑模式提供 2 倍垂直容量 | ✔ Batch F5 已完成 |
| **TODO-FEAT-012** | `CAND-013` | 剪贴板 · 搜索流自然时间分段聚合（今天/昨天/更早） | 0.3 天 | 剪贴板暂存历史按今天、昨天、更早自动分段，清晰辨识素材产生时点 | ✔ Batch F5 已完成 |
| **TODO-FEAT-013** | `CAND-014` | 侧边栏 · 条目自定义手动排序与上移下移微调 | 0.6 天 | 支持自定义手动排序模式，在 Dock 侧栏提供上移/下移按钮并持久化权重 | ✔ Batch F5 已完成 |
| **TODO-FEAT-014** | `CAND-015` | 主搜索 · 搜索框符号前缀极速过滤（#/@/type:） | 0.3 天 | 输入框直接识别 `#标签`、`@分类`、`type:类型` 并派发筛选，全键盘无鼠标流 | ✔ Batch F6 已完成 |
| **TODO-FEAT-015** | `CAND-016` | 变量卡 · 全局名片池与常用身份档案自动预填 | 0.4 天 | 维护全局个人身份档案，变量卡姓名/电话/邮箱/税号等字段匹配时秒级自动预填 | ✔ Batch F6 已完成 |
| **TODO-FEAT-016** | `CAND-017` | 快捷复制 · 多格式极速复制直选菜单 | 0.4 天 | 条目复制按钮支持直选纯文本、微信富文本HTML、Markdown与块引用 | ✔ Batch F6 已完成 |
| **TODO-FEAT-017** | `CAND-018` | 主搜索 · 极窄轻量悬浮迷你模式（Mini Mode） | 0.4 天 | 主搜索支持 280px 单列极简浮条切换（Alt+M），边写边查零遮挡 | ✔ Batch F7 已完成 |
| **TODO-FEAT-018** | `CAND-019` | 暂存托盘 · 常用语购物车与批量合并插入/复制 | 0.5 天 | 常用语购物车暂存托盘，支持连续加选后一键合并插入或合并复制 | ✔ Batch F7 已完成 |
| **TODO-FEAT-019** | `CAND-021` | 迷你悬浮 · 非模态常驻与编辑器背景无感穿透 | 0.4 天 | 迷你模式下开启常驻（Pin），背景遮罩透明并穿透点击，编辑器协同零阻断 | ✔ Batch F8 已完成 |
| **TODO-FEAT-020** | `CAND-022` | 迷你悬浮 · 自由拖拽停靠与坐标跨会话位置记忆 | 0.4 天 | 迷你条把手支持鼠标自由拖拽到屏幕任意角落，自动记忆坐标并在下次打开恢复 | ✔ Batch F8 已完成 |
| **TODO-FEAT-021** | `CAND-023` | 迷你悬浮 · 边缘一键折叠为贴边微型灵动胶囊 | 0.3 天 | 支持一键折叠为 32px 贴边胶囊，不占视野，点击秒级展开即时检索 | ✔ Batch F8 已完成 |
| **TODO-OPT-05** | `CAND-024` | 迷你悬浮 · 贴边自动磁吸对齐（Magnetic Snap） | 0.2 天 | 拖拽至屏幕边缘 ≤20px 阈值时自动磁吸贴靠，消除缝隙悬空感 | ✔ Batch F9 已完成 |
| **TODO-OPT-06** | `CAND-025` | 暂存托盘 · 自定义段落分隔符与单项出栈 | 0.3 天 | 购物车支持双换行、分割线（---）与紧凑连接切换，支持单项移除 | ✔ Batch F9 已完成 |
| **TODO-OPT-07** | `CAND-026` | 迷你模式 · 前 9 项「1~9 数字极速直达键帽」盲打支持 | 0.3 天 | 迷你列表呈现微型数字键帽，单键 1~9 插入 / Shift+1~9 复制 | ✔ Batch F9 已完成 |
| **TODO-FEAT-022** | `CAND-027` | 系统全局 · 注册 globalCallback 系统级全局热键 | 0.3 天 | 注册官方 globalCallback（⌥⇧M），无论焦点在微信还是思源后台最小化均可响应 | ✔ Batch F10 已完成 |
| **TODO-FEAT-023** | `CAND-028` | 系统全局 · 唤起即极窄迷你悬浮条并默认复制模式 | 0.3 天 | 外部全局唤起时自动呈现极窄迷你模式，回车即复制并给出明确气泡回执 | ✔ Batch F10 已完成 |
| **TODO-FEAT-024** | `CAND-029` | 系统全局 · 取用完成自动重新归隐后台并交还焦点 | 0.3 天 | 复制完成或 Esc 取消后自动重新最小化或隐退后台，焦点直接归还外部软件 | ✔ Batch F10 已完成 |
| **TODO-FEAT-025** | `CAND-030` | 行内击键 · 字符击键静默自展开（Auto-Expansion） | 0.6 天 | 输入 :简码 打完瞬间自动退格替换为常用语正文，零弹窗无打断体验 | ✔ Batch F11 已完成 |
| **TODO-FEAT-026** | `CAND-031` | 上下文感知 · 当前编辑文档语义感知与智能首屏推荐 | 0.5 天 | 感知当前文档标题/路径/标签，首屏智能优先置顶相关条目与分类 | ✔ Batch F11 已完成 |
| **TODO-FEAT-027** | `CAND-032` | 连环取用 · 主题套件悬浮拼板（Pinboard Deck） | 0.6 天 | 开票/填单多项常用语横向悬浮卡片组，点击秒复并高亮变绿进度标记 | ✔ Batch F11 已完成 |
| **TODO-FEAT-028** | `CAND-033` | 预置资产 · 商务/客服/开发/学术四大场景专属开箱包 | 0.5 天 | 构建四套专业行业常用资产包，含合规纯文本、动态变量与智能注解 | ✔ Batch F12 已完成 |
| **TODO-FEAT-029** | `CAND-034` | 极速冷启 · 空库状态卡片化开箱装载器一键直装 | 0.4 天 | 空库状态呈现四大角色卡片，点击任意角色一秒注入，条目即刻可见 | ✔ Batch F12 已完成 |
| **TODO-FEAT-030** | `CAND-035` | 资产市场 · 首跑引导与设置中心开箱即用套件市场 | 0.4 天 | 集中呈现 Starter Packs Hub 资产市场，支持按场景预览与批量增补 | ✔ Batch F12 已完成 |
| **TODO-FEAT-031** | `CAND-036` | 主搜索 · 增设「📦 开箱套件」常驻入口随时直达 | 0.3 天 | 底栏与工具条常驻套件库入口，非空库状态也能随时一键唤起货架 | ✔ Batch F13 已完成 |
| **TODO-FEAT-032** | `CAND-037` | 套件中心 · 可视化 Starter Packs Hub 对话框 | 0.5 天 | 独立套件中心弹窗，支持按套件展开查看条目与预览，自主一键启用 | ✔ Batch F13 已完成 |
| **TODO-FEAT-033** | `CAND-038` | 设置中心 · 模板区直连套件中心与幂等状态检测 | 0.3 天 | 设置中心模板区升级为套件中心直达，自动标记已启用/未启用状态 | ✔ Batch F13 已完成 |
| **TODO-FEAT-034** | `CAND-039` | 预置精修 · 逐项补齐简码/别名/排版美感与注解 | 0.5 天 | 仔细审核四大套件每条常用语，配齐 :code、拼音别名、变量与超级块 | ✔ Batch F14 已完成 |
| **TODO-FEAT-035** | `CAND-040` | 思源结合 · 开箱套件生成专属文档与原生标签锚定 | 0.5 天 | 结合思源笔记本支持创建《常用资产·场景》结构化文档与#小驴常用#标签 | ✔ Batch F14 已完成 |
| **TODO-FEAT-036** | `CAND-041` | 启用分流 · 套件中心支持合并当前库 vs 新建专属文档 | 0.4 天 | 提供双启用模式选择器，兼顾单文档极速合并与多文档树库归档习惯 | ✔ Batch F14 已完成 |




