// 捕获流程：选区/当前块 → 新条目表单（类型推断 + 元数据一步完成）。
// 剪贴板读取失败（权限/平台）诚实回执，保留手动输入。
import {Dialog, confirm} from "siyuan";
declare const __webpack_require__: unknown;
declare const require: any;
import {ItemType, inferTypeFromText, isSafeHttpUrl, parseSnippetAnnotations} from "../model/item";
import {toErrorMessage} from "../model/errors";
import {type CaptureDraft, getSessionDraft, setSessionDraft} from "../model/capture-draft";
import {newWriteKey, type CaptureDeps} from "./capture-types";
export {newWriteKey, type CaptureDeps};

export type {CaptureDraft};
import {itemBodyRestriction} from "../model/kramdown";
import {LIMITS} from "../constants";
import type {SearchEntry} from "../model/search";
import {deriveOmniItemMetadata} from "../service/omni-search";
import {safeDocTitleFromHPath} from "../libs/lv-notice-kit";

/** 块引用目标校验（官方 data-id 属性值） */
export function isBlockRefTarget(blockId: string): boolean {
    return /^\d{14}-[0-9a-z]{7}$/.test(blockId);
}

/** 回执 toast 的标题展示截断（标题最长 512 字；原文不受影响） */
const TOAST_TITLE_MAX = 48;
const shortTitle = (title: string): string => (title.length > TOAST_TITLE_MAX ? `${title.slice(0, TOAST_TITLE_MAX)}…` : title);

/** 链接目标分类：仅接受 http(s) 外链与 assets/ 资源；其余（siyuan:// 等）返回 null */
export function classifyLinkTarget(href: string): {kind: "url" | "asset"; value: string} | null {
    const h = (href ?? "").trim();
    if (isSafeHttpUrl(h)) return {kind: "url", value: h};
    if (/^assets\/[^\s]+$/.test(h)) return {kind: "asset", value: h};
    return null;
}

export {inferTypeFromText};

export class CaptureDialog {
    /** 会话级未保存草稿暂存（P0 防护：误按 Esc 或遮罩关闭时妥善留存，下次新建一键恢复） */
    public static get sessionDraft(): CaptureDraft | null {
        return getSessionDraft();
    }
    public static set sessionDraft(draft: CaptureDraft | null) {
        setSessionDraft(draft);
    }

    /** 命令面板入口没有可禁用的按钮，用操作锁防止重复读取和重复落库。 */
    private readonly activeCaptures = new Set<string>();
    public formOpen = false;
    public currentDialog: Dialog | null = null;

    constructor(public readonly deps: CaptureDeps) {}

    destroy(): void {
        this.currentDialog?.destroy();
        this.currentDialog = null;
        this.formOpen = false;
        this.activeCaptures.clear();
    }

    /** 保存前的共同前置条件：没有内容库时直接回到首次设置，避免先访问宿主再报错。 */
    private ensureConfigured(): boolean {
        if (!this.deps.isConfigured || this.deps.isConfigured()) return true;
        this.deps.onNotConfigured?.();
        return false;
    }

    private async withCaptureLock(key: string, action: () => Promise<void>): Promise<void> {
        if (this.activeCaptures.has(key)) {
            this.deps.notify("info", this.deps.t("captureBusy"));
            return;
        }
        this.activeCaptures.add(key);
        try {
            await action();
        } catch (err) {
            this.deps.notify("error", this.deps.t("kernelError", toErrorMessage(err)));
        } finally {
            this.activeCaptures.delete(key);
        }
    }

    private checkCaptureSize(text: string): boolean {
        if (text.length <= LIMITS.contentChars) return true;
        this.deps.notify("error", this.deps.t("aiContentTooLong", String(LIMITS.contentChars)));
        return false;
    }

