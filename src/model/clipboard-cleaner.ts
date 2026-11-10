// 剪贴板文本高级清洗引擎（ADR 0098 / G53）
// 针对从 PDF、网页、微信、聊天窗口复制时附带的不可见乱码、硬断行、多余空行进行高保真清洗
import {extractCharPinyins} from "./pinyin-tiny";

export interface ClipboardCleanOptions {
    /** 是否剔除不可见的零宽字符与 BOM (默认 true) */
    stripInvisible?: boolean;
    /** 是否合并单行软换行（双换行保留为段落，中文无缝拼接，英文补空格，默认 false） */
    mergeSoftBreaks?: boolean;
    /** 是否清除每行行尾多余空白并将连续多个空行压缩为一个 (默认 true) */
    compactEmptyLines?: boolean;
    /** 是否将全角制表符或多余缩进归一化 (默认 false) */
    trimLeadingIndent?: boolean;
    /** 是否执行盘古之白中英文智能排版空格规范化 (默认 false) */
    panguSpacing?: boolean;
    /** 是否清洗 URL 中的跟踪分析参数 (默认 false) */
    stripUrlTrackers?: boolean;
}

export interface ClipboardCleanResult {
    originalText: string;
    cleanedText: string;
    hasChanges: boolean;
    changeDetails: string[];
}

/** 常见不可见零宽与控制字符正则 */
const INVISIBLE_CHARS_REGEX = /[\u200B-\u200D\uFEFF\u200E\u200F\u00AD]/g;

/**
 * 盘古之白中英文智能排版规范化 (formatPanguSpacing)
 * 在汉字 (CJK) 与英文字母、数字之间自动添加规范空格，不污染代码块、URL及Markdown标记。
 */
export function formatPanguSpacing(text: string): {result: string; spacedCount: number} {
    if (!text || !text.trim()) return {result: text ?? "", spacedCount: 0};

    let spacedCount = 0;
    // 1. 保护代码块/行内代码
    const codeBlocks: string[] = [];
    let processed = text.replace(/(`{1,3})([\s\S]*?)\1/g, (match) => {
        codeBlocks.push(match);
        return `__XLC_CODE_PLACEHOLDER_${codeBlocks.length - 1}__`;
    });

    // 2. 保护 Markdown 链接与原生 URL
    const urlBlocks: string[] = [];
    processed = processed.replace(/(https?:\/\/[^\s\u4e00-\u9fa5<>"')）\]]+|\[[^\]]+\]\([^)]+\))/g, (match) => {
        urlBlocks.push(match);
        return `__XLC_URL_PLACEHOLDER_${urlBlocks.length - 1}__`;
    });

    // 3. 保护 LaTeX 数学公式 ($$...$$ 与 $...$)
    const mathBlocks: string[] = [];
    processed = processed.replace(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g, (match) => {
        mathBlocks.push(match);
        return `__XLC_MATH_PLACEHOLDER_${mathBlocks.length - 1}__`;
    });

    // 4. 保护思源原生块引用与嵌入块
    const syBlocks: string[] = [];
    processed = processed.replace(/(\(\([a-z0-9\-]{14,24}(?:\s+"[^"]*")?\)\)|\{\{select[\s\S]*?\}\})/gi, (match) => {
        syBlocks.push(match);
        return `__XLC_SY_PLACEHOLDER_${syBlocks.length - 1}__`;
    });

    // 5. 保护动态模板占位符 {{...}}
    const xlcBlocks: string[] = [];
    processed = processed.replace(/\{\{[\s\S]*?\}\}/g, (match) => {
        xlcBlocks.push(match);
        return `__XLC_TAG_PLACEHOLDER_${xlcBlocks.length - 1}__`;
    });

    // 4. 清理全角标点符号两端的不必要空格（如：你好 ， 世界 -> 你好，世界）
    processed = processed.replace(/ +([，。！？；：、“”‘’（）《》【】]) */g, "$1");
    processed = processed.replace(/ *([，。！？；：、“”‘’（）《》【】]) +/g, "$1");

    // 5. CJK 字符跟字母/数字之间加空格
    const cjkToLatin = /([\u4e00-\u9fa5\u3040-\u30ff])([a-zA-Z0-9$#%@])/g;
    processed = processed.replace(cjkToLatin, (_m, cjk, latin) => {
        spacedCount++;
        return `${cjk} ${latin}`;
    });

    // 6. 字母/数字跟 CJK 字符之间加空格
    const latinToCjk = /([a-zA-Z0-9$#%@])([\u4e00-\u9fa5\u3040-\u30ff])/g;
    processed = processed.replace(latinToCjk, (_m, latin, cjk) => {
        spacedCount++;
        return `${latin} ${cjk}`;
    });

    // 7. 还原动态占位符
    processed = processed.replace(/__XLC_TAG_PLACEHOLDER_(\d+)__/g, (_, idx) => {
        return xlcBlocks[Number(idx)] ?? "";
    });

    // 8. 还原思源原生块引用与嵌入块
    processed = processed.replace(/__XLC_SY_PLACEHOLDER_(\d+)__/g, (_, idx) => {
        return syBlocks[Number(idx)] ?? "";
    });

    // 9. 还原 LaTeX 数学公式
    processed = processed.replace(/__XLC_MATH_PLACEHOLDER_(\d+)__/g, (_, idx) => {
        return mathBlocks[Number(idx)] ?? "";
    });

    // 10. 还原 URL
    processed = processed.replace(/__XLC_URL_PLACEHOLDER_(\d+)__/g, (_, idx) => {
        return urlBlocks[Number(idx)] ?? "";
    });

    // 11. 还原代码块
    processed = processed.replace(/__XLC_CODE_PLACEHOLDER_(\d+)__/g, (_, idx) => {
        return codeBlocks[Number(idx)] ?? "";
    });

    return {result: processed, spacedCount};
}

/**
 * 将剪贴板制表符表格 (TSV，如从 Excel/网页表格复制) 转换为标准 Markdown 表格
 * 必须包含至少 2 行有效文本，且大多数行包含制表符 \t
 */
export function tsvToMarkdownTable(text: string): {result: string; rowCount: number; colCount: number} | null {
    if (!text || !text.includes("\t")) return null;
    const lines = text.replace(/\r\n?/g, "\n").split("\n").filter((l) => l.trim().length > 0);
    if (lines.length < 2) return null;

    const tabLines = lines.filter((l) => l.includes("\t"));
    if (tabLines.length / lines.length < 0.6) return null;

    const rows = lines.map((l) => l.split("\t").map((c) => c.trim().replace(/\|/g, "\\|")));
    const maxCols = Math.max(...rows.map((r) => r.length));
    if (maxCols < 2) return null;

    const normalizedRows = rows.map((r) => {
        const padded = [...r];
        while (padded.length < maxCols) padded.push("");
        return padded;
    });

    const header = normalizedRows[0]!;
    const separator = Array(maxCols).fill("---");
    const dataRows = normalizedRows.slice(1);

    const mdLines = [
        `| ${header.join(" | ")} |`,
        `| ${separator.join(" | ")} |`,
        ...dataRows.map((r) => `| ${r.join(" | ")} |`),
    ];

    return {
        result: mdLines.join("\n"),
        rowCount: lines.length,
        colCount: maxCols,
    };
}

const TRACKING_PARAM_REGEX = /^(utm_[a-z0-9_]+|spm_id_from|from_source|vd_source|share_[a-z0-9_]+|si|igshid|fbclid|gclid|msclkid|ref|ref_src|ref_url|_hsenc|_hsmi|mc_cid|mc_eid|nsukey)$/i;

/**
 * 清洗 URL 中的分析追踪参数（如 utm_*, spm_id_from, fbclid, share_token 等）
 * 保护用户隐私并精简链接长度
 */
export function stripUrlTrackingParams(text: string): {result: string; cleanedCount: number} {
    if (!text || !text.includes("http")) return {result: text ?? "", cleanedCount: 0};

    let cleanedCount = 0;
    const urlPattern = /https?:\/\/[^\s\u4e00-\u9fa5\u3040-\u30ff)）\]<>，。！？]+(?<![.,!?:;])/g;

    const result = text.replace(urlPattern, (urlStr) => {
        try {
            const parsed = new URL(urlStr);
            const keysToDelete: string[] = [];
            parsed.searchParams.forEach((_val, key) => {
                if (TRACKING_PARAM_REGEX.test(key) || key.toLowerCase().startsWith("utm_")) {
                    keysToDelete.push(key);
                }
            });

            if (keysToDelete.length > 0) {
                for (const k of keysToDelete) {
                    parsed.searchParams.delete(k);
                }
                cleanedCount += keysToDelete.length;
                let cleanUrl = parsed.toString();
                // 若原 URL 无尾部斜杠且 path 为空，URL.toString() 会补 /，尽量保持原貌
                if (!urlStr.endsWith("/") && cleanUrl.endsWith("/") && parsed.pathname === "/" && !parsed.search && !parsed.hash) {
                    cleanUrl = cleanUrl.slice(0, -1);
                }
                return cleanUrl;
            }
            return urlStr;
        } catch {
            return urlStr;
        }
    });

    return {result, cleanedCount};
}

export type PunctuationMode = "to-cjk" | "to-ascii";
export type ListFormatStyle = "markdown-ol" | "markdown-ul" | "chinese-circled";

/**
 * 中英文标点符号一键智能归一化与修正 (normalizePunctuation)
 * to-cjk: 将中文句子中的英文标点 (, . ! ? : ; ( )) 转换为全角标点，智能跳过数字小数（如 3.14）、URL与代码
 * to-ascii: 将中文全角标点转换为 ASCII 半角标点
 */
export function normalizePunctuation(
    text: string,
    mode: PunctuationMode = "to-cjk",
): {result: string; convertedCount: number} {
    if (!text || !text.trim()) return {result: text ?? "", convertedCount: 0};

    // 保护代码块/行内代码与 URL
    const codeBlocks: string[] = [];
    let processed = text.replace(/(`{1,3})([\s\S]*?)\1/g, (match) => {
        codeBlocks.push(match);
        return `__XLC_CODE_PLACEHOLDER_${codeBlocks.length - 1}__`;
    });

    const urlBlocks: string[] = [];
    processed = processed.replace(/(https?:\/\/[^\s\u4e00-\u9fa5\u3040-\u30ff)）\]<>，。！？]+(?<![.,!?:;])|\[[^\]]+\]\([^)]+\))/g, (match) => {
        urlBlocks.push(match);
        return `__XLC_URL_PLACEHOLDER_${urlBlocks.length - 1}__`;
    });

    let convertedCount = 0;

    if (mode === "to-cjk") {
        // 逗号：相邻汉字转中文逗号
        processed = processed.replace(/([\u4e00-\u9fa5]),/g, (_m, cjk) => {
            convertedCount++;
            return `${cjk}，`;
        });
        processed = processed.replace(/,([\u4e00-\u9fa5])/g, (_m, cjk) => {
            convertedCount++;
            return `，${cjk}`;
        });

        // 句号：相邻汉字且后不接字母数字（避免小数与文件名）转中文句号
        processed = processed.replace(/([\u4e00-\u9fa5])\.(?![a-zA-Z0-9])/g, (_m, cjk) => {
            convertedCount++;
            return `${cjk}。`;
        });

        // 问号/叹号
        processed = processed.replace(/([\u4e00-\u9fa5])\?/g, (_m, cjk) => {
            convertedCount++;
            return `${cjk}？`;
        });
        processed = processed.replace(/([\u4e00-\u9fa5])!/g, (_m, cjk) => {
            convertedCount++;
            return `${cjk}！`;
        });

        // 分号/冒号（冒号后不直接跟斜杠防协议破坏）
        processed = processed.replace(/([\u4e00-\u9fa5]);/g, (_m, cjk) => {
            convertedCount++;
            return `${cjk}；`;
        });
        processed = processed.replace(/([\u4e00-\u9fa5]):(?!\/)/g, (_m, cjk) => {
            convertedCount++;
            return `${cjk}：`;
        });

        // 括号
        processed = processed.replace(/\(([\u4e00-\u9fa5])/g, (_m, cjk) => {
            convertedCount++;
            return `（${cjk}`;
        });
        processed = processed.replace(/([\u4e00-\u9fa5])\)/g, (_m, cjk) => {
            convertedCount++;
            return `${cjk}）`;
        });
    } else {
        // to-ascii 全角转半角
        const asciiMap: Record<string, string> = {
            "，": ", ",
            "。": ". ",
            "！": "! ",
            "？": "? ",
            "：": ": ",
            "；": "; ",
            "（": " (",
            "）": ") ",
            "【": " [",
            "】": "] ",
            "“": '"',
            "”": '"',
            "‘": "'",
            "’": "'",
        };

        for (const [cjkPunct, asciiPunct] of Object.entries(asciiMap)) {
            if (processed.includes(cjkPunct)) {
                const count = processed.split(cjkPunct).length - 1;
                convertedCount += count;
                processed = processed.replaceAll(cjkPunct, asciiPunct);
            }
        }
        // 清理由于替换引入的双重连续空格
        processed = processed.replace(/ {2,}/g, " ");
    }

    // 还原 URL
    processed = processed.replace(/__XLC_URL_PLACEHOLDER_(\d+)__/g, (_, idx) => {
        return urlBlocks[Number(idx)] ?? "";
    });

    // 还原代码块
    processed = processed.replace(/__XLC_CODE_PLACEHOLDER_(\d+)__/g, (_, idx) => {
        return codeBlocks[Number(idx)] ?? "";
    });

    return {result: processed, convertedCount};
}

const CIRCLED_DIGITS = [
    "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩",
    "⑪", "⑫", "⑬", "⑭", "⑮", "⑯", "⑰", "⑱", "⑲", "⑳",
];

const LIST_PREFIX_REGEX = /^\s*(?:(\d{1,3})[、.．：:]|\(([0-9]{1,3})\)|（([0-9]{1,3})）|([①-⑳])|[一二三四五六七八九十]+[、.．]|[-*+])\s*/;

/**
 * 列表项与标点符号一键排版净化 (normalizeListFormatting)
 * 将 1、/ 1. / (1) / ① / - / * 等混合散乱列表统一重构为目标列表规范
 */
export function normalizeListFormatting(
    text: string,
    targetStyle: ListFormatStyle = "markdown-ol",
): {result: string; convertedCount: number} {
    if (!text || !text.trim()) return {result: text ?? "", convertedCount: 0};

    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    let matchCount = 0;

    for (const line of lines) {
        if (LIST_PREFIX_REGEX.test(line)) matchCount++;
    }

    // 需有至少 2 行列表特征才转换，避免普通正文误伤
    if (matchCount < 2) return {result: text, convertedCount: 0};

    let itemIndex = 0;
    const convertedLines = lines.map((line) => {
        const m = line.match(LIST_PREFIX_REGEX);
        if (!m) return line;

        itemIndex++;
        const content = line.slice(m[0].length).trim();

        if (targetStyle === "markdown-ol") {
            return `${itemIndex}. ${content}`;
        }
        if (targetStyle === "markdown-ul") {
            return `- ${content}`;
        }
        if (targetStyle === "chinese-circled") {
            const digit = CIRCLED_DIGITS[itemIndex - 1] || `(${itemIndex})`;
            return `${digit} ${content}`;
        }
        return line;
    });

    return {
        result: convertedLines.join("\n"),
        convertedCount: matchCount,
    };
}

/**
 * 智能格式化 JSON 文本（带 2 空格缩进）
 * 若非合法 JSON 复合结构，返回原文本
 */
export function formatJsonText(text: string): {result: string; formatted: boolean} {
    if (!text || !text.trim()) return {result: text ?? "", formatted: false};
    const trimmed = text.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
        return {result: text, formatted: false};
    }
    try {
        const obj = JSON.parse(trimmed);
        if (typeof obj !== "object" || obj === null) {
            return {result: text, formatted: false};
        }
        return {
            result: JSON.stringify(obj, null, 2),
            formatted: true,
        };
    } catch {
        return {result: text, formatted: false};
    }
}

/**
 * 智能紧凑化压缩 JSON 文本（移除所有多余空白和换行）
 * 若非合法 JSON 复合结构，返回原文本
 */
export function compactJsonText(text: string): {result: string; compacted: boolean} {
    if (!text || !text.trim()) return {result: text ?? "", compacted: false};
    const trimmed = text.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
        return {result: text, compacted: false};
    }
    try {
        const obj = JSON.parse(trimmed);
        if (typeof obj !== "object" || obj === null) {
            return {result: text, compacted: false};
        }
        return {
            result: JSON.stringify(obj),
            compacted: true,
        };
    } catch {
        return {result: text, compacted: false};
    }
}
export function stripInvisibleCharacters(text: string): {result: string; count: number} {
    let count = 0;
    const result = text.replace(INVISIBLE_CHARS_REGEX, () => {
        count++;
        return "";
    });
    return {result, count};
}

/**
 * 合并单换行软换行（PDF/微信换行修复）
 * - 连续 2 个及以上换行视为段落，予以保留；
 * - 仅 1 个换行：若两端为中文字符直接连结；若包含英文/数字则保留一个空格
 */
export function mergeSoftLinebreaks(text: string): {result: string; mergedCount: number} {
    if (!text || !text.includes("\n")) return {result: text, mergedCount: 0};

    // 标准化为 LF
    const normalized = text.replace(/\r\n?/g, "\n");
    // 按段落分割（保留连续换行）
    const paragraphs = normalized.split(/\n{2,}/);
    let totalMerged = 0;

    const cleanedParagraphs = paragraphs.map((para) => {
        const lines = para.split("\n");
        if (lines.length <= 1) return para;

        let merged = lines[0] ?? "";
        for (let i = 1; i < lines.length; i++) {
            const nextLine = lines[i] ?? "";
            if (!nextLine.trim()) continue;
            totalMerged++;

            const lastChar = merged.slice(-1);
            const firstChar = nextLine.charAt(0);

            // 中日韩字符正则
            const isCjkLast = /[\u4e00-\u9fa5\u3040-\u30ff\uff00-\uffef]/.test(lastChar);
            const isCjkFirst = /[\u4e00-\u9fa5\u3040-\u30ff\uff00-\uffef]/.test(firstChar);

            if (isCjkLast && isCjkFirst) {
                // 两端都是中文字符：直接拼接，不留空格
                merged += nextLine.trim();
            } else {
                // 包含英文或符号：补一个空格分隔
                merged += " " + nextLine.trim();
            }
        }
        return merged;
    });

    return {result: cleanedParagraphs.join("\n\n"), mergedCount: totalMerged};
}

/**
 * 清除每行行尾空格，压缩连续空行为单个空行
 */
export function compactWhitespaceAndLines(text: string, trimLeading = false): {result: string; trimmedLines: number} {
    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    let trimmedCount = 0;

    const cleanedLines = lines.map((l) => {
        const rTrimmed = l.replace(/[ \t]+$/, "");
        if (rTrimmed !== l) trimmedCount++;
        return trimLeading ? rTrimmed.trimStart() : rTrimmed;
    });

    // 压缩 3 个以上连续换行
    const intermediate = cleanedLines.join("\n");
    const compacted = intermediate.replace(/\n{3,}/g, "\n\n");

    return {
        result: compacted.trim(),
        trimmedLines: trimmedCount,
    };
}

/**
 * 综合剪贴板清洗入口
 */
export function cleanClipboardText(text: string, options: ClipboardCleanOptions = {}): ClipboardCleanResult {
    const opts: Required<ClipboardCleanOptions> = {
        stripInvisible: options.stripInvisible !== false,
        mergeSoftBreaks: options.mergeSoftBreaks === true,
        compactEmptyLines: options.compactEmptyLines !== false,
        trimLeadingIndent: options.trimLeadingIndent === true,
        panguSpacing: options.panguSpacing === true,
        stripUrlTrackers: options.stripUrlTrackers === true,
    };

    let cur = text;
    const details: string[] = [];

    if (opts.stripInvisible) {
        const res = stripInvisibleCharacters(cur);
        if (res.count > 0) {
            cur = res.result;
            details.push(`移除了 ${res.count} 个不可见零宽字符`);
        }
    }

    if (opts.mergeSoftBreaks) {
        const res = mergeSoftLinebreaks(cur);
        if (res.mergedCount > 0) {
            cur = res.result;
            details.push(`合并了 ${res.mergedCount} 处意外硬断行`);
        }
    }

    if (opts.compactEmptyLines || opts.trimLeadingIndent) {
        const res = compactWhitespaceAndLines(cur, opts.trimLeadingIndent);
        cur = res.result;
        if (res.trimmedLines > 0) {
            details.push(`清除了 ${res.trimmedLines} 行尾余空白并压缩了空行`);
        }
    }

    if (opts.panguSpacing) {
        const res = formatPanguSpacing(cur);
        if (res.spacedCount > 0) {
            cur = res.result;
            details.push(`规范化了 ${res.spacedCount} 处中英文排版间距`);
        }
    }

    if (opts.stripUrlTrackers) {
        const res = stripUrlTrackingParams(cur);
        if (res.cleanedCount > 0) {
            cur = res.result;
            details.push(`移除了 ${res.cleanedCount} 个 URL 跟踪分析参数`);
        }
    }

    return {
        originalText: text,
        cleanedText: cur,
        hasChanges: cur !== text,
        changeDetails: details,
    };
}

/**
 * 多行文本顺序去重 (deduplicateLines)
 * 保留首个出现项的相对顺序，过滤后续完全相同的行
 */
export function deduplicateLines(
    text: string,
    options: {caseSensitive?: boolean; trimLines?: boolean; ignoreEmpty?: boolean} = {},
): {result: string; removedCount: number; originalCount: number; uniqueCount: number} {
    if (!text || !text.includes("\n")) {
        return {result: text ?? "", removedCount: 0, originalCount: text ? 1 : 0, uniqueCount: text ? 1 : 0};
    }

    const caseSensitive = options.caseSensitive !== false;
    const trimLines = options.trimLines !== false;
    const ignoreEmpty = options.ignoreEmpty !== false;

    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    const seen = new Set<string>();
    const uniqueLines: string[] = [];
    let removedCount = 0;

    for (const rawLine of lines) {
        const line = trimLines ? rawLine.trim() : rawLine;
        if (ignoreEmpty && !line) continue;

        const compareKey = caseSensitive ? line : line.toLowerCase();
        if (seen.has(compareKey)) {
            removedCount++;
            continue;
        }

        seen.add(compareKey);
        uniqueLines.push(trimLines ? line : rawLine);
    }

    return {
        result: uniqueLines.join("\n"),
        removedCount,
        originalCount: lines.length,
        uniqueCount: uniqueLines.length,
    };
}

/**
 * 多行文本自然排序 (sortLines)
 * 支持拼音/字母升序或降序
 */
export function sortLines(
    text: string,
    options: {descending?: boolean; locale?: string} = {},
): {result: string; lineCount: number} {
    if (!text || !text.includes("\n")) return {result: text ?? "", lineCount: text ? 1 : 0};
    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    const locale = options.locale || "zh-Hans-CN";
    const sorted = [...lines].sort((a, b) => {
        const cmp = a.localeCompare(b, locale, {numeric: true, sensitivity: "base"});
        return options.descending ? -cmp : cmp;
    });
    return {
        result: sorted.join("\n"),
        lineCount: lines.length,
    };
}

export interface WidthConvertOptions {
    /** 仅转换字母数字（A-Z, a-z, 0-9），不转标点 */
    alphanumericOnly?: boolean;
    /** 转换标点符号（默认 true） */
    punctuation?: boolean;
    /** 转换全半角空格（\u3000 <-> \u0020，默认 true） */
    spaces?: boolean;
}

export interface WidthConvertResult {
    result: string;
    convertedCount: number;
}

/**
 * 全角/半角字符双向智能转换与规范化引擎 (convertWidth)
 * to-half: 全角转半角 (如 １２３ -> 123, ａｂｃ -> abc, 　 -> 空格, ！ -> !)
 * to-full: 半角转全角 (如 123 -> １２３, abc -> ａｂｃ, ! -> ！)
 */
export function convertWidth(
    text: string,
    mode: "to-half" | "to-full",
    options: WidthConvertOptions = {},
): WidthConvertResult {
    if (!text) return {result: text ?? "", convertedCount: 0};

    const alphanumericOnly = options.alphanumericOnly === true;
    const punctuation = options.punctuation !== false;
    const spaces = options.spaces !== false;

    let count = 0;
    const chars = Array.from(text);

    const converted = chars.map((char) => {
        const code = char.charCodeAt(0);

        if (mode === "to-half") {
            // 全角空格 \u3000 (12288) -> 半角空格 \u0020 (32)
            if (code === 12288) {
                if (spaces && !alphanumericOnly) {
                    count++;
                    return " ";
                }
                return char;
            }

            // 全角 ASCII 范围: 65281 (\uFF01 '！') ~ 65374 (\uFF5E '～')
            if (code >= 65281 && code <= 65374) {
                const isFullNum = code >= 65296 && code <= 65305; // ０-９
                const isFullUpper = code >= 65313 && code <= 65338; // Ａ-Ｚ
                const isFullLower = code >= 65345 && code <= 65370; // ａ-ｚ
                const isAlphaNum = isFullNum || isFullUpper || isFullLower;

                if (alphanumericOnly) {
                    if (isAlphaNum) {
                        count++;
                        return String.fromCharCode(code - 65248);
                    }
                    return char;
                }

                if (!punctuation && !isAlphaNum) {
                    return char;
                }

                count++;
                return String.fromCharCode(code - 65248);
            }

            return char;
        } else {
            // to-full (半角转全角)
            if (code === 32) {
                if (spaces && !alphanumericOnly) {
                    count++;
                    return "\u3000";
                }
                return char;
            }

            // 半角 ASCII 范围: 33 ('!') ~ 126 ('~')
            if (code >= 33 && code <= 126) {
                const isNum = code >= 48 && code <= 57; // 0-9
                const isUpper = code >= 65 && code <= 90; // A-Z
                const isLower = code >= 97 && code <= 122; // a-z
                const isAlphaNum = isNum || isUpper || isLower;

                if (alphanumericOnly) {
                    if (isAlphaNum) {
                        count++;
                        return String.fromCharCode(code + 65248);
                    }
                    return char;
                }

                if (!punctuation && !isAlphaNum) {
                    return char;
                }

                count++;
                return String.fromCharCode(code + 65248);
            }

            return char;
        }
    });

    return {
        result: converted.join(""),
        convertedCount: count,
    };
}

/**
 * UTF-8 安全 Base64 编码（支持多字节中文字符无损转换）
 */
export function encodeBase64(text: string): string {
    if (!text) return "";
    try {
        const g = typeof globalThis !== "undefined" ? (globalThis as unknown as {Buffer?: {from: (s: string, enc: string) => {toString: (enc: string) => string}}}) : undefined;
        if (g?.Buffer) {
            return g.Buffer.from(text, "utf-8").toString("base64");
        }
        const utf8Bytes = encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (_, p1) => {
            return String.fromCharCode(parseInt(p1, 16));
        });
        return btoa(utf8Bytes);
    } catch {
        return "";
    }
}

const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

/**
 * UTF-8 安全 Base64 解码（支持多字节中文字符，出错时安全返回 ok: false 与原文）
 */
export function decodeBase64(encoded: string): {result: string; ok: boolean} {
    if (!encoded) return {result: "", ok: true};
    const clean = encoded.trim();
    if (!BASE64_PATTERN.test(clean) || clean.length % 4 !== 0) {
        return {result: encoded, ok: false};
    }
    try {
        const g = typeof globalThis !== "undefined" ? (globalThis as unknown as {Buffer?: {from: (s: string, enc: string) => {toString: (enc: string) => string}}}) : undefined;
        if (g?.Buffer) {
            const decoded = g.Buffer.from(clean, "base64").toString("utf-8");
            return {result: decoded, ok: true};
        }
        const binaryStr = atob(clean);
        const bytes = Array.from(binaryStr).map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("");
        const result = decodeURIComponent(bytes);
        return {result, ok: true};
    } catch {
        return {result: encoded, ok: false};
    }
}

/**
 * URL 文本编码纯函数
 */
export function encodeUrlText(text: string, component = true): string {
    if (!text) return "";
    try {
        return component ? encodeURIComponent(text) : encodeURI(text);
    } catch {
        return text;
    }
}

/**
 * URL 文本解码纯函数
 */
export function decodeUrlText(encoded: string, component = true): {result: string; ok: boolean} {
    if (!encoded) return {result: "", ok: true};
    try {
        const result = component ? decodeURIComponent(encoded) : decodeURI(encoded);
        return {result, ok: true};
    } catch {
        return {result: encoded, ok: false};
    }
}

/**
 * Markdown 引用语法包裹/解开 (toggleMarkdownBlockquote)
 * forceAction: "wrap" 强制加引用前缀；"unwrap" 强制去除引用前缀；不传则根据当前状态反转
 */
export function toggleMarkdownBlockquote(text: string, forceAction?: "wrap" | "unwrap"): {result: string; isWrapped: boolean} {
    if (!text) return {result: "", isWrapped: false};
    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    const allQuoted = lines.every((l) => l.trim().length === 0 || l.startsWith("> ") || l === ">");
    const shouldUnwrap = forceAction === "unwrap" || (forceAction !== "wrap" && allQuoted);

    if (shouldUnwrap) {
        const unquoted = lines.map((l) => {
            if (l.startsWith("> ")) return l.slice(2);
            if (l.startsWith(">")) return l.slice(1);
            return l;
        });
        return {result: unquoted.join("\n"), isWrapped: false};
    } else {
        const quoted = lines.map((l) => (l.length > 0 ? `> ${l}` : ">"));
        return {result: quoted.join("\n"), isWrapped: true};
    }
}

/**
 * Markdown 代码围栏语法包裹 (wrapMarkdownCodefence)
 */
export function wrapMarkdownCodefence(text: string, lang = ""): string {
    const cleanLang = lang.trim();
    return "```" + cleanLang + "\n" + (text ?? "") + "\n```";
}

const HTML_ESCAPE_MAP: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
};

const HTML_UNESCAPE_MAP: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&nbsp;": " ",
};

/**
 * HTML 实体安全转义
 */
export function escapeHtmlEntities(text: string): string {
    if (!text) return "";
    return text.replace(/[&<>"']/g, (m) => HTML_ESCAPE_MAP[m] || m);
}

/**
 * HTML 实体安全还原（反转义）
 */
export function unescapeHtmlEntities(text: string): string {
    if (!text) return "";
    return text.replace(/&(?:amp|lt|gt|quot|#39|apos|nbsp);/gi, (m) => {
        const lower = m.toLowerCase();
        return HTML_UNESCAPE_MAP[lower] ?? m;
    });
}

/**
 * 计算字符显示宽度（CJK 字符按 2 计算，ASCII 按 1 计算）
 */
function getDisplayWidth(str: string): number {
    let width = 0;
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        if (
            (code >= 0x4e00 && code <= 0x9fff) ||
            (code >= 0x3400 && code <= 0x4dbf) ||
            (code >= 0x3000 && code <= 0x303f) ||
            (code >= 0xff01 && code <= 0xff60)
        ) {
            width += 2;
        } else {
            width += 1;
        }
    }
    return width;
}

/**
 * 填充空格至指定显示宽度
 */
function padDisplayWidth(str: string, targetWidth: number, align: "left" | "center" | "right" = "left"): string {
    const curWidth = getDisplayWidth(str);
    const diff = Math.max(0, targetWidth - curWidth);
    if (diff === 0) return str;
    if (align === "right") {
        return " ".repeat(diff) + str;
    } else if (align === "center") {
        const left = Math.floor(diff / 2);
        const right = diff - left;
        return " ".repeat(left) + str + " ".repeat(right);
    } else {
        return str + " ".repeat(diff);
    }
}

export interface MarkdownTableFormatResult {
    result: string;
    isTable: boolean;
    rowCount: number;
    colCount: number;
}

/**
 * Markdown 表格排版规范化与列宽自适应对齐 (formatMarkdownTable)
 */
export function formatMarkdownTable(text: string): MarkdownTableFormatResult {
    if (!text || !text.includes("|")) {
        return {result: text ?? "", isTable: false, rowCount: 0, colCount: 0};
    }

    const lines = text.replace(/\r\n?/g, "\n").split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) {
        return {result: text, isTable: false, rowCount: 0, colCount: 0};
    }

    // 寻找分隔行（通常第 2 行形如 |---|:---:|---:|）
    const isDividerLine = (line: string) => /^\|?(?:\s*:?-+:?\s*\|?)+$/.test(line);
    const dividerIdx = lines.findIndex((l, idx) => idx > 0 && isDividerLine(l));
    if (dividerIdx === -1) {
        return {result: text, isTable: false, rowCount: 0, colCount: 0};
    }

    // 解析各行单元格
    const splitRow = (line: string): string[] => {
        let clean = line;
        if (clean.startsWith("|")) clean = clean.slice(1);
        if (clean.endsWith("|")) clean = clean.slice(0, -1);
        return clean.split("|").map((cell) => cell.trim());
    };

    const tableRows = lines.map(splitRow);
    const maxCols = Math.max(...tableRows.map((r) => r.length));
    if (maxCols === 0) {
        return {result: text, isTable: false, rowCount: 0, colCount: 0};
    }

    // 补齐各行缺失的单元格
    for (const row of tableRows) {
        while (row.length < maxCols) {
            row.push("");
        }
    }

    // 解析分隔行的对齐定义
    const dividerRow = tableRows[dividerIdx]!;
    const alignments: Array<"left" | "center" | "right"> = dividerRow.map((cell) => {
        const leftColon = cell.startsWith(":");
        const rightColon = cell.endsWith(":");
        if (leftColon && rightColon) return "center";
        if (rightColon) return "right";
        return "left";
    });

    // 计算各列最大显示宽度（至少为 3）
    const colWidths: number[] = new Array(maxCols).fill(3);
    for (let r = 0; r < tableRows.length; r++) {
        if (r === dividerIdx) continue;
        const row = tableRows[r]!;
        for (let c = 0; c < maxCols; c++) {
            const w = getDisplayWidth(row[c] || "");
            if (w > colWidths[c]!) {
                colWidths[c] = w;
            }
        }
    }

    // 格式化输出各行
    const formattedLines: string[] = [];
    for (let r = 0; r < tableRows.length; r++) {
        if (r === dividerIdx) {
            // 生成规范分隔行
            const dividerCells = colWidths.map((width, c) => {
                const align = alignments[c] ?? "left";
                if (align === "center") {
                    return ":" + "-".repeat(Math.max(1, width - 2)) + ":";
                } else if (align === "right") {
                    return "-".repeat(Math.max(2, width - 1)) + ":";
                } else {
                    return ":" + "-".repeat(Math.max(2, width - 1));
                }
            });
            formattedLines.push(`| ${dividerCells.join(" | ")} |`);
        } else {
            const row = tableRows[r]!;
            const paddedCells = row.map((cell, c) => {
                const align = alignments[c] ?? "left";
                return padDisplayWidth(cell, colWidths[c]!, align);
            });
            formattedLines.push(`| ${paddedCells.join(" | ")} |`);
        }
    }

    return {
        result: formattedLines.join("\n"),
        isTable: true,
        rowCount: tableRows.length,
        colCount: maxCols,
    };
}

