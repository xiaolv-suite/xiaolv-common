# ADR 0152：Dock 侧栏折叠状态记忆、URL 参数提取宏与多行前缀装饰引擎 (Dock Memory & Formatting Macros)

## 状态
已接受，T-0569~T-0573（2026-10-29）。

## 背景与上下文
在侧栏 (DockView) 原生视图落地分类折叠树后，用户提出了进一步的体验与心流诉求：
1. **侧栏树折叠状态记忆**：之前各分类折叠状态随刷新而重置，用户整理好的折叠状态易被强行冲刷展开，需要跨刷新保持记忆；
2. **URL 结构化参数提取需求**：用户常需要在模版中解析并复用 URL 中的指定 query 参数、主机名或路径；
3. **批量行前缀/后缀装饰需求**：在写代码注释、Markdown 引用、任务清单或批量列表时，用户迫切需要一键批量为多行添加前缀或后缀。

## 决策与落地
1. **Dock 侧栏分类折叠状态跨刷新记忆保持 (`src/ui/dock-view.ts`)**：
   - 增加共享分类折叠状态集合 `DockView.sharedCollapsedCategories`，实例挂载并双向同步；
   - 无论页面刷新、重新打开侧栏还是差量通知更新，用户折叠分类偏好均精确保持；
   - 暴露 `getCollapsedCategories()` 与 `setCategoryCollapsed()` 接口，便于程序化编排。
2. **URL 结构化提取引擎与动态宏 (`src/service/text-formatting.ts`, `src/model/placeholders.ts`)**：
   - 实现纯函数 `extractUrlComponent(url, component, paramKey)`，安全解析提取 query、host、path、protocol；
   - 扩展宏体系：`{{xlc:url:param|key|url}}`、`{{xlc:url:host|url}}`、`{{xlc:url:path|url}}`、`{{xlc:url:protocol|url}}`。
3. **多行文本批量前缀与后缀装饰引擎与动态宏**：
   - 实现 `prefixLines(text, prefix, options)` 与 `suffixLines(text, suffix, options)`，默认保留空行不注入多余空白；
   - 扩展宏体系：`{{xlc:line:prefix|前缀|多行文本}}`、`{{xlc:line:suffix|后缀|多行文本}}`、`{{xlc:line:trim|多行文本}}`。
4. **自动化测试与负向门禁验证**：
   - 新增专项测试 `tests/r382-dock-memory-and-formatting-macros.test.cjs`；
   - 注入负向突变 142（破坏 URL 参数提取逻辑），门禁精准拦截红灯，恢复后复验全绿；
   - 单元测试增至 **1026/1026 项全绿**。

## 结果与证据
- 单元测试增至 **1026/1026 项全绿**；
- 负向违规注入测试精确拦截率 100%（累计完成 142 轮严格负向验证）；
- 生产截图测试 25/25 张全部通过（`pnpm run test:ui`）；
- UI 交互审计 77/77 全链路 100% 通过（`pnpm run test:ix`）；
- TypeScript 类型检查 0 错误（`pnpm run check`）；
- Webpack 生产构建产出 `./package.zip`。
