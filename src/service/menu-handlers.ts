// 宿主扩展菜单与系统事件监听（MenuHandlers · S10）
import {isBlockId} from "../model/item";
import {classifyLinkTarget} from "../model/item";
import {toErrorMessage} from "../model/errors";
import {getSingleDocTreeDiscoveryTarget} from "../model/discovery-target";
import {CONFIG_VERSION} from "../model/storage";
import {confirm} from "siyuan";
import {getCleanBlockText} from "../libs/lv-notice-kit";
import type {XiaolvCommonPluginContext} from "./plugin-context";

function shortTitle(title: string): string {
    return title.length > 48 ? `${title.slice(0, 48)}…` : title;
}

export function setupSecondaryMenuHandlers(plugin: XiaolvCommonPluginContext): () => void {
    const registered: Array<[string, (event: any) => void]> = [];
    const bind = (eventName: string, handler: (event: any) => void): void => {
        plugin.eventBus.on(eventName as any, handler as any);
        registered.push([eventName, handler]);
    };

    try {
        plugin.linkMenuHandler = (event: any) => {
            if (!event?.detail?.menu) return;
            const {menu, element} = event.detail;
            const href = element?.getAttribute?.("href") ?? "";
            if (!href || !element) return;
            menu.addItem({
                icon: "iconXlcCommon",
                label: plugin.i18nFn()("captureLinkMenu"),
                click: () => plugin.captureCoordinator.captureLink(href, element.textContent ?? ""),
            });
        };
        bind("open-menu-link", plugin.linkMenuHandler);

        plugin.imageMenuHandler = (event: any) => {
            if (!event?.detail?.menu) return;
            const {menu, element} = event.detail;
            const src = element?.getAttribute?.("src") ?? "";
            const target = classifyLinkTarget(src.startsWith("assets/") ? src : "");
            if (!target) return;
            menu.addItem({
                icon: "iconXlcCommon",
                label: plugin.i18nFn()("captureImageMenu"),
                click: () => plugin.captureCoordinator.captureImage(target.value, element?.getAttribute?.("title") ?? ""),
            });
        };
        bind("open-menu-image", plugin.imageMenuHandler);

        plugin.docTreeMenuHandler = (event: any) => {
            if (!event?.detail?.menu) return;
            const {menu, elements, type, items} = event.detail;
            if (type !== "items" && type !== "doc" && type !== "docs" && type !== undefined) return;
            const ids: string[] = [];
            if (type === "doc" || type === "docs") {
                for (const item of items ?? []) {
                    if (isBlockId(item?.id) && ids.length < 64) ids.push(item.id);
                }
            } else {
                for (const el of elements ?? []) {
                    const id = el?.getAttribute?.("data-node-id") ?? "";
                    if (id && ids.length < 64) ids.push(id);
                }
            }
            if (ids.length === 0) return;
            const treeTarget = getSingleDocTreeDiscoveryTarget(type, items);
            menu.addItem({
                icon: "iconXlcCommon",
                label: plugin.i18nFn()("insertToDocMenu"),
                click: () => {
                    const docId = ids[0];
                    if (!docId) return;
                    void plugin.library.getDocPath(docId).then((path: string) => {
                        plugin.openSearch({docId, hPath: path});
                    }).catch((err: unknown) => plugin.notify("error", plugin.i18nFn()("kernelError", toErrorMessage(err))));
                },
            });
            if (treeTarget) {
                menu.addItem({
                    icon: "iconXlcCommon",
                    label: plugin.i18nFn()("discoveryFromTreeMenu"),
                    click: () => plugin.openDiscoveryForTreeRoot(treeTarget),
                });
            }
            menu.addItem({
                icon: "iconXlcCommon",
                label: plugin.i18nFn()("setAsLibraryMenu"),
                click: () => {
                    confirm("⚠️ " + plugin.i18nFn()("setupTitle"), plugin.i18nFn()("setAsLibraryConfirm", String(ids.length)), () => {
                        plugin.applyConfig({
                            configVersion: CONFIG_VERSION,
                            mode: "doc",
                            notebookIds: [],
                            containerDocIds: ids,
                            createdDocIds: [],
                            configuredAt: Date.now(),
                        });
                        plugin.notify("info", plugin.i18nFn()("libDocSet", String(ids.length)));
                    });
                },
            });
        };
        bind("open-menu-doctree", plugin.docTreeMenuHandler);

        plugin.blockIconMenuHandler = (event: any) => {
            const {menu, blockElements, protyle} = event.detail ?? ({} as any);
            if (!menu || typeof menu.addItem !== "function") return;
            const elements = Array.from(blockElements ?? []).filter((el): el is HTMLElement => Boolean(el));
            const blockIds = elements
                .map((el) => el.getAttribute?.("data-node-id") ?? "")
                .filter((id) => isBlockId(id));
            if (blockIds.length === 0) return;
            const docId = protyle?.block?.rootID || plugin.host?.currentDocId() || null;
            const firstBlockId = blockIds[0]!;
            const firstEl = elements[0];
            const customLogicalId = firstEl?.getAttribute?.("custom-xlc-id") ?? "";
            const idx = plugin.library?.getIndex();
            const matchedEntry = idx?.entries.find((e) =>
                (customLogicalId && e.id === customLogicalId)
                || e.blockId === firstBlockId
                || e.targetBlockId === firstBlockId
                || e.sourceBlockId === firstBlockId
            );
            if (matchedEntry && blockIds.length === 1) {
                menu.addItem({
                    icon: "iconXlcCommon",
                    label: `在小驴常用中编辑「${shortTitle(matchedEntry.title || matchedEntry.id)}」`,
                    click: () => {
                        void plugin.library.getItem(matchedEntry.id).then((got) => {
                            if (got.ok) void plugin.openEditDialog(got.data);
                            else plugin.notify("error", got.message);
                        }).catch((err: unknown) => {
                            plugin.notify("error", toErrorMessage(err));
                        });
                    },
                });
            }
            const isInLibraryDoc = Boolean(docId && plugin.config?.containerDocIds.includes(docId));
            if (isInLibraryDoc && !matchedEntry) {
                menu.addItem({
                    icon: "iconXlcCommon",
                    label: `原地纳管为小驴常用条目（共 ${blockIds.length} 块，不复制块）`,
                    click: () => {
                        void plugin.library.adoptUnmanagedLibraryBlocks(blockIds).then((res) => {
                            if (res.ok) {
                                plugin.notify("info", `已原地纳管 ${res.data.adopted} 个库文档块`);
                                plugin.notifyExternalDataChange();
                            } else {
                                plugin.notify("error", res.message);
                            }
                        }).catch((err: unknown) => {
                            plugin.notify("error", toErrorMessage(err));
                        });
                    },
                });
            } else if (blockIds.length > 1) {
                menu.addItem({
                    icon: "iconXlcCommon",
                    label: `合并选中的 ${blockIds.length} 个块存入小驴常用`,
                    click: () => void plugin.captureCoordinator.captureBlocksById(blockIds, docId),
                });
            } else {
                menu.addItem({
                    icon: "iconXlcCommon",
                    label: plugin.i18nFn()("captureBlock") || "存入小驴常用（复制块正文）",
                    click: () => void plugin.captureCoordinator.captureBlocksById(blockIds, docId),
                });
                menu.addItem({
                    icon: "iconXlcCommon",
                    label: plugin.i18nFn()("captureBlockRefMenu") || "存为小驴块引用（跟随原块实时变化）",
                    click: () => plugin.captureCoordinator.captureBlockRef(firstBlockId, getCleanBlockText(firstEl), docId),
                });
            }
        };
        bind("click-blockicon", plugin.blockIconMenuHandler);

        plugin.editorTitleMenuHandler = (event: any) => {
            const {menu, data, protyle} = event.detail ?? ({} as any);
            if (!menu || typeof menu.addItem !== "function") return;
            const docId = data?.id || data?.rootID || protyle?.block?.rootID || plugin.host?.currentDocId() || "";
            if (!isBlockId(docId)) return;
            if (plugin.config?.containerDocIds.includes(docId)) {
                menu.addItem({
                    icon: "iconXlcCommon",
                    label: "纳管本库文档中手写的新块",
                    click: () => {
                        void plugin.library.adoptUnmanagedLibraryBlocks().then((res) => {
                            if (res.ok) {
                                plugin.notify("info", res.data.adopted > 0
                                    ? `已原地纳管 ${res.data.adopted} 个手写新块`
                                    : "当前库文档无待纳管的新块");
                                plugin.notifyExternalDataChange();
                            } else {
                                plugin.notify("error", res.message);
                            }
                        }).catch((err: unknown) => {
                            plugin.notify("error", toErrorMessage(err));
                        });
                    },
                });
            }
            menu.addItem({
                icon: "iconXlcCommon",
                label: plugin.i18nFn()("insertToDocMenu") || "从小驴常用插入到此文档…",
                click: () => {
                    void plugin.library.getDocPath(docId).then((path: string) => {
                        plugin.openSearch({docId, hPath: path || data?.name || docId});
                    }).catch((err: unknown) => plugin.notify("error", plugin.i18nFn()("kernelError", toErrorMessage(err))));
                },
            });
            menu.addItem({
                icon: "iconXlcCommon",
                label: plugin.i18nFn()("discoverCurrentDocument") || "扫描本文档发现常用候选…",
                click: () => plugin.openDiscoveryForCurrentDocument("document"),
            });
        };
        bind("click-editortitleicon", plugin.editorTitleMenuHandler);

        plugin.switchProtyleHandler = (event: any) => {
            const raw = (event?.detail?.protyle ?? event?.detail ?? (event as any)?.protyle) as any;
            if (raw) {
                const normalized = raw.protyle ? raw : (raw.block?.rootID ? {protyle: raw} : raw);
                plugin.host?.recordActiveEditor(normalized);
                plugin.host?.recordSelectionFromDOM?.();
            }
            plugin.searchDialog?.syncActiveContextAfterTabSwitch();
        };
        bind("switch-protyle", plugin.switchProtyleHandler);
        bind("loaded-protyle-static", plugin.switchProtyleHandler);

        plugin.wsMainHandler = (event: any) => {
            const cmd = event?.detail?.cmd;
            if (cmd !== "transactions" && cmd !== "savedoc" && cmd !== "rename") return;
            if (!plugin.config || !plugin.library) return;

            if (!plugin.cachedWatchedIds || !plugin.cachedLibDocIds) {
                const idx = plugin.library.getIndex();
                const libDocIds = new Set<string>(plugin.config.containerDocIds);
                const watchedIds = new Set<string>(plugin.config.containerDocIds);
                if (idx) {
                    for (const e of idx.entries) {
                        if (e.libraryDocId) {
                            libDocIds.add(e.libraryDocId);
                            watchedIds.add(e.libraryDocId);
                        }
                        if (e.blockId) watchedIds.add(e.blockId);
                        if (e.sourceBlockId) watchedIds.add(e.sourceBlockId);
                        if (e.targetBlockId) watchedIds.add(e.targetBlockId);
                        if (e.sourceDocId) watchedIds.add(e.sourceDocId);
                    }
                }
                plugin.cachedLibDocIds = libDocIds;
                plugin.cachedWatchedIds = watchedIds;
            }

            const currentDocId = plugin.host?.currentDocId() ?? "";
            let relevant = Boolean(currentDocId && plugin.cachedLibDocIds.has(currentDocId));
            if (!relevant && Array.isArray(event?.detail?.data)) {
                for (const tx of event.detail.data as Array<{doOperations?: Array<{id?: string; parentID?: string}>}>) {
                    for (const op of tx?.doOperations ?? []) {
                        if ((op?.id && plugin.cachedWatchedIds.has(op.id)) || (op?.parentID && plugin.cachedWatchedIds.has(op.parentID))) {
                            relevant = true;
                            break;
                        }
                    }
                    if (relevant) break;
                }
            }
            if (!relevant) return;
            if (plugin.wsSyncTimer) clearTimeout(plugin.wsSyncTimer);
            plugin.wsSyncTimer = setTimeout(() => {
                plugin.wsSyncTimer = null;
                if (plugin.unloading) return;
                plugin.cachedWatchedIds = null;
                plugin.cachedLibDocIds = null;
                plugin.library?.invalidateIndex();
                plugin.invalidatePreviewCache();
                plugin.notifyExternalDataChange();
            }, 320);
        };
        bind("ws-main", plugin.wsMainHandler);
    } catch {}

    if (plugin.host && !plugin.host.isMobile() && typeof plugin.addDock === "function") {
        try {
            plugin.addDock({
                config: {
                    position: "RightTop",
                    size: { width: 300, height: 0 },
                    icon: "iconXlcCommon",
                    title: plugin.i18nFn()("pluginName") || "小驴常用",
                },
                data: {},
                type: "xiaolv-common-dock",
                init: (custom: any) => {
                    void plugin.mountDockView(custom.element as HTMLElement);
                },
                destroy: () => {
                    plugin.dockView?.destroy();
                    plugin.dockView = null;
                },
            });
        } catch (err) {
            plugin.notify?.("error", toErrorMessage(err));
        }
    }

    const stopSelectionTracking = plugin.host?.startSelectionTracking?.();
    let tabSyncTimer: ReturnType<typeof setTimeout> | null = null;
    const onTabBarInteraction = (e: Event): void => {
        if (plugin.unloading || !plugin.searchDialog?.isNonModalMode?.()) return;
        const target = e.target as Element | null;
        if (!target?.closest?.(".layout-tab-bar, [data-type='tab-header']")) return;
        if (tabSyncTimer) clearTimeout(tabSyncTimer);
        tabSyncTimer = setTimeout(() => {
            tabSyncTimer = null;
            if (!plugin.unloading) plugin.searchDialog?.syncActiveContextAfterTabSwitch();
        }, 0);
    };
    if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
        document.addEventListener("click", onTabBarInteraction, {capture: true, passive: true});
    }

    let cleaned = false;
    return () => {
        if (cleaned) return;
        cleaned = true;
        if (tabSyncTimer) {
            clearTimeout(tabSyncTimer);
            tabSyncTimer = null;
        }
        if (typeof document !== "undefined" && typeof document.removeEventListener === "function") {
            document.removeEventListener("click", onTabBarInteraction, true);
        }
        try { stopSelectionTracking?.(); } catch {}
        for (const [eventName, handler] of registered) {
            try {
                plugin.eventBus?.off(eventName as any, handler as any);
            } catch {}
        }
        registered.length = 0;
        if (plugin.wsSyncTimer) {
            clearTimeout(plugin.wsSyncTimer);
            plugin.wsSyncTimer = null;
        }
        plugin.linkMenuHandler = null;
        plugin.imageMenuHandler = null;
        plugin.docTreeMenuHandler = null;
        plugin.blockIconMenuHandler = null;
        plugin.editorTitleMenuHandler = null;
        plugin.switchProtyleHandler = null;
        plugin.wsMainHandler = null;
    };
}