export interface CsvToJsonOptions {
    /** 自定义分隔符，不传则自动嗅探（支持制表符 \t、逗号 , 与分号 ;） */
    delimiter?: string;
    /** 是否美化格式缩进（默认 true） */
    pretty?: boolean;
}

export interface CsvToJsonResult {
    result: string;
    ok: boolean;
    count: number;
    headers: string[];
}

/**
 * 将 CSV/TSV 文本解析并转换为结构化 JSON 字符串
 */
export function csvToJson(text: string, options: CsvToJsonOptions = {}): CsvToJsonResult {
    if (!text || typeof text !== "string") {
        return {result: "", ok: false, count: 0, headers: []};
    }

    const lines = text.replace(/\r\n?/g, "\n").split("\n").filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
        return {result: text, ok: false, count: 0, headers: []};
    }

    // 嗅探分隔符
    let delim = options.delimiter;
    if (!delim) {
        const firstLine = lines[0]!;
        const tabCount = (firstLine.match(/\t/g) || []).length;
        const commaCount = (firstLine.match(/,/g) || []).length;
        const semiCount = (firstLine.match(/;/g) || []).length;
        if (tabCount >= commaCount && tabCount >= semiCount && tabCount > 0) {
            delim = "\t";
        } else if (semiCount > commaCount && semiCount > 0) {
            delim = ";";
        } else {
            delim = ",";
        }
    }

    // RFC 4180 简易行解析器（支持双引号包裹字段与转义双引号 ""）
    const parseLine = (line: string): string[] => {
        const fields: string[] = [];
        let cur = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i]!;
            if (ch === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    cur += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch === delim && !inQuotes) {
                fields.push(cur.trim());
                cur = "";
            } else {
                cur += ch;
            }
        }
        fields.push(cur.trim());
        return fields;
    };

    const headerFields = parseLine(lines[0]!);
    if (headerFields.length === 0 || headerFields.every((h) => !h)) {
        return {result: text, ok: false, count: 0, headers: []};
    }

    const records: Array<Record<string, string>> = [];
    for (let i = 1; i < lines.length; i++) {
        const row = parseLine(lines[i]!);
        if (row.length === 0 || (row.length === 1 && !row[0])) continue;
        const record: Record<string, string> = {};
        for (let c = 0; c < headerFields.length; c++) {
            const key = headerFields[c] || `col_${c + 1}`;
            record[key] = row[c] ?? "";
        }
        records.push(record);
    }

    const pretty = options.pretty !== false;
    const jsonStr = pretty ? JSON.stringify(records, null, 2) : JSON.stringify(records);
    return {
        result: jsonStr,
        ok: true,
        count: records.length,
        headers: headerFields,
    };
}

export type TaskToggleAction = "check-all" | "uncheck-all" | "invert";

export interface TaskToggleResult {
    result: string;
    changedCount: number;
    totalTasks: number;
}

/**
 * 批量切换 Markdown 待办任务清单状态 (- [ ] 与 - [x])
 */
export function toggleMarkdownTaskStatus(text: string, action: TaskToggleAction = "check-all"): TaskToggleResult {
    if (!text || typeof text !== "string") {
        return {result: text ?? "", changedCount: 0, totalTasks: 0};
    }

    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    let changedCount = 0;
    let totalTasks = 0;

    const uncheckPattern = /^(\s*[-*+]\s+\[) (\]\s+.*)$/;
    const checkedPattern = /^(\s*[-*+]\s+\[)[xX](\]\s+.*)$/;

    const converted = lines.map((line) => {
        const isUnchecked = uncheckPattern.test(line);
        const isChecked = checkedPattern.test(line);

        if (!isUnchecked && !isChecked) {
            return line;
        }

        totalTasks++;

        if (action === "check-all") {
            if (isUnchecked) {
                changedCount++;
                return line.replace(uncheckPattern, "$1x$2");
            }
            return line;
        } else if (action === "uncheck-all") {
            if (isChecked) {
                changedCount++;
                return line.replace(checkedPattern, "$1 $2");
            }
            return line;
        } else {
            // invert
            changedCount++;
            if (isUnchecked) {
                return line.replace(uncheckPattern, "$1x$2");
            } else {
                return line.replace(checkedPattern, "$1 $2");
            }
        }
    });

        return {
            result: converted.join("\n"),
            changedCount,
            totalTasks,
        };
    }

export interface ExtractedLink {
    text: string;
    url: string;
    isImage: boolean;
}

export interface ExtractLinksOptions {
    /** 仅提取图片 (默认 false) */
    imagesOnly?: boolean;
    /** 排除图片 (默认 false) */
    excludeImages?: boolean;
    /** 是否包含正文中的纯裸 URL (默认 true) */
    includeRawUrls?: boolean;
    /** 是否按 URL 去重 (默认 true) */
    dedupe?: boolean;
    /** 格式化输出形式：list (Markdown 列表), urls (纯 URL 换行), json (JSON) */
    outputFormat?: "list" | "urls" | "json";
}

export interface ExtractLinksResult {
    links: ExtractedLink[];
    result: string;
    count: number;
}

/**
 * 从 Markdown 文本中提取超链接与图片 URL 资产 (extractMarkdownLinks)
 */
export function extractMarkdownLinks(text: string, options: ExtractLinksOptions = {}): ExtractLinksResult {
    if (!text || typeof text !== "string") {
        return {links: [], result: "", count: 0};
    }

    const imagesOnly = options.imagesOnly === true;
    const excludeImages = options.excludeImages === true;
    const includeRaw = options.includeRawUrls !== false;
    const dedupe = options.dedupe !== false;
    const outputFormat = options.outputFormat || "list";

    const extracted: ExtractedLink[] = [];
    const seenUrls = new Set<string>();

    // 1. 扫描并替换 Markdown 格式链接与图片：(!)?\[(.*?)\]\((.*?)\)
    const mdPattern = /(!)?\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
    let placeholderCounter = 0;
    const placeholders: string[] = [];

    const textWithoutMdLinks = text.replace(mdPattern, (_match, isImg, label, rawUrl) => {
        const isImage = Boolean(isImg);
        const url = (rawUrl || "").trim();
        const linkText = (label || "").trim() || url;

        if (url) {
            let keep = true;
            if (imagesOnly && !isImage) keep = false;
            if (excludeImages && isImage) keep = false;

            if (keep) {
                if (!dedupe || !seenUrls.has(url)) {
                    seenUrls.add(url);
                    extracted.push({
                        text: linkText,
                        url,
                        isImage,
                    });
                }
            }
        }

        placeholders.push(_match);
        return `__XLC_EXTRACT_LINK_${placeholderCounter++}__`;
    });

    // 2. 扫描剩余文本中的裸 URL (如果启用)
    if (includeRaw && !imagesOnly) {
        const rawUrlPattern = /https?:\/\/[^\s)）\]"'>]+/g;
        let m: RegExpExecArray | null = null;
        while ((m = rawUrlPattern.exec(textWithoutMdLinks)) !== null) {
            const rawUrl = m[0].trim();
            // 清理末尾可能的标点符号（如逗号、句号）
            const cleanUrl = rawUrl.replace(/[.,;!?:，。！？；：]+$/, "");
            if (cleanUrl) {
                if (!dedupe || !seenUrls.has(cleanUrl)) {
                    seenUrls.add(cleanUrl);
                    extracted.push({
                        text: cleanUrl,
                        url: cleanUrl,
                        isImage: false,
                    });
                }
            }
        }
    }

    let outputResult = "";
    if (outputFormat === "urls") {
        outputResult = extracted.map((l) => l.url).join("\n");
    } else if (outputFormat === "json") {
        outputResult = JSON.stringify(extracted, null, 2);
    } else {
        // list
        outputResult = extracted.map((l) => {
            const prefix = l.isImage ? "![" : "[";
            return `- ${prefix}${l.text}](${l.url})`;
        }).join("\n");
    }

    return {
        links: extracted,
        result: outputResult,
        count: extracted.length,
    };
}

export type HashAlgorithm = "fnv1a" | "djb2" | "crc32";

export interface HashOptions {
    algorithm?: HashAlgorithm;
    format?: "hex" | "base36";
    length?: number;
}

// CRC-32 查找表
const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    CRC32_TABLE[i] = c;
}

/**
 * 字符串转 UTF-8 字节序列
 */
function stringToUtf8Bytes(str: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < str.length; i++) {
        let code = str.charCodeAt(i);
        if (code >= 0xd800 && code <= 0xdbff) {
            i++;
            const next = str.charCodeAt(i);
            code = ((code - 0xd800) << 10) + (next - 0xdc00) + 0x10000;
        }
        if (code <= 0x7f) {
            bytes.push(code);
        } else if (code <= 0x7ff) {
            bytes.push(0xc0 | (code >> 6));
            bytes.push(0x80 | (code & 0x3f));
        } else if (code <= 0xffff) {
            bytes.push(0xe0 | (code >> 12));
            bytes.push(0x80 | ((code >> 6) & 0x3f));
            bytes.push(0x80 | (code & 0x3f));
        } else {
            bytes.push(0xf0 | (code >> 18));
            bytes.push(0x80 | ((code >> 12) & 0x3f));
            bytes.push(0x80 | ((code >> 6) & 0x3f));
            bytes.push(0x80 | (code & 0x3f));
        }
    }
    return bytes;
}

/**
 * 跨平台安全文本哈希/指纹计算引擎 (generateTextHash)
 */
export function generateTextHash(text: string, options: HashOptions | HashAlgorithm = "fnv1a"): string {
    if (!text) return "";
    const opts: HashOptions = typeof options === "string" ? {algorithm: options} : options;
    const algo = opts.algorithm || "fnv1a";
    const format = opts.format || "hex";
    const bytes = stringToUtf8Bytes(text);

    let numVal = 0;
    if (algo === "fnv1a") {
        let hash = 2166136261;
        for (let i = 0; i < bytes.length; i++) {
            hash ^= bytes[i]!;
            hash = Math.imul(hash, 16777619);
        }
        numVal = hash >>> 0;
    } else if (algo === "djb2") {
        let hash = 5381;
        for (let i = 0; i < bytes.length; i++) {
            hash = ((hash << 5) + hash) + bytes[i]!;
            hash |= 0;
        }
        numVal = hash >>> 0;
    } else if (algo === "crc32") {
        let crc = 0xFFFFFFFF;
        for (let i = 0; i < bytes.length; i++) {
            crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ bytes[i]!) & 0xFF]!;
        }
        numVal = (crc ^ 0xFFFFFFFF) >>> 0;
    }

    let result = "";
    if (format === "base36") {
        result = numVal.toString(36);
    } else {
        result = numVal.toString(16).padStart(8, "0");
    }

    if (opts.length && opts.length > 0) {
        result = result.slice(0, opts.length);
    }
    return result;
}

export interface AffixLinesOptions {
    /** 每行前缀 */
    prefix?: string;
    /** 每行后缀 */
    suffix?: string;
    /** 是否忽略空行（默认 true，空行不加前后缀） */
    ignoreEmpty?: boolean;
    /** 是否清理行首行尾空白（默认 false） */
    trimLines?: boolean;
}

export interface AffixLinesResult {
    result: string;
    lineCount: number;
    changedCount: number;
}

/**
 * 多行文本批量添加行前后缀引擎 (affixLines)
 */
export function affixLines(text: string, options: AffixLinesOptions = {}): AffixLinesResult {
    if (!text || typeof text !== "string") {
        return {result: text ?? "", lineCount: 0, changedCount: 0};
    }

    const prefix = options.prefix || "";
    const suffix = options.suffix || "";
    const ignoreEmpty = options.ignoreEmpty !== false;
    const trimLines = options.trimLines === true;

    if (!prefix && !suffix && !trimLines) {
        const total = text.split("\n").length;
        return {result: text, lineCount: total, changedCount: 0};
    }

    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    let changedCount = 0;

    const processed = lines.map((line) => {
        const curLine = trimLines ? line.trim() : line;
        if (ignoreEmpty && curLine.length === 0) {
            return curLine;
        }
        changedCount++;
        return `${prefix}${curLine}${suffix}`;
    });

    return {
        result: processed.join("\n"),
        lineCount: lines.length,
        changedCount,
    };
}

const MINOR_WORDS = new Set([
    "a", "an", "the", "in", "on", "of", "for", "and", "or", "but", "to", "with", "at", "by", "from", "as",
]);

export interface TitleCaseOptions {
    /** 转换样式：title (标准英文标题), sentence (句首首字母大写) */
    style?: "title" | "sentence";
    /** 是否保护冠词与短介词在非首尾词时小写（默认 true） */
    protectMinorWords?: boolean;
}

/**
 * 多行文本英文标题化与首字母大小写规整 (titleCaseLines)
 */
export function titleCaseLines(text: string, options: TitleCaseOptions = {}): string {
    if (!text || typeof text !== "string") return text ?? "";
    const style = options.style || "title";
    const protect = options.protectMinorWords !== false;

    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    const converted = lines.map((line) => {
        if (!line.trim()) return line;

        if (style === "sentence") {
            // 句首大写：找到第一个英文字母大写
            let found = false;
            return line.replace(/[a-zA-Z]/, (ch) => {
                if (!found) {
                    found = true;
                    return ch.toUpperCase();
                }
                return ch;
            });
        }

        // title 模式：按单词边界切分
        const parts = line.split(/(\s+|[-_/])/);
        const wordIndices: number[] = [];
        for (let i = 0; i < parts.length; i++) {
            if (/[a-zA-Z0-9]/.test(parts[i]!)) {
                wordIndices.push(i);
            }
        }

        if (wordIndices.length === 0) return line;

        const firstIdx = wordIndices[0]!;
        const lastIdx = wordIndices[wordIndices.length - 1]!;

        for (const idx of wordIndices) {
            const rawWord = parts[idx]!;
            const lower = rawWord.toLowerCase();

            // 若首尾词或非小词，首字母大写
            if (idx === firstIdx || idx === lastIdx || !protect || !MINOR_WORDS.has(lower)) {
                parts[idx] = lower.charAt(0).toUpperCase() + lower.slice(1);
            } else {
                parts[idx] = lower;
            }
        }

        return parts.join("");
    });

    return converted.join("\n");
}

/**
 * 多行文本行顺序倒序反转 (reverseLines)
 */
export function reverseLines(text: string): string {
    if (!text || !text.includes("\n")) return text ?? "";
    return text.replace(/\r\n?/g, "\n").split("\n").reverse().join("\n");
}

export interface SortLinesByLengthOptions {
    /** 是否降序（默认 false，升序从短到长；true 为从长到短） */
    descending?: boolean;
    /** 是否在计算长度时剔除首尾空白（默认 false） */
    trim?: boolean;
}

/**
 * 多行文本按行字符长度排序 (sortLinesByLength)
 */
export function sortLinesByLength(text: string, options: SortLinesByLengthOptions = {}): string {
    if (!text || !text.includes("\n")) return text ?? "";
    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    const desc = options.descending === true;
    const trim = options.trim === true;

    return lines.slice().sort((a, b) => {
        const lenA = (trim ? a.trim() : a).length;
        const lenB = (trim ? b.trim() : b).length;
        return desc ? lenB - lenA : lenA - lenB;
    }).join("\n");
}

export type NumberLineFormat = "decimal" | "padded" | "bracket" | "circled";

export interface NumberLinesOptions {
    /** 起始序号（默认 1） */
    startFrom?: number;
    /** 编号格式：decimal (1. ), padded (01. ), bracket ([1] ), circled (① ) */
    format?: NumberLineFormat;
    /** 分隔符（默认 ". "，bracket/circled 时有专属格式） */
    separator?: string;
    /** 是否忽略空行（默认 true，空行不加序号且不计数） */
    ignoreEmpty?: boolean;
}

export interface NumberLinesResult {
    result: string;
    lineCount: number;
    numberedCount: number;
}

/**
 * 批量为多行文本添加行编号 (numberLines)
 */
export function numberLines(text: string, options: NumberLinesOptions = {}): NumberLinesResult {
    if (!text || typeof text !== "string") {
        return {result: text ?? "", lineCount: 0, numberedCount: 0};
    }

    const startFrom = Math.max(0, options.startFrom ?? 1);
    const format = options.format || "decimal";
    const sep = options.separator !== undefined ? options.separator : ". ";
    const ignoreEmpty = options.ignoreEmpty !== false;

    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    let currentNum = startFrom;
    let numberedCount = 0;

    const processed = lines.map((line) => {
        if (ignoreEmpty && line.trim().length === 0) {
            return line;
        }

        let prefix = "";
        if (format === "padded") {
            const padStr = String(currentNum).padStart(2, "0");
            prefix = `${padStr}${sep}`;
        } else if (format === "bracket") {
            prefix = `[${currentNum}] `;
        } else if (format === "circled") {
            const digit = CIRCLED_DIGITS[currentNum - 1] || `(${currentNum})`;
            prefix = `${digit} `;
        } else {
            // decimal
            prefix = `${currentNum}${sep}`;
        }

        currentNum++;
        numberedCount++;
        return `${prefix}${line}`;
    });

    return {
        result: processed.join("\n"),
        lineCount: lines.length,
        numberedCount,
    };
}

export interface TrimLinesAdvancedOptions {
    /** 是否去除每行行尾空格与制表符 (默认 true) */
    trimTrailing?: boolean;
    /** 是否去除每行统一的最小公共前置缩进 (默认 false) */
    trimCommonIndent?: boolean;
    /** 是否去除整篇文本首尾的连续空行 (默认 true) */
    trimDocumentEnds?: boolean;
}

export interface TrimLinesAdvancedResult {
    result: string;
    hasChanges: boolean;
    trimmedCount: number;
}

/**
 * 多行文本高级修剪与行首尾空白清洗 (trimLinesAdvanced)
 */
export function trimLinesAdvanced(text: string, options: TrimLinesAdvancedOptions = {}): TrimLinesAdvancedResult {
    if (!text || typeof text !== "string") {
        return {result: text ?? "", hasChanges: false, trimmedCount: 0};
    }

    const trimTrailing = options.trimTrailing !== false;
    const trimCommonIndent = options.trimCommonIndent === true;
    const trimEnds = options.trimDocumentEnds !== false;

    let lines = text.replace(/\r\n?/g, "\n").split("\n");
    let trimmedCount = 0;

    // 1. 去除首尾连续空行
    if (trimEnds) {
        while (lines.length > 0 && lines[0]!.trim().length === 0) {
            lines.shift();
            trimmedCount++;
        }
        while (lines.length > 0 && lines[lines.length - 1]!.trim().length === 0) {
            lines.pop();
            trimmedCount++;
        }
    }

    // 2. 去除统一的最小公共缩进
    if (trimCommonIndent && lines.length > 0) {
        let minIndent = Infinity;
        for (const line of lines) {
            if (!line.trim()) continue;
            const match = line.match(/^[ \t]+/);
            const indentLen = match ? match[0].length : 0;
            if (indentLen < minIndent) minIndent = indentLen;
        }
        if (minIndent > 0 && Number.isFinite(minIndent)) {
            lines = lines.map((l) => (l.trim().length > 0 ? l.slice(minIndent) : l));
            trimmedCount++;
        }
    }

    // 3. 去除每行行尾空格
    if (trimTrailing) {
        lines = lines.map((l) => {
            const trimmed = l.replace(/[ \t]+$/, "");
            if (trimmed.length !== l.length) trimmedCount++;
            return trimmed;
        });
    }

    const resStr = lines.join("\n");
    return {
        result: resStr,
        hasChanges: resStr !== text,
        trimmedCount,
    };
}

export type ObjectQuotesMode = "to-json" | "to-js";

export interface NormalizeObjectQuotesResult {
    result: string;
    convertedCount: number;
}

/**
 * JSON/JS 对象属性键名与字符串引号规范化 (normalizeObjectQuotes)
 */
export function normalizeObjectQuotes(text: string, mode: ObjectQuotesMode = "to-json"): NormalizeObjectQuotesResult {
    if (!text || typeof text !== "string") {
        return {result: text ?? "", convertedCount: 0};
    }

    let convertedCount = 0;
    let res = text;

    if (mode === "to-json") {
        // 1. 单引号属性名转双引号: 'key': -> "key":
        res = res.replace(/'([a-zA-Z0-9_$-]+)'\s*:/g, (_, key) => {
            convertedCount++;
            return `"${key}":`;
        });
        // 2. 无引号属性名转双引号: ([{,]\s*)([a-zA-Z0-9_$-]+)\s*:
        res = res.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_$-]*)\s*:/g, (_match, prefix, key) => {
            convertedCount++;
            return `${prefix}"${key}":`;
        });
        // 3. 单引号字符串值转双引号: : 'value' -> : "value"
        res = res.replace(/:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, val) => {
            convertedCount++;
            return `: "${val.replace(/"/g, '\\"')}"`;
        });
    } else {
        // to-js: 标准标识符双引号键名转无引号: "key": -> key:
        res = res.replace(/"([a-zA-Z_][a-zA-Z0-9_]*)"\s*:/g, (_, key) => {
            convertedCount++;
            return `${key}:`;
        });
    }

    return {
        result: res,
        convertedCount,
    };
}

export interface TruncateOptions {
    maxLength: number;
    ellipsis?: string;
}

/**
 * 文本定长截断与省略号追加 (truncateText)
 */
export function truncateText(text: string, options: number | TruncateOptions): string {
    if (!text || typeof text !== "string") return text ?? "";
    const opts: TruncateOptions = typeof options === "number" ? {maxLength: options} : options;
    const maxLen = Math.max(1, opts.maxLength);
    const ellipsis = opts.ellipsis !== undefined ? opts.ellipsis : "...";

    if (text.length <= maxLen) {
        return text;
    }

    const truncated = text.slice(0, maxLen);
    return `${truncated}${ellipsis}`;
}

export interface StripAffixesOptions {
    /** 要剥离的前缀字符串、正则或预设 ("list" | "quote") */
    prefix?: string | RegExp | "list" | "quote";
    /** 要剥离的后缀字符串或正则 */
    suffix?: string | RegExp;
    /** 是否忽略空行 (默认 true) */
    ignoreEmpty?: boolean;
}

export interface StripAffixesResult {
    result: string;
    strippedCount: number;
    lineCount: number;
}

/**
 * 多行文本批量剥离前缀与后缀 (stripAffixes)
 */
export function stripAffixes(text: string, options: StripAffixesOptions = {}): StripAffixesResult {
    if (!text || typeof text !== "string") {
        return {result: text ?? "", strippedCount: 0, lineCount: 0};
    }

    const ignoreEmpty = options.ignoreEmpty !== false;
    let prefixMatcher: RegExp | null = null;

    if (options.prefix === "list") {
        prefixMatcher = /^\s*(?:[-*+]\s+|\d+[.、)]\s*|[①-⑳]\s*)/;
    } else if (options.prefix === "quote") {
        prefixMatcher = /^\s*>\s*/;
    } else if (options.prefix instanceof RegExp) {
        prefixMatcher = options.prefix;
    } else if (typeof options.prefix === "string" && options.prefix.length > 0) {
        const escaped = options.prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        prefixMatcher = new RegExp(`^${escaped}`);
    }

    let suffixMatcher: RegExp | null = null;
    if (options.suffix instanceof RegExp) {
        suffixMatcher = options.suffix;
    } else if (typeof options.suffix === "string" && options.suffix.length > 0) {
        const escaped = options.suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        suffixMatcher = new RegExp(`${escaped}$`);
    }

    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    let strippedCount = 0;

    const processed = lines.map((line) => {
        if (ignoreEmpty && line.trim().length === 0) return line;

        let cur = line;
        let modified = false;

        if (prefixMatcher && prefixMatcher.test(cur)) {
            cur = cur.replace(prefixMatcher, "");
            modified = true;
        }

        if (suffixMatcher && suffixMatcher.test(cur)) {
            cur = cur.replace(suffixMatcher, "");
            modified = true;
        }

        if (modified) strippedCount++;
        return cur;
    });

    return {
        result: processed.join("\n"),
        strippedCount,
        lineCount: lines.length,
    };
}

export interface PropertiesConvertResult {
    result: string;
    count: number;
    ok: boolean;
}

/**
 * Key-Value / Properties 文本转换为标准 JSON 字符串
 */
export function propertiesToJson(text: string): PropertiesConvertResult {
    if (!text || typeof text !== "string") {
        return {result: "{}", count: 0, ok: false};
    }

    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    const record: Record<string, string> = {};
    let count = 0;

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#") || line.startsWith("!")) {
            continue;
        }

        const eqIdx = line.indexOf("=");
        const colonIdx = line.indexOf(":");
        let splitIdx = -1;

        if (eqIdx !== -1 && colonIdx !== -1) {
            splitIdx = Math.min(eqIdx, colonIdx);
        } else if (eqIdx !== -1) {
            splitIdx = eqIdx;
        } else if (colonIdx !== -1) {
            splitIdx = colonIdx;
        }

        if (splitIdx === -1) continue;

        const key = line.slice(0, splitIdx).trim();
        const value = line.slice(splitIdx + 1).trim();

        if (key) {
            record[key] = value;
            count++;
        }
    }

    if (count === 0) {
        return {result: text, count: 0, ok: false};
    }

    return {
        result: JSON.stringify(record, null, 2),
        count,
        ok: true,
    };
}

/**
 * JSON 对象转换为 Key-Value / Properties 文本
 */
export function jsonToProperties(text: string): PropertiesConvertResult {
    if (!text || typeof text !== "string") {
        return {result: "", count: 0, ok: false};
    }

    try {
        const parsed = JSON.parse(text.trim());
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
            return {result: text, count: 0, ok: false};
        }

        const lines: string[] = [];
        let count = 0;

        for (const [key, val] of Object.entries(parsed)) {
            lines.push(`${key}=${val !== null && val !== undefined ? String(val) : ""}`);
            count++;
        }

        return {
            result: lines.join("\n"),
            count,
            ok: true,
        };
    } catch {
        return {result: text, count: 0, ok: false};
    }
}

export type MaskType = "phone" | "email" | "idcard" | "auto";

export interface MaskOptions {
    type?: MaskType;
}

/**
 * 文本敏感信息智能掩码脱敏 (maskSensitiveText)
 */
