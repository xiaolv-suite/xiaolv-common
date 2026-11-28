/**
 * 小驴全生态主题通道 · 标准核心套件 (Lv Ecosystem Theme Channel Kit)
 * DL2 Epoch · Protocol v1.0.0 (阶段 0：单例 MutationObserver 主题模式通道)
 *
 * 核心设计哲学：
 * 1. 单例观察者 + 订阅表：全生态共享一个 MutationObserver（observe body +
 *    documentElement 的 class/style/data-theme-mode），杜绝每插件一个 observer
 *    的性能增殖（DL2-PLAN §4.3 / 风险登记册「observer 增殖」条）；
 * 2. 多重信号投票检测（以小驴打卡 index.ts resolvedAppearance 为蓝本）：
 *    body.dark / body--dark → html[data-theme-mode] → html.dark →
 *    siyuan.config.appearance.mode → prefers-color-scheme，兼容官方与第三方主题；
 * 3. 通道输出：在插件根元素切换 data-lv-theme="light|dark"；深色适配只写
 *    [data-lv-theme="dark"] 选择器，与仓内既有 SCSS 派检测并存、渐进收敛；
 * 4. 零外部 npm 依赖：单个独立 .ts 文件，字节级复制到任何小驴插件内即可使用。
 */

/* ========================================================================= */
/* 1. 类型契约定义 (Type Contracts)                                          */
/* ========================================================================= */

export type LvThemeMode = "light" | "dark";

export const LV_THEME_ATTR = "data-lv-theme";

interface LvThemeSubscription {
    el?: any;
    callback?: (mode: LvThemeMode) => void;
}

/* ========================================================================= */
/* 2. 多重信号主题解析 (Multi-Signal Theme Resolution)                       */
/* ========================================================================= */

/** 解析当前思源宿主主题模式（实时信号优先，配置与系统偏好兜底） */
export function resolveSiYuanTheme(doc?: any, win?: any): LvThemeMode {
    try {
        const d = doc || (typeof document !== "undefined" ? document : undefined);
        const w = win || (typeof window !== "undefined" ? window : undefined);
        const body = d?.body;
        const html = d?.documentElement;
        if (body?.classList?.contains("dark") || body?.classList?.contains("body--dark") ||
            html?.dataset?.themeMode === "dark" || html?.classList?.contains("dark")) return "dark";
        if (body?.classList?.contains("light") || body?.classList?.contains("body--light") ||
            html?.dataset?.themeMode === "light" || html?.classList?.contains("light")) return "light";
        // 跟随思源配置（1=dark 0=light）
        const hostMode = (w as any)?.siyuan?.config?.appearance?.mode;
        if (hostMode === 1) return "dark";
        if (hostMode === 0) return "light";
        if (w && typeof w.matchMedia === "function" && w.matchMedia("(prefers-color-scheme: dark)").matches) {
            return "dark";
        }
    } catch {
        // ignore
    }
    return "light";
}

/* ========================================================================= */
/* 3. 单例观察者与订阅表 (Singleton Observer & Subscription Table)           */
/* ========================================================================= */

const subscriptions = new Set<LvThemeSubscription>();
let sharedObserver: MutationObserver | null = null;
let scheduleTimer: any = null;
let lastAppliedMode: LvThemeMode | null = null;

function setGlobalTimeout(fn: () => void, ms: number): any {
    try {
        if (typeof globalThis !== "undefined" && typeof (globalThis as any).setTimeout === "function") {
            return (globalThis as any).setTimeout(fn, ms);
        }
    } catch {
        // ignore
    }
    return null;
}

function clearGlobalTimeout(timer: any): void {
    try {
        if (timer !== null && typeof globalThis !== "undefined" && typeof (globalThis as any).clearTimeout === "function") {
            (globalThis as any).clearTimeout(timer);
        }
    } catch {
        // ignore
    }
}

function applyModeToSubscriptions(mode: LvThemeMode): void {
    for (const sub of subscriptions) {
        try {
            if (sub.el) sub.el.setAttribute(LV_THEME_ATTR, mode);
        } catch {
            // ignore（元素可能已随窗口销毁）
        }
        try {
            if (sub.callback) sub.callback(mode);
        } catch {
            // ignore（订阅方回调异常不拖垮其他订阅方）
        }
    }
}

function ensureThemeWatcher(): void {
    if (sharedObserver || typeof MutationObserver === "undefined" || typeof document === "undefined") return;
    let scheduled = false;
    const flush = () => {
        scheduled = false;
        scheduleTimer = null;
        const next = resolveSiYuanTheme();
        if (next === lastAppliedMode) return;
        lastAppliedMode = next;
        applyModeToSubscriptions(next);
    };
    sharedObserver = new MutationObserver(() => {
        if (scheduled) return;
        scheduled = true;
        scheduleTimer = setGlobalTimeout(flush, 50);
    });
    if (document.body) {
        sharedObserver.observe(document.body, { attributes: true, attributeFilter: ["class", "style"] });
    }
    if (document.documentElement) {
        sharedObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme-mode"] });
    }
    lastAppliedMode = resolveSiYuanTheme();
}

function stopThemeWatcherIfIdle(): void {
    if (subscriptions.size > 0) return;
    if (sharedObserver) {
        sharedObserver.disconnect();
        sharedObserver = null;
    }
    if (scheduleTimer !== null) {
        clearGlobalTimeout(scheduleTimer);
        scheduleTimer = null;
    }
    lastAppliedMode = null;
}

/* ========================================================================= */
/* 4. 公开订阅 API (Public Subscription API)                                 */
/* ========================================================================= */

/**
 * 订阅思源主题通道：立即把当前模式写入 el 的 data-lv-theme 属性，
 * 并在宿主主题切换时同步刷新（50ms 防抖）。可同时注册回调。
 * 返回取消订阅函数；最后一个订阅者退订后自动停掉单例观察者。
 */
export function watchSiYuanTheme(el?: any, callback?: (mode: LvThemeMode) => void): () => void {
    const mode = resolveSiYuanTheme();
    if (el) {
        try {
            el.setAttribute(LV_THEME_ATTR, mode);
        } catch {
            // ignore
        }
    }
    const sub: LvThemeSubscription = { el, callback };
    subscriptions.add(sub);
    ensureThemeWatcher();
    return () => {
        subscriptions.delete(sub);
        stopThemeWatcherIfIdle();
    };
}

/** 纯回调订阅（不挂 DOM 属性），适合只做逻辑响应的场景 */
export function onSiYuanThemeChange(callback: (mode: LvThemeMode) => void): () => void {
    return watchSiYuanTheme(undefined, callback);
}

/** 手动立即刷新一次（供插件在重渲染后主动对齐，正常情况下无需调用） */
export function refreshSiYuanTheme(): LvThemeMode {
    const mode = resolveSiYuanTheme();
    lastAppliedMode = mode;
    applyModeToSubscriptions(mode);
    return mode;
}

/* ========================================================================= */
/* 5. 全局挂载 (Window Mount，供罗盘 / Launchpad 免 import 复用)              */
/* ========================================================================= */

// 自动挂载至全局 window，供小驴全家桶任意插件与罗盘免 import 无缝复用
if (typeof window !== "undefined") {
    (window as any).LvTheme = {
        resolveSiYuanTheme,
        watchSiYuanTheme,
        onSiYuanThemeChange,
        refreshSiYuanTheme,
    };
}
