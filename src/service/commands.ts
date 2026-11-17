// 宿主执行层：把 planAction 的纯计划执行到思源（protyle.insert / clipboard / openTab）。
// 每个动作返回诚实回执；降级路径明示；不伪造成功。
import type {App, ITrackedRangeHandle, Plugin, Protyle} from "siyuan";
import * as siyuan from "siyuan";
import {getActiveEditor, openTab} from "siyuan";
import {EVENTS, PROTOCOL_VERSION} from "../constants";
import {ActionContext, InsertMode, InsertPlan, OpenTarget, planAction, planOpenSource} from "../model/actions";
import {applyPlaceholders, formatLocalDate, listPlaceholders} from "../model/placeholders";
import {applyAskDefaults, expandAsks, extractCursorPosition, stripCursorToken} from "../model/variables";
import {CommonItem, extractCleanPayload} from "../model/item";
import {LibraryService, SourceHealth} from "./library";
import {isMarkdownFormattingPresent, renderSafeHtmlFromMarkdown, writeRichClipboard} from "../model/clipboard";
import {callBridge} from "../ecosystem-bridge-kit";
import {isMobileFrontend, lvActivity, withDocLock} from "../libs/lv-notice-kit";
import {aiSmartExpandTemplate} from "./ai";

/** 占位符应用钩子：由入口注入（读设置 + 当前时间 + 当前文档 + 剪贴板）；未注入则原样保留 */
export interface IPlaceholderHook {
    enabled(): boolean;
    now(): Date;
    /** 当前文档（{{xlc:title}}/{{xlc:doc}}/{{xlc:path}}）；无活动文档返回 null */
    currentDoc(): Promise<{title: string; path: string} | null>;
    /** 系统剪贴板文本（{{xlc:clipboard}}）；读取失败/拒绝返回空串（语义同无文档） */
    clipboard?(): Promise<string>;
    /** 当前活动选区文本（{{xlc:selection}}）；无选区返回空串（G23 / ADR 0075） */
    selection?(): Promise<string> | string;
}

export interface IHostBridge {
    /** 桌面端活动编辑器是否存在（getActiveEditor 官方 API） */
    hasActiveEditor(): boolean;
    /** 在活动编辑器光标处插入 markdown 块，可选自动投送光标落点偏移量 */
    insertMarkdown(markdown: string, target?: EditorInsertTargetSnapshot | null, cursorOffset?: number | null): boolean;
    captureInsertTarget(): EditorInsertTargetSnapshot;
    canInsertAtTarget(target: EditorInsertTargetSnapshot | null): boolean;
    releaseInsertTarget(target: EditorInsertTargetSnapshot | null): void;
    /** 系统剪贴板写文本，支持可选富文本 HTML 双载荷（G18） */
    writeClipboard(text: string, html?: string): Promise<boolean>;
    /** 打开文档/块（openTab） */
    openDoc(docId: string, blockId?: string): boolean;
    /** 打开资源（openTab asset） */
    openAsset(assetPath: string): boolean;
    /** 外部 URL */
    openExternal(url: string): boolean;
    /** 当前文档 ID（relink 用） */
    currentDocId(): string | null;
    isMobile(): boolean;
}

/** A search dialog keeps the editor and tracked range it was opened from. */
export interface EditorInsertTargetSnapshot {
    editor: Protyle | null;
    handle: ITrackedRangeHandle | null;
    docId: string | null;
}

/**
 * 纯 DOM 光标精准定位原语（对标 Espanso $|$ 与 Templater tp.file.cursor() 工业标准）
 * 遍历指定容器内的所有文本节点，精确计算字符偏移并将光标定位到该处。
 */
export function setCaretAtOffset(container: Node, targetOffset: number): boolean {
    if (typeof document === "undefined" || typeof window === "undefined") return false;
    if (typeof targetOffset !== "number" || targetOffset < 0 || !Number.isFinite(targetOffset)) return false;

    try {
        const textNodes: Text[] = [];
        const showText = typeof NodeFilter !== "undefined" ? NodeFilter.SHOW_TEXT : 4;
        if (typeof document.createTreeWalker === "function") {
            const walker = document.createTreeWalker(container, showText, null);
            let n: Text | null = null;
            while ((n = walker.nextNode() as Text | null)) textNodes.push(n);
        } else {
            const collect = (node: Node) => {
                if (node.nodeType === 3) textNodes.push(node as Text);
                else if ((node as any).childNodes) {
                    for (const c of (node as any).childNodes) collect(c);
                }
            };
            collect(container);
        }

        let currentOffset = 0;
        let lastTextNode: Text | null = null;

        for (const textNode of textNodes) {
            lastTextNode = textNode;
            const len = textNode.nodeValue?.length ?? 0;
            if (currentOffset + len >= targetOffset) {
                const offsetInNode = Math.max(0, Math.min(targetOffset - currentOffset, len));
                const range = document.createRange();
                range.setStart(textNode, offsetInNode);
                range.collapse(true);
                const sel = window.getSelection();
                if (sel) {
                    sel.removeAllRanges();
                    sel.addRange(range);
                    return true;
                }
                return false;
            }
            currentOffset += len;
        }

        // 若目标偏移量超出所有文本节点总长，放置在最后一个文本节点末尾
        if (lastTextNode) {
            const range = document.createRange();
            range.setStart(lastTextNode, lastTextNode.nodeValue?.length ?? 0);
            range.collapse(true);
            const sel = window.getSelection();
            if (sel) {
                sel.removeAllRanges();
                sel.addRange(range);
                return true;
            }
        }
    } catch {
        return false;
    }
    return false;
}

