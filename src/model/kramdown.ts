import {LIMITS} from "../constants";

/**
 * Single-block boundary for in-place edits of arbitrary user blocks (omni search quick edit):
 * updateBlock on a foreign block must not split it into siblings. Library items use
 * itemBodyRestriction instead, because they are stored inside one superblock container (ADR 0165).
 */
const STRUCTURED_PATTERN = /\{:|[{]{3}|[}]{3}|^ {0,3}(?:`{3,}|~{3,}|>|(?:[-*+]|\d{1,9}[.)])[ \t]|\||(?:[-*_][ \t]*){3,}$)/;

export function bodyWriteRestriction(markdown: string): string | undefined {
    if (!markdown.trim()) return "body is empty";
    if (markdown.length > LIMITS.contentChars) return "body exceeds the supported size; nothing was written";
    if (/[\u2028\u2029]/.test(markdown)) return "multi-line content cannot be written into an existing single block";
    if (isSingleBlockBody(markdown)) return undefined;
    return "multi-line or structured content cannot be written into an existing single block; use a single line or a complete code fence";
}

function trimmedLines(markdown: string): string[] {
    const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
    while (lines.length > 1 && lines[0]!.trim() === "") lines.shift();
    while (lines.length > 1 && lines[lines.length - 1]!.trim() === "") lines.pop();
    return lines;
}

/** 单行普通文本或一个完整代码围栏：可直接作为一个段落/代码块写入，无需容器。 */
export function isSingleBlockBody(markdown: string): boolean {
    const lines = trimmedLines(markdown);
    const opening = lines[0]?.match(/^(`{3,}|~{3,})([a-zA-Z0-9_+.-]*)[ \t]*$/);
    if (opening && lines.length >= 2) {
        const fence = opening[1]!;
        const close = new RegExp(`^ {0,3}${fence[0]}{${fence.length},}[ \\t]*$`);
        const closingIndex = lines.findIndex((line, index) => index > 0 && close.test(line));
        if (closingIndex === lines.length - 1) return true;
    }
    return lines.length === 1 && !STRUCTURED_PATTERN.test(lines[0]!);
}

const CONTAINER_OPEN = "{{{row\n";
const CONTAINER_CLOSE = "\n}}}";
/** 条目正文上限：给超级块容器标记留出余量，保证写入的 markdown 不超过 contentChars。 */
export const ITEM_BODY_MAX_CHARS = LIMITS.contentChars - CONTAINER_OPEN.length - CONTAINER_CLOSE.length;
const SUPERBLOCK_MARKER_LINE = /^\s*(?:\{\{\{|\}\}\})/;

/**
 * 库条目写前边界（ADR 0165）：多段正文装进一个超级块，appendBlock/updateBlock 只产生一个顶层块。
 * 仅拒绝会破坏容器边界的输入：围栏外的行首超级块标记（`{{{` / `}}}`）可能提前闭合容器。
 */
export function itemBodyRestriction(markdown: string): string | undefined {
    if (!markdown.trim()) return "body is empty";
    if (markdown.length > ITEM_BODY_MAX_CHARS) return "body exceeds the supported size; nothing was written";
    const lines = markdown.replace(/\r\n?|[\u2028\u2029]/g, "\n").split("\n");
    const codeLines = findCodeLines(lines);
    if (lines.some((line, index) => !codeLines[index] && SUPERBLOCK_MARKER_LINE.test(line))) {
        return "superblock markers ({{{ / }}}) at line start are reserved for the item container; remove them or put them in a code fence";
    }
    return undefined;
}

/**
 * 条目正文 → 写入内核的 markdown。单行/单围栏原样写入（兼容既有段落与代码块条目）；
 * 其余多段内容包进一个超级块。forceContainer 用于已是超级块的条目更新，避免容器被拆散。
 * 先剥离 id/updated/custom-xlc-* 属性，防止正文里粘贴的 IAL 冒充宿主块或条目元数据。
 */
export function toItemStorageMarkdown(markdown: string, forceContainer = false): string {
    const body = guardEmbedLines(normalizeKramdownIal(markdown.replace(/[\u2028\u2029]/g, "\n")).slice(0, ITEM_BODY_MAX_CHARS));
    if (!forceContainer && isSingleBlockBody(body)) return body;
    return `${CONTAINER_OPEN}${body}${CONTAINER_CLOSE}`;
}

