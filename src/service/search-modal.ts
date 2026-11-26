// 主搜索弹窗与极速气泡卡片服务（SearchModal · S10）
import type {SearchScope} from "../ui/empty-state";
import {searchContext, receiptText, resetItemUsage, closeQuickAccessPopover} from "./search-context";
export {searchContext, receiptText, resetItemUsage, closeQuickAccessPopover};
import {collectCategories, collectTags, applyBasicFilters, SearchEntry} from "../model/search";
import {escapeHtml, isMarkdownFormattingPresent, renderSafeHtmlFromMarkdown} from "../model/clipboard";
import {isBlockId, isItemType, kramdownToPlainText, parseSnippetAnnotations, resolveBlockRefTarget} from "../model/item";
import {buildBlockRef, buildEmbedBlock} from "../model/actions";
import {collectDefaults, rememberValues} from "../model/variable-memory";
import {formatAiError, toErrorMessage} from "../model/errors";
import {getPinyinAdapter} from "../model/pinyin";
import {deriveOmniItemMetadata} from "./omni-search";
import {PromoteClipPayload} from "../ui/promote-clip";
import {lvActivity, showDocTreeNativeMenu, safeDocTitleFromHPath, withDocLock} from "../libs/lv-notice-kit";
import {confirmDelete} from "../ui/dialog-dom";
import {buildProviderRows} from "../model/provider-section";
import {queryEcosystemItems} from "./ecosystem";
import {pushRecentQuery, removeRecentQuery} from "../model/storage";
import {SearchMetaEntry, TransformKind} from "./ai";
import type {XiaolvCommonPluginContext} from "./plugin-context";

function shortTitle(title: string): string {
    return title.length > 48 ? `${title.slice(0, 48)}…` : title;
}

export async function openQuickAccessPopover(plugin: XiaolvCommonPluginContext, e?: MouseEvent): Promise<void> {
    closeQuickAccessPopover(plugin);
    const existing = typeof document !== "undefined" ? document.querySelector(".xlc-quick-popover") : null;
    if (existing) existing.remove();

    let entries: SearchEntry[] = [];
    try {
        const idx = await plugin.library.ensureIndex(0);
        const allEntries = idx.entries;
        const favSet = new Set(plugin.state?.favorites ?? []);
        const usage = plugin.state?.usage ?? {};

        const sorted = [...allEntries].sort((a: any, b: any) => {
            const aFav = favSet.has(a.id) ? 1 : 0;
            const bFav = favSet.has(b.id) ? 1 : 0;
            if (aFav !== bFav) return bFav - aFav;
            const aCount = usage[a.id]?.count ?? 0;
            const bCount = usage[b.id]?.count ?? 0;
            return bCount - aCount;
        });
        entries = sorted.slice(0, 5);
    } catch {
        entries = [];
    }

    if (typeof document === "undefined") return;

    const popover = document.createElement("div");
    popover.className = "xlc-quick-popover";
    popover.dataset.xlcControl = "host.quick-popover";
    if (typeof popover.setAttribute === "function") {
        popover.setAttribute("role", "dialog");
        popover.setAttribute("aria-label", "小驴常用极速气泡卡片");
    }

    const anchorRect = (e?.currentTarget as HTMLElement | null)?.getBoundingClientRect?.()
        ?? (plugin.topBarElement as HTMLElement | null)?.getBoundingClientRect?.();
    const rect = anchorRect ?? {
        left: e?.clientX ?? 0,
        bottom: (e?.clientY ?? 0) + 8,
        right: (e?.clientX ?? 0) + 220,
    };
    const popW = typeof window !== "undefined" ? Math.min(250, Math.max(180, window.innerWidth - 16)) : 250;
    const posX = typeof window !== "undefined" ? Math.max(8, Math.min(rect.right - popW, window.innerWidth - popW - 8)) : 100;
    const posY = typeof window !== "undefined" ? Math.max(8, Math.min(rect.bottom + 6, window.innerHeight - 280)) : 100;

    popover.style.position = "fixed";
    popover.style.left = `${posX}px`;
    popover.style.top = `${posY}px`;
    try {
        const currentZ = (window as any).siyuan?.zIndex;
        popover.style.zIndex = String(typeof currentZ === "number" ? Math.max(300, currentZ + 20) : 300);
    } catch {
        popover.style.zIndex = "300";
    }

    const head = document.createElement("div");
    head.className = "xlc-quick-popover-head";
    const safeHeadTitle = escapeHtml("🐴 极速常用 (Top 5)");
    head.innerHTML = `<strong>${safeHeadTitle}</strong><button type="button" class="xlc-quick-popover-close" aria-label="关闭">×</button>`;
    head.querySelector(".xlc-quick-popover-close")?.addEventListener("click", () => closeQuickAccessPopover(plugin));
    popover.appendChild(head);

    const list = document.createElement("div");
    list.className = "xlc-quick-popover-list";

    if (entries.length === 0) {
        const emptyTip = document.createElement("div");
        emptyTip.className = "xlc-quick-popover-empty";
        emptyTip.textContent = "暂无常用语或高频项";
        list.appendChild(emptyTip);
    } else {
        entries.forEach((entry, idx) => {
            const item = document.createElement("div");
            item.className = "xlc-quick-popover-item";
            item.dataset.id = entry.id;
            const titleStr = entry.title || "未命名常用语";
            const numKey = idx + 1;
            item.innerHTML = `<span class="xlc-quick-popover-num">${escapeHtml(String(numKey))}</span><span class="xlc-quick-popover-title">${escapeHtml(titleStr)}</span>`;
            item.addEventListener("click", async () => {
                closeQuickAccessPopover(plugin);
                const got = await plugin.library.getItem(entry.id);
                if (!got.ok) {
                    plugin.notify("error", got.message);
                    return;
                }
                const receipt = await plugin.executor.run(got.data, "insert");
                if (receipt.ok) {
                    plugin.service.touchRecent(entry.id);
                    plugin.recordUsage(entry.id);
                    plugin.notify("info", receiptText(plugin, receipt.message, got.data.title, receipt.pendingVerification));
                    plugin.notifyExternalDataChange();
                } else {
                    plugin.notify("error", receipt.message);
                }
            });
            list.appendChild(item);
        });
    }
    popover.appendChild(list);

    const onDocClick = (ev: MouseEvent) => {
        if (!popover.contains(ev.target as Node)) {
            closeQuickAccessPopover(plugin);
        }
    };
    const onKeydown = (ev: KeyboardEvent) => {
        if (ev.key === "Escape") {
            closeQuickAccessPopover(plugin);
        }
    };
    setTimeout(() => {
        document.addEventListener("click", onDocClick, { capture: true, once: true });
        document.addEventListener("keydown", onKeydown, { once: true });
    }, 10);

    plugin.quickAccessPopoverDismiss = () => {
        document.removeEventListener("click", onDocClick, { capture: true });
        document.removeEventListener("keydown", onKeydown);
        popover.remove();
    };

    document.body.appendChild(popover);
}

