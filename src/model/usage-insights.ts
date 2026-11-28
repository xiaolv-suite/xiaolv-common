// 常用语使用热力透视与时间节省计算引擎（ADR 0081 / G28 / T-0140）
// 纯函数、零副作用、纯本地计算：量化使用收益与活跃频度

import {UsageEntry} from "./storage";

export interface UsageItemMeta {
    id: string;
    title: string;
    contentLength?: number;
}

export interface UsageInsightItem {
    id: string;
    title: string;
    count: number;
    lastAt: number;
    savedKeystrokes: number;
}

export interface UsageInsightsResult {
    /** 累计总调用次数 */
    totalCalls: number;
    /** 累计节省击键数 */
    totalSavedKeystrokes: number;
    /** 估算节省打字时间（分钟） */
    estimatedMinutesSaved: number;
    /** 格式化节省时间可读文案，如 "15 分钟"、"2.4 小时" */
    formattedTimeSaved: string;
    /** 最近 7 天内活跃使用的条目数 */
    activeItems7Days: number;
    /** Top 5 最常使用条目 */
    topItems: UsageInsightItem[];
}

/** 键盘人均输入速度常数：每分钟约 200 字符（约 40 词） */
export const TYPING_CPM = 200;

/** 呼出弹窗与检索的按键成本（快捷键 + 3 字符检索 + 回车） */
export const INVOKE_OVERHEAD_KEYSTROKES = 6;

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** 格式化分钟为人类易读的时间字符串 */
export function formatSavedTime(minutes: number): string {
    if (minutes < 1) {
        return "< 1 分钟";
    }
    if (minutes < 60) {
        return `${Math.round(minutes)} 分钟`;
    }
    const hours = (minutes / 60).toFixed(1);
    return `${hours.endsWith(".0") ? hours.slice(0, -2) : hours} 小时`;
}

/**
 * 纯函数：计算常用语使用热力透视指标与工时节约估算
 * @param usage 侧车使用字典
 * @param items 条目元数据列表（提供条目正文长度估算击键量）
 * @param now 当前时间戳（ms）
 */
export function calculateUsageInsights(
    usage: Readonly<Record<string, UsageEntry>>,
    items: readonly UsageItemMeta[],
    now: number,
): UsageInsightsResult {
    let totalCalls = 0;
    let totalSavedKeystrokes = 0;
    let activeItems7Days = 0;

    const itemMap = new Map<string, UsageItemMeta>();
    for (const item of items) {
        itemMap.set(item.id, item);
    }

    const insightItems: UsageInsightItem[] = [];

    for (const [id, entry] of Object.entries(usage ?? {})) {
        if (!Number.isInteger(entry.count) || entry.count <= 0) continue;
        const count = entry.count;
        const lastAt = Number(entry.lastAt) || 0;
        totalCalls += count;

        if (now - lastAt <= SEVEN_DAYS_MS) {
            activeItems7Days++;
        }

        const meta = itemMap.get(id);
        const title = meta?.title || id;
        // 若未提供正文长度，默认保底估算为 25 字符（短常用语平均长度）
        const len = typeof meta?.contentLength === "number" && meta.contentLength > 0 ? meta.contentLength : 25;
        const perCallSaved = Math.max(0, len - INVOKE_OVERHEAD_KEYSTROKES);
        const savedKeystrokes = perCallSaved * count;
        totalSavedKeystrokes += savedKeystrokes;

        insightItems.push({
            id,
            title,
            count,
            lastAt,
            savedKeystrokes,
        });
    }

    insightItems.sort((a, b) => b.count - a.count);
    const topItems = insightItems.slice(0, 5);

    const estimatedMinutesSaved = Math.round((totalSavedKeystrokes / TYPING_CPM) * 10) / 10;
    const formattedTimeSaved = formatSavedTime(estimatedMinutesSaved);

    return {
        totalCalls,
        totalSavedKeystrokes,
        estimatedMinutesSaved,
        formattedTimeSaved,
        activeItems7Days,
        topItems,
    };
}

/**
 * 过滤 Top 榜中已不在库内的幽灵条目（R431）：
 * 条目被删除后侧车 usage 仍保留其调用记录，meta 缺失时标题兜底为裸块 ID（xlc-xxxx），
 * 且「点击直接复制」必然静默失败——榜单只展示仍存在的资产。
 */
export function filterKnownTopItems(
    topItems: readonly UsageInsightItem[],
    knownIds: ReadonlySet<string>,
): UsageInsightItem[] {
    return topItems.filter((item) => knownIds.has(item.id));
}

export interface HeatmapDay {
    /** 日期，格式 YYYY-MM-DD */
    date: string;
    /** 当日复用调用频次 */
    count: number;
    /** 活跃等级 0..4 (GitHub standard: 0=无, 1=1-2, 2=3-5, 3=6-9, 4=10+) */
    level: 0 | 1 | 2 | 3 | 4;
}

export interface HeatmapResult {
    days: HeatmapDay[];
    totalCalls30Days: number;
    maxDayCount: number;
    activeDays: number;
}

/**
 * 纯函数：聚合侧车每日使用记录，并可由已有 usage.lastAt 进行合理数据回填
 */
export function buildDailyUsageMap(
    dailyUsage: Readonly<Record<string, number>> | undefined,
    usage: Readonly<Record<string, UsageEntry>> | undefined,
): Record<string, number> {
    const result: Record<string, number> = {...(dailyUsage ?? {})};
    if (usage) {
        for (const entry of Object.values(usage)) {
            if (entry.lastAt && entry.lastAt > 0) {
                const d = new Date(entry.lastAt);
                const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                if (!result[dateKey]) {
                    result[dateKey] = Math.min(entry.count, 5);
                }
            }
        }
    }
    return result;
}

/**
 * 纯函数：计算近 30 天每日资产复用活跃热力分布（GitHub-style 贡献格数据模型）
 * @param dailyUsage 每日使用记录 YYYY-MM-DD -> count
 * @param daysCount 默认 30 天
 * @param now 基准时间戳（ms）
 */
export function calculateHeatmap(
    dailyUsage: Readonly<Record<string, number>>,
    daysCount = 30,
    now: number = Date.now(),
): HeatmapResult {
    const days: HeatmapDay[] = [];
    let totalCalls30Days = 0;
    let maxDayCount = 0;
    let activeDays = 0;

    const msPerDay = 24 * 60 * 60 * 1000;
    for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now - i * msPerDay);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const dayStr = String(d.getDate()).padStart(2, "0");
        const dateKey = `${y}-${m}-${dayStr}`;
        const count = Math.max(0, Number(dailyUsage[dateKey]) || 0);

        if (count > 0) activeDays++;
        if (count > maxDayCount) maxDayCount = count;
        totalCalls30Days += count;

        let level: 0 | 1 | 2 | 3 | 4 = 0;
        if (count >= 10) level = 4;
        else if (count >= 6) level = 3;
        else if (count >= 3) level = 2;
        else if (count >= 1) level = 1;

        days.push({
            date: dateKey,
            count,
            level,
        });
    }

    return {
        days,
        totalCalls30Days,
        maxDayCount,
        activeDays,
    };
}

