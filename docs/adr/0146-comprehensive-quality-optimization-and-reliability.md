# ADR 0146：插件全面质量优化、生命周期治理与交互稳定性提升 (Comprehensive Quality Optimization & Reliability)

## 状态
已接受，T-0530~T-0534（2026-10-29）。

## 背景与上下文
随着小驴常用插件在宏计算、文本清洗与多维大纲转换等领域的能力快速扩展，系统在长期运行、极端边界与交互一致性方面暴露出若干需要系统性治理的隐患：
1. **组件生命周期与事件监听泄漏**：
   - `SearchDialogController.open()` 在 SiYuan 原生弹窗关闭时未调用内部的 `this.destroy()`，导致菜单捕获式 `pointerdown` 监听器永久滞留在 `document` 上，长按定时器在弹窗关闭后向 `document.body` 挂载孤儿菜单；
   - `csv-tsv-wizard.ts` 在 `window.visualViewport` 上绑定的视口变化监听器在向导弹窗关闭时未解绑；
   - `variable-form.ts` 在关闭时未清除实时预览的 `liveDebounceTimer`。
2. **异步异常捕获与 UI 锁死漏洞**：
   - `quick-edit.ts` 的 `doSave()` 中未捕获内核写入异常，网络中断或校验失败会导致保存按钮永久停留在 loading 状态无法重试；
   - `dialog.ts` 中 `createFromOmni`、`cleanClipBtn` 存在未捕获的异步 Promise 异常。
3. **UI 一致性与无障碍细节断层**：
   - `tokens-r187.scss` 中的词法标记类名（`&--kw`、`&--str`、`&--num`）与 `preview-renderer.ts` 产出的 `xlc-tok--keyword`、`xlc-tok--string`、`xlc-tok--number` 不一致，导致代码块预览语法高亮失效；
   - `.xlc-surround-banner` 误置于高对比度媒体查询内部，常规用户界面缺少横幅样式；
   - Quick Edit 弹窗缺少标准主题容器类名与焦点闭环；弹窗关闭时未将焦点还原到编辑器触发点。
4. **性能瓶颈与 ReDoS 安全防御**：
   - `formatByRegexGroups` 和 `censorText` 在循环中反复构造动态 `RegExp` 对象并触发多遍全文扫描；
   - `padOrTruncate` 与 `generateNumericSequence` 对超大宽度缺乏上限约束，存在抛出 `RangeError: Invalid count value` 风险；
   - `{{xlc:match}}` 和 `{{xlc:regex:mreplace}}` 缺少 `isDangerousRegex()` 检查与输入长度截断。

## 决策与落地
1. **生命周期与资源泄露彻底阻断**：
   - 在 `SearchDialogController.destroyCallback` 中显式执行 `this.destroy()`，并引入 `isDestroying` 幂等防重入守卫，确保菜单监听器、拖拽覆盖层、列表滚动监听及防抖/长按定时器 100% 干净卸载；
   - 在 `csv-tsv-wizard.ts` 和 `variable-form.ts` 的 `destroyCallback` 中显式移除 `window.visualViewport` 监听器并清理未结算的计时器；
   - 在所有弹窗打开前记录 `document.activeElement`，销毁时自动通过安全 `try...catch` 还原焦点。
2. **异步健壮性与安全错误处理**：
   - 为 `quick-edit.ts` 的 `doSave()` 补充完善的 `try...catch` 结构，使用官方规范的 `toErrorMessage(err)` 统一提取异常文本，失败时自动恢复保存按钮并提示错误；
   - 在 `service.ts` 的 `remove()` 中为 `state.usage` 增加空对象保护；
   - 修复 `item.ts` 中 `cleanString()` 对 UTF-16 代理对判定的逻辑漏洞（仅截除缺失低代理的高代理码元 `0xd800..0xdbff`），彻底杜绝 Emoji 截断后破损为非法字符；
   - 修正 `capture.ts` 标签分隔符正则为 `/[,，、;；\s]+/`。
3. **UI 视觉与键盘无障碍交互对齐**：
   - 补充 `tokens-r187.scss` 双向类名映射（`&--keyword, &--kw`、`&--string, &--str`、`&--number, &--num`），全面恢复代码预览语法高亮；
   - 将 `.xlc-surround-banner` 移入通用基础样式，使用语义变量 `--xlc-warm`、`--xlc-warm-ink`；
   - 为 Quick Edit 注入 `.xlc-form-host`、`.xlc-dialog-host` 并使用标准主按钮 `.xlc-btn-primary`；
   - 优化 Tab 键焦点捕获与 Escape 取消逻辑，使用轻量 `offsetParent !== null` 代替昂贵的 `offsetWidth`/`getComputedStyle`，消除布局重排抖动（Layout Thrashing）；
   - 消除 `dialog.ts` 中 `refreshPreservingPosition` 的冗余二次渲染。
4. **性能提升与 ReDoS 边界防御**：
   - 将 `formatByRegexGroups` 重构为单遍正则反向引用替换，彻底消除循环内 `new RegExp` 编译；
   - 将 `censorText` 重构为单正则合并交替表达式（`words.join("|")`），由 $N$ 遍全扫描降至单遍扫描；
   - 为 `padOrTruncate` 设定宽度上限 10,000，为 `generateNumericSequence` 设定填充上限 1,000，彻底根除 `RangeError`；
   - 为 `resolveMatchArg` 和 `resolveRegexArg` 接入 `isDangerousRegex` 安全拦截与超长字符串截断保护；
   - 将 `PLACEHOLDER_PATTERN` 参数段优化为非贪婪匹配消除回溯。
5. **自动化门禁与双向严格负向验证**：
   - 新增 `tests/r372-comprehensive-quality-optimization.test.cjs` 专项测试套件；
   - 双向注入负向突变 124（破坏代理对截断保护）、负向突变 125（破坏 ReDoS 危险正则拦截）、负向突变 126（破坏大宽度防崩溃上限），三项负向测试均被精确拦截；
   - 源码恢复后复验全绿通过，单元测试总数达到 997/997 项。

## 结果与证据
- 单元测试增至 **997/997 项全绿**，耗时 ~7.0s；
- 负向违规注入测试精确拦截率 100%（累计完成 126 轮严格负向验证）；
- TypeScript 类型检查 0 错误（`pnpm run check`）；
- 异常处理安全检查通过（`pnpm run check:errors`）；
- 变更日志检查通过（`pnpm run check:changelog`）；
- 包资源检查校验通过（`pnpm run check:package`，版本 0.10.64）；
- Webpack 生产构建产出 `./package.zip`。
