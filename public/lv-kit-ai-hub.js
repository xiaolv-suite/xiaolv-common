/* lv-kit-ai-hub v200 */
var __LV_KIT_CHUNK_EXPORT__=(()=>{var Q=Object.defineProperty;var Ce=Object.getOwnPropertyDescriptor;var Te=Object.getOwnPropertyNames;var Me=Object.prototype.hasOwnProperty;var Pe=(v,g)=>{for(var d in g)Q(v,d,{get:g[d],enumerable:!0})},He=(v,g,d,q)=>{if(g&&typeof g=="object"||typeof g=="function")for(let A of Te(g))!Me.call(v,A)&&A!==d&&Q(v,A,{get:()=>g[A],enumerable:!(q=Ce(g,A))||q.enumerable});return v};var $e=v=>He(Q({},"__esModule",{value:!0}),v);var Re={};Pe(Re,{createAiHubChunk:()=>de,default:()=>Oe});var Ie=`/* ===== 全生态通用苏格拉底式 AI 思考感知卡片 (LvAiProgress) ===== */
.lv-ai-thinking{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 16px;gap:12px;text-align:center;width:100%;box-sizing:border-box;white-space:normal}
.lv-ai-thinking--compact{padding:14px 12px;gap:8px}
.lv-ai-thinking--compact .lv-ai-thinking__glow{width:40px;height:40px}
.lv-ai-thinking--compact .lv-ai-thinking__icon{font-size:20px}
.lv-ai-thinking__title{font-size:13.5px;font-weight:700;color:var(--b3-theme-on-surface,var(--lv-safe-text,#0f172a));margin-bottom:2px;line-height:1.4}
.lv-ai-thinking__subtitle{font-size:11.5px;color:var(--b3-theme-on-surface-light,var(--lv-safe-text-muted,#64748b));margin-top:-6px;line-height:1.45;max-width:340px}
.lv-ai-thinking__glow{position:relative;width:52px;height:52px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--b3-theme-primary,#3b82f6) 12%,transparent);box-shadow:0 0 24px color-mix(in srgb,var(--b3-theme-primary,#3b82f6) 24%,transparent);animation:lvAiPulse 2s ease-in-out infinite;flex-shrink:0}
.lv-ai-thinking__icon{font-size:24px;line-height:1}
.lv-ai-thinking__stage{font-size:13px;font-weight:600;color:var(--b3-theme-primary,#2563eb);min-height:20px;line-height:1.45;transition:color .2s ease;animation:lvAiFade .3s ease both}
.lv-ai-thinking__timer{display:inline-flex;align-items:center;gap:4px;font-size:11.5px;padding:3px 10px;border-radius:999px;background:color-mix(in srgb,var(--b3-theme-on-surface,#0f172a) 6%,transparent);color:var(--b3-theme-on-surface,var(--lv-safe-text-muted,#475569));font-variant-numeric:tabular-nums}
.lv-ai-thinking__progress{width:min(260px,84%);height:4px;border-radius:999px;background:color-mix(in srgb,var(--b3-theme-primary,#3b82f6) 15%,transparent);overflow:hidden;position:relative}
.lv-ai-thinking__bar{position:absolute;inset:0;width:40%;border-radius:999px;background:var(--b3-theme-primary,#2563eb);animation:lvAiIndeterminate 1.8s ease-in-out infinite}
.lv-ai-thinking__cancel{margin-top:4px;font-size:11.5px;padding:5px 14px;min-height:30px;border-radius:999px;border:1px solid var(--b3-theme-surface-lighter,rgba(15,23,42,.16));background:transparent;color:var(--b3-theme-on-surface-light,var(--lv-safe-text-muted,#475569));cursor:pointer;font-family:inherit;transition:background-color .15s ease,color .15s ease,border-color .15s ease}
.lv-ai-thinking__cancel:hover{background:rgba(239,68,68,.1);color:#ef4444;border-color:rgba(239,68,68,.35)}
.lv-ai-thinking__cancel:focus-visible{outline:2px solid var(--b3-theme-primary,#2563eb);outline-offset:2px}
:is([data-theme-mode="dark"],[data-appearance="dark"],body.body--dark,body.theme--dark,html.dark,body.dark) .lv-ai-thinking__title{color:var(--b3-theme-on-surface,#f1f5f9)}
:is([data-theme-mode="dark"],[data-appearance="dark"],body.body--dark,body.theme--dark,html.dark,body.dark) .lv-ai-thinking__subtitle{color:var(--b3-theme-on-surface-light,#94a3b8)}
:is([data-theme-mode="dark"],[data-appearance="dark"],body.body--dark,body.theme--dark,html.dark,body.dark) .lv-ai-thinking__stage{color:var(--b3-theme-primary,#60a5fa)}
:is([data-theme-mode="dark"],[data-appearance="dark"],body.body--dark,body.theme--dark,html.dark,body.dark) .lv-ai-thinking__timer{background:rgba(255,255,255,.08);color:var(--b3-theme-on-surface,#cbd5e1)}
:is([data-theme-mode="dark"],[data-appearance="dark"],body.body--dark,body.theme--dark,html.dark,body.dark) .lv-ai-thinking__cancel{border-color:rgba(255,255,255,.16);color:#cbd5e1}
@keyframes lvAiPulse{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.08);opacity:1;box-shadow:0 0 32px color-mix(in srgb,var(--b3-theme-primary,#3b82f6) 38%,transparent)}}
@keyframes lvAiIndeterminate{0%{left:-40%}100%{left:100%}}
@keyframes lvAiFade{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}

/* ===== 全生态非阻塞 AI 等待浮层 (withLvAiWait / openLvAiWaitOverlay) ===== */
.lv-ai-wait-mask{position:fixed;inset:0;z-index:1120;background:rgba(15,23,42,.38);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px max(16px,env(safe-area-inset-right,0px)) max(16px,env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));box-sizing:border-box;animation:lvSheetMaskIn 180ms ease both}
.lv-ai-wait-card{position:relative;width:min(420px,calc(100vw - 24px));max-height:85dvh;overflow-y:auto;background:var(--b3-theme-surface,var(--lv-safe-surface,#fff));color:var(--b3-theme-on-surface,var(--lv-safe-text,#0f172a));border:1px solid var(--b3-theme-surface-lighter,var(--lv-safe-border,rgba(15,23,42,.12)));border-radius:16px;box-shadow:0 20px 48px -10px rgba(15,23,42,.26),0 0 0 1px rgba(255,255,255,.08) inset;padding:8px 12px 12px;box-sizing:border-box;font-family:var(--b3-font-family,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif);animation:lvSheetCenter 200ms cubic-bezier(.22,1,.36,1) both}
.lv-ai-wait-card__close{position:absolute;top:10px;right:10px;width:28px;height:28px;border-radius:8px;border:none;background:transparent;color:var(--b3-theme-on-surface-light,var(--lv-safe-text-muted,#64748b));cursor:pointer;font-size:14px;display:inline-flex;align-items:center;justify-content:center;transition:background-color .14s ease,color .14s ease}
.lv-ai-wait-card__close:hover{background:rgba(15,23,42,.06);color:var(--b3-theme-on-surface,var(--lv-safe-text,#0f172a))}
.lv-ai-wait-card__close:focus-visible{outline:2px solid var(--b3-theme-primary,#2563eb);outline-offset:2px}
.lv-ai-wait-card__body{width:100%;box-sizing:border-box}
:is([data-theme-mode="dark"],[data-appearance="dark"],body.body--dark,body.theme--dark,html.dark,body.dark) .lv-ai-wait-mask{background:rgba(0,0,0,.56)}
:is([data-theme-mode="dark"],[data-appearance="dark"],body.body--dark,body.theme--dark,html.dark,body.dark) .lv-ai-wait-card{background:var(--b3-theme-surface,#1e2433);color:var(--b3-theme-on-surface,#f1f5f9);border-color:rgba(255,255,255,.14);box-shadow:0 24px 54px -10px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.06) inset}
:is([data-theme-mode="dark"],[data-appearance="dark"],body.body--dark,body.theme--dark,html.dark,body.dark) .lv-ai-wait-card__close{color:#94a3b8}
:is([data-theme-mode="dark"],[data-appearance="dark"],body.body--dark,body.theme--dark,html.dark,body.dark) .lv-ai-wait-card__close:hover{background:rgba(255,255,255,.08);color:#f8fafc}
@media (max-width:600px){
  .lv-ai-wait-card{width:min(366px,calc(100vw - 24px));border-radius:14px;padding:8px 10px 10px}
  .lv-ai-thinking{padding:18px 12px;gap:10px}
  .lv-ai-thinking__cancel{min-height:38px;padding:7px 16px;font-size:12.5px}
  .lv-ai-wait-card__close{width:34px;height:34px}
}
/* ===== AI 智能调度中枢五级瀑布可视化与分级说明 ===== */
.lv-ai-hub-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
}
.lv-ai-waterfall-card {
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--lv-lp-panel-bg, #f8fafc);
  border: 1px solid var(--lv-lp-border, rgba(15,23,42,0.08));
}
.lv-ai-waterfall-track {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 6px;
  padding: 6px 2px;
}
.lv-ai-wf-node {
  flex: 1 1 92px;
  min-width: 88px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--lv-lp-card-bg, #fff);
  border: 1px solid var(--lv-lp-border, rgba(15,23,42,0.08));
  display: flex;
  flex-direction: column;
  gap: 3px;
  transition: all 0.2s ease;
  box-sizing: border-box;
}
.lv-ai-wf-node.preferred {
  border-color: var(--lv-lp-accent, #2563eb) !important;
  box-shadow: 0 0 0 1.5px color-mix(in srgb, var(--lv-lp-accent, #2563eb) 35%, transparent);
  background: var(--lv-lp-accent-soft, rgba(37,99,235,0.08)) !important;
}
.lv-ai-wf-arrow {
  flex: 0 0 auto;
  align-self: center;
  color: var(--lv-lp-text-sub, #64748b);
  font-weight: 700;
  font-size: 13px;
  opacity: 0.55;
  user-select: none;
}
.lv-ai-tier-card {
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--lv-lp-card-bg, #fff);
  border: 1px solid var(--lv-lp-border, rgba(15,23,42,0.08));
  box-shadow: var(--lv-lp-card-shadow);
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.15s ease;
}
.lv-ai-tier-card:hover {
  border-color: var(--lv-lp-border-strong, rgba(15,23,42,0.18));
}
.lv-ai-tier-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}
.lv-ai-chip {
  display: inline-flex;
  align-items: center;
  padding: 1.5px 7px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 600;
  background: var(--lv-lp-panel-bg, #f8fafc);
  border: 1px solid var(--lv-lp-border, rgba(15,23,42,0.08));
  color: var(--lv-lp-text-sub, #64748b);
  white-space: nowrap;
}
.lv-ai-chip.accent {
  background: var(--lv-lp-accent-soft, rgba(37,99,235,0.08));
  color: var(--lv-lp-accent, #2563eb);
  border-color: color-mix(in srgb, var(--lv-lp-accent, #2563eb) 25%, transparent);
}
.lv-ai-chip.success {
  background: rgba(16, 185, 129, 0.08);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.25);
}
.lv-ai-referrals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 8px;
  margin: 6px 0;
}
.lv-ai-referral-card {
  padding: 9px 11px;
  border-radius: 8px;
  background: var(--lv-lp-panel-bg, #f8fafc);
  border: 1px solid var(--lv-lp-border, rgba(15,23,42,0.08));
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 6px;
  transition: all 0.15s ease;
}
.lv-ai-referral-card.featured {
  border-color: rgba(16, 185, 129, 0.35);
  background: color-mix(in srgb, #10b981 6%, var(--lv-lp-card-bg, #fff));
  box-shadow: 0 2px 6px -1px rgba(16, 185, 129, 0.12);
}
.lv-ai-referral-card:hover {
  transform: translateY(-1px);
  border-color: var(--lv-lp-border-strong, rgba(15,23,42,0.18));
}
.lv-ai-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1.5px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
  border: 1px solid var(--lv-lp-border, rgba(15,23,42,0.1));
  background: var(--lv-lp-panel-bg, #f8fafc);
  color: var(--lv-lp-text-sub, #64748b);
  white-space: nowrap;
}
@media (max-width: 600px) {
  .lv-ai-referrals-grid { grid-template-columns: 1fr; }
  .lv-ai-waterfall-track { flex-wrap: wrap; }
}`,ce=/^(Requesting(?:\.{0,3}|…)|请求中(?:\.{0,3}|…)|AI\s*Requesting(?:\.{0,3}|…))$/i;function de(v){let g=v.window,d=v.document,q=v.localStorage,A=v.Date||globalThis.Date,N=v.fetch,U=v.setTimeout,B=v.clearTimeout,ze=v.setInterval,De=v.clearInterval,j=v.AbortController,C=v.MutationObserver,qe=v.CustomEvent,H=v.PROTOCOL_VERSION??200,w=v.escapeHtml,V=v.lvSurfaceStack,T=v.lvNotify,_=v.formatSyTimestamp,ue=v.lvKernelPost,X=v.resolveLvAiDestinationLabel;function Y(e){switch(e){case"socratic":return[{afterSec:0,text:"🔍 正在深入解析本题考点与题干脉络…",icon:"🔍"},{afterSec:3,text:"💡 正在审视思维推导路径，构思启发引导切入点…",icon:"💡"},{afterSec:8,text:"✍️ 正在组织单步启发式提问（引导自主推导，绝不剧透）…",icon:"✍️"},{afterSec:16,text:"✨ 正在润色语言与排版格式，马上就来…",icon:"✨"}];case"question-gen":return[{afterSec:0,text:"📖 正在阅读与理解笔记核心内容…",icon:"📖"},{afterSec:4,text:"🧩 正在提炼关键知识点与高频易错点…",icon:"🧩"},{afterSec:10,text:"📝 正在生成结构化题目与详细解析…",icon:"📝"},{afterSec:20,text:"✨ 正在校验格式完整性与严谨度…",icon:"✨"}];case"extract-contacts":return[{afterSec:0,text:"🔎 正在检索关系网络与近期互动上下文…",icon:"🔎"},{afterSec:4,text:"🤝 正在识别人脉实体、往来细节与待跟进事项…",icon:"🤝"},{afterSec:10,text:"📋 正在结构化整理人脉档案与提醒草稿…",icon:"📋"}];case"transform":return[{afterSec:0,text:"🧠 正在理解当前段落语义与风格要求…",icon:"🧠"},{afterSec:4,text:"✍️ 正在精修措辞并重构逻辑层次…",icon:"✍️"},{afterSec:12,text:"✨ 正在进行最终润色与 Markdown 校验…",icon:"✨"}];case"doc-judge":return[{afterSec:0,text:"📑 正在提取对比两篇文档的骨架与差异特征…",icon:"📑"},{afterSec:4,text:"⚖️ 正在深度比对语义重叠度与增量内容…",icon:"⚖️"},{afterSec:10,text:"🎯 正在生成稳健合并与去重处置建议…",icon:"🎯"}];default:return[{afterSec:0,text:"🧠 正在连接 AI 引擎并读取上下文…",icon:"🧠"},{afterSec:4,text:"💡 正在深度分析与推理中…",icon:"💡"},{afterSec:12,text:"✍️ 正在组织高质量回复内容…",icon:"✍️"},{afterSec:22,text:"⏳ 任务内容较丰富，仍在全力生成，可随时点击取消…",icon:"⏳"}]}}async function fe(e){let t=(a,o)=>o?.aborted?Promise.reject(new DOMException("The operation was aborted","AbortError")):a<=0?Promise.resolve():new Promise((r,l)=>{let p=()=>{B(u),l(new DOMException("The operation was aborted","AbortError"))},u=U(()=>{o?.removeEventListener("abort",p),r()},a);o?.addEventListener("abort",p,{once:!0})}),n=0,i=e.maxRetries??0;for(;;)try{let a=await N(e.targetUrl,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${e.apiKey}`},body:JSON.stringify({model:e.model,messages:e.messages,temperature:e.temperature,max_tokens:e.maxTokens}),signal:e.signal});if(a.status===429&&n<(e.maxRetries??2)){n++,await t(Math.pow(2,n)*1e3,e.signal);continue}if(!a.ok){let r=await a.text().catch(()=>"");throw new Error(`[LvAiGateway] HTTP ${a.status}: ${r}`)}let o=await a.json();return{content:o.choices?.[0]?.message?.content??"",model:o.model||e.model,totalTokens:o.usage?.total_tokens}}catch(a){if(a instanceof Error&&(a.name.includes("Abort")||e.signal?.aborted))throw a;if(n<i&&a instanceof Error){n++,await t(Math.pow(2,n)*1e3,e.signal);continue}throw a}}let $=()=>{v.ensureStyles?.(),v.injectChunkStyles?.("lv-kit-ai-hub",Ie)};$();async function Z(e,t,n=!1){if(t?.aborted)return"";if(!n)try{let i=typeof g<"u"?g.__LV_AI_HUB__:null;if(i&&typeof i.runTask=="function"){let a=await i.runTask({requestId:`nk-${A.now()}`,generationNonce:1,sourcePlugin:"lv-notice-kit",capability:"L3",taskType:"summary",promptId:"notice-advisor",promptVersion:1,context:{focusBlockContent:e},piiPolicy:"standard",allowFreePool:!1,signal:t||new j().signal}),o=Array.isArray(a?.blocks)?a.blocks.find(r=>r.type==="markdown"):null;if(o?.text)return String(o.text).trim()}}catch{}if(t?.aborted||typeof N!="function")return"";try{let i=await N("/api/ai/editor/chat",{method:"POST",headers:{"Content-Type":"application/json",Accept:"text/event-stream"},body:JSON.stringify({taskID:`lv-nk-${A.now()}`,ids:[],history:[],input:e,action:"chat"}),signal:t});if(t?.aborted)return"";if(i.status===404||i.status===405){let r=await ue("/api/ai/chat",{prompt:e});return r.code===0&&typeof r.data=="string"?r.data.trim():r.code===0&&r.data?.content?String(r.data.content).trim():""}if(!i.ok)return"";if((i.headers?.get?.("Content-Type")||"").includes("text/event-stream")&&i.body&&typeof i.body.getReader=="function"){let r=i.body.getReader(),l=new TextDecoder("utf-8"),p="",u="",b="";for(;;){let{done:y,value:m}=await r.read();if(y)break;p+=l.decode(m,{stream:!0});let s=p.split(/\r?\n/);p=s.pop()||"";for(let f of s){let c=f.trim();if(c.startsWith("event:"))u=c.slice(6).trim();else if(c.startsWith("data:"))try{let h=JSON.parse(c.slice(5).trim());(!u||u==="content")&&h?.token&&(b+=String(h.token))}catch{}}}return b.trim()}let o=typeof i.text=="function"?await i.text():"";if(!o)return"";try{let r=JSON.parse(o);if(r?.code===0&&typeof r.data=="string")return r.data.trim();if(r?.code===0&&r.data?.content)return String(r.data.content).trim()}catch{}return o.trim()}catch{return""}}let ge={heuristicJudge(e,t){let n=e.hpath.split("/").slice(0,-1).join("/"),i=t.hpath.split("/").slice(0,-1).join("/"),a=n===i&&e.box===t.box;if(e.length===0&&t.length>0)return{channel:"heuristic",similarityPercent:0,category:"shell-and-content",categoryLabel:"⚪ 空壳与实质内容",categoryBadgeColor:"var(--b3-theme-warning,#d97706)",keyDifferences:[`文档 A（${e.hpath}）为 0 字空占位文档`,`文档 B（${t.hpath}）包含 ${t.length} 字实体正文`],recommendation:"检测到文档 A 为误建的空壳占位文档，文档 B 含有完整正文。建议点击【采纳建议：清理空壳】。",suggestedAction:"keep-second",rawMarkdown:`### 1. 关系定性与相似度
- 定性：空壳与实体
- 相似度：0%

### 2. 核心信息差异
- 文档 A 为 0 字空壳，文档 B 含有完整正文。

### 3. 专家处置建议
- 建议保留文档 B 并清理文档 A。`};if(t.length===0&&e.length>0)return{channel:"heuristic",similarityPercent:0,category:"shell-and-content",categoryLabel:"⚪ 空壳与实质内容",categoryBadgeColor:"var(--b3-theme-warning,#d97706)",keyDifferences:[`文档 A（${e.hpath}）包含 ${e.length} 字实体正文`,`文档 B（${t.hpath}）为 0 字空占位文档`],recommendation:"检测到文档 B 为误建的空壳占位文档，文档 A 含有完整正文。建议点击【采纳建议：清理空壳】。",suggestedAction:"keep-first",rawMarkdown:`### 1. 关系定性与相似度
- 定性：空壳与实体
- 相似度：0%

### 2. 核心信息差异
- 文档 B 为 0 字空壳，文档 A 含有完整正文。

### 3. 专家处置建议
- 建议保留文档 A 并清理文档 B。`};if(!a){let o=Math.abs(e.length-t.length),r=Math.max(e.length,t.length,1),l=o/r,p=i.split("/").filter(Boolean),u=p[p.length-1],b=u?u.replace(/^\d+[-_.]\s*/,""):"副本",y=`${t.title} (${b})`;return{channel:"heuristic",similarityPercent:Math.max(5,Math.round((1-l)*45)),category:"independent-topic",categoryLabel:"🟢 独立主题文档 (偶然同名)",categoryBadgeColor:"var(--b3-theme-success,#059669)",keyDifferences:[`文档 A 位于分类路径「${n||"/"}」，字数 ${e.length}`,`文档 B 位于分类路径「${i||"/"}」，字数 ${t.length}`],recommendation:"两篇文档位于完全不同的分类路径下，属于独立业务主题。强烈建议【保留两者】；若担心混淆，可点击【采纳建议：区分改名】。",suggestedAction:"keep-both",suggestedRenameTitle:y,rawMarkdown:`### 1. 关系定性与相似度
- 定性：独立主题文档
- 相似度评估：低于 30%

### 2. 核心信息差异
- 位于不同知识库分支，业务范畴互不重叠。

### 3. 专家处置建议
- 建议：保留两者（请勿合并或删除），或点击区分改名。`}}return{channel:"heuristic",similarityPercent:85,category:"version-fork",categoryLabel:"⚠️ 疑似同目录分叉副本",categoryBadgeColor:"var(--b3-theme-error,#ef4444)",keyDifferences:[`两篇文档处于完全相同的父目录「${n||"/"}」`,`文档 A 更新于 ${_(e.updated)} (${e.length} 字)`,`文档 B 更新于 ${_(t.updated)} (${t.length} 字)`],recommendation:"两篇文档位于同一目录下，疑似多设备同步分叉或重复创建。建议点击【采纳建议：智能合并增量】，自动将副本新增段落追加至真身并归档副本。",suggestedAction:"merge-incremental",rawMarkdown:`### 1. 关系定性与相似度
- 定性：疑似版本分叉副本
- 相似度评估：约 85%

### 2. 核心信息差异
- 处于同一目录，可能系多端并发同步分叉。

### 3. 专家处置建议
- 建议用户点击【增量合并】保留双方新增内容，或保留更新时间较新的一份。`}},async judgeDocPair(e,t,n){if(n?.signal?.aborted)throw new Error("AI request aborted");try{let i=`你是一位知识库架构与数据治理专家。用户当前在思源笔记中发现两篇同名（或疑似冲突）的文档，需要你进行客观、专业的语义对账分析。

【文档 A】
- 标题：《${e.title}》
- 笔记本：${e.boxName||e.box}
- 存储路径：${e.hpath}
- 更新时间：${_(e.updated)}
- 字数：${e.length} 字
- 正文摘录：
${e.snippet||"(无正文/空文档)"}

【文档 B】
- 标题：《${t.title}》
- 笔记本：${t.boxName||t.box}
- 存储路径：${t.hpath}
- 更新时间：${_(t.updated)}
- 字数：${t.length} 字
- 正文摘录：
${t.snippet||"(无正文/空文档)"}

【重要原则】
1. 绝对严谨：重名不代表重复！如果两篇文档在不同分类目录且正文关注点不同，必须判定为“独立主题文档”，并建议“保留两者”，严防误删！
2. 若一方为 0 字空占位而另一方有实质内容，请判定为“空壳与实体”。
3. 若两篇在同一目录且正文相似但有增量，请判定为“版本分叉”，建议“增量合并”。
4. 严禁代替用户决策！如果建议区分改名，请给出【推荐新标题：XXX】。

请直接以清晰的 Markdown 结构输出以下 3 项（请勿输出开场白或多余废话）：
### 1. 关系定性与相似度
- 定性：[独立主题 / 空壳与实体 / 版本演进分叉 / 纯冗余副本]
- 相似度评估：[约 XX%]

### 2. 核心信息差异
- 文档 A 独有特征：...
- 文档 B 独有特征：...

### 3. 专家处置建议
- 建议：[保留两者 / 建议保留文档 A 并清理空壳 B / 建议增量合并等]
- 推荐新标题：[如需改名请填新标题，否则填无]
- 理由：...
`,a="",o="siyuan-ai",r=0,l,p=typeof g<"u"&&g.getSharedAiRouter?g.getSharedAiRouter():null;if(p){let u=await p.chat({messages:[{role:"user",content:i}],taskType:"chat",signal:n?.signal});if(n?.signal?.aborted)throw new Error("AI request aborted");u.ok&&u.content&&(a=u.content.trim(),o=u.provider,r=u.latencyMs,u.fallbackHistory&&u.fallbackHistory.length>0&&(l=u.fallbackHistory.map(b=>`${b.provider}: ${b.error}`).join(" ➔ ")))}else a=await Z(i,n?.signal);if(n?.signal?.aborted)throw new Error("AI request aborted");if(a&&a.length>20){let u="independent-topic",b="🟢 独立主题文档 (保留两者)",y="var(--b3-theme-success,#059669)",m="keep-both";/空壳|占位/i.test(a)?(u="shell-and-content",b="⚪ 空壳与实质内容",y="var(--b3-theme-warning,#d97706)",m=e.length===0?"keep-second":"keep-first"):/纯冗余|完全重复|多端重复/i.test(a)?(u="identical-duplicate",b="🔴 纯冗余副本",y="var(--b3-theme-error,#ef4444)",m="manual-review"):/分叉|版本/i.test(a)&&(u="version-fork",b="⚠️ 版本演进分叉",y="var(--b3-theme-warning,#d97706)",m="merge-incremental");let s=30,f=a.match(/(\d{1,3})%/);f&&f[1]&&(s=Number(f[1]));let c,h=a.match(/推荐新标题[：:]\s*([^\r\n]+)/);return h&&h[1]&&!/无|不改|原名/i.test(h[1])&&(c=h[1].replace(/[《》]/g,"").trim()),{channel:o,latencyMs:r,fallbackTrace:l,similarityPercent:s,category:u,categoryLabel:b,categoryBadgeColor:y,keyDifferences:[],recommendation:"AI 智能参谋已生成专业研判建议。请查看下方详情并选择一键采纳或手动处置。",suggestedAction:m,suggestedRenameTitle:c,rawMarkdown:a}}}catch(i){if(n?.signal?.aborted)throw i}if(n?.signal?.aborted)throw new Error("AI request aborted");return this.heuristicJudge(e,t)},judgeConflictPair(e){let t=e.title.replace(/\s*[\(_（](?:冲突|conflict)[^\)）]*[\)）]/gi,"").replace(/_conflict_\w+/gi,"").trim(),n=e.baseDocId?{id:e.baseDocId,title:e.baseDocTitle||t,length:e.baseDocLength||0,updated:e.baseDocUpdated||""}:null,i=`${t} (离线分叉-${(e.updated||"").slice(0,8)||"副本"})`;if(!n)return{recommendation:"全库未检索到对应的原件文档，可能原件已被重命名或移除。建议先点击【打开对比】查阅内容，或重命名为独立文档保留。",suggestedAction:"rename-conflict",suggestedTitle:i,details:["未匹配到同名基础文档","建议保留或人工排查"]};let a=(e.length||0)-n.length;return a>0?{recommendation:`冲突版本 (${e.length}字) 比原件 (${n.length}字) 多 ${a} 字！疑似移动端离线新增了实质内容。强烈建议点击【🔄 增量合并进原件】，将离线增量无损追加回原件！`,suggestedAction:"merge-incremental",suggestedTitle:i,details:[`冲突版字数：${e.length||0} 字`,`原件字数：${n.length} 字`,`更新时间：冲突版 ${_(e.updated)} vs 原件 ${_(n.updated)}`]}:e.length===0?{recommendation:"冲突版为 0 字空文档，原件保留有实质正文。可安全点击【🗑️ 清理冲突版】将其移入回收站。",suggestedAction:"keep-base",suggestedTitle:i,details:["冲突版为 0 字空文档","原件数据完整健康"]}:{recommendation:`冲突版与原件内容量接近 (差额 ${Math.abs(a)} 字)。建议点击【🔄 增量合并】自动保留双方新内容，或【✏️ 规范改名】消除冲突红标。`,suggestedAction:"merge-incremental",suggestedTitle:i,details:[`冲突版：${e.length||0} 字 · ${_(e.updated)}`,`原件：${n.length} 字 · ${_(n.updated)}`]}},judgeOrphanDailyNote(e){return e.isEmpty||(e.pendingBlocksCount||0)===0?{safeToMerge:!0,recommendation:"此日记为 0 字空占位壳文档，无任何实质记事流水。点击【🧹 清理空占位】可安全移入回收站，不会对您的主日记产生任何影响。",details:["孤立日记内无有效段落流水","主日记数据保持原样"]}:{safeToMerge:!0,recommendation:`此孤立日记中包含 ${e.pendingBlocksCount||1} 处记事流水（共 ${e.length} 字）。点击【🔄 一键合并】将采用增量幂等模式安全迁入主日记文末，主日记中已有记录将 100% 保留，绝不覆盖！`,details:[`待迁流水摘要：${e.snippet.slice(0,80)}…`,e.mainDocId?`对应主日记已存在 (${e.mainDocLength||0} 字)，合并后将追加于文末`:"对应主日记未初始化，合并时将自动创建","合并完成后孤立文档移入回收站，随时可撤销还原"]}}},be=[{id:"siliconflow",name:"硅基流动 (SiliconFlow)",shortName:"硅基流动",tagline:"国产高可用云端中转 · 极低门槛与丰富前沿模型",freeQuotaHint:"🎁 注册即送 2000 万 Token (¥14 额度)",costHint:"免费额度极充裕 · 赠额耗尽后极低成本 (约 ¥0.001/千字)",badgeText:"重点推荐",badgeColor:"#10b981",baseUrl:"https://api.siliconflow.cn/v1",defaultModel:"deepseek-ai/DeepSeek-V3",recommendedModels:["deepseek-ai/DeepSeek-V3","deepseek-ai/DeepSeek-R1","Qwen/Qwen2.5-7B-Instruct","THUDM/glm-4-9b-chat"],referralUrl:"https://cloud.siliconflow.cn/i/eFm443fW",officialUrl:"https://siliconflow.cn/",features:["注册即送 ¥14 / 2000万 Token 体验金","DeepSeek-V3 / R1 满血版极速直连","标准 OpenAI 协议无缝兼容","千兆骨干专线，平均延迟仅两三百毫秒"]},{id:"deepseek",name:"DeepSeek 官方开放平台",shortName:"DeepSeek",tagline:"开源之光 · 业界顶尖推理模型与极致性价比",freeQuotaHint:"新用户注册绑定即送 500 万 Token 体验包",costHint:"价格极度亲民 (输入仅 ¥1/M · 输出 ¥2/M)",badgeText:"旗舰推理",badgeColor:"#3b82f6",baseUrl:"https://api.deepseek.com/v1",defaultModel:"deepseek-chat",recommendedModels:["deepseek-chat","deepseek-reasoner"],referralUrl:"",officialUrl:"https://platform.deepseek.com/",features:["DeepSeek-V3 全能大模型","DeepSeek-R1 深度长思维链","命中上下文缓存享 1 折优惠","官方原生直连 API 端点"]},{id:"bailian",name:"阿里云百炼 (通义千问)",shortName:"阿里百炼",tagline:"企业级安全合规 · 阿里通义主力大模型集群",freeQuotaHint:"新开通百炼赠送千问主力模型 100~400 万免费 Token",costHint:"按量计费 · 阿里云基础设施稳定不丢包",badgeText:"企业级稳定",badgeColor:"#ff6a00",baseUrl:"https://dashscope.aliyuncs.com/compatible-mode/v1",defaultModel:"qwen-plus",recommendedModels:["qwen-plus","qwen-turbo","qwen-max"],referralUrl:"",officialUrl:"https://bailian.console.aliyun.com/",features:["阿里通义千问 2.5 旗舰集群","OpenAI 兼容模式一键接入","金融级安全合规与高可用保障","大厂 SLA 服务保证不掉线"]},{id:"zhipu",name:"智谱清言 (BigModel GLM)",shortName:"智谱清言",tagline:"清华自研基座 · 中文常识与语义结构化特化",freeQuotaHint:"新注册赠送 2500 万 Token 资源包",costHint:"GLM-4-Flash 个人开发者永久免费调用",badgeText:"中文特化",badgeColor:"#6366f1",baseUrl:"https://open.bigmodel.cn/api/paas/v4",defaultModel:"glm-4-flash",recommendedModels:["glm-4-flash","glm-4","glm-4-air"],referralUrl:"",officialUrl:"https://open.bigmodel.cn/",features:["GLM-4-Flash 个人永久免费","中文语境与知识结构化出色","支持 Function Calling / 深度拟题"]},{id:"moonshot",name:"月之暗面 Kimi (Moonshot)",shortName:"Kimi",tagline:"长文本理解先驱 · 超强长文摘要与考题拆解",freeQuotaHint:"新注册赠送 ¥15 开发者体验金",costHint:"长文本无损保持 · 阶梯式定价",badgeText:"长文专家",badgeColor:"#0ea5e9",baseUrl:"https://api.moonshot.cn/v1",defaultModel:"moonshot-v1-8k",recommendedModels:["moonshot-v1-8k","moonshot-v1-32k","moonshot-v1-128k"],referralUrl:"",officialUrl:"https://platform.moonshot.cn/",features:["长达 128k/200k 超长上下文窗口","复杂笔记与大纲无损保持记忆","语义细节检索极其精准"]},{id:"openrouter",name:"OpenRouter (全球模型聚合)",shortName:"OpenRouter",tagline:"一处配置 · 随心调用全球主流开源与商业大模型",freeQuotaHint:"内置数十款带有 :free 标签的永久 0 元开源模型",costHint:"按 Token 实际成本扣费 · 支持单 Key 路由多模型",badgeText:"全球聚合",badgeColor:"#8b5cf6",baseUrl:"https://openrouter.ai/api/v1",defaultModel:"meta-llama/llama-3.1-70b-instruct",recommendedModels:["meta-llama/llama-3.1-70b-instruct","google/gemini-flash-1.5","mistralai/mistral-7b-instruct:free"],referralUrl:"",officialUrl:"https://openrouter.ai/",features:["聚合 Claude/GPT-4o/Llama/Gemini 全球模型","数十款 :free 社区开源模型 0 元免充值","统一 OpenAI 标准格式请求"]},{id:"groq",name:"Groq (极速推理引擎)",shortName:"Groq",tagline:"专用 LPU 硬件芯片 · 体验每秒 500+ 字闪电响应",freeQuotaHint:"免费版提供充足的每分钟请求限制 (RPM/RPD)",costHint:"超高吞吐 · 拟题与打卡闪念几乎 0 延迟秒出",badgeText:"毫秒极速",badgeColor:"#f43f5e",baseUrl:"https://api.groq.com/openai/v1",defaultModel:"llama-3.3-70b-versatile",recommendedModels:["llama-3.3-70b-versatile","llama-3.1-8b-instant","mixtral-8x7b-32768"],referralUrl:"",officialUrl:"https://console.groq.com/",features:["专用 LPU 芯片架构，500+ Token/s","流式输出几近无感知延迟","免费配额充裕，适合高速高频拟题"]}];function ve(){return typeof g<"u"&&Array.isArray(g.AI_PROVIDER_REFERRALS)?g.AI_PROVIDER_REFERRALS:be}function me(e="auto"){let t=[{key:"siyuan",tier:"第 1 级",name:"思源智能体",icon:"🟢",initial:"未检测"},{key:"user_custom",tier:"第 2 级",name:"自配商用Key",icon:"🔵",initial:"未配置"},{key:"ollama",tier:"第 3 级",name:"本地Ollama",icon:"🟣",initial:"未检测"},{key:"public_free",tier:"第 4 级",name:"免密公用池",icon:"🌐",initial:"默认关闭"},{key:"rule_fallback",tier:"第 5 级",name:"离线规则",icon:"⚡",initial:"始终就绪"}],n="";return t.forEach((i,a)=>{let o=e===i.key;n+=`
          <div class="lv-ai-wf-node lv-ai-node-${i.key} ${o?"preferred":""}" data-provider="${i.key}">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:4px;">
              <span style="font-size:10px;font-weight:700;color:var(--lv-lp-accent,#2563eb);">${i.tier}</span>
              ${o?'<span style="font-size:9.5px;color:var(--lv-lp-accent,#2563eb);font-weight:600;">★首选</span>':""}
            </div>
            <div style="font-size:11.5px;font-weight:600;color:var(--lv-lp-text,#0f172a);display:flex;align-items:center;gap:3px;white-space:nowrap;">
              <span>${i.icon}</span>
              <span>${i.name}</span>
            </div>
            <span class="lv-ai-status-badge lv-ai-probe-${i.key}" style="font-size:9.5px;">${i.initial}</span>
          </div>
        `,a<t.length-1&&(n+='<div class="lv-ai-wf-arrow">➔</div>')}),`
      <div class="lv-ai-waterfall-card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:13px;">🌊</span>
            <strong style="font-size:12px;color:var(--lv-lp-text,#0f172a);">五级自适应降级链路</strong>
            <span style="font-size:10.5px;color:var(--lv-lp-text-sub,#64748b);">自动级联 · 0 秒等待 · 毫秒兜底</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="lv-ai-global-test-summary" style="font-size:10.5px;font-weight:600;color:var(--lv-lp-text-sub);"></span>
            <button type="button" class="lv-pop-sub-btn lv-ai-test-all-btn" style="padding:2px 8px;font-size:10.5px;font-weight:600;border-radius:6px;background:var(--lv-lp-accent-soft,rgba(37,99,235,0.08));color:var(--lv-lp-accent,#2563eb);border:1px solid var(--lv-lp-border,rgba(15,23,42,0.12));cursor:pointer;">🧪 一键全级测速</button>
          </div>
        </div>
        <div class="lv-ai-waterfall-track">
          ${n}
        </div>
      </div>
    `}function ye(){let e=ve(),t="";return e.forEach(n=>{let i=n.id==="siliconflow",a=!!(n.referralUrl&&n.referralUrl.trim().length>0);t+=`
          <div class="lv-ai-referral-card ${i?"featured":""}">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
              <strong style="font-size:12px;color:var(--lv-lp-text,#0f172a);">${w(n.name)}</strong>
              ${n.badgeText?`<span class="lv-ai-chip" style="font-size:9.5px;color:${n.badgeColor||"#2563eb"};border-color:color-mix(in srgb, ${n.badgeColor||"#2563eb"} 35%, transparent);">${w(n.badgeText)}</span>`:""}
            </div>
            <div style="font-size:11px;color:var(--lv-lp-text-sub,#64748b);line-height:1.4;">${w(n.tagline)}</div>
            <div style="font-size:11px;font-weight:600;color:#10b981;line-height:1.4;background:rgba(16,185,129,0.06);padding:3px 6px;border-radius:4px;border:1px dashed rgba(16,185,129,0.25);">
              ${w(n.freeQuotaHint)}
            </div>
            <div style="font-size:10.5px;color:var(--lv-lp-text-sub,#64748b);">${w(n.costHint)}</div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:4px;flex-wrap:wrap;">
              <button type="button" class="lv-pop-sub-btn lv-ai-fill-vendor-btn" data-base-url="${w(n.baseUrl)}" data-model="${w(n.defaultModel)}" data-vendor-name="${w(n.shortName)}" style="padding:2.5px 8px;font-size:10.5px;font-weight:600;color:var(--lv-lp-accent,#2563eb);background:var(--lv-lp-accent-soft,rgba(37,99,235,0.08));border:1px solid var(--lv-lp-border);border-radius:5px;cursor:pointer;">
                ⚡ 一键填入配置
              </button>
              ${a?`
                <button type="button" class="lv-pop-sub-btn lv-ai-open-referral-btn" data-url="${w(n.referralUrl||"")}" style="padding:2.5px 8px;font-size:10.5px;font-weight:600;color:#10b981;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:5px;cursor:pointer;">
                  🎁 领赠额 / 注册直达
                </button>
              `:""}
            </div>
          </div>
        `}),`
      <div style="margin-top:6px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:11.5px;font-weight:700;color:var(--lv-lp-text,#0f172a);">🌟 推荐主流服务商与免费赠额直达</span>
          <span style="font-size:10.5px;color:var(--lv-lp-text-sub,#64748b);">点击「一键填入」即可极速配置</span>
        </div>
        <div class="lv-ai-referrals-grid">
          ${t}
        </div>
      </div>
    `}function he(e,t=!1){let n=e.userCustom||{},i=e.ollama||{},a=e?.publicFree?.enabled===!0,o=!!(n.hasSecret||n.apiKey||typeof g<"u"&&g.hasTier2SecretConfigured?.()),r=o?"•••••••• (已安全存入思源密钥库，留空保持不变)":"sk-...";return`
      <div style="display:flex;flex-direction:column;gap:10px;">
        <!-- Card 1: 思源内置智能体 -->
        <div class="lv-ai-tier-card" data-tier="1">
          <div class="lv-ai-tier-header">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <strong style="font-size:12.5px;color:var(--lv-lp-text,#0f172a);">🟢 第 1 级 · 思源内置智能体</strong>
              <span class="lv-ai-chip">思源全局设置计费</span>
              <span class="lv-ai-chip">思源本地通道</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;">
              <span class="lv-ai-status-badge lv-ai-tier-badge-siyuan lv-ai-probe-siyuan">未检测</span>
              <button type="button" class="lv-pop-sub-btn lv-ai-test-tier-btn" data-provider="siyuan" style="padding:1.5px 7px;font-size:10px;">🧪 测速</button>
            </div>
          </div>
          <div style="font-size:11.5px;line-height:1.5;color:var(--lv-lp-text-sub,#64748b);">
            💡 <strong>说明</strong>：复用思源笔记「设置 ➔ AI」中的官方服务商或自定义配置。若您已在思源配置好大模型，小驴全家桶自动优先调用，无需重复填写。
          </div>
        </div>

        <!-- Card 2: 自配商用 API -->
        <div class="lv-ai-tier-card" data-tier="2">
          <div class="lv-ai-tier-header">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <strong style="font-size:12.5px;color:var(--lv-lp-text,#0f172a);">🔵 第 2 级 · 自配商用 API</strong>
              <span class="lv-ai-chip success">赠海量免费额度</span>
              <span class="lv-ai-chip accent">官方直连 · 安全加密保存</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;">
              <span class="lv-ai-status-badge lv-ai-tier-badge-user_custom lv-ai-probe-user_custom">${o?"密钥已配置":"未配置"}</span>
              <button type="button" class="lv-pop-sub-btn lv-ai-test-tier-btn" data-provider="user_custom" style="padding:1.5px 7px;font-size:10px;">🧪 测速</button>
            </div>
          </div>
          <div style="font-size:11.5px;line-height:1.5;color:var(--lv-lp-text-sub,#64748b);">
            💡 <strong>说明</strong>：直连云端大模型（支持 DeepSeek-V3/R1、Qwen2.5 等通用模型）。密钥通过思源官方加密凭据库保存，绝不以明文存入本地或页面。
          </div>
          ${ye()}
          <div style="display:flex;flex-direction:column;gap:6px;padding:8px 10px;border-radius:8px;background:var(--lv-lp-panel-bg,#f8fafc);border:1px solid var(--lv-lp-border,rgba(15,23,42,0.08));">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
              <span style="font-size:11.5px;color:var(--lv-lp-text,#0f172a);font-weight:600;">API 基础地址</span>
              <input type="text" class="lv-cfg-ai-custom-url lv-ai-custom-url-input b3-text-field" placeholder="https://api.siliconflow.cn/v1" value="${w(n.baseUrl||"")}" style="font-size:11px;padding:4px 8px;border-radius:6px;width:240px;background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,0.14));color:var(--lv-lp-text,#0f172a);" />
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
              <span style="font-size:11.5px;color:var(--lv-lp-text,#0f172a);font-weight:600;">API Key</span>
              <input type="password" class="lv-cfg-ai-custom-key lv-ai-custom-key-input b3-text-field" autocomplete="new-password" data-has-secret="${o?"true":"false"}" placeholder="${w(r)}" value="" style="font-size:11px;padding:4px 8px;border-radius:6px;width:240px;background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,0.14));color:var(--lv-lp-text,#0f172a);" />
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
              <span style="font-size:11.5px;color:var(--lv-lp-text,#0f172a);font-weight:600;">模型名称</span>
              <input type="text" class="lv-cfg-ai-custom-model lv-ai-custom-model-input b3-text-field" placeholder="deepseek-ai/DeepSeek-V3" value="${w(n.model||"")}" style="font-size:11px;padding:4px 8px;border-radius:6px;width:240px;background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,0.14));color:var(--lv-lp-text,#0f172a);" />
            </div>
          </div>
        </div>

        <!-- Card 3: 本地 Ollama 离线推理 -->
        <div class="lv-ai-tier-card" data-tier="3">
          <div class="lv-ai-tier-header">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <strong style="font-size:12.5px;color:var(--lv-lp-text,#0f172a);">🟣 第 3 级 · 本地 Ollama 离线推理</strong>
              <span class="lv-ai-chip success">0 元永久免费</span>
              <span class="lv-ai-chip">100% 数据不出设备</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;">
              <span class="lv-ai-status-badge lv-ai-tier-badge-ollama lv-ai-probe-ollama">未检测</span>
              <button type="button" class="lv-pop-sub-btn lv-ai-test-tier-btn" data-provider="ollama" style="padding:1.5px 7px;font-size:10px;">🧪 测速</button>
            </div>
          </div>
          <div style="font-size:11.5px;line-height:1.5;color:var(--lv-lp-text-sub,#64748b);">
            💡 <strong>说明</strong>：自动识别本地运行的 Ollama 服务。笔记与题库 100% 在本机显卡/CPU 计算，断网环境也能顺畅使用，无外网传输风险。推荐模型：<code>qwen2.5:7b</code> / <code>deepseek-r1:7b</code>。
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 10px;border-radius:8px;background:var(--lv-lp-panel-bg,#f8fafc);border:1px solid var(--lv-lp-border,rgba(15,23,42,0.08));flex-wrap:wrap;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:11.5px;color:var(--lv-lp-text,#0f172a);font-weight:600;">Ollama 服务地址</span>
              <button type="button" class="lv-pop-sub-btn lv-ai-open-link-btn" data-url="https://ollama.com" style="padding:1px 6px;font-size:10px;color:var(--lv-lp-accent,#2563eb);">访问 Ollama 官网 ↗</button>
            </div>
            <input type="text" class="lv-cfg-ai-ollama-url lv-ai-ollama-url-input b3-text-field" placeholder="http://127.0.0.1:11434" value="${w(i.baseUrl||"http://127.0.0.1:11434")}" style="font-size:11px;padding:4px 8px;border-radius:6px;width:240px;background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,0.14));color:var(--lv-lp-text,#0f172a);" />
          </div>
        </div>

        <!-- Card 4: 公开免密免费通道 -->
        <div class="lv-ai-tier-card" data-tier="4">
          <div class="lv-ai-tier-header">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <strong style="font-size:12.5px;color:var(--lv-lp-text,#0f172a);">🌐 第 4 级 · 公开免密免费通道 (默认关闭)</strong>
              <span class="lv-ai-chip success">0 元免密即用</span>
              <span class="lv-ai-chip accent">强制本地隐私脱敏</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;">
              <span class="lv-ai-status-badge lv-ai-tier-badge-public_free lv-ai-probe-public_free">${a?"已开启":"默认关闭"}</span>
              <button type="button" class="lv-pop-sub-btn lv-ai-test-tier-btn" data-provider="public_free" style="padding:1.5px 7px;font-size:10px;">🧪 测速</button>
            </div>
          </div>
          <div style="font-size:11.5px;line-height:1.5;color:var(--lv-lp-text-sub,#64748b);">
            💡 <strong>隐私与安全</strong>：默认处于关闭状态以防笔记内容意外外发；仅在您手动开启并确认提示后可用。🛡️ <strong>本地隐私保护自动生效</strong>：外发前在本地自动屏蔽人名、电话、邮箱、身份证与银行卡号。
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 10px;border-radius:8px;background:var(--lv-lp-panel-bg,#f8fafc);border:1px solid var(--lv-lp-border,rgba(15,23,42,0.08));">
            <label style="display:inline-flex;align-items:center;gap:7px;cursor:pointer;font-size:11.5px;font-weight:600;color:var(--lv-lp-text,#0f172a);user-select:none;">
              <input type="checkbox" class="lv-cfg-ai-public-free-toggle lv-ai-public-free-toggle" ${a?"checked":""} />
              <span>启用公开免密免费通道（需二次确认数据出域）</span>
            </label>
          </div>
        </div>

        <!-- Card 5: 本地轻量规则保底 -->
        <div class="lv-ai-tier-card" data-tier="5">
          <div class="lv-ai-tier-header">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <strong style="font-size:12.5px;color:var(--lv-lp-text,#0f172a);">⚡ 第 5 级 · 本地轻量规则离线保底</strong>
              <span class="lv-ai-chip">0 成本 · 0 延迟</span>
              <span class="lv-ai-chip">100% 纯本地运行</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;">
              <span class="lv-ai-status-badge lv-ai-tier-badge-rule_fallback lv-ai-probe-rule_fallback">始终就绪 (1ms)</span>
              <button type="button" class="lv-pop-sub-btn lv-ai-test-tier-btn" data-provider="rule_fallback" style="padding:1.5px 7px;font-size:10px;">🧪 测速</button>
            </div>
          </div>
          <div style="font-size:11.5px;line-height:1.5;color:var(--lv-lp-text-sub,#64748b);">
            💡 <strong>说明</strong>：内置纯本地规则分词与思考模板。当所有在线模型离线或未配置时仅提供离线参考初稿（不会冒充在线大模型结果）。
          </div>
        </div>
      </div>
    `}function I(e,t,n){e.querySelectorAll(`.lv-ai-probe-${t}, .lv-ai-tier-badge-${t}`).forEach(a=>{if(n.ok){let o=typeof n.latencyMs=="number"?n.latencyMs:0,r=n.statusText||`${o}ms`;a.textContent=`✓ ${r}`,a.style.color="#10b981",a.style.borderColor="rgba(16, 185, 129, 0.35)",a.style.background="rgba(16, 185, 129, 0.08)"}else{let o=n.statusText||n.error||"未配置/不可用";a.textContent=`○ ${o}`;let r=o.includes("未")||o.includes("已停用");a.style.color=r?"var(--lv-lp-text-sub,#64748b)":"#ef4444",a.style.borderColor=r?"var(--lv-lp-border,rgba(15,23,42,0.12))":"rgba(239, 68, 68, 0.35)",a.style.background=r?"var(--lv-lp-panel-bg,#f8fafc)":"rgba(239, 68, 68, 0.06)"}})}function ee(e,t,n){if(typeof d>"u"||!d.body){t();return}let i=typeof X=="function"?X(n||{channel:"public_free",endpoint:"https://text.pollinations.ai"}):{kind:"public_free",label:"免密公用池",hostname:"text.pollinations.ai",origin:"https://text.pollinations.ai"};try{d.getElementById("lv-ai-tier4-confirm-mask")?.remove()}catch{}let a=d.createElement("div");a.id="lv-ai-tier4-confirm-mask",a.setAttribute("data-expected-origin",i.origin||""),a.style.cssText="position:fixed;inset:0;z-index:100020;background:rgba(15,23,42,0.45);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;",a.innerHTML=`
      <div style="width:min(92vw,420px);background:var(--b3-theme-surface,#fff);color:var(--b3-theme-on-surface,#0f172a);border:1px solid var(--b3-theme-surface-lighter,rgba(15,23,42,0.14));border-radius:14px;padding:18px 20px;box-shadow:0 24px 60px rgba(15,23,42,0.3);display:flex;flex-direction:column;gap:12px;">
        <div style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:8px;">
          <span>🌐</span><span>确认开启公开免密免费通道？</span>
        </div>
        <div style="font-size:12px;padding:6px 10px;border-radius:8px;background:var(--b3-theme-background,#f8fafc);border:1px solid var(--b3-border-color,rgba(128,128,128,0.2));color:var(--b3-theme-on-surface,#222);">
          <strong>真实目标去向：</strong><span class="lv-ai-dest-label">${w(i.label)}</span>${i.origin?` <span style="opacity:0.7;">(${w(i.origin)})</span>`:""}
        </div>
        <div style="font-size:12.5px;line-height:1.6;color:var(--b3-theme-on-surface-light,#475569);">
          开启后，当思源智能体、自填密钥与本地 Ollama 均不可用时，请求内容将在本地自动屏蔽敏感隐私信息后外发至上述锁定目标接口（已绑定来源域名防止临时漂移）。请勿在涉密或敏感文档场景下开启。
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:4px;">
          <button type="button" class="lv-tier4-cancel-btn b3-button b3-button--outline" style="padding:6px 14px;border-radius:8px;cursor:pointer;">取消（保持关闭）</button>
          <button type="button" class="lv-tier4-confirm-btn b3-button" style="padding:6px 14px;border-radius:8px;background:var(--b3-theme-primary,#2563eb);color:#fff;border:none;cursor:pointer;font-weight:600;">确认外发并开启</button>
        </div>
      </div>
    `;let o=r=>{try{a.remove()}catch{}r?e({destinationLabel:i.label,expectedOrigin:i.origin||""}):t()};a.querySelector(".lv-tier4-cancel-btn")?.addEventListener("click",()=>o(!1)),a.querySelector(".lv-tier4-confirm-btn")?.addEventListener("click",()=>o(!0)),a.addEventListener("click",r=>{r.target===a&&o(!1)}),d.body.appendChild(a)}function xe(e,t,n){let i=()=>{t?.();let a=e.querySelector(".lv-cfg-ai-pref-provider, .lv-ai-pref-provider-select")?.value||"auto";e.querySelectorAll(".lv-ai-wf-node").forEach(o=>{let r=o.getAttribute("data-provider");o.classList.toggle("preferred",r===a)}),n?.("✓ AI 调度配置已更新")};e.querySelectorAll("input, select").forEach(a=>{if(a.classList?.contains("lv-cfg-ai-public-free-toggle")||a.classList?.contains("lv-ai-public-free-toggle")){a.addEventListener("change",()=>{let o=a,r=e.querySelector(".lv-ai-tier-badge-public_free, .lv-ai-probe-public_free");o.checked?(o.checked=!1,ee(()=>{o.checked=!0,r&&(r.textContent="已开启",r.style.color="#10b981"),i()},()=>{o.checked=!1,r&&(r.textContent="默认关闭",r.style.color="")})):(r&&(r.textContent="默认关闭",r.style.color=""),i())});return}a.addEventListener("change",i)}),e.querySelectorAll(".lv-ai-fill-vendor-btn").forEach(a=>{a.addEventListener("click",o=>{o.preventDefault(),o.stopPropagation();let r=a.getAttribute("data-base-url")||"",l=a.getAttribute("data-model")||"",p=a.getAttribute("data-vendor-name")||"推荐厂商",u=e.querySelector(".lv-cfg-ai-custom-url, .lv-ai-custom-url-input"),b=e.querySelector(".lv-cfg-ai-custom-model, .lv-ai-custom-model-input"),y=e.querySelector(".lv-cfg-ai-custom-key, .lv-ai-custom-key-input");u&&(u.value=r),b&&(b.value=l),y&&y.focus(),i();let m=`✓ 已填入 ${p} 接口与模型配置，请填入您的 API Key`;n?n(m):typeof T<"u"&&typeof T.capsule=="function"&&T.capsule({source:"AI 调度中枢",message:m,duration:3e3,level:"success",archive:!1})})}),e.querySelectorAll(".lv-ai-open-referral-btn, .lv-ai-open-link-btn").forEach(a=>{a.addEventListener("click",o=>{o.preventDefault(),o.stopPropagation();let r=a.getAttribute("data-url");if(!r)return;let l=!1;try{let p=null;if(typeof g<"u"&&g.require)try{p=g.require("electron")}catch{}let u=p?.shell||(g?.require?g.require("electron")?.shell:null);u&&typeof u.openExternal=="function"&&(u.openExternal(r).catch(()=>{typeof g<"u"&&g.open(r,"_blank","noopener,noreferrer")}),l=!0)}catch{}if(!l&&typeof g<"u")try{g.open(r,"_blank","noopener,noreferrer")}catch{}typeof T<"u"&&typeof T.capsule=="function"&&T.capsule({source:"AI 调度中枢",message:"✓ 正在呼起默认浏览器直达平台…",duration:3e3,level:"info",archive:!1})})}),e.querySelectorAll(".lv-ai-test-all-btn").forEach(a=>{a.addEventListener("click",async o=>{o.preventDefault(),o.stopPropagation(),a.disabled=!0,a.textContent="⏳ 测速中...";let r=e.querySelector(".lv-ai-global-test-summary");r&&(r.textContent="并发测速 5 级通道...");let l=typeof g<"u"&&g.getSharedAiRouter?g.getSharedAiRouter():null;if(!l){a.disabled=!1,a.textContent="🧪 一键全级测速",r&&(r.textContent="未检测到调度中枢");return}try{let p=typeof l.testAllTiers=="function"?await l.testAllTiers():{siyuan:await l.testChannel("siyuan"),user_custom:await l.testChannel("user_custom"),ollama:await l.testChannel("ollama"),public_free:await l.testChannel("public_free"),rule_fallback:await l.testChannel("rule_fallback")};a.disabled=!1,a.textContent="🧪 重新全级测速";let u=0;for(let[b,y]of Object.entries(p))y&&y.ok&&u++,I(e,b,y);r&&(r.textContent=`✓ 5 级探测完毕：${u} 级就绪`,r.style.color=u>=2?"#10b981":"#f59e0b")}catch(p){a.disabled=!1,a.textContent="🧪 重新全级测速",r&&(r.textContent=`✗ 探测异常: ${p?.message||String(p)}`,r.style.color="#ef4444")}})}),e.querySelectorAll(".lv-ai-test-tier-btn").forEach(a=>{a.addEventListener("click",async o=>{o.preventDefault(),o.stopPropagation();let r=a.getAttribute("data-provider");if(!r)return;a.disabled=!0,a.textContent="⏳ 测速...";let l=typeof g<"u"&&g.getSharedAiRouter?g.getSharedAiRouter():null;if(!l){a.disabled=!1,a.textContent="🧪 测速";return}try{let p;r==="siyuan"&&typeof l.probeTier1=="function"?p=await l.probeTier1():r==="user_custom"&&typeof l.probeTier2=="function"?p=await l.probeTier2():r==="ollama"&&typeof l.probeTier3=="function"?p=await l.probeTier3():r==="public_free"&&typeof l.probeTier4=="function"?p=await l.probeTier4():r==="rule_fallback"&&typeof l.probeTier5=="function"?p=l.probeTier5():p=await l.testChannel(r),a.disabled=!1,a.textContent="🧪 测速",I(e,r,p)}catch(p){a.disabled=!1,a.textContent="🧪 测速",I(e,r,{ok:!1,error:p?.message||String(p),statusText:"异常"})}})})}function W(e){if(!e||e.isConnected===!1)return!1;if(typeof d<"u"&&d.body){let t=e;for(let n=0;t&&n<64;n++){if(t===d.body||t===d.documentElement)return!0;t=t.parentElement}return!1}return e.isConnected===!0}let O=null;function te(e){if(!e)return!1;try{if(e.classList?.contains?.("protyle-wysiwyg")||e.classList?.contains?.("protyle-attr")||e.getAttribute?.("contenteditable")==="true"||typeof e.closest=="function"&&e.closest('.protyle-wysiwyg, .protyle-attr, [contenteditable="true"]'))return!0;let t=e.parentElement,n=0;for(;t&&n<64;){if(t.classList?.contains?.("protyle-wysiwyg")||t.classList?.contains?.("protyle-attr")||t.getAttribute?.("contenteditable")==="true")return!0;t=t.parentElement,n++}}catch{}return!1}function ne(e){if(!e||e.isConnected===!1)return!1;try{if(typeof d<"u"&&d.body){let t=e,n=0,i=!1;for(;t&&n<64;){if(t.isConnected===!1||t.classList?.contains?.("fn__none")||typeof t.hasAttribute=="function"&&t.hasAttribute("hidden")||t.style?.display==="none"||t.style?.visibility==="hidden"||t.classList?.contains?.("protyle-wysiwyg")||t.classList?.contains?.("protyle-attr")||t.getAttribute?.("contenteditable")==="true")return!1;if(t===d.body){i=!0;break}t=t.parentElement,n++}if(!i)return!1}if(typeof g<"u"&&typeof g.getComputedStyle=="function"){let t=g.getComputedStyle(e);if(t&&(t.display==="none"||t.visibility==="hidden"))return!1}return!0}catch{return!1}}function ke(){if(typeof d>"u")return[];let e=[];try{if(typeof d.querySelectorAll=="function"){let t=d.querySelectorAll(".lv-ai-thinking");for(let n=0;n<t.length;n++){let i=t[n];i&&ne(i)&&e.push(i)}}else if(typeof d.querySelector=="function"){let t=d.querySelector(".lv-ai-thinking");ne(t)&&e.push(t)}}catch{}return e}function re(e){if(!e||e.nodeType!==1)return!1;try{if(typeof d<"u"&&d.body&&e.parentElement!==d.body&&e.parentNode!==d.body||e.id&&e.id.startsWith("lv-")||typeof e.hasAttribute=="function"&&e.hasAttribute("data-lv-ui")||e.classList?.contains?.("lv-ai-wait-mask")||e.classList?.contains?.("lv-qw-mask"))return!1;let t=e.id==="progress",n=!!e.classList?.contains?.("b3-dialog");return!t&&!n||te(e)||typeof e.querySelector=="function"&&e.querySelector('.protyle-wysiwyg, .protyle-attr, [contenteditable="true"]')?!1:t?n||!!(typeof e.querySelector=="function"&&(e.querySelector(".b3-dialog__loading")||e.querySelector('[data-type="message"]'))):!!(typeof e.querySelector=="function"&&e.querySelector(".b3-dialog__loading")&&e.querySelector(".b3-dialog__scrim--progress"))}catch{return!1}}function we(e){if(!re(e))return!1;try{if(typeof e.hasAttribute=="function"&&e.hasAttribute("data-reindex-progress")||e.classList?.contains?.("sync-checkout__panel"))return!1;if(typeof e.querySelector=="function"){if(e.querySelector("[data-reindex-progress]")||e.querySelector(".sync-checkout__panel"))return!1;let t=e.querySelector('[data-type="message"]'),n=String(t?.textContent||"").trim();if(n)return ce.test(n);let i=e.querySelector(".b3-dialog__loading"),a=String(i?.textContent||"").trim();return ce.test(a)}}catch{}return!1}function R(e){let t=typeof g<"u"?g:null,n=t?t.__LV_AI_PROGRESS_SUPPRESSOR__:O;if(n&&(!e||typeof n.version=="number"&&n.version>=H))return n;if(!e)return null;let i=0,a=0,o;if(n&&(typeof n.version!="number"||n.version<H)){n._supportsDelegation&&(i=n.refCount,a=n.activeAiCount,o=n.mountedCardReclaimers);try{n.teardown()}catch{}}let r={version:H,_supportsDelegation:!0,refCount:i,activeAiCount:a,bodyObs:null,progressObsMap:new WeakMap,observedProgressEls:new Set,thinkingParentObsMap:new Map,suppressedEls:new Set,savedStyles:new WeakMap,mountedCardReclaimers:o||new Map,sync:()=>{},teardown:()=>{}};n&&n._supportsDelegation&&(n._supersededBy=r);let l=s=>{try{if(s.getAttribute?.("data-lv-suppressed-progress")!=="1"){let f=s.style,c={display:typeof f?.getPropertyValue=="function"?String(f.getPropertyValue("display")||""):String(f?.display||""),displayPriority:typeof f?.getPropertyPriority=="function"?String(f.getPropertyPriority("display")||""):"",pointerEvents:typeof f?.getPropertyValue=="function"?String(f.getPropertyValue("pointer-events")||""):String(f?.pointerEvents||""),pointerEventsPriority:typeof f?.getPropertyPriority=="function"?String(f.getPropertyPriority("pointer-events")||""):""};r.savedStyles.set(s,c),s.setAttribute?.("data-lv-suppressed-progress","1"),r.suppressedEls.add(s)}s.style&&(typeof s.style.setProperty=="function"?(s.style.setProperty("display","none","important"),s.style.setProperty("pointer-events","none","important")):(s.style.display="none",s.style.pointerEvents="none"))}catch{}},p=s=>{try{if(!(s.getAttribute?.("data-lv-suppressed-progress")==="1"||r.suppressedEls.has(s)))return;s.removeAttribute?.("data-lv-suppressed-progress");let c=r.savedStyles.get(s);s.style&&(typeof s.style.setProperty=="function"?(c?.display?s.style.setProperty("display",c.display,c.displayPriority||""):s.style.removeProperty?.("display"),c?.pointerEvents?s.style.setProperty("pointer-events",c.pointerEvents,c.pointerEventsPriority||""):s.style.removeProperty?.("pointer-events")):(s.style.display=c?.display||"",s.style.pointerEvents=c?.pointerEvents||"")),r.savedStyles.delete(s),r.suppressedEls.delete(s)}catch{}},u=s=>{if(!(r.observedProgressEls.has(s)||typeof C!="function"))try{let f=new C(()=>{r.sync()});f.observe(s,{childList:!0,subtree:!0,characterData:!0,attributes:!0,attributeFilter:["data-reindex-progress","class"]}),r.progressObsMap.set(s,f),r.observedProgressEls.add(s)}catch{}},b=s=>{try{let f=r.progressObsMap.get(s);if(f){try{f.disconnect()}catch{}r.progressObsMap.delete(s)}r.observedProgressEls.delete(s)}catch{}},y=s=>{let f=new Map;if(r.suppressedEls.size>0&&typeof C=="function"&&typeof d<"u"&&d.body)for(let c of s){let h=c,x=0;for(;h&&h!==d.body&&x<32;)te(h)||f.set(h,{childList:!0}),h=h.parentElement,x++}for(let[c,h]of r.thinkingParentObsMap.entries())if(!f.has(c)){try{h.disconnect()}catch{}r.thinkingParentObsMap.delete(c)}for(let[c,h]of f.entries())if(!r.thinkingParentObsMap.has(c))try{let x=new C(()=>{r.sync()});x.observe(c,{childList:h.childList,subtree:!1,attributes:!0,attributeFilter:["style","class","hidden"]}),r.thinkingParentObsMap.set(c,x)}catch{}},m=!1;return r.sync=()=>{if(!m)try{if(r.mountedCardReclaimers&&r.mountedCardReclaimers.size>0){let x=A.now();for(let[S,E]of Array.from(r.mountedCardReclaimers.entries()))if(W(S)){E.wasConnected=!0;let L=E.onConnect;L&&(E.onConnect=void 0,L())}else if(E.wasConnected||E.mountedAt!==void 0&&x-E.mountedAt>3e4){r.mountedCardReclaimers.delete(S);try{E.reclaim()}catch{}}if(m)return}if(typeof d>"u"||!d.body){for(let x of Array.from(r.suppressedEls))p(x);y([]);return}for(let x of Array.from(r.observedProgressEls))(x.isConnected===!1||x.parentElement!==d.body&&x.parentNode!==d.body)&&(b(x),p(x));let s=ke(),f=r.activeAiCount>0||s.length>0,c=new Set,h=d.body.children;if(h&&typeof h.length=="number")for(let x=0;x<h.length;x++){let S=h[x];!S||!re(S)||(c.add(S),u(S),f&&we(S)?l(S):p(S))}for(let x of Array.from(r.suppressedEls))c.has(x)||p(x);y(s)}catch{}},r.teardown=()=>{m=!0;for(let s of Array.from(r.suppressedEls))p(s);if(r.bodyObs){try{r.bodyObs.disconnect()}catch{}r.bodyObs=null}for(let s of Array.from(r.observedProgressEls))b(s);for(let s of r.thinkingParentObsMap.values())try{s.disconnect()}catch{}r.thinkingParentObsMap.clear(),t&&t.__LV_AI_PROGRESS_SUPPRESSOR__===r&&delete t.__LV_AI_PROGRESS_SUPPRESSOR__,O===r&&(O=null)},t?t.__LV_AI_PROGRESS_SUPPRESSOR__=r:O=r,r}function M(){R(!1)?.sync()}function K(){if(typeof d>"u"||!d.body)return()=>{};let e=R(!0);if(!e)return()=>{};if(e.refCount+=1,!e.bodyObs&&typeof C=="function")try{e.bodyObs=new C(()=>{e.sync()}),e.bodyObs.observe(d.body,{childList:!0,subtree:!1})}catch{e.bodyObs=null}e.sync();let t=!1;return()=>{if(t)return;t=!0;let n=e;for(;n._supersededBy;)n=n._supersededBy;n.refCount=Math.max(0,n.refCount-1),n.refCount<=0&&n.activeAiCount<=0?n.teardown():n.sync()}}function ae(){let e=K(),t=R(!1);t&&(t.activeAiCount+=1,t.sync());let n=!1;return()=>{if(!n){if(n=!0,t){let i=t;for(;i._supersededBy;)i=i._supersededBy;i.activeAiCount=Math.max(0,i.activeAiCount-1)}e()}}}function ie(e={}){$();let t=e.skipSuppressor?null:K(),n=!1,i=()=>{if(!n){n=!0;try{t?.()}catch{}}},a=e.stages&&e.stages.length>0?e.stages.slice().sort((m,s)=>m.afterSec-s.afterSec):Y(e.scenario||"general"),o=0,r=null,l=!1,p=m=>{let s=a[0]||{afterSec:0,text:"正在思考…",icon:e.defaultIcon||"✨"};for(let f of a)if(m>=f.afterSec)s=f;else break;return{text:s.text,icon:s.icon||e.defaultIcon||"✨"}},u=p(0),b=()=>{l||(o+=1,u=p(o),e.onUpdate?.({elapsedSec:o,stageText:u.text,stageIcon:u.icon,busy:!0}),l||(r=U(b,1e3)))};return r=U(b,1e3),{getElapsedSec:()=>o,getStageText:()=>u.text,getStageIcon:()=>u.icon,getState:()=>({elapsedSec:o,stageText:u.text,stageIcon:u.icon,busy:!l}),stop:()=>{l=!0,r&&B(r),r=null,i()},dispose:()=>{l=!0,r&&B(r),r=null,i()},renderThinkingCardHtml:m=>{let s=m?.title?`<div class="lv-ai-thinking__title">${w(m.title)}</div>`:"",f=m?.cancelBtnId||"lv-ai-thinking-cancel-btn",c=m?.cancelLabel?`<button type="button" class="b3-button b3-button--cancel lv-ai-thinking__cancel" id="${f}">${w(m.cancelLabel)}</button>`:"";return[`<div class="lv-ai-thinking ${m?.extraClass||""}" role="status" aria-live="polite">`,s,'  <div class="lv-ai-thinking__glow">',`    <span class="lv-ai-thinking__icon">${u.icon}</span>`,"  </div>",`  <div class="lv-ai-thinking__stage">${w(u.text)}</div>`,`  <div class="lv-ai-thinking__timer">已思考 <b>${o}</b> 秒</div>`,'  <div class="lv-ai-thinking__progress"><div class="lv-ai-thinking__bar"></div></div>',c,"</div>"].join(`
`)}}}let Se=0;function Ae(){if(typeof j<"u")return new j;let e=new Set,t={aborted:!1,reason:void 0,addEventListener(n,i){typeof i=="function"&&e.add(i)},removeEventListener(n,i){e.delete(i)},dispatchEvent(){return!0},onabort:null,throwIfAborted(){if(t.aborted)throw t.reason??new Error("Aborted")}};return{signal:t,abort(n){if(!t.aborted&&(t.aborted=!0,t.reason=n,e.forEach(i=>{try{i()}catch{}}),typeof t.onabort=="function"))try{t.onabort()}catch{}}}}function z(e){if(e)try{typeof e.remove=="function"?e.remove():e.parentNode&&typeof e.parentNode.removeChild=="function"&&e.parentNode.removeChild(e)}catch{}}function P(e,t={}){$();let n=Ae(),i=!1,a=!1,o=null,r=null,l=null,p=null,u=null,b=null,y=null,m=null,s=null,f=()=>{if(t.signal)try{t.signal.removeEventListener("abort",h)}catch{}},c=ie({scenario:t.scenario,stages:t.stages,defaultIcon:t.defaultIcon,skipSuppressor:!0,onUpdate:k=>{a||i||(b&&(b.textContent=r??k.stageIcon),y&&(y.textContent=o??k.stageText),m&&(m.innerHTML=`已思考 <b>${k.elapsedSec}</b> 秒`))},onCancel:t.onCancel}),h=()=>{if(!(i||a)){i=!0,c.stop();try{n.abort(t.signal?.reason??new DOMException("Aborted","AbortError"))}catch{n.abort()}L()}},x=null,S=!1,E=()=>{a||i||S||x||t.signal?.aborted||!l||!W(l)||(S=!0,x=ae())},L=()=>{if(x){let k=x;x=null,k()}else M()};if(t.signal)if(t.signal.aborted){i=!0,c.stop();try{n.abort(t.signal.reason??new DOMException("Aborted","AbortError"))}catch{n.abort()}}else try{t.signal.addEventListener("abort",h,{once:!0})}catch{}let F=()=>{if(!(i||a)){i=!0,c.stop(),f();try{n.abort(new DOMException("User cancelled","AbortError"))}catch{n.abort()}try{t.onCancel?.()}catch{}L()}};if(!e||typeof d>"u"||typeof d.createElement!="function")return c.dispose(),{update(){},done(){a=!0,f(),c.dispose()},destroy(){a=!0,f(),c.dispose()},cancel:F,get signal(){return n.signal},get aborted(){return n.signal.aborted},get element(){return null},tracker:c};l=d.createElement("div"),l.className=["lv-ai-thinking",t.compact?"lv-ai-thinking--compact":"",t.extraClass||""].filter(Boolean).join(" "),l.setAttribute("role","status"),l.setAttribute("aria-live","polite"),t.title&&(p=d.createElement("div"),p.className="lv-ai-thinking__title",p.textContent=t.title,l.appendChild(p)),t.subtitle&&(u=d.createElement("div"),u.className="lv-ai-thinking__subtitle",u.textContent=t.subtitle,l.appendChild(u));let G=d.createElement("div");G.className="lv-ai-thinking__glow",b=d.createElement("span"),b.className="lv-ai-thinking__icon",b.textContent=c.getStageIcon(),G.appendChild(b),l.appendChild(G),y=d.createElement("div"),y.className="lv-ai-thinking__stage",y.textContent=c.getStageText(),l.appendChild(y),m=d.createElement("div"),m.className="lv-ai-thinking__timer",m.innerHTML=`已思考 <b>${c.getElapsedSec()}</b> 秒`,l.appendChild(m);let J=d.createElement("div");J.className="lv-ai-thinking__progress";let se=d.createElement("div");if(se.className="lv-ai-thinking__bar",J.appendChild(se),l.appendChild(J),t.cancelLabel!==!1&&(s=d.createElement("button"),s.type="button",s.id=`lv-ai-thinking-cancel-${++Se}`,s.className="b3-button b3-button--cancel lv-ai-thinking__cancel",s.textContent=t.cancelLabel||"⏹ 取消生成",s.addEventListener("click",k=>{try{k.stopPropagation?.()}catch{}F()}),l.appendChild(s)),t.replaceContent!==!1)try{e.innerHTML=""}catch{}e.appendChild(l),E();let D=R(!1),oe=()=>{l&&D?.mountedCardReclaimers&&D.mountedCardReclaimers.delete(l)},_e=()=>{a||(a=!0,oe(),f(),c.dispose(),z(l),l=null,L())},Le=k=>{a||(a=!0,oe(),f(),c.dispose(),k?.keepDom||(z(l),l=null),L())};return D?.mountedCardReclaimers&&l&&D.mountedCardReclaimers.set(l,{wasConnected:W(l),mountedAt:A.now(),onConnect:E,reclaim:()=>{a||(a=!0,f(),c.dispose(),l=null,L())}}),M(),{update:k=>{if(!(a||!l)){if(k.title!==void 0){if(!p)if(p=d.createElement("div"),p.className="lv-ai-thinking__title",l.children[0])try{l.insertBefore?.(p,l.children[0])}catch{l.appendChild(p)}else l.appendChild(p);p.textContent=k.title}k.subtitle!==void 0&&(u||(u=d.createElement("div"),u.className="lv-ai-thinking__subtitle",l.appendChild(u)),u.textContent=k.subtitle),k.stageText!==void 0&&(o=k.stageText||null,y&&(y.textContent=o??c.getStageText())),k.stageIcon!==void 0&&(r=k.stageIcon||null,b&&(b.textContent=r??c.getStageIcon())),k.cancelLabel!==void 0&&s&&(s.textContent=k.cancelLabel)}},done:Le,destroy:_e,cancel:F,get signal(){return n.signal},get aborted(){return n.signal.aborted},get element(){return l},tracker:c}}function le(e={}){$();let t=e.id||"lv-ai-wait-overlay-mask";if(typeof d>"u"||!d.body||typeof d.createElement!="function")return{...P(null,e),get mask(){return null}};try{let c=typeof d.getElementById=="function"?d.getElementById(t):null;z(c),V.pop(t)}catch{}if(e.signal?.aborted)return{...P(null,e),get mask(){return null}};let n=d.createElement("div");n.id=t,n.className="lv-ai-wait-mask",n.setAttribute("role","dialog"),n.setAttribute("aria-modal","true"),n.setAttribute("aria-label",e.title||"AI 正在处理");let i=d.createElement("div");i.className="lv-ai-wait-card";let a=d.createElement("div");a.className="lv-ai-wait-card__body",i.appendChild(a),n.appendChild(i);let o=!1,r=!1,l=null,p=e.signal,u=null,b=()=>{if(!r){r=!0;try{e.onCancel?.()}catch{}}},y=()=>{s(),u?.destroy(),b()},m=()=>{if(p){try{p.removeEventListener("abort",y)}catch{}p=void 0}},s=()=>{if(!o){if(o=!0,m(),l){try{l()}catch{}l=null}try{V.pop(t)}catch{}z(n),M()}};d.body.appendChild(n);let f=P(a,{scenario:e.scenario,stages:e.stages,defaultIcon:e.defaultIcon,title:e.title,subtitle:e.subtitle,cancelLabel:e.cancelLabel===!1?!1:e.cancelLabel||"⏹ 取消生成",extraClass:e.extraClass,signal:e.signal,onCancel:()=>{s(),b()},replaceContent:!0});if(u=f,e.showCloseButton!==!1){let c=d.createElement("button");c.type="button",c.className="lv-ai-wait-card__close",c.setAttribute("aria-label","取消并关闭"),c.setAttribute("title","取消 (Esc)"),c.textContent="✕",c.addEventListener("click",h=>{try{h.stopPropagation?.()}catch{}f.cancel(),s()}),i.appendChild(c)}e.closeOnMaskClick===!0&&n.addEventListener("click",c=>{c.target===n&&(f.cancel(),s())});try{l=V.push({id:t,dismiss:()=>e.closeOnEsc===!1?"keep":(f.cancel(),s(),!0)})}catch{}if(M(),p)if(p.aborted)y();else try{p.addEventListener("abort",y,{once:!0})}catch{}return f.aborted&&(s(),f.destroy()),{update:f.update,done:c=>{f.done(c),s()},destroy:()=>{f.destroy(),s()},cancel:()=>{f.cancel(),s()},get signal(){return f.signal},get aborted(){return f.aborted},get element(){return f.element},get mask(){return o?null:n},tracker:f.tracker}}async function Ee(e,t){let n=e?.container?P(e.container,e):le(e);try{return await t(n.signal,n)}finally{n.done()}}return{version:H,lvEditorChatFallback:Z,executeAiChatRequest:fe,getLvAiPresetStages:Y,lvAiJudge:ge,buildAiWaterfallFlowchartHtml:me,buildAiTierCardsHtml:he,attachAiHubEventListeners:xe,updateTierStatusBadge:I,openTier4OutboundConfirmModal:ee,installLvAiProgressSuppressor:K,syncLvAiProgressSuppression:M,beginLvAiWaitSession:ae,createLvAiProgressTracker:ie,mountLvAiThinkingCard:P,openLvAiWaitOverlay:le,withLvAiWait:Ee}}var pe={protocol:200,init:de};try{if(typeof window<"u"){let v=window;v.__LV_KIT_CHUNKS__||(v.__LV_KIT_CHUNKS__={}),v.__LV_KIT_CHUNKS__["lv-kit-ai-hub"]=pe}}catch{}var Oe=pe;return $e(Re);})();
;(function(e){var d=e&&e.default?e.default:e;if(!d)return;var g=typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:null);if(g){g.__LV_KIT_CHUNKS__=g.__LV_KIT_CHUNKS__||{};g.__LV_KIT_CHUNKS__["lv-kit-ai-hub"]=d;}if(typeof module==="object"&&module&&typeof module.exports==="object"){module.exports=d;}})(typeof __LV_KIT_CHUNK_EXPORT__!=="undefined"?__LV_KIT_CHUNK_EXPORT__:undefined);
