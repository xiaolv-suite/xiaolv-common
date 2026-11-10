// 详情预览轻量富文本与代码语法安全着色引擎（G6，R268，零注入/防 XSS）：
// 对标 Raycast / TextExpander Preview，在右侧详情预览窗格提供纯 DOM 代码语法着色与 Markdown 结构化展示；
// 核心约束（红线）：绝不使用 innerHTML / insertAdjacentHTML，外部内容一律按文本节点渲染；
// 原正文保持绝对不变性，复制与快捷键始终读取原始纯文本。

import {ItemType} from "../model/item";

export type CodeTokenType =
    | "comment"
    | "string"
    | "keyword"
    | "number"
    | "variable"
    | "plain";

export interface CodeToken {
    type: CodeTokenType;
    text: string;
}

export type MarkdownBlockType =
    | "h1"
    | "h2"
    | "h3"
    | "quote"
    | "callout"
    | "list-bullet"
    | "list-ordered"
    | "task-item"
    | "hr"
    | "table"
    | "code-fence"
    | "p";

export interface MarkdownInlineToken {
    type: "bold" | "code" | "variable" | "link" | "text";
    text: string;
    url?: string;
}

export interface MarkdownBlock {
    type: MarkdownBlockType;
    rawText: string;
    inlines: MarkdownInlineToken[];
    lang?: string;
    isDone?: boolean;
    isNested?: boolean;
    tableHeader?: string[];
    tableData?: string[][];
    tableAlignments?: Array<"left" | "center" | "right">;
    calloutType?: string;
    calloutTitle?: string;
    calloutBodyLines?: string[];
}

// 常见多语言关键字集合（JS/TS, Python, SQL, Go, Rust, Shell 等）
const KEYWORDS = new Set([
    // JS/TS
    "const", "let", "var", "function", "return", "if", "else", "for", "while", "class",
    "import", "export", "from", "as", "async", "await", "try", "catch", "finally", "throw",
    "new", "typeof", "interface", "type", "extends", "implements", "public", "private",
    "protected", "readonly", "static", "true", "false", "null", "undefined",
    // Python
    "def", "elif", "except", "lambda", "pass", "raise", "with", "yield", "none", "is", "not",
    // Go / Rust / Shell
    "func", "package", "struct", "go", "defer", "fn", "mut", "impl", "match", "echo",
    // SQL (大写/小写兼容在匹配时处理)
    "select", "from", "where", "insert", "into", "update", "delete", "join", "left", "right",
    "inner", "outer", "group", "by", "order", "having", "limit", "create", "table", "alter", "drop",
]);

