// 对外窗口桥 window.xiaolvCommon v1（T-0031 · ADR-0013）——只读子集。
// 方法把 XiaolvCommonService 的 ActionResult 信封原样透传（不二次包装，桥层零新语义）；
// 写面（save/update/remove/insert/copy）不进 v1——桥写开关 + 外部来源标记留 v2 立项。
// 挂载纪律对齐管家 LvHome 先例：首个实例持有窗口期，disposer 校验身份防误删新桥。
import type {XiaolvCommonService, ResolvedItemData, RecallResult} from "./service";
import type {CapabilityDescriptor, CaptureQuoteInput} from "../model/protocol";
import type {CommonItem, CommonItemRef} from "../model/item";
import type {ActionResult} from "../model/protocol";
import type {SearchQuery} from "../model/search";

export const XLC_BRIDGE_PROTOCOL = 1;

/** 桥只读面允许的搜索过滤键（SearchQuery 的宽松输入形状；未知键忽略） */
export interface BridgeSearchInput {
    text?: unknown;
    itemType?: unknown;
    tag?: unknown;
    category?: unknown;
    scope?: unknown;
}

export interface XlcBridgeApi {
    readonly protocol: number;
    readonly protocolName: "xiaolv-common";
    readonly capabilities: readonly string[];
    /** 桥挂载即代表服务可调用（settings/library 已装配）；对齐打卡/管家/雷切 whenReady 惯例 */
    whenReady(): Promise<boolean>;
    hasCapability(name: string): boolean;
    /** 完整能力描述符（含诚实限制标注）——消费方据此协商，桥 capabilities 只是快捷面 */
    getCapabilities(): CapabilityDescriptor[];
    search(query?: BridgeSearchInput | string): Promise<ActionResult<CommonItemRef[]>>;
    get(itemId: string): Promise<ActionResult<CommonItem>>;
    getBatch(itemIds: string[]): Promise<ActionResult<CommonItem[]>>;
    resolve(itemId: string, fills?: Record<string, string>): Promise<ActionResult<ResolvedItemData>>;
    recall(aliasOrKeyword: string, fills?: Record<string, string>): Promise<ActionResult<RecallResult>>;
    getRecent(limit?: number): Promise<ActionResult<CommonItemRef[]>>;
    recent?(limit?: number): Promise<ActionResult<CommonItemRef[]>>;
    getFavorites(): Promise<ActionResult<CommonItemRef[]>>;
    favorites?(): Promise<ActionResult<CommonItemRef[]>>;
    getCategories(): Promise<ActionResult<string[]>>;
    getTags(): Promise<ActionResult<string[]>>;
    getClipboardHistory(): Promise<ActionResult<Array<{text: string; copiedAt: number}>>>;
    captureQuote(input: CaptureQuoteInput): Promise<ActionResult<CommonItemRef>>;
}

/** 搜索入参收敛：支持纯字符串查询或对象参数 */
function normalizeSearchInput(raw?: BridgeSearchInput | string): SearchQuery {
    const q: SearchQuery = {text: ""};
    if (typeof raw === "string") {
        q.text = raw;
        return q;
    }
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return q;
    if (typeof raw.text === "string") q.text = raw.text;
    if (typeof raw.itemType === "string") q.itemType = raw.itemType as SearchQuery["itemType"];
    if (typeof raw.tag === "string") q.tag = raw.tag;
    if (typeof raw.category === "string") q.category = raw.category;
    if (raw.scope === "favorites" || raw.scope === "recent" || raw.scope === "all") q.scope = raw.scope;
    return q;
}

export function buildXlcBridge(service: XiaolvCommonService): XlcBridgeApi {
    return {
        protocol: XLC_BRIDGE_PROTOCOL,
        protocolName: "xiaolv-common",
        // v1 只读面（ADR-0013）：写方法不挂桥对象——门禁测试锁定此边界
        capabilities: ["search", "get", "getBatch", "resolve", "recall", "captureQuote", "recent", "favorites", "categories", "tags", "clipboard"],

        whenReady() {
            return Promise.resolve(true);
        },

        hasCapability(name: string) {
            return this.capabilities.includes(name);
        },

        getCapabilities() {
            return service.getCapabilities();
        },

        search(query) {
            return service.search(normalizeSearchInput(query));
        },

        async get(itemId) {
            const res = await service.get(String(itemId ?? ""));
            if (res.ok && res.data) {
                const item = res.data;
                const snippet = {
                    ...item,
                    content: item.summary || item.url || item.title || "",
                };
                return {...res, data: snippet as CommonItem};
            }
            return res;
        },

        getBatch(itemIds) {
            return service.getBatch(itemIds);
        },

        resolve(itemId, fills) {
            return service.resolve(String(itemId ?? ""), fills);
        },

        recall(aliasOrKeyword, fills) {
            return service.recall(String(aliasOrKeyword ?? ""), fills);
        },

        getRecent(limit) {
            return service.getRecent(typeof limit === "number" ? limit : undefined);
        },

        recent(limit) {
            return service.getRecent(typeof limit === "number" ? limit : undefined);
        },

        getFavorites() {
            return service.getFavorites();
        },

        favorites() {
            return service.getFavorites();
        },

        getCategories() {
            return service.getCategories();
        },

        getTags() {
            return service.getTags();
        },

        getClipboardHistory() {
            return service.getClipboardHistory();
        },

        captureQuote(input) {
            return service.captureQuote(input);
        },
    };
}

import {BRIDGE_ALIASES} from "../ecosystem-bridge-kit";

export const COMMON_BRIDGE_ALIASES = BRIDGE_ALIASES.common;

/** 挂载桥到 window（服务装配完成后调用，支持四别名挂载与安全核验注销）；返回卸载函数 */
export function mountXlcBridge(
    service: XiaolvCommonService,
    host: Record<string, unknown> = (typeof window !== "undefined" ? window : {}) as unknown as Record<string, unknown>
): () => void {
    const bridge = buildXlcBridge(service);
    const mountedAliases: string[] = [];

    for (const alias of COMMON_BRIDGE_ALIASES) {
        if (!host[alias]) {
            host[alias] = bridge;
            mountedAliases.push(alias);
        }
    }

    let disposed = false;
    return () => {
        if (disposed) return;
        disposed = true;
        for (const alias of mountedAliases) {
            if (host[alias] === bridge) {
                delete host[alias];
            }
        }
    };
}
