## [0.9.4] — 2026-10-27

SuperMemo 渐进反思批判模板包与金句沉淀通道（Issue #2 落地）：高阶认知加工模板、金句沉淀 API、全仓弹窗版本号收敛与 751 项单测全绿通过。

### 新增与核心优化

- **SuperMemo 渐进反思批判模板包 (Reformulation Pack)**：响应 Issue #2 中枢深化建议，预置 6 项高阶认知加工模板（核心论点提炼 `thesis`、反思质疑批判 `critique`、知识网状联结 `connection`、现实生活行动 `action`、绝妙金句摘录 `quote` 与四维一体重述卡片），100% 严格符合 B-006 写前安全限制，开箱即用。
- **渐进金句极速资产化沉淀通道 (`captureQuote`)**：开放对外服务接口 `captureQuote`、窗口桥 `window.xiaolvCommon.captureQuote` 与思源协议命令 `xiaolv.common.captureQuote`，支持传递金句正文、作者、来源块与文档，自动推导拼音缩写别名并秒级沉淀入库。
- **全仓二级弹窗版本号规范化收敛**：根治多处二级弹窗标题栏徽标硬编码历史遗留版本的缺陷，统一依赖 `src/constants.ts` 导出的 `PLUGIN_DISPLAY_VERSION`。
- **CHANGELOG 全量同步**：全量补齐面向用户的历史变更日志。

### 验证与已知边界

- 全套质量门禁：单元测试 751/751 项全绿通过、TypeScript 类型检查 0 错误、错误处理静态扫描、密钥安全扫描、安装包根相对结构校验（15 项必需资源健全）全部通过。
- B-005（操作系统沙箱）未解除前停止真实 Electron 宿主实验；B-006 多块正文更新与 AST 验证继续保持单行/围栏防御。真实 AI 与 Android 触控边界继续保留。集市（bazaar）未获用户授权严禁自行推送，本次发布为独立 GitHub Release。