export function maskSensitiveText(text: string, options: MaskOptions | MaskType = "auto"): string {
    if (!text || typeof text !== "string") return text ?? "";
    const type = typeof options === "string" ? options : (options.type || "auto");

    let res = text;

    if (type === "idcard" || type === "auto") {
        // 身份证 18 位脱敏：保留前 6 后 4，中间 8 位用 ******** 替换
        res = res.replace(/(?<!\d)([1-9]\d{5})\d{8}(\w{4})(?!\w)/g, "$1********$2");
    }

    if (type === "phone" || type === "auto") {
        // 手机号 11 位脱敏：保留前 3 后 4，中间 4 位用 **** 替换
        res = res.replace(/(?<!\d)(1[3-9]\d)\d{4}(\d{4})(?!\d)/g, "$1****$2");
    }

    if (type === "email" || type === "auto") {
        // 邮箱脱敏：保留首字母，其余到 @ 前用 *** 替换
        res = res.replace(/([a-zA-Z0-9_.+-])[a-zA-Z0-9_.+-]*(@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/g, "$1***$2");
    }

    return res;
}

export interface JoinLinesOptions {
    /** 连接分隔符（默认 ", "） */
    delimiter?: string;
    /** 是否忽略空行（默认 true） */
    ignoreEmpty?: boolean;
    /** 是否预清洗行首尾空白（默认 true） */
    trimLines?: boolean;
}

/**
 * 将多行文本使用指定分隔符连成单行字符串 (joinLinesWithDelimiter)
 */
export function joinLinesWithDelimiter(text: string, options: string | JoinLinesOptions = {}): string {
    if (!text || typeof text !== "string") return text ?? "";
    const opts: JoinLinesOptions = typeof options === "string" ? {delimiter: options} : options;
    const delim = opts.delimiter !== undefined ? opts.delimiter : ", ";
    const ignoreEmpty = opts.ignoreEmpty !== false;
    const trimLines = opts.trimLines !== false;

    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    const filtered = lines
        .map((l) => (trimLines ? l.trim() : l))
        .filter((l) => (ignoreEmpty ? l.length > 0 : true));
    return filtered.join(delim);
}

/**
 * 将使用常见标点（逗号、分号、竖线、制表符）分隔的单行文本拆分为多行文本 (splitTextToLines)
 */
export function splitTextToLines(text: string, delimiter: string | RegExp = /[,，;；|｜\t]+/): string {
    if (!text || typeof text !== "string") return text ?? "";
    return text
        .split(delimiter)
        .map((s) => s.trim())
        .filter(Boolean)
        .join("\n");
}

const CN_DIGITS = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"];
const CN_UNITS = ["", "拾", "佰", "仟"];
const CN_BIG_UNITS = ["", "万", "亿", "兆"];

/**
 * 将数字或金额字符串转换为标准中文人民币大写 (formatChineseCurrency)
 * 如 1234.56 -> 壹仟贰佰叁拾肆元伍角陆分
 */
export function formatChineseCurrency(amount: number | string): string {
    if (amount === undefined || amount === null || amount === "") return "";
    let strVal = String(amount).trim();
    if (strVal.startsWith("￥") || strVal.startsWith("$")) {
        strVal = strVal.slice(1).trim();
    }
    const num = Number(strVal);
    if (!Number.isFinite(num)) return String(amount);

    if (num === 0) return "零元整";

    let prefix = "";
    let absNum = num;
    if (absNum < 0) {
        prefix = "负";
        absNum = Math.abs(absNum);
    }

    // 四舍五入保留两位小数并转为分
    const totalCents = Math.round(absNum * 100);
    const integerPart = Math.floor(totalCents / 100);
    const jiao = Math.floor((totalCents % 100) / 10);
    const fen = totalCents % 10;

    let chineseStr = "";

    if (integerPart > 0) {
        let intStr = String(integerPart);
        // 按 4 位分节（从个位向高位）
        const sections: string[] = [];
        while (intStr.length > 0) {
            sections.unshift(intStr.slice(-4));
            intStr = intStr.slice(0, -4);
        }

        let hasPrecedingNonZero = false;

        for (let sIdx = 0; sIdx < sections.length; sIdx++) {
            const section = sections[sIdx]!;
            const sectionNum = parseInt(section, 10);
            const bigUnit = CN_BIG_UNITS[sections.length - 1 - sIdx] || "";

            if (sectionNum === 0) {
                continue;
            }

            let sectionStr = "";
            let zeroFlag = false;

            if (hasPrecedingNonZero && section.length < 4) {
                sectionStr += CN_DIGITS[0];
            }

            const rawLen = section.length;
            for (let i = 0; i < rawLen; i++) {
                const digit = parseInt(section[i]!, 10);
                const unit = CN_UNITS[rawLen - 1 - i]!;
                if (digit === 0) {
                    zeroFlag = true;
                } else {
                    if (zeroFlag) {
                        sectionStr += CN_DIGITS[0];
                        zeroFlag = false;
                    }
                    sectionStr += CN_DIGITS[digit]! + unit;
                }
            }

            chineseStr += sectionStr + bigUnit;
            hasPrecedingNonZero = true;
        }

        chineseStr += "元";
    }

    if (jiao === 0 && fen === 0) {
        chineseStr += "整";
    } else {
        if (integerPart > 0 && jiao === 0) {
            chineseStr += "零";
        }
        if (jiao > 0) {
            chineseStr += CN_DIGITS[jiao]! + "角";
        }
        if (fen > 0) {
            chineseStr += CN_DIGITS[fen]! + "分";
        }
    }

    return `${prefix}${chineseStr}`;
}

export interface InitialsOptions {
    /** 是否强制大写 (默认 true) */
    uppercase?: boolean;
    /** 分隔符 (默认无分隔符 "") */
    separator?: string;
}

/**
 * 提取文本词组的首字母缩写 (extractInitials)
 * 如 "Central Processing Unit" -> "CPU"
 */
export function extractInitials(text: string, options: InitialsOptions = {}): string {
    if (!text || typeof text !== "string") return "";
    const uppercase = options.uppercase !== false;
    const sep = options.separator || "";

    // 匹配单词或中文单字
    const words = text.match(/[a-zA-Z0-9]+|[\u4e00-\u9fa5]/g);
    if (!words || words.length === 0) return "";

    const initials = words.map((w) => {
        const first = w.charAt(0);
        return uppercase ? first.toUpperCase() : first;
    });

    return initials.join(sep);
}

export interface StripMarkdownOptions {
    /** 是否保留超链接中的文本（默认 true，如 [思源](url) -> 思源） */
    keepLinksText?: boolean;
    /** 是否保留代码块/行内代码的内容（默认 true） */
    keepCodeContent?: boolean;
}

/**
 * 剥离 Markdown 格式语法标记，提取纯文本 (stripMarkdownFormatting)
 */
export function stripMarkdownFormatting(text: string, options: StripMarkdownOptions = {}): string {
    if (!text || typeof text !== "string") return text ?? "";
    const keepLinksText = options.keepLinksText !== false;
    const keepCodeContent = options.keepCodeContent !== false;

    let res = text.replace(/\r\n?/g, "\n");

    // 1. 代码围栏 ```lang\ncode\n```
    res = res.replace(/```[a-zA-Z0-9_-]*\n([\s\S]*?)\n```/g, (_, code) => (keepCodeContent ? code : ""));

    // 2. 行内代码 `code`
    res = res.replace(/`([^`]+)`/g, (_, code) => (keepCodeContent ? code : ""));

    // 3. 图片与超链接
    res = res.replace(/!\[([^\]]*)\]\([^)]+\)/g, (_, alt) => (alt ? `[图片: ${alt}]` : ""));
    res = res.replace(/\[([^\]]+)\]\([^)]+\)/g, (_, label) => (keepLinksText ? label : ""));

    // 4. 标题符号 # H1 -> H1
    res = res.replace(/^#{1,6}\s+/gm, "");

    // 5. 引用符号 > quote -> quote
    res = res.replace(/^>\s*/gm, "");

    // 6. 粗体、斜体与删除线
    res = res.replace(/[*_]{2}([^*_]+)[*_]{2}/g, "$1");
    res = res.replace(/[*_]([^*_]+)[*_]/g, "$1");
    res = res.replace(/~~([^~]+)~~/g, "$1");

    // 7. 水平分割线
    res = res.replace(/^[-*_]{3,}\s*$/gm, "");

    return res.trim();
}

/**
 * 将字节数值格式化为人类可读的容量单位 (formatByteSize)
 * 如 1048576 -> 1.00 MB, 1024 -> 1.00 KB
 */
export function formatByteSize(bytes: number | string, decimals = 2): string {
    if (bytes === undefined || bytes === null || bytes === "") return "";
    const num = Number(bytes);
    if (!Number.isFinite(num)) return String(bytes);
    if (num === 0) return "0 B";

    const k = 1024;
    const dm = Math.max(0, decimals);
    const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB"];

    const isNegative = num < 0;
    const absVal = Math.abs(num);

    const i = Math.floor(Math.log(absVal) / Math.log(k));
    const unitIndex = Math.min(i, sizes.length - 1);
    const val = absVal / Math.pow(k, unitIndex);

    const formatted = parseFloat(val.toFixed(dm));
    return `${isNegative ? "-" : ""}${formatted} ${sizes[unitIndex]}`;
}

export interface ShuffleLinesOptions {
    /** 是否忽略空行（默认 true，空行不参与洗牌） */
    ignoreEmpty?: boolean;
}

/**
 * 多行文本公平随机洗牌打乱 (shuffleLines)
 * 基于标准 Fisher-Yates 算法
 */
export function shuffleLines(text: string, options: ShuffleLinesOptions = {}): string {
    if (!text || !text.includes("\n")) return text ?? "";
    const ignoreEmpty = options.ignoreEmpty !== false;

    const rawLines = text.replace(/\r\n?/g, "\n").split("\n");
    const linesToShuffle = ignoreEmpty ? rawLines.filter((l) => l.trim().length > 0) : rawLines.slice();

    // Fisher-Yates 洗牌
    for (let i = linesToShuffle.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = linesToShuffle[i]!;
        linesToShuffle[i] = linesToShuffle[j]!;
        linesToShuffle[j] = temp;
    }

    return linesToShuffle.join("\n");
}

export interface FilterLinesOptions {
    /** 是否反转过滤条件（true 为排除匹配行，相当于 grep -v；默认 false 为保留匹配行） */
    invert?: boolean;
    /** 是否区分大小写（默认 false） */
    caseSensitive?: boolean;
    /** 是否预清理行首尾空白（默认 false） */
    trimLines?: boolean;
}

export interface FilterLinesResult {
    result: string;
    matchedCount: number;
    totalCount: number;
}

/**
 * 多行文本关键词/正则过滤与提取 (filterLines)
 */
export function filterLines(text: string, pattern: string | RegExp, options: FilterLinesOptions = {}): FilterLinesResult {
    if (!text || typeof text !== "string") {
        return {result: text ?? "", matchedCount: 0, totalCount: 0};
    }

    const invert = options.invert === true;
    const caseSensitive = options.caseSensitive === true;
    const trimLines = options.trimLines === true;

    let regex: RegExp;
    if (pattern instanceof RegExp) {
        regex = pattern;
    } else {
        const escaped = String(pattern).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        regex = new RegExp(escaped, caseSensitive ? "" : "i");
    }

    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    let matchedCount = 0;

    const filtered = lines.filter((rawLine) => {
        const line = trimLines ? rawLine.trim() : rawLine;
        const matches = regex.test(line);
        if (matches) matchedCount++;
        return invert ? !matches : matches;
    });

    return {
        result: filtered.join("\n"),
        matchedCount,
        totalCount: lines.length,
    };
}

/**
 * 字符级文本逆序反转 (reverseText)
 * 正确处理多字节 Unicode 与 Emoji 符号
 */
export function reverseText(text: string): string {
    if (!text || typeof text !== "string") return text ?? "";
    return Array.from(text).reverse().join("");
}

const ROMAN_MAP: Array<[string, number]> = [
    ["M", 1000],
    ["CM", 900],
    ["D", 500],
    ["CD", 400],
    ["C", 100],
    ["XC", 90],
    ["L", 50],
    ["XL", 40],
    ["X", 10],
    ["IX", 9],
    ["V", 5],
    ["IV", 4],
    ["I", 1],
];

/**
 * 阿拉伯数字转罗马数字 (arabicToRoman)
 * 支持 1 ~ 3999
 */
export function arabicToRoman(num: number): string {
    if (!Number.isFinite(num) || num < 1 || num > 3999) return "";
    let n = Math.floor(num);
    let roman = "";
    for (const [sym, val] of ROMAN_MAP) {
        while (n >= val) {
            roman += sym;
            n -= val;
        }
    }
    return roman;
}

const ROMAN_VALS: Record<string, number> = {
    I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000,
};

/**
 * 罗马数字转阿拉伯数字 (romanToArabic)
 * 如 "XIV" -> 14, "MMXXVI" -> 2026
 */
export function romanToArabic(roman: string): number | null {
    if (!roman || typeof roman !== "string") return null;
    const clean = roman.trim().toUpperCase();
    if (!/^[IVXLCDM]+$/.test(clean)) return null;

    let total = 0;
    let prev = 0;

    for (let i = clean.length - 1; i >= 0; i--) {
        const cur = ROMAN_VALS[clean[i]!] || 0;
        if (cur < prev) {
            total -= cur;
        } else {
            total += cur;
            prev = cur;
        }
    }

    return total > 0 ? total : null;
}

export interface PadLinesOptions {
    /** 目标总对齐宽度；若未提供且 autoMaxWidth 为 true，则自动计算最长行宽度 */
    width?: number;
    /** 对齐方式：left (左对齐右填充), right (右对齐左填充), center (居中填充) */
    align?: "left" | "center" | "right";
    /** 填充字符（默认半角空格 " "） */
    padChar?: string;
    /** 是否自动依据最长行对齐 (默认 true) */
    autoMaxWidth?: boolean;
}

/**
 * 多行文本等宽与居中/左右对齐填充 (padLines)
 */
export function padLines(text: string, options: PadLinesOptions = {}): string {
    if (!text || typeof text !== "string") return text ?? "";
    const align = options.align || "left";
    const padChar = options.padChar ? options.padChar.charAt(0) : " ";

    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    let targetWidth = options.width;

    if (!targetWidth && options.autoMaxWidth !== false) {
        let maxW = 0;
        for (const l of lines) {
            const w = getDisplayWidth(l);
            if (w > maxW) maxW = w;
        }
        targetWidth = maxW;
    }

    if (!targetWidth || targetWidth <= 0) return text;

    const padded = lines.map((line) => {
        const curW = getDisplayWidth(line);
        const diff = Math.max(0, targetWidth! - curW);
        if (diff === 0) return line;

        if (align === "right") {
            return padChar.repeat(diff) + line;
        } else if (align === "center") {
            const left = Math.floor(diff / 2);
            const right = diff - left;
            return padChar.repeat(left) + line + padChar.repeat(right);
        } else {
            return line + padChar.repeat(diff);
        }
    });

    return padded.join("\n");
}

/**
 * Cron 表达式自然语言解析与解释 (explainCronExpression)
 * 支持 5 段（分 时 日 月 周）与 6~7 段（秒 分 时 日 月 周 [年]）
 */
export function explainCronExpression(cron: string): string {
    if (!cron || typeof cron !== "string") return "";
    const clean = cron.trim().replace(/\s+/g, " ");
    const parts = clean.split(" ");

    if (parts.length < 5 || parts.length > 7) {
        return clean;
    }

    // 规整为标准 5 段 (分 时 日 月 周)
    let min = parts[0]!;
    let hour = parts[1]!;
    let day = parts[2]!;
    let month = parts[3]!;
    let week = parts[4]!;

    if (parts.length >= 6) {
        // 含秒: 秒 分 时 日 月 周
        min = parts[1]!;
        hour = parts[2]!;
        day = parts[3]!;
        month = parts[4]!;
        week = parts[5]!;
    }

    // 常见高频预设匹配
    if (min === "*" && hour === "*" && day === "*" && month === "*" && week === "*") {
        return "每分钟执行一次";
    }
    if (min.startsWith("*/") && hour === "*" && day === "*" && month === "*" && week === "*") {
        const step = min.slice(2);
        return `每 ${step} 分钟执行一次`;
    }
    if (min === "0" && hour === "*" && day === "*" && month === "*" && week === "*") {
        return "每小时整点执行一次";
    }
    if (min === "0" && hour === "0" && day === "*" && month === "*" && week === "*") {
        return "每天 00:00 执行一次";
    }
    if (/^\d{1,2}$/.test(min) && /^\d{1,2}$/.test(hour) && day === "*" && month === "*") {
        const timeStr = `${hour.padStart(2, "0")}:${min.padStart(2, "0")}`;
        if (week === "*") {
            return `每天 ${timeStr} 执行一次`;
        }
        if (week === "1-5") {
            return `工作日 (周一至周五) ${timeStr} 执行一次`;
        }
        if (week === "0,6" || week === "6,0" || week === "7,6" || week === "6,7") {
            return `周末 (周六和周日) ${timeStr} 执行一次`;
        }
    }

    // 默认结构化分解描述
    return `Cron: [分: ${min}, 时: ${hour}, 日: ${day}, 月: ${month}, 周: ${week}]`;
}

// 常用高频简繁对应字表（字对形式）
const S2T_PAIRS = "万萬与與丑醜专專业業个個么麼为為义義乐樂云雲产產众衆优優体體会會传傳关關写寫准準创創办辦华華发發变變问問国國图圖块塊复復备備学學实實导導师師广廣应應开開录錄总總标標检檢欢歡权權归歸视視计計语語链鏈门門随隨码碼点點";

const S2T_MAP = new Map<string, string>();
const T2S_MAP = new Map<string, string>();

for (let i = 0; i < S2T_PAIRS.length; i += 2) {
    const s = S2T_PAIRS[i]!;
    const t = S2T_PAIRS[i + 1]!;
    S2T_MAP.set(s, t);
    T2S_MAP.set(t, s);
}

export interface ChineseVariantResult {
    result: string;
    convertedCount: number;
}

/**
 * 常用汉字简繁体双向转换 (convertChineseVariant)
 */
export function convertChineseVariant(text: string, mode: "s2t" | "t2s" = "s2t"): ChineseVariantResult {
    if (!text || typeof text !== "string") {
        return {result: text ?? "", convertedCount: 0};
    }

    const map = mode === "s2t" ? S2T_MAP : T2S_MAP;
    let convertedCount = 0;

    const chars = Array.from(text).map((ch) => {
        const mapped = map.get(ch);
        if (mapped) {
            convertedCount++;
            return mapped;
        }
        return ch;
    });

    return {
        result: chars.join(""),
        convertedCount,
    };
}

export interface CompactBlankLinesOptions {
    /** 允许保留的最大连续空行数（默认 1） */
    maxConsecutive?: number;
    /** 是否将仅含空格或制表符的伪空行归一化为空串（默认 true） */
    trimEmptyLines?: boolean;
}

export interface CompactBlankLinesResult {
    result: string;
    collapsedCount: number;
}

/**
 * 多行文本连续空行折叠与压缩 (compactBlankLines)
 */
export function compactBlankLines(text: string, options: CompactBlankLinesOptions = {}): CompactBlankLinesResult {
    if (!text || typeof text !== "string") {
        return {result: text ?? "", collapsedCount: 0};
    }

    const maxConsecutive = Math.max(0, options.maxConsecutive ?? 1);
    const trimEmpty = options.trimEmptyLines !== false;

    const rawLines = text.replace(/\r\n?/g, "\n").split("\n");
    const output: string[] = [];
    let consecutiveEmpty = 0;
    let collapsedCount = 0;

    for (const rawLine of rawLines) {
        const isEmpty = trimEmpty ? rawLine.trim().length === 0 : rawLine.length === 0;

        if (isEmpty) {
            consecutiveEmpty++;
            if (consecutiveEmpty <= maxConsecutive) {
                output.push("");
            } else {
                collapsedCount++;
            }
        } else {
            consecutiveEmpty = 0;
            output.push(rawLine);
        }
    }

    return {
        result: output.join("\n"),
        collapsedCount,
    };
}

/**
 * 将时间戳格式化为直观自然的相对时间 (formatRelativeTime)
 * 如 "刚刚", "5分钟前", "2小时前", "昨天", "3天前"
 */
export function formatRelativeTime(timestamp: number | string | Date, baseNow?: Date): string {
    if (!timestamp) return "";
    let timeMs: number;

    if (timestamp instanceof Date) {
        timeMs = timestamp.getTime();
    } else {
        const num = Number(String(timestamp).trim());
        if (!Number.isFinite(num)) {
            const parsed = new Date(timestamp).getTime();
            if (!Number.isFinite(parsed)) return String(timestamp);
            timeMs = parsed;
        } else {
            // 若为 10 位秒级时间戳，转为毫秒
            timeMs = num < 10000000000 ? num * 1000 : num;
        }
    }

    const nowMs = (baseNow || new Date()).getTime();
    const diffSec = Math.floor((nowMs - timeMs) / 1000);

    if (diffSec < 0) {
        // 未来时间
        const absDiff = Math.abs(diffSec);
        if (absDiff < 60) return "片刻后";
        if (absDiff < 3600) return `${Math.floor(absDiff / 60)}分钟后`;
        if (absDiff < 86400) return `${Math.floor(absDiff / 3600)}小时后`;
        return `${Math.floor(absDiff / 86400)}天后`;
    }

    if (diffSec < 45) return "刚刚";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}分钟前`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}小时前`;
    if (diffSec < 172800) return "昨天";
    if (diffSec < 2592000) return `${Math.floor(diffSec / 86400)}天前`;
    if (diffSec < 31536000) return `${Math.floor(diffSec / 2592000)}个月前`;
    return `${Math.floor(diffSec / 31536000)}年前`;
}

export interface WordFreqItem {
    word: string;
    count: number;
    frequency: number;
}

export interface WordFreqResult {
    items: WordFreqItem[];
    totalWords: number;
    uniqueWords: number;
    result: string;
}

const COMMON_STOP_WORDS = new Set([
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", "this", "but", "his", "by", "from",
]);

/**
 * 常用语文本单词词频统计与分析 (countWordFrequency)
 */
export function countWordFrequency(
    text: string,
    options: {topN?: number; minLength?: number; ignoreStopWords?: boolean} = {},
): WordFreqResult {
    if (!text || typeof text !== "string") {
        return {items: [], totalWords: 0, uniqueWords: 0, result: ""};
    }

    const topN = Math.max(1, options.topN ?? 10);
    const minLen = Math.max(1, options.minLength ?? 2);
    const ignoreStop = options.ignoreStopWords === true;

    // 匹配英文单词与连续汉字词
    const matches = text.match(/[a-zA-Z0-9_-]+|[\u4e00-\u9fa5]{2,4}/g) || [];
    const counts = new Map<string, number>();
    let validWordCount = 0;

    for (const raw of matches) {
        const clean = raw.trim().toLowerCase();
        if (clean.length < minLen) continue;
        if (ignoreStop && COMMON_STOP_WORDS.has(clean)) continue;

        counts.set(clean, (counts.get(clean) || 0) + 1);
        validWordCount++;
    }

    const sorted = Array.from(counts.entries())
        .map(([word, count]) => ({
            word,
            count,
            frequency: validWordCount > 0 ? parseFloat(((count / validWordCount) * 100).toFixed(1)) : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, topN);

    const formattedLines = sorted.map(
        (item, idx) => `${idx + 1}. ${item.word}: ${item.count}次 (${item.frequency}%)`,
    );

    return {
        items: sorted,
        totalWords: validWordCount,
        uniqueWords: counts.size,
        result: formattedLines.join("\n"),
    };
}

const BRACKET_PAIRS: Record<string, [string, string]> = {
    "(": ["(", ")"],
    ")": ["(", ")"],
    "()": ["(", ")"],
    "[": ["[", "]"],
    "]": ["[", "]"],
    "[]": ["[", "]"],
    "{": ["{", "}"],
    "}": ["{", "}"],
    "{}": ["{", "}"],
    "<": ["<", ">"],
    ">": ["<", ">"],
    "<>": ["<", ">"],
    "《": ["《", "》"],
    "》": ["《", "》"],
    "《》": ["《", "》"],
    "【": ["【", "】"],
    "】": ["【", "】"],
    "【】": ["【", "】"],
    "“": ["“", "”"],
    "”": ["“", "”"],
    "“”": ["“", "”"],
};

export interface SurroundEachLineOptions {
    /** 是否忽略空行（默认 true） */
    ignoreEmpty?: boolean;
    /** 是否预修剪行首尾空白（默认 false） */
    trimLines?: boolean;
}

/**
 * 为多行文本的每一行进行双边对称包裹 (surroundEachLine)
 */
export function surroundEachLine(
    text: string,
    wrapper: [string, string] | string = '"',
    options: SurroundEachLineOptions = {},
): string {
    if (!text || typeof text !== "string") return text ?? "";
    const ignoreEmpty = options.ignoreEmpty !== false;
    const trimLines = options.trimLines === true;

    let left = "";
    let right = "";

    if (Array.isArray(wrapper)) {
        left = wrapper[0] ?? "";
        right = wrapper[1] ?? "";
    } else if (typeof wrapper === "string") {
        if (BRACKET_PAIRS[wrapper]) {
            [left, right] = BRACKET_PAIRS[wrapper]!;
        } else {
            left = wrapper;
            right = wrapper;
        }
    }

    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    const processed = lines.map((rawLine) => {
        const line = trimLines ? rawLine.trim() : rawLine;
        if (ignoreEmpty && line.length === 0) return line;
        return `${left}${line}${right}`;
    });

    return processed.join("\n");
}

/**
 * 自然语言文本精要摘要提炼与首段提取 (extractExecutiveSummary)
 */
export function extractExecutiveSummary(text: string, maxLength = 120): string {
    if (!text || typeof text !== "string") return "";
    const lines = text.replace(/\r\n?/g, "\n").split("\n");

    // 寻找第一个有效段落（非大标题、非水平线、非空行）
    let firstParagraph = "";
    for (const l of lines) {
        const trimmed = l.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith("#") || /^[-*_]{3,}$/.test(trimmed)) continue;
        firstParagraph = trimmed;
        break;
    }

    if (!firstParagraph) {
        firstParagraph = text.replace(/\r\n?/g, " ").trim();
    }

    const clean = stripMarkdownFormatting(firstParagraph);
    return truncateText(clean, maxLength);
}

/**
 * 代码与文本前置缩进转换器 (convertIndentation)
 * 支持 spaces-to-tabs 与 tabs-to-spaces
 */
export function convertIndentation(
    text: string,
    mode: "spaces-to-tabs" | "tabs-to-spaces" = "spaces-to-tabs",
    indentSize = 4,
): string {
    if (!text || typeof text !== "string") return text ?? "";
    const size = Math.max(1, indentSize);
    const lines = text.replace(/\r\n?/g, "\n").split("\n");

    const converted = lines.map((line) => {
        if (!line.trim()) return line;
        const indentMatch = line.match(/^[ \t]+/);
        if (!indentMatch) return line;

        const indentStr = indentMatch[0];
        const content = line.slice(indentStr.length);

        if (mode === "spaces-to-tabs") {
            // 每 size 个空格替换为 1 个制表符
            const spaceRegex = new RegExp(" ".repeat(size), "g");
            const newIndent = indentStr.replace(spaceRegex, "\t");
            return `${newIndent}${content}`;
        } else {
            // 每个制表符替换为 size 个空格
            const newIndent = indentStr.replace(/\t/g, " ".repeat(size));
            return `${newIndent}${content}`;
        }
    });

    return converted.join("\n");
}

export interface NumericLinesSummary {
    sum: number;
    average: number;
    count: number;
    min: number;
    max: number;
    result: string;
}

/**
 * 多行文本数值提取与汇总求和统计 (sumNumericLines)
 */
export function sumNumericLines(text: string, options: {extractNumbers?: boolean} = {}): NumericLinesSummary {
    if (!text || typeof text !== "string") {
        return {sum: 0, average: 0, count: 0, min: 0, max: 0, result: ""};
    }

    const extractNumbers = options.extractNumbers !== false;
    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    const numbers: number[] = [];

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        if (extractNumbers) {
            // 提取行内出现的数值（取行中最后一个有效数值，如 "住宿费: 320.5" -> 320.5）
            const matches = line.match(/[-+]?\d+(?:\.\d+)?/g);
            if (matches && matches.length > 0) {
                const lastNum = parseFloat(matches[matches.length - 1]!);
                if (Number.isFinite(lastNum)) numbers.push(lastNum);
            }
        } else {
            const num = parseFloat(line);
            if (Number.isFinite(num)) numbers.push(num);
        }
    }

    if (numbers.length === 0) {
        return {sum: 0, average: 0, count: 0, min: 0, max: 0, result: "未检测到有效数值"};
    }

    let sum = 0;
    let min = numbers[0]!;
    let max = numbers[0]!;

    for (const n of numbers) {
        sum += n;
        if (n < min) min = n;
        if (n > max) max = n;
    }

    const count = numbers.length;
    const average = parseFloat((sum / count).toFixed(2));
    const roundSum = parseFloat(sum.toFixed(2));

    const result = `合计: ${roundSum} | 平均: ${average} | 笔数: ${count} | 极值: [${min}, ${max}]`;

    return {
        sum: roundSum,
        average,
        count,
        min,
        max,
        result,
    };
}

const HEAVENLY_STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const EARTHLY_BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const ZODIAC_ANIMALS = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"];

export interface StemBranchZodiacResult {
    stemBranch: string;
    zodiac: string;
    full: string;
}

/**
 * 公历年份转中国农历天干地支与生肖 (getChineseZodiacAndStemBranch)
 * 如 2026 -> 丙午年 (马年)
 */
export function getChineseZodiacAndStemBranch(yearOrDate: number | string | Date = new Date()): StemBranchZodiacResult {
    let year: number;
    if (yearOrDate instanceof Date) {
        year = yearOrDate.getFullYear();
    } else {
        const parsed = parseInt(String(yearOrDate).trim(), 10);
        year = Number.isFinite(parsed) ? parsed : new Date().getFullYear();
    }

    const stemIdx = (((year - 4) % 10) + 10) % 10;
    const branchIdx = (((year - 4) % 12) + 12) % 12;

    const stem = HEAVENLY_STEMS[stemIdx] || "";
    const branch = EARTHLY_BRANCHES[branchIdx] || "";
    const zodiac = ZODIAC_ANIMALS[branchIdx] || "";
    const stemBranch = `${stem}${branch}`;
    const full = `${stemBranch}年 (${zodiac}年)`;

    return {
        stemBranch,
        zodiac,
        full,
    };
}

export interface RepeatedPhraseItem {
    phrase: string;
    count: number;
}

/**
 * 常用语文本高频重复词组与短语提取 (extractRepeatedPhrases)
 */
export function extractRepeatedPhrases(
    text: string,
    options: {minCount?: number; minLength?: number; maxLength?: number; topN?: number} = {},
): {items: RepeatedPhraseItem[]; result: string} {
    if (!text || typeof text !== "string") {
        return {items: [], result: ""};
    }

    const minCount = Math.max(2, options.minCount ?? 2);
    const minLen = Math.max(2, options.minLength ?? 2);
    const maxLen = Math.max(minLen, options.maxLength ?? 4);
    const topN = Math.max(1, options.topN ?? 10);

    // 清洗无关控制字符与大部分标点，保留连续汉字与字母数字
    const clean = text.replace(/[\s\r\n\t，。！？、；：""''（）《》【】,.!?;:()\[\]{}]+/g, " ");
    const phraseCounts = new Map<string, number>();

    const tokens = clean.split(" ").filter((s) => s.length >= minLen);

    for (const token of tokens) {
        const len = token.length;
        for (let size = minLen; size <= Math.min(maxLen, len); size++) {
            for (let i = 0; i <= len - size; i++) {
                const sub = token.slice(i, i + size);
                phraseCounts.set(sub, (phraseCounts.get(sub) || 0) + 1);
            }
        }
    }

    const sorted = Array.from(phraseCounts.entries())
        .filter(([_, count]) => count >= minCount)
        .map(([phrase, count]) => ({phrase, count}))
        .sort((a, b) => b.count - a.count || b.phrase.length - a.phrase.length)
        .slice(0, topN);

    const formattedLines = sorted.map((it, idx) => `${idx + 1}. 「${it.phrase}」: 重复 ${it.count} 次`);

    return {
        items: sorted,
        result: formattedLines.join("\n"),
    };
}

export interface ExtractColumnOptions {
    /** 分隔符，支持字符串或正则（默认自动切分制表符、逗号、竖线或空格） */
    delimiter?: string | RegExp;
    /** 是否忽略空行（默认 true） */
    ignoreEmpty?: boolean;
    /** 是否对单元格内容进行首尾去空白（默认 true） */
    trimCell?: boolean;
}

/**
 * 从多行文本中提取指定列（从 1 开始计）(extractColumnFromLines)
 */
export function extractColumnFromLines(
    text: string,
    columnIndex = 1,
    options: ExtractColumnOptions = {},
): string {
    if (!text || typeof text !== "string") return "";
    const colIdx = Math.max(1, columnIndex) - 1;
    const delim = options.delimiter !== undefined ? options.delimiter : /[\t,|，；; ]+/;
    const ignoreEmpty = options.ignoreEmpty !== false;
    const trimCell = options.trimCell !== false;

    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    const extracted: string[] = [];

    for (const rawLine of lines) {
        if (ignoreEmpty && rawLine.trim().length === 0) continue;
        const parts = rawLine.split(delim);
        let val = parts[colIdx] ?? "";
        if (trimCell) val = val.trim();
        extracted.push(val);
    }

    return extracted.join("\n");
}

/**
 * 根据选项后权重标记进行加权概率随机抽取 (pickWeightedOption)
 * 支持格式: "选项A:80, 选项B:20" 或 "VIP:70、普通:30"
 */
export function pickWeightedOption(rawOptions: string): string | null {
    if (!rawOptions || typeof rawOptions !== "string") return null;

    const items = rawOptions.split(/[,，、]/).map((s) => s.trim()).filter(Boolean);
    if (items.length === 0) return null;

    const candidates: Array<{option: string; weight: number}> = [];
    let totalWeight = 0;

    for (const item of items) {
        const lastColon = item.lastIndexOf(":");
        let opt = item;
        let weight = 1;

        if (lastColon !== -1) {
            const rawWeight = item.slice(lastColon + 1).trim();
            const parsedWeight = parseFloat(rawWeight);
            if (Number.isFinite(parsedWeight) && parsedWeight > 0) {
                weight = parsedWeight;
                opt = item.slice(0, lastColon).trim();
            }
        }

        candidates.push({option: opt, weight});
        totalWeight += weight;
    }

    if (totalWeight <= 0) return candidates[0]?.option ?? null;

    let rand = Math.random() * totalWeight;
    for (const cand of candidates) {
        if (rand < cand.weight) {
            return cand.option;
        }
        rand -= cand.weight;
    }

    return candidates[candidates.length - 1]?.option ?? null;
}

const IRREGULAR_NOUNS: Record<string, string> = {
    child: "children",
    person: "people",
    man: "men",
    woman: "women",
    tooth: "teeth",
    foot: "feet",
    mouse: "mice",
    datum: "data",
    criterion: "criteria",
    ox: "oxen",
};

const REVERSE_IRREGULAR: Record<string, string> = {};
for (const [s, p] of Object.entries(IRREGULAR_NOUNS)) {
    REVERSE_IRREGULAR[p] = s;
}

/**
 * 英文单词单数与复数规则互转 (pluralizeText)
 */
export function pluralizeText(word: string, mode: "plural" | "singular" = "plural"): string {
    if (!word || typeof word !== "string") return word ?? "";
    const trimmed = word.trim();
    if (!/^[a-zA-Z]+$/.test(trimmed)) return word;

    const isUpperFirst = /^[A-Z]/.test(trimmed);
    const lower = trimmed.toLowerCase();

    let result = lower;

    if (mode === "plural") {
        if (IRREGULAR_NOUNS[lower]) {
            result = IRREGULAR_NOUNS[lower]!;
        } else if (/(s|x|z|ch|sh)$/i.test(lower)) {
            result = `${lower}es`;
        } else if (/[^aeiou]y$/i.test(lower)) {
            result = `${lower.slice(0, -1)}ies`;
        } else if (/(fe|f)$/i.test(lower) && !/(roof|belief|chef|cliff)$/i.test(lower)) {
            result = lower.endsWith("fe") ? `${lower.slice(0, -2)}ves` : `${lower.slice(0, -1)}ves`;
        } else {
            result = `${lower}s`;
        }
    } else {
        // singular
        if (REVERSE_IRREGULAR[lower]) {
            result = REVERSE_IRREGULAR[lower]!;
        } else if (lower.endsWith("ies") && lower.length > 3) {
            result = `${lower.slice(0, -3)}y`;
        } else if (lower.endsWith("ves") && lower.length > 3) {
            const stem = lower.slice(0, -3);
            if (["li", "kni", "wi"].includes(stem)) {
                result = `${stem}fe`;
            } else {
                result = `${stem}f`;
            }
        } else if (lower.endsWith("es") && /(s|x|z|ch|sh)es$/i.test(lower)) {
            result = lower.slice(0, -2);
        } else if (lower.endsWith("s") && !lower.endsWith("ss") && lower.length > 1) {
            result = lower.slice(0, -1);
        }
    }

    if (isUpperFirst) {
        result = result.charAt(0).toUpperCase() + result.slice(1);
    }
    return result;
}

/**
 * 多行多列表格行列转置 (transposeMatrixText)
 * 将横向行转为纵向列，纵向转为横向
 */
export function transposeMatrixText(
    text: string,
    delimiter?: string | RegExp,
    joinDelimiter = "\t",
): string {
    if (!text || typeof text !== "string") return "";
    const delim = delimiter !== undefined ? delimiter : /[\t,，|；;]+/;

    const lines = text.replace(/\r\n?/g, "\n").split("\n").filter((l) => l.trim().length > 0);
    if (lines.length === 0) return "";

    const matrix = lines.map((l) => l.split(delim).map((c) => c.trim()));
    const maxCols = Math.max(...matrix.map((r) => r.length));
    if (maxCols === 0) return "";

    const transposed: string[][] = [];
    for (let c = 0; c < maxCols; c++) {
        const row: string[] = [];
        for (let r = 0; r < matrix.length; r++) {
            row.push(matrix[r]![c] ?? "");
        }
        transposed.push(row);
    }

    return transposed.map((r) => r.join(joinDelimiter)).join("\n");
}

const ONES = [
    "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];

const TENS = [
    "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety",
];

function helperThreeDigits(num: number): string {
    let res = "";
    const hundred = Math.floor(num / 100);
    const rest = num % 100;

    if (hundred > 0) {
        res += `${ONES[hundred]} hundred`;
        if (rest > 0) res += " ";
    }

    if (rest > 0) {
        if (rest < 20) {
            res += ONES[rest];
        } else {
            const ten = Math.floor(rest / 10);
            const one = rest % 10;
            res += TENS[ten];
            if (one > 0) res += `-${ONES[one]}`;
        }
    }

    return res;
}

/**
 * 将整数或数字字符串转换为英文单词拼写 (numberToEnglishWords)
 * 如 42 -> "forty-two", 1024 -> "one thousand twenty-four"
 */
export function numberToEnglishWords(numOrStr: number | string): string {
    if (numOrStr === undefined || numOrStr === null || numOrStr === "") return "";
    const parsed = typeof numOrStr === "number" ? Math.floor(numOrStr) : parseInt(String(numOrStr).trim(), 10);
    if (!Number.isFinite(parsed)) return String(numOrStr);

    if (parsed === 0) return "zero";

    let n = Math.abs(parsed);
    const isNegative = parsed < 0;

    const scales = ["", "thousand", "million", "billion"];
    const chunks: string[] = [];
    let scaleIdx = 0;

    while (n > 0) {
        const chunk = n % 1000;
        if (chunk > 0) {
            const chunkStr = helperThreeDigits(chunk);
            const scaleStr = scales[scaleIdx] ? ` ${scales[scaleIdx]}` : "";
            chunks.unshift(`${chunkStr}${scaleStr}`);
        }
        n = Math.floor(n / 1000);
        scaleIdx++;
    }

    const words = chunks.join(" ");
    return isNegative ? `negative ${words}` : words;
}

export interface ExpandContractionsResult {
    result: string;
    expandedCount: number;
}

const CONTRACTIONS_MAP: Array<[RegExp, string]> = [
    [/\b([Cc])an['’]t\b/g, "$1annot"],
    [/\b([Ww])on['’]t\b/g, "$1ill not"],
    [/\b([Ss])han['’]t\b/g, "$1hall not"],
    [/\b([Aa])in['’]t\b/g, "$1m not"],
    [/\b([Ii])['’]m\b/g, "$1 am"],
    [/\b([Yy])ou['’]re\b/g, "$1ou are"],
    [/\b([Ww])e['’]re\b/g, "$1e are"],
    [/\b([Tt])hey['’]re\b/g, "$1hey are"],
    [/\b([Ii])['’]ve\b/g, "$1 have"],
    [/\b([Yy])ou['’]ve\b/g, "$1ou have"],
    [/\b([Ww])e['’]ve\b/g, "$1e have"],
    [/\b([Tt])hey['’]ve\b/g, "$1hey have"],
    [/\b([Ii])['’]ll\b/g, "$1 will"],
    [/\b([Yy])ou['’]ll\b/g, "$1ou will"],
    [/\b([Hh])e['’]ll\b/g, "$1e will"],
    [/\b([Ss])he['’]ll\b/g, "$1he will"],
    [/\b([Ww])e['’]ll\b/g, "$1e will"],
    [/\b([Tt])hey['’]ll\b/g, "$1hey will"],
    [/\b([Ii])['’]d\b/g, "$1 would"],
    [/\b([Yy])ou['’]d\b/g, "$1ou would"],
    [/\b([Hh])e['’]d\b/g, "$1e would"],
    [/\b([Ss])he['’]d\b/g, "$1he would"],
    [/\b([Ww])e['’]d\b/g, "$1e would"],
    [/\b([Tt])hey['’]d\b/g, "$1hey would"],
    [/\b([Ii])sn['’]t\b/g, "$1s not"],
    [/\b([Aa])ren['’]t\b/g, "$1re not"],
    [/\b([Ww])asn['’]t\b/g, "$1as not"],
    [/\b([Ww])eren['’]t\b/g, "$1ere not"],
    [/\b([Hh])asn['’]t\b/g, "$1as not"],
    [/\b([Hh])aven['’]t\b/g, "$1ave not"],
    [/\b([Hh])adn['’]t\b/g, "$1ad not"],
    [/\b([Dd])oesn['’]t\b/g, "$1oes not"],
    [/\b([Dd])on['’]t\b/g, "$1o not"],
    [/\b([Dd])idn['’]t\b/g, "$1id not"],
    [/\b([Ss])houldn['’]t\b/g, "$1hould not"],
    [/\b([Ww])ouldn['’]t\b/g, "$1ould not"],
    [/\b([Cc])ouldn['’]t\b/g, "$1ould not"],
    [/\b([Ii])t['’]s\b/g, "$1t is"],
    [/\b([Tt])hat['’]s\b/g, "$1hat is"],
    [/\b([Ww])hat['’]s\b/g, "$1hat is"],
    [/\b([Tt])here['’]s\b/g, "$1here is"],
    [/\b([Ll])et['’]s\b/g, "$1et us"],
];

/**
 * 展开英文日常缩写为正式公文单词形态 (expandEnglishContractions)
 * 如 don't -> do not, can't -> cannot, I'm -> I am
 */
export function expandEnglishContractions(text: string): ExpandContractionsResult {
    if (!text || typeof text !== "string") {
        return {result: text ?? "", expandedCount: 0};
    }

    let res = text;
    let expandedCount = 0;

    for (const [pattern, replacement] of CONTRACTIONS_MAP) {
        const matches = res.match(pattern);
        if (matches && matches.length > 0) {
            expandedCount += matches.length;
            res = res.replace(pattern, replacement);
        }
    }

    return {
        result: res,
        expandedCount,
    };
}

export interface DiffLinesResult {
    diffResult: string;
    addedCount: number;
    removedCount: number;
    unchangedCount: number;
}

/**
 * 多行文本行级差异对比引擎 (diffLinesQuick)
 * 基于 LCS 算法比较 A 与 B 的行级增删变动
 */
export function diffLinesQuick(textA: string, textB: string): DiffLinesResult {
    const linesA = (textA ?? "").replace(/\r\n?/g, "\n").split("\n");
    const linesB = (textB ?? "").replace(/\r\n?/g, "\n").split("\n");

    const m = linesA.length;
    const n = linesB.length;

    // 构建 LCS 动态规划表 (限制最大 500 行防性能卡死)
    const limitM = Math.min(m, 500);
    const limitN = Math.min(n, 500);

    const dp: number[][] = Array.from({length: limitM + 1}, () => new Array(limitN + 1).fill(0));

    for (let i = 1; i <= limitM; i++) {
        for (let j = 1; j <= limitN; j++) {
            if (linesA[i - 1] === linesB[j - 1]) {
                dp[i]![j] = dp[i - 1]![j - 1]! + 1;
            } else {
                dp[i]![j] = Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
            }
        }
    }

    // 回溯生成差异清单
    let i = limitM;
    let j = limitN;
    const diffEntries: string[] = [];
    let addedCount = 0;
    let removedCount = 0;
    let unchangedCount = 0;

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
            diffEntries.unshift(`  ${linesA[i - 1]}`);
            unchangedCount++;
            i--;
            j--;
        } else if (j > 0 && (i === 0 || dp[i]![j - 1]! >= dp[i - 1]![j]!)) {
            diffEntries.unshift(`+ ${linesB[j - 1]}`);
            addedCount++;
            j--;
        } else if (i > 0 && (j === 0 || dp[i]![j - 1]! < dp[i - 1]![j]!)) {
            diffEntries.unshift(`- ${linesA[i - 1]}`);
            removedCount++;
            i--;
        }
    }

    return {
        diffResult: diffEntries.join("\n"),
        addedCount,
        removedCount,
        unchangedCount,
    };
}

/**
 * 颜色格式互转引擎 (convertColorFormat)
 * 支持 HEX (#1E88E5 / #fff) ⇋ RGB (rgb(30, 136, 229)) ⇋ HSL
 */
export function convertColorFormat(color: string, targetFormat: "hex" | "rgb" | "hsl" = "rgb"): string {
    if (!color || typeof color !== "string") return color ?? "";
    const clean = color.trim().toLowerCase();

    let r = 0;
    let g = 0;
    let b = 0;
    let parsed = false;

    // 1. 尝试解析 HEX
    const hexMatch = clean.match(/^#?([a-f0-9]{3}|[a-f0-9]{6})$/);
    if (hexMatch) {
        let hex = hexMatch[1]!;
        if (hex.length === 3) {
            hex = hex.split("").map((c) => c + c).join("");
        }
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
        parsed = true;
    }

    // 2. 尝试解析 RGB
    if (!parsed) {
        const rgbMatch = clean.match(/^rgba?\((\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/);
        if (rgbMatch) {
            r = Math.min(255, parseInt(rgbMatch[1]!, 10));
            g = Math.min(255, parseInt(rgbMatch[2]!, 10));
            b = Math.min(255, parseInt(rgbMatch[3]!, 10));
            parsed = true;
        }
    }

    if (!parsed) return color;

    if (targetFormat === "rgb") {
        return `rgb(${r}, ${g}, ${b})`;
    }

    if (targetFormat === "hex") {
        const hexR = r.toString(16).padStart(2, "0");
        const hexG = g.toString(16).padStart(2, "0");
        const hexB = b.toString(16).padStart(2, "0");
        return `#${hexR}${hexG}${hexB}`.toUpperCase();
    }

    if (targetFormat === "hsl") {
        const rf = r / 255;
        const gf = g / 255;
        const bf = b / 255;
        const max = Math.max(rf, gf, bf);
        const min = Math.min(rf, gf, bf);
        let h = 0;
        let s = 0;
        const l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case rf: h = (gf - bf) / d + (gf < bf ? 6 : 0); break;
                case gf: h = (bf - rf) / d + 2; break;
                case bf: h = (rf - gf) / d + 4; break;
            }
            h /= 6;
        }

        return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
    }

    return color;
}

