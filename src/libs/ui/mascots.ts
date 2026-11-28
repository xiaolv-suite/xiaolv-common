/**
 * 小驴吉祥物「小驴」· 18 形态内联 SVG (Lv Mascot Kit)
 * DL2 Epoch · Protocol v1.1.0（DL2-PLAN §4.5 · 微形态扩展）
 *
 * 形态分层：
 * - 大形态（96px 级）：wave / study / celebrate / sleep / carry —— 每屏至多 1 个；
 * - 微形态（16~36px 级）：peek / think / run / read / heart / rest / head ——
 *   低调陪伴，单屏至多 2 处，pointer-events 永不拦截，进度随行者随条而动。
 *
 * 设计约束：
 * 1. 扁平几何小毛驴，内联 SVG（离线安全），主形用 currentColor 主题化；
 * 2. 受 mascot 偏好门控（data-lv-mascot="off" 时微形态 API 返回零占位空壳）；
 * 3. 装饰性动画类（lvx-mascot--anim / --breath）挂 data-lv-motion 与系统减弱动效门控。
 */

export type LvMascotPose =
    | "wave" | "study" | "celebrate" | "sleep" | "carry"
    | "peek" | "think" | "run" | "read" | "heart" | "rest"
    | "check" | "sync" | "alert" | "idea" | "write" | "search"
    | "head";

const SHADOW = `<ellipse cx="72" cy="119" rx="44" ry="6" fill="currentColor" opacity=".12"/>`;

const TAIL = `<g>
    <path d="M36 74 Q20 78 18 92" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/>
    <ellipse cx="17" cy="95" rx="4.5" ry="6" transform="rotate(18 17 95)" fill="#F59E0B"/>
</g>`;

const BODY = (extra = ""): string => `
    <g>
        ${TAIL}
        <rect x="34" y="60" width="76" height="44" rx="22" fill="currentColor"/>
        <rect x="44" y="70" width="56" height="28" rx="14" fill="#FFFFFF" opacity=".16"/>
        ${extra}
    </g>`;

const LEGS = (pose: string): string => `
    <g>
        ${pose === "wave" || pose === "celebrate" ? "" : `<rect x="43" y="98" width="11" height="20" rx="5.5" fill="currentColor"/><path d="M43 112 h11 v3 a3.5 3.5 0 0 1 -3.5 3.5 h-4 a3.5 3.5 0 0 1 -3.5 -3.5 z" fill="#1C1B26" opacity=".55"/>`}
        <rect x="60" y="99" width="11" height="19" rx="5.5" fill="currentColor"/>
        <path d="M60 112 h11 v3 a3.5 3.5 0 0 1 -3.5 3.5 h-4 a3.5 3.5 0 0 1 -3.5 -3.5 z" fill="#1C1B26" opacity=".55"/>
        <rect x="77" y="99" width="11" height="19" rx="5.5" fill="currentColor"/>
        <path d="M77 112 h11 v3 a3.5 3.5 0 0 1 -3.5 3.5 h-4 a3.5 3.5 0 0 1 -3.5 -3.5 z" fill="#1C1B26" opacity=".55"/>
        ${pose === "celebrate" ? "" : `<rect x="93" y="98" width="11" height="20" rx="5.5" fill="currentColor"/><path d="M93 112 h11 v3 a3.5 3.5 0 0 1 -3.5 3.5 h-4 a3.5 3.5 0 0 1 -3.5 -3.5 z" fill="#1C1B26" opacity=".55"/>`}
    </g>`;

