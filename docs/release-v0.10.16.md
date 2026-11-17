# 小驴常用 v0.10.16 发布说明

## 概述

小驴常用 `v0.10.16` 带来高安全随机密码与凭据生成宏、HTML 实体安全转义引擎与 Markdown 表格列对齐规整工具。
当前版本仅在本地仓库更新，全套 819/819 项单元测试全绿通过，遵照用户指令封禁期不推送远程 GitHub。

## 详细变更

1. **高安全随机密码与凭据生成宏 (`generateSecurePassword`)**：
   - 彻底满足研发配置、测试账号、通知模板与随机密钥场景；
   - 支持动态宏：`{{xlc:password}}`（默认 14 位 complex 强密码）、`{{xlc:password|16}}`、`{{xlc:password|6|pin}}`（纯数字）、`{{xlc:password|hex}}`（十六进制）、`{{xlc:password|simple}}`（排除易混淆字符）；
   - 表单快捷变量栏新增 `{{xlc:password|16}}` 快捷按钮。

2. **HTML 实体安全转义与反转义引擎 (`escapeHtmlEntities`/`unescapeHtmlEntities`)**：
   - 支持 `<, >, &, ", '` 安全实体转义与还原；
   - 扩充宏语法：`{{xlc:html:escape|...}}` 与 `{{xlc:html:unescape|...}}`；
   - 动作菜单接线「✦ 转义 HTML 实体并复制」与「✦ 还原 HTML 实体并复制」；
   - 表单快捷格式栏新增「✦ 转义HTML」与「✦ 还原HTML」。

3. **Markdown 表格排版规范化与列宽自适应对齐 (`formatMarkdownTable`)**：
   - 精准度量 CJK 中文双倍宽度与 ASCII 字符宽度；
   - 智能美化对齐各列空格，规范对齐指示符（`:---`, `:---:`, `---:`）；
   - 动作菜单接线「⊞ 规整对齐 Markdown 表格并复制」；
   - 表单快捷格式栏新增「✦ 表格对齐」。

## 质量与门禁证据

- 单元测试：819/819 全绿通过；
- 静态检查：`pnpm run check` 0 错误；
- 错误抛出检查：`pnpm run check:errors` 全绿；
- CHANGELOG 对齐：`pnpm run check:changelog` 全绿；
- 打包合规：`pnpm run check:package` 全绿；
- 负向验证：两项负向违规注入均准确被拦截报错，源码恢复后 SHA256 与正向测试复验全绿。
