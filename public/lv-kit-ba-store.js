/* lv-kit-ba-store v200 */
var __LV_KIT_CHUNK_EXPORT__=(()=>{var Je=Object.defineProperty;var on=Object.getOwnPropertyDescriptor;var sn=Object.getOwnPropertyNames;var ln=Object.prototype.hasOwnProperty;var cn=(x,b)=>{for(var d in b)Je(x,d,{get:b[d],enumerable:!0})},dn=(x,b,d,he)=>{if(b&&typeof b=="object"||typeof b=="function")for(let ce of sn(b))!ln.call(x,ce)&&ce!==d&&Je(x,ce,{get:()=>b[ce],enumerable:!(he=on(b,ce))||he.enumerable});return x};var pn=x=>dn(Je({},"__esModule",{value:!0}),x);var fn={};cn(fn,{createBaStoreChunk:()=>kt,default:()=>gn});var un=`.lv-bam-mobile-mask {
    position: fixed;
    inset: 0;
    z-index: 99996;
    background: rgba(15, 23, 42, 0.28);
    touch-action: none;
}
.lv-bam-group-header {
    padding: 6px 10px 3px;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: var(--lv-safe-text-muted, #64748b);
    user-select: none;
    flex-shrink: 0;
}
.lv-bam-group-header--danger {
    color: var(--b3-theme-error, #ef4444);
}
.lv-bam-divider {
    height: 1px;
    margin: 5px 6px;
    background: var(--lv-safe-border, rgba(15, 23, 42, 0.12));
    flex-shrink: 0;
}
.lv-bam-badge--pinned {
    font-size: 10px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 999px;
    background: rgba(245, 158, 11, 0.16);
    color: #d97706;
    flex-shrink: 0;
}
.lv-bam .lv-bam-item:hover,
.lv-bam .lv-bam-item:focus-visible {
    background: color-mix(in srgb, var(--b3-theme-primary, #6366f1) 10%, transparent);
    outline: none;
}
.lv-bam .lv-bam-item--danger:hover,
.lv-bam .lv-bam-item--danger:focus-visible {
    background: rgba(239, 68, 68, 0.1);
}
@media (max-width: 640px), (pointer: coarse) {
    .lv-bam {
        max-width: calc(100vw - 24px) !important;
        max-height: 70dvh !important;
    }
    .lv-bam .lv-bam-item,
    .lv-bam .lv-bam-store-btn {
        min-height: 44px !important;
        padding: 8px 12px !important;
        font-size: 13px !important;
    }
    #lv-shared-block-capsule.lv-shared-ba-capsule {
        padding: 3px 6px;
        gap: 4px;
    }
    #lv-shared-block-capsule .lv-shared-ba-capsule__trigger,
    #lv-shared-block-capsule .lv-shared-ba-capsule__quick-btn {
        min-height: 44px;
        min-width: 44px;
        justify-content: center;
        padding: 6px 10px;
        font-size: 12.5px;
    }
}
@media (max-width: 640px) {
    #lv-block-action-store-mask .lv-action-store-modal {
        width: calc(100vw - 12px) !important;
        max-width: calc(100vw - 12px) !important;
        max-height: 94dvh !important;
        border-radius: 14px !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
    }
    #lv-block-action-store-mask .lv-store-header,
    #lv-block-action-store-mask .lv-store-dblclick-bar,
    #lv-block-action-store-mask .lv-store-pinned-dock,
    #lv-block-action-store-mask .lv-store-filter-bar,
    #lv-block-action-store-mask .lv-store-footer {
        flex-shrink: 0 !important;
    }
    #lv-block-action-store-mask .lv-store-header,
    #lv-block-action-store-mask .lv-store-dblclick-bar,
    #lv-block-action-store-mask .lv-store-pinned-dock,
    #lv-block-action-store-mask .lv-store-filter-bar,
    #lv-block-action-store-mask .lv-store-content,
    #lv-block-action-store-mask .lv-store-footer {
        padding-left: 14px !important;
        padding-right: 14px !important;
        box-sizing: border-box !important;
        max-width: 100% !important;
    }
    #lv-block-action-store-mask .lv-store-header {
        flex-wrap: wrap !important;
        gap: 8px !important;
        padding-top: 12px !important;
        padding-bottom: 10px !important;
    }
    #lv-block-action-store-mask .lv-store-close-btn {
        min-width: 44px !important;
        min-height: 44px !important;
    }
    #lv-block-action-store-mask .lv-store-dblclick-select {
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100% !important;
        min-height: 40px !important;
    }
    #lv-block-action-store-mask .lv-store-dock-slots {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
    #lv-block-action-store-mask .lv-store-search-row {
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 8px !important;
    }
    #lv-block-action-store-mask .lv-store-search-input {
        min-height: 40px !important;
        font-size: 16px !important;
        box-sizing: border-box !important;
    }
    #lv-block-action-store-mask .lv-store-status-pills {
        width: 100% !important;
        flex-wrap: wrap !important;
    }
    #lv-block-action-store-mask .lv-store-status-btn {
        flex: 1 1 auto !important;
        min-height: 36px !important;
        text-align: center !important;
    }
    #lv-block-action-store-mask .lv-store-custom-row-main,
    #lv-block-action-store-mask .lv-store-custom-row-type {
        grid-template-columns: 1fr !important;
    }
    #lv-block-action-store-mask .lv-custom-param-box {
        flex-direction: column !important;
    }
    #lv-block-action-store-mask .lv-store-custom-drawer input,
    #lv-block-action-store-mask .lv-store-custom-drawer select {
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
        min-height: 40px !important;
        font-size: 16px !important;
    }
    #lv-block-action-store-mask .lv-store-content {
        grid-template-columns: 1fr !important;
        padding-top: 12px !important;
        padding-bottom: 12px !important;
        min-height: 240px !important;
        flex: 1 0 auto !important;
        overflow-y: visible !important;
    }
    #lv-block-action-store-mask .lv-action-store-card {
        min-width: 0 !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
    }
    #lv-block-action-store-mask .lv-store-footer {
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 8px !important;
    }
    #lv-block-action-store-mask .lv-store-footer > div {
        flex-wrap: wrap !important;
        justify-content: space-between !important;
    }
    #lv-block-action-store-mask .lv-store-scan-btn,
    #lv-block-action-store-mask .lv-store-reset-btn {
        flex: 1 1 auto !important;
        min-height: 40px !important;
    }
    #lv-block-action-store-mask .lv-store-save-btn {
        width: 100% !important;
        min-height: 44px !important;
    }
}

.lv-bam {
    position: fixed;
    z-index: 99997;
    min-width: 240px;
    max-width: 340px;
    max-height: 68vh;
    overflow-y: auto;
    padding: 6px;
    border-radius: var(--b3-border-radius, 6px);
    background: var(--b3-menu-background, var(--b3-theme-surface, #ffffff));
    color: var(--b3-theme-on-surface, var(--b3-theme-on-background, #222222));
    border: 1px solid var(--b3-border-color, var(--b3-theme-surface-lighter, rgba(128, 128, 128, 0.22)));
    box-shadow: var(--b3-dialog-shadow, 0 4px 14px rgba(0, 0, 0, 0.12));
    font-family: var(--b3-font-family, inherit);
    display: flex;
    flex-direction: column;
    gap: 4px;
    box-sizing: border-box;
}
.lv-bam--dense {
    min-width: 440px;
    max-width: 500px;
}
.lv-bam__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 5px 8px 7px;
    border-bottom: 1px solid var(--b3-border-color, rgba(128, 128, 128, 0.18));
    font-size: 12px;
    font-weight: 600;
    color: var(--b3-theme-on-surface, var(--b3-theme-on-background, #222222));
    flex-shrink: 0;
}
.lv-bam__meta-tag {
    font-size: 11px;
    font-weight: 500;
    color: var(--b3-theme-on-surface-light, var(--b3-theme-on-surface, #6c6c6c));
}
.lv-bam__readonly-tag {
    font-size: 11px;
    color: var(--b3-card-warning-color, #d97706);
    font-weight: 600;
}
.lv-bam__quick-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px 8px;
    border-bottom: 1px solid var(--b3-border-color, rgba(128, 128, 128, 0.14));
    overflow-x: auto;
    flex-shrink: 0;
}
.lv-bam__quick-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: var(--b3-border-radius, 6px);
    border: 1px solid var(--b3-border-color, rgba(128, 128, 128, 0.22));
    background: transparent;
    color: var(--b3-theme-on-surface, var(--b3-theme-on-background, #222222));
    cursor: pointer;
    font-size: 11.5px;
    line-height: 1.35;
    white-space: nowrap;
    flex-shrink: 0;
}
.lv-bam__quick-btn:hover,
.lv-bam__quick-btn:focus-visible {
    background: var(--b3-list-hover, rgba(128, 128, 128, 0.1));
    outline: none;
}
.lv-bam__kbd-num {
    font-size: 10px;
    color: var(--b3-theme-on-surface-light, var(--b3-theme-on-surface, #6c6c6c));
    opacity: 0.8;
}
.lv-bam__grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2px;
    flex-shrink: 0;
}
.lv-bam--dense .lv-bam__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 3px;
}
.lv-bam .lv-bam-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border: none;
    background: transparent;
    color: var(--b3-theme-on-surface, var(--b3-theme-on-background, #222222));
    border-radius: var(--b3-border-radius, 6px);
    cursor: pointer;
    text-align: left;
    font-size: 12.5px;
    font-family: var(--b3-font-family, inherit);
    width: 100%;
    box-sizing: border-box;
}
.lv-bam .lv-bam-item--danger {
    color: var(--b3-theme-error, #d23f31);
}
.lv-bam .lv-bam-item:hover,
.lv-bam .lv-bam-item:focus-visible {
    background: var(--b3-list-hover, rgba(128, 128, 128, 0.1));
    outline: none;
}
.lv-bam .lv-bam-item--danger:hover,
.lv-bam .lv-bam-item--danger:focus-visible {
    background: color-mix(in srgb, var(--b3-theme-error, #d23f31) 10%, transparent);
}
.lv-bam__item-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
}
.lv-bam__item-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.lv-bam__item-sub {
    font-size: 11px;
    color: var(--b3-theme-on-surface-light, var(--b3-theme-on-surface, #6c6c6c));
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.lv-bam__section-count {
    margin-left: 6px;
    font-size: 10.5px;
    font-weight: 500;
    color: var(--b3-theme-on-surface-light, var(--b3-theme-on-surface, #6c6c6c));
}
.lv-bam__footer {
    padding: 5px 8px 2px;
    border-top: 1px solid var(--b3-border-color, rgba(128, 128, 128, 0.14));
    font-size: 11px;
    color: var(--b3-theme-on-surface-light, var(--b3-theme-on-surface, #6c6c6c));
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-shrink: 0;
}
@media (max-width: 640px), (pointer: coarse) {
    .lv-bam,
    .lv-bam--dense {
        min-width: 240px !important;
        max-width: calc(100vw - 24px) !important;
    }
    .lv-bam--dense .lv-bam__grid {
        grid-template-columns: 1fr !important;
    }
}
`;function kt(x){let b=x.window,d=x.document,he=x.localStorage,ce=x.Date||globalThis.Date,mn=x.fetch,Et=x.CustomEvent,Be=x.setTimeout,Tt=x.clearTimeout,Xe=x.requestAnimationFrame,Ye=x.cancelAnimationFrame,At=x.PROTOCOL_VERSION??200,q=x.escapeHtml,Ze=x.lvSurfaceStack,Lt=x.getSharedLaunchpadRegistry,Ct=x.isMobileFrontend,i=x.showMessage,_=x.lvKernelPost,$t=x.mountLvAiThinkingCard,et=x.queryActiveProtyle,tt=x.lvConfirm,Bt=x.lvPrompt,St=x.openQuickWorkspaceConfig,Se=x.readBlockAssistantEnabled,Mt=x.setBlockAssistantEnabledInternal,Ae=x.readCustomActionsFromStorage,He=x.writeCustomActionsToStorage,nt=x.DEFAULT_DOUBLE_CLICK_ACTION_ID,xe=x.DOUBLE_CLICK_ACTION_DISABLED,rt=x.DEFAULT_PINNED_ACTION_IDS,at=x.DEFAULT_ENABLED_ACTION_IDS,Pe=x.normalizeDoubleClickActionId,_e=x.readStoreConfigFromStorage,ot=x.writeStoreConfigToStorage,ie=x.sharedBlockActions,zt=x.blockAssistantOwners,Ht=x.ensureNoticeKitAiHubMounted,W=x.getCleanBlockText,it=x.isInsidePluginReviewOrPreviewSubtree,Pt=x.isExcludedBlockAssistElement,st=x.cancelPendingCapsuleSchedule||(()=>{}),lt=x.unmountSharedCapsule||(()=>{}),ct=x.isReadOnlySafeBlockAction,dt=x.buildBlockSnapshot,C=x.queryBlockElementById,Le=(o,e)=>Ot(o,e),qe=(o,e)=>It(o,e),Oe=o=>Kt(o),Ie=(o,e)=>Nt(o,e),se=x.getBlockAssistantHub,Ke=x.removeDetachedBodyPortalById,Ne=x.removeDetachedBodyPortalsBySelector,we=null,_t=()=>{if(we){let o=we;we=null;try{o()}catch{}}Ke("lv-block-focus-highlight-overlay")},qt=o=>{if(_t(),!o||typeof d>"u"||!d.body||typeof o.getBoundingClientRect!="function")return;let e=o.getBoundingClientRect();if(!e||e.width<=0||e.height<=0)return;let n=d.createElement("div");n.id="lv-block-focus-highlight-overlay",n.style.cssText=`position:fixed;left:${Math.round(e.left)}px;top:${Math.round(e.top)}px;width:${Math.round(e.width)}px;height:${Math.round(e.height)}px;border:2px solid var(--b3-theme-primary,#3575f0);border-radius:6px;pointer-events:none;z-index:99980;`,d.body.appendChild(n);let t=null,r=()=>{t!==null&&(Tt(t),t=null),we===r&&(we=null);try{d.removeEventListener("scroll",r,!0)}catch{}try{b?.removeEventListener?.("scroll",r),b?.removeEventListener?.("resize",r)}catch{}try{n.remove()}catch{}};we=r,t=Be(r,1200);try{d.addEventListener("scroll",r,{capture:!0,passive:!0}),b?.addEventListener?.("scroll",r,{passive:!0}),b?.addEventListener?.("resize",r,{passive:!0})}catch{}},ue=x.lvSafeCopyToClipboard,Y=x.isBlockOrProtyleReadOnly,Re=()=>{x.ensureStyles?.(),x.injectChunkStyles?.("lv-kit-ba-store",un)};Re();async function Ot(o,e){try{let r=(await _("/api/block/getBlockKramdown",{id:o}))?.data?.kramdown;if(typeof r=="string"&&r.trim())return r.replace(/\{:[^}]*\}\s*$/g,"").trim()}catch{}if(e)return W(e);let n=C(o);return W(n)}function It(o,e){if(!o||typeof o!="string")return"";let n=[],t=s=>(n.push(s),`@@LV_TOKEN_${n.length-1}@@`),r=o.replace(/(`[^`]+`|\$[^\$]+\$)/g,t);r=r.replace(/(!?\[[^\]]*\]\([^)]+\))/g,t),r=r.replace(/(\(\([0-9a-z\-]+(?:\s+["'][^"']*["'])?\)\))/g,t);let a=e(r);for(let s=n.length-1;s>=0;s--)a=a.replace(`@@LV_TOKEN_${s}@@`,n[s]??"");return a}let Ee=[{id:"paragraph",name:"普通正文",glyph:"¶",shortcut:"0",category:"basic",description:"常规段落文本，清除标题与列表符号",formatMarkdown:o=>o},{id:"task",name:"待办任务",glyph:"☑",shortcut:"T",category:"basic",description:"带复选框的任务清单项 (* [ ])",formatMarkdown:o=>`* [ ] ${o}`},{id:"list",name:"无序列表",glyph:"•",shortcut:"U",category:"basic",description:"圆点项目符号无序列表 (*)",formatMarkdown:o=>`* ${o}`},{id:"ordered-list",name:"有序列表",glyph:"1.",shortcut:"O",category:"basic",description:"递增数字顺序列表 (1.)",formatMarkdown:o=>`1. ${o}`},{id:"h1",name:"一级标题",glyph:"H1",shortcut:"1",category:"heading",description:"最高级别大纲章节标题 (#)",formatMarkdown:o=>`# ${o}`},{id:"h2",name:"二级标题",glyph:"H2",shortcut:"2",category:"heading",description:"核心分区次级标题 (##)",formatMarkdown:o=>`## ${o}`},{id:"h3",name:"三级标题",glyph:"H3",shortcut:"3",category:"heading",description:"小节与知识点标题 (###)",formatMarkdown:o=>`### ${o}`},{id:"h4",name:"四级标题",glyph:"H4",shortcut:"4",category:"heading",description:"细分小标题 (####)",formatMarkdown:o=>`#### ${o}`},{id:"h5",name:"五级标题",glyph:"H5",shortcut:"5",category:"heading",description:"五级辅助段标 (#####)",formatMarkdown:o=>`##### ${o}`},{id:"h6",name:"六级标题",glyph:"H6",shortcut:"6",category:"heading",description:"六级末级段标 (######)",formatMarkdown:o=>`###### ${o}`},{id:"quote",name:"引述高亮",glyph:"❝",shortcut:"Q",category:"container",description:"带侧边线的引文/重点批注块 (>)",formatMarkdown:o=>o.split(/\r?\n/).map(e=>e.trim()?`> ${e}`:">").join(`
`)},{id:"callout",name:"提示块",glyph:"💡",shortcut:"N",category:"container",description:"带高亮背景与图标的提示容器 (> [!NOTE])",formatMarkdown:o=>`> [!NOTE]
> ${o}`},{id:"code",name:"代码块",glyph:"</>",shortcut:"C",category:"container",description:"等宽代码高亮容器 (```)",formatMarkdown:o=>"```\n"+o+"\n```"},{id:"math",name:"数学公式",glyph:"∑",shortcut:"M",category:"container",description:"LaTeX 块级居中数学公式 ($$)",formatMarkdown:o=>`$$
`+o+`
$$`},{id:"superblock",name:"超级块",glyph:"⊞",shortcut:"S",category:"container",description:"将块包装为超级块布局容器 ({{{ ... }}})",formatMarkdown:o=>`{{{
${o}
}}}`}];function Kt(o){if(!o||typeof o!="string")return"";let e=o.replace(/\{:[^}]*\}\s*$/g,"").trim(),n=e.match(/^\{\{\{(?:row|col)?\s*\r?\n([\s\S]*?)\r?\n\}\}\}$/);if(n)return Oe((n[1]??"").trim());let t=e.match(/^```[^\r\n]*\r?\n([\s\S]*?)\r?\n?```$/);if(t)return(t[1]??"").trim();let r=e.match(/^\$\$[\s\r\n]*([\s\S]*?)[\s\r\n]*\$\$$/);return r?(r[1]??"").trim():(/^>\s*/m.test(e)&&(e=e.replace(/^>\s*\[![^\]]+\]\s*\r?\n?/i,""),e=e.split(/\r?\n/).map(a=>a.replace(/^>\s?/,"")).join(`
`).trim()),e=e.replace(/^([-*+]\s*\[[ xX]\]\s*)/,""),e=e.replace(/^([-*+]\s+)/,""),e=e.replace(/^(\d+\.\s+)/,""),e=e.replace(/^(#{1,6}\s+)/,""),e.trim())}function Nt(o,e){if(o){let n=o.getAttribute("data-type"),t=o.getAttribute("data-subtype");if(n==="NodeSuperBlock")return"superblock";if(n==="NodeHeading")return t&&/^h[1-6]$/i.test(t)?t.toLowerCase():"h1";if(n==="NodeCallout")return"callout";if(n==="NodeBlockquote")return"quote";if(n==="NodeCodeBlock")return"code";if(n==="NodeMathBlock")return"math";let r=o.closest('[data-type="NodeListItem"]');if(r){let a=r.getAttribute("data-subtype");if(r.classList.contains("protyle-action--task")||!!r.querySelector(".protyle-action--task")||a==="t"||o.classList.contains("protyle-action--task"))return"task";if(a==="o")return"ordered-list";if(a==="u")return"list"}}if(e){let n=e.replace(/\{:[^}]*\}\s*$/g,"").trim();if(/^\{\{\{(?:row|col)?\s*\r?\n/.test(n))return"superblock";if(/^```/.test(n))return"code";if(/^\$\$/.test(n))return"math";if(/^>\s*\[!/i.test(n))return"callout";if(/^>\s*/.test(n))return"quote";if(/^#{1,6}\s+/.test(n)){let t=n.match(/^(#{1,6})/);return`h${t&&t[1]?t[1].length:1}`}if(/^[-*+]\s*\[[ xX]\]/.test(n))return"task";if(/^\d+\.\s+/.test(n))return"ordered-list";if(/^[-*+]\s+/.test(n))return"list"}return"paragraph"}async function Fe(o,e,n){let t=Ee.find(a=>a.id===e);if(!t)return!1;let r=n?.showMessageFn||((a,s,p)=>{try{b.siyuan?.showMessage?.(a,s,p)}catch{}});try{let a=C(o);if(Y(o,a))return r("当前文档处于只读状态，已拦截块类型转换",2e3,"info"),!1;let s=a?.closest?.('[data-type="NodeListItem"]'),p=a?.closest?.('[data-type="NodeList"]'),m=["task","list","ordered-list"].includes(e),f=o,y=!1;if(s){let k=p?Array.from(p.querySelectorAll(':scope > [data-type="NodeListItem"]')):[];m?f=s.getAttribute("data-node-id")||o:k.length<=1&&p?f=p.getAttribute("data-node-id")||o:(f=s.getAttribute("data-node-id")||o,y=!0)}let $="";if(n?.readMarkdownFn?$=await n.readMarkdownFn(f):$=await Le(f,a),Ie(a,$)===e)return r(`当前块已经是【${t.name}】`,1800,"info"),!0;let F=Oe($);!F&&a&&(F=W(a));let E=t.formatMarkdown(F),v={};if(n?.getBlockAttrsFn)try{v=await n.getBlockAttrsFn(o)||{}}catch{}else try{let k=await _("/api/attr/getBlockAttrs",{id:o});k&&k.code===0&&k.data&&(v={...k.data})}catch{}if(f!==o)if(n?.getBlockAttrsFn)try{let k=await n.getBlockAttrsFn(f);k&&(v={...k,...v})}catch{}else try{let k=await _("/api/attr/getBlockAttrs",{id:f});k&&k.code===0&&k.data&&(v={...k.data,...v})}catch{}if(a)for(let k of Array.from(a.attributes))(k.name.startsWith("custom-")||["bookmark","name","alias","memo","style"].includes(k.name))&&!v[k.name]&&k.value&&(v[k.name]=k.value);let T={};for(let[k,U]of Object.entries(v))k!=="id"&&k!=="updated"&&U!=null&&U!==""&&(T[k]=String(U));let I=f;if(y&&p){let k=p.getAttribute("data-node-id")||"",G=(await _("/api/block/insertBlock",{previousID:k,dataType:"markdown",data:E}))?.data?.[0]?.doOperations?.[0]?.id;if(G)I=G,await _("/api/block/deleteBlock",{id:f});else throw new Error("抽离列表项插入新块失败")}else n?.updateBlockFn?await n.updateBlockFn("markdown",E,f):await _("/api/block/updateBlock",{id:f,dataType:"markdown",data:E}),I=f;if(Object.keys(T).length>0)if(n?.setBlockAttrsFn)try{await n.setBlockAttrsFn(I,T)}catch{}else try{await _("/api/attr/setBlockAttrs",{id:I,attrs:T})}catch{}return r(`已将块转换为【${t.name}】`,1800,"info"),!0}catch(a){return r(`转换块类型失败: ${a?.message||"未知原因"}`,2200,"error"),!1}}function pt(o,e,n,t){if(typeof d>"u")return()=>{};let r=d.getElementById("lv-block-type-picker-root");if(r)try{r.remove()}catch{}let a=e||C(o),s=Ie(a),p=typeof b<"u"&&b.innerWidth<=640,m=d.createElement("div");m.id="lv-block-type-picker-root",m.style.cssText=`
        position: fixed;
        inset: 0;
        z-index: 99998;
        pointer-events: none;
    `;let f=d.createElement("div");f.className="lv-block-type-picker b3-menu",f.setAttribute("role","dialog"),f.setAttribute("aria-label","转换块类型"),f.style.cssText=`
        position: fixed;
        z-index: 99999;
        pointer-events: auto;
        width: ${p?"min(92vw, 360px)":"340px"};
        max-height: min(85vh, 520px);
        background: var(--b3-theme-surface, #ffffff);
        border: 1px solid var(--b3-theme-surface-lighter, rgba(140, 140, 140, 0.22));
        border-radius: 10px;
        box-shadow: 0 12px 30px -6px rgba(24, 24, 27, 0.16), 0 2px 8px rgba(24, 24, 27, 0.06);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        color: var(--b3-theme-on-surface, #1e293b);
        font-family: var(--b3-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
        animation: lvNoticeFadeIn 0.14s ease-out both;
    `,m.appendChild(f);let y=d.createElement("div");y.style.cssText=`
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 14px 8px;
        border-bottom: 1px solid var(--b3-theme-surface-lighter, rgba(0,0,0,0.06));
        background: color-mix(in srgb, var(--b3-theme-primary, #6366f1) 4%, var(--b3-theme-surface, #fff));
    `;let $=d.createElement("div");$.style.cssText="display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 13px;",$.innerHTML='<span style="font-size: 14px;">🔄</span><span>转换块类型</span>';let N=d.createElement("button");N.type="button",N.style.cssText=`
        border: none;
        background: transparent;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        color: var(--b3-theme-on-surface-light, #94a3b8);
        font-size: 13px;
        display: flex;
        align-items: center;
        justify-content: center;
    `,N.innerHTML="✕",N.addEventListener("click",()=>I()),y.appendChild($),y.appendChild(N),f.appendChild(y);let F=d.createElement("div");F.style.cssText="padding: 8px 12px 6px;";let E=d.createElement("input");E.type="text",E.placeholder="过滤类型或按快捷键 (0~6, T, U, Q, C...)",E.style.cssText=`
        width: 100%;
        box-sizing: border-box;
        border: 1px solid var(--b3-theme-surface-lighter, rgba(0,0,0,0.15));
        border-radius: 6px;
        padding: 6px 10px;
        font-size: 12px;
        background: var(--b3-theme-background, #f8fafc);
        color: var(--b3-theme-on-surface, #1e293b);
        outline: none;
        transition: border-color 0.15s ease;
    `,E.addEventListener("focus",()=>{E.style.borderColor="var(--b3-theme-primary, #6366f1)"}),E.addEventListener("blur",()=>{E.style.borderColor="var(--b3-theme-surface-lighter, rgba(0,0,0,0.15))"}),F.appendChild(E),f.appendChild(F);let v=d.createElement("div");v.style.cssText=`
        flex: 1;
        overflow-y: auto;
        padding: 4px 8px 8px;
        display: flex;
        flex-direction: column;
        gap: 2px;
    `,f.appendChild(v);let T=S=>{let j=S.target;j&&f.contains(j)||I()},I=()=>{try{m.remove()}catch{}b.removeEventListener("keydown",ve,!0),d.removeEventListener("pointerdown",T,!0)};d.addEventListener("pointerdown",T,!0);let k=async S=>{I(),n?await n(S):await Fe(o,S,t)},U=[...Ee],G=0,de=()=>{v.innerHTML="";let S=E.value.trim().toLowerCase();if(S?U=Ee.filter(B=>B.name.toLowerCase().includes(S)||B.description.toLowerCase().includes(S)||B.shortcut.toLowerCase()===S||B.id.toLowerCase().includes(S)):U=[...Ee],U.length===0){let B=d.createElement("div");B.style.cssText="text-align: center; color: var(--b3-theme-on-surface-light, #94a3b8); font-size: 12px; padding: 24px 0;",B.textContent="未找到匹配的块类型",v.appendChild(B);return}let j="";U.forEach((B,V)=>{if(!S&&B.category!==j){j=B.category;let H=d.createElement("div");H.style.cssText=`
                    font-size: 10.5px;
                    font-weight: 600;
                    color: var(--b3-theme-on-surface-light, #64748b);
                    padding: 6px 6px 2px;
                    letter-spacing: 0.5px;
                `,H.textContent=B.category==="basic"?"基础正文与列表":B.category==="heading"?"大纲层级标题":"结构容器与公式",v.appendChild(H)}let P=d.createElement("button");P.type="button",P.className="lv-morph-item",P.setAttribute("data-morph-type",B.id);let D=B.id===s,A=V===G;P.style.cssText=`
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 10px;
                border-radius: 6px;
                border: 1px solid ${A?"var(--b3-theme-primary, #6366f1)":"transparent"};
                background: ${A?"color-mix(in srgb, var(--b3-theme-primary, #6366f1) 8%, var(--b3-theme-surface))":"transparent"};
                color: var(--b3-theme-on-surface, #1e293b);
                cursor: pointer;
                text-align: left;
                width: 100%;
                box-sizing: border-box;
                transition: all 0.12s ease;
            `,P.addEventListener("mouseenter",()=>{G=V,ae()}),P.addEventListener("click",H=>{H.preventDefault(),H.stopPropagation(),k(B.id)});let z=d.createElement("span");z.style.cssText=`
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                border-radius: 5px;
                font-size: 12px;
                font-weight: 700;
                background: color-mix(in srgb, var(--b3-theme-primary, #6366f1) 12%, var(--b3-theme-surface));
                color: var(--b3-theme-primary, #6366f1);
                flex-shrink: 0;
            `,z.textContent=B.glyph,P.appendChild(z);let ge=d.createElement("div");ge.style.cssText="display: flex; flex-direction: column; flex: 1; min-width: 0; gap: 1px;";let le=d.createElement("span");le.style.cssText="font-size: 12px; font-weight: 600; line-height: 1.2;",le.textContent=B.name;let Q=d.createElement("span");if(Q.style.cssText="font-size: 11px; color: var(--b3-theme-on-surface-light, #64748b); line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;",Q.textContent=B.description,ge.appendChild(le),ge.appendChild(Q),P.appendChild(ge),D){let H=d.createElement("span");H.style.cssText=`
                    font-size: 10px;
                    padding: 1px 5px;
                    border-radius: 4px;
                    background: color-mix(in srgb, #10b981 16%, transparent);
                    color: #059669;
                    font-weight: 600;
                `,H.textContent="当前",P.appendChild(H)}else if(B.shortcut){let H=d.createElement("span");H.style.cssText=`
                    font-size: 10.5px;
                    font-weight: 600;
                    color: var(--b3-theme-on-surface-light, #94a3b8);
                    border: 1px solid var(--b3-theme-surface-lighter, rgba(0,0,0,0.12));
                    border-radius: 4px;
                    padding: 0 4px;
                    line-height: 1.4;
                    background: var(--b3-theme-background, #f1f5f9);
                `,H.textContent=B.shortcut,P.appendChild(H)}v.appendChild(P)})},ae=()=>{v.querySelectorAll(".lv-morph-item").forEach((j,B)=>{let V=B===G;j.style.borderColor=V?"var(--b3-theme-primary, #6366f1)":"transparent",j.style.background=V?"color-mix(in srgb, var(--b3-theme-primary, #6366f1) 8%, var(--b3-theme-surface))":"transparent",V&&j.scrollIntoView({block:"nearest"})})};E.addEventListener("input",()=>{G=0,de()});let ve=S=>{if(!(S.isComposing||S.keyCode===229)){if(S.key==="Escape"){S.preventDefault(),S.stopPropagation(),I();return}if(!S.ctrlKey&&!S.altKey&&!S.metaKey&&(!E.value.trim()||d.activeElement!==E)){let j=S.key.toUpperCase(),B=Ee.find(V=>V.shortcut===j);if(B){S.preventDefault(),S.stopPropagation(),k(B.id);return}}if(S.key==="ArrowDown"){S.preventDefault(),U.length>0&&(G=(G+1)%U.length,ae());return}if(S.key==="ArrowUp"){S.preventDefault(),U.length>0&&(G=(G-1+U.length)%U.length,ae());return}if(S.key==="Enter"){S.preventDefault();let j=U[G];j&&k(j.id);return}}};if(b.addEventListener("keydown",ve,!0),d.body.appendChild(m),de(),p)f.style.bottom="16px",f.style.left="50%",f.style.transform="translateX(-50%)";else if(a){let S=a.getBoundingClientRect(),j=340,B=360,V=S.bottom+6;V+B>b.innerHeight-12&&(V=Math.max(12,S.top-B-6));let P=S.left;P+j>b.innerWidth-12&&(P=Math.max(12,b.innerWidth-j-12)),f.style.top=`${V}px`,f.style.left=`${P}px`}else f.style.top="50%",f.style.left="50%",f.style.transform="translate(-50%, -50%)";return Be(()=>{try{E.focus()}catch{}},30),I}let Ue=async(o,e,n=!1)=>{try{let a=(await _("/api/block/getBlockKramdown",{id:o}))?.data?.kramdown;if(typeof a=="string"&&a.trim()){let s=a.replace(/\{:[^}]*\}\s*$/g,"").trim();if(n&&(s=s.replace(/\{:([^}]*)\}/g,(p,m)=>{let f=String(m||"").replace(/\bid="[^"]*"/g,"").trim();return f?`{: ${f}}`:""}).trim()),s)return s}}catch{}if(e&&typeof e.cleanText=="string"&&e.cleanText.trim())return e.cleanText.trim();let t=C(o);return W(t)},ut=()=>{[{id:"focus-block",group:"native",label:"聚焦当前块（沉浸专注）",subtitle:"作为临时根文档展开，沉浸编辑当前分支",glyph:"🔍",sourceType:"native",sourcePlugin:"思源原生",singleOnly:!0,installed:!0,preferredBlockKinds:["heading","paragraph","quote","code"],execute:async e=>{try{let n=b;n.siyuan?.ws?.send&&n.siyuan.ws.send("openFileById",{id:e,mode:0});let t=C(e);t&&(typeof t.scrollIntoView=="function"&&t.scrollIntoView({behavior:"smooth",block:"center"}),qt(t)),i("已聚焦定位当前块",1800,"info","块助手")}catch{i("聚焦失败",2e3,"error","块助手")}}},{id:"copy-embed-ref",group:"native",label:"复制为嵌入块",subtitle:"生成 {{blockID}} 动态嵌入块语法",glyph:"📦",sourceType:"native",sourcePlugin:"思源原生",supportsBatch:!0,installed:!0,preferredBlockKinds:["paragraph","heading","table"],execute:async(e,n,t)=>{let r=t&&t.length>1?t:[e],a=r.map(p=>`{{${p}}}`).join(`
`);await ue(a)?i(r.length>1?`已批量复制 ${r.length} 个嵌入块语法`:"已复制嵌入块语法 {{id}}",2e3,"info","块助手"):i("复制失败",2e3,"error","块助手")}},{id:"toggle-fold-block",group:"native",label:"折叠 / 展开子分支",subtitle:"仅对标题与列表块可用，严禁向引述/段落写入脏 fold 属性",glyph:"📂",sourceType:"native",sourcePlugin:"思源原生",singleOnly:!0,installed:!0,preferredBlockKinds:["heading","list"],excludedBlockKinds:["quote","paragraph","code","table","math"],isAvailable:e=>!e?.isDocument&&!e?.isReadOnly&&(e?.blockKind==="heading"||e?.blockKind==="list"||e?.blockKind==="task"||e?.blockKind==="ordered-list"),execute:async e=>{try{let n=C(e);if(Y(e,n)){i("当前文档处于只读状态，已拦截折叠修改",1800,"info","块助手");return}let r=n?.getAttribute("data-fold")==="1"||n?.getAttribute("fold")==="1"?"0":"1";await _("/api/attr/setBlockAttrs",{id:e,attrs:{fold:r}}),i(r==="1"?"已收起当前分支":"已展开当前分支",1800,"info","块助手")}catch(n){i(`折叠切换失败: ${n?.message||"未知原因"}`,2e3,"error","块助手")}}},{id:"morph-block-type",group:"native",label:"转换块类型",subtitle:"一键在段落/标题 H1–H6/无序·有序·待办列表/引述/代码块/超级块间切换",glyph:"🔄",sourceType:"native",sourcePlugin:"思源原生",singleOnly:!0,installed:!0,preferredBlockKinds:["paragraph","task","heading","list","quote","math","superblock"],excludedBlockKinds:["table","code"],isAvailable:e=>!e?.isDocument&&!e?.isReadOnly&&e?.blockKind!=="table"&&e?.blockKind!=="code",execute:async e=>{let n=C(e);if(Y(e,n)){i("当前文档处于只读状态，已拦截块类型转换",1800,"info","块助手");return}pt(e,n,async t=>{await Fe(e,t)})}},{id:"native-move-up",group:"organization",label:"上移一块（同级排序）",subtitle:"将当前块向上移动一行，重新编排顺序",glyph:"⬆️",sourceType:"native",sourcePlugin:"思源原生",singleOnly:!0,installed:!0,isAvailable:e=>!e?.isReadOnly,execute:async e=>{try{let n=C(e);if(Y(e,n)){i("当前文档处于只读状态，已拦截块移动",1800,"info","块助手");return}let t=n?.previousElementSibling,r=t?.getAttribute("data-node-id");if(n&&t&&r){let a=t.previousElementSibling?.getAttribute("data-node-id")||"",s=n.parentElement?.closest("[data-node-id]"),p=n.closest(".protyle")?.querySelector(".protyle-title"),m=n.closest(".protyle-wysiwyg")?.getAttribute("data-doc-id")||"",f=s?.getAttribute("data-node-id")||p?.getAttribute("data-node-id")||m,y=await _("/api/block/moveBlock",{id:e,previousID:a,parentID:f});if(y?.code!==0){i(`上移失败: ${y?.msg||"内核拒绝写入"}`,2e3,"error","块助手");return}i("已上移当前块",1500,"info","块助手")}else i("已处于同级最上方",1500,"info","块助手")}catch(n){i(`上移失败: ${n?.message||"未知"}`,2e3,"error","块助手")}}},{id:"native-move-down",group:"organization",label:"下移一块（同级排序）",subtitle:"将当前块向下移动一行，重新编排顺序",glyph:"⬇️",sourceType:"native",sourcePlugin:"思源原生",singleOnly:!0,installed:!0,isAvailable:e=>!e?.isReadOnly,execute:async e=>{try{let n=C(e);if(Y(e,n)){i("当前文档处于只读状态，已拦截块移动",1800,"info","块助手");return}let t=n?.nextElementSibling,r=t?.getAttribute("data-node-id");if(n&&t&&r){let a=n.parentElement?.closest("[data-node-id]"),s=n.closest(".protyle")?.querySelector(".protyle-title"),p=n.closest(".protyle-wysiwyg")?.getAttribute("data-doc-id")||"",m=a?.getAttribute("data-node-id")||s?.getAttribute("data-node-id")||p,f=await _("/api/block/moveBlock",{id:e,previousID:r,parentID:m});if(f?.code!==0){i(`下移失败: ${f?.msg||"内核拒绝写入"}`,2e3,"error","块助手");return}i("已下移当前块",1500,"info","块助手")}else i("已处于同级最下方",1500,"info","块助手")}catch(n){i(`下移失败: ${n?.message||"未知"}`,2e3,"error","块助手")}}},{id:"native-clone-block",group:"organization",label:"原地克隆副本",subtitle:"紧随当前块下方通过 dom 路径复制插入相同副本",glyph:"📑",sourceType:"native",sourcePlugin:"思源原生",singleOnly:!0,installed:!0,isAvailable:e=>!e?.isReadOnly,execute:async e=>{try{if(Y(e)){i("当前文档处于只读状态，已拦截克隆写入",1800,"info","块助手");return}let n="";try{let a=(await _("/api/block/getBlockDOM",{id:e}))?.data?.dom;typeof a=="string"&&a.trim()&&(n=a.replace(/\s+data-node-id=(?:"[^"]*"|'[^']*')/gi,""))}catch{}if(n&&(await _("/api/block/insertBlock",{dataType:"dom",data:n,previousID:e})).code===0){i("已原地克隆副本 (dom)",1800,"info","块助手");return}let t="";try{let a=(await _("/api/block/getBlockKramdown",{id:e}))?.data?.kramdown;typeof a=="string"&&a.trim()&&(t=a.replace(/\{:[^}]*\}\s*$/g,"").trim())}catch{}if(!t){let r=C(e);t=W(r)}if(t){let r=await _("/api/block/insertBlock",{dataType:"markdown",data:t,previousID:e});if(r?.code!==0){i(`克隆失败: ${r?.msg||"内核拒绝写入"}`,2e3,"error","块助手");return}i("已原地克隆副本",1800,"info","块助手")}else i("未能提取块内容进行克隆",2e3,"error","块助手")}catch(n){i(`克隆失败: ${n?.message||"未知"}`,2e3,"error","块助手")}}},{id:"copy-block-ref",group:"clipboard",label:"复制块引用",subtitle:"生成 ((id '锚文本')) 语法，多选时输出多行引用",glyph:"🔗",sourceType:"native",sourcePlugin:"思源原生",supportsBatch:!0,installed:!0,preferredBlockKinds:["heading","paragraph","table"],execute:async(e,n,t)=>{let r=t&&t.length>1?t:[e],a=[];for(let p of r){let m=C(p),f=(W(m).split(`
`)[0]||"").trim().slice(0,24).replace(/'/g,"’").replace(/\)\)/g,") )");a.push(f?`((${p} '${f}'))`:`((${p}))`)}await ue(a.join(`
`))?i(r.length>1?`已批量复制 ${r.length} 个块引用`:"已复制块引用",2e3,"info","块助手"):i("复制失败",2e3,"error","块助手")}},{id:"copy-plain-text",group:"clipboard",label:"复制纯文本",subtitle:"剥离 Markdown 语法标记，提取干净文本至剪贴板",glyph:"📋",sourceType:"native",sourcePlugin:"思源原生",supportsBatch:!0,installed:!0,preferredBlockKinds:["code","paragraph"],execute:async(e,n,t)=>{let r=t&&t.length>1?t:[e],a=[];for(let p of r){let m=C(p),f=W(m);f&&a.push(f)}if(a.length===0){i("当前块无纯文本内容可复制（图片块请使用块引用或遮挡制卡）",2200,"info","块助手");return}await ue(a.join(`

`))?i(r.length>1?`已批量复制 ${a.length} 个块的纯文本`:"已复制纯文本",2e3,"info","块助手"):i("复制失败",2e3,"error","块助手")}},{id:"copy-block-id",group:"clipboard",label:"复制纯块 ID",subtitle:"提取思源标准 22 位唯一块标识符至剪贴板",glyph:"🆔",sourceType:"native",sourcePlugin:"思源原生",supportsBatch:!0,installed:!0,execute:async(e,n,t)=>{let r=t&&t.length>1?t:[e];await ue(r.join(`
`))?i(r.length>1?`已复制 ${r.length} 个块 ID`:`已复制块 ID: ${e}`,1800,"info","块助手"):i("复制失败",2e3,"error","块助手")}},{id:"copy-block-content",group:"clipboard",label:"复制 Markdown",subtitle:"获取干净 Markdown（剥离尾行 IAL）写入剪贴板，只读文档安全可用",glyph:"📄",sourceType:"native",sourcePlugin:"思源原生",singleOnly:!0,readOnlySafe:!0,installed:!0,isAvailable:e=>!e?.isDocument,execute:async(e,n)=>{try{let t=await Ue(e,n);if(!t){i("当前块无内容可复制",1800,"info","块助手");return}await ue(t)?i("已复制 Markdown",1800,"info","块助手"):i("复制失败",2e3,"error","块助手")}catch(t){i(`复制 Markdown 失败: ${t?.message||"未知"}`,2e3,"error","块助手")}}},{id:"cut-block",group:"organization",label:"剪切块",subtitle:"先安全复制干净 Markdown 至剪贴板，确认成功后才移除当前块",glyph:"✂️",sourceType:"native",sourcePlugin:"思源原生",singleOnly:!0,readOnlySafe:!1,destructive:!0,installed:!0,isAvailable:e=>!e?.isDocument&&!e?.isReadOnly,execute:async(e,n)=>{try{let t=C(e);if(Y(e,t)){i("当前文档处于只读状态，已拦截剪切操作",1800,"info","块助手");return}let r=await Ue(e,n,!0);if(!r){i("未能提取块内容，已保留原块",2e3,"info","块助手");return}if(!await ue(r)){i("剪切失败：剪贴板写入未成功，已保留原块",2200,"error","块助手");return}st(),lt(!1),Ne(".lv-bam");let s=await _("/api/block/deleteBlock",{id:e});if(s?.code!==0){i(`剪切失败: ${s?.msg||"内核拒绝删除"}`,2e3,"error","块助手");return}i("已剪切当前块",1800,"info","块助手")}catch(t){i(`剪切失败: ${t?.message||"未知"}`,2e3,"error","块助手")}}},{id:"duplicate-block",group:"organization",label:"制作副本",subtitle:"剥离旧块 ID 属性并在下方插入干净 Markdown 副本",glyph:"📑",sourceType:"native",sourcePlugin:"思源原生",singleOnly:!0,readOnlySafe:!1,installed:!0,isAvailable:e=>!e?.isDocument&&!e?.isReadOnly,execute:async(e,n)=>{try{let t=C(e);if(Y(e,t)){i("当前文档处于只读状态，已拦截制作副本",1800,"info","块助手");return}let r=await Ue(e,n,!0);if(!r){i("未能提取块内容进行复制",2e3,"error","块助手");return}let a=await _("/api/block/insertBlock",{dataType:"markdown",data:r,previousID:e});if(a?.code!==0){i(`制作副本失败: ${a?.msg||"内核拒绝写入"}`,2e3,"error","块助手");return}i("已制作块副本",1800,"info","块助手")}catch(t){i(`制作副本失败: ${t?.message||"未知"}`,2e3,"error","块助手")}}},{id:"insert-block-above",group:"native",label:"上方插入块",subtitle:"在当前块正上方插入一个空白段落块",glyph:"⤴️",sourceType:"native",sourcePlugin:"思源原生",singleOnly:!0,readOnlySafe:!1,installed:!0,isAvailable:e=>!e?.isDocument&&!e?.isReadOnly,execute:async e=>{try{let n=C(e);if(Y(e,n)){i("当前文档处于只读状态，已拦截插入块",1800,"info","块助手");return}let t=await _("/api/block/insertBlock",{dataType:"markdown",data:"",nextID:e});if(t?.code!==0){i(`上方插入失败: ${t?.msg||"内核拒绝写入"}`,2e3,"error","块助手");return}i("已在上方插入新块",1600,"info","块助手")}catch(n){i(`上方插入失败: ${n?.message||"未知"}`,2e3,"error","块助手")}}},{id:"insert-block-below",group:"native",label:"下方插入块",subtitle:"在当前块正下方插入一个空白段落块",glyph:"⤵️",sourceType:"native",sourcePlugin:"思源原生",singleOnly:!0,readOnlySafe:!1,installed:!0,isAvailable:e=>!e?.isDocument&&!e?.isReadOnly,execute:async e=>{try{let n=C(e);if(Y(e,n)){i("当前文档处于只读状态，已拦截插入块",1800,"info","块助手");return}let t=await _("/api/block/insertBlock",{dataType:"markdown",data:"",previousID:e});if(t?.code!==0){i(`下方插入失败: ${t?.msg||"内核拒绝写入"}`,2e3,"error","块助手");return}i("已在下方插入新块",1600,"info","块助手")}catch(n){i(`下方插入失败: ${n?.message||"未知"}`,2e3,"error","块助手")}}},{id:"toggle-block-fold",group:"native",label:"折叠 / 展开子分支",subtitle:"仅对标题、列表与超级块可用，排除引述/段落避免写脏 fold 属性",glyph:"📂",sourceType:"native",sourcePlugin:"思源原生",singleOnly:!0,readOnlySafe:!1,installed:!0,preferredBlockKinds:["heading","list","task","ordered-list","superblock"],excludedBlockKinds:["quote","paragraph","code","table","math"],getDynamicLabel:e=>e?.isFolded?"展开子分支":"折叠子分支",isAvailable:e=>!e?.isDocument&&!e?.isReadOnly&&["heading","list","task","ordered-list","superblock"].includes(e?.blockKind||"paragraph"),execute:async e=>{try{let n=C(e);if(Y(e,n)){i("当前文档处于只读状态，已拦截折叠修改",1800,"info","块助手");return}let t=n?.getAttribute("fold")==="1"||n?.getAttribute("data-fold")==="1";try{let r=await _("/api/attr/getBlockAttrs",{id:e});r?.data&&typeof r.data.fold=="string"&&(t=r.data.fold==="1")}catch{}if(t){let r=await _("/api/block/unfoldBlock",{id:e});if(r?.code!==0){i(`展开失败: ${r?.msg||"内核拒绝写入"}`,2e3,"error","块助手");return}i("已展开当前块",1600,"info","块助手")}else{let r=await _("/api/block/foldBlock",{id:e});if(r?.code!==0){i(`折叠失败: ${r?.msg||"内核拒绝写入"}`,2e3,"error","块助手");return}i("已折叠当前块",1600,"info","块助手")}}catch(n){i(`折叠切换失败: ${n?.message||"未知"}`,2e3,"error","块助手")}}},{id:"delete-block",group:"native",label:"删除块",subtitle:"安全隐藏悬浮胶囊并调用内核接口删除当前块（只读文档拦截）",glyph:"🗑️",sourceType:"native",sourcePlugin:"思源原生",singleOnly:!0,readOnlySafe:!1,destructive:!0,installed:!0,isAvailable:e=>!e?.isDocument&&!e?.isReadOnly,execute:async e=>{try{let n=C(e);if(Y(e,n)){i("当前文档处于只读状态，已拦截删除块",1800,"info","块助手");return}st(),lt(!1),Ne(".lv-bam");let t=await _("/api/block/deleteBlock",{id:e});if(t?.code!==0){i(`删除块失败: ${t?.msg||"内核拒绝删除"}`,2e3,"error","块助手");return}i("已删除当前块",1600,"info","块助手")}catch(n){i(`删除块失败: ${n?.message||"未知"}`,2e3,"error","块助手")}}},{id:"edit-card-qa",group:"study",label:"闪卡制卡 / 属性问答",subtitle:"过 card-entry-gate 校验；属性问答专归闪卡 Alt+Q",glyph:"✏️",sourceType:"ecosystem",sourcePlugin:"小驴闪卡",sourcePluginId:"siyuan-lv-cards",requiresPlugin:"siyuan-lv-cards",featured:!0,badgeText:"闪卡 · Alt+Q",singleOnly:!0,preferredBlockKinds:["paragraph","quote"],execute:async e=>{let n=b,t=n.xiaolvCards||n.lvCards||n.siyuanCards;if(t&&typeof t.validateCardEntry=="function"){let a=await t.validateCardEntry({blockId:e,type:"edit-card-qa"});if(a&&a.ok===!1){i(a.reason||"已由 card-entry-gate 拦截无效制卡",2200,"info","块助手");return}}if(t&&typeof t.openCardQuestionDialog=="function"){t.openCardQuestionDialog(e);return}se().openMenu(e,C(e)||d.body)}},{id:"make-cloze",group:"study",label:"挖空制卡",subtitle:"仅存在选区文本时显出，过 card-entry-gate",glyph:"🎯",sourceType:"ecosystem",sourcePlugin:"小驴闪卡",sourcePluginId:"siyuan-lv-cards",requiresPlugin:"siyuan-lv-cards",singleOnly:!0,excludedBlockKinds:["code","math","table"],isAvailable:e=>!e?.isDocument&&!!e?.hasSelection&&e?.blockKind!=="code"&&e?.blockKind!=="math"&&e?.blockKind!=="table",execute:async e=>{let n=b,t=n.xiaolvCards||n.lvCards||n.siyuanCards;if(t&&typeof t.validateCardEntry=="function"){let a=await t.validateCardEntry({blockId:e,type:"make-cloze"});if(a&&a.ok===!1){i(a.reason||"已由 card-entry-gate 拦截无效制卡",2200,"info","块助手");return}}if(t&&typeof t.makeClozeCard=="function"){t.makeClozeCard(e);return}se().openMenu(e,C(e)||d.body)}},{id:"make-occlusion",group:"study",label:"制作遮挡卡",subtitle:"仅含图片块显出，过 card-entry-gate",glyph:"🖼️",sourceType:"ecosystem",sourcePlugin:"小驴闪卡",sourcePluginId:"siyuan-lv-cards",requiresPlugin:"siyuan-lv-cards",singleOnly:!0,isAvailable:e=>!!e?.hasImage,execute:async e=>{let n=b,t=n.xiaolvCards||n.lvCards||n.siyuanCards;if(t&&typeof t.validateCardEntry=="function"){let a=await t.validateCardEntry({blockId:e,type:"make-occlusion"});if(a&&a.ok===!1){i(a.reason||"已由 card-entry-gate 拦截无效制卡",2200,"info","块助手");return}}if(t&&typeof t.openOcclusionFlow=="function"){t.openOcclusionFlow(e);return}se().openMenu(e,C(e)||d.body)}},{id:"add-to-deck",group:"study",label:"加入卡组",subtitle:"收录入指定卡组并开启间隔重复复习",glyph:"📚",sourceType:"ecosystem",sourcePlugin:"小驴闪卡",sourcePluginId:"siyuan-lv-cards",requiresPlugin:"siyuan-lv-cards",supportsBatch:!0,isAvailable:e=>!e?.isDocument&&!!(e?.isCard||e?.hasCloze||e?.hasQaPattern),execute:async(e,n,t)=>{let r=b,a=r.xiaolvCards||r.lvCards||r.siyuanCards,s=t&&t.length>1?t:[e];if(a&&typeof a.validateCardEntry=="function"){let m=await a.validateCardEntry({blockId:e,type:"add-to-deck"});if(m&&m.ok===!1){i(m.reason||"已由 card-entry-gate 拦截废卡入组",2200,"info","块助手");return}}if(a&&typeof a.openDeckPicker=="function"){a.openDeckPicker(s);return}se().openMenu(e,C(e)||d.body)}},{id:"remove-from-deck",group:"study",label:"移出卡组",subtitle:"将当前闪卡从复习卡组中移除（保留正文块）",glyph:"📤",sourceType:"ecosystem",sourcePlugin:"小驴闪卡",sourcePluginId:"siyuan-lv-cards",requiresPlugin:"siyuan-lv-cards",supportsBatch:!0,isAvailable:e=>!e?.isDocument&&!e?.isReadOnly&&!!e?.isCard,execute:async(e,n,t)=>{let r=b,a=r.xiaolvCards||r.lvCards||r.siyuanCards,s=t&&t.length>1?t:[e];if(a&&typeof a.removeCardsFromDeck=="function"){await a.removeCardsFromDeck(s);try{x.lvBlockAssistant?.refreshCapsule?.(e)}catch{}i(s.length>1?`已将 ${s.length} 张卡片移出卡组`:"已将当前闪卡移出卡组",2e3,"info","块助手");return}se().openMenu(e,C(e)||d.body)}},{id:"to-exam-question",group:"study",label:"转为小驴试题",subtitle:"提取至小驴考试制卡与出题工坊",glyph:"📝",sourceType:"ecosystem",sourcePlugin:"小驴考试",sourcePluginId:"siyuan-exam",requiresPlugin:"siyuan-exam",supportsBatch:!0,preferredBlockKinds:["table","paragraph","code"],execute:async(e,n,t)=>{let r=b,a=r.siyuanExam||r.xiaolvExam||r.lvExam,s=t&&t.length>1?t:[e];if(a&&typeof a.extractToQuiz=="function"){let m=0;for(let f of s){let y=C(f),$=W(y);if(!$)continue;await a.extractToQuiz({text:$,sourceBlockId:f,type:"cloze"})!==!1&&m++}if(m>0){i(s.length>1?`已批量将 ${m} 个块提取至小驴考试制题`:"已提取至小驴考试制题工坊",2200,"info","块助手");return}}se().openMenu(e,C(e)||d.body)}},{id:"exam-ai-generate",group:"study",label:"AI 智能拟题",subtitle:"苏格拉底导学 AI 深度提炼知识点生成测试",glyph:"🧠",sourceType:"ecosystem",sourcePlugin:"小驴考试",sourcePluginId:"siyuan-exam",requiresPlugin:"siyuan-exam",singleOnly:!0,execute:async e=>{let n=b,t=n.siyuanExam||n.xiaolvExam||n.lvExam;if(t&&typeof t.extractToQuiz=="function"){let a=C(e),s=W(a);if(s&&await t.extractToQuiz({text:s,sourceBlockId:e,type:"qa"})!==!1){i("已交给小驴考试 AI 智能拟题",2200,"info","块助手");return}}se().openMenu(e,C(e)||d.body)}},{id:"to-glean-library",group:"reading",label:"加入拾遗读库",subtitle:"作为精选文献素材存入小驴拾遗剪藏知识库",glyph:"📖",sourceType:"ecosystem",sourcePlugin:"小驴拾遗",sourcePluginId:"siyuan-glean",requiresPlugin:"siyuan-glean",singleOnly:!0,preferredBlockKinds:["quote","paragraph"],execute:async e=>{let n=b,t=n.siyuanGlean||n.xiaolvGlean||n.lvGlean,r=C(e),a=W(r);if(t&&typeof t.ingestClip=="function"&&a)try{let p=(a.split(`
`)[0]||"").trim().slice(0,40)||"精选笔记剪藏",m=await t.ingestClip({blockId:e,title:p,summary:a.slice(0,160)});if(m&&m.ok!==!1){i("已成功加入小驴拾遗读库",2200,"info","块助手");return}}catch{}se().openMenu(e,r||d.body)}},{id:"ghostreader-explain",group:"reading",label:"AI 伴读解读",subtitle:"消费 Wave 1B lv-ai-hub.runBlockSkill 深度拆解当前段落",glyph:"✨",sourceType:"ecosystem",sourcePlugin:"小驴拾遗",sourcePluginId:"siyuan-glean",requiresPlugin:"siyuan-glean",singleOnly:!0,readOnlySafe:!0,execute:async e=>{let n=b,t=C(e),r=W(t),a=!1,s=null,p=()=>{if(s){try{s.destroy()}catch{}s=null}},m=v=>{if(typeof d>"u"||!d.body)return null;p(),Ke("lv-block-ai-result-card");let T=d.createElement("div");T.id="lv-block-ai-result-card",T.className="lv-block-ai-result-card",T.setAttribute("role","dialog"),T.style.cssText="position:fixed;right:24px;bottom:72px;z-index:99998;width:min(92vw,420px);max-height:70vh;display:flex;flex-direction:column;background:var(--b3-theme-surface,#fff);color:var(--b3-theme-on-surface,#0f172a);border:1px solid var(--b3-theme-surface-lighter,rgba(15,23,42,0.16));border-radius:14px;box-shadow:0 20px 50px rgba(15,23,42,0.28);overflow:hidden;font-family:var(--b3-font-family,sans-serif);",T.innerHTML=`
	                          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 14px;border-bottom:1px solid var(--b3-theme-surface-lighter,rgba(15,23,42,0.08));background:color-mix(in srgb,var(--b3-theme-primary,#2563eb) 8%,var(--b3-theme-surface));">
	                            <div style="display:flex;align-items:center;gap:6px;min-width:0;">
	                              <span style="font-size:14px;">✨</span>
	                              <strong style="font-size:13.5px;white-space:nowrap;">${q(v.title)}</strong>
	                              <span class="lv-bai-status" style="font-size:10.5px;padding:1px 7px;border-radius:999px;background:${v.isFallbackOrEmpty?"rgba(245,158,11,0.14)":"rgba(16,185,129,0.14)"};color:${v.isFallbackOrEmpty?"#b45309":"#047857"};font-weight:600;white-space:nowrap;">${q(v.statusText)}</span>
	                            </div>
	                            <button type="button" class="lv-bai-close-btn" aria-label="关闭" style="border:none;background:transparent;cursor:pointer;font-size:15px;color:var(--b3-theme-on-surface-light,#64748b);width:26px;height:26px;border-radius:50%;">✕</button>
	                          </div>
	                          <div class="lv-bai-body" style="padding:12px 14px;overflow-y:auto;font-size:12.5px;line-height:1.65;white-space:pre-wrap;word-break:break-word;">${q(v.bodyText)}</div>
	                          <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:10px 14px;border-top:1px solid var(--b3-theme-surface-lighter,rgba(15,23,42,0.08));">
	                            ${v.onCancel?'<button type="button" class="lv-bai-cancel-btn b3-button b3-button--outline" style="padding:4px 10px;font-size:11.5px;border-radius:7px;cursor:pointer;">⏹ 取消生成</button>':""}
	                            ${v.isFallbackOrEmpty?'<button type="button" class="lv-bai-settings-btn b3-button b3-button--outline" style="padding:4px 10px;font-size:11.5px;border-radius:7px;cursor:pointer;">⚙ 配置 AI 模型</button>':""}
	                            ${v.bodyText&&!v.onCancel?'<button type="button" class="lv-bai-copy-btn b3-button b3-button--outline" style="padding:4px 10px;font-size:11.5px;border-radius:7px;cursor:pointer;">📋 复制内容</button>':""}
	                            <button type="button" class="lv-bai-done-btn b3-button" style="padding:4px 12px;font-size:11.5px;border-radius:7px;cursor:pointer;background:var(--b3-theme-primary,#2563eb);color:#fff;border:none;">关闭</button>
	                          </div>
	                        `;let I=()=>{a=!0,p();try{v.onCancel?.()}catch{}try{T.remove()}catch{}};return T.querySelector(".lv-bai-close-btn")?.addEventListener("click",I),T.querySelector(".lv-bai-done-btn")?.addEventListener("click",I),T.querySelector(".lv-bai-cancel-btn")?.addEventListener("click",()=>{try{v.onCancel?.()}catch{}}),T.querySelector(".lv-bai-copy-btn")?.addEventListener("click",()=>{ue(v.bodyText).then(k=>{k&&i("已复制 AI 伴读内容",1600,"info","块助手")})}),T.querySelector(".lv-bai-settings-btn")?.addEventListener("click",()=>{I(),St("ai")}),d.body.appendChild(T),{card:T,bodyEl:T.querySelector(".lv-bai-body"),statusEl:T.querySelector(".lv-bai-status")}};if(!r){m({title:"AI 伴读解读",statusText:"无正文内容",bodyText:"当前选中的块暂未提取到可解读的正文文本（如纯图片或空块），请在包含文字的段落或标题块中使用「AI 伴读解读」。",isFallbackOrEmpty:!0});return}let f=n.__LV_AI_HUB__||(typeof globalThis<"u"?globalThis.__LV_AI_HUB__:null)||Ht();if(!f||typeof f.runBlockSkill!="function"){m({title:"AI 伴读解读",statusText:"未配置中枢",bodyText:"尚未检测到可用的在线 AI 模型配置。请前往「小驴罗盘 → ⚙ 设置 → 🤖 AI 调度中枢」配置思源智能体、自填密钥或本地 Ollama。",isFallbackOrEmpty:!0});return}let y=typeof AbortController<"u"?new AbortController:null,$=!1,N="",F=()=>{$=!0,p();try{y?.abort(new DOMException("User cancelled","AbortError"))}catch{y?.abort()}a||m({title:"AI 伴读解读",statusText:"已取消",bodyText:"已取消本次 AI 伴读生成，未发起任何文档修改。",isFallbackOrEmpty:!0})},E=m({title:"AI 伴读解读",statusText:"伴读分析中",bodyText:"",isFallbackOrEmpty:!1,onCancel:F});E?.bodyEl&&(s=$t(E.bodyEl,{scenario:"socratic",compact:!0,title:"✨ 正在通过全生态 AI 调度中枢拆解当前段落",cancelLabel:!1,signal:y?y.signal:void 0,onCancel:F}));try{let v=await f.runBlockSkill({blockId:e,blockType:t?.getAttribute("data-type")||"NodeParagraph",skillId:"ghostreader-explain",focusBlockContent:r,sourcePlugin:"siyuan-glean",signal:y?y.signal:void 0,onChunk:k=>{!k||a||$||y?.signal?.aborted||(p(),N+=k,E?.statusEl&&(E.statusEl.textContent="流式生成中"),E?.bodyEl&&(E.bodyEl.textContent=N))}});if(p(),a||$||y?.signal?.aborted||v?.outcome?.cancelReason||v?.meta?.errorReason==="aborted"){!a&&!$&&m({title:"AI 伴读解读",statusText:"已取消",bodyText:"已取消本次 AI 伴读生成，未发起任何文档修改。",isFallbackOrEmpty:!0});return}let I=((Array.isArray(v?.blocks)?v.blocks.find(k=>k&&typeof k.text=="string"&&k.text.trim()):null)?.text||N||v?.headline||"").trim();if(v?.state==="done"&&I){let k=v?.meta?.model||v?.meta?.provider||"AI 已完成";m({title:"AI 伴读解读",statusText:String(k),bodyText:I,isFallbackOrEmpty:!1})}else{let k=`当前未配置可用在线 AI 模型（或处于离线状态），以下为未落盘的本地启发式参考提要：

`+(I||"暂未生成解读内容，请在「AI 调度中枢」完成模型配置后重试。");m({title:"AI 伴读解读",statusText:"未配置/离线",bodyText:k,isFallbackOrEmpty:!0})}}catch(v){if(p(),a)return;if($||y?.signal?.aborted){m({title:"AI 伴读解读",statusText:"已取消",bodyText:"已取消本次 AI 伴读生成，未发起任何文档修改。",isFallbackOrEmpty:!0});return}m({title:"AI 伴读解读",statusText:"调用失败",bodyText:`AI 伴读未能完成（${v?.message||"请检查模型配置或网络连接"}）。可点击下方「⚙ 配置 AI 模型」检查渠道设置。`,isFallbackOrEmpty:!0})}}},{id:"capture-quote-common",group:"reading",label:"存为金句资产",subtitle:"调用 common.captureQuote 沉淀为常用模块台账",glyph:"💡",sourceType:"ecosystem",sourcePlugin:"小驴常用",sourcePluginId:"xiaolv-common",requiresPlugin:"xiaolv-common",preferredBlockKinds:["quote","paragraph"],execute:async e=>{let n=b,t=n.xiaolvCommon||n.lvCommon,r=C(e),a=W(r);if(t&&typeof t.captureQuote=="function"&&a)try{await t.captureQuote({quote:a,sourceBlockId:e}),i("已通过 captureQuote 将金句存入小驴常用语资产库",2200,"info","块助手");return}catch{}se().openMenu(e,r||d.body)}},{id:"contacts-interaction",group:"reading",label:"记一笔人脉互动",subtitle:"搜索联系人并经用户显式确认后记入互动记录",glyph:"👤",sourceType:"ecosystem",sourcePlugin:"小驴人脉",sourcePluginId:"siyuan-contacts",requiresPlugin:"siyuan-contacts",execute:async e=>{let n=b,t=n.siyuanContacts||n.xiaolvContacts||n.lvContacts,r=C(e),a=W(r);if(t&&typeof t.searchPeople=="function"&&a)try{let p=a.slice(0,24).replace(/[\r\n\t]/g," ").trim(),m=await t.searchPeople(p);if(m&&m.length>0&&typeof t.recordInteraction=="function"){let f=m[0];if(!await tt("确认记入人脉互动",`是否为「${f.name}」记入一条关联互动记录？（严禁未经确认静默写入）`)){i("已取消写入人脉互动",1600,"info","块助手");return}let $=E=>String(E).padStart(2,"0"),N=new ce,F=`${N.getFullYear()}-${$(N.getMonth()+1)}-${$(N.getDate())}`;await t.recordInteraction([f.docId],{ref:`((${e}))`,note:a.slice(0,120),date:F}),i(`小驴人脉：已为「${f.name}」记入一笔互动记录`,2400,"info","块助手");return}}catch{}se().openMenu(e,r||d.body)}},{id:"bind-checkin-item",group:"time",label:"设为打卡项",subtitle:"双向绑定笔记锚点，纳入每日打卡习惯追踪",glyph:"⏱️",sourceType:"ecosystem",sourcePlugin:"小驴打卡",sourcePluginId:"siyuan-checkin",requiresPlugin:"siyuan-checkin",supportsBatch:!0,preferredBlockKinds:["task","paragraph"],execute:async e=>{let n=b,t=n.siyuanCheckin||n.xiaolvCheckin||n.lvCheckin,r=C(e),a=W(r);if(t&&typeof t.createItemFromBlock=="function"&&a)try{let p=(a.split(`
`)[0]||"").trim().slice(0,40)||"笔记打卡",m=!!(r?.closest('[data-type="NodeListItem"][data-subtype="t"]')||r?.classList.contains("protyle-action--task"));await t.createItemFromBlock({blockId:e,name:p,icon:"⏱️",priority:m?"pinned":"normal"}),i(`已成功绑定打卡项「${p}」`,2200,"info","块助手");return}catch{}se().openMenu(e,r||d.body)}},{id:"add-memo",group:"time",label:"记为日常备忘",subtitle:"沉淀为小驴管家日程（单写，首行 <= 60 字）",glyph:"⏰",sourceType:"ecosystem",sourcePlugin:"小驴管家",sourcePluginId:"siyuan-home",requiresPlugin:"siyuan-home",singleOnly:!0,preferredBlockKinds:["task","paragraph"],execute:async e=>{let n=b,t=n.siyuanHome||n.xiaolvHome||n.lvHome,r=C(e),a=W(r);if(t&&typeof t.addMemo=="function"&&a)try{let p=(a.split(`
`)[0]||"").trim().slice(0,60),m=$=>String($).padStart(2,"0"),f=new ce,y=`${f.getFullYear()}-${m(f.getMonth()+1)}-${m(f.getDate())}`;await t.addMemo(p,y),i("已记入小驴管家今日备忘",2200,"info","块助手");return}catch{}se().openMenu(e,r||d.body)}},{id:"copy-code-for-snippet",group:"native",label:"复制代码供雷切",subtitle:"仅对代码块显隐，本地复制代码片段（不触碰 /api/snippet/*）",glyph:"⚡",sourceType:"ecosystem",sourcePlugin:"小驴雷切",sourcePluginId:"siyuan-speed-switch",requiresPlugin:"siyuan-speed-switch",preferredBlockKinds:["code"],isAvailable:e=>e?.blockKind==="code",execute:async e=>{let n=C(e),t=W(n);if(!t){i("当前代码块内容为空",1800,"info","块助手");return}await ue(t)&&i("已本地复制代码块正文，可在雷切中按需粘贴",2400,"info","块助手")}},{id:"community-mindmap",group:"community",label:"切换思维导图模式",subtitle:"为当前列表/大纲块注入导图属性，以脑图模式展开",glyph:"🧠",sourceType:"community",sourcePlugin:"思维导图",sourcePluginId:"sy-mindmap",requiresPlugin:"mindmap",singleOnly:!0,preferredBlockKinds:["list","heading"],isAvailable:e=>!e?.isReadOnly&&(e?.blockKind==="list"||e?.blockKind==="heading"),execute:async e=>{try{if(Y(e)){i("当前文档处于只读状态，已拦截导图切换",1800,"info","块助手");return}let r=(await _("/api/attr/getBlockAttrs",{id:e}))?.data?.["custom-sy-list-mindmap"]==="true"?"false":"true";await _("/api/attr/setBlockAttrs",{id:e,attrs:{"custom-sy-list-mindmap":r}}),i(r==="true"?"已开启当前块思维导图视图":"已恢复常规大纲排版",1800,"info","块助手")}catch(n){i(`导图切换失败: ${n?.message||"未知"}`,2e3,"error","块助手")}}},{id:"plugin-pangu-spacing",group:"organization",label:"中英文加空格（盘古排版）",subtitle:"规范段落排版，中西文混排自动补齐空格",glyph:"␣",sourceType:"community",sourcePlugin:"增强编辑",sourcePluginId:"siyuan-plugin-enhanced-editing",requiresPlugin:"enhanced-editing",supportsBatch:!0,excludedBlockKinds:["code","math","table"],isAvailable:e=>!e?.isReadOnly&&e?.blockKind!=="code"&&e?.blockKind!=="math"&&e?.blockKind!=="table"&&!e?.hasImage,execute:async(e,n,t)=>{if(Y(e)){i("当前文档处于只读状态，已拦截排版改写",1800,"info","块助手");return}let r=t&&t.length>1?t:[e],a=0;try{for(let s of r){let p=C(s),m=p?.getAttribute("data-type");if(m==="NodeCodeBlock"||m==="NodeMathBlock"||m==="NodeHTMLBlock"||m==="NodeTable")continue;let f=await Le(s,p);if(!f)continue;let y=qe(f,$=>$.replace(/([\u4e00-\u9fa5])([a-zA-Z0-9])/g,"$1 $2").replace(/([a-zA-Z0-9])([\u4e00-\u9fa5])/g,"$1 $2"));y!==f&&(await _("/api/block/updateBlock",{id:s,dataType:"markdown",data:y}),a++)}r.length>1?i(`批量排版完成：已优化 ${a}/${r.length} 个块的中英文空格`,2200,"info","块助手"):a>0?i("排版优化：已补充中英文空格",1800,"info","块助手"):i("当前文本排版已非常规范，无需加空格",1500,"info","块助手")}catch(s){i(`排版失败: ${s?.message||"未知"}`,2e3,"error","块助手")}}},{id:"plugin-convert-punctuation",group:"organization",label:"标点符号全半角纠错",subtitle:"将中文语境中的半角逗号句号自动修正为全角",glyph:"，",sourceType:"community",sourcePlugin:"增强编辑",sourcePluginId:"siyuan-plugin-enhanced-editing",requiresPlugin:"enhanced-editing",supportsBatch:!0,excludedBlockKinds:["code","math","table"],isAvailable:e=>!e?.isReadOnly&&e?.blockKind!=="code"&&e?.blockKind!=="math"&&e?.blockKind!=="table"&&!e?.hasImage,execute:async(e,n,t)=>{if(Y(e)){i("当前文档处于只读状态，已拦截标点改写",1800,"info","块助手");return}let r=t&&t.length>1?t:[e],a=0;try{for(let s of r){let p=C(s),m=p?.getAttribute("data-type");if(m==="NodeCodeBlock"||m==="NodeMathBlock"||m==="NodeHTMLBlock"||m==="NodeTable")continue;let f=await Le(s,p);if(!f)continue;let y=qe(f,$=>$.replace(/([\u4e00-\u9fa5]),/g,"$1，").replace(/([\u4e00-\u9fa5])\./g,"$1。").replace(/([\u4e00-\u9fa5]);/g,"$1；").replace(/([\u4e00-\u9fa5]):/g,"$1："));y!==f&&(await _("/api/block/updateBlock",{id:s,dataType:"markdown",data:y}),a++)}r.length>1?i(`批量纠错完成：已规范化 ${a}/${r.length} 个块的标点符号`,2200,"info","块助手"):a>0?i("已完成标点符号全角规范化",1800,"info","块助手"):i("当前段落标点符号已符合中文规范",1500,"info","块助手")}catch(s){i(`标点纠错失败: ${s?.message||"未知"}`,2e3,"error","块助手")}}},{id:"plugin-database-attr",group:"organization",label:"编辑结构化属性",subtitle:"查看并快速调整当前块的原生自定义属性与标签",glyph:"🏷️",sourceType:"community",sourcePlugin:"属性增强",sourcePluginId:"siyuan-database",requiresPlugin:"database",isAvailable:e=>!e?.isReadOnly&&(e?.blockKind==="av"||!!(e?.isAv||e?.hasAv)),execute:async e=>{try{let n=C(e),t=await _("/api/attr/getBlockAttrs",{id:e}),r=Object.keys(t?.data||{}),a=n?.querySelector?.(".protyle-attr");a&&a.click(),i(`当前块包含 ${r.length} 项属性（已聚焦属性栏）`,2200,"info","块助手")}catch{i("查询属性失败",2e3,"error","块助手")}}},{id:"plugin-wordcount",group:"organization",label:"统计当前块与子块字数",subtitle:"计算当前块及所属下级的所有中英文字数与字符数",glyph:"🔢",sourceType:"community",sourcePlugin:"字数统计",sourcePluginId:"siyuan-wordcount",requiresPlugin:"wordcount",supportsBatch:!0,execute:(e,n,t)=>{let r=t&&t.length>1?t:[e],a=0,s=0;for(let p of r){let m=C(p),f=W(m);a+=f.replace(/\s+/g,"").length,s+=(f.match(/[\u4e00-\u9fa5]|[a-zA-Z0-9]+/g)||[]).length}r.length>1?i(`多选字数统计（${r.length} 块）：共 ${a} 字符 · 约 ${s} 词`,2800,"info","块助手"):i(`字数统计：共 ${a} 字符 · 约 ${s} 词`,2400,"info","块助手")}},{id:"plugin-table-format",group:"organization",label:"格式化表格排版",subtitle:"自动规范 Markdown 表格各列对齐与管道符间距",glyph:"▦",sourceType:"community",sourcePlugin:"表格排版",sourcePluginId:"siyuan-plugin-markdown-table",requiresPlugin:"table",preferredBlockKinds:["table"],isAvailable:e=>!e?.isReadOnly&&e?.blockKind==="table",execute:async e=>{try{let n=C(e);if(Y(e,n)){i("当前文档处于只读状态，已拦截表格修改",1800,"info","块助手");return}let t=n?.querySelector("table");if(!t){i("当前块不是表格",1800,"info","块助手");return}let r=Array.from(t.rows);if(r.length===0)return;let a=[];r.forEach(m=>{Array.from(m.cells).forEach((f,y)=>{a[y]=Math.max(a[y]||0,(f.textContent||"").trim().length)})});let s=[];r.forEach(m=>{Array.from(m.cells).forEach((f,y)=>{let $=Math.max(64,(a[y]||4)*14);s.length<=y&&s.push($)})});let p=await _("/api/attr/setBlockAttrs",{id:e,attrs:{"custom-table-col-widths":s.join(",")}});if(p?.code!==0){i(`表格优化失败: ${p?.msg||"内核拒绝写入"}`,2e3,"error","块助手");return}i("已规范化表格列宽并持久化排版",1800,"info","块助手")}catch{i("表格优化处理失败",2e3,"error","块助手")}}},{id:"plugin-toc-locate",group:"native",label:"在大纲树中高亮定位",subtitle:"在大纲面板中迅速平滑滚动并高亮当前标题项",glyph:"📑",sourceType:"community",sourcePlugin:"浮动大纲",sourcePluginId:"siyuan-plugin-toc",requiresPlugin:"toc",preferredBlockKinds:["heading"],isAvailable:e=>e?.blockKind==="heading",execute:async e=>{let n=typeof e=="string"?e.trim():String(e??"").trim(),t=s=>typeof CSS<"u"&&typeof CSS.escape=="function"?CSS.escape(s):String(s).replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/[\r\n\f\0]/g,""),a=(s=>{if(!s||typeof d>"u"||typeof d.querySelectorAll!="function")return null;let p=t(s),m=[`.sy__outline [data-node-id="${p}"]`,`.sy__outline [data-id="${p}"]`,`.protyle-outline [data-node-id="${p}"]`,`.protyle-outline [data-id="${p}"]`,`.b3-list--outline [data-node-id="${p}"]`,`.b3-list--outline [data-id="${p}"]`,`[data-node-id="${p}"].protyle-outline__item`].join(", "),f=[];try{f=Array.from(d.querySelectorAll(m))}catch{return null}return f.find(y=>{if(!y)return!1;let $=y.getAttribute?.("data-node-id"),N=y.getAttribute?.("data-id");if($!==s&&N!==s||y.closest?.('.protyle-wysiwyg, .protyle-attr, [contenteditable="true"], [contenteditable=""]')||Pt(y))return!1;let F=y.closest?.(".sy__outline, .protyle-outline, .b3-list--outline")||null,E=!!y.classList?.contains?.("protyle-outline__item");if(!F&&!E||F&&F.closest?.("[data-node-id]"))return!1;let v=y.parentElement?.closest?.("[data-node-id]")||null;if(v){if(!F)return!1;let T=E||!!y.classList?.contains?.("b3-list-item"),I=!!(v.classList?.contains?.("protyle-outline__item")||v.classList?.contains?.("b3-list-item"));if(!T||!I||!F.contains(v))return!1}return!0})||null})(n);a?(typeof a.scrollIntoView=="function"&&a.scrollIntoView({behavior:"smooth",block:"center"}),a.classList.add("b3-list-item--focus"),Be(()=>a.classList.remove("b3-list-item--focus"),1500),i("已在大纲树中高亮定位",1600,"info","块助手")):i(`已锁定大纲节点 ((${e}))`,1800,"info","块助手")}},{id:"plugin-mermaid-zoom",group:"organization",label:"查看与导出图表",subtitle:"以高清矢量模式浏览并导出当前 Mermaid / 图表代码块",glyph:"📊",sourceType:"community",sourcePlugin:"图表增强",sourcePluginId:"siyuan-mermaid",requiresPlugin:"mermaid",isAvailable:e=>{if(e?.blockKind==="math")return!1;if(e?.hasMermaid)return!0;let n=e?.blockId||e?.id;if(n&&typeof d<"u"){let t=C(String(n));if(t){let r=t.getAttribute("data-type");if(r==="NodeMathBlock")return!1;let a=(t.getAttribute("data-subtype")||"").toLowerCase();if(/^(mermaid|echarts|graphviz|plantuml)$/i.test(a))return!0;if(r==="NodeCodeBlock"){let s=(t.querySelector(".protyle-action__language")?.textContent||t.textContent||"").trim().toLowerCase();if(/^(mermaid|echarts|graphviz|plantuml)\b/.test(s))return!0}if(t.querySelector('[data-subtype="mermaid"], [data-subtype="echarts"], [data-subtype="graphviz"], [data-subtype="plantuml"], .language-mermaid, .language-echarts, .language-graphviz, .language-plantuml'))return!0}}return!!(e?.hasSvg&&e?.blockKind==="code")},execute:async e=>{let t=C(e)?.querySelector("svg");if(t){let r=new XMLSerializer().serializeToString(t),a=new Blob([r],{type:"image/svg+xml;charset=utf-8"}),s=URL.createObjectURL(a);b.open(s,"_blank"),Be(()=>URL.revokeObjectURL(s),1e4),i("已在新窗口放大查看 Mermaid 矢量图",2e3,"info","块助手")}else i("当前块未渲染出图表",1800,"info","块助手")}}].forEach(e=>{x.customRegisteredActionIds?.has?.(e.id)||ie.set(e.id,e)})};ut();let je=o=>{if(o.actionType==="script")throw new Error("Wave 1C 已清退自定义 JS 脚本动作，仅支持声明式前后缀与属性写");let e={id:o.id,group:o.group||"community",label:o.label,subtitle:o.subtitle||"用户自定义块动作",glyph:o.glyph||"⚡",sourceType:"custom",sourcePlugin:"自定义动作",installed:!0,isAvailable:n=>!n?.isReadOnly,execute:async n=>{try{if(Y(n)){i("当前文档处于只读状态，已拦截自定义写入",1800,"info","块助手");return}if(o.actionType==="prefix-suffix"){let t=C(n),r=await Le(n,t),a=r.match(/^(\#{1,6}\s+|\>\s+|[-*+]\s*\[[ xX]\]\s+|[-*+]\s+)/),s=a?a[1]:"",p=s?r.slice(s.length):r,m=`${s}${o.prefix||""}${p}${o.suffix||""}`;await _("/api/block/updateBlock",{id:n,dataType:"markdown",data:m}),i("已执行自定义前后缀排版",1800,"info","块助手")}else if(o.actionType==="attr"&&o.attrKey){let t=o.attrKey.trim(),r=/^(custom-[a-z][a-z0-9-]*|memo$|bookmark$|name$|alias$|style$)/.test(t)?t:`custom-${t.toLowerCase().replace(/[^a-z0-9-]+/g,"-")}`;await _("/api/attr/setBlockAttrs",{id:n,attrs:{[r]:o.attrValue||"1"}}),i(`已写入自定义块属性 ${r}`,1800,"info","块助手")}}catch(t){i(`执行自定义动作失败: ${t?.message||"未知"}`,2200,"error","块助手")}}};return ie.set(e.id,e),e};Ae().forEach(e=>je(e));let gt=5e3,Me=0,Ve="",ft="",mt=0,Rt=new Set(["plugin-pangu-spacing","plugin-convert-punctuation","plugin-wordcount","plugin-table-format","plugin-toc-locate","plugin-mermaid-zoom","plugin-database-attr"]),Ft=()=>{let o=typeof b<"u"?b:null,e=o?.siyuan?.ws?.app?.plugins,n=new Set;if(Array.isArray(e))for(let s of e){if(s?.isUnloaded||s?.unloaded||s?.disposing)continue;let p=String(s?.name||s?.id||"").trim();p&&n.add(p)}for(let s of zt){let p=String(s||"").trim();p&&n.add(p)}if(o){try{let s=Lt();for(let p of s.keys()){let m=String(p||"").trim().toLowerCase();m&&m!=="siyuan-exoskeleton"&&m!=="exoskeleton"&&m!=="siyuan-quickgate"&&m!=="quickgate"&&n.add(String(p).trim())}}catch{}(o.xiaolvCards||o.lvCards||o.siyuanCards)&&n.add("siyuan-lv-cards"),(o.siyuanExam||o.xiaolvExam||o.lvExam)&&n.add("siyuan-exam"),(o.siyuanGlean||o.xiaolvGlean||o.lvGlean)&&n.add("siyuan-glean"),(o.xiaolvCommon||o.lvCommon)&&n.add("xiaolv-common"),(o.siyuanContacts||o.xiaolvContacts||o.lvContacts)&&n.add("siyuan-contacts"),(o.siyuanCheckin||o.xiaolvCheckin||o.lvCheckin)&&n.add("siyuan-checkin"),(o.siyuanHome||o.xiaolvHome||o.lvHome)&&n.add("siyuan-home"),(o.siyuanSpeedSwitch||o.xiaolvSpeedSwitch||o.lvSpeedSwitch)&&n.add("siyuan-speed-switch")}let t=Array.isArray(e)||n.size>0,r=Array.isArray(e)?e.map(s=>String(s?.name||s?.id||"")).join("|"):"",a=Array.from(n).sort().join(",");return{w:o,plugins:e,installedPluginIds:n,hasKnownPluginEnv:t,appFingerprint:r,ownersFingerprint:a}},Ce=(o=!1)=>{try{let{plugins:e,installedPluginIds:n,hasKnownPluginEnv:t,appFingerprint:r,ownersFingerprint:a}=Ft(),s=ce.now();if(!o&&Me>0&&s-Me<gt&&r===Ve&&a===ft)return Array.from(ie.values());for(let p of ie.values())if(p.sourceType==="native"||p.sourceType==="custom"||Rt.has(p.id))p.installed=!0;else if(p.sourceType==="ecosystem"){let m=p.requiresPlugin||p.sourcePluginId;p.installed=t&&m?n.has(m):!0}else if(p.sourceType==="community"){let m=p.requiresPlugin||p.sourcePluginId||"";if(m&&Array.isArray(e)){let f=new RegExp(m.replace(/siyuan-plugin-|sy-/g,""),"i");p.installed=Array.from(n).some(y=>f.test(y))}else p.installed=!0}if(Array.isArray(e))for(let p of e){let m=String(p.name||p.id||""),f=String(p.displayName||p.name||m);if(!/^(siyuan-(lv-cards|exam|glean|checkin|home|contacts|speed-switch)|xiaolv-common)$/.test(m)&&Array.isArray(p.commands))for(let y of p.commands){if(!y||!y.langKey)continue;let $=String(y.langKey).toLowerCase(),N=String(y.langText||"").toLowerCase();if(/setting|config|reload|about|version|theme|window|dock|toggle|help|update|market|sidebar|workspace|tab|layout|fullscreen|export-all|sync|backup/i.test($)||/设置|配置|关于|主题|重载|窗口|侧栏|全屏|帮助|更新|集市|备份|同步/i.test(N)||!(/块|段落|选择|选区|文字|列表|表格|代码|公式|引用|行|block|select|format|trans|pangu|table|code|math|attr|cloze|card|quiz|qa/i.test(`${$} ${N}`)||/doAction|do-action/i.test($)))continue;let E=`plugin-cmd:${m}:${y.langKey}`,v=async T=>{try{typeof y.callback=="function"?y.callback(T):i(`已触发插件【${f}】命令: ${y.langText||y.langKey}`,2e3,"info","块助手")}catch(I){i(`执行插件命令失败: ${I?.message||"未知"}`,2e3,"error","块助手")}};if(ie.has(E)){let T=ie.get(E);T&&(T.installed=!0,T.label=y.langText||y.langKey,T.execute=v)}else{let T={id:E,group:"community",label:y.langText||y.langKey,subtitle:`[${f}] 快捷命令`,glyph:"🔌",sourcePlugin:f,sourcePluginId:m,sourceType:"plugin-discovery",installed:!0,enabledByDefault:!1,isPinnedByDefault:!1,execute:v};ie.set(E,T)}}}Me=s,Ve=r,ft=a,mt++}catch{}return Array.from(ie.values())};Ce();let Ut=o=>{if(typeof d>"u")return;Re(),Ke("lv-block-action-store-mask"),Ce(!0);let e=_e(),n=new Set(e.enabledActionIds),t=[...e.pinnedActionIds],r=Pe(e.doubleClickActionId),a="ready",s="all",p="",m="",f=Array.from(ie.values()),y=typeof b<"u"&&b.innerWidth<=640,$=[{id:"ready",label:"全部已就绪",glyph:"🌟",desc:"所有可立即调用的块级能力"},{id:"pinned",label:"优先常驻",glyph:"⭐",desc:"装配进块菜单顶栏的 1~5 项极速直达动作"},{id:"layout",label:"结构与排版",glyph:"🏛️",desc:"聚焦专注、折叠展开、类型转换、同级排序、克隆与排版",matchGroups:["native","organization"]},{id:"reference",label:"引用与复用",glyph:"🔗",desc:"块引用、嵌入块、纯文本与块 ID 快速复用",matchGroups:["clipboard"]},{id:"study",label:"记忆与备考",glyph:"🧠",desc:"小驴闪卡与考试专属能力：问答卡、填空制卡与题库",matchGroups:["study","flashcard"]},{id:"reading",label:"读库与剪藏",glyph:"📖",desc:"小驴拾遗专属能力：加入读库、伴读解读与文献引用",matchGroups:["reading","knowledge"]},{id:"lifestyle",label:"打卡与日常",glyph:"⏱️",desc:"小驴打卡与管家专属能力：习惯绑定、便签待办与日记",matchGroups:["time"]},{id:"community",label:"扩展与工具",glyph:"🔌",desc:"思维导图、Mermaid、看板与用户自定义动作",matchGroups:["community","plugin","custom"]},{id:"uninstalled",label:"集市推荐",glyph:"🛒",desc:"思源官方集市第三方优质插件推荐扩展"}],N=(c,g)=>{if(g==="ready")return c.installed!==!1;if(g==="uninstalled")return c.installed===!1;if(g==="pinned")return t.includes(c.id);let l=$.find(h=>h.id===g);return!l?.matchGroups||c.sourceType==="custom"&&g==="community"?!0:l.matchGroups.includes(c.group||"")},F=c=>{if(c.sourceType==="custom")return{color:"#ec4899",bg:"rgba(236, 72, 153, 0.12)",border:"rgba(236, 72, 153, 0.3)"};switch(c.group){case"native":case"organization":return{color:"#3b82f6",bg:"rgba(59, 130, 246, 0.12)",border:"rgba(59, 130, 246, 0.25)"};case"clipboard":return{color:"#06b6d4",bg:"rgba(6, 182, 212, 0.12)",border:"rgba(6, 182, 212, 0.25)"};case"study":case"flashcard":return{color:"#8b5cf6",bg:"rgba(139, 92, 246, 0.12)",border:"rgba(139, 92, 246, 0.25)"};case"reading":case"knowledge":return{color:"#10b981",bg:"rgba(16, 185, 129, 0.12)",border:"rgba(16, 185, 129, 0.25)"};case"time":return{color:"#f97316",bg:"rgba(249, 115, 22, 0.12)",border:"rgba(249, 115, 22, 0.25)"};default:return{color:"#6366f1",bg:"rgba(99, 102, 241, 0.12)",border:"rgba(99, 102, 241, 0.25)"}}},E=d.createElement("div");E.id="lv-block-action-store-mask",E.style.cssText=`
            position: fixed;
            inset: 0;
            z-index: 99999;
            background: rgba(24, 24, 27, 0.34);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: ${y?"6px":"16px"};
            box-sizing: border-box;
            animation: lvNoticeFadeIn 0.16s ease-out both;
        `;let v=d.createElement("div");v.className="lv-action-store-modal",v.style.cssText=`
            position: relative;
            background: var(--b3-theme-surface, #ffffff);
            border: 1px solid var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.24));
            border-radius: ${y?"14px":"18px"};
            box-shadow: 0 32px 80px -16px rgba(15, 23, 42, 0.42), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
            width: min(${y?"98vw":"94vw"}, 980px);
            max-height: min(${y?"94vh":"90vh"}, 880px);
            display: flex;
            flex-direction: column;
            overflow-y: ${y?"auto":"hidden"};
            overflow-x: hidden;
            color: var(--b3-theme-on-surface, #1e293b);
            font-family: var(--b3-font-family, sans-serif);
        `;let T=d.createElement("div");T.className="lv-store-header",T.style.cssText=`
            padding: 16px 24px 14px;
            border-bottom: 1px solid var(--b3-theme-surface-lighter, rgba(0,0,0,0.06));
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 12px;
            background: linear-gradient(135deg, color-mix(in srgb, var(--b3-theme-primary, #6366f1) 9%, var(--b3-theme-surface)) 0%, var(--b3-theme-surface) 100%);
        `;let I=Se();T.innerHTML=`
            <div style="min-width:0;">
                <div style="font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span>📦 块助手资产库</span>
                    <span style="font-size: 11px; padding: 2px 9px; border-radius: 9999px; background: color-mix(in srgb, var(--b3-theme-primary, #6366f1) 15%, transparent); color: var(--b3-theme-primary, #6366f1); font-weight: 600; letter-spacing: 0.3px;">Block Action Store</span>
                </div>
                <div style="font-size: 12px; color: var(--b3-theme-on-surface-light, #64748b); margin-top: 4px;">
                    精选块级专属能力 · 自由装配 1~5 项优先常驻槽 · 一键剔除无关杂项
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
                <label class="lv-store-master-toggle" style="display:inline-flex;align-items:center;gap:7px;padding:5px 12px;border-radius:9999px;border:1px solid var(--b3-theme-surface-lighter, rgba(148,163,184,0.32));background:var(--b3-theme-surface,#fff);cursor:pointer;font-size:12px;font-weight:600;color:var(--b3-theme-on-surface,#1e293b);user-select:none;" title="开启或彻底停用编辑器块助手胶囊与 Alt+B 菜单">
                    <input type="checkbox" class="lv-store-master-checkbox" ${I?"checked":""} />
                    <span>启用块助手</span>
                    <span class="lv-store-master-state" style="font-size:11px;opacity:0.75;">(${I?"已启用":"已停用"})</span>
                </label>
                <button class="lv-store-close-btn" style="border: none; background: transparent; cursor: pointer; font-size: 18px; line-height: 1; color: var(--b3-theme-on-surface-light, #94a3b8); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.15s ease;" title="关闭 (Esc)">✕</button>
            </div>
        `;let k=T.querySelector(".lv-store-master-checkbox"),U=T.querySelector(".lv-store-master-state"),G=c=>{k&&(k.checked=c),U&&(U.textContent=c?"(已启用)":"(已停用)")};k?.addEventListener("change",()=>{let c=!!k.checked;Mt(c,{keepStoreDialog:!0}),G(c),i(c?"已启用全生态块助手":"已停用全生态块助手（Alt+B 与右缘胶囊已关闭）",2e3,"info","块助手")});let de=c=>{if(!E.isConnected){typeof b<"u"&&b.removeEventListener("lv-block-assistant-toggle",de);return}let g=c?.detail?.enabled;G(typeof g=="boolean"?g:Se())};typeof b<"u"&&b.addEventListener("lv-block-assistant-toggle",de);let ae=d.createElement("div");ae.className="lv-store-dblclick-bar",ae.style.cssText=`
            padding: 9px 24px;
            border-bottom: 1px solid var(--b3-theme-surface-lighter, rgba(0,0,0,0.06));
            background: color-mix(in srgb, var(--b3-theme-primary, #6366f1) 4%, var(--b3-theme-surface));
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
        `,ae.innerHTML=`
            <div style="display:flex;align-items:center;gap:8px;min-width:0;">
                <span style="font-size:14px;">⚡</span>
                <span style="font-size:12.5px;font-weight:600;color:var(--b3-theme-on-surface);">双击胶囊/快捷入口触发动作</span>
                <span style="font-size:11px;color:var(--b3-theme-on-surface-light,#64748b);">单击展开菜单，双击直达此高频动作（仅含当前可用动作）</span>
            </div>
            <label style="display:inline-flex;align-items:center;gap:5px;font-size:11.5px;color:var(--b3-theme-on-surface-light,#6c6c6c);cursor:pointer;user-select:none;" title="隐藏正文悬浮入口，仅按 Alt+B 或点击块标展开菜单">
                <input type="checkbox" class="lv-store-altb-only-checkbox" ${x.getLvEcosystemToggles?.()?.blockAssistantAltBOnly?"checked":""} />
                <span>仅快捷键 Alt+B 唤醒</span>
            </label>
            <select class="lv-store-dblclick-select" style="padding:5px 10px;border-radius:7px;border:1px solid var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.34));background:var(--b3-theme-surface,#fff);color:var(--b3-theme-on-surface,#1e293b);font-size:12px;cursor:pointer;min-width:210px;max-width:280px;"></select>
        `;let ve=ae.querySelector(".lv-store-altb-only-checkbox");ve?.addEventListener("change",()=>{let c=!!ve.checked;x.setLvEcosystemToggles?.({blockAssistantAltBOnly:c}),i(c?"已开启：仅快捷键 Alt+B 唤醒（隐藏悬浮入口）":"已恢复静止点选悬浮入口",1800,"info","块助手")});let S=ae.querySelector(".lv-store-dblclick-select"),j=()=>{if(!S)return;let c=f.filter(l=>l.installed!==!1&&n.has(l.id)&&!l.destructive&&l.id!=="delete-block");if(r!==xe&&!c.some(l=>l.id===r)){let l=c.find(h=>h.id===nt)||c[0];r=l?l.id:xe}let g=[`<option value="${xe}" ${r===xe?"selected":""}>🚫 关闭双击（仅单击展开菜单）</option>`,...c.map(l=>`<option value="${q(l.id)}" ${l.id===r?"selected":""}>${q(l.glyph||"⚡")} ${q(l.label)}</option>`)];S.innerHTML=g.join(""),S.value=r};S?.addEventListener("change",()=>{r=Pe(S.value);let c=_e();ot({...c,doubleClickActionId:r}),i(r===xe?"已关闭块助手双击触发":"已更新块助手双击触发动作",1800,"info","块助手")});let B=d.createElement("div");B.className="lv-store-pinned-dock",B.style.cssText=`
            padding: 12px 24px 14px;
            background: color-mix(in srgb, #f59e0b 5%, var(--b3-theme-surface));
            border-bottom: 1px solid color-mix(in srgb, #f59e0b 22%, transparent);
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;let V=()=>{B.innerHTML=`
                <div style="font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px;">
                    <span style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; min-width: 0;">
                        <span style="color: #f59e0b; font-size: 14px;">⭐</span>
                        <span>块助手优先常驻功能 (${t.length}/5 槽位)</span>
                        <span style="font-size: 11px; font-weight: normal; opacity: 0.72;">· 在块菜单顶端优先展示，支持点击 ← → 调序</span>
                    </span>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        ${t.length>0?'<button type="button" class="lv-dock-clear-all" style="border:none;background:transparent;cursor:pointer;font-size:11.5px;color:var(--b3-theme-on-surface-light,#64748b);padding:2px 8px;border-radius:4px;transition:all .12s;" title="清空全部常驻槽位">清空全部</button>':""}
                    </div>
                </div>
                <div class="lv-store-dock-slots" style="display: grid; grid-template-columns: repeat(${y?2:5}, minmax(0, 1fr)); gap: 8px;"></div>
            `;let c=B.querySelector(".lv-store-dock-slots");if(c){for(let g=0;g<5;g++){let l=t[g],h=l?ie.get(l):null,w=d.createElement("div");w.className="lv-dock-bento-slot",h?(w.style.cssText=`
                        position: relative;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        padding: 8px 10px;
                        border-radius: 10px;
                        background: color-mix(in srgb, #f59e0b 12%, var(--b3-theme-surface));
                        border: 1px solid rgba(245, 158, 11, 0.45);
                        font-size: 12px;
                        color: var(--b3-theme-on-surface);
                        box-shadow: 0 2px 6px rgba(245, 158, 11, 0.08);
                        min-width: 0;
                        transition: all 0.15s ease;
                    `,w.innerHTML=`
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
                            <span style="font-size: 10px; font-weight: 700; color: #b45309; background: rgba(245, 158, 11, 0.22); border-radius: 4px; padding: 1px 5px; flex-shrink: 0;">#${g+1}</span>
                            <div style="display: flex; align-items: center; gap: 2px;">
                                <button type="button" class="lv-dock-move-left" data-id="${h.id}" style="border:none;background:transparent;cursor:pointer;padding:1px 3px;font-size:11px;opacity:${g===0?"0.25":"0.85"};border-radius:3px;" ${g===0?"disabled":""} title="前移一位">←</button>
                                <button type="button" class="lv-dock-move-right" data-id="${h.id}" style="border:none;background:transparent;cursor:pointer;padding:1px 3px;font-size:11px;opacity:${g===t.length-1?"0.25":"0.85"};border-radius:3px;" ${g===t.length-1?"disabled":""} title="后移一位">→</button>
                                <button type="button" class="lv-dock-remove" data-id="${h.id}" style="border:none;background:transparent;cursor:pointer;padding:1px 3px;font-size:11px;color:#ef4444;opacity:0.85;border-radius:3px;" title="从常驻槽移除">✕</button>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px; margin-top: 5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            <span style="font-size: 14px; flex-shrink: 0;">${q(h.glyph||"⚡")}</span>
                            <span style="font-weight: 600; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${q(h.label)}">${q(h.label)}</span>
                        </div>
                    `):(w.style.cssText=`
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        gap: 2px;
                        padding: 8px 6px;
                        border-radius: 10px;
                        border: 1px dashed var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.38));
                        color: var(--b3-theme-on-surface-light, #94a3b8);
                        font-size: 11px;
                        background: rgba(0,0,0,0.012);
                    `,w.innerHTML=`
                        <span style="font-size: 10px; opacity: 0.65; font-weight: 600;">#${g+1} 空闲槽位</span>
                        <span style="font-size: 10.5px; opacity: 0.85; margin-top: 2px;">+ 点击卡片 ⭐ 填入</span>
                    `),c.appendChild(w)}B.querySelectorAll(".lv-dock-move-left").forEach(g=>{g.addEventListener("click",()=>{let l=g.getAttribute("data-id");if(!l)return;let h=t.indexOf(l);if(h>0&&t[h]!==void 0&&t[h-1]!==void 0){let w=t[h];t[h]=t[h-1],t[h-1]=w,V(),Z(),K()}})}),B.querySelectorAll(".lv-dock-move-right").forEach(g=>{g.addEventListener("click",()=>{let l=g.getAttribute("data-id");if(!l)return;let h=t.indexOf(l);if(h<t.length-1&&h!==-1&&t[h]!==void 0&&t[h+1]!==void 0){let w=t[h];t[h]=t[h+1],t[h+1]=w,V(),Z(),K()}})}),B.querySelectorAll(".lv-dock-remove").forEach(g=>{g.addEventListener("click",()=>{let l=g.getAttribute("data-id");if(!l)return;let h=t.indexOf(l);h!==-1&&(t.splice(h,1),V(),Z(),K())})}),B.querySelector(".lv-dock-clear-all")?.addEventListener("click",async()=>{t=[],V(),Z(),K()})}},P=d.createElement("div");P.className="lv-store-filter-bar",P.style.cssText=`
            padding: 12px 24px 10px;
            border-bottom: 1px solid var(--b3-theme-surface-lighter, rgba(0,0,0,0.06));
            display: flex;
            flex-direction: column;
            gap: 10px;
            background: var(--b3-theme-surface);
        `;let D=d.createElement("div");D.className="lv-store-search-row",D.style.cssText="display: flex; align-items: center; flex-wrap: wrap; gap: 10px;",D.innerHTML=`
            <div style="position: relative; flex: 1; display: flex; align-items: center;">
                <span style="position: absolute; left: 12px; font-size: 14px; opacity: 0.6; pointer-events: none;">🔍</span>
                <input type="text" class="lv-store-search-input" placeholder="快速搜索动作名称、拼音缩写、介绍或插件... (支持 Esc 清空)" style="
                    width: 100%;
                    padding: 8px 36px 8px 36px;
                    border-radius: 8px;
                    border: 1px solid var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.28));
                    background: var(--b3-theme-background);
                    color: var(--b3-theme-on-background);
                    font-size: 13px;
                    outline: none;
                    transition: all 0.15s ease;
                " />
                <button type="button" class="lv-store-search-clear" style="
                    position: absolute;
                    right: 8px;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    border: none;
                    background: rgba(148, 163, 184, 0.2);
                    color: var(--b3-theme-on-surface-light, #64748b);
                    cursor: pointer;
                    font-size: 11px;
                    line-height: 1;
                " title="清空搜索词 (Esc)">✕</button>
            </div>
            <div class="lv-store-status-pills" style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
                <button type="button" class="lv-store-status-btn" data-status="all" style="padding: 5px 10px; border-radius: 6px; border: 1px solid var(--b3-theme-primary, #6366f1); background: color-mix(in srgb, var(--b3-theme-primary, #6366f1) 12%, transparent); color: var(--b3-theme-primary, #6366f1); font-size: 11.5px; font-weight: 600; cursor: pointer;">全部</button>
                <button type="button" class="lv-store-status-btn" data-status="enabled" style="padding: 5px 10px; border-radius: 6px; border: 1px solid var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.25)); background: var(--b3-theme-surface); color: inherit; font-size: 11.5px; cursor: pointer;">仅已启用</button>
                <button type="button" class="lv-store-status-btn" data-status="pinned" style="padding: 5px 10px; border-radius: 6px; border: 1px solid var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.25)); background: var(--b3-theme-surface); color: inherit; font-size: 11.5px; cursor: pointer;">仅优先 ⭐</button>
            </div>
        `;let A=d.createElement("div");A.style.cssText=`
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
            font-size: 11.5px;
        `,A.innerHTML=`
            <span style="opacity: 0.72; font-weight: 500;">场景预设：</span>
            <button type="button" class="lv-store-preset-btn" data-preset="all-star" style="padding: 2px 8px; border-radius: 6px; border: 1px solid var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.25)); background: var(--b3-theme-surface); color: inherit; cursor: pointer; font-size: 11px;">🌟 黄金全能</button>
            <button type="button" class="lv-store-preset-btn" data-preset="exam" style="padding: 2px 8px; border-radius: 6px; border: 1px solid var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.25)); background: var(--b3-theme-surface); color: inherit; cursor: pointer; font-size: 11px;">🎓 考研备考</button>
            <button type="button" class="lv-store-preset-btn" data-preset="writing" style="padding: 2px 8px; border-radius: 6px; border: 1px solid var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.25)); background: var(--b3-theme-surface); color: inherit; cursor: pointer; font-size: 11px;">✍️ 写作研读</button>
            <button type="button" class="lv-store-preset-btn" data-preset="org" style="padding: 2px 8px; border-radius: 6px; border: 1px solid var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.25)); background: var(--b3-theme-surface); color: inherit; cursor: pointer; font-size: 11px;">⚡ 结构排版</button>
            <button type="button" class="lv-store-preset-btn" data-preset="minimal" style="padding: 2px 8px; border-radius: 6px; border: 1px solid var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.25)); background: var(--b3-theme-surface); color: inherit; cursor: pointer; font-size: 11px;">🎯 极简原生</button>
            <span style="width: 1px; height: 16px; background: var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.25)); margin: 0 4px;"></span>
            <button type="button" class="lv-store-select-all-btn" style="padding: 2px 8px; border-radius: 6px; border: 1px solid var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.25)); background: var(--b3-theme-surface); color: inherit; cursor: pointer; font-size: 11px;" title="一键启用当前分类下的所有可用动作">☑️ 全选本类</button>
            <button type="button" class="lv-store-unselect-all-btn" style="padding: 2px 8px; border-radius: 6px; border: 1px solid var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.25)); background: var(--b3-theme-surface); color: inherit; cursor: pointer; font-size: 11px;" title="一键停用当前分类下的所有动作">⬜ 全关本类</button>
            <span style="flex: 1 1 auto;"></span>
            <button type="button" class="lv-store-custom-toggle-btn" style="padding: 2px 9px; border-radius: 6px; border: 1px solid var(--b3-theme-primary, #6366f1); background: color-mix(in srgb, var(--b3-theme-primary, #6366f1) 12%, transparent); color: var(--b3-theme-primary, #6366f1); cursor: pointer; font-size: 11px; font-weight: 600;">+ 自定义动作</button>
            <button type="button" class="lv-store-export-btn" style="padding: 2px 7px; border-radius: 6px; border: 1px solid var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.25)); background: var(--b3-theme-surface); color: inherit; cursor: pointer; font-size: 11px;" title="导出当前配置为 JSON 格式">📋 导出</button>
            <button type="button" class="lv-store-import-btn" style="padding: 2px 7px; border-radius: 6px; border: 1px solid var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.25)); background: var(--b3-theme-surface); color: inherit; cursor: pointer; font-size: 11px;" title="从 JSON 格式导入配置">📥 导入</button>
        `;let z=d.createElement("div");z.className="lv-store-custom-drawer",z.style.cssText=`
            display: none;
            padding: 12px 16px;
            background: color-mix(in srgb, var(--b3-theme-surface) 92%, var(--b3-theme-primary) 8%);
            border: 1px solid color-mix(in srgb, var(--b3-theme-primary, #6366f1) 28%, transparent);
            border-radius: 10px;
            flex-direction: column;
            gap: 9px;
            font-size: 12px;
        `,z.innerHTML=`
            <div style="font-weight: 600; display: flex; align-items: center; justify-content: space-between;">
                <span>🛠️ 新建自定义块级动作</span>
                <button type="button" class="lv-custom-close-btn" style="border:none;background:transparent;cursor:pointer;font-size:14px;opacity:0.6;">✕</button>
            </div>
            <div class="lv-store-custom-row-main" style="display: grid; grid-template-columns: ${y?"1fr":"1fr 60px 140px"}; gap: 8px;">
                <input type="text" class="lv-custom-name" placeholder="动作名称 (如: 设为待办)" style="min-width: 0; padding: 6px 9px; border-radius: 6px; border: 1px solid var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.25)); background: var(--b3-theme-surface); color: inherit; font-size: 12px;" />
                <input type="text" class="lv-custom-glyph" placeholder="图标" value="⚡" style="min-width: 0; padding: 6px 9px; text-align: center; border-radius: 6px; border: 1px solid var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.25)); background: var(--b3-theme-surface); color: inherit; font-size: 12px;" />
                <select class="lv-custom-group" style="min-width: 0; padding: 6px 9px; border-radius: 6px; border: 1px solid var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.25)); background: var(--b3-theme-surface); color: inherit; font-size: 12px;">
                    <option value="organization">⚡ 结构排版</option>
                    <option value="native">🏛️ 思源原生</option>
                    <option value="study">🧠 学习记忆</option>
                    <option value="reading">📖 阅读研读</option>
                    <option value="time">⏱️ 时间打卡</option>
                    <option value="clipboard">🔗 复制引用</option>
                    <option value="community">🔌 扩展工具</option>
                </select>
            </div>
            <input type="text" class="lv-custom-subtitle" placeholder="动作副标题说明 (如: 在段落首尾快速添加标记)" style="min-width: 0; padding: 6px 9px; border-radius: 6px; border: 1px solid var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.25)); background: var(--b3-theme-surface); color: inherit; font-size: 12px;" />
            <div class="lv-store-custom-row-type" style="display: grid; grid-template-columns: ${y?"1fr":"120px 1fr"}; gap: 8px;">
                <select class="lv-custom-type" style="min-width: 0; padding: 6px 9px; border-radius: 6px; border: 1px solid var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.25)); background: var(--b3-theme-surface); color: inherit; font-size: 12px;">
                    <option value="prefix-suffix">前后缀拼接</option>
                    <option value="attr">写入块属性</option>
                </select>
                <div class="lv-custom-param-box" style="display: flex; gap: 6px; min-width: 0; flex-wrap: wrap;">
                    <input type="text" class="lv-custom-prefix" placeholder="前缀 (如: * [ ] )" style="flex: 1 1 120px; min-width: 0; padding: 6px 9px; border-radius: 6px; border: 1px solid var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.25)); background: var(--b3-theme-surface); color: inherit; font-size: 12px;" />
                    <input type="text" class="lv-custom-suffix" placeholder="后缀" style="flex: 1 1 120px; min-width: 0; padding: 6px 9px; border-radius: 6px; border: 1px solid var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.25)); background: var(--b3-theme-surface); color: inherit; font-size: 12px;" />
                </div>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px;">
                <button type="button" class="lv-custom-test-btn" style="padding: 5px 12px; border-radius: 6px; border: 1px solid var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.25)); background: var(--b3-theme-surface); color: inherit; cursor: pointer; font-size: 12px;">🧪 试运行测试</button>
                <button type="button" class="lv-custom-save-btn" style="padding: 5px 14px; border-radius: 6px; border: none; background: var(--b3-theme-primary, #6366f1); color: var(--b3-theme-on-primary, #ffffff); font-weight: 600; cursor: pointer; font-size: 12px;">保存并加入库</button>
            </div>
        `;let ge=d.createElement("div");ge.style.cssText=`
            position: relative;
            width: 100%;
            overflow: hidden;
            mask-image: linear-gradient(to right, black calc(100% - 24px), transparent 100%);
            -webkit-mask-image: linear-gradient(to right, black calc(100% - 24px), transparent 100%);
        `;let le=d.createElement("div");le.className="lv-store-tabs",le.style.cssText=`
            display: flex;
            align-items: center;
            gap: 6px;
            overflow-x: auto;
            padding: 2px 2px 4px;
            scrollbar-width: none;
        `,ge.appendChild(le);let Q=d.createElement("div");Q.className="lv-store-content",Q.style.cssText=`
            flex: ${y?"1 0 auto":"1"};
            min-height: ${y?"240px":"0"};
            overflow-y: ${y?"visible":"auto"};
            padding: 16px 24px;
            display: grid;
            grid-template-columns: ${y?"1fr":"repeat(auto-fill, minmax(270px, 1fr))"};
            gap: 12px;
            align-content: start;
        `;let H=d.createElement("div");H.className="lv-store-footer",H.style.cssText=`
            padding: 12px 24px;
            border-top: 1px solid var(--b3-theme-surface-lighter, rgba(0,0,0,0.06));
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 10px;
            background: color-mix(in srgb, var(--b3-theme-surface) 95%, var(--b3-theme-primary) 5%);
        `,H.innerHTML=`
            <div style="display: flex; align-items: center; gap: 8px;">
                <button class="lv-store-scan-btn" style="padding: 6px 12px; border-radius: 6px; border: 1px solid var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.25)); background: var(--b3-theme-surface); cursor: pointer; font-size: 12px; color: var(--b3-theme-on-surface); transition: all 0.15s ease;">🔍 重新扫描插件</button>
                <button class="lv-store-reset-btn" style="padding: 6px 12px; border-radius: 6px; border: 1px solid var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.25)); background: var(--b3-theme-surface); cursor: pointer; font-size: 12px; color: var(--b3-theme-on-surface); transition: all 0.15s ease;">♻️ 恢复推荐预设</button>
            </div>
            <div class="lv-store-summary-text" style="font-size: 12px; color: var(--b3-theme-on-surface-light, #64748b);">
                已启用 ${n.size} 项 · 常驻 ${t.length}/5 项
            </div>
            <button class="lv-store-save-btn" style="padding: 7px 20px; border-radius: 8px; border: none; background: var(--b3-theme-primary, #6366f1); color: var(--b3-theme-on-primary, #ffffff); cursor: pointer; font-weight: 600; font-size: 13px; box-shadow: 0 2px 8px rgba(99, 102, 241, 0.35); transition: all 0.15s ease;">完成并生效</button>
        `;let K=()=>{if(Q.innerHTML="",a==="uninstalled"){let l=d.createElement("div");l.style.cssText=`
                    grid-column: 1 / -1;
                    padding: 10px 14px;
                    background: rgba(245, 158, 11, 0.08);
                    border: 1px solid rgba(245, 158, 11, 0.25);
                    border-radius: 9px;
                    font-size: 12px;
                    color: #b45309;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 2px;
                `,l.innerHTML="<span>💡</span><span>以下为思源官方集市第三方优质插件专属能力（当前尚未安装）。在思源集市安装对应插件后，动作将自动点亮并移入上方【已就绪】供您随时调用。</span>",Q.appendChild(l)}let c=p.trim().toLowerCase(),g=f.filter(l=>{let h=l.installed!==!1;if(a==="uninstalled"){if(h)return!1}else if(!h)return!1;if(!N(l,a))return!1;let w=n.has(l.id),te=t.includes(l.id);return!(s==="enabled"&&!w||s==="disabled"&&w||s==="pinned"&&!te||c&&!`${l.label} ${l.subtitle||""} ${l.sourcePlugin||""} ${l.id} ${(l.tags||[]).join(" ")}`.toLowerCase().includes(c))});if(g.length===0){let l=d.createElement("div");l.style.cssText="grid-column: 1 / -1; padding: 48px 16px; text-align: center; color: var(--b3-theme-on-surface-light, #94a3b8); font-size: 13px; display: flex; flex-direction: column; align-items: center; gap: 10px;";let h=a==="uninstalled"?"太棒了！已安装全部推荐插件能力":c?`未找到与「${q(p)}」匹配的块动作`:a==="pinned"?"暂无优先常驻动作 · 点击卡片上的【⭐ 设为优先】放入顶端槽位":s!=="all"?"当前筛选状态下暂无符合条件的动作":"当前分类暂无可启用的动作";if(l.innerHTML=`<div>${h}</div>`,c){let w=d.createElement("button");w.type="button",w.style.cssText="padding: 4px 12px; border-radius: 6px; border: 1px solid var(--b3-theme-primary, #6366f1); background: transparent; color: var(--b3-theme-primary, #6366f1); cursor: pointer; font-size: 12px; font-weight: 500;",w.textContent="清空搜索词",w.addEventListener("click",()=>{p="",ne.value="",me.style.display="none",K()}),l.appendChild(w)}else if(a==="pinned"){let w=d.createElement("button");w.type="button",w.style.cssText="padding: 4px 12px; border-radius: 6px; border: 1px solid var(--b3-theme-primary, #6366f1); background: transparent; color: var(--b3-theme-primary, #6366f1); cursor: pointer; font-size: 12px; font-weight: 500;",w.textContent="前往【全部已就绪】挑选",w.addEventListener("click",()=>{a="ready",be(),K()}),l.appendChild(w)}Q.appendChild(l);return}g.forEach(l=>{let h=n.has(l.id),w=t.includes(l.id),te=l.installed!==!1,oe=w?t.indexOf(l.id)+1:0,J=F(l),X=d.createElement("div");X.className="lv-action-store-card",X.style.cssText=`
                    position: relative;
                    background: ${w?"color-mix(in srgb, #f59e0b 6%, var(--b3-theme-surface))":h?"color-mix(in srgb, var(--b3-theme-primary, #6366f1) 3%, var(--b3-theme-surface))":"var(--b3-theme-surface)"};
                    border: 1.5px solid ${w?"rgba(245, 158, 11, 0.55)":h?"color-mix(in srgb, var(--b3-theme-primary, #6366f1) 35%, transparent)":"var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.2))"};
                    border-radius: 12px;
                    padding: 13px 15px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    box-shadow: ${w?"0 6px 18px -4px rgba(245, 158, 11, 0.16)":h?"0 4px 12px -2px rgba(99, 102, 241, 0.06)":"0 1px 3px rgba(0, 0, 0, 0.03)"};
                    opacity: ${te?h?"1":"0.72":"0.85"};
                    cursor: ${te?"pointer":"default"};
                    transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
                `;let ze=q(l.sourcePlugin||"小驴生态"),De=q(l.id),We=q(l.label),Wt=q(l.subtitle||"精选块级动作"),Gt=q(l.glyph||"⚡"),Ge=`<span style="font-size: 10.5px; padding: 2px 7px; border-radius: 5px; background: color-mix(in srgb, var(--b3-theme-primary, #6366f1) 10%, transparent); color: var(--b3-theme-primary, #6366f1); font-weight: 500;">${ze}</span>`;l.sourceType==="native"?Ge='<span style="font-size: 10.5px; padding: 2px 7px; border-radius: 5px; background: rgba(14, 165, 233, 0.1); color: #0284c7; font-weight: 500;">思源原生</span>':(l.sourceType==="community"||l.sourceType==="plugin-discovery")&&(Ge=`<span style="font-size: 10.5px; padding: 2px 7px; border-radius: 5px; background: rgba(245, 158, 11, 0.1); color: #d97706; font-weight: 500;">${q(l.sourcePlugin||"第三方插件")}</span>`);let Qt=te?'<span style="font-size: 10.5px; color: #10b981; display: flex; align-items: center; gap: 3px; font-weight: 500;">● 已就绪</span>':'<span style="font-size: 10.5px; color: #b45309; background: rgba(245, 158, 11, 0.1); padding: 1px 6px; border-radius: 4px; display: flex; align-items: center; gap: 3px; font-weight: 500;">○ 待安装插件</span>',Jt=w?`<span style="font-size: 10px; font-weight: 700; color: #b45309; background: rgba(245, 158, 11, 0.22); border-radius: 4px; padding: 1px 6px;">#${oe} 优先常驻</span>`:"",Xt=w?"#f59e0b":"var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.28))",Yt=w?"rgba(245, 158, 11, 0.16)":"transparent",Zt=w?"#d97706":"var(--b3-theme-on-surface-light, #64748b)",en=w?"已设为优先常驻项，点击取消常驻":t.length>=5?"常驻槽位已满 (5/5)，点击将自动替换第 5 槽位":"设为优先常驻项（排在顶端快捷栏，最多 5 项）",tn=te?`<label class="lv-store-enable-label" style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer; user-select: none; font-weight: 500;">
                            <input type="checkbox" class="lv-store-enable-chk" data-action-id="${De}" ${h?"checked":""} style="cursor: pointer; width: 15px; height: 15px;" />
                            <span>${h?"已启用":"已停用"}</span>
                        </label>
                        <button type="button" class="lv-store-pin-btn" data-action-id="${De}" style="
                            border: 1px solid ${Xt};
                            background: ${Yt};
                            color: ${Zt};
                            padding: 3px 9px;
                            border-radius: 7px;
                            cursor: pointer;
                            font-size: 11.5px;
                            display: flex;
                            align-items: center;
                            gap: 4px;
                            font-weight: ${w?"600":"500"};
                            transition: all 0.15s ease;
                        " title="${q(en)}">
                            <span>⭐</span>
                            <span>${w?"已优先":"设为优先"}</span>
                        </button>`:`<div style="display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 6px;">
                            <span style="font-size: 11px; color: #b45309; display: inline-flex; align-items: center; gap: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                <span>📦</span>
                                <span>需安装【${q(l.sourcePlugin||"对应插件")}】</span>
                            </span>
                            <button type="button" class="lv-store-goto-market-btn" data-plugin-name="${q(l.sourcePlugin||"")}" data-plugin-id="${q(l.sourcePluginId||"")}" style="
                                border: 1px solid rgba(245, 158, 11, 0.35);
                                background: rgba(245, 158, 11, 0.1);
                                color: #b45309;
                                font-size: 10.5px;
                                padding: 2px 8px;
                                border-radius: 6px;
                                cursor: pointer;
                                flex-shrink: 0;
                                font-weight: 600;
                                transition: all 0.15s ease;
                            " title="复制插件名称并前往思源集市安装">🛒 复制去集市</button>
                        </div>`,nn=l.sourceType==="custom"?`<button type="button" class="lv-store-custom-del-btn" data-action-id="${De}" data-action-label="${We}" style="border: none; background: transparent; cursor: pointer; color: #ef4444; font-size: 13px; padding: 2px 5px; opacity: 0.65; border-radius: 4px; transition: all 0.15s ease;" title="彻底删除此自定义动作">🗑️</button>`:"";X.innerHTML=`
                    <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
                        <div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;">
                            <div style="width: 38px; height: 38px; border-radius: 10px; background: ${J.bg}; color: ${J.color}; border: 1px solid ${J.border}; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                                ${Gt}
                            </div>
                            <div style="min-width: 0; flex: 1;">
                                <div style="font-size: 13.5px; font-weight: 600; line-height: 1.35; color: var(--b3-theme-on-surface); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${We}">${We}</div>
                                <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px; flex-wrap: wrap;">
                                    ${Ge}
                                    ${Qt}
                                    ${Jt}
                                </div>
                            </div>
                        </div>
                        ${nn}
                    </div>
                    <div style="font-size: 11.5px; color: var(--b3-theme-on-surface-light, #64748b); line-height: 1.45; min-height: 32px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;" title="${q(l.subtitle||"")}">
                        ${Wt}
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 9px; border-top: 1px solid var(--b3-theme-surface-lighter, rgba(0,0,0,0.06));">
                        ${tn}
                    </div>
                `,X.addEventListener("click",pe=>{let re=pe.target;if(!(re?.closest("button")||re?.closest("input")||re?.closest(".lv-store-enable-label"))&&te){if(h){n.delete(l.id);let Te=t.indexOf(l.id);Te!==-1&&t.splice(Te,1)}else n.add(l.id);Z(),K()}});let ht=X.querySelector(".lv-store-enable-chk");ht?.addEventListener("change",()=>{if(ht.checked)n.add(l.id);else{n.delete(l.id);let pe=t.indexOf(l.id);pe!==-1&&t.splice(pe,1)}Z(),K()}),X.querySelector(".lv-store-pin-btn")?.addEventListener("click",pe=>{pe.stopPropagation();let re=t.indexOf(l.id);re!==-1?t.splice(re,1):t.length>=5?(t[4]=l.id,n.add(l.id),i(`常驻槽位已满，已将【${l.label}】替换至第 5 项`,1800,"info","块助手")):(t.push(l.id),n.add(l.id)),Z(),K()});let xt=X.querySelector(".lv-store-goto-market-btn");xt?.addEventListener("click",async pe=>{pe.preventDefault(),pe.stopPropagation();let re=xt.getAttribute("data-plugin-name")||"第三方插件";await ue(re)?i(`已复制【${re}】至剪贴板，请在「设置 → 集市 → 插件」中粘贴搜索安装`,3e3,"info","块助手"):i(`请在集市中搜索安装【${re}】`,2500,"info","块助手")});let Qe=X.querySelector(".lv-store-custom-del-btn");Qe?.addEventListener("click",async pe=>{pe.preventDefault(),pe.stopPropagation();let re=Qe.getAttribute("data-action-id"),Te=Qe.getAttribute("data-action-label")||"自定义动作";if(re&&await tt("删除自定义动作",`确定要彻底删除自定义动作【${Te}】吗？`)){let rn=Ae().filter(an=>an.id!==re);He(rn),ie.delete(re),n.delete(re);let vt=t.indexOf(re);vt!==-1&&t.splice(vt,1),Z(),K(),i(`已彻底删除自定义动作【${Te}】`,2e3,"info","块助手")}}),Q.appendChild(X)})},Z=()=>{let c=H.querySelector(".lv-store-summary-text");if(c){let g=t.length>=5?'<span style="font-size: 10px; padding: 1px 6px; border-radius: 4px; background: rgba(245, 158, 11, 0.15); color: #d97706; font-weight: 600; margin-left: 4px;">满额 5/5</span>':"";c.innerHTML=`已启用 ${n.size} 项 · 常驻优先 ${t.length}/5 槽${g}`}V(),j(),be()},be=()=>{le.innerHTML="",$.forEach(c=>{let g=0;c.id==="ready"?g=f.filter(w=>w.installed!==!1).length:c.id==="uninstalled"?g=f.filter(w=>w.installed===!1).length:c.id==="pinned"?g=t.filter(w=>f.find(te=>te.id===w)?.installed!==!1).length:g=f.filter(w=>w.installed!==!1&&N(w,c.id)).length;let l=d.createElement("button");l.type="button";let h=a===c.id;l.style.cssText=`
                    padding: 5px 12px;
                    border-radius: 9999px;
                    border: 1px solid ${h?"var(--b3-theme-primary, #6366f1)":"var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.22))"};
                    background: ${h?"color-mix(in srgb, var(--b3-theme-primary, #6366f1) 14%, var(--b3-theme-surface))":"var(--b3-theme-surface)"};
                    color: ${h?"var(--b3-theme-primary, #6366f1)":"var(--b3-theme-on-surface)"};
                    cursor: pointer;
                    font-size: 12px;
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    white-space: nowrap;
                    font-weight: ${h?"600":"500"};
                    transition: all 0.15s ease-out;
                    flex-shrink: 0;
                    box-shadow: ${h?"0 2px 6px rgba(99, 102, 241, 0.12)":"none"};
                `,l.innerHTML=`<span>${q(c.glyph)}</span><span>${q(c.label)}</span><span style="font-size: 10.5px; opacity: 0.72; padding: 1px 5px; border-radius: 999px; background: rgba(0,0,0,0.06);">${g}</span>`,l.addEventListener("click",()=>{a=c.id,be(),K()}),le.appendChild(l)})};v.appendChild(T),v.appendChild(ae),v.appendChild(B),P.appendChild(D),P.appendChild(A),P.appendChild(z),P.appendChild(ge),v.appendChild(P),v.appendChild(Q),v.appendChild(H),E.appendChild(v);let $e=()=>{if(typeof b<"u"&&b.visualViewport){let c=b.visualViewport.height;v.style.maxHeight=`${Math.min(c-20,860)}px`}};typeof b<"u"&&b.visualViewport&&b.visualViewport.addEventListener("resize",$e);let fe=null,ye=()=>{try{fe?.()}catch{}fe=null,typeof b<"u"&&(b.visualViewport&&b.visualViewport.removeEventListener("resize",$e),b.removeEventListener("lv-block-assistant-toggle",de)),typeof d<"u"&&d.removeEventListener("keydown",ke,!0);try{E.remove()}catch{}};fe=Ze.push({id:"lv-block-action-store-mask",type:"dialog",dismiss:()=>p?(p="",ne.value="",me.style.display="none",K(),"keep"):(ye(),!0)});let ke=c=>{if(c.altKey&&(c.key==="ArrowLeft"||c.key==="ArrowRight")){c.preventDefault(),c.stopPropagation();let g=$.map(h=>h.id),l=g.indexOf(a);if(l!==-1){let h=c.key==="ArrowRight"?(l+1)%g.length:(l-1+g.length)%g.length;a=g[h]||"ready",be(),K()}}};typeof d<"u"&&d.addEventListener("keydown",ke,!0),T.querySelector(".lv-store-close-btn")?.addEventListener("click",ye),E.addEventListener("click",c=>{c.target===E&&ye()});let ne=D.querySelector(".lv-store-search-input"),me=D.querySelector(".lv-store-search-clear"),u=!1;ne.addEventListener("compositionstart",()=>{u=!0}),ne.addEventListener("compositionend",()=>{u=!1,p=ne.value,me.style.display=p?"inline-flex":"none",K()}),ne.addEventListener("input",()=>{u||(p=ne.value,me.style.display=p?"inline-flex":"none",K())}),me?.addEventListener("click",()=>{p="",ne.value="",me.style.display="none",ne.focus(),K()}),D.querySelectorAll(".lv-store-status-btn").forEach(c=>{c.addEventListener("click",()=>{let g=c.getAttribute("data-status");g&&(s=g,D.querySelectorAll(".lv-store-status-btn").forEach(l=>{let h=l.getAttribute("data-status")===g;l.style.border=h?"1px solid var(--b3-theme-primary, #6366f1)":"1px solid var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.25))",l.style.background=h?"color-mix(in srgb, var(--b3-theme-primary, #6366f1) 12%, transparent)":"var(--b3-theme-surface)",l.style.color=h?"var(--b3-theme-primary, #6366f1)":"inherit",l.style.fontWeight=h?"600":"normal"}),K())})});let O={"all-star":{label:"黄金全能",enabled:[...at],pinned:[...rt]},exam:{label:"考研备考",enabled:["edit-card-qa","make-cloze","make-occlusion","add-to-deck","to-exam-question","exam-ai-generate","bind-checkin-item","copy-block-ref"],pinned:["edit-card-qa","make-cloze","to-exam-question"]},writing:{label:"写作研读",enabled:["focus-block","copy-embed-ref","toggle-block-fold","morph-block-type","copy-block-ref","copy-plain-text","to-glean-library","capture-quote-common","plugin-pangu-spacing","plugin-convert-punctuation"],pinned:["focus-block","capture-quote-common","copy-plain-text"]},org:{label:"结构排版",enabled:["copy-embed-ref","toggle-block-fold","native-move-up","native-move-down","duplicate-block","community-mindmap","plugin-table-format"],pinned:["copy-embed-ref","native-move-up","native-move-down"]},minimal:{label:"极简原生",enabled:["focus-block","copy-block-ref","copy-plain-text"],pinned:["focus-block","copy-plain-text"]}},ee=c=>{A.querySelectorAll(".lv-store-preset-btn").forEach(g=>{let h=g.getAttribute("data-preset")===c;g.style.borderColor=h?"var(--b3-theme-primary, #6366f1)":"var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.25))",g.style.background=h?"color-mix(in srgb, var(--b3-theme-primary, #6366f1) 14%, transparent)":"var(--b3-theme-surface)",g.style.color=h?"var(--b3-theme-primary, #6366f1)":"inherit",g.style.fontWeight=h?"600":"normal"})};A.querySelectorAll(".lv-store-preset-btn").forEach(c=>{c.addEventListener("click",()=>{let g=c.getAttribute("data-preset"),l=g?O[g]:null;l&&(n=new Set(l.enabled),t=[...l.pinned],m=g||"",ee(m),Z(),K(),i(`已应用【${l.label}】场景预设`,1800,"info","块助手"))})}),A.querySelector(".lv-store-select-all-btn")?.addEventListener("click",()=>{let c=f.filter(g=>g.installed!==!1&&N(g,a));c.forEach(g=>n.add(g.id)),Z(),K(),i(`已启用当前分类下的【${c.length}】项动作`,1600,"info","块助手")}),A.querySelector(".lv-store-unselect-all-btn")?.addEventListener("click",()=>{let c=f.filter(g=>g.installed!==!1&&N(g,a));c.forEach(g=>{n.delete(g.id);let l=t.indexOf(g.id);l!==-1&&t.splice(l,1)}),Z(),K(),i(`已停用当前分类下的【${c.length}】项动作`,1600,"info","块助手")}),A.querySelector(".lv-store-export-btn")?.addEventListener("click",async()=>{let c={version:1,enabledActionIds:Array.from(n),pinnedActionIds:t,customActions:Ae(),exportedAt:new ce().toISOString()};await ue(JSON.stringify(c,null,2))?i("已复制块助手装配配置至剪贴板",2e3,"info","块助手"):i("复制失败，请检查剪贴板权限",2e3,"error","块助手")}),A.querySelector(".lv-store-import-btn")?.addEventListener("click",async()=>{let c=await Bt("导入块助手装配配置","请粘贴导出的块助手装配配置 (JSON)：");if(c)try{let g=JSON.parse(c.trim());if(g&&typeof g=="object"&&(Array.isArray(g.enabledActionIds)||Array.isArray(g.pinnedActionIds))){let l=Array.isArray(g.enabledActionIds)?g.enabledActionIds:Array.from(n),h=Array.isArray(g.pinnedActionIds)?g.pinnedActionIds:t;if(n=new Set(l),t=[...h].slice(0,5),Array.isArray(g.customActions)&&g.customActions.length>0){let w=Ae(),te=new Set(w.map(J=>J.id)),oe=0;for(let J of g.customActions)if(!(!J||!J.id||!J.label)){if(J.actionType==="script"){oe++;continue}(J.actionType==="prefix-suffix"||J.actionType==="attr")&&!te.has(J.id)&&(w.push(J),je(J))}He(w),oe>0&&i(`已自动过滤 ${oe} 个高危 JS 脚本动作（Wave 1C 已清退）`,2400,"info","块助手")}Z(),K(),i("已成功导入块助手装配配置",2e3,"info","块助手")}else i("配置格式不符合规范",2e3,"error","块助手")}catch{i("JSON 解析失败，请检查输入",2e3,"error","块助手")}});let L=A.querySelector(".lv-store-custom-toggle-btn"),R=z.querySelector(".lv-custom-type"),M=z.querySelector(".lv-custom-param-box");L?.addEventListener("click",()=>{let c=z.style.display==="none";z.style.display=c?"flex":"none"}),z.querySelector(".lv-custom-close-btn")?.addEventListener("click",()=>{z.style.display="none"}),R?.addEventListener("change",()=>{let c=R.value;c==="prefix-suffix"?M.innerHTML=`
                    <input type="text" class="lv-custom-prefix" placeholder="前缀 (如: * [ ] )" style="flex:1;padding:6px 9px;border-radius:6px;border:1px solid var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.25));background:var(--b3-theme-surface);color:inherit;font-size:12px;" />
                    <input type="text" class="lv-custom-suffix" placeholder="后缀" style="flex:1;padding:6px 9px;border-radius:6px;border:1px solid var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.25));background:var(--b3-theme-surface);color:inherit;font-size:12px;" />
                `:c==="attr"&&(M.innerHTML=`
                    <input type="text" class="lv-custom-attr-key" placeholder="属性名 (如: custom-tag)" style="flex:1;padding:6px 9px;border-radius:6px;border:1px solid var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.25));background:var(--b3-theme-surface);color:inherit;font-size:12px;" />
                    <input type="text" class="lv-custom-attr-val" placeholder="属性值 (如: 重要)" style="flex:1;padding:6px 9px;border-radius:6px;border:1px solid var(--b3-theme-surface-lighter, rgba(148, 163, 184, 0.25));background:var(--b3-theme-surface);color:inherit;font-size:12px;" />
                `)}),z.querySelector(".lv-custom-test-btn")?.addEventListener("click",async()=>{let c=R.value,g=z.querySelector(".lv-custom-prefix")?.value||"",l=z.querySelector(".lv-custom-suffix")?.value||"",h=z.querySelector(".lv-custom-attr-key")?.value||"",w=z.querySelector(".lv-custom-attr-val")?.value||"",te=et(),oe=te?.querySelector(".protyle-wysiwyg [data-node-id]:focus-within")||te?.querySelector(".protyle-wysiwyg--select[data-node-id]")||te?.querySelector(".protyle-wysiwyg > [data-node-id]")||d.querySelector(".protyle-wysiwyg [data-node-id]:focus-within, .protyle-wysiwyg--select[data-node-id], .protyle-wysiwyg > [data-node-id]");if(!(oe?.getAttribute("data-node-id")||"")){i("未在当前编辑器中找到活动块供试运行",2e3,"info","块助手");return}try{if(c==="prefix-suffix"){let X=W(oe);i(`[试运行模拟] 结果: "${g}${X.slice(0,24)}${l}" (预演成功)`,2600,"info","块助手")}else if(c==="attr"){if(!h){i("请输入要写入的属性名",2e3,"info","块助手");return}i(`[试运行模拟] 将在块上写入属性 ${h}="${w||"1"}"`,2600,"info","块助手")}}catch(X){i(`试运行报错: ${X?.message||String(X)}`,2600,"error","块助手")}}),z.querySelector(".lv-custom-save-btn")?.addEventListener("click",()=>{let c=z.querySelector(".lv-custom-name")?.value?.trim(),g=z.querySelector(".lv-custom-glyph")?.value?.trim()||"⚡",l=z.querySelector(".lv-custom-subtitle")?.value?.trim()||"自定义块动作",h=z.querySelector(".lv-custom-group")?.value||"organization",te=R.value==="attr"?"attr":"prefix-suffix";if(!c){i("请输入自定义动作名称",2e3,"info","块助手");return}let oe=(z.querySelector(".lv-custom-attr-key")?.value||"").trim(),J=oe?/^(custom-[a-z][a-z0-9-]*|memo$|bookmark$|name$|alias$|style$)/.test(oe)?oe:`custom-${oe.toLowerCase().replace(/[^a-z0-9-]+/g,"-")}`:"",X={id:`custom-act-${ce.now()}`,label:c,glyph:g,subtitle:l,group:h,actionType:te,prefix:z.querySelector(".lv-custom-prefix")?.value,suffix:z.querySelector(".lv-custom-suffix")?.value,attrKey:J,attrValue:z.querySelector(".lv-custom-attr-val")?.value,createdAt:ce.now()},ze=Ae();ze.push(X),He(ze),je(X),n.add(X.id),z.style.display="none",Z(),K(),i(`已成功创建自定义动作【${c}】并加入资产库`,2200,"info","块助手")}),H.querySelector(".lv-store-scan-btn")?.addEventListener("click",()=>{Ce(!0),i(`已重新探测运行环境，当前可用动作总数: ${ie.size}`,2e3,"info","块助手"),be(),K()}),H.querySelector(".lv-store-reset-btn")?.addEventListener("click",()=>{n=new Set(at),t=[...rt],r=nt,m="all-star",ee("all-star");try{typeof he<"u"&&he.removeItem("lv_cards_block_action_usage")}catch{}Z(),K(),i("已恢复推荐默认预设，并重置动作使用频次学习",2e3,"info","块助手")}),H.querySelector(".lv-store-save-btn")?.addEventListener("click",()=>{let c={version:1,enabledActionIds:Array.from(n),pinnedActionIds:t,doubleClickActionId:r};ot(c),o?.onConfigChange?.(c);try{typeof b<"u"&&b.dispatchEvent(new Et("lv-block-action-config-changed",{detail:c}))}catch{}ye(),i(`块助手资产库配置已保存（已启用 ${n.size} 项，常驻 ${t.length} 项）`,2200,"info","块助手")}),d.body.appendChild(E),V(),j(),be(),K()},bt="lv_ba_action_usage_v1",jt=10,yt=()=>{try{let o=he?.getItem(bt),e=o?JSON.parse(o):null;return e&&typeof e=="object"&&!Array.isArray(e)?e:{}}catch{return{}}},Vt=o=>{try{let e=yt();e[o]=(Number(e[o])||0)+1,he?.setItem(bt,JSON.stringify(e))}catch{}},Dt=(o,e)=>{if(!d||typeof d.querySelectorAll!="function")return[o];try{let t=e?.closest?.(".protyle")||et()||d,a=Array.from(t.querySelectorAll(".protyle-wysiwyg--select[data-node-id]")).map(s=>s.getAttribute("data-node-id")||"").filter(Boolean);if(a.length>1)return a.includes(o)?a:[o,...a]}catch{}return[o]};return{version:At,BLOCK_MORPH_TARGETS:Ee,extractCoreMarkdown:Oe,detectCurrentBlockType:Ie,safeTransformBlockMarkdown:qe,getPureBlockMarkdown:Le,morphBlockTypeTo:Fe,openBlockTypeMorphPicker:pt,initCuratedActions:ut,scanPlugins:Ce,openStoreDialog:Ut,openUniqueBamMenu:(o,e,n)=>{if(!Se()||typeof d>"u"||!d.body||e&&it(e))return;let t=e&&typeof e.getAttribute=="function"&&e.getAttribute("data-node-id")?e:C(o)||e;if(t&&it(t))return;Re(),Ne(".lv-bam, .lv-bam-mobile-mask");let r=se(),a=dt(o,t),s=Dt(o,t),p=s.length>1,m=r.getPinnedActions(!1,a).filter(u=>u.installed!==!1),f=new Set(m.map(u=>u.id)),y=r.getEnabledActions(!1,a).filter(u=>u.installed!==!1&&!f.has(u.id)),$=[...m,...y],N=$.some(u=>u.id==="toggle-block-fold"),F=$.some(u=>u.id==="duplicate-block"),E=$.filter(u=>!(N&&u.id==="toggle-fold-block"||F&&u.id==="native-clone-block"||p&&u.singleOnly)),v=yt(),T=u=>[...u].sort((O,ee)=>(Number(v[ee.id])||0)-(Number(v[O.id])||0)),I=new Set(E.filter(u=>f.has(u.id)&&!u.destructive).map(u=>u.id)),k=E.filter(u=>I.has(u.id)),U=E.filter(u=>u.destructive===!0),G=E.filter(u=>!I.has(u.id)&&!u.destructive),de=T(G.filter(u=>u.sourceType==="native"||u.group==="native"||u.group==="organization"||u.group==="clipboard")),ae=T(G.filter(u=>!(u.sourceType==="native"||u.group==="native"||u.group==="organization"||u.group==="clipboard"))),ve=typeof b<"u"&&b.innerWidth||1200,S=typeof b<"u"&&b.innerHeight||800,j=!1;try{j=typeof b<"u"&&typeof b.matchMedia=="function"?!!b.matchMedia("(pointer: coarse)")?.matches:!1}catch{}let B=ve<=640||j||Ct(),V=k.length+de.length+ae.length+U.length,P=!B&&V>jt,D=null,A=d.createElement("div");A.className=P?"lv-bam lv-bam--dense":"lv-bam",A.setAttribute("role","menu"),A.setAttribute("data-block-id",o),A.setAttribute("data-readonly",a.isReadOnly?"true":"false"),A.setAttribute("data-density",P?"command":"focus"),p&&A.setAttribute("data-batch-count",String(s.length));let z=d.createElement("div");z.className="lv-bam__header";let ge=p?`批量操作 (${s.length} 块)`:a.isCard?"块助手 · 已制卡":"块助手";z.innerHTML=`<span>${q(ge)}</span>${a.isReadOnly?'<span class="lv-bam__readonly-tag">只读</span>':""}`,A.appendChild(z);let le=null,Q=null,H=()=>{if(Q!==null&&typeof Ye=="function"){try{Ye(Q)}catch{}Q=null}try{le?.()}catch{}le=null;try{A.remove()}catch{}try{D?.remove()}catch{}typeof d<"u"&&(d.removeEventListener("keydown",be,!0),d.removeEventListener("mousedown",$e,!0),d.removeEventListener("scroll",fe,!0)),typeof b<"u"&&typeof b.removeEventListener=="function"&&(b.removeEventListener("scroll",fe,!0),b.removeEventListener("resize",fe))},K=()=>{let u=typeof b<"u"&&b.innerWidth||1200,O=typeof b<"u"&&b.innerHeight||800,ee=Math.max(240,Math.min(P?500:340,Number(A.offsetWidth)||(P?460:280))),L=Math.max(180,Math.min(Math.round(O*.68),Number(A.offsetHeight)||320)),R=80,M=80;try{let c=e&&typeof e.getBoundingClientRect=="function"?e:t;if(c&&typeof c.getBoundingClientRect=="function"){let g=c.getBoundingClientRect(),h=g.left+ee>u-12?g.right-ee:g.left;M=Math.max(12,Math.min(u-ee-12,h)),g.bottom+6+L<=O-12?R=Math.max(12,g.bottom+6):g.top-L-6>=12?R=g.top-L-6:R=Math.max(12,Math.min(O-L-12,g.bottom+6))}}catch{}A.style.top=`${Math.round(R)}px`,A.style.left=`${Math.round(M)}px`},Z=u=>{if(H(),a.isReadOnly&&!ct(u)){i("当前文档处于只读状态，已拦截写入操作",1800,"info","块助手");return}Vt(u.id),Promise.resolve(u.execute(o,a,p?s:void 0)).catch(()=>{})},be=u=>{if(u.isComposing||u.keyCode===229)return;if(u.key==="Escape"){u.preventDefault(),H();return}if(!u.ctrlKey&&!u.altKey&&!u.metaKey&&/^[1-9]$/.test(u.key)){let L=Number(u.key)-1,R=Array.from(A.querySelectorAll(".lv-bam__quick-btn")),M=R.length>0?R:Array.from(A.querySelectorAll(".lv-bam-item"));if(M[L]){u.preventDefault(),u.stopPropagation(),M[L].click();return}}let O=u.key==="ArrowDown"||u.key==="ArrowUp",ee=P&&(u.key==="ArrowRight"||u.key==="ArrowLeft");if(O||ee){u.preventDefault();let L=Array.from(A.querySelectorAll(".lv-bam-item"));if(L.length===0)return;let R=d.activeElement,M=L.indexOf(R),c=0;u.key==="ArrowRight"?c=Math.min(L.length-1,M<0?0:M+1):u.key==="ArrowLeft"?c=Math.max(0,M<=0?0:M-1):u.key==="ArrowDown"?c=M<0?0:(M+1)%L.length:c=M<=0?L.length-1:(M-1+L.length)%L.length,L[c]?.focus?.({preventScroll:!0});return}if(u.key==="Enter"){let L=d.activeElement;L&&A.contains(L)&&L.classList?.contains?.("lv-bam-item")&&(u.preventDefault(),L.click())}},$e=u=>{u.target&&typeof A.contains=="function"&&!A.contains(u.target)&&(u.target?.closest?.('#lv-shared-block-capsule [data-role="capsule-trigger"]')&&n?.onClosedByTrigger?.(),H())},fe=u=>{if(u&&u.type==="scroll"&&u.target&&typeof A.contains=="function"&&A.contains(u.target))return;let O=e&&typeof e.getBoundingClientRect=="function"?e:t;if(!(u?.type!=="resize"&&O&&O.isConnected!==!1&&typeof O.getBoundingClientRect=="function"&&typeof Xe=="function")){H();return}Q===null&&(Q=Xe(()=>{if(Q=null,!!A.isConnected){try{let L=O.getBoundingClientRect(),R=typeof b<"u"&&b.innerHeight||800;if(!L||L.width<=0||L.height<=0||L.bottom<0||L.top>R){H();return}}catch{H();return}K()}}))};if(le=Ze.push({id:"lv-builtin-bam-menu",type:"menu",dismiss:()=>(H(),!0)}),B){D=d.createElement("div"),D.className="lv-bam-mobile-mask",D.setAttribute("aria-hidden","true");let u=O=>{O.preventDefault(),O.stopPropagation(),H()};D.addEventListener("mousedown",u),D.addEventListener("touchend",u),D.addEventListener("click",u)}let ye=(u,O,ee,L=!1)=>{let R=d.createElement("div");R.className=L?"lv-bam-group-header lv-bam-group-header--danger":"lv-bam-group-header",R.setAttribute("data-group",O),R.textContent=P?`${u} (${ee})`:u,A.appendChild(R)},ke=(u,O,ee=!1)=>{let L=P&&!ee,R=L?d.createElement("div"):A;L&&(R.className="lv-bam__grid");for(let M of u){let c=d.createElement("button");c.type="button",c.className=M.destructive?"lv-bam-item lv-bam-item--danger":"lv-bam-item",c.setAttribute("role","menuitem"),c.setAttribute("data-action-id",M.id),M.destructive&&c.setAttribute("data-danger","true"),O&&c.setAttribute("data-pinned","true");let g=typeof M.getDynamicLabel=="function"?M.getDynamicLabel(a):M.label;L&&M.subtitle&&(c.title=M.subtitle);let l=O?'<span class="lv-bam-badge lv-bam-badge--pinned">⭐ 优先</span>':M.badgeText?`<span class="lv-bam-badge" style="font-size:10px;color:var(--b3-theme-on-surface-light,#6c6c6c);flex-shrink:0;">${q(M.badgeText)}</span>`:"",h=!L&&M.subtitle?`<span class="lv-bam__item-sub">${q(M.subtitle)}</span>`:"";c.innerHTML=`<span>${q(M.glyph||"⚡")}</span><span class="lv-bam__item-main"><span class="lv-bam__item-title">${q(g)}</span>${h}</span>${l}`,c.addEventListener("click",w=>{w.stopPropagation(),Z(M)}),R.appendChild(c)}L&&A.appendChild(R)};if(k.length>0){let u=d.createElement("div");u.className="lv-bam__quick-bar",k.slice(0,9).forEach((O,ee)=>{let L=d.createElement("button");L.type="button",L.className="lv-bam__quick-btn",L.setAttribute("data-action-id",O.id);let R=typeof O.getDynamicLabel=="function"?O.getDynamicLabel(a):O.label;L.innerHTML=`<span class="lv-bam__kbd-num">${ee+1}</span><span>${q(O.glyph||"⚡")}</span><span>${q(R)}</span>`,L.addEventListener("click",M=>{M.stopPropagation(),Z(O)}),u.appendChild(L)}),A.appendChild(u),ye("⭐ 优先常驻","pinned",k.length),ke(k,!0)}if(de.length>0){if(k.length>0){let u=d.createElement("div");u.className="lv-bam-divider",u.setAttribute("role","separator"),A.appendChild(u)}ye("原生块操作","native",de.length),ke(de,!1)}if(ae.length>0){if(k.length>0||de.length>0){let u=d.createElement("div");u.className="lv-bam-divider",u.setAttribute("role","separator"),A.appendChild(u)}ye("生态增强","ecosystem",ae.length),ke(ae,!1)}if(U.length>0){let u=d.createElement("div");u.className="lv-bam-divider lv-bam-divider--danger",u.setAttribute("role","separator"),A.appendChild(u),ye("⚠️ 危险操作","danger",U.length,!0),ke(U,!1,!0)}let ne=d.createElement("button");ne.type="button",ne.className="lv-bam-store-btn",ne.style.cssText="margin-top:4px;padding:6px 8px;border:none;border-top:1px solid var(--b3-border-color,rgba(128,128,128,0.16));background:transparent;color:var(--b3-theme-on-surface-light,#6c6c6c);cursor:pointer;text-align:left;font-size:11px;width:100%;box-sizing:border-box;display:flex;align-items:center;gap:6px;flex-shrink:0;",ne.textContent="📦 资产库 · 定制动作与双击快捷操作…",ne.addEventListener("click",u=>{u.stopPropagation(),H(),r.openStoreDialog()}),A.appendChild(ne);let me=d.createElement("div");me.className="lv-bam__footer",me.innerHTML=`<span>↑↓${P?"←→":""} 选择 · 1~9 直达 · Enter 确认 · Esc 关闭</span>`,A.appendChild(me),typeof d<"u"&&typeof d.addEventListener=="function"&&(d.addEventListener("keydown",be,!0),d.addEventListener("mousedown",$e,!0),d.addEventListener("scroll",fe,!0)),typeof b<"u"&&typeof b.addEventListener=="function"&&(b.addEventListener("scroll",fe,!0),b.addEventListener("resize",fe)),D&&d.body.appendChild(D),d.body.appendChild(A),K()},executeDoubleClickActionInternal:async(o,e)=>{let n=Pe(_e().doubleClickActionId);if(!Se())return{ok:!1,status:"master_switch_disabled",actionId:n};if(!n||n===xe)return{ok:!1,status:"double_click_disabled",actionId:xe};let t=e&&typeof e.blockId=="string"?e:dt(o,e||void 0);Ce();let r=ie.get(n);return!r||r.installed===!1?{ok:!1,status:"action_unavailable_or_uninstalled",actionId:n}:r.destructive||r.id==="delete-block"||r.id==="cut-block"?{ok:!1,status:"destructive_blocked",actionId:n}:t.isReadOnly&&!ct(r)?(i("当前文档处于只读状态，已拦截写入操作",1800,"info","块助手"),{ok:!1,status:"readonly_blocked",actionId:n}):x.isActionAllowedForSnapshot(r,t)?(await r.execute(o,t),{ok:!0,status:"executed",actionId:n}):(i(`当前块不支持「${r.label}」`,1800,"info","块助手"),{ok:!1,status:"context_filtered_unavailable",actionId:n})},getScanCacheStatus:()=>({lastScanTime:Me,scanCount:mt,fingerprint:Ve,ttlMs:gt})}}var wt={protocol:200,init:kt};try{if(typeof window<"u"){let x=window;x.__LV_KIT_CHUNKS__||(x.__LV_KIT_CHUNKS__={}),x.__LV_KIT_CHUNKS__["lv-kit-ba-store"]=wt}}catch{}var gn=wt;return pn(fn);})();
;(function(e){var d=e&&e.default?e.default:e;if(!d)return;var g=typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:null);if(g){g.__LV_KIT_CHUNKS__=g.__LV_KIT_CHUNKS__||{};g.__LV_KIT_CHUNKS__["lv-kit-ba-store"]=d;}if(typeof module==="object"&&module&&typeof module.exports==="object"){module.exports=d;}})(typeof __LV_KIT_CHUNK_EXPORT__!=="undefined"?__LV_KIT_CHUNK_EXPORT__:undefined);
