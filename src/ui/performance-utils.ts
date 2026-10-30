// 性能优化与资源减负工具集（G15，R272）：
// 提供统一的防抖/节流工具函数，优化高频触发事件；
// 确保所有 DOM/思源事件监听器都有对应的清理逻辑。

/** 防抖工具：返回去抖后的函数 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    fn: T,
    delay: number,
): (...args: Parameters<T>) => void {
    let timer: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<T>) => {
        if (timer !== null) clearTimeout(timer);
        timer = setTimeout(() => {
            timer = null;
            fn(...args);
        }, delay);
    };
}

/** 节流工具：基于时间戳的节流 */
export function throttle<T extends (...args: unknown[]) => unknown>(
    fn: T,
    limit: number,
): (...args: Parameters<T>) => void {
    let inThrottle = false;
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            inThrottle = true;
            fn(...args);
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}

/** RAF 节流：基于 requestAnimationFrame 的节流 */
export function rafThrottle<T extends (...args: unknown[]) => unknown>(
    fn: T,
): (...args: Parameters<T>) => void {
    let rafId: number | null = null;
    return (...args: Parameters<T>) => {
        if (rafId !== null) return;
        rafId = requestAnimationFrame(() => {
            rafId = null;
            fn(...args);
        });
    };
}

/** 自动清理事件监听器的包装器 */
export function cleanupOnDestroy(
    element: HTMLElement,
    cleanupFn: () => void,
): void {
    const originalDestroy = (element as any).destroy?.bind(element);
    (element as any).destroy = () => {
        cleanupFn();
        originalDestroy?.();
    };
}

/** 内存泄漏检测：记录活跃的事件监听器数量（调试用） */
let eventListenerCount = 0;
if (typeof window !== "undefined") {
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(this: EventTarget, type: string, callback: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions) {
        eventListenerCount++;
        return originalAddEventListener.call(this, type, callback, options);
    };
    const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.removeEventListener = function(this: EventTarget, type: string, callback: EventListenerOrEventListenerObject | null, options?: boolean | EventListenerOptions) {
        eventListenerCount--;
        return originalRemoveEventListener.call(this, type, callback, options);
    };
    // 导出到全局用于调试
    (window as any).__xlcEventListeners = () => eventListenerCount;
}

export interface VirtualScrollWindow {
    startIndex: number;
    endIndex: number;
    offsetY: number;
    totalHeight: number;
    visibleCount: number;
}

/**
 * 纯函数：计算超大条目库 (5000+项) 的虚拟滚动视口窗口范围
 * 用于轻量 DOM 树挂载与非可视区域内存即时回收
 */
export function calculateVirtualScrollWindow(
    totalCount: number,
    scrollTop: number,
    itemHeight: number,
    viewportHeight: number,
    buffer = 4,
): VirtualScrollWindow {
    if (totalCount <= 0 || itemHeight <= 0 || viewportHeight <= 0) {
        return {startIndex: 0, endIndex: 0, offsetY: 0, totalHeight: 0, visibleCount: 0};
    }
    const totalHeight = totalCount * itemHeight;
    const clampedScrollTop = Math.max(0, Math.min(scrollTop, Math.max(0, totalHeight - viewportHeight)));
    const rawStart = Math.floor(clampedScrollTop / itemHeight);
    const visibleCount = Math.ceil(viewportHeight / itemHeight);
    const startIndex = Math.max(0, rawStart - buffer);
    const endIndex = Math.min(totalCount, rawStart + visibleCount + buffer);
    const offsetY = startIndex * itemHeight;
    return {
        startIndex,
        endIndex,
        offsetY,
        totalHeight,
        visibleCount,
    };
}
