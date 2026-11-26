// 内核鉴权故障与健康预检服务（KernelHealth · S10）
import {parseExistingMap} from "../kernel/client";
import {isBlockId} from "../model/item";
import type {SearchEntry} from "../model/search";
import type {XiaolvCommonPluginContext} from "./plugin-context";

export function handleKernelAccessFailure(plugin: XiaolvCommonPluginContext, kind: "auth" | "permission"): void {
    plugin.library?.invalidateIndex();
    plugin.previewCacheService.clear();
    plugin.missingSources.clear();
    plugin.lastHealthPrefetch = 0;
    const msg = plugin.i18nFn()(kind === "auth" ? "kernelAuthRequired" : "kernelPermissionDenied");
    plugin.searchDialog?.showKernelAccessIssue(kind, msg);
    const now = Date.now();
    if (now - plugin.accessFailureNoticeAt[kind] > 10_000) {
        plugin.accessFailureNoticeAt[kind] = now;
        plugin.notify("error", msg);
    }
}

export async function prefetchSourceHealth(plugin: XiaolvCommonPluginContext, entries: SearchEntry[]): Promise<void> {
    const now = Date.now();
    if (now - plugin.lastHealthPrefetch < 5_000) return;
    plugin.lastHealthPrefetch = now;
    const ids = new Set<string>();
    for (const e of entries.slice(0, 100)) {
        if (e.sourceBlockId && isBlockId(e.sourceBlockId)) ids.add(e.sourceBlockId);
        if (e.sourceDocId && isBlockId(e.sourceDocId)) ids.add(e.sourceDocId);
    }
    if (ids.size === 0) return;
    try {
        const map = parseExistingMap(await plugin.kernelClient.request("checkBlocksExist", {ids: Array.from(ids)}));
        plugin.missingSources = new Set(Object.entries(map).filter(([, ok]) => !ok).map(([id]) => id));
        plugin.notifyExternalDataChange();
    } catch {}
}
