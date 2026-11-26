// 空闲预热调度器（IdleWarmup · S10）
import type {XiaolvCommonPluginContext} from "./plugin-context";

export class IdleWarmupManager {
    private timer: any = null;

    constructor(private readonly plugin: XiaolvCommonPluginContext) {}

    schedule(timeoutMs: number = 3500): void {
        if (this.plugin.unloading || this.timer !== null) return;
        const runWarmup = () => {
            this.timer = null;
            if (this.plugin.unloading || !this.plugin.library) return;
            void this.plugin.library.ensureIndex(60_000).then(() => {
                if (this.plugin.unloading) return;
                void this.plugin.updateProtyleSlash(false);
            }).catch(() => undefined);
        };
        if (typeof window !== "undefined" && typeof (window as any).requestIdleCallback === "function") {
            this.timer = (window as any).requestIdleCallback(runWarmup, {timeout: timeoutMs});
        } else {
            this.timer = setTimeout(runWarmup, Math.min(timeoutMs, 2000));
        }
    }

    clear(): void {
        if (this.timer === null) return;
        if (typeof window !== "undefined" && typeof (window as any).cancelIdleCallback === "function") {
            (window as any).cancelIdleCallback(this.timer);
        } else {
            clearTimeout(this.timer);
        }
        this.timer = null;
    }
}
