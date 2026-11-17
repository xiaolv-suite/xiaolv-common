// 动态占位符（参考 Quicker 常用语核心能力；R6/R11；R67 v2；R160 v3；R161 参数分隔符改 |；R274 G16 日期时间格式化与算术引擎）：
// 基础语法 {{xlc:date}} {{xlc:time}} {{xlc:datetime}} {{xlc:weekday}} {{xlc:title}} {{xlc:path}} {{xlc:doc}}
// 日期算术（R160，对齐 Espanso/TextExpander 核心差距）：{{xlc:date|+3d}} {{xlc:date|-1w}} {{xlc:date|+2m}}
//   {{xlc:date|+1y}} {{xlc:date|next_monday}} —— 月/年进位按日历钳制（1/31 +1m → 2/28），next_* 取严格未来最近一天。
//   中文自然语言快捷（T-0112）：{{xlc:date|明天}} {{xlc:date|后天}} {{xlc:date|昨天}} {{xlc:date|下周五}} 等。
// 自定义格式化与复合算术（T-0127 / R274 / G16）：
//   {{xlc:date|YYYY年MM月DD日}} {{xlc:date|+3d|YYYY/MM/DD}} {{xlc:date|明天|YYYY年MM月DD日}}
//   {{xlc:time|HH:mm:ss}} {{xlc:time|+1h|HH:mm:ss}} {{xlc:time|+30m}}
//   {{xlc:datetime|YYYY-MM-DD HH:mm:ss}} {{xlc:datetime|明天|YYYY/MM/DD HH:mm}}
//   {{xlc:weekday|full}} (星期X) {{xlc:weekday|en}} (Monday) {{xlc:weekday|en_short}} (Mon)
// UUID 与紧凑短 ID（T-0128 / R275 / G17）：
//   {{xlc:uuid}} (标准小写 36 字符) {{xlc:uuid|upper}} (大写) {{xlc:uuid|simple}} (32 位无连字符)
//   {{xlc:id}} (默认 8 位去混淆短 ID) {{xlc:id|12}} (指定 4~32 位长度) {{xlc:id|upper}} (大写短 ID)
// 文本大小写与命名范式转换（T-0130 / R277 / G19）：
//   {{xlc:case|upper|text}} (大写) {{xlc:case|lower|TEXT}} (小写)
//   {{xlc:case|title|hello world}} (首字母大写 Hello World)
//   {{xlc:case|camel|user login token}} (小驼峰 userLoginToken)
//   {{xlc:case|pascal|user login token}} (大驼峰 UserLoginToken)
//   {{xlc:case|snake|user login token}} (下划线 user_login_token)
//   {{xlc:case|kebab|user login token}} (短横线 user-login-token)
//   {{xlc:case|constant|user login token}} (常量大写 USER_LOGIN_TOKEN)
//   兼容冒号子命令形态：{{xlc:case:upper|text}}
// 安全内联算术计算（T-0131 / R278 / G20）：
//   {{xlc:calc|100*1.13}} {{xlc:calc|round(100/3, 2)}} {{xlc:calc|(50+30)*0.8}}
// 选区包裹模式（T-0134 / R281 / G23）：
//   {{xlc:selection}} {{xlc:selection|默认内容}} (无选区时回退默认内容或空串)
// 正则提取与替换过滤器（T-0136 / R283 / G25）：
//   {{xlc:regex|extract|\d+|TEXT}} (提取首个匹配或第一捕获组)
//   {{xlc:regex|replace|旧|新|TEXT}} (全局正则替换)
//   兼容冒号子命令形态：{{xlc:regex:extract|\d+|TEXT}} {{xlc:regex:replace|旧|新|TEXT}}

import {evaluateMathExpression} from "./calculator";
import {encodeBase64, decodeBase64, encodeUrlText, decodeUrlText, escapeHtmlEntities, unescapeHtmlEntities, generateTextHash, numberLines, truncateText, maskSensitiveText, formatChineseCurrency, formatByteSize, reverseText, explainCronExpression, formatRelativeTime, extractExecutiveSummary, getChineseZodiacAndStemBranch, pickWeightedOption, numberToEnglishWords, convertColorFormat, calculateStats, convertRadix, extractKvValue, formatByRegexGroups, validateFormat, DataFormatType, parsePathParts, generateNanoId, renderSimpleTemplate, obfuscateText, ObfuscateMode, regexReplaceMultiline, scrambleText, formatNumberGrouping, calculateChecksum, padOrTruncate, generateNumericSequence, generateShortHash, generateRandomColor, ColorTone, truncateByBytes, extractChinesePinyinInitials, pluralizeText, escapeMacroPipe, repeatText, centerText, escapeBackslash, reverseWords, generateRandomName, evaluateTernaryCondition, maskTextRange, censorText, shuffleList, formatTaskProgressBar, queryJsonPath} from "./clipboard-cleaner";
import {extractUrlComponent, prefixLines, suffixLines, csvToList, buildUrlQuery} from "../service/text-formatting";
// 随机选择（R160）：{{xlc:random|a,b,c}} —— 每次替换随机取一项（每选项前后空白忽略）。
// 带参语法分隔符必须是 | 而非 :（R161 真机验收发现）：Lute 把 :date: 当 emoji 短代码转换，
// {{xlc:date:+3d}} 落库即损坏成 {{xlc📅+3d}}；ask 冒号语法无此问题（:ask: 非短代码，真机已验证）。
// —— xlc: 命名空间避免与思源模板 {{...}} / 用户正文冲突；未知占位符与非法表达式一律原样保留（不吞内容）。
// title/path 引用当前文档（R11）；doc 为 title 别名（原型 v3 命名，R67）；无活动文档时替换为空串（不把占位符残留在正文里）。
// {{xlc:clipboard}} 剪贴板文本由执行层异步替换（applyOutput；读取失败替换为空串，语义与 title/path 一致）。
// {{xlc:cursor}} 与 {{xlc:ask:…}} 不在本模型：分别见 variables.ts（插入路径专用）。
// 替换时机：插入/复制时（executor 输出载荷）；条目存储内容永远保留模板原文。

export type PlaceholderKind = "date" | "time" | "datetime" | "weekday" | "year" | "quarter" | "month" | "day" | "hour" | "minute" | "title" | "path" | "doc" | "random" | "uuid" | "id" | "nanoid" | "password" | "count" | "case" | "calc" | "selection" | "regex" | "timestamp" | "week" | "greeting" | "url" | "base64" | "html" | "hash" | "number" | "truncate" | "mask" | "currency" | "filesize" | "reverse" | "cron" | "timeago" | "summary" | "lunar" | "choose" | "words" | "color" | "stats" | "radix" | "kv" | "match" | "valid" | "template" | "obfuscate" | "scramble" | "thousands" | "checksum" | "pad" | "seq" | "fingerprint" | "randomcolor" | "btruncate" | "initials" | "plural" | "escape" | "repeat" | "center" | "slash" | "revwords" | "randomname" | "if" | "smask" | "censor" | "shuffle" | "progress" | "json" | "line" | "csv" | "achievement" | "home_board" | "review_card" | "exam_scorecard" | "reading_digest" | "meeting_brief" | "checkin" | "home" | "cards" | "exam" | "glean" | "contacts";

// 带参形态只接受 | 分隔：: 分隔会撞 Lute emoji 短代码（:date:→📅，R161 真机实证），永不支持。
// 参数段匹配直到连续双右花括号 }} 为止，允许正则或表达式中包含单个花括号量词（如 {\d+}）。
export const PLACEHOLDER_PATTERN = /\{\{xlc:(date|time|datetime|weekday|year|quarter|month|day|hour|minute|title|path(?::[a-zA-Z0-9_-]+)?|doc|random|uuid|nanoid(?::[a-zA-Z0-9_-]+)?|id|password|calc|selection|timestamp|week|greeting|achievement|home_board|review_card|exam_scorecard|reading_digest|meeting_brief|checkin(?::[a-zA-Z0-9_-]+)?|home(?::[a-zA-Z0-9_-]+)?|cards(?::[a-zA-Z0-9_-]+)?|exam(?::[a-zA-Z0-9_-]+)?|glean(?::[a-zA-Z0-9_-]+)?|contacts(?::[a-zA-Z0-9_-]+)?|json(?::[a-zA-Z0-9_-]+)?|line(?::[a-zA-Z0-9_-]+)?|csv(?::[a-zA-Z0-9_-]+)?|progress(?::[a-zA-Z0-9_-]+)?|shuffle(?::[a-zA-Z0-9_-]+)?|censor(?::[a-zA-Z0-9_-]+)?|smask(?::[a-zA-Z0-9_-]+)?|if(?::[a-zA-Z0-9_-]+)?|randomname(?::[a-zA-Z0-9_-]+)?|revwords(?::[a-zA-Z0-9_-]+)?|slash(?::[a-zA-Z0-9_-]+)?|center(?::[a-zA-Z0-9_-]+)?|repeat(?::[a-zA-Z0-9_-]+)?|escape(?::[a-zA-Z0-9_-]+)?|plural(?::[a-zA-Z0-9_-]+)?|initials(?::[a-zA-Z0-9_-]+)?|btruncate(?::[a-zA-Z0-9_-]+)?|randomcolor(?::[a-zA-Z0-9_-]+)?|fingerprint(?::[a-zA-Z0-9_-]+)?|seq(?::[a-zA-Z0-9_-]+)?|pad(?::[a-zA-Z0-9_-]+)?|checksum(?::[a-zA-Z0-9_-]+)?|thousands(?::[a-zA-Z0-9_-]+)?|scramble(?::[a-zA-Z0-9_-]+)?|obfuscate(?::[a-zA-Z0-9_-]+)?|template(?::[a-zA-Z0-9_-]+)?|valid(?::[a-zA-Z0-9_-]+)?|match(?::[a-zA-Z0-9_-]+)?|kv(?::[a-zA-Z0-9_-]+)?|radix(?::[a-zA-Z0-9_-]+)?|stats(?::[a-zA-Z0-9_-]+)?|color(?::[a-zA-Z0-9_-]+)?|words(?::[a-zA-Z0-9_-]+)?|choose(?::[a-zA-Z0-9_-]+)?|lunar(?::[a-zA-Z0-9_-]+)?|summary(?::[a-zA-Z0-9_-]+)?|timeago(?::[a-zA-Z0-9_-]+)?|cron(?::[a-zA-Z0-9_-]+)?|reverse(?::[a-zA-Z0-9_-]+)?|filesize(?::[a-zA-Z0-9_-]+)?|currency(?::[a-zA-Z0-9_-]+)?|number(?::[a-zA-Z0-9_-]+)?|truncate(?::[a-zA-Z0-9_-]+)?|mask(?::[a-zA-Z0-9_-]+)?|hash(?::[a-zA-Z0-9_-]+)?|url(?::[a-zA-Z0-9_-]+)?|base64(?::[a-zA-Z0-9_-]+)?|html(?::[a-zA-Z0-9_-]+)?|count(?::[a-zA-Z0-9_-]+)?|case(?::[a-zA-Z0-9_-]+)?|regex(?::[a-zA-Z0-9_-]+)?)(?:\|([\s\S]*?))?\}\}/g;

export type PlaceholderResolver = (kind: PlaceholderKind) => string;

const WEEKDAYS_ZH = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const WEEKDAYS_FULL_ZH = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
const WEEKDAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAYS_SHORT_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const ZH_RELATIVE_DAYS: Readonly<Record<string, number>> = {
    今天: 0,
    明天: 1,
    后天: 2,
    大后天: 3,
    昨天: -1,
    前天: -2,
    大前天: -3,
};

const ZH_NEXT_WEEKDAY: Readonly<Record<string, number>> = {
    下周一: 1, 下星期一: 1, 下礼拜一: 1,
    下周二: 2, 下星期二: 2, 下礼拜二: 2,
    下周三: 3, 下星期三: 3, 下礼拜三: 3,
    下周四: 4, 下星期四: 4, 下礼拜四: 4,
    下周五: 5, 下星期五: 5, 下礼拜五: 5,
    下周六: 6, 下星期六: 6, 下礼拜六: 6,
    下周日: 0, 下周天: 0, 下星期日: 0, 下星期天: 0, 下礼拜日: 0, 下礼拜天: 0,
};