export interface HumanizeOptions {
    /** 是否每词首字母大写（默认 true） */
    capitalize?: boolean;
    /** 分隔符（默认空格 " "） */
    separator?: string;
}

/**
 * 变量标识符转人类可读自然短语 (humanizeIdentifier)
 * 如 "getUserProfileById" -> "Get User Profile By Id"
 */
export function humanizeIdentifier(text: string, options: HumanizeOptions = {}): string {
    if (!text || typeof text !== "string") return text ?? "";
    const capitalize = options.capitalize !== false;
    const sep = options.separator !== undefined ? options.separator : " ";

    // 将连字符、下划线转为空格，并分离驼峰边界
    const uncamel = text
        .replace(/[-_]+/g, " ")
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");

    const words = uncamel.split(/\s+/).filter(Boolean);
    if (words.length === 0) return text;

    const formatted = words.map((w) => {
        const lower = w.toLowerCase();
        return capitalize ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower;
    });

    return formatted.join(sep);
}

export interface ZipLinesOptions {
    /** 拼接两行之间的分隔符（默认 ": "） */
    separator?: string;
    /** 合并模式：inline (A1: B1 同行拼接), alternate (A1, B1 交叉换行拼接) */
    mode?: "inline" | "alternate";
}

/**
 * 多行文本两两配对与交替合并引擎 (zipLines)
 */
export function zipLines(textA: string, textB: string, options: ZipLinesOptions = {}): string {
    const linesA = (textA ?? "").replace(/\r\n?/g, "\n").split("\n");
    const linesB = (textB ?? "").replace(/\r\n?/g, "\n").split("\n");

    const sep = options.separator !== undefined ? options.separator : ": ";
    const mode = options.mode || "inline";
    const maxLen = Math.max(linesA.length, linesB.length);

    if (maxLen === 0) return "";

    const result: string[] = [];

    if (mode === "alternate") {
        for (let i = 0; i < maxLen; i++) {
            if (i < linesA.length) result.push(linesA[i]!);
            if (i < linesB.length) result.push(linesB[i]!);
        }
    } else {
        // inline
        for (let i = 0; i < maxLen; i++) {
            const a = linesA[i] ?? "";
            const b = linesB[i] ?? "";
            result.push(`${a}${sep}${b}`);
        }
    }

    return result.join("\n");
}

export interface StatsResult {
    sum: number;
    average: number;
    median: number;
    variance: number;
    stdDev: number;
    count: number;
    result: string;
}

/**
 * 统计指标（求和、平均、中位数、方差、标准差）分析计算 (calculateStats)
 */
export function calculateStats(input: number[] | string): StatsResult {
    const numbers: number[] = [];

    if (Array.isArray(input)) {
        for (const item of input) {
            if (Number.isFinite(item)) numbers.push(item);
        }
    } else if (typeof input === "string") {
        const matches = input.match(/[-+]?\d+(?:\.\d+)?/g);
        if (matches) {
            for (const m of matches) {
                const n = parseFloat(m);
                if (Number.isFinite(n)) numbers.push(n);
            }
        }
    }

    if (numbers.length === 0) {
        return {
            sum: 0,
            average: 0,
            median: 0,
            variance: 0,
            stdDev: 0,
            count: 0,
            result: "无有效数值",
        };
    }

    const count = numbers.length;
    let sum = 0;
    for (const n of numbers) sum += n;
    const average = parseFloat((sum / count).toFixed(2));

    // 计算中位数
    const sorted = numbers.slice().sort((a, b) => a - b);
    let median = 0;
    const mid = Math.floor(count / 2);
    if (count % 2 === 0) {
        median = parseFloat(((sorted[mid - 1]! + sorted[mid]!) / 2).toFixed(2));
    } else {
        median = sorted[mid]!;
    }

    // 计算方差与标准差
    let varianceSum = 0;
    for (const n of numbers) {
        varianceSum += Math.pow(n - average, 2);
    }
    const variance = parseFloat((varianceSum / count).toFixed(2));
    const stdDev = parseFloat(Math.sqrt(variance).toFixed(2));
    const roundSum = parseFloat(sum.toFixed(2));

    const result = `合计: ${roundSum} | 均值: ${average} | 中位数: ${median} | 标准差: ${stdDev} | 笔数: ${count}`;

    return {
        sum: roundSum,
        average,
        median,
        variance,
        stdDev,
        count,
        result,
    };
}

export interface SlugifyOptions {
    /** 是否强制小写（默认 true） */
    lowercase?: boolean;
    /** 单词间连接符（默认 "-"） */
    separator?: string;
}

/**
 * 文本标题转 URL/Git 连字符别名 Slug (slugifyText)
 * 如 "10 Tips for Better Code!" -> "10-tips-for-better-code"
 */
export function slugifyText(text: string, options: SlugifyOptions = {}): string {
    if (!text || typeof text !== "string") return "";
    const lower = options.lowercase !== false;
    const sep = options.separator !== undefined ? options.separator : "-";

    let clean = text
        .trim()
        .replace(/[^\w\u4e00-\u9fa5\s-]+/g, "") // 移除特殊标点，保留字母数字、汉字与空格
        .replace(/[\s_-]+/g, sep);              // 连续空白下划线换为分隔符

    if (clean.startsWith(sep)) clean = clean.slice(sep.length);
    if (clean.endsWith(sep)) clean = clean.slice(0, -sep.length);

    return lower ? clean.toLowerCase() : clean;
}

export type SetOperation = "union" | "intersection" | "difference";

export interface SetOperationsOptions {
    /** 是否区分大小写（默认 true） */
    caseSensitive?: boolean;
    /** 是否预清理行首尾空白（默认 true） */
    trimLines?: boolean;
    /** 是否忽略空行（默认 true） */
    ignoreEmpty?: boolean;
}

/**
 * 多行文本集合运算引擎 (setOperationsOnLines)
 * 支持 union (并集 A∪B), intersection (交集 A∩B), difference (差集 A-B)
 */
export function setOperationsOnLines(
    textA: string,
    textB: string,
    operation: SetOperation = "difference",
    options: SetOperationsOptions = {},
): string {
    const caseSensitive = options.caseSensitive !== false;
    const trimLines = options.trimLines !== false;
    const ignoreEmpty = options.ignoreEmpty !== false;

    const processLines = (txt: string): string[] => {
        return (txt ?? "").replace(/\r\n?/g, "\n").split("\n")
            .map((l) => (trimLines ? l.trim() : l))
            .filter((l) => (ignoreEmpty ? l.length > 0 : true));
    };

    const linesA = processLines(textA);
    const linesB = processLines(textB);

    const makeKey = (s: string) => (caseSensitive ? s : s.toLowerCase());

    const setB = new Set(linesB.map(makeKey));
    const result: string[] = [];

    if (operation === "difference") {
        // A - B: 在 A 中但不在 B 中
        for (const line of linesA) {
            if (!setB.has(makeKey(line))) {
                result.push(line);
            }
        }
    } else if (operation === "intersection") {
        // A ∩ B: 既在 A 中又在 B 中（按 A 去重保序）
        const seen = new Set<string>();
        for (const line of linesA) {
            const k = makeKey(line);
            if (setB.has(k) && !seen.has(k)) {
                seen.add(k);
                result.push(line);
            }
        }
    } else {
        // union (A ∪ B): 并集去重保序
        const seen = new Set<string>();
        for (const line of linesA) {
            const k = makeKey(line);
            if (!seen.has(k)) {
                seen.add(k);
                result.push(line);
            }
        }
        for (const line of linesB) {
            const k = makeKey(line);
            if (!seen.has(k)) {
                seen.add(k);
                result.push(line);
            }
        }
    }

    return result.join("\n");
}

export interface RadixConvertOptions {
    /** 是否包含前缀（如 0x, 0b, 0o，默认 false） */
    prefix?: boolean;
    /** 补零位数对齐（默认不对齐） */
    padBits?: number;
    /** 字母是否大写（默认 false） */
    uppercase?: boolean;
}

/**
 * 跨进制数值互转引擎 (convertRadix)
 * 支持 2 (BIN), 8 (OCT), 10 (DEC), 16 (HEX) 任意进制互转
 */
export function convertRadix(
    numOrStr: number | string,
    fromRadix = 10,
    toRadix = 16,
    options: RadixConvertOptions = {},
): string {
    if (numOrStr === undefined || numOrStr === null || numOrStr === "") return "";
    let clean = String(numOrStr).trim().toLowerCase();

    // 自动剥离常见前缀
    if (clean.startsWith("0x")) clean = clean.slice(2);
    else if (clean.startsWith("0b")) clean = clean.slice(2);
    else if (clean.startsWith("0o")) clean = clean.slice(2);

    const parsed = parseInt(clean, fromRadix);
    if (!Number.isFinite(parsed)) return String(numOrStr);

    let converted = parsed.toString(toRadix);
    if (options.uppercase) converted = converted.toUpperCase();

    if (options.padBits && options.padBits > converted.length) {
        converted = converted.padStart(options.padBits, "0");
    }

    if (options.prefix) {
        if (toRadix === 16) converted = `0x${converted}`;
        else if (toRadix === 2) converted = `0b${converted}`;
        else if (toRadix === 8) converted = `0o${converted}`;
    }

    return converted;
}

export interface StripAffixWordsOptions {
    /** 要剥离的前缀字符串或正则 */
    prefix?: string | RegExp;
    /** 要剥离的后缀字符串或正则 */
    suffix?: string | RegExp;
    /** 是否忽略空行（默认 true） */
    ignoreEmpty?: boolean;
}

/**
 * 代码变量词缀（如 get_, is_, _id, Dto）批量剥离与提取 (stripAffixWords)
 */
export function stripAffixWords(text: string, options: StripAffixWordsOptions = {}): string {
    if (!text || typeof text !== "string") return text ?? "";
    const ignoreEmpty = options.ignoreEmpty !== false;

    let preRegex: RegExp | null = null;
    if (options.prefix instanceof RegExp) {
        preRegex = options.prefix;
    } else if (typeof options.prefix === "string" && options.prefix.length > 0) {
        const esc = options.prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        preRegex = new RegExp(`^${esc}`);
    }

    let sufRegex: RegExp | null = null;
    if (options.suffix instanceof RegExp) {
        sufRegex = options.suffix;
    } else if (typeof options.suffix === "string" && options.suffix.length > 0) {
        const esc = options.suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        sufRegex = new RegExp(`${esc}$`);
    }

    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    const processed = lines.map((line) => {
        if (ignoreEmpty && line.trim().length === 0) return line;
        let cur = line;
        if (preRegex) cur = cur.replace(preRegex, "");
        if (sufRegex) cur = cur.replace(sufRegex, "");
        return cur;
    });

    return processed.join("\n");
}

export interface ParseKvOptions {
    /** 字段间分隔符（默认自动切分换行符、&、或分号） */
    delimiter?: string | RegExp;
    /** 键与值之间的分隔符（默认 = 或 :） */
    pairSeparator?: string | RegExp;
    /** 是否对 key 和 value 执行 trim（默认 true） */
    trim?: boolean;
    /** 是否对 URL query 模式自动执行 decodeURIComponent（默认 true） */
    urlDecode?: boolean;
}

/**
 * 键值对提取与参数解析引擎 (parseKeyValuePairs)
 * 支持 URL 查询串 (name=foo&age=20) 以及 YAML/Properties (name: foo\nage: 20)
 */
export function parseKeyValuePairs(text: string, options: ParseKvOptions = {}): Record<string, string> {
    if (!text || typeof text !== "string") return {};
    const trim = options.trim !== false;
    const urlDecode = options.urlDecode !== false;

    let clean = text.trim();
    if (clean.startsWith("?")) clean = clean.slice(1);

    const delim = options.delimiter !== undefined ? options.delimiter : /[\n\r&;]+/;
    const pairSep = options.pairSeparator !== undefined ? options.pairSeparator : /[=:]/;

    const pairs = clean.split(delim);
    const result: Record<string, string> = {};

    for (const rawPair of pairs) {
        if (!rawPair.trim()) continue;
        let matchIndex = -1;
        if (typeof pairSep === "string") {
            matchIndex = rawPair.indexOf(pairSep);
        } else {
            const m = rawPair.match(pairSep);
            if (m && m.index !== undefined) {
                matchIndex = m.index;
            }
        }

        if (matchIndex === -1) {
            const k = trim ? rawPair.trim() : rawPair;
            if (k) result[k] = "";
            continue;
        }

        let k = rawPair.slice(0, matchIndex);
        let v = rawPair.slice(matchIndex + 1);

        if (trim) {
            k = k.trim();
            v = v.trim();
        }

        if (urlDecode) {
            try {
                k = decodeURIComponent(k.replace(/\+/g, " "));
                v = decodeURIComponent(v.replace(/\+/g, " "));
            } catch {
                // 保留原文防报错
            }
        }

        if (k) {
            result[k] = v;
        }
    }

    return result;
}

/**
 * 从多行或查询串文本中提取指定键的值 (extractKvValue)
 */
export function extractKvValue(text: string, key: string, fallback = "", options: ParseKvOptions = {}): string {
    if (!text || !key) return fallback;
    const kv = parseKeyValuePairs(text, options);
    if (Object.prototype.hasOwnProperty.call(kv, key)) {
        return kv[key] ?? fallback;
    }
    const lowerKey = key.toLowerCase();
    for (const [k, v] of Object.entries(kv)) {
        if (k.toLowerCase() === lowerKey) {
            return v ?? fallback;
        }
    }
    return fallback;
}

export interface SortLinesByColumnOptions {
    /** 列分隔符（默认制表符、逗号、竖线或多个空格） */
    delimiter?: string | RegExp;
    /** 是否按数值大小排序（默认 false，字母/拼音字典序） */
    numeric?: boolean;
    /** 是否降序排序（默认 false，升序） */
    descending?: boolean;
    /** 是否首行是表头（默认 false，为 true 时首行保持在顶部不参与排序） */
    hasHeader?: boolean;
    /** 是否忽略空行（默认 true） */
    ignoreEmpty?: boolean;
}

/**
 * 多行文本基于指定列/字段排序引擎 (sortLinesByColumn)
 * 支持指定列（从 1 开始计）、数值与自然拼音字典序、降序反转及表头保留
 */
export function sortLinesByColumn(
    text: string,
    columnIndex = 1,
    options: SortLinesByColumnOptions = {},
): string {
    if (!text || typeof text !== "string") return text ?? "";
    const colIdx = Math.max(1, columnIndex) - 1;
    const delim = options.delimiter !== undefined ? options.delimiter : /[\t,|，；; ]+/;
    const numeric = options.numeric === true;
    const descending = options.descending === true;
    const hasHeader = options.hasHeader === true;
    const ignoreEmpty = options.ignoreEmpty !== false;

    const allLines = text.replace(/\r\n?/g, "\n").split("\n");
    if (allLines.length <= 1) return text;

    let headerLine = "";
    let linesToSort = allLines;

    if (hasHeader && allLines.length > 0) {
        headerLine = allLines[0]!;
        linesToSort = allLines.slice(1);
    }

    if (ignoreEmpty) {
        linesToSort = linesToSort.filter((l) => l.trim().length > 0);
    }

    const getColVal = (line: string): string => {
        const parts = line.split(delim);
        return (parts[colIdx] ?? "").trim();
    };

    linesToSort.sort((lineA, lineB) => {
        const valA = getColVal(lineA);
        const valB = getColVal(lineB);

        let cmp = 0;
        if (numeric) {
            const numA = parseFloat(valA);
            const numB = parseFloat(valB);
            const validA = Number.isFinite(numA);
            const validB = Number.isFinite(numB);

            if (validA && validB) {
                cmp = numA - numB;
            } else if (validA) {
                cmp = -1;
            } else if (validB) {
                cmp = 1;
            } else {
                cmp = valA.localeCompare(valB, "zh-Hans-CN");
            }
        } else {
            cmp = valA.localeCompare(valB, "zh-Hans-CN");
        }

        return descending ? -cmp : cmp;
    });

    if (hasHeader) {
        return [headerLine, ...linesToSort].join("\n");
    }
    return linesToSort.join("\n");
}

/**
 * 正则多捕获组重组与格式化替换 (formatByRegexGroups)
 * 例如 text="2026-10-28", pattern="(\\d{4})-(\\d{2})-(\\d{2})", template="$1年$2月$3日"
 * 输出 "2026年10月28日"
 */
export function formatByRegexGroups(
    text: string,
    pattern: string | RegExp,
    template: string,
): string {
    if (!text || typeof text !== "string") return text ?? "";
    if (!pattern || !template) return text;

    let regex: RegExp;
    if (pattern instanceof RegExp) {
        regex = pattern;
    } else {
        try {
            regex = new RegExp(pattern, "g");
        } catch {
            return text;
        }
    }

    return text.replace(regex, (...args) => {
        return template.replace(/\$(\d+)/g, (_, numStr) => {
            const idx = parseInt(numStr, 10);
            if (idx === 0) return args[0] as string;
            if (idx > 0 && idx < args.length - 2) {
                const val = args[idx];
                return val !== undefined && val !== null ? String(val) : "";
            }
            return `$${numStr}`;
        });
    });
}

export interface IndentLinesOptions {
    /** 缩进大小（默认 2） */
    count?: number;
    /** 缩进字符（默认空格 " "，也可传入 "\t"） */
    indentChar?: string;
    /** 是否对空行跳过缩进（默认 true） */
    skipEmpty?: boolean;
}

/**
 * 多行文本指定层级缩进引擎 (indentLines)
 */
export function indentLines(text: string, options: IndentLinesOptions | number = 2): string {
    if (!text || typeof text !== "string") return text ?? "";
    const opts: IndentLinesOptions = typeof options === "number" ? {count: options} : options;
    const count = Math.max(0, opts.count !== undefined ? opts.count : 2);
    const indentChar = opts.indentChar !== undefined ? opts.indentChar : " ";
    const skipEmpty = opts.skipEmpty !== false;

    const pad = indentChar.repeat(count);
    const lines = text.replace(/\r\n?/g, "\n").split("\n");

    const indented = lines.map((line) => {
        if (skipEmpty && line.trim().length === 0) return line;
        return pad + line;
    });

    return indented.join("\n");
}

/**
 * 多行文本指定层级反向缩进 (减缩进) 引擎 (outdentLines)
 */
export function outdentLines(text: string, options: IndentLinesOptions | number = 2): string {
    if (!text || typeof text !== "string") return text ?? "";
    const opts: IndentLinesOptions = typeof options === "number" ? {count: options} : options;
    const count = Math.max(0, opts.count !== undefined ? opts.count : 2);
    const indentChar = opts.indentChar !== undefined ? opts.indentChar : " ";

    const lines = text.replace(/\r\n?/g, "\n").split("\n");

    const outdented = lines.map((line) => {
        if (indentChar === "\t") {
            let removed = 0;
            let cur = line;
            while (cur.startsWith("\t") && removed < count) {
                cur = cur.slice(1);
                removed++;
            }
            return cur;
        }

        let removed = 0;
        let cur = line;
        while (removed < count && (cur.startsWith(" ") || cur.startsWith("\t"))) {
            if (cur.startsWith("\t")) {
                cur = cur.slice(1);
                removed += count;
            } else {
                cur = cur.slice(1);
                removed++;
            }
        }
        return cur;
    });

    return outdented.join("\n");
}

export type DataFormatType = "email" | "phone" | "idcard" | "ipv4" | "url" | "number" | "date";

/**
 * 常见数据格式规范性校验 (validateFormat)
 */
export function validateFormat(text: string, type: DataFormatType = "email"): boolean {
    if (!text || typeof text !== "string") return false;
    const clean = text.trim();
    if (!clean) return false;

    switch (type) {
        case "email":
            return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(clean);
        case "phone":
            return /^1[3-9]\d{9}$/.test(clean);
        case "idcard":
            return /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[0-9Xx]$/.test(clean);
        case "ipv4":
            if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(clean)) return false;
            return clean.split(".").every((part) => {
                const n = parseInt(part, 10);
                return n >= 0 && n <= 255 && String(n) === part;
            });
        case "url":
            return /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(clean);
        case "number":
            return /^[+-]?(\d+(\.\d+)?|\.\d+)$/.test(clean);
        case "date":
            return /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(clean);
        default:
            return false;
    }
}

export interface FilterMarkdownTableOptions {
    /** 是否对单元格内容首尾去空白（默认 true） */
    trimCell?: boolean;
    /** 是否反向筛选 (排除匹配行，默认 false) */
    invert?: boolean;
}

/**
 * Markdown 表格按指定列内容过滤筛选行 (filterMarkdownTable)
 * 保留表头行与分隔线行，仅对数据行按 columnIndex（从 1 开始计）进行筛选
 */
export function filterMarkdownTable(
    tableMarkdown: string,
    columnIndex: number,
    filter: string | RegExp | ((val: string) => boolean),
    options: FilterMarkdownTableOptions = {},
): string {
    if (!tableMarkdown || typeof tableMarkdown !== "string") return tableMarkdown ?? "";
    const colIdx = Math.max(1, columnIndex) - 1;
    const trimCell = options.trimCell !== false;
    const invert = options.invert === true;

    const lines = tableMarkdown.replace(/\r\n?/g, "\n").split("\n").filter((l) => l.trim().length > 0);
    if (lines.length < 2) return tableMarkdown;

    const header = lines[0]!;
    const separator = lines[1]!;

    if (!header.includes("|") || !separator.includes("|")) {
        return tableMarkdown;
    }

    const dataLines = lines.slice(2);
    const passedDataLines: string[] = [];

    const isMatch = (val: string): boolean => {
        if (typeof filter === "function") {
            return filter(val);
        }
        if (filter instanceof RegExp) {
            return filter.test(val);
        }
        return val.includes(String(filter));
    };

    for (const row of dataLines) {
        if (!row.includes("|")) continue;
        const cells = row.split("|").slice(1, -1);
        let cellVal = cells[colIdx] ?? "";
        if (trimCell) cellVal = cellVal.trim();

        const match = isMatch(cellVal);
        const shouldKeep = invert ? !match : match;
        if (shouldKeep) {
            passedDataLines.push(row);
        }
    }

    return [header, separator, ...passedDataLines].join("\n");
}

export interface SwapPartsOptions {
    /** 分隔符（默认自动切分冒号、等号、逗号、分号或短横线箭头 -> ） */
    delimiter?: string | RegExp;
    /** 输出连接符（默认同匹配到的分隔符） */
    outputSeparator?: string;
    /** 是否修剪前后空白（默认 true） */
    trimParts?: boolean;
}

/**
 * 多行文本两部分位置互换对调引擎 (swapLineParts)
 * 例如 "key: value" -> "value: key" 或 "A, B" -> "B, A"
 */
export function swapLineParts(
    text: string,
    delimiterOrOptions?: string | RegExp | SwapPartsOptions,
    options?: SwapPartsOptions,
): string {
    if (!text || typeof text !== "string") return text ?? "";
    let opts: SwapPartsOptions = {};
    if (typeof delimiterOrOptions === "string" || delimiterOrOptions instanceof RegExp) {
        opts = {...(options || {}), delimiter: delimiterOrOptions};
    } else if (delimiterOrOptions && typeof delimiterOrOptions === "object") {
        opts = delimiterOrOptions;
    }

    const trimParts = opts.trimParts !== false;
    const delim = opts.delimiter !== undefined ? opts.delimiter : /(:|：|=|->|=>|,|，|;)/;

    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    const swapped = lines.map((line) => {
        if (!line.trim()) return line;

        let sep = "";
        let part1 = "";
        let part2 = "";

        if (typeof delim === "string") {
            const idx = line.indexOf(delim);
            if (idx === -1) return line;
            sep = delim;
            part1 = line.slice(0, idx);
            part2 = line.slice(idx + delim.length);
        } else {
            const m = line.match(delim);
            if (!m || m.index === undefined) return line;
            sep = m[0];
            part1 = line.slice(0, m.index);
            part2 = line.slice(m.index + m[0].length);
        }

        if (trimParts) {
            part1 = part1.trim();
            part2 = part2.trim();
        }

        let outSep = opts.outputSeparator;
        if (outSep === undefined) {
            if (sep === ":" || sep === "：") {
                outSep = sep === "：" ? "：" : ": ";
            } else if (sep === "=") {
                outSep = " = ";
            } else if (sep === "->" || sep === "=>") {
                outSep = ` ${sep} `;
            } else if (sep === "," || sep === "，" || sep === ";") {
                outSep = `${sep} `;
            } else {
                outSep = sep.endsWith(" ") ? sep : `${sep} `;
            }
        }

        return `${part2}${outSep}${part1}`;
    });

    return swapped.join("\n");
}