const HEAD = (opts?: { happyEyes?: boolean; glasses?: boolean; extra?: string }): string => `
    <g>
        <!-- 长驴耳（外耳主色 + 内耳暖橘柔粉） -->
        <path d="M58 26 C55 6 42 4 39 15 C37 22 44 32 49 34 Z" fill="currentColor"/>
        <path d="M55 25 C53 12 44 10 42 17 C41 21 46 28 49 30 Z" fill="#F59E0B" opacity=".42"/>
        <path d="M86 26 C89 6 102 4 105 15 C107 22 100 32 95 34 Z" fill="currentColor"/>
        <path d="M89 25 C91 12 100 10 102 17 C103 21 98 28 95 30 Z" fill="#F59E0B" opacity=".42"/>
        <!-- 头顶呆毛 -->
        <path d="M68 20 Q72 11 77 19 Q74 14 71 21 Z" fill="#F59E0B"/>
        <!-- 圆润脸颊 -->
        <rect x="44" y="20" width="56" height="44" rx="22" fill="currentColor"/>
        <!-- 双眼与高光 -->
        ${opts?.happyEyes
            ? `<path d="M53 36 q5 -6 10 0" fill="none" stroke="#1C1B26" stroke-width="2.6" stroke-linecap="round"/>
               <path d="M81 36 q5 -6 10 0" fill="none" stroke="#1C1B26" stroke-width="2.6" stroke-linecap="round"/>`
            : `<circle cx="58" cy="36" r="3.8" fill="#1C1B26"/>
               <circle cx="56.8" cy="34.6" r="1.3" fill="#FFFFFF"/>
               <circle cx="86" cy="36" r="3.8" fill="#1C1B26"/>
               <circle cx="84.8" cy="34.6" r="1.3" fill="#FFFFFF"/>`}
        <!-- 腮红 -->
        <ellipse cx="50" cy="43" rx="4" ry="2.2" fill="#F59E0B" opacity=".45"/>
        <ellipse cx="94" cy="43" rx="4" ry="2.2" fill="#F59E0B" opacity=".45"/>
        <!-- 浅米白驴嘴吻部 + 鼻孔 + 微笑 -->
        <ellipse cx="72" cy="49" rx="15" ry="10.5" fill="#F4F5FB" opacity=".92"/>
        <circle cx="67" cy="46" r="1.5" fill="#1C1B26" opacity=".55"/>
        <circle cx="77" cy="46" r="1.5" fill="#1C1B26" opacity=".55"/>
        <path d="M66 52 q6 5.5 12 0" fill="none" stroke="#1C1B26" stroke-width="2.2" stroke-linecap="round" opacity=".82"/>
        ${opts?.glasses
            ? `<circle cx="58" cy="36" r="7.5" fill="none" stroke="#F59E0B" stroke-width="2"/>
               <circle cx="86" cy="36" r="7.5" fill="none" stroke="#F59E0B" stroke-width="2"/>
               <line x1="65.5" y1="36" x2="78.5" y2="36" stroke="#F59E0B" stroke-width="2"/>`
            : ""}
        ${opts?.extra || ""}
    </g>`;

