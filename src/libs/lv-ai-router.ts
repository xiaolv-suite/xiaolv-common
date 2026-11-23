/**
 * 小驴全生态 AI 智能调度中枢 · 标准核心套件 (Lv Ecosystem AI Router Kit)
 * Epoch 8 Standard · Protocol v1.2.0 (Phase 3: 5-Tier Adaptive AI Router)
 *
 * 核心设计哲学：
 * 1. 五级自适应瀑布降级（思源智能体 -> 用户Key -> 本地Ollama -> 免密公用池 -> 本地规则兜底）；
 * 2. 纯本地 PII 隐私脱敏护盾：外发前在纯本地抹除身份证、手机号、密码、Key 等敏感数据；
 * 3. LRU 内存响应缓存：相同输入 30 分钟内 0ms 瞬间命中返回；
 * 4. 健壮 JSON 容错解析：自动清洗 Markdown 代码块及尾随逗号；
 * 5. 跨端统一异常与全生命周期降级追踪 (fallbackHistory)；
 * 6. 零外部 npm 依赖：单个独立 .ts 文件，复制即可在任何小驴插件内使用。
 */

/* ========================================================================= */
/* 1. 类型契约定义 (Type Contracts)                                          */
/* ========================================================================= */

export type AiProviderType =
    | "siyuan"          // 思源内核已配置智能体 (/api/ai/chat)
    | "user_custom"     // 用户在插件设置中自配的 OpenAI 格式 API Key
    | "ollama"          // 本机已运行的 Ollama (http://127.0.0.1:11434)
    | "public_free"     // 公开免费通道 (如 Pollinations.ai / 小驴官方免密公用池)
    | "rule_fallback";  // 本地轻量规则与启发式离线兜底

export type AiTaskType =
    | "chat"            // 通用问答与对话
    | "question_gen"    // 闪卡/试题拟题
    | "extract"         // 实体与参数提取（如打卡意图、证照字段）
    | "summary"         // 长文摘要与大纲提炼
    | "format"          // 排版与文本清洗
    | "socratic";       // 苏格拉底启发式答疑

export interface AiChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface AiChatPayload {
    messages: AiChatMessage[];
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    onChunk?: (chunk: string) => void;
    timeoutMs?: number;
    taskType?: AiTaskType;
    /** 用户或调用方指定首选通道（可选，若不指定则自动按最优层级瀑布降级） */
    preferredProvider?: AiProviderType;
}

export interface AiChatResult {
    ok: boolean;
    content: string;
    provider: AiProviderType;
    model: string;
    latencyMs: number;
    error?: string;
    /** 是否经历了降级重试及详细链路日志 */
    fallbackHistory?: Array<{ provider: AiProviderType; error: string; latencyMs: number }>;
}

export interface UserCustomConfig {
    enabled?: boolean;
    baseUrl?: string;    // 如 "https://api.siliconflow.cn/v1" 或 "https://api.deepseek.com/v1"
    apiKey?: string;
    model?: string;      // 如 "Qwen/Qwen2.5-7B-Instruct" 或 "deepseek-chat"
}

export interface OllamaConfig {
    enabled?: boolean;
    baseUrl?: string;    // 默认 "http://127.0.0.1:11434"
    model?: string;      // 默认自动嗅探已安装的模型（如 qwen2.5:7b / llama3）
}

export interface PublicFreeConfig {
    enabled?: boolean;
    endpoint?: string;   // 默认 "https://text.pollinations.ai/"
    fallbackModel?: string;
}

export interface AiRouterConfig {
    /** 是否启用思源内核智能体探测（默认 true） */
    enableSiyuan?: boolean;
    /** 用户自填配置 */
    userCustom?: UserCustomConfig;
    /** 本地 Ollama 配置 */
    ollama?: OllamaConfig;
    /** 公开免费通道配置 */
    publicFree?: PublicFreeConfig;
    /** 是否启用离线规则兜底（默认 true，确保系统永不白屏报错） */
    enableRuleFallback?: boolean;
    /** 单级超时时间（毫秒，默认 12000） */
    defaultTimeoutMs?: number;
    /** 整体多级瀑布总超时时间（毫秒，默认 25000） */
    maxTotalTimeoutMs?: number;
}

/* ------------------------------------------------------------------------- */
/* 1.1 推荐厂商与分级说明元数据契约 (Referrals & Tier Metadata)               */
/* ------------------------------------------------------------------------- */

export interface AiVendorReferral {
    id: string;
    name: string;
    shortName: string;
    tagline: string;
    freeQuotaHint: string;
    costHint: string;
    badgeText?: string;
    badgeColor?: string;
    baseUrl: string;
    defaultModel: string;
    recommendedModels: string[];
    /** 邀请/推荐注册链接；若为空字符则在界面上隐藏跳转按钮 */
    referralUrl?: string;
    /** 官方文档或控制台链接 */
    officialUrl?: string;
    features: string[];
}

export interface AiTierDescription {
    tier: 1 | 2 | 3 | 4 | 5;
    provider: AiProviderType;
    title: string;
    shortTitle: string;
    icon: string;
    themeColor: string;
    costText: string;
    costTag: string;
    privacyText: string;
    privacyTag: string;
    description: string;
    bestFor: string;
    setupGuide: string;
}

export interface TierProbeResult {
    provider: AiProviderType;
    tier: 1 | 2 | 3 | 4 | 5;
    tierName: string;
    ok: boolean;
    latencyMs: number;
    model?: string;
    error?: string;
    statusText: string;
}

/**
 * 推荐厂商注册表：预留 SiliconFlow/DeepSeek/Bailian/Zhipu/Moonshot/OpenRouter/Groq
 * 严格遵循：referralUrl 为空则隐藏注册跳转按钮
 */