export interface PathParts {
    /** 原始完整路径 */
    raw: string;
    /** 父目录路径 (不包含尾随斜杠) */
    dir: string;
    /** 包含扩展名的完整文件名 (如 auth.service.ts) */
    filename: string;
    /** 不带扩展名的基本名 (如 auth.service) */
    stem: string;
    /** 扩展名 (不含点号，如 ts) */
    ext: string;
}

/**
 * 文件路径或 URL 组成部分结构化解析引擎 (parsePathParts)
 */
export function parsePathParts(pathStr: string): PathParts {
    if (!pathStr || typeof pathStr !== "string") {
        return {raw: "", dir: "", filename: "", stem: "", ext: ""};
    }

    const clean = pathStr.trim().replace(/\\/g, "/");
    let cleanPath = clean;
    const queryIdx = cleanPath.indexOf("?");
    if (queryIdx !== -1) cleanPath = cleanPath.slice(0, queryIdx);
    const hashIdx = cleanPath.indexOf("#");
    if (hashIdx !== -1) cleanPath = cleanPath.slice(0, hashIdx);

    const lastSlash = cleanPath.lastIndexOf("/");
    let dir = "";
    let filename = cleanPath;

    if (lastSlash !== -1) {
        dir = cleanPath.slice(0, lastSlash);
        filename = cleanPath.slice(lastSlash + 1);
    }

    const lastDot = filename.lastIndexOf(".");
    let stem = filename;
    let ext = "";

    if (lastDot > 0) {
        stem = filename.slice(0, lastDot);
        ext = filename.slice(lastDot + 1);
    }

    return {
        raw: pathStr,
        dir,
        filename,
        stem,
        ext,
    };
}

export interface DedupeCountOptions {
    /** 是否按出现频次降序排列（默认 true） */
    sortByCount?: boolean;
    /** 输出格式模板，支持 {count} 与 {line}（默认 "{line} ({count})"） */
    formatTemplate?: string;
    /** 是否修剪行首尾空格（默认 true） */
    trimLines?: boolean;
    /** 是否忽略空行（默认 true） */
    ignoreEmpty?: boolean;
}

/**
 * 多行文本去重并输出行出现频次统计引擎 (deduplicateWithCount)
 */
export function deduplicateWithCount(text: string, options: DedupeCountOptions = {}): string {
    if (!text || typeof text !== "string") return text ?? "";
    const sortByCount = options.sortByCount !== false;
    const tpl = options.formatTemplate || "{line} ({count})";
    const trimLines = options.trimLines !== false;
    const ignoreEmpty = options.ignoreEmpty !== false;

    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    const counts = new Map<string, number>();
    const order: string[] = [];

    for (const rawLine of lines) {
        const line = trimLines ? rawLine.trim() : rawLine;
        if (ignoreEmpty && line.length === 0) continue;

        if (!counts.has(line)) {
            counts.set(line, 1);
            order.push(line);
        } else {
            counts.set(line, (counts.get(line) ?? 1) + 1);
        }
    }

    const items = order.map((line) => ({
        line,
        count: counts.get(line) ?? 1,
    }));

    if (sortByCount) {
        items.sort((a, b) => b.count - a.count);
    }

    const formatted = items.map((it) => {
        return tpl
            .replace(/\{count\}/g, String(it.count))
            .replace(/\{line\}/g, it.line);
    });

    return formatted.join("\n");
}

export type QuoteStyle = "straight" | "curly" | "corner";

/**
 * 文本标点两端引号智能配对与规范化引擎 (normalizeSmartQuotes)
 * - straight: 转为直引号 "..." 与 '...'
 * - curly: 转为中文/西文规范弯引号 “...” 与 ‘...’
 * - corner: 转为直角引号 「...」 与 『...』
 */
export function normalizeSmartQuotes(text: string, targetStyle: QuoteStyle = "curly"): string {
    if (!text || typeof text !== "string") return text ?? "";

    if (targetStyle === "straight") {
        return text
            .replace(/[“”「」『』]/g, '"')
            .replace(/[‘’]/g, "'");
    }

    if (targetStyle === "corner") {
        let cur = text
            .replace(/["“”]/g, '"')
            .replace(/['‘’]/g, "'");

        cur = cur.replace(/"([^"\r\n]+)"/g, "「$1」");
        cur = cur.replace(/'([^'\r\n]+)'/g, "『$1』");
        return cur;
    }

    let cur = text
        .replace(/[「」]/g, '"')
        .replace(/[『』]/g, "'");

    cur = cur.replace(/"([^"\r\n]+)"/g, "“$1”");
    cur = cur.replace(/'([^'\r\n]+)'/g, "‘$1’");

    return cur;
}

export interface InterleaveLinesOptions {
    /** 当一段文本行数较多时，是否保留多余的行（默认 true） */
    keepExceeding?: boolean;
    /** 是否忽略空行（默认 false） */
    ignoreEmpty?: boolean;
}

/**
 * 多行文本交替穿插合并引擎 (interleaveLines)
 * 例如 A1\nA2 与 B1\nB2 -> A1\nB1\nA2\nB2
 */
export function interleaveLines(
    textA: string,
    textB: string,
    options: InterleaveLinesOptions = {},
): string {
    const keepExceeding = options.keepExceeding !== false;
    const ignoreEmpty = options.ignoreEmpty === true;

    const processLines = (txt: string) => {
        let lines = (txt ?? "").replace(/\r\n?/g, "\n").split("\n");
        if (ignoreEmpty) lines = lines.filter((l) => l.trim().length > 0);
        return lines;
    };

    const linesA = processLines(textA);
    const linesB = processLines(textB);

    const maxLen = Math.max(linesA.length, linesB.length);
    const result: string[] = [];

    for (let i = 0; i < maxLen; i++) {
        if (i < linesA.length) {
            result.push(linesA[i]!);
        } else if (!keepExceeding) {
            break;
        }

        if (i < linesB.length) {
            result.push(linesB[i]!);
        } else if (!keepExceeding) {
            break;
        }
    }

    return result.join("\n");
}

export type KeyCaseStyle = "camel" | "snake" | "kebab" | "pascal";

function transformKey(key: string, style: KeyCaseStyle): string {
    const trimmed = key.trim();
    if (!trimmed) return key;

    const words = trimmed
        .replace(/[-_]+/g, " ")
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
        .split(/\s+/)
        .filter(Boolean);

    if (words.length === 0) return key;

    if (style === "snake") {
        return words.map((w) => w.toLowerCase()).join("_");
    }
    if (style === "kebab") {
        return words.map((w) => w.toLowerCase()).join("-");
    }
    if (style === "pascal") {
        return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("");
    }
    return words.map((w, idx) => {
        const lower = w.toLowerCase();
        if (idx === 0) return lower;
        return lower.charAt(0).toUpperCase() + lower.slice(1);
    }).join("");
}

/**
 * JSON 对象或 Properties 键名风格批量转换引擎 (convertObjectKeysCase)
 */
export function convertObjectKeysCase(text: string, targetCase: KeyCaseStyle = "camel"): string {
    if (!text || typeof text !== "string") return text ?? "";
    const clean = text.trim();

    if ((clean.startsWith("{") && clean.endsWith("}")) || (clean.startsWith("[") && clean.endsWith("]"))) {
        try {
            const parsed = JSON.parse(clean);
            const transformObj = (val: any): any => {
                if (Array.isArray(val)) {
                    return val.map(transformObj);
                }
                if (val !== null && typeof val === "object") {
                    const res: Record<string, any> = {};
                    for (const [k, v] of Object.entries(val)) {
                        const newKey = transformKey(k, targetCase);
                        res[newKey] = transformObj(v);
                    }
                    return res;
                }
                return val;
            };

            const transformed = transformObj(parsed);
            return JSON.stringify(transformed, null, 2);
        } catch {
            // fallback
        }
    }

    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    const converted = lines.map((line) => {
        const colonIdx = line.indexOf(":");
        const equalIdx = line.indexOf("=");

        let sepIdx = -1;
        let sepChar = "";

        if (colonIdx !== -1 && (equalIdx === -1 || colonIdx < equalIdx)) {
            sepIdx = colonIdx;
            sepChar = ":";
        } else if (equalIdx !== -1) {
            sepIdx = equalIdx;
            sepChar = "=";
        }

        if (sepIdx === -1) return line;

        const rawK = line.slice(0, sepIdx);
        const rawV = line.slice(sepIdx + 1);

        const newK = transformKey(rawK, targetCase);
        const prefixSpaces = rawK.match(/^\s*/)?.[0] || "";
        return `${prefixSpaces}${newK}${sepChar}${rawV}`;
    });

    return converted.join("\n");
}

export interface UnitSpacingResult {
    result: string;
    spacedCount: number;
}

const COMMON_UNITS = [
    "B", "KB", "MB", "GB", "TB", "PB", "Kbps", "Mbps", "Gbps", "bps",
    "m", "km", "cm", "mm", "kg", "g", "mg", "s", "ms", "h", "min", "Hz", "kHz", "MHz", "GHz", "V", "A", "W", "kW", "MW", "J", "N", "Pa", "kPa", "MPa", "dpi", "px", "em", "rem",
];

const UNIT_REGEX = /(\d+(?:\.\d+)?)(?:\s*)([a-zA-Z]+)\b/g;

/**
 * 中英混排数字与度量单位规范间距格式化 (formatUnitSpacing)
 * 例如 "100MB" -> "100 MB", "3.5GHz" -> "3.5 GHz", "50kg" -> "50 kg"
 */
export function formatUnitSpacing(text: string): UnitSpacingResult {
    if (!text || typeof text !== "string") return {result: text ?? "", spacedCount: 0};

    let count = 0;
    const unitSet = new Set(COMMON_UNITS);

    const result = text.replace(UNIT_REGEX, (match, num, unit) => {
        if (unitSet.has(unit)) {
            const expected = `${num} ${unit}`;
            if (expected !== match) {
                count++;
                return expected;
            }
        }
        return match;
    });

    return {result, spacedCount: count};
}

export type CharsetFilterMode =
    | "chinese-only"
    | "alphanumeric-only"
    | "ascii-only"
    | "strip-punctuation"
    | "strip-emoji";

/**
 * 文本字符集提取与特定字符清洗过滤引擎 (filterCharacterSet)
 */
export function filterCharacterSet(text: string, mode: CharsetFilterMode = "alphanumeric-only"): string {
    if (!text || typeof text !== "string") return text ?? "";

    switch (mode) {
        case "chinese-only":
            return text.replace(/[^\u4e00-\u9fa5\u3400-\u4dbf]/g, "");

        case "alphanumeric-only":
            return text.replace(/[^a-zA-Z0-9]/g, "");

        case "ascii-only":
            return text.replace(/[^\x20-\x7E\r\n\t]/g, "");

        case "strip-punctuation":
            return text.replace(/[\p{P}\p{S}]/gu, "");

        case "strip-emoji":
            return text.replace(/\p{Extended_Pictographic}/gu, "");

        default:
            return text;
    }
}

const NANO_DEFAULT_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/**
 * 紧凑 URL 安全唯一随机标识生成引擎 (generateNanoId)
 */
export function generateNanoId(size = 10, alphabet: string = NANO_DEFAULT_ALPHABET): string {
    const len = Math.max(1, size);
    const chars = alphabet && alphabet.length > 0 ? alphabet : NANO_DEFAULT_ALPHABET;
    let id = "";
    for (let i = 0; i < len; i++) {
        const randIndex = Math.floor(Math.random() * chars.length);
        id += chars[randIndex];
    }
    return id;
}

export interface ToggleCommentsResult {
    result: string;
    mode: "comment" | "uncomment";
    changedLines: number;
}

export interface ToggleCommentsOptions {
    /** 注释前缀（默认 "// "） */
    prefix?: string;
    /** 空行是否跳过（默认 true） */
    skipEmpty?: boolean;
}

/**
 * 多行文本批量添加与移除注释符号 (toggleLineComments)
 */
export function toggleLineComments(
    text: string,
    prefixOrOptions?: string | ToggleCommentsOptions,
    options?: ToggleCommentsOptions,
): ToggleCommentsResult {
    if (!text || typeof text !== "string") {
        return {result: text ?? "", mode: "comment", changedLines: 0};
    }

    let opts: ToggleCommentsOptions = {};
    if (typeof prefixOrOptions === "string") {
        opts = {...(options || {}), prefix: prefixOrOptions};
    } else if (prefixOrOptions && typeof prefixOrOptions === "object") {
        opts = prefixOrOptions;
    }

    const prefix = opts.prefix !== undefined ? opts.prefix : "// ";
    const cleanPrefix = prefix.trim();
    const skipEmpty = opts.skipEmpty !== false;

    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    const nonEmptyLines = lines.filter((l) => l.trim().length > 0);

    const allCommented = nonEmptyLines.length > 0 && nonEmptyLines.every((line) => {
        const trimmed = line.trim();
        return trimmed.startsWith(cleanPrefix);
    });

    let changedCount = 0;
    const targetMode = allCommented ? "uncomment" : "comment";

    const processed = lines.map((line) => {
        if (skipEmpty && line.trim().length === 0) return line;

        if (targetMode === "uncomment") {
            const indentMatch = line.match(/^(\s*)/);
            const indent = indentMatch ? indentMatch[1]! : "";
            const rest = line.slice(indent.length);

            if (rest.startsWith(prefix)) {
                changedCount++;
                return indent + rest.slice(prefix.length);
            }
            if (rest.startsWith(cleanPrefix)) {
                changedCount++;
                let stripped = rest.slice(cleanPrefix.length);
                if (stripped.startsWith(" ")) stripped = stripped.slice(1);
                return indent + stripped;
            }
            return line;
        } else {
            changedCount++;
            const indentMatch = line.match(/^(\s*)/);
            const indent = indentMatch ? indentMatch[1]! : "";
            const rest = line.slice(indent.length);
            return `${indent}${prefix}${rest}`;
        }
    });

    return {
        result: processed.join("\n"),
        mode: targetMode,
        changedLines: changedCount,
    };
}

/**
 * 字符串模板简单变量插值渲染引擎 (renderSimpleTemplate)
 * 支持 {key} 与 {{key}} 占位符插值替换
 */
export function renderSimpleTemplate(
    template: string,
    data: Record<string, any> | string = {},
): string {
    if (!template || typeof template !== "string") return template ?? "";

    let dict: Record<string, any> = {};
    if (typeof data === "string") {
        const cleanData = data.trim();
        if (cleanData.startsWith("{") && cleanData.endsWith("}")) {
            try {
                dict = JSON.parse(cleanData);
            } catch {
                dict = parseKeyValuePairs(cleanData);
            }
        } else {
            dict = parseKeyValuePairs(cleanData);
        }
    } else if (data && typeof data === "object") {
        dict = data;
    }

    return template.replace(/\{{1,2}(?!\s*xlc:)([a-zA-Z0-9_.-]+)\}{1,2}/g, (match, key) => {
        if (Object.prototype.hasOwnProperty.call(dict, key)) {
            const val = dict[key];
            return val !== undefined && val !== null ? String(val) : "";
        }
        const lowerKey = key.toLowerCase();
        for (const [k, v] of Object.entries(dict)) {
            if (k.toLowerCase() === lowerKey) {
                return v !== undefined && v !== null ? String(v) : "";
            }
        }
        return match;
    });
}

export interface BracketsBalanceResult {
    isBalanced: boolean;
    unclosed: string[];
    unexpected: string[];
    errorSummary: string;
}

const BALANCE_PAIRS: Record<string, string> = {
    "(": ")",
    "[": "]",
    "{": "}",
    "《": "》",
    "【": "】",
    "「": "」",
    "『": "』",
    "“": "”",
};

const CLOSE_TO_OPEN: Record<string, string> = {
    ")": "(",
    "]": "[",
    "}": "{",
    "》": "《",
    "】": "【",
    "」": "「",
    "』": "『",
    "”": "“",
};

/**
 * 文本括号标点成对闭合与平衡校验引擎 (checkBracketsBalance)
 */
export function checkBracketsBalance(text: string): BracketsBalanceResult {
    if (!text || typeof text !== "string") {
        return {isBalanced: true, unclosed: [], unexpected: [], errorSummary: ""};
    }

    const stack: Array<{char: string; pos: number}> = [];
    const unexpected: string[] = [];

    for (let i = 0; i < text.length; i++) {
        const ch = text[i]!;

        if (BALANCE_PAIRS[ch]) {
            stack.push({char: ch, pos: i});
        } else if (CLOSE_TO_OPEN[ch]) {
            const expectedOpen = CLOSE_TO_OPEN[ch]!;
            if (stack.length > 0 && stack[stack.length - 1]!.char === expectedOpen) {
                stack.pop();
            } else {
                unexpected.push(ch);
            }
        }
    }

    const unclosed = stack.map((s) => s.char);
    const isBalanced = unclosed.length === 0 && unexpected.length === 0;

    let errorSummary = "";
    if (!isBalanced) {
        const parts: string[] = [];
        if (unclosed.length > 0) parts.push(`未闭合左括号: ${unclosed.join(" ")}`);
        if (unexpected.length > 0) parts.push(`多余右括号: ${unexpected.join(" ")}`);
        errorSummary = parts.join("；");
    }

    return {
        isBalanced,
        unclosed,
        unexpected,
        errorSummary,
    };
}

export interface AdaptivePunctuationResult {
    result: string;
    convertedCount: number;
}

/**
 * 中英混排数字与全半角标点智能自适应纠错引擎 (normalizePunctuationAdaptive)
 */
export function normalizePunctuationAdaptive(text: string): AdaptivePunctuationResult {
    if (!text || typeof text !== "string") return {result: text ?? "", convertedCount: 0};

    let count = 0;
    let cur = text;

    cur = cur.replace(/([\u4e00-\u9fa5])\s*,\s*(?=[\u4e00-\u9fa5]|$)/g, (_, c) => {
        count++;
        return `${c}，`;
    });
    cur = cur.replace(/([\u4e00-\u9fa5])\s*\.\s*(?=[\u4e00-\u9fa5]|$)/g, (_, c) => {
        count++;
        return `${c}。`;
    });
    cur = cur.replace(/([\u4e00-\u9fa5])\s*!\s*(?=[\u4e00-\u9fa5]|$)/g, (_, c) => {
        count++;
        return `${c}！`;
    });
    cur = cur.replace(/([\u4e00-\u9fa5])\s*\?\s*(?=[\u4e00-\u9fa5]|$)/g, (_, c) => {
        count++;
        return `${c}？`;
    });
    cur = cur.replace(/([\u4e00-\u9fa5])\s*:\s*(?=[\u4e00-\u9fa5]|$)/g, (_, c) => {
        count++;
        return `${c}：`;
    });
    cur = cur.replace(/([\u4e00-\u9fa5])\s*;\s*(?=[\u4e00-\u9fa5]|$)/g, (_, c) => {
        count++;
        return `${c}；`;
    });

    cur = cur.replace(/([a-zA-Z])，(?=[a-zA-Z\s]|$)/g, (_, c) => {
        count++;
        return `${c}, `;
    });
    cur = cur.replace(/([a-zA-Z])。(?:(?=[a-zA-Z\s])|$)/g, (_, c) => {
        count++;
        return `${c}. `;
    });
    cur = cur.replace(/([a-zA-Z])！(?=[a-zA-Z\s]|$)/g, (_, c) => {
        count++;
        return `${c}! `;
    });
    cur = cur.replace(/([a-zA-Z])？(?=[a-zA-Z\s]|$)/g, (_, c) => {
        count++;
        return `${c}? `;
    });

    return {
        result: cur,
        convertedCount: count,
    };
}

export type ObfuscateMode = "rot13" | "leet";

/**
 * 文本轻量安全混淆与加解密引擎 (obfuscateText)
 */
export function obfuscateText(text: string, mode: ObfuscateMode = "rot13"): string {
    if (!text || typeof text !== "string") return text ?? "";

    if (mode === "leet") {
        const leetMap: Record<string, string> = {
            a: "4", A: "4",
            e: "3", E: "3",
            i: "1", I: "1",
            o: "0", O: "0",
            s: "5", S: "5",
            t: "7", T: "7",
        };
        return text.replace(/[aeiost]/gi, (c) => leetMap[c] ?? c);
    }

    return text.replace(/[a-zA-Z]/g, (char) => {
        const code = char.charCodeAt(0);
        if (code >= 65 && code <= 90) {
            return String.fromCharCode(((code - 65 + 13) % 26) + 65);
        }
        if (code >= 97 && code <= 122) {
            return String.fromCharCode(((code - 97 + 13) % 26) + 97);
        }
        return char;
    });
}

export interface WrapTextOptions {
    /** 换行符（默认 "\n"） */
    newLine?: string;
    /** 缩进字符（对后续折行前添加的缩进，默认 ""） */
    indent?: string;
    /** 是否对西文在空格边界折行（默认 true） */
    wordBreak?: boolean;
}

/**
 * 多行文本固定列宽格式化与智能折行引擎 (wrapTextLines)
 */
export function wrapTextLines(
    text: string,
    maxWidth = 80,
    options: WrapTextOptions = {},
): string {
    if (!text || typeof text !== "string") return text ?? "";
    const limit = Math.max(10, maxWidth);
    const nl = options.newLine || "\n";
    const indent = options.indent || "";
    const wordBreak = options.wordBreak !== false;

    const rawLines = text.replace(/\r\n?/g, "\n").split("\n");
    const resultLines: string[] = [];

    const getCharWidth = (ch: string) => {
        const code = ch.charCodeAt(0);
        return (code >= 0x4e00 && code <= 0x9fa5) || code > 0xff ? 2 : 1;
    };

    const getStrWidth = (str: string) => {
        let w = 0;
        for (const c of str) w += getCharWidth(c);
        return w;
    };

    for (const rawLine of rawLines) {
        if (getStrWidth(rawLine) <= limit) {
            resultLines.push(rawLine);
            continue;
        }

        let currentLine = "";
        let currentWidth = 0;
        let isFirstSubLine = true;

        const tokens: string[] = [];
        if (wordBreak) {
            const parts = rawLine.split(/([\u4e00-\u9fa5\u3400-\u4dbf]|\s+)/).filter(Boolean);
            for (const p of parts) {
                if (getStrWidth(p) > limit) {
                    tokens.push(...p.split(""));
                } else {
                    tokens.push(p);
                }
            }
        } else {
            tokens.push(...rawLine.split(""));
        }

        for (const token of tokens) {
            const tokenWidth = getStrWidth(token);
            const lineIndentWidth = isFirstSubLine ? 0 : getStrWidth(indent);

            if (currentWidth + tokenWidth + lineIndentWidth <= limit) {
                currentLine += token;
                currentWidth += tokenWidth;
            } else {
                if (currentLine.length > 0) {
                    resultLines.push(isFirstSubLine ? currentLine : indent + currentLine);
                    isFirstSubLine = false;
                }
                currentLine = token.trimStart();
                currentWidth = getStrWidth(currentLine);
            }
        }

        if (currentLine.length > 0) {
            resultLines.push(isFirstSubLine ? currentLine : indent + currentLine);
        }
    }

    return resultLines.join(nl);
}

export interface ShiftHeadingsResult {
    result: string;
    shiftedCount: number;
}

export interface ShiftHeadingsOptions {
    /** 最小层级（默认 1，即 #） */
    minLevel?: number;
    /** 最大层级（默认 6，即 ######） */
    maxLevel?: number;
}

/**
 * Markdown 标题层级批量升高/降低引擎 (shiftMarkdownHeadings)
 * delta > 0: 降级 (例如 H1->H2, # -> ##)
 * delta < 0: 升级 (例如 H2->H1, ## -> #)
 */