// 日期算术参数：相对偏移 [+-]N(d|w|m|y) 与 next_星期；数字限 4 位防荒诞值。
const RELATIVE_ARG = /^([+-])(\d{1,4})([dwmy])$/;
const RELATIVE_TIME_ARG = /^([+-])(\d{1,4})([hms])$/i;
const NEXT_WEEKDAY_ARG = /^next_(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/;
// JS getDay(): 0=周日
const WEEKDAY_INDEX: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
};

// 格式化令牌：长优先匹配，支持 ISO 周次 ww/w、年 gggg 及转义方括号 [W]
export const FORMAT_TOKEN_PATTERN = /YYYY|YY|gggg|MM|M|DD|D|HH|H|hh|h|mm|m|ss|s|dddd|ddd|ww|w|A|a|\[[^\]]*\]/g;

function pad(n: number): string {
    return String(n).padStart(2, "0");
}

export function formatLocalDate(now: Date = new Date()): string {
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function renderDate(now: Date): string {
    return formatLocalDate(now);
}

/** 格式化日期时间对象，零依赖轻量替换 */
export function formatDateTime(date: Date, pattern: string): string {
    return pattern.replace(FORMAT_TOKEN_PATTERN, (token) => {
        if (token.startsWith("[") && token.endsWith("]")) {
            return token.slice(1, -1);
        }
        switch (token) {
            case "YYYY":
            case "gggg": return String(date.getFullYear());
            case "YY": return String(date.getFullYear()).slice(-2);
            case "MM": return pad(date.getMonth() + 1);
            case "M": return String(date.getMonth() + 1);
            case "DD": return pad(date.getDate());
            case "D": return String(date.getDate());
            case "HH": return pad(date.getHours());
            case "H": return String(date.getHours());
            case "hh": return pad(date.getHours() % 12 || 12);
            case "h": return String(date.getHours() % 12 || 12);
            case "mm": return pad(date.getMinutes());
            case "m": return String(date.getMinutes());
            case "ss": return pad(date.getSeconds());
            case "s": return String(date.getSeconds());
            case "dddd": return WEEKDAYS_FULL_ZH[date.getDay()] ?? "";
            case "ddd": return WEEKDAYS_ZH[date.getDay()] ?? "";
            case "ww": return pad(getIsoWeekNumber(date));
            case "w": return String(getIsoWeekNumber(date));
            case "A": return date.getHours() < 12 ? "上午" : "下午";
            case "a": return date.getHours() < 12 ? "am" : "pm";
            default: return token;
        }
    });
}

/** 检验是否为合法的时间格式模式（必须包含有效令牌，且不得包含未识别的 ASCII 字母） */
export function isValidFormatPattern(pattern: string): boolean {
    if (!pattern || !pattern.trim()) return false;
    let matchCount = 0;
    const stripped = pattern.replace(FORMAT_TOKEN_PATTERN, () => {
        matchCount++;
        return "";
    });
    if (matchCount === 0) return false;
    // 允许 ISO 分隔符 T/Z 以及空白和中文字符/标点
    const remainingLetters = stripped.replace(/[TZ]/g, "");
    if (/[A-Za-z]/.test(remainingLetters)) {
        return false;
    }
    return true;
}

/** 加 N 个月并把「日」钳制在目标月月末（1/31 +1m → 2/28；闰年 2/29 +1y → 2/28）。 */
function addMonthsClamped(base: Date, months: number): Date {
    const y = base.getFullYear();
    const m = base.getMonth() + months;
    const lastDay = new Date(y, m + 1, 0).getDate();
    return new Date(y, m, Math.min(base.getDate(), lastDay));
}

/** 计算日期偏移并返回目标 Date，非法参数返回 null */
export function calculateDateOffset(now: Date, rawArg: string): Date | null {
    const arg = rawArg.trim().toLowerCase();
    if (Object.prototype.hasOwnProperty.call(ZH_RELATIVE_DAYS, arg)) {
        const offset = ZH_RELATIVE_DAYS[arg]!;
        const next = new Date(now);
        next.setDate(next.getDate() + offset);
        return next;
    }
    if (Object.prototype.hasOwnProperty.call(ZH_NEXT_WEEKDAY, arg)) {
        const target = ZH_NEXT_WEEKDAY[arg]!;
        const ahead = (target - now.getDay() + 7) % 7 || 7;
        const next = new Date(now);
        next.setDate(next.getDate() + ahead);
        return next;
    }
    const rel = RELATIVE_ARG.exec(arg);
    if (rel) {
        const sign = rel[1] === "+" ? 1 : -1;
        const n = Number(rel[2]);
        let next: Date;
        if (rel[3] === "d" || rel[3] === "w") {
            next = new Date(now);
            next.setDate(next.getDate() + sign * n * (rel[3] === "w" ? 7 : 1));
        } else {
            next = addMonthsClamped(now, sign * n * (rel[3] === "y" ? 12 : 1));
        }
        return next;
    }
    const wd = NEXT_WEEKDAY_ARG.exec(arg);
    const dayName = wd?.[1];
    const target = dayName ? WEEKDAY_INDEX[dayName] : undefined;
    if (target !== undefined) {
        const ahead = (target - now.getDay() + 7) % 7 || 7;
        const next = new Date(now);
        next.setDate(next.getDate() + ahead);
        return next;
    }
    return null;
}

/** 计算时间偏移（+1h, -30m, +10s）并返回目标 Date，非法返回 null */
export function calculateTimeOffset(now: Date, rawArg: string): Date | null {
    const rel = RELATIVE_TIME_ARG.exec(rawArg.trim());
    if (!rel) return null;
    const sign = rel[1] === "+" ? 1 : -1;
    const n = Number(rel[2]);
    const unit = rel[3]!.toLowerCase();
    const next = new Date(now);
    if (unit === "h") {
        next.setHours(next.getHours() + sign * n);
    } else if (unit === "m") {
        next.setMinutes(next.getMinutes() + sign * n);
    } else if (unit === "s") {
        next.setSeconds(next.getSeconds() + sign * n);
    }
    return next;
}

/** 解析日期参数（支持偏移、格式及两者复合）；非法返回 null */
export function resolveDateArg(now: Date, rawArg: string): string | null {
    const trimmed = rawArg.trim();
    if (trimmed.includes("|")) {
        const firstPipeIndex = trimmed.indexOf("|");
        const offsetPart = trimmed.slice(0, firstPipeIndex).trim();
        const formatPart = trimmed.slice(firstPipeIndex + 1).trim();
        const targetDate = calculateDateOffset(now, offsetPart);
        if (targetDate && isValidFormatPattern(formatPart)) {
            return formatDateTime(targetDate, formatPart);
        }
        return null;
    }
    const targetDate = calculateDateOffset(now, trimmed);
    if (targetDate) {
        return renderDate(targetDate);
    }
    if (isValidFormatPattern(trimmed)) {
        return formatDateTime(now, trimmed);
    }
    return null;
}

/** 解析时间参数（支持偏移、格式及两者复合）；非法返回 null */
function resolveTimeArg(now: Date, rawArg: string): string | null {
    const trimmed = rawArg.trim();
    if (trimmed.includes("|")) {
        const firstPipeIndex = trimmed.indexOf("|");
        const offsetPart = trimmed.slice(0, firstPipeIndex).trim();
        const formatPart = trimmed.slice(firstPipeIndex + 1).trim();
        const targetTime = calculateTimeOffset(now, offsetPart);
        if (targetTime && isValidFormatPattern(formatPart)) {
            return formatDateTime(targetTime, formatPart);
        }
        return null;
    }
    const targetTime = calculateTimeOffset(now, trimmed);
    if (targetTime) {
        return `${pad(targetTime.getHours())}:${pad(targetTime.getMinutes())}`;
    }
    if (isValidFormatPattern(trimmed)) {
        return formatDateTime(now, trimmed);
    }
    return null;
}

/** 解析日期时间参数（支持偏移、格式及两者复合）；非法返回 null */
function resolveDatetimeArg(now: Date, rawArg: string): string | null {
    const trimmed = rawArg.trim();
    if (trimmed.includes("|")) {
        const firstPipeIndex = trimmed.indexOf("|");
        const offsetPart = trimmed.slice(0, firstPipeIndex).trim();
        const formatPart = trimmed.slice(firstPipeIndex + 1).trim();
        const target = calculateDateOffset(now, offsetPart) || calculateTimeOffset(now, offsetPart);
        if (target && isValidFormatPattern(formatPart)) {
            return formatDateTime(target, formatPart);
        }
        return null;
    }
    const target = calculateDateOffset(now, trimmed) || calculateTimeOffset(now, trimmed);
    if (target) {
        return `${renderDate(target)} ${pad(target.getHours())}:${pad(target.getMinutes())}`;
    }
    if (isValidFormatPattern(trimmed)) {
        return formatDateTime(now, trimmed);
    }
    return null;
}

/** 解析星期参数（full/dddd、short/ddd、en、en_short）；非法返回 null */
function resolveWeekdayArg(now: Date, rawArg: string): string | null {
    const arg = rawArg.trim().toLowerCase();
    const day = now.getDay();
    if (arg === "full" || arg === "dddd") {
        return WEEKDAYS_FULL_ZH[day] ?? "";
    }
    if (arg === "short" || arg === "ddd") {
        return WEEKDAYS_ZH[day] ?? "";
    }
    if (arg === "en") {
        return WEEKDAYS_EN[day] ?? "";
    }
    if (arg === "en_short") {
        return WEEKDAYS_SHORT_EN[day] ?? "";
    }
    return null;
}

/** 随机选一：支持 1..100 整数范围生成，或逗号分隔选项（支持中英文逗号与顿号 [,，、]），每项去首尾空白；无可选项返回 null（保留原文）。 */
export function pickRandomOption(rawArg: string): string | null {
    const trimmed = rawArg.trim();
    const rangeMatch = trimmed.match(/^(-?\d+)\.\.(-?\d+)$/);
    if (rangeMatch) {
        const start = parseInt(rangeMatch[1]!, 10);
        const end = parseInt(rangeMatch[2]!, 10);
        if (Number.isFinite(start) && Number.isFinite(end)) {
            const min = Math.min(start, end);
            const max = Math.max(start, end);
            const val = Math.floor(Math.random() * (max - min + 1)) + min;
            return String(val);
        }
    }
    const options = trimmed.split(/[,，、]/).map((s) => s.trim()).filter(Boolean).slice(0, 16);
    if (options.length === 0) return null;
    return options[Math.floor(Math.random() * options.length)] ?? null;
}

/**
 * 生成符合 RFC 4122 v4 规范的标准 UUID（小写 36 字符）
 * 优先使用宿主 crypto.randomUUID()，不可用时通过位运算安全回退
 */
export function generateUuidV4(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        try {
            return crypto.randomUUID().toLowerCase();
        } catch {
            // 降级回退
        }
    }
    // RFC 4122 v4 回退实现：xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    // 其中 y 为 8, 9, a, 或 b (即 (r & 0x3) | 0x8)
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

// 去混淆字符集（排除易混淆的 0/O, 1/l/I）
const UNAMBIGUOUS_CHARS = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";

/**
 * 生成紧凑短随机 ID（排除易混淆字符）
 * @param length 字符长度，合法区间 [4, 32]，默认 8
 * @param uppercase 是否强制转为全大写，默认 false
 */
export function generateShortId(length = 8, uppercase = false): string {
    const validLen = Math.max(4, Math.min(32, length || 8));
    let result = "";
    for (let i = 0; i < validLen; i++) {
        const idx = Math.floor(Math.random() * UNAMBIGUOUS_CHARS.length);
        result += UNAMBIGUOUS_CHARS[idx];
    }
    return uppercase ? result.toUpperCase() : result;
}

/** 解析 UUID 参数（upper, simple/compact）；非法返回 null */
export function resolveUuidArg(rawArg: string): string | null {
    const tokens = rawArg.split(/[,，|]/).map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (tokens.length === 0) return generateUuidV4();
    let isUpper = false;
    let isSimple = false;
    for (const tok of tokens) {
        if (tok === "upper" || tok === "uppercase") {
            isUpper = true;
        } else if (tok === "simple" || tok === "compact") {
            isSimple = true;
        } else {
            return null;
        }
    }
    let uuid = generateUuidV4();
    if (isSimple) {
        uuid = uuid.replace(/-/g, "");
    }
    if (isUpper) {
        uuid = uuid.toUpperCase();
    }
    return uuid;
}

/** 解析短 ID 参数（4~32 数字长度，或 upper）；非法返回 null */
export function resolveIdArg(rawArg: string): string | null {
    const tokens = rawArg.split(/[,，|]/).map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (tokens.length === 0) return generateShortId(8, false);
    let length = 8;
    let isUpper = false;
    for (const tok of tokens) {
        if (/^\d{1,2}$/.test(tok)) {
            const num = Number(tok);
            if (num < 4 || num > 32) return null;
            length = num;
        } else if (tok === "upper" || tok === "uppercase") {
            isUpper = true;
        } else {
            return null;
        }
    }
    return generateShortId(length, isUpper);
}

const PWD_LOWER = "abcdefghjkmnpqrstuvwxyz";
const PWD_UPPER = "ABCDEFGHJKMNPQRSTUVWXYZ";
const PWD_DIGITS = "23456789";
const PWD_SYMBOLS = "!@#$%^&*()_+~=";
const PWD_HEX = "0123456789abcdef";

export type PasswordStrength = "simple" | "complex" | "pin" | "hex";

/**
 * 高安全随机密码/凭据生成器
 */
export function generateSecurePassword(length = 14, strength: PasswordStrength = "complex"): string {
    const len = Math.max(4, Math.min(64, length || 14));
    let pool = "";
    const mandatoryChars: string[] = [];
    const pick = (set: string) => set[Math.floor(Math.random() * set.length)]!;

    if (strength === "pin") {
        pool = "0123456789";
    } else if (strength === "hex") {
        pool = PWD_HEX;
    } else if (strength === "simple") {
        pool = PWD_LOWER + PWD_UPPER + PWD_DIGITS;
        mandatoryChars.push(pick(PWD_LOWER), pick(PWD_UPPER), pick(PWD_DIGITS));
    } else {
        pool = PWD_LOWER + PWD_UPPER + PWD_DIGITS + PWD_SYMBOLS;
        mandatoryChars.push(pick(PWD_LOWER), pick(PWD_UPPER), pick(PWD_DIGITS), pick(PWD_SYMBOLS));
    }

    const resultChars: string[] = [...mandatoryChars];
    while (resultChars.length < len) {
        resultChars.push(pick(pool));
    }

    // Fisher-Yates 洗牌
    for (let i = resultChars.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = resultChars[i]!;
        resultChars[i] = resultChars[j]!;
        resultChars[j] = temp;
    }

    return resultChars.slice(0, len).join("");
}

/** 解析 password 宏参数：支持长度 [4..64] 及 simple, complex, pin, hex */
export function resolvePasswordArg(rawArg: string): string | null {
    const tokens = rawArg.split(/[,，|]/).map((s) => s.trim().toLowerCase()).filter(Boolean);
    let len = 14;
    let strength: PasswordStrength = "complex";

    for (const tok of tokens) {
        if (/^\d+$/.test(tok)) {
            const parsed = parseInt(tok, 10);
            if (parsed >= 4 && parsed <= 64) len = parsed;
            else return null;
        } else if (tok === "simple" || tok === "alphanumeric") {
            strength = "simple";
        } else if (tok === "complex" || tok === "strong" || tok === "symbol") {
            strength = "complex";
        } else if (tok === "pin" || tok === "digits" || tok === "number") {
            strength = "pin";
        } else if (tok === "hex") {
            strength = "hex";
        } else {
            return null;
        }
    }

    return generateSecurePassword(len, strength);
}

/** 分词提取单词：支持下划线、短横线、空白、标点以及驼峰边界切分 */
export function splitWords(text: string): string[] {
    if (!text || !text.trim()) return [];
    // 匹配连续大写、大写后接小写、纯小写、数字、中文汉字块
    const matches = text.match(/[A-Z]+(?![a-z])|[A-Z]?[a-z]+|\d+|[\u4e00-\u9fa5]+/g);
    return matches ? matches.map((w) => w.trim()).filter(Boolean) : [];
}

/**
 * 文本命名范式转换器（纯函数、零副作用）
 * @param text 输入文本
 * @param style 命名风格
 */
export function transformCase(text: string, style: string): string | null {
    if (typeof text !== "string") return null;
    if (!text) return "";
    const normStyle = style.trim().toLowerCase();
    switch (normStyle) {
        case "upper":
        case "uppercase":
            return text.toUpperCase();
        case "lower":
        case "lowercase":
            return text.toLowerCase();
        case "title":
        case "capitalize": {
            const words = splitWords(text);
            if (words.length === 0) return text;
            return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
        }
        case "camel":
        case "camelcase": {
            const words = splitWords(text);
            if (words.length === 0) return text;
            return words.map((w, idx) => {
                const lower = w.toLowerCase();
                return idx === 0 ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
            }).join("");
        }
        case "pascal":
        case "pascalcase": {
            const words = splitWords(text);
            if (words.length === 0) return text;
            return words.map((w) => {
                const lower = w.toLowerCase();
                return lower.charAt(0).toUpperCase() + lower.slice(1);
            }).join("");
        }
        case "snake":
        case "snakecase": {
            const words = splitWords(text);
            if (words.length === 0) return text;
            return words.map((w) => w.toLowerCase()).join("_");
        }
        case "kebab":
        case "kebabcase": {
            const words = splitWords(text);
            if (words.length === 0) return text;
            return words.map((w) => w.toLowerCase()).join("-");
        }
        case "constant": {
            const words = splitWords(text);
            if (words.length === 0) return text;
            return words.map((w) => w.toUpperCase()).join("_");
        }
        default:
            return null;
    }
}

/** 解析 case 语法参数 */
export function resolveCaseArg(rawArg: string, subStyle?: string): string | null {
    if (subStyle) {
        return transformCase(rawArg, subStyle);
    }
    const trimmed = rawArg.trim();
    const firstPipe = trimmed.indexOf("|");
    if (firstPipe === -1) return null;
    const style = trimmed.slice(0, firstPipe).trim();
    const content = trimmed.slice(firstPipe + 1);
    return transformCase(content, style);
}

const DANGEROUS_QUANTIFIER_PATTERN = /(\+|\*|\{\d+,?\d*\})\s*(\+|\*|\{\d+,?\d*\})|\([^)]*(\+|\*)[^)]*\)\s*(\+|\*)/;