export const AI_PROVIDER_REFERRALS: AiVendorReferral[] = [
    {
        id: "siliconflow",
        name: "硅基流动 (SiliconFlow)",
        shortName: "硅基流动",
        tagline: "国产高可用云端中转 · 极低门槛与丰富前沿模型",
        freeQuotaHint: "🎁 注册即送 2000 万 Token (¥14 额度)",
        costHint: "免费额度极充裕 · 赠额耗尽后极低成本 (约 ¥0.001/千字)",
        badgeText: "重点推荐",
        badgeColor: "#10b981",
        baseUrl: "https://api.siliconflow.cn/v1",
        defaultModel: "deepseek-ai/DeepSeek-V3",
        recommendedModels: [
            "deepseek-ai/DeepSeek-V3",
            "deepseek-ai/DeepSeek-R1",
            "Qwen/Qwen2.5-7B-Instruct",
            "THUDM/glm-4-9b-chat",
        ],
        referralUrl: "https://cloud.siliconflow.cn/i/eFm443fW",
        officialUrl: "https://siliconflow.cn/",
        features: [
            "注册即送 ¥14 / 2000万 Token 体验金",
            "DeepSeek-V3 / R1 满血版极速直连",
            "标准 OpenAI 协议无缝兼容",
            "千兆骨干专线，平均延迟仅两三百毫秒",
        ],
    },
    {
        id: "deepseek",
        name: "DeepSeek 官方开放平台",
        shortName: "DeepSeek",
        tagline: "开源之光 · 业界顶尖推理模型与极致性价比",
        freeQuotaHint: "新用户注册绑定即送 500 万 Token 体验包",
        costHint: "价格极度亲民 (输入仅 ¥1/M · 输出 ¥2/M)",
        badgeText: "旗舰推理",
        badgeColor: "#3b82f6",
        baseUrl: "https://api.deepseek.com/v1",
        defaultModel: "deepseek-chat",
        recommendedModels: ["deepseek-chat", "deepseek-reasoner"],
        referralUrl: "",
        officialUrl: "https://platform.deepseek.com/",
        features: [
            "DeepSeek-V3 全能大模型",
            "DeepSeek-R1 深度长思维链",
            "命中上下文缓存享 1 折优惠",
            "官方原生直连 API 端点",
        ],
    },
    {
        id: "bailian",
        name: "阿里云百炼 (通义千问)",
        shortName: "阿里百炼",
        tagline: "企业级安全合规 · 阿里通义主力大模型集群",
        freeQuotaHint: "新开通百炼赠送千问主力模型 100~400 万免费 Token",
        costHint: "按量计费 · 阿里云基础设施稳定不丢包",
        badgeText: "企业级稳定",
        badgeColor: "#ff6a00",
        baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        defaultModel: "qwen-plus",
        recommendedModels: ["qwen-plus", "qwen-turbo", "qwen-max"],
        referralUrl: "",
        officialUrl: "https://bailian.console.aliyun.com/",
        features: [
            "阿里通义千问 2.5 旗舰集群",
            "OpenAI 兼容模式一键接入",
            "金融级安全合规与高可用保障",
            "大厂 SLA 服务保证不掉线",
        ],
    },
    {
        id: "zhipu",
        name: "智谱清言 (BigModel GLM)",
        shortName: "智谱清言",
        tagline: "清华自研基座 · 中文常识与语义结构化特化",
        freeQuotaHint: "新注册赠送 2500 万 Token 资源包",
        costHint: "GLM-4-Flash 个人开发者永久免费调用",
        badgeText: "中文特化",
        badgeColor: "#6366f1",
        baseUrl: "https://open.bigmodel.cn/api/paas/v4",
        defaultModel: "glm-4-flash",
        recommendedModels: ["glm-4-flash", "glm-4", "glm-4-air"],
        referralUrl: "",
        officialUrl: "https://open.bigmodel.cn/",
        features: [
            "GLM-4-Flash 个人永久免费",
            "中文语境与知识结构化出色",
            "支持 Function Calling / 深度拟题",
        ],
    },
    {
        id: "moonshot",
        name: "月之暗面 Kimi (Moonshot)",
        shortName: "Kimi",
        tagline: "长文本理解先驱 · 超强长文摘要与考题拆解",
        freeQuotaHint: "新注册赠送 ¥15 开发者体验金",
        costHint: "长文本无损保持 · 阶梯式定价",
        badgeText: "长文专家",
        badgeColor: "#0ea5e9",
        baseUrl: "https://api.moonshot.cn/v1",
        defaultModel: "moonshot-v1-8k",
        recommendedModels: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
        referralUrl: "",
        officialUrl: "https://platform.moonshot.cn/",
        features: [
            "长达 128k/200k 超长上下文窗口",
            "复杂笔记与大纲无损保持记忆",
            "语义细节检索极其精准",
        ],
    },
    {
        id: "openrouter",
        name: "OpenRouter (全球模型聚合)",
        shortName: "OpenRouter",
        tagline: "一处配置 · 随心调用全球主流开源与商业大模型",
        freeQuotaHint: "内置数十款带有 :free 标签的永久 0 元开源模型",
        costHint: "按 Token 实际成本扣费 · 支持单 Key 路由多模型",
        badgeText: "全球聚合",
        badgeColor: "#8b5cf6",
        baseUrl: "https://openrouter.ai/api/v1",
        defaultModel: "meta-llama/llama-3.1-70b-instruct",
        recommendedModels: [
            "meta-llama/llama-3.1-70b-instruct",
            "google/gemini-flash-1.5",
            "mistralai/mistral-7b-instruct:free",
        ],
        referralUrl: "",
        officialUrl: "https://openrouter.ai/",
        features: [
            "聚合 Claude/GPT-4o/Llama/Gemini 全球模型",
            "数十款 :free 社区开源模型 0 元免充值",
            "统一 OpenAI 标准格式请求",
        ],
    },
    {
        id: "groq",
        name: "Groq (极速推理引擎)",
        shortName: "Groq",
        tagline: "专用 LPU 硬件芯片 · 体验每秒 500+ 字闪电响应",
        freeQuotaHint: "免费版提供充足的每分钟请求限制 (RPM/RPD)",
        costHint: "超高吞吐 · 拟题与打卡闪念几乎 0 延迟秒出",
        badgeText: "毫秒极速",
        badgeColor: "#f43f5e",
        baseUrl: "https://api.groq.com/openai/v1",
        defaultModel: "llama-3.3-70b-versatile",
        recommendedModels: [
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "mixtral-8x7b-32768",
        ],
        referralUrl: "",
        officialUrl: "https://console.groq.com/",
        features: [
            "专用 LPU 芯片架构，500+ Token/s",
            "流式输出几近无感知延迟",
            "免费配额充裕，适合高速高频拟题",
        ],
    },
];

/**
 * 五级自适应瀑布降级分级元数据
 */
export const AI_TIER_DESCRIPTIONS: AiTierDescription[] = [
    {
        tier: 1,
        provider: "siyuan",
        title: "Tier 1: 思源内核智能体 (Kernel Agent)",
        shortTitle: "思源智能体",
        icon: "🟢",
        themeColor: "#10b981",
        costTag: "由思源配置决定",
        costText: "由思源笔记「设置 ➔ 智能体」中的官方服务商或自定义配置计费，小驴套件不收取任何额外费用。",
        privacyTag: "思源内核代理",
        privacyText: "直接经由思源本地内核 `/api/ai/chat` 转发，与思源笔记官方隐私及安全策略完全一致。",
        description: "小驴全家桶无缝复用思源全局智能体配置，若您已在思源设置中配置了大模型，无需二次填写，自动优先调度。",
        bestFor: "已在思源笔记中配好 AI 智能体的用户，零多余配置开箱即用。",
        setupGuide: "在思源笔记主界面点击「设置」➔「智能体」启用并配置服务商即可。",
    },
    {
        tier: 2,
        provider: "user_custom",
        title: "Tier 2: 用户自配商用 API (OpenAI 协议)",
        shortTitle: "自配商用 Key",
        icon: "🔵",
        themeColor: "#3b82f6",
        costTag: "低至 ¥0.001/千字 · 赠海量额度",
        costText: "硅基流动/百炼/智谱等主流平台新用户注册即赠送数百万至两千万 Token，耗尽后极低成本按量扣费。",
        privacyTag: "客户端直连 · 本地脱敏",
        privacyText: "直连模型官方端点，绝无第三方中间服务截留；外发前纯本地执行 PII 隐私脱敏护盾清洗敏感信息。",
        description: "最高质量与最快响应首选！支持 DeepSeek-V3/R1、Qwen2.5 等业界前沿大模型，拟题质量与逻辑深度最佳。",
        bestFor: "追求题目拟制质量、高深度思维链反思与极致稳定性的日常高频用户。",
        setupGuide: "在下方推荐厂商列表中点击「一键填入」，然后填写您在该平台申请的 API Key 即可。",
    },
    {
        tier: 3,
        provider: "ollama",
        title: "Tier 3: 本地 Ollama 离线推理 (物理级绝对隐私)",
        shortTitle: "本地 Ollama",
        icon: "🟣",
        themeColor: "#8b5cf6",
        costTag: "0 元永久免费",
        costText: "完全基于个人电脑显卡或 CPU 算力运行，无任何调用次数或 Token 消费限制。",
        privacyTag: "100% 物理级绝对隐私",
        privacyText: "数据永不出本地物理设备！纯离线局域推理，绝无任何外网传输风险。",
        description: "自动感知本地已启动的 Ollama 守护进程 (默认 http://127.0.0.1:11434)，智能选取本机已下载的最优模型。",
        bestFor: "断网离线环境、高度敏感个人笔记与重视数据主权的极客用户。",
        setupGuide: "访问 https://ollama.com 安装后执行 ollama run qwen2.5:7b，小驴将自动即时感知。",
    },
    {
        tier: 4,
        provider: "public_free",
        title: "Tier 4: 公开免密免费通道 (0 元免配置)",
        shortTitle: "免费公用池",
        icon: "🌐",
        themeColor: "#f59e0b",
        costTag: "0 元免密即用",
        costText: "无需注册、无需绑定信用卡、无需填写任何 Key，小驴官方公用算力池与全球免密通道开箱即用。",
        privacyTag: "强制前置 PII 隐私脱敏",
        privacyText: "🛡️ 客户端强制过滤！外发前在浏览器内存自动剔除人名、电话、邮箱、身份证与私密数字。",
        description: "即插即用的轻量推理通道，为新手提供零门槛快速体验，自动保障日常简单拟题与分类。",
        bestFor: "刚刚安装插件的新手、不想折腾 API 账号的轻量体验用户。",
        setupGuide: "默认已启用，在上方首选模式选择「五级自适应瀑布流」即可随时兜底。",
    },
    {
        tier: 5,
        provider: "rule_fallback",
        title: "Tier 5: 本地规则离线兜底 (Heuristic Fallback)",
        shortTitle: "离线规则兜底",
        icon: "⚡",
        themeColor: "#ec4899",
        costTag: "0 成本 · 0 延迟",
        costText: "纯前端 TypeScript 内置启发式语法分析器与反思模板，不消耗任何外部资源与网络流量。",
        privacyTag: "100% 纯内存本地",
        privacyText: "完全在本地浏览器内存中运行，不发起任何 HTTP 网络请求。",
        description: "终极可靠性保护伞！当网络中断、API 欠费或超时时自动毫秒级接管，保障制卡与打卡解析绝不弹红报错。",
        bestFor: "全场景故障防线，保障系统高可用性永不宕机。",
        setupGuide: "系统内嵌守护，无需任何配置，自动默默守护。",
    },
];

