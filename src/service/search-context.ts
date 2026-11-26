// 搜索上下文与偏好轻量助手（SearchContext · S10）
import type {SearchContext} from "../model/search";
import type {XiaolvCommonPluginContext} from "./plugin-context";

function shortTitle(title: string): string {
    return title.length > 48 ? `${title.slice(0, 48)}…` : title;
}

export function searchContext(plugin: XiaolvCommonPluginContext): SearchContext {
    const sort = plugin.state.sort;
    return {
        favorites: new Set(plugin.state.favorites),
        recents: new Map(plugin.state.recents.map((r) => [r.id, r.usedAt])),
        usage: new Map(Object.entries(plugin.state.usage).map(([id, u]) => [id, u?.count ?? 0])),
        manualOrder: sort === "manual" ? new Map(plugin.state.favorites.map((id, i) => [id, i])) : undefined,
        sort,
        now: Date.now(),
    };
}

export function receiptText(plugin: XiaolvCommonPluginContext, code: string, title: string, pending: string[] = []): string {
    const t = plugin.i18nFn();
    if (code === "no-editor-copied") return t("insertNoEditor");
    if (code === "target-unavailable-copied") return t("insertTargetUnavailableCopied");
    if (code === "no-editor-copy-failed" || code === "copy-failed") return t("copyFailed");
    if (code === "source-missing" || code === "doc-missing") return t("sourceGone");
    if (code === "insert-failed") return t("insertFailed");
    if (code === "copied") return t("copied", shortTitle(title));
    if (code === "inserted") return t("inserted", shortTitle(title));
    if (pending.includes("mobile-insert-unverified")) return t("insertPendingMobile");
    if (pending.includes("bitmap-clipboard-unverified")) return t("copiedRichPending");
    return "";
}

export function resetItemUsage(plugin: XiaolvCommonPluginContext, itemId: string): boolean {
    if (plugin.state.usage[itemId]) {
        delete plugin.state.usage[itemId];
        plugin.persistSoon();
        return true;
    }
    return false;
}

export function closeQuickAccessPopover(plugin: XiaolvCommonPluginContext): void {
    plugin.quickAccessPopoverDismiss?.();
    plugin.quickAccessPopoverDismiss = null;
    const existing = typeof document !== "undefined" ? document.querySelector(".xlc-quick-popover") : null;
    if (existing) existing.remove();
}
