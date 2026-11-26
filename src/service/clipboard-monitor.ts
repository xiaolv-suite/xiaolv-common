// 剪贴板监听器与历史记录管理服务
// 封装 5s 静默启动、copy/cut/focus 节流去抖、环形历史记录与按需同步。
import {ClipboardHistoryEntry, pushClipboardHistory} from "../model/storage";
import {IDisposable} from "../model/disposer";

export interface ClipboardMonitorOptions {
    isEnabled: () => boolean;
    getHistory: () => ClipboardHistoryEntry[];
    setHistory: (history: ClipboardHistoryEntry[]) => void;
    getLimit: () => number;
    persistSoon: () => void;
}

export class ClipboardMonitor implements IDisposable {
    private readonly isEnabled: () => boolean;
    private readonly getHistory: () => ClipboardHistoryEntry[];
    private readonly setHistory: (history: ClipboardHistoryEntry[]) => void;
    private readonly getLimit: () => number;
    private readonly persistSoon: () => void;

    private trackingTimer: ReturnType<typeof setTimeout> | null = null;
    private listenerCleanup: (() => void) | null = null;
    private disposed = false;
    private lastFocusReadAt = 0;
    private lastReadText = "";

    constructor(options: ClipboardMonitorOptions) {
        this.isEnabled = options.isEnabled;
        this.getHistory = options.getHistory;
        this.setHistory = options.setHistory;
        this.getLimit = options.getLimit;
        this.persistSoon = options.persistSoon;
    }

    /**
     * 写入剪贴板历史记录队列（有界环形栈）。
     */
    public recordClipboard(text: string): boolean {
        if (this.disposed || !this.isEnabled() || !text || typeof text !== "string") {
            return false;
        }
        const clean = text.trim();
        if (clean.length < 2) return false;
        const bounded = clean.length > 8000 ? clean.slice(0, 8000) : clean;
        const limit = this.getLimit() || 30;
        const current = this.getHistory();
        const updated = pushClipboardHistory(current, bounded, limit);
        this.setHistory(updated);
        this.persistSoon();
        return true;
    }

    /**
     * 启动剪贴板监听：支持默认 5 秒静默期（避免在插件启动时争抢 CPU/剪贴板）。
     */
    public start(delayMs = 5000): void {
        if (this.disposed) return;
        this.stop();

        if (delayMs <= 0) {
            this.setupListeners();
            return;
        }

        this.trackingTimer = setTimeout(() => {
            this.trackingTimer = null;
            if (this.disposed) return;
            this.setupListeners();
        }, delayMs);
    }

    /**
     * 挂载 copy/cut/focus 监听器。
     */
    private setupListeners(): void {
        if (typeof window === "undefined" || this.disposed) return;

        const onCopyCut = (e: ClipboardEvent) => {
            if (this.disposed || !this.isEnabled()) return;
            try {
                const text = e.clipboardData?.getData("text/plain") || window.getSelection()?.toString();
                if (text) {
                    this.lastReadText = text;
                    this.recordClipboard(text);
                }
            } catch {
                // ignore
            }
        };

        const onWindowFocus = async () => {
            if (this.disposed || !this.isEnabled()) return;
            const now = Date.now();
            if (now - this.lastFocusReadAt < 1500) return;
            this.lastFocusReadAt = now;
            try {
                if (navigator.clipboard?.readText && window.isSecureContext) {
                    const txt = await navigator.clipboard.readText();
                    if (this.disposed) return;
                    if (txt && txt !== this.lastReadText) {
                        this.lastReadText = txt;
                        this.recordClipboard(txt);
                    }
                }
            } catch {
                // ignore
            }
        };

        window.addEventListener("copy", onCopyCut as any);
        window.addEventListener("cut", onCopyCut as any);
        window.addEventListener("focus", onWindowFocus);

        this.listenerCleanup = () => {
            window.removeEventListener("copy", onCopyCut as any);
            window.removeEventListener("cut", onCopyCut as any);
            window.removeEventListener("focus", onWindowFocus);
        };
    }

    /**
     * 按需读取并同步系统剪贴板最新文本。
     */
    public async syncSystemClipboard(): Promise<string | null> {
        if (this.disposed) return null;
        try {
            if (typeof window !== "undefined" && navigator.clipboard?.readText && window.isSecureContext) {
                const txt = await navigator.clipboard.readText();
                if (txt) {
                    this.recordClipboard(txt);
                    return txt;
                }
            }
        } catch {
            // ignore
        }
        return null;
    }

    /**
     * 停止监听并清理事件绑定与计时器。
     */
    public stop(): void {
        if (this.trackingTimer) {
            clearTimeout(this.trackingTimer);
            this.trackingTimer = null;
        }
        if (this.listenerCleanup) {
            this.listenerCleanup();
            this.listenerCleanup = null;
        }
    }

    /**
     * 释放服务：满足 IDisposable 契约与幂等性。
     */
    public dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        this.stop();
    }
}
