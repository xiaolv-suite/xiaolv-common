// @ts-nocheck
/* AUTO-GENERATED FROM preview-app.js BY scripts/build-studio-mount.py - DO NOT EDIT BY HAND */
import * as LvKit from "./lv-ui";
import * as LvMascots from "./mascots";
import * as LvIcons from "./icons";

const K: any = { ...LvKit, ...LvMascots, ...LvIcons };

export interface Dl2Specimen {
    id: number;
    title: string;
    fn: string;
    render: (stage: HTMLElement, setLog: (msg: string) => void) => void;
}

export const DL2_SPECIMENS: Dl2Specimen[] = [
    {
        id: 1,
        title: "01. \u65b9\u5706\u6241\u5e73\u6309\u94ae Button\uff08\u4e94\u8272 \u00b7 \u4e09\u5bf8 \u00b7 \u52a0\u8f7d\u73af \u00b7 \u5bf9\u9f50\u94c1\u5f8b\uff09",
        fn: "lvxButton(opts)",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const r1 = document.createElement("div");
      r1.style.cssText = "display:flex;gap:6px;flex-wrap:wrap;align-items:center;";
      [
        { label: "Default", variant: "default" },
        { label: "Primary", variant: "primary", icon: K.lvIcon("check", { size: 14 }) },
        { label: "Energy", variant: "energy", icon: K.lvIcon("fire", { size: 14 }) },
        { label: "Ghost", variant: "ghost" },
        { label: "Danger", variant: "danger" },
      ].forEach((c) => {
        r1.appendChild(K.lvxButton({ label: c.label, variant: c.variant, icon: c.icon, onClick: () => setLog(`点击 Button: ${c.label}`) }));
      });
      stage.appendChild(r1);

      const r2 = document.createElement("div");
      r2.style.cssText = "display:flex;gap:6px;flex-wrap:wrap;align-items:center;";
      r2.appendChild(K.lvxButton({ label: "小号 sm (24px)", sm: true, onClick: () => setLog("点击 sm 按钮") }));
      r2.appendChild(K.lvxButton({ label: "大号 lg (36px)", lg: true, variant: "primary", onClick: () => setLog("点击 lg 按钮") }));
      r2.appendChild(K.lvxButton({ label: "加载中 Loading", variant: "primary", loading: true }));
      r2.appendChild(K.lvxButton({ label: "禁用 Disabled", disabled: true }));
      stage.appendChild(r2);

      stage.appendChild(K.lvxButton({ label: "📋 左对齐行变体 (.lvx-btn--row) —— 设置/菜单行专用", row: true, onClick: () => setLog("点击 --row 左对齐按钮") }));
        }
    },
    {
        id: 2,
        title: "02. \u65b9\u5706\u77e2\u91cf\u56fe\u6807\u6309\u94ae IconButton\uff08\u4e94\u53d8\u4f53 \u00b7 \u4e09\u5c3a\u5bf8 \u00b7 \u6309\u4e0b\u6001\uff09",
        fn: "lvxIconButton(opts)",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const r1 = document.createElement("div");
      r1.style.cssText = "display:flex;gap:8px;align-items:center;flex-wrap:wrap;";
      [
        { icon: "home", label: "默认幽灵", variant: "default" },
        { icon: "search", label: "描边白底", variant: "surface" },
        { icon: "insight", label: "主品牌紫", variant: "primary" },
        { icon: "fire", label: "暖橘能量", variant: "energy" },
        { icon: "trash", label: "危险删除", variant: "danger" },
      ].forEach((it) => {
        r1.appendChild(
          K.lvxTooltip({
            tip: it.label,
            trigger: K.lvxIconButton({
              icon: K.lvIcon(it.icon, { size: 17 }),
              label: it.label,
              variant: it.variant,
              onClick: () => setLog(`IconButton 点击: ${it.label} (${it.variant})`),
            }),
          })
        );
      });
      stage.appendChild(r1);

      const r2 = document.createElement("div");
      r2.style.cssText = "display:flex;gap:10px;align-items:center;flex-wrap:wrap;";
      r2.appendChild(K.lvxIconButton({ icon: K.lvIcon("settings", { size: 14 }), label: "小号 sm", sm: true, variant: "surface", onClick: () => setLog("点击 sm IconButton") }));
      r2.appendChild(K.lvxIconButton({ icon: K.lvIcon("settings", { size: 18 }), label: "标准 md", variant: "surface", onClick: () => setLog("点击 md IconButton") }));
      r2.appendChild(K.lvxIconButton({ icon: K.lvIcon("settings", { size: 20 }), label: "大号 lg", lg: true, variant: "primary", onClick: () => setLog("点击 lg IconButton") }));
      r2.appendChild(K.lvxIconButton({ icon: K.lvIcon("close", { size: 16 }), label: "禁用", disabled: true, variant: "surface" }));
      stage.appendChild(r2);
        }
    },
    {
        id: 3,
        title: "03. \u8bed\u4e49\u80f6\u56ca\u6807\u7b7e Chip\uff08\u516d\u8272\u9636 \u00b7 \u53ef\u5173\u95ed \u00b7 \u53ef\u4ea4\u4e92\uff09",
        fn: "lvxChip({ text, tone, icon, closable, onClose })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const r1 = document.createElement("div");
      r1.style.cssText = "display:flex;gap:6px;flex-wrap:wrap;align-items:center;";
      [
        ["Brand 柔雾紫", "brand", "✦"],
        ["Energy 暖橘", "energy", "🔥"],
        ["Success 翠绿", "success", "✓"],
        ["Warn 琥珀", "warn", "⏳"],
        ["Danger 绯红", "danger", "⚠"],
        ["Neutral 中性", "neutral", "•"],
      ].forEach(([text, tone, icon]) => {
        r1.appendChild(
          K.lvxChip({
            text,
            tone,
            icon,
            interactive: true,
            onClick: () => setLog(`点击可交互 Chip: ${text}`),
          })
        );
      });
      stage.appendChild(r1);

      const r2 = document.createElement("div");
      r2.style.cssText = "display:flex;gap:6px;flex-wrap:wrap;align-items:center;";
      ["标签: 深度学习", "标签: FSRS-5", "标签: 每日必做"].forEach((lb) => {
        const ch = K.lvxChip({
          text: lb,
          tone: "brand",
          closable: true,
          onClose: () => {
            ch.remove();
            setLog(`已移除可关闭 Chip: ${lb}`);
          },
        });
        r2.appendChild(ch);
      });
      r2.appendChild(K.lvxChip({ text: "紧凑小号 (sm)", size: "sm", tone: "neutral" }));
      r2.appendChild(K.lvxChip({ text: "宽裕大号 (lg)", size: "lg", tone: "energy" }));
      stage.appendChild(r2);
        }
    },
    {
        id: 4,
        title: "04. \u7d27\u51d1\u5143\u6807\u7b7e Tag\uff08\u516d\u8272\u9636 \u00b7 \u4e09\u5c3a\u5bf8 sm/md/lg \u53ea\u8bfb\u5143\u6570\u636e\u89d2\u6807\uff09",
        fn: "lvxTag(text | { text, tone, size: ",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const row = document.createElement("div");
      row.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;align-items:center;";
      row.appendChild(K.lvxTag("默认 Neutral · v18.46"));
      row.appendChild(K.lvxTag({ text: "Brand · 核心模块", tone: "brand" }));
      row.appendChild(K.lvxTag({ text: "Energy · 连胜加成", tone: "energy" }));
      row.appendChild(K.lvxTag({ text: "Success · 已归档", tone: "success" }));
      row.appendChild(K.lvxTag({ text: "Warn · 待复核", tone: "warn" }));
      row.appendChild(K.lvxTag({ text: "Danger · 高优 P0", tone: "danger" }));
      row.appendChild(K.lvxTag({ text: "超紧凑 sm", size: "sm" }));
      row.appendChild(K.lvxTag({ text: "醒目大号 lg", tone: "brand", size: "lg" }));
      stage.appendChild(row);
        }
    },
    {
        id: 5,
        title: "05. \u8ba1\u6570\u5fbd\u7ae0\u4e0e\u72b6\u6001\u5706\u70b9 Badge\uff08\u516d\u8272\u9636 \u00b7 Dot \u6a21\u5f0f\uff09",
        fn: "lvxBadge({ text, tone, dot })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const r1 = document.createElement("div");
      r1.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;align-items:center;";
      [
        ["12", "brand"],
        ["99+", "energy"],
        ["PASS", "success"],
        ["3", "warn"],
        ["!", "danger"],
        ["0", "neutral"],
      ].forEach(([text, tone]) => r1.appendChild(K.lvxBadge({ text, tone })));
      stage.appendChild(r1);

      const r2 = document.createElement("div");
      r2.style.cssText = "display:flex;gap:14px;flex-wrap:wrap;align-items:center;";
      [
        ["云端内核在线", "success"],
        ["后台同步队列中", "energy"],
        ["索引需要重建", "danger"],
      ].forEach(([label, tone]) => {
        const item = document.createElement("span");
        item.style.cssText = "display:inline-flex;align-items:center;gap:6px;font-size:12px;";
        item.appendChild(K.lvxBadge({ dot: true, tone }));
        item.appendChild(document.createTextNode(label));
        r2.appendChild(item);
      });
      stage.appendChild(r2);
        }
    },
    {
        id: 6,
        title: "06. \u5706\u5f62\u5934\u50cf\u4e0e\u5728\u7ebf\u72b6\u6001\u706f Avatar\uff08\u4e09\u5c3a\u5bf8 \u00b7 \u56db\u72b6\u6001\uff09",
        fn: "lvxAvatar({ text, src, size, tone, status })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const row = document.createElement("div");
      row.style.cssText = "display:flex;gap:16px;align-items:center;flex-wrap:wrap;";
      row.appendChild(K.lvxAvatar({ text: "小", size: "sm", status: "online" }));
      row.appendChild(K.lvxAvatar({ text: "驴", size: "md", tone: "brand", status: "online" }));
      row.appendChild(K.lvxAvatar({ text: "脉", size: "md", tone: "energy", status: "away" }));
      row.appendChild(K.lvxAvatar({ text: "考", size: "md", tone: "success", status: "busy" }));
      row.appendChild(K.lvxAvatar({ text: "离", size: "md", status: "offline" }));
      const svgDataUrl =
        "data:image/svg+xml;utf8," +
        encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#6A6EE0"/><circle cx="40" cy="32" r="14" fill="#F59E0B"/><path d="M16 72c4-16 44-16 48 0" fill="#F4F5FB"/></svg>`
        );
      row.appendChild(K.lvxAvatar({ src: svgDataUrl, text: "头像", size: "lg", status: "online" }));
      stage.appendChild(row);
        }
    },
    {
        id: 7,
        title: "07. \u56db\u6001\u5bb9\u5668\u5361\u7247 Card\uff08Surface / Interactive / Flat / Hero\uff09",
        fn: "lvxCard({ hero, flat, interactive, children })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const grid = document.createElement("div");
      grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;";
      [
        { title: "1. Surface 标准白卡", desc: "默认 16px 圆角 + Shadow 1 轻阴影", opts: {} },
        { title: "2. Interactive 悬浮抬升卡", desc: "鼠标悬浮描边高亮 + 向上微抬 1px", opts: { interactive: true, onClick: () => setLog("点击 Interactive Card") } },
        { title: "3. Flat 画布次级卡", desc: "无边框雾紫米白底，适合白底弹窗内部分区", opts: { flat: true } },
        { title: "4. Hero 近黑墨色锚点卡", desc: "24px 超大圆角 + 右上角径向柔光 (每屏至多1块)", opts: { hero: true } },
      ].forEach((item) => {
        const inner = document.createElement("div");
        inner.innerHTML = `<div style="font-weight:700;font-size:13px;margin-bottom:4px;">${item.title}</div><div style="font-size:12px;opacity:.78;">${item.desc}</div>`;
        grid.appendChild(K.lvxCard({ ...item.opts, children: [inner] }));
      });
      stage.appendChild(grid);
        }
    },
    {
        id: 8,
        title: "08. \u5927\u6570\u5b57\u4e3b\u89d2\u5757 HeroNum\uff0844px/750 \u7b49\u5bbd\u6570\u5b57 + \u7070\u9636\u4e0a\u6807\uff09",
        fn: "lvxHeroNum({ value, label, tone })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            let streak = 21;
      const row = document.createElement("div");
      row.style.cssText = "display:flex;gap:24px;flex-wrap:wrap;align-items:center;justify-content:space-between;";
      const hEnergy = K.lvxHeroNum({ value: streak, label: "连续打卡 · Streak", tone: "energy" });
      const hBrand = K.lvxHeroNum({ value: "96.4%", label: "闪卡保留率 · Retention", tone: "brand" });
      const hDefault = K.lvxHeroNum({ value: "1,420", label: "知识块总数 · Blocks" });
      row.appendChild(hEnergy);
      row.appendChild(hBrand);
      row.appendChild(hDefault);
      stage.appendChild(row);

      stage.appendChild(
        K.lvxButton({
          label: "🔥 模拟打卡连胜 +1 天 (测试 tabular-nums 等宽不抖动)",
          sm: true,
          variant: "energy",
          onClick: () => {
            streak++;
            hEnergy.querySelector(".lvx-herton").textContent = String(streak);
            setLog(`HeroNum 连胜天数跃升至: ${streak} 天`);
          },
        })
      );
        }
    },
    {
        id: 9,
        title: "09. \u80f6\u56ca\u62e8\u52a8\u5f00\u5173 Switch\uff08\u4e09\u5c3a\u5bf8 sm/md/lg \u00b7 \u5185\u8054\u6807\u7b7e \u00b7 \u7981\u7528\u6001\uff09",
        fn: "lvxSwitch({ checked, sm, lg, label, disabled, ariaLabel, onChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const col = K.lvxCard({
        children: [
          (() => {
            const box = document.createElement("div");
            box.style.cssText = "display:flex;flex-direction:column;gap:10px;";
            box.appendChild(K.lvxSwitch({ checked: true, lg: true, label: "大号尺寸 (lg: true · 46×26) · 全局心流专注总闸", ariaLabel: "大号开关", onChange: (v) => setLog(`大号 Switch: ${v}`) }));
            box.appendChild(K.lvxSwitch({ checked: true, label: "标准尺寸 (md · 38×22) · 开启每日错题到期提醒", ariaLabel: "错题提醒", onChange: (v) => setLog(`标准 Switch: ${v}`) }));
            box.appendChild(K.lvxSwitch({ checked: true, sm: true, label: "紧凑尺寸 (sm: true · 30×18) · 工具栏内联快速开关", ariaLabel: "紧凑开关", onChange: (v) => setLog(`小号 Switch: ${v}`) }));
            box.appendChild(K.lvxSwitch({ checked: false, disabled: true, label: "禁用态开关 (disabled: true)", ariaLabel: "禁用开关" }));
            return box;
          })(),
        ],
      });
      stage.appendChild(col);
        }
    },
    {
        id: 10,
        title: "10. \u590d\u9009\u6846 Checkbox\uff08\u5168\u9009\u534a\u9009 Indeterminate \u53cc\u5411\u8054\u52a8\uff09",
        fn: "lvxCheckbox({ checked, indeterminate, label, disabled, onChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const state = [true, false, true];
      const box = document.createElement("div");
      box.style.cssText = "display:flex;flex-direction:column;gap:8px;padding:12px 14px;border-radius:12px;background:var(--lvx-surface);border:1px solid var(--lvx-border);box-shadow:var(--lvx-inner-sheen),var(--lvx-shadow-1);";

      const renderChks = () => {
        box.innerHTML = "";
        const checkedCount = state.filter(Boolean).length;
        const allChecked = checkedCount === state.length;
        const isIndet = checkedCount > 0 && checkedCount < state.length;

        const master = K.lvxCheckbox({
          checked: allChecked,
          indeterminate: isIndet,
          label: `全选同步笔记本 (${checkedCount}/${state.length} 已选 · ${isIndet ? "半选态 indeterminate" : allChecked ? "全选态" : "未选态"})`,
          onChange: (v) => {
            state.fill(v);
            renderChks();
            setLog(`全选框切换为: ${v}`);
          },
        });
        master.style.fontWeight = "600";
        box.appendChild(master);

        const subRow = document.createElement("div");
        subRow.style.cssText = "display:flex;gap:14px;padding-left:20px;flex-wrap:wrap;";
        ["📚 读书笔记", "💻 算法题解", "🗂 英语闪卡"].forEach((lb, idx) => {
          subRow.appendChild(
            K.lvxCheckbox({
              checked: state[idx],
              label: lb,
              onChange: (v) => {
                state[idx] = v;
                renderChks();
                setLog(`子项 [${lb}] 切换为: ${v}`);
              },
            })
          );
        });
        box.appendChild(subRow);
      };
      renderChks();
      stage.appendChild(box);
        }
    },
    {
        id: 11,
        title: "11. \u5355\u9009\u6846\u7ec4 Radio\uff08\u4e92\u65a5\u5355\u9009 \u00b7 \u7f29\u653e\u5706\u82af\u52a8\u6548 \u00b7 \u7981\u7528\u6001\uff09",
        fn: "lvxRadio({ checked, name, label, disabled, onChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const col = document.createElement("div");
      col.style.cssText = "display:flex;flex-direction:column;gap:8px;padding:12px 14px;border-radius:12px;background:var(--lvx-surface);border:1px solid var(--lvx-border);box-shadow:var(--lvx-inner-sheen),var(--lvx-shadow-1);";
      [
        { label: "FSRS-5 动态记忆排程（推荐 · 按稳定性自适应间隔）", checked: true },
        { label: "艾宾浩斯经典固定阶梯（1 / 2 / 4 / 7 / 15 天）", checked: false },
        { label: "自由顺序漫步（不计入到期排程队列）", checked: false },
        { label: "SM-2 旧版兼容算法（已锁定退役）", checked: false, disabled: true },
      ].forEach((it) => {
        col.appendChild(
          K.lvxRadio({
            checked: it.checked,
            disabled: it.disabled,
            name: "wb-radio-standalone",
            label: it.label,
            onChange: () => setLog(`Radio 选中: ${it.label}`),
          })
        );
      });
      stage.appendChild(col);
        }
    },
    {
        id: 12,
        title: "12. \u80f6\u56ca\u5206\u6bb5\u63a7\u5236\u5668 Segmented\uff08\u4e09\u5c3a\u5bf8 sm/md/lg \u00b7 \u53cc\u98ce\u683c brand/surface\uff09",
        fn: "lvxSegmented({ options, value, size: ",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const info = document.createElement("div");
      info.style.cssText = "font-size:12px;color:var(--lvx-text-muted);display:flex;align-items:center;justify-content:space-between;";
      info.innerHTML = `<span>当前主视图：<strong style="color:var(--lvx-brand)">📅 周视图 (Weekly Heatmap)</strong></span><span>轨道：雾紫凹槽 #E8EAF6</span>`;

      stage.appendChild(
        K.lvxSegmented({
          ariaLabel: "周期切换 (标准 md · Brand 风格)",
          size: "md",
          variant: "brand",
          options: [
            { value: "day", label: "☀ 日视图" },
            { value: "week", label: "📅 周视图" },
            { value: "month", label: "🗓 月视图" },
            { value: "quarter", label: "📈 季度趋势" },
          ],
          value: "week",
          onChange: (v) => {
            info.innerHTML = `<span>当前主视图：<strong style="color:var(--lvx-brand)">已切换至 [${v}] 档位</strong></span><span>轨道：雾紫凹槽 #E8EAF6</span>`;
            setLog(`Segmented (md/brand) 切换: ${v}`);
          },
        })
      );

      const subRow = document.createElement("div");
      subRow.style.cssText = "display:flex;align-items:center;gap:10px;flex-wrap:wrap;";
      subRow.appendChild(
        K.lvxSegmented({
          ariaLabel: "白瓷浮起风格 (Surface · sm 小尺寸)",
          size: "sm",
          variant: "surface",
          options: [
            { value: "card", label: "🗂 卡片 (sm)" },
            { value: "list", label: "☰ 列表 (sm)" },
            { value: "kanban", label: "📊 看板 (sm)" },
          ],
          value: "card",
          onChange: (v) => setLog(`Segmented (sm/surface) 切换: ${v}`),
        })
      );
      subRow.appendChild(
        K.lvxSegmented({
          ariaLabel: "大号分段 (lg)",
          size: "lg",
          variant: "surface",
          options: [
            { value: "focus", label: "⚡ 专注模式 (lg)" },
            { value: "review", label: "🧠 研习模式 (lg)" },
          ],
          value: "focus",
          onChange: (v) => setLog(`Segmented (lg/surface) 切换: ${v}`),
        })
      );
      stage.appendChild(subRow);
      stage.appendChild(info);
        }
    },
    {
        id: 13,
        title: "13. \u5355\u884c\u6587\u672c\u8f93\u5165\u6846 Input\uff08\u4e09\u5c3a\u5bf8 sm/md/lg \u00b7 \u6821\u9a8c\u7ea2\u6846 \u00b7 \u53ea\u8bfb \u00b7 \u7981\u7528\uff09",
        fn: "lvxInput({ value, placeholder, size: ",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const grid = document.createElement("div");
      grid.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:center;";
      grid.appendChild(K.lvxInput({ size: "sm", placeholder: "紧凑小号 (size: 'sm' · 28px)...", onInput: (v) => setLog(`Input(sm) 输入: ${v}`) }));
      grid.appendChild(K.lvxInput({ placeholder: "标准中号 (size: 'md' · 36px)...", onInput: (v) => setLog(`Input(md) 输入: ${v}`) }));
      grid.appendChild(K.lvxInput({ size: "lg", placeholder: "宽裕大号 (size: 'lg' · 44px)...", onInput: (v) => setLog(`Input(lg) 输入: ${v}`) }));
      grid.appendChild(K.lvxInput({ prefix: K.lvIcon("search", { size: 16 }), value: "分布式共识算法", clearable: true, kbd: "⌘K", maxLength: 32, ariaLabel: "带前缀清空与字数的搜索框", onInput: (v) => setLog(`Adorned Input: ${v}`) }));
      grid.appendChild(K.lvxInput({ prefix: K.lvIcon("shield", { size: 16 }), type: "password", value: "sk-xiaolv-dl2-secret-key", passwordToggle: true, ariaLabel: "API Key 密码明暗文切换框" }));
      grid.appendChild(K.lvxInput({ value: "invalid-cron-expression", invalid: true, ariaLabel: "错误态输入" }));
      grid.appendChild(K.lvxInput({ value: "只读块 ID: 20261118093012-abcdef", readOnly: true, ariaLabel: "只读输入" }));
      grid.appendChild(K.lvxInput({ value: "已禁用输入框 (disabled)", disabled: true, ariaLabel: "禁用输入" }));
      stage.appendChild(grid);
        }
    },
    {
        id: 14,
        title: "14. \u591a\u884c\u6587\u672c\u57df Textarea\uff08\u81ea\u9002\u5e94\u884c\u9ad8 \u00b7 \u5b9e\u65f6\u5b57\u6570\u76d1\u63a7\uff09",
        fn: "lvxTextarea({ value, placeholder, rows, disabled, onInput })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const countLabel = document.createElement("div");
      countLabel.style.cssText = "font-size:11px;color:var(--lvx-text-muted);text-align:right;";
      const initText = "今日完成了《小驴 Design Language 2.0》全量 49 个组件的精雕打磨与真机走查。";
      countLabel.textContent = `当前字数: ${initText.length} 字`;
      stage.appendChild(
        K.lvxTextarea({
          value: initText,
          rows: 2,
          onInput: (v) => {
            countLabel.textContent = `当前字数: ${v.length} 字`;
            setLog(`Textarea 更新: ${v.length} 字`);
          },
        })
      );
      stage.appendChild(countLabel);
        }
    },
    {
        id: 15,
        title: "15. \u539f\u751f\u65e0\u969c\u788d\u4e0b\u62c9\u9009\u62e9\u6846 Select\uff08\u4e09\u5c3a\u5bf8 sm/md/lg \u00b7 \u5185\u5d4c\u77e2\u91cf\u7bad\u5934 \u00b7 \u7981\u7528\u6001\uff09",
        fn: "lvxSelect({ options, value, size: ",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const row = document.createElement("div");
      row.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:center;";
      row.appendChild(
        K.lvxSelect({
          size: "sm",
          ariaLabel: "小号下拉框 (sm)",
          options: [
            { value: "all", label: "⚡ 紧凑筛选 (size: 'sm' · 28px)" },
            { value: "due", label: "📅 仅看今日到期" },
          ],
          value: "all",
          onChange: (v) => setLog(`Select(sm) 切换: ${v}`),
        })
      );
      row.appendChild(
        K.lvxSelect({
          ariaLabel: "标准下拉框 (md)",
          options: [
            { value: "deepseek", label: "🚀 DeepSeek-V3 (标准 md · 36px)" },
            { value: "claude", label: "🧠 Claude 3.7 Sonnet (深度推理)" },
            { value: "local", label: "💻 Ollama 本地离线模型" },
          ],
          value: "deepseek",
          onChange: (v) => setLog(`Select(md) 切换模型: ${v}`),
        })
      );
      row.appendChild(
        K.lvxSelect({
          size: "lg",
          ariaLabel: "大号下拉框 (lg)",
          options: [
            { value: "exam", label: "🎓 全真模考题库 (大号 lg · 44px)" },
            { value: "drill", label: "🔥 错题靶向突击" },
          ],
          value: "exam",
          onChange: (v) => setLog(`Select(lg) 切换: ${v}`),
        })
      );
      row.appendChild(
        K.lvxSelect({
          ariaLabel: "禁用下拉框",
          disabled: true,
          options: [{ value: "locked", label: "🔒 已锁定目标笔记本 (Disabled)" }],
          value: "locked",
        })
      );
      stage.appendChild(row);
        }
    },
    {
        id: 16,
        title: "16. \u8868\u5355\u9879\u5e03\u5c40\u4e0e\u6821\u9a8c\u5bb9\u5668 Field\uff08Label + Hint + Error \u8054\u52a8\uff09",
        fn: "lvxField({ label, hint, control, error })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const inp = K.lvxInput({ value: "0", ariaLabel: "打卡配额" });
      const field = K.lvxField({
        label: "每日最低精读时长",
        hint: "单位：分钟 (输入 >0 自动解除报错)",
        control: inp,
        error: "⚠️ 每日目标时长必须大于 0 分钟",
      });
      inp.addEventListener("input", () => {
        const n = Number(inp.value);
        if (n > 0) {
          field.classList.remove("is-error");
          setLog(`Field 校验通过: ${n} 分钟`);
        } else {
          field.classList.add("is-error");
          setLog("Field 触发 is-error 校验拦截");
        }
      });
      stage.appendChild(field);
        }
    },
    {
        id: 17,
        title: "17. \u5409\u7965\u7269\u7a7a\u72b6\u6001\u5bb9\u5668 Empty\uff08\u4e94\u59ff\u6001\u5207\u6362 \u00b7 \u7ebf\u6027\u56fe\u6807\u56de\u9000\uff09",
        fn: "lvxEmpty({ mascot, icon, title, desc, action })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const modes = [
        { pose: "sleep", title: "洞察队列静谧无波 (sleep)", desc: "打卡仓/管家仓默认空态" },
        { pose: "study", title: "错题本已全部消灭 (study)", desc: "考试仓/闪卡仓默认空态" },
        { pose: "carry", title: "拾遗收件箱空空如也 (carry)", desc: "拾遗仓/雷切仓默认空态" },
        { pose: "wave", title: "欢迎建立第一位人脉 (wave)", desc: "人脉仓首建引导空态" },
        { pose: null, title: "已关闭吉祥物偏好 (线性图标回退)", desc: "当用户关闭吉祥物开关时自动回退为此清洁模式" },
      ];
      let idx = 0;
      const holder = document.createElement("div");
      const renderBox = () => {
        holder.innerHTML = "";
        const m = modes[idx];
        const emp = K.lvxEmpty({
          mascot: m.pose ? K.lvMascot(m.pose, { class: "lvx-mascot--anim" }) : undefined,
          icon: m.pose ? undefined : "📭",
          title: m.title,
          desc: m.desc,
          action: K.lvxButton({
            label: "切换下一空态模式 ↻",
            variant: "primary",
            sm: true,
            onClick: () => {
              idx = (idx + 1) % modes.length;
              renderBox();
              setLog(`Empty 切换至: ${modes[idx].title}`);
            },
          }),
        });
        emp.style.padding = "14px";
        emp.style.background = "var(--lvx-surface)";
        emp.style.borderRadius = "16px";
        emp.style.border = "1px solid var(--lvx-border)";
        holder.appendChild(emp);
      };
      renderBox();
      stage.appendChild(holder);
        }
    },
    {
        id: 18,
        title: "18A. \u591a\u8bed\u4e49\u8fdb\u5ea6\u6761 Progress\uff08\u4e94\u8272\u9636 \u00b7 \u4e09\u5c3a\u5bf8 \u00b7 \u767d\u540d\u5355\u52a8\u6548\uff09",
        fn: "lvxProgress({ value, tone, size, ariaLabel })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const stack = document.createElement("div");
      stack.style.cssText = "display:flex;flex-direction:column;gap:10px;";
      const bars = [
        { label: "Brand 柔雾紫 (sm 5px) · 64%", val: 0.64, tone: "brand", size: "sm" },
        { label: "Energy 暖橘 (md 8px) · 82%", val: 0.82, tone: "energy", size: "md" },
        { label: "Success 翠绿 (lg 12px) · 100%", val: 1.0, tone: "success", size: "lg" },
        { label: "Warn 琥珀预警 · 45%", val: 0.45, tone: "warn", size: "md" },
        { label: "Danger 红色高负载 · 92%", val: 0.92, tone: "danger", size: "md" },
      ];
      bars.forEach((b) => {
        const row = document.createElement("div");
        row.style.cssText = "display:flex;flex-direction:column;gap:4px;font-size:11px;color:var(--lvx-text-muted);";
        row.textContent = b.label;
        row.appendChild(K.lvxProgress({ value: b.val, tone: b.tone, size: b.size, ariaLabel: b.label }));
        stack.appendChild(row);
      });
      stage.appendChild(stack);
        }
    },
    {
        id: 19,
        title: "19. \u56db\u6001\u4fe1\u606f\u6761 Alert / Callout\uff08\u53ef\u5173\u95ed \u00b7 \u5185\u5d4c\u64cd\u4f5c\u884c\uff09",
        fn: "lvxAlert({ title, desc, tone, closable, actions })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const stack = document.createElement("div");
      stack.style.cssText = "display:flex;flex-direction:column;gap:8px;";
      stack.appendChild(K.lvxAlert({ tone: "brand", title: "AI 路由器 5 级瀑布流已就绪", desc: "主通道 DeepSeek-V3 响应正常 (280ms)", closable: true, onClose: () => setLog("关闭 Brand Alert") }));
      stack.appendChild(K.lvxAlert({ tone: "success", title: "双端云同步校验一致", desc: "本地与云端 1,420 条打卡事件哈希 100% 匹配" }));
      stack.appendChild(
        K.lvxAlert({
          tone: "warn",
          title: "检测到 2 张闪卡源块已移动",
          desc: "可执行一键重绑恢复双向跳转链接",
          closable: true,
          actions: [
            K.lvxButton({ label: "一键重绑块引用", variant: "primary", sm: true, onClick: () => setLog("Alert 内嵌动作: 一键重绑") }),
          ],
        })
      );
      stack.appendChild(K.lvxAlert({ tone: "danger", title: "API 密钥额度已耗尽", desc: "已自动无缝切换至本地备选免费通道" }));
      stage.appendChild(stack);
        }
    },
    {
        id: 20,
        title: "20. \u5206\u5272\u7ebf Divider\uff08\u6c34\u5e73\u5b9e\u7ebf \u00b7 \u5d4c\u5b57\u5206\u5272\u7ebf \u00b7 \u5782\u76f4\u884c\u5185\u5206\u5272\u7ebf\uff09",
        fn: "lvxDivider({ text, vertical })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const card = K.lvxCard({
        children: [
          K.lvxDivider(),
          K.lvxDivider({ text: "✦ 居中嵌字分割线 (lvx-divider--text) ✦" }),
          (() => {
            const inlineRow = document.createElement("div");
            inlineRow.style.cssText = "display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:500;padding:4px 0;";
            inlineRow.appendChild(document.createTextNode("小驴打卡"));
            inlineRow.appendChild(K.lvxDivider({ vertical: true }));
            inlineRow.appendChild(document.createTextNode("小驴闪卡"));
            inlineRow.appendChild(K.lvxDivider({ vertical: true }));
            inlineRow.appendChild(document.createTextNode("小驴拾遗"));
            return inlineRow;
          })(),
        ],
      });
      stage.appendChild(card);
        }
    },
    {
        id: 21,
        title: "21. \u56db\u5411\u7eaf CSS \u63d0\u793a\u6c14\u6ce1 Tooltip\uff08Top / Bottom / Left / Right\uff09",
        fn: "lvxTooltip({ tip, placement, trigger })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const row = document.createElement("div");
      row.style.cssText = "display:flex;gap:12px;justify-content:center;align-items:center;padding:22px 10px;flex-wrap:wrap;";
      [
        ["top", "⬆ 上方 Top (默认)", "默认在触发器正上方弹出"],
        ["bottom", "⬇ 下方 Bottom", "在触发器正下方弹出"],
        ["left", "⬅ 左侧 Left", "在触发器左侧弹出"],
        ["right", "➡ 右侧 Right", "在触发器右侧弹出"],
      ].forEach(([placement, label, tip]) => {
        row.appendChild(
          K.lvxTooltip({
            tip,
            placement,
            trigger: K.lvxButton({ label, sm: true }),
          })
        );
      });
      stage.appendChild(row);
        }
    },
    {
        id: 22,
        title: "22. \u80f6\u56ca\u9875\u7b7e\u5bfc\u822a Tabs\uff08\u56fe\u6807 + \u8ba1\u6570\u89d2\u6807 + \u952e\u76d8 \u2190/\u2192 \u5bfc\u822a\uff09",
        fn: "lvxTabs({ options: [{ id, label, icon, badge }], value, onChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const panel = document.createElement("div");
      panel.style.cssText = "padding:12px 14px;border-radius:12px;background:var(--lvx-surface);border:1px solid var(--lvx-border);font-size:13px;";
      const dict = {
        due: "🗂 【待复习队列】共 18 张到期闪卡，按 FSRS 记忆提取概率升序排列。",
        new: "✨ 【新制卡片】今日从《拾遗》摘录新生成 6 张属性问答卡。",
         leech: "⚠️ 【顽固难点卡】共 2 张遗忘次数 ≥4 次的难点卡，建议调用苏格拉底 AI 拆解。",
      };
      panel.textContent = dict.due;

      const tabs = K.lvxTabs({
        ariaLabel: "闪卡队列分类页签",
        options: [
          { id: "due", label: "待复习", icon: "🗂", badge: 18 },
          { id: "new", label: "新卡片", icon: "✨", badge: 6 },
          { id: "leech", label: "难点卡", icon: "⚠️", badge: 2 },
        ],
        value: "due",
        onChange: (id) => {
          panel.textContent = dict[id];
          setLog(`Tabs 切换至: ${id}`);
        },
      });
      stage.appendChild(tabs);
      stage.appendChild(panel);
        }
    },
    {
        id: 23,
        title: "23. \u80f6\u56ca\u5206\u9875\u5bfc\u822a Pagination\uff08\u52a8\u6001\u9ad8\u4eae \u00b7 \u7701\u7565\u53f7 \u00b7 \u8fb9\u754c\u7981\u7528\uff09",
        fn: "lvxPagination({ pages, onChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const info = document.createElement("div");
      info.style.cssText = "font-size:12px;color:var(--lvx-text-muted);";
      info.textContent = "当前正在浏览：第 1 页（每页 20 条记录，共 240 条）";
      stage.appendChild(
        K.lvxPagination({
          pages: [
            { label: "‹", page: 1, disabled: true },
            { label: "1", page: 1, current: true },
            { label: "2", page: 2 },
            { label: "3", page: 3 },
            { label: "4", page: 4 },
            { label: "…", ellipsis: true },
            { label: "12", page: 12 },
            { label: "›", page: 2 },
          ],
          onChange: (p) => {
            info.textContent = `当前正在浏览：第 ${p} 页（每页 20 条记录，共 240 条）`;
            setLog(`Pagination 跳转至第 ${p} 页`);
          },
        })
      );
      stage.appendChild(info);
        }
    },
    {
        id: 24,
        title: "24. \u5c42\u7ea7\u9762\u5305\u5c51\u5bfc\u822a Breadcrumb\uff08\u80f6\u56ca\u5bfc\u822a\u58f3 \u00b7 \u5c3e\u9879\u9ad8\u4eae \u00b7 \u5185\u5d4c\u8f7b\u91cf\u6a21\u5f0f\uff09",
        fn: "lvxBreadcrumb({ items, variant: ",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxBreadcrumb({
          items: [
            { label: "🏠 小驴全生态工作区", onClick: () => setLog("面包屑跳转: 根工作区") },
            { label: "📚 深度学习笔记本", onClick: () => setLog("面包屑跳转: 深度学习笔记本") },
            { label: "🧠 间隔重复与记忆巩固原理", current: true },
          ],
        })
      );
      const subBar = document.createElement("div");
      subBar.style.cssText = "padding:8px 12px;border-radius:12px;background:var(--lvx-surface-sunken);border:1px solid var(--lvx-border);display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;";
      subBar.appendChild(
        K.lvxBreadcrumb({
          variant: "plain",
          items: [
            { label: "🗂 计算机科学", onClick: () => setLog("面包屑跳转: 计算机科学") },
            { label: "⚡ 分布式系统", onClick: () => setLog("面包屑跳转: 分布式系统") },
            { label: "Raft 共识选举机制", current: true },
          ],
        })
      );
      subBar.appendChild(K.lvxTag({ text: "plain 轻量模式", tone: "brand" }));
      stage.appendChild(subBar);
        }
    },
    {
        id: 25,
        title: "25. \u56db\u6001\u7ed3\u679c\u53cd\u9988\u9875 Result\uff08Success / Info / Warning / Error\uff09",
        fn: "lvxResult({ tone, icon, title, desc, actions })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const tones = [
        { tone: "success", icon: "🎉", title: "今日 42 张到期闪卡全部清空！", desc: "平均回忆耗时 3.2 秒，记忆留存率提升至 96.4%" },
        { tone: "info", icon: "🧭", title: "全生态快照备份已完成", desc: "8 大插件配置与数据已安全写入本地灾备仓" },
        { tone: "warning", icon: "⚠️", title: "昨日存在 1 项漏签习惯", desc: "可使用本月自律免死金牌无损修补连胜记录" },
        { tone: "error", icon: "✕", title: "远端同步接口响应超时", desc: "本地改动已安全暂存，稍后将自动重试" },
      ];
      let idx = 0;
      const box = document.createElement("div");
      const renderRes = () => {
        box.innerHTML = "";
        const t = tones[idx];
        const res = K.lvxResult({
          tone: t.tone,
          icon: t.icon,
          title: t.title,
          desc: t.desc,
          actions: [
            K.lvxButton({
              label: `切换下一状态 (${t.tone}) ↻`,
              variant: "primary",
              sm: true,
              onClick: () => {
                idx = (idx + 1) % tones.length;
                renderRes();
                setLog(`Result 切换至 tone=${tones[idx].tone}`);
              },
            }),
          ],
        });
        res.style.padding = "18px 14px";
        res.style.background = "var(--lvx-surface)";
        res.style.borderRadius = "16px";
        res.style.border = "1px solid var(--lvx-border)";
        box.appendChild(res);
      };
      renderRes();
      stage.appendChild(box);
        }
    },
    {
        id: 26,
        title: "26. \u5de6\u53f3\u53cc\u4fa7\u6ed1\u5165\u62bd\u5c49 Drawer\uff08\u542b\u906e\u7f69\u70b9\u51fb\u5173\u95ed \u00b7 \u544a\u522b\u5f39\u7a97\u5d4c\u5957\uff09",
        fn: "lvxDrawer({ title, side: ",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const rightDrw = K.lvxDrawer({
        title: "👉 右侧滑入抽屉 · 打卡历史详情",
        side: "right",
        body: [
          K.lvxAlert({ tone: "brand", title: "右侧抽屉已激活", desc: "点击灰色背景遮罩或下方按钮即可平滑收起。" }),
        ],
        footer: [K.lvxButton({ label: "收起右侧抽屉", variant: "primary", sm: true, onClick: () => rightDrw.setAttribute("data-open", "false") })],
        onClose: () => {
          rightDrw.setAttribute("data-open", "false");
          setLog("关闭右侧抽屉");
        },
      });
      const leftDrw = K.lvxDrawer({
        title: "👈 左侧滑入抽屉 · 笔记本目录树",
        side: "left",
        body: [
          K.lvxAlert({ tone: "success", title: "左侧抽屉已激活 (lvx-drawer--left)", desc: "适用于移动端汉堡菜单或侧边目录导航。" }),
        ],
        footer: [K.lvxButton({ label: "收起左侧抽屉", variant: "primary", sm: true, onClick: () => leftDrw.setAttribute("data-open", "false") })],
        onClose: () => {
          leftDrw.setAttribute("data-open", "false");
          setLog("关闭左侧抽屉");
        },
      });
      stage.appendChild(rightDrw);
      stage.appendChild(leftDrw);

      const row = document.createElement("div");
      row.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;";
      row.appendChild(
        K.lvxButton({
          label: "👈 呼出左侧抽屉 (side=left)",
          onClick: () => {
            leftDrw.setAttribute("data-open", "true");
            setLog("打开左侧抽屉");
          },
        })
      );
      row.appendChild(
        K.lvxButton({
          label: "👉 呼出右侧抽屉 (side=right)",
          variant: "primary",
          onClick: () => {
            rightDrw.setAttribute("data-open", "true");
            setLog("打开右侧抽屉");
          },
        })
      );
      stage.appendChild(row);
        }
    },
    {
        id: 27,
        title: "27. \u8f7b\u91cf\u6c14\u6ce1\u5361\u7247\u6d6e\u5c42 Popover\uff08\u4e09\u7ea7\u9ad8\u6d6e\u8d77\u5149\u5f71 \u00b7 \u5185\u5d4c\u4ea4\u4e92\uff09",
        fn: "lvxPopover({ content, ariaLabel })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const wrap = document.createElement("div");
      wrap.style.cssText = "position:relative;display:inline-block;";
      const pop = K.lvxPopover({
        ariaLabel: "显示偏好气泡",
        content: [
          (() => {
            const box = document.createElement("div");
            box.style.cssText = "display:flex;flex-direction:column;gap:8px;min-width:220px;";
            box.innerHTML = `<strong style="font-size:12px;">✨ 卡片视图快速过滤</strong>`;
            box.appendChild(K.lvxSwitch({ checked: true, sm: true, label: "仅显示今日到期项", ariaLabel: "仅显示到期" }));
            box.appendChild(K.lvxSwitch({ checked: false, sm: true, label: "隐藏已暂停习惯", ariaLabel: "隐藏暂停" }));
            box.appendChild(
              K.lvxButton({
                label: "完成设置",
                variant: "primary",
                sm: true,
                block: true,
                onClick: () => {
                  pop.setAttribute("data-open", "false");
                  setLog("Popover 内部点击完成设置并收起");
                },
              })
            );
            return box;
          })(),
        ],
      });
      pop.style.top = "calc(100% + 8px)";
      pop.style.left = "0";

      const trigger = K.lvxButton({
        label: "💬 点击展开/收起交互式气泡卡 (Popover)",
        variant: "primary",
        onClick: () => {
          const open = pop.getAttribute("data-open") === "true";
          pop.setAttribute("data-open", open ? "false" : "true");
          setLog(`Popover 切换为: ${!open ? "展开" : "收起"}`);
        },
      });
      wrap.appendChild(trigger);
      wrap.appendChild(pop);
      stage.appendChild(wrap);
        }
    },
    {
        id: 28,
        title: "28. \u81ea\u52a8\u767e\u5206\u6bd4\u586b\u5145\u6ed1\u6746 Slider\uff08--lvx-slider-pct \u54c1\u724c\u8272\u8f68\u9053\uff09",
        fn: "lvxSlider({ value, min, max, step, disabled, onInput })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const col = document.createElement("div");
      col.style.cssText = "display:flex;flex-direction:column;gap:10px;";
      const lb1 = document.createElement("div");
      lb1.style.cssText = "display:flex;justify-content:space-between;font-size:12px;font-weight:600;";
      lb1.innerHTML = `<span>目标记忆留存率 (Desired Retention)</span><span style="color:var(--lvx-brand)">90%</span>`;
      col.appendChild(lb1);
      col.appendChild(
        K.lvxSlider({
          value: 90,
          min: 70,
          max: 99,
          step: 1,
          ariaLabel: "目标记忆留存率",
          onInput: (v) => {
            lb1.innerHTML = `<span>目标记忆留存率 (Desired Retention)</span><span style="color:var(--lvx-brand)">${v}%</span>`;
            setLog(`Slider 实时调整: ${v}%`);
          },
        })
      );
      const lb2 = document.createElement("div");
      lb2.style.cssText = "font-size:11px;color:var(--lvx-text-muted);margin-top:4px;";
      lb2.textContent = "禁用态滑杆 (disabled: true · 固定 40%)：";
      col.appendChild(lb2);
      col.appendChild(K.lvxSlider({ value: 40, disabled: true, ariaLabel: "禁用滑杆" }));
      stage.appendChild(col);
        }
    },
    {
        id: 29,
        title: "29. \u4e0b\u62c9\u4e0e\u4e0a\u4e0b\u6587\u83dc\u5355\u5bb9\u5668 Menu\uff08\u5206\u7ec4\u6807\u9898 \u00b7 \u56fe\u6807\u9879 \u00b7 \u5206\u9694\u7ebf \u00b7 \u5371\u9669\u9879\uff09",
        fn: "lvxMenu({ items })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxMenu({
          ariaLabel: "块操作菜单",
          items: [
            { groupLabel: "块级操作中心 (Block Action)" },
            { label: "提炼为属性问答闪卡", icon: "🗂", onClick: () => setLog("Menu 点击: 提炼闪卡") },
            { label: "绑定至习惯打卡锚点", icon: "🎯", onClick: () => setLog("Menu 点击: 绑定打卡") },
            { label: "收入小驴拾遗稍后读", icon: "📥", onClick: () => setLog("Menu 点击: 收入拾遗") },
            { divider: true },
            { label: "彻底移除闪卡标记并移入回收站", icon: "🗑️", danger: true, onClick: () => setLog("Menu 点击危险项: 移除标记") },
          ],
        })
      );
        }
    },
    {
        id: 30,
        title: "30. \u56db\u8272\u8282\u70b9\u5782\u76f4\u65f6\u95f4\u7ebf Timeline\uff08Brand / Energy / Success / Muted\uff09",
        fn: "lvxTimeline({ items: [{ title, time, content, tone }] })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxTimeline({
          items: [
            { title: "晨间精读打卡达成", time: "08:15", content: "阅读《设计心理学》35 分钟，连胜 +1", tone: "success" },
            { title: "触发 21 天连胜里程碑", time: "08:16", content: "获赠「坚韧小驴」暖橘勋章与 1 枚自律免死金牌", tone: "energy" },
            { title: "午间闪卡极速复习", time: "12:40", content: "完成 28 张到期卡，平均反应耗时 2.8s", tone: "brand" },
            { title: "晚间静默增量备份", time: "23:00", content: "快照已归档至本地历史槽位", tone: "muted" },
          ],
        })
      );
        }
    },
    {
        id: 31,
        title: "31. \u901a\u7528\u53cc\u884c\u5217\u8868\u5bb9\u5668 List & ListItem\uff08\u524d\u7f00\u69fd \u00b7 \u53cc\u884c\u7701\u7565 \u00b7 \u540e\u7f00\u69fd\uff09",
        fn: "lvxList({ items: [lvxListItem(opts)] })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxList({
          items: [
            K.lvxListItem({
              prefix: K.lvxAvatar({ text: "打", size: "sm", tone: "energy", status: "online" }),
              title: "小驴打卡 · 晨间深读 30 分钟",
              desc: "连续 21 天未中断 · 心流韧性指数 94% (S级)",
              suffix: K.lvxChip({ text: "🔥 已达成", tone: "energy" }),
              interactive: true,
              onClick: () => setLog("点击 ListItem: 小驴打卡"),
            }),
            K.lvxListItem({
              prefix: K.lvxAvatar({ text: "闪", size: "sm", tone: "brand", status: "online" }),
              title: "小驴闪卡 · 分布式系统核心牌组",
              desc: "今日待复习 14 张 · 新卡 4 张 · 巩固 10 张",
              suffix: K.lvxChip({ text: "开始复习 ›", tone: "brand" }),
              interactive: true,
              onClick: () => setLog("点击 ListItem: 小驴闪卡"),
            }),
            K.lvxListItem({
              prefix: K.lvxAvatar({ text: "拾", size: "sm", tone: "success" }),
              title: "小驴拾遗 · Ghostreader 批注大纲",
              desc: "今日已摘录 6 个高亮段落并自动结构化",
              suffix: K.lvxTag({ text: "已同步", tone: "success" }),
              interactive: true,
              onClick: () => setLog("点击 ListItem: 小驴拾遗"),
            }),
          ],
        })
      );
        }
    },
    {
        id: 32,
        title: "32. \u54cd\u5e94\u5f0f\u6570\u636e\u8868\u683c Table\uff08\u6807\u51c6/\u7d27\u51d1\u6a21\u5f0f\u5207\u6362 \u00b7 \u5d4c\u5165 DOM \u5355\u5143\u683c\uff09",
        fn: "lvxTable({ columns, rows, compact })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            let isCompact = false;
      const holder = document.createElement("div");
      const renderTbl = () => {
        holder.innerHTML = "";
        holder.appendChild(
          K.lvxTable({
            compact: isCompact,
            columns: [
              { key: "name", title: "习惯 / 牌组名称", width: 150 },
              { key: "state", title: "当前状态" },
              { key: "rate", title: "达成率", align: "right" },
            ],
            rows: [
              { name: "📖 晨间深读", state: K.lvxChip({ text: "连胜 21d", tone: "energy" }), rate: "100%" },
              { name: "🗂 算法闪卡", state: K.lvxChip({ text: "巩固期", tone: "brand" }), rate: "94.5%" },
              { name: "🏃 傍晚慢跑", state: K.lvxChip({ text: "达标", tone: "success" }), rate: "88.0%" },
            ],
          })
        );
      };
      renderTbl();
      stage.appendChild(
        K.lvxButton({
          label: "↕ 切换表格密度 (Standard ↔ Compact 紧凑模式)",
          sm: true,
          onClick: () => {
            isCompact = !isCompact;
            renderTbl();
            setLog(`Table 切换为: ${isCompact ? "紧凑模式 (compact)" : "标准模式"}`);
          },
        })
      );
      stage.appendChild(holder);
        }
    },
    {
        id: 33,
        title: "33. \u641c\u7d22\u8fc7\u6ee4\u7ec4\u5408\u6846 Combobox\uff08\u4e00\u952e\u6e05\u7a7a\u6309\u94ae \u2715 \u00b7 \u65e0\u5339\u914d\u7a7a\u6001\u63d0\u793a\uff09",
        fn: "lvxCombobox({ options, value, clearable, onChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxCombobox({
          clearable: true,
          placeholder: "点击展开或输入关键字搜索 8 大插件...",
          options: [
            { value: "checkin", label: "01 · 小驴打卡 (siyuan-checkin)" },
            { value: "home", label: "02 · 小驴管家 (siyuan-home)" },
            { value: "contacts", label: "03 · 小驴人脉 (siyuan-contacts)" },
            { value: "glean", label: "04 · 小驴拾遗 (siyuan-glean)" },
            { value: "cards", label: "05 · 小驴闪卡 (siyuan-lv-cards)" },
            { value: "exam", label: "06 · 小驴考试 (siyuan-exam)" },
            { value: "common", label: "07 · 小驴常用 (xiaolv-common)" },
            { value: "leiqie", label: "08 · 小驴雷切 (siyuan-speed-switch)" },
          ],
          value: "checkin",
          onChange: (v) => setLog(`Combobox 选择值: "${v || "(已清空)"}"`),
        })
      );
        }
    },
    {
        id: 34,
        title: "34. \u9012\u5f52\u6298\u53e0\u5c42\u7ea7\u6811 Tree\uff08\u7bad\u5934\u65cb\u8f6c \u00b7 \u8ba1\u6570\u5fbd\u7ae0 \u00b7 \u9009\u4e2d\u9ad8\u4eae\uff09",
        fn: "lvxTree({ nodes, onSelect })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const card = K.lvxCard({
        children: [
          K.lvxTree({
            nodes: [
              {
                id: "cat-habit",
                label: "日常自律习惯库",
                icon: "🔥",
                badge: 3,
                expanded: true,
                selected: true,
                children: [
                  { id: "h-1", label: "晨间深读 30 分钟", icon: "📖", badge: "21d" },
                  { id: "h-2", label: "午间冥想 15 分钟", icon: "🧘", badge: "14d" },
                  { id: "h-3", label: "晚间微复盘一句话", icon: "🌙", badge: "30d" },
                ],
              },
              {
                id: "cat-exam",
                label: "小驴考试题库分类",
                icon: "📝",
                badge: 2,
                expanded: false,
                children: [
                  { id: "e-1", label: "操作系统与并发编程", icon: "💻", badge: "64题" },
                  { id: "e-2", label: "高频易错题冲刺卷", icon: "⚡", badge: "18题" },
                ],
              },
            ],
            onSelect: (n) => setLog(`Tree 选中节点: ${n.label} (id=${n.id})`),
          }),
        ],
      });
      stage.appendChild(card);
        }
    },
    {
        id: 35,
        title: "35. \u6253\u5361\u8272\u70b9\u65e5\u5386\u7f51\u683c Calendar / DatePicker\uff08\u4e09\u5c3a\u5bf8 sm/md/lg \u540c\u5c4f\u5bf9\u7167 \u00b7 \u4eca\u952e\u8df3\u56de \u00b7 \u4e8b\u4ef6\u5706\u70b9\uff09",
        fn: "lvxCalendar({ year, month, selectedDate, size: ",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const commonDots = {
        "2026-11-05": "success",
        "2026-11-09": "brand",
        "2026-11-14": "success",
        "2026-11-15": "success",
        "2026-11-16": "energy",
        "2026-11-17": "energy",
        "2026-11-18": "brand",
        "2026-11-20": "brand",
        "2026-11-24": "energy",
      };
      const wrap = document.createElement("div");
      wrap.style.cssText = "display:flex;align-items:flex-start;justify-content:space-around;gap:18px;flex-wrap:wrap;padding:4px 0;";

      [
        { size: "sm", label: "紧凑小尺寸 (size: 'sm' · 224px)", usage: "适用：思源侧边栏 Dock / 紧凑气泡选择器", sel: "2026-11-16" },
        { size: "md", label: "标准中尺寸 (size: 'md' · 280px)", usage: "适用：常规 DatePicker 弹窗 / 习惯复盘卡", sel: "2026-11-18" },
        { size: "lg", label: "桌面大尺寸 (size: 'lg' · 348px)", usage: "适用：月度打卡全览主看板 / 考试日程中心", sel: "2026-11-20" },
      ].forEach((cfg) => {
        const col = document.createElement("div");
        col.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:8px;";
        const meta = document.createElement("div");
        meta.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:2px;text-align:center;";
        meta.innerHTML = `<span style="font-size:12.5px;font-weight:700;color:var(--lvx-text);">${cfg.label}</span><span style="font-size:11px;color:var(--lvx-text-muted);">${cfg.usage}</span>`;
        col.appendChild(meta);
        col.appendChild(
          K.lvxCalendar({
            year: 2026,
            month: 11,
            size: cfg.size,
            selectedDate: cfg.sel,
            dots: commonDots,
            onSelectDate: (d) => setLog(`Calendar [${cfg.size}] 选中日期: ${d}`),
          })
        );
        wrap.appendChild(col);
      });
      stage.appendChild(wrap);
        }
    },
    {
        id: 36,
        title: "36. \u53cc\u5217\u65f6\u5206\u9009\u62e9\u5668 TimePicker\uff08\u7b49\u5bbd\u6570\u5b57 \u00b7 \u70b9\u51fb\u5207\u6362 \u00b7 \u786e\u5b9a\u6536\u8d77\uff09",
        fn: "lvxTimePicker({ value, onChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;gap:14px;flex-wrap:wrap;min-height:60px;";
      row.innerHTML = `<span style="font-size:13px;font-weight:500;">⏰ 每日固定打卡提醒时间：</span>`;
      row.appendChild(
        K.lvxTimePicker({
          value: "08:30",
          onChange: (t) => setLog(`TimePicker 更新时间: ${t}`),
        })
      );
      stage.appendChild(row);
        }
    },
    {
        id: 37,
        title: "37. DL2 \u865a\u7ebf\u7f51\u683c\u67d4\u548c\u66f2\u7ebf\u56fe Sparkline / Chart\uff08\u4e09\u8272\u9636 \u00b7 \u7edf\u8ba1\u6458\u8981\u680f\uff09",
        fn: "lvxSparkline({ data, labels, tone, currentIndex, showSummary, unit })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const grid = document.createElement("div");
      grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px;";
      const renderAll = (seed = 1) => {
        grid.innerHTML = "";
        [
          { title: "柔雾紫 Brand · 闪卡每日复习量", tone: "brand", unit: "张", base: [22, 30, 26, 40, 36, 52, 48] },
          { title: "暖橘 Energy · 习惯心流韧性指数", tone: "energy", unit: "%", base: [72, 76, 80, 78, 86, 91, 95] },
          { title: "翠绿 Success · 考试模考正确率", tone: "success", unit: "%", base: [65, 70, 74, 82, 85, 89, 94] },
        ].forEach((cfg, idx) => {
          const d = cfg.base.map((v, i) => Math.max(10, Math.min(100, Math.round(v + Math.sin(seed + i + idx) * 6))));
          const col = document.createElement("div");
          col.innerHTML = `<div style="font-size:12px;font-weight:600;margin-bottom:6px;">${cfg.title}</div>`;
          col.appendChild(
            K.lvxSparkline({
              data: d,
              labels: ["一", "二", "三", "四", "五", "六", "今"],
              tone: cfg.tone,
              currentIndex: 6,
              showSummary: true,
              unit: cfg.unit,
            })
          );
          grid.appendChild(col);
        });
      };
      renderAll(1);
      stage.appendChild(grid);
      stage.appendChild(
        K.lvxButton({
          label: "🎲 随机刷新三组趋势曲线数据",
          sm: true,
          onClick: () => {
            renderAll(Math.random() * 10);
            setLog("已重绘 Brand / Energy / Success 三组贝塞尔趋势曲线");
          },
        })
      );
        }
    },
    {
        id: 38,
        title: "38. \u5168\u5c40\u547d\u4ee4\u9762\u677f CommandPalette\uff08\u641c\u7d22\u8fc7\u6ee4 \u00b7 \u952e\u76d8 \u2191/\u2193/Enter \u00b7 \u5feb\u6377\u952e\uff09",
        fn: "lvxCommandPalette({ items, placeholder, onSelect })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxCommandPalette({
          placeholder: "输入命令关键字（如：打卡 / 闪卡 / 对账）或按 ↑↓ 键导航...",
          items: [
            { id: "cmd-checkin", label: "立即完成今日习惯打卡", group: "小驴打卡", icon: "✅", shortcut: ["Ctrl", "Enter"] },
            { id: "cmd-freeze", label: "使用自律免死金牌保护连胜", group: "小驴打卡", icon: "🛡️", shortcut: ["Alt", "F"] },
            { id: "cmd-review", label: "启动三段式极简闪卡复习", group: "小驴闪卡", icon: "🗂", shortcut: ["Ctrl", "R"] },
            { id: "cmd-diff", label: "打开重复文档双栏 Diff 对比", group: "小驴管家", icon: "🔍", shortcut: ["Ctrl", "D"] },
          ],
          onSelect: (id) => setLog(`CommandPalette 执行命令: ${id}`),
        })
      );
        }
    },
    {
        id: 39,
        title: "39. \u65b0\u624b\u5f15\u5bfc\u805a\u5149\u706f\u5361 Tour\uff08\u5409\u7965\u7269\u63d2\u69fd \u00b7 \u80f6\u56ca\u8fdb\u5ea6\u70b9 \u00b7 \u591a\u6b65\u95ed\u73af\uff09",
        fn: "lvxTour({ steps, mascot, onChange, onFinish })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxTour({
          mascot: K.lvMascot("wave"),
          steps: [
            { badge: "第 1 步 · 主题独立", title: "一底两色一锚 · 免疫第三方主题污染", desc: "内置 7 变量 b3 隔离罩，无论切换任何思源主题，小驴组件库均保持高对比度柔雾紫与暖橘视觉。" },
            { badge: "第 2 步 · 动效可控", title: "装饰动效一键可关 · 加载进度白名单守护", desc: "庆祝撒花、呼吸辉光与吉祥物均受生态偏好实时门控，骨架屏与进度条则始终如实呈现。" },
            { badge: "第 3 步 · 全栈同源", title: "packages/lv-kit 唯一事实源投射 8 仓", desc: "通过 suite check-kit 与 check-tokens 双重门禁锁死 8 大集市插件 100% 字节级一致。" },
          ],
          onChange: (i) => setLog(`Tour 推进至第 ${i + 1} 步`),
          onFinish: () => setLog("🎉 Tour 新手引导全部完成！"),
        })
      );
        }
    },
    {
        id: 40,
        title: "40. \u4e07\u7ea7\u957f\u5217\u8868\u865a\u62df\u6eda\u52a8\u5bb9\u5668 VirtualList\uff0810,000 \u884c\u5b9e\u65f6\u5207\u7247\uff09",
        fn: "lvxVirtualList({ items, itemHeight, height, renderItem })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const data = Array.from({ length: 10000 }, (_, i) => ({
        idx: i + 1,
        title: `闪卡条目 #${String(i + 1).padStart(5, "0")} · 操作系统虚拟内存页表映射机制`,
        due: `${(i % 15) + 1}天后`,
      }));
      const vl = K.lvxVirtualList({
        items: data,
        itemHeight: 38,
        height: 175,
        overscan: 2,
        renderItem: (it) => {
          const r = document.createElement("div");
          r.style.cssText = "display:flex;justify-content:space-between;align-items:center;width:100%;";
          r.innerHTML = `<span style="font-weight:500;">${it.title}</span><span class="lvx-tag lvx-tag--brand">${it.due}</span>`;
          return r;
        },
      });
      vl.addEventListener("scroll", () => {
        const nodes = vl.querySelectorAll(".lvx-vlist__row").length;
        setLog(`10,000 条数据 · 实际 DOM 节点数: ${nodes} 个 (scrollTop=${Math.round(vl.scrollTop)}px)`);
      });
      stage.appendChild(vl);

      const jumpRow = document.createElement("div");
      jumpRow.style.cssText = "display:flex;gap:6px;flex-wrap:wrap;";
      [1, 2500, 5000, 9995].forEach((rowNum) => {
        jumpRow.appendChild(
          K.lvxButton({
            label: `跳至第 #${rowNum} 行`,
            sm: true,
            onClick: () => {
              vl.scrollTop = (rowNum - 1) * 38;
              vl.dispatchEvent(new Event("scroll"));
            },
          })
        );
      });
      stage.appendChild(jumpRow);
        }
    },
    {
        id: 41,
        title: "41. \u62d6\u62fd\u4e0e\u952e\u76d8\u65e0\u969c\u788d\u91cd\u6392\u5217\u8868 DragSort\uff08\u624b\u67c4\u62d6\u62fd + \u2191/\u2193 \u6309\u94ae\uff09",
        fn: "lvxDragSort({ items, onReorder })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxDragSort({
          items: [
            { id: "p1", label: "1. 晨间深读《认知天性》30m", meta: "P0 核心" },
            { id: "p2", label: "2. 艾宾浩斯到期闪卡清空", meta: "P0 必做" },
            { id: "p3", label: "3. Ghostreader 精读摘录整理", meta: "P1 进阶" },
            { id: "p4", label: "4. 睡前微复盘日记归档", meta: "P2 轻量" },
          ],
          onReorder: (ids) => setLog(`DragSort 新顺序: [${ids.join(" → ")}]`),
        })
      );
        }
    },
    {
        id: 42,
        title: "42. \u52a0\u8f7d\u5360\u4f4d\u9aa8\u67b6\u5c4f Skeleton\uff08\u56db\u53d8\u4f53\u7ec4\u5408 \u00b7 \u771f\u5b9e\u6570\u636e\u5207\u6362\u6f14\u793a\uff09",
        fn: "lvxSkeleton({ variant: ",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            let loading = true;
      const box = document.createElement("div");
      const renderSk = () => {
        box.innerHTML = "";
        if (loading) {
          const card = K.lvxCard({
            children: [
              (() => {
                const top = document.createElement("div");
                top.style.cssText = "display:flex;gap:12px;align-items:center;margin-bottom:12px;";
                top.appendChild(K.lvxSkeleton({ variant: "circle", width: 40, height: 40 }));
                top.appendChild(K.lvxSkeleton({ variant: "title", width: "60%" }));
                return top;
              })(),
              K.lvxSkeleton({ variant: "text", lines: 3 }),
            ],
          });
          box.appendChild(card);
        } else {
          box.appendChild(
            K.lvxCard({
              children: [
                K.lvxListItem({
                  prefix: K.lvxAvatar({ text: "驴", status: "online" }),
                  title: "数据加载完成 · 今日复习报告已生成",
                  desc: "共加载 42 条复习记录，平均记忆稳定性提升 +18.4%",
                  suffix: K.lvxChip({ text: "已就绪", tone: "success" }),
                }),
              ],
            })
          );
        }
      };
      renderSk();
      stage.appendChild(box);
      stage.appendChild(
        K.lvxButton({
          label: "🔄 切换「Skeleton 骨架加载态 ↔ 真实数据渲染态」",
          sm: true,
          onClick: () => {
            loading = !loading;
            renderSk();
            setLog(`Skeleton 切换为: ${loading ? "骨架占位态" : "真实数据完成态"}`);
          },
        })
      );
        }
    },
    {
        id: 43,
        title: "43. \u4e09\u6bb5\u5f0f\u9519\u8bef\u4e0e\u964d\u7ea7\u8b66\u793a\u5361 ErrorState\uff08Danger / Warn \u53cc\u6001\uff09",
        fn: "lvxErrorState({ icon, title, desc, tone: ",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            let tone = "danger";
      const box = document.createElement("div");
      const renderErr = () => {
        box.innerHTML = "";
        const err = K.lvxErrorState({
          tone,
          icon: tone === "danger" ? "🚨" : "⚠️",
          title: tone === "danger" ? "Danger 态 · 数据库写锁超时" : "Warn 态 · AI 主通道限流降级",
          desc:
            tone === "danger"
              ? "思源内核正在执行全量索引重建，请点击下方按钮重试或复制诊断报告。"
              : "已自动切换至备选模型通道，生成速度可能略有波动。",
          actions: [
            K.lvxButton({ label: "立即重试", variant: "primary", sm: true, onClick: () => setLog("ErrorState: 点击立即重试") }),
            K.lvxButton({
              label: `切换为 ${tone === "danger" ? "Warn 警告态" : "Danger 错误态"}`,
              sm: true,
              onClick: () => {
                tone = tone === "danger" ? "warn" : "danger";
                renderErr();
                setLog(`ErrorState 切换为 tone=${tone}`);
              },
            }),
          ],
        });
        err.style.padding = "20px 16px";
        box.appendChild(err);
      };
      renderErr();
      stage.appendChild(box);
        }
    },
    {
        id: 44,
        title: "44. \u673a\u68b0\u7acb\u4f53\u611f\u5feb\u6377\u952e\u6807\u7b7e Kbd\uff08\u5355\u952e\u4e0e\u7ec4\u5408\u952e\u77e9\u9635\uff09",
        fn: "lvxKbd(",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const list = document.createElement("div");
      list.style.cssText = "display:flex;flex-direction:column;gap:10px;";
      [
        ["唤醒小驴极速罗盘", ["Ctrl", "Shift", "L"]],
        ["快速新建属性问答闪卡", ["Ctrl", "Alt", "F"]],
        ["闪卡复习评分（重来 / 困难 / 良好 / 简单）", ["1", "2", "3", "4"]],
        ["关闭当前浮层或命令面板", "ESC"],
      ].forEach(([desc, keys]) => {
        const row = document.createElement("div");
        row.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:6px 10px;border-radius:10px;background:var(--lvx-surface);border:1px solid var(--lvx-border);font-size:12px;";
        row.appendChild(document.createTextNode(desc));
        row.appendChild(K.lvxKbd(keys));
        list.appendChild(row);
      });
      stage.appendChild(list);
        }
    },
    {
        id: 45,
        title: "45. \u80f6\u56ca\u6570\u503c\u6b65\u8fdb\u5668 Stepper\uff08\u4e0a\u4e0b\u9650\u81ea\u52a8\u7981\u7528 \u00b7 \u7b49\u5bbd\u5355\u4f4d\u540e\u7f00\uff09",
        fn: "lvxStepper({ value, min, max, step, unit, onChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const col = document.createElement("div");
      col.style.cssText = "display:flex;flex-direction:column;gap:10px;";
      [
        { label: "🍅 番茄钟专注时长 (5~60m, 步长 5)", value: 25, min: 5, max: 60, step: 5, unit: " min" },
        { label: "🛡️ 每月免死金牌上限 (1~5枚, 步长 1)", value: 2, min: 1, max: 5, step: 1, unit: " 枚" },
      ].forEach((cfg) => {
        const row = document.createElement("div");
        row.style.cssText = "display:flex;justify-content:space-between;align-items:center;font-size:13px;";
        row.appendChild(document.createTextNode(cfg.label));
        row.appendChild(
          K.lvxStepper({
            value: cfg.value,
            min: cfg.min,
            max: cfg.max,
            step: cfg.step,
            unit: cfg.unit,
            onChange: (v) => setLog(`Stepper [${cfg.label}] 更新为: ${v}${cfg.unit}`),
          })
        );
        col.appendChild(row);
      });
      stage.appendChild(col);
        }
    },
    {
        id: 46,
        title: "46. \u4e09\u6001\u5de5\u4f5c\u6d41\u6b65\u9aa4\u6761 Steps\uff08Done \u2713 / Active / Pending \u53ef\u70b9\u51fb\u5207\u6362\uff09",
        fn: "lvxSteps({ steps, current, onStepClick })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxSteps({
          current: 1,
          steps: [
            { title: "1. 拾遗采集" },
            { title: "2. AI 批注" },
            { title: "3. 提炼闪卡" },
            { title: "4. 间隔复习" },
          ],
          onStepClick: (i) => setLog(`Steps 切换至步骤 #${i + 1}`),
        })
      );
        }
    },
    {
        id: 47,
        title: "47. \u6696\u6a58\u80fd\u91cf\u661f\u7ea7\u8bc4\u5206 Rate\uff08\u4ea4\u4e92\u6253\u5206 \u00b7 \u5206\u503c\u5fbd\u7ae0 \u00b7 \u53ea\u8bfb\u6001\uff09",
        fn: "lvxRate({ value, max, showScore, disabled, onChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const col = document.createElement("div");
      col.style.cssText = "display:flex;flex-direction:column;gap:10px;";
      const r1 = document.createElement("div");
      r1.style.cssText = "display:flex;justify-content:space-between;align-items:center;font-size:13px;";
      r1.appendChild(document.createTextNode("今日心流专注度自评 (可点击打分)："));
      r1.appendChild(K.lvxRate({ value: 4, max: 5, onChange: (v) => setLog(`Rate 打分: ${v}.0 星`) }));
      col.appendChild(r1);

      const r2 = document.createElement("div");
      r2.style.cssText = "display:flex;justify-content:space-between;align-items:center;font-size:13px;color:var(--lvx-text-muted);";
      r2.appendChild(document.createTextNode("历史平均稳固度评级 (disabled 只读)："));
      r2.appendChild(K.lvxRate({ value: 5, max: 5, disabled: true }));
      col.appendChild(r2);
      stage.appendChild(col);
        }
    },
    {
        id: 48,
        title: "48. \u504f\u597d\u95e8\u63a7\u5e86\u795d\u6492\u82b1\u52a8\u6548\u4ef6 Confetti\uff08\u7269\u7406\u629b\u6d12 \u00b7 \u5173\u95ed\u504f\u597d\u5373\u9759\u9ed8\uff09",
        fn: "lvxConfetti({ count }) / triggerLvConfetti(host, count)",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const box = document.createElement("div");
      box.style.cssText = "display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:18px;border-radius:16px;background:var(--lvx-surface);border:1px solid var(--lvx-border);";
      const confHost = K.lvxConfetti({ count: 16 });
      box.appendChild(confHost);
      box.appendChild(
        K.lvxButton({
          label: "🎉 点击发射庆祝撒花 (实测门控开关)",
          variant: "energy",
          onClick: () => {
            const n = K.triggerLvConfetti(confHost, 18);
            if (n === 0) setLog("⏸ 已被外观偏好门控拦截 (data-lv-celebration=off 或 motion!=full)");
            else setLog(`🎉 成功抛洒 ${n} 枚双色几何庆祝彩屑！`);
          },
        })
      );
      stage.appendChild(box);
        }
    },
    {
        id: 49,
        title: "49. \u624b\u52bf\u5de6\u6ed1\u64cd\u4f5c\u884c SwipeAction\uff08Touch/Pointer \u62d6\u62fd + \u6309\u94ae\u5c55\u5f00\uff09",
        fn: "lvxSwipeAction({ prefix, title, desc, actions })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const stack = document.createElement("div");
      stack.style.cssText = "display:flex;flex-direction:column;gap:8px;";
      stack.appendChild(
        K.lvxSwipeAction({
          prefix: "📖",
          title: "晨间深读《认知天性》30 分钟",
          desc: "左滑或点右侧「操作 ◂」露出打卡/免死金牌/归档按钮",
          actions: [
            { label: "🔥 打卡", tone: "energy", onClick: () => setLog("SwipeAction: 完成打卡") },
            { label: "免死金牌", tone: "brand", onClick: () => setLog("SwipeAction: 免死金牌") },
            { label: "归档", tone: "danger", onClick: () => setLog("SwipeAction: 归档") },
          ],
        })
      );
      stack.appendChild(
        K.lvxSwipeAction({
          prefix: "🏃",
          title: "傍晚有氧慢跑 3 公里",
          desc: "本周已完成 5/7 次",
          actions: [
            { label: "✓ 记一次", tone: "energy", onClick: () => setLog("SwipeAction: 记一次慢跑") },
            { label: "跳过今日", tone: "brand", onClick: () => setLog("SwipeAction: 跳过今日") },
          ],
        })
      );
      stage.appendChild(stack);
        }
    },
    {
        id: 50,
        title: "50. \u73af\u5f62\u8fdb\u5ea6\u4eea\u8868\u76d8 ProgressRing\uff08\u4e09\u5c3a\u5bf8 sm/md/lg \u00b7 \u56db\u8272\u9636 \u00b7 \u4e2d\u5fc3\u526f\u6807\u7b7e\uff09",
        fn: "lvxProgressRing({ value, size: ",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;justify-content:space-around;gap:14px;flex-wrap:wrap;padding:6px 0;";
      let pct = 0.8;
      const renderRings = () => {
        row.innerHTML = "";
        row.appendChild(K.lvxProgressRing({ value: pct, size: "sm", tone: "brand", ariaLabel: "小号环" }));
        row.appendChild(K.lvxProgressRing({ value: pct, size: "md", tone: "energy", label: `${Math.round(pct * 100)}%`, sublabel: "心流韧性" }));
        row.appendChild(K.lvxProgressRing({ value: pct, size: "lg", tone: "success", label: `${Math.round(pct * 5)}/5`, sublabel: "今日打卡" }));
        row.appendChild(K.lvxProgressRing({ value: 0.35, size: "md", tone: "danger", label: "35%", sublabel: "待补齐" }));
      };
      renderRings();
      stage.appendChild(row);
      stage.appendChild(
        K.lvxButton({
          label: "↻ 推进环形仪表进度 (+20%)",
          sm: true,
          onClick: () => {
            pct = pct >= 1 ? 0.2 : Math.round((pct + 0.2) * 100) / 100;
            renderRings();
            setLog(`ProgressRing 更新进度: ${Math.round(pct * 100)}%`);
          },
        })
      );
        }
    },
    {
        id: 51,
        title: "51. \u6298\u53e0\u624b\u98ce\u7434\u9762\u677f Collapse / Accordion\uff08\u539f\u751f details \u65e0\u969c\u788d \u00b7 \u5fbd\u7ae0\u8ba1\u6570\uff09",
        fn: "lvxCollapse({ items: [{ id, title, icon, badge, open, content }] })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxCollapse({
          items: [
            {
              id: "c-1",
              icon: "🌅",
              title: "晨间黄金心流时段",
              badge: "2 项待办",
              open: true,
              content: "包含「每日计划（35%）」与「早起（47%）」，建议在 09:00 前完成。",
            },
            {
              id: "c-2",
              icon: "🕰️",
              title: "往年今日 (This Day in History)",
              badge: "2025-11-18",
              open: false,
              content: "1 年前的今天完成了 4 项习惯打卡，并记下了 1 条微复盘感悟。",
            },
            {
              id: "c-3",
              icon: "📊",
              title: "未来七天负荷预览 (Week Load)",
              badge: "周期配额",
              open: false,
              content: "本周固定排期 14 次，弹性周配额「深度阅读 3 次」尚余 1 次。",
            },
          ],
        })
      );
        }
    },
    {
        id: 52,
        title: "52. \u4e03\u65e5\u6253\u5361\u72b6\u6001\u80f6\u7247\u6761 WeekStrip\uff08\u56db\u6001\u8272\u6807 \u00b7 \u4eca\u65e5\u67d4\u96fe\u7d2b\u6e10\u53d8\u6d6e\u8d77\uff09",
        fn: "lvxWeekStrip({ days: [{ date, weekday, dayNum, status, today }], onSelect })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxWeekStrip({
          days: [
            { date: "2026-11-12", weekday: "周四", dayNum: 12, status: "complete" },
            { date: "2026-11-13", weekday: "周五", dayNum: 13, status: "complete" },
            { date: "2026-11-14", weekday: "周六", dayNum: 14, status: "partial" },
            { date: "2026-11-15", weekday: "周日", dayNum: 15, status: "complete" },
            { date: "2026-11-16", weekday: "周一", dayNum: 16, status: "partial" },
            { date: "2026-11-17", weekday: "周二", dayNum: 17, status: "complete" },
            { date: "2026-11-18", weekday: "周三", dayNum: 18, status: "partial", today: true },
          ],
          onSelect: (d) => setLog(`WeekStrip 切换选中日期: ${d}`),
        })
      );
        }
    },
    {
        id: 53,
        title: "53. \u4e0b\u4e00\u6b65\u884c\u52a8\u9886\u822a\u6761 & \u8fde\u51fb\u6551\u8d4e\u6a2a\u5e45 ActionBanner\uff08\u542b SVG \u56fe\u6807\u5c3a\u5bf8\u9632\u6491\u7206\u9501\uff09",
        fn: "lvxActionBanner({ eyebrow, title, desc, icon, tone: ",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const stack = document.createElement("div");
      stack.style.cssText = "display:flex;flex-direction:column;gap:10px;";
      stack.appendChild(
        K.lvxActionBanner({
          tone: "energy",
          icon: "🩹",
          eyebrow: "连击救赎机会 · 昨日差一步",
          title: "思阅精读 · 补卡或启用免死金牌可无损延续 21 天连击",
          actions: [
            K.lvxButton({ label: "🛡️ 免死金牌 (余 2 张)", sm: true, onClick: () => setLog("ActionBanner: 启用免死金牌") }),
            K.lvxButton({ label: "立即补卡", variant: "primary", sm: true, onClick: () => setLog("ActionBanner: 立即补卡") }),
          ],
        })
      );
      stack.appendChild(
        K.lvxActionBanner({
          tone: "brand",
          icon: "🎯",
          eyebrow: "下一步行动 (NEXT ACTION)",
          title: "每日计划 · 工作晨间首项打卡",
          desc: "按自己的节奏，慢慢积累 · 距离今日全部达成仅差 2 项",
          actions: [
            K.lvxButton({ label: "✓ 立即打卡", variant: "primary", sm: true, onClick: () => setLog("ActionBanner: 完成下一步打卡") }),
            K.lvxButton({ label: "⏱ 开始专注", sm: true, onClick: () => setLog("ActionBanner: 启动番茄专注") }),
            K.lvxButton({ label: "看全部提醒 ›", variant: "ghost", sm: true, onClick: () => setLog("ActionBanner: 跳转提醒中心") }),
          ],
        })
      );
      stage.appendChild(stack);
        }
    },
    {
        id: 54,
        title: "54. \u65e5\u671f\u63d0\u9192\u4e0e\u53ef\u52fe\u9009\u5f85\u529e\u901f\u89c8\u6a2a\u5e45 ReminderStrip\uff08\u7eaa\u5ff5\u65e5 + Task Horizon \u8054\u52a8\uff09",
        fn: "lvxReminderStrip({ title, occasions, tasks, actions, onToggleTask })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxReminderStrip({
          title: "日期提醒 · 待办 5",
          occasions: [
            { icon: "🚗", name: "汽车保险续保", meta: "2 天后" },
          ],
          tasks: [
            { id: "t1", title: "南通东布洲·沛县建元二次资料准备", done: false },
            { id: "t2", title: "江阴扬子金物·减资、清算", done: false },
            { id: "t3", title: "金宣·广德·退出决策", done: false },
            { id: "t4", title: "安徽金宣·广德桐汭·回款计划", done: false },
            { id: "t5", title: "龙泉·绩效评价·整改落实情况", done: true },
          ],
          actions: [
            K.lvxButton({ label: "日历", variant: "ghost", sm: true, onClick: () => setLog("ReminderStrip: 打开日历") }),
            K.lvxButton({ label: "管理", variant: "ghost", sm: true, onClick: () => setLog("ReminderStrip: 打开管理") }),
          ],
          onToggleTask: (id, done) => setLog(`ReminderStrip 待办 [${id}] 切换为: ${done ? "已完成 ☑" : "未完成 ☐"}`),
        })
      );
        }
    },
    {
        id: 55,
        title: "55. \u641c\u7d22\u7b5b\u9009\u4e0e\u591a\u9009\u6574\u7406\u680f FilterBar\uff08\u80f6\u56ca\u641c\u7d22\u6846 + \u5206\u7ec4\u4e0b\u62c9 + \u591a\u9009\u5207\u6362\uff09",
        fn: "lvxFilterBar({ placeholder, filters, bulkActive, onSearch, onToggleBulk })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxFilterBar({
          placeholder: "筛选打卡项 (输入关键字实时过滤)...",
          filters: [
            K.lvxSelect({
              size: "sm",
              ariaLabel: "分组模式",
              options: [
                { value: "time", label: "🕒 按时段分组" },
                { value: "group", label: "📁 按分类分组" },
                { value: "priority", label: "🔥 按优先级" },
              ],
              value: "time",
              onChange: (v) => setLog(`FilterBar 切换分组: ${v}`),
            }),
          ],
          onSearch: (q) => setLog(`FilterBar 搜索: "${q}"`),
          onToggleBulk: (b) => setLog(`FilterBar 多选模式: ${b}`),
        })
      );
        }
    },
    {
        id: 56,
        title: "56. \u591a\u9009\u6279\u91cf\u64cd\u4f5c\u6d6e\u52a8\u680f BulkBar\uff08\u58a8\u8272\u9ad8\u5bf9\u6bd4\u5ea6\u80f6\u56ca\u5de5\u5177\u6761\uff09",
        fn: "lvxBulkBar({ selectedCount, actions, onExit })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxBulkBar({
          selectedCount: 3,
          actions: [
            { label: "全选", onClick: () => setLog("BulkBar: 全选") },
            { label: "✓ 批量完成", primary: true, onClick: () => setLog("BulkBar: 批量完成") },
            { label: "跳过今日", onClick: () => setLog("BulkBar: 跳过今日") },
            { label: "删除", danger: true, onClick: () => setLog("BulkBar: 批量删除") },
          ],
          onExit: () => setLog("BulkBar: 退出多选模式"),
        })
      );
        }
    },
    {
        id: 57,
        title: "57. \u5168\u529f\u80fd\u4e60\u60ef\u6253\u5361\u4e1a\u52a1\u5361\u7247 HabitCard\uff08\u8fde\u80dc\u706b\u82d7 + \u97e7\u6027\u62a4\u76fe + \u5fae\u53cd\u601d + \u6253\u5361\uff09",
        fn: "lvxHabitCard({ name, meta, icon, percent, streak, resilience, onCheckin, onReflect })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const grid = document.createElement("div");
      grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;";
      grid.appendChild(
        K.lvxHabitCard({
          name: "每日计划",
          meta: "工作 · 完成一次 · 晨间",
          icon: "🎯",
          percent: 35,
          streak: 14,
          resilience: 92,
          onCheckin: (done) => setLog(`HabitCard [每日计划] 打卡状态: ${done}`),
          onReflect: () => setLog("HabitCard: 打开微反思弹窗 💭"),
        })
      );
      grid.appendChild(
        K.lvxHabitCard({
          name: "早起",
          meta: "健康 · 完成一次 · 晨间",
          icon: "🌅",
          percent: 47,
          streak: 21,
          resilience: 96,
          onCheckin: (done) => setLog(`HabitCard [早起] 打卡状态: ${done}`),
          onReflect: () => setLog("HabitCard: 打开微反思弹窗 💭"),
        })
      );
      stage.appendChild(grid);
        }
    },
    {
        id: 58,
        title: "58. \u4e94\u7ea7\u7cbe\u529b\u4e0e\u5fc3\u6d41\u60c5\u7eea\u9009\u62e9\u5668 MoodPicker\uff081 \ud83d\ude34 ~ 5 \ud83d\ude80 \u80f6\u56ca\u5355\u9009\uff09",
        fn: "lvxMoodPicker({ value, onChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxMoodPicker({
          value: 4,
          onChange: (lvl) => setLog(`MoodPicker 切换精力等级: Level ${lvl}`),
        })
      );
        }
    },
    {
        id: 59,
        title: "59. \u591a\u8272\u5806\u53e0\u5206\u6bb5\u6bd4\u4f8b\u6761 SegmentedBar\uff08\u56db\u8272\u5360\u6bd4\u8f68\u9053 + \u81ea\u52a8\u767e\u5206\u6bd4\u56fe\u4f8b\uff09",
        fn: "lvxSegmentedBar({ segments: [{ label, value, tone }], unit })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxSegmentedBar({
          unit: "张",
          segments: [
            { label: "已巩固", value: 52, tone: "success" },
            { label: "待复习", value: 28, tone: "brand" },
            { label: "学习中", value: 14, tone: "energy" },
            { label: "难点重学", value: 6, tone: "danger" },
          ],
        })
      );
        }
    },
    {
        id: 60,
        title: "60. \u591a\u7ef4\u6307\u6807\u7edf\u8ba1\u5361\u77e9\u9635 StatGrid\uff08\u7b49\u5bbd\u5927\u6570\u5b57 + \u73af\u6bd4\u8d8b\u52bf\u5fbd\u7ae0\uff09",
        fn: "lvxStatGrid({ items: [{ label, value, unit, trend, tone }] })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxStatGrid({
          items: [
            { label: "月度打卡完成率", value: "94.2", unit: "%", trend: "↑ 4.1%", tone: "success" },
            { label: "最长连续打卡", value: 21, unit: "天", trend: "🔥 历史新高", tone: "energy" },
            { label: "闪卡记忆留存率", value: "91.8", unit: "%", trend: "FSRS-5", tone: "brand" },
          ],
        })
      );
        }
    },
    {
        id: 61,
        title: "61. \u7ed3\u6784\u5316\u952e\u503c\u5c5e\u6027\u63cf\u8ff0\u8868 Descriptions\uff08\u5355\u53cc\u5217\u81ea\u9002\u5e94 \u00b7 \u652f\u6301\u5185\u5d4c\u6807\u7b7e\uff09",
        fn: "lvxDescriptions({ items: [{ label, value }], cols: 1|2 })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxDescriptions({
          cols: 2,
          items: [
            { label: "记录事件 ID", value: "ev-20261118-0930" },
            { label: "触发来源", value: K.lvxChip({ text: "🍅 番茄钟自动回写", tone: "energy" }) },
            { label: "心流韧性加成", value: "+2.4% (S级护盾)" },
            { label: "Daily Note 同步", value: K.lvxTag({ text: "✓ 已写入今日日记", tone: "success" }) },
          ],
        })
      );
        }
    },
    {
        id: 62,
        title: "62. \u4ee3\u7801\u4e0e\u5e38\u7528\u77ed\u8bed\u7247\u6bb5\u9884\u89c8\u5361 CodeBlock\uff08\u58a8\u9ed1\u4ee3\u7801\u53f0 + \u4e00\u952e\u590d\u5236\u56de\u6267\uff09",
        fn: "lvxCodeBlock({ title, lang, code, onCopy })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxCodeBlock({
          title: "CSS · 小驴雷切代码块沉浸式圆角片段",
          lang: "css",
          code: `.protyle-wysiwyg .code-block {\n  border-radius: var(--lvx-r-lg, 16px);\n  border: 1px solid var(--lvx-border);\n  box-shadow: var(--lvx-shadow-1);\n}`,
          onCopy: () => setLog("CodeBlock: 代码片段已复制至剪贴板"),
        })
      );
        }
    },
    {
        id: 63,
        title: "63. \u5e74\u5ea6\u6253\u5361\u4e0e\u590d\u4e60\u70ed\u529b\u56fe\u7f51\u683c Heatmap\uff08GitHub \u98ce\u683c 5 \u9636\u8d21\u732e\u683c \u00b7 \u53cc\u8272\u9636\uff09",
        fn: "lvxHeatmap({ weeks, tone: ",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxHeatmap({
          weeks: 16,
          tone: "brand",
          title: "📅 近 16 周习惯打卡与闪卡复习热力分布 (112 天)",
          onSelectCell: (w, d, lv) => setLog(`Heatmap 点击: 第 ${w + 1} 周 · 星期${["一", "二", "三", "四", "五", "六", "日"][d]} (强度 Lv.${lv})`),
        })
      );
        }
    },
    {
        id: 64,
        title: "64. \u95ea\u5361\u6b63\u53cd\u53cc\u9762\u7ffb\u8f6c\u95ee\u7b54\u5361 FlipCard\uff08Cloze \u6316\u7a7a\u906e\u7f69\u63ed\u793a + FSRS \u53c2\u6570\uff09",
        fn: "lvxFlipCard({ deck, question, clozeWord, answer, fsrsMeta, onFlip })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxFlipCard({
          deck: "🗂 分布式系统核心牌组",
          question: "在 Raft 共识算法中，避免多个 Follower 同时发起选举导致选票瓜分的核心机制是",
          clozeWord: "随机化选举超时 (Randomized Election Timeout, 150~300ms)",
          answer: "解析：通过为每个节点分配随机超时，绝大多数情况下只有一个节点率先超时成为 Candidate 并赢得多数派选票。",
          fsrsMeta: "FSRS-5 记忆参数 · Stability(S) = 18.4d · Difficulty(D) = 4.2 · Retrievability(R) = 94.6%",
          onFlip: (f) => setLog(`FlipCard 翻转状态: ${f ? "背面（答案已揭示）" : "正面（挖空遮罩）"}`),
        })
      );
        }
    },
    {
        id: 65,
        title: "65. \u8003\u8bd5\u9898\u53f7\u7b54\u9898\u5361\u77e9\u9635\u4e0e\u5012\u8ba1\u65f6\u5668 QuestionSheet\uff08\u56db\u6001\u65b9\u683c \u00b7 \u4e00\u952e\u8df3\u9898\uff09",
        fn: "lvxQuestionSheet({ total, current, doneList, flaggedList, timerText, onSelectQuestion })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxQuestionSheet({
          total: 16,
          current: 5,
          doneList: [1, 2, 3, 4, 6, 7],
          flaggedList: [3, 8],
          timerText: "42:18",
          onSelectQuestion: (q) => setLog(`QuestionSheet 跳转至第 ${q} 题`),
        })
      );
        }
    },
    {
        id: 66,
        title: "66. \u7ba1\u5bb6\u91cd\u590d\u6587\u6863\u53cc\u680f/\u884c\u5185 LCS \u5dee\u5f02\u5bf9\u6bd4\u5668 DiffView\uff08\u589e\u5220\u884c\u9ad8\u4eae + \u5b89\u5168\u56de\u6536\uff09",
        fn: "lvxDiffView({ leftTitle, rightTitle, similarity, lines, onKeepLeft, onRecycleRight })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxDiffView({
          leftTitle: "📄 2026-11-18 每日日记.sy",
          rightTitle: "📄 2026-11-18 每日日记_冲突副本.sy",
          similarity: "98.6%",
          lines: [
            { type: "same", text: "## 今日完成事项" },
            { type: "del", text: "- [ ] 晨间深读《认知天性》30 分钟" },
            { type: "add", text: "- [x] 晨间深读《认知天性》35 分钟（连胜 21 天达成）" },
            { type: "same", text: "- [x] 分布式系统闪卡复习 28 张" },
          ],
          onKeepLeft: () => setLog("DiffView: 保留主文档"),
          onRecycleRight: () => setLog("DiffView: 冲突副本已安全移入回收站"),
        })
      );
        }
    },
    {
        id: 67,
        title: "67. \u62fe\u9057\u4e94\u8272\u9ad8\u4eae\u6279\u6ce8\u5f15\u6587\u5361 HighlightCard\uff08\u5b9e\u65f6\u5207\u6362\u4fa7\u8fb9\u8272\u6807 + \u4e00\u952e\u8f6c\u95ea\u5361\uff09",
        fn: "lvxHighlightCard({ quote, note, source, color, onColorChange, onMakeCard })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxHighlightCard({
          source: "《认知天性：让学习轻而易举的心理学规律》· 第 2 章",
          quote: "检索练习（主动回忆）不仅能评估学习效果，其本身就是最强大的记忆巩固机制，远胜于反复划线重读。",
          note: "小驴闪卡与小驴考试的核心认知科学依据。",
          color: "amber",
          onColorChange: (c) => setLog(`HighlightCard 切换批注色标: ${c}`),
          onMakeCard: () => setLog("HighlightCard: 已提炼为属性问答闪卡"),
        })
      );
        }
    },
    {
        id: 68,
        title: "68. \u4eba\u8109 CRM \u6863\u6848\u540d\u7247\u4e0e A-Z \u7d22\u5f15\u6761 ContactCard\uff08\u8054\u7edc\u51b7\u5374\u9884\u8b66 + \u5feb\u901f\u8bb0\u4e92\u52a8\uff09",
        fn: "lvxContactCard({ name, role, org, tags, lastContactDays, letters, onSelectLetter })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxContactCard({
          letters: ["全部", "A", "C", "L", "S", "W", "Z"],
          activeLetter: "L",
          name: "林远舟",
          role: "分布式架构导师",
          org: "清华大学 · 知识图谱联合课题组",
          tags: ["🎓 学术导师", "⚡ 核心合作", "北京"],
          lastContactDays: 18,
          onSelectLetter: (lt) => setLog(`ContactCard 拼音索引筛选: ${lt}`),
          onLogContact: () => setLog("ContactCard: 已记录今日联络互动"),
        })
      );
        }
    },
    {
        id: 69,
        title: "69. \u5e38\u7528\u8bdd\u672f\u6a21\u677f\u5361 PhraseCard\uff08{{\u52a8\u6001\u53d8\u91cf}} \u80f6\u56ca\u9ad8\u4eae + \u5feb\u6377\u952e\u4e00\u952e\u4e0a\u5c4f\uff09",
        fn: "lvxPhraseCard({ title, category, template, shortcut, onPaste })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxPhraseCard({
          category: "📌 投研风控核查",
          title: "基金季度信息披露勾稽复核回执",
          shortcut: "Alt+1",
          template: "截至 {{date}}，已完成 {{fund_name}} 季度财务报表与估值表 7 大勾稽自检，剪贴板摘要：{{clipboard}}，全表零尾差。",
          onPaste: () => setLog("PhraseCard: 已渲染动态变量并一键粘贴上屏"),
        })
      );
        }
    },
    {
        id: 70,
        title: "70. \u96f7\u5207 CSS/JS \u7247\u6bb5\u5b9e\u65f6\u8c03\u6821\u6c99\u76d2 SnippetStudio\uff08\u53cc\u6ed1\u6746\u5b9e\u65f6\u9a71\u52a8\u9776\u5411\u9884\u89c8\uff09",
        fn: "lvxSnippetStudio({ snippetName, initialRadius, initialFontSize, onChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxSnippetStudio({
          snippetName: "DL2 柔雾紫阅读器圆角与字号实时调校",
          initialRadius: 16,
          initialFontSize: 14,
          onChange: (r, fz) => setLog(`SnippetStudio 实时调校: border-radius=${r}px, font-size=${fz}px`),
        })
      );
        }
    },
    {
        id: 71,
        title: "71. \u5c0f\u9a74\u7f57\u76d8 LaunchpadCard\uff08\u5f39\u51fa\u7f69 600 / \u5217\u8868 / \u4fa7\u680f 300 / \u9876\u680f\u4e0e\u60ac\u6d6e\u7403\uff09",
        fn: "lvxLaunchpadCard({ plugins, mode: ",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const plugins = [
        { id: "checkin", name: "小驴打卡", icon: K.lvIcon("checkin", { size: 20 }), desc: "习惯打卡 · 连击指数", badge: "15 待办", badgeTone: "energy", pinned: true },
        { id: "raikiri", name: "小驴雷切", icon: K.lvIcon("raikiri", { size: 20 }), desc: "分栏切换 · 选区暂存", badge: "已就绪", badgeTone: "success" },
        { id: "home", name: "小驴管家", icon: K.lvIcon("butler", { size: 20 }), desc: "事项归档 · 效期预警", badge: "1 到期", badgeTone: "danger", pinned: true },
        { id: "glean", name: "小驴拾遗", icon: K.lvIcon("glean", { size: 20 }), desc: "文章剪藏 · 智能分拣", badge: "112 未读", badgeTone: "brand" },
        { id: "exam", name: "小驴考试", icon: K.lvIcon("exam", { size: 20 }), desc: "题库刷题 · 错题特训", badge: "今日待测", badgeTone: "energy" },
        { id: "cards", name: "小驴闪卡", icon: K.lvIcon("cards", { size: 20 }), desc: "间隔复习 · 记忆曲线", badge: "31 待复习", badgeTone: "brand", pinned: true },
        { id: "contacts", name: "小驴人脉", icon: K.lvIcon("contacts", { size: 20 }), desc: "关系图谱 · 联络提醒", badge: "2 待联络", badgeTone: "energy" },
        { id: "common", name: "小驴常用", icon: K.lvIcon("common", { size: 20 }), desc: "常用片段 · 宏模版", badge: "已就绪", badgeTone: "success" },
      ];
      const host = document.createElement("div");
      const mount = (mode) => {
        host.innerHTML = "";
        host.appendChild(K.lvxLaunchpadCard({
          mode,
          plugins,
          unread: 3,
          activityCount: 12,
          onSelectPlugin: (id) => setLog(`罗盘聚焦插件: ${id}`),
          onTriggerAction: (pid, act) => setLog(`罗盘二级行动 [${pid}]: ${act}`),
          onQuickAction: (qid) => setLog(`极速工作台: ${qid}`),
          onToolbar: (id) => setLog(`罗盘工具栏: ${id}`),
          onJoinQq: () => setLog("已复制官方交流群号 871707735"),
        }));
      };
      stage.appendChild(K.lvxSegmented({
        size: "sm",
        options: [
          { value: "full", label: "弹出罩 600" },
          { value: "list", label: "列表视图" },
          { value: "dock", label: "侧栏 300" },
          { value: "mini", label: "顶栏 / 悬浮球" },
        ],
        value: "full",
        onChange: (v) => { mount(v); setLog(`罗盘形态: ${v}`); },
      }));
      stage.appendChild(host);
      mount("full");
        }
    },
    {
        id: 72,
        title: "72. LvAiRouter \u4e94\u7ea7\u7011\u5e03\u6d41\u901a\u9053\u72b6\u6001\u4e0e\u6d41\u5f0f\u601d\u8003\u5361 AiThinkingCard",
        fn: "lvxAiThinkingCard({ activeTier, thinkingText, tiers })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxAiThinkingCard({
          activeTier: "Tier 1 · 思源智能体 (240ms)",
          thinkingText: "AI 正在结合上下文生成苏格拉底式错题启发解析...",
          tiers: [
            { name: "Tier 1 · 思源原生 AI", status: "ok", latency: "240ms" },
            { name: "Tier 2 · 硅基流动 Qwen2.5", status: "ok", latency: "310ms" },
            { name: "Tier 3 · 本地 Ollama", status: "standby", latency: "离线就绪" },
            { name: "Tier 4 · 免密公用 (PII 脱敏)", status: "standby" },
            { name: "Tier 5 · 离线规则兜底", status: "fallback", latency: "0ms" },
          ],
        })
      );
        }
    },
    {
        id: 73,
        title: "73. \u5168\u751f\u6001\u8de8\u63d2\u4ef6\u4eca\u65e5\u52a8\u6001\u6d41\u4e0e 8 \u4ed3\u8054\u5408\u707e\u5907\u5361 ActivityStream",
        fn: "lvxActivityStream({ records, backupStatus, onExportBackup, onAppendDiary })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxActivityStream({
          backupStatus: "🛡️ 8 仓联合快照已就绪 (14.2MB)",
          records: [
            { plugin: "小驴打卡", time: "08:30", action: "完成「早起」习惯打卡", detail: "连续 21 天达成 · 心流韧性 96%", tone: "energy" },
            { plugin: "小驴闪卡", time: "09:15", action: "FSRS-5 间隔复习 28 张卡片", detail: "记忆留存率 94.6%", tone: "brand" },
            { plugin: "小驴拾遗", time: "10:40", action: "采集并提炼 3 条五色高亮批注", detail: "《认知天性》第二章", tone: "success" },
          ],
          onExportBackup: () => setLog("ActivityStream: 触发 8 仓联合灾备快照导出"),
          onAppendDiary: () => setLog("ActivityStream: 今日跨插件动态已追加至 Daily Note"),
        })
      );
        }
    },
    {
        id: 74,
        title: "74. \u56db\u7ea7\u6e10\u8fdb\u964d\u566a\u8de8\u63d2\u4ef6\u901a\u77e5\u6a2a\u5e45\u4e0e\u5206\u7c7b\u514d\u6270\u5361 ToastCard",
        fn: "lvxToastCard({ plugin, level, title, message, snoozeOptions, onSnooze, onAction })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxToastCard({
          plugin: "小驴闪卡",
          level: "L2",
          title: "14 张高优卡片已到达记忆奇点",
          message: "包含《分布式系统》牌组 8 张、《操作系统》6 张，预计仅需 4 分钟即可完成加固。",
          snoozeOptions: ["⏳ 延后 1 小时", "🌆 推迟至晚间 20:00", "🌙 今日同类免扰"],
          onSnooze: (s) => setLog(`ToastCard 触发分类免扰: ${s}`),
          onAction: () => setLog("ToastCard: 立即进入复习室"),
          onDismiss: () => setLog("ToastCard: 关闭通知"),
        })
      );
        }
    },
    {
        id: 75,
        title: "75. \u5757\u52a9\u624b\u80f6\u56ca\u89e6\u53d1\u5668\u4e0e\u81ea\u9002\u5e94\u5757\u64cd\u4f5c\u4e2d\u5fc3 BlockActionCard",
        fn: "lvxBlockActionCard({ blockType, blockId, excerpt, mode, actions, onTrigger })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxBlockActionCard({
          blockType: "段落块 (NodeParagraph)",
          blockId: "202611180930-k8m2p",
          mode: "focus",
          excerpt: "“在分布式系统中，Raft 通过领导者选举与日志复制两阶段保证强一致性状态机复制。”",
          actions: [
            { id: "qa", label: "一键转为属性问答卡", plugin: "小驴闪卡", icon: "⚡", tone: "brand" },
            { id: "cloze", label: "AI 提取核心概念挖空", plugin: "小驴闪卡", icon: "✨", tone: "energy" },
            { id: "exam", label: "加入专项模考题库", plugin: "小驴考试", icon: "🎓", tone: "success" },
            { id: "quote", label: "生成拾遗金句分享卡", plugin: "小驴拾遗", icon: "📑", tone: "brand" },
          ],
          onTrigger: (id) => setLog(`BlockActionCard 执行跨插件块动作: ${id}`),
        })
      );
        }
    },
    {
        id: 76,
        title: "76. \u9636\u68af\u6e10\u8fdb\u63ed\u6653\u5217\u8868\u5361 SequenceCard\uff08R55 \u9010\u7ea7\u56de\u5fc6 \u00b7 Space \u63a8\u8fdb\uff09",
        fn: "lvxSequenceCard({ title, steps, revealedCount, onStepChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxSequenceCard({
          title: "TCP 三次握手与状态机演进（阶梯渐进卡 R55）",
          revealedCount: 1,
          steps: [
            "客户端发送 SYN=1, seq=x，进入 SYN_SENT 同步已发送状态",
            "服务端回复 SYN=1, ACK=1, seq=y, ack=x+1，进入 SYN_RCVD 状态",
            "客户端发送 ACK=1, seq=x+1, ack=y+1，双方正式进入 ESTABLISHED 状态",
          ],
          onStepChange: (n) => setLog(`SequenceCard 当前已揭晓: ${n}/3 阶`),
        })
      );
        }
    },
    {
        id: 77,
        title: "77. FSRS-5 \u56db\u6863\u95f4\u9694\u91cd\u590d\u8bc4\u5206\u53f0 FsrsRatingBar\uff08\u9884\u6d4b\u95f4\u9694 + \u7a33\u5b9a\u6027\u589e\u91cf + \u952e\u5e3d\uff09",
        fn: "lvxFsrsRatingBar({ ratings, retention, onRate })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxFsrsRatingBar({
          retention: "📊 FSRS-5 实时预测 · 目标留存率 90% · 键盘 1 / 2 / 3 / 4 一键评分",
          onRate: (g) => setLog(`FsrsRatingBar 提交评分档位: Grade ${g}`),
        })
      );
        }
    },
    {
        id: 78,
        title: "78. \u5361\u5305\u5206\u7ea7\u6811\u4e0e\u65b0\u5b66/\u5b66\u4e60/\u590d\u4e60\u4e09\u8272\u5230\u671f\u8ba1\u6570\u5361 DeckTreeCard",
        fn: "lvxDeckTreeCard({ decks: [{ id, name, depth, newCount, learnCount, reviewCount, retention }], onStudy })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxDeckTreeCard({
          decks: [
            { id: "cs", name: "计算机科学核心体系", depth: 0, newCount: 12, learnCount: 6, reviewCount: 28, retention: "94%" },
            { id: "cs-dist", name: "分布式系统与共识算法", depth: 1, newCount: 8, learnCount: 4, reviewCount: 18, retention: "96%" },
            { id: "cs-os", name: "操作系统内核与虚拟内存", depth: 1, newCount: 4, learnCount: 2, reviewCount: 10, retention: "91%" },
          ],
          onStudy: (id) => setLog(`DeckTreeCard 启动牌组复习: ${id}`),
        })
      );
        }
    },
    {
        id: 79,
        title: "79. \u4e13\u6ce8\u756a\u8304\u949f\u5012\u8ba1\u65f6\u73af\u4e0e\u9876\u680f\u836f\u4e38\u5fae\u6761 PomodoroTimer",
        fn: "lvxPomodoroTimer({ habitName, presets, initialMinutes, whiteNoise, onStateChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxPomodoroTimer({
          habitName: "思阅精读《认知天性》",
          presets: [25, 45, 60],
          initialMinutes: 25,
          whiteNoise: "江南春雨白噪音",
          onStateChange: (run, m) => setLog(`PomodoroTimer 状态: ${run ? "专注运行中" : "已暂停/结算"} (${m}m)`),
        })
      );
        }
    },
    {
        id: 80,
        title: "80. \u8fde\u51fb\u6551\u8d4e\u8865\u5361\u793c\u5238\u4e0e\u65ad\u7b7e\u4fee\u590d\u5361 StreakRepairCard\uff08\u6253\u5b54\u7968\u6839\u8bbe\u8ba1\uff09",
        fn: "lvxStreakRepairCard({ habitName, missedDate, streakDays, ticketsLeft, onRedeem })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxStreakRepairCard({
          habitName: "早起 · 晨间心流",
          missedDate: "2026-11-17",
          streakDays: 21,
          ticketsLeft: 2,
          ticketsMax: 2,
          onRedeem: () => setLog("StreakRepairCard: 已核销 1 张补卡券，21 天连击无缝延续！"),
        })
      );
        }
    },
    {
        id: 81,
        title: "81. \u4e94\u7ef4\u6210\u5c31\u52cb\u7ae0\u89e3\u9501\u9648\u5217\u5899 AchievementWall\uff08\u5df2\u89e3\u9501\u6696\u6a58\u91d1\u8f89 vs \u5f85\u89e3\u9501\u51f9\u69fd\uff09",
        fn: "lvxAchievementWall({ badges: [{ id, icon, name, category, progress, unlocked }], onSelectBadge })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxAchievementWall({
          badges: [
            { id: "m1", icon: "🏆", name: "21天习惯破茧", category: "里程碑", progress: "21/21 天 · 已解锁", unlocked: true },
            { id: "m2", icon: "🛡️", name: "S级心流韧性", category: "一致性", progress: "韧性 96% · 已解锁", unlocked: true },
            { id: "m3", icon: "💭", name: "深度反思行者", category: "微反思", progress: "累计 30 篇 · 已解锁", unlocked: true },
            { id: "m4", icon: "👑", name: "百日筑基大师", category: "终极荣誉", progress: "进度 64/100 天", unlocked: false },
          ],
          onSelectBadge: (id) => setLog(`AchievementWall 查看勋章详情: ${id}`),
        })
      );
        }
    },
    {
        id: 82,
        title: "82. \u7ba1\u5bb6\u4eff\u751f Bento \u5012\u6570\u65e5\u3001\u519c\u5386\u8282\u6c14\u4e0e\u751f\u6d3b\u7efc\u5408\u6307\u6570\u770b\u677f BentoCountdownCard",
        fn: "lvxBentoCountdownCard({ eventTitle, daysLeft, targetDate, lunarText, solarTerm, weatherText, lifeIndexScore })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxBentoCountdownCard({
          eventTitle: "🚗 机动车商业保险续保截止",
          daysLeft: 2,
          targetDate: "2026-11-20",
          lunarText: "丙午年十月初十",
          solarTerm: "立冬 · 候水始冰",
          weatherText: "南京 16°C 晴朗",
          lifeIndexScore: 96,
          onOpenDetail: () => setLog("BentoCountdownCard: 打开证照续保详情台账"),
        })
      );
        }
    },
    {
        id: 83,
        title: "83. \u4eba\u8109\u53cc\u5411\u4eba\u60c5\u5f80\u6765\u4e0e\u4fe1\u8bfa\u4e92\u60e0\u5929\u5e73\u5361 ReciprocityLedger",
        fn: "lvxReciprocityLedger({ personName, givenTotal, receivedTotal, fulfillmentRate, onAddRecord })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxReciprocityLedger({
          personName: "林远舟",
          givenTotal: 1200,
          receivedTotal: 2000,
          fulfillmentRate: "100%",
          onAddRecord: () => setLog("ReciprocityLedger: 打开新增人情往来弹窗"),
        })
      );
        }
    },
    {
        id: 84,
        title: "84. \u4eba\u8109\u5feb\u901f\u8bb0\u4e92\u52a8\u52a8\u6001\u6846 QuickInteractionComposer\uff08\u6e20\u9053\u80f6\u56ca + \u8bdd\u9898\u6807\u7b7e + \u65e5\u8bb0\u540c\u6b65\uff09",
        fn: "lvxQuickInteractionComposer({ personName, channels, quickTags, syncDiary, onSubmit })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxQuickInteractionComposer({
          personName: "林远舟",
          syncDiary: true,
          onSubmit: (ch, note) => setLog(`QuickInteractionComposer 已保存 [${ch}]: "${note || "常规问候"}"`),
        })
      );
        }
    },
    {
        id: 85,
        title: "85. \u62fe\u9057\u6bcf\u65e5\u91cd\u6d6e\u4e0e\u788e\u7247\u6536\u4ef6\u7bb1\u56db\u52a8\u4f5c\u5206\u62e3\u5361 InboxTriageCard",
        fn: "lvxInboxTriageCard({ title, excerpt, domain, readTime, onTriage })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxInboxTriageCard({
          domain: "arxiv.org · 认知科学预印本",
          readTime: "6 分钟",
          title: "Spaced Repetition with Free Recall Outperforms Passive Review by 2.4x",
          excerpt: "实验表明：结合主动自由回忆与动态间隔排程的学习者，在 90 天延迟测试中的知识保留率达到 91.4%。",
          onTriage: (act) => setLog(`InboxTriageCard 执行分拣动作: ${act}`),
        })
      );
        }
    },
    {
        id: 86,
        title: "86. \u62fe\u9057 AI \u540c\u4e49\u6807\u7b7e\u7c07\u8bc6\u522b\u4e0e\u4e00\u952e\u5f52\u4e00\u5316\u5408\u5e76\u5361 TagMergeCard",
        fn: "lvxTagMergeCard({ clusterName, variants, primaryTag, onMerge })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxTagMergeCard({
          clusterName: "大语言模型与智能体 (点击标签切换主保留项)",
          primaryTag: "#LLM",
          variants: [
            { tag: "#LLM", count: 42 },
            { tag: "#大语言模型", count: 19 },
            { tag: "#AI大模型", count: 11 },
            { tag: "#LargeLanguageModel", count: 6 },
          ],
          onMerge: (target) => setLog(`TagMergeCard 已将 78 篇文档的同义标签统一归并为: ${target}`),
        })
      );
        }
    },
    {
        id: 87,
        title: "87. \u8003\u8bd5\u8003\u70b9\u638c\u63e1\u5ea6\u4e0e\u4eba\u8109\u793e\u4ea4\u8d44\u672c SVG \u591a\u7ef4\u96f7\u8fbe\u56fe RadarChartCard",
        fn: "lvxRadarChartCard({ title, dimensions: [{ label, score }], tone, diagnosis })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxRadarChartCard({
          title: "计算机统考 408 · 五维考点掌握度与 CBM 盲区雷达",
          tone: "brand",
          dimensions: [
            { label: "数据结构", score: 94 },
            { label: "计算机组成", score: 82 },
            { label: "操作系统", score: 91 },
            { label: "计算机网络", score: 74 },
            { label: "跨科综合", score: 88 },
          ],
          diagnosis: "检测到「计算机网络 · BGP 路由选路与拥塞控制」存在高自信误判信号，建议生成 5 道 AI 变式题靶向消解。",
        })
      );
        }
    },
    {
        id: 88,
        title: "88. \u8003\u8bd5\u9519\u9898\u672c\u9519\u56e0\u5f52\u7c7b\u4e0e\u827e\u5bbe\u6d69\u65af\u6d88\u89e3\u9636\u68af\u5361 WrongQuestionCard",
        fn: "lvxWrongQuestionCard({ question, myAnswer, rightAnswer, reason, ladderStep, stubborn, onReasonChange, onDrill })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxWrongQuestionCard({
          question: "【统考真题】在页式虚拟存储管理中，若页面较小且进程频繁发生缺页中断，最可能引发的系统异常现象是？",
          myAnswer: "A. 内部碎片激增 (Internal Fragmentation)",
          rightAnswer: "B. 抖动/颠簸现象 (Thrashing · CPU 利用率骤降)",
          reason: "掉坑",
          ladderStep: 2,
          stubborn: true,
          onReasonChange: (r) => setLog(`WrongQuestionCard 切换错因归类: ${r}`),
          onDrill: () => setLog("WrongQuestionCard: 已唤醒 LvAiRouter 生成 3 道同类变式特训题"),
        })
      );
        }
    },
    {
        id: 89,
        title: "89. \u5e38\u7528\u52a8\u6001\u53d8\u91cf\u586b\u5145\u4e0e\u5b9e\u65f6\u5c55\u5f00\u9884\u89c8\u6c99\u76d2 VariableFormCard",
        fn: "lvxVariableFormCard({ templateName, rawTemplate, vars, onInsert })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxVariableFormCard({
          templateName: "在管基金季度信息披露勾稽复核回执",
          rawTemplate: "您好，截至 {{date}}，已完成【{{fund}}】第 {{quarter}} 季度资产负债表、利润表与估值表跨表 7 大勾稽核查，结论：{{result}}。",
          vars: [
            { key: "date", label: "复核日期", defaultValue: "2026-11-18" },
            { key: "fund", label: "基金简称", defaultValue: "金雨茂物成长三期" },
            { key: "quarter", label: "所属季度", defaultValue: "2026 Q3" },
            { key: "result", label: "核查结论", defaultValue: "全表零尾差通过" },
          ],
          onInsert: (txt) => setLog(`VariableFormCard 一键上屏: "${txt.slice(0, 36)}..."`),
        })
      );
        }
    },
    {
        id: 90,
        title: "90. \u5e38\u7528\u8fde\u73af\u53d6\u7528\u62fc\u677f\u4e0e\u96f7\u5207\u914d\u7f6e\u5305\u52fe\u9009\u53f0 PinboardCard\uff08\u987a\u6b21\u70b9\u51fb\u53d8\u7eff \u2713\uff09",
        fn: "lvxPinboardCard({ title, items: [{ id, label, snippet, tag }], onCopyItem })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxPinboardCard({
          title: "连环取用拼板 (Paste Pinboard · 顺次点击卡片体验连环复制变绿)",
          items: [
            { id: "pb-1", label: "1. 投研报告一级标题模板", snippet: "# 一、本季度宏观环境与基金运作综述", tag: "Alt+1" },
            { id: "pb-2", label: "2. 估值表净值勾稽声明", snippet: "经核对，期末单位净值与托管行复核一致。", tag: "Alt+2" },
            { id: "pb-3", label: "3. 风险提示标准免责尾注", snippet: "本报告仅供合格投资者参阅，不构成收益承诺。", tag: "Alt+3" },
            { id: "pb-4", label: "4. 思源块引用双向锚点", snippet: "((202611180930-audit 'Q3底稿台账'))", tag: "Alt+4" },
          ],
          onCopyItem: (id, cnt) => setLog(`PinboardCard 已取用 [${id}] · 当前连环进度: ${cnt}/4`),
        })
      );
        }
    },
    {
        id: 91,
        title: "91. \u5168\u751f\u6001\u7edf\u4e00\u591a\u5f62\u6001\u8bbe\u7f6e\u4e2d\u5fc3\u9aa8\u67b6 SettingsShell\uff08\u5de6\u8f68\u5927\u7a97 / \u9876\u680f\u80f6\u56ca / \u4fa7\u680f\u7a84\u575e\u4e09\u5c3a\u5bf8 + \u5b57\u6bb5\u641c\u7d22 + \u4e8c\u6b65\u6062\u590d\u9ed8\u8ba4\uff09",
        fn: "lvxSettingsShell({ pluginName, layout: ",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxSettingsShell({
          pluginName: "小驴全生态与单仓通用",
          layout: "sidebar",
          categories: [
            {
              id: "appearance",
              label: "外观与动效",
              icon: "✨",
              items: [
                { title: "动效总档 (effectLevel)", desc: "控制微交互弹性、撒花与呼吸流光等级", type: "select", value: "完整动效 (full)", options: ["完整动效 (full)", "精简动效 (minimal)", "关闭动效 (off)"] },
                { title: "吉祥物「小驴」常驻陪伴", desc: "在空态、引导卡与庆祝横幅中展示矢量小驴", type: "switch", value: true },
                { title: "弹窗与面板缩放比例", desc: "适配高分屏或小尺寸笔记本视口", type: "range", value: 85, unit: "%" },
              ],
            },
            {
              id: "topbar",
              label: "顶栏与罗盘",
              icon: "🧭",
              items: [
                { title: "顶栏图标自动收敛入坞", desc: "仅保留小驴罗盘总入口，防止思源顶栏拥挤跳动", type: "switch", value: true },
                { title: "移动端罗盘入口形态", desc: "支持顶栏按钮与贴边悬浮球双模协同", type: "select", value: "顶栏+悬浮球双开", options: ["顶栏+悬浮球双开", "仅贴边悬浮球", "仅顶栏图标"] },
              ],
            },
            {
              id: "sync",
              label: "写入与防冲突",
              icon: "🛡️",
              items: [
                { title: "内核写锁排队保护 (withDocLock)", desc: "按 docId 串行化写入，杜绝 document is locked", type: "switch", value: true },
                { title: "自动快照保留份数", desc: "每日首启自动生成增量备份快照", type: "range", value: 30, unit: "份" },
              ],
            },
          ],
          onSave: () => setLog("SettingsShell: 设置更改已持久化落盘"),
          onResetDefaults: () => setLog("SettingsShell: 当前分类已恢复出厂默认值"),
        })
      );
        }
    },
    {
        id: 92,
        title: "92. \u590d\u5408\u8bbe\u7f6e\u63a7\u4ef6\u884c\u4e0e\u6a21\u5757\u72b6\u6001\u5361\u77e9\u9635 SettingRow\uff08\u53cc\u7ed1\u6ed1\u5757\u6570\u5b57\u6846 / \u6a21\u5757\u5f00\u5173\u5361 / \u5371\u9669\u533a + SM/MD/LG \u4e09\u5c3a\u5bf8\uff09",
        fn: "lvxSettingRow({ size: ",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxSettingRow({
          size: "md",
          rows: [
            { id: "r-clip", title: "剪贴板与快切历史保留上限", desc: "拖动滑块或直接输入精确数值，双向 0 延迟同步", badge: "双向绑定", badgeTone: "brand", kind: "range-number", value: 80, unit: "条" },
            { id: "r-bam", title: "Protyle 块动作胶囊中心 (Block Action Center)", desc: "在段落块右上角渲染 0.5ms 极速跨插件制卡/摘录胶囊", badge: "R55 就绪", badgeTone: "success", kind: "module", value: true },
            { id: "r-danger", title: "清空复习流水账本与统计缓存 (Revlog)", desc: "执行清空前将自动导出 .json 备份包至思源资源库，确保零数据丢失", badge: "危险操作区", badgeTone: "danger", kind: "danger" },
          ],
          onChange: (id, val) => setLog(`SettingRow [${id}] 变更: ${val}`),
        })
      );
        }
    },
    {
        id: 93,
        title: "93. \u4ea4\u4e92\u5f0f\u5feb\u6377\u952e\u5f55\u5236\u5668\u4e0e\u8de8\u5e73\u53f0\u952e\u5e3d\u51b2\u7a81\u68c0\u6d4b\u53f0 HotkeyRecorder",
        fn: "lvxHotkeyRecorder({ platform: ",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxHotkeyRecorder({
          platform: "win",
          bindings: [
            { id: "hk-compass", label: "全局呼出小驴罗盘指挥坞", keys: "Alt+L" },
            { id: "hk-checkin", label: "打开打卡极速录入面板", keys: "Alt+Shift+C", conflictWith: "思源全局复制块引用" },
            { id: "hk-qnote", label: "罗盘内一键记事直达", keys: "Ctrl+Shift+N" },
          ],
          onBindChange: (id, k) => setLog(`HotkeyRecorder 已更新 [${id}] 绑定并解除冲突: ${k}`),
        })
      );
        }
    },
    {
        id: 94,
        title: "94. AI \u4e94\u7ea7\u81ea\u9002\u5e94\u7011\u5e03\u6d41\u8c03\u5ea6\u4e2d\u67a2\u4e0e\u5382\u5546\u8d60\u989d\u914d\u7f6e\u5361 AiRouterHub",
        fn: "lvxAiRouterHub({ tiers, vendors, budgetCap, onSelectVendor, onProbeAll })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxAiRouterHub({
          budgetCap: 20,
          tiers: [
            { id: "t1", tier: "Tier 1 · 首选", name: "思源内置智能体", latency: "210ms", status: "ready" },
            { id: "t2", tier: "Tier 2 · 商用", name: "自配 API Key", latency: "280ms", status: "ready" },
            { id: "t3", tier: "Tier 3 · 本地", name: "本地 Ollama", latency: "待命", status: "standby" },
            { id: "t4", tier: "Tier 4 · 公益", name: "免密公用池 (脱敏)", latency: "420ms", status: "standby" },
            { id: "t5", tier: "Tier 5 · 兜底", name: "离线规则引擎", latency: "0ms", status: "ready" },
          ],
          onSelectVendor: (v, m) => setLog(`AiRouterHub 一键填入厂商配置: ${v} (${m})`),
          onProbeAll: () => setLog("AiRouterHub: 已发起 Tier 1 ~ Tier 5 全链路并发延迟测速"),
        })
      );
        }
    },
    {
        id: 95,
        title: "95. \u5168\u751f\u6001\u4e0e\u5355\u4ed3\u6570\u636e\u707e\u5907\u3001\u81ea\u52a8\u5feb\u7167\u56de\u6eda\u4e0e\u591a\u683c\u5f0f\u8131\u654f\u5bfc\u51fa\u53f0 BackupMatrixCard",
        fn: "lvxBackupMatrixCard({ snapshots, formats, onRestoreSnapshot, onExportFormat })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxBackupMatrixCard({
          snapshots: [
            { id: "snap-1", time: "2026-11-18 09:00 (今日首启自动快照)", size: "14.2 MB", pluginsCount: 8 },
            { id: "snap-2", time: "2026-11-17 22:30 (睡前日报归档前快照)", size: "13.9 MB", pluginsCount: 8 },
          ],
          onRestoreSnapshot: (id) => setLog(`BackupMatrixCard 预览 Diff 并回滚快照: ${id}`),
          onExportFormat: (fmt, san) => setLog(`BackupMatrixCard 导出 [${fmt}] (隐私脱敏=${san})`),
        })
      );
        }
    },
    {
        id: 96,
        title: "96. \u5c0f\u9a74\u7f57\u76d8 \u00b7 \u53f6\u5f52 LifeLog \u4e0e\u4e00\u952e\u8bb0\u4e8b\u6781\u901f\u5de5\u4f5c\u53f0 QuickCaptureModal",
        fn: "lvxQuickCaptureModal({ mode, categories, recentEntry, onSubmit, onUndoLast })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxQuickCaptureModal({
          mode: "lifelog",
          onSubmit: (p) => setLog(`QuickCaptureModal 写入 [${p.target}] (${p.offset} ${p.category}): "${p.text}"`),
          onUndoLast: () => setLog("QuickCaptureModal: 已调用 deleteBlock 精准撤销上一条日记写入块"),
        })
      );
        }
    },
    {
        id: 97,
        title: "97. \u5c0f\u9a74\u7f57\u76d8 \u00b7 \u901a\u77e5\u4e2d\u5fc3\u5386\u53f2\u6536\u4ef6\u7bb1\u4e0e\u514d\u6253\u6270\u5206\u7c7b\u89e3\u5c01\u53f0 NoticeInbox",
        fn: "lvxNoticeInbox({ notices, mutedCategories, onDiagnose, onUnmute })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxNoticeInbox({
          notices: [
            { id: "n1", plugin: "小驴闪卡", title: "31 张到期卡片待复习（分布式系统 18 张）", time: "10 分钟前", level: "info", repeat: 3, unread: true },
            { id: "n2", plugin: "小驴管家", title: "机动车商业险将于 2 天后到期，请及时核对续保保单", time: "1 小时前", level: "warn", unread: true },
            { id: "n3", plugin: "思源原生收拢", title: "已完成全库索引增量同步，0 冲突块", time: "今日 08:30", level: "success", unread: false },
          ],
          onDiagnose: () => setLog("NoticeInbox: 已生成全生态健康与错误环形缓冲诊断报告并复制至剪贴板"),
          onUnmute: (cat) => setLog(`NoticeInbox 已解除分类免打扰并同步磁盘 JSON: ${cat}`),
        })
      );
        }
    },
    {
        id: 98,
        title: "98. \u5168\u601d\u6e90\u6587\u6863\u67e5\u91cd\u4e0e\u540c\u6b65\u51b2\u7a81\u5bf9\u8d26\u6cbb\u7406\u5de5\u4f5c\u53f0 ConflictReconcileCard",
        fn: "lvxConflictReconcileCard({ healthScore, stats, conflictTitle, leftBlocks, rightBlocks, onResolve })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxConflictReconcileCard({
          healthScore: 94,
          stats: [
            { label: "同名文档组", count: 2, tone: "brand" },
            { label: "0字空壳文档", count: 3, tone: "energy" },
            { label: "同步冲突副本", count: 1, tone: "danger" },
            { label: "孤立日记", count: 0, tone: "success" },
          ],
          conflictTitle: "2026-11-18 每日日记",
          leftBlocks: [
            "08:30 🌅 早起打卡 · 连续 21 天达成",
            "09:15 🗂 闪卡复习 · 完成 28 张 FSRS 巩固",
          ],
          rightBlocks: [
            "08:30 🌅 早起打卡 · 连续 21 天达成",
            "09:15 🗂 闪卡复习 · 完成 28 张 FSRS 巩固",
            "+ 21:40 🌱 LifeLog · 晚间慢跑 5 公里（仅在冲突副本中存在）",
          ],
          onResolve: (st) => setLog(`ConflictReconcileCard 执行治理策略: ${st}`),
        })
      );
        }
    },
    {
        id: 99,
        title: "99. \u8de8\u7aef\u8d34\u8fb9\u60ac\u6d6e\u7403\u4e0e\u56db\u5411\u5212\u52a8\u624b\u52bf\u8f6e\u76d8 FloatingBallPod\uff08\u56db\u5411\u6247\u533a / \u8d34\u8fb9\u5438\u9644 / \u95f2\u7f6e\u534a\u9690 / \u9876\u680f\u80f6\u56ca\u56db\u6001\uff09",
        fn: "lvxFloatingBallPod({ state: ",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxFloatingBallPod({
          state: "wheel",
          onTriggerDir: (dir, label) => setLog(`FloatingBallPod 触发 [${dir}] 手势动作: ${label}`),
        })
      );
        }
    },
    {
        id: 100,
        title: "100. \u601d\u6e90\u6587\u6863\u9875\u5185\u5d4c\u4e0a\u4e0b\u6587\u6761\u4e0e\u79fb\u52a8\u7aef\u5e95\u90e8\u62c7\u6307\u9605\u8bfb\u680f ProtyleContextStrip\uff08\u4e09\u4f4d\u7f6e\u5f62\u6001\u5207\u6362\uff09",
        fn: "lvxProtyleContextStrip({ variant: ",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxProtyleContextStrip({
          variant: "person-strip",
          personName: "林远舟",
          orgTitle: "🏛️ 清华大学知识图谱课题组 · 分布式架构导师",
          progress: 68,
          onAction: (act) => setLog(`ProtyleContextStrip 触发文档内动作: ${act}`),
        })
      );
        }
    },
    {
        id: 101,
        title: "101. \u56fe\u50cf\u906e\u6321\u5236\u5361\u4e0e\u8003\u9898\u753b\u5e03\u5de5\u4f5c\u5ba4 OcclusionStudio\uff08\u70b9\u51fb\u5f69\u8272\u906e\u7f69\u63ed\u6653\u7b54\u6848 \u00b7 \u53cc\u906e\u6321\u6a21\u5f0f\uff09",
        fn: "lvxOcclusionStudio({ imageTitle, mode: ",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxOcclusionStudio({
          imageTitle: "Raft 共识节点三态转换图",
          mode: "hide-all-guess-one",
          masks: [
            { id: "m-follower", label: "Follower (追随者)", x: 6, y: 18, w: 26, h: 32, revealed: false },
            { id: "m-candidate", label: "Candidate (候选人)", x: 38, y: 52, w: 28, h: 32, revealed: false },
            { id: "m-leader", label: "Leader (领导者)", x: 68, y: 18, w: 26, h: 32, revealed: true },
          ],
          onToggleMask: (id, rev) => setLog(`OcclusionStudio 遮罩 [${id}] 状态: ${rev ? "已揭晓" : "已遮挡"}`),
        })
      );
        }
    },
    {
        id: 102,
        title: "102. \u591a\u753b\u5e45\u6bd4\u4f8b\u91d1\u53e5\u6d77\u62a5\u4e0e\u7247\u6bb5\u5206\u4eab\u5361\u751f\u6210\u5668 ShareQuoteStudio\uff081:1 \u65b9\u5361 / 16:9 \u6a2a\u5361 / 9:16 \u6d77\u62a5 \u00d7 \u4e09\u5957\u5e95\u7eb9\uff09",
        fn: "lvxShareQuoteStudio({ quote, author, sourceDoc, ratio: ",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxShareQuoteStudio({
          quote: "主动检索不仅能评估学习效果，其本身就是最强大的记忆重塑机制，远胜于十遍被动划线重读。",
          author: "亨利·罗迪格 (Henry L. Roediger)",
          sourceDoc: "认知天性：让学习轻而易举的心理学规律",
          ratio: "16:9",
          theme: "brand",
          onExportPng: (r, t) => setLog(`ShareQuoteStudio 已导出 [${r} · ${t}] 高清 PNG 卡片`),
        })
      );
        }
    },
    {
        id: 103,
        title: "103. \u8f7b\u91cf\u6c14\u6ce1\u4e8c\u6b21\u786e\u8ba4\u6846 Popconfirm\uff08\u5bf9\u6807 Ant Design 5 / Semi Design \u00b7 \u514d\u5168\u5c4f\u906e\u7f69\u5c31\u5730\u786e\u8ba4\uff09",
        fn: "lvxPopconfirm({ title, desc, triggerLabel, tone, onConfirm, onCancel })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxPopconfirm({
          title: "确认归档并移除该习惯卡片？",
          desc: "移除后不再每日提醒，已写入思源 Daily Note 的历史打卡记录完好保留。",
          triggerLabel: "🗑️ 移除习惯卡片",
          confirmLabel: "确认移除",
          tone: "danger",
          defaultOpen: true,
          onConfirm: () => setLog("Popconfirm: 用户已确认执行危险操作"),
          onCancel: () => setLog("Popconfirm: 已取消操作"),
        })
      );
        }
    },
    {
        id: 104,
        title: "104. \u5bcc\u6587\u672c\u9ad8\u4eae\u5f15\u8ff0\u4e0e\u53ef\u6298\u53e0\u63d0\u793a\u5757 Callout\uff08\u5bf9\u6807 Notion / Mintlify / Linear\uff09",
        fn: "lvxCallout({ title, body, tone, icon, collapsible, actions })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxCallout({
          icon: "✨ AI 认知处方 Callout",
          title: "检测到《分布式系统》牌组存在 4 张「水蛭卡 (Leech Cards)」",
          body: "这 4 张卡片累计遗忘超过 5 次，建议将其拆解为更小粒度的阶梯序列卡 (R55)，或生成苏格拉底式启发助记词。",
          tone: "brand",
          collapsible: true,
          defaultExpanded: true,
          actions: [
            { label: "🪜 一键拆解为阶梯卡", onClick: () => setLog("Callout: 已将 4 张水蛭卡拆解为阶梯卡") },
            { label: "🤖 生成助记口诀", onClick: () => setLog("Callout: 已生成 AI 助记口诀") },
          ],
        })
      );
        }
    },
    {
        id: 105,
        title: "105. \u56fe\u6807\u4e0e\u5feb\u6377\u952e\u591a\u9009\u5de5\u5177\u680f\u7ec4 ToggleGroup\uff08\u5bf9\u6807 Radix UI / shadcn/ui\uff09",
        fn: "lvxToggleGroup({ multiple, items: [{ id, label, kbd, active }], onChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxToggleGroup({
          multiple: true,
          items: [
            { id: "cloze", label: "🔲 挖空遮罩", kbd: "⌘E", active: true },
            { id: "bold", label: "𝐁 重点加粗", kbd: "⌘B", active: true },
            { id: "math", label: "∑ LaTeX 公式", kbd: "⌘M", active: false },
            { id: "audio", label: "🔊 TTS 发音", kbd: "⌘P", active: false },
          ],
          onChange: (ids) => setLog(`ToggleGroup 当前激活工具: [${ids.join(", ")}]`),
        })
      );
        }
    },
    {
        id: 106,
        title: "106. \u53cc\u680f\u7a7f\u68ad\u6846\u9009\u62e9\u5668 Transfer\uff08\u5bf9\u6807 Ant Design 5 / Semi Design \u00b7 \u7ec4\u5377\u9009\u9898/\u8de8\u5305\u62bd\u5361/\u5bfc\u51fa\u52fe\u9009\uff09",
        fn: "lvxTransfer({ sourceTitle, targetTitle, items, onChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxTransfer({
          sourceTitle: "📥 候选考点题库池 (点击移入)",
          targetTitle: "🎯 本次模考已选考点 (点击移除)",
          items: [
            { id: "t-raft", label: "1. Raft 领导者选举与日志复制", selected: true },
            { id: "t-tcp", label: "2. TCP 拥塞控制与快重传机制", selected: true },
            { id: "t-vm", label: "3. 页式虚拟存储与缺页抖动", selected: false },
            { id: "t-bplus", label: "4. InnoDB B+ 树索引与聚簇分裂", selected: false },
            { id: "t-mvcc", label: "5. 事务隔离级别与 MVCC 快照读", selected: false },
          ],
          onChange: (ids) => setLog(`Transfer 已选目标集更新 (${ids.length} 项): [${ids.join(", ")}]`),
        })
      );
        }
    },
    {
        id: 107,
        title: "107. \u9632\u622a\u5c4f\u659c\u5411\u77e9\u9635\u6c34\u5370\u4fdd\u62a4\u5bb9\u5668 WatermarkCard\uff08\u5bf9\u6807 Ant Design 5 Watermark\uff09",
        fn: "lvxWatermarkCard({ watermarkText, title, content, dense })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxWatermarkCard({
          title: "家庭核心保单与证照编号台账（防截屏水印保护）",
          watermarkText: "🐴 小驴管家 · 仅限本机查阅",
          content: "【商业车险保单号】PICC-2026-8891042 · 【不动产权证】苏(2026)宁不动产权第 0041928 号 · 【硬件序列号】C02Z91LMD6R · 本地加密存储已开启。",
          dense: false,
        })
      );
        }
    },
    {
        id: 108,
        title: "108. \u53ef\u8c03\u6bd4\u4f8b\u53cc\u680f\u5206\u5272\u9762\u677f ResizableSplit\uff08\u5bf9\u6807 shadcn/ui & VS Code ResizablePanelGroup\uff09",
        fn: "lvxResizableSplit({ leftTitle, leftBody, rightTitle, rightBody, initialRatio, onRatioChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxResizableSplit({
          leftTitle: "📖 左侧：思源原文章节渐进阅读区",
          leftBody: "在阅读长文或学术论文时，可将左栏调宽至 70% 沉浸精读；进入密集制卡阶段时一键切换为 30:70 让右侧制卡工作台获得最大视野。",
          rightTitle: "🃏 右侧：小驴闪卡 & 拾遗批注联动工作台",
          rightBody: "实时同步左侧选中段落，自动提取 {{c1::核心概念挖空}} 与属性问答卡，零延迟双向锚定。",
          initialRatio: 50,
          onRatioChange: (pct) => setLog(`ResizableSplit 左右分栏比例调整为: ${pct}% : ${100 - pct}%`),
        })
      );
        }
    },
    {
        id: 109,
        title: "109. \u5212\u8bcd\u9009\u533a\u4e0e\u4e94\u8272\u6279\u6ce8\u60ac\u6d6e\u5de5\u5177\u6761 SelectionFloatBar\uff08\u62fe\u9057 / \u95ea\u5361 / \u4eba\u8109\u540c\u6e90\uff09",
        fn: "lvxSelectionFloatBar({ colors, activeColor, actions, onSelectColor, onAction })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxSelectionFloatBar({
          activeColor: "#f59e0b",
          onSelectColor: (c) => setLog(`SelectionFloatBar 选择批注颜色: ${c}`),
          onAction: (act) => setLog(`SelectionFloatBar 触发动作: ${act}`),
        })
      );
        }
    },
    {
        id: 110,
        title: "110. \u5e95\u90e8\u591a\u9009\u60ac\u6d6e\u6279\u91cf\u63a7\u5236\u53f0 BatchActionBar\uff08\u8003\u8bd5 / \u62fe\u9057 / \u4eba\u8109 / \u7ba1\u5bb6\u6279\u91cf\u6761\uff09",
        fn: "lvxBatchActionBar({ selectedCount, totalCount, actions, onSelectAll, onClear, onAction })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxBatchActionBar({
          selectedCount: 8,
          totalCount: 42,
          onSelectAll: () => setLog("BatchActionBar: 已全选 42 项"),
          onClear: () => setLog("BatchActionBar: 已清空已选项"),
          onAction: (a) => setLog(`BatchActionBar 触发批量动作: ${a}`),
        })
      );
        }
    },
    {
        id: 111,
        title: "111. \u6253\u5361\u4e0e\u4e8b\u9879\u5fae\u53cd\u601d\u6c89\u6d78\u5f39\u7a97 MicroReflectionModal\uff08\u6253\u5361 / \u7ba1\u5bb6\u5fc3\u5f97\u56de\u6267\u540c\u6e90\uff09",
        fn: "lvxMicroReflectionModal({ habitName, defaultMood, tags, onSave, onClose })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxMicroReflectionModal({
          habitName: "晨间深度阅读《认知天性》",
          tags: ["#心流心境", "#突破阻力", "#微习惯迭代"],
          onSave: (d) => setLog(`MicroReflectionModal: 反思已保存 (心情=${d.mood}, 写入日记=${d.appendDiary})`),
          onClose: () => setLog("MicroReflectionModal: 稍后记录"),
        })
      );
        }
    },
    {
        id: 112,
        title: "112. \u590d\u6742\u4efb\u52a1\u5fae\u5206\u89e3\u5411\u5bfc\u5361 TaskDecompositionCard\uff08\u7ba1\u5bb6 / \u8003\u8bd5 / \u5e38\u7528\u9636\u68af\u5206\u89e3\u540c\u6e90\uff09",
        fn: "lvxTaskDecompositionCard({ taskName, steps, onToggleStep, onAddStep, onSyncTodo })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxTaskDecompositionCard({
          taskName: "撰写金雨茂物成长三期 Q4 报告初稿",
          steps: [
            { id: "s1", title: "导出估值表与银行余额对账单 (全表零尾差核验)", minutes: 15, done: true },
            { id: "s2", title: "填报 7 大跨表勾稽自检表并标记预警红点", minutes: 20, done: false },
            { id: "s3", title: "替换重点在管项目运营简报段落", minutes: 25, done: false },
            { id: "s4", title: "生成 PDF 并脱敏导出发送复核", minutes: 10, done: false },
          ],
          onToggleStep: (id, done) => setLog(`TaskDecompositionCard 步骤 ${id}: ${done ? "已完成" : "未完成"}`),
          onSyncTodo: () => setLog("TaskDecompositionCard: 已一键推入今日待办池"),
        })
      );
        }
    },
    {
        id: 113,
        title: "113. \u5237\u9898\u4e0e\u590d\u76d8\u5168\u666f\u6218\u62a5\u7ed3\u7b97\u5361 SessionReportCard\uff08\u8003\u8bd5 / \u6253\u5361 / \u95ea\u5361\u6218\u7ee9\u770b\u677f\uff09",
        fn: "lvxSessionReportCard({ title, score, accuracy, duration, deltaText, onAppendDiary, onShare })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxSessionReportCard({
          title: "智能组卷特训 · 高等数学期末真题模拟战报",
          subtitle: "已完成 24/24 题 · 顽固错题消解 3 道",
          score: 96,
          accuracy: "92.5%",
          duration: "14m 20s",
          deltaText: "🔥 创本周最快解题记录",
          onAppendDiary: () => setLog("SessionReportCard: 战报已写入今日日记"),
          onShare: () => setLog("SessionReportCard: 已生成战报分享高清海报"),
          onRetry: () => setLog("SessionReportCard: 启动新一轮错题强化"),
        })
      );
        }
    },
    {
        id: 114,
        title: "114. \u601d\u6e90 Protyle \u5757\u6807\u6269\u5c55\u52a8\u4f5c\u83dc\u5355 BlockContextMenu\uff08\u95ea\u5361 / \u7ba1\u5bb6 / \u62fe\u9057\u5757\u7ea7\u53f3\u952e\u540c\u6e90\uff09",
        fn: "lvxBlockContextMenu({ blockType, blockId, groups, onSelect })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxBlockContextMenu({
          blockType: "标题块 H2",
          blockId: "20261118-881a-9421",
          groups: [
            {
              title: "⚡ 小驴生态快捷操作",
              items: [
                { id: "card", label: "提炼闪卡问答对", icon: "🃏", kbd: "⌥ C" },
                { id: "todo", label: "加入今日习惯待办", icon: "☑️", kbd: "⌥ T" },
                { id: "home", label: "归档入管家备忘", icon: "🧭" },
                { id: "contact", label: "关联人脉互动", icon: "👤", kbd: "⌥ P" },
              ],
            },
            {
              title: "🎨 样式与切片工具",
              items: [
                { id: "clip", label: "选区存入暂存栈", icon: "📋", kbd: "⌥ S" },
                { id: "quote", label: "导出金句海报", icon: "✨" },
              ],
            },
          ],
          onSelect: (id) => setLog(`BlockContextMenu 选中动作: ${id}`),
        })
      );
        }
    },
    {
        id: 115,
        title: "115. Ghostreader \u884c\u5185\u4f34\u8bfb AI \u8ffd\u95ee\u4e0e\u9ad8\u4eae\u5927\u7eb2\u6811 GhostreaderPanel\uff08\u62fe\u9057\u6700\u65b0\u6f14\u8fdb\uff09",
        fn: "lvxGhostreaderPanel({ selectedText, activeAction, answer, evidence, outline, onAction, onInsertCallout })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxGhostreaderPanel({
          selectedText: "对 n 阶方阵 A，A 可逆 ⇔ det(A) ≠ 0 ⇔ rank(A) = n。每一列都不为零，并不能保证各列线性无关。",
          activeAction: "explain",
          answer: "✨ 用人话解释：把矩阵的“列”比作支撑屋顶的柱子。虽然每根柱子都不是空的（非零向量），但如果两根柱子完全平行重合、或者其中一根柱子完全由其他几根拼凑得出（线性相关），屋顶依然会塌下来（矩阵不可逆）。判断稳固性不能只看单根柱子，必须核算整体的“秩”。",
          evidence: ["《线性代数与拓扑解析》第三章第 12 页", "思源块锚点 20261118-881a"],
          outline: [
            { heading: "一、可逆矩阵的充分必要条件", items: [{ text: "det(A) ≠ 0 且 rank(A) = n 判定法则", color: "yellow" }, { text: "反例：全非零列但秩亏损的方阵构造", color: "red" }] },
            { heading: "二、齐次线性方程组非零解的存在性", items: [{ text: "基础解系维数 n - r", color: "blue" }, { text: "自由未知量与主元列的选择次序", color: "green" }] },
          ],
          onAction: (act) => setLog(`GhostreaderPanel 切换伴读动作: ${act}`),
          onInsertCallout: () => setLog("GhostreaderPanel: 已将伴读解析作为 Callout 插入正文"),
          onCopy: () => setLog("GhostreaderPanel: 已复制伴读解析与证据溯源"),
        })
      );
        }
    },
    {
        id: 116,
        title: "116. \u9519\u9898\u6d88\u706d\u9636\u68af\u4e0e\u8bd5\u9898\u53d8\u5f0f\u7279\u8bad\u9762\u677f VariantDrillStudio\uff08\u8003\u8bd5\u6700\u65b0\u6f14\u8fdb\uff09",
        fn: "lvxVariantDrillStudio({ seedStem, seedAnswer, ladderStage, streakCorrect, onDrillAnswer })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxVariantDrillStudio({
          ladderStage: "strengthening",
          streakCorrect: 1,
          seedStem: "【错题原题】若 n 阶矩阵 A 满足 A² = A，且 A ≠ E，则下列命题中错误的是？",
          seedAnswer: "B. 矩阵 A 必然可逆",
          onDrillAnswer: (ans) => setLog(`VariantDrillStudio 用户作答变式题: 选选 ${ans}`),
          onPromoteLadder: () => setLog("VariantDrillStudio: 连对达成，错题成功出库晋级至 🟢 已掌握"),
        })
      );
        }
    },
    {
        id: 117,
        title: "117. \u6613\u6b6a\u6b6a\u5bf9\u6807\u53cc\u6838\u5206\u7c7b\u6811\u4e0e\u77ed\u8bed\u7011\u5e03\u6d41\u9762\u677f DualCoreSidebar\uff08\u5e38\u7528\u6700\u65b0\u6f14\u8fdb\uff09",
        fn: "lvxDualCoreSidebar({ categories, phrases, activeCat, onSelectCat, onInsert })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxDualCoreSidebar({
          categories: [
            { id: "biz", name: "商务沟通", count: 8, icon: "💼" },
            { id: "service", name: "客服售后", count: 12, icon: "🎧" },
            { id: "ai", name: "AI 提示词", count: 15, icon: "🤖" },
            { id: "dev", name: "研发写作", count: 6, icon: "💻" },
          ],
          phrases: [
            { id: "p1", title: "基金季报勾稽自检合格回执", category: "商务沟通", snippet: "您好，截至 {{date}} 已完成【{{fund}}】全部 7 大勾稽自检，全表零尾差通过复核。", vars: ["date", "fund"] },
            { id: "p2", title: "工单延期预警与协同跟进", category: "客服售后", snippet: "尊敬的 {{customer}}，您咨询的工单 {{ticket_id}} 正在加急流转中，预计最迟于 {{eta}} 反馈结论。", vars: ["customer", "ticket_id", "eta"] },
            { id: "p3", title: "苏格拉底式启发式解题 Prompt", category: "AI 提示词", snippet: "请作为苏格拉底式导师，不要直接给出最终答案，通过反问和梯级提示引导我找出概念误区。", vars: [] },
          ],
          onSelectCat: (id) => setLog(`DualCoreSidebar 切换分类: ${id}`),
          onInsert: (pid) => setLog(`DualCoreSidebar 快速插入话术: ${pid}`),
        })
      );
        }
    },
    {
        id: 118,
        title: "118. \u95ea\u5361\u4ea4\u4e92\u5f0f\u5373\u65f6\u4f5c\u7b54\u4e0e\u4e09\u9636\u8fdb\u5ea6\u5bfc\u89c8 InteractiveQuizCard\uff08\u95ea\u5361\u6700\u65b0\u6f14\u8fdb\uff09",
        fn: "lvxInteractiveQuizCard({ stem, options, breadcrumb, progress, memoCallout, onAnswer })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxInteractiveQuizCard({
          stem: "在 Raft 分布式共识协议中，当 Leader 节点发生网络分区宕机时，Follower 节点通过哪个超时机制触发新一轮选举？",
          breadcrumb: "分布式系统 · Raft 共识协议 · 选举机制",
          progress: { newCount: 3, learnCount: 8, reviewCount: 24 },
          options: [
            "A. 心跳保活超时 (Heartbeat Timeout)",
            "B. 随机化选举超时 (Randomized Election Timeout)",
            "C. 日志复制同步超时 (AppendEntries Timeout)",
            "D. 租约到期超时 (Leader Lease Timeout)",
          ],
          memoCallout: "记忆提示：随机化超时（如 150ms~300ms）的核心目的是把选票瓜分（Split Vote）的概率降低到趋近于零。",
          onAnswer: (idx) => setLog(`InteractiveQuizCard 用户作答选项 ${idx + 1}`),
        })
      );
        }
    },
    {
        id: 119,
        title: "119. \u4eba\u8109\u4e94\u7ea7\u751f\u547d\u5468\u671f\u6f0f\u6597\u4e0e\u4eba\u8109\u6c60\u6df1\u5ea6\u5361 LifecycleFunnelCard\uff08\u5c0f\u9a74\u4eba\u8109\u6838\u5fc3\u770b\u677f\uff09",
        fn: "lvxLifecycleFunnelCard({ stages, totalContacts, dormantWarning, onStageClick })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxLifecycleFunnelCard({
          totalContacts: 132,
          dormantWarning: 8,
          onStageClick: (sid) => setLog(`LifecycleFunnelCard 点击人脉阶段: ${sid}`),
        })
      );
        }
    },
    {
        id: 120,
        title: "120. \u62fe\u9057\u957f\u6587\u6e10\u8fdb\u5207\u7247\u4e0e\u9605\u8bfb\u8fdb\u5ea6\u770b\u677f DocSlicingCard\uff08\u5bf9\u6807 Readwise Reader\uff09",
        fn: "lvxDocSlicingCard({ title, totalWords, slices, onJumpSlice })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxDocSlicingCard({
          title: "分布式共识系统原理与工程实战精要",
          totalWords: 34500,
          slices: [
            { id: "s1", title: "第一章：Paxos 与 Multi-Paxos 核心两阶段共识推导", words: 8200, eta: "12m", status: "done" },
            { id: "s2", title: "第二章：Raft 领导者选举与日志复制安全性不变式", words: 9600, eta: "15m", status: "reading" },
            { id: "s3", title: "第三章：脑裂场景下租约机制与线性一致性读优化", words: 7800, eta: "10m", status: "pending" },
            { id: "s4", title: "第四章：生产集群状态机快照与日志压缩工程落地", words: 8900, eta: "14m", status: "pending" },
          ],
          onJumpSlice: (sid) => setLog(`DocSlicingCard 一键直达切片: ${sid}`),
        })
      );
        }
    },
    {
        id: 121,
        title: "121. \u95ea\u5361\u8003\u524d\u7a81\u51fb\u7279\u8bad\u4e0e\u6025\u6551\u5237\u9898\u9762\u677f ReviewCramStudio\uff08\u5c0f\u9a74\u95ea\u5361\u6025\u6551\u9762\u677f\uff09",
        fn: "lvxReviewCramStudio({ cardCount, timerSeconds, streak, onRate, onFinish })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxReviewCramStudio({
          cardCount: 24,
          timerSeconds: 120,
          streak: 5,
          onRate: (r) => setLog(`ReviewCramStudio 突击评分: ${r}`),
          onFinish: () => setLog("ReviewCramStudio: 结束考前突击特训"),
        })
      );
        }
    },
    {
        id: 122,
        title: "122. \u8003\u8bd5\u8bd5\u5377\u667a\u80fd\u7ec4\u5377\u4e0e\u77e5\u8bc6\u70b9\u8986\u76d6\u6c99\u76d2 PaperAssembleStudio\uff08\u5c0f\u9a74\u8003\u8bd5\u7ec4\u5377\u4e2d\u67a2\uff09",
        fn: "lvxPaperAssembleStudio({ paperName, totalScore, difficulty, proportions, onGenerate })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxPaperAssembleStudio({
          totalScore: 100,
          difficulty: 0.68,
          onGenerate: () => setLog("PaperAssembleStudio: 已一键抽取并生成全真模拟试卷"),
        })
      );
        }
    },
    {
        id: 123,
        title: "123. \u8fb9\u7f18\u6d41\u52a8\u5149\u675f\u9ad8\u4eae\u4e3b\u89d2\u5361 BorderBeamCard\uff08\u5bf9\u6807 Magic UI / Aceternity Moving Border\uff09",
        fn: "lvxBorderBeamCard({ title, badgeText, body, tone, footerAction })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxBorderBeamCard({
          title: "🔥 今日必背最高权重复习锚点：Raft 领导者租约与脑裂自愈机制",
          badgeText: "高频考点 P0 · 稳定性 98.4%",
          body: "在发生跨机房网络脑裂时，Leader 依靠心跳租约时效（Lease Read）确保不会向客户端返回过时的脏数据；租约超时后立即主动退化为 Follower，彻底终结双主脑裂风险。",
          tone: "brand",
          footerAction: { label: "⚡ 立即进入深度特训", onClick: () => setLog("BorderBeamCard: 触发深度特训") },
        })
      );
        }
    },
    {
        id: 124,
        title: "124. 30\u5929\u8fde\u7eed\u72b6\u6001\u4e0e\u5c65\u7ea6\u8ffd\u8e2a\u8f68 TrackerBar\uff08\u5bf9\u6807 Tremor Tracker / GitHub Status\uff09",
        fn: "lvxTrackerBar({ title, days, uptime, onDayClick })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxTrackerBar({
          title: "📊 习惯打卡与闪卡复习近 30 天连续履约追踪轨",
          uptime: "连续达成率 93.3%",
          onDayClick: (d) => setLog(`TrackerBar 查看单日履约记录: ${d.date} (${d.tooltip})`),
        })
      );
        }
    },
    {
        id: 125,
        title: "125. \u516d\u4f4d\u72ec\u7acb\u5206\u6bb5\u6570\u5b57/\u5bc6\u94a5\u77e9\u9635\u8f93\u5165\u5668 PinCodeInput\uff08\u5bf9\u6807 Origin UI / Radix InputOTP\uff09",
        fn: "lvxPinCodeInput({ length, label, mask, onComplete, onChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxPinCodeInput({
          length: 6,
          label: "🔐 请输入小驴灾备恢复口令或 API Key 验证码（自动跳格）",
          onComplete: (code) => setLog(`PinCodeInput 验证码输入完成: [${code}]`),
          onChange: (code) => setLog(`PinCodeInput 当前输入值: [${code}]`),
        })
      );
        }
    },
    {
        id: 126,
        title: "126. \u805a\u5149\u706f\u8ddf\u968f\u5149\u5fae\u6f2b\u5c04\u5361\u7247 SpotlightBentoCard\uff08\u5bf9\u6807 Aceternity UI Spotlight Card\uff09",
        fn: "lvxSpotlightBentoCard({ title, desc, badge, icon, actionText, onClick })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxSpotlightBentoCard({
          title: "分布式系统全真模拟实战卷（带环境漫射微光）",
          desc: "涵盖 Raft 共识、MVCC 多版本并发控制与分布式事务 2PC/3PC 典型故障自愈，鼠标滑动可感知指针聚焦光漫射反馈。",
          badge: "重点卷 · 建议用时 45m",
          icon: "💡",
          actionText: "开始测验",
          onClick: () => setLog("SpotlightBentoCard: 触发测验"),
        })
      );
        }
    },
    {
        id: 127,
        title: "127. \u6d41\u5149\u805a\u80fd\u884c\u52a8\u6309\u94ae ShimmerButton\uff08\u5bf9\u6807 Magic UI Shimmer Button\uff09",
        fn: "lvxShimmerButton({ text, icon, tone, onClick })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;gap:12px;flex-wrap:wrap;";
      row.appendChild(
        K.lvxShimmerButton({
          text: "⚡ 立即进入每日闪卡复习",
          icon: "🎴",
          tone: "brand",
          onClick: () => setLog("ShimmerButton: 触发每日闪卡复习"),
        })
      );
      row.appendChild(
        K.lvxShimmerButton({
          text: "🛡️ 执行全生态一键灾备",
          icon: "📦",
          tone: "success",
          onClick: () => setLog("ShimmerButton: 触发全生态灾备"),
        })
      );
      stage.appendChild(row);
        }
    },
    {
        id: 128,
        title: "128. \u52a8\u6548\u8ba1\u6570\u6eda\u52a8\u5668 NumberTicker\uff08\u5bf9\u6807 Magic UI Number Ticker / Framer Motion CountUp\uff09",
        fn: "lvxNumberTicker({ value, durationMs, prefix, suffix, trend, fontSize })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const box = document.createElement("div");
      box.style.cssText = "display:flex;flex-direction:column;gap:14px;padding:14px;background:var(--lvx-surface-sunken);border-radius:var(--lvx-r-md);width:100%;";
      const row1 = document.createElement("div");
      row1.style.cssText = "display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;";
      row1.appendChild(
        K.lvxNumberTicker({
          value: 1420,
          suffix: " 累计记忆卡片",
          trend: { delta: "+18.4%", direction: "up", label: "本周" },
          fontSize: "28px",
          color: "var(--lvx-brand)",
        })
      );
      row1.appendChild(
        K.lvxNumberTicker({
          value: 98.4,
          decimals: 1,
          suffix: "% 记忆留存率 (FSRS)",
          trend: { delta: "+2.1%", direction: "up" },
          fontSize: "28px",
          color: "var(--lvx-success)",
        })
      );
      box.appendChild(row1);
      stage.appendChild(box);
        }
    },
    {
        id: 129,
        title: "129. \u73af\u8f68\u751f\u6001\u67a2\u7ebd\u4eea OrbitingCircles\uff08\u5bf9\u6807 Magic UI Orbiting Circles / Ecosystem Nexus\uff09",
        fn: "lvxOrbitingCircles({ centerIcon, centerLabel, nodes, size })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxOrbitingCircles({
          centerIcon: "🐴",
          centerLabel: "小驴罗盘",
          size: 260,
          nodes: [
            { icon: "📅", label: "小驴打卡", ring: 1, onClick: () => setLog("Orbit: 点击小驴打卡") },
            { icon: "🏠", label: "小驴管家", ring: 1, onClick: () => setLog("Orbit: 点击小驴管家") },
            { icon: "🎴", label: "小驴闪卡", ring: 1, onClick: () => setLog("Orbit: 点击小驴闪卡") },
            { icon: "📝", label: "小驴考试", ring: 1, onClick: () => setLog("Orbit: 点击小驴考试") },
            { icon: "🤝", label: "小驴人脉", ring: 2, onClick: () => setLog("Orbit: 点击小驴人脉") },
            { icon: "💎", label: "小驴拾遗", ring: 2, onClick: () => setLog("Orbit: 点击小驴拾遗") },
            { icon: "⚡", label: "小驴雷切", ring: 2, onClick: () => setLog("Orbit: 点击小驴雷切") },
            { icon: "💬", label: "小驴常用", ring: 2, onClick: () => setLog("Orbit: 点击小驴常用") },
          ],
        })
      );
        }
    },
    {
        id: 130,
        title: "130. \u539f\u4f4d\u5f62\u6001\u5207\u6362\u590d\u5236\u6309\u94ae CopyFeedbackButton\uff08\u5bf9\u6807 Origin UI Copy Button & Morphing Checkmark\uff09",
        fn: "lvxCopyFeedbackButton({ copyText, label, copiedLabel, size, onCopy })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;gap:12px;flex-wrap:wrap;";
      row.appendChild(
        K.lvxCopyFeedbackButton({
          copyText: "SELECT * FROM blocks WHERE type = 'h' ORDER BY updated DESC LIMIT 10;",
          label: "复制 SQL 查询片段",
          copiedLabel: "✓ 已复制到剪贴板",
          onCopy: (t) => setLog(`CopyFeedbackButton: 复制了 [${t.slice(0, 30)}...]`),
        })
      );
      row.appendChild(
        K.lvxCopyFeedbackButton({
          copyText: "siyuan://blocks/20261118120000-abcdef1",
          label: "复制思源块锚点",
          copiedLabel: "✓ 块锚点已复制",
          size: "sm",
          onCopy: (t) => setLog(`CopyFeedbackButton: 复制块锚点 [${t}]`),
        })
      );
      stage.appendChild(row);
        }
    },
    {
        id: 131,
        title: "131. \u65e0\u7f1d\u65e0\u9650\u6c34\u5e73\u6eda\u52a8\u6d41 MarqueeTicker\uff08\u5bf9\u6807 Magic UI Marquee\uff09",
        fn: "lvxMarqueeTicker({ items, speedSec, pauseOnHover, reverse, title })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxMarqueeTicker({
          title: "生态实时活动与动态通知跑马灯（悬浮暂停）",
          speedSec: 24,
          items: [
            { icon: "🔥", text: "小驴打卡：晨间心流阅读连击 48 天", badge: "连击", onClick: () => setLog("Marquee: 点击打卡动态") },
            { icon: "🎴", text: "小驴闪卡：今日完成 FSRS 到期卡片 56 张", badge: "已完成", onClick: () => setLog("Marquee: 点击闪卡动态") },
            { icon: "🛡️", text: "小驴管家：全域灾备自动快照校验通过", badge: "安全", onClick: () => setLog("Marquee: 点击管家动态") },
            { icon: "📝", text: "小驴考试：错题阶梯特训连续命中 12 题", badge: "满分", onClick: () => setLog("Marquee: 点击考试动态") },
            { icon: "⚡", text: "小驴雷切：代码片段库已热更 3 项", badge: "快切", onClick: () => setLog("Marquee: 点击雷切动态") },
          ],
        })
      );
        }
    },
    {
        id: 132,
        title: "132. \u6781\u5750\u6807\u534a\u73af\u5065\u5eb7\u4eea\u8868\u76d8 GaugeMeter\uff08\u5bf9\u6807 Tremor Gauge / Apple Health\uff09",
        fn: "lvxGaugeMeter({ value, title, subtitle, unit, thresholds, color })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;width:100%;";
      row.appendChild(
        K.lvxGaugeMeter({
          value: 94,
          title: "FSRS 记忆健康度",
          subtitle: "近30天加权",
          unit: "%",
        })
      );
      row.appendChild(
        K.lvxGaugeMeter({
          value: 68,
          title: "分布式考卷把握度",
          subtitle: "变式题弱项",
          unit: "%",
        })
      );
      stage.appendChild(row);
        }
    },
    {
        id: 133,
        title: "133. \u53cc\u680f\u5bf9\u6bd4\u89c6\u5dee\u6ed1\u5757 DiffCompareSlider\uff08\u5bf9\u6807 Aceternity / Origin UI Before-After\uff09",
        fn: "lvxDiffCompareSlider({ beforeLabel, afterLabel, beforeText, afterText, title, defaultPosition })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxDiffCompareSlider({
          title: "AI 智能切片与错题重构前后实时对照（拖动手柄左右划动）",
          beforeLabel: "原始混杂文本 (Raw)",
          afterLabel: "AI 原子化切片 (DL2 增强)",
          beforeText: "Raft算法是分布式共识协议，包括Leader选举、日志复制和安全性保障，在脑裂网络分区时会有租约心跳，防止客户端读取过时数据。",
          afterText: "【核心定义】Raft 分布式一致性算法通过三大强不变式保证系统安全：① 领导者租约时效（Lease Read）彻底消除脑裂脏读；② 多数派日志追平；③ 随机心跳选举自愈。",
          defaultPosition: 48,
        })
      );
        }
    },
    {
        id: 134,
        title: "134. \u7075\u52a8\u80f6\u56ca\u4ea4\u4e92\u6001 DynamicCapsule\uff08\u5bf9\u6807 Dynamic Island / Floating Activity\uff09",
        fn: "lvxDynamicCapsule({ statusDotColor, compactText, expandedTitle, expandedSubtitle, actions })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;gap:12px;flex-wrap:wrap;";
      row.appendChild(
        K.lvxDynamicCapsule({
          compactText: "🎙️ 闪卡复习心流中 · 剩余 8 张",
          expandedTitle: "闪卡专注模式进行中",
          expandedSubtitle: "连续心流 24 分钟 · 当前准确率 96.2% · 关联笔记本《系统架构设计师》",
          actions: [
            { label: "⏸ 暂停专注", onClick: () => setLog("DynamicCapsule: 触发暂停") },
            { label: "✓ 完成此组", primary: true, onClick: () => setLog("DynamicCapsule: 触发完成") },
          ],
        })
      );
      stage.appendChild(row);
        }
    },
    {
        id: 135,
        title: "135. \u5934\u50cf\u91cd\u53e0\u5806\u53e0\u7ec4 AvatarStack\uff08\u5bf9\u6807 Origin UI / shadcn Face Pile\uff09",
        fn: "lvxAvatarStack({ items, max, size, label, onOverflowClick })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;gap:16px;flex-wrap:wrap;";
      row.appendChild(
        K.lvxAvatarStack({
          items: [
            { name: "张三", color: "#6a6ee0", title: "架构师 · 张三" },
            { name: "李四", color: "#2f9e68", title: "审校 · 李四" },
            { emoji: "🐴", color: "#f59e0b", title: "小驴本驴" },
            { name: "王五", color: "#e5484d", title: "题库贡献 · 王五" },
            { name: "赵六", color: "#3b82f6", title: "切片 · 赵六" },
            { name: "钱七", color: "#a855f7", title: "美工 · 钱七" },
          ],
          max: 4,
          label: "共同维护这份知识库",
          onOverflowClick: () => setLog("AvatarStack: 查看全部 6 位成员"),
        })
      );
      stage.appendChild(row);
        }
    },
    {
        id: 136,
        title: "136. \u6253\u5b57\u673a\u9010\u5b57\u6d6e\u73b0\u6587\u672c TypewriterText\uff08\u5bf9\u6807 Magic UI Typing / Aceternity Type Animation\uff09",
        fn: "lvxTypewriterText({ text, speedMs, cursor, fontSize, onComplete })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const box = document.createElement("div");
      box.style.cssText = "display:flex;flex-direction:column;gap:10px;padding:14px;background:var(--lvx-surface-sunken);border-radius:var(--lvx-r-md);width:100%;";
      box.appendChild(
        K.lvxTypewriterText({
          text: "🤖 正在为您逐层拆解《Raft 一致性算法》核心命题，共识别 3 个可考原子概念...",
          speedMs: 34,
          onComplete: () => setLog("TypewriterText: 第一段打字完成"),
        })
      );
      box.appendChild(
        K.lvxTypewriterText({
          text: "✨ Socratic 追问：如果不做 Lease Read，脑裂期间客户端会读到什么？",
          speedMs: 26,
          color: "var(--lvx-brand)",
        })
      );
      stage.appendChild(box);
        }
    },
    {
        id: 137,
        title: "137. \u8bc4\u5206\u5206\u5e03\u76f4\u65b9\u6761 RatingDistribution\uff08\u5bf9\u6807 Tremor Bar List / \u5e94\u7528\u5546\u5e97\u8bc4\u5206\uff09",
        fn: "lvxRatingDistribution({ title, distribution, total, tone, onRowClick })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const row = document.createElement("div");
      row.style.cssText = "display:flex;gap:12px;flex-wrap:wrap;width:100%;";
      const d1 = K.lvxRatingDistribution({
        title: "📈 本周闪卡掌握度分布",
        distribution: [186, 94, 40, 12, 4],
        tone: "success",
        onRowClick: (lv) => setLog(`RatingDistribution: 下钻 ${lv} 星层`),
      });
      const d2 = K.lvxRatingDistribution({
        title: "🧪 全真卷题目难度自评",
        distribution: [22, 58, 96, 70, 31],
        tone: "energy",
        onRowClick: (lv) => setLog(`RatingDistribution: 难度 ${lv} 星层`),
      });
      d1.style.flex = "1 1 240px"; d1.style.minWidth = "0";
      d2.style.flex = "1 1 240px"; d2.style.minWidth = "0";
      row.appendChild(d1); row.appendChild(d2);
      stage.appendChild(row);
        }
    },
    {
        id: 138,
        title: "138. \u5206\u7ec4\u5feb\u6377\u952e\u901f\u67e5\u7f51\u683c ShortcutGrid\uff08\u5bf9\u6807 Linear / Raycast / GitHub \u547d\u4ee4\u901f\u67e5\uff09",
        fn: "lvxShortcutGrid({ title, groups })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxShortcutGrid({
          title: "小驴闪卡 · 复习与罗盘快捷键速查",
          groups: [
            {
              name: "复习评分",
              shortcuts: [
                { keys: ["Space"], label: "揭晓答案 / 翻面" },
                { keys: ["1"], label: "完全遗忘" },
                { keys: ["2"], label: "模糊想起" },
                { keys: ["3"], label: "想起有提示" },
                { keys: ["4"], label: "轻松记得" },
              ],
            },
            {
              name: "罗盘导航",
              shortcuts: [
                { keys: ["Ctrl", "K"], label: "万物穿透搜索" },
                { keys: ["Alt", "↑"], label: "上划：最近历史" },
                { keys: ["Alt", "→"], label: "右划：收藏夹" },
                { keys: ["Esc"], label: "关闭弹层" },
              ],
            },
            {
              name: "制卡",
              shortcuts: [
                { keys: ["Ctrl", "Enter"], label: "确认制卡" },
                { keys: ["Ctrl", "H"], label: "插入挖空标记" },
                { keys: ["1", "~", "5"], label: "切换模板" },
              ],
            },
            {
              name: "批量操作",
              shortcuts: [
                { keys: ["Shift", "Click"], label: "范围多选" },
                { keys: ["Ctrl", "A"], label: "全选当前视图" },
                { keys: ["Del"], label: "移除已选" },
              ],
            },
          ],
        })
      );
        }
    },
    {
        id: 139,
        title: "139. \u5bc6\u7801\u5f3a\u5ea6\u5206\u6bb5\u4eea\u8868 PasswordStrengthMeter\uff08\u5bf9\u6807 Origin UI / 21st.dev \u00b7 NIST \u542f\u53d1\uff09",
        fn: "lvxPasswordStrengthMeter({ value, showInput, showChecklist, onChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxPasswordStrengthMeter({ showInput: true, showChecklist: true, label: "灾备恢复口令", onChange: (v) => setLog(`PasswordStrength: 输入长度 ${v.length}`) })
      );
        }
    },
    {
        id: 140,
        title: "140. \u60ac\u6d6e\u5feb\u6377\u7403\u4e0e\u5c55\u5f00\u6247 SpeedDial\uff08\u5bf9\u6807 Material Speed Dial / 2026 AI \u884c\u52a8\u5165\u53e3\uff09",
        fn: "lvxSpeedDial({ label, icon, actions, defaultOpen })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const box = document.createElement("div");
      box.style.cssText = "display:flex;justify-content:flex-end;padding:12px 18px 110px 12px;position:relative;";
      box.appendChild(
        K.lvxSpeedDial({
          icon: "⚡",
          label: "快捷操作",
          defaultOpen: true,
          actions: [
            { icon: "🎴", label: "提炼闪卡", onClick: () => setLog("SpeedDial: 提炼闪卡") },
            { icon: "👤", label: "记人脉", onClick: () => setLog("SpeedDial: 记人脉") },
            { icon: "📝", label: "写日记", onClick: () => setLog("SpeedDial: 写日记") },
          ],
        })
      );
      stage.appendChild(box);
        }
    },
    {
        id: 141,
        title: "141. \u62d6\u62fd\u6587\u4ef6\u6295\u653e\u533a FileDropzone\uff08\u5bf9\u6807 Kibo UI Dropzone / shadcn File-Upload\uff09",
        fn: "lvxFileDropzone({ title, hint, accept, multiple, onFiles })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxFileDropzone({ title: "拖入 Markdown / PDF / 图片", hint: "拾遗剪藏 · 考试题库导入 · 闪卡批量建卡", onFiles: (files) => setLog(`Dropzone: 收到 ${files.length} 个文件`) })
      );
        }
    },
    {
        id: 142,
        title: "142. \u65e5\u671f\u533a\u95f4\u9009\u62e9\u5668 DateRangePicker\uff08\u5bf9\u6807 Kibo UI Date Picker / shadcn Calendar Range\uff09",
        fn: "lvxDateRangePicker({ value, onChange, startWeekOnMonday })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxDateRangePicker({ onChange: (r) => setLog(`DateRange: ${r.start || "-"} → ${r.end || "-"}`) })
      );
        }
    },
    {
        id: 143,
        title: "143. \u6807\u7b7e\u8f93\u5165\u5668 TagsInput\uff08\u5bf9\u6807 Kibo UI Tags / Origin UI Tag Input\uff09",
        fn: "lvxTagsInput({ value, placeholder, max, suggestions, onChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxTagsInput({ placeholder: "输入知识点标签...", max: 6, suggestions: ["Raft 共识", "MVCC", "分布式事务", "FSRS"], onChange: (tags) => setLog(`Tags: [${tags.join(", ")}]`) })
      );
        }
    },
    {
        id: 144,
        title: "144. \u73af\u5f62\u5360\u6bd4\u56fe DonutChart\uff08\u5bf9\u6807 Tremor Donut Chart\uff09",
        fn: "lvxDonutChart({ title, data, size, thickness, centerTitle })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxDonutChart({
          title: "今日卡片构成",
          centerTitle: "张",
          data: [
            { label: "新学", value: 24 },
            { label: "学习中", value: 16 },
            { label: "巩固", value: 10 },
            { label: "到期复习", value: 6 },
          ],
        })
      );
        }
    },
    {
        id: 145,
        title: "145. \u6570\u503c\u6eda\u52a8\u6d41 NumberFlow\uff08\u5bf9\u6807 NumberFlow \u00b7 \u503c\u53d8\u5316\u9010\u4f4d\u6eda\u52a8\uff09",
        fn: "lvxNumberFlow({ value, decimals, prefix, suffix, fontSize }) \u2192 el.update(v)",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const box = document.createElement("div");
      box.style.cssText = "display:flex;flex-direction:column;gap:12px;align-items:flex-start;";
      const flow = K.lvxNumberFlow({ value: 98.4, decimals: 1, suffix: " % 记忆留存", fontSize: "30px", color: "var(--lvx-brand)" });
      box.appendChild(flow);
      const row = document.createElement("div");
      row.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;";
      for (const [label, v] of [["模拟 +0.5", 98.9], ["模拟 -1.2", 97.2], ["模拟 99.9", 99.9]]) {
        const b = document.createElement("button");
        b.className = "lvx-pill-btn";
        b.textContent = label;
        b.onclick = () => { flow.update(v); setLog(`NumberFlow: update(${v})`); };
        row.appendChild(b);
      }
      box.appendChild(row);
      stage.appendChild(box);
        }
    },
    {
        id: 146,
        title: "146. \u8bfb\u5c4f\u64ad\u62a5\u5668 Announcer\uff08a11y \u57fa\u5efa\u539f\u8bed\uff0c\u6765\u6e90\uff1a\u95ea\u5361 LvLive\uff09",
        fn: "lvxAnnouncer({ tone: ",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const box = document.createElement("div");
      box.style.cssText = "display:flex;flex-direction:column;gap:10px;align-items:flex-start;";
      const ann = K.lvxAnnouncer({ tone: "polite" });
      box.appendChild(ann);
      const row = document.createElement("div");
      row.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;";
      for (const msg of ["已导入 12 条摘录", "备份校验通过", "卡片 3 张已加入卡包"]) {
        const b = document.createElement("button");
        b.className = "lvx-pill-btn";
        b.textContent = "播报：" + msg;
        b.onclick = () => { ann.say(msg); setLog("Announcer: " + msg); };
        row.appendChild(b);
      }
      box.appendChild(row);
      stage.appendChild(box);
        }
    },
    {
        id: 147,
        title: "147. \u6279\u91cf\u4efb\u52a1\u961f\u5217\u9762\u677f BatchQueuePanel\uff08\u6765\u6e90\uff1a\u4eba\u8109 ImportDialog / \u62fe\u9057 AiBatchPanel \u7b49 6 \u5904\u6536\u655b\uff09",
        fn: "lvxBatchQueuePanel({ title, items, pauseAfterCurrent, onRetryFailed, onRetryItem })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxBatchQueuePanel({
          title: "📄 导入 8 份文档 → 原子化切片",
          pauseAfterCurrent: true,
          onPauseAfterCurrentChange: (v) => setLog("暂停开关: " + v),
          onRetryFailed: () => setLog("仅重试失败项"),
          onRetryItem: (id) => setLog("重试: " + id),
          items: [
            { id: "1", label: "Raft 一致性算法.md", meta: "2.1k 字", status: "done" },
            { id: "2", label: "MVCC 多版本并发.md", meta: "1.4k 字", status: "done" },
            { id: "3", label: "分布式事务 2PC.pdf", meta: "第 3/9 段", status: "running" },
            { id: "4", label: "扫描版讲义.png", status: "failed" },
            { id: "5", label: "FSRS 调参笔记.md", status: "pending" },
            { id: "6", label: "草稿（跳过）", status: "skipped" },
          ],
        })
      );
        }
    },
    {
        id: 148,
        title: "148. AI \u5916\u53d1\u9884\u68c0\u77e5\u60c5\u5361 AiPreflightCard\uff08\u6765\u6e90\uff1a\u95ea\u5361 ai-wizard / \u4eba\u8109 CaptureDialog \u53cc\u5b9e\u73b0\u6536\u655b\uff09",
        fn: "lvxAiPreflightCard({ endpoint, model, chars, estTokens, budget, sensitiveHits, payloadPreview, consentText, onConfirm })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxAiPreflightCard({
          endpoint: "https://api.example.com/v1/chat",
          model: "deepseek-v3",
          chars: 4200,
          estTokens: 1820,
          budget: { truncated: ["第 4 段超预算"], dropped: [] },
          sensitiveHits: ["手机号 138****"],
          payloadPreview: "【系统】你是笔记助手...\n【用户】总结以下摘录：\n（已脱敏）...",
          consentText: "我已知晓上述脱敏内容将发送至外部 AI 服务",
          onConfirm: () => setLog("Preflight: 已确认发送"),
          onCancel: () => setLog("Preflight: 已取消"),
        })
      );
        }
    },
    {
        id: 149,
        title: "149. \u6307\u6807\u7b5b\u9009\u680f MetricFilterBar\uff08\u6765\u6e90\uff1a\u96f7\u5207 platform-metrics / \u5e38\u7528 sync-diff \u53cc\u6f14\u5316\u6536\u655b\uff09",
        fn: "lvxMetricFilterBar({ metrics, active, onChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxMetricFilterBar({
          onChange: (k) => setLog("MetricFilter: " + (k || "已取消筛选")),
          metrics: [
            { key: "all", label: "全部条目", value: 128 },
            { key: "diff", label: "有差异", value: 6, tone: "energy" },
            { key: "conflict", label: "冲突", value: 2, tone: "danger" },
            { key: "ok", label: "一致", value: 120, tone: "success" },
          ],
        })
      );
        }
    },
    {
        id: 150,
        title: "150. \u79fb\u52a8\u7aef\u5e95\u90e8\u5f39\u5c42 BottomSheet\uff08\u6765\u6e90\uff1a\u96f7\u5207 mobile-switcher 3 \u5904 / \u62fe\u9057\u79fb\u52a8\u7b5b\u9009\u5f39\u5c42\uff09",
        fn: "lvxBottomSheet({ title, content, onClose }) \u2192 el.close()",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const host = document.createElement("div");
      host.style.cssText = "position:relative;height:240px;overflow:hidden;border-radius:var(--lvx-r-md);border:1px solid var(--lvx-border);";
      const frame = document.createElement("div");
      frame.style.cssText = "position:relative;width:100%;height:100%;";
      host.appendChild(frame);
      const openBtn = document.createElement("button");
      openBtn.className = "lvx-pill-btn";
      openBtn.textContent = "📱 模拟移动视口 · 打开底部弹层";
      openBtn.onclick = () => {
        const sheet = K.lvxBottomSheet({
          title: "⚠️ 对 3 项执行批量操作",
          content: [
            K.lvxButton({ label: "🗑️ 批量删除", variant: "danger", block: true, onClick: () => { sheet.close(); setLog("BottomSheet: 批量删除"); } }),
            K.lvxButton({ label: "📁 批量归档", block: true, onClick: () => { sheet.close(); setLog("BottomSheet: 批量归档"); } }),
          ],
          onClose: () => setLog("BottomSheet: 已关闭"),
        });
        sheet.style.position = "absolute";
        sheet.querySelector("div").style.position = "absolute";
        frame.appendChild(sheet);
      };
      frame.appendChild(openBtn);
      host.appendChild(frame);
      stage.appendChild(host);
        }
    },
    {
        id: 151,
        title: "151. \u6682\u5b58\u6258\u76d8 PasteTrayBar\uff08\u6765\u6e90\uff1a\u5e38\u7528 dialog.ts \u6682\u5b58\u6258\u76d8\uff09",
        fn: "lvxPasteTrayBar({ items, separators, separator, onRemove, onChangeSeparator, onMerge })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxPasteTrayBar({
          items: [
            { id: "1", label: "尊敬的王总：" },
            { id: "2", label: "会议纪要第 3 节" },
            { id: "3", label: "附件为修改版" },
          ],
          onRemove: (id) => setLog("Tray: 移除 " + id),
          onChangeSeparator: (s) => setLog("Tray: 分隔符 " + JSON.stringify(s)),
          onMerge: (text) => setLog("Tray: 合并插入 [" + text.slice(0, 30) + "...]"),
        })
      );
        }
    },
    {
        id: 152,
        title: "152. \u6781\u901f\u9884\u89c8\u6d6e\u5c42 QuickLookOverlay\uff08\u6765\u6e90\uff1a\u5e38\u7528 dialog.ts \u7a7a\u683c\u952e\u6781\u901f\u9884\u89c8\uff09",
        fn: "lvxQuickLookOverlay({ title, body, hint, onClose }) \u2192 el.close()",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const b = document.createElement("button");
      b.className = "lvx-shm-btn";
      b.textContent = "🔍 打开极速预览（Esc/Space 收起）";
      b.onclick = () => {
        K.lvxQuickLookOverlay({
          title: "片段预览 · 会议开场白",
          body: "王总您好，感谢拨冗出席。本次会议我们将围绕三个议题展开：一、季度复盘与数据对账；二、下一阶段资源排布；三、需要贵方决策的两项事项。\n\n（这是极速预览大卡的正文区，可聚焦滚动，Esc 或空格收起后焦点会回到触发按钮。）",
          onClose: () => setLog("QuickLook: 已收起"),
        });
        setLog("QuickLook: 已打开");
      };
      stage.appendChild(b);
        }
    },
    {
        id: 153,
        title: "153. \u5b8f\u53d8\u91cf\u63d2\u5165\u6761 TokenInsertBar\uff08\u6765\u6e90\uff1a\u4eba\u8109 TemplateManager / \u5e38\u7528 variable-form \u53cc\u5b9e\u73b0\u6536\u655b\uff09",
        fn: "lvxTokenInsertBar({ tokens, onInsert })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxTokenInsertBar({
          tokens: [
            { key: "姓名", title: "联系人姓名" },
            { key: "称呼", title: "合适称呼" },
            { key: "最近互动", title: "最近一次互动摘要" },
            { key: "日期", title: "今天日期" },
            { key: "承诺事项", title: "未兑现承诺" },
          ],
          onInsert: (k) => setLog("TokenInsert: 插入 {{" + k + "}}"),
        })
      );
        }
    },
    {
        id: 154,
        title: "154. \u81ea\u7136\u8bed\u8a00\u89e3\u6790\u56de\u6267\u6761 NlpParsePreviewBar\uff08\u6253\u5361+\u7ba1\u5bb6\u53cc\u63d2\u4ef6\u4e09\u5b9e\u73b0\u6536\u655b\uff09",
        fn: "lvxNlpParsePreviewBar({ tokens, summary, onApply, onCancelToken })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxNlpParsePreviewBar({
          tokens: [
            { text: "晨间深度阅读", type: "text" },
            { text: "今天 07:00", type: "date", value: "07:00" },
            { text: "30分钟", type: "num", value: "30" },
            { text: "#心流", type: "tag" },
          ],
          summary: "晨间深度阅读 · 今天 07:00 开始 · 时长 30 分钟 · 标签 #心流",
          onCancelToken: (i) => setLog("NLP: 取消 token #" + i),
          onApply: (tokens) => setLog("NLP: 采用 " + tokens.length + " 个识别项"),
        })
      );
        }
    },
    {
        id: 155,
        title: "155. \u61d2\u52a0\u8f7d\u6298\u53e0\u533a LazyAccordion\uff08\u751f\u6001\u5185\u6700\u9ad8\u9891\u5bb9\u5668\u6a21\u5f0f \u00b7 \u539f\u751f details \u96f6 CSS\uff09",
        fn: "lvxLazyAccordion({ title, count, badgeTone, open, render, onToggle })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const acc = K.lvxLazyAccordion({
        title: "需要处理的阻断项",
        count: 3,
        badgeTone: "danger",
        onToggle: (o) => setLog("Accordion: " + (o ? "展开（懒渲染触发）" : "收起")),
        render: () => [
          K.lvxListItem({ title: "附件缺失：会议纪要 v2", desc: "来源块已被删除，需重新挂载", suffix: K.lvxButton({ label: "修复", sm: true, onClick: () => setLog("修复 #1") }) }),
          K.lvxListItem({ title: "日期冲突：与周报重叠", desc: "建议顺延至周五", suffix: K.lvxButton({ label: "顺延", sm: true, onClick: () => setLog("修复 #2") }) }),
          K.lvxListItem({ title: "未分类：3 条新摘录", desc: "等待归档", suffix: K.lvxButton({ label: "归档", sm: true, onClick: () => setLog("修复 #3") }) }),
        ],
      });
      stage.appendChild(acc);
        }
    },
    {
        id: 156,
        title: "156. \u56fe\u6807\u9009\u62e9\u5668 IconPicker\uff08\u6765\u6e90\uff1a\u6253\u5361 editor.ts\u2014\u2014\u6e05\u5355\u7a7a\u767d\u521a\u9700\u4ef6\uff09",
        fn: "lvxIconPicker({ icons, value, size, onPick })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxIconPicker({
          size: 34,
          onPick: (key) => setLog("IconPicker: 选择 " + key),
          icons: [
            { key: "晨读", glyph: "🌅", category: "习惯" },
            { key: "跑步", glyph: "🏃", category: "习惯" },
            { key: "冥想", glyph: "🧘", category: "习惯" },
            { key: "账本", glyph: "📒", category: "管家" },
            { key: "清单", glyph: "📋", category: "管家" },
            { key: "复习", glyph: "🎴", category: "学习" },
            { key: "测验", glyph: "📝", category: "学习" },
            { key: "咖啡", glyph: "☕", category: "生活" },
            { key: "旅行", glyph: "✈️", category: "生活" },
            { key: "庆祝", glyph: "🎉", category: "生活" },
          ],
        })
      );
        }
    },
    {
        id: 157,
        title: "157. \u4e09\u6001\u8865\u5361\u77e9\u9635 MatrixBackfillGrid\uff08\u6765\u6e90\uff1a\u6253\u5361 review.ts\u2014\u2014Loop \u5f0f\u53ef\u5199\u56de\u6708\u5386\uff09",
        fn: "lvxMatrixBackfillGrid({ days, onChange, onSubmit })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxMatrixBackfillGrid({
          days: Array.from({ length: 14 }, (_, i) => {
            const d = 5 + i;
            const states = [1, 1, 0, 3, 1, 0, 1, 2, 1, 0, 1, 1, 0, 0];
            return { date: `2026-11-${String(d).padStart(2, "0")}`, label: `11月${d}日`, state: states[i] };
          }),
          onChange: (date, s) => setLog(`Matrix: ${date} → ${["未打卡", "已完成", "部分完成", "缺卡"][s]}`),
          onSubmit: (changes) => setLog(`Matrix: 提交 ${changes.length} 项修改`),
        })
      );
        }
    },
    {
        id: 158,
        title: "158. \u5065\u5eb7\u4f53\u68c0\u62a5\u544a\u9762\u677f HealthAuditPanel\uff08\u4eba\u8109/\u5e38\u7528/\u95ea\u5361\u4e09\u63d2\u4ef6\u6536\u655b\uff09",
        fn: "lvxHealthAuditPanel({ title, modules, scanning, onScan })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxHealthAuditPanel({
          title: "🩺 人脉库数据体检",
          modules: [
            { name: "档案完整性", state: "ok" },
            { name: "组织归属投影", state: "warn", message: "2 条成员关系缺少组织快照", onFix: () => setLog("修复: 组织投影") },
            { name: "互惠账本校验", state: "ok" },
            { name: "重复人物指纹", state: "error", message: "发现 1 组疑似重复（相似度 96%）", onFix: () => setLog("修复: 重复合并") },
          ],
          onScan: () => setLog("HealthAudit: 重新扫描"),
        })
      );
        }
    },
    {
        id: 159,
        title: "159. \u4e00\u6b21\u6027\u64a4\u9500\u72b6\u6001\u6761 UndoStrip\uff08\u96f7\u5207 snippet-stack / \u4eba\u8109 DashboardView \u6536\u655b\uff09",
        fn: "lvxUndoStrip({ message, durationMs, onUndo, onExpire }) \u2192 el.dismiss()",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const box = document.createElement("div");
      box.style.cssText = "display:flex;flex-direction:column;gap:10px;align-items:flex-start;";
      const b = document.createElement("button");
      b.className = "lvx-pill-btn";
      b.textContent = "🗑️ 模拟删除（触发撤销条）";
      b.onclick = () => {
        box.appendChild(K.lvxUndoStrip({ message: "已删除「分布式事务.md」的切片缓存", durationMs: 8000, onUndo: () => setLog("UndoStrip: 已撤销"), onExpire: () => setLog("UndoStrip: 已过期") }));
      };
      box.appendChild(b);
      stage.appendChild(box);
        }
    },
    {
        id: 160,
        title: "160. \u7248\u672c\u5dee\u5f02\u6e05\u5355 VersionDiffList\uff08\u6765\u6e90\uff1a\u96f7\u5207\u914d\u7f6e\u5305\u5dee\u5f02\uff0c\u96f6 CSS \u8bed\u4e49\u7248\uff09",
        fn: "lvxVersionDiffList({ added, removed, changed, currentTitle, targetTitle, onRollback })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxVersionDiffList({
          currentTitle: "v1.4.2",
          targetTitle: "v1.5.0",
          added: [{ label: "首页组件：数据源健康卡", meta: "新模块" }, { label: "快捷动作：一键灾备" }],
          removed: [{ label: "旧版悬浮球手势区" }],
          changed: [{ label: "罗盘弹窗高度", from: "560px", to: "600px" }, { label: "评分条间距", from: "4px", to: "6px" }],
          onRollback: () => setLog("VersionDiff: 回滚到 v1.4.2"),
        })
      );
        }
    },
    {
        id: 161,
        title: "161. \u884c\u524d\u6838\u5bf9\u6e05\u5355\u7f16\u8f91\u5668 ChecklistEditor\uff08\u6765\u6e90\uff1a\u4eba\u8109 PersonItinerary\uff0c\u96f6 CSS\uff09",
        fn: "lvxChecklistEditor({ items, max, placeholder, onChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxChecklistEditor({
          max: 10,
          placeholder: "添加行前核对项，回车确认",
          onChange: (items) => setLog(`Checklist: ${items.filter(i => i.done).length}/${items.length} 完成`),
          items: [
            { text: "确认投影转接头", done: true },
            { text: "打印纸质 agenda ×5", done: false },
          ],
        })
      );
        }
    },
    {
        id: 162,
        title: "162. \u5217\u8868\u5bc6\u5ea6\u5207\u6362 DensitySwitch\uff08\u6765\u6e90\uff1a\u5e38\u7528 dialog.ts\uff0c\u96f6 CSS\uff09",
        fn: "lvxDensitySwitch({ value, onChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const box = document.createElement("div");
      box.style.cssText = "display:flex;flex-direction:column;gap:10px;align-items:flex-start;";
      const list = document.createElement("div");
      list.style.cssText = "display:flex;flex-direction:column;gap:8px;width:100%;transition:gap .15s ease;";
      const mkRow = (t) => {
        const row = document.createElement("div");
        row.style.cssText = "display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid var(--lvx-border);border-radius:var(--lvx-r-sm);background:var(--lvx-surface);width:100%;";
        row.innerHTML = `<strong style="font-size:12px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${t}</strong>`;
        return row;
      };
      list.appendChild(mkRow("晨间深度阅读 30 分钟"));
      list.appendChild(mkRow("FSRS 到期卡片复习"));
      const sw = K.lvxDensitySwitch({ value: "cozy", onChange: (v) => {
        list.style.gap = v === "compact" ? "2px" : "8px";
        Array.from(list.children).forEach(c => c.style.padding = v === "compact" ? "3px 12px" : "10px 12px");
        setLog("Density: " + v);
      } });
      box.appendChild(sw);
      box.appendChild(list);
      stage.appendChild(box);
        }
    },
    {
        id: 163,
        title: "163. \u6587\u5185\u67e5\u627e\u6761 FindBar\uff08\u62fe\u9057 ReaderSearch / \u96f7\u5207 doc-preview-find \u6536\u655b\uff09",
        fn: "lvxFindBar({ total, current, caseSensitive, onQuery, onNext, onPrev, onClose })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            let cur = 2, total = 17;
      const host = document.createElement("div");
      host.style.cssText = "display:flex;flex-direction:column;gap:10px;align-items:flex-start;";
      const bar = K.lvxFindBar({
        total, current: cur,
        onQuery: (q) => { total = q ? Math.max(1, Math.min(40, Math.round(q.length * 2.4))) : 0; bar.refresh(total); setLog(`FindBar: 查询「${q}」`); },
        onNext: () => { cur = (cur % Math.max(1, total)) + 1; bar.refresh(total, cur); setLog("FindBar: 下一个 " + cur); },
        onPrev: () => { cur = ((cur - 2 + Math.max(1, total)) % Math.max(1, total)) + 1; bar.refresh(total, cur); setLog("FindBar: 上一个 " + cur); },
        onClose: () => { document.querySelector(".lvx-findbar")?.remove(); host.appendChild(reopen); setLog("FindBar: 已关闭"); },
      });
      bar.refresh = (t, c) => {
        const cnt = bar.querySelector("[role='status']");
        if (cnt) cnt.textContent = t && c !== undefined ? `${c}/${t}` : (t ? `0/${t}` : "");
      };
      const reopen = document.createElement("button");
      reopen.className = "lvx-pill-btn";
      reopen.textContent = "🔍 重新打开查找条";
      reopen.onclick = () => { reopen.remove(); host.appendChild(bar); };
      host.appendChild(bar);
      stage.appendChild(host);
        }
    },
    {
        id: 164,
        title: "164. \u547d\u540d\u7b5b\u9009\u89c6\u56fe\u6761 SavedViewBar\uff08\u4eba\u8109/\u95ea\u5361/\u7ba1\u5bb6/\u6253\u5361\u2014\u2014\u56db\u4ed3\u91cd\u590d\u5b9e\u73b0\u6536\u655b\uff09",
        fn: "lvxSavedViewBar({ views, active, onActivate, onSave, onDelete })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxSavedViewBar({
          views: [{ id: "v1", name: "全部薄弱" }, { id: "v2", name: "本周到期" }, { id: "v3", name: "高权重" }],
          active: "v1",
          onActivate: (id) => setLog("SavedView: 激活 " + id),
          onSave: (name) => setLog("SavedView: 保存「" + name + "」"),
          onDelete: (id) => setLog("SavedView: 删除 " + id),
        })
      );
        }
    },
    {
        id: 165,
        title: "165. AI \u82cf\u683c\u62c9\u5e95\u5bf9\u8bdd\u6d41 ChatThread\uff08\u8003\u8bd5 SocraticGuidanceModal \u00d7 Vercel AI Elements Message/Reasoning \u5bf9\u6807\uff09",
        fn: "lvxChatThread({ messages, thinking, avatarGlyph, maxHeight })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxChatThread({
          title: "苏格拉底追问：Raft 选举",
          thinking: true,
          messages: [
            { role: "user", text: "为什么 Raft 要用随机选举超时而不是固定超时？", ts: "14:02" },
            {
              role: "assistant",
              text: "好问题。先想一个反例：如果所有节点用相同的固定超时，脑裂恢复后它们会同时发起投票——每一轮都无人过半。随机化把「同时」打散成「几乎总有一个先醒」。\n追问：那随机范围应该设多宽？",
              reasoning: "先构造固定超时的失败场景 → 引出随机化的本质作用（去同步）→ 抛出范围权衡的追问，保持 Socratic 而非直接给答案。",
              ts: "14:02",
            },
            { role: "user", text: "太窄会频繁选不出 Leader，太宽会延长空窗期？", ts: "14:03" },
          ],
        })
      );
        }
    },
    {
        id: 166,
        title: "166. \u9605\u8bfb\u8fdb\u5ea6\u6761 ReadingProgress\uff08\u62fe\u9057 ReaderTab \u00d7 Magic UI Scroll Progress \u5bf9\u6807\uff09",
        fn: "lvxReadingProgress({ container, totalMinutes, height }) \u2192 el.refresh()",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const frame = document.createElement("div");
      frame.style.cssText = "position:relative;height:180px;overflow:auto;border:1px solid var(--lvx-border);border-radius:var(--lvx-r-md);padding:14px;";
      for (let i = 1; i <= 8; i++) {
        const p = document.createElement("p");
        p.style.cssText = "font-size:12px;color:var(--lvx-text);line-height:1.7;margin:0 0 10px;";
        p.textContent = `第 ${i} 段：渐进阅读的核心是把「一次读完」拆成多次「带问题的掠过」。每一遍你都带着新的问题回来，旧知识被反复激活……`;
        frame.appendChild(p);
      }
      const prog = K.lvxReadingProgress({ totalMinutes: 12 });
      frame.style.position = "relative";
      prog.querySelectorAll(":scope > div, :scope > div div").forEach(el => { el.style.position = "absolute"; });
      frame.appendChild(prog);
      stage.appendChild(frame);
        }
    },
    {
        id: 167,
        title: "167. \u5934\u50cf\u88c1\u526a\u7f16\u8f91\u5668 AvatarCropper\uff08\u6253\u5361 + \u7ba1\u5bb6\u53cc\u4ed3 canvas \u5b9e\u73b0\u6536\u655b\uff09",
        fn: "lvxAvatarCropper({ src, size, outputSize, onConfirm, onCancel })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const cv = document.createElement("canvas");
      cv.width = 120; cv.height = 120;
      const c2 = cv.getContext("2d");
      const g = c2.createLinearGradient(0, 0, 120, 120);
      g.addColorStop(0, "#6a6ee0"); g.addColorStop(1, "#f59e0b");
      c2.fillStyle = g; c2.fillRect(0, 0, 120, 120);
      c2.fillStyle = "#fff"; c2.font = "bold 40px system-ui"; c2.textAlign = "center"; c2.fillText("🐴", 60, 76);
      stage.appendChild(
        K.lvxAvatarCropper({ src: cv.toDataURL(), size: 150, outputSize: 64, onConfirm: (dataUrl) => setLog("AvatarCropper: 导出 " + Math.round(dataUrl.length / 1024) + "KB"), onCancel: () => setLog("AvatarCropper: 取消") })
      );
        }
    },
    {
        id: 168,
        title: "168. \u79fb\u52a8\u7aef\u5e95\u90e8\u5bfc\u822a\u680f BottomTabBar\uff08\u95ea\u5361 hub / \u96f7\u5207 mobile-switcher / \u8003\u8bd5 Rail\u2014\u2014\u4e09\u4ed3\u6536\u655b\uff09",
        fn: "lvxBottomTabBar({ tabs, active, onSelect })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const frame = document.createElement("div");
      frame.style.cssText = "position:relative;height:130px;overflow:hidden;border-radius:var(--lvx-r-md);border:1px solid var(--lvx-border);background:var(--lvx-surface-sunken);";
      frame.appendChild(
        K.lvxBottomTabBar({
          active: "review",
          onSelect: (k) => setLog("BottomTab: " + k),
          tabs: [
            { key: "home", label: "首页", icon: "🏠" },
            { key: "review", label: "复习", icon: "🎴", badge: 3 },
            { key: "stats", label: "统计", icon: "📊" },
            { key: "me", label: "我的", icon: "👤" },
          ],
        })
      );
      stage.appendChild(frame);
        }
    },
    {
        id: 169,
        title: "169. \u4e8c\u7ef4\u7801\u6df1\u94fe\u6807\u7b7e\u5361 QrCodeCard\uff08\u6765\u6e90\uff1a\u7ba1\u5bb6 core/qr \u96f6\u4f9d\u8d56 QR + \u6279\u91cf\u6253\u5370\u6807\u7b7e\uff09",
        fn: "lvxQrCodeCard({ dataUrl, label, sublabel, tip, size })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const cv = document.createElement("canvas"); cv.width = 33; cv.height = 33;
      const c2 = cv.getContext("2d");
      c2.fillStyle = "#fff"; c2.fillRect(0, 0, 33, 33); c2.fillStyle = "#1c1b26";
      let seed = 42;
      const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let y = 0; y < 33; y++) for (let x = 0; x < 33; x++) if (rnd() > 0.52) c2.fillRect(x, y, 1, 1);
      c2.fillStyle = "#1c1b26"; c2.fillRect(0, 0, 7, 7); c2.fillRect(26, 0, 7, 7); c2.fillRect(0, 26, 7, 7);
      c2.fillStyle = "#fff"; c2.fillRect(1, 1, 5, 5); c2.fillRect(27, 1, 5, 5); c2.fillRect(1, 27, 5, 5);
      c2.fillStyle = "#1c1b26"; c2.fillRect(2, 2, 3, 3); c2.fillRect(28, 2, 3, 3); c2.fillRect(2, 28, 3, 3);
      stage.appendChild(
        K.lvxQrCodeCard({ dataUrl: cv.toDataURL(), label: "储物柜 A-12 · 深链标签", sublabel: "siyuan://blocks/20261118-xxxx", tip: "📱 思源扫码直达 · 无需网络" })
      );
        }
    },
    {
        id: 170,
        title: "170. \u5468\u89c8\u65e5\u7a0b\u6761 WeekGlanceStrip\uff08\u6765\u6e90\uff1a\u4eba\u8109 dashboard \u5468\u7a0b\u89c8\uff09",
        fn: "lvxWeekGlanceStrip({ days, onDayClick })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxWeekGlanceStrip({
          onDayClick: (i) => setLog("WeekGlance: 点击第 " + (i + 1) + " 天"),
          days: [
            { label: "周一", date: "16", items: [{ time: "09:00", title: "站会", tone: "brand" }] },
            { label: "周二", date: "17", items: [{ time: "14:00", title: "客户回访 · 王总", tone: "energy" }, { time: "19:00", title: "健身", tone: "success" }] },
            { label: "周三", date: "18", isToday: true, items: [{ time: "10:00", title: "季度对账", tone: "brand" }, { time: "15:30", title: "面试候选人", tone: "danger" }, { time: "18:00", title: "家庭聚餐", tone: "success" }, { time: "20:00", title: "复盘", tone: "brand" }, { time: "21:00", title: "阅读" }] },
            { label: "周四", date: "19", items: [] },
          ],
        })
      );
        }
    },
    {
        id: 171,
        title: "171. \u5f80\u65e5\u56de\u5fc6\u5361 OnThisDayCard\uff08\u6765\u6e90\uff1a\u4eba\u8109 dashboard \u300cX \u5e74\u524d\u7684\u4eca\u5929\u300d\uff09",
        fn: "lvxOnThisDayCard({ yearsAgo, title, excerpt, date, actionLabel, onAction })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxOnThisDayCard({
          yearsAgo: 2,
          title: "与李总达成首个合作协议",
          excerpt: "两年前的今天，我们在咖啡厅敲定了框架条款。当时约定的「季度互访」一共执行了 7 次——要不要顺理成章地约一下第 8 次？",
          date: "2024-11-19",
          actionLabel: "💌 发起问候",
          onAction: () => setLog("OnThisDay: 发起问候"),
        })
      );
        }
    },
    {
        id: 172,
        title: "172. \u672a\u6765 7 \u65e5\u8d1f\u8f7d\u9884\u62a5\u67f1 ForecastBars\uff08\u6765\u6e90\uff1a\u95ea\u5361 dashboard \u5230\u671f\u8d1f\u8f7d\u9884\u62a5\uff09",
        fn: "lvxForecastBars({ days, cap, height })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxForecastBars({
          cap: 50,
          days: [
            { label: "周三", isToday: true, dueNew: 8, dueReview: 30 },
            { label: "周四", isTomorrow: true, dueNew: 12, dueReview: 34 },
            { label: "周五", dueNew: 6, dueReview: 20 },
            { label: "周六", dueNew: 4, dueReview: 8 },
            { label: "周日", dueNew: 0, dueReview: 0 },
            { label: "下周一", dueNew: 15, dueReview: 38 },
          ],
        })
      );
        }
    },
    {
        id: 173,
        title: "173. \u53cc\u7ebf\u7559\u5b58\u66f2\u7ebf\u5361 LineCurveCard\uff08\u6765\u6e90\uff1a\u95ea\u5361 dashboard \u8bb0\u5fc6\u7559\u5b58\u66f2\u7ebf\uff09",
        fn: "lvxLineCurveCard({ title, actual, theoretical, labels, unit, subtitle })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxLineCurveCard({
          title: "📈 记忆留存曲线（FSRS 对标）",
          actual: [100, 96, 91, 88, 86, 85],
          theoretical: [100, 93, 88, 85, 83, 82],
          labels: ["复习日", "+1d", "+3d", "+7d", "+14d", "+30d"],
          unit: "%",
          subtitle: "实测高于理论 3.2 个百分点 · 遗忘行为 2 次",
        })
      );
        }
    },
    {
        id: 174,
        title: "174. Agent \u6267\u884c\u8f68\u8ff9\u5361 AgentTrace\uff08\u5bf9\u6807 shadcn AI Elements\u300cTrace\u300d2026-10\uff09",
        fn: "lvxAgentTrace({ title, steps })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxAgentTrace({
          title: "🤖 AI 切片执行轨迹 · 《分布式事务》",
          steps: [
            { label: "解析文档结构", status: "done", duration: "0.8s", detail: "识别 H2 ×4 / 段落 12 / 代码块 2" },
            { label: "生成原子切片", status: "done", duration: "3.2s", detail: "产出 8 个候选切片" },
            { label: "自检与去重", status: "running", detail: "与既有卡组比对相似度…" },
            { label: "生成配套闪卡", status: "pending" },
            { label: "写入目标笔记本", status: "pending" },
          ],
        })
      );
        }
    },
    {
        id: 175,
        title: "175. \u7ffb\u8f6c\u9884\u89c8\u5361 FlipPreviewCard\uff08\u95ea\u5361 question-attr-dialog / quick-card / marketplace \u4e09\u5904\u6536\u655b\uff09",
        fn: "lvxFlipPreviewCard({ front, back, frontLabel, backLabel, height, onFlip }) \u2192 el.flip()",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxFlipPreviewCard({
          front: "Q：Raft 中 Lease Read 解决了什么问题？",
          back: "A：避免脑裂期间 Follower 返回过时数据——Leader 用租约时效保证线性一致读，租约内可以不走日志直接读。",
          frontLabel: "正面 · 问题",
          backLabel: "背面 · 答案",
          height: 140,
          onFlip: (f) => setLog("FlipCard: " + (f ? "翻到背面" : "回到正面")),
        })
      );
        }
    },
    {
        id: 176,
        title: "176. \u7b54\u9898\u5361\u77e9\u9635 AnswerSheetGrid\uff08\u8003\u8bd5 SessionSheet + MockTab \u673a\u8bfb\u6d82\u5361\u53cc\u5f62\u6001\u6536\u655b\uff09",
        fn: "lvxAnswerSheetGrid({ questions, columns, onJump })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const states = ["correct", "correct", "wrong", "unanswered", "current", "correct", "wrong", "unanswered", "correct", "unanswered", "unanswered", "unanswered"];
      stage.appendChild(
        K.lvxAnswerSheetGrid({
          columns: 6,
          onJump: (id) => setLog("AnswerSheet: 跳转第 " + id + " 题"),
          questions: states.map((s, i) => ({ id: String(i + 1), label: String(i + 1), state: s })),
        })
      );
        }
    },
    {
        id: 177,
        title: "177. \u91cf\u89c4\u81ea\u8bc4\u5361 RubricScoringCard\uff08\u6765\u6e90\uff1a\u8003\u8bd5 PracticeSessionView \u91c7\u5206\u70b9\u8bc4\u6d4b\uff09",
        fn: "lvxRubricScoringCard({ title, maxPoints, levels, picked, onScore })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const box = document.createElement("div");
      box.style.cssText = "display:flex;flex-direction:column;gap:8px;width:100%;";
      const mk = (t, mp) => K.lvxRubricScoringCard({
        title: t, maxPoints: mp,
        levels: [
          { key: "full", label: "完整采分", score: mp },
          { key: "partial", label: "部分采分", score: Math.ceil(mp / 2) },
          { key: "mention", label: "仅提及", score: 1 },
          { key: "miss", label: "未提及", score: 0 },
        ],
        onScore: (key, score) => setLog(`Rubric: 「${t}」评 ${score} 分`),
      });
      box.appendChild(mk("要点 1：提出租约机制", 4));
      box.appendChild(mk("要点 2：多数派日志追平", 3));
      stage.appendChild(box);
        }
    },
    {
        id: 178,
        title: "178. \u7f6e\u4fe1\u00d7\u7ed3\u679c\u56db\u8c61\u9650 ConfidenceQuadrant\uff08\u6765\u6e90\uff1a\u8003\u8bd5 ReportTab \u5143\u8ba4\u77e5\u590d\u76d8\uff09",
        fn: "lvxConfidenceQuadrant({ cells, unit })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxConfidenceQuadrant({
          unit: " 题",
          cells: [
            { key: "cc", label: "自信且答对", sublabel: "真实掌握", count: 28, tone: "success", onClick: () => setLog("Quadrant: 下钻自信答对") },
            { key: "cw", label: "自信却答错", sublabel: "⚠ 盲区题目", count: 4, tone: "danger", onClick: () => setLog("Quadrant: 下钻盲区") },
            { key: "uc", label: "犹豫且答对", sublabel: "侥幸得分", count: 9, tone: "energy", onClick: () => setLog("Quadrant: 下钻侥幸") },
            { key: "uw", label: "犹豫且答错", sublabel: "已知薄弱", count: 11, tone: "neutral", onClick: () => setLog("Quadrant: 下钻薄弱") },
          ],
        })
      );
        }
    },
    {
        id: 179,
        title: "179. \u4fdd\u5b58\u56de\u6267\u80f6\u56ca SaveStatePill\uff08\u6765\u6e90\uff1a\u8003\u8bd5 shared/SaveStatus \u4e09\u6001\u6c47\u603b\uff09",
        fn: "lvxSaveStatePill({ state, failedCount, onClick })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const box = document.createElement("div");
      box.style.cssText = "display:flex;flex-direction:column;gap:10px;align-items:flex-start;";
      for (const st of ["saved", "pending", "failed", "unknown"]) {
        box.appendChild(K.lvxSaveStatePill({ state: st, failedCount: st === "failed" ? 2 : undefined, onClick: () => setLog("SaveState: 查看 " + st + " 明细") }));
      }
      stage.appendChild(box);
        }
    },
    {
        id: 180,
        title: "180. \u5438\u5e95\u4fdd\u5b58\u680f StickySaveBar\uff08\u6765\u6e90\uff1a\u95ea\u5361 settings\u2014\u2014dirty \u70b9 + Esc/Ctrl+Enter\uff09",
        fn: "lvxStickySaveBar({ dirty, message, onSave, onCancel })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const box = document.createElement("div");
      box.style.cssText = "display:flex;flex-direction:column;gap:10px;align-items:flex-start;";
      let dirty = true;
      let bar = K.lvxStickySaveBar({
        dirty, message: "3 个字段有未保存的更改",
        onSave: () => { dirty = false; refresh(); setLog("StickySave: 已保存"); },
        onCancel: () => { dirty = false; refresh(); setLog("StickySave: 已取消"); },
      });
      const refresh = () => {
        const fresh = K.lvxStickySaveBar({
          dirty, message: "3 个字段有未保存的更改",
          onSave: () => { dirty = false; refresh(); setLog("StickySave: 已保存"); },
          onCancel: () => { dirty = false; refresh(); setLog("StickySave: 已取消"); },
        });
        bar.replaceWith(fresh); bar = fresh;
      };
      box.appendChild(bar);
      stage.appendChild(box);
        }
    },
    {
        id: 181,
        title: "181. \u5206\u9762\u5bfc\u822a\u4fa7\u680f FacetRail\uff08\u62fe\u9057 LibraryRailGroup + \u4eba\u8109 PeopleView \u5206\u9762\u6536\u655b\uff09",
        fn: "lvxFacetRail({ groups, activeKeys, onToggle })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxFacetRail({
          activeKeys: ["weread"],
          onToggle: (key) => setLog("FacetRail: 切换 " + key),
          groups: [
            { name: "来源", facets: [{ key: "weread", label: "微信读书", count: 42 }, { key: "clip", label: "网页剪藏", count: 17 }, { key: "pdf", label: "PDF 标注", count: 9 }] },
            { name: "状态", facets: [{ key: "fresh", label: "新捕获", count: 6 }, { key: "reviewed", label: "已阅", count: 58 }] },
          ],
        })
      );
        }
    },
    {
        id: 182,
        title: "182. \u884c\u5185\u5dee\u5f02\u89c6\u56fe InlineDiff\uff08\u95ea\u5361 card-detail + \u62fe\u9057 Formatting \u6536\u655b\uff09",
        fn: "lvxInlineDiff({ rows, title })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxInlineDiff({
          title: "卡片 v1 → v2 差异",
          rows: [
            { kind: "same", text: "Raft 通过 Leader 日志复制保证一致性。" },
            { kind: "del", text: "Leader 挂了就重新投票。" },
            { kind: "add", text: "Leader 异常时由任期号最新者发起竞选，随机超时避免选票瓜分。" },
            { kind: "add", text: "Lease Read 在租约内跳过日志直接读。" },
          ],
        })
      );
        }
    },
    {
        id: 183,
        title: "183. \u5065\u5eb7\u5ea6\u78c1\u8d34 HealthTile\uff08\u6765\u6e90\uff1a\u95ea\u5361 hub R54 \u5065\u5eb7\u5ea6\u78c1\u8d34\uff0c\u96f6 CSS\uff09",
        fn: "lvxHealthTile({ title, state, detail, onClick })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const grid = document.createElement("div");
      grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;width:100%;";
      grid.appendChild(K.lvxHealthTile({ title: "本地索引", state: "good", detail: "上次校验 3 分钟前 · 0 冲突", onClick: () => setLog("HealthTile: 打开本地索引") }));
      grid.appendChild(K.lvxHealthTile({ title: "云端同步", state: "warn", detail: "2 个文档待冲突解决", onClick: () => setLog("HealthTile: 打开云端同步") }));
      grid.appendChild(K.lvxHealthTile({ title: "插件桥接", state: "bad", detail: "小驴管家未响应", onClick: () => setLog("HealthTile: 打开插件桥接") }));
      stage.appendChild(grid);
        }
    },
    {
        id: 184,
        title: "184. AI \u63d0\u793a\u8f93\u5165\u7aef PromptInput\uff08\u5bf9\u6807 shadcn AI Elements Prompt Input \u00d7 \u7ba1\u5bb6 Quick-Add Magic\uff09",
        fn: "lvxPromptInput({ placeholder, models, canAttach, onSend, onAttach })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxPromptInput({
          placeholder: "描述你要生成的笔记或卡片...",
          models: [{ key: "v3", label: "DeepSeek v3" }, { key: "glm", label: "GLM-4" }, { key: "kimi", label: "Kimi" }],
          canAttach: true,
          onSend: (text, model) => setLog(`PromptInput: 发送至 ${model}`),
          onAttach: () => setLog("PromptInput: 附加文件"),
        })
      );
        }
    },
    {
        id: 185,
        title: "185. AI \u5de5\u5177\u8c03\u7528\u5361 ToolCallCard\uff08\u5bf9\u6807 shadcn AI Elements\u300cTool\u300d\uff09",
        fn: "lvxToolCallCard({ toolName, argsPreview, resultPreview, status, duration })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const box = document.createElement("div");
      box.style.cssText = "display:flex;flex-direction:column;gap:6px;width:100%;";
      for (const s of ["success", "running", "failed"]) {
        box.appendChild(K.lvxToolCallCard({
          toolName: s === "success" ? "siyuan_search" : s === "running" ? "ai_generate" : "block_move",
          argsPreview: s === "success" ? '{"query":"Raft Lease Read","limit":10}' : '{"prompt":"生成切片"}',
          resultPreview: s === "success" ? '{"blocks":10,"hits":8}' : s === "failed" ? '{"error":"timeout"}' : undefined,
          status: s,
          duration: s === "success" ? "0.4s" : s === "failed" ? "5.0s" : undefined,
        }));
      }
      stage.appendChild(box);
        }
    },
    {
        id: 186,
        title: "186. Agent \u8ba1\u5212\u5ba1\u6279\u5361 AgentPlanCard\uff08\u5bf9\u6807 shadcn AI Elements\u300cPlan\u300d\uff09",
        fn: "lvxAgentPlanCard({ title, steps, onApprove, onReject })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxAgentPlanCard({
          title: "📋 AI 切片计划 · 4 步",
          onApprove: () => setLog("Plan: 批准执行"),
          onReject: () => setLog("Plan: 已取消"),
          steps: [
            { label: "扫描笔记本《分布式系统》", detail: "预计 3.2k 字 · 12 段落" },
            { label: "生成原子化切片", detail: "预估 8 个候选切片" },
            { label: "比对既有卡组去重", detail: "阈值 85%" },
            { label: "写入目标卡包", detail: "写入「系统架构设计师」" },
          ],
        })
      );
        }
    },
    {
        id: 187,
        title: "187. AI \u6765\u6e90\u5f15\u7528\u5217\u8868 SourceList\uff08\u5bf9\u6807 shadcn AI Elements Sources\uff09",
        fn: "lvxSourceList({ sources, title })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxSourceList({
          title: "本回答引用来源",
          sources: [
            { title: "Raft 论文 §5.2 Leader Election", url: "https://raft.github.io", snippet: "随机选举超时建议范围 150-300ms，避免选票瓜分。" },
            { title: "思源笔记 API 文档", url: "https://docs.siyuan.note", snippet: "getBlockKramdown 接口用于读取块的 Markdown 源码。" },
          ],
        })
      );
        }
    },
    {
        id: 188,
        title: "188. \u7a97\u53e3\u5316\u5f39\u7a97 WindowedDialog\uff08\u6765\u6e90\uff1a\u6253\u5361 quick-dialog \u516b\u5411\u7f29\u653e + \u6807\u9898\u62d6\u52a8 + \u53cc\u51fb\u6700\u5927\u5316\uff09",
        fn: "lvxWindowedDialog({ title, width, height, content, onClose })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const frame = document.createElement("div");
      frame.style.cssText = "position:relative;height:200px;overflow:hidden;border-radius:var(--lvx-r-md);border:1px solid var(--lvx-border);background:var(--lvx-surface-sunken);";
      frame.appendChild(K.lvxWindowedDialog({
        title: "📝 快速录入",
        width: 360, height: 160,
        content: [K.lvxInput({ placeholder: "输入内容...", style: { width: "100%" } }), K.lvxButton({ label: "保存", sm: true, variant: "primary", block: true, onClick: () => setLog("WindowedDialog: 保存") })],
        onClose: () => setLog("WindowedDialog: 已关闭"),
      }));
      stage.appendChild(frame);
        }
    },
    {
        id: 189,
        title: "189. \u5468\u671f\u73af\u6bd4\u5bf9\u6bd4\u5361 PeriodCompareCard\uff08\u6765\u6e90\uff1a\u6253\u5361 review-compare \u5f53\u671f vs \u57fa\u7ebf\u53cc\u6761+\u5dee\u503c\uff09",
        fn: "lvxPeriodCompareCard({ title, metrics })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxPeriodCompareCard({
          title: "📊 本周 vs 上周 复盘",
          metrics: [
            { label: "完成天数", current: 6, baseline: 5, unit: "天", higherBetter: true },
            { label: "连续天数", current: 21, baseline: 18, unit: "天", higherBetter: true },
            { label: "心流指数", current: 91, baseline: 94, unit: "%", higherBetter: true },
            { label: "遗漏次数", current: 1, baseline: 2, unit: "次", higherBetter: false },
          ],
        })
      );
        }
    },
    {
        id: 190,
        title: "190. AI \u5efa\u8bae\u53d8\u66f4\u5ba1\u9605\u5361 SuggestionWorkflowCard\uff08\u6765\u6e90\uff1a\u6253\u5361 suggestion-workflow before\u2192after\uff09",
        fn: "lvxSuggestionWorkflowCard({ title, changes, onConfirm, onCancel })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxSuggestionWorkflowCard({
          title: "🔄 AI 优化建议（3 项变更）",
          onConfirm: () => setLog("Suggestion: 确认全部变更"),
          onCancel: () => setLog("Suggestion: 已放弃"),
          changes: [
            { field: "reminder_time", before: "08:00", after: "07:30（提前避开通勤高峰）" },
            { field: "goal_days", before: "30", after: "45（按当前进度重算）" },
            { field: "difficulty", before: "medium", after: "easy（连续遗漏 2 天）" },
          ],
        })
      );
        }
    },
    {
        id: 191,
        title: "191. CSV \u5217\u6620\u5c04\u5411\u5bfc ColumnMapperWizard\uff08\u6765\u6e90\uff1a\u5e38\u7528 csv-tsv-wizard \u5b57\u6bb5\u6620\u5c04\u7f51\u683c\uff09",
        fn: "lvxColumnMapperWizard({ columns, targets, onChange, onImport })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxColumnMapperWizard({
          columns: [
            { key: "c0", label: "列 1（标题）", sample: "Raft 算法原理" },
            { key: "c1", label: "列 2（内容）", sample: "分布式共识协议..." },
            { key: "c2", label: "列 3（标签）", sample: "算法,面试" },
          ],
          targets: [
            { key: "title", label: "标题" },
            { key: "content", label: "正文" },
            { key: "tags", label: "标签" },
            { key: "deck", label: "目标卡包" },
          ],
          mapped: { c0: "title" },
          onChange: (m) => setLog("ColumnMapper: 映射更新"),
          onImport: (m) => setLog("ColumnMapper: 开始导入 " + JSON.stringify(m)),
        })
      );
        }
    },
    {
        id: 192,
        title: "192. \u884c\u5185\u5355\u5143\u683c\u7f16\u8f91\u5668 InlineCellEditor\uff08\u6765\u6e90\uff1a\u7ba1\u5bb6 inline-edit input/textarea \u5c31\u5730\u7f16\u8f91\uff09",
        fn: "lvxInlineCellEditor({ value, type, onSave, onCancel })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const box = document.createElement("div");
      box.style.cssText = "display:flex;flex-direction:column;gap:10px;align-items:flex-start;";
      box.appendChild(K.lvxInlineCellEditor({ value: "Raft 算法原理", onSave: (v) => setLog("CellEdit: 保存为 " + v) }));
      stage.appendChild(box);
        }
    },
    {
        id: 193,
        title: "193. \u516c\u519c\u5386\u65e5\u671f\u57df LunarDateField\uff08\u6765\u6e90\uff1a\u4eba\u8109 BirthdayField \u516c/\u519c\u5386\u5207\u6362 + \u4e09 select\uff09",
        fn: "lvxLunarDateField({ label, isLunar, year, month, day, onChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxLunarDateField({
          label: "生日",
          isLunar: false,
          onChange: (v) => setLog(`LunarDate: ${v.isLunar ? "农历" : "公历"} ${v.year || "-"}-${v.month || "-"}-${v.day || "-"}`),
        })
      );
        }
    },
    {
        id: 194,
        title: "194. \u8981\u7d20\u5c31\u7eea\u80f6\u56ca\u6761 ReadinessCheckBar\uff08\u95ea\u5361 quick-card \u5236\u5361\u5c31\u7eea / \u8003\u8bd5 \u7ec4\u5377\u9884\u68c0\uff09",
        fn: "lvxReadinessCheckBar({ items, onFocusField })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxReadinessCheckBar({
          items: [
            { key: "stem", label: "题目正文", ready: true },
            { key: "answer", label: "参考答案", ready: true },
            { key: "deck", label: "目标卡包", ready: true },
            { key: "tags", label: "分类标签", ready: false, optional: true },
            { key: "analysis", label: "考点解析", ready: false },
          ],
          onFocusField: (k) => setLog(`Readiness: 聚焦并跳转到 [${k}] 输入域`),
        })
      );
        }
    },
    {
        id: 195,
        title: "195. \u8bed\u97f3/\u6717\u8bfb\u6ce2\u5f62\u63a7\u5236\u6761 AudioWaveBar\uff08\u62fe\u9057 TTS \u6717\u8bfb / \u8003\u8bd5 \u542c\u529b\u53e3\u8bed \u00b7 \u5bf9\u6807 Magic UI Sound Wave\uff09",
        fn: "lvxAudioWaveBar({ title, durationSec, currentSec, isPlaying, speed, onPlayToggle, onSeek, onSpeedChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxAudioWaveBar({
          title: "英语口语跟读示范 · 《经济学人精读》",
          durationSec: 185,
          currentSec: 42,
          isPlaying: false,
          speed: 1.0,
          onPlayToggle: (p) => setLog("AudioWave: " + (p ? "正在播放 ▶" : "已暂停 ⏸")),
          onSeek: (s) => setLog(`AudioWave: 跳转到 ${s} 秒`),
          onSpeedChange: (spd) => setLog(`AudioWave: 切换倍速至 ${spd}x`),
        })
      );
        }
    },
    {
        id: 196,
        title: "196. \u4e09\u6570\u8054\u52a8\u4e92\u7b97\u8868\u5355 LinkedCalcFields\uff08\u6765\u6e90\uff1a\u7ba1\u5bb6 quick-event-flow \u8bb0\u8d26\u91d1\u989d\u2194\u6570\u91cf\u2194\u5355\u4ef7\uff09",
        fn: "lvxLinkedCalcFields({ total, quantity, unitPrice, totalLabel, quantityLabel, unitPriceLabel, onChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxLinkedCalcFields({
          total: 360,
          quantity: 45,
          unitPrice: 8,
          totalLabel: "加油总额 (¥)",
          quantityLabel: "加油升数 (L)",
          unitPriceLabel: "实时单价 (¥/L)",
          onChange: (v) => setLog(`LinkedCalc: 总额 ¥${v.total} = ${v.quantity}L × ¥${v.unitPrice}/L`),
        })
      );
        }
    },
    {
        id: 197,
        title: "197. \u667a\u80fd\u62bd\u53d6\u56de\u586b\u5ba1\u9605\u5217\u8868 ExtractionReviewList\uff08\u4eba\u8109 QuickFill / \u62fe\u9057 Formatting / \u95ea\u5361 AI \u62bd\u53d6\uff09",
        fn: "lvxExtractionReviewList({ title, items, onToggleCheck, onApply })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxExtractionReviewList({
          title: "AI 名片信息自动识别审阅",
          items: [
            { key: "name", label: "姓名", value: "李云峰", original: "小李", confidence: "high" },
            { key: "org", label: "公司机构", value: "开源基础软件研究院", confidence: "high" },
            { key: "role", label: "主要职务", value: "分布式系统技术负责人", confidence: "high" },
            { key: "phone", label: "移动电话", value: "138-0010-8888", confidence: "high" },
            { key: "email", label: "工作邮箱", value: "yunfeng@openfoundation.org", confidence: "medium" },
            { key: "note", label: "往来备忘", value: "曾在 2024 年架构师峰会交流 Raft 租约读方案", confidence: "medium" },
          ],
          onToggleCheck: (k, c) => setLog(`Extraction: 字段 [${k}] 勾选状态变为 ${c}`),
          onApply: (items) => setLog(`Extraction: 确认回填 ${items.length} 个字段`),
        })
      );
        }
    },
    {
        id: 198,
        title: "198. \u5feb\u901f\u9884\u8bbe\u5feb\u586b\u6761 QuickPresetChips\uff08\u7ba1\u5bb6 quick-event-flow \u91d1\u989d\u5feb\u586b / \u5e38\u7528 \u5e38\u7528\u8bed\u9884\u8bbe\uff09",
        fn: "lvxQuickPresetChips({ presets, value, customLabel, onSelect, onAddCustom })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxQuickPresetChips({
          value: 100,
          presets: [
            { label: "¥20", value: 20 },
            { label: "¥50", value: 50 },
            { label: "¥100", value: 100 },
            { label: "¥200", value: 200 },
            { label: "¥500", value: 500 },
            { label: "¥1000", value: 1000 },
          ],
          onSelect: (v) => setLog(`PresetChips: 选中预设值 [${v}]`),
          onAddCustom: (c) => setLog(`PresetChips: 新增自定义预设 [${c}]`),
        })
      );
        }
    },
    {
        id: 199,
        title: "199. \u5468\u5ea6\u8d1f\u8377\u70b9\u9635\u89c4\u5212\u5361 WeekLoadGrid\uff08\u6253\u5361 fragments \u4e60\u60ef\u6392\u671f / \u8003\u8bd5 7\u65e5\u5907\u8003\u51b2\u523a\uff09",
        fn: "lvxWeekLoadGrid({ title, items, weekLabels })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxWeekLoadGrid({
          title: "🗓️ 本周习惯与冲刺规划点阵",
          items: [
            { name: "晨间深度阅读", days: [true, true, true, true, true, false, false] },
            { name: "FSRS 闪卡复习", days: [true, true, true, true, true, true, true] },
            { name: "全真模拟卷训练", days: [false, true, false, true, false, true, false] },
            { name: "核心人脉周度回访", days: [false, false, true, false, false, false, false] },
            { name: "全库灾备快照复核", days: [false, false, false, false, true, false, false] },
          ],
        })
      );
        }
    },
    {
        id: 200,
        title: "200. \u91cc\u7a0b\u7891\u8fbe\u6210\u5e86\u795d\u4e3b\u89d2\u5361 MilestoneCelebrationCard\uff08200 \u53f7\u7ec4\u4ef6\u65d7\u8230\u91cc\u7a0b\u7891\uff01\u5bf9\u6807 Magic UI Confetti Hero \u00d7 Aceternity Glow\uff09",
        fn: "lvxMilestoneCelebrationCard({ title, subtitle, heroMetric, targetMetric, unlockDate, tags, onShare })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxMilestoneCelebrationCard({
          title: "🎉 达成「百日自律·知行合一」终极大师里程碑",
          subtitle: "连续 100 天保持核心习惯不中断 · 累计掌握 1,420 张 FSRS 闪卡 · 完成 12 套分布式系统模拟卷",
          heroMetric: "100",
          targetMetric: "100 天达成",
          unlockDate: "2026-11-19",
          tags: ["年度传奇勋章", "S级韧性指数", "全生态互联"],
          onShare: () => setLog("MilestoneCard: 正在生成高清荣誉成就海报并保存到本地相册..."),
        })
      );
        }
    },
    {
        id: 201,
        title: "201. \u8bcd\u7ea7\u5dee\u5f02\u5bf9\u6bd4\u5361 WordDiffCard\uff08Origin UI / Cursor \u7ec6\u7c92\u5ea6\u8bcd\u7ea7\u6bd4\u5bf9 \u00b7 \u95ea\u5361\u7b54\u6848\u4fee\u8ba2/\u62fe\u9057\u91cd\u5199\uff09",
        fn: "lvxWordDiffCard({ title, originalText, modifiedText, mode, onApply })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxWordDiffCard({
          title: "FSRS 闪卡背面解答 AI 优化前后比对",
          originalText: "Raft 协议依靠心跳维持 Leader 地位，所有写请求必须经多数派确认才提交，读取也需要走日志复制流程以确保线性一致性。",
          modifiedText: "Raft 协议依靠心跳维持 Leader 地位，所有写请求经多数派确认才提交。为优化读取性能，引入租约读（Lease Read）机制，在租约期内 Leader 可绕过日志复制直接本地响应，大幅降低读延迟。",
          onApply: (t) => setLog("WordDiff: 已采纳修改后解答"),
        })
      );
        }
    },
    {
        id: 202,
        title: "202. \u67d4\u548c\u8272\u677f\u4e0e\u7f51\u683c\u62fe\u8272\u5668 SwatchPicker\uff08Notion / Raycast 12\u8272\u83ab\u5170\u8fea\u8272\u8c31 \u00b7 \u6807\u7b7e/\u5206\u7ec4/\u4e3b\u9898\u8272\uff09",
        fn: "lvxSwatchPicker({ value, swatches, onChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxSwatchPicker({
          value: "brand",
          onChange: (id, hex) => setLog(`SwatchPicker: 选定分类标签色彩 [${id}] -> ${hex}`),
        })
      );
        }
    },
    {
        id: 203,
        title: "203. \u5feb\u6377\u952e\u5168\u5c4f\u901f\u67e5\u5f39\u5c42 ShortcutCheatSheet\uff08Linear / Raycast \u952e\u4f4d\u901f\u67e5 \u00b7 \u8003\u8bd5/\u95ea\u5361/\u96f7\u5207\u5168\u751f\u6001\u5feb\u6377\u6e05\u5355\uff09",
        fn: "lvxShortcutCheatSheet({ title, shortcuts, onClose })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const openBtn = K.lvxButton({
        label: "⌨️ 查看全生态快捷键速查表 (点击呼出弹层)",
        variant: "primary",
        onClick: () => {
          const sheet = K.lvxShortcutCheatSheet({
            title: "小驴全生态快捷键速查中心",
            shortcuts: [
              { keys: ["Ctrl", "K"], description: "万能罗盘与全局检索", category: "通用导航", mobileGesture: "双击顶栏" },
              { keys: ["Space"], description: "翻转闪卡 / 显示答案", category: "闪卡复习", mobileGesture: "轻击卡面" },
              { keys: ["1"], description: "重来 (Again / 遗忘)", category: "闪卡复习", mobileGesture: "向左滑" },
              { keys: ["4"], description: "简单 (Easy / 熟练)", category: "闪卡复习", mobileGesture: "向右滑" },
              { keys: ["Ctrl", "Enter"], description: "提交试卷 / 保存笔记", category: "考试评测", mobileGesture: "点击浮标" },
              { keys: ["Alt", "S"], description: "拾遗原子化切片快速录入", category: "灵感捕捉", mobileGesture: "长按选区" },
              { keys: ["Ctrl", "Shift", "B"], description: "一键全生态联合容灾快照", category: "系统运维", mobileGesture: "摇一摇" },
            ],
            onClose: () => {
              sheet.remove();
              setLog("ShortcutCheatSheet: 弹层已关闭");
            },
          });
          document.body.appendChild(sheet);
          setLog("ShortcutCheatSheet: 弹窗已呼出，支持实时搜索与分类过滤");
        },
      });
      stage.appendChild(openBtn);
        }
    },
    {
        id: 204,
        title: "204. \u5e73\u6ed1\u52a8\u6001\u7f13\u52a8\u8ba1\u6570\u5668 AnimatedCounter\uff08Magic UI / Tremor \u7269\u7406\u60ef\u6027\u8df3\u6570 \u00b7 \u590d\u76d8\u8fde\u7eed\u5929\u6570/\u5206\u503c/\u5230\u671f\u91cf\uff09",
        fn: "lvxAnimatedCounter({ value, initialValue, durationMs, tone, size })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const box = document.createElement("div");
      box.style.cssText = "display:flex;align-items:center;gap:16px;flex-wrap:wrap;width:100%;";
      const c1 = K.lvxAnimatedCounter({ value: 1420, initialValue: 1200, tone: "brand", size: "hero", suffix: " 张" });
      const c2 = K.lvxAnimatedCounter({ value: 98.5, initialValue: 60, decimals: 1, tone: "success", size: "lg", prefix: "得分 ", suffix: " 分" });
      const triggerBtn = K.lvxButton({
        label: "🎲 随机刷新数值",
        sm: true,
        onClick: () => {
          const next1 = Math.floor(Math.random() * 2000) + 500;
          const next2 = Math.round((Math.random() * 40 + 60) * 10) / 10;
          c1.updateTarget(next1);
          c2.updateTarget(next2);
          setLog(`AnimatedCounter: 平滑插值跳向 [${next1} 张] 与 [${next2} 分]`);
        },
      });
      box.appendChild(c1.element);
      box.appendChild(c2.element);
      box.appendChild(triggerBtn);
      stage.appendChild(box);
        }
    },
    {
        id: 205,
        title: "205. \u5206\u6bb5\u523b\u5ea6\u73af\u5f62\u4eea\u8868\u76d8 ScoreGauge\uff08Tremor / Aceternity 240\u00b0\u591a\u8272\u9608\u503c\u76d8 \u00b7 \u8003\u8bd5\u5f97\u5206/\u7ba1\u5bb6\u6c34\u4f4d\uff09",
        fn: "lvxScoreGauge({ value, maxValue, title, subtitle, size })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxScoreGauge({
          value: 88,
          maxValue: 100,
          title: "全真模拟综合得分率",
          subtitle: "已达到优秀评定标准 · 错题率 12%",
          size: 160,
        })
      );
        }
    },
    {
        id: 206,
        title: "206. \u8fde\u51fb\u6551\u8d4e\u4e0e\u8865\u5f55\u5411\u5bfc\u5361 StreakRepairWizard\uff08\u6253\u5361 T-1511 \u6551\u8d4e\u673a\u5236 \u00b7 \u5bb9\u9519\u5fc3\u7406\u5b66\u6cbb\u7406\uff09",
        fn: "lvxStreakRepairWizard({ itemName, missedDate, monthlyRepairsUsed, monthlyRepairsMax, onRepairSubmit, onForgiveOrSkip })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxStreakRepairWizard({
          itemName: "晨间深度精读 30 分钟",
          missedDate: "2026-11-18 (昨日)",
          monthlyRepairsUsed: 1,
          monthlyRepairsMax: 2,
          suggestedValue: 30,
          unit: "分钟",
          onRepairSubmit: (v) => setLog(`StreakWizard: 确认补录昨日时长 ${v} 分钟，连击成功接续为 42 天！`),
          onForgiveOrSkip: (r) => setLog(`StreakWizard: 申请免责请假 [${r}]，连击不断档`),
          onClose: () => setLog("StreakWizard: 已关闭向导"),
        })
      );
        }
    },
    {
        id: 207,
        title: "207. \u9519\u9898\u9636\u68af\u6d88\u51cf\u4e0e\u5f52\u56e0\u8ba2\u6b63\u5361 WrongEliminationLadder\uff08\u8003\u8bd5 \u9519\u9898\u5929\u68af \u00b7 \u4e09\u7ea7\u9636\u68af+\u56db\u8272\u5f52\u56e0\uff09",
        fn: "lvxWrongEliminationLadder({ title, ladder, weightedProgressPercent, onStartVariantDrill, onExportCleanSheet })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxWrongEliminationLadder({
          title: "🎯 分布式系统核心考点 · 错题消减攻克天梯",
          ladder: { toConquer: 14, strengthening: 8, eliminated: 38 },
          weightedProgressPercent: 76,
          onStartVariantDrill: () => setLog("WrongLadder: 启动针对 14 道高频待攻克题目的变式强化练习卷"),
          onExportCleanSheet: () => setLog("WrongLadder: 导出错题订正纸卷 PDF/打印件"),
        })
      );
        }
    },
    {
        id: 208,
        title: "208. \u9884\u7b97\u4e0e\u5bb9\u91cf\u8d85\u652f\u9884\u8b66\u770b\u677f BudgetThresholdGauge\uff08\u7ba1\u5bb6 G6 \u9884\u7b97\u6c34\u4f4d \u00b7 80%\u5b89\u5168\u6807\u5c3a\u4e0e\u52a8\u6001\u8f89\u5149\uff09",
        fn: "lvxBudgetThresholdGauge({ title, spent, limit, unit, warningThresholdRatio, periodLabel, onAdjustLimit })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxBudgetThresholdGauge({
          title: "💳 11 月全品类弹性支出限额",
          spent: 3420,
          limit: 4000,
          unit: "¥",
          warningThresholdRatio: 0.8,
          periodLabel: "2026年11月",
          onAdjustLimit: () => setLog("BudgetGauge: 弹出限额调整配置面板"),
        })
      );
        }
    },
    {
        id: 209,
        title: "209. \u5468\u671f\u8d1f\u8377\u9884\u6d4b\u67f1\u72b6\u56fe FutureLoadHistogram\uff08\u95ea\u5361 FSRS \u5230\u671f\u8d1f\u8f7d \u00b7 \u672a\u67657\u65e5\u524a\u5cf0\u586b\u8c37\uff09",
        fn: "lvxFutureLoadHistogram({ title, days, smoothed, onToggleSmooth, onSelectDay })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxFutureLoadHistogram({
          title: "📈 未来 7 日 FSRS 闪卡到期复习负荷预报",
          days: [
            { date: "2026-11-19", primaryCount: 38, secondaryCount: 10, label: "今天" },
            { date: "2026-11-20", primaryCount: 54, secondaryCount: 15, label: "周五", isPeak: true },
            { date: "2026-11-21", primaryCount: 28, secondaryCount: 5, label: "周六" },
            { date: "2026-11-22", primaryCount: 22, secondaryCount: 5, label: "周日" },
            { date: "2026-11-23", primaryCount: 46, secondaryCount: 10, label: "周一" },
            { date: "2026-11-24", primaryCount: 32, secondaryCount: 8, label: "周二" },
            { date: "2026-11-25", primaryCount: 26, secondaryCount: 8, label: "周三" },
          ],
          smoothed: false,
          onToggleSmooth: (on) => setLog(`FutureLoad: ${on ? "已开启削峰填谷平摊（周五峰值平滑分流至周末）" : "已恢复自然到期分布"}`),
          onSelectDay: (d) => setLog(`FutureLoad: 选中查看 [${d}] 当日卡包切片明细`),
        })
      );
        }
    },
    {
        id: 210,
        title: "210. \u4ea4\u5f80\u8282\u594f\u4e0e\u51b7\u5374\u96f7\u8fbe\u5361 CoolingCadenceCard\uff08\u4eba\u8109 \u51b7\u5374\u96f7\u8fbe \u00b7 \u4e94\u7ea7\u4ea4\u5f80\u6e29\u5ea6\u4e0e\u6c89\u7761\u7834\u51b0\uff09",
        fn: "lvxCoolingCadenceCard({ entityId, title, level, daysInactive, recommendedCycleDays, onAction })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxCoolingCadenceCard({
          entityId: "contact-108",
          title: "张云峰 · 基础软件分布式系统负责人",
          level: "cool",
          daysInactive: 28,
          recommendedCycleDays: 21,
          onAction: (act) => setLog(`CoolingCadence: 执行操作 [${act === "contact" ? "立即发送微信破冰慰问" : "推迟联络提醒一周"}]`),
        })
      );
        }
    },
    {
        id: 211,
        title: "211. \u5468\u671f\u5927\u65e5\u5b50\u6392\u7a0b\u8ffd\u8e2a\u5361 OccasionCadenceCard\uff08\u6253\u5361/\u4eba\u8109/\u7ba1\u5bb6 \u7eaa\u5ff5\u65e5/\u5468\u671f\u4ea4\u8d39/\u91cd\u5927\u4e8b\u4ef6\uff09",
        fn: "lvxOccasionCadenceCard({ title, category, recurrenceDescription, nextDate, daysRemaining, progressPercent, onToggleComplete })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxOccasionCadenceCard({
          title: "结婚纪念日 & 年度家庭体检",
          category: "anniversary",
          recurrenceDescription: "每年 11-28 循环",
          nextDate: "2026-11-28",
          daysRemaining: 9,
          progressPercent: 97,
          missedDate: "2025-11-28 (上期补标)",
          onToggleComplete: (c) => setLog("OccasionCadence: 本期达成状态变为 " + c),
          onLateComplete: (d) => setLog(`OccasionCadence: 补标历史周期 [${d}]`),
          onReschedule: () => setLog("OccasionCadence: 弹出单次发生日临时改期窗口"),
        })
      );
        }
    },
    {
        id: 212,
        title: "212. \u4f1a\u524d\u7b80\u62a5\u4e0e\u7ea2\u7ebf\u96f7\u533a\u907f\u5751\u5361 PreMeetingBriefingCard\uff08\u4eba\u8109/\u7ba1\u5bb6 \u5546\u52a1\u62dc\u8bbf/\u793e\u4ea4\u8d74\u7ea6/\u5e94\u6025\u5907\u5fd8\uff09",
        fn: "lvxPreMeetingBriefingCard({ personName, roleOrOrg, meetingPurpose, taboos, preferences, pendingPromises, onOpenProfile })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxPreMeetingBriefingCard({
          personName: "张云峰 先生",
          roleOrOrg: "开源基础软件研究院 技术委员会主席",
          meetingPurpose: "交流分布式共识算法在思源同步内核中的工程落地可行性",
          taboos: ["海鲜严重过敏（绝对忌口）", "对会议迟到零容忍", "避谈未公开融资估值"],
          preferences: ["偏好高山乌龙茶", "会议习惯准点直奔主题", "使用双屏工作流"],
          pendingPromises: ["本次会谈需向其交付《Raft 租约读内核方案初稿》", "回赠开源架构师峰会纪念徽章"],
          onOpenProfile: () => setLog("PreMeeting: 正在拉起该联系人完整画像抽屉与历史往来流"),
        })
      );
        }
    },
    {
        id: 213,
        title: "213. \u53cc\u5411\u4fe1\u8bfa\u4e0e\u5c65\u7ea6\u53f0\u8d26 ReciprocalCommitmentsLedger\uff08\u4eba\u8109/\u7ba1\u5bb6/\u6253\u5361 \u4eba\u9645\u7ea6\u5b9a/\u5bb6\u52a1\u627f\u8bfa/\u501f\u8fd8\u5951\u7ea6\uff09",
        fn: "lvxReciprocalCommitmentsLedger({ title, records, onToggleFulfill, onConvertToLog })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxReciprocalCommitmentsLedger({
          title: "🤝 近期待兑现约定与双向承诺",
          records: [
            { id: "p1", direction: "i_promised", title: "向李工交付《分布式灾备全量快照规范》", dueOn: "2026-11-20", status: "pending", isOverdue: false },
            { id: "p2", direction: "they_promised", title: "王总监协助联系高校分布式系统实验室评审专家", dueOn: "2026-11-15", status: "pending", isOverdue: true },
            { id: "p3", direction: "i_promised", title: "协助小刘调试 Svelte 5 Runes 响应式状态", dueOn: "2026-11-18", status: "fulfilled" },
          ],
          onToggleFulfill: (id, f) => setLog(`Commitments: 承诺 [${id}] 履约状态更新为 ${f ? "已兑现" : "撤销兑现"}`),
          onConvertToLog: (id) => setLog(`Commitments: 将承诺 [${id}] 转为正式交往日志并存入思源人脉库`),
        })
      );
        }
    },
    {
        id: 214,
        title: "214. \u6c89\u7761\u7b14\u8bb0\u5524\u9192\u4e0e\u4e09\u6001\u5206\u6d41\u5361 ResurfaceTriageCard\uff08\u62fe\u9057/\u95ea\u5361 \u6c89\u7761\u7b14\u8bb0\u5524\u9192/\u6bcf\u65e5\u6f2b\u6e38\uff09",
        fn: "lvxResurfaceTriageCard({ title, excerpt, source, reasons, readingMinutes, onRead, onLater, onArchive, onNext })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxResurfaceTriageCard({
          title: "分布式系统中的租约机制（Lease）深度推导与工程边界",
          excerpt: "租约机制本质上是带有时钟有效期的分布式锁或权限授予。在租约有效窗口内，持有者可无脑认定自己拥有权威并本地响应读请求，从而完全跳过网络心跳与日志复制的往返延迟...",
          source: "《分布式系统架构师手记》· 第 8 章",
          readingMinutes: 6,
          reasons: ["已沉睡 62 天", "5★ 核心必读", "微信读书切片", "高频反链来源"],
          onRead: () => setLog("Resurface: 立即开启沉浸式渐进阅读模式"),
          onLater: () => setLog("Resurface: 延后至下周一漫游推荐流"),
          onArchive: () => setLog("Resurface: 已将此沉睡笔记移出唤醒池并归档"),
          onNext: () => setLog("Resurface: 随机抽取下一篇知识盲盒"),
        })
      );
        }
    },
    {
        id: 215,
        title: "215. \u591a\u9898\u578b\u95ee\u5377\u65e5\u8bb0\u6a21\u677f\u6784\u5efa\u5668 QuestionnaireBuilder\uff08\u6253\u5361/\u8003\u8bd5/\u7ba1\u5bb6 \u95ee\u5377\u65e5\u8bb0/\u5065\u5eb7\u81ea\u67e5\uff09",
        fn: "lvxQuestionnaireBuilder({ templateName, questions, onChange, onPreview })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxQuestionnaireBuilder({
          templateName: "每日深度复盘与心流问卷",
          questions: [
            { id: "q1", text: "今日完成的最高价值事件（吞下最大的青蛙）是什么？", type: "textarea", required: true },
            { id: "q2", text: "今日工作与学习专注心流指数评分（1~5分）", type: "slider", required: true },
            { id: "q3", text: "今日有何灵光一现的想法或值得记录的认知提升？", type: "text", required: false },
          ],
          onChange: (qs) => setLog(`QuestionnaireBuilder: 模板更新，当前共 ${qs.length} 道题目`),
          onPreview: () => setLog("QuestionnaireBuilder: 唤起当前问卷所见即所得沙盒预览抽屉"),
        })
      );
        }
    },
    {
        id: 216,
        title: "216. \u8003\u524d\u9ad8\u5371\u9057\u6f0f\u4e0e\u6807\u65d7\u5b58\u7591\u51b2\u523a\u901f\u6392\u53f0 SprintTriageModal\uff08\u8003\u8bd5/\u95ea\u5361 \u8003\u524d\u901f\u6392/\u62a2\u7b54\u5f39\u7a97\uff09",
        fn: "lvxSprintTriageModal({ title, remainSeconds, items, onAnswer, onSubmitExam, onClose })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const openBtn = K.lvxButton({
        label: "⚡ 打开考前高危遗漏冲刺速排台 (模拟还剩 3 分钟)",
        variant: "primary",
        onClick: () => {
          const modal = K.lvxSprintTriageModal({
            title: "全真模拟考试 · 考前高危遗漏冲刺速排",
            remainSeconds: 185,
            items: [
              { id: "i1", index: 8, stem: "在 Raft 协议中，Candidate 在选举超时后发起的 RPC 是？", type: "choice", currentAnswer: "B", isFlagged: true },
              { id: "i2", index: 14, stem: "Paxos 与 Raft 在多副本共识上的最大架构差异是？", type: "choice", currentAnswer: "", isUnanswered: true },
              { id: "i3", index: 21, stem: "当网络分区恢复时，Term 较小的旧 Leader 收到心跳后会如何自处？", type: "choice", currentAnswer: "", isUnanswered: true, isFlagged: true },
            ],
            onAnswer: (id, ans) => setLog(`SprintTriage: 题目 [${id}] 就地选填为 [${ans}]`),
            onSubmitExam: () => {
              modal.remove();
              setLog("SprintTriage: 确认交卷，正在生成综合考卷测评报告...");
            },
            onClose: () => {
              modal.remove();
              setLog("SprintTriage: 速排弹窗已关闭");
            },
          });
          document.body.appendChild(modal);
          setLog("SprintTriage: 冲刺速排台已呼出，支持直接在列表中填涂选项");
        },
      });
      stage.appendChild(openBtn);
        }
    },
    {
        id: 217,
        title: "217. \u53cc\u6a21\u6570\u7406\u6f14\u7b97\u4e0e\u624b\u7ed8\u8349\u7a3f\u5de5\u4f5c\u53f0 DualModeScratchpad\uff08\u8003\u8bd5/\u95ea\u5361/\u5e38\u7528 \u7406\u79d1\u8349\u7a3f/\u624b\u7ed8\u63a8\u5bfc\uff09",
        fn: "lvxDualModeScratchpad({ title, initialMode, initialText, onTextChange, onClear })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxDualModeScratchpad({
          title: "📐 试题推导演算草稿纸",
          initialMode: "text",
          initialText: "设 f(x) = x * ln(x)，求 f'(x)：\nf'(x) = ln(x) + x * (1/x) = ln(x) + 1\n当 x = e 时，f'(e) = 1 + 1 = 2",
          onTextChange: (t) => setLog("Scratchpad: 草稿内容已自动本地草稿箱持久化"),
          onClear: () => setLog("Scratchpad: 草稿纸已清空"),
        })
      );
        }
    },
    {
        id: 218,
        title: "218. \u8fde\u7eed\u5207\u7247\u6682\u5b58\u6808\u4e0e\u8bed\u4e49\u7ec4\u88c5\u5668 FragmentStagingStack\uff08\u96f7\u5207/\u62fe\u9057/\u5e38\u7528 \u8bed\u4e49\u5207\u7247/\u8d27\u67b6\u63a8\u6d41\uff09",
        fn: "lvxFragmentStagingStack({ title, slices, onAssemble, onTogglePin, onRemove, onClear })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxFragmentStagingStack({
          title: "📚 今日阅读连续摘录暂存货架",
          slices: [
            { id: "s1", title: "租约读架构优势", raw: "在租约期内 Leader 无需日志复制，直接本地读取，彻底消除单轮 RTT 延迟", pinned: true },
            { id: "s2", title: "网络分区脑裂防范", raw: "通过 Quorum 多数派机制保障同一 Term 内绝不可能诞生两个合法领导者", pinned: false },
            { id: "s3", title: "FSRS 记忆稳定性公式", raw: "S_new = S_old * (1 + factor * D^-alpha * S^-beta * e^(w * R))", pinned: false },
          ],
          onAssemble: (mode) => setLog(`StagingStack: 正在组装 3 条原子切片并生成 Markdown 结构化推入 [${mode}]`),
          onTogglePin: (id, p) => setLog(`StagingStack: 切片 [${id}] 锁定状态更新为 ${p}`),
          onRemove: (id) => setLog(`StagingStack: 移除切片 [${id}]`),
          onClear: () => setLog("StagingStack: 已清理未锁定的临时切片"),
        })
      );
        }
    },
    {
        id: 219,
        title: "219. \u53cc\u5217\u6316\u7a7a\u9650\u65f6\u914d\u5bf9\u6d88\u9664\u6311\u6218\u53f0 PairingChallengeDrill\uff08\u95ea\u5361/\u8003\u8bd5 \u6e38\u620f\u5316\u8bb0\u5fc6/\u6982\u5ff5\u914d\u5bf9\uff09",
        fn: "lvxPairingChallengeDrill({ title, pairs, onComplete })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxPairingChallengeDrill({
          title: "🎮 分布式系统核心概念连线配对消除",
          pairs: [
            { id: "p1", prompt: "分布式系统一致性与可用性权衡", answer: "CAP 定理" },
            { id: "p2", prompt: "基于多数派投票的共识算法", answer: "Paxos / Raft" },
            { id: "p3", prompt: "读写分离时保证读取最新数据的机制", answer: "线性一致性读" },
            { id: "p4", prompt: "跨节点事务两阶段提交协议", answer: "2PC / 3PC" },
          ],
          onComplete: (stats) => setLog(`PairingDrill: 🎉 挑战通关！用时 ${stats.elapsedSec} 秒，失误 ${stats.mistakes} 次`),
        })
      );
        }
    },
    {
        id: 220,
        title: "220. \u5b8f\u53d8\u91cf\u4e0e\u771f\u5b9e\u5c55\u5f00\u53cc\u6001\u5bf9\u6bd4\u5b9e\u65f6\u6e32\u67d3\u5668 DualMacroLivePreview\uff08\u5e38\u7528/\u96f7\u5207 \u5b8f\u6a21\u677f\u8c03\u8bd5/XSS\u5b89\u5168\uff09",
        fn: "lvxDualMacroLivePreview({ title, rawTemplate, expandedEffect, onCopyRaw, onCopyLive })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxDualMacroLivePreview({
          title: "🔍 智能模板双态实时解析对照",
          rawTemplate: "### 会议纪要 · {{date}}\n参会人：{{clipboard}}\n时间：{{time}}\n核心决议：\n- {{cursor}}",
          expandedEffect: "### 会议纪要 · 2026-11-19\n参会人：张总监、李工、架构师团队\n时间：08:45:30\n核心决议：\n- 已确认小驴 DL2 组件库全面达成 220 旗舰组件里程碑",
          onCopyRaw: () => setLog("DualMacro: 已复制 RAW 模板源码至剪贴板"),
          onCopyLive: () => setLog("DualMacro: 已复制 LIVE 展开文本至剪贴板"),
        })
      );
        }
    },
    {
        id: 221,
        title: "221. \u78c1\u5438\u6b65\u8fdb\u523b\u5ea6\u6ed1\u5757 SteppedSlider\uff08\u5bf9\u6807 Apple iOS 18 Control Center / Raycast \u00b7 FSRS\u4fdd\u7559\u7387/\u756a\u8304\u65f6\u957f\uff09",
        fn: "lvxSteppedSlider({ value, min, max, step, marks, formatValue, onChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxSteppedSlider({
          value: 90,
          min: 75,
          max: 95,
          step: 5,
          marks: [
            { value: 75, label: "75% 低频" },
            { value: 80, label: "80%" },
            { value: 85, label: "85%" },
            { value: 90, label: "90% (推荐)", major: true },
            { value: 95, label: "95% 冲刺" },
          ],
          formatValue: (v) => `${v}% 期望记忆率`,
          ariaLabel: "FSRS 记忆稳定性目标值",
          onChange: (v) => setLog(`SteppedSlider: 期望留存率调整为 [${v}%]`),
        })
      );
        }
    },
    {
        id: 222,
        title: "222. \u6d41\u4f53\u836f\u4e38\u6d6e\u52a8\u5206\u6bb5\u9009\u62e9\u5668 FloatingPillTabs\uff08\u5bf9\u6807 Raycast / Linear \u00b7 \u73b0\u4ee3\u5316\u5206\u6bb5\u9009\u9879\u5361\uff09",
        fn: "lvxFloatingPillTabs({ items, value, onChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxFloatingPillTabs({
          items: [
            { id: "all", label: "全部卡包", count: 142 },
            { id: "due", label: "今日待复习", count: 28 },
            { id: "leech", label: "高频遗忘", count: 6 },
            { id: "new", label: "未激活", count: 15 },
          ],
          value: "due",
          onChange: (id) => setLog(`FloatingPillTabs: 分段视图平滑切换至 [${id}]`),
        })
      );
        }
    },
    {
        id: 223,
        title: "223. \u62df\u6001\u5149\u6655\u6307\u6807\u78c1\u8d34 GlassMetricTile\uff08\u5bf9\u6807 Vercel Analytics / Linear Insights \u00b7 \u5927\u76d8\u6838\u5fc3\u6307\u6807\uff09",
        fn: "lvxGlassMetricTile({ title, value, unit, trendText, sparkline, tone })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxGlassMetricTile({
          title: "🔥 FSRS 核心闪卡记忆保持率",
          value: "92.4",
          unit: "%",
          trendText: "↑ 2.8% 优于基线",
          tone: "success",
          sparkline: [82, 85, 84, 88, 89, 91, 92.4],
        })
      );
        }
    },
    {
        id: 224,
        title: "224. \u6c89\u6d78\u5f0f\u9605\u8bfb\u4e13\u6ce8\u906e\u7f69 ReadingFocusMask\uff08\u5bf9\u6807 Readwise / Notion 3.0 Focus Spotlight \u00b7 \u957f\u6587/\u6750\u6599\u9898\u805a\u7126\uff09",
        fn: "lvxReadingFocusMask({ title, progressText, onPrev, onNext, onExit })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxReadingFocusMask({
          title: "📖 《分布式共识机制与 Raft 算法实战》· 沉浸精读模式",
          progressText: "当前第 5 / 24 核心段落",
          onPrev: () => setLog("ReadingFocus: 视线光圈平滑移动至上一段落 (K)"),
          onNext: () => setLog("ReadingFocus: 视线光圈平滑滚动至下一段落 (J)"),
          onExit: () => setLog("ReadingFocus: 退出专注模式，焦点归还至原正文"),
        })
      );
        }
    },
    {
        id: 225,
        title: "225. \u591a\u7ef4\u7b5b\u9009\u6807\u7b7e\u80f6\u56ca\u77e9\u9635 FilterChipMatrix\uff08\u5bf9\u6807 Linear / GitHub Projects \u00b7 \u9ad8\u5bc6\u5ea6\u4ea4\u53c9\u5206\u9762\u7b5b\u9009\uff09",
        fn: "lvxFilterChipMatrix({ groups, selected, onChange, onClearAll })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxFilterChipMatrix({
          groups: [
            {
              key: "status",
              title: "复习状态",
              options: [
                { id: "due", label: "今日到期", count: 28 },
                { id: "learning", label: "学习中", count: 64 },
                { id: "mastered", label: "已掌握", count: 180 },
              ],
            },
            {
              key: "difficulty",
              title: "认知难度",
              options: [
                { id: "easy", label: "基础概念", count: 110 },
                { id: "medium", label: "核心考点", count: 85 },
                { id: "hard", label: "重难点陷阱", count: 16 },
              ],
            },
          ],
          selected: { status: ["due"] },
          onChange: (sel) => setLog(`FilterMatrix: 生效筛选条件 [${JSON.stringify(sel)}]`),
          onClearAll: () => setLog("FilterMatrix: 已重置所有筛选分面"),
        })
      );
        }
    },
    {
        id: 226,
        title: "226. \u5bcc\u6587\u672c\u6bb5\u843d\u6279\u6ce8\u6c14\u6ce1 InlineAnnotationPopover\uff08\u5bf9\u6807 Notion 3.0 / Figma \u00b7 \u5212\u7ebf/\u6279\u6ce8\u5c31\u5730\u4fbf\u7b7e\uff09",
        fn: "lvxInlineAnnotationPopover({ quoteText, initialComment, authorName, onSave, onConvertToCard, onDelete })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxInlineAnnotationPopover({
          quoteText: "在租约有效期内，Leader 可以确信没有产生新的合法 Leader，因此无需经过多数派确认即可直接响应读取请求。",
          initialComment: "关键思考：此机制严重依赖节点的物理单调时钟，必须预留至少两倍的网络心跳超时裕量，防止时钟回退引发脑裂。",
          authorName: "小驴架构师",
          onSave: (c) => setLog(`AnnotationPopover: 批注已保存 [${c}]`),
          onConvertToCard: () => setLog("AnnotationPopover: 已将划线与批注一键生成 FSRS 双向闪卡"),
          onDelete: () => setLog("AnnotationPopover: 移除划线与批注"),
          onClose: () => setLog("AnnotationPopover: 气泡已关闭"),
        })
      );
        }
    },
    {
        id: 227,
        title: "227. \u5806\u53e0\u60ef\u6027\u624b\u52bf\u5361\u7247\u5806 StackedCardDeck\uff08\u5bf9\u6807 Motion Primitives / 21st.dev \u00b7 Tinder-style \u95ea\u7535\u5206\u6d41\uff09",
        fn: "lvxStackedCardDeck({ cards, onSwipeLeft, onSwipeRight })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxStackedCardDeck({
          cards: [
            { id: "c1", title: "Raft 租约机制本质是什么？", subtitle: "《分布式系统核心概念》", content: "租约机制本质上是带有时钟有效期的分布式权限授予。在租约期内持有者拥有权威地位，跳过跨节点日志复制开销。", badge: "核心概念" },
            { id: "c2", title: "CAP 定理中的 P 代表什么？", subtitle: "《系统架构设计师》", content: "P（Partition tolerance 分区容错性）：即使网络出现通信故障将系统划分为多个隔离区域，分布式系统依然能继续运作。", badge: "经典考点" },
            { id: "c3", title: "为什么多数派选举要求奇数节点？", subtitle: "《共识算法工程实践》", content: "2N+1 个节点能容忍 N 个节点故障，而 2N+2 个节点同样只能容忍 N 个节点故障，增加一个节点并未提升容错上限反而增加网络开销。", badge: "思维陷阱" },
          ],
          onSwipeLeft: (id) => setLog(`StackedDeck: 卡片 [${id}] 向左划出（标记为：稍后复习）`),
          onSwipeRight: (id) => setLog(`StackedDeck: 卡片 [${id}] 向右划出（标记为：已熟练掌握 ✓）`),
        })
      );
        }
    },
    {
        id: 228,
        title: "228. \u5782\u76f4\u6eda\u7b52\u673a\u68b0\u6570\u5b57 RollingTicker\uff08\u5bf9\u6807 React Bits / Apple Watch \u00b7 \u745e\u58eb\u8868\u76d8\u673a\u68b0\u7cbe\u5bc6\u611f\uff09",
        fn: "lvxRollingTicker({ value, prefix, suffix, tone })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const box = document.createElement("div");
      box.style.cssText = "display:flex;align-items:center;gap:20px;flex-wrap:wrap;width:100%;";
      const t1 = K.lvxRollingTicker({ value: 2026, prefix: "年度里程碑 ", suffix: " 年", tone: "brand" });
      const t2 = K.lvxRollingTicker({ value: 100, prefix: "连续自律 ", suffix: " 天", tone: "energy" });
      box.appendChild(t1);
      box.appendChild(t2);
      stage.appendChild(box);
        }
    },
    {
        id: 229,
        title: "229. \u672a\u6765\u6392\u671f\u6295\u5f71\u6708\u5386 ScheduleProjectionCalendar\uff08\u6253\u5361 30\u5929\u786e\u5b9a\u6027\u89c4\u5219\u6295\u5f71 \u00b7 \u6392\u671f\u89c4\u5219\u8349\u7a3f\u9a8c\u7b97\uff09",
        fn: "lvxScheduleProjectionCalendar({ title, ruleDescription, startDate, days, quotaInfo, onDayClick })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxScheduleProjectionCalendar({
          title: "晨间深度精读 · 未来 30 天排期规则投影",
          ruleDescription: "工作日执行 + 每周弹性配额 4 次",
          startDate: "2026-11-19",
          quotaInfo: "本周配额进度：已用 2/4 次",
          days: Array.from({ length: 30 }, (_, i) => {
            const d = new Date(2026, 10, 19 + i);
            const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            const isWk = d.getDay() >= 1 && d.getDay() <= 5;
            return { date: iso, scheduled: isWk };
          }),
          onDayClick: (date, sched) => setLog(`ScheduleProjection: 查看 [${date}] 判定明细 -> ${sched ? "✓ 应做日" : "休整日"}`),
        })
      );
        }
    },
    {
        id: 230,
        title: "230. \u6279\u91cf\u56de\u586b\u4e0e\u524d\u7f6e\u6821\u9a8c\u5de5\u4f5c\u53f0 BatchRecordWorkbench\uff08\u6253\u5361/\u7ba1\u5bb6/\u4eba\u8109 \u5386\u53f2\u591a\u6761\u76ee\u6279\u91cf\u6d41\u6c34\u8865\u586b\uff09",
        fn: "lvxBatchRecordWorkbench({ targetDate, items, onSubmit, onCancel })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxBatchRecordWorkbench({
          targetDate: "2026-11-18 (昨日补填)",
          items: [
            { id: "i1", name: "晨间深度阅读", state: "ready", kind: "number", unit: "分钟", value: 30 },
            { id: "i2", name: "FSRS 核心闪卡复习", state: "ready", kind: "number", unit: "张", value: 25 },
            { id: "i3", name: "八段锦晨练", state: "ready", kind: "binary" },
            { id: "i4", name: "全真模拟卷训练", state: "existing", kind: "binary" },
            { id: "i5", name: "全库灾备快照复核", state: "off-schedule", kind: "binary" },
          ],
          onSubmit: (recs) => setLog(`BatchWorkbench: 确认提交 ${recs.length} 项历史补记流水`),
          onCancel: () => setLog("BatchWorkbench: 已取消批量补记"),
        })
      );
        }
    },
    {
        id: 231,
        title: "231. \u5168\u5bb6\u533b\u7597\u6025\u6551\u4e0e\u5e94\u6025\u652f\u6301\u5361 EmergencyMedicalCard\uff08\u7ba1\u5bb6 \u7a81\u53d1\u6025\u6551/\u8fc7\u654f\u6e90/\u8840\u578b/\u533b\u4fdd\u53f7\u805a\u5408\u770b\u677f\uff09",
        fn: "lvxEmergencyMedicalCard({ emergencyKitLocation, members, onCopyEmergencyText, onExportFlashcards })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxEmergencyMedicalCard({
          emergencyKitLocation: "客厅入户玄关左侧挂式医药急救箱",
          members: [
            { name: "张云峰", role: "户主", bloodType: "A+", allergies: ["青霉素严重过敏", "头孢类抗生素"], conditions: ["轻度脂肪肝"], insuranceNo: "3201 **** **** 1024", emergencyContact: "138-0010-8888" },
            { name: "林晓月", role: "妻子", bloodType: "O+", allergies: ["海鲜严重忌口"], conditions: ["慢性咽炎"], insuranceNo: "3201 **** **** 2048", emergencyContact: "139-0020-6666" },
            { name: "张小沐", role: "女儿 (6岁)", bloodType: "A+", allergies: ["芒果接触性过敏"], insuranceNo: "3201 **** **** 4096", emergencyContact: "138-0010-8888 (父)" },
          ],
          onCopyEmergencyText: () => setLog("EmergencyCard: 已复制全家生命体征与急救卡文本至剪贴板"),
          onExportFlashcards: () => setLog("EmergencyCard: 正在将成员急救体征生成 FSRS 双向记忆卡片"),
        })
      );
        }
    },
    {
        id: 232,
        title: "232. \u516c\u5e73\u8f6e\u503c\u4ef2\u88c1\u5668\u4e0e\u6267\u884c\u7559\u75d5\u53f0 RotationArbitrator\uff08\u7ba1\u5bb6 \u5bb6\u52a1\u5206\u5de5/\u8f6e\u6d41\u503c\u65e5/\u6700\u4e45\u672a\u505a\u4ef2\u88c1\uff09",
        fn: "lvxRotationArbitrator({ title, roster, nextAssignee, recentLogs, onMarkDone })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxRotationArbitrator({
          title: "周末全屋深度扫除与垃圾分类轮值",
          roster: [{ id: "m1", name: "爸爸" }, { id: "m2", name: "妈妈" }, { id: "m3", name: "哥哥" }, { id: "m4", name: "妹妹" }],
          nextAssignee: { id: "m1", name: "爸爸", daysSince: 8 },
          recentLogs: [
            { memberName: "妈妈", date: "2026-11-15", note: "客厅地毯除螨与阳台整理", points: 15 },
            { memberName: "哥哥", date: "2026-11-12", note: "厨房吸油烟机清洗", points: 20 },
            { memberName: "妹妹", date: "2026-11-08", note: "全屋绿植修剪与浇水", points: 10 },
          ],
          onMarkDone: (id, note) => setLog(`RotationArbitrator: 记录 [${id}] 完成一次轮值，积分已入账，自动流转至下一位应执行人`),
        })
      );
        }
    },
    {
        id: 233,
        title: "233. \u5b97\u65cf\u4ee3\u9645\u4eb2\u5c5e\u5c42\u7ea7\u6811\u8c31 KinshipGenerationalTree\uff08\u4eba\u8109 \u5bb6\u65cf\u6863\u6848/\u4e94\u4ee3\u9645\u5b97\u8c31\u7ed3\u6784\u5316\uff09",
        fn: "lvxKinshipGenerationalTree({ personName, groups, onOpenDoc, onAddMember })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxKinshipGenerationalTree({
          personName: "张云峰 先生",
          groups: [
            { role: "parent", title: "长辈 (父母 / 岳父母)", members: [{ id: "k1", name: "张守义", relationLabel: "父亲", birthYear: "1960", linkedDocId: "doc-k1" }, { id: "k2", name: "王玉芳", relationLabel: "母亲", birthYear: "1962", linkedDocId: "doc-k2" }] },
            { role: "spouse", title: "伴侣配偶", members: [{ id: "k3", name: "林晓月", relationLabel: "妻子", birthYear: "1988", linkedDocId: "doc-k3" }] },
            { role: "sibling", title: "同辈 (手足堂表)", members: [{ id: "k4", name: "张云涛", relationLabel: "弟弟", birthYear: "1992", linkedDocId: "doc-k4" }] },
            { role: "child", title: "晚辈 (子女后代)", members: [{ id: "k5", name: "张小沐", relationLabel: "长女", birthYear: "2020", linkedDocId: "doc-k5" }] },
          ],
          onOpenDoc: (docId) => setLog(`KinshipTree: 打开关联人物思源文档 [${docId}]`),
          onAddMember: (role) => setLog(`KinshipTree: 快速添加 [${role}] 代际新亲属`),
        })
      );
        }
    },
    {
        id: 234,
        title: "234. \u79fb\u52a8\u7aef\u9605\u8bfb\u4e94\u6001\u60ac\u6d6e\u63a7\u5236\u6761 MobileReadingFloatingBar\uff08\u62fe\u9057 \u7a0d\u540e\u8bfb/\u5355\u624b\u5fae\u8c03\u5b57\u53f7\u884c\u8ddd\uff09",
        fn: "lvxMobileReadingFloatingBar({ status, progressRatio, onSetStatus, onAdjustTypography })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxMobileReadingFloatingBar({
          status: "reading",
          progressRatio: 0.65,
          onSetStatus: (st) => setLog(`MobileReadingBar: 阅读流转状态变更为 [${st}]`),
          onAdjustTypography: () => setLog("MobileReadingBar: 呼出底部 Aa 排版微调抽屉（字号 12~26px / 行距 1.3~2.3）"),
        })
      );
        }
    },
    {
        id: 235,
        title: "235. \u601d\u6e90\u539f\u751f Bento 3.0 \u6218\u62a5\u5361\u751f\u6210\u5668 DocCalloutReportCard\uff08\u95ea\u5361/\u8003\u8bd5 \u601d\u6e90\u539f\u751fCallout\u6218\u62a5\uff09",
        fn: "lvxDocCalloutReportCard({ title, date, totalCount, metrics, traceItems, onWriteToDoc })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxDocCalloutReportCard({
          title: "今日 FSRS 核心闪卡复习结算战报",
          date: "2026-11-19",
          totalCount: 42,
          unitLabel: "张",
          metrics: { success: 35, warning: 5, danger: 2, retentionRate: 91.2, durationMinutes: 18, streakDays: 42 },
          traceItems: [
            { title: "Raft 协议心跳与租约读边界条件", status: "hard", blockId: "b-raft-lease" },
            { title: "CAP 定理中网络分区脑裂防范机制", status: "again", blockId: "b-cap-split" },
          ],
          onWriteToDoc: () => setLog("DocCalloutReport: 格式化为标准 Callout Markdown 并写入当前思源文档正文尾部"),
        })
      );
        }
    },
    {
        id: 236,
        title: "236. \u5168\u771f\u6c89\u6d78\u6d4b\u8bd5/\u590d\u4e60\u6d41\u63a7\u9876\u680f ImmersiveSessionHeader\uff08\u95ea\u5361/\u8003\u8bd5 \u505a\u9898\u9876\u680f/\u53cc\u5012\u8ba1\u65f6/\u505a\u9898\u5de5\u5177\uff09",
        fn: "lvxImmersiveSessionHeader({ scopeName, current, total, successCount, failCount, remainingSeconds, onHandIn, onPause })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxImmersiveSessionHeader({
          scopeName: "《系统架构设计师》全真模拟卷 (卷一)",
          current: 18,
          total: 50,
          successCount: 16,
          failCount: 2,
          remainingSeconds: 1420,
          onHandIn: () => setLog("ImmersiveHeader: 提交当前考卷，交卷前检查未答题目"),
          onPause: () => setLog("ImmersiveHeader: 考试计时已暂停，进入后台锁定屏"),
          onAdjustFont: () => setLog("ImmersiveHeader: 缩放题目字号"),
        })
      );
        }
    },
    {
        id: 237,
        title: "237. \u8584\u5f31\u8003\u70b9\u77e5\u8bc6\u5f31\u9879\u8bca\u65ad\u4e0e\u52a0\u7ec3\u95ed\u73af\u5361 WeakSpotDiagnosticCard\uff08\u8003\u8bd5 \u8584\u5f31\u8003\u70b9\u8bca\u65ad/\u4e00\u952e\u7ec4\u5377\u52a0\u7ec3\uff09",
        fn: "lvxWeakSpotDiagnosticCard({ title, weakRank, onDrillTags })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxWeakSpotDiagnosticCard({
          title: "🎯 考点薄弱知识项深度智能诊断",
          weakRank: [
            { rank: 1, tagName: "Raft 算法租约读有效期推导", accuracy: 0.28, totalCount: 14, isHighRisk: true },
            { rank: 2, tagName: "分布式事务 2PC 协调者单点故障应对", accuracy: 0.42, totalCount: 12, isHighRisk: true },
            { rank: 3, tagName: "Paxos 多数派投票仲裁约束边界", accuracy: 0.55, totalCount: 20 },
            { rank: 4, tagName: "Gossip 最终一致性反熵收敛周期", accuracy: 0.62, totalCount: 16 },
          ],
          onDrillTags: (tags) => setLog(`WeakSpotDiagnostic: 针对 [${tags.join(", ")}] 4 个核心薄弱考点自动智能抽取 10 道变式强化卷`),
        })
      );
        }
    },
    {
        id: 238,
        title: "238. \u5e73\u53f0\u9065\u6d4b\u4e0e\u6838\u5fc3\u6570\u636e\u6e90\u8f7b\u91cf\u6307\u6807\u680f PlatformMetricsBar\uff08\u96f7\u5207 \u7d27\u51d1\u578b\u6307\u6807\u5e73\u94fa/\u5185\u6838\u5ef6\u65f6\u9065\u6d4b\uff09",
        fn: "lvxPlatformMetricsBar({ items, activeKey, onSelect })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxPlatformMetricsBar({
          items: [
            { key: "snippets", label: "代码片段资产", value: "128", latencyMs: 8 },
            { key: "actions", label: "快捷动作中枢", value: "46", latencyMs: 12 },
            { key: "telemetry", label: "思源内核往返", value: "14ms", latencyMs: 14 },
            { key: "sync_state", label: "全库灾备一致性", value: "100%", latencyMs: 22 },
          ],
          activeKey: "snippets",
          onSelect: (k) => setLog(`PlatformMetrics: 切换查看 [${k}] 遥测分类详细数据源`),
        })
      );
        }
    },
    {
        id: 239,
        title: "239. \u5355\u884c\u4ee3\u7801/\u547d\u4ee4/\u77ed\u8bed\u590d\u5236\u80f6\u56ca SnippetCapsule\uff08\u5bf9\u6807 HeroUI Snippet / Indie UI Command Bar\uff09",
        fn: "lvxSnippetCapsule({ text, symbol, tooltip, size, onCopy })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const box = document.createElement("div");
      box.style.cssText = "display:flex;align-items:center;gap:12px;flex-wrap:wrap;width:100%;";
      box.appendChild(K.lvxSnippetCapsule({
        text: "siyuan://blocks/20261119084530-abc1234",
        symbol: "((",
        tooltip: "双链引用锚文本快速复制",
        onCopy: (t) => setLog(`SnippetCapsule: 已复制块引用地址 [${t}]`),
      }));
      box.appendChild(K.lvxSnippetCapsule({
        text: "SELECT * FROM blocks WHERE type = 'h' LIMIT 10;",
        symbol: "sql:",
        tooltip: "SQL 模板语句快速提取",
        onCopy: (t) => setLog(`SnippetCapsule: 已复制代码模板 [${t}]`),
      }));
      stage.appendChild(box);
        }
    },
    {
        id: 240,
        title: "240. \u5f39\u6027\u7269\u7406\u963b\u5c3c\u5c55\u5f00\u5361\u7247 ElasticAccordion\uff08\u5bf9\u6807 Fancy Components Elastic Accordion\uff09",
        fn: "lvxElasticAccordion({ items, allowMultiple, onToggle })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxElasticAccordion({
          items: [
            {
              id: "ea-1",
              title: "🎯 考点深度解析：为什么租约期必须小于选举超时？",
              badge: "核心考点",
              content: "若租约时间大于选举超时，在网络发生单向分区时，旧 Leader 依然认为租约有效并继续本地响应读请求，而其余多数派节点已超时选出新 Leader 并接受写入，此时将直接导致旧 Leader 读到过期陈旧数据，线性一致性彻底被破坏。",
              defaultExpanded: true,
            },
            {
              id: "ea-2",
              title: "💡 工程落地防范：物理时钟漂移如何处理？",
              badge: "思维陷阱",
              content: "工程实践中必须引入时钟漂移上限 bound（如 NTP 最大漂移 100ms），并在租约生效计时前直接预先扣除 2 倍的时钟误差裕量。",
            },
          ],
          onToggle: (id, exp) => setLog(`ElasticAccordion: 卡片 [${id}] 展开状态变更为 [${exp}]`),
        })
      );
        }
    },
    {
        id: 241,
        title: "241. \u6781\u5149\u6d41\u52a8\u5fae\u5149\u73af\u5883\u5e95\u5ea7 AuroraContainer\uff08\u5bf9\u6807 Eldoraui Aurora Glow / Indie UI Mesh Glow\uff09",
        fn: "lvxAuroraContainer({ tone, children, title })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxAuroraContainer({
          title: "🏆 2026 年度小驴生态全域大师成就殿堂",
          children: "恭喜达成全生态互联里程碑！连续 100 天保持核心习惯不中断，1,420 张 FSRS 闪卡达到永久稳固记忆状态，12 套分布式系统模拟卷全部通关。",
        })
      );
        }
    },
    {
        id: 242,
        title: "242. \u591a\u6bb5\u591a\u8272\u590d\u5408\u6307\u6807\u5f97\u5206\u73af SegmentedMetricRing\uff08\u5bf9\u6807 HeroUI CircularProgress / Eldoraui Multi-Ring\uff09",
        fn: "lvxSegmentedMetricRing({ segments, maxValue, size, centerTitle, centerValue })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxSegmentedMetricRing({
          size: 130,
          centerValue: "92%",
          centerTitle: "习惯三维综合达标",
          segments: [
            { id: "s1", label: "晨间精读", value: 35, colorToken: "var(--lvx-brand)" },
            { id: "s2", label: "闪卡复盘", value: 35, colorToken: "var(--lvx-energy)" },
            { id: "s3", label: "深度真题", value: 22, colorToken: "var(--lvx-success)" },
          ],
        })
      );
        }
    },
    {
        id: 243,
        title: "243. \u52a0\u6743\u70ed\u5ea6\u667a\u80fd\u77e5\u8bc6\u6807\u7b7e\u4e91 WeightedTagCloud\uff08\u5bf9\u6807 Indie UI Interactive Cloud\uff09",
        fn: "lvxWeightedTagCloud({ items, selectedIds, onSelect })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxWeightedTagCloud({
          items: [
            { id: "t1", label: "分布式共识", weight: 95, count: 28 },
            { id: "t2", label: "Raft算法", weight: 88, count: 22 },
            { id: "t3", label: "FSRS记忆模型", weight: 75, count: 18 },
            { id: "t4", label: "租约机制", weight: 65, count: 14 },
            { id: "t5", label: "双链笔记", weight: 50, count: 9 },
            { id: "t6", label: "备忘", weight: 20, count: 3 },
            { id: "t7", label: "待整理", weight: 15, count: 2 },
          ],
          selectedIds: ["t1"],
          onSelect: (it, sel) => setLog(`WeightedTagCloud: 选定知识标签 [${it.label}]，当前激活集合: [${sel.join(", ")}]`),
        })
      );
        }
    },
    {
        id: 244,
        title: "244. \u7269\u7406\u5c42\u53e0\u901a\u77e5\u961f\u5217\u5bb9\u5668 StackedToastQueue\uff08\u5bf9\u6807 Sonner 12k Stars / Emil Kowalski \u7eb8\u724c\u5806\u53e0\uff09",
        fn: "lvxStackedToastQueue({ position, maxVisible })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const q = K.lvxStackedToastQueue();
      q.addToast({ title: "🎉 闪卡 FSRS 算法迭代完成", desc: "42 张核心卡片已推入下一遗忘周期" });
      q.addToast({ title: "⚡ 思源联合灾备快照成功", desc: "8 仓版本与数据指纹一致性校验通过" });

      const addBtn = K.lvxButton({
        label: "+ 触发新通知入栈",
        sm: true,
        onClick: () => {
          const titles = ["📥 拾遗自动剪藏入库", "📝 晨间日记已归档", "🔄 人脉交往温度刷新", "📊 模拟卷评分出炉"];
          const t = titles[Math.floor(Math.random() * titles.length)];
          q.addToast({ title: t, desc: "操作回执已生成，系统状态运行正常" });
          setLog(`StackedToastQueue: 新增通知入栈 [${t}]，自动产生物理层叠与景深缩放`);
        },
      });

      const clearBtn = K.lvxButton({
        label: "清空通知栈",
        sm: true,
        onClick: () => {
          q.clear();
          setLog("StackedToastQueue: 已清空当前通知队列");
        },
      });

      const wrap = document.createElement("div");
      wrap.style.cssText = "display:flex;flex-direction:column;gap:10px;width:100%;";
      const btnRow = document.createElement("div");
      btnRow.style.cssText = "display:flex;gap:6px;";
      btnRow.appendChild(addBtn);
      btnRow.appendChild(clearBtn);
      wrap.appendChild(btnRow);
      wrap.appendChild(q);
      stage.appendChild(wrap);
        }
    },
    {
        id: 245,
        title: "245. \u591a\u6863\u5438\u9644\u7269\u7406\u963b\u5c3c\u62bd\u5c49 SnapDrawer\uff08\u5bf9\u6807 Vaul 9k Stars \u00b7 40%/85% \u591a\u6863\u5438\u9644\u624b\u52bf\u62bd\u5c49\uff09",
        fn: "lvxSnapDrawer({ title, content, snapPoints, onClose })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const openBtn = K.lvxButton({
        label: "📱 呼出多档吸附物理抽屉 (模拟 40% / 85% 停靠)",
        variant: "primary",
        onClick: () => {
          const bodyContent = document.createElement("div");
          bodyContent.style.cssText = "display:flex;flex-direction:column;gap:10px;font-size:13px;line-height:1.6;";
          bodyContent.appendChild(K.lvxH("strong", { text: "《分布式系统架构设计手记》· 块引用详情" }));
          bodyContent.appendChild(K.lvxH("p", { text: "租约机制本质上是带有时钟有效期的分布式锁或权限授予。在租约有效窗口内，持有者可无脑认定自己拥有权威并本地响应读请求，从而完全跳过网络心跳与日志复制的往返延迟..." }));
          bodyContent.appendChild(K.lvxButton({ label: "切换吸附档位 (40% ↔ 85%)", sm: true, onClick: () => drawer.snapTo(1) }));

          const drawer = K.lvxSnapDrawer({
            title: "知识原块双向上下文溯源抽屉",
            snapPoints: [0.4, 0.85],
            content: bodyContent,
            onClose: () => setLog("SnapDrawer: 抽屉已平滑甩落关闭"),
          });
          document.body.appendChild(drawer);
          setLog("SnapDrawer: 抽屉已从底部升起，默认停靠在 40% 窥探态，支持手柄点击或拖拽向上吸附至 85% 深度展开态");
        },
      });
      stage.appendChild(openBtn);
        }
    },
    {
        id: 246,
        title: "246. \u5206\u6bb5\u5f0f\u5355\u9009\u836f\u4e38\u5361\u7247\u7ec4 RadioCardGroup\uff08\u5bf9\u6807 Radix Themes 3.0 / Park UI \u00b7 \u590d\u6742\u51b3\u7b56\u914d\u7f6e\u7f51\u683c\uff09",
        fn: "lvxRadioCardGroup({ name, value, options, onChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxRadioCardGroup({
          name: "review-algorithm-selector",
          value: "fsrs",
          options: [
            { value: "fsrs", title: "FSRS-4.5 认知模型", badge: "推荐", desc: "基于自由间隔遗忘曲线，精准根据提取难度调整复习周期，节省 30% 重复耗时。" },
            { value: "sm2", title: "经典 Anki SM-2", desc: "传统等比递增算法，规则简单确定，适合短期突击备考与死记硬背场景。" },
            { value: "leitner", title: "莱特纳盒子箱式流", desc: "箱式物理阶梯推进，直观朴素，适合初学者建立固定打卡记忆心智。" },
          ],
          onChange: (v) => setLog(`RadioCardGroup: 选定核心记忆算法模型为 [${v}]`),
        })
      );
        }
    },
    {
        id: 247,
        title: "247. \u5e73\u53f0\u81ea\u9002\u5e94\u5feb\u6377\u952e\u63d0\u793a\u7b26 HotkeyTooltip\uff08\u5bf9\u6807 Kibo UI / Ark UI \u00b7 \u81ea\u52a8\u8bc6\u522b Mac/Win \u539f\u751f\u5fae\u952e\u5e3d\uff09",
        fn: "lvxHotkeyTooltip({ label, hotkey, targetText })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const box = document.createElement("div");
      box.style.cssText = "display:flex;align-items:center;gap:12px;flex-wrap:wrap;";
      box.appendChild(K.lvxHotkeyTooltip({ label: "万能罗盘全局检索", hotkey: "mod+k" }));
      box.appendChild(K.lvxHotkeyTooltip({ label: "一键全库灾备快照", hotkey: "mod+alt+b" }));
      box.appendChild(K.lvxHotkeyTooltip({ label: "提交答案与交卷", hotkey: "mod+enter" }));
      stage.appendChild(box);
        }
    },
    {
        id: 248,
        title: "248. \u53cc\u7aef\u78c1\u5438\u533a\u95f4\u8303\u56f4\u6ed1\u5757 SnapRangeSlider\uff08\u5bf9\u6807 Park UI / Zag.js \u00b7 \u5361\u7247\u9057\u5fd8\u7387/\u7b14\u8bb0\u5b57\u6570\u533a\u95f4\u7b5b\u9009\uff09",
        fn: "lvxSnapRangeSlider({ title, min, max, value, step, unit, onChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxSnapRangeSlider({
          title: "🎯 闪卡认知提取难度区间筛选",
          min: 0,
          max: 100,
          step: 5,
          value: [25, 75],
          unit: "%",
          onChange: ([minV, maxV]) => setLog(`SnapRangeSlider: 筛选范围锁定在 [${minV}% ~ ${maxV}%]`),
        })
      );
        }
    },
    {
        id: 249,
        title: "249. \u6d41\u4f53\u81ea\u9002\u5e94\u53d8\u5f62\u8ba1\u6570\u724c MorphingNumberFlow\uff08\u5bf9\u6807 NumberFlow 10k Stars \u00b7 \u8fde\u7eed\u5929\u6570/\u8fdb\u4f4d\u81ea\u9002\u5e94\uff09",
        fn: "lvxMorphingNumberFlow({ value, prefix, suffix, size, tone })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const box = document.createElement("div");
      box.style.cssText = "display:flex;align-items:center;gap:20px;flex-wrap:wrap;width:100%;";
      const nf1 = K.lvxMorphingNumberFlow({ value: 99, prefix: "🔥 连击 ", suffix: " 天", tone: "energy", size: "hero" });
      const nf2 = K.lvxMorphingNumberFlow({ value: 1420, prefix: "📚 熟练 ", suffix: " 张", tone: "brand", size: "lg" });

      const incBtn = K.lvxButton({
        label: "+1 进位模拟 (99 -> 100)",
        sm: true,
        onClick: () => {
          box.replaceChild(K.lvxMorphingNumberFlow({ value: 100, prefix: "🔥 连击 ", suffix: " 天", tone: "energy", size: "hero" }), box.children[0]);
          setLog("MorphingNumberFlow: 模拟 99 -> 100 进位，观察容器宽度平滑展开且数字垂直进位");
        },
      });

      box.appendChild(nf1);
      box.appendChild(nf2);
      box.appendChild(incBtn);
      stage.appendChild(box);
        }
    },
    {
        id: 250,
        title: "250. \u53cc\u5411\u53d1\u6563\u6b63\u8d1f\u5bf9\u6bd4\u6761\u5f62\u56fe DivergentBarChart\uff08\u5bf9\u6807 shadcn/ui Charts \u00b7 \u6536\u652f\u51c0\u7ed3\u4f59/\u504f\u79bb\u5ea6\uff09",
        fn: "lvxDivergentBarChart({ title, items, unit, onItemClick })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxDivergentBarChart({
          title: "💳 11 月管家账目各项收支净结余与预算偏离度",
          unit: "元",
          items: [
            { id: "d1", label: "薪酬结余", value: 3400 },
            { id: "d2", label: "外包奖金", value: 1200 },
            { id: "d3", label: "餐饮超额", value: -450 },
            { id: "d4", label: "数码硬件", value: -1800 },
            { id: "d5", label: "图书学习", value: 320 },
          ],
          onItemClick: (it) => setLog(`DivergentBar: 查看项 [${it.label}] 原始账单明细流水`),
        })
      );
        }
    },
    {
        id: 251,
        title: "251. \u591a\u7ea7\u6811\u5f62\u5bfc\u5f15\u7ebf\u5927\u7eb2\u6811 ConnectorTreeView\uff08\u5bf9\u6807 Base UI / shadcn Tree \u00b7 \u8003\u70b9\u5927\u7eb2/\u5361\u5305\u5206\u7c7b\uff09",
        fn: "lvxConnectorTreeView({ title, nodes, onSelect })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxConnectorTreeView({
          title: "📚 《分布式系统架构师》考点核心知识树",
          nodes: [
            {
              id: "n1", label: "第一部分：分布式共识协议", badge: "42题",
              children: [
                { id: "n1-1", label: "Raft 算法领导者选举与心跳机制", badge: "18题" },
                { id: "n1-2", label: "Paxos 多数派投票与两阶段决议", badge: "14题" },
                { id: "n1-3", label: "ZAB 崩溃恢复与原子广播协议", badge: "10题" },
              ],
            },
            {
              id: "n2", label: "第二部分：分布式事务与锁治理", badge: "28题",
              children: [
                { id: "n2-1", label: "两阶段提交 (2PC) 阻塞性与超时判定", badge: "16题" },
                { id: "n2-2", label: "基于 Raft 租约的分布式锁工程实现", badge: "12题" },
              ],
            },
          ],
          onSelect: (node) => setLog(`ConnectorTree: 选定分类节点 [${node.label}]`),
        })
      );
        }
    },
    {
        id: 252,
        title: "252. \u65f6\u5e8f\u7b14\u5237\u805a\u7126\u8ff7\u4f60\u56fe BrushTimelineSlider\uff08\u5bf9\u6807 shadcn/ui Charts / Observable Plot \u00b7 \u8de8\u5468\u671f\u7f29\u653e\uff09",
        fn: "lvxBrushTimelineSlider({ title, points, unit, onRangeChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxBrushTimelineSlider({
          title: "📈 全年打卡与复习密度时序笔刷走势",
          unit: "次",
          points: [
            { label: "1月", value: 45 }, { label: "2月", value: 32 }, { label: "3月", value: 68 },
            { label: "4月", value: 75 }, { label: "5月", value: 82 }, { label: "6月", value: 95 },
            { label: "7月", value: 88 }, { label: "8月", value: 72 }, { label: "9月", value: 91 },
            { label: "10月", value: 100 }, { label: "11月", value: 96 }, { label: "12月", value: 84 },
          ],
        })
      );
        }
    },
    {
        id: 253,
        title: "253. \u5d4c\u5957\u591a\u6307\u6807\u540c\u5fc3\u73af\u5f62\u5360\u6bd4\u56fe NestedRadialGauge\uff08\u5bf9\u6807 shadcn/ui Charts / Tremor Raw \u00b7 \u4e09\u7ef4\u6307\u6807\u5e76\u8054\uff09",
        fn: "lvxNestedRadialGauge({ title, rings, centerValue, centerLabel, size })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxNestedRadialGauge({
          title: "📊 闪卡今日三维复习目标达成",
          centerValue: "88%",
          centerLabel: "综合达成率",
          size: 150,
          rings: [
            { id: "r1", label: "新学卡完成", value: 95, colorToken: "var(--lvx-brand)" },
            { id: "r2", label: "到期复习", value: 88, colorToken: "var(--lvx-energy)" },
            { id: "r3", label: "错题再巩固", value: 72, colorToken: "var(--lvx-success)" },
          ],
        })
      );
        }
    },
    {
        id: 254,
        title: "254. \u6d41\u5f0f\u91cc\u7a0b\u7891\u591a\u6b65\u8868\u5355\u5411\u5bfc LinearWizard\uff08\u5bf9\u6807 Origin UI / Linear \u00b7 \u590d\u6742\u914d\u7f6e\u6d41\u7a0b\u5f15\u5bfc\uff09",
        fn: "lvxLinearWizard({ steps, currentStepIndex, allowClickPrevious, onStepChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxLinearWizard({
          steps: [
            { id: "s1", title: "选择目标题库", desc: "选择包含考点的卡包" },
            { id: "s2", title: "抽样算法配置", desc: "错题优先 / FSRS权重" },
            { id: "s3", title: "时间与防作弊规则", desc: "限时 60 分钟 / 锁屏补偿" },
            { id: "s4", title: "一键生成试卷", desc: "预览与交卷卡排版" },
          ],
          currentStepIndex: 1,
          allowClickPrevious: true,
          onStepChange: (idx) => setLog(`LinearWizard: 用户回跳至第 ${idx + 1} 步检查配置`),
        })
      );
        }
    },
    {
        id: 255,
        title: "255. \u53cc\u5411\u5373\u65f6\u6362\u7b97\u8054\u52a8\u8f6c\u6362\u69fd DualUnitConverter\uff08\u5bf9\u6807 Origin UI / Raycast Converter \u00b7 \u591a\u5e01\u79cd/\u5206\u79d2\u53cc\u5411\u8054\u52a8\uff09",
        fn: "lvxDualUnitConverter({ units, defaultSourceId, defaultTargetId, initialValue, onChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxDualUnitConverter({
          units: [
            { id: "cny", label: "人民币", symbol: "¥", rate: 1 },
            { id: "usd", label: "美元", symbol: "$", rate: 7.24 },
            { id: "eur", label: "欧元", symbol: "€", rate: 7.65 },
          ],
          defaultSourceId: "cny",
          defaultTargetId: "usd",
          initialValue: 100,
          onChange: (res) => setLog(`DualConverter: 实时换算 ¥${res.sourceValue} 对应 $${res.targetValue}`),
        })
      );
        }
    },
    {
        id: 256,
        title: "256. \u97f3\u9891\u6ce2\u5f62\u5373\u65f6\u62d6\u62fd\u5668 AudioWaveScrubber\uff08\u5bf9\u6807 Kibo UI / Origin UI \u00b7 \u542c\u529b\u7cbe\u542c/TTS\u6717\u8bfb\u63a7\u5236\uff09",
        fn: "lvxAudioWaveScrubber({ duration, currentTime, barCount, onSeek })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxAudioWaveScrubber({
          duration: 180,
          currentTime: 54,
          barCount: 42,
          onSeek: (t) => setLog(`AudioWaveScrubber: 跳转寻道至 ${Math.round(t)} 秒`),
        })
      );
        }
    },
    {
        id: 257,
        title: "257. \u77e5\u8bc6\u5757\u8840\u7f18\u6811\u5f62\u56fe\u8c31\u6f14\u8fdb\u5668 BlockGenealogyLineage\uff08\u5bf9\u6807 Kibo UI / Indie UI \u00b7 \u5355\u5757\u884d\u751f\u8109\u7edc\uff09",
        fn: "lvxBlockGenealogyLineage({ rootNode, onNavigateBlock })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxBlockGenealogyLineage({
          rootNode: {
            id: "b-root",
            type: "root",
            title: "📄 《In Search of an Understandable Consensus Algorithm》论文原著",
            children: [
              {
                id: "b-slice",
                type: "parent",
                title: "📑 微信读书划线摘录：§5.2 选举超时与随机化",
                children: [
                  {
                    id: "b-card",
                    type: "current",
                    title: "🎴 FSRS 闪卡：选举超时推荐时间范围是多少？",
                    children: [
                      {
                        id: "b-quiz",
                        type: "derived",
                        title: "🎯 全真模拟卷：第 14 题（衍生变式考点）",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          onNavigateBlock: (id) => setLog(`BlockGenealogy: 穿透定位思源知识块 [${id}]`),
        })
      );
        }
    },
    {
        id: 258,
        title: "258. \u6781\u7b80\u591a\u7ef4\u6253\u5206\u4e0e\u96f7\u8fbe\u8bc4\u4f30\u77e9\u9635 MultiCriteriaMatrix\uff08\u5bf9\u6807 Indie UI / Origin UI \u00b7 \u4e3b\u89c2\u9898\u91cf\u89c4/\u6d88\u8d39\u6743\u8861\uff09",
        fn: "lvxMultiCriteriaMatrix({ title, criteria, onChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxMultiCriteriaMatrix({
          title: "🎯 主观论述题多维综合量规赋分矩阵",
          criteria: [
            { id: "c1", label: "核心概念阐述准确度", weight: 0.4, maxScore: 5, currentScore: 4 },
            { id: "c2", label: "工程实践边界与案例剖析", weight: 0.3, maxScore: 5, currentScore: 5 },
            { id: "c3", label: "推导逻辑严密性与条理性", weight: 0.2, maxScore: 5, currentScore: 4 },
            { id: "c4", label: "术语表达与书写规范", weight: 0.1, maxScore: 5, currentScore: 5 },
          ],
          onChange: (crit, total) => setLog(`MultiCriteriaMatrix: 赋分动态联动更新，当前加权综合得分 [${total} 分]`),
        })
      );
        }
    },
    {
        id: 259,
        title: "259. \u7eb5\u5411\u9605\u8bfb\u9ad8\u4eae\u8ffd\u8e2a\u6881 TracingBeam\uff08\u5bf9\u6807 Aceternity UI / 21st.dev \u00b7 \u6e10\u53d8\u8f68\u9053/\u52a8\u6001\u6b65\u8fdb\u53d1\u5149\uff09",
        fn: "lvxTracingBeam({ title, items, onItemClick })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxTracingBeam({
          title: "📖 分布式共识算法与状态机复制深读路线",
          items: [
            { id: "c1", title: "1. Paxos 与 Raft 核心选举机制异同", excerpt: "对比两者的脑裂防范机制、任期 Term 与随机心跳超时的工程实现。", active: true },
            { id: "c2", title: "2. 日志复制与安全性不变式推导", excerpt: "Leader 提交日志前必须达成 Quorum 确认，状态机按序应用。", active: false },
            { id: "c3", title: "3. 状态机快照与日志裁剪持久化", excerpt: "利用 CompactSnapshot 压缩历史日志段，防止内存无上限膨胀。", active: false },
          ],
          onItemClick: (id) => setLog(`[阅读追踪] 点击跳转至章节: ${id}`),
        })
      );
        }
    },
    {
        id: 260,
        title: "260. \u76ee\u6807\u9608\u503c\u52a8\u6001\u8b66\u6212\u8fdb\u5ea6\u69fd TargetThresholdBar\uff08\u5bf9\u6807 Tremor Raw / shadcn \u00b7 \u52a8\u6001\u8272\u6e29/\u76ee\u6807\u523b\u5ea6\u9488\uff09",
        fn: "lvxTargetThresholdBar({ title, current, target, max, unit, tone })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const box = document.createElement("div");
      box.style.cssText = "display:flex;flex-direction:column;gap:12px;width:100%;";
      box.appendChild(
        K.lvxTargetThresholdBar({
          title: "🔥 小驴打卡 · 11月连续自律挑战",
          current: 24,
          target: 28,
          unit: "天",
          tone: "energy",
        })
      );
      box.appendChild(
        K.lvxTargetThresholdBar({
          title: "⚡ 小驴闪卡 · 每日高频复习达标",
          current: 85,
          target: 80,
          unit: "张",
          tone: "success",
        })
      );
      stage.appendChild(box);
        }
    },
    {
        id: 261,
        title: "261. \u96f7\u8fbe\u4fe1\u6807\u6ce2\u7eb9\u5fbd\u6807 RadarBeaconBadge\uff08\u5bf9\u6807 Magic UI / 21st.dev \u00b7 \u53cc\u73af\u8109\u51b2/\u8bed\u4e49\u72b6\u6001\u4fe1\u6807\uff09",
        fn: "lvxRadarBeaconBadge({ label, subtext, tone, active, onClick })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;gap:10px;flex-wrap:wrap;width:100%;";
      row.appendChild(
        K.lvxRadarBeaconBadge({
          label: "后台自检活跃",
          subtext: "0.2s前",
          tone: "brand",
          active: true,
          onClick: () => setLog("[信标] 查看后台自检诊断日志"),
        })
      );
      row.appendChild(
        K.lvxRadarBeaconBadge({
          label: "FSRS 权重优化中",
          subtext: "GPU 加速",
          tone: "energy",
          active: true,
          onClick: () => setLog("[信标] 查看权重计算资源池"),
        })
      );
      row.appendChild(
        K.lvxRadarBeaconBadge({
          label: "雷切指令已就绪",
          subtext: "8个生效",
          tone: "success",
          active: false,
          onClick: () => setLog("[信标] 查看已加载片段"),
        })
      );
      stage.appendChild(row);
        }
    },
    {
        id: 262,
        title: "262. \u4e09\u7ef4\u5f15\u529b\u9489\u951a\u70b9\u5361\u7247 PinAnchorCard\uff08\u5bf9\u6807 Aceternity UI 3D Pin \u00b7 \u60ac\u6d6e\u5149\u6807/\u5757\u5750\u6807\u951a\u5b9a\uff09",
        fn: "lvxPinAnchorCard({ title, blockRef, snippet, anchorLabel, onJump })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxPinAnchorCard({
          title: "📌 核心知识点：FSRS 双向衰减记忆留存率计算模型",
          blockRef: "20261119102430-riff-fsrs-core",
          anchorLabel: "算法核心块",
          snippet: "R_t = (1 + Factor \cdot t / S)^{-Decay}，通过稳定度 S 与难度 D 双向推导下次最佳复习间隔，相比传统 SM-2 减少 30% 无效重复。",
          onJump: (ref) => setLog(`[引力钉] 触发思源内核跳转定位至块: ${ref}`),
        })
      );
        }
    },
    {
        id: 263,
        title: "263. \u8f6c\u5316\u6f0f\u6597\u6d41\u5f0f\u9636\u6bb5\u6761 FunnelStageBar\uff08\u5bf9\u6807 Tremor Raw Funnel \u00b7 \u9010\u7ea7\u7559\u5b58/\u52a8\u6001\u6d41\u5931\u7387\uff09",
        fn: "lvxFunnelStageBar({ title, stages, onStageClick })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxFunnelStageBar({
          title: "📊 知识转化与考前掌握度漏斗",
          stages: [
            { id: "s1", name: "导入知识库", count: 520, tone: "brand" },
            { id: "s2", name: "完成首次制卡", count: 360, tone: "brand" },
            { id: "s3", name: "激活连续复习", count: 240, tone: "energy" },
            { id: "s4", name: "期末达到精通", count: 180, tone: "success" },
          ],
          onStageClick: (id) => setLog(`[转化漏斗] 查看阶段详情: ${id}`),
        })
      );
        }
    },
    {
        id: 264,
        title: "264. \u884c\u5185\u80f6\u56ca\u590d\u5408\u591a\u9009\u8f93\u5165\u6846 TagComboboxInput\uff08\u5bf9\u6807 Origin UI \u00b7 \u5b9e\u4f53\u80f6\u56ca/\u5373\u65f6\u56de\u8f66\u521b\u5efa\uff09",
        fn: "lvxTagComboboxInput({ options, value, placeholder, allowCreate, onChange, onCreate })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxTagComboboxInput({
          options: [
            { id: "math", label: "高等数学", tone: "brand", group: "基础学科" },
            { id: "cs", label: "操作系统", tone: "energy", group: "工学专精" },
            { id: "exam", label: "期末必背", tone: "danger", group: "复习计划" },
            { id: "fsrs", label: "高遗忘率", tone: "warn", group: "算法分类" },
          ],
          value: ["math", "exam"],
          allowCreate: true,
          onChange: (ids) => setLog(`[标签输入] 当前选中标签: ${ids.join(", ")}`),
          onCreate: (lbl) => setLog(`[标签输入] 动态新建标签实体: ${lbl}`),
        })
      );
        }
    },
    {
        id: 265,
        title: "265. \u5feb\u6377\u9884\u8bbe\u65e5\u671f\u65f6\u95f4\u9009\u62e9\u5668 PresetDateTimePicker\uff08\u5bf9\u6807 Origin UI / shadcn \u00b7 \u76f8\u5bf9\u81ea\u7136\u65f6\u95f4/\u65f6\u5386\u8054\u52a8\uff09",
        fn: "lvxPresetDateTimePicker({ presets, initialDate, initialTime, onChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxPresetDateTimePicker({
          presets: [
            { id: "tonight", label: "今晚 20:00", subtext: "当日收尾复盘", hoursOffset: 4 },
            { id: "tomorrow_am", label: "明天 09:00", subtext: "晨间深度精力", hoursOffset: 16 },
            { id: "weekend", label: "本周末 14:00", subtext: "系统大块整理", hoursOffset: 72 },
            { id: "next_week", label: "下周一 09:00", subtext: "跨周任务规划", hoursOffset: 120 },
          ],
          onChange: (d, t) => setLog(`[预设时历] 时间更新: ${d} ${t}`),
        })
      );
        }
    },
    {
        id: 266,
        title: "266. \u884c\u52a8\u5efa\u8bae\u578b\u5bcc\u5bfc\u5f15\u7a7a\u6001\u5361 ActionableEmptyState\uff08\u5bf9\u6807 shadcn/ui Registry Blocks \u00b7 \u751f\u4ea7\u529b\u78c1\u8d34/\u63a8\u8350\u8def\u5f84\uff09",
        fn: "lvxActionableEmptyState({ title, description, actions, proactiveTip })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxActionableEmptyState({
          title: "当前知识箱暂无闪卡条目",
          description: "您可以通过以下常用快捷生产力路径开始构建您的第一套牌组：",
          actions: [
            {
              id: "extract",
              title: "从当前正文提取",
              description: "自动解析 Protyle 编辑器划词并抠卡",
              kbd: "Alt+E",
              tone: "brand",
              onClick: () => setLog("[行动建议] 触发从当前正文抠卡"),
            },
            {
              id: "import",
              title: "导入预制牌组",
              description: "支持导入 Anki .apkg 与 CSV 词库",
              kbd: "Ctrl+I",
              tone: "energy",
              onClick: () => setLog("[行动建议] 弹出外部牌组导入向导"),
            },
            {
              id: "ai_gen",
              title: "AI 智能批量出题",
              description: "基于文档大纲一键自动出单选与问答",
              kbd: "Alt+A",
              tone: "success",
              onClick: () => setLog("[行动建议] 启动 AI 出题引擎"),
            },
          ],
          proactiveTip: "小驴闪卡已开启后台跨文档引用自动索引，您可在任何思源正文中直接划词制卡。",
        })
      );
        }
    },
    {
        id: 267,
        title: "267. \u53cc\u680f\u53c2\u6570\u5bf9\u7167\u77e9\u9635\u8868 ParamCompareMatrix\uff08\u5bf9\u6807 Origin UI Matrix \u00b7 \u952e\u503c\u6bd4\u5bf9/\u5355\u9879\u5feb\u901f\u4ef2\u88c1\uff09",
        fn: "lvxParamCompareMatrix({ title, leftHeader, rightHeader, rows, onAcceptRight })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxParamCompareMatrix({
          title: "⚖️ FSRS 算法权重调校对照矩阵",
          leftHeader: { label: "本地当前配置", tag: "v1.2" },
          rightHeader: { label: "云端推荐参数", tag: "v1.5" },
          rows: [
            { key: "retention", label: "期望记忆留存率 (Request Retention)", leftValue: "0.85", rightValue: "0.90" },
            { key: "maxInterval", label: "最大复习间隔天数 (Max Interval)", leftValue: "36500", rightValue: "36500" },
            { key: "decayRate", label: "遗忘衰减权重 (Decay Factor)", leftValue: "0.42", rightValue: "0.38" },
            { key: "warmupBonus", label: "首日预热增益 (Day 1 Warmup)", leftValue: "1.2", rightValue: "1.5" },
          ],
          onAcceptRight: (key) => setLog(`[参数仲裁] 已采纳新参数项: ${key}`),
        })
      );
        }
    },
    {
        id: 268,
        title: "268. \u7d27\u51d1\u5fae\u578b\u901a\u77e5\u62bd\u5c49\u6258\u76d8 MiniNoticeTray\uff08\u5bf9\u6807 FlyonUI \u00b7 \u8bed\u4e49\u8109\u51b2/\u672a\u8bfb\u5206\u8bca/\u5373\u65f6\u6807\u8bfb\uff09",
        fn: "lvxMiniNoticeTray({ items, onMarkAllRead, onItemClick, onViewAll })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxMiniNoticeTray({
          items: [
            { id: "n1", title: "14 张闪卡今日到期", detail: "包含考研高频核心词汇与数学公式", tone: "brand", unread: true, time: "5m前" },
            { id: "n2", title: "打卡连续 24 天达成！", detail: "已解锁「坚持不懈」勋章与专属特效", tone: "energy", unread: true, time: "1h前" },
            { id: "n3", title: "人脉张总生日提醒", detail: "建议今日发送生日祝福与节日问候", tone: "success", unread: false, time: "3h前" },
            { id: "n4", title: "雷切片段同步就绪", detail: "8 项全局快捷指令已在本地缓存就绪", tone: "brand", unread: false, time: "昨天" },
          ],
          onMarkAllRead: () => setLog("[微通知托盘] 全部标记为已读"),
          onItemClick: (id) => setLog(`[微通知托盘] 点击通知卡片: ${id}`),
          onViewAll: () => setLog("[微通知托盘] 打开全屏历史收件箱"),
        })
      );
        }
    },
    {
        id: 269,
        title: "269. \u5f39\u6027\u6d41\u5f0f\u8fdb\u573a\u901a\u77e5\u961f\u5217 AnimatedListStream\uff08\u5bf9\u6807 Magic UI 14.8k+ Stars \u00b7 \u7269\u7406\u5f39\u7c27\u963b\u5c3c/\u975e\u6253\u65ad\u7cfb\u7edf\u8109\u640f\uff09",
        fn: "lvxAnimatedListStream({ items, maxVisible, title, onItemClick })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxAnimatedListStream({
          title: "⚡ 小驴生态系统实时活动流",
          maxVisible: 4,
          items: [
            { id: "a1", title: "小驴拾遗 · 剪藏成功入库", detail: "《关于分布式系统共识算法工程实践》已存入拾遗箱", tone: "brand", time: "刚刚" },
            { id: "a2", title: "小驴闪卡 · FSRS 权重优化完成", detail: "148 次复习日志完成拟合，预测准确率提升 12%", tone: "energy", time: "2m前" },
            { id: "a3", title: "小驴管家 · 每日自动备份完成", detail: "已备份 8 仓快照至本地沙箱，耗时 0.4s", tone: "success", time: "15m前" },
            { id: "a4", title: "小驴人脉 · 周末联络计划就绪", detail: "2 位好友进入冷却期提醒范围", tone: "brand", time: "1h前" },
          ],
          onItemClick: (it) => setLog(`[通知流] 点击动态条目: ${it.title}`),
        })
      );
        }
    },
    {
        id: 270,
        title: "270. \u5149\u611f\u8ddf\u968f\u5916\u53d1\u5149\u4fbf\u5f53\u5361 CursorGlowBentoCard\uff08\u5bf9\u6807 Aceternity UI 16.2k+ Stars \u00b7 \u83ab\u5170\u8fea\u8ffd\u5149/\u6697\u8272\u5fae\u5149\u6655\uff09",
        fn: "lvxCursorGlowBentoCard({ title, subtitle, tag, snippet, glowColor, onClick })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const grid = document.createElement("div");
      grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:12px;width:100%;";
      grid.appendChild(
        K.lvxCursorGlowBentoCard({
          title: "💎 小驴管家 · 旗舰资产看板",
          subtitle: "2026 Q4 财务与资产概览",
          tag: "旗舰模式",
          snippet: "流动资产覆盖率 3.8x，应急备用金充足，固定资产折旧平缓无断崖。",
          onClick: () => setLog("[追光便当卡] 点击进入管家财务总览"),
        })
      );
      grid.appendChild(
        K.lvxCursorGlowBentoCard({
          title: "🎯 小驴考试 · 冲刺模考池",
          subtitle: "计算机体系结构专精",
          tag: "今日重点",
          tagTone: "energy",
          glowColor: "var(--lvx-energy)",
          snippet: "已完成 180 道真题演练，知识薄弱点集中在多核 Cache 一致性协议与乱序执行。",
          onClick: () => setLog("[追光便当卡] 点击进入模考冲刺题库"),
        })
      );
      stage.appendChild(grid);
        }
    },
    {
        id: 271,
        title: "271. \u5b57\u7b26\u77e9\u9635\u89e3\u5bc6\u6e32\u67d3\u6587\u672c ScrambleDecryptText\uff08\u5bf9\u6807 React Bits 8.8k+ Stars \u00b7 \u8d5b\u535a\u77e9\u9635\u4e71\u5e8f\u6536\u655b/\u4e3b\u52a8\u56de\u5fc6\u4eea\u5f0f\u611f\uff09",
        fn: "lvxScrambleDecryptText({ text, label, duration, cipherChars, autoTrigger })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const box = document.createElement("div");
      box.style.cssText = "display:flex;flex-direction:column;gap:10px;width:100%;";
      box.appendChild(
        K.lvxScrambleDecryptText({
          label: "闪卡核心公式",
          text: "R(t) = (1 + Factor * t / S)^(-Decay)",
          autoTrigger: false,
        })
      );
      box.appendChild(
        K.lvxScrambleDecryptText({
          label: "敏感考点答案",
          text: "Paxos 协议通过 Prepare/Accept 二阶段仲裁实现全局一致性",
          autoTrigger: false,
        })
      );
      stage.appendChild(box);
        }
    },
    {
        id: 272,
        title: "272. \u6d41\u4f53\u653e\u5927\u78c1\u5438\u6d6e\u52a8\u80f6\u56ca DockMagnificationPod\uff08\u5bf9\u6807 React Bits / Indie UI 8.8k+ Stars \u00b7 \u9ad8\u65af\u66f2\u7ebf\u81ea\u9002\u5e94/\u89e6\u63a7\u9632\u8bef\u89e6\uff09",
        fn: "lvxDockMagnificationPod({ items, baseSize, maxSize })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const wrap = document.createElement("div");
      wrap.style.cssText = "display:flex;justify-content:center;width:100%;padding:10px 0;";
      wrap.appendChild(
        K.lvxDockMagnificationPod({
          items: [
            { id: "d1", label: "闪卡制卡", iconText: "🃏", tone: "brand", onClick: () => setLog("[浮动舱] 点击闪卡制卡") },
            { id: "d2", label: "习惯打卡", iconText: "🔥", tone: "energy", onClick: () => setLog("[浮动舱] 点击习惯打卡") },
            { id: "d3", label: "真题模考", iconText: "📝", tone: "success", onClick: () => setLog("[浮动舱] 点击真题模考") },
            { id: "d4", label: "人脉速记", iconText: "👥", tone: "brand", onClick: () => setLog("[浮动舱] 点击人脉速记") },
            { id: "d5", label: "全局搜索", iconText: "🔍", tone: "energy", onClick: () => setLog("[浮动舱] 点击全局搜索") },
          ],
        })
      );
      stage.appendChild(wrap);
        }
    },
    {
        id: 273,
        title: "273. \u53d8\u5f62\u5c55\u5f00\u539f\u4f4d\u5f39\u7a97\u5361 MorphingDialogCard\uff08\u5bf9\u6807 Magic UI / Motion Primitives 14.8k+ Stars \u00b7 \u7a7a\u95f4\u8fde\u7eed\u8ba4\u77e5/\u65e0\u7f1d\u6298\u53e0\uff09",
        fn: "lvxMorphingDialogCard({ title, subtitle, tag, summary, details, onToggle })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxMorphingDialogCard({
          title: "👤 人脉深度档案 · 张首席投资官",
          subtitle: "金雨茂物合伙人 · 长期战略伙伴",
          tag: "核心层",
          summary: "2026年度合作项目 4 项，历史信诺履约率 100%，上次深度会晤 2026-11-12。",
          details: "深入探讨了具身智能与垂直行业 AI 代理的投资落地路径。关键雷区：忌谈宏观大词，重看现金流与真实续约率。建议在 12 月中旬前发送年度复盘简报。",
          onToggle: (open) => setLog(`[变形展开卡] 展开状态变更: ${open ? "展开详情" : "收起简报"}`),
        })
      );
        }
    },
    {
        id: 274,
        title: "274. \u591a\u5206\u7c7b\u6bd4\u4f8b\u5206\u6bb5\u6761\u5f62\u56fe CategorySegmentBar\uff08\u5bf9\u6807 Tremor Raw 16.8k+ Stars \u00b7 \u5fae\u7f1d\u9699\u6c34\u5e73\u69fd/\u6807\u6746\u523b\u5ea6\u9488\uff09",
        fn: "lvxCategorySegmentBar({ title, segments, markerPercentage, markerLabel })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxCategorySegmentBar({
          title: "📊 计算机体系专精 · 题型分布与达标基准",
          segments: [
            { id: "s1", label: "单选题", value: 40, tone: "brand" },
            { id: "s2", label: "多选题", value: 25, tone: "energy" },
            { id: "s3", label: "判断题", value: 20, tone: "success" },
            { id: "s4", label: "综合案例", value: 15, tone: "danger" },
          ],
          markerPercentage: 75,
          markerLabel: "及格达标线 75%",
        })
      );
        }
    },
    {
        id: 275,
        title: "275. \u96fe\u9762\u9632\u5267\u900f\u6298\u53e0\u906e\u7f69\u5361 InteractiveSpoilerCard\uff08\u5bf9\u6807 Mantine / Telegram 26.5k+ Stars \u00b7 \u78e8\u7802\u6d88\u878d\u906e\u7f69/\u9632\u5077\u770b\uff09",
        fn: "lvxInteractiveSpoilerCard({ title, content, badge, maxHeight, onToggle })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxInteractiveSpoilerCard({
          title: "💡 算法真题深入推导思路",
          badge: "主动回忆",
          maxHeight: 85,
          content: "核心推导步骤：首先构造广义拉格朗日乘子函数 L(x, λ) = f(x) - ∑ λ_i g_i(x)。根据 KKT 条件的一阶导为零推导极值点，结合对偶理论证明下界对齐，进而完成全局收敛性不变式证明。注意：必须校验极值点的海森矩阵正定性，规避马鞍点陷阱。",
          onToggle: (exp) => setLog(`[防剧透遮罩] 状态: ${exp ? "已揭晓" : "已遮蔽"}`),
        })
      );
        }
    },
    {
        id: 276,
        title: "276. \u7ed3\u6784\u5316\u952e\u503c\u53c2\u6570\u7cbe\u70bc\u5361 KeyValueTileList\uff08\u5bf9\u6807 DaisyUI 5 / Tremor Raw 35k+ Stars \u00b7 \u6591\u9a6c\u7eb9\u5fae\u900f/\u7b49\u5bbd\u6392\u5370/\u5373\u65f6\u590d\u5236\uff09",
        fn: "lvxKeyValueTileList({ title, items, onCopy })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxKeyValueTileList({
          title: "⚙️ FSRS-5 核心调度算法参数矩阵",
          items: [
            { key: "request_retention", label: "期望记忆留存率 (request_retention)", value: "0.90", badgeTone: "brand" },
            { key: "maximum_interval", label: "最大复习间隔天数 (maximum_interval)", value: "36500 天", badgeTone: "energy" },
            { key: "w_stability_decay", label: "遗忘负反馈衰减系数 (w_decay)", value: "0.412", badgeTone: "success" },
            { key: "enable_fuzzing", label: "随机扰动打散开关 (enable_fuzz)", value: "ENABLED", badgeTone: "brand" },
          ],
          onCopy: (it) => setLog(`[键值卡] 已复制参数: ${it.key} = ${it.value}`),
        })
      );
        }
    },
    {
        id: 277,
        title: "277. \u591a\u533a\u95f4\u534a\u5706\u4eea\u8868\u9762\u677f MultiSegmentGaugeDial\uff08\u5bf9\u6807 Tremor Raw / Mantine 26.5k+ Stars \u00b7 180\u00b0\u62f1\u76d8/\u591a\u8272\u6e29\u523b\u5ea6/\u6570\u636e\u82f1\u96c4\uff09",
        fn: "lvxMultiSegmentGaugeDial({ title, value, max, unit, statusLabel })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const row = document.createElement("div");
      row.style.cssText = "display:flex;justify-content:center;width:100%;";
      row.appendChild(
        K.lvxMultiSegmentGaugeDial({
          title: "🎯 全库备考综合通过指数",
          value: 86,
          max: 100,
          unit: "分",
          statusLabel: "卓越状态 · 稳步推进",
        })
      );
      stage.appendChild(row);
        }
    },
    {
        id: 278,
        title: "278. \u5f39\u6027\u6a2a\u5411\u5c55\u5f00\u5fae\u578b\u641c\u7d22\u69fd ExpandableSearchInput\uff08\u5bf9\u6807 Origin UI / Linear 5k+ Stars \u00b7 \u7d27\u51d132px\u6f5c\u4f0f/\u5e73\u6ed1\u6a2a\u5411\u5ef6\u5c55\uff09",
        fn: "lvxExpandableSearchInput({ placeholder, onSearch, onClear })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const bar = document.createElement("div");
      bar.style.cssText = "display:flex;align-items:center;gap:10px;width:100%;padding:10px 14px;background:var(--lvx-surface-sunken);border-radius:var(--lvx-r-md);";
      bar.appendChild(document.createTextNode("工具栏操作区："));
      bar.appendChild(
        K.lvxExpandableSearchInput({
          placeholder: "快速过滤指令...",
          onSearch: (q) => setLog(`[微型搜索] 搜索关键字: ${q}`),
          onClear: () => setLog("[微型搜索] 已清空搜索"),
        })
      );
      stage.appendChild(bar);
        }
    },
    {
        id: 279,
        title: "279. \u54cd\u5e94\u5f0f\u56fe\u50cf\u4ea4\u4e92\u6846\u9009\u906e\u6321\u4e0e\u63a9\u6a21\u6807\u6ce8\u5de5\u4f5c\u53f0 InteractiveOcclusionEditor\uff08\u6765\u6e90\uff1a\u5c0f\u9a74\u95ea\u5361 occlusion-editor\uff09",
        fn: "lvxInteractiveOcclusionEditor({ title, initialRects, onSave, onClose })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxInteractiveOcclusionEditor({
          title: "🖼 知识点图像交互遮挡与掩模标定台",
          initialRects: [
            { id: "m1", x: 18, y: 25, w: 28, h: 20, label: "#1 核心机理" },
            { id: "m2", x: 54, y: 40, w: 32, h: 22, label: "#2 数理推导" },
          ],
          onSave: (rects) => setLog(`[遮挡标注] 保存 ${rects.length} 处区域标注`),
          onClose: () => setLog("[遮挡标注] 关闭标注台"),
        })
      );
        }
    },
    {
        id: 280,
        title: "280. \u8de8\u5e93\u77e5\u8bc6\u5207\u7247\u81ea\u9009\u7bee\u4e0e\u6279\u91cf\u88c5\u914d\u62bd\u5c49 SelectiveStashDrawer\uff08\u6765\u6e90\uff1a\u5c0f\u9a74\u95ea\u5361/\u8003\u8bd5 marketplace-studio\uff09",
        fn: "lvxSelectiveStashDrawer({ title, items, onRemoveItem, onAssemble, onClose })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxSelectiveStashDrawer({
          title: "🧺 知识切片自选篮与装配台",
          items: [
            { id: "c1", sourceTitle: "计算机体系结构 · v1.2", previewFront: "指令流水线发生结构冲突时，硬件通常采取何种旁路机制缓解阻塞？" },
            { id: "c2", sourceTitle: "分布式系统论文精读", previewFront: "Raft 协议中 Leader 崩溃后，Follower 的选举超时随机化机制原理？" },
          ],
          onRemoveItem: (id) => setLog(`[切片自选篮] 移除切片: ${id}`),
          onAssemble: (items) => setLog(`[切片自选篮] 批量装配 ${items.length} 项切片入库`),
          onClose: () => setLog("[切片自选篮] 关闭抽屉"),
        })
      );
        }
    },
    {
        id: 281,
        title: "281. \u5730\u57df\u4eba\u8109\u70ed\u529b\u56fe\u8c31\u4e0e\u5dee\u65c5\u7a7f\u68ad\u8c03\u5ea6\u4e2d\u5fc3 RegionExplorerDispatcher\uff08\u6765\u6e90\uff1a\u5c0f\u9a74\u4eba\u8109 RegionExplorerDialog\uff09",
        fn: "lvxRegionExplorerDispatcher({ title, entities, initialCity, onSelectCity, onExportItinerary })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxRegionExplorerDispatcher({
          title: "🗺 地域分布探索与差旅穿梭调度",
          entities: [
            { id: "p1", name: "张总工程师", city: "北京", role: "国家电网院 · 首席" },
            { id: "p2", name: "李合伙人", city: "北京", role: "金雨茂物 · 董事" },
            { id: "p3", name: "王总监", city: "上海", role: "商汤科技 · 投资" },
            { id: "p4", name: "陈教授", city: "杭州", role: "浙大控制系" },
          ],
          onSelectCity: (city) => setLog(`[地域调度] 切换城市: ${city}`),
          onExportItinerary: (city) => setLog(`[地域调度] 导出 ${city} 差旅清单`),
        })
      );
        }
    },
    {
        id: 282,
        title: "282. \u6587\u6863\u51fa\u7248\u6392\u7248\u4e0e\u6253\u5370\u9884\u68c0\u5de5\u4f5c\u53f0 PaperPrintLayoutPreflight\uff08\u6765\u6e90\uff1a\u5c0f\u9a74\u8003\u8bd5 PaperAssembleModal\uff09",
        fn: "lvxPaperPrintLayoutPreflight({ title, totalCount, initialSize, initialColumns, onPrint, onExportPdf })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxPaperPrintLayoutPreflight({
          title: "🖨 知识出版排版与打印预检台",
          totalCount: 45,
          initialSize: "A4",
          initialColumns: "double",
          onPrint: () => setLog("[打印预检] 发起物理打印作业"),
          onExportPdf: () => setLog("[打印预检] 导出高保真出版 PDF"),
        })
      );
        }
    },
    {
        id: 283,
        title: "283. \u6df1\u5ea6\u7a7f\u900f\u68c0\u7d22\u5de5\u4f5c\u53f0\u4e0e\u89c6\u53e3\u5e73\u6ed1\u6f2b\u6e38\u677f OmniPenetrationSearchBoard\uff08\u6765\u6e90\uff1a\u5c0f\u9a74\u96f7\u5207 doc-search-ui\uff09",
        fn: "lvxOmniPenetrationSearchBoard({ placeholder, initialResults, onSearch, onSelect })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxOmniPenetrationSearchBoard({
          placeholder: "输入关键词、-排除词 或 \"精准短语\"...",
          onSearch: (q) => setLog(`[穿透搜索] 检索关键词: ${q}`),
          onSelect: (item) => setLog(`[穿透搜索] 确认跳转至: ${item.title}`),
        })
      );
        }
    },
    {
        id: 284,
        title: "284. \u653e\u5c04\u72b6\u8f6e\u76d8\u60ac\u6d6e\u73af\u5f62\u83dc\u5355 RadialWheelActionMenu\uff08\u5bf9\u6807 21st.dev / watchOS 12k+ \u6536\u85cf \u00b7 \u83f2\u8328\u5b9a\u5f8b\u7b49\u89d2\u5c55\u5f00\uff09",
        fn: "lvxRadialWheelActionMenu({ items, radius, centerLabel })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            const wrap = document.createElement("div");
      wrap.style.cssText = "display:flex;justify-content:center;width:100%;padding:10px 0;";
      wrap.appendChild(
        K.lvxRadialWheelActionMenu({
          radius: 68,
          centerLabel: "⚙",
          items: [
            { id: "w1", label: "闪卡制卡", iconText: "🃏", tone: "brand", onClick: () => setLog("[环形轮盘] 触发闪卡制卡") },
            { id: "w2", label: "自律打卡", iconText: "🔥", tone: "energy", onClick: () => setLog("[环形轮盘] 触发自律打卡") },
            { id: "w3", label: "考前模考", iconText: "📝", tone: "success", onClick: () => setLog("[环形轮盘] 触发考前模考") },
            { id: "w4", label: "人脉速记", iconText: "👥", tone: "brand", onClick: () => setLog("[环形轮盘] 触发人脉速记") },
            { id: "w5", label: "穿透搜索", iconText: "🔍", tone: "energy", onClick: () => setLog("[环形轮盘] 触发穿透搜索") },
            { id: "w6", label: "灵感捕捉", iconText: "💡", tone: "danger", onClick: () => setLog("[环形轮盘] 触发灵感捕捉") },
          ],
        })
      );
      stage.appendChild(wrap);
        }
    },
    {
        id: 285,
        title: "285. AI Token \u9884\u7b97\u4e0e\u6d88\u8017\u8ba1\u91cf\u6761 AiTokenBudgetGauge\uff08\u5bf9\u6807 Origin UI / Vercel AI SDK 18.5k+ Stars \u00b7 \u4e0a\u4e0b\u6587\u5206\u6bb5\u8b66\u6212\uff09",
        fn: "lvxAiTokenBudgetGauge({ modelName, contextLimit, segments, onTrimContext })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxAiTokenBudgetGauge({
          modelName: "DeepSeek-V3 (32k Context)",
          contextLimit: 32768,
          segments: [
            { label: "系统提示词", tokens: 2500, colorVar: "var(--lvx-brand-soft)" },
            { label: "笔记正文块", tokens: 16800, colorVar: "var(--lvx-brand)" },
            { label: "多轮对话历史", tokens: 4200, colorVar: "var(--lvx-energy)" },
            { label: "预留生成预算", tokens: 4096, colorVar: "var(--lvx-neutral-bg-strong)" },
          ],
          onTrimContext: () => setLog("[Token预算] 触发一键剪裁旧历史会话"),
        })
      );
        }
    },
    {
        id: 286,
        title: "286. \u8bed\u97f3\u4ea4\u4e92\u5b9e\u65f6\u6ce2\u5f62\u632f\u5e45\u5361 AudioWaveVisualizerBar\uff08\u5bf9\u6807 React Bits / Magic UI 14.8k+ Stars \u00b7 20\u97f3\u67f1\u7269\u7406\u5f8b\u52a8\uff09",
        fn: "lvxAudioWaveVisualizerBar({ title, barCount, statusText, onTogglePlay })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxAudioWaveVisualizerBar({
          title: "🎙️ 拾遗长文 TTS 朗读中",
          barCount: 20,
          statusText: "朗读中",
          onTogglePlay: (playing) => setLog(`[语音波形] 播放状态: ${playing ? "播放中" : "已暂停"}`),
        })
      );
        }
    },
    {
        id: 287,
        title: "287. \u77e9\u9635\u91cf\u89c4\u81ea\u9002\u5e94\u8d4b\u5206\u5361 InteractiveRubricSheet\uff08\u5bf9\u6807 Canvas LMS / Origin UI 16.8k+ Stars \u00b7 \u591a\u7ef4\u4e3b\u89c2\u91cf\u89c4/\u52a0\u6743\u6298\u7b97\uff09",
        fn: "lvxInteractiveRubricSheet({ title, criteria, onScoreChange })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxInteractiveRubricSheet({
          title: "📋 论述大题与主观自测自适应量规赋分矩阵",
          criteria: [
            {
              id: "c1",
              dimension: "核心概念阐述深度",
              weight: 0.4,
              levels: [{ score: 4, label: "卓越" }, { score: 3, label: "熟练" }, { score: 2, label: "达标" }, { score: 1, label: "薄弱" }],
            },
            {
              id: "c2",
              dimension: "推导逻辑严密性",
              weight: 0.3,
              levels: [{ score: 4, label: "严谨" }, { score: 3, label: "清晰" }, { score: 2, label: "粗糙" }, { score: 1, label: "跳跃" }],
            },
            {
              id: "c3",
              dimension: "规范表达与排版",
              weight: 0.3,
              levels: [{ score: 4, label: "优异" }, { score: 3, label: "良好" }, { score: 2, label: "及格" }, { score: 1, label: "欠缺" }],
            },
          ],
          onScoreChange: (score) => setLog(`[量规赋分] 综合判定得分: ${score} 分`),
        })
      );
        }
    },
    {
        id: 288,
        title: "288. \u5fae\u578b\u7518\u7279\u65f6\u5e8f\u6392\u671f\u6761 TimelineGanttMiniStrip\uff08\u5bf9\u6807 Linear / GitHub Projects 14.8k+ Stars \u00b7 \u5355\u884c36px\u65f6\u5e8f/\u4eca\u65e5\u523b\u5ea6\u7ea2\u7ebf\uff09",
        fn: "lvxTimelineGanttMiniStrip({ title, totalDays, currentDay, milestones, onMilestoneClick })",
        render(stage: HTMLElement, setLog: (msg: string) => void) {
            stage.appendChild(
        K.lvxTimelineGanttMiniStrip({
          title: "📅 考前 30 天多轮知识冲刺排期条",
          totalDays: 30,
          currentDay: 14,
          milestones: [
            { id: "m1", title: "一轮核心考点梳理", startDay: 1, endDay: 10, colorTone: "brand" },
            { id: "m2", title: "历年真题变式刷题", startDay: 8, endDay: 22, colorTone: "energy" },
            { id: "m3", title: "全真模拟与冲刺对账", startDay: 20, endDay: 30, colorTone: "success" },
          ],
          onMilestoneClick: (m) => setLog(`[甘特时序] 查看里程碑阶段: ${m.title}`),
        })
      );
        }
    },
];

export function renderPluginStudio(
    pluginKey: "checkin" | "home" | "contacts" | "glean" | "cards" | "exam" | "common" | "switcher",
    host: HTMLElement,
    notify: (msg: string) => void = () => {},
    initialScope: "all" | "plugin" = "all"
): void {
    const ranges: Record<string, { label: string; range: [number, number] }> = {
        checkin: { label: "01 打卡 (1~36)", range: [1, 36] },
        home: { label: "02 管家 (37~72)", range: [37, 72] },
        contacts: { label: "03 人脉 (73~108)", range: [73, 108] },
        glean: { label: "04 拾遗 (109~144)", range: [109, 144] },
        cards: { label: "05 闪卡 (145~180)", range: [145, 180] },
        exam: { label: "06 考试 (181~216)", range: [181, 216] },
        common: { label: "07 常用 (217~252)", range: [217, 252] },
        switcher: { label: "08 雷切 (253~288)", range: [253, 288] },
    };

    host.innerHTML = "";
    host.style.cssText = "display:flex;flex-direction:column;gap:14px;box-sizing:border-box;width:100%;min-width:0;";

    const ctrlBar = document.createElement("div");
    ctrlBar.className = "lvx-studio-ctrlbar";
    ctrlBar.style.cssText = "display:flex;flex-direction:column;gap:10px;padding:14px;background:var(--lvx-surface);border:1px solid var(--lvx-border);border-radius:12px;box-shadow:0 1px 2px rgba(28,27,38,.03);box-sizing:border-box;";

    const topRow = document.createElement("div");
    topRow.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;";

    const titleGroup = document.createElement("div");
    titleGroup.style.cssText = "display:flex;align-items:center;gap:8px;";
    titleGroup.innerHTML = `<span style=\"font-size:15px;font-weight:700;color:var(--lvx-text);\">✨ DL2 前沿开源标杆组件库</span><span style=\"font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px;background:var(--lvx-brand-tint);color:var(--lvx-brand-strong);border:1px solid color-mix(in srgb, var(--lvx-brand) 28%, transparent);\">288 款全量实装</span>`;
    topRow.appendChild(titleGroup);

    const searchBox = document.createElement("div");
    searchBox.style.cssText = "display:flex;align-items:center;gap:6px;flex:1;max-width:400px;min-width:200px;position:relative;";
    const searchInp = document.createElement("input");
    searchInp.type = "text";
    searchInp.placeholder = "🔍 搜索 288 款组件编号 / 名称 / 函数...";
    searchInp.style.cssText = "width:100%;height:30px;padding:0 10px;border-radius:7px;border:1px solid var(--lvx-border);background:var(--lvx-surface-sunken);color:var(--lvx-text);font-size:12px;outline:none;box-sizing:border-box;";
    searchBox.appendChild(searchInp);
    topRow.appendChild(searchBox);

    const countBadge = document.createElement("div");
    countBadge.style.cssText = "font-size:11.5px;color:var(--lvx-text-muted);font-weight:500;white-space:nowrap;";
    topRow.appendChild(countBadge);
    ctrlBar.appendChild(topRow);

    const filterRow = document.createElement("div");
    filterRow.style.cssText = "display:flex;gap:6px;flex-wrap:wrap;align-items:center;";

    let activeFilter = initialScope === "all" ? "all" : "plugin";
    let searchQuery = "";

    const chips = [
        { id: "all", label: "全部 (1~288 全量)" },
        { id: "plugin", label: `当前插件推荐 (${ranges[pluginKey]?.label || "本仓"})` },
        { id: "checkin", label: "01 打卡 (1~36)" },
        { id: "home", label: "02 管家 (37~72)" },
        { id: "contacts", label: "03 人脉 (73~108)" },
        { id: "glean", label: "04 拾遗 (109~144)" },
        { id: "cards", label: "05 闪卡 (145~180)" },
        { id: "exam", label: "06 考试 (181~216)" },
        { id: "common", label: "07 常用 (217~252)" },
        { id: "switcher", label: "08 雷切 (253~288)" },
    ];

    const chipBtns: HTMLButtonElement[] = [];

    chips.forEach(c => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = c.label;
        btn.style.cssText = "padding:3px 10px;font-size:11.5px;border-radius:6px;cursor:pointer;border:1px solid transparent;transition:all .12s ease;font-weight:500;";
        btn.addEventListener("click", () => {
            activeFilter = c.id;
            updateFilterChips();
            refreshGrid();
        });
        filterRow.appendChild(btn);
        chipBtns.push(btn);
    });

    ctrlBar.appendChild(filterRow);
    host.appendChild(ctrlBar);

    const grid = document.createElement("div");
    grid.className = "lvx-studio-grid";
    grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill, minmax(360px, 1fr));gap:16px;box-sizing:border-box;width:100%;";
    host.appendChild(grid);

    function updateFilterChips() {
        chips.forEach((c, idx) => {
            const btn = chipBtns[idx];
            const isActive = c.id === activeFilter;
            if (isActive) {
                btn.style.background = "color-mix(in srgb, var(--lvx-brand) 13%, var(--lvx-surface))";
                btn.style.borderColor = "color-mix(in srgb, var(--lvx-brand) 28%, transparent)";
                btn.style.color = "var(--lvx-brand-strong)";
                btn.style.fontWeight = "600";
            } else {
                btn.style.background = "var(--lvx-surface-sunken)";
                btn.style.borderColor = "var(--lvx-border)";
                btn.style.color = "var(--lvx-text-muted)";
                btn.style.fontWeight = "500";
            }
        });
    }

    function refreshGrid() {
        grid.innerHTML = "";
        let list = DL2_SPECIMENS;

        if (activeFilter === "plugin") {
            const [s, e] = ranges[pluginKey]?.range || [1, 36];
            list = list.filter(item => item.id >= s && item.id <= e);
        } else if (activeFilter !== "all" && ranges[activeFilter]) {
            const [s, e] = ranges[activeFilter].range;
            list = list.filter(item => item.id >= s && item.id <= e);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(item =>
                String(item.id) === q ||
                String(item.id) === q.replace(/^#/, "") ||
                item.title.toLowerCase().includes(q) ||
                item.fn.toLowerCase().includes(q)
            );
        }

        countBadge.textContent = `显示 ${list.length} / 288 款组件`;

        if (list.length === 0) {
            grid.innerHTML = `<div style=\"grid-column:1/-1;padding:40px;text-align:center;color:var(--lvx-text-muted);font-size:13px;background:var(--lvx-surface);border-radius:12px;border:1px dashed var(--lvx-border);\">未找到与 \"${searchQuery}\" 匹配的前沿标杆组件</div>`;
            return;
        }

        for (const item of list) {
            const card = document.createElement("div");
            card.className = "lvx-specimen-card";
            card.style.cssText = "display:flex;flex-direction:column;border-radius:12px;background:var(--lvx-surface);border:1px solid var(--lvx-border);box-shadow:0 1px 2px rgba(28,27,38,.03);overflow:hidden;box-sizing:border-box;";

            const head = document.createElement("div");
            head.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 14px;background:var(--lvx-surface-sunken);border-bottom:1px solid var(--lvx-border);font-size:12px;font-weight:600;color:var(--lvx-text);";
            const displayTitle = item.title.replace(/^[0-9.]+\\s*/, "");
            const displayFn = item.fn.replace(/^lvx/, "");
            head.innerHTML = `<span style=\"overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:240px;\">#${item.id} · ${displayTitle}</span><code style=\"font-size:10.5px;color:var(--lvx-brand-strong);background:var(--lvx-brand-tint);padding:1px 6px;border-radius:4px;font-family:monospace;white-space:nowrap;\">${displayFn}</code>`;
            card.appendChild(head);

            const stage = document.createElement("div");
            stage.style.cssText = "padding:14px;display:flex;flex-direction:column;gap:10px;background:var(--lvx-surface);flex:1;justify-content:center;box-sizing:border-box;min-width:0;";
            card.appendChild(stage);

            try {
                item.render(stage, notify);
            } catch (e) {
                stage.innerHTML = `<span style=\"color:var(--lvx-danger);font-size:11px;\">渲染异常: ${e}</span>`;
            }

            grid.appendChild(card);
        }
    }

    searchInp.addEventListener("input", (e) => {
        searchQuery = (e.target as HTMLInputElement).value;
        refreshGrid();
    });

    updateFilterChips();
    refreshGrid();
}
