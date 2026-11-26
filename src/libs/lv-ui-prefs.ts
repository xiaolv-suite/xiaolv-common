/**
 * 小驴全生态 UI 外观与动效偏好 · 标准核心套件 (Lv Ecosystem UI Prefs Kit)
 * DL2 Epoch · Protocol v1.0.0 (阶段 0：全生态统一外观偏好键)
 *
 * 核心设计哲学：
 * 1. 生态键唯一写入方：只有「外观与动效」设置 UI 通过 saveLvUiPrefs 写入，
 *    各插件仓内存储不重复落盘，避免双写漂移（DL2-PLAN §4.2）；
 * 2. 三档总闸 + 三细分开关：full / minimal / off 总闸封顶，庆祝 / 吉祥物 / 光效
 *    细分开关只在 full 档生效，避免组合语义混乱；
 * 3. 动效域白名单：庆祝 / 装饰光效 / 吉祥物动画 = 可关；
 *    加载指示 / 进度 / 危险警示动效 = 永不关（CSS 门控选择器严禁覆盖这些域）；
 * 4. 系统 prefers-reduced-motion 强制收敛：系统要求减弱动效时，实际档位最高
 *    只到 minimal（不高于用户选择），杜绝特效晃眼；
 * 5. 零外部 npm 依赖：单个独立 .ts 文件，字节级复制到任何小驴插件内即可使用
 *    （仿 lv-ai-router 分发模式，由 pnpm suite:sync-kit 投射）。
 */

/* ========================================================================= */
/* 1. 类型契约定义 (Type Contracts)                                          */
/* ========================================================================= */

/** 动效总档位：full=完整动效 / minimal=仅保留基础过渡与功能动效 / off=全部装饰动效关闭 */
export type LvMotionLevel = "full" | "minimal" | "off";

export interface LvUiPrefs {
    /** 偏好结构版本号，向后兼容锚点（字段全部可缺省，读取时自动补齐） */
    prefsVersion: 1;
    /** 动效总闸 */
    effectLevel: LvMotionLevel;
    /** 庆祝效果：纸屑 / 庆祝卡 / 满分撒花 */
    celebration: boolean;
    /** 吉祥物「小驴」插画（关闭 → 回退中性线性图标；其自身动画另受总闸约束） */
    mascot: boolean;
    /** 装饰光效：扫光 / 脉冲 / 辉光 / 微光 */
    glowEffects: boolean;
}

/** 实际生效的动效决议（合并系统偏好后，供 CSS 属性与 JS 门控消费） */
export interface LvEffectiveMotion {
    /** 写入 data-lv-motion 的实际档位 */
    motion: LvMotionLevel;
    /** 是否允许播放庆祝动效（JS 侧 spawn 前必须检查） */
    celebration: boolean;
    /** 是否允许渲染吉祥物（关闭时回退线性图标） */
    mascot: boolean;
    /** 是否允许装饰光效 */
    glowEffects: boolean;
    /** 系统是否要求减弱动效（prefers-reduced-motion: reduce） */
    reducedMotion: boolean;
}

/* ========================================================================= */
/* 2. 存储与广播 (Storage & Broadcast)                                       */
/* ========================================================================= */

export const LV_UI_PREFS_STORAGE_KEY = "lv_ui_prefs_v1";
export const LV_UI_PREFS_EVENT = "lv-ui-prefs-updated";

/** 全生态默认偏好：完整动效（存量用户零感知，升级不改变现状） */
export const DEFAULT_LV_UI_PREFS: LvUiPrefs = {
    prefsVersion: 1,
    effectLevel: "full",
    celebration: true,
    mascot: true,
    glowEffects: true,
};

let inMemoryPrefsCache: LvUiPrefs | null = null;

function getSafeStorage(): any {
    try {
        if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
        if (typeof localStorage !== "undefined") return localStorage;
    } catch {
        // ignore
    }
    return null;
}