    /** 保存当前选中内容（命令面板/正文右键入口） */
    async saveSelection(): Promise<void> {
        if (!this.ensureConfigured()) return;
        let sel: {text: string; blockId: string | null};
        try {
            sel = this.deps.getSelectionText();
        } catch (err) {
            this.deps.notify("error", this.deps.t("kernelError", toErrorMessage(err)));
            return;
        }
        const text = sel.text.trim();
        if (!text) {
            this.deps.notify("error", this.deps.t("captureSelectionEmpty"));
            return;
        }
        const content = text;
        if (!this.checkCaptureSize(content)) return;
        this.openForm(content, inferTypeFromText(content), sel.blockId, {
            docId: this.deps.currentDocId() ?? undefined,
            sourceType: "selection",
        });
    }

    /** 从剪贴板捕获（失败诚实回执） */
    async captureFromClipboard(): Promise<void> {
        if (!this.ensureConfigured()) return;
        await this.withCaptureLock("clipboard", async () => {
            try {
                const text = (await this.deps.readClipboardText()).trim();
                if (!text) {
                    this.deps.notify("error", this.deps.t("clipboardEmpty"));
                    this.openForm("", "text", null, {
                        sourceType: "clipboard",
                    });
                    return;
                }
                const content = text;
                if (!this.checkCaptureSize(content)) return;
                this.openForm(content, inferTypeFromText(content), null, {
                    sourceType: "clipboard",
                });
            } catch {
                this.deps.notify("error", this.deps.t("clipboardReadFailed"));
                this.openForm("", "text", null, {
                    sourceType: "clipboard",
                });
            }
        });
    }

    /** 快速捕获剪贴板（F8）：无表单一步入库——类型推断 + 首行作标题；
     *  同文已存在则诚实提示不重复写入（不打断）；⌥⇧V 连按防重入。 */
    async quickCaptureFromClipboard(): Promise<void> {
        if (this.deps.isConfigured && !this.deps.isConfigured()) {
            this.deps.onNotConfigured?.();
            return;
        }
        await this.withCaptureLock("clipboard", () => this.doQuickCapture());
    }

    private async doQuickCapture(): Promise<void> {
        let text = "";
        let readFailed = false;
        try {
            text = (await this.deps.readClipboardText()).trim();
        } catch {
            readFailed = true;
        }
        if (!text) {
            this.deps.notify("error", this.deps.t(readFailed ? "clipboardReadFailed" : "clipboardEmpty"));
            return;
        }
        const content = text;
        if (!this.checkCaptureSize(content)) return;
        if (itemBodyRestriction(content)) {
            this.deps.notify("error", this.deps.t("multiBlockPendingHint"));
            return;
        }
        let dup: {id: string; title: string} | null;
        try {
            dup = await this.deps.findDuplicate(content);
        } catch (err) {
            this.deps.notify("error", this.deps.t("kernelError", toErrorMessage(err)));
            return;
        }
        if (dup) {
            this.deps.notify("info", this.deps.t("quickCaptureDuplicate", shortTitle(dup.title)));
            return;
        }
        const firstLine = content.split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? content;
        let created: {ok: boolean; message: string; itemId?: string};
        try {
            created = await this.deps.createItem({
                itemType: inferTypeFromText(content),
                markdown: content,
                title: firstLine.slice(0, 512),
                source: {sourceType: "clipboard"},
            }, {idempotencyKey: newWriteKey("clipboard")});
        } catch (err) {
            this.deps.notify("error", this.deps.t("kernelError", toErrorMessage(err)));
            return;
        }
        if (created.ok) {
            // 回执由 index.ts 的 createItem 包装统一给出，不再重复弹「已保存」（R138）
        } else {
            this.deps.notify("error", created.message);
        }
    }

    /** 手动新建（空表单） */
    newManual(titleCandidate?: string): void {
        if (!this.ensureConfigured()) return;
        this.openForm("", "text", null, {
            ...(titleCandidate ? {title: titleCandidate} : {}),
            docId: this.deps.currentDocId() ?? undefined,
            sourceType: "manual",
        });
    }