/**
 * 安全呼起外部链接（优先通过 Electron shell.openExternal，降级使用 window.open）
 */
export function openExternalUrl(url: string): void {
    if (!url) return;
    let launched = false;
    try {
        let electron: any = null;
        const globalReq = typeof window !== "undefined"
            ? (window as any).require
            : (typeof globalThis !== "undefined" ? (globalThis as any).require : null);
        if (globalReq && typeof globalReq === "function") {
            try { electron = globalReq("electron"); } catch { /* ignore */ }
        }
        const shell = electron?.shell || ((window as any)?.require ? (window as any).require("electron")?.shell : null);
        if (shell && typeof shell.openExternal === "function") {
            shell.openExternal(url).catch(() => {
                if (typeof window !== "undefined") {
                    window.open(url, "_blank", "noopener,noreferrer");
                }
            });
            launched = true;
        }
    } catch {
        // ignore
    }
    if (!launched && typeof window !== "undefined") {
        try {
            window.open(url, "_blank", "noopener,noreferrer");
        } catch {
            // ignore
        }
    }
}

/* ========================================================================= */
/* 2. 隐私脱敏护盾 (Local PII Sanitizer)                                     */
/* ========================================================================= */

export interface PiiMaskOptions {
    maskIdCard?: boolean;
    maskPhone?: boolean;
    maskEmail?: boolean;
    maskKeys?: boolean;
    maskBankCard?: boolean;
}

const DEFAULT_PII_OPTIONS: PiiMaskOptions = {
    maskIdCard: true,
    maskPhone: true,
    maskEmail: true,
    maskKeys: true,
    maskBankCard: true,
};

/**
 * 脱敏单段文本中的 PII 敏感信息（纯本地运行，不产生任何外发请求）
 */
export function maskPiiText(text: string, options: PiiMaskOptions = DEFAULT_PII_OPTIONS): string {
    if (!text || typeof text !== "string") return text;
    let out = text;

    // 1. 密钥与 Token (sk-... 或 ghp_... 或 Bearer ...)
    if (options.maskKeys) {
        out = out.replace(/\b(sk-[a-zA-Z0-9_-]{20,}|ghp_[a-zA-Z0-9]{30,}|Bearer\s+[a-zA-Z0-9._-]{20,})\b/g, "[KEY_REDACTED]");
    }

    // 2. 中国大陆 18 位身份证号码
    if (options.maskIdCard) {
        out = out.replace(/\b([1-9]\d{5})(?:18|19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])(\d{3}[\dXx])\b/g, "$1********$2");
    }

    // 3. 手机号码 (11 位)
    if (options.maskPhone) {
        out = out.replace(/(?<!\d)(1[3-9]\d)(\d{4})(\d{4})(?!\d)/g, "$1****$3");
    }

    // 4. 银行卡号 (16-19 位)
    if (options.maskBankCard) {
        out = out.replace(/(?<!\d)([4-6]\d{3})\s?(\d{4})\s?(\d{4})\s?(\d{4,7})(?!\d)/g, "$1 **** **** [BANK_CARD]");
    }

    // 5. 电子邮箱
    if (options.maskEmail) {
        out = out.replace(/\b([a-zA-Z0-9_.+-])[a-zA-Z0-9_.+-]*@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)\b/g, "$1***@$2");
    }

    return out;
}

/**
 * 对完整消息数组批量脱敏
 */
export function sanitizeMessages<T extends { role: string; content: string }>(
    messages: readonly T[],
    options: PiiMaskOptions = DEFAULT_PII_OPTIONS
): T[] {
    return messages.map((m) => ({
        ...m,
        content: maskPiiText(m.content, options),
    }));
}

/* ========================================================================= */
/* 3. 健壮 JSON 容错提取与解析器 (Robust JSON Cleaner)                        */
/* ========================================================================= */

/**
 * 从大模型可能带有 Markdown 代码块、前后说明文字或尾随逗号的原始响应中提取合规 JSON
 */
export function cleanAndParseJson<T = any>(rawText: string, fallback?: T): T {
    if (!rawText || typeof rawText !== "string") {
        if (fallback !== undefined) return fallback;
        throw new Error("JSON 输入为空");
    }

    let text = rawText.trim();

    // 1. 优先尝试直接原生解析
    try {
        return JSON.parse(text) as T;
    } catch { /* soft */ }

    // 2. 剥离 Markdown 代码块（如 ```json ... ``` 或 ``` ... ```）
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
        text = codeBlockMatch[1].trim();
        try {
            return JSON.parse(text) as T;
        } catch { /* soft */ }
    }

    // 3. 正则捕获最外层的 JSON 对象 {...} 或数组 [...]
    const objMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (objMatch && objMatch[1]) {
        text = objMatch[1].trim();
        try {
            return JSON.parse(text) as T;
        } catch {
            // 4. 修复对象或数组末尾尾随逗号 (Trailing comma fix)
            const noTrailingComma = text.replace(/,\s*([\]}])/g, "$1");
            try {
                return JSON.parse(noTrailingComma) as T;
            } catch { /* soft */ }
        }
    }

    if (fallback !== undefined) {
        return fallback;
    }

    throw new Error(`无法从大模型响应中解析合规 JSON: ${rawText.slice(0, 120)}...`);
}

/* ========================================================================= */
/* 4. LRU 内存响应缓存 (In-Memory Response Cache)                            */
/* ========================================================================= */

export interface CacheEntry {
    result: AiChatResult;
    expiresAt: number;
}

export class AiResponseCache {
    private maxEntries: number;
    private defaultTtlMs: number;
    private cache: Map<string, CacheEntry> = new Map();

    constructor(maxEntries = 200, defaultTtlMs = 1000 * 60 * 30) { // 默认 30 分钟缓存
        this.maxEntries = maxEntries;
        this.defaultTtlMs = defaultTtlMs;
    }

