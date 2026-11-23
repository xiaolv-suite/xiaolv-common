/**
 * 小驴全生态统一图标工厂 (Lv Ecosystem Icon Kit · SiYuan Litheness 1:1 同源标准)
 * DL2 阶段3 · 图标 5→1 专项（DL2-PLAN §五）
 *
 * 核心设计约束（对齐思源笔记官方 conf/appearance/icons/litheness 规范）：
 * 1. 100% 遵循思源官方 litheness (Lucide 24×24) 几何规范：
 *    - 统一 viewBox="0 0 24 24"，光学有效画布 20×20 (x/y: 2..22)，彻底根治旧版 12×12~14×14 缩水偏小问题；
 *    - 统一 rx=2 圆角矩形与圆润贝塞尔齿廓，摒弃生硬直角折线；
 *    - 统一 fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"；
 * 2. 免疫思源宿主全局 `svg { fill: currentColor }` 污染（svg 与 path 双重 fill="none"）；
 * 3. 修复 CSS `.lv-icon { width:1em }` 覆盖 SVG width/height 属性导致图标被压扁至 11~14px 的缺陷，
 *    通过内联 `--lv-icon-sz` + 显式像素尺寸驱动，支持 xs(14)/sm(16)/md(20)/lg(24)/xl(28) 五档与任意数值；
 * 4. 完整收录 72 枚图标：27 枚核心基础图标 + 10 枚小驴生态插件品牌图标 + 35 枚思源原生高频 #icon* 同源图标。
 */

export const LV_ICON_PATHS = {
    /* ===================================================================== */
    /* A. 核心通用 27 枚（按思源官方 litheness 20×20 满视箱光学标准 1:1 重构） */
    /* ===================================================================== */
    home: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01",
    history: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5M12 7v5l4 2",
    summary: "M3 3v16a2 2 0 0 0 2 2h16M7 16v-5M12 16V7M17 16v-8",
    insight: "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0zM20 3v4M22 5h-4",
    archive: "M3 4h18a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4",
    settings: "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
    add: "M4 12h16M12 4v16",
    back: "m15 19-7-7 7-7M8 12h13",
    forward: "m9 19 7-7-7-7M3 12h13",
    search: "M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0zM21 21l-4.35-4.35",
    external: "M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
    focus: "M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2",
    more: "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
    edit: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497zM15 5l4 4",
    trash: "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6",
    timer: "M10 2h4M12 14l3-3M4.6 11a8 8 0 1 1 .5 4M4 16v-5h5",
    expand: "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7",
    close: "M18 5 5 18M5 5l13 13",
    check: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm4 9 2.2 2.2L15.5 9.8",
    circle: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
    pause: "M6 3h3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM15 3h3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z",
    play: "M6 4v16a1 1 0 0 0 1.524.852l13-8a1 1 0 0 0 0-1.704l-13-8A1 1 0 0 0 6 4z",
    camera: "M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4zM15 13a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
    trophy: "M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2z",
    fire: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z",
    trend: "m22 7-8.5 8.5-5-5L2 17M16 7h6v6",

    /* ===================================================================== */
    /* B. 小驴全生态 9 联结与罗盘品牌专属图标（10 枚 · 与 8 仓 addIcons 同源） */
    /* ===================================================================== */
    compass: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z",
    checkin: "M8 2v4M16 2v4M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM3 10h18M9 16l2 2 4-4",
    butler: "M15 21v-6a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v6M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM12 10h.01",
    contacts: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    glean: "M12 7v14M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",
    cards: "M8 6h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM4 18V5a2 2 0 0 1 2-2h11M10 14l2.2 2.2 4.3-4.4",
    exam: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20M9 10l2 2 4-4",
    common: "M8 2h8a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 12h6M9 16h4",
    raikiri: "M13 2 3 14h9l-1 8 10-12h-9l1-8z",
    exoskeleton: "M12 2 4 7v10l8 5 8-5V7l-8-5zM12 22V12M20 7l-8 5-8-5",

    /* ===================================================================== */
    /* C. 思源笔记官方 litheness 高频同源图标（35 枚 · #icon* 1:1 映射）      */
    /* ===================================================================== */
    sparkles: "m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72zM14 7l3 3M5 6v4M19 14v4M10 2v2M7 8H3M21 16h-4",
    pin: "M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z",
    unpin: "M12 17v5M15 9.34V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H7.89M2 2l20 20M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h11",
    copy: "M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M16 4h2a2 2 0 0 1 2 2v4M21 14H11M15 10l-4 4 4 4",
    link: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
    tag: "M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42zM8 7.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z",
    bookmark: "M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z",
    folder: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",
    file: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2zM14 2v5a1 1 0 0 0 1 1h5",
    inbox: "M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
    filter: "M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z",
    sort: "m3 16 4 4 4-4M7 20V4M11 4h10M11 8h7M11 12h4",
    refresh: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5",
    undo: "M3 7v6h6M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13",
    download: "M12 15V3M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5",
    upload: "M12 3v12M17 8l-5-5-5 5M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
    eye: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
    eyeOff: "M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49M14.084 14.158a3 3 0 0 1-4.242-4.242M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143M2 2l20 20",
    star: "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",
    heart: "M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5",
    users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3.128a4 4 0 0 1 0 7.744M22 21v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z",
    user: "M17.925 20.056a6 6 0 0 0-11.851.001M16 11a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z",
    zap: "M15.914 4a1.5 1.5 0 0 0-2.474-1.561l-9 9A1.5 1.5 0 0 0 5.5 14h4.002a.5.5 0 0 1 .471.666L8.086 20a1.5 1.5 0 0 0 2.475 1.56l9-9A1.5 1.5 0 0 0 18.5 10h-3.997a.5.5 0 0 1-.472-.667z",
    shield: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1zM9 12l2 2 4-4",
    book: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20",
    code: "m10 9-3 3 3 3M14 15l3-3-3-3M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
    image: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM11 9a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21",
    bell: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0",
    moon: "M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401z",
    sun: "M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41",
    layout: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 3v18M9 15h12",
    send: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11zM21.854 2.147 10.914 13.086",
    info: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0zM12 16v-4M12 8h.01",
    warn: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3zM12 9v4M12 17h.01",
    help: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0zM9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01",
} as const;

