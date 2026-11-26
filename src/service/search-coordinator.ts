// 搜索协调器服务（SearchCoordinator）
// 统筹 SWR 索引加载调度、全生态/当前文档多源检索、来源健康度探测与预览 LRU 缓存交互。
import {SearchQuery, SearchEntry, SearchContext, searchEntries} from "../model/search";
import {LibraryService} from "./library";
import {OmniSearchService} from "./omni-search";
import {PreviewCacheService} from "./preview-cache";

export interface SearchCoordinatorDeps {
    library: LibraryService;
    omniSearch: OmniSearchService;
    previewCache: PreviewCacheService;
    getSearchContext: () => SearchContext;
    prefetchSourceHealth?: (entries: SearchEntry[]) => Promise<void>;
    onFirstIndexLoaded?: () => void;
}

export interface SearchExecutionResult {
    entries: SearchEntry[];
    truncated: boolean;
    total: number;
    loading: boolean;
    error?: string;
}

export class SearchCoordinator {
    constructor(private readonly deps: SearchCoordinatorDeps) {}

    /**
     * 执行核心搜索：SWR 透明更新、健康度预取与首条错误透传。
     */
    public async search(query: SearchQuery): Promise<SearchExecutionResult> {
        const wasLoaded = Boolean(this.deps.library.getIndex());
        const loading = !wasLoaded;

        // SWR：索引超过 5 分钟透明后台重建
        const idx = await this.deps.library.ensureIndex(5 * 60_000);
        const results = searchEntries(idx.entries, query, this.deps.getSearchContext());
        const entries = results.map((r) => r.entry);

        if (this.deps.prefetchSourceHealth) {
            void this.deps.prefetchSourceHealth(entries);
        }

        const error = entries.length === 0 && idx.errors.length > 0 ? idx.errors[0] : undefined;

        if (loading && this.deps.onFirstIndexLoaded) {
            this.deps.onFirstIndexLoaded();
        }

        return {
            entries,
            truncated: idx.truncated,
            total: idx.entries.length,
            loading,
            error,
        };
    }

    /**
     * 检索思源文档清单（用于定向插入或文档选择）。
     */
    public async searchDocs(keyword: string): Promise<any[]> {
        const result = await this.deps.library.searchDocs(keyword);
        if (!result.ok) throw new Error(result.message);
        return result.data;
    }

    /**
     * 在当前打开的文档中执行全域穿透搜索。
     */
    public async searchCurrentDoc(keyword: string): Promise<SearchEntry[]> {
        return this.deps.omniSearch.searchInCurrentDoc(keyword);
    }

    /**
     * 在全笔记本全部笔记中执行全域穿透搜索。
     */
    public async searchAllNotes(keyword: string): Promise<SearchEntry[]> {
        return this.deps.omniSearch.searchInAllNotes(keyword);
    }

    /**
     * 获取指定条目的预览文本（LRU 缓存命中或合并在途任务）。
     */
    public async getPreview(itemId: string, loader: () => Promise<string>): Promise<string> {
        return this.deps.previewCache.getOrFetch(itemId, loader);
    }

    /**
     * 使预览缓存失效。
     */
    public invalidatePreview(itemIds?: readonly string[]): void {
        this.deps.previewCache.invalidate(itemIds);
    }
}
