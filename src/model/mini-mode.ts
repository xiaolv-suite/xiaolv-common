// 迷你悬浮状态呈现与交互全景模型 (20261121-01 / T-0857)
// 包含：最新剪贴板首卡文本折行摘要、场景胶囊分组生成、悬浮气泡预览定位与贴边胶囊动态跑马灯纯函数

export interface MiniPopoverPosition {
    left: number;
    top: number;
}

export interface MiniCategoryChipItem {
    key: string;
    label: string;
    type: "scope" | "category";
    scopeVal?: string;
    catVal?: string;
}

/**
 * 格式化最新剪贴板首卡前瞻折行文本摘要（纯函数）
 * 归一化换行符，合并连续空行，并在超长时安全截断附带省略号
 */
export function formatMiniHeroSnippet(text?: string, maxLen = 160): string {
    if (!text || typeof text !== "string") return "";
    const normalized = text.replace(/\r\n/g, "\n").trim();
    if (!normalized) return "";
    if (normalized.length <= maxLen) {
        return normalized;
    }
    return normalized.slice(0, maxLen).trim() + "…";
}

/**
 * 计算迷你模式下的场景分组胶囊列表（纯函数）
 * 组合系统固定胶囊（全部/剪贴板历史/星标）与用户一级业务分组或经典高频场景（财务对公/物流地址/客服回复）
 */
export function getMiniCategoryChipsList(
    userCategories: string[] = [],
    defaultPresets: string[] = ["财务对公", "物流地址", "客服回复"]
): string[] {
    const extractedUserCats = (userCategories || [])
        .map((cat) => (cat || "").split("/")[0]?.trim())
        .filter((c): c is string => Boolean(c) && c !== "常用");

    const merged = Array.from(new Set([...extractedUserCats, ...defaultPresets]));
    return merged;
}

/**
 * 构建完整的场景胶囊模型数组（含 scope 与 category 两种类型）
 */
export function buildMiniCategoryChips(
    userCategories: string[] = [],
    defaultPresets: string[] = ["财务对公", "物流地址", "客服回复"]
): MiniCategoryChipItem[] {
    const list: MiniCategoryChipItem[] = [
        {key: "all", label: "全部", type: "scope", scopeVal: "all"},
        {key: "clipboard", label: "📋 剪贴板历史", type: "scope", scopeVal: "clipboard"},
        {key: "favorites", label: "⭐ 星标", type: "scope", scopeVal: "favorites"},
    ];

    const catLabels = getMiniCategoryChipsList(userCategories, defaultPresets);
    for (const cat of catLabels) {
        list.push({
            key: `cat-${cat}`,
            label: cat,
            type: "category",
            catVal: cat,
        });
    }

    return list;
}

/**
 * 计算迷你条目气泡式悬浮预览（Popover）的最佳视口定位（纯函数）
 * 优先停靠在迷你浮窗左侧或右侧宽裕区域，避开边缘溢出；分屏或窄视口下弹性停靠空间更大的一侧或自适应居中约束
 */
export function calculateMiniPopoverPosition(
    containerRect: {left: number; right: number},
    anchorRect: {top: number},
    viewport: {width: number; height: number},
    popoverSize: {width: number; height: number} = {width: 310, height: 280}
): MiniPopoverPosition {
    const pad = 10;
    let left = 0;

    // 优先停靠在左侧（如果有足够空间）
    if (containerRect.left > popoverSize.width + 16) {
        left = containerRect.left - popoverSize.width - 8;
    }
    // 否则停靠在右侧（如果有足够空间）
    else if (viewport.width - containerRect.right > popoverSize.width + 16) {
        left = containerRect.right + 8;
    }
    // 否则在容器附近自适应浮动并限制在视口内（分屏或较窄视口：哪侧空间大停靠哪侧，并做视口内安全 clamp）
    else {
        const spaceLeft = containerRect.left;
        const spaceRight = viewport.width - containerRect.right;
        if (spaceLeft >= spaceRight && spaceLeft > popoverSize.width * 0.7) {
            left = Math.max(pad, containerRect.left - popoverSize.width - 8);
        } else if (spaceRight >= spaceLeft && spaceRight > popoverSize.width * 0.7) {
            left = Math.min(viewport.width - popoverSize.width - pad, containerRect.right + 8);
        } else {
            left = Math.max(pad, Math.min(viewport.width - popoverSize.width - pad, containerRect.left));
        }
    }

    // 纵向对齐目标条目行顶端，并防止超出视口底边或顶边
    let top = anchorRect.top;
    if (top + popoverSize.height > viewport.height - pad) {
        top = Math.max(pad, viewport.height - popoverSize.height - pad);
    }
    if (top < pad) {
        top = pad;
    }

    return {
        left: Math.round(left),
        top: Math.round(top),
    };
}

/**
 * 格式化折叠贴边胶囊动态跑马灯摘要（纯函数）
 * 将最新剪贴板多行内容清洗为单行平滑滚动文本
 */
export function formatCollapsedPillMarquee(clipText?: string): {text: string; hasContent: boolean} {
    if (!clipText || typeof clipText !== "string") {
        return {text: "", hasContent: false};
    }
    const clean = clipText.trim().replace(/[\r\n\s]+/g, " ");
    if (!clean) {
        return {text: "", hasContent: false};
    }
    const snippet = clean.length > 50 ? clean.slice(0, 50) + "…" : clean;
    return {
        text: `最新: ${snippet}`,
        hasContent: true,
    };
}

/**
 * 解析迷你模式下的数字快捷键仲裁决策（纯函数 · 解决搜索输入与快捷键冲突）
 * - 规则 1：当搜索框有焦点（isInputFocused === true）时，用户敲击单数字键 1~9 必须始终正常输入检索，绝不拦截；
 * - 规则 2：当搜索框有焦点时，允许使用修饰键（Alt+1~9 插入，Alt+Shift+1~9 复制）手不离键盘直达；
 * - 规则 3：当搜索框失焦 / 焦点在列表（isInputFocused === false）时，单按 1~9 触发插入，Shift+1~9 触发复制；
 * - 规则 4：任何 ctrl / meta 组合键或超出 1~9 范围的按键均不处理。
 */
export function resolveMiniDigitShortcut(event: {
    isMiniMode: boolean;
    isInputFocused: boolean;
    key: string;
    code?: string;
    altKey?: boolean;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
}): {handled: boolean; action?: "insert" | "copy"; digitIndex?: number} {
    if (!event.isMiniMode) return {handled: false};
    if (event.ctrlKey || event.metaKey) return {handled: false};

    const isDigit = /^[1-9]$/.test(event.key) || /^Digit[1-9]$/.test(event.code || "");
    if (!isDigit) return {handled: false};

    let num: number | null = null;
    if (/^[1-9]$/.test(event.key)) num = Number(event.key);
    else if (/^Digit[1-9]$/.test(event.code || "")) num = Number((event.code || "").replace("Digit", ""));
    if (num === null || num < 1 || num > 9) return {handled: false};

    const idx = num - 1;

    // 搜索框处于输入焦点状态：数字必须正常输入，仅 Alt 修饰键直达
    if (event.isInputFocused) {
        if (event.altKey) {
            return {
                handled: true,
                action: event.shiftKey ? "copy" : "insert",
                digitIndex: idx,
            };
        }
        return {handled: false};
    }

    // 列表焦点或搜索框失焦状态：单按数字键直达插入，Shift+数字复制
    return {
        handled: true,
        action: event.shiftKey ? "copy" : "insert",
        digitIndex: idx,
    };
}

