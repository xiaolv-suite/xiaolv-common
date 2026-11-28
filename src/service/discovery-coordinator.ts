// 发现与收录流程协调器（DiscoveryCoordinator）
// 统筹资产发现会话、当前文档/笔记本候选扫描、批量收录与 4 秒超时关机补偿。
import {DiscoveryService} from "./discovery";
import {LibraryService} from "./library";
import {IDisposable} from "../model/disposer";

export interface DiscoveryCoordinatorDeps {
    discovery: DiscoveryService;
    library?: LibraryService;
    notify?: (kind: "info" | "error", message: string) => void;
}

export class DiscoveryCoordinator implements IDisposable {
    public readonly discovery: DiscoveryService;
    public readonly library?: LibraryService;
    public readonly notify?: (kind: "info" | "error", message: string) => void;
    private disposed = false;
    private shutdownPromise: Promise<void> | null = null;

    constructor(deps: DiscoveryCoordinatorDeps) {
        this.discovery = deps.discovery;
        this.library = deps.library;
        this.notify = deps.notify;
    }

    public getService(): DiscoveryService {
        return this.discovery;
    }

    /**
     * 优雅关机并附带 4 秒超时补偿保护。
     * 内置 Promise 缓存，杜绝 onunload 期间多次调用导致重复触发底层 shutdown。
     */
    public shutdownWithCompensation(budgetMs = 4000): Promise<void> {
        if (this.shutdownPromise) {
            return this.shutdownPromise;
        }

        const unloadStartedAt = Date.now();
        const baseShutdown = this.discovery.shutdown(budgetMs);
        if (!baseShutdown) {
            this.shutdownPromise = Promise.resolve();
            return this.shutdownPromise;
        }

        let timer: ReturnType<typeof setTimeout> | undefined;
        const remainingMs = Math.max(0, budgetMs - (Date.now() - unloadStartedAt));
        const timedOut = Symbol("discovery-shutdown-timeout");

        this.shutdownPromise = Promise.race([
            baseShutdown,
            new Promise<typeof timedOut>((resolve) => {
                timer = setTimeout(() => resolve(timedOut), remainingMs);
            }),
        ]).then((result) => {
            if (timer !== undefined) clearTimeout(timer);

            if (result === timedOut) {
                if (typeof console !== "undefined" && typeof console.warn === "function") {
                    console.warn("[LvCommon] 卸载等待发现收录清理超过 4 秒，当前条目清理结果尚未确认；思源可能继续拆除插件资源");
                }
                void baseShutdown.then((lateResult) => {
                    if (lateResult?.compensatedItemIds?.length) {
                        if (typeof console !== "undefined" && typeof console.info === "function") {
                            console.info("[LvCommon] 卸载等待超时后，发现收录条件清理已完成", lateResult.compensatedItemIds);
                        }
                    }
                    for (const item of lateResult?.unresolved || []) {
                        if (typeof console !== "undefined" && typeof console.warn === "function") {
                            console.warn("[LvCommon] 卸载等待超时后仍无法确认发现收录状态", item);
                        }
                    }
                }).catch((error) => {
                    if (typeof console !== "undefined" && typeof console.warn === "function") {
                        console.warn("[LvCommon] 卸载等待超时后发现收录清理仍未完成", error);
                    }
                });
            } else if (result && typeof result === "object" && "unresolved" in result) {
                for (const item of (result as any).unresolved || []) {
                    if (typeof console !== "undefined" && typeof console.warn === "function") {
                        console.warn("[LvCommon] 发现收录在插件卸载期间未能安全确认", item);
                    }
                }
            }
        }).catch(() => {
            if (timer !== undefined) clearTimeout(timer);
        });

        return this.shutdownPromise;
    }

    public dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        void this.shutdownWithCompensation(4000);
    }
}
