# ADR 0164：存量材料单一事实源收敛、`:shortcode` 全链路闭环与多源同步/探针缺陷治理

- **状态**：已采纳（2026-10-31，v0.10.79）
- **关联任务**：T-0746 ~ T-0751（`TD-001` ~ `TD-006`）

## 背景

项目经历多轮快速迭代后，积累了大量阶段性开发账本、竞品调研、任务草稿与早期原型（如 `prototype-r187.html`），且近期合入的 `:shortcode` 简码（T-0741）、动态宏扩展（T-0742）、多源同步冲突比对（T-0602）及部分工具函数存在「模型层已实现但 UI 录入、导入导出持久化或执行器未完全打通」的半成品断点及局部缺陷。

## 决策

1. **单一事实来源（Single Source of Truth）**：
   - 建立 [`docs/todo-pool.md`](../todo-pool.md) 统一维护全仓存量材料四态盘点、权威原型（`docs/design/prototype.html` v4）逐屏对照、全链路功能验证矩阵与唯一有效待办池；
   - 原有规划与调研文档一律保留不删，在头部注入迁移指针；过期原型 `prototype-r187.html` 归档至 `docs/design/archive/prototype-r187.html` 并附说明。
2. **先修缺陷，再补半成品，零孤立函数残留**：
   - 修复设置中心同步冲突比对漏读 `ExportedItem.kramdown` 及 `update`/`fork`/`delete` 策略混用问题（`TD-001`）；
   - 消除相邻块语境探针（`Alt+J`）与 Dock 侧栏分类组头的未转义 `innerHTML` 拼接（`TD-002`）；
   - 修复编辑弹窗标签中文分隔符切分、保存后 Dock 侧栏联动刷新、侧栏来源失效 ID 映射、物理 `blockId` 拖拽回退与雷切桥动态版本号（`TD-003`）；
   - 打通 `:shortcode` 从新建/编辑表单、JSON/Markdown 包导入导出、Espanso 自动提取、Checksum 签名、`recall` 协议直达到 Dock 侧栏徽标与 `Tab` 直达的完整闭环（`TD-004`）；
   - 对齐 `listPlaceholders` / `applyPlaceholders` 与 `expandMacroPreview`，确保 `{{doc.title}}`、`{{doc.path}}`、`{{date+Nd}}` 在实际插入/复制时按需拉取文档信息，同时严格保留裸 `{{date}}` 给思源原生模板避免误伤，并透传 `cursorOffset` 光标落点偏移（`TD-005`）；
   - 将 `clearAllMemory`、`countRememberedFields`、`jsonToProperties`、`renameHierarchyNode`、`reparentHierarchyPath`、`calculateVirtualScrollWindow`、`detectShortcutConflicts` 全部接入对应生产 UI 与批处理链路（`TD-006`）。

## 后果与验证

- 全仓单元测试提升至 **1162/1162 项通过**（含负向突变 176 红绿闭环验证）；
- 生产 UI 冒烟与 77/77 交互审计全部通过；
- 保留 `package-v0.10.78.zip` 作为上一版可回滚产物，本地升级至 `v0.10.79` 并打本地标签，不做任何远程推送。
