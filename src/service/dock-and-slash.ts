// 侧栏 Dock 视图与斜杠菜单服务（DockAndSlash · S10）
import type {DockView, DockViewDeps} from "../ui/dock-view";
import {searchEntries} from "../model/search";
import {isMarkdownFormattingPresent, renderSafeHtmlFromMarkdown} from "../model/clipboard";
import {lvLaunchpad} from "../libs/lv-notice-kit";
import {toErrorMessage} from "../model/errors";
import {InsertMode} from "../model/actions";
import {listAskFields} from "../model/variables";
import {collectDefaults, rememberValues} from "../model/variable-memory";
import type {VariableFillOptions} from "../ui/variable-form";
import type {IMenuItem} from "siyuan";
import {prefetchSourceHealth} from "./kernel-health";
import type {XiaolvCommonPluginContext} from "./plugin-context";

export class DockAndSlashService {
    constructor(private readonly plugin: XiaolvCommonPluginContext) {}

    async promptVariableFill(options: VariableFillOptions): Promise<void> {
        try {
            const {openVariableFillCard} = await import(/* webpackChunkName: "variable-form" */ "../ui/variable-form");
            openVariableFillCard(options);
        } catch (err) {
            this.plugin.notify("error", (this.plugin.i18nFn()("dynamicLoadFailed") || "加载变量卡片失败") + ": " + toErrorMessage(err));
        }
    }

    async mountDockView(element: HTMLElement): Promise<DockView | null> {
        this.plugin.dockView?.destroy();
        try {
            const {DockView} = await import(/* webpackChunkName: "dock-view" */ "../ui/dock-view");
            if (this.plugin.unloading) return null;
            this.plugin.dockView = new DockView(element, this.buildDockDeps());
            return this.plugin.dockView;
        } catch (err) {
            this.plugin.notify("error", (this.plugin.i18nFn()("dynamicLoadFailed") || "加载侧栏视图失败") + ": " + toErrorMessage(err));
            return null;
        }
    }

    handleToolbarClick(): void {
        const selectedText = typeof window !== "undefined" ? window.getSelection()?.toString().trim() : "";
        if (selectedText) {
            if (selectedText.length > 120 || selectedText.includes("\n")) {
                void this.plugin.captureCoordinator.saveSelection();
            } else {
                this.plugin.openSearch(undefined, selectedText);
            }
        } else {
            this.plugin.openSearch();
        }
    }

    updateProtyleToolbar(toolbar: Array<string | IMenuItem>): Array<string | IMenuItem> {
        try {
            if (toolbar.some((item) => typeof item === "object" && item && (item as any).name === "xiaolv-common-toolbar")) {
                return toolbar;
            }
            return [...toolbar, {
                name: "xiaolv-common-toolbar",
                icon: "iconXlcCommon",
                tip: this.plugin.i18nFn()("openSearch"),
                click: () => this.handleToolbarClick(),
            }];
        } catch {
            return toolbar;
        }
    }

    async runDockItemAction(
        itemId: string,
        mode: InsertMode,
        fills?: Record<string, string>,
    ): Promise<{ok: boolean; message: string}> {
        const got = await this.plugin.library.getItem(itemId);
        if (!got.ok) return {ok: false, message: got.message};
        const item = got.data;
        if (!fills && mode !== "insert-ref" && mode !== "insert-embed" && this.plugin.state.insert.promptVariables && item.itemType !== "code") {
            const kd = await this.plugin.library.getItemKramdown(item);
            if (kd.ok) {
                const expanded = await this.plugin.library.expandSnippetRefs(kd.data);
                const fields = listAskFields(expanded);
                if (fields.length > 0) {
                    const labels = fields.map((f: any) => f.name);
                    return new Promise((resolve) => {
                        let settled = false;
                        const finish = (res: {ok: boolean; message: string}) => {
                            if (settled) return;
                            settled = true;
                            resolve(res);
                        };
                        void this.promptVariableFill({
                            t: this.plugin.i18nFn(),
                            itemType: item.itemType,
                            title: item.title,
                            fields,
                            defaults: collectDefaults(this.plugin.state.variableMemory, labels),
                            templateText: expanded,
                            itemId: item.id,
                            onConfirm: (filled: any) => {
                                try {
                                    this.plugin.state.variableMemory = rememberValues(this.plugin.state.variableMemory, filled, Date.now());
                                    this.plugin.persistSoon();
                                } catch {}
                                void this.runDockItemAction(itemId, mode, filled).then(finish);
                            },
                            onCopy: async (filled: any) => {
                                try {
                                    this.plugin.state.variableMemory = rememberValues(this.plugin.state.variableMemory, filled, Date.now());
                                    this.plugin.persistSoon();
                                } catch {}
                                const copied = await this.runDockItemAction(itemId, "copy", filled);
                                finish(copied);
                                return copied.ok;
                            },
                            onCancel: () => finish({ok: false, message: ""}),
                        });
                    });
                }
            }
        }
        const receipt = await this.plugin.executor.run(item, mode, fills ? {fills} : undefined);
        const msg = receipt.ok
            ? this.plugin.receiptText(receipt.message, item.title, receipt.pendingVerification)
            : receipt.message;
        if (receipt.ok) {
            this.plugin.recordUsage(item.id);
            this.plugin.service.touchRecent(item.id);
            this.plugin.notify("info", msg);
            this.plugin.notifyExternalDataChange();
        } else {
            this.plugin.notify("error", msg);
        }
        return {ok: receipt.ok, message: msg};
    }