/** 把任意来源（旧版本 / 手改 / 未来扩展字段）的原始数据收敛为合法 LvUiPrefs */
export function normalizeLvUiPrefs(raw: unknown): LvUiPrefs {
    const prefs: LvUiPrefs = { ...DEFAULT_LV_UI_PREFS };
    if (!raw || typeof raw !== "object") return prefs;
    const obj = raw as Record<string, unknown>;
    if (obj.effectLevel === "full" || obj.effectLevel === "minimal" || obj.effectLevel === "off") {
        prefs.effectLevel = obj.effectLevel;
    }
    for (const key of ["celebration", "mascot", "glowEffects"] as const) {
        if (typeof obj[key] === "boolean") prefs[key] = obj[key];
    }
    return prefs;
}

/** 从 localStorage 读取全生态统一外观偏好（无配置 / 解析失败时返回默认全开） */
export function loadLvUiPrefs(): LvUiPrefs {
    try {
        const storage = getSafeStorage();
        if (storage) {
            const raw = storage.getItem(LV_UI_PREFS_STORAGE_KEY);
            if (raw) {
                const parsed = normalizeLvUiPrefs(JSON.parse(raw));
                inMemoryPrefsCache = parsed;
                return parsed;
            }
        }
    } catch {
        // ignore
    }
    return inMemoryPrefsCache ? { ...inMemoryPrefsCache } : { ...DEFAULT_LV_UI_PREFS };
}

/** 保存全生态统一外观偏好到 localStorage，并向当前窗口广播变更事件 */
export function saveLvUiPrefs(prefs: LvUiPrefs): void {
    const normalized = normalizeLvUiPrefs(prefs);
    inMemoryPrefsCache = normalized;
    try {
        const storage = getSafeStorage();
        if (storage) {
            storage.setItem(LV_UI_PREFS_STORAGE_KEY, JSON.stringify(normalized));
        }
        if (typeof window !== "undefined" && typeof window.dispatchEvent === "function" && typeof CustomEvent === "function") {
            window.dispatchEvent(new CustomEvent(LV_UI_PREFS_EVENT, { detail: normalized }));
        }
    } catch {
        // ignore
    }
}

/**
 * 订阅偏好变更（当前窗口广播 + 跨标签页 storage 事件）。
 * 返回取消订阅函数；宿主环境不支持事件时安全退化为空订阅。
 */
export function subscribeLvUiPrefs(listener: (prefs: LvUiPrefs) => void): () => void {
    const win = typeof window !== "undefined" ? window : undefined;
    if (!win || typeof win.addEventListener !== "function") return () => { /* noop */ };
    const onPrefsEvent = (ev: Event) => {
        try {
            listener(normalizeLvUiPrefs((ev as CustomEvent).detail));
        } catch {
            listener(loadLvUiPrefs());
        }
    };
    const onStorageEvent = (ev: StorageEvent) => {
        if (ev.key !== LV_UI_PREFS_STORAGE_KEY) return;
        try {
            listener(normalizeLvUiPrefs(ev.newValue ? JSON.parse(ev.newValue) : undefined));
        } catch {
            listener(loadLvUiPrefs());
        }
    };
    win.addEventListener(LV_UI_PREFS_EVENT, onPrefsEvent as EventListener);
    win.addEventListener("storage", onStorageEvent);
    return () => {
        try {
            win.removeEventListener(LV_UI_PREFS_EVENT, onPrefsEvent as EventListener);
            win.removeEventListener("storage", onStorageEvent);
        } catch {
            // ignore
        }
    };
}

/* ========================================================================= */
/* 3. 生效决议 (Effective Motion Resolution)                                 */
/* ========================================================================= */

function prefersReducedMotion(win?: any): boolean {
    try {
        const w = win || (typeof window !== "undefined" ? window : undefined);
        if (w && typeof w.matchMedia === "function") {
            return !!w.matchMedia("(prefers-reduced-motion: reduce)").matches;
        }
    } catch {
        // ignore
    }
    return false;
}

/**
 * 决议实际生效的动效档位与各域开关。
 *
 * 规则（DL2-PLAN §4.2）：
 * - off 总闸：全部装饰域关闭；
 * - minimal 总闸：庆祝与光效关闭，吉祥物保留静态形象（其动画由 motion=minimal 档约束）；
 * - full 总闸：三个细分开关各自生效；
 * - 系统 prefers-reduced-motion：实际档位强制不超过 minimal（用户已选 off 则保持 off），
 *   庆祝与光效强制关闭。
 */
