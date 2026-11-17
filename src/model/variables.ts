// 变量模型（R67/F1，质感基准 docs/design/prototype.html 屏 4；R160 v2）：
// ask 语法 {{xlc:ask:名称}} 文本 / {{xlc:ask:名称|A,B,C}} 下拉 / {{xlc:ask:名称|date}} 日期
// / {{xlc:ask:名称|textarea}} 多行文本（R160；填充卡渲染 textarea，Enter 换行、按钮插入）。
// —— ask 与动态占位符（placeholders.ts）分离：ask 在插入前由填充卡片收集，存储内容永远保留模板原文。
// 不可用变量诚实降级：插入路径上未填充的 ask 展开为 __名称__（可见可改，绝不静默丢）。
// code 条目不处理变量：代码中的 {{xlc:…}} 是字面文本（与 r23 决策一致）。
// 片段嵌套（R72/F5）：{{xlc:snippet:标题}} 引用其他条目，插入时由 library.expandSnippetRefs 展开
// （深度 ≤3、环检测；此处只提供语法模式与光标/检测工具）。

import {LIMITS} from "../constants";
import {applyPlaceholders} from "./placeholders";

export type AskFieldKind = "text" | "select" | "date" | "textarea" | "toggle" | "multi";

export interface AskField {
    /** 字段名（label；同名去重后只询问一次） */
    name: string;
    kind: AskFieldKind;
    /** select 选项列表 */
    options: string[];
    /** 默认填充建议值（由 {{xlc:ask:名称=默认值}} 或 {{xlc:ask:名称|默认值}} 提取） */
    defaultValue?: string;
}

// 名称禁 | 与 }；选项段不含 }。支持 {{xlc:ask:...}} 及 Espanso / Templater 风格 {{input:...}}、{{select:...}}、{{choice:...}}。
export const ASK_PATTERN = /\{\{(?:(?:xlc:)?ask:|input:|select:|choice:)([^:|}]+)(?:[:|]([^}]*))?\}\}/g;

export function parseAskField(rawName: string, rawOptions: string | undefined): AskField | null {
    let name = rawName.trim().slice(0, LIMITS.tag);
    let defaultValue: string | undefined;
    const eqIdx = name.indexOf("=");
    if (eqIdx !== -1) {
        defaultValue = name.slice(eqIdx + 1).trim().slice(0, LIMITS.askValueChars);
        name = name.slice(0, eqIdx).trim().slice(0, LIMITS.tag);
    }
    if (!name) return null;
    let isMulti = false;
    let cleanRawOptions = rawOptions ?? "";
    if (cleanRawOptions.includes("|")) {
        const parts = cleanRawOptions.split("|");
        const suffix = parts[parts.length - 1]?.trim().toLowerCase() ?? "";
        if (["multi", "multiple", "checkboxes", "mselect", "多选"].includes(suffix)) {
            isMulti = true;
            cleanRawOptions = parts.slice(0, parts.length - 1).join("|");
        }
    } else if (/^(?:multi|multiple|多选)\s*[:：]/i.test(cleanRawOptions)) {
        isMulti = true;
        cleanRawOptions = cleanRawOptions.replace(/^(?:multi|multiple|多选)\s*[:：]/i, "");
    }

    const options = cleanRawOptions
        .split(/[,，、|]/)
        .map((s) => s.trim().slice(0, LIMITS.tag))
        .filter(Boolean)
        .slice(0, 16);
    if (isMulti && options.length > 0) {
        return {name, kind: "multi", options, ...(defaultValue ? {defaultValue} : {})};
    }
    // date/textarea/toggle 单选项大小写不敏感（R139/R160/G49）
    const firstOpt = options[0]?.toLowerCase() ?? "";
    if (options.length === 1 && firstOpt === "date") return {name, kind: "date", options: [], ...(defaultValue ? {defaultValue} : {})};
    if (options.length === 1 && firstOpt === "textarea") return {name, kind: "textarea", options: [], ...(defaultValue ? {defaultValue} : {})};
    if (options.length === 1 && ["toggle", "checkbox", "switch", "bool", "开关"].includes(firstOpt)) {
        return {name, kind: "toggle", options: [], ...(defaultValue ? {defaultValue} : {})};
    }
    if (options.length >= 2) return {name, kind: "select", options, ...(defaultValue ? {defaultValue} : {})};
    if (options.length === 1 && !defaultValue) {
        defaultValue = options[0];
    }
    return {name, kind: "text", options: [], ...(defaultValue ? {defaultValue} : {})};
}