    async quickInsertById(itemId: string): Promise<boolean> {
        if (!this.plugin.library || !this.plugin.executor) return false;
        const got = await this.plugin.library.getItem(itemId);
        if (!got.ok) {
            this.plugin.notify("error", got.message);
            return false;
        }
        const item = got.data;
        if (this.plugin.state?.insert?.promptVariables && item.itemType !== "code") {
            const kd = await this.plugin.library.getItemKramdown(item);
            if (!kd.ok) {
                this.plugin.notify("error", kd.message);
                return false;
            }
            const expanded = await this.plugin.library.expandSnippetRefs(kd.data);
            const fields = listAskFields(expanded);
            if (fields.length > 0) {
                void this.promptVariableFill({
                    t: this.plugin.i18nFn(),
                    itemType: item.itemType,
                    title: item.title,
                    itemId: item.id,
                    templateText: expanded,
                    fields,
                    defaults: collectDefaults(this.plugin.state.variableMemory, fields.map((f: any) => f.name)),
                    onConfirm: async (fills: Record<string, string>) => {
                        try {
                            this.plugin.state.variableMemory = rememberValues(this.plugin.state.variableMemory, fills, Date.now());
                            this.plugin.persistSoon();
                        } catch {}
                        const receipt = await this.plugin.executor.run(item, "insert", {fills});
                        if (receipt.ok) {
                            this.plugin.recordUsage(item.id);
                            this.plugin.service.touchRecent(item.id);
                            this.plugin.notify("info", this.plugin.receiptText(receipt.message, item.title, receipt.pendingVerification));
                            this.plugin.notifyExternalDataChange();
                        } else {
                            this.plugin.notify("error", receipt.message);
                        }
                    },
                    onCopy: async (fills: Record<string, string>) => {
                        try {
                            this.plugin.state.variableMemory = rememberValues(this.plugin.state.variableMemory, fills, Date.now());
                            this.plugin.persistSoon();
                        } catch {}
                        const receipt = await this.plugin.executor.run(item, "copy", {fills});
                        if (receipt.ok) {
                            this.plugin.recordUsage(item.id);
                            this.plugin.service.touchRecent(item.id);
                            this.plugin.notify("info", this.plugin.receiptText(receipt.message, item.title, receipt.pendingVerification));
                        } else {
                            this.plugin.notify("error", receipt.message);
                        }
                    },
                });
                return true;
            }
        }

        const receipt = await this.plugin.executor.run(item, "insert");
        if (receipt.ok) {
            this.plugin.recordUsage(item.id);
            this.plugin.service.touchRecent(item.id);
            this.plugin.notify("info", this.plugin.receiptText(receipt.message, item.title, receipt.pendingVerification));
            this.plugin.notifyExternalDataChange();
            return true;
        } else {
            this.plugin.notify("error", receipt.message);
            return false;
        }
    }

