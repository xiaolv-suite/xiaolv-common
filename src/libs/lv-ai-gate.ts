/**
 * 小驴全生态 · 单一真相 AI 隐私闸门与共用生态开关契约 (lv-ai-gate.ts)
 * Protocol v200
 *
 * 职责：
 * 1. 统一读写 lv_ecosystem_toggles_v1（5+1 共用生态能力总开关）；
 * 2. 8 大插件中英文简称 -> 标准插件 ID 严格归一化表 (normalizeLvPluginId)；
 * 3. 单一真相闸门 assertLvAiChannelAllowed(ctx)：
 *    - aiSiyuanOnly === true 时硬拦截一切非思源 /api/ai/* 外发（含 user_custom、ollama、public_free 及显式 endpoint+apiKey 直连），抛出 LvAiPolicyBlockedError("ai_siyuan_only")；
 *    - 读取生态共享 Key 时校验 aiSharedKeyAllowedPlugins[pluginId] !== false；
 *    - 绑定 expectedOrigin 防止外发预检确认后临时漂移切换；
 * 4. resolveLvAiDestinationLabel(ctx) 输出人类可读的真实目标去向标签。
 */

export const LV_ECOSYSTEM_TOGGLES_KEY = "lv_ecosystem_toggles_v1";
export const LV_BLOCK_ASSISTANT_MASTER_KEY = "lv_block_assistant_enabled_v1";

export const LV_ECOSYSTEM_PLUGIN_IDS = [
    "siyuan-checkin",
    "siyuan-home",
    "siyuan-contacts",
    "siyuan-glean",
    "siyuan-lv-cards",
    "siyuan-exam",
    "xiaolv-common",
    "siyuan-speed-switch",
] as const;

export type LvEcosystemPluginId = (typeof LV_ECOSYSTEM_PLUGIN_IDS)[number];

export interface LvEcosystemToggles {
    /** ① 块助手（联动 lv_block_assistant_enabled_v1，默认 false） */
    blockAssistant: boolean;
    /** 块助手仅快捷键 Alt+B 唤醒（隐藏悬浮入口，默认 false） */
    blockAssistantAltBOnly: boolean;
    /** ② 小驴罗盘总入口（顶栏磁贴/移动球/弹出坞，默认 true） */
    launchpad: boolean;
    /** ③ 统一通知中心（默认 true） */
    noticeCenter: boolean;
    /** ③-a 第三方弹窗收拢哨兵（默认 true） */
    externalModalHarmonizer: boolean;
    /** ③-b 原生 #message 接管（默认 true） */
    nativeMessageBridge: boolean;
    /** ④ 仅允许思源本体 AI 总开关（默认 false） */
    aiSiyuanOnly: boolean;
    /** ④-a 共享 AI Key 按插件授权勾选（默认 8 插件全允许） */
    aiSharedKeyAllowedPlugins: Record<string, boolean>;
    /** ⑤ 活动流与日记联动（默认 true） */
    activityLog: boolean;
    /** ⑥ 8 仓共用跨机自动快照容灾（默认 true） */
    autoSnapshotVault: boolean;
}

export interface LvGateStorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