/** 字段语法回显（填充卡片/预览 chip 共用）：展示与解析口径一致，不各写一份模板字符串。 */
export function askFieldTag(field: AskField): string {
    const nameWithDef = field.defaultValue && field.kind === "text" && field.options.length === 0
        ? `${field.name}=${field.defaultValue}`
        : field.name;
    if (field.kind === "text") return field.defaultValue && field.options.length === 0 ? `{{xlc:ask:${nameWithDef}}}` : `{{xlc:ask:${field.name}}}`;
    if (field.kind === "select") return `{{xlc:ask:${field.name}|${field.options.join(",")}}}`;
    if (field.kind === "multi") return `{{xlc:ask:${field.name}|${field.options.join(",")}|multi}}`;
    if (field.kind === "toggle") return field.defaultValue ? `{{xlc:ask:${field.name}=${field.defaultValue}|toggle}}` : `{{xlc:ask:${field.name}|toggle}}`;
    return `{{xlc:ask:${field.name}|${field.kind}}}`;
}

/** 列出文本中的 ask 字段（同名去重，保留首次出现的形态）。 */
export function listAskFields(text: string): AskField[] {
    if (!text) return [];
    const fields: AskField[] = [];
    const seen = new Set<string>();
    for (const match of text.matchAll(ASK_PATTERN)) {
        const field = parseAskField(match[1] ?? "", match[2]);
        if (!field || seen.has(field.name)) continue;
        seen.add(field.name);
        fields.push(field);
        if (fields.length >= 16) break;
    }
    return fields;
}

export function countAskFields(text: string): number {
    return listAskFields(text).length;
}

/** 填充值清洗：去首尾空白、限长（多行合法）。 */
function cleanFillValue(v: string): string {
    return (v ?? "").trim().slice(0, LIMITS.askValueChars);
}

/**
 * 用填充值展开 ask。未提供值的字段展开为 __名称__（SiYuan 模板占位惯例，可见可改，不静默丢）。
 * 填充值中若含占位符/ask 语法，不再二次展开（防注入式套娃）。
 */
export function expandAsks(text: string, fills: Record<string, string>): string {
    if (!text) return text;
    return text.replace(ASK_PATTERN, (_match, rawName: string, rawOptions?: string) => {
        const field = parseAskField(rawName, rawOptions);
        if (!field) return _match;
        if (field.kind === "toggle") {
            if (Object.prototype.hasOwnProperty.call(fills, field.name)) {
                const filled = fills[field.name]?.trim() ?? "";
                if (filled === "" || filled === "false" || filled === "0" || filled === "否") {
                    return "";
                }
                return cleanFillValue(filled === "true" || filled === "是" ? (field.defaultValue || "是") : filled);
            }
            if (field.defaultValue) return cleanFillValue(field.defaultValue);
            return "";
        }
        const filled = Object.prototype.hasOwnProperty.call(fills, field.name) ? cleanFillValue(fills[field.name] ?? "") : "";
        if (filled) return filled;
        if (field.defaultValue) return cleanFillValue(field.defaultValue);
        return `__${field.name}__`;
    });
}

/** 插入路径上未填充 ask 的默认展开（插入前询问关闭/绕过时）：__名称__ 可见兜底。 */
export function applyAskDefaults(text: string): string {
    return expandAsks(text, {});
}