    buildDockDeps(): DockViewDeps {
        return {
            t: this.plugin.i18nFn(),
            notify: (k: any, m: any) => this.plugin.notify(k, m),
            search: async (query: any) => {
                if (!this.plugin.library) return {entries: [], truncated: false, total: 0};
                const loading = !this.plugin.library.getIndex();
                const idx = await this.plugin.library.ensureIndex(5 * 60_000);
                const results = searchEntries(idx.entries, query, this.plugin.searchContext());
                const entries = results.map((r: any) => r.entry);
                void prefetchSourceHealth(this.plugin, entries);
                const error = entries.length === 0 && idx.errors.length > 0 ? idx.errors[0] : undefined;
                return {entries, truncated: idx.truncated, total: idx.entries.length, loading, error};
            },
            preview: async (itemId: string) => {
                return this.plugin.searchCoordinator.getPreview(itemId, async () => {
                    const got = await this.plugin.library.getItem(itemId);
                    if (!got.ok) return "";
                    const kd = await this.plugin.library.getItemKramdown(got.data);
                    return kd.ok ? await this.plugin.library.expandSnippetRefs(kd.data) : "";
                });
            },
            runAction: async (itemId: string, mode: any) => this.runDockItemAction(itemId, mode),
            runActionWithFills: async (itemId: string, mode: any, fills: any) => this.runDockItemAction(itemId, mode, fills),
            toggleFavorite: (itemId: string) => {
                const fav = this.plugin.service.toggleFavorite(itemId);
                this.plugin.notifyExternalDataChange();
                return fav;
            },
            isFavorite: (itemId: string) => this.plugin.state.favorites.includes(itemId),
            copyText: async (text: string) => {
                const html = isMarkdownFormattingPresent(text) ? renderSafeHtmlFromMarkdown(text) : undefined;
                return this.plugin.host.writeClipboard(text, html);
            },
            copyProviderPayload: async (text: string) => {
                const html = isMarkdownFormattingPresent(text) ? renderSafeHtmlFromMarkdown(text) : undefined;
                return this.plugin.host.writeClipboard(text, html);
            },
            openSource: async (itemId: string) => {
                const res = await this.plugin.service.openSource(itemId);
                return {ok: res.ok, message: res.message ?? ""};
            },
            newItem: (initialTitle?: string) => void this.plugin.captureCoordinator.newManual(initialTitle),
            openSettings: () => this.plugin.openSetting(),
            openLibraryDoc: () => {
                this.plugin.openLibraryDocument();
            },
            adoptLibraryBlocks: async () => {
                const res = await this.plugin.library.adoptUnmanagedLibraryBlocks();
                if (res.ok && res.data.adopted > 0) {
                    this.plugin.notify("info", `已自动纳管库文档中手写的 ${res.data.adopted} 个新块`);
                }
            },
            getUsage: () => this.plugin.state.usage,
            isSourceMissing: (entry: any) => {
                const block = entry.sourceBlockId;
                const doc = entry.sourceDocId;
                return (!!block && this.plugin.missingSources.has(block)) || (!!doc && this.plugin.missingSources.has(doc) && !entry.sourceBlockId);
            },
            hasActiveEditor: () => this.plugin.host.hasActiveEditor(),
            editItem: async (itemId: string) => {
                const got = await this.plugin.library.getItem(itemId);
                if (!got.ok) {
                    this.plugin.notify("error", got.message);
                    return;
                }
                this.plugin.openEditDialog(got.data);
            },
            getCustomOrder: () => this.plugin.state.customItemOrder ?? {},
            setCustomOrder: (ord: any) => {
                this.plugin.state.customItemOrder = ord;
                this.plugin.persistSoon();
            },
        };
    }

    syncLaunchpadRegistry(): void {
        try {
            const count = this.plugin.library?.getIndex()?.items?.size;
            const badge = count !== undefined ? `${count} 项` : "已就绪";
            this.plugin.launchpadCleaner = lvLaunchpad.register({
                id: "xiaolv-common",
                name: "常用",
                fullName: "小驴常用",
                svgIcon: "iconLvCommon",
                color: "#14b8a6",
                desc: "常用片段 · 宏模版",
                digit: 8,
                badge,
                badgeType: "primary",
                badgeProvider: () => {
                    const c = this.plugin.library?.getIndex()?.items?.size;
                    return c !== undefined ? `${c} 项` : "已就绪";
                },
                actions: ["打开片段搜索", "复制置顶片段", "从剪贴板保存片段", "查看剪贴板历史"],
                topBarElement: this.plugin.topBarElement,
                onClick: () => this.plugin.openCommonPanel(),
                onAction: (action: string) => this.plugin.handleQuickAction(action),
            });
        } catch {}
    }