    /**
     * 生成请求缓存键 (FNV-1a 极速哈希)
     */
    static computeKey(taskType: string = "chat", messages: Array<{ role: string; content: string }>): string {
        const str = `${taskType}::` + messages.map((m) => `${m.role}:${m.content}`).join("||");
        let hash = 2166136261;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0).toString(36);
    }

    get(key: string): AiChatResult | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        // LRU 命中：移到最后
        this.cache.delete(key);
        this.cache.set(key, entry);
        return {
            ...entry.result,
            latencyMs: 0, // 缓存命中耗时标定为 0
        };
    }

    set(key: string, result: AiChatResult, ttlMs?: number): void {
        if (!result.ok) return; // 失败结果不进入缓存

        if (this.cache.size >= this.maxEntries) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey !== undefined) this.cache.delete(oldestKey);
        }

        const expiresAt = Date.now() + (ttlMs || this.defaultTtlMs);
        this.cache.set(key, { result, expiresAt });
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }
}

/* ========================================================================= */
/* 5. 流式响应解析器 (Stream Parser)                                         */
/* ========================================================================= */

export interface SseChunkHandler {
    (delta: string): void;
}

export function extractOpenAiDelta(line: string): string {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) return "";
    const rawJson = trimmed.slice(5).trim();
    if (rawJson === "[DONE]") return "";
    try {
        const parsed = JSON.parse(rawJson);
        return String(parsed?.choices?.[0]?.delta?.content || "");
    } catch {
        return "";
    }
}

export function extractOllamaDelta(line: string): string {
    const trimmed = line.trim();
    if (!trimmed) return "";
    try {
        const parsed = JSON.parse(trimmed);
        return String(parsed?.message?.content || parsed?.response || "");
    } catch {
        return "";
    }
}

export async function consumeStream(
    stream: any,
    extractor: (line: string) => string,
    onChunk?: SseChunkHandler
): Promise<string> {
    let fullText = "";
    if (!stream) return fullText;

    if (typeof stream.getReader === "function") {
        const reader = stream.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                const delta = extractor(line);
                if (delta) {
                    fullText += delta;
                    onChunk?.(delta);
                }
            }
        }
        if (buffer) {
            const delta = extractor(buffer);
            if (delta) {
                fullText += delta;
                onChunk?.(delta);
            }
        }
    }
    return fullText;
}

/* ========================================================================= */
/* 6. 五级自适应 Providers 实现                                              */
/* ========================================================================= */

function getSafeFetch(fetchFunc?: any): any {
    if (fetchFunc) return fetchFunc;
    if (typeof window !== "undefined" && typeof (window as any).fetch === "function") {
        return (window as any).fetch.bind(window);
    }
    if (typeof globalThis !== "undefined" && typeof (globalThis as any).fetch === "function") {
        return (globalThis as any).fetch.bind(globalThis);
    }
    return async () => { throw new Error("fetch is not available in current environment"); };
}

export interface SiyuanFetchFunc {
    (url: string, init?: RequestInit): Promise<Response>;
}

/**
 * 解析并提取思源内核 AI 智能体配置 (兼容 v3.8+ 多模型架构与 v3.0~v3.7 存量单配置架构)
 */
/** 2026-11-21 走查修复：AI 响应内容串化收敛。原 `String(data?.data?.content || data?.data || ...)`
 *  在 data.data 为无 content 字段的对象时输出 "[object Object]" 并被当作有效回复返回。 */
function pickAiResponseContent(data: any): string {
    const d = data?.data;
    if (typeof d === "string") return d;
    if (d && typeof d === "object" && typeof (d as any).content === "string") return (d as any).content;
    if (typeof data?.content === "string") return data.content;
    return "";
}

export function resolveSiyuanAiConfig(conf: any): {
    available: boolean;
    activeProvider?: any;
    activeModel?: string;
    isLegacy?: boolean;
} {
    const ai = conf?.ai;
    if (!ai) return { available: false };

    // 1. 优先探测思源 v3.8+ 新版多模型架构
    if (Array.isArray(ai.providers) && ai.providers.length > 0) {
        const targetModelId = ai.agent?.modelId || ai.editing?.modelId;
        let candidateProvider: any = null;
        let candidateModel = "";

        for (const p of ai.providers) {
            if (!p.enabled) continue;
            const models = Array.isArray(p.models) ? p.models : [];
            if (targetModelId) {
                const matched = models.find((m: any) => m.enabled && (m.id === targetModelId || m.name === targetModelId));
                if (matched) {
                    return {
                        available: true,
                        activeProvider: p,
                        activeModel: matched.displayName || matched.name,
                        isLegacy: false,
                    };
                }
            }
            if (!candidateProvider && models.some((m: any) => m.enabled)) {
                candidateProvider = p;
                const m = models.find((x: any) => x.enabled);
                candidateModel = m?.displayName || m?.name || "default";
            }
        }

        if (candidateProvider) {
            return {
                available: true,
                activeProvider: candidateProvider,
                activeModel: candidateModel,
                isLegacy: false,
            };
        }
    }

    // 2. 兼容思源 v3.0~v3.7 存量单配置架构
    if (ai.enable && (ai.apiKey || ai.apiProxy)) {
        return {
            available: true,
            activeModel: "siyuan-legacy-agent",
            isLegacy: true,
        };
    }

    return { available: false };
}

/**
 * Tier 1: 思源内核已配置智能体 Provider
 */
export class SiyuanAiProvider {
    private customFetch: SiyuanFetchFunc;

    constructor(fetchFunc?: SiyuanFetchFunc) {
        this.customFetch = getSafeFetch(fetchFunc);
    }

    async isAvailable(): Promise<boolean> {
        try {
            const resp = await this.customFetch("/api/system/getConf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            if (!resp.ok) return false;
            const resJson = await resp.json();
            return resolveSiyuanAiConfig(resJson?.data?.conf).available;
        } catch {
            return false;
        }
    }

    async probe(): Promise<{ available: boolean; activeModel: string; latencyMs: number; error?: string }> {
        const start = Date.now();
        try {
            const resp = await this.customFetch("/api/system/getConf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            if (!resp.ok) {
                return { available: false, activeModel: "", latencyMs: Date.now() - start, error: `getConf 响应异常: ${resp.status}` };
            }
            const resJson = await resp.json();
            const resolved = resolveSiyuanAiConfig(resJson?.data?.conf);
            if (!resolved.available) {
                return { available: false, activeModel: "", latencyMs: Date.now() - start, error: "思源中未启用智能体模型" };
            }

            const activeModel = resolved.activeModel || "siyuan-agent";

            // 优先使用思源 v3.8+ /api/ai/testModel 极速探针测试连通性
            if (resolved.activeProvider) {
                try {
                    const testResp = await this.customFetch("/api/ai/testModel", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            providerConfig: resolved.activeProvider,
                            model: activeModel,
                        }),
                    });
                    if (testResp.ok) {
                        const testData = await testResp.json();
                        const matched = testData?.data?.matched;
                        if (matched === true || (testData?.code === 0 && Array.isArray(testData?.data?.available) && testData.data.available.length > 0)) {
                            return {
                                available: true,
                                activeModel,
                                latencyMs: Date.now() - start,
                            };
                        }
                        if (testData?.data?.msg) {
                            return {
                                available: false,
                                activeModel,
                                latencyMs: Date.now() - start,
                                error: testData.data.msg,
                            };
                        }
                    }
                } catch {
                    // /api/ai/testModel 不可用时降级继续放行
                }
            }