/**
 * 统一移动端宿主判定：优先结合思源官方 getFrontend()（"mobile" | "browser-mobile"）
 * 与生态标准库 isMobileFrontend()，同时兼容思源 3.8.x window.siyuan.mobile 对象形态、
 * #mobileTopBar 节点以及 body--mobile 类名；桌面单测环境保持返回 false。
 */
export function detectMobileHost(): boolean {
    try {
        const getFn = (siyuan as unknown as {getFrontend?: () => string}).getFrontend;
        if (typeof getFn === "function") {
            const frontend = getFn();
            if (frontend === "mobile" || frontend === "browser-mobile") return true;
        }
    } catch {
        // ignore
    }
    if (isMobileFrontend()) return true;
    try {
        const winMobile = typeof window !== "undefined"
            ? (window as unknown as {siyuan?: {mobile?: unknown}}).siyuan?.mobile
            : undefined;
        if (winMobile === true || (typeof winMobile === "object" && winMobile !== null)) return true;
    } catch {
        // ignore
    }
    try {
        if (typeof document !== "undefined") {
            if (typeof document.getElementById === "function" && document.getElementById("mobileTopBar")) return true;
            if (document.body?.classList?.contains?.("body--mobile")) return true;
        }
    } catch {
        // ignore
    }
    return false;
}

export class HostBridge implements IHostBridge {
    private lastActiveEditor: Protyle | null = null;

    constructor(private readonly app: App, private readonly owner: Plugin) {}

    public recordActiveEditor(editor: any): void {
        const candidate = editor?.protyle ? editor : (editor?.block?.rootID ? {protyle: editor} : null);
        if (candidate?.protyle?.block?.rootID) {
            this.lastActiveEditor = candidate as Protyle;
        }
    }

    private resolveActiveEditor(): Protyle | null {
        if (this.lastActiveEditor?.protyle?.block?.rootID) {
            const el = this.lastActiveEditor.protyle?.wysiwyg?.element;
            if (!el || (el.isConnected && !el.closest?.(".fn__none, [inert]"))) {
                return this.lastActiveEditor;
            }
        }
        try {
            const active = getActiveEditor() ?? null;
            if (active?.protyle?.block?.rootID) {
                const el = active.protyle?.wysiwyg?.element;
                const isVisible = !el || (el.isConnected && !el.closest?.(".fn__none, [inert]"));
                if (isVisible) {
                    this.lastActiveEditor = active;
                    return active;
                }
            }
        } catch {
            // ignore
        }
        return null;
    }

    isMobile(): boolean {
        return detectMobileHost();
    }

    hasActiveEditor(): boolean {
        return !!this.resolveActiveEditor();
    }