export function resolveEffectiveMotion(prefs?: LvUiPrefs, win?: any): LvEffectiveMotion {
    const user = normalizeLvUiPrefs(prefs || loadLvUiPrefs());
    const reduced = prefersReducedMotion(win);
    if (user.effectLevel === "off") {
        return { motion: "off", celebration: false, mascot: false, glowEffects: false, reducedMotion: reduced };
    }
    if (user.effectLevel === "minimal") {
        return { motion: "minimal", celebration: false, mascot: user.mascot, glowEffects: false, reducedMotion: reduced };
    }
    if (reduced) {
        return { motion: "minimal", celebration: false, mascot: user.mascot, glowEffects: false, reducedMotion: true };
    }
    return {
        motion: "full",
        celebration: user.celebration,
        mascot: user.mascot,
        glowEffects: user.glowEffects,
        reducedMotion: false,
    };
}

/* ========================================================================= */
/* 4. DOM 属性应用 (DOM Attribute Application)                               */
/* ========================================================================= */

export const LV_MOTION_ATTR = "data-lv-motion";
export const LV_CELEBRATION_ATTR = "data-lv-celebration";
export const LV_MASCOT_ATTR = "data-lv-mascot";
export const LV_GLOW_ATTR = "data-lv-glow";

/**
 * 将生效决议写入根元素的 data-* 属性，供 CSS 门控选择器消费：
 * - data-lv-motion="full|minimal|off"：动效总档位；
 * - data-lv-celebration="on|off"：庆祝动效（纸屑/撒花）；
 * - data-lv-mascot="on|off"：吉祥物显隐；
 * - data-lv-glow="on|off"：装饰光效。
 *
 * rootEl 缺省写入 document.documentElement（全局兜底，body 挂载的纸屑也能被门控命中）；
 * 插件根（Dialog/Dock 容器）可显式传入实现作用域隔离。属性缺省 = full 行为，存量零感知。
 */
export function applyLvUiPrefs(rootEl?: any, prefs?: LvUiPrefs): LvEffectiveMotion {
    const effective = resolveEffectiveMotion(prefs);
    const targets: any[] = [];
    if (rootEl) targets.push(rootEl);
    if (typeof document !== "undefined" && document.documentElement) targets.push(document.documentElement);
    for (const el of targets) {
        try {
            el.setAttribute(LV_MOTION_ATTR, effective.motion);
            el.setAttribute(LV_CELEBRATION_ATTR, effective.celebration ? "on" : "off");
            el.setAttribute(LV_MASCOT_ATTR, effective.mascot ? "on" : "off");
            el.setAttribute(LV_GLOW_ATTR, effective.glowEffects ? "on" : "off");
        } catch {
            // ignore
        }
    }
    return effective;
}

/* ========================================================================= */
/* 5. 自动应用助手 (Auto-Apply，插件根一行接入)                               */
/* ========================================================================= */

/**
 * 插件根元素一行接入：立即应用一次偏好属性，并订阅生态键广播与系统
 * reduced-motion 变化持续重应用。返回清理函数（插件卸载时调用）。
 */
export function installLvUiPrefsAutoApply(rootEl?: any): () => void {
    const apply = () => {
        try {
            applyLvUiPrefs(rootEl);
        } catch {
            // ignore
        }
    };
    apply();
    const unsubPrefs = subscribeLvUiPrefs(() => apply());
    let unsubMedia: () => void = () => { /* noop */ };
    try {
        const w = typeof window !== "undefined" ? window : undefined;
        if (w && typeof w.matchMedia === "function") {
            const mql = w.matchMedia("(prefers-reduced-motion: reduce)");
            const mediaHandler = () => apply();
            if (typeof mql.addEventListener === "function") {
                mql.addEventListener("change", mediaHandler);
                unsubMedia = () => mql.removeEventListener("change", mediaHandler);
            } else if (typeof (mql as any).addListener === "function") {
                (mql as any).addListener(mediaHandler);
                unsubMedia = () => (mql as any).removeListener(mediaHandler);
            }
        }
    } catch {
        // ignore
    }
    return () => {
        unsubPrefs();
        unsubMedia();
    };
}