export const SOURCE_ALIAS_TO_PLUGIN_ID: Record<string, string> = {
    // 1. 小驴打卡
    "siyuan-checkin": "siyuan-checkin",
    "checkin": "siyuan-checkin",
    "lv-checkin": "siyuan-checkin",
    "xiaolv-checkin": "siyuan-checkin",
    "打卡": "siyuan-checkin",
    "小驴打卡": "siyuan-checkin",
    // 2. 小驴管家
    "siyuan-home": "siyuan-home",
    "home": "siyuan-home",
    "lv-home": "siyuan-home",
    "xiaolv-home": "siyuan-home",
    "管家": "siyuan-home",
    "小驴管家": "siyuan-home",
    // 3. 小驴人脉
    "siyuan-contacts": "siyuan-contacts",
    "contacts": "siyuan-contacts",
    "lv-contacts": "siyuan-contacts",
    "xiaolv-contacts": "siyuan-contacts",
    "人脉": "siyuan-contacts",
    "小驴人脉": "siyuan-contacts",
    // 4. 小驴拾遗
    "siyuan-glean": "siyuan-glean",
    "glean": "siyuan-glean",
    "lv-glean": "siyuan-glean",
    "xiaolv-glean": "siyuan-glean",
    "拾遗": "siyuan-glean",
    "小驴拾遗": "siyuan-glean",
    // 5. 小驴闪卡
    "siyuan-lv-cards": "siyuan-lv-cards",
    "lv-cards": "siyuan-lv-cards",
    "cards": "siyuan-lv-cards",
    "xiaolv-cards": "siyuan-lv-cards",
    "闪卡": "siyuan-lv-cards",
    "小驴闪卡": "siyuan-lv-cards",
    // 6. 小驴考试
    "siyuan-exam": "siyuan-exam",
    "exam": "siyuan-exam",
    "lv-exam": "siyuan-exam",
    "xiaolv-exam": "siyuan-exam",
    "考试": "siyuan-exam",
    "小驴考试": "siyuan-exam",
    // 7. 小驴常用
    "xiaolv-common": "xiaolv-common",
    "siyuan-common": "xiaolv-common",
    "common": "xiaolv-common",
    "lv-common": "xiaolv-common",
    "常用": "xiaolv-common",
    "小驴常用": "xiaolv-common",
    // 8. 小驴雷切
    "siyuan-speed-switch": "siyuan-speed-switch",
    "speed-switch": "siyuan-speed-switch",
    "raikiri": "siyuan-speed-switch",
    "leiqie": "siyuan-speed-switch",
    "雷切": "siyuan-speed-switch",
    "小驴雷切": "siyuan-speed-switch",
    // 生态通用源
    "罗盘": "lv-launchpad",
    "小驴罗盘": "lv-launchpad",
    "launchpad": "lv-launchpad",
    "lv-launchpad": "lv-launchpad",
    "块助手": "lv-block-assistant",
    "block-assistant": "lv-block-assistant",
    "lv-block-assistant": "lv-block-assistant",
};

export type LvAiPolicyBlockCode =
    | "ai_siyuan_only"
    | "ai_shared_key_denied"
    | "ai_origin_mismatch";

export class LvAiPolicyBlockedError extends Error {
    readonly code: LvAiPolicyBlockCode;
    readonly pluginId: string;
    readonly channel: string;

    constructor(
        code: LvAiPolicyBlockCode,
        pluginId = "",
        channel = "",
        message?: string
    ) {
        const defaultMsg =
            code === "ai_siyuan_only"
                ? "已开启「仅允许思源本体 AI」隐私保护，已拦截外部 AI 外发请求"
                : code === "ai_shared_key_denied"
                ? `插件「${pluginId || "未知"}」未被授权读取生态共享 AI Key`
                : "外部 AI 目标域名与预检确认不一致，已拦截潜在漂移外发";
        super(message || defaultMsg);
        this.name = "LvAiPolicyBlockedError";
        this.code = code;
        this.pluginId = pluginId;
        this.channel = channel;
    }
}

export function normalizeLvPluginId(source?: string | null): string {
    const raw = String(source || "").trim();
    if (!raw) return "";
    const lower = raw.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(SOURCE_ALIAS_TO_PLUGIN_ID, lower)) {
        return SOURCE_ALIAS_TO_PLUGIN_ID[lower]!;
    }
    if (Object.prototype.hasOwnProperty.call(SOURCE_ALIAS_TO_PLUGIN_ID, raw)) {
        return SOURCE_ALIAS_TO_PLUGIN_ID[raw]!;
    }
    // 尝试前缀/包含匹配常见中文插件名
    for (const [alias, id] of Object.entries(SOURCE_ALIAS_TO_PLUGIN_ID)) {
        if (alias.length >= 2 && (lower === alias || lower.startsWith(`${alias}:`) || lower.startsWith(`${alias}-`) || lower.includes(alias))) {
            return id;
        }
    }
    return lower;
}

function resolveStorage(explicit?: LvGateStorageLike | null): LvGateStorageLike | null {
    if (explicit) return explicit;
    try {
        if (typeof localStorage !== "undefined") return localStorage;
    } catch { /* ignore */ }
    try {
        const w = typeof window !== "undefined" ? (window as unknown as { localStorage?: LvGateStorageLike }) : null;
        if (w?.localStorage) return w.localStorage;
    } catch { /* ignore */ }
    return null;
}

export function createDefaultAllowedAiPlugins(): Record<string, boolean> {
    const out: Record<string, boolean> = {};
    for (const id of LV_ECOSYSTEM_PLUGIN_IDS) {
        out[id] = true;
    }
    return out;
}

export function createDefaultLvEcosystemToggles(): LvEcosystemToggles {
    return {
        blockAssistant: false,
        blockAssistantAltBOnly: false,
        launchpad: true,
        noticeCenter: true,
        externalModalHarmonizer: true,
        nativeMessageBridge: true,
        aiSiyuanOnly: false,
        aiSharedKeyAllowedPlugins: createDefaultAllowedAiPlugins(),
        activityLog: true,
        autoSnapshotVault: true,
    };
}

