/**
 * 文本排版格式化手术刀（借鉴社区文本处理规范 · Pangu 盘古之白）
 * 1. 中文字符与英文字母/数字/符号间智能补充半角空格
 * 2. 保护 Markdown 代码围栏、行内代码与 URL 链接免受破坏
 * 3. 纯函数设计，便于在常用语保存、模板展开与剪贴板注入中按需复用
 */

// 盘古之白核心算法：中英文字符间插入半角空格
export function formatPanguSpacing(text: string): string {
    if (!text || typeof text !== "string") return "";

    // 1. 保护代码块与行内代码：占位符替换，并在两侧保留半角空格
    const codeBlocks: string[] = [];
    let sanitized = text.replace(/(```[\s\S]*?```|`[^`\n]+`)/g, (match) => {
        const placeholder = ` XLCCODE${codeBlocks.length}XLC `;
        codeBlocks.push(match);
        return placeholder;
    });

    // 2. 保护 URL 链接免受内部插入空格破坏
    const urls: string[] = [];
    sanitized = sanitized.replace(/(https?:\/\/[^\s\u4e00-\u9fa5<>"']+)/g, (match) => {
        const placeholder = ` XLCURL${urls.length}XLC `;
        urls.push(match);
        return placeholder;
    });

    // 3. 中文字符与英文字母/数字间补充空格
    sanitized = sanitized
        // 中文 -> 英文/数字
        .replace(/([\u4e00-\u9fa5\u3040-\u30ff])([a-zA-Z0-9$#@%&*])/g, "$1 $2")
        // 英文/数字 -> 中文
        .replace(/([a-zA-Z0-9$#@%&*])([\u4e00-\u9fa5\u3040-\u30ff])/g, "$1 $2")
        // 中文 -> 英文括号 / 英文括号 -> 中文
        .replace(/([\u4e00-\u9fa5\u3040-\u30ff])([(])/g, "$1 $2")
        .replace(/([)])([\u4e00-\u9fa5\u3040-\u30ff])/g, "$1 $2");

    // 4. 清理冗余的连续空格（保留换行）
    sanitized = sanitized.replace(/[ \t]{2,}/g, " ");

    // 5. 还原 URL
    sanitized = sanitized.replace(/XLCURL(\d+)XLC/g, (_, idx) => urls[Number(idx)] || "");

    // 6. 还原代码块
    sanitized = sanitized.replace(/XLCCODE(\d+)XLC/g, (_, idx) => codeBlocks[Number(idx)] || "");

    return sanitized.trim();
}

/**
 * 常用条目排版规范化（支持可选扩展配置）
 */
export function normalizeSnippetTypography(
    text: string,
    options: { panguSpacing?: boolean } = { panguSpacing: true }
): string {
    if (!text) return "";
    let res = text;
    if (options.panguSpacing !== false) {
        res = formatPanguSpacing(res);
    }
    return res;
}