/* ========================================================================= */
/* 6. 「外观与动效」设置分组工厂 (Settings Section Factory)                   */
/*    零依赖 DOM 工厂 + 内联 scoped 样式；各仓设置页一行挂载即可接入。        */
/* ========================================================================= */

export interface LvUiPrefsSectionLabels {
    /** 动效总档行标签，缺省「动效总档」 */
    level?: string;
    /** 三档按钮文案，缺省「完整/精简/关闭」 */
    levels?: Partial<Record<LvMotionLevel, string>>;
    /** 三开关文案与副文案，键同 LvUiPrefs 字段 */
    switches?: Partial<Record<"celebration" | "mascot" | "glowEffects", { text: string; sub?: string }>>;
}

export interface LvUiPrefsSectionOptions {
    /** 挂载作用域：仅 "ecosystem"（小驴罗盘统一设置）渲染完整卡；缺省或 "plugin" 返回空隐藏占位 */
    scope?: "ecosystem" | "plugin";
    /** 分组标题，缺省「动态与庆祝效果」 */
    title?: string;
    /** 分组说明文案，缺省为生态生效范围说明 */
    hint?: string;
    /** 可选文案覆盖（双语仓可传自有 i18n 文案，缺省中文） */
    labels?: LvUiPrefsSectionLabels;
}

const LV_UI_PREFS_STYLE_ID = "lv-uipref-styles";

const LV_UI_PREFS_CSS = `
.lv-uipref{font-size:13px;line-height:1.5;color:inherit;max-width:560px;width:100%;box-sizing:border-box}
.lv-uipref__title{font-size:14px;font-weight:600;margin:0 0 4px;display:flex;align-items:center;gap:6px}
.lv-uipref__hint{font-size:12px;opacity:.64;margin:0 0 10px;line-height:1.5}
.lv-uipref__card{border:1px solid var(--lvx-border,rgba(52,55,86,.13));border-radius:16px;padding:14px 16px;display:flex;flex-direction:column;gap:12px;background:var(--lvx-surface,color-mix(in srgb,currentColor 4%,transparent));box-shadow:var(--lvx-inner-sheen,inset 0 1px 0 rgba(255,255,255,.65)),var(--lvx-shadow-1,0 1px 3px rgba(28,27,38,.06));box-sizing:border-box;width:100%}
.lv-uipref__row{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px 12px;min-height:36px}
.lv-uipref__row-label{flex:1 1 140px;min-width:0;font-weight:500}
.lv-uipref__row-sub{font-size:11px;opacity:.62;display:block;font-weight:400;margin-top:2px}
.lv-uipref__seg{display:inline-flex;flex-shrink:0;background:var(--lvx-surface-sunken,color-mix(in srgb,currentColor 8%,transparent));border:1px solid var(--lvx-border,rgba(52,55,86,.13));box-shadow:var(--lvx-inner-recess,inset 0 1px 2px rgba(28,27,38,.08));border-radius:999px;padding:3px;gap:3px;max-width:100%}
.lv-uipref__seg-btn{border:none;background:transparent;color:inherit;font:inherit;font-size:12px;font-weight:500;padding:4px 14px;border-radius:999px;cursor:pointer;transition:background .15s ease,color .15s ease,box-shadow .15s ease}
.lv-uipref__seg-btn:hover:not([aria-pressed="true"]){background:var(--lvx-neutral-bg,rgba(52,55,86,.08))}
.lv-uipref__seg-btn[aria-pressed="true"]{background:linear-gradient(180deg,#787CEB 0%,var(--lvx-brand,#6A6EE0) 100%);color:#fff;font-weight:600;box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 2px 6px rgba(106,110,224,.30)}
.lv-uipref__seg-btn:focus-visible{outline:2px solid var(--lvx-brand,#6A6EE0);outline-offset:1px}
.lv-uipref__switch{position:relative;width:38px;height:22px;flex-shrink:0}
.lv-uipref__switch input{position:absolute;opacity:0;inset:0;margin:0;cursor:pointer;z-index:1}
.lv-uipref__track{position:absolute;inset:0;border-radius:999px;background:var(--lvx-neutral-bg-strong,rgba(52,55,86,.14));border:1px solid var(--lvx-neutral-border,rgba(52,55,86,.15));box-shadow:var(--lvx-inner-recess,inset 0 1px 2px rgba(28,27,38,.08));transition:background .15s ease,border-color .15s ease;pointer-events:none}
.lv-uipref__knob{position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.22),0 1px 1px rgba(0,0,0,.12);transition:transform .15s ease;pointer-events:none}
.lv-uipref__switch input:checked~.lv-uipref__track{background:var(--lvx-brand,#6A6EE0);border-color:transparent}
.lv-uipref__switch input:checked~.lv-uipref__knob{transform:translateX(16px)}
.lv-uipref__switch input:focus-visible~.lv-uipref__track{outline:2px solid var(--lvx-brand,#6A6EE0);outline-offset:2px}
.lv-uipref__switch.is-disabled{opacity:.45}
.lv-uipref__switch.is-disabled input{cursor:not-allowed}
`;

