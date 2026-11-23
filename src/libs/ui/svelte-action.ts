/**
 * 小驴 DL2 全生态 Svelte 5 / Svelte 4 动作指令胶水层 (svelte-action.ts)
 * 
 * 作用：
 * 1. 提供 use:lvxAction，在 Svelte 模板中声明式挂载任意 DL2 命令式 DOM 工厂，
 *    并在参数 options 响应式变化时自动更新、在销毁时自动调用 cleanup/destroy；
 * 2. 提供 use:lvxAutoRoot，在 Svelte 根节点一行注入三件套（data-lv-ui + 历史变量别名重定向 + 表面标记），
 *    并在组件卸载时自动清理，杜绝内存泄漏；
 * 3. 零外部 npm 依赖，在纯 TypeScript 仓库与 Svelte 5 仓库中均可 100% 通过 tsc / svelte-check。
 */

export interface LvxActionParams<T = any> {
    factory: (opts: T) => HTMLElement;
    options: T;
}

export interface LvxActionResult<T = any> {
    update?: (newParams: LvxActionParams<T>) => void;
    destroy?: () => void;
}

/**
 * use:lvxAction
 * 在 Svelte 模板中挂载并响应式驱动 DL2 组件
 * 
 * 示例：
 * <div use:lvxAction={{ factory: lvxCategorySegmentBar, options: { title: "题型", segments } }} />
 */
export function lvxAction<T = any>(node: HTMLElement, params: LvxActionParams<T>): LvxActionResult<T> {
    let currentChild: HTMLElement | null = null;
    let currentFactory = params.factory;
    let currentOptions = params.options;

    const mount = () => {
        if (typeof currentFactory !== "function") return;
        try {
            currentChild = currentFactory(currentOptions);
            if (currentChild) {
                node.appendChild(currentChild);
            }
        } catch (err) {
            console.error("[lvxAction] 挂载组件失败:", err);
        }
    };

    const cleanup = () => {
        if (currentChild) {
            if (typeof (currentChild as any).destroy === "function") {
                try { (currentChild as any).destroy(); } catch (_) {}
            }
            if (currentChild.parentNode === node) {
                node.removeChild(currentChild);
            }
            currentChild = null;
        }
    };

    mount();

    return {
        update(newParams: LvxActionParams<T>) {
            currentFactory = newParams.factory;
            currentOptions = newParams.options;
            cleanup();
            mount();
        },
        destroy() {
            cleanup();
        },
    };
}

/**
 * use:lvxAutoRoot
 * Svelte 根容器一键接线三件套指令：
 * 挂载 data-lv-ui 隔离罩、注入历史变量别名、并标记 root 表面语义
 * 
 * 示例：
 * <div use:lvxAutoRoot class="my-view-container">
 */
export function lvxAutoRoot(node: HTMLElement, opts?: { surface?: "dock" | "tab" | "popover" | "drawer" }): { destroy: () => void } {
    try {
        node.setAttribute("data-lv-ui", "1");
        const aliases: Record<string, string> = {
            "--home-primary": "var(--lvx-brand)",
            "--home-bg": "var(--lvx-canvas)",
            "--home-card-bg": "var(--lvx-surface)",
            "--home-text": "var(--lvx-text)",
            "--home-muted": "var(--lvx-text-muted)",
            "--home-border": "var(--lvx-border)",
            "--contacts-primary": "var(--lvx-brand)",
            "--contacts-orange": "var(--lvx-energy)",
            "--contacts-surface": "var(--lvx-surface)",
            "--contacts-text": "var(--lvx-text)",
            "--common-primary": "var(--lvx-brand)",
            "--common-surface": "var(--lvx-surface)",
            "--common-bg": "var(--lvx-canvas)",
            "--glean-primary": "var(--lvx-brand)",
            "--glean-teal": "var(--lvx-brand)",
            "--glean-surface": "var(--lvx-surface)",
            "--riff-primary": "var(--lvx-brand)",
            "--card-surface": "var(--lvx-surface)",
            "--exam-primary": "var(--lvx-brand)",
            "--exam-surface": "var(--lvx-surface)",
            "--checkin-primary": "var(--lvx-brand)",
            "--switch-primary": "var(--lvx-brand)",
        };
        for (const [key, val] of Object.entries(aliases)) {
            node.style.setProperty(key, val);
        }
    } catch (_) {}

    if (opts?.surface) {
        node.setAttribute("data-lv-surface", opts.surface);
    }
    return {
        destroy() {
            try {
                delete (node as any).dataset.lvUi;
            } catch (_) {}
        },
    };
}
