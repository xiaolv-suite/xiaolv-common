import type {ItemType} from "./item";

// 会话级捕获草稿状态模型
export interface CaptureDraft {
    content: string;
    title?: string;
    itemType?: string;
    type?: ItemType;
    alias?: string;
    shortcode?: string;
    tags?: string;
    category?: string;
}

let sessionDraftInstance: CaptureDraft | null = null;

export function getSessionDraft(): CaptureDraft | null {
    return sessionDraftInstance;
}

export function setSessionDraft(draft: CaptureDraft | null): void {
    sessionDraftInstance = draft;
}
