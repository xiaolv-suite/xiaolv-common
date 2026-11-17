// 小驴家族生态轻量探测器与只读桥接适配器（Ecosystem Adapter）
// 零依赖、零侵入、纯只读、渐进增强：
// 1. 若宿主未安装其他插件，本适配器完全不产生任何网络或存储副作用，小驴常用 100% 独立运行；
// 2. 若检测到打卡、人脉、拾遗、雷切等兄弟插件公开窗口桥，自动提供只读条目联动与状态呈现。

export interface SiblingPluginInfo {
    id: string;
    name: string;
    bridgeKey: string;
    installed: boolean;
    description: string;
    capability: string;
}

export interface EcosystemStatus {
    totalChecked: number;
    installedCount: number;
    plugins: SiblingPluginInfo[];
}

/** 探测宿主窗口中已挂载的兄弟插件公开桥 */
export function detectEcosystem(host: any = (typeof window !== "undefined" ? window : {})): EcosystemStatus {
    const plugins: SiblingPluginInfo[] = [
        {
            id: "siyuan-checkin",
            name: "小驴打卡",
            bridgeKey: "window.siyuanCheckin",
            installed: Boolean((host.siyuanCheckin || host.LvCheckin || host.lvCheckin || host.xiaolvCheckin) && typeof (host.siyuanCheckin || host.LvCheckin || host.lvCheckin || host.xiaolvCheckin).getItems === "function"),
            description: "习惯打卡、时间追踪与连击记录",
            capability: "快速插入今日打卡状态与连击文本",
        },
        {
            id: "siyuan-contacts",
            name: "小驴人脉",
            bridgeKey: "window.LvContacts",
            installed: Boolean((host.LvContacts || host.siyuanContacts || host.lvContacts || host.xiaolvContacts) && typeof (host.LvContacts || host.siyuanContacts || host.lvContacts || host.xiaolvContacts).searchPeople === "function"),
            description: "人物关系图谱与联系人脉络",
            capability: "检索联系人并一键插入结构化名片块",
        },
        {
            id: "siyuan-home",
            name: "小驴管家",
            bridgeKey: "window.LvHome",
            installed: Boolean(host.LvHome || host.siyuanHome || host.xiaolvHome || host.lvHome),
            description: "资产、账本、待办提醒与家庭管家",
            capability: "检索管家临期提醒并一键推入待办",
        },
        {
            id: "siyuan-glean",
            name: "小驴拾遗",
            bridgeKey: "window.siyuanGlean",
            installed: Boolean((host.siyuanGlean || host.xiaolvGlean || host.lvGlean || host.LvGlean) && typeof (host.siyuanGlean || host.xiaolvGlean || host.lvGlean || host.LvGlean).listClips === "function"),
            description: "网页文章剪藏与高亮摘录",
            capability: "引用剪藏文章片段与金句高亮",
        },
        {
            id: "siyuan-speed-switch",
            name: "小驴雷切",
            bridgeKey: "window.siyuanSpeedSwitch",
            installed: Boolean(host.siyuanSpeedSwitch || host.xiaolvSpeedSwitch || host.xiaolvRaikiri || host.lvRaikiri),
            description: "全域工作台快速切换与大纲穿透",
            capability: "通过公开协议在雷切中秒级调用常用语",
        },
        {
            id: "siyuan-lv-cards",
            name: "小驴闪卡",
            bridgeKey: "window.xiaolvCards",
            installed: Boolean(host.xiaolvCards || host.lvCards || host.LvCards || host.siyuanCards),
            description: "间隔重复、FSRS遗忘曲线与记忆卡片",
            capability: "插入今日待复习闪卡统计与微任务清单",
        },
        {
            id: "siyuan-exam",
            name: "小驴考试",
            bridgeKey: "window.LvExam",
            installed: Boolean(host.LvExam || host.siyuanExam || host.xiaolvExam || host.lvExam),
            description: "智能题库、真题模考与错题管理",
            capability: "快速插入今日刷题统计与错题回顾",
        },
        {
            id: "siyuan-task-horizon",
            name: "任务视界",
            bridgeKey: "window.TaskHorizon",
            installed: Boolean(host.TaskHorizon || host.taskHorizon || host.siyuanTaskHorizon),
            description: "时间轴、看板与多维任务管理",
            capability: "检索今日高优任务并插入执行清单",
        },
    ];

    return {
        totalChecked: plugins.length,
        installedCount: plugins.filter((p) => p.installed).length,
        plugins,
    };
}

