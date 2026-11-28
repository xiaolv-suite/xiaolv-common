// 石墨清雾（风格 A）单色细线 SVG 图标辅助模块（stroke-width: 1.65，无彩色方块与玩具 Emoji）
import type {ItemType} from "../model/item";

export type GmIconKind =
    | "snippet"
    | "block"
    | "url"
    | "command"
    | "image"
    | "asset"
    | "search"
    | "plus"
    | "star"
    | "clock"
    | "clipboard"
    | "folder"
    | "all"
    | "settings"
    | "bolt"
    | "chevron-down"
    | "more"
    | "close"
    | "refresh"
    | "tag";

const SVG_PATHS: Record<GmIconKind, string[]> = {
    snippet: ["M4 7h16", "M4 12h12", "M4 17h8"],
    block: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M8 13h8", "M8 17h5"],
    url: [
        "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
        "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
    ],
    command: ["m7 8 4 4-4 4", "M13 16h4"],
    image: ["M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"],
    asset: ["m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"],
    search: ["m20 20-3.5-3.5"],
    plus: ["M12 5v14", "M5 12h14"],
    star: ["M12 3l2.6 5.3 5.9.8-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8-4.2-4.1 5.9-.8z"],
    clock: ["M12 7v5l3 2"],
    clipboard: ["M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2", "M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2", "M9 12h6", "M9 16h4"],
    folder: ["M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"],
    all: ["M3 10h18"],
    settings: [
        "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.08a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.08a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.08a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
    ],
    bolt: ["M13 2L3 14h7l-1 8 10-12h-7l1-8z"],
    "chevron-down": ["m6 9 6 6 6-6"],
    more: [],
    close: ["M18 6 6 18", "M6 6l12 12"],
    refresh: ["M21 12a9 9 0 1 1-2.64-6.36", "M21 3v6h-6"],
    tag: ["M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"],
};

export function mapItemTypeToIconKind(itemType: ItemType | string | undefined): GmIconKind {
    switch (itemType) {
        case "blockref":
        case "structure":
            return "block";
        case "url":
            return "url";
        case "code":
            return "command";
        case "image":
            return "image";
        case "asset":
            return "asset";
        default:
            return "snippet";
    }
}

export function getGmTypeLabel(itemType: ItemType | string | undefined): string {
    switch (itemType) {
        case "blockref":
        case "structure":
            return "文档与块";
        case "url":
            return "常用网址";
        case "code":
            return "快捷命令";
        case "image":
            return "图片素材";
        case "asset":
            return "文档附件";
        default:
            return "片段模板";
    }
}

export function createGmSvg(kind: GmIconKind, className = "xlc-gm-svg"): HTMLElement {
    const ns = "http://www.w3.org/2000/svg";
    const hasNS = typeof document !== "undefined" && typeof document.createElementNS === "function";
    const svg = (hasNS
        ? document.createElementNS(ns, "svg")
        : document.createElement("svg")) as unknown as HTMLElement;
    if (typeof svg.setAttribute === "function") {
        svg.setAttribute("class", className);
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("fill", "none");
        svg.setAttribute("stroke", "currentColor");
        svg.setAttribute("stroke-width", "1.65");
        svg.setAttribute("stroke-linecap", "round");
        svg.setAttribute("stroke-linejoin", "round");
        svg.setAttribute("aria-hidden", "true");
    } else {
        svg.className = className;
    }

    const mk = (tag: string, attrs: Record<string, string>) => {
        const node = (hasNS ? document.createElementNS(ns, tag) : document.createElement(tag)) as unknown as HTMLElement;
        if (typeof node.setAttribute === "function") {
            for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
        }
        svg.appendChild(node);
    };

    if (kind === "command" || kind === "all") {
        mk("rect", {x: "3", y: "4", width: "18", height: "16", rx: "2"});
    } else if (kind === "image") {
        mk("rect", {x: "3", y: "3", width: "18", height: "18", rx: "2"});
        mk("circle", {cx: "9", cy: "9", r: "2"});
    } else if (kind === "search") {
        mk("circle", {cx: "11", cy: "11", r: "7"});
    } else if (kind === "clock") {
        mk("circle", {cx: "12", cy: "12", r: "9"});
    } else if (kind === "settings") {
        mk("circle", {cx: "12", cy: "12", r: "3"});
    } else if (kind === "more") {
        mk("circle", {cx: "5", cy: "12", r: "1.4", fill: "currentColor", stroke: "none"});
        mk("circle", {cx: "12", cy: "12", r: "1.4", fill: "currentColor", stroke: "none"});
        mk("circle", {cx: "19", cy: "12", r: "1.4", fill: "currentColor", stroke: "none"});
    } else if (kind === "tag") {
        mk("circle", {cx: "7", cy: "7", r: "1.3", fill: "currentColor", stroke: "none"});
    }

    for (const d of SVG_PATHS[kind] || []) {
        mk("path", {d});
    }
    return svg;
}
