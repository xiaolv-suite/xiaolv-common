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

    // 2. 保护 URL 链接与 Markdown 链接免受内部插入空格破坏
    const urls: string[] = [];
    sanitized = sanitized.replace(/(https?:\/\/[^\s\u4e00-\u9fa5<>"')）\]]+|\[[^\]]+\]\([^)]+\))/g, (match) => {
        const placeholder = ` XLCURL${urls.length}XLC `;
        urls.push(match);
        return placeholder;
    });

    // 3. 保护 LaTeX 数学公式 ($$...$$ 与 $...$)
    const mathBlocks: string[] = [];
    sanitized = sanitized.replace(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g, (match) => {
        const placeholder = ` XLCMATH${mathBlocks.length}XLCMATH `;
        mathBlocks.push(match);
        return placeholder;
    });

    // 4. 保护思源原生块引用与动态模板占位符
    const syBlocks: string[] = [];
    sanitized = sanitized.replace(/(\(\([a-z0-9\-]{14,24}(?:\s+"[^"]*")?\)\)|\{\{[\s\S]*?\}\})/gi, (match) => {
        const placeholder = ` XLCSY${syBlocks.length}XLCSY `;
        syBlocks.push(match);
        return placeholder;
    });

    // 5. 中文字符与英文字母/数字间补充空格
    sanitized = sanitized
        // 中文 -> 英文/数字
        .replace(/([\u4e00-\u9fa5\u3040-\u30ff])([a-zA-Z0-9$#@%&*])/g, "$1 $2")
        // 英文/数字 -> 中文
        .replace(/([a-zA-Z0-9$#@%&*])([\u4e00-\u9fa5\u3040-\u30ff])/g, "$1 $2")
        // 中文 -> 英文括号 / 英文括号 -> 中文
        .replace(/([\u4e00-\u9fa5\u3040-\u30ff])([(])/g, "$1 $2")
        .replace(/([)])([\u4e00-\u9fa5\u3040-\u30ff])/g, "$1 $2");

    // 6. 清理冗余的连续空格（保留换行）
    sanitized = sanitized.replace(/[ \t]{2,}/g, " ");

    // 7. 还原思源原生块引用与动态模板占位符
    sanitized = sanitized.replace(/XLCSY(\d+)XLCSY/g, (_, idx) => syBlocks[Number(idx)] || "");

    // 8. 还原 LaTeX 数学公式
    sanitized = sanitized.replace(/XLCMATH(\d+)XLCMATH/g, (_, idx) => mathBlocks[Number(idx)] || "");

    // 9. 还原 URL
    sanitized = sanitized.replace(/XLCURL(\d+)XLC/g, (_, idx) => urls[Number(idx)] || "");

    // 10. 还原代码块
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

/**
 * URL 结构化组件安全提取手术刀（支持 query 参数、主机名、路径、协议）
 */
export function extractUrlComponent(
    urlStr: string,
    component: "param" | "host" | "path" | "protocol",
    paramKey?: string
): string | null {
    if (!urlStr || typeof urlStr !== "string") return null;
    const trimmed = urlStr.trim();
    if (!trimmed) return null;

    let parsedUrl: URL | null = null;
    try {
        if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
            parsedUrl = new URL(trimmed);
        } else {
            parsedUrl = new URL(`https://${trimmed}`);
        }
    } catch {
        parsedUrl = null;
    }

    if (component === "param") {
        if (!paramKey) return null;
        if (parsedUrl) {
            const val = parsedUrl.searchParams.get(paramKey);
            return val !== null ? val : null;
        }
        // 正则降级提取 query
        const queryStart = trimmed.indexOf("?");
        if (queryStart !== -1) {
            const queryStr = trimmed.slice(queryStart + 1).split("#")[0] || "";
            const pairs = queryStr.split("&");
            for (const pair of pairs) {
                const [k, v] = pair.split("=");
                if (k && decodeURIComponent(k) === paramKey) {
                    return v !== undefined ? decodeURIComponent(v.replace(/\+/g, " ")) : "";
                }
            }
        }
        return null;
    }

    if (!parsedUrl) return null;

    if (component === "host") {
        return parsedUrl.hostname || null;
    }
    if (component === "path") {
        return parsedUrl.pathname || "/";
    }
    if (component === "protocol") {
        return parsedUrl.protocol || null;
    }

    return null;
}

/**
 * 多行文本批量前缀装饰引擎（代码注释、Markdown引用、列表项批量转换）
 */
export function prefixLines(
    text: string,
    prefix: string,
    options: { skipEmpty?: boolean } = { skipEmpty: true }
): string {
    if (typeof text !== "string") return "";
    const lines = text.split("\n");
    const result = lines.map((line) => {
        if (options.skipEmpty && line.trim().length === 0) {
            return line;
        }
        return `${prefix}${line}`;
    });
    return result.join("\n");
}

/**
 * 多行文本批量后缀装饰引擎
 */
export function suffixLines(
    text: string,
    suffix: string,
    options: { skipEmpty?: boolean } = { skipEmpty: true }
): string {
    if (typeof text !== "string") return "";
    const lines = text.split("\n");
    const result = lines.map((line) => {
        if (options.skipEmpty && line.trim().length === 0) {
            return line;
        }
        return `${line}${suffix}`;
    });
    return result.join("\n");
}

/**
 * CSV / 分隔文本智能转换为 Markdown 列表引擎
 */
export function csvToList(
    csvText: string,
    delimiter = ",",
    listPrefix = "- "
): string {
    if (!csvText || typeof csvText !== "string") return "";
    // 支持按换行或指定分隔符拆分
    let rawItems: string[] = [];
    if (delimiter === "\n" || delimiter === "\\n") {
        rawItems = csvText.split("\n");
    } else {
        const d = delimiter === "\\t" ? "\t" : delimiter;
        // 先按换行，再按指定分隔符拆分
        rawItems = csvText.split("\n").flatMap((line) => line.split(d));
    }

    const items = rawItems
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

    return items.map((item) => `${listPrefix}${item}`).join("\n");
}

/**
 * Key-Value / 键值对安全序列化构建 URL Query 引擎
 */
export function buildUrlQuery(
    pairsInput: string,
    baseUrl?: string
): string {
    if (!pairsInput || typeof pairsInput !== "string") return baseUrl || "";

    const lines = pairsInput.split(/[\n&]/);
    const searchParams = new URLSearchParams();

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const equalIdx = trimmed.indexOf("=");
        if (equalIdx !== -1) {
            const k = trimmed.slice(0, equalIdx).trim();
            const v = trimmed.slice(equalIdx + 1).trim();
            if (k) searchParams.append(k, v);
        } else {
            searchParams.append(trimmed, "");
        }
    }

    const queryString = searchParams.toString();
    if (!baseUrl || typeof baseUrl !== "string" || !baseUrl.trim()) {
        return queryString;
    }

    const baseTrimmed = baseUrl.trim();
    if (!queryString) return baseTrimmed;

    const separator = baseTrimmed.includes("?") ? "&" : "?";
    return `${baseTrimmed}${separator}${queryString}`;
}


