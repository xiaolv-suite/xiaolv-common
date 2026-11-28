// 批量标签与分类治理纯函数引擎（ADR 0082 / G30 / T-0142）
// 纯函数、无副作用、遵循 LIMITS 规范

import {LIMITS} from "../constants";
import {cleanTagList, CommonItem} from "./item";
import {renameHierarchyNode, reparentHierarchyPath} from "./hierarchy";

export interface BatchTagCategoryPatch {
    /** 要追加的标签列表（自动去重、清洗前后 #、按上限截断） */
    addTags?: string[];
    /** 要移除的标签列表（精确比对，大小写不敏感） */
    removeTags?: string[];
    /** 要统一设定的分类名称（空串或纯空白表示清空分类） */
    setCategory?: string;
    /** 级联重命名分类前缀（如 {from: "客服/售后", to: "客服/技术支持"}） */
    renameCategoryPrefix?: {from: string; to: string};
    /** 改变当前分类的父级路径（如 "财务" 将 "客服/退款" 迁为 "财务/退款"） */
    reparentCategory?: string;
    /** 级联重命名标签前缀（如 {from: "项目/一期", to: "项目/二期"}） */
    renameTagPrefix?: {from: string; to: string};
}

export interface BatchItemReceipt {
    itemId: string;
    title: string;
    status: "updated" | "skipped" | "failed";
    error?: string;
}

export interface BatchOperationReceipt {
    total: number;
    updated: number;
    skipped: number;
    failed: number;
    items: BatchItemReceipt[];
}

/** 规范化单标签以便比对（trim + 小写 + 剥离 #） */
function normalizeTagForCompare(tag: string): string {
    return (tag ?? "").trim().toLowerCase().replace(/^#+/, "").replace(/#+$/, "");
}

/** 追加新标签到既有标签列表：去重保序，上限 16 项 */
export function mergeTags(currentTags: readonly string[], toAdd: readonly string[]): string[] {
    const existing = cleanTagList(currentTags);
    const added = cleanTagList(toAdd);
    const seen = new Set(existing.map((t) => normalizeTagForCompare(t)));
    const merged = [...existing];

    for (const tag of added) {
        const norm = normalizeTagForCompare(tag);
        if (norm && !seen.has(norm)) {
            seen.add(norm);
            merged.push(tag);
            if (merged.length >= LIMITS.tags) break;
        }
    }
    return merged;
}

/** 从既有标签列表中剔除指定标签：大小写不敏感 */
export function removeTags(currentTags: readonly string[], toRemove: readonly string[]): string[] {
    const existing = cleanTagList(currentTags);
    const removeSet = new Set(cleanTagList(toRemove).map((t) => normalizeTagForCompare(t)));
    if (removeSet.size === 0) return existing;
    return existing.filter((t) => !removeSet.has(normalizeTagForCompare(t)));
}

/**
 * 纯函数：计算单条条目应用批处理补丁后的新标签与新分类
 * @returns {tags, category, changed}，若无任何实质变化则 changed = false
 */
export function applyBatchTagCategoryOps(
    item: Pick<CommonItem, "tags" | "category">,
    patch: BatchTagCategoryPatch,
): {tags: string[]; category?: string; changed: boolean} {
    let nextTags = [...(item.tags ?? [])];
    let tagsChanged = false;

    // 1. 先追加
    if (patch.addTags && patch.addTags.length > 0) {
        const afterMerge = mergeTags(nextTags, patch.addTags);
        if (afterMerge.length !== nextTags.length || afterMerge.some((t, i) => t !== nextTags[i])) {
            nextTags = afterMerge;
            tagsChanged = true;
        }
    }

    // 2. 再移除
    if (patch.removeTags && patch.removeTags.length > 0) {
        const afterRemove = removeTags(nextTags, patch.removeTags);
        if (afterRemove.length !== nextTags.length) {
            nextTags = afterRemove;
            tagsChanged = true;
        }
    }

    // 2.5 标签前缀级联重命名
    if (patch.renameTagPrefix && patch.renameTagPrefix.from.trim()) {
        const renamed = cleanTagList(nextTags.map((t) => renameHierarchyNode(t, patch.renameTagPrefix!.from, patch.renameTagPrefix!.to)));
        if (renamed.length !== nextTags.length || renamed.some((t, i) => t !== nextTags[i])) {
            nextTags = renamed;
            tagsChanged = true;
        }
    }

    // 3. 分类判定
    let nextCategory = item.category ?? "";
    let categoryChanged = false;
    if (typeof patch.setCategory === "string") {
        const cleanCat = patch.setCategory.trim().slice(0, LIMITS.category);
        if (cleanCat !== (item.category ?? "")) {
            nextCategory = cleanCat;
            categoryChanged = true;
        }
    } else if (patch.renameCategoryPrefix && patch.renameCategoryPrefix.from.trim() && nextCategory) {
        const renamedCat = renameHierarchyNode(nextCategory, patch.renameCategoryPrefix.from, patch.renameCategoryPrefix.to).slice(0, LIMITS.category);
        if (renamedCat !== nextCategory) {
            nextCategory = renamedCat;
            categoryChanged = true;
        }
    } else if (typeof patch.reparentCategory === "string" && nextCategory) {
        const reparented = reparentHierarchyPath(nextCategory, patch.reparentCategory).slice(0, LIMITS.category);
        if (reparented !== nextCategory) {
            nextCategory = reparented;
            categoryChanged = true;
        }
    }

    const changed = tagsChanged || categoryChanged;
    return {
        tags: nextTags,
        category: categoryChanged ? nextCategory : (item.category || undefined),
        changed,
    };
}
