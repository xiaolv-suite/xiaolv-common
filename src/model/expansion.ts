// 行内字符击键静默自展开引擎（CAND-030 / TODO-FEAT-025）
// 对标 Espanso / TextExpander 工业标准：
// 纯函数、零副作用、纯内存匹配。用户在编辑器键入以特定前导符开头的简码时自动识别替换。

export interface ExpansionDictionaryItem {
    /** 触发简码（如 ":sjh"、";phone"、":tax"） */
    trigger: string;
    item: {
        id: string;
        title: string;
        content?: string;
        markdown?: string;
        varCount?: number;
    };
}

export interface ExpansionMatchResult {
    trigger: string;
    item: ExpansionDictionaryItem["item"];
    /** 匹配的字符长度（用于在编辑器中精确回退删除多少个字符） */
    matchLength: number;
}

/** 规范的自展开前导安全前缀字符 */
export const EXPANSION_LEAD_CHARS = new Set([":", ";", ",", "/"]);

/**
 * 纯函数：根据当前击键缓冲区，在简码字典中寻找末尾精准命中的自展开条目
 * @param buffer 当前键盘输入缓冲区（只保留最近几十个字符）
 * @param dictionary 简码映射字典
 */
export function findExpansionMatch(
    buffer: string,
    dictionary: readonly ExpansionDictionaryItem[]
): ExpansionMatchResult | null {
    if (!buffer || dictionary.length === 0) return null;

    // 优先寻找长简码匹配（最长前缀优先，避免短简码误伤长简码）
    const sortedDict = [...dictionary].sort((a, b) => b.trigger.length - a.trigger.length);

    for (const entry of sortedDict) {
        const trig = entry.trigger.trim();
        if (!trig || trig.length < 2) continue;

        // 检查缓冲区是否以该简码严格结尾（大小写不敏感匹配）
        if (buffer.toLowerCase().endsWith(trig.toLowerCase())) {
            return {
                trigger: trig,
                item: entry.item,
                matchLength: trig.length,
            };
        }
    }

    return null;
}

/**
 * 纯函数：击键缓冲区清洗与容量收缩
 * 遇到换行或超出上限（32 字符）时自动截取安全末尾，保证高效内存占用
 */
export function cleanExpansionBuffer(buffer: string, maxLen = 32): string {
    if (!buffer) return "";
    // 遇到换行符重置缓冲区
    const lastNewlineIdx = Math.max(buffer.lastIndexOf("\n"), buffer.lastIndexOf("\r"));
    const activeSlice = lastNewlineIdx >= 0 ? buffer.slice(lastNewlineIdx + 1) : buffer;
    if (activeSlice.length > maxLen) {
        return activeSlice.slice(-maxLen);
    }
    return activeSlice;
}