const ZWSP = "\u200b";
// 行首（含引用/列表前缀后）的 `{{` 会被内核解析为嵌入查询块（query_embed，真内核实测），
// 变量/宏行因此被拆成独立块。写入时在 `{{` 前垫一个零宽空格保持段落，读回时去掉。
const EMBED_LINE_START = /^(\s*(?:>\s*)*(?:(?:[-*+]|\d{1,9}[.)])\s+(?:\[[ xX]\]\s+)?)?)(\{\{(?!\{))/;
// 写入时垫的零宽空格，以及内核在行内代码和原生 #标签# 两侧自动补的零宽空格（复制/回读时不应带出不可见字符）
const READ_ZWSP_PATTERN = /\u200b(?=\{\{)|\u200b(?=`)|(`)\u200b|\u200b(?=#)|(#)\u200b/g;

function guardEmbedLines(markdown: string): string {
    const lines = markdown.split("\n");
    const codeLines = findCodeLines(lines);
    return lines.map((line, index) => codeLines[index] ? line : line.replace(EMBED_LINE_START, `$1${ZWSP}$2`)).join("\n");
}

const HOST_IAL_PATTERN = /\{:[^{}]*\bid="\d{14}-[0-9a-z]{7}"[^{}]*\}/g;

/**
 * 内核 getBlockKramdown 的原始 kramdown → 条目正文：剥离宿主生成的块 IAL（含块 ID 的 `{: ...}`），
 * 去掉条目自身的超级块容器，丢弃剥离后只剩引用前缀的空行。用户写在正文里的无 ID IAL 原样保留。
 */
export function storedKramdownToBody(kramdown: string): string {
    const lines = kramdown.replace(/\r\n?/g, "\n").split("\n");
    const codeLines = findCodeLines(lines);
    const out: Array<{line: string; code: boolean}> = [];
    for (let index = 0; index < lines.length; index++) {
        const line = lines[index] ?? "";
        if (codeLines[index]) {
            out.push({line, code: true});
            continue;
        }
        const visible = line.replace(READ_ZWSP_PATTERN, "$1$2");
        const stripped = visible.replace(HOST_IAL_PATTERN, "");
        if (stripped === visible) {
            out.push({line: visible, code: false});
            continue;
        }
        if (/^[\s>]*$/.test(stripped)) continue;
        out.push({line: stripped.replace(/[ \t]+$/, ""), code: false});
    }
    // 去掉宿主为引用块补的尾随空引用行（`>` 后紧跟非引用行）
    for (let index = out.length - 1; index >= 0; index--) {
        const entry = out[index]!;
        if (!entry.code && /^\s*>\s*$/.test(entry.line) && !/^\s*>/.test(out[index + 1]?.line ?? "")) out.splice(index, 1);
    }
    let first = 0;
    let last = out.length - 1;
    while (first <= last && !out[first]!.line.trim()) first++;
    while (last >= first && !out[last]!.line.trim()) last--;
    if (last > first && !out[first]!.code && /^\{\{\{(?:row|col)\s*$/.test(out[first]!.line) && out[last]!.line.trim() === "}}}") {
        first++;
        last--;
    }
    const body: string[] = [];
    for (const {line, code} of out.slice(first, last + 1)) {
        if (!code && !line.trim() && body.length && !body[body.length - 1]!.trim()) continue;
        body.push(line);
    }
    return body.join("\n").trim();
}

const ATTRIBUTE_PATTERN = /(^|\s)([\w:-]+)=(?:"[^"]*"|'[^']*'|[^\s}]+)(?=\s|$)/g;
const IAL_TOKEN_PATTERN = /(`+)|(\{:[^{}]*\})/g;

function normalizeIalToken(ial: string): string {
    const attributes = ial.slice(2, -1);
    const safeAttributes = attributes.replace(ATTRIBUTE_PATTERN, (attribute, _space, name) =>
        name === "id" || name === "updated" || name.startsWith("custom-xlc-") ? " " : attribute,
    ).trim();
    return safeAttributes ? `{: ${safeAttributes}}` : "";
}

interface InlineCodeTick {
    line: number;
    offset: number;
    length: number;
}

function findCodeLines(lines: string[]): boolean[] {
    const codeLines: boolean[] = [];
    let fence: {marker: string; length: number} | null = null;

    for (const line of lines) {
        if (fence) {
            codeLines.push(true);
            const closing = line.match(/^\s*(`+|~+)\s*$/)?.[1];
            if (closing && closing.charAt(0) === fence.marker && closing.length >= fence.length) fence = null;
            continue;
        }
        if (!line.trim()) {
            codeLines.push(false);
            continue;
        }
        if (/^(?: {4,}|\t)/.test(line)) {
            codeLines.push(true);
            continue;
        }
        const opening = line.match(/^\s*(`{3,}|~{3,})/)?.[1];
        if (opening) {
            fence = {marker: opening.charAt(0), length: opening.length};
            codeLines.push(true);
            continue;
        }
        codeLines.push(false);
    }

    return codeLines;
}

function findInlineCodeTicks(lines: string[], codeLines: boolean[]): Set<number>[] {
    const pairedByLine = lines.map(() => new Set<number>());
    let segment: InlineCodeTick[] = [];

    const pairSegment = (): void => {
        const nextByLength = new Map<number, number>();
        const nextSameLength = new Map<number, number>();
        for (let index = segment.length - 1; index >= 0; index--) {
            const tick = segment[index];
            if (!tick) continue;
            const next = nextByLength.get(tick.length);
            if (next !== undefined) nextSameLength.set(index, next);
            nextByLength.set(tick.length, index);
        }

        for (let index = 0; index < segment.length; index++) {
            const tick = segment[index];
            if (!tick) continue;
            const closeIndex = nextSameLength.get(index);
            if (closeIndex === undefined) continue;
            pairedByLine[tick.line]?.add(tick.offset);
            const close = segment[closeIndex];
            if (close) pairedByLine[close.line]?.add(close.offset);
            index = closeIndex;
        }
        segment = [];
    };

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex] ?? "";
        if (codeLines[lineIndex]) {
            pairSegment();
            continue;
        }
        IAL_TOKEN_PATTERN.lastIndex = 0;
        for (const match of line.matchAll(IAL_TOKEN_PATTERN)) {
            if (!match[1]) continue;
            segment.push({line: lineIndex, offset: match.index ?? 0, length: match[0].length});
        }
    }
    pairSegment();
    return pairedByLine;
}

function normalizeLineIals(
    line: string,
    activeInlineCodeTicks: number,
    pairedInlineCodeTicks: Set<number>,
): {line: string; activeInlineCodeTicks: number} {
    let cursor = 0;
    let inlineCodeTicks = activeInlineCodeTicks;
    let output = "";
    IAL_TOKEN_PATTERN.lastIndex = 0;
    for (const match of line.matchAll(IAL_TOKEN_PATTERN)) {
        const token = match[0];
        const start = match.index ?? 0;
        output += line.slice(cursor, start);
        cursor = start + token.length;
        if (match[1]) {
            if (pairedInlineCodeTicks.has(start)) {
                if (!inlineCodeTicks) inlineCodeTicks = token.length;
                else if (inlineCodeTicks === token.length) inlineCodeTicks = 0;
            }
            output += token;
        } else if (inlineCodeTicks) {
            output += token;
        } else {
            output += normalizeIalToken(token);
        }
    }
    return {line: output + line.slice(cursor), activeInlineCodeTicks: inlineCodeTicks};
}

export function normalizeKramdownIal(markdown: string): string {
    const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
    const codeLines = findCodeLines(lines);
    const pairedInlineCodeTicks = findInlineCodeTicks(lines, codeLines);
    const output: string[] = [];
    let inlineCodeTicks = 0;

    for (let index = 0; index < lines.length; index++) {
        const line = lines[index] ?? "";
        if (codeLines[index]) {
            inlineCodeTicks = 0;
            output.push(line);
            continue;
        }
        const normalized = normalizeLineIals(line, inlineCodeTicks, pairedInlineCodeTicks[index] ?? new Set());
        output.push(normalized.line);
        inlineCodeTicks = normalized.activeInlineCodeTicks;
    }

    return output.join("\n").trim();
}
