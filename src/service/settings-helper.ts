// 设置中心与编辑弹窗助手（SettingsHelper · S10）
import {Dialog} from "siyuan";
import {adaptSecondaryDialogForMobile, getDialogBody, isMobileDialogViewport, mountPlatformDialogTitleWrap} from "../ui/dialog-dom";
import {CommonItem, cleanShortcode, isBlockId, isSafeHttpUrl} from "../model/item";
import {LibraryConfig} from "../model/storage";
import {SettingsUiContext} from "../ui/settings-dialog";
import {LIMITS, STORAGE_KEYS} from "../constants";
import {toErrorMessage} from "../model/errors";
import {formatAiError} from "./ai";
import type {XiaolvCommonPluginContext} from "./plugin-context";

function shortTitle(title: string): string {
    return title.length > 48 ? `${title.slice(0, 48)}…` : title;
}

export class SettingsHelper {
    private readonly activeEditDialogs = new Set<Dialog>();
    private closeSettingsDialogsFn: (() => void) | null = null;

    constructor(private readonly plugin: XiaolvCommonPluginContext) {}

    public closeAllDialogs(): void {
        try {
            this.closeSettingsDialogsFn?.();
        } catch {
            // ignore
        }
        for (const dlg of Array.from(this.activeEditDialogs)) {
            this.activeEditDialogs.delete(dlg);
            try {
                dlg.destroy();
            } catch {
                // ignore
            }
        }
    }

    settingsContext(): SettingsUiContext {
        return {
            t: this.plugin.i18nFn(),
            state: this.plugin.state,
            getConfig: () => this.plugin.config,
            library: this.plugin.library,
            ai: this.plugin.ai,
            registry: this.plugin.registry,
            notify: this.plugin.notify,
            applyConfig: (config: any) => this.applyConfig(config),
            persistSoon: () => this.plugin.persistSoon(),
            exportBundle: () => this.plugin.exportBundle(),
            importBundleText: (text: string, policy: any) => this.plugin.importBundleText(text, policy),
            importMarkdownItems: (items: any, policy: any) => this.plugin.importMarkdownItems(items, policy),
            fetchAssetBytes: (path: string) => this.fetchAssetBytes(path),
            aiErrorText: (err: any) => formatAiError(err, this.plugin.i18nFn()),
            applyPinyinAdapter: () => this.plugin.applyPinyinAdapter(),
            refreshSearch: () => this.plugin.notifyExternalDataChange(),
            openLibraryDoc: () => {
                this.plugin.openLibraryDocument();
            },
            getSavedDiscoveryViews: () => this.plugin.state.search.savedDiscoveryViews ?? [],
            openSavedDiscoveryView: (view: any) => this.plugin.openSavedDiscoveryView(view),
            deleteSavedDiscoveryView: (id: string) => this.plugin.deleteSavedDiscoveryView(id),
        };
    }

    openSetup(): void {
        const context = this.settingsContext();
        void import(/* webpackChunkName: "settings-dialog" */ "../ui/settings-dialog").then(({openSetupDialog, closeAllSettingsDialogs}) => {
            this.closeSettingsDialogsFn = closeAllSettingsDialogs;
            openSetupDialog(context, {
                onConfigured: () => {
                    this.plugin.openSearch();
                },
            });
        }).catch((err: unknown) => {
            this.plugin.notify("error", this.plugin.i18nFn()("startupFailed", toErrorMessage(err)));
        });
    }

    openSetting(): void {
        this.openSettings();
    }

    openSettings(): void {
        const context = this.settingsContext();
        void import(/* webpackChunkName: "settings-dialog" */ "../ui/settings-dialog").then(({openSettingsDialog, closeAllSettingsDialogs}) => {
            this.closeSettingsDialogsFn = closeAllSettingsDialogs;
            openSettingsDialog(context);
        }).catch((err: unknown) => {
            this.plugin.notify("error", this.plugin.i18nFn()("startupFailed", toErrorMessage(err)));
        });
    }

    async fetchAssetBytes(assetPath: string): Promise<Uint8Array | null> {
        const rel = assetPath.startsWith("assets/") ? assetPath.slice("assets/".length) : "";
        const safe = !!rel && !assetPath.includes("..") && !assetPath.includes("\\") && rel.split("/").every((part) => part.length > 0);
        if (!safe) return null;
        try {
            const res = await fetch(`/api/file/getFile?path=${encodeURIComponent(assetPath)}`);
            if (!res.ok) return null;
            return new Uint8Array(await res.arrayBuffer());
        } catch {
            return null;
        }
    }

