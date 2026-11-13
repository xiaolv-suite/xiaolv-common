# ADR 0142：Markdown嵌套列表打平、任意文本范围脱敏宏与中英文综合排版规整 (Flatten Nested List, String Mask Macro & Comprehensive CJK Spacing)

## 状态
已接受，T-0510~T-0514（2026-10-29）。

## 背景与上下文
在思源笔记多层级脑图列表重构、任意字段隐私保护与中英文案全流程格式化场景中，存在三类高频实用痛点：
1. **Markdown 多层嵌套列表打平与父级路径展平**：
   从思维导图导出的多层嵌套列表或深层大纲，层级过深会导致小屏幕横向溢出。用户需要将其快速展开为顶层平级圆点列表（`flat_bullets`），或带上祖先层级前缀（`prefix_parent`，如 `- 研发部 > 前端团队: Vue 小组`），便于作为待办清单执行；
2. **任意文本指定位置/留头尾掩码脱敏与 `{{xlc:smask}}` 动态宏**：
   原有脱敏宏 `mask` 仅支持基于正则自动嗅探手机号、邮箱等特定形态。在面对银行卡号、自定义密钥 Token、工号或客户代码时，用户需要纯函数支持灵活指定留头尾长度（如保留前 4 后 4，中间全变 `*`）或指定任意字符区间掩码替换；
3. **中英文排版、标点全半角与隐形空格全流程综合规整**：
   在文案最终润色时，用户以往需要依次点击“清洗空格”、“盘古排版”与“规整标点”。需要纯函数一键式（One-pass）串联隐形 NBSP 剔除、中英盘古之白空格与标点全半角间距标准化，并提供是否产生变更的状态回执。

## 决策与落地
1. **Markdown 嵌套列表展开打平引擎 (`flattenNestedList`)**：
   - 纯函数实现，支持 `flat_bullets`（剥离缩进统一为顶层 `- `）与 `prefix_parent`（维护祖先层级栈，展开为前缀路径）2 种打平模式；
   - 动作菜单接线「📑 扁平化展开嵌套多级列表并复制」，表单格式栏接入「✦ 展开打平列表」。
2. **任意文本范围与留头尾掩码脱敏引擎 (`maskTextRange`) 与 `{{xlc:smask}}` 动态宏**：
   - 纯函数实现，支持 `keepStart`/`keepEnd` 留头尾模式与 `start`/`length` 区间模式，支持自定义掩码字符；
   - 扩展动态宏体系 `{{xlc:smask|keep|13812345678|3|4}}`、`{{xlc:smask:ends|1234567890|2|2}}`、`{{xlc:smask|hello world|0|5}}`；
   - 表单格式栏接入「✦ 留头尾脱敏」，表单变量栏补充 `{{xlc:smask|keep|1234567890|2|2}}`。
3. **中英文排版与标点空格综合规整引擎 (`formatCJKSpacingComprehensive`)**：
   - 纯函数实现，串联执行 `sanitizeLineEndingsAndSpaces` -> `formatPanguSpacing` -> `formatPunctuationSpacing`；
   - 动作菜单接线「✨ 中英文与标点空格综合完美排版并复制」，表单格式栏接入「✦ 综合排版规整」。
4. **自动化门禁与双向严格负向验证**：
   - 新增 `tests/r368-flattenlist-smaskmacro-and-cjkspacing.test.cjs` 专项测试；
   - 负向突变 115 破坏列表打平输出，负向突变 116 破坏范围脱敏逻辑，两项负向测试均被精确拦截；
   - 源码恢复后复验全绿通过，单元测试总数达到 984/984 项。

## 结果与证据
- 单元测试增至 **984/984 项全绿**，耗时 ~7.1s；
- 负向违规注入测试精确拦截率 100%；
- TypeScript 类型检查 0 错误（`pnpm run check`）；
- 异常处理安全检查通过（`pnpm run check:errors`）；
- 变更日志检查通过（`pnpm run check:changelog`）；
- 包资源检查校验通过（`pnpm run check:package`，版本 0.10.60）；
- Webpack 生产构建产出 `./package.zip`。