    captureInsertTarget(): EditorInsertTargetSnapshot {
        let editor: Protyle | null = null;
        let docId: string | null = null;
        try {
            editor = this.resolveActiveEditor();
            if (!editor) return {editor: null, handle: null, docId: null};
            docId = editor.protyle.block.rootID ?? null;
            const protyleEl = editor.protyle.element;
            let range: Range | null = null;
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const candidate = selection.getRangeAt(0);
                const container = candidate.commonAncestorContainer;
                const node = container instanceof Element ? container : container.parentElement;
                if (node && node.closest('[data-node-id] [contenteditable="true"]') && protyleEl.contains(candidate.commonAncestorContainer)) {
                    range = candidate;
                }
            }
            // 若用户点击了顶栏按钮或侧栏搜索框导致选区移出编辑器，优先回退 Protyle 自身记录的 toolbar.range
            if (!range) {
                const toolbarRange = (editor.protyle as unknown as {toolbar?: {range?: Range}})?.toolbar?.range;
                if (toolbarRange && protyleEl.contains(toolbarRange.commonAncestorContainer)) {
                    const container = toolbarRange.commonAncestorContainer;
                    const node = container instanceof Element ? container : container.parentElement;
                    if (node && node.closest('[data-node-id] [contenteditable="true"]')) {
                        range = toolbarRange;
                    }
                }
            }
            // 若文档刚打开尚未点击段落产生光标，回退到文档末尾可编辑块末尾，确保「点击插入」真实落入当前打开的文档
            if (!range) {
                const wysiwygEl = editor.protyle?.wysiwyg?.element;
                if (wysiwygEl && wysiwygEl.isConnected && !wysiwygEl.closest(".fn__none, [inert]")) {
                    const editables = wysiwygEl.querySelectorAll<HTMLElement>('[data-node-id] [contenteditable="true"]');
                    const lastEditable = editables[editables.length - 1];
                    if (lastEditable && typeof document.createRange === "function") {
                        const fallback = document.createRange();
                        fallback.selectNodeContents(lastEditable);
                        fallback.collapse(false);
                        range = fallback;
                    }
                }
            }
            if (!range) return {editor, handle: null, docId};
            if (typeof editor.protyle.trackRange === "function") {
                try {
                    const handle = editor.protyle.trackRange(range, {owner: this.owner, affinity: "after"});
                    if (handle) return {editor, handle, docId};
                } catch {
                    // trackRange 在严格校验非直接源块选区时可能抛错，平滑回退到内部 Range 快照
                }
            }
            return {editor, handle: {__xlcFallbackRange: range.cloneRange()} as unknown as ITrackedRangeHandle, docId};
        } catch {
            return {editor, handle: null, docId};
        }
    }

    canInsertAtTarget(target: EditorInsertTargetSnapshot | null): boolean {
        if (!target?.editor || !target.handle) return false;
        try {
            const protyle = target.editor.protyle;
            const rootId = protyle.block.rootID ?? null;
            if (!rootId || !target.docId || rootId !== target.docId || protyle.disabled) return false;
            const fallbackRange = (target.handle as unknown as {__xlcFallbackRange?: Range}).__xlcFallbackRange;
            if (fallbackRange) {
                return protyle.element.isConnected && protyle.element.contains(fallbackRange.commonAncestorContainer);
            }
            const resolved = target.editor.protyle.resolveTrackedRange(target.handle);
            return resolved.status === "resolved"
                && protyle.element.isConnected
                && protyle.element.contains(resolved.range.commonAncestorContainer);
        } catch {
            return false;
        }
    }

    releaseInsertTarget(target: EditorInsertTargetSnapshot | null): void {
        if (!target?.editor || !target.handle) return;
        if ((target.handle as unknown as {__xlcFallbackRange?: Range}).__xlcFallbackRange) return;
        try {
            target.editor.protyle.releaseTrackedRange(target.handle);
        } catch {
            // The editor may already have been disposed.
        }
    }

    /**
     * 模板插入后光标自动精准投送（对标 Espanso $|$ 与 Templater tp.file.cursor() 工业标准）
     * 计算展开后的字符偏移并自动定位 DOM 光标，零手动位移摩擦。
     */
    private positionCursorAtOffset(editor: Protyle, cursorOffset: number): void {
        if (typeof document === "undefined" || typeof window === "undefined") return;
        const place = () => {
            try {
                const sel = window.getSelection();
                if (!sel) return;
                const wysiwygEl = (editor as any)?.protyle?.wysiwyg?.element || (editor as any)?.wysiwyg?.element;
                let activeBlock: HTMLElement | null = null;
                if (sel.rangeCount > 0) {
                    const currentRange = sel.getRangeAt(0);
                    const container = currentRange.startContainer;
                    activeBlock = container instanceof HTMLElement ? container.closest("[data-node-id]") : container.parentElement?.closest("[data-node-id]") ?? null;
                }
                if (!activeBlock && wysiwygEl) {
                    const allBlocks = wysiwygEl.querySelectorAll("[data-node-id]");
                    activeBlock = (allBlocks[allBlocks.length - 1] as HTMLElement) ?? null;
                }
                if (!activeBlock) return;

                const editable = activeBlock.querySelector('[contenteditable="true"]') || activeBlock;
                setCaretAtOffset(editable, cursorOffset);
            } catch {
                // 静默防御
            }
        };

        place();
        if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(place);
        }
    }

    insertMarkdown(markdown: string, target?: EditorInsertTargetSnapshot | null, cursorOffset?: number | null): boolean {
        try {
            const editor = target === undefined ? this.resolveActiveEditor() : target?.editor;
            if (!editor) return false;

            // 宿主编辑器可见性防御（对齐 SiYuan Issue #20566 官方稳定插入契约）：
            // 若编辑器处于不可见状态（包含 .fn__none、[inert] 或已从 DOM 树脱离），拒绝插入，防状态污染
            const wysiwygEl = editor.protyle?.wysiwyg?.element;
            if (wysiwygEl && typeof wysiwygEl.closest === "function") {
                if (wysiwygEl.closest(".fn__none, [inert]") || !wysiwygEl.isConnected) {
                    return false;
                }
            }

            if (target !== undefined) {
                if (!this.canInsertAtTarget(target) || !target?.handle) return false;
                const fallbackRange = (target.handle as unknown as {__xlcFallbackRange?: Range}).__xlcFallbackRange;
                let rangeToRestore: Range | null = fallbackRange ?? null;
                if (!rangeToRestore) {
                    const resolved = editor.protyle.resolveTrackedRange(target.handle);
                    if (resolved.status !== "resolved") return false;
                    rangeToRestore = resolved.range;
                }
                const selection = window.getSelection();
                if (!selection) return false;
                if (typeof (editor as any).focus === "function") {
                    (editor as any).focus();
                } else if (typeof (editor as any).protyle?.getInstance === "function" && typeof (editor as any).protyle.getInstance()?.focus === "function") {
                    (editor as any).protyle.getInstance().focus();
                } else if (typeof (editor as any).protyle?.element?.focus === "function") {
                    (editor as any).protyle.element.focus();
                }
                try {
                    selection.removeAllRanges();
                    selection.addRange(rangeToRestore);
                } catch {}
                const protyleToolbar = (editor.protyle as unknown as {toolbar?: {range?: Range}})?.toolbar;
                if (protyleToolbar) protyleToolbar.range = rangeToRestore;
            }

            let inserted = false;
            // 渐进增强优先调用官方原子插入接口（SiYuan 3.8.8+）
            try {
                const siyuanApi = siyuan as unknown as {insertContent?: (opts: {data: string; dataType?: string; editor?: Protyle}) => {status: string}};
                if (typeof siyuanApi?.insertContent === "function") {
                    const res = siyuanApi.insertContent({
                        data: markdown,
                        dataType: "markdown",
                        editor,
                    });
                    if (res && res.status === "inserted") {
                        inserted = true;
                    }
                }
            } catch {
                // 忽略异常，平滑降级走 Protyle.insert
            }

            if (!inserted) {
                const protyleInstance = typeof (editor as any).insert === "function"
                    ? editor
                    : (typeof editor.protyle?.getInstance === "function" ? editor.protyle.getInstance() : editor.protyle);

                if (typeof (protyleInstance as any)?.insert === "function") {
                    (protyleInstance as any).insert(markdown, true, false);
                    inserted = true;
                } else if (typeof (editor as any)?.insert === "function") {
                    (editor as any).insert(markdown, true, false);
                    inserted = true;
                }
            }

            if (inserted && typeof cursorOffset === "number" && cursorOffset >= 0) {
                this.positionCursorAtOffset(editor, cursorOffset);
            }

            return inserted;
        } catch {
            return false;
        }
    }

    async writeClipboard(text: string, html?: string): Promise<boolean> {
        return writeRichClipboard(text, html);
    }

    openDoc(docId: string, blockId?: string): boolean {
        try {
            const targetId = blockId || docId;
            if (!targetId) return false;
            if (this.isMobile()) {
                const openMobile = (siyuan as any).openMobileFileById;
                if (typeof openMobile === "function") {
                    openMobile(this.app, targetId, blockId ? ["cb-get-focus", "cb-get-hl"] : undefined);
                    return true;
                }
            }
            openTab({
                app: this.app,
                doc: blockId ? {id: blockId, action: ["cb-get-focus", "cb-get-hl"]} : {id: docId},
            });
            return true;
        } catch {
            return false;
        }
    }

    openAsset(assetPath: string): boolean {
        try {
            openTab({app: this.app, asset: {path: assetPath}});
            return true;
        } catch {
            return false;
        }
    }

    openExternal(url: string): boolean {
        try {
            // 仅 http/https；其余协议拒绝（安全边界）
            if (!/^https?:\/\//i.test(url)) return false;
            // 浏览器/宿主可能拦截新窗口；window.open 返回 null 时必须报告失败。
            return window.open(url, "_blank", "noopener") !== null;
        } catch {
            return false;
        }
    }

    currentDocId(): string | null {
        try {
            const editor = this.resolveActiveEditor();
            const rootID = editor?.protyle?.block?.rootID;
            return typeof rootID === "string" && rootID.length > 0 ? rootID : null;
        } catch {
            return null;
        }
    }

    currentDocInfo(): {docId: string; hPath?: string} | null {
        try {
            const editor = this.resolveActiveEditor();
            const rootID = editor?.protyle?.block?.rootID;
            if (typeof rootID === "string" && rootID.length > 0) {
                const hPath = editor?.protyle?.title?.editElement?.textContent?.trim() || undefined;
                return {docId: rootID, hPath};
            }
            return null;
        } catch {
            return null;
        }
    }
}