/** 检查正则表达式是否存在灾难性回溯（ReDoS）危险特征或超出安全长度 */
export function isDangerousRegex(pattern: string): boolean {
    if (!pattern || pattern.length > 64) return true;
    return DANGEROUS_QUANTIFIER_PATTERN.test(pattern);
}

/**
 * 安全应用正则过滤器（提取或替换）
 * 纯函数、零副作用、防 ReDoS 灾难性回溯
 */
export function applyRegexFilter(
    action: "extract" | "replace",
    patternStr: string,
    text: string,
    replacement?: string,
): string | null {
    if (typeof text !== "string" || !patternStr || isDangerousRegex(patternStr)) {
        return null;
    }
    const safeText = text.slice(0, 4000);
    try {
        if (action === "extract") {
            const re = new RegExp(patternStr);
            const match = re.exec(safeText);
            if (!match) return "";
            return match[1] !== undefined ? match[1] : match[0];
        }
        if (action === "replace") {
            const re = new RegExp(patternStr, "g");
            return safeText.replace(re, replacement ?? "");
        }
        return null;
    } catch {
        return null;
    }
}

/** 解析 regex 语法参数 */
export function resolveRegexArg(rawArg: string, subAction?: string): string | null {
    const trimmed = rawArg.trim();
    let action = subAction?.trim().toLowerCase();
    let rest = trimmed;

    if (!action) {
        const firstPipe = trimmed.indexOf("|");
        if (firstPipe === -1) return null;
        action = trimmed.slice(0, firstPipe).trim().toLowerCase();
        rest = trimmed.slice(firstPipe + 1);
    }

    if (action === "extract") {
        const pipe = rest.indexOf("|");
        if (pipe === -1) return null;
        const pattern = rest.slice(0, pipe).trim();
        const text = rest.slice(pipe + 1);
        return applyRegexFilter("extract", pattern, text);
    }

    if (action === "replace" || action === "mreplace" || action === "multiline") {
        const firstPipe = rest.indexOf("|");
        if (firstPipe === -1) return null;
        const pattern = rest.slice(0, firstPipe).trim();
        const afterPattern = rest.slice(firstPipe + 1);
        const secondPipe = afterPattern.indexOf("|");
        if (secondPipe === -1) return null;
        const replacement = afterPattern.slice(0, secondPipe);
        const text = afterPattern.slice(secondPipe + 1);
        if (action === "mreplace" || action === "multiline") {
            if (isDangerousRegex(pattern)) return null;
            const cappedText = text.length > 10000 ? text.slice(0, 10000) : text;
            return regexReplaceMultiline(cappedText, pattern, replacement);
        }
        return applyRegexFilter("replace", pattern, text, replacement);
    }

    return null;
}

/** 解析 url 语法参数（支持编解码与结构化组件提取） */
export function resolveUrlArg(rawArg: string, subAction?: string): string | null {
    const trimmed = rawArg.trim();
    let action = subAction?.trim().toLowerCase();
    let content = trimmed;

    if (!action) {
        const firstPipe = trimmed.indexOf("|");
        if (firstPipe === -1) {
            // 默认编码
            action = "encode";
            content = trimmed;
        } else {
            action = trimmed.slice(0, firstPipe).trim().toLowerCase();
            content = trimmed.slice(firstPipe + 1);
        }
    }

    if (action === "encode" || action === "enc") {
        return encodeUrlText(content, true);
    }
    if (action === "decode" || action === "dec") {
        const decoded = decodeUrlText(content, true);
        return decoded.ok ? decoded.result : null;
    }
    if (action === "param" || action === "getparam") {
        const firstPipe = content.indexOf("|");
        if (firstPipe === -1) return null;
        const key = content.slice(0, firstPipe).trim();
        const urlStr = content.slice(firstPipe + 1).trim();
        return extractUrlComponent(urlStr, "param", key);
    }
    if (action === "query" || action === "build" || action === "buildquery" || action === "querybuild") {
        const firstPipe = content.indexOf("|");
        if (firstPipe === -1) {
            return buildUrlQuery(content);
        }
        const pairs = content.slice(0, firstPipe);
        const baseUrl = content.slice(firstPipe + 1);
        return buildUrlQuery(pairs, baseUrl);
    }
    if (action === "host" || action === "domain") {
        return extractUrlComponent(content.trim(), "host");
    }
    if (action === "path") {
        return extractUrlComponent(content.trim(), "path");
    }
    if (action === "protocol") {
        return extractUrlComponent(content.trim(), "protocol");
    }
    return null;
}

/** 解析 csv 语法参数 */
export function resolveCsvArg(rawArg: string, subAction?: string): string | null {
    const trimmed = rawArg.trim();
    let action = subAction?.trim().toLowerCase() || "list";
    let content = trimmed;

    if (!subAction && trimmed.includes("|")) {
        const firstPipe = trimmed.indexOf("|");
        const potentialAction = trimmed.slice(0, firstPipe).trim().toLowerCase();
        if (potentialAction === "list" || potentialAction === "numbered" || potentialAction === "num") {
            action = potentialAction;
            content = trimmed.slice(firstPipe + 1);
        }
    }

    if (action === "list") {
        const pipeIdx = content.indexOf("|");
        if (pipeIdx !== -1 && pipeIdx <= 4) {
            const delim = content.slice(0, pipeIdx);
            const text = content.slice(pipeIdx + 1);
            return csvToList(text, delim, "- ");
        }
        return csvToList(content, ",", "- ");
    }

    if (action === "numbered" || action === "num") {
        const pipeIdx = content.indexOf("|");
        let delim = ",";
        let text = content;
        if (pipeIdx !== -1 && pipeIdx <= 4) {
            delim = content.slice(0, pipeIdx);
            text = content.slice(pipeIdx + 1);
        }
        const items = csvToList(text, delim, "").split("\n").filter((s) => s.length > 0);
        return items.map((item, idx) => `${idx + 1}. ${item}`).join("\n");
    }

    return null;
}