export function shiftMarkdownHeadings(
    text: string,
    delta: number,
    options: ShiftHeadingsOptions = {},
): ShiftHeadingsResult {
    if (!text || typeof text !== "string") return {result: text ?? "", shiftedCount: 0};
    if (delta === 0) return {result: text, shiftedCount: 0};

    const minLevel = Math.max(1, options.minLevel !== undefined ? options.minLevel : 1);
    const maxLevel = Math.min(6, options.maxLevel !== undefined ? options.maxLevel : 6);

    let count = 0;
    const lines = text.replace(/\r\n?/g, "\n").split("\n");

    const processed = lines.map((line) => {
        const match = line.match(/^(\s*)(#{1,6})(\s+.*)$/);
        if (!match) return line;

        const indent = match[1]!;
        const currentLevel = match[2]!.length;
        const rest = match[3]!;

        let newLevel = currentLevel + delta;
        newLevel = Math.max(minLevel, Math.min(maxLevel, newLevel));

        if (newLevel !== currentLevel) {
            count++;
            return `${indent}${"#".repeat(newLevel)}${rest}`;
        }
        return line;
    });

    return {
        result: processed.join("\n"),
        shiftedCount: count,
    };
}

export interface EnsureAffixesOptions {
    /** 确保存在的前缀（若已有则不重复添加） */
    prefix?: string;
    /** 确保存在的后缀（若已有则不重复添加） */
    suffix?: string;
    /** 是否跳过纯空行（默认 true） */
    skipEmpty?: boolean;
    /** 是否对行内容做 trim（默认 true） */
    trimLine?: boolean;
}

/**
 * 文本行幂等前后缀补齐引擎 (ensureLineAffixes)
 */
export function ensureLineAffixes(text: string, options: EnsureAffixesOptions = {}): string {
    if (!text || typeof text !== "string") return text ?? "";
    const prefix = options.prefix || "";
    const suffix = options.suffix || "";
    const skipEmpty = options.skipEmpty !== false;
    const trimLine = options.trimLine !== false;

    if (!prefix && !suffix) return text;

    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    const processed = lines.map((line) => {
        if (skipEmpty && line.trim().length === 0) return line;

        let content = trimLine ? line.trim() : line;

        if (prefix && !content.startsWith(prefix)) {
            content = prefix + content;
        }
        if (suffix && !content.endsWith(suffix)) {
            content = content + suffix;
        }
        return content;
    });

    return processed.join("\n");
}

/**
 * 多行正则跨行锚点替换引擎 (regexReplaceMultiline)
 */
export function regexReplaceMultiline(
    text: string,
    pattern: string,
    replacement: string,
    flags = "gm",
): string {
    if (!text || typeof text !== "string") return text ?? "";
    if (!pattern) return text;

    try {
        let f = flags;
        if (!f.includes("g")) f += "g";
        if (!f.includes("m")) f += "m";

        const reg = new RegExp(pattern, f);
        return text.replace(reg, replacement);
    } catch {
        return text;
    }
}

export interface CodeLanguageDetectionResult {
    language: string;
    confidence: number;
    isCode: boolean;
}

/**
 * 代码片段编程语言智能嗅探与推导引擎 (detectCodeLanguage)
 * 支持识别: json, sql, python, typescript, javascript, html, css, bash, rust, go, markdown
 */
export function detectCodeLanguage(code: string): CodeLanguageDetectionResult {
    if (!code || typeof code !== "string") {
        return {language: "text", confidence: 0, isCode: false};
    }
    const clean = code.trim();
    if (clean.length < 5) {
        return {language: "text", confidence: 0, isCode: false};
    }

    if ((clean.startsWith("{") && clean.endsWith("}")) || (clean.startsWith("[") && clean.endsWith("]"))) {
        try {
            JSON.parse(clean);
            return {language: "json", confidence: 0.95, isCode: true};
        } catch {
            // continue
        }
    }

    if (/<\/?[a-z][\s\S]*>/i.test(clean) && (clean.includes("</div>") || clean.includes("</span>") || clean.includes("<html") || clean.includes("<!DOCTYPE"))) {
        return {language: "html", confidence: 0.9, isCode: true};
    }

    if (/\b(SELECT\s+.*FROM|INSERT\s+INTO|UPDATE\s+.*SET|DELETE\s+FROM|CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE)\b/i.test(clean)) {
        return {language: "sql", confidence: 0.9, isCode: true};
    }

    if (/\b(def\s+[a-zA-Z_]\w*\s*\(|class\s+[a-zA-Z_]\w*.*:|import\s+[a-zA-Z_]\w*|from\s+[a-zA-Z_]\w*\s+import|if\s+__name__\s*==\s*['"]__main__['"])\b/.test(clean)) {
        return {language: "python", confidence: 0.9, isCode: true};
    }

    const hasTsSpecific = /\b(interface\s+[A-Z]\w*|type\s+[A-Z]\w*\s*=|:\s*(string|number|boolean|any|void)\b|<[A-Z]\w*>|\bas\s+const\b)/.test(clean);
    const hasJsTs = /\b(const\s+[a-zA-Z_$]\w*\s*=|let\s+[a-zA-Z_$]\w*\s*=|function\s+[a-zA-Z_$]\w*|console\.log\(|=>\s*\{?|export\s+(default\s+)?(function|class|const))\b/.test(clean);
    if (hasTsSpecific) {
        return {language: "typescript", confidence: 0.9, isCode: true};
    }
    if (hasJsTs) {
        return {language: "javascript", confidence: 0.85, isCode: true};
    }

    if (/(^|[.#])[a-zA-Z0-9_-]+\s*\{[^}]*\b(color|display|background|margin|padding|font|border|width|height|flex)\s*:/i.test(clean)) {
        return {language: "css", confidence: 0.85, isCode: true};
    }

    if (/\b(fn\s+[a-zA-Z_]\w*\s*\(|let\s+mut\s+|impl\s+|match\s+[a-zA-Z_]\w*\s*\{|println!\(|pub\s+fn)\b/.test(clean)) {
        return {language: "rust", confidence: 0.9, isCode: true};
    }

    if (/\b(func\s+(\([^)]+\)\s+)?[a-zA-Z_]\w*\(|package\s+[a-z_]\w*|fmt\.Print(ln|f)?|go\s+func\(|make\(chan\s+|make\(\[\])\b/.test(clean)) {
        return {language: "go", confidence: 0.9, isCode: true};
    }

    if (/(^#!\/bin\/(bash|sh)|\b(echo\s+["']|chmod\s+\+x|mkdir\s+-p|sudo\s+|grep\s+-|curl\s+-s))\b/m.test(clean)) {
        return {language: "bash", confidence: 0.85, isCode: true};
    }

    if (/^(\s*#{1,6}\s+|-\s+\[[ xX]\]|\*\s+\S+|>\s+\S+)/m.test(clean)) {
        return {language: "markdown", confidence: 0.7, isCode: false};
    }

    return {language: "text", confidence: 0.1, isCode: false};
}

/**
 * 随机打乱文本字符与单词洗牌引擎 (scrambleText)
 * - words: 按空格打乱句子中的单词顺序
 * - chars: 打乱字符串内部的字符顺序 (Anagram)
 */
export function scrambleText(text: string, mode: "words" | "chars" = "words"): string {
    if (!text || typeof text !== "string") return text ?? "";

    const shuffleArray = <T>(arr: T[]): T[] => {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = copy[i]!;
            copy[i] = copy[j]!;
            copy[j] = tmp;
        }
        return copy;
    };

    if (mode === "chars") {
        const chars = Array.from(text);
        return shuffleArray(chars).join("");
    }

    const words = text.split(/\s+/).filter(Boolean);
    if (words.length <= 1) return text;
    return shuffleArray(words).join(" ");
}

export interface CompactCharsOptions {
    /** 允许的最大重复次数（默认 1） */
    maxRepeat?: number;
    /** 仅压缩标点符号（默认 true） */
    punctuationOnly?: boolean;
}

/**
 * 文本重复字符与冗余标点智能压缩引擎 (compactRepeatedCharacters)
 * 例如 "太棒了！！！！" -> "太棒了！", "真的吗？？？？" -> "真的吗？", "~~~~~~" -> "~"
 */
export function compactRepeatedCharacters(
    text: string,
    maxRepeat = 1,
    options: CompactCharsOptions = {},
): { result: string; compressedCount: number } {
    if (!text || typeof text !== "string") return {result: text ?? "", compressedCount: 0};
    const max = Math.max(1, maxRepeat);
    const punctOnly = options.punctuationOnly !== false;

    let count = 0;
    const regex = punctOnly
        ? /([\p{P}\p{S}])\1+/gu
        : /(.)\1+/gu;

    const result = text.replace(regex, (match, char) => {
        if (match.length > max) {
            count += (match.length - max);
            return char.repeat(max);
        }
        return match;
    });

    return {result, compressedCount: count};
}

export interface TaskProgressResult {
    total: number;
    completed: number;
    pending: number;
    percent: number;
    progressBar: string;
    summary: string;
}

export interface TaskProgressOptions {
    /** 进度条长度（默认 10） */
    barLength?: number;
    /** 完成符号（默认 "█"） */
    completedChar?: string;
    /** 未完成符号（默认 "░"） */
    pendingChar?: string;
}

/**
 * Markdown 任务列表项进度计算与统计引擎 (calculateTaskProgress)
 */
export function calculateTaskProgress(
    text: string,
    options: TaskProgressOptions = {},
): TaskProgressResult {
    if (!text || typeof text !== "string") {
        return {total: 0, completed: 0, pending: 0, percent: 0, progressBar: "", summary: ""};
    }

    const barLength = Math.max(5, options.barLength || 10);
    const filledChar = options.completedChar || "█";
    const emptyChar = options.pendingChar || "░";

    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    let completed = 0;
    let pending = 0;

    const taskRegex = /^\s*(?:[-*+]|\d+\.)\s+\[([ xX])\]/;

    for (const line of lines) {
        const match = line.match(taskRegex);
        if (match) {
            const mark = match[1]!.toLowerCase();
            if (mark === "x") {
                completed++;
            } else {
                pending++;
            }
        }
    }

    const total = completed + pending;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const filledCount = total > 0 ? Math.round((completed / total) * barLength) : 0;
    const emptyCount = barLength - filledCount;
    const progressBar = `[${filledChar.repeat(filledCount)}${emptyChar.repeat(emptyCount)}] ${percent}%`;

    const summary = `任务进度: ${completed}/${total} 已完成 (${percent}%)`;

    return {
        total,
        completed,
        pending,
        percent,
        progressBar,
        summary,
    };
}

export interface SliceLinesOptions {
    /** 是否包含起始标记行（默认 true） */
    includeStart?: boolean;
    /** 是否包含结束标记行（默认 true） */
    includeEnd?: boolean;
    /** 是否对行做 trim 后再做正则/关键词匹配（默认 true） */
    trimBeforeMatch?: boolean;
}

/**
 * 文本行按起止标记条件截取引擎 (sliceLinesByPattern)
 */
export function sliceLinesByPattern(
    text: string,
    startPattern: string | RegExp,
    endPattern?: string | RegExp,
    options: SliceLinesOptions = {},
): string {
    if (!text || typeof text !== "string") return text ?? "";
    const includeStart = options.includeStart !== false;
    const includeEnd = options.includeEnd !== false;
    const trimMatch = options.trimBeforeMatch !== false;

    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    let capturing = false;
    const matchedLines: string[] = [];

    const isMatch = (line: string, pat?: string | RegExp): boolean => {
        if (!pat) return false;
        const target = trimMatch ? line.trim() : line;
        if (pat instanceof RegExp) {
            return pat.test(target);
        }
        return target.includes(pat);
    };

    for (const line of lines) {
        if (!capturing) {
            if (isMatch(line, startPattern)) {
                capturing = true;
                if (includeStart) {
                    matchedLines.push(line);
                }
                continue;
            }
        } else {
            if (endPattern && isMatch(line, endPattern)) {
                if (includeEnd) {
                    matchedLines.push(line);
                }
                break;
            }
            matchedLines.push(line);
        }
    }

    return matchedLines.join("\n");
}

/**
 * 千分位数值格式化与反格式化引擎 (formatNumberGrouping)
 */
export function formatNumberGrouping(
    numOrStr: number | string,
    mode: "add" | "remove" = "add",
): string {
    if (numOrStr === undefined || numOrStr === null || numOrStr === "") return "";
    const str = String(numOrStr).trim();

    if (mode === "remove") {
        return str.replace(/(\d),(\d)/g, "$1$2");
    }

    const match = str.match(/^([+-]?\d+)(\.\d+)?$/);
    if (!match) return str;

    const integerPart = match[1]!;
    const decimalPart = match[2] || "";

    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${formattedInteger}${decimalPart}`;
}

export interface ShiftBlockquotesResult {
    result: string;
    shiftedCount: number;
}

/**
 * Markdown 引用块嵌套层级提升与降低引擎 (shiftMarkdownBlockquotes)
 * delta > 0: 增加引用层级 (每行加 "> ")
 * delta < 0: 减少引用层级 (每行移除一层 "> ")
 */
export function shiftMarkdownBlockquotes(text: string, delta: number): ShiftBlockquotesResult {
    if (!text || typeof text !== "string") return {result: text ?? "", shiftedCount: 0};
    if (delta === 0) return {result: text, shiftedCount: 0};

    let count = 0;
    const lines = text.replace(/\r\n?/g, "\n").split("\n");

    const processed = lines.map((line) => {
        if (delta > 0) {
            count++;
            return `${"> ".repeat(delta)}${line}`;
        } else {
            let current = line;
            let removed = 0;
            const targetRemove = Math.abs(delta);

            while (removed < targetRemove) {
                const match = current.match(/^(\s*)>(?:\s(.*)|$)/);
                if (match) {
                    removed++;
                    current = (match[1] || "") + (match[2] !== undefined ? match[2] : "");
                } else {
                    break;
                }
            }

            if (removed > 0) {
                count++;
                return current;
            }
            return line;
        }
    });

    return {
        result: processed.join("\n"),
        shiftedCount: count,
    };
}

/**
 * 字符串轻量校验和计算引擎 (calculateChecksum)
 * 支持 crc32 与 adler32，输出标准十六进制字符串
 */
export function calculateChecksum(text: string, algorithm: "crc32" | "adler32" = "crc32"): string {
    if (!text || typeof text !== "string") return "00000000";

    const bytes = stringToUtf8Bytes(text);

    if (algorithm === "adler32") {
        let a = 1;
        let b = 0;
        const MOD_ADLER = 65521;
        for (let i = 0; i < bytes.length; i++) {
            a = (a + bytes[i]!) % MOD_ADLER;
            b = (b + a) % MOD_ADLER;
        }
        const adler = ((b << 16) | a) >>> 0;
        return adler.toString(16).padStart(8, "0");
    }

    let crc = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) {
        const byte = bytes[i]!;
        crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ byte) & 0xFF]!;
    }
    crc = (crc ^ 0xFFFFFFFF) >>> 0;
    return crc.toString(16).padStart(8, "0");
}

export interface AlignColumnsOptions {
    /** 列间填充留白数量（默认 1 个空格） */
    padding?: number;
    /** 是否对单元格去除首尾空白（默认 true） */
    trimCell?: boolean;
}

/**
 * 文本行按分隔符等宽对齐填充引擎 (alignDelimitedColumns)
 */
export function alignDelimitedColumns(
    text: string,
    delimiter: string | RegExp = ",",
    options: AlignColumnsOptions = {},
): string {
    if (!text || typeof text !== "string") return text ?? "";
    const padding = Math.max(0, options.padding !== undefined ? options.padding : 1);
    const trimCell = options.trimCell !== false;

    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    if (lines.length <= 1) return text;

    const getCharWidth = (ch: string) => {
        const code = ch.charCodeAt(0);
        return (code >= 0x4e00 && code <= 0x9fa5) || code > 0xff ? 2 : 1;
    };

    const getStrWidth = (str: string) => {
        let w = 0;
        for (const c of str) w += getCharWidth(c);
        return w;
    };

    const padEndWidth = (str: string, targetWidth: number): string => {
        const curW = getStrWidth(str);
        if (curW >= targetWidth) return str;
        return str + " ".repeat(targetWidth - curW);
    };

    const rowCells: string[][] = [];
    const colMaxWidths: number[] = [];

    for (const line of lines) {
        if (!line.trim()) {
            rowCells.push([]);
            continue;
        }

        const cells = line.split(delimiter).map((c) => (trimCell ? c.trim() : c));
        rowCells.push(cells);

        for (let col = 0; col < cells.length; col++) {
            const w = getStrWidth(cells[col]!);
            colMaxWidths[col] = Math.max(colMaxWidths[col] || 0, w);
        }
    }

    const delimStr = typeof delimiter === "string" ? delimiter : " ";
    const padStr = " ".repeat(padding);

    const alignedLines = rowCells.map((cells) => {
        if (cells.length === 0) return "";
        return cells.map((cell, col) => {
            if (col === cells.length - 1) return cell;
            const targetW = colMaxWidths[col] || 0;
            return padEndWidth(cell, targetW);
        }).join(`${delimStr}${padStr}`);
    });

    return alignedLines.join("\n");
}

export interface StripCommentsResult {
    result: string;
    removedCount: number;
}

/**
 * 代码文本注释批量安全剥离引擎 (stripCodeComments)
 */
export function stripCodeComments(code: string, language?: string): StripCommentsResult {
    if (!code || typeof code !== "string") return {result: code ?? "", removedCount: 0};

    let removed = 0;
    const clean = code.replace(/\r\n?/g, "\n");

    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inBacktick = false;
    let isEscaped = false;

    let out = "";
    let i = 0;

    const lang = (language || "").toLowerCase();
    const isPythonOrBash = lang === "python" || lang === "py" || lang === "bash" || lang === "sh" || lang === "shell";
    const isSql = lang === "sql";

    while (i < clean.length) {
        const ch = clean[i]!;
        const next = clean[i + 1] || "";

        if (isEscaped) {
            out += ch;
            isEscaped = false;
            i++;
            continue;
        }

        if (ch === "\\") {
            out += ch;
            isEscaped = true;
            i++;
            continue;
        }

        if (ch === "'" && !inDoubleQuote && !inBacktick) {
            inSingleQuote = !inSingleQuote;
            out += ch;
            i++;
            continue;
        }
        if (ch === '"' && !inSingleQuote && !inBacktick) {
            inDoubleQuote = !inDoubleQuote;
            out += ch;
            i++;
            continue;
        }
        if (ch === "`" && !inSingleQuote && !inDoubleQuote) {
            inBacktick = !inBacktick;
            out += ch;
            i++;
            continue;
        }

        if (!inSingleQuote && !inDoubleQuote && !inBacktick) {
            if (ch === "/" && next === "*") {
                removed++;
                i += 2;
                while (i < clean.length && !(clean[i] === "*" && clean[i + 1] === "/")) {
                    i++;
                }
                i += 2;
                continue;
            }

            if (ch === "/" && next === "/") {
                removed++;
                i += 2;
                while (i < clean.length && clean[i] !== "\n") {
                    i++;
                }
                continue;
            }

            if ((isPythonOrBash || ch === "#") && ch === "#") {
                removed++;
                i++;
                while (i < clean.length && clean[i] !== "\n") {
                    i++;
                }
                continue;
            }

            if (isSql && ch === "-" && next === "-") {
                removed++;
                i += 2;
                while (i < clean.length && clean[i] !== "\n") {
                    i++;
                }
                continue;
            }
        }

        out += ch;
        i++;
    }

    const cleanedLines = out
        .split("\n")
        .map((l) => l.trimEnd())
        .join("\n");

    return {
        result: cleanedLines,
        removedCount: removed,
    };
}

/**
 * 文本行按指定模式分组聚合统计引擎 (groupLinesByPattern)
 */
export function groupLinesByPattern(text: string, pattern?: string | RegExp): string {
    if (!text || typeof text !== "string") return text ?? "";

    const lines = text.replace(/\r\n?/g, "\n").split("\n").filter((l) => l.trim().length > 0);
    if (lines.length === 0) return text;

    const delimPattern = pattern || /^\[([A-Z0-9_-]+)\]|^([A-Za-z0-9_\u4e00-\u9fa5]+)\s*[:：]/;
    const groups = new Map<string, string[]>();
    const uncategorized: string[] = [];

    for (const line of lines) {
        let key = "";
        if (typeof delimPattern === "string") {
            if (line.includes(delimPattern)) {
                key = delimPattern;
            }
        } else {
            const m = line.match(delimPattern);
            if (m) {
                key = (m[1] || m[2] || m[0]).trim();
            }
        }

        if (key) {
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(line);
        } else {
            uncategorized.push(line);
        }
    }

    const outputSections: string[] = [];
    for (const [key, groupLines] of groups.entries()) {
        outputSections.push(`### ${key} (${groupLines.length})\n${groupLines.join("\n")}`);
    }

    if (uncategorized.length > 0) {
        outputSections.push(`### 未分类 (${uncategorized.length})\n${uncategorized.join("\n")}`);
    }

    return outputSections.join("\n\n");
}

export interface NormalizeHRulesResult {
    result: string;
    normalizedCount: number;
}

/**
 * Markdown 分割线与水平标尺标准化格式化引擎 (normalizeHorizontalRules)
 */
export function normalizeHorizontalRules(
    text: string,
    targetStyle = "---",
): NormalizeHRulesResult {
    if (!text || typeof text !== "string") return {result: text ?? "", normalizedCount: 0};

    const hrRegex = /^\s*(?:(?:\*[\s]*){3,}|(?:-[\s]*){3,}|(?:_[\s]*){3,})\s*$/;
    let count = 0;

    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    const resultLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;

        if (hrRegex.test(line)) {
            count++;
            if (resultLines.length > 0 && resultLines[resultLines.length - 1]!.trim().length > 0) {
                resultLines.push("");
            }
            resultLines.push(targetStyle);
            if (i + 1 < lines.length && lines[i + 1]!.trim().length > 0 && !hrRegex.test(lines[i + 1]!)) {
                resultLines.push("");
            }
        } else {
            resultLines.push(line);
        }
    }

    return {
        result: resultLines.join("\n"),
        normalizedCount: count,
    };
}

export type TableAlignment = "left" | "center" | "right";

/**
 * Markdown 表格对齐方式批量转换引擎 (alignMarkdownTableColumns)
 */
export function alignMarkdownTableColumns(
    tableMarkdown: string,
    alignments: TableAlignment | TableAlignment[] = "center",
): string {
    if (!tableMarkdown || typeof tableMarkdown !== "string") return tableMarkdown ?? "";

    const lines = tableMarkdown.replace(/\r\n?/g, "\n").split("\n").filter((l) => l.trim().length > 0);
    if (lines.length < 2) return tableMarkdown;

    const header = lines[0]!;
    const separator = lines[1]!;

    if (!header.includes("|") || !separator.includes("|")) return tableMarkdown;

    const sepCells = separator.split("|").slice(1, -1);

    const getAlignStr = (align: TableAlignment): string => {
        if (align === "center") return " :---: ";
        if (align === "right") return " ---: ";
        return " :--- ";
    };

    const newSepCells = sepCells.map((_, idx) => {
        let align: TableAlignment = "center";
        if (Array.isArray(alignments)) {
            align = alignments[idx] || "left";
        } else if (typeof alignments === "string") {
            align = alignments;
        }
        return getAlignStr(align);
    });

    const newSeparator = `|${newSepCells.join("|")}|`;
    const rest = lines.slice(2);

    return [header, newSeparator, ...rest].join("\n");
}

export interface PadTruncateOptions {
    /** 对齐方向: "left" (左对齐，右侧补齐), "right" (右对齐，左侧补齐), "center" (居中补齐) */
    direction?: "left" | "right" | "center";
    /** 填充字符（默认空格 " "） */
    padChar?: string;
    /** 截断时是否追加省略号（默认 false） */
    ellipsis?: boolean;
}

/**
 * 文本字段定长补齐与截断引擎 (padOrTruncate)
 */
export function padOrTruncate(
    text: string,
    width = 10,
    options: PadTruncateOptions = {},
): string {
    if (text === undefined || text === null) return "";
    const str = String(text);
    const targetWidth = Math.min(10000, Math.max(1, width));
    const dir = options.direction || "left";
    const padChar = options.padChar && options.padChar.length > 0 ? options.padChar.charAt(0) : " ";
    const ellipsis = options.ellipsis === true;

    const getCharWidth = (ch: string) => {
        const code = ch.charCodeAt(0);
        return (code >= 0x4e00 && code <= 0x9fa5) || code > 0xff ? 2 : 1;
    };

    const getStrWidth = (s: string) => {
        let w = 0;
        for (const c of s) w += getCharWidth(c);
        return w;
    };

    const curWidth = getStrWidth(str);

    if (curWidth === targetWidth) return str;

    if (curWidth > targetWidth) {
        if (ellipsis && targetWidth > 3) {
            let truncated = "";
            let w = 0;
            const chars = Array.from(str);
            for (const ch of chars) {
                const cw = getCharWidth(ch);
                if (w + cw + 3 <= targetWidth) {
                    truncated += ch;
                    w += cw;
                } else {
                    break;
                }
            }
            return truncated + "...";
        }

        let truncated = "";
        let w = 0;
        const chars = Array.from(str);
        for (const ch of chars) {
            const cw = getCharWidth(ch);
            if (w + cw <= targetWidth) {
                truncated += ch;
                w += cw;
            } else {
                break;
            }
        }
        return truncated;
    }

    const diff = targetWidth - curWidth;
    if (dir === "right") {
        return padChar.repeat(diff) + str;
    }
    if (dir === "center") {
        const left = Math.floor(diff / 2);
        const right = diff - left;
        return padChar.repeat(left) + str + padChar.repeat(right);
    }
    return str + padChar.repeat(diff);
}

export interface SanitizeLineResult {
    result: string;
    fixedCount: number;
}

/**
 * 多行文本行尾空格与 NBSP 不换行隐形空格深度清洗引擎 (sanitizeLineEndingsAndSpaces)
 */
export function sanitizeLineEndingsAndSpaces(text: string): SanitizeLineResult {
    if (!text || typeof text !== "string") return {result: text ?? "", fixedCount: 0};

    let count = 0;
    let cur = text.replace(/\u00a0/g, () => {
        count++;
        return " ";
    });

    const lines = cur.replace(/\r\n?/g, "\n").split("\n");
    const processed = lines.map((line) => {
        const trimmed = line.trimEnd();
        if (trimmed.length < line.length) {
            count++;
            return trimmed;
        }
        return line;
    });

    return {
        result: processed.join("\n"),
        fixedCount: count,
    };
}

export type IdentifierCaseStyle = "camel" | "pascal" | "snake" | "constant" | "kebab";

/**
 * 变量与标识符命名法智能互转与规整引擎 (convertIdentifierNamingStyle)
 */
export function convertIdentifierNamingStyle(
    text: string,
    targetStyle: IdentifierCaseStyle = "camel",
    options: {preserveAffixes?: boolean} = {},
): string {
    if (!text || typeof text !== "string") return text ?? "";
    const lines = text.split("\n");

    const transformSingle = (token: string): string => {
        if (!token.trim()) return token;
        let prefix = "";
        let suffix = "";
        let core = token;

        if (options.preserveAffixes !== false) {
            const leadingMatch = core.match(/^([_$-]+)/);
            if (leadingMatch) {
                prefix = leadingMatch[1]!;
                core = core.slice(prefix.length);
            }
            const trailingMatch = core.match(/([_$-]+)$/);
            if (trailingMatch) {
                suffix = trailingMatch[1]!;
                core = core.slice(0, -suffix.length);
            }
        }

        if (!core) return token;

        const words = core
            .replace(/[-_]+/g, " ")
            .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
            .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
            .split(/\s+/)
            .filter(Boolean);

        if (words.length === 0) return token;

        let result = "";
        switch (targetStyle) {
            case "snake":
                result = words.map((w) => w.toLowerCase()).join("_");
                break;
            case "constant":
                result = words.map((w) => w.toUpperCase()).join("_");
                break;
            case "kebab":
                result = words.map((w) => w.toLowerCase()).join("-");
                break;
            case "pascal":
                result = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("");
                break;
            case "camel":
            default:
                result = words.map((w, idx) => {
                    const lower = w.toLowerCase();
                    if (idx === 0) return lower;
                    return lower.charAt(0).toUpperCase() + lower.slice(1);
                }).join("");
                break;
        }

        return prefix + result + suffix;
    };

    return lines.map((line) => {
        const indentMatch = line.match(/^(\s*)(.*)$/);
        if (!indentMatch) return transformSingle(line);
        const [, indent, rest] = indentMatch;
        if (!rest) return line;
        return indent! + transformSingle(rest!);
    }).join("\n");
}

export interface NumericSequenceOptions {
    step?: number;
    delimiter?: string;
    padWidth?: number;
    padChar?: string;
    prefix?: string;
    suffix?: string;
    limit?: number;
}

/**
 * 数字区间序列快速生成引擎 (generateNumericSequence)
 */
export function generateNumericSequence(
    start: number,
    end: number,
    options: NumericSequenceOptions = {},
): string {
    const s = Math.trunc(start);
    const e = Math.trunc(end);
    let step = options.step !== undefined ? Math.trunc(options.step) : (s <= e ? 1 : -1);
    if (step === 0) step = s <= e ? 1 : -1;
    if ((s < e && step < 0) || (s > e && step > 0)) {
        step = -step;
    }

    const delimiter = options.delimiter !== undefined ? options.delimiter : ", ";
    const padWidth = Math.min(1000, Math.max(0, options.padWidth || 0));
    const padChar = options.padChar && options.padChar.length > 0 ? options.padChar.charAt(0) : "0";
    const prefix = options.prefix || "";
    const suffix = options.suffix || "";
    const limit = Math.min(Math.max(1, options.limit || 500), 2000);

    const items: string[] = [];
    let cur = s;
    let count = 0;

    if (step > 0) {
        while (cur <= e && count < limit) {
            let numStr = String(cur);
            if (padWidth > 0 && numStr.length < padWidth) {
                numStr = padChar.repeat(padWidth - numStr.length) + numStr;
            }
            items.push(prefix + numStr + suffix);
            cur += step;
            count++;
        }
    } else {
        while (cur >= e && count < limit) {
            let numStr = String(cur);
            if (padWidth > 0 && numStr.length < padWidth) {
                numStr = padChar.repeat(padWidth - numStr.length) + numStr;
            }
            items.push(prefix + numStr + suffix);
            cur += step;
            count++;
        }
    }

    return items.join(delimiter);
}

/**
 * Markdown 表格转 CSV / TSV 格式数据导出转换引擎 (markdownTableToDelimited)
 */
export function markdownTableToDelimited(
    markdownTable: string,
    format: "csv" | "tsv" = "csv",
): string {
    if (!markdownTable || typeof markdownTable !== "string") return markdownTable ?? "";
    const lines = markdownTable.split("\n");
    const resultRows: string[] = [];
    const isTsv = format === "tsv";

    const escapeCsvCell = (val: string): string => {
        let cell = val.trim();
        cell = cell.replace(/\\\|/g, "|");
        if (isTsv) {
            return cell.replace(/\t/g, " ");
        }
        if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
            return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
    };

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith("|") && !line.includes("|")) continue;

        // 跳过分隔线行（如 | --- | :---: | ---: |）
        if (/^\|?\s*[-:]+\s*\|/.test(line) && /^[\s|:-]+$/.test(line)) {
            continue;
        }

        let content = line;
        if (content.startsWith("|")) content = content.slice(1);
        if (content.endsWith("|")) content = content.slice(0, -1);

        const cells = content.split(/(?<!\\)\|/).map(escapeCsvCell);
        if (cells.length > 0) {
            resultRows.push(cells.join(isTsv ? "\t" : ","));
        }
    }

    if (resultRows.length === 0) return markdownTable;
    return resultRows.join("\n");
}

export interface ConvertListOptions {
    bulletChar?: "-" | "*" | "+";
    startNumber?: number;
}

/**
 * Markdown 无序列表与有序列表双向批量互转引擎 (convertListStyle)
 */
export function convertListStyle(
    text: string,
    targetStyle: "ordered" | "unordered",
    options: ConvertListOptions = {},
): string {
    if (!text || typeof text !== "string") return text ?? "";
    const lines = text.split("\n");
    const bullet = options.bulletChar || "-";
    const startNum = options.startNumber !== undefined ? Math.max(0, options.startNumber) : 1;

    const counters = new Map<number, number>();

    return lines.map((line) => {
        const unorderedMatch = line.match(/^(\s*)([-*+])(\s+.*)$/);
        const orderedMatch = line.match(/^(\s*)(\d+)[.)](\s+.*)$/);

        if (targetStyle === "ordered") {
            if (unorderedMatch) {
                const [, indent, , rest] = unorderedMatch;
                const indentLen = indent!.length;

                for (const k of Array.from(counters.keys())) {
                    if (k > indentLen) counters.delete(k);
                }

                const currentCount = (counters.get(indentLen) ?? (startNum - 1)) + 1;
                counters.set(indentLen, currentCount);

                return `${indent}${currentCount}.${rest}`;
            }
        } else if (targetStyle === "unordered") {
            if (orderedMatch) {
                const [, indent, , rest] = orderedMatch;
                return `${indent}${bullet}${rest}`;
            }
        }

        return line;
    }).join("\n");
}

/**
 * 字符串轻量级高散列指纹生成引擎 (generateShortHash)
 * 基于 64 位双轮 FNV-1a 算法，输出短小且分布均匀的十六进制指纹
 */
export function generateShortHash(text: string, length = 8): string {
    if (text === undefined || text === null) return "";
    const str = String(text);
    const targetLen = Math.min(Math.max(4, length), 32);

    let h1 = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
        h1 ^= str.charCodeAt(i);
        h1 = Math.imul(h1, 16777619) >>> 0;
    }

    let h2 = 1000000007 >>> 0;
    for (let i = str.length - 1; i >= 0; i--) {
        h2 ^= str.charCodeAt(i);
        h2 = Math.imul(h2, 2246822519) >>> 0;
    }

    const hex1 = h1.toString(16).padStart(8, "0");
    const hex2 = h2.toString(16).padStart(8, "0");
    const full = (hex1 + hex2).toLowerCase();

    if (targetLen <= 16) {
        return full.slice(0, targetLen);
    }
    return (full + full).slice(0, targetLen);
}

export interface FilterTaskOptions {
    stripCheckbox?: boolean;
}

/**
 * Markdown 任务待办项状态筛选提取引擎 (filterTaskItems)
 */
export function filterTaskItems(
    text: string,
    status: "pending" | "completed" | "all" = "pending",
    options: FilterTaskOptions = {},
): string {
    if (!text || typeof text !== "string") return text ?? "";
    const lines = text.split("\n");
    const result: string[] = [];
    const strip = options.stripCheckbox === true;

    const taskRegex = /^(\s*(?:[-*+]|\d+[.)]))\s+\[([ xX])\]\s+(.*)$/;

    for (const line of lines) {
        const match = line.match(taskRegex);
        if (!match) continue;

        const [, prefix, state, content] = match;
        const isDone = state!.toLowerCase() === "x";

        if (status === "pending" && isDone) continue;
        if (status === "completed" && !isDone) continue;

        if (strip) {
            result.push(`${prefix} ${content}`);
        } else {
            result.push(line);
        }
    }

    return result.join("\n");
}

export interface FilterAffixOptions {
    caseSensitive?: boolean;
    invert?: boolean;
    trimBeforeCheck?: boolean;
}

/**
 * 文本行按指定前缀/后缀模式精准过滤引擎 (filterLinesByAffix)
 */
export function filterLinesByAffix(
    text: string,
    affix: string,
    type: "prefix" | "suffix" = "prefix",
    options: FilterAffixOptions = {},
): string {
    if (!text || typeof text !== "string") return text ?? "";
    if (!affix) return text;

    const lines = text.split("\n");
    const caseSensitive = options.caseSensitive !== false;
    const invert = options.invert === true;
    const trim = options.trimBeforeCheck !== false;
    const targetAffix = caseSensitive ? affix : affix.toLowerCase();

    const matches = (line: string): boolean => {
        const inspected = trim ? (type === "prefix" ? line.trimStart() : line.trimEnd()) : line;
        const comp = caseSensitive ? inspected : inspected.toLowerCase();
        return type === "prefix" ? comp.startsWith(targetAffix) : comp.endsWith(targetAffix);
    };

    return lines.filter((line) => {
        const m = matches(line);
        return invert ? !m : m;
    }).join("\n");
}

export type ColorTone = "any" | "vibrant" | "pastel" | "dark" | "light";

/**
 * 随机颜色值生成引擎 (generateRandomColor)
 */
export function generateRandomColor(
    format: "hex" | "rgb" | "hsl" = "hex",
    options: {tone?: ColorTone} = {},
): string {
    const tone = options.tone || "any";
    let h = Math.floor(Math.random() * 360);
    let s = 80;
    let l = 50;

    switch (tone) {
        case "vibrant":
            s = 85 + Math.floor(Math.random() * 15);
            l = 45 + Math.floor(Math.random() * 15);
            break;
        case "pastel":
            s = 65 + Math.floor(Math.random() * 20);
            l = 80 + Math.floor(Math.random() * 12);
            break;
        case "dark":
            s = 50 + Math.floor(Math.random() * 40);
            l = 15 + Math.floor(Math.random() * 20);
            break;
        case "light":
            s = 40 + Math.floor(Math.random() * 40);
            l = 85 + Math.floor(Math.random() * 10);
            break;
        case "any":
        default:
            s = Math.floor(Math.random() * 101);
            l = Math.floor(Math.random() * 101);
            break;
    }

    if (format === "hsl") {
        return `hsl(${h}, ${s}%, ${l}%)`;
    }

    const sDec = s / 100;
    const lDec = l / 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = sDec * Math.min(lDec, 1 - lDec);
    const f = (n: number) => lDec - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

    const r = Math.round(f(0) * 255);
    const g = Math.round(f(8) * 255);
    const b = Math.round(f(4) * 255);

    if (format === "rgb") {
        return `rgb(${r}, ${g}, ${b})`;
    }

    const toHex = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export interface RenumberListOptions {
    startNumber?: number;
    style?: "dot" | "parenthesis";
}

/**
 * Markdown 有序列表编号自动重排重整引擎 (renumberOrderedList)
 */
export function renumberOrderedList(
    text: string,
    options: RenumberListOptions = {},
): string {
    if (!text || typeof text !== "string") return text ?? "";
    const lines = text.split("\n");
    const startNum = options.startNumber !== undefined ? Math.max(0, options.startNumber) : 1;
    const delim = options.style === "parenthesis" ? ")" : ".";

    const counters = new Map<number, number>();

    return lines.map((line) => {
        const match = line.match(/^(\s*)(\d+)[.)](\s+.*)$/);
        if (!match) {
            if (line.trim().length > 0 && !line.match(/^\s*[-*+]\s+/)) {
                counters.clear();
            }
            return line;
        }

        const [, indent, , rest] = match;
        const indentLen = indent!.length;

        for (const k of Array.from(counters.keys())) {
            if (k > indentLen) counters.delete(k);
        }

        const count = (counters.get(indentLen) ?? (startNum - 1)) + 1;
        counters.set(indentLen, count);

        return `${indent}${count}${delim}${rest}`;
    }).join("\n");
}

export type LinkConvertMode = "strip" | "text_and_url" | "bare_url" | "auto_markdown";

/**
 * Markdown 超链接批量转换与提取引擎 (convertMarkdownLinks)
 */
export function convertMarkdownLinks(
    text: string,
    mode: LinkConvertMode = "strip",
): string {
    if (!text || typeof text !== "string") return text ?? "";

    if (mode === "auto_markdown") {
        return text.replace(/(?<!\[[^\]]*)(https?:\/\/[^\s<>)\]]+)/g, "[$1]($1)");
    }

    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, title, url) => {
        if (mode === "strip") return title;
        if (mode === "text_and_url") return `${title} (${url})`;
        if (mode === "bare_url") return url;
        return match;
    });
}

/**
 * 文本字符与 UTF-8 字节长度安全截断引擎 (truncateByBytes)
 * 严格按照 UTF-8 编码边界安全截断，彻底避免多字节乱码
 */
export function truncateByBytes(
    text: string,
    maxBytes = 255,
    options: {ellipsis?: boolean} = {},
): string {
    if (!text || typeof text !== "string") return text ?? "";
    const limit = Math.max(1, maxBytes);
    const ellipsis = options.ellipsis === true;
    const ellipsisBytes = ellipsis && limit > 3 ? 3 : 0;
    const targetBytes = limit - ellipsisBytes;

    const codePointByteLen = (codePoint: number): number => {
        if (codePoint <= 0x7f) return 1;
        if (codePoint <= 0x7ff) return 2;
        if (codePoint <= 0xffff) return 3;
        return 4;
    };

    let totalBytes = 0;
    const chars = Array.from(text);
    for (const ch of chars) {
        totalBytes += codePointByteLen(ch.codePointAt(0)!);
    }

    if (totalBytes <= limit) return text;

    let curBytes = 0;
    let result = "";
    for (const ch of chars) {
        const b = codePointByteLen(ch.codePointAt(0)!);
        if (curBytes + b > targetBytes) break;
        curBytes += b;
        result += ch;
    }

    return ellipsis && ellipsisBytes > 0 ? result + "..." : result;
}

/**
 * 中英混排标点间距与中英空隙智能规整引擎 (formatPunctuationSpacing)
 */
export function formatPunctuationSpacing(text: string): string {
    if (!text || typeof text !== "string") return text ?? "";

    let cur = text;

    cur = cur.replace(/([\u4e00-\u9fa5])\s+([，。！？；：、“”‘’《》（）【】])/g, "$1$2");
    cur = cur.replace(/([，。！？；：、“”‘’《》（）【】])\s+([\u4e00-\u9fa5])/g, "$1$2");

    cur = cur.replace(/([a-zA-Z0-9])([,;:?!])([a-zA-Z])/g, "$1$2 $3");
    cur = cur.replace(/\s+([,;:?!])/g, "$1");

    return cur;
}

export interface TableToKvOptions {
    keyColumn?: number;
    valueColumn?: number;
    format?: "yaml" | "properties" | "json";
}

/**
 * Markdown 表格转键值对与 YAML 格式导出转换引擎 (markdownTableToKeyValue)
 */
export function markdownTableToKeyValue(
    tableMarkdown: string,
    options: TableToKvOptions = {},
): string {
    if (!tableMarkdown || typeof tableMarkdown !== "string") return tableMarkdown ?? "";
    const lines = tableMarkdown.split("\n");
    const keyCol = options.keyColumn !== undefined ? Math.max(0, options.keyColumn) : 0;
    const valCol = options.valueColumn !== undefined ? Math.max(0, options.valueColumn) : 1;
    const fmt = options.format || "yaml";

    const pairs: Array<{key: string; value: string}> = [];
    let isHeader = true;

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.includes("|")) continue;

        if (/^\|?\s*[-:]+\s*\|/.test(line) && /^[\s|:-]+$/.test(line)) {
            isHeader = false;
            continue;
        }

        let content = line;
        if (content.startsWith("|")) content = content.slice(1);
        if (content.endsWith("|")) content = content.slice(0, -1);

        const cells = content.split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, "|"));
        if (isHeader) {
            continue;
        }

        const k = cells[keyCol] ?? "";
        const v = cells[valCol] ?? "";
        if (k) {
            pairs.push({key: k, value: v});
        }
    }

    if (pairs.length === 0) return tableMarkdown;

    if (fmt === "json") {
        const obj: Record<string, string> = {};
        for (const p of pairs) obj[p.key] = p.value;
        return JSON.stringify(obj, null, 2);
    }

    if (fmt === "properties") {
        return pairs.map((p) => `${p.key}=${p.value}`).join("\n");
    }

    return pairs.map((p) => {
        let v = p.value;
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
            return `${p.key}: ${v}`;
        }
        if (v.includes("\n") || v.includes(":") || v.includes("#")) {
            v = JSON.stringify(v);
        }
        return `${p.key}: ${v}`;
    }).join("\n");
}