/** 各姿态：144×128 视箱，几何精雕扁平插画 */
const POSE_SVGS: Record<LvMascotPose, string> = {
    // 1. 挥手迎新：左前蹄高举挥动 + 四角星辉光
    wave: `${SHADOW}
        ${BODY(`<g transform="rotate(-34 38 72)">
            <rect x="20" y="46" width="11" height="28" rx="5.5" fill="currentColor"/>
            <rect x="20" y="46" width="11" height="6" rx="3" fill="#1C1B26" opacity=".5"/>
        </g>`)}
        ${LEGS("wave")}
        ${HEAD()}
        <path d="M114 20 l2.5 5.5 l5.5 2.5 l-5.5 2.5 l-2.5 5.5 l-2.5 -5.5 l-5.5 -2.5 l5.5 -2.5 z" fill="#F59E0B"/>
        <circle cx="126" cy="40" r="3" fill="currentColor" opacity=".65"/>
        <circle cx="20" cy="34" r="2.5" fill="#F59E0B" opacity=".8"/>`,

    // 2. 举卡学习：佩戴金丝圆框眼镜 + 身前悬浮知识闪卡与对勾徽章
    study: `${SHADOW}
        ${BODY()}
        ${LEGS("study")}
        ${HEAD({ glasses: true })}
        <g transform="translate(0, 2)">
            <rect x="47" y="62" width="50" height="36" rx="8" fill="#F4F5FB" stroke="currentColor" stroke-width="2.4"/>
            <rect x="54" y="70" width="24" height="4.5" rx="2.2" fill="currentColor" opacity=".75"/>
            <rect x="54" y="78" width="34" height="4" rx="2" fill="#F59E0B" opacity=".85"/>
            <rect x="54" y="85" width="28" height="4" rx="2" fill="#1C1B26" opacity=".25"/>
            <circle cx="95" cy="64" r="7" fill="#2F9E68"/>
            <path d="M91.8 64 l2.2 2.4 l4.2 -4.4" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </g>`,

    // 3. 撒花庆祝：弯月笑眼 + 双蹄欢呼上扬 + 小皇冠与几何彩屑
    celebrate: `${SHADOW}
        ${BODY(`<g transform="rotate(-42 36 68)"><rect x="18" y="42" width="11" height="26" rx="5.5" fill="currentColor"/></g>
                <g transform="rotate(42 108 68)"><rect x="115" y="42" width="11" height="26" rx="5.5" fill="currentColor"/></g>`)}
        ${LEGS("celebrate")}
        ${HEAD({
            happyEyes: true,
            extra: `<polygon points="63,19 67,10 72,16 77,10 81,19" fill="#F59E0B"/>`,
        })}
        <path d="M22 22 l2 4.5 l4.5 2 l-4.5 2 l-2 4.5 l-2 -4.5 l-4.5 -2 l4.5 -2 z" fill="#F59E0B"/>
        <path d="M122 18 l2 4.5 l4.5 2 l-4.5 2 l-2 4.5 l-2 -4.5 l-4.5 -2 l4.5 -2 z" fill="#2F9E68"/>
        <rect x="32" y="10" width="7" height="7" rx="2" fill="currentColor" transform="rotate(22 35 13)"/>
        <rect x="108" y="8" width="7" height="7" rx="2" fill="#E5484D" transform="rotate(-18 111 11)"/>
        <circle cx="16" cy="48" r="3" fill="#E5484D" opacity=".85"/>
        <circle cx="128" cy="44" r="3.2" fill="#F59E0B"/>`,

    // 4. 睡觉 Zzz：云朵软垫卧姿 + 暖橘小盖毯 + 弯月与渐变 Zzz
    sleep: `<g>
        <ellipse cx="74" cy="112" rx="54" ry="10" fill="currentColor" opacity=".13"/>
        <!-- 蜷卧身体与暖橘小毛毯 -->
        <rect x="26" y="68" width="84" height="38" rx="19" fill="currentColor"/>
        <path d="M44 68 h44 a14 14 0 0 1 14 14 v10 h-58 z" fill="#F59E0B" opacity=".32"/>
        <!-- 垂耳与睡颜 -->
        <path d="M84 54 C76 44 64 48 68 58 Z" fill="currentColor" opacity=".9"/>
        <path d="M104 54 C114 44 122 50 116 60 Z" fill="currentColor" opacity=".9"/>
        <rect x="74" y="54" width="44" height="36" rx="18" fill="currentColor"/>
        <path d="M84 70 q4 4 8 0" fill="none" stroke="#1C1B26" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M100 70 q4 4 8 0" fill="none" stroke="#1C1B26" stroke-width="2.2" stroke-linecap="round"/>
        <ellipse cx="96" cy="80" rx="11" ry="7.5" fill="#F4F5FB" opacity=".88"/>
        <circle cx="96" cy="81" r="2" fill="#F59E0B" opacity=".65"/>
        <!-- 弯月与 Zzz -->
        <path d="M30 28 a10 10 0 1 0 12 12 a8 8 0 1 1 -12 -12 z" fill="#F59E0B" opacity=".85"/>
        <text x="110" y="44" font-family="system-ui,sans-serif" font-size="16" font-weight="800" fill="currentColor">Z</text>
        <text x="123" y="30" font-family="system-ui,sans-serif" font-size="13" font-weight="800" fill="#F59E0B" opacity=".85">z</text>
        <text x="132" y="18" font-family="system-ui,sans-serif" font-size="10" font-weight="700" fill="currentColor" opacity=".55">z</text>
    </g>`,

    // 5. 驮箱搬运：背负暖橘知识宝箱与卷轴（绑带+锁扣细节）
    carry: `${SHADOW}
        <!-- 背部知识宝箱 -->
        <g>
            <rect x="43" y="34" width="58" height="32" rx="7" fill="#F59E0B"/>
            <rect x="43" y="34" width="58" height="11" rx="5" fill="#D97706"/>
            <rect x="68" y="41" width="8" height="10" rx="2.5" fill="#F4F5FB"/>
            <circle cx="72" cy="46" r="1.6" fill="#1C1B26"/>
        </g>
        ${BODY(`<rect x="69" y="60" width="6" height="44" fill="#D97706" opacity=".45"/>`)}
        ${LEGS("carry")}
        ${HEAD()}`,

    // 6. 低调探头：沿口探出驴头与扒边前蹄（空态 / 面板底部彩蛋，永不剧透内容）
    peek: `<g>
        <rect x="8" y="94" width="128" height="16" rx="8" fill="currentColor" opacity=".18"/>
        <rect x="8" y="94" width="128" height="4" rx="2" fill="currentColor" opacity=".3"/>
        <rect x="46" y="58" width="52" height="42" rx="20" fill="currentColor"/>
        <rect x="52" y="86" width="10" height="12" rx="5" fill="currentColor"/>
        <rect x="82" y="86" width="10" height="12" rx="5" fill="currentColor"/>
        ${HEAD()}
    </g>
    <path d="M124 26 l2 4.5 l4.5 2 l-4.5 2 l-2 4.5 l-2 -4.5 l-4.5 -2 l4.5 -2 z" fill="#F59E0B" opacity=".8"/>
    <circle cx="20" cy="40" r="2.5" fill="currentColor" opacity=".5"/>`,

    // 7. 沉思求解：头顶思考气泡与问号（AI 伴读 / Socratic 追问微状态）
    think: `${SHADOW}
        ${BODY()}
        ${LEGS("think")}
        ${HEAD({
            extra: `<circle cx="114" cy="16" r="8" fill="none" stroke="currentColor" stroke-width="2.4" opacity=".85"/>
                <text x="114" y="21" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" font-weight="800" fill="#F59E0B">?</text>
                <circle cx="103" cy="28" r="3.2" fill="currentColor" opacity=".5"/>
                <circle cx="96" cy="36" r="2" fill="currentColor" opacity=".3"/>`,
        })}`,

    // 8. 奔跑冲刺：四蹄飞奔 + 暖橘速度线与尘土（进度条随行微伴侣）
    run: `<ellipse cx="84" cy="118" rx="36" ry="5" fill="currentColor" opacity=".1"/>
        <path d="M6 56 H32" stroke="#F59E0B" stroke-width="4.5" stroke-linecap="round" opacity=".8"/>
        <path d="M2 72 H26" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity=".4"/>
        <path d="M10 88 H30" stroke="#F59E0B" stroke-width="3.5" stroke-linecap="round" opacity=".5"/>
        ${BODY()}
        <g transform="rotate(-34 94 78)"><rect x="90" y="60" width="11" height="27" rx="5.5" fill="currentColor"/></g>
        <g transform="rotate(-12 76 82)"><rect x="72" y="66" width="11" height="25" rx="5.5" fill="currentColor"/></g>
        <g transform="rotate(26 52 80)"><rect x="46" y="64" width="11" height="27" rx="5.5" fill="currentColor"/></g>
        <g transform="rotate(10 66 84)"><rect x="60" y="70" width="11" height="25" rx="5.5" fill="currentColor"/></g>
        ${HEAD()}
        <circle cx="26" cy="108" r="4" fill="currentColor" opacity=".2"/>
        <circle cx="15" cy="113" r="2.6" fill="currentColor" opacity=".14"/>`,

    // 9. 静读时光：身前摊开双页书卷（拾遗渐进阅读 / 沉浸模式微伴侣）
    read: `${SHADOW}
        ${BODY()}
        ${LEGS("read")}
        ${HEAD()}
        <g transform="translate(0, 3)">
            <path d="M42 66 Q57 59 72 66 Q87 59 102 66 L102 94 Q87 101 72 94 Q57 101 42 94 Z" fill="#F4F5FB" stroke="currentColor" stroke-width="2.4"/>
            <path d="M72 66 L72 94" stroke="currentColor" stroke-width="2" opacity=".55"/>
            <path d="M50 74 H64" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>
            <path d="M50 81 H64" stroke="#F59E0B" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>
            <path d="M80 74 H94" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>
            <path d="M80 81 H94" stroke="#F59E0B" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>
        </g>`,

    // 10. 比心收藏：弯月笑眼 + 上扬双蹄 + 悬浮红心（收藏 / 点赞时刻）
    heart: `${SHADOW}
        ${BODY(`<g transform="rotate(-42 36 68)"><rect x="18" y="42" width="11" height="26" rx="5.5" fill="currentColor"/></g>
                <g transform="rotate(42 108 68)"><rect x="115" y="42" width="11" height="26" rx="5.5" fill="currentColor"/></g>`)}
        ${LEGS("heart")}
        ${HEAD({ happyEyes: true })}
        <path d="M110 30 C113.5 22 126 23.5 126 32 C126 39.5 118 44.5 110 50 C102 44.5 94 39.5 94 32 C94 23.5 106.5 22 110 30 Z" fill="#E5484D"/>
        <path d="M28 24 l1.8 4 l4 1.8 l-4 1.8 l-1.8 4 l-1.8 -4 l-4 -1.8 l4 -1.8 z" fill="#F59E0B"/>
        <circle cx="24" cy="44" r="2.6" fill="#E5484D" opacity=".7"/>`,

    // 11. 小憩咖啡：弯月笑眼 + 悬浮拿铁与袅袅热气（番茄钟休息 / 完成一轮微状态）
    rest: `${SHADOW}
        ${BODY()}
        ${LEGS("rest")}
        ${HEAD({ happyEyes: true })}
        <g>
            <path d="M112 62 q3 -5 0 -9 M119 64 q3 -6 0 -11" fill="none" stroke="#F59E0B" stroke-width="2.2" stroke-linecap="round" opacity=".75"/>
            <rect x="104" y="68" width="22" height="16" rx="4.5" fill="#F4F5FB" stroke="currentColor" stroke-width="2.2"/>
            <path d="M126 72 q9 1.5 0 9" fill="none" stroke="currentColor" stroke-width="2.2"/>
            <rect x="106" y="70" width="9" height="3" rx="1.5" fill="#D97706" opacity=".8"/>
        </g>
        <circle cx="30" cy="26" r="2.5" fill="currentColor" opacity=".5"/>`,

    // 13. 校对达成：弯月笑眼 + 翠绿对勾圆盾（备份完成 / 同步校验 / 清单勾选）
    check: `${SHADOW}
        ${BODY()}
        ${LEGS("check")}
        ${HEAD({ happyEyes: true })}
        <circle cx="116" cy="30" r="15" fill="#2F9E68"/>
        <path d="M108 30 l6 6 l11 -13" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M22 26 l1.8 4 l4 1.8 l-4 1.8 l-1.8 4 l-1.8 -4 l-4 -1.8 l4 -1.8 z" fill="#F59E0B"/>`,

    // 14. 同步流转：环形双弧箭头（灾备同步 / 多端流转中微状态）
    sync: `${SHADOW}
        ${BODY()}
        ${LEGS("sync")}
        ${HEAD()}
        <g stroke="currentColor" stroke-width="3.2" fill="none" stroke-linecap="round" opacity=".85">
            <path d="M126 20 a10 10 0 0 0 -14 4"/>
            <path d="M112 40 a10 10 0 0 0 14 -4"/>
        </g>
        <path d="M110 24 l2 -8 l7 5 z" fill="#F59E0B"/>
        <path d="M128 36 l-2 8 l-7 -5 z" fill="#F59E0B"/>`,

    // 15. 警觉提醒：圆睁眼 + 红色感叹圆牌（冲突待处理 / 额度告急 / 锁降级提示）
    alert: `${SHADOW}
        ${BODY()}
        ${LEGS("alert")}
        ${HEAD()}
        <circle cx="118" cy="24" r="13" fill="#E5484D"/>
        <rect x="115.5" y="16.5" width="5" height="10" rx="2.5" fill="#FFFFFF"/>
        <circle cx="118" cy="31" r="2.6" fill="#FFFFFF"/>
        <path d="M22 30 l1.8 4 l4 1.8 l-4 1.8 l-1.8 4 l-1.8 -4 l-4 -1.8 l4 -1.8 z" fill="#F59E0B"/>`,

    // 16. 灵光一现：暖橘灯泡与三线光芒（AI 洞察就绪 / 灵感捕捉时刻）
    idea: `${SHADOW}
        ${BODY()}
        ${LEGS("idea")}
        ${HEAD({ happyEyes: true })}
        <g stroke="#F59E0B" stroke-width="2.4" stroke-linecap="round" opacity=".8">
            <line x1="118" y1="8" x2="118" y2="13"/>
            <line x1="106" y1="13" x2="109" y2="17"/>
            <line x1="130" y1="13" x2="127" y2="17"/>
        </g>
        <circle cx="118" cy="26" r="10" fill="#F59E0B"/>
        <rect x="114" y="36" width="8" height="6" rx="2.5" fill="#D97706"/>
        <path d="M115 34.5 h6" stroke="#D97706" stroke-width="2" stroke-linecap="round"/>`,

    // 17. 执笔记录：斜握钢笔与双行手稿线（拾遗摘录 / 日记落笔 / 批注中）
    write: `${SHADOW}
        ${BODY()}
        ${LEGS("write")}
        ${HEAD()}
        <g transform="rotate(40 112 58)">
            <rect x="108" y="34" width="8" height="34" rx="4" fill="#F59E0B"/>
            <rect x="108" y="34" width="8" height="9" rx="4" fill="#1C1B26" opacity=".5"/>
            <path d="M112 68 l-2 6 l6 -3 z" fill="#1C1B26" opacity=".7"/>
        </g>
        <path d="M84 92 h44" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".45"/>
        <path d="M90 99 h30" stroke="#F59E0B" stroke-width="3" stroke-linecap="round" opacity=".6"/>`,

    // 18. 侦查检索：放大镜与琥珀透镜（万物穿透搜索 / Omnisearch 微伴侣）
    search: `${SHADOW}
        ${BODY()}
        ${LEGS("search")}
        ${HEAD()}
        <circle cx="114" cy="26" r="10" fill="#F59E0B" opacity=".14"/>
        <circle cx="114" cy="26" r="10" fill="none" stroke="currentColor" stroke-width="3.6"/>
        <path d="M122 34 l9 9" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M24 30 l1.8 4 l4 1.8 l-4 1.8 l-1.8 4 l-1.8 -4 l-4 -1.8 l4 -1.8 z" fill="#F59E0B"/>`,

    // 12. 头像微章：纯驴头特写，紧凑视箱（16~28px 徽章 / 分区标题角标）
    head: `${HEAD()}`,
};

