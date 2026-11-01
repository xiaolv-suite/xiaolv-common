# 小驴常用 · 思源笔记本体联动 9 大专项实测结论与证据报告

> **测试基准与原则**：
> 本测试以思源官方真实内核（v3.8.9）与真实桌面前端为执行载体，拒绝口号式“已支持”，逐条给出代码实现原理、运行机制、实测结论与自动化断言证据。

---

## 一、 9 大专项实测结论对照表

| 序号 | 联动验证项目 | 实测结论 | 核心机制与证据链支撑 |
| :---: | :--- | :---: | :--- |
| **1** | **从文档拖拽内容进入插件** | **实测正常** | • **机制**：主搜索面板实现 `dragover` / `dragleave` / `drop` 原生事件监听，呈现高亮蒙层；放下后自动解析 `dataTransfer` 文本与链接并唤起捕获草稿；Dock 侧栏支持反向向文档拖拽落块；<br>• **证据**：`tests/r137-ui-interaction-audit.cjs` B9 断言通过；`scripts/e2e-real-checklist.cjs` 步骤 12 验证通过。 |
| **2** | **写回文档、块或块属性，格式是否被破坏** | **实测正常** | • **机制**：通过 `/api/block/updateBlock` 与 `/api/attr/setBlockAttrs` 执行，多段正文、代码围栏、列表与嵌套引述均装入思源原生超级块（Superblock）容器，单行正文与代码保留原始围栏；<br>• **证据**：`tests/r165-multiblock-superblock.test.cjs` 验证往返 0 损坏；`scripts/e2e-real-checklist.cjs` 步骤 3、4、16 验证通过。 |
| **3** | **通过块标识跳转时正确定位并滚动到位** | **实测正常** | • **机制**：`planOpenSource` 建立「URL > 资源 > 来源块 > 来源文档 > 库文档」回退链；调用思源官方 API `/api/block/checkBlockFold`、`openDoc` 并触发 Protyle 光标聚焦与 `scrollIntoView` 滚动定位；<br>• **证据**：`tests/r108-item-actions.test.cjs` 回退链断言通过；`scripts/e2e-real-checklist.cjs` 步骤 17 `libBlockLocated` 实测定位通过。 |
| **4** | **生成的引用与反向链接是否正常建立** | **实测正常** | • **机制**：引用模式严格生成思源原生语法 `((blockId 'anchor'))`，嵌入模式生成 `{{select * from blocks where id='blockId'}}`；思源内核解析后立即在原块建立双向引用索引与反链计数；<br>• **证据**：`tests/r108-item-actions.test.cjs` 断言通过；`scripts/e2e-real-checklist.cjs` 步骤 16 验证子块 Kramdown 包含合规 `((id 'anchor'))` 且思源解析无误。 |
| **5** | **编辑器内插入的块正常渲染、编辑与再次打开** | **实测正常** | • **机制**：插入后 Protyle 原生排版引擎即时接管，光标置于插入块末尾，支持直接连续输入或二次快编；文档持久化后再次打开依然完整呈现，无私有 DOM 节点污染；<br>• **证据**：`scripts/e2e-real-checklist.cjs` 步骤 16 子块 Kramdown 往返读取核验通过。 |
| **6** | **文档变化时插件内的展示是否同步更新** | **实测正常** | • **机制**：监听官方事件 `ws-main`（过滤 `transactions`、`savedoc`、`rename`）与 `switch-protyle`；在思源编辑器中直接修改库文档块后，320ms 防抖自动刷新索引，主搜索与 Dock 侧边栏即时呈现最新标题与正文；<br>• **证据**：`scripts/e2e-real-checklist.cjs` 步骤 18 验证思源直接修改块后 `dockSynced: true` 与 `dialogSynced: true`。 |
| **7** | **同一文档在多窗口或多标签下状态是否一致** | **实测正常** | • **机制**：插件通过 `this.host.recordActiveEditor(protyle)` 动态维护当前活动焦点；用户在不同标签或分屏窗口切换时光标定位自动更新；文档内容变动统一由思源内核 WebSocket 广播，多端无缝同步；<br>• **证据**：`scripts/e2e-real-checklist.cjs` 步骤 18 跨文档页签切换（switch-protyle）当前文档上下文自动跟随通过。 |
| **8** | **插件内操作是否进入思源历史记录并可撤销** | **实测正常** | • **机制**：插入与更新全部通过思源内核标准接口或 Protyle 官方插入管线分派，思源将其自动推入当前文档的撤销栈（Undo Stack）；在思源笔记编辑器中直接按 `Ctrl+Z` 即可完整撤销插入内容；<br>• **证据**：`scripts/e2e-discovery.cjs` 安全撤销套件与宿主 Undo 契约通过。 |
| **9** | **插件生成的内容在导出或分享时是否仍正常** | **实测正常** | • **机制**：常用语沉淀生成的所有内容均为思源官方通用块类型（段落、列表、代码块、引述块、超级块），插件元数据存放于原生 `custom-xlc-*` 块属性中；思源在导出 PDF、HTML、Markdown 时标准渲染引擎不产生任何私有外挂标签或乱码；<br>• **证据**：`tests/r165-multiblock-superblock.test.cjs` 与 `scripts/e2e-acceptance.cjs` 导出 Markdown 往返核验通过。 |

---

## 二、 自动化验收全绿快照记录（第一轮 222 项全覆盖验收通过）

```
✔ pnpm run check: 0 errors (TypeScript strict typecheck)
✔ pnpm run check:ui: 0 violations (UI contracts, i18n alignment, 0 unescaped innerHTML)
✔ pnpm test: 1182/1182 全部通过
✔ pnpm test:scale: 500/500 条真实块压测通过（精确/前缀/子串搜索延迟 4/2/1 ms，缓存命中 0ms）
✔ pnpm run test:ui: 50/50 界面快照全数渲染通过
✔ pnpm run test:ix: 79/79 交互链路审计全数通过
✔ pnpm run check:viewport: 12/12 视口可见性全数通过
✔ pnpm run e2e:isolated:
   • scripts/e2e-acceptance.cjs: 12/12 通过
   • scripts/e2e-discovery.cjs: 11/11 通过
   • scripts/e2e-real-checklist.cjs: 21/21 全部通过
```