/** 解析 line 文本行批处理宏参数 */
export function resolveLineArg(rawArg: string, subAction?: string): string | null {
    const trimmed = rawArg.trim();
    let action = subAction?.trim().toLowerCase();
    let content = trimmed;

    if (!action) {
        const firstPipe = trimmed.indexOf("|");
        if (firstPipe === -1) {
            return null;
        }
        action = trimmed.slice(0, firstPipe).trim().toLowerCase();
        content = trimmed.slice(firstPipe + 1);
    }

    if (action === "prefix") {
        const firstPipe = content.indexOf("|");
        if (firstPipe === -1) return content;
        const prefix = content.slice(0, firstPipe);
        const text = content.slice(firstPipe + 1);
        return prefixLines(text, prefix, { skipEmpty: true });
    }
    if (action === "suffix") {
        const firstPipe = content.indexOf("|");
        if (firstPipe === -1) return content;
        const suffix = content.slice(0, firstPipe);
        const text = content.slice(firstPipe + 1);
        return suffixLines(text, suffix, { skipEmpty: true });
    }
    if (action === "trim") {
        return content.split("\n").map((line) => line.trim()).join("\n");
    }
    return null;
}

/** 解析 base64 语法参数 */
export function resolveBase64Arg(rawArg: string, subAction?: string): string | null {
    const trimmed = rawArg.trim();
    let action = subAction?.trim().toLowerCase();
    let content = trimmed;

    if (!action) {
        const firstPipe = trimmed.indexOf("|");
        if (firstPipe === -1) {
            // 默认编码
            action = "encode";
            content = trimmed;
        } else {
            action = trimmed.slice(0, firstPipe).trim().toLowerCase();
            content = trimmed.slice(firstPipe + 1);
        }
    }

    if (action === "encode" || action === "enc") {
        return encodeBase64(content);
    }
    if (action === "decode" || action === "dec") {
        const decoded = decodeBase64(content);
        return decoded.ok ? decoded.result : null;
    }
    return null;
}

/** 解析 html 语法参数 */
export function resolveHtmlArg(rawArg: string, subAction?: string): string | null {
    const trimmed = rawArg.trim();
    let action = subAction?.trim().toLowerCase();
    let content = trimmed;

    if (!action) {
        const firstPipe = trimmed.indexOf("|");
        if (firstPipe === -1) {
            action = "escape";
            content = trimmed;
        } else {
            action = trimmed.slice(0, firstPipe).trim().toLowerCase();
            content = trimmed.slice(firstPipe + 1);
        }
    }

    if (action === "escape" || action === "enc") {
        return escapeHtmlEntities(content);
    }
    if (action === "unescape" || action === "dec") {
        return unescapeHtmlEntities(content);
    }
    return null;
}

/** 解析 count 语法参数 (chars, words, lines, cjk) */
export function resolveCountArg(rawArg: string, subAction?: string): string | null {
    const trimmed = rawArg.trim();
    let action = subAction?.trim().toLowerCase();
    let content = trimmed;

    if (!action) {
        const firstPipe = trimmed.indexOf("|");
        if (firstPipe === -1) {
            action = "chars";
            content = trimmed;
        } else {
            action = trimmed.slice(0, firstPipe).trim().toLowerCase();
            content = trimmed.slice(firstPipe + 1);
        }
    }

    if (action === "chars" || action === "len" || action === "length") {
        return String(content.length);
    }
    if (action === "lines" || action === "line") {
        if (!content) return "0";
        return String(content.replace(/\r\n?/g, "\n").split("\n").length);
    }
    if (action === "cjk" || action === "chinese") {
        const m = content.match(/[\u4e00-\u9fa5]/g);
        return String(m ? m.length : 0);
    }
    if (action === "words" || action === "word") {
        const cjk = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
        const latinWords = (content.replace(/[\u4e00-\u9fa5]/g, " ").match(/[a-zA-Z0-9_-]+/g) || []).length;
        return String(cjk + latinWords);
    }
    return null;
}

/** 解析 hash 语法参数 (fnv1a, djb2, crc32, base36) */
export function resolveHashArg(rawArg: string, subAlgo?: string): string | null {
    const trimmed = rawArg.trim();
    let algo = subAlgo?.trim().toLowerCase();
    let content = trimmed;

    if (!algo) {
        const firstPipe = trimmed.indexOf("|");
        if (firstPipe === -1) {
            algo = "fnv1a";
            content = trimmed;
        } else {
            algo = trimmed.slice(0, firstPipe).trim().toLowerCase();
            content = trimmed.slice(firstPipe + 1);
        }
    }

    if (algo === "fnv1a" || algo === "djb2" || algo === "crc32") {
        return generateTextHash(content, {algorithm: algo});
    }
    if (algo === "base36") {
        return generateTextHash(content, {algorithm: "fnv1a", format: "base36"});
    }
    return null;
}

/** 解析 number 语法参数 (lines, padded, bracket, circled) */
export function resolveNumberArg(rawArg: string, subFormat?: string): string | null {
    const trimmed = rawArg.trim();
    let format = subFormat?.trim().toLowerCase();
    let content = trimmed;

    if (!format) {
        const firstPipe = trimmed.indexOf("|");
        if (firstPipe === -1) {
            format = "lines";
            content = trimmed;
        } else {
            format = trimmed.slice(0, firstPipe).trim().toLowerCase();
            content = trimmed.slice(firstPipe + 1);
        }
    }

    if (format === "lines" || format === "decimal" || format === "dec") {
        return numberLines(content, {format: "decimal"}).result;
    }
    if (format === "padded" || format === "pad") {
        return numberLines(content, {format: "padded"}).result;
    }
    if (format === "bracket") {
        return numberLines(content, {format: "bracket"}).result;
    }
    if (format === "circled") {
        return numberLines(content, {format: "circled"}).result;
    }
    return null;
}

/** 解析 truncate 语法参数 (截断长度，默认 30) */
export function resolveTruncateArg(rawArg: string, subLen?: string): string | null {
    const trimmed = rawArg.trim();
    let lenStr = subLen?.trim();
    let content = trimmed;

    if (!lenStr) {
        const firstPipe = trimmed.indexOf("|");
        if (firstPipe === -1) {
            lenStr = "30";
            content = trimmed;
        } else {
            lenStr = trimmed.slice(0, firstPipe).trim();
            content = trimmed.slice(firstPipe + 1);
        }
    }

    const maxLen = parseInt(lenStr, 10);
    if (!Number.isFinite(maxLen) || maxLen <= 0) return null;
    return truncateText(content, maxLen);
}

/** 解析 mask 语法参数 (phone, email, idcard, auto) */
export function resolveMaskArg(rawArg: string, subType?: string): string | null {
    const trimmed = rawArg.trim();
    let type = subType?.trim().toLowerCase();
    let content = trimmed;

    if (!type) {
        const firstPipe = trimmed.indexOf("|");
        if (firstPipe === -1) {
            type = "auto";
            content = trimmed;
        } else {
            type = trimmed.slice(0, firstPipe).trim().toLowerCase();
            content = trimmed.slice(firstPipe + 1);
        }
    }

    if (type === "auto" || type === "phone" || type === "email" || type === "idcard") {
        return maskSensitiveText(content, type);
    }
    return null;
}

/** 解析 currency 语法参数（支持中文大写金额） */
export function resolveCurrencyArg(rawArg: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;
    const res = formatChineseCurrency(trimmed);
    return res || null;
}

/** 解析 filesize 语法参数（支持字节容量转人类可读格式） */
export function resolveFilesizeArg(rawArg: string, subDec?: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;
    let decStr = subDec?.trim();
    let bytesStr = trimmed;

    if (!decStr) {
        const firstPipe = trimmed.indexOf("|");
        if (firstPipe !== -1) {
            bytesStr = trimmed.slice(0, firstPipe).trim();
            decStr = trimmed.slice(firstPipe + 1).trim();
        }
    }

    const decimals = decStr ? parseInt(decStr, 10) : 2;
    const res = formatByteSize(bytesStr, Number.isFinite(decimals) ? decimals : 2);
    return res || null;
}

/** 解析 reverse 语法参数（字符级逆序反转） */
export function resolveReverseArg(rawArg: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return "";
    return reverseText(trimmed);
}

/** 解析 cron 语法参数（Cron 表达式自然语言解释） */
export function resolveCronArg(rawArg: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;
    const res = explainCronExpression(trimmed);
    return res || null;
}

/** 解析 timeago 语法参数（时间戳相对时间格式化） */
export function resolveTimeagoArg(rawArg: string, now: Date): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed || trimmed === "now") return "刚刚";
    const res = formatRelativeTime(trimmed, now);
    return res || null;
}

/** 解析 summary 语法参数（自然语言精要摘要提取） */
export function resolveSummaryArg(rawArg: string, subLen?: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return "";
    let lenStr = subLen?.trim();
    let content = trimmed;

    if (!lenStr) {
        const firstPipe = trimmed.indexOf("|");
        if (firstPipe !== -1) {
            lenStr = trimmed.slice(0, firstPipe).trim();
            content = trimmed.slice(firstPipe + 1);
        }
    }

    const maxLen = lenStr ? parseInt(lenStr, 10) : 120;
    return extractExecutiveSummary(content, Number.isFinite(maxLen) ? maxLen : 120);
}

/** 解析 lunar 语法参数（农历干支与生肖年） */
export function resolveLunarArg(rawArg: string, now: Date, subType?: string): string | null {
    const trimmed = rawArg.trim();
    let mode = subType?.trim().toLowerCase();
    let yearInput = trimmed;

    if (!mode) {
        const firstPipe = trimmed.indexOf("|");
        if (firstPipe !== -1) {
            mode = trimmed.slice(0, firstPipe).trim().toLowerCase();
            yearInput = trimmed.slice(firstPipe + 1);
        }
    }

    const year = yearInput && /^\d{4}$/.test(yearInput) ? parseInt(yearInput, 10) : now.getFullYear();
    const res = getChineseZodiacAndStemBranch(year);

    if (!mode || mode === "year" || mode === "full") {
        return res.full;
    }
    if (mode === "stembranch" || mode === "ganzhi") {
        return res.stemBranch;
    }
    if (mode === "zodiac" || mode === "shengxiao") {
        return res.zodiac;
    }
    return res.full;
}

/** 解析 choose 语法参数（加权随机概率抽取） */
export function resolveChooseArg(rawArg: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;
    return pickWeightedOption(trimmed);
}

/** 解析 words 语法参数（数字转英文单词拼写） */
export function resolveWordsArg(rawArg: string, subLang?: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;
    let lang = subLang?.trim().toLowerCase();
    let numStr = trimmed;

    if (!lang) {
        const firstPipe = trimmed.indexOf("|");
        if (firstPipe !== -1) {
            lang = trimmed.slice(0, firstPipe).trim().toLowerCase();
            numStr = trimmed.slice(firstPipe + 1);
        }
    }

    return numberToEnglishWords(numStr);
}

/** 解析 color 语法参数（HEX ⇋ RGB ⇋ HSL 颜色转换） */
export function resolveColorArg(rawArg: string, subFormat?: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;
    let format = subFormat?.trim().toLowerCase() as "hex" | "rgb" | "hsl" | undefined;
    let colorStr = trimmed;

    if (!format) {
        const firstPipe = trimmed.indexOf("|");
        if (firstPipe !== -1) {
            const rawFormat = trimmed.slice(0, firstPipe).trim().toLowerCase();
            if (rawFormat === "hex" || rawFormat === "rgb" || rawFormat === "hsl") {
                format = rawFormat;
                colorStr = trimmed.slice(firstPipe + 1);
            }
        }
    }

    return convertColorFormat(colorStr, format || "rgb");
}

/** 解析 stats 语法参数（高级统计指标：中位数、方差、标准差等） */
export function resolveStatsArg(rawArg: string, subMetric?: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;
    let metric = subMetric?.trim().toLowerCase();
    let numsStr = trimmed;

    if (!metric) {
        const firstPipe = trimmed.indexOf("|");
        if (firstPipe !== -1) {
            metric = trimmed.slice(0, firstPipe).trim().toLowerCase();
            numsStr = trimmed.slice(firstPipe + 1);
        }
    }

    const res = calculateStats(numsStr);
    if (res.count === 0) return null;

    if (metric === "median") return String(res.median);
    if (metric === "stddev" || metric === "sd") return String(res.stdDev);
    if (metric === "variance" || metric === "var") return String(res.variance);
    if (metric === "avg" || metric === "average") return String(res.average);
    if (metric === "sum") return String(res.sum);
    if (metric === "count") return String(res.count);

    return res.result;
}