export interface PinyinInitialsOptions {
    uppercase?: boolean;
    separator?: string;
}

/**
 * 汉字转拼音首字母缩写提取引擎 (extractChinesePinyinInitials)
 * 支持中英文混排，汉字转拼音首字母，英文保留词首字母
 * 如 "思源笔记" -> "SYBJ", "小驴常用" -> "XLCY", "Vue 框架" -> "VKJ"
 */
export function extractChinesePinyinInitials(
    text: string,
    options: PinyinInitialsOptions = {},
): string {
    if (!text || typeof text !== "string") return "";
    const uppercase = options.uppercase !== false;
    const sep = options.separator || "";

    const pinyinList = extractCharPinyins(text, 200, {cjkOnly: false});
    const initials: string[] = [];

    let i = 0;
    while (i < pinyinList.length) {
        const item = pinyinList[i]!;
        const code = item.char.codePointAt(0) ?? 0;
        const isCjk = code >= 0x4e00 && code <= 0x9fff;

        if (isCjk) {
            const init = item.initial || item.char;
            initials.push(uppercase ? init.toUpperCase() : init.toLowerCase());
            i++;
        } else if (/[a-zA-Z0-9]/.test(item.char)) {
            const first = item.char;
            initials.push(uppercase ? first.toUpperCase() : first.toLowerCase());
            i++;
            while (i < pinyinList.length && /[a-zA-Z0-9]/.test(pinyinList[i]!.char)) {
                i++;
            }
        } else {
            i++;
        }
    }

    return initials.join(sep);
}

/**
 * 多行文本空行严格归一化压缩引擎 (normalizeBlankLinesStrict)
 * 清除空白字符构成的假空行，将多余连续空行压缩为最多 N 个（默认 1），并修剪首尾空行
 */
export function normalizeBlankLinesStrict(
    text: string,
    maxConsecutive = 1,
): {result: string; cleanedLines: number} {
    if (!text || typeof text !== "string") return {result: text ?? "", cleanedLines: 0};

    const maxEmpty = Math.max(0, maxConsecutive);
    const rawLines = text.split(/\r\n?|\n/);
    const cleanedLines: string[] = [];
    let consecutiveEmpty = 0;
    let strippedCount = 0;

    for (const rawLine of rawLines) {
        const isBlank = rawLine.trim().length === 0;
        if (isBlank) {
            consecutiveEmpty++;
            if (consecutiveEmpty <= maxEmpty) {
                cleanedLines.push("");
            } else {
                strippedCount++;
            }
        } else {
            consecutiveEmpty = 0;
            cleanedLines.push(rawLine);
        }
    }

    while (cleanedLines.length > 0 && cleanedLines[0] === "") {
        cleanedLines.shift();
        strippedCount++;
    }
    while (cleanedLines.length > 0 && cleanedLines[cleanedLines.length - 1] === "") {
        cleanedLines.pop();
        strippedCount++;
    }

    return {
        result: cleanedLines.join("\n"),
        cleanedLines: strippedCount,
    };
}

export interface KeyValueToTableOptions {
    keyHeader?: string;
    valueHeader?: string;
    delimiter?: string;
}

/**
 * 键值对文本或 JSON 转 Markdown 表格转换引擎 (keyValueToMarkdownTable)
 */
export function keyValueToMarkdownTable(
    text: string,
    options: KeyValueToTableOptions = {},
): string {
    if (!text || typeof text !== "string") return text ?? "";
    const clean = text.trim();
    const keyH = options.keyHeader || "键名";
    const valH = options.valueHeader || "取值";

    const rows: Array<{key: string; val: string}> = [];

    if ((clean.startsWith("{") && clean.endsWith("}")) || (clean.startsWith("[") && clean.endsWith("]"))) {
        try {
            const parsed = JSON.parse(clean);
            if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
                for (const [k, v] of Object.entries(parsed)) {
                    rows.push({
                        key: String(k).replace(/\|/g, "\\|"),
                        val: typeof v === "object" ? JSON.stringify(v).replace(/\|/g, "\\|") : String(v).replace(/\|/g, "\\|"),
                    });
                }
            }
        } catch {
            // 继续尝试普通键值对行解析
        }
    }

    if (rows.length === 0) {
        const lines = clean.split("\n");
        const customDelim = options.delimiter;

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//")) continue;

            let k = "";
            let v = "";

            if (customDelim && trimmed.includes(customDelim)) {
                const idx = trimmed.indexOf(customDelim);
                k = trimmed.slice(0, idx).trim();
                v = trimmed.slice(idx + customDelim.length).trim();
            } else {
                const delimMatch = trimmed.match(/^([^:=->]+)\s*([:=]|->)\s*(.*)$/);
                if (delimMatch) {
                    k = delimMatch[1]!.trim();
                    v = delimMatch[3]!.trim();
                }
            }

            if (k) {
                if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
                    v = v.slice(1, -1);
                }
                rows.push({
                    key: k.replace(/\|/g, "\\|"),
                    val: v.replace(/\|/g, "\\|"),
                });
            }
        }
    }

    if (rows.length === 0) return text;

    const headerLine = `| ${keyH} | ${valH} |`;
    const sepLine = "| :--- | :--- |";
    const bodyLines = rows.map((r) => `| ${r.key} | ${r.val} |`);

    return [headerLine, sepLine, ...bodyLines].join("\n");
}

export interface MarkdownTocOptions {
    minLevel?: number;
    maxLevel?: number;
    style?: "unordered" | "ordered";
}

/**
 * Markdown 文本各级标题大纲目录（TOC）纯函数提取引擎 (generateMarkdownToc)
 */