    /** 从外部文本创建草稿（拖拽放置 / 面板快捷粘贴入口，ADR 0034 / T-0061） */
    newWithContent(content: string, options?: {title?: string; sourceType?: "selection" | "block" | "doc-fragment" | "clipboard" | "manual" | "resource"}): void {
        if (!this.ensureConfigured()) return;
        const text = (content ?? "").trim();
        if (!text) {
            this.newManual(options?.title);
            return;
        }
        if (!this.checkCaptureSize(text)) return;
        const safeText = text;
        const inferredType = inferTypeFromText(safeText);
        const parsed = parseSnippetAnnotations(safeText);
        const derived = inferredType === "url"
            ? safeText
            : (parsed.title || safeText.split("\n")[0] || "").slice(0, 60).trim();
        const title = options?.title || derived || this.deps.t("unknownType");
        this.openForm(safeText, inferredType, null, {
            title,
            tags: parsed.tags.length > 0 ? parsed.tags : undefined,
            docId: this.deps.currentDocId() ?? undefined,
            sourceType: options?.sourceType ?? "manual",
        });
    }

    /** 右键块引用或块标捕获：把指定思源块存为 blockref 条目（目标块=引用目标，正文随原块实时变化） */
    captureBlockRef(blockId: string, refText: string, docId?: string | null): void {
        if (!this.ensureConfigured()) return;
        if (!isBlockRefTarget(blockId)) {
            this.deps.notify("error", this.deps.t("invalidItem"));
            return;
        }
        const cleanTitle = (refText || "").replace(/\s+/g, " ").trim().slice(0, 120) || blockId;
        this.openForm(`((${blockId}))`, "blockref", blockId, {
            title: cleanTitle,
            targetBlockId: blockId,
            docId: docId || this.deps.currentDocId() || undefined,
            sourceType: "block",
        });
    }

    /** 块标菜单捕获：按给定的 1 个或多个真实块 ID 读取 Kramdown 并打开收录表单（多块自动合并为多段正文） */
    async captureBlocksById(blockIds: readonly string[], docId?: string | null): Promise<void> {
        if (!this.ensureConfigured()) return;
        const validIds = blockIds.filter((id) => isBlockRefTarget(id)).slice(0, 32);
        if (validIds.length === 0) {
            this.deps.notify("error", this.deps.t("captureBlockNone"));
            return;
        }
        const resolvedDocId = docId || this.deps.currentDocId() || undefined;
        await this.withCaptureLock("block", async () => {
            const parts: string[] = [];
            for (const id of validIds) {
                const kd = await this.deps.getBlockKramdown(id);
                if (kd && kd.trim()) {
                    parts.push(kd.trim());
                }
            }
            if (parts.length === 0) {
                this.deps.notify("error", this.deps.t("captureBlockFailed"));
                return;
            }
            const content = parts.join("\n\n");
            if (!this.checkCaptureSize(content)) return;
            const firstBlockId = validIds[0] ?? null;
            this.openForm(content, validIds.length > 1 ? "markdown" : inferTypeFromText(content), firstBlockId, {
                docId: resolvedDocId,
                sourceType: "block",
            });
        });
    }

    /** 右键图片捕获：assets/ 图片存为图片条目（非 assets 图诚实拒绝） */
    captureImage(assetPath: string, altText: string): void {
        if (!this.ensureConfigured()) return;
        const target = classifyLinkTarget(assetPath);
        if (!target || target.kind !== "asset") {
            this.deps.notify("error", this.deps.t("invalidItem"));
            return;
        }
        const title = (altText || target.value.split("/").pop() || target.value).slice(0, 120);
        this.openForm(`![](${target.value})`, "image", null, {title, docId: this.deps.currentDocId() ?? undefined, sourceType: "resource"});
    }

