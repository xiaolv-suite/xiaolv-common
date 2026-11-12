# ADR 0156：UI 待办清单收口、光学对齐与呼吸感高亮 (UI Backlog Refinements & Optical Alignments)

## 状态
已接受，T-0591~T-0595（2026-10-30）。

## 背景与上下文
在前一轮全面可用性审计与全链路闭环验证中，记录了 4 项纯视觉与微交互的 UI 待办清单（UI-01 ~ UI-04）。本轮专门对这 4 项待办进行针对性收口与落地：
1. **UI-01 搜索历史栏折行挤占**：历史搜索记录较多时在桌面端发生折行，挤占列表视口高度；
2. **UI-02 侧栏分类树展开指示符光学错位**：`▾` / `▸` 为字符符号，在部分 Windows 系统字体下垂直偏上 1px，未与文本中线居中；
3. **UI-03 变量卡多选胶囊选中态生硬**：采用实色深色填充，视觉呼吸感与精致度不足；
4. **UI-04 发现面板状态行间距未严格收敛**：状态行与右侧操作按钮间距未收敛至标准 8px 栅格。

## 决策与落地
1. **搜索历史单行横流与无缝滚动 (`src/styles/index.scss`)**：
   - 为 `.xlc-search-history-bar` 声明 `flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none;`；
   - 历史标签胶囊声明 `flex-shrink: 0; white-space: nowrap;`，消除垂直折行对视口的挤占。
2. **侧栏分类树展开指示符光学居中对齐**：
   - 为 `.xlc-dock-group-arrow` 声明 `display: inline-flex; align-items: center; justify-content: center; vertical-align: middle;`；
   - 消除字符在各平台字体下的基线错位，与分类标题文字完美中线对齐。
3. **变量填充多选胶囊通透呼吸感高亮**：
   - 选中态由原色实底升级为半透明淡薰衣草底 `background-color: var(--xlc-lavender)`，搭配主色文字 `var(--xlc-accent-text)` 与发丝外描边，兼顾清晰识别与通透呼吸感。
4. **发现面板状态行间距栅格化**：
   - 状态行 `.xlc-discovery-status-row` 显式收敛为 `gap: var(--xlc-space-2)`（8px），严格对齐 4/8 栅格系统。
5. **自动化测试与负向门禁验证**：
   - 新增专项测试 `tests/r386-ui-backlog-refinements.test.cjs`；
   - 注入负向突变 146（破坏搜索历史栏 nowrap 单行流动），门禁精准拦截红灯，恢复后复验全绿；
   - 单元测试增至 **1042/1042 项全绿**。

## 结果与证据
- 单元测试增至 **1042/1042 项全绿**；
- 负向违规注入测试精确拦截率 100%（累计完成 146 轮严格负向验证）；
- 生产截图测试 25/25 张全部通过（`pnpm run test:ui`）；
- UI 交互审计 77/77 全链路 100% 通过（`pnpm run test:ix`）；
- TypeScript 类型检查 0 错误（`pnpm run check`）；
- Webpack 生产构建产出 `./package.zip`。
