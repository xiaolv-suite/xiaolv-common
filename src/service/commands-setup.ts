// 常用命令注册器（CommandsSetup · S10）
import {outputNextPasteQueueItem} from "./paste-queue";
import type {XiaolvCommonPluginContext} from "./plugin-context";

export function setupPluginCommands(plugin: XiaolvCommonPluginContext): void {
    plugin.addCommand({
        langKey: "open",
        hotkey: "⌥⇧A",
        callback: () => plugin.openSearch(),
    });
    plugin.addCommand({
        langKey: "globalQuickMini",
        hotkey: "⌥⇧M",
        globalCallback: () => plugin.handleGlobalQuickMini(),
        callback: () => plugin.handleGlobalQuickMini(),
    });
    plugin.addCommand({
        langKey: "toggleDock",
        hotkey: "⌥⇧D",
        callback: () => {
            if (plugin.host?.isMobile?.()) {
                plugin.notify("info", "移动端模式暂不支持侧边栏，请使用 Alt+Shift+A 呼出搜索面板");
                return;
            }
            const dockBtn = typeof document !== "undefined"
                ? document.querySelector<HTMLElement>('[data-type$="xiaolv-common-dock"]')
                : null;
            if (dockBtn) {
                dockBtn.click();
            } else {
                plugin.notify("info", "侧边栏按钮未在当前布局显示，请在右侧面板栏或外观设置中启用「小驴常用」Dock");
            }
        },
    });
    plugin.addCommand({
        langKey: "pasteQueueNext",
        hotkey: "⌥⇧Q",
        callback: async () => {
            const result = await outputNextPasteQueueItem(plugin.host);
            if (result.reason === "empty") {
                plugin.notify("info", plugin.i18nFn()("pasteQueueEmpty"));
                return;
            }
            if (!result.ok) {
                if (result.reason !== "busy") plugin.notify("error", result.reason === "queue-changed"
                    ? "输出期间队列已变化，请核实已输出内容；没有移除新队首。"
                    : "输出失败，条目仍在队首，请核实编辑器或剪贴板后重试。");
                return;
            }
            plugin.notify("info", plugin.i18nFn()("pasteQueuePopped", result.item!.title, String(result.remaining)));
        },
    });
    plugin.addCommand({
        langKey: "surroundSelection",
        hotkey: "⌥⇧W",
        callback: () => {
            const sel = typeof window !== "undefined" ? window.getSelection()?.toString().trim() : "";
            if (!sel) {
                plugin.notify("info", plugin.i18nFn()("surroundNoSelection"));
                return;
            }
            plugin.openSearch(undefined, undefined, sel);
        },
    });
    plugin.addCommand({
        langKey: "saveSelection",
        hotkey: "⌥⇧E",
        callback: () => void plugin.captureCoordinator.saveSelection(),
    });
    plugin.addCommand({
        langKey: "saveClipboard",
        callback: () => void plugin.captureCoordinator.captureFromClipboard(),
    });
    plugin.addCommand({
        langKey: "quickCapture",
        hotkey: "⌥⇧V",
        callback: () => void plugin.captureCoordinator.quickCaptureFromClipboard(),
    });
    plugin.addCommand({
        langKey: "newItem",
        hotkey: "⌥⇧N",
        callback: () => void plugin.captureCoordinator.newManual(),
    });
    plugin.addCommand({
        langKey: "captureBlock",
        hotkey: "⌥⇧B",
        callback: () => void plugin.captureCoordinator.captureCurrentBlock(),
    });
    plugin.addCommand({
        langKey: "captureDoc",
        callback: () => void plugin.captureCoordinator.captureCurrentDoc(),
    });
    plugin.addCommand({
        langKey: "insertCmd",
        callback: () => plugin.openSearch(undefined, undefined, undefined, "insert"),
    });
    plugin.addCommand({
        langKey: "copyCmd",
        callback: () => plugin.openSearch(undefined, undefined, undefined, "copy"),
    });
    plugin.addCommand({
        langKey: "openSourceCmd",
        callback: () => plugin.openSearch(undefined, undefined, undefined, "openSource"),
    });
    plugin.addCommand({
        langKey: "openClipboardHistory",
        hotkey: "⌥⇧H",
        callback: () => plugin.openSearch(undefined, undefined, undefined, undefined, "clipboard"),
    });
    plugin.addCommand({
        langKey: "discoverCurrentDocument",
        callback: () => plugin.openDiscoveryForCurrentDocument(),
    });
    plugin.addCommand({
        langKey: "discoverCurrentNotebook",
        callback: () => plugin.openDiscoveryForCurrentDocument("notebook"),
    });
    plugin.addCommand({
        langKey: "openLibraryDoc",
        callback: () => {
            plugin.openLibraryDocument();
        },
    });
}