/** 解析 radix 语法参数（跨进制数值互转） */
export function resolveRadixArg(rawArg: string, subMode?: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;
    let mode = subMode?.trim().toLowerCase();
    let numStr = trimmed;

    if (!mode) {
        const firstPipe = trimmed.indexOf("|");
        if (firstPipe !== -1) {
            mode = trimmed.slice(0, firstPipe).trim().toLowerCase();
            numStr = trimmed.slice(firstPipe + 1);
        }
    }

    if (mode === "dec2hex" || mode === "hex") {
        return convertRadix(numStr, 10, 16, {prefix: true, uppercase: true});
    }
    if (mode === "hex2dec") {
        return convertRadix(numStr, 16, 10);
    }
    if (mode === "dec2bin" || mode === "bin") {
        return convertRadix(numStr, 10, 2, {prefix: true});
    }
    if (mode === "bin2dec") {
        return convertRadix(numStr, 2, 10);
    }
    return convertRadix(numStr, 10, 16, {prefix: true, uppercase: true});
}

/** 解析 kv 语法参数（提取键值对或查询串中的指定键） */
export function resolveKvArg(rawArg: string, subKey?: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;
    let targetKey = subKey?.trim();
    let text = trimmed;

    if (!targetKey) {
        const firstPipe = trimmed.indexOf("|");
        if (firstPipe !== -1) {
            targetKey = trimmed.slice(0, firstPipe).trim();
            text = trimmed.slice(firstPipe + 1);
        }
    }

    if (!targetKey) return null;
    return extractKvValue(text, targetKey);
}

/** 解析 match 语法参数（正则多捕获组重组替换模板） */
export function resolveMatchArg(rawArg: string, subPattern?: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;

    let pattern = subPattern?.trim() || "";
    let template = "";
    let text = "";

    if (pattern) {
        const firstPipe = trimmed.indexOf("|");
        if (firstPipe !== -1) {
            template = trimmed.slice(0, firstPipe).trim();
            text = trimmed.slice(firstPipe + 1);
        } else {
            template = trimmed;
        }
    } else {
        const firstPipe = trimmed.indexOf("|");
        if (firstPipe !== -1) {
            pattern = trimmed.slice(0, firstPipe).trim();
            const rest = trimmed.slice(firstPipe + 1);
            const secondPipe = rest.indexOf("|");
            if (secondPipe !== -1) {
                template = rest.slice(0, secondPipe).trim();
                text = rest.slice(secondPipe + 1);
            } else {
                template = rest.trim();
            }
        }
    }

    if (!pattern || !template) return null;
    if (isDangerousRegex(pattern)) return null;
    const cappedText = text.length > 10000 ? text.slice(0, 10000) : text;
    return formatByRegexGroups(cappedText, pattern, template);
}

/** 解析 valid 语法参数（数据格式规范性校验） */
export function resolveValidArg(rawArg: string, subType?: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;

    let typeStr = subType?.trim().toLowerCase();
    let valStr = trimmed;
    let trueText = "true";
    let falseText = "false";

    if (typeStr) {
        const parts = trimmed.split("|");
        valStr = parts[0]?.trim() ?? "";
        if (parts[1] !== undefined) trueText = parts[1].trim();
        if (parts[2] !== undefined) falseText = parts[2].trim();
    } else {
        const parts = trimmed.split("|");
        if (parts.length < 2) return null;
        typeStr = parts[0]?.trim().toLowerCase();
        valStr = parts[1]?.trim() ?? "";
        if (parts[2] !== undefined) trueText = parts[2].trim();
        if (parts[3] !== undefined) falseText = parts[3].trim();
    }

    if (!typeStr || !valStr) return null;
    const isValid = validateFormat(valStr, typeStr as DataFormatType);
    return isValid ? trueText : falseText;
}

/** 解析 path 语法参数（提取路径或 URL 的各组成部分） */
export function resolvePathArg(rawArg?: string, subAction?: string, defaultPath = ""): string | null {
    let partType = subAction?.trim().toLowerCase();
    let pathText = rawArg?.trim() || defaultPath;

    if (!partType && rawArg) {
        const firstPipe = rawArg.indexOf("|");
        if (firstPipe !== -1) {
            partType = rawArg.slice(0, firstPipe).trim().toLowerCase();
            pathText = rawArg.slice(firstPipe + 1).trim() || defaultPath;
        } else {
            const single = rawArg.trim().toLowerCase();
            if (["dir", "dirname", "filename", "name", "stem", "basename", "ext"].includes(single)) {
                partType = single;
                pathText = defaultPath;
            }
        }
    }

    if (!pathText) return "";
    const parts = parsePathParts(pathText);

    if (partType === "ext") return parts.ext;
    if (partType === "stem" || partType === "basename") return parts.stem;
    if (partType === "filename" || partType === "name") return parts.filename;
    if (partType === "dir" || partType === "dirname") return parts.dir;

    return parts.filename || parts.raw;
}

/** 解析 nanoid 语法参数 */
export function resolveNanoIdArg(rawArg?: string): string {
    const trimmed = rawArg?.trim();
    if (trimmed && /^\d+$/.test(trimmed)) {
        const size = parseInt(trimmed, 10);
        return generateNanoId(size);
    }
    return generateNanoId(10);
}

/** 解析 template 语法参数（迷你模板变量插值渲染） */
export function resolveTemplateArg(rawArg: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;

    const firstPipe = trimmed.indexOf("|");
    if (firstPipe === -1) return trimmed;

    const templateStr = trimmed.slice(0, firstPipe).trim();
    const dataStr = trimmed.slice(firstPipe + 1).trim();

    return renderSimpleTemplate(templateStr, dataStr);
}

/** 解析 obfuscate 语法参数 */
export function resolveObfuscateArg(rawArg: string, subMode?: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;

    let mode = subMode?.trim().toLowerCase() as ObfuscateMode | undefined;
    let text = trimmed;

    if (!mode) {
        const firstPipe = trimmed.indexOf("|");
        if (firstPipe !== -1) {
            const rawMode = trimmed.slice(0, firstPipe).trim().toLowerCase();
            if (rawMode === "rot13" || rawMode === "leet") {
                mode = rawMode as ObfuscateMode;
                text = trimmed.slice(firstPipe + 1);
            }
        }
    }

    return obfuscateText(text, mode || "rot13");
}

/** 解析 scramble 语法参数 */
export function resolveScrambleArg(rawArg: string, subMode?: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;

    let mode = subMode?.trim().toLowerCase() as "words" | "chars" | undefined;
    let text = trimmed;

    if (!mode) {
        const firstPipe = trimmed.indexOf("|");
        if (firstPipe !== -1) {
            const rawMode = trimmed.slice(0, firstPipe).trim().toLowerCase();
            if (rawMode === "words" || rawMode === "chars") {
                mode = rawMode as "words" | "chars";
                text = trimmed.slice(firstPipe + 1);
            }
        }
    }

    return scrambleText(text, mode || "words");
}

/** 解析 thousands 语法参数 */
export function resolveThousandsArg(rawArg: string, subMode?: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;

    let mode: "add" | "remove" = "add";
    let val = trimmed;

    if (subMode === "clean" || subMode === "remove") {
        mode = "remove";
    } else {
        const firstPipe = trimmed.indexOf("|");
        if (firstPipe !== -1) {
            const rawMode = trimmed.slice(0, firstPipe).trim().toLowerCase();
            if (rawMode === "clean" || rawMode === "remove") {
                mode = "remove";
                val = trimmed.slice(firstPipe + 1);
            }
        }
    }

    return formatNumberGrouping(val, mode);
}

/** 解析 checksum 语法参数 */
export function resolveChecksumArg(rawArg: string, subAlgorithm?: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;

    let algorithm: "crc32" | "adler32" = "crc32";
    let text = trimmed;

    if (subAlgorithm === "adler32" || subAlgorithm === "adler") {
        algorithm = "adler32";
    } else {
        const firstPipe = trimmed.indexOf("|");
        if (firstPipe !== -1) {
            const rawAlgo = trimmed.slice(0, firstPipe).trim().toLowerCase();
            if (rawAlgo === "adler32" || rawAlgo === "adler") {
                algorithm = "adler32";
                text = trimmed.slice(firstPipe + 1);
            } else if (rawAlgo === "crc32" || rawAlgo === "crc") {
                algorithm = "crc32";
                text = trimmed.slice(firstPipe + 1);
            }
        }
    }

    return calculateChecksum(text, algorithm);
}

/** 解析 pad 语法参数（定长补齐或截断） */
export function resolvePadArg(rawArg: string, subDirection?: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;

    let dir: "left" | "right" | "center" = "left";
    if (subDirection === "right" || subDirection === "center" || subDirection === "left") {
        dir = subDirection;
    }

    const parts = trimmed.split("|");
    let width = 10;
    let text = "";
    let padChar = " ";

    if (!subDirection && (parts[0]?.trim().toLowerCase() === "left" || parts[0]?.trim().toLowerCase() === "right" || parts[0]?.trim().toLowerCase() === "center")) {
        dir = parts[0]?.trim().toLowerCase() as "left" | "right" | "center";
        const wStr = parts[1]?.trim() ?? "10";
        width = parseInt(wStr, 10);
        text = parts[2] ?? "";
        if (parts[3] !== undefined) padChar = parts[3];
    } else {
        const wStr = parts[0]?.trim() ?? "10";
        width = parseInt(wStr, 10);
        text = parts[1] ?? "";
        if (parts[2] !== undefined) padChar = parts[2];
    }

    if (!Number.isFinite(width)) return trimmed;
    return padOrTruncate(text, width, {direction: dir, padChar: padChar || " "});
}

/** 解析 seq 语法参数（数字区间序列生成） */
export function resolveSeqArg(rawArg: string, subMode?: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;

    let mode = subMode?.trim().toLowerCase();
    const parts = trimmed.split("|");
    let startIdx = 0;

    if (!mode && (parts[0]?.trim().toLowerCase() === "line" || parts[0]?.trim().toLowerCase() === "pad" || parts[0]?.trim().toLowerCase() === "csv")) {
        mode = parts[0]?.trim().toLowerCase();
        startIdx = 1;
    }

    const startStr = parts[startIdx]?.trim();
    const endStr = parts[startIdx + 1]?.trim();
    if (!startStr || !endStr) return null;

    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null;

    let step: number | undefined;
    let padWidth: number | undefined;
    let delim = ", ";

    if (mode === "line") {
        delim = "\n";
    }

    const thirdParam = parts[startIdx + 2]?.trim();
    if (thirdParam) {
        const val = parseInt(thirdParam, 10);
        if (Number.isFinite(val)) {
            if (mode === "pad") {
                padWidth = val;
            } else {
                step = val;
            }
        } else if (thirdParam === "\\n" || thirdParam === "newline") {
            delim = "\n";
        } else {
            delim = thirdParam;
        }
    }

    const fourthParam = parts[startIdx + 3]?.trim();
    if (fourthParam) {
        if (fourthParam === "\\n" || fourthParam === "newline") {
            delim = "\n";
        } else {
            delim = fourthParam;
        }
    }

    if (mode === "pad" && !padWidth) {
        padWidth = Math.max(String(start).length, String(end).length);
    }

    return generateNumericSequence(start, end, {
        step,
        delimiter: delim,
        padWidth,
    });
}

/** 解析 fingerprint 语法参数（字符串轻量指纹哈希） */
export function resolveFingerprintArg(rawArg: string, subLength?: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;

    let len = subLength ? parseInt(subLength, 10) : 8;
    let text = trimmed;

    if (!subLength) {
        const firstPipe = trimmed.indexOf("|");
        if (firstPipe !== -1) {
            const rawLen = trimmed.slice(0, firstPipe).trim();
            if (/^\d+$/.test(rawLen)) {
                len = parseInt(rawLen, 10);
                text = trimmed.slice(firstPipe + 1);
            }
        }
    }

    if (!Number.isFinite(len) || len < 4) len = 8;
    return generateShortHash(text, len);
}

/** 解析 randomcolor 语法参数（随机颜色值生成） */
export function resolveRandomColorArg(rawArg?: string, subFormat?: string): string {
    let fmt: "hex" | "rgb" | "hsl" = "hex";
    let tone: ColorTone = "any";

    if (subFormat === "rgb" || subFormat === "hsl" || subFormat === "hex") {
        fmt = subFormat;
    }

    const trimmed = rawArg?.trim().toLowerCase();
    if (trimmed) {
        if (!subFormat && (trimmed === "rgb" || trimmed === "hsl" || trimmed === "hex")) {
            fmt = trimmed;
        } else if (trimmed === "vibrant" || trimmed === "pastel" || trimmed === "dark" || trimmed === "light") {
            tone = trimmed as ColorTone;
        } else {
            const parts = trimmed.split("|");
            for (const p of parts) {
                const part = p.trim();
                if (part === "rgb" || part === "hsl" || part === "hex") fmt = part;
                if (part === "vibrant" || part === "pastel" || part === "dark" || part === "light") tone = part as ColorTone;
            }
        }
    }

    return generateRandomColor(fmt, {tone});
}

