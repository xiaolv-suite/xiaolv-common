// ============================================================
// 启动性能度量工具：安全封装 performance.mark / performance.measure
// ============================================================

export function safePerfMark(name: string): void {
    if (typeof performance !== "undefined" && typeof performance.mark === "function") {
        try {
            performance.mark(name);
        } catch {
            // ignore
        }
    }
}

export function safePerfMeasure(name: string, startMark: string, endMark: string): PerformanceMeasure | undefined {
    if (typeof performance !== "undefined" && typeof performance.measure === "function") {
        try {
            return performance.measure(name, startMark, endMark);
        } catch {
            // ignore
        }
    }
    return undefined;
}

export function getPerfMeasureDuration(name: string): number | null {
    if (typeof performance !== "undefined" && typeof performance.getEntriesByName === "function") {
        try {
            const entries = performance.getEntriesByName(name, "measure");
            if (entries.length > 0) {
                const last = entries[entries.length - 1];
                return last ? last.duration : null;
            }
        } catch {
            // ignore
        }
    }
    return null;
}