export interface ExecutionReceipt {
    ok: boolean;
    mode: InsertMode | "open-source";
    message: string;
    downgraded: boolean;
    pendingVerification: string[];
    /** 实际打开的目标类型；仅 open-source 成功时存在。 */
    opened?: OpenTarget["kind"];
    /** 当模板包含 {{cursor}} / {{xlc:cursor}} / $|$ 锚点时，展开后的光标字符偏移量 */
    cursorOffset?: number | null;
}

export class ActionExecutor {
    constructor(
        private readonly library: LibraryService,
        private readonly host: IHostBridge,
        notify: (kind: "info" | "error", message: string) => void,
        private readonly onItemUsed?: (item: CommonItem) => void,
        private readonly placeholders?: IPlaceholderHook,
    ) {
        // notify 保留在签名中以维持调用方兼容（index.ts 注入）；当前执行器回执走 receipt 返回
        void notify;
    }

    /** provider payload 渲染（xiaolv-common/v1 语义定案）：与库条目一致，插入前应用动态占位符。
     *  提供方如需字面花括号，请使用非 xlc 命名空间。 */
    async renderProviderOutput(text: string): Promise<string | undefined> {
        return this.applyOutput(text);
    }

    /** 对输出载荷应用动态占位符（插入 markdown 与剪贴板文本；存储内容不受影响）。
     *  仅当文本含 title/path/doc 占位符时才取当前文档（避免多余内核往返）。
     *  {{xlc:clipboard}} 异步替换（读取失败=空串，语义同无文档）。
     *  code 条目跳过替换：代码中的 {{xlc:…}} 是字面文本（例如演示模板的代码），绝不能被改写。 */
    /** 公开渲染入口：定向插入（insertToDoc）与 provider payload 共用（R50/R51 语义统一）。
     *  fills：变量填充卡收集的 ask 值（R67）；插入语义，含片段展开（R72）、光标移除与未填充兜底。 */
    async renderForInsert(text: string, item?: CommonItem, fills?: Record<string, string>): Promise<string> {
        let payload = text;
        if (item?.itemType !== "code") {
            payload = await this.library.expandSnippetRefs(payload);
            if (fills) {
                payload = expandAsks(payload, fills);
            }
            payload = extractCleanPayload(applyAskDefaults(stripCursorToken(payload)));
        }
        return (await this.applyOutput(payload, item)) ?? payload;
    }

