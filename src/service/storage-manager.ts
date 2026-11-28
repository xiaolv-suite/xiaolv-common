// 侧车统一存储调度与版本自愈管理器
// 封装 loadData/saveData 节流防抖、锁竞争重试与未来版本不可逆防护。
import {
    LibraryConfig,
    normalizeLibraryConfig,
    PluginState,
    normalizeState,
    migrateState,
} from "../model/storage";
import {STORAGE_KEYS, SIDECAR_LOAD_TIMEOUT_MS} from "../constants";
import {readWithTimeout} from "../model/startup";

export interface IStorageBackend {
    loadData(key: string): Promise<unknown>;
    saveData(key: string, data: unknown): Promise<unknown>;
    dataCache?: Record<string, unknown>;
}

export interface StorageManagerOptions {
    backend: IStorageBackend;
    onNotify?: (kind: "info" | "error", message: string) => void;
    saveTimeoutMs?: number;
    loadTimeoutMs?: number;
    maxRetries?: number;
    retryDelayMs?: number;
    writable?: boolean;
}

export interface StateLoadResult {
    ok: boolean;
    state: PluginState;
    writable: boolean;
    futureVersion?: boolean;
    observedVersion?: number;
}

export interface ConfigLoadResult {
    ok: boolean;
    config: LibraryConfig | null;
}

export class StorageManager {
    private readonly backend: IStorageBackend;
    private readonly onNotify?: (kind: "info" | "error", message: string) => void;
    private readonly saveTimeoutMs: number;
    private readonly loadTimeoutMs: number;
    private readonly maxRetries: number;
    private readonly retryDelayMs: number;

    private stateWritable: boolean;
    private persistStateTimer: ReturnType<typeof setTimeout> | null = null;
    private pendingState: unknown = null;
    private readonly inFlightSaves = new Set<Promise<boolean>>();
    private readonly saveQueues = new Map<string, Promise<boolean>>();

    constructor(options: StorageManagerOptions) {
        this.backend = options.backend;
        this.onNotify = options.onNotify;
        this.saveTimeoutMs = options.saveTimeoutMs ?? 5000;
        this.loadTimeoutMs = options.loadTimeoutMs ?? SIDECAR_LOAD_TIMEOUT_MS;
        this.maxRetries = options.maxRetries ?? 2;
        this.retryDelayMs = options.retryDelayMs ?? 80;
        // 初始状态未读取前必须为只读（防挂起读取中卸载覆盖未加载的侧车）
        this.stateWritable = options.writable ?? false;
    }

    public isStateWritable(): boolean {
        return this.stateWritable;
    }

    public setStateWritable(writable: boolean): void {
        this.stateWritable = writable;
    }

    /**
     * 清除会话内存缓存（对齐 SiYuan Issue #19908）：
     * loadData 读取失败时会回退到宿主 this.data[key]，若其他窗口已删除该文件可能返回陈旧数据。
     */
    public clearCache(key?: string): void {
        try {
            if (this.backend.dataCache && typeof this.backend.dataCache === "object") {
                if (key) {
                    delete this.backend.dataCache[key];
                } else {
                    delete this.backend.dataCache[STORAGE_KEYS.config];
                    delete this.backend.dataCache[STORAGE_KEYS.state];
                }
            }
        } catch {
            // ignore
        }
    }

    /**
     * 读取配置：带超时保护与未来版本防御。
     */
    public async loadConfig(): Promise<ConfigLoadResult> {
        this.clearCache(STORAGE_KEYS.config);
        const res = await readWithTimeout(
            () => this.backend.loadData(STORAGE_KEYS.config),
            this.loadTimeoutMs
        );
        if (!res.ok) {
            return {ok: false, config: null};
        }
        const config = normalizeLibraryConfig(res.value);
        return {ok: true, config};
    }

    /**
     * 读取状态：带超时保护、版本迁移与未来版本防护。
     * 若检测到未知未来版本（observedVersion > STATE_SCHEMA_VERSION），
     * 自动设置 stateWritable = false 并返回默认空状态，绝不降级覆盖未来数据。
     */
    public async loadState(): Promise<StateLoadResult> {
        this.clearCache(STORAGE_KEYS.state);
        const res = await readWithTimeout(
            () => this.backend.loadData(STORAGE_KEYS.state),
            this.loadTimeoutMs
        );
        if (!res.ok) {
            this.stateWritable = false;
            return {
                ok: false,
                state: normalizeState(null),
                writable: false,
            };
        }

        const migrated = migrateState(res.value);
        if ("rejected" in migrated) {
            this.stateWritable = false;
            return {
                ok: false,
                state: normalizeState(null),
                writable: false,
                futureVersion: true,
                observedVersion: migrated.observedVersion,
            };
        }

        // 注意：不在此处直接将 stateWritable 设为 true。
        // 必须等调用方（onload）将读取结果完整应用至内存状态对象后，显式调用 setStateWritable(true) 解锁，
        // 杜绝其他配置读取挂起期间触发卸载时用空默认值覆盖已有侧车数据。
        return {
            ok: true,
            state: migrated.state,
            writable: true,
        };
    }