/** 解析 btruncate 语法参数（UTF-8 字节安全边界截断） */
export function resolveBtruncateArg(rawArg: string, subLen?: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;

    let maxBytes = 255;
    let text = trimmed;
    let ellipsis = false;

    if (subLen) {
        const val = parseInt(subLen, 10);
        if (Number.isFinite(val)) maxBytes = val;
    } else {
        const firstPipe = trimmed.indexOf("|");
        if (firstPipe !== -1) {
            const rawParam = trimmed.slice(0, firstPipe).trim();
            const val = parseInt(rawParam, 10);
            if (Number.isFinite(val)) {
                maxBytes = val;
                text = trimmed.slice(firstPipe + 1);
            }
        }
    }

    const secondPipe = text.indexOf("|");
    if (secondPipe !== -1) {
        const flag = text.slice(0, secondPipe).trim().toLowerCase();
        if (flag === "..." || flag === "ellipsis" || flag === "true") {
            ellipsis = true;
            text = text.slice(secondPipe + 1);
        }
    }

    return truncateByBytes(text, maxBytes, {ellipsis});
}

/** 解析 initials 语法参数（汉字拼音首字母缩写） */
export function resolveInitialsArg(rawArg: string, subCase?: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;

    let uppercase = true;
    let sep = "";
    let text = trimmed;

    if (subCase === "lower" || subCase === "lowercase") {
        uppercase = false;
    }

    const firstPipe = trimmed.indexOf("|");
    if (firstPipe !== -1) {
        const firstToken = trimmed.slice(0, firstPipe).trim().toLowerCase();
        if (firstToken === "lower" || firstToken === "lowercase") {
            uppercase = false;
            text = trimmed.slice(firstPipe + 1);
        } else if (firstToken === "upper" || firstToken === "uppercase") {
            uppercase = true;
            text = trimmed.slice(firstPipe + 1);
        } else if (firstToken === "-" || firstToken === "_" || firstToken === ".") {
            sep = firstToken;
            text = trimmed.slice(firstPipe + 1);
        }
    }

    const secondPipe = text.indexOf("|");
    if (secondPipe !== -1) {
        const potentialSep = text.slice(secondPipe + 1).trim();
        text = text.slice(0, secondPipe);
        if (potentialSep) sep = potentialSep;
    }

    return extractChinesePinyinInitials(text, {uppercase, separator: sep});
}

/** 解析 plural 语法参数（英文单词单复数智能切换） */
export function resolvePluralArg(rawArg: string, subMode?: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;

    let mode: "plural" | "singular" = "plural";
    let word = trimmed;

    if (subMode === "singular" || subMode === "single") {
        mode = "singular";
    }

    const firstPipe = trimmed.indexOf("|");
    if (firstPipe !== -1) {
        word = trimmed.slice(0, firstPipe).trim();
        const secondParam = trimmed.slice(firstPipe + 1).trim();
        const num = parseInt(secondParam, 10);
        if (Number.isFinite(num)) {
            mode = num === 1 ? "singular" : "plural";
        } else if (secondParam.toLowerCase() === "singular" || secondParam.toLowerCase() === "single") {
            mode = "singular";
        } else if (secondParam.toLowerCase() === "plural") {
            mode = "plural";
        }
    }

    return pluralizeText(word, mode);
}

/** 解析 escape 语法参数（管道符安全转义与反转义） */
export function resolveEscapeArg(rawArg: string, subMode?: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;

    let mode: "escape" | "unescape" = "escape";
    let text = trimmed;

    if (subMode === "unescape") {
        mode = "unescape";
    }

    const firstPipe = trimmed.indexOf("|");
    if (firstPipe !== -1) {
        const flag = trimmed.slice(0, firstPipe).trim().toLowerCase();
        if (flag === "unescape") {
            mode = "unescape";
            text = trimmed.slice(firstPipe + 1);
        } else if (flag === "pipe" || flag === "escape") {
            mode = "escape";
            text = trimmed.slice(firstPipe + 1);
        }
    }

    return escapeMacroPipe(text, mode);
}

/** 解析 repeat 语法参数（字符或文本序列重复生成） */
export function resolveRepeatArg(rawArg: string, subCount?: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;

    let count = 1;
    let text = trimmed;
    let delim = "";

    if (subCount) {
        const val = parseInt(subCount, 10);
        if (Number.isFinite(val)) count = val;
    }

    const parts = trimmed.split("|");
    if (parts.length >= 2) {
        const firstNum = parseInt(parts[0]!.trim(), 10);
        const secondNum = parseInt(parts[1]!.trim(), 10);

        if (Number.isFinite(secondNum) && !Number.isFinite(firstNum)) {
            text = parts[0]!;
            count = secondNum;
            if (parts[2] !== undefined) delim = parts[2]!;
        } else if (Number.isFinite(firstNum) && !Number.isFinite(secondNum)) {
            count = firstNum;
            text = parts[1]!;
            if (parts[2] !== undefined) delim = parts[2]!;
        } else if (Number.isFinite(secondNum)) {
            text = parts[0]!;
            count = secondNum;
            if (parts[2] !== undefined) delim = parts[2]!;
        }
    }

    return repeatText(text, count, {delimiter: delim});
}

/** 解析 center 语法参数（纯文本字宽居中对齐） */
export function resolveCenterArg(rawArg: string, subWidth?: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;

    let width = 20;
    let text = trimmed;
    let padChar = " ";

    if (subWidth) {
        const val = parseInt(subWidth, 10);
        if (Number.isFinite(val)) width = val;
    }

    const parts = trimmed.split("|");
    if (parts.length >= 2) {
        const firstNum = parseInt(parts[0]!.trim(), 10);
        const secondNum = parseInt(parts[1]!.trim(), 10);

        if (Number.isFinite(firstNum) && !Number.isFinite(secondNum)) {
            width = firstNum;
            text = parts[1]!;
            if (parts[2] !== undefined) padChar = parts[2]!;
        } else if (Number.isFinite(secondNum) && !Number.isFinite(firstNum)) {
            text = parts[0]!;
            width = secondNum;
            if (parts[2] !== undefined) padChar = parts[2]!;
        }
    }

    return centerText(text, width, {padChar});
}

/** 解析 slash 语法参数（反斜杠转义与还原） */
export function resolveSlashArg(rawArg: string, subMode?: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;

    let mode: "escape" | "unescape" = "escape";
    let text = trimmed;

    if (subMode === "unescape") {
        mode = "unescape";
    }

    const firstPipe = trimmed.indexOf("|");
    if (firstPipe !== -1) {
        const flag = trimmed.slice(0, firstPipe).trim().toLowerCase();
        if (flag === "unescape") {
            mode = "unescape";
            text = trimmed.slice(firstPipe + 1);
        } else if (flag === "escape") {
            mode = "escape";
            text = trimmed.slice(firstPipe + 1);
        }
    }

    return escapeBackslash(text, mode);
}

/** 解析 revwords 语法参数（单词逆序反转） */
export function resolveRevwordsArg(rawArg: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;
    return reverseWords(trimmed, {preserveLines: true});
}

/** 解析 randomname 语法参数（随机拟人姓名生成） */
export function resolveRandomNameArg(rawArg?: string, subLang?: string): string {
    let lang: "zh" | "en" = "zh";
    let gender: "any" | "male" | "female" = "any";

    if (subLang === "en" || subLang === "english") {
        lang = "en";
    }

    const trimmed = rawArg?.trim().toLowerCase();
    if (trimmed) {
        if (trimmed === "en" || trimmed === "english") {
            lang = "en";
        } else if (trimmed === "male" || trimmed === "boy" || trimmed === "男") {
            gender = "male";
        } else if (trimmed === "female" || trimmed === "girl" || trimmed === "女") {
            gender = "female";
        } else {
            const parts = trimmed.split("|");
            for (const p of parts) {
                const part = p.trim();
                if (part === "en" || part === "english") lang = "en";
                if (part === "male" || part === "男") gender = "male";
                if (part === "female" || part === "女") gender = "female";
            }
        }
    }

    return generateRandomName(lang, {gender});
}

/** 解析 if 语法参数（条件三元判断宏） */
export function resolveIfArg(rawArg: string, subAction?: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;

    const parts = trimmed.split("|");
    if (parts.length < 2) return null;

    const condition = parts[0]!.trim();
    let thenVal = parts[1] ?? "";
    let elseVal = parts[2] ?? "";

    if (subAction === "not" || subAction === "invert") {
        const tmp = thenVal;
        thenVal = elseVal;
        elseVal = tmp;
    }

    return evaluateTernaryCondition(condition, thenVal, elseVal);
}

/** 解析 smask 语法参数（范围与留头尾脱敏） */
export function resolveSmaskArg(rawArg: string, subMode?: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;

    let isKeepEnds = subMode === "ends" || subMode === "keep";
    const parts = trimmed.split("|");

    if (parts.length >= 3 && (parts[0]!.trim().toLowerCase() === "keep" || parts[0]!.trim().toLowerCase() === "ends")) {
        isKeepEnds = true;
        parts.shift();
    }

    if (isKeepEnds) {
        const text = parts[0] ?? "";
        const ks = parts[1] !== undefined ? parseInt(parts[1].trim(), 10) : 4;
        const ke = parts[2] !== undefined ? parseInt(parts[2].trim(), 10) : 4;
        const maskChar = parts[3] ? parts[3].trim() : "*";
        return maskTextRange(text, {keepStart: ks, keepEnd: ke, maskChar});
    }

    const text = parts[0] ?? "";
    const start = parts[1] !== undefined ? parseInt(parts[1].trim(), 10) : 3;
    const len = parts[2] !== undefined ? parseInt(parts[2].trim(), 10) : undefined;
    const maskChar = parts[3] ? parts[3].trim() : "*";
    return maskTextRange(text, {start, length: len, maskChar});
}

/** 解析 censor 语法参数（敏感词遮罩过滤宏） */
export function resolveCensorArg(rawArg: string, subMode?: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;

    const parts = trimmed.split("|");
    if (parts.length < 2) return null;

    const text = parts[0] ?? "";
    const words = parts[1] ?? "";
    let replacement = parts[2];

    if (subMode === "mask") {
        replacement = undefined;
    }

    return censorText(text, words, replacement);
}

/** 解析 shuffle 语法参数（列表随机打乱） */
export function resolveShuffleArg(rawArg: string, subMode?: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;

    let delim: string | undefined;
    if (subMode === "line" || subMode === "lines") {
        delim = "\n";
    }

    const firstPipe = trimmed.indexOf("|");
    let text = trimmed;
    if (firstPipe !== -1) {
        const potentialDelim = trimmed.slice(0, firstPipe).trim();
        if (potentialDelim === "\\n" || potentialDelim === "newline") {
            delim = "\n";
            text = trimmed.slice(firstPipe + 1);
        } else if (potentialDelim === "," || potentialDelim === "，" || potentialDelim === ";" || potentialDelim === " ") {
            delim = potentialDelim;
            text = trimmed.slice(firstPipe + 1);
        }
    }

    return shuffleList(text, {delimiter: delim});
}

/** 解析 progress 语法参数（Unicode/ASCII 进度条度量宏） */
export function resolveProgressArg(rawArg: string, subMode?: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;

    let style: "block" | "ascii" | "circle" = "block";
    if (subMode === "circle" || subMode === "dot") {
        style = "circle";
    } else if (subMode === "ascii" || subMode === "arrow") {
        style = "ascii";
    }

    const parts = trimmed.split("|");
    const num1 = parseFloat(parts[0]!.trim());
    if (isNaN(num1)) return null;

    let total = 100;
    let width: number | undefined;
    let showNumbers = false;

    if (parts.length >= 2) {
        const num2 = parseFloat(parts[1]!.trim());
        if (!isNaN(num2)) {
            total = num2;
            showNumbers = true;
        }
    }
    if (parts.length >= 3) {
        const num3 = parseInt(parts[2]!.trim(), 10);
        if (!isNaN(num3)) {
            width = num3;
        }
    }

    return formatTaskProgressBar(num1, {
        total,
        width,
        style,
        showPercent: true,
        showNumbers,
    });
}

