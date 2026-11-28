// 全生态基础设施套件注册（EcosystemSetup · S10）
import {lvNotify, lvBackup, lvSnapshotVault, lvLaunchpad, lvOmnisearch, lvTicker} from "../libs/lv-notice-kit";
import {createXiaolvCommonVaultAdapter} from "./vault-adapter";
import type {XiaolvCommonPluginContext} from "./plugin-context";

export function setupEcosystemIntegrations(plugin: XiaolvCommonPluginContext): void {
    try {
        plugin.noticeHubCleaner = lvNotify.registerPlugin("xiaolv-common");
    } catch {}

    try {
        plugin.backupCleaner = lvBackup.register(
            "xiaolv-common",
            async () => plugin.dumpData(),
            async (data: any) => plugin.restoreData(data)
        );
    } catch {}

    try {
        plugin.vaultBackupCleaner = lvSnapshotVault.register(createXiaolvCommonVaultAdapter(plugin));
    } catch {}

    plugin.syncLaunchpadRegistry();

    try {
        plugin.mobileEntryCleaner = lvLaunchpad.ensureUnifiedEntry(plugin);
    } catch {}

    try {
        plugin.searchCleaner = lvOmnisearch.registerProvider("xiaolv-common", async (keyword: string) => {
            const hits = await plugin.searchSnippets(keyword);
            return hits.slice(0, 5).map((s: any) => ({
                id: s.id,
                source: "常用",
                category: "note",
                title: s.title,
                snippet: s.content.slice(0, 60),
                onClick: async () => {
                    lvLaunchpad.haptic(12);
                    if (plugin.host.isMobile()) {
                        let text = s.content;
                        if (plugin.library) {
                            const got = await plugin.library.getItem(s.id);
                            if (got.ok) {
                                const kdRes = await plugin.library.getStoredItemKramdown(got.data);
                                text = kdRes.ok && kdRes.data ? kdRes.data : (got.data.summary || s.content);
                            }
                        }
                        await plugin.host.writeClipboard(text);
                        plugin.notify("info", "已复制，去目标应用粘贴");
                    } else {
                        void plugin.insertSnippet(s.id);
                    }
                },
            }));
        });
    } catch {}

    try {
        plugin.dateCrossCleaner = lvTicker.onDateCross("xiaolv-common", () => {
            plugin.previewCacheService.clear();
        });
    } catch {}
}