/** 宿主是否处于深色主题（多重信号 mini 检测；kit 文件间禁止 import，故独立实现） */
function detectHostDarkMode(): boolean {
    try {
        const doc = typeof document !== "undefined" ? document : undefined;
        const body = doc?.body;
        const html = doc?.documentElement;
        if (body?.classList?.contains("dark") || body?.classList?.contains("body--dark") ||
            html?.dataset?.themeMode === "dark" || html?.classList?.contains("dark")) return true;
        if (html?.dataset?.themeMode === "light") return false;
        const w = typeof window !== "undefined" ? window : undefined;
        const hostMode = (w as any)?.siyuan?.config?.appearance?.mode;
        if (hostMode === 1) return true;
        if (hostMode === 0) return false;
    } catch {
        // ignore
    }
    return false;
}

function ensureLvUiPrefsStyles(): void {
    try {
        if (typeof document === "undefined") return;
        if (document.getElementById(LV_UI_PREFS_STYLE_ID)) return;
        const style = document.createElement("style");
        style.id = LV_UI_PREFS_STYLE_ID;
        style.textContent = LV_UI_PREFS_CSS;
        (document.head || document.documentElement).appendChild(style);
    } catch {
        // ignore
    }
}

/** 生成设置行：label(主+副文案) + 开关；返回元素、受控 input 与开关外壳 */
function buildSwitchRow(labelText: string, subText: string): { row: HTMLElement; input: HTMLInputElement; wrap: HTMLElement } {
    const row = document.createElement("div");
    row.className = "lv-uipref__row";
    const label = document.createElement("label");
    label.className = "lv-uipref__row-label";
    const main = document.createElement("span");
    main.textContent = labelText;
    label.appendChild(main);
    if (subText) {
        const sub = document.createElement("span");
        sub.className = "lv-uipref__row-sub";
        sub.textContent = subText;
        label.appendChild(sub);
    }
    const wrap = document.createElement("span");
    wrap.className = "lv-uipref__switch";
    const input = document.createElement("input") as HTMLInputElement;
    input.type = "checkbox";
    const track = document.createElement("span");
    track.className = "lv-uipref__track";
    const knob = document.createElement("span");
    knob.className = "lv-uipref__knob";
    wrap.appendChild(input);
    wrap.appendChild(track);
    wrap.appendChild(knob);
    row.appendChild(label);
    row.appendChild(wrap);
    return { row, input, wrap };
}

/**
 * 创建「外观与动效」设置分组（DL2-PLAN §4.2 设置入口）。
 * 自包含样式与逻辑：改档/改开关即写生态键并广播，同时即时刷新全局
 * data-lv-motion 属性（庆祝关闭立即生效）。宿主深浅主题自适应（currentColor 系）。
 */