    private async applyOutput(text: string | undefined, item?: CommonItem): Promise<string | undefined> {
        if (text === undefined) return undefined;
        if (item?.itemType === "code") return text;
        if (!this.placeholders) return text;
        try {
            if (!this.placeholders.enabled()) return text;
            const needsDoc = listPlaceholders(text).some((k) => k === "title" || k === "path" || k === "doc" || k === "selection");
            const docInfo = needsDoc ? await this.placeholders.currentDoc() : null;
            let selectionText = "";
            if (needsDoc && this.placeholders.selection) {
                try {
                    selectionText = (await this.placeholders.selection()) ?? "";
                } catch {
                    selectionText = "";
                }
            }
            const doc = docInfo
                ? {...docInfo, selection: selectionText.slice(0, 4000)}
                : (selectionText ? {title: "", path: "", selection: selectionText.slice(0, 4000)} : null);
            let output = applyPlaceholders(text, this.placeholders.now(), true, doc);
            if ((output.includes("{{xlc:clipboard}}") || output.includes("{{clipboard}}")) && this.placeholders.clipboard) {
                let clipboardText = "";
                try {
                    clipboardText = (await this.placeholders.clipboard()) ?? "";
                } catch {
                    clipboardText = "";
                }
                output = output.replaceAll("{{xlc:clipboard}}", clipboardText.slice(0, 4000)).replaceAll("{{clipboard}}", clipboardText.slice(0, 4000));
            }
            if (output.includes("{{xlc:checkin:today}}")) {
                const checkinSummaryText = await callBridge<any, string>(
                    "checkin",
                    "items.read",
                    (bridge) => {
                        const items = typeof bridge.queryItems === "function"
                            ? bridge.queryItems({ includeArchived: false })
                            : (typeof bridge.getItems === "function" ? bridge.getItems() : []);
                        if (Array.isArray(items)) {
                            const active = items.filter((it: any) => !it.archived);
                            if (active.length === 0) return "今日打卡（无未完成项）";
                            return active.map((i: any) => `✓ ${i.name || i.title || "打卡项"}`).join("\n");
                        }
                        return "（未检测到打卡数据）";
                    },
                    () => "（未检测到小驴打卡）"
                );
                output = output.replaceAll("{{xlc:checkin:today}}", checkinSummaryText);
            }
            if (output.includes("{{xlc:home:today}}") || output.includes("{{xlc:butler:today}}")) {
                const homeSummaryText = await callBridge<any, string>(
                    "home",
                    "reminders.read",
                    (bridge) => {
                        if (typeof bridge.getReminders === "function") {
                            const reminders = bridge.getReminders();
                            if (Array.isArray(reminders)) {
                                if (reminders.length === 0) return "今日备忘提醒（无待办事项）";
                                return reminders.slice(0, 10).map((r: any) => {
                                    const tag = r.daysLeft <= 0 ? "已逾期" : `剩${r.daysLeft}天`;
                                    return `- [ ] ${r.title} (${tag})`;
                                }).join("\n");
                            }
                        }
                        if (typeof bridge.summary === "function") {
                            const s = bridge.summary();
                            return `【管家提醒】今日: ${s.today ?? 0} 项，即将到期: ${s.soon ?? 0} 项，逾期: ${s.overdue ?? 0} 项`;
                        }
                        return "（暂无管家待办数据）";
                    },
                    () => "（未检测到小驴管家）"
                );
                output = output.replaceAll("{{xlc:home:today}}", homeSummaryText)
                               .replaceAll("{{xlc:butler:today}}", homeSummaryText);
            }
            if (output.includes("{{xlc:task:today}}")) {
                const taskSummaryText = await callBridge<any, string>(
                    "taskHorizon",
                    "tasks.read",
                    async (bridge) => {
                        let tasks: any[] = [];
                        if (typeof bridge.getTodayTasks === "function") {
                            tasks = await bridge.getTodayTasks();
                        } else if (typeof bridge.queryTasks === "function") {
                            const res = await bridge.queryTasks({ date: "today", scope: "all", limit: 10, includeCompleted: false });
                            tasks = res?.tasks || [];
                        }
                        if (Array.isArray(tasks)) {
                            const active = tasks.filter((t: any) => !t.done);
                            if (active.length === 0) return "今日任务（全数已完成）";
                            return active.slice(0, 10).map((t: any) => `- [ ] ${t.title || "待办任务"}`).join("\n");
                        }
                        return "（暂无今日任务）";
                    },
                    () => "（未检测到任务视界）"
                );
                output = output.replaceAll("{{xlc:task:today}}", taskSummaryText);
            }
            if (output.includes("{{xlc:glean:recent}}")) {
                const gleanSummaryText = await callBridge<any, string>(
                    "glean",
                    "clips.read",
                    async (bridge) => {
                        if (typeof bridge.listClips === "function") {
                            const clips = await bridge.listClips({ limit: 5 });
                            if (Array.isArray(clips)) {
                                if (clips.length === 0) return "最近剪藏（暂无摘录）";
                                return clips.map((c: any) => {
                                    const link = c.url ? `[${c.title || "剪藏"}](${c.url})` : `**${c.title || "剪藏"}**`;
                                    return c.summary ? `- ${link}\n  > ${c.summary.slice(0, 100)}` : `- ${link}`;
                                }).join("\n");
                            }
                        }
                        return "（暂无剪藏数据）";
                    },
                    () => "（未检测到小驴拾遗）"
                );
                output = output.replaceAll("{{xlc:glean:recent}}", gleanSummaryText);
            }
            if (output.includes("{{xlc:contacts:recent}}")) {
                const contactsSummaryText = await callBridge<any, string>(
                    "contacts",
                    "people.read",
                    async (bridge) => {
                        if (typeof bridge.searchPeople === "function") {
                            const people = await bridge.searchPeople("");
                            if (Array.isArray(people)) {
                                if (people.length === 0) return "人脉名录（暂无联系人）";
                                return people.slice(0, 5).map((p: any) => {
                                    const org = p.organization ? ` (${p.organization})` : "";
                                    const role = p.role ? ` · ${p.role}` : "";
                                    return `· **${p.name || "联系人"}**${org}${role}`;
                                }).join("\n");
                            }
                        }
                        return "（暂无联系人数据）";
                    },
                    () => "（未检测到小驴人脉）"
                );
                output = output.replaceAll("{{xlc:contacts:recent}}", contactsSummaryText);
            }
            if (output.includes("{{xlc:cards:today}}") || output.includes("{{xlc:flashcard:today}}")) {
                const cardsSummaryText = await callBridge<any, string>(
                    "cards",
                    "cards.read",
                    async (bridge) => {
                        if (typeof bridge.getDueSummary === "function") {
                            const res = await bridge.getDueSummary();
                            const data = res?.data || res;
                            if (data && typeof data.unreviewedCount === "number") {
                                if (data.unreviewedCount === 0) return "今日闪卡（全部复习完毕）";
                                return `【闪卡复习】今日待复习: ${data.unreviewedCount} 张 (新卡: ${data.unreviewedNewCardCount ?? 0}, 待复习: ${data.unreviewedOldCardCount ?? 0})`;
                            }
                        }
                        if (typeof bridge.getStats === "function") {
                            const res = await bridge.getStats();
                            const data = res?.data || res;
                            if (data) {
                                return `【闪卡概览】连续: ${data.streak ?? 0} 天，今日已复习: ${data.todayReviews ?? 0} 张`;
                            }
                        }
                        return "（暂无闪卡数据）";
                    },
                    () => "（未检测到小驴闪卡）"
                );
                output = output.replaceAll("{{xlc:cards:today}}", cardsSummaryText)
                               .replaceAll("{{xlc:flashcard:today}}", cardsSummaryText);
            }
            if (output.includes("{{xlc:exam:today}}") || output.includes("{{xlc:exam:stats}}")) {
                const examSummaryText = await callBridge<any, string>(
                    "exam",
                    "exam.read",
                    async (bridge) => {
                        if (typeof bridge.statsRead === "function") {
                            const s = await bridge.statsRead();
                            const data = s?.data || s;
                            if (data) {
                                const todayStr = formatLocalDate();
                                const todayItem = Array.isArray(data.daily) ? data.daily.find((d: any) => d.date === todayStr) : null;
                                const todayAnswered = data.todayAnswered ?? todayItem?.attempts ?? 0;
                                const accuracy = data.accuracy ?? data.accuracyPercent ?? 0;
                                const wrongCount = data.activeWrong ?? data.wrongbookCount ?? 0;
                                const streakDays = data.streak ?? 0;
                                return `【小驴考试】今日刷题: ${todayAnswered} 道，正确率: ${accuracy}%，错题在册: ${wrongCount} 题${streakDays > 0 ? ` (连续 ${streakDays} 天)` : ""}`;
                            }
                        }
                        return "（暂无考试数据）";
                    },
                    () => "（未检测到小驴考试）"
                );
                output = output.replaceAll("{{xlc:exam:today}}", examSummaryText)
                               .replaceAll("{{xlc:exam:stats}}", examSummaryText);
            }
            if (output.includes("{{xlc:raikiri:active}}") || output.includes("{{xlc:speedswitch:active}}")) {
                const raikiriSummaryText = await callBridge<any, string>(
                    "raikiri",
                    "navigation.context",
                    (bridge) => {
                        if (typeof bridge.getNavigationContext === "function") {
                            const raw = bridge.getNavigationContext();
                            const ctx = raw?.data || raw;
                            if (ctx && ctx.currentDocTitle) {
                                return `当前文档：${ctx.currentDocTitle} (${ctx.currentDocId || ""})`;
                            }
                        }
                        return "（无活动导航上下文）";
                    },
                    () => "（未检测到小驴雷切）"
                );
                output = output.replaceAll("{{xlc:raikiri:active}}", raikiriSummaryText)
                               .replaceAll("{{xlc:speedswitch:active}}", raikiriSummaryText);
            }
            return output;
        } catch {
            return text;
        }
    }

