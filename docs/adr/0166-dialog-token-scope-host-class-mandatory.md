# ADR 0166：插件弹窗容器必须挂令牌作用域 host 类

日期：2026-11-08 · 状态：已采纳 · 关联：R422（用户三截图实证）、ADR 0165

## 背景

`tokens-r187.scss` 的设计令牌（`--xlc-space-*`、`--xlc-accent`、`--xlc-shadow-*` 等）只定义在
限定根选择器上：

```scss
$roots: ".xlc-dialog, .xlc-form, .xlc-varform, .xlc-dock,
        .b3-dialog__container.xlc-dialog-host, .b3-dialog__container.xlc-form-host,
        .b3-dialog__container.xlc-varform-host, .b3-dialog__container.xlc-sheet";
```

`new Dialog()` 弹出的容器默认**没有任何小驴类名**，令牌全部取不到：
`padding: var(--xlc-space-3)` 在 computed-value 阶段整体失效 → padding 塌陷为 0。
用户截图实证：套件市场弹窗「关闭」按钮贴出容器右缘、提示文字贴左缘、卡片无呼吸空间。

受影响且已修复的弹窗：`starter-packs-dialog.ts`、`pinboard.ts`、`share-card.ts`
（均补挂 `xlc-dialog-host`）。主面板、设置、捕获等弹窗此前已正确挂载。

## 决策

1. **任何 `new Dialog(...)` 之后必须立即**：
   `dialog.element.querySelector(".b3-dialog__container")?.classList.add("xlc-dialog-host")`
   （表单类用 `xlc-form-host`，全屏 sheet 用 `xlc-sheet`，与既有弹窗保持一致）。
2. 该规则作为契约写入 `tests/r422-ui-defect-fixes.test.cjs`（R422-1），负向验证闭环。
3. 新弹窗 CR 检查项：容器有没有 host 类。

## 调试陷阱备忘（本次实证）

- 令牌链 `--xlc-accent: var(--b3-theme-primary)` 依赖宿主 `:root` 的 b3 变量；离线
  harness 复现时必须把 b3 变量定义在 `:root` 而非 `.b3-scope`，否则按钮背景因链断
  而透明，会误判为样式 bug。
- 覆盖 `$roots` 内规则（specificity 含 `:is(...)` 最高参 (0,2,0) + 后代 (0,1,0) 起）
  时，普通单类选择器压不住；必须显式抬强度并置于其后（R422-3 的设置面板
  padding-top:0 覆盖即此情形）。
