// 剪贴板文本高级清洗引擎（ADR 0098 / G53）
// 针对从 PDF、网页、微信、聊天窗口复制时附带的不可见乱码、硬断行、多余空行进行高保真清洗

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
    processed = processed.replace(/(https?:\/\/[^\s)）\]]+|\[[^\]]+\]\([^)]+\))/g, (match) => {
        urlBlocks.push(match);
        return `__XLC_URL_PLACEHOLDER_${urlBlocks.length - 1}__`;
    });

    // 3. 保护动态模板占位符 {{xlc:...}}
    const xlcBlocks: string[] = [];
    processed = processed.replace(/\{\{xlc:[\s\S]*?\}\}/g, (match) => {
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

    // 8. 还原 URL
    processed = processed.replace(/__XLC_URL_PLACEHOLDER_(\d+)__/g, (_, idx) => {
        return urlBlocks[Number(idx)] ?? "";
    });

    // 9. 还原代码块
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