    private async resolveContent(item: CommonItem): Promise<{kramdown: string; sourceMissing: boolean; assetMissing: boolean} | null> {
        const health = await this.library.checkSourceHealth(item);
        const h: SourceHealth = health.ok ? health.data : {blockMissing: false, docMissing: false, assetMissing: false};
        const sourceMissing = item.itemType === "blockref" ? h.blockMissing : h.blockMissing || h.docMissing;
        if (item.itemType === "blockref" && sourceMissing) {
            return {kramdown: "", sourceMissing: true, assetMissing: false};
        }
        const kramdown = await this.library.getItemKramdown(item);
        if (!kramdown.ok) return null;
        return {
            kramdown: kramdown.data,
            // libraryDocId 是条目所在库文档，不能用它掩盖 sourceDocId 的失效。
            // 来源文档/块任一失效都必须传入计划层，openSource 才能返回 source-missing。
            sourceMissing,
            assetMissing: h.assetMissing,
        };
    }

    private emitEvent(eventName: string, item: CommonItem, extra?: Record<string, unknown>): void {
        try {
            const now = Date.now();
            const at = new Date(now).toISOString();
            const eventId = `evt-xlc-${now}-${Math.random().toString(36).slice(2, 8)}`;
            const payload = {
                protocolVersion: PROTOCOL_VERSION,
                itemId: item.id,
                itemType: item.itemType,
                ...extra,
            };
            window.dispatchEvent(new CustomEvent(eventName, {
                detail: {
                    // 向后兼容平铺字段
                    protocolVersion: PROTOCOL_VERSION,
                    itemId: item.id,
                    itemType: item.itemType,
                    ...extra,
                    // Epoch 6 生态统一事件总线信封
                    v: 1,
                    source: "xiaolv-common",
                    type: eventName,
                    eventId,
                    at,
                    payload,
                    idempotencyKey: `${eventName}:${item.id}:${now}`,
                },
            }));
        } catch {
            // 事件失败不影响主流程
        }
    }

