// 全生态协议与快捷操作服务（EcosystemHandlers · S10）
import {CommonItem} from "../model/item";
import {lvLaunchpad, withLvAiWait} from "../libs/lv-notice-kit";
import {getErrorProperty} from "../model/errors";
import {formatAiError, type TemplateExpansionContext} from "./ai";
import {CapabilityDescriptor, ProviderDescriptor} from "../model/protocol";
import type {XiaolvCommonPluginContext} from "./plugin-context";

export class EcosystemHandlers {
    constructor(private readonly plugin: XiaolvCommonPluginContext) {}

    async handleQuickAction(action: string): Promise<void> {
        if (action.includes("搜索")) {
            this.plugin.openSearch();
        } else if (action.includes("复制置顶") || action.includes("置顶")) {
            lvLaunchpad.haptic(12);
            const top = await this.getTopSnippet();
            if (top) {
                const copied = await this.plugin.host.writeClipboard(top.content);
                if (copied) {
                    this.plugin.notify("info", `已复制「${top.title}」，去目标应用粘贴`);
                } else {
                    this.plugin.notify("error", this.plugin.i18nFn()("copyFailed"));
                }
            } else {
                this.plugin.notify("info", "暂无可复制的置顶常用片段");
            }
        } else if (action.includes("剪贴板保存") || action.includes("从剪贴板") || action.includes("新建")) {
            lvLaunchpad.haptic(12);
            void this.plugin.captureCoordinator.quickCaptureFromClipboard();
        } else if (action.includes("剪贴板历史") || action.includes("历史")) {
            this.plugin.openSearch(undefined, undefined, undefined, undefined, "clipboard");
        } else if (action.includes("变体") || action.includes("智能生成")) {
            const targetId = this.plugin.state.favorites[0] || this.plugin.state.recents[0]?.id;
            if (targetId) {
                try {
                    await this.generateVariantsForItem(targetId);
                } catch (err) {
                    const isCancelled = getErrorProperty(err, "reason") === "cancelled" || getErrorProperty(err, "name") === "AbortError";
                    if (isCancelled) {
                        this.plugin.notify("info", this.plugin.i18nFn()("aiCancelled"));
                    } else {
                        this.plugin.notify("error", `生成变体失败: ${formatAiError(err, this.plugin.i18nFn())}`);
                    }
                }
            } else {
                this.plugin.notify("info", "暂无可生成变体的常用片段");
            }
        } else {
            this.plugin.openSearch();
        }
    }

    async getTopSnippet(): Promise<{ id: string; title: string; content: string } | null> {
        if (!this.plugin.library) return null;
        try {
            const idx = await this.plugin.library.ensureIndex();
            if (!idx || idx.entries.length === 0) return null;
            let topId = this.plugin.state.favorites[0] || this.plugin.state.recents[0]?.id;
            let entry = topId ? idx.entries.find((e: any) => e.id === topId) : undefined;
            if (!entry && idx.entries.length > 0) {
                entry = idx.entries[0];
            }
            if (!entry) return null;
            const got = await this.plugin.library.getItem(entry.id);
            let content = entry.summary || entry.title;
            if (got.ok) {
                const kdRes = await this.plugin.library.getStoredItemKramdown(got.data);
                content = kdRes.ok && kdRes.data ? kdRes.data : (got.data.summary || entry.title);
            }
            return { id: entry.id, title: entry.title, content };
        } catch {
            return null;
        }
    }

    async generateVariantsForItem(itemId: string): Promise<CommonItem[]> {
        if (!this.plugin.library) return [];
        const idx = await this.plugin.library.ensureIndex();
        const item = idx.items.get(itemId);
        if (!item) throw new Error("条目不存在");
        const kdRes = await this.plugin.library.getStoredItemKramdown(item);
        if (!kdRes.ok || !kdRes.data) throw new Error("无法读取条目内容");
        const {aiGenerateSnippetVariants} = await import(/* webpackChunkName: "ai-service" */ "./ai");
        const variants = await withLvAiWait({
            scenario: "general",
            title: `AI 智能变体生成 · ${item.title}`,
            subtitle: "正在生成中英双语、礼貌商务与极简要点三个版本",
            cancelLabel: "⏹ 取消生成",
        }, async (signal) => {
            return aiGenerateSnippetVariants(item.title, kdRes.data, this.plugin.state?.ai, signal);
        });
        const createdItems: CommonItem[] = [];
        for (const variant of variants) {
            const receipt = await this.plugin.library.createItem({
                itemType: item.itemType === "code" ? "code" : "text",
                title: `${item.title}${variant.titleSuffix}`,
                markdown: variant.content,
                category: item.category || "常用",
                tags: [...(item.tags || []), "AI变体", variant.label],
            });
            if (receipt.ok && receipt.data?.item) {
                createdItems.push(receipt.data.item);
            }
        }
        this.plugin.notify("info", `已为「${item.title}」生成 ${createdItems.length} 个 AI 智能变体`);
        return createdItems;
    }

