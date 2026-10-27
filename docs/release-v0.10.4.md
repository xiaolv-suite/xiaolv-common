## [0.10.4] — 2026-10-28

Task Horizon SOP 任务清单包与思源标准 Callout 提示框组件包（Issue #3 闭环）：多级 SOP 任务树模板、官方标准 Callout 高亮折叠卡片、设置面板一键导入与 783 项单测全绿通过。

### 新增与核心优化

- **Task Horizon (任务视界) 联动 SOP 任务清单模板包 (`TASK_HORIZON_PACK_MD`)**：
  - 响应 Issue #3 统领深化建议，深度直连任务管理生态；
  - 预置标准 SOP 任务清单（项目发版 SOP、P0 线上故障紧急排查 SOP、商务出行准备 SOP）；
  - 原生注入标准任务属性（`custom-priority="high|urgent|medium"` 与 `custom-status="in_progress|todo"`），插入思源文档后 Task Horizon 自动构建出层级任务树与看板卡片；
  - 100% 严格符合 B-006 写前安全限制，开箱即用。
- **思源官方标准 Callout 提示框组件模板包 (`CALLOUT_PACK_MD`)**：
  - 基于思源官方标准 Callout 语法，预置 5 款高质感提示卡片：
    - `📌 [!NOTE] 核心笔记卡片`
    - `💡 [!TIP] 实用技巧卡片`
    - `🔥 [!IMPORTANT] 重要结论卡片`
    - `⚠️ [!WARNING] 警告警示卡片`
    - `🛑 [!CAUTION] 风险注意卡片`
  - 内嵌动态问答变量（`{{xlc:ask:提示标题}}`、`{{xlc:ask:提示内容}}` 等），一键插入高亮醒目的官方 Callout 块。
- **全套质量门禁**：单元测试增至 783/783 项全绿通过。

### 验证与已知边界

- 全套质量门禁：单元测试 783/783 项全绿通过、TypeScript 类型检查 0 错误、错误处理静态扫描、密钥安全扫描、CHANGELOG 门禁扫描、安装包根相对结构校验（15 项必需资源健全）全部通过。
- B-005（操作系统沙箱）未解除前停止真实 Electron 宿主实验；B-006 多块正文更新与 AST 验证继续保持单行/围栏防御。真实 AI 与 Android 触控边界继续保留。集市（bazaar）未获用户授权严禁自行推送，本次发布为独立 GitHub Release。
