// 集中式 Disposer 树状幂等资源治理
// 提供支持作用域嵌套、LIFO 逆序销毁、异常隔离、Set 去重与重复 dispose 100% 幂等的资源回收中枢。

export interface IDisposable {
    dispose(): void;
}

export type DisposableItem = IDisposable | (() => void);

/**
 * 将清理函数或 IDisposable 归一化为 IDisposable 实例。
 */
export function toDisposable(item: DisposableItem): IDisposable {
    if (typeof item === "function") {
        return {
            dispose: item,
        };
    }
    return item;
}

/**
 * 包装定时器为 IDisposable。
 */
export function fromTimeout(timer: ReturnType<typeof setTimeout> | null | undefined): IDisposable {
    let handle = timer;
    return {
        dispose: () => {
            if (handle !== null && handle !== undefined) {
                clearTimeout(handle);
                handle = null;
            }
        },
    };
}

/**
 * 包装 DOM 事件监听器为 IDisposable。
 */
export function fromEventListener(
    target: EventTarget | null | undefined,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
): IDisposable {
    if (!target || typeof target.removeEventListener !== "function") {
        return {dispose: () => {}};
    }
    let active = true;
    return {
        dispose: () => {
            if (!active) return;
            active = false;
            try {
                target.removeEventListener(type, listener, options);
            } catch {
                // ignore
            }
        },
    };
}

/**
 * 包装思源 EventBus 监听为 IDisposable。
 */
export function fromEventBus(
    bus: {off: (event: string, handler: any) => void} | null | undefined,
    event: string,
    handler: any
): IDisposable {
    if (!bus || typeof bus.off !== "function") {
        return {dispose: () => {}};
    }
    let active = true;
    return {
        dispose: () => {
            if (!active) return;
            active = false;
            try {
                bus.off(event, handler);
            } catch {
                // 宿主事件总线可能已被拆除，静默隔离
            }
        },
    };
}

/**
 * 集中式资源销毁组合容器（DisposerTree）
 * - LIFO 逆序释放（后加入先销毁，保障依赖生命周期秩序）
 * - Set 契约去重（同一引用重复 add 仅保留一次）
 * - 异常安全沙箱（单个 cleanup 抛错不阻断其余项释放）
 * - 100% 幂等性（dispose 可安全多次重复调用）
 * - 级联子作用域支持（子 scope 可独立销毁或随父 scope 批量销毁）
 */
export class CompositeDisposable implements IDisposable {
    private readonly items = new Set<DisposableItem>();
    private readonly order: DisposableItem[] = [];
    private disposed = false;

    public isDisposed(): boolean {
        return this.disposed;
    }

    public get size(): number {
        return this.items.size;
    }

    /**
     * 注册待释放资源。
     * 若当前容器已被释放，新加入的项将立即就地执行销毁（防挂起泄漏）。
     */
    public add(item: DisposableItem): this {
        if (!item) return this;

        if (this.disposed) {
            this.executeDisposeItem(item);
            return this;
        }

        // Set 去重契约：同一资源只注册一次，避免重复释放逻辑穿透
        if (this.items.has(item)) {
            return this;
        }

        this.items.add(item);
        this.order.push(item);
        return this;
    }

    /**
     * 移除已注册的待释放资源（不触发销毁）。
     */
    public remove(item: DisposableItem): boolean {
        if (!this.items.has(item)) return false;
        this.items.delete(item);
        const idx = this.order.indexOf(item);
        if (idx !== -1) {
            this.order.splice(idx, 1);
        }
        return true;
    }

    /**
     * 创建级联子作用域。
     * 子作用域销毁时会自动从父作用域注销；父作用域销毁时会级联销毁所有未退出的子作用域。
     */
    public createChildScope(): CompositeDisposable {
        const child = new CompositeDisposable();
        if (this.disposed) {
            child.dispose();
            return child;
        }

        this.add(child);
        const originalChildDispose = child.dispose.bind(child);
        child.dispose = () => {
            this.remove(child);
            originalChildDispose();
        };

        return child;
    }

    /**
     * 批量销毁：LIFO 逆序 + 异常隔离 + 幂等。
     */
    public dispose(): void {
        if (this.disposed) return;
        this.disposed = true;

        // LIFO 逆序出栈
        while (this.order.length > 0) {
            const item = this.order.pop()!;
            this.items.delete(item);
            this.executeDisposeItem(item);
        }
        this.items.clear();
    }

    private executeDisposeItem(item: DisposableItem): void {
        try {
            if (typeof item === "function") {
                item();
            } else if (typeof item.dispose === "function") {
                item.dispose();
            }
        } catch (err) {
            // 异常隔离：单个释放失败打印告警，绝不阻断后续项清理
            if (typeof console !== "undefined" && typeof console.warn === "function") {
                console.warn("[Disposer] Resource cleanup error:", err);
            }
        }
    }
}

export {CompositeDisposable as DisposerTree};
