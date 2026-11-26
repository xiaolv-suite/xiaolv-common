// 捕获系统共享类型与协议定义（解耦循环依赖）
import type {Dialog} from "siyuan";

export interface CaptureDeps {
    t: (key: string, ...args: string[]) => string;
    getSelectionText(): {text: string; blockId: string | null};
    currentDocId(): string | null;
    readClipboardText(): Promise<string>;
    createItem(input: any, options?: {idempotencyKey?: string}): Promise<{ok: boolean; message: string; itemId?: string}>;
    notify(kind: "info" | "error", message: string): void;
    getBlockKramdown(blockId: string): Promise<string | null>;
    exportDocContent(docId: string): Promise<{hPath: string; content: string} | null>;
    aiEnabled(): boolean;
    aiTidy(content: string, opts?: {signal?: AbortSignal}): Promise<{ok: true; title?: string; alias?: string; tags?: string[]; category?: string} | {ok: false; message: string}>;
    aiDraft(description: string, opts?: {signal?: AbortSignal}): Promise<{ok: true; text: string} | {ok: false; message: string}>;
    findDuplicate(content: string, options?: {excludeId?: string}): Promise<{id: string; title: string} | null>;
    getLibraryName?: () => Promise<string | null>;
    isConfigured?: () => boolean;
    onNotConfigured?: () => void;
    getExistingTags?: () => string[];
    getExistingCategories?: () => string[];
    checkAliasConflict?: (alias: string) => Promise<{conflict: boolean; itemTitle?: string}> | {conflict: boolean; itemTitle?: string};
}

export interface ICaptureDialogHost {
    formOpen: boolean;
    currentDialog: Dialog | null;
    deps: CaptureDeps;
}

export const newWriteKey = (scope: string): string => `xlc-${scope}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`.slice(0, 120);