/** 特殊姿态视箱（head 收紧画布，微尺寸下更饱满） */
const POSE_VIEWBOX: Partial<Record<LvMascotPose, string>> = {
    head: "34 0 76 70",
};

/**
 * 生成吉祥物 SVG（内联字符串，currentColor 可主题化）。
 * @param pose 姿态：wave 迎新 / study 学习 / celebrate 庆祝 / sleep 睡觉 / carry 驮箱
 * @param opts.class 附加类名（如 lvx-mascot--anim 启用装饰动效，受偏好门控）
 */
export function lvMascot(pose: LvMascotPose, opts?: { class?: string; size?: number }): string {
    const body = POSE_SVGS[pose] ?? POSE_SVGS.wave;
    const cls = opts?.class ? ` ${opts.class}` : "";
    const vb = POSE_VIEWBOX[pose] ?? "0 0 144 128";
    let dim = 'width="96" height="85"';
    if (opts?.size && opts.size > 0) {
        const parts = vb.split(" ").map(Number);
        const vw = parts[2] ?? 144;
        const vh = parts[3] ?? 128;
        dim = ` width="${opts.size}" height="${Math.round((opts.size * vh) / vw)}"`;
    }
    return `<svg class="lvx-mascot${cls}" viewBox="${vb}" ${dim} role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

/**
 * 偏好门控：读取 data-lv-mascot（与 lv-ui-prefs 的 LV_MASCOT_ATTR 契约一致，硬编码避免循环依赖）。
 * 缺省视为开启；document 不可用（Node 单测环境）返回 false，微形态 API 自然降级为空壳。
 */
export function isLvMascotEnabled(): boolean {
    try {
        if (typeof document === "undefined") return false;
        return document.documentElement.getAttribute("data-lv-mascot") !== "off";
    } catch {
        return true;
    }
}

/**
 * 微形态 SVG 字符串：16~36px 低调尺寸（默认 20px）。
 * 呼吸动效 breath 受偏好与系统减弱动效双门控；仅装饰，读屏不可见。
 */
export function lvMascotMini(
    pose: LvMascotPose,
    opts?: { size?: number; breath?: boolean; class?: string },
): string {
    const size = opts?.size ?? 20;
    const extra = [
        "lvx-mascot--mini",
        opts?.breath ? "lvx-mascot--breath" : "",
        opts?.class || "",
    ].filter(Boolean).join(" ");
    return lvMascot(pose, { class: extra, size });
}

/**
 * 低调徽章：行内微驴（标题栏 / Chip / 分区头角标）。
 * 纪律：pointer-events:none 永不拦截交互；关闭 mascot 偏好时返回空壳（零占位）。
 */
export function lvMascotBadge(
    pose: LvMascotPose,
    opts?: { size?: number; breath?: boolean; class?: string },
): HTMLSpanElement {
    const span = document.createElement("span");
    span.setAttribute("aria-hidden", "true");
    span.style.cssText = "display:inline-flex;align-items:center;justify-content:center;line-height:0;pointer-events:none;flex-shrink:0;";
    if (isLvMascotEnabled()) {
        span.innerHTML = lvMascotMini(pose, opts);
    }
    return span;
}

/**
 * 静谧空态：微驴 + 弱化文案（列表 / 队列空态低调陪伴）。
 * 关闭 mascot 偏好时仅保留文案层，布局节奏不变。
 */
export function lvMascotEmpty(
    pose: LvMascotPose,
    opts: { title: string; hint?: string; size?: number },
): HTMLDivElement {
    const root = document.createElement("div");
    root.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;max-width:340px;margin:0 auto;padding:18px 12px;text-align:center;user-select:none;";
    if (isLvMascotEnabled()) {
        const holder = document.createElement("div");
        holder.setAttribute("aria-hidden", "true");
        holder.style.cssText = "line-height:0;pointer-events:none;";
        holder.innerHTML = lvMascotMini(pose, { size: opts.size ?? 36, breath: true });
        root.appendChild(holder);
    }
    const t = document.createElement("div");
    t.style.cssText = "font-size:12px;font-weight:600;color:var(--lvx-text-muted,rgba(38,38,46,.64));";
    t.textContent = opts.title;
    root.appendChild(t);
    if (opts.hint) {
        const h = document.createElement("div");
        h.style.cssText = "font-size:11px;color:var(--lvx-text-faint,rgba(38,38,46,.44));line-height:1.5;";
        h.textContent = opts.hint;
        root.appendChild(h);
    }
    return root;
}

/**
 * 进度随行者：18px 奔跑小驴骑在调用方进度条上沿（容器需 position:relative）。
 * setProgress(0~100) 自动钳制；关闭 mascot 偏好时空壳不出现，进度条本体不受影响。
 */
export function lvMascotWalker(opts?: { pose?: LvMascotPose; size?: number }): {
    el: HTMLSpanElement;
    setProgress: (pct: number) => void;
} {
    const el = document.createElement("span");
    el.className = "lvx-mascot-walker";
    el.setAttribute("aria-hidden", "true");
    if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) {
        el.style.transition = "none";
    }
    if (isLvMascotEnabled()) {
        el.innerHTML = lvMascotMini(opts?.pose ?? "run", { size: opts?.size ?? 18, breath: true });
    }
    return {
        el,
        setProgress(pct: number) {
            const v = Math.max(0, Math.min(100, Number(pct) || 0));
            el.style.left = `${Math.round(v * 10) / 10}%`;
        },
    };
}

/**
 * 幽默角落探头：面板/抽屉/卡片右下或右上角的极低调微探头（默认 28px，opacity 0.28，永不拦截点击）。
 */
export function lvMascotCornerPeek(opts?: { position?: "bottom-right" | "top-right"; pose?: LvMascotPose; size?: number }): HTMLDivElement {
    const el = document.createElement("div");
    el.setAttribute("aria-hidden", "true");
    const pos = opts?.position ?? "bottom-right";
    const isBottom = pos === "bottom-right";
    el.style.cssText = `position:absolute;${isBottom ? "bottom:2px" : "top:2px"};right:4px;line-height:0;pointer-events:none;opacity:0.28;transition:opacity .2s ease;z-index:1;`;
    if (isLvMascotEnabled()) {
        el.innerHTML = lvMascotMini(opts?.pose ?? "peek", { size: opts?.size ?? 28 });
    }
    return el;
}

/**
 * 柔和伴读行内提示：小驴微头像 + 亲切辅助建议文案（比 Alert 更轻量，适用于学习/习惯建议）。
 */
export function lvMascotInlineTip(opts: { message: string; submessage?: string; pose?: LvMascotPose }): HTMLDivElement {
    const root = document.createElement("div");
    root.setAttribute("role", "note");
    root.style.cssText = "display:flex;align-items:flex-start;gap:8px;padding:8px 12px;border-radius:var(--lvx-r-md,12px);background:var(--lvx-brand-tint,rgba(106,110,224,0.1));border:1px solid color-mix(in srgb,var(--lvx-brand,#6a6ee0) 18%,transparent);color:var(--lvx-text,#26262e);font-size:12px;line-height:1.5;width:100%;box-sizing:border-box;";
    if (isLvMascotEnabled()) {
        const iconWrap = document.createElement("span");
        iconWrap.setAttribute("aria-hidden", "true");
        iconWrap.style.cssText = "line-height:0;pointer-events:none;flex-shrink:0;margin-top:2px;";
        iconWrap.innerHTML = lvMascotMini(opts.pose ?? "idea", { size: 20 });
        root.appendChild(iconWrap);
    }
    const textWrap = document.createElement("div");
    textWrap.style.cssText = "flex:1;min-width:0;word-break:break-word;";
    const m = document.createElement("div");
    m.style.cssText = "font-weight:600;color:var(--lvx-brand,#6a6ee0);";
    m.textContent = opts.message;
    textWrap.appendChild(m);
    if (opts.submessage) {
        const sub = document.createElement("div");
        sub.style.cssText = "font-size:11px;color:var(--lvx-text-muted,rgba(38,38,46,0.65));margin-top:2px;";
        sub.textContent = opts.submessage;
        textWrap.appendChild(sub);
    }
    root.appendChild(textWrap);
    return root;
}

/** 吉祥物配套样式（一次性注入；随 lv-ui.ts 的 ensureLvUiStyles 一并挂载） */
export const LV_MASCOT_CSS = `
[data-lv-ui] .lvx-mascot{color:var(--lvx-brand,#6A6EE0);display:block;filter:drop-shadow(0 4px 10px rgba(106,110,224,.14));}
[data-lv-ui] .lvx-mascot--anim{animation:lvx-mascot-bounce 3.4s cubic-bezier(.4,0,.2,1) infinite;}
@keyframes lvx-mascot-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
/* 吉祥物动画 = 装饰动效：跟随偏好总闸与系统减弱动效 */
[data-lv-motion="minimal"] [data-lv-ui] .lvx-mascot--anim,[data-lv-motion="off"] [data-lv-ui] .lvx-mascot--anim{animation:none;}
@media (prefers-reduced-motion: reduce){[data-lv-ui] .lvx-mascot--anim{animation:none;}}
/* 微形态：低调常驻、永不拦截指针；呼吸动效同样受偏好与系统减弱动效门控 */
[data-lv-ui] .lvx-mascot--mini{pointer-events:none;opacity:.92;filter:none;}
[data-lv-ui] .lvx-mascot--breath{animation:lvx-mascot-breath 3.4s ease-in-out infinite;}
@keyframes lvx-mascot-breath{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.5px)}}
[data-lv-ui] .lvx-mascot-walker{position:absolute;bottom:calc(100% - 2px);transform:translateX(-50%);pointer-events:none;line-height:0;transition:left .45s cubic-bezier(.16,1,.3,1);z-index:2;}
[data-lv-motion="minimal"] [data-lv-ui] .lvx-mascot--breath,[data-lv-motion="off"] [data-lv-ui] .lvx-mascot--breath{animation:none;}
@media (prefers-reduced-motion: reduce){[data-lv-ui] .lvx-mascot--breath{animation:none;}}
`;

/** 一次性注入吉祥物配套样式（幂等；与 lv-ui.ts 注入互不依赖） */
export function ensureLvMascotStyles(): void {
    try {
        if (typeof document === "undefined") return;
        if (document.getElementById("lv-mascot-styles")) return;
        const style = document.createElement("style");
        style.id = "lv-mascot-styles";
        style.textContent = LV_MASCOT_CSS;
        (document.head || document.documentElement).appendChild(style);
    } catch {
        // ignore
    }
}

// 模块导入即注入
if (typeof document !== "undefined") {
    ensureLvMascotStyles();
}
