// 捕获对话框表单渲染（CaptureDialog Surface · S8 动态分包）
import {Dialog, confirm} from "siyuan";
import {adaptSecondaryDialogForMobile, getDialogBody, isMobileDialogViewport, mountPlatformDialogTitleWrap} from "./dialog-dom";
import {ItemType, cleanShortcode, extractKramdownNativeTags, inferTypeFromText, isSafeHttpUrl, parseSnippetAnnotations} from "../model/item";
import {formatAiError, toErrorMessage} from "../model/errors";
import {LIMITS} from "../constants";
import {deriveOmniItemMetadata} from "../service/omni-search";
import {itemBodyRestriction} from "../model/kramdown";
import {newWriteKey, type CaptureDeps, type ICaptureDialogHost} from "./capture-types";
import {getSessionDraft, setSessionDraft} from "../model/capture-draft";
import {mountLvAiThinkingCard} from "../libs/lv-notice-kit";

export function openCaptureFormDialog(
    hostInstance: ICaptureDialogHost,
    deps: CaptureDeps,
    defaultText: string,
    defaultType: ItemType,
    sourceBlockId: string | null,
    overrides?: {
        title?: string;
        alias?: string;
        shortcode?: string;
        docId?: string;
        targetBlockId?: string;
        tags?: string[];
        category?: string;
        sourceType?: "selection" | "block" | "doc-fragment" | "clipboard" | "manual" | "resource";
    }
): void {
    hostInstance.formOpen = true;
    const t = deps.t;
    let closed = false;
    let saving = false;
    let savedSuccessfully = false;
    let contentElRef: HTMLTextAreaElement | null = null;
    let titleElRef: HTMLInputElement | null = null;
    let aliasElRef: HTMLInputElement | null = null;
    let shortcodeElRef: HTMLInputElement | null = null;
    let tagsElRef: HTMLInputElement | null = null;
    let categoryElRef: HTMLInputElement | null = null;
    let typeSelectRef: HTMLSelectElement | null = null;
    const formWriteKey = newWriteKey("form");
    let tidySeq = 0;
    let draftSeq = 0;
    let tidyAbort: AbortController | null = null;
    let draftAbort: AbortController | null = null;
    let tidyThinkingHandle: ReturnType<typeof mountLvAiThinkingCard> | null = null;
    let draftThinkingHandle: ReturnType<typeof mountLvAiThinkingCard> | null = null;
    const cleanupAiWaiters = (): void => {
        if (tidyAbort) {
            tidyAbort.abort();
            tidyAbort = null;
        }
        if (draftAbort) {
            draftAbort.abort();
            draftAbort = null;
        }
        if (tidyThinkingHandle) {
            tidyThinkingHandle.destroy();
            tidyThinkingHandle = null;
        }
        if (draftThinkingHandle) {
            draftThinkingHandle.destroy();
            draftThinkingHandle = null;
        }
    };
    const isMobileModal = isMobileDialogViewport();
    const dialog = new Dialog({
        title: t("newItem"),
        content: "",
        width: isMobileModal ? "100vw" : "min(620px, 92vw)",
        height: isMobileModal ? "100dvh" : "min(860px, 92vh)",
        destroyCallback: () => {
            if (!savedSuccessfully && contentElRef) {
                const draftVal = contentElRef.value.trim();
                if (draftVal.length > 0) {
                    setSessionDraft({
                        content: contentElRef.value,
                        title: titleElRef?.value,
                        alias: aliasElRef?.value,
                        shortcode: shortcodeElRef?.value,
                        tags: tagsElRef?.value,
                        category: categoryElRef?.value,
                        type: typeSelectRef?.value as ItemType,
                    });
                }
            }
            closed = true;
            hostInstance.formOpen = false;
            hostInstance.currentDialog = null;
            if (typeof window !== "undefined" && window.visualViewport) {
                window.visualViewport.removeEventListener("resize", handleViewport);
                window.visualViewport.removeEventListener("scroll", handleViewport);
            }
            ++tidySeq;
            ++draftSeq;
            cleanupAiWaiters();
        },
    });
    hostInstance.currentDialog = dialog;
    const container = dialog.element.querySelector(".b3-dialog__container") as HTMLElement | null;
    container?.classList.add("xlc-form-host", "xlc-capture-host");
    mountPlatformDialogTitleWrap(dialog.element, t("newItem"));
    adaptSecondaryDialogForMobile(dialog, t("close"));

    // 移动端虚拟键盘避让（动态计算高度偏移，防遮挡操作区）
    const handleViewport = () => {
        if (!container || typeof window === "undefined" || !window.visualViewport) return;
        const offset = Math.max(0, window.innerHeight - window.visualViewport.height);
        container.style.paddingBottom = offset > 0 ? `${offset + 12}px` : "";
    };
    if (typeof window !== "undefined" && window.visualViewport) {
        window.visualViewport.addEventListener("resize", handleViewport);
        window.visualViewport.addEventListener("scroll", handleViewport, { passive: true });
    }
    const body = getDialogBody(dialog.element);
    if (!body) {
        hostInstance.formOpen = false;
        dialog.destroy();
        return;
    }
    body.innerHTML = "";
    const form = document.createElement("div");
    form.className = "xlc-form xlc-capture";
    const intro = document.createElement("p");
    intro.className = "xlc-page-intro";
    intro.textContent = t("captureIntro");
    form.appendChild(intro);

    const field = (label: string, value: string, isArea: boolean, cls: string, parent?: HTMLElement): HTMLInputElement | HTMLTextAreaElement => {
        const wrap = document.createElement("label");
        wrap.className = "xlc-form-field";
        const fieldId = `xlc-capture-field-${cls.replace(/[^a-z0-9_-]/gi, "_")}`;
        wrap.htmlFor = fieldId;
        const cap = document.createElement("span");
        cap.className = "xlc-form-label";
        cap.textContent = label;
        wrap.appendChild(cap);
        const inputEl = isArea
            ? document.createElement("textarea")
            : document.createElement("input");
        inputEl.id = fieldId;
        inputEl.setAttribute("aria-label", label);
        if (isArea) {
            (inputEl as HTMLTextAreaElement).rows = 6;
            inputEl.style.resize = "vertical";
            inputEl.style.minHeight = "130px";
            inputEl.style.maxHeight = "50vh";
        }
        inputEl.className = "b3-text-field " + cls;
        (inputEl as HTMLInputElement).value = value;
        wrap.appendChild(inputEl);
        (parent ?? form).appendChild(wrap);
        return inputEl as HTMLInputElement;
    };

    // 类型
    const metaRow = document.createElement("div");
    metaRow.className = "xlc-form-row";
    const typeWrap = document.createElement("label");
    typeWrap.className = "xlc-form-field xlc-form-field--fixed";
    const typeSelectId = "xlc-capture-field-type";
    typeWrap.htmlFor = typeSelectId;
    const typeLabel = document.createElement("span");
    typeLabel.className = "xlc-form-label";
    typeLabel.textContent = t("type");
    typeWrap.appendChild(typeLabel);
    const typeSelect = document.createElement("select");
    typeSelect.id = typeSelectId;
    typeSelect.className = "b3-select xlc-form-type";
    typeSelect.dataset.xlcControl = "capture.type";
    typeSelect.setAttribute("aria-label", t("type"));
    for (const it of ["text", "markdown", "url", "code", "image", "asset", "blockref", "structure"] as ItemType[]) {
        const opt = document.createElement("option");
        opt.value = it;
        opt.textContent = t(`type.${it}`);
        if (it === defaultType) opt.selected = true;
        typeSelect.appendChild(opt);
    }
    let userExplicitlySetType = Boolean(defaultType && defaultType !== "text");
    typeSelect.addEventListener("change", () => {
        userExplicitlySetType = true;
    });
    typeWrap.appendChild(typeSelect);
    metaRow.appendChild(typeWrap);

    const contentEl = field(t("contentLabel"), defaultText, true, "xlc-form-content");
    contentEl.dataset.xlcControl = "capture.content";
    const contentWrap = contentEl.parentElement as HTMLElement;
    const contentError = document.createElement("span");
    contentError.className = "xlc-form-error";
    contentError.id = "xlc-capture-content-error";
    contentError.setAttribute("role", "alert");
    contentError.hidden = true;
    contentWrap.appendChild(contentError);
    const counterEl = document.createElement("span");
    counterEl.className = "xlc-form-counter";
    if (typeof counterEl.setAttribute === "function") {
        counterEl.setAttribute("role", "status");
        counterEl.setAttribute("aria-live", "polite");
    }
    counterEl.textContent = `${(contentEl as HTMLTextAreaElement).value.length} / ${LIMITS.contentChars}`;
    contentWrap.appendChild(counterEl);

    // 变量快捷插入条
    void import(/* webpackChunkName: "variable-form" */ "./variable-form").then(({buildVariableBar}) => {
        if (closed) return;
        const varbar = buildVariableBar(t, () => contentEl as HTMLTextAreaElement);
        (contentEl.parentElement as HTMLElement)?.after(varbar);
    }).catch(() => undefined);

    const titleEl = field(t("title"), overrides?.title ?? "", false, "xlc-form-title");
    titleEl.dataset.xlcControl = "capture.title";
    form.appendChild(metaRow);
    const aliasEl = field(t("alias"), overrides?.alias ?? "", false, "xlc-form-alias", metaRow);
    aliasEl.dataset.xlcControl = "capture.alias";
    metaRow.insertBefore(aliasEl.parentElement as HTMLElement, typeWrap);

    // 智能别名推荐胶囊
    const aliasHint = document.createElement("div");
    aliasHint.className = "xlc-form-hint xlc-alias-hint";
    aliasHint.style.marginTop = "3px";
    aliasHint.style.display = "none";
    (aliasEl.parentElement as HTMLElement).appendChild(aliasHint);

    const syncAliasRecommendation = () => {
        const currentTitle = (titleEl as HTMLInputElement).value.trim();
        const currentAlias = (aliasEl as HTMLInputElement).value.trim();
        if (!currentTitle) {
            aliasHint.style.display = "none";
            return;
        }
        const meta = deriveOmniItemMetadata({
            title: currentTitle,
            content: (contentEl as HTMLTextAreaElement).value || "",
        } as any);
        const rec = meta.recommendedAlias?.trim();
        if (rec && rec !== currentAlias) {
            aliasHint.textContent = "";
            const tipLabel = document.createElement("span");
            tipLabel.textContent = "⚡ 推荐别名：";
            const pill = document.createElement("button");
            pill.type = "button";
            pill.className = "xlc-quick-pill";
            pill.textContent = rec;
            pill.title = `点击填入推荐别名「${rec}」`;
            pill.setAttribute("aria-label", pill.title);
            pill.addEventListener("click", () => {
                (aliasEl as HTMLInputElement).value = rec;
                (aliasEl as HTMLInputElement).dispatchEvent(new Event("input", {bubbles: true}));
                aliasHint.style.display = "none";
            });
            aliasHint.append(tipLabel, pill);
            aliasHint.style.display = "flex";
            aliasHint.style.alignItems = "center";
            aliasHint.style.gap = "4px";
        } else {
            aliasHint.style.display = "none";
        }
    };

    titleEl.addEventListener("input", syncAliasRecommendation);
    setTimeout(syncAliasRecommendation, 0);

    // 别名实时查重防抖反馈
    let aliasCheckTimer: any = null;
    aliasEl.addEventListener("input", () => {
        if (aliasCheckTimer) clearTimeout(aliasCheckTimer);
        aliasCheckTimer = setTimeout(async () => {
            const currentAlias = (aliasEl as HTMLInputElement).value.trim();
            if (!currentAlias) {
                syncAliasRecommendation();
                return;
            }
            if (deps.checkAliasConflict) {
                const res = await deps.checkAliasConflict(currentAlias);
                if (res.conflict) {
                    aliasHint.textContent = `⚠️ 该别名已被「${res.itemTitle || "其他条目"}」占用`;
                    aliasHint.style.color = "var(--xlc-warm-ink)";
                    aliasHint.style.display = "block";
                    return;
                }
            }
            aliasHint.style.color = "";
            syncAliasRecommendation();
        }, 150);
    });

    // 标签 + 分类
    const tagRow = document.createElement("div");
    tagRow.className = "xlc-form-row";
    const autoTags = defaultType !== "code" ? extractKramdownNativeTags(defaultText) : [];
    const mergedInitialTags = Array.from(new Set([...(overrides?.tags ?? []), ...autoTags]));
    const initialTags = mergedInitialTags.length > 0 ? mergedInitialTags.join("; ") : "";
    const tagsEl = field(t("tags"), initialTags, false, "xlc-form-tags", tagRow);
    tagsEl.dataset.xlcControl = "capture.tags";
    const tagsHint = document.createElement("span");
    tagsHint.className = "xlc-form-hint";
    tagsHint.textContent = t("tagsHint");
    (tagsEl.parentElement as HTMLElement).appendChild(tagsHint);

    const existingTags = deps.getExistingTags?.() ?? [];
    if (existingTags.length > 0) {
        const tagPillsWrap = document.createElement("div");
        tagPillsWrap.className = "xlc-capture-quick-tags";
        if (typeof tagPillsWrap.setAttribute === "function") {
            tagPillsWrap.setAttribute("role", "toolbar");
            tagPillsWrap.setAttribute("aria-label", "常用标签快捷填充栏");
        }
        tagPillsWrap.addEventListener("keydown", (e: any) => {
            const pills = Array.from(tagPillsWrap.querySelectorAll<HTMLButtonElement>(".xlc-quick-pill"));
            if (pills.length <= 1) return;
            const curIdx = pills.indexOf(document.activeElement as HTMLButtonElement);
            if (curIdx === -1) return;
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                pills[(curIdx + 1) % pills.length]?.focus();
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                pills[(curIdx - 1 + pills.length) % pills.length]?.focus();
            } else if (e.key === "Home") {
                e.preventDefault();
                pills[0]?.focus();
            } else if (e.key === "End") {
                e.preventDefault();
                pills[pills.length - 1]?.focus();
            }
        });
        for (const tag of existingTags) {
            const pill = document.createElement("button");
            pill.type = "button";
            pill.className = "xlc-quick-pill";
            pill.textContent = "+" + tag;
            pill.title = `点击追加标签「${tag}」`;
            pill.setAttribute("aria-label", pill.title);
            pill.addEventListener("click", () => {
                const cur = (tagsEl as HTMLInputElement).value.trim();
                const tagList = cur ? cur.split(/[,，;；、\s]+/).filter(Boolean) : [];
                if (!tagList.includes(tag)) {
                    tagList.push(tag);
                    (tagsEl as HTMLInputElement).value = tagList.join("; ");
                    (tagsEl as HTMLInputElement).dispatchEvent(new Event("input", {bubbles: true}));
                }
            });
            tagPillsWrap.appendChild(pill);
        }
        (tagsEl.parentElement as HTMLElement).appendChild(tagPillsWrap);
    }

    const categoryEl = field(t("category"), overrides?.category ?? "", false, "xlc-form-category", tagRow);
    categoryEl.dataset.xlcControl = "capture.category";
    (categoryEl.parentElement as HTMLElement).classList.add("xlc-form-field--fixed");

    const existingCats = deps.getExistingCategories?.() ?? [];
    if (existingCats.length > 0) {
        categoryEl.setAttribute("list", "xlc-capture-category-list");
        const catDatalist = document.createElement("datalist");
        catDatalist.id = "xlc-capture-category-list";
        for (const cat of existingCats) {
            const opt = document.createElement("option");
            opt.value = cat;
            catDatalist.appendChild(opt);
        }
        (categoryEl.parentElement as HTMLElement).appendChild(catDatalist);
    }
    form.appendChild(tagRow);

    const shortcodeEl = field(t("shortcode") || "简码 (:shortcode)", overrides?.shortcode ?? "", false, "xlc-form-shortcode");
    shortcodeEl.dataset.xlcControl = "capture.shortcode";
    (shortcodeEl as HTMLInputElement).placeholder = t("shortcodePlaceholder") || "如 :wk、:bug（选填，搜索框输入即置顶直达）";

    contentElRef = contentEl as HTMLTextAreaElement;
    titleElRef = titleEl as HTMLInputElement;
    aliasElRef = aliasEl as HTMLInputElement;
    shortcodeElRef = shortcodeEl as HTMLInputElement;
    tagsElRef = tagsEl as HTMLInputElement;
    categoryElRef = categoryEl as HTMLInputElement;
    typeSelectRef = typeSelect;

    // 会话草稿一键恢复条
    const currentDraft = getSessionDraft();
    if (currentDraft && !defaultText && currentDraft.content.trim()) {
        const draft = currentDraft;
        const draftBanner = document.createElement("div");
        draftBanner.className = "xlc-draft-resume-banner";
        if (typeof draftBanner.setAttribute === "function") {
            draftBanner.setAttribute("role", "region");
            draftBanner.setAttribute("aria-label", "未保存草稿提示");
        }
        draftBanner.style.display = "flex";
        draftBanner.style.alignItems = "center";
        draftBanner.style.justifyContent = "space-between";
        draftBanner.style.padding = "6px 12px";
        draftBanner.style.background = "var(--xlc-warm)";
        draftBanner.style.color = "var(--xlc-warm-ink)";
        draftBanner.style.borderRadius = "var(--xlc-radius-sm)";
        draftBanner.style.fontSize = "var(--xlc-font-sm)";
        draftBanner.style.marginBottom = "8px";

        const textSpan = document.createElement("span");
        textSpan.textContent = `📝 检测到上次未保存的内容草稿（${draft.content.length} 字符）`;
        draftBanner.appendChild(textSpan);

        const btnWrap = document.createElement("div");
        btnWrap.style.display = "flex";
        btnWrap.style.gap = "6px";
        if (typeof btnWrap.setAttribute === "function") {
            btnWrap.setAttribute("role", "toolbar");
            btnWrap.setAttribute("aria-label", "草稿操作栏");
        }

        const resumeBtn = document.createElement("button");
        resumeBtn.type = "button";
        resumeBtn.className = "b3-button b3-button--text";
        resumeBtn.style.padding = "2px 8px";
        resumeBtn.textContent = "恢复草稿";
        if (typeof resumeBtn.setAttribute === "function") {
            resumeBtn.setAttribute("aria-label", "恢复上次未保存的内容草稿");
        }
        resumeBtn.addEventListener("click", () => {
            if (contentElRef) {
                contentElRef.value = draft.content;
                contentElRef.dispatchEvent(new Event("input", {bubbles: true}));
            }
            if (draft.title && titleElRef && !titleElRef.value) {
                titleElRef.value = draft.title;
            }
            if (draft.alias && aliasElRef) aliasElRef.value = draft.alias;
            if (draft.shortcode && shortcodeElRef) shortcodeElRef.value = draft.shortcode;
            if (draft.tags && tagsElRef) tagsElRef.value = draft.tags;
            if (draft.category && categoryElRef) categoryElRef.value = draft.category;
            if (draft.type && typeSelectRef) typeSelectRef.value = draft.type;
            setSessionDraft(null);
            draftBanner.remove();
            deps.notify("info", "已恢复未保存草稿");
        });
        btnWrap.appendChild(resumeBtn);

        const discardBtn = document.createElement("button");
        discardBtn.type = "button";
        discardBtn.className = "b3-button b3-button--text";
        discardBtn.style.padding = "2px 8px";
        discardBtn.textContent = "放弃";
        if (typeof discardBtn.setAttribute === "function") {
            discardBtn.setAttribute("aria-label", "放弃草稿");
        }
        discardBtn.addEventListener("click", () => {
            setSessionDraft(null);
            draftBanner.remove();
        });
        btnWrap.appendChild(discardBtn);

        draftBanner.appendChild(btnWrap);
        form.insertBefore(draftBanner, form.firstChild);
    }

    const hint = document.createElement("div");
    hint.className = "xlc-form-hint";
    hint.textContent = t("captureHint");
    form.appendChild(hint);
    if (deps.getLibraryName) {
        void deps.getLibraryName().then((name) => {
            if (closed || !name) return;
            hint.textContent = `${t("captureHint")} · ${t("captureHintLib", name)}`;
        }).catch(() => undefined);
    }

    const flagContentError = (message: string): void => {
        contentEl.classList.add("xlc-input--error");
        contentEl.setAttribute("aria-invalid", "true");
        contentEl.setAttribute("aria-describedby", contentError.id);
        contentError.textContent = message;
        contentError.hidden = false;
        (contentEl as HTMLTextAreaElement).focus();
    };
    contentEl.addEventListener("input", () => {
        contentEl.classList.remove("xlc-input--error");
        contentEl.removeAttribute("aria-invalid");
        contentEl.removeAttribute("aria-describedby");
        contentError.hidden = true;
        contentError.textContent = "";

        const curLen = (contentEl as HTMLTextAreaElement).value.length;
        counterEl.textContent = `${curLen} / ${LIMITS.contentChars}`;
        counterEl.classList.toggle("xlc-form-counter--over", curLen > LIMITS.contentChars);

        const val = (contentEl as HTMLTextAreaElement).value.trim();
        if (val && !userExplicitlySetType) {
            const detected = inferTypeFromText(val);
            if (detected !== typeSelect.value) {
                typeSelect.value = detected;
            }
        }
        if (!(titleEl as HTMLInputElement).value.trim() && val) {
            const firstLine = val.replace(/^#+\s*/, "").split("\n")[0]?.trim() || "";
            if (firstLine) {
                (titleEl as HTMLInputElement).placeholder = `推荐标题: ${firstLine.slice(0, 30)}`;
            }
        }
    });

    const sugrow = document.createElement("div");
    sugrow.className = "xlc-sugrow";
    sugrow.style.display = "none";
    if (typeof sugrow.setAttribute === "function") {
        sugrow.setAttribute("role", "region");
        sugrow.setAttribute("aria-label", "AI整理建议栏");
    }
    const sugText = document.createElement("span");
    sugrow.appendChild(sugText);
    const adoptBtn = document.createElement("button");
    adoptBtn.type = "button";
    adoptBtn.className = "xlc-sugrow-adopt";
    adoptBtn.dataset.xlcControl = "capture.ai.suggestion.adopt";
    if (typeof adoptBtn.setAttribute === "function") {
        adoptBtn.setAttribute("aria-label", t("adoptAll") || "一键采纳所有建议");
    }
    let suggestions: {title?: string; alias?: string; tags?: string[]; category?: string} = {};
    const applySuggestions = (): void => {
        if (closed || Object.keys(suggestions).length === 0) return;
        if (suggestions.title) (titleEl as HTMLInputElement).value = suggestions.title;
        if (suggestions.alias) (aliasEl as HTMLInputElement).value = suggestions.alias;
        if (suggestions.tags?.length) (tagsEl as HTMLInputElement).value = suggestions.tags.join(", ");
        if (suggestions.category) (categoryEl as HTMLInputElement).value = suggestions.category;
        deps.notify("info", t("aiApplied"));
    };
    adoptBtn.textContent = t("adoptAll");
    adoptBtn.addEventListener("click", applySuggestions);
    sugrow.appendChild(adoptBtn);
    form.insertBefore(sugrow, titleEl.parentElement as Node);

    if (deps.aiEnabled()) {
        const contentLabel = (contentEl.parentElement as HTMLElement).querySelector(".xlc-form-label");
        if (contentLabel) {
            const tidyBtn = document.createElement("button");
            tidyBtn.className = "xlc-form-ai";
            tidyBtn.type = "button";
            tidyBtn.dataset.xlcControl = "capture.ai.tidy";
            tidyBtn.textContent = "✦ " + t("aiTidy");
            const tidyThinkingHost = document.createElement("div");
            tidyThinkingHost.className = "xlc-ai-thinking-host";
            tidyThinkingHost.dataset.xlcControl = "capture.ai.tidy.thinking";
            tidyThinkingHost.hidden = true;
            (contentEl.parentElement as HTMLElement).appendChild(tidyThinkingHost);
            const tidyFailure = document.createElement("div");
            tidyFailure.className = "xlc-ai-failure";
            tidyFailure.hidden = true;
            const tidyFailureMessage = document.createElement("span");
            tidyFailureMessage.className = "xlc-form-error";
            tidyFailureMessage.dataset.xlcControl = "capture.ai.tidy.error";
            tidyFailureMessage.setAttribute("role", "alert");
            tidyFailureMessage.setAttribute("aria-live", "assertive");
            tidyFailure.appendChild(tidyFailureMessage);
            const tidyRetryBtn = document.createElement("button");
            tidyRetryBtn.type = "button";
            tidyRetryBtn.className = "xlc-form-ai xlc-ai-retry";
            tidyRetryBtn.dataset.xlcControl = "capture.ai.tidy.retry";
            tidyRetryBtn.textContent = t("retry");
            tidyFailure.appendChild(tidyRetryBtn);
            (contentEl.parentElement as HTMLElement).appendChild(tidyFailure);
            let tidyBusy = false;
            const syncTidyButton = (): void => { tidyBtn.disabled = tidyBusy || !(contentEl as HTMLTextAreaElement).value.trim(); };
            contentEl.addEventListener("input", syncTidyButton);
            syncTidyButton();
            const clearTidyFailure = (): void => {
                tidyFailure.hidden = true;
                tidyFailureMessage.textContent = "";
            };
            const showTidyFailure = (message: string): void => {
                tidyFailureMessage.textContent = message || t("aiTransport");
                tidyFailure.hidden = false;
            };
            const finishTidyThinking = (handle: ReturnType<typeof mountLvAiThinkingCard> | null, ctrl: AbortController): void => {
                if (tidyThinkingHandle === handle) {
                    handle?.done();
                    tidyThinkingHandle = null;
                } else {
                    handle?.destroy();
                }
                if (tidyAbort === ctrl) {
                    tidyAbort = null;
                }
                tidyThinkingHost.hidden = true;
            };
            const runTidy = (): void => {
                if (closed || tidyBusy) return;
                const value = (contentEl as HTMLTextAreaElement).value.trim();
                if (!value) {
                    deps.notify("error", t("invalidItem"));
                    return;
                }
                clearTidyFailure();
                suggestions = {};
                sugText.textContent = "";
                sugrow.style.display = "none";
                const request = ++tidySeq;
                tidyBusy = true;
                syncTidyButton();
                tidyBtn.textContent = t("aiWorking");
                tidyAbort?.abort();
                const ctrl = new AbortController();
                tidyAbort = ctrl;
                tidyThinkingHost.hidden = false;
                const handle = mountLvAiThinkingCard(tidyThinkingHost, {
                    scenario: "transform",
                    compact: true,
                    title: `✦ ${t("aiTidy")}`,
                    cancelLabel: `⏹ ${t("cancel")}`,
                    signal: ctrl.signal,
                    onCancel: () => {
                        ctrl.abort();
                        if (closed || request !== tidySeq) return;
                        ++tidySeq;
                        finishTidyThinking(handle, ctrl);
                        tidyBtn.textContent = "✦ " + t("aiTidy");
                        tidyBusy = false;
                        syncTidyButton();
                        deps.notify("info", t("aiCancelled"));
                    },
                });
                tidyThinkingHandle = handle;
                void deps.aiTidy(value, {signal: ctrl.signal}).then((result) => {
                    if (closed || request !== tidySeq || ctrl.signal.aborted) {
                        finishTidyThinking(handle, ctrl);
                        return;
                    }
                    finishTidyThinking(handle, ctrl);
                    tidyBtn.textContent = "✦ " + t("aiTidy");
                    tidyBusy = false;
                    syncTidyButton();
                    if (!result.ok) {
                        showTidyFailure(result.message || "");
                        return;
                    }
                    suggestions = result;
                    sugText.textContent = "";
                    const lead = document.createElement("span");
                    lead.textContent = "✦ " + t("aiSuggestion") + "：";
                    sugText.appendChild(lead);
                    if (result.title) {
                        const titleEl = document.createElement("b");
                        titleEl.textContent = result.title;
                        sugText.appendChild(titleEl);
                    }
                    const parts = [
                        result.alias ? `${t("alias")}：${result.alias}` : "",
                        result.tags?.length ? `${t("tags")}：${result.tags.join("/")}` : "",
                        result.category ? `${t("category")}：${result.category}` : "",
                    ].filter(Boolean);
                    if (parts.length) {
                        const tail = document.createElement("span");
                        tail.textContent = (result.title ? " · " : "") + parts.join(" · ");
                        sugText.appendChild(tail);
                    }
                    sugrow.style.display = "";
                }).catch((err: unknown) => {
                    finishTidyThinking(handle, ctrl);
                    if (closed || request !== tidySeq || ctrl.signal.aborted) return;
                    tidyBtn.textContent = "✦ " + t("aiTidy");
                    tidyBusy = false;
                    syncTidyButton();
                    showTidyFailure(formatAiError(err, t));
                });
            };
            tidyBtn.addEventListener("click", runTidy);
            tidyRetryBtn.addEventListener("click", runTidy);
            contentLabel.appendChild(tidyBtn);
        }

        const draftWrap = document.createElement("div");
        draftWrap.className = "xlc-form-field";
        const draftLabel = document.createElement("span");
        draftLabel.className = "xlc-form-label";
        draftLabel.textContent = t("aiDraft");
        draftWrap.appendChild(draftLabel);
        const draftBtn = document.createElement("button");
        draftBtn.type = "button";
        draftBtn.className = "xlc-form-ai";
        draftBtn.dataset.xlcControl = "capture.ai.draft.generate";
        draftBtn.textContent = "✦ " + t("aiDraftDesc");
        draftLabel.appendChild(draftBtn);
        const draftInput = document.createElement("input");
        draftInput.className = "b3-text-field";
        draftInput.dataset.xlcControl = "capture.ai.draft.description";
        draftInput.placeholder = t("aiDraftDesc");
        draftWrap.appendChild(draftInput);
        const draftThinkingHost = document.createElement("div");
        draftThinkingHost.className = "xlc-ai-thinking-host";
        draftThinkingHost.dataset.xlcControl = "capture.ai.draft.thinking";
        draftThinkingHost.hidden = true;
        draftWrap.appendChild(draftThinkingHost);
        const draftFailure = document.createElement("div");
        draftFailure.className = "xlc-ai-failure";
        draftFailure.hidden = true;
        const draftFailureMessage = document.createElement("span");
        draftFailureMessage.className = "xlc-form-error";
        draftFailureMessage.dataset.xlcControl = "capture.ai.draft.error";
        draftFailureMessage.setAttribute("role", "alert");
        draftFailureMessage.setAttribute("aria-live", "assertive");
        draftFailure.appendChild(draftFailureMessage);
        const draftRetryBtn = document.createElement("button");
        draftRetryBtn.type = "button";
        draftRetryBtn.className = "xlc-form-ai xlc-ai-retry";
        draftRetryBtn.dataset.xlcControl = "capture.ai.draft.retry";
        draftRetryBtn.textContent = t("retry");
        draftFailure.appendChild(draftRetryBtn);
        draftWrap.appendChild(draftFailure);
        let draftBusy = false;
        draftBtn.disabled = true;
        const syncDraftButton = (): void => { draftBtn.disabled = draftBusy || !draftInput.value.trim(); };
        draftInput.addEventListener("input", syncDraftButton);
        const clearDraftFailure = (): void => {
            draftFailure.hidden = true;
            draftFailureMessage.textContent = "";
        };
        const showDraftFailure = (message: string): void => {
            draftFailureMessage.textContent = message || t("aiTransport");
            draftFailure.hidden = false;
        };
        const finishDraftThinking = (handle: ReturnType<typeof mountLvAiThinkingCard> | null, ctrl: AbortController): void => {
            if (draftThinkingHandle === handle) {
                handle?.done();
                draftThinkingHandle = null;
            } else {
                handle?.destroy();
            }
            if (draftAbort === ctrl) {
                draftAbort = null;
            }
            draftThinkingHost.hidden = true;
        };
        const runDraft = (): void => {
            if (closed || draftBusy) return;
            const desc = draftInput.value.trim();
            if (!desc) {
                deps.notify("error", t("aiDraftNeedDescription"));
                draftInput.focus();
                return;
            }
            if (draftBtn.disabled) return;
            clearDraftFailure();
            draftBusy = true;
            syncDraftButton();
            const request = ++draftSeq;
            draftBtn.textContent = t("aiWorking");
            draftAbort?.abort();
            const ctrl = new AbortController();
            draftAbort = ctrl;
            draftThinkingHost.hidden = false;
            const handle = mountLvAiThinkingCard(draftThinkingHost, {
                scenario: "transform",
                compact: true,
                title: `✦ ${t("aiDraft")}`,
                cancelLabel: `⏹ ${t("cancel")}`,
                signal: ctrl.signal,
                onCancel: () => {
                    ctrl.abort();
                    if (closed || request !== draftSeq) return;
                    ++draftSeq;
                    finishDraftThinking(handle, ctrl);
                    draftBtn.textContent = "✦ " + t("aiDraftDesc");
                    draftBusy = false;
                    syncDraftButton();
                    deps.notify("info", t("aiCancelled"));
                },
            });
            draftThinkingHandle = handle;
            void deps.aiDraft(desc, {signal: ctrl.signal}).then((result) => {
                if (closed || request !== draftSeq || ctrl.signal.aborted) {
                    finishDraftThinking(handle, ctrl);
                    return;
                }
                finishDraftThinking(handle, ctrl);
                draftBtn.textContent = "✦ " + t("aiDraftDesc");
                draftBusy = false;
                syncDraftButton();
                if (!result.ok) {
                    showDraftFailure((result as any).message || t("aiTransport"));
                    return;
                }
                const contentBox = contentEl as HTMLTextAreaElement;
                if (contentBox.value.trim()) {
                    confirm(t("aiDraft"), t("aiDraftOverwrite"), () => {
                        contentBox.value = result.text;
                        contentBox.dispatchEvent(new Event("input", {bubbles: true}));
                    });
                    return;
                }
                contentBox.value = result.text;
                contentBox.dispatchEvent(new Event("input", {bubbles: true}));
            }).catch((err: unknown) => {
                finishDraftThinking(handle, ctrl);
                if (closed || request !== draftSeq || ctrl.signal.aborted) return;
                draftBtn.textContent = "✦ " + t("aiDraftDesc");
                draftBusy = false;
                syncDraftButton();
                showDraftFailure(formatAiError(err, t));
            });
        };
        draftBtn.addEventListener("click", runDraft);
        draftRetryBtn.addEventListener("click", runDraft);
        form.insertBefore(draftWrap, form.firstChild);
    }

    const actions = document.createElement("div");
    actions.className = "xlc-form-actions";
    if (typeof actions.setAttribute === "function") {
        actions.setAttribute("role", "toolbar");
        actions.setAttribute("aria-label", "捕获表单操作栏");
    }
    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "b3-button";
    cancelBtn.dataset.xlcControl = "capture.cancel";
    cancelBtn.textContent = t("cancel");
    if (typeof cancelBtn.setAttribute === "function") {
        cancelBtn.setAttribute("aria-label", t("cancel") || "取消新建");
    }
    cancelBtn.addEventListener("click", () => {
        closed = true;
        ++tidySeq;
        ++draftSeq;
        cleanupAiWaiters();
        dialog.destroy();
    });
    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "b3-button xlc-btn-primary";
    saveBtn.dataset.xlcControl = "capture.save";
    saveBtn.textContent = t("save");
    if (typeof saveBtn.setAttribute === "function") {
        saveBtn.setAttribute("aria-label", t("save") || "保存常用语");
    }

    actions.addEventListener("keydown", (e: any) => {
        const buttons = [cancelBtn, saveBtn].filter((b) => !b.disabled);
        if (buttons.length <= 1) return;
        const curIdx = buttons.indexOf(document.activeElement as HTMLButtonElement);
        if (curIdx === -1) return;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            buttons[(curIdx + 1) % buttons.length]?.focus();
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            buttons[(curIdx - 1 + buttons.length) % buttons.length]?.focus();
        } else if (e.key === "Home") {
            e.preventDefault();
            buttons[0]?.focus();
        } else if (e.key === "End") {
            e.preventDefault();
            buttons[buttons.length - 1]?.focus();
        }
    });

    const submitOnEnter = (el: HTMLInputElement): void => {
        el.addEventListener("keydown", (ev) => {
            if (ev.isComposing || ev.keyCode === 229 || ev.repeat) return;
            if (ev.key === "Enter" && !ev.altKey && !ev.ctrlKey && !ev.metaKey) {
                ev.preventDefault();
                saveBtn.click();
            }
        });
    };
    [titleEl, aliasEl, shortcodeEl, tagsEl, categoryEl].forEach((el) => submitOnEnter(el as HTMLInputElement));
    form.addEventListener("keydown", (ev) => {
        if (ev.isComposing || (ev as KeyboardEvent).keyCode === 229 || (ev as KeyboardEvent).repeat) return;
        if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) {
            ev.preventDefault();
            saveBtn.click();
            return;
        }
        if (ev.key === "Escape") {
            const val = contentElRef?.value?.trim() ?? "";
            if (val.length > 0 && !savedSuccessfully) {
                setSessionDraft({
                    content: contentElRef!.value,
                    title: titleElRef?.value,
                    alias: aliasElRef?.value,
                    shortcode: shortcodeElRef?.value,
                    tags: tagsElRef?.value,
                    category: categoryElRef?.value,
                    type: typeSelectRef?.value as ItemType,
                });
                deps.notify("info", "已自动暂存未保存草稿，下次新建可一键恢复");
            }
        }
    });
    saveBtn.addEventListener("click", () => {
        if (closed || saving) return;
        const contentValue = (contentEl as HTMLTextAreaElement).value;
        if (!contentValue.trim() && !(typeSelect.value === "blockref" && overrides?.targetBlockId)) {
            flagContentError(t("captureContentRequired"));
            deps.notify("error", t("captureContentRequired"));
            return;
        }
        const type = typeSelect.value as ItemType;
        if (type === "blockref" && !overrides?.targetBlockId) {
            deps.notify("error", t("blockrefNeedsTarget"));
            return;
        }
        let markdown = type === "blockref" && !contentValue.trim() && overrides?.targetBlockId
            ? `((${overrides.targetBlockId}))` : contentValue;
        if (type === "code" && !/^```/.test(contentValue.trim())) {
            markdown = "```\n" + contentValue + "\n```";
        } else if (type === "url") {
            markdown = contentValue.trim();
            if (!isSafeHttpUrl(markdown)) {
                flagContentError(t("captureUrlInvalid"));
                deps.notify("error", t("captureUrlInvalid"));
                return;
            }
        }
        if (itemBodyRestriction(markdown)) {
            const message = markdown.length > LIMITS.contentChars
                ? t("aiContentTooLong", String(LIMITS.contentChars)) : t("multiBlockPendingHint");
            flagContentError(message);
            deps.notify("error", message);
            return;
        }
        saving = true;
        saveBtn.disabled = true;
        saveBtn.textContent = t("checkingDuplicate");
        cancelBtn.disabled = true;
        const doSave = (): void => {
            if (closed) return;
            saving = true;
            saveBtn.disabled = true;
            saveBtn.textContent = t("saving");
            cancelBtn.disabled = true;
            const docId = overrides && "docId" in overrides
                ? overrides.docId
                : overrides?.sourceType === "clipboard" ? undefined : (deps.currentDocId ? deps.currentDocId() : undefined);
            const rawShortcode = (shortcodeEl as HTMLInputElement).value.trim();
            const rawAlias = (aliasEl as HTMLInputElement).value.trim();
            const resolvedShortcode = rawShortcode
                ? cleanShortcode(rawShortcode)
                : (rawAlias.startsWith(":") ? cleanShortcode(rawAlias) : "");
            const parsedAnnotation = parseSnippetAnnotations(markdown);
            let finalTitle = (titleEl as HTMLInputElement).value.trim();
            let finalTags = (tagsEl as HTMLInputElement).value ? (tagsEl as HTMLInputElement).value.split(/[,，、;；\s]+/).map((s) => s.trim()).filter(Boolean) : [];
            let finalMarkdown = markdown;
            if (parsedAnnotation.tags.length > 0 || parsedAnnotation.title) {
                if (!finalTitle && parsedAnnotation.title) {
                    finalTitle = parsedAnnotation.title;
                }
                for (const t of parsedAnnotation.tags) {
                    if (!finalTags.includes(t)) finalTags.push(t);
                }
                if (parsedAnnotation.cleanText && parsedAnnotation.cleanText.trim()) {
                    finalMarkdown = parsedAnnotation.cleanText.trim();
                }
            }
            void deps.createItem({
                itemType: type,
                markdown: finalMarkdown,
                title: finalTitle || undefined,
                alias: (aliasEl as HTMLInputElement).value || undefined,
                ...(resolvedShortcode ? {shortcode: resolvedShortcode} : {}),
                tags: finalTags.length > 0 ? finalTags : undefined,
                category: (categoryEl as HTMLInputElement).value || undefined,
                url: type === "url" ? markdown : undefined,
                targetBlockId: overrides?.targetBlockId,
                source: (docId || sourceBlockId || overrides?.sourceType)
                    ? {
                        sourceDocId: docId ?? "",
                        sourceBlockId: sourceBlockId ?? "",
                        sourceType: overrides?.sourceType ?? (sourceBlockId ? "selection" : "manual"),
                    }
                    : undefined,
            }, {idempotencyKey: formWriteKey}).then((result) => {
                saving = false;
                if (result.ok) {
                    savedSuccessfully = true;
                    setSessionDraft(null);
                    closed = true;
                    dialog.destroy();
                } else {
                    saving = false;
                    saveBtn.disabled = false;
                    saveBtn.textContent = t("save");
                    cancelBtn.disabled = false;
                    deps.notify("error", result.message);
                }
            }).catch((err: unknown) => {
                saving = false;
                if (closed) return;
                saveBtn.disabled = false;
                saveBtn.textContent = t("save");
                cancelBtn.disabled = false;
                deps.notify("error", t("kernelError", toErrorMessage(err)));
            });
        };
        void deps.findDuplicate(contentValue).then((dup) => {
            if (closed) return;
            if (!dup) {
                saving = false;
                doSave();
                return;
            }
            saving = false;
            saveBtn.disabled = false;
            saveBtn.textContent = t("save");
            cancelBtn.disabled = false;
            confirm("⚠️ " + t("duplicateTitle"), t("duplicateConfirm", dup.title), () => {
                if (!closed) doSave();
            });
        }).catch((err: unknown) => {
            if (closed) return;
            saving = false;
            saveBtn.disabled = false;
            saveBtn.textContent = t("save");
            cancelBtn.disabled = false;
            deps.notify("error", t("kernelError", toErrorMessage(err)));
        });
    });
    actions.appendChild(cancelBtn);
    actions.appendChild(saveBtn);
    form.appendChild(actions);
    body.appendChild(form);
    (contentEl as HTMLTextAreaElement).focus();
}