export function createLvUiPrefsSection(options: LvUiPrefsSectionOptions = {}): HTMLElement {
    ensureLvUiPrefsStyles();
    const opts = options || {};
    const section = document.createElement("section");
    section.className = "lv-uipref";
    section.setAttribute("data-lv-uipref", "1");

    // Ruling 1 (msg#4009): 仅小驴罗盘「生态设置」(scope === "ecosystem") 渲染唯一设置卡；
    // 单插件设置页/默认调用自动收敛为不可见空占位（display:none 且不占用空间，向下兼容零报错）
    if (opts.scope !== "ecosystem") {
        section.className = "lv-uipref lv-uipref--hidden";
        section.setAttribute("data-lv-uipref-scope", opts.scope || "plugin");
        section.setAttribute("hidden", "true");
        section.setAttribute("aria-hidden", "true");
        if (section.style) {
            section.style.display = "none";
            section.style.margin = "0";
            section.style.padding = "0";
            section.style.height = "0";
            section.style.overflow = "hidden";
        }
        const noop = () => { /* noop */ };
        (section as any).destroy = noop;
        (section as any).__lvDestroy = noop;
        return section;
    }

    section.setAttribute("data-lv-uipref-scope", "ecosystem");
    const title = document.createElement("h4");
    title.className = "lv-uipref__title";
    title.textContent = opts.title || "动态与庆祝效果";
    section.appendChild(title);

    const hint = document.createElement("p");
    hint.className = "lv-uipref__hint";
    hint.textContent = opts.hint ||
        "动态效果与庆祝撒花统一由小驴罗盘管理，对本机全部小驴插件生效；系统开启「减弱动态效果」时自动收敛至精简档。加载与进度类动效不受影响。";
    section.appendChild(hint);

    const card = document.createElement("div");
    card.className = "lv-uipref__card";
    section.appendChild(card);

    // 总闸三档 segmented
    const segRow = document.createElement("div");
    segRow.className = "lv-uipref__row";
    const segLabelText = opts.labels?.level || "动效总档";
    const segLabel = document.createElement("span");
    segLabel.className = "lv-uipref__row-label";
    segLabel.textContent = segLabelText;
    const seg = document.createElement("span");
    seg.className = "lv-uipref__seg";
    seg.setAttribute("role", "group");
    seg.setAttribute("aria-label", segLabelText);
    const segButtons: Array<{ btn: HTMLButtonElement; level: LvMotionLevel }> = [];
    const levelTextOf = (level: LvMotionLevel) =>
        (opts.labels?.levels && opts.labels.levels[level]) || ({ full: "完整", minimal: "精简", off: "关闭" } as Record<LvMotionLevel, string>)[level];
    for (const level of ["full", "minimal", "off"] as LvMotionLevel[]) {
        const btn = document.createElement("button") as HTMLButtonElement;
        btn.type = "button";
        btn.textContent = levelTextOf(level);
        btn.className = "lv-uipref__seg-btn";
        btn.addEventListener("click", () => {
            saveLvUiPrefs({ ...loadLvUiPrefs(), effectLevel: level });
        });
        seg.appendChild(btn);
        segButtons.push({ btn, level });
    }
    seg.addEventListener("keydown", (e: KeyboardEvent) => {
        const curIdx = segButtons.findIndex(b => b.btn.getAttribute("aria-pressed") === "true");
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            const nextIdx = (curIdx + 1) % segButtons.length;
            const next = segButtons[nextIdx];
            if (next) {
                saveLvUiPrefs({ ...loadLvUiPrefs(), effectLevel: next.level });
                next.btn.focus();
            }
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            const prevIdx = (curIdx - 1 + segButtons.length) % segButtons.length;
            const prev = segButtons[prevIdx];
            if (prev) {
                saveLvUiPrefs({ ...loadLvUiPrefs(), effectLevel: prev.level });
                prev.btn.focus();
            }
        }
    });
    segRow.appendChild(segLabel);
    segRow.appendChild(seg);
    card.appendChild(segRow);

    // 仅保留真实生效的「庆祝效果」开关（移除尚未铺开的吉祥物与装饰光效半成品开关）
    const celeText = (opts.labels?.switches && opts.labels.switches.celebration?.text) || "庆祝效果";
    const celeSub = (opts.labels?.switches && opts.labels.switches.celebration?.sub) || "纸屑、成就卡、满分撒花特效";
    const { row: celeRow, input: celeInput, wrap: celeWrap } = buildSwitchRow(celeText, celeSub);
    celeInput.setAttribute("aria-label", celeText);
    celeInput.addEventListener("change", () => {
        saveLvUiPrefs({ ...loadLvUiPrefs(), celebration: celeInput.checked });
    });
    card.appendChild(celeRow);
    const switches: Array<{ key: "celebration"; input: HTMLInputElement; wrap: any }> = [
        { key: "celebration", input: celeInput, wrap: celeWrap },
    ];

    // 渲染同步：读偏好 → 刷新控件状态 + 全局属性
    const refresh = () => {
        const prefs = loadLvUiPrefs();
        applyLvUiPrefs();
        for (const { btn, level } of segButtons) {
            btn.setAttribute("aria-pressed", prefs.effectLevel === level ? "true" : "false");
        }
        for (const sw of switches) {
            sw.input.checked = prefs[sw.key];
            // 庆祝开关仅在 full 档可调（minimal/off 档被总闸强制收敛）
            const disabled = prefs.effectLevel !== "full";
            sw.input.disabled = disabled;
            if (sw.wrap && typeof sw.wrap.classList !== "undefined") {
                if (disabled) sw.wrap.classList.add("is-disabled");
                else sw.wrap.classList.remove("is-disabled");
            }
        }
        section.setAttribute("data-lv-theme", detectHostDarkMode() ? "dark" : "light");
    };
    refresh();
    const unsubPrefs = subscribeLvUiPrefs(() => refresh());
    let unsubMedia: () => void = () => { /* noop */ };
    try {
        const w = typeof window !== "undefined" ? window : undefined;
        if (w && typeof w.matchMedia === "function") {
            const mql = w.matchMedia("(prefers-reduced-motion: reduce)");
            const handler = () => refresh();
            if (typeof mql.addEventListener === "function") {
                mql.addEventListener("change", handler);
                unsubMedia = () => mql.removeEventListener("change", handler);
            } else if (typeof (mql as any).addListener === "function") {
                (mql as any).addListener(handler);
                unsubMedia = () => (mql as any).removeListener(handler);
            }
        }
    } catch {
        // ignore
    }
    const destroy = () => {
        unsubPrefs();
        unsubMedia();
    };
    (section as any).destroy = destroy;
    (section as any).__lvDestroy = destroy;
    return section;
}