/** 解析 json 语法参数（JSON 路径提取与格式化） */
export function resolveJsonArg(rawArg: string, subAction?: string): string | null {
    const trimmed = rawArg.trim();
    if (!trimmed) return null;

    if (subAction === "pretty" || subAction === "format") {
        return queryJsonPath(trimmed, "", {pretty: true});
    }
    if (subAction === "keys") {
        return queryJsonPath(trimmed, "keys");
    }

    const firstPipe = trimmed.indexOf("|");
    if (firstPipe === -1) {
        return queryJsonPath(trimmed, "");
    }

    const path = trimmed.slice(0, firstPipe).trim();
    const jsonStr = trimmed.slice(firstPipe + 1).trim();
    return queryJsonPath(jsonStr, path, {fallback: ""});
}

export function getIsoWeekNumber(d: Date): number {
    const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNr = (target.getUTCDay() + 6) % 7;
    target.setUTCDate(target.getUTCDate() - dayNr + 3);
    const firstThursday = target.getTime();
    target.setUTCMonth(0, 1);
    if (target.getUTCDay() !== 4) {
        target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target.getTime()) / 604800000);
}

export function renderPlaceholder(kind: PlaceholderKind, now: Date, doc?: {title: string; path: string; selection?: string} | null): string {
    switch (kind) {
        case "date": return renderDate(now);
        case "time": return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
        case "datetime": return `${renderDate(now)} ${renderPlaceholder("time", now)}`;
        case "weekday": return WEEKDAYS_ZH[now.getDay()] ?? "";
        case "year": return String(now.getFullYear());
        case "quarter": {
            const q = Math.floor(now.getMonth() / 3) + 1;
            return `Q${q}`;
        }
        case "month": return pad(now.getMonth() + 1);
        case "day": return pad(now.getDate());
        case "hour": return pad(now.getHours());
        case "minute": return pad(now.getMinutes());
        case "title":
        case "doc": return doc?.title ?? "";
        case "path": return doc?.path ?? "";
        case "random": return "";
        case "uuid": return generateUuidV4();
        case "id": return generateShortId(8, false);
        case "case": return "";
        case "calc": return "";
        case "selection": return doc?.selection ?? "";
        case "regex": return "";
        case "timestamp": return String(Math.floor(now.getTime() / 1000));
        case "week": return `第${getIsoWeekNumber(now)}周`;
        case "greeting": return resolveGreeting(now);
        case "url": return "";
        case "base64": return "";
        case "html": return "";
        case "count": return "0";
        case "hash": return "";
        case "number": return "";
        case "truncate": return "";
        case "mask": return "";
        case "currency": return "";
        case "filesize": return "";
        case "reverse": return "";
        case "cron": return "";
        case "timeago": return "刚刚";
        case "summary": return "";
        case "lunar": return getChineseZodiacAndStemBranch(now).full;
        case "choose": return "";
        case "words": return "";
        case "color": return "";
        case "stats": return "";
        case "radix": return "";
        case "kv": return "";
        case "match": return "";
        case "valid": return "false";
        case "template": return "";
        case "obfuscate": return "";
        case "scramble": return "";
        case "thousands": return "";
        case "checksum": return "";
        case "pad": return "";
        case "seq": return "";
        case "fingerprint": return "";
        case "randomcolor": return generateRandomColor("hex");
        case "btruncate": return "";
        case "initials": return "";
        case "plural": return "";
        case "escape": return "";
        case "repeat": return "";
        case "center": return "";
        case "slash": return "";
        case "revwords": return "";
        case "randomname": return generateRandomName("zh");
        case "if": return "";
        case "smask": return "";
        case "censor": return "";
        case "shuffle": return "";
        case "progress": return formatTaskProgressBar(100);
        case "json": return "";
        case "line": return "";
        case "csv": return "";
        case "nanoid": return generateNanoId(10);
        case "password": return generateSecurePassword(14, "complex");
        // 生态宏类（achievement/home_board/review_card 等）由宏引擎另行渲染，不在此展开；
        // 兜底空串保证穷尽性（TS2366），新增 kind 未注册渲染器时不产出脏文本
        default: return "";
    }
}

/** 解析语境自适应问候语宏 */
function resolveGreeting(now: Date, arg?: string): string {
    const hours = now.getHours();
    const cleanArg = arg?.trim().toLowerCase();

    if (cleanArg === "en" || cleanArg === "english") {
        if (hours >= 0 && hours < 12) return "Good morning";
        if (hours >= 12 && hours < 18) return "Good afternoon";
        return "Good evening";
    }

    if (cleanArg === "formal") {
        if (hours >= 6 && hours < 12) return "上午好";
        if (hours >= 12 && hours < 14) return "中午好";
        if (hours >= 14 && hours < 18) return "下午好";
        if (hours >= 18 && hours < 24) return "晚上好";
        return "您好";
    }

    if (cleanArg === "short" || cleanArg === "simple") {
        return "您好";
    }

    // 默认中文自然时段问候
    if (hours >= 0 && hours < 6) return "夜深了";
    if (hours >= 6 && hours < 12) return "早上好";
    if (hours >= 12 && hours < 14) return "中午好";
    if (hours >= 14 && hours < 18) return "下午好";
    return "晚上好";
}

/**
 * 解析占位符（含带参形态）：返回 null 表示非法/不可解析——调用方保留原文（不吞内容）。
 */