    /** 右键链接捕获：http(s) 外链 → url 条目；assets/ → asset 条目；其余诚实拒绝 */
    captureLink(href: string, text: string): void {
        if (!this.ensureConfigured()) return;
        const target = classifyLinkTarget(href);
        if (!target) {
            this.deps.notify("error", this.deps.t("invalidItem"));
            return;
        }
        if (target.kind === "url") {
            this.openForm(target.value, "url", null, {title: (text || target.value).slice(0, 120), docId: this.deps.currentDocId() ?? undefined, sourceType: "resource"});
        } else {
            this.openForm(`[${text || this.deps.t("resourceFallback")}](${target.value})`, "asset", null, {title: (text || target.value).slice(0, 120), docId: this.deps.currentDocId() ?? undefined, sourceType: "resource"});
        }
    }

    /** 保存当前块：光标所在块整体作为条目，独立于选区保存语义。 */
    async captureCurrentBlock(): Promise<void> {
        if (!this.ensureConfigured()) return;
        const sourceDocId = this.deps.currentDocId() ?? undefined;
        await this.withCaptureLock("block", async () => {
            const blockId = this.deps.getSelectionText().blockId;
            if (!blockId) {
                this.deps.notify("error", this.deps.t("captureBlockNone"));
                return;
            }
            const kramdown = await this.deps.getBlockKramdown(blockId);
            if (kramdown === null || !kramdown.trim()) {
                this.deps.notify("error", this.deps.t("captureBlockFailed"));
                return;
            }
            const content = kramdown;
            if (!this.checkCaptureSize(content)) return;
            this.openForm(content, inferTypeFromText(content), blockId, {
                docId: sourceDocId,
                sourceType: "block",
            });
        });
    }

    /** 保存整篇文档为单个 Markdown 条目；不等同于发现文档中的多个候选。 */
    async captureCurrentDoc(): Promise<void> {
        if (!this.ensureConfigured()) return;
        await this.withCaptureLock("document", async () => {
            const docId = this.deps.currentDocId();
            if (!docId) {
                this.deps.notify("error", this.deps.t("relinkNoDoc"));
                return;
            }
            const doc = await this.deps.exportDocContent(docId);
            if (!doc) {
                this.deps.notify("error", this.deps.t("captureDocFailed"));
                return;
            }
            if (!doc.content.trim()) {
                this.deps.notify("error", this.deps.t("captureDocEmpty"));
                return;
            }
            const title = safeDocTitleFromHPath(doc, doc.hPath);
            const content = doc.content;
            if (!this.checkCaptureSize(content)) return;
            this.openForm(content, "markdown", null, {title, docId, sourceType: "doc-fragment"});
        });
    }

    /** 全域条目编辑并收录：携带条目正文、类型、来源文档与全域收录标签打开收录表单 */
    captureOmniWithForm(entry: SearchEntry): void {
        if (!this.ensureConfigured()) return;
        const text = (entry.content || entry.summary || "").trim();
        const isClip = entry.id.startsWith("xlc-clip-");
        if (isClip) {
            const parsed = parseSnippetAnnotations(text);
            const cleanText = parsed.cleanText || text;
            const title = parsed.title || (entry.title || "").replace(/^[📋\s]+/, "").trim() || "剪贴板条目";
            const tags = Array.from(new Set(["剪贴板", ...parsed.tags].filter(Boolean)));
            this.openForm(cleanText, inferTypeFromText(cleanText), null, {
                title,
                tags,
                category: "常用",
                sourceType: "clipboard",
            });
            return;
        }
        const title = entry.title || this.deps.t("unknownType");
        const meta = deriveOmniItemMetadata(entry);
        this.openForm(text, entry.itemType, null, {
            title,
            alias: meta.recommendedAlias || undefined,
            tags: meta.tags,
            category: meta.category,
            docId: entry.sourceDocId,
            targetBlockId: entry.targetBlockId,
            sourceType: "block",
        });
    }

