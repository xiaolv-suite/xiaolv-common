// 当前编辑文档上下文感知与智能自适应推荐引擎（CAND-031 / TODO-FEAT-026）
// 对标 Alfred / Raycast：纯函数、零副作用。
// 根据思源当前打开文档的标题、hPath 与标签，智能计算常用条目与当前工作流的相关度。

import {SearchEntry} from "./search";

export interface DocumentContext {
    docId?: string;
    title?: string;
    hPath?: string;
    tags?: string[];
    /** 该文档历史使用过的条目 ID 集合 */
    recentDocItemIds?: string[];
}

export interface RecommendedResult {
    entry: SearchEntry;
    score: number;
    reasons: string[];
}

/** 触发推荐的最低分数阈值（避免无关条目弱相关误推） */
export const RECOMMEND_THRESHOLD = 50;

/**
 * 纯函数：计算条目与当前活动文档的上下文相关性得分
 */
export function calculateContextualScore(
    entry: SearchEntry,
    docCtx: DocumentContext
): { score: number; reasons: string[] } {
    if (!docCtx || (!docCtx.title && !docCtx.hPath && (!docCtx.tags || docCtx.tags.length === 0) && (!docCtx.recentDocItemIds || docCtx.recentDocItemIds.length === 0))) {
        return {score: 0, reasons: []};
    }

    let score = 0;
    const reasons: string[] = [];

    const docTitle = (docCtx.title ?? "").trim().toLowerCase();
    const docPath = (docCtx.hPath ?? "").trim().toLowerCase();
    const docTags = (docCtx.tags ?? []).map((t) => t.replace(/^#/, "").toLowerCase());
    const recentIds = new Set(docCtx.recentDocItemIds ?? []);

    // 1. 文档专属历史强记忆：此前在该文档内频繁复用过的条目（最高优先级 +100）
    if (recentIds.has(entry.id)) {
        score += 100;
        reasons.push("本文档高频使用");
    }

    // 2. 文档标题与条目分类命中（+80）
    if (entry.category && docTitle) {
        const cat = entry.category.toLowerCase();
        const catParts = cat.split(/[\/\-_]/).map((p) => p.trim()).filter(Boolean);
        const hit = docTitle.includes(cat) || catParts.some((p) => p.length >= 2 && docTitle.includes(p));
        if (hit) {
            score += 80;
            reasons.push(`匹配分类「${entry.category}」`);
        }
    }

    // 3. 标签语义重合命中（每个相同标签 +40，最高 +80）
    if (entry.tags && entry.tags.length > 0 && docTags.length > 0) {
        const overlap = entry.tags.filter((t) => docTags.includes(t.replace(/^#/, "").toLowerCase()));
        if (overlap.length > 0) {
            score += Math.min(80, overlap.length * 40);
            reasons.push(`共有标签 #${overlap[0]}`);
        }
    }

    // 4. 文档标题/路径与条目标题字面匹配（+50）
    if (docTitle && entry.title) {
        const cleanTitle = entry.title.toLowerCase();
        if (docTitle.includes(cleanTitle) || (cleanTitle.length >= 3 && cleanTitle.includes(docTitle))) {
            score += 50;
            reasons.push("匹配文档标题");
        }
    }

    // 5. 文档路径命中条目分类（+40）
    if (entry.category && docPath) {
        const cat = entry.category.toLowerCase();
        const catParts = cat.split(/[\/\-_]/).map((p) => p.trim()).filter(Boolean);
        const hit = docPath.includes(cat) || catParts.some((p) => p.length >= 2 && docPath.includes(p));
        if (hit && !reasons.some((r) => r.includes(entry.category!))) {
            score += 40;
            reasons.push(`路径包含分类「${entry.category}」`);
        }
    }

    return {score, reasons};
}

/**
 * 纯函数：根据当前文档上下文从条目库中筛选并排定推荐列表
 */
export function getRecommendedEntries(
    entries: readonly SearchEntry[],
    docCtx: DocumentContext,
    limit = 5
): RecommendedResult[] {
    const results: RecommendedResult[] = [];

    for (const entry of entries) {
        const {score, reasons} = calculateContextualScore(entry, docCtx);
        if (score >= RECOMMEND_THRESHOLD) {
            results.push({entry, score, reasons});
        }
    }

    // 按得分降序排列
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
}