export function generateMarkdownToc(
    text: string,
    options: MarkdownTocOptions = {},
): string {
    if (!text || typeof text !== "string") return "";
    const lines = text.split("\n");
    const minLvl = options.minLevel !== undefined ? Math.max(1, Math.min(6, options.minLevel)) : 1;
    const maxLvl = options.maxLevel !== undefined ? Math.max(minLvl, Math.min(6, options.maxLevel)) : 6;
    const isOrdered = options.style === "ordered";

    const tocItems: string[] = [];
    let inCodeBlock = false;

    for (const line of lines) {
        if (/^```/.test(line.trim())) {
            inCodeBlock = !inCodeBlock;
            continue;
        }
        if (inCodeBlock) continue;

        const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
        if (!headingMatch) continue;

        const level = headingMatch[1]!.length;
        if (level < minLvl || level > maxLvl) continue;

        const title = headingMatch[2]!.trim().replace(/#+$/, "").trim();
        if (!title) continue;

        const slug = title
            .toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5-]+/g, "-")
            .replace(/^-+|-+$/g, "");

        const indentSpaces = "  ".repeat(level - minLvl);
        const bullet = isOrdered ? "1. " : "- ";
        tocItems.push(`${indentSpaces}${bullet}[${title}](#${slug})`);
    }

    return tocItems.join("\n");
}

export interface CodeFenceLangOptions {
    overwriteExisting?: boolean;
}

/**
 * Markdown 代码块语言标识批量添加与修改引擎 (setMarkdownCodeFenceLang)
 */
export function setMarkdownCodeFenceLang(
    text: string,
    language: string,
    options: CodeFenceLangOptions = {},
): string {
    if (!text || typeof text !== "string") return text ?? "";
    const cleanLang = (language || "").trim().toLowerCase();
    const overwrite = options.overwriteExisting === true;
    const lines = text.split("\n");

    let inCode = false;

    return lines.map((line) => {
        const fenceMatch = line.match(/^(\s*)(`{3,}|~{3,})(.*)$/);
        if (!fenceMatch) return line;

        const [, indent, fenceChars, infoString] = fenceMatch;
        const trimmedInfo = infoString!.trim();

        if (!inCode) {
            inCode = true;
            if (!trimmedInfo) {
                return `${indent}${fenceChars}${cleanLang}`;
            }
            if (overwrite && cleanLang) {
                return `${indent}${fenceChars}${cleanLang}`;
            }
            return line;
        } else {
            inCode = false;
            return line;
        }
    }).join("\n");
}

/**
 * 占位符宏参数安全转义与反转义引擎 (escapeMacroPipe)
 */
export function escapeMacroPipe(
    text: string,
    mode: "escape" | "unescape" = "escape",
): string {
    if (!text || typeof text !== "string") return text ?? "";
    if (mode === "unescape") {
        return text
            .replace(/\\\|/g, "|")
            .replace(/&#124;/g, "|")
            .replace(/%7C/gi, "|");
    }
    return text.replace(/\|/g, "\\|");
}

export interface GridColumnsOptions {
    columnGap?: number;
    skipEmptyLines?: boolean;
}

/**
 * 多行文本基于列宽网格化（多列分栏排版）转换引擎 (formatTextColumnsGrid)
 */
export function formatTextColumnsGrid(
    text: string,
    columns = 3,
    options: GridColumnsOptions = {},
): string {
    if (!text || typeof text !== "string") return text ?? "";
    const colCount = Math.max(1, Math.min(10, columns));
    const gap = Math.max(1, options.columnGap !== undefined ? options.columnGap : 2);
    const skipEmpty = options.skipEmptyLines !== false;

    let items = text.split("\n").map((l) => l.trimEnd());
    if (skipEmpty) {
        items = items.filter((l) => l.trim().length > 0);
    }
    if (items.length === 0) return "";

    const getCharWidth = (ch: string) => {
        const code = ch.charCodeAt(0);
        return (code >= 0x4e00 && code <= 0x9fa5) || code > 0xff ? 2 : 1;
    };

    const getStrWidth = (s: string) => {
        let w = 0;
        for (const c of s) w += getCharWidth(c);
        return w;
    };

    const grid: string[][] = [];
    for (let i = 0; i < items.length; i += colCount) {
        grid.push(items.slice(i, i + colCount));
    }

    const colWidths: number[] = new Array(colCount).fill(0);
    for (const row of grid) {
        for (let col = 0; col < row.length; col++) {
            const w = getStrWidth(row[col]!);
            if (w > colWidths[col]!) {
                colWidths[col] = w;
            }
        }
    }

    const resultRows: string[] = [];
    for (const row of grid) {
        const paddedRow: string[] = [];
        for (let col = 0; col < row.length; col++) {
            const item = row[col]!;
            const itemWidth = getStrWidth(item);
            const targetWidth = colWidths[col]!;
            const isLastCol = col === row.length - 1;

            if (isLastCol) {
                paddedRow.push(item);
            } else {
                const padSpaces = targetWidth - itemWidth + gap;
                paddedRow.push(item + " ".repeat(Math.max(1, padSpaces)));
            }
        }
        resultRows.push(paddedRow.join(""));
    }

    return resultRows.join("\n");
}

export interface SortListOptions {
    descending?: boolean;
    natural?: boolean;
}

/**
 * Markdown 列表项按字母或拼音自然排序引擎 (sortMarkdownList)
 * 支持平级列表排序并携带各自嵌套子列表，有序列表自动重新自增编号
 */
export function sortMarkdownList(
    text: string,
    options: SortListOptions = {},
): string {
    if (!text || typeof text !== "string") return text ?? "";
    const lines = text.split("\n");
    if (lines.length <= 1) return text;

    interface ListItemBlock {
        indent: string;
        marker: string;
        content: string;
        rawHead: string;
        children: string[];
    }

    const blocks: ListItemBlock[] = [];
    const itemRegex = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;

    for (const line of lines) {
        const match = line.match(itemRegex);
        if (match) {
            const [, indent, marker, content] = match;
            if (blocks.length === 0 || indent!.length <= blocks[0]!.indent.length) {
                blocks.push({
                    indent: indent!,
                    marker: marker!,
                    content: content!.trim(),
                    rawHead: line,
                    children: [],
                });
            } else {
                blocks[blocks.length - 1]!.children.push(line);
            }
        } else {
            if (blocks.length > 0) {
                blocks[blocks.length - 1]!.children.push(line);
            }
        }
    }

    if (blocks.length === 0) return text;

    const desc = options.descending === true;
    const collator = new Intl.Collator("zh-CN", {numeric: true, sensitivity: "base"});

    blocks.sort((a, b) => {
        const cmp = collator.compare(a.content, b.content);
        return desc ? -cmp : cmp;
    });

    const isOrdered = /^\d+[.)]$/.test(blocks[0]!.marker);
    const delim = blocks[0]!.marker.endsWith(")") ? ")" : ".";

    const resultLines: string[] = [];
    for (let idx = 0; idx < blocks.length; idx++) {
        const block = blocks[idx]!;
        if (isOrdered) {
            resultLines.push(`${block.indent}${idx + 1}${delim} ${block.content}`);
        } else {
            resultLines.push(`${block.indent}${block.marker} ${block.content}`);
        }
        if (block.children.length > 0) {
            const childText = block.children.join("\n");
            resultLines.push(sortMarkdownList(childText, options));
        }
    }

    return resultLines.join("\n");
}

export interface RepeatTextOptions {
    delimiter?: string;
    maxTotalLength?: number;
}

/**
 * 字符与文本序列重复生成引擎 (repeatText)
 */
export function repeatText(
    text: string,
    count = 1,
    options: RepeatTextOptions = {},
): string {
    if (text === undefined || text === null) return "";
    const str = String(text);
    const times = Math.max(0, Math.min(500, Math.trunc(count)));
    if (times === 0) return "";
    const delim = options.delimiter !== undefined ? options.delimiter : "";
    const maxLen = Math.min(2000, options.maxTotalLength || 2000);

    const parts: string[] = [];
    let currentLen = 0;

    for (let i = 0; i < times; i++) {
        const addLen = str.length + (i > 0 ? delim.length : 0);
        if (currentLen + addLen > maxLen) {
            break;
        }
        parts.push(str);
        currentLen += addLen;
    }

    return parts.join(delim);
}

export interface SortByVisualWidthOptions {
    descending?: boolean;
    trimBeforeMeasure?: boolean;
}

/**
 * 文本行视觉宽度智能排序引擎 (sortLinesByVisualWidth)
 * 支持精准计算 CJK 中文字符双倍字宽，按视觉宽度升序或降序排列
 */
export function sortLinesByVisualWidth(
    text: string,
    options: SortByVisualWidthOptions = {},
): string {
    if (!text || typeof text !== "string") return text ?? "";
    const lines = text.split("\n");
    if (lines.length <= 1) return text;

    const desc = options.descending === true;
    const trim = options.trimBeforeMeasure !== false;

    const getCharWidth = (ch: string) => {
        const code = ch.charCodeAt(0);
        return (code >= 0x4e00 && code <= 0x9fa5) || code > 0xff ? 2 : 1;
    };

    const getLineWidth = (line: string): number => {
        const str = trim ? line.trim() : line;
        let w = 0;
        for (const c of str) w += getCharWidth(c);
        return w;
    };

    const mapped = lines.map((line, idx) => ({
        line,
        width: getLineWidth(line),
        originalIndex: idx,
    }));

    mapped.sort((a, b) => {
        if (a.width !== b.width) {
            return desc ? b.width - a.width : a.width - b.width;
        }
        return a.originalIndex - b.originalIndex;
    });

    return mapped.map((m) => m.line).join("\n");
}

export type TaskInvertMode = "invert" | "check_all" | "uncheck_all";

/**
 * Markdown 任务复选框状态智能反转引擎 (invertTaskStatus)
 */
export function invertTaskStatus(
    text: string,
    mode: TaskInvertMode = "invert",
): string {
    if (!text || typeof text !== "string") return text ?? "";
    const lines = text.split("\n");
    const taskRegex = /^(\s*(?:[-*+]|\d+[.)]))\s+\[([ xX])\](\s+.*)$/;

    return lines.map((line) => {
        const match = line.match(taskRegex);
        if (!match) return line;

        const [, prefix, state, rest] = match;
        const isDone = state!.toLowerCase() === "x";

        let nextState = " ";
        if (mode === "check_all") {
            nextState = "x";
        } else if (mode === "uncheck_all") {
            nextState = " ";
        } else {
            nextState = isDone ? " " : "x";
        }

        return `${prefix} [${nextState}]${rest}`;
    }).join("\n");
}

export interface CenterTextOptions {
    padChar?: string;
    clipIfExceed?: boolean;
}

/**
 * 纯文本字宽居中对齐与填充引擎 (centerText)
 * 精准支持 CJK 中文字符双倍字宽计算与自定义填充符
 */
export function centerText(
    text: string,
    width = 20,
    options: CenterTextOptions = {},
): string {
    if (text === undefined || text === null) return "";
    const str = String(text);
    const targetWidth = Math.max(1, width);
    const padChar = options.padChar && options.padChar.length > 0 ? options.padChar.charAt(0) : " ";

    const getCharWidth = (ch: string) => {
        const code = ch.charCodeAt(0);
        return (code >= 0x4e00 && code <= 0x9fa5) || code > 0xff ? 2 : 1;
    };

    const getStrWidth = (s: string) => {
        let w = 0;
        for (const c of s) w += getCharWidth(c);
        return w;
    };

    const curWidth = getStrWidth(str);
    if (curWidth >= targetWidth) {
        return str;
    }

    const diff = targetWidth - curWidth;
    const leftPad = Math.floor(diff / 2);
    const rightPad = diff - leftPad;

    return padChar.repeat(leftPad) + str + padChar.repeat(rightPad);
}

export interface ConvertDelimiterOptions {
    sourceDelimiter?: string;
    trimItems?: boolean;
}

/**
 * 列表分隔符智能嗅探与批量互转引擎 (convertListDelimiter)
 */
export function convertListDelimiter(
    text: string,
    targetDelimiter = "\n",
    options: ConvertDelimiterOptions = {},
): string {
    if (!text || typeof text !== "string") return text ?? "";
    const trim = options.trimItems !== false;

    let srcDelim = options.sourceDelimiter;
    if (!srcDelim) {
        const commaCount = (text.match(/,/g) || []).length;
        const zhCommaCount = (text.match(/，/g) || []).length;
        const semicolonCount = (text.match(/;/g) || []).length;
        const zhSemicolonCount = (text.match(/；/g) || []).length;
        const pipeCount = (text.match(/\|/g) || []).length;
        const newlineCount = (text.match(/\n/g) || []).length;

        const counts = [
            {delim: "\n", c: newlineCount},
            {delim: ",", c: commaCount},
            {delim: "，", c: zhCommaCount},
            {delim: ";", c: semicolonCount},
            {delim: "；", c: zhSemicolonCount},
            {delim: "|", c: pipeCount},
        ];

        counts.sort((a, b) => b.c - a.c);
        srcDelim = counts[0]!.c > 0 ? counts[0]!.delim : "\n";
    }

    const items = text.split(srcDelim);
    const processed = items.map((item) => trim ? item.trim() : item).filter((item) => item.length > 0);

    return processed.join(targetDelimiter);
}

/**
 * Markdown 脚注编号重整与底端归集引擎 (normalizeMarkdownFootnotes)
 */
export function normalizeMarkdownFootnotes(text: string): string {
    if (!text || typeof text !== "string") return text ?? "";
    if (!text.includes("[^")) return text;

    const lines = text.split("\n");
    const defMap = new Map<string, string>();
    const bodyLines: string[] = [];

    const defRegex = /^\[\^([^\]]+)\]:\s*(.*)$/;
    for (const line of lines) {
        const match = line.match(defRegex);
        if (match) {
            const [, id, content] = match;
            defMap.set(id!.trim(), content!.trim());
        } else {
            bodyLines.push(line);
        }
    }

    if (defMap.size === 0 && !/\[\^([^\]]+)\]/.test(text)) return text;

    let body = bodyLines.join("\n").trimEnd();
    const idMap = new Map<string, number>();
    let counter = 1;

    const refRegex = /\[\^([^\]]+)\](?!\:)/g;
    body = body.replace(refRegex, (_, id: string) => {
        const trimmedId = id.trim();
        let newNum = idMap.get(trimmedId);
        if (!newNum) {
            newNum = counter++;
            idMap.set(trimmedId, newNum);
        }
        return `[^${newNum}]`;
    });

    const defOutput: string[] = [];
    const emittedOldIds = new Set<string>();

    for (const [oldId, newNum] of Array.from(idMap.entries())) {
        emittedOldIds.add(oldId);
        const content = defMap.get(oldId) || "";
        defOutput.push(`[^${newNum}]: ${content}`);
    }

    for (const [oldId, content] of Array.from(defMap.entries())) {
        if (!emittedOldIds.has(oldId)) {
            const newNum = counter++;
            defOutput.push(`[^${newNum}]: ${content}`);
        }
    }

    if (defOutput.length === 0) return body;
    return `${body}\n\n${defOutput.join("\n")}`;
}

/**
 * 字符串反斜杠安全转义与还原引擎 (escapeBackslash)
 */
export function escapeBackslash(
    text: string,
    mode: "escape" | "unescape" = "escape",
): string {
    if (!text || typeof text !== "string") return text ?? "";
    if (mode === "unescape") {
        return text
            .replace(/\\\\/g, "\\")
            .replace(/\\n/g, "\n")
            .replace(/\\r/g, "\r")
            .replace(/\\t/g, "\t")
            .replace(/\\"/g, '"');
    }
    return text
        .replace(/\\/g, "\\\\")
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t")
        .replace(/"/g, '\\"');
}

export interface ChunkLinesOptions {
    titlePrefix?: string;
}

/**
 * 多行文本按标记分块归集引擎 (chunkLinesByDelimiter)
 */
export function chunkLinesByDelimiter(
    text: string,
    delimiterPattern = "^---+$|^===+$",
    options: ChunkLinesOptions = {},
): string {
    if (!text || typeof text !== "string") return text ?? "";
    const lines = text.split("\n");
    const prefix = options.titlePrefix || "### 分段";

    let regex: RegExp;
    try {
        regex = new RegExp(delimiterPattern);
    } catch {
        regex = /^---+$|^===+$/;
    }

    const chunks: string[] = [];
    let currentChunk: string[] = [];

    for (const line of lines) {
        if (regex.test(line.trim())) {
            if (currentChunk.length > 0) {
                const chunkContent = currentChunk.join("\n").trim();
                if (chunkContent) chunks.push(chunkContent);
                currentChunk = [];
            }
        } else {
            currentChunk.push(line);
        }
    }

    if (currentChunk.length > 0) {
        const chunkContent = currentChunk.join("\n").trim();
        if (chunkContent) chunks.push(chunkContent);
    }

    if (chunks.length <= 1) return text;

    return chunks.map((c, idx) => `${prefix} ${idx + 1}\n${c}`).join("\n\n");
}

export type FlattenQuoteMode = "strip" | "single_level";

/**
 * Markdown 引用块扁平化与剥离引擎 (flattenMarkdownBlockquotes)
 */
export function flattenMarkdownBlockquotes(
    text: string,
    mode: FlattenQuoteMode = "strip",
): string {
    if (!text || typeof text !== "string") return text ?? "";
    const lines = text.split("\n");

    return lines.map((line) => {
        const match = line.match(/^(\s*)(>[\s>]*)(.*)$/);
        if (!match) return line;

        const [, indent, , content] = match;
        const cleanContent = content!.trimStart();

        if (mode === "single_level") {
            return `${indent}> ${cleanContent}`;
        }
        return `${indent}${cleanContent}`;
    }).join("\n");
}

/**
 * 单词级别逆序反转引擎 (reverseWords)
 */
export function reverseWords(
    text: string,
    options: {preserveLines?: boolean} = {},
): string {
    if (!text || typeof text !== "string") return text ?? "";
    const preserveLines = options.preserveLines !== false;

    const reverseLineWords = (line: string): string => {
        if (!line.trim()) return line;
        const indentMatch = line.match(/^(\s*)(.*)$/);
        const indent = indentMatch ? indentMatch[1]! : "";
        const rest = indentMatch ? indentMatch[2]! : line;

        const words = rest.split(/\s+/).filter(Boolean);
        words.reverse();
        return indent + words.join(" ");
    };

    if (preserveLines) {
        return text.split("\n").map(reverseLineWords).join("\n");
    }

    const words = text.split(/\s+/).filter(Boolean);
    words.reverse();
    return words.join(" ");
}

/**
 * Markdown 行内样式标记批量剥离引擎 (stripInlineMarkdownFormatting)
 * 剔除 **粗体**、*斜体*、~~删除线~~、==高亮== 及 `行内代码` 标记，保留纯文本内容
 */
export function stripInlineMarkdownFormatting(text: string): string {
    if (!text || typeof text !== "string") return text ?? "";

    let cur = text;

    cur = cur.replace(/(\*\*\*|___)(.*?)\1/g, "$2");
    cur = cur.replace(/(\*\*|__)(.*?)\1/g, "$2");
    cur = cur.replace(/(?<!\w)\*([^*]+)\*(?!\w)/g, "$1");
    cur = cur.replace(/(?<!\w)_([^_]+)_(?!\w)/g, "$1");
    cur = cur.replace(/~~(.*?)~~/g, "$1");
    cur = cur.replace(/==(.*?)==/g, "$1");
    cur = cur.replace(/`([^`]+)`/g, "$1");

    return cur;
}

export interface KpiCardOptions {
    title?: string;
    asBlockquote?: boolean;
}

/**
 * 多行数据转 Markdown KPI 统计汇总卡片引擎 (formatKpiSummaryCard)
 */
export function formatKpiSummaryCard(
    text: string,
    options: KpiCardOptions = {},
): string {
    if (!text || typeof text !== "string") return text ?? "";
    const title = options.title || "📊 核心数据看板";
    const asBq = options.asBlockquote !== false;
    const lines = text.split("\n");

    const items: Array<{label: string; value: string}> = [];

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#") || line.startsWith(">")) continue;

        if (line.includes("|")) {
            if (/^\|?\s*[-:]+\s*\|/.test(line)) continue;
            let content = line;
            if (content.startsWith("|")) content = content.slice(1);
            if (content.endsWith("|")) content = content.slice(0, -1);
            const cells = content.split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, "|"));
            if (cells.length >= 2 && cells[0]) {
                items.push({label: cells[0]!, value: cells[1]!});
            }
            continue;
        }

        const match = line.match(/^([^:=->]+)\s*([:=]|->)\s*(.*)$/);
        if (match) {
            items.push({label: match[1]!.trim(), value: match[3]!.trim()});
        }
    }

    if (items.length === 0) return text;

    const tableLines: string[] = [
        `### ${title}`,
        "",
        "| 指标名称 | 核心数值 |",
        "| :--- | :--- |",
    ];

    for (const item of items) {
        tableLines.push(`| **${item.label}** | \`${item.value}\` |`);
    }

    if (asBq) {
        return tableLines.map((l) => (l.length > 0 ? `> ${l}` : ">")).join("\n");
    }
    return tableLines.join("\n");
}

const ZH_SURNAMES = [
    "李", "王", "张", "刘", "陈", "杨", "赵", "黄", "周", "吴",
    "徐", "孙", "胡", "朱", "高", "林", "何", "郭", "马", "罗",
    "梁", "宋", "郑", "谢", "韩", "唐", "冯", "于", "董", "萧"
];

const ZH_GIVEN_MALE = [
    "伟", "强", "磊", "军", "勇", "杰", "涛", "彬", "刚", "平",
    "峰", "健", "明", "辉", "宇", "浩", "轩", "晨", "瑞", "鹏"
];

const ZH_GIVEN_FEMALE = [
    "娜", "静", "芳", "敏", "娟", "秀", "英", "华", "燕", "婷",
    "丹", "萍", "琳", "莉", "洁", "雅", "琪", "欣", "楠", "萱"
];

const EN_FIRST_NAMES = [
    "James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph",
    "Thomas", "Charles", "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth",
    "Barbara", "Susan", "Jessica", "Sarah", "Karen"
];

const EN_LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson"
];

/**
 * 拟人类随机姓名生成引擎 (generateRandomName)
 */
export function generateRandomName(
    lang: "zh" | "en" = "zh",
    options: {gender?: "any" | "male" | "female"} = {},
): string {
    const gender = options.gender || "any";

    if (lang === "en") {
        const first = EN_FIRST_NAMES[Math.floor(Math.random() * EN_FIRST_NAMES.length)]!;
        const last = EN_LAST_NAMES[Math.floor(Math.random() * EN_LAST_NAMES.length)]!;
        return `${first} ${last}`;
    }

    const surname = ZH_SURNAMES[Math.floor(Math.random() * ZH_SURNAMES.length)]!;
    let givenPool = gender === "male"
        ? ZH_GIVEN_MALE
        : gender === "female"
            ? ZH_GIVEN_FEMALE
            : [...ZH_GIVEN_MALE, ...ZH_GIVEN_FEMALE];

    const isDouble = Math.random() > 0.4;
    const c1 = givenPool[Math.floor(Math.random() * givenPool.length)]!;
    if (isDouble) {
        const c2 = givenPool[Math.floor(Math.random() * givenPool.length)]!;
        return `${surname}${c1}${c2}`;
    }
    return `${surname}${c1}`;
}

export interface GroupAlphabetOptions {
    headingLevel?: number;
}

/**
 * 多行文本基于拼音/字母首字分节大纲引擎 (groupLinesByAlphabet)
 */
export function groupLinesByAlphabet(
    text: string,
    options: GroupAlphabetOptions = {},
): string {
    if (!text || typeof text !== "string") return text ?? "";
    const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length <= 1) return text;

    const level = options.headingLevel !== undefined ? Math.max(1, Math.min(6, options.headingLevel)) : 2;
    const hPrefix = "#".repeat(level);

    const groups = new Map<string, string[]>();

    for (const rawLine of lines) {
        let content = rawLine;
        const listMatch = content.match(/^[-*+]\s+(.*)$|^\d+[.)]\s+(.*)$/);
        if (listMatch) {
            content = (listMatch[1] || listMatch[2] || "").trim();
        }
        if (!content) continue;

        const pinyins = extractCharPinyins(content, 1, {cjkOnly: false});
        let initial = "#";
        if (pinyins.length > 0 && pinyins[0]!.initial) {
            const ch = pinyins[0]!.initial.toUpperCase();
            if (/^[A-Z]$/.test(ch)) {
                initial = ch;
            }
        }

        if (!groups.has(initial)) {
            groups.set(initial, []);
        }
        groups.get(initial)!.push(content);
    }

    if (groups.size === 0) return text;

    const sortedLetters = Array.from(groups.keys()).sort((a, b) => {
        if (a === "#") return 1;
        if (b === "#") return -1;
        return a.localeCompare(b);
    });

    const collator = new Intl.Collator("zh-CN", {numeric: true, sensitivity: "base"});
    const sections: string[] = [];

    for (const letter of sortedLetters) {
        const items = groups.get(letter)!;
        items.sort((a, b) => collator.compare(a, b));
        const itemLines = items.map((it) => `- ${it}`).join("\n");
        sections.push(`${hPrefix} ${letter}\n${itemLines}`);
    }

    return sections.join("\n\n");
}

export interface VisualWidthMetrics {
    visualWidth: number;
    charCount: number;
    cjkCount: number;
    asciiCount: number;
}

/**
 * 文本字符宽度度量与对齐占位计算引擎 (measureVisualWidth)
 */
export function measureVisualWidth(text: string): VisualWidthMetrics {
    if (!text || typeof text !== "string") {
        return {visualWidth: 0, charCount: 0, cjkCount: 0, asciiCount: 0};
    }

    let visualWidth = 0;
    let charCount = 0;
    let cjkCount = 0;
    let asciiCount = 0;

    const chars = Array.from(text);
    charCount = chars.length;

    for (const ch of chars) {
        const code = ch.codePointAt(0) ?? 0;
        const isCjk = (code >= 0x4e00 && code <= 0x9fa5) || code > 0xff;
        if (isCjk) {
            visualWidth += 2;
            cjkCount++;
        } else {
            visualWidth += 1;
            asciiCount++;
        }
    }

    return {visualWidth, charCount, cjkCount, asciiCount};
}

/**
 * 动态布尔条件求值与三元表达式引擎 (evaluateTernaryCondition)
 * 零 eval，安全支持数字对比、字符串匹配与真假值判定
 */
export function evaluateTernaryCondition(
    conditionStr: string,
    thenValue: string,
    elseValue = "",
): string {
    if (!conditionStr || typeof conditionStr !== "string") return elseValue;
    const cond = conditionStr.trim();
    if (!cond) return elseValue;

    const evalCondition = (expr: string): boolean => {
        const containsMatch = expr.match(/^(.+?)\s+(?:contains|includes)\s+(.+)$/i);
        if (containsMatch) {
            const rawSubject = containsMatch[1]!.trim().replace(/^['"]|['"]$/g, "");
            const rawTarget = containsMatch[2]!.trim().replace(/^['"]|['"]$/g, "");
            return rawSubject.includes(rawTarget);
        }

        const compMatch = expr.match(/^(.+?)\s*(===|==|!==|!=|>=|<=|>|<)\s*(.+)$/);
        if (compMatch) {
            const [, leftRaw, op, rightRaw] = compMatch;
            const leftStr = leftRaw!.trim().replace(/^['"]|['"]$/g, "");
            const rightStr = rightRaw!.trim().replace(/^['"]|['"]$/g, "");

            const leftNum = parseFloat(leftStr);
            const rightNum = parseFloat(rightStr);
            const bothNumeric = !Number.isNaN(leftNum) && !Number.isNaN(rightNum) && /^[+-]?\d+(?:\.\d+)?$/.test(leftStr) && /^[+-]?\d+(?:\.\d+)?$/.test(rightStr);

            if (bothNumeric) {
                switch (op) {
                    case ">": return leftNum > rightNum;
                    case ">=": return leftNum >= rightNum;
                    case "<": return leftNum < rightNum;
                    case "<=": return leftNum <= rightNum;
                    case "==":
                    case "===": return leftNum === rightNum;
                    case "!=":
                    case "!==": return leftNum !== rightNum;
                }
            } else {
                switch (op) {
                    case "==":
                    case "===": return leftStr === rightStr;
                    case "!=":
                    case "!==": return leftStr !== rightStr;
                    case ">": return leftStr > rightStr;
                    case ">=": return leftStr >= rightStr;
                    case "<": return leftStr < rightStr;
                    case "<=": return leftStr <= rightStr;
                }
            }
        }

        const lower = expr.toLowerCase().replace(/^['"]|['"]$/g, "");
        if (["false", "0", "null", "undefined", "no", "n", "off", "none", ""].includes(lower)) {
            return false;
        }
        return true;
    };

    const isTrue = evalCondition(cond);
    return isTrue ? thenValue : elseValue;
}

/**
 * 列表项与多行缩进批量升降引擎 (shiftListIndentation)
 */
export function shiftListIndentation(
    text: string,
    deltaSpaces = 2,
): string {
    if (!text || typeof text !== "string") return text ?? "";
    const lines = text.split("\n");
    const delta = Math.trunc(deltaSpaces);
    if (delta === 0) return text;

    const listRegex = /^(\s*)([-*+]|\d+[.)])(\s+.*)$/;

    return lines.map((line) => {
        const match = line.match(listRegex);
        if (!match) return line;

        const [, indent, marker, rest] = match;
        const currentLen = indent!.length;

        if (delta > 0) {
            return `${" ".repeat(currentLen + delta)}${marker}${rest}`;
        } else {
            const newLen = Math.max(0, currentLen + delta);
            return `${" ".repeat(newLen)}${marker}${rest}`;
        }
    }).join("\n");
}

export type FlattenListMode = "flat_bullets" | "prefix_parent";

/**
 * Markdown 嵌套列表展开打平引擎 (flattenNestedList)
 */
export function flattenNestedList(
    text: string,
    mode: FlattenListMode = "flat_bullets",
): string {
    if (!text || typeof text !== "string") return text ?? "";
    const lines = text.split("\n");
    const listRegex = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;

    const parentStack: Array<{indentLen: number; text: string}> = [];

    return lines.map((line) => {
        const match = line.match(listRegex);
        if (!match) return line;

        const [, indent, , content] = match;
        const indentLen = indent!.length;
        const cleanContent = content!.trim();

        if (mode === "prefix_parent") {
            while (parentStack.length > 0 && parentStack[parentStack.length - 1]!.indentLen >= indentLen) {
                parentStack.pop();
            }

            let fullText = cleanContent;
            if (parentStack.length > 0) {
                const parentPath = parentStack.map((p) => p.text).join(" > ");
                fullText = `${parentPath}: ${cleanContent}`;
            }

            parentStack.push({indentLen, text: cleanContent});
            return `- ${fullText}`;
        }

        return `- ${cleanContent}`;
    }).join("\n");
}

export interface MaskRangeOptions {
    start?: number;
    length?: number;
    keepStart?: number;
    keepEnd?: number;
    maskChar?: string;
}

/**
 * 任意文本范围与留头尾掩码脱敏引擎 (maskTextRange)
 */
export function maskTextRange(
    text: string,
    options: MaskRangeOptions = {},
): string {
    if (!text || typeof text !== "string") return "";
    const mask = options.maskChar && options.maskChar.length > 0 ? options.maskChar.charAt(0) : "*";
    const chars = Array.from(text);
    const total = chars.length;

    if (options.keepStart !== undefined || options.keepEnd !== undefined) {
        const ks = Math.max(0, options.keepStart || 0);
        const ke = Math.max(0, options.keepEnd || 0);

        if (total <= ks + ke) {
            return text;
        }

        const maskedMiddle = mask.repeat(total - ks - ke);
        const head = chars.slice(0, ks).join("");
        const tail = chars.slice(total - ke).join("");
        return `${head}${maskedMiddle}${tail}`;
    }

    const s = Math.max(0, options.start || 0);
    const len = options.length !== undefined ? Math.max(0, options.length) : (total - s);

    if (s >= total || len === 0) return text;

    const end = Math.min(total, s + len);
    const head = chars.slice(0, s).join("");
    const masked = mask.repeat(end - s);
    const tail = chars.slice(end).join("");

    return `${head}${masked}${tail}`;
}

/**
 * 中英文排版与标点空格综合规整引擎 (formatCJKSpacingComprehensive)
 * 串联 NBSP 清洗、盘古之中英文空格、全角/半角标点间距标准化
 */
export function formatCJKSpacingComprehensive(text: string): {result: string; changed: boolean} {
    if (!text || typeof text !== "string") return {result: text ?? "", changed: false};

    const step1 = sanitizeLineEndingsAndSpaces(text).result;
    const step2 = formatPanguSpacing(step1).result;
    const step3 = formatPunctuationSpacing(step2);

    return {
        result: step3,
        changed: step3 !== text,
    };
}

const CIRCLED_NUMBERS = [
    "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩",
    "⑪", "⑫", "⑬", "⑭", "⑮", "⑯", "⑰", "⑱", "⑲", "⑳"
];

const BRACKETED_NUMBERS = [
    "⑴", "⑵", "⑶", "⑷", "⑸", "⑹", "⑺", "⑻", "⑼", "⑽",
    "⑾", "⑿", "⒀", "⒁", "⒂", "⒃", "⒄", "⒅", "⒆", "⒇"
];

export type NumberSymbolStyle = "circled" | "bracketed" | "digits";

/**
 * 文本字符集与数字格式互转（圈号、括号序号与标准数字）引擎 (convertNumberSymbols)
 */
export function convertNumberSymbols(
    text: string,
    targetStyle: NumberSymbolStyle = "circled",
): string {
    if (!text || typeof text !== "string") return text ?? "";

    if (targetStyle === "digits") {
        let cur = text;
        for (let i = 0; i < 20; i++) {
            cur = cur.replaceAll(CIRCLED_NUMBERS[i]!, String(i + 1));
            cur = cur.replaceAll(BRACKETED_NUMBERS[i]!, String(i + 1));
        }
        return cur;
    }

    if (targetStyle === "circled") {
        return text.replace(/\b([1-9]|1[0-9]|20)\b/g, (match) => {
            const num = parseInt(match, 10);
            return CIRCLED_NUMBERS[num - 1] || match;
        });
    }

    if (targetStyle === "bracketed") {
        return text.replace(/\b([1-9]|1[0-9]|20)\b/g, (match) => {
            const num = parseInt(match, 10);
            return BRACKETED_NUMBERS[num - 1] || match;
        });
    }

    return text;
}

/**
 * 敏感字符遮罩与屏蔽词过滤引擎 (censorText)
 */
export function censorText(
    text: string,
    wordsOrPattern: string | string[],
    replacement?: string,
): string {
    if (!text || typeof text !== "string") return "";
    if (!wordsOrPattern) return text;

    let words: string[] = [];
    if (Array.isArray(wordsOrPattern)) {
        words = wordsOrPattern.map((w) => w.trim()).filter((w) => w.length > 0);
    } else {
        words = wordsOrPattern.split(/[,，|]/).map((w) => w.trim()).filter((w) => w.length > 0);
    }

    if (words.length === 0) return text;

    const escapedWords = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const combinedRegex = new RegExp(escapedWords.join("|"), "gi");

    if (replacement !== undefined) {
        return text.replace(combinedRegex, replacement);
    }
    return text.replace(combinedRegex, (match) => "*".repeat(match.length));
}

export interface ExtractCodeBlocksOptions {
    languageFilter?: string;
    includeLanguageHeader?: boolean;
}

/**
 * Markdown 代码块提取与正文拆分引擎 (extractCodeBlocksFromMarkdown)
 */
export function extractCodeBlocksFromMarkdown(
    text: string,
    options: ExtractCodeBlocksOptions = {},
): string {
    if (!text || typeof text !== "string") return "";
    const filterLang = options.languageFilter ? options.languageFilter.trim().toLowerCase() : undefined;
    const withHeader = options.includeLanguageHeader === true;

    const lines = text.split("\n");
    const blocks: string[] = [];

    let inCode = false;
    let currentCode: string[] = [];
    let currentLang = "";

    for (const line of lines) {
        const fenceMatch = line.match(/^(\s*)(`{3,}|~{3,})(.*)$/);
        if (fenceMatch) {
            if (!inCode) {
                inCode = true;
                currentLang = fenceMatch[3]!.trim().toLowerCase();
                currentCode = [];
            } else {
                inCode = false;
                if (!filterLang || currentLang === filterLang) {
                    let codeText = currentCode.join("\n").trim();
                    if (codeText) {
                        if (withHeader && currentLang) {
                            codeText = `// [${currentLang}]\n${codeText}`;
                        }
                        blocks.push(codeText);
                    }
                }
                currentLang = "";
                currentCode = [];
            }
        } else if (inCode) {
            currentCode.push(line);
        }
    }

    return blocks.join("\n\n");
}

export type HeadingListConvertMode = "headings_to_list" | "list_to_headings";

/**
 * Markdown 标题与列表双向智能互转引擎 (convertHeadingsToList)
 */
export function convertHeadingsToList(
    text: string,
    mode: HeadingListConvertMode = "headings_to_list",
    options: {baseHeadingLevel?: number} = {},
): string {
    if (!text || typeof text !== "string") return text ?? "";
    const lines = text.split("\n");
    const baseLevel = options.baseHeadingLevel !== undefined ? Math.max(1, Math.min(6, options.baseHeadingLevel)) : 1;

    if (mode === "headings_to_list") {
        let minLevel = 6;
        for (const line of lines) {
            const m = line.match(/^(#{1,6})\s+/);
            if (m && m[1]!.length < minLevel) {
                minLevel = m[1]!.length;
            }
        }
        if (minLevel > 6) minLevel = 1;

        return lines.map((line) => {
            const m = line.match(/^(#{1,6})\s+(.*)$/);
            if (!m) return line;
            const lvl = m[1]!.length;
            const content = m[2]!.trim().replace(/#+$/, "").trim();
            const indent = "  ".repeat(Math.max(0, lvl - minLevel));
            return `${indent}- ${content}`;
        }).join("\n");
    }

    const listRegex = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
    return lines.map((line) => {
        const m = line.match(listRegex);
        if (!m) return line;
        const [, indent, , content] = m;
        const depth = Math.floor(indent!.length / 2);
        const headingLvl = Math.min(6, baseLevel + depth);
        return `${"#".repeat(headingLvl)} ${content!.trim()}`;
    }).join("\n");
}

/**
 * 列表词汇或行随机打乱引擎 (shuffleList)
 */
export function shuffleList(
    text: string,
    options: {delimiter?: string} = {},
): string {
    if (!text || typeof text !== "string") return text ?? "";

    let delim = options.delimiter;
    if (!delim) {
        if (text.includes("\n")) {
            delim = "\n";
        } else if (text.includes(",")) {
            delim = ",";
        } else if (text.includes("，")) {
            delim = "，";
        } else {
            delim = " ";
        }
    }

    const items = text.split(delim);
    if (items.length <= 1) return text;

    for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = items[i]!;
        items[i] = items[j]!;
        items[j] = temp;
    }

    return items.join(delim);
}

/**
 * 多行数据数值区间筛选过滤引擎 (filterNumericRangeLines)
 */
export function filterNumericRangeLines(
    text: string,
    min?: number,
    max?: number,
    options: {invert?: boolean} = {},
): string {
    if (!text || typeof text !== "string") return text ?? "";
    const lines = text.split("\n");
    const invert = options.invert === true;

    return lines.filter((line) => {
        const numMatch = line.match(/[-+]?\d+(?:\.\d+)?/);
        if (!numMatch) {
            return invert;
        }

        const val = parseFloat(numMatch[0]);
        let inRange = true;
        if (min !== undefined && val < min) inRange = false;
        if (max !== undefined && val > max) inRange = false;

        return invert ? !inRange : inRange;
    }).join("\n");
}

export interface HeadingNumberingOptions {
    mode?: "number" | "strip";
    startLevel?: number; // 默认 1
    maxLevel?: number;   // 默认 6
    trailingDot?: boolean; // 默认单级为 1. ，多级为 1.1
}

/**
 * Markdown 标题层级序号自动编排与剥离引擎 (numberMarkdownHeadings)
 * 支持为多级 Markdown 标题自动生成十进制递增层级序号（如 1. 、1.1 、1.1.1 ），
 * 支持重排已有序号或完全剥离层级序号，严格避开代码围栏（``` 或 ~~~）。
 */
export function numberMarkdownHeadings(
    text: string,
    options: HeadingNumberingOptions = {},
): string {
    if (!text || typeof text !== "string") return text ?? "";
    const mode = options.mode || "number";
    const startLevel = Math.max(1, Math.min(6, options.startLevel || 1));
    const maxLevel = Math.max(startLevel, Math.min(6, options.maxLevel || 6));
    const trailingDot = options.trailingDot;

    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    let inCodeFence = false;
    const counters = [0, 0, 0, 0, 0, 0, 0]; // 1-based index 1..6

    const resultLines = lines.map((line) => {
        const trimmed = line.trim();
        if (/^(?:```|~~~)/.test(trimmed)) {
            inCodeFence = !inCodeFence;
            return line;
        }
        if (inCodeFence) {
            return line;
        }

        const headingMatch = line.match(/^(#{1,6})(\s+)(.*)$/);
        if (!headingMatch) {
            return line;
        }

        const hashes = headingMatch[1]!;
        const spacing = headingMatch[2]!;
        let title = headingMatch[3]!;
        const level = hashes.length;

        // 先剥离现存的多级数字编号（如 1. 、1.1 、1.1.1. ）
        title = title.replace(/^\d+(?:\.\d+)*\.?\s+/, "");

        if (mode === "strip") {
            return `${hashes}${spacing}${title}`;
        }

        // 仅在指定层级区间内编号
        if (level < startLevel || level > maxLevel) {
            return `${hashes}${spacing}${title}`;
        }

        counters[level] = (counters[level] ?? 0) + 1;
        for (let i = level + 1; i <= 6; i++) {
            counters[i] = 0;
        }

        const activeNumbers = counters.slice(startLevel, level + 1);
        let numStr = activeNumbers.join(".");

        let hasDot = false;
        if (trailingDot !== undefined) {
            hasDot = trailingDot;
        } else {
            hasDot = activeNumbers.length === 1;
        }

        if (hasDot) {
            numStr += ".";
        }

        return `${hashes}${spacing}${numStr} ${title}`;
    });

    return resultLines.join("\n");
}

export interface TaskProgressBarOptions {
    total?: number;
    width?: number;
    style?: "block" | "ascii" | "circle";
    showPercent?: boolean;
    showNumbers?: boolean;
}

/**
 * Unicode/ASCII 任务进度条度量生成器 (formatTaskProgressBar)
 * 支持基于完成数/总数或百分比生成图形化进度条，
 * 支持 block 方块（[███████░░░]）、circle 圆点（[●●●○○]）及 ascii 箭头（[====>     ]）。
 */
export function formatTaskProgressBar(
    completedOrPercent: number,
    optionsOrTotal?: number | TaskProgressBarOptions,
): string {
    const completed = typeof completedOrPercent === "number" && !isNaN(completedOrPercent) ? completedOrPercent : 0;
    let total = 100;
    let width = 10;
    let customWidth = false;
    let style: "block" | "ascii" | "circle" = "block";
    let showPercent = true;
    let showNumbers = false;

    if (typeof optionsOrTotal === "number") {
        total = !isNaN(optionsOrTotal) && optionsOrTotal > 0 ? optionsOrTotal : 100;
        showNumbers = true;
    } else if (optionsOrTotal && typeof optionsOrTotal === "object") {
        if (optionsOrTotal.total !== undefined) {
            const rawTotal = optionsOrTotal.total;
            total = typeof rawTotal === "number" && !isNaN(rawTotal) && rawTotal > 0 ? rawTotal : 100;
            showNumbers = true;
        }
        if (optionsOrTotal.width !== undefined) {
            width = optionsOrTotal.width;
            customWidth = true;
        }
        if (optionsOrTotal.style !== undefined) style = optionsOrTotal.style;
        if (optionsOrTotal.showPercent !== undefined) showPercent = optionsOrTotal.showPercent;
        if (optionsOrTotal.showNumbers !== undefined) showNumbers = optionsOrTotal.showNumbers;
    }

    if (!customWidth && total > 0 && total <= 20) {
        width = total;
    }

    if (width <= 0) width = 10;
    if (width > 50) width = 50;

    let fraction = 0;
    if (total > 0) {
        fraction = completed / total;
    }
    if (fraction < 0) fraction = 0;
    if (fraction > 1) fraction = 1;

    const percentInt = Math.round(fraction * 100);
    const filledCount = Math.round(fraction * width);
    const emptyCount = width - filledCount;

    let bar = "";
    if (style === "circle") {
        bar = "●".repeat(filledCount) + "○".repeat(emptyCount);
    } else if (style === "ascii") {
        if (filledCount === 0) {
            bar = " ".repeat(width);
        } else if (filledCount < width) {
            bar = "=".repeat(filledCount - 1) + ">" + " ".repeat(emptyCount);
        } else {
            bar = "=".repeat(width);
        }
    } else {
        bar = "█".repeat(filledCount) + "░".repeat(emptyCount);
    }

    const parts: string[] = [`[${bar}]`];
    if (showNumbers && total !== 100) {
        parts.push(`${completed}/${total}`);
    }
    if (showPercent) {
        parts.push(`${percentInt}%`);
    }

    return parts.join(" ");
}

/**
 * Markdown 表格矩阵行列转置引擎 (transposeMarkdownTable)
 * 将 Markdown 表格的行与列互换（原第0行为表头，转置后原第0列成为新表头），
 * 自动识别并重构分隔线 | :--- |，支持非等宽列自动补齐。
 */
export function transposeMarkdownTable(
    tableMarkdown: string,
    options: { alignment?: "left" | "center" | "right" } = {},
): string {
    if (!tableMarkdown || typeof tableMarkdown !== "string") return tableMarkdown ?? "";
    const lines = tableMarkdown.replace(/\r\n?/g, "\n").split("\n");

    // 寻找表格区块起止行，保护前置与后置正文不丢失
    let tableStart = -1;
    let tableEnd = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i]!.includes("|")) {
            if (tableStart === -1) tableStart = i;
            tableEnd = i;
        } else if (tableStart !== -1) {
            break;
        }
    }

    if (tableStart === -1) return tableMarkdown;

    const tableLines = lines.slice(tableStart, tableEnd + 1);
    const parsedRows: string[][] = [];
    const isSeparatorRow = (line: string): boolean => {
        const trimmed = line.trim();
        return /^\|?\s*[-:]+\s*\|/.test(trimmed) && /^[\s|:-]+$/.test(trimmed);
    };

    for (const rawLine of tableLines) {
        const line = rawLine.trim();
        if (!line.includes("|")) continue;
        if (isSeparatorRow(line)) continue;

        let content = line;
        if (content.startsWith("|")) content = content.slice(1);
        if (content.endsWith("|")) content = content.slice(0, -1);

        const cells = content.split(/(?<!\\)\|/).map((c) => c.trim());
        if (cells.length > 0) {
            parsedRows.push(cells);
        }
    }

    if (parsedRows.length === 0) return tableMarkdown;

    const rowCount = parsedRows.length;
    const colCount = Math.max(...parsedRows.map((r) => r.length));
    if (colCount === 0) return tableMarkdown;

    const transposed: string[][] = [];
    for (let c = 0; c < colCount; c++) {
        const newRow: string[] = [];
        for (let r = 0; r < rowCount; r++) {
            newRow.push(parsedRows[r]?.[c] ?? "");
        }
        transposed.push(newRow);
    }

    if (transposed.length === 0) return tableMarkdown;

    const align = options.alignment || "left";
    const getAlignSep = () => {
        if (align === "center") return ":---:";
        if (align === "right") return "---:";
        return ":---";
    };

    const newColCount = transposed[0]!.length;
    const separatorRow = Array(newColCount).fill(getAlignSep());

    const resultLines: string[] = [];
    resultLines.push(`| ${transposed[0]!.join(" | ")} |`);
    resultLines.push(`| ${separatorRow.join(" | ")} |`);
    for (let i = 1; i < transposed.length; i++) {
        resultLines.push(`| ${transposed[i]!.join(" | ")} |`);
    }

    const finalOutput = [
        ...lines.slice(0, tableStart),
        ...resultLines,
        ...lines.slice(tableEnd + 1),
    ];
    return finalOutput.join("\n");
}

/**
 * Markdown 复杂表格自动等宽对齐与视觉美化引擎 (beautifyMarkdownTable)
 * 智能计算包含 CJK 双倍字宽与 ASCII 的各列最大视觉宽度，
 * 对所有单元格填充空格使列边框完全垂直对齐，标准化分隔行。
 */
export function beautifyMarkdownTable(tableMarkdown: string): string {
    if (!tableMarkdown || typeof tableMarkdown !== "string") return tableMarkdown ?? "";
    const lines = tableMarkdown.replace(/\r\n?/g, "\n").split("\n");

    const getCharWidth = (ch: string) => {
        const code = ch.charCodeAt(0);
        return (code >= 0x4e00 && code <= 0x9fa5) || code > 0xff ? 2 : 1;
    };
    const getCellVisualWidth = (s: string) => {
        let w = 0;
        for (const c of s) w += getCharWidth(c);
        return w;
    };

    const isSeparatorRow = (line: string): boolean => {
        const trimmed = line.trim();
        return /^\|?\s*[-:]+\s*\|/.test(trimmed) && /^[\s|:-]+$/.test(trimmed);
    };

    // 寻找表格区块
    let tableStart = -1;
    let tableEnd = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i]!.includes("|")) {
            if (tableStart === -1) tableStart = i;
            tableEnd = i;
        } else if (tableStart !== -1) {
            break;
        }
    }

    if (tableStart === -1 || tableEnd <= tableStart) return tableMarkdown;

    const tableLines = lines.slice(tableStart, tableEnd + 1);
    const parsedRows: string[][] = [];
    const alignments: ("left" | "center" | "right")[] = [];

    for (const rawLine of tableLines) {
        const line = rawLine.trim();
        if (!line.includes("|")) continue;

        if (isSeparatorRow(line)) {
            let content = line;
            if (content.startsWith("|")) content = content.slice(1);
            if (content.endsWith("|")) content = content.slice(0, -1);
            const sepCells = content.split(/(?<!\\)\|/).map((c) => c.trim());
            for (const cell of sepCells) {
                if (cell.startsWith(":") && cell.endsWith(":")) alignments.push("center");
                else if (cell.endsWith(":")) alignments.push("right");
                else alignments.push("left");
            }
            continue;
        }

        let content = line;
        if (content.startsWith("|")) content = content.slice(1);
        if (content.endsWith("|")) content = content.slice(0, -1);
        const cells = content.split(/(?<!\\)\|/).map((c) => c.trim());
        if (cells.length > 0) {
            parsedRows.push(cells);
        }
    }

    if (parsedRows.length === 0) return tableMarkdown;

    const colCount = Math.max(...parsedRows.map((r) => r.length));
    if (colCount === 0) return tableMarkdown;

    // 确保表头行与所有数据行均补齐至 colCount 列，杜绝表头列数少于数据行导致列不对齐破损
    for (const r of parsedRows) {
        while (r.length < colCount) r.push("");
    }

    // 补齐对齐方式
    while (alignments.length < colCount) {
        alignments.push("left");
    }

    // 计算各列最大视觉宽度
    const colWidths: number[] = Array(colCount).fill(3);
    for (const row of parsedRows) {
        for (let c = 0; c < colCount; c++) {
            const cell = row[c] ?? "";
            const w = getCellVisualWidth(cell);
            if (w > (colWidths[c] ?? 0)) {
                colWidths[c] = w;
            }
        }
    }

    // 格式化单元格
    const formatCell = (content: string, colIdx: number): string => {
        const width = colWidths[colIdx] ?? 3;
        const align = alignments[colIdx] || "left";
        const curW = getCellVisualWidth(content);
        const diff = Math.max(0, width - curW);

        if (align === "right") {
            return " ".repeat(diff) + content;
        } else if (align === "center") {
            const left = Math.floor(diff / 2);
            const right = diff - left;
            return " ".repeat(left) + content + " ".repeat(right);
        }
        return content + " ".repeat(diff);
    };

    // 生成对齐分隔线
    const sepRow = colWidths.map((w, idx) => {
        const align = alignments[idx] || "left";
        if (align === "center") {
            return `:${"-".repeat(Math.max(1, w - 2))}:`;
        } else if (align === "right") {
            return `${"-".repeat(Math.max(2, w - 1))}:`;
        }
        return `:${"-".repeat(Math.max(2, w - 1))}`;
    });

    const formattedRows: string[] = [];
    // 表头
    formattedRows.push(`| ${parsedRows[0]!.map((cell, idx) => formatCell(cell, idx)).join(" | ")} |`);
    // 分隔线
    formattedRows.push(`| ${sepRow.join(" | ")} |`);
    // 数据行
    for (let r = 1; r < parsedRows.length; r++) {
        const row = parsedRows[r]!;
        while (row.length < colCount) row.push("");
        formattedRows.push(`| ${row.map((cell, idx) => formatCell(cell, idx)).join(" | ")} |`);
    }

    const result = [
        ...lines.slice(0, tableStart),
        ...formattedRows,
        ...lines.slice(tableEnd + 1),
    ];
    return result.join("\n");
}

export interface QueryJsonPathOptions {
    fallback?: string;
    pretty?: boolean;
}

/**
 * JSON 数据路径安全提取与查询引擎 (queryJsonPath)
 * 支持点号与括号语法（如 user.roles[0].name、status、data.items.length），
 * 严格 zero-eval 纯属性键遍历，支持提取顶层键名列表 (keys) 与 JSON 紧凑/美化格式化。
 */
export function queryJsonPath(
    jsonText: string,
    path = "",
    options: QueryJsonPathOptions = {},
): string {
    if (!jsonText || typeof jsonText !== "string") return options.fallback ?? "";
    let data: unknown;
    try {
        data = JSON.parse(jsonText.trim());
    } catch {
        return options.fallback ?? "";
    }

    const trimmedPath = path.trim();
    if (trimmedPath === "" || trimmedPath === "." || trimmedPath === "$") {
        if (options.pretty) {
            return JSON.stringify(data, null, 2);
        }
        return typeof data === "object" && data !== null ? JSON.stringify(data) : String(data);
    }

    if (trimmedPath === "keys" || trimmedPath === "@keys") {
        if (typeof data === "object" && data !== null) {
            return Array.isArray(data)
                ? String(data.length)
                : Object.keys(data).join(", ");
        }
        return options.fallback ?? "";
    }

    const segments: string[] = [];
    let i = 0;
    while (i < trimmedPath.length) {
        const ch = trimmedPath[i];
        if (ch === "." || ch === "[" || ch === "]") {
            i++;
            continue;
        }
        if (ch === '"' || ch === "'") {
            const quote = ch;
            i++;
            let val = "";
            while (i < trimmedPath.length && trimmedPath[i] !== quote) {
                if (trimmedPath[i] === "\\" && i + 1 < trimmedPath.length) {
                    val += trimmedPath[i + 1];
                    i += 2;
                } else {
                    val += trimmedPath[i];
                    i++;
                }
            }
            if (i < trimmedPath.length && trimmedPath[i] === quote) {
                i++;
            }
            segments.push(val);
        } else {
            let val = "";
            while (i < trimmedPath.length && trimmedPath[i] !== "." && trimmedPath[i] !== "[" && trimmedPath[i] !== "]") {
                val += trimmedPath[i];
                i++;
            }
            if (val.trim()) {
                segments.push(val.trim());
            }
        }
    }
    let cur: any = data;

    for (const seg of segments) {
        if (cur === undefined || cur === null) {
            return options.fallback ?? "";
        }
        if (typeof cur === "object") {
            // 防御原型链穿透（如 toString, valueOf, constructor, __proto__ 等）：
            // 仅允许自身拥有的属性，对于数组允许数字下标与 length
            const isArray = Array.isArray(cur);
            if (isArray && (seg === "length" || /^\d+$/.test(seg))) {
                cur = cur[seg];
            } else if (Object.prototype.hasOwnProperty.call(cur, seg)) {
                cur = cur[seg];
            } else {
                return options.fallback ?? "";
            }
        } else {
            return options.fallback ?? "";
        }
    }

    if (cur === undefined) {
        return options.fallback ?? "";
    }

    if (cur === null) {
        return "null";
    }

    if (typeof cur === "object") {
        return options.pretty ? JSON.stringify(cur, null, 2) : JSON.stringify(cur);
    }

    return String(cur);
}

export type CalloutType =
    | "NOTE"
    | "TIP"
    | "IMPORTANT"
    | "WARNING"
    | "CAUTION"
    | "INFO"
    | "SUCCESS"
    | "QUESTION"
    | "DANGER"
    | "EXAMPLE";

export interface CalloutOptions {
    title?: string;
    collapsible?: boolean;
    strip?: boolean;
}

/**
 * Markdown Callout 告警提示块智能包装与转换引擎 (formatMarkdownCallout)
 * 支持将文本包装为 GitHub/Obsidian 规范 Callout（> [!NOTE]、> [!TIP] 等），
 * 支持折叠形态（> [!NOTE]- 自定义标题）与一键剥离还原为常规正文。
 */
export function formatMarkdownCallout(
    text: string,
    type: CalloutType = "NOTE",
    options: CalloutOptions = {},
): string {
    if (!text || typeof text !== "string") return text ?? "";

    const lines = text.split("\n");
    // 寻找首个非空行作为 Callout 头部候选行
    let firstNonEmptyIdx = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i]!.trim().length > 0) {
            firstNonEmptyIdx = i;
            break;
        }
    }

    if (options.strip === true) {
        // 剥离 Callout 头部并还原引用/文本
        const cleanedLines: string[] = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]!;
            if (i === firstNonEmptyIdx && /^>\s*\[![A-Za-z]+\][-+]?(?:\s+(.*))?$/.test(line.trim())) {
                const titleMatch = line.trim().match(/^>\s*\[![A-Za-z]+\][-+]?(?:\s+(.*))?$/);
                const title = titleMatch?.[1]?.trim();
                if (title) cleanedLines.push(`> **${title}**`);
                continue;
            }
            cleanedLines.push(line);
        }
        return cleanedLines.join("\n");
    }

    // 提取正文并剥除已有引用前缀与 Callout 头部
    const rawBodyLines: string[] = [];
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i]!;
        if (i === firstNonEmptyIdx && /^>\s*\[![A-Za-z]+\][-+]?(?:\s+(.*))?$/.test(line.trim())) {
            continue;
        }
        // 剥离行首引用符
        if (line.startsWith("> ")) {
            line = line.slice(2);
        } else if (line.startsWith(">")) {
            line = line.slice(1);
        }
        rawBodyLines.push(line);
    }

    const foldMark = options.collapsible ? "-" : "";
    const titleStr = options.title ? ` ${options.title}` : "";
    const header = `> [!${type.toUpperCase()}]${foldMark}${titleStr}`;

    const quotedBody = rawBodyLines.map((l) => (l.trim().length > 0 ? `> ${l}` : ">"));

    return [header, ...quotedBody].join("\n");
}