/** {{cursor}} / {{xlc:cursor}} / $|$ 光标落点标记（对标 Espanso 与 Templater 核心体验） */
export const CURSOR_TOKEN = "{{xlc:cursor}}";
export const CURSOR_TOKENS = ["{{cursor}}", "{{xlc:cursor}}", "$|$"] as const;
export const CURSOR_PATTERN = /\{\{\s*(?:xlc:)?cursor\s*\}\}|\$\|\$/gi;

/** 剥离全部光标占位符标记 */
export function stripCursorToken(text: string): string {
    if (!text) return "";
    return text.replace(CURSOR_PATTERN, "");
}

/** 检测文本中是否包含任何光标锚点 */
export function hasCursorToken(text: string): boolean {
    if (!text) return false;
    CURSOR_PATTERN.lastIndex = 0;
    return CURSOR_PATTERN.test(text);
}

export interface CursorPositionResult {
    text: string;
    cursorOffset: number | null;
}

/**
 * 提取并剥离光标锚点，计算首个光标位置偏移（对标 Espanso $|$ 与 {{cursor}}）
 */
export function extractCursorPosition(text: string): CursorPositionResult {
    if (!text) return {text: "", cursorOffset: null};
    CURSOR_PATTERN.lastIndex = 0;
    const match = CURSOR_PATTERN.exec(text);
    if (!match) {
        return {text, cursorOffset: null};
    }
    const firstIdx = match.index;
    const matchedLen = match[0].length;
    const before = text.slice(0, firstIdx);
    const after = text.slice(firstIdx + matchedLen);
    const cleanedAfter = after.replace(CURSOR_PATTERN, "");
    return {
        text: before + cleanedAfter,
        cursorOffset: before.length,
    };
}

/** 片段引用语法（F5）：标题不含 }；展开语义见 library.expandSnippetRefs */
export const SNIPPET_PATTERN = /\{\{xlc:snippet:([^}]+)\}\}/g;

export interface SnippetRefDiagnosis {
    /** 引用的所有片段标题（去重，保留首次出现顺序，最多 16 个） */
    referencedTitles: string[];
    /** 缺失的片段标题（当前已知可用标题集合中不存在的项） */
    missingTitles: string[];
    /** 是否包含任何片段引用语法 */
    hasSnippets: boolean;
}

/** 解析并列出文本中出现的片段引用标题（去重、去首尾空白、限长截断，最多 16 个）。 */
export function listSnippetRefs(text: string): string[] {
    if (!text || !text.includes("{{xlc:snippet:")) return [];
    const titles: string[] = [];
    const seen = new Set<string>();
    for (const match of text.matchAll(SNIPPET_PATTERN)) {
        const title = (match[1] ?? "").trim().slice(0, LIMITS.title);
        if (!title || seen.has(title)) continue;
        seen.add(title);
        titles.push(title);
        if (titles.length >= 16) break;
    }
    return titles;
}

/** 诊断文本中的片段引用完整性：判断是否有引用、提取引用列表并核对缺失项。 */
export function diagnoseSnippetRefs(
    text: string,
    availableTitles?: ReadonlySet<string> | ReadonlyMap<string, unknown> | readonly string[],
): SnippetRefDiagnosis {
    const referencedTitles = listSnippetRefs(text);
    if (referencedTitles.length === 0) {
        return {referencedTitles: [], missingTitles: [], hasSnippets: false};
    }
    let availableSet: ReadonlySet<string> | null = null;
    if (availableTitles) {
        if (availableTitles instanceof Set) {
            availableSet = availableTitles;
        } else if (availableTitles instanceof Map) {
            availableSet = new Set(availableTitles.keys());
        } else if (Array.isArray(availableTitles)) {
            availableSet = new Set(availableTitles);
        }
    }
    const missingTitles = availableSet
        ? referencedTitles.filter((title) => !availableSet!.has(title))
        : [];
    return {
        referencedTitles,
        missingTitles,
        hasSnippets: true,
    };
}