/** 便捷挂载：把分组追加进宿主设置容器并返回分组元素 */
export function mountLvUiPrefsSection(container: any, options?: LvUiPrefsSectionOptions): HTMLElement {
    const section = createLvUiPrefsSection(options);
    try {
        container.appendChild(section);
    } catch {
        // ignore
    }
    return section;
}

/* ========================================================================= */
/* 7. 生态自举 (Self-Bootstrap，任一插件导入即全局接管)                       */
/* ========================================================================= */

// DL2 阶段0：套件被任一小驴插件导入时，立即把生效偏好写入 document 根。
// data-lv-* 属性是全文档级的（插件 UI 与 body 挂载的庆祝特效都会命中），
// 因此插件仓无需任何挂载点接线；多插件各加载一份拷贝属幂等写，无副作用。
if (typeof document !== "undefined") {
    try {
        applyLvUiPrefs();
        subscribeLvUiPrefs(() => {
            try {
                applyLvUiPrefs();
            } catch {
                // ignore
            }
        });
    } catch {
        // ignore
    }
}

/* ========================================================================= */
/* 8. 全局挂载 (Window Mount，供罗盘 / Launchpad 免 import 复用)              */
/* ========================================================================= */

// 自动挂载至全局 window，供小驴全家桶任意插件与罗盘设置抽屉无缝复用
if (typeof window !== "undefined") {
    (window as any).LvUiPrefs = {
        loadLvUiPrefs,
        saveLvUiPrefs,
        normalizeLvUiPrefs,
        resolveEffectiveMotion,
        applyLvUiPrefs,
        subscribeLvUiPrefs,
        installLvUiPrefsAutoApply,
        createLvUiPrefsSection,
        mountLvUiPrefsSection,
    };
}