            return {
                available: true,
                activeModel,
                latencyMs: Date.now() - start,
            };
        } catch (err: any) {
            return {
                available: false,
                activeModel: "",
                latencyMs: Date.now() - start,
                error: err?.message || String(err),
            };
        }
    }

    async call(payload: AiChatPayload, timeoutMs = 15000): Promise<AiChatResult> {
        const start = Date.now();
        const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

        try {
            const lastMsg = payload.messages[payload.messages.length - 1]?.content || "";
            const systemMsg = payload.messages.find((m) => m.role === "system")?.content || "";
            const fullPrompt = systemMsg ? `${systemMsg}\n\n${lastMsg}` : lastMsg;

            // 1. 优先调用思源 v3.8+ 官方 agent 接口 (/api/ai/agent/chat)，支持 SSE 流式推流
            let resp: Response | null = null;
            try {
                resp = await this.customFetch("/api/ai/agent/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prompt: fullPrompt,
                        messages: payload.messages,
                    }),
                    signal: controller?.signal,
                });
            } catch {
                resp = null;
            }

            // 2. 若 404 则降级至旧版接口 (/api/ai/chat)
            if (!resp || resp.status === 404) {
                resp = await this.customFetch("/api/ai/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prompt: fullPrompt,
                        messages: payload.messages,
                    }),
                    signal: controller?.signal,
                });
            }

            if (!resp.ok) {
                throw new Error(`思源 AI 接口 HTTP 响应异常: ${resp.status}`);
            }

            const contentType = resp.headers?.get?.("Content-Type") || "";
            let content = "";

            // 3. 处理 SSE 流式 (text/event-stream)
            if (contentType.includes("text/event-stream") && resp.body && typeof (resp.body as any).getReader === "function") {
                const reader = (resp.body as any).getReader();
                const decoder = new TextDecoder("utf-8");
                let buffer = "";
                let currentEvent = "";
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    buffer = lines.pop() || "";
                    for (const rawLine of lines) {
                        const line = rawLine.trim();
                        if (line.startsWith("event:")) {
                            currentEvent = line.slice(6).trim();
                        } else if (line.startsWith("data:")) {
                            try {
                                const dataObj = JSON.parse(line.slice(5).trim());
                                if (currentEvent === "content" && dataObj.token) {
                                    content += dataObj.token;
                                    payload.onChunk?.(dataObj.token);
                                }
                            } catch { /* ignore parse error */ }
                        }
                    }
                }
            } else if (typeof (resp as any).json === "function" && typeof (resp as any).text !== "function") {
                const data = await (resp as any).json();
                if (data && data.code !== undefined && data.code !== 0) {
                    throw new Error(data.msg || "思源 AI 服务返回业务错误");
                }
                content = pickAiResponseContent(data).trim();
            } else {
                // 4. 普通 JSON 或纯文本响应安全解析 (杜绝 Unexpected end of JSON input)
                const rawText = typeof (resp as any).text === "function" ? await resp.text() : "";
                try {
                    const data = JSON.parse(rawText);
                    if (data.code !== undefined && data.code !== 0) {
                        throw new Error(data.msg || "思源 AI 服务返回业务错误");
                    }
                    content = pickAiResponseContent(data).trim();
                } catch (parseErr: any) {
                    if (parseErr.message && !parseErr.message.includes("JSON")) {
                        throw parseErr;
                    }
                    // 若返回为缓冲型 SSE 文本流，抽取 token 拼接
                    if (rawText.includes("event:") || rawText.includes("data:")) {
                        const lines = rawText.split("\n");
                        let currentEvent = "";
                        let sseContent = "";
                        for (const rawLine of lines) {
                            const line = rawLine.trim();
                            if (line.startsWith("event:")) {
                                currentEvent = line.slice(6).trim();
                            } else if (line.startsWith("data:")) {
                                try {
                                    const dataObj = JSON.parse(line.slice(5).trim());
                                    if ((!currentEvent || currentEvent === "content") && dataObj.token) {
                                        sseContent += dataObj.token;
                                    }
                                } catch {}
                            }
                        }
                        if (sseContent) content = sseContent.trim();
                    }
                    if (!content) {
                        content = rawText.trim();
                    }
                }
            }

            if (!content) {
                throw new Error("思源 AI 返回内容为空");
            }

            return {
                ok: true,
                content,
                provider: "siyuan",
                model: "siyuan-kernel-agent",
                latencyMs: Date.now() - start,
            };
        } catch (err: any) {
            return {
                ok: false,
                content: "",
                provider: "siyuan",
                model: "siyuan-kernel-agent",
                latencyMs: Date.now() - start,
                error: err?.message || String(err),
            };
        } finally {
            if (timer) clearTimeout(timer);
        }
    }
}

/**
 * Tier 2: 用户自配 API Key Provider (兼容 OpenAI 规范)
 */
export class UserCustomAiProvider {
    private config: UserCustomConfig;
    private customFetch: typeof fetch;

    constructor(config: UserCustomConfig = {}, fetchFunc?: typeof fetch) {
        this.config = {
            baseUrl: "https://api.siliconflow.cn/v1",
            model: "Qwen/Qwen2.5-7B-Instruct",
            ...config,
        };
        this.customFetch = getSafeFetch(fetchFunc);
    }

    isConfigured(): boolean {
        return Boolean(this.config.apiKey && this.config.apiKey.trim().length > 3);
    }

    async call(payload: AiChatPayload, timeoutMs = 15000): Promise<AiChatResult> {
        const start = Date.now();
        if (!this.isConfigured()) {
            return {
                ok: false,
                content: "",
                provider: "user_custom",
                model: this.config.model || "unknown",
                latencyMs: 0,
                error: "未配置用户自定义 API Key",
            };
        }

        const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

        try {
            let baseUrl = (this.config.baseUrl || "https://api.siliconflow.cn/v1").replace(/\/+$/, "");
            if (!baseUrl.endsWith("/chat/completions")) {
                baseUrl = `${baseUrl}/chat/completions`;
            }

            const model = this.config.model || "Qwen/Qwen2.5-7B-Instruct";
            const reqBody = {
                model,
                messages: payload.messages,
                temperature: payload.temperature ?? 0.6,
                max_tokens: payload.maxTokens ?? 2048,
                stream: false,
            };

            const resp = await this.customFetch(baseUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.config.apiKey?.trim()}`,
                },
                body: JSON.stringify(reqBody),
                signal: controller?.signal,
            });

            if (!resp.ok) {
                const errBody = await resp.text().catch(() => "");
                throw new Error(`用户自配 API 请求失败 [HTTP ${resp.status}]: ${errBody.slice(0, 200)}`);
            }

            const data = await resp.json();
            const choice = data?.choices?.[0];
            const content = String(choice?.message?.content || "").trim();

            if (!content) {
                throw new Error("模型响应成功，但返回内容为空");
            }

            return {
                ok: true,
                content,
                provider: "user_custom",
                model,
                latencyMs: Date.now() - start,
            };
        } catch (err: any) {
            return {
                ok: false,
                content: "",
                provider: "user_custom",
                model: this.config.model || "unknown",
                latencyMs: Date.now() - start,
                error: err?.message || String(err),
            };
        } finally {
            if (timer) clearTimeout(timer);
        }
    }
}

/**
 * Tier 3: 本地 Ollama 自动感知与离线推理 Provider
 */
export class OllamaAiProvider {
    private baseUrl: string;
    private specifiedModel?: string;
    private customFetch: typeof fetch;
    private cachedStatus: { available: boolean; models: string[]; expireAt: number } | null = null;

    constructor(config: OllamaConfig = {}, fetchFunc?: typeof fetch) {
        this.baseUrl = (config.baseUrl || "http://127.0.0.1:11434").replace(/\/+$/, "");
        this.specifiedModel = config.model;
        this.customFetch = getSafeFetch(fetchFunc);
    }

    async probe(forceRefresh = false): Promise<{ available: boolean; activeModel: string }> {
        const now = Date.now();
        if (!forceRefresh && this.cachedStatus && this.cachedStatus.expireAt > now) {
            const m = this.specifiedModel || this.cachedStatus.models[0] || "qwen2.5:latest";
            return { available: this.cachedStatus.available, activeModel: m };
        }

        const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), 1500) : null;

        try {
            const resp = await this.customFetch(`${this.baseUrl}/api/tags`, {
                method: "GET",
                signal: controller?.signal,
            });

            if (!resp.ok) {
                this.cachedStatus = { available: false, models: [], expireAt: now + 30000 };
                return { available: false, activeModel: "" };
            }

            const data = await resp.json();
            const models = Array.isArray(data?.models) ? data.models.map((m: any) => String(m.name)) : [];
            const isAlive = models.length > 0;

            this.cachedStatus = {
                available: isAlive,
                models,
                expireAt: now + 60000,
            };

            const preferred = this.specifiedModel
                ? (models.includes(this.specifiedModel) ? this.specifiedModel : (models[0] || "qwen2.5:latest"))
                : (models.find((m: string) => m.includes("qwen") || m.includes("deepseek") || m.includes("llama")) || models[0] || "qwen2.5:latest");

            return { available: isAlive, activeModel: preferred };
        } catch {
            this.cachedStatus = { available: false, models: [], expireAt: now + 30000 };
            return { available: false, activeModel: "" };
        } finally {
            if (timer) clearTimeout(timer);
        }
    }

    async call(payload: AiChatPayload, timeoutMs = 30000): Promise<AiChatResult> {
        const start = Date.now();
        const probeRes = await this.probe();
        if (!probeRes.available) {
            return {
                ok: false,
                content: "",
                provider: "ollama",
                model: "none",
                latencyMs: Date.now() - start,
                error: "本地 Ollama 未启动或未拉取任何模型",
            };
        }

        const targetModel = probeRes.activeModel;
        const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

        try {
            const resp = await this.customFetch(`${this.baseUrl}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: targetModel,
                    messages: payload.messages,
                    stream: false,
                    options: {
                        temperature: payload.temperature ?? 0.6,
                    },
                }),
                signal: controller?.signal,
            });

            if (!resp.ok) {
                const errTxt = await resp.text().catch(() => "");
                throw new Error(`Ollama 响应异常 [HTTP ${resp.status}]: ${errTxt.slice(0, 200)}`);
            }

            const data = await resp.json();
            const content = String(data?.message?.content || "").trim();

            if (!content) {
                throw new Error("Ollama 返回内容为空");
            }

            return {
                ok: true,
                content,
                provider: "ollama",
                model: targetModel,
                latencyMs: Date.now() - start,
            };
        } catch (err: any) {
            return {
                ok: false,
                content: "",
                provider: "ollama",
                model: targetModel,
                latencyMs: Date.now() - start,
                error: err?.message || String(err),
            };
        } finally {
            if (timer) clearTimeout(timer);
        }
    }
}

