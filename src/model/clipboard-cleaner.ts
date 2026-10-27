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

    return {
        originalText: text,
        cleanedText: cur,
        hasChanges: cur !== text,
        changeDetails: details,
    };
}
