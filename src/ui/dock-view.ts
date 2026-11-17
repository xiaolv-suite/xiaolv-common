/**
 * 小驴常用 · 侧边栏 (Dock) 原生视图控制器
 * 针对 240px ~ 360px 单列纵向空间定制的高密度常驻资产货架：
 * 1. 紧凑顶栏：标题、新建 (+)、刷新 (↺)、设置 (⚙)
 * 2. 紧凑搜索栏：拼音/首字母实时过滤、清空按钮
 * 3. 快速过滤 Chips：全部、常用、最近、★收藏
 * 4. 资产列表：类型色彩徽标、标题、别名、悬停快捷动作 (+ 插入、⧉ 复制、★ 收藏)
 * 5. 原生拖拽支持 (HTML5 Drag & Drop)：支持按住条目直接拖拽到思源编辑器任意段落落块
 * 6. 底部微型抽屉：选中条目即时轻量预览与主操作
 */

import {SearchEntry, SearchQuery, findExactAliasMatch, findExactShortcodeMatch} from "../model/search";
import {InsertMode} from "../model/actions";
import {toErrorMessage} from "../model/errors";
import {lvNotify, lvSurfaceStack} from "../libs/lv-notice-kit";
import {hasDynamicMacros, expandMacroPreview} from "../model/variables";
import {renderSafePreview, renderDualMacroPreview} from "./preview-renderer";
import {parseSnippetAnnotations} from "../model/item";
import {buildHierarchyTree, HierarchyNode} from "../model/hierarchy";
import {applyCustomOrder, reorderItem} from "../model/storage";