    applyConfig(config: LibraryConfig): void {
        this.plugin.config = config;
        this.plugin.library.setConfig(config);
        this.plugin.invalidatePreviewCache();
        this.plugin.persistSidecar(STORAGE_KEYS.config, config);
        this.plugin.notifyExternalDataChange();
        void this.plugin.library.reindex().then((idx: any) => {
            this.plugin.notifyExternalDataChange();
            this.plugin.notify("info", idx.truncated
                ? this.plugin.i18nFn()("reindexTruncated", String(LIMITS.maxItems))
                : this.plugin.i18nFn()("reindexDone", String(idx.entries.length)));
        }).catch((err: any) => this.plugin.notify("error", this.plugin.i18nFn()("kernelError", toErrorMessage(err))));
    }

    async openEditDialog(item: CommonItem): Promise<void> {
        const t = this.plugin.i18nFn();
        const kd = await this.plugin.library.getStoredItemKramdown(item);
        const initialKramdown = kd.ok ? kd.data : "";
        const isMobileModal = isMobileDialogViewport();
        const dialogTitle = `${t("edit")} · ${(item.title || t("unknownType")).slice(0, 24)}${item.title.length > 24 ? "…" : ""}`;
        let vvCleanup: (() => void) | undefined;
        const dialog = new Dialog({
            title: dialogTitle,
            content: "",
            width: isMobileModal ? "100vw" : "min(620px, 92vw)",
            height: isMobileModal ? "100dvh" : "min(860px, 92vh)",
            destroyCallback: () => {
                this.activeEditDialogs.delete(dialog);
                vvCleanup?.();
                vvCleanup = undefined;
            },
        });
        this.activeEditDialogs.add(dialog);
        dialog.element.querySelector(".b3-dialog__container")?.classList.add("xlc-form-host");
        if (isMobileModal && typeof window !== "undefined" && window.visualViewport) {
            const vv = window.visualViewport;
            let baseHeight = Math.max(window.innerHeight || 0, Math.round(vv.height || 0));
            const syncKeyboardViewport = () => {
                if (!dialog.element?.isConnected) return;
                const currentInner = window.innerHeight || 0;
                const currentH = Math.round(vv.height || currentInner);
                if (currentH > baseHeight) baseHeight = currentH;
                dialog.element.style.setProperty("--lv-vv-h", `${currentH}px`);
                const keyboardOpen = Math.max(baseHeight, currentInner) - currentH > 110;
                dialog.element.classList.toggle("lv-keyboard-open", keyboardOpen);
            };
            syncKeyboardViewport();
            vv.addEventListener("resize", syncKeyboardViewport);
            vv.addEventListener("scroll", syncKeyboardViewport, {passive: true});
            window.addEventListener("resize", syncKeyboardViewport, {passive: true});
            vvCleanup = () => {
                vv.removeEventListener("resize", syncKeyboardViewport);
                vv.removeEventListener("scroll", syncKeyboardViewport);
                window.removeEventListener("resize", syncKeyboardViewport);
            };
        }
        dialog.element.addEventListener("click", (e) => {
            if (e.target === dialog.element || (e.target as HTMLElement).classList?.contains("b3-dialog__scrim")) {
                dialog.destroy();
            }
        });
        mountPlatformDialogTitleWrap(dialog.element, dialogTitle);
        adaptSecondaryDialogForMobile(dialog, t("close"));
        const body = getDialogBody(dialog.element);
        if (!body) return;
        body.innerHTML = "";
        const form = document.createElement("div");
        form.className = "xlc-form";
        let fieldIdx = 0;
        const mkField = (label: string, value: string, controlId?: string): HTMLInputElement => {
            const wrap = document.createElement("label");
            wrap.className = "xlc-form-field";
            const inputId = `xlc-edit-field-${++fieldIdx}`;
            wrap.htmlFor = inputId;
            const cap = document.createElement("span");
            cap.className = "xlc-form-label";
            cap.textContent = label;
            wrap.appendChild(cap);
            const input = document.createElement("input");
            input.id = inputId;
            input.className = "b3-text-field";
            input.setAttribute("aria-label", label);
            if (controlId) input.dataset.xlcControl = controlId;
            input.value = value;
            wrap.appendChild(input);
            form.appendChild(wrap);
            return input;
        };
        const titleEl = mkField(t("title"), item.title, "edit.title");
        const aliasEl = mkField(t("alias"), item.alias, "edit.alias");
        const shortcodeEl = mkField(t("shortcode") || "简码 (:shortcode)", item.shortcode ?? "", "edit.shortcode");
        shortcodeEl.placeholder = t("shortcodePlaceholder") || "如 :wk、:bug（选填，搜索框输入即置顶直达）";
        const tagsEl = mkField(t("tags"), item.tags.join(", "), "edit.tags");
        const categoryEl = mkField(t("category"), item.category, "edit.category");

        const contentWrap = document.createElement("label");
        contentWrap.className = "xlc-form-field";
        contentWrap.htmlFor = "xlc-edit-field-content";
        const contentCap = document.createElement("span");
        contentCap.className = "xlc-form-label";
        contentCap.textContent = t("editContentLabel");
        contentWrap.appendChild(contentCap);
        const contentEl = document.createElement("textarea");
        contentEl.id = "xlc-edit-field-content";
        contentEl.className = "b3-text-field";
        contentEl.dataset.xlcControl = "edit.content";
        contentEl.setAttribute("aria-label", t("editContentLabel"));
        contentEl.rows = 8;
        contentEl.value = initialKramdown;
        contentEl.addEventListener("input", () => contentEl.classList.remove("xlc-input--error"));
        contentWrap.appendChild(contentEl);
        form.appendChild(contentWrap);

        void import(/* webpackChunkName: "variable-form" */ "../ui/variable-form").then(({buildVariableBar}) => {
            contentWrap.after(buildVariableBar(t, () => contentEl));
        }).catch(() => undefined);

        const srcRow = document.createElement("div");
        srcRow.className = "xlc-form-sourcerow";
        const srcText = document.createElement("span");
        srcText.textContent = item.source.sourceDocId
            ? t("sourceWithId", item.source.sourceDocId + (item.source.sourceBlockId ? t("sourceBlockSuffix", item.source.sourceBlockId) : ""))
            : t("sourceMissing");
        srcRow.appendChild(srcText);

        if (item.source.sourceDocId) {
            void this.plugin.library.getDocPath(item.source.sourceDocId).then((path: string) => {
                if (path) srcText.textContent = t("sourceWithId", path + (item.source.sourceBlockId ? t("sourceBlockSuffix", item.source.sourceBlockId) : ""));
            }).catch(() => undefined);
        }
        const relinkBtn = document.createElement("button");
        relinkBtn.type = "button";
        relinkBtn.className = "b3-button b3-button--text xlc-form-ai";
        relinkBtn.textContent = t("relinkCurrent");
        relinkBtn.addEventListener("click", () => {
            const docId = this.plugin.host.currentDocId();
            if (!docId) {
                this.plugin.notify("error", t("relinkNoDoc"));
                return;
            }
            void this.plugin.library.relinkSource(item.id, {sourceDocId: docId}).then((result: any) => {
                if (result.ok) {
                    this.plugin.invalidatePreviewCache([item.id]);
                    this.plugin.notify("info", t("relinkDone"));
                    void this.plugin.library.getDocPath(docId).then((path: string) => {
                        srcText.textContent = path ? t("sourceWithId", path) : t("sourceWithId", docId);
                    }).catch(() => undefined);
                } else {
                    this.plugin.notify("error", result.message);
                }
            }).catch((err: any) => this.plugin.notify("error", t("kernelError", toErrorMessage(err))));
        });
        srcRow.appendChild(relinkBtn);
        if (item.source.sourceDocId || item.source.sourceBlockId) {
            const clearBtn = document.createElement("button");
            clearBtn.type = "button";
            clearBtn.className = "b3-button b3-button--text xlc-form-ai";
            clearBtn.textContent = t("clearSource");
            clearBtn.addEventListener("click", () => {
                void this.plugin.library.clearSource(item.id).then((result: any) => {
                    if (result.ok) {
                        this.plugin.invalidatePreviewCache([item.id]);
                        this.plugin.notify("info", t("clearSourceDone"));
                        srcText.textContent = t("sourceMissing");
                    } else {
                        this.plugin.notify("error", result.message);
                    }
                }).catch((err: any) => this.plugin.notify("error", t("kernelError", toErrorMessage(err))));
            });
            srcRow.appendChild(clearBtn);
        }
        if (isBlockId(item.blockId)) {
            const openLibBlockBtn = document.createElement("button");
            openLibBlockBtn.type = "button";
            openLibBlockBtn.className = "b3-button b3-button--text xlc-form-ai";
            openLibBlockBtn.dataset.xlcControl = "edit.open-lib-block";
            openLibBlockBtn.textContent = "📦 在思源中定位此块";
            openLibBlockBtn.title = "关闭弹窗并在思源笔记编辑器中直接打开定位该条目所在的真实块";
            openLibBlockBtn.addEventListener("click", () => {
                dialog.destroy();
                this.plugin.host.openDoc(item.libraryDocId, item.blockId);
            });
            srcRow.appendChild(openLibBlockBtn);
        }
        if (isBlockId(item.source.sourceBlockId) && item.source.sourceBlockId !== item.blockId) {
            const pullSourceBtn = document.createElement("button");
            pullSourceBtn.type = "button";
            pullSourceBtn.className = "b3-button b3-button--text xlc-form-ai";
            pullSourceBtn.dataset.xlcControl = "edit.pull-source";
            pullSourceBtn.textContent = "↻ 从原块拉取";
            pullSourceBtn.title = "从关联的思源来源块拉取最新内容填入编辑框";
            pullSourceBtn.addEventListener("click", () => {
                void this.plugin.library.pullFromSourceBlock(item.id).then((res: any) => {
                    if (res.ok) {
                        contentEl.value = res.data.markdown;
                        tagsEl.value = res.data.item.tags.join(", ");
                        this.plugin.invalidatePreviewCache([item.id]);
                        this.plugin.notifyExternalDataChange();
                        this.plugin.notify("info", "已从思源来源块拉取最新内容");
                    } else {
                        this.plugin.notify("error", res.message);
                    }
                });
            });
            srcRow.appendChild(pullSourceBtn);
        }
        form.appendChild(srcRow);
        const actions = document.createElement("div");
        actions.className = "xlc-form-actions";
        const cancel = document.createElement("button");
        cancel.type = "button";
        cancel.className = "b3-button";
        cancel.textContent = t("cancel");
        cancel.addEventListener("click", () => dialog.destroy());
        const save = document.createElement("button");
        save.type = "button";
        save.className = "b3-button xlc-btn-primary";
        save.textContent = t("save");

        const submitOnEnter = (el: HTMLInputElement): void => {
            el.addEventListener("keydown", (ev) => {
                if (ev.isComposing || ev.keyCode === 229) return;
                if (ev.key === "Enter" && !ev.altKey && !ev.ctrlKey && !ev.metaKey) {
                    ev.preventDefault();
                    save.click();
                }
            });
        };
        [titleEl, aliasEl, shortcodeEl, tagsEl, categoryEl].forEach((el) => submitOnEnter(el));

        let saving = false;
        save.addEventListener("click", () => {
            if (saving) return;
            if (!contentEl.value.trim()) {
                contentEl.classList.add("xlc-input--error");
                contentEl.focus();
                this.plugin.notify("error", t("invalidItem"));
                return;
            }
            if (item.itemType === "url" && !isSafeHttpUrl(contentEl.value.trim())) {
                contentEl.classList.add("xlc-input--error");
                contentEl.focus();
                this.plugin.notify("error", t("invalidItem"));
                return;
            }
            saving = true;
            save.disabled = true;
            save.textContent = t("saving");
            cancel.disabled = true;
            const rawShortcode = shortcodeEl.value.trim();
            const resolvedShortcode = rawShortcode
                ? cleanShortcode(rawShortcode)
                : (aliasEl.value.trim().startsWith(":") ? cleanShortcode(aliasEl.value.trim()) : "");
            void this.plugin.library.updateItem(item.id, {
                title: titleEl.value,
                alias: aliasEl.value,
                shortcode: resolvedShortcode,
                tags: tagsEl.value.split(/[,，、;；\s]+/).map((s) => s.trim()).filter(Boolean),
                category: categoryEl.value,
                markdown: contentEl.value !== initialKramdown ? contentEl.value : undefined,
                url: item.itemType === "url" ? contentEl.value.trim() : undefined,
            }).then((result: any) => {
                if (result.ok) {
                    this.plugin.invalidatePreviewCache([item.id]);
                    this.plugin.notify("info", t("updated", shortTitle(result.data.item.title)));
                    this.plugin.notifyExternalDataChange();
                    dialog.destroy();
                } else {
                    saving = false;
                    save.disabled = false;
                    save.textContent = t("save");
                    cancel.disabled = false;
                    this.plugin.notify("error", result.message);
                }
            }).catch((err: any) => {
                saving = false;
                save.disabled = false;
                save.textContent = t("save");
                cancel.disabled = false;
                this.plugin.notify("error", t("kernelError", toErrorMessage(err)));
            });
        });
        actions.appendChild(cancel);
        actions.appendChild(save);
        form.appendChild(actions);
        body.appendChild(form);
    }
}