export function getLvEcosystemToggles(storage?: LvGateStorageLike | null): LvEcosystemToggles {
    const defaults = createDefaultLvEcosystemToggles();
    const ls = resolveStorage(storage);
    if (!ls) return defaults;
    try {
        const raw = ls.getItem(LV_ECOSYSTEM_TOGGLES_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        const baRaw = ls.getItem(LV_BLOCK_ASSISTANT_MASTER_KEY);
        const blockAssistant =
            baRaw === "true"
                ? true
                : baRaw === "false"
                ? false
                : parsed && typeof parsed.blockAssistant === "boolean"
                ? parsed.blockAssistant
                : false;

        const allowedMap = createDefaultAllowedAiPlugins();
        if (parsed && parsed.aiSharedKeyAllowedPlugins && typeof parsed.aiSharedKeyAllowedPlugins === "object") {
            for (const [k, v] of Object.entries(parsed.aiSharedKeyAllowedPlugins)) {
                const norm = normalizeLvPluginId(k) || k;
                if (typeof v === "boolean") allowedMap[norm] = v;
            }
        }

        return {
            blockAssistant,
            blockAssistantAltBOnly: parsed?.blockAssistantAltBOnly === true,
            launchpad: parsed?.launchpad !== false,
            noticeCenter: parsed?.noticeCenter !== false,
            externalModalHarmonizer: parsed?.externalModalHarmonizer !== false,
            nativeMessageBridge: parsed?.nativeMessageBridge !== false,
            aiSiyuanOnly: parsed?.aiSiyuanOnly === true,
            aiSharedKeyAllowedPlugins: allowedMap,
            activityLog: parsed?.activityLog !== false,
            autoSnapshotVault: parsed?.autoSnapshotVault !== false,
        };
    } catch {
        return defaults;
    }
}

export function setLvEcosystemToggles(
    patch: Partial<LvEcosystemToggles>,
    storage?: LvGateStorageLike | null
): LvEcosystemToggles {
    const ls = resolveStorage(storage);
    const current = getLvEcosystemToggles(ls);
    const nextAllowed: Record<string, boolean> = { ...current.aiSharedKeyAllowedPlugins };
    if (patch.aiSharedKeyAllowedPlugins && typeof patch.aiSharedKeyAllowedPlugins === "object") {
        for (const [k, v] of Object.entries(patch.aiSharedKeyAllowedPlugins)) {
            const norm = normalizeLvPluginId(k) || k;
            if (typeof v === "boolean") nextAllowed[norm] = v;
        }
    }
    const next: LvEcosystemToggles = {
        ...current,
        ...patch,
        aiSharedKeyAllowedPlugins: nextAllowed,
    };
    if (ls) {
        try {
            ls.setItem(LV_ECOSYSTEM_TOGGLES_KEY, JSON.stringify(next));
            if (typeof patch.blockAssistant === "boolean") {
                ls.setItem(LV_BLOCK_ASSISTANT_MASTER_KEY, patch.blockAssistant ? "true" : "false");
            }
        } catch { /* ignore */ }
    }
    try {
        if (typeof window !== "undefined" && typeof window.dispatchEvent === "function" && typeof CustomEvent === "function") {
            window.dispatchEvent(new CustomEvent("lv-ecosystem-toggles-changed", { detail: next }));
        }
    } catch { /* ignore */ }
    return next;
}

export function isLvPluginSharedKeyAllowed(
    source?: string | null,
    storage?: LvGateStorageLike | null
): boolean {
    const toggles = getLvEcosystemToggles(storage);
    const pid = normalizeLvPluginId(source);
    if (!pid) return true;
    if (Object.prototype.hasOwnProperty.call(toggles.aiSharedKeyAllowedPlugins, pid)) {
        return toggles.aiSharedKeyAllowedPlugins[pid] !== false;
    }
    return true;
}

export interface LvAiDestinationInfo {
    kind: "siyuan" | "user_custom" | "ollama" | "public_free" | "rule_fallback";
    label: string;
    hostname: string;
    origin: string;
}

function parseUrlSafe(raw?: string | null): { origin: string; hostname: string; pathname: string } | null {
    const text = String(raw || "").trim();
    if (!text) return null;
    if (text.startsWith("/") && !text.startsWith("//")) {
        return { origin: "", hostname: "", pathname: text };
    }
    try {
        const u = new URL(text);
        return { origin: u.origin, hostname: u.hostname, pathname: u.pathname };
    } catch {
        return null;
    }
}

export function resolveLvAiDestinationLabel(ctx: {
    channel?: string;
    endpoint?: string;
    url?: string;
}): LvAiDestinationInfo {
    const ch = String(ctx?.channel || "").trim().toLowerCase();
    const rawUrl = String(ctx?.url || ctx?.endpoint || "").trim();
    const parsed = parseUrlSafe(rawUrl);

    if (ch === "rule_fallback") {
        return { kind: "rule_fallback", label: "本地离线规则", hostname: "local", origin: "" };
    }
    if (
        (ch === "siyuan" || ch === "siyuan_editor" || ch === "siyuan_legacy") &&
        (!rawUrl || (parsed && !parsed.origin && parsed.pathname.startsWith("/api/ai/")))
    ) {
        return { kind: "siyuan", label: "思源内置 AI", hostname: "siyuan-kernel", origin: "" };
    }
    if (!ch && parsed && !parsed.origin && parsed.pathname.startsWith("/api/ai/")) {
        return { kind: "siyuan", label: "思源内置 AI", hostname: "siyuan-kernel", origin: "" };
    }
    if (ch === "public_free") {
        const fallbackParsed = parsed || parseUrlSafe("https://text.pollinations.ai")!;
        return {
            kind: "public_free",
            label: "免密公用池",
            hostname: fallbackParsed.hostname || "text.pollinations.ai",
            origin: fallbackParsed.origin || "https://text.pollinations.ai",
        };
    }
    if (ch === "ollama") {
        const fallbackParsed = parsed || parseUrlSafe("http://127.0.0.1:11434")!;
        return {
            kind: "ollama",
            label: "本地 Ollama",
            hostname: fallbackParsed.hostname || "127.0.0.1",
            origin: fallbackParsed.origin || "http://127.0.0.1:11434",
        };
    }
    const host = parsed?.hostname || "";
    return {
        kind: "user_custom",
        label: host ? `用户自配 ${host}` : "用户自配外部接口",
        hostname: host,
        origin: parsed?.origin || "",
    };
}

export interface LvAiGateContext {
    source?: string;
    pluginId?: string;
    channel?: string;
    endpoint?: string;
    url?: string;
    usesSharedKey?: boolean;
    expectedOrigin?: string;
    storage?: LvGateStorageLike | null;
}

export function assertLvAiChannelAllowed(
    ctx: LvAiGateContext
): LvAiDestinationInfo & { pluginId: string } {
    const pluginId = normalizeLvPluginId(ctx?.pluginId || ctx?.source);
    const toggles = getLvEcosystemToggles(ctx?.storage);
    const dest = resolveLvAiDestinationLabel(ctx || {});

    if (toggles.aiSiyuanOnly === true) {
        const isSiyuanPath = dest.kind === "siyuan" || dest.kind === "rule_fallback";
        if (!isSiyuanPath) {
            throw new LvAiPolicyBlockedError("ai_siyuan_only", pluginId, dest.kind);
        }
    }

    if (ctx?.usesSharedKey === true && !isLvPluginSharedKeyAllowed(pluginId, ctx?.storage)) {
        throw new LvAiPolicyBlockedError("ai_shared_key_denied", pluginId, dest.kind);
    }

    const expectedOrigin = String(ctx?.expectedOrigin || "").trim();
    if (expectedOrigin && dest.kind !== "siyuan" && dest.kind !== "rule_fallback") {
        if (!dest.origin || dest.origin !== expectedOrigin) {
            throw new LvAiPolicyBlockedError(
                "ai_origin_mismatch",
                pluginId,
                dest.kind,
                `外部 AI 目标域名已偏离预检确认（期望 ${expectedOrigin}，实际 ${dest.origin || "未知"}）`
            );
        }
    }

    return {
        ...dest,
        pluginId,
    };
}

export const lvAiGate = {
    LV_ECOSYSTEM_TOGGLES_KEY,
    LV_BLOCK_ASSISTANT_MASTER_KEY,
    LV_ECOSYSTEM_PLUGIN_IDS,
    SOURCE_ALIAS_TO_PLUGIN_ID,
    LvAiPolicyBlockedError,
    normalizeLvPluginId,
    getLvEcosystemToggles,
    setLvEcosystemToggles,
    isLvPluginSharedKeyAllowed,
    resolveLvAiDestinationLabel,
    assertLvAiChannelAllowed,
};

try {
    const g = typeof globalThis !== "undefined" ? (globalThis as Record<string, unknown>) : null;
    if (g) g.__LV_AI_GATE__ = lvAiGate;
    if (typeof window !== "undefined") (window as unknown as Record<string, unknown>).__LV_AI_GATE__ = lvAiGate;
} catch { /* ignore */ }