/** 纯函数：将单行代码切分为带语义着色标记的 Token 序列 */
export function tokenizeCodeLine(line: string, _lang = ""): CodeToken[] {
    const tokens: CodeToken[] = [];
    let i = 0;
    const len = line.length;

    while (i < len) {
        // 1. 占位符变量优先（{{xlc:...}}）
        if (line.slice(i).startsWith("{{xlc:")) {
            const endIdx = line.indexOf("}}", i);
            if (endIdx !== -1) {
                tokens.push({type: "variable", text: line.slice(i, endIdx + 2)});
                i = endIdx + 2;
                continue;
            }
        }

        // 2. 单行注释：// 或 # 或 --
        const sub2 = line.slice(i, i + 2);
        if (sub2 === "//" || sub2 === "--" || line[i] === "#") {
            tokens.push({type: "comment", text: line.slice(i)});
            break;
        }

        // 3. 字符串字面量："..." 或 '...' 或 `...`
        const char = line[i];
        if (!char) {
            i++;
            continue;
        }
        if (char === '"' || char === "'" || char === "`") {
            const quote = char;
            let strVal = quote;
            i++;
            while (i < len) {
                const c = line[i];
                strVal += c;
                if (c === "\\") {
                    if (i + 1 < len) {
                        i++;
                        strVal += line[i];
                    }
                } else if (c === quote) {
                    i++;
                    break;
                }
                i++;
            }
            // 检查字符串内部是否嵌套了 {{xlc:...}} 占位符变量
            if (strVal.includes("{{xlc:")) {
                let sIdx = 0;
                while (sIdx < strVal.length) {
                    const varStart = strVal.indexOf("{{xlc:", sIdx);
                    if (varStart === -1) {
                        tokens.push({type: "string", text: strVal.slice(sIdx)});
                        break;
                    }
                    if (varStart > sIdx) {
                        tokens.push({type: "string", text: strVal.slice(sIdx, varStart)});
                    }
                    const varEnd = strVal.indexOf("}}", varStart);
                    if (varEnd === -1) {
                        tokens.push({type: "string", text: strVal.slice(varStart)});
                        break;
                    }
                    tokens.push({type: "variable", text: strVal.slice(varStart, varEnd + 2)});
                    sIdx = varEnd + 2;
                }
            } else {
                tokens.push({type: "string", text: strVal});
            }
            continue;
        }

        // 4. 数字字面量
        if (/\d/.test(char) && (i === 0 || !/[a-zA-Z0-9_$]/.test(line[i - 1] ?? ""))) {
            let numStr = "";
            while (i < len && /[0-9.xXabcdefABCDEF]/.test(line[i] ?? "")) {
                numStr += line[i];
                i++;
            }
            tokens.push({type: "number", text: numStr});
            continue;
        }

        // 5. 标识符 / 关键字
        if (/[a-zA-Z_$]/.test(char)) {
            let word = "";
            while (i < len && /[a-zA-Z0-9_$]/.test(line[i] ?? "")) {
                word += line[i];
                i++;
            }
            if (KEYWORDS.has(word.toLowerCase())) {
                tokens.push({type: "keyword", text: word});
            } else {
                tokens.push({type: "plain", text: word});
            }
            continue;
        }

        // 6. 其他普通标点与空白
        tokens.push({type: "plain", text: char});
        i++;
    }

    return tokens;
}

/** 纯函数：将文本行中的行内格式（粗体、行内代码、链接、变量）解析为 Token 序列 */
export function tokenizeMarkdownInlines(text: string): MarkdownInlineToken[] {
    const tokens: MarkdownInlineToken[] = [];
    let i = 0;
    const len = text.length;

    while (i < len) {
        // 变量优先：{{xlc:...}}
        if (text.slice(i).startsWith("{{xlc:")) {
            const endIdx = text.indexOf("}}", i);
            if (endIdx !== -1) {
                tokens.push({type: "variable", text: text.slice(i, endIdx + 2)});
                i = endIdx + 2;
                continue;
            }
        }

        // 行内代码：`code`
        if (text[i] === "`") {
            const endIdx = text.indexOf("`", i + 1);
            if (endIdx !== -1) {
                tokens.push({type: "code", text: text.slice(i + 1, endIdx)});
                i = endIdx + 1;
                continue;
            }
        }

        // 粗体：**bold**
        if (text.slice(i, i + 2) === "**") {
            const endIdx = text.indexOf("**", i + 2);
            if (endIdx !== -1) {
                tokens.push({type: "bold", text: text.slice(i + 2, endIdx)});
                i = endIdx + 2;
                continue;
            }
        }

        // 链接：[title](url)
        if (text[i] === "[") {
            const closeBracket = text.indexOf("]", i);
            if (closeBracket !== -1 && text[closeBracket + 1] === "(") {
                const closeParen = text.indexOf(")", closeBracket + 2);
                if (closeParen !== -1) {
                    const title = text.slice(i + 1, closeBracket);
                    const url = text.slice(closeBracket + 2, closeParen);
                    tokens.push({type: "link", text: title, url});
                    i = closeParen + 1;
                    continue;
                }
            }
        }

        // 普通字符聚合成 text token
        let plain = "";
        while (i < len) {
            if (
                text.slice(i).startsWith("{{xlc:") ||
                text[i] === "`" ||
                text.slice(i, i + 2) === "**" ||
                text[i] === "["
            ) {
                break;
            }
            plain += text[i];
            i++;
        }
        if (plain) {
            tokens.push({type: "text", text: plain});
        }
    }

    return tokens;
}