    /** 现场解析条目内容；先展开片段引用（F5，code 条目不处理），再应用变量填充卡的 ask 值。 */
    /** 使用记录统一出口（F3）：侧车失败不影响动作回执 */
    private noteUsed(item: CommonItem): void {
        try {
            this.onItemUsed?.(item);
        } catch {
            // 忽略
        }
        try {
            const snippetTitle = item.title || item.summary || "常用模版";
            lvActivity.record({
                source: "常用",
                category: "note",
                title: `应用常用模版「${snippetTitle}」`,
                linkBlockId: item.blockId || item.id,
            });
        } catch {
            // 活动广播失败不影响主流程
        }
    }

    private async resolveWithFills(item: CommonItem, fills?: Record<string, string>, context?: {before?: string; after?: string; docTitle?: string; smartExpand?: boolean}) {
        const content = await this.resolveContent(item);
        if (!content) return null;
        if (item.itemType !== "code") {
            let kramdown = await this.library.expandSnippetRefs(content.kramdown);
            if (fills) {
                kramdown = expandAsks(kramdown, fills);
            } else if (context?.smartExpand) {
                try {
                    kramdown = await aiSmartExpandTemplate(kramdown, context);
                } catch {
                    // 降级使用普通展开
                }
            }
            content.kramdown = kramdown;
        }
        return content;
    }

    /** Capture before a caller starts lookup/queue work and release after its entire action. */
    async withInsertTargetScope<T>(mode: InsertMode, action: (target: EditorInsertTargetSnapshot | null | undefined) => Promise<T>): Promise<T> {
        if (!mode.startsWith("insert") || typeof this.host.captureInsertTarget !== "function") return action(undefined);
        const editorTarget = this.host.captureInsertTarget();
        try {
            // Await is required: execute can still resolve placeholders or the clipboard.
            return await action(editorTarget);
        } finally {
            if (editorTarget !== undefined) this.host.releaseInsertTarget(editorTarget);
        }
    }

    run(item: CommonItem, mode: InsertMode, opts?: {fills?: Record<string, string>; editorTarget?: EditorInsertTargetSnapshot | null; smartExpand?: boolean; context?: {before?: string; after?: string; docTitle?: string}}): Promise<ExecutionReceipt> {
        // Supplied targets belong to a search dialog or an outer service scope.
        const ctxOptions = opts?.smartExpand ? { ...opts.context, smartExpand: true } : opts?.context;
        if (opts?.editorTarget !== undefined) return this.runAtTarget(item, mode, opts.fills, opts.editorTarget, ctxOptions);
        return this.withInsertTargetScope(mode, (target) => this.runAtTarget(item, mode, opts?.fills, target, ctxOptions));
    }

    private async runAtTarget(item: CommonItem, mode: InsertMode, fills: Record<string, string> | undefined, editorTarget: EditorInsertTargetSnapshot | null | undefined, context?: {before?: string; after?: string; docTitle?: string; smartExpand?: boolean}): Promise<ExecutionReceipt> {
        const content = await this.resolveWithFills(item, fills, context);
        if (!content) {
            return {ok: false, mode, message: "kernel-error:content", downgraded: false, pendingVerification: []};
        }
        if (item.itemType === "blockref" && content.sourceMissing && (mode === "copy" || mode === "copy-content" || mode === "insert-content")) {
            return {ok: false, mode, message: "source-missing", downgraded: true, pendingVerification: []};
        }
        const ctx: ActionContext = {
            surface: this.host.isMobile() ? "mobile" : "desktop",
            hasActiveEditor: editorTarget !== undefined
                ? this.host.canInsertAtTarget(editorTarget)
                : this.host.hasActiveEditor(),
            content,
        };
        const plan: InsertPlan = planAction(item, mode, ctx);
        if (plan.downgraded && plan.downgradeReason === "source-missing") {
            return {ok: false, mode: plan.mode, message: "source-missing", downgraded: true, pendingVerification: plan.pendingVerification};
        }
        if ((plan.mode === "copy" || plan.mode === "copy-content") && !plan.clipboardText) {
            return {ok: false, mode: plan.mode, message: "empty-plan", downgraded: plan.downgraded, pendingVerification: plan.pendingVerification};
        }
        return this.execute(item, plan, editorTarget);
    }