/**
 * Tier 4: 公开免密免费 AI 通道 Provider (带本地 PII 隐私脱敏)
 */
export class PublicFreeAiProvider {
    private endpoints: string[];
    private customFetch: typeof fetch;

    constructor(config: PublicFreeConfig = {}, fetchFunc?: typeof fetch) {
        const primary = (config.endpoint || "https://text.pollinations.ai/").replace(/\/+$/, "");
        this.endpoints = [primary];
        this.customFetch = getSafeFetch(fetchFunc);
    }

    async call(payload: AiChatPayload, timeoutMs = 10000): Promise<AiChatResult> {
        const start = Date.now();
        // 关键守卫：外发到公开免费端点前，强制在纯本地执行 PII 隐私脱敏！
        const safeMessages = sanitizeMessages(payload.messages);

        let lastError = "";

        for (const endpoint of this.endpoints) {
            const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
            const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

            try {
                const body = {
                    messages: safeMessages,
                    model: "openai",
                    temperature: payload.temperature ?? 0.6,
                    jsonMode: false,
                };

                const resp = await this.customFetch(`${endpoint}/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "User-Agent": "Xiaolv-Suite-AI-Router/1.0",
                    },
                    body: JSON.stringify(body),
                    signal: controller?.signal,
                });

                if (!resp.ok) {
                    throw new Error(`公用免费通道 HTTP 响应异常: ${resp.status}`);
                }

                let text = await resp.text();
                try {
                    const parsed = JSON.parse(text);
                    if (parsed?.choices?.[0]?.message?.content) {
                        text = parsed.choices[0].message.content;
                    } else if (parsed?.content) {
                        text = parsed.content;
                    }
                } catch {
                    // 纯文本直接使用
                }

                const cleanContent = text.trim();
                if (!cleanContent) {
                    throw new Error("公用免费通道返回内容为空");
                }

                payload.onChunk?.(cleanContent);

                return {
                    ok: true,
                    content: cleanContent,
                    provider: "public_free",
                    model: "pollinations-public-tier",
                    latencyMs: Date.now() - start,
                };
            } catch (err: any) {
                lastError = err?.message || String(err);
            } finally {
                if (timer) clearTimeout(timer);
            }
        }

        return {
            ok: false,
            content: "",
            provider: "public_free",
            model: "pollinations-public-tier",
            latencyMs: Date.now() - start,
            error: lastError || "所有公用免费端点均无响应",
        };
    }
}

/**
 * Tier 5: 本地轻量规则与启发式离线兜底 Provider
 */
export class RuleFallbackProvider {
    call(payload: AiChatPayload): AiChatResult {
        const start = Date.now();
        const lastMsg = payload.messages[payload.messages.length - 1]?.content || "";
        const taskType = payload.taskType || "chat";

        let fallbackText = "";

        switch (taskType) {
            case "question_gen":
                fallbackText = this.fallbackQuestionGen(lastMsg);
                break;
            case "extract":
                fallbackText = this.fallbackExtract(lastMsg);
                break;
            case "summary":
                fallbackText = this.fallbackSummary(lastMsg);
                break;
            case "format":
                fallbackText = this.fallbackFormat(lastMsg);
                break;
            default:
                fallbackText = this.fallbackGeneral(lastMsg);
                break;
        }

        return {
            ok: true,
            content: fallbackText,
            provider: "rule_fallback",
            model: "local-heuristic-engine",
            latencyMs: Date.now() - start,
        };
    }

    private fallbackQuestionGen(rawText: string): string {
        const clean = rawText.replace(/<[^>]+>/g, "").trim();
        const sentences = clean.split(/[。！？\n]/).filter((s) => s.trim().length > 6);
        if (sentences.length === 0) {
            return `[问] 请回忆以下核心内容的关键要点：\n[答] ${clean}`;
        }

        const defSentence = sentences.find((s) => /是指|定义为|被称为|核心特征是|主要包括/.test(s)) || sentences[0] || clean;
        // 2026-11-21 走查修复：原 `[是|是指|定义为]` 是单字符集合（{是,|,指,定,义,为}）而非多字交替，
        // 含 `|` 的句子会被误判为定义句。改分组交替。
        const match = defSentence.match(/^([^，。:：是]{2,12})(?:是指|定义为|被称为)/);
        if (match && match[1]) {
            const subject = match[1].trim();
            return `[问] 什么是「${subject}」？其核心定义与特征是什么？\n[答] ${defSentence}`;
        }

        return `[问] 如何理解下述核心概念？\n[答] ${defSentence}`;
    }

    private fallbackExtract(rawText: string): string {
        const numMatch = rawText.match(/(\d+(?:\.\d+)?)\s*(毫升|ml|分钟|min|次|个|页|小时|h|kg|斤|公里|km)/i);
        const freqMatch = rawText.match(/(每天|每日|每周|每月|工作日|隔天)/);

        const extracted: Record<string, any> = {
            // 2026-11-21 走查修复：原字符类把多字单位拆成单字符集合，英文单词（Hello/AI 等）被逐字符撕碎。
            // 改分组交替，仅剥完整的数字+单位短语。
            title: rawText.replace(/(?:\d+(?:\.\d+)?\s*)?(?:毫升|ml|分钟|min|次|个|页|小时|h|kg|斤|公里|km|每天|每日|每周|每月|工作日|隔天)/gi, "").trim() || rawText,
            frequency: freqMatch ? freqMatch[1] : "每天",
            target: numMatch && numMatch[1] ? parseFloat(numMatch[1]) : 1,
            unit: numMatch && numMatch[2] ? numMatch[2] : "次",
        };

        return JSON.stringify(extracted, null, 2);
    }

    private fallbackSummary(rawText: string): string {
        const clean = rawText.replace(/<[^>]+>/g, "").trim();
        const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean);

        const points: string[] = [];
        for (const line of lines) {
            if (/^[0-9一二三四五六七八九十][.、\s]|^[-*•]/.test(line)) {
                points.push(line);
                if (points.length >= 4) break;
            }
        }

        if (points.length >= 2) {
            return `【核心大纲提取】\n${points.join("\n")}`;
        }

        const snippet = clean.slice(0, 160);
        return `【要点提炼】\n${snippet}${clean.length > 160 ? "…" : ""}`;
    }

    private fallbackFormat(rawText: string): string {
        return rawText.replace(/[\r\n]{3,}/g, "\n\n").trim();
    }

    private fallbackGeneral(rawText: string): string {
        return `[离线启发式回复] 已识别到您的请求。系统已在离线保护模式下记录您的输入：\n> ${rawText.slice(0, 100)}`;
    }
}

/* ========================================================================= */
/* 7. 全生态调度中枢核心类 (LvAiRouter)                                       */
/* ========================================================================= */

export class LvAiRouter {
    private config: AiRouterConfig;
    private siyuanProvider: SiyuanAiProvider;
    private userCustomProvider: UserCustomAiProvider;
    private ollamaProvider: OllamaAiProvider;
    private publicFreeProvider: PublicFreeAiProvider;
    private ruleFallbackProvider: RuleFallbackProvider;
    private cache: AiResponseCache;

    constructor(config: AiRouterConfig = {}, fetchFunc?: typeof fetch) {
        this.config = {
            enableSiyuan: true,
            enableRuleFallback: true,
            defaultTimeoutMs: 12000,
            maxTotalTimeoutMs: 25000,
            ...config,
        };

        this.siyuanProvider = new SiyuanAiProvider(fetchFunc as any);
        this.userCustomProvider = new UserCustomAiProvider(config.userCustom, fetchFunc);
        this.ollamaProvider = new OllamaAiProvider(config.ollama, fetchFunc);
        this.publicFreeProvider = new PublicFreeAiProvider(config.publicFree, fetchFunc);
        this.ruleFallbackProvider = new RuleFallbackProvider();
        this.cache = new AiResponseCache();
    }

    static cleanAndParseJson = cleanAndParseJson;
    static maskPiiText = maskPiiText;

    updateConfig(newConfig: Partial<AiRouterConfig>): void {
        this.config = { ...this.config, ...newConfig };
        if (newConfig.userCustom) {
            this.userCustomProvider = new UserCustomAiProvider(this.config.userCustom);
        }
        if (newConfig.ollama) {
            this.ollamaProvider = new OllamaAiProvider(this.config.ollama);
        }
        if (newConfig.publicFree) {
            this.publicFreeProvider = new PublicFreeAiProvider(this.config.publicFree);
        }
    }

    getConfig(): AiRouterConfig {
        return { ...this.config };
    }

    /** 一键测试指定通道的连通性与响应延迟 */
    async testChannel(provider: AiProviderType): Promise<{ ok: boolean; latencyMs: number; error?: string; model?: string }> {
        const testPayload: AiChatPayload = {
            messages: [{ role: "user", content: "ping" }],
            timeoutMs: 8000,
            taskType: "chat",
        };
        const res = await this.invokeSingleProvider(provider, testPayload, 8000);
        return {
            ok: res.ok,
            latencyMs: res.latencyMs,
            error: res.error,
            model: res.model,
        };
    }

    /** 探测 Tier 1: 思源智能体连通性 */
    async probeTier1(_timeoutMs?: number): Promise<TierProbeResult> {
        const start = Date.now();
        try {
            const probeRes = await this.siyuanProvider.probe();
            if (!probeRes.available) {
                return {
                    provider: "siyuan",
                    tier: 1,
                    tierName: "思源内核智能体",
                    ok: false,
                    latencyMs: Date.now() - start,
                    error: probeRes.error || "思源设置中未启用智能体或未配置Key",
                    statusText: probeRes.error ? probeRes.error.slice(0, 24) : "未配置",
                };
            }
            return {
                provider: "siyuan",
                tier: 1,
                tierName: "思源内核智能体",
                ok: true,
                latencyMs: probeRes.latencyMs,
                model: probeRes.activeModel || "siyuan-kernel-agent",
                statusText: `${probeRes.activeModel} (${probeRes.latencyMs}ms)`,
            };
        } catch (err: any) {
            return {
                provider: "siyuan",
                tier: 1,
                tierName: "思源内核智能体",
                ok: false,
                latencyMs: Date.now() - start,
                error: err?.message || String(err),
                statusText: "探测失败",
            };
        }
    }

    /** 探测 Tier 2: 用户自配商用 Key */
    async probeTier2(timeoutMs = 6000): Promise<TierProbeResult> {
        const start = Date.now();
        if (!this.userCustomProvider.isConfigured()) {
            return {
                provider: "user_custom",
                tier: 2,
                tierName: "自配商用 Key",
                ok: false,
                latencyMs: 0,
                error: "未配置 API Key",
                statusText: "未配置",
            };
        }
        try {
            const res = await this.userCustomProvider.call({ messages: [{ role: "user", content: "ping" }], taskType: "chat" }, timeoutMs);
            return {
                provider: "user_custom",
                tier: 2,
                tierName: "自配商用 Key",
                ok: res.ok,
                latencyMs: res.latencyMs,
                model: res.model,
                error: res.error,
                statusText: res.ok ? `${res.latencyMs}ms` : (res.error || "连接失败"),
            };
        } catch (err: any) {
            return {
                provider: "user_custom",
                tier: 2,
                tierName: "自配商用 Key",
                ok: false,
                latencyMs: Date.now() - start,
                error: err?.message || String(err),
                statusText: "连接异常",
            };
        }
    }

    /** 探测 Tier 3: 本地 Ollama 引擎 */
    async probeTier3(): Promise<TierProbeResult> {
        const start = Date.now();
        try {
            const probeRes = await this.ollamaProvider.probe(true);
            if (!probeRes.available) {
                return {
                    provider: "ollama",
                    tier: 3,
                    tierName: "本地 Ollama",
                    ok: false,
                    latencyMs: Date.now() - start,
                    error: "本地 11434 端口未启动或未拉取模型",
                    statusText: "离线未启动",
                };
            }
            return {
                provider: "ollama",
                tier: 3,
                tierName: "本地 Ollama",
                ok: true,
                latencyMs: Date.now() - start,
                model: probeRes.activeModel,
                statusText: `${probeRes.activeModel} (${Date.now() - start}ms)`,
            };
        } catch (err: any) {
            return {
                provider: "ollama",
                tier: 3,
                tierName: "本地 Ollama",
                ok: false,
                latencyMs: Date.now() - start,
                error: err?.message || String(err),
                statusText: "离线",
            };
        }
    }

    /** 探测 Tier 4: 公开免密免费通道 */
    async probeTier4(timeoutMs = 6000): Promise<TierProbeResult> {
        const start = Date.now();
        if (this.config.publicFree?.enabled === false) {
            return {
                provider: "public_free",
                tier: 4,
                tierName: "免费公用池",
                ok: false,
                latencyMs: 0,
                error: "已在设置中停用",
                statusText: "已停用",
            };
        }
        try {
            const res = await this.publicFreeProvider.call({ messages: [{ role: "user", content: "ping" }], taskType: "chat" }, timeoutMs);
            return {
                provider: "public_free",
                tier: 4,
                tierName: "免费公用池",
                ok: res.ok,
                latencyMs: res.latencyMs,
                model: res.model,
                error: res.error,
                statusText: res.ok ? `${res.latencyMs}ms` : (res.error || "网络波动"),
            };
        } catch (err: any) {
            return {
                provider: "public_free",
                tier: 4,
                tierName: "免费公用池",
                ok: false,
                latencyMs: Date.now() - start,
                error: err?.message || String(err),
                statusText: "异常",
            };
        }
    }

    /** 探测 Tier 5: 离线规则兜底 */
    probeTier5(): TierProbeResult {
        const start = Date.now();
        this.ruleFallbackProvider.call({ messages: [{ role: "user", content: "ping" }], taskType: "chat" });
        return {
            provider: "rule_fallback",
            tier: 5,
            tierName: "离线规则兜底",
            ok: true,
            latencyMs: Date.now() - start,
            model: "local-heuristic-engine",
            statusText: "始终就绪 (1ms)",
        };
    }

    /** 一键测试全部 5 级通道的连通性与响应延迟 */
    async testAllTiers(timeoutMs = 6000): Promise<Record<AiProviderType, TierProbeResult>> {
        const [siyuan, user_custom, ollama, public_free] = await Promise.all([
            this.probeTier1(timeoutMs),
            this.probeTier2(timeoutMs),
            this.probeTier3(),
            this.probeTier4(timeoutMs),
        ]);
        const rule_fallback = this.probeTier5();
        return { siyuan, user_custom, ollama, public_free, rule_fallback };
    }

    async chat(payload: AiChatPayload): Promise<AiChatResult> {
        const start = Date.now();
        const fallbackHistory: Array<{ provider: AiProviderType; error: string; latencyMs: number }> = [];
        const singleTimeout = payload.timeoutMs || this.config.defaultTimeoutMs || 12000;
        const maxTotalTime = this.config.maxTotalTimeoutMs || 25000;

        // 1. 尝试从 LRU 内存缓存中读取（仅针对非流式且未禁缓存的请求）
        const cacheKey = AiResponseCache.computeKey(payload.taskType, payload.messages);
        if (!payload.stream) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                payload.onChunk?.(cached.content);
                return cached;
            }
        }

        // 2. 若用户指定首选通道，优先调度
        if (payload.preferredProvider) {
            const res = await this.invokeSingleProvider(payload.preferredProvider, payload, singleTimeout);
            if (res.ok) {
                this.cache.set(cacheKey, res);
                return res;
            }
            fallbackHistory.push({
                provider: payload.preferredProvider,
                error: res.error || "指定通道调用失败",
                latencyMs: res.latencyMs,
            });
        }

        // 3. 构建默认瀑布流队列
        const pipeline: AiProviderType[] = [];

        if (this.config.enableSiyuan !== false && payload.preferredProvider !== "siyuan") {
            pipeline.push("siyuan");
        }

        if (this.userCustomProvider.isConfigured() && payload.preferredProvider !== "user_custom") {
            pipeline.push("user_custom");
        }

        if (this.config.ollama?.enabled !== false && payload.preferredProvider !== "ollama") {
            pipeline.push("ollama");
        }

        if (this.config.publicFree?.enabled !== false && payload.preferredProvider !== "public_free") {
            pipeline.push("public_free");
        }

        // 依次执行瀑布降级
        for (const providerType of pipeline) {
            if (Date.now() - start > maxTotalTime) {
                break;
            }

            const res = await this.invokeSingleProvider(providerType, payload, singleTimeout);
            if (res.ok) {
                const finalResult: AiChatResult = {
                    ...res,
                    fallbackHistory: fallbackHistory.length > 0 ? fallbackHistory : undefined,
                };
                this.cache.set(cacheKey, finalResult);
                return finalResult;
            }

            fallbackHistory.push({
                provider: providerType,
                error: res.error || "未知异常",
                latencyMs: res.latencyMs,
            });
        }

        // 4. 终极兜底：本地轻量规则引擎（保证业务永不白屏报错）
        if (this.config.enableRuleFallback !== false) {
            const fallbackRes = this.ruleFallbackProvider.call(payload);
            const finalResult: AiChatResult = {
                ...fallbackRes,
                fallbackHistory,
            };
            payload.onChunk?.(fallbackRes.content);
            return finalResult;
        }

        return {
            ok: false,
            content: "",
            provider: "rule_fallback",
            model: "none",
            latencyMs: Date.now() - start,
            error: `全通道调用失败: ${fallbackHistory.map((h) => `[${h.provider}]: ${h.error}`).join("; ")}`,
            fallbackHistory,
        };
    }

    private async invokeSingleProvider(
        provider: AiProviderType,
        payload: AiChatPayload,
        timeoutMs: number
    ): Promise<AiChatResult> {
        switch (provider) {
            case "siyuan":
                return this.siyuanProvider.call(payload, timeoutMs);
            case "user_custom":
                return this.userCustomProvider.call(payload, timeoutMs);
            case "ollama":
                return this.ollamaProvider.call(payload, timeoutMs);
            case "public_free":
                return this.publicFreeProvider.call(payload, timeoutMs);
            case "rule_fallback":
                return this.ruleFallbackProvider.call(payload);
            default:
                return {
                    ok: false,
                    content: "",
                    provider,
                    model: "unknown",
                    latencyMs: 0,
                    error: `未知的 Provider 类型: ${provider}`,
                };
        }
    }
}

export const LV_AI_ROUTER_STORAGE_KEY = "lv_ai_router_config_v1";

function getSafeStorage(): any {
    try {
        if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
        if (typeof localStorage !== "undefined") return localStorage;
    } catch {
        // ignore
    }
    return null;
}

/** 从 localStorage 读取全生态统一配置（无配置时返回默认五级自适应参数） */
export function loadAiRouterConfig(): AiRouterConfig {
    try {
        const storage = getSafeStorage();
        if (storage) {
            const raw = storage.getItem(LV_AI_ROUTER_STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === "object") {
                    return parsed;
                }
            }
        }
    } catch {
        // ignore
    }
    return {
        enableSiyuan: true,
        enableRuleFallback: true,
        defaultTimeoutMs: 12000,
        maxTotalTimeoutMs: 25000,
        publicFree: { enabled: true },
        ollama: { enabled: true, baseUrl: "http://127.0.0.1:11434" },
    };
}

/** 保存全生态统一配置到 localStorage，并向当前窗口广播配置变更事件 */
export function saveAiRouterConfig(config: AiRouterConfig): void {
    try {
        const storage = getSafeStorage();
        if (storage) {
            storage.setItem(LV_AI_ROUTER_STORAGE_KEY, JSON.stringify(config));
        }
        if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
            window.dispatchEvent(new CustomEvent("lv-ai-router-config-updated", { detail: config }));
        }
    } catch {
        // ignore
    }
    if (sharedRouterInstance) {
        sharedRouterInstance.updateConfig(config);
    }
}

let sharedRouterInstance: LvAiRouter | null = null;

export function getSharedAiRouter(config?: AiRouterConfig): LvAiRouter {
    if (!sharedRouterInstance) {
        const initialConfig = config || loadAiRouterConfig();
        sharedRouterInstance = new LvAiRouter(initialConfig);
    } else if (config) {
        sharedRouterInstance.updateConfig(config);
    }
    return sharedRouterInstance;
}

// 自动挂载至全局 window，供小驴全家桶任意插件与罗盘免 import 无缝复用
if (typeof window !== "undefined") {
    (window as any).LvAiRouter = LvAiRouter;
    (window as any).getSharedAiRouter = getSharedAiRouter;
    (window as any).loadAiRouterConfig = loadAiRouterConfig;
    (window as any).saveAiRouterConfig = saveAiRouterConfig;
    (window as any).AI_PROVIDER_REFERRALS = AI_PROVIDER_REFERRALS;
    (window as any).AI_TIER_DESCRIPTIONS = AI_TIER_DESCRIPTIONS;
    (window as any).openExternalUrl = openExternalUrl;
}