export function resolvePlaceholder(
    rawKind: string,
    arg: string | undefined,
    now: Date,
    doc?: {title: string; path: string; selection?: string} | null,
): string | null {
    let kind = rawKind as PlaceholderKind;
    let subStyle: string | undefined;
    let subAction: string | undefined;
    if (rawKind.startsWith("case")) {
        kind = "case";
        if (rawKind.includes(":")) {
            subStyle = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("regex")) {
        kind = "regex";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("url")) {
        kind = "url";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("base64")) {
        kind = "base64";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("html")) {
        kind = "html";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("count")) {
        kind = "count";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("hash")) {
        kind = "hash";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("number")) {
        kind = "number";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("truncate")) {
        kind = "truncate";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("mask")) {
        kind = "mask";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("currency")) {
        kind = "currency";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("filesize")) {
        kind = "filesize";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("reverse")) {
        kind = "reverse";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("cron")) {
        kind = "cron";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("timeago")) {
        kind = "timeago";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("summary")) {
        kind = "summary";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("lunar")) {
        kind = "lunar";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("choose")) {
        kind = "choose";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("words")) {
        kind = "words";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("color")) {
        kind = "color";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("stats")) {
        kind = "stats";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("radix")) {
        kind = "radix";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("kv")) {
        kind = "kv";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("match")) {
        kind = "match";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("valid")) {
        kind = "valid";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("path")) {
        kind = "path";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("nanoid")) {
        kind = "nanoid";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("template")) {
        kind = "template";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("obfuscate")) {
        kind = "obfuscate";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("scramble")) {
        kind = "scramble";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("thousands")) {
        kind = "thousands";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("checksum")) {
        kind = "checksum";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("pad")) {
        kind = "pad";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("seq")) {
        kind = "seq";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("fingerprint")) {
        kind = "fingerprint";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("randomcolor")) {
        kind = "randomcolor";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("btruncate")) {
        kind = "btruncate";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("initials")) {
        kind = "initials";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("plural")) {
        kind = "plural";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("escape")) {
        kind = "escape";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("repeat")) {
        kind = "repeat";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("center")) {
        kind = "center";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("slash")) {
        kind = "slash";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("revwords")) {
        kind = "revwords";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("randomname")) {
        kind = "randomname";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("if")) {
        kind = "if";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("smask")) {
        kind = "smask";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("censor")) {
        kind = "censor";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("shuffle")) {
        kind = "shuffle";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("progress")) {
        kind = "progress";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("json")) {
        kind = "json";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("line")) {
        kind = "line";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    } else if (rawKind.startsWith("csv")) {
        kind = "csv";
        if (rawKind.includes(":")) {
            subAction = rawKind.split(":")[1];
        }
    }
    if (
        rawKind.startsWith("checkin:") ||
        rawKind.startsWith("home:") ||
        rawKind.startsWith("butler:") ||
        rawKind.startsWith("task:") ||
        rawKind.startsWith("glean:") ||
        rawKind.startsWith("contacts:")
    ) {
        return null; // 留给 variables.ts 预览层与 commands.ts 生态桥接特化渲染
    }
    if (kind === "random") return arg ? pickRandomOption(arg) : null;
    if (kind === "date") return arg ? resolveDateArg(now, arg) : renderDate(now);
    if (kind === "time") return arg ? resolveTimeArg(now, arg) : `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    if (kind === "datetime") return arg ? resolveDatetimeArg(now, arg) : `${renderDate(now)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    if (kind === "weekday") return arg ? resolveWeekdayArg(now, arg) : (WEEKDAYS_ZH[now.getDay()] ?? "");
    if (kind === "year") {
        if (arg?.trim().toLowerCase() === "short" || arg?.trim() === "2") return String(now.getFullYear()).slice(-2);
        return String(now.getFullYear());
    }
    if (kind === "quarter") {
        const q = Math.floor(now.getMonth() / 3) + 1;
        const cleanArg = arg?.trim().toLowerCase();
        if (cleanArg === "zh" || cleanArg === "cn") {
            const zhNum = ["一", "二", "三", "四"][q - 1];
            return `第${zhNum}季度`;
        }
        if (cleanArg === "full") return `${now.getFullYear()}Q${q}`;
        return `Q${q}`;
    }
    if (kind === "month") {
        const cleanArg = arg?.trim().toLowerCase();
        if (cleanArg === "zh" || cleanArg === "cn") return `${now.getMonth() + 1}月`;
        return pad(now.getMonth() + 1);
    }
    if (kind === "day") {
        const cleanArg = arg?.trim().toLowerCase();
        if (cleanArg === "zh" || cleanArg === "cn") return `${now.getDate()}日`;
        return pad(now.getDate());
    }
    if (kind === "hour") return pad(now.getHours());
    if (kind === "minute") return pad(now.getMinutes());
    if (kind === "uuid") return arg ? resolveUuidArg(arg) : generateUuidV4();
    if (kind === "nanoid") return resolveNanoIdArg(arg || subAction);
    if (kind === "id") return arg ? resolveIdArg(arg) : generateShortId(8, false);
    if (kind === "password") return arg ? resolvePasswordArg(arg) : generateSecurePassword(14, "complex");
    if (kind === "case") return arg ? resolveCaseArg(arg, subStyle) : null;
    if (kind === "calc") return arg ? evaluateMathExpression(arg) : null;
    if (kind === "selection") return (doc?.selection && doc.selection.length > 0) ? doc.selection : (arg ?? "");
    if (kind === "regex") return arg ? resolveRegexArg(arg, subAction) : null;
    if (kind === "timestamp") {
        if (arg?.trim().toLowerCase() === "ms") {
            return String(now.getTime());
        }
        return String(Math.floor(now.getTime() / 1000));
    }
    if (kind === "week") {
        const weekNum = getIsoWeekNumber(now);
        const cleanArg = arg?.trim().toLowerCase();
        if (cleanArg === "num" || cleanArg === "number") return String(weekNum);
        if (cleanArg === "w") return `W${weekNum}`;
        return `第${weekNum}周`;
    }
    if (kind === "greeting") return resolveGreeting(now, arg);
    if (kind === "url") return arg ? resolveUrlArg(arg, subAction) : null;
    if (kind === "base64") return arg ? resolveBase64Arg(arg, subAction) : null;
    if (kind === "html") return arg ? resolveHtmlArg(arg, subAction) : null;
    if (kind === "count") return arg ? resolveCountArg(arg, subAction) : null;
    if (kind === "hash") return arg ? resolveHashArg(arg, subAction) : null;
    if (kind === "number") return arg ? resolveNumberArg(arg, subAction) : null;
    if (kind === "truncate") return arg ? resolveTruncateArg(arg, subAction) : null;
    if (kind === "mask") return arg ? resolveMaskArg(arg, subAction) : null;
    if (kind === "currency") return arg ? resolveCurrencyArg(arg) : null;
    if (kind === "filesize") return arg ? resolveFilesizeArg(arg, subAction) : null;
    if (kind === "reverse") return arg ? resolveReverseArg(arg) : null;
    if (kind === "cron") return arg ? resolveCronArg(arg) : null;
    if (kind === "timeago") return arg ? resolveTimeagoArg(arg, now) : "刚刚";
    if (kind === "summary") return arg ? resolveSummaryArg(arg, subAction) : null;
    if (kind === "lunar") return resolveLunarArg(arg || "", now, subAction);
    if (kind === "choose") return arg ? resolveChooseArg(arg) : null;
    if (kind === "words") return arg ? resolveWordsArg(arg, subAction) : null;
    if (kind === "color") return arg ? resolveColorArg(arg, subAction) : null;
    if (kind === "stats") return arg ? resolveStatsArg(arg, subAction) : null;
    if (kind === "radix") return arg ? resolveRadixArg(arg, subAction) : null;
    if (kind === "kv") return arg ? resolveKvArg(arg, subAction) : null;
    if (kind === "match") return arg ? resolveMatchArg(arg, subAction) : null;
    if (kind === "valid") return arg ? resolveValidArg(arg, subAction) : null;
    if (kind === "template") return arg ? resolveTemplateArg(arg) : null;
    if (kind === "obfuscate") return arg ? resolveObfuscateArg(arg, subAction) : null;
    if (kind === "scramble") return arg ? resolveScrambleArg(arg, subAction) : null;
    if (kind === "thousands") return arg ? resolveThousandsArg(arg, subAction) : null;
    if (kind === "checksum") return arg ? resolveChecksumArg(arg, subAction) : null;
    if (kind === "pad") return arg ? resolvePadArg(arg, subAction) : null;
    if (kind === "seq") return arg ? resolveSeqArg(arg, subAction) : null;
    if (kind === "fingerprint") return arg ? resolveFingerprintArg(arg, subAction) : null;
    if (kind === "randomcolor") return resolveRandomColorArg(arg, subAction);
    if (kind === "btruncate") return arg ? resolveBtruncateArg(arg, subAction) : null;
    if (kind === "initials") return arg ? resolveInitialsArg(arg, subAction) : null;
    if (kind === "plural") return arg ? resolvePluralArg(arg, subAction) : null;
    if (kind === "escape") return arg ? resolveEscapeArg(arg, subAction) : null;
    if (kind === "repeat") return arg ? resolveRepeatArg(arg, subAction) : null;
    if (kind === "center") return arg ? resolveCenterArg(arg, subAction) : null;
    if (kind === "slash") return arg ? resolveSlashArg(arg, subAction) : null;
    if (kind === "revwords") return arg ? resolveRevwordsArg(arg) : null;
    if (kind === "randomname") return resolveRandomNameArg(arg, subAction);
    if (kind === "if") return arg ? resolveIfArg(arg, subAction) : null;
    if (kind === "smask") return arg ? resolveSmaskArg(arg, subAction) : null;
    if (kind === "censor") return arg ? resolveCensorArg(arg, subAction) : null;
    if (kind === "shuffle") return arg ? resolveShuffleArg(arg, subAction) : null;
    if (kind === "progress") return arg ? resolveProgressArg(arg, subAction) : formatTaskProgressBar(100);
    if (kind === "json") return arg ? resolveJsonArg(arg, subAction) : null;
    if (kind === "line") return arg ? resolveLineArg(arg, subAction) : null;
    if (kind === "csv") return arg ? resolveCsvArg(arg, subAction) : null;
    if (kind === "achievement" || (kind.startsWith("checkin") && subAction !== "today" && arg !== "today")) {
        const today = formatLocalDate(now);
        return [
            `> 🌅 **今日自律成就卡 · ${today}**`,
            `> 达成率: **0%** (0/3) · 连续 1 天🔥`,
            `>`,
            `> - [ ] **晨间阅读 30 分钟** \`⚪ 保底\` ⚡+2`,
            `> - [ ] **核心技能刻意练习** \`🟢 达标\` ⚡+3`,
            `> - [ ] **晚间复盘总结** \`🔥 突破\` ⚡+5`,
            `{: custom-type="daily-achievement" custom-checkin-card="true" }`,
        ].join("\n");
    }
    if (kind === "home_board" || kind.startsWith("home")) {
        const today = formatLocalDate(now);
        return [
            `> 🏠 **今日家庭生活备忘与到期预警 · ${today}**`,
            `> 待处理: **0** 项 (🔴 逾期: **0** · 🟠 7天内: **0** · 🟡 预警期: **0**)`,
            `>`,
            `> - 🟢 今日家庭资产与证件状态安全，无临期到期事项`,
            `{: custom-type="home-alert-board" custom-home-summary="true" }`,
        ].join("\n");
    }
    if (kind === "review_card" || kind.startsWith("cards")) {
        const today = formatLocalDate(now);
        return [
            `> 🗂️ **今日闪卡复习战报 · ${today}**`,
            `> 复习完成: **0** 张 · 掌握率: **100%** (🟢 熟练: 0 · 🟡 勉强: 0 · 🔴 遗忘: 0)`,
            `>`,
            `> - ⏱️ **专注用时**: 0 分钟`,
            `{: custom-type="flashcard-review-summary" custom-cards-reviewed="0" custom-retention="100" }`,
        ].join("\n");
    }
    if (kind === "exam_scorecard" || kind.startsWith("exam")) {
        const title = arg ? arg.replace(/[\r\n]+/g, " ").trim() : "综合专项测验";
        return [
            `> 📝 **今日测评战报 · ${title}**`,
            `> 成绩: **100/100** (100%) · 🟢 通过 · 订正待办: **0** 项`,
            `>`,
            `> - ⏱️ **考场状态与节奏**: 🌊 认知心流平稳`,
            `{: custom-type="exam-scorecard" custom-score="100" custom-pass="true" }`,
        ].join("\n");
    }
    if (kind === "reading_digest" || kind.startsWith("glean")) {
        const today = formatLocalDate(now);
        return [
            `> 📖 **今日阅读拾遗轨迹 · ${today}**`,
            `> 今日完成阅读: **0** 篇 · ⏱️ 累计阅读 **0** 分钟`,
            `>`,
            `> - 💡 暂无今日新增剪藏已读条目，保持好奇心继续探索`,
            `{: custom-type="glean-reading-digest" custom-reading-count="0" }`,
        ].join("\n");
    }
    if (kind === "meeting_brief" || kind.startsWith("contacts")) {
        const person = arg ? arg.replace(/[\r\n]+/g, " ").trim() : "联系人";
        return [
            `> 🤝 **与 ${person} 的会前 30 秒破冰速览**`,
            `> 圈层: **核心圈** · 关系温度: **🟢 密切**`,
            `>`,
            `> - 💬 **上次聊了什么**: 近期重点交流与事务协同`,
            `> - ❤️ **喜好习惯**: 偏好直接务实沟通`,
            `> - ⚠️ **敏感雷区**: 避免无准备长会`,
            `{: custom-type="meeting-brief" custom-person="${person}" }`,
        ].join("\n");
    }
    if (kind === "path") {
        if (!arg && !subAction) return doc?.path ?? "";
        return resolvePathArg(arg, subAction, doc?.path ?? "");
    }
    if (arg) return null;
    return renderPlaceholder(kind, now, doc);
}

/** 应用占位符替换（resolver 返回各 kind 的值）。enabled=false 时原文返回（一字不改）。 */
export function applyPlaceholders(text: string, now: Date, enabled: boolean, doc?: {title: string; path: string; selection?: string} | null): string {
    if (!enabled || !text) return text;
    // 1. 标准 {{xlc:...}} 动态占位符替换
    let result = text.replace(PLACEHOLDER_PATTERN, (match, kind: string, arg?: string) => {
        return resolvePlaceholder(kind, arg, now, doc) ?? match;
    });

    // 2. 扩展 Templater / Espanso 相对日期偏移：{{date+Nd}} / {{date-Nd}} / {{date+1w}} / {{date+1m}} / {{date+1y}}
    result = result.replace(/\{\{date([+-]\d{1,4}[dwmy])\}\}/g, (_match, offset: string) => {
        return resolveDateArg(now, offset) ?? _match;
    });

    // 3. 扩展自定义日期格式化：{{date:FORMAT}}
    result = result.replace(/\{\{date:([^}]+)\}\}/g, (_match, formatPattern: string) => {
        const trimmed = formatPattern.trim();
        return resolveDateArg(now, trimmed) || formatDateTime(now, trimmed) || _match;
    });

    // 4. 扩展当前文档上下文：{{doc.title}} 与 {{doc.path}}（裸 {{date}} 留给思源原生模板，避免误伤，见 R6 契约）
    result = result.replace(/\{\{doc\.title\}\}/g, () => doc?.title ?? "");
    result = result.replace(/\{\{doc\.path\}\}/g, () => doc?.path ?? "");

    return result;
}

/** 诊断：列出文本中出现的占位符种类（回执/提示/预取判定用） */
export function listPlaceholders(text: string): PlaceholderKind[] {
    const kinds: PlaceholderKind[] = [];
    for (const match of text.matchAll(PLACEHOLDER_PATTERN)) {
        const rawKind = match[1]!;
        const kind = (rawKind.startsWith("case")
            ? "case"
            : rawKind.startsWith("regex")
                ? "regex"
                : rawKind.startsWith("url")
                    ? "url"
                    : rawKind.startsWith("base64")
                        ? "base64"
                        : rawKind.startsWith("html")
                            ? "html"
                            : rawKind.startsWith("count")
                                ? "count"
                                : rawKind.startsWith("kv")
                                    ? "kv"
                                    : rawKind.startsWith("match")
                                        ? "match"
                                        : rawKind.startsWith("valid")
                                            ? "valid"
                                            : rawKind.startsWith("path")
                                                ? "path"
                                                : rawKind.startsWith("nanoid")
                                                    ? "nanoid"
                                                    : rawKind.startsWith("template")
                                                        ? "template"
                                                        : rawKind.startsWith("obfuscate")
                                                            ? "obfuscate"
                                                            : rawKind.startsWith("scramble")
                                                                ? "scramble"
                                                                : rawKind.startsWith("thousands")
                                                                    ? "thousands"
                                                                    : rawKind.startsWith("checksum")
                                                                        ? "checksum"
                                                                        : rawKind.startsWith("pad")
                                                                            ? "pad"
                                                                        : rawKind.startsWith("seq")
                                                                            ? "seq"
                                                                            : rawKind.startsWith("fingerprint")
                                                                                ? "fingerprint"
                                                                                : rawKind.startsWith("randomcolor")
                                                                                    ? "randomcolor"
                                                                                    : rawKind.startsWith("btruncate")
                                                                                        ? "btruncate"
                                                                                        : rawKind.startsWith("initials")
                                                                                            ? "initials"
                                                                                                : rawKind.startsWith("plural")
                                                                                                    ? "plural"
                                                                                                    : rawKind.startsWith("escape")
                                                                                                        ? "escape"
                                                                                                        : rawKind.startsWith("repeat")
                                                                                                            ? "repeat"
                                                                                                            : rawKind.startsWith("center")
                                                                                                                ? "center"
                                                                                                                : rawKind.startsWith("slash")
                                                                                                                    ? "slash"
                                                                                                                    : rawKind.startsWith("revwords")
                                                                                                                        ? "revwords"
                                                                                                                        : rawKind.startsWith("randomname")
                                                                                                                            ? "randomname"
                                                                                                                            : rawKind.startsWith("if")
                                                                                                                                ? "if"
                                                                                                                                : rawKind.startsWith("smask")
                                                                                                                                    ? "smask"
                                                                                                                                        : rawKind.startsWith("censor")
                                                                                                                                        ? "censor"
                                                                                                                                        : rawKind.startsWith("shuffle")
                                                                                                                                            ? "shuffle"
                                                                                                                                            : rawKind.startsWith("progress")
                                                                                                                                                ? "progress"
                                                                                                                                                : rawKind.startsWith("json")
                                                                                                                                                    ? "json"
                                                                                                                                                    : rawKind.startsWith("line")
                                                                                                                                                        ? "line"
                                                                                                                                                        : rawKind.startsWith("csv")
                                                                                                                                                            ? "csv"
                                                                                                                                                            : rawKind) as PlaceholderKind;
        if (!kinds.includes(kind)) kinds.push(kind);
    }
    if (text && text.includes("{{")) {
        if (/\{\{date(?:[+-]\d{1,4}[dwmy]|:[^}]+)\}\}/.test(text) && !kinds.includes("date")) kinds.push("date");
        if (/\{\{doc\.title\}\}/.test(text) && !kinds.includes("title")) kinds.push("title");
        if (/\{\{doc\.path\}\}/.test(text) && !kinds.includes("path")) kinds.push("path");
    }
    return kinds;
}
