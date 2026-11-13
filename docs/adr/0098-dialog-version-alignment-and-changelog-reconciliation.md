# ADR 0098：全仓二级弹窗版本号收敛与变更日志全量校准 (Dialog Version Alignment & Changelog Reconciliation)

## 状态
已接受，T-0189~T-0191（2026-10-27，全面审查后立项）。

## 背景与上下文
在全仓代码与公开资产审查中，暴露出两项关键的规范一致性与技术债务缺陷：
1. **二级子弹窗标题栏徽标版本号严重写死**：在 `csv-tsv-wizard`、`discovery-dialog`、`settings-dialog`、`export-sanitizer-modal`、`sync-diff-modal` 等多处代码中，`mountPlatformDialogTitleWrap` 传入了字面量 `"v0.7.7"`、`"v0.7.6"`，而宿主已演进至 `v0.9.3`。用户在打开这些二级弹窗时看到旧版徽标，产生版本未生效或降级的混乱。
2. **公开变更日志断更与文档矛盾**：`CHANGELOG.md` 顶层版本自 2026-10-19 以来一直停留在 `v0.5.0`，从 `v0.6.0` 到 `v0.9.3` 跨越 10 余个小版本均未面向用户回填记录；`README.md` 与 `README.en-US.md` 顶部依然残留“尚未包含在 v0.4.2”等历史临时说明。

## 决策与落地
1. **全局常量导出与默认参数绑定**：
   - 在 `src/constants.ts` 导出 `PLUGIN_VERSION = "0.9.3"` 与 `PLUGIN_DISPLAY_VERSION = "v" + PLUGIN_VERSION`；
   - `src/ui/dialog-dom.ts` 的 `mountPlatformDialogTitleWrap` 默认参数绑定为 `badgeText = PLUGIN_DISPLAY_VERSION`；
   - 彻底清理各子业务弹窗（CSV向导、首设、体检、导出、比对、发现）中的硬编码版本字符串，统一依赖默认值或全局常量。
2. **硬门禁自动化巡检与双向负向验证**：
   - 新增 `tests/r301-dialog-version-alignment.test.cjs` 静态扫描门禁：
     - 校验 `src/constants.ts` 中的版本号与 `package.json`、`plugin.json` 强一致；
     - 递归扫描 `src/ui/` 下所有 `.ts` 源码，严禁存在 `"v0.7.7"`、`"v0.7.6"` 等历史硬编码版本字符串；
     - 实施两项负向注入验证：篡改版本号与注入陈旧版本字符串均能让测试精确拦截失败，原代码恢复后复验全绿。
3. **面向用户变更日志全量回填**：
   - 按 Keep a Changelog 格式将 `v0.6.0` 至 `v0.9.3` 的演进全面回填入 `CHANGELOG.md` 顶部；
   - 移除 README 中的历史遗留陈旧声明，将 B-006 正文写入安全限制规范化归入设计基线说明。

## 结果与证据
- 全套测试通过（748/748 项单测全部通过）；
- 负向违规注入确认两项失败断言生效，源码恢复后 SHA256 吻合且正向全过；
- TypeScript 类型检查 0 错误，生产构建正常输出 `./package.zip`。
