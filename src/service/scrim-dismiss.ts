// 弹窗遮罩全局点击监听与销毁清理（ScrimDismiss · S10）
import type {XiaolvCommonPluginContext} from "./plugin-context";

export function setupScrimDismiss(_plugin?: XiaolvCommonPluginContext): (() => void) | undefined {
    if (typeof window === "undefined" || typeof window.addEventListener !== "function") return undefined;
    const onCommonScrimClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement | null;
        if (target?.classList?.contains("b3-dialog__scrim")) {
            const dialogEl = target.closest(".b3-dialog");
            if (dialogEl?.querySelector('[class*="xlc-"], [id*="xlc-"]')) {
                const closeBtn = dialogEl.querySelector<HTMLElement>(".b3-dialog__close, [data-action='close'], .xlc-dialog-close");
                if (closeBtn) {
                    if (typeof closeBtn.click === "function") closeBtn.click();
                    else closeBtn.dispatchEvent(new MouseEvent("click", {bubbles: true}));
                }
            }
        }
    };
    window.addEventListener("click", onCommonScrimClick, true);
    return () => window.removeEventListener("click", onCommonScrimClick, true);
}
