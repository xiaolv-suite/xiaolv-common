// 轻量 Markdown 格式剥离工具（纯文本提取）
export interface StripMarkdownOptions {
    keepLinksText?: boolean;
    keepCodeContent?: boolean;
}

export function stripMarkdownFormatting(text: string, options: StripMarkdownOptions = {}): string {
    if (!text || typeof text !== "string") return text ?? "";
    const keepLinksText = options.keepLinksText !== false;
    const keepCodeContent = options.keepCodeContent !== false;

    let res = text.replace(/\r\n?/g, "\n");
    res = res.replace(/```[a-zA-Z0-9_-]*\n([\s\S]*?)\n```/g, (_, code) => (keepCodeContent ? code : ""));
    res = res.replace(/`([^`]+)`/g, (_, code) => (keepCodeContent ? code : ""));
    res = res.replace(/!\[([^\]]*)\]\([^)]+\)/g, (_, alt) => (alt ? `[图片: ${alt}]` : ""));
    res = res.replace(/\[([^\]]+)\]\([^)]+\)/g, (_, label) => (keepLinksText ? label : ""));
    res = res.replace(/^#{1,6}\s+/gm, "");
    res = res.replace(/^>\s*/gm, "");
    res = res.replace(/[*_]{2}([^*_]+)[*_]{2}/g, "$1");
    res = res.replace(/[*_]([^*_]+)[*_]/g, "$1");
    res = res.replace(/~~([^~]+)~~/g, "$1");
    res = res.replace(/^[-*_]{3,}\s*$/gm, "");

    return res.trim();
}
