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

import {SearchEntry, SearchQuery} from "../model/search";
import {InsertMode} from "../model/actions";
import {toErrorMessage} from "../model/errors";
import {renderSafePreview} from "./preview-renderer";

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
    getUsage?: () => Record<string, {count: number; lastAt?: number}>;
    isSourceMissing: (entry: SearchEntry) => boolean;
    hasActiveEditor?: () => boolean;
    editItem?: (itemId: string) => Promise<void>;
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
        titleBox.innerHTML = `<span class="xlc-dock-icon">🐴</span><strong>${this.deps.t("pluginName") || "小驴常用"}</strong>`;
        head.appendChild(titleBox);

        const actions = document.createElement("div");
        actions.className = "xlc-dock-head-actions";

        const newBtn = document.createElement("button");
        newBtn.className = "b3-button b3-button--text xlc-dock-btn-icon";
        newBtn.title = (this.deps.t("newItemAction") || "新建常用语") + " (Alt+Shift+N)";
        newBtn.textContent = "＋";
        newBtn.addEventListener("click", () => this.deps.newItem());
        actions.appendChild(newBtn);

        const refreshBtn = document.createElement("button");
        refreshBtn.className = "b3-button b3-button--text xlc-dock-btn-icon";
        refreshBtn.title = this.deps.t("reindex") || "刷新内容库";
        refreshBtn.textContent = "↺";
        refreshBtn.addEventListener("click", () => void this.refresh());
        actions.appendChild(refreshBtn);

        if (this.deps.openSettings) {
            const gearBtn = document.createElement("button");
            gearBtn.className = "b3-button b3-button--text xlc-dock-btn-icon";
            gearBtn.title = this.deps.t("openSettings") || "打开小驴常用设置";
            gearBtn.textContent = "⚙";
            gearBtn.addEventListener("click", () => this.deps.openSettings?.());
            actions.appendChild(gearBtn);
        }
        head.appendChild(actions);
        this.container.appendChild(head);

        // 2. 紧凑搜索栏
        const searchBox = document.createElement("div");
        searchBox.className = "xlc-dock-search";

        const searchIcon = document.createElement("span");
        searchIcon.className = "xlc-dock-search-icon";
        searchIcon.textContent = "🔍";
        searchBox.appendChild(searchIcon);

        this.searchInput = document.createElement("input");
        this.searchInput.className = "b3-text-field xlc-dock-search-input";
        this.searchInput.placeholder = this.deps.t("searchPlaceholder") || "搜索常用语、拼音缩写...";
        this.searchInput.addEventListener("input", () => {
            this.clearBtn.style.display = this.searchInput.value ? "inline-flex" : "none";
            if (this.debounceTimer) clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => void this.refresh(), 180);
        });
        this.searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                const first = this.results[0];
                if (first) {
                    void this.insertEntry(first);
                } else if (this.searchInput.value.trim()) {
                    this.deps.newItem(this.searchInput.value.trim());
                }
            }
        });
        searchBox.appendChild(this.searchInput);

        this.clearBtn = document.createElement("button");
        this.clearBtn.className = "xlc-dock-clear";
        this.clearBtn.textContent = "×";
        this.clearBtn.style.display = "none";
        this.clearBtn.title = this.deps.t("clearSearch") || "清空输入";
        this.clearBtn.addEventListener("click", () => {
            this.searchInput.value = "";
            this.clearBtn.style.display = "none";
            this.searchInput.focus();
            void this.refresh();
        });
        searchBox.appendChild(this.clearBtn);
        this.container.appendChild(searchBox);

        // 3. 过滤 Chips
        this.chipsContainer = document.createElement("div");
        this.chipsContainer.className = "xlc-dock-chips";
        const scopes: Array<{key: "all" | "common" | "recent" | "favorites"; label: string}> = [
            {key: "all", label: this.deps.t("scopeAll") || "全部"},
            {key: "common", label: this.deps.t("filterCommon") || "常用"},
            {key: "recent", label: this.deps.t("filterRecent") || "最近"},
            {key: "favorites", label: "★ " + (this.deps.t("filterFavorites") || "收藏")},
        ];
        for (const s of scopes) {
            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = "xlc-dock-chip" + (this.currentScope === s.key ? " xlc-dock-chip--active" : "");
            chip.textContent = s.label;
            chip.dataset.scope = s.key;
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
        this.statusText.textContent = "加载中...";
        this.container.appendChild(this.statusText);

        // 5. 列表容器
        this.listContainer = document.createElement("div");
        this.listContainer.className = "xlc-dock-list";
        this.container.appendChild(this.listContainer);

        // 6. 底部微型抽屉
        this.drawerContainer = document.createElement("div");
        this.drawerContainer.className = "xlc-dock-drawer";
        this.drawerContainer.style.display = "none";
        this.container.appendChild(this.drawerContainer);
    }

    private syncChips(): void {
        this.chipsContainer.querySelectorAll<HTMLButtonElement>(".xlc-dock-chip").forEach((btn) => {
            btn.classList.toggle("xlc-dock-chip--active", btn.dataset.scope === this.currentScope);
        });
    }

    public async refresh(): Promise<void> {
        if (this.isDestroyed) return;
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
            // 模式 A：分类树状折叠大纲模式 (F1)
            const groups = new Map<string, SearchEntry[]>();
            for (const e of this.results) {
                const cat = e.category?.trim() || "未分类";
                if (!groups.has(cat)) groups.set(cat, []);
                groups.get(cat)!.push(e);
            }

            let globalIdx = 0;
            for (const [catName, catEntries] of groups.entries()) {
                const isCollapsed = this.collapsedCategories.has(catName);
                const groupHead = document.createElement("div");
                groupHead.className = "xlc-dock-group-head";
                groupHead.innerHTML = `
                    <span class="xlc-dock-group-arrow">${isCollapsed ? "▸" : "▾"}</span>
                    <span class="xlc-dock-group-name">${catName}</span>
                    <span class="xlc-dock-group-count">${catEntries.length}</span>
                `;
                groupHead.addEventListener("click", () => {
                    if (this.collapsedCategories.has(catName)) {
                        this.collapsedCategories.delete(catName);
                    } else {
                        this.collapsedCategories.add(catName);
                    }
                    this.renderList();
                });
                this.listContainer.appendChild(groupHead);

                if (!isCollapsed) {
                    for (const entry of catEntries) {
                        const row = this.renderItemRow(entry, globalIdx++);
                        this.listContainer.appendChild(row);
                    }
                } else {
                    globalIdx += catEntries.length;
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

    private renderItemRow(entry: SearchEntry, index: number): HTMLElement {
        const row = document.createElement("div");
        row.className = "xlc-dock-row" + (index === this.activeIndex ? " xlc-dock-row--active" : "");
        row.dataset.index = String(index);

        // 原生 HTML5 拖拽属性支持（F2：支持按住 Alt 拖出块引用、按住 Shift 拖出嵌入块）
        row.draggable = true;
        row.addEventListener("dragstart", (e) => {
            const targetId = entry.targetBlockId || entry.sourceBlockId || entry.id;
            let dragPayload = entry.content || entry.summary || entry.title || "";
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

        // 中间：标题与别名
        const titleWrap = document.createElement("div");
        titleWrap.className = "xlc-dock-row-title-wrap";

        const title = document.createElement("span");
        title.className = "xlc-dock-row-title";
        title.textContent = entry.title || entry.summary || "未命名条目";
        titleWrap.appendChild(title);

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
        copyBtn.textContent = "⧉";
        copyBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            void this.copyEntry(entry);
        });
        hoverActs.appendChild(copyBtn);

        // 收藏切换按钮
        const favBtn = document.createElement("button");
        favBtn.type = "button";
        favBtn.className = "xlc-dock-act-btn" + (this.deps.isFavorite(entry.id) ? " xlc-dock-act-btn--fav" : "");
        favBtn.title = this.deps.isFavorite(entry.id) ? "取消收藏" : "加入收藏";
        favBtn.textContent = this.deps.isFavorite(entry.id) ? "★" : "☆";
        favBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.deps.toggleFavorite(entry.id);
            favBtn.textContent = this.deps.isFavorite(entry.id) ? "★" : "☆";
            favBtn.classList.toggle("xlc-dock-act-btn--fav", this.deps.isFavorite(entry.id));
        });
        hoverActs.appendChild(favBtn);

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
        const posX = typeof window !== "undefined" ? Math.min(e.clientX, window.innerWidth - 180) : e.clientX;
        const posY = typeof window !== "undefined" ? Math.min(e.clientY, window.innerHeight - 200) : e.clientY;
        menu.style.position = "fixed";
        menu.style.left = `${posX}px`;
        menu.style.top = `${posY}px`;

        const addItem = (icon: string, label: string, action: () => void) => {
            const it = document.createElement("button");
            it.type = "button";
            it.className = "xlc-dock-menu-item";
            it.innerHTML = `<span class="xlc-dock-menu-ic">${icon}</span><span>${label}</span>`;
            it.addEventListener("click", () => {
                this.closeContextMenu();
                action();
            });
            menu.appendChild(it);
        };

        addItem("＋", this.deps.t("insert") || "插入到当前光标", () => void this.insertEntry(entry));
        addItem("⧉", this.deps.t("copy") || "复制纯文本", () => void this.copyEntry(entry));
        const targetId = entry.targetBlockId || entry.sourceBlockId || entry.id;
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

            const dismiss = (ev: MouseEvent) => {
                if (!menu.contains(ev.target as Node)) {
                    this.closeContextMenu();
                    if (typeof document !== "undefined" && typeof document.removeEventListener === "function") {
                        document.removeEventListener("pointerdown", dismiss);
                    }
                }
            };
            setTimeout(() => {
                if (this.isDestroyed || !this.activeMenuEl) return;
                if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
                    document.addEventListener("pointerdown", dismiss);
                }
            }, 0);
        }
    }

    private closeContextMenu(): void {
        if (this.activeMenuEl) {
            this.activeMenuEl.remove();
            this.activeMenuEl = null;
        }
    }

    private updateActiveRow(): void {
        this.listContainer.querySelectorAll<HTMLElement>(".xlc-dock-row").forEach((el) => {
            el.classList.toggle("xlc-dock-row--active", el.dataset.index === String(this.activeIndex));
        });
    }

    private async insertEntry(entry: SearchEntry): Promise<void> {
        try {
            const res = await this.deps.runAction(entry.id, "insert");
            if (res.ok) {
                this.deps.notify?.("info", this.deps.t("providerInserted") || "已插入条目");
            } else {
                this.deps.notify?.("error", res.message || this.deps.t("insertFailed") || "插入失败");
            }
        } catch (err) {
            this.deps.notify?.("error", toErrorMessage(err));
        }
    }

    private async copyEntry(entry: SearchEntry): Promise<void> {
        try {
            const res = await this.deps.runAction(entry.id, "copy");
            if (res.ok) {
                this.deps.notify?.("info", this.deps.t("copied") || "已复制到剪贴板");
            } else {
                this.deps.notify?.("error", res.message || this.deps.t("copyFailed") || "复制失败");
            }
        } catch (err) {
            this.deps.notify?.("error", toErrorMessage(err));
        }
    }

    private openDrawer(entry: SearchEntry): void {
        this.drawerContainer.innerHTML = "";
        this.drawerContainer.style.display = "flex";

        const head = document.createElement("div");
        head.className = "xlc-dock-drawer-head";

        const title = document.createElement("strong");
        title.className = "xlc-dock-drawer-title";
        title.textContent = entry.title || entry.summary || this.deps.t("actionsNoun") || "详情预览";
        head.appendChild(title);

        const closeBtn = document.createElement("button");
        closeBtn.className = "xlc-dock-drawer-close";
        closeBtn.textContent = "×";
        closeBtn.title = this.deps.t("cancel") || "关闭预览";
        closeBtn.addEventListener("click", () => this.closeDrawer());
        head.appendChild(closeBtn);
        this.drawerContainer.appendChild(head);

        const body = document.createElement("div");
        body.className = "xlc-dock-drawer-body";
        body.textContent = this.deps.t("loading") || "加载预览中...";
        this.drawerContainer.appendChild(body);

        void this.deps.preview(entry.id).then((text) => {
            if (this.isDestroyed) return;
            body.innerHTML = "";
            renderSafePreview(body, text || entry.summary || "", entry.itemType);
        }).catch(() => {
            if (this.isDestroyed) return;
            body.textContent = entry.summary || "(暂无详细内容)";
        });

        const foot = document.createElement("div");
        foot.className = "xlc-dock-drawer-foot";

        const insertBtn = document.createElement("button");
        insertBtn.className = "b3-button xlc-btn-primary";
        insertBtn.textContent = "＋ " + (this.deps.t("insert") || "插入到当前正文");
        insertBtn.addEventListener("mousedown", (e) => e.preventDefault());
        insertBtn.addEventListener("click", () => void this.insertEntry(entry));
        foot.appendChild(insertBtn);

        const copyBtn = document.createElement("button");
        copyBtn.className = "b3-button";
        copyBtn.textContent = "⧉ " + (this.deps.t("copy") || "复制");
        copyBtn.addEventListener("click", () => void this.copyEntry(entry));
        foot.appendChild(copyBtn);

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
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.container.classList.remove("xlc-dock");
        this.container.innerHTML = "";
    }
}