    async updateProtyleSlash(allowBuild: boolean = false): Promise<void> {
        const baseSlash = [
            {
                filter: ["常用", "常用语", "xiaolv", "cy", "changyong", "xlc", "snippet", "snippets"],
                html: `<div class=\"b3-list-item__first\"><span class=\"b3-list-item__text\">${this.plugin.i18nFn()("openSearch") || "小驴常用：搜索与插入常用语"}</span><span class=\"b3-list-item__meta\">⌥⇧A</span></div>`,
                id: "xiaolv-common-slash-search",
                callback: (protyle: any) => {
                    this.plugin.host?.recordActiveEditor(protyle);
                    this.plugin.openSearch();
                },
            },
            {
                filter: ["剪贴板历史", "剪贴板", "jtb", "clip", "clipboard", "lsjtb"],
                html: `<div class=\"b3-list-item__first\"><span class=\"b3-list-item__text\">${this.plugin.i18nFn()("openClipboardHistory") || "小驴常用：查看剪贴板历史"}</span><span class=\"b3-list-item__meta\">⌥⇧H</span></div>`,
                id: "xiaolv-common-slash-clip-history",
                callback: (protyle: any) => {
                    this.plugin.host?.recordActiveEditor(protyle);
                    this.plugin.openSearch(undefined, undefined, undefined, undefined, "clipboard");
                },
            },
            {
                filter: ["新建常用", "新建常用语", "xjcy", "new-snippet"],
                html: `<div class=\"b3-list-item__first\"><span class=\"b3-list-item__text\">${this.plugin.i18nFn()("newItem") || "小驴常用：新建常用语"}</span><span class=\"b3-list-item__meta\">⌥⇧N</span></div>`,
                id: "xiaolv-common-slash-new",
                callback: (protyle: any) => {
                    this.plugin.host?.recordActiveEditor(protyle);
                    void this.plugin.captureCoordinator.newManual();
                },
            },
            {
                filter: ["快速保存剪贴板", "保存剪贴板", "ksbz", "jtb", "quick-clip"],
                html: `<div class=\"b3-list-item__first\"><span class=\"b3-list-item__text\">${this.plugin.i18nFn()("quickCapture") || "小驴常用：从剪贴板快速保存"}</span><span class=\"b3-list-item__meta\">⌥⇧V</span></div>`,
                id: "xiaolv-common-slash-clip",
                callback: (protyle: any) => {
                    this.plugin.host?.recordActiveEditor(protyle);
                    void this.plugin.captureCoordinator.quickCaptureFromClipboard();
                },
            },
        ];

        if (!this.plugin.library) {
            this.plugin.protyleSlash = baseSlash;
            return;
        }

        try {
            const idx = this.plugin.library.getIndex() ?? (allowBuild ? await this.plugin.library.ensureIndex(60_000) : null);
            if (!idx) {
                if (!Array.isArray(this.plugin.protyleSlash) || this.plugin.protyleSlash.length === 0) {
                    this.plugin.protyleSlash = baseSlash;
                }
                return;
            }
            const dynamicSlash: typeof baseSlash = [];
            const safeEscape = (s: string) => (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");

            const candidateEntries = (idx.entries || []).filter((e: any) => {
                const u = this.plugin.state.usage[e.id];
                const count = typeof u === "number" ? u : (u?.count ?? 0);
                return Boolean(e.shortcode || e.alias || count > 0 || this.plugin.state.favorites.includes(e.id));
            }).slice(0, 60);

            for (const entry of candidateEntries) {
                const filters = new Set<string>();
                if (entry.shortcode) {
                    const cleanSc = entry.shortcode.replace(/^[:;；]/, "").trim().toLowerCase();
                    if (cleanSc) filters.add(cleanSc);
                }
                if (entry.alias) {
                    const cleanAl = entry.alias.trim().toLowerCase();
                    if (cleanAl) filters.add(cleanAl);
                }
                if (entry.title) {
                    const cleanTi = entry.title.trim().toLowerCase();
                    if (cleanTi && cleanTi.length <= 15) filters.add(cleanTi);
                }
                if (filters.size === 0) continue;

                const badge = entry.shortcode ? safeEscape(entry.shortcode) : (entry.alias ? `@${safeEscape(entry.alias)}` : "常用");
                dynamicSlash.push({
                    filter: Array.from(filters),
                    html: `<div class=\"b3-list-item__first\"><span class=\"b3-list-item__text\">${safeEscape(entry.title || "未命名常用语")}</span><span class=\"b3-list-item__meta\">${badge}</span></div>`,
                    id: `xiaolv-common-slash-${entry.id}`,
                    callback: (protyle: any) => {
                        this.plugin.host?.recordActiveEditor(protyle);
                        void this.plugin.quickInsertById(entry.id);
                    },
                });
            }

            this.plugin.protyleSlash = [...baseSlash, ...dynamicSlash];
        } catch {
            if (!Array.isArray(this.plugin.protyleSlash) || this.plugin.protyleSlash.length === 0) {
                this.plugin.protyleSlash = baseSlash;
            }
        }
    }
}
