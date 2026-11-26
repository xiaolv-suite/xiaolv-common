// 预览文本的有界 LRU 缓存与异步任务合并服务
// 封装 60s TTL、请求去重防并发穿透与代数失效判定机制。
import {LruCache, PREVIEW_CACHE_CAPACITY, PREVIEW_CACHE_TTL_MS} from "../model/lru";

export class PreviewCacheService {
    private readonly cache: LruCache<string>;
    private readonly tasks = new Map<string, Promise<string>>();
    private generation = 0;

    constructor(capacity = PREVIEW_CACHE_CAPACITY, ttlMs = PREVIEW_CACHE_TTL_MS) {
        this.cache = new LruCache<string>(capacity, ttlMs);
    }

    public get(itemId: string): string | undefined {
        return this.cache.get(itemId);
    }

    public set(itemId: string, content: string): void {
        this.cache.set(itemId, content);
    }

    public has(itemId: string): boolean {
        return this.cache.get(itemId) !== undefined;
    }

    public async getOrFetch(itemId: string, loader: () => Promise<string>): Promise<string> {
        const cached = this.cache.get(itemId);
        if (cached !== undefined) return cached;

        const existingTask = this.tasks.get(itemId);
        if (existingTask) return existingTask;

        const currentGen = this.generation;
        let task: Promise<string>;
        const execute = async (): Promise<string> => {
            try {
                const text = await loader();
                if (text && currentGen === this.generation && this.tasks.get(itemId) === task) {
                    this.cache.set(itemId, text);
                }
                return text || "";
            } finally {
                if (this.tasks.get(itemId) === task) {
                    this.tasks.delete(itemId);
                }
            }
        };
        task = execute();

        this.tasks.set(itemId, task);
        return task;
    }

    public invalidate(itemIds?: readonly string[]): void {
        if (!itemIds || itemIds.length === 0) {
            this.generation++;
            this.cache.clear();
            this.tasks.clear();
            return;
        }
        for (const id of new Set(itemIds)) {
            this.cache.delete(id);
            this.tasks.delete(id);
        }
    }

    public clear(): void {
        this.invalidate();
    }
}