    private async execute(item: CommonItem, plan: InsertPlan, editorTarget?: EditorInsertTargetSnapshot | null): Promise<ExecutionReceipt> {
        // 插入语义输出：未填充 ask 兜底为 __名称__（可见可改），计算光标偏移并移除光标标记；复制路径保持模板原样
        const insertRenderWithCursor = async (text: string | undefined): Promise<{text: string | undefined; cursorOffset: number | null}> => {
            if (text === undefined) return {text: undefined, cursorOffset: null};
            if (item.itemType === "code" || plan.mode === "insert-ref" || plan.mode === "insert-embed") return {text, cursorOffset: null};
            const withDefaults = applyAskDefaults(text);
            const withOutput = (await this.applyOutput(withDefaults, item)) ?? withDefaults;
            const extracted = extractCursorPosition(withOutput);
            return {text: stripCursorToken(extracted.text), cursorOffset: extracted.cursorOffset};
        };
        // 移动端插入未验证：诚实降级为复制（B-002 解除后复核）
        if ((plan.mode === "insert" || plan.mode === "insert-content" || plan.mode === "insert-ref" || plan.mode === "insert-embed") && this.host.isMobile()) {
            const rendered = await insertRenderWithCursor(plan.markdown);
            const text = rendered.text ?? "";
            let html: string | undefined;
            if (item.itemType === "markdown" || (item.itemType === "text" && isMarkdownFormattingPresent(text))) {
                html = renderSafeHtmlFromMarkdown(text);
            }
            const copied = text ? await this.host.writeClipboard(text, html) : false;
            if (copied) {
                this.noteUsed(item);
            }
            return {
                ok: copied,
                mode: plan.mode,
                message: copied ? "insert-downgraded-copied" : "copy-failed",
                downgraded: true,
                pendingVerification: ["mobile-insert-unverified", ...plan.pendingVerification],
                ...(rendered.cursorOffset !== null ? {cursorOffset: rendered.cursorOffset} : {}),
            };
        }
        if (plan.mode === "insert" || plan.mode === "insert-content" || plan.mode === "insert-ref" || plan.mode === "insert-embed") {
            const currentDocId = editorTarget?.docId || this.host.currentDocId() || "";
            return withDocLock(currentDocId, async () => {
                const rendered = await insertRenderWithCursor(plan.markdown);
                const md = rendered.text ?? "";
                if (!md) {
                    return {ok: false, mode: plan.mode, message: "empty-plan", downgraded: plan.downgraded, pendingVerification: plan.pendingVerification};
                }
                const targetAvailable = editorTarget !== undefined
                    ? this.host.canInsertAtTarget(editorTarget)
                    : this.host.hasActiveEditor();
                if (!targetAvailable) {
                    let html: string | undefined;
                    if (item.itemType === "markdown" || (item.itemType === "text" && isMarkdownFormattingPresent(md))) {
                        html = renderSafeHtmlFromMarkdown(md);
                    }
                    const copied = await this.host.writeClipboard(md, html);
                    if (copied) {
                        this.noteUsed(item);
                    }
                    return {
                        ok: copied,
                        mode: plan.mode,
                        message: copied
                            ? editorTarget?.editor ? "target-unavailable-copied" : "no-editor-copied"
                            : "no-editor-copy-failed",
                        downgraded: true,
                        pendingVerification: plan.pendingVerification,
                        ...(rendered.cursorOffset !== null ? {cursorOffset: rendered.cursorOffset} : {}),
                    };
                }
                const inserted = this.host.insertMarkdown(md, editorTarget, rendered.cursorOffset);
                if (inserted) {
                    this.emitEvent(EVENTS.itemInserted, item, {
                        insertMode: plan.mode,
                        ...(rendered.cursorOffset !== null ? {cursorOffset: rendered.cursorOffset} : {}),
                    });
                    this.noteUsed(item);
                }
                return {
                    ok: inserted,
                    mode: plan.mode,
                    message: inserted ? "inserted" : "insert-failed",
                    downgraded: false,
                    pendingVerification: plan.pendingVerification,
                    ...(rendered.cursorOffset !== null ? {cursorOffset: rendered.cursorOffset} : {}),
                };
            });
        }
        if (plan.mode === "copy" || plan.mode === "copy-content") {
            const text = (await this.applyOutput(plan.clipboardText, item)) ?? "";
            let html: string | undefined;
            if (item.itemType === "markdown" || (item.itemType === "text" && isMarkdownFormattingPresent(text))) {
                html = renderSafeHtmlFromMarkdown(text);
            }
            const copied = await this.host.writeClipboard(text, html);
            // F3 口径：复制成功同样计使用（最近 + 计数）
            if (copied) {
                this.noteUsed(item);
            }
            return {
                ok: copied,
                mode: plan.mode,
                message: copied ? "copied" : "copy-failed",
                downgraded: plan.downgraded,
                pendingVerification: plan.pendingVerification,
            };
        }
        if (plan.mode === "open" && plan.open) {
            return this.openTarget(plan.open, item);
        }
        return {ok: false, mode: plan.mode, message: "unsupported", downgraded: false, pendingVerification: plan.pendingVerification};
    }

    private async openTarget(target: OpenTarget, _item: CommonItem): Promise<ExecutionReceipt> {
        let opened = false;
        if (target.kind === "url" && target.url) opened = this.host.openExternal(target.url);
        else if (target.kind === "asset" && target.assetPath) opened = this.host.openAsset(target.assetPath);
        else if (target.kind === "block" && target.blockId) opened = this.host.openDoc(target.docId ?? "", target.blockId);
        else if (target.kind === "doc" && target.docId) opened = this.host.openDoc(target.docId);
        return {
            ok: opened,
            mode: "open-source",
            message: opened ? "source-opened" : "open-failed",
            downgraded: false,
            pendingVerification: [],
            ...(opened ? {opened: target.kind} : {}),
        };
    }

    async openSource(item: CommonItem): Promise<ExecutionReceipt> {
        const content = await this.resolveContent(item);
        if (!content) {
            return {ok: false, mode: "open-source", message: "kernel-error:content", downgraded: false, pendingVerification: []};
        }
        const planned = planOpenSource(item, content);
        if (planned.failure || !planned.target) {
            return {
                ok: false,
                mode: "open-source",
                message: planned.failure ?? "not-found",
                downgraded: true,
                pendingVerification: [],
            };
        }
        return this.openTarget(planned.target, item);
    }
}