/**
 * 安全查询小驴生态兄弟插件的只读条目（打卡概览、人脉名片、管家提醒、拾遗剪藏、任务视界等）
 * 包含异常隔离，任何单一插件调用失败绝不阻塞主流程。
 */
export async function queryEcosystemItems(
    rawQuery: string,
    host: any = (typeof window !== "undefined" ? window : {}),
): Promise<Array<{title: string; payload: string; providerName: string}>> {
    const q = (rawQuery ?? "").trim().toLowerCase();
    const items: Array<{title: string; payload: string; providerName: string}> = [];

    // 1. 小驴打卡联动
    try {
        const checkin = host.siyuanCheckin || host.LvCheckin || host.lvCheckin || host.xiaolvCheckin;
        if (checkin) {
            const rawItems = typeof checkin.getItems === "function"
                ? checkin.getItems()
                : (typeof checkin.queryItems === "function" ? checkin.queryItems({ includeArchived: false }) : []);
            if (Array.isArray(rawItems) && rawItems.length > 0) {
                const isCheckinIntent = !q || q.includes("打卡") || q.includes("checkin") || q.includes("今日") || q.includes("习惯");
                const matchedItems = rawItems.filter((it: any) => {
                    if (it.archived) return false;
                    if (isCheckinIntent) return true;
                    const name = (it.name || it.title || "").toLowerCase();
                    return name.includes(q);
                });
                if (matchedItems.length > 0) {
                    items.push({
                        title: `小驴打卡 · 今日打卡清单 (${matchedItems.length}项)`,
                        payload: `【今日打卡】共 ${matchedItems.length} 项打卡项目：\n${matchedItems.map((it: any) => `- [ ] ${it.name || it.title}`).join("\n")}`,
                        providerName: "小驴打卡",
                    });
                }
            }
        }
    } catch {
        // 静默隔离
    }

    // 2. 小驴人脉联动
    try {
        const contacts = host.LvContacts || host.siyuanContacts || host.lvContacts || host.xiaolvContacts;
        if (contacts && typeof contacts.searchPeople === "function" && q.length >= 1) {
            const people = await contacts.searchPeople(q);
            if (Array.isArray(people)) {
                for (const p of people.slice(0, 3)) {
                    const name = p.name || "联系人";
                    const infoLines = [
                        `**联系人**：${name}`,
                        p.organization ? `· 公司/组织：${p.organization}` : "",
                        p.role ? `· 职位：${p.role}` : "",
                        p.phone ? `· 电话：${p.phone}` : "",
                        p.wechat ? `· 微信：${p.wechat}` : "",
                        p.email ? `· 邮箱：${p.email}` : "",
                    ].filter(Boolean);

                    items.push({
                        title: `小驴人脉 · ${name}${p.role ? ` (${p.role})` : ""}`,
                        payload: infoLines.join("\n"),
                        providerName: "小驴人脉",
                    });
                }
            }
        }
    } catch {
        // 静默隔离
    }

    // 3. 小驴管家联动 (LvHome)
    try {
        const home = host.LvHome || host.siyuanHome || host.xiaolvHome || host.lvHome;
        if (home && typeof home.getReminders === "function") {
            const reminders = home.getReminders();
            if (Array.isArray(reminders) && reminders.length > 0) {
                const isHomeIntent = !q || q.includes("待办") || q.includes("备忘") || q.includes("管家") || q.includes("提醒") || q.includes("逾期");
                const matched = reminders.filter((r: any) => {
                    if (isHomeIntent) return true;
                    return (r.title || "").toLowerCase().includes(q);
                });
                for (const r of matched.slice(0, 3)) {
                    const statusTag = (r.daysLeft ?? 0) <= 0 ? "已逾期" : `剩 ${r.daysLeft} 天`;
                    items.push({
                        title: `小驴管家 · ${r.title} (${statusTag})`,
                        payload: `- [ ] ${r.title} (到期日: ${r.dueDate || "今日"} · ${statusTag})`,
                        providerName: "小驴管家",
                    });
                }
            }
        }
    } catch {
        // 静默隔离
    }

    // 4. 小驴拾遗联动 (siyuanGlean)
    try {
        const glean = host.siyuanGlean || host.xiaolvGlean || host.lvGlean || host.LvGlean;
        if (glean && typeof glean.listClips === "function" && q.length >= 1) {
            const clips = await glean.listClips({ keyword: q, limit: 3 });
            if (Array.isArray(clips)) {
                for (const c of clips.slice(0, 3)) {
                    const title = c.title || "剪藏摘录";
                    const summaryPart = c.summary ? `> ${c.summary}\n\n` : "";
                    const linkPart = c.url ? `来源：[${title}](${c.url})` : `**${title}**`;
                    items.push({
                        title: `小驴拾遗 · ${title}`,
                        payload: `${summaryPart}${linkPart}`,
                        providerName: "小驴拾遗",
                    });
                }
            }
        }
    } catch {
        // 静默隔离
    }

    // 5. 任务视界联动 (Task Horizon)
    try {
        const taskHorizon = host.TaskHorizon || host.taskHorizon || host.siyuanTaskHorizon;
        if (taskHorizon) {
            let tasks: any[] = [];
            if (typeof taskHorizon.getTodayTasks === "function") {
                tasks = await taskHorizon.getTodayTasks();
            } else if (typeof taskHorizon.queryTasks === "function") {
                const res = await taskHorizon.queryTasks({ date: "today", scope: "all", limit: 5, includeCompleted: false });
                tasks = res?.tasks || [];
            }
            if (Array.isArray(tasks) && tasks.length > 0) {
                const isTaskIntent = !q || q.includes("任务") || q.includes("task") || q.includes("todo") || q.includes("今日");
                const matched = tasks.filter((t: any) => {
                    if (t.done) return false;
                    if (isTaskIntent) return true;
                    return (t.title || "").toLowerCase().includes(q);
                });
                for (const t of matched.slice(0, 3)) {
                    const p = t.priority && t.priority !== "none" ? ` [${t.priority}]` : "";
                    items.push({
                        title: `任务视界 · ${t.title}${p}`,
                        payload: `- [ ] ${t.title}${p}`,
                        providerName: "任务视界",
                    });
                }
            }
        }
    } catch {
        // 静默隔离
    }

    // 6. 小驴闪卡联动 (siyuan-lv-cards)
    try {
        const cards = host.xiaolvCards || host.lvCards || host.LvCards || host.siyuanCards;
        if (cards && (q.includes("闪卡") || q.includes("复习") || q.includes("cards") || q.includes("卡片"))) {
            if (typeof cards.generateDailyTaskMarkdown === "function") {
                const res = await cards.generateDailyTaskMarkdown();
                if (res?.ok && res?.data?.markdown) {
                    items.push({
                        title: `小驴闪卡 · 今日待复习 (${res.data.dueCount}张)`,
                        payload: res.data.markdown,
                        providerName: "小驴闪卡",
                    });
                }
            } else if (typeof cards.getDueSummary === "function") {
                const res = await cards.getDueSummary();
                const total = res?.data?.unreviewedCount ?? (typeof res?.unreviewedCount === "number" ? res.unreviewedCount : 0);
                items.push({
                    title: `小驴闪卡 · 今日待复习 (${total}张)`,
                    payload: `- [ ] 记忆复习：今日待复习 ${total} 张闪卡`,
                    providerName: "小驴闪卡",
                });
            }
        }
    } catch {
        // 静默隔离
    }

    // 7. 小驴考试联动 (siyuan-exam)
    try {
        const exam = host.LvExam || host.siyuanExam || host.xiaolvExam || host.lvExam;
        if (exam && (q.includes("考试") || q.includes("刷题") || q.includes("错题") || q.includes("exam"))) {
            if (typeof exam.statsRead === "function") {
                const stats = await exam.statsRead();
                const count = stats?.todayCount ?? stats?.totalQuestions ?? 0;
                items.push({
                    title: `小驴考试 · 题库概览`,
                    payload: `【小驴考试】今日练习进度：${count} 题`,
                    providerName: "小驴考试",
                });
            }
        }
    } catch {
        // 静默隔离
    }

    return items;
}
