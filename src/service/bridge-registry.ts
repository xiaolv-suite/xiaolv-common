// 跨仓窗口桥、生态小组件与智能体工具注册中枢
// 统筹 window.xiaolvCommon 窗口桥、雷切工作台小组件、思源智能体能力与 Protocol v1 协议命令字典。
import {XiaolvCommonService} from "./service";
import {mountXlcBridge} from "./external-bridge";
import {registerRaikiriModuleSafely} from "../ecosystem-bridge-kit";
import {outputNextPasteQueueItem} from "./paste-queue";
import {HostBridge} from "./commands";
import {LibraryService} from "./library";
import {DiscoveryService} from "./discovery";
import {toErrorMessage} from "../model/errors";
import {IDisposable} from "../model/disposer";

export interface BridgeRegistryOptions {
    service: XiaolvCommonService;
    host: HostBridge;
    version: string;
    pluginVersion?: string;
    library?: LibraryService;
    discovery?: DiscoveryService;
    addAgentCapability?: (capability: any) => void;
    openSearch: (target?: any, query?: string) => void;
    saveSelection: () => Promise<void>;
    discoverCurrentDocument: () => Promise<unknown>;
    discoverCurrentNotebook: () => Promise<unknown>;
    notifyExternalDataChange: () => void;
    invalidatePreviewCache?: (itemIds?: readonly string[]) => void;
}

export type ProtocolCommandHandler = (payload?: unknown) => Promise<unknown>;

export class BridgeRegistry implements IDisposable {
    private readonly options: BridgeRegistryOptions;
    private bridgeDisposer: (() => void) | null = null;
    private raikiriDisposer: (() => void) | null = null;
    private commands: Record<string, ProtocolCommandHandler> = {};
    private disposed = false;

    constructor(options: BridgeRegistryOptions) {
        this.options = options;
    }

    /**
     * 挂载全套跨仓协议桥与生态组件。
     */
    public mount(): this {
        if (this.disposed) return this;

        // 1. 对外窗口桥 window.xiaolvCommon v1（只读子集，防误删）
        try {
            this.bridgeDisposer = mountXlcBridge(this.options.service);
        } catch {
            // 忽略非浏览器或宿主 window 不可用环境
        }

        // 2. 向小驴雷切注册“高频常用语”工作台小组件（Epoch 6 标准）
        try {
            this.raikiriDisposer = registerRaikiriModuleSafely({
                moduleId: "common-quick-palette",
                title: "常用资产",
                description: "展示高频与最近使用的常用语资产",
                icon: "iconXlcCommon",
                category: "资产",
                source: {
                    pluginId: "xiaolv-common",
                    name: "小驴常用",
                    version: this.options.version || this.options.pluginVersion || "",
                },
                read: async () => {
                    const res = await this.options.service.getRecent(5);
                    const items = (res.ok && res.data)
                        ? res.data.map((it) => ({
                            label: it.title ?? it.id,
                            value: it.itemType,
                            command: `xiaolv.common.insert:${it.id}`,
                        }))
                        : [];
                    return {
                        title: "常用资产",
                        items,
                    };
                },
                open: () => {
                    this.options.openSearch();
                },
            });
        } catch {
            // 忽略雷切未安装或未注册
        }

        // 3. 思源智能体能力（3.8.x）：按关键词搜常用条目
        if (typeof this.options.addAgentCapability === "function") {
            try {
                this.options.addAgentCapability({
                    name: "xiaolv_common_search",
                    title: "搜索小驴常用条目",
                    description: "按关键词搜索用户的常用内容条目（标题/类型/标签）。只读；不含条目正文。",
                    inputSchema: {
                        type: "object",
                        properties: {query: {type: "string", description: "搜索关键词"}},
                        required: ["query"],
                    },
                    effects: {localRead: true},
                    handler: async (args: any) => {
                        try {
                            return await this.options.service.searchForAgent(args?.query);
                        } catch (err) {
                            return {error: toErrorMessage(err)};
                        }
                    },
                });
            } catch {
                // 宿主无 addAgentCapability 容错
            }
        }

        // 4. 组装 ProtocolCommands 命令字典
        this.commands = this.assembleProtocolCommands();

        return this;
    }

    /**
     * 获取对外暴露的稳定协议命令字典（供雷切等通过 app.plugins 获取后调用）
     */
    public getCommands(): Record<string, ProtocolCommandHandler> {
        return this.commands;
    }

