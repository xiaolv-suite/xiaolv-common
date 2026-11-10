// 跨平台快捷键提示格式化与热键冲突检测预检引擎（T-0699）：
// 1. 跨平台按键键帽格式化：根据运行平台自适应展示 ⌥ / ⌘ / ⇧ 或 Alt / Ctrl / Shift
// 2. 快捷键冲突检测：规范化按键字符并检测重复注册与快捷键交叉冲突

export interface ShortcutDefinition {
    id: string;
    key: string;
    action?: string;
}

export interface ShortcutConflict {
    normalizedKey: string;
    conflictingIds: string[];
}

/** 规范化快捷键字符串为统一的小写排序键（例如 "Ctrl + Shift + Enter" -> "ctrl+enter+shift"） */
export function normalizeShortcutKey(keyStr: string): string {
    if (!keyStr) return "";
    const clean = keyStr
        .replace(/⌥/g, "alt")
        .replace(/⌘/g, "ctrl")
        .replace(/⇧/g, "shift")
        .toLowerCase();
    const parts = clean
        .split(/[+\-\s]+/)
        .map((p) => p.trim())
        .filter(Boolean);
    parts.sort();
    return parts.join("+");
}

/**
 * 跨平台按键文案格式化：根据运行平台自适应输出符号化（Apple）或英文键名（Windows/Linux）
 */
export function formatPlatformShortcut(shortcut: string, isApple?: boolean): string {
    const apple = isApple ?? (typeof navigator !== "undefined" ? /Mac|iPhone|iPad/i.test(navigator.platform || "") : false);
    if (!shortcut) return "";

    if (apple) {
        return shortcut
            .replace(/\bAlt\b/gi, "⌥")
            .replace(/\bCtrl\b/gi, "⌘")
            .replace(/\bShift\b/gi, "⇧")
            .replace(/\s*\+\s*/g, " ")
            .trim();
    }

    return shortcut
        .replace(/⌥/g, "Alt")
        .replace(/⌘/g, "Ctrl")
        .replace(/⇧/g, "Shift")
        .replace(/\s*\+\s*/g, " + ")
        .trim();
}

/**
 * 纯函数：检测快捷键配置列表中是否存在重复绑定的按键冲突
 */
export function detectShortcutConflicts(shortcuts: readonly ShortcutDefinition[]): ShortcutConflict[] {
    const keyMap = new Map<string, string[]>();

    for (const sc of shortcuts) {
        const norm = normalizeShortcutKey(sc.key);
        if (!norm) continue;
        const list = keyMap.get(norm) ?? [];
        list.push(sc.id);
        keyMap.set(norm, list);
    }

    const conflicts: ShortcutConflict[] = [];
    for (const [normalizedKey, ids] of keyMap.entries()) {
        if (ids.length > 1) {
            conflicts.push({normalizedKey, conflictingIds: ids});
        }
    }

    return conflicts.sort((a, b) => a.normalizedKey.localeCompare(b.normalizedKey));
}