function escapeDockHtml(raw: string): string {
    return String(raw ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export interface DockViewDeps {
    t: (key: string, ...args: string[]) => string;
    notify?: (kind: "info" | "error", message: string) => void;
    search: (query: SearchQuery) => Promise<{entries: SearchEntry[]; truncated: boolean; total: number; loading?: boolean; error?: string}>;
    preview: (itemId: string) => Promise<string>;
    runAction: (itemId: string, mode: InsertMode) => Promise<{ok: boolean; message: string}>;
    runActionWithFills: (itemId: string, mode: InsertMode, fills?: Record<string, string>) => Promise<{ok: boolean; message: string}>;
    toggleFavorite: (itemId: string) => boolean;
    isFavorite: (itemId: string) => boolean;
    copyText: (text: string) => Promise<boolean>;
    copyProviderPayload: (text: string) => Promise<boolean>;
    openSource: (itemId: string) => Promise<{ok: boolean; message: string}>;
    newItem: (initialTitle?: string) => void;
    openSettings?: () => void;
    openLibraryDoc?: () => void;
    adoptLibraryBlocks?: () => Promise<void>;
    getUsage?: () => Record<string, {count: number; lastAt?: number}>;
    isSourceMissing: (entry: SearchEntry) => boolean;
    hasActiveEditor?: () => boolean;
    editItem?: (itemId: string) => Promise<void>;
    /** 获取条目手动自定义排序权重（CAND-014 / TODO-FEAT-013） */
    getCustomOrder?: () => Record<string, number>;
    setCustomOrder?: (order: Record<string, number>) => void;
}

export class DockView {
    private container: HTMLElement;
    private deps: DockViewDeps;
    private currentScope: "all" | "common" | "recent" | "favorites" = "all";
    private results: SearchEntry[] = [];
    private activeIndex = -1;
    private searchSeq = 0;
    private debounceTimer: any = null;
    private isDestroyed = false;
    // 跨实例与跨重构记忆用户分类折叠偏好
    private static sharedCollapsedCategories = new Set<string>();
    private collapsedCategories: Set<string>;
    private activeMenuEl: HTMLElement | null = null;
    private menuCleanup: (() => void) | null = null;
    private fullBodyCache = new Map<string, string>();
    private setFullBodyCache(id: string, text: string): void {
        if (this.fullBodyCache.size >= 200) {
            const oldest = this.fullBodyCache.keys().next().value;
            if (oldest) this.fullBodyCache.delete(oldest);
        }
        this.fullBodyCache.set(id, text);
    }
    private isInsertBusy = false;
    private isCopyBusy = false;
    /** 大纲组织模式：分类树 (category) 或 标签聚合 (tag) · CAND-004 / TODO-FEAT-004 */
    private groupBy: "category" | "tag" = "category";

    // DOM 引用
    private searchInput!: HTMLInputElement;
    private clearBtn!: HTMLButtonElement;
    private listContainer!: HTMLElement;
    private drawerContainer!: HTMLElement;
    private chipsContainer!: HTMLElement;
    private statusText!: HTMLElement;

    constructor(container: HTMLElement, deps: DockViewDeps) {
        this.container = container;
        this.deps = deps;
        this.collapsedCategories = DockView.sharedCollapsedCategories;
        this.buildLayout();
        void this.refresh();
    }

    public getCollapsedCategories(): string[] {
        return Array.from(this.collapsedCategories);
    }

    public setCategoryCollapsed(category: string, collapsed: boolean): void {
        if (collapsed) {
            this.collapsedCategories.add(category);
        } else {
            this.collapsedCategories.delete(category);
        }
        this.renderList();
    }

    private buildLayout(): void {
        this.container.innerHTML = "";
        this.container.classList.add("xlc-dock");

        // 1. 顶栏
        const head = document.createElement("div");
        head.className = "xlc-dock-head";

        const titleBox = document.createElement("div");
        titleBox.className = "xlc-dock-title";
        titleBox.innerHTML = `<span class="xlc-dock-icon" aria-hidden="true">🐴</span><strong>${escapeDockHtml(this.deps.t("pluginName") || "小驴常用")}</strong>`;
        head.appendChild(titleBox);

        const actions = document.createElement("div");
        actions.className = "xlc-dock-head-actions";
        if (typeof actions.setAttribute === "function") {
            actions.setAttribute("role", "toolbar");
            actions.setAttribute("aria-label", "侧栏快捷动作栏");
        }
        actions.addEventListener("keydown", (e) => {
            const buttons = Array.from(actions.querySelectorAll<HTMLButtonElement>("button")).filter((b) => !b.disabled);
            if (buttons.length <= 1) return;
            const curIdx = buttons.indexOf(document.activeElement as HTMLButtonElement);
            if (curIdx === -1) return;
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                buttons[(curIdx + 1) % buttons.length]?.focus();
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                buttons[(curIdx - 1 + buttons.length) % buttons.length]?.focus();
            } else if (e.key === "Home") {
                e.preventDefault();
                buttons[0]?.focus();
            } else if (e.key === "End") {
                e.preventDefault();
                buttons[buttons.length - 1]?.focus();
            }
        });

        const newBtn = document.createElement("button");
        newBtn.type = "button";
        newBtn.className = "b3-button b3-button--text xlc-dock-btn-icon";
        newBtn.title = (this.deps.t("newItemAction") || "新建常用语") + " (Alt+Shift+N)";
        if (typeof newBtn.setAttribute === "function") newBtn.setAttribute("aria-label", newBtn.title);
        newBtn.textContent = "＋";
        newBtn.addEventListener("click", () => this.deps.newItem());
        actions.appendChild(newBtn);

        const refreshBtn = document.createElement("button");
        refreshBtn.type = "button";
        refreshBtn.className = "b3-button b3-button--text xlc-dock-btn-icon";
        refreshBtn.title = this.deps.t("reindex") || "刷新内容库";
        if (typeof refreshBtn.setAttribute === "function") refreshBtn.setAttribute("aria-label", refreshBtn.title);
        refreshBtn.textContent = "↺";
        refreshBtn.addEventListener("click", () => {
            if (this.deps.adoptLibraryBlocks) {
                void this.deps.adoptLibraryBlocks().finally(() => void this.refresh());
            } else {
                void this.refresh();
            }
        });
        actions.appendChild(refreshBtn);

        if (this.deps.openLibraryDoc) {
            const libDocBtn = document.createElement("button");
            libDocBtn.type = "button";
            libDocBtn.className = "b3-button b3-button--text xlc-dock-btn-icon";
            libDocBtn.dataset.xlcDockAct = "open-lib-doc";
            libDocBtn.title = "在思源中打开常用库文档";
            if (typeof libDocBtn.setAttribute === "function") libDocBtn.setAttribute("aria-label", libDocBtn.title);
            libDocBtn.textContent = "📄";
            libDocBtn.addEventListener("click", () => this.deps.openLibraryDoc?.());
            actions.appendChild(libDocBtn);
        }

        if (this.deps.openSettings) {
            const gearBtn = document.createElement("button");
            gearBtn.type = "button";
            gearBtn.className = "b3-button b3-button--text xlc-dock-btn-icon";
            gearBtn.title = this.deps.t("openSettings") || "打开小驴常用设置";
            if (typeof gearBtn.setAttribute === "function") gearBtn.setAttribute("aria-label", gearBtn.title);
            gearBtn.textContent = "⚙";
            gearBtn.addEventListener("click", () => this.deps.openSettings?.());
            actions.appendChild(gearBtn);
        }

        const groupToggleBtn = document.createElement("button");
        groupToggleBtn.type = "button";
        groupToggleBtn.className = "b3-button b3-button--text xlc-dock-btn-icon";
        groupToggleBtn.dataset.xlcDockAct = "toggle-group-mode";
        groupToggleBtn.title = "切换组织模式：分类大纲 ↔ 标签聚合";
        if (typeof groupToggleBtn.setAttribute === "function") {
            groupToggleBtn.setAttribute("aria-label", "切换组织模式：分类大纲或标签聚合");
        }
        groupToggleBtn.textContent = this.groupBy === "category" ? "📁" : "🏷️";
        groupToggleBtn.addEventListener("click", () => {
            this.groupBy = this.groupBy === "category" ? "tag" : "category";
            groupToggleBtn.textContent = this.groupBy === "category" ? "📁" : "🏷️";
            this.renderList();
        });
        actions.appendChild(groupToggleBtn);
        head.appendChild(actions);
        this.container.appendChild(head);

        // 2. 紧凑搜索栏
        const searchBox = document.createElement("div");
        searchBox.className = "xlc-dock-search";

        const searchIcon = document.createElement("span");
        searchIcon.className = "xlc-dock-search-icon";
        if (typeof searchIcon.setAttribute === "function") {
            searchIcon.setAttribute("aria-hidden", "true");
        }
        searchIcon.textContent = "🔍";
        searchBox.appendChild(searchIcon);

        this.searchInput = document.createElement("input");
        this.searchInput.className = "b3-text-field xlc-dock-search-input";
        this.searchInput.placeholder = this.deps.t("searchPlaceholder") || "搜索常用语、拼音缩写...";
        if (typeof this.searchInput.setAttribute === "function") {
            this.searchInput.setAttribute("aria-label", this.deps.t("searchPlaceholder") || "搜索常用资产");
        }
        this.searchInput.addEventListener("input", () => {
            this.clearBtn.style.display = this.searchInput.value ? "inline-flex" : "none";
            if (this.debounceTimer) clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this.debounceTimer = null;
                void this.refresh();
            }, 180);
        });
        this.searchInput.addEventListener("keydown", (e) => {
            /* IME 合成期让路：ArrowUp/Down 属候选导航，Enter 属确认选字，误触会误插切片。 */
            if (e.isComposing || e.keyCode === 229) return;
            if (e.key === "ArrowDown") {
                e.preventDefault();
                if (this.results.length > 0) {
                    this.activeIndex = this.activeIndex < this.results.length - 1 ? this.activeIndex + 1 : 0;
                    this.updateActiveRow();
                    this.scrollToActiveRow();
                }
                return;
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                if (this.results.length > 0) {
                    this.activeIndex = this.activeIndex > 0 ? this.activeIndex - 1 : this.results.length - 1;
                    this.updateActiveRow();
                    this.scrollToActiveRow();
                }
                return;
            }
            if (e.key === "Tab" && !e.shiftKey) {
                const exactMatch = findExactShortcodeMatch(this.results, this.searchInput.value)
                    || findExactAliasMatch(this.results, this.searchInput.value);
                if (exactMatch && !this.isInsertBusy) {
                    e.preventDefault();
                    void this.insertEntry(exactMatch);
                    return;
                }
            }
            if (e.key === "Enter") {
                if (e.repeat) return;
                e.preventDefault();
                const target = (this.activeIndex >= 0 && this.results[this.activeIndex])
                    ? this.results[this.activeIndex]
                    : this.results[0];

                if (e.ctrlKey || e.metaKey) {
                    if (target) void this.copyEntry(target);
                } else {
                    if (target) {
                        void this.insertEntry(target);
                    } else if (this.searchInput.value.trim()) {
                        this.deps.newItem(this.searchInput.value.trim());
                    }
                }
            }
        });
        searchBox.appendChild(this.searchInput);

        this.clearBtn = document.createElement("button");
        this.clearBtn.className = "xlc-dock-clear";
        this.clearBtn.textContent = "×";
        this.clearBtn.style.display = "none";
        this.clearBtn.title = this.deps.t("clearSearch") || "清空输入";
        if (typeof this.clearBtn.setAttribute === "function") this.clearBtn.setAttribute("aria-label", this.clearBtn.title);
        this.clearBtn.addEventListener("click", () => {
            this.searchInput.value = "";
            this.clearBtn.style.display = "none";
            this.searchInput.focus();
            void this.refresh().then(() => {
                // 清空搜索后回滚列表至顶部：高频置顶片段重新可见，避免停留在空旷滚动偏移位
                const listEl = this.container.querySelector<HTMLElement>(".xlc-dock-list");
                if (listEl) listEl.scrollTop = 0;
            });
        });
        searchBox.appendChild(this.clearBtn);
        this.container.appendChild(searchBox);

        // 3. 过滤 Chips
        this.chipsContainer = document.createElement("div");
        this.chipsContainer.className = "xlc-dock-chips";
        if (typeof this.chipsContainer.setAttribute === "function") {
            this.chipsContainer.setAttribute("role", "radiogroup");
            this.chipsContainer.setAttribute("aria-label", "侧边栏内容过滤");
        }
        this.chipsContainer.addEventListener("keydown", (e) => {
            const chips = Array.from(this.chipsContainer.querySelectorAll<HTMLButtonElement>(".xlc-dock-chip"));
            if (chips.length <= 1) return;
            const curIdx = chips.indexOf(document.activeElement as HTMLButtonElement);
            if (curIdx === -1) return;
            let nextIdx = -1;
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                nextIdx = (curIdx + 1) % chips.length;
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                nextIdx = (curIdx - 1 + chips.length) % chips.length;
            } else if (e.key === "Home") {
                e.preventDefault();
                nextIdx = 0;
            } else if (e.key === "End") {
                e.preventDefault();
                nextIdx = chips.length - 1;
            }
            if (nextIdx >= 0 && chips[nextIdx]) {
                chips[nextIdx]?.focus();
                chips[nextIdx]?.click();
            }
        });
        const scopes: Array<{key: "all" | "common" | "recent" | "favorites"; label: string}> = [
            {key: "all", label: this.deps.t("scopeAll") || "全部"},
            {key: "common", label: this.deps.t("filterCommon") || "常用"},
            {key: "recent", label: this.deps.t("filterRecent") || "最近"},
            {key: "favorites", label: "★ " + (this.deps.t("filterFavorites") || "收藏")},
        ];
        for (const s of scopes) {
            const chip = document.createElement("button");
            chip.type = "button";
            const isActive = this.currentScope === s.key;
            chip.className = "xlc-dock-chip" + (isActive ? " xlc-dock-chip--active" : "");
            chip.textContent = s.label;
            chip.dataset.scope = s.key;
            if (typeof chip.setAttribute === "function") {
                chip.setAttribute("role", "radio");
                chip.setAttribute("aria-checked", isActive ? "true" : "false");
            }
            chip.addEventListener("click", () => {
                this.currentScope = s.key;
                this.syncChips();
                void this.refresh();
            });
            this.chipsContainer.appendChild(chip);
        }
        this.container.appendChild(this.chipsContainer);

        // 4. 状态提示
        this.statusText = document.createElement("div");
        this.statusText.className = "xlc-dock-status";
        if (typeof this.statusText.setAttribute === "function") {
            this.statusText.setAttribute("role", "status");
            this.statusText.setAttribute("aria-live", "polite");
        }
        this.statusText.textContent = "加载中...";
        this.container.appendChild(this.statusText);

        // 5. 列表容器
        this.listContainer = document.createElement("div");
        this.listContainer.className = "xlc-dock-list";
        if (typeof this.listContainer.setAttribute === "function") {
            this.listContainer.setAttribute("role", "listbox");
            this.listContainer.setAttribute("aria-label", "常用资产列表");
        }
        this.container.appendChild(this.listContainer);

        // 6. 底部微型抽屉
        this.drawerContainer = document.createElement("div");
        this.drawerContainer.className = "xlc-dock-drawer";
        this.drawerContainer.style.display = "none";
        this.container.appendChild(this.drawerContainer);
    }

    private syncChips(): void {
        this.chipsContainer.querySelectorAll<HTMLButtonElement>(".xlc-dock-chip").forEach((btn) => {
            const isActive = btn.dataset.scope === this.currentScope;
            btn.classList.toggle("xlc-dock-chip--active", isActive);
            if (typeof btn.setAttribute === "function") btn.setAttribute("aria-checked", isActive ? "true" : "false");
        });
    }

    public async refresh(): Promise<void> {
        if (this.isDestroyed) return;
        this.fullBodyCache.clear();
        const seq = ++this.searchSeq;
        const queryText = this.searchInput ? this.searchInput.value.trim() : "";
        const scope = this.currentScope === "common" ? "all" : this.currentScope;

        this.statusText.textContent = "检索中...";
        this.statusText.style.display = "block";

        try {
            const res = await this.deps.search({
                text: queryText,
                scope,
                itemType: "",
                tag: "",
                category: "",
            });
            if (seq !== this.searchSeq || this.isDestroyed) return;

            let entries = res.entries;
            // 常用范围（按使用频次降序）
            if (this.currentScope === "common" && this.deps.getUsage) {
                const usage = this.deps.getUsage();
                entries = [...entries].sort((a, b) => {
                    const uA = usage[a.id]?.count ?? 0;
                    const uB = usage[b.id]?.count ?? 0;
                    return uB - uA;
                });
            }

            this.results = entries;
            this.statusText.textContent = `共 ${this.results.length} 项`;
            if (this.results.length === 0) {
                this.statusText.textContent = queryText ? "未检索到匹配条目" : "常用库暂无条目";
            }
            this.renderList();
        } catch (err) {
            if (seq !== this.searchSeq || this.isDestroyed) return;
            this.statusText.textContent = `错误: ${toErrorMessage(err)}`;
        }
    }

    private renderList(): void {
        this.listContainer.innerHTML = "";
        if (this.results.length === 0) {
            const empty = document.createElement("div");
            empty.className = "xlc-dock-empty";
            empty.textContent = "未找到常用条目，点击顶部 ＋ 新建";
            this.listContainer.appendChild(empty);
            this.closeDrawer();
            return;
        }

        const isBrowsingAll = this.currentScope === "all" && !this.searchInput.value.trim();

        if (isBrowsingAll) {
            if (this.groupBy === "tag") {
                // 模式 A2：标签聚合折叠模式 (CAND-004 / TODO-FEAT-004)
                const groups = new Map<string, SearchEntry[]>();
                for (const e of this.results) {
                    const tags = e.tags && e.tags.length > 0 ? e.tags : ["未加标签"];
                    for (const t of tags) {
                        const tagKey = `#${t.replace(/^#/, "")}`;
                        if (!groups.has(tagKey)) groups.set(tagKey, []);
                        groups.get(tagKey)!.push(e);
                    }
                }
                let globalIdx = 0;
                for (const [tagName, tagEntries] of groups.entries()) {
                    const isCollapsed = this.collapsedCategories.has(tagName);
                    const groupHead = document.createElement("div");
                    groupHead.className = "xlc-dock-group-head";
                    groupHead.tabIndex = 0;
                    if (typeof groupHead.setAttribute === "function") {
                        groupHead.setAttribute("role", "button");
                        groupHead.setAttribute("aria-expanded", !isCollapsed ? "true" : "false");
                        groupHead.setAttribute("aria-label", `标签：${tagName}，共 ${tagEntries.length} 项，${isCollapsed ? "已折叠" : "已展开"}`);
                    }
                    const safeTagName = escapeDockHtml(tagName);
                    groupHead.innerHTML = `
                        <span class="xlc-dock-group-arrow" aria-hidden="true">${isCollapsed ? "▸" : "▾"}</span>
                        <span class="xlc-dock-group-name">${safeTagName}</span>
                        <span class="xlc-dock-group-count">${tagEntries.length}</span>
                    `;
                    const toggleGroup = () => {
                        if (this.collapsedCategories.has(tagName)) {
                            this.collapsedCategories.delete(tagName);
                        } else {
                            this.collapsedCategories.add(tagName);
                        }
                        this.renderList();
                    };
                    groupHead.addEventListener("click", toggleGroup);
                    groupHead.addEventListener("keydown", (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleGroup();
                        }
                    });
                    this.listContainer.appendChild(groupHead);

                    if (!isCollapsed) {
                        for (const entry of tagEntries) {
                            const row = this.renderItemRow(entry, globalIdx++);
                            this.listContainer.appendChild(row);
                        }
                    } else {
                        globalIdx += tagEntries.length;
                    }
                }
            } else {
                // 模式 A1：多层级分类树状折叠大纲模式 (CAND-004 / TODO-FEAT-004)
                const groups = new Map<string, SearchEntry[]>();
                const countsMap = new Map<string, number>();
                for (const e of this.results) {
                    const cat = e.category?.trim() || "未分类";
                    if (!groups.has(cat)) groups.set(cat, []);
                    groups.get(cat)!.push(e);
                    countsMap.set(cat, (countsMap.get(cat) ?? 0) + 1);
                }

                const tree = buildHierarchyTree(Array.from(groups.keys()), countsMap);
                let globalIdx = 0;

                const renderNode = (node: HierarchyNode) => {
                    const isCollapsed = this.collapsedCategories.has(node.path);
                    const groupHead = document.createElement("div");
                    groupHead.className = "xlc-dock-group-head";
                    groupHead.tabIndex = 0;
                    if (node.depth > 0) {
                        groupHead.style.paddingLeft = `${8 + Math.min(node.depth, 3) * 10}px`;
                    }
                    if (typeof groupHead.setAttribute === "function") {
                        groupHead.setAttribute("role", "button");
                        groupHead.setAttribute("aria-expanded", !isCollapsed ? "true" : "false");
                        groupHead.setAttribute("aria-label", `分类：${node.path}，共 ${node.count} 项，${isCollapsed ? "已折叠" : "已展开"}`);
                    }
                    const catName = node.name;
                    const safeCatName = escapeDockHtml(catName);
                    groupHead.innerHTML = `
                        <span class="xlc-dock-group-arrow" aria-hidden="true">${isCollapsed ? "▸" : "▾"}</span>
                        <span class="xlc-dock-group-name">${safeCatName}</span>
                        <span class="xlc-dock-group-count">${escapeDockHtml(String(node.count))}</span>
                    `;
                    const toggleGroup = () => {
                        if (this.collapsedCategories.has(node.path)) {
                            this.collapsedCategories.delete(node.path);
                        } else {
                            this.collapsedCategories.add(node.path);
                        }
                        this.renderList();
                    };
                    groupHead.addEventListener("click", toggleGroup);
                    groupHead.addEventListener("keydown", (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleGroup();
                        }
                    });
                    this.listContainer.appendChild(groupHead);

                    if (!isCollapsed) {
                        const directEntries = groups.get(node.path) || [];
                        const orderedEntries = applyCustomOrder(directEntries, this.deps.getCustomOrder?.());
                        for (let itemIdx = 0; itemIdx < orderedEntries.length; itemIdx++) {
                            const entry = orderedEntries[itemIdx];
                            if (!entry) continue;
                            const row = this.renderItemRow(entry, globalIdx++, orderedEntries, itemIdx);
                            if (node.depth > 0) {
                                row.style.marginLeft = `${Math.min(node.depth, 3) * 10}px`;
                            }
                            this.listContainer.appendChild(row);
                        }
                        for (const child of node.children) {
                            renderNode(child);
                        }
                    } else {
                        globalIdx += node.count;
                    }
                };

                for (const rootNode of tree) {
                    renderNode(rootNode);
                }
            }
        } else {
            // 模式 B：过滤/搜索扁平模式
            for (let i = 0; i < this.results.length; i++) {
                const row = this.renderItemRow(this.results[i]!, i);
                this.listContainer.appendChild(row);
            }
        }
    }

    private renderItemRow(entry: SearchEntry, index: number, groupEntries?: SearchEntry[], itemIdx?: number): HTMLElement {
        const row = document.createElement("div");
        row.className = "xlc-dock-row" + (index === this.activeIndex ? " xlc-dock-row--active" : "");
        row.dataset.index = String(index);
        if (typeof row.setAttribute === "function") {
            row.setAttribute("role", "option");
            row.setAttribute("aria-selected", index === this.activeIndex ? "true" : "false");
        }

        const prefetchFullBody = () => {
            if (this.fullBodyCache.has(entry.id) || typeof this.deps.preview !== "function") return;
            void this.deps.preview(entry.id).then((text) => {
                if (text) this.setFullBodyCache(entry.id, text);
            }).catch(() => {});
        };
        row.addEventListener("mouseenter", prefetchFullBody);
        row.addEventListener("pointerdown", prefetchFullBody);

        // 原生 HTML5 拖拽属性支持（F2：支持按住 Alt 拖出块引用、按住 Shift 拖出嵌入块；普通拖拽优先使用完整正文而非 240 字截断摘要）
        row.draggable = true;
        row.addEventListener("dragstart", (e) => {
            const targetId = entry.targetBlockId || entry.sourceBlockId || entry.blockId || entry.id;
            let dragPayload = this.fullBodyCache.get(entry.id) || entry.content || entry.summary || entry.title || "";
            if (e.altKey && targetId) {
                dragPayload = `((${targetId} '${entry.title || "引用"}'))`;
                this.deps.notify?.("info", "已拖出块引用链接");
            } else if (e.shiftKey && targetId) {
                dragPayload = `{{select * from blocks where id='${targetId}'}}`;
                this.deps.notify?.("info", "已拖出同步嵌入块");
            }
            e.dataTransfer?.setData("text/plain", dragPayload);
            e.dataTransfer?.setData("text/siyuan", dragPayload);
        });

        // 右键上下文菜单 (F3)
        row.addEventListener("contextmenu", (e) => {
            this.showContextMenu(e, entry);
        });

        // 左侧：类型徽标
        const badge = document.createElement("span");
        const cType = entry.itemType || "text";
        badge.className = `xlc-badge xlc-badge--${cType}`;
        badge.textContent = cType.toUpperCase().slice(0, 4);
        row.appendChild(badge);

        // 中间：标题、简码与别名
        const titleWrap = document.createElement("div");
        titleWrap.className = "xlc-dock-row-title-wrap";

        if (this.deps.isSourceMissing?.(entry)) {
            const warnSpan = document.createElement("span");
            warnSpan.className = "xlc-row-warn";
            warnSpan.textContent = "⚠";
            warnSpan.title = this.deps.t("sourceGone") || "来源块或文档已失效";
            titleWrap.appendChild(warnSpan);
        }

        const title = document.createElement("span");
        title.className = "xlc-dock-row-title";
        title.textContent = entry.title || entry.summary || "未命名条目";
        titleWrap.appendChild(title);

        if (entry.shortcode) {
            const scBadge = document.createElement("span");
            scBadge.className = "xlc-badge xlc-badge--shortcode";
            scBadge.textContent = entry.shortcode;
            scBadge.title = `简码：输入 ${entry.shortcode} 触发`;
            titleWrap.appendChild(scBadge);
        }

        if (entry.alias) {
            const alias = document.createElement("span");
            alias.className = "xlc-dock-row-alias";
            alias.textContent = entry.alias;
            titleWrap.appendChild(alias);
        }
        row.appendChild(titleWrap);

        // 右侧：悬停快捷动作栏
        const hoverActs = document.createElement("div");
        hoverActs.className = "xlc-dock-row-actions";

        // 快捷插入按钮
        const insertBtn = document.createElement("button");
        insertBtn.type = "button";
        insertBtn.className = "xlc-dock-act-btn";
        insertBtn.title = "插入到当前文档光标处";
        if (typeof insertBtn.setAttribute === "function") insertBtn.setAttribute("aria-label", insertBtn.title);
        insertBtn.textContent = "＋";
        insertBtn.addEventListener("mousedown", (e) => {
            e.preventDefault(); // 阻止抢夺编辑器光标焦点
        });
        insertBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            void this.insertEntry(entry);
        });
        hoverActs.appendChild(insertBtn);

        // 快捷复制按钮
        const copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.className = "xlc-dock-act-btn";
        copyBtn.title = "复制纯文本到剪贴板";
        if (typeof copyBtn.setAttribute === "function") copyBtn.setAttribute("aria-label", copyBtn.title);
        copyBtn.textContent = "⧉";
        copyBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            void this.copyEntry(entry, copyBtn);
        });
        hoverActs.appendChild(copyBtn);

        // 收藏切换按钮
        const favBtn = document.createElement("button");
        favBtn.type = "button";
        favBtn.className = "xlc-dock-act-btn" + (this.deps.isFavorite(entry.id) ? " xlc-dock-act-btn--fav" : "");
        const favTitle = this.deps.isFavorite(entry.id) ? "取消收藏" : "加入收藏";
        favBtn.title = favTitle;
        if (typeof favBtn.setAttribute === "function") favBtn.setAttribute("aria-label", favTitle);
        favBtn.textContent = this.deps.isFavorite(entry.id) ? "★" : "☆";
        favBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.deps.toggleFavorite(entry.id);
            const isFav = this.deps.isFavorite(entry.id);
            favBtn.textContent = isFav ? "★" : "☆";
            lvNotify.inline(favBtn, isFav ? "已收藏" : "已取消收藏");
            const updatedTitle = isFav ? "取消收藏" : "加入收藏";
            favBtn.title = updatedTitle;
            if (typeof favBtn.setAttribute === "function") favBtn.setAttribute("aria-label", updatedTitle);
            favBtn.classList.toggle("xlc-dock-act-btn--fav", isFav);
            if (this.currentScope === "favorites" && !isFav) {
                setTimeout(() => {
                    if (!this.isDestroyed && this.currentScope === "favorites") {
                        void this.refresh();
                    }
                }, 160);
            }
        });
        hoverActs.appendChild(favBtn);

        // 自定义排序上移/下移按钮（CAND-014 / TODO-FEAT-013）
        if (groupEntries && typeof itemIdx === "number" && this.deps.setCustomOrder && groupEntries.length > 1) {
            const upBtn = document.createElement("button");
            upBtn.type = "button";
            upBtn.className = "xlc-dock-act-btn xlc-dock-act-btn--order";
            upBtn.dataset.xlcControl = "dock.item.order-up";
            upBtn.title = "在当前分类内上移";
            if (typeof upBtn.setAttribute === "function") upBtn.setAttribute("aria-label", "在当前分类内上移");
            upBtn.textContent = "↑";
            upBtn.disabled = itemIdx === 0;
            upBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (itemIdx === 0) return;
                const newOrder = reorderItem(groupEntries, entry.id, "up", this.deps.getCustomOrder?.());
                this.deps.setCustomOrder?.(newOrder);
                this.renderList();
            });
            hoverActs.appendChild(upBtn);

            const downBtn = document.createElement("button");
            downBtn.type = "button";
            downBtn.className = "xlc-dock-act-btn xlc-dock-act-btn--order";
            downBtn.dataset.xlcControl = "dock.item.order-down";
            downBtn.title = "在当前分类内下移";
            if (typeof downBtn.setAttribute === "function") downBtn.setAttribute("aria-label", "在当前分类内下移");
            downBtn.textContent = "↓";
            downBtn.disabled = itemIdx === groupEntries.length - 1;
            downBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (itemIdx === groupEntries.length - 1) return;
                const newOrder = reorderItem(groupEntries, entry.id, "down", this.deps.getCustomOrder?.());
                this.deps.setCustomOrder?.(newOrder);
                this.renderList();
            });
            hoverActs.appendChild(downBtn);
        }

        row.appendChild(hoverActs);

        // 行点击：激活并在底部抽屉展开轻量预览
        row.addEventListener("click", () => {
            this.activeIndex = index;
            this.updateActiveRow();
            this.openDrawer(entry);
        });

        // 行双击：快速复制纯文本
        row.addEventListener("dblclick", () => {
            void this.copyEntry(entry);
        });

        return row;
    }

    private showContextMenu(e: MouseEvent, entry: SearchEntry): void {
        e.preventDefault();
        this.closeContextMenu();

        const menu = document.createElement("div");
        menu.className = "xlc-dock-menu";
        if (typeof menu.setAttribute === "function") {
            menu.setAttribute("role", "menu");
            menu.setAttribute("aria-label", entry.title || "条目操作菜单");
        }
        const menuW = typeof window !== "undefined" ? Math.min(180, Math.max(150, window.innerWidth - 16)) : 180;
        const posX = typeof window !== "undefined" ? Math.max(8, Math.min(e.clientX, window.innerWidth - menuW - 8)) : e.clientX;
        const posY = typeof window !== "undefined" ? Math.max(8, Math.min(e.clientY, window.innerHeight - 240)) : e.clientY;
        menu.style.position = "fixed";
        menu.style.left = `${posX}px`;
        menu.style.top = `${posY}px`;

        const addItem = (icon: string, label: string, action: () => void) => {
            const it = document.createElement("button");
            it.type = "button";
            it.className = "xlc-dock-menu-item";
            if (typeof it.setAttribute === "function") {
                it.setAttribute("role", "menuitem");
            }
            it.innerHTML = `<span class="xlc-dock-menu-ic" aria-hidden="true">${escapeDockHtml(icon)}</span><span>${escapeDockHtml(label)}</span>`;
            it.addEventListener("click", () => {
                this.closeContextMenu();
                action();
            });
            menu.appendChild(it);
        };

        addItem("＋", this.deps.t("insert") || "插入到当前光标", () => void this.insertEntry(entry));
        const targetId = entry.targetBlockId || entry.sourceBlockId || entry.blockId || entry.id;
        if (targetId) {
            addItem("((•))", this.deps.t("insertBlockRef") || "插入为思源块引用", () => void this.insertEntry(entry, "insert-ref"));
            addItem("{{•}}", this.deps.t("insertEmbed") || "插入为思源同步嵌入块", () => void this.insertEntry(entry, "insert-embed"));
        }
        addItem("⧉", this.deps.t("copy") || "复制纯文本", () => void this.copyEntry(entry));
        if (targetId) {
            addItem("((•))", "复制块引用语法", async () => {
                const code = `((${targetId} '${entry.title || "引用"}'))`;
                await this.deps.copyProviderPayload(code);
                this.deps.notify?.("info", `已复制块引用: ${code}`);
            });
        }
        addItem("↗", this.deps.t("openSource") || "打开来源块", () => void this.deps.openSource(entry.id));
        addItem(this.deps.isFavorite(entry.id) ? "★" : "☆", this.deps.isFavorite(entry.id) ? "取消收藏" : "加入收藏", () => {
            this.deps.toggleFavorite(entry.id);
            this.renderList();
        });
        if (this.deps.editItem) {
            addItem("✎", this.deps.t("edit") || "编辑条目", () => void this.deps.editItem?.(entry.id));
        }

        if (typeof document !== "undefined" && document.body) {
            document.body.appendChild(menu);
            this.activeMenuEl = menu;

            const surfaceUnreg = lvSurfaceStack.push({
                id: "xlc-dock-menu",
                type: "menu",
                dismiss: () => {
                    this.closeContextMenu();
                    return true;
                }
            });

            const dismiss = (ev: MouseEvent) => {
                if (!menu.contains(ev.target as Node)) {
                    this.closeContextMenu();
                }
            };
            const onKeydown = (ev: KeyboardEvent) => {
                if (ev.key === "Escape") {
                    ev.preventDefault();
                    ev.stopPropagation();
                    this.closeContextMenu();
                    return;
                }
                if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
                    const items = Array.from(menu.querySelectorAll<HTMLButtonElement>(".xlc-dock-menu-item"));
                    if (!items.length) return;
                    ev.preventDefault();
                    ev.stopPropagation();
                    const cur = items.indexOf(document.activeElement as HTMLButtonElement);
                    const next = ev.key === "ArrowDown"
                        ? (cur + 1) % items.length
                        : (cur - 1 + items.length) % items.length;
                    items[next]?.focus();
                }
            };
            this.menuCleanup = () => {
                surfaceUnreg();
                if (typeof document !== "undefined" && typeof document.removeEventListener === "function") {
                    document.removeEventListener("pointerdown", dismiss);
                    document.removeEventListener("keydown", onKeydown, true);
                }
            };
            if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
                document.addEventListener("keydown", onKeydown, true);
            }
            setTimeout(() => {
                if (this.isDestroyed || !this.activeMenuEl) return;
                if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
                    document.addEventListener("pointerdown", dismiss);
                }
                menu.querySelector<HTMLButtonElement>(".xlc-dock-menu-item")?.focus();
            }, 0);
        }
    }

    private closeContextMenu(): void {
        if (this.menuCleanup) {
            this.menuCleanup();
            this.menuCleanup = null;
        }
        if (this.activeMenuEl) {
            this.activeMenuEl.remove();
            this.activeMenuEl = null;
        }
    }

    public getActiveIndex(): number {
        return this.activeIndex;
    }

    private updateActiveRow(): void {
        this.listContainer.querySelectorAll<HTMLElement>(".xlc-dock-row").forEach((el) => {
            const isActive = el.dataset.index === String(this.activeIndex);
            el.classList.toggle("xlc-dock-row--active", isActive);
            if (typeof el.setAttribute === "function") {
                el.setAttribute("aria-selected", isActive ? "true" : "false");
            }
        });
    }

    private scrollToActiveRow(): void {
        const activeEl = this.listContainer.querySelector<HTMLElement>(`.xlc-dock-row[data-index="${this.activeIndex}"]`);
        if (activeEl && typeof activeEl.scrollIntoView === "function") {
            activeEl.scrollIntoView({ block: "nearest" });
        }
    }

    private async insertEntry(entry: SearchEntry, mode: InsertMode = "insert"): Promise<void> {
        if (this.isInsertBusy) return;
        this.isInsertBusy = true;
        try {
            const res = await this.deps.runAction(entry.id, mode);
            if (res.ok) {
                const msg = res.message && res.message !== "ok"
                    ? res.message
                    : (this.deps.t("inserted", entry.title || entry.id) || "已插入条目");
                this.deps.notify?.("info", msg);
            } else if (res.message) {
                this.deps.notify?.("error", res.message);
            } else {
                this.deps.notify?.("error", this.deps.t("insertFailed") || "插入失败");
            }
        } catch (err) {
            this.deps.notify?.("error", toErrorMessage(err));
        } finally {
            this.isInsertBusy = false;
        }
    }

    private async copyEntry(entry: SearchEntry, btnEl?: HTMLElement): Promise<void> {
        if (this.isCopyBusy) return;
        this.isCopyBusy = true;
        try {
            const res = await this.deps.runAction(entry.id, "copy");
            if (res.ok) {
                if (btnEl) {
                    lvNotify.inline(btnEl, "已复制");
                }
            } else {
                this.deps.notify?.("error", res.message || this.deps.t("copyFailed") || "复制失败");
            }
        } catch (err) {
            this.deps.notify?.("error", toErrorMessage(err));
        } finally {
            this.isCopyBusy = false;
        }
    }

    private openDrawer(entry: SearchEntry): void {
        this.drawerContainer.innerHTML = "";
        this.drawerContainer.style.display = "flex";
        if (typeof this.drawerContainer.setAttribute === "function") {
            this.drawerContainer.setAttribute("role", "region");
            this.drawerContainer.setAttribute("aria-label", "资产抽屉预览");
        }

        const head = document.createElement("div");
        head.className = "xlc-dock-drawer-head";

        const title = document.createElement("strong");
        title.className = "xlc-dock-drawer-title";
        title.textContent = entry.title || entry.summary || this.deps.t("actionsNoun") || "详情预览";
        head.appendChild(title);

        const closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.className = "xlc-dock-drawer-close";
        closeBtn.textContent = "×";
        closeBtn.title = this.deps.t("cancel") || "关闭预览";
        if (typeof closeBtn.setAttribute === "function") {
            closeBtn.setAttribute("aria-label", this.deps.t("cancel") || "关闭预览");
        }
        closeBtn.addEventListener("click", () => this.closeDrawer());
        head.appendChild(closeBtn);
        this.drawerContainer.appendChild(head);

        const body = document.createElement("div");
        body.className = "xlc-dock-drawer-body";
        body.textContent = this.deps.t("loading") || "加载预览中...";
        this.drawerContainer.appendChild(body);

        void this.deps.preview(entry.id).then((text) => {
            if (text) this.setFullBodyCache(entry.id, text);
            if (this.isDestroyed) return;
            body.innerHTML = "";
            const rawText = text || entry.summary || "";
            const parsedAnnotation = (entry.itemType !== "code") ? parseSnippetAnnotations(rawText) : null;
            const previewText = parsedAnnotation && parsedAnnotation.cleanText ? parsedAnnotation.cleanText : rawText;
            if (entry.itemType !== "code" && hasDynamicMacros(previewText)) {
                renderDualMacroPreview(
                    body,
                    previewText,
                    expandMacroPreview(previewText),
                    entry.itemType,
                    {
                        templateSource: this.deps.t("previewTemplateSource") || "模板源码",
                        expandedEffect: this.deps.t("previewExpandedEffect") || "展开后真实效果",
                    },
                );
            } else {
                renderSafePreview(body, previewText, entry.itemType);
            }
        }).catch(() => {
            if (this.isDestroyed) return;
            body.textContent = entry.summary || "(暂无详细内容)";
        });

        const foot = document.createElement("div");
        foot.className = "xlc-dock-drawer-foot";
        if (typeof foot.setAttribute === "function") {
            foot.setAttribute("role", "toolbar");
            foot.setAttribute("aria-label", "抽屉操作栏");
        }
        foot.addEventListener("keydown", (e) => {
            const buttons = Array.from(foot.querySelectorAll<HTMLButtonElement>("button")).filter((b) => !b.disabled);
            if (buttons.length <= 1) return;
            const curIdx = buttons.indexOf(document.activeElement as HTMLButtonElement);
            if (curIdx === -1) return;
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                buttons[(curIdx + 1) % buttons.length]?.focus();
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                buttons[(curIdx - 1 + buttons.length) % buttons.length]?.focus();
            } else if (e.key === "Home") {
                e.preventDefault();
                buttons[0]?.focus();
            } else if (e.key === "End") {
                e.preventDefault();
                buttons[buttons.length - 1]?.focus();
            }
        });

        const insertBtn = document.createElement("button");
        insertBtn.type = "button";
        insertBtn.className = "b3-button xlc-btn-primary";
        insertBtn.textContent = "＋ " + (this.deps.t("insert") || "插入到当前正文");
        if (typeof insertBtn.setAttribute === "function") {
            insertBtn.setAttribute("aria-label", this.deps.t("insert") || "插入到当前正文");
        }
        insertBtn.addEventListener("mousedown", (e) => e.preventDefault());
        insertBtn.addEventListener("click", () => void this.insertEntry(entry));
        foot.appendChild(insertBtn);

        const copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.className = "b3-button";
        copyBtn.textContent = "⧉ " + (this.deps.t("copy") || "复制");
        if (typeof copyBtn.setAttribute === "function") {
            copyBtn.setAttribute("aria-label", this.deps.t("copy") || "复制");
        }
        copyBtn.addEventListener("click", () => void this.copyEntry(entry, copyBtn));
        foot.appendChild(copyBtn);

        const refBtn = document.createElement("button");
        refBtn.type = "button";
        refBtn.className = "b3-button";
        refBtn.dataset.xlcDockAct = "insert-ref";
        refBtn.textContent = "((•))";
        refBtn.title = this.deps.t("insertBlockRef") || "插入为思源块引用";
        if (typeof refBtn.setAttribute === "function") {
            refBtn.setAttribute("aria-label", refBtn.title);
        }
        refBtn.addEventListener("mousedown", (e) => e.preventDefault());
        refBtn.addEventListener("click", () => void this.insertEntry(entry, "insert-ref"));
        foot.appendChild(refBtn);

        const embedBtn = document.createElement("button");
        embedBtn.type = "button";
        embedBtn.className = "b3-button";
        embedBtn.dataset.xlcDockAct = "insert-embed";
        embedBtn.textContent = "{{•}}";
        embedBtn.title = this.deps.t("insertEmbed") || "插入为思源同步嵌入块";
        if (typeof embedBtn.setAttribute === "function") {
            embedBtn.setAttribute("aria-label", embedBtn.title);
        }
        embedBtn.addEventListener("mousedown", (e) => e.preventDefault());
        embedBtn.addEventListener("click", () => void this.insertEntry(entry, "insert-embed"));
        foot.appendChild(embedBtn);

        const openBtn = document.createElement("button");
        openBtn.type = "button";
        openBtn.className = "b3-button";
        openBtn.dataset.xlcDockAct = "open-source";
        openBtn.textContent = "↗";
        openBtn.title = this.deps.t("openSource") || "在思源文档中打开定位此块";
        if (typeof openBtn.setAttribute === "function") {
            openBtn.setAttribute("aria-label", openBtn.title);
        }
        openBtn.addEventListener("click", () => {
            this.closeDrawer();
            void this.deps.openSource(entry.id);
        });
        foot.appendChild(openBtn);

        this.drawerContainer.appendChild(foot);
    }

    private closeDrawer(): void {
        this.drawerContainer.style.display = "none";
        this.drawerContainer.innerHTML = "";
        this.activeIndex = -1;
        this.updateActiveRow();
    }

    public destroy(): void {
        this.isDestroyed = true;
        this.closeContextMenu();
        this.fullBodyCache.clear();
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.container.classList.remove("xlc-dock");
        this.container.innerHTML = "";
    }
}
