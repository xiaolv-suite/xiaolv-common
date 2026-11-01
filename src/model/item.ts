// 条目模型：CommonItem 归一化、类型推断、来源引用。
// 未知字段一律丢弃并计数（前向兼容：新版本字段在旧版本安全降级）。
import {ATTR, ATTR_PREFIX, LIMITS} from "../constants";

export type ItemType =
    | "text"
    | "markdown"
    | "url"
    | "code"
    | "image"
    | "asset"
    | "blockref"
    | "structure";

export const ITEM_TYPES: readonly ItemType[] = [
    "text", "markdown", "url", "code", "image", "asset", "blockref", "structure",
];

export const SOURCE_TYPES: readonly ISourceRef["sourceType"][] = [
    "", "selection", "block", "doc-fragment", "clipboard", "manual", "resource", "external",
];

export function isItemType(v: unknown): v is ItemType {
    return typeof v === "string" && (ITEM_TYPES as readonly string[]).includes(v);
}

/** 外部链接只允许 http/https，所有写入、插入和打开路径共用此守卫。 */
export function isSafeHttpUrl(v: unknown): v is string {
    if (typeof v !== "string") return false;
    const value = v.trim();
    if (!/^https?:\/\//i.test(value)) return false;
    try {
        const parsed = new URL(value);
        return (parsed.protocol === "http:" || parsed.protocol === "https:") && Boolean(parsed.hostname);
    } catch {
        return false;
    }
}

export function isSourceType(v: unknown): v is ISourceRef["sourceType"] {
    return typeof v === "string" && (SOURCE_TYPES as readonly string[]).includes(v);
}

// 来源引用（条目必须携带；可缺失 = 用户手工新建无来源）
export interface ISourceRef {
    sourceDocId: string;
    sourceBlockId: string;
    sourceType: "" | "selection" | "block" | "doc-fragment" | "clipboard" | "manual" | "resource" | "external";
}

export interface CommonItem {
    /** 稳定逻辑 ID（xlc- 前缀），存于 custom-xlc-id，跨工作区/导出导入不变 */
    id: string;
    /** 库中锚定块的物理块 ID */
    blockId: string;
    /** 实验期物理块清单，需重新验证同文档归属；不证明正文完整，也不授权删除。 */
    partBlockIds?: string[];
    /** parts 属性存在但无法安全解析时，读写操作必须显式失败。 */
    partsCorrupt?: boolean;
    /** 库文档 ID */
    libraryDocId: string;
    itemType: ItemType;
    title: string;
    alias: string;
    shortcode?: string;
    tags: string[];
    category: string;
    /** 有界摘要（索引缓存，可重建） */
    summary: string;
    /** ask 变量数（写入时落 custom-xlc-vars 属性；0=无。徽标提示用，行为以插入时现场内容为准） */
    varCount: number;
    source: ISourceRef;
    /** url 条目的目标网址；blockref 条目的目标块 ID 复用 target 字段名见 ATTR.url/ATTR.target */
    url: string;
    targetBlockId: string;
    createdAt: number;
    updatedAt: number;
    /** 归一化时被丢弃的未知字段名（诊断用，不持久化） */
    droppedFields: string[];
}

export interface CommonItemRef {
    id: string;
    itemType?: ItemType;
    title?: string;
    alias?: string;
    shortcode?: string;
    tags?: readonly string[];
    category?: string;
    varCount?: number;
    summary?: string;
    /** 生态消费契约：雷切、快门等外部插件直接读取 content 字段进行复制或快速渲染 */
    content?: string;
}

const LOGICAL_ID_RE = /^xlc-[0-9a-z]{10,40}$/;
export const BLOCK_ID_RE = /^\d{14}-[0-9a-z]{7}$/;

export function isLogicalId(v: unknown): v is string {
    return typeof v === "string" && LOGICAL_ID_RE.test(v);
}

export function isBlockId(v: unknown): v is string {
    return typeof v === "string" && BLOCK_ID_RE.test(v);
}

/** Resolve a blockref's physical target, preferring its explicit target attribute and
 * falling back to the source block field used by older/imported records. */
export function resolveBlockRefTarget(item: Pick<CommonItem, "itemType" | "targetBlockId" | "source">): string {
    if (item.itemType !== "blockref") return "";
    if (isBlockId(item.targetBlockId)) return item.targetBlockId;
    if (isBlockId(item.source.sourceBlockId)) return item.source.sourceBlockId;
    return "";
}

export function newLogicalId(now = Date.now(), random = Math.random): string {
    const time = now.toString(36);
    // 随机源退化（注入 0/极小值）时左填充，保证后缀长度满足 LOGICAL_ID_RE（R139）
    const rand = Math.floor(random() * 0xffffffffffffffff).toString(36).slice(0, 10).padStart(10, "0");
    return `xlc-${time}${rand}`.slice(0, 30);
}

function cleanString(v: unknown, max: number): string {
    if (typeof v !== "string") return "";
    if (v.length <= max) return v;
    // UTF-16 码元截断会拆散代理对：仅当尾部为孤立高代理（0xd800..0xdbff）且缺失低代理时才去除（R144）
    const sliced = v.slice(0, max);
    const last = sliced.charCodeAt(sliced.length - 1);
    return last >= 0xd800 && last <= 0xdbff ? sliced.slice(0, -1) : sliced;
}

export function cleanTagList(v: unknown): string[] {
    const raw = Array.isArray(v) ? v : typeof v === "string" ? v.split(/[,，、;；\s]+/) : [];
    const out: string[] = [];
    for (const item of raw) {
        if (typeof item !== "string") continue;
        const tag = item.trim().replace(/^#+/, "").replace(/#+$/, "").slice(0, LIMITS.tag);
        if (!tag) continue;
        if (!out.includes(tag)) out.push(tag);
        if (out.length >= LIMITS.tags) break;
    }
    return out;
}

/**
 * 从思源块 Kramdown 正文中提取原生双井号标签（#标签#）与 textmark 节点标签，
 * 自动跳过代码围栏与行内代码反引号，避免把代码中的 #宏# 误识为标签。
 */
export function extractKramdownNativeTags(kramdown: string): string[] {
    if (typeof kramdown !== "string" || !kramdown) return [];
    const tags: string[] = [];
    const spanPattern = /<span\b(?=[^>]*\bdata-type=["']tag["'])[^>]*>([^<]*)<\/span>/gi;
    for (const match of kramdown.matchAll(spanPattern)) {
        if (match[1]) tags.push(match[1]);
    }
    const stripped = kramdown
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/`[^`\n]+`/g, " ")
        .replace(/[\u200b-\u200d\ufeff]/g, "");
    const hashPattern = /(?:^|[\s,，。；;、()（）[\]【】])#([^\s#`]{1,32})#(?=$|[\s,，。；;、()（）[\]【】.#])/g;
    for (const match of stripped.matchAll(hashPattern)) {
        const candidate = match[1]?.trim() ?? "";
        if (candidate && !/^[0-9a-fA-F]{3,8}$/.test(candidate)) {
            tags.push(candidate);
        }
    }
    return cleanTagList(tags);
}

export function cleanShortcode(v: unknown): string {
    if (typeof v !== "string") return "";
    let s = v.trim();
    if (!s) return "";
    if (!s.startsWith(":")) s = ":" + s;
    return cleanString(s.toLowerCase(), LIMITS.shortcode);
}

/**
 * 智能解析常用语正文中的注释规则（对齐 Quicker、Raycast 与 uTools 最佳实践）：
 * 支持在正文中附加检索关键字（如 @手机号、// 说明、#标签#、[标题] 内容 等）；
 * 插入或复制时自动剥离注释仅输出有效数据，被剥离的注释自动提取为搜索标签与标题。
 */
export function parseSnippetAnnotations(text: string): { cleanText: string; tags: string[]; title: string } {
    if (!text || typeof text !== "string") return { cleanText: text || "", tags: [], title: "" };
    const trimmed = text.trim();
    // 多行复杂结构（如代码围栏、表格、超级块）不自动剥离内部文本
    if (trimmed.startsWith("```") || trimmed.startsWith("{{{") || trimmed.includes("\n\n")) {
        return { cleanText: text, tags: [], title: "" };
    }

    let clean = trimmed;
    const tags: string[] = [];
    let title = "";

    // 1. 前置 [说明] 内容，例如：[手机号] 13800000000 （排除 Markdown 链接语法 [text](url)）
    const leadingBracket = clean.match(/^\[([^\]\n]{1,64})\]\s*([^\n]+)$/);
    if (leadingBracket && !/^\(https?:\/\//.test(leadingBracket[2]!)) {
        title = leadingBracket[1]!.trim();
        tags.push(title);
        clean = leadingBracket[2]!.trim();
    }

    // 2. 后置 内容 [说明]，例如：13800000000 [手机号]
    const trailingBracket = clean.match(/^([^\n]+?)\s*\[([^\]\n]{1,64})\]$/);
    if (trailingBracket) {
        clean = trailingBracket[1]!.trim();
        const tag = trailingBracket[2]!.trim();
        if (!tags.includes(tag)) tags.push(tag);
        if (!title) title = tag;
    }

    // 3. 后置 // 注释，例如：13800000000 // 手机号 或 13800000000//手机号（排除 http:// 与 https://）
    const slashComment = clean.match(/^([^\n]+?)\s*\/\/\s*([^\n\r]+)$/);
    if (slashComment && !slashComment[1]!.endsWith(":")) {
        clean = slashComment[1]!.trim();
        const comment = slashComment[2]!.trim();
        if (!tags.includes(comment)) tags.push(comment);
        if (!title) title = comment;
    }

    // 4. 邮箱后接 @注解：形如 user@domain.com @说明 或 user@domain.com@说明
    const emailWithAnnotation = clean.match(/^([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)\s*@([^\s@\n]{1,64})$/);
    if (emailWithAnnotation) {
        clean = emailWithAnnotation[1]!.trim();
        const tag = emailWithAnnotation[2]!.trim();
        if (!tags.includes(tag)) tags.push(tag);
        if (!title) title = tag;
    }

    // 5. 数字/编码后直接粘连 @中文注解：形如 18588888888@手机号、440301199001011234@身份证
    const codeWithAnnotation = clean.match(/^([a-zA-Z0-9_.-]+)@([\u4e00-\u9fa5][^\s@\n]{0,63})$/);
    if (codeWithAnnotation) {
        clean = codeWithAnnotation[1]!.trim();
        const tag = codeWithAnnotation[2]!.trim();
        if (!tags.includes(tag)) tags.push(tag);
        if (!title) title = tag;
    }

    // 6. 后置 @标签，例如：13800138000 @手机号 @常用电话（精确匹配空格后的 @，安全保留 user@domain.com）
    const atPattern = /(?:^|\s)@([^\s@\n]{1,64})(?=\s|$)/g;
    let match: RegExpExecArray | null;
    const atMatches: string[] = [];
    while ((match = atPattern.exec(clean)) !== null) {
        if (match[1]) atMatches.push(match[1]);
    }
    if (atMatches.length > 0) {
        for (const tag of atMatches) {
            const cleanTag = tag.trim();
            if (cleanTag && !tags.includes(cleanTag)) tags.push(cleanTag);
            if (!title) title = cleanTag;
        }
        clean = clean.replace(/(?:^|\s)@([^\s@\n]{1,64})(?=\s|$)/g, "").trim();
    }

    // 7. 后置原生 #标签#，例如：13800000000 #手机号#
    const hashPattern = /(?:^|\s)#([^\s#`\n]{1,32})#(?=\s|$)/g;
    const hashMatches: string[] = [];
    while ((match = hashPattern.exec(clean)) !== null) {
        if (match[1]) hashMatches.push(match[1]);
    }
    if (hashMatches.length > 0) {
        for (const tag of hashMatches) {
            const cleanTag = tag.trim();
            if (cleanTag && !tags.includes(cleanTag)) tags.push(cleanTag);
            if (!title) title = cleanTag;
        }
        clean = clean.replace(/(?:^|\s)#([^\s#`\n]{1,32})#(?=\s|$)/g, "").trim();
    }

    return { cleanText: clean, tags: cleanTagList(tags), title };
}

/**
 * 提取要插入或复制到外部的纯净正文（剥离尾部 @检索关键字 或 // 备注）
 */
export function extractCleanPayload(text: string): string {
    return parseSnippetAnnotations(text).cleanText;
}

// SiYuan 块类型（getChildBlocks）：p 段落 / h 标题 / c 代码 / l 列表 / t 表格 /
// b 引用 / s 超级块 / i iframe / html / m 公式 / query_embed 嵌入
export function inferItemType(blockType: string, subtype: string, kramdown: string): ItemType {
    if (blockType === "c" || blockType === "code_block" || subtype === "code") return "code";
    if (blockType === "s" || blockType === "super") return "structure";
    if (blockType === "h") return "markdown";
    if (blockType === "i" || blockType === "html" || blockType === "m" || blockType === "query_embed" || blockType === "t") return "markdown";
    if (/^!\[.*\]\(assets\//.test(kramdown.trimStart())) return "image";
    if (/\]\(assets\/[^)]+\)/.test(kramdown)) return "asset";
    return "text";
}

/**
 * 从块属性 + 块事实构造条目。任何形状错误都安全降级，不抛异常。
 * unknown fields：非 ATTR 集合内的 xlc-* 属性视为未知字段，丢弃并记录。
 */
export function normalizeCommonItem(input: {
    blockId: unknown;
    libraryDocId: unknown;
    attrs: unknown;
    blockType?: unknown;
    subtype?: unknown;
    kramdown?: unknown;
}): CommonItem | null {
    const blockId = typeof input.blockId === "string" && isBlockId(input.blockId) ? input.blockId : "";
    const libraryDocId = typeof input.libraryDocId === "string" && isBlockId(input.libraryDocId) ? input.libraryDocId : "";
    if (!blockId || !libraryDocId) return null;
    const attrs = (input.attrs ?? {}) as Record<string, unknown>;
    const droppedFields: string[] = [];
    for (const key of Object.keys(attrs)) {
        if (!key.startsWith(ATTR_PREFIX)) continue;
        if (!Object.values(ATTR).includes(key as (typeof ATTR)[keyof typeof ATTR])) droppedFields.push(key);
    }
    const logicalIdRaw = typeof attrs[ATTR.id] === "string" ? (attrs[ATTR.id] as string) : "";
    if (!isLogicalId(logicalIdRaw)) return null;

    const kramdown = typeof input.kramdown === "string" ? input.kramdown.slice(0, LIMITS.contentChars) : "";
    const blockType = typeof input.blockType === "string" ? input.blockType : "";
    const subtype = typeof input.subtype === "string" ? input.subtype : "";
    const declaredType = isItemType(attrs[ATTR.type]) ? (attrs[ATTR.type] as ItemType) : null;
    const itemType = declaredType ?? inferItemType(blockType, subtype, kramdown);

    const tags = cleanTagList(attrs[ATTR.tags]);
    const title = cleanString(attrs[ATTR.title], LIMITS.title) || deriveTitle(kramdown, itemType, attrs);
    const created = Number(attrs[ATTR.created]);
    const updated = Number(attrs[ATTR.updated]);
    const srcDoc = typeof attrs[ATTR.srcDoc] === "string" ? (attrs[ATTR.srcDoc] as string) : "";
    const srcBlock = typeof attrs[ATTR.srcBlock] === "string" ? (attrs[ATTR.srcBlock] as string) : "";
    const varCountRaw = Number(attrs[ATTR.vars]);
    const varCount = Number.isInteger(varCountRaw) && varCountRaw > 0 ? Math.min(varCountRaw, LIMITS.maxAskFields) : 0;
    const declaredSourceType = isSourceType(attrs[ATTR.srcType])
        ? (attrs[ATTR.srcType] as ISourceRef["sourceType"])
        : "";
    const source: ISourceRef = {
        sourceDocId: isBlockId(srcDoc) ? srcDoc : "",
        sourceBlockId: isBlockId(srcBlock) ? srcBlock : "",
        sourceType: declaredSourceType || (srcDoc || srcBlock ? "block" : "manual"),
    };
    const rawParts = attrs[ATTR.parts];
    let partBlockIds: string[] | undefined;
    let partsCorrupt = false;
    if (typeof rawParts === "string" && rawParts.trim()) {
        const parts = rawParts.split(",").map((part) => part.trim()).filter(Boolean);
        const valid = parts.length >= 2 && parts.length <= LIMITS.maxItemParts
            && parts[0] === blockId
            && new Set(parts).size === parts.length
            && parts.every((part) => isBlockId(part));
        if (valid) partBlockIds = parts;
        else partsCorrupt = true;
    }
    return {
        id: logicalIdRaw,
        blockId,
        ...(partBlockIds ? {partBlockIds} : {}),
        ...(partsCorrupt ? {partsCorrupt: true} : {}),
        libraryDocId,
        itemType,
        title,
        alias: cleanString(attrs[ATTR.alias], LIMITS.alias),
        ...(cleanShortcode(attrs[ATTR.shortcode]) ? {shortcode: cleanShortcode(attrs[ATTR.shortcode])} : {}),
        tags,
        category: cleanString(attrs[ATTR.category], LIMITS.category),
        summary: deriveSummary(kramdown),
        varCount,
        source,
        url: cleanString(attrs[ATTR.url], 2048),
        targetBlockId: isBlockId(attrs[ATTR.target]) ? (attrs[ATTR.target] as string) : "",
        createdAt: Number.isFinite(created) && created > 0 ? created : 0,
        updatedAt: Number.isFinite(updated) && updated > 0 ? updated : 0,
        droppedFields,
    };
}

// 标题派生：title 属性 > 别名 > 首行文本 > 类型标签
export function deriveTitle(kramdown: string, itemType: ItemType, attrs: Record<string, unknown> = {}): string {
    const alias = cleanString(attrs?.[ATTR.alias], LIMITS.alias);
    if (alias) return alias;
    const text = kramdownToPlainText(kramdown);
    const firstLine = text.split("\n").map((l) => l.trim()).find((l) => l.length > 0) ?? "";
    if (firstLine) return cleanString(firstLine, LIMITS.title);
    if (itemType === "url") return cleanString(attrs?.[ATTR.url], LIMITS.title) || "URL";
    if (itemType === "code") return "Code";
    return itemType;
}

// kramdown → 纯文本（搜索/摘要用；不追求完整，够索引即可）
export function kramdownToPlainText(kramdown: string): string {
    if (!kramdown) return "";
    return kramdown
        .replace(/^```.*$/gm, "")
        .replace(/\{\{.*?\}\}/g, "")
        .replace(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g, "$1 $2")
        .replace(/\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g, "$1 $2")
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\{\:(\s[^}]*)?\}/g, "")
        .replace(/^%%[\s\S]*?%%$/gm, "")
        .trim();
}

export function deriveSummary(kramdown: string): string {
    const text = kramdownToPlainText(kramdown).replace(/\s+/g, " ").trim();
    return text.slice(0, LIMITS.summary);
}

/**
 * 智能上下文窗口摘要（Smart Snippet Windowing · G39）
 * 当检索词出现在长正文后部时，自动以首个命中词为中心截取前后上下文，
 * 避免盲目截取首部导致摘要看不到命中词。
 */
export function deriveSmartSummary(content: string, tokens: readonly string[] = [], maxLen = 90): string {
    const plain = kramdownToPlainText(content).replace(/\s+/g, " ").trim();
    if (!plain) return "";
    if (plain.length <= maxLen || !tokens || tokens.length === 0) {
        return plain.slice(0, maxLen) + (plain.length > maxLen ? "…" : "");
    }
    const lower = plain.toLowerCase();
    let firstIdx = -1;
    for (const t of tokens) {
        const cleanT = t.trim().toLowerCase();
        if (!cleanT) continue;
        const at = lower.indexOf(cleanT);
        if (at !== -1 && (firstIdx === -1 || at < firstIdx)) {
            firstIdx = at;
        }
    }
    // 若未命中或命中在前部 30 字符内，直接取前部
    if (firstIdx === -1 || firstIdx <= 30) {
        return plain.slice(0, maxLen) + (plain.length > maxLen ? "…" : "");
    }
    // 以命中位置为锚点，往前保留约 20 个字符，往后延伸
    const lead = 20;
    const start = Math.max(0, firstIdx - lead);
    const end = Math.min(plain.length, start + maxLen);
    const prefix = start > 0 ? "…" : "";
    const suffix = end < plain.length ? "…" : "";
    return prefix + plain.slice(start, end).trim() + suffix;
}

// 协议/导入等外部输入的宽松归一化：形状不可信时返回 null
export function normalizeUnknownItem(raw: unknown): CommonItem | null {
    if (!raw || typeof raw !== "object") return null;
    const obj = raw as Record<string, unknown>;
    const candidate = {
        blockId: obj.blockId,
        libraryDocId: obj.libraryDocId ?? obj.sourceDocId,
        attrs: {
            [ATTR.id]: obj.id,
            [ATTR.type]: obj.itemType,
            [ATTR.title]: obj.title,
            [ATTR.alias]: obj.alias,
            [ATTR.shortcode]: obj.shortcode,
            [ATTR.tags]: obj.tags,
            [ATTR.category]: obj.category,
            [ATTR.srcDoc]: (obj.source as {sourceDocId?: unknown})?.sourceDocId,
            [ATTR.srcBlock]: (obj.source as {sourceBlockId?: unknown})?.sourceBlockId,
            [ATTR.srcType]: (obj.source as {sourceType?: unknown})?.sourceType,
            [ATTR.vars]: obj.varCount,
            [ATTR.url]: obj.url,
            [ATTR.target]: obj.targetBlockId,
            [ATTR.created]: obj.createdAt,
            [ATTR.updated]: obj.updatedAt,
        },
    };
    const item = normalizeCommonItem(candidate);
    if (!item) return null;
    if (typeof obj.summary === "string") item.summary = obj.summary.slice(0, LIMITS.summary);
    return item;
}

export type CategoryColorVariant = "business" | "support" | "dev" | "writing" | "ai";

/**
 * 场景分类语义色系确定性映射（ADR 0042 / T-0069）：
 * 常见核心场景映射到特定语义色，任意自定义分类通过确定性哈希均匀分布到 5 种莫兰迪色系之一。
 */
export function getCategoryColorVariant(category: string): CategoryColorVariant {
    const trimmed = (category ?? "").trim();
    if (!trimmed) return "business";
    if (/商务|财务|发票|银行|采购|合同/i.test(trimmed)) return "business";
    if (/客服|支持|售后|退换|接待|咨询/i.test(trimmed)) return "support";
    if (/开发|代码|研发|SQL|技术|架构|编程/i.test(trimmed)) return "dev";
    if (/写作|周报|会议|计划|日常|笔记/i.test(trimmed)) return "writing";
    if (/提示词|AI|模型|Prompt/i.test(trimmed)) return "ai";

    let hash = 0;
    for (let i = 0; i < trimmed.length; i++) {
        hash = (hash * 31 + trimmed.charCodeAt(i)) >>> 0;
    }
    const variants: readonly CategoryColorVariant[] = [
        "business", "support", "dev", "writing", "ai",
    ];
    return variants[hash % variants.length] ?? "business";
}
