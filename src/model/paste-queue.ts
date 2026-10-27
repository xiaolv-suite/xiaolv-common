// 连续取用粘贴队列引擎（Paste Queue / Sequential Stacking）
// 解决用户在填表、开发、发票报销等跨应用多字段填写时频繁呼出弹窗的痛点。
// 纯内存状态机，支持先进先出 (FIFO) 出栈取用，绝不出域，无块污染。

export interface PasteQueueItem {
    id: string;
    title: string;
    content: string;
    itemType?: string;
}

export class PasteQueue {
    private queue: PasteQueueItem[] = [];

    /**
     * 重置并设置新的取用队列
     */
    setQueue(items: PasteQueueItem[]): void {
        this.queue = items
            .filter((i) => Boolean(i && (i.content || i.title)))
            .map((i) => ({
                id: i.id || "",
                title: i.title || "未命名",
                content: i.content || "",
                itemType: i.itemType,
            }));
    }

    /**
     * 追加一项到队列末尾
     */
    add(item: PasteQueueItem): void {
        if (!item || (!item.content && !item.title)) return;
        this.queue.push({
            id: item.id || "",
            title: item.title || "未命名",
            content: item.content || "",
            itemType: item.itemType,
        });
    }

    /**
     * 弹出队首条目（FIFO 出栈）
     */
    pop(): PasteQueueItem | undefined {
        return this.queue.shift();
    }

    /**
     * 预览队首条目（不出栈）
     */
    peek(): PasteQueueItem | undefined {
        return this.queue[0];
    }

    /**
     * 清空当前队列
     */
    clear(): void {
        this.queue = [];
    }

    /**
     * 当前队列剩余项数
     */
    size(): number {
        return this.queue.length;
    }

    /**
     * 获取队列当前所有项快照
     */
    getItems(): readonly PasteQueueItem[] {
        return [...this.queue];
    }
}

let activeQueue: PasteQueue = new PasteQueue();

export function getActivePasteQueue(): PasteQueue {
    return activeQueue;
}

export function setActivePasteQueue(queue: PasteQueue): void {
    activeQueue = queue;
}