/** 纯函数：将 Markdown 多行文本拆解为结构化块列表 */
export function parseMarkdownBlocks(text: string): MarkdownBlock[] {
    const lines = text.split(/\r?\n/);
    const blocks: MarkdownBlock[] = [];
    let inCodeFence = false;
    let codeLang = "";
    let codeLines: string[] = [];

    for (let l = 0; l < lines.length; l++) {
        const line = lines[l] ?? "";
        const trimmed = line.trim();

        // 围栏代码块切换
        if (trimmed.startsWith("```")) {
            if (!inCodeFence) {
                inCodeFence = true;
                codeLang = trimmed.slice(3).trim();
                codeLines = [];
                continue;
            } else {
                inCodeFence = false;
                blocks.push({
                    type: "code-fence",
                    rawText: codeLines.join("\n"),
                    inlines: [],
                    lang: codeLang,
                });
                continue;
            }
        }

        if (inCodeFence) {
            codeLines.push(line);
            continue;
        }

        // 分隔线
        if (/^[-*_]{3,}$/.test(trimmed)) {
            blocks.push({type: "hr", rawText: line, inlines: []});
            continue;
        }

        // 标题 H1, H2, H3
        if (/^#\s+/.test(trimmed)) {
            const content = trimmed.replace(/^#\s+/, "");
            blocks.push({type: "h1", rawText: content, inlines: tokenizeMarkdownInlines(content)});
            continue;
        }
        if (/^##\s+/.test(trimmed)) {
            const content = trimmed.replace(/^##\s+/, "");
            blocks.push({type: "h2", rawText: content, inlines: tokenizeMarkdownInlines(content)});
            continue;
        }
        if (/^###\s+/.test(trimmed)) {
            const content = trimmed.replace(/^###\s+/, "");
            blocks.push({type: "h3", rawText: content, inlines: tokenizeMarkdownInlines(content)});
            continue;
        }

        // Callout 告警提示块（GitHub / Obsidian 规范：> [!NOTE] Title）
        const calloutMatch = /^>\s*\[!([A-Za-z]+)\][-+]?(?:\s+(.*))?$/.exec(trimmed);
        if (calloutMatch) {
            const calloutType = calloutMatch[1]!.toUpperCase();
            const calloutTitle = calloutMatch[2]?.trim() || calloutType;
            const bodyLines: string[] = [];
            while (l + 1 < lines.length) {
                const nextLine = lines[l + 1] ?? "";
                const nextTrimmed = nextLine.trim();
                if (/^>\s?/.test(nextTrimmed)) {
                    bodyLines.push(nextTrimmed.replace(/^>\s?/, ""));
                    l++;
                } else {
                    break;
                }
            }
            blocks.push({
                type: "callout",
                rawText: bodyLines.join("\n"),
                inlines: tokenizeMarkdownInlines(calloutTitle),
                calloutType,
                calloutTitle,
                calloutBodyLines: bodyLines,
            });
            continue;
        }

        // 引用块
        if (/^>\s?/.test(trimmed)) {
            const content = trimmed.replace(/^>\s?/, "");
            blocks.push({type: "quote", rawText: content, inlines: tokenizeMarkdownInlines(content)});
            continue;
        }

        // 任务列表项（- [ ] 或 - [x]）
        const taskMatch = /^[-*+]\s+\[([ xX])\]\s+(.*)$/.exec(trimmed);
        const isNested = /^(\s{2,}|\t)/.test(line);
        if (taskMatch) {
            const isDone = taskMatch[1]!.toLowerCase() === "x";
            const content = taskMatch[2]!;
            blocks.push({
                type: "task-item",
                rawText: content,
                inlines: tokenizeMarkdownInlines(content),
                isDone,
                isNested,
            });
            continue;
        }

        // Markdown 表格结构 (Header | 分隔行 | 数据行)
        if (trimmed.startsWith("|") && trimmed.endsWith("|") && l + 1 < lines.length) {
            const nextLine = (lines[l + 1] ?? "").trim();
            if (/^\|(?:\s*:?-+:?\s*\|)+\s*$/.test(nextLine)) {
                const parseCells = (str: string): string[] => {
                    const inner = str.replace(/^\|/, "").replace(/\|$/, "");
                    return inner.split("|").map((c) => c.trim());
                };
                const tableHeader = parseCells(trimmed);
                const separatorCells = parseCells(nextLine);
                const tableAlignments: Array<"left" | "center" | "right"> = separatorCells.map((cell) => {
                    const c = cell.trim();
                    const leftColon = c.startsWith(":");
                    const rightColon = c.endsWith(":");
                    if (leftColon && rightColon) return "center";
                    if (rightColon) return "right";
                    return "left";
                });
                l++; // 跳过分隔行
                const tableData: string[][] = [];
                while (l + 1 < lines.length) {
                    const rowLine = (lines[l + 1] ?? "").trim();
                    if (!rowLine.startsWith("|") || !rowLine.endsWith("|")) break;
                    l++;
                    tableData.push(parseCells(rowLine));
                }
                blocks.push({
                    type: "table",
                    rawText: "",
                    inlines: [],
                    tableHeader,
                    tableData,
                    tableAlignments,
                });
                continue;
            }
        }

        // 无序列表项
        if (/^[-*+]\s+/.test(trimmed)) {
            const content = trimmed.replace(/^[-*+]\s+/, "");
            blocks.push({type: "list-bullet", rawText: content, inlines: tokenizeMarkdownInlines(content), isNested});
            continue;
        }

        // 有序列表项
        if (/^\d+\.\s+/.test(trimmed)) {
            const content = trimmed.replace(/^\d+\.\s+/, "");
            blocks.push({type: "list-ordered", rawText: content, inlines: tokenizeMarkdownInlines(content), isNested});
            continue;
        }

        // 普通段落
        blocks.push({type: "p", rawText: line, inlines: tokenizeMarkdownInlines(line)});
    }

    // 如果未正常闭合代码块，封闭输出
    if (inCodeFence && codeLines.length > 0) {
        blocks.push({
            type: "code-fence",
            rawText: codeLines.join("\n"),
            inlines: [],
            lang: codeLang,
        });
    }

    return blocks;
}

/**
 * 安全渲染预览视图：构建纯 DOM 树并挂载至容器。
 * 绝不使用 innerHTML，所有字符串均由 document.createTextNode 安全挂载。
 */
export function renderSafePreview(
    container: HTMLElement,
    text: string,
    itemType?: ItemType | "provider",
    doc: Document = typeof document !== "undefined" ? document : (null as unknown as Document),
): void {
    if (!doc) return;

    container.textContent = "";

    if (!text || text.trim().length === 0) {
        return;
    }

    const trimmed = text.trim();
    const isCodeItem = itemType === "code" || /^```[\w+#.-]*\s*\n[\s\S]*\n```\s*$/.test(trimmed);

    // 模式 A：代码模式渲染
    if (isCodeItem) {
        let codeBody = text;
        let lang = "";

        if (trimmed.startsWith("```")) {
            const firstNl = text.indexOf("\n");
            if (firstNl !== -1) {
                lang = text.slice(0, firstNl).replace(/^```/, "").trim();
                const lastFence = text.lastIndexOf("```");
                codeBody = lastFence > firstNl ? text.slice(firstNl + 1, lastFence) : text.slice(firstNl + 1);
            }
        }

        const lines = codeBody.split(/\r?\n/);

        // 代码信息栏：语言徽标 + 行数
        const banner = doc.createElement("div");
        banner.className = "xlc-code-banner";

        const langBadge = doc.createElement("span");
        langBadge.className = "xlc-badge xlc-badge--code";
        langBadge.textContent = (lang || "code").toUpperCase();
        banner.appendChild(langBadge);

        const countBadge = doc.createElement("span");
        countBadge.className = "xlc-code-lines";
        if (typeof countBadge.setAttribute === "function") {
            countBadge.setAttribute("role", "status");
            countBadge.setAttribute("aria-label", `代码行数：${lines.length} 行`);
        }
        countBadge.textContent = `${lines.length} 行`;
        banner.appendChild(countBadge);

        container.appendChild(banner);

        // 代码主体
        const pre = doc.createElement("pre");
        pre.className = "xlc-preview-code";
        pre.tabIndex = 0;
        if (typeof pre.setAttribute === "function") {
            pre.setAttribute("role", "region");
            pre.setAttribute("aria-label", "代码预览");
        }
        const codeEl = doc.createElement("code");

        for (let idx = 0; idx < lines.length; idx++) {
            const lineStr = lines[idx] ?? "";
            const lineDiv = doc.createElement("div");
            lineDiv.className = "xlc-code-line";

            // 行号
            const numSpan = doc.createElement("span");
            numSpan.className = "xlc-line-num";
            numSpan.textContent = String(idx + 1);
            lineDiv.appendChild(numSpan);

            // 行内容着色
            const tokens = tokenizeCodeLine(lineStr, lang);
            const contentSpan = doc.createElement("span");
            contentSpan.className = "xlc-code-content";

            for (const token of tokens) {
                if (token.type === "plain") {
                    contentSpan.appendChild(doc.createTextNode(token.text));
                } else {
                    const tokSpan = doc.createElement("span");
                    tokSpan.className = `xlc-tok xlc-tok--${token.type}`;
                    tokSpan.textContent = token.text;
                    contentSpan.appendChild(tokSpan);
                }
            }

            lineDiv.appendChild(contentSpan);
            codeEl.appendChild(lineDiv);
        }

        pre.appendChild(codeEl);
        container.appendChild(pre);
        return;
    }

    // 模式 B：富文本 Markdown / 结构化渲染
    const blocks = parseMarkdownBlocks(text);

    for (const block of blocks) {
        if (block.type === "hr") {
            const hr = doc.createElement("hr");
            hr.className = "xlc-md-hr";
            container.appendChild(hr);
            continue;
        }

        if (block.type === "code-fence") {
            const pre = doc.createElement("pre");
            pre.className = "xlc-preview-code xlc-preview-code--inline";
            pre.tabIndex = 0;
            if (typeof pre.setAttribute === "function") {
                pre.setAttribute("role", "region");
                pre.setAttribute("aria-label", "代码块预览");
            }
            const codeEl = doc.createElement("code");
            const cLines = block.rawText.split(/\r?\n/);
            for (const cl of cLines) {
                const lineDiv = doc.createElement("div");
                lineDiv.className = "xlc-code-line";
                const tokens = tokenizeCodeLine(cl, block.lang || "");
                for (const token of tokens) {
                    if (token.type === "plain") {
                        lineDiv.appendChild(doc.createTextNode(token.text));
                    } else {
                        const tokSpan = doc.createElement("span");
                        tokSpan.className = `xlc-tok xlc-tok--${token.type}`;
                        tokSpan.textContent = token.text;
                        lineDiv.appendChild(tokSpan);
                    }
                }
                codeEl.appendChild(lineDiv);
            }
            pre.appendChild(codeEl);
            container.appendChild(pre);
            continue;
        }

        if (block.type === "table" && block.tableHeader) {
            const wrap = doc.createElement("div");
            wrap.className = "xlc-md-table-wrap";
            wrap.tabIndex = 0;
            if (typeof wrap.setAttribute === "function") {
                wrap.setAttribute("role", "region");
                wrap.setAttribute("aria-label", "表格内容预览");
            }
            const table = doc.createElement("table");
            table.className = "xlc-md-table";

            const thead = doc.createElement("thead");
            const trHead = doc.createElement("tr");
            block.tableHeader.forEach((h, colIndex) => {
                const th = doc.createElement("th");
                const align = block.tableAlignments?.[colIndex] || "left";
                th.className = `xlc-md-th xlc-align-${align}`;
                th.style.textAlign = align;
                th.textContent = h;
                trHead.appendChild(th);
            });
            thead.appendChild(trHead);
            table.appendChild(thead);

            if (block.tableData && block.tableData.length > 0) {
                const tbody = doc.createElement("tbody");
                for (const row of block.tableData) {
                    const tr = doc.createElement("tr");
                    row.forEach((cell, colIndex) => {
                        const td = doc.createElement("td");
                        const align = block.tableAlignments?.[colIndex] || "left";
                        td.className = `xlc-md-td xlc-align-${align}`;
                        td.style.textAlign = align;
                        td.textContent = cell;
                        tr.appendChild(td);
                    });
                    tbody.appendChild(tr);
                }
                table.appendChild(tbody);
            }
            wrap.appendChild(table);
            container.appendChild(wrap);
            continue;
        }

        if (block.type === "callout") {
            const card = doc.createElement("div");
            const cType = (block.calloutType || "NOTE").toLowerCase();
            card.className = `xlc-md-callout xlc-md-callout--${cType}`;
            if (typeof card.setAttribute === "function") {
                card.setAttribute("role", "note");
                card.setAttribute("aria-label", `${block.calloutTitle || block.calloutType || "NOTE"} 提示卡片`);
            }

            const head = doc.createElement("div");
            head.className = "xlc-md-callout-header";

            const iconSpan = doc.createElement("span");
            iconSpan.className = "xlc-md-callout-icon";
            let iconText = "💡";
            if (cType === "warning" || cType === "caution") iconText = "⚠️";
            else if (cType === "danger") iconText = "🛑";
            else if (cType === "tip") iconText = "🚀";
            else if (cType === "important") iconText = "📌";
            else if (cType === "info") iconText = "ℹ️";
            else if (cType === "success") iconText = "✅";
            else if (cType === "question") iconText = "❓";
            else if (cType === "example") iconText = "📑";
            iconSpan.textContent = iconText;
            head.appendChild(iconSpan);

            const titleSpan = doc.createElement("span");
            titleSpan.className = "xlc-md-callout-title";
            titleSpan.textContent = block.calloutTitle || block.calloutType || "NOTE";
            head.appendChild(titleSpan);

            card.appendChild(head);

            if (block.calloutBodyLines && block.calloutBodyLines.length > 0) {
                const bodyWrap = doc.createElement("div");
                bodyWrap.className = "xlc-md-callout-body";
                for (const bLine of block.calloutBodyLines) {
                    const p = doc.createElement("p");
                    p.className = "xlc-md-callout-p";
                    const inlines = tokenizeMarkdownInlines(bLine);
                    for (const tok of inlines) {
                        if (tok.type === "bold") {
                            const b = doc.createElement("strong");
                            b.className = "xlc-md-bold";
                            b.textContent = tok.text;
                            p.appendChild(b);
                        } else if (tok.type === "code") {
                            const code = doc.createElement("code");
                            code.className = "xlc-md-inline-code";
                            code.textContent = tok.text;
                            p.appendChild(code);
                        } else if (tok.type === "variable") {
                            const varSpan = doc.createElement("span");
                            varSpan.className = "xlc-md-var";
                            varSpan.textContent = tok.text;
                            p.appendChild(varSpan);
                        } else if (tok.type === "link" && tok.url) {
                            const a = doc.createElement("a");
                            a.className = "xlc-md-link";
                            a.textContent = tok.text;
                            a.href = tok.url;
                            p.appendChild(a);
                        } else {
                            p.appendChild(doc.createTextNode(tok.text));
                        }
                    }
                    bodyWrap.appendChild(p);
                }
                card.appendChild(bodyWrap);
            }

            container.appendChild(card);
            continue;
        }

        let el: HTMLElement;
        if (block.type === "h1") {
            el = doc.createElement("div");
            el.className = "xlc-md-h xlc-md-h1";
            if (typeof el.setAttribute === "function") {
                el.setAttribute("role", "heading");
                el.setAttribute("aria-level", "1");
            }
        } else if (block.type === "h2") {
            el = doc.createElement("div");
            el.className = "xlc-md-h xlc-md-h2";
            if (typeof el.setAttribute === "function") {
                el.setAttribute("role", "heading");
                el.setAttribute("aria-level", "2");
            }
        } else if (block.type === "h3") {
            el = doc.createElement("div");
            el.className = "xlc-md-h xlc-md-h3";
            if (typeof el.setAttribute === "function") {
                el.setAttribute("role", "heading");
                el.setAttribute("aria-level", "3");
            }
        } else if (block.type === "quote") {
            el = doc.createElement("blockquote");
            el.className = "xlc-md-quote";
            if (typeof el.setAttribute === "function") {
                el.setAttribute("role", "note");
                el.setAttribute("aria-label", "引用文本");
            }
        } else if (block.type === "list-bullet") {
            el = doc.createElement("div");
            el.className = "xlc-md-list-item";
            if (typeof el.setAttribute === "function") {
                el.setAttribute("role", "listitem");
            }
            const bullet = doc.createElement("span");
            bullet.className = "xlc-md-bullet";
            bullet.textContent = "•";
            el.appendChild(bullet);
        } else if (block.type === "list-ordered") {
            el = doc.createElement("div");
            el.className = "xlc-md-list-item";
            if (typeof el.setAttribute === "function") {
                el.setAttribute("role", "listitem");
            }
            const num = doc.createElement("span");
            num.className = "xlc-md-ordered-num";
            num.textContent = "›";
            el.appendChild(num);
        } else if (block.type === "task-item") {
            el = doc.createElement("div");
            el.className = "xlc-md-list-item xlc-md-task-item" + (block.isDone ? " xlc-md-task--done" : "") + (block.isNested ? " xlc-md-nested" : "");
            if (typeof el.setAttribute === "function") {
                el.setAttribute("role", "listitem");
            }
            const checkbox = doc.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "b3-switch xlc-md-task-checkbox";
            checkbox.checked = Boolean(block.isDone);
            checkbox.disabled = true;
            if (typeof checkbox.setAttribute === "function") {
                checkbox.setAttribute("aria-label", block.rawText.slice(0, 40) || "任务待办状态");
            }
            el.appendChild(checkbox);
        } else {
            el = doc.createElement("p");
            el.className = "xlc-md-p";
        }

        // 挂载行内 Token
        for (const inline of block.inlines) {
            if (inline.type === "text") {
                el.appendChild(doc.createTextNode(inline.text));
            } else if (inline.type === "bold") {
                const strong = doc.createElement("strong");
                strong.className = "xlc-md-bold";
                strong.textContent = inline.text;
                el.appendChild(strong);
            } else if (inline.type === "code") {
                const code = doc.createElement("code");
                code.className = "xlc-md-inline-code";
                code.textContent = inline.text;
                el.appendChild(code);
            } else if (inline.type === "variable") {
                const varSpan = doc.createElement("span");
                varSpan.className = "xlc-tok xlc-tok--variable";
                varSpan.textContent = inline.text;
                el.appendChild(varSpan);
            } else if (inline.type === "link") {
                const linkSpan = doc.createElement("span");
                linkSpan.className = "xlc-md-link";
                linkSpan.textContent = inline.text;
                if (inline.url) {
                    linkSpan.title = inline.url;
                    if (typeof linkSpan.setAttribute === "function") {
                        linkSpan.setAttribute("aria-label", `${inline.text} (链接目标: ${inline.url})`);
                    }
                }
                el.appendChild(linkSpan);
            }
        }

        // 空行用零宽空白或换行保持间距
        if (block.inlines.length === 0 && block.rawText.length === 0) {
            el.appendChild(doc.createTextNode("\u00A0"));
        }

        container.appendChild(el);
    }
}

export interface DualMacroPreviewLabels {
    templateSource?: string;
    expandedEffect?: string;
}

/**
 * 宏条目双态实时预览渲染器（消除盲插焦虑）：
 * 同时展示「模板源码」与「展开后真实效果」
 */
export function renderDualMacroPreview(
    container: HTMLElement,
    rawTemplateText: string,
    expandedText: string,
    itemType: ItemType | undefined,
    labels: DualMacroPreviewLabels = {},
): void {
    const doc = container.ownerDocument || document;
    container.textContent = "";

    const dualWrap = doc.createElement("div");
    dualWrap.className = "xlc-preview-dual";
    if (typeof dualWrap.setAttribute === "function") {
        dualWrap.setAttribute("role", "region");
        dualWrap.setAttribute("aria-label", "宏模板源码与展开效果双态实时预览");
    }

    // 1. 模板源码卡片
    const sourceCard = doc.createElement("div");
    sourceCard.className = "xlc-preview-card xlc-preview-card--source";
    if (typeof sourceCard.setAttribute === "function") {
        sourceCard.setAttribute("role", "region");
        sourceCard.setAttribute("aria-label", labels.templateSource || "模板源码");
    }

    const sourceHead = doc.createElement("div");
    sourceHead.className = "xlc-preview-card-head";

    const sourceTitle = doc.createElement("span");
    sourceTitle.className = "xlc-preview-card-title";
    if (typeof sourceTitle.setAttribute === "function") {
        sourceTitle.setAttribute("role", "heading");
        sourceTitle.setAttribute("aria-level", "3");
    }
    sourceTitle.textContent = `📝 ${labels.templateSource || "模板源码"}`;

    const sourceBadge = doc.createElement("span");
    sourceBadge.className = "xlc-preview-card-pill";
    sourceBadge.textContent = "RAW";

    sourceHead.appendChild(sourceTitle);
    sourceHead.appendChild(sourceBadge);
    sourceCard.appendChild(sourceHead);

    const sourcePre = doc.createElement("pre");
    sourcePre.className = "xlc-preview-source-code";
    sourcePre.tabIndex = 0;
    if (typeof sourcePre.setAttribute === "function") {
        sourcePre.setAttribute("role", "region");
        sourcePre.setAttribute("aria-label", "模板源码文本");
    }
    const sourceCode = doc.createElement("code");
    sourceCode.textContent = rawTemplateText;
    sourcePre.appendChild(sourceCode);
    sourceCard.appendChild(sourcePre);
    dualWrap.appendChild(sourceCard);

    // 2. 展开后真实效果卡片
    const expandedCard = doc.createElement("div");
    expandedCard.className = "xlc-preview-card xlc-preview-card--expanded";
    if (typeof expandedCard.setAttribute === "function") {
        expandedCard.setAttribute("role", "region");
        expandedCard.setAttribute("aria-label", labels.expandedEffect || "展开后真实效果");
    }

    const expandedHead = doc.createElement("div");
    expandedHead.className = "xlc-preview-card-head";

    const expandedTitle = doc.createElement("span");
    expandedTitle.className = "xlc-preview-card-title";
    if (typeof expandedTitle.setAttribute === "function") {
        expandedTitle.setAttribute("role", "heading");
        expandedTitle.setAttribute("aria-level", "3");
    }
    expandedTitle.textContent = `⚡ ${labels.expandedEffect || "展开后真实效果"}`;

    const expandedBadge = doc.createElement("span");
    expandedBadge.className = "xlc-preview-card-pill xlc-preview-card-pill--live";
    expandedBadge.textContent = "LIVE";

    expandedHead.appendChild(expandedTitle);
    expandedHead.appendChild(expandedBadge);
    expandedCard.appendChild(expandedHead);

    const expandedBody = doc.createElement("div");
    expandedBody.className = "xlc-preview-expanded-body";
    renderSafePreview(expandedBody, expandedText, itemType);
    expandedCard.appendChild(expandedBody);
    dualWrap.appendChild(expandedCard);

    container.appendChild(dualWrap);
}