export function openSearchModal(
    plugin: XiaolvCommonPluginContext,
    insertTarget?: {docId: string; hPath: string},
    initialQuery?: string,
    surroundText?: string,
    defaultAction?: "insert" | "copy" | "openSource",
    initialScope?: SearchScope,
    options?: {
        miniMode?: boolean;
        isGlobalInvocation?: boolean;
        autoMinimizeOnDone?: boolean;
    }
): void {
    if (!plugin.library || !plugin.service) {
        plugin.notify("error", plugin.i18nFn()("startupFailed", "services unavailable"));
        return;
    }
    if (!plugin.sidecarReady) {
        plugin.notify("info", plugin.i18nFn()("sidecarLoading"));
        return;
    }
    if (!plugin.config) {
        plugin.openSetup();
        return;
    }
    let editorTarget = insertTarget ? null : plugin.host.captureInsertTarget();
    let capturedSeq = plugin.host.getSelectionSeq?.() ?? 0;
    let activeDialogInstance: import("../ui/dialog").CommonSearchDialog | null = null;
    const retiredTargets: Array<NonNullable<typeof editorTarget>> = [];
    let targetRuns = 0;
    let dialogClosed = false;
    let targetReleased = false;
    const flushRetiredTargets = (): void => {
        if (targetRuns !== 0) return;
        while (retiredTargets.length > 0) {
            const old = retiredTargets.pop();
            if (old) plugin.host.releaseInsertTarget(old);
        }
    };
    const refreshLiveEditorTarget = (): void => {
        if (insertTarget || dialogClosed) return;
        if (!activeDialogInstance?.isNonModalMode?.()) return;
        plugin.host.recordSelectionFromDOM?.();
        const curSeq = plugin.host.getSelectionSeq?.() ?? 0;
        const stale = curSeq !== capturedSeq
            || !editorTarget?.editor
            || !plugin.host.canInsertAtTarget(editorTarget);
        if (!stale) return;
        if (editorTarget) {
            if (targetRuns === 0) {
                plugin.host.releaseInsertTarget(editorTarget);
            } else {
                retiredTargets.push(editorTarget);
            }
        }
        editorTarget = plugin.host.captureInsertTarget();
        capturedSeq = plugin.host.getSelectionSeq?.() ?? curSeq;
        targetReleased = false;
    };
    const releaseTargetIfIdle = (): void => {
        flushRetiredTargets();
        if (editorTarget && dialogClosed && targetRuns === 0 && !targetReleased) {
            targetReleased = true;
            plugin.host.releaseInsertTarget(editorTarget);
        }
    };
    const withEditorTarget = <T>(mode: string, action: (snapshot: typeof editorTarget) => Promise<T>): Promise<T> => {
        if (!mode.startsWith("insert")) return action(null);
        refreshLiveEditorTarget();
        const snapshot = editorTarget
            ? Object.freeze({
                editor: editorTarget.editor,
                handle: editorTarget.handle,
                docId: editorTarget.docId,
            })
            : null;
        if (!snapshot) return action(null);
        targetRuns += 1;
        let result: Promise<T>;
        try {
            result = action(snapshot);
        } catch (err) {
            targetRuns -= 1;
            releaseTargetIfIdle();
            throw err;
        }
        return result.finally(() => {
            targetRuns -= 1;
            releaseTargetIfIdle();
        });
    };
    void import(/* webpackChunkName: "search-dialog" */ "../ui/dialog").then(({CommonSearchDialog}) => {
        if (plugin.unloading) {
            dialogClosed = true;
            releaseTargetIfIdle();
            return;
        }
        plugin.searchDialog?.destroy();
        const dialogInstance = new CommonSearchDialog({
            t: plugin.i18nFn(),
            initialQuery,
            initialScope,
            surroundText,
            defaultActionMode: defaultAction,
            density: plugin.state.search.density ?? "comfortable",
            onDensityChange: (density: any) => {
                plugin.state.search.density = density;
                plugin.persistSoon();
            },
            miniMode: options?.miniMode !== undefined ? options.miniMode : (plugin.state.search.miniMode ?? false),
            onMiniModeChange: (mini: any) => {
                plugin.state.search.miniMode = mini;
                plugin.persistSoon();
            },
            isGlobalInvocation: options?.isGlobalInvocation,
            autoMinimizeOnDone: options?.autoMinimizeOnDone,
            onReturnToBackground: () => plugin.returnToBackground(),
            miniPosition: plugin.state.search.miniPosition,
            onMiniPositionChange: (pos: any) => {
                plugin.state.search.miniPosition = pos;
                plugin.persistSoon();
            },
            miniCollapsed: plugin.state.search.miniCollapsed ?? false,
            onMiniCollapsedChange: (collapsed: any) => {
                plugin.state.search.miniCollapsed = collapsed;
                plugin.persistSoon();
            },
            clipPanelCollapsed: plugin.state.search.clipPanelCollapsed ?? false,
            onClipPanelCollapsedChange: (collapsed: any) => {
                plugin.state.search.clipPanelCollapsed = collapsed;
                plugin.persistSoon();
            },
            columnWidths: plugin.state.search.columnWidths,
            onColumnWidthsChange: (widths: any) => {
                plugin.state.search.columnWidths = widths;
                plugin.persistSoon();
            },
            getProfilePresets: () => plugin.state.profilePresets ?? {},
            getDocumentContext: () => {
                const info = plugin.host.currentDocInfo();
                return {
                    docId: info?.docId,
                    title: safeDocTitleFromHPath(info?.hPath),
                    hPath: info?.hPath,
                };
            },
            importStarterPackDirect: (md: any) => plugin.importStarterPackDirect(md),
            createStarterPackDedicatedDoc: (pack: any) => plugin.createStarterPackDedicatedDoc(pack),
            notify: (kind: any, msg: any) => plugin.notify(kind, msg),
            search: (query: any) => plugin.searchCoordinator.search(query),
            searchDocs: (k: any) => plugin.searchCoordinator.searchDocs(k),
            searchCurrentDoc: (keyword: string) => plugin.searchCoordinator.searchCurrentDoc(keyword),
            searchAllNotes: (keyword: string) => plugin.searchCoordinator.searchAllNotes(keyword),
            createFromOmni: async (entry: SearchEntry) => {
                const content = (entry.content || entry.summary || "").trim();
                if (!content) return false;
                const isClip = entry.id.startsWith("xlc-clip-");
                const cleanTitle = (entry.title || "").replace(/^[📋🔍☵★☆✦✓\s]+/, "").trim() || entry.title;
                const meta = deriveOmniItemMetadata({...entry, title: cleanTitle});

                let finalMarkdown = content;
                let finalTitle = cleanTitle;
                let finalTags = meta.tags;
                let finalCategory = isClip ? (meta.category === "待整理" ? "常用" : meta.category) : meta.category;
                let finalAlias = meta.recommendedAlias || undefined;

                if (isClip) {
                    const parsed = parseSnippetAnnotations(content);
                    finalMarkdown = parsed.cleanText || content;
                    finalTitle = parsed.title || cleanTitle || "剪贴板条目";
                    finalTags = Array.from(new Set(["剪贴板", ...parsed.tags].filter(Boolean)));
                    finalCategory = "常用";
                    if (parsed.title) {
                        try {
                            const adapter = getPinyinAdapter();
                            if (typeof adapter?.annotate === "function") {
                                const anno = adapter.annotate({title: parsed.title, alias: ""});
                                if (anno && anno.pyi) {
                                    finalAlias = anno.pyi.toLowerCase().slice(0, 8);
                                }
                            }
                        } catch {}
                    }
                }

                const created = await plugin.captureCoordinator.saveItem({
                    itemType: entry.itemType,
                    markdown: finalMarkdown,
                    title: finalTitle,
                    alias: finalAlias,
                    tags: finalTags,
                    category: finalCategory,
                    source: {
                        sourceDocId: entry.sourceDocId,
                        sourceBlockId: entry.targetBlockId || entry.sourceBlockId,
                        sourceType: isClip ? "clipboard" : "external",
                    },
                });
                if (created.ok) {
                    const notifyMsg = isClip
                        ? (plugin.i18nFn()("promoteClipboardSuccess", created.data.item.title) || `已将「${created.data.item.title}」沉淀为常用语`)
                        : plugin.i18nFn()("saved", created.data.item.title);
                    plugin.notify("info", notifyMsg);
                    plugin.notifyExternalDataChange();
                    return true;
                } else {
                    plugin.notify("error", created.message);
                    return false;
                }
            },
            promoteClipboardEntry: async (entry: SearchEntry, payload: PromoteClipPayload) => {
                if (!plugin.library) return false;
                const created = await plugin.captureCoordinator.saveItem({
                    itemType: entry.itemType || "text",
                    markdown: payload.markdown,
                    title: payload.title,
                    shortcode: payload.shortcode || undefined,
                    tags: payload.tags,
                    category: payload.category,
                    source: {
                        sourceDocId: entry.sourceDocId || "",
                        sourceBlockId: entry.targetBlockId || entry.sourceBlockId || "",
                        sourceType: "clipboard",
                    },
                });

                if (created.ok) {
                    const itemId = created.data.item.id;
                    const now = Date.now();
                    plugin.state.usage[itemId] = { count: 1, lastAt: now };
                    plugin.state.recents = [
                        { id: itemId, usedAt: now },
                        ...(plugin.state.recents || []).filter((r: any) => r.id !== itemId),
                    ].slice(0, 50);
                    if (payload.category) {
                        plugin.state.uiPrefs.lastCategoryFilter = payload.category;
                    }
                    plugin.persistSoon();

                    const scTitle = payload.shortcode ? payload.shortcode : payload.title;
                    try {
                        lvActivity.record({
                            source: "常用",
                            category: "note",
                            title: `剪贴板晋升片段: ${scTitle}`,
                        });
                    } catch {}

                    const notifyMsg = plugin.i18nFn()("promoteClipboardSuccess", created.data.item.title)
                        || `已将「${created.data.item.title}」沉淀为常用语`;
                    plugin.notify("info", notifyMsg);
                    plugin.notifyExternalDataChange();
                    return true;
                } else {
                    plugin.notify("error", created.message);
                    return false;
                }
            },
            captureOmniWithForm: (entry: SearchEntry) => {
                plugin.captureCoordinator.captureOmniWithForm(entry);
            },
            quickEditBlock: (blockId: string, currentContent: string) => {
                void import(/* webpackChunkName: "quick-edit" */ "../ui/quick-edit").then(({openQuickEditDialog}) => {
                    openQuickEditDialog({
                        t: plugin.i18nFn(),
                        updateBlock: (bId: any, text: any) => plugin.omniSearch.updateBlockContent(bId, text),
                        notify: (type: any, msg: any) => plugin.notify(type, msg),
                        onUpdated: (_bId: any, newText: any) => {
                            const active = plugin.searchDialog?.getActiveEntry();
                            if (active && (active.targetBlockId === blockId || active.id.includes(blockId))) {
                                active.content = newText;
                                active.summary = newText.slice(0, 100);
                                plugin.notifyExternalDataChange();
                            }
                        },
                    }, blockId, currentContent);
                }).catch(() => undefined);
            },
            openDocBlock: (blockId: string) => {
                plugin.host.openDoc("", blockId);
            },
            openDocContextMenu: async (blockId: string, event: MouseEvent) => {
                let box = "";
                let rootID = "";
                try {
                    const info = await plugin.kernelClient.request<{box?: unknown; rootID?: unknown}>("getBlockInfo", {id: blockId});
                    if (info && typeof info.box === "string") {
                        box = info.box;
                        rootID = typeof info.rootID === "string" ? info.rootID : blockId;
                    }
                } catch {}
                if (box) {
                    await showDocTreeNativeMenu({
                        notebookId: box,
                        docId: rootID || blockId,
                        position: { x: event.clientX, y: event.clientY },
                    });
                }
            },
            getDocPath: (docId: string) => {
                return plugin.library.getDocPath(docId);
            },
            getAdjacentBlocks: (blockId: string, docId: string) => {
                return plugin.omniSearch.getAdjacentBlocks(blockId, docId);
            },
            insertToDoc: async (itemId: any, docId: any, hPath: any, fills: any, mode = "insert") => {
                const got = await plugin.library.getItem(itemId);
                if (!got.ok) {
                    plugin.notify("error", got.message);
                    return false;
                }
                const item = got.data;
                let markdown: string;
                const blockrefTarget = item.itemType === "blockref"
                    ? (resolveBlockRefTarget(item) || item.source.sourceBlockId || item.blockId)
                    : (isBlockId(item.blockId) ? item.blockId : (resolveBlockRefTarget(item) || item.source.sourceBlockId));
                if (mode === "insert-embed" && blockrefTarget) {
                    markdown = buildEmbedBlock(blockrefTarget);
                } else if ((mode === "insert-ref" || (item.itemType === "blockref" && mode !== "insert-content")) && blockrefTarget) {
                    markdown = buildBlockRef(blockrefTarget, item.title || "ref");
                } else {
                    const kd = await plugin.library.getItemKramdown(item);
                    if (!kd.ok) {
                        plugin.notify("error", kd.message);
                        return false;
                    }
                    markdown = await plugin.executor.renderForInsert(kd.data, item, fills);
                }
                try {
                    const inserted = await plugin.library.appendToDoc(markdown, docId);
                    if (inserted) {
                        plugin.service.touchRecent(item.id);
                        plugin.recordUsage(item.id);
                        plugin.notifyExternalDataChange();
                        plugin.notify("info", plugin.i18nFn()("insertToDocDone", shortTitle(hPath || docId)));
                    } else {
                        plugin.notify("error", plugin.i18nFn()("insertToDocFailed"));
                    }
                    return inserted;
                } catch (err) {
                    plugin.notify("error", toErrorMessage(err));
                    return false;
                }
            },
            duplicateItem: async (itemId: any) => {
                const got = await plugin.library.getItem(itemId);
                if (!got.ok) return;
                const kd = await plugin.library.getStoredItemKramdown(got.data);
                if (!kd.ok) {
                    plugin.notify("error", kd.message);
                    return;
                }
                const src = got.data;
                const created = await plugin.library.createItem({
                    itemType: src.itemType,
                    markdown: kd.data,
                    title: src.title ? `${src.title} 副本` : undefined,
                    alias: src.alias || undefined,
                    tags: src.tags,
                    category: src.category || undefined,
                    url: src.url || undefined,
                    targetBlockId: src.targetBlockId || undefined,
                    source: {...src.source},
                });
                if (created.ok) {
                    plugin.notify("info", plugin.i18nFn()("duplicated", shortTitle(created.data.item.title)));
                    plugin.notifyExternalDataChange();
                } else {
                    plugin.notify("error", created.message);
                }
            },
            saveTransformed: async (itemId: any, transformLabel: any, text: any) => {
                const trimmed = (text ?? "").trim();
                if (!trimmed) return;
                const got = await plugin.library.getItem(itemId);
                if (!got.ok) {
                    plugin.notify("error", got.message);
                    return;
                }
                const created = await plugin.library.createItem({
                    itemType: "markdown",
                    markdown: trimmed,
                    title: `${got.data.title} · ${transformLabel}`,
                    tags: got.data.tags,
                    category: got.data.category || undefined,
                    source: {sourceDocId: got.data.libraryDocId, sourceBlockId: got.data.blockId, sourceType: "external"},
                });
                if (created.ok) {
                    plugin.notify("info", plugin.i18nFn()("saved", created.data.item.title));
                    plugin.notifyExternalDataChange();
                } else {
                    plugin.notify("error", created.message);
                }
            },
            openSetup: () => (plugin.config ? plugin.openSettings() : plugin.openSetup()),
            providerSearch: async (query: string) => {
                const rows: Array<{providerId: string; providerName: string; title: string; payload: string}> = [];
                for (const provider of plugin.registry.listExecutable()) {
                    if (!provider.runtime?.search) continue;
                    try {
                        let timeoutTimer: ReturnType<typeof setTimeout> | undefined;
                        const hits = await Promise.race([
                            provider.runtime.search(query),
                            new Promise<never>((_, reject) => {
                                timeoutTimer = setTimeout(() => reject(new Error("provider timeout")), 3000);
                            }),
                        ]).finally(() => {
                            if (timeoutTimer) clearTimeout(timeoutTimer);
                        });
                        for (const hit of hits ?? []) {
                            rows.push({
                                providerId: provider.record.pluginId,
                                providerName: provider.record.displayName,
                                title: String(hit?.title ?? ""),
                                payload: String(hit?.payload ?? ""),
                            });
                        }
                    } catch {}
                }
                try {
                    const ecoHits = await queryEcosystemItems(query);
                    for (const hit of ecoHits) {
                        rows.push({
                            providerId: "xiaolv-family-ecosystem",
                            providerName: hit.providerName,
                            title: hit.title,
                            payload: hit.payload,
                        });
                    }
                } catch {}
                return buildProviderRows(rows);
            },
            insertProviderPayload: (payload: any, target: any) => withEditorTarget("insert", async (snapshot) => {
                const trimmed = (payload ?? "").trim();
                if (!trimmed) return false;
                const rendered = (await plugin.executor.renderProviderOutput(trimmed)) ?? trimmed;
                if (target?.docId) {
                    try {
                        const inserted = await plugin.library.appendToDoc(rendered, target.docId);
                        if (inserted) plugin.notify("info", plugin.i18nFn()("insertToDocDone", shortTitle(target.hPath || target.docId)));
                        else plugin.notify("error", plugin.i18nFn()("insertToDocFailed"));
                        return inserted;
                    } catch (err) {
                        plugin.notify("error", toErrorMessage(err));
                        return false;
                    }
                }
                const insertTargetAvailable = Boolean(snapshot && plugin.host.canInsertAtTarget(snapshot));
                if (insertTargetAvailable && snapshot && !plugin.host.isMobile()) {
                    const targetDocId = snapshot.docId || "";
                    let rejectedByTargetSwitch = false;
                    const inserted = await withDocLock(targetDocId, async () => {
                        if (!plugin.host.canInsertAtTarget(snapshot)) {
                            rejectedByTargetSwitch = true;
                            return false;
                        }
                        return plugin.host.insertMarkdown(rendered, snapshot);
                    });
                    if (inserted) {
                        plugin.notify("info", plugin.i18nFn()("providerInserted"));
                        return true;
                    }
                    if (!rejectedByTargetSwitch) {
                        plugin.notify("error", plugin.i18nFn()("insertFailed"));
                        return false;
                    }
                }
                const html = isMarkdownFormattingPresent(rendered) ? renderSafeHtmlFromMarkdown(rendered) : undefined;
                const copied = await plugin.host.writeClipboard(rendered, html);
                const message = plugin.host.isMobile()
                    ? plugin.i18nFn()("insertPendingMobile")
                    : snapshot?.editor ? plugin.i18nFn()("insertTargetUnavailableCopied") : plugin.i18nFn()("insertNoEditor");
                plugin.notify(copied ? "info" : "error", copied ? message : plugin.i18nFn()("copyFailed"));
                return copied;
            }),
            copyProviderPayload: async (payload: any) => {
                const text = (payload ?? "").trim();
                const html = isMarkdownFormattingPresent(text) ? renderSafeHtmlFromMarkdown(text) : undefined;
                const ok = await plugin.host.writeClipboard(text, html);
                if (!ok) plugin.notify("error", plugin.i18nFn()("copyFailed"));
                return ok;
            },
            getTags: async () => {
                const idx = await plugin.library.ensureIndex();
                return collectTags(idx.entries);
            },
            getCategories: async () => {
                const idx = await plugin.library.ensureIndex();
                return collectCategories(idx.entries);
            },
            getFilters: () => ({
                type: plugin.state.uiPrefs.lastTypeFilter,
                tag: plugin.state.uiPrefs.lastTagFilter,
                category: plugin.state.uiPrefs.lastCategoryFilter,
            }),
            setFilters: (f: any) => {
                plugin.state.uiPrefs.lastTypeFilter = (f.type === "" || isItemType(f.type) ? f.type : "") as typeof plugin.state.uiPrefs.lastTypeFilter;
                plugin.state.uiPrefs.lastTagFilter = f.tag.slice(0, 64);
                plugin.state.uiPrefs.lastCategoryFilter = f.category.slice(0, 64);
                plugin.persistSoon();
            },
            getLastQuery: () => plugin.state.search.lastQuery,
            setLastQuery: (q: string) => {
                plugin.state.search.lastQuery = q.slice(0, 200);
                plugin.persistSoon();
            },
            getRecentQueries: () => plugin.state.search.recentQueries ?? [],
            addRecentQuery: (q: string) => {
                plugin.state.search.recentQueries = pushRecentQuery(plugin.state.search.recentQueries ?? [], q);
                plugin.persistSoon();
            },
            removeRecentQuery: (q: string) => {
                plugin.state.search.recentQueries = removeRecentQuery(plugin.state.search.recentQueries ?? [], q);
                plugin.persistSoon();
            },
            clearRecentQueries: () => {
                plugin.state.search.recentQueries = [];
                plugin.persistSoon();
            },
            getClipboardHistory: () => plugin.state.clipboardHistory ?? [],
            clearClipboardHistory: () => {
                plugin.state.clipboardHistory = [];
                plugin.persistSoon();
            },
            addClipboardHistory: (text: string) => {
                plugin.recordClipboard(text);
            },
            importBundleText: async (text: string) => {
                return plugin.importBundleText(text, "rename");
            },
            getVariablePresets: (itemId: string) => {
                return plugin.state.variablePresets?.[itemId];
            },
            saveVariablePreset: (itemId: string, name: string, fills: Record<string, string>) => {
                plugin.state.variablePresets ??= {};
                plugin.state.variablePresets[itemId] ??= {};
                plugin.state.variablePresets[itemId][name] = fills;
                plugin.persistSoon();
            },
            deleteVariablePreset: (itemId: string, name: string) => {
                if (plugin.state.variablePresets?.[itemId]) {
                    delete plugin.state.variablePresets[itemId][name];
                    plugin.persistSoon();
                }
            },
            syncSystemClipboard: async () => {
                return plugin.clipboardMonitor?.syncSystemClipboard() ?? null;
            },
            preview: async (itemId: any) => {
                return plugin.searchCoordinator.getPreview(itemId, async () => {
                    const got = await plugin.library.getItem(itemId);
                    let text = "";
                    const rawId = String(itemId);
                    if (got.ok) {
                        const kd = await plugin.library.getItemKramdown(got.data);
                        text = kd.ok ? await plugin.library.expandSnippetRefs(kd.data) : "";
                    } else if (rawId.startsWith("xlc-omni-") || isBlockId(rawId)) {
                        const cleanId = rawId.replace(/^xlc-omni-/, "");
                        try {
                            const res = await plugin.kernelClient.request<{kramdown?: unknown}>("getBlockKramdown", {id: cleanId});
                            if (res && typeof res.kramdown === "string" && res.kramdown.trim()) {
                                text = res.kramdown.trim();
                            }
                        } catch {}
                    }
                    return text;
                });
            },
            getSort: () => plugin.state.sort,
            setSort: (sort: any) => {
                plugin.state.sort = sort;
                plugin.persistSoon();
            },
            runAction: (itemId: any, mode: any) => withEditorTarget(mode, async (snapshot) => {
                if (itemId.startsWith("xlc-omni-") || itemId.startsWith("xlc-clip-")) {
                    const active = plugin.searchDialog?.getActiveEntry();
                    const content = active?.content || active?.summary || "";
                    if (mode.startsWith("copy")) {
                        const ok = await plugin.host.writeClipboard(kramdownToPlainText(content));
                        const msg = ok ? plugin.i18nFn()("copied", shortTitle(active?.title || "条目")) : plugin.i18nFn()("copyFailed");
                        if (!ok) plugin.notify("error", msg);
                        return {ok, message: msg};
                    } else {
                        const targetDocId = snapshot?.docId || "";
                        let ok = false;
                        let targetUnavailable = !snapshot || !plugin.host.canInsertAtTarget(snapshot);
                        if (!targetUnavailable && snapshot && !plugin.host.isMobile()) {
                            ok = await withDocLock(targetDocId, async () => {
                                if (!plugin.host.canInsertAtTarget(snapshot)) {
                                    targetUnavailable = true;
                                    return false;
                                }
                                return plugin.host.insertMarkdown(content, snapshot);
                            });
                        }
                        let msg = ok ? plugin.i18nFn()("inserted", shortTitle(active?.title || "条目")) : plugin.i18nFn()("insertFailed");
                        if (!ok && (plugin.host.isMobile() || targetUnavailable)) {
                            const copied = await plugin.host.writeClipboard(kramdownToPlainText(content));
                            if (copied) {
                                ok = true;
                                msg = plugin.host.isMobile()
                                    ? plugin.i18nFn()("copied", shortTitle(active?.title || "条目"))
                                    : snapshot?.editor ? plugin.i18nFn()("insertTargetUnavailableCopied") : plugin.i18nFn()("insertNoEditor");
                            }
                        }
                        plugin.notify(ok ? "info" : "error", msg);
                        return {ok, message: msg};
                    }
                }
                const got = await plugin.library.getItem(itemId);
                if (!got.ok) {
                    plugin.notify("error", got.message);
                    return {ok: false, message: got.message};
                }
                const receipt = await plugin.executor.run(
                    got.data,
                    mode,
                    mode.startsWith("insert") ? {editorTarget: snapshot ?? null} : undefined,
                );
                const msg = receipt.ok
                    ? receiptText(plugin, receipt.message, got.data.title, receipt.pendingVerification)
                    : receiptText(plugin, receipt.message, got.data.title, receipt.pendingVerification) || plugin.i18nFn()("kernelError", receipt.message);
                if (!receipt.ok) {
                    plugin.notify("error", msg);
                } else if (!mode.startsWith("copy")) {
                    plugin.notify("info", msg);
                }
                return {ok: receipt.ok, message: msg};
            }),
            runActionWithFills: (itemId: any, mode: any, fills: any) => withEditorTarget(mode, async (snapshot) => {
                const got = await plugin.library.getItem(itemId);
                if (!got.ok) {
                    plugin.notify("error", got.message);
                    return {ok: false, message: got.message};
                }
                const receipt = await plugin.executor.run(
                    got.data,
                    mode,
                    mode.startsWith("insert") ? {fills, editorTarget: snapshot ?? null} : {fills},
                );
                const msg = receipt.ok
                    ? receiptText(plugin, receipt.message, got.data.title, receipt.pendingVerification)
                    : receiptText(plugin, receipt.message, got.data.title, receipt.pendingVerification) || plugin.i18nFn()("kernelError", receipt.message);
                if (!receipt.ok) {
                    plugin.notify("error", msg);
                } else if (!mode.startsWith("copy")) {
                    plugin.notify("info", msg);
                }
                return {ok: receipt.ok, message: msg};
            }),
            promptVariables: () => plugin.state.insert?.promptVariables,
            getVariableDefaults: (labels: any) => collectDefaults(plugin.state.variableMemory, labels),
            rememberVariables: (fills: any) => {
                plugin.state.variableMemory = rememberValues(plugin.state.variableMemory, fills, Date.now());
                plugin.persistSoon();
            },
            batchUpdateMetadata: async (itemIds: any, patch: any) => {
                const receipt = await plugin.library.batchUpdateTagsAndCategory(itemIds, patch);
                if (receipt.failed > 0) {
                    plugin.notify("error", `批量更新完成：成功 ${receipt.updated} 项，失败 ${receipt.failed} 项`);
                } else if (receipt.updated > 0) {
                    plugin.notify("info", `已批量更新 ${receipt.updated} 个条目的元数据`);
                }
                return receipt;
            },
            getCategoryEntryIds: async (path: string) => {
                const idx = await plugin.library.ensureIndex(5 * 60_000);
                return idx.entries
                    .filter((e: any) => e.category === path || (typeof e.category === "string" && e.category.startsWith(path + "/")))
                    .map((e: any) => e.id);
            },
            getUsage: () => plugin.state.usage,
            resetItemUsage: (itemId: string) => resetItemUsage(plugin, itemId),
            newItem: (titleCandidate?: string) => plugin.captureCoordinator.newManual(titleCandidate),
            newWithContent: (content: string, options?: {title?: string}) => plugin.captureCoordinator.newWithContent(content, options),
            openSource: async (itemId: any) => {
                const got = await plugin.library.getItem(itemId);
                if (!got.ok) {
                    plugin.notify("error", got.message);
                    return {ok: false, message: got.message};
                }
                const receipt = await plugin.executor.openSource(got.data);
                if (!receipt.ok) {
                    const msg = receipt.message === "source-missing"
                        ? plugin.i18nFn()("sourceGone")
                        : receipt.message === "asset-missing"
                            ? plugin.i18nFn()("assetMissing")
                            : plugin.i18nFn()("kernelError", receipt.message);
                    plugin.notify("error", msg);
                    return {ok: false, message: msg};
                }
                plugin.notify("info", plugin.i18nFn()("sourceOpened"));
                return {ok: true, message: "opened"};
            },
            pullFromSource: async (itemId: any) => {
                const res = await plugin.library.pullFromSourceBlock(itemId);
                if (!res.ok) {
                    plugin.notify("error", res.message);
                    return false;
                }
                plugin.invalidatePreviewCache([itemId]);
                plugin.notify("info", `已从思源原块同步最新内容：「${shortTitle(res.data.item.title)}」`);
                plugin.notifyExternalDataChange();
                return true;
            },
            pushToSource: async (itemId: any) => {
                const res = await plugin.library.pushToSourceBlock(itemId);
                if (!res.ok) {
                    plugin.notify("error", res.message);
                    return false;
                }
                plugin.notify("info", "已将当前条目内容回写至思源来源块");
                return true;
            },
            insertRaw: (markdown: any, target: any) => withEditorTarget("insert", async (snapshot) => {
                const trimmed = (markdown ?? "").trim();
                if (!trimmed) return false;
                if (target?.docId) {
                    const inserted = await plugin.library.appendToDoc(trimmed, target.docId);
                    plugin.notify(inserted ? "info" : "error", inserted
                        ? plugin.i18nFn()("insertToDocDone", shortTitle(target.hPath || target.docId))
                        : plugin.i18nFn()("insertToDocFailed"));
                    return inserted;
                }
                const insertTargetAvailable = Boolean(snapshot && plugin.host.canInsertAtTarget(snapshot));
                if (insertTargetAvailable && snapshot && !plugin.host.isMobile()) {
                    const targetDocId = snapshot.docId || "";
                    let rejectedByTargetSwitch = false;
                    const inserted = await withDocLock(targetDocId, async () => {
                        if (!plugin.host.canInsertAtTarget(snapshot)) {
                            rejectedByTargetSwitch = true;
                            return false;
                        }
                        return plugin.host.insertMarkdown(trimmed, snapshot);
                    });
                    if (inserted) {
                        plugin.notify("info", plugin.i18nFn()("aiOriginalPreserved"));
                        return true;
                    }
                    if (!rejectedByTargetSwitch) {
                        plugin.notify("error", plugin.i18nFn()("insertFailed"));
                        return false;
                    }
                }
                const html = isMarkdownFormattingPresent(trimmed) ? renderSafeHtmlFromMarkdown(trimmed) : undefined;
                const copied = await plugin.host.writeClipboard(trimmed, html);
                const message = plugin.host.isMobile()
                    ? plugin.i18nFn()("insertPendingMobile")
                    : snapshot?.editor ? plugin.i18nFn()("insertTargetUnavailableCopied") : plugin.i18nFn()("insertNoEditor");
                plugin.notify(copied ? "info" : "error", copied ? message : plugin.i18nFn()("copyFailed"));
                return copied;
            }),
            copyText: async (text: any) => {
                const html = isMarkdownFormattingPresent(text) ? renderSafeHtmlFromMarkdown(text) : undefined;
                const ok = await plugin.host.writeClipboard(text, html);
                if (!ok) plugin.notify("error", plugin.i18nFn()("copyFailed"));
                return ok;
            },
            aiEnabled: () => Boolean(plugin.state?.ai?.enabled),
            hasActiveEditor: () => {
                refreshLiveEditorTarget();
                return editorTarget ? !!editorTarget.editor : plugin.host.hasActiveEditor();
            },
            hasInsertTarget: () => {
                refreshLiveEditorTarget();
                return editorTarget ? plugin.host.canInsertAtTarget(editorTarget) : plugin.host.hasActiveEditor();
            },
            onSyncEditorContext: () => refreshLiveEditorTarget(),
            aiSemantic: async (desc: any, filters: any, opts?: {signal?: AbortSignal}) => {
                try {
                    const idx = await plugin.library.ensureIndex();
                    const safeItemType = filters.itemType && isItemType(filters.itemType) ? filters.itemType : "";
                    const scoped = applyBasicFilters(idx.entries, {itemType: safeItemType, tag: filters.tag, category: filters.category, scope: filters.scope}, searchContext(plugin));
                    const meta: SearchMetaEntry[] = scoped.map((e: any) => ({
                        id: e.id, title: e.title, alias: e.alias, tags: e.tags, category: e.category, summary: e.summary, itemType: e.itemType,
                    }));
                    const picked = await plugin.ai.semanticPick(desc, meta, opts?.signal);
                    const entryMap = new Map(scoped.map((e: any) => [e.id, e]));
                    return {ok: true as const, entries: picked.map((p: any) => entryMap.get(p.id)).filter((e: any): e is NonNullable<typeof e> => !!e)};
                } catch (err) {
                    return {ok: false as const, message: formatAiError(err, plugin.i18nFn())};
                }
            },
            aiTransform: async (itemId: any, kind: TransformKind, opts?: {signal?: AbortSignal}) => {
                try {
                    const got = await plugin.library.getItem(itemId);
                    if (!got.ok) return {ok: false as const, message: got.message};
                    const kd = await plugin.library.getItemKramdown(got.data);
                    if (!kd.ok) return {ok: false as const, message: kd.message};
                    return {ok: true as const, text: await plugin.ai.transform(kind, kd.data, opts?.signal)};
                } catch (err) {
                    return {ok: false as const, message: formatAiError(err, plugin.i18nFn())};
                }
            },
            listCustomTransforms: () => (plugin.state?.ai?.customTransforms || [])
                .filter((ct: any) => ct.name.trim() && ct.prompt.trim())
                .map((ct: any) => ({id: ct.id, name: ct.name})),
            aiTransformCustom: async (itemId: any, customId: any, opts?: {signal?: AbortSignal}) => {
                try {
                    const ct = (plugin.state?.ai?.customTransforms || []).find((c: any) => c.id === customId);
                    if (!ct) return {ok: false as const, message: "custom-xlc-transform-not-found"};
                    const got = await plugin.library.getItem(itemId);
                    if (!got.ok) return {ok: false as const, message: got.message};
                    const kd = await plugin.library.getItemKramdown(got.data);
                    if (!kd.ok) return {ok: false as const, message: kd.message};
                    return {ok: true as const, text: await plugin.ai.transformCustom(ct.prompt, kd.data, opts?.signal)};
                } catch (err) {
                    return {ok: false as const, message: formatAiError(err, plugin.i18nFn())};
                }
            },
            isSourceMissing: (entry) => {
                const block = entry.sourceBlockId;
                const doc = entry.sourceDocId;
                return (!!block && plugin.missingSources.has(block)) || (!!doc && plugin.missingSources.has(doc) && !entry.sourceBlockId);
            },
            editItem: async (itemId: any) => {
                const got = await plugin.library.getItem(itemId);
                if (!got.ok) {
                    plugin.notify("error", got.message);
                    return;
                }
                plugin.openEditDialog(got.data);
            },
            deleteItem: async (itemId: any) => {
                const got = await plugin.library.getItem(itemId);
                if (!got.ok) {
                    plugin.notify("error", got.message);
                    return;
                }
                confirmDelete(plugin.i18nFn(), got.data.title, async () => {
                    const removed = await plugin.library.removeItem(itemId);
                    if (removed.ok) {
                        plugin.invalidatePreviewCache([itemId]);
                        plugin.state.favorites = plugin.state.favorites.filter((id: string) => id !== itemId);
                        plugin.state.recents = plugin.state.recents.filter((r: any) => r.id !== itemId);
                        delete plugin.state.usage[itemId];
                        plugin.persistSoon();
                        plugin.notify("info", plugin.i18nFn()("deleted", got.data.title));
                        plugin.notifyExternalDataChange();
                        plugin.library.reindex().catch((err: any) => {
                            plugin.notify("error", plugin.i18nFn()("kernelError", toErrorMessage(err)));
                        });
                    } else {
                        plugin.notify("error", removed.message);
                    }
                });
            },
            toggleFavorite: (itemId: any) => {
                const fav = plugin.service.toggleFavorite(itemId);
                void plugin.dockView?.refresh();
                return fav;
            },
            isFavorite: (itemId: any) => plugin.state.favorites.includes(itemId),
            close: () => {
                dialogClosed = true;
                if (plugin.searchDialog === dialogInstance) {
                    plugin.searchDialog = null;
                }
                releaseTargetIfIdle();
            },
            isMobile: () => plugin.host.isMobile(),
            isClipboardSmartMatchEnabled: () => plugin.state.clipboardSmartMatchEnabled === true,
            getPinnedTopChips: () => plugin.state.pinnedTopChips ?? [],
            setPinnedTopChips: (ids: string[]) => {
                plugin.state.pinnedTopChips = ids.slice(0, 5);
                plugin.persistSoon();
            },
        });
        activeDialogInstance = dialogInstance;
        plugin.searchDialog = dialogInstance;
        plugin.searchDialog.insertTarget = insertTarget ? {docId: insertTarget.docId, hPath: insertTarget.hPath} : null;
        plugin.searchDialog.open();
    }).catch((err) => {
        plugin.notify("error", (plugin.i18nFn()("dynamicLoadFailed") || "加载搜索模块失败") + ": " + toErrorMessage(err));
    });
}
