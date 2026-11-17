// 常用语文本一键参数化与动态变量推导向导（Auto-Parameterizer / Template Wizard）
// 自动侦测静态文本中的日期、称呼、金额、单号、手机、邮箱等常见可变槽位，
// 一键推导并转化为 {{xlc:ask:...}} 或动态宏，极大降低普通用户编写动态模板的门槛。
// 纯函数、零副作用运行。

export interface ParameterizeSuggestion {
    original: string;
    suggestedTag: string;
    fieldLabel: string;
    index: number;
}

export interface ParameterizeResult {
    result: string;
    suggestedCount: number;
    suggestions: ParameterizeSuggestion[];
}

/**
 * 智能参数化静态文本为动态常用语模板
 */
export function autoParameterizeText(text: string): ParameterizeResult {
    if (!text || !text.trim()) return {result: text ?? "", suggestedCount: 0, suggestions: []};

    const suggestions: ParameterizeSuggestion[] = [];
    let processed = text;

    // 1. 手机号码 (11 位大陆手机)
    processed = processed.replace(/(?<!\d)(1[3-9]\d{9})(?!\d)/g, (match, _phone, offset) => {
        suggestions.push({
            original: match,
            suggestedTag: "{{xlc:ask:手机号}}",
            fieldLabel: "手机号",
            index: offset,
        });
        return "{{xlc:ask:手机号}}";
    });

    // 2. 电子邮箱地址
    processed = processed.replace(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g, (match, _email, offset) => {
        suggestions.push({
            original: match,
            suggestedTag: "{{xlc:ask:邮箱}}",
            fieldLabel: "邮箱",
            index: offset,
        });
        return "{{xlc:ask:邮箱}}";
    });

    // 3. 具体绝对日期 (如 2026-10-30, 2026/10/30, 2026年10月30日)
    processed = processed.replace(/(?<!\d)(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}日?)(?!\d)/g, (match, _date, offset) => {
        suggestions.push({
            original: match,
            suggestedTag: "{{xlc:date}}",
            fieldLabel: "当前日期",
            index: offset,
        });
        return "{{xlc:date}}";
    });

    // 4. 金额货币 (如 ￥500, 100元, 199.99元, $100)
    processed = processed.replace(/([￥$]\s*\d+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?\s*元)/g, (match, _amount, offset) => {
        suggestions.push({
            original: match,
            suggestedTag: "{{xlc:ask:金额}}",
            fieldLabel: "金额",
            index: offset,
        });
        return "{{xlc:ask:金额}}";
    });

    // 5. 常见称呼与客户名称（如 尊敬的张三、李总、王经理）
    processed = processed.replace(/(尊敬的)?([^\s，,。\n]{1,4})(经理|总|老师|女士|先生|同学)(您好|你好)?/g, (match, prefix, _name, title, greeting, offset) => {
        const replacement = `${prefix || ""}{{xlc:ask:姓名}}${title}${greeting || ""}`;
        suggestions.push({
            original: match,
            suggestedTag: replacement,
            fieldLabel: "姓名",
            index: offset,
        });
        return replacement;
    });

    return {
        result: processed,
        suggestedCount: suggestions.length,
        suggestions,
    };
}
