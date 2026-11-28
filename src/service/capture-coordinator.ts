// 捕获流程协调器（CaptureCoordinator）
// 统筹选区内容校验、条目类型推断、草稿状态托管、落库事务与统一生命周期。
import {LibraryService, NewItemInput, Receipt, WriteOptions} from "./library";
import {HostBridge} from "./commands";
import {CommonItem, ItemType, inferTypeFromText} from "../model/item";
import {type CaptureDraft, getSessionDraft, setSessionDraft} from "../model/capture-draft";
import {IDisposable} from "../model/disposer";

export type {CaptureDraft};

export interface ICaptureDialog {
    saveSelection(): Promise<void>;
    captureFromClipboard(): Promise<void>;
    quickCaptureFromClipboard(): Promise<void>;
    newManual(titleCandidate?: string): void;
    newWithContent(content: string, options?: {title?: string; sourceType?: any}): void;
    captureBlockRef(blockId: string, refText: string, docId?: string | null): void;
    captureBlocksById(blockIds: readonly string[], docId?: string | null): Promise<void>;
    captureImage(assetPath: string, altText: string): void;
    captureLink(href: string, text: string): void;
    captureCurrentBlock(): Promise<void>;
    captureCurrentDoc(): Promise<void>;
    captureOmniWithForm(entry: any): void;
    destroy(): void;
}

export interface CaptureCoordinatorDeps {
    library: LibraryService;
    host: HostBridge;
    notify?: (kind: "info" | "error", message: string) => void;
    onItemCreated?: (item: CommonItem) => void;
    getOrCreateDialog: () => ICaptureDialog | Promise<ICaptureDialog>;
}

export class CaptureCoordinator implements IDisposable {
    public readonly library: LibraryService;
    public readonly host: HostBridge;
    public readonly notify?: (kind: "info" | "error", message: string) => void;
    public readonly onItemCreated?: (item: CommonItem) => void;
    private readonly getOrCreateDialog: () => ICaptureDialog | Promise<ICaptureDialog>;

    private disposed = false;

    constructor(deps: CaptureCoordinatorDeps) {
        this.library = deps.library;
        this.host = deps.host;
        this.notify = deps.notify;
        this.onItemCreated = deps.onItemCreated;
        this.getOrCreateDialog = deps.getOrCreateDialog;
    }

    /**
     * 会话草稿读写委托至共享草稿模型（真实职责委派，消除影子状态）。
     */
    public getDraft(): CaptureDraft | null {
        return getSessionDraft();
    }

    public setDraft(draft: CaptureDraft | null): void {
        setSessionDraft(draft);
    }

    public clearDraft(): void {
        setSessionDraft(null);
    }

    /**
     * 校验并准备选区保存内容（纯数据预检，不弹窗、不阻断主流程）。
     */
    public prepareSelectionContent(): {ok: boolean; text?: string; blockId?: string | null; error?: string} {
        const selInfo = this.host.getSelectionInfo();
        const text = selInfo.text || this.host.getSelectionText();
        if (!text || !text.trim()) {
            return {ok: false, error: "empty-selection"};
        }
        return {ok: true, text: text.trim(), blockId: selInfo.blockId};
    }

    /**
     * 推断给定文本的最佳条目类型。
     */
    public inferItemType(text: string): ItemType {
        return inferTypeFromText(text);
    }

    /**
     * 提交新建条目到常用库（完整透传目标文档 ID 与 WriteOptions 写锁/幂等键）。
     */
    public async saveItem(
        input: NewItemInput,
        libraryDocId?: string,
        options: WriteOptions = {}
    ): Promise<Receipt<{item: CommonItem}>> {
        const result = await this.library.createItem(input, libraryDocId, options);
        if (result.ok && this.onItemCreated) {
            this.onItemCreated(result.data.item);
        }
        return result;
    }

    // ---- 生产业务路径接线 ----

    public async saveSelection(): Promise<void> {
        if (this.disposed) return;
        const dialog = await this.getOrCreateDialog();
        return dialog.saveSelection();
    }

    public async captureFromClipboard(): Promise<void> {
        if (this.disposed) return;
        const dialog = await this.getOrCreateDialog();
        return dialog.captureFromClipboard();
    }

    public async quickCaptureFromClipboard(): Promise<void> {
        if (this.disposed) return;
        const dialog = await this.getOrCreateDialog();
        return dialog.quickCaptureFromClipboard();
    }

    public async newManual(titleCandidate?: string): Promise<void> {
        if (this.disposed) return;
        const dialog = await this.getOrCreateDialog();
        dialog.newManual(titleCandidate);
    }

    public async newWithContent(content: string, options?: {title?: string; sourceType?: any}): Promise<void> {
        if (this.disposed) return;
        const dialog = await this.getOrCreateDialog();
        dialog.newWithContent(content, options);
    }

    public async captureCurrentBlock(): Promise<void> {
        if (this.disposed) return;
        const dialog = await this.getOrCreateDialog();
        return dialog.captureCurrentBlock();
    }

    public async captureCurrentDoc(): Promise<void> {
        if (this.disposed) return;
        const dialog = await this.getOrCreateDialog();
        return dialog.captureCurrentDoc();
    }

    public async captureBlocksById(blockIds: readonly string[], docId?: string | null): Promise<void> {
        if (this.disposed) return;
        const dialog = await this.getOrCreateDialog();
        return dialog.captureBlocksById(blockIds, docId);
    }

    public async captureBlockRef(blockId: string, refText: string, docId?: string | null): Promise<void> {
        if (this.disposed) return;
        const dialog = await this.getOrCreateDialog();
        dialog.captureBlockRef(blockId, refText, docId);
    }

    public async captureLink(href: string, text: string): Promise<void> {
        if (this.disposed) return;
        const dialog = await this.getOrCreateDialog();
        dialog.captureLink(href, text);
    }

    public async captureImage(assetPath: string, altText: string): Promise<void> {
        if (this.disposed) return;
        const dialog = await this.getOrCreateDialog();
        dialog.captureImage(assetPath, altText);
    }

    public async captureOmniWithForm(entry: any): Promise<void> {
        if (this.disposed) return;
        const dialog = await this.getOrCreateDialog();
        dialog.captureOmniWithForm(entry);
    }

    /**
     * 卸载时清理内部状态，绝不触发惰性实例化（销毁由插件 onunload 统一调度，防重复销毁）。
     */
    public dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
    }
}