    private assembleProtocolCommands(): Record<string, ProtocolCommandHandler> {
        const service = this.options.service;
        const cmds: Record<string, ProtocolCommandHandler> = {};

        cmds["xiaolv.common.open"] = async () => {
            this.options.openSearch();
            return {ok: true};
        };

        cmds["xiaolv.common.saveSelection"] = async () => {
            await this.options.saveSelection();
            return {ok: true};
        };

        cmds["xiaolv.common.insert"] = async (payload) => {
            const raw = payload as {itemId?: string; id?: string; mode?: string} | undefined;
            const itemId = raw?.itemId ?? raw?.id ?? "";
            return service.insert(itemId, {mode: raw?.mode ?? "insert"});
        };

        cmds["xiaolv.common.copy"] = async (payload) => {
            const raw = payload as {itemId?: string; id?: string} | undefined;
            const itemId = raw?.itemId ?? raw?.id ?? "";
            return service.copy(itemId);
        };

        cmds["xiaolv.common.openSource"] = async (payload) => {
            const raw = payload as {itemId?: string; id?: string} | undefined;
            const itemId = raw?.itemId ?? raw?.id ?? "";
            return service.openSource(itemId);
        };

        cmds["xiaolv.common.search"] = async (payload) => {
            const raw = payload as {keyword?: string; text?: string; limit?: number} | undefined;
            const query = typeof raw?.keyword === "string" ? raw.keyword : (typeof raw?.text === "string" ? raw.text : "");
            return service.search({text: query});
        };

        cmds["xiaolv.common.get"] = async (payload) => {
            const itemId = (payload as {itemId?: string; id?: string})?.itemId ?? (payload as {itemId?: string; id?: string})?.id ?? "";
            return service.get(itemId);
        };

        cmds["xiaolv.common.resolve"] = async (payload) => {
            const raw = payload as {itemId?: string; id?: string; fills?: Record<string, string>} | undefined;
            const itemId = raw?.itemId ?? raw?.id ?? "";
            return service.resolve(itemId, raw?.fills);
        };

        cmds["xiaolv.common.recall"] = async (payload) => {
            const raw = payload as {alias?: string; keyword?: string; fills?: Record<string, string>} | undefined;
            const key = raw?.alias ?? raw?.keyword ?? "";
            return service.recall(key, raw?.fills);
        };

        cmds["xiaolv.common.recent"] = async (payload) => {
            const limit = (payload as {limit?: number})?.limit;
            return service.getRecent(limit);
        };

        cmds["xiaolv.common.favorites"] = async () => {
            return service.getFavorites();
        };

        cmds["xiaolv.common.getClipboardHistory"] = async () => {
            return service.getClipboardHistory();
        };

        cmds["xiaolv.common.captureQuote"] = async (payload) => {
            return service.captureQuote(payload as any);
        };

        cmds["xiaolv.common.pasteQueueNext"] = async () => {
            return outputNextPasteQueueItem(this.options.host);
        };

        cmds["xiaolv.common.discoverCurrentDocument"] = async () => this.options.discoverCurrentDocument();
        cmds["xiaolv.common.discoverCurrentNotebook"] = async () => this.options.discoverCurrentNotebook();
        cmds["xiaolv.common.previewDiscoveryCandidate"] = async (payload) => {
            const value = payload as {sessionId?: string; candidateKey?: string} | undefined;
            return this.options.discovery?.previewCandidate(value?.sessionId ?? "", value?.candidateKey ?? "");
        };
        cmds["xiaolv.common.addDiscoveryCandidate"] = async (payload) => {
            const value = payload as {sessionId?: string; candidateKey?: string; allowSameContent?: boolean; batchId?: string; category?: string} | undefined;
            return this.options.discovery?.addCandidate(value?.sessionId ?? "", value?.candidateKey ?? "", {
                allowSameContent: value?.allowSameContent === true,
                batchId: value?.batchId,
                category: typeof value?.category === "string" ? value.category : undefined,
            });
        };
        cmds["xiaolv.common.closeDiscoverySession"] = async (payload) => {
            const sessionId = (payload as {sessionId?: string} | undefined)?.sessionId;
            return this.options.discovery?.closeSession(sessionId);
        };
        cmds["xiaolv.common.beginDiscoveryBatch"] = async (payload) => {
            const sessionId = (payload as {sessionId?: string} | undefined)?.sessionId ?? "";
            return this.options.discovery?.beginAddBatch(sessionId);
        };
        cmds["xiaolv.common.finishDiscoveryBatch"] = async (payload) => {
            const value = payload as {sessionId?: string; batchId?: string} | undefined;
            return this.options.discovery?.finishAddBatch(value?.sessionId ?? "", value?.batchId ?? "");
        };
        cmds["xiaolv.common.undoDiscoveryBatch"] = async (payload) => {
            const value = payload as {sessionId?: string; batchId?: string} | undefined;
            return this.options.discovery?.undoBatch(value?.sessionId ?? "", value?.batchId ?? "");
        };
        cmds["xiaolv.common.adoptLibraryBlocks"] = async (payload) => {
            const blockIds = (payload as {blockIds?: string[]} | undefined)?.blockIds;
            const res = await this.options.library?.adoptUnmanagedLibraryBlocks(blockIds);
            if (res && res.ok && res.data.adopted > 0) {
                this.options.notifyExternalDataChange();
            }
            return res;
        };

        cmds["xiaolv.common.pullFromSource"] = async (payload) => {
            const itemId = (payload as {itemId?: string} | undefined)?.itemId ?? "";
            const res = await this.options.library?.pullFromSourceBlock(itemId);
            if (res && res.ok) {
                this.options.invalidatePreviewCache?.([itemId]);
                this.options.notifyExternalDataChange();
            }
            return res;
        };

        cmds["xiaolv.common.pushToSource"] = async (payload) => {
            const itemId = (payload as {itemId?: string} | undefined)?.itemId ?? "";
            return this.options.library?.pushToSourceBlock(itemId);
        };

        return cmds;
    }

    /**
     * 卸载注销：幂等注销窗口桥与雷切组件。
     */
    public dispose(): void {
        if (this.disposed) return;
        this.disposed = true;

        try {
            this.bridgeDisposer?.();
        } catch {
            // ignore
        }
        this.bridgeDisposer = null;

        try {
            this.raikiriDisposer?.();
        } catch {
            // ignore
        }
        this.raikiriDisposer = null;
        this.commands = {};
    }
}