export type LvIconName = keyof typeof LV_ICON_PATHS;

/** 思源笔记原生 litheness / 8 仓自定义 `<symbol id="...">` 映射表 */
export const LV_SIYUAN_SYMBOL_MAP: Record<LvIconName, string> = {
    home: "#iconHome",
    calendar: "#iconCalendar",
    history: "#iconHistory",
    summary: "#iconChart",
    insight: "#iconSparkles",
    archive: "#iconArchive",
    settings: "#iconSettings",
    add: "#iconAdd",
    back: "#iconLeft",
    forward: "#iconRight",
    search: "#iconSearch",
    external: "#iconOpenWindow",
    focus: "#iconFocus",
    more: "#iconMore",
    edit: "#iconEdit",
    trash: "#iconTrashcan",
    timer: "#iconClock",
    expand: "#iconFullscreen",
    close: "#iconClose",
    check: "#iconCheck",
    circle: "#iconRecord",
    pause: "#iconPause",
    play: "#iconPlay",
    camera: "#iconCamera",
    trophy: "#iconTrophy",
    fire: "#iconFlame",
    trend: "#iconReport",
    compass: "#iconLvCompass",
    checkin: "#iconLvCheckin",
    butler: "#iconLvHome",
    contacts: "#iconLvContacts",
    glean: "#iconLvGlean",
    cards: "#iconLvCards",
    exam: "#iconLvExam",
    common: "#iconLvCommon",
    raikiri: "#iconLvSpeedSwitch",
    exoskeleton: "#iconLvExoskeleton",
    sparkles: "#iconSparkles",
    pin: "#iconPin",
    unpin: "#iconUnpin",
    copy: "#iconCopy",
    link: "#iconLink",
    tag: "#iconTag",
    bookmark: "#iconBookmark",
    folder: "#iconFolder",
    file: "#iconFile",
    inbox: "#iconInbox",
    filter: "#iconFilter",
    sort: "#iconSort",
    refresh: "#iconRefresh",
    undo: "#iconUndo",
    download: "#iconDownload",
    upload: "#iconUpload",
    eye: "#iconEye",
    eyeOff: "#iconEyeoff",
    star: "#iconStar",
    heart: "#iconHeart",
    users: "#iconUsers",
    user: "#iconAccount",
    zap: "#iconZap",
    shield: "#iconShieldCheck",
    book: "#iconBook",
    code: "#iconCode",
    image: "#iconImage",
    bell: "#iconBell",
    moon: "#iconDark",
    sun: "#iconLight",
    layout: "#iconLayout",
    send: "#iconSend",
    info: "#iconInfo",
    warn: "#iconTriangleAlert",
    help: "#iconHelp",
};

/** 预设五档图标尺寸映射（px）：对齐思源笔记顶栏/菜单/按钮/卡片/Hero视觉层级 */
export const LV_ICON_SIZE_PRESETS = {
    xs: 14,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
} as const;

export type LvIconSizePreset = keyof typeof LV_ICON_SIZE_PRESETS;

export interface LvIconOptions {
    /** 附加 class（仓内布局/尺寸类；颜色一律 currentColor） */
    className?: string;
    /** 像素尺寸或五档预设 ('xs'=14 | 'sm'=16 | 'md'=20 | 'lg'=24 | 'xl'=28，默认 18px) */
    size?: number | LvIconSizePreset;
    /** 描边宽度（默认 1.75，与思源 litheness 一致） */
    strokeWidth?: number;
}

/** 统一线性图标 SVG 工厂（aria-hidden 装饰件；语义入口由使用方 label 承担） */
export function lvIcon(name: LvIconName, opts: LvIconOptions = {}): string {
    const cls = opts.className ? ` ${opts.className}` : "";
    const resolvedPx = typeof opts.size === "string"
        ? LV_ICON_SIZE_PRESETS[opts.size]
        : opts.size;
    const attrSz = resolvedPx ? String(resolvedPx) : "18";
    const sizeStyle = resolvedPx
        ? `--lv-icon-sz:${resolvedPx}px;width:${resolvedPx}px;height:${resolvedPx}px;`
        : "";
    const stroke = opts.strokeWidth ?? 1.75;
    const pathD = LV_ICON_PATHS[name] || LV_ICON_PATHS.circle;
    return `<svg class="lv-icon${cls}" width="${attrSz}" height="${attrSz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" style="${sizeStyle}fill:none!important;stroke:currentColor;flex-shrink:0;" aria-hidden="true" focusable="false"><path d="${pathD}" fill="none" /></svg>`;
}