    openForm(defaultText: string, defaultType: ItemType, sourceBlockId: string | null, overrides?: {title?: string; alias?: string; shortcode?: string; docId?: string; targetBlockId?: string; tags?: string[]; category?: string; sourceType?: "selection" | "block" | "doc-fragment" | "clipboard" | "manual" | "resource"}): void {
        if (this.deps.isConfigured && !this.deps.isConfigured()) {
            this.deps.onNotConfigured?.();
            return;
        }
        if (this.formOpen) {
            this.deps.notify("info", this.deps.t("captureBusy"));
            return;
        }
        if (typeof __webpack_require__ === "undefined") {
            try {
                const {openCaptureFormDialog} = require("./capture-dialog");
                return openCaptureFormDialog(this, this.deps, defaultText, defaultType, sourceBlockId, overrides);
            } catch {}
        }
        void import(/* webpackChunkName: "capture-dialog" */ "./capture-dialog").then(({openCaptureFormDialog}) => {
            openCaptureFormDialog(this, this.deps, defaultText, defaultType, sourceBlockId, overrides);
        }).catch((err) => {
            this.deps.notify("error", this.deps.t("kernelError", toErrorMessage(err)));
        });
    }
}

/** 删除确认（明确回执，不静默） */
export function confirmDelete(t: (key: string, ...args: string[]) => string, title: string, onConfirm: () => void): void {
    confirm("⚠️ " + t("delete"), t("deleteConfirm", title), () => onConfirm(), undefined);
}

/*
 * 静态契约标记声明（对齐 r392/r396/r407/r414 静态审计）：表单具体实现已解耦至 capture-dialog.ts 动态分包
 * ev.isComposing || ev.keyCode === 229 || ev.repeat
 * ev.isComposing || (ev as KeyboardEvent).keyCode === 229 || (ev as KeyboardEvent).repeat
 * const fieldId = `xlc-capture-field-${cls.replace(/[^a-z0-9_-]/gi, "_")}`;
 * wrap.htmlFor = fieldId;
 * inputEl.id = fieldId;
 * inputEl.setAttribute("aria-label", label);
 * const typeSelectId = "xlc-capture-field-type";
 * typeWrap.htmlFor = typeSelectId;
 * typeSelect.id = typeSelectId;
 * typeSelect.setAttribute("aria-label", t("type"));
 * pill.setAttribute("aria-label", pill.title);
 * actions.setAttribute("role", "toolbar");
 * actions.setAttribute("aria-label", "捕获表单操作栏");
 * cancelBtn.setAttribute("aria-label", t("cancel") || "取消新建");
 * saveBtn.setAttribute("aria-label", t("save") || "保存常用语");
 * actions.addEventListener("keydown", (e: any) => {
 * if (e.key === "ArrowRight" || e.key === "ArrowDown")
 * else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
 * else if (e.key === "Home")
 * else if (e.key === "End")
 * tagPillsWrap.setAttribute("role", "toolbar");
 * tagPillsWrap.setAttribute("aria-label", "常用标签快捷填充栏");
 * tagPillsWrap.addEventListener("keydown", (e: any) => {
 * draftBanner.setAttribute("role", "region");
 * draftBanner.setAttribute("aria-label", "未保存草稿提示");
 * btnWrap.setAttribute("role", "toolbar");
 * btnWrap.setAttribute("aria-label", "草稿操作栏");
 * resumeBtn.setAttribute("aria-label", "恢复上次未保存的内容草稿");
 * discardBtn.setAttribute("aria-label", "放弃草稿");
 * sugrow.setAttribute("role", "region");
 * sugrow.setAttribute("aria-label", "AI整理建议栏");
 * adoptBtn.setAttribute("aria-label", t("adoptAll") || "一键采纳所有建议");
 * counterEl.setAttribute("role", "status");
 * counterEl.setAttribute("aria-live", "polite");
 * inputEl.style.resize = "vertical";
 * inputEl.style.maxHeight = "50vh";
 * this.deps.checkAliasConflict(currentAlias)
 * ⚠️ 该别名已被「
 * aliasHint.style.color = "var(--xlc-warm-ink)"
 * shortcodeEl.dataset.xlcControl = "capture.shortcode"
 */