    async smartExpandTemplate(templateText: string, context?: TemplateExpansionContext): Promise<string> {
        const {aiSmartExpandTemplate} = await import(/* webpackChunkName: "ai-service" */ "./ai");
        return withLvAiWait({
            scenario: "transform",
            title: "AI 模板智能展开",
            subtitle: context?.docTitle ? `上下文：${context.docTitle}` : "正在结合上下文智能填充变量",
            cancelLabel: "⏹ 取消生成",
        }, async (signal) => {
            return aiSmartExpandTemplate(templateText, context, this.plugin.state?.ai, signal);
        });
    }

    async searchSnippets(keyword: string): Promise<Array<{ id: string; title: string; content: string }>> {
        if (!this.plugin.library) return [];
        try {
            const idx = await this.plugin.library.ensureIndex();
            if (!idx) return [];
            const kw = (keyword || "").trim().toLowerCase();
            const hits: Array<{ id: string; title: string; content: string }> = [];
            for (const item of idx.items.values()) {
                const titleMatch = item.title.toLowerCase().includes(kw);
                const summaryMatch = (item.summary || "").toLowerCase().includes(kw);
                const tagMatch = item.tags.some((t: string) => t.toLowerCase().includes(kw));
                const aliasMatch = (item.alias || "").toLowerCase().includes(kw);
                const shortcodeMatch = (item.shortcode || "").toLowerCase().includes(kw);
                if (!kw || titleMatch || summaryMatch || tagMatch || aliasMatch || shortcodeMatch) {
                    hits.push({
                        id: item.id,
                        title: item.title,
                        content: item.summary || item.title,
                    });
                }
            }
            hits.sort((a, b) => {
                const uA = this.plugin.state.usage[a.id];
                const countA = typeof uA === "number" ? uA : (uA?.count ?? 0);
                const uB = this.plugin.state.usage[b.id];
                const countB = typeof uB === "number" ? uB : (uB?.count ?? 0);
                if (countB !== countA) return countB - countA;
                const isFavA = this.plugin.state.favorites.includes(a.id) ? 1 : 0;
                const isFavB = this.plugin.state.favorites.includes(b.id) ? 1 : 0;
                return isFavB - isFavA;
            });
            return hits;
        } catch {
            return [];
        }
    }

    async insertSnippet(itemId: string): Promise<boolean> {
        if (!this.plugin.service) return false;
        try {
            const res = await this.plugin.service.insert(itemId, {mode: "insert"});
            return res.ok;
        } catch {
            return false;
        }
    }

    getCapabilities(): CapabilityDescriptor[] {
        return this.plugin.service.getCapabilities();
    }

    registerProvider(descriptor: ProviderDescriptor, runtime?: {search?(query: string): Promise<Array<{title: string; payload: string}>>}): void {
        const result = this.plugin.service.registerProvider(descriptor, runtime);
        if (result.ok) this.plugin.notifyExternalDataChange();
        this.plugin.notify(result.ok ? "info" : "error", result.ok
            ? this.plugin.i18nFn()("providerRegistered", descriptor.displayName)
            : (result.message ?? "rejected"));
    }

    unregisterProvider(pluginId: string): void {
        const result = this.plugin.service.unregisterProvider(pluginId);
        if (result.ok) this.plugin.notifyExternalDataChange();
        this.plugin.notify(result.ok ? "info" : "error", result.ok
            ? this.plugin.i18nFn()("providerUnregistered", pluginId)
            : (result.message ?? "rejected"));
    }
}
