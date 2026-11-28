// 本地日期格式化轻量工具（零依赖，微内核启动友好）
export function formatLocalDate(now: Date = new Date()): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
