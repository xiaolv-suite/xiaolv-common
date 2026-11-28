import {getActivePasteQueue} from "../model/paste-queue";
import type {HostBridge} from "./commands";
import {withDocLock} from "../libs/lv-notice-kit";

/** Shared by the protocol and shortcut, including failure and concurrency semantics. */
export async function outputNextPasteQueueItem(host: HostBridge) {
    return getActivePasteQueue().consume(async (item) => {
        if (!host.hasActiveEditor() || host.isMobile()) return await host.writeClipboard(item.content) === true;
        const target = host.captureInsertTarget();
        if (!target?.docId) return false;
        try {
            return await withDocLock(target.docId, async () => {
                if (!host.canInsertAtTarget(target)) return false;
                return await host.insertMarkdown(item.content, target);
            // The queue must stay busy until the actual insertion settles;
            // ending only the caller's wait would permit an unknown replay.
            }, 0) === true;
        } finally {
            host.releaseInsertTarget(target);
        }
    });
}