    /**
     * 节流防抖保存状态：将频繁的偏好更新合并为单次写入，默认 400ms 去抖。
     */
    public persistStateSoon(state: unknown, delayMs = 400): void {
        this.pendingState = state;
        if (this.persistStateTimer) clearTimeout(this.persistStateTimer);
        this.persistStateTimer = setTimeout(() => {
            this.persistStateTimer = null;
            if (this.pendingState) {
                const target = this.pendingState;
                this.pendingState = null;
                void this.saveStateNow(target);
            }
        }, delayMs);
    }

    /**
     * 立即保存状态：支持带超时与锁竞争重试。
     */
    public async saveStateNow(state: unknown, notifyFailure = true): Promise<boolean> {
        if (!this.stateWritable) {
            if (notifyFailure) {
                this.onNotify?.("error", "侧车数据处于未来版本只读保护状态，禁止覆盖改写");
            }
            return false;
        }
        if (this.persistStateTimer) {
            clearTimeout(this.persistStateTimer);
            this.persistStateTimer = null;
        }
        this.pendingState = null;

        return this.saveWithRetry(STORAGE_KEYS.state, state, notifyFailure);
    }

    /**
     * 保存库配置：立即写入并验证结果。
     */
    public async saveConfig(config: unknown, notifyFailure = true): Promise<boolean> {
        return this.saveWithRetry(STORAGE_KEYS.config, config, notifyFailure);
    }

    /**
     * 底层保存实现：按存储键串行排队（防旧快照并发回写覆盖新排序/状态）+ 超时保护 + 锁冲突重试。
     */
    private saveWithRetry(key: string, value: unknown, notifyFailure: boolean): Promise<boolean> {
        const existing = this.saveQueues.get(key);
        const runSave = async (): Promise<boolean> => {
            let attempt = 0;
            while (attempt <= this.maxRetries) {
                attempt++;
                try {
                    await this.executeSaveWithTimeout(key, value);
                    return true;
                } catch (err: any) {
                    const isLockConflict = this.isTransientLockError(err);
                    if (isLockConflict && attempt <= this.maxRetries) {
                        await new Promise((r) => setTimeout(r, this.retryDelayMs * attempt));
                        continue;
                    }

                    if (notifyFailure) {
                        const msg = err instanceof Error ? err.message : String(err || "save failed");
                        this.onNotify?.("error", `侧车持久化失败: ${msg}`);
                    }
                    return false;
                }
            }
            return false;
        };
        const task = existing ? existing.catch(() => false).then(runSave) : runSave();
        const tracked = task.finally(() => {
            if (this.saveQueues.get(key) === tracked) {
                this.saveQueues.delete(key);
            }
            this.inFlightSaves.delete(tracked);
        });
        this.saveQueues.set(key, tracked);
        this.inFlightSaves.add(tracked);
        return tracked;
    }

    private executeSaveWithTimeout(key: string, value: unknown): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let settled = false;
            const timer = setTimeout(() => {
                if (settled) return;
                settled = true;
                reject(new Error("sidecar save timed out"));
            }, this.saveTimeoutMs);

            Promise.resolve(this.backend.saveData(key, value))
                .then((res: unknown) => {
                    if (settled) return;
                    settled = true;
                    clearTimeout(timer);
                    const response = res as {code?: number; msg?: string} | undefined;
                    if (response && typeof response.code === "number" && response.code !== 0) {
                        reject(new Error(response.msg || `saveData failed with code ${response.code}`));
                    } else {
                        resolve();
                    }
                })
                .catch((err) => {
                    if (settled) return;
                    settled = true;
                    clearTimeout(timer);
                    reject(err);
                });
        });
    }

    private isTransientLockError(err: unknown): boolean {
        if (!err) return false;
        const msg = String((err as any)?.message || err).toLowerCase();
        return (
            msg.includes("lock") ||
            msg.includes("busy") ||
            msg.includes("conflict") ||
            msg.includes("sync") ||
            msg.includes("eexist") ||
            msg.includes("ebusy")
        );
    }

    /**
     * 刷新并提交任何在途防抖的未保存状态，并等待在途写入完成。
     */
    public async flush(): Promise<void> {
        if (this.persistStateTimer) {
            clearTimeout(this.persistStateTimer);
            this.persistStateTimer = null;
        }
        if (this.pendingState) {
            const target = this.pendingState;
            this.pendingState = null;
            await this.saveStateNow(target, false);
        }
        while (this.inFlightSaves.size > 0) {
            await Promise.allSettled(Array.from(this.inFlightSaves));
        }
    }

    /**
     * 释放清理：清理定时器防悬挂内存泄漏。
     */
    public dispose(): void {
        if (this.persistStateTimer) {
            clearTimeout(this.persistStateTimer);
            this.persistStateTimer = null;
        }
        this.pendingState = null;
    }
}