/**
 * 剥离所有变量与宏标记，有默认值取默认值，无默认值剥离为空白（或保留字段名）
 */
export function stripAllVariables(text: string, useDefault = true): string {
    if (!text) return "";
    let res = text.replace(ASK_PATTERN, (_m, rawName: string, rawOptions?: string) => {
        const field = parseAskField(rawName, rawOptions);
        if (!field) return "";
        return useDefault && field.defaultValue ? field.defaultValue : "";
    });
    // 剥离光标锚点与占位符
    res = stripCursorToken(res);
    res = res.replace(/\{\{(?:xlc:[^}]*|date[^}]*|time[^}]*|datetime[^}]*|doc\.[^}]*|clipboard)\}\}/g, "");
    return res;
}

/**
 * 判断文本是否包含需要动态展开的宏（变量、占位符、日期偏移、光标锚点等）
 */
export function hasDynamicMacros(text: string): boolean {
    if (!text) return false;
    if (text.includes("$|$")) return true;
    if (!text.includes("{{")) return false;
    return (
        hasCursorToken(text) ||
        countAskFields(text) > 0 ||
        /\{\{(?:xlc:|date|time|datetime|input:|select:|choice:|clipboard|cursor|doc\.)/i.test(text)
    );
}

/**
 * 展开宏预览真实效果（消除盲插焦虑）：
 * 1. 变量用默认值或 __字段名__ 展开；
 * 2. 占位符展开为真实日期、时间、文档信息；
 * 3. 剪贴板/光标/生态宏安全示意化展开。
 */
export function expandMacroPreview(
    text: string,
    now: Date = new Date(),
    doc?: {title: string; path: string} | null,
): string {
    if (!text) return "";
    // 1. 展开交互式微表单字段（默认值或 __字段名__）
    let out = expandAsks(text, {});
    // 2. 剥离光标锚点
    out = stripCursorToken(out);
    // 3. 展开动态占位符（日期算术、时间、文档上下文、计算、UUID 等）
    out = applyPlaceholders(out, now, true, doc);
    out = out.replace(/\{\{date\}\}/g, () => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`);
    out = out.replace(/\{\{time\}\}/g, () => `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
    out = out.replace(/\{\{datetime\}\}/g, () => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
    // 4. 替换剪贴板占位符为通用示意预览
    out = out.replaceAll("{{xlc:clipboard}}", "（剪贴板内容）").replaceAll("{{clipboard}}", "（剪贴板内容）");
    // 5. 替换生态宏占位符为示意内容
    if (out.includes("{{xlc:checkin:today}}")) {
        out = out.replaceAll("{{xlc:checkin:today}}", "✓ 今日打卡已完成");
    }
    if (out.includes("{{xlc:home:today}}") || out.includes("{{xlc:butler:today}}")) {
        out = out.replaceAll("{{xlc:home:today}}", "今日备忘一览：\n1. 团队周会\n2. 代码评审")
                 .replaceAll("{{xlc:butler:today}}", "今日备忘一览：\n1. 团队周会\n2. 代码评审");
    }
    if (out.includes("{{xlc:task:today}}")) {
        out = out.replaceAll("{{xlc:task:today}}", "今日任务清单：\n- [ ] 完成产品发版\n- [ ] 同步需求进度");
    }
    if (out.includes("{{xlc:glean:recent}}")) {
        out = out.replaceAll("{{xlc:glean:recent}}", "最近剪藏摘录：\n- [认知升级与笔记哲学](https://example.com) > 知识的本质是网络连接");
    }
    if (out.includes("{{xlc:contacts:recent}}")) {
        out = out.replaceAll("{{xlc:contacts:recent}}", "最近联系人：\n· 张经理 (研发部) - 架构师");
    }
    return out;
}

