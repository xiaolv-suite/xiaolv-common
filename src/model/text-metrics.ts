// 文本度量与阅读时间估算引擎 (Text Metrics & Reading Estimator)
// 统计文本字符、中文字符、英文单词数、行数并科学估算朗读/阅读耗时
// 纯函数、零外部依赖、零副作用运行。

export interface TextMetrics {
    /** 总字符数 (含空白) */
    totalChars: number;
    /** 非空白字符数 */
    nonWhitespaceChars: number;
    /** 汉字/日韩 CJK 字符数 */
    cjkChars: number;
    /** 英文/数字词数 */
    words: number;
    /** 实际行数 */
    lines: number;
    /** 估算阅读耗时 (秒) */
    readingTimeSeconds: number;
    /** 格式化耗时说明，如 "< 1 分钟" 或 "约 3 分钟" */
    formattedReadingTime: string;
}

const CJK_REGEX = /[\u4e00-\u9fa5\u3040-\u30ff]/g;
const WORD_REGEX = /[a-zA-Z0-9_-]+/g;

/**
 * 纯函数：计算文本的字数、词数、行数与估算阅读耗时
 * 业界通用基准：中文阅读约 300~400 字/分钟，英文约 160~200 词/分钟。
 * 综合取中位数：中文 300 字/分 (5字/秒)，英文 160 词/分 (2.67词/秒)。
 */
export function calculateTextMetrics(text: string): TextMetrics {
    if (!text || !text.trim()) {
        return {
            totalChars: 0,
            nonWhitespaceChars: 0,
            cjkChars: 0,
            words: 0,
            lines: 0,
            readingTimeSeconds: 0,
            formattedReadingTime: "< 1 分钟",
        };
    }

    const totalChars = text.length;
    const nonWhitespaceChars = text.replace(/\s+/g, "").length;
    const lines = text.replace(/\r\n?/g, "\n").split("\n").filter((l) => l.trim().length > 0).length;

    const cjkMatches = text.match(CJK_REGEX);
    const cjkChars = cjkMatches ? cjkMatches.length : 0;

    // 剔除中文字符后再提取英文/数字词
    const textWithoutCjk = text.replace(CJK_REGEX, " ");
    const wordMatches = textWithoutCjk.match(WORD_REGEX);
    const words = wordMatches ? wordMatches.length : 0;

    // 估算秒数：中文 5 字/秒，英文 2.67 词/秒
    const cjkSeconds = cjkChars / 5;
    const englishSeconds = words / 2.67;
    const readingTimeSeconds = Math.round(cjkSeconds + englishSeconds);

    let formattedReadingTime: string;
    if (readingTimeSeconds <= 45) {
        formattedReadingTime = "< 1 分钟";
    } else {
        const minutes = Math.ceil(readingTimeSeconds / 60);
        formattedReadingTime = `约 ${minutes} 分钟`;
    }

    return {
        totalChars,
        nonWhitespaceChars,
        cjkChars,
        words,
        lines,
        readingTimeSeconds,
        formattedReadingTime,
    };
}

/**
 * 格式化阅读度量紧凑标签文本
 * 例：`1,250 字 · 约 3 分钟`
 */
export function formatReadingMetrics(metrics: TextMetrics): string {
    if (metrics.nonWhitespaceChars === 0) return "";
    const charLabel = `${metrics.nonWhitespaceChars.toLocaleString()} 字符`;
    return `${charLabel} · ${metrics.formattedReadingTime}`;
}